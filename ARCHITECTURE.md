# Ginix Arcade — E2E System & Security Architecture

> Production-grade web3 arcade platform on Solana with on-chain reward claiming,
> anti-cheat score validation, NFT achievements, and leaderboard system.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Next.js   │  │ Solana    │  │ Game     │  │ Wallet Adapter     │  │
│  │ App Router│  │ RPC       │  │ Iframe   │  │ (Phantom/Solflare) │  │
│  └─────┬─────┘  └─────┬─────┘  └────┬─────┘  └─────────┬──────────┘  │
│        │              │             │                   │             │
│        ▼              ▼             ▼                   ▼             │
└────────┬──────────────┴─────────────┴───────────────────┴─────────────┘
         │              │             │                   │
         ▼              ▼             │                   ▼
┌────────────────┐  ┌────────┐       │          ┌──────────────────┐
│ Next.js API    │  │ Solana │       │          │ Solana Wallet    │
│ Routes         │  │ Devnet │       │          │ (signs tx)       │
│ (Vercel)       │  │ RPC    │       │          └──────────────────┘
└───────┬────────┘  └───┬────┘       │
        │               │             │
        ▼               ▼             │
┌────────────────┐  ┌───────────┐    │
│ PostgreSQL     │  │ Solana    │    │
│ (Railway)      │  │ Program   │    │
│                │  │ (Anchor)  │    │
│ - Players      │  └───────────┘    │
│ - Sessions     │                    │
│ - Leaderboards │                    │
│ - Achievements │                    │
│ - Quests       │                    │
└────────────────┘                    │
                                      │
                              ┌───────┴────────┐
                              │ Game HTML5     │
                              │ (iframe)       │
                              │ postMessage    │
                              │ scoreUpdate    │
                              │ gameEnd         │
                              └────────────────┘
```

### Components

| Component | Tech | Purpose |
|-----------|------|---------|
| **Frontend** | Next.js 15 App Router, React 19, Tailwind | Game library, play page, dashboard, leaderboard UI |
| **Wallet** | `@solana/wallet-adapter-react` + Phantom/Solflare | Connect wallet, sign transactions, identify player |
| **Game Runtime** | HTML5 games in sandboxed iframes | Games communicate via `postMessage` API |
| **API Layer** | Next.js API Routes (serverless on Vercel) | Session management, score validation, reward signing |
| **Database** | PostgreSQL via Prisma ORM | Off-chain state: players, sessions, leaderboards, quests |
| **Solana Program** | Anchor (`ginix_arcade`) | On-chain: game registry, sessions, reward minting |
| **NFT System** | Metaplex (Solana) | Achievement badges, score NFTs as SPL tokens |
| **Backend Signer** | Solana Keypair (server-side) | Signs validated game results for on-chain verification |
| **Anti-Cheat** | Server-side validation rules | Score limits, time checks, rate limiting |

---

## 2. End-to-End Game Flow

```
Player connects Phantom wallet
         │
         ▼
┌─────────────────┐
│ 1. Start Session │  POST /api/startSession
│                  │  → Creates Player record (if new)
│                  │  → Generates 32-byte nonce
│                  │  → Creates Session in DB (valid=true)
│                  │  → Returns { sessionId, nonce }
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Play Game     │  Iframe loads with ?sessionId=&nonce=&wallet=
│                  │  Game runs, sends postMessage({ type: 'scoreUpdate', score })
│                  │  Client tracks elapsed time via wall clock
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Game End      │  Game sends postMessage({ type: 'gameEnd', score })
│                  │  OR player clicks "End & Submit"
│                  │  → Client calls POST /api/submitScore
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 4. Server-Side Validation (submitScore)          │
│                                                  │
│  a. Verify session exists & belongs to wallet    │
│  b. Check session not already ended              │
│  c. Anti-cheat validation:                      │
│     - Score ≤ maxScore for game                  │
│     - Duration ≥ minDuration                     │
│     - Duration matches server wall-clock (±12s) │
│     - Score/second ≤ maxScorePerSecond           │
│     - Score is finite & non-negative              │
│  d. If FAIL → mark session invalid, return 422  │
│  e. If PASS → update session, player stats,      │
│     leaderboard, quests                         │
│  f. Check reward eligibility (achievement-based) │
│  g. Backend signs game result (Ed25519)          │
│  h. Mint badge NFTs if newly earned             │
│  i. Return { reward, signature, xp, badges }     │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│ 5. On-Chain Claim (client-initiated)             │
│                                                  │
│  Player clicks "Claim On-Chain"                  │
│  → Client builds Transaction with:               │
│     [1] end_session(score, valid_signature=true)  │
│     [2] claim_reward(amount)                     │
│  → Phantom signs the transaction                 │
│  → Transaction sent to Solana devnet             │
│  → Program verifies backend signature on-chain  │
│  → Program mints SPL reward tokens to player ATA │
│  → Client shows tx hash + explorer link          │
└──────────────────────────────────────────────────┘
```

---

## 3. Solana On-Chain Program Design

### Current Program (`ginix_arcade`)

```rust
// Program ID: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS

