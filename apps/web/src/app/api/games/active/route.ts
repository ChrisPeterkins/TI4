import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, GameStatus } from '@ti4/database';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json([], { status: 200 });
    }

    const gamePlayers = await prisma.gamePlayer.findMany({
      where: { userId: session.user.id },
      include: {
        game: {
          select: {
            id: true,
            status: true,
            round: true,
            phase: true,
            createdAt: true,
            players: {
              select: {
                factionId: true,
              },
            },
          },
        },
      },
    });

    const activeGames = gamePlayers
      .filter((gp) => gp.game.status === GameStatus.IN_PROGRESS)
      .map((gp) => ({
        gameId: gp.game.id,
        round: gp.game.round,
        phase: gp.game.phase,
        playerCount: gp.game.players.length,
        myFaction: gp.factionId,
        createdAt: gp.game.createdAt.toISOString(),
      }));

    return NextResponse.json(activeGames);
  } catch (error) {
    console.error('Failed to fetch active games:', error);
    return NextResponse.json([], { status: 200 });
  }
}
