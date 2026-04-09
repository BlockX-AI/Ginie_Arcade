export interface LevelConfig {
  level: number;
  moves: number;
  targetScore: number;
  timeLimit: number;
  description: string;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    moves: 30,
    targetScore: 300,
    timeLimit: 120,
    description: "Welcome! Match 3 or more tiles"
  },
  {
    level: 2,
    moves: 27,
    targetScore: 700,
    timeLimit: 110,
    description: "Getting warmer! Keep matching"
  },
  {
    level: 3,
    moves: 24,
    targetScore: 1100,
    timeLimit: 100,
    description: "Nice work! Speed it up"
  },
  {
    level: 4,
    moves: 21,
    targetScore: 1500,
    timeLimit: 90,
    description: "Halfway there! Stay focused"
  },
  {
    level: 5,
    moves: 18,
    targetScore: 1900,
    timeLimit: 85,
    description: "Expert level! Make every move count"
  },
  {
    level: 6,
    moves: 15,
    targetScore: 2300,
    timeLimit: 80,
    description: "Master level! Think ahead"
  },
  {
    level: 7,
    moves: 12,
    targetScore: 2700,
    timeLimit: 75,
    description: "Pro level! Precision required"
  },
  {
    level: 8,
    moves: 10,
    targetScore: 3100,
    timeLimit: 70,
    description: "Elite level! Every move matters"
  },
  {
    level: 9,
    moves: 8,
    targetScore: 3500,
    timeLimit: 65,
    description: "Legendary level! Almost there"
  },
  {
    level: 10,
    moves: 6,
    targetScore: 3900,
    timeLimit: 60,
    description: "FINAL BOSS! Show your mastery"
  }
];

export const getTotalLevels = () => LEVEL_CONFIGS.length;

export const getLevelConfig = (level: number): LevelConfig => {
  const config = LEVEL_CONFIGS.find(l => l.level === level);
  return config || LEVEL_CONFIGS[0];
};
