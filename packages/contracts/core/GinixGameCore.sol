// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GinixGameCore
 * @notice Core player identity and session tracking
 * @dev Manages XP, levels, and session history
 */
contract GinixGameCore is Ownable {
    struct Player {
        uint64 xp;
        uint64 sessionsPlayed;
        uint64 joinedAt;
        uint32 level;
    }

    mapping(address => Player) public players;
    mapping(address => mapping(bytes32 => uint64)) public gameScores; // player => gameId => best score

    uint256 public totalPlayers;
    uint256 public totalSessions;

    // XP Multiplier: level threshold => multiplier (basis points, 10000 = 1.0x)
    uint32[] public multiplierThresholds;
    uint32[] public multiplierValues;
    uint32 public defaultMultiplier = 10000; // 1.0x

    event PlayerRegistered(address indexed player, uint64 timestamp);
    event XPAdded(address indexed player, uint64 amount, uint64 newTotal);
    event SessionRecorded(address indexed player, bytes32 indexed gameId, uint64 score, uint64 duration);
    event HighScoreUpdated(address indexed player, bytes32 indexed gameId, uint64 newScore);
    event MultiplierConfigured(uint32[] thresholds, uint32[] values);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new player (auto-called on first interaction)
     * @param player Player address
     */
    function registerPlayer(address player) internal {
        if (players[player].joinedAt == 0) {
            players[player] = Player({
                xp: 0,
                sessionsPlayed: 0,
                joinedAt: uint64(block.timestamp),
                level: 1
            });
            totalPlayers++;
            emit PlayerRegistered(player, uint64(block.timestamp));
        }
    }

    /**
     * @notice Add XP to player (called by owner/backend)
     * @dev Applies level-based multiplier to the base XP amount
     * @param player Player address
     * @param amount Base XP amount (before multiplier)
     */
    function addXP(address player, uint64 amount) external onlyOwner {
        registerPlayer(player);
        uint64 multiplied = applyMultiplier(player, amount);
        players[player].xp += multiplied;
        
        // Simple level calculation: level = floor(xp / 100) + 1
        uint32 newLevel = uint32(players[player].xp / 100) + 1;
        players[player].level = newLevel;

        emit XPAdded(player, multiplied, players[player].xp);
    }

    /**
     * @notice Apply XP multiplier based on player level
     * @param player Player address
     * @param baseAmount Base XP amount
     * @return Multiplied XP amount
     */
    function applyMultiplier(address player, uint64 baseAmount) public view returns (uint64) {
        uint32 level = players[player].level;
        uint32 mult = defaultMultiplier;

        for (uint256 i = 0; i < multiplierThresholds.length; i++) {
            if (level >= multiplierThresholds[i]) {
                mult = multiplierValues[i];
            } else {
                break;
            }
        }

        return uint64((uint256(baseAmount) * uint256(mult)) / 10000);
    }

    /**
     * @notice Configure XP multiplier tiers (owner only)
     * @param thresholds Sorted array of level thresholds
     * @param values Multiplier values in basis points (10000 = 1.0x, 12000 = 1.2x)
     */
    function configureMultipliers(
        uint32[] calldata thresholds,
        uint32[] calldata values
    ) external onlyOwner {
        require(thresholds.length == values.length, "Array length mismatch");
        for (uint256 i = 1; i < thresholds.length; i++) {
            require(thresholds[i] > thresholds[i - 1], "Thresholds must be sorted ascending");
        }
        multiplierThresholds = thresholds;
        multiplierValues = values;
        emit MultiplierConfigured(thresholds, values);
    }

    /**
     * @notice Get the current multiplier for a player (in basis points)
     * @param player Player address
     */
    function getPlayerMultiplier(address player) external view returns (uint32) {
        uint32 level = players[player].level;
        uint32 mult = defaultMultiplier;
        for (uint256 i = 0; i < multiplierThresholds.length; i++) {
            if (level >= multiplierThresholds[i]) {
                mult = multiplierValues[i];
            } else {
                break;
            }
        }
        return mult;
    }

    /**
     * @notice Record a game session (called by owner/backend)
     * @param player Player address
     * @param gameId Game identifier
     * @param score Session score
     * @param duration Session duration in seconds
     */
    function recordSession(
        address player,
        bytes32 gameId,
        uint64 score,
        uint64 duration
    ) external onlyOwner {
        registerPlayer(player);
        players[player].sessionsPlayed++;
        totalSessions++;

        // Update high score if better
        if (score > gameScores[player][gameId]) {
            gameScores[player][gameId] = score;
            emit HighScoreUpdated(player, gameId, score);
        }

        emit SessionRecorded(player, gameId, score, duration);
    }

    /**
     * @notice Get player info
     * @param player Player address
     */
    function getPlayer(address player) external view returns (Player memory) {
        return players[player];
    }

    /**
     * @notice Get player's best score for a game
     * @param player Player address
     * @param gameId Game identifier
     */
    function getHighScore(address player, bytes32 gameId) external view returns (uint64) {
        return gameScores[player][gameId];
    }

    /**
     * @notice Get player's level based on XP
     * @param player Player address
     */
    function getPlayerLevel(address player) external view returns (uint32) {
        return players[player].level;
    }
}
