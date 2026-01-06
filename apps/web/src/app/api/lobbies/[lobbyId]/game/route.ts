import { NextResponse } from 'next/server';
import { prisma } from '@ti4/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lobbyId: string }> }
) {
  try {
    const { lobbyId } = await params;

    // Find game created from this lobby
    const game = await prisma.game.findFirst({
      where: { lobbyId },
      select: { id: true, status: true },
      orderBy: { createdAt: 'desc' },
    });

    if (game) {
      return NextResponse.json({
        gameId: game.id,
        status: game.status,
      });
    }

    return NextResponse.json({ gameId: null, status: null });
  } catch (error) {
    console.error('Failed to get game for lobby:', error);
    return NextResponse.json({ gameId: null, status: null });
  }
}
