# Ginie Arcade — Deployment Guide

## Quick Status

| Component | Status |
|-----------|--------|
| All games playable locally | ✅ |
| API routes (no DB needed locally) | ✅ |
| Reward detection + XP | ✅ |
| NFT minting (needs auth fix) | ⚠️ |
| On-chain reward claiming | ✅ (needs wallet) |
| Production deployment (Vercel) | 📋 See below |

---

## Step 1 — Fix NFT Minting Authorization (One-time)

The backend signer wallet must be whitelisted on the GameNFT contract by the original deployer.

**Your backend signer address:** `0x796f0dbcF25454cb5e8c5D7d5682Ec2Da7902b6b`  
**GameNFT contract:** `0x46b510E7A089d8dbed37b945dC461936d4BDe944` (Avalanche Fuji)

### Option A — Run the authorize script (recommended)
```bash
# Replace <deployer_private_key> with the key used to deploy the contracts
OWNER_KEY=<deployer_private_key> node scripts/authorize-minter.js
```

### Option B — Via the API endpoint
```bash
curl -X POST http://localhost:3000/api/nft/authorize \
  -H "Content-Type: application/json" \
  -d '{"ownerKey":"<deployer_private_key>"}'
```

### Verify authorization
```bash
curl http://localhost:3000/api/nft/authorize
# Returns: { "authorized": true, "signerAddress": "0x...", "owner": "0x..." }
```

---

## Step 2 — Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template (already done — .env.local exists)
# Edit .env.local and fill in:
#   BACKEND_SIGNER_KEY=<your_wallet_private_key>
#   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<from cloud.walletconnect.com>

# 3. Build match-three game (if not done)
cd match-three-game-main && npm install && npm run build
cp -r build/ ../public/games/match-three/

# 4. Start dev server
npm run dev
```

Open http://localhost:3000

---

## Step 3 — Production Database (PostgreSQL)

For production, set up a PostgreSQL database (Neon, Supabase, or Railway recommended).

```bash
# In .env.local (local) or Vercel env vars (production):
DATABASE_URL="postgresql://user:password@host:5432/ginix_arcade"

# Run database migrations
npx prisma generate
npx prisma db push
```

Without `DATABASE_URL`, the app uses an **in-memory fallback** (resets on restart).

---

## Step 4 — Deploy to Vercel

### Prerequisites
- Vercel account at https://vercel.com
- PostgreSQL database (Neon recommended — free tier)

### Deploy steps

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time — creates new project)
vercel

# Follow prompts:
#   - Link to existing project or create new
#   - Framework: Next.js (auto-detected)
#   - Root directory: ./  (leave default)
```

### Set Environment Variables on Vercel

Go to **Vercel Dashboard → Project → Settings → Environment Variables** and add:

```
DATABASE_URL                        = postgresql://...  (from Neon/Supabase)
BACKEND_SIGNER_KEY                  = <your_private_key>
NEXT_PUBLIC_NFT_ADDRESS             = 0x46b510E7A089d8dbed37b945dC461936d4BDe944
NEXT_PUBLIC_REGISTRY_ADDRESS        = 0x11f41Ef35ecE2aC9F1AD429060989E7DDE23f589
NEXT_PUBLIC_CORE_ADDRESS            = 0xeCa1F19cfbc4Fd9247e6F3E03C7C462AeC7A43f7
NEXT_PUBLIC_MEMORY_ADDRESS          = 0x9e1F450139292Bbb6404a39f985f98A68011EcE1
NEXT_PUBLIC_GUARD_ADDRESS           = 0xdfD09cA7F6D199ccc0D0db717ccE7B365CB7A421
NEXT_PUBLIC_REWARD_ADDRESS          = 0x31aF2267857a3fe02F105ac2cCB71b7c4030F42B
NEXT_PUBLIC_ARCADE_TOKEN_ADDRESS    = 0xe6aca73f2f2564006bA54E1452BD55e88A12029d
NEXT_PUBLIC_CHAIN_ID                = 43113
NEXT_PUBLIC_RPC_URL                 = https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = <from cloud.walletconnect.com>
NEXT_PUBLIC_APP_URL                 = https://your-project.vercel.app
```

### Deploy production build
```bash
vercel --prod
```

---

## Step 5 — After Production Deploy

### Run database migrations
```bash
# Set DATABASE_URL to your production DB
DATABASE_URL="postgresql://..." npx prisma db push
```

### Re-authorize the backend signer on production
If the `BACKEND_SIGNER_KEY` on Vercel is different from your local one, run:
```bash
OWNER_KEY=<deployer_key> node scripts/authorize-minter.js
```

---

## Architecture Overview

```
Browser
  └── Next.js App (Vercel)
        ├── /                    Homepage with game grid
        ├── /library             All games
        ├── /play/[gameId]       Game iframe + session management
        │     ├── startSession   POST /api/startSession  →  DB or in-memory
        │     └── submitScore    POST /api/submitScore   →  DB or in-memory
        │                              └── mintScoreNFT  →  Avalanche Fuji (GameNFT contract)
        ├── /dashboard           Player XP, badges, NFTs
        └── /api/
              ├── startSession        Create game session
              ├── submitScore         Submit score + mint NFT
              ├── leaderboard         Per-game leaderboard
              ├── leaderboard/global  XP leaderboard
              ├── playerStats         Player achievements
              ├── nfts                Fetch player NFTs
              └── nft/authorize       [Admin] Authorize backend signer

Games (static, served from /public/games/)
  ├── flappy            Phaser 3 game
  ├── match-three       React CRA game (rebuilt from match-three-game-main/)
  ├── snake-io          HTML5 game
  ├── sudoku            HTML5 game
  ├── zombie-apocalypse HTML5 game
  ├── 8ball-pool        HTML5 game
  ├── the-house-game    HTML5 game
  └── shooter           Three.js game

On-chain (Avalanche Fuji Testnet - 43113)
  ├── GameNFT           0x46b510E7A089d8dbed37b945dC461936d4BDe944
  ├── RewardEngine      0x31aF2267857a3fe02F105ac2cCB71b7c4030F42B
  ├── AntiCheatGuard    0xdfD09cA7F6D199ccc0D0db717ccE7B365CB7A421
  ├── GameRegistry      0x11f41Ef35ecE2aC9F1AD429060989E7DDE23f589
  ├── GameCore          0xeCa1F19cfbc4Fd9247e6F3E03C7C462AeC7A43f7
  ├── GameMemory        0x9e1F450139292Bbb6404a39f985f98A68011EcE1
  └── ArcadeToken (ERC-20) 0xe6aca73f2f2564006bA54E1452BD55e88A12029d
```

---

## Checklist Before Going Live

- [ ] `BACKEND_SIGNER_KEY` set and authorized on GameNFT contract
- [ ] `DATABASE_URL` set (PostgreSQL) and migrations run
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` set
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] All games tested: flappy, match-three, snake-io, sudoku, zombie, 8ball, the-house, shooter
- [ ] NFT mint tested on Fuji testnet
- [ ] On-chain reward claim tested
- [ ] Leaderboard and dashboard pages verified

---

## WalletConnect Project ID

Get a free project ID at https://cloud.walletconnect.com:
1. Sign up / log in
2. Create a new project
3. Copy the Project ID
4. Add to `.env.local`: `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_id_here`
