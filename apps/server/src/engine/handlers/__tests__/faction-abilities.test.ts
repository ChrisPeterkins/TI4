/**
 * Tests for Thunder's Edge Faction Ability Handlers
 */

import { describe, it, expect } from 'vitest';
import type {
  GameState,
  PlayerState,
  MapTile,
  UnitInstance,
  PlanetInstance,
} from '@ti4/shared';

// Last Bastion
import {
  isUnitGalvanized,
  handleGalvanize,
  removeGalvanizeToken,
  getGalvanizeCombatBonus,
  getGalvanizeBombardmentReduction,
  handleLiberate,
  handlePhoenixStandard,
  canUsePhoenixStandard,
  cleanupDestroyedGalvanizedUnits,
} from '../last-bastion.js';

// Deepwrought
import {
  hasCoexistence,
  canInitiateCoexistence,
  handleStartCoexistence,
  handleEndCoexistence,
  countCoexistingPlanets,
  grantOceanCard,
  handlePlayOceanCard,
} from '../deepwrought.js';

// Ral Nel
import {
  isStructure,
  canTransportStructures,
  handlePickupStructure,
  handlePlaceStructure,
  canUseSurvivalInstinct,
  handleSurvivalInstinct,
} from '../ral-nel.js';

// Crimson Rebellion
import {
  isSundered,
  canUseWormhole,
  hasActiveBreachToken,
  areSystemsConnectedByBreach,
  handlePlaceBreach,
  handleFlipBreach,
  handleRemoveBreach,
  getBreachAdjacentSystems,
} from '../crimson-rebellion.js';

// Firmament/Obsidian
import {
  isFirmamentOrObsidian,
  isObsidian,
  handleDrawPlotCard,
  handlePlayPlotCard,
  handleTransformToObsidian,
  shouldTriggerPlotsWithinPlots,
} from '../firmament.js';

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

