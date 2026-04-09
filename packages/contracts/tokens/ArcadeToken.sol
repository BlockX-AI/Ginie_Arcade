// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArcadeToken
 * @notice Platform-wide ERC20 token for Web3 Arcade
 * @dev Used for future economy features (shop, tournaments, etc.)
 * 
 * Critical Rules:
 * - Minting controlled ONLY by RewardEngine
 * - NOT minted directly by game contracts
 * - NOT minted by GameCore
 */
contract ArcadeToken is ERC20, Ownable {
    /// @notice Authorized minters (should only be RewardEngine)
    mapping(address => bool) public authorizedMinters;

    /// @notice Maximum supply cap (10 million tokens)
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18;

    /// @notice Events
    event MinterAuthorized(address indexed minter, bool status);
    event TokensMinted(address indexed to, uint256 amount);

    modifier onlyMinter() {
        require(authorizedMinters[msg.sender], "Not authorized minter");
        _;
    }

    constructor() ERC20("Arcade Token", "ARCADE") Ownable(msg.sender) {
        // Owner is authorized by default
        authorizedMinters[msg.sender] = true;
    }

    /**
     * @notice Mint tokens (only authorized minters)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyMinter {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Authorize or revoke minter permission
     * @param minter Address to authorize/revoke
     * @param status Authorization status
     */
    function setAuthorizedMinter(address minter, bool status) external onlyOwner {
        authorizedMinters[minter] = status;
        emit MinterAuthorized(minter, status);
    }

    /**
     * @notice Get remaining mintable supply
     * @return Remaining supply
     */
    function getRemainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
}
