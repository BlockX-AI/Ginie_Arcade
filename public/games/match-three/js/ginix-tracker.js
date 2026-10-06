(function() {
    let lastScore = 0;
    let gameStartTime = Date.now();
    let trackingInterval = null;
    let gameEnded = false;
    let maxScoreReached = false;

    console.log('Ginix Tracker: Match-Three game tracker initialized');

    function findReactState() {
        const root = document.getElementById('root');
        if (!root) return null;
        
        // Try to find score and time in the DOM
        const scoreElements = document.querySelectorAll('[class*="score"], [class*="Score"]');
        const timerElements = document.querySelectorAll('[class*="timer"], [class*="Timer"], [class*="time"]');
        
        return { scoreElements, timerElements };
    }

    function getCurrentScore() {
        try {
            const { scoreElements } = findReactState();
            
            // Look for score text in various possible elements
            for (const el of scoreElements) {
                const text = el.textContent || el.innerText;
                const scoreMatch = text.match(/(\d+)/);
                if (scoreMatch) {
                    const score = parseInt(scoreMatch[1], 10);
                    if (score > 0 && score < 100000) {
                        return score;
                    }
                }
            }
            
            // Fallback: search all text content for "Score:" pattern
            const allText = document.body.textContent || document.body.innerText;
            const scorePattern = /Score[:\s]+(\d+)/i;
            const match = allText.match(scorePattern);
            if (match) {
                return parseInt(match[1], 10);
            }
        } catch (error) {
            console.error('Ginix Tracker: Error getting score:', error);
        }
        
        return 0;
    }

    function isGameOver() {
        try {
            const bodyText = document.body.textContent || document.body.innerText;
            
            // Check for common game over indicators
            if (bodyText.includes('Game Over') || 
                bodyText.includes('Time Up') ||
                bodyText.includes('GAME OVER') ||
                bodyText.includes('Final Score')) {
                return true;
            }
            
            // Check for restart/play again button
            const buttons = document.querySelectorAll('button');
            for (const button of buttons) {
                const text = button.textContent || button.innerText;
                if (text.includes('Play Again') || 
                    text.includes('Restart') || 
                    text.includes('New Game')) {
                    return true;
                }
            }
        } catch (error) {
            console.error('Ginix Tracker: Error checking game over:', error);
        }
        
        return false;
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

    function startTracking() {
        trackingInterval = setInterval(() => {
            const currentScore = getCurrentScore();
            
            // Send score updates
            if (currentScore !== lastScore && currentScore > 0) {
                sendScoreUpdate(currentScore);
                lastScore = currentScore;
                console.log('Ginix Tracker: Score update -', currentScore);
            }

            // Check if game is over
            if (isGameOver()) {
                const finalScore = getCurrentScore();
                sendGameEnd(finalScore);
            }
            
            // Check if time limit reached (60 seconds typical for match-3)
            const elapsed = (Date.now() - gameStartTime) / 1000;
            if (elapsed > 65 && !gameEnded) {
                const finalScore = getCurrentScore();
                sendGameEnd(finalScore);
            }
        }, 1000);

        console.log('Ginix Tracker: Tracking started');
    }

    function stopTracking() {
        if (trackingInterval) {
            clearInterval(trackingInterval);
            trackingInterval = null;
            console.log('Ginix Tracker: Tracking stopped');
        }
    }

    function init() {
        // Wait for React app to fully load
        const checkReady = setInterval(() => {
            const root = document.getElementById('root');
            if (root && root.children.length > 0) {
                clearInterval(checkReady);
                // Give React a moment to render
                setTimeout(() => {
                    startTracking();
                }, 2000);
            }
        }, 500);

        // Timeout fallback
        setTimeout(() => {
            clearInterval(checkReady);
            if (!trackingInterval) {
                console.log('Ginix Tracker: Starting tracking (timeout)');
                startTracking();
            }
        }, 5000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.GinixMatchThreeTracker = {
        getCurrentScore,
        sendScoreUpdate,
        sendGameEnd,
        isGameOver
    };

})();
