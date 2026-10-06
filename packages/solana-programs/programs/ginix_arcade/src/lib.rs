use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use solana_program::ed25519_program::ID as ED25519_PROGRAM_ID;
use solana_program::sysvar::instructions as instructions_sysvar;

declare_id!("3i6fdSaw459wViBFYQjEbw3fdRk1KgANaDmBLMVhbjN7");

/// Off-chain anti-cheat message layout (112 bytes, little-endian):
///   nonce (32) || player pubkey (32) || game_id (32) || score (8) || reward_amount (8)
const MESSAGE_LEN: usize = 32 + 32 + 32 + 8 + 8;

#[program]
pub mod ginix_arcade {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        backend_signer: Pubkey,
    ) -> Result<()> {
        let platform = &mut ctx.accounts.platform;
        platform.authority = *ctx.accounts.authority.key;
        platform.backend_signer = backend_signer;
        platform.reward_mint = ctx.accounts.reward_mint.key();
        platform.treasury = *ctx.accounts.authority.key;
        platform.bump = ctx.bumps.platform;
        msg!("Ginix Arcade platform initialized");
        Ok(())
    }

    pub fn set_treasury(ctx: Context<AdminOnly>, treasury: Pubkey) -> Result<()> {
        ctx.accounts.platform.treasury = treasury;
        Ok(())
    }

    pub fn register_game(
        ctx: Context<RegisterGame>,
        game_id: String,
        reward_rate: u64,
    ) -> Result<()> {
        require!(game_id.len() <= 32, ArcadeError::GameIdTooLong);
        let game = &mut ctx.accounts.game;
        game.owner = *ctx.accounts.owner.key;
        game.game_id = game_id;
        game.reward_rate = reward_rate;
        game.is_active = true;
        game.bump = ctx.bumps.game;
        Ok(())
    }

    pub fn toggle_game(ctx: Context<AdminOrOwner>, active: bool) -> Result<()> {
        ctx.accounts.game.is_active = active;
        Ok(())
    }

    pub fn start_session(ctx: Context<StartSession>, nonce: [u8; 32]) -> Result<()> {
        let session = &mut ctx.accounts.session;
        require!(!session.is_active, ArcadeError::SessionAlreadyActive);

        session.player = *ctx.accounts.player.key;
        session.game = ctx.accounts.game.key();
        session.nonce = nonce;
        session.start_time = Clock::get()?.unix_timestamp;
        session.end_time = 0;
        session.score = 0;
        session.is_active = true;
        session.reward_claimed = false;
        session.bump = ctx.bumps.session;
        Ok(())
    }

    pub fn submit_score_and_claim(
        ctx: Context<SubmitScoreAndClaim>,
        score: u64,
        reward_amount: u64,
        ed25519_instruction_index: u16,
    ) -> Result<()> {
        let platform = &ctx.accounts.platform;
        let game = &ctx.accounts.game;
        let session = &mut ctx.accounts.session;

        // 1. Verify backend Ed25519 signature via Solana's ed25519 program.
        verify_backend_signature(
            &ctx.accounts.instructions_sysvar,
            &platform.backend_signer,
            ed25519_instruction_index,
            &session.nonce,
            &session.player,
            &game.game_id,
            score,
            reward_amount,
        )?;

        // 2. Validate game/session/player state.
        require!(game.is_active, ArcadeError::GameNotActive);
        require!(session.is_active, ArcadeError::SessionNotActive);
        require!(session.player == ctx.accounts.player.key(), ArcadeError::PlayerMismatch);
        require!(!session.reward_claimed, ArcadeError::RewardAlreadyClaimed);
        require!(score <= game.reward_rate.saturating_mul(100_000), ArcadeError::ScoreTooHigh);

        // 3. End the session.
        session.score = score;
        session.end_time = Clock::get()?.unix_timestamp;
        session.is_active = false;

        // 4. Mint reward tokens using the platform PDA as mint authority.
        if reward_amount > 0 {
            let seeds = &[
                b"platform".as_ref(),
                platform.authority.as_ref(),
                &[platform.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = token::MintTo {
                mint: ctx.accounts.reward_mint.to_account_info(),
                to: ctx.accounts.player_token_account.to_account_info(),
                authority: ctx.accounts.platform.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::mint_to(cpi_ctx, reward_amount)?;

            session.reward_claimed = true;
        }

        msg!("Score submitted and reward claimed: game_id={}, score={}, reward={}", game.game_id, score, reward_amount);
        Ok(())
    }

    pub fn close_session(_ctx: Context<CloseSession>) -> Result<()> {
        // Account is closed automatically by Anchor's `close` constraint.
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(backend_signer: Pubkey)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 32 + 1,
        seeds = [b"platform", authority.key().as_ref()],
        bump
    )]
    pub platform: Account<'info, Platform>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mint::decimals = 9,
        mint::authority = platform,
        mint::freeze_authority = platform,
    )]
    pub reward_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    #[account(mut, has_one = authority)]
    pub platform: Account<'info, Platform>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(game_id: String, reward_rate: u64)]
