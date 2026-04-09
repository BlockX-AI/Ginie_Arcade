// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title GinixAntiCheatGuard
 * @notice Validates game results using backend signature
 * @dev Only accepts results signed by trusted backend signer
 */
contract GinixAntiCheatGuard is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public trustedSigner;
    mapping(bytes32 => bool) public usedNonces;

    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event NonceUsed(bytes32 indexed nonce, address indexed player, bytes32 indexed gameId);
    event VerificationFailed(bytes32 indexed nonce, address indexed player, string reason);

    constructor(address _trustedSigner) Ownable(msg.sender) {
        require(_trustedSigner != address(0), "Invalid signer address");
        trustedSigner = _trustedSigner;
    }

    /**
     * @notice Update trusted backend signer
     * @param newSigner New signer address
     */
    function setTrustedSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer address");
        address oldSigner = trustedSigner;
        trustedSigner = newSigner;
        emit SignerUpdated(oldSigner, newSigner);
    }

    /**
     * @notice Verify and consume nonce for game result
     * @param nonce Unique session nonce
     * @param player Player address
     * @param gameId Game identifier
     * @param score Session score
     * @param signature Backend signature
     */
    function verifyAndConsume(
        bytes32 nonce,
        address player,
        bytes32 gameId,
        uint64 score,
        bytes calldata signature
    ) external returns (bool) {
        // Check nonce not used
        if (usedNonces[nonce]) {
            emit VerificationFailed(nonce, player, "Nonce already used");
            return false;
        }

        // Recreate message hash
        bytes32 msgHash = keccak256(
            abi.encodePacked(nonce, player, gameId, score, block.chainid)
        );
        
        bytes32 ethSignedHash = msgHash.toEthSignedMessageHash();

        // Recover signer
        address recovered = ethSignedHash.recover(signature);

        // Verify signer
        if (recovered != trustedSigner) {
            emit VerificationFailed(nonce, player, "Invalid signature");
            return false;
        }

        // Mark nonce as used
        usedNonces[nonce] = true;
        emit NonceUsed(nonce, player, gameId);

        return true;
    }

    /**
     * @notice Batch verify multiple results (gas efficient)
     * @param nonces Array of nonces
     * @param players Array of player addresses
     * @param gameIds Array of game IDs
     * @param scores Array of scores
     * @param signatures Array of signatures
     */
    function batchVerifyAndConsume(
        bytes32[] calldata nonces,
        address[] calldata players,
        bytes32[] calldata gameIds,
        uint64[] calldata scores,
        bytes[] calldata signatures
    ) external returns (bool[] memory) {
        require(
            nonces.length == players.length &&
            players.length == gameIds.length &&
            gameIds.length == scores.length &&
            scores.length == signatures.length,
            "Array length mismatch"
        );

        bool[] memory results = new bool[](nonces.length);

        for (uint256 i = 0; i < nonces.length; i++) {
            if (usedNonces[nonces[i]]) {
                results[i] = false;
                continue;
            }

            bytes32 msgHash = keccak256(
                abi.encodePacked(nonces[i], players[i], gameIds[i], scores[i], block.chainid)
            );
            
            bytes32 ethSignedHash = msgHash.toEthSignedMessageHash();
            address recovered = ethSignedHash.recover(signatures[i]);

            if (recovered == trustedSigner) {
                usedNonces[nonces[i]] = true;
                emit NonceUsed(nonces[i], players[i], gameIds[i]);
                results[i] = true;
            } else {
                results[i] = false;
            }
        }

        return results;
    }

    /**
     * @notice Check if nonce has been used
     * @param nonce Nonce to check
     */
    function isNonceUsed(bytes32 nonce) external view returns (bool) {
        return usedNonces[nonce];
    }
}
