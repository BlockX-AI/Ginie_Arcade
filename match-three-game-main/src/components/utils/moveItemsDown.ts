import { Board } from "../types";
import { generateRandomTile } from "./generateBoard";

const GRID_SIZE = 8;

// Collapse board by moving tiles down and spawning new ones at top
export const moveItemsDown = (board: Board): Board => {
  // Process each column
  for (let c = 0; c < GRID_SIZE; c++) {
    // Collect all non-empty tiles in this column from bottom to top
    const column: string[] = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (board[r][c] && board[r][c].type && board[r][c].type !== "") {
        column.push(board[r][c].type!);
      }
    }
    
    // Fill the rest with new random tiles
    while (column.length < GRID_SIZE) {
      column.push(generateRandomTile());
    }
    
    // Reverse to get top-to-bottom order
    column.reverse();
    
    // Update the board column
    for (let r = 0; r < GRID_SIZE; r++) {
      if (board[r][c]) {
        board[r][c].type = column[r];
        board[r][c].isMatch = false;
        board[r][c].animate = true;
        // Don't reset special property if it exists
        if (!board[r][c].special) {
          board[r][c].special = null;
        }
      }
    }
  }
  
  return board;
};
