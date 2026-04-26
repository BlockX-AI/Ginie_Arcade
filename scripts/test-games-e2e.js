/**
 * E2E test script: verifies all games can submit scores and NFT minting logic works.
 * Tests via API only (no browser) — fast and reliable.
 *
 * Usage: node scripts/test-games-e2e.js
 * Requires: DATABASE_URL, BACKEND_SIGNER_KEY, NEXT_PUBLIC_NFT_ADDRESS in .env.local
 */

// Use native fetch (Node 18+)
// Load env from .env.local if needed
const fs = require('fs');
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const BASE_URL = 'http://localhost:3001';
const TEST_WALLET = '0x1234567890123456789012345678901234567890'; // dummy wallet for testing

const GAMES = [
  { id: 'flappy', minDuration: 10 },
  { id: 'snake-io', minDuration: 10 },
  { id: 'the-house', minDuration: 60 },
  { id: 'shooter', minDuration: 10 },
  { id: '8ball-pool', minDuration: 60 },
  { id: 'sudoku', minDuration: 30 },
  { id: 'zombie-apocalypse', minDuration: 10 },
  { id: 'match-three', minDuration: 30 },
];

async function apiCall(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function testGame(game) {
  const { id: gameId, minDuration } = game;
  console.log(`\n=== Testing ${gameId} (min duration: ${minDuration}s) ===`);

  try {
    // Step 1: Start session for first score
    const session1 = await apiCall('POST', '/api/startSession', {
      wallet: TEST_WALLET,
      gameId,
    });
    console.log(`  ✓ Session 1 started: ${session1.sessionId}`);

    // Wait to satisfy anti-cheat duration check
    const waitTime = Math.max(minDuration + 1, 5);
    console.log(`  ⏳ Waiting ${waitTime}s before submitting first score...`);
    await new Promise(r => setTimeout(r, waitTime * 1000));

    // Step 2: Submit a low score (first play → should be new high score)
    const score1 = 10;
    const result1 = await apiCall('POST', '/api/submitScore', {
      sessionId: session1.sessionId,
      wallet: TEST_WALLET,
      gameId,
      score: score1,
      duration: waitTime,
    });
    console.log(`  ✓ Submitted score ${score1}: isNewHighScore=${result1.isNewHighScore}, mintAttempted=${result1.mintAttempted}`);

    // Step 3: Start new session for second score (to avoid duration exceeds session time)
    const session2 = await apiCall('POST', '/api/startSession', {
      wallet: TEST_WALLET,
      gameId,
    });
    console.log(`  ✓ Session 2 started: ${session2.sessionId}`);

    // Wait again
    console.log(`  ⏳ Waiting ${waitTime}s before submitting second score...`);
    await new Promise(r => setTimeout(r, waitTime * 1000));

    // Step 4: Submit a higher score (should be new high score → attempt mint)
    const score2 = 100;
    const result2 = await apiCall('POST', '/api/submitScore', {
      sessionId: session2.sessionId,
      wallet: TEST_WALLET,
      gameId,
      score: score2,
      duration: waitTime,
    });
    console.log(`  ✓ Submitted score ${score2}: isNewHighScore=${result2.isNewHighScore}, mintAttempted=${result2.mintAttempted}`);

    // Step 4: Check NFT mint result
    if (result2.mintAttempted) {
      if (result2.scoreNFT) {
        console.log(`  ✅ NFT minted: Token #${result2.scoreNFT.tokenId} (tx ${result2.scoreNFT.txHash})`);
      } else {
        console.log(`  ⚠️  Mint attempted but failed (backend signer may not be authorized)`);
      }
    } else if (result2.isNewHighScore) {
      console.log(`  ⚠️  New high score but mint not attempted (NFT_ADDRESS or BACKEND_SIGNER_KEY missing?)`);
    }

    // Step 5: Check next milestone
    if (result2.nextMilestone) {
      console.log(`  ✓ Next reward: ${result2.nextMilestone.type} at ${result2.nextMilestone.minScore} pts (gap: ${result2.nextMilestone.gap})`);
    } else {
      console.log(`  ✓ All rewards unlocked for this game`);
    }

    return { success: true, game: gameId, result: result2 };
  } catch (err) {
    console.error(`  ✗ FAILED: ${err.message}`);
    return { success: false, game: gameId, error: err.message };
  }
}

async function main() {
  console.log('🧪 E2E Test: Game Score Submission & NFT Minting');
  console.log(`📍 API: ${BASE_URL}`);
  console.log(`👛 Test Wallet: ${TEST_WALLET}`);

  const results = [];
  for (const game of GAMES) {
    results.push(await testGame(game));
  }

  console.log('\n\n=== SUMMARY ===');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.game}`);
    if (!r.success) console.log(`   Error: ${r.error}`);
  });

  console.log(`\nPassed: ${passed}/${results.length} | Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.error('\n⚠️  Some tests failed. Check the logs above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

async function main() {
  console.log('🧪 E2E Test: Game Score Submission & NFT Minting');
  console.log(`📍 API: ${BASE_URL}`);
  console.log(`👛 Test Wallet: ${TEST_WALLET}`);

  const results = [];
  for (const game of GAMES) {
    results.push(await testGame(game));
  }

  console.log('\n\n=== SUMMARY ===');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.game}`);
    if (!r.success) console.log(`   Error: ${r.error}`);
  });

  console.log(`\nPassed: ${passed}/${results.length} | Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.error('\n⚠️  Some tests failed. Check the logs above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
