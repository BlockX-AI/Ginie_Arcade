const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Read key directly from .env file
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
    console.error("ERROR: DEPLOYER_PRIVATE_KEY not found in", envPath);
    process.exit(1);
  }

  const deployer = new hre.ethers.Wallet(privateKey, hre.ethers.provider);
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "AVAX\n");

  if (balance === 0n) {
    console.error("ERROR: No AVAX. Get testnet AVAX from https://faucet.avax.network/");
    process.exit(1);
  }

  // --- Deploy FlappyBird ---
  console.log("Deploying FlappyBird...");
  const FlappyBird = await hre.ethers.getContractFactory("FlappyBird", deployer);
  const flappy = await FlappyBird.deploy();
  await flappy.waitForDeployment();
  const flappyAddress = await flappy.getAddress();
  console.log("FlappyBird deployed to:", flappyAddress);

  // --- Deploy ArcadeToken ---
  console.log("\nDeploying ArcadeToken...");
  const ArcadeToken = await hre.ethers.getContractFactory("ArcadeToken", deployer);
  const token = await ArcadeToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("ArcadeToken deployed to:", tokenAddress);

  // --- Summary ---
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("FlappyBird:   ", flappyAddress);
  console.log("ArcadeToken:  ", tokenAddress);
  console.log("\nAdd to .env:");
  console.log(`NEXT_PUBLIC_FLAPPY_ADDRESS=${flappyAddress}`);
  console.log(`NEXT_PUBLIC_TOKEN_ADDRESS=${tokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
