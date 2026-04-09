import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import AudioManager from "../../utils/AudioManager";
import styles from "./EnhancedGame.module.css";

const audioManager = AudioManager.getInstance();

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const G = 8;
const TYPES = ["tile_a", "tile_b", "tile_c", "tile_d", "tile_e", "tile_f"];
const COLORS = {
  "tile_a": { bg: "#FF6B9D", sh: "#C94B7A", glow: "rgba(255,107,157,.75)" },
  "tile_b": { bg: "#4ECDC4", sh: "#2BA39B", glow: "rgba(78,205,196,.75)" },
  "tile_c": { bg: "#8B5E3C", sh: "#5C3A1E", glow: "rgba(139,94,60,.75)" },
  "tile_d": { bg: "#FF9F43", sh: "#E07B1A", glow: "rgba(255,159,67,.75)" },
  "tile_e": { bg: "#A55EEA", sh: "#7B3DB8", glow: "rgba(165,94,234,.75)" },
  "tile_f": { bg: "#FFD93D", sh: "#C9A800", glow: "rgba(255,217,61,.75)" },
};
const CELL = 48;

const PERF = [
  { pts: 10, label: "Nice!", color: "#aaa", emoji: "✨" },
  { pts: 30, label: "Sweet!", color: "#FF9F43", emoji: "🍬" },
  { pts: 60, label: "Tasty!", color: "#4ECDC4", emoji: "😋" },
  { pts: 100, label: "Delicious!", color: "#FF6B9D", emoji: "🤩" },
  { pts: 150, label: "On Fire!", color: "#FFD93D", emoji: "🔥" },
  { pts: 200, label: "UNSTOPPABLE!", color: "#A55EEA", emoji: "💥" },
  { pts: 300, label: "CANDY LEGEND!", color: "#fff", emoji: "👑" },
];
const CHAIN_WORDS = ["Sweet!", "Incredible!", "Amazing!!", "LEGENDARY!!!", "GODLIKE!!!!"];

// ─── BOARD HELPERS ─────────────────────────────────────────────────────────────
const rc = () => TYPES[Math.floor(Math.random() * TYPES.length)];
const mk = (type = rc(), special: string | null = null) => ({ type, special });
const ct = (cell: any) => cell?.type ?? null;

function initBoard() {
  let b;
  do {
    b = Array.from({ length: G }, () => Array.from({ length: G }, () => mk()));
  } while (findMatches(b).length > 0);
  return b;
}

function findMatches(b: any[]) {
  const hit = new Set<string>();
  for (let r = 0; r < G; r++)
    for (let c = 0; c < G - 2; c++) {
      const t = ct(b[r][c]);
      if (t && t === ct(b[r][c + 1]) && t === ct(b[r][c + 2])) {
        let k = c;
        while (k < G && ct(b[r][k]) === t) {
          hit.add(`${r},${k}`);
          k++;
        }
      }
    }
  for (let c = 0; c < G; c++)
    for (let r = 0; r < G - 2; r++) {
      const t = ct(b[r][c]);
      if (t && t === ct(b[r + 1][c]) && t === ct(b[r + 2][c])) {
        let k = r;
        while (k < G && ct(b[k][c]) === t) {
          hit.add(`${k},${c}`);
          k++;
        }
      }
    }
  return Array.from(hit).map((s) => s.split(",").map(Number));
}

