import type { HexCoord, MapTile, MapState, SystemData } from '@ti4/shared';
import { systems } from '@ti4/game-data';
import {
  getHexRing,
  getHomeSystemPositions,
  areHexesAdjacent,
  hexDistance,
} from './hex';

/**
 * System tile categories
 */
export const BLUE_TILES = Object.values(systems)
  .filter(s => s.type === 'blue')
  .map(s => s.id);

export const RED_TILES = Object.values(systems)
  .filter(s => s.type === 'red')
  .map(s => s.id);

export const HOME_SYSTEM_TILES = Object.values(systems)
  .filter(s => s.type === 'home')
  .map(s => s.id);

export const MECATOL_REX_TILE = 18;

/**
 * Get tiles with specific anomalies
 */
export function getTilesWithAnomaly(): number[] {
  return Object.values(systems)
    .filter(s => s.anomaly)
    .map(s => s.id);
}

/**
 * Get tiles with specific wormhole types
 */
export function getTilesWithWormhole(wormholeType?: string): number[] {
  return Object.values(systems)
    .filter(s => wormholeType ? s.wormhole === wormholeType : s.wormhole)
    .map(s => s.id);
}

/**
 * Tile distribution per player count
 * For 7-8 players, these are tiles PER PLAYER
 */
export const TILE_DISTRIBUTION: Record<number, { blue: number; red: number }> = {
  3: { blue: 6, red: 2 },
  4: { blue: 5, red: 3 },
  5: { blue: 3, red: 2 },
  6: { blue: 3, red: 2 },
  7: { blue: 4, red: 2 }, // Standard 7-player
  8: { blue: 4, red: 2 }, // Standard 8-player
};

/**
 * Hyperlane tile configurations for different map setups
 * Each entry specifies which hyperlane tiles to use and which side (A or B)
 */
export interface HyperlaneConfig {
  tiles: Array<{
    systemId: number;
    side: 'A' | 'B';
    position: HexCoord;
    rotation: number;
  }>;
}

/**
 * Hyperlane configurations for different player counts
 * Based on official TI4 Prophecy of Kings rules
 */
export const HYPERLANE_CONFIGS: Record<string, HyperlaneConfig> = {
  // 5-Player with hyperlanes (optional setup)
  '5_hyperlane': {
    tiles: [
      { systemId: 83, side: 'A', position: { q: -2, r: -1 }, rotation: 0 },
      { systemId: 84, side: 'A', position: { q: -1, r: -2 }, rotation: 0 },
      { systemId: 85, side: 'A', position: { q: 1, r: -3 }, rotation: 0 },
      { systemId: 86, side: 'A', position: { q: 2, r: -3 }, rotation: 0 },
      { systemId: 87, side: 'A', position: { q: 3, r: -2 }, rotation: 0 },
      { systemId: 88, side: 'A', position: { q: 3, r: -1 }, rotation: 0 },
    ],
  },
  // 7-Player standard
  '7_standard': {
    tiles: [
      { systemId: 83, side: 'A', position: { q: 0, r: -4 }, rotation: 0 },
      { systemId: 84, side: 'A', position: { q: 2, r: -4 }, rotation: 0 },
      { systemId: 85, side: 'A', position: { q: 4, r: -4 }, rotation: 0 },
      { systemId: 86, side: 'A', position: { q: 4, r: -2 }, rotation: 0 },
      { systemId: 87, side: 'A', position: { q: 4, r: 0 }, rotation: 0 },
      { systemId: 88, side: 'A', position: { q: 2, r: 2 }, rotation: 0 },
    ],
  },
  // 7-Player alternate
  '7_alternate': {
    tiles: [
      { systemId: 83, side: 'B', position: { q: 0, r: -4 }, rotation: 0 },
      { systemId: 84, side: 'B', position: { q: 2, r: -4 }, rotation: 0 },
      { systemId: 85, side: 'B', position: { q: 4, r: -4 }, rotation: 0 },
      { systemId: 86, side: 'B', position: { q: 4, r: -2 }, rotation: 0 },
      { systemId: 88, side: 'B', position: { q: 4, r: 0 }, rotation: 0 },
      { systemId: 90, side: 'B', position: { q: 2, r: 2 }, rotation: 0 },
    ],
  },
  // 8-Player alternate
  '8_alternate': {
    tiles: [
      { systemId: 83, side: 'B', position: { q: -2, r: -2 }, rotation: 0 },
      { systemId: 85, side: 'B', position: { q: 2, r: -4 }, rotation: 0 },
      { systemId: 87, side: 'A', position: { q: 4, r: -2 }, rotation: 0 },
      { systemId: 88, side: 'A', position: { q: 2, r: 2 }, rotation: 0 },
      { systemId: 89, side: 'B', position: { q: -2, r: 4 }, rotation: 0 },
      { systemId: 90, side: 'B', position: { q: -4, r: 2 }, rotation: 0 },
    ],
  },
};

