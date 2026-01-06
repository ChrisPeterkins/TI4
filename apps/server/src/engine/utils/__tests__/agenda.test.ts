import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, PlayerState, UUID, MapTile } from '@ti4/shared';
import {
  calculateVotingOrder,
  calculateAvailableVotes,
  calculateVotesFromPlanets,
  findPlanetData,
  getValidOutcomes,
  canPlayerVote,
  tallyVotes,
  determineWinner,
} from '../agenda.js';

// Helper to create mock player
function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    planets: [],
    technologies: [],
    units: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 3,
    strategyCards: [],
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    promissoryNotes: [],
    promissoryNotesInPlay: [],
    relics: [],
    exhaustedRelics: [],
    exhaustedPlanets: [],
    fragments: { cultural: 0, hazardous: 0, industrial: 0, unknown: 0 },
    ...overrides,
  } as PlayerState;
}

// Helper to create mock game state
function createMockGameState(players: PlayerState[]): GameState {
  return {
    id: 'test-game',
    name: 'Test Game',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'in_progress',
    players,
    currentPlayerIndex: 0,
    phase: 'agenda',
    round: 1,
    turnNumber: 1,
    map: { tiles: [] as MapTile[] },
    speaker: players[0]?.id || 'player1',
    publicObjectives: [],
    publicObjectivesDeck: [],
    secretObjectivesDeck: [],
    agendaDeck: [],
    currentAgenda: null,
    actionCardDeck: [],
    actionCardDiscard: [],
    laws: [],
    passedPlayers: [],
    strategyCardState: {},
    combatState: null,
    activatedSystem: null,
    custodiansTaken: false,
    supportForTheThroneGiven: false,
    availableStrategyCards: [1, 2, 3, 4, 5, 6, 7, 8],
    events: [],
    actionsThisTurn: [],
    lastActionTimestamp: Date.now(),
  } as unknown as GameState;
}

