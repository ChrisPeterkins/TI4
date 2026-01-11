import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerAbilityHandler,
  getAbilityHandler,
  hasAbilityHandler,
  executeAbility,
  getRegisteredHandlerIds,
  clearHandlers,
} from '../ability-registry.js';
import type { GameState, MapTile, PlayerState, MapState } from '@ti4/shared';
import type { AbilityHandler, AbilityResult } from '../ability-types.js';

function createMockTile(overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: 'tile-1',
    systemId: 1,
    position: { q: 0, r: 0 },
    rotation: 0,
    planets: [],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
    ...overrides,
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

function createMockGameState(players: PlayerState[] = []): GameState {
  return {
    id: 'game1',
    version: 1,
    round: 1,
    phase: 'action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: [],
    players: players.length > 0 ? players : [createMockPlayer()],
    map: { tiles: [createMockTile()], playerCount: 6 } as MapState,
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
  };
}

describe('Ability Registry', () => {
  beforeEach(() => {
    // Clear all handlers before each test for isolation
    clearHandlers();
  });

  describe('registerAbilityHandler', () => {
    it('should register a new handler', () => {
      const mockHandler: AbilityHandler = () => ({ success: true });

      registerAbilityHandler('test_ability', mockHandler);

      expect(hasAbilityHandler('test_ability')).toBe(true);
    });

    it('should overwrite existing handler with same ID', () => {
      const firstHandler: AbilityHandler = () => ({ success: true, message: 'first' });
      const secondHandler: AbilityHandler = () => ({ success: true, message: 'second' });

      registerAbilityHandler('test_ability', firstHandler);
      registerAbilityHandler('test_ability', secondHandler);

      const handler = getAbilityHandler('test_ability');
      const state = createMockGameState();
      const result = handler!(state, 'player1', {});

      expect(result.message).toBe('second');
    });
  });

  describe('getAbilityHandler', () => {
    it('should return registered handler', () => {
      const mockHandler: AbilityHandler = () => ({ success: true });
      registerAbilityHandler('test_ability', mockHandler);

      const handler = getAbilityHandler('test_ability');

      expect(handler).toBe(mockHandler);
    });

    it('should return undefined for unregistered handler', () => {
      const handler = getAbilityHandler('nonexistent');

      expect(handler).toBeUndefined();
    });
  });

  describe('hasAbilityHandler', () => {
    it('should return true for registered handler', () => {
      registerAbilityHandler('test_ability', () => ({ success: true }));

      expect(hasAbilityHandler('test_ability')).toBe(true);
    });

    it('should return false for unregistered handler', () => {
      expect(hasAbilityHandler('nonexistent')).toBe(false);
    });
  });

  describe('executeAbility', () => {
    it('should execute registered handler and return result', () => {
      const mockHandler: AbilityHandler = (_state, playerId) => ({
        success: true,
        message: `Executed for ${playerId}`,
      });
      registerAbilityHandler('test_ability', mockHandler);
      const state = createMockGameState();

      const result = executeAbility(state, 'player1', 'test_ability');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Executed for player1');
    });

    it('should return error for unregistered handler', () => {
      const state = createMockGameState();

      const result = executeAbility(state, 'player1', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No handler found for ability: nonexistent');
    });

    it('should pass context to handler', () => {
      const mockHandler: AbilityHandler = (_state, _playerId, context) => ({
        success: true,
        message: `System: ${context.systemId}`,
      });
      registerAbilityHandler('test_ability', mockHandler);
      const state = createMockGameState();

      const result = executeAbility(state, 'player1', 'test_ability', {
        systemId: 'system-123',
      });

      expect(result.message).toBe('System: system-123');
    });

    it('should use empty context when not provided', () => {
      const mockHandler: AbilityHandler = (_state, _playerId, context) => ({
        success: true,
        message: `Keys: ${Object.keys(context).length}`,
      });
      registerAbilityHandler('test_ability', mockHandler);
      const state = createMockGameState();

      const result = executeAbility(state, 'player1', 'test_ability');

      expect(result.message).toBe('Keys: 0');
    });

    it('should catch and return error if handler throws', () => {
      const mockHandler: AbilityHandler = () => {
        throw new Error('Something went wrong');
      };
      registerAbilityHandler('throwing_ability', mockHandler);
      const state = createMockGameState();

      const result = executeAbility(state, 'player1', 'throwing_ability');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error executing ability: Something went wrong');
    });

    it('should handle non-Error thrown objects', () => {
      const mockHandler: AbilityHandler = () => {
        throw 'string error';
      };
      registerAbilityHandler('throwing_ability', mockHandler);
      const state = createMockGameState();

      const result = executeAbility(state, 'player1', 'throwing_ability');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error executing ability: Unknown error');
    });
  });

  describe('getRegisteredHandlerIds', () => {
    it('should return empty array when no handlers registered', () => {
      const ids = getRegisteredHandlerIds();

      expect(ids).toEqual([]);
    });

    it('should return all registered handler IDs', () => {
      registerAbilityHandler('ability_a', () => ({ success: true }));
      registerAbilityHandler('ability_b', () => ({ success: true }));
      registerAbilityHandler('ability_c', () => ({ success: true }));

      const ids = getRegisteredHandlerIds();

      expect(ids).toHaveLength(3);
      expect(ids).toContain('ability_a');
      expect(ids).toContain('ability_b');
      expect(ids).toContain('ability_c');
    });
  });

  describe('clearHandlers', () => {
    it('should remove all registered handlers', () => {
      registerAbilityHandler('ability_a', () => ({ success: true }));
      registerAbilityHandler('ability_b', () => ({ success: true }));

      clearHandlers();

      expect(getRegisteredHandlerIds()).toEqual([]);
      expect(hasAbilityHandler('ability_a')).toBe(false);
      expect(hasAbilityHandler('ability_b')).toBe(false);
    });
  });
});
