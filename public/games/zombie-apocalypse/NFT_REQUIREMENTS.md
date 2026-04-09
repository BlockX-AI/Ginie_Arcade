# Zombie Apocalypse - NFT Requirements

## Required NFT Assets

### 1. **Zombie Hunter Badge** (Achievement NFT)
- **Type:** Achievement Badge
- **Trigger:** Complete first game (any score)
- **Description:** "Welcome to the apocalypse! You've survived your first zombie encounter."
- **Rarity:** Common
- **Image:** Badge with crossed guns/zombie silhouette
- **Placeholder:** `nft-zombie-hunter-badge.png`

### 2. **Zombie Slayer Medal** (Score Milestone)
- **Type:** Score Achievement
- **Trigger:** Reach 100+ points (10 zombies killed)
- **Description:** "Elite zombie killer! You've eliminated 10+ zombies in a single run."
- **Rarity:** Uncommon
- **Image:** Medal with zombie head and crosshair
- **Placeholder:** `nft-zombie-slayer-medal.png`

### 3. **Apocalypse Survivor Trophy** (High Score)
- **Type:** High Score Achievement
- **Trigger:** Reach 300+ points (30 zombies killed)
- **Description:** "Legendary survivor! You've faced the horde and emerged victorious."
- **Rarity:** Rare
- **Image:** Golden trophy with post-apocalyptic theme
- **Placeholder:** `nft-apocalypse-survivor-trophy.png`

### 4. **Weekly Top Scorer Crown** (Leaderboard Reward)
- **Type:** Leaderboard Position
- **Trigger:** Top 10 on weekly leaderboard
- **Description:** "You're among the elite survivors this week!"
- **Rarity:** Epic
- **Image:** Crown with flames and zombie theme
- **Placeholder:** `nft-weekly-top-scorer.png`

### 5. **Zombie Headshot Master** (Skill Achievement)
- **Type:** Special Skill
- **Trigger:** Kill 20 zombies in under 60 seconds
- **Description:** "Lightning-fast reflexes! You're a true headshot master."
- **Rarity:** Rare
- **Image:** Crosshair with lightning bolt
- **Placeholder:** `nft-headshot-master.png`

### 6. **No Hit Run Champion** (Perfect Run)
- **Type:** Perfect Gameplay
- **Trigger:** Survive 2+ minutes without getting hit
- **Description:** "Untouchable! You've mastered the art of survival."
- **Rarity:** Epic
- **Image:** Shield with zombie-proof emblem
- **Placeholder:** `nft-no-hit-champion.png`

## NFT Metadata Structure

```json
{
  "name": "Zombie Hunter Badge",
  "description": "Welcome to the apocalypse! You've survived your first zombie encounter.",
  "image": "ipfs://[PLACEHOLDER]/nft-zombie-hunter-badge.png",
  "attributes": [
    {
      "trait_type": "Game",
      "value": "Zombie Apocalypse"
    },
    {
      "trait_type": "Achievement Type",
      "value": "First Game"
    },
    {
      "trait_type": "Rarity",
      "value": "Common"
    },
    {
      "trait_type": "XP Bonus",
      "value": "10"
    }
  ]
}
```

## Implementation Notes

1. **Smart Contract:** Each NFT should be minted via the arcade's reward contract
2. **XP Rewards:** Each NFT grants bonus XP (10-100 depending on rarity)
3. **Conditions:** Track in game script and trigger minting via GinixBridge
4. **Display:** Show NFT reward popup when earned
5. **Storage:** Metadata stored on IPFS, contract addresses on-chain

## Placeholder Image Specifications

- **Format:** PNG with transparency
- **Size:** 512x512px
- **Theme:** Post-apocalyptic, dark colors (blacks, grays, orange/red accents)
- **Style:** Consistent with zombie game aesthetic
- **Elements:** Incorporate fire, destruction, weapons, zombie silhouettes
