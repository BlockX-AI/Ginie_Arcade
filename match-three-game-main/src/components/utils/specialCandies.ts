import { Board } from "../types";

// Special candy types
export const SP_H = "SP_H";        // Horizontal striped
export const SP_V = "SP_V";        // Vertical striped
export const SP_BOMB = "SP_BOMB";  // 5x5 bomb
export const SP_LINE = "SP_LINE";  // Cross blast (row + column)

const GRID_SIZE = 8;

// Get icon for special candy
export function getSpecialIcon(special: string | null | undefined): string {
  if (special === SP_H) return "↔";
  if (special === SP_V) return "↕";
  if (special === SP_BOMB) return "💣";
  if (special === SP_LINE) return "🌈";
  return "";
}

// Activate special candy and return cells to destroy
export function activateSpecial(board: Board, r: number, c: number): [number, number][] {
  const cell = board[r][c];
  if (!cell?.special) return [];
  
  const out = new Set<string>();
  
  // Horizontal line
  if (cell.special === SP_H || cell.special === SP_LINE) {
    for (let cc = 0; cc < GRID_SIZE; cc++) {
      out.add(`${r},${cc}`);
    }
  }
  
  // Vertical line
  if (cell.special === SP_V || cell.special === SP_LINE) {
    for (let rr = 0; rr < GRID_SIZE; rr++) {
      out.add(`${rr},${c}`);
    }
  }
  
  // Bomb (5x5 area)
  if (cell.special === SP_BOMB) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
          out.add(`${nr},${nc}`);
        }
      }
    }
  }
  
  return Array.from(out).map(s => {
    const [row, col] = s.split(',').map(Number);
    return [row, col] as [number, number];
  });
}

// Analyze matches to determine special candy type
export function analyzeMatchesForSpecial(
  board: Board,
  matches: [number, number][]
): { type: string | null; position: [number, number] | null } {
  if (matches.length === 0) return { type: null, position: null };
  
  // Group by row and column
  const byRow: { [key: number]: number[] } = {};
  const byCol: { [key: number]: number[] } = {};
  
  matches.forEach(([r, c]) => {
    if (!byRow[r]) byRow[r] = [];
    if (!byCol[c]) byCol[c] = [];
    byRow[r].push(c);
    byCol[c].push(r);
  });
  
  // Find longest horizontal run
  let hMax = 0;
  let hCenter: [number, number] | null = null;
  Object.entries(byRow).forEach(([r, cols]) => {
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
    if (best > hMax) {
      hMax = best;
      hCenter = [+r, cols[Math.floor(cols.length / 2)]];
    }
  });
  
  // Find longest vertical run
  let vMax = 0;
  let vCenter: [number, number] | null = null;
  Object.entries(byCol).forEach(([c, rows]) => {
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
    if (best > vMax) {
      vMax = best;
      vCenter = [rows[Math.floor(rows.length / 2)], +c];
    }
  });
  
  // Determine special type
  if (hMax >= 5 || vMax >= 5) {
    const center = hMax >= 5 ? hCenter : vCenter;
    return { type: SP_BOMB, position: center };
  } else if (hMax === 4) {
    return { type: SP_H, position: hCenter };
  } else if (vMax === 4) {
    return { type: SP_V, position: vCenter };
  }
  
  return { type: null, position: null };
}
