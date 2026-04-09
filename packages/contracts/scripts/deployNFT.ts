import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying GameNFT with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy GameNFT
  const GameNFT = await ethers.getContractFactory("GameNFT");
  const nft = await GameNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("GameNFT deployed to:", nftAddress);

  // The deployer is already an authorized minter by default (set in constructor)
  // If you want to allow ALL users to mint (for the gasless flow), 
  // you can call setAuthorizedMinter for specific addresses or modify the contract

  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log("GameNFT Address:", nftAddress);
  console.log("\nAdd this to your .env and Vercel:");
  console.log(`NEXT_PUBLIC_NFT_ADDRESS=${nftAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
