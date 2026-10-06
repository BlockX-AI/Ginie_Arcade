# Ginix Arcade — Player Onboarding, Retention & Game Dev Marketplace Strategy

---

## The Core Problem

Web3 gaming has a **90% drop-off** in the first 24 hours. The reasons are always the same:

1. **Wallet friction** — "Connect wallet" before playing = 60% bounce
2. **No reason to come back** — Play once, earn token, sell, leave
3. **No social graph** — Single-player games with no friends = no stickiness
4. **No progression depth** — Linear XP with no meaningful choices = boring after 1 week

The fix is not more tokens. The fix is **game design + social loops + creator economy**.

---

## 1. Onboarding Strategy: "Play First, Web3 Second"

### The Fatal Mistake Most Web3 Games Make

```
❌ Current web3 flow:
Land on site → "Connect Wallet" → Phantom popup → Sign transaction → Play
                    ↑
              60% of users leave here
```

### The Ginix Arcade Flow (Recommended)

```
✅ Recommended flow:

Phase 1: INSTANT PLAY (0 friction)
  Land on site → Click game → Play immediately in iframe
  No wallet, no signup, no download
  Score is tracked locally (localStorage)

Phase 2: SOFT ONBOARD (after 1-2 games)
  "You scored 47! Save your progress to earn rewards"
  → Social login (Google/Discord) creates an embedded wallet (Privy/Web3Auth)
  → Player doesn't even know they have a wallet yet
  → Score history is now persisted server-side

Phase 3: WEB3 REVEAL (when they earn first reward)
  "You earned 50 XP + a badge NFT! Connect Phantom to claim on-chain"
  → NOW show wallet connection — but only for claiming, not for playing
  → Player already has invested time → high conversion rate

Phase 4: DEEP ENGAGEMENT (returning player)
  Daily challenges, streaks, tournaments, friend leaderboards
  → Player returns because the games are fun + social pressure
  → Web3 rewards are the cherry on top, not the core hook
```

### Implementation: Embedded Wallet (Privy/Web3Auth)

```typescript
// Replace "Connect Wallet" gate with Privy embedded wallet
// Player clicks "Save Progress" → Privy creates wallet silently

import { PrivyProvider } from '@privy-io/react-auth';

// In providers.tsx:
<PrivyProvider
  appId="your-privy-app-id"
  config={{
    loginMethods: ['google', 'discord', 'email'],
    embeddedWallets: {
      createOnLogin: 'all-users',  // Auto-create Solana wallet
      noPromptOnSignature: true,   // Don't popup for every sign
    },
    defaultChain: { chain: 'solana:devnet' },
  }}
>
  {/* Existing Solana wallet adapter for power users */}
  <WalletProvider wallets={[new PhantomWalletAdapter()]}>
    {children}
  </WalletProvider>
</PrivyProvider>
```

### Onboarding Funnel Targets

```
Step                    Target Conversion
─────────────────────   ────────────────
Landing page visit      100%
Click "Play"             70%  (clear CTA, no wallet gate)
Complete 1 game          55%  (game must load in <2s)
Save progress (login)    40%  (triggered after first score)
Return next day          25%  (email/push notification)
Connect Phantom          15%  (only when claiming rewards)
Weekly active             8%  (social + daily challenges)
```

---

## 2. Retention Strategy: 4 Engagement Loops

### Loop 1: Daily Streak System

```
Day 1: Play 1 game → +20 XP bonus
Day 2: Play 1 game → +25 XP bonus
Day 3: Play 1 game → +30 XP bonus
...
Day 7: Play 1 game → +100 XP bonus + Streak Badge NFT

Miss a day → Streak resets to 0
Streak freeze: Use 50 XP to preserve streak (1 per week)
```

**Why it works:** Duolingo's #1 retention driver. Loss aversion is stronger than reward seeking. Players return to "not lose" their streak.

**Implementation:**
```prisma
model PlayerStreak {
  walletAddress  String   @id
  currentStreak  Int      @default(0)
  longestStreak  Int      @default(0)
  lastPlayedDate DateTime
  freezesUsed    Int      @default(0)

  @@map("player_streaks")
}
```

