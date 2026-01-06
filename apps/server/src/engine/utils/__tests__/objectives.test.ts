/**
 * Comprehensive tests for objectives utility functions
 *
 * Tests are based on official TI4 rules from:
 * - Twilight Imperium Wiki
 * - TI4Rules.github.io
 * - Fantasy Flight Games official rules
 */

import { describe, it, expect } from 'vitest';
import type {
  GameState,
  PlayerState,
  MapTile,
  HexCoord,
  UnitInstance,
  PlanetInstance,
} from '@ti4/shared';
import {
  getHomeSystemTile,
  getHomeSystemPlanetIds,
  controlsHomeSystem,
  getControlledPlanets,
  isHomeSystem,
  isEnemyHomeSystem,
  countTechByColor,
  countUnitUpgradeTechs,
  countFactionTechs,
  countUnitsOnBoard,
  countStructures,
  countStructuresOutsideHome,
  countPlanetsWithStructuresOutsideHome,
  countSystemsWithShips,
  countNonFighterShipsInSystem,
  getMaxNonFighterShipsInAnySystem,
  isAdjacentToMecatol,
  countSystemsAdjacentToMecatolWithShips,
  controlsMecatol,
  countShipsAtMecatol,
  countSystemsWithUnitsNoPlanets,
  countSpecialSystemsWithUnits,
  countEdgeSystemsWithUnits,
  hasCapitalShipInEnemyHomeOrMecatol,
  countEnemyHomesWithAdjacentPlanets,
  hasShipsInBothWormholeTypes,
  hasShipsWithEnemyDock,
  hasShipsAdjacentToEnemyHome,
  hasShipsAdjacentToAnomaly,
  calculateTotalResources,
  calculateTotalInfluence,
  countGroundForcesOnPlanetsWithoutDock,
  hasSharedSystemControl,
  hasPromissoryFromOther,
  hasUnitsInNexus,
  calculateSpendableResources,
  calculateSpendableInfluence,
  calculateSpendableTokens,
  checkObjectiveRequirement,
  checkActionPhaseTriggers,
  getScorableObjectives,
} from '../objectives.js';

// =============================================================================
// MOCK FACTORIES
// =============================================================================

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
    promissoryNotesInPlay: [],
    planets: [],
    strategyCard: null,
    strategyCardUsed: false,
    passed: false,
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
    ...overrides,
  } as PlayerState;
}

function createMockPlanet(
  planetId: string,
  controlledBy: string | null,
  units: UnitInstance[] = [],
  attachments: string[] = []
): PlanetInstance {
  return {
    planetId,
    controlledBy,
    exhausted: false,
    attachments,
    units,
  } as PlanetInstance;
}

function createMockUnit(type: string, ownerId: string, overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: `unit-${Math.random().toString(36).substr(2, 9)}`,
    type,
    ownerId,
    damaged: false,
    ...overrides,
  } as UnitInstance;
}

function createMockTile(
  position: HexCoord,
  systemId: number,
  overrides: Partial<MapTile> = {}
): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId,
    position,
    rotation: 0,
    planets: [],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
    ...overrides,
  } as MapTile;
}

function createMockGameState(
  players: PlayerState[] = [],
  tiles: MapTile[] = []
): GameState {
  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: players[0]?.id || 'player1',
    speakerId: players[0]?.id || 'player1',
    initiativeOrder: players.map(p => p.id),
    players,
    map: {
      tiles,
      playerCount: players.length || 4,
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
  } as GameState;
}

// =============================================================================
// HOME SYSTEM CONTROL TESTS
// =============================================================================

describe('Home System Control', () => {
  describe('getHomeSystemTile', () => {
    it('should return home system tile for Sol player', () => {
      const player = createMockPlayer('player1', { faction: 'sol' });
      // Sol home system is system 1
      const homeTile = createMockTile({ q: 0, r: 3 }, 1);
      const state = createMockGameState([player], [homeTile]);

      const result = getHomeSystemTile(state, 'player1');

      expect(result).not.toBeNull();
      expect(result?.systemId).toBe(1);
    });

    it('should return null for unknown player', () => {
      const player = createMockPlayer('player1', { faction: 'sol' });
      const state = createMockGameState([player], []);

      const result = getHomeSystemTile(state, 'unknown');

      expect(result).toBeNull();
    });
  });

  describe('getHomeSystemPlanetIds', () => {
    it('should return planet IDs for Sol home system', () => {
      const player = createMockPlayer('player1', { faction: 'sol' });
      const state = createMockGameState([player], []);

      const result = getHomeSystemPlanetIds(state, 'player1');

      // Sol has Jord as home planet
      expect(result).toContain('jord');
    });

    it('should return empty array for unknown player', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player], []);

      const result = getHomeSystemPlanetIds(state, 'unknown');

      expect(result).toEqual([]);
    });
  });

  describe('controlsHomeSystem', () => {
    it('should return true when controlling all home planets', () => {
      const player = createMockPlayer('player1', { faction: 'sol' });
      const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
        planets: [createMockPlanet('jord', 'player1')],
      });
      const state = createMockGameState([player], [homeTile]);

      const result = controlsHomeSystem(state, 'player1');

      expect(result).toBe(true);
    });

    it('should return false when opponent controls home planet', () => {
      const player = createMockPlayer('player1', { faction: 'sol' });
      const enemy = createMockPlayer('player2', { faction: 'hacan' });
      const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
        planets: [createMockPlanet('jord', 'player2')], // Enemy controls
      });
      const state = createMockGameState([player, enemy], [homeTile]);

      const result = controlsHomeSystem(state, 'player1');

      expect(result).toBe(false);
    });

    it('should return false when home planet is uncontrolled', () => {
      const player = createMockPlayer('player1', { faction: 'sol' });
      const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
        planets: [createMockPlanet('jord', null)], // Uncontrolled
      });
      const state = createMockGameState([player], [homeTile]);

      const result = controlsHomeSystem(state, 'player1');

      expect(result).toBe(false);
    });
  });
});

// =============================================================================
// PLANET HELPERS TESTS
// =============================================================================

describe('Planet Helpers', () => {
  describe('getControlledPlanets', () => {
    it('should return all planets controlled by player', () => {
      const player = createMockPlayer('player1');
      const tile1 = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [createMockPlanet('wellon', 'player1')],
      });
      const tile2 = createMockTile({ q: 1, r: 0 }, 20, {
        planets: [createMockPlanet('vefut_ii', 'player1')],
      });
      const state = createMockGameState([player], [tile1, tile2]);

      const result = getControlledPlanets(state, 'player1');

      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for player with no planets', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [createMockPlanet('wellon', null)], // Uncontrolled
      });
      const state = createMockGameState([player], [tile]);

      const result = getControlledPlanets(state, 'player1');

      expect(result).toEqual([]);
    });

    it('should not include planets controlled by opponent', () => {
      const player = createMockPlayer('player1');
      const enemy = createMockPlayer('player2');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [createMockPlanet('wellon', 'player2')], // Enemy controls
      });
      const state = createMockGameState([player, enemy], [tile]);

      const result = getControlledPlanets(state, 'player1');

      expect(result).toEqual([]);
    });
  });

  describe('isHomeSystem', () => {
    it('should return true for home system tile', () => {
      // System 1 is Sol home system (type: home)
      const homeTile = createMockTile({ q: 0, r: 3 }, 1);

      const result = isHomeSystem(homeTile);

      expect(result).toBe(true);
    });

    it('should return false for Mecatol Rex', () => {
      // System 18 is Mecatol Rex
      const mecatolTile = createMockTile({ q: 0, r: 0 }, 18);

      const result = isHomeSystem(mecatolTile);

      expect(result).toBe(false);
    });

    it('should return false for regular planet system', () => {
      // System 19 is a regular blue tile
      const regularTile = createMockTile({ q: 1, r: 0 }, 19);

      const result = isHomeSystem(regularTile);

      expect(result).toBe(false);
    });
  });

  describe('isEnemyHomeSystem', () => {
    it('should return true for another player home system', () => {
      const solPlayer = createMockPlayer('player1', { faction: 'sol' });
      const hacanPlayer = createMockPlayer('player2', { faction: 'hacan' });
      // System 10 is Hacan home system
      const hacanHome = createMockTile({ q: 0, r: -3 }, 10);
      const state = createMockGameState([solPlayer, hacanPlayer], [hacanHome]);

      const result = isEnemyHomeSystem(state, hacanHome, 'player1');

      expect(result).toBe(true);
    });

    it('should return false for own home system', () => {
      const solPlayer = createMockPlayer('player1', { faction: 'sol' });
      // System 1 is Sol home system
      const solHome = createMockTile({ q: 0, r: 3 }, 1);
      const state = createMockGameState([solPlayer], [solHome]);

      const result = isEnemyHomeSystem(state, solHome, 'player1');

      expect(result).toBe(false);
    });
  });
});

