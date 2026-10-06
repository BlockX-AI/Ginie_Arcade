use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{create_metadata_accounts_v3, CreateMetadataAccountsV3, Metadata as MplMetadata};
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use solana_program::ed25519_program::ID as ED25519_PROGRAM_ID;
use solana_program::hash::hash as sha256_hash;
use solana_program::sysvar::instructions as instructions_sysvar;

declare_id!("8ko2Z2MZt5LDdRvqSEY2Rc38cLQU7j4edgBA68AA62mU");

/// Backend message (72 bytes):
/// player pubkey (32) || token_id (8) || metadata_uri sha256 hash (32)
const MESSAGE_LEN: usize = 32 + 8 + 32;

#[program]
pub mod ginix_nfts {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        backend_signer: Pubkey,
    ) -> Result<()> {
        let platform = &mut ctx.accounts.platform;
        platform.authority = *ctx.accounts.authority.key;
        platform.backend_signer = backend_signer;
        platform.bump = ctx.bumps.platform;
        msg!("Ginix NFT platform initialized");
        Ok(())
    }

    pub fn mint_nft(
        ctx: Context<MintNft>,
        token_id: u64,
        name: String,
        symbol: String,
        metadata_uri: String,
        ed25519_instruction_index: u16,
    ) -> Result<()> {
        require!(name.len() <= 32, NftError::NameTooLong);
        require!(symbol.len() <= 10, NftError::SymbolTooLong);
        require!(metadata_uri.len() <= 200, NftError::UriTooLong);

        let platform = &ctx.accounts.platform;

        // Hash the metadata URI and verify the backend signature.
        let uri_hash = sha256_hash(metadata_uri.as_bytes()).to_bytes();

        verify_backend_signature(
            &ctx.accounts.instructions_sysvar,
            &platform.backend_signer,
            ed25519_instruction_index,
            &ctx.accounts.player.key(),
            token_id,
            &uri_hash,
        )?;

        // Mint 1 token to the player's ATA.
        let mint_key = ctx.accounts.mint.key();
        let nft_authority_seeds = &[
            b"nft_authority".as_ref(),
            mint_key.as_ref(),
            &[ctx.bumps.mint_authority],
        ];
        let signer = &[&nft_authority_seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.player_token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::mint_to(cpi_ctx, 1)?;

        // Create Metaplex metadata.
        let data = anchor_spl::metadata::mpl_token_metadata::types::DataV2 {
            name: name.clone(),
            symbol: symbol.clone(),
            uri: metadata_uri,
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        };

        let metadata_ctx = CpiContext::new_with_signer(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.mint_authority.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.mint_authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            signer,
        );
        create_metadata_accounts_v3(metadata_ctx, data, false, true, None)?;

        msg!("Ginix NFT minted: token_id={}, name={}", token_id, name);
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
        seeds = [b"nft_platform", authority.key().as_ref()],
        bump
    )]
    pub platform: Account<'info, NftPlatform>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(token_id: u64, name: String, symbol: String, metadata_uri: String, ed25519_instruction_index: u16)]
pub struct MintNft<'info> {
    #[account(seeds = [b"nft_platform", platform.authority.as_ref()], bump = platform.bump)]
    pub platform: Account<'info, NftPlatform>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub player: AccountInfo<'info>,
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
        seeds = [b"nft", player.key().as_ref(), &token_id.to_le_bytes()],
        bump
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = player,
    )]
    pub player_token_account: Account<'info, TokenAccount>,
    #[account(
        seeds = [b"nft_authority", mint.key().as_ref()],
        bump
    )]
    pub mint_authority: AccountInfo<'info>,
    /// CHECK: Metaplex metadata program
    #[account(address = MplMetadata::id())]
    pub metadata_program: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"metadata", MplMetadata::id().as_ref(), mint.key().as_ref()],
        bump,
        seeds::program = MplMetadata::id(),
    )]
    /// CHECK: Metaplex metadata account
    pub metadata_account: AccountInfo<'info>,
    /// CHECK: instructions sysvar
    #[account(address = instructions_sysvar::ID)]
    pub instructions_sysvar: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct NftPlatform {
    pub authority: Pubkey,
    pub backend_signer: Pubkey,
    pub bump: u8,
}