```typescript
// In submitScore route, after valid score:
async function updateStreak(wallet: string) {
  const today = new Date().toDateString();
  const streak = await prisma.playerStreak.upsert({
    where: { walletAddress: wallet },
    create: { walletAddress: wallet, currentStreak: 1, lastPlayedDate: new Date() },
    update: {},
  });

  const lastDate = new Date(streak.lastPlayedDate).toDateString();
  if (lastDate === today) return; // Already played today

  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (lastDate === yesterday) {
    // Continue streak
    await prisma.playerStreak.update({
      where: { walletAddress: wallet },
      data: {
        currentStreak: { increment: 1 },
        longestStreak: { set: Math.max(streak.longestStreak, streak.currentStreak + 1) },
        lastPlayedDate: new Date(),
      },
    });
  } else {
    // Streak broken
    await prisma.playerStreak.update({
      where: { walletAddress: wallet },
      data: { currentStreak: 1, lastPlayedDate: new Date() },
    });
  }

  // Award streak XP
  const streakXp = 20 + (streak.currentStreak * 5);
  await prisma.player.update({
    where: { walletAddress: wallet },
    data: { xp: { increment: streakXp } },
  });
}
```

### Loop 2: Seasonal Leaderboards with Resets

```
Season 1: "Genesis Season" (30 days)
  - All scores count toward season leaderboard
  - Top 100 players get seasonal NFT + token rewards
  - Season ends → leaderboard resets → new season starts
  - Previous season scores archived to "all-time" leaderboard

This means:
  - New players always have a chance to rank
  - Returning players have a reason to keep playing (defend rank)
  - No permanent dominance by early adopters
```

**Implementation:**
```prisma
model Season {
  id          Int      @id @default(autoincrement())
  name        String
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean  @default(true)
  rewardsJson String   // JSON of reward tiers
  @@map("seasons")
}

// Leaderboard model gets seasonId
model Leaderboard {
  // ... existing fields
  seasonId    Int      @default(1)
  @@index([gameId, seasonId, score(sort: Desc)])
}
```

### Loop 3: Social Graph & Friend Leaderboards

```
Current: Global leaderboard → player sees they're #500 → demotivating
Fix:     Friend leaderboard → player sees they're #2 among friends → motivating

Features:
  - "Add friend" by wallet address or username
  - Friend-only leaderboard per game
  - "Beat your friend's score" notifications
  - Share score card to Twitter/Discord (with game link)
```

**Implementation:**
```prisma
model Friendship {
  walletAddress  String
  friendAddress  String
  status         String   @default("pending") // pending, accepted
  createdAt      DateTime @default(now())

  @@id([walletAddress, friendAddress])
  @@map("friendships")
}

model PlayerProfile {
  walletAddress String  @id
  username      String  @unique
  avatar        String?
  bio           String?
  twitterHandle String?
  @@map("player_profiles")
}
```

### Loop 4: Quests & Challenges (Already Partially Built)

```
Daily Quests (reset every 24h):
  - "Score 50+ in Flappy Bird" → +30 XP
  - "Play 3 different games" → +50 XP
  - "Beat a friend's score" → +40 XP

Weekly Quests (reset every Monday):
  - "Reach top 10 in any leaderboard" → +200 XP + Badge NFT
  - "Play 7 days in a row" → +500 XP + Streak Master NFT

Seasonal Quests:
  - "Play all 12 games" → +1000 XP + All-Rounder NFT
  - "Score 10,000 total points" → +2000 XP + Season Champion NFT
```

---

## 3. Game Dev Marketplace: The Platform Flywheel

### Why This Is Your Biggest Moat

```
More games → More players → More revenue for devs → More devs join → More games
     ↑                                                              │
     └──────────────────────────────────────────────────────────────┘
```

This is the Steam/Roblox model. Content scale is the only sustainable competitive advantage.

### Game Dev Onboarding Flow

