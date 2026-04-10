# Architecture

## Overview

Ginie Arcade follows a modular layered architecture:

1. **Presentation Layer**: Next.js routes in `app/` and reusable UI in `components/`.
2. **Application Layer**: API handlers in `app/api/*` coordinate gameplay sessions, scoring, rewards, and persistence.
3. **Domain/Service Layer**: Shared logic in `lib/*` (anti-cheat, contracts, signing, minting, game metadata).
4. **Infrastructure Layer**: Prisma database (`prisma/*`), smart contracts (`packages/contracts`, `infra/hardhat`), and deployment config.

## Canonical Folder Layout

```text
.
├── app/
│   ├── api/
│   ├── library/
│   ├── leaderboard/
│   ├── dashboard/
│   └── play/
├── components/
├── hooks/
├── lib/
├── prisma/
├── public/
│   └── games/
├── infra/
│   └── hardhat/
├── packages/
│   └── contracts/
├── scripts/
└── docs/
```

## Canonical Runtime Boundaries

- The **active application runtime** is the root `app/` + `lib/` + `prisma/` tree.
- `packages/contracts` is the active smart-contract workspace.
- Any `packages/backend` content should be treated as **legacy/reference only** and not as an active second runtime.

## Game Asset Strategy

- Production game assets are served from `public/games/<game-slug>/`.
- The platform loads games via `/games/*` routes and iframe embedding.
- Duplicate source folders outside `public/games` are intentionally removed to keep the repository clean and maintainable.

## Current Active Games

- `flappy`
- `snake-io`
- `the-house`
- `shooter`
- `8ball-pool`
- `sudoku`
- `zombie-apocalypse`
- `match-three`

## Conventions

- Add new game builds only under `public/games/<slug>/`.
- Keep framework/runtime code in `app/`, `components/`, and `lib/` only.
- Keep technical docs in `docs/` and avoid status-style temporary markdown files in runtime asset folders.
