/**
 * Ginix Arcade - Game Integration Bridge
 * Handles communication between Godot games and Next.js frontend
 */

(function() {
  'use strict';
  
  const GinixBridge = {
    sessionId: null,
    nonce: null,
    gameId: null,
    startTime: Date.now(),
    currentScore: 0,
    isGameActive: false,
    
    init() {
      // Get session data from URL params
      const params = new URLSearchParams(window.location.search);
      this.sessionId = params.get('sessionId');
      this.nonce = params.get('nonce');
      this.gameId = window.gameID || params.get('gameId');
      
      console.log('[Ginix Bridge] Initialized', {
        sessionId: this.sessionId,
        gameId: this.gameId,
        nonce: this.nonce ? 'present' : 'missing'
      });
      
      // Override console to capture game events
      this.interceptConsoleLogs();
      
      // Listen for game canvas ready
      this.waitForGameReady();
      
      // Notify parent game is ready
      this.sendMessage('gameReady', { 
        gameId: this.gameId,
        timestamp: Date.now()
      });
    },
    
    waitForGameReady() {
      const checkInterval = setInterval(() => {
        const canvas = document.getElementById('canvas');
        if (canvas && canvas.width > 0) {
          clearInterval(checkInterval);
          this.isGameActive = true;
          this.sendMessage('gameStarted', { 
            gameId: this.gameId,
            timestamp: Date.now()
          });
          console.log('[Ginix Bridge] Game canvas ready');
        }
      }, 100);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!this.isGameActive) {
          console.error('[Ginix Bridge] Game failed to start');
          this.sendMessage('gameError', { error: 'Game failed to load' });
        }
      }, 30000);
    },
    
    interceptConsoleLogs() {
      const originalLog = console.log;
      const originalError = console.error;
      const self = this;
      
      console.log = function(...args) {
        originalLog.apply(console, args);
        
        const message = args.join(' ');
        
        // Score detection patterns
        if (message.match(/score[:\s]+(\d+)/i)) {
          const score = parseInt(message.match(/(\d+)/)?.[1] || 0);
          if (score !== self.currentScore) {
            self.onScoreUpdate(score);
          }
        }
        
        // Game over detection
        if (message.match(/game\s*over|died|finished|gameover/i)) {
          self.onGameEnd();
        }
        
        // Level/stage progression
        if (message.match(/level|stage/i)) {
          self.sendMessage('gameProgress', { message });
        }
      };
      
      console.error = function(...args) {
        originalError.apply(console, args);
        const message = args.join(' ');
        self.sendMessage('gameError', { error: message });
      };
    },
    
    onScoreUpdate(score) {
      this.currentScore = score;
      this.sendMessage('scoreUpdate', { 
        score,
        timestamp: Date.now()
      });
    },
    
    onGameEnd() {
      if (!this.isGameActive) return;
      
      this.isGameActive = false;
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      
      console.log('[Ginix Bridge] Game ended', {
        score: this.currentScore,
        duration
      });
      
      this.sendMessage('gameEnd', {
        score: this.currentScore,
        duration,
        sessionId: this.sessionId,
        timestamp: Date.now()
      });
    },
    
    sendMessage(type, data) {
      const message = {
        type,
        gameId: this.gameId,
        ...data
      };
      
      // Send to parent window
      if (window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
      
      // Also send to top window (in case of nested iframes)
      if (window.top !== window) {
        window.top.postMessage(message, '*');
      }
    },
    
    // API for Godot games to call directly
    updateScore(score) {
      this.onScoreUpdate(score);
    },
    
    endGame(finalScore) {
      if (finalScore !== undefined) {
        this.currentScore = finalScore;
      }
      this.onGameEnd();
    }
  };
  
  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GinixBridge.init());
  } else {
    GinixBridge.init();
  }
  
  // Expose globally for games to use
  window.GinixBridge = GinixBridge;
  
  console.log('[Ginix Bridge] Script loaded');
})();
