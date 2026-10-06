# Smart Contracts Documentation

## Location
`packages/contracts/`

## Network
Avalanche Fuji Testnet (Chain ID: 43113)

## Contract Architecture

### Core Contracts (`core/`)

#### GinixGameRegistry
- Manages approved games list
- Level-gated access control
- Game metadata storage (URI)

#### GinixGameCore
- Player identity: XP, levels, sessions
- High score tracking per game
- XP multiplier system (level-based)

#### GinixGameMemory
- Permanent on-chain achievements
- Achievement unlock tracking
- Batch unlock support

#### GinixAntiCheatGuard
- Verifies backend-signed game results
- Nonce consumption (prevents replay)
- Batch verification support

#### GinixRewardEngine
- Orchestrates reward distribution
- Validates through Guard, grants via Core + Memory
- Reward configuration (XP amount + achievement unlock)

### Token Contracts (`tokens/`)

#### GameNFT (ERC-721)
- Achievement and badge NFTs
- Authorized minter pattern
- On-chain metadata storage
- `getOwnedTokens()` for wallet queries

#### ArcadeToken (ERC-20)
- Platform utility token
- 10M max supply cap
- Authorized minter pattern
- Future: shop, tournaments, staking

### Game Adapters (`games/`)

#### FlappyBird
- Thin validation adapter
- Game-specific score validation rules
- Difficulty rating calculation

## Deployment

### Prerequisites
```bash
cd infra/hardhat
npm install
```

### Deploy to Fuji
```bash
DEPLOYER_PRIVATE_KEY=0x... npx hardhat run deploy.ts --network fuji
```

### Verify on Snowtrace
```bash
npx hardhat verify --network fuji <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Contract Interaction Flow

```
Player submits score -> Backend validates -> Backend signs result
                                                    |
                                                    v
Frontend calls RewardEngine.grantReward(nonce, player, gameId, score, duration, rewardId, sig)
                                                    |
                                    +---------------+---------------+
                                    |               |               |
                                    v               v               v
                              Guard.verify    Core.addXP     Memory.unlock
                              (nonce check)   Core.record    (achievement)
```

## Deployed Addresses

See `infra/deployments/fuji-latest.json` for current deployment addresses.
