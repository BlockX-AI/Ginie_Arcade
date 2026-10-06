import { IBullet } from './bullets';
import { clockGet, clockReset } from './clock';
import { IEnemy } from './enemies';
import { GameState, GameStatus } from './gameState';
import { IHex } from './hexBg';
import { IEls, IGameStateData, IXShipStateData } from './main';
import { isMoveLeft, isMoveRight, mouseX } from './userEvents';
import { moveXShip } from './xShip';

export default function(
  bulletsState: GameState<IBullet[]>,
  prevBulletsStates: GameState<IBullet[]>,
  enemiesState: GameState<IEnemy[]>,
  prevEnemiesStates: GameState<IEnemy[]>,
  hexBgState: GameState<IHex[]>,
  prevHexBgStates: GameState<IHex[]>,
  gameStatesCache: GameState<IGameStateData>,
  prevGameStates: GameState<IGameStateData>,
  gameState: GameState<IGameStateData>,
  lastGameState: IGameStateData,
  prevGameState: IGameStateData,
  els: IEls,
  lastXShipState: IXShipStateData
) {
  if (prevGameState.gameStatus !== lastGameState.gameStatus) {
    clockReset();

    if (els.flashEl) {
      els.flashEl.classList.add('is-active');
    }

    const gameStateData = Object.assign(lastGameState, {
      gameStatus: GameStatus.autoRewind,
    });

    gameStatesCache.add(gameStateData);
    prevEnemiesStates.align('isDestroyed', true);
    prevEnemiesStates.align('opacity', 0);
  }

  if (clockGet() > 2.5) {
    const prevEnemies = prevEnemiesStates.use() as IEnemy[];
    const prevState = prevGameStates.use();
    const prevBulletsState = prevBulletsStates.use();
    const prevHexBgState = prevHexBgStates.use();

    if (prevBulletsState) {
      bulletsState.add(prevBulletsState);
    }

    if (prevEnemies) {
      enemiesState.add(prevEnemies);
    }

    if (prevHexBgState) {
      hexBgState.add(prevHexBgState);
    }

    if (prevState) {
      if (els.flashEl) {
        els.flashEl.classList.remove('is-active');
      }

      moveXShip(lastXShipState, isMoveLeft, isMoveRight, {
        mouseX,
      });
    } else {
      const gameStateData = Object.assign(prevGameStates.get(), {
        gameStatus: GameStatus.game,
        lives: lastGameState.lives,
      }) as IGameStateData;

      gameState.add(gameStateData);
      gameStatesCache.add(gameStateData);
      bulletsState.add(prevBulletsStates.get() as IBullet[]);
      enemiesState.add(prevEnemiesStates.get() as IEnemy[]);
      hexBgState.add(prevHexBgStates.get() as IHex[]);
    }
  }
}