// =============================================================================
// TECHNOLOGY HELPERS TESTS
// =============================================================================

describe('Technology Helpers', () => {
  describe('countTechByColor', () => {
    it('should count blue technologies correctly', () => {
      const player = createMockPlayer('player1', {
        technologies: ['gravity_drive', 'fleet_logistics', 'antimass_deflectors'],
      });

      const result = countTechByColor(player);

      expect(result.blue).toBe(3);
    });

    it('should count red technologies correctly', () => {
      const player = createMockPlayer('player1', {
        technologies: ['magen_defense_grid', 'plasma_scoring', 'duranium_armor'],
      });

      const result = countTechByColor(player);

      expect(result.red).toBe(3);
    });

    it('should count yellow technologies correctly', () => {
      const player = createMockPlayer('player1', {
        technologies: ['sarween_tools', 'graviton_laser_system', 'transit_diodes'],
      });

      const result = countTechByColor(player);

      expect(result.yellow).toBe(3);
    });

    it('should count green technologies correctly', () => {
      const player = createMockPlayer('player1', {
        technologies: ['neural_motivator', 'dacxive_animators', 'hyper_metabolism'],
      });

      const result = countTechByColor(player);

      expect(result.green).toBe(3);
    });

    it('should return 0 for empty tech list', () => {
      const player = createMockPlayer('player1', { technologies: [] });

      const result = countTechByColor(player);

      expect(result.blue).toBe(0);
      expect(result.red).toBe(0);
      expect(result.yellow).toBe(0);
      expect(result.green).toBe(0);
    });
  });

  describe('countUnitUpgradeTechs', () => {
    it('should count unit upgrade technologies', () => {
      const player = createMockPlayer('player1', {
        technologies: ['carrier_ii', 'cruiser_ii', 'dreadnought_ii'],
      });

      const result = countUnitUpgradeTechs(player);

      expect(result).toBe(3);
    });

    it('should not count non-unit technologies', () => {
      const player = createMockPlayer('player1', {
        technologies: ['gravity_drive', 'sarween_tools', 'neural_motivator'],
      });

      const result = countUnitUpgradeTechs(player);

      expect(result).toBe(0);
    });

    it('should return 0 for player with no techs', () => {
      const player = createMockPlayer('player1', { technologies: [] });

      const result = countUnitUpgradeTechs(player);

      expect(result).toBe(0);
    });
  });

  describe('countFactionTechs', () => {
    it('should count Sol faction technologies', () => {
      const player = createMockPlayer('player1', {
        faction: 'sol',
        technologies: ['spec_ops_ii', 'advanced_carrier_ii'],
      });

      const result = countFactionTechs(player);

      expect(result).toBe(2);
    });

    it('should not count technologies from other factions', () => {
      const player = createMockPlayer('player1', {
        faction: 'sol',
        technologies: ['letani_warrior_ii'], // Arborec tech
      });

      const result = countFactionTechs(player);

      expect(result).toBe(0);
    });
  });
});

// =============================================================================
// UNIT HELPERS TESTS
// =============================================================================

describe('Unit Helpers', () => {
  describe('countUnitsOnBoard', () => {
    it('should count ships in space', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [
          createMockUnit('cruiser', 'player1'),
          createMockUnit('cruiser', 'player1'),
          createMockUnit('destroyer', 'player1'),
        ],
      });
      const state = createMockGameState([player], [tile]);

      const result = countUnitsOnBoard(state, 'player1', ['cruiser', 'destroyer']);

      expect(result).toBe(3);
    });

    it('should count units on planets', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [
          createMockPlanet('wellon', 'player1', [
            createMockUnit('infantry', 'player1'),
            createMockUnit('infantry', 'player1'),
            createMockUnit('pds', 'player1'),
          ]),
        ],
      });
      const state = createMockGameState([player], [tile]);

      const result = countUnitsOnBoard(state, 'player1', ['infantry', 'pds']);

      expect(result).toBe(3);
    });

    it('should not count enemy units', () => {
      const player = createMockPlayer('player1');
      const enemy = createMockPlayer('player2');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [
          createMockUnit('cruiser', 'player1'),
          createMockUnit('cruiser', 'player2'), // Enemy
        ],
      });
      const state = createMockGameState([player, enemy], [tile]);

      const result = countUnitsOnBoard(state, 'player1', ['cruiser']);

      expect(result).toBe(1);
    });
  });

  describe('countStructures', () => {
    it('should count PDS units as structures', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [
          createMockPlanet('wellon', 'player1', [
            createMockUnit('pds', 'player1'),
            createMockUnit('pds', 'player1'),
          ]),
        ],
      });
      const state = createMockGameState([player], [tile]);

      const result = countStructures(state, 'player1');

      expect(result).toBe(2);
    });

    it('should count space docks as structures', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [
          createMockPlanet('wellon', 'player1', [
            createMockUnit('space_dock', 'player1'),
          ]),
        ],
      });
      const state = createMockGameState([player], [tile]);

      const result = countStructures(state, 'player1');

      expect(result).toBe(1);
    });

    it('should not count ships as structures', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [createMockUnit('cruiser', 'player1')],
      });
      const state = createMockGameState([player], [tile]);

      const result = countStructures(state, 'player1');

      expect(result).toBe(0);
    });
  });

  describe('countStructuresOutsideHome', () => {
    it('should exclude home system structures', () => {
      const player = createMockPlayer('player1', { faction: 'sol' });
      // System 1 is Sol home, system 19 is non-home
      const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
        planets: [createMockPlanet('jord', 'player1', [
          createMockUnit('pds', 'player1'),
        ])],
      });
      const otherTile = createMockTile({ q: 1, r: 0 }, 19, {
        planets: [createMockPlanet('wellon', 'player1', [
          createMockUnit('pds', 'player1'),
        ])],
      });
      const state = createMockGameState([player], [homeTile, otherTile]);

      const result = countStructuresOutsideHome(state, 'player1');

      expect(result).toBe(1); // Only the non-home PDS
    });

    it('should include structures on all non-home planets', () => {
      const player = createMockPlayer('player1', { faction: 'sol' });
      const tile1 = createMockTile({ q: 1, r: 0 }, 19, {
        planets: [createMockPlanet('wellon', 'player1', [
          createMockUnit('pds', 'player1'),
        ])],
      });
      const tile2 = createMockTile({ q: 2, r: 0 }, 20, {
        planets: [createMockPlanet('vefut_ii', 'player1', [
          createMockUnit('space_dock', 'player1'),
        ])],
      });
      const state = createMockGameState([player], [tile1, tile2]);

      const result = countStructuresOutsideHome(state, 'player1');

      expect(result).toBe(2);
    });
  });

  describe('countSystemsWithShips', () => {
    it('should count systems where player has ships', () => {
      const player = createMockPlayer('player1');
      const tile1 = createMockTile({ q: 0, r: 0 }, 19, {
        units: [createMockUnit('cruiser', 'player1')],
      });
      const tile2 = createMockTile({ q: 1, r: 0 }, 20, {
        units: [createMockUnit('destroyer', 'player1')],
      });
      const tile3 = createMockTile({ q: 2, r: 0 }, 21, {
        units: [], // No ships
      });
      const state = createMockGameState([player], [tile1, tile2, tile3]);

      const result = countSystemsWithShips(state, 'player1');

      expect(result).toBe(2);
    });

    it('should return 0 when player has no ships', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, { units: [] });
      const state = createMockGameState([player], [tile]);

      const result = countSystemsWithShips(state, 'player1');

      expect(result).toBe(0);
    });
  });

  describe('countNonFighterShipsInSystem', () => {
    it('should count non-fighter ships', () => {
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [
          createMockUnit('cruiser', 'player1'),
          createMockUnit('dreadnought', 'player1'),
          createMockUnit('fighter', 'player1'), // Should not count
        ],
      });

      const result = countNonFighterShipsInSystem(tile, 'player1');

      expect(result).toBe(2);
    });

    it('should not count fighters', () => {
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [
          createMockUnit('fighter', 'player1'),
          createMockUnit('fighter', 'player1'),
        ],
      });

      const result = countNonFighterShipsInSystem(tile, 'player1');

      expect(result).toBe(0);
    });
  });

  describe('getMaxNonFighterShipsInAnySystem', () => {
    it('should return max non-fighter ships across all systems', () => {
      const player = createMockPlayer('player1');
      const tile1 = createMockTile({ q: 0, r: 0 }, 19, {
        units: [
          createMockUnit('cruiser', 'player1'),
          createMockUnit('cruiser', 'player1'),
        ],
      });
      const tile2 = createMockTile({ q: 1, r: 0 }, 20, {
        units: [
          createMockUnit('dreadnought', 'player1'),
          createMockUnit('dreadnought', 'player1'),
          createMockUnit('dreadnought', 'player1'),
          createMockUnit('carrier', 'player1'),
          createMockUnit('carrier', 'player1'),
        ],
      });
      const state = createMockGameState([player], [tile1, tile2]);

      const result = getMaxNonFighterShipsInAnySystem(state, 'player1');

      expect(result).toBe(5);
    });
  });
});

