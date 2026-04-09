// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IGinixCoreLevel {
    function getPlayerLevel(address player) external view returns (uint32);
}

/**
 * @title GinixGameRegistry
 * @notice Registry for approved games in Ginix Arcade
 * @dev Only approved games can grant rewards
 */
contract GinixGameRegistry is Ownable {
    struct GameMeta {
        bool approved;
        string uri; // metadata JSON (name, icon, description, etc)
        uint64 addedAt;
        uint32 minLevel; // minimum player level required (0 = no restriction)
    }

    IGinixCoreLevel public coreContract;

    mapping(bytes32 => GameMeta) public games;
    bytes32[] public gameIds;

    event GameApproved(bytes32 indexed gameId, string uri, uint32 minLevel);
    event GameRevoked(bytes32 indexed gameId);
    event GameURIUpdated(bytes32 indexed gameId, string newUri);
    event GameMinLevelUpdated(bytes32 indexed gameId, uint32 newMinLevel);
    event CoreContractUpdated(address newCoreContract);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Convert game slug to gameId
     * @param slug Game identifier (e.g., "neon-sky-runner")
     */
    function toGameId(string memory slug) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(slug));
    }

    /**
     * @notice Set the GameCore contract address for level checks
     * @param _core Address of the GinixGameCore contract
     */
    function setCoreContract(address _core) external onlyOwner {
        require(_core != address(0), "Invalid core address");
        coreContract = IGinixCoreLevel(_core);
        emit CoreContractUpdated(_core);
    }

    /**
     * @notice Approve a new game
     * @param gameId Unique game identifier
     * @param uri Metadata URI
     */
    function approveGame(bytes32 gameId, string calldata uri) external onlyOwner {
        require(!games[gameId].approved, "Game already approved");
        require(bytes(uri).length > 0, "URI cannot be empty");

        games[gameId] = GameMeta({
            approved: true,
            uri: uri,
            addedAt: uint64(block.timestamp),
            minLevel: 0
        });

        gameIds.push(gameId);
        emit GameApproved(gameId, uri, 0);
    }

    /**
     * @notice Approve a new game with a minimum level requirement
     * @param gameId Unique game identifier
     * @param uri Metadata URI
     * @param minLevel Minimum player level required to play
     */
    function approveGameWithLevel(bytes32 gameId, string calldata uri, uint32 minLevel) external onlyOwner {
        require(!games[gameId].approved, "Game already approved");
        require(bytes(uri).length > 0, "URI cannot be empty");

        games[gameId] = GameMeta({
            approved: true,
            uri: uri,
            addedAt: uint64(block.timestamp),
            minLevel: minLevel
        });

        gameIds.push(gameId);
        emit GameApproved(gameId, uri, minLevel);
    }

    /**
     * @notice Update minimum level for a game
     * @param gameId Game to update
     * @param minLevel New minimum level
     */
    function setGameMinLevel(bytes32 gameId, uint32 minLevel) external onlyOwner {
        require(games[gameId].approved, "Game not approved");
        games[gameId].minLevel = minLevel;
        emit GameMinLevelUpdated(gameId, minLevel);
    }

    /**
     * @notice Check if a player can access a game (approved + meets level requirement)
     * @param gameId Game to check
     * @param player Player address
     */
    function canPlayerAccess(bytes32 gameId, address player) external view returns (bool) {
        if (!games[gameId].approved) return false;
        if (games[gameId].minLevel == 0) return true;
        if (address(coreContract) == address(0)) return true;
        return coreContract.getPlayerLevel(player) >= games[gameId].minLevel;
    }

    /**
     * @notice Revoke game approval
     * @param gameId Game to revoke
     */
    function revokeGame(bytes32 gameId) external onlyOwner {
        require(games[gameId].approved, "Game not approved");
        games[gameId].approved = false;
        emit GameRevoked(gameId);
    }

    /**
     * @notice Update game metadata URI
     * @param gameId Game to update
     * @param newUri New metadata URI
     */
    function updateGameURI(bytes32 gameId, string calldata newUri) external onlyOwner {
        require(games[gameId].approved, "Game not approved");
        require(bytes(newUri).length > 0, "URI cannot be empty");
        games[gameId].uri = newUri;
        emit GameURIUpdated(gameId, newUri);
    }

    /**
     * @notice Check if game is approved
     * @param gameId Game to check
     */
    function isApproved(bytes32 gameId) external view returns (bool) {
        return games[gameId].approved;
    }

    /**
     * @notice Get minimum level for a game
     * @param gameId Game to check
     */
    function getMinLevel(bytes32 gameId) external view returns (uint32) {
        return games[gameId].minLevel;
    }

    /**
     * @notice Get total number of approved games
     */
    function getGameCount() external view returns (uint256) {
        return gameIds.length;
    }

    /**
     * @notice Get game metadata
     * @param gameId Game to query
     */
    function getGameMeta(bytes32 gameId) external view returns (GameMeta memory) {
        return games[gameId];
    }
}
