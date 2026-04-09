(function() {
    let lastScore = 0;
    let gameStartTime = Date.now();
    let trackingInterval = null;
    let gameEnded = false;

    function getCurrentScore() {
        try {
            const scoreElements = document.querySelectorAll('[class*="score"], [class*="Score"]');
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
            if (bodyText.includes('Game Over') ||
                bodyText.includes('Time Up') ||
                bodyText.includes('GAME OVER') ||
                bodyText.includes('Final Score')) {
                return true;
            }
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
            window.parent.postMessage({ type: 'scoreUpdate', score: score }, '*');
        }
        if (window.GinixBridge && typeof window.GinixBridge.updateScore === 'function') {
            window.GinixBridge.updateScore(score);
        }
    }

    function sendGameEnd(finalScore) {
        if (gameEnded) return;
        gameEnded = true;
        console.log('Ginix Tracker: Game Over! Final score:', finalScore);
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'gameEnd', score: finalScore }, '*');
        }
        if (window.GinixBridge && typeof window.GinixBridge.endGame === 'function') {
            window.GinixBridge.endGame(finalScore);
        }
        stopTracking();
    }

    function startTracking() {
        trackingInterval = setInterval(() => {
            const currentScore = getCurrentScore();
            if (currentScore !== lastScore && currentScore > 0) {
                sendScoreUpdate(currentScore);
                lastScore = currentScore;
                console.log('score: ' + currentScore);
            }
            if (isGameOver()) {
                sendGameEnd(getCurrentScore());
            }
            const elapsed = (Date.now() - gameStartTime) / 1000;
            if (elapsed > 65 && !gameEnded) {
                sendGameEnd(getCurrentScore());
            }
        }, 1000);
        console.log('Ginix Tracker: Tracking started');
    }

    function stopTracking() {
        if (trackingInterval) {
            clearInterval(trackingInterval);
            trackingInterval = null;
        }
    }

    function init() {
        const checkReady = setInterval(() => {
            const root = document.getElementById('root');
            if (root && root.children.length > 0) {
                clearInterval(checkReady);
                setTimeout(() => { startTracking(); }, 2000);
            }
        }, 500);
        setTimeout(() => {
            clearInterval(checkReady);
            if (!trackingInterval) startTracking();
        }, 5000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.GinixMatchThreeTracker = { getCurrentScore, sendScoreUpdate, sendGameEnd, isGameOver };
})();