// Instructions:
initialize_game(game_id: String)     → Creates Game PDA
start_session()                      → Creates GameSession PDA
end_session(score: u64, sig: bool)   → Records score, marks inactive
claim_reward(amount: u64)            → Mints SPL tokens to player

// Accounts (PDAs):
Game:          [b"game", game_id]
GameSession:   [b"session", player, game]
Authority:     [b"authority"]
```

### Required Fixes (Security)

#### Fix 1: `end_session` — Verify Backend Signature On-Chain

The current program accepts `valid_signature: bool` without verifying it.
This must be changed to verify an actual Ed25519 signature.

```rust
pub fn end_session(
    ctx: Context<EndSession>,
    score: u64,
    backend_signature: [u8; 64],
) -> Result<()> {
    // Reconstruct the message that was signed
    let message = [
        &ctx.accounts.session.nonce[..],      // 32 bytes
        &ctx.accounts.player.key.to_bytes(),  // 32 bytes
        &ctx.accounts.session.game.to_bytes(),// 32 bytes
        &score.to_le_bytes(),                 // 8 bytes
    ].concat();

    // Verify signature using the instruction_sysvar or ed25519_program
    // The backend signer's public key is stored in the Game account
    let backend_pubkey = ctx.accounts.game.backend_pubkey;

    // Use Solana's ed25519_signature_verification via sysvar
    // OR use a CPI to the Ed25519 program
    require!(
        verify_ed25519(&backend_pubkey, &message, &backend_signature),
        ArcadeError::AntiCheatValidationFailed
    );

    let session = &mut ctx.accounts.session;
    session.score = score;
    session.end_time = Clock::get()?.unix_timestamp;
    session.is_active = false;
    Ok(())
}
```

#### Fix 2: `claim_reward` — PDA Authority Instead of Signer

The current program uses `Signer<'info>` for authority, but the client passes a PDA.
Change to PDA verification:

```rust
#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,

    #[account(mut)]
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"authority"],
        bump,
        // Store the bump in Game or a config account
    )]
    pub authority: AccountInfo<'info>,  // PDA, not Signer

    pub token_program: Program<'info, Token>,
}

pub fn claim_reward(ctx: Context<ClaimReward>, amount: u64) -> Result<()> {
    // Verify the amount matches what was earned
    // (requires passing session account or a claim record)
    let cpi_accounts = token::MintTo {
        mint: ctx.accounts.reward_mint.to_account_info(),
        to: ctx.accounts.player_token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let seeds = &[b"authority".as_ref(), &[ctx.bumps.authority]];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, seeds);
    token::mint_to(cpi_ctx, amount)?;
    Ok(())
}
```

#### Fix 3: Add `claim_record` to Prevent Double-Claiming

```rust
#[account]
pub struct ClaimRecord {
    pub player: Pubkey,
    pub session: Pubkey,
    pub amount: u64,
    pub claimed_at: i64,
    pub is_claimed: bool,
}
// PDA: [b"claim", player, session]
```

---

## 4. Security Architecture

### Layer 1: Client Authentication

```
┌──────────────────────────────────────────────────┐
│ Wallet Connection = Authentication                │
│                                                   │
│ 1. Player connects Phantom wallet                 │
│ 2. Client requests wallet to sign a challenge     │
│    message: "ginix-arcade-auth-{timestamp}"       │
│ 3. Client sends { wallet, signature } to API      │
│ 4. API verifies signature using                   │
│    nacl.sign.detached.verify(msg, sig, pubkey)     │
│ 5. API issues a session JWT (httpOnly cookie)      │
│ 6. All subsequent API calls include the JWT        │
└──────────────────────────────────────────────────┘
```

