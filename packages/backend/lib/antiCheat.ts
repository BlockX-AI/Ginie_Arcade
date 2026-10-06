/**
 * @deprecated This file is a legacy duplicate. The canonical version lives at:
 * apps/arcade-web/lib/antiCheat.ts
 *
 * Anti-Cheat Validation Rules
 * Validates game scores before accepting them
 */

export interface GameRules {
  maxScore: number;
  minDuration: number;
  maxScorePerSecond: number;
}

export const GAME_RULES: Record<string, GameRules> = {
  'neon-sky-runner': {
    maxScore: 1000000,
    minDuration: 5,
    maxScorePerSecond: 500,
  },
  'tilenova': {
    maxScore: 100000,
    minDuration: 30,
    maxScorePerSecond: 100,
  },
  'flappy': {
    maxScore: 500,
    minDuration: 5,
    maxScorePerSecond: 10,
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
  
  if (timeDiff > 5) {
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
