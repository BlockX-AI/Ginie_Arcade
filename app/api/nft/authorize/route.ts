import { NextRequest, NextResponse } from 'next/server';
import { authorizeBackendSigner, checkSignerAuthorized } from '@/lib/nftMinter';

/**
 * GET /api/nft/authorize
 * Check if the backend signer is authorized on the GameNFT contract
 */
export async function GET() {
  const status = await checkSignerAuthorized();
  if (!status) {
    return NextResponse.json({ error: 'Minting not configured (missing NFT_ADDRESS or BACKEND_SIGNER_KEY)' }, { status: 400 });
  }
  return NextResponse.json(status);
}

/**
 * POST /api/nft/authorize
 * Authorize the backend signer using the contract owner's private key
 * Body: { ownerKey: "0x..." }
 */
export async function POST(request: NextRequest) {
  try {
    const { ownerKey } = await request.json();
    if (!ownerKey || ownerKey.length < 64) {
      return NextResponse.json({ error: 'ownerKey required (64-char hex private key)' }, { status: 400 });
    }
    const result = await authorizeBackendSigner(ownerKey);
    if (!result) {
      return NextResponse.json({ error: 'Authorization failed – check owner key and RPC connection' }, { status: 500 });
    }
    return NextResponse.json({ success: true, signerAddress: result.signerAddress, txHash: result.txHash });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to authorize minter' }, { status: 500 });
  }
}
