import { ethers } from 'ethers';

/**
 * Server-side NFT minting via GameNFT contract
 * Uses the backend signer (same key as deployer = authorized minter)
 */

const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS || '';
const SIGNER_KEY = process.env.BACKEND_SIGNER_KEY || '';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';

const NFT_ABI = [
  'function mintAchievement(address to, uint256 achievementType, uint256 gameId, uint256 value, string tokenURI) external returns (uint256)',
  'function setAuthorizedMinter(address minter, bool status) external',
  'function authorizedMinters(address minter) external view returns (bool)',
  'function owner() external view returns (address)',
  'function totalMinted() external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'event NFTMinted(address indexed to, uint256 indexed tokenId, uint256 achievementType, uint256 gameId, uint256 value)',
];

// Achievement type enum matching the contract
const ACHIEVEMENT_TYPES = {
  milestone: 1,
  highscore: 2,
  special: 3,
};

// Game ID mapping (numeric for contract)
const GAME_IDS: Record<string, number> = {
  'flappy': 3,
  'sudoku': 4,
  'snake-io': 5,
  'the-house': 6,
  'shooter': 7,
  'match-three': 8,
  'session': 0,
  'xp': 0,
  'multi': 0,
};

// Badge category -> achievement type
const CATEGORY_TO_TYPE: Record<string, number> = {
  session: ACHIEVEMENT_TYPES.milestone,
  xp: ACHIEVEMENT_TYPES.milestone,
  flappy: ACHIEVEMENT_TYPES.highscore,
  sudoku: ACHIEVEMENT_TYPES.highscore,
  snake: ACHIEVEMENT_TYPES.highscore,
  house: ACHIEVEMENT_TYPES.milestone,
  shooter: ACHIEVEMENT_TYPES.highscore,
  multi: ACHIEVEMENT_TYPES.special,
};

let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;
let _contract: ethers.Contract | null = null;

function getContract() {
  if (!NFT_ADDRESS || NFT_ADDRESS.length < 10) {
    throw new Error('NEXT_PUBLIC_NFT_ADDRESS not configured');
  }
  if (!SIGNER_KEY || SIGNER_KEY.length < 64) {
    throw new Error('BACKEND_SIGNER_KEY not configured');
  }

  if (!_contract) {
    _provider = new ethers.JsonRpcProvider(RPC_URL);
    _wallet = new ethers.Wallet(SIGNER_KEY, _provider);
    _contract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, _wallet);
  }
  return _contract;
}

/**
 * Mint a badge NFT to a player's wallet
 * @returns Transaction hash, or null if minting is not available
 */
export async function mintBadgeNFT(
  playerWallet: string,
  badgeId: string,
  badgeCategory: string,
  tokenURI: string,
  value: number = 0,
): Promise<{ txHash: string; tokenId: number } | null> {
  try {
    const contract = getContract();
    const achievementType = CATEGORY_TO_TYPE[badgeCategory] || ACHIEVEMENT_TYPES.milestone;
    const gameId = GAME_IDS[badgeCategory] || 0;

    // Normalize wallet address to checksummed format
    const normalizedWallet = ethers.getAddress(playerWallet);
    console.log(`[nftMinter] Minting badge "${badgeId}" to ${normalizedWallet} (raw input: ${playerWallet})`);
    console.log(`[nftMinter] achievementType=${achievementType}, gameId=${gameId}, value=${value}`);
    console.log(`[nftMinter] tokenURI=${tokenURI}`);

    const tx = await contract.mintAchievement(
      normalizedWallet,
      achievementType,
      gameId,
      value,
      tokenURI,
    );

    console.log(`[nftMinter] Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[nftMinter] Transaction confirmed in block ${receipt.blockNumber}`);

    // Parse the NFTMinted event to get tokenId
    let tokenId = -1;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({ topics: log.topics as string[], data: log.data });
        if (parsed?.name === 'NFTMinted') {
          tokenId = Number(parsed.args[1]); // tokenId is the second indexed arg
          console.log(`[nftMinter] NFTMinted event: to=${parsed.args[0]}, tokenId=${tokenId}`);
          break;
        }
      } catch {
        // Not our event, skip
      }
    }

    // Verify the NFT owner matches the intended recipient
    if (tokenId >= 0) {
      try {
        const actualOwner = await contract.ownerOf(tokenId);
        console.log(`[nftMinter] VERIFY: tokenId=${tokenId} owner=${actualOwner}, expected=${normalizedWallet}`);
        if (actualOwner.toLowerCase() !== normalizedWallet.toLowerCase()) {
          console.error(`[nftMinter] *** MISMATCH *** NFT ${tokenId} owned by ${actualOwner}, NOT ${normalizedWallet}`);
        }
      } catch (e) {
        console.error(`[nftMinter] Failed to verify owner:`, e);
      }
    }

    return { txHash: tx.hash, tokenId };
  } catch (error) {
    console.error(`[nftMinter] Failed to mint badge "${badgeId}":`, error);
    return null;
  }
}

/**
 * Mint a score NFT to a player's wallet (server-side, auto on every valid score)
 * @returns Transaction hash + tokenId, or null if minting fails
 */
