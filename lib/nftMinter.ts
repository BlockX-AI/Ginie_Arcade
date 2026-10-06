import { createHash } from 'crypto';
import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  buildBackendSignatureIx,
  buildMintNftIx,
  getNftMintPda,
  getNftPlatformPda,
} from './solanaProgram';
import {
  buildNftSignMessage,
  getBackendKeypair,
  getBackendPublicKey,
  isSignerConfigured,
  signNftMint,
} from './signer';
import { getBadgeById } from './badges';
import { getGameById } from './games';
import { getBadgeTokenURI, getScoreTokenURI } from './badgeTokenURIs';
import { isLocalAppUrl } from './appUrl';

/**
 * Server-side NFT minting via the ginix_nfts Solana program.
 *
 * The backend signer is both the platform authority and the fee payer; the player
 * receives the NFT without needing to sign or hold SOL.
 *
 * On-chain constraints enforced by ginix_nfts (lib.rs):
 *   name.len()         <= 32
 *   symbol.len()       <= 10
 *   metadata_uri.len() <= 200
 * The mint PDA is seeded [b"nft", player, token_id], so a given (player, token_id)
 * can only ever be minted once.
 */

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

const MAX_NAME_LEN = 32;
const MAX_SYMBOL_LEN = 10;

/** Score NFT token id namespace. See lib/badges.ts for the full allocation table. */
const SCORE_TOKEN_ID_BASE = 2_000_000;
const SCORE_SLOT_SIZE = 100_000;

export interface MintResult {
  txHash: string;
  /** Numeric token id used to derive the mint PDA. */
  tokenId: number;
  /** Base58 mint address of the NFT. */
  mint: string;
  /** True when the NFT already existed and no transaction was sent. */
  alreadyMinted: boolean;
}

let _connection: Connection | null = null;

function getConnection(): Connection {
  if (!_connection) _connection = new Connection(RPC_URL, 'confirmed');
  return _connection;
}

/**
 * Stable per-game index used to carve out score NFT token ids.
 * Values are immutable once used on-chain — append new games, never renumber.
 */
const GAME_SLOT: Record<string, number> = {
  flappy: 0,
  'snake-io': 1,
  'the-house': 2,
  shooter: 3,
  '8ball-pool': 4,
  sudoku: 5,
  'zombie-apocalypse': 6,
  'project-abyss': 7,
  'aether-blade': 8,
  eclipse: 9,
};

/**
 * Deterministic token id for a score NFT.
 * Unique per (game, score), so re-minting the same high score is a no-op rather than a
 * duplicate NFT.
 */
export function scoreTokenId(gameId: string, score: number): number | null {
  const slot = GAME_SLOT[gameId];
  if (slot === undefined) return null;
  if (!Number.isInteger(score) || score < 0 || score >= SCORE_SLOT_SIZE) return null;
  return SCORE_TOKEN_ID_BASE + slot * SCORE_SLOT_SIZE + score;
}

function truncate(value: string, max: number): string {
  return Buffer.byteLength(value, 'utf8') <= max ? value : Buffer.from(value, 'utf8').subarray(0, max).toString('utf8').replace(/\uFFFD+$/, '');
}

/**
 * Cache of metadata-route reachability, keyed by origin + pathname so that
 * /api/metadata/badge and /api/metadata/score are checked independently while the
 * thousands of distinct score URIs collapse into a single check.
 */
const uriReachability = new Map<string, boolean>();

/**
 * Verify a metadata URI serves a successful response before it is written into an
 * immutable Metaplex metadata account. Fails closed on network errors.
 *
 * ipfs:// URIs are trusted: they are added deliberately after pinning, and gateway
 * availability varies too much to gate a mint on.
 */