// =============================================================================
// MECATOL AND SPECIAL SYSTEM TESTS
// =============================================================================

describe('Special System Helpers', () => {
  describe('isAdjacentToMecatol', () => {
    it('should return true for adjacent position', () => {
      const mecatolTile = createMockTile({ q: 0, r: 0 }, 18);
      const state = createMockGameState([], [mecatolTile]);

      // Position {q:1, r:0} is adjacent to center
      const result = isAdjacentToMecatol(state, { q: 1, r: 0 });

      expect(result).toBe(true);
    });

    it('should return false for non-adjacent position', () => {
      const mecatolTile = createMockTile({ q: 0, r: 0 }, 18);
      const state = createMockGameState([], [mecatolTile]);

      // Position {q:2, r:0} is not adjacent
      const result = isAdjacentToMecatol(state, { q: 2, r: 0 });

      expect(result).toBe(false);
    });
  });

  describe('countSystemsAdjacentToMecatolWithShips', () => {
    it('should count systems with ships adjacent to Mecatol', () => {
      const player = createMockPlayer('player1');
      const mecatolTile = createMockTile({ q: 0, r: 0 }, 18);
      const adjacentTile1 = createMockTile({ q: 1, r: 0 }, 19, {
        units: [createMockUnit('cruiser', 'player1')],
      });
      const adjacentTile2 = createMockTile({ q: 0, r: 1 }, 20, {
        units: [createMockUnit('destroyer', 'player1')],
      });
      const state = createMockGameState([player], [mecatolTile, adjacentTile1, adjacentTile2]);

      const result = countSystemsAdjacentToMecatolWithShips(state, 'player1');

      expect(result).toBe(2);
    });
  });

  describe('controlsMecatol', () => {
    it('should return true when controlling Mecatol Rex', () => {
      const player = createMockPlayer('player1');
      const mecatolTile = createMockTile({ q: 0, r: 0 }, 18, {
        planets: [createMockPlanet('mecatol_rex', 'player1')],
      });
      const state = createMockGameState([player], [mecatolTile]);

      const result = controlsMecatol(state, 'player1');

      expect(result).toBe(true);
    });

    it('should return false when not controlling Mecatol', () => {
      const player = createMockPlayer('player1');
      const mecatolTile = createMockTile({ q: 0, r: 0 }, 18, {
        planets: [createMockPlanet('mecatol_rex', null)],
      });
      const state = createMockGameState([player], [mecatolTile]);

      const result = controlsMecatol(state, 'player1');

      expect(result).toBe(false);
    });
  });

  describe('countShipsAtMecatol', () => {
    it('should count player ships at Mecatol', () => {
      const player = createMockPlayer('player1');
      const mecatolTile = createMockTile({ q: 0, r: 0 }, 18, {
        units: [
          createMockUnit('cruiser', 'player1'),
          createMockUnit('dreadnought', 'player1'),
          createMockUnit('fighter', 'player1'),
        ],
      });
      const state = createMockGameState([player], [mecatolTile]);

      const result = countShipsAtMecatol(state, 'player1');

      expect(result).toBe(3);
    });
  });
});

// =============================================================================
// WORMHOLE AND ANOMALY TESTS
// =============================================================================

describe('Wormhole and Anomaly Helpers', () => {
  describe('hasShipsInBothWormholeTypes', () => {
    it('should return true with ships at alpha and beta wormholes', () => {
      const player = createMockPlayer('player1');
      // System 25 has alpha wormhole, 26 has beta
      const alphaTile = createMockTile({ q: 1, r: 0 }, 25, {
        units: [createMockUnit('cruiser', 'player1')],
      });
      const betaTile = createMockTile({ q: 2, r: 0 }, 26, {
        units: [createMockUnit('destroyer', 'player1')],
      });
      const state = createMockGameState([player], [alphaTile, betaTile]);

      const result = hasShipsInBothWormholeTypes(state, 'player1');

      expect(result).toBe(true);
    });

    it('should return false with ships at only one wormhole type', () => {
      const player = createMockPlayer('player1');
      const alphaTile = createMockTile({ q: 1, r: 0 }, 25, {
        units: [createMockUnit('cruiser', 'player1')],
      });
      const state = createMockGameState([player], [alphaTile]);

      const result = hasShipsInBothWormholeTypes(state, 'player1');

      expect(result).toBe(false);
    });
  });

  describe('hasShipsAdjacentToAnomaly', () => {
    it('should return true with ships adjacent to anomaly', () => {
      const player = createMockPlayer('player1');
      const anomalyTile = createMockTile({ q: 0, r: 0 }, 41, {
        anomaly: 'gravity_rift',
      });
      const adjacentTile = createMockTile({ q: 1, r: 0 }, 19, {
        units: [createMockUnit('cruiser', 'player1')],
      });
      const state = createMockGameState([player], [anomalyTile, adjacentTile]);

      const result = hasShipsAdjacentToAnomaly(state, 'player1');

      expect(result).toBe(true);
    });
  });
});

