import {
  Ed25519Program,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import bs58 from 'bs58';

// ── Program IDs ───────────────────────────────────────────────

export const ARCADE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || '3i6fdSaw459wViBFYQjEbw3fdRk1KgANaDmBLMVhbjN7'
);
export const NFT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_SOLANA_NFT_PROGRAM_ID || '8ko2Z2MZt5LDdRvqSEY2Rc38cLQU7j4edgBA68AA62mU'
);
export const TOURNAMENT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_SOLANA_TOURNAMENT_PROGRAM_ID || '2aT2nkWc7kxpVciBnXtZvkfWcwD7WGiDG81t6TTDTWu5'
);

// Reward mint is the one registered in the arcade platform config.
export const REWARD_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_REWARD_MINT || '8zMxbkUZKyffsCzxU2z9NEWy67U6ER7K9PMhQZ5Rkndh'
);
export const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

// Backend Ed25519 public key used for anti-cheat and authorization.
export const BACKEND_SIGNER = new PublicKey(
  process.env.NEXT_PUBLIC_BACKEND_SIGNER_KEY || '4xpGd1fGdt7ixpiEeCTdwNL9zDR7KVSoZd7GabjP77LK'
);

// ── Instruction discriminators (sha256("global:<name>")[0:8]) ───

const ARCADE_DISC = {
  initialize_platform: Buffer.from([0x77, 0xc9, 0x65, 0x2d, 0x4b, 0x7a, 0x59, 0x03]),
  set_treasury: Buffer.from([0x39, 0x61, 0xc4, 0x5f, 0xc3, 0xce, 0x6a, 0x88]),
  register_game: Buffer.from([0x7a, 0x2c, 0x5f, 0x3a, 0x59, 0x21, 0x28, 0x3b]),
  toggle_game: Buffer.from([0x93, 0x6c, 0x79, 0xfe, 0xf6, 0xce, 0xa9, 0x2c]),
  start_session: Buffer.from([0x17, 0xe3, 0x6f, 0x8e, 0xd4, 0xe6, 0x03, 0xaf]),
  submit_score_and_claim: Buffer.from([0xf9, 0x01, 0x01, 0xf0, 0x45, 0xc2, 0xc3, 0x6c]),
  close_session: Buffer.from([0x44, 0x72, 0xb2, 0x8c, 0xde, 0x26, 0xf8, 0xd3]),
};

const NFT_DISC = {
  initialize_platform: Buffer.from([0x77, 0xc9, 0x65, 0x2d, 0x4b, 0x7a, 0x59, 0x03]),
  mint_nft: Buffer.from([0xd3, 0x39, 0x06, 0xa7, 0x0f, 0xdb, 0x23, 0xfb]),
};

const TOURNAMENT_DISC = {
  initialize_platform: Buffer.from([0x77, 0xc9, 0x65, 0x2d, 0x4b, 0x7a, 0x59, 0x03]),
  create_tournament: Buffer.from([0x9e, 0x89, 0xe9, 0xe7, 0x49, 0x84, 0xbf, 0x44]),
  enter_tournament: Buffer.from([0x13, 0x15, 0x6d, 0x6d, 0xe3, 0x6c, 0xe8, 0x19]),
  claim_prize: Buffer.from([0x9d, 0xe9, 0x8b, 0x79, 0xf6, 0x3e, 0xea, 0xeb]),
};

// ── PDA helpers ───────────────────────────────────────────────

export function getArcadePlatformPda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('platform'), authority.toBuffer()],
    ARCADE_PROGRAM_ID
  );
}

export function getGamePda(gameId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('game'), Buffer.from(gameId)],
    ARCADE_PROGRAM_ID
  );
}

export function getSessionPda(player: PublicKey, game: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('session'), player.toBuffer(), game.toBuffer()],
    ARCADE_PROGRAM_ID
  );
}

export function getLeaderboardPda(game: PublicKey, player: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('leaderboard'), game.toBuffer(), player.toBuffer()],
    ARCADE_PROGRAM_ID
  );
}

export function getNftPlatformPda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('nft_platform'), authority.toBuffer()],
    NFT_PROGRAM_ID
  );
}

