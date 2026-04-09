# 🎮 Ginix Hub - Arcade Backend + Frontend

Complete Next.js application for Ginix Arcade with backend API, frontend, and Web3 integration.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd ginix-hub
npm install
```

### 2. Set Up Database
```bash
# Create PostgreSQL database
createdb ginix_arcade

# Copy environment file
cp .env.example .env

# Edit .env with your database URL and contract addresses

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed initial data
npm run db:seed
```

### 3. Configure Contracts
After deploying contracts (see `../ginix-contracts`), copy the addresses to `.env`:
```
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_CORE_ADDRESS=0x...
NEXT_PUBLIC_MEMORY_ADDRESS=0x...
NEXT_PUBLIC_GUARD_ADDRESS=0x...
NEXT_PUBLIC_REWARD_ADDRESS=0x...
```

### 4. Add Backend Signer Key
```
BACKEND_SIGNER_KEY=your_private_key_here
```
⚠️ This should be the same address configured in the AntiCheatGuard contract.

### 5. Copy Game Builds
```bash
# Copy your game builds to public/games/
cp -r "../neon sky runner" public/games/neon-sky-runner
cp -r "../tilenova circuit surge/game_build" public/games/tilenova
```

### 6. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## 📋 API Routes

### POST /api/startSession
Start a new game session.

**Request:**
```json
{
  "wallet": "0x...",
  "gameId": "neon-sky-runner"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "nonce": "hex_string",
  "startedAt": "2024-01-01T00:00:00Z"
}
```

### POST /api/submitScore
Submit game score for validation.

**Request:**
```json
{
  "sessionId": "uuid",
  "wallet": "0x...",
  "gameId": "neon-sky-runner",
  "score": 2450,
  "duration": 92
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "score": 2450,
  "duration": 92,
  "reward": {
    "type": "NEON_BADGE",
    "rewardId": "0x...",
    "xp": 100,
    "signature": "0x...",
    "nonce": "..."
  }
}
```

### GET /api/leaderboard?gameId=neon-sky-runner&limit=100
Get game leaderboard.

**Response:**
```json
{
  "gameId": "neon-sky-runner",
  "total": 50,
  "leaderboard": [
    {
      "rank": 1,
      "wallet": "0x...",
      "walletShort": "0x1234...5678",
      "score": 5000,
      "duration": 120,
      "xp": 250,
      "achievedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 🎮 Game Integration

### In Your Game's index.html
```html
<script>
// 1. Get wallet from parent window
window.playerWallet = new URLSearchParams(window.location.search).get('wallet');

// 2. Start session when game loads
async function startGameSession() {
  const response = await fetch('/api/startSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet: window.playerWallet,
      gameId: 'neon-sky-runner'
    })
  });
  
  const session = await response.json();
  window.gameSession = session;
}

// 3. Submit score when game ends
async function submitScore(score, duration) {
  const response = await fetch('/api/submitScore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: window.gameSession.sessionId,
      wallet: window.playerWallet,
      gameId: 'neon-sky-runner',
      score,
      duration
    })
  });
  
  const result = await response.json();
  
  if (result.reward) {
    // Player earned a reward! Show notification
    showRewardNotification(result.reward);
  }
  
  return result;
}

startGameSession();
</script>
```

## 🔒 Anti-Cheat Rules

Configured in `lib/antiCheat.ts`:

- **Neon Sky Runner:**
  - Max score: 10,000
  - Min duration: 10s
  - Max score/second: 50

- **TileNova:**
  - Max score: 100,000
  - Min duration: 30s
  - Max score/second: 100

Scores violating these rules are rejected.

## 🗄️ Database Schema

- **players** - Player profiles (XP, sessions)
- **sessions** - Active game sessions (nonces)
- **leaderboard** - High scores per game
- **quests** - Available quests
- **player_quests** - Quest progress
- **achievements** - On-chain achievements
- **game_config** - Game settings

## 🔐 Security

- Rate limiting on all API routes
- Session validation (nonce prevents replay)
- Anti-cheat score validation
- Backend signature required for on-chain rewards
- Wallet verification on all requests

## 📊 Monitoring

View database:
```bash
npm run db:studio
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Environment Variables
Set all variables from `.env.example` in your deployment platform.

### Database
Use a managed PostgreSQL service:
- Vercel Postgres
- Supabase
- Railway
- Neon

## 🔄 Flow Summary

```
1. Player connects wallet (wagmi)
2. Player selects game → /games/neon-sky-runner
3. Game calls POST /api/startSession → gets nonce
4. Player plays (fully off-chain)
5. Game calls POST /api/submitScore → backend validates
6. If eligible, backend signs reward
7. Frontend calls RewardEngine.grantReward() on-chain
8. NFT/achievement minted to player wallet
```

## 📝 Next Steps

1. Deploy contracts (`cd ../ginix-contracts && npm run deploy:fuji`)
2. Copy contract addresses to `.env`
3. Set up database and run migrations
4. Add game builds to `public/games/`
5. Deploy to Vercel
6. Test complete flow!

## 🎯 Game Configuration

To add a new game:

1. Add to `lib/antiCheat.ts` (scoring rules)
2. Add to `submitScore` reward rules
3. Deploy game build to `public/games/your-game/`
4. Approve game in Registry contract
5. Configure rewards in RewardEngine contract

---

**Your Ginix Arcade is ready to launch!** 🚀
