import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, isAddress } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { NFT_ABI, NFT_ADDRESS } from '@/lib/contracts';

export const runtime = 'nodejs';

const walletRe = /^0x[a-fA-F0-9]{40}$/;

function normalizeIpfs(uri: string) {
  if (!uri) return uri;
  if (uri.startsWith('ipfs://')) return `https://ipfs.io/ipfs/${uri.slice('ipfs://'.length)}`;
  return uri;
}

function parseDataJson(uri: string): unknown | null {
  const prefix = 'data:application/json;base64,';
  if (!uri.startsWith(prefix)) return null;
  try {
    const raw = Buffer.from(uri.slice(prefix.length), 'base64').toString('utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function fetchMetadata(tokenUri: string) {
  const parsed = parseDataJson(tokenUri);
  if (parsed) return parsed;

  const url = normalizeIpfs(tokenUri);
  const res = await fetch(url, { cache: 'no-store' });
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!walletRe.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }

  if (!NFT_ADDRESS || !isAddress(NFT_ADDRESS)) {
    return NextResponse.json(
      { error: 'NFT contract address not configured (NEXT_PUBLIC_NFT_ADDRESS)' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const client = createPublicClient({
    chain: avalancheFuji,
    transport: http('https://api.avax-test.network/ext/bc/C/rpc'),
  });

  try {
    const tokenIds = (await client.readContract({
      address: NFT_ADDRESS,
      abi: NFT_ABI,
      functionName: 'getOwnedTokens',
      args: [wallet as `0x${string}`],
    })) as bigint[];

    const items = await Promise.all(
      tokenIds.map(async (tokenId) => {
        const tokenUri = (await client.readContract({
          address: NFT_ADDRESS,
          abi: NFT_ABI,
          functionName: 'tokenURI',
          args: [tokenId],
        })) as string;

        let metadata: any = null;
        try {
          metadata = await fetchMetadata(tokenUri);
        } catch {
          metadata = null;
        }

        const name = typeof metadata?.name === 'string' ? metadata.name : `Achievement #${tokenId.toString()}`;
        const description = typeof metadata?.description === 'string' ? metadata.description : null;
        const image = typeof metadata?.image === 'string' ? normalizeIpfs(metadata.image) : null;
        const badgeId = typeof metadata?.properties?.badge_id === 'string' ? metadata.properties.badge_id : null;

        return {
          tokenId: tokenId.toString(),
          tokenUri: normalizeIpfs(tokenUri),
          name,
          description,
          image,
          badgeId,
          metadata,
          explorer: `https://testnet.snowtrace.io/nft/${NFT_ADDRESS}/${tokenId.toString()}?chainid=43113&type=erc721`,
        };
      })
    );

    return NextResponse.json(
      { wallet, contract: NFT_ADDRESS, total: items.length, nfts: items },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