function createMockPlanet(overrides: Partial<PlanetInstance> = {}): PlanetInstance {
  return {
    id: 'planet-1',
    planetId: 'test_planet',
    controlledBy: null,
    exhausted: false,
    attachments: [],
    units: [],
    ...overrides,
  } as PlanetInstance;
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
// LAST BASTION TESTS
// ============================================================================

describe('Last Bastion - Galvanize', () => {
  describe('handleGalvanize', () => {
    it('should galvanize a unit for Last Bastion player', () => {
      const unit = createMockUnit({ id: 'unit-1', ownerId: 'player1' });
      const tile = createMockTile({ id: 'system-1', units: [unit] });
      const player = createMockPlayer({ id: 'player1', faction: 'last_bastion' });
      const state = createMockGameState({
        players: [player],
        map: { tiles: [tile], playerCount: 6 },
      });

      const result = handleGalvanize(state, {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      });

      expect(result.success).toBe(true);
      expect(state.players[0].galvanizeTokens).toContain('unit-1');
    });

    it('should fail for non-Last Bastion player', () => {
      const unit = createMockUnit({ id: 'unit-1', ownerId: 'player1' });
      const tile = createMockTile({ id: 'system-1', units: [unit] });
      const player = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState({
        players: [player],
        map: { tiles: [tile], playerCount: 6 },
      });

      const result = handleGalvanize(state, {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only Last Bastion can galvanize units');
    });

    it('should fail if unit is already galvanized', () => {
      const unit = createMockUnit({ id: 'unit-1', ownerId: 'player1' });
      const tile = createMockTile({ id: 'system-1', units: [unit] });
      const player = createMockPlayer({
        id: 'player1',
        faction: 'last_bastion',
        galvanizeTokens: ['unit-1'],
      });
      const state = createMockGameState({
        players: [player],
        map: { tiles: [tile], playerCount: 6 },
      });

      const result = handleGalvanize(state, {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit is already galvanized');
    });
  });

  describe('isUnitGalvanized', () => {
    it('should return true for galvanized unit', () => {
      const player = createMockPlayer({
        id: 'player1',
        galvanizeTokens: ['unit-1', 'unit-2'],
      });
      const state = createMockGameState({ players: [player] });

      expect(isUnitGalvanized(state, 'player1', 'unit-1')).toBe(true);
      expect(isUnitGalvanized(state, 'player1', 'unit-2')).toBe(true);
    });

    it('should return false for non-galvanized unit', () => {
      const player = createMockPlayer({
        id: 'player1',
        galvanizeTokens: ['unit-1'],
      });
      const state = createMockGameState({ players: [player] });

      expect(isUnitGalvanized(state, 'player1', 'unit-3')).toBe(false);
    });
  });

  describe('getGalvanizeCombatBonus', () => {
    it('should return 1 for galvanized unit', () => {
      const player = createMockPlayer({
        id: 'player1',
        galvanizeTokens: ['unit-1'],
      });
      const state = createMockGameState({ players: [player] });

      expect(getGalvanizeCombatBonus(state, 'player1', 'unit-1')).toBe(1);
    });

    it('should return 0 for non-galvanized unit', () => {
      const player = createMockPlayer({ id: 'player1' });
      const state = createMockGameState({ players: [player] });

      expect(getGalvanizeCombatBonus(state, 'player1', 'unit-1')).toBe(0);
    });
  });

  describe('cleanupDestroyedGalvanizedUnits', () => {
    it('should remove galvanize tokens for destroyed units', () => {
      const player = createMockPlayer({
        id: 'player1',
        galvanizeTokens: ['unit-1', 'unit-2', 'unit-3'],
      });
      const state = createMockGameState({ players: [player] });

      cleanupDestroyedGalvanizedUnits(state, 'player1', ['unit-1', 'unit-3']);

      expect(state.players[0].galvanizeTokens).toEqual(['unit-2']);
    });
  });
});

// ============================================================================
// DEEPWROUGHT TESTS
// ============================================================================

describe('Deepwrought - Coexistence', () => {
  describe('canInitiateCoexistence', () => {
    it('should return true for Deepwrought with enemy units on planet', () => {
      const enemyUnit = createMockUnit({ id: 'unit-1', ownerId: 'player2', type: 'infantry' });
      const planet = createMockPlanet({ id: 'planet-1', units: [enemyUnit] });
      const tile = createMockTile({ id: 'system-1', planets: [planet] });
      const player = createMockPlayer({ id: 'player1', faction: 'deepwrought' });
      const state = createMockGameState({
        players: [player, createMockPlayer({ id: 'player2' })],
        map: { tiles: [tile], playerCount: 6 },
      });

      expect(canInitiateCoexistence(state, 'player1', 'planet-1')).toBe(true);
    });

    it('should return false for non-Deepwrought player', () => {
      const enemyUnit = createMockUnit({ id: 'unit-1', ownerId: 'player2', type: 'infantry' });
      const planet = createMockPlanet({ id: 'planet-1', units: [enemyUnit] });
      const tile = createMockTile({ id: 'system-1', planets: [planet] });
      const player = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState({
        players: [player],
        map: { tiles: [tile], playerCount: 6 },
      });

      expect(canInitiateCoexistence(state, 'player1', 'planet-1')).toBe(false);
    });
  });

  describe('handleStartCoexistence', () => {
    it('should create coexistence state and grant ocean card', () => {
      const enemyUnit = createMockUnit({ id: 'unit-1', ownerId: 'player2', type: 'infantry' });
      const planet = createMockPlanet({ id: 'planet-1', units: [enemyUnit] });
      const tile = createMockTile({ id: 'system-1', planets: [planet] });
      const player = createMockPlayer({ id: 'player1', faction: 'deepwrought' });
      const state = createMockGameState({
        players: [player, createMockPlayer({ id: 'player2' })],
        map: { tiles: [tile], playerCount: 6 },
      });

      const result = handleStartCoexistence(state, {
        type: 'start_coexistence',
        playerId: 'player1',
        planetId: 'planet-1',
      });

      expect(result.success).toBe(true);
      expect(state.coexistenceState).toHaveLength(1);
      expect(result.triggeredEvents).toContain('coexistence_started');
    });
  });

  describe('grantOceanCard', () => {
    it('should add ocean card to player', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'deepwrought' });
      const state = createMockGameState({ players: [player] });

      const cardId = grantOceanCard(state, 'player1');

      expect(cardId).toBeDefined();
      expect(state.players[0].oceanCards).toContain(cardId);
    });
  });
});

// ============================================================================
// RAL NEL TESTS
// ============================================================================

describe('Ral Nel - Miniaturization', () => {
  describe('isStructure', () => {
    it('should return true for PDS and Space Dock', () => {
      expect(isStructure('pds')).toBe(true);
      expect(isStructure('space_dock')).toBe(true);
    });

    it('should return false for ships', () => {
      expect(isStructure('cruiser')).toBe(false);
      expect(isStructure('dreadnought')).toBe(false);
    });
  });

  describe('canTransportStructures', () => {
    it('should return true for Ral Nel player', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'ral_nel' });
      const state = createMockGameState({ players: [player] });

      expect(canTransportStructures(state, 'player1')).toBe(true);
    });

    it('should return false for non-Ral Nel player', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState({ players: [player] });

      expect(canTransportStructures(state, 'player1')).toBe(false);
    });
  });

  describe('handlePickupStructure', () => {
    it('should move structure from planet to space', () => {
      const structure = createMockUnit({ id: 'pds-1', ownerId: 'player1', type: 'pds', planetId: 'planet-1' });
      const ship = createMockUnit({ id: 'carrier-1', ownerId: 'player1', type: 'carrier' });
      const planet = createMockPlanet({ id: 'planet-1', units: [structure] });
      const tile = createMockTile({ id: 'system-1', units: [ship], planets: [planet] });
      const player = createMockPlayer({ id: 'player1', faction: 'ral_nel' });
      const state = createMockGameState({
        players: [player],
        map: { tiles: [tile], playerCount: 6 },
      });

      const result = handlePickupStructure(state, {
        type: 'transport_structure',
        playerId: 'player1',
        structureId: 'pds-1',
        shipId: 'carrier-1',
      });

      expect(result.success).toBe(true);
      expect(tile.planets[0].units).toHaveLength(0);
      expect(tile.units).toHaveLength(2); // Ship + structure
    });
  });
});

