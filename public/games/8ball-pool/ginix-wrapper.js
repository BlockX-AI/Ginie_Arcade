/**
 * Ginix Bridge Wrapper for 8 Ball Pool
 * Intercepts game events and submits scores to blockchain
 */

(function() {
  let currentScore = 0;
  let gameStartTime = Date.now();
  let hasSubmitted = false;

  // Intercept famobi_analytics to capture score events
  if (window.famobi_analytics) {
    const originalTrackStats = window.famobi_analytics.trackStats;
    const originalTrackEvent = window.famobi_analytics.trackEvent;

    // Intercept trackStats for score updates
    window.famobi_analytics.trackStats = function(eventName, data) {
      console.log('8Ball trackStats:', eventName, data);
      
      // Track level success/completion
      if (eventName === 'EVENT_LEVELSUCCESS' || eventName === 'levelSuccess') {
        if (data && data.levelScore) {
          currentScore = parseInt(data.levelScore) || 0;
          const xpEarned = currentScore * 10; // XP = Score × 10
          
          console.log('8Ball Pool - Level Success! Score:', currentScore, 'XP:', xpEarned);
          
          if (window.GinixBridge && !hasSubmitted) {
            hasSubmitted = true;
            window.GinixBridge.updateScore(xpEarned);
            window.GinixBridge.submitXP(xpEarned).then(result => {
              console.log('8Ball Pool score submitted to blockchain:', result);
            }).catch(err => {
              console.error('Failed to submit 8Ball Pool score:', err);
              hasSubmitted = false; // Allow retry
            });
          }
        }
      }
      
      // Call original function
      if (originalTrackStats) {
        return originalTrackStats.apply(this, arguments);
      }
    };

    // Intercept trackEvent for additional game events
    window.famobi_analytics.trackEvent = function(eventName, data) {
      console.log('8Ball trackEvent:', eventName, data);
      
      // Also check for custom event names
      if (eventName === 'EVENT_LEVELSUCCESS' || 
          eventName === 'EVENT_CUSTOM' || 
          eventName === 'gameComplete') {
        
        // Try to extract score from various possible data structures
        let score = 0;
        if (data) {
          score = data.levelScore || data.score || data.points || 0;
        }
        
        if (score > 0) {
          currentScore = Math.max(currentScore, parseInt(score));
          const xpEarned = currentScore * 10;
          
          if (window.GinixBridge && !hasSubmitted) {
            hasSubmitted = true;
            window.GinixBridge.updateScore(xpEarned);
            window.GinixBridge.submitXP(xpEarned).then(result => {
              console.log('8Ball Pool score submitted to blockchain:', result);
            }).catch(err => {
              console.error('Failed to submit 8Ball Pool score:', err);
              hasSubmitted = false;
            });
          }
        }
      }
      
      // Call original function
      if (originalTrackEvent) {
        return originalTrackEvent.apply(this, arguments);
      }
    };
  }

  // Also intercept window.FORCE_LOSE for game over detection
  const originalForceLose = window.FORCE_LOSE;
  window.FORCE_LOSE = function() {
    console.log('8Ball Pool - Game Over detected');
    
    // Submit final score even on loss
    if (currentScore > 0 && window.GinixBridge && !hasSubmitted) {
      const xpEarned = currentScore * 10;
      hasSubmitted = true;
      window.GinixBridge.updateScore(xpEarned);
      window.GinixBridge.submitXP(xpEarned).then(result => {
        console.log('8Ball Pool score submitted (game over):', result);
      }).catch(err => {
        console.error('Failed to submit 8Ball Pool score:', err);
      });
    }
    
    if (originalForceLose) {
      return originalForceLose.apply(this, arguments);
    }
  };

  // Periodic score tracking (fallback)
  setInterval(() => {
    if (window.projectInfo && window.projectInfo.score) {
      const gameScore = parseInt(window.projectInfo.score) || 0;
      if (gameScore > currentScore) {
        currentScore = gameScore;
        const xpEarned = currentScore * 10;
        
        // Update arcade UI in real-time
        if (window.GinixBridge) {
          window.GinixBridge.updateScore(xpEarned);
        }
      }
    }
  }, 2000);

  console.log('8Ball Pool - Ginix Bridge Wrapper initialized');
})();
