const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Read key directly from .env file (bypasses dotenv caching issues)
  const envPath = path.resolve(__dirname, "..", ".env");
  const envContent = fs.readFileSync(envPath, "utf8");
  let privateKey = "";
  for (const line of envContent.split("\n")) {
    if (line.startsWith("DEPLOYER_PRIVATE_KEY=")) {
      privateKey = line.split("=")[1].trim();
      break;
    }
  }

  if (!privateKey || privateKey.length < 64) {
    console.error("ERROR: DEPLOYER_PRIVATE_KEY not found or too short in", envPath);
    console.error("Key length:", privateKey.length);
    process.exit(1);
  }

  console.log("Key loaded from .env, length:", privateKey.length);

  // Create wallet directly from key
  const deployer = new hre.ethers.Wallet(privateKey, hre.ethers.provider);
  console.log("Deploying GameNFT with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "AVAX");

  if (balance === 0n) {
    console.error("ERROR: Account has no AVAX. Get testnet AVAX from https://faucet.avax.network/");
    process.exit(1);
  }

  // Deploy GameNFT
  const GameNFT = await hre.ethers.getContractFactory("GameNFT", deployer);
  const nft = await GameNFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();

  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log("GameNFT deployed to:", nftAddress);
  console.log("\nAdd this to your .env and Vercel:");
  console.log(`NEXT_PUBLIC_NFT_ADDRESS=${nftAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
