import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, ParsedAccountData } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export const runtime = 'nodejs';

const walletRe = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

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

/**
 * Decode Metaplex metadata account data to extract name, symbol, URI.
 */
function decodeMetaplexMetadata(data: Buffer): { name: string; symbol: string; uri: string } | null {
  try {
    // Metaplex metadata layout:
    // 0: key (1 byte) = 4 (MetadataV1)
    // 1: update_authority (32 bytes)
    // 33: mint (32 bytes)
    // 65: name (u8 length prefix + max 32 bytes)
    // 98: symbol (u8 length prefix + max 10 bytes)
    // 109: uri (u8 length prefix + max 200 bytes)
    if (data[0] !== 4) return null;

    let offset = 65;
    const nameLen = data[offset];
    const name = data.subarray(offset + 1, offset + 1 + nameLen).toString('utf8').replace(/\0+$/, '').trim();
    offset += 1 + 32;

    const symbolLen = data[offset];
    const symbol = data.subarray(offset + 1, offset + 1 + symbolLen).toString('utf8').replace(/\0+$/, '').trim();
    offset += 1 + 10;

    const uriLen = data[offset];
    const uri = data.subarray(offset + 1, offset + 1 + uriLen).toString('utf8').replace(/\0+$/, '').trim();

    return { name, symbol, uri };
  } catch {
    return null;
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

  const connection = new Connection(RPC_URL, 'confirmed');

  try {
    const walletPubkey = new PublicKey(wallet);

    // Fetch all token accounts owned by this wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      { programId: TOKEN_PROGRAM_ID },
    );

    // Filter for NFTs (amount = 1, decimals = 0)
    const nftMints = tokenAccounts.value
      .filter((account) => {
        const parsed = account.account.data as ParsedAccountData;
        const info = parsed.parsed.info;
        return (
          info.tokenAmount.amount === '1' &&
          info.tokenAmount.decimals === 0
        );
      })
      .map((account) => ({
        mint: new PublicKey((account.account.data as ParsedAccountData).parsed.info.mint),
        account: account.pubkey,
      }));

    // Fetch Metaplex metadata for each NFT mint
    const METAPLEX_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

    const items = await Promise.all(
      nftMints.map(async ({ mint, account: tokenAccount }) => {
        // Derive Metaplex metadata PDA
        const [metadataPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('metadata'), METAPLEX_PROGRAM_ID.toBuffer(), mint.toBuffer()],
          METAPLEX_PROGRAM_ID
        );

        let onchainMetadata: { name: string; symbol: string; uri: string } | null = null;
        let metadata: any = null;

        try {
          const accountInfo = await connection.getAccountInfo(metadataPda);
          if (accountInfo && accountInfo.data) {
            onchainMetadata = decodeMetaplexMetadata(accountInfo.data);
            if (onchainMetadata?.uri) {
              metadata = await fetchMetadata(onchainMetadata.uri);
            }
          }
        } catch {
          // metadata fetch failed, continue with minimal info
        }

        const name = onchainMetadata?.name || metadata?.name || `NFT #${mint.toString().slice(0, 8)}`;
        const description = typeof metadata?.description === 'string' ? metadata.description : null;
        const image = typeof metadata?.image === 'string' ? normalizeIpfs(metadata.image) : null;
        const badgeId = typeof metadata?.properties?.badge_id === 'string' ? metadata.properties.badge_id : null;

        return {
          tokenId: mint.toString(),
          tokenAccount: tokenAccount.toString(),
          name,
          description,
          image,
          badgeId,
          metadata,
          explorer: `https://solscan.io/token/${mint.toString()}?cluster=devnet`,
        };
      })
    );

    return NextResponse.json(
      { wallet, total: items.length, nfts: items },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
