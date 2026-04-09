// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameNFT
 * @notice Achievement and badge NFTs for Web3 Arcade
 * @dev Used for:
 * - Achievement badges
 * - Milestone rewards
 * - Game passes (future)
 * 
 * Critical Rules:
 * - Minted ONLY via RewardEngine
 * - NOT minted by game contracts
 * - NOT minted by GameCore
 */
contract GameNFT is ERC721, ERC721URIStorage, Ownable {
    /// @notice Token counter
    uint256 private _tokenIdCounter;

    /// @notice Authorized minters (should only be RewardEngine)
    mapping(address => bool) public authorizedMinters;

    /// @notice NFT metadata
    struct NFTMetadata {
        uint256 achievementType; // 1=milestone, 2=highscore, 3=special
        uint256 gameId;
        uint256 value; // score or milestone number
        uint256 mintedAt;
    }

    /// @notice Token metadata mapping
    mapping(uint256 => NFTMetadata) public nftMetadata;

    /// @notice Events
    event MinterAuthorized(address indexed minter, bool status);
    event NFTMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 achievementType,
        uint256 gameId,
        uint256 value
    );

    modifier onlyMinter() {
        require(authorizedMinters[msg.sender], "Not authorized minter");
        _;
    }

    constructor() ERC721("Web3 Arcade Achievement", "W3AA") Ownable(msg.sender) {
        // Owner is authorized by default
        authorizedMinters[msg.sender] = true;
    }

    /**
     * @notice Mint an achievement NFT
     * @param to Recipient address
     * @param achievementType Type of achievement
     * @param gameId Game identifier
     * @param value Achievement value (score or milestone)
     * @param tokenURI Metadata URI
     * @return tokenId The minted token ID
     */
    function mintAchievement(
        address to,
        uint256 achievementType,
        uint256 gameId,
        uint256 value,
        string memory tokenURI
    ) external onlyMinter returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        nftMetadata[tokenId] = NFTMetadata({
            achievementType: achievementType,
            gameId: gameId,
            value: value,
            mintedAt: block.timestamp
        });
        
        emit NFTMinted(to, tokenId, achievementType, gameId, value);
        
        return tokenId;
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
     * @notice Get NFT metadata
     * @param tokenId Token identifier
     * @return NFT metadata
     */
    function getNFTMetadata(uint256 tokenId) external view returns (NFTMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return nftMetadata[tokenId];
    }

    /**
     * @notice Get total minted count
     * @return Total minted
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Get all NFTs owned by an address
     * @param owner Owner address
     * @return Array of token IDs
     */
    function getOwnedTokens(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter && index < balance; i++) {
            if (_ownerOf(i) == owner) {
                tokens[index] = i;
                index++;
            }
        }
        
        return tokens;
    }

    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