/**
 * Map configuration for preset maps
 */
export interface MapConfig {
  playerCount: number;
  rings: number;
  homePositions: HexCoord[];
  tileAssignments: Map<string, number>; // position key -> system ID
}

/**
 * Validation result for map placement
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Check if placing a tile at a position violates adjacency rules
 */
export function validateTilePlacement(
  systemId: number,
  position: HexCoord,
  existingTiles: MapTile[]
): ValidationResult {
  const errors: string[] = [];
  const system = systems[systemId];

  if (!system) {
    return { valid: false, errors: [`Unknown system ID: ${systemId}`] };
  }

  // Get adjacent tiles
  const adjacentTiles = existingTiles.filter(tile =>
    areHexesAdjacent(tile.position, position)
  );

  // Rule 1: Anomalies cannot be adjacent to each other
  if (system.anomaly) {
    const adjacentAnomalies = adjacentTiles.filter(tile => {
      const adjSystem = systems[tile.systemId];
      return adjSystem?.anomaly;
    });

    if (adjacentAnomalies.length > 0) {
      errors.push(`Anomaly tiles cannot be adjacent (${system.anomaly} near other anomalies)`);
    }
  }

  // Rule 2: Same wormhole types cannot be adjacent
  if (system.wormhole) {
    const adjacentSameWormholes = adjacentTiles.filter(tile => {
      const adjSystem = systems[tile.systemId];
      return adjSystem?.wormhole === system.wormhole;
    });

    if (adjacentSameWormholes.length > 0) {
      errors.push(`Same wormhole types cannot be adjacent (${system.wormhole})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an entire map
 */
export function validateMap(tiles: MapTile[]): ValidationResult {
  const errors: string[] = [];

  for (const tile of tiles) {
    const otherTiles = tiles.filter(t => t.id !== tile.id);
    const result = validateTilePlacement(tile.systemId, tile.position, otherTiles);
    errors.push(...result.errors);
  }

  // Check for duplicate positions
  const positionKeys = tiles.map(t => `${t.position.q},${t.position.r}`);
  const duplicates = positionKeys.filter((key, index) => positionKeys.indexOf(key) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate positions found: ${duplicates.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)], // Remove duplicate errors
  };
}

/**
 * Create a map tile
 */
function createMapTile(
  systemId: number,
  position: HexCoord,
  controlledBy?: string,
  options?: { rotation?: number; hyperlaneSide?: 'A' | 'B' }
): MapTile {
  const system = systems[systemId];

  const tile: MapTile = {
    id: `tile-${position.q}-${position.r}`,
    systemId,
    position,
    rotation: options?.rotation ?? 0,
    planets: system?.planets.map(p => ({
      id: `planet-${p.id}`,
      planetId: p.id,
      controlledBy: controlledBy ?? null,
      exhausted: false,
      attachments: [],
      units: [],
    })) ?? [],
    wormhole: system?.wormhole ?? null,
    anomaly: system?.anomaly ?? null,
    units: [],
    commandTokens: [],
  };

  // Add hyperlaneSide for hyperlane tiles
  if (system?.type === 'hyperlane' && options?.hyperlaneSide) {
    tile.hyperlaneSide = options.hyperlaneSide;
  }

  return tile;
}

/**
 * Create hyperlane tiles for a map configuration
 */
function createHyperlaneTiles(config: HyperlaneConfig): MapTile[] {
  return config.tiles.map(({ systemId, side, position, rotation }) =>
    createMapTile(systemId, position, undefined, { rotation, hyperlaneSide: side })
  );
}

/**
 * Shuffle an array (Fisher-Yates)
 */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  let random = seed ? seededRandom(seed) : Math.random;

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Simple seeded random number generator
 */
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/**
 * Preset map configurations for different player counts
 * These are based on the official FFG preset maps
 */
export const PRESET_MAPS: Record<number, { systemIds: number[]; positions: HexCoord[] }> = {
  // 6-player standard preset
  6: {
    // Ring 1 (6 tiles) + Ring 2 (12 tiles) = 18 tiles
    // Mix of blue and red, avoiding adjacent anomalies/wormholes
    systemIds: [
      // Ring 1 - mostly blue with good planets
      19, 20, 21, 22, 23, 24,
      // Ring 2 - mix of blue and red
      25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
    ],
    positions: [
      // Ring 1
      ...getHexRing({ q: 0, r: 0 }, 1),
      // Ring 2
      ...getHexRing({ q: 0, r: 0 }, 2),
    ],
  },
};

/**
 * Generate a balanced map for a given player count
 */
export function generateMap(
  playerCount: number,
  factionIds: string[],
  options: {
    seed?: number;
    preset?: boolean;
    hyperlaneVariant?: 'standard' | 'alternate';
  } = {}
): MapState {
  const tiles: MapTile[] = [];
  const center: HexCoord = { q: 0, r: 0 };

  // 1. Place Mecatol Rex at center
  tiles.push(createMapTile(MECATOL_REX_TILE, center));

  // 2. Get home system positions
  const homePositions = getHomeSystemPositions(playerCount);

  // 3. Get ring positions (excluding home system positions)
  const ring1 = getHexRing(center, 1);
  const ring2 = getHexRing(center, 2);
  const ring3 = getHexRing(center, 3);
  const ring4 = playerCount >= 7 ? getHexRing(center, 4) : [];

  // 4. Add hyperlane tiles for 7-8 player games
  let hyperlanePositions: Set<string> = new Set();
  if (playerCount >= 7) {
    const variant = options.hyperlaneVariant ?? 'standard';
    const configKey = playerCount === 7
      ? (variant === 'alternate' ? '7_alternate' : '7_standard')
      : '8_alternate'; // 8-player only has alternate in official rules

    const hyperlaneConfig = HYPERLANE_CONFIGS[configKey];
    if (hyperlaneConfig) {
      const hyperlaneTiles = createHyperlaneTiles(hyperlaneConfig);
      tiles.push(...hyperlaneTiles);
      hyperlanePositions = new Set(
        hyperlaneTiles.map(t => `${t.position.q},${t.position.r}`)
      );
    }
  }

  // Filter out home positions and hyperlane positions from available positions
  const isAvailablePosition = (pos: HexCoord): boolean => {
    const key = `${pos.q},${pos.r}`;
    if (hyperlanePositions.has(key)) return false;
    if (homePositions.some(hp => hp.q === pos.q && hp.r === pos.r)) return false;
    return true;
  };

  const ring3NonHome = ring3.filter(isAvailablePosition);
  const ring4NonHome = ring4.filter(isAvailablePosition);

  // 4. Calculate tile requirements
  const distribution = TILE_DISTRIBUTION[playerCount] ?? TILE_DISTRIBUTION[6];
  const totalBlue = distribution.blue * playerCount;
  const totalRed = distribution.red * playerCount;

  // 5. Select tiles - separate by type for smarter placement
  const random = options.seed ? seededRandom(options.seed) : Math.random;

  const availableBlue = shuffleArray([...BLUE_TILES], options.seed);
  const availableRed = shuffleArray([...RED_TILES], options.seed);

  const selectedBlue = availableBlue.slice(0, totalBlue);
  const selectedRed = availableRed.slice(0, Math.min(totalRed, availableRed.length));

  // Separate red tiles into anomalies and non-anomalies
  const anomalyTiles = selectedRed.filter(id => systems[id]?.anomaly);
  const wormholeTiles = selectedRed.filter(id => systems[id]?.wormhole && !systems[id]?.anomaly);
  const emptyTiles = selectedRed.filter(id => !systems[id]?.anomaly && !systems[id]?.wormhole);

  // Sort blue tiles by value (better tiles closer to center)
  const sortedBlue = [...selectedBlue].sort((a, b) => {
    const sysA = systems[a];
    const sysB = systems[b];
    const resA = sysA?.planets.reduce((sum, p) => sum + p.resources + p.influence, 0) ?? 0;
    const resB = sysB?.planets.reduce((sum, p) => sum + p.resources + p.influence, 0) ?? 0;
    return resB - resA;
  });

  // 6. Strategic placement:
  // - Ring 1: Best blue tiles WITHOUT wormholes (to avoid adjacency issues)
  // - Ring 2/3/4: Mix of blue and red (spread out anomalies/wormholes)

  const allPositions = [...ring1, ...ring2, ...ring3NonHome, ...ring4NonHome];

  // Separate blue tiles: non-wormhole tiles preferred for ring 1
  const blueNoWormhole = sortedBlue.filter(id => !systems[id]?.wormhole);
  const blueWithWormhole = sortedBlue.filter(id => systems[id]?.wormhole);

  // For ring 1, prioritize non-wormhole blues, then fill with wormhole blues if needed
  const blueTilesForRing1 = [
    ...blueNoWormhole.slice(0, Math.min(6, blueNoWormhole.length)),
    ...blueWithWormhole.slice(0, Math.max(0, 6 - blueNoWormhole.length)),
  ].slice(0, 6);

  const remainingBlue = [
    ...blueNoWormhole.slice(Math.min(6, blueNoWormhole.length)),
    ...blueWithWormhole.slice(Math.max(0, 6 - blueNoWormhole.length)),
  ];

  // Assign ring 1 with best non-wormhole blue tiles
  for (let i = 0; i < ring1.length && i < blueTilesForRing1.length; i++) {
    tiles.push(createMapTile(blueTilesForRing1[i], ring1[i]));
  }

  // Now place anomalies and wormholes carefully in ring 2, 3, and 4
  const remainingPositions = [...ring2, ...ring3NonHome, ...ring4NonHome];

  // Collect all wormhole tiles (both red and blue)
  const blueWormholeTiles = remainingBlue.filter(id => systems[id]?.wormhole);
  const blueNonWormholeTiles = remainingBlue.filter(id => !systems[id]?.wormhole);
  const allWormholeTiles = [...wormholeTiles, ...blueWormholeTiles];

  // Place anomaly tiles first, ensuring they're not adjacent
  const anomalyPositions = spreadAnomalies(anomalyTiles, remainingPositions, tiles);
  tiles.push(...anomalyPositions);

  // Update remaining positions
  const usedPositionKeys = new Set(tiles.map(t => `${t.position.q},${t.position.r}`));
  const stillAvailablePositions = remainingPositions.filter(p =>
    !usedPositionKeys.has(`${p.q},${p.r}`)
  );

  // Place ALL wormhole tiles (red + blue), avoiding same-type adjacency
  const usedTileIds = new Set(tiles.map(t => t.systemId));
  const wormholePositions = spreadWormholes(
    allWormholeTiles.filter(id => !usedTileIds.has(id)),
    stillAvailablePositions,
    tiles
  );
  tiles.push(...wormholePositions);

  // Fill remaining positions with non-wormhole tiles
  const finalUsedPositions = new Set(tiles.map(t => `${t.position.q},${t.position.r}`));
  const finalUsedTiles = new Set(tiles.map(t => t.systemId));

  const finalPositions = remainingPositions.filter(p =>
    !finalUsedPositions.has(`${p.q},${p.r}`)
  );
  const finalTiles = [...blueNonWormholeTiles, ...emptyTiles].filter(id => !finalUsedTiles.has(id));

  for (let i = 0; i < finalPositions.length && i < finalTiles.length; i++) {
    tiles.push(createMapTile(finalTiles[i], finalPositions[i]));
  }

  // 7. Add home systems
  const homeSystemMap = getHomeSystemsForFactions(factionIds);
  homePositions.forEach((pos, index) => {
    if (index < factionIds.length) {
      const homeSystemId = homeSystemMap.get(factionIds[index]);
      if (homeSystemId) {
        tiles.push(createMapTile(homeSystemId, pos, `player-${index + 1}`));
      }
    }
  });

  return {
    tiles,
    playerCount,
  };
}

/**
 * Place anomaly tiles ensuring they're not adjacent to each other
 */
function spreadAnomalies(
  anomalyTileIds: number[],
  availablePositions: HexCoord[],
  existingTiles: MapTile[]
): MapTile[] {
  const result: MapTile[] = [];
  const placedPositions: HexCoord[] = [];

  for (const tileId of anomalyTileIds) {
    // Find a position that's not adjacent to any other anomaly
    for (const pos of availablePositions) {
      const posKey = `${pos.q},${pos.r}`;

      // Skip if already used
      if (result.some(t => t.position.q === pos.q && t.position.r === pos.r)) continue;
      if (existingTiles.some(t => t.position.q === pos.q && t.position.r === pos.r)) continue;

      // Check if adjacent to any existing anomaly
      const isAdjacentToAnomaly = [...existingTiles, ...result].some(t => {
        const sys = systems[t.systemId];
        return sys?.anomaly && areHexesAdjacent(t.position, pos);
      });

      if (!isAdjacentToAnomaly) {
        result.push(createMapTile(tileId, pos));
        placedPositions.push(pos);
        break;
      }
    }
  }

  return result;
}

/**
 * Place wormhole tiles ensuring same types aren't adjacent
 */
function spreadWormholes(
  wormholeTileIds: number[],
  availablePositions: HexCoord[],
  existingTiles: MapTile[]
): MapTile[] {
  const result: MapTile[] = [];

  for (const tileId of wormholeTileIds) {
    const tileSystem = systems[tileId];
    const wormholeType = tileSystem?.wormhole;

    if (!wormholeType) continue;

    for (const pos of availablePositions) {
      // Skip if already used
      if (result.some(t => t.position.q === pos.q && t.position.r === pos.r)) continue;
      if (existingTiles.some(t => t.position.q === pos.q && t.position.r === pos.r)) continue;

      // Check if adjacent to same wormhole type
      const isAdjacentToSameWormhole = [...existingTiles, ...result].some(t => {
        const sys = systems[t.systemId];
        return sys?.wormhole === wormholeType && areHexesAdjacent(t.position, pos);
      });

      if (!isAdjacentToSameWormhole) {
        result.push(createMapTile(tileId, pos));
        break;
      }
    }
  }

  return result;
}

/**
 * Assign tiles to positions while respecting adjacency rules
 */
function assignTilesWithValidation(
  tileIds: number[],
  positions: HexCoord[],
  existingTiles: MapTile[]
): MapTile[] {
  const result: MapTile[] = [];
  const usedTileIds = new Set<number>();
  const assignedPositions = new Set<string>();

  // Create a working copy of tiles
  const tiles = [...existingTiles];

  for (const position of positions) {
    const posKey = `${position.q},${position.r}`;
    if (assignedPositions.has(posKey)) continue;

    // Find a valid tile for this position
    for (const tileId of tileIds) {
      if (usedTileIds.has(tileId)) continue;

      const validation = validateTilePlacement(tileId, position, tiles);

      if (validation.valid) {
        const newTile = createMapTile(tileId, position);
        result.push(newTile);
        tiles.push(newTile);
        usedTileIds.add(tileId);
        assignedPositions.add(posKey);
        break;
      }
    }

    // If no valid tile found, use any remaining tile (fallback)
    if (!assignedPositions.has(posKey)) {
      for (const tileId of tileIds) {
        if (!usedTileIds.has(tileId)) {
          const newTile = createMapTile(tileId, position);
          result.push(newTile);
          tiles.push(newTile);
          usedTileIds.add(tileId);
          assignedPositions.add(posKey);
          console.warn(`Placed tile ${tileId} at ${posKey} despite validation issues`);
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Get home system IDs for faction IDs
 */
function getHomeSystemsForFactions(factionIds: string[]): Map<string, number> {
  const result = new Map<string, number>();

  for (const system of Object.values(systems)) {
    if (system.type === 'home' && system.factionId) {
      result.set(system.factionId, system.id);
    }
  }

  return result;
}

/**
 * Get all factions that have home systems defined
 */
export function getAvailableFactions(): string[] {
  return Object.values(systems)
    .filter(s => s.type === 'home' && s.factionId)
    .map(s => s.factionId!);
}

/**
 * Calculate optimal resource/influence values per slice
 * Used for balanced map generation
 */
export function calculateSliceValue(systemIds: number[]): {
  resources: number;
  influence: number;
  total: number;
  techSpecialties: string[];
} {
  let resources = 0;
  let influence = 0;
  const techSpecialties: string[] = [];

  for (const id of systemIds) {
    const system = systems[id];
    if (!system) continue;

    for (const planet of system.planets) {
      resources += planet.resources;
      influence += planet.influence;
      if (planet.techSpecialty) {
        techSpecialties.push(planet.techSpecialty);
      }
    }
  }

  return {
    resources,
    influence,
    total: resources + influence,
    techSpecialties,
  };
}

/**
 * Generate a balanced 6-player map with validated positions
 */
export function generateBalanced6PlayerMap(factionIds: string[], seed?: number): MapState {
  return generateMap(6, factionIds, { seed });
}

/**
 * Generate a simple test map for development
 */
export function generateTestMap(playerCount: number = 6): MapState {
  // Use default factions for testing
  const defaultFactions = ['sol', 'hacan', 'xxcha', 'letnev', 'sardakk', 'jolnar'].slice(0, playerCount);
  return generateMap(playerCount, defaultFactions, { seed: 12345 });
}
