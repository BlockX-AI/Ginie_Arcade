// Contract addresses on Avalanche Fuji
export const CONTRACTS = {
  registry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`,
  core: process.env.NEXT_PUBLIC_CORE_ADDRESS as `0x${string}`,
  memory: process.env.NEXT_PUBLIC_MEMORY_ADDRESS as `0x${string}`,
  guard: process.env.NEXT_PUBLIC_GUARD_ADDRESS as `0x${string}`,
  reward: process.env.NEXT_PUBLIC_REWARD_ADDRESS as `0x${string}`,
};

// Minimal ABI for reading contract data
export const REGISTRY_ABI = [
  {
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    name: 'isApproved',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    name: 'games',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'approved', type: 'bool' },
      { name: 'uri', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const CORE_ABI = [
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getPlayerData',
    outputs: [
      { name: 'xp', type: 'uint64' },
      { name: 'sessionsPlayed', type: 'uint64' },
      { name: 'level', type: 'uint32' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'gameId', type: 'bytes32' },
    ],
    name: 'getHighScore',
    outputs: [{ name: '', type: 'uint64' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const MEMORY_ABI = [
  {
    inputs: [
      { name: 'player', type: 'address' },
      { name: 'achievementId', type: 'bytes32' },
    ],
    name: 'hasAchievement',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'player', type: 'address' }],
    name: 'getPlayerAchievements',
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const REWARD_ABI = [
  {
    inputs: [
      { name: 'nonce', type: 'bytes32' },
      { name: 'player', type: 'address' },
      { name: 'gameId', type: 'bytes32' },
      { name: 'score', type: 'uint64' },
      { name: 'duration', type: 'uint64' },
      { name: 'rewardId', type: 'bytes32' },
      { name: 'backendSig', type: 'bytes' },
    ],
    name: 'grantReward',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'rewardId', type: 'bytes32' }],
    name: 'rewards',
    outputs: [
      { name: 'xpAmount', type: 'uint64' },
      { name: 'unlockAchievement', type: 'bool' },
      { name: 'enabled', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Helper to convert game slug to bytes32
export function gameIdToBytes32(gameId: string): `0x${string}` {
  const encoder = new TextEncoder();
  const data = encoder.encode(gameId);
  const hex = Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex.padEnd(64, '0')}` as `0x${string}`;
}

// Helper to convert reward type to bytes32
export function rewardIdToBytes32(rewardId: string): `0x${string}` {
  const encoder = new TextEncoder();
  const data = encoder.encode(rewardId);
  const hex = Array.from(data)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `0x${hex.padEnd(64, '0')}` as `0x${string}`;
}
