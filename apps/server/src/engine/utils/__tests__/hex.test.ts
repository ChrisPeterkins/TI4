import { describe, it, expect } from 'vitest';
import {
  getAdjacentPositions,
  areAdjacent,
  hexDistance,
  findTileAtPosition,
  findTileBySystemId,
  getAdjacentTiles,
  getTilesWithinRange,
  findPath,
  getWormholeConnections,
  generateStandardMapPositions,
  getHomeSystemPositions,
} from '../hex.js';
import type { MapState, MapTile, HexCoord } from '@ti4/shared';

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

function createMockMap(tiles: MapTile[]): MapState {
  return {
    tiles,
    playerCount: 6,
  };
}

describe('Hex Utilities', () => {
  describe('getAdjacentPositions', () => {
    it('should return 6 adjacent positions for center', () => {
      const center: HexCoord = { q: 0, r: 0 };
      const adjacent = getAdjacentPositions(center);

      expect(adjacent).toHaveLength(6);
      expect(adjacent).toContainEqual({ q: 1, r: 0 });   // East
      expect(adjacent).toContainEqual({ q: 1, r: -1 });  // Northeast
      expect(adjacent).toContainEqual({ q: 0, r: -1 });  // Northwest
      expect(adjacent).toContainEqual({ q: -1, r: 0 });  // West
      expect(adjacent).toContainEqual({ q: -1, r: 1 });  // Southwest
      expect(adjacent).toContainEqual({ q: 0, r: 1 });   // Southeast
    });

    it('should return correct positions for non-center hex', () => {
      const position: HexCoord = { q: 2, r: -1 };
      const adjacent = getAdjacentPositions(position);

      expect(adjacent).toHaveLength(6);
      expect(adjacent).toContainEqual({ q: 3, r: -1 });
      expect(adjacent).toContainEqual({ q: 3, r: -2 });
      expect(adjacent).toContainEqual({ q: 2, r: -2 });
      expect(adjacent).toContainEqual({ q: 1, r: -1 });
      expect(adjacent).toContainEqual({ q: 1, r: 0 });
      expect(adjacent).toContainEqual({ q: 2, r: 0 });
    });
  });

  describe('areAdjacent', () => {
    it('should return true for adjacent hexes', () => {
      expect(areAdjacent({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(true);
      expect(areAdjacent({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(true);
      expect(areAdjacent({ q: 0, r: 0 }, { q: -1, r: 1 })).toBe(true);
    });

    it('should return false for non-adjacent hexes', () => {
      expect(areAdjacent({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(false);
      expect(areAdjacent({ q: 0, r: 0 }, { q: 0, r: 2 })).toBe(false);
      expect(areAdjacent({ q: 0, r: 0 }, { q: 1, r: 1 })).toBe(false);
    });

    it('should return false for same position', () => {
      expect(areAdjacent({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(false);
    });
  });

  describe('hexDistance', () => {
    it('should return 0 for same position', () => {
      expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
    });

    it('should return 1 for adjacent hexes', () => {
      expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
      expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1);
      expect(hexDistance({ q: 0, r: 0 }, { q: -1, r: 1 })).toBe(1);
    });

    it('should return correct distance for further hexes', () => {
      expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(2);
      expect(hexDistance({ q: 0, r: 0 }, { q: 3, r: -3 })).toBe(3);
      expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: -3 })).toBe(3);
    });

    it('should be symmetric', () => {
      const a: HexCoord = { q: 1, r: 2 };
      const b: HexCoord = { q: -2, r: 4 };
      expect(hexDistance(a, b)).toBe(hexDistance(b, a));
    });
  });

  describe('findTileAtPosition', () => {
    it('should find tile at given position', () => {
      const tile = createMockTile({ q: 1, r: 0 }, { systemId: 42 });
      const map = createMockMap([
        createMockTile({ q: 0, r: 0 }),
        tile,
        createMockTile({ q: -1, r: 0 }),
      ]);

      const found = findTileAtPosition(map, { q: 1, r: 0 });
      expect(found).toBe(tile);
      expect(found?.systemId).toBe(42);
    });

    it('should return undefined for non-existent position', () => {
      const map = createMockMap([createMockTile({ q: 0, r: 0 })]);

      const found = findTileAtPosition(map, { q: 5, r: 5 });
      expect(found).toBeUndefined();
    });
  });

  describe('findTileBySystemId', () => {
    it('should find tile by system ID', () => {
      const tile = createMockTile({ q: 1, r: 0 }, { systemId: 18 });
      const map = createMockMap([
        createMockTile({ q: 0, r: 0 }, { systemId: 1 }),
        tile,
      ]);

      const found = findTileBySystemId(map, 18);
      expect(found).toBe(tile);
    });

    it('should return undefined for non-existent system', () => {
      const map = createMockMap([createMockTile({ q: 0, r: 0 }, { systemId: 1 })]);

      const found = findTileBySystemId(map, 999);
      expect(found).toBeUndefined();
    });
  });

  describe('getAdjacentTiles', () => {
    it('should return all adjacent tiles that exist', () => {
      const centerTile = createMockTile({ q: 0, r: 0 });
      const eastTile = createMockTile({ q: 1, r: 0 });
      const westTile = createMockTile({ q: -1, r: 0 });

      const map = createMockMap([centerTile, eastTile, westTile]);

      const adjacent = getAdjacentTiles(map, { q: 0, r: 0 });

      expect(adjacent).toHaveLength(2);
      expect(adjacent).toContain(eastTile);
      expect(adjacent).toContain(westTile);
    });

    it('should return empty array when no adjacent tiles exist', () => {
      const map = createMockMap([createMockTile({ q: 0, r: 0 })]);

      const adjacent = getAdjacentTiles(map, { q: 5, r: 5 });

      expect(adjacent).toHaveLength(0);
    });
  });

  describe('getTilesWithinRange', () => {
    it('should return only center tile for range 0', () => {
      const centerTile = createMockTile({ q: 0, r: 0 });
      const eastTile = createMockTile({ q: 1, r: 0 });

      const map = createMockMap([centerTile, eastTile]);

      const tiles = getTilesWithinRange(map, { q: 0, r: 0 }, 0);

      expect(tiles).toHaveLength(1);
      expect(tiles).toContain(centerTile);
    });

    it('should return all tiles within range', () => {
      const centerTile = createMockTile({ q: 0, r: 0 });
      const ring1 = createMockTile({ q: 1, r: 0 });
      const ring2 = createMockTile({ q: 2, r: 0 });
      const farTile = createMockTile({ q: 3, r: 0 });

      const map = createMockMap([centerTile, ring1, ring2, farTile]);

      const tiles = getTilesWithinRange(map, { q: 0, r: 0 }, 2);

      expect(tiles).toHaveLength(3);
      expect(tiles).toContain(centerTile);
      expect(tiles).toContain(ring1);
      expect(tiles).toContain(ring2);
      expect(tiles).not.toContain(farTile);
    });
  });

  describe('getWormholeConnections', () => {
    it('should return all tiles with matching wormhole type', () => {
      const alpha1 = createMockTile({ q: 0, r: 0 }, { wormhole: 'alpha' });
      const alpha2 = createMockTile({ q: 2, r: -2 }, { wormhole: 'alpha' });
      const beta = createMockTile({ q: 1, r: 0 }, { wormhole: 'beta' });
      const noWormhole = createMockTile({ q: -1, r: 0 });

      const map = createMockMap([alpha1, alpha2, beta, noWormhole]);

      const connections = getWormholeConnections(map, 'alpha');

      expect(connections).toHaveLength(2);
      expect(connections).toContain(alpha1);
      expect(connections).toContain(alpha2);
    });

    it('should return empty array when no wormholes of type exist', () => {
      const map = createMockMap([createMockTile({ q: 0, r: 0 })]);

      const connections = getWormholeConnections(map, 'gamma');

      expect(connections).toHaveLength(0);
    });
  });

  describe('findPath', () => {
    it('should find path between adjacent tiles', () => {
      const start = createMockTile({ q: 0, r: 0 });
      const end = createMockTile({ q: 1, r: 0 });

      const map = createMockMap([start, end]);

      const path = findPath(map, { q: 0, r: 0 }, { q: 1, r: 0 }, 5);

      expect(path).not.toBeNull();
      expect(path).toHaveLength(2);
      expect(path![0]).toEqual({ q: 0, r: 0 });
      expect(path![1]).toEqual({ q: 1, r: 0 });
    });

    it('should find path through multiple tiles', () => {
      const tiles = [
        createMockTile({ q: 0, r: 0 }),
        createMockTile({ q: 1, r: 0 }),
        createMockTile({ q: 2, r: 0 }),
      ];

      const map = createMockMap(tiles);

      const path = findPath(map, { q: 0, r: 0 }, { q: 2, r: 0 }, 5);

      expect(path).not.toBeNull();
      expect(path).toHaveLength(3);
    });

    it('should return null when path exceeds max distance', () => {
      const tiles = [
        createMockTile({ q: 0, r: 0 }),
        createMockTile({ q: 1, r: 0 }),
        createMockTile({ q: 2, r: 0 }),
      ];

      const map = createMockMap(tiles);

      const path = findPath(map, { q: 0, r: 0 }, { q: 2, r: 0 }, 1);

      expect(path).toBeNull();
    });

    it('should return null when no path exists', () => {
      const tiles = [
        createMockTile({ q: 0, r: 0 }),
        createMockTile({ q: 5, r: 0 }), // Isolated tile
      ];

      const map = createMockMap(tiles);

      const path = findPath(map, { q: 0, r: 0 }, { q: 5, r: 0 }, 10);

      expect(path).toBeNull();
    });

    it('should use wormholes for pathfinding', () => {
      const tiles = [
        createMockTile({ q: 0, r: 0 }, { wormhole: 'alpha' }),
        createMockTile({ q: 5, r: 0 }, { wormhole: 'alpha' }), // Connected via wormhole
        createMockTile({ q: 6, r: 0 }), // Adjacent to wormhole exit
      ];

      const map = createMockMap(tiles);

      const path = findPath(map, { q: 0, r: 0 }, { q: 6, r: 0 }, 3);

      expect(path).not.toBeNull();
      expect(path).toHaveLength(3);
    });

    it('should avoid anomalies when canTraverseAnomaly returns false', () => {
      const tiles = [
        createMockTile({ q: 0, r: 0 }),
        createMockTile({ q: 1, r: 0 }, { anomaly: 'supernova' }),
        createMockTile({ q: 2, r: 0 }),
        createMockTile({ q: 0, r: 1 }), // Alternate route
        createMockTile({ q: 1, r: 1 }),
        createMockTile({ q: 2, r: 0 }),
      ];

      const map = createMockMap(tiles);

      const path = findPath(
        map,
        { q: 0, r: 0 },
        { q: 2, r: 0 },
        10,
        (anomaly) => anomaly !== 'supernova'
      );

      // Should find alternate route avoiding supernova
      if (path) {
        expect(path.some(p => p.q === 1 && p.r === 0)).toBe(false);
      }
    });
  });

  describe('generateStandardMapPositions', () => {
    it('should generate correct number of positions for 3 players', () => {
      const positions = generateStandardMapPositions(3);

      // Center + Ring 1 (6) + Ring 2 (12) = 19
      expect(positions.length).toBeGreaterThanOrEqual(19);
    });

    it('should generate correct number of positions for 6 players', () => {
      const positions = generateStandardMapPositions(6);

      // Center + Ring 1 (6) + Ring 2 (12) + Ring 3 (18) = 37
      expect(positions.length).toBeGreaterThanOrEqual(37);
    });

    it('should always include center position', () => {
      const positions = generateStandardMapPositions(6);

      expect(positions).toContainEqual({ q: 0, r: 0 });
    });

    it('should include all ring 1 positions', () => {
      const positions = generateStandardMapPositions(6);

      expect(positions).toContainEqual({ q: 1, r: 0 });
      expect(positions).toContainEqual({ q: 1, r: -1 });
      expect(positions).toContainEqual({ q: 0, r: -1 });
      expect(positions).toContainEqual({ q: -1, r: 0 });
      expect(positions).toContainEqual({ q: -1, r: 1 });
      expect(positions).toContainEqual({ q: 0, r: 1 });
    });
  });

  describe('getHomeSystemPositions', () => {
    it('should return 3 positions for 3 players', () => {
      const positions = getHomeSystemPositions(3);

      expect(positions).toHaveLength(3);
    });

    it('should return 4 positions for 4 players', () => {
      const positions = getHomeSystemPositions(4);

      expect(positions).toHaveLength(4);
    });

    it('should return 6 positions for 6 players', () => {
      const positions = getHomeSystemPositions(6);

      expect(positions).toHaveLength(6);
    });

    it('should return positions at distance 3 from center', () => {
      const positions = getHomeSystemPositions(6);

      for (const pos of positions) {
        expect(hexDistance(pos, { q: 0, r: 0 })).toBe(3);
      }
    });

    it('should default to 6-player positions for unsupported player count', () => {
      // 9+ players is not supported, should default to 6
      const positions = getHomeSystemPositions(9);

      expect(positions).toHaveLength(6);
    });

    it('should support 8-player maps', () => {
      const positions = getHomeSystemPositions(8);

      expect(positions).toHaveLength(8);
    });
  });
});
