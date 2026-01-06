/**
 * Ral Nel Consortium Faction Handler Tests
 *
 * Tests for the Thunder's Edge expansion Ral Nel Consortium faction:
 * - MINIATURIZATION: Structures can be transported by ships
 * - SURVIVAL INSTINCT: Relocate ships when system is activated
 * - Last Dispatch flagship ability
 * - Alarum mech ground reinforcement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, MapTile, PlayerState, UnitInstance, PlanetInstance } from '@ti4/shared';
import {
  isStructure,
  canTransportStructures,
  getStructuresInSpace,
  handlePickupStructure,
  handlePlaceStructure,
  moveStructuresWithShips,
  canUseSurvivalInstinct,
  getValidSurvivalInstinctShips,
  handleSurvivalInstinct,
  handleLastDispatchRetreat,
  handleAlarumReinforce,
  hasStructuresInSpace,
} from '../ral-nel';

// ============================================================================
// Mock Factories
// ============================================================================

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    faction: 'arborec',
    color: 'blue',
    name: `Player ${id}`,
    tradeGoods: 0,
    commodities: 0,
    commoditiesLimit: 3,
    strategyCards: [],
    technologies: [],
    planets: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotes: [],
    relics: [],
    leaders: {
      agent: { id: 'test-agent', unlocked: false, exhausted: false },
      commander: { id: 'test-commander', unlocked: false },
      hero: { id: 'test-hero', unlocked: false, purged: false },
    },
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    victoryPoints: 0,
    isEliminated: false,
    hasPassedThisRound: false,
    activeInRound: true,
    ...overrides,
  } as PlayerState;
}

function createMockPlanet(id: string, overrides: Partial<PlanetInstance> = {}): PlanetInstance {
  return {
    id,
    name: `Planet ${id}`,
    resources: 2,
    influence: 1,
    units: [],
    controlledBy: undefined,
    ...overrides,
  } as PlanetInstance;
}

function createMockMapTile(id: string, position: { q: number; r: number }, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id,
    systemId: id,
    position,
    units: [],
    planets: [],
    commandTokens: [],
    ...overrides,
  } as MapTile;
}

function createMockGameState(playerCount: number): GameState {
  const players = Array.from({ length: playerCount }, (_, i) =>
    createMockPlayer(`player${i + 1}`)
  );

  return {
    id: 'test-game',
    players,
    currentPlayerIndex: 0,
    phase: 'action',
    round: 1,
    map: {
      tiles: [
        createMockMapTile('system1', { q: 0, r: 0 }),
        createMockMapTile('system2', { q: 1, r: 0 }),
        createMockMapTile('system3', { q: 0, r: 1 }),
      ],
    },
    publicObjectives: { stageI: [], stageII: [] },
    secretObjectives: [],
    laws: [],
    turnOrder: players.map((p) => p.id),
    actionCards: { deck: [], discard: [] },
    explorationDecks: {
      cultural: { deck: [], discard: [] },
      industrial: { deck: [], discard: [] },
      hazardous: { deck: [], discard: [] },
      frontier: { deck: [], discard: [] },
    },
    relicDeck: { deck: [], discard: [] },
    victoryPointLimit: 10,
    settings: {
      expansions: ['thunders_edge'],
      victoryPoints: 10,
    },
    timestamp: Date.now(),
  } as unknown as GameState;
}

function createRalNelPlayer(state: GameState): PlayerState {
  const player = state.players[0];
  player.faction = 'ral_nel';
  return player;
}

// ============================================================================
// MINIATURIZATION - Structure Transport
// ============================================================================

describe('Ral Nel Consortium - Miniaturization', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
  });

  describe('isStructure', () => {
    it('should return true for PDS', () => {
      expect(isStructure('pds')).toBe(true);
    });

    it('should return true for space dock', () => {
      expect(isStructure('space_dock')).toBe(true);
    });

    it('should return false for ships', () => {
      expect(isStructure('cruiser')).toBe(false);
      expect(isStructure('carrier')).toBe(false);
      expect(isStructure('dreadnought')).toBe(false);
    });

    it('should return false for ground forces', () => {
      expect(isStructure('infantry')).toBe(false);
      expect(isStructure('mech')).toBe(false);
    });
  });

  describe('canTransportStructures', () => {
    it('should return true for Ral Nel player', () => {
      createRalNelPlayer(state);
      expect(canTransportStructures(state, 'player1')).toBe(true);
    });

    it('should return false for non-Ral Nel player', () => {
      expect(canTransportStructures(state, 'player1')).toBe(false);
    });

    it('should return false for non-existent player', () => {
      expect(canTransportStructures(state, 'nonexistent')).toBe(false);
    });
  });

  describe('getStructuresInSpace', () => {
    it('should return structures in space area', () => {
      createRalNelPlayer(state);
      state.map.tiles[0].units = [
        { id: 'pds1', type: 'pds', ownerId: 'player1' } as UnitInstance,
        { id: 'cruiser1', type: 'cruiser', ownerId: 'player1' } as UnitInstance,
      ];

      const structures = getStructuresInSpace(state, 'player1', 'system1');
      expect(structures).toHaveLength(1);
      expect(structures[0].type).toBe('pds');
    });

    it('should not return structures belonging to other players', () => {
      createRalNelPlayer(state);
      state.map.tiles[0].units = [
        { id: 'pds1', type: 'pds', ownerId: 'player2' } as UnitInstance,
      ];

      const structures = getStructuresInSpace(state, 'player1', 'system1');
      expect(structures).toHaveLength(0);
    });

    it('should return empty array for non-existent system', () => {
      createRalNelPlayer(state);
      const structures = getStructuresInSpace(state, 'player1', 'nonexistent');
      expect(structures).toHaveLength(0);
    });
  });
});

// ============================================================================
// Structure Pickup and Placement
// ============================================================================

describe('Ral Nel Consortium - Structure Pickup', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createRalNelPlayer(state);

    // Set up planet with PDS
    state.map.tiles[0].planets = [
      createMockPlanet('planet1', {
        controlledBy: 'player1',
        units: [
          { id: 'pds1', type: 'pds', ownerId: 'player1', planetId: 'planet1' } as UnitInstance,
        ],
      }),
    ];

    // Add ship in same system
    state.map.tiles[0].units = [
      { id: 'carrier1', type: 'carrier', ownerId: 'player1' } as UnitInstance,
    ];
  });

  describe('handlePickupStructure', () => {
    it('should pick up structure from planet to space', () => {
      const result = handlePickupStructure(state, {
        type: 'transport_structure',
        playerId: 'player1',
        structureId: 'pds1',
        shipId: 'carrier1',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('structure_picked_up');
      expect(state.map.tiles[0].planets[0].units).toHaveLength(0);
      expect(state.map.tiles[0].units.find(u => u.id === 'pds1')).toBeDefined();
    });

    it('should fail for non-Ral Nel player', () => {
      state.players[0].faction = 'arborec';

      const result = handlePickupStructure(state, {
        type: 'transport_structure',
        playerId: 'player1',
        structureId: 'pds1',
        shipId: 'carrier1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only Ral Nel');
    });

    it('should fail for non-existent player', () => {
      const result = handlePickupStructure(state, {
        type: 'transport_structure',
        playerId: 'nonexistent',
        structureId: 'pds1',
        shipId: 'carrier1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail for non-existent structure', () => {
      const result = handlePickupStructure(state, {
        type: 'transport_structure',
        playerId: 'player1',
        structureId: 'nonexistent',
        shipId: 'carrier1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Structure not found');
    });

    it('should fail for structure owned by another player', () => {
      state.map.tiles[0].planets[0].units[0].ownerId = 'player2';

      const result = handlePickupStructure(state, {
        type: 'transport_structure',
        playerId: 'player1',
        structureId: 'pds1',
        shipId: 'carrier1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not belong to player');
    });

    it('should fail for non-existent ship', () => {
      const result = handlePickupStructure(state, {
        type: 'transport_structure',
        playerId: 'player1',
        structureId: 'pds1',
        shipId: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Ship not found');
    });
  });
});

describe('Ral Nel Consortium - Structure Placement', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createRalNelPlayer(state);

    // Set up structure in space
    state.map.tiles[0].units = [
      { id: 'pds1', type: 'pds', ownerId: 'player1' } as UnitInstance,
    ];

    // Set up controlled planet
    state.map.tiles[0].planets = [
      createMockPlanet('planet1', { controlledBy: 'player1' }),
    ];
  });

  describe('handlePlaceStructure', () => {
    it('should place structure from space onto planet', () => {
      const result = handlePlaceStructure(state, {
        type: 'place_structure',
        playerId: 'player1',
        structureId: 'pds1',
        planetId: 'planet1',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('structure_placed');
      expect(state.map.tiles[0].units.find(u => u.id === 'pds1')).toBeUndefined();
      expect(state.map.tiles[0].planets[0].units.find(u => u.id === 'pds1')).toBeDefined();
    });

    it('should fail for non-Ral Nel player', () => {
      state.players[0].faction = 'arborec';

      const result = handlePlaceStructure(state, {
        type: 'place_structure',
        playerId: 'player1',
        structureId: 'pds1',
        planetId: 'planet1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only Ral Nel');
    });

    it('should fail for structure not in space', () => {
      state.map.tiles[0].units = [];

      const result = handlePlaceStructure(state, {
        type: 'place_structure',
        playerId: 'player1',
        structureId: 'pds1',
        planetId: 'planet1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Structure not found in space');
    });

    it('should fail for planet not controlled by player', () => {
      state.map.tiles[0].planets[0].controlledBy = 'player2';

      const result = handlePlaceStructure(state, {
        type: 'place_structure',
        playerId: 'player1',
        structureId: 'pds1',
        planetId: 'planet1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not control this planet');
    });

    it('should fail for planet not in same system', () => {
      state.map.tiles[1].planets = [
        createMockPlanet('planet2', { controlledBy: 'player1' }),
      ];

      const result = handlePlaceStructure(state, {
        type: 'place_structure',
        playerId: 'player1',
        structureId: 'pds1',
        planetId: 'planet2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in same system');
    });
  });
});

describe('Ral Nel Consortium - Structure Movement', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createRalNelPlayer(state);

    // Set up structures and ships in system1
    state.map.tiles[0].units = [
      { id: 'pds1', type: 'pds', ownerId: 'player1' } as UnitInstance,
      { id: 'carrier1', type: 'carrier', ownerId: 'player1' } as UnitInstance,
    ];
  });

  describe('moveStructuresWithShips', () => {
    it('should move structures with ships to new system', () => {
      const result = moveStructuresWithShips(
        state,
        'player1',
        'system1',
        'system2',
        ['carrier1']
      );

      expect(result.success).toBe(true);
      expect(result.data?.structuresMoved).toBe(1);
      expect(state.map.tiles[0].units.find(u => u.id === 'pds1')).toBeUndefined();
      expect(state.map.tiles[1].units.find(u => u.id === 'pds1')).toBeDefined();
    });

    it('should do nothing for non-Ral Nel player', () => {
      state.players[0].faction = 'arborec';

      const result = moveStructuresWithShips(
        state,
        'player1',
        'system1',
        'system2',
        ['carrier1']
      );

      expect(result.success).toBe(true);
      expect(result.data?.structuresMoved).toBe(0);
    });

    it('should not move structures when no ships are moving', () => {
      const result = moveStructuresWithShips(
        state,
        'player1',
        'system1',
        'system2',
        ['nonexistent']
      );

      expect(result.success).toBe(true);
      expect(result.data?.structuresMoved).toBe(0);
    });

    it('should fail for non-existent system', () => {
      const result = moveStructuresWithShips(
        state,
        'player1',
        'nonexistent',
        'system2',
        ['carrier1']
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('System not found');
    });
  });

  describe('hasStructuresInSpace', () => {
    it('should return true when player has structures in space', () => {
      expect(hasStructuresInSpace(state, 'player1')).toBe(true);
    });

    it('should return false when no structures in space', () => {
      state.map.tiles[0].units = [
        { id: 'carrier1', type: 'carrier', ownerId: 'player1' } as UnitInstance,
      ];

      expect(hasStructuresInSpace(state, 'player1')).toBe(false);
    });

    it('should return false for other player structures', () => {
      state.map.tiles[0].units[0].ownerId = 'player2';

      expect(hasStructuresInSpace(state, 'player1')).toBe(false);
    });
  });
});

// ============================================================================
// SURVIVAL INSTINCT
// ============================================================================

describe('Ral Nel Consortium - Survival Instinct', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createRalNelPlayer(state);

    // Set up map with adjacent systems
    state.map.tiles = [
      createMockMapTile('target', { q: 0, r: 0 }),
      createMockMapTile('adjacent1', { q: 1, r: 0 }),
      createMockMapTile('adjacent2', { q: -1, r: 0 }),
      createMockMapTile('far', { q: 5, r: 5 }),
    ];

    // Add player ships to target system
    state.map.tiles[0].units = [
      { id: 'cruiser1', type: 'cruiser', ownerId: 'player1' } as UnitInstance,
    ];

    // Add ships in adjacent systems
    state.map.tiles[1].units = [
      { id: 'destroyer1', type: 'destroyer', ownerId: 'player1' } as UnitInstance,
      { id: 'destroyer2', type: 'destroyer', ownerId: 'player1' } as UnitInstance,
    ];
  });

  describe('canUseSurvivalInstinct', () => {
    it('should return true when Ral Nel has ships in activated system', () => {
      expect(canUseSurvivalInstinct(state, 'player1', 'target')).toBe(true);
    });

    it('should return false for non-Ral Nel player', () => {
      state.players[0].faction = 'arborec';
      expect(canUseSurvivalInstinct(state, 'player1', 'target')).toBe(false);
    });

    it('should return false when no ships in activated system', () => {
      state.map.tiles[0].units = [];
      expect(canUseSurvivalInstinct(state, 'player1', 'target')).toBe(false);
    });

    it('should return false for non-existent system', () => {
      expect(canUseSurvivalInstinct(state, 'player1', 'nonexistent')).toBe(false);
    });
  });

  describe('getValidSurvivalInstinctShips', () => {
    it('should return ships from adjacent systems without command tokens', () => {
      const ships = getValidSurvivalInstinctShips(state, 'player1', 'target');
      expect(ships).toHaveLength(1);
      expect(ships[0].systemId).toBe('adjacent1');
      expect(ships[0].ships).toHaveLength(2);
    });

    it('should exclude systems with player command token', () => {
      state.map.tiles[1].commandTokens = ['player1'];

      const ships = getValidSurvivalInstinctShips(state, 'player1', 'target');
      expect(ships).toHaveLength(0);
    });

    it('should not return structures', () => {
      state.map.tiles[1].units = [
        { id: 'pds1', type: 'pds', ownerId: 'player1' } as UnitInstance,
      ];

      const ships = getValidSurvivalInstinctShips(state, 'player1', 'target');
      expect(ships).toHaveLength(0);
    });

    it('should return empty for non-Ral Nel player', () => {
      state.players[0].faction = 'arborec';
      const ships = getValidSurvivalInstinctShips(state, 'player1', 'target');
      expect(ships).toHaveLength(0);
    });
  });

  describe('handleSurvivalInstinct', () => {
    it('should relocate ships to activated system', () => {
      const result = handleSurvivalInstinct(state, {
        type: 'survival_instinct',
        playerId: 'player1',
        systemId: 'target',
        shipIds: ['destroyer1', 'destroyer2'],
        fromSystemIds: ['adjacent1', 'adjacent1'],
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('survival_instinct_used');
      expect(result.data?.movedShips).toHaveLength(2);
      expect(state.map.tiles[0].units).toHaveLength(3);
    });

    it('should fail when trying to move more than 2 ships', () => {
      const result = handleSurvivalInstinct(state, {
        type: 'survival_instinct',
        playerId: 'player1',
        systemId: 'target',
        shipIds: ['ship1', 'ship2', 'ship3'],
        fromSystemIds: ['adjacent1', 'adjacent1', 'adjacent1'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('up to 2 ships');
    });

    it('should fail for non-Ral Nel player', () => {
      state.players[0].faction = 'arborec';

      const result = handleSurvivalInstinct(state, {
        type: 'survival_instinct',
        playerId: 'player1',
        systemId: 'target',
        shipIds: ['destroyer1'],
        fromSystemIds: ['adjacent1'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only Ral Nel');
    });

    it('should skip ships in systems with command token', () => {
      state.map.tiles[1].commandTokens = ['player1'];

      const result = handleSurvivalInstinct(state, {
        type: 'survival_instinct',
        playerId: 'player1',
        systemId: 'target',
        shipIds: ['destroyer1'],
        fromSystemIds: ['adjacent1'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid ships');
    });

    it('should fail when no valid ships to relocate', () => {
      const result = handleSurvivalInstinct(state, {
        type: 'survival_instinct',
        playerId: 'player1',
        systemId: 'target',
        shipIds: ['nonexistent'],
        fromSystemIds: ['adjacent1'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid ships');
    });
  });
});

// ============================================================================
// Last Dispatch Flagship
// ============================================================================

describe('Ral Nel Consortium - Last Dispatch', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createRalNelPlayer(state);

    // Set up active combat
    state.activeCombat = {
      systemId: 'system1',
      attackerId: 'player1',
      defenderId: 'player2',
      retreatAnnounced: { attacker: true, defender: false },
    } as GameState['activeCombat'];

    // Add units to combat system
    state.map.tiles[0].units = [
      { id: 'flagship1', type: 'flagship', ownerId: 'player1' } as UnitInstance,
      { id: 'destroyer1', type: 'destroyer', ownerId: 'player2' } as UnitInstance,
      { id: 'dreadnought1', type: 'dreadnought', ownerId: 'player2' } as UnitInstance,
    ];
  });

  describe('handleLastDispatchRetreat', () => {
    it('should destroy enemy ship without sustain damage', () => {
      const result = handleLastDispatchRetreat(state, 'player1', 'destroyer1');

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('last_dispatch_triggered');
      expect(result.triggeredEvents).toContain('unit_destroyed');
      expect(state.map.tiles[0].units.find(u => u.id === 'destroyer1')).toBeUndefined();
    });

    it('should fail to target unit with sustain damage', () => {
      const result = handleLastDispatchRetreat(state, 'player1', 'dreadnought1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('SUSTAIN DAMAGE');
    });

    it('should fail for non-Ral Nel player', () => {
      state.players[0].faction = 'arborec';

      const result = handleLastDispatchRetreat(state, 'player1', 'destroyer1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only Ral Nel');
    });

    it('should fail when not in combat', () => {
      state.activeCombat = undefined;

      const result = handleLastDispatchRetreat(state, 'player1', 'destroyer1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active combat');
    });

    it('should fail when retreat not announced', () => {
      state.activeCombat!.retreatAnnounced.attacker = false;

      const result = handleLastDispatchRetreat(state, 'player1', 'destroyer1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('announce retreat first');
    });

    it('should fail when player not in combat', () => {
      state.activeCombat!.attackerId = 'player3';
      state.activeCombat!.defenderId = 'player4';

      const result = handleLastDispatchRetreat(state, 'player1', 'destroyer1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in combat');
    });
  });
});

// ============================================================================
// Alarum Mech
// ============================================================================

describe('Ral Nel Consortium - Alarum Mech', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createRalNelPlayer(state);

    // Set up map with adjacent systems
    state.map.tiles = [
      createMockMapTile('target', { q: 0, r: 0 }, {
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player1',
            units: [
              { id: 'mech1', type: 'mech', ownerId: 'player1', planetId: 'planet1' } as UnitInstance,
            ],
          }),
        ],
      }),
      createMockMapTile('adjacent1', { q: 1, r: 0 }, {
        planets: [
          createMockPlanet('planet2', {
            controlledBy: 'player1',
            units: [
              { id: 'infantry1', type: 'infantry', ownerId: 'player1', planetId: 'planet2' } as UnitInstance,
              { id: 'infantry2', type: 'infantry', ownerId: 'player1', planetId: 'planet2' } as UnitInstance,
              { id: 'infantry3', type: 'infantry', ownerId: 'player1', planetId: 'planet2' } as UnitInstance,
            ],
          }),
        ],
      }),
    ];
  });

  describe('handleAlarumReinforce', () => {
    it('should move up to 2 ground forces to mech planet', () => {
      const result = handleAlarumReinforce(
        state,
        'player1',
        'planet1',
        ['infantry1', 'infantry2'],
        ['adjacent1', 'adjacent1']
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('alarum_reinforcement');
      expect(result.data?.movedUnits).toHaveLength(2);
      expect(state.map.tiles[0].planets[0].units).toHaveLength(3); // mech + 2 infantry
    });

    it('should fail for non-Ral Nel player', () => {
      state.players[0].faction = 'arborec';

      const result = handleAlarumReinforce(
        state,
        'player1',
        'planet1',
        ['infantry1'],
        ['adjacent1']
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only Ral Nel');
    });

    it('should fail when trying to move more than 2 units', () => {
      const result = handleAlarumReinforce(
        state,
        'player1',
        'planet1',
        ['infantry1', 'infantry2', 'infantry3'],
        ['adjacent1', 'adjacent1', 'adjacent1']
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('up to 2 ground forces');
    });

    it('should fail when no mech on target planet', () => {
      state.map.tiles[0].planets[0].units = [];

      const result = handleAlarumReinforce(
        state,
        'player1',
        'planet1',
        ['infantry1'],
        ['adjacent1']
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No Alarum mech');
    });

    it('should fail when planet not found', () => {
      const result = handleAlarumReinforce(
        state,
        'player1',
        'nonexistent',
        ['infantry1'],
        ['adjacent1']
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Planet not found');
    });

    it('should fail when no valid ground forces to move', () => {
      const result = handleAlarumReinforce(
        state,
        'player1',
        'planet1',
        ['nonexistent'],
        ['adjacent1']
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('No valid ground forces');
    });
  });
});
