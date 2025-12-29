import { prisma, GameStatus, Prisma } from '@ti4/database';
import type { GameState, PlayerColor } from '@ti4/shared';
import { createGame as createGameState, type GameSetupOptions } from '../../engine/game-init.js';

// Helper to convert GameState to Prisma JSON
function toJson(state: GameState): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(state)) as Prisma.InputJsonValue;
}

interface CreateGameFromLobbyOptions {
  lobbyId: string;
  players: {
    userId: string;
    name: string;
    factionId: string;
    color: PlayerColor;
    seatIndex: number;
  }[];
  victoryPoints?: number;
  expansions?: string[];
}

/**
 * Create a new game from a lobby
 */
export async function createGameFromLobby(options: CreateGameFromLobbyOptions) {
  const { lobbyId, players, victoryPoints, expansions } = options;

  // Create game state using the engine
  const setupOptions: GameSetupOptions = {
    playerSetups: players.map((p) => ({
      userId: p.userId,
      name: p.name,
      factionId: p.factionId,
      color: p.color,
    })),
    victoryPoints,
    expansions,
  };

  const gameState = createGameState(setupOptions);

  // Create game in database
  const game = await prisma.game.create({
    data: {
      lobbyId,
      state: toJson(gameState),
      stateVersion: gameState.version,
      round: gameState.round,
      phase: gameState.phase,
      startedAt: new Date(),
      players: {
        create: players.map((p, index) => {
          // Find the player ID in the game state
          const gamePlayer = gameState.players[index];
          return {
            userId: p.userId,
            playerId: gamePlayer.id,
            factionId: p.factionId,
            color: p.color,
            seatIndex: p.seatIndex,
            connected: true,
            lastSeenAt: new Date(),
          };
        }),
      },
    },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Update lobby status
  await prisma.lobby.update({
    where: { id: lobbyId },
    data: { status: 'IN_GAME' },
  });

  return {
    gameId: game.id,
    gameState,
    players: game.players,
  };
}

/**
 * Get game by ID
 */
export async function getGame(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!game) return null;

  return {
    id: game.id,
    lobbyId: game.lobbyId,
    status: game.status,
    stateVersion: game.stateVersion,
    state: game.state as unknown as GameState,
    players: game.players,
    createdAt: game.createdAt,
    startedAt: game.startedAt,
  };
}

/**
 * Get game state
 */
export async function getGameState(gameId: string): Promise<GameState | null> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { state: true },
  });

  return game ? (game.state as unknown as GameState) : null;
}

/**
 * Update game state
 */
export async function updateGameState(
  gameId: string,
  newState: GameState,
  action?: { playerId: string; type: string; data: unknown }
) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { stateVersion: true },
  });

  if (!game) {
    throw new Error('Game not found');
  }

  const previousVersion = game.stateVersion;

  // Update game state
  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: {
      state: toJson(newState),
      stateVersion: newState.version,
      round: newState.round,
      phase: newState.phase,
      winnerId: newState.winner,
      status: newState.winner ? GameStatus.COMPLETED : undefined,
      endedAt: newState.winner ? new Date() : undefined,
    },
  });

  // Record action if provided
  if (action) {
    await prisma.gameAction.create({
      data: {
        gameId,
        playerId: action.playerId,
        actionType: action.type,
        actionData: action.data as Prisma.InputJsonValue,
        stateVersionBefore: previousVersion,
        stateVersionAfter: newState.version,
      },
    });
  }

  return updatedGame;
}

/**
 * Create a game snapshot
 */
export async function createGameSnapshot(gameId: string, state: GameState) {
  return prisma.gameSnapshot.create({
    data: {
      gameId,
      stateVersion: state.version,
      state: toJson(state),
      round: state.round,
      phase: state.phase,
    },
  });
}

/**
 * Update player connection status
 */
export async function updatePlayerConnection(
  gameId: string,
  userId: string,
  connected: boolean
) {
  return prisma.gamePlayer.updateMany({
    where: { gameId, userId },
    data: {
      connected,
      lastSeenAt: new Date(),
    },
  });
}

/**
 * Get player by user ID in a game
 */
export async function getGamePlayer(gameId: string, userId: string) {
  return prisma.gamePlayer.findUnique({
    where: {
      gameId_userId: { gameId, userId },
    },
  });
}

/**
 * Check if user is a player in the game
 */
export async function isPlayerInGame(gameId: string, userId: string): Promise<boolean> {
  const player = await prisma.gamePlayer.findUnique({
    where: {
      gameId_userId: { gameId, userId },
    },
  });
  return !!player;
}

/**
 * Get game actions for replay
 */
export async function getGameActions(
  gameId: string,
  fromVersion?: number,
  limit = 100
) {
  return prisma.gameAction.findMany({
    where: {
      gameId,
      stateVersionAfter: fromVersion ? { gt: fromVersion } : undefined,
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

/**
 * Get the latest snapshot before a version
 */
export async function getSnapshotBeforeVersion(gameId: string, version: number) {
  return prisma.gameSnapshot.findFirst({
    where: {
      gameId,
      stateVersion: { lte: version },
    },
    orderBy: { stateVersion: 'desc' },
  });
}

/**
 * Get active games for a user
 */
export async function getActiveGamesForUser(userId: string) {
  const gamePlayers = await prisma.gamePlayer.findMany({
    where: { userId },
    include: {
      game: {
        select: {
          id: true,
          status: true,
          round: true,
          phase: true,
          createdAt: true,
          players: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return gamePlayers
    .filter((gp) => gp.game.status === GameStatus.IN_PROGRESS)
    .map((gp) => ({
      gameId: gp.game.id,
      round: gp.game.round,
      phase: gp.game.phase,
      playerCount: gp.game.players.length,
      myFaction: gp.factionId,
      createdAt: gp.game.createdAt,
    }));
}
