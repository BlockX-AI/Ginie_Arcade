(function () {
  const boardEl = document.getElementById("board");
  const timerEl = document.getElementById("timer");
  const filledCountEl = document.getElementById("filled-count");
  const levelDisplayEl = document.getElementById("level-display");
  const progressBarEl = document.getElementById("progress-bar");
  const newGameBtn = document.getElementById("newGameBtn");
  const checkBtn = document.getElementById("checkBtn");
  const hintBtn = document.getElementById("hintBtn");
  const eraseBtn = document.getElementById("eraseBtn");
  const undoBtn = document.getElementById("undoBtn");
  const notesToggle = document.getElementById("notes-toggle");
  const notesStatus = document.getElementById("notes-status");
  const hintCountEl = document.getElementById("hint-count");
  const numpad = document.getElementById("numpad");
  const checkLabelEl = document.getElementById("checkLabel");

  const SIZE = 9;
  const REMOVE_COUNT = { easy: 35, medium: 45, hard: 52 };

  let puzzle = createEmptyBoard();
  let solution = createEmptyBoard();
  let given = createEmptyBoardBoolean();
  let selectedCell = null;
  let timerInterval = null;
  let seconds = 0;
  let gameStarted = false;
  let currentDifficulty = 'easy';
  let mistakes = 0;
  let hintsLeft = 3;
  let hintsUsed = 0;
  let notesMode = false;
  let notes = Array.from({length: 9}, () => Array.from({length: 9}, () => new Set()));
  let undoStack = [];

  let checkFeedbackTimer = null;
  let checkLoadingTimer = null;
  let isChecking = false;

  function createEmptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function createEmptyBoardBoolean() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  }

  function cloneBoard(b) {
    return b.map(row => row.slice());
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function isSafe(board, row, col, num) {
    for (let c = 0; c < SIZE; c++) if (board[row][c] === num) return false;
    for (let r = 0; r < SIZE; r++) if (board[r][col] === num) return false;
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        if (board[r][c] === num) return false;
      }
    }
    return true;
  }

  function findEmpty(board) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) return [r, c];
      }
    }
    return null;
  }

  function solveBoard(board) {
    const pos = findEmpty(board);
    if (!pos) return true;
    const [row, col] = pos;
    for (const num of shuffle([1,2,3,4,5,6,7,8,9])) {
      if (isSafe(board, row, col, num)) {
        board[row][col] = num;
        if (solveBoard(board)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  }

  function generateCompleteBoard() {
    const b = createEmptyBoard();
    for (let k = 0; k < SIZE; k += 3) {
      const nums = shuffle([1,2,3,4,5,6,7,8,9]);
      let idx = 0;
      for (let r = k; r < k + 3; r++) {
        for (let c = k; c < k + 3; c++) {
          b[r][c] = nums[idx++];
        }
      }
    }
    solveBoard(b);
    return b;
  }

  function countSolutions(board, limit = 2) {
    const pos = findEmpty(board);
    if (!pos) return 1;
    const [row, col] = pos;
    let count = 0;
    for (let num = 1; num <= 9; num++) {
      if (isSafe(board, row, col, num)) {
        board[row][col] = num;
        count += countSolutions(board, limit);
        if (count >= limit) {
          board[row][col] = 0;
          return count;
        }
        board[row][col] = 0;
      }
    }
    return count;
  }

  function makePuzzleFromComplete(full, difficulty) {
    const board = cloneBoard(full);
    const positions = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) positions.push([r, c]);
    }
    const toRemove = REMOVE_COUNT[difficulty] || 35;
    let removed = 0;

    for (const [r, c] of shuffle(positions)) {
      if (removed >= toRemove) break;
      const backup = board[r][c];
      board[r][c] = 0;
      const temp = cloneBoard(board);
      const solutions = countSolutions(temp, 2);
      if (solutions !== 1) {
        board[r][c] = backup;
      } else {
        removed++;
      }
    }
    return board;
  }

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      seconds++;
      timerEl.textContent = formatTime(seconds);
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function updateStats() {
    let count = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== 0) count++;
      }
    }
    filledCountEl.textContent = `${count}/81`;

    const prefilledCount = given.flat().filter(Boolean).length;
    const userFilled = count - prefilledCount;
    const toFill = 81 - prefilledCount;
    const pct = Math.round((userFilled / toFill) * 100);
    progressBarEl.style.width = Math.min(pct, 100) + '%';
  }

  function updateMistakeDots() {
    for (let i = 0; i < 3; i++) {
      const dot = document.getElementById(`dot-${i}`);
      if (dot) dot.classList.toggle('active', i < mistakes);
    }
  }

  function updateHintCount() {
    hintCountEl.textContent = `×${hintsLeft}`;
  }

  function updateNumpadExhausted() {
    const numBtns = numpad.querySelectorAll('.num-btn');
    numBtns.forEach((btn, idx) => {
      const num = idx + 1;
      let count = 0;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (puzzle[r][c] === num) count++;
        }
      }
      btn.classList.toggle('exhausted', count >= 9);
    });
  }

  function buildBoardUI() {
    boardEl.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);

        if (puzzle[r][c] !== 0) {
          cell.textContent = String(puzzle[r][c]);
          if (given[r][c]) {
            cell.classList.add("readonly");
          } else {
            cell.classList.add("filled");
          }
        } else if (notes[r][c].size > 0) {
          renderNotes(cell, r, c);
        }

        cell.addEventListener("click", () => selectCell(r, c));
        frag.appendChild(cell);
      }
    }

    boardEl.appendChild(frag);
    updateHighlights();
    updateNumpadExhausted();
  }

  function renderNotes(cell, r, c) {
    const grid = document.createElement('div');
    grid.className = 'notes-grid';
    for (let n = 1; n <= 9; n++) {
      const span = document.createElement('span');
      span.className = 'note-num' + (notes[r][c].has(n) ? '' : ' empty');
      span.textContent = notes[r][c].has(n) ? n : '';
      grid.appendChild(span);
    }
    cell.innerHTML = '';
    cell.appendChild(grid);
  }

  function selectCell(r, c) {
    if (!gameStarted) return;
    selectedCell = { r, c };
    updateHighlights();
  }

  function getCell(r, c) {
    return boardEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  }

  function updateHighlights() {
    document.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('selected', 'highlight', 'same-value');
    });

    if (!selectedCell) return;
    const { r, c } = selectedCell;
    const val = puzzle[r][c];

    document.querySelectorAll('.cell').forEach(cell => {
      const cr = +cell.dataset.row;
      const cc = +cell.dataset.col;
      
      if (cr === r && cc === c) {
        cell.classList.add('selected');
      } else if (cr === r || cc === c || (Math.floor(cr/3) === Math.floor(r/3) && Math.floor(cc/3) === Math.floor(c/3))) {
        cell.classList.add('highlight');
      }
      
      if (val && val === puzzle[cr][cc] && !(cr === r && cc === c)) {
        cell.classList.add('same-value');
      }
    });
  }

  function inputNumber(num) {
    if (!selectedCell || !gameStarted) return;
    const { r, c } = selectedCell;
    if (given[r][c]) return;

    if (notesMode) {
      if (puzzle[r][c] !== 0) return;
      if (notes[r][c].has(num)) {
        notes[r][c].delete(num);
      } else {
        notes[r][c].add(num);
      }
      const cell = getCell(r, c);
      renderNotes(cell, r, c);
      return;
    }

    undoStack.push({ r, c, val: puzzle[r][c], notes: new Set(notes[r][c]) });
    puzzle[r][c] = num;
    notes[r][c].clear();

    const cell = getCell(r, c);
    cell.innerHTML = '';
    cell.textContent = num;
    cell.classList.remove('readonly', 'filled', 'conflict');

    if (num !== solution[r][c]) {
      mistakes++;
      cell.classList.add('conflict', 'filled');
      updateMistakeDots();
      
      setTimeout(() => {
        cell.classList.remove('conflict');
      }, 500);

      if (mistakes >= 3) {
        setTimeout(gameOver, 600);
      }
    } else {
      cell.classList.add('filled');
      updateStats();
      updateHighlights();
      updateNumpadExhausted();
      checkWin();
    }
  }

  function eraseCell() {
    if (!selectedCell || !gameStarted) return;
    const { r, c } = selectedCell;
    if (given[r][c]) return;
    
    undoStack.push({ r, c, val: puzzle[r][c], notes: new Set(notes[r][c]) });
    puzzle[r][c] = 0;
    notes[r][c].clear();
    
    const cell = getCell(r, c);
    cell.textContent = '';
    cell.classList.remove('filled', 'conflict');
    updateHighlights();
    updateStats();
    updateNumpadExhausted();
  }

  function undoMove() {
    if (!undoStack.length || !gameStarted) return;
    const { r, c, val, notes: prevNotes } = undoStack.pop();
    puzzle[r][c] = val;
    notes[r][c] = prevNotes;
    
    const cell = getCell(r, c);
    cell.classList.remove('filled', 'conflict');
    
    if (val !== 0) {
      cell.textContent = val;
      cell.classList.add('filled');
    } else if (prevNotes.size > 0) {
      renderNotes(cell, r, c);
    } else {
      cell.textContent = '';
    }
    
    updateHighlights();
    updateStats();
    updateNumpadExhausted();
  }

  function useHint() {
    if (hintsLeft <= 0 || !gameStarted) return;
    
    const empties = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!given[r][c] && puzzle[r][c] !== solution[r][c]) {
          empties.push({ r, c });
        }
      }
    }
    
    if (!empties.length) return;

    let target;
    if (selectedCell && !given[selectedCell.r][selectedCell.c] && puzzle[selectedCell.r][selectedCell.c] !== solution[selectedCell.r][selectedCell.c]) {
      target = selectedCell;
    } else {
      target = empties[Math.floor(Math.random() * empties.length)];
    }

    const { r, c } = target;
    undoStack.push({ r, c, val: puzzle[r][c], notes: new Set(notes[r][c]) });
    puzzle[r][c] = solution[r][c];
    notes[r][c].clear();
    hintsLeft--;
    hintsUsed++;

    const cell = getCell(r, c);
    cell.textContent = solution[r][c];
    cell.className = 'cell readonly hint-cell';
    given[r][c] = true;

    updateHintCount();
    updateStats();
    updateHighlights();
    updateNumpadExhausted();
    checkWin();
  }

  function toggleNotes() {
    notesMode = !notesMode;
    notesToggle.classList.toggle('active', notesMode);
    notesStatus.textContent = notesMode ? 'ON' : 'OFF';
  }

  function clearCheckFeedback() {
    if (checkFeedbackTimer) {
      clearTimeout(checkFeedbackTimer);
      checkFeedbackTimer = null;
    }
    checkBtn.classList.remove('check-success', 'check-warn', 'check-error');
    boardEl.classList.remove('check-success', 'check-warn', 'check-error');
  }

  function setCheckLoading(loading) {
    if (checkLoadingTimer) {
      clearTimeout(checkLoadingTimer);
      checkLoadingTimer = null;
    }

    isChecking = loading;
    checkBtn.classList.toggle('check-loading', loading);
    checkBtn.disabled = loading;
    if (checkLabelEl) checkLabelEl.textContent = loading ? 'Checking…' : 'Check';
  }

  function flashCheckFeedback(type) {
    clearCheckFeedback();

    const cls = type === 'success' ? 'check-success' : type === 'warn' ? 'check-warn' : 'check-error';
    checkBtn.classList.add(cls);
    boardEl.classList.add(cls);

    checkFeedbackTimer = setTimeout(() => {
      checkBtn.classList.remove(cls);
      boardEl.classList.remove(cls);
      checkFeedbackTimer = null;
    }, 900);
  }

  function checkSolution() {
    if (!gameStarted) return;
    if (isChecking) return;

    // Premium micro-interaction: show a short "Checking…" sweep.
    setCheckLoading(true);

    // Keep the loading state visible for a moment even though checking is fast.
    checkLoadingTimer = setTimeout(() => {
      checkLoadingTimer = null;

      let allFilled = true;
      let allCorrect = true;

      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          const val = puzzle[r][c];
          const cell = getCell(r, c);

          if (!val) {
            allFilled = false;
            cell.classList.add('conflict');
            continue;
          }

          if (val !== solution[r][c]) {
            allCorrect = false;
            cell.classList.add('conflict');
          }
        }
      }

      setTimeout(() => {
        document.querySelectorAll('.cell.conflict').forEach(c => c.classList.remove('conflict'));
      }, 2000);

      if (allFilled && allCorrect) {
        flashCheckFeedback('success');
        setCheckLoading(false);
        winGame();
        return;
      }

      if (!allFilled) {
        flashCheckFeedback('warn');
      } else {
        flashCheckFeedback('error');
      }

      // Let the result animation land, then restore button.
      setTimeout(() => setCheckLoading(false), 260);
    }, 320);
  }

  function checkWin() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== solution[r][c]) return;
      }
    }
    setTimeout(winGame, 400);
  }

  function calculateScore() {
    // Base score by difficulty
    const baseScore = { easy: 300, medium: 600, hard: 1000 }[currentDifficulty];
    
    // Time bonus: faster = more points (max 500 bonus)
    const timeBonus = Math.max(0, 500 - Math.floor(seconds / 2));
    
    // Mistake penalty: -100 per mistake
    const mistakePenalty = mistakes * 100;
    
    // Hint penalty: -50 per hint
    const hintPenalty = hintsUsed * 50;
    
    const finalScore = Math.max(0, baseScore + timeBonus - mistakePenalty - hintPenalty);
    return finalScore;
  }

  function winGame() {
    stopTimer();
    gameStarted = false;

    const scanLine = document.createElement('div');
    scanLine.className = 'scan-line';
    boardEl.appendChild(scanLine);
    setTimeout(() => scanLine.remove(), 900);

    document.getElementById('win-time').textContent = formatTime(seconds);
    document.getElementById('win-mistakes').textContent = mistakes;
    document.getElementById('win-hints').textContent = hintsUsed;
    document.getElementById('win-level').textContent = currentDifficulty.toUpperCase();
    document.getElementById('win-overlay').classList.add('show');
    spawnParticles();
    
    // Submit score to blockchain
    const finalScore = calculateScore();
    if (window.GinixBridge) {
      window.GinixBridge.updateScore(finalScore);
      window.GinixBridge.submitXP(finalScore).then(result => {
        console.log('Sudoku score submitted to blockchain:', result);
      }).catch(err => {
        console.error('Failed to submit sudoku score:', err);
      });
    }
  }

  function gameOver() {
    stopTimer();
    gameStarted = false;
    document.getElementById('lose-overlay').classList.add('show');
    
    // Submit final score to blockchain (even on loss)
    const finalScore = calculateScore();
    if (window.GinixBridge) {
      window.GinixBridge.updateScore(finalScore);
      window.GinixBridge.submitXP(finalScore).then(result => {
        console.log('Sudoku score submitted (game over):', result);
      }).catch(err => {
        console.error('Failed to submit sudoku score:', err);
      });
    }
  }

  function closeOverlay() {
    document.getElementById('win-overlay').classList.remove('show');
    document.getElementById('lose-overlay').classList.remove('show');
  }

  function spawnParticles() {
    const colors = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#f472b6'];
    for (let i = 0; i < 60; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 10 + 4;
        p.style.cssText = `
          left: ${Math.random()*100}vw;
          top: -20px;
          width: ${size}px;
          height: ${size * (Math.random() > 0.5 ? 1 : 2.5)}px;
          background: ${colors[Math.floor(Math.random()*colors.length)]};
          animation-duration: ${1.5 + Math.random()*2}s;
          opacity: ${0.6 + Math.random()*0.4};
        `;
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 4000);
      }, i * 40);
    }
  }

  function newGame(difficulty) {
    currentDifficulty = difficulty;
    stopTimer();
    seconds = 0;
    mistakes = 0;
    hintsLeft = 3;
    hintsUsed = 0;
    notesMode = false;
    undoStack = [];
    notes = Array.from({length: 9}, () => Array.from({length: 9}, () => new Set()));
    selectedCell = null;
    gameStarted = true;

    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.level-btn.${difficulty}`).classList.add('active');

    solution = generateCompleteBoard();
    puzzle = makePuzzleFromComplete(solution, difficulty);
    given = puzzle.map(r => r.map(v => v !== 0));

    updateMistakeDots();
    updateHintCount();
    notesToggle.classList.remove('active');
    notesStatus.textContent = 'OFF';
    levelDisplayEl.textContent = difficulty.toUpperCase();

    buildBoardUI();
    updateStats();
    startTimer();
    timerEl.textContent = "00:00";
  }

  document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const difficulty = btn.dataset.difficulty;
      newGame(difficulty);
    });
  });

  numpad.addEventListener('click', (e) => {
    const btn = e.target.closest('.num-btn');
    if (!btn) return;
    const num = parseInt(btn.dataset.num, 10);
    inputNumber(num);
  });

  newGameBtn.addEventListener('click', () => newGame(currentDifficulty));
  checkBtn.addEventListener('click', checkSolution);
  hintBtn.addEventListener('click', useHint);
  eraseBtn.addEventListener('click', eraseCell);
  undoBtn.addEventListener('click', undoMove);
  notesToggle.addEventListener('click', toggleNotes);

  document.getElementById('play-again-btn').addEventListener('click', () => {
    closeOverlay();
    newGame(currentDifficulty);
  });

  document.getElementById('try-again-btn').addEventListener('click', () => {
    closeOverlay();
    newGame(currentDifficulty);
  });

  document.addEventListener('keydown', e => {
    if (!selectedCell || !gameStarted) return;
    const { r, c } = selectedCell;

    if (e.key >= '1' && e.key <= '9') {
      inputNumber(parseInt(e.key));
      return;
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      eraseCell();
      return;
    }
    if (e.key === 'n' || e.key === 'N') {
      toggleNotes();
      return;
    }
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      undoMove();
      return;
    }

    let nr = r, nc = c;
    if (e.key === 'ArrowUp') nr = (r - 1 + 9) % 9;
    if (e.key === 'ArrowDown') nr = (r + 1) % 9;
    if (e.key === 'ArrowLeft') nc = (c - 1 + 9) % 9;
    if (e.key === 'ArrowRight') nc = (c + 1) % 9;
    if (nr !== r || nc !== c) {
      selectedCell = { r: nr, c: nc };
      updateHighlights();
    }
  });

  newGame('easy');
})();


