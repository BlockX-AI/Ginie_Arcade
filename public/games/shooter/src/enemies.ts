import { clamp, random, range } from 'lodash';
import * as boundaries from './boundaries';
import { timeUnit } from './gameLoop';
import * as settings from './settings';
import { deg } from './utils';

const OFFSCREEN = 9999;
const MIN_REBORN_TIME = 500;
const MAX_REBORN_TIME = 1000;
const MIN_VELOCITY = 0.03;
const MAX_VELOCITY = 0.05;

export interface IEnemy {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
  readonly rotation: number;
  readonly isActive: boolean;
  readonly isUsed: boolean;
  readonly isDestroyed: boolean;
  readonly energy: number;
  readonly initialEnergy: number;
  readonly emittedAt?: number;
  readonly level: number;
  readonly sideForce: number;
  readonly velocity: number;
  readonly delay: number;
  readonly score: number;
}

export function generateEnemies(maxNr: number) {
  return range(maxNr).map(getDefaultEnemy);
}

export function getFreeEnemyId(enemies?: IEnemy[]) {
  const NON_EXISTENT_ID = -1;

  if (!enemies) {
    return NON_EXISTENT_ID;
  }

  const lastEnemy = enemies
    .filter(enemy => enemy.isActive)
    .sort((enemyA, enemyB) => (enemyB.emittedAt ?? 0) - (enemyA.emittedAt ?? 0))[0];

  if (!lastEnemy || Date.now() - (lastEnemy.emittedAt ?? 0) > lastEnemy.delay) {
    const freeEnemy = enemies
      .filter(enemy => !enemy.isUsed)
      .find(enemy => !enemy.isActive);

    if (freeEnemy) {
      return freeEnemy.id;
    }
  }

  return NON_EXISTENT_ID;
}

export function rebornEnemies(enemies: IEnemy[]) {
  if (enemies.every(enemy => enemy.isUsed)) {
    enemies.forEach(enemy =>
      Object.assign(enemy, {
        isUsed: false,
      })
    );
  }
}

function _checkIfEnemyVanished(enemy: IEnemy) {
  return enemy.isDestroyed && enemy.opacity === 0;
}

function _getNewEnemyOpacity(enemy: IEnemy) {
  if (enemy.energy <= 0) {
    const { opacity } = enemy;

    if (opacity <= 0) {
      return 0;
    }

    return opacity - 0.1 * timeUnit;
  }

  return enemy.opacity;
}

function _getNewEnemySideforce(enemy: IEnemy): number {
  const { leftBoundary, rightBoundary } = boundaries;

  if (enemy.x <= leftBoundary || enemy.x >= rightBoundary) {
    return enemy.sideForce * -1;
  }

  return enemy.sideForce;
}

export function updateEnemy(
  enemy: IEnemy,
  freeEnemyId: number,
  {
    top = settings.TOP,
    bottom = settings.BOTTOM,
    leftBoundary = boundaries.leftBoundary,
    rightBoundary = boundaries.rightBoundary,
    gotPastScreenCallback,
    destroyedCallback,
  }: {
    top?: number;
    bottom?: number;
    leftBoundary?: number;
    rightBoundary?: number;
    gotPastScreenCallback?: (thisEnemy: IEnemy) => void;
    destroyedCallback?: (thisEnemy: IEnemy) => void;
  } = {}
) {
  if (enemy.y < bottom) {
    if (gotPastScreenCallback) {
      gotPastScreenCallback(enemy);
    }
    return rebuildEnemy(enemy);
  }

  if (_checkIfEnemyVanished(enemy)) {
    return rebuildEnemy(enemy);
  }

  if (freeEnemyId === enemy.id) {
    return Object.assign(enemy, {
      x: random(leftBoundary, rightBoundary, true),
      y: top,
      isActive: true,
      emittedAt: Date.now(),
    });
  }

  if (enemy.energy <= 0 && !enemy.isDestroyed && destroyedCallback) {
    destroyedCallback(enemy);
  }

  return Object.assign(enemy, {
    x: clamp(
      enemy.x + _getNewEnemySideforce(enemy) * timeUnit,
      leftBoundary,
      rightBoundary
    ),
    y: enemy.y - enemy.velocity * timeUnit,
    rotation:
      enemy.rotation + deg(_getNewEnemySideforce(enemy) * 10 * timeUnit),
    isDestroyed: enemy.energy <= 0,
    opacity: _getNewEnemyOpacity(enemy),
    sideForce: _getNewEnemySideforce(enemy),
  });
}

