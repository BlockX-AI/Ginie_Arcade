import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateScore, checkRateLimit } from '@/lib/antiCheat';
import { signGameResult, gameSlugToId, rewardTypeToId } from '@/lib/signer';
import { mintBadgeNFT, mintScoreNFT, isMintingAvailable } from '@/lib/nftMinter';
import { BADGE_DEFS } from '@/lib/badges';

/**
 * POST /api/submitScore
 * Submit and validate game score
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, wallet, gameId, score, duration } = body;

    console.log('[submitScore] Request body:', { sessionId, wallet, gameId, score, duration });

    // Validate input
    if (!sessionId || !wallet || score === undefined || !duration) {
      console.log('[submitScore] Missing required fields:', { sessionId: !!sessionId, wallet: !!wallet, score, duration });
      return NextResponse.json(
        { error: 'Missing required fields', received: { sessionId: !!sessionId, wallet: !!wallet, score, duration } },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(wallet + ':submit', 30, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

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
        const rewardAmount = reward?.xp || 0;

        signature = await signGameResult(
          session.nonce,
          wallet,
          gameId,
          score,
          rewardAmount,
        );
      } catch (signError) {
        console.warn('[submitScore] Signing failed (BACKEND_SIGNER_KEY may not be configured):', signError);
        // Score and achievement are still recorded off-chain, just no on-chain claim
      }
    }

    // Check and mint badge NFTs (non-blocking)
    const newBadges = await checkAndMintBadges(wallet, gameId);

    // Mint score NFT ONLY on new high score (prevent wallet spam)
    let scoreNFT: Awaited<ReturnType<typeof mintScoreNFT>> = null;
    let mintStatus: string = 'skipped_not_highscore';
    const isNewHighScore = !existingEntry || (existingEntry && score > existingEntry.score);

    if (score > 0 && isNewHighScore) {
      if (isMintingAvailable()) {
        scoreNFT = await mintScoreNFT(wallet, gameId, score);
        mintStatus = scoreNFT ? (scoreNFT.alreadyMinted ? 'already_minted' : 'success') : 'failed';
      } else {
        mintStatus = 'unavailable';
      }
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
      scoreNFT: scoreNFT ? { txHash: scoreNFT.txHash, tokenId: scoreNFT.tokenId, mint: scoreNFT.mint } : null,
      mintStatus,
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
        const result = await mintBadgeNFT(wallet, badge.id);

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