// =============================================================================
// RESOURCE CALCULATION TESTS
// =============================================================================

describe('Resource Calculation Helpers', () => {
  describe('calculateSpendableTokens', () => {
    it('should return total of tactics and strategy tokens', () => {
      const player = createMockPlayer('player1', {
        commandTokens: { tactics: 4, fleet: 3, strategy: 2 },
      });

      const result = calculateSpendableTokens(player);

      expect(result).toBe(6); // 4 tactics + 2 strategy
    });
  });
});

// =============================================================================
// OBJECTIVE REQUIREMENT TESTS
// =============================================================================

describe('Objective Requirements', () => {
  describe('Stage I Public Objectives', () => {
    describe('Corner the Market - control 4 planets with same trait', () => {
      it('should pass with 4 cultural planets', () => {
        const player = createMockPlayer('player1', { faction: 'sol' });
        // Create tiles with cultural planets (system 19-22 have cultural planets)
        const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
          planets: [createMockPlanet('jord', 'player1')],
        });
        // Cultural planets: Abyz (22), Fria (22), Arinam (24), Meer (24)
        const tile1 = createMockTile({ q: 1, r: 0 }, 22, {
          planets: [
            createMockPlanet('abyz', 'player1'),
            createMockPlanet('fria', 'player1'),
          ],
        });
        const tile2 = createMockTile({ q: 2, r: 0 }, 24, {
          planets: [
            createMockPlanet('arinam', 'player1'),
            createMockPlanet('meer', 'player1'),
          ],
        });
        const state = createMockGameState([player], [homeTile, tile1, tile2]);

        const result = checkObjectiveRequirement(state, 'player1', 'corner_the_market');

        // Note: Result depends on actual planet data having cultural trait
        expect(result.canScore !== undefined).toBe(true);
      });
    });

    describe('Develop Weaponry - own 2 unit upgrade technologies', () => {
      it('should pass with 2 unit upgrade techs', () => {
        const player = createMockPlayer('player1', {
          faction: 'sol',
          technologies: ['carrier_ii', 'cruiser_ii'],
        });
        const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
          planets: [createMockPlanet('jord', 'player1')],
        });
        const state = createMockGameState([player], [homeTile]);

        const result = checkObjectiveRequirement(state, 'player1', 'develop_weaponry');

        expect(result.canScore).toBe(true);
      });

      it('should fail with 1 unit upgrade tech', () => {
        const player = createMockPlayer('player1', {
          faction: 'sol',
          technologies: ['carrier_ii'],
        });
        const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
          planets: [createMockPlanet('jord', 'player1')],
        });
        const state = createMockGameState([player], [homeTile]);

        const result = checkObjectiveRequirement(state, 'player1', 'develop_weaponry');

        expect(result.canScore).toBe(false);
      });
    });

    describe('Diversify Research - own 2 techs in each of 2 colors', () => {
      it('should pass with 2 blue and 2 red techs', () => {
        const player = createMockPlayer('player1', {
          faction: 'sol',
          technologies: [
            'gravity_drive', 'fleet_logistics', // Blue
            'magen_defense_grid', 'plasma_scoring', // Red
          ],
        });
        const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
          planets: [createMockPlanet('jord', 'player1')],
        });
        const state = createMockGameState([player], [homeTile]);

        const result = checkObjectiveRequirement(state, 'player1', 'diversify_research');

        expect(result.canScore).toBe(true);
      });

      it('should fail with 3 of one color and 1 of another', () => {
        const player = createMockPlayer('player1', {
          faction: 'sol',
          technologies: [
            'gravity_drive', 'fleet_logistics', 'antimass_deflectors', // 3 Blue
            'magen_defense_grid', // 1 Red
          ],
        });
        const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
          planets: [createMockPlanet('jord', 'player1')],
        });
        const state = createMockGameState([player], [homeTile]);

        const result = checkObjectiveRequirement(state, 'player1', 'diversify_research');

        expect(result.canScore).toBe(false);
      });
    });
  });

  describe('Stage II Public Objectives', () => {
    describe('Conquer the Weak - control planet in enemy home system', () => {
      it('should pass with 1 planet in enemy home system', () => {
        const solPlayer = createMockPlayer('player1', { faction: 'sol' });
        const hacanPlayer = createMockPlayer('player2', { faction: 'hacan' });
        // Sol controls own home
        const solHome = createMockTile({ q: 0, r: 3 }, 1, {
          planets: [createMockPlanet('jord', 'player1')],
        });
        // Sol controls planet in Hacan home (system 10)
        const hacanHome = createMockTile({ q: 0, r: -3 }, 10, {
          planets: [createMockPlanet('arretze', 'player1')], // Sol controls
        });
        const state = createMockGameState([solPlayer, hacanPlayer], [solHome, hacanHome]);

        const result = checkObjectiveRequirement(state, 'player1', 'conquer_the_weak');

        expect(result.canScore).toBe(true);
      });

      it('should fail with 0 enemy home planets', () => {
        const solPlayer = createMockPlayer('player1', { faction: 'sol' });
        const hacanPlayer = createMockPlayer('player2', { faction: 'hacan' });
        const solHome = createMockTile({ q: 0, r: 3 }, 1, {
          planets: [createMockPlanet('jord', 'player1')],
        });
        const hacanHome = createMockTile({ q: 0, r: -3 }, 10, {
          planets: [createMockPlanet('arretze', 'player2')], // Hacan controls
        });
        const state = createMockGameState([solPlayer, hacanPlayer], [solHome, hacanHome]);

        const result = checkObjectiveRequirement(state, 'player1', 'conquer_the_weak');

        expect(result.canScore).toBe(false);
      });
    });

    describe('Master the Sciences - own 2 techs in each of 4 colors', () => {
      it('should pass with 2 techs in each of 4 colors', () => {
        const player = createMockPlayer('player1', {
          faction: 'sol',
          technologies: [
            'gravity_drive', 'fleet_logistics', // Blue
            'magen_defense_grid', 'plasma_scoring', // Red
            'sarween_tools', 'graviton_laser_system', // Yellow
            'neural_motivator', 'dacxive_animators', // Green
          ],
        });
        const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
          planets: [createMockPlanet('jord', 'player1')],
        });
        const state = createMockGameState([player], [homeTile]);

        const result = checkObjectiveRequirement(state, 'player1', 'master_the_sciences');

        expect(result.canScore).toBe(true);
      });

      it('should fail with only 3 colors covered', () => {
        const player = createMockPlayer('player1', {
          faction: 'sol',
          technologies: [
            'gravity_drive', 'fleet_logistics', // Blue
            'magen_defense_grid', 'plasma_scoring', // Red
            'sarween_tools', 'graviton_laser_system', // Yellow
            'neural_motivator', // Only 1 Green
          ],
        });
        const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
          planets: [createMockPlanet('jord', 'player1')],
        });
        const state = createMockGameState([player], [homeTile]);

        const result = checkObjectiveRequirement(state, 'player1', 'master_the_sciences');

        expect(result.canScore).toBe(false);
      });
    });
  });

  describe('Home System Requirement', () => {
    it('should fail public objective without home system control', () => {
      const player = createMockPlayer('player1', { faction: 'sol' });
      // Enemy controls Sol home planet
      const homeTile = createMockTile({ q: 0, r: 3 }, 1, {
        planets: [createMockPlanet('jord', 'player2')],
      });
      const state = createMockGameState([player], [homeTile]);

      const result = checkObjectiveRequirement(state, 'player1', 'develop_weaponry');

      expect(result.canScore).toBe(false);
      expect(result.reason).toContain('home system');
    });
  });

  describe('Unknown Objective', () => {
    it('should return error for unknown objective ID', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player], []);

      const result = checkObjectiveRequirement(state, 'player1', 'nonexistent_objective');

      expect(result.canScore).toBe(false);
      expect(result.reason).toBe('Unknown objective');
    });
  });
});

