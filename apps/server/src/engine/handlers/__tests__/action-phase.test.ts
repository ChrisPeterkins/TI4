import { describe, it, expect, beforeEach } from 'vitest';
import { handlePass, handleStrategicAction } from '../action-phase.js';
import type { GameState, PlayerState, PassAction, StrategicAction } from '@ti4/shared';

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
      strategyCard: i + 1, // Each player has a strategy card
    }));
  }

  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: players.map(p => p.id), // player1, player2, player3, player4
    players,
    map: {
      tiles: [],
      playerCount,
    },
    strategyCards: [
      { number: 1, name: 'Leadership', pickedBy: 'player1', exhausted: false },
      { number: 2, name: 'Diplomacy', pickedBy: 'player2', exhausted: false },
      { number: 3, name: 'Politics', pickedBy: 'player3', exhausted: false },
      { number: 4, name: 'Construction', pickedBy: 'player4', exhausted: false },
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

describe('Action Phase Handler', () => {
  describe('handlePass', () => {
    it('should mark player as passed', () => {
      const state = createMockGameState(4);
      const action: PassAction = {
        type: 'pass',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePass(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].passed).toBe(true);
    });

    it('should advance to next non-passed player', () => {
      const state = createMockGameState(4);
      const action: PassAction = {
        type: 'pass',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      handlePass(state, action);

      expect(state.activePlayerId).toBe('player2');
    });

    it('should skip already passed players', () => {
      const state = createMockGameState(4);
      // Mark player2 as already passed
      state.players[1].passed = true;

      const action: PassAction = {
        type: 'pass',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      handlePass(state, action);

      // Should skip player2 and go to player3
      expect(state.activePlayerId).toBe('player3');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState(4);
      const action: PassAction = {
        type: 'pass',
        playerId: 'nonexistent',
        timestamp: Date.now(),
      };

      const result = handlePass(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should emit player_passed event', () => {
      const state = createMockGameState(4);
      const action: PassAction = {
        type: 'pass',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePass(state, action);

      expect(result.triggeredEvents).toContain('player_passed');
    });

    it('should handle all players passing', () => {
      const state = createMockGameState(4);
      // Mark all but player1 as passed
      state.players[1].passed = true;
      state.players[2].passed = true;
      state.players[3].passed = true;

      const action: PassAction = {
        type: 'pass',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePass(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].passed).toBe(true);
      // All players have passed - activePlayerId may stay the same
    });
  });

  describe('handleStrategicAction', () => {
    it('should mark strategy card as exhausted', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = handleStrategicAction(state, action);

      expect(result.success).toBe(true);
      expect(state.strategyCards[0].exhausted).toBe(true);
    });

    it('should mark player as having used strategy card', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      handleStrategicAction(state, action);

      expect(state.players[0].strategyCardUsed).toBe(true);
    });

    it('should enter strategic_primary sub-phase', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      handleStrategicAction(state, action);

      expect(state.subPhase).toBe('strategic_primary');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'nonexistent',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = handleStrategicAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if strategy card not found', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 99,
        timestamp: Date.now(),
      };

      const result = handleStrategicAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Strategy card not found');
    });

    it('should emit strategic_action_started event', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = handleStrategicAction(state, action);

      expect(result.triggeredEvents).toContain('strategic_action_started');
    });
  });
});
