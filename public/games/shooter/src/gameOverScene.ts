import { getFreeBulletId, IBullet, updateBullet } from './bullets';
import { getFreeEnemyId, IEnemy, updateEnemy } from './enemies';
import { GameStatus } from './gameState';
import { IEls, IGameStateData, IXShipStateData } from './main';
import { isShoot, resetUserEvents } from './userEvents';
import { destroyXShip } from './xShip';

export default function(
  gameState: IGameStateData,
  bullets: IBullet[],
  enemies: IEnemy[],
  els: IEls,
  lastXShipState: IXShipStateData
) {
  const { gameOverEl } = els;
  const freeBulletId = getFreeBulletId(bullets, isShoot);
  const freeEnemyId = getFreeEnemyId(enemies);

  bullets.forEach(bullet =>
    updateBullet(bullet, freeBulletId, lastXShipState.positionX)
  );
  enemies.forEach(enemy => updateEnemy(enemy, freeEnemyId));

  if (isShoot) {
    gameState.gameStatus = GameStatus.initial;
    resetUserEvents();
  }

  if (gameOverEl) {
    gameOverEl.classList.add('is-show');
  }

  destroyXShip(lastXShipState);
}