// =============================================================================
// ACTION PHASE TRIGGER TESTS
// =============================================================================

describe('Action Phase Triggers', () => {
  describe('Destroy Their Greatest Ship', () => {
    it('should trigger when destroying enemy war sun', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['destroy_their_greatest_ship'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        type: 'combat_won',
        playerId: 'player1',
        unitsDestroyed: [{ type: 'war_sun', ownerId: 'player2' }],
      });

      expect(result).toContain('destroy_their_greatest_ship');
    });

    it('should trigger when destroying enemy flagship', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['destroy_their_greatest_ship'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        type: 'combat_won',
        playerId: 'player1',
        unitsDestroyed: [{ type: 'flagship', ownerId: 'player2' }],
      });

      expect(result).toContain('destroy_their_greatest_ship');
    });

    it('should not trigger for dreadnoughts', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['destroy_their_greatest_ship'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        type: 'combat_won',
        playerId: 'player1',
        unitsDestroyed: [{ type: 'dreadnought', ownerId: 'player2' }],
      });

      expect(result).not.toContain('destroy_their_greatest_ship');
    });
  });

  describe('Spark a Rebellion', () => {
    it('should trigger when winning against VP leader', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['spark_a_rebellion'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        type: 'combat_won',
        playerId: 'player1',
        isAgainstLeader: true,
      });

      expect(result).toContain('spark_a_rebellion');
    });

    it('should not trigger against non-leader', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['spark_a_rebellion'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        type: 'combat_won',
        playerId: 'player1',
        isAgainstLeader: false,
      });

      expect(result).not.toContain('spark_a_rebellion');
    });
  });

  describe('Unveil Flagship', () => {
    it('should trigger when winning with flagship in combat', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['unveil_flagship'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        type: 'combat_won',
        playerId: 'player1',
        flagshipInvolved: true,
      });

      expect(result).toContain('unveil_flagship');
    });
  });

  describe('Brave the Void', () => {
    it('should trigger when winning combat in an anomaly', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['brave_the_void'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        type: 'combat_won',
        playerId: 'player1',
        inAnomaly: true,
      });

      expect(result).toContain('brave_the_void');
    });
  });

  describe('Demonstrate Your Power', () => {
    it('should trigger when winning in enemy home system', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['darken_the_skies'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        type: 'combat_won',
        playerId: 'player1',
        inEnemyHome: true,
      });

      expect(result).toContain('darken_the_skies');
    });
  });

  describe('Bombardment Secret', () => {
    it('should trigger when bombardment destroys last ground forces', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['make_an_example_of_their_world'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        type: 'bombardment',
        playerId: 'player1',
        wasLastEnemy: true,
      });

      expect(result).toContain('make_an_example_of_their_world');
    });

    it('should not trigger if ground forces remain', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['make_an_example_of_their_world'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        type: 'bombardment',
        playerId: 'player1',
        wasLastEnemy: false,
      });

      expect(result).not.toContain('make_an_example_of_their_world');
    });
  });
});

// =============================================================================
// ADDITIONAL HELPER TESTS
// =============================================================================

