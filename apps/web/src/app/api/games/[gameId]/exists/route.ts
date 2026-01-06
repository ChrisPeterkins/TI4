import { NextResponse } from 'next/server';
import { prisma } from '@ti4/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, status: true },
    });

    return NextResponse.json({
      exists: !!game,
      status: game?.status || null,
    });
  } catch (error) {
    console.error('Failed to check game existence:', error);
    return NextResponse.json({ exists: false, status: null });
  }
}