fn verify_backend_signature(
    instructions_sysvar_account: &AccountInfo,
    backend_signer: &Pubkey,
    instruction_index: u16,
    player: &Pubkey,
    token_id: u64,
    uri_hash: &[u8; 32],
) -> Result<()> {
    // The Solana runtime has already verified the Ed25519 signature.

    let ix = instructions_sysvar::load_instruction_at_checked(
        instruction_index as usize,
        instructions_sysvar_account,
    )
    .map_err(|_| error!(NftError::InvalidEd25519Instruction))?;

    require!(ix.program_id == ED25519_PROGRAM_ID, NftError::InvalidEd25519Instruction);

    let data = &ix.data;
    require!(data.len() >= 2, NftError::InvalidEd25519Instruction);
    require_eq!(data[0], 1u8, NftError::InvalidEd25519Instruction);

    const SIG_LEN: usize = 64;
    const PK_LEN: usize = 32;
    const OFFSETS_SIZE: usize = 14;
    const OFFSETS_START: usize = 2;

    require!(
        data.len() >= OFFSETS_START + OFFSETS_SIZE + PK_LEN + SIG_LEN + MESSAGE_LEN,
        NftError::InvalidEd25519Instruction
    );

    let offsets = &data[OFFSETS_START..OFFSETS_START + OFFSETS_SIZE];
    let signature_offset = u16::from_le_bytes([offsets[0], offsets[1]]) as usize;
    let signature_ix_idx = u16::from_le_bytes([offsets[2], offsets[3]]);
    let pubkey_offset = u16::from_le_bytes([offsets[4], offsets[5]]) as usize;
    let pubkey_ix_idx = u16::from_le_bytes([offsets[6], offsets[7]]);
    let message_offset = u16::from_le_bytes([offsets[8], offsets[9]]) as usize;
    let message_size = u16::from_le_bytes([offsets[10], offsets[11]]) as usize;
    let message_ix_idx = u16::from_le_bytes([offsets[12], offsets[13]]);

    require_eq!(signature_ix_idx, u16::MAX, NftError::InvalidEd25519Instruction);
    require_eq!(pubkey_ix_idx, u16::MAX, NftError::InvalidEd25519Instruction);
    require_eq!(message_ix_idx, u16::MAX, NftError::InvalidEd25519Instruction);
    require_eq!(message_size, MESSAGE_LEN, NftError::InvalidSignatureMessage);

    let pubkey = &data[pubkey_offset..pubkey_offset + PK_LEN];
    let message = &data[message_offset..message_offset + message_size];

    require!(
        Pubkey::try_from(pubkey).map_or(false, |p| p == *backend_signer),
        NftError::InvalidBackendSigner
    );

    let mut expected = [0u8; MESSAGE_LEN];
    expected[0..32].copy_from_slice(&player.to_bytes());
    expected[32..40].copy_from_slice(&token_id.to_le_bytes());
    expected[40..72].copy_from_slice(uri_hash);

    require!(*message == expected, NftError::InvalidSignatureMessage);

    Ok(())
}

#[error_code]
pub enum NftError {
    #[msg("Name too long")]
    NameTooLong,
    #[msg("Symbol too long")]
    SymbolTooLong,
    #[msg("URI too long")]
    UriTooLong,
    #[msg("Invalid ed25519 signature instruction")]
    InvalidEd25519Instruction,
    #[msg("Signature was not signed by the authorized backend")]
    InvalidBackendSigner,
    #[msg("Signed message does not match expected values")]
    InvalidSignatureMessage,
}
