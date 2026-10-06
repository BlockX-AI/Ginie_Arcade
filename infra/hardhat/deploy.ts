import { ethers } from "hardhat";

async function main() {
  console.log("\n Deploying Ginix Arcade Contracts to Avalanche...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX\n");

  // Backend signer address (replace with your actual backend signer)
  const backendSigner = process.env.BACKEND_SIGNER_ADDRESS || deployer.address;
  console.log("Backend signer:", backendSigner, "\n");

  // 1) Deploy GameRegistry
  console.log("Deploying GinixGameRegistry...");
  const Registry = await ethers.getContractFactory("GinixGameRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("GinixGameRegistry deployed to:", registryAddress, "\n");

  // 2) Deploy GameCore
  console.log("Deploying GinixGameCore...");
  const Core = await ethers.getContractFactory("GinixGameCore");
  const core = await Core.deploy();
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("GinixGameCore deployed to:", coreAddress, "\n");

  // 3) Deploy GameMemory
  console.log("Deploying GinixGameMemory...");
  const Memory = await ethers.getContractFactory("GinixGameMemory");
  const memory = await Memory.deploy();
  await memory.waitForDeployment();
  const memoryAddress = await memory.getAddress();
  console.log("GinixGameMemory deployed to:", memoryAddress, "\n");

  // 4) Deploy AntiCheatGuard
  console.log("Deploying GinixAntiCheatGuard...");
  const Guard = await ethers.getContractFactory("GinixAntiCheatGuard");
  const guard = await Guard.deploy(backendSigner);
  await guard.waitForDeployment();
  const guardAddress = await guard.getAddress();
  console.log("GinixAntiCheatGuard deployed to:", guardAddress, "\n");

  // 5) Deploy RewardEngine
  console.log("Deploying GinixRewardEngine...");
  const Reward = await ethers.getContractFactory("GinixRewardEngine");
  const reward = await Reward.deploy(
    registryAddress,
    guardAddress,
    coreAddress,
    memoryAddress
  );
  await reward.waitForDeployment();
  const rewardAddress = await reward.getAddress();
  console.log("GinixRewardEngine deployed to:", rewardAddress, "\n");

  // 6) Deploy GameNFT
  console.log("Deploying GameNFT...");
  const NFT = await ethers.getContractFactory("GameNFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("GameNFT deployed to:", nftAddress, "\n");

  // 7) Deploy ArcadeToken
  console.log("Deploying ArcadeToken...");
  const Token = await ethers.getContractFactory("ArcadeToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("ArcadeToken deployed to:", tokenAddress, "\n");

  // Configure initial games
  console.log("Configuring initial games...\n");

  // Approve Neon Sky Runner
  const neonGameId = ethers.keccak256(ethers.toUtf8Bytes("neon-sky-runner"));
  const neonUri = JSON.stringify({
    name: "Neon Sky Runner",
    description: "Endless runner with AAA graphics",
    category: "Arcade",
    icon: "/games/neon-sky-runner/icon.png"
  });

  const tx1 = await registry.approveGame(neonGameId, neonUri);
  await tx1.wait();
  console.log("Approved: Neon Sky Runner");

  // Approve TileNova
  const tilenovaGameId = ethers.keccak256(ethers.toUtf8Bytes("tilenova"));
  const tilenovaUri = JSON.stringify({
    name: "TileNova: Circuit Surge",
    description: "Premium match-3 puzzle with neon aesthetics",
    category: "Puzzle",
    icon: "/games/tilenova/icon.png"
  });

  const tx2 = await registry.approveGame(tilenovaGameId, tilenovaUri);
  await tx2.wait();
  console.log("Approved: TileNova: Circuit Surge");

  // Approve Flappy Bird
  const flappyGameId = ethers.keccak256(ethers.toUtf8Bytes("flappy"));
  const flappyUri = JSON.stringify({
    name: "Flappy Bird",
    description: "Navigate through pipes in this classic arcade game",
    category: "Arcade",
    icon: "/games/flappy/icon.png"
  });

  const tx2b = await registry.approveGame(flappyGameId, flappyUri);
  await tx2b.wait();
  console.log("Approved: Flappy Bird");

  // Approve Sudoku
  const sudokuGameId = ethers.keccak256(ethers.toUtf8Bytes("sudoku"));
  const sudokuUri = JSON.stringify({
    name: "Sudoku: Roast Mode",
    description: "Comedy-driven Sudoku with hilarious roast characters",
    category: "Puzzle",
    icon: "/games/sudoku/icon.png"
  });

  const tx2c = await registry.approveGame(sudokuGameId, sudokuUri);
  await tx2c.wait();
  console.log("Approved: Sudoku: Roast Mode\n");

  // Configure rewards
  console.log("Configuring rewards...\n");

  // Neon Sky Runner badges
  const neonBadge = ethers.keccak256(ethers.toUtf8Bytes("NEON_BADGE"));
  const tx3 = await reward.configureReward(neonBadge, 100, true);
  await tx3.wait();
  console.log("Configured reward: NEON_BADGE (100 XP + Achievement)");

  const skyMaster = ethers.keccak256(ethers.toUtf8Bytes("SKY_MASTER"));
  const tx4 = await reward.configureReward(skyMaster, 250, true);
  await tx4.wait();
  console.log("Configured reward: SKY_MASTER (250 XP + Achievement)");

  // TileNova trophies
  const circuitTrophy = ethers.keccak256(ethers.toUtf8Bytes("CIRCUIT_TROPHY"));
  const tx5 = await reward.configureReward(circuitTrophy, 150, true);
  await tx5.wait();
  console.log("Configured reward: CIRCUIT_TROPHY (150 XP + Achievement)");

  const quantumMaster = ethers.keccak256(ethers.toUtf8Bytes("QUANTUM_MASTER"));
  const tx6 = await reward.configureReward(quantumMaster, 300, true);
  await tx6.wait();
  console.log("Configured reward: QUANTUM_MASTER (300 XP + Achievement)");

  // Flappy Bird rewards
  const flappyRookie = ethers.keccak256(ethers.toUtf8Bytes("FLAPPY_ROOKIE"));
  const tx6b = await reward.configureReward(flappyRookie, 50, true);
  await tx6b.wait();
  console.log("Configured reward: FLAPPY_ROOKIE (50 XP + Achievement)");

  const pipeMaster = ethers.keccak256(ethers.toUtf8Bytes("PIPE_MASTER"));
  const tx6c = await reward.configureReward(pipeMaster, 200, true);
  await tx6c.wait();
  console.log("Configured reward: PIPE_MASTER (200 XP + Achievement)\n");

  // Grant RewardEngine permission to call Core and Memory
  console.log("Granting permissions...\n");

  const tx7 = await core.transferOwnership(rewardAddress);
  await tx7.wait();
  console.log("Core ownership transferred to RewardEngine");

  const tx8 = await memory.transferOwnership(rewardAddress);
  await tx8.wait();
  console.log("Memory ownership transferred to RewardEngine\n");

  // Authorize backend signer as NFT minter
  const tx9 = await nft.setAuthorizedMinter(backendSigner, true);
  await tx9.wait();
  console.log("Backend signer authorized as NFT minter\n");

  // Summary
  console.log("=".repeat(60));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:\n");
  console.log("Registry:    ", registryAddress);
  console.log("Core:        ", coreAddress);
  console.log("Memory:      ", memoryAddress);
  console.log("Guard:       ", guardAddress);
  console.log("Reward:      ", rewardAddress);
  console.log("GameNFT:     ", nftAddress);
  console.log("ArcadeToken: ", tokenAddress);
  console.log("\n" + "=".repeat(60));
  console.log("\nSave these addresses to your .env file!\n");

  // Generate .env output
  console.log("# Add to your .env file:");
  console.log(`NEXT_PUBLIC_REGISTRY_ADDRESS=${registryAddress}`);
  console.log(`NEXT_PUBLIC_CORE_ADDRESS=${coreAddress}`);
  console.log(`NEXT_PUBLIC_MEMORY_ADDRESS=${memoryAddress}`);
  console.log(`NEXT_PUBLIC_GUARD_ADDRESS=${guardAddress}`);
  console.log(`NEXT_PUBLIC_REWARD_ADDRESS=${rewardAddress}`);
  console.log(`NEXT_PUBLIC_NFT_ADDRESS=${nftAddress}`);
  console.log(`NEXT_PUBLIC_ARCADE_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=43113`);
  console.log(`NEXT_PUBLIC_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc\n`);

  // Save to file
  const fs = require('fs');
  const timestamp = Date.now();
  const addresses = {
    network: "fuji",
    chainId: "43113",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      core: {
        GameRegistry: registryAddress,
        GameCore: coreAddress,
        GameMemory: memoryAddress,
        AntiCheatGuard: guardAddress,
        RewardEngine: rewardAddress,
      },
      tokens: {
        ArcadeToken: tokenAddress,
        GameNFT: nftAddress,
      },
      games: {},
    },
  };

  fs.writeFileSync(
    `../deployments/fuji-${timestamp}.json`,
    JSON.stringify(addresses, null, 2)
  );
  fs.writeFileSync(
    '../deployments/fuji-latest.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("Deployment info saved to infra/deployments/\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
