import { IBullet } from '../bullets';
import { IEnemy } from '../enemies';
import { GameStatus } from '../gameState';
import { IHex } from '../hexBg';
import { IGameStateData, IXShipStateData } from '../main';
import { updateBullet } from './bullets';
import { updateEnemyInScene } from './enemies';
import { flipBackHex, flipHex, updateHexInScene } from './hexBg';
import { updatePlaneInScene } from './planeBg';
import { updateXShip } from './xShip';

export function updateRender(
  gameState: IGameStateData,
  xShip: IXShipStateData,
  bullets: IBullet[],
  enemies: IEnemy[],
  hexBg: IHex[]
) {
  if (
    gameState.gameStatus === GameStatus.autoRewind ||
    gameState.gameStatus === GameStatus.game ||
    gameState.gameStatus === GameStatus.gameOver
  ) {
    updateXShip(xShip);
    enemies.forEach(enemy => updateEnemyInScene(enemy));
  }

  if (
    gameState.gameStatus === GameStatus.game ||
    gameState.gameStatus === GameStatus.gameOver
  ) {
    bullets.forEach(updateBullet);
    hexBg.forEach(updateHexInScene);
    hexBg.forEach(flipBackHex);
    updatePlaneInScene(true);
  }

  if (gameState.gameStatus === GameStatus.autoRewind) {
    bullets.forEach(updateBullet);
    hexBg.forEach(updateHexInScene);
    hexBg.forEach(flipHex);
    updatePlaneInScene(false);
  }
}