### Layer 2: Session Integrity

```
┌──────────────────────────────────────────────────┐
│ Session Lifecycle (Server-Side)                   │
│                                                   │
│ startSession:                                      │
│   - Verify JWT (wallet owns this address)          │
│   - Generate 32-byte random nonce                  │
│   - Create Session { id, wallet, gameId, nonce }  │
│   - Rate limit: 20 sessions/min per wallet         │
│                                                   │
│ submitScore:                                       │
│   - Verify JWT matches session.walletAddress       │
│   - Check session.endedAt is null (not replayed)  │
│   - Anti-cheat validation (see Layer 3)           │
│   - Mark session ended (prevents double-submit)    │
│                                                   │
│ claimReward (on-chain):                            │
│   - Only available if server returned signature    │
│   - On-chain program verifies backend signature    │
│   - ClaimRecord PDA prevents double-claim          │
└──────────────────────────────────────────────────┘
```

### Layer 3: Anti-Cheat Validation

```
┌──────────────────────────────────────────────────┐
│ Server-Side Score Validation                       │
│                                                   │
│ Per-Game Rules (stored in DB / code):              │
│   maxScore:         Hard ceiling (e.g. 500)        │
│   minDuration:      Minimum play time (e.g. 5s)    │
│   maxScorePerSecond: Score rate limit (e.g. 10/s)  │
│                                                   │
│ Checks:                                            │
│   1. score ≤ maxScore                             │
│   2. duration ≥ minDuration                       │
│   3. |server_time - client_duration| ≤ 12s        │
│   4. score / duration ≤ maxScorePerSecond         │
│   5. score ≥ 0 && Number.isFinite(score)          │
│   6. Rate limit: 30 submissions/min per wallet    │
│                                                   │
│ On Failure:                                        │
│   - Session marked invalid                         │
│   - Score NOT recorded                             │
│   - Return 422 with reason                         │
│   - Log to monitoring (repeated failures = ban)   │
└──────────────────────────────────────────────────┘
```

### Layer 4: On-Chain Verification

```
┌──────────────────────────────────────────────────┐
│ Solana Program Security                            │
│                                                   │
│ end_session:                                       │
│   - Player must sign (Signer)                     │
│   - Session must belong to player (has_one)       │
│   - Backend Ed25519 signature verified on-chain   │
│   - Score recorded immutably                       │
│                                                   │
│ claim_reward:                                      │
│   - Authority PDA (not arbitrary signer)          │
│   - ClaimRecord prevents double-claim             │
│   - Amount must match session score               │
│   - SPL mint authority = program PDA              │
│                                                   │
│ Game account:                                      │
│   - Stores backend_pubkey for verification         │
│   - Only owner can initialize games               │
└──────────────────────────────────────────────────┘
```

### Layer 5: Rate Limiting (Production)

```
┌──────────────────────────────────────────────────┐
│ Redis-Based Rate Limiting (Upstash)                │
│                                                   │
│ startSession:  20 req/min per wallet              │
│ submitScore:   30 req/min per wallet              │
│ playerStats:   60 req/min per IP                  │
│ leaderboard:   60 req/min per IP                  │
│ nfts:          30 req/min per wallet              │
│                                                   │
│ Implementation: sliding window counter             │
│ Key: ratelimit:{endpoint}:{wallet|ip}             │
│ TTL: 60s                                          │
└──────────────────────────────────────────────────┘
```

---

## 5. API Design

### Authentication Flow

```
POST /api/auth
  Body: { wallet: string, signature: string, message: string }
  → Verifies Ed25519 signature
  → Returns JWT (httpOnly cookie, 24h expiry)

All protected endpoints require:
  Cookie: ginix-auth=<JWT>
  OR
  Header: Authorization: Bearer <JWT>
```

### Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth` | None | Verify wallet signature, issue JWT |
| POST | `/api/startSession` | JWT | Create game session |
| POST | `/api/submitScore` | JWT | Submit & validate score |
| GET | `/api/playerStats?wallet=` | JWT | Player dashboard data |
| GET | `/api/leaderboard?gameId=&limit=` | None | Game leaderboard |
| GET | `/api/nfts?wallet=` | JWT | Player's NFT collection |
| POST | `/api/claimReward` | JWT | (Optional) Server-assisted claim |