describe('Agenda Utils', () => {
  describe('calculateVotingOrder', () => {
    it('should order players starting from left of speaker, ending with speaker', () => {
      const players = [
        createMockPlayer('player1', { seatIndex: 0 }),
        createMockPlayer('player2', { seatIndex: 1 }),
        createMockPlayer('player3', { seatIndex: 2 }),
        createMockPlayer('player4', { seatIndex: 3 }),
      ];

      const order = calculateVotingOrder(players, 'player1');

      // Speaker is at seat 0, so order should be: 1, 2, 3, 0 (speaker last)
      expect(order).toEqual(['player2', 'player3', 'player4', 'player1']);
    });

    it('should handle speaker in middle position', () => {
      const players = [
        createMockPlayer('player1', { seatIndex: 0 }),
        createMockPlayer('player2', { seatIndex: 1 }),
        createMockPlayer('player3', { seatIndex: 2 }),
        createMockPlayer('player4', { seatIndex: 3 }),
      ];

      const order = calculateVotingOrder(players, 'player2');

      // Speaker is at seat 1, so order should be: 2, 3, 0, 1 (speaker last)
      expect(order).toEqual(['player3', 'player4', 'player1', 'player2']);
    });

    it('should handle 6-player game', () => {
      const players = [
        createMockPlayer('player1', { seatIndex: 0 }),
        createMockPlayer('player2', { seatIndex: 1 }),
        createMockPlayer('player3', { seatIndex: 2 }),
        createMockPlayer('player4', { seatIndex: 3 }),
        createMockPlayer('player5', { seatIndex: 4 }),
        createMockPlayer('player6', { seatIndex: 5 }),
      ];

      const order = calculateVotingOrder(players, 'player3');

      expect(order).toEqual(['player4', 'player5', 'player6', 'player1', 'player2', 'player3']);
      expect(order[order.length - 1]).toBe('player3'); // Speaker last
    });

    it('should handle unsorted players array', () => {
      const players = [
        createMockPlayer('player3', { seatIndex: 2 }),
        createMockPlayer('player1', { seatIndex: 0 }),
        createMockPlayer('player4', { seatIndex: 3 }),
        createMockPlayer('player2', { seatIndex: 1 }),
      ];

      const order = calculateVotingOrder(players, 'player1');

      expect(order).toEqual(['player2', 'player3', 'player4', 'player1']);
    });

    it('should fallback to seat order if speaker not found', () => {
      const players = [
        createMockPlayer('player1', { seatIndex: 0 }),
        createMockPlayer('player2', { seatIndex: 1 }),
        createMockPlayer('player3', { seatIndex: 2 }),
      ];

      const order = calculateVotingOrder(players, 'nonexistent');

      expect(order).toEqual(['player1', 'player2', 'player3']);
    });

    it('should handle 2-player game', () => {
      const players = [
        createMockPlayer('player1', { seatIndex: 0 }),
        createMockPlayer('player2', { seatIndex: 1 }),
      ];

      const order = calculateVotingOrder(players, 'player1');

      expect(order).toEqual(['player2', 'player1']);
    });
  });

  describe('calculateAvailableVotes', () => {
    it('should return 0 votes for player with no planets', () => {
      const player = createMockPlayer('player1', { planets: [] });
      const state = createMockGameState([player]);

      const result = calculateAvailableVotes(state, 'player1');

      expect(result.totalInfluence).toBe(0);
      expect(result.planets).toEqual([]);
    });

    it('should return 0 for non-existent player', () => {
      const state = createMockGameState([createMockPlayer('player1')]);

      const result = calculateAvailableVotes(state, 'nonexistent');

      expect(result.totalInfluence).toBe(0);
      expect(result.planets).toEqual([]);
    });

    it('should calculate votes from unexhausted planets only', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'mecatol_rex', exhausted: false },
          { planetId: 'jord', exhausted: true },
        ],
      });
      const state = createMockGameState([player]);

      const result = calculateAvailableVotes(state, 'player1');

      // Should only count Mecatol Rex influence (6), not Jord
      expect(result.totalInfluence).toBe(6);
    });

    it('should include planet details in result', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'mecatol_rex', exhausted: false },
        ],
      });
      const state = createMockGameState([player]);

      const result = calculateAvailableVotes(state, 'player1');

      expect(result.planets.length).toBe(1);
      expect(result.planets[0].planetId).toBe('mecatol_rex');
      expect(result.planets[0].influence).toBe(6);
      expect(result.planets[0].exhausted).toBe(false);
    });

    it('should handle multiple planets', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'mecatol_rex', exhausted: false }, // 6 influence
          { planetId: 'lodor', exhausted: false }, // 1 influence
        ],
      });
      const state = createMockGameState([player]);

      const result = calculateAvailableVotes(state, 'player1');

      expect(result.planets.length).toBe(2);
      expect(result.totalInfluence).toBe(7); // 6 + 1
    });
  });

  describe('calculateVotesFromPlanets', () => {
    it('should return 0 for empty planet array', () => {
      const result = calculateVotesFromPlanets([]);
      expect(result).toBe(0);
    });

    it('should calculate total influence from planet IDs', () => {
      const result = calculateVotesFromPlanets(['mecatol_rex']); // 6 influence
      expect(result).toBe(6);
    });

    it('should sum influence from multiple planets', () => {
      const result = calculateVotesFromPlanets(['mecatol_rex', 'lodor']); // 6 + 1
      expect(result).toBe(7);
    });

    it('should handle unknown planet IDs gracefully', () => {
      const result = calculateVotesFromPlanets(['nonexistent-planet']);
      expect(result).toBe(0);
    });

    it('should skip unknown planets but count valid ones', () => {
      const result = calculateVotesFromPlanets(['mecatol_rex', 'fake-planet']);
      expect(result).toBe(6);
    });
  });

  describe('findPlanetData', () => {
    it('should find Mecatol Rex', () => {
      const result = findPlanetData('mecatol_rex');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Mecatol Rex');
      expect(result?.resources).toBe(1);
      expect(result?.influence).toBe(6);
    });

    it('should find Jord (Sol home planet)', () => {
      const result = findPlanetData('jord');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Jord');
    });

    it('should return null for unknown planet', () => {
      const result = findPlanetData('nonexistent-planet');
      expect(result).toBeNull();
    });

    it('should find planets from different systems', () => {
      const lodor = findPlanetData('lodor');
      const abyz = findPlanetData('abyz');

      expect(lodor).not.toBeNull();
      expect(abyz).not.toBeNull();
    });
  });

  describe('getValidOutcomes', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState([
        createMockPlayer('player1', {
          planets: [{ planetId: 'jord', exhausted: false }],
          scoredObjectives: ['secret-obj-1'],
        }),
        createMockPlayer('player2', {
          planets: [{ planetId: 'mecatol_rex', exhausted: false }],
          scoredObjectives: ['secret-obj-2'],
        }),
      ]);
      state.laws = [{ cardId: 'law-1' } as any, { cardId: 'law-2' } as any];
    });

    it('should return for/against for for_against election', () => {
      const outcomes = getValidOutcomes(state, 'for_against');
      expect(outcomes).toEqual(['for', 'against']);
    });

    it('should return all player IDs for player election', () => {
      const outcomes = getValidOutcomes(state, 'player');
      expect(outcomes).toContain('player1');
      expect(outcomes).toContain('player2');
      expect(outcomes.length).toBe(2);
    });

    it('should return all controlled planets for planet election', () => {
      const outcomes = getValidOutcomes(state, 'planet');
      expect(outcomes).toContain('jord');
      expect(outcomes).toContain('mecatol_rex');
      expect(outcomes.length).toBe(2);
    });

    it('should return scored secret objectives for scored_secret election', () => {
      const outcomes = getValidOutcomes(state, 'scored_secret');
      expect(outcomes).toContain('secret-obj-1');
      expect(outcomes).toContain('secret-obj-2');
    });

    it('should not duplicate scored secrets', () => {
      state.players[1].scoredObjectives.push('secret-obj-1');
      const outcomes = getValidOutcomes(state, 'scored_secret');
      expect(outcomes.filter(o => o === 'secret-obj-1').length).toBe(1);
    });

    it('should return current laws for law election', () => {
      const outcomes = getValidOutcomes(state, 'law');
      expect(outcomes).toEqual(['law-1', 'law-2']);
    });

    it('should return strategy card numbers for strategy_card election', () => {
      const outcomes = getValidOutcomes(state, 'strategy_card');
      expect(outcomes).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
    });

    it('should return empty array for custom election', () => {
      const outcomes = getValidOutcomes(state, 'custom');
      expect(outcomes).toEqual([]);
    });

    it('should return empty array for null election type', () => {
      const outcomes = getValidOutcomes(state, null);
      expect(outcomes).toEqual([]);
    });
  });

  describe('canPlayerVote', () => {
    it('should return true for any player (MVP implementation)', () => {
      const state = createMockGameState([createMockPlayer('player1')]);

      expect(canPlayerVote(state, 'player1')).toBe(true);
      expect(canPlayerVote(state, 'any-player')).toBe(true);
    });
  });

  describe('tallyVotes', () => {
    it('should tally votes correctly', () => {
      const votes: Record<UUID, { outcome: string; votes: number; extraVotes: number; abstained: boolean }> = {
        'player1': { outcome: 'for', votes: 5, extraVotes: 0, abstained: false },
        'player2': { outcome: 'for', votes: 3, extraVotes: 0, abstained: false },
        'player3': { outcome: 'against', votes: 4, extraVotes: 0, abstained: false },
      };

      const result = tallyVotes(votes);

      expect(result['for']).toBe(8);
      expect(result['against']).toBe(4);
    });

    it('should include extra votes', () => {
      const votes: Record<UUID, { outcome: string; votes: number; extraVotes: number; abstained: boolean }> = {
        'player1': { outcome: 'for', votes: 5, extraVotes: 2, abstained: false },
      };

      const result = tallyVotes(votes);

      expect(result['for']).toBe(7);
    });

    it('should not count abstained players', () => {
      const votes: Record<UUID, { outcome: string; votes: number; extraVotes: number; abstained: boolean }> = {
        'player1': { outcome: 'for', votes: 5, extraVotes: 0, abstained: false },
        'player2': { outcome: 'against', votes: 10, extraVotes: 5, abstained: true },
      };

      const result = tallyVotes(votes);

      expect(result['for']).toBe(5);
      expect(result['against']).toBeUndefined();
    });

    it('should handle empty votes', () => {
      const result = tallyVotes({});
      expect(result).toEqual({});
    });

    it('should handle player election votes', () => {
      const votes: Record<UUID, { outcome: string; votes: number; extraVotes: number; abstained: boolean }> = {
        'player1': { outcome: 'player2', votes: 5, extraVotes: 0, abstained: false },
        'player2': { outcome: 'player3', votes: 3, extraVotes: 0, abstained: false },
        'player3': { outcome: 'player2', votes: 4, extraVotes: 0, abstained: false },
      };

      const result = tallyVotes(votes);

      expect(result['player2']).toBe(9);
      expect(result['player3']).toBe(3);
    });
  });

  describe('determineWinner', () => {
    it('should return clear winner', () => {
      const tallies = { 'for': 10, 'against': 5 };

      const result = determineWinner(tallies);

      expect(result.winner).toBe('for');
      expect(result.tied).toEqual([]);
      expect(result.topVotes).toBe(10);
    });

    it('should detect tie between two outcomes', () => {
      const tallies = { 'for': 10, 'against': 10 };

      const result = determineWinner(tallies);

      expect(result.winner).toBeNull();
      expect(result.tied).toContain('for');
      expect(result.tied).toContain('against');
      expect(result.topVotes).toBe(10);
    });

    it('should detect three-way tie', () => {
      const tallies = { 'player1': 5, 'player2': 5, 'player3': 5 };

      const result = determineWinner(tallies);

      expect(result.winner).toBeNull();
      expect(result.tied.length).toBe(3);
      expect(result.topVotes).toBe(5);
    });

    it('should handle empty tallies', () => {
      const result = determineWinner({});

      expect(result.winner).toBeNull();
      expect(result.tied).toEqual([]);
      expect(result.topVotes).toBe(0);
    });

    it('should return winner with multiple outcomes', () => {
      const tallies = { 'player1': 10, 'player2': 8, 'player3': 5, 'player4': 3 };

      const result = determineWinner(tallies);

      expect(result.winner).toBe('player1');
      expect(result.tied).toEqual([]);
    });

    it('should only include tied outcomes with top votes', () => {
      const tallies = { 'for': 10, 'against': 10, 'abstain': 5 };

      const result = determineWinner(tallies);

      expect(result.tied.length).toBe(2);
      expect(result.tied).not.toContain('abstain');
    });
  });
});
