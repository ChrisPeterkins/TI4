import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  CreateLobbyPayload,
  JoinLobbyPayload,
  LeaveLobbyPayload,
  SelectFactionPayload,
  SelectColorPayload,
  ReadyUpPayload,
  StartGamePayload,
  UpdateSettingsPayload,
  ErrorEvent,
} from '@ti4/shared';
import { getUserId, getUser } from '../../middleware/auth.js';
import * as lobbyRepo from '../../db/repositories/lobby.js';

type TI4Server = Server<ClientToServerEvents, ServerToClientEvents>;
type TI4Socket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Track which lobby each socket is in
const socketLobbyMap = new Map<string, string>();

/**
 * Get lobby room name
 */
function getLobbyRoom(lobbyId: string): string {
  return `lobby:${lobbyId}`;
}

/**
 * Create error response
 */
function createError(code: ErrorEvent['code'], message: string): ErrorEvent {
  return { code, message };
}

/**
 * Register lobby event handlers for a socket
 */
export function registerLobbyHandlers(io: TI4Server, socket: TI4Socket): void {
  const userId = getUserId(socket);
  const user = getUser(socket);

  // Create Lobby
  socket.on('create_lobby', async (data: CreateLobbyPayload, callback) => {
    try {
      const lobby = await lobbyRepo.createLobby(userId, data.settings);

      // Join the socket to the lobby room
      socket.join(getLobbyRoom(lobby.id));
      socketLobbyMap.set(socket.id, lobby.id);

      callback({
        lobbyId: lobby.id,
        code: lobby.code,
        settings: lobby.settings,
        players: lobby.players,
      });

      console.log(`Lobby created: ${lobby.code} by ${user.email || userId}`);
    } catch (error) {
      console.error('Error creating lobby:', error);
      callback(createError('SERVER_ERROR', (error as Error).message));
    }
  });

  // Join Lobby
  socket.on('join_lobby', async (data: JoinLobbyPayload, callback) => {
    try {
      const idOrCode = data.lobbyId || data.code;
      if (!idOrCode) {
        return callback(createError('INVALID_ACTION', 'Lobby ID or code required'));
      }

      const lobby = await lobbyRepo.findLobby(idOrCode);
      if (!lobby) {
        return callback(createError('GAME_NOT_FOUND', 'Lobby not found'));
      }

      const updatedLobby = await lobbyRepo.addPlayerToLobby(lobby.id, userId);
      if (!updatedLobby) {
        return callback(createError('SERVER_ERROR', 'Failed to join lobby'));
      }

      // Join the socket to the lobby room
      socket.join(getLobbyRoom(lobby.id));
      socketLobbyMap.set(socket.id, lobby.id);

      // Notify other players
      socket.to(getLobbyRoom(lobby.id)).emit('lobby_updated', {
        lobbyId: updatedLobby.id,
        code: updatedLobby.code,
        players: updatedLobby.players,
        settings: updatedLobby.settings,
      });

      callback({
        lobbyId: updatedLobby.id,
        code: updatedLobby.code,
        players: updatedLobby.players,
        settings: updatedLobby.settings,
      });

      console.log(`${user.email || userId} joined lobby ${lobby.code}`);
    } catch (error) {
      console.error('Error joining lobby:', error);
      callback(createError('SERVER_ERROR', (error as Error).message));
    }
  });

  // Leave Lobby
  socket.on('leave_lobby', async (data: LeaveLobbyPayload) => {
    try {
      const updatedLobby = await lobbyRepo.removePlayerFromLobby(data.lobbyId, userId);

      socket.leave(getLobbyRoom(data.lobbyId));
      socketLobbyMap.delete(socket.id);

      if (updatedLobby) {
        // Notify remaining players
        io.to(getLobbyRoom(data.lobbyId)).emit('lobby_updated', {
          lobbyId: updatedLobby.id,
          code: updatedLobby.code,
          players: updatedLobby.players,
          settings: updatedLobby.settings,
        });
      } else {
        // Lobby was closed (host left)
        io.to(getLobbyRoom(data.lobbyId)).emit('error', {
          code: 'INVALID_STATE',
          message: 'Lobby closed by host',
        });
      }

      console.log(`${user.email || userId} left lobby ${data.lobbyId}`);
    } catch (error) {
      console.error('Error leaving lobby:', error);
    }
  });

  // Select Faction
  socket.on('select_faction', async (data: SelectFactionPayload) => {
    try {
      const updatedLobby = await lobbyRepo.selectFaction(
        data.lobbyId,
        userId,
        data.factionId
      );

      if (updatedLobby) {
        io.to(getLobbyRoom(data.lobbyId)).emit('lobby_updated', {
          lobbyId: updatedLobby.id,
          code: updatedLobby.code,
          players: updatedLobby.players,
          settings: updatedLobby.settings,
        });
      }
    } catch (error) {
      console.error('Error selecting faction:', error);
      socket.emit('error', createError('INVALID_ACTION', (error as Error).message));
    }
  });

  // Select Color
  socket.on('select_color', async (data: SelectColorPayload) => {
    try {
      const updatedLobby = await lobbyRepo.selectColor(
        data.lobbyId,
        userId,
        data.color
      );

      if (updatedLobby) {
        io.to(getLobbyRoom(data.lobbyId)).emit('lobby_updated', {
          lobbyId: updatedLobby.id,
          code: updatedLobby.code,
          players: updatedLobby.players,
          settings: updatedLobby.settings,
        });
      }
    } catch (error) {
      console.error('Error selecting color:', error);
      socket.emit('error', createError('INVALID_ACTION', (error as Error).message));
    }
  });

  // Ready Up
  socket.on('ready_up', async (data: ReadyUpPayload) => {
    try {
      const updatedLobby = await lobbyRepo.setPlayerReady(
        data.lobbyId,
        userId,
        data.ready
      );

      if (updatedLobby) {
        io.to(getLobbyRoom(data.lobbyId)).emit('lobby_updated', {
          lobbyId: updatedLobby.id,
          code: updatedLobby.code,
          players: updatedLobby.players,
          settings: updatedLobby.settings,
        });

        // Also emit player_ready for animation purposes
        io.to(getLobbyRoom(data.lobbyId)).emit('player_ready', {
          playerId: userId,
          ready: data.ready,
        });
      }
    } catch (error) {
      console.error('Error updating ready status:', error);
      socket.emit('error', createError('INVALID_ACTION', (error as Error).message));
    }
  });

  // Update Settings (host only)
  socket.on('update_settings', async (data: UpdateSettingsPayload) => {
    try {
      const updatedLobby = await lobbyRepo.updateLobbySettings(
        data.lobbyId,
        userId,
        data.settings
      );

      if (updatedLobby) {
        io.to(getLobbyRoom(data.lobbyId)).emit('lobby_updated', {
          lobbyId: updatedLobby.id,
          code: updatedLobby.code,
          players: updatedLobby.players,
          settings: updatedLobby.settings,
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      socket.emit('error', createError('UNAUTHORIZED', (error as Error).message));
    }
  });

  // Start Game
  socket.on('start_game', async (data: StartGamePayload, callback) => {
    try {
      const canStart = await lobbyRepo.canStartGame(data.lobbyId, userId);

      if (!canStart.canStart) {
        return callback(createError('INVALID_ACTION', canStart.reason || 'Cannot start game'));
      }

      // Update lobby status to starting
      const lobby = await lobbyRepo.startLobbyGame(data.lobbyId);
      if (!lobby) {
        return callback(createError('SERVER_ERROR', 'Failed to start game'));
      }

      // TODO: Create actual game using GameMachine
      // For now, just emit game_starting event
      const gameId = `game-${Date.now()}`; // Placeholder

      io.to(getLobbyRoom(data.lobbyId)).emit('game_starting', {
        gameId,
        countdown: 3,
      });

      callback({
        gameId,
        countdown: 3,
      });

      console.log(`Game starting for lobby ${data.lobbyId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      callback(createError('SERVER_ERROR', (error as Error).message));
    }
  });

  // Handle disconnect - clean up lobby membership
  socket.on('disconnect', async () => {
    const lobbyId = socketLobbyMap.get(socket.id);
    if (lobbyId) {
      try {
        const updatedLobby = await lobbyRepo.removePlayerFromLobby(lobbyId, userId);
        socketLobbyMap.delete(socket.id);

        if (updatedLobby) {
          io.to(getLobbyRoom(lobbyId)).emit('lobby_updated', {
            lobbyId: updatedLobby.id,
            code: updatedLobby.code,
            players: updatedLobby.players,
            settings: updatedLobby.settings,
          });
        }
      } catch (error) {
        console.error('Error handling disconnect from lobby:', error);
      }
    }
  });
}

/**
 * Get public lobbies (called via HTTP endpoint)
 */
export async function getPublicLobbies() {
  return lobbyRepo.getPublicLobbies();
}
