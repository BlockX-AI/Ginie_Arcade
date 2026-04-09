# Backend Documentation

## Location
Root-level Next.js app: `app/api/`

## Stack
- **Runtime:** Next.js (Node.js)
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Wallet-based (no traditional auth)
- **NFTs:** Server-side minting via ethers.js

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/startSession` | POST | Create game session with nonce |
| `/api/submitScore` | POST | Validate score + anti-cheat + mint NFTs + sign for on-chain |
| `/api/playerStats` | GET | Player stats, badges, achievements, recent games |
| `/api/leaderboard` | GET | Per-game leaderboard |
| `/api/leaderboard/global` | GET | Global XP leaderboard |
| `/api/nfts` | GET | Fetch player's on-chain NFTs |
| `/api/health` | GET | Health check (DB, signer, NFT config) |

## Key Libraries
- `lib/antiCheat.ts` — Off-chain score validation rules + rate limiting
- `lib/signer.ts` — Backend cryptographic signing for on-chain rewards
- `lib/nftMinter.ts` — Server-side badge and score NFT minting
- `lib/badgeTokenURIs.ts` — IPFS badge metadata URIs
- `lib/contracts.ts` — Contract ABIs and addresses
- `lib/db.ts` — Prisma client singleton
- `lib/games.ts` — Game definitions and metadata

## Database Schema
Defined in `prisma/schema.prisma`:
- **Player** — Wallet, XP, sessions count
- **Session** — Game sessions with nonce anti-cheat
- **Leaderboard** — High scores per game per player
- **Quest** — Available quests with requirements
- **PlayerQuest** — Quest progress tracking
- **Achievement** — On-chain achievements with tx hashes
- **GameConfig** — Per-game anti-cheat parameters

## Environment Variables
See `.env.example` for required configuration.

## Security
- Rate limiting on session start (20/min) and score submit (30/min)
- Session nonce prevents replay attacks
- Anti-cheat validates: max score, min duration, score/sec rate, session timing
- Backend signature required for on-chain reward claims
- Wallet address verification on all requests

## Database Setup
```bash
# Option 1: Use setup script
./setup-database.sh

# Option 2: Manual
cp .env.example .env
# Edit .env with your DATABASE_URL
npx prisma generate
npx prisma db push
npm run db:seed
```
