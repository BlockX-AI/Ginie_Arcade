import { BoardItem, Board } from "../types";
import { uniqueId, random } from "lodash";

export const tileItems = ["tile_a", "tile_b", "tile_c", "tile_d", "tile_e", "tile_f", "tile_g"];
export const boardWidth = 5;

export const generateRandomTile = () => {
  const tileOptions = tileItems.length - 1;
  return tileItems[random(tileOptions)];
};

export const generateRandomBoardItem = (emptyItem?: boolean, special?: string | null): BoardItem => {
  return { 
    id: uniqueId(), 
    type: emptyItem ? "" : generateRandomTile(),
    special: special || null
  };
};

export const generateItems = (size: number): BoardItem[] => {
  const randomItems: BoardItem[] = [];

  for (let i = 0; i < size; i++) {
    const randomEmoji = generateRandomBoardItem();
    randomItems.push(randomEmoji);
  }

  return randomItems;
};

export const generateBoard = (size: number): Board => {
  const board: Board = [];
  for (let i = 0; i < size; i++) {
    board.push(generateItems(size));
  }

  return board;
};