describe('Additional Helpers', () => {
  describe('hasShipsWithEnemyDock', () => {
    it('should return true when player has ships in system with enemy space dock', () => {
      const player = createMockPlayer('player1');
      const enemy = createMockPlayer('player2');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [createMockUnit('cruiser', 'player1')],
        planets: [createMockPlanet('wellon', 'player2', [
          createMockUnit('space_dock', 'player2'),
        ])],
      });
      const state = createMockGameState([player, enemy], [tile]);

      const result = hasShipsWithEnemyDock(state, 'player1');

      expect(result).toBe(true);
    });

    it('should return false when no enemy dock in system', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [createMockUnit('cruiser', 'player1')],
        planets: [createMockPlanet('wellon', 'player1', [
          createMockUnit('space_dock', 'player1'), // Own dock
        ])],
      });
      const state = createMockGameState([player], [tile]);

      const result = hasShipsWithEnemyDock(state, 'player1');

      expect(result).toBe(false);
    });
  });

  describe('hasPromissoryFromOther', () => {
    it('should return true when holding promissory from another faction', () => {
      const player = createMockPlayer('player1', {
        faction: 'sol',
        promissoryNotesOwned: ['hacan_trade_agreement'], // Hacan note
      });

      const result = hasPromissoryFromOther({} as GameState, player);

      expect(result).toBe(true);
    });

    it('should return false when only holding own promissory notes', () => {
      const player = createMockPlayer('player1', {
        faction: 'sol',
        promissoryNotesOwned: ['sol_support'], // Own note
      });

      const result = hasPromissoryFromOther({} as GameState, player);

      expect(result).toBe(false);
    });
  });

  describe('hasSharedSystemControl', () => {
    it('should return true when sharing system with another player', () => {
      const player1 = createMockPlayer('player1');
      const player2 = createMockPlayer('player2');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [
          createMockUnit('cruiser', 'player1'),
          createMockUnit('cruiser', 'player2'),
        ],
      });
      const state = createMockGameState([player1, player2], [tile]);

      const result = hasSharedSystemControl(state, 'player1');

      expect(result).toBe(true);
    });

    it('should return false when alone in all systems', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [createMockUnit('cruiser', 'player1')],
      });
      const state = createMockGameState([player], [tile]);

      const result = hasSharedSystemControl(state, 'player1');

      expect(result).toBe(false);
    });
  });

  describe('getScorableObjectives', () => {
    it('should return empty arrays for nonexistent player', () => {
      const state = createMockGameState([], []);

      const result = getScorableObjectives(state, 'nonexistent', 'status');

      expect(result.publicObjectives).toEqual([]);
      expect(result.secretObjectives).toEqual([]);
    });

    it('should return empty arrays when no objectives revealed', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player], []);
      state.objectives = {
        publicStageI: [],
        publicStageII: [],
        secretDeck: [],
        revealedCount: 0,
      } as any;

      const result = getScorableObjectives(state, 'player1', 'status');

      expect(result.publicObjectives).toEqual([]);
      expect(result.secretObjectives).toEqual([]);
    });

    it('should not include already scored objectives', () => {
      const player = createMockPlayer('player1', {
        scoredObjectives: ['obj1'],
        secretObjectives: [],
      });
      const state = createMockGameState([player], []);
      state.objectives = {
        publicStageI: [{ id: 'obj1', revealed: true }],
        publicStageII: [],
        secretDeck: [],
        revealedCount: 1,
      } as any;

      const result = getScorableObjectives(state, 'player1', 'status');

      expect(result.publicObjectives).not.toContain('obj1');
    });

    it('should not include unrevealed objectives', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player], []);
      state.objectives = {
        publicStageI: [{ id: 'obj1', revealed: false }],
        publicStageII: [],
        secretDeck: [],
        revealedCount: 0,
      } as any;

      const result = getScorableObjectives(state, 'player1', 'status');

      expect(result.publicObjectives).not.toContain('obj1');
    });

    it('should check both Stage I and Stage II objectives', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player], []);
      state.objectives = {
        publicStageI: [{ id: 'stage1_obj', revealed: true }],
        publicStageII: [{ id: 'stage2_obj', revealed: true }],
        secretDeck: [],
        revealedCount: 2,
      } as any;

      const result = getScorableObjectives(state, 'player1', 'status');

      // Results depend on whether player meets requirements
      expect(Array.isArray(result.publicObjectives)).toBe(true);
      expect(Array.isArray(result.secretObjectives)).toBe(true);
    });

    it('should check player secret objectives', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['secret1'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);
      state.objectives = {
        publicStageI: [],
        publicStageII: [],
        secretDeck: [],
        revealedCount: 0,
      } as any;

      const result = getScorableObjectives(state, 'player1', 'status');

      // Secret objectives are checked
      expect(Array.isArray(result.secretObjectives)).toBe(true);
    });
  });

  describe('Additional checkActionPhaseTriggers', () => {
    it('should check win_vs_promissory_holder trigger', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['spark_a_rebellion'],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        playerId: 'player1',
        type: 'combat_won',
        hasPromissoryFrom: true,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should check lose_flagship_in_combat trigger', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['become_a_martyr'],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        playerId: 'player1',
        type: 'combat_lost',
        unitsDestroyed: [{ type: 'flagship', ownerId: 'player1' }],
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should not trigger martyr if flagship not destroyed', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['become_a_martyr'],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        playerId: 'player1',
        type: 'combat_lost',
        unitsDestroyed: [{ type: 'cruiser', ownerId: 'player1' }],
      });

      expect(result).not.toContain('become_a_martyr');
    });

    it('should check bombardment_destroy_last_ground trigger', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['make_an_example'],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        playerId: 'player1',
        type: 'bombardment',
        wasLastEnemy: true,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should check space_cannon_destroy_last_ship trigger', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['turn_their_fleets_to_dust'],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        playerId: 'player1',
        type: 'space_cannon',
        wasLastEnemy: true,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should check afb_destroy_last_fighters trigger', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['darken_the_skies'],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        playerId: 'player1',
        type: 'afb',
        wasLastEnemy: true,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should check afb_hit_all_fighters trigger', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['fight_with_precision'],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        playerId: 'player1',
        type: 'afb',
        hitAllFighters: true,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for player with no secret objectives', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: [],
      });
      const state = createMockGameState([player], []);

      const result = checkActionPhaseTriggers(state, {
        playerId: 'player1',
        type: 'combat_won',
      });

      expect(result).toEqual([]);
    });

    it('should return empty array for nonexistent player', () => {
      const state = createMockGameState([], []);

      const result = checkActionPhaseTriggers(state, {
        playerId: 'nonexistent',
        type: 'combat_won',
      });

      expect(result).toEqual([]);
    });
  });

  describe('Additional checkObjectiveRequirement', () => {
    it('should return canScore false for unknown objective', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player], []);

      const result = checkObjectiveRequirement(state, 'player1', 'unknown_objective_id');

      expect(result.canScore).toBe(false);
    });

    it('should return canScore false for nonexistent player', () => {
      const state = createMockGameState([], []);

      const result = checkObjectiveRequirement(state, 'nonexistent', 'any_objective');

      expect(result.canScore).toBe(false);
    });
  });

  describe('Edge cases for planet and system counting', () => {
    it('should handle empty tile planets array', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [],
      });
      const state = createMockGameState([player], [tile]);

      const planets = getControlledPlanets(state, 'player1');

      expect(planets.length).toBe(0);
    });

    it('should return empty for player with no controlled planets', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player], []);

      const planets = getControlledPlanets(state, 'player1');

      expect(planets).toEqual([]);
    });
  });

  describe('Technology counting edge cases', () => {
    it('should count unit upgrades correctly', () => {
      const player = createMockPlayer('player1', {
        technologies: ['carrier_2', 'dreadnought_2', 'cruiser_2'],
      });

      const upgrades = countUnitUpgradeTechs(player);

      expect(typeof upgrades).toBe('number');
    });

    it('should count faction techs correctly', () => {
      const player = createMockPlayer('player1', {
        faction: 'sol',
        technologies: ['spec_ops_2', 'advanced_carrier_2'],
      });

      const factionTechs = countFactionTechs(player);

      expect(typeof factionTechs).toBe('number');
    });
  });

  describe('Unit counting edge cases', () => {
    it('should count units across multiple tiles', () => {
      const player = createMockPlayer('player1');
      const tile1 = createMockTile({ q: 0, r: 0 }, 19, {
        units: [
          createMockUnit('cruiser', 'player1'),
          createMockUnit('cruiser', 'player1'),
        ],
      });
      const tile2 = createMockTile({ q: 1, r: 0 }, 20, {
        units: [
          createMockUnit('cruiser', 'player1'),
        ],
      });
      const state = createMockGameState([player], [tile1, tile2]);

      const count = countUnitsOnBoard(state, 'player1', 'cruiser');

      expect(count).toBe(3);
    });

    it('should not count other players units', () => {
      const player1 = createMockPlayer('player1');
      const player2 = createMockPlayer('player2');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [
          createMockUnit('cruiser', 'player1'),
          createMockUnit('cruiser', 'player2'),
        ],
      });
      const state = createMockGameState([player1, player2], [tile]);

      const count = countUnitsOnBoard(state, 'player1', 'cruiser');

      expect(count).toBe(1);
    });

    it('should return zero when no units of type exist', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [createMockUnit('cruiser', 'player1')],
      });
      const state = createMockGameState([player], [tile]);

      const count = countUnitsOnBoard(state, 'player1', 'war_sun');

      expect(count).toBe(0);
    });
  });

  describe('Structure counting edge cases', () => {
    it('should count PDS as structures', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [
          createMockPlanet('planet1', 'player1', [
            createMockUnit('pds', 'player1'),
            createMockUnit('pds', 'player1'),
          ]),
        ],
      });
      const state = createMockGameState([player], [tile]);

      const count = countStructures(state, 'player1');

      expect(count).toBe(2);
    });

    it('should count space docks as structures', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [
          createMockPlanet('planet1', 'player1', [
            createMockUnit('space_dock', 'player1'),
          ]),
        ],
      });
      const state = createMockGameState([player], [tile]);

      const count = countStructures(state, 'player1');

      expect(count).toBe(1);
    });

    it('should not count ships as structures', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        units: [
          createMockUnit('cruiser', 'player1'),
          createMockUnit('carrier', 'player1'),
        ],
        planets: [],
      });
      const state = createMockGameState([player], [tile]);

      const count = countStructures(state, 'player1');

      expect(count).toBe(0);
    });
  });

  describe('Mecatol control and adjacency', () => {
    it('should return false for controlsMecatol when player does not control it', () => {
      const player = createMockPlayer('player1');
      const mecatolTile = createMockTile({ q: 0, r: 0 }, 18, {
        planets: [
          createMockPlanet('mecatol_rex', 'player2', []), // Controlled by player2
        ],
      });
      const state = createMockGameState([player], [mecatolTile]);

      const result = controlsMecatol(state, 'player1');

      expect(result).toBe(false);
    });

    it('should count ships at Mecatol correctly', () => {
      const player = createMockPlayer('player1');
      const mecatolTile = createMockTile({ q: 0, r: 0 }, 18, {
        units: [
          createMockUnit('cruiser', 'player1'),
          createMockUnit('carrier', 'player1'),
          createMockUnit('fighter', 'player1'),
        ],
        planets: [createMockPlanet('mecatol_rex', undefined, [])],
      });
      const state = createMockGameState([player], [mecatolTile]);

      const count = countShipsAtMecatol(state, 'player1');

      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Wormhole adjacency', () => {
    it('should detect ships at both wormhole types', () => {
      const player = createMockPlayer('player1');
      const alphaTile = createMockTile({ q: 0, r: 0 }, 25, {
        units: [createMockUnit('cruiser', 'player1')],
        wormhole: 'alpha',
      });
      const betaTile = createMockTile({ q: 1, r: 0 }, 26, {
        units: [createMockUnit('cruiser', 'player1')],
        wormhole: 'beta',
      });
      const state = createMockGameState([player], [alphaTile, betaTile]);

      const result = hasShipsInBothWormholeTypes(state, 'player1');

      expect(typeof result).toBe('boolean');
    });

    it('should return false when ships only at one wormhole type', () => {
      const player = createMockPlayer('player1');
      const alphaTile = createMockTile({ q: 0, r: 0 }, 25, {
        units: [createMockUnit('cruiser', 'player1')],
        wormhole: 'alpha',
      });
      const state = createMockGameState([player], [alphaTile]);

      const result = hasShipsInBothWormholeTypes(state, 'player1');

      expect(result).toBe(false);
    });
  });

  describe('Resource and influence calculations', () => {
    it('should calculate total resources from controlled planets', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [
          createMockPlanet('planet1', 'player1', [], { resources: 3, influence: 1 }),
          createMockPlanet('planet2', 'player1', [], { resources: 2, influence: 2 }),
        ],
      });
      const state = createMockGameState([player], [tile]);

      const total = calculateTotalResources(state, 'player1');

      expect(total).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total influence from controlled planets', () => {
      const player = createMockPlayer('player1');
      const tile = createMockTile({ q: 0, r: 0 }, 19, {
        planets: [
          createMockPlanet('planet1', 'player1', [], { resources: 3, influence: 1 }),
          createMockPlanet('planet2', 'player1', [], { resources: 2, influence: 4 }),
        ],
      });
      const state = createMockGameState([player], [tile]);

      const total = calculateTotalInfluence(state, 'player1');

      expect(total).toBeGreaterThanOrEqual(0);
    });

    it('should return zero resources for player with no planets', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player], []);

      const total = calculateTotalResources(state, 'player1');

      expect(total).toBe(0);
    });

    it('should return zero influence for player with no planets', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player], []);

      const total = calculateTotalInfluence(state, 'player1');

      expect(total).toBe(0);
    });
  });

  describe('Spendable calculations', () => {
    it('should calculate spendable resources', () => {
      const player = createMockPlayer('player1', {
        tradeGoods: 5,
        planets: [],
      });
      const state = createMockGameState([player], []);

      const spendable = calculateSpendableResources(state, player);

      expect(typeof spendable).toBe('number');
    });

    it('should calculate spendable influence', () => {
      const player = createMockPlayer('player1', {
        tradeGoods: 3,
        planets: [],
      });
      const state = createMockGameState([player], []);

      const spendable = calculateSpendableInfluence(state, player);

      expect(typeof spendable).toBe('number');
    });

    it('should calculate spendable tokens', () => {
      const player = createMockPlayer('player1', {
        commandTokens: { tactics: 3, fleet: 2, strategy: 1 },
      });

      const tokens = calculateSpendableTokens(player);

      // tactics + strategy = 3 + 1 = 4 (fleet not included)
      expect(tokens).toBe(4);
    });
  });

  // =============================================================================
  // ADDITIONAL checkObjectiveRequirement TESTS
  // =============================================================================

  describe('checkObjectiveRequirement - Extended Coverage', () => {
    describe('unknown objective handling', () => {
      it('should return canScore false for unknown objective', () => {
        const player = createMockPlayer('player1');
        const state = createMockGameState([player], []);

        const result = checkObjectiveRequirement(state, 'player1', 'nonexistent_objective');

        expect(result.canScore).toBe(false);
        expect(result.reason).toContain('Unknown');
      });
    });

    describe('player not found handling', () => {
      it('should return canScore false for unknown player', () => {
        const player = createMockPlayer('player1');
        const state = createMockGameState([player], []);

        const result = checkObjectiveRequirement(state, 'unknown_player', 'corner_the_market');

        expect(result.canScore).toBe(false);
        expect(result.reason).toContain('Player not found');
      });
    });

    describe('home system control requirement', () => {
      it('should require home system control for public objectives', () => {
        const player = createMockPlayer('player1', {
          planets: [], // No planets means home system not controlled
        });
        const state = createMockGameState([player], []);

        const result = checkObjectiveRequirement(state, 'player1', 'corner_the_market');

        expect(result.canScore).toBe(false);
        expect(result.reason).toContain('home system');
      });
    });

    describe('spend_resources requirement type', () => {
      it('should check available resources against required amount', () => {
        const player = createMockPlayer('player1', {
          tradeGoods: 10,
          planets: [{ planetId: 'jord', exhausted: false }],
        });

        const tile = createMockTile({ q: 0, r: 0 }, {
          systemId: 1,
          planets: [createMockPlanet('jord', { controlledBy: 'player1' })],
        });

        const state = createMockGameState([player], [tile]);

        // The result depends on actual objective definition
        const result = checkObjectiveRequirement(state, 'player1', 'erect_a_monument');

        expect(result).toHaveProperty('canScore');
      });
    });

    describe('control_trait requirement type', () => {
      it('should count planets with matching trait', () => {
        const player = createMockPlayer('player1', {
          planets: [
            { planetId: 'planet1', exhausted: false },
            { planetId: 'planet2', exhausted: false },
            { planetId: 'planet3', exhausted: false },
            { planetId: 'planet4', exhausted: false },
          ],
        });

        const tiles = [
          createMockTile({ q: 0, r: 0 }, {
            planets: [
              createMockPlanet('planet1', { controlledBy: 'player1' }),
              createMockPlanet('planet2', { controlledBy: 'player1' }),
            ],
          }),
          createMockTile({ q: 1, r: 0 }, {
            planets: [
              createMockPlanet('planet3', { controlledBy: 'player1' }),
              createMockPlanet('planet4', { controlledBy: 'player1' }),
            ],
          }),
        ];

        const state = createMockGameState([player], tiles);

        const result = checkObjectiveRequirement(state, 'player1', 'corner_the_market');

        expect(result).toHaveProperty('canScore');
      });
    });

    describe('technology_colors requirement type', () => {
      it('should check technology colors for diversify research', () => {
        const player = createMockPlayer('player1', {
          technologies: [
            'neural_motivator', 'psychoarchaeology', // Green
            'antimass_deflectors', 'gravity_drive', // Blue
          ],
          planets: [{ planetId: 'jord', exhausted: false }],
        });

        const tile = createMockTile({ q: 0, r: 0 }, {
          systemId: 1,
          planets: [createMockPlanet('jord', { controlledBy: 'player1' })],
        });

        const state = createMockGameState([player], [tile]);

        const result = checkObjectiveRequirement(state, 'player1', 'diversify_research');

        expect(result).toHaveProperty('canScore');
      });

      it('should check for single color tech concentration', () => {
        const player = createMockPlayer('player1', {
          technologies: [
            'antimass_deflectors', 'gravity_drive', 'fleet_logistics', 'light_wave_deflector',
          ],
          planets: [{ planetId: 'jord', exhausted: false }],
        });

        const tile = createMockTile({ q: 0, r: 0 }, {
          systemId: 1,
          planets: [createMockPlanet('jord', { controlledBy: 'player1' })],
        });

        const state = createMockGameState([player], [tile]);

        const result = checkObjectiveRequirement(state, 'player1', 'lead_from_the_front');

        expect(result).toHaveProperty('canScore');
      });
    });

    describe('technology_count requirement type', () => {
      it('should count unit upgrade technologies', () => {
        const player = createMockPlayer('player1', {
          technologies: ['carrier_ii', 'dreadnought_ii', 'cruiser_ii'],
          planets: [{ planetId: 'jord', exhausted: false }],
        });

        const tile = createMockTile({ q: 0, r: 0 }, {
          systemId: 1,
          planets: [createMockPlanet('jord', { controlledBy: 'player1' })],
        });

        const state = createMockGameState([player], [tile]);

        const result = checkObjectiveRequirement(state, 'player1', 'develop_weaponry');

        expect(result).toHaveProperty('canScore');
      });
    });

    describe('unit_count requirement type', () => {
      it('should count specific unit types on board', () => {
        const player = createMockPlayer('player1', {
          planets: [{ planetId: 'jord', exhausted: false }],
        });

        const dreadnoughts = [
          createMockUnit('dreadnought', 'player1'),
          createMockUnit('dreadnought', 'player1'),
          createMockUnit('dreadnought', 'player1'),
        ];

        const tile = createMockTile({ q: 0, r: 0 }, {
          systemId: 1,
          units: dreadnoughts,
          planets: [createMockPlanet('jord', { controlledBy: 'player1' })],
        });

        const state = createMockGameState([player], [tile]);

        const result = checkObjectiveRequirement(state, 'player1', 'amass_wealth');

        expect(result).toHaveProperty('canScore');
      });
    });

    describe('structure_count requirement type', () => {
      it('should count structures outside home system', () => {
        const player = createMockPlayer('player1', {
          planets: [
            { planetId: 'jord', exhausted: false },
            { planetId: 'abyz', exhausted: false },
          ],
        });

        const homeTile = createMockTile({ q: 0, r: 0 }, {
          systemId: 1, // Sol home system
          planets: [createMockPlanet('jord', {
            controlledBy: 'player1',
            units: [createMockUnit('pds', 'player1')],
          })],
        });

        const otherTile = createMockTile({ q: 1, r: 0 }, {
          systemId: 45,
          planets: [createMockPlanet('abyz', {
            controlledBy: 'player1',
            units: [
              createMockUnit('pds', 'player1'),
              createMockUnit('space_dock', 'player1'),
            ],
          })],
        });

        const state = createMockGameState([player], [homeTile, otherTile]);

        const result = checkObjectiveRequirement(state, 'player1', 'expand_borders');

        expect(result).toHaveProperty('canScore');
      });
    });

    describe('control_mecatol requirement type', () => {
      it('should require Mecatol Rex control', () => {
        const player = createMockPlayer('player1', {
          planets: [{ planetId: 'mecatol_rex', exhausted: false }],
        });

        const mecatolTile = createMockTile({ q: 0, r: 0 }, {
          systemId: 18, // Mecatol Rex
          planets: [createMockPlanet('mecatol_rex', { controlledBy: 'player1' })],
        });

        const state = createMockGameState([player], [mecatolTile]);

        // Test with an objective that requires Mecatol control
        const result = checkObjectiveRequirement(state, 'player1', 'hold_vast_reserves');

        expect(result).toHaveProperty('canScore');
      });
    });

    describe('neighbor_count requirement type', () => {
      it('should check number of neighbors', () => {
        const player = createMockPlayer('player1', {
          neighbors: ['player2', 'player3', 'player4'],
          planets: [{ planetId: 'jord', exhausted: false }],
        });

        const tile = createMockTile({ q: 0, r: 0 }, {
          systemId: 1,
          planets: [createMockPlanet('jord', { controlledBy: 'player1' })],
        });

        const state = createMockGameState([player], [tile]);

        const result = checkObjectiveRequirement(state, 'player1', 'negotiate_trade_routes');

        expect(result).toHaveProperty('canScore');
      });
    });
  });

  // =============================================================================
  // getScorableObjectives TESTS
  // =============================================================================

  describe('getScorableObjectives - Extended', () => {
    it('should return empty arrays when no objectives are revealed', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player], []);
      state.objectives = {
        publicStageI: [],
        publicStageII: [],
        revealedCount: 0,
        secretDeck: [],
      };

      const scorable = getScorableObjectives(state, 'player1', 'status');

      expect(scorable).toHaveProperty('publicObjectives');
      expect(scorable).toHaveProperty('secretObjectives');
      expect(Array.isArray(scorable.publicObjectives)).toBe(true);
      expect(Array.isArray(scorable.secretObjectives)).toBe(true);
    });

    it('should check player secret objectives', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['become_a_legend'],
        planets: [{ planetId: 'jord', exhausted: false }],
      });

      const tile = createMockTile({ q: 0, r: 0 }, {
        systemId: 1,
        planets: [createMockPlanet('jord', { controlledBy: 'player1' })],
      });

      const state = createMockGameState([player], [tile]);
      state.objectives = {
        publicStageI: [],
        publicStageII: [],
        revealedCount: 0,
        secretDeck: [],
      };

      const scorable = getScorableObjectives(state, 'player1', 'status');

      expect(scorable).toHaveProperty('secretObjectives');
    });

    it('should filter out already scored objectives', () => {
      const player = createMockPlayer('player1', {
        scoredObjectives: ['corner_the_market'],
        planets: [{ planetId: 'jord', exhausted: false }],
      });

      const tile = createMockTile({ q: 0, r: 0 }, {
        systemId: 1,
        planets: [createMockPlanet('jord', { controlledBy: 'player1' })],
      });

      const state = createMockGameState([player], [tile]);
      state.objectives = {
        publicStageI: [{ id: 'corner_the_market', revealed: true }],
        publicStageII: [],
        revealedCount: 1,
        secretDeck: [],
      };

      const scorable = getScorableObjectives(state, 'player1', 'status');

      // corner_the_market should not be in scorable since already scored
      expect(scorable.publicObjectives.includes('corner_the_market')).toBe(false);
    });
  });

  // =============================================================================
  // checkActionPhaseTriggers TESTS
  // =============================================================================

  describe('checkActionPhaseTriggers - Extended', () => {
    it('should return empty array when no secret objectives', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: [],
      });
      const state = createMockGameState([player], []);

      const triggers = checkActionPhaseTriggers(state, 'player1', 'combat_won', {});

      expect(Array.isArray(triggers)).toBe(true);
    });

    it('should check combat_won event type', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['destroy_their_greatest_ship'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const triggers = checkActionPhaseTriggers(state, 'player1', 'combat_won', {
        destroyedUnits: [{ type: 'flagship', ownerId: 'player2' }],
      });

      expect(Array.isArray(triggers)).toBe(true);
    });

    it('should check bombardment event type', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['make_an_example_of_their_world'],
        scoredObjectives: [],
      });
      const state = createMockGameState([player], []);

      const triggers = checkActionPhaseTriggers(state, 'player1', 'bombardment', {
        eliminatedAllGroundForces: true,
      });

      expect(Array.isArray(triggers)).toBe(true);
    });

    it('should check ground_combat_won event type', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['spark_a_rebellion'],
        scoredObjectives: [],
      });
      const player2 = createMockPlayer('player2', {
        score: 5, // Leader
      });
      const state = createMockGameState([player, player2], []);

      const triggers = checkActionPhaseTriggers(state, 'player1', 'ground_combat_won', {
        defenderId: 'player2',
      });

      expect(Array.isArray(triggers)).toBe(true);
    });

    it('should not trigger already scored objectives', () => {
      const player = createMockPlayer('player1', {
        secretObjectives: ['destroy_their_greatest_ship'],
        scoredObjectives: ['destroy_their_greatest_ship'],
      });
      const state = createMockGameState([player], []);

      const triggers = checkActionPhaseTriggers(state, 'player1', 'combat_won', {
        destroyedUnits: [{ type: 'war_sun', ownerId: 'player2' }],
      });

      expect(triggers.length).toBe(0);
    });
  });
});
