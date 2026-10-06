import { range } from 'lodash';
import { circlePointCollision } from './collisionDetection';
import { IEnemy } from './enemies';
import { timeUnit } from './gameLoop';
import * as settings from './settings';

export interface IBullet {
  emittedAt?: number;
  height: number;
  id: number;
  isActive: boolean;
  x: number;
  y: number;
}

export function generateBullets(maxNr: number) {
  const OFFSCREEN = 9999;
  const array = range(maxNr);

  return array.map(index => ({
    emittedAt: undefined,
    height: 0.6,
    id: index,
    isActive: false,
    x: OFFSCREEN,
    y: OFFSCREEN,
  }));
}

export function getFreeBulletId(bullets: IBullet[], isShoot: boolean) {
  const NON_EXISTENT_ID = -1;

  if (!isShoot) {
    return NON_EXISTENT_ID;
  }

  const MIN_DELAY = 400;
  const lastBullet = bullets
    .filter(bullet => bullet.isActive)
    .sort((bulletA, bulletB) => (bulletB.emittedAt ?? 0) - (bulletA.emittedAt ?? 0))[0];

  if (!lastBullet || Date.now() - (lastBullet.emittedAt ?? 0) > MIN_DELAY) {
    const freeBullet = bullets.find(bullet => !bullet.isActive);

    if (freeBullet) {
      return freeBullet.id;
    }
  }

  return NON_EXISTENT_ID;
}

export function updateBullet(
  bullet: IBullet,
  freeBulletId: number,
  x: number,
  {
    defaultY = settings.XSHIP_Y,
    bulletSpeed = settings.BULLET_SPEED,
    maxBulletsOnScreen = settings.MAX_BULLETS_ON_SCREEN,
    bulletEmittedCallback,
    bulletReachedScreenEndCallback,
  }: {
    defaultY?: number;
    bulletSpeed?: number;
    maxBulletsOnScreen?: number;
    bulletEmittedCallback?: (thisBullet: IBullet) => void;
    bulletReachedScreenEndCallback?: (thisBullet: IBullet) => void;
  } = {}
) {
  const updatedBullet = {
    emittedAt: bullet.emittedAt,
    isActive: bullet.isActive,
    x: bullet.x,
    y: bullet.y,
  };

  if (bullet.isActive && bullet.y > bullet.height * maxBulletsOnScreen) {
    updatedBullet.isActive = false;

    if (bulletReachedScreenEndCallback) {
      bulletReachedScreenEndCallback(bullet);
    }
  }

  if (bullet.isActive) {
    updatedBullet.y += bulletSpeed * timeUnit;
  }

  if (bullet.id === freeBulletId) {
    updatedBullet.isActive = true;
    updatedBullet.x = x;
    updatedBullet.y = defaultY + 0.9;
    updatedBullet.emittedAt = Date.now();

    if (bulletEmittedCallback) {
      bulletEmittedCallback(bullet);
    }
  }

  return Object.assign(bullet, updatedBullet);
}

export function detectBulletCollisionAgainstEnemies(
  bullet: IBullet,
  enemies: IEnemy[],
  {
    collisionCallback,
  }: {
    collisionCallback?: (enemy: IEnemy) => void;
  } = {}
) {
  if (!bullet.isActive) {
    return;
  }

  enemies.forEach(enemy => {
    const enemyRange = {
      radius: 0.8,
      x: enemy.x,
      y: enemy.y,
    };

    if (
      enemy.isActive &&
      !enemy.isDestroyed &&
      circlePointCollision(bullet.x, bullet.y, enemyRange)
    ) {
      bullet.isActive = false;

      if (collisionCallback) {
        collisionCallback(enemy);
      }
    }
  });
}
