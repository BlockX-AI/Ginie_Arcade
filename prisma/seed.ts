import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed Game Configs
  const games = [
    {
      gameId: 'flappy',
      name: 'Flappy Bird',
      slug: 'flappy',
      description: 'Navigate through pipes in this classic arcade game.',
      category: 'Arcade',
      maxScore: 500,
      minDuration: 5,
      maxScorePerSecond: 10,
      active: true,
    },
    {
      gameId: 'sudoku',
      name: 'Sudoku: Roast Mode',
      slug: 'sudoku',
      description: 'Comedy-driven Sudoku with hilarious roast characters and 60+ voice lines.',
      category: 'Puzzle',
      maxScore: 3000,
      minDuration: 30,
      maxScorePerSecond: 50,
      active: true,
    },
    {
      gameId: 'match-three',
      name: 'Match-Three Puzzle',
      slug: 'match-three',
      description: 'Classic match-3 puzzle game. Score earned is your total XP.',
      category: 'Puzzle',
      maxScore: 10000,
      minDuration: 30,
      maxScorePerSecond: 200,
      active: true,
    },
  ];

  for (const game of games) {
    await prisma.gameConfig.upsert({
      where: { gameId: game.gameId },
      update: game,
      create: game,
    });
    console.log(`  Game: ${game.name}`);
  }

  // Seed Quests
  const quests = [
    {
      id: 'first-game',
      name: 'First Steps',
      description: 'Play your first game on Genie Arcade',
      xpReward: 50,
      requirementType: 'play_games',
      requirementValue: 1,
      active: true,
    },
    {
      id: 'play-5-games',
      name: 'Getting Started',
      description: 'Play 5 games across any title',
      xpReward: 150,
      requirementType: 'play_games',
      requirementValue: 5,
      active: true,
    },
    {
      id: 'play-20-games',
      name: 'Arcade Veteran',
      description: 'Play 20 games across any title',
      xpReward: 500,
      requirementType: 'play_games',
      requirementValue: 20,
      active: true,
    },
    {
      id: 'flappy-score-50',
      name: 'Pipe Master',
      description: 'Score 50 or higher in Flappy Bird',
      xpReward: 300,
      requirementType: 'reach_score',
      requirementValue: 50,
      active: true,
    },
  ];

  for (const quest of quests) {
    await prisma.quest.upsert({
      where: { id: quest.id },
      update: quest,
      create: quest,
    });
    console.log(`  Quest: ${quest.name}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
