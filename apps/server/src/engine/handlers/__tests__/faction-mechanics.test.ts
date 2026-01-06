/**
 * Tests for Thunder's Edge Faction-Specific Mechanics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  GameState,
  PlayerState,
  MapTile,
  PlanetInstance,
  UnitInstance,
  PlanetState,
} from '@ti4/shared';
import {
  handleGalvanize,
  handleRemoveGalvanize,
  isUnitGalvanized,
  getGalvanizeCombatBonus,
  handlePhoenixStandard,
  handleA3ValianceDeath,
  handleStartCoexistence,
  handleEndCoexistence,
  hasCoexistence,
  getCoexistingPlayers,
  handlePlaceBreachToken,
  handleActivateBreachToken,
  handleRemoveBreachToken,
  removeAllBreachTokens,
  areSystemsBreachAdjacent,
  canCrimsonUseWormhole,
  handleCreatePlotCard,
  handleRevealPlotCard,
  getPuppetedPlayers,
  isPlayerPuppeted,
  handleTransformToObsidian,
  isTransportableStructure,
} from '../faction-mechanics.js';

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
    id: 'planet1',
    name: 'Test Planet',
    resources: 2,
    influence: 2,
    units: [],
    attachments: [],
    ...overrides,
  } as PlanetInstance;
}

function createMockTile(overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: 'tile-1',
    systemId: 1,
    position: { q: 0, r: 0 },
    rotation: 0,
    planets: [createMockPlanet()],
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
    planets: [
      { planetId: 'planet1', exhausted: false, attachments: [] } as PlanetState,
    ],
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
      createMockPlayer({ id: 'player1', faction: 'last_bastion' }),
      createMockPlayer({ id: 'player2', faction: 'hacan' }),
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
// Galvanize Tests (Last Bastion)
// ============================================================================

describe('Galvanize Mechanics (Last Bastion)', () => {
  describe('handleGalvanize', () => {
    it('should galvanize a unit for Last Bastion player', () => {
      const unit = createMockUnit({ id: 'unit-1', ownerId: 'player1' });
      const tile = createMockTile({ units: [unit] });
      const state = createMockGameState({ map: { tiles: [tile], playerCount: 6 } });

      const result = handleGalvanize(state, {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      });

      expect(result.success).toBe(true);
      expect(state.players[0].galvanizeTokens).toContain('unit-1');
    });

    it('should fail if player is not Last Bastion', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

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
      const tile = createMockTile({ units: [unit] });
      const state = createMockGameState({ map: { tiles: [tile], playerCount: 6 } });
      state.players[0].galvanizeTokens = ['unit-1'];

      const result = handleGalvanize(state, {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit is already galvanized');
    });

    it('should fail if unit does not belong to player', () => {
      const unit = createMockUnit({ id: 'unit-1', ownerId: 'player2' });
      const tile = createMockTile({ units: [unit] });
      const state = createMockGameState({ map: { tiles: [tile], playerCount: 6 } });

      const result = handleGalvanize(state, {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit does not belong to player');
    });
  });

  describe('handleRemoveGalvanize', () => {
    it('should remove galvanize token from unit', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1', 'unit-2'];

      const result = handleRemoveGalvanize(state, {
        type: 'remove_galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      });

      expect(result.success).toBe(true);
      expect(state.players[0].galvanizeTokens).not.toContain('unit-1');
      expect(state.players[0].galvanizeTokens).toContain('unit-2');
    });

    it('should fail if unit is not galvanized', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = [];

      const result = handleRemoveGalvanize(state, {
        type: 'remove_galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit is not galvanized');
    });
  });

  describe('isUnitGalvanized', () => {
    it('should return true for galvanized unit', () => {
      const player = createMockPlayer({ galvanizeTokens: ['unit-1'] });
      expect(isUnitGalvanized(player, 'unit-1')).toBe(true);
    });

    it('should return false for non-galvanized unit', () => {
      const player = createMockPlayer({ galvanizeTokens: [] });
      expect(isUnitGalvanized(player, 'unit-1')).toBe(false);
    });
  });

  describe('getGalvanizeCombatBonus', () => {
    it('should return 1 for galvanized unit belonging to Last Bastion', () => {
      const player = createMockPlayer({
        faction: 'last_bastion',
        galvanizeTokens: ['unit-1'],
      });
      expect(getGalvanizeCombatBonus(player, 'unit-1')).toBe(1);
    });

    it('should return 0 for non-galvanized unit', () => {
      const player = createMockPlayer({
        faction: 'last_bastion',
        galvanizeTokens: [],
      });
      expect(getGalvanizeCombatBonus(player, 'unit-1')).toBe(0);
    });

    it('should return 0 for non-Last Bastion player', () => {
      const player = createMockPlayer({
        faction: 'sol',
        galvanizeTokens: ['unit-1'],
      });
      expect(getGalvanizeCombatBonus(player, 'unit-1')).toBe(0);
    });
  });

  describe('handleA3ValianceDeath', () => {
    it('should galvanize up to 3 infantry when galvanized mech dies', () => {
      const infantry1 = createMockUnit({ id: 'inf-1', type: 'infantry', ownerId: 'player1' });
      const infantry2 = createMockUnit({ id: 'inf-2', type: 'infantry', ownerId: 'player1' });
      const infantry3 = createMockUnit({ id: 'inf-3', type: 'infantry', ownerId: 'player1' });
      const infantry4 = createMockUnit({ id: 'inf-4', type: 'infantry', ownerId: 'player1' });
      const planet = createMockPlanet({ units: [infantry1, infantry2, infantry3, infantry4] });
      const tile = createMockTile({ id: 'system-1', planets: [planet] });
      const state = createMockGameState({ map: { tiles: [tile], playerCount: 6 } });
      state.players[0].galvanizeTokens = ['mech-1'];

      const result = handleA3ValianceDeath(state, 'player1', 'system-1', 'mech-1');

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(3);
      expect(state.players[0].galvanizeTokens).toContain('inf-1');
      expect(state.players[0].galvanizeTokens).toContain('inf-2');
      expect(state.players[0].galvanizeTokens).toContain('inf-3');
      expect(state.players[0].galvanizeTokens).not.toContain('inf-4');
    });

    it('should fail if mech was not galvanized', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = [];

      const result = handleA3ValianceDeath(state, 'player1', 'system-1', 'mech-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mech was not galvanized');
    });
  });
});

// ============================================================================
// Coexistence Tests (Deepwrought Scholarate)
// ============================================================================

describe('Coexistence Mechanics (Deepwrought)', () => {
  describe('handleStartCoexistence', () => {
    it('should start coexistence for Deepwrought player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'deepwrought';

      const result = handleStartCoexistence(state, {
        type: 'start_coexistence',
        playerId: 'player1',
        planetId: 'planet1',
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(state.coexistenceState).toHaveLength(1);
      expect(state.coexistenceState![0].planetId).toBe('planet1');
      expect(state.coexistenceState![0].coexistingPlayers).toContain('player1');
      expect(state.coexistenceState![0].coexistingPlayers).toContain('player2');
    });

    it('should fail for non-Deepwrought player without breakthrough', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const result = handleStartCoexistence(state, {
        type: 'start_coexistence',
        playerId: 'player1',
        planetId: 'planet1',
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player cannot initiate coexistence');
    });

    it('should allow coexistence for player with Slumberstate Computing breakthrough', () => {
      const state = createMockGameState();
      state.players[0].faction = 'titans';
      state.players[0].breakthrough = {
        breakthroughId: 'slumberstate_computing',
        unlocked: true,
        exhausted: false,
      };

      const result = handleStartCoexistence(state, {
        type: 'start_coexistence',
        playerId: 'player1',
        planetId: 'planet1',
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('handleEndCoexistence', () => {
    it('should end coexistence on a planet', () => {
      const state = createMockGameState();
      state.coexistenceState = [
        { planetId: 'planet1', coexistingPlayers: ['player1', 'player2'] },
      ];

      const result = handleEndCoexistence(state, {
        type: 'end_coexistence',
        playerId: 'player1',
        planetId: 'planet1',
      });

      expect(result.success).toBe(true);
      expect(state.coexistenceState).toHaveLength(0);
    });

    it('should fail if no coexistence exists', () => {
      const state = createMockGameState();
      state.coexistenceState = [];

      const result = handleEndCoexistence(state, {
        type: 'end_coexistence',
        playerId: 'player1',
        planetId: 'planet1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No coexistence on this planet');
    });
  });

  describe('hasCoexistence', () => {
    it('should return true for planet with coexistence', () => {
      const state = createMockGameState();
      state.coexistenceState = [
        { planetId: 'planet1', coexistingPlayers: ['player1', 'player2'] },
      ];

      expect(hasCoexistence(state, 'planet1')).toBe(true);
    });

    it('should return false for planet without coexistence', () => {
      const state = createMockGameState();
      state.coexistenceState = [];

      expect(hasCoexistence(state, 'planet1')).toBe(false);
    });
  });

  describe('getCoexistingPlayers', () => {
    it('should return list of coexisting players', () => {
      const state = createMockGameState();
      state.coexistenceState = [
        { planetId: 'planet1', coexistingPlayers: ['player1', 'player2'] },
      ];

      const players = getCoexistingPlayers(state, 'planet1');
      expect(players).toEqual(['player1', 'player2']);
    });
  });
});

// ============================================================================
// Breach Token Tests (Crimson Rebellion)
// ============================================================================

describe('Breach Token Mechanics (Crimson Rebellion)', () => {
  describe('handlePlaceBreachToken', () => {
    it('should place breach token for Crimson Rebellion player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'crimson_rebellion';

      const result = handlePlaceBreachToken(state, {
        type: 'place_breach',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(true);
      expect(state.breachTokens).toHaveLength(1);
      expect(state.breachTokens![0].systemId).toBe('system-1');
      expect(state.breachTokens![0].active).toBe(false);
    });

    it('should fail for non-Crimson Rebellion player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const result = handlePlaceBreachToken(state, {
        type: 'place_breach',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only Crimson Rebellion can place breach tokens');
    });

    it('should fail if system already has breach token', () => {
      const state = createMockGameState();
      state.players[0].faction = 'crimson_rebellion';
      state.breachTokens = [
        { systemId: 'system-1', placedBy: 'player1', active: false },
      ];

      const result = handlePlaceBreachToken(state, {
        type: 'place_breach',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('System already has a breach token');
    });
  });

  describe('handleActivateBreachToken', () => {
    it('should activate an inactive breach token', () => {
      const state = createMockGameState();
      state.breachTokens = [
        { systemId: 'system-1', placedBy: 'player1', active: false },
      ];

      const result = handleActivateBreachToken(state, {
        type: 'activate_breach',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(true);
      expect(state.breachTokens![0].active).toBe(true);
    });

    it('should fail if breach token is already active', () => {
      const state = createMockGameState();
      state.breachTokens = [
        { systemId: 'system-1', placedBy: 'player1', active: true },
      ];

      const result = handleActivateBreachToken(state, {
        type: 'activate_breach',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Breach token is already active');
    });
  });

  describe('handleRemoveBreachToken', () => {
    it('should remove breach token from system', () => {
      const state = createMockGameState();
      state.breachTokens = [
        { systemId: 'system-1', placedBy: 'player1', active: true },
        { systemId: 'system-2', placedBy: 'player1', active: false },
      ];

      const result = handleRemoveBreachToken(state, {
        type: 'remove_breach',
        playerId: 'player1',
        systemId: 'system-1',
      });

      expect(result.success).toBe(true);
      expect(state.breachTokens).toHaveLength(1);
      expect(state.breachTokens![0].systemId).toBe('system-2');
    });
  });

  describe('removeAllBreachTokens', () => {
    it('should remove all breach tokens', () => {
      const state = createMockGameState();
      state.breachTokens = [
        { systemId: 'system-1', placedBy: 'player1', active: true },
        { systemId: 'system-2', placedBy: 'player1', active: false },
      ];

      const result = removeAllBreachTokens(state);

      expect(result.success).toBe(true);
      expect(state.breachTokens).toHaveLength(0);
      expect(result.data?.removedCount).toBe(2);
    });
  });

  describe('areSystemsBreachAdjacent', () => {
    it('should return true when both systems have active breach tokens', () => {
      const state = createMockGameState();
      state.breachTokens = [
        { systemId: 'system-1', placedBy: 'player1', active: true },
        { systemId: 'system-2', placedBy: 'player1', active: true },
      ];

      expect(areSystemsBreachAdjacent(state, 'system-1', 'system-2')).toBe(true);
    });

    it('should return false when only one system has active breach token', () => {
      const state = createMockGameState();
      state.breachTokens = [
        { systemId: 'system-1', placedBy: 'player1', active: true },
        { systemId: 'system-2', placedBy: 'player1', active: false },
      ];

      expect(areSystemsBreachAdjacent(state, 'system-1', 'system-2')).toBe(false);
    });

    it('should return false when neither system has breach token', () => {
      const state = createMockGameState();
      state.breachTokens = [];

      expect(areSystemsBreachAdjacent(state, 'system-1', 'system-2')).toBe(false);
    });
  });

  describe('canCrimsonUseWormhole', () => {
    it('should allow epsilon wormhole for Crimson Rebellion', () => {
      const player = createMockPlayer({ faction: 'crimson_rebellion' });
      expect(canCrimsonUseWormhole('epsilon', player)).toBe(true);
    });

    it('should block alpha wormhole for Crimson Rebellion', () => {
      const player = createMockPlayer({ faction: 'crimson_rebellion' });
      expect(canCrimsonUseWormhole('alpha', player)).toBe(false);
    });

    it('should allow any wormhole for non-Crimson factions', () => {
      const player = createMockPlayer({ faction: 'sol' });
      expect(canCrimsonUseWormhole('alpha', player)).toBe(true);
      expect(canCrimsonUseWormhole('beta', player)).toBe(true);
      expect(canCrimsonUseWormhole('epsilon', player)).toBe(true);
    });
  });
});

// ============================================================================
// Plot Card Tests (Firmament / Obsidian)
// ============================================================================

describe('Plot Card Mechanics (Firmament / Obsidian)', () => {
  describe('handleCreatePlotCard', () => {
    it('should create plot card for Firmament player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'firmament';

      const result = handleCreatePlotCard(state, {
        type: 'create_plot',
        playerId: 'player1',
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(state.players[0].plotCards).toHaveLength(1);
      expect(result.data?.targetPlayerId).toBe('player2');
    });

    it('should fail for non-Firmament/Obsidian player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const result = handleCreatePlotCard(state, {
        type: 'create_plot',
        playerId: 'player1',
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only Firmament/Obsidian can create plot cards');
    });
  });

  describe('handleRevealPlotCard', () => {
    it('should move plot card from hand to play area', () => {
      const state = createMockGameState();
      state.players[0].faction = 'firmament';
      state.players[0].plotCards = ['plot_player2_123'];

      const result = handleRevealPlotCard(state, {
        type: 'reveal_plot',
        playerId: 'player1',
        plotCardId: 'plot_player2_123',
      });

      expect(result.success).toBe(true);
      expect(state.players[0].plotCards).toHaveLength(0);
      expect(state.players[0].plotCardsInPlay).toContain('plot_player2_123');
    });

    it('should fail if player does not have the plot card', () => {
      const state = createMockGameState();
      state.players[0].faction = 'firmament';
      state.players[0].plotCards = [];

      const result = handleRevealPlotCard(state, {
        type: 'reveal_plot',
        playerId: 'player1',
        plotCardId: 'plot_player2_123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player does not have that plot card');
    });
  });

  describe('getPuppetedPlayers', () => {
    it('should return players with control tokens on plot cards', () => {
      const player = createMockPlayer({
        faction: 'obsidian',
        plotCardsInPlay: ['plot_player2_123', 'plot_player3_456'],
      });

      const puppeted = getPuppetedPlayers(player);
      expect(puppeted).toContain('player2');
      expect(puppeted).toContain('player3');
    });

    it('should return empty for non-Obsidian player', () => {
      const player = createMockPlayer({
        faction: 'firmament',
        plotCardsInPlay: ['plot_player2_123'],
      });

      const puppeted = getPuppetedPlayers(player);
      expect(puppeted).toHaveLength(0);
    });
  });

  describe('isPlayerPuppeted', () => {
    it('should return true for puppeted player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'obsidian';
      state.players[0].plotCardsInPlay = ['plot_player2_123'];

      expect(isPlayerPuppeted(state, 'player2')).toBe(true);
    });

    it('should return false for non-puppeted player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'obsidian';
      state.players[0].plotCardsInPlay = ['plot_player3_123'];

      expect(isPlayerPuppeted(state, 'player2')).toBe(false);
    });

    it('should return false when no Obsidian player exists', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      expect(isPlayerPuppeted(state, 'player2')).toBe(false);
    });
  });
});

// ============================================================================
// Faction Transformation Tests (Firmament -> Obsidian)
// ============================================================================

describe('Faction Transformation (Firmament -> Obsidian)', () => {
  describe('handleTransformToObsidian', () => {
    it('should transform Firmament to Obsidian', () => {
      const state = createMockGameState();
      state.players[0].faction = 'firmament';
      state.players[0].plotCardsInPlay = ['plot_player2_123'];
      state.players[0].planets = [
        { planetId: 'cronos', exhausted: true, attachments: [] } as PlanetState,
      ];
      state.players[0].breakthrough = {
        breakthroughId: 'the_sowing',
        unlocked: true,
        exhausted: false,
        tradeGoodsOnCard: 3,
      };

      const result = handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(result.success).toBe(true);
      expect(state.players[0].faction).toBe('obsidian');
      expect(state.players[0].breakthrough?.breakthroughId).toBe('the_reaping');
      expect(state.players[0].breakthrough?.tradeGoodsOnCard).toBe(3);
      expect(state.players[0].planets[0].exhausted).toBe(false);
    });

    it('should fail if not Firmament', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const result = handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only Firmament can transform to Obsidian');
    });

    it('should fail without plot cards in play', () => {
      const state = createMockGameState();
      state.players[0].faction = 'firmament';
      state.players[0].plotCardsInPlay = [];

      const result = handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must have at least 1 plot card in play to transform');
    });
  });
});

// ============================================================================
// Structure Transport Tests (Ral Nel Consortium)
// ============================================================================

describe('Structure Transport (Ral Nel)', () => {
  describe('isTransportableStructure', () => {
    it('should return true for PDS owned by Ral Nel', () => {
      const player = createMockPlayer({ faction: 'ral_nel' });
      expect(isTransportableStructure('pds', player)).toBe(true);
    });

    it('should return true for Space Dock owned by Ral Nel', () => {
      const player = createMockPlayer({ faction: 'ral_nel' });
      expect(isTransportableStructure('space_dock', player)).toBe(true);
    });

    it('should return false for ships', () => {
      const player = createMockPlayer({ faction: 'ral_nel' });
      expect(isTransportableStructure('cruiser', player)).toBe(false);
    });

    it('should return false for non-Ral Nel player', () => {
      const player = createMockPlayer({ faction: 'sol' });
      expect(isTransportableStructure('pds', player)).toBe(false);
    });
  });
});
