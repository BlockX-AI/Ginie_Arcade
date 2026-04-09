const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("@nomicfoundation/hardhat-toolbox");

let DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.BACKEND_SIGNER_KEY || "";
if (DEPLOYER_KEY.startsWith("0x")) DEPLOYER_KEY = DEPLOYER_KEY.slice(2);
const isValidKey = DEPLOYER_KEY && DEPLOYER_KEY.length === 64 && !DEPLOYER_KEY.includes("your_");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  paths: {
    sources: ".",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: isValidKey ? [DEPLOYER_KEY] : [],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: isValidKey ? [DEPLOYER_KEY] : [],
    },
  },
};
