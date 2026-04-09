/**
 * authorize-minter.js
 * 
 * One-time script to authorize the BACKEND_SIGNER_KEY address as a minter
 * on the GameNFT contract (0x46b510E7A089d8dbed37b945dC461936d4BDe944).
 * 
 * Must be run by the contract OWNER (original deployer).
 * 
 * Usage:
 *   OWNER_KEY=<deployer_private_key> node scripts/authorize-minter.js
 * 
 * Or set in .env.local as OWNER_PRIVATE_KEY= and run:
 *   node scripts/authorize-minter.js
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
  });
}

const NFT_ADDRESS   = env.NEXT_PUBLIC_NFT_ADDRESS || '0x46b510E7A089d8dbed37b945dC461936d4BDe944';
const SIGNER_KEY    = env.BACKEND_SIGNER_KEY || '';
const RPC_URL       = env.NEXT_PUBLIC_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc';
const OWNER_KEY     = process.env.OWNER_KEY || env.OWNER_PRIVATE_KEY || '';

const NFT_ABI = [
  'function setAuthorizedMinter(address minter, bool status) external',
  'function authorizedMinters(address minter) external view returns (bool)',
  'function owner() external view returns (address)',
];

async function main() {
  if (!SIGNER_KEY || SIGNER_KEY.length < 64) {
    console.error('❌ BACKEND_SIGNER_KEY not set in .env.local');
    process.exit(1);
  }
  if (!OWNER_KEY || OWNER_KEY.length < 64) {
    console.error('❌ Owner key missing. Set OWNER_KEY env var or OWNER_PRIVATE_KEY in .env.local');
    console.error('   Usage: OWNER_KEY=<deployer_private_key> node scripts/authorize-minter.js');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const ownerWallet = new ethers.Wallet(OWNER_KEY, provider);
  const signerWallet = new ethers.Wallet(SIGNER_KEY);
  const contract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, ownerWallet);

  console.log('📋 GameNFT Contract :', NFT_ADDRESS);
  console.log('👤 Owner (caller)   :', ownerWallet.address);
  console.log('🔑 Signer to auth   :', signerWallet.address);

  // Check current state
  const [contractOwner, isAlreadyAuthorized] = await Promise.all([
    contract.owner(),
    contract.authorizedMinters(signerWallet.address),
  ]);

  console.log('\n📄 Contract owner   :', contractOwner);
  console.log('✅ Already authorized:', isAlreadyAuthorized);

  if (ownerWallet.address.toLowerCase() !== contractOwner.toLowerCase()) {
    console.error('\n❌ The OWNER_KEY does not match the contract owner!');
    console.error('   Contract owner is:', contractOwner);
    console.error('   Your key gives   :', ownerWallet.address);
    process.exit(1);
  }

  if (isAlreadyAuthorized) {
    console.log('\n✅ Signer is already authorized. NFT minting should work!');
    return;
  }

  console.log('\n⏳ Sending setAuthorizedMinter transaction...');
  const tx = await contract.setAuthorizedMinter(signerWallet.address, true);
  console.log('📤 Transaction sent :', tx.hash);
  console.log('⏳ Waiting for confirmation...');
  const receipt = await tx.wait();
  console.log('✅ Confirmed in block', receipt.blockNumber);
  console.log('\n🎉 Backend signer is now authorized! NFT minting will work on game end.');
  console.log('   Restart your dev server for changes to take effect.');
}

main().catch(err => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