export async function mintScoreNFT(
  playerWallet: string,
  gameId: string,
  gameName: string,
  score: number,
  duration: number,
): Promise<{ txHash: string; tokenId: number } | null> {
  try {
    const contract = getContract();
    const gameIndex = GAME_IDS[gameId] || 0;

    // Build on-chain metadata as a data-URI (lightweight, no IPFS needed for scores)
    const badgeImage = gameId === 'sudoku' ? 'sudoku-500' 
      : gameId === 'snake-io' ? 'snake-50' 
      : gameId === 'the-house' ? 'house-explorer' 
      : gameId === 'shooter' ? 'shooter-100' 
      : gameId === 'match-three' ? 'all-rounder'
      : 'flappy-10';
    
    const metadata = {
      name: `${gameName} Score: ${score}`,
      description: `Achieved score of ${score} in ${gameName} on Ginix Arcade`,
      image: `https://giniearcade2.vercel.app/badges/${badgeImage}.png`,
      attributes: [
        { trait_type: 'Game', value: gameName },
        { trait_type: 'Score', value: score },
        { trait_type: 'Duration', value: `${duration}s` },
        { trait_type: 'Chain', value: 'Avalanche Fuji' },
      ],
    };
    const tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;

    // Normalize wallet address to checksummed format
    const normalizedWallet = ethers.getAddress(playerWallet);
    console.log(`[nftMinter] Minting score NFT: ${gameName} score=${score} to ${normalizedWallet} (raw input: ${playerWallet})`);

    const tx = await contract.mintAchievement(
      normalizedWallet,
      ACHIEVEMENT_TYPES.highscore,
      gameIndex,
      score,
      tokenURI,
    );

    console.log(`[nftMinter] Score NFT tx sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[nftMinter] Score NFT confirmed in block ${receipt.blockNumber}`);

    let tokenId = -1;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog({ topics: log.topics as string[], data: log.data });
        if (parsed?.name === 'NFTMinted') {
          tokenId = Number(parsed.args[1]);
          console.log(`[nftMinter] Score NFT event: to=${parsed.args[0]}, tokenId=${tokenId}`);
          break;
        }
      } catch {
        // Not our event
      }
    }

    // Verify the NFT owner matches the intended recipient
    if (tokenId >= 0) {
      try {
        const actualOwner = await contract.ownerOf(tokenId);
        console.log(`[nftMinter] VERIFY SCORE NFT: tokenId=${tokenId} owner=${actualOwner}, expected=${normalizedWallet}`);
        if (actualOwner.toLowerCase() !== normalizedWallet.toLowerCase()) {
          console.error(`[nftMinter] *** MISMATCH *** Score NFT ${tokenId} owned by ${actualOwner}, NOT ${normalizedWallet}`);
        }
      } catch (e) {
        console.error(`[nftMinter] Failed to verify score NFT owner:`, e);
      }
    }

    return { txHash: tx.hash, tokenId };
  } catch (error) {
    console.error(`[nftMinter] Failed to mint score NFT for ${gameId}:`, error);
    return null;
  }
}

/**
 * Check if minting is available (keys configured)
 */
export function isMintingAvailable(): boolean {
  return !!(NFT_ADDRESS && NFT_ADDRESS.length >= 10 && SIGNER_KEY && SIGNER_KEY.length >= 64);
}

/**
 * Authorize the backend signer wallet as a minter on the GameNFT contract.
 * Must be called by the contract owner (deployer). Pass the OWNER private key.
 */
export async function authorizeBackendSigner(ownerPrivateKey: string): Promise<{ signerAddress: string; txHash: string } | null> {
  try {
    if (!NFT_ADDRESS || NFT_ADDRESS.length < 10) throw new Error('NEXT_PUBLIC_NFT_ADDRESS not configured');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const ownerWallet = new ethers.Wallet(ownerPrivateKey, provider);
    const contract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, ownerWallet);

    // Derive the backend signer address from SIGNER_KEY
    const signerWallet = new ethers.Wallet(SIGNER_KEY);
    const signerAddress = signerWallet.address;

    console.log(`[nftMinter] Authorizing backend signer ${signerAddress} via owner ${ownerWallet.address}`);
    const tx = await contract.setAuthorizedMinter(signerAddress, true);
    const receipt = await tx.wait();
    console.log(`[nftMinter] Authorization tx confirmed in block ${receipt.blockNumber}`);
    return { signerAddress, txHash: tx.hash };
  } catch (error) {
    console.error('[nftMinter] Failed to authorize backend signer:', error);
    return null;
  }
}

/**
 * Check whether the backend signer is currently authorized on the contract.
 */
export async function checkSignerAuthorized(): Promise<{ authorized: boolean; signerAddress: string; owner: string } | null> {
  try {
    if (!NFT_ADDRESS || NFT_ADDRESS.length < 10 || !SIGNER_KEY || SIGNER_KEY.length < 64) return null;
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);
    const signerWallet = new ethers.Wallet(SIGNER_KEY);
    const [authorized, owner] = await Promise.all([
      contract.authorizedMinters(signerWallet.address),
      contract.owner(),
    ]);
    return { authorized, signerAddress: signerWallet.address, owner };
  } catch (error) {
    console.error('[nftMinter] Failed to check signer authorization:', error);
    return null;
  }
}
