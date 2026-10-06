import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function formatWalletShort(addr?: string | null) {
  if (!addr) return '—';
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * GET /api/leaderboard?gameId=flappy&limit=100
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
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
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
      walletShort: formatWalletShort(entry.walletAddress),
      score: entry.score,
      duration: entry.duration,
      xp: entry.player.xp,
      sessionsPlayed: entry.player.sessionsPlayed,
      achievedAt: entry.createdAt.toISOString(),
    }));

    return NextResponse.json(
      {
        gameId,
        total: formatted.length,
        leaderboard: formatted,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60',
        },
      }
    );

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
