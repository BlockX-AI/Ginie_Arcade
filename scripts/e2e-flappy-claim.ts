import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const BACKEND_PATH = path.join(process.env.HOME || '', '.config/solana/ginix-backend.json');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const PROGRAM_ID = '3i6fdSaw459wViBFYQjEbw3fdRk1KgANaDmBLMVhbjN7';
const REWARD_MINT = '8zMxbkUZKyffsCzxU2z9NEWy67U6ER7K9PMhQZ5Rkndh';

async function main() {
  if (!fs.existsSync(BACKEND_PATH)) {
    throw new Error(`Backend key not found at ${BACKEND_PATH} — run scripts/initialize-platform.ts first`);
  }

  const backendSecret = JSON.stringify(
    JSON.parse(fs.readFileSync(BACKEND_PATH, 'utf8'))
  );
  process.env.BACKEND_SIGNER_KEY = backendSecret;

  const {
    buildStartSessionIx,
    buildBackendSignatureIx,
    buildSubmitScoreAndClaimIx,
    getArcadePlatformPda,
  } = await import('../lib/solanaProgram');
  const { signGameResult, buildArcadeSignMessage, getBackendPublicKey } = await import(
    '../lib/signer'
  );

  const backend = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(backendSecret))
  );
  const player = backend.publicKey;
  const gameId = 'flappy';
  const score = 100;
  const reward = 1_000_000_000; // 1 token (9 decimals)

  console.log('Backend/player:', player.toBase58());

  const [platformPda] = getArcadePlatformPda(player);
  console.log('Platform PDA:', platformPda.toBase58());

  // Record the starting balance so the test is repeatable (the wallet keeps its
  // tokens between runs, so assert on the delta rather than an absolute amount).
  const ata = getAssociatedTokenAddressSync(new PublicKey(REWARD_MINT), player);
  const before = await connection
    .getTokenAccountBalance(ata)
    .then((b) => Number(b.value.amount))
    .catch(() => 0); // ATA does not exist yet
  console.log('Reward balance before:', before / 1e9);

  // 1. Start session on-chain
  const nonceHex = randomBytes(32).toString('hex');
  const startTx = new Transaction().add(
    buildStartSessionIx(player, gameId, nonceHex)
  );
  const startSig = await sendAndConfirmTransaction(connection, startTx, [backend]);
  console.log('start_session:', startSig);

  // 2. Backend signs score
  const signature = await signGameResult(nonceHex, player.toBase58(), gameId, score, reward);
  console.log('Backend signature ok');

  // 3. Build Ed25519 + submit_score_and_claim
  const message = buildArcadeSignMessage(nonceHex, player.toBase58(), gameId, score, reward);
  const ed25519Ix = buildBackendSignatureIx(Buffer.from(message), signature, getBackendPublicKey());
  const submitIx = buildSubmitScoreAndClaimIx(
    player,
    platformPda,
    new PublicKey(REWARD_MINT),
    gameId,
    score,
    reward,
    0
  );

  const submitTx = new Transaction().add(ed25519Ix, submitIx);
  const submitSig = await sendAndConfirmTransaction(connection, submitTx, [backend]);
  console.log('submit_score_and_claim:', submitSig);

  // 4. Verify the player was credited exactly the signed reward amount
  const after = Number((await connection.getTokenAccountBalance(ata)).value.amount);
  const minted = after - before;
  console.log('Reward balance after: ', after / 1e9, `(+${minted / 1e9})`);

  if (minted !== reward) {
    throw new Error(`Expected +${reward / 1e9} token, got +${minted / 1e9}`);
  }

  console.log('\nFlappy E2E reward token test passed.');
}

main().catch((err) => {
  console.error('Flappy E2E test failed:', err);
  process.exit(1);
});