### `submitScore` Response Shape

```typescript
{
  success: boolean;
  valid: boolean;
  score: number;
  duration: number;
  xpEarned: number;          // baseXp + rewardXp
  reward: {
    type: string;            // "FLAPPY_ROOKIE"
    rewardId: string;        // hex seed
    xp: number;             // bonus XP
    signature: string;       // Ed25519 sig (base58) for on-chain claim
    nonce: string;           // session nonce
  } | null;
  newBadges: Array<{
    id: string;
    name: string;
    tier: string;
    txHash?: string;
  }>;
  scoreNFT: {
    txHash: string;
    tokenId: number;
  } | null;
  mintStatus: 'success' | 'failed' | 'unavailable' | 'skipped_not_highscore';
}
```

---

## 6. Database Schema (Current + Recommended Additions)

### Current Schema (Good)

```prisma
Player        // walletAddress (PK), xp, sessionsPlayed
Session       // id (PK), walletAddress (FK), gameId, nonce, score, duration, valid
Leaderboard   // gameId + walletAddress (unique), score, duration
Quest         // id (PK), name, xpReward, requirementType, requirementValue
PlayerQuest   // walletAddress + questId (PK), progress, completed
Achievement   // id (PK), walletAddress, gameId, type, rewardId, txHash
GameConfig    // gameId (PK), name, slug, maxScore, minDuration, maxScorePerSecond
```

### Recommended Additions

```prisma
// Track on-chain claims to prevent double-claiming
model ClaimRecord {
  id            Int      @id @default(autoincrement())
  walletAddress String   @map("wallet_address")
  sessionId     String   @map("session_id")
  txHash        String   @unique @map("tx_hash")
  amount        Int
  claimedAt     DateTime @default(now()) @map("claimed_at")

  @@unique([walletAddress, sessionId])  // One claim per session
  @@index([walletAddress])
  @@map("claim_records")
}

// Store game rules in DB instead of hardcoded
// (GameConfig already exists but isn't used by antiCheat.ts)

// Track suspicious activity
model SuspiciousActivity {
  id            Int      @id @default(autoincrement())
  walletAddress String   @map("wallet_address")
  type          String   // "score_manipulation", "replay", "bot"
  details       String
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([walletAddress])
  @@map("suspicious_activity")
}
```

---

## 7. NFT & Reward System

### Current State (Broken)

```
nftMinter.ts → uses ethers.js (EVM) → crashes on Solana addresses
```

### Target Architecture (Solana Metaplex)

```
┌──────────────────────────────────────────────────┐
│ NFT Minting Pipeline (Server-Side)                │
│                                                   │
│ Badge NFT (Achievement-based):                     │
│   1. Player earns badge (e.g., "first-game")      │
│   2. Server builds metadata JSON (name, image)     │
│   3. Upload metadata to Arweave/IPFS              │
│   4. Server creates Metaplex NFT:                  │
│      - Mint account (new SPL token)               │
│      - Metadata account (Metaplex PDA)             │
│      - Master edition (optional)                  │
│      - Mint to player's ATA                       │
│   5. Record txHash in Achievement table            │
│                                                   │
│ Score NFT (High-score milestone):                  │
│   - Only on NEW personal high score                │
│   - Metadata includes score, game, duration       │
│   - Same Metaplex pipeline                        │
│                                                   │
│ Reward Tokens (SPL fungible):                       │
│   - claim_reward instruction mints to player ATA  │
│   - Amount = reward.xp from achievement            │
│   - Uses program PDA as mint authority             │
└──────────────────────────────────────────────────┘
```

### NFT Fetching (Already Migrated)

```
GET /api/nfts?wallet=<base58>
  → Connection.getParsedTokenAccountsByOwner()
  → Filter: amount=1, decimals=0 (NFTs only)
  → For each mint: derive Metaplex metadata PDA
  → Fetch + decode on-chain metadata
  → Fetch off-chain JSON from URI
  → Return { tokenId, name, image, badgeId, explorer }
```

---

## 8. Game Integration Protocol

### Iframe Communication

