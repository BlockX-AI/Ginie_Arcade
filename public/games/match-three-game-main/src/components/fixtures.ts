import { Board, BoardItem, BoardRow } from "./types";

export const mockBoard: Board = [
  [
    { id: "1", type: "tile_a" },
    { id: "2", type: "tile_b" },
    { id: "3", type: "tile_a" },
    { id: "4", type: "tile_c" },
    { id: "5", type: "tile_c" },
  ],
  [
    { id: "6", type: "tile_b" },
    { id: "7", type: "tile_d" },
    { id: "8", type: "tile_b" },
    { id: "9", type: "tile_b" },
    { id: "10", type: "tile_c" },
  ],
  [
    { id: "11", type: "tile_c" },
    { id: "12", type: "tile_c" },
    { id: "13", type: "tile_b" },
    { id: "14", type: "tile_e" },
    { id: "15", type: "tile_e" },
  ],
  [
    { id: "16", type: "tile_e" },
    { id: "17", type: "tile_b" },
    { id: "18", type: "tile_e" },
    { id: "19", type: "tile_b" },
    { id: "20", type: "tile_c" },
  ],
  [
    { id: "21", type: "tile_c" },
    { id: "22", type: "tile_b" },
    { id: "23", type: "tile_d" },
    { id: "24", type: "tile_c" },
    { id: "25", type: "tile_e" },
  ],
  [
    { id: "26", type: "tile_b" },
    { id: "27", type: "tile_d" },
    { id: "28", type: "tile_d" },
    { id: "29", type: "tile_c" },
    { id: "30", type: "tile_e" },
  ],
];

export const mockEmptyBoard: Board = [
  [
    { id: "1", type: "tile_a" },
    { id: "2", type: "tile_b" },
    { id: "3", type: "tile_a" },
    { id: "4", type: "tile_c" },
    { id: "5", type: "tile_c" },
  ],
  [
    { id: "6", type: "tile_b" },
    { id: "7", type: "tile_d" },
    { id: "8", type: "tile_b" },
    { id: "9", type: "tile_b" },
    { id: "10", type: "tile_c" },
  ],
  [
    { id: "11", type: "tile_c" },
    { id: "12", type: "tile_c" },
    { id: "13", type: "" },
    { id: "14", type: "" },
    { id: "15", type: "" },
  ],

  [
    { id: "16", type: "tile_e" },
    { id: "17", type: "tile_b" },
    { id: "18", type: "tile_e" },
    { id: "19", type: "tile_d" },
    { id: "20", type: "tile_e" },
  ],
  [
    { id: "21", type: "tile_c" },
    { id: "22", type: "tile_b" },
    { id: "23", type: "tile_d" },
    { id: "24", type: "tile_c" },
    { id: "25", type: "tile_e" },
  ],
  [
    { id: "26", type: "tile_b" },
    { id: "27", type: "tile_e" },
    { id: "28", type: "tile_d" },
    { id: "29", type: "tile_b" },
    { id: "30", type: "tile_e" },
  ],
];

export const mockUpcomingItems: Partial<BoardItem>[] = [
  { type: "tile_e" },
  { type: "tile_b" },
  { type: "tile_d" },
  { type: "tile_c" },
  { type: "tile_d" },
];

export const updateRowInMockBoard = (row: BoardRow, indexToReplace: number) => {
  const newBoard = [...mockBoard];

  newBoard.splice(indexToReplace, 1, row);

  return newBoard;
};
