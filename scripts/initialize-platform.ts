import fs from 'fs';
import path from 'path';
import bs58 from 'bs58';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { createMint } from '@solana/spl-token';
import { games } from '../lib/games';

const DEPLOYER_PATH = path.join(process.env.HOME || '', '.config/solana/id.json');
const BACKEND_PATH = path.join(process.env.HOME || '', '.config/solana/ginix-backend.json');
const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

const ARCADE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || '3i6fdSaw459wViBFYQjEbw3fdRk1KgANaDmBLMVhbjN7'
);

const GAME_IDS = games.map((g) => g.id);

async function main() {
  if (!fs.existsSync(DEPLOYER_PATH)) {
    throw new Error(`Deployer keypair not found at ${DEPLOYER_PATH}`);
  }

  const deployer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(DEPLOYER_PATH, 'utf8')))
  );
  console.log('Deployer:', deployer.publicKey.toBase58());

  // Backend signer is the authority for the arcade platform PDA.
  // If BACKEND_SIGNER_KEY env is set, use it. Otherwise load/create ~/.config/solana/ginix-backend.json
  let backend: Keypair;
  if (process.env.BACKEND_SIGNER_KEY) {
    const raw = process.env.BACKEND_SIGNER_KEY;
    if (raw.startsWith('[')) {
      backend = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
    } else {
      backend = Keypair.fromSecretKey(bs58.decode(raw));
    }
  } else if (fs.existsSync(BACKEND_PATH)) {
    backend = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(BACKEND_PATH, 'utf8')))
    );
    console.log('Loaded existing backend signer from', BACKEND_PATH);
  } else {
    backend = Keypair.generate();
    fs.writeFileSync(BACKEND_PATH, JSON.stringify(Array.from(backend.secretKey)), {
      mode: 0o600,
    });
    console.log('Generated new backend signer ->', BACKEND_PATH);
  }

  console.log('Backend signer public key:', backend.publicKey.toBase58());
  console.log('BACKEND_SIGNER_KEY (set in .env):', JSON.stringify(Array.from(backend.secretKey)));

  // Fund the backend signer if needed.
  // The backend is the fee payer for every player NFT mint (~0.005 SOL each: mint
  // account + associated token account + Metaplex metadata rent), so it needs a real
  // working balance, not just enough for one transaction.
  const TOP_UP_THRESHOLD = 0.1 * 1e9;
  const TOP_UP_AMOUNT = 0.25 * 1e9;

  const backendBalance = await connection.getBalance(backend.publicKey);
  console.log(`Backend balance: ${(backendBalance / 1e9).toFixed(4)} SOL`);

  if (backendBalance < TOP_UP_THRESHOLD) {
    const deployerBalance = await connection.getBalance(deployer.publicKey);
    if (deployerBalance < TOP_UP_AMOUNT + 0.01 * 1e9) {
      console.warn(
        `Deployer only has ${(deployerBalance / 1e9).toFixed(4)} SOL — cannot top up the backend. ` +
        'Airdrop more devnet SOL to ' + deployer.publicKey.toBase58()
      );
    } else {
      await sendAndConfirmTransaction(
        connection,
        new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: deployer.publicKey,
            toPubkey: backend.publicKey,
            lamports: TOP_UP_AMOUNT,
          })
        ),
        [deployer]
      );
      console.log(`Topped up backend signer with ${TOP_UP_AMOUNT / 1e9} SOL`);
    }
  }

  // Platform PDA is derived from the backend signer (authority)
  const [platformPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('platform'), backend.publicKey.toBuffer()],
    ARCADE_PROGRAM_ID
  );
  console.log('Platform PDA:', platformPda.toBase58());

  const { buildInitializePlatformIx, buildRegisterGameIx, getGamePda } = await import(
    '../lib/solanaProgram'
  );

  // Initialize platform (authority = backend signer)
  const platformInfo = await connection.getAccountInfo(platformPda);
  let rewardMint: PublicKey;
  if (platformInfo) {
    console.log('Platform already initialized, skipping initialize_platform');
    rewardMint = new PublicKey(platformInfo.data.slice(72, 104));
  } else {
    rewardMint = await createMint(connection, backend, platformPda, platformPda, 9);
    console.log('Reward mint:', rewardMint.toBase58());
    const initTx = new Transaction().add(
      buildInitializePlatformIx(backend.publicKey, backend.publicKey)
    );
    const initSig = await sendAndConfirmTransaction(connection, initTx, [backend]);
    console.log('initialize_platform signature:', initSig);
  }
  process.env.NEXT_PUBLIC_REWARD_MINT = rewardMint.toBase58();

  // Register all games (skip if already registered)
  for (const gameId of GAME_IDS) {
    const [gamePda] = getGamePda(gameId);
    const existing = await connection.getAccountInfo(gamePda);
    if (existing) {
      console.log(`register_game ${gameId}: skipped (already exists)`);
      continue;
    }
    const regTx = new Transaction().add(
      buildRegisterGameIx(backend.publicKey, gameId, 1)
    );
    const regSig = await sendAndConfirmTransaction(connection, regTx, [backend]);
    console.log(`register_game ${gameId}:`, regSig);
  }

  console.log('\n=== Add these to .env ===');
  console.log(`NEXT_PUBLIC_SOLANA_PROGRAM_ID=${ARCADE_PROGRAM_ID.toBase58()}`);
  console.log(`NEXT_PUBLIC_BACKEND_SIGNER_KEY=${backend.publicKey.toBase58()}`);
  console.log(`NEXT_PUBLIC_REWARD_MINT=${rewardMint.toBase58()}`);
  console.log(`NEXT_PUBLIC_SOLANA_RPC_URL=${connection.rpcEndpoint}`);
  console.log(`BACKEND_SIGNER_KEY=${JSON.stringify(Array.from(backend.secretKey))}`);
  console.log('\nPlatform initialized on devnet.');
}

main().catch((err) => {
  console.error('initialize-platform failed:', err);
  process.exit(1);
});
