/**
 * Tests for Thunder's Edge Fracture System
 */

import { describe, it, expect } from 'vitest';
import type {
  GameState,
  PlayerState,
  MapTile,
  UnitInstance,
  PlanetState,
} from '@ti4/shared';
import {
  initializeFracture,
  handlePlaceIngress,
  handleMoveIngress,
  removeIngressToken,
  canAccessFracture,
  getFractureMovementBonus,
  isInFracture,
  getFractureSystemIds,
  getNeutralUnitsInSystem,
  removeNeutralUnit,
  getNeutralUnitCombatValue,
  handleFracturePlanetGained,
  handleFracturePlanetLost,
  resetFractureForNewRound,
} from '../fracture.js';

// ============================================================================
// Test Utilities
// ============================================================================

function createMockUnit(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: `unit-${Math.random().toString(36).substr(2, 9)}`,
    type: 'cruiser',
    ownerId: 'player1',
    damaged: false,
    ...overrides,
  } as UnitInstance;
}

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
  } as MapTile;
}

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Test Player',
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 5,
    commodities: 2,
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
  } as PlayerState;
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: ['player1', 'player2'],
    players: [
      createMockPlayer({ id: 'player1' }),
      createMockPlayer({ id: 'player2' }),
    ],
    map: {
      tiles: [createMockTile()],
      playerCount: 6,
    },
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

// ============================================================================
// Initialization Tests
// ============================================================================

