/**
 * One-shot setup script: approves all active games in GinixGameRegistry
 * and configures all reward types in GinixRewardEngine.
 *
 * Run: npx hardhat run scripts/registerGames.js --network fuji
 * Requires DEPLOYER_PRIVATE_KEY in packages/contracts/.env
 */

const { ethers } = require('hardhat');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

const REGISTRY_ADDRESS  = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
const REWARD_ADDRESS    = process.env.NEXT_PUBLIC_REWARD_ADDRESS;

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

const REGISTRY_ABI = [
  'function approveGame(bytes32 gameId, string uri) external',
  'function isApproved(bytes32 gameId) external view returns (bool)',
  'function owner() external view returns (address)',
];

const REWARD_ABI = [
  'function configureReward(bytes32 rewardId, uint64 xpAmount, bool unlockAchievement) external',
  'function rewards(bytes32) external view returns (uint64 xpAmount, bool unlockAchievement, bool enabled)',
  'function owner() external view returns (address)',
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Using wallet:', deployer.address);

  if (!REGISTRY_ADDRESS || !REWARD_ADDRESS) {
    throw new Error('NEXT_PUBLIC_REGISTRY_ADDRESS or NEXT_PUBLIC_REWARD_ADDRESS not set in .env.local');
  }

  const registry    = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, deployer);
  const rewardEngine = new ethers.Contract(REWARD_ADDRESS, REWARD_ABI, deployer);

  const registryOwner = await registry.owner();
  const rewardOwner   = await rewardEngine.owner();
  console.log('Registry owner:', registryOwner);
  console.log('RewardEngine owner:', rewardOwner);

  if (deployer.address.toLowerCase() !== registryOwner.toLowerCase()) {
    throw new Error(`Deployer ${deployer.address} is not the Registry owner (${registryOwner})`);
  }

  // --- Approve all games ---
  console.log('\n=== Approving games in GinixGameRegistry ===');
  for (const slug of ACTIVE_GAMES) {
    const gameId = ethers.keccak256(ethers.toUtf8Bytes(slug));
    const already = await registry.isApproved(gameId);
    if (already) {
      console.log(`  [SKIP] ${slug} already approved`);
      continue;
    }
    const tx = await registry.approveGame(gameId, `https://arcade.ginie.xyz/games/${slug}`);
    const receipt = await tx.wait();
    console.log(`  [OK]   ${slug} approved — tx ${receipt.hash}`);
  }

  // --- Configure all rewards ---
  console.log('\n=== Configuring rewards in GinixRewardEngine ===');
  for (const reward of REWARD_CONFIGS) {
    const rewardId = ethers.keccak256(ethers.toUtf8Bytes(reward.type));
    const existing = await rewardEngine.rewards(rewardId);
    if (existing.enabled) {
      console.log(`  [SKIP] ${reward.type} already configured`);
      continue;
    }
    const tx = await rewardEngine.configureReward(rewardId, BigInt(reward.xp), false);
    const receipt = await tx.wait();
    console.log(`  [OK]   ${reward.type} (${reward.xp} XP) configured — tx ${receipt.hash}`);
  }

  console.log('\n=== Setup complete ===');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
