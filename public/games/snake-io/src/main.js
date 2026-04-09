/**
 * Snake.io - Enhanced Multiplayer Game
 * Main initialization and start screen handler
 */

// Global variable for player name
window.playerName = '';

// Start screen logic
document.addEventListener('DOMContentLoaded', function() {
    var startButton = document.getElementById('start-button');
    var playerNameInput = document.getElementById('player-name');
    
    // Handle enter key
    playerNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            startGame();
        }
    });
    
    startButton.addEventListener('click', startGame);
    
    function startGame() {
        window.playerName = playerNameInput.value.trim();
        
        if (!window.playerName || window.playerName.length < 2) {
            window.playerName = 'Player_' + Math.floor(Math.random() * 1000);
        }
        
        // Hide start screen
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        document.getElementById('leaderboard').style.display = 'block';
        document.getElementById('minimap').style.display = 'block';
        document.getElementById('score').style.display = 'block';
        
        // Initialize Phaser game with Game state
        var game = new Phaser.Game(
            window.innerWidth,
            window.innerHeight,
            Phaser.AUTO,
            'game-container'
        );
        
        // Add game state
        game.state.add('Game', Game);
        game.state.start('Game');
    }
});
