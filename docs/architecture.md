# Ginie Arcade — Architecture

## Overview

Ginie Arcade is a modular on-chain arcade protocol on Avalanche. The platform acts as a unified gaming identity layer — one wallet, one progression system, infinite games.

## Core Principle

**Ginie is the product. Games are plugins.**

## Architecture Layers

### 1. Smart Contracts (packages/contracts/)
- **GinixGameCore** — Player XP, levels, sessions, XP multiplier
- **GinixGameRegistry** — Approved games registry with level-gating
- **GinixRewardEngine** — Orchestrates on-chain reward distribution
- **GinixAntiCheatGuard** — Cryptographic score validation via backend signer
- **GinixGameMemory** — Permanent on-chain achievements
- **GameNFT** — ERC-721 achievement and badge NFTs
- **ArcadeToken** — ERC-20 platform token (future economy)
- **FlappyBird** — Thin game-specific validation adapter

### 2. Backend API (app/api/)
- Next.js API routes
- Session management with nonce-based anti-cheat
- Prisma + PostgreSQL for off-chain data
- Score validation and backend signing
- Server-side NFT minting (badge + score NFTs)

### 3. Frontend (app/, components/)
- Next.js with React
- Wallet connection via RainbowKit + wagmi
- Game loading via iframe
- Dashboard, leaderboards, game launcher

### 4. Games (public/games/ or external host)
- Static web exports (Godot WebAssembly, HTML5, etc.)
- Framework-agnostic, loaded in iframe
- Communicate with arcade via bridge script

## Deployed Contracts (Avalanche Fuji Testnet)

| Contract | Address |
|----------|---------|
| GameNFT | `0x46b510E7A089d8dbed37b945dC461936d4BDe944` |
| GinixGameRegistry | `0x11f41Ef35ecE2aC9F1AD429060989E7DDE23f589` |
| GinixGameCore | `0xeCa1F19cfbc4Fd9247e6F3E03C7C462AeC7A43f7` |
| GinixGameMemory | `0x9e1F450139292Bbb6404a39f985f98A68011EcE1` |
| GinixAntiCheatGuard | `0xdfD09cA7F6D199ccc0D0db717ccE7B365CB7A421` |
| GinixRewardEngine | `0x31aF2267857a3fe02F105ac2cCB71b7c4030F42B` |
| FlappyBird Validator | `0x06Bd23B2627DC4d9CCe42a1cE37d59F885988EFc` |
| ArcadeToken (ERC-20) | `0xe6aca73f2f2564006bA54E1452BD55e88A12029d` |

## Adding a New Game

1. Add game folder under `public/games/<game-name>/`
2. (Optional) Add thin adapter contract under `packages/contracts/games/`
3. Add game config entry in `lib/games.ts`
4. Add anti-cheat rules in `lib/antiCheat.ts`
5. Add reward rules in `app/api/submitScore/route.ts`
6. Add game config to `prisma/seed.ts`
7. Register game in `GinixGameRegistry` on-chain
