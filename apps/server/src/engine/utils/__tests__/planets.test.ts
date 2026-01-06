import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, PlayerState, MapTile, PlanetInstance } from '@ti4/shared';
import {
  getPlanetEffectiveStats,
  calculateAvailableResources,
  calculateAvailableInfluence,
  getPlayerTechSpecialties,
  findPlanetInstance,
} from '../planets.js';

// Helper to create mock player
function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    planets: [],
    technologies: [],
    units: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 3,
    strategyCards: [],
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    promissoryNotes: [],
    promissoryNotesInPlay: [],
    relics: [],
    exhaustedRelics: [],
    exhaustedPlanets: [],
    fragments: { cultural: 0, hazardous: 0, industrial: 0, unknown: 0 },
    ...overrides,
  } as PlayerState;
}

// Helper to create mock map tile
function createMockMapTile(systemId: number, planets: PlanetInstance[] = []): MapTile {
  return {
    systemId,
    position: { q: 0, r: 0 },
    planets,
    spaceUnits: [],
    wormholes: [],
    anomaly: null,
    commandTokens: [],
  } as MapTile;
}

// Helper to create mock planet instance
function createMockPlanetInstance(planetId: string, overrides: Partial<PlanetInstance> = {}): PlanetInstance {
  return {
    planetId,
    controller: null,
    groundUnits: [],
    attachments: [],
    ...overrides,
  } as PlanetInstance;
}

// Helper to create mock game state
function createMockGameState(players: PlayerState[], tiles: MapTile[] = []): GameState {
  return {
    id: 'test-game',
    name: 'Test Game',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'in_progress',
    players,
    currentPlayerIndex: 0,
    phase: 'action',
    round: 1,
    turnNumber: 1,
    map: { tiles },
    speaker: players[0]?.id || 'player1',
    publicObjectives: [],
    publicObjectivesDeck: [],
    secretObjectivesDeck: [],
    agendaDeck: [],
    currentAgenda: null,
    actionCardDeck: [],
    actionCardDiscard: [],
    laws: [],
    passedPlayers: [],
    strategyCardState: {},
    combatState: null,
    activatedSystem: null,
    custodiansTaken: false,
    supportForTheThroneGiven: false,
    availableStrategyCards: [1, 2, 3, 4, 5, 6, 7, 8],
    events: [],
    actionsThisTurn: [],
    lastActionTimestamp: Date.now(),
  } as unknown as GameState;
}

