import { ethers } from 'ethers';

/**
 * Backend Signer for Anti-Cheat Guard
 * Signs validated game results for on-chain verification
 */

let _signer: ethers.Wallet | null = null;

function getSigner(): ethers.Wallet {
  if (!_signer) {
    const key = process.env.BACKEND_SIGNER_KEY;
    if (!key || key === 'your_private_key') {
      throw new Error('BACKEND_SIGNER_KEY environment variable must be set to a valid private key');
    }
    _signer = new ethers.Wallet(key);
  }
  return _signer;
}

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
  const signature = await getSigner().signMessage(ethers.getBytes(msgHash));
  
  return signature;
}

/**
 * Get backend signer address
 */
export function getBackendSignerAddress(): string {
  return getSigner().address;
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
