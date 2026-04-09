import { ethers } from 'ethers';

/**
 * Backend Signer for Anti-Cheat Guard
 * Signs validated game results for on-chain verification
 */

const BACKEND_PRIVATE_KEY = process.env.BACKEND_SIGNER_KEY;

if (!BACKEND_PRIVATE_KEY) {
  throw new Error('BACKEND_SIGNER_KEY environment variable is required');
}

const signer = new ethers.Wallet(BACKEND_PRIVATE_KEY);

/**
 * Sign a game result for on-chain verification
 * @param nonce Session nonce
 * @param player Player wallet address
 * @param gameId Game identifier (bytes32 hash)
 * @param score Session score
 * @param chainId Network chain ID
 * @returns Signature string
 */
export async function signGameResult(
  nonce: string,
  player: string,
  gameId: string,
  score: number,
  chainId: number
): Promise<string> {
  // Create the same message hash that the contract expects
  const msgHash = ethers.solidityPackedKeccak256(
    ['bytes32', 'address', 'bytes32', 'uint64', 'uint256'],
    [
      '0x' + nonce,
      player,
      gameId,
      score,
      chainId
    ]
  );

  // Sign the message hash
  const signature = await signer.signMessage(ethers.getBytes(msgHash));
  
  return signature;
}

/**
 * Get backend signer address
 */
export function getBackendSignerAddress(): string {
  return signer.address;
}

/**
 * Convert game slug to gameId (bytes32 hash)
 */
export function gameSlugToId(slug: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(slug));
}

/**
 * Convert reward type to rewardId (bytes32 hash)
 */
export function rewardTypeToId(type: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(type));
}
