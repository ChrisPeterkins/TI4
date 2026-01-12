import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Server, Socket } from 'socket.io';
import type { GameState, PlayerState } from '@ti4/shared';

// Mock the dependencies before importing the module
vi.mock('../../../middleware/auth.js', () => ({
  getUserId: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('../../../db/repositories/game.js', () => ({
  canAccessGame: vi.fn(),
  getGame: vi.fn(),
  getGameState: vi.fn(),
  getGamePlayer: vi.fn(),
  updateGameState: vi.fn(),
  createGameSnapshot: vi.fn(),
  updatePlayerConnection: vi.fn(),
  getSpectatorCount: vi.fn(),
}));

// Use vi.hoisted to create mock config that's available during mock hoisting
const { mockGameMachineConfig } = vi.hoisted(() => ({
  mockGameMachineConfig: {
    instance: null as {
      getState: ReturnType<typeof vi.fn>;
      processAction: ReturnType<typeof vi.fn>;
    } | null,
  },
}));

vi.mock('../../../engine/game-machine.js', () => ({
  GameMachine: class MockGameMachine {
    getState: ReturnType<typeof vi.fn>;
    processAction: ReturnType<typeof vi.fn>;

    constructor(state: unknown) {
      if (mockGameMachineConfig.instance) {
        this.getState = mockGameMachineConfig.instance.getState;
        this.processAction = mockGameMachineConfig.instance.processAction;
      } else {
        this.getState = vi.fn().mockReturnValue(state);
        this.processAction = vi.fn().mockReturnValue({ success: true });
      }
    }
  },
}));

vi.mock('../../../engine/bot-ai.js', () => ({
  generateBotAction: vi.fn(),
  getBotActionDelay: vi.fn().mockReturnValue(0),
  getCurrentBotPlayerId: vi.fn().mockReturnValue(null),
}));

import { registerGameHandlers, clearGameMachine } from '../game.js';
import * as authMiddleware from '../../../middleware/auth.js';
import * as gameRepo from '../../../db/repositories/game.js';

// Helper to create mock socket
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
    to: vi.fn().mockReturnThis(),
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

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Player 1',
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    technologies: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    planets: [],
    strategyCard: null,
    strategyCardUsed: false,
    passed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'game1',
    version: 1,
    round: 1,
    phase: 'action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: [],
    players: [createMockPlayer()],
    map: { tiles: [], playerCount: 4 },
    strategyCards: [],
    objectives: {
      publicStageI: [],
      publicStageII: [],
      revealedCount: 0,
      secretDeck: [],
    },
    agendas: {
      currentAgenda: null,
      currentAgendaNumber: 1,
      votes: new Map(),
      outcome: null,
      riders: [],
    },
    actionCardDeck: [],
    actionCardDiscard: [],
    agendaDeck: [],
    agendaDiscard: [],
    laws: [],
    custodiansTaken: false,
    activeCombat: null,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    gameLog: [],
    ...overrides,
  } as GameState;
}

describe('Game Socket Handlers', () => {
  let mockSocket: ReturnType<typeof createMockSocket>;
  let mockServer: ReturnType<typeof createMockServer>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockServer = createMockServer();
    mockGameMachineConfig.instance = null; // Reset mock machine config

    // Default auth mock
    vi.mocked(authMiddleware.getUserId).mockReturnValue('user-123');
    vi.mocked(authMiddleware.getUser).mockReturnValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    });

    // Register handlers
    registerGameHandlers(mockServer as unknown as Server, mockSocket as unknown as Socket);
  });

  afterEach(() => {
    // Clean up cached game machines
    clearGameMachine('game-123');
    mockGameMachineConfig.instance = null;
  });

  describe('join_game event', () => {
    it('should emit error when user cannot access game', async () => {
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: false,
        role: null,
      });

      const handler = mockSocket.handlers.get('join_game');
      await handler!({ gameId: 'game-123' });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', {
        code: 'UNAUTHORIZED',
        message: 'You are not a player or spectator in this game',
      });
    });

    it('should emit error when game not found', async () => {
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue(null);

      const handler = mockSocket.handlers.get('join_game');
      await handler!({ gameId: 'game-123' });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', {
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
      });
    });

    it('should join game room as player successfully', async () => {
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.updatePlayerConnection).mockResolvedValue({} as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);

      const handler = mockSocket.handlers.get('join_game');
      await handler!({ gameId: 'game-123' });

      expect(mockSocket.join).toHaveBeenCalledWith('game:game-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('joined_game', expect.objectContaining({
        success: true,
        playerId: 'player1',
        role: 'player',
      }));
      expect(gameRepo.updatePlayerConnection).toHaveBeenCalledWith('game-123', 'user-123', true);
    });

    it('should join game room as spectator successfully', async () => {
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'spectator',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.getSpectatorCount).mockResolvedValue(5);

      const handler = mockSocket.handlers.get('join_game');
      await handler!({ gameId: 'game-123' });

      expect(mockSocket.join).toHaveBeenCalledWith('game:game-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('joined_game', expect.objectContaining({
        success: true,
        role: 'spectator',
        spectatorCount: 5,
      }));
    });

    it('should notify other players when player joins', async () => {
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.updatePlayerConnection).mockResolvedValue({} as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);

      const toEmit = vi.fn().mockReturnValue({ emit: vi.fn() });
      mockSocket.to = toEmit;

      const handler = mockSocket.handlers.get('join_game');
      await handler!({ gameId: 'game-123' });

      expect(toEmit).toHaveBeenCalledWith('game:game-123');
    });
  });

  describe('leave_game event', () => {
    it('should leave game room and update connection status for player', async () => {
      // First join the game to set up socket state
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.updatePlayerConnection).mockResolvedValue({} as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);

      const joinHandler = mockSocket.handlers.get('join_game');
      await joinHandler!({ gameId: 'game-123' });

      // Clear the mock call history from join
      vi.mocked(gameRepo.updatePlayerConnection).mockClear();

      // Now leave
      const leaveHandler = mockSocket.handlers.get('leave_game');
      await leaveHandler!({ gameId: 'game-123' });

      expect(mockSocket.leave).toHaveBeenCalledWith('game:game-123');
      expect(gameRepo.updatePlayerConnection).toHaveBeenCalledWith('game-123', 'user-123', false);
    });

    it('should notify other players when player leaves', async () => {
      // First join the game to set up socket state
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.updatePlayerConnection).mockResolvedValue({} as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);

      const joinHandler = mockSocket.handlers.get('join_game');
      await joinHandler!({ gameId: 'game-123' });

      // Set up to capture the broadcast
      const emitFn = vi.fn();
      mockSocket.to = vi.fn().mockReturnValue({ emit: emitFn });

      // Now leave
      const leaveHandler = mockSocket.handlers.get('leave_game');
      await leaveHandler!({ gameId: 'game-123' });

      expect(mockSocket.to).toHaveBeenCalledWith('game:game-123');
      expect(emitFn).toHaveBeenCalledWith('player_left', { playerId: 'player1' });
    });
  });

  describe('game_action event', () => {
    it('should reject action from spectator', async () => {
      // First join as spectator
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'spectator',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.getSpectatorCount).mockResolvedValue(1);

      const joinHandler = mockSocket.handlers.get('join_game');
      await joinHandler!({ gameId: 'game-123' });

      // Try to perform action
      const actionHandler = mockSocket.handlers.get('game_action');
      await actionHandler!({
        gameId: 'game-123',
        action: { type: 'pass', playerId: 'player1', timestamp: Date.now() },
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', {
        code: 'UNAUTHORIZED',
        message: 'Spectators cannot perform game actions',
      });
    });

    it('should reject action if user is not a player in game', async () => {
      // Use a fresh socket to ensure it's not in socketGameMap from previous tests
      const freshSocket = createMockSocket();
      // Give it a unique ID
      (freshSocket as any).id = 'fresh-socket-for-not-player-test';

      // Register handlers for the fresh socket
      registerGameHandlers(mockServer as unknown as Server, freshSocket as unknown as Socket);

      // Socket not in socketGameMap (hasn't joined), so spectator check passes
      // getGamePlayer returns null, so this error is returned
      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue(null);

      const actionHandler = freshSocket.handlers.get('game_action');
      await actionHandler!({
        gameId: 'game-123',
        action: { type: 'pass', playerId: 'player1', timestamp: Date.now() },
      });

      expect(freshSocket.emit).toHaveBeenCalledWith('server_error', {
        code: 'UNAUTHORIZED',
        message: 'You are not a player in this game',
      });
    });

    it('should reject action if game not found', async () => {
      // First join as player to set socketGameMap correctly
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.updatePlayerConnection).mockResolvedValue({} as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);

      const joinHandler = mockSocket.handlers.get('join_game');
      await joinHandler!({ gameId: 'game-123' });

      // Now clear game state so machine can't be loaded
      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue({
        playerId: 'player1',
      } as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(null);
      clearGameMachine('game-123'); // Clear any cached machine

      const actionHandler = mockSocket.handlers.get('game_action');
      await actionHandler!({
        gameId: 'game-123',
        action: { type: 'pass', playerId: 'player1', timestamp: Date.now() },
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', {
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
      });
    });

    it('should reject action with wrong player ID', async () => {
      // First join as player
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.updatePlayerConnection).mockResolvedValue({} as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);

      const joinHandler = mockSocket.handlers.get('join_game');
      await joinHandler!({ gameId: 'game-123' });

      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue({
        playerId: 'player1',
      } as any);
      clearGameMachine('game-123'); // Clear cached machine to use fresh mock

      const actionHandler = mockSocket.handlers.get('game_action');
      await actionHandler!({
        gameId: 'game-123',
        action: { type: 'pass', playerId: 'player2', timestamp: Date.now() }, // Wrong player
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', {
        code: 'UNAUTHORIZED',
        message: 'Invalid player ID',
      });
    });

    it('should process valid action and broadcast state update', async () => {
      const mockGameState = createMockGameState({ version: 1 });
      const newGameState = createMockGameState({ version: 2 });

      // Set up the mock machine BEFORE joining
      mockGameMachineConfig.instance = {
        getState: vi.fn().mockReturnValue(newGameState),
        processAction: vi.fn().mockReturnValue({ success: true }),
      };

      // First join as player
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.updatePlayerConnection).mockResolvedValue({} as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);
      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue({
        playerId: 'player1',
      } as any);
      vi.mocked(gameRepo.updateGameState).mockResolvedValue({} as any);

      const joinHandler = mockSocket.handlers.get('join_game');
      await joinHandler!({ gameId: 'game-123' });

      const actionHandler = mockSocket.handlers.get('game_action');
      await actionHandler!({
        gameId: 'game-123',
        action: { type: 'pass', playerId: 'player1', timestamp: 12345 },
      });

      expect(mockGameMachineConfig.instance.processAction).toHaveBeenCalledWith({
        type: 'pass',
        playerId: 'player1',
        timestamp: 12345,
      });
      expect(gameRepo.updateGameState).toHaveBeenCalled();
      expect(mockServer.to).toHaveBeenCalledWith('game:game-123');
    });

    it('should emit action_result on failed action', async () => {
      const mockGameState = createMockGameState({ version: 1 });

      // Set up the mock machine BEFORE joining to return failure
      mockGameMachineConfig.instance = {
        getState: vi.fn().mockReturnValue(mockGameState),
        processAction: vi.fn().mockReturnValue({
          success: false,
          error: 'Invalid action',
        }),
      };

      // First join as player
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.updatePlayerConnection).mockResolvedValue({} as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);
      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue({
        playerId: 'player1',
      } as any);

      const joinHandler = mockSocket.handlers.get('join_game');
      await joinHandler!({ gameId: 'game-123' });

      // Clear emit history from join
      mockSocket.emit = vi.fn((event: string, data: unknown) => {
        mockSocket.emittedEvents.push({ event, data });
        return true;
      });

      const actionHandler = mockSocket.handlers.get('game_action');
      await actionHandler!({
        gameId: 'game-123',
        action: { type: 'pass', playerId: 'player1', timestamp: 12345 },
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('action_result', expect.objectContaining({
        actionId: '12345',
        result: { success: false, error: 'Invalid action' },
      }));
    });

    it('should create snapshot every 10 versions', async () => {
      const mockGameState = createMockGameState({ version: 9 });
      const newGameState = createMockGameState({ version: 10 });

      // Set up the mock machine BEFORE joining
      mockGameMachineConfig.instance = {
        getState: vi.fn().mockReturnValue(newGameState),
        processAction: vi.fn().mockReturnValue({ success: true }),
      };

      // First join as player
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.updatePlayerConnection).mockResolvedValue({} as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);
      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue({
        playerId: 'player1',
      } as any);
      vi.mocked(gameRepo.updateGameState).mockResolvedValue({} as any);
      vi.mocked(gameRepo.createGameSnapshot).mockResolvedValue({} as any);

      const joinHandler = mockSocket.handlers.get('join_game');
      await joinHandler!({ gameId: 'game-123' });

      const actionHandler = mockSocket.handlers.get('game_action');
      await actionHandler!({
        gameId: 'game-123',
        action: { type: 'pass', playerId: 'player1', timestamp: 12345 },
      });

      expect(gameRepo.createGameSnapshot).toHaveBeenCalledWith('game-123', newGameState);
    });
  });

  describe('request_state event', () => {
    it('should emit error when game not found', async () => {
      vi.mocked(gameRepo.getGame).mockResolvedValue(null);

      const handler = mockSocket.handlers.get('request_state');
      await handler!({ gameId: 'game-123', fromVersion: 1 });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', {
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
      });
    });

    it('should emit game state when found', async () => {
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);

      const handler = mockSocket.handlers.get('request_state');
      await handler!({ gameId: 'game-123', fromVersion: 1 });

      expect(mockSocket.emit).toHaveBeenCalledWith('game_state', {
        state: mockGameState,
      });
    });
  });

  describe('chat_message event', () => {
    it('should reject if user is not a player', async () => {
      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue(null);

      const handler = mockSocket.handlers.get('chat_message');
      await handler!({
        gameId: 'game-123',
        message: 'Hello!',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', {
        code: 'UNAUTHORIZED',
        message: 'You are not a player in this game',
      });
    });

    it('should reject if game not found', async () => {
      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue({
        playerId: 'player1',
      } as any);
      vi.mocked(gameRepo.getGame).mockResolvedValue(null);

      const handler = mockSocket.handlers.get('chat_message');
      await handler!({
        gameId: 'game-123',
        message: 'Hello!',
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('server_error', {
        code: 'GAME_NOT_FOUND',
        message: 'Game not found',
      });
    });

    it('should broadcast public chat message', async () => {
      const mockGameState = createMockGameState({
        players: [createMockPlayer({ id: 'player1', name: 'Alice' })],
      });
      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue({
        playerId: 'player1',
      } as any);
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);

      const handler = mockSocket.handlers.get('chat_message');
      await handler!({
        gameId: 'game-123',
        message: 'Hello everyone!',
      });

      expect(mockServer.to).toHaveBeenCalledWith('game:game-123');
    });

    it('should truncate long messages', async () => {
      const mockGameState = createMockGameState({
        players: [createMockPlayer({ id: 'player1', name: 'Alice' })],
      });
      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue({
        playerId: 'player1',
      } as any);
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);

      const longMessage = 'x'.repeat(1000);
      const handler = mockSocket.handlers.get('chat_message');
      await handler!({
        gameId: 'game-123',
        message: longMessage,
      });

      // Message should be truncated to 500 chars
      expect(mockServer.emittedEvents[0]?.data).toHaveProperty('message');
      expect((mockServer.emittedEvents[0]?.data as any).message.length).toBe(500);
    });
  });

  describe('disconnect event', () => {
    it('should update player connection status on disconnect', async () => {
      // First join the game
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'player',
        playerId: 'player1',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.updatePlayerConnection).mockResolvedValue({} as any);
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);

      const joinHandler = mockSocket.handlers.get('join_game');
      await joinHandler!({ gameId: 'game-123' });

      // Trigger disconnect
      const disconnectHandler = mockSocket.handlers.get('disconnect');
      await disconnectHandler!();

      // Should update connection to false
      expect(gameRepo.updatePlayerConnection).toHaveBeenLastCalledWith(
        'game-123',
        'user-123',
        false
      );
    });

    it('should notify spectator count when spectator disconnects', async () => {
      // First join as spectator
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.canAccessGame).mockResolvedValue({
        canAccess: true,
        role: 'spectator',
      });
      vi.mocked(gameRepo.getGame).mockResolvedValue({
        id: 'game-123',
        state: mockGameState,
        players: [],
      } as any);
      vi.mocked(gameRepo.getSpectatorCount).mockResolvedValue(4);

      const joinHandler = mockSocket.handlers.get('join_game');
      await joinHandler!({ gameId: 'game-123' });

      // Trigger disconnect
      const disconnectHandler = mockSocket.handlers.get('disconnect');
      await disconnectHandler!();

      expect(mockServer.to).toHaveBeenCalledWith('game:game-123');
    });
  });

  describe('clearGameMachine', () => {
    it('should clear cached game machine', async () => {
      const mockGameState = createMockGameState();
      vi.mocked(gameRepo.getGameState).mockResolvedValue(mockGameState);

      // This should cache the game machine
      vi.mocked(gameRepo.getGamePlayer).mockResolvedValue({
        playerId: 'player1',
      } as any);

      const actionHandler = mockSocket.handlers.get('game_action');
      await actionHandler!({
        gameId: 'game-456',
        action: { type: 'pass', playerId: 'player1', timestamp: 12345 },
      });

      // Clear should not throw
      expect(() => clearGameMachine('game-456')).not.toThrow();
    });
  });
});
