import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validateScore, checkRateLimit } from '@/lib/antiCheat';
import { signGameResult, gameSlugToId, rewardTypeToId } from '@/lib/signer';

/**
 * POST /api/submitScore
 * Submit and validate game score
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, wallet, gameId, score, duration } = body;

    // Validate input
    if (!sessionId || !wallet || !gameId || score === undefined || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
      return NextResponse.json(
        { error: 'Session already ended' },
        { status: 400 }
      );
    }

    // Validate score with anti-cheat
    const validation = validateScore(gameId, score, duration, session.startedAt);
    
    if (!validation.valid) {
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
        { error: `Anti-cheat validation failed: ${validation.reason}`, valid: false },
        { status: 400 }
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

    // Update player stats
    await prisma.player.update({
      where: { walletAddress: wallet },
      data: {
        sessionsPlayed: { increment: 1 },
      },
    });

    // Update leaderboard
    await prisma.leaderboard.upsert({
      where: {
        gameId_walletAddress: {
          gameId,
          walletAddress: wallet,
        },
      },
      create: {
        gameId,
        walletAddress: wallet,
        score,
        duration,
      },
      update: {
        score: {
          set: score, // Only update if new score is higher (checked in query)
        },
        duration: {
          set: duration,
        },
      },
    });

    // Update quests
    await updateQuestProgress(wallet, gameId, score);

    // Check for reward eligibility
    const reward = await checkRewardEligibility(wallet, gameId, score);

    let signature: string | null = null;
    
    if (reward) {
      // Sign the result for on-chain reward
      const gameIdBytes32 = gameSlugToId(gameId);
      const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '43113');
      
      signature = await signGameResult(
        session.nonce,
        wallet,
        gameIdBytes32,
        score,
        chainId
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      score,
      duration,
      reward: reward ? {
        type: reward.type,
        rewardId: reward.rewardId,
        xp: reward.xp,
        signature,
        nonce: session.nonce,
      } : null,
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
    'neon-sky-runner': [
      { type: 'NEON_BADGE', minScore: 2000, xp: 100 },
      { type: 'SKY_MASTER', minScore: 5000, xp: 250 },
    ],
    'tilenova': [
      { type: 'CIRCUIT_TROPHY', minScore: 5000, xp: 150 },
      { type: 'QUANTUM_MASTER', minScore: 10000, xp: 300 },
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
