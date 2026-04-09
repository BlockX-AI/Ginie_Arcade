import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import AudioManager from "../../utils/AudioManager";
import { LEVEL_CONFIGS, getLevelConfig, getTotalLevels } from "./LevelConfig";
import styles from "./LevelGame.module.css";

const audioManager = AudioManager.getInstance();

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

const PERF_MESSAGES = [
  { pts: 30, label: "Nice!", color: "#4ECDC4", emoji: "✨" },
  { pts: 50, label: "Good!", color: "#FF9F43", emoji: "🌟" },
  { pts: 80, label: "Great!", color: "#FF6B9D", emoji: "🎯" },
  { pts: 120, label: "Awesome!", color: "#A55EEA", emoji: "🔥" },
  { pts: 160, label: "Amazing!", color: "#FFD93D", emoji: "💫" },
  { pts: 200, label: "Incredible!", color: "#FF6B9D", emoji: "🚀" },
  { pts: 250, label: "LEGENDARY!", color: "#FFD93D", emoji: "👑" },
];

const getPerformanceMessage = (pts: number) => {
  let best = PERF_MESSAGES[0];
  for (const p of PERF_MESSAGES) {
    if (pts >= p.pts) best = p;
  }
  return best;
};

const rc = () => TYPES[Math.floor(Math.random() * TYPES.length)];
const SP_H = "SP_H";
const SP_V = "SP_V";

const spIcon = (s: string | null | undefined) => (s === SP_H ? "↔" : s === SP_V ? "↕" : "");

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

