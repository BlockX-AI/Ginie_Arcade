export interface Level {
  id: number;
  targetScore: number;
  moves: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

const generateLevels = (count: number): Level[] => {
  return Array.from({ length: count }, (_, i) => {
    const level = i + 1;
    let difficulty: 'easy' | 'medium' | 'hard' | 'expert';
    
    if (level <= 10) difficulty = 'easy';
    else if (level <= 25) difficulty = 'medium';
    else if (level <= 40) difficulty = 'hard';
    else difficulty = 'expert';
    
    return {
      id: level,
      targetScore: Math.floor(300 + (level * 200) + (level * level * 10)),
      moves: Math.max(25 - Math.floor(level / 3), 10),
      difficulty,
    };
  });
};

export const levels: Level[] = generateLevels(50);

export const getLevelById = (id: number): Level | undefined => {
  return levels.find(level => level.id === id);
};

export const getNextLevel = (currentId: number): Level | undefined => {
  return levels.find(level => level.id === currentId + 1);
};

export const getTotalLevels = (): number => {
  return levels.length;
};