export function handleEnemyCollision(
  enemy: IEnemy,
  enemiesHit: number[],
  hitCallback?: (thisEnemy: IEnemy) => void
) {
  let { energy } = enemy;

  if (enemiesHit.some(enemyId => enemyId === enemy.id)) {
    energy -= 1;

    if (hitCallback) {
      hitCallback(enemy);
    }
  }

  return Object.assign(enemy, { energy });
}

export function rebuildEnemy(enemy: IEnemy): IEnemy {
  const minDelay = Math.max(MIN_REBORN_TIME - enemy.level * 10, 300);
  const maxDelay = Math.max(MAX_REBORN_TIME - enemy.level * 10, 500);
  const maxVelocity = Math.min(MAX_VELOCITY + enemy.level * 2 / 100, 0.1);
  const energy = random(1, 100) > 80 ? Math.min(enemy.level + 1, 3) : 1;
  const velocity = _getVelocity(energy, maxVelocity, enemy.level);
  const sideForce = energy > 1 ? 0 : random(-0.1, 0.1, true);
  const level = enemy.level + 1;
  const defaultEnemy = getDefaultEnemy(enemy.id);

  return Object.assign(enemy, defaultEnemy, {
    x: OFFSCREEN,
    y: OFFSCREEN,
    opacity: 1,
    rotation: 0,
    isActive: false,
    emittedAt: undefined,
    isUsed: true,
    isDestroyed: false,
    sideForce,
    velocity,
    level,
    delay: random(minDelay, maxDelay),
    initialEnergy: energy,
    energy,
    score: _calculateScore({
      velocity,
      sideForce,
      level,
      initialEnergy: energy,
    }),
  });
}

export function getDefaultEnemy(id: number): IEnemy {
  const DEFAULT_ENERGY = 1;
  const DEFAULT_LEVEL = 1;
  const DEFAULT_SIDE_FORCE = 0;
  const velocity = random(MIN_VELOCITY, MAX_VELOCITY, true);

  return {
    id,
    x: OFFSCREEN,
    y: OFFSCREEN,
    opacity: 1,
    rotation: 0,
    isActive: false,
    isUsed: false,
    isDestroyed: false,
    energy: DEFAULT_ENERGY,
    initialEnergy: DEFAULT_ENERGY,
    level: DEFAULT_LEVEL,
    sideForce: DEFAULT_SIDE_FORCE,
    velocity,
    delay: random(MIN_REBORN_TIME, MAX_REBORN_TIME),
    score: _calculateScore({
      velocity,
      initialEnergy: DEFAULT_ENERGY,
      sideForce: DEFAULT_SIDE_FORCE,
      level: DEFAULT_LEVEL,
    }),
  };
}

function _getVelocity(energy: number, maxVelocity: number, level: number) {
  switch (energy) {
    case 1:
      return random(MIN_VELOCITY + level / 40, maxVelocity, true);
    case 2:
      return random(MIN_VELOCITY, MIN_VELOCITY + 0.01, true);
    case 3:
      return MIN_VELOCITY;
    default:
      return 0;
  }
}

function _calculateScore({
  velocity,
  sideForce,
  level,
  initialEnergy,
}: {
  velocity: number;
  sideForce: number;
  level: number;
  initialEnergy: number;
}) {
  const velocityScore = velocity || 0.01;
  const sideForceScore = sideForce || 0.01;

  return Math.ceil(
    level +
      Math.pow(velocityScore, 3) * 100 +
      Math.pow(sideForceScore, 3) * 1000 +
      initialEnergy
  );
}
