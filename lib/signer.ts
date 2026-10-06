import { Keypair, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Backend Signer for Anti-Cheat Guard (Solana)
 * Signs validated game results for on-chain verification using Ed25519.
 */

let _signer: Keypair | null = null;

function getSigner(): Keypair {
  if (!_signer) {
    const key = process.env.BACKEND_SIGNER_KEY;
    if (!key || key === 'your_backend_private_key_here') {
      throw new Error('BACKEND_SIGNER_KEY environment variable must be set to a valid Solana keypair (base58 or JSON byte array)');
    }
    try {
      if (key.startsWith('[')) {
        const bytes = Uint8Array.from(JSON.parse(key));
        _signer = Keypair.fromSecretKey(bytes);
      } else {
        const bytes = bs58.decode(key);
        _signer = Keypair.fromSecretKey(bytes);
      }
    } catch (e) {
      throw new Error('BACKEND_SIGNER_KEY is not a valid Solana keypair: ' + (e as Error).message);
    }
  }
  return _signer;
}

/**
 * Return the backend signer's public key (base58).
 */
export function getBackendPublicKey(): string {
  return getSigner().publicKey.toBase58();
}

/**
 * Return the backend signer keypair. Server-side only — this holds the secret key.
 * Used when the backend must also pay for and sign a transaction (e.g. NFT minting).
 */
export function getBackendKeypair(): Keypair {
  return getSigner();
}

/**
 * Whether a usable backend signer key is configured.
 */
export function isSignerConfigured(): boolean {
  try {
    getSigner();
    return true;
  } catch {
    return false;
  }
}

/**
 * Sign a game result for on-chain verification.
 * The message is: nonce(32) || player_pubkey(32) || game_seed(32) || score(8 LE) || reward_amount(8 LE)
 * @param nonce Session nonce (hex string)
 * @param player Player wallet address (base58)
 * @param gameId Game identifier (string slug)
 * @param score Session score
 * @param rewardAmount Reward token amount (0 if no reward)
 * @returns Ed25519 signature as base58 string
 */
export async function signGameResult(
  nonce: string,
  player: string,
  gameId: string,
  score: number,
  rewardAmount: number = 0,
  _chainId?: number,
): Promise<string> {
  const message = buildArcadeSignMessage(nonce, player, gameId, score, rewardAmount);
  const signature = nacl.sign.detached(message, getSigner().secretKey);
  return bs58.encode(signature);
}

/**
 * Build the message bytes that the on-chain program will verify.
 * Layout: 32-byte nonce || 32-byte player pubkey || 32-byte game seed || 8-byte score (LE) || 8-byte reward (LE)
 */
export function buildArcadeSignMessage(
  nonce: string,
  player: string,
  gameId: string,
  score: number,
  rewardAmount: number = 0,
): Uint8Array {
  const nonceBytes = Buffer.from(nonce.padStart(64, '0').slice(0, 64), 'hex');
  const playerBytes = new PublicKey(player).toBuffer();
  const gameBytes = Buffer.from(gameId.padEnd(32, '\0').slice(0, 32), 'utf8');
  const scoreBytes = Buffer.from(new BigUint64Array([BigInt(score)]).buffer);
  const rewardBytes = Buffer.from(new BigUint64Array([BigInt(rewardAmount)]).buffer);

  return Buffer.concat([nonceBytes, playerBytes, gameBytes, scoreBytes, rewardBytes]);
}

/**
 * Build the message for NFT mint authorization.
 * Layout: 32-byte player pubkey || 8-byte token_id (LE) || 32-byte metadata_uri sha256
 */
export function buildNftSignMessage(
  player: string,
  tokenId: number,
  uriHash: Uint8Array,
): Uint8Array {
  const playerBytes = new PublicKey(player).toBuffer();
  const tokenIdBytes = Buffer.from(new BigUint64Array([BigInt(tokenId)]).buffer);
  return Buffer.concat([playerBytes, tokenIdBytes, Buffer.from(uriHash)]);
}

/**
 * Sign an NFT mint authorization.
 */
export function signNftMint(
  player: string,
  tokenId: number,
  uriHash: Uint8Array,
): string {
  const message = buildNftSignMessage(player, tokenId, uriHash);
  const signature = nacl.sign.detached(message, getSigner().secretKey);
  return bs58.encode(signature);
}

/**
 * Build the message for tournament prize authorization.
 * Layout: 32-byte player pubkey || 8-byte tournament_id (LE) || 8-byte amount (LE)
 */
export function buildTournamentSignMessage(
  player: string,
  tournamentId: number,
  amount: number,
): Uint8Array {
  const playerBytes = new PublicKey(player).toBuffer();
  const tournamentIdBytes = Buffer.from(new BigUint64Array([BigInt(tournamentId)]).buffer);
  const amountBytes = Buffer.from(new BigUint64Array([BigInt(amount)]).buffer);
  return Buffer.concat([playerBytes, tournamentIdBytes, amountBytes]);
}

/**
 * Sign a tournament prize authorization.
 */
export function signTournamentPrize(
  player: string,
  tournamentId: number,
  amount: number,
): string {
  const message = buildTournamentSignMessage(player, tournamentId, amount);
  const signature = nacl.sign.detached(message, getSigner().secretKey);
  return bs58.encode(signature);
}

/**
 * Get backend signer's public key (base58)
 */
export function getBackendSignerAddress(): string {
  return getSigner().publicKey.toBase58();
}

/**
 * Convert game slug to a 32-byte seed hex string for on-chain use.
 */
export function gameSlugToId(slug: string): string {
  return Buffer.from(slug.padEnd(32, '\0').slice(0, 32), 'utf8').toString('hex');
}

/**
 * Convert reward type to a 32-byte seed hex string for on-chain use.
 */
export function rewardTypeToId(type: string): string {
  return Buffer.from(type.padEnd(32, '\0').slice(0, 32), 'utf8').toString('hex');
}
