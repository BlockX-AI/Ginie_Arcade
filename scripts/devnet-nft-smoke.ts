import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
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

async function main() {
  if (!fs.existsSync(BACKEND_PATH)) {
    throw new Error(`Backend keypair not found at ${BACKEND_PATH} — run scripts/initialize-platform.ts first`);
  }

  const backend = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(BACKEND_PATH, 'utf8')))
  );
  console.log('Backend signer:', backend.publicKey.toBase58());

  // Backend acts as both payer and player for this test
  const player = backend.publicKey;
  process.env.BACKEND_SIGNER_KEY = JSON.stringify(Array.from(backend.secretKey));
  process.env.NEXT_PUBLIC_BACKEND_SIGNER_KEY = backend.publicKey.toBase58();

  const {
    buildNftInitIx,
    buildMintNftIx,
    buildBackendSignatureIx,
    getNftPlatformPda,
    getNftMintPda,
    getNftMetadataPda,
    NFT_PROGRAM_ID,
    MPL_TOKEN_METADATA_PROGRAM_ID,
  } = await import('../lib/solanaProgram');
  const { signNftMint, buildNftSignMessage, getBackendPublicKey } = await import(
    '../lib/signer'
  );

  // 1. Initialize NFT platform (skip if already initialized)
  const [nftPlatformPda] = getNftPlatformPda(backend.publicKey);
  console.log('NFT platform PDA:', nftPlatformPda.toBase58());

  const existing = await connection.getAccountInfo(nftPlatformPda);
  if (existing) {
    console.log('NFT platform already initialized, skipping');
  } else {
    const initTx = new Transaction().add(
      buildNftInitIx(backend.publicKey, backend.publicKey)
    ); 
    const initSig = await sendAndConfirmTransaction(connection, initTx, [backend]);
    console.log('initialize_platform signature:', initSig);
  }

  // 2. Mint an NFT for the player.
  // The mint PDA is seeded [b"nft", player, token_id], so a fixed id can only ever be
  // minted once. Use a fresh id from the reserved 9_xxx_xxx test namespace each run
  // (see lib/badges.ts for the production allocation table).
  const tokenId = 9_000_000 + Math.floor(Math.random() * 1_000_000);
  const name = 'Ginix Badge';
  const symbol = 'GNX';
  const metadataUri = 'https://arweave.net/test-metadata';

  const uriHash = createHash('sha256').update(metadataUri, 'utf8').digest();
  const message = buildNftSignMessage(player.toBase58(), tokenId, uriHash);
  const signature = signNftMint(player.toBase58(), tokenId, uriHash); // signs the same message

  const [mintPda] = getNftMintPda(player, tokenId);
  const [metadataPda] = getNftMetadataPda(mintPda);
  console.log('NFT mint PDA:', mintPda.toBase58());
  console.log('Metadata PDA:', metadataPda.toBase58());

  const ed25519Ix = buildBackendSignatureIx(
    Buffer.from(message),
    signature,
    getBackendPublicKey()
  );
  const mintIx = buildMintNftIx(
    backend.publicKey, // payer
    backend.publicKey, // platform authority
    player,
    tokenId,
    name,
    symbol,
    metadataUri,
    0
  );

  const mintTx = new Transaction().add(ed25519Ix, mintIx);
  const mintSig = await sendAndConfirmTransaction(connection, mintTx, [backend]);
  console.log('mint_nft signature:', mintSig);

  // 3. Verify: player token account holds 1 NFT, metadata account exists
  const ata = getAssociatedTokenAddressSync(mintPda, player);
  const balance = await connection.getTokenAccountBalance(ata);
  console.log('NFT balance:', balance.value.uiAmount);

  const metaInfo = await connection.getAccountInfo(metadataPda);
  console.log('Metadata account exists:', metaInfo !== null, 'owner:', metaInfo?.owner.toBase58());

  if (balance.value.uiAmount !== 1 || !metaInfo) {
    throw new Error('NFT verification failed');
  }

  console.log('\nNFT devnet smoke test passed.');
}

main().catch((err) => {
  console.error('NFT smoke test failed:', err);
  process.exit(1);
});
