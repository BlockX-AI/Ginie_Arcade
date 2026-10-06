# Ginix Arcade — Builder Plan (Developer Handoff)

Goal: turn the working devnet contracts into a product players return to **daily**, with
NFT avatars and game art good enough that people want to show them off.

Owner: lead developer. Designer/AI-art tasks are marked `[ART]`.

---

## 0. Where we are today (verified on devnet)

All three Anchor programs are deployed, initialized, and smoke-tested on devnet.

| Program | Program ID | Status |
|---|---|---|
| `ginix_arcade` | `3i6fdSaw459wViBFYQjEbw3fdRk1KgANaDmBLMVhbjN7` | platform + 10 games registered, score→token verified |
| `ginix_nfts` | `8ko2Z2MZt5LDdRvqSEY2Rc38cLQU7j4edgBA68AA62mU` | platform init, Metaplex NFT mint verified |
| `ginix_tournament` | `2aT2nkWc7kxpVciBnXtZvkfWcwD7WGiDG81t6TTDTWu5` | deployed, **not initialized** |

Working scripts (use these, don't rewrite them):

- `scripts/initialize-platform.ts` — idempotent; registers every game in `lib/games.ts`
- `scripts/devnet-smoke.ts` — arcade score → reward token
- `scripts/devnet-nft-smoke.ts` — NFT mint + Metaplex metadata
- `scripts/e2e-flappy-claim.ts` — full Flappy claim loop

Key on-chain accounts:

```
Arcade platform PDA   3xnueXqS28y3T8undXiUd8vCfiYi7cH8GdHPa9SPvfYr
NFT platform PDA      8T2U6bEFK8Z4AmyHPbpAVkGW1H5JHhjU27HACzSXeSfA
Backend signer        4xpGd1fGdt7ixpiEeCTdwNL9zDR7KVSoZd7GabjP77LK
Reward mint (9 dec)   8zMxbkUZKyffsCzxU2z9NEWy67U6ER7K9PMhQZ5Rkndh
```

---

## 1. Blockers to fix before building anything new

These are real bugs/gaps found in the current code. Do these first — new features will
break without them.

### 1.1 `lib/nftMinter.ts` is still Ethereum
It imports `ethers`, calls `mintAchievement(...)` on an EVM contract, and targets
Avalanche Fuji. **Every NFT mint in the app currently goes to the wrong chain.**

Replace with Solana using the already-fixed builder in `lib/solanaProgram.ts`:

```ts
buildNftInitIx(authority, backendSigner)
buildMintNftIx(payer, platformAuthority, player, tokenId, name, symbol, metadataUri, ed25519Ix)
```

Signing message layout (already implemented in `lib/signer.ts`):
`player pubkey (32) || token_id (8 LE) || sha256(metadata_uri) (32)`

Working reference: `scripts/devnet-nft-smoke.ts`.

### 1.2 CRITICAL: metadata URI must be ≤ 200 characters
`ginix_nfts` enforces this on-chain:

```rust
require!(metadata_uri.len() <= 200, NftError::UriTooLong);
```

`lib/badgeTokenURIs.ts` falls back to a **base64 `data:application/json` URI**, which is
thousands of characters. That path will **always fail** on Solana. Every NFT must use a
short `ipfs://<cid>` or `https://` URI. Delete the base64 fallback.

### 1.3 Fake IPFS CIDs
Two entries in `lib/badgeTokenURIs.ts` are placeholders, not real CIDs:

```
'sudoku-500'  -> bafkreif2sudoku500placeholder...
'sudoku-1500' -> bafkreif2sudoku1500placeholder...
```

Re-upload and replace.

### 1.4 Stale Avalanche branding
Metadata and UI still say Avalanche. Fix:
- `lib/badgeTokenURIs.ts` → `chain: 'Solana'`
- `lib/nftMinter.ts` → `Chain: 'Solana Devnet'` trait
- Footer + blog copy: "Avalanche network", "Snowtrace Explorer" → Solana / Solscan

### 1.5 `neon-sky-runner` is a ghost game
It exists in `GAME_CONFIG` in `app/play/[gameId]/page.tsx` but is **not** in
`lib/games.ts`, so it is not registered on-chain and `lib/antiCheat.ts` rejects it as
"Unknown game". Either add it to `lib/games.ts` + `GAME_RULES` and re-run
`scripts/initialize-platform.ts`, or remove it from `GAME_CONFIG`.

### 1.6 Single source of truth for games
`lib/games.ts` is now the source of truth (`initialize-platform.ts` and
`submitScore/route.ts` both read from it). Keep it that way — do not reintroduce
hardcoded game maps. `app/play/[gameId]/page.tsx` still has its own `GAME_CONFIG`;
merge the `url`/`icon` fields into `lib/games.ts` and delete the duplicate.

---

## 2. Daily retention system (the core feature)

### 2.1 Database migration
`prisma/schema.prisma` → `Player` model currently has no streak tracking. Add:

```prisma
model Player {
  // ... existing fields
  streak        Int       @default(0)
  maxStreak     Int       @default(0) @map("max_streak")
  lastPlayedDay String?   @map("last_played_day")   // "YYYY-MM-DD" in UTC
  guardians     Int       @default(0)               // unused Streak Guardians
}
```

Store the day as a `YYYY-MM-DD` **string in UTC**, not a timestamp. This avoids timezone
bugs where a player "loses" a streak by travelling.

### 2.2 Streak logic
Put this in a new `lib/streak.ts`, called from `app/api/submitScore/route.ts` on the
first **valid** session of the day (not on `startSession` — otherwise players farm
streaks by opening a game and quitting).

```
today     = UTC YYYY-MM-DD
yesterday = today - 1 day

if lastPlayedDay == today        -> no change (already counted today)
else if lastPlayedDay == yesterday -> streak += 1
else if guardians > 0 && lastPlayedDay == today - 2 -> consume 1 guardian, streak += 1
else                             -> streak = 1   (reset)

maxStreak = max(maxStreak, streak)
lastPlayedDay = today
```

### 2.3 Streak reward multiplier
Applied to `reward_amount` **before** the backend signs it, so the multiplier is
enforced by the Ed25519 signature and cannot be faked by the client.

| Streak | Multiplier |
|---|---|
| 1–2 days | 1.0x |
| 3–6 days | 1.25x |
| 7–29 days | 1.5x |
| 30+ days | 2.0x |

Hard-cap the final `reward_amount` server-side. The on-chain program also checks
`score <= game.reward_rate * 100_000`, but do not rely on that alone.

### 2.4 Streak milestone NFTs

| Day | NFT | Extra |
|---|---|---|
| 3 | Spark Badge | — |
| 7 | Flame Badge | + 1 Streak Guardian |
| 30 | Legend Badge | + 1 Streak Guardian |
| 100 | Immortal Badge | permanent 2x multiplier |

Mint via `ginix_nfts`. `token_id` must be **deterministic and unique per player** because
the mint PDA is seeded `[b"nft", player, token_id]`. Use a fixed namespace, e.g.
`token_id = 1000 + milestoneIndex` for streak badges, `2000 + n` for score NFTs. Document
the ranges in code so they never collide.

### 2.5 Streak Guardian NFT (the premium hook)
This is the NFT with genuine utility — it **saves a streak** from one missed day.

- Earned at day 7 and day 30
- Consumed automatically by the streak logic above
- Later: sellable / giftable, since it's a real SPL NFT

When consumed, burn the NFT on-chain (or mark it consumed in DB for MVP and burn later).
Decrement `Player.guardians`.

### 2.6 UI work
- Streak counter in the navbar — always visible, this is the FOMO driver
- "Play today to keep your N-day streak" banner on the dashboard when
  `lastPlayedDay != today`
- Streak calendar heatmap on `/dashboard`
- Guardian count badge next to the streak

---

## 3. NFT avatars + game art `[ART]`

### 3.1 Avatar system
Give every player a generated avatar NFT that **changes as they progress**. This is what
makes the collection feel personal instead of generic.

Pipeline:
1. Define 5 tiers: Rookie → Skilled → Elite → Master → Legend (gated on XP / max streak)
2. `[ART]` Generate a base avatar set per tier with Gemini / Nano Banana image models
3. Layer traits: background, frame, aura, badge overlay
4. Upload to IPFS via Pinata; store `ipfs://` URIs (remember the **200-char limit**)
5. Mint through `ginix_nfts`; token_id namespace `3000 + tier`
6. Upgrade = mint the next tier and let the player display it as their profile picture

Keep generation **off the critical path** — pre-generate and pin a fixed set, do not call
an image API during a mint transaction.

### 3.2 Game cover art
`public/badges/` already has PNG+SVG badge art. Game covers need the same treatment:

- `[ART]` One 16:9 hero image + one square thumbnail per game in `lib/games.ts`
- Consistent style: dark background, neon crimson accent (matches `#DC143C` theme colour)
- Add `coverImage` and `thumbnail` fields to the `Game` interface in `lib/games.ts`
- Use `next/image` with blur placeholders on `/library`

### 3.3 Why art matters here
The badge *utility* drives retention; the badge *art* drives sharing. A player will
screenshot a Legend Badge into a Discord server — that is free acquisition. Budget real
design time for the top-tier badges (day 30, day 100, Legend avatar) and keep the low
tiers cheap.

---

## 4. Tournament / contest system

`ginix_tournament` is deployed but not initialized. Needed for the $250 player prize pool.

1. Write `scripts/initialize-tournament.ts` following the pattern of
   `scripts/initialize-platform.ts` (idempotent, skip-if-exists, backend signer as authority)
2. Write `scripts/devnet-tournament-smoke.ts`: create → enter → claim prize
3. Signing message layout is already in `lib/signer.ts`:
   `player pubkey (32) || tournament_id (8 LE) || amount (8 LE)`
4. Build `/tournaments` page: active contests, entry, live leaderboard, prize pool
5. Prize pool must be **funded by entry fees or treasury**, never by unlimited minting

### Legal wording — important
Use **contest**, **tournament**, **prize pool**, **bounty**, **reward**.
Never use **bet**, **wager**, or **gamble**. Keep every payout **skill-based**
(highest score wins, no randomness in the payout). This is the difference between a
skill contest and a regulated gambling product.

---

## 5. Production hardening (before mainnet)

- [ ] `BACKEND_SIGNER_KEY` into a secrets manager, not `.env`. Rotate before mainnet.
- [ ] Replay protection: `Session.nonce` is already `@unique` in Prisma and the on-chain
      session has `reward_claimed`. Add an explicit `rewardClaimed` column too so the API
      refuses to re-sign the same session.
- [ ] Rate limiting → move `lib/antiCheat.ts` in-memory `rateLimitStore` to Redis
      (it resets on every deploy and doesn't work across instances)
- [ ] Wallet signature auth — verify the user owns the wallet before creating a session,
      otherwise anyone can submit scores for any address
- [ ] Per-game anti-cheat tuning: `GAME_RULES` values are guesses. Log real score/duration
      distributions for 2 weeks, then set thresholds from data.
- [ ] Program upgrade authority → multisig (Squads)
- [ ] Treasury multisig before any real money moves
- [ ] Verifiable builds + published IDLs

---

## 6. Suggested delivery order

| Phase | Work | Why |
|---|---|---|
| **1** | Section 1 blockers (EVM→Solana minter, URI limit, ghost game, branding) | Nothing NFT-related works correctly until this is done |
| **2** | Streak DB + logic + multiplier + navbar counter | The retention engine; cheap to build, highest impact |
| **3** | `[ART]` Badge + avatar art, IPFS upload, streak milestone mints | Makes the rewards worth wanting |
| **4** | Tournament init + smoke test + `/tournaments` page | Unlocks the $250 player prize pool |
| **5** | Hardening (auth, Redis, secrets, anti-cheat tuning) | Required before real money / mainnet |

### Bounty plan ($500 total, split)
- **$250 game publish bounty** — one new game, must post `scoreUpdate` / `gameEnd`
  messages to the parent frame like existing games do, and be added to `lib/games.ts`
  + `GAME_RULES` + registered on-chain.
- **$250 player contest** — first weekly tournament prize pool once Phase 4 ships.

Run the player contest **first** if Phase 4 lands before a game submission arrives; it
validates that people will connect wallets and compete at all.

---

## 7. Definition of done for each feature

A feature is done when:
1. A devnet script proves it end-to-end (follow the existing `scripts/*-smoke.ts` pattern)
2. The real UI flow works with a Phantom wallet on devnet
3. No hardcoded game/chain data was added outside `lib/games.ts`
4. Metadata URIs are ≤ 200 chars and resolve
5. The transaction signature is verifiable on Solscan devnet
