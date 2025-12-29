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
  AddBotPayload,
  RemoveBotPayload,
  UpdateBotPayload,
  ErrorEvent,
  PlayerColor,
  MiltyDraftState,
  StartDraftPayload,
  MiltyDraftPayload,
} from '@ti4/shared';
import { getUserId, getUser } from '../../middleware/auth.js';
import * as lobbyRepo from '../../db/repositories/lobby.js';
import * as gameRepo from '../../db/repositories/game.js';
import {
  initializeDraft,
  makePick,
  getCurrentPicker,
  getPlayerNeeds,
  getAvailableOptions,
  getFinalAssignments,
} from '../../engine/milty-draft.js';

type TI4Server = Server<ClientToServerEvents, ServerToClientEvents>;
type TI4Socket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Track which lobby each socket is in
const socketLobbyMap = new Map<string, string>();

// Cache for Milty Draft states (lobbyId -> draft state)
const lobbyDraftStates = new Map<string, MiltyDraftState>();

// Map of lobby player IDs to user IDs (for draft)
const lobbyPlayerMappings = new Map<string, Map<string, string>>();

// Track which draft players are bots
const lobbyBotPlayers = new Map<string, Set<string>>();

// Full player info mapping for draft (draftPlayerId -> { id, name, isBot })
interface DraftPlayerInfo {
  id: string;
  name: string;
  isBot: boolean;
}
const lobbyDraftPlayerInfo = new Map<string, Record<string, DraftPlayerInfo>>();

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
 * Make bot picks automatically
 * Bots pick randomly from available options based on what they still need
 */
async function processBotPicks(
  io: TI4Server,
  lobbyId: string,
): Promise<void> {
  const draftState = lobbyDraftStates.get(lobbyId);
  if (!draftState || draftState.phase !== 'drafting') return;

  const playerMapping = lobbyPlayerMappings.get(lobbyId);
  const botPlayers = lobbyBotPlayers.get(lobbyId);
  if (!playerMapping || !botPlayers) return;

  // Check if current picker is a bot
  const currentPicker = getCurrentPicker(draftState);
  if (!currentPicker || !botPlayers.has(currentPicker)) return;

  // Simulate a small delay for bot "thinking"
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Get what the bot needs
  const needs = getPlayerNeeds(draftState, currentPicker);
  const available = getAvailableOptions(draftState);

  // Determine what to pick
  let pickType: 'faction' | 'slice' | 'speaker';
  let pickValue: string | number;

  // Pick randomly based on what's needed (prioritize faction > slice > speaker)
  if (needs.needsFaction && available.factions.length > 0) {
    pickType = 'faction';
    pickValue = available.factions[Math.floor(Math.random() * available.factions.length)];
  } else if (needs.needsSlice && available.slices.length > 0) {
    pickType = 'slice';
    pickValue = available.slices[Math.floor(Math.random() * available.slices.length)];
  } else if (needs.needsSpeaker && available.speakerPositions.length > 0) {
    pickType = 'speaker';
    pickValue = available.speakerPositions[Math.floor(Math.random() * available.speakerPositions.length)];
  } else {
    console.error('Bot has nothing to pick');
    return;
  }

  // Make the pick
  const result = makePick(draftState, currentPicker, pickType, pickValue);
  if (!result.success) {
    console.error('Bot pick failed:', result.error);
    return;
  }

  // Update cached state
  lobbyDraftStates.set(lobbyId, result.draftState);

  const lastPick = result.draftState.picks[result.draftState.picks.length - 1];
  const playerInfoMapping = lobbyDraftPlayerInfo.get(lobbyId) || {};

  // Broadcast update
  io.to(getLobbyRoom(lobbyId)).emit('draft_updated', {
    lobbyId,
    draftState: result.draftState,
    lastPick,
    playerMapping: playerInfoMapping,
  });

  console.log(`Bot ${currentPicker} picked ${pickType}: ${pickValue}`);

  // Check if draft is complete
  if (result.draftState.phase === 'complete') {
    await handleDraftComplete(io, lobbyId, result.draftState, playerMapping);
  } else {
    // Continue with next bot if needed
    await processBotPicks(io, lobbyId);
  }
}