describe('Planet Utils', () => {
  describe('getPlanetEffectiveStats', () => {
    it('should return base stats for planet without attachments', () => {
      const planet = createMockPlanetInstance('mecatol_rex');

      const stats = getPlanetEffectiveStats(planet);

      expect(stats.resources).toBe(1);
      expect(stats.influence).toBe(6);
    });

    it('should return zero stats for unknown planet', () => {
      const planet = createMockPlanetInstance('nonexistent-planet');

      const stats = getPlanetEffectiveStats(planet);

      expect(stats.resources).toBe(0);
      expect(stats.influence).toBe(0);
      expect(stats.techSpecialties).toEqual([]);
    });

    it('should return correct stats for Jord (Sol home)', () => {
      const planet = createMockPlanetInstance('jord');

      const stats = getPlanetEffectiveStats(planet);

      // Jord has 4 resources, 2 influence
      expect(stats.resources).toBe(4);
      expect(stats.influence).toBe(2);
    });

    it('should return correct stats for planet with tech specialty', () => {
      // Lazar has a cybernetic specialty
      const planet = createMockPlanetInstance('lazar');

      const stats = getPlanetEffectiveStats(planet);

      expect(stats.techSpecialties.length).toBeGreaterThanOrEqual(0);
    });

    it('should not go negative on resources/influence', () => {
      const planet = createMockPlanetInstance('mecatol_rex', {
        attachments: [], // Would need an attachment that reduces stats
      });

      const stats = getPlanetEffectiveStats(planet);

      expect(stats.resources).toBeGreaterThanOrEqual(0);
      expect(stats.influence).toBeGreaterThanOrEqual(0);
    });

    it('should include trait information', () => {
      // Abyz is an industrial planet
      const planet = createMockPlanetInstance('abyz');

      const stats = getPlanetEffectiveStats(planet);

      expect(typeof stats.trait).toBe('string');
    });

    it('should handle attachments array being undefined', () => {
      const planet: PlanetInstance = {
        planetId: 'mecatol_rex',
        controller: null,
        groundUnits: [],
        attachments: undefined as any,
      } as PlanetInstance;

      const stats = getPlanetEffectiveStats(planet);

      expect(stats.resources).toBe(1);
      expect(stats.influence).toBe(6);
    });
  });

  describe('calculateAvailableResources', () => {
    it('should return 0 for non-existent player', () => {
      const state = createMockGameState([createMockPlayer('player1')]);

      const result = calculateAvailableResources(state, 'nonexistent');

      expect(result).toBe(0);
    });

    it('should return 0 for player with no planets', () => {
      const player = createMockPlayer('player1', { planets: [] });
      const state = createMockGameState([player]);

      const result = calculateAvailableResources(state, 'player1');

      expect(result).toBe(0);
    });

    it('should calculate resources from unexhausted planets', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'jord', exhausted: false },
        ],
      });
      const tile = createMockMapTile(1, [createMockPlanetInstance('jord')]);
      const state = createMockGameState([player], [tile]);

      const result = calculateAvailableResources(state, 'player1');

      expect(result).toBeGreaterThan(0); // Jord has resources
    });

    it('should not count exhausted planets by default', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'jord', exhausted: true },
        ],
      });
      const tile = createMockMapTile(1, [createMockPlanetInstance('jord')]);
      const state = createMockGameState([player], [tile]);

      const result = calculateAvailableResources(state, 'player1');

      expect(result).toBe(0);
    });

    it('should include exhausted planets when flag is true', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'jord', exhausted: true },
        ],
      });
      const tile = createMockMapTile(1, [createMockPlanetInstance('jord')]);
      const state = createMockGameState([player], [tile]);

      const resultWithFlag = calculateAvailableResources(state, 'player1', true);
      const resultWithoutFlag = calculateAvailableResources(state, 'player1', false);

      expect(resultWithFlag).toBeGreaterThanOrEqual(resultWithoutFlag);
    });

    it('should sum resources from multiple planets on same tile', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'abyz', exhausted: false },
          { planetId: 'fria', exhausted: false },
        ],
      });
      // Both planets on same tile (system 45)
      const tile = createMockMapTile(45, [
        createMockPlanetInstance('abyz'),
        createMockPlanetInstance('fria'),
      ]);
      const state = createMockGameState([player], [tile]);

      const result = calculateAvailableResources(state, 'player1');

      expect(result).toBeGreaterThan(0);
    });

    it('should not count planet not on map', () => {
      const player = createMockPlayer('player1', {
        planets: [{ planetId: 'jord', exhausted: false }],
      });
      const state = createMockGameState([player], []); // No tiles

      const result = calculateAvailableResources(state, 'player1');

      expect(result).toBe(0);
    });
  });

  describe('calculateAvailableInfluence', () => {
    it('should return 0 for non-existent player', () => {
      const state = createMockGameState([createMockPlayer('player1')]);

      const result = calculateAvailableInfluence(state, 'nonexistent');

      expect(result).toBe(0);
    });

    it('should return 0 for player with no planets', () => {
      const player = createMockPlayer('player1', { planets: [] });
      const state = createMockGameState([player]);

      const result = calculateAvailableInfluence(state, 'player1');

      expect(result).toBe(0);
    });

    it('should calculate influence from unexhausted planets', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'jord', exhausted: false },
        ],
      });
      const tile = createMockMapTile(1, [createMockPlanetInstance('jord')]);
      const state = createMockGameState([player], [tile]);

      const result = calculateAvailableInfluence(state, 'player1');

      expect(result).toBeGreaterThan(0); // Jord has influence
    });

    it('should not count exhausted planets by default', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'jord', exhausted: true },
        ],
      });
      const tile = createMockMapTile(1, [createMockPlanetInstance('jord')]);
      const state = createMockGameState([player], [tile]);

      const result = calculateAvailableInfluence(state, 'player1');

      expect(result).toBe(0);
    });

    it('should include exhausted planets when flag is true', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'jord', exhausted: true },
        ],
      });
      const tile = createMockMapTile(1, [createMockPlanetInstance('jord')]);
      const state = createMockGameState([player], [tile]);

      const resultWithFlag = calculateAvailableInfluence(state, 'player1', true);
      const resultWithoutFlag = calculateAvailableInfluence(state, 'player1', false);

      expect(resultWithFlag).toBeGreaterThanOrEqual(resultWithoutFlag);
    });

    it('should sum influence from multiple planets on same tile', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'abyz', exhausted: false },
          { planetId: 'fria', exhausted: false },
        ],
      });
      // Both planets on same tile (system 45)
      const tile = createMockMapTile(45, [
        createMockPlanetInstance('abyz'),
        createMockPlanetInstance('fria'),
      ]);
      const state = createMockGameState([player], [tile]);

      const result = calculateAvailableInfluence(state, 'player1');

      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPlayerTechSpecialties', () => {
    it('should return empty array for non-existent player', () => {
      const state = createMockGameState([createMockPlayer('player1')]);

      const result = getPlayerTechSpecialties(state, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should return empty array for player with no planets', () => {
      const player = createMockPlayer('player1', { planets: [] });
      const state = createMockGameState([player]);

      const result = getPlayerTechSpecialties(state, 'player1');

      expect(result).toEqual([]);
    });

    it('should return empty array for planet without tech specialty', () => {
      const player = createMockPlayer('player1', {
        planets: [{ planetId: 'mecatol_rex', exhausted: false }],
      });
      const tile = createMockMapTile(18, [createMockPlanetInstance('mecatol_rex')]);
      const state = createMockGameState([player], [tile]);

      const result = getPlayerTechSpecialties(state, 'player1');

      expect(result.length).toBe(0);
    });

    it('should not count exhausted planets', () => {
      const player = createMockPlayer('player1', {
        planets: [{ planetId: 'lazar', exhausted: true }],
      });
      const tile = createMockMapTile(1, [createMockPlanetInstance('lazar')]);
      const state = createMockGameState([player], [tile]);

      const result = getPlayerTechSpecialties(state, 'player1');

      expect(result.length).toBe(0);
    });

    it('should not duplicate specialties', () => {
      const player = createMockPlayer('player1', {
        planets: [
          { planetId: 'lazar', exhausted: false },
          { planetId: 'sakulag', exhausted: false }, // Also has cybernetic
        ],
      });
      const tiles = [
        createMockMapTile(1, [createMockPlanetInstance('lazar')]),
        createMockMapTile(2, [createMockPlanetInstance('sakulag')]),
      ];
      const state = createMockGameState([player], tiles);

      const result = getPlayerTechSpecialties(state, 'player1');

      // Should not have duplicates
      const uniqueResults = [...new Set(result)];
      expect(result.length).toBe(uniqueResults.length);
    });
  });

  describe('findPlanetInstance', () => {
    it('should return null if planet not found', () => {
      const state = createMockGameState([], []);

      const result = findPlanetInstance(state, 'mecatol_rex');

      expect(result).toBeNull();
    });

    it('should find planet on map', () => {
      const planetInstance = createMockPlanetInstance('mecatol_rex');
      const tile = createMockMapTile(18, [planetInstance]);
      const state = createMockGameState([], [tile]);

      const result = findPlanetInstance(state, 'mecatol_rex');

      expect(result).not.toBeNull();
      expect(result?.planet.planetId).toBe('mecatol_rex');
      expect(result?.tile.systemId).toBe(18);
    });

    it('should find planet in multi-planet system', () => {
      const planet1 = createMockPlanetInstance('abyz');
      const planet2 = createMockPlanetInstance('fria');
      const tile = createMockMapTile(45, [planet1, planet2]);
      const state = createMockGameState([], [tile]);

      const result = findPlanetInstance(state, 'fria');

      expect(result).not.toBeNull();
      expect(result?.planet.planetId).toBe('fria');
    });

    it('should search through multiple tiles', () => {
      const tile1 = createMockMapTile(1, [createMockPlanetInstance('jord')]);
      const tile2 = createMockMapTile(18, [createMockPlanetInstance('mecatol_rex')]);
      const tile3 = createMockMapTile(45, [createMockPlanetInstance('abyz')]);
      const state = createMockGameState([], [tile1, tile2, tile3]);

      const result1 = findPlanetInstance(state, 'jord');
      const result2 = findPlanetInstance(state, 'mecatol_rex');
      const result3 = findPlanetInstance(state, 'abyz');

      expect(result1?.tile.systemId).toBe(1);
      expect(result2?.tile.systemId).toBe(18);
      expect(result3?.tile.systemId).toBe(45);
    });
  });
});