```
Parent (Next.js)                    Iframe (Game)
     │                                  │
     │  src=/games/flappy/index.html     │
     │  ?sessionId=xxx&nonce=yyy         │
     │  &wallet=zzz                      │
     │─────────────────────────────────►│
     │                                  │
     │  postMessage({                    │
     │    type: 'scoreUpdate',           │
     │    score: 42                      │
     │  })                              │
     │◄─────────────────────────────────│
     │                                  │
     │  postMessage({                    │
     │    type: 'gameEnd',               │
     │    score: 42                      │
     │  })                              │
     │◄─────────────────────────────────│
     │                                  │
     │  Client auto-submits to API      │
     │  POST /api/submitScore           │
     │                                  │
```

### Games Currently Integrated

| Game | Slug | Anti-Cheat Rules | Rewards | Status |
|------|------|-----------------|---------|--------|
| Flappy Bird | `flappy` | max:500, min:5s, 10/s | FLAPPY_ROOKIE, PIPE_MASTER | ✅ Working |
| Sudoku | `sudoku` | max:2500, min:30s, 50/s | PUZZLE_SOLVER, LOGIC_MASTER, NEURAL_GENIUS | ✅ Working |
| Snake.io | `snake-io` | max:1000, min:5s, 20/s | — | ✅ Working |
| The House | `the-house` | max:500, min:60s, 5/s | — | ✅ Working |
| Shooter | `shooter` | max:10000, min:10s, 100/s | — | ✅ Working |
| 8 Ball Pool | `8ball-pool` | max:10000, min:60s, 100/s | POOL_ROOKIE, BILLIARD_PRO, POOL_CHAMPION | ✅ Working |
| Zombie Apocalypse | `zombie-apocalypse` | max:5000, min:10s, 50/s | ZOMBIE_HUNTER, ZOMBIE_SLAYER, APOCALYPSE_SURVIVOR | ✅ Working |
| Aether Blade | `aether-blade` | max:50000, min:5s, 500/s | — | ✅ Working |
| Eclipse | `eclipse` | max:50000, min:5s, 500/s | — | ✅ Working |
| Project Abyss | `project-abyss` | max:50000, min:5s, 500/s | — | ✅ Working |
| Neon Sky Runner | `neon-sky-runner` | ❌ Missing rules | — | ⚠️ Manual score entry |
| 8 Ball Pool | `8ball-pool` | ✅ Has rules | ✅ Has rewards | ✅ |

### Missing Anti-Cheat Rules

```typescript
// Need to add to GAME_RULES:
'neon-sky-runner': { maxScore: 99999, minDuration: 10, maxScorePerSecond: 100 },
```

---

## 9. Reward Economy

### XP System

```
Base XP (every valid game):
  xpEarned = max(10, score * 10)

Reward XP (achievement-based, one-time):
  FLAPPY_ROOKIE (score ≥ 10):     +50 XP
  PIPE_MASTER (score ≥ 50):       +200 XP
  PUZZLE_SOLVER (score ≥ 500):    +100 XP
  LOGIC_MASTER (score ≥ 1000):   +300 XP
  NEURAL_GENIUS (score ≥ 1500):   +500 XP
  ZOMBIE_HUNTER (score ≥ 10):     +50 XP
  ZOMBIE_SLAYER (score ≥ 100):    +200 XP
  APOCALYPSE_SURVIVOR (≥ 300):    +500 XP
  POOL_ROOKIE (score ≥ 500):      +100 XP
  BILLIARD_PRO (score ≥ 2000):    +300 XP
  POOL_CHAMPION (score ≥ 5000):   +750 XP

Level = floor(xp / 100) + 1
```

### On-Chain Rewards

```
SPL Token (reward_mint):
  - Fungible token minted via claim_reward instruction
  - Amount = reward.xp (same as off-chain XP bonus)
  - Mint authority = program PDA [b"authority"]
  - Player must have ATA (auto-created or pre-created)

NFTs (Metaplex):
  - Badge NFTs: earned via achievement milestones
  - Score NFTs: earned on new personal high score
  - Both are non-transferable (soulbound) in production
```

---

## 10. Production Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│ Vercel (Next.js)                                     │
│  - Frontend (SSR/SSG)                                │
│  - API Routes (Serverless Functions)                 │
│  - Environment Variables (secrets)                   │
│  - Edge caching for static pages                     │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
┌────────────┐ ┌──────────┐ ┌────────────┐
│ Railway    │ │ Upstash  │ │ Solana     │
│ PostgreSQL │ │ Redis    │ │ Devnet/Main│
│            │ │          │ │            │
│ - Players  │ │ - Rate   │ │ - Program  │
│ - Sessions │ │   limits │ │ - Reward   │
│ - Leaderbd │ │ - Cache  │ │   mint     │
│ - Quests   │ │          │ │ - NFT mints│
└────────────┘ └──────────┘ └────────────┘
                     │
                     ▼
              ┌────────────┐
              │ Arweave     │
              │ /IPFS       │
              │             │
              │ - NFT       │
              │   metadata  │
              │ - Badge     │
              │   images    │
              └────────────┘
