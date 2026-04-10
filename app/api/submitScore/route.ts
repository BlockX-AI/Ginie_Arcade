import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateScore, checkRateLimit } from '@/lib/antiCheat';
import { signGameResult, gameSlugToId, rewardTypeToId } from '@/lib/signer';
import { mintBadgeNFT, mintScoreNFT, isMintingAvailable } from '@/lib/nftMinter';
import { getBadgeTokenURI } from '@/lib/badgeTokenURIs';
import { isDbAvailable, memSessions, memScores } from '@/lib/memoryStore';
import { isAddress } from 'viem';
import { z } from 'zod';
import { isSupportedGameId } from '@/lib/games';

const submitScoreSchema = z.object({
  sessionId: z.string().trim().uuid(),
  wallet: z
    .string()
    .trim()
    .refine((value) => isAddress(value), { message: 'Invalid wallet address' }),
  gameId: z
    .string()
    .trim()
    .min(1)
    .refine((value) => isSupportedGameId(value), { message: 'Unsupported gameId' }),
  score: z.coerce.number().int().min(0),
  duration: z.coerce.number().int().positive(),
});

/**
 * POST /api/submitScore
 * Submit and validate game score
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = submitScoreSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.issues.map((issue) => issue.message) },
        { status: 400 }
      );
    }

    const { sessionId, wallet, gameId, score, duration } = parsed.data;

    // Check rate limit
    if (!checkRateLimit(wallet + ':submit', 30, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // ── In-memory fallback (no DATABASE_URL configured) ──────────────────────
    if (!isDbAvailable()) {
      const memSession = memSessions.get(sessionId);
      if (!memSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      if (memSession.walletAddress !== wallet) {
        return NextResponse.json({ error: 'Session wallet mismatch' }, { status: 403 });
      }
      if (memSession.endedAt) {
        return NextResponse.json({ success: true, alreadyEnded: true, valid: true, score: memSession.score, duration: memSession.duration, reward: null, newBadges: [], scoreNFT: null });
      }
      // Mark ended in memory
      memSession.endedAt = new Date();
      memSession.score = score;
      memSession.duration = duration;
      const resolvedGameId = gameId ?? memSession.gameId;
      // Track best score
      const key = `${wallet}:${resolvedGameId}`;
      const prev = memScores.get(key) || 0;
      const isNewHighScore = score > prev;
      if (isNewHighScore) memScores.set(key, score);
      const baseXp = Math.max(10, score * 10);

      // Check reward eligibility (same rules as DB path)
      const memRewardRules: Record<string, Array<{ type: string; minScore: number; xp: number }>> = {
        'flappy': [
          { type: 'FLAPPY_ROOKIE', minScore: 10, xp: 50 },
          { type: 'PIPE_MASTER', minScore: 50, xp: 200 },
        ],
        'sudoku': [
          { type: 'PUZZLE_SOLVER', minScore: 500, xp: 100 },
          { type: 'LOGIC_MASTER', minScore: 1000, xp: 300 },
        ],
        'match-three': [
          { type: 'MATCH_ROOKIE', minScore: 50, xp: 50 },
          { type: 'MATCH_MASTER', minScore: 200, xp: 200 },
          { type: 'GEM_LEGEND', minScore: 500, xp: 500 },
        ],
        'zombie-apocalypse': [
          { type: 'ZOMBIE_HUNTER', minScore: 10, xp: 50 },
          { type: 'ZOMBIE_SLAYER', minScore: 100, xp: 200 },
        ],
        '8ball-pool': [
          { type: 'POOL_ROOKIE', minScore: 500, xp: 100 },
          { type: 'BILLIARD_PRO', minScore: 2000, xp: 300 },
        ],
      };
      let memReward: { type: string; rewardId: string; xp: number; signature: string | null; nonce: string } | null = null;
      const rules = memRewardRules[resolvedGameId];
      if (rules) {
        for (const rule of rules) {
          if (score >= rule.minScore) {
            let signature: string | null = null;
            try {
              const gid = gameSlugToId(resolvedGameId);
              const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '43113');
              signature = await signGameResult(memSession.nonce, wallet, gid, score, chainId);
            } catch { /* signer key not set */ }
            memReward = { type: rule.type, rewardId: rewardTypeToId(rule.type), xp: rule.xp, signature, nonce: memSession.nonce };
          }
        }
      }

      // Attempt score NFT mint (if env vars configured)
      const GAME_NAMES_MEM: Record<string, string> = {
        'flappy': 'Flappy Bird', 'sudoku': 'Sudoku', 'snake-io': 'Snake.io',
        'match-three': 'Match-Three Puzzle', 'zombie-apocalypse': 'Zombie Apocalypse', '8ball-pool': '8 Ball Pool',
      };
      let scoreNFT: { txHash: string; tokenId: number } | null = null;
      const mintAttempted = isMintingAvailable() && score > 0 && isNewHighScore;
      if (mintAttempted) {
        scoreNFT = await mintScoreNFT(wallet, resolvedGameId, GAME_NAMES_MEM[resolvedGameId] || resolvedGameId, score, duration);
      }

      return NextResponse.json({
        success: true,
        valid: true,
        score,
        duration,
        xpEarned: baseXp + (memReward?.xp || 0),
        reward: memReward ? { type: memReward.type, rewardId: memReward.rewardId, xp: memReward.xp, signature: memReward.signature, nonce: memReward.nonce } : null,
        newBadges: [],
        scoreNFT: scoreNFT ? { txHash: scoreNFT.txHash, tokenId: scoreNFT.tokenId } : null,
        mintAttempted,
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Find session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify session belongs to wallet
    if (session.walletAddress !== wallet) {
      return NextResponse.json(
        { error: 'Session wallet mismatch' },
        { status: 403 }
      );
    }

    // Check session not already ended
    if (session.endedAt) {
      return NextResponse.json({
        success: true,
        alreadyEnded: true,
        valid: session.valid,
        score: session.score,
        duration: session.duration,
        reward: null,
        newBadges: [],
        scoreNFT: null,
      });
    }

    // Validate score with anti-cheat
    console.log('[submitScore] Validating score:', { gameId, score, duration, startedAt: session.startedAt });
    const validation = validateScore(gameId, score, duration, session.startedAt);
    console.log('[submitScore] Validation result:', validation);

    if (!validation.valid) {
      console.log('[submitScore] Anti-cheat failed:', validation.reason);
      // Mark session as invalid
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          valid: false,
          endedAt: new Date(),
          score,
          duration,
        },
      });

      return NextResponse.json(
        {
          error: `Anti-cheat validation failed: ${validation.reason}`,
          code: 'ANTI_CHEAT',
          valid: false,
          reason: validation.reason,
        },
        { status: 422 }
      );
    }

    // Update session
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        score,
        duration,
        valid: true,
      },
    });

    // Update player stats — award base XP scaled by score
    const baseXp = Math.max(10, score * 10);
    await prisma.player.update({
      where: { walletAddress: wallet },
      data: {
        sessionsPlayed: { increment: 1 },
        xp: { increment: baseXp },
      },
    });

    // Update leaderboard (only if new score is higher)
    const existingEntry = await prisma.leaderboard.findUnique({
      where: {
        gameId_walletAddress: {
          gameId,
          walletAddress: wallet,
        },
      },
    });

    if (!existingEntry) {
      await prisma.leaderboard.create({
        data: {
          gameId,
          walletAddress: wallet,
          score,
          duration,
        },
      });
    } else if (score > existingEntry.score) {
      await prisma.leaderboard.update({
        where: {
          gameId_walletAddress: {
            gameId,
            walletAddress: wallet,
          },
        },
        data: {
          score,
          duration,
        },
      });
    }

    // Update quests
    await updateQuestProgress(wallet, gameId, score);

    // Check for reward eligibility
    const reward = await checkRewardEligibility(wallet, gameId, score);

    let signature: string | null = null;

    if (reward) {
      // Record achievement in DB to prevent duplicate rewards
      await prisma.achievement.create({
        data: {
          walletAddress: wallet,
          gameId,
          type: reward.type,
          rewardId: reward.rewardId,
          score,
        },
      });

      // Sync off-chain XP with on-chain reward XP
      await prisma.player.update({
        where: { walletAddress: wallet },
        data: {
          xp: { increment: reward.xp },
        },
      });

      // Try to sign the result for on-chain reward (may fail if signer key is not set)
      try {
        const gameIdBytes32 = gameSlugToId(gameId);
        const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '43113');

        signature = await signGameResult(
          session.nonce,
          wallet,
          gameIdBytes32,
          score,
          chainId
        );
      } catch (signError) {
        console.warn('[submitScore] Signing failed (BACKEND_SIGNER_KEY may not be configured):', signError);
        // Score and achievement are still recorded off-chain, just no on-chain claim
      }
    }

    // Check and mint badge NFTs (non-blocking)
    const newBadges = await checkAndMintBadges(wallet, gameId);

    // Mint score NFT ONLY on new high score (prevent wallet spam)
    const GAME_NAMES: Record<string, string> = {
      'flappy': 'Flappy Bird',
      'sudoku': 'Sudoku: Neural Grid',
      'snake-io': 'Snake.io',
      'match-three': 'Match-Three Puzzle',
      'zombie-apocalypse': 'Zombie Apocalypse',
      '8ball-pool': '8 Ball Pool',
    };
    let scoreNFT: { txHash: string; tokenId: number } | null = null;
    const isNewHighScore = !existingEntry || (existingEntry && score > existingEntry.score);
    const mintAttempted = isMintingAvailable() && score > 0 && isNewHighScore;
    if (mintAttempted) {
      scoreNFT = await mintScoreNFT(wallet, gameId, GAME_NAMES[gameId] || gameId, score, duration);
    }

    return NextResponse.json({
      success: true,
      valid: true,
      score,
      duration,
      xpEarned: baseXp + (reward?.xp || 0),
      reward: reward ? {
        type: reward.type,
        rewardId: reward.rewardId,
        xp: reward.xp,
        signature,
        nonce: session.nonce,
      } : null,
      newBadges,
      scoreNFT: scoreNFT ? { txHash: scoreNFT.txHash, tokenId: scoreNFT.tokenId } : null,
      mintAttempted,
    });

  } catch (error) {
    console.error('Error submitting score:', error);
    return NextResponse.json(
      { error: 'Failed to submit score' },
      { status: 500 }
    );
  }
}

