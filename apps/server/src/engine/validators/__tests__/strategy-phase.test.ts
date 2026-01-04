/**
 * Tests for strategy phase validators
 *
 * TI4 Strategy Phase Rules:
 * - Strategy phase occurs at the start of each round
 * - Players pick strategy cards in speaker order (clockwise from speaker)
 * - Each player picks 1 card (or 2 in 3-4 player games)
 * - Cards determine initiative order for the action phase
 * - Unpicked cards get trade goods placed on them
 * - A player cannot pick a card already chosen by another player
 *
 * Sources:
 * - https://twilight-imperium.fandom.com/wiki/Strategy_Phase
 * - https://www.tirules.com/R_strategy_phase
 * - https://www.tirules.com/R_initiative_order
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GameState, PlayerState, StrategyCardState } from '@ti4/shared';
import { validatePickStrategyCard, getAvailableStrategyCards } from '../strategy-phase.js';

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    faction: 'sol',
    color: 'blue',
    name: 'Test Player',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    commodities: 2,
    maxCommodities: 4,
    tradeGoods: 2,
    technologies: [],
    planets: [],
    secretObjectives: [],
    actionCards: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    scoredObjectives: [],
    passed: false,
    strategyCard: null,
    strategyCardUsed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    relics: [],
    relicFragments: { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 },
    exhaustedTechnologies: [],
    exhaustedRelics: [],
    ...overrides,
  };
}

function createMockStrategyCard(number: number, overrides: Partial<StrategyCardState> = {}): StrategyCardState {
  const names: Record<number, string> = {
    1: 'Leadership',
    2: 'Diplomacy',
    3: 'Politics',
    4: 'Construction',
    5: 'Trade',
    6: 'Warfare',
    7: 'Technology',
    8: 'Imperial',
  };

  return {
    number,
    name: names[number] || `Card ${number}`,
    pickedBy: null,
    exhausted: false,
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createMockPlayer({ id: 'player1', seatIndex: 0 });
  const player2 = createMockPlayer({ id: 'player2', seatIndex: 1 });
  const player3 = createMockPlayer({ id: 'player3', seatIndex: 2 });
  const player4 = createMockPlayer({ id: 'player4', seatIndex: 3 });

  const strategyCards: StrategyCardState[] = [
    createMockStrategyCard(1),
    createMockStrategyCard(2),
    createMockStrategyCard(3),
    createMockStrategyCard(4),
    createMockStrategyCard(5),
    createMockStrategyCard(6),
    createMockStrategyCard(7),
    createMockStrategyCard(8),
  ];

  return {
    id: 'game1',
    version: 1,
    phase: 'strategy',
    subPhase: undefined,
    round: 1,
    players: [player1, player2, player3, player4],
    map: { tiles: [], playerCount: 6 },
    objectives: { publicStageI: [], publicStageII: [], revealedCount: 0, secretDeck: [] },
    laws: [],
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: ['player1', 'player2', 'player3', 'player4'],
    activeCombat: null,
    agendaPhase: undefined,
    actionCardDeck: [],
    actionCardDiscard: [],
    agendaDeck: [],
    agendaDiscard: [],
    agendas: { currentAgenda: null, currentAgendaNumber: 1, votes: new Map(), outcome: null, riders: [] },
    custodiansTaken: false,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    gameLog: [],
    strategyCards,
    ...overrides,
  };
}

describe('validatePickStrategyCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic validation', () => {
    it('should fail if not in strategy phase', () => {
      const state = createMockGameState({ phase: 'action' });
      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in strategy phase');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'nonexistent',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if player already has a strategy card', () => {
      const state = createMockGameState();
      state.players[0].strategyCard = 3;

      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You already have a strategy card');
    });

    it('should fail if card number is invalid', () => {
      const state = createMockGameState();
      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player1',
        cardNumber: 99, // Invalid
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid strategy card number');
    });

    it('should fail if strategy card already taken', () => {
      const state = createMockGameState();
      state.strategyCards[0].pickedBy = 'player2'; // Card 1 taken by player2

      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Strategy card already taken');
    });
  });

  describe('pick order validation (speaker first, then clockwise)', () => {
    it('should allow speaker to pick first', () => {
      const state = createMockGameState({ speakerId: 'player1' });
      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if non-speaker tries to pick first', () => {
      const state = createMockGameState({ speakerId: 'player1' });
      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player2',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn to pick');
    });

    it('should allow next player after speaker has picked', () => {
      const state = createMockGameState({ speakerId: 'player1' });
      // Player1 (speaker) has already picked
      state.players[0].strategyCard = 1;
      state.strategyCards[0].pickedBy = 'player1';

      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player2', // Next in clockwise order
        cardNumber: 2,
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if player picks out of turn', () => {
      const state = createMockGameState({ speakerId: 'player1' });
      // Player1 (speaker) has already picked
      state.players[0].strategyCard = 1;
      state.strategyCards[0].pickedBy = 'player1';

      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player3', // Should be player2's turn
        cardNumber: 3,
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn to pick');
    });

    it('should correctly handle pick order when speaker is not first in array', () => {
      const state = createMockGameState({ speakerId: 'player3' });

      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player3', // Speaker
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(true);
    });

    it('should wrap around to first player after last', () => {
      const state = createMockGameState({ speakerId: 'player3' });
      // Players 3 and 4 have picked
      state.players[2].strategyCard = 1; // player3
      state.players[3].strategyCard = 2; // player4
      state.strategyCards[0].pickedBy = 'player3';
      state.strategyCards[1].pickedBy = 'player4';

      // Next should be player1 (wraps around)
      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player1',
        cardNumber: 3,
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('valid picks', () => {
    it('should allow valid strategy card pick', () => {
      const state = createMockGameState({ speakerId: 'player1' });
      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player1',
        cardNumber: 7, // Technology
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow picking any unpicked card', () => {
      const state = createMockGameState({ speakerId: 'player1' });

      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player1',
        cardNumber: 7, // Technology
        timestamp: Date.now(),
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(true);
    });
  });
});

describe('getAvailableStrategyCards', () => {
  it('should return all cards when none are picked', () => {
    const state = createMockGameState();

    const available = getAvailableStrategyCards(state);

    expect(available).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('should exclude picked cards', () => {
    const state = createMockGameState();
    state.strategyCards[0].pickedBy = 'player1'; // Card 1
    state.strategyCards[2].pickedBy = 'player2'; // Card 3

    const available = getAvailableStrategyCards(state);

    expect(available).toEqual([2, 4, 5, 6, 7, 8]);
  });

  it('should return empty array when all cards are picked', () => {
    const state = createMockGameState();
    state.strategyCards.forEach((card, i) => {
      card.pickedBy = `player${i % 4 + 1}`;
    });

    const available = getAvailableStrategyCards(state);

    expect(available).toEqual([]);
  });
});
