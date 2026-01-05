import { describe, it, expect } from 'vitest';
import {
  areSystemsAdjacent,
  getMovementModifiers,
  getAdjacentSystems,
} from '../movement-modifiers.js';
import type { GameState, MapTile, HexCoord, PlayerState, MapState } from '@ti4/shared';

function createMockTile(position: HexCoord, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId: 1,
    position,
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

function createMockGameState(tiles: MapTile[], players: PlayerState[] = []): GameState {
  return {
    id: 'game1',
    version: 1,
    round: 1,
    phase: 'action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: [],
    players: players.length > 0 ? players : [createMockPlayer()],
    map: { tiles, playerCount: 6 } as MapState,
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

describe('Movement Modifiers', () => {
  describe('areSystemsAdjacent - Standard Adjacency', () => {
    it('should return true for hex-adjacent systems', () => {
      const fromTile = createMockTile({ q: 0, r: 0 });
      const toTile = createMockTile({ q: 1, r: 0 });
      const state = createMockGameState([fromTile, toTile]);

      expect(areSystemsAdjacent(state, 'player1', fromTile, toTile)).toBe(true);
    });

    it('should return false for non-adjacent systems', () => {
      const fromTile = createMockTile({ q: 0, r: 0 });
      const toTile = createMockTile({ q: 2, r: 0 });
      const state = createMockGameState([fromTile, toTile]);

      expect(areSystemsAdjacent(state, 'player1', fromTile, toTile)).toBe(false);
    });
  });

  describe('areSystemsAdjacent - Wormhole Adjacency', () => {
    it('should return true for systems connected by same wormhole type', () => {
      const fromTile = createMockTile({ q: 0, r: 0 }, { wormhole: 'alpha' });
      const toTile = createMockTile({ q: 5, r: 0 }, { wormhole: 'alpha' });
      const state = createMockGameState([fromTile, toTile]);

      expect(areSystemsAdjacent(state, 'player1', fromTile, toTile)).toBe(true);
    });

    it('should return false for systems with different wormhole types', () => {
      const fromTile = createMockTile({ q: 0, r: 0 }, { wormhole: 'alpha' });
      const toTile = createMockTile({ q: 5, r: 0 }, { wormhole: 'beta' });
      const state = createMockGameState([fromTile, toTile]);

      expect(areSystemsAdjacent(state, 'player1', fromTile, toTile)).toBe(false);
    });

    it('should treat alpha and beta as adjacent for Creuss', () => {
      const fromTile = createMockTile({ q: 0, r: 0 }, { wormhole: 'alpha' });
      const toTile = createMockTile({ q: 5, r: 0 }, { wormhole: 'beta' });
      const creussPlayer = createMockPlayer({ id: 'player1', faction: 'creuss' });
      const state = createMockGameState([fromTile, toTile], [creussPlayer]);

      expect(areSystemsAdjacent(state, 'player1', fromTile, toTile)).toBe(true);
    });
  });

  describe('areSystemsAdjacent - Hyperlane Adjacency', () => {
    it('should return true for systems connected through a straight hyperlane', () => {
      // Hyperlane tile 83 has connection [0, 3] (top to bottom)
      // Position the tiles so that one is at edge 0 (top) and one at edge 3 (bottom)
      const hyperlaneTile = createMockTile(
        { q: 0, r: 0 },
        { systemId: 83, rotation: 0 }
      );
      // Edge 0 (top) connects to position { q: 0, r: -1 }
      const topTile = createMockTile(
        { q: 0, r: -1 },
        { systemId: 10 } // Regular system
      );
      // Edge 3 (bottom) connects to position { q: 0, r: 1 }
      const bottomTile = createMockTile(
        { q: 0, r: 1 },
        { systemId: 11 } // Regular system
      );

      const state = createMockGameState([hyperlaneTile, topTile, bottomTile]);

      // Systems on opposite sides of the hyperlane should be adjacent
      expect(areSystemsAdjacent(state, 'player1', topTile, bottomTile)).toBe(true);
    });

    it('should return false for non-connected edges through hyperlane', () => {
      // Hyperlane tile 83 has connection [0, 3] (top to bottom)
      // Edge 1 (top-right) is not connected to edge 3 (bottom)
      const hyperlaneTile = createMockTile(
        { q: 0, r: 0 },
        { systemId: 83, rotation: 0 }
      );
      // Edge 1 (top-right) connects to position { q: 1, r: -1 }
      const topRightTile = createMockTile(
        { q: 1, r: -1 },
        { systemId: 10 }
      );
      // Edge 3 (bottom) connects to position { q: 0, r: 1 }
      const bottomTile = createMockTile(
        { q: 0, r: 1 },
        { systemId: 11 }
      );

      const state = createMockGameState([hyperlaneTile, topRightTile, bottomTile]);

      // Edge 1 is not connected to edge 3 on tile 83
      expect(areSystemsAdjacent(state, 'player1', topRightTile, bottomTile)).toBe(false);
    });

    it('should handle hyperlane tile rotation', () => {
      // Hyperlane tile 83 has connection [0, 3] at rotation 0
      // With rotation 1, this becomes [1, 4]
      const hyperlaneTile = createMockTile(
        { q: 0, r: 0 },
        { systemId: 83, rotation: 1 }
      );
      // With rotation 1, edge 1 (top-right) now connects through the hyperlane
      const topRightTile = createMockTile(
        { q: 1, r: -1 },
        { systemId: 10 }
      );
      // Edge 4 (bottom-left) connects to position { q: -1, r: 1 }
      const bottomLeftTile = createMockTile(
        { q: -1, r: 1 },
        { systemId: 11 }
      );

      const state = createMockGameState([hyperlaneTile, topRightTile, bottomLeftTile]);

      // With rotation 1, edges 1 and 4 should now be connected
      expect(areSystemsAdjacent(state, 'player1', topRightTile, bottomLeftTile)).toBe(true);
    });

    it('should handle Y-junction hyperlane (tile 83B)', () => {
      // Tile 83B has connections [[0, 2], [0, 3], [3, 5]] - bent Y-shape
      // Edge 0 connects to edges 2 and 3, edge 3 connects to edge 5
      const hyperlaneTile = createMockTile(
        { q: 0, r: 0 },
        { systemId: 83, rotation: 0, hyperlaneSide: 'B' as const }
      );
      // Edge 0 (top) connects to position { q: 0, r: -1 }
      const topTile = createMockTile({ q: 0, r: -1 }, { systemId: 10 });
      // Edge 2 (bottom-right/east) connects to position { q: 1, r: 0 }
      const eastTile = createMockTile({ q: 1, r: 0 }, { systemId: 11 });
      // Edge 3 (bottom) connects to position { q: 0, r: 1 }
      const bottomTile = createMockTile({ q: 0, r: 1 }, { systemId: 12 });
      // Edge 5 (top-left/west) connects to position { q: -1, r: 0 }
      const westTile = createMockTile({ q: -1, r: 0 }, { systemId: 13 });

      const state = createMockGameState([hyperlaneTile, topTile, eastTile, bottomTile, westTile]);

      // Edge 0 connects to edges 2 and 3
      expect(areSystemsAdjacent(state, 'player1', topTile, eastTile)).toBe(true);
      expect(areSystemsAdjacent(state, 'player1', topTile, bottomTile)).toBe(true);

      // Edge 3 connects to edge 5
      expect(areSystemsAdjacent(state, 'player1', bottomTile, westTile)).toBe(true);

      // Edges 2 and 5 are NOT connected (convergence rule - both fan from separate points)
      expect(areSystemsAdjacent(state, 'player1', eastTile, westTile)).toBe(false);
    });

    it('should not create adjacency through a non-hyperlane tile', () => {
      // Regular tile, even if adjacent to both systems
      const regularTile = createMockTile(
        { q: 0, r: 0 },
        { systemId: 18 } // Regular blue tile
      );
      const topTile = createMockTile({ q: 0, r: -1 }, { systemId: 10 });
      const bottomTile = createMockTile({ q: 0, r: 1 }, { systemId: 11 });

      const state = createMockGameState([regularTile, topTile, bottomTile]);

      // Regular tiles don't create hyperlane adjacency
      expect(areSystemsAdjacent(state, 'player1', topTile, bottomTile)).toBe(false);
    });

    it('should handle diagonal hyperlane (tile 86A: edge 0 to edge 2)', () => {
      // Tile 86A connects edge 0 to edge 2 (diagonal)
      const hyperlaneTile = createMockTile(
        { q: 0, r: 0 },
        { systemId: 86, rotation: 0 }
      );
      const topTile = createMockTile({ q: 0, r: -1 }, { systemId: 10 });         // Edge 0
      const bottomRightTile = createMockTile({ q: 1, r: 0 }, { systemId: 12 });  // Edge 2
      const bottomTile = createMockTile({ q: 0, r: 1 }, { systemId: 13 });       // Edge 3

      const state = createMockGameState([
        hyperlaneTile, topTile, bottomRightTile, bottomTile
      ]);

      // Edge 0 connects to edge 2 via hyperlane
      expect(areSystemsAdjacent(state, 'player1', topTile, bottomRightTile)).toBe(true);

      // Edge 0 does NOT connect to edge 3 (not part of the connection)
      expect(areSystemsAdjacent(state, 'player1', topTile, bottomTile)).toBe(false);
    });

    it('should handle fan hyperlane (tile 87A: edge 0 to edges 2,3,4)', () => {
      // Tile 87A is a fan connecting edge 0 to edges 2, 3, and 4
      // IMPORTANT: Edges 2, 3, and 4 are NOT connected to each other (convergence rule)
      const hyperlaneTile = createMockTile(
        { q: 0, r: 0 },
        { systemId: 87, rotation: 0 }
      );
      const topTile = createMockTile({ q: 0, r: -1 }, { systemId: 10 });         // Edge 0
      const bottomRightTile = createMockTile({ q: 1, r: 0 }, { systemId: 12 });  // Edge 2
      const bottomTile = createMockTile({ q: 0, r: 1 }, { systemId: 13 });       // Edge 3
      const bottomLeftTile = createMockTile({ q: -1, r: 1 }, { systemId: 14 });  // Edge 4

      const state = createMockGameState([
        hyperlaneTile, topTile, bottomRightTile, bottomTile, bottomLeftTile
      ]);

      // Edge 0 connects to edges 2, 3, and 4
      expect(areSystemsAdjacent(state, 'player1', topTile, bottomRightTile)).toBe(true);
      expect(areSystemsAdjacent(state, 'player1', topTile, bottomTile)).toBe(true);
      expect(areSystemsAdjacent(state, 'player1', topTile, bottomLeftTile)).toBe(true);

      // Edges 2, 3, and 4 are NOT connected to each other (convergence rule)
      // Note: bottomRightTile and bottomTile are hex-adjacent so that's true anyway
      // But bottomRightTile and bottomLeftTile are not hex-adjacent
      expect(areSystemsAdjacent(state, 'player1', bottomRightTile, bottomLeftTile)).toBe(false);
    });
  });

  describe('getMovementModifiers', () => {
    it('should return default modifiers for unknown faction', () => {
      const tile = createMockTile({ q: 0, r: 0 });
      const player = createMockPlayer({ faction: 'unknown' });
      const state = createMockGameState([tile], [player]);

      const modifiers = getMovementModifiers(state, 'player1', tile);

      expect(modifiers.movementBonus).toBe(0);
      expect(modifiers.canMoveThroughEnemies).toBe(false);
      expect(modifiers.immuneToAnomalies).toEqual([]);
    });

    it('should give Creuss +1 movement from wormhole system', () => {
      const wormholeTile = createMockTile({ q: 0, r: 0 }, { wormhole: 'alpha' });
      const player = createMockPlayer({ faction: 'creuss' });
      const state = createMockGameState([wormholeTile], [player]);

      const modifiers = getMovementModifiers(state, 'player1', wormholeTile);

      expect(modifiers.movementBonus).toBe(1);
    });

    it('should give Muaat supernova immunity', () => {
      const tile = createMockTile({ q: 0, r: 0 });
      const player = createMockPlayer({ faction: 'muaat' });
      const state = createMockGameState([tile], [player]);

      const modifiers = getMovementModifiers(state, 'player1', tile);

      expect(modifiers.immuneToAnomalies).toContain('supernova');
    });

    it('should give Empyrean nebula immunity', () => {
      const tile = createMockTile({ q: 0, r: 0 });
      const player = createMockPlayer({ faction: 'empyrean' });
      const state = createMockGameState([tile], [player]);

      const modifiers = getMovementModifiers(state, 'player1', tile);

      expect(modifiers.immuneToAnomalies).toContain('nebula');
    });

    it('should give asteroid immunity with Antimass Deflectors', () => {
      const tile = createMockTile({ q: 0, r: 0 });
      const player = createMockPlayer({
        technologies: ['antimass_deflectors'],
      });
      const state = createMockGameState([tile], [player]);

      const modifiers = getMovementModifiers(state, 'player1', tile);

      expect(modifiers.immuneToAnomalies).toContain('asteroid');
    });

    it('should allow passing through enemies with Light/Wave Deflector', () => {
      const tile = createMockTile({ q: 0, r: 0 });
      const player = createMockPlayer({
        technologies: ['light_wave_deflector'],
      });
      const state = createMockGameState([tile], [player]);

      const modifiers = getMovementModifiers(state, 'player1', tile);

      expect(modifiers.canMoveThroughEnemies).toBe(true);
    });

    it('should give +1 movement with Gravity Drive', () => {
      const tile = createMockTile({ q: 0, r: 0 });
      const player = createMockPlayer({
        technologies: ['gravity_drive'],
      });
      const state = createMockGameState([tile], [player]);

      const modifiers = getMovementModifiers(state, 'player1', tile);

      expect(modifiers.movementBonus).toBe(1);
    });
  });

  describe('getAdjacentSystems', () => {
    it('should include all hex-adjacent systems', () => {
      const centerTile = createMockTile({ q: 0, r: 0 }, { systemId: 1 });
      const eastTile = createMockTile({ q: 1, r: 0 }, { systemId: 2 });
      const westTile = createMockTile({ q: -1, r: 0 }, { systemId: 3 });
      const farTile = createMockTile({ q: 3, r: 0 }, { systemId: 4 });

      const state = createMockGameState([centerTile, eastTile, westTile, farTile]);

      const adjacent = getAdjacentSystems(state, 'player1', centerTile);

      expect(adjacent).toHaveLength(2);
      expect(adjacent).toContainEqual(eastTile);
      expect(adjacent).toContainEqual(westTile);
      expect(adjacent).not.toContainEqual(farTile);
    });

    it('should include systems connected through hyperlane', () => {
      const hyperlaneTile = createMockTile(
        { q: 0, r: 0 },
        { systemId: 83, rotation: 0 }
      );
      const topTile = createMockTile({ q: 0, r: -1 }, { systemId: 10 });
      const bottomTile = createMockTile({ q: 0, r: 1 }, { systemId: 11 });

      const state = createMockGameState([hyperlaneTile, topTile, bottomTile]);

      const adjacentToTop = getAdjacentSystems(state, 'player1', topTile);

      // Should include bottom tile via hyperlane, and hyperlane tile itself (via hex adjacency)
      expect(adjacentToTop.some(t => t.systemId === 11)).toBe(true);
    });
  });

  describe('7-8 Player Hyperlane Scenarios', () => {
    it('should handle multiple hyperlane tiles in a map', () => {
      // Simulate two adjacent hyperlane tiles (like in 7-8 player maps)
      // Tile 83A at (0,0) with straight line [0,3]
      // Tile 84A at (1,0) with straight line [0,3]
      const hyperlane83 = createMockTile(
        { q: 0, r: 0 },
        { systemId: 83, rotation: 0 }
      );
      const hyperlane84 = createMockTile(
        { q: 1, r: 0 },
        { systemId: 84, rotation: 0 }
      );

      // Systems adjacent to hyperlane 83
      const system1 = createMockTile({ q: 0, r: -1 }, { systemId: 10 }); // Top of 83
      const system2 = createMockTile({ q: 0, r: 1 }, { systemId: 11 });  // Bottom of 83

      // Systems adjacent to hyperlane 84
      const system3 = createMockTile({ q: 1, r: -1 }, { systemId: 12 }); // Top of 84
      const system4 = createMockTile({ q: 1, r: 1 }, { systemId: 13 });  // Bottom of 84

      const state = createMockGameState([
        hyperlane83, hyperlane84, system1, system2, system3, system4
      ]);

      // Systems connected through hyperlane 83
      expect(areSystemsAdjacent(state, 'player1', system1, system2)).toBe(true);

      // Systems connected through hyperlane 84
      expect(areSystemsAdjacent(state, 'player1', system3, system4)).toBe(true);

      // Systems NOT connected across different hyperlanes (no path between them)
      expect(areSystemsAdjacent(state, 'player1', system1, system4)).toBe(false);
      expect(areSystemsAdjacent(state, 'player1', system2, system3)).toBe(false);
    });

    it('should use B-side connections when hyperlaneSide is B', () => {
      // Tile 87A has fan pattern [[0,2], [0,3], [0,4]]
      // Tile 87B has narrower fan [[0,2], [0,3]]
      const hyperlane87B = createMockTile(
        { q: 0, r: 0 },
        { systemId: 87, rotation: 0, hyperlaneSide: 'B' as const }
      );

      const topTile = createMockTile({ q: 0, r: -1 }, { systemId: 10 });         // Edge 0
      const eastTile = createMockTile({ q: 1, r: 0 }, { systemId: 11 });         // Edge 2
      const bottomTile = createMockTile({ q: 0, r: 1 }, { systemId: 12 });       // Edge 3
      const bottomLeftTile = createMockTile({ q: -1, r: 1 }, { systemId: 13 });  // Edge 4

      const state = createMockGameState([
        hyperlane87B, topTile, eastTile, bottomTile, bottomLeftTile
      ]);

      // B-side: Edge 0 connects to edges 2 and 3 only (not 4)
      expect(areSystemsAdjacent(state, 'player1', topTile, eastTile)).toBe(true);
      expect(areSystemsAdjacent(state, 'player1', topTile, bottomTile)).toBe(true);

      // Edge 4 is NOT connected on B-side
      expect(areSystemsAdjacent(state, 'player1', topTile, bottomLeftTile)).toBe(false);
    });

    it('should handle rotated hyperlane with B-side', () => {
      // Tile 89A has [[0,2], [3,5]] - two diagonal paths
      // With rotation 1, the base edges shift
      const hyperlane89A = createMockTile(
        { q: 0, r: 0 },
        { systemId: 89, rotation: 1 }
      );

      // With rotation 1:
      // Base edge 0 -> actual edge 1 (top-right)
      // Base edge 2 -> actual edge 3 (bottom)
      // Base edge 3 -> actual edge 4 (bottom-left)
      // Base edge 5 -> actual edge 0 (top)
      const topRightTile = createMockTile({ q: 1, r: -1 }, { systemId: 10 });    // Edge 1
      const bottomTile = createMockTile({ q: 0, r: 1 }, { systemId: 11 });       // Edge 3
      const bottomLeftTile = createMockTile({ q: -1, r: 1 }, { systemId: 12 });  // Edge 4
      const topTile = createMockTile({ q: 0, r: -1 }, { systemId: 13 });         // Edge 0

      const state = createMockGameState([
        hyperlane89A, topRightTile, bottomTile, bottomLeftTile, topTile
      ]);

      // Connection [0,2] with rotation 1 means edge 1 connects to edge 3
      expect(areSystemsAdjacent(state, 'player1', topRightTile, bottomTile)).toBe(true);

      // Connection [3,5] with rotation 1 means edge 4 connects to edge 0
      expect(areSystemsAdjacent(state, 'player1', bottomLeftTile, topTile)).toBe(true);

      // Non-connected pairs
      expect(areSystemsAdjacent(state, 'player1', topRightTile, bottomLeftTile)).toBe(false);
    });

    it('should handle crossing hyperlanes (tile 90A)', () => {
      // Tile 90A has [[0,2], [1,5]] - two crossing diagonal paths
      // Important: Some edge pairs are hex-adjacent, some are not
      // Edge pairs that are NOT hex-adjacent: (0,3), (0,4), (1,3), (1,4), (1,5), (2,4), (2,5)
      const hyperlane90A = createMockTile(
        { q: 0, r: 0 },
        { systemId: 90, rotation: 0 }
      );

      const topRightTile = createMockTile({ q: 1, r: -1 }, { systemId: 11 });    // Edge 1
      const westTile = createMockTile({ q: -1, r: 0 }, { systemId: 13 });        // Edge 5
      const bottomTile = createMockTile({ q: 0, r: 1 }, { systemId: 14 });       // Edge 3
      const bottomLeftTile = createMockTile({ q: -1, r: 1 }, { systemId: 15 });  // Edge 4

      const state = createMockGameState([
        hyperlane90A, topRightTile, westTile, bottomTile, bottomLeftTile
      ]);

      // Path 2: Edge 1 connects to edge 5 (NOT hex-adjacent, so this is hyperlane only)
      expect(areSystemsAdjacent(state, 'player1', topRightTile, westTile)).toBe(true);

      // Edge 1 and Edge 3 are NOT connected and NOT hex-adjacent
      expect(areSystemsAdjacent(state, 'player1', topRightTile, bottomTile)).toBe(false);

      // Edge 1 and Edge 4 are NOT connected and NOT hex-adjacent
      expect(areSystemsAdjacent(state, 'player1', topRightTile, bottomLeftTile)).toBe(false);
    });
  });
});
