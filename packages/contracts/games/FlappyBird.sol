// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FlappyBird
 * @notice Thin validation adapter for Flappy Bird game
 * @dev This contract is ONLY for game-specific validation. Nothing else.
 * 
 * Architecture Philosophy:
 * - This is a THIN adapter
 * - Contains ONLY Flappy Bird-specific validation rules
 * - NO reward logic
 * - NO player storage
 * - NO cooldown enforcement
 * - NO token interaction
 * 
 * If logic could be reused across games, it belongs in core/, not here.
 */
contract FlappyBird {
    /// @notice Maximum possible score (pipes passed)
    /// @dev Based on game mechanics: realistic max before timeout
    uint256 public constant MAX_PIPES = 500;

    /// @notice Minimum score (sanity check)
    uint256 public constant MIN_SCORE = 0;

    /// @notice Game metadata
    string public constant GAME_NAME = "Flappy Bird";
    string public constant GAME_VERSION = "1.0.0";

    /// @notice Events
    event ScoreValidated(uint256 score, bool isValid);

    /**
     * @notice Validate a Flappy Bird score
     * @dev Called by GameCore during result submission
     * @param score The score to validate (number of pipes passed)
     * @return isValid Whether the score passes validation
     */
    function validateScore(uint256 score) external pure returns (bool isValid) {
        // Rule 1: Score must be within reasonable bounds
        if (score < MIN_SCORE || score > MAX_PIPES) {
            return false;
        }

        // Rule 2: Score must be a whole number (should always be true for uint)
        // This is implicit with uint256, but kept for clarity

        // All checks passed
        return true;
    }

    /**
     * @notice Get game metadata
     * @return name Game name
     * @return version Game version
     * @return maxScore Maximum valid score
     */
    function getGameMetadata() 
        external 
        pure 
        returns (
            string memory name,
            string memory version,
            uint256 maxScore
        ) 
    {
        return (GAME_NAME, GAME_VERSION, MAX_PIPES);
    }

    /**
     * @notice Check if a score would be valid (view function)
     * @param score The score to check
     * @return isValid Whether the score is valid
     * @return reason Human-readable reason if invalid
     */
    function checkScore(uint256 score) 
        external 
        pure 
        returns (bool isValid, string memory reason) 
    {
        if (score > MAX_PIPES) {
            return (false, "Score exceeds maximum pipes");
        }

        if (score < MIN_SCORE) {
            return (false, "Score below minimum");
        }

        return (true, "Valid score");
    }

    /**
     * @notice Get maximum score for this game
     * @return Maximum valid score
     */
    function getMaxScore() external pure returns (uint256) {
        return MAX_PIPES;
    }

    /**
     * @notice Get difficulty rating (for future use)
     * @param score The score achieved
     * @return difficulty Difficulty rating (0-100)
     */
    function getDifficultyRating(uint256 score) external pure returns (uint256 difficulty) {
        // Simple difficulty curve based on score
        if (score < 10) return 10;
        if (score < 25) return 25;
        if (score < 50) return 50;
        if (score < 100) return 75;
        if (score < 250) return 90;
        return 100;
    }
}
