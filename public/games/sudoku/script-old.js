(function () {
  const boardEl = document.getElementById("board");
  const timerEl = document.getElementById("timer");
  const movesEl = document.getElementById("moves");
  const newGameBtn = document.getElementById("newGameBtn");
  const checkBtn = document.getElementById("checkBtn");
  const solveBtn = document.getElementById("solveBtn");
  const difficultyEl = document.getElementById("difficulty");
  const keypad = document.querySelector(".keypad");

  const SIZE = 9;

  let puzzle = createEmptyBoard();
  let solution = createEmptyBoard();
  let given = createEmptyBoardBoolean();
  let selectedCell = null;
  let timerInterval = null;
  let startTime = null;
  let moves = 0;
  let gameStarted = false;

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
    // row
    for (let c = 0; c < SIZE; c++) if (board[row][c] === num) return false;
    // col
    for (let r = 0; r < SIZE; r++) if (board[r][col] === num) return false;
    // box
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

    // Prefill diagonal 3x3 boxes to speed up generation
    for (let k = 0; k < SIZE; k += 3) {
      const nums = shuffle([1,2,3,4,5,6,7,8,9]);
      let idx = 0;
      for (let r = k; r < k + 3; r++) {
        for (let c = k; c < k + 3; c++) {
          b[r][c] = nums[idx++];
        }
      }
    }
    // Solve the rest
    solveBoard(b);
    return b;
  }

  function countSolutions(board, limit = 2) {
    // Backtracking counting solutions up to limit
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
    // Difficulty settings: target clues
    const targetClues = {
      easy: 40,
      medium: 32,
      hard: 26
    }[difficulty] || 32;

    const toRemove = Math.max(0, 81 - targetClues);
    let removed = 0;

    for (const [r, c] of shuffle(positions)) {
      if (removed >= toRemove) break;
      const backup = board[r][c];
      board[r][c] = 0;

      // Ensure uniqueness
      const temp = cloneBoard(board);
      const solutions = countSolutions(temp, 2);
      if (solutions !== 1) {
        board[r][c] = backup; // revert
      } else {
        removed++;
      }
    }
    return board;
  }

  function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function startTimer() {
    stopTimer();
    startTime = Date.now();
    timerInterval = setInterval(() => {
      timerEl.textContent = formatTime(Date.now() - startTime);
    }, 200);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
  }

  function resetStats() {
    moves = 0;
    movesEl.textContent = String(moves);
    timerEl.textContent = "00:00";
  }

  function buildBoardUI() {
    boardEl.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("tabindex", "0");
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);

        // Thick borders for Sudoku boxes and edges
        if (c === 0) cell.classList.add("edge-left");
        if (r === 0) cell.classList.add("edge-top");
        if (c === 8) cell.classList.add("edge-right");
        if (r === 8) cell.classList.add("edge-bottom");
        if (c === 2 || c === 5) cell.classList.add("thick-right");
        if (r === 2 || r === 5) cell.classList.add("thick-bottom");

        if (puzzle[r][c] !== 0) {
          cell.textContent = String(puzzle[r][c]);
          cell.classList.add("readonly");
        } else {
          cell.textContent = "";
        }

        cell.addEventListener("click", () => selectCell(cell));
        cell.addEventListener("keydown", onCellKeyDown);

        frag.appendChild(cell);
      }
    }

    boardEl.appendChild(frag);
  }

  function selectCell(cell) {
    if (!gameStarted) return;
    if (selectedCell === cell) return;
    clearSelection();
    selectedCell = cell;
    selectedCell.classList.add("selected");
    highlightPeers(selectedCell);
  }

  function clearSelection() {
    if (!selectedCell) return;
    selectedCell.classList.remove("selected");
    clearHighlights();
    selectedCell = null;
  }

  function highlightPeers(cell) {
    clearHighlights();
    const r = parseInt(cell.dataset.row, 10);
    const c = parseInt(cell.dataset.col, 10);

    Array.from(boardEl.children).forEach(el => {
      const rr = parseInt(el.dataset.row, 10);
      const cc = parseInt(el.dataset.col, 10);
      if (rr === r || cc === c || (Math.floor(rr / 3) === Math.floor(r / 3) && Math.floor(cc / 3) === Math.floor(c / 3))) {
        if (el !== cell) el.classList.add("highlight");
      }
    });
  }

  function clearHighlights() {
    Array.from(boardEl.children).forEach(el => el.classList.remove("highlight", "conflict"));
  }

  function setValueAtSelected(value) {
    if (!gameStarted) return;
    if (!selectedCell) return;
    const r = parseInt(selectedCell.dataset.row, 10);
    const c = parseInt(selectedCell.dataset.col, 10);
    if (given[r][c]) return; // can't change pre-filled

    const prev = puzzle[r][c];
    if (value === 0) {
      puzzle[r][c] = 0;
      selectedCell.textContent = "";
      moves++;
      movesEl.textContent = String(moves);
      validateConflicts();
      return;
    }

    if (value < 1 || value > 9) return;

    puzzle[r][c] = value;
    selectedCell.textContent = String(value);
    moves++;
    movesEl.textContent = String(moves);

    validateConflicts();
  }

  function onCellKeyDown(e) {
    if (!gameStarted) return;
    // Allow arrow navigation and number inputs
    const r = parseInt(this.dataset.row, 10);
    const c = parseInt(this.dataset.col, 10);

    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        focusCell(Math.max(0, r - 1), c);
        return;
      case "ArrowDown":
        e.preventDefault();
        focusCell(Math.min(8, r + 1), c);
        return;
      case "ArrowLeft":
        e.preventDefault();
        focusCell(r, Math.max(0, c - 1));
        return;
      case "ArrowRight":
        e.preventDefault();
        focusCell(r, Math.min(8, c + 1));
        return;
      case "Backspace":
      case "Delete":
      case "0":
        e.preventDefault();
        setValueAtSelected(0);
        return;
      default:
        break;
    }

    if (/^[1-9]$/.test(e.key)) {
      e.preventDefault();
      setValueAtSelected(parseInt(e.key, 10));
    }
  }

  function focusCell(r, c) {
    const idx = r * 9 + c;
    const el = boardEl.children[idx];
    if (el) {
      el.focus();
      selectCell(el);
    }
  }

  function validateConflicts() {
    // Clear all conflicts
    Array.from(boardEl.children).forEach(el => el.classList.remove("conflict", "error"));

    // For each filled cell, check conflicts on row, col, box
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const val = puzzle[r][c];
        if (!val) continue;
        const peers = getPeers(r, c);
        let hasConflict = false;
        for (const [rr, cc] of peers) {
          if (puzzle[rr][cc] === val) {
            hasConflict = true;
            markConflict(r, c);
            markConflict(rr, cc);
          }
        }
        if (hasConflict) {
          const el = getCellEl(r, c);
          el.classList.add("error");
        }
      }
    }
  }

  function getPeers(r, c) {
    const peers = [];
    for (let i = 0; i < SIZE; i++) {
      if (i !== c) peers.push([r, i]);
      if (i !== r) peers.push([i, c]);
    }
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let rr = br; rr < br + 3; rr++) {
      for (let cc = bc; cc < bc + 3; cc++) {
        if (rr !== r || cc !== c) peers.push([rr, cc]);
      }
    }
    // Remove duplicates
    const seen = new Set();
    const uniq = [];
    for (const [rr, cc] of peers) {
      const k = rr * 9 + cc;
      if (!seen.has(k)) {
        uniq.push([rr, cc]);
        seen.add(k);
      }
    }
    return uniq;
  }

  function markConflict(r, c) {
    const el = getCellEl(r, c);
    if (el) el.classList.add("conflict");
  }

  function getCellEl(r, c) {
    return boardEl.children[r * 9 + c] || null;
  }

  function renderGivenMask() {
    given = createEmptyBoardBoolean();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        given[r][c] = puzzle[r][c] !== 0;
      }
    }
  }

  function newGame() {
    gameStarted = true;
    clearSelection();
    resetStats();

    const diff = difficultyEl.value;
    const full = generateCompleteBoard();
    solution = cloneBoard(full);
    puzzle = makePuzzleFromComplete(full, diff);
    renderGivenMask();
    buildBoardUI();
    validateConflicts();
    startTimer();

    // Enable action buttons
    checkBtn.disabled = false;
    solveBtn.disabled = false;
  }

  function checkSolution() {
    if (!gameStarted) return;

    let allFilled = true;
    let allCorrect = true;

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const val = puzzle[r][c];
        const el = getCellEl(r, c);
        if (!val) {
          allFilled = false;
          el.classList.add("conflict");
          continue;
        }
        if (val !== solution[r][c]) {
          allCorrect = false;
          el.classList.add("conflict");
          el.classList.add("error");
        }
      }
    }

    if (allFilled && allCorrect) {
      stopTimer();
      alert(`Great job! Solved in ${timerEl.textContent} with ${moves} moves.`);
    } else if (!allFilled) {
      alert("Some cells are empty or conflicting. Keep going!");
    } else {
      alert("There are mistakes highlighted in red.");
    }
  }

  function solvePuzzle() {
    if (!gameStarted) return;
    puzzle = cloneBoard(solution);
    buildBoardUI();
    validateConflicts();
    stopTimer();
  }

  keypad.addEventListener("click", (e) => {
    const btn = e.target.closest(".key");
    if (!btn) return;
    const key = btn.dataset.key;
    if (key === "erase") {
      setValueAtSelected(0);
    } else {
      setValueAtSelected(parseInt(key, 10));
    }
  });

  newGameBtn.addEventListener("click", newGame);
  checkBtn.addEventListener("click", checkSolution);
  solveBtn.addEventListener("click", solvePuzzle);

  // Initial render: empty 9x9 grid to allow selection after starting
  buildBoardUI();
})();