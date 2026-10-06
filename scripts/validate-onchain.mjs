#!/usr/bin/env node
/**
 * On-Chain Validation Test Script for Ginix Arcade
 * 
 * Validates:
 * 1. NFT contract connectivity & state
 * 2. Badge image URLs accessibility
 * 3. Token metadata integrity
 * 4. API endpoint responses
 * 5. Game registry contract state
 * 
 * Usage: node scripts/validate-onchain.mjs [wallet_address]
 * If no wallet is provided, runs read-only contract checks only.
 */

import { createPublicClient, http, isAddress, keccak256, toBytes } from 'viem';
import { avalancheFuji } from 'viem/chains';

// ─── Config ──────────────────────────────────────────────────────────────────
const RPC_URL = 'https://api.avax-test.network/ext/bc/C/rpc';
const APP_URL = process.env.APP_URL || 'https://giniearcade2.vercel.app';

// Contract addresses (read from env or fallback)
const NFT_ADDRESS = process.env.NEXT_PUBLIC_NFT_ADDRESS || '';
const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '';
const CORE_ADDRESS = process.env.NEXT_PUBLIC_CORE_ADDRESS || '';

const NFT_ABI = [
  { inputs: [{ name: 'owner', type: 'address' }], name: 'getOwnedTokens', outputs: [{ name: '', type: 'uint256[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'tokenId', type: 'uint256' }], name: 'tokenURI', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'totalMinted', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'tokenId', type: 'uint256' }], name: 'getNFTMetadata', outputs: [{ name: '', type: 'tuple', components: [{ name: 'achievementType', type: 'uint256' }, { name: 'gameId', type: 'uint256' }, { name: 'value', type: 'uint256' }, { name: 'mintedAt', type: 'uint256' }] }], stateMutability: 'view', type: 'function' },
];

const REGISTRY_ABI = [
  { inputs: [{ name: 'gameId', type: 'bytes32' }], name: 'isApproved', outputs: [{ name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
];

const CORE_ABI = [
  { inputs: [{ name: 'player', type: 'address' }], name: 'getPlayer', outputs: [{ name: '', type: 'tuple', components: [{ name: 'xp', type: 'uint64' }, { name: 'sessionsPlayed', type: 'uint64' }, { name: 'joinedAt', type: 'uint64' }, { name: 'level', type: 'uint32' }] }], stateMutability: 'view', type: 'function' },
  { inputs: [{ name: 'player', type: 'address' }, { name: 'gameId', type: 'bytes32' }], name: 'getHighScore', outputs: [{ name: '', type: 'uint64' }], stateMutability: 'view', type: 'function' },
];

// ─── Badge definitions ───────────────────────────────────────────────────────
const BADGE_IDS = [
  'first-game', 'five-games', 'ten-games', 'twenty-five-games', 'fifty-games',
  'xp-100', 'xp-500', 'xp-1000',
  'flappy-10', 'flappy-50',
  'neon-1000', 'neon-10000',
  'tilenova-500', 'tilenova-5000',
  'sudoku-500', 'sudoku-1500',
  'all-rounder',
];

const GAME_IDS = ['neon-sky-runner', 'tilenova', 'flappy', 'sudoku'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
let passCount = 0;
let failCount = 0;
let warnCount = 0;

function pass(msg) { passCount++; console.log(`  ✅ PASS: ${msg}`); }
function fail(msg) { failCount++; console.log(`  ❌ FAIL: ${msg}`); }
function warn(msg) { warnCount++; console.log(`  ⚠️  WARN: ${msg}`); }
function info(msg) { console.log(`  ℹ️  ${msg}`); }
function header(msg) { console.log(`\n${'═'.repeat(60)}\n  ${msg}\n${'═'.repeat(60)}`); }

function parseDataUri(uri) {
  const prefix = 'data:application/json;base64,';
  if (!uri.startsWith(prefix)) return null;
  try {
    return JSON.parse(Buffer.from(uri.slice(prefix.length), 'base64').toString('utf-8'));
  } catch { return null; }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

async function testRpcConnectivity(client) {
  header('1. RPC Connectivity');
  try {
    const blockNumber = await client.getBlockNumber();
    pass(`Connected to Avalanche Fuji — block #${blockNumber}`);
  } catch (e) {
    fail(`Cannot connect to RPC: ${e.message}`);
  }
}

async function testNftContract(client) {
  header('2. NFT Contract');
  if (!NFT_ADDRESS || !isAddress(NFT_ADDRESS)) {
    warn('NEXT_PUBLIC_NFT_ADDRESS not set or invalid — skipping NFT tests');
    return;
  }
  info(`Contract: ${NFT_ADDRESS}`);

  try {
    const totalMinted = await client.readContract({ address: NFT_ADDRESS, abi: NFT_ABI, functionName: 'totalMinted' });
    pass(`totalMinted() = ${totalMinted}`);
  } catch (e) {
    fail(`totalMinted() call failed: ${e.message}`);
  }
}

async function testWalletNfts(client, wallet) {
  header('3. Wallet NFTs');
  if (!NFT_ADDRESS || !isAddress(NFT_ADDRESS)) {
    warn('NFT contract not configured — skipping');
    return;
  }
  if (!wallet) {
    info('No wallet provided — skipping wallet NFT checks');
    return;
  }

  try {
    const tokenIds = await client.readContract({ address: NFT_ADDRESS, abi: NFT_ABI, functionName: 'getOwnedTokens', args: [wallet] });
    pass(`Wallet ${wallet.slice(0, 8)}... owns ${tokenIds.length} NFT(s)`);

    for (const tokenId of tokenIds.slice(0, 5)) {
      try {
        const tokenUri = await client.readContract({ address: NFT_ADDRESS, abi: NFT_ABI, functionName: 'tokenURI', args: [tokenId] });
        const metadata = parseDataUri(tokenUri);

        if (metadata) {
          if (metadata.name) pass(`Token #${tokenId}: name="${metadata.name}"`);
          else fail(`Token #${tokenId}: missing name in metadata`);

          if (metadata.image) {
            // Check if image URL is accessible
            try {
              const imgUrl = metadata.image.startsWith('ipfs://') 
                ? `https://ipfs.io/ipfs/${metadata.image.slice(7)}` 
                : metadata.image;
              const res = await fetch(imgUrl, { method: 'HEAD' });
              if (res.ok) pass(`Token #${tokenId}: image accessible (${res.status})`);
              else fail(`Token #${tokenId}: image returned ${res.status} — ${imgUrl}`);
            } catch (e) {
              fail(`Token #${tokenId}: image fetch failed — ${e.message}`);
            }
          } else {
            warn(`Token #${tokenId}: no image in metadata`);
          }
        } else if (tokenUri.startsWith('ipfs://')) {
          info(`Token #${tokenId}: IPFS URI — ${tokenUri.slice(0, 40)}...`);
        } else {
          warn(`Token #${tokenId}: unknown URI format`);
        }
      } catch (e) {
        fail(`Token #${tokenId}: tokenURI() failed — ${e.message}`);
      }
    }

    if (tokenIds.length > 5) info(`... and ${tokenIds.length - 5} more NFTs (showing first 5)`);
  } catch (e) {
    fail(`getOwnedTokens() failed: ${e.message}`);
  }
}

async function testGameRegistry(client) {
  header('4. Game Registry');
  if (!REGISTRY_ADDRESS || !isAddress(REGISTRY_ADDRESS)) {
    warn('NEXT_PUBLIC_REGISTRY_ADDRESS not set — skipping registry tests');
    return;
  }
  info(`Registry: ${REGISTRY_ADDRESS}`);

  for (const gameId of GAME_IDS) {
    try {
      const gameHash = keccak256(toBytes(gameId));
      const approved = await client.readContract({ address: REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'isApproved', args: [gameHash] });
      if (approved) pass(`Game "${gameId}" is approved on-chain`);
      else warn(`Game "${gameId}" is NOT approved on-chain`);
    } catch (e) {
      fail(`Registry check for "${gameId}" failed: ${e.message}`);
    }
  }
}

async function testPlayerOnChain(client, wallet) {
  header('5. On-Chain Player State');
  if (!CORE_ADDRESS || !isAddress(CORE_ADDRESS)) {
    warn('NEXT_PUBLIC_CORE_ADDRESS not set — skipping player state tests');
    return;
  }
  if (!wallet) {
    info('No wallet provided — skipping');
    return;
  }

  try {
    const player = await client.readContract({ address: CORE_ADDRESS, abi: CORE_ABI, functionName: 'getPlayer', args: [wallet] });
    pass(`On-chain player: XP=${player.xp}, sessions=${player.sessionsPlayed}, level=${player.level}`);
  } catch (e) {
    fail(`getPlayer() failed: ${e.message}`);
  }

  for (const gameId of GAME_IDS) {
    try {
      const gameHash = keccak256(toBytes(gameId));
      const highScore = await client.readContract({ address: CORE_ADDRESS, abi: CORE_ABI, functionName: 'getHighScore', args: [wallet, gameHash] });
      info(`High score "${gameId}": ${highScore}`);
    } catch (e) {
      // May revert if player hasn't played - that's ok
      info(`No high score for "${gameId}" (may not have played)`);
    }
  }
}

async function testBadgeImages() {
  header('6. Badge Image Accessibility');
  let accessible = 0;
  let inaccessible = 0;

  for (const badgeId of BADGE_IDS) {
    const url = `${APP_URL}/badges/${badgeId}.png`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        accessible++;
      } else {
        fail(`Badge "${badgeId}": ${res.status} at ${url}`);
        inaccessible++;
      }
    } catch (e) {
      fail(`Badge "${badgeId}": fetch failed — ${e.message}`);
      inaccessible++;
    }
  }

  if (inaccessible === 0) pass(`All ${BADGE_IDS.length} badge images accessible`);
  else fail(`${inaccessible}/${BADGE_IDS.length} badge images not accessible`);
}

async function testApiEndpoints(wallet) {
  header('7. API Endpoints');

  // Test playerStats API
  if (wallet) {
    try {
      const res = await fetch(`${APP_URL}/api/playerStats?wallet=${wallet}`);
      const data = await res.json();
      if (res.ok && typeof data.xp === 'number') {
        pass(`/api/playerStats — OK (XP: ${data.xp}, badges: ${data.badges?.length || 0})`);
      } else {
        fail(`/api/playerStats — ${res.status}: ${JSON.stringify(data).slice(0, 100)}`);
      }
    } catch (e) {
      fail(`/api/playerStats — ${e.message}`);
    }

    // Test NFTs API
    try {
      const res = await fetch(`${APP_URL}/api/nfts?wallet=${wallet}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.nfts)) {
        pass(`/api/nfts — OK (${data.nfts.length} NFTs found)`);
      } else {
        fail(`/api/nfts — ${res.status}: ${JSON.stringify(data).slice(0, 100)}`);
      }
    } catch (e) {
      fail(`/api/nfts — ${e.message}`);
    }
  } else {
    // Test with bad wallet to verify error handling
    try {
      const res = await fetch(`${APP_URL}/api/playerStats?wallet=invalid`);
      if (res.status === 400) pass(`/api/playerStats — properly rejects invalid wallet (400)`);
      else warn(`/api/playerStats — expected 400 for invalid wallet, got ${res.status}`);
    } catch (e) {
      fail(`/api/playerStats — ${e.message}`);
    }
  }

  // Test game pages
  for (const gameId of GAME_IDS) {
    try {
      const res = await fetch(`${APP_URL}/games/${gameId === 'sudoku' ? 'sudoku' : gameId}/index.html`, { method: 'HEAD' });
      if (res.ok) pass(`Game "${gameId}" HTML accessible`);
      else fail(`Game "${gameId}" HTML returned ${res.status}`);
    } catch (e) {
      fail(`Game "${gameId}" HTML fetch failed: ${e.message}`);
    }
  }
}

async function testFlappyAssets() {
  header('8. Flappy Bird Assets (LFS Fix Verification)');
  const assets = ['bird-red-sprite.png', 'bird-blue-sprite.png', 'bird-yellow-sprite.png', 'ground-sprite.png', 'background-day.png', 'pipe-green-top.png'];

  let allOk = true;
  for (const asset of assets) {
    try {
      const res = await fetch(`${APP_URL}/games/flappy/assets/${asset}`, { method: 'HEAD' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('image')) {
        // pass silently for brevity
      } else if (res.ok && !contentType.includes('image')) {
        fail(`${asset}: served as "${contentType}" (should be image/png — likely still LFS pointer)`);
        allOk = false;
      } else {
        fail(`${asset}: ${res.status}`);
        allOk = false;
      }
    } catch (e) {
      fail(`${asset}: ${e.message}`);
      allOk = false;
    }
  }
  if (allOk) pass(`All ${assets.length} Flappy Bird assets served as images`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const wallet = process.argv[2] || null;

  console.log('\n🎮 Ginix Arcade — On-Chain Validation Script');
  console.log(`   App URL:  ${APP_URL}`);
  console.log(`   RPC:      ${RPC_URL}`);
  console.log(`   NFT:      ${NFT_ADDRESS || '(not set)'}`);
  console.log(`   Registry: ${REGISTRY_ADDRESS || '(not set)'}`);
  console.log(`   Core:     ${CORE_ADDRESS || '(not set)'}`);
  console.log(`   Wallet:   ${wallet || '(none — read-only mode)'}`);

  if (wallet && !isAddress(wallet)) {
    console.error('\n❌ Invalid wallet address format. Use: node scripts/validate-onchain.mjs 0x...');
    process.exit(1);
  }

  const client = createPublicClient({ chain: avalancheFuji, transport: http(RPC_URL) });

  await testRpcConnectivity(client);
  await testNftContract(client);
  await testWalletNfts(client, wallet);
  await testGameRegistry(client);
  await testPlayerOnChain(client, wallet);
  await testBadgeImages();
  await testApiEndpoints(wallet);
  await testFlappyAssets();

  // ─── Summary ─────────────────────────────────────────────────────────────
  header('SUMMARY');
  console.log(`  ✅ Passed:   ${passCount}`);
  console.log(`  ❌ Failed:   ${failCount}`);
  console.log(`  ⚠️  Warnings: ${warnCount}`);
  console.log('');

  if (failCount > 0) {
    console.log('  ❌ Some tests FAILED — review output above');
    process.exit(1);
  } else {
    console.log('  🎉 All tests PASSED!');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