pub struct RegisterGame<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + 32 + (4 + 32) + 8 + 1 + 1,
        seeds = [b"game", game_id.as_bytes()],
        bump
    )]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminOrOwner<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(nonce: [u8; 32])]
pub struct StartSession<'info> {
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 1,
        seeds = [b"session", player.key().as_ref(), game.key().as_ref()],
        bump
    )]
    pub session: Account<'info, GameSession>,
    #[account(seeds = [b"game", game.game_id.as_bytes()], bump = game.bump)]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(score: u64, reward_amount: u64, ed25519_instruction_index: u16)]
pub struct SubmitScoreAndClaim<'info> {
    #[account(seeds = [b"platform", platform.authority.as_ref()], bump = platform.bump)]
    pub platform: Account<'info, Platform>,
    #[account(seeds = [b"game", game.game_id.as_bytes()], bump = game.bump)]
    pub game: Account<'info, Game>,
    #[account(
        mut,
        seeds = [b"session", player.key().as_ref(), game.key().as_ref()],
        bump = session.bump,
    )]
    pub session: Account<'info, GameSession>,
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(mut, address = platform.reward_mint)]
    pub reward_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = player,
        associated_token::mint = reward_mint,
        associated_token::authority = player,
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    /// CHECK: instructions sysvar
    #[account(address = instructions_sysvar::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseSession<'info> {
    #[account(mut, close = player, has_one = player)]
    pub session: Account<'info, GameSession>,
    #[account(mut)]
    pub player: Signer<'info>,
}

#[account]
pub struct Platform {
    pub authority: Pubkey,
    pub backend_signer: Pubkey,
    pub reward_mint: Pubkey,
    pub treasury: Pubkey,
    pub bump: u8,
}

