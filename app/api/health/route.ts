import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  const status: {
    status: string;
    timestamp: string;
    database: string;
    nftMinting: string;
    signer: string;
    uptime: number;
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'unknown',
    nftMinting: 'unknown',
    signer: 'unknown',
    uptime: process.uptime(),
  };

  // Check database connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    status.database = 'connected';
  } catch {
    status.database = 'disconnected';
    status.status = 'degraded';
  }

  // Check NFT minting configuration
  const nftAddress = process.env.NEXT_PUBLIC_NFT_ADDRESS;
  const signerKey = process.env.BACKEND_SIGNER_KEY;
  status.nftMinting =
    nftAddress && nftAddress.length >= 10 && signerKey && signerKey.length >= 64
      ? 'configured'
      : 'not_configured';

  // Check backend signer
  status.signer =
    signerKey && signerKey !== 'your_backend_private_key_here' && signerKey.length >= 64
      ? 'configured'
      : 'not_configured';

  if (status.signer === 'not_configured') {
    status.status = 'degraded';
  }

  const httpStatus = status.status === 'ok' ? 200 : 503;

  return NextResponse.json(status, {
    status: httpStatus,
    headers: { 'Cache-Control': 'no-store' },
  });
}
