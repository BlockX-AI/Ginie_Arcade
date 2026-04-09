// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IGinixRegistry {
    function isApproved(bytes32 gameId) external view returns (bool);
}

interface IGinixGuard {
    function verifyAndConsume(
        bytes32 nonce,
        address player,
        bytes32 gameId,
        uint64 score,
        bytes calldata signature
    ) external returns (bool);
}

interface IGinixCore {
    function addXP(address player, uint64 amount) external;
    function recordSession(address player, bytes32 gameId, uint64 score, uint64 duration) external;
    function configureMultipliers(uint32[] calldata thresholds, uint32[] calldata values) external;
}

interface IGinixMemory {
    function unlock(address player, bytes32 achievementId, string calldata metadata) external;
}

/**
 * @title GinixRewardEngine
 * @notice Orchestrates reward distribution for game achievements
 * @dev Validates through AntiCheatGuard, then grants rewards
 */
contract GinixRewardEngine is Ownable {
    IGinixRegistry public registry;
    IGinixGuard public guard;
    IGinixCore public core;
    IGinixMemory public gameMemory;

    struct RewardConfig {
        uint64 xpAmount;
        bool unlockAchievement;
        bool enabled;
    }

    // rewardId => config
    mapping(bytes32 => RewardConfig) public rewards;

    event RewardGranted(
        address indexed player,
        bytes32 indexed rewardId,
        bytes32 indexed gameId,
        uint64 score,
        uint64 xpAwarded
    );
    event RewardConfigured(bytes32 indexed rewardId, uint64 xpAmount, bool unlockAchievement);
    event ContractsUpdated(address registry, address guard, address core, address gameMemory);

    constructor(
        address _registry,
        address _guard,
        address _core,
        address _memory
    ) Ownable(msg.sender) {
        require(_registry != address(0), "Invalid registry");
        require(_guard != address(0), "Invalid guard");
        require(_core != address(0), "Invalid core");
        require(_memory != address(0), "Invalid memory");

        registry = IGinixRegistry(_registry);
        guard = IGinixGuard(_guard);
        core = IGinixCore(_core);
        gameMemory = IGinixMemory(_memory);
    }

    /**
     * @notice Configure a reward
     * @param rewardId Reward identifier
     * @param xpAmount XP to award
     * @param unlockAchievement Whether to unlock achievement
     */
    function configureReward(
        bytes32 rewardId,
        uint64 xpAmount,
        bool unlockAchievement
    ) external onlyOwner {
        rewards[rewardId] = RewardConfig({
            xpAmount: xpAmount,
            unlockAchievement: unlockAchievement,
            enabled: true
        });
        emit RewardConfigured(rewardId, xpAmount, unlockAchievement);
    }

    /**
     * @notice Grant reward to player
     * @param nonce Session nonce
     * @param player Player address
     * @param gameId Game identifier
     * @param score Session score
     * @param duration Session duration
     * @param rewardId Reward to grant
     * @param backendSig Backend signature
     */
    function grantReward(
        bytes32 nonce,
        address player,
        bytes32 gameId,
        uint64 score,
        uint64 duration,
        bytes32 rewardId,
        bytes calldata backendSig
    ) external {
        // Validate game is approved
        require(registry.isApproved(gameId), "Game not approved");

        // Validate reward is configured
        RewardConfig memory reward = rewards[rewardId];
        require(reward.enabled, "Reward not enabled");

        // Verify signature and consume nonce
        require(
            guard.verifyAndConsume(nonce, player, gameId, score, backendSig),
            "Guard verification failed"
        );

        // Record session
        core.recordSession(player, gameId, score, duration);

        // Award XP
        if (reward.xpAmount > 0) {
            core.addXP(player, reward.xpAmount);
        }

        // Unlock achievement
        if (reward.unlockAchievement) {
            string memory metadata = string(
                abi.encodePacked(
                    "Game: ",
                    gameId,
                    ", Score: ",
                    uint2str(score)
                )
            );
            gameMemory.unlock(player, rewardId, metadata);
        }

        emit RewardGranted(player, rewardId, gameId, score, reward.xpAmount);
    }

    /**
     * @notice Update contract addresses (in case of upgrades)
     * @param _registry New registry address
     * @param _guard New guard address
     * @param _core New core address
     * @param _memory New memory address
     */
    function updateContracts(
        address _registry,
        address _guard,
        address _core,
        address _memory
    ) external onlyOwner {
        require(_registry != address(0), "Invalid registry");
        require(_guard != address(0), "Invalid guard");
        require(_core != address(0), "Invalid core");
        require(_memory != address(0), "Invalid memory");

        registry = IGinixRegistry(_registry);
        guard = IGinixGuard(_guard);
        core = IGinixCore(_core);
        gameMemory = IGinixMemory(_memory);

        emit ContractsUpdated(_registry, _guard, _core, _memory);
    }

    /**
     * @notice Disable a reward
     * @param rewardId Reward to disable
     */
    function disableReward(bytes32 rewardId) external onlyOwner {
        rewards[rewardId].enabled = false;
    }

    /**
     * @notice Proxy to configure XP multiplier tiers on GameCore
     * @dev Required because RewardEngine is the owner of GameCore,
     *      so only RewardEngine can call GameCore.configureMultipliers()
     * @param thresholds Sorted array of level thresholds
     * @param values Multiplier values in basis points (10000 = 1.0x)
     */
    function configureMultipliers(
        uint32[] calldata thresholds,
        uint32[] calldata values
    ) external onlyOwner {
        core.configureMultipliers(thresholds, values);
    }

    /**
     * @notice Helper to convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