#[account]
pub struct Game {
    pub owner: Pubkey,
    pub game_id: String,
    pub reward_rate: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
pub struct GameSession {
    pub player: Pubkey,
    pub game: Pubkey,
    pub nonce: [u8; 32],
    pub start_time: i64,
    pub end_time: i64,
    pub score: u64,
    pub is_active: bool,
    pub reward_claimed: bool,
    pub bump: u8,
}

#[account]
pub struct LeaderboardEntry {
    pub player: Pubkey,
    pub game: Pubkey,
    pub score: u64,
    pub updated_at: i64,
    pub bump: u8,
}

/// Parse the ed25519 program instruction at `instruction_index` and verify it
/// matches the expected message signed by the backend signer.
fn verify_backend_signature(
    instructions_sysvar_account: &AccountInfo,
    backend_signer: &Pubkey,
    instruction_index: u16,
    nonce: &[u8; 32],
    player: &Pubkey,
    game_id: &str,
    score: u64,
    reward_amount: u64,
) -> Result<()> {
    // The Solana runtime already verified the ed25519 signature if the instruction succeeded.
    // We only need to load the instruction data here.

    let ix = instructions_sysvar::load_instruction_at_checked(
        instruction_index as usize,
        instructions_sysvar_account,
    )
    .map_err(|_| error!(ArcadeError::InvalidEd25519Instruction))?;

    require!(ix.program_id == ED25519_PROGRAM_ID, ArcadeError::InvalidEd25519Instruction);

    let data = &ix.data;
    require!(data.len() >= 2, ArcadeError::InvalidEd25519Instruction);
    require_eq!(data[0], 1u8, ArcadeError::InvalidEd25519Instruction); // 1 signature

    const SIG_LEN: usize = 64;
    const PK_LEN: usize = 32;
    const OFFSETS_SIZE: usize = 14;
    const OFFSETS_START: usize = 2;

    require!(
        data.len() >= OFFSETS_START + OFFSETS_SIZE + PK_LEN + SIG_LEN + MESSAGE_LEN,
        ArcadeError::InvalidEd25519Instruction
    );

    let offsets = &data[OFFSETS_START..OFFSETS_START + OFFSETS_SIZE];
    let signature_offset = u16::from_le_bytes([offsets[0], offsets[1]]) as usize;
    let signature_ix_idx = u16::from_le_bytes([offsets[2], offsets[3]]);
    let pubkey_offset = u16::from_le_bytes([offsets[4], offsets[5]]) as usize;
    let pubkey_ix_idx = u16::from_le_bytes([offsets[6], offsets[7]]);
    let message_offset = u16::from_le_bytes([offsets[8], offsets[9]]) as usize;
    let message_size = u16::from_le_bytes([offsets[10], offsets[11]]) as usize;
    let message_ix_idx = u16::from_le_bytes([offsets[12], offsets[13]]);

    // Offsets must point to this same ed25519 instruction data.
    require_eq!(
        signature_ix_idx,
        u16::MAX,
        ArcadeError::InvalidEd25519Instruction
    );
    require_eq!(pubkey_ix_idx, u16::MAX, ArcadeError::InvalidEd25519Instruction);
    require_eq!(
        message_ix_idx,
        u16::MAX,
        ArcadeError::InvalidEd25519Instruction
    );
    require_eq!(message_size, MESSAGE_LEN, ArcadeError::InvalidSignatureMessage);

    let pubkey = &data[pubkey_offset..pubkey_offset + PK_LEN];
    let message = &data[message_offset..message_offset + message_size];

    require!(
        Pubkey::try_from(pubkey).map_or(false, |p| p == *backend_signer),
        ArcadeError::InvalidBackendSigner
    );

    // Reconstruct the message the backend should have signed.
    let mut expected = [0u8; MESSAGE_LEN];
    expected[0..32].copy_from_slice(nonce);
    expected[32..64].copy_from_slice(&player.to_bytes());
    expected[64..96].copy_from_slice(&game_id_to_bytes(game_id));
    expected[96..104].copy_from_slice(&score.to_le_bytes());
    expected[104..112].copy_from_slice(&reward_amount.to_le_bytes());

    require!(*message == expected, ArcadeError::InvalidSignatureMessage);

    Ok(())
}

fn game_id_to_bytes(game_id: &str) -> [u8; 32] {
    let mut bytes = [0u8; 32];
    let game_bytes = game_id.as_bytes();
    let len = game_bytes.len().min(32);
    bytes[..len].copy_from_slice(&game_bytes[..len]);
    bytes
}

#[error_code]
pub enum ArcadeError {
    #[msg("Game ID must be 32 bytes or less")]
    GameIdTooLong,
    #[msg("Game is not active")]
    GameNotActive,
    #[msg("Session is not active")]
    SessionNotActive,
    #[msg("Session is already active")]
    SessionAlreadyActive,
    #[msg("Player does not own this session")]
    PlayerMismatch,
    #[msg("Reward already claimed for this session")]
    RewardAlreadyClaimed,
    #[msg("Score is unreasonably high")]
    ScoreTooHigh,
    #[msg("Invalid ed25519 signature instruction")]
    InvalidEd25519Instruction,
    #[msg("Signature was not signed by the authorized backend")]
    InvalidBackendSigner,
    #[msg("Signed message does not match expected values")]
    InvalidSignatureMessage,
    #[msg("Unauthorized")]
    Unauthorized,
}
