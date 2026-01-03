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
import type { GameState, PlayerState, StrategyCard } from '@ti4/shared';
import { validatePickStrategyCard, getAvailableStrategyCards } from '../strategy-phase.js';

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    faction: 'sol',
    color: 'blue',
    name: 'Test Player',
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    resources: 5,
    influence: 5,
    commodities: 2,
    maxCommodities: 4,
    tradeGoods: 2,
    technologies: [],
    planets: [],
    controlledSystems: [],
    victoryPoints: 0,
    secretObjectives: [],
    actionCards: [],
    promissoryNotes: [],
    scoredObjectives: [],
    scoredSecretObjectives: [],
    custodiansTaken: false,
    passed: false,
    speaker: false,
    strategyCard: null,
    strategyCardUsed: false,
    activatedSystems: [],
    unitUpgrades: {},
    leaders: {
      agent: { id: 'sol_agent', unlocked: true, exhausted: false },
      commander: { id: 'sol_commander', unlocked: false, exhausted: false },
      hero: { id: 'sol_hero', unlocked: false, purged: false },
    },
    relics: [],
    fragments: { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 },
    exhaustedPlanets: [],
    exhaustedTechs: [],
    exhaustedAgents: [],
    ...overrides,
  };
}

function createMockStrategyCard(number: number, overrides: Partial<StrategyCard> = {}): StrategyCard {
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
    tradeGoods: 0,
    exhausted: false,
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createMockPlayer({ id: 'player1' });
  const player2 = createMockPlayer({ id: 'player2' });
  const player3 = createMockPlayer({ id: 'player3' });
  const player4 = createMockPlayer({ id: 'player4' });

  const strategyCards: StrategyCard[] = [
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
    name: 'Test Game',
    phase: 'strategy',
    subPhase: 'pick_strategy_cards',
    round: 1,
    turn: 0,
    players: [player1, player2, player3, player4],
    map: { tiles: [] },
    objectives: { stage1: [], stage2: [], revealed: [], secret: [] },
    laws: [],
    activePlayerId: 'player1',
    speakerId: 'player1',
    activeCombat: null,
    agendaPhase: null,
    turnOrder: ['player1', 'player2', 'player3', 'player4'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    miltyDraft: null,
    actionDeck: [],
    actionDiscardPile: [],
    agendaDeck: [],
    agendaDiscardPile: [],
    stageTwoRevealed: false,
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
      };

      const result = validatePickStrategyCard(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow picking card with trade goods on it', () => {
      const state = createMockGameState({ speakerId: 'player1' });
      state.strategyCards[6].tradeGoods = 2; // Technology has 2 TGs from previous round

      const action = {
        type: 'pick_strategy_card' as const,
        playerId: 'player1',
        cardNumber: 7, // Technology
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
