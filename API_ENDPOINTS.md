# Ginie Arcade API Documentation

**Base URL:** `https://arcade-web-chi.vercel.app`

**Network:** Avalanche Fuji Testnet (Chain ID: 43113)

---

## Table of Contents

- [Authentication](#authentication)
- [Game Session Endpoints](#game-session-endpoints)
- [Player Data Endpoints](#player-data-endpoints)
- [Leaderboard Endpoints](#leaderboard-endpoints)
- [Smart Contract Addresses](#smart-contract-addresses)
- [Game IDs](#game-ids)
- [Badge & Achievement System](#badge--achievement-system)
- [Response Types](#response-types)

---

## Authentication

All endpoints use **wallet-based authentication**. The player's wallet address is passed as a parameter and verified against session data.

**No API keys required** - authentication is done via wallet address and session validation.

---

## Game Session Endpoints

### 1. Start Game Session

**Endpoint:** `POST /api/startSession`

**Description:** Creates a new game session with a unique nonce for anti-cheat validation.

**Request Body:**
```json
{
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "gameId": "flappy"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `wallet` | string | ✅ | Player's wallet address (Ethereum format) |
| `gameId` | string | ✅ | Game identifier (see [Game IDs](#game-ids)) |

**Response (200 OK):**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "nonce": "a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6",
  "startedAt": "2026-02-20T11:30:00.000Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | Unique session UUID (save this for score submission) |
| `nonce` | string | Cryptographic nonce for anti-cheat verification |
| `startedAt` | string | ISO 8601 timestamp of session start |

**Error Responses:**
- `400` - Missing required fields
- `429` - Rate limit exceeded (max 20 sessions per minute per wallet)
- `500` - Internal server error

---

### 2. Submit Score

**Endpoint:** `POST /api/submitScore`

**Description:** Submits game score, validates with anti-cheat, updates stats, and mints NFTs.

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "gameId": "flappy",
  "score": 42,
  "duration": 127
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | ✅ | Session UUID from `/api/startSession` |
| `wallet` | string | ✅ | Player's wallet address (must match session) |
| `gameId` | string | ❌ | Game identifier (optional, inherited from session) |
| `score` | number | ✅ | Final game score (integer) |
| `duration` | number | ✅ | Game duration in seconds |

**Response (200 OK):**
```json
{
  "success": true,
  "valid": true,
  "score": 42,
  "duration": 127,
  "reward": {
    "type": "FLAPPY_ROOKIE",
    "rewardId": 1,
    "xp": 50,
    "signature": "0x1234...",
    "nonce": "a3f2b1c4d5e6f7a8b9c0d1e2f3a4b5c6"
  },
  "newBadges": [
    {
      "id": "flappy-10",
      "name": "Pipe Dodger",
      "description": "Score 10+ in Flappy Bird",
      "tier": "bronze",
      "txHash": "0xabc...",
      "tokenId": 42
    }
  ],
  "scoreNFT": {
    "txHash": "0xdef...",
    "tokenId": 43
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Overall operation success |
| `valid` | boolean | Anti-cheat validation result |
| `score` | number | Submitted score |
| `duration` | number | Game duration in seconds |
| `reward` | object \| null | On-chain reward if eligible (first-time milestone) |
| `newBadges` | array | Newly earned badge NFTs |
| `scoreNFT` | object \| null | Score NFT minted (always minted on valid score > 0) |

**Anti-Cheat Validation:**
Scores are validated against:
- Maximum score limits per game
- Minimum duration (prevents instant submissions)
- Maximum score/second rate
- Session timing (started recently)

**Error Responses:**
- `400` - Invalid score, session already used, or anti-cheat failure
- `403` - Wallet doesn't match session
- `404` - Session not found
- `429` - Rate limit exceeded (max 30 submissions per minute)
- `500` - Internal server error

---

## Player Data Endpoints

### 3. Get Player Stats

**Endpoint:** `GET /api/playerStats?wallet={address}`

**Description:** Fetches comprehensive player statistics, achievements, badges, and recent games.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | ✅ | Player's wallet address |

**Example Request:**
```
GET /api/playerStats?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

**Response (200 OK):**
```json
{
  "xp": 450,
  "level": 5,
  "sessionsPlayed": 23,
  "achievements": [
    {
      "type": "first-game",
      "gameId": "badge",
      "txHash": "0x123..."
    }
  ],
  "recentGames": [
    {
      "gameId": "flappy",
      "score": 42,
      "duration": 127,
      "startedAt": "2026-02-20T11:30:00.000Z"
    }
  ],
  "highScores": {
    "flappy": 50,
    "neon-sky-runner": 2500,
    "tilenova": 1200,
    "sudoku": 800
  },
  "badges": [
    {
      "id": "first-game",
      "name": "First Steps",
      "description": "Play your first game",
      "icon": "🎮",
      "earned": true,
      "tier": "bronze",
      "minted": true,
      "txHash": "0x123..."
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `xp` | number | Total experience points |
| `level` | number | Player level (100 XP per level) |
| `sessionsPlayed` | number | Total valid games played |
| `achievements` | array | On-chain achievements (NFTs) |
| `recentGames` | array | Last 10 valid game sessions |
| `highScores` | object | Highest score per game |
| `badges` | array | All badges (earned + locked) with mint status |

**New Player Response:**
If wallet has never played, returns default values:
```json
{
  "xp": 0,
  "level": 1,
  "sessionsPlayed": 0,
  "achievements": [],
  "recentGames": [],
  "highScores": {},
  "badges": []
}
```

**Error Responses:**
- `400` - Missing wallet parameter
- `500` - Internal server error

---

## Leaderboard Endpoints

### 4. Get Game Leaderboard

**Endpoint:** `GET /api/leaderboard?gameId={gameId}&limit={limit}`

**Description:** Fetches top scores for a specific game.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `gameId` | string | ✅ | - | Game identifier (see [Game IDs](#game-ids)) |
| `limit` | number | ❌ | 100 | Max entries to return (1-1000) |

**Example Request:**
```
GET /api/leaderboard?gameId=flappy&limit=50
```

**Response (200 OK):**
```json
{
  "gameId": "flappy",
  "total": 50,
  "leaderboard": [
    {
      "rank": 1,
      "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "walletShort": "0x742d...f0bEb",
      "score": 85,
      "duration": 245,
      "xp": 1250,
      "sessionsPlayed": 47,
      "achievedAt": "2026-02-20T10:15:00.000Z"
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `gameId` | string | Game identifier |
| `total` | number | Number of entries returned |
| `leaderboard` | array | Ranked list of top players |

**Leaderboard Entry:**
| Field | Type | Description |
|-------|------|-------------|
| `rank` | number | Player's rank (1-indexed) |
| `wallet` | string | Full wallet address |
| `walletShort` | string | Truncated wallet for display |
| `score` | number | High score |
| `duration` | number | Duration of that game (seconds) |
| `xp` | number | Player's total XP |
| `sessionsPlayed` | number | Player's total sessions |
| `achievedAt` | string | ISO timestamp of high score |

**Error Responses:**
- `400` - Missing gameId parameter
- `500` - Internal server error

---

### 5. Get Global Leaderboard

**Endpoint:** `GET /api/leaderboard/global?limit={limit}`

**Description:** Fetches global XP leaderboard (top players across all games).

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | ❌ | 100 | Max entries to return (1-1000) |

**Example Request:**
```
GET /api/leaderboard/global?limit=25
```

**Response (200 OK):**
```json
{
  "total": 25,
  "leaderboard": [
    {
      "rank": 1,
      "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "walletShort": "0x742d...f0bEb",
      "xp": 2450,
      "level": 25,
      "sessionsPlayed": 127,
      "achievements": 12,
      "joinedAt": "2026-01-15T08:30:00.000Z"
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `total` | number | Number of entries returned |
| `leaderboard` | array | Ranked list of top players by XP |

**Global Leaderboard Entry:**
| Field | Type | Description |
|-------|------|-------------|
| `rank` | number | Global rank (1-indexed) |
| `wallet` | string | Full wallet address |
| `walletShort` | string | Truncated wallet for display |
| `xp` | number | Total experience points |
| `level` | number | Player level (XP/100 + 1) |
| `sessionsPlayed` | number | Total valid games played |
| `achievements` | number | Total minted achievements/badges |
| `joinedAt` | string | ISO timestamp of first session |

**Error Responses:**
- `500` - Internal server error

---

## Smart Contract Addresses

**Network:** Avalanche Fuji Testnet (43113)

**RPC URL:** `https://api.avax-test.network/ext/bc/C/rpc`

| Contract | Address |
|----------|---------|
| **GameNFT** (Achievement NFTs) | `0x46b510E7A089d8dbed37b945dC461936d4BDe944` |
| **GinixGameRegistry** | `0x11f41Ef35ecE2aC9F1AD429060989E7DDE23f589` |
| **GinixGameCore** | `0xeCa1F19cfbc4Fd9247e6F3E03C7C462AeC7A43f7` |
| **GinixGameMemory** | `0x9e1F450139292Bbb6404a39f985f98A68011EcE1` |
| **GinixAntiCheatGuard** | `0xdfD09cA7F6D199ccc0D0db717ccE7B365CB7A421` |
| **GinixRewardEngine** | `0x31aF2267857a3fe02F105ac2cCB71b7c4030F42B` |
| **FlappyBird Validator** | `0x06Bd23B2627DC4d9CCe42a1cE37d59F885988EFc` |
| **ArcadeToken (ERC-20)** | `0xe6aca73f2f2564006bA54E1452BD55e88A12029d` |

**Snowtrace Explorer:** `https://testnet.snowtrace.io`

---

## Game IDs

Valid `gameId` values for API requests:

| Game ID | Name | Category |
|---------|------|----------|
| `flappy` | Flappy Bird | Arcade |
| `neon-sky-runner` | Neon Sky Runner | Runner |
| `tilenova` | TileNova: Circuit Surge | Puzzle |
| `sudoku` | Sudoku: Roast Mode | Puzzle |

---

## Badge & Achievement System

### Badge Tiers

| Tier | Color | Rarity |
|------|-------|--------|
| `bronze` | 🟫 | Common |
| `silver` | ⬜ | Uncommon |
| `gold` | 🟨 | Rare |
| `platinum` | 💎 | Legendary |

### All Available Badges

**Session-Based:**
- `first-game` - First Steps (1 game) - Bronze
- `five-games` - Getting Warmed Up (5 games) - Bronze
- `ten-games` - Arcade Regular (10 games) - Silver
- `twenty-five-games` - Arcade Veteran (25 games) - Gold
- `fifty-games` - Arcade Legend (50 games) - Platinum

**XP-Based:**
- `xp-100` - XP Hunter (100 XP) - Bronze
- `xp-500` - XP Warrior (500 XP) - Silver
- `xp-1000` - XP Master (1,000 XP) - Gold

**Game-Specific:**

*Flappy Bird:*
- `flappy-10` - Pipe Dodger (10+ score) - Bronze
- `flappy-50` - Flappy Master (50+ score) - Gold

*Neon Sky Runner:*
- `neon-1000` - Neon Runner (1,000+ score) - Bronze
- `neon-10000` - Sky Legend (10,000+ score) - Gold

*TileNova:*
- `tilenova-500` - Circuit Breaker (500+ score) - Bronze
- `tilenova-5000` - Circuit Surge Master (5,000+ score) - Gold

*Sudoku:*
- `sudoku-500` - Puzzle Solver (500+ score) - Bronze
- `sudoku-1500` - Roast Survivor (1,500+ score) - Gold

**Multi-Game:**
- `all-rounder` - All-Rounder (Play all 4 games) - Silver

### NFT Minting

**All badges are auto-minted as NFTs** when earned. The API handles minting server-side.

**Score NFTs** are minted on every valid score submission (score > 0).

---

## Response Types

### Common Error Response

```json
{
  "error": "Error message description"
}
```

### Achievement Object

```json
{
  "type": "badge-id",
  "gameId": "badge",
  "txHash": "0x123..."
}
```

### Badge Object (with Mint Status)

```json
{
  "id": "first-game",
  "name": "First Steps",
  "description": "Play your first game",
  "icon": "🎮",
  "earned": true,
  "tier": "bronze",
  "minted": true,
  "txHash": "0x123..."
}
```

### NFT Mint Result

```json
{
  "txHash": "0xabc123...",
  "tokenId": 42
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/startSession` | 20 requests | 60 seconds |
| `/api/submitScore` | 30 requests | 60 seconds |
| `/api/playerStats` | No limit | - |
| `/api/leaderboard` | No limit | - |
| `/api/leaderboard/global` | No limit | - |

Rate limits are **per wallet address**.

---

## Integration Example

### Complete Game Flow

```javascript
// 1. Start session when player clicks "Play"
const sessionRes = await fetch('https://arcade-web-chi.vercel.app/api/startSession', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    gameId: 'flappy'
  })
});
const { sessionId, nonce } = await sessionRes.json();

// 2. Player plays game...
// Track: startTime, score, duration

// 3. Submit score when game ends
const submitRes = await fetch('https://arcade-web-chi.vercel.app/api/submitScore', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    gameId: 'flappy',
    score: 42,
    duration: 127
  })
});
const result = await submitRes.json();

// 4. Show results to player
if (result.success) {
  console.log('Score:', result.score);
  console.log('New badges:', result.newBadges);
  console.log('Score NFT:', result.scoreNFT);
}
```

### Fetch Player Dashboard

```javascript
const wallet = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const res = await fetch(`https://arcade-web-chi.vercel.app/api/playerStats?wallet=${wallet}`);
const stats = await res.json();

console.log('Level:', stats.level);
console.log('XP:', stats.xp);
console.log('Badges:', stats.badges.filter(b => b.earned));
```

### Fetch Leaderboard

```javascript
// Game-specific leaderboard
const gameRes = await fetch('https://arcade-web-chi.vercel.app/api/leaderboard?gameId=flappy&limit=10');
const gameLeaderboard = await gameRes.json();

// Global leaderboard
const globalRes = await fetch('https://arcade-web-chi.vercel.app/api/leaderboard/global?limit=10');
const globalLeaderboard = await globalRes.json();
```

---

## Additional Notes

### Database
The backend uses **PostgreSQL on Railway** for off-chain data storage (sessions, stats, leaderboards).

### NFT Metadata
- **Badge NFTs**: Stored as SVG images at `https://arcade-web-chi.vercel.app/badges/{badgeId}.svg`
- **Score NFTs**: Use data URIs (base64-encoded JSON metadata on-chain)

### Testnet Faucet
Get test AVAX: https://core.app/tools/testnet-faucet/?subnet=c&token=c

### Block Explorer
View transactions: https://testnet.snowtrace.io

---

**Last Updated:** February 20, 2026

**Support:** For issues or questions, check the GitHub repository or contract the development team.