export function getNftMintPda(player: PublicKey, tokenId: bigint | number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('nft'),
      player.toBuffer(),
      Buffer.from(new BigUint64Array([BigInt(tokenId)]).buffer),
    ],
    NFT_PROGRAM_ID
  );
}

export function getNftAuthorityPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('nft_authority'), mint.toBuffer()],
    NFT_PROGRAM_ID
  );
}

export function getNftMetadataPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    MPL_TOKEN_METADATA_PROGRAM_ID
  );
}

export function getTournamentPlatformPda(authority: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('tournament_platform'), authority.toBuffer()],
    TOURNAMENT_PROGRAM_ID
  );
}

export function getTournamentPda(authority: PublicKey, tournamentId: bigint | number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('tournament'),
      authority.toBuffer(),
      Buffer.from(new BigUint64Array([BigInt(tournamentId)]).buffer),
    ],
    TOURNAMENT_PROGRAM_ID
  );
}

export function getTournamentVaultPda(tournament: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), tournament.toBuffer()],
    TOURNAMENT_PROGRAM_ID
  );
}

export function getParticipantPda(tournament: PublicKey, player: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('participant'), tournament.toBuffer(), player.toBuffer()],
    TOURNAMENT_PROGRAM_ID
  );
}

// ── Encoding helpers ──────────────────────────────────────────

function encodeU64(value: number | bigint): Buffer {
  return Buffer.from(new BigUint64Array([BigInt(value)]).buffer);
}

function encodeU32(value: number): Buffer {
  return Buffer.from(new Uint32Array([value]).buffer);
}

function encodeU16(value: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(value, 0);
  return b;
}

function encodeString(value: string): Buffer {
  const buf = Buffer.from(value, 'utf8');
  return Buffer.concat([encodeU32(buf.length), buf]);
}

// ── Arcade instructions ───────────────────────────────────────

