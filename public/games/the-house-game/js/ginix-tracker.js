/**
 * Ginix Progress Tracker for The House
 * Monitors game state and sends progress updates to parent window
 */

(function() {
    if (typeof $ === 'undefined' || typeof $.jStorage === 'undefined') {
        console.error('Ginix Tracker: jQuery and jStorage required');
        return;
    }

    var GinixTracker = {
        lastScore: 0,
        gameStarted: false,
        checkInterval: null,

        init: function() {
            console.log('Ginix Tracker: Initialized');
            this.gameStarted = true;
            this.startTracking();
        },

        calculateScore: function() {
            var collected = $.jStorage.get('collected') || [];
            var played = $.jStorage.get('played') || [];
            var used = $.jStorage.get('used') || [];

            // Score breakdown:
            // - Each item collected: 10 points
            // - Each scene/event played: 15 points
            // - Each item used: 5 points
            
            var itemScore = collected.length * 10;
            var sceneScore = played.length * 15;
            var usedScore = used.length * 5;

            var totalScore = itemScore + sceneScore + usedScore;

            return totalScore;
        },

        getRoomsVisited: function() {
            var isIn = $.jStorage.get('is_in') || '';
            var played = $.jStorage.get('played') || [];
            
            // Count unique rooms from played events
            var rooms = new Set();
            if (isIn) rooms.add(isIn);
            
            // Count rooms from played scenes
            played.forEach(function(scene) {
                if (scene.includes('room') || scene.includes('corridor') || scene.includes('kitchen')) {
                    rooms.add(scene);
                }
            });

            return rooms.size;
        },

        getProgress: function() {
            var collected = $.jStorage.get('collected') || [];
            var played = $.jStorage.get('played') || [];
            var used = $.jStorage.get('used') || [];

            return {
                itemsCollected: collected.length,
                scenesPlayed: played.length,
                itemsUsed: used.length,
                roomsVisited: this.getRoomsVisited(),
                currentRoom: $.jStorage.get('is_in') || 'unknown'
            };
        },

        checkGameEnd: function() {
            var played = $.jStorage.get('played') || [];
            
            // Check for game completion events
            // Based on game.js analysis, the game ends when player reaches certain scenes
            var endScenes = [
                'scene_train',
                'scene_computer',
                'scene_outside',
                'scene_unite',
                'scene_void_shower'
            ];

            var completedEndScenes = 0;
            endScenes.forEach(function(scene) {
                if (played.indexOf(scene) !== -1) {
                    completedEndScenes++;
                }
            });

            // If player has completed major ending scenes, consider game complete
            return completedEndScenes >= 3;
        },

        sendScoreUpdate: function(score) {
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'scoreUpdate',
                    score: score
                }, '*');
            }

            // Also use GinixBridge if available
            if (window.GinixBridge && typeof window.GinixBridge.onScoreUpdate === 'function') {
                window.GinixBridge.onScoreUpdate(score);
            }
        },

        sendGameEnd: function(finalScore) {
            console.log('Ginix Tracker: Game completed! Final score:', finalScore);
            
            if (window.parent && window.parent !== window) {
                window.parent.postMessage({
                    type: 'gameEnd',
                    score: finalScore
                }, '*');
            }

            // Also use GinixBridge
            if (window.GinixBridge && typeof window.GinixBridge.onGameEnd === 'function') {
                window.GinixBridge.onGameEnd(finalScore);
            }

            this.stopTracking();
        },

        startTracking: function() {
            var self = this;
            
            // Check progress every 2 seconds
            this.checkInterval = setInterval(function() {
                var currentScore = self.calculateScore();
                
                // Send score update if changed
                if (currentScore !== self.lastScore) {
                    self.sendScoreUpdate(currentScore);
                    self.lastScore = currentScore;
                    
                    var progress = self.getProgress();
                    console.log('Ginix Tracker: Progress -', progress, 'Score:', currentScore);
                }

                // Check if game is complete
                if (self.checkGameEnd()) {
                    self.sendGameEnd(currentScore);
                }
            }, 2000);

            console.log('Ginix Tracker: Tracking started');
        },

        stopTracking: function() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
                console.log('Ginix Tracker: Tracking stopped');
            }
        }
    };

    // Initialize when DOM is ready
    $(document).ready(function() {
        // Wait a bit for game to initialize
        setTimeout(function() {
            GinixTracker.init();
        }, 1000);
    });

    // Expose to window for debugging
    window.GinixTracker = GinixTracker;

})();