/**
 * Update quest progress
 */
async function updateQuestProgress(wallet: string, gameId: string, score: number) {
  // Get active quests
  const quests = await prisma.quest.findMany({
    where: { active: true },
  });

  for (const quest of quests) {
    // Check if player already completed this quest
    const playerQuest = await prisma.playerQuest.findUnique({
      where: {
        walletAddress_questId: {
          walletAddress: wallet,
          questId: quest.id,
        },
      },
    });

    if (playerQuest?.completed) continue;

    // Update progress based on quest type
    if (quest.requirementType === 'play_games') {
      await prisma.playerQuest.upsert({
        where: {
          walletAddress_questId: {
            walletAddress: wallet,
            questId: quest.id,
          },
        },
        create: {
          walletAddress: wallet,
          questId: quest.id,
          progress: 1,
        },
        update: {
          progress: { increment: 1 },
        },
      });

      // Check if completed
      const updated = await prisma.playerQuest.findUnique({
        where: {
          walletAddress_questId: {
            walletAddress: wallet,
            questId: quest.id,
          },
        },
      });

      if (updated && updated.progress >= quest.requirementValue && !updated.completed) {
        await prisma.playerQuest.update({
          where: {
            walletAddress_questId: {
              walletAddress: wallet,
              questId: quest.id,
            },
          },
          data: {
            completed: true,
            completedAt: new Date(),
          },
        });

        // Award XP
        await prisma.player.update({
          where: { walletAddress: wallet },
          data: {
            xp: { increment: quest.xpReward },
          },
        });
      }
    }

    if (quest.requirementType === 'reach_score') {
      if (score >= quest.requirementValue) {
        await prisma.playerQuest.upsert({
          where: {
            walletAddress_questId: {
              walletAddress: wallet,
              questId: quest.id,
            },
          },
          create: {
            walletAddress: wallet,
            questId: quest.id,
            progress: quest.requirementValue,
            completed: true,
            completedAt: new Date(),
          },
          update: {
            progress: quest.requirementValue,
            completed: true,
            completedAt: new Date(),
          },
        });

        // Award XP
        await prisma.player.update({
          where: { walletAddress: wallet },
          data: {
            xp: { increment: quest.xpReward },
          },
        });
      }
    }
  }
}

