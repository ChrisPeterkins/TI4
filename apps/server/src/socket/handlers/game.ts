import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  GameAction,
} from '@ti4/shared';
import { getUserId, getUser } from '../../middleware/auth.js';
import * as gameRepo from '../../db/repositories/game.js';
import { GameMachine } from '../../engine/game-machine.js';

type TI4Server = Server<ClientToServerEvents, ServerToClientEvents>;
type TI4Socket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Track which game each socket is in
const socketGameMap = new Map<string, string>();

// Cache of active game machines
const gameMachines = new Map<string, GameMachine>();

/**
 * Get game room name
 */
function getGameRoom(gameId: string): string {
  return `game:${gameId}`;
}

/**
 * Get or create a GameMachine for a game
 */
async function getGameMachine(gameId: string): Promise<GameMachine | null> {
  // Check cache first
  let machine = gameMachines.get(gameId);
  if (machine) {
    return machine;
  }

  // Load game state from database
  const gameState = await gameRepo.getGameState(gameId);
  if (!gameState) {
    return null;
  }

  // Create new machine with loaded state
  machine = new GameMachine(gameState);
  gameMachines.set(gameId, machine);

  return machine;
}

/**
 * Register game event handlers for a socket
 */
export function registerGameHandlers(io: TI4Server, socket: TI4Socket): void {
  const userId = getUserId(socket);
  const user = getUser(socket);

  // Join Game
  socket.on('join_game', async (data) => {
    try {
      const { gameId } = data;

      // Verify user is a player in this game
      const isPlayer = await gameRepo.isPlayerInGame(gameId, userId);
      if (!isPlayer) {
        socket.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'You are not a player in this game',
        });
        return;
      }

      // Join the game room
      socket.join(getGameRoom(gameId));
      socketGameMap.set(socket.id, gameId);

      // Update connection status
      await gameRepo.updatePlayerConnection(gameId, userId, true);

      // Get game state
      const game = await gameRepo.getGame(gameId);
      if (!game) {
        socket.emit('error', {
          code: 'GAME_NOT_FOUND',
          message: 'Game not found',
        });
        return;
      }

      // Send current game state to the joining player
      socket.emit('game_state', { state: game.state });

      // Notify other players
      socket.to(getGameRoom(gameId)).emit('player_reconnected', {
        playerId: userId,
      });

      console.log(`${user.email || userId} joined game ${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
      socket.emit('error', {
        code: 'SERVER_ERROR',
        message: 'Failed to join game',
      });
    }
  });

  // Leave Game
  socket.on('leave_game', async (data) => {
    try {
      const { gameId } = data;

      socket.leave(getGameRoom(gameId));
      socketGameMap.delete(socket.id);

      // Update connection status
      await gameRepo.updatePlayerConnection(gameId, userId, false);

      // Notify other players
      socket.to(getGameRoom(gameId)).emit('player_left', {
        playerId: userId,
      });

      console.log(`${user.email || userId} left game ${gameId}`);
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  });

  // Game Action
  socket.on('game_action', async (data) => {
    try {
      const { gameId, action } = data;

      // Get game player info
      const gamePlayer = await gameRepo.getGamePlayer(gameId, userId);
      if (!gamePlayer) {
        socket.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'You are not a player in this game',
        });
        return;
      }

      // Get the game machine
      const machine = await getGameMachine(gameId);
      if (!machine) {
        socket.emit('error', {
          code: 'GAME_NOT_FOUND',
          message: 'Game not found',
        });
        return;
      }

      // Validate the action is from the correct player
      if (action.playerId !== gamePlayer.playerId) {
        socket.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Invalid player ID',
        });
        return;
      }

      // Process the action through the game machine
      const result = machine.processAction(action);

      if (!result.success) {
        socket.emit('action_result', {
          actionId: action.timestamp.toString(),
          result,
          newVersion: machine.getState().version,
        });
        return;
      }

      const newState = machine.getState();

      // Persist the new state
      await gameRepo.updateGameState(gameId, newState, {
        playerId: gamePlayer.playerId,
        type: action.type,
        data: action,
      });

      // Create snapshot every 10 versions
      if (newState.version % 10 === 0) {
        await gameRepo.createGameSnapshot(gameId, newState);
      }

      // Broadcast state update to all players in the game
      io.to(getGameRoom(gameId)).emit('game_state', { state: newState });

      // Also emit action result to the player who took the action
      socket.emit('action_result', {
        actionId: action.timestamp.toString(),
        result,
        newVersion: newState.version,
      });

      console.log(`Game ${gameId}: ${action.type} by ${gamePlayer.playerId}`);
    } catch (error) {
      console.error('Error processing game action:', error);
      socket.emit('error', {
        code: 'SERVER_ERROR',
        message: 'Failed to process action',
      });
    }
  });

  // Request State (for reconnection/sync)
  socket.on('request_state', async (data) => {
    try {
      const { gameId, fromVersion } = data;

      const game = await gameRepo.getGame(gameId);
      if (!game) {
        socket.emit('error', {
          code: 'GAME_NOT_FOUND',
          message: 'Game not found',
        });
        return;
      }

      // If client has an old version, send full state
      // In the future, we could send deltas for efficiency
      socket.emit('game_state', { state: game.state });
    } catch (error) {
      console.error('Error requesting state:', error);
      socket.emit('error', {
        code: 'SERVER_ERROR',
        message: 'Failed to get game state',
      });
    }
  });

  // Handle disconnect - clean up game membership
  socket.on('disconnect', async () => {
    const gameId = socketGameMap.get(socket.id);
    if (gameId) {
      try {
        await gameRepo.updatePlayerConnection(gameId, userId, false);
        socketGameMap.delete(socket.id);

        // Notify other players
        io.to(getGameRoom(gameId)).emit('player_left', {
          playerId: userId,
        });
      } catch (error) {
        console.error('Error handling disconnect from game:', error);
      }
    }
  });
}

/**
 * Clear cached game machine (e.g., when game ends)
 */
export function clearGameMachine(gameId: string): void {
  gameMachines.delete(gameId);
}
