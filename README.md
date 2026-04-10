# Ginie Arcade

A web3-enabled arcade platform built with Next.js, Prisma, and Avalanche smart contracts.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Prisma + PostgreSQL
- wagmi + RainbowKit
- Solidity contracts (Hardhat)

## Project Structure

```text
app/                 Next.js routes (UI + API)
components/          Shared UI components
lib/                 Core application libraries
public/games/        Runtime game assets served in production
prisma/              Database schema and seed
infra/hardhat/       Contract deployment scripts
scripts/             Utility and validation scripts
docs/                Technical documentation
```

## Active Game Folders (Production)

These game folders are currently used by the app:

- `public/games/flappy`
- `public/games/snake-io`
- `public/games/the-house-game`
- `public/games/shooter`
- `public/games/8ball-pool`
- `public/games/sudoku`
- `public/games/zombie-apocalypse`
- `public/games/match-three`

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```

## Additional Docs

- `ARCHITECTURE.md`
- `docs/backend.md`
- `docs/contracts.md`
- `docs/architecture.md`