```

### Environment Variables (Production)

```env
# Database (Railway)
DATABASE_URL=postgresql://...

# Solana
NEXT_PUBLIC_SOLANA_PROGRAM_ID=<deployed-program-id>
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com  # or Helius/QuickNode
NEXT_PUBLIC_REWARD_MINT=<spl-token-mint-address>

# Backend Signer (Solana keypair, NOT in git)
BACKEND_SIGNER_KEY=<base58-secret-key>

# Auth
NEXTAUTH_SECRET=<random-32-byte-hex>
JWT_SECRET=<random-32-byte-hex>

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# NFT Metadata (Arweave)
ARWEAVE_WALLET=<jwk-key>
# OR
NFT_STORAGE_API_KEY=<api-key>
```

---

## 11. Implementation Roadmap

### Phase 1: Security Fixes (Critical) — 1 week

- [ ] Add wallet signature verification to `startSession` and `submitScore`
- [ ] Create `/api/auth` endpoint (JWT issuance)
- [ ] Remove `.env` from git, rotate all secrets
- [ ] Replace in-memory rate limiting with Upstash Redis
- [ ] Add wallet validation regex to `startSession`

### Phase 2: On-Chain Program Fixes — 1 week

- [ ] Fix `end_session` to verify Ed25519 signature on-chain
- [ ] Fix `claim_reward` to use PDA authority (not Signer)
- [ ] Add `ClaimRecord` account for double-claim prevention
- [ ] Store `backend_pubkey` in `Game` account
- [ ] Deploy updated program to devnet
- [ ] Update `solanaProgram.ts` to match new instruction signatures

### Phase 3: NFT Migration — 1 week

- [ ] Replace `nftMinter.ts` with Solana Metaplex SDK
- [ ] Set up Arweave/IPFS for metadata storage
- [ ] Create badge NFT collection (Metaplex collection NFT)
- [ ] Implement `mintBadgeNFT` using Metaplex `createNft`
- [ ] Implement `mintScoreNFT` using Metaplex `createNft`
- [ ] Test end-to-end badge minting

### Phase 4: Anti-Cheat Hardening — 3 days

- [ ] Move game rules to `GameConfig` table (from hardcoded)
- [ ] Add `neon-sky-runner` to anti-cheat rules
- [ ] Add `shooter` and `8ball-pool` to reward rules
- [ ] Remove `prompt()` score entry for neon-sky-runner
- [ ] Add suspicious activity logging
- [ ] Add bot detection (play pattern analysis)

### Phase 5: Scalability — 1 week

- [ ] Add Redis caching for leaderboard and player stats
- [ ] Batch NFT metadata fetches using `getMultipleAccountsInfo`
- [ ] Add pagination to leaderboard API
- [ ] Add database connection pooling
- [ ] Set up monitoring (Sentry for errors, Datadog for metrics)
- [ ] Load test API endpoints

### Phase 6: Mainnet Readiness — 1 week

- [ ] Deploy Solana program to mainnet
- [ ] Create real SPL reward token mint
- [ ] Set up Helius/QuickNode RPC (not public RPC)
- [ ] Configure CORS on all API routes
- [ ] Add health check endpoint
- [ ] Set up CI/CD pipeline (GitHub Actions → Vercel)
- [ ] Security audit of on-chain program

---

## 12. Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js | 15.x |
| UI Framework | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Wallet | @solana/wallet-adapter-react | 0.15.x |
| Blockchain | Solana (Anchor) | 0.30.x |
| SPL Token | @solana/spl-token | 0.4.x |
| Crypto | tweetnacl | 1.0.x |
| Database | PostgreSQL + Prisma | 5.x |
| Rate Limiting | Upstash Redis | — |
| NFT Standard | Metaplex | — |
| Metadata Storage | Arweave / IPFS | — |
| Hosting | Vercel | — |
| DB Hosting | Railway | — |
| Monitoring | Sentry | — |
