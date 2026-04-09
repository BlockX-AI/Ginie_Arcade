export interface Game {
  id: string
  uuid: string
  title: string
  description: string
  icon: string
  color: "cyan" | "purple" | "pink"
  players: number
  highScore: number
  category: string
  gamePath: string
}

export const games: Game[] = [
  {
    id: "flappy",
    uuid: "d3f1a920-4b8c-4e2a-9c15-7a6b3d8e1f04",
    title: "Flappy Bird",
    description: "Navigate through pipes in this classic arcade game. Simple to learn, impossible to master.",
    icon: "Bird",
    color: "pink",
    players: 5621,
    highScore: 420,
    category: "Arcade",
    gamePath: "/games/flappy/index.html",
  },
  {
    id: "snake-io",
    uuid: "c8d4e5f6-9a1b-4c2d-8e3f-0a7b8c9d1e2f",
    title: "Snake.io",
    description: "Grow your snake by eating food, trap other snakes, and dominate the arena! Enhanced multiplayer with 15+ bots and blockchain XP rewards.",
    icon: "Worm",
    color: "cyan",
    players: 0,
    highScore: 0,
    category: "Arcade",
    gamePath: "/games/snake-io/index.html",
  },
  {
    id: "the-house",
    uuid: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    title: "The House",
    description: "A mysterious point-and-click adventure. Explore dark rooms, collect items, solve puzzles, and uncover the secrets within. Multiple endings await.",
    icon: "Home",
    color: "purple",
    players: 0,
    highScore: 0,
    category: "Adventure",
    gamePath: "/games/the-house-game/index.html",
  },
  {
    id: "shooter",
    uuid: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
    title: "Shooter",
    description: "Fast-paced top-down space shooter. Dodge hexagonal obstacles, blast asteroids, and rack up high scores in this neon-lit arcade action game.",
    icon: "Rocket",
    color: "cyan",
    players: 0,
    highScore: 0,
    category: "Arcade",
    gamePath: "/games/shooter/index.html",
  },
  {
    id: "8ball-pool",
    uuid: "a7b6c5d4-e3f2-4a1b-9c8d-7e6f5a4b3c2d",
    title: "8 Ball Pool",
    description: "Classic billiards simulation! Pot all your balls (solids or stripes) then sink the 8 ball to win. Earn 10 XP per point scored!",
    icon: "Circle",
    color: "purple",
    players: 0,
    highScore: 0,
    category: "Sports",
    gamePath: "/games/8ball-pool/index.html",
  },
  {
    id: "sudoku",
    uuid: "f9a8b7c6-d5e4-4f3a-2b1c-0d9e8f7a6b5c",
    title: "Sudoku: Neural Grid",
    description: "Classic logic puzzle with a cyberpunk twist. Fill the 9x9 grid with numbers 1-9. Fast completion and fewer mistakes = higher scores!",
    icon: "Grid3x3",
    color: "cyan",
    players: 0,
    highScore: 0,
    category: "Puzzle",
    gamePath: "/games/sudoku/index.html",
  },
  {
    id: "zombie-apocalypse",
    uuid: "e4f5a6b7-c8d9-4e0a-1b2c-3d4e5f6a7b8c",
    title: "Zombie Apocalypse",
    description: "Survive the zombie invasion! Shoot zombies on a post-apocalyptic road. Click or press space to fire. Each kill earns 10 XP!",
    icon: "Skull",
    color: "purple",
    players: 0,
    highScore: 0,
    category: "Shooter",
    gamePath: "/games/zombie-apocalypse/index.html",
  },
  {
    id: "match-three",
    uuid: "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
    title: "Match Three",
    description: "Match colorful gems in this addictive puzzle game! Swap adjacent tiles to make chains of 3 or more and rack up a high score before time runs out.",
    icon: "Gem",
    color: "cyan",
    players: 0,
    highScore: 0,
    category: "Puzzle",
    gamePath: "/games/match-three/index.html",
  },
]

export function getGameById(id: string): Game | undefined {
  return games.find((game) => game.id === id)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}