describe('Fracture Initialization', () => {
  describe('initializeFracture', () => {
    it('should create fracture state with correct structure', () => {
      const fracture = initializeFracture();

      expect(fracture.isActive).toBe(true);
      expect(fracture.ingressTokens).toHaveLength(0);
      expect(fracture.playersEnteredThisRound).toHaveLength(0);
    });

    it('should generate neutral guard units', () => {
      const fracture = initializeFracture();

      expect(fracture.neutralUnits.length).toBeGreaterThan(0);

      // Check for units in different systems
      const system125Units = fracture.neutralUnits.filter(u => u.systemId === '125');
      const system126Units = fracture.neutralUnits.filter(u => u.systemId === '126');
      const system127Units = fracture.neutralUnits.filter(u => u.systemId === '127');

      expect(system125Units.length).toBeGreaterThan(0);
      expect(system126Units.length).toBeGreaterThan(0);
      expect(system127Units.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Ingress Token Tests
// ============================================================================

describe('Ingress Token Management', () => {
  describe('handlePlaceIngress', () => {
    it('should place ingress token for player with units in system', () => {
      const unit = createMockUnit({ ownerId: 'player1' });
      const tile = createMockTile({ id: 'system-1', units: [unit] });
      const state = createMockGameState({ map: { tiles: [tile], playerCount: 6 } });

      const result = handlePlaceIngress(state, {
        type: 'place_ingress',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(true);
      expect(state.fractureState).toBeDefined();
      expect(state.fractureState!.ingressTokens).toHaveLength(1);
      expect(state.fractureState!.ingressTokens[0].playerId).toBe('player1');
    });

    it('should fail if player has no units in system', () => {
      const tile = createMockTile({ id: 'system-1', units: [] });
      const state = createMockGameState({ map: { tiles: [tile], playerCount: 6 } });

      const result = handlePlaceIngress(state, {
        type: 'place_ingress',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player must have units in the system');
    });

    it('should fail if player already has ingress token', () => {
      const unit = createMockUnit({ ownerId: 'player1' });
      const tile = createMockTile({ id: 'system-1', units: [unit] });
      const state = createMockGameState({
        map: { tiles: [tile], playerCount: 6 },
        fractureState: {
          isActive: true,
          ingressTokens: [{ playerId: 'player1', systemId: 'system-2', active: true }],
          neutralUnits: [],
          playersEnteredThisRound: [],
        },
      });

      const result = handlePlaceIngress(state, {
        type: 'place_ingress',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player already has an ingress token');
    });
  });

  describe('handleMoveIngress', () => {
    it('should move ingress token to new system', () => {
      const tile1 = createMockTile({ id: 'system-1' });
      const tile2 = createMockTile({ id: 'system-2' });
      const state = createMockGameState({
        map: { tiles: [tile1, tile2], playerCount: 6 },
        fractureState: {
          isActive: true,
          ingressTokens: [{ playerId: 'player1', systemId: 'system-1', active: true }],
          neutralUnits: [],
          playersEnteredThisRound: [],
        },
      });

      const result = handleMoveIngress(state, {
        type: 'move_ingress',
        playerId: 'player1',
        toSystemId: 'system-2',
      });

      expect(result.success).toBe(true);
      expect(state.fractureState!.ingressTokens[0].systemId).toBe('system-2');
    });

    it('should fail if player has no ingress token', () => {
      const state = createMockGameState({
        fractureState: {
          isActive: true,
          ingressTokens: [],
          neutralUnits: [],
          playersEnteredThisRound: [],
        },
      });

      const result = handleMoveIngress(state, {
        type: 'move_ingress',
        playerId: 'player1',
        toSystemId: 'system-2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player has no ingress token');
    });
  });

  describe('removeIngressToken', () => {
    it('should remove ingress token', () => {
      const state = createMockGameState({
        fractureState: {
          isActive: true,
          ingressTokens: [{ playerId: 'player1', systemId: 'system-1', active: true }],
          neutralUnits: [],
          playersEnteredThisRound: [],
        },
      });

      const result = removeIngressToken(state, 'player1');

      expect(result.success).toBe(true);
      expect(state.fractureState!.ingressTokens).toHaveLength(0);
    });
  });
});

// ============================================================================
// Fracture Access Tests
// ============================================================================

describe('Fracture Access', () => {
  describe('canAccessFracture', () => {
    it('should return true when player has active ingress in system', () => {
      const state = createMockGameState({
        fractureState: {
          isActive: true,
          ingressTokens: [{ playerId: 'player1', systemId: 'system-1', active: true }],
          neutralUnits: [],
          playersEnteredThisRound: [],
        },
      });

      expect(canAccessFracture(state, 'player1', 'system-1')).toBe(true);
    });

    it('should return false when player has no ingress in system', () => {
      const state = createMockGameState({
        fractureState: {
          isActive: true,
          ingressTokens: [{ playerId: 'player1', systemId: 'system-2', active: true }],
          neutralUnits: [],
          playersEnteredThisRound: [],
        },
      });

      expect(canAccessFracture(state, 'player1', 'system-1')).toBe(false);
    });

    it('should return false when fracture is not active', () => {
      const state = createMockGameState();

      expect(canAccessFracture(state, 'player1', 'system-1')).toBe(false);
    });
  });

  describe('getFractureMovementBonus', () => {
    it('should return 1 for Vul\'Raith with unlocked breakthrough', () => {
      const state = createMockGameState();
      state.players[0].breakthrough = {
        breakthroughId: 'alraith_ix_ianovar',
        unlocked: true,
        exhausted: false,
      };

      expect(getFractureMovementBonus(state, 'player1')).toBe(1);
    });

    it('should return 0 for other players', () => {
      const state = createMockGameState();

      expect(getFractureMovementBonus(state, 'player1')).toBe(0);
    });
  });

  describe('isInFracture', () => {
    it('should return true for fracture system IDs', () => {
      expect(isInFracture('125')).toBe(true);
      expect(isInFracture('126')).toBe(true);
      expect(isInFracture('127')).toBe(true);
    });

    it('should return false for non-fracture systems', () => {
      expect(isInFracture('1')).toBe(false);
      expect(isInFracture('18')).toBe(false);
    });
  });

  describe('getFractureSystemIds', () => {
    it('should return all fracture system IDs', () => {
      const ids = getFractureSystemIds();
      expect(ids).toContain('125');
      expect(ids).toContain('126');
      expect(ids).toContain('127');
      expect(ids).toHaveLength(3);
    });
  });
});

// ============================================================================
// Neutral Unit Tests
// ============================================================================

describe('Neutral Units', () => {
  describe('getNeutralUnitsInSystem', () => {
    it('should return neutral units in the specified system', () => {
      const state = createMockGameState({
        fractureState: initializeFracture(),
      });

      const units = getNeutralUnitsInSystem(state, '125');
      expect(units.length).toBeGreaterThan(0);
      expect(units.every(u => u.systemId === '125')).toBe(true);
    });

    it('should return empty array when no fracture state', () => {
      const state = createMockGameState();

      const units = getNeutralUnitsInSystem(state, '125');
      expect(units).toHaveLength(0);
    });
  });

  describe('removeNeutralUnit', () => {
    it('should remove specified neutral unit', () => {
      const state = createMockGameState({
        fractureState: initializeFracture(),
      });
      const unitId = state.fractureState!.neutralUnits[0].id;

      const result = removeNeutralUnit(state, unitId);

      expect(result.success).toBe(true);
      expect(state.fractureState!.neutralUnits.find(u => u.id === unitId)).toBeUndefined();
    });

    it('should fail when unit not found', () => {
      const state = createMockGameState({
        fractureState: initializeFracture(),
      });

      const result = removeNeutralUnit(state, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Neutral unit not found');
    });
  });

  describe('getNeutralUnitCombatValue', () => {
    it('should return correct combat values', () => {
      expect(getNeutralUnitCombatValue('neutral_cruiser')).toBe(7);
      expect(getNeutralUnitCombatValue('neutral_fighter')).toBe(9);
      expect(getNeutralUnitCombatValue('neutral_infantry')).toBe(8);
    });
  });
});

// ============================================================================
// Planet Control Tests
// ============================================================================

describe('Fracture Planet Control', () => {
  describe('handleFracturePlanetGained', () => {
    it('should grant relic when gaining fracture planet', () => {
      const state = createMockGameState({
        fractureState: {
          isActive: true,
          ingressTokens: [],
          neutralUnits: [], // No defenders remaining
          playersEnteredThisRound: [],
        },
      });

      const result = handleFracturePlanetGained(state, 'player1', 'cocytus');

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('fracture_planet_gained');
      expect(result.triggeredEvents).toContain('relic_gained');
    });

    it('should grant VP when gaining Styx', () => {
      const state = createMockGameState({
        fractureState: {
          isActive: true,
          ingressTokens: [],
          neutralUnits: [],
          playersEnteredThisRound: [],
        },
      });

      const result = handleFracturePlanetGained(state, 'player1', 'styx');

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('victory_point_gained');
      expect(state.players[0].score).toBe(1);
    });

    it('should fail if neutral units still defend', () => {
      const state = createMockGameState({
        fractureState: {
          isActive: true,
          ingressTokens: [],
          neutralUnits: [{ id: 'n1', type: 'neutral_infantry', systemId: '125', planetId: 'cocytus' }],
          playersEnteredThisRound: [],
        },
      });

      const result = handleFracturePlanetGained(state, 'player1', 'cocytus');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Neutral units still defending this planet');
    });
  });

  describe('handleFracturePlanetLost', () => {
    it('should lose VP when losing Styx', () => {
      const state = createMockGameState();
      state.players[0].score = 5;

      const result = handleFracturePlanetLost(state, 'player1', 'styx');

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('victory_point_lost');
      expect(state.players[0].score).toBe(4);
    });
  });
});

// ============================================================================
// Round Reset Tests
// ============================================================================

describe('Round Reset', () => {
  describe('resetFractureForNewRound', () => {
    it('should clear players entered this round', () => {
      const state = createMockGameState({
        fractureState: {
          isActive: true,
          ingressTokens: [],
          neutralUnits: [],
          playersEnteredThisRound: ['player1', 'player2'],
        },
      });

      resetFractureForNewRound(state);

      expect(state.fractureState!.playersEnteredThisRound).toHaveLength(0);
    });
  });
});
