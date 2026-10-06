import { NextRequest, NextResponse } from 'next/server';
import { getGameById } from '@/lib/games';
import { getAppUrl } from '@/lib/appUrl';

/**
 * GET /api/metadata/score?g=<gameId>&s=<score>
 *
 * Serves Metaplex-compatible JSON metadata for a high-score NFT.
 * Kept as a short query-string URL because ginix_nfts enforces
 * metadata_uri.len() <= 200 on-chain (base64 data-URIs are impossible there).
 */
export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get('g');
  const scoreRaw = request.nextUrl.searchParams.get('s');

  if (!gameId || !scoreRaw) {
    return NextResponse.json({ error: 'Missing g or s parameter' }, { status: 400 });
  }

  const score = Number(scoreRaw);
  if (!Number.isInteger(score) || score < 0) {
    return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
  }

  const game = getGameById(gameId);
  if (!game) {
    return NextResponse.json({ error: 'Unknown game' }, { status: 404 });
  }

  const appUrl = getAppUrl();
  const image = `${appUrl}/badges/${scoreBadgeArt(gameId)}.png`;

  return NextResponse.json(
    {
      name: `${game.title} Score: ${score}`,
      symbol: 'GNXS',
      description: `Verified score of ${score} in ${game.title} on Ginix Arcade.`,
      image,
      external_url: `${appUrl}/play/${game.id}`,
      attributes: [
        { trait_type: 'Game', value: game.title },
        { trait_type: 'Score', value: score },
        { trait_type: 'Category', value: game.category },
      ],
      properties: {
        game_id: game.id,
        platform: 'Ginix Arcade',
        category: 'score',
        files: [{ uri: image, type: 'image/png' }],
      },
    },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
  );
}

/**
 * Map a game to an existing badge artwork in public/badges.
 * Falls back to the generic all-rounder art when a game has no dedicated image.
 */
function scoreBadgeArt(gameId: string): string {
  const art: Record<string, string> = {
    flappy: 'flappy-10',
    sudoku: 'sudoku-500',
    'snake-io': 'snake-50',
    'the-house': 'house-explorer',
    shooter: 'shooter-100',
  };
  return art[gameId] || 'all-rounder';
}
