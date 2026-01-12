import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Server, Socket } from 'socket.io';
import type { PlayerColor } from '@ti4/shared';

// Mock the dependencies before importing the module
vi.mock('../../../middleware/auth.js', () => ({
  getUserId: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('../../../db/repositories/lobby.js', () => ({
  createLobby: vi.fn(),
  findLobby: vi.fn(),
  addPlayerToLobby: vi.fn(),
  removePlayerFromLobby: vi.fn(),
  selectFaction: vi.fn(),
  selectColor: vi.fn(),
  setPlayerReady: vi.fn(),
  updateLobbySettings: vi.fn(),
  getLobbyWithPlayers: vi.fn(),
  addBotToLobby: vi.fn(),
  removeBotFromLobby: vi.fn(),
  updateBot: vi.fn(),
  canStartGame: vi.fn(),
  startLobbyGame: vi.fn(),
  getPublicLobbies: vi.fn(),
  updatePlayerFaction: vi.fn(),
}));

vi.mock('../../../db/repositories/game.js', () => ({
  createGameFromLobby: vi.fn(),
}));

vi.mock('../../../engine/milty-draft.js', () => ({
  initializeDraft: vi.fn(),
  makePick: vi.fn(),
  getCurrentPicker: vi.fn(),
  getPlayerNeeds: vi.fn(),
  getAvailableOptions: vi.fn(),
  getFinalAssignments: vi.fn(),
}));

import { registerLobbyHandlers, getPublicLobbies } from '../lobby.js';
import * as authMiddleware from '../../../middleware/auth.js';
import * as lobbyRepo from '../../../db/repositories/lobby.js';
import * as gameRepo from '../../../db/repositories/game.js';
import * as miltyDraft from '../../../engine/milty-draft.js';

// Helper to create mock socket with callback support
function createMockSocket(): Socket & {
  emittedEvents: Array<{ event: string; data: unknown }>;
  joinedRooms: string[];
  leftRooms: string[];
  handlers: Map<string, Function>;
} {
  const emittedEvents: Array<{ event: string; data: unknown }> = [];
  const joinedRooms: string[] = [];
  const leftRooms: string[] = [];
  const handlers = new Map<string, Function>();

  return {
    id: 'socket-123',
    emit: vi.fn((event: string, data: unknown) => {
      emittedEvents.push({ event, data });
      return true;
    }),
    join: vi.fn((room: string) => {
      joinedRooms.push(room);
    }),
    leave: vi.fn((room: string) => {
      leftRooms.push(room);
    }),
    to: vi.fn().mockReturnValue({
      emit: vi.fn(),
    }),
    on: vi.fn((event: string, handler: Function) => {
      handlers.set(event, handler);
    }),
    emittedEvents,
    joinedRooms,
    leftRooms,
    handlers,
  } as unknown as Socket & {
    emittedEvents: Array<{ event: string; data: unknown }>;
    joinedRooms: string[];
    leftRooms: string[];
    handlers: Map<string, Function>;
  };
}

// Helper to create mock server
function createMockServer(): Server & {
  emittedEvents: Array<{ room: string; event: string; data: unknown }>;
} {
  const emittedEvents: Array<{ room: string; event: string; data: unknown }> = [];
  let currentRoom = '';

  return {
    to: vi.fn((room: string) => {
      currentRoom = room;
      return {
        emit: vi.fn((event: string, data: unknown) => {
          emittedEvents.push({ room: currentRoom, event, data });
          return true;
        }),
      };
    }),
    emittedEvents,
  } as unknown as Server & {
    emittedEvents: Array<{ room: string; event: string; data: unknown }>;
  };
}

function createMockLobby(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lobby-123',
    code: 'ABC123',
    hostId: 'user-123',
    status: 'WAITING',
    settings: {
      victoryPoints: 10,
      expansions: ['base', 'pok'],
      miltyDraft: false,
    },
    players: [
      {
        id: 'user-123',
        name: 'Host Player',
        faction: 'sol',
        color: 'blue' as PlayerColor,
        seatIndex: 0,
        isReady: false,
        isBot: false,
      },
    ],
    ...overrides,
  };
}

describe('Lobby Socket Handlers', () => {
  let mockSocket: ReturnType<typeof createMockSocket>;
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockServer = createMockServer();

    // Default auth mock
    vi.mocked(authMiddleware.getUserId).mockReturnValue('user-123');
    vi.mocked(authMiddleware.getUser).mockReturnValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    });

    // Register handlers
    registerLobbyHandlers(mockServer as unknown as Server, mockSocket as unknown as Socket);
  });

  describe('create_lobby event', () => {
    it('should create lobby and join room', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.createLobby).mockResolvedValue(mockLobby as any);

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('create_lobby');
      await handler!({ settings: { victoryPoints: 10, expansions: ['base'] } }, callback);

      expect(lobbyRepo.createLobby).toHaveBeenCalledWith('user-123', {
        victoryPoints: 10,
        expansions: ['base'],
      });
      expect(mockSocket.join).toHaveBeenCalledWith('lobby:lobby-123');
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        lobbyId: 'lobby-123',
        code: 'ABC123',
      }));
    });

    it('should return error on failure', async () => {
      vi.mocked(lobbyRepo.createLobby).mockRejectedValue(new Error('Database error'));

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('create_lobby');
      await handler!({ settings: {} }, callback);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        code: 'SERVER_ERROR',
        message: 'Database error',
      }));
    });
  });

  describe('join_lobby event', () => {
    it('should require lobby ID or code', async () => {
      const callback = vi.fn();
      const handler = mockSocket.handlers.get('join_lobby');
      await handler!({}, callback);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INVALID_ACTION',
        message: 'Lobby ID or code required',
      }));
    });

    it('should return error when lobby not found', async () => {
      vi.mocked(lobbyRepo.findLobby).mockResolvedValue(null);

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('join_lobby');
      await handler!({ code: 'INVALID' }, callback);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        code: 'GAME_NOT_FOUND',
        message: 'Lobby not found',
      }));
    });

    it('should join lobby successfully by code', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.findLobby).mockResolvedValue(mockLobby as any);
      vi.mocked(lobbyRepo.addPlayerToLobby).mockResolvedValue(mockLobby as any);

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('join_lobby');
      await handler!({ code: 'ABC123' }, callback);

      expect(mockSocket.join).toHaveBeenCalledWith('lobby:lobby-123');
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        lobbyId: 'lobby-123',
      }));
    });

    it('should join lobby successfully by ID', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.findLobby).mockResolvedValue(mockLobby as any);
      vi.mocked(lobbyRepo.addPlayerToLobby).mockResolvedValue(mockLobby as any);

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('join_lobby');
      await handler!({ lobbyId: 'lobby-123' }, callback);

      expect(mockSocket.join).toHaveBeenCalledWith('lobby:lobby-123');
    });

    it('should notify other players when joining', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.findLobby).mockResolvedValue(mockLobby as any);
      vi.mocked(lobbyRepo.addPlayerToLobby).mockResolvedValue(mockLobby as any);

      const toEmit = vi.fn().mockReturnValue({ emit: vi.fn() });
      mockSocket.to = toEmit;

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('join_lobby');
      await handler!({ lobbyId: 'lobby-123' }, callback);

      expect(toEmit).toHaveBeenCalledWith('lobby:lobby-123');
    });
  });

  describe('leave_lobby event', () => {
    it('should leave lobby and notify others', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.removePlayerFromLobby).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('leave_lobby');
      await handler!({ lobbyId: 'lobby-123' });

      expect(mockSocket.leave).toHaveBeenCalledWith('lobby:lobby-123');
      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
    });

    it('should notify when lobby closed (host left)', async () => {
      vi.mocked(lobbyRepo.removePlayerFromLobby).mockResolvedValue(null);

      const handler = mockSocket.handlers.get('leave_lobby');
      await handler!({ lobbyId: 'lobby-123' });

      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
    });
  });

  describe('select_faction event', () => {
    it('should update faction and broadcast', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.selectFaction).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('select_faction');
      await handler!({ lobbyId: 'lobby-123', factionId: 'hacan' });

      expect(lobbyRepo.selectFaction).toHaveBeenCalledWith('lobby-123', 'user-123', 'hacan');
      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
    });

    it('should emit error on failure', async () => {
      vi.mocked(lobbyRepo.selectFaction).mockRejectedValue(new Error('Faction taken'));

      const handler = mockSocket.handlers.get('select_faction');
      await handler!({ lobbyId: 'lobby-123', factionId: 'hacan' });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', expect.objectContaining({
        code: 'INVALID_ACTION',
      }));
    });
  });

  describe('select_color event', () => {
    it('should update color and broadcast', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.selectColor).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('select_color');
      await handler!({ lobbyId: 'lobby-123', color: 'red' });

      expect(lobbyRepo.selectColor).toHaveBeenCalledWith('lobby-123', 'user-123', 'red');
      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
    });
  });

  describe('ready_up event', () => {
    it('should update ready status and broadcast', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.setPlayerReady).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('ready_up');
      await handler!({ lobbyId: 'lobby-123', ready: true });

      expect(lobbyRepo.setPlayerReady).toHaveBeenCalledWith('lobby-123', 'user-123', true);
      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
    });

    it('should emit player_ready event', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.setPlayerReady).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('ready_up');
      await handler!({ lobbyId: 'lobby-123', ready: true });

      // Should emit both lobby_updated and player_ready
      expect(mockServer.to).toHaveBeenCalled();
    });
  });

  describe('update_settings event', () => {
    it('should update settings and broadcast', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.updateLobbySettings).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('update_settings');
      await handler!({
        lobbyId: 'lobby-123',
        settings: { victoryPoints: 14 },
      });

      expect(lobbyRepo.updateLobbySettings).toHaveBeenCalledWith(
        'lobby-123',
        'user-123',
        { victoryPoints: 14 }
      );
      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
    });
  });

  describe('add_bot event', () => {
    it('should reject if not host', async () => {
      const mockLobby = createMockLobby({ hostId: 'other-user' });
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('add_bot');
      await handler!({ lobbyId: 'lobby-123' });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', expect.objectContaining({
        code: 'UNAUTHORIZED',
        message: 'Only the host can add bots',
      }));
    });

    it('should add bot and broadcast', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);
      vi.mocked(lobbyRepo.addBotToLobby).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('add_bot');
      await handler!({
        lobbyId: 'lobby-123',
        botName: 'Test Bot',
        factionId: 'letnev',
        color: 'red',
      });

      expect(lobbyRepo.addBotToLobby).toHaveBeenCalledWith(
        'lobby-123',
        'Test Bot',
        'letnev',
        'red'
      );
      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
    });

    it('should auto-generate bot name if not provided', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);
      vi.mocked(lobbyRepo.addBotToLobby).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('add_bot');
      await handler!({ lobbyId: 'lobby-123' });

      expect(lobbyRepo.addBotToLobby).toHaveBeenCalledWith(
        'lobby-123',
        'Bot 1', // Auto-generated name
        undefined,
        undefined
      );
    });
  });

  describe('remove_bot event', () => {
    it('should reject if not host', async () => {
      const mockLobby = createMockLobby({ hostId: 'other-user' });
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('remove_bot');
      await handler!({ lobbyId: 'lobby-123', seatIndex: 1 });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', expect.objectContaining({
        code: 'UNAUTHORIZED',
      }));
    });

    it('should remove bot and broadcast', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);
      vi.mocked(lobbyRepo.removeBotFromLobby).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('remove_bot');
      await handler!({ lobbyId: 'lobby-123', seatIndex: 1 });

      expect(lobbyRepo.removeBotFromLobby).toHaveBeenCalledWith('lobby-123', 1);
      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
    });
  });

  describe('update_bot event', () => {
    it('should reject if not host', async () => {
      const mockLobby = createMockLobby({ hostId: 'other-user' });
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('update_bot');
      await handler!({
        lobbyId: 'lobby-123',
        seatIndex: 1,
        botName: 'New Name',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', expect.objectContaining({
        code: 'UNAUTHORIZED',
      }));
    });

    it('should update bot and broadcast', async () => {
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);
      vi.mocked(lobbyRepo.updateBot).mockResolvedValue(mockLobby as any);

      const handler = mockSocket.handlers.get('update_bot');
      await handler!({
        lobbyId: 'lobby-123',
        seatIndex: 1,
        botName: 'New Name',
        factionId: 'xxcha',
        color: 'green',
      });

      expect(lobbyRepo.updateBot).toHaveBeenCalledWith('lobby-123', 1, {
        botName: 'New Name',
        factionId: 'xxcha',
        color: 'green',
      });
      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
    });
  });

  describe('start_draft event', () => {
    it('should reject if lobby not found', async () => {
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(null);

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('start_draft');
      await handler!({ lobbyId: 'lobby-123' }, callback);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        code: 'GAME_NOT_FOUND',
      }));
    });

    it('should reject if not host', async () => {
      const mockLobby = createMockLobby({ hostId: 'other-user' });
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('start_draft');
      await handler!({ lobbyId: 'lobby-123' }, callback);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        code: 'UNAUTHORIZED',
      }));
    });

    it('should reject if milty draft not enabled', async () => {
      const mockLobby = createMockLobby({
        settings: { miltyDraft: false, victoryPoints: 10, expansions: [] },
      });
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('start_draft');
      await handler!({ lobbyId: 'lobby-123' }, callback);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INVALID_ACTION',
        message: 'Milty Draft is not enabled',
      }));
    });

    it('should reject if not enough players', async () => {
      const mockLobby = createMockLobby({
        settings: { miltyDraft: true, victoryPoints: 10, expansions: [] },
        players: [{ id: 'user-123', name: 'Player 1' }], // Only 1 player
      });
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('start_draft');
      await handler!({ lobbyId: 'lobby-123' }, callback);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INVALID_ACTION',
        message: 'Need at least 3 players',
      }));
    });

    it('should initialize draft successfully', async () => {
      const mockLobby = createMockLobby({
        settings: { miltyDraft: true, victoryPoints: 10, expansions: ['base'] },
        players: [
          { id: 'user-123', userId: 'user-123', name: 'Player 1', isBot: false },
          { id: 'user-456', userId: 'user-456', name: 'Player 2', isBot: false },
          { id: 'user-789', userId: 'user-789', name: 'Player 3', isBot: false },
        ],
      });
      vi.mocked(lobbyRepo.getLobbyWithPlayers).mockResolvedValue(mockLobby as any);

      const mockDraftState = {
        phase: 'drafting',
        playerCount: 3,
        players: ['player_0', 'player_1', 'player_2'],
        picks: [],
        availableFactions: ['sol', 'hacan', 'letnev'],
        slices: [],
        speakerOrder: [0, 1, 2],
      };
      vi.mocked(miltyDraft.initializeDraft).mockReturnValue(mockDraftState as any);
      vi.mocked(miltyDraft.getCurrentPicker).mockReturnValue(null);

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('start_draft');
      await handler!({ lobbyId: 'lobby-123' }, callback);

      expect(miltyDraft.initializeDraft).toHaveBeenCalledWith(3, expect.any(Array), ['base']);
      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        lobbyId: 'lobby-123',
        draftState: mockDraftState,
      }));
    });
  });

  describe('make_draft_pick event', () => {
    it('should reject if no active draft', async () => {
      const callback = vi.fn();
      const handler = mockSocket.handlers.get('make_draft_pick');
      await handler!({
        lobbyId: 'nonexistent',
        pickType: 'faction',
        value: 'sol',
      }, callback);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INVALID_STATE',
        message: 'No active draft',
      }));
    });
  });

  describe('start_game event', () => {
    it('should reject if cannot start', async () => {
      vi.mocked(lobbyRepo.canStartGame).mockResolvedValue({
        canStart: false,
        reason: 'Not all players ready',
      });

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('start_game');
      await handler!({ lobbyId: 'lobby-123' }, callback);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        code: 'INVALID_ACTION',
        message: 'Not all players ready',
      }));
    });

    it('should start game successfully', async () => {
      vi.mocked(lobbyRepo.canStartGame).mockResolvedValue({ canStart: true });
      const mockLobby = createMockLobby({
        players: [
          { id: 'user-123', name: 'Player 1', faction: 'sol', color: 'blue', seatIndex: 0, isBot: false },
        ],
      });
      vi.mocked(lobbyRepo.startLobbyGame).mockResolvedValue(mockLobby as any);
      vi.mocked(gameRepo.createGameFromLobby).mockResolvedValue({
        gameId: 'game-456',
        gameState: {},
        players: [],
      } as any);

      const callback = vi.fn();
      const handler = mockSocket.handlers.get('start_game');
      await handler!({ lobbyId: 'lobby-123' }, callback);

      expect(gameRepo.createGameFromLobby).toHaveBeenCalledWith(expect.objectContaining({
        lobbyId: 'lobby-123',
      }));
      expect(mockServer.to).toHaveBeenCalledWith('lobby:lobby-123');
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        gameId: 'game-456',
        countdown: 3,
      }));
    });
  });

  describe('disconnect event', () => {
    it('should remove player from lobby on disconnect', async () => {
      // First join a lobby
      const mockLobby = createMockLobby();
      vi.mocked(lobbyRepo.findLobby).mockResolvedValue(mockLobby as any);
      vi.mocked(lobbyRepo.addPlayerToLobby).mockResolvedValue(mockLobby as any);

      const joinCallback = vi.fn();
      const joinHandler = mockSocket.handlers.get('join_lobby');
      await joinHandler!({ lobbyId: 'lobby-123' }, joinCallback);

      // Now disconnect
      vi.mocked(lobbyRepo.removePlayerFromLobby).mockResolvedValue(mockLobby as any);

      const disconnectHandler = mockSocket.handlers.get('disconnect');
      await disconnectHandler!();

      expect(lobbyRepo.removePlayerFromLobby).toHaveBeenCalledWith('lobby-123', 'user-123');
    });
  });

  describe('getPublicLobbies', () => {
    it('should return public lobbies from repository', async () => {
      const mockLobbies = [createMockLobby()];
      vi.mocked(lobbyRepo.getPublicLobbies).mockResolvedValue(mockLobbies as any);

      const result = await getPublicLobbies();

      expect(result).toEqual(mockLobbies);
      expect(lobbyRepo.getPublicLobbies).toHaveBeenCalled();
    });
  });
});
