// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GinixGameMemory
 * @notice Stores permanent on-chain achievements
 * @dev Only important milestones are stored on-chain to save gas
 */
contract GinixGameMemory is Ownable {
    struct Achievement {
        bytes32 achievementId;
        uint64 unlockedAt;
        string metadata; // optional metadata
    }

    // player => achievementId => unlocked
    mapping(address => mapping(bytes32 => bool)) public hasAchievement;
    
    // player => list of achievements
    mapping(address => Achievement[]) private playerAchievements;

    uint256 public totalAchievements;

    event AchievementUnlocked(
        address indexed player,
        bytes32 indexed achievementId,
        uint64 timestamp,
        string metadata
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Unlock achievement for player
     * @param player Player address
     * @param achievementId Achievement identifier (e.g., keccak256("NEON_BADGE"))
     * @param metadata Optional metadata (e.g., score, game info)
     */
    function unlock(
        address player,
        bytes32 achievementId,
        string calldata metadata
    ) external onlyOwner {
        require(!hasAchievement[player][achievementId], "Achievement already unlocked");

        hasAchievement[player][achievementId] = true;
        playerAchievements[player].push(Achievement({
            achievementId: achievementId,
            unlockedAt: uint64(block.timestamp),
            metadata: metadata
        }));

        totalAchievements++;
        emit AchievementUnlocked(player, achievementId, uint64(block.timestamp), metadata);
    }

    /**
     * @notice Batch unlock multiple achievements
     * @param player Player address
     * @param achievementIds Array of achievement IDs
     * @param metadatas Array of metadata strings
     */
    function batchUnlock(
        address player,
        bytes32[] calldata achievementIds,
        string[] calldata metadatas
    ) external onlyOwner {
        require(achievementIds.length == metadatas.length, "Array length mismatch");

        for (uint256 i = 0; i < achievementIds.length; i++) {
            if (!hasAchievement[player][achievementIds[i]]) {
                hasAchievement[player][achievementIds[i]] = true;
                playerAchievements[player].push(Achievement({
                    achievementId: achievementIds[i],
                    unlockedAt: uint64(block.timestamp),
                    metadata: metadatas[i]
                }));

                totalAchievements++;
                emit AchievementUnlocked(
                    player,
                    achievementIds[i],
                    uint64(block.timestamp),
                    metadatas[i]
                );
            }
        }
    }

    /**
     * @notice Get all achievements for a player
     * @param player Player address
     */
    function getPlayerAchievements(address player) external view returns (Achievement[] memory) {
        return playerAchievements[player];
    }

    /**
     * @notice Get achievement count for player
     * @param player Player address
     */
    function getAchievementCount(address player) external view returns (uint256) {
        return playerAchievements[player].length;
    }

    /**
     * @notice Check if player has specific achievement
     * @param player Player address
     * @param achievementId Achievement to check
     */
    function hasUnlocked(address player, bytes32 achievementId) external view returns (bool) {
        return hasAchievement[player][achievementId];
    }
}
