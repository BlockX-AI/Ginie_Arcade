import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/leaderboard?gameId=neon-sky-runner&limit=100
 * Get leaderboard for a game
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gameId = searchParams.get('gameId');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!gameId) {
      return NextResponse.json(
        { error: 'Missing gameId parameter' },
        { status: 400 }
      );
    }

    const leaderboard = await prisma.leaderboard.findMany({
      where: { gameId },
      orderBy: {
        score: 'desc',
      },
      take: Math.min(limit, 1000),
      select: {
        walletAddress: true,
        score: true,
        duration: true,
        createdAt: true,
        player: {
          select: {
            xp: true,
            sessionsPlayed: true,
          },
        },
      },
    });

    // Format response
    const formatted = leaderboard.map((entry, index) => ({
      rank: index + 1,
      wallet: entry.walletAddress,
      walletShort: `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`,
      score: entry.score,
      duration: entry.duration,
      xp: entry.player.xp,
      sessionsPlayed: entry.player.sessionsPlayed,
      achievedAt: entry.createdAt.toISOString(),
    }));

    return NextResponse.json({
      gameId,
      total: formatted.length,
      leaderboard: formatted,
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
