/**
 * Tests for Thunder's Edge Space Station System
 */

import { describe, it, expect } from 'vitest';
import type {
  GameState,
  PlayerState,
  MapTile,
  UnitInstance,
} from '@ti4/shared';
import {
  getStationController,
  updateAllStationControl,
  getControlledStations,
  getStationCommodityBonus,
  getEffectiveMaxCommodities,
  handleExhaustStation,
  readyAllStations,
  canTransactViaStations,
  getTransactionPartners,
  isSpaceStation,
  getSpaceStationIds,
} from '../space-stations.js';

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

function createMockPlanet(overrides: Partial<any> = {}): any {
  return {
    id: 'planet-1',
    name: 'Test Planet',
    resources: 2,
    influence: 1,
    units: [],
    ...overrides,
  };
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
// Space Station Identification Tests
// ============================================================================

describe('Space Station Identification', () => {
  describe('isSpaceStation', () => {
    it('should return true for station IDs', () => {
      expect(isSpaceStation('tsion_station')).toBe(true);
      expect(isSpaceStation('oluz_station')).toBe(true);
      expect(isSpaceStation('the_watchtower')).toBe(true);
    });

    it('should return false for non-station IDs', () => {
      expect(isSpaceStation('mecatol_rex')).toBe(false);
      expect(isSpaceStation('jord')).toBe(false);
      expect(isSpaceStation('random_planet')).toBe(false);
    });
  });

  describe('getSpaceStationIds', () => {
    it('should return all station IDs', () => {
      const ids = getSpaceStationIds();
      expect(ids).toContain('tsion_station');
      expect(ids).toContain('oluz_station');
      expect(ids).toContain('the_watchtower');
      expect(ids).toHaveLength(3);
    });
  });
});

// ============================================================================
// Station Control Tests
// ============================================================================

describe('Station Control', () => {
  describe('getStationController', () => {
    it('should return player ID when only their ships are in system', () => {
      const unit = createMockUnit({ ownerId: 'player1', type: 'cruiser' });
      const tile = createMockTile({
        id: 'system-1',
        units: [unit],
        planets: [createMockPlanet({ id: 'tsion_station' })],
      });
      const state = createMockGameState({ map: { tiles: [tile], playerCount: 6 } });

      expect(getStationController(state, 'tsion_station')).toBe('player1');
    });

    it('should return null when no ships are in system and no prior controller', () => {
      const tile = createMockTile({
        id: 'system-1',
        units: [],
        planets: [createMockPlanet({ id: 'tsion_station' })],
      });
      const state = createMockGameState({ map: { tiles: [tile], playerCount: 6 } });

      expect(getStationController(state, 'tsion_station')).toBeNull();
    });

    it('should retain previous controller when no ships present', () => {
      const tile = createMockTile({
        id: 'system-1',
        units: [],
        planets: [createMockPlanet({ id: 'tsion_station' })],
      });
      const state = createMockGameState({
        map: { tiles: [tile], playerCount: 6 },
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 'system-1', controllerId: 'player2', exhausted: false },
        ],
      });

      expect(getStationController(state, 'tsion_station')).toBe('player2');
    });

    it('should retain previous controller when multiple players have ships (contested)', () => {
      const unit1 = createMockUnit({ ownerId: 'player1', type: 'cruiser' });
      const unit2 = createMockUnit({ ownerId: 'player2', type: 'destroyer' });
      const tile = createMockTile({
        id: 'system-1',
        units: [unit1, unit2],
        planets: [createMockPlanet({ id: 'tsion_station' })],
      });
      const state = createMockGameState({
        map: { tiles: [tile], playerCount: 6 },
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 'system-1', controllerId: 'player1', exhausted: false },
        ],
      });

      expect(getStationController(state, 'tsion_station')).toBe('player1');
    });

    it('should return null for non-existent station', () => {
      const state = createMockGameState();

      expect(getStationController(state, 'nonexistent')).toBeNull();
    });
  });

  describe('updateAllStationControl', () => {
    it('should create station state if not present', () => {
      const unit = createMockUnit({ ownerId: 'player1', type: 'cruiser' });
      const tile = createMockTile({
        id: 'system-1',
        units: [unit],
        planets: [createMockPlanet({ id: 'tsion_station' })],
      });
      const state = createMockGameState({ map: { tiles: [tile], playerCount: 6 } });

      updateAllStationControl(state);

      expect(state.spaceStationState).toBeDefined();
      expect(state.spaceStationState!.find(s => s.stationId === 'tsion_station')?.controllerId).toBe('player1');
    });

    it('should update controller when control changes', () => {
      const unit = createMockUnit({ ownerId: 'player2', type: 'cruiser' });
      const tile = createMockTile({
        id: 'system-1',
        units: [unit],
        planets: [createMockPlanet({ id: 'tsion_station' })],
      });
      const state = createMockGameState({
        map: { tiles: [tile], playerCount: 6 },
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 'system-1', controllerId: 'player1', exhausted: true },
        ],
      });

      updateAllStationControl(state);

      const stationState = state.spaceStationState!.find(s => s.stationId === 'tsion_station');
      expect(stationState?.controllerId).toBe('player2');
      expect(stationState?.exhausted).toBe(false); // Ready when control changes
    });
  });

  describe('getControlledStations', () => {
    it('should return stations controlled by player', () => {
      const state = createMockGameState({
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: false },
          { stationId: 'oluz_station', systemId: 's2', controllerId: 'player1', exhausted: false },
          { stationId: 'the_watchtower', systemId: 's3', controllerId: 'player2', exhausted: false },
        ],
      });

      const stations = getControlledStations(state, 'player1');
      expect(stations).toHaveLength(2);
      expect(stations.map(s => s.stationId)).toContain('tsion_station');
      expect(stations.map(s => s.stationId)).toContain('oluz_station');
    });

    it('should return empty array when player controls no stations', () => {
      const state = createMockGameState({
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player2', exhausted: false },
        ],
      });

      expect(getControlledStations(state, 'player1')).toHaveLength(0);
    });

    it('should return empty array when no station state exists', () => {
      const state = createMockGameState();

      expect(getControlledStations(state, 'player1')).toHaveLength(0);
    });
  });
});

