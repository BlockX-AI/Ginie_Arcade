/**
 * Ginix Bridge Integration for 8 Ball Pool
 * Hooks into the game's global variables to track score and game end
 */

(function() {
  console.log('[8Ball Pool] Ginix integration loaded');
  
  let gameState = {
    ballsPocketed: 0,
    gameStartTime: Date.now(),
    lastScore: 0,
    gameEnded: false,
    checkInterval: null
  };

  // Wait for game to load
  function waitForGame() {
    if (typeof window.projectInfo !== 'undefined' && typeof window.playState !== 'undefined') {
      console.log('[8Ball Pool] Game detected, starting score tracking');
      startScoreTracking();
    } else {
      setTimeout(waitForGame, 500);
    }
  }

  function startScoreTracking() {
    // Track score updates every second
    gameState.checkInterval = setInterval(function() {
      if (!window.projectInfo || gameState.gameEnded) return;
      
      // Get current score from game
      const currentScore = window.projectInfo.score || 0;
      
      // Update score if changed
      if (currentScore !== gameState.lastScore && currentScore > 0) {
        gameState.lastScore = currentScore;
        if (window.GinixBridge) {
          window.GinixBridge.updateScore(currentScore);
          console.log('[8Ball Pool] Score updated:', currentScore);
        }
      }
      
      // Check for game over
      if (window.playState && window.playState.gameInfo) {
        const gameInfo = window.playState.gameInfo;
        
        // Game over condition
        if (gameInfo.gameOver === 1 && !gameState.gameEnded) {
          gameState.gameEnded = true;
          clearInterval(gameState.checkInterval);
          
          // Calculate final score with time bonus
          const duration = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
          const timeBonus = Math.max(0, 300 - duration);
          const finalScore = currentScore + timeBonus;
          
          console.log('[8Ball Pool] Game ended - Score:', currentScore, 'Time bonus:', timeBonus, 'Final:', finalScore);
          
          if (window.GinixBridge) {
            window.GinixBridge.endGame(finalScore);
          }
        }
      }
      
      // Fallback: Check for levelComplete flag
      if (window.projectInfo.levelComplete && !gameState.gameEnded) {
        gameState.gameEnded = true;
        clearInterval(gameState.checkInterval);
        
        const duration = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
        const timeBonus = Math.max(0, 300 - duration);
        const finalScore = currentScore + timeBonus;
        
        console.log('[8Ball Pool] Level complete - Final score:', finalScore);
        
        if (window.GinixBridge) {
          window.GinixBridge.endGame(finalScore);
        }
      }
    }, 1000);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForGame);
  } else {
    waitForGame();
  }
})();
