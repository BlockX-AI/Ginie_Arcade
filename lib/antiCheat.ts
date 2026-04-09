/**
 * Anti-Cheat Validation Rules
 * Validates game scores before accepting them
 */

export interface GameRules {
  maxScore: number;
  minDuration: number;
  maxScorePerSecond: number;
}

export const GAME_RULES: Record<string, GameRules> = {
  'flappy': {
    maxScore: 500,
    minDuration: 5,
    maxScorePerSecond: 10,
  },
  'sudoku': {
    maxScore: 2500,
    minDuration: 30,
    maxScorePerSecond: 50,
  },
  'snake-io': {
    maxScore: 1000,
    minDuration: 5,
    maxScorePerSecond: 20,
  },
  'the-house': {
    maxScore: 500,
    minDuration: 60,
    maxScorePerSecond: 5,
  },
  'shooter': {
    maxScore: 10000,
    minDuration: 10,
    maxScorePerSecond: 100,
  },
  'match-three': {
    maxScore: 10000,
    minDuration: 30,
    maxScorePerSecond: 200,
  },
  'zombie-apocalypse': {
    maxScore: 5000,
    minDuration: 10,
    maxScorePerSecond: 50,
  },
  '8ball-pool': {
    maxScore: 10000,
    minDuration: 60,
    maxScorePerSecond: 100,
  },
};

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validate game score against anti-cheat rules
 */
export function validateScore(
  gameId: string,
  score: number,
  duration: number,
  sessionStartTime: Date
): ValidationResult {
  const rules = GAME_RULES[gameId];

  if (!rules) {
    return { valid: false, reason: 'Unknown game' };
  }

  // Check max score
  if (score > rules.maxScore) {
    return { valid: false, reason: `Score exceeds maximum (${rules.maxScore})` };
  }

  // Check minimum duration
  if (duration < rules.minDuration) {
    return { valid: false, reason: `Duration too short (min: ${rules.minDuration}s)` };
  }

  // Check duration matches session time
  const actualDuration = (Date.now() - sessionStartTime.getTime()) / 1000;
  const timeDiff = Math.abs(actualDuration - duration);

  // Allow small drift between client-reported time and server wall-clock time
  // (tab throttling, iframe scheduling, rounding, etc.)
  if (timeDiff > 12) {
    return { valid: false, reason: 'Duration mismatch with session time' };
  }

  // Check score/time ratio
  const scorePerSecond = score / duration;
  if (scorePerSecond > rules.maxScorePerSecond) {
    return {
      valid: false,
      reason: `Score rate too high (${scorePerSecond.toFixed(1)}/s, max: ${rules.maxScorePerSecond}/s)`,
    };
  }

  // Check for impossible scores (negative, NaN, etc.)
  if (score < 0 || !Number.isFinite(score)) {
    return { valid: false, reason: 'Invalid score value' };
  }

  return { valid: true };
}

/**
 * Generate random nonce for session
 */
export function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Check rate limiting (simple in-memory implementation)
 * In production, use Redis
 */
const rateLimitStore = new Map<string, number[]>();

export function checkRateLimit(
  walletAddress: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = walletAddress;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, [now]);
    return true;
  }

  const timestamps = rateLimitStore.get(key)!;
  const validTimestamps = timestamps.filter(ts => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitStore.set(key, validTimestamps);

  return true;
}
