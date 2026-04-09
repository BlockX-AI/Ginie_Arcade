/**
 * In-memory fallback store used when DATABASE_URL is not configured.
 * Persists across Next.js hot-reloads in dev via globalThis.
 */

export interface MemSession {
  id: string;
  walletAddress: string;
  gameId: string;
  nonce: string;
  startedAt: Date;
  endedAt?: Date;
  score?: number;
  duration?: number;
  valid: boolean;
}

const g = global as unknown as {
  __ginixMemSessions?: Map<string, MemSession>;
  __ginixMemScores?: Map<string, number>;
};

if (!g.__ginixMemSessions) g.__ginixMemSessions = new Map<string, MemSession>();
if (!g.__ginixMemScores) g.__ginixMemScores = new Map<string, number>();

export const memSessions: Map<string, MemSession> = g.__ginixMemSessions;
/** key: `${wallet}:${gameId}` → best score */
export const memScores: Map<string, number> = g.__ginixMemScores;

export function isDbAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}
