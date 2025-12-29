import type { HexCoord, MapState, MapTile } from '@ti4/shared';

/**
 * Axial coordinate directions for hex grids
 * Using "pointy-top" orientation
 */
const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },   // East
  { q: 1, r: -1 },  // Northeast
  { q: 0, r: -1 },  // Northwest
  { q: -1, r: 0 },  // West
  { q: -1, r: 1 },  // Southwest
  { q: 0, r: 1 },   // Southeast
];

/**
 * Get all 6 adjacent hex positions
 */
export function getAdjacentPositions(position: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(dir => ({
    q: position.q + dir.q,
    r: position.r + dir.r,
  }));
}

/**
 * Check if two positions are adjacent
 */
export function areAdjacent(a: HexCoord, b: HexCoord): boolean {
  const adjacent = getAdjacentPositions(a);
  return adjacent.some(pos => pos.q === b.q && pos.r === b.r);
}

/**
 * Calculate hex distance between two positions
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  // Convert to cube coordinates for easier distance calculation
  const aCube = axialToCube(a);
  const bCube = axialToCube(b);

  return Math.max(
    Math.abs(aCube.x - bCube.x),
    Math.abs(aCube.y - bCube.y),
    Math.abs(aCube.z - bCube.z)
  );
}

/**
 * Convert axial coordinates to cube coordinates
 */
function axialToCube(hex: HexCoord): { x: number; y: number; z: number } {
  const x = hex.q;
  const z = hex.r;
  const y = -x - z;
  return { x, y, z };
}

/**
 * Find a tile at a given position
 */
export function findTileAtPosition(map: MapState, position: HexCoord): MapTile | undefined {
  return map.tiles.find(
    tile => tile.position.q === position.q && tile.position.r === position.r
  );
}

/**
 * Find a tile by system ID
 */
export function findTileBySystemId(map: MapState, systemId: number): MapTile | undefined {
  return map.tiles.find(tile => tile.systemId === systemId);
}

/**
 * Get all tiles adjacent to a given position
 */
export function getAdjacentTiles(map: MapState, position: HexCoord): MapTile[] {
  const adjacentPositions = getAdjacentPositions(position);
  return adjacentPositions
    .map(pos => findTileAtPosition(map, pos))
    .filter((tile): tile is MapTile => tile !== undefined);
}

/**
 * Get all tiles within a certain distance
 */
export function getTilesWithinRange(
  map: MapState,
  position: HexCoord,
  range: number
): MapTile[] {
  return map.tiles.filter(tile => hexDistance(position, tile.position) <= range);
}

/**
 * Check if a path exists between two systems (for movement validation)
 * Takes into account wormholes and anomalies
 */
export function findPath(
  map: MapState,
  from: HexCoord,
  to: HexCoord,
  maxDistance: number,
  canTraverseAnomaly: (anomaly: string) => boolean = () => true
): HexCoord[] | null {
  // BFS pathfinding
  const queue: { position: HexCoord; path: HexCoord[]; distance: number }[] = [
    { position: from, path: [from], distance: 0 },
  ];
  const visited = new Set<string>();
  visited.add(`${from.q},${from.r}`);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.position.q === to.q && current.position.r === to.r) {
      return current.path;
    }

    if (current.distance >= maxDistance) {
      continue;
    }

    // Get adjacent tiles
    const adjacentTiles = getAdjacentTiles(map, current.position);

    // Also consider wormhole connections
    const currentTile = findTileAtPosition(map, current.position);
    if (currentTile?.wormhole) {
      const wormholeConnections = getWormholeConnections(map, currentTile.wormhole);
      adjacentTiles.push(...wormholeConnections);
    }

    for (const tile of adjacentTiles) {
      const key = `${tile.position.q},${tile.position.r}`;
      if (visited.has(key)) {
        continue;
      }

      // Check if we can traverse this tile
      if (tile.anomaly && !canTraverseAnomaly(tile.anomaly)) {
        continue;
      }

      visited.add(key);
      queue.push({
        position: tile.position,
        path: [...current.path, tile.position],
        distance: current.distance + 1,
      });
    }
  }

  return null; // No path found
}

/**
 * Get all tiles connected via a specific wormhole type
 */
export function getWormholeConnections(map: MapState, wormholeType: string): MapTile[] {
  return map.tiles.filter(
    tile => tile.wormhole === wormholeType
  );
}

/**
 * Generate positions for a standard 6-player map
 * Returns positions in ring order from center
 */
export function generateStandardMapPositions(playerCount: number): HexCoord[] {
  const positions: HexCoord[] = [];

  // Center (Mecatol Rex)
  positions.push({ q: 0, r: 0 });

  // Ring 1 (6 tiles)
  for (let i = 0; i < 6; i++) {
    positions.push(HEX_DIRECTIONS[i]);
  }

  // Ring 2 (12 tiles)
  for (let i = 0; i < 6; i++) {
    const dir1 = HEX_DIRECTIONS[i];
    const dir2 = HEX_DIRECTIONS[(i + 1) % 6];

    // Corner position (2 steps in one direction)
    positions.push({ q: dir1.q * 2, r: dir1.r * 2 });

    // Edge position (1 step in each of two directions)
    positions.push({ q: dir1.q + dir2.q, r: dir1.r + dir2.r });
  }

  // Ring 3 (18 tiles) - for 6+ player maps
  if (playerCount >= 6) {
    for (let i = 0; i < 6; i++) {
      const dir1 = HEX_DIRECTIONS[i];
      const dir2 = HEX_DIRECTIONS[(i + 1) % 6];

      // Corner (3 steps in one direction)
      positions.push({ q: dir1.q * 3, r: dir1.r * 3 });

      // Edge positions
      positions.push({ q: dir1.q * 2 + dir2.q, r: dir1.r * 2 + dir2.r });
      positions.push({ q: dir1.q + dir2.q * 2, r: dir1.r + dir2.r * 2 });
    }
  }

  return positions;
}

/**
 * Get home system positions for a given player count
 */
export function getHomeSystemPositions(playerCount: number): HexCoord[] {
  // Standard positions for home systems based on player count
  const positions: Record<number, HexCoord[]> = {
    3: [
      { q: 0, r: -3 },   // North
      { q: 3, r: 0 },    // Southeast-ish
      { q: -3, r: 3 },   // Southwest-ish
    ],
    4: [
      { q: 0, r: -3 },   // North
      { q: 3, r: -3 },   // Northeast
      { q: 0, r: 3 },    // South
      { q: -3, r: 3 },   // Southwest
    ],
    5: [
      { q: 0, r: -3 },
      { q: 3, r: -3 },
      { q: 3, r: 0 },
      { q: -3, r: 3 },
      { q: -3, r: 0 },
    ],
    6: [
      { q: 0, r: -3 },   // North
      { q: 3, r: -3 },   // Northeast
      { q: 3, r: 0 },    // East
      { q: 0, r: 3 },    // South
      { q: -3, r: 3 },   // Southwest
      { q: -3, r: 0 },   // West
    ],
  };

  return positions[playerCount] ?? positions[6];
}