```
Game Developer Journey:

1. Register as Creator
   - Connect wallet (must be Solana)
   - Submit dev profile (name, portfolio, social links)
   - Sign creator agreement (on-chain optional)

2. Integrate Ginix SDK
   - Install: npm install @ginix/game-sdk
   - 3 lines of code to enable scoring:

     import { GinixSDK } from '@ginix/game-sdk';
     const ginix = new GinixSDK({ gameId: 'my-game' });
     ginix.submitScore(score);  // Auto-handles session, anti-cheat, rewards

3. Submit Game
   - Upload game build (HTML5 zip or URL)
   - Set game metadata (name, description, category, icon)
   - Set reward rules (what scores earn what rewards)
   - Set revenue share percentage

4. Review Process
   - Automated: virus scan, iframe sandbox check, SDK integration test
   - Manual: gameplay review (is it fun? does it work? is it appropriate?)
   - Approval time: 24-48 hours

5. Launch
   - Game appears in "New Games" section
   - Featured for 3 days (boost visibility)
   - Dev gets analytics dashboard (plays, retention, revenue)
```

### Revenue Share Model

```
Revenue Sources:
  1. Platform treasury (SPL reward tokens minted per play)
  2. NFT marketplace fees (when badge/score NFTs trade)
  3. Premium game subscriptions (token-gated games)
  4. Tournament entry fees
  5. Sponsored games (brands pay for branded mini-games)

Revenue Split:
  ┌─────────────────────────────────────────────┐
  │ Game Developer:  70% of rewards generated    │
  │                  by their game                │
  │ Platform:        20% (hosting, infra, SDK)   │
  │ Treasury:        10% (token buyback, burns)  │
  └─────────────────────────────────────────────┘

Developer Payout:
  - Automatic: SPL tokens transferred to dev wallet weekly
  - Transparent: All payouts on-chain, verifiable
  - No minimum threshold (gasless via PDA)
```

### Ginix Game SDK Design

```typescript
// @ginix/game-sdk — what game devs install

import { GinixSDK } from '@ginix/game-sdk';

// Initialize (game dev sets this up once)
const ginix = new GinixSDK({
  gameId: 'my-awesome-game',
  // SDK auto-reads sessionId, nonce, wallet from URL params
  // that Ginix Arcade injects into the iframe
});

// Report score during gameplay
ginix.updateScore(currentScore);

// Report game end
ginix.endGame(finalScore);

// Listen for events
ginix.on('sessionStarted', (data) => {
  console.log('Session started:', data.sessionId);
});

ginix.on('rewardEarned', (reward) => {
  // Show in-game reward notification
  showNotification(`You earned ${reward.xp} XP!`);
});

// Optional: In-game purchases (token-gated features)
ginix.purchaseFeature('premium-skin', (success) => {
  if (success) unlockSkin();
});
```

### SDK Implementation (What It Does Internally)

```
GinixSDK internally:
  1. Reads URL params (sessionId, nonce, wallet) from parent
  2. Verifies it's running inside Ginix Arcade iframe
  3. Sends postMessage to parent for score updates
  4. Parent handles API calls (submitScore, etc.)
  5. Receives reward notifications from parent
  6. Exposes simple API to game dev

Security:
  - SDK signs all score updates with session nonce
  - Parent validates origin (only whitelisted game URLs)
  - Anti-cheat runs on parent side (game dev can't fake scores)
  - SDK is open-source (devs can audit, no black box)
```

### Game Dev Analytics Dashboard

```
Creator Dashboard (/creator):
  ┌────────────────────────────────────────────┐
  │ Game: "My Awesome Game"                     │
  │                                              │
  │ 📊 Overview                                  │
  │   Total Plays:      12,450                   │
  │   Unique Players:   3,210                    │
  │   Avg Session:      4m 32s                   │
  │   D1 Retention:     28%                      │
  │   D7 Retention:     12%                      │
  │                                              │
  │ 💰 Revenue                                    │
  │   This Week:        1,240 GINIX tokens       │
  │   All Time:         18,750 GINIX tokens      │
  │   Next Payout:      Jan 15 (auto)            │
  │                                              │
  │ 🏆 Top Scores                                 │
  │   1. 7xW2...kpF  — 9,840                     │
  │   2. A3bZ...nMq  — 8,210                     │
  │   3. 9kLp...vEr  — 7,560                     │
  │                                              │
  │ 📈 Charts (plays over time, retention curve) │
  └────────────────────────────────────────────┘
```

