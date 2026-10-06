import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function formatWalletShort(addr?: string | null) {
  if (!addr) return '—';
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * GET /api/leaderboard/global?limit=100
 * Get global XP leaderboard (Top Genies)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');

    const players = await prisma.player.findMany({
      orderBy: {
        xp: 'desc',
      },
      take: Math.min(limit, 1000),
      select: {
        walletAddress: true,
        xp: true,
        sessionsPlayed: true,
        createdAt: true,
        _count: {
          select: {
            achievements: true,
          },
        },
      },
    });

    const formatted = players.map((player, index) => ({
      rank: index + 1,
      wallet: player.walletAddress,
      walletShort: formatWalletShort(player.walletAddress),
      xp: player.xp,
      level: Math.floor(player.xp / 100) + 1,
      sessionsPlayed: player.sessionsPlayed,
      achievements: player._count.achievements,
      joinedAt: player.createdAt.toISOString(),
    }));

    return NextResponse.json(
      {
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
    console.error('Error fetching global leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch global leaderboard' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
