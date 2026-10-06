/**
 * Ginix Arcade - Game Integration Bridge
 * Handles communication between game iframes (Phaser, Godot, etc.) and Next.js frontend.
 * Supports: direct API calls, console.log interception, Godot virtualConsole proxy.
 */

(function() {
  'use strict';

  // Track whether bridge logging should go to the real console (avoid recursion)
  let _realLog, _realError;

  const GinixBridge = {
    sessionId: null,
    nonce: null,
    gameId: null,
    startTime: Date.now(),
    currentScore: 0,
    isGameActive: false,
    _gameEndSent: false,
    levelsCompleted: 0, // Track TileNova levels

    init() {
      const params = new URLSearchParams(window.location.search);
      this.sessionId = params.get('sessionId');
      this.nonce = params.get('nonce');
      this.gameId = window.gameID || params.get('gameId');

      _realLog('[Ginix Bridge] Initialized', {
        sessionId: this.sessionId,
        gameId: this.gameId,
        nonce: this.nonce ? 'present' : 'missing'
      });

      this.waitForGameReady();

      this.sendMessage('gameReady', {
        gameId: this.gameId,
        timestamp: Date.now()
      });
    },

    waitForGameReady() {
      const self = this;
      const checkInterval = setInterval(() => {
        const canvas = document.getElementById('canvas');
        if (canvas && canvas.width > 0) {
          clearInterval(checkInterval);
          self.isGameActive = true;
          self.sendMessage('gameStarted', {
            gameId: self.gameId,
            timestamp: Date.now()
          });
          _realLog('[Ginix Bridge] Game canvas ready');
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!self.isGameActive) {
          _realError('[Ginix Bridge] Game failed to start');
          self.sendMessage('gameError', { error: 'Game failed to load' });
        }
      }, 30000);
    },

    // --- Detection logic applied to ALL output (console + virtualConsole) ---
    _processOutput(message) {
      if (!message || typeof message !== 'string') return;
      // Ignore our own bridge logs
      if (message.indexOf('[Ginix Bridge]') !== -1) return;

      // ----- TileNova: Level Complete (add 1 level, don't end game) -----
      if (/All Power Nodes activated.*Level Complete/i.test(message)) {
        this.levelsCompleted++;
        this.onScoreUpdate(this.levelsCompleted);
        _realLog('[Ginix Bridge] TileNova level completed! Total levels:', this.levelsCompleted);
        return;
      }

      // ----- Score detection (broad patterns) -----
      // Pattern 1: "score: 123" / "Score 123" / "score=123"
      let m = message.match(/\bscore[\s:=]+(\d+)/i);
      if (m) {
        const s = parseInt(m[1], 10);
        if (s > 0 && s !== this.currentScore) {
          this.onScoreUpdate(s);
          _realLog('[Ginix Bridge] Detected score:', s);
        }
        return;
      }
      
      // Pattern 2: "points: 123" / "Points 123"
      m = message.match(/\bpoints[\s:=]+(\d+)/i);
      if (m) {
        const s = parseInt(m[1], 10);
        if (s > 0 && s !== this.currentScore) {
          this.onScoreUpdate(s);
          _realLog('[Ginix Bridge] Detected points:', s);
        }
        return;
      }
      
      // Pattern 3: Godot-style — line is just a number (common: print(score))
      if (/^\s*\d+\s*$/.test(message)) {
        const s = parseInt(message.trim(), 10);
        if (s > 0 && s !== this.currentScore) {
          this.onScoreUpdate(s);
          _realLog('[Ginix Bridge] Detected raw number:', s);
        }
        return;
      }

      // ----- Game Over detection (NOT level complete) -----
      if (/game\s*[-_]?\s*over|died|finished|gameover|you\s+lose|you\s+lost|defeat|game\s*end/i.test(message)) {
        _realLog('[Ginix Bridge] Game end detected from message:', message);
        this.onGameEnd();
      }
    },

    onScoreUpdate(score) {
      this.currentScore = score;
      this.sendMessage('scoreUpdate', {
        score,
        timestamp: Date.now()
      });
    },

    onGameEnd() {
      if (!this.isGameActive || this._gameEndSent) return;
      this._gameEndSent = true;
      this.isGameActive = false;
      const duration = Math.floor((Date.now() - this.startTime) / 1000);

      _realLog('[Ginix Bridge] Game ended', { score: this.currentScore, duration });

      this.sendMessage('gameEnd', {
        score: this.currentScore,
        duration,
        sessionId: this.sessionId,
        timestamp: Date.now()
      });
    },

    sendMessage(type, data) {
      const message = { type, gameId: this.gameId, ...data };
      if (window.parent !== window) window.parent.postMessage(message, '*');
      if (window.top !== window && window.top !== window.parent) window.top.postMessage(message, '*');
    },

    // --- Public API for games (Phaser, Godot JavaScriptBridge, etc.) ---
    updateScore(score) {
      this.onScoreUpdate(score);
    },

    endGame(finalScore) {
      if (finalScore !== undefined) this.currentScore = finalScore;
      this.onGameEnd();
    },

    // Reset for replay
    reset() {
      this.currentScore = 0;
      this.isGameActive = true;
      this._gameEndSent = false;
      this.startTime = Date.now();
    },

    // Submit XP to blockchain (used by Snake.io and other games)
    submitXP(xpAmount) {
      return new Promise((resolve, reject) => {
        if (!xpAmount || xpAmount <= 0) {
          reject(new Error('Invalid XP amount'));
          return;
        }
        
        _realLog('[Ginix Bridge] Submitting XP:', xpAmount);
        
        // Treat XP submission as game end with score = XP
        this.currentScore = xpAmount;
        this.onGameEnd();
        
        // Simulate async blockchain submission
        setTimeout(() => {
          resolve({
            success: true,
            xp: xpAmount,
            timestamp: Date.now()
          });
        }, 500);
      });
    }
  };

  // ---- Intercept console.log / console.error ----
  _realLog = console.log.bind(console);
  _realError = console.error.bind(console);

  console.log = function(...args) {
    _realLog.apply(console, args);
    GinixBridge._processOutput(args.join(' '));
  };

  console.error = function(...args) {
    _realError.apply(console, args);
    GinixBridge.sendMessage('gameError', { error: args.join(' ') });
  };

  // ---- Set up window.virtualConsole for Godot games ----
  // Godot uses: (window.virtualConsole ?? console).log(...)
  // By defining virtualConsole, ALL Godot output goes through our proxy.
  window.virtualConsole = {
    log: function(...args) {
      _realLog.apply(console, args);
      GinixBridge._processOutput(args.join(' '));
    },
    error: function(...args) {
      _realError.apply(console, args);
      GinixBridge.sendMessage('gameError', { error: args.join(' ') });
    },
    warn: function(...args) {
      (console.warn || _realLog).apply(console, args);
    },
    info: function(...args) {
      _realLog.apply(console, args);
      GinixBridge._processOutput(args.join(' '));
    }
  };

  // ---- Expose globally ----
  window.GinixBridge = GinixBridge;

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GinixBridge.init());
  } else {
    GinixBridge.init();
  }

  _realLog('[Ginix Bridge] Script loaded');
})();
