/**
 * Verifies lib/nftMinter.ts (the real production code path) against devnet.
 *
 *   npx tsx scripts/verify-nft-minter.ts
 *
 * 1. Asserts every badge + score metadata URI fits the on-chain 200-byte limit
 * 2. Mints a badge NFT and a score NFT to a fresh wallet, paid for by the backend
 * 3. Confirms the player received each NFT and that Metaplex metadata was created
 */
import fs from 'fs';
import path from 'path';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const BACKEND_PATH = path.join(process.env.HOME || '', '.config/solana/ginix-backend.json');

async function main() {
  if (!fs.existsSync(BACKEND_PATH)) {
    throw new Error(`Backend key not found at ${BACKEND_PATH} — run scripts/initialize-platform.ts first`);
  }
  process.env.BACKEND_SIGNER_KEY = JSON.stringify(
    JSON.parse(fs.readFileSync(BACKEND_PATH, 'utf8'))
  );

  // This script exercises the mint path, not metadata hosting. The default app URL has
  // not necessarily shipped /api/metadata/* yet, so skip the reachability preflight —
  // URI length and format are still asserted below.
  process.env.SKIP_NFT_METADATA_PREFLIGHT = 'true';

  const { BADGE_DEFS } = await import('../lib/badges');
  const { games } = await import('../lib/games');
  const { getBadgeTokenURI, getScoreTokenURI, MAX_METADATA_URI_LEN } = await import('../lib/badgeTokenURIs');
  const { mintBadgeNFT, mintScoreNFT, isMintingAvailable, scoreTokenId } = await import('../lib/nftMinter');
  const { GAME_RULES } = await import('../lib/antiCheat');
  const { getNftMetadataPda } = await import('../lib/solanaProgram');

  // ---- 1. URI length + registry invariants -------------------------------
  console.log('Checking metadata URI lengths...');
  for (const badge of BADGE_DEFS) {
    const uri = getBadgeTokenURI(badge.id);
    const len = Buffer.byteLength(uri, 'utf8');
    if (len > MAX_METADATA_URI_LEN) throw new Error(`badge ${badge.id}: URI ${len} bytes`);
    if (uri.startsWith('data:')) throw new Error(`badge ${badge.id}: still a data URI`);
  }
  console.log(`  ${BADGE_DEFS.length} badge URIs OK`);

  for (const g of games) {
    const max = GAME_RULES[g.id]?.maxScore ?? 0;
    const uri = getScoreTokenURI(g.id, max);
    const len = Buffer.byteLength(uri, 'utf8');
    if (len > MAX_METADATA_URI_LEN) throw new Error(`score ${g.id}@${max}: URI ${len} bytes`);
    if (scoreTokenId(g.id, max) === null) {
      throw new Error(`score ${g.id}@${max}: no token id (missing GAME_SLOT or score out of range)`);
    }
    if (!GAME_RULES[g.id]) throw new Error(`game ${g.id} has no GAME_RULES entry`);
  }
  console.log(`  ${games.length} score URIs OK (checked at each game's maxScore)`);

  // Token ids must be globally unique
  const ids = new Map<number, string>();
  for (const b of BADGE_DEFS) {
    if (ids.has(b.tokenId)) throw new Error(`duplicate tokenId ${b.tokenId}: ${b.id} vs ${ids.get(b.tokenId)}`);
    ids.set(b.tokenId, b.id);
  }
  console.log('  badge token ids unique OK');

  if (!isMintingAvailable()) throw new Error('isMintingAvailable() returned false');

  // ---- 2. Mint through the production functions ---------------------------
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const player = Keypair.generate(); // fresh wallet, holds zero SOL
  console.log(`\nPlayer (fresh, 0 SOL): ${player.publicKey.toBase58()}`);

  const badge = BADGE_DEFS[0];
  console.log(`\nMinting badge "${badge.id}" (token_id=${badge.tokenId})...`);
  const badgeRes = await mintBadgeNFT(player.publicKey.toBase58(), badge.id);
  if (!badgeRes) throw new Error('mintBadgeNFT returned null');
  console.log(`  tx:   ${badgeRes.txHash}`);
  console.log(`  mint: ${badgeRes.mint}`);

  console.log(`\nMinting score NFT (flappy, 42)...`);
  const scoreRes = await mintScoreNFT(player.publicKey.toBase58(), 'flappy', 42);
  if (!scoreRes) throw new Error('mintScoreNFT returned null');
  console.log(`  tx:   ${scoreRes.txHash}`);
  console.log(`  mint: ${scoreRes.mint}`);

  // ---- 3. Verify on-chain state ------------------------------------------
  console.log('\nVerifying on-chain...');
  for (const [label, res] of [['badge', badgeRes], ['score', scoreRes]] as const) {
    const mint = new PublicKey(res.mint);
    const ata = getAssociatedTokenAddressSync(mint, player.publicKey);
    const bal = await connection.getTokenAccountBalance(ata);
    if (bal.value.amount !== '1' || bal.value.decimals !== 0) {
      throw new Error(`${label}: expected 1 NFT (0 decimals), got ${bal.value.amount} / ${bal.value.decimals}`);
    }
    const [metadataPda] = getNftMetadataPda(mint);
    const meta = await connection.getAccountInfo(metadataPda);
    if (!meta) throw new Error(`${label}: metadata account missing`);
    console.log(`  ${label}: balance=1, metadata owner=${meta.owner.toBase58()}`);
  }

  // Idempotency: minting the same badge again must not create a second NFT
  console.log('\nRe-minting the same badge (should be a no-op)...');
  const again = await mintBadgeNFT(player.publicKey.toBase58(), badge.id);
  if (!again?.alreadyMinted) throw new Error('expected alreadyMinted=true on second mint');
  console.log('  alreadyMinted=true, no duplicate tx');

  console.log('\nNFT minter verification passed.');
}

main().catch((err) => {
  console.error('\nVerification FAILED:', err);
  process.exit(1);
});