function findMatchGroups(b: any[]) {
  const groups: { cells: [number, number][]; dir: "H" | "V"; type: string }[] = [];

  // horizontal runs
  for (let r = 0; r < G; r++) {
    let c = 0;
    while (c < G) {
      const t = ct(b[r][c]);
      if (!t) {
        c++;
        continue;
      }
      let end = c + 1;
      while (end < G && ct(b[r][end]) === t) end++;
      const len = end - c;
      if (len >= 3) {
        const cells: [number, number][] = [];
        for (let cc = c; cc < end; cc++) cells.push([r, cc]);
        groups.push({ cells, dir: "H", type: t });
      }
      c = end;
    }
  }

  // vertical runs
  for (let c = 0; c < G; c++) {
    let r = 0;
    while (r < G) {
      const t = ct(b[r][c]);
      if (!t) {
        r++;
        continue;
      }
      let end = r + 1;
      while (end < G && ct(b[end][c]) === t) end++;
      const len = end - r;
      if (len >= 3) {
        const cells: [number, number][] = [];
        for (let rr = r; rr < end; rr++) cells.push([rr, c]);
        groups.push({ cells, dir: "V", type: t });
      }
      r = end;
    }
  }

  return groups;
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

function findPossibleMoves(b: any[]) {
  const moves: any[] = [];
  for (let r = 0; r < G; r++) {
    for (let c = 0; c < G; c++) {
      const dirs = [[0, 1], [1, 0]];
      for (const [dr, dc] of dirs) {
        const r2 = r + dr, c2 = c + dc;
        if (r2 >= G || c2 >= G) continue;
        const nb = b.map((row: any[]) => row.map((ce: any) => (ce ? { ...ce } : null)));
        [nb[r][c], nb[r2][c2]] = [nb[r2][c2], nb[r][c]];
        const matches = findMatches(nb);
        if (matches.length > 0) {
          moves.push({ from: [r, c], to: [r2, c2], matches });
        }
      }
    }
  }
  return moves;
}

export default function LevelGame() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [board, setBoard] = useState(initBoard);
  const [sel, setSel] = useState<number[] | null>(null);
  const [score, setScore] = useState(0);
  const [levelEndScore, setLevelEndScore] = useState<number | null>(null);
  const [moves, setMoves] = useState(30);
  const [timeLeft, setTimeLeft] = useState(120);
  const [busy, setBusy] = useState(false);
  const [litCells, setLitCells] = useState<any[]>([]);
  const [particles, setParticles] = useState<any[]>([]);
  const [toast, setToast] = useState<any>(null);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [allLevelsComplete, setAllLevelsComplete] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [, setConsecutiveMoves] = useState(0);
  const [showComboBlast, setShowComboBlast] = useState(false);
  const [hintCells, setHintCells] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState(Date.now());

  const T = useRef<any[]>([]);
  const boardRef = useRef(board);
  boardRef.current = board;
  const hintTimerRef = useRef<any>(null);
  const lastSwapRef = useRef<{ r1: number; c1: number; r2: number; c2: number } | null>(null);

  const timer = (fn: () => void, d: number) => {
    const t = setTimeout(fn, d);
    T.current.push(t);
    return t;
  };

  useEffect(() => {
    const timers = T.current;
    return () => {
      timers.forEach(clearTimeout);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!gameStarted || busy || gameOver || levelComplete) return;
    
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setShowHint(false);
    setHintCells([]);
    
    hintTimerRef.current = setTimeout(() => {
      const possibleMoves = findPossibleMoves(board);
      if (possibleMoves.length > 0) {
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        const hintPositions = [
          `${randomMove.from[0]},${randomMove.from[1]}`,
          `${randomMove.to[0]},${randomMove.to[1]}`
        ];
        setHintCells(hintPositions);
        setShowHint(true);
        
        setTimeout(() => {
          setShowHint(false);
          setHintCells([]);
        }, 3000);
      }
    }, 5000);
    
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [board, gameStarted, busy, gameOver, levelComplete, lastMoveTime]);

  useEffect(() => {
    if (!gameStarted || gameOver || levelComplete || busy) return;
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
  }, [gameStarted, gameOver, levelComplete, busy]);

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

  const showToast = useCallback((text: string, color: string, emoji: string, dur = 1300) => {
    const key = Math.random();
    setToast({ text, color, emoji, key });
    timer(() => setToast(null), dur);
  }, []);

  const cascade = useCallback(
    (b: any[], chain = 0) => {
      const groups = findMatchGroups(b);
      if (groups.length === 0) {
        setBusy(false);
        return;
      }

      const matchedSet = new Set<string>();
      groups.forEach((g) => g.cells.forEach(([r, c]) => matchedSet.add(`${r},${c}`)));

      // Spawn a striped tile for any 4-in-a-row/col.
      // We keep the special tile on the board and remove the rest.
      const spawns: { r: number; c: number; special: string; type: string }[] = [];
      groups.forEach((g) => {
        if (g.cells.length >= 4) {
          const swap = lastSwapRef.current;
          let spawnCell: [number, number] | null = null;

          if (swap) {
            const k1 = `${swap.r1},${swap.c1}`;
            const k2 = `${swap.r2},${swap.c2}`;
            for (const [rr, cc] of g.cells) {
              const k = `${rr},${cc}`;
              if (k === k1 || k === k2) {
                spawnCell = [rr, cc];
                break;
              }
            }
          }

          if (!spawnCell) {
            const midIdx = Math.floor(g.cells.length / 2);
            spawnCell = g.cells[midIdx];
          }

          spawns.push({ r: spawnCell[0], c: spawnCell[1], special: g.dir === "H" ? SP_H : SP_V, type: g.type });
        }
      });

      const spawnKeep = new Set<string>();
      spawns.forEach((s) => spawnKeep.add(`${s.r},${s.c}`));

      // Activate specials that are part of the matched cells.
      const blastSet = new Set<string>();
      matchedSet.forEach((key) => {
        const [r, c] = key.split(",").map(Number);
        const sp = b[r]?.[c]?.special;
        if (sp === SP_H) {
          for (let cc = 0; cc < G; cc++) blastSet.add(`${r},${cc}`);
        }
        if (sp === SP_V) {
          for (let rr = 0; rr < G; rr++) blastSet.add(`${rr},${c}`);
        }
      });

      const affectedSet = new Set<string>();
      matchedSet.forEach((k) => affectedSet.add(k));
      blastSet.forEach((k) => affectedSet.add(k));
      // Ensure the newly spawned special tile remains.
      spawnKeep.forEach((k) => affectedSet.delete(k));
      const affected: [number, number][] = Array.from(affectedSet).map((s) => s.split(",").map(Number) as [number, number]);

      setLitCells(affected);
      const pts = affected.length * 10 * (chain + 1);
      
      setScore((s) => {
        const ns = s + pts;
        const levelConfig = getLevelConfig(currentLevel);
        
        if (ns >= levelConfig.targetScore && !levelComplete) {
          setLevelEndScore(ns);
          timer(() => {
            if (currentLevel >= getTotalLevels()) {
              setAllLevelsComplete(true);
              audioManager.stopBackgroundMusic();
            } else {
              setLevelComplete(true);
              audioManager.stopBackgroundMusic();
            }
          }, 800);
        }
        return ns;
      });

      const perfMsg = getPerformanceMessage(pts);
      showToast(`+${pts} ${perfMsg.label}`, perfMsg.color, perfMsg.emoji, 1200);
      burst(affected, b);
      audioManager.playMatchSound();

      if (spawns.length > 0) {
        timer(() => showToast("Striped created!", "#FFD93D", "⚡", 900), 180);
      }
      
      if (chain >= 1) {
        const comboMsg = chain === 1 ? "COMBO x2!" : chain === 2 ? "COMBO x3!" : `COMBO x${chain + 1}!`;
        timer(() => showToast(comboMsg, "#FFD93D", "🔥", 1000), 300);
      }

      timer(() => {
        const nb = b.map((row) => row.map((c: any) => (c ? { ...c } : null)));

        affected.forEach(([r, c]) => {
          nb[r][c] = null;
        });

        spawns.forEach((s) => {
          if (!nb[s.r] || !nb[s.r][s.c]) {
            nb[s.r][s.c] = mk(s.type, s.special);
          } else {
            nb[s.r][s.c] = { ...nb[s.r][s.c], type: s.type, special: s.special };
          }
        });

        const col = collapse(nb);
        setBoard(col);
        setLitCells([]);
        cascade(col, chain + 1);
      }, 420);
    },
    [burst, showToast, currentLevel, levelComplete]
  );

  const swap = useCallback(
    (r1: number, c1: number, r2: number, c2: number) => {
      if (busy || gameOver || levelComplete) return;
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;

      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      setShowHint(false);
      setHintCells([]);
      
      const nb = board.map((row) => row.map((c: any) => (c ? { ...c } : null)));
      [nb[r1][c1], nb[r2][c2]] = [nb[r2][c2], nb[r1][c1]];
      const matches = findMatches(nb);
      
      if (matches.length === 0) {
        setLitCells([
          [r1, c1],
          [r2, c2],
        ]);
        timer(() => setLitCells([]), 320);
        setConsecutiveMoves(0);
        return;
      }

      setBusy(true);
      setBoard(nb);
      lastSwapRef.current = { r1, c1, r2, c2 };
      audioManager.playSwapSound();
      setLastMoveTime(Date.now());

      setConsecutiveMoves((prev) => {
        const newCount = prev + 1;
        if (newCount === 3) {
          setShowComboBlast(true);
          timer(() => {
            showToast("🎆 COMBO BLAST! 🎆", "#FFD93D", "💥", 1500);
            const extraPoints = 50;
            setScore((s) => s + extraPoints);
          }, 600);
          timer(() => setShowComboBlast(false), 2000);
          return 0;
        }
        return newCount;
      });

      setMoves((m) => {
        const nm = m - 1;
        if (nm <= 0) {
          timer(() => {
            setGameOver(true);
            audioManager.stopBackgroundMusic();
          }, 1200);
        }
        return nm;
      });

      cascade(nb, 0);
    },
    [board, busy, cascade, gameOver, levelComplete]
  );

  const handleClick = (r: number, c: number) => {
    if (busy || gameOver || levelComplete) return;

    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setShowHint(false);
    setHintCells([]);

    if (!sel) {
      setSel([r, c]);
      return;
    }
    const [sr, sc] = sel;
    setSel(null);
    if (sr === r && sc === c) {
      return;
    }
    swap(sr, sc, r, c);
  };

  const startGame = () => {
    setGameStarted(true);
    audioManager.playBackgroundMusic();
  };

  const nextLevel = () => {
    const nextLvl = currentLevel + 1;
    if (nextLvl > getTotalLevels()) {
      setAllLevelsComplete(true);
      return;
    }

    if (nextLvl > unlockedLevels) {
      setUnlockedLevels(nextLvl);
    }

    const levelConfig = getLevelConfig(nextLvl);
    setCurrentLevel(nextLvl);
    setScore(0);
    setLevelEndScore(null);
    setMoves(levelConfig.moves);
    setTimeLeft(levelConfig.timeLimit);
    setLevelComplete(false);
    setGameOver(false);
    setConsecutiveMoves(0);
    setShowComboBlast(false);
    setShowHint(false);
    setHintCells([]);
    setLastMoveTime(Date.now());
    
    const nb = initBoard();
    setBoard(nb);
    setSel(null);
    setBusy(false);
    setLitCells([]);
    setParticles([]);
    setToast(null);
    
    audioManager.playBackgroundMusic();
  };

  const restartLevel = () => {
    const levelConfig = getLevelConfig(currentLevel);
    setMoves(levelConfig.moves);
    setTimeLeft(levelConfig.timeLimit);
    setScore(0);
    setLevelEndScore(null);
    setGameOver(false);
    setLevelComplete(false);
    setConsecutiveMoves(0);
    setShowComboBlast(false);
    setShowHint(false);
    setHintCells([]);
    setLastMoveTime(Date.now());
    
    const nb = initBoard();
    setBoard(nb);
    setSel(null);
    setBusy(false);
    setLitCells([]);
    setParticles([]);
    setToast(null);
    
    audioManager.playBackgroundMusic();
  };

  const backToMenu = () => {
    setShowMenu(true);
    audioManager.stopBackgroundMusic();
  };

  const selectLevel = (level: number) => {
    if (level > unlockedLevels) return;
    
    const levelConfig = getLevelConfig(level);
    setCurrentLevel(level);
    setScore(0);
    setLevelEndScore(null);
    setMoves(levelConfig.moves);
    setTimeLeft(levelConfig.timeLimit);
    setGameOver(false);
    setLevelComplete(false);
    setAllLevelsComplete(false);
    setShowMenu(false);
    setGameStarted(true);
    setConsecutiveMoves(0);
    setShowComboBlast(false);
    setShowHint(false);
    setHintCells([]);
    setLastMoveTime(Date.now());
    
    const nb = initBoard();
    setBoard(nb);
    setSel(null);
    setBusy(false);
    setLitCells([]);
    setParticles([]);
    setToast(null);
    
    audioManager.playBackgroundMusic();
  };

  const resetToStart = () => {
    T.current.forEach(clearTimeout);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    const nb = initBoard();
    setBoard(nb);
    setScore(0);
    setLevelEndScore(null);
    setCurrentLevel(1);
    setMoves(30);
    setTimeLeft(120);
    setSel(null);
    setBusy(false);
    setLitCells([]);
    setParticles([]);
    setToast(null);
    setGameOver(false);
    setLevelComplete(false);
    setAllLevelsComplete(false);
    setGameStarted(false);
    setShowMenu(false);
    setUnlockedLevels(1);
    setConsecutiveMoves(0);
    setShowComboBlast(false);
    setShowHint(false);
    setHintCells([]);
    setLastMoveTime(Date.now());
    audioManager.stopBackgroundMusic();
  };

  const isLit = (r: number, c: number) => litCells.some(([lr, lc]) => lr === r && lc === c);
  const isSel = (r: number, c: number) => sel && sel[0] === r && sel[1] === c;
  const isHint = (r: number, c: number) => showHint && hintCells.includes(`${r},${c}`);

  const levelConfig = getLevelConfig(currentLevel);
  const progress = Math.min((score / levelConfig.targetScore) * 100, 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.topHud}>
        <div className={styles.leftStats}>
          <button onClick={backToMenu} className={styles.backBtn}>
            ← Menu
          </button>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>LEVEL</div>
            <div className={styles.statValue} style={{ color: "#A55EEA" }}>
              {currentLevel}/{getTotalLevels()}
            </div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>MOVES</div>
            <div
              className={styles.statValue}
              style={{
                color: moves <= 3 ? "#FF4757" : moves <= 8 ? "#FF9F43" : "#4ECDC4",
              }}
            >
              {moves}
            </div>
          </div>
        </div>

        <div className={styles.centerScore}>
          <div className={styles.scoreLabel}>SCORE</div>
          <div className={styles.scoreValue}>{score}</div>
          <div className={styles.levelProgress}>
            <div className={styles.progressLabel}>Target: {levelConfig.targetScore}</div>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.rightStats}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>TIME</div>
            <div
              className={styles.statValue}
              style={{
                color: timeLeft <= 20 ? "#FF4757" : timeLeft <= 40 ? "#FF9F43" : "#4ECDC4",
              }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
          <button onClick={restartLevel} className={styles.restartBtn}>
            ↻
          </button>
        </div>
      </div>

      <div className={styles.boardContainer}>
        {board.map((row, r) => (
          <div key={r} className={styles.boardRow}>
            {row.map((cell, c) => {
              const candy = cell?.type;
              const selected = isSel(r, c);
              const lit = isLit(r, c);
              const hint = isHint(r, c);
              const col = COLORS[candy as keyof typeof COLORS] || { bg: "#888", sh: "#444", glow: "rgba(136,136,136,.5)" };

              return (
                <div
                  key={c}
                  className={`${styles.cell} ${busy ? styles.busy : ""} ${hint ? styles.hintCell : ""} ${cell?.special === SP_H ? styles.specialH : ""} ${cell?.special === SP_V ? styles.specialV : ""}`}
                  onClick={() => handleClick(r, c)}
                  style={{
                    transform: selected ? "scale(1.16)" : hint ? "scale(1.1)" : "scale(1)",
                    background: selected
                      ? `radial-gradient(circle,white 0%,${col.bg} 60%)`
                      : `radial-gradient(circle at 30% 25%,${col.bg}ee 0%,${col.sh} 100%)`,
                    boxShadow: lit
                      ? `0 0 22px ${col.glow},0 0 44px ${col.glow}`
                      : selected
                      ? `0 0 0 3px white,0 0 18px ${col.glow},0 4px 12px rgba(0,0,0,.5)`
                      : hint
                      ? `0 0 0 3px #FFD93D,0 0 20px rgba(255,217,61,.8),0 4px 0 ${col.sh}`
                      : `0 4px 0 ${col.sh},0 5px 11px rgba(0,0,0,.35)`,
                    animation: lit ? "litPulse .35s ease infinite" : selected ? "glowPulse .9s infinite" : hint ? "hintPulse 1s ease-in-out infinite" : "none",
                  }}
                >
                  <div className={styles.cellShine} />
                  <img src={`${process.env.PUBLIC_URL}/images1/${candy}.png`} alt="" className={styles.tileImage} />
                  {hint && <div className={styles.hintArrow}>👆</div>}
                  {cell?.special && <div className={styles.specialIcon}>{spIcon(cell.special)}</div>}
                </div>
              );
            })}
          </div>
        ))}

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
      </div>

      {showComboBlast && (
        <motion.div
          className={styles.comboBlastOverlay}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <div className={styles.comboBlastText}>🎆 COMBO BLAST! 🎆</div>
        </motion.div>
      )}

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

      {showHint && (
        <motion.div
          className={styles.hintPopup}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          💡 Try matching these tiles!
        </motion.div>
      )}

      {!gameStarted && !showMenu && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.modalBox}
            initial={{ scale: 0, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
          >
            <div className={styles.modalEmoji}>🍬</div>
            <h2 className={styles.modalTitle}>MATCH-3 LEVELS</h2>
            <div className={styles.modalInfo}>
              <p>🎯 10 Challenging Levels</p>
              <p>⏱️ Beat the timer</p>
              <p>🎮 Moves decrease each level</p>
              <p>🏆 Reach target score to advance</p>
            </div>
            <button onClick={startGame} className={styles.startBtn}>
              START LEVEL 1 🚀
            </button>
          </motion.div>
        </div>
      )}

      {showMenu && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.menuBox}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h2 className={styles.menuTitle}>SELECT LEVEL</h2>
            <div className={styles.levelGrid}>
              {LEVEL_CONFIGS.map((config) => {
                const isLocked = config.level > unlockedLevels;
                return (
                  <button
                    key={config.level}
                    onClick={() => selectLevel(config.level)}
                    className={`${styles.levelBtn} ${isLocked ? styles.lockedLevel : ""}`}
                    disabled={isLocked}
                  >
                    {isLocked ? (
                      <>
                        <div className={styles.lockIcon}>🔒</div>
                        <div className={styles.levelNumber}>{config.level}</div>
                      </>
                    ) : (
                      <>
                        <div className={styles.levelNumber}>{config.level}</div>
                        <div className={styles.levelMoves}>{config.moves} moves</div>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowMenu(false)} className={styles.closeMenuBtn}>
              Back to Game
            </button>
          </motion.div>
        </div>
      )}

      {levelComplete && !allLevelsComplete && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.modalBox}
            initial={{ scale: 0, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
          >
            <div className={styles.modalEmoji}>🎉</div>
            <h2 className={styles.modalTitle} style={{ background: "linear-gradient(180deg,#FFD93D,#FF6B9D)" }}>
              LEVEL {currentLevel} COMPLETE!
            </h2>
            <p className={styles.finalScore}>
              Score: <span>{levelEndScore ?? score}</span>
            </p>
            <p className={styles.levelDescription}>
              {levelConfig.description}
            </p>
            <div className={styles.buttonGroup}>
              <button onClick={nextLevel} className={styles.nextBtn}>
                NEXT LEVEL →
              </button>
              <button onClick={restartLevel} className={styles.retryBtn}>
                Retry Level
              </button>
              <button onClick={backToMenu} className={styles.menuBtnSmall}>
                Level Select
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {allLevelsComplete && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.modalBox}
            initial={{ scale: 0, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
          >
            <div className={styles.modalEmoji}>👑</div>
            <h2 className={styles.modalTitle} style={{ background: "linear-gradient(180deg,#FFD93D,#A55EEA)" }}>
              ALL LEVELS COMPLETE! 🏆
            </h2>
            <p className={styles.finalScore}>
              Final Score: <span>{score}</span>
            </p>
            <p className={styles.congratsText}>
              🎊 Congratulations! You've mastered all 10 levels! 🎊
            </p>
            <div className={styles.buttonGroup}>
              <button onClick={resetToStart} className={styles.playAgainBtn}>
                PLAY AGAIN 🍭
              </button>
              <button onClick={backToMenu} className={styles.menuBtnSmall}>
                Level Select
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {gameOver && (
        <div className={styles.overlay}>
          <motion.div
            className={styles.modalBox}
            initial={{ scale: 0, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
          >
            <div className={styles.modalEmoji}>💔</div>
            <h2 className={styles.modalTitle} style={{ background: "linear-gradient(180deg,#FF4757,#FF6B9D)" }}>
              GAME OVER
            </h2>
            <p className={styles.finalScore}>
              Score: <span>{score}</span>
            </p>
            <p className={styles.gameOverText}>
              {moves <= 0 ? "Out of moves!" : "Time's up!"}
            </p>
            <div className={styles.buttonGroup}>
              <button onClick={restartLevel} className={styles.retryBtn}>
                TRY AGAIN 🔄
              </button>
              <button onClick={backToMenu} className={styles.menuBtnSmall}>
                Level Select
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