/**
 * Check if player should receive an on-chain reward
 */
async function checkRewardEligibility(wallet: string, gameId: string, score: number) {
  // Define reward rules
  const rewardRules: Record<string, Array<{ type: string; minScore: number; xp: number }>> = {
    'flappy': [
      { type: 'FLAPPY_ROOKIE', minScore: 10, xp: 50 },
      { type: 'PIPE_MASTER', minScore: 50, xp: 200 },
    ],
    'sudoku': [
      { type: 'PUZZLE_SOLVER', minScore: 500, xp: 100 },
      { type: 'LOGIC_MASTER', minScore: 1000, xp: 300 },
      { type: 'NEURAL_GENIUS', minScore: 1500, xp: 500 },
    ],
    'zombie-apocalypse': [
      { type: 'ZOMBIE_HUNTER', minScore: 10, xp: 50 },
      { type: 'ZOMBIE_SLAYER', minScore: 100, xp: 200 },
      { type: 'APOCALYPSE_SURVIVOR', minScore: 300, xp: 500 },
    ],
    '8ball-pool': [
      { type: 'POOL_ROOKIE', minScore: 500, xp: 100 },
      { type: 'BILLIARD_PRO', minScore: 2000, xp: 300 },
      { type: 'POOL_CHAMPION', minScore: 5000, xp: 750 },
    ],
  };

  const rules = rewardRules[gameId];
  if (!rules) return null;

  // Check each reward rule
  for (const rule of rules) {
    if (score >= rule.minScore) {
      // Check if player already has this achievement
      const existing = await prisma.achievement.findFirst({
        where: {
          walletAddress: wallet,
          gameId,
          type: rule.type,
        },
      });

      if (!existing) {
        // Player is eligible for this reward
        return {
          type: rule.type,
          rewardId: rewardTypeToId(rule.type),
          xp: rule.xp,
        };
      }
    }
  }

  return null;
}

