/**
 * Game state for Snake.io
 */
Game = function(game) {}

Game.prototype = {
    preload: function() {
        // Load assets
        this.game.load.image('circle','asset/circle.png');
        this.game.load.image('shadow', 'asset/white-shadow.png');
        this.game.load.image('background', 'asset/tile.png');
        this.game.load.image('eye-white', 'asset/eye-white.png');
        this.game.load.image('eye-black', 'asset/eye-black.png');
        this.game.load.image('food', 'asset/hex.png');
    },
    
    create: function() {
        var width = this.game.width;
        var height = this.game.height;
        
        // Create larger world (4x4 screens)
        this.game.world.setBounds(-width * 2, -height * 2, width * 4, height * 4);
        this.game.stage.backgroundColor = '#2C3E50';
        
        // Add tilesprite background
        var background = this.game.add.tileSprite(
            -width * 2, -height * 2,
            this.game.world.width, this.game.world.height,
            'background'
        );
        background.alpha = 0.3;
        
        // Initialize physics and groups
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.setBoundsToWorld(true, true, true, true, false);
        
        this.foodGroup = this.game.add.group();
        this.snakeHeadCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.foodCollisionGroup = this.game.physics.p2.createCollisionGroup();
        
        // Add more food (300 pieces)
        for (var i = 0 ; i < 300 ; i++) {
            this.initFood(
                Util.randomInt(-width * 2, width * 2),
                Util.randomInt(-height * 2, height * 2)
            );
        }
        
        this.game.snakes = [];
        
        // Create player snake with custom name from global variable
        var playerName = window.playerName || 'Player';
        var snake = new PlayerSnake(this.game, 'circle', 0, 0, playerName);
        this.game.camera.follow(snake.head);
        
        // Expanded bot name pool for dynamic spawning
        this.botNames = [
            'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon',
            'Zeta', 'Theta', 'Lambda', 'Sigma', 'Omega',
            'Phoenix', 'Dragon', 'Tiger', 'Eagle', 'Viper',
            'Cobra', 'Python', 'Anaconda', 'Mamba', 'Rattler',
            'Nova', 'Blaze', 'Storm', 'Frost', 'Shadow',
            'Phantom', 'Ghost', 'Wraith', 'Specter', 'Spirit',
            'Titan', 'Atlas', 'Zeus', 'Thor', 'Odin',
            'Ares', 'Hades', 'Poseidon', 'Apollo', 'Artemis',
            'Nyx', 'Orion', 'Draco', 'Leo', 'Aquila',
            'Hydra', 'Cerberus', 'Griffin', 'Basilisk', 'Chimera'
        ];
        this.usedBotNames = [];
        this.botSpawnCounter = 0;
        
        // Create 8 initial bot snakes in corners
        for (var i = 0; i < 8; i++) {
            this.spawnBot();
        }
        
        // Set up periodic bot spawning to maintain population
        var self = this;
        this.botSpawnTimer = this.game.time.events.loop(Phaser.Timer.SECOND * 30, function() {
            // Count current bots
            var botCount = 0;
            for (var i = 0; i < self.game.snakes.length; i++) {
                if (self.game.snakes[i].isBot) botCount++;
            }
            
            // Spawn new bots if count is below 12, one at a time
            var targetBots = 12 + Math.floor(self.game.time.totalElapsedSeconds() / 60);
            if (targetBots > 20) targetBots = 20; // Cap at 20 bots
            
            if (botCount < targetBots) {
                self.spawnBot();
            }
        }, this);
        
        // Initialize snake groups and collision
        for (var i = 0 ; i < this.game.snakes.length ; i++) {
            var snake = this.game.snakes[i];
            snake.head.body.setCollisionGroup(this.snakeHeadCollisionGroup);
            snake.head.body.collides([this.foodCollisionGroup]);
            snake.addDestroyedCallback(this.snakeDestroyed, this);
        }
        
        // Setup minimap
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
    },
    
    update: function() {
        // Update all snakes
        for (var i = this.game.snakes.length - 1 ; i >= 0 ; i--) {
            this.game.snakes[i].update();
        }
        
        // Update all food
        for (var i = this.foodGroup.children.length - 1 ; i >= 0 ; i--) {
            var f = this.foodGroup.children[i];
            f.food.update();
        }
        
        // Update leaderboard
        this.updateLeaderboard(this.game.snakes);
        
        // Update minimap
        this.updateMinimap(this.game, this.minimapCtx);
        
        // Update score display and notify parent window
        if (this.game.snakes[0]) {
            var currentLength = Math.floor(this.game.snakes[0].snakeLength);
            document.getElementById('score-value').textContent = currentLength;
            
            // Send real-time score updates to parent window
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'scoreUpdate',
                    score: currentLength
                }, '*');
            }
        }
    },
    
    spawnBot: function() {
        // Spawn bots in corners of the world
        var width = this.game.width;
        var height = this.game.height;
        var corners = [
            { x: -width * 1.8, y: -height * 1.8 },  // Top-left
            { x: width * 1.8, y: -height * 1.8 },   // Top-right
            { x: -width * 1.8, y: height * 1.8 },   // Bottom-left
            { x: width * 1.8, y: height * 1.8 }     // Bottom-right
        ];
        var corner = corners[Math.floor(Math.random() * corners.length)];
        var x = corner.x + (Math.random() - 0.5) * 400;
        var y = corner.y + (Math.random() - 0.5) * 400;
        
        // Get a bot name (reuse if necessary)
        var name;
        if (this.usedBotNames.length < this.botNames.length) {
            // Find unused name
            var availableNames = this.botNames.filter(function(n) {
                return this.usedBotNames.indexOf(n) === -1;
            }, this);
            name = availableNames[Math.floor(Math.random() * availableNames.length)];
        } else {
            // All names used, add number suffix
            name = this.botNames[this.botSpawnCounter % this.botNames.length] + this.botSpawnCounter;
        }
        
        this.usedBotNames.push(name);
        this.botSpawnCounter++;
        
        var bot = new BotSnake(this.game, 'circle', x, y, name);
        bot.head.body.setCollisionGroup(this.snakeHeadCollisionGroup);
        bot.head.body.collides([this.foodCollisionGroup]);
        bot.addDestroyedCallback(this.snakeDestroyed, this);
        
        return bot;
    },
    
    initFood: function(x, y) {
        var f = new Food(this.game, x, y);
        f.sprite.body.setCollisionGroup(this.foodCollisionGroup);
        this.foodGroup.add(f.sprite);
        f.sprite.body.collides([this.snakeHeadCollisionGroup]);
        return f;
    },
    
    snakeDestroyed: function(snake) {
        // Place food where snake was destroyed
        for (var i = 0 ; i < snake.headPath.length ;
        i += Math.round(snake.headPath.length / snake.snakeLength) * 2) {
            this.initFood(
                snake.headPath[i].x + Util.randomInt(-10,10),
                snake.headPath[i].y + Util.randomInt(-10,10)
            );
        }
        
        // If player died, send game end with final score
        if (!snake.isBot) {
            var finalScore = Math.floor(snake.snakeLength);
            console.log('[Snake.io] Player died! Final length:', finalScore);
            
            // Send to parent window
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'gameEnd',
                    score: finalScore
                }, '*');
            }
            
            // Also use Ginix Bridge if available
            if (window.GinixBridge) {
                window.GinixBridge.endGame(finalScore);
            }
        }
        
        // Respawn bot after 5 seconds (slower respawn)
        if (snake.isBot) {
            var self = this;
            setTimeout(function() {
                self.spawnBot();
            }, 5000);
        }
    },
    
    updateLeaderboard: function(snakes) {
        if (!snakes || snakes.length === 0) return;
        
        // Sort by length
        var sortedSnakes = snakes.slice().sort(function(a, b) {
            return b.snakeLength - a.snakeLength;
        });
        
        var leaderboardList = document.getElementById('leaderboard-list');
        var html = '';
        
        for (var i = 0; i < Math.min(10, sortedSnakes.length); i++) {
            var snake = sortedSnakes[i];
            var isPlayer = !snake.isBot;
            var className = isPlayer ? 'leader-entry player' : 'leader-entry';
            html += '<div class="' + className + '">' +
                    (i + 1) + '. ' + snake.name + ' - ' +
                    Math.floor(snake.snakeLength) +
                    '</div>';
        }
        
        leaderboardList.innerHTML = html;
    },
    
    updateMinimap: function(game, ctx) {
        if (!game.snakes || game.snakes.length === 0) return;
        
        var canvas = ctx.canvas;
        var worldWidth = game.world.width;
        var worldHeight = game.world.height;
        var worldLeft = game.world.bounds.x;
        var worldTop = game.world.bounds.y;
        
        // Clear minimap
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = '#34495e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw world border
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Draw all snakes
        for (var i = 0; i < game.snakes.length; i++) {
            var snake = game.snakes[i];
            if (!snake.head || !snake.head.body) continue;
            
            var x = ((snake.head.body.x - worldLeft) / worldWidth) * canvas.width;
            var y = ((snake.head.body.y - worldTop) / worldHeight) * canvas.height;
            
            // Highlight player
            if (!snake.isBot) {
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = snake.color || '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
};
