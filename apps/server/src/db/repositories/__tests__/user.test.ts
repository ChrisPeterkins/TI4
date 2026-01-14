import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GameState, PlayerState } from '@ti4/shared';

// Mock prisma before imports
vi.mock('@ti4/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    userStats: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    gamePlayer: {
      findMany: vi.fn(),
    },
  },
  Prisma: {},
}));

import {
  getUserProfile,
  getUserStats,
  getOrCreateUserStats,
  updateStatsForCompletedGame,
  getUserGameHistory,
  getLeaderboard,
  getFactionLeaderboard,
} from '../user.js';
import { prisma } from '@ti4/database';

// Helper to create mock player state
function createMockPlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
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
    score: 10,
    neighbors: [],
    transactedWith: [],
    ...overrides,
  };
}

// Helper to create mock game state
function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'game1',
    version: 1,
    round: 5,
    phase: 'action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: [],
    players: [
      createMockPlayerState({ id: 'player1', score: 10 }),
      createMockPlayerState({ id: 'player2', score: 8 }),
    ],
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

describe('User Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile when found', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        username: 'testuser',
        image: 'https://example.com/avatar.png',
        createdAt: new Date('2024-01-01'),
        stats: { gamesPlayed: 10 },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await getUserProfile('user-123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          createdAt: true,
          stats: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await getUserProfile('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserStats', () => {
    it('should return user stats when found', async () => {
      const mockStats = {
        id: 'stats-1',
        userId: 'user-123',
        gamesPlayed: 10,
        gamesWon: 3,
        totalVPs: 85,
        highestVPs: 12,
      };

      vi.mocked(prisma.userStats.findUnique).mockResolvedValue(mockStats as any);

      const result = await getUserStats('user-123');

      expect(prisma.userStats.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      expect(result).toEqual(mockStats);
    });

    it('should return null when stats not found', async () => {
      vi.mocked(prisma.userStats.findUnique).mockResolvedValue(null);

      const result = await getUserStats('user-123');

      expect(result).toBeNull();
    });
  });

  describe('getOrCreateUserStats', () => {
    it('should return existing stats', async () => {
      const mockStats = {
        id: 'stats-1',
        userId: 'user-123',
        gamesPlayed: 5,
      };

      vi.mocked(prisma.userStats.upsert).mockResolvedValue(mockStats as any);

      const result = await getOrCreateUserStats('user-123');

      expect(prisma.userStats.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: {},
        create: { userId: 'user-123' },
      });
      expect(result).toEqual(mockStats);
    });

    it('should create new stats if not exists', async () => {
      const newStats = {
        id: 'stats-new',
        userId: 'user-new',
        gamesPlayed: 0,
        gamesWon: 0,
      };

      vi.mocked(prisma.userStats.upsert).mockResolvedValue(newStats as any);

      const result = await getOrCreateUserStats('user-new');

      expect(result).toEqual(newStats);
    });
  });

  describe('updateStatsForCompletedGame', () => {
    it('should update stats for winner', async () => {
      const gameState = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', score: 10 }),
        ],
      });

      vi.mocked(prisma.gamePlayer.findMany).mockResolvedValue([
        {
          gameId: 'game-123',
          playerId: 'player1',
          userId: 'user-123',
          factionId: 'sol',
          color: 'blue',
          isBot: false,
        },
      ] as any);

      vi.mocked(prisma.userStats.findUnique).mockResolvedValue({
        userId: 'user-123',
        gamesPlayed: 5,
        gamesWon: 2,
        totalVPs: 40,
        highestVPs: 9,
        factionStats: { sol: { played: 2, won: 1, vps: 18 } },
      } as any);

      vi.mocked(prisma.userStats.upsert).mockResolvedValue({} as any);

      await updateStatsForCompletedGame('game-123', gameState, 'player1');

      expect(prisma.gamePlayer.findMany).toHaveBeenCalledWith({
        where: { gameId: 'game-123', isBot: false },
      });

      expect(prisma.userStats.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: expect.objectContaining({
          gamesPlayed: { increment: 1 },
          gamesWon: { increment: 1 }, // Winner
          totalVPs: { increment: 10 },
          highestVPs: 10, // New high score
          lastPlayedAt: expect.any(Date),
          favoriteColor: 'blue',
        }),
        create: expect.objectContaining({
          userId: 'user-123',
          gamesPlayed: 1,
          gamesWon: 1,
          totalVPs: 10,
          highestVPs: 10,
        }),
      });
    });

    it('should update stats for non-winner', async () => {
      const gameState = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', score: 8 }),
          createMockPlayerState({ id: 'player2', score: 10 }),
        ],
      });

      vi.mocked(prisma.gamePlayer.findMany).mockResolvedValue([
        {
          gameId: 'game-123',
          playerId: 'player1',
          userId: 'user-123',
          factionId: 'hacan',
          color: 'yellow',
          isBot: false,
        },
      ] as any);

      vi.mocked(prisma.userStats.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.userStats.upsert).mockResolvedValue({} as any);

      await updateStatsForCompletedGame('game-123', gameState, 'player2');

      expect(prisma.userStats.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        update: expect.objectContaining({
          gamesWon: { increment: 0 }, // Not winner
        }),
        create: expect.objectContaining({
          gamesWon: 0,
        }),
      });
    });

    it('should skip bot players', async () => {
      const gameState = createMockGameState();

      vi.mocked(prisma.gamePlayer.findMany).mockResolvedValue([
        {
          gameId: 'game-123',
          playerId: 'bot1',
          userId: null,
          factionId: 'sol',
          color: 'blue',
          isBot: true,
        },
      ] as any);

      await updateStatsForCompletedGame('game-123', gameState, 'bot1');

      // Should not call upsert for bots
      expect(prisma.userStats.upsert).not.toHaveBeenCalled();
    });

    it('should skip players without userId', async () => {
      const gameState = createMockGameState();

      vi.mocked(prisma.gamePlayer.findMany).mockResolvedValue([
        {
          gameId: 'game-123',
          playerId: 'player1',
          userId: null, // No userId
          factionId: 'sol',
          color: 'blue',
          isBot: false,
        },
      ] as any);

      await updateStatsForCompletedGame('game-123', gameState, 'player1');

      expect(prisma.userStats.upsert).not.toHaveBeenCalled();
    });

    it('should preserve higher highestVPs if existing is greater', async () => {
      const gameState = createMockGameState({
        players: [createMockPlayerState({ id: 'player1', score: 8 })],
      });

      vi.mocked(prisma.gamePlayer.findMany).mockResolvedValue([
        {
          gameId: 'game-123',
          playerId: 'player1',
          userId: 'user-123',
          factionId: 'sol',
          color: 'blue',
          isBot: false,
        },
      ] as any);

      vi.mocked(prisma.userStats.findUnique).mockResolvedValue({
        userId: 'user-123',
        highestVPs: 12, // Existing high score is higher
        factionStats: {},
      } as any);

      vi.mocked(prisma.userStats.upsert).mockResolvedValue({} as any);

      await updateStatsForCompletedGame('game-123', gameState, null);

      expect(prisma.userStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            highestVPs: 12, // Should preserve existing high score
          }),
        })
      );
    });

    it('should update faction stats correctly', async () => {
      const gameState = createMockGameState({
        players: [createMockPlayerState({ id: 'player1', score: 10 })],
      });

      vi.mocked(prisma.gamePlayer.findMany).mockResolvedValue([
        {
          gameId: 'game-123',
          playerId: 'player1',
          userId: 'user-123',
          factionId: 'nekro',
          color: 'black',
          isBot: false,
        },
      ] as any);

      vi.mocked(prisma.userStats.findUnique).mockResolvedValue({
        userId: 'user-123',
        highestVPs: 5,
        factionStats: {
          nekro: { played: 3, won: 1, vps: 25 },
        },
      } as any);

      vi.mocked(prisma.userStats.upsert).mockResolvedValue({} as any);

      await updateStatsForCompletedGame('game-123', gameState, 'player1');

      expect(prisma.userStats.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            factionStats: {
              nekro: { played: 4, won: 2, vps: 35 },
            },
          }),
        })
      );
    });

    it('should handle multiple players in same game', async () => {
      const gameState = createMockGameState({
        players: [
          createMockPlayerState({ id: 'player1', score: 10 }),
          createMockPlayerState({ id: 'player2', score: 8 }),
        ],
      });

      vi.mocked(prisma.gamePlayer.findMany).mockResolvedValue([
        {
          gameId: 'game-123',
          playerId: 'player1',
          userId: 'user-1',
          factionId: 'sol',
          color: 'blue',
          isBot: false,
        },
        {
          gameId: 'game-123',
          playerId: 'player2',
          userId: 'user-2',
          factionId: 'hacan',
          color: 'yellow',
          isBot: false,
        },
      ] as any);

      vi.mocked(prisma.userStats.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.userStats.upsert).mockResolvedValue({} as any);

      await updateStatsForCompletedGame('game-123', gameState, 'player1');

      // Should be called twice, once for each player
      expect(prisma.userStats.upsert).toHaveBeenCalledTimes(2);
    });
  });

  describe('getUserGameHistory', () => {
    it('should return formatted game history', async () => {
      const mockGamePlayers = [
        {
          playerId: 'player1',
          factionId: 'sol',
          color: 'blue',
          game: {
            id: 'game-123',
            status: 'completed',
            round: 5,
            phase: 'ended',
            winnerId: 'player1',
            createdAt: new Date('2024-01-01'),
            startedAt: new Date('2024-01-01'),
            endedAt: new Date('2024-01-02'),
            players: [
              {
                playerId: 'player1',
                factionId: 'sol',
                color: 'blue',
                isBot: false,
                botName: null,
                user: { id: 'user-1', name: 'Alice' },
              },
              {
                playerId: 'player2',
                factionId: 'hacan',
                color: 'yellow',
                isBot: true,
                botName: 'Bot Player',
                user: null,
              },
            ],
          },
        },
      ];

      vi.mocked(prisma.gamePlayer.findMany).mockResolvedValue(mockGamePlayers as any);

      const result = await getUserGameHistory('user-1', 10, 0);

      expect(prisma.gamePlayer.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        include: expect.any(Object),
        orderBy: { game: { createdAt: 'desc' } },
        take: 10,
        skip: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        gameId: 'game-123',
        status: 'completed',
        round: 5,
        phase: 'ended',
        myFaction: 'sol',
        myColor: 'blue',
        myPlayerId: 'player1',
        isWinner: true,
        playerCount: 2,
        players: [
          {
            playerId: 'player1',
            factionId: 'sol',
            color: 'blue',
            name: 'Alice',
            isBot: false,
            isWinner: true,
          },
          {
            playerId: 'player2',
            factionId: 'hacan',
            color: 'yellow',
            name: 'Bot Player',
            isBot: true,
            isWinner: false,
          },
        ],
        createdAt: expect.any(Date),
        startedAt: expect.any(Date),
        endedAt: expect.any(Date),
      });
    });

    it('should use default pagination values', async () => {
      vi.mocked(prisma.gamePlayer.findMany).mockResolvedValue([]);

      await getUserGameHistory('user-1');

      expect(prisma.gamePlayer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 0,
        })
      );
    });

    it('should return empty array when no games found', async () => {
      vi.mocked(prisma.gamePlayer.findMany).mockResolvedValue([]);

      const result = await getUserGameHistory('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getLeaderboard', () => {
    it('should return formatted leaderboard', async () => {
      const mockStats = [
        {
          userId: 'user-1',
          gamesPlayed: 10,
          gamesWon: 5,
          totalVPs: 90,
          highestVPs: 12,
          user: {
            id: 'user-1',
            name: 'Alice',
            username: 'alice',
            image: 'https://example.com/alice.png',
          },
        },
        {
          userId: 'user-2',
          gamesPlayed: 8,
          gamesWon: 3,
          totalVPs: 65,
          highestVPs: 10,
          user: {
            id: 'user-2',
            name: 'Bob',
            username: 'bob',
            image: null,
          },
        },
      ];

      vi.mocked(prisma.userStats.findMany).mockResolvedValue(mockStats as any);

      const result = await getLeaderboard(20);

      expect(prisma.userStats.findMany).toHaveBeenCalledWith({
        where: { gamesPlayed: { gt: 0 } },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
        orderBy: [{ gamesWon: 'desc' }, { totalVPs: 'desc' }],
        take: 20,
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        rank: 1,
        userId: 'user-1',
        name: 'Alice',
        username: 'alice',
        image: 'https://example.com/alice.png',
        gamesPlayed: 10,
        gamesWon: 5,
        winRate: '50.0',
        totalVPs: 90,
        highestVPs: 12,
      });
      expect(result[1].rank).toBe(2);
      expect(result[1].winRate).toBe('37.5');
    });

    it('should use default limit', async () => {
      vi.mocked(prisma.userStats.findMany).mockResolvedValue([]);

      await getLeaderboard();

      expect(prisma.userStats.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 })
      );
    });

    it('should handle zero games played for win rate', async () => {
      const mockStats = [
        {
          userId: 'user-1',
          gamesPlayed: 0,
          gamesWon: 0,
          totalVPs: 0,
          highestVPs: 0,
          user: { id: 'user-1', name: 'New Player', username: 'new', image: null },
        },
      ];

      vi.mocked(prisma.userStats.findMany).mockResolvedValue(mockStats as any);

      const result = await getLeaderboard();

      expect(result[0].winRate).toBe('0.0');
    });
  });

  describe('getFactionLeaderboard', () => {
    it('should return faction-specific leaderboard', async () => {
      const mockStats = [
        {
          userId: 'user-1',
          factionStats: {
            sol: { played: 5, won: 3, vps: 45 },
            hacan: { played: 2, won: 1, vps: 18 },
          },
          user: { id: 'user-1', name: 'Alice', username: 'alice', image: null },
        },
        {
          userId: 'user-2',
          factionStats: {
            sol: { played: 3, won: 2, vps: 28 },
          },
          user: { id: 'user-2', name: 'Bob', username: 'bob', image: null },
        },
        {
          userId: 'user-3',
          factionStats: {
            hacan: { played: 10, won: 5, vps: 80 },
            // No sol stats
          },
          user: { id: 'user-3', name: 'Carol', username: 'carol', image: null },
        },
      ];

      vi.mocked(prisma.userStats.findMany).mockResolvedValue(mockStats as any);

      const result = await getFactionLeaderboard('sol', 10);

      expect(result).toHaveLength(2); // Only users with sol stats
      expect(result[0]).toEqual({
        rank: 1,
        userId: 'user-1',
        name: 'Alice',
        username: 'alice',
        image: null,
        played: 5,
        won: 3,
        vps: 45,
        winRate: '60.0',
      });
      expect(result[1].rank).toBe(2);
      expect(result[1].userId).toBe('user-2');
    });

    it('should filter out users with no stats for faction', async () => {
      const mockStats = [
        {
          userId: 'user-1',
          factionStats: {
            sol: { played: 5, won: 3, vps: 45 },
          },
          user: { id: 'user-1', name: 'Alice', username: 'alice', image: null },
        },
        {
          userId: 'user-2',
          factionStats: {}, // No faction stats at all
          user: { id: 'user-2', name: 'Bob', username: 'bob', image: null },
        },
      ];

      vi.mocked(prisma.userStats.findMany).mockResolvedValue(mockStats as any);

      const result = await getFactionLeaderboard('sol', 10);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('should filter out users with zero plays for faction', async () => {
      const mockStats = [
        {
          userId: 'user-1',
          factionStats: {
            sol: { played: 0, won: 0, vps: 0 }, // Zero plays
          },
          user: { id: 'user-1', name: 'Alice', username: 'alice', image: null },
        },
      ];

      vi.mocked(prisma.userStats.findMany).mockResolvedValue(mockStats as any);

      const result = await getFactionLeaderboard('sol', 10);

      expect(result).toHaveLength(0);
    });

    it('should sort by wins then VPs', async () => {
      const mockStats = [
        {
          userId: 'user-1',
          factionStats: { sol: { played: 10, won: 2, vps: 80 } }, // 2 wins, 80 VPs
          user: { id: 'user-1', name: 'Alice', username: 'alice', image: null },
        },
        {
          userId: 'user-2',
          factionStats: { sol: { played: 5, won: 3, vps: 40 } }, // 3 wins, 40 VPs (should be first)
          user: { id: 'user-2', name: 'Bob', username: 'bob', image: null },
        },
        {
          userId: 'user-3',
          factionStats: { sol: { played: 6, won: 2, vps: 90 } }, // 2 wins, 90 VPs (more VPs than user-1)
          user: { id: 'user-3', name: 'Carol', username: 'carol', image: null },
        },
      ];

      vi.mocked(prisma.userStats.findMany).mockResolvedValue(mockStats as any);

      const result = await getFactionLeaderboard('sol', 10);

      expect(result[0].userId).toBe('user-2'); // Most wins
      expect(result[1].userId).toBe('user-3'); // Same wins as user-1, but more VPs
      expect(result[2].userId).toBe('user-1');
    });

    it('should respect limit parameter', async () => {
      const mockStats = Array.from({ length: 20 }, (_, i) => ({
        userId: `user-${i}`,
        factionStats: { sol: { played: 10 - i, won: 10 - i, vps: 100 - i * 5 } },
        user: { id: `user-${i}`, name: `User ${i}`, username: `user${i}`, image: null },
      }));

      vi.mocked(prisma.userStats.findMany).mockResolvedValue(mockStats as any);

      const result = await getFactionLeaderboard('sol', 5);

      expect(result).toHaveLength(5);
    });

    it('should handle null factionStats', async () => {
      const mockStats = [
        {
          userId: 'user-1',
          factionStats: null,
          user: { id: 'user-1', name: 'Alice', username: 'alice', image: null },
        },
      ];

      vi.mocked(prisma.userStats.findMany).mockResolvedValue(mockStats as any);

      const result = await getFactionLeaderboard('sol', 10);

      expect(result).toHaveLength(0);
    });
  });
});
