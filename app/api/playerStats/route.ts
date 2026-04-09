import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isDbAvailable } from '@/lib/memoryStore';

const walletRe = /^0x[a-fA-F0-9]{40}$/;

/**
 * GET /api/playerStats?wallet=0x...
 * Fetch player stats from off-chain DB
 */
export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    if (!walletRe.test(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    if (!isDbAvailable()) {
      return NextResponse.json(
        { xp: 0, level: 1, sessionsPlayed: 0, achievements: [], recentGames: [], highScores: {}, badges: [] },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const player = await prisma.player.findUnique({
      where: { walletAddress: wallet },
      include: {
        achievements: true,
        sessions: {
          where: { valid: true, endedAt: { not: null } },
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        {
          xp: 0,
          level: 1,
          sessionsPlayed: 0,
          achievements: [],
          recentGames: [],
          highScores: {},
          badges: [],
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
          },
        }
      );
    }

    // Get high scores per game from leaderboard
    const highScores = await prisma.leaderboard.findMany({
      where: { walletAddress: wallet },
    });

    const highScoreMap: Record<string, number> = {};
    highScores.forEach((entry) => {
      highScoreMap[entry.gameId] = entry.score;
    });

    // Compute level (100 XP per level)
    const level = Math.max(1, Math.floor(player.xp / 100) + 1);

    // Compute badges based on achievements and stats
    const badges = computeBadges(player, highScoreMap);

    return NextResponse.json(
      {
        xp: player.xp,
        level,
        sessionsPlayed: player.sessionsPlayed,
        achievements: player.achievements,
        recentGames: player.sessions.map((s) => ({
          gameId: s.gameId,
          score: s.score,
          duration: s.duration,
          startedAt: s.startedAt.toISOString(),
        })),
        highScores: highScoreMap,
        badges,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json({ error: 'Failed to fetch player stats' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}

interface PlayerData {
  xp: number;
  sessionsPlayed: number;
  achievements: { type: string; gameId: string; txHash: string | null }[];
}

function computeBadges(player: PlayerData, highScores: Record<string, number>) {
  // Build a map of minted badge IDs -> txHash
  const mintedMap = new Map<string, string | null>();
  for (const a of player.achievements) {
    if (a.gameId === 'badge') {
      mintedMap.set(a.type, a.txHash);
    }
  }

  const s = player.sessionsPlayed;
  const x = player.xp;
  const f = highScores['flappy'] || 0;
  const su = highScores['sudoku'] || 0;
  const g = Object.keys(highScores).length;

  const raw: { id: string; name: string; description: string; icon: string; earned: boolean; tier: string }[] = [
    { id: 'first-game', name: 'First Steps', description: 'Play your first game', icon: '🎮', earned: s >= 1, tier: 'bronze' },
    { id: 'five-games', name: 'Getting Warmed Up', description: 'Play 5 games', icon: '🔥', earned: s >= 5, tier: 'bronze' },
    { id: 'ten-games', name: 'Arcade Regular', description: 'Play 10 games', icon: '🕹️', earned: s >= 10, tier: 'silver' },
    { id: 'twenty-five-games', name: 'Arcade Veteran', description: 'Play 25 games', icon: '⭐', earned: s >= 25, tier: 'gold' },
    { id: 'fifty-games', name: 'Arcade Legend', description: 'Play 50 games', icon: '👑', earned: s >= 50, tier: 'platinum' },
    { id: 'xp-100', name: 'XP Hunter', description: 'Earn 100 XP', icon: '⚡', earned: x >= 100, tier: 'bronze' },
    { id: 'xp-500', name: 'XP Warrior', description: 'Earn 500 XP', icon: '💪', earned: x >= 500, tier: 'silver' },
    { id: 'xp-1000', name: 'XP Master', description: 'Earn 1,000 XP', icon: '🏆', earned: x >= 1000, tier: 'gold' },
    { id: 'flappy-10', name: 'Pipe Dodger', description: 'Score 10+ in Flappy Bird', icon: '🐦', earned: f >= 10, tier: 'bronze' },
    { id: 'flappy-50', name: 'Flappy Master', description: 'Score 50+ in Flappy Bird', icon: '🦅', earned: f >= 50, tier: 'gold' },
    { id: 'sudoku-500', name: 'Puzzle Solver', description: 'Score 500+ in Sudoku: Roast Mode', icon: '🧩', earned: su >= 500, tier: 'bronze' },
    { id: 'sudoku-1500', name: 'Roast Survivor', description: 'Score 1,500+ in Sudoku: Roast Mode', icon: '🔥', earned: su >= 1500, tier: 'gold' },
    { id: 'all-rounder', name: 'All-Rounder', description: 'Play all games', icon: '🎯', earned: g >= 2, tier: 'silver' },
  ];

  return raw.map((b) => ({
    ...b,
    minted: mintedMap.has(b.id),
    txHash: mintedMap.get(b.id) || null,
  }));
}
