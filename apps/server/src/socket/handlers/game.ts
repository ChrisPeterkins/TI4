import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  GameAction,
} from '@ti4/shared';
import { getUserId, getUser } from '../../middleware/auth.js';
import * as gameRepo from '../../db/repositories/game.js';
import { GameMachine } from '../../engine/game-machine.js';
import { generateBotAction, getBotActionDelay, isBot } from '../../engine/bot-ai.js';

type TI4Server = Server<ClientToServerEvents, ServerToClientEvents>;
type TI4Socket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Track which game each socket is in
const socketGameMap = new Map<string, string>();

// Cache of active game machines
const gameMachines = new Map<string, GameMachine>();

// Cache of bot player IDs per game
const gameBotPlayers = new Map<string, Set<string>>();

// Track pending bot actions to prevent duplicates
const pendingBotActions = new Set<string>();

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
 * Get or load bot player IDs for a game
 */
async function getBotPlayerIds(gameId: string): Promise<Set<string>> {
  // Check cache first
  let botIds = gameBotPlayers.get(gameId);
  if (botIds) {
    return botIds;
  }

  // Load from database
  const game = await gameRepo.getGame(gameId);
  if (!game) {
    return new Set();
  }

  // Find bot players
  botIds = new Set(
    game.players
      .filter(p => p.isBot)
      .map(p => p.playerId)
  );

  gameBotPlayers.set(gameId, botIds);
  return botIds;
}

/**
 * Process bot turn if the active player is a bot
 */
async function processBotTurnIfNeeded(
  io: TI4Server,
  gameId: string,
  machine: GameMachine
): Promise<void> {
  const state = machine.getState();
  const activePlayerId = state.activePlayerId;
  const botIds = await getBotPlayerIds(gameId);

  // Check if active player is a bot
  if (!isBot(state, activePlayerId, botIds)) {
    return;
  }

  // Prevent duplicate bot actions
  const actionKey = `${gameId}:${activePlayerId}:${state.version}`;
  if (pendingBotActions.has(actionKey)) {
    return;
  }
  pendingBotActions.add(actionKey);

  // Add delay to make it feel more natural
  const delay = getBotActionDelay('medium');

  setTimeout(async () => {
    try {
      // Re-check state hasn't changed
      const currentState = machine.getState();
      if (currentState.activePlayerId !== activePlayerId) {
        pendingBotActions.delete(actionKey);
        return;
      }

      // Generate bot action
      const action = generateBotAction(currentState, activePlayerId);
      if (!action) {
        pendingBotActions.delete(actionKey);
        return;
      }

      console.log(`Bot ${activePlayerId} performing action: ${action.type}`);

      // Process the action
      const result = machine.processAction(action);

      if (result.success) {
        const newState = machine.getState();

        // Persist the new state
        await gameRepo.updateGameState(gameId, newState, {
          playerId: activePlayerId,
          type: action.type,
          data: action,
        });

        // Broadcast state update
        io.to(getGameRoom(gameId)).emit('game_state', { state: newState });

        console.log(`Bot action completed: ${action.type}`);

        // Check if next player is also a bot
        await processBotTurnIfNeeded(io, gameId, machine);
      } else {
        console.error(`Bot action failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing bot turn:', error);
    } finally {
      pendingBotActions.delete(actionKey);
    }
  }, delay);
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

      // Get game player info (also verifies user is a player)
      const gamePlayer = await gameRepo.getGamePlayer(gameId, userId);
      if (!gamePlayer) {
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

      // Send joined_game response with playerId and game state
      socket.emit('joined_game', {
        success: true,
        gameState: game.state,
        playerId: gamePlayer.playerId,
      });

      // Notify other players
      socket.to(getGameRoom(gameId)).emit('player_reconnected', {
        playerId: gamePlayer.playerId,
      });

      console.log(`${user.email || userId} joined game ${gameId} as ${gamePlayer.playerId}`);

      // Check if current active player is a bot (trigger bot turns)
      const machine = await getGameMachine(gameId);
      if (machine) {
        await processBotTurnIfNeeded(io, gameId, machine);
      }
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

      // Check if next player is a bot and process their turn
      await processBotTurnIfNeeded(io, gameId, machine);
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

  // Chat Message
  socket.on('chat_message', async (data) => {
    try {
      const { gameId, message, targetPlayerId } = data;

      // Get game player info
      const gamePlayer = await gameRepo.getGamePlayer(gameId, userId);
      if (!gamePlayer) {
        socket.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'You are not a player in this game',
        });
        return;
      }

      // Get the player name
      const game = await gameRepo.getGame(gameId);
      if (!game) {
        socket.emit('error', {
          code: 'GAME_NOT_FOUND',
          message: 'Game not found',
        });
        return;
      }

      const player = game.state.players.find(p => p.id === gamePlayer.playerId);
      const playerName = player?.name || 'Unknown';

      // Create chat message event
      const chatEvent = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        playerId: gamePlayer.playerId,
        playerName,
        message: message.slice(0, 500), // Limit message length
        timestamp: Date.now(),
        isPrivate: !!targetPlayerId,
      };

      if (targetPlayerId) {
        // Private message - send only to sender and target
        // Find the socket(s) for the target player
        const targetGame = await gameRepo.getGamePlayer(gameId, targetPlayerId);
        if (targetGame) {
          // Send to target player (all their sockets in this game room)
          io.to(getGameRoom(gameId)).emit('chat_message', chatEvent);
          // Note: In a more sophisticated implementation, we'd track user->socket mapping
          // and only send to specific sockets. For now, filtering happens on client.
        }
        // Send back to sender
        socket.emit('chat_message', chatEvent);
      } else {
        // Public message - broadcast to all players in the game
        io.to(getGameRoom(gameId)).emit('chat_message', chatEvent);
      }

      console.log(`Chat in game ${gameId}: ${playerName}: ${message.slice(0, 50)}...`);
    } catch (error) {
      console.error('Error sending chat message:', error);
      socket.emit('error', {
        code: 'SERVER_ERROR',
        message: 'Failed to send chat message',
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
  gameBotPlayers.delete(gameId);
}
