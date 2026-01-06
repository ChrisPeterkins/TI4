import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, GameStatus } from '@ti4/database';
import type { GameState } from '@ti4/shared';

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
            state: true,
            createdAt: true,
            updatedAt: true,
            players: {
              select: {
                factionId: true,
                playerId: true,
              },
            },
          },
        },
      },
    });

    const activeGames = gamePlayers
      .filter((gp) => gp.game.status === GameStatus.IN_PROGRESS)
      .map((gp) => {
        const gameState = gp.game.state as unknown as GameState;
        const isMyTurn = gameState?.activePlayerId === gp.playerId;

        return {
          gameId: gp.game.id,
          round: gp.game.round,
          phase: gp.game.phase,
          playerCount: gp.game.players.length,
          myFaction: gp.factionId,
          myPlayerId: gp.playerId,
          isMyTurn,
          createdAt: gp.game.createdAt.toISOString(),
          updatedAt: gp.game.updatedAt.toISOString(),
        };
      });

    return NextResponse.json(activeGames);
  } catch (error) {
    console.error('Failed to fetch active games:', error);
    return NextResponse.json([], { status: 200 });
  }
}