### Game Review Process

```
Automated Checks (instant):
  ✅ HTML5 game (runs in browser, no plugins)
  ✅ Iframe-compatible (no frame-busting code)
  ✅ No external crypto mining
  ✅ No malicious scripts (CSP violations)
  ✅ SDK integration present
  ✅ Game loads in <5 seconds
  ✅ File size < 50MB

Manual Review (24-48h):
  ✅ Game is actually playable
  ✅ No copyright infringement
  ✅ No inappropriate content
  ✅ Scoring works correctly
  ✅ Game is fun (subjective but important)

Rejection Reasons:
  ❌ Game crashes within 30 seconds
  ❌ Score manipulation detected
  ❌ Copyrighted assets without permission
  ❌ Adult content
  ❌ Not a game (utility app, etc.)
```

---

## 4. Retention Metrics to Track

```
Metric                    Target     Current Status
───────────────────────  ────────   ──────────────
D1 Retention             >30%       Not tracked ⚠️
D7 Retention             >15%       Not tracked ⚠️
D30 Retention            >5%        Not tracked ⚠️
Avg Sessions/Player/Day  >2.5       Not tracked ⚠️
Avg Session Duration     >3 min     Tracked in DB ✅
Wallet Connect Rate      >40%       Not tracked ⚠️
Claim Rate (of eligible) >60%       Not tracked ⚠️
Creator Churn            <10%/mo    N/A (no creators yet)

Implementation:
  - Add PostHog or Mixpanel for product analytics
  - Track events: game_start, game_end, score_submit,
    wallet_connect, reward_claim, nft_mint, streak_day
  - Weekly cohort analysis for retention
```

---

## 5. Growth Loops (Viral Mechanics)

### Loop 1: Score Sharing

```
Player scores 100 in Flappy Bird
  → "Share to Twitter" button generates:
    "I just scored 100 in Flappy Bird on @GinixArcade! 🐦
     Can you beat me? Play here: ginix.gg/play/flappy"
  → Includes auto-generated score card image (OG image)
  → Each share = free user acquisition
```

### Loop 2: Referral Rewards

```
Player A invites Player B
  → Player B plays first game
  → Player A gets +50 XP referral bonus
  → Player B gets +25 XP welcome bonus
  → If Player B connects wallet, Player A gets NFT referral badge
  → Track: referral code in URL (?ref=WALLET_ADDRESS)
```

### Loop 3: Tournament System

```
Weekly Tournaments:
  - Entry: Free (or small token fee for premium tournaments)
  - Format: 1-hour score attack on a specific game
  - Prize pool: SPL tokens + exclusive NFTs
  - Top 3 get "Tournament Champion" badge
  - Live leaderboard during tournament (WebSocket)
  - "Spectate" mode for non-participants

Monthly Championships:
  - Qualifiers throughout the month
  - Top 64 players compete in bracket
  - Streamed on Twitch/YouTube
  - Large prize pool (sponsored or treasury-funded)
```

### Loop 4: Creator-Driven Growth

```
Game dev publishes game on Ginix
  → Dev promotes their game to their audience
  → "Play my game on Ginix Arcade and earn rewards!"
  → Dev's audience becomes Ginix players
  → Dev earns 70% revenue → dev makes more games
  → More games = more players = more devs

This is the Steam flywheel. It's the most powerful growth engine
for a gaming platform because creators do your marketing for you.
```

---

## 6. Implementation Priority

### Phase 1: Fix Onboarding (Week 1-2) — HIGHEST IMPACT

