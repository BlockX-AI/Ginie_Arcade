import { Board } from "../types";
import { findMatches } from "./removeMatchedItems";

const GRID_SIZE = 8;

export interface Hint {
  swapA: [number, number];
  swapB: [number, number];
  cells: [number, number][];
  type: string;
  label: string;
  score: number;
}

// Find all possible hints on the board
export function findAllHints(board: Board): Hint[] {
  const hints: Hint[] = [];
  const dirs = [[0, 1], [1, 0]];
  
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      for (const [dr, dc] of dirs) {
        const r2 = r + dr;
        const c2 = c + dc;
        if (r2 >= GRID_SIZE || c2 >= GRID_SIZE) continue;
        
        // Try swap - create a copy of the board
        const nb = board.map(row => row.map(cell => ({ ...cell })));
        [nb[r][c], nb[r2][c2]] = [nb[r2][c2], nb[r][c]];
        
        const matches = findMatches(nb);
        if (matches.length === 0) continue;
        
        // Check for specials
        let hasSpecial = false;
        matches.forEach(([mr, mc]: [number, number]) => {
          if (board[mr][mc]?.special) hasSpecial = true;
        });
        if (board[r][c]?.special || board[r2][c2]?.special) hasSpecial = true;
        
        // Analyze match length
        const maxRun = getMaxRun(nb, matches);
        
        let type = "match3";
        let label = "Match here!";
        
        if (hasSpecial) {
          type = "special_blast";
          label = "BLAST! 💥";
        } else if (maxRun >= 5) {
          type = "match5";
          label = "Match 5! BOMB! 💣";
        } else if (maxRun >= 4) {
          type = "match4";
          label = "Match 4! Striped! ⚡";
        } else {
          type = "match3";
          label = "Match 3! 🍬";
        }
        
        hints.push({
          swapA: [r, c],
          swapB: [r2, c2],
          cells: matches,
          type,
          label,
          score: matches.length * (hasSpecial ? 5 : maxRun >= 5 ? 4 : maxRun >= 4 ? 3 : 1),
        });
      }
    }
  }
  
  // Sort by priority
  hints.sort((a, b) => {
    const order: { [key: string]: number } = {
      special_blast: 0,
      match5: 1,
      match4: 2,
      match3: 3,
    };
    return (order[a.type] || 3) - (order[b.type] || 3) || b.score - a.score;
  });
  
  return hints;
}

function getMaxRun(board: Board, matches: [number, number][]): number {
  const byRow: { [key: number]: number[] } = {};
  const byCol: { [key: number]: number[] } = {};
  
  matches.forEach(([r, c]) => {
    if (!byRow[r]) byRow[r] = [];
    if (!byCol[c]) byCol[c] = [];
    byRow[r].push(c);
    byCol[c].push(r);
  });
  
  let hMax = 0;
  Object.values(byRow).forEach(cols => {
    cols.sort((a, b) => a - b);
    let run = 1;
    let best = 1;
    for (let i = 1; i < cols.length; i++) {
      if (cols[i] === cols[i - 1] + 1) {
        run++;
        if (run > best) best = run;
      } else {
        run = 1;
      }
    }
    if (best > hMax) hMax = best;
  });
  
  let vMax = 0;
  Object.values(byCol).forEach(rows => {
    rows.sort((a, b) => a - b);
    let run = 1;
    let best = 1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] === rows[i - 1] + 1) {
        run++;
        if (run > best) best = run;
      } else {
        run = 1;
      }
    }
    if (best > vMax) vMax = best;
  });
  
  return Math.max(hMax, vMax);
}
