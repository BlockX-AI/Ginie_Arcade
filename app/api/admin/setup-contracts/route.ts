import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

/**
 * POST /api/admin/setup-contracts
 * One-shot setup: approves all active games in GinixGameRegistry and
 * configures all reward types in GinixRewardEngine.
 * Uses BACKEND_SIGNER_KEY which must be the contract deployer/owner.
 */

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
// Prefer DEPLOYER_PRIVATE_KEY (Registry/RewardEngine owner) over BACKEND_SIGNER_KEY (NFT minter)
const SIGNER_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.BACKEND_SIGNER_KEY || '';
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '';
const REWARD_ADDRESS = process.env.NEXT_PUBLIC_REWARD_ADDRESS || '';

const REGISTRY_ABI = [
  'function approveGame(bytes32 gameId, string uri) external',
  'function isApproved(bytes32 gameId) external view returns (bool)',
  'function owner() external view returns (address)',
];

const REWARD_ENGINE_ABI = [
  'function configureReward(bytes32 rewardId, uint64 xpAmount, bool unlockAchievement) external',
  'function rewards(bytes32) external view returns (uint64 xpAmount, bool unlockAchievement, bool enabled)',
  'function owner() external view returns (address)',
];

// All active game slugs
const ACTIVE_GAMES = [
  'flappy',
  'snake-io',
  'the-house',
  'shooter',
  '8ball-pool',
  'sudoku',
  'zombie-apocalypse',
  'match-three',
];

// All reward types — must stay in sync with checkRewardEligibility in submitScore/route.ts
const REWARD_CONFIGS = [
  { type: 'FLAPPY_ROOKIE',       xp: 50  },
  { type: 'PIPE_MASTER',         xp: 200 },
  { type: 'PUZZLE_SOLVER',       xp: 100 },
  { type: 'LOGIC_MASTER',        xp: 300 },
  { type: 'NEURAL_GENIUS',       xp: 500 },
  { type: 'ZOMBIE_HUNTER',       xp: 50  },
  { type: 'ZOMBIE_SLAYER',       xp: 200 },
  { type: 'APOCALYPSE_SURVIVOR', xp: 500 },
  { type: 'POOL_ROOKIE',         xp: 100 },
  { type: 'BILLIARD_PRO',        xp: 300 },
  { type: 'POOL_CHAMPION',       xp: 750 },
  { type: 'SNAKE_ROOKIE',        xp: 50  },
  { type: 'SNAKE_MASTER',        xp: 200 },
  { type: 'SNAKE_LEGEND',        xp: 500 },
  { type: 'SHOOTER_ROOKIE',      xp: 50  },
  { type: 'SHOOTER_MASTER',      xp: 200 },
  { type: 'SHOOTER_ACE',         xp: 500 },
  { type: 'MATCH_ROOKIE',        xp: 50  },
  { type: 'MATCH_MASTER',        xp: 200 },
  { type: 'GEM_LEGEND',          xp: 500 },
  { type: 'HOUSE_EXPLORER',      xp: 50  },
  { type: 'HOUSE_MASTER',        xp: 200 },
];

export async function POST() {
  if (!SIGNER_KEY || SIGNER_KEY.length < 64) {
    return NextResponse.json({ error: 'BACKEND_SIGNER_KEY not configured' }, { status: 400 });
  }
  if (!REGISTRY_ADDRESS || !REWARD_ADDRESS) {
    return NextResponse.json({ error: 'Registry or Reward contract address not configured' }, { status: 400 });
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(SIGNER_KEY, provider);
  const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);
  const rewardEngine = new ethers.Contract(REWARD_ADDRESS, REWARD_ENGINE_ABI, wallet);

  const results: Record<string, { status: string; txHash?: string; error?: string }> = {};

  // Step 1: Approve all games in Registry
  for (const slug of ACTIVE_GAMES) {
    const gameId = ethers.keccak256(ethers.toUtf8Bytes(slug));
    try {
      const alreadyApproved = await registry.isApproved(gameId);
      if (alreadyApproved) {
        results[`game:${slug}`] = { status: 'already_approved' };
        continue;
      }
      const tx = await registry.approveGame(gameId, `https://arcade.ginie.xyz/games/${slug}`);
      const receipt = await tx.wait();
      results[`game:${slug}`] = { status: 'approved', txHash: receipt.hash };
    } catch (err: any) {
      results[`game:${slug}`] = { status: 'error', error: err?.message ?? String(err) };
    }
  }

  // Step 2: Configure all rewards in RewardEngine
  for (const reward of REWARD_CONFIGS) {
    const rewardId = ethers.keccak256(ethers.toUtf8Bytes(reward.type));
    try {
      const existing = await rewardEngine.rewards(rewardId);
      if (existing.enabled) {
        results[`reward:${reward.type}`] = { status: 'already_configured' };
        continue;
      }
      const tx = await rewardEngine.configureReward(rewardId, BigInt(reward.xp), false);
      const receipt = await tx.wait();
      results[`reward:${reward.type}`] = { status: 'configured', txHash: receipt.hash };
    } catch (err: any) {
      results[`reward:${reward.type}`] = { status: 'error', error: err?.message ?? String(err) };
    }
  }

  const errors = Object.entries(results).filter(([, v]) => v.status === 'error');
  return NextResponse.json({
    success: errors.length === 0,
    signerAddress: wallet.address,
    results,
    errorCount: errors.length,
  });
}

export async function GET() {
  if (!SIGNER_KEY || !REGISTRY_ADDRESS || !REWARD_ADDRESS) {
    return NextResponse.json({ error: 'Missing configuration' }, { status: 400 });
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(SIGNER_KEY, provider);
  const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);

  const status: Record<string, boolean> = {};
  for (const slug of ACTIVE_GAMES) {
    const gameId = ethers.keccak256(ethers.toUtf8Bytes(slug));
    try {
      status[slug] = await registry.isApproved(gameId);
    } catch {
      status[slug] = false;
    }
  }

  return NextResponse.json({ registryOwner: await registry.owner(), games: status });
}