/**
 * Badge definitions (mirrors playerStats computeBadges)
 */
const BADGE_DEFS = [
  { id: 'first-game', name: 'First Steps', description: 'Play your first game', tier: 'bronze', category: 'session', check: (s: number, _x: number, _h: Record<string, number>) => s >= 1, value: 1 },
  { id: 'five-games', name: 'Getting Warmed Up', description: 'Play 5 games', tier: 'bronze', category: 'session', check: (s: number) => s >= 5, value: 5 },
  { id: 'ten-games', name: 'Arcade Regular', description: 'Play 10 games', tier: 'silver', category: 'session', check: (s: number) => s >= 10, value: 10 },
  { id: 'twenty-five-games', name: 'Arcade Veteran', description: 'Play 25 games', tier: 'gold', category: 'session', check: (s: number) => s >= 25, value: 25 },
  { id: 'fifty-games', name: 'Arcade Legend', description: 'Play 50 games', tier: 'platinum', category: 'session', check: (s: number) => s >= 50, value: 50 },
  { id: 'xp-100', name: 'XP Hunter', description: 'Earn 100 XP', tier: 'bronze', category: 'xp', check: (_s: number, x: number) => x >= 100, value: 100 },
  { id: 'xp-500', name: 'XP Warrior', description: 'Earn 500 XP', tier: 'silver', category: 'xp', check: (_s: number, x: number) => x >= 500, value: 500 },
  { id: 'xp-1000', name: 'XP Master', description: 'Earn 1,000 XP', tier: 'gold', category: 'xp', check: (_s: number, x: number) => x >= 1000, value: 1000 },
  { id: 'flappy-10', name: 'Pipe Dodger', description: 'Score 10+ in Flappy Bird', tier: 'bronze', category: 'flappy', check: (_s: number, _x: number, h: Record<string, number>) => (h['flappy'] || 0) >= 10, value: 10 },
  { id: 'flappy-50', name: 'Flappy Master', description: 'Score 50+ in Flappy Bird', tier: 'gold', category: 'flappy', check: (_s: number, _x: number, h: Record<string, number>) => (h['flappy'] || 0) >= 50, value: 50 },
  { id: 'sudoku-500', name: 'Puzzle Solver', description: 'Score 500+ in Sudoku: Roast Mode', tier: 'bronze', category: 'sudoku', check: (_s: number, _x: number, h: Record<string, number>) => (h['sudoku'] || 0) >= 500, value: 500 },
  { id: 'sudoku-1500', name: 'Roast Survivor', description: 'Score 1,500+ in Sudoku: Roast Mode', tier: 'gold', category: 'sudoku', check: (_s: number, _x: number, h: Record<string, number>) => (h['sudoku'] || 0) >= 1500, value: 1500 },
  { id: 'snake-50', name: 'Snake Hatchling', description: 'Reach length 50 in Snake.io', tier: 'bronze', category: 'snake', check: (_s: number, _x: number, h: Record<string, number>) => (h['snake-io'] || 0) >= 50, value: 50 },
  { id: 'snake-100', name: 'Serpent Slayer', description: 'Reach length 100 in Snake.io', tier: 'silver', category: 'snake', check: (_s: number, _x: number, h: Record<string, number>) => (h['snake-io'] || 0) >= 100, value: 100 },
  { id: 'snake-200', name: 'Viper King', description: 'Reach length 200 in Snake.io', tier: 'gold', category: 'snake', check: (_s: number, _x: number, h: Record<string, number>) => (h['snake-io'] || 0) >= 200, value: 200 },
  { id: 'snake-500', name: 'Anaconda Legend', description: 'Reach length 500 in Snake.io', tier: 'platinum', category: 'snake', check: (_s: number, _x: number, h: Record<string, number>) => (h['snake-io'] || 0) >= 500, value: 500 },
  { id: 'all-rounder', name: 'All-Rounder', description: 'Play all games', tier: 'silver', category: 'multi', check: (_s: number, _x: number, h: Record<string, number>) => Object.keys(h).length >= 3, value: 3 },
];