// ============================================================================
// Commodity Bonus Tests
// ============================================================================

describe('Commodity Bonus', () => {
  describe('getStationCommodityBonus', () => {
    it('should return 0 when player controls no stations', () => {
      const state = createMockGameState();

      expect(getStationCommodityBonus(state, 'player1')).toBe(0);
    });

    it('should return 1 per controlled station', () => {
      const state = createMockGameState({
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: false },
          { stationId: 'oluz_station', systemId: 's2', controllerId: 'player1', exhausted: false },
        ],
      });

      expect(getStationCommodityBonus(state, 'player1')).toBe(2);
    });
  });

  describe('getEffectiveMaxCommodities', () => {
    it('should add station bonus to base max commodities', () => {
      const player = createMockPlayer({ id: 'player1', maxCommodities: 4 });
      const state = createMockGameState({
        players: [player],
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: false },
        ],
      });

      expect(getEffectiveMaxCommodities(state, player)).toBe(5);
    });

    it('should return base max when no stations controlled', () => {
      const player = createMockPlayer({ id: 'player1', maxCommodities: 3 });
      const state = createMockGameState({ players: [player] });

      expect(getEffectiveMaxCommodities(state, player)).toBe(3);
    });
  });
});

// ============================================================================
// Station Ability Tests
// ============================================================================

describe('Station Abilities', () => {
  describe('handleExhaustStation', () => {
    it('should convert all commodities to trade goods', () => {
      const player = createMockPlayer({ id: 'player1', commodities: 3, tradeGoods: 2 });
      const state = createMockGameState({
        players: [player],
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: false },
        ],
      });

      const result = handleExhaustStation(state, 'player1', 'tsion_station');

      expect(result.success).toBe(true);
      expect(state.players[0].commodities).toBe(0);
      expect(state.players[0].tradeGoods).toBe(5);
      expect(state.spaceStationState![0].exhausted).toBe(true);
    });

    it('should fail if station is already exhausted', () => {
      const player = createMockPlayer({ id: 'player1', commodities: 3 });
      const state = createMockGameState({
        players: [player],
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: true },
        ],
      });

      const result = handleExhaustStation(state, 'player1', 'tsion_station');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Station is already exhausted');
    });

    it('should fail if player does not control station', () => {
      const player = createMockPlayer({ id: 'player1', commodities: 3 });
      const state = createMockGameState({
        players: [player],
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player2', exhausted: false },
        ],
      });

      const result = handleExhaustStation(state, 'player1', 'tsion_station');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player does not control this station');
    });

    it('should fail if player has no commodities', () => {
      const player = createMockPlayer({ id: 'player1', commodities: 0 });
      const state = createMockGameState({
        players: [player],
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: false },
        ],
      });

      const result = handleExhaustStation(state, 'player1', 'tsion_station');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No commodities to convert');
    });

    it('should fail if no station state exists', () => {
      const state = createMockGameState();

      const result = handleExhaustStation(state, 'player1', 'tsion_station');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No stations in game');
    });
  });

  describe('readyAllStations', () => {
    it('should ready all exhausted stations', () => {
      const state = createMockGameState({
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: true },
          { stationId: 'oluz_station', systemId: 's2', controllerId: 'player2', exhausted: true },
          { stationId: 'the_watchtower', systemId: 's3', controllerId: 'player1', exhausted: false },
        ],
      });

      readyAllStations(state);

      expect(state.spaceStationState!.every(s => !s.exhausted)).toBe(true);
    });

    it('should handle no station state gracefully', () => {
      const state = createMockGameState();

      expect(() => readyAllStations(state)).not.toThrow();
    });
  });
});

