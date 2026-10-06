import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { createMint, getAssociatedTokenAddressSync } from '@solana/spl-token';

const DEPLOYER_PATH = path.join(process.env.HOME || '', '.config/solana/id.json');
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

const ARCADE_PROGRAM_ID = new PublicKey(
  '3i6fdSaw459wViBFYQjEbw3fdRk1KgANaDmBLMVhbjN7'
);

async function main() {
  if (!fs.existsSync(DEPLOYER_PATH)) {
    throw new Error(`Deployer keypair not found at ${DEPLOYER_PATH}`);
  }

  const deployer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(DEPLOYER_PATH, 'utf8')))
  );
  console.log('Deployer:', deployer.publicKey.toBase58());

  // Create a separate operator wallet for this smoke test.
  // The platform PDA is derived from the operator, so we control the backend signer.
  const operator = Keypair.generate();
  console.log('Operator:', operator.publicKey.toBase58());

  // Fund operator from deployer. This covers rent for a throwaway platform PDA,
  // reward mint, game PDA, session PDA and the player ATA, plus fees (~0.01 SOL).
  // NOTE: every run of this script permanently burns that rent on devnet, so it is the
  // most SOL-hungry script here. Prefer scripts/e2e-flappy-claim.ts for routine checks.
  const OPERATOR_FUNDING = 0.025 * 1e9;

  const deployerBalance = await connection.getBalance(deployer.publicKey);
  if (deployerBalance < OPERATOR_FUNDING + 0.005 * 1e9) {
    throw new Error(
      `Deployer has ${(deployerBalance / 1e9).toFixed(4)} SOL, needs ~${(OPERATOR_FUNDING / 1e9 + 0.005).toFixed(3)}. ` +
      `Airdrop devnet SOL to ${deployer.publicKey.toBase58()}`
    );
  }

  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: deployer.publicKey,
        toPubkey: operator.publicKey,
        lamports: OPERATOR_FUNDING,
      })
    ),
    [deployer]
  );
  console.log(`Funded operator with ${OPERATOR_FUNDING / 1e9} SOL`);

  // Use operator as backend signer for simplicity in this test
  process.env.BACKEND_SIGNER_KEY = JSON.stringify(Array.from(operator.secretKey));

  // Compute operator's platform PDA
  const [platformPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('platform'), operator.publicKey.toBuffer()],
    ARCADE_PROGRAM_ID
  );
  console.log('Platform PDA:', platformPda.toBase58());

  // Create reward mint (platform PDA is mint/freeze authority)
  const rewardMint = await createMint(
    connection,
    operator,
    platformPda,
    platformPda,
    9
  );
  console.log('Reward mint:', rewardMint.toBase58());
  process.env.NEXT_PUBLIC_REWARD_MINT = rewardMint.toBase58();

  // Load helpers after setting env defaults
  const {
    buildInitializePlatformIx,
    buildRegisterGameIx,
    buildStartSessionIx,
    buildBackendSignatureIx,
    buildSubmitScoreAndClaimIx,
  } = await import('../lib/solanaProgram');

  const { signGameResult, getBackendPublicKey } = await import('../lib/signer');
  const signerModule = await import('../lib/signer');

  // 1. Initialize platform
  const initTx = new Transaction().add(
    buildInitializePlatformIx(operator.publicKey, operator.publicKey)
  );
  const initSig = await sendAndConfirmTransaction(connection, initTx, [operator]);
  console.log('initialize_platform signature:', initSig);

  // 2. Register a throwaway game with reward rate 1.
  // Game PDAs are seeded [b"game", game_id] globally (not per-authority), so reusing a
  // real game id here would collide with the registration done by
  // scripts/initialize-platform.ts. This script provisions its own isolated platform,
  // mint and game so it can be re-run any number of times.
  const gameId = `smoke-${randomBytes(4).toString('hex')}`;
  const regTx = new Transaction().add(
    buildRegisterGameIx(operator.publicKey, gameId, 1)
  );
  const regSig = await sendAndConfirmTransaction(connection, regTx, [operator]);
  console.log('register_game signature:', regSig);

  // 3. Start a session
  const nonce = randomBytes(32).toString('hex');
  const startTx = new Transaction().add(
    buildStartSessionIx(operator.publicKey, gameId, nonce)
  );
  const startSig = await sendAndConfirmTransaction(connection, startTx, [operator]);
  console.log('start_session signature:', startSig);

  // 4. Backend signs the result
  const score = 100;
  const rewardAmount = 1_000_000_000; // 1 token with 9 decimals
  const signature = await signGameResult(
    nonce,
    operator.publicKey.toBase58(),
    gameId,
    score,
    rewardAmount
  );
  console.log('Backend signature (base58):', signature.slice(0, 20) + '...');

  // 5. Build Ed25519 program instruction + submit_score_and_claim
  const message = signerModule.buildArcadeSignMessage(
    nonce,
    operator.publicKey.toBase58(),
    gameId,
    score,
    rewardAmount
  );

  const ed25519Ix = buildBackendSignatureIx(
    Buffer.from(message),
    signature,
    getBackendPublicKey()
  );

  const submitIx = buildSubmitScoreAndClaimIx(
    operator.publicKey,
    platformPda,
    rewardMint,
    gameId,
    score,
    rewardAmount,
    0 // Ed25519 instruction is first in the transaction
  );

  const submitTx = new Transaction().add(ed25519Ix, submitIx);
  const submitSig = await sendAndConfirmTransaction(connection, submitTx, [operator]);
  console.log('submit_score_and_claim signature:', submitSig);

  // 6. Verify reward token balance
  const playerAta = getAssociatedTokenAddressSync(rewardMint, operator.publicKey);
  const balance = await connection.getTokenAccountBalance(playerAta);
  console.log('Reward token balance:', balance.value.uiAmount);

  console.log('\nDevnet smoke test passed.');
}

main().catch((err) => {
  console.error('Devnet smoke test failed:', err);
  process.exit(1);
});
