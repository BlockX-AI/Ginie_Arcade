import { NextRequest, NextResponse } from 'next/server';
import { getBadgeById } from '@/lib/badges';
import { getAppUrl } from '@/lib/appUrl';

/**
 * GET /api/metadata/badge?id=<badgeId>
 *
 * Serves Metaplex-compatible JSON metadata for an achievement badge NFT.
 * Used as the `metadata_uri` when a badge has no pinned IPFS CID. The URI must stay
 * short because ginix_nfts enforces metadata_uri.len() <= 200 on-chain.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const badge = getBadgeById(id);
  if (!badge) {
    return NextResponse.json({ error: 'Unknown badge' }, { status: 404 });
  }

  const appUrl = getAppUrl();

  return NextResponse.json(
    {
      name: badge.name,
      symbol: 'GNXB',
      description: badge.description,
      image: `${appUrl}/badges/${badge.id}.png`,
      external_url: `${appUrl}/dashboard`,
      attributes: [
        { trait_type: 'Tier', value: badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1) },
        { trait_type: 'Category', value: badge.category },
        { trait_type: 'Threshold', value: badge.value },
      ],
      properties: {
        badge_id: badge.id,
        platform: 'Ginix Arcade',
        category: 'badge',
        files: [{ uri: `${appUrl}/badges/${badge.id}.png`, type: 'image/png' }],
      },
    },
    { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
  );
}
