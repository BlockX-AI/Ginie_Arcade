/**
 * Ginix Score Tracker for Shooter
 * Monitors score and sends updates to parent window
 * XP = Score (direct 1:1 mapping)
 */

(function() {
    let lastScore = 0;
    let gameStartTime = Date.now();
    let trackingInterval = null;
    let gameEnded = false;

    console.log('Ginix Tracker: Shooter game tracker initialized');

    function getCurrentScore() {
        const scoreEl = document.querySelector('.js-score');
        if (!scoreEl) return 0;
        
        const scoreText = scoreEl.textContent || '0';
        return parseInt(scoreText, 10) || 0;
    }

    function getCurrentLives() {
        const livesEl = document.querySelector('.js-lives');
        if (!livesEl) return 0;
        
        const livesText = livesEl.textContent || '0';
        return parseInt(livesText, 10) || 0;
    }

    function sendScoreUpdate(score) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'scoreUpdate',
                score: score
            }, '*');
        }

        if (window.GinixBridge && typeof window.GinixBridge.onScoreUpdate === 'function') {
            window.GinixBridge.onScoreUpdate(score);
        }
    }

    function sendGameEnd(finalScore) {
        if (gameEnded) return;
        gameEnded = true;

        console.log('Ginix Tracker: Game Over! Final score:', finalScore);
        
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'gameEnd',
                score: finalScore
            }, '*');
        }

        if (window.GinixBridge && typeof window.GinixBridge.onGameEnd === 'function') {
            window.GinixBridge.onGameEnd(finalScore);
        }

        stopTracking();
    }

    function checkGameOver() {
        const gameOverEl = document.querySelector('.js-game-over');
        if (!gameOverEl) return false;
        
        // Check if game over screen is visible
        return gameOverEl.classList.contains('is-show');
    }

    function startTracking() {
        trackingInterval = setInterval(() => {
            const currentScore = getCurrentScore();
            
            // Send score update if changed
            if (currentScore !== lastScore) {
                sendScoreUpdate(currentScore);
                lastScore = currentScore;
                console.log('Ginix Tracker: Score update -', currentScore);
            }

            // Check if game is over
            if (checkGameOver()) {
                const finalScore = getCurrentScore();
                sendGameEnd(finalScore);
            }
        }, 1000); // Check every second

        console.log('Ginix Tracker: Tracking started');
    }

    function stopTracking() {
        if (trackingInterval) {
            clearInterval(trackingInterval);
            trackingInterval = null;
            console.log('Ginix Tracker: Tracking stopped');
        }
    }

    // Wait for game to be ready, then start tracking
    function init() {
        const checkReady = setInterval(() => {
            const scoreEl = document.querySelector('.js-score');
            if (scoreEl) {
                clearInterval(checkReady);
                startTracking();
            }
        }, 500);

        // Safety timeout
        setTimeout(() => {
            clearInterval(checkReady);
            if (!trackingInterval) {
                startTracking();
            }
        }, 5000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.GinixShooterTracker = {
        getCurrentScore,
        getCurrentLives,
        sendScoreUpdate,
        sendGameEnd
    };

})();