/**
 * Check for newly earned badges and mint them as NFTs
 */
async function checkAndMintBadges(wallet: string, _gameId: string) {
  try {
    // Get current player stats
    const player = await prisma.player.findUnique({ where: { walletAddress: wallet } });
    if (!player) return [];

    // Get high scores
    const leaderboard = await prisma.leaderboard.findMany({ where: { walletAddress: wallet } });
    const highScores: Record<string, number> = {};
    leaderboard.forEach((e) => { highScores[e.gameId] = e.score; });

    // Get already-minted badges
    const mintedBadges = await prisma.achievement.findMany({
      where: { walletAddress: wallet, gameId: 'badge' },
    });
    const mintedSet = new Set(mintedBadges.map((a) => a.type));

    // Find newly earned badges
    const newBadges: { id: string; name: string; tier: string; txHash?: string }[] = [];

    for (const badge of BADGE_DEFS) {
      if (mintedSet.has(badge.id)) continue; // already minted
      if (!badge.check(player.sessionsPlayed, player.xp, highScores)) continue; // not earned yet

      console.log(`[badges] New badge earned: ${badge.id} for ${wallet}`);

      // Record in DB first (even before mint succeeds, to prevent duplicates)
      const achievement = await prisma.achievement.create({
        data: {
          walletAddress: wallet,
          gameId: 'badge',
          type: badge.id,
          rewardId: badge.id,
          score: badge.value,
        },
      });

      // Attempt NFT mint
      if (isMintingAvailable()) {
        const tokenURI = getBadgeTokenURI(badge.id, badge.name, badge.description, badge.tier);
        const result = await mintBadgeNFT(wallet, badge.id, badge.category, tokenURI, badge.value);

        if (result) {
          // Update achievement with tx hash
          await prisma.achievement.update({
            where: { id: achievement.id },
            data: { txHash: result.txHash },
          });
          newBadges.push({ id: badge.id, name: badge.name, tier: badge.tier, txHash: result.txHash });
        } else {
          newBadges.push({ id: badge.id, name: badge.name, tier: badge.tier });
        }
      } else {
        newBadges.push({ id: badge.id, name: badge.name, tier: badge.tier });
      }
    }

    return newBadges;
  } catch (err) {
    console.error('[badges] Error checking/minting badges:', err);
    return [];
  }
}
