import { describe, it, expect, beforeEach } from 'vitest';
import { handlePickStrategyCard } from '../strategy-phase.js';
import type { GameState, PlayerState, PickStrategyCardAction } from '@ti4/shared';

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
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

function createMockGameState(playerCount: number = 4): GameState {
  const players: PlayerState[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(createMockPlayer(`player${i + 1}`, {
      name: `Player ${i + 1}`,
      seatIndex: i,
      color: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'][i] as any,
    }));
  }

  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'strategy',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: [],
    players,
    map: {
      tiles: [],
      playerCount,
    },
    strategyCards: [
      { number: 1, name: 'Leadership', pickedBy: null, exhausted: false },
      { number: 2, name: 'Diplomacy', pickedBy: null, exhausted: false },
      { number: 3, name: 'Politics', pickedBy: null, exhausted: false },
      { number: 4, name: 'Construction', pickedBy: null, exhausted: false },
      { number: 5, name: 'Trade', pickedBy: null, exhausted: false },
      { number: 6, name: 'Warfare', pickedBy: null, exhausted: false },
      { number: 7, name: 'Technology', pickedBy: null, exhausted: false },
      { number: 8, name: 'Imperial', pickedBy: null, exhausted: false },
    ],
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
    timingWindows: [],
    winner: null,
  };
}

describe('Strategy Phase Handler', () => {
  describe('handlePickStrategyCard', () => {
    it('should assign strategy card to player', () => {
      const state = createMockGameState(4);
      const action: PickStrategyCardAction = {
        type: 'pick_strategy_card',
        playerId: 'player1',
        cardNumber: 3,
        timestamp: Date.now(),
      };

      const result = handlePickStrategyCard(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].strategyCard).toBe(3);
      expect(state.strategyCards[2].pickedBy).toBe('player1');
    });

    it('should advance to next player after pick', () => {
      const state = createMockGameState(4);
      const action: PickStrategyCardAction = {
        type: 'pick_strategy_card',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      handlePickStrategyCard(state, action);

      // After player1 picks, player2 should be active
      expect(state.activePlayerId).toBe('player2');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState(4);
      const action: PickStrategyCardAction = {
        type: 'pick_strategy_card',
        playerId: 'nonexistent',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = handlePickStrategyCard(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if strategy card not found', () => {
      const state = createMockGameState(4);
      const action: PickStrategyCardAction = {
        type: 'pick_strategy_card',
        playerId: 'player1',
        cardNumber: 99,
        timestamp: Date.now(),
      };

      const result = handlePickStrategyCard(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Strategy card not found');
    });

    it('should handle multiple picks in sequence', () => {
      const state = createMockGameState(4);

      // Player 1 picks card 1
      handlePickStrategyCard(state, {
        type: 'pick_strategy_card',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      });

      // Player 2 picks card 2
      handlePickStrategyCard(state, {
        type: 'pick_strategy_card',
        playerId: 'player2',
        cardNumber: 2,
        timestamp: Date.now(),
      });

      // Player 3 picks card 3
      handlePickStrategyCard(state, {
        type: 'pick_strategy_card',
        playerId: 'player3',
        cardNumber: 3,
        timestamp: Date.now(),
      });

      // Verify picks
      expect(state.players[0].strategyCard).toBe(1);
      expect(state.players[1].strategyCard).toBe(2);
      expect(state.players[2].strategyCard).toBe(3);
      expect(state.strategyCards[0].pickedBy).toBe('player1');
      expect(state.strategyCards[1].pickedBy).toBe('player2');
      expect(state.strategyCards[2].pickedBy).toBe('player3');
    });

    it('should work with 3 players (2 cards each)', () => {
      const state = createMockGameState(3);

      // First round of picks
      handlePickStrategyCard(state, {
        type: 'pick_strategy_card',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      });
      expect(state.activePlayerId).toBe('player2');

      handlePickStrategyCard(state, {
        type: 'pick_strategy_card',
        playerId: 'player2',
        cardNumber: 2,
        timestamp: Date.now(),
      });
      expect(state.activePlayerId).toBe('player3');

      handlePickStrategyCard(state, {
        type: 'pick_strategy_card',
        playerId: 'player3',
        cardNumber: 3,
        timestamp: Date.now(),
      });

      // After 3 picks, each player has 1 card
      expect(state.players[0].strategyCard).toBe(1);
      expect(state.players[1].strategyCard).toBe(2);
      expect(state.players[2].strategyCard).toBe(3);
    });

    it('should emit strategy_card_picked event', () => {
      const state = createMockGameState(4);
      const action: PickStrategyCardAction = {
        type: 'pick_strategy_card',
        playerId: 'player1',
        cardNumber: 5,
        timestamp: Date.now(),
      };

      const result = handlePickStrategyCard(state, action);

      expect(result.triggeredEvents).toContain('strategy_card_picked');
    });
  });
});
