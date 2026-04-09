import { Board } from "../types";

const GRID_SIZE = 8;

// Find all matches on the board (horizontal and vertical)
export function findMatches(board: Board): [number, number][] {
  const matched = new Set<string>();
  
  // Check horizontal matches
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 2; c++) {
      const tile1 = board[r][c];
      const tile2 = board[r][c + 1];
      const tile3 = board[r][c + 2];
      
      if (tile1 && tile2 && tile3 && 
          tile1.type && tile2.type && tile3.type &&
          tile1.type === tile2.type && tile1.type === tile3.type) {
        // Found a match, add all matching tiles in this row
        let k = c;
        while (k < GRID_SIZE && board[r][k] && board[r][k].type === tile1.type) {
          matched.add(`${r},${k}`);
          k++;
        }
      }
    }
  }
  
  // Check vertical matches
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE - 2; r++) {
      const tile1 = board[r][c];
      const tile2 = board[r + 1][c];
      const tile3 = board[r + 2][c];
      
      if (tile1 && tile2 && tile3 &&
          tile1.type && tile2.type && tile3.type &&
          tile1.type === tile2.type && tile1.type === tile3.type) {
        // Found a match, add all matching tiles in this column
        let k = r;
        while (k < GRID_SIZE && board[k][c] && board[k][c].type === tile1.type) {
          matched.add(`${k},${c}`);
          k++;
        }
      }
    }
  }
  
  return Array.from(matched).map(s => {
    const [r, c] = s.split(',').map(Number);
    return [r, c] as [number, number];
  });
}

export const removeMatchedItems = (
  board: Board,
  onMatch: (matchCount: number) => void
) => {
  const matches = findMatches(board);
  
  if (matches.length > 0) {
    // Mark matched tiles for removal by setting type to empty string
    matches.forEach(([r, c]) => {
      if (board[r] && board[r][c]) {
        board[r][c].type = "";
        board[r][c].isMatch = true;
      }
    });
    
    onMatch(matches.length);
  }
};
