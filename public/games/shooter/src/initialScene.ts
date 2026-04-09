import { IEnemy } from './enemies';
import {
  resetEnemiesAppearanceInScene,
  updateEnemyInScene,
} from './gameLayer/enemies';
import { GameStatus } from './gameState';
import { IEls, IGameStateData } from './main';
import { updateScore } from './score';
import { isShoot, resetUserEvents } from './userEvents';

export default function(
  lastGameState: IGameStateData,
  enemies: IEnemy[],
  els: IEls
) {
  const { gameOverEl, scoreEl } = els;

  if (isShoot) {
    lastGameState.gameStatus = GameStatus.game;
    resetUserEvents(200);
  }

  if (gameOverEl) {
    gameOverEl.classList.remove('is-show');
  }

  if (els.livesEl) {
    els.livesEl.textContent = String(lastGameState.lives);
  }

  updateScore(scoreEl, lastGameState.score);
  resetEnemiesAppearanceInScene(enemies);

  enemies.forEach(enemy => updateEnemyInScene(enemy));
}