export function buildInitializePlatformIx(
  authority: PublicKey,
  backendSigner: PublicKey,
): TransactionInstruction {
  const [platformPda] = getArcadePlatformPda(authority);
  const data = Buffer.concat([
    ARCADE_DISC.initialize_platform,
    backendSigner.toBuffer(),
  ]);
  return new TransactionInstruction({
    programId: ARCADE_PROGRAM_ID,
    keys: [
      { pubkey: platformPda, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: REWARD_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function buildRegisterGameIx(
  owner: PublicKey,
  gameId: string,
  rewardRate: number,
): TransactionInstruction {
  const [gamePda] = getGamePda(gameId);
  const [platformPda] = getArcadePlatformPda(owner);
  const data = Buffer.concat([
    ARCADE_DISC.register_game,
    encodeString(gameId),
    encodeU64(rewardRate),
  ]);
  return new TransactionInstruction({
    programId: ARCADE_PROGRAM_ID,
    keys: [
      { pubkey: gamePda, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function buildStartSessionIx(
  player: PublicKey,
  gameId: string,
  nonce: string
): TransactionInstruction {
  const [gamePda] = getGamePda(gameId);
  const [sessionPda] = getSessionPda(player, gamePda);

  const nonceHex = nonce.replace(/^0x/, '').padStart(64, '0').slice(0, 64);
  const nonceBytes = Buffer.from(nonceHex, 'hex');

  const data = Buffer.concat([ARCADE_DISC.start_session, nonceBytes]);

  return new TransactionInstruction({
    programId: ARCADE_PROGRAM_ID,
    keys: [
      { pubkey: sessionPda, isSigner: false, isWritable: true },
      { pubkey: gamePda, isSigner: false, isWritable: false },
      { pubkey: player, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * Builds an Ed25519 program verification instruction.
 * Place this immediately before `buildSubmitScoreAndClaimIx` in the transaction.
 */
export function buildBackendSignatureIx(
  message: Buffer | Uint8Array,
  signature: string,
  publicKey: string,
): TransactionInstruction {
  return Ed25519Program.createInstructionWithPublicKey({
    publicKey: Buffer.from(new PublicKey(publicKey).toBytes()),
    message: Buffer.from(message),
    signature: bs58.decode(signature),
  });
}

/**
 * Builds the combined `submit_score_and_claim` instruction.
 * Requires an Ed25519 program instruction at `ed25519InstructionIndex` in the same transaction.
 */
export function buildSubmitScoreAndClaimIx(
  player: PublicKey,
  platform: PublicKey,
  rewardMint: PublicKey,
  gameId: string,
  score: number,
  rewardAmount: number,
  ed25519InstructionIndex: number = 0,
): TransactionInstruction {
  const [gamePda] = getGamePda(gameId);
  const [sessionPda] = getSessionPda(player, gamePda);
  const playerAta = getAssociatedTokenAddressSync(rewardMint, player);

  const data = Buffer.concat([
    ARCADE_DISC.submit_score_and_claim,
    encodeU64(score),
    encodeU64(rewardAmount),
    encodeU16(ed25519InstructionIndex),
  ]);

  return new TransactionInstruction({
    programId: ARCADE_PROGRAM_ID,
    keys: [
      { pubkey: platform, isSigner: false, isWritable: false },
      { pubkey: gamePda, isSigner: false, isWritable: false },
      { pubkey: sessionPda, isSigner: false, isWritable: true },
      { pubkey: player, isSigner: true, isWritable: true },
      { pubkey: rewardMint, isSigner: false, isWritable: true },
      { pubkey: playerAta, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function buildCloseSessionIx(player: PublicKey, gameId: string): TransactionInstruction {
  const [gamePda] = getGamePda(gameId);
  const [sessionPda] = getSessionPda(player, gamePda);
  const data = Buffer.concat([ARCADE_DISC.close_session]);
  return new TransactionInstruction({
    programId: ARCADE_PROGRAM_ID,
    keys: [
      { pubkey: sessionPda, isSigner: false, isWritable: true },
      { pubkey: player, isSigner: true, isWritable: true },
    ],
    data,
  });
}

// ── NFT instructions ──────────────────────────────────────────

export function buildNftInitIx(
  authority: PublicKey,
  backendSigner: PublicKey,
): TransactionInstruction {
  const [platformPda] = getNftPlatformPda(authority);
  const data = Buffer.concat([
    NFT_DISC.initialize_platform,
    backendSigner.toBuffer(),
  ]);
  return new TransactionInstruction({
    programId: NFT_PROGRAM_ID,
    keys: [
      { pubkey: platformPda, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export function buildMintNftIx(
  payer: PublicKey,
  platformAuthority: PublicKey,
  player: PublicKey,
  tokenId: bigint | number,
  name: string,
  symbol: string,
  metadataUri: string,
  ed25519InstructionIndex: number = 0,
): TransactionInstruction {
  const [mintPda] = getNftMintPda(player, tokenId);
  const [nftAuthorityPda] = getNftAuthorityPda(mintPda);
  const [nftPlatformPda] = getNftPlatformPda(platformAuthority);
  const [metadataPda] = getNftMetadataPda(mintPda);
  const playerAta = getAssociatedTokenAddressSync(mintPda, player);

  const data = Buffer.concat([
    NFT_DISC.mint_nft,
    encodeU64(tokenId),
    encodeString(name),
    encodeString(symbol),
    encodeString(metadataUri),
    encodeU16(ed25519InstructionIndex),
  ]);

  return new TransactionInstruction({
    programId: NFT_PROGRAM_ID,
    keys: [
      { pubkey: nftPlatformPda, isSigner: false, isWritable: false },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: player, isSigner: false, isWritable: true },
      { pubkey: mintPda, isSigner: false, isWritable: true },
      { pubkey: playerAta, isSigner: false, isWritable: true },
      { pubkey: nftAuthorityPda, isSigner: false, isWritable: false },
      { pubkey: MPL_TOKEN_METADATA_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: metadataPda, isSigner: false, isWritable: true },
      { pubkey: SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  });
}

// ── Utility ──────────────────────────────────────────────────

/**
 * Convert a game slug to a 32-byte seed used on-chain.
 * Uses UTF-8 bytes, padded/truncated to 32.
 */
export function gameSlugToSeed(slug: string): Buffer {
  const buf = Buffer.from(slug, 'utf8');
  if (buf.length <= 32) return Buffer.concat([buf, Buffer.alloc(32 - buf.length)]);
  return buf.subarray(0, 32);
}
