import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';

// Mock the database module - the factory function must not reference external variables
vi.mock('@ti4/database', () => ({
  prisma: {
    lobby: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    lobbyPlayer: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
  LobbyStatus: {
    WAITING: 'WAITING',
    STARTING: 'STARTING',
    IN_GAME: 'IN_GAME',
    CLOSED: 'CLOSED',
  },
}));

// Import after mocking
import { prisma } from '@ti4/database';
import {
  createLobby,
  findLobby,
  getLobbyWithPlayers,
  addPlayerToLobby,
  removePlayerFromLobby,
  selectFaction,
  selectColor,
  setPlayerReady,
  updateLobbySettings,
  canStartGame,
  startLobbyGame,
  getPublicLobbies,
} from '../lobby.js';

// Type the mocked prisma
const mockPrisma = prisma as unknown as {
  lobby: {
    create: MockInstance;
    findUnique: MockInstance;
    findFirst: MockInstance;
    findMany: MockInstance;
    update: MockInstance;
  };
  lobbyPlayer: {
    create: MockInstance;
    findUnique: MockInstance;
    findFirst: MockInstance;
    update: MockInstance;
    updateMany: MockInstance;
    delete: MockInstance;
  };
  user: {
    findUnique: MockInstance;
  };
};

function resetMocks() {
  vi.clearAllMocks();
}

describe('Lobby Repository', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('createLobby', () => {
    it('should create a lobby with host as first player', async () => {
      const hostId = 'user-123';
      const settings = {
        playerCount: 6,
        victoryPoints: 10 as const,
        expansions: ['base'],
        miltyDraft: false,
        privateGame: false,
      };

      mockPrisma.lobby.findUnique.mockResolvedValue(null); // No existing lobby with code
      mockPrisma.user.findUnique.mockResolvedValue({
        id: hostId,
        name: 'Test Host',
        email: 'host@test.com',
      });
      mockPrisma.lobby.create.mockResolvedValue({
        id: 'lobby-1',
        code: 'ABC123',
        hostId,
        playerCount: 6,
        victoryPoints: 10,
        expansions: ['base'],
        mapPreset: null,
        miltyDraft: false,
        privateGame: false,
        players: [
          {
            id: 'player-1',
            userId: hostId,
            isHost: true,
            seatIndex: 0,
            factionId: null,
            color: null,
            ready: false,
            user: { id: hostId, name: 'Test Host' },
          },
        ],
      });

      const result = await createLobby(hostId, settings);

      expect(result.id).toBe('lobby-1');
      expect(result.code).toBe('ABC123');
      expect(result.players).toHaveLength(1);
      expect(result.players[0].isHost).toBe(true);
      expect(mockPrisma.lobby.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hostId,
            playerCount: 6,
          }),
        })
      );
    });

    it('should throw error if host user not found', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        createLobby('invalid-user', {
          playerCount: 6,
          victoryPoints: 10,
          expansions: [],
          miltyDraft: false,
          privateGame: false,
        })
      ).rejects.toThrow('Host user not found');
    });
  });

  describe('findLobby', () => {
    it('should find lobby by ID', async () => {
      const lobby = {
        id: 'lobby-1',
        code: 'ABC123',
        hostId: 'user-1',
        status: 'WAITING',
        players: [],
      };
      mockPrisma.lobby.findFirst.mockResolvedValue(lobby);

      const result = await findLobby('lobby-1');

      expect(result).toEqual(lobby);
      expect(mockPrisma.lobby.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ id: 'lobby-1' }, { code: 'lobby-1' }],
          status: 'WAITING',
        },
        include: expect.anything(),
      });
    });

    it('should find lobby by code', async () => {
      const lobby = {
        id: 'lobby-1',
        code: 'ABC123',
        hostId: 'user-1',
        status: 'WAITING',
        players: [],
      };
      mockPrisma.lobby.findFirst.mockResolvedValue(lobby);

      const result = await findLobby('ABC123');

      expect(result).toEqual(lobby);
    });
  });

  describe('getLobbyWithPlayers', () => {
    it('should return formatted lobby with players', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        code: 'ABC123',
        hostId: 'user-1',
        status: 'WAITING',
        playerCount: 6,
        victoryPoints: 10,
        expansions: ['base'],
        mapPreset: null,
        miltyDraft: false,
        privateGame: false,
        players: [
          {
            userId: 'user-1',
            factionId: 'sol',
            color: 'blue',
            ready: true,
            isHost: true,
            user: { id: 'user-1', name: 'Player 1' },
          },
        ],
      });

      const result = await getLobbyWithPlayers('lobby-1');

      expect(result?.id).toBe('lobby-1');
      expect(result?.players[0].name).toBe('Player 1');
      expect(result?.players[0].faction).toBe('sol');
      expect(result?.settings.victoryPoints).toBe(10);
    });

    it('should return null for non-existent lobby', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue(null);

      const result = await getLobbyWithPlayers('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('addPlayerToLobby', () => {
    it('should add player to lobby', async () => {
      // First call for addPlayerToLobby check
      mockPrisma.lobby.findUnique
        .mockResolvedValueOnce({
          id: 'lobby-1',
          status: 'WAITING',
          playerCount: 6,
          players: [{ userId: 'user-1', seatIndex: 0 }],
        })
        // Second call for getLobbyWithPlayers
        .mockResolvedValueOnce({
          id: 'lobby-1',
          code: 'ABC123',
          hostId: 'user-1',
          status: 'WAITING',
          playerCount: 6,
          victoryPoints: 10,
          expansions: [],
          mapPreset: null,
          miltyDraft: false,
          privateGame: false,
          players: [
            {
              userId: 'user-1',
              factionId: null,
              color: null,
              ready: false,
              isHost: true,
              user: { id: 'user-1', name: 'Player 1' },
            },
            {
              userId: 'user-2',
              factionId: null,
              color: null,
              ready: false,
              isHost: false,
              user: { id: 'user-2', name: 'Player 2' },
            },
          ],
        });
      mockPrisma.lobbyPlayer.create.mockResolvedValue({});

      const result = await addPlayerToLobby('lobby-1', 'user-2');

      expect(mockPrisma.lobbyPlayer.create).toHaveBeenCalledWith({
        data: {
          lobbyId: 'lobby-1',
          userId: 'user-2',
          seatIndex: 1,
        },
      });
      expect(result?.players).toHaveLength(2);
    });

    it('should throw error when lobby is full', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        status: 'WAITING',
        playerCount: 2,
        players: [
          { userId: 'user-1', seatIndex: 0 },
          { userId: 'user-2', seatIndex: 1 },
        ],
      });

      await expect(addPlayerToLobby('lobby-1', 'user-3')).rejects.toThrow(
        'Lobby is full'
      );
    });

    it('should throw error when player already in lobby', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        status: 'WAITING',
        playerCount: 6,
        players: [{ userId: 'user-1', seatIndex: 0 }],
      });

      await expect(addPlayerToLobby('lobby-1', 'user-1')).rejects.toThrow(
        'Already in this lobby'
      );
    });

    it('should throw error when lobby not accepting players', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        status: 'IN_GAME',
        playerCount: 6,
        players: [],
      });

      await expect(addPlayerToLobby('lobby-1', 'user-1')).rejects.toThrow(
        'Lobby is not accepting players'
      );
    });
  });

  describe('removePlayerFromLobby', () => {
    it('should remove non-host player', async () => {
      mockPrisma.lobbyPlayer.findUnique.mockResolvedValue({
        id: 'player-1',
        userId: 'user-2',
        isHost: false,
      });
      mockPrisma.lobbyPlayer.delete.mockResolvedValue({});
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        code: 'ABC123',
        hostId: 'user-1',
        status: 'WAITING',
        playerCount: 6,
        victoryPoints: 10,
        expansions: [],
        mapPreset: null,
        miltyDraft: false,
        privateGame: false,
        players: [
          {
            userId: 'user-1',
            factionId: null,
            color: null,
            ready: false,
            isHost: true,
            user: { id: 'user-1', name: 'Player 1' },
          },
        ],
      });

      const result = await removePlayerFromLobby('lobby-1', 'user-2');

      expect(mockPrisma.lobbyPlayer.delete).toHaveBeenCalled();
      expect(result?.players).toHaveLength(1);
    });

    it('should close lobby when host leaves', async () => {
      mockPrisma.lobbyPlayer.findUnique.mockResolvedValue({
        id: 'player-1',
        userId: 'user-1',
        isHost: true,
      });
      mockPrisma.lobby.update.mockResolvedValue({});

      const result = await removePlayerFromLobby('lobby-1', 'user-1');

      expect(mockPrisma.lobby.update).toHaveBeenCalledWith({
        where: { id: 'lobby-1' },
        data: { status: 'CLOSED' },
      });
      expect(result).toBeNull();
    });
  });

  describe('selectFaction', () => {
    it('should update player faction', async () => {
      mockPrisma.lobbyPlayer.findFirst.mockResolvedValue(null); // No one has this faction
      mockPrisma.lobbyPlayer.update.mockResolvedValue({});
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        code: 'ABC123',
        hostId: 'user-1',
        status: 'WAITING',
        playerCount: 6,
        victoryPoints: 10,
        expansions: [],
        mapPreset: null,
        miltyDraft: false,
        privateGame: false,
        players: [
          {
            userId: 'user-1',
            factionId: 'sol',
            color: null,
            ready: false,
            isHost: true,
            user: { id: 'user-1', name: 'Player 1' },
          },
        ],
      });

      await selectFaction('lobby-1', 'user-1', 'sol');

      expect(mockPrisma.lobbyPlayer.update).toHaveBeenCalledWith({
        where: {
          lobbyId_userId: { lobbyId: 'lobby-1', userId: 'user-1' },
        },
        data: {
          factionId: 'sol',
          ready: false,
        },
      });
    });

    it('should throw error when faction already taken', async () => {
      mockPrisma.lobbyPlayer.findFirst.mockResolvedValue({
        userId: 'user-2',
        factionId: 'sol',
      });

      await expect(selectFaction('lobby-1', 'user-1', 'sol')).rejects.toThrow(
        'Faction already taken'
      );
    });
  });

  describe('selectColor', () => {
    it('should update player color', async () => {
      mockPrisma.lobbyPlayer.findFirst.mockResolvedValue(null);
      mockPrisma.lobbyPlayer.update.mockResolvedValue({});
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        code: 'ABC123',
        hostId: 'user-1',
        status: 'WAITING',
        playerCount: 6,
        victoryPoints: 10,
        expansions: [],
        mapPreset: null,
        miltyDraft: false,
        privateGame: false,
        players: [],
      });

      await selectColor('lobby-1', 'user-1', 'blue');

      expect(mockPrisma.lobbyPlayer.update).toHaveBeenCalledWith({
        where: {
          lobbyId_userId: { lobbyId: 'lobby-1', userId: 'user-1' },
        },
        data: {
          color: 'blue',
          ready: false,
        },
      });
    });

    it('should throw error when color already taken', async () => {
      mockPrisma.lobbyPlayer.findFirst.mockResolvedValue({
        userId: 'user-2',
        color: 'blue',
      });

      await expect(selectColor('lobby-1', 'user-1', 'blue')).rejects.toThrow(
        'Color already taken'
      );
    });
  });

  describe('setPlayerReady', () => {
    it('should set player ready when faction and color selected', async () => {
      mockPrisma.lobbyPlayer.findUnique.mockResolvedValue({
        id: 'player-1',
        userId: 'user-1',
        factionId: 'sol',
        color: 'blue',
        ready: false,
      });
      mockPrisma.lobbyPlayer.update.mockResolvedValue({});
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        code: 'ABC123',
        hostId: 'user-1',
        status: 'WAITING',
        playerCount: 6,
        victoryPoints: 10,
        expansions: [],
        mapPreset: null,
        miltyDraft: false,
        privateGame: false,
        players: [],
      });

      await setPlayerReady('lobby-1', 'user-1', true);

      expect(mockPrisma.lobbyPlayer.update).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        data: { ready: true },
      });
    });

    it('should throw error when trying to ready without faction', async () => {
      mockPrisma.lobbyPlayer.findUnique.mockResolvedValue({
        id: 'player-1',
        userId: 'user-1',
        factionId: null,
        color: 'blue',
        ready: false,
      });

      await expect(setPlayerReady('lobby-1', 'user-1', true)).rejects.toThrow(
        'Must select faction and color before readying up'
      );
    });

    it('should throw error when trying to ready without color', async () => {
      mockPrisma.lobbyPlayer.findUnique.mockResolvedValue({
        id: 'player-1',
        userId: 'user-1',
        factionId: 'sol',
        color: null,
        ready: false,
      });

      await expect(setPlayerReady('lobby-1', 'user-1', true)).rejects.toThrow(
        'Must select faction and color before readying up'
      );
    });
  });

  describe('canStartGame', () => {
    it('should return canStart true when all conditions met', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        hostId: 'user-1',
        players: [
          { userId: 'user-1', ready: true },
          { userId: 'user-2', ready: true },
          { userId: 'user-3', ready: true },
        ],
      });

      const result = await canStartGame('lobby-1', 'user-1');

      expect(result.canStart).toBe(true);
    });

    it('should return false when not enough players', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        hostId: 'user-1',
        players: [
          { userId: 'user-1', ready: true },
          { userId: 'user-2', ready: true },
        ],
      });

      const result = await canStartGame('lobby-1', 'user-1');

      expect(result.canStart).toBe(false);
      expect(result.reason).toBe('Need at least 3 players');
    });

    it('should return false when not all ready', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        hostId: 'user-1',
        players: [
          { userId: 'user-1', ready: true },
          { userId: 'user-2', ready: false },
          { userId: 'user-3', ready: true },
        ],
      });

      const result = await canStartGame('lobby-1', 'user-1');

      expect(result.canStart).toBe(false);
      expect(result.reason).toBe('Not all players are ready');
    });

    it('should return false when not host', async () => {
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        hostId: 'user-1',
        players: [
          { userId: 'user-1', ready: true },
          { userId: 'user-2', ready: true },
          { userId: 'user-3', ready: true },
        ],
      });

      const result = await canStartGame('lobby-1', 'user-2');

      expect(result.canStart).toBe(false);
      expect(result.reason).toBe('Only the host can start the game');
    });
  });

  describe('startLobbyGame', () => {
    it('should update lobby status to STARTING', async () => {
      mockPrisma.lobby.update.mockResolvedValue({});
      mockPrisma.lobby.findUnique.mockResolvedValue({
        id: 'lobby-1',
        code: 'ABC123',
        hostId: 'user-1',
        status: 'STARTING',
        playerCount: 6,
        victoryPoints: 10,
        expansions: [],
        mapPreset: null,
        miltyDraft: false,
        privateGame: false,
        players: [],
      });

      await startLobbyGame('lobby-1');

      expect(mockPrisma.lobby.update).toHaveBeenCalledWith({
        where: { id: 'lobby-1' },
        data: { status: 'STARTING' },
      });
    });
  });

  describe('getPublicLobbies', () => {
    it('should return formatted public lobbies', async () => {
      mockPrisma.lobby.findMany.mockResolvedValue([
        {
          id: 'lobby-1',
          code: 'ABC123',
          playerCount: 6,
          victoryPoints: 10,
          expansions: ['base'],
          miltyDraft: false,
          host: { name: 'Host Player' },
          players: [{ userId: 'user-1' }, { userId: 'user-2' }],
        },
      ]);

      const result = await getPublicLobbies();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'lobby-1',
        code: 'ABC123',
        hostName: 'Host Player',
        playerCount: 2,
        maxPlayers: 6,
        settings: {
          playerCount: 6,
          victoryPoints: 10,
          expansions: ['base'],
          miltyDraft: false,
        },
      });
    });
  });
});
