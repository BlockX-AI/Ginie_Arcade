# Sudoku Web Game

A responsive Sudoku game built with vanilla HTML, CSS, and JavaScript. It features random puzzle generation with unique solutions, three difficulty levels, keyboard and on-screen input, highlighting for rows/columns/boxes, conflict detection, a timer, and a moves counter.

Live preview
- https://mrsp1twn6trk.cosine.page

Project structure
- sudoku-web/
  - index.html
  - style.css
  - script.js

Features
- Random Sudoku generator with a guaranteed unique solution
- Difficulty levels: Easy, Medium, Hard
- Play with keyboard (1–9, arrows, Backspace/Delete) or on-screen keypad
- Highlights current row, column, and 3×3 box
- Real-time conflict detection (duplicates highlighted in red)
- Timer and moves counter
- Mobile and desktop friendly

Quick start (local)
1) Download or clone the repository
2) Open sudoku-web/index.html in your browser
   - no build steps and no dependencies required

How to play
- Select a difficulty
- Click “New Game”
- Click/tap a cell and enter a number (1–9) with your keyboard or use the on-screen keypad
- Use Backspace/Delete or the “Erase” keypad button to clear a cell
- “Check Solution” highlights mistakes; “Solve Puzzle” fills the correct solution

Publishing to GitHub Pages
Option A — Keep files inside sudoku-web/ and use Pages “/sudoku-web” subfolder:
1) Create a new GitHub repo and push this folder structure:
   ```
   git init
   git add .
   git commit -m "Add Sudoku web game"
   git branch -M main
   git remote add origin https://github.com/&lt;your-username&gt;/&lt;your-repo&gt;.git
   git push -u origin main
   ```
2) In the GitHub repository:
   - Settings → Pages
   - Build and deployment → Source: Deploy from a branch
   - Branch: main
   - Folder: /root (or /docs if you move files accordingly)
   - Save
3) Navigate to https://&lt;your-username&gt;.github.io/&lt;your-repo&gt;/sudoku-web

Option B — Serve from repository root:
- Move the three files (index.html, style.css, script.js) from sudoku-web/ to repo root and update links if needed (not necessary here).
- Enable GitHub Pages with the “root” folder, then access:
  https://&lt;your-username&gt;.github.io/&lt;your-repo&gt;/

Accessibility
- Keyboard navigation with arrow keys
- ARIA roles for the grid and grid cells
- Visual focus and selection states
- High-contrast block dividers for 3×3 boxes

Development notes
- Pure front-end static files (no frameworks)
- Sudoku generation: backtracking solver to create a complete board, then clue removal ensuring uniqueness
- Difficulty sets target number of clues:
  - Easy: ~40
  - Medium: ~32
  - Hard: ~26

Troubleshooting
- If you don’t see a puzzle:
  - Select a difficulty and click “New Game”
- If borders look misaligned:
  - Some browsers or zoom levels can introduce sub-pixel rendering. The grid now uses explicit borders for 3×3 boxes and edges to avoid gaps. If you still notice issues, try 100% zoom and report your OS/browser/zoom so we can fine-tune.

License
- You can use, modify, and distribute this project in your own apps or portfolios. If you need a formal license (e.g., MIT), let me know and I’ll add it.