import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateNonce, checkRateLimit } from '@/lib/antiCheat';

/**
 * POST /api/startSession
 * Create a new game session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, gameId } = body;

    // Validate input
    if (!wallet || !gameId) {
      return NextResponse.json(
        { error: 'Missing required fields: wallet, gameId' },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(wallet, 20, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before starting a new session.' },
        { status: 429 }
      );
    }

    // Generate nonce
    const nonce = generateNonce();
    const sessionId = crypto.randomUUID();

    // Create or update player
    await prisma.player.upsert({
      where: { walletAddress: wallet },
      create: {
        walletAddress: wallet,
        xp: 0,
        sessionsPlayed: 0,
      },
      update: {}, // No update needed on session start
    });

    // Create session
    const session = await prisma.session.create({
      data: {
        id: sessionId,
        walletAddress: wallet,
        gameId,
        nonce,
        startedAt: new Date(),
        valid: true,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      nonce: session.nonce,
      startedAt: session.startedAt.toISOString(),
    });

  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
}