```
Impact: ⭐⭐⭐⭐⭐  Effort: 🟡 Medium

1. Remove wallet gate from game play page
   - Games playable without wallet connection
   - Score saved to localStorage if no wallet

2. Add Privy/Web3Auth embedded wallet
   - "Save Progress" button after first game
   - Social login (Google/Discord) → auto-create wallet
   - Player doesn't see "connect wallet" until claiming

3. Add return triggers
   - Email notification after first play ("Come back for daily bonus!")
   - Discord bot for score announcements
   - Browser push notifications for streak reminders
```

### Phase 2: Daily Streaks + Quests (Week 2-3) — HIGH IMPACT

```
Impact: ⭐⭐⭐⭐  Effort: 🟢 Low

1. Implement PlayerStreak table + logic
2. Add daily quest generation (randomized per player)
3. Show streak counter in navbar
4. Email/push notification: "Your streak is about to break!"
5. Streak freeze mechanic (spend XP to preserve)
```

### Phase 3: Seasonal Leaderboards (Week 3-4) — MEDIUM IMPACT

```
Impact: ⭐⭐⭐  Effort: 🟡 Medium

1. Create Season table
2. Add seasonId to Leaderboard
3. Season reset logic (cron job)
4. Season rewards distribution (top 100)
5. "Season 1: Genesis" launch event
```

### Phase 4: Game Dev SDK (Week 4-6) — HIGH IMPACT, HIGH EFFORT

```
Impact: ⭐⭐⭐⭐⭐  Effort: 🔴 High

1. Build @ginix/game-sdk npm package
   - postMessage wrapper
   - Score submission
   - Event listeners
   - TypeScript types

2. Creator dashboard
   - Game submission form
   - Analytics dashboard
   - Revenue tracking

3. Game review pipeline
   - Automated checks (iframe sandbox, SDK presence)
   - Manual review queue (admin dashboard)
   - Approval/rejection workflow

4. Revenue distribution
   - On-chain weekly payouts to dev wallets
   - Platform fee deduction
   - Treasury allocation
```

### Phase 5: Social Features (Week 6-8) — MEDIUM IMPACT

```
Impact: ⭐⭐⭐  Effort: 🟡 Medium

1. Player profiles (username, avatar, bio)
2. Friend system (add by username/wallet)
3. Friend leaderboards
4. Score sharing (Twitter, Discord)
5. Referral system with tracking
```

### Phase 6: Tournaments (Week 8-10) — HIGH IMPACT FOR ENGAGEMENT

```
Impact: ⭐⭐⭐⭐  Effort: 🔴 High

1. Tournament creation (admin)
2. Live leaderboard (WebSocket)
3. Entry fee collection (SPL tokens)
4. Prize distribution
5. Spectator mode
6. Tournament history
```

---

## 7. The One Thing That Matters Most

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│  THE GAMES MUST BE FUN.                               │
│                                                       │
│  No amount of tokens, NFTs, streaks, or social        │
│  features will retain players if the games suck.      │
│                                                       │
│  Before building any of the above:                    │
│  1. Play every game yourself for 10 minutes           │
│  2. Ask 5 friends to play and watch them              │
│  3. Note where they get bored or frustrated           │
│  4. Fix those games first                             │
│                                                       │
│  Web3 rewards amplify fun — they don't create it.     │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## 8. Revenue Model Summary

```
Player-facing:
  - Free to play (always)
  - Premium games (token-gated, optional)
  - Tournament entry fees (optional)
  - Cosmetic NFTs (skins, themes — optional)

Creator-facing:
  - 70% revenue share (devs earn from their games)
  - Free SDK + hosting
  - Analytics dashboard included

Platform:
  - 20% of all game revenue
  - NFT marketplace fees (2.5% on secondary trades)
  - Sponsored games (brands pay for placement)
  - Tournament platform fees

Token Economics:
  - GINIX SPL token (reward currency)
  - Minted via claim_reward (controlled supply)
  - Burned via premium features (deflationary)
  - Staked for governance (future)
```
