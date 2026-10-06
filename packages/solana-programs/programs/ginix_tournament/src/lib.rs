use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer as sol_transfer, Transfer as SolTransfer};
use solana_program::ed25519_program::ID as ED25519_PROGRAM_ID;
use solana_program::sysvar::instructions as instructions_sysvar;

declare_id!("2aT2nkWc7kxpVciBnXtZvkfWcwD7WGiDG81t6TTDTWu5");

/// Backend message (48 bytes):
/// player pubkey (32) || tournament_id (8) || prize_amount (8)
const MESSAGE_LEN: usize = 32 + 8 + 8;

#[program]
pub mod ginix_tournament {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        backend_signer: Pubkey,
    ) -> Result<()> {
        let platform = &mut ctx.accounts.platform;
        platform.authority = *ctx.accounts.authority.key;
        platform.backend_signer = backend_signer;
        platform.bump = ctx.bumps.platform;
        msg!("Ginix Tournament platform initialized");
        Ok(())
    }

    pub fn create_tournament(
        ctx: Context<CreateTournament>,
        tournament_id: u64,
        name: String,
        game_id: String,
        entry_fee: u64,
        prize_pool: u64,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        require!(name.len() <= 64, TournamentError::NameTooLong);
        require!(game_id.len() <= 32, TournamentError::GameIdTooLong);
        require!(end_time > start_time, TournamentError::InvalidTimeRange);

        let tournament = &mut ctx.accounts.tournament;
        tournament.authority = ctx.accounts.platform.key();
        tournament.tournament_id = tournament_id;
        tournament.name = name;
        tournament.game_id = game_id;
        tournament.entry_fee = entry_fee;
        tournament.prize_pool = prize_pool;
        tournament.start_time = start_time;
        tournament.end_time = end_time;
        tournament.paid_out = 0;
        tournament.bump = ctx.bumps.tournament;

        msg!("Tournament created: id={}", tournament_id);
        Ok(())
    }

    pub fn enter_tournament(ctx: Context<EnterTournament>, tournament_id: u64) -> Result<()> {
        let tournament = &ctx.accounts.tournament;
        let now = Clock::get()?.unix_timestamp;
        require!(now >= tournament.start_time, TournamentError::NotStarted);
        require!(now <= tournament.end_time, TournamentError::AlreadyEnded);

        // Transfer entry fee from player to tournament vault.
        let fee = tournament.entry_fee;
        if fee > 0 {
            sol_transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    SolTransfer {
                        from: ctx.accounts.player.to_account_info(),
                        to: ctx.accounts.vault.to_account_info(),
                    },
                ),
                fee,
            )?;
        }

        // Record participant.
        let participant = &mut ctx.accounts.participant;
        participant.player = *ctx.accounts.player.key;
        participant.tournament = tournament.key();
        participant.tournament_id = tournament_id;
        participant.score = 0;
        participant.prize_claimed = false;
        participant.bump = ctx.bumps.participant;

        msg!("Player entered tournament: id={}", tournament_id);
        Ok(())
    }

    pub fn claim_prize(
        ctx: Context<ClaimPrize>,
        tournament_id: u64,
        amount: u64,
        ed25519_instruction_index: u16,
    ) -> Result<()> {
        let platform = &ctx.accounts.platform;
        let tournament = &mut ctx.accounts.tournament;
        let participant = &mut ctx.accounts.participant;

        require!(Clock::get()?.unix_timestamp > tournament.end_time, TournamentError::NotEnded);
        require!(!participant.prize_claimed, TournamentError::AlreadyClaimed);
        require!(
            tournament.paid_out.saturating_add(amount) <= tournament.prize_pool,
            TournamentError::PrizeExceedsPool
        );

        verify_backend_signature(
            &ctx.accounts.instructions_sysvar,
            &platform.backend_signer,
            ed25519_instruction_index,
            &ctx.accounts.player.key(),
            tournament_id,
            amount,
        )?;

        // Transfer prize from vault to player.
        let tournament_key = tournament.key();
        let vault_seeds = &[
            b"vault".as_ref(),
            tournament_key.as_ref(),
            &[ctx.bumps.vault],
        ];
        let signer = &[&vault_seeds[..]];

        sol_transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                SolTransfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.player.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        participant.prize_claimed = true;
        tournament.paid_out = tournament.paid_out.saturating_add(amount);

        msg!("Prize claimed: tournament_id={}, player={}, amount={}", tournament_id, ctx.accounts.player.key(), amount);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(backend_signer: Pubkey)]
pub struct InitializePlatform<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 1,
        seeds = [b"tournament_platform", authority.key().as_ref()],
        bump
    )]
    pub platform: Account<'info, TournamentPlatform>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tournament_id: u64, name: String, game_id: String, entry_fee: u64, prize_pool: u64, start_time: i64, end_time: i64)]
pub struct CreateTournament<'info> {
    #[account(seeds = [b"tournament_platform", platform.authority.as_ref()], bump = platform.bump)]
    pub platform: Account<'info, TournamentPlatform>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 8 + (4 + 64) + (4 + 32) + 8 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"tournament", authority.key().as_ref(), &tournament_id.to_le_bytes()],
        bump
    )]
    pub tournament: Account<'info, Tournament>,
    #[account(
        init,
        payer = authority,
        space = 8,
        seeds = [b"vault", tournament.key().as_ref()],
        bump
    )]
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tournament_id: u64)]
pub struct EnterTournament<'info> {
    #[account(mut, seeds = [b"tournament", tournament.authority.as_ref(), &tournament_id.to_le_bytes()], bump = tournament.bump)]
    pub tournament: Account<'info, Tournament>,
    #[account(
        init,
        payer = player,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 1,
        seeds = [b"participant", tournament.key().as_ref(), player.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, TournamentParticipant>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: tournament vault
    #[account(mut, seeds = [b"vault", tournament.key().as_ref()], bump)]
    pub vault: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tournament_id: u64, amount: u64, ed25519_instruction_index: u16)]