// ============================================================================
// Transaction Rules Tests
// ============================================================================

describe('Transaction Rules', () => {
  describe('canTransactViaStations', () => {
    it('should return true when both players control stations', () => {
      const state = createMockGameState({
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: false },
          { stationId: 'oluz_station', systemId: 's2', controllerId: 'player2', exhausted: false },
        ],
      });

      expect(canTransactViaStations(state, 'player1', 'player2')).toBe(true);
    });

    it('should return false when only one player controls a station', () => {
      const state = createMockGameState({
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: false },
        ],
      });

      expect(canTransactViaStations(state, 'player1', 'player2')).toBe(false);
    });

    it('should return false when neither player controls a station', () => {
      const state = createMockGameState();

      expect(canTransactViaStations(state, 'player1', 'player2')).toBe(false);
    });
  });

  describe('getTransactionPartners', () => {
    it('should include neighbors', () => {
      const player1 = createMockPlayer({ id: 'player1', neighbors: ['player2'] });
      const player2 = createMockPlayer({ id: 'player2', neighbors: ['player1'] });
      const state = createMockGameState({ players: [player1, player2] });

      const partners = getTransactionPartners(state, 'player1');
      expect(partners).toContain('player2');
    });

    it('should include station partners who are not neighbors', () => {
      const player1 = createMockPlayer({ id: 'player1', neighbors: [] });
      const player2 = createMockPlayer({ id: 'player2', neighbors: [] });
      const player3 = createMockPlayer({ id: 'player3', neighbors: [] });
      const state = createMockGameState({
        players: [player1, player2, player3],
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: false },
          { stationId: 'oluz_station', systemId: 's2', controllerId: 'player2', exhausted: false },
        ],
      });

      const partners = getTransactionPartners(state, 'player1');
      expect(partners).toContain('player2');
      expect(partners).not.toContain('player3');
    });

    it('should combine neighbors and station partners', () => {
      const player1 = createMockPlayer({ id: 'player1', neighbors: ['player2'] });
      const player2 = createMockPlayer({ id: 'player2', neighbors: ['player1'] });
      const player3 = createMockPlayer({ id: 'player3', neighbors: [] });
      const state = createMockGameState({
        players: [player1, player2, player3],
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player1', exhausted: false },
          { stationId: 'oluz_station', systemId: 's2', controllerId: 'player3', exhausted: false },
        ],
      });

      const partners = getTransactionPartners(state, 'player1');
      expect(partners).toContain('player2'); // neighbor
      expect(partners).toContain('player3'); // station partner
    });

    it('should return empty array for non-existent player', () => {
      const state = createMockGameState();

      expect(getTransactionPartners(state, 'nonexistent')).toHaveLength(0);
    });

    it('should not include player without station when they have no station', () => {
      const player1 = createMockPlayer({ id: 'player1', neighbors: [] });
      const player2 = createMockPlayer({ id: 'player2', neighbors: [] });
      const state = createMockGameState({
        players: [player1, player2],
        spaceStationState: [
          { stationId: 'tsion_station', systemId: 's1', controllerId: 'player2', exhausted: false },
        ],
      });

      // Player1 has no station, so cannot transact via stations
      const partners = getTransactionPartners(state, 'player1');
      expect(partners).not.toContain('player2');
    });
  });
});
