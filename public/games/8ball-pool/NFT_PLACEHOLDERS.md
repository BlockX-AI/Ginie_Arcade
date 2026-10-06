# 8 Ball Pool - NFT Placeholder Requirements

## Required NFT Assets

### 1. **Pool Rookie Badge** (First Achievement)
- **Trigger:** Score 500+ points (50 XP)
- **Description:** "Nice shot! You've proven you can play billiards."
- **Rarity:** Common
- **XP Bonus:** 100
- **Placeholder:** `8ball-pool-rookie-badge.png`
- **Theme:** Bronze pool cue crossing 8-ball, beginner ribbon

### 2. **Billiard Pro Medal** (Skill Achievement)
- **Trigger:** Score 2000+ points (200 XP)
- **Description:** "Impressive skill! You're becoming a billiards master."
- **Rarity:** Uncommon
- **XP Bonus:** 300
- **Placeholder:** `8ball-pool-pro-medal.png`
- **Theme:** Silver medal with crossed cues, billiard balls arrangement

### 3. **Pool Champion Trophy** (High Score)
- **Trigger:** Score 5000+ points (500 XP)
- **Description:** "Legendary player! You've mastered the art of pool."
- **Rarity:** Rare
- **XP Bonus:** 750
- **Placeholder:** `8ball-pool-champion-trophy.png`
- **Theme:** Golden trophy with 8-ball on top, championship laurels

### 4. **Perfect Break Master** (Special Achievement)
- **Trigger:** Win with perfect break shot
- **Description:** "Flawless break! You've achieved billiards perfection."
- **Rarity:** Epic
- **XP Bonus:** 500
- **Placeholder:** `8ball-pool-perfect-break.png`
- **Theme:** Exploding rack of balls, perfect geometry, golden glow

### 5. **Combo King Achievement** (Skill Combo)
- **Trigger:** Pot 3+ balls in one shot
- **Description:** "Incredible combo! Your shot precision is unmatched."
- **Rarity:** Rare
- **XP Bonus:** 400
- **Placeholder:** `8ball-pool-combo-king.png`
- **Theme:** Multiple balls with combo streaks, purple/pink effects

### 6. **8-Ball Champion Crown** (Ultimate Victory)
- **Trigger:** Win 10+ games
- **Description:** "Pool royalty! You've dominated the table repeatedly."
- **Rarity:** Epic
- **XP Bonus:** 1000
- **Placeholder:** `8ball-pool-ultimate-crown.png`
- **Theme:** Platinum crown with 8-ball centerpiece, royal purple/gold

---

## NFT Metadata Structure

```json
{
  "name": "Pool Rookie Badge",
  "description": "Nice shot! You've proven you can play billiards.",
  "image": "ipfs://[PLACEHOLDER]/8ball-pool-rookie-badge.png",
  "attributes": [
    {
      "trait_type": "Game",
      "value": "8 Ball Pool"
    },
    {
      "trait_type": "Achievement Type",
      "value": "First Achievement"
    },
    {
      "trait_type": "Rarity",
      "value": "Common"
    },
    {
      "trait_type": "XP Bonus",
      "value": "100"
    },
    {
      "trait_type": "Category",
      "value": "Sports"
    }
  ]
}
```

---

## Placeholder Image Specifications

- **Format:** PNG with transparency
- **Size:** 512x512px
- **Theme:** Pool table green, black 8-ball, wooden cues, felt texture
- **Colors:** Green (#2d5016), Black (#000000), Wood brown (#8b4513), Gold/Silver/Bronze accents
- **Style:** Realistic billiard aesthetic with premium sports feel
- **Elements:** 8-ball, pool cues, triangle rack, pool table cloth, pockets

---

## Scoring System

**XP Calculation:** Score × 10
- 100 points = 1,000 XP
- 500 points = 5,000 XP
- 1000 points = 10,000 XP

**Achievement Triggers:**
- Based on cumulative score across games
- Special achievements for gameplay mechanics (perfect breaks, combos)
- Win streaks for dedicated players

---

## Implementation Notes

1. **Score Tracking:** Uses Ginix wrapper to intercept famobi_analytics events
2. **Real-time Updates:** Score synced to arcade UI every 2 seconds
3. **Submission:** Automatically submits on game completion or loss
4. **Anti-Cheat:** Max 10,000 points, min 60s duration, max 100 points/sec
5. **Smart Contract:** Rewards granted via arcade reward contract
6. **Display:** NFT popup on achievement unlock

---

## Game-Specific Features

- **Physics-based gameplay** with realistic ball mechanics
- **AI opponents** with multiple difficulty levels
- **Tutorial system** for new players
- **Score accumulation** across multiple games
- **Combo detection** for multi-ball pots
- **Break shot analysis** for perfect breaks