async function metadataUriResolves(uri: string): Promise<boolean> {
  if (uri.startsWith('ipfs://')) return true;
  if (process.env.SKIP_NFT_METADATA_PREFLIGHT === 'true') return true;

  let cacheKey: string;
  try {
    const parsed = new URL(uri);
    cacheKey = `${parsed.origin}${parsed.pathname}`;
  } catch {
    return false;
  }

  const cached = uriReachability.get(cacheKey);
  if (cached !== undefined) return cached;

  let ok = false;
  try {
    const res = await fetch(uri, {
      method: 'GET',
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    ok = res.ok;
    if (!ok) console.error(`[nftMinter] Metadata preflight for ${cacheKey} returned HTTP ${res.status}`);
  } catch (err) {
    console.error(`[nftMinter] Metadata preflight for ${cacheKey} failed:`, err);
  }

  uriReachability.set(cacheKey, ok);
  return ok;
}

/**
 * Mint one NFT to a player. Returns null if minting is unavailable or fails.
 * Never throws — NFT minting is a bonus, it must not fail a score submission.
 */
async function mintNft(
  playerWallet: string,
  tokenId: number,
  name: string,
  symbol: string,
  metadataUri: string,
): Promise<MintResult | null> {
  try {
    if (!isMintingAvailable()) {
      console.warn('[nftMinter] Minting unavailable: BACKEND_SIGNER_KEY not configured');
      return null;
    }

    // Metaplex metadata is immutable. A localhost URI would permanently brick the NFT,
    // so refuse rather than mint something broken. Set ALLOW_LOCAL_NFT_METADATA=true to
    // override when deliberately testing against a tunnel or local gateway.
    if (!metadataUri.startsWith('ipfs://') && isLocalAppUrl(metadataUri) && process.env.ALLOW_LOCAL_NFT_METADATA !== 'true') {
      console.error(
        `[nftMinter] Refusing to mint: metadata URI "${metadataUri}" points at a local host. ` +
        'Set NEXT_PUBLIC_APP_URL to a public URL (or ALLOW_LOCAL_NFT_METADATA=true to override).'
      );
      return null;
    }

    // Same reasoning: confirm the URI actually serves metadata before baking it in.
    // This catches the common deploy-ordering mistake of pointing NEXT_PUBLIC_APP_URL at
    // a domain that has not shipped the /api/metadata routes yet.
    if (!(await metadataUriResolves(metadataUri))) {
      console.error(
        `[nftMinter] Refusing to mint: metadata URI "${metadataUri}" did not return a successful response. ` +
        'Deploy the app (including /api/metadata/*) to that domain first, or set SKIP_NFT_METADATA_PREFLIGHT=true to bypass.'
      );
      return null;
    }

    const connection = getConnection();
    const backend = getBackendKeypair();
    const player = new PublicKey(playerWallet);

    const safeName = truncate(name, MAX_NAME_LEN);
    const safeSymbol = truncate(symbol, MAX_SYMBOL_LEN);

    // The platform must be initialized before any mint can succeed.
    const [platformPda] = getNftPlatformPda(backend.publicKey);
    if (!(await connection.getAccountInfo(platformPda))) {
      console.error(
        `[nftMinter] NFT platform ${platformPda.toBase58()} is not initialized. Run scripts/devnet-nft-smoke.ts or the init script first.`
      );
      return null;
    }

    // Idempotency: the mint PDA already existing means this NFT was minted before.
    const [mintPda] = getNftMintPda(player, tokenId);
    if (await connection.getAccountInfo(mintPda)) {
      console.log(`[nftMinter] token_id=${tokenId} already minted for ${playerWallet} (${mintPda.toBase58()})`);
      return { txHash: '', tokenId, mint: mintPda.toBase58(), alreadyMinted: true };
    }

    // Backend authorizes the mint with an Ed25519 signature over
    // player || token_id || sha256(metadata_uri), verified on-chain.
    const uriHash = createHash('sha256').update(metadataUri, 'utf8').digest();
    const signature = signNftMint(playerWallet, tokenId, uriHash);
    const message = buildNftSignMessage(playerWallet, tokenId, uriHash);

    const tx = new Transaction().add(
      buildBackendSignatureIx(Buffer.from(message), signature, getBackendPublicKey()),
      buildMintNftIx(
        backend.publicKey, // payer
        backend.publicKey, // platform authority
        player,
        tokenId,
        safeName,
        safeSymbol,
        metadataUri,
        0, // Ed25519 instruction is first in this transaction
      ),
    );

    const txHash = await sendAndConfirmTransaction(connection, tx, [backend]);
    console.log(`[nftMinter] Minted "${safeName}" token_id=${tokenId} to ${playerWallet} (${txHash})`);

    return { txHash, tokenId, mint: mintPda.toBase58(), alreadyMinted: false };
  } catch (error) {
    console.error(`[nftMinter] Failed to mint token_id=${tokenId} to ${playerWallet}:`, error);
    return null;
  }
}

/**
 * Mint an achievement badge NFT to a player's wallet.
 */
export async function mintBadgeNFT(
  playerWallet: string,
  badgeId: string,
): Promise<MintResult | null> {
  const badge = getBadgeById(badgeId);
  if (!badge) {
    console.error(`[nftMinter] Unknown badge "${badgeId}"`);
    return null;
  }

  let metadataUri: string;
  try {
    metadataUri = getBadgeTokenURI(badge.id);
  } catch (err) {
    console.error(`[nftMinter] Bad metadata URI for badge "${badgeId}":`, err);
    return null;
  }

  return mintNft(playerWallet, badge.tokenId, badge.name, 'GNXB', metadataUri);
}

/**
 * Mint a high-score NFT to a player's wallet.
 */
export async function mintScoreNFT(
  playerWallet: string,
  gameId: string,
  score: number,
): Promise<MintResult | null> {
  const game = getGameById(gameId);
  if (!game) {
    console.error(`[nftMinter] Unknown game "${gameId}"`);
    return null;
  }

  const tokenId = scoreTokenId(gameId, score);
  if (tokenId === null) {
    console.warn(`[nftMinter] No score NFT token id for game="${gameId}" score=${score} (unregistered game or score out of range)`);
    return null;
  }

  let metadataUri: string;
  try {
    metadataUri = getScoreTokenURI(gameId, score);
  } catch (err) {
    console.error(`[nftMinter] Bad metadata URI for score NFT (${gameId}, ${score}):`, err);
    return null;
  }

  return mintNft(playerWallet, tokenId, `${game.title} ${score}`, 'GNXS', metadataUri);
}

/**
 * Whether NFT minting is configured and usable.
 */
export function isMintingAvailable(): boolean {
  return isSignerConfigured();
}