// ─── HINT ENGINE ──────────────────────────────────────────────────────────────
function findAllHints(b: any[]) {
  const hints: any[] = [];
  const dirs = [
    [0, 1],
    [1, 0],
  ];
  for (let r = 0; r < G; r++) {
    for (let c = 0; c < G; c++) {
      for (const [dr, dc] of dirs) {
        const r2 = r + dr,
          c2 = c + dc;
        if (r2 >= G || c2 >= G) continue;
        const nb = b.map((row: any[]) => row.map((ce: any) => (ce ? { ...ce } : null)));
        [nb[r][c], nb[r2][c2]] = [nb[r2][c2], nb[r][c]];
        const matches = findMatches(nb);
        if (matches.length === 0) continue;
        let hasSpecial = false;
        matches.forEach((match: any) => {
          const [mr, mc] = match;
          if (b[mr][mc]?.special) hasSpecial = true;
        });
        if (b[r][c]?.special || b[r2][c2]?.special) hasSpecial = true;
        const info = analyseMatches(nb, matches);
        const maxRun = Math.max(info.hMax, info.vMax);
        let type = "match3",
          label = "Match here!";
        if (hasSpecial) {
          type = "special_blast";
          label = "BLAST! 💥";
        } else if (maxRun >= 5) {
          type = "match5";
          label = "Match 5! BOMB! 💣";
        } else if (maxRun >= 4) {
          type = "match4";
          label = "Match 4! Striped! ⚡";
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
  hints.sort((a, b) => {
    const order: any = { special_blast: 0, match5: 1, match4: 2, match3: 3 };
    return (order[a.type] || 3) - (order[b.type] || 3) || b.score - a.score;
  });
  return hints;
}

function analyseMatches(b: any[], matches: any[]) {
  let hMax = 0,
    vMax = 0,
    hCenter: any = null,
    vCenter: any = null;
  const byRow: any = {},
    byCol: any = {};
  matches.forEach(([r, c]) => {
    (byRow[r] = byRow[r] || []).push(c);
    (byCol[c] = byCol[c] || []).push(r);
  });
  Object.entries(byRow).forEach(([r, cols]: any) => {
    cols.sort((a: number, b: number) => a - b);
    let run = 1,
      best = 1;
    for (let i = 1; i < cols.length; i++) {
      run = cols[i] === cols[i - 1] + 1 ? run + 1 : 1;
      if (run > best) best = run;
    }
    if (best > hMax) {
      hMax = best;
      hCenter = [+r, cols[Math.floor(cols.length / 2)]];
    }
  });
  Object.entries(byCol).forEach(([c, rows]: any) => {
    rows.sort((a: number, b: number) => a - b);
    let run = 1,
      best = 1;
    for (let i = 1; i < rows.length; i++) {
      run = rows[i] === rows[i - 1] + 1 ? run + 1 : 1;
      if (run > best) best = run;
    }
    if (best > vMax) {
      vMax = best;
      vCenter = [rows[Math.floor(rows.length / 2)], +c];
    }
  });
  return { hMax, vMax, hCenter, vCenter };
}

function collapse(b: any[]) {
  const nb = b.map((row) => row.map((c: any) => (c ? { ...c } : null)));
  for (let c = 0; c < G; c++) {
    const col = nb.map((r: any) => r[c]).filter(Boolean);
    while (col.length < G) col.unshift(mk());
    for (let r = 0; r < G; r++) nb[r][c] = col[r];
  }
  return nb;
}

// ─── SPECIAL TYPES ────────────────────────────────────────────────────────────
const SP_H = "SP_H";
const SP_V = "SP_V";
const SP_BOMB = "SP_BOMB";
const SP_LINE = "SP_LINE";
const spIcon = (s: string | null) =>
  s === SP_H ? "↔" : s === SP_V ? "↕" : s === SP_BOMB ? "💣" : s === SP_LINE ? "🌈" : "";

function activateSpecial(b: any[], r: number, c: number) {
  const cell = b[r][c];
  if (!cell?.special) return [];
  const out = new Set<string>();
  if (cell.special === SP_H || cell.special === SP_LINE)
    for (let cc = 0; cc < G; cc++) out.add(`${r},${cc}`);
  if (cell.special === SP_V || cell.special === SP_LINE)
    for (let rr = 0; rr < G; rr++) out.add(`${rr},${c}`);
  if (cell.special === SP_BOMB) {
    for (let dr = -2; dr <= 2; dr++)
      for (let dc = -2; dc <= 2; dc++) {
        const nr = r + dr,
          nc = c + dc;
        if (nr >= 0 && nr < G && nc >= 0 && nc < G) out.add(`${nr},${nc}`);
      }
  }
  return Array.from(out).map((s) => s.split(",").map(Number));
}

// ─── PERFORMANCE HELPERS ──────────────────────────────────────────────────────
function getPerfLabel(pts: number) {
  let best = PERF[0];
  for (const p of PERF) if (pts >= p.pts) best = p;
  return best;
}
function getRankLabel(score: number) {
  if (score < 50) return { emoji: "😅", label: "Newbie", color: "#aaa" };
  if (score < 150) return { emoji: "🍬", label: "Caramel", color: "#FF9F43" };
  if (score < 300) return { emoji: "🍊", label: "Citrus", color: "#4ECDC4" };
  if (score < 500) return { emoji: "🍭", label: "Lollipop", color: "#FF6B9D" };
  if (score < 750) return { emoji: "⭐", label: "Starman", color: "#FFD93D" };
  if (score < 1000) return { emoji: "🔥", label: "Blazer", color: "#A55EEA" };
  return { emoji: "👑", label: "CANDY GOD", color: "#fff" };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function EnhancedGame() {
  const [board, setBoard] = useState(initBoard);
  const [sel, setSel] = useState<number[] | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [moves, setMoves] = useState(30);
  const [levelTarget, setLevelTarget] = useState(500);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [busy, setBusy] = useState(false);
  const [litCells, setLitCells] = useState<any[]>([]);
  const [blastRows, setBlastRows] = useState<number[]>([]);
  const [blastCols, setBlastCols] = useState<number[]>([]);
  const [particles, setParticles] = useState<any[]>([]);
  const [toast, setToast] = useState<any>(null);
  const [chainToast, setChainToast] = useState<any>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Move cycle state (1→2→3)
  const [moveCycle, setMoveCycle] = useState(1);
  const [showCycleWarning, setShowCycleWarning] = useState(false);

  // HINT STATE
  const [, setHintIdx] = useState(0);
  const [hintCells, setHintCells] = useState<string[]>([]);
  const [hintSwap, setHintSwap] = useState<string[]>([]);
  const [hintLabel, setHintLabel] = useState("");
  const [hintType, setHintType] = useState("");
  const [hintVisible, setHintVisible] = useState(false);
  const [, setAllHints] = useState<any[]>([]);
  const [hintCountdown, setHintCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(false);

  const heatRef = useRef(0);
  const [heat, setHeat] = useState(0);

  const T = useRef<any[]>([]);
  const hintTimer = useRef<any>(null);
  const cdTimer = useRef<any>(null);
  const cdInterval = useRef<any>(null);
  const boardRef = useRef(board);
  boardRef.current = board;

  const timer = (fn: () => void, d: number) => {
    const t = setTimeout(fn, d);
    T.current.push(t);
    return t;
  };

  useEffect(() => {
    const timers = T.current;
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(hintTimer.current);
      clearTimeout(cdTimer.current);
      clearInterval(cdInterval.current);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!gameStarted || gameOver || won || busy) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameOver(true);
          audioManager.stopBackgroundMusic();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, won, busy]);

  // ── HINT TRIGGER ──
  const showHint = useCallback((hints: any[], idx: number) => {
    if (!hints || hints.length === 0) return;
    const h = hints[idx % hints.length];
    setHintCells(h.cells.map(([r, c]: [number, number]) => `${r},${c}`));
    setHintSwap([`${h.swapA[0]},${h.swapA[1]}`, `${h.swapB[0]},${h.swapB[1]}`]);
    setHintLabel(h.label);
    setHintType(h.type);
    setHintVisible(true);
    setHintIdx(idx);

    hintTimer.current = setTimeout(() => {
      showHint(hints, idx + 1);
    }, 2500);
  }, []);

  const resetHintTimer = useCallback((b: any) => {
    clearTimeout(hintTimer.current);
    clearTimeout(cdTimer.current);
    clearInterval(cdInterval.current);
    setHintVisible(false);
    setHintCells([]);
    setHintSwap([]);
    setHintLabel("");
    setShowCountdown(false);
    setHintCountdown(5);

    const hints = findAllHints(b || boardRef.current);
    setAllHints(hints);
    setHintIdx(0);

    if (hints.length === 0) return;

    let cd = 5;
    cdTimer.current = setTimeout(() => {
      setShowCountdown(true);
      cdInterval.current = setInterval(() => {
        cd--;
        setHintCountdown(cd);
        if (cd <= 0) clearInterval(cdInterval.current);
      }, 1000);
    }, 0);

    hintTimer.current = setTimeout(() => {
      setShowCountdown(false);
      showHint(hints, 0);
    }, 5000);
  }, [showHint]);


  useEffect(() => {
    if (gameStarted) {
      resetHintTimer(board);
      audioManager.playBackgroundMusic();
    }
  }, [gameStarted]); // eslint-disable-line

  // ── Particles ──
  const burst = useCallback((cells: any[], boardSnap: any[]) => {
    const ps = cells.slice(0, 30).map(([r, c]) => ({
      id: Math.random() + r * 1000 + c,
      r,
      c,
      color: COLORS[ct(boardSnap[r][c]) as keyof typeof COLORS]?.bg || "#FFD93D",
      dx: (Math.random() - 0.5) * 130,
      dy: (Math.random() - 0.5) * 130,
    }));
    setParticles((p) => [...p, ...ps]);
    timer(
      () => setParticles((p) => p.filter((x) => !ps.find((n) => n.id === x.id))),
      850
    );
  }, []);

  // ── Toast ──
  const showToast = useCallback((text: string, color: string, emoji: string, dur = 1300) => {
    const key = Math.random();
    setToast({ text, color, emoji, key });
    timer(() => setToast(null), dur);
  }, []);

  const showChain = useCallback((n: number) => {
    const key = Math.random();
    setChainToast({
      n,
      word: CHAIN_WORDS[Math.min(n - 2, CHAIN_WORDS.length - 1)],
      key,
    });
    timer(() => setChainToast(null), 1500);
  }, []);

  // ── Core cascade ──
  const cascade = useCallback(
    (b: any[], chain = 0) => {
      const matches = findMatches(b);
      let extraSet = new Set<string>();
      matches.forEach(([r, c]) => {
        if (b[r][c]?.special)
          activateSpecial(b, r, c).forEach(([er, ec]) => extraSet.add(`${er},${ec}`));
      });
      const extra = Array.from(extraSet)
        .map((s) => s.split(",").map(Number))
        .filter(([er, ec]) => !matches.find(([mr, mc]) => mr === er && mc === ec));
      const all = [...matches, ...extra];

      if (all.length === 0) {
        setBusy(false);
        timer(() => resetHintTimer(b), 300);
        return;
      }

      setLitCells(all);
      const pts = all.length * 10 * (chain + 1);
      setScore((s) => {
        const ns = s + pts;
        if (ns >= 1000) setWon(true);
        return ns;
      });

      const newHeat = Math.min(100, heatRef.current + Math.floor(pts / 2) + matches.length * 3);
      heatRef.current = newHeat;
      setHeat(newHeat);

      const perf = getPerfLabel(pts);
      showToast(`+${pts}  ${perf.label}`, perf.color, perf.emoji, 1200);
      if (chain >= 1) showChain(chain + 1);
      burst(all, b);

      audioManager.playMatchSound();

      // Check level completion
      setScore((currentScore) => {
        if (currentScore >= levelTarget) {
          const nextLevel = level + 1;
          setLevel(nextLevel);
          setLevelTarget(levelTarget + 500); // Increase target by 500 each level
          setMoves(Math.max(15, 30 - (nextLevel - 1) * 3)); // Reduce moves: 30→27→24→21→18→15
          showToast(`🎉 LEVEL ${nextLevel}! 🎉`, "#FFD700", "🏆", 2000);
        }
        return currentScore;
      });

      timer(() => {
        const nb = b.map((row) => row.map((c: any) => (c ? { ...c } : null)));
        all.forEach(([r, c]) => {
          nb[r][c] = null;
        });

        const info = analyseMatches(b, matches);
        if (heatRef.current >= 100 && matches.length >= 3) {
          const [lr, lc] = matches[Math.floor(matches.length / 2)];
          if (nb[lr]) nb[lr][lc] = mk(b[lr]?.[lc]?.type || rc(), SP_LINE);
          heatRef.current = 0;
          setHeat(0);
          timer(() => showToast("🌈 LINE CANDY BORN!", "#fff", "🌈", 800), 80);
        } else if (info.hMax >= 5 || info.vMax >= 5) {
          const center = info.hMax >= 5 ? info.hCenter : info.vCenter;
          if (center && nb[center[0]]) nb[center[0]][center[1]] = mk(b[center[0]]?.[center[1]]?.type || rc(), SP_BOMB);
        } else if (info.hMax === 4) {
          if (info.hCenter && nb[info.hCenter[0]])
            nb[info.hCenter[0]][info.hCenter[1]] = mk(b[info.hCenter[0]]?.[info.hCenter[1]]?.type || rc(), SP_H);
        } else if (info.vMax === 4) {
          if (info.vCenter && nb[info.vCenter[0]])
            nb[info.vCenter[0]][info.vCenter[1]] = mk(b[info.vCenter[0]]?.[info.vCenter[1]]?.type || rc(), SP_V);
        }

        const col = collapse(nb);
        setBoard(col);
        setLitCells([]);
        cascade(col, chain + 1);
      }, 420);
    },
    [burst, showToast, showChain, resetHintTimer]
  );

  // ── LINE BLAST trigger ──
  const triggerLineBlast = useCallback(
    (b: any[], r: number, c: number) => {
      setBlastRows([r]);
      setBlastCols([c]);
      showToast("💥 LINE BLAST!", "#FFD93D", "🌈", 1000);
      const allC: any[] = [];
      for (let cc = 0; cc < G; cc++) allC.push([r, cc]);
      for (let rr = 0; rr < G; rr++) if (rr !== r) allC.push([rr, c]);
      burst(allC, b);
      const pts = allC.length * 25;
      setScore((s) => {
        const ns = s + pts;
        if (ns >= 1000) setWon(true);
        return ns;
      });
      showToast(`+${pts}  DEVASTATING!`, "#FF6B9D", "💥", 1200);
      timer(() => {
        setBlastRows([]);
        setBlastCols([]);
        const nb = b.map((row) => row.map((c: any) => (c ? { ...c } : null)));
        allC.forEach(([r2, c2]) => {
          nb[r2][c2] = null;
        });
        const col = collapse(nb);
        setBoard(col);
        cascade(col, 1);
      }, 650);
    },
    [burst, showToast, cascade]
  );

  // ── Swap ──
  const swap = useCallback(
    (r1: number, c1: number, r2: number, c2: number) => {
      if (busy) return;
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;

      clearTimeout(hintTimer.current);
      clearInterval(cdInterval.current);
      setHintVisible(false);
      setHintCells([]);
      setHintSwap([]);
      setShowCountdown(false);

      const nb = board.map((row) => row.map((c: any) => (c ? { ...c } : null)));
      [nb[r1][c1], nb[r2][c2]] = [nb[r2][c2], nb[r1][c1]];
      const matches = findMatches(nb);
      const hasSpecial = nb[r1][c1]?.special || nb[r2][c2]?.special;
      if (matches.length === 0 && !hasSpecial) {
        setLitCells([
          [r1, c1],
          [r2, c2],
        ]);
        timer(() => setLitCells([]), 320);
        resetHintTimer(board);
        return;
      }

      setBusy(true);
      setBoard(nb);

      // Move cycle logic
      const nextCycle = moveCycle === 3 ? 1 : moveCycle + 1;
      
      if (moveCycle === 2) {
        // Show warning for next move
        setShowCycleWarning(true);
        timer(() => setShowCycleWarning(false), 2000);
      }

      if (moveCycle === 3) {
        // LINE BLAST on move 3!
        timer(() => triggerLineBlast(nb, r1, c1), 200);
        setMoveCycle(1);
      } else {
        setMoveCycle(nextCycle);
        
        if (nb[r1][c1]?.special === SP_LINE) {
          timer(() => triggerLineBlast(nb, r1, c1), 200);
        } else if (nb[r2][c2]?.special === SP_LINE) {
          timer(() => triggerLineBlast(nb, r2, c2), 200);
        } else {
          cascade(nb, 0);
        }
      }

      setMoves((m) => {
        const nm = m - 1;
        if (nm <= 0) timer(() => setGameOver(true), 1200);
        return nm;
      });
    },
    [board, busy, cascade, triggerLineBlast, resetHintTimer, moveCycle]
  );

  const handleClick = (r: number, c: number) => {
    if (busy || gameOver || won) return;
    clearTimeout(hintTimer.current);
    clearInterval(cdInterval.current);
    setHintVisible(false);
    setHintCells([]);
    setHintSwap([]);
    setShowCountdown(false);

    if (!sel) {
      setSel([r, c]);
      return;
    }
    const [sr, sc] = sel;
    setSel(null);
    if (sr === r && sc === c) {
      resetHintTimer(board);
      return;
    }
    swap(sr, sc, r, c);
  };

  const startGame = () => {
    setGameStarted(true);
    audioManager.playBackgroundMusic();
  };

  const reset = () => {
    T.current.forEach(clearTimeout);
    clearTimeout(hintTimer.current);
    clearInterval(cdInterval.current);
    const nb = initBoard();
    setBoard(nb);
    setScore(0);
    setLevel(1);
    setLevelTarget(500);
    setMoves(30);
    setTimeLeft(120);
    setSel(null);
    setBusy(false);
    setLitCells([]);
    setBlastRows([]);
    setBlastCols([]);
    setParticles([]);
    setToast(null);
    setChainToast(null);
    setGameOver(false);
    setWon(false);
    setGameStarted(false);
    audioManager.stopBackgroundMusic();
    heatRef.current = 0;
    setHeat(0);
    setHintVisible(false);
    setHintCells([]);
    setHintSwap([]);
    setShowCountdown(false);
    setHintCountdown(5);
    setMoveCycle(1);
    setShowCycleWarning(false);
    timer(() => resetHintTimer(nb), 400);
  };

  const isLit = (r: number, c: number) => litCells.some(([lr, lc]) => lr === r && lc === c);
  const isSel = (r: number, c: number) => sel && sel[0] === r && sel[1] === c;
  const isHint = (r: number, c: number) => hintCells.includes(`${r},${c}`);
  const isSwap = (r: number, c: number) => hintSwap.includes(`${r},${c}`);

  const rank = getRankLabel(score);
  const prog = Math.min((score / 1000) * 100, 100);
  const heatPct = heat;

  const hintColor =
    hintType === "special_blast"
      ? "#FF4757"
      : hintType === "match5"
      ? "#FFD93D"
      : hintType === "match4"
      ? "#4ECDC4"
      : "#FF9F43";

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.container}>
      {/* ── TOP HUD ── */}
      <div className={styles.topHud}>
        {/* LEFT: Level & Moves */}
        <div className={styles.leftStats}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>LEVEL</div>
            <div className={styles.statValue} style={{ color: "#A55EEA" }}>
              {level}
            </div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>MOVES</div>
            <div
              className={styles.statValue}
              style={{
                color: moves <= 5 ? "#FF4757" : moves <= 10 ? "#FF9F43" : "#4ECDC4",
              }}
            >
              {moves}
            </div>
          </div>
        </div>

        {/* CENTER: Score */}
        <div className={styles.centerScore}>
          <div className={styles.scoreLabel}>SCORE</div>
          <div className={styles.scoreValue}>{score}</div>
          <div className={styles.levelProgress}>
            <div className={styles.progressLabel}>Target: {levelTarget}</div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${Math.min(100, (score / levelTarget) * 100)}%` }}
              />
            </div>
          </div>
          <div className={styles.rankBadge} style={{ background: `${rank.color}14`, borderColor: `${rank.color}55` }}>
            <span style={{ color: rank.color }}>
              {rank.emoji} {rank.label}
            </span>
          </div>
        </div>

        {/* RIGHT: Timer */}
        <div className={styles.rightStats}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>TIME</div>
            <div
              className={styles.statValue}
              style={{
                color: timeLeft <= 30 ? "#FF4757" : timeLeft <= 60 ? "#FF9F43" : "#4ECDC4",
              }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* ── COMBO HEAT BAR ── */}
      <div className={styles.heatBarContainer}>
        <div className={styles.heatBarLabel}>
          <span>COMBO METER</span>
          <span className={styles.heatStatus} style={{ color: heatPct >= 80 ? "#FFD93D" : heatPct >= 50 ? "#FF9F43" : "rgba(255,255,255,.3)" }}>
            {heatPct >= 100 ? "🌈 READY!" : heatPct >= 80 ? "⚡ ALMOST!" : heatPct >= 50 ? "🔥 HEATING UP!" : ""}
          </span>
        </div>
        <div className={styles.heatBar}>
          <div
            className={styles.heatFill}
            style={{
              width: `${heatPct}%`,
              background:
                heatPct >= 80
                  ? "linear-gradient(90deg,#FFD93D,#FF6B9D,#A55EEA)"
                  : heatPct >= 50
                  ? "linear-gradient(90deg,#FF9F43,#FF6B9D)"
                  : "linear-gradient(90deg,#4ECDC4,#FF9F43)",
            }}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${prog}%` }} />
      </div>

      {/* Move Cycle Warning */}
      {showCycleWarning && (
        <motion.div
          className={styles.cycleWarning}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <div className={styles.warningText}>⚡ NEXT MOVE = LINE BLAST! ⚡</div>
        </motion.div>
      )}

      {/* Hint countdown */}
      {showCountdown && !busy && (
        <div className={styles.hintCountdown}>
          <div className={styles.countdownLabel}>HINT IN</div>
          <div className={styles.countdownValue}>{hintCountdown}s</div>
        </div>
      )}

      {/* ── GAME BOARD ── */}
      <div className={styles.boardContainer}>
        {board.map((row, r) => (
          <div key={r} className={styles.boardRow}>
            {row.map((cell, c) => {
              const candy = cell?.type;
              const special = cell?.special;
              const selected = isSel(r, c);
              const lit = isLit(r, c);
              const hint = isHint(r, c);
              const swap2 = isSwap(r, c);
              const col = COLORS[candy as keyof typeof COLORS] || { bg: "#888", sh: "#444", glow: "rgba(136,136,136,.5)" };
              const isLineBomb = special === SP_LINE;

              // const hintBorderColor = swap2 ? hintColor : `${hintColor}88`;
              const hintAnim = swap2
                ? "hintBounce .7s ease-in-out infinite, hintRing 1s ease-out infinite"
                : hint
                ? "hintBounce 1s ease-in-out infinite"
                : "none";

              return (
                <div
                  key={c}
                  className={`${styles.cell} ${busy ? styles.busy : ""}`}
                  onClick={() => handleClick(r, c)}
                  style={{
                    transform: selected ? "scale(1.16)" : swap2 && hintVisible ? "scale(1.12)" : hint && hintVisible ? "scale(1.06)" : "scale(1)",
                    background: selected
                      ? `radial-gradient(circle,white 0%,${col.bg} 60%)`
                      : isLineBomb
                      ? `radial-gradient(circle at 30% 25%,#fff 0%,${col.bg} 38%,${col.sh} 100%)`
                      : special
                      ? `radial-gradient(circle at 30% 25%,${col.bg}ff 0%,${col.sh} 100%)`
                      : `radial-gradient(circle at 30% 25%,${col.bg}ee 0%,${col.sh} 100%)`,
                    boxShadow: lit
                      ? `0 0 22px ${col.glow},0 0 44px ${col.glow}`
                      : selected
                      ? `0 0 0 3px white,0 0 18px ${col.glow},0 4px 12px rgba(0,0,0,.5)`
                      : swap2 && hintVisible
                      ? `0 0 0 3px ${hintColor},0 0 20px ${hintColor}88,0 4px 0 ${col.sh}`
                      : hint && hintVisible
                      ? `0 0 0 2px ${hintColor}88,0 0 12px ${hintColor}55,0 4px 0 ${col.sh}`
                      : isLineBomb
                      ? `0 0 18px #FFD93D,0 0 35px rgba(255,217,61,.5),0 4px 0 ${col.sh}`
                      : special
                      ? `0 0 12px ${col.glow},0 4px 0 ${col.sh},0 5px 12px rgba(0,0,0,.35)`
                      : `0 4px 0 ${col.sh},0 5px 11px rgba(0,0,0,.35)`,
                    animation: lit
                      ? "litPulse .35s ease infinite"
                      : selected
                      ? "glowPulse .9s infinite"
                      : (hint || swap2) && hintVisible
                      ? hintAnim
                      : isLineBomb
                      ? "rainbow 1.5s linear infinite,glowPulse .8s infinite"
                      : "none",
                  }}
                >
                  <div className={styles.cellShine} />
                  <img src={`/images1/${candy}.png`} alt="" className={styles.tileImage} />
                  {special && <div className={styles.specialIcon}>{spIcon(special)}</div>}
                  {swap2 && hintVisible && (
                    <div className={styles.hintPopup}>
                      <div className={styles.hintBubble}>{hintLabel}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* LINE BLAST overlays */}
        {blastRows.map((r) => (
          <div key={`hr${r}`} className={styles.blastRowOverlay} style={{ top: `${r * (CELL + 6) + 3}px` }} />
        ))}
        {blastCols.map((c) => (
          <div key={`vc${c}`} className={styles.blastColOverlay} style={{ left: `${c * (CELL + 6) + 3}px` }} />
        ))}

        {/* Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              background: p.color,
              top: `${p.r * (CELL + 6) + CELL / 2}px`,
              left: `${p.c * (CELL + 6) + CELL / 2}px`,
              // @ts-ignore
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
            }}
          />
        ))}

        {/* Hint label */}
        {hintVisible && hintLabel && (() => {
          const swapKey = hintSwap[0];
          if (!swapKey) return null;
          const [sr, sc] = swapKey.split(",").map(Number);
          const bx = sc * (CELL + 6) + CELL / 2;
          const by = sr * (CELL + 6);
          return (
            <div className={styles.hintLabel} style={{ left: `${bx}px`, top: `${by - 38}px`, background: `linear-gradient(135deg,${hintColor}ee,${hintColor}99)`, borderColor: hintColor }}>
              {hintLabel}
              <div className={styles.hintArrowDown} style={{ borderTopColor: hintColor }} />
            </div>
          );
        })()}
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          key={toast.key}
          className={styles.toast}
          initial={{ y: 10, opacity: 0, scale: 0.7 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -55, opacity: 0 }}
        >
          <span className={styles.toastEmoji}>{toast.emoji}</span>
          <span className={styles.toastText} style={{ color: toast.color }}>
            {toast.text}
          </span>
        </motion.div>
      )}

      {/* Chain popup */}
      {chainToast && (
        <motion.div
          key={chainToast.key}
          className={styles.chainPopup}
          initial={{ scale: 0, rotate: -8, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <div className={styles.chainWord}>{chainToast.word}</div>
          <div className={styles.chainSubtext}>x{chainToast.n} CHAIN! 🔥</div>
        </motion.div>
      )}

      {/* Start Game Overlay */}
      {!gameStarted && !gameOver && !won && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.startGameBox}
            initial={{ scale: 0, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
          >
            <div className={styles.startGameEmoji}>🍬</div>
            <h2 className={styles.startGameTitle}>MATCH-3 GAME</h2>
            <div className={styles.startGameInfo}>
              <p>🎯 Match 3+ tiles to score</p>
              <p>⏱️ 2 minutes timer</p>
              <p>🎵 Background music included</p>
              <p>🎮 Level up as you score!</p>
            </div>
            <button onClick={startGame} className={styles.startGameBtn}>
              START GAME 🚀
            </button>
          </motion.div>
        </div>
      )}

      {/* Game Over / Win */}
      {(gameOver || won) && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.gameOverBox}
            initial={{ scale: 0, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
          >
            <div className={styles.gameOverEmoji}>{won ? "🏆" : "💔"}</div>
            <h2 className={styles.gameOverTitle} style={{ background: won ? "linear-gradient(180deg,#FFD93D,#FF6B9D)" : "linear-gradient(180deg,#FF4757,#FF6B9D)" }}>
              {won ? "YOU WIN! 🎉" : "GAME OVER"}
            </h2>
            <div className={styles.finalRank} style={{ background: `${rank.color}22`, borderColor: `${rank.color}66` }}>
              <span style={{ color: rank.color }}>
                {rank.emoji} {rank.label}
              </span>
            </div>
            <p className={styles.finalScore}>
              Final Score: <span>{score}</span>
            </p>
            <button onClick={reset} className={styles.playAgainBtn}>
              PLAY AGAIN 🍭
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
