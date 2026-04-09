import { random, range } from 'lodash';
import { GAME_HEIGHT, leftBoundary } from './boundaries';
import { timeUnit } from './gameLoop';
import { deg } from './utils';

const OFFSCREEN = -9999;
const HEX_HEIGHT = 2;
const ROWS_NR = 12;
const COLUMNS_NR = 6;

export interface IHex {
  realX: number;
  x: number;
  y: number;
  rotationX: number;
  flipSpeed: number;
  isHidden: boolean;
}

export function generateHexBg(rows = ROWS_NR, columns = COLUMNS_NR) {
  const rowArr = range(rows);
  const colArr = range(columns);

  return rowArr.reduce(
    (array, rowIndex) => {
      return array.concat(
        colArr.map(colIndex => generateHex(colIndex, rowIndex))
      );
    },
    [] as IHex[]
  );
}

export function updateHex(hex: IHex) {
  const SPEED = timeUnit * 0.1;
  const isRestart = hex.y <= -HEX_HEIGHT - GAME_HEIGHT / 2 + HEX_HEIGHT / 4;

  if (isRestart) {
    const isHidden = random(0, 3) === 0;
    hex.x = isHidden ? OFFSCREEN : hex.realX;
    hex.y =
      hex.y +
      ROWS_NR * HEX_HEIGHT -
      GAME_HEIGHT / 2 +
      3 * HEX_HEIGHT / 4 -
      SPEED;
  } else {
    hex.y = hex.y - SPEED;
  }
}

function generateHex(x: number, y: number): IHex {
  const HEX_WIDTH = Math.sqrt(3) / 2 * HEX_HEIGHT;
  const adjustedX =
    y % 2 === 0
      ? x * HEX_WIDTH - HEX_WIDTH / 2 + leftBoundary
      : x * HEX_WIDTH - HEX_WIDTH / 2 + leftBoundary + HEX_WIDTH / 2;
  const isHidden = random(0, 3) === 0;

  return {
    realX: adjustedX,
    x: isHidden ? OFFSCREEN : adjustedX,
    y: y * HEX_HEIGHT - GAME_HEIGHT / 2 - y * HEX_HEIGHT / 4,
    rotationX: deg(0),
    flipSpeed: random(0.05, 0.1, true),
    isHidden,
  };
}
