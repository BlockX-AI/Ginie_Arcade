/*jslint bitwise: true, node: true */
'use strict';

/**
 * Bot Manager for Agar.io Clone
 * Manages AI bots that behave like real players
 */

const mapUtils = require('../map/map');
const util = require('../lib/util');

// Bot configuration
const BOT_CONFIG = {
    MIN_BOTS: 10,           // Minimum number of bots to maintain
    INITIAL_BOTS: 15,       // Number of bots to spawn on start
    RESPAWN_DELAY: 3000,    // Delay before respawning dead bot (ms)
    
    // Bot personalities
    AGGRESSIVE_CHANCE: 0.3,  // 30% aggressive
    DEFENSIVE_CHANCE: 0.4,   // 40% defensive
    // Remaining 30% passive
    
    // Movement thresholds
    CHASE_MASS_RATIO: 1.2,   // Chase if bot mass > target mass * 1.2
    FLEE_MASS_RATIO: 0.8,    // Flee if bot mass < target mass * 0.8
    DETECTION_RANGE: 400,    // How far bots can "see" other players
    
    // Random movement
    RANDOM_MOVE_INTERVAL: 3000,  // Change random direction every 3s
    RANDOM_MOVE_DISTANCE: 200    // Random target offset
};

// Bot personality types
const PERSONALITY = {
    AGGRESSIVE: 'aggressive',  // Chases smaller players aggressively
    DEFENSIVE: 'defensive',    // Avoids larger players, cautious
    PASSIVE: 'passive'         // Wanders randomly, only flees when very threatened
};

/**
 * Bot class - extends player behavior with AI
 */
class Bot {
    constructor(id, name, personality) {
        this.id = id;
        this.name = name;
        this.personality = personality;
        this.isBot = true;
        this.lastRandomMove = Date.now();
        this.randomTarget = null;
    }
    
    /**
     * Determines bot's personality based on random chance
     */
    static randomPersonality() {
        const rand = Math.random();
        if (rand < BOT_CONFIG.AGGRESSIVE_CHANCE) {
            return PERSONALITY.AGGRESSIVE;
        } else if (rand < BOT_CONFIG.AGGRESSIVE_CHANCE + BOT_CONFIG.DEFENSIVE_CHANCE) {
            return PERSONALITY.DEFENSIVE;
        }
        return PERSONALITY.PASSIVE;
    }
    
    /**
     * Calculate AI target based on nearby players and bot personality
     */
    calculateTarget(botPlayer, allPlayers, gameWidth, gameHeight) {
        // Find nearest HUMAN player within detection range (ignore other bots)
        let nearestPlayer = null;
        let nearestDistance = BOT_CONFIG.DETECTION_RANGE;
        
        for (let player of allPlayers) {
            if (player.id === this.id) continue; // Skip self
            if (player.isBot) continue; // Ignore other bots to reduce clustering
            if (!player.cells || player.cells.length === 0) continue;
            
            const distance = Math.hypot(player.x - botPlayer.x, player.y - botPlayer.y);
            
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestPlayer = player;
            }
        }
        
        // AI Decision making based on personality and target
        if (nearestPlayer) {
            const massRatio = botPlayer.massTotal / nearestPlayer.massTotal;
            
            switch (this.personality) {
                case PERSONALITY.AGGRESSIVE:
                    // Aggressive: chase if bigger or similar size
                    if (massRatio > BOT_CONFIG.FLEE_MASS_RATIO) {
                        return this.chaseTarget(botPlayer, nearestPlayer);
                    } else {
                        return this.fleeTarget(botPlayer, nearestPlayer, gameWidth, gameHeight);
                    }
                    
                case PERSONALITY.DEFENSIVE:
                    // Defensive: only chase if significantly bigger
                    if (massRatio > BOT_CONFIG.CHASE_MASS_RATIO) {
                        return this.chaseTarget(botPlayer, nearestPlayer);
                    } else if (massRatio < 1.0) {
                        return this.fleeTarget(botPlayer, nearestPlayer, gameWidth, gameHeight);
                    } else {
                        return this.moveRandomly(botPlayer, gameWidth, gameHeight);
                    }
                    
                case PERSONALITY.PASSIVE:
                    // Passive: only flee if much smaller
                    if (massRatio < BOT_CONFIG.FLEE_MASS_RATIO * 0.5) {
                        return this.fleeTarget(botPlayer, nearestPlayer, gameWidth, gameHeight);
                    } else {
                        return this.moveRandomly(botPlayer, gameWidth, gameHeight);
                    }
            }
        }
        
        // No target found - move randomly
        return this.moveRandomly(botPlayer, gameWidth, gameHeight);
    }
    
    /**
     * Chase target player
     */
    chaseTarget(botPlayer, targetPlayer) {
        return {
            x: targetPlayer.x,
            y: targetPlayer.y
        };
    }
    
    /**
     * Flee from target player
     */
    fleeTarget(botPlayer, targetPlayer, gameWidth, gameHeight) {
        // Move in opposite direction
        const dx = botPlayer.x - targetPlayer.x;
        const dy = botPlayer.y - targetPlayer.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance === 0) {
            return this.moveRandomly(botPlayer, gameWidth, gameHeight);
        }
        
        // Flee in opposite direction
        const fleeX = botPlayer.x + (dx / distance) * 300;
        const fleeY = botPlayer.y + (dy / distance) * 300;
        
        return {
            x: Math.max(0, Math.min(gameWidth, fleeX)),
            y: Math.max(0, Math.min(gameHeight, fleeY))
        };
    }
    
    /**
     * Move to random position
     */
    moveRandomly(botPlayer, gameWidth, gameHeight) {
        const now = Date.now();
        
        // Update random target periodically OR if reached current target
        const reachedTarget = this.randomTarget && 
            Math.hypot(botPlayer.x - this.randomTarget.x, botPlayer.y - this.randomTarget.y) < 100;
        
        if (!this.randomTarget || now - this.lastRandomMove > BOT_CONFIG.RANDOM_MOVE_INTERVAL || reachedTarget) {
            this.lastRandomMove = now;
            
            // Generate completely new random position (not relative to current)
            this.randomTarget = {
                x: Math.random() * (gameWidth - 100) + 50,
                y: Math.random() * (gameHeight - 100) + 50
            };
        }
        
        return this.randomTarget;
    }
}

