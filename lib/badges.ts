/**
 * Badge definitions and on-chain token ID allocation.
 *
 * TOKEN ID NAMESPACES (do not change existing values — the NFT mint PDA is derived
 * from [b"nft", player, token_id], so changing an ID orphans already-minted NFTs):
 *
 *   1000 – 1999        Achievement badges (this file)
 *   2_000_000+         Score NFTs (see lib/nftMinter.ts scoreTokenId)
 *   3000 – 3999        Avatar tiers (reserved, not implemented yet)
 *   4000 – 4999        Streak milestones (reserved, not implemented yet)
 *   9_000_000+         Throwaway ids for devnet smoke tests only
 */

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface BadgeDef {
  /** Stable slug, also used for the art filename: public/badges/<id>.png */
  id: string;
  /** Immutable on-chain token id. Never reuse or reorder. */
  tokenId: number;
  name: string;
  description: string;
  tier: BadgeTier;
  category: string;
  /** Threshold value surfaced as NFT metadata. */
  value: number;
  /** Earned check: (sessionsPlayed, xp, highScoresByGameId) => earned */
  check: (sessions: number, xp: number, highScores: Record<string, number>) => boolean;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first-game', tokenId: 1001, name: 'First Steps', description: 'Play your first game', tier: 'bronze', category: 'session', value: 1, check: (s) => s >= 1 },
  { id: 'five-games', tokenId: 1002, name: 'Getting Warmed Up', description: 'Play 5 games', tier: 'bronze', category: 'session', value: 5, check: (s) => s >= 5 },
  { id: 'ten-games', tokenId: 1003, name: 'Arcade Regular', description: 'Play 10 games', tier: 'silver', category: 'session', value: 10, check: (s) => s >= 10 },
  { id: 'twenty-five-games', tokenId: 1004, name: 'Arcade Veteran', description: 'Play 25 games', tier: 'gold', category: 'session', value: 25, check: (s) => s >= 25 },
  { id: 'fifty-games', tokenId: 1005, name: 'Arcade Legend', description: 'Play 50 games', tier: 'platinum', category: 'session', value: 50, check: (s) => s >= 50 },
  { id: 'xp-100', tokenId: 1006, name: 'XP Hunter', description: 'Earn 100 XP', tier: 'bronze', category: 'xp', value: 100, check: (_s, x) => x >= 100 },
  { id: 'xp-500', tokenId: 1007, name: 'XP Warrior', description: 'Earn 500 XP', tier: 'silver', category: 'xp', value: 500, check: (_s, x) => x >= 500 },
  { id: 'xp-1000', tokenId: 1008, name: 'XP Master', description: 'Earn 1,000 XP', tier: 'gold', category: 'xp', value: 1000, check: (_s, x) => x >= 1000 },
  { id: 'flappy-10', tokenId: 1009, name: 'Pipe Dodger', description: 'Score 10+ in Flappy Bird', tier: 'bronze', category: 'flappy', value: 10, check: (_s, _x, h) => (h['flappy'] || 0) >= 10 },
  { id: 'flappy-50', tokenId: 1010, name: 'Flappy Master', description: 'Score 50+ in Flappy Bird', tier: 'gold', category: 'flappy', value: 50, check: (_s, _x, h) => (h['flappy'] || 0) >= 50 },
  { id: 'sudoku-500', tokenId: 1011, name: 'Puzzle Solver', description: 'Score 500+ in Sudoku: Neural Grid', tier: 'bronze', category: 'sudoku', value: 500, check: (_s, _x, h) => (h['sudoku'] || 0) >= 500 },
  { id: 'sudoku-1500', tokenId: 1012, name: 'Grid Survivor', description: 'Score 1,500+ in Sudoku: Neural Grid', tier: 'gold', category: 'sudoku', value: 1500, check: (_s, _x, h) => (h['sudoku'] || 0) >= 1500 },
  { id: 'snake-50', tokenId: 1013, name: 'Snake Hatchling', description: 'Reach length 50 in Snake.io', tier: 'bronze', category: 'snake', value: 50, check: (_s, _x, h) => (h['snake-io'] || 0) >= 50 },
  { id: 'snake-100', tokenId: 1014, name: 'Serpent Slayer', description: 'Reach length 100 in Snake.io', tier: 'silver', category: 'snake', value: 100, check: (_s, _x, h) => (h['snake-io'] || 0) >= 100 },
  { id: 'snake-200', tokenId: 1015, name: 'Viper King', description: 'Reach length 200 in Snake.io', tier: 'gold', category: 'snake', value: 200, check: (_s, _x, h) => (h['snake-io'] || 0) >= 200 },
  { id: 'snake-500', tokenId: 1016, name: 'Anaconda Legend', description: 'Reach length 500 in Snake.io', tier: 'platinum', category: 'snake', value: 500, check: (_s, _x, h) => (h['snake-io'] || 0) >= 500 },
  { id: 'all-rounder', tokenId: 1017, name: 'All-Rounder', description: 'Play all games', tier: 'silver', category: 'multi', value: 3, check: (_s, _x, h) => Object.keys(h).length >= 3 },
];

export function getBadgeById(id: string): BadgeDef | undefined {
  return BADGE_DEFS.find((b) => b.id === id);
}
