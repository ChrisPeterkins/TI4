import type { HexCoord, MapState, MapTile, GameState } from '@ti4/shared';
import type { MovementModifiers } from '../abilities/ability-types.js';
import { getMovementModifiers, areSystemsAdjacent as areSystemsAdjacentWithAbilities, getMovementCostToEnter } from '../abilities/movement-modifiers.js';

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

  // Ring 4 (24 tiles) - for 7-8 player maps
  if (playerCount >= 7) {
    for (let i = 0; i < 6; i++) {
      const dir1 = HEX_DIRECTIONS[i];
      const dir2 = HEX_DIRECTIONS[(i + 1) % 6];

      // Corner (4 steps in one direction)
      positions.push({ q: dir1.q * 4, r: dir1.r * 4 });

      // Edge positions (3 positions per edge)
      positions.push({ q: dir1.q * 3 + dir2.q, r: dir1.r * 3 + dir2.r });
      positions.push({ q: dir1.q * 2 + dir2.q * 2, r: dir1.r * 2 + dir2.r * 2 });
      positions.push({ q: dir1.q + dir2.q * 3, r: dir1.r + dir2.r * 3 });
    }
  }

  return positions;
}

/**
 * Enhanced path-finding that accounts for faction abilities
 * - Uses movement modifiers (Creuss Slipstream +1)
 * - Uses faction-specific wormhole adjacency (Creuss Quantum Entanglement)
 * - Uses faction-specific anomaly immunity (Muaat supernova, Empyrean nebula)
 * - Accounts for nebula movement penalty (+1 cost to leave)
 */
export function findPathWithAbilities(
  state: GameState,
  playerId: string,
  from: HexCoord,
  to: HexCoord,
  baseMovement: number
): HexCoord[] | null {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return null;

  const startTile = findTileAtPosition(state.map, from);
  const modifiers = getMovementModifiers(state, playerId, startTile ?? null);

  // Apply movement bonus from faction abilities
  const effectiveMovement = baseMovement + modifiers.movementBonus;

  // Create anomaly traversal function based on faction immunity
  // Asteroid fields and supernovas block movement unless immune
  const canTraverseAnomaly = (anomaly: string): boolean => {
    // Check immunity first
    if (modifiers.immuneToAnomalies.includes(anomaly)) {
      return true;
    }
    // Supernova blocks movement (Muaat immune via faction ability)
    if (anomaly === 'supernova') {
      return false;
    }
    // Asteroid fields block movement (Antimass Deflectors grants immunity)
    if (anomaly === 'asteroid') {
      return false;
    }
    // Nebula and gravity rift don't block, but have other effects
    return true;
  };

  // BFS pathfinding with faction-specific adjacency and variable movement costs
  // Using Dijkstra-style approach to handle nebula movement costs
  const queue: { position: HexCoord; path: HexCoord[]; movementUsed: number }[] = [
    { position: from, path: [from], movementUsed: 0 },
  ];
  const visited = new Map<string, number>(); // Track best movement cost to reach each tile
  visited.set(`${from.q},${from.r}`, 0);

  while (queue.length > 0) {
    // Sort by movement used (Dijkstra's algorithm)
    queue.sort((a, b) => a.movementUsed - b.movementUsed);
    const current = queue.shift()!;

    if (current.position.q === to.q && current.position.r === to.r) {
      return current.path;
    }

    if (current.movementUsed >= effectiveMovement) {
      continue;
    }

    const currentTile = findTileAtPosition(state.map, current.position);
    if (!currentTile) continue;

    // Get all adjacent tiles using faction abilities (includes wormhole adjacency)
    const adjacentTiles: MapTile[] = [];

    for (const tile of state.map.tiles) {
      if (tile.id === currentTile.id) continue;

      // Use faction-specific adjacency checking
      if (areSystemsAdjacentWithAbilities(state, playerId, currentTile, tile)) {
        adjacentTiles.push(tile);
      }
    }

    for (const tile of adjacentTiles) {
      const key = `${tile.position.q},${tile.position.r}`;

      // Check if we can traverse this tile
      if (tile.anomaly && !canTraverseAnomaly(tile.anomaly)) {
        continue;
      }

      // Check for enemy ships blocking movement
      // Light/Wave Deflector allows moving through systems with enemy ships
      const hasEnemyShips = tile.units.some(
        u => u.ownerId !== playerId && ['carrier', 'cruiser', 'destroyer', 'dreadnought', 'flagship', 'war_sun', 'fighter'].includes(u.type)
      );
      if (hasEnemyShips && !modifiers.canMoveThroughEnemies) {
        // Can only enter if it's the destination (for combat)
        if (!(tile.position.q === to.q && tile.position.r === to.r)) {
          continue;
        }
      }

      // Calculate movement cost (accounts for nebula penalty)
      const movementCost = getMovementCostToEnter(state, playerId, currentTile, tile);
      const newMovementUsed = current.movementUsed + movementCost;

      // Skip if we've found a better path to this tile
      const previousBest = visited.get(key);
      if (previousBest !== undefined && previousBest <= newMovementUsed) {
        continue;
      }

      // Skip if we can't reach with available movement
      if (newMovementUsed > effectiveMovement) {
        continue;
      }

      visited.set(key, newMovementUsed);
      queue.push({
        position: tile.position,
        path: [...current.path, tile.position],
        movementUsed: newMovementUsed,
      });
    }
  }

  return null; // No path found
}

/**
 * Find path and return detailed information including systems traversed
 * Useful for gravity rift checks
 */
export function findPathWithDetails(
  state: GameState,
  playerId: string,
  from: HexCoord,
  to: HexCoord,
  baseMovement: number
): { path: HexCoord[]; tilesTraversed: MapTile[] } | null {
  const path = findPathWithAbilities(state, playerId, from, to, baseMovement);
  if (!path) return null;

  const tilesTraversed: MapTile[] = [];
  for (const pos of path) {
    const tile = findTileAtPosition(state.map, pos);
    if (tile) {
      tilesTraversed.push(tile);
    }
  }

  return { path, tilesTraversed };
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
    // 7-8 player maps use extended layout with hyperlane tiles
    7: [
      { q: 0, r: -4 },   // North
      { q: 3, r: -4 },   // Northeast-1
      { q: 4, r: -1 },   // Northeast-2
      { q: 4, r: 2 },    // East
      { q: 0, r: 4 },    // South
      { q: -4, r: 4 },   // Southwest
      { q: -4, r: 0 },   // West
    ],
    8: [
      { q: 0, r: -4 },   // North
      { q: 3, r: -4 },   // Northeast-1
      { q: 4, r: -1 },   // Northeast-2
      { q: 4, r: 2 },    // Southeast-1
      { q: 2, r: 4 },    // Southeast-2
      { q: -2, r: 4 },   // Southwest-1
      { q: -4, r: 2 },   // Southwest-2
      { q: -4, r: -1 },  // Northwest
    ],
  };

  return positions[playerCount] ?? positions[6];
}