// ============================================================================
// CRIMSON REBELLION TESTS
// ============================================================================

describe('Crimson Rebellion - Breach Tokens', () => {
  describe('isSundered', () => {
    it('should return true for Crimson Rebellion', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'crimson_rebellion' });
      const state = createMockGameState({ players: [player] });

      expect(isSundered(state, 'player1')).toBe(true);
    });

    it('should return false for other factions', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState({ players: [player] });

      expect(isSundered(state, 'player1')).toBe(false);
    });
  });

  describe('canUseWormhole', () => {
    it('should allow Crimson Rebellion to use epsilon wormholes', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'crimson_rebellion' });
      const state = createMockGameState({ players: [player] });

      expect(canUseWormhole(state, 'player1', 'epsilon')).toBe(true);
    });

    it('should block Crimson Rebellion from alpha/beta wormholes', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'crimson_rebellion' });
      const state = createMockGameState({ players: [player] });

      expect(canUseWormhole(state, 'player1', 'alpha')).toBe(false);
      expect(canUseWormhole(state, 'player1', 'beta')).toBe(false);
    });

    it('should allow other factions to use any wormhole', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState({ players: [player] });

      expect(canUseWormhole(state, 'player1', 'alpha')).toBe(true);
      expect(canUseWormhole(state, 'player1', 'beta')).toBe(true);
    });
  });

  describe('handlePlaceBreach', () => {
    it('should place breach token in system', () => {
      const tile = createMockTile({ id: 'system-1' });
      const player = createMockPlayer({ id: 'player1', faction: 'crimson_rebellion' });
      const state = createMockGameState({
        players: [player],
        map: { tiles: [tile], playerCount: 6 },
      });

      const result = handlePlaceBreach(state, {
        type: 'place_breach',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(true);
      expect(state.breachTokens).toHaveLength(1);
      expect(state.breachTokens![0].active).toBe(false);
    });

    it('should fail for non-Crimson Rebellion player', () => {
      const tile = createMockTile({ id: 'system-1' });
      const player = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState({
        players: [player],
        map: { tiles: [tile], playerCount: 6 },
      });

      const result = handlePlaceBreach(state, {
        type: 'place_breach',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('areSystemsConnectedByBreach', () => {
    it('should return true when both systems have active breach tokens', () => {
      const state = createMockGameState({
        breachTokens: [
          { systemId: 'system-1', placedBy: 'player1', active: true },
          { systemId: 'system-2', placedBy: 'player1', active: true },
        ],
      });

      expect(areSystemsConnectedByBreach(state, 'system-1', 'system-2')).toBe(true);
    });

    it('should return false when one system has inactive breach token', () => {
      const state = createMockGameState({
        breachTokens: [
          { systemId: 'system-1', placedBy: 'player1', active: true },
          { systemId: 'system-2', placedBy: 'player1', active: false },
        ],
      });

      expect(areSystemsConnectedByBreach(state, 'system-1', 'system-2')).toBe(false);
    });
  });
});

// ============================================================================
// FIRMAMENT/OBSIDIAN TESTS
// ============================================================================

describe('Firmament/Obsidian - Plot Cards', () => {
  describe('isFirmamentOrObsidian', () => {
    it('should return true for Firmament', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'firmament' });
      const state = createMockGameState({ players: [player] });

      expect(isFirmamentOrObsidian(state, 'player1')).toBe(true);
    });

    it('should return true for Obsidian', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'obsidian' });
      const state = createMockGameState({ players: [player] });

      expect(isFirmamentOrObsidian(state, 'player1')).toBe(true);
    });

    it('should return false for other factions', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState({ players: [player] });

      expect(isFirmamentOrObsidian(state, 'player1')).toBe(false);
    });
  });

  describe('handleDrawPlotCard', () => {
    it('should add plot card to Firmament player', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'firmament' });
      const state = createMockGameState({ players: [player] });

      const result = handleDrawPlotCard(state, {
        type: 'draw_plot_card',
        playerId: 'player1',
      });

      expect(result.success).toBe(true);
      expect(state.players[0].plotCards).toHaveLength(1);
    });

    it('should fail for non-Firmament/Obsidian player', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState({ players: [player] });

      const result = handleDrawPlotCard(state, {
        type: 'draw_plot_card',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('handleTransformToObsidian', () => {
    it('should transform Firmament to Obsidian', () => {
      const player = createMockPlayer({
        id: 'player1',
        faction: 'firmament',
        leaders: {
          agent: { unlocked: true, exhausted: false },
          commander: { unlocked: true },
          hero: { unlocked: true, purged: false },
        },
      });
      const state = createMockGameState({ players: [player] });

      const result = handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(result.success).toBe(true);
      expect(state.players[0].faction).toBe('obsidian');
      expect(state.players[0].leaders!.hero.purged).toBe(true);
    });

    it('should fail for already Obsidian player', () => {
      const player = createMockPlayer({
        id: 'player1',
        faction: 'obsidian',
        leaders: {
          agent: { unlocked: true, exhausted: false },
          commander: { unlocked: true },
          hero: { unlocked: true, purged: true },
        },
      });
      const state = createMockGameState({ players: [player] });

      const result = handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('shouldTriggerPlotsWithinPlots', () => {
    it('should return true when objective was already scored by another player', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'firmament' });
      const state = createMockGameState({
        players: [player, createMockPlayer({ id: 'player2' })],
        objectives: {
          publicStageI: [
            { id: 'obj-1', revealed: true, scoredBy: ['player2'] },
          ],
          publicStageII: [],
          revealedCount: 1,
          secretDeck: [],
        },
      });

      expect(shouldTriggerPlotsWithinPlots(state, 'player1', 'obj-1')).toBe(true);
    });

    it('should return false when objective was not previously scored', () => {
      const player = createMockPlayer({ id: 'player1', faction: 'firmament' });
      const state = createMockGameState({
        players: [player],
        objectives: {
          publicStageI: [
            { id: 'obj-1', revealed: true, scoredBy: [] },
          ],
          publicStageII: [],
          revealedCount: 1,
          secretDeck: [],
        },
      });

      expect(shouldTriggerPlotsWithinPlots(state, 'player1', 'obj-1')).toBe(false);
    });
  });
});