/**
 * Handle draft completion - update players and start game
 */
async function handleDraftComplete(
  io: TI4Server,
  lobbyId: string,
  draftState: MiltyDraftState,
  playerMapping: Map<string, string>
): Promise<void> {
  const assignments = getFinalAssignments(draftState);

  // Convert draft player IDs back to real user IDs
  const realAssignments = assignments.map(a => ({
    ...a,
    playerId: playerMapping.get(a.playerId) || a.playerId,
  }));

  console.log(`[Draft] Emitting draft_complete for lobby ${lobbyId}`);
  io.to(getLobbyRoom(lobbyId)).emit('draft_complete', {
    lobbyId,
    playerAssignments: realAssignments,
  });

  // Clean up draft state
  lobbyDraftStates.delete(lobbyId);
  lobbyPlayerMappings.delete(lobbyId);
  lobbyBotPlayers.delete(lobbyId);
  lobbyDraftPlayerInfo.delete(lobbyId);

  console.log(`[Draft] Milty Draft completed for lobby ${lobbyId}, starting game creation...`);

  // Auto-start game after draft completes
  try {
    // Update lobby players with drafted factions
    for (const assignment of realAssignments) {
      await lobbyRepo.updatePlayerFaction(lobbyId, assignment.playerId, assignment.faction);
    }

    // Get the updated lobby with player info
    const lobby = await lobbyRepo.getLobbyWithPlayers(lobbyId);
    if (lobby) {
      // Start the game
      const updatedLobby = await lobbyRepo.startLobbyGame(lobbyId);
      if (updatedLobby) {
        // Sort assignments by speaker position (seat order)
        const sortedAssignments = [...realAssignments].sort((a, b) => a.speakerPosition - b.speakerPosition);

        // Find who drafted speaker position (position 0) - they will be the speaker
        const speakerAssignment = sortedAssignments.find(a => a.speakerPosition === 0);
        const speakerIndex = speakerAssignment ? sortedAssignments.indexOf(speakerAssignment) : 0;

        // Create actual game using drafted factions
        const game = await gameRepo.createGameFromLobby({
          lobbyId,
          players: sortedAssignments.map((assignment, index) => {
            const lobbyPlayer = lobby.players.find(p => p.id === assignment.playerId);
            return {
              userId: lobbyPlayer?.isBot ? null : assignment.playerId,
              name: lobbyPlayer?.name || `Player ${index + 1}`,
              factionId: assignment.faction,
              color: (lobbyPlayer?.color || 'blue') as PlayerColor,
              seatIndex: assignment.speakerPosition,
              isBot: lobbyPlayer?.isBot ?? false,
            };
          }),
          victoryPoints: lobby.settings.victoryPoints,
          expansions: lobby.settings.expansions,
          speakerIndex, // Speaker is whoever drafted position 0
          fromDraft: true, // Start in strategy phase
        });

        console.log(`[Draft] Game created with ID ${game.gameId}, emitting game_starting event...`);

        // Emit game_starting event
        io.to(getLobbyRoom(lobbyId)).emit('game_starting', {
          gameId: game.gameId,
          countdown: 3,
        });

        console.log(`[Draft] Game ${game.gameId} auto-started after Milty Draft for lobby ${lobbyId}`);
      }
    }
  } catch (gameError) {
    console.error('Error auto-starting game after draft:', gameError);
    // Notify clients of the error
    io.to(getLobbyRoom(lobbyId)).emit('error', {
      code: 'SERVER_ERROR' as const,
      message: `Failed to start game: ${(gameError as Error).message}`,
    });
  }
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

  // Add Bot (host only)
  socket.on('add_bot', async (data: AddBotPayload) => {
    try {
      // Verify user is host
      const lobby = await lobbyRepo.getLobbyWithPlayers(data.lobbyId);
      if (!lobby || lobby.hostId !== userId) {
        socket.emit('error', createError('UNAUTHORIZED', 'Only the host can add bots'));
        return;
      }

      const botNumber = lobby.players.filter(p => p.isBot).length + 1;
      const botName = data.botName || `Bot ${botNumber}`;

      const updatedLobby = await lobbyRepo.addBotToLobby(
        data.lobbyId,
        botName,
        data.factionId,
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

      console.log(`Bot "${botName}" added to lobby ${data.lobbyId}`);
    } catch (error) {
      console.error('Error adding bot:', error);
      socket.emit('error', createError('INVALID_ACTION', (error as Error).message));
    }
  });

  // Remove Bot (host only)
  socket.on('remove_bot', async (data: RemoveBotPayload) => {
    try {
      // Verify user is host
      const lobby = await lobbyRepo.getLobbyWithPlayers(data.lobbyId);
      if (!lobby || lobby.hostId !== userId) {
        socket.emit('error', createError('UNAUTHORIZED', 'Only the host can remove bots'));
        return;
      }

      const updatedLobby = await lobbyRepo.removeBotFromLobby(
        data.lobbyId,
        data.seatIndex
      );

      if (updatedLobby) {
        io.to(getLobbyRoom(data.lobbyId)).emit('lobby_updated', {
          lobbyId: updatedLobby.id,
          code: updatedLobby.code,
          players: updatedLobby.players,
          settings: updatedLobby.settings,
        });
      }

      console.log(`Bot removed from seat ${data.seatIndex} in lobby ${data.lobbyId}`);
    } catch (error) {
      console.error('Error removing bot:', error);
      socket.emit('error', createError('INVALID_ACTION', (error as Error).message));
    }
  });

  // Update Bot (host only)
  socket.on('update_bot', async (data: UpdateBotPayload) => {
    try {
      // Verify user is host
      const lobby = await lobbyRepo.getLobbyWithPlayers(data.lobbyId);
      if (!lobby || lobby.hostId !== userId) {
        socket.emit('error', createError('UNAUTHORIZED', 'Only the host can update bots'));
        return;
      }

      const updatedLobby = await lobbyRepo.updateBot(
        data.lobbyId,
        data.seatIndex,
        {
          botName: data.botName,
          factionId: data.factionId,
          color: data.color,
        }
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
      console.error('Error updating bot:', error);
      socket.emit('error', createError('INVALID_ACTION', (error as Error).message));
    }
  });

  // Start Milty Draft (host only)
  socket.on('start_draft', async (data: StartDraftPayload, callback) => {
    try {
      const lobby = await lobbyRepo.getLobbyWithPlayers(data.lobbyId);
      if (!lobby) {
        return callback(createError('GAME_NOT_FOUND', 'Lobby not found'));
      }

      if (lobby.hostId !== userId) {
        return callback(createError('UNAUTHORIZED', 'Only the host can start the draft'));
      }

      if (!lobby.settings.miltyDraft) {
        return callback(createError('INVALID_ACTION', 'Milty Draft is not enabled'));
      }

      if (lobby.players.length < 3) {
        return callback(createError('INVALID_ACTION', 'Need at least 3 players'));
      }

      // Create player ID mapping (use index-based IDs for draft)
      const playerMapping = new Map<string, string>();
      const botPlayers = new Set<string>();
      const playerIds: string[] = [];
      const playerInfoMapping: Record<string, DraftPlayerInfo> = {};

      for (let i = 0; i < lobby.players.length; i++) {
        const draftPlayerId = `player_${i}`;
        const lobbyPlayer = lobby.players[i];
        playerIds.push(draftPlayerId);
        playerMapping.set(draftPlayerId, lobbyPlayer.id);

        // Store full player info for client display
        playerInfoMapping[draftPlayerId] = {
          id: lobbyPlayer.id,
          name: lobbyPlayer.name,
          isBot: lobbyPlayer.isBot ?? false,
        };

        // Track which draft players are bots
        if (lobbyPlayer.isBot) {
          botPlayers.add(draftPlayerId);
        }
      }
      lobbyPlayerMappings.set(data.lobbyId, playerMapping);
      lobbyBotPlayers.set(data.lobbyId, botPlayers);
      lobbyDraftPlayerInfo.set(data.lobbyId, playerInfoMapping);

      // Initialize draft
      const draftState = initializeDraft(
        lobby.players.length,
        playerIds,
        lobby.settings.expansions
      );

      lobbyDraftStates.set(data.lobbyId, draftState);

      // Broadcast to all players
      io.to(getLobbyRoom(data.lobbyId)).emit('draft_started', {
        lobbyId: data.lobbyId,
        draftState,
        playerMapping: playerInfoMapping,
      });

      callback({
        lobbyId: data.lobbyId,
        draftState,
        playerMapping: playerInfoMapping,
      });

      console.log(`Milty Draft started for lobby ${data.lobbyId}`);

      // Start bot picks if first picker is a bot
      setTimeout(() => processBotPicks(io, data.lobbyId), 1000);
    } catch (error) {
      console.error('Error starting draft:', error);
      callback(createError('SERVER_ERROR', (error as Error).message));
    }
  });

  // Make Draft Pick
  socket.on('make_draft_pick', async (data: MiltyDraftPayload, callback) => {
    try {
      const draftState = lobbyDraftStates.get(data.lobbyId);
      if (!draftState) {
        return callback(createError('INVALID_STATE', 'No active draft'));
      }

      const playerMapping = lobbyPlayerMappings.get(data.lobbyId);
      if (!playerMapping) {
        return callback(createError('INVALID_STATE', 'Draft player mapping not found'));
      }

      // Find draft player ID for this user
      let draftPlayerId: string | null = null;
      for (const [draftId, realUserId] of playerMapping.entries()) {
        if (realUserId === userId) {
          draftPlayerId = draftId;
          break;
        }
      }

      if (!draftPlayerId) {
        return callback(createError('UNAUTHORIZED', 'You are not in this draft'));
      }

      // Make the pick
      const result = makePick(draftState, draftPlayerId, data.pickType, data.value);

      if (!result.success) {
        return callback(createError('INVALID_ACTION', result.error || 'Invalid pick'));
      }

      // Update cached state
      lobbyDraftStates.set(data.lobbyId, result.draftState);

      const lastPick = result.draftState.picks[result.draftState.picks.length - 1];
      const playerInfoMapping = lobbyDraftPlayerInfo.get(data.lobbyId) || {};

      // Broadcast update
      io.to(getLobbyRoom(data.lobbyId)).emit('draft_updated', {
        lobbyId: data.lobbyId,
        draftState: result.draftState,
        lastPick,
        playerMapping: playerInfoMapping,
      });

      callback({
        lobbyId: data.lobbyId,
        draftState: result.draftState,
        lastPick,
        playerMapping: playerInfoMapping,
      });

      // Check if draft is complete
      if (result.draftState.phase === 'complete') {
        await handleDraftComplete(io, data.lobbyId, result.draftState, playerMapping);
      } else {
        // Process bot picks if next picker is a bot
        setTimeout(() => processBotPicks(io, data.lobbyId), 500);
      }
    } catch (error) {
      console.error('Error making draft pick:', error);
      callback(createError('SERVER_ERROR', (error as Error).message));
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

      // Create actual game using GameMachine
      const game = await gameRepo.createGameFromLobby({
        lobbyId: data.lobbyId,
        players: lobby.players.map((p, index) => ({
          userId: p.isBot ? null : p.id,
          name: p.name,
          factionId: p.faction!,
          color: p.color as PlayerColor,
          seatIndex: p.seatIndex ?? index,
          isBot: p.isBot ?? false,
        })),
        victoryPoints: lobby.settings.victoryPoints,
        expansions: lobby.settings.expansions,
      });

      // Emit game_starting event to all lobby players
      io.to(getLobbyRoom(data.lobbyId)).emit('game_starting', {
        gameId: game.gameId,
        countdown: 3,
      });

      callback({
        gameId: game.gameId,
        countdown: 3,
      });

      console.log(`Game ${game.gameId} started for lobby ${data.lobbyId}`);
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