pub struct ClaimPrize<'info> {
    #[account(seeds = [b"tournament_platform", platform.authority.as_ref()], bump = platform.bump)]
    pub platform: Account<'info, TournamentPlatform>,
    #[account(mut, seeds = [b"tournament", platform.authority.as_ref(), &tournament_id.to_le_bytes()], bump = tournament.bump)]
    pub tournament: Account<'info, Tournament>,
    #[account(
        mut,
        seeds = [b"participant", tournament.key().as_ref(), player.key().as_ref()],
        bump = participant.bump,
    )]
    pub participant: Account<'info, TournamentParticipant>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: tournament vault
    #[account(mut, seeds = [b"vault", tournament.key().as_ref()], bump)]
    pub vault: AccountInfo<'info>,
    /// CHECK: instructions sysvar
    #[account(address = instructions_sysvar::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct TournamentPlatform {
    pub authority: Pubkey,
    pub backend_signer: Pubkey,
    pub bump: u8,
}

#[account]
pub struct Tournament {
    pub authority: Pubkey,
    pub tournament_id: u64,
    pub name: String,
    pub game_id: String,
    pub entry_fee: u64,
    pub prize_pool: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub paid_out: u64,
    pub bump: u8,
}

#[account]
pub struct TournamentParticipant {
    pub player: Pubkey,
    pub tournament: Pubkey,
    pub tournament_id: u64,
    pub score: u64,
    pub prize_claimed: bool,
    pub bump: u8,
}

fn verify_backend_signature(
    instructions_sysvar_account: &AccountInfo,
    backend_signer: &Pubkey,
    instruction_index: u16,
    player: &Pubkey,
    tournament_id: u64,
    amount: u64,
) -> Result<()> {
    // The Solana runtime has already verified the Ed25519 signature.

    let ix = instructions_sysvar::load_instruction_at_checked(
        instruction_index as usize,
        instructions_sysvar_account,
    )
    .map_err(|_| error!(TournamentError::InvalidEd25519Instruction))?;

    require!(ix.program_id == ED25519_PROGRAM_ID, TournamentError::InvalidEd25519Instruction);

    let data = &ix.data;
    require!(data.len() >= 2, TournamentError::InvalidEd25519Instruction);
    require_eq!(data[0], 1u8, TournamentError::InvalidEd25519Instruction);

    const SIG_LEN: usize = 64;
    const PK_LEN: usize = 32;
    const OFFSETS_SIZE: usize = 14;
    const OFFSETS_START: usize = 2;

    require!(
        data.len() >= OFFSETS_START + OFFSETS_SIZE + PK_LEN + SIG_LEN + MESSAGE_LEN,
        TournamentError::InvalidEd25519Instruction
    );

    let offsets = &data[OFFSETS_START..OFFSETS_START + OFFSETS_SIZE];
    let signature_offset = u16::from_le_bytes([offsets[0], offsets[1]]) as usize;
    let signature_ix_idx = u16::from_le_bytes([offsets[2], offsets[3]]);
    let pubkey_offset = u16::from_le_bytes([offsets[4], offsets[5]]) as usize;
    let pubkey_ix_idx = u16::from_le_bytes([offsets[6], offsets[7]]);
    let message_offset = u16::from_le_bytes([offsets[8], offsets[9]]) as usize;
    let message_size = u16::from_le_bytes([offsets[10], offsets[11]]) as usize;
    let message_ix_idx = u16::from_le_bytes([offsets[12], offsets[13]]);

    require_eq!(signature_ix_idx, u16::MAX, TournamentError::InvalidEd25519Instruction);
    require_eq!(pubkey_ix_idx, u16::MAX, TournamentError::InvalidEd25519Instruction);
    require_eq!(message_ix_idx, u16::MAX, TournamentError::InvalidEd25519Instruction);
    require_eq!(message_size, MESSAGE_LEN, TournamentError::InvalidSignatureMessage);

    let pubkey = &data[pubkey_offset..pubkey_offset + PK_LEN];
    let message = &data[message_offset..message_offset + message_size];

    require!(
        Pubkey::try_from(pubkey).map_or(false, |p| p == *backend_signer),
        TournamentError::InvalidBackendSigner
    );

    let mut expected = [0u8; MESSAGE_LEN];
    expected[0..32].copy_from_slice(&player.to_bytes());
    expected[32..40].copy_from_slice(&tournament_id.to_le_bytes());
    expected[40..48].copy_from_slice(&amount.to_le_bytes());

    require!(*message == expected, TournamentError::InvalidSignatureMessage);

    Ok(())
}

#[error_code]
pub enum TournamentError {
    #[msg("Tournament name too long")]
    NameTooLong,
    #[msg("Game ID too long")]
    GameIdTooLong,
    #[msg("Invalid time range")]
    InvalidTimeRange,
    #[msg("Tournament has not started")]
    NotStarted,
    #[msg("Tournament has already ended")]
    AlreadyEnded,
    #[msg("Tournament has not ended yet")]
    NotEnded,
    #[msg("Prize already claimed")]
    AlreadyClaimed,
    #[msg("Prize exceeds remaining pool")]
    PrizeExceedsPool,
    #[msg("Invalid ed25519 signature instruction")]
    InvalidEd25519Instruction,
    #[msg("Signature was not signed by the authorized backend")]
    InvalidBackendSigner,
    #[msg("Signed message does not match expected values")]
    InvalidSignatureMessage,
}