/**
 * Bot Manager - handles all bot lifecycle
 */
class BotManager {
    constructor(config) {
        this.config = config;
        this.bots = new Map(); // Map of bot ID to Bot instance
        this.botCounter = 0;
        this.respawnQueue = [];
    }
    
    /**
     * Initialize bots on server start
     */
    initialize(map, generateSpawnpoint, defaultPlayerMass) {
        console.log(`[BOT] Initializing ${BOT_CONFIG.INITIAL_BOTS} bots...`);
        
        for (let i = 0; i < BOT_CONFIG.INITIAL_BOTS; i++) {
            this.spawnBot(map, generateSpawnpoint, defaultPlayerMass);
        }
        
        console.log(`[BOT] ${this.bots.size} bots spawned successfully`);
    }
    
    /**
     * Spawn a new bot
     */
    spawnBot(map, generateSpawnpoint, defaultPlayerMass) {
        this.botCounter++;
        const botId = `bot_${this.botCounter}_${Date.now()}`;
        const personality = Bot.randomPersonality();
        const botName = this.generateBotName(personality);
        
        // Create bot instance
        const bot = new Bot(botId, botName, personality);
        
        // Create player instance for the bot
        const botPlayer = new mapUtils.playerUtils.Player(botId);
        botPlayer.isBot = true;
        botPlayer.name = botName;
        botPlayer.screenWidth = 1920; // Simulated screen size
        botPlayer.screenHeight = 1080;
        botPlayer.lastHeartbeat = Date.now();
        
        // Ensure unique hue for each bot (Player constructor sets random hue already)
        // But we can override for variety
        botPlayer.hue = Math.round(Math.random() * 360);
        
        // Initialize bot at spawn point
        const spawnPoint = generateSpawnpoint();
        botPlayer.init(spawnPoint, defaultPlayerMass);
        
        // Add to maps
        this.bots.set(botId, bot);
        map.players.pushNew(botPlayer);
        
        return bot;
    }
    
    /**
     * Generate bot name based on personality
     */
    generateBotName(personality) {
        const prefixes = {
            [PERSONALITY.AGGRESSIVE]: ['Hunter', 'Predator', 'Chaser', 'Striker'],
            [PERSONALITY.DEFENSIVE]: ['Guardian', 'Shield', 'Watcher', 'Defender'],
            [PERSONALITY.PASSIVE]: ['Wanderer', 'Drifter', 'Nomad', 'Floater']
        };
        
        const prefix = prefixes[personality][Math.floor(Math.random() * prefixes[personality].length)];
        const number = this.botCounter;
        
        return `${prefix}_${number}`;
    }
    
    /**
     * Update bot AI - called every game tick
     */
    updateBots(map, gameWidth, gameHeight) {
        // Update each bot's target based on AI
        for (let player of map.players.data) {
            if (!player.isBot) continue;
            
            const bot = this.bots.get(player.id);
            if (!bot) continue;
            
            // Calculate AI target
            const target = bot.calculateTarget(player, map.players.data, gameWidth, gameHeight);
            
            // Update player target (simulates mouse movement)
            player.target = target;
            
            // Update heartbeat to keep bot "alive"
            player.lastHeartbeat = Date.now();
        }
    }
    
    /**
     * Handle bot death and respawn
     */
    handleBotDeath(botId) {
        const bot = this.bots.get(botId);
        if (!bot) return;
        
        console.log(`[BOT] ${bot.name} died, scheduling respawn...`);
        
        // Schedule respawn
        setTimeout(() => {
            this.respawnQueue.push({ bot, personality: bot.personality });
        }, BOT_CONFIG.RESPAWN_DELAY);
    }
    
    /**
     * Process respawn queue and maintain minimum bot count
     */
    processRespawns(map, generateSpawnpoint, defaultPlayerMass) {
        const currentBotCount = map.players.data.filter(p => p.isBot).length;
        
        // Respawn queued bots
        while (this.respawnQueue.length > 0) {
            const { personality } = this.respawnQueue.shift();
            this.spawnBot(map, generateSpawnpoint, defaultPlayerMass);
        }
        
        // Maintain minimum bot count
        const botsNeeded = BOT_CONFIG.MIN_BOTS - currentBotCount;
        for (let i = 0; i < botsNeeded; i++) {
            this.spawnBot(map, generateSpawnpoint, defaultPlayerMass);
        }
    }
    
    /**
     * Check if player is a bot
     */
    isBot(playerId) {
        return this.bots.has(playerId);
    }
    
    /**
     * Remove bot from tracking (when it dies permanently)
     */
    removeBot(playerId) {
        this.bots.delete(playerId);
    }
    
    /**
     * Get bot count
     */
    getBotCount() {
        return this.bots.size;
    }
}

module.exports = {
    BotManager,
    BOT_CONFIG
};
