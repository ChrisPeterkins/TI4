import type { HexCoord } from '@ti4/shared';

/**
 * Hex grid configuration
 */
export interface HexConfig {
  size: number; // Radius of hex (center to corner)
  orientation: 'pointy' | 'flat';
  origin: { x: number; y: number };
}

/**
 * Default hex configuration for TI4 board
 */
export const DEFAULT_HEX_CONFIG: HexConfig = {
  size: 60,
  orientation: 'pointy',
  origin: { x: 0, y: 0 },
};

/**
 * Convert axial hex coordinates to pixel coordinates
 */
export function hexToPixel(hex: HexCoord, config: HexConfig = DEFAULT_HEX_CONFIG): { x: number; y: number } {
  const { size, orientation, origin } = config;

  let x: number;
  let y: number;

  if (orientation === 'pointy') {
    x = size * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
    y = size * ((3 / 2) * hex.r);
  } else {
    x = size * ((3 / 2) * hex.q);
    y = size * ((Math.sqrt(3) / 2) * hex.q + Math.sqrt(3) * hex.r);
  }

  return {
    x: x + origin.x,
    y: y + origin.y,
  };
}

/**
 * Convert pixel coordinates to axial hex coordinates
 */
export function pixelToHex(pixel: { x: number; y: number }, config: HexConfig = DEFAULT_HEX_CONFIG): HexCoord {
  const { size, orientation, origin } = config;

  const px = pixel.x - origin.x;
  const py = pixel.y - origin.y;

  let q: number;
  let r: number;

  if (orientation === 'pointy') {
    q = ((Math.sqrt(3) / 3) * px - (1 / 3) * py) / size;
    r = ((2 / 3) * py) / size;
  } else {
    q = ((2 / 3) * px) / size;
    r = ((-1 / 3) * px + (Math.sqrt(3) / 3) * py) / size;
  }

  return hexRound({ q, r });
}

/**
 * Round fractional hex coordinates to nearest hex
 */
export function hexRound(hex: { q: number; r: number }): HexCoord {
  const s = -hex.q - hex.r;

  let rq = Math.round(hex.q);
  let rr = Math.round(hex.r);
  const rs = Math.round(s);

  const qDiff = Math.abs(rq - hex.q);
  const rDiff = Math.abs(rr - hex.r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

/**
 * Get the corner points of a hex for drawing
 */
export function getHexCorners(
  center: { x: number; y: number },
  size: number,
  orientation: 'pointy' | 'flat' = 'pointy'
): { x: number; y: number }[] {
  const corners: { x: number; y: number }[] = [];
  const startAngle = orientation === 'pointy' ? 30 : 0;

  for (let i = 0; i < 6; i++) {
    const angleDeg = startAngle + 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: center.x + size * Math.cos(angleRad),
      y: center.y + size * Math.sin(angleRad),
    });
  }

  return corners;
}

/**
 * Get hex dimensions
 */
export function getHexDimensions(size: number, orientation: 'pointy' | 'flat' = 'pointy'): { width: number; height: number } {
  if (orientation === 'pointy') {
    return {
      width: Math.sqrt(3) * size,
      height: 2 * size,
    };
  } else {
    return {
      width: 2 * size,
      height: Math.sqrt(3) * size,
    };
  }
}

/**
 * Calculate the bounding box for a set of hex coordinates
 */
export function getHexBounds(
  hexes: HexCoord[],
  config: HexConfig = DEFAULT_HEX_CONFIG
): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
  if (hexes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const pixels = hexes.map(hex => hexToPixel(hex, config));
  const { width: hexWidth, height: hexHeight } = getHexDimensions(config.size, config.orientation);

  const minX = Math.min(...pixels.map(p => p.x)) - hexWidth / 2;
  const maxX = Math.max(...pixels.map(p => p.x)) + hexWidth / 2;
  const minY = Math.min(...pixels.map(p => p.y)) - hexHeight / 2;
  const maxY = Math.max(...pixels.map(p => p.y)) + hexHeight / 2;

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Check if a point is inside a hex
 */
export function isPointInHex(
  point: { x: number; y: number },
  hexCenter: { x: number; y: number },
  size: number
): boolean {
  const dx = Math.abs(point.x - hexCenter.x);
  const dy = Math.abs(point.y - hexCenter.y);

  // Quick bounding box check
  const hexWidth = Math.sqrt(3) * size;
  const hexHeight = 2 * size;
  if (dx > hexWidth / 2 || dy > hexHeight / 2) {
    return false;
  }

  // More precise hex check
  return dy <= hexHeight / 2 - (hexHeight / 4) * (dx / (hexWidth / 2));
}

/**
 * Get adjacent hex positions
 */
export function getAdjacentHexes(hex: HexCoord): HexCoord[] {
  const directions: HexCoord[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
  ];

  return directions.map(dir => ({
    q: hex.q + dir.q,
    r: hex.r + dir.r,
  }));
}

/**
 * Calculate distance between two hexes
 */
export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/**
 * Hex direction vectors for the 6 directions
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
 * Get a single hex in a specific direction from origin
 */
export function hexInDirection(hex: HexCoord, direction: number, distance: number = 1): HexCoord {
  const dir = HEX_DIRECTIONS[direction % 6];
  return {
    q: hex.q + dir.q * distance,
    r: hex.r + dir.r * distance,
  };
}

/**
 * Generate all hex positions in a specific ring around center
 * Ring 0 = just the center
 * Ring 1 = 6 hexes
 * Ring 2 = 12 hexes
 * Ring 3 = 18 hexes
 * etc.
 */
export function getHexRing(center: HexCoord, ring: number): HexCoord[] {
  if (ring === 0) {
    return [center];
  }

  const results: HexCoord[] = [];

  // Start at the hex that is `ring` steps in direction 4 (Southwest)
  let hex: HexCoord = { q: center.q, r: center.r };
  for (let i = 0; i < ring; i++) {
    hex = hexInDirection(hex, 4); // Move southwest
  }

  // Walk around the ring in all 6 directions
  for (let direction = 0; direction < 6; direction++) {
    for (let step = 0; step < ring; step++) {
      results.push({ ...hex });
      hex = hexInDirection(hex, direction);
    }
  }

  return results;
}

/**
 * Generate all hex positions from center out to a specific ring (inclusive)
 */
export function getHexSpiral(center: HexCoord, maxRing: number): HexCoord[] {
  const results: HexCoord[] = [];

  for (let ring = 0; ring <= maxRing; ring++) {
    results.push(...getHexRing(center, ring));
  }

  return results;
}

/**
 * Get the ring number of a hex relative to center
 */
export function getHexRingNumber(hex: HexCoord, center: HexCoord = { q: 0, r: 0 }): number {
  return hexDistance(hex, center);
}

/**
 * Get the position index within a ring (0-based)
 * For ring 1: 0-5 (6 positions)
 * For ring 2: 0-11 (12 positions)
 * For ring 3: 0-17 (18 positions)
 */
export function getPositionInRing(hex: HexCoord, center: HexCoord = { q: 0, r: 0 }): number {
  const ring = getHexRingNumber(hex, center);
  if (ring === 0) return 0;

  const ringPositions = getHexRing(center, ring);
  return ringPositions.findIndex(pos => pos.q === hex.q && pos.r === hex.r);
}

/**
 * Check if two hexes are adjacent
 */
export function areHexesAdjacent(a: HexCoord, b: HexCoord): boolean {
  return hexDistance(a, b) === 1;
}

/**
 * TI4-specific: Get home system positions for a given player count
 * Returns positions in ring 3 for 3-6 players, ring 3-4 for 7-8 players
 */
export function getHomeSystemPositions(playerCount: number): HexCoord[] {
  const center: HexCoord = { q: 0, r: 0 };

  // 7-8 player games use an extended map with home systems in layers 3 and 4
  if (playerCount === 7) {
    // 7-player: homes at layer 3 azimuth 3,6 and layer 4 azimuth 0,12,15,18,21
    // Based on ti4-cartographer data: (3,3), (3,6), (4,0), (4,12), (4,15), (4,18), (4,21)
    const ring3 = getHexRing(center, 3);
    const ring4 = getHexRing(center, 4);
    return [
      ring3[3],   // Player 1
      ring3[6],   // Player 2
      ring4[0],   // Player 3
      ring4[12],  // Player 4
      ring4[15],  // Player 5
      ring4[18],  // Player 6
      ring4[21],  // Player 7
    ];
  }

  if (playerCount === 8) {
    // 8-player: all homes in layer 4, evenly distributed
    // Based on ti4-cartographer: (4,0), (4,3), (4,6), (4,9), (4,12), (4,15), (4,18), (4,21)
    const ring4 = getHexRing(center, 4);
    return [
      ring4[0],   // Player 1
      ring4[3],   // Player 2
      ring4[6],   // Player 3
      ring4[9],   // Player 4
      ring4[12],  // Player 5
      ring4[15],  // Player 6
      ring4[18],  // Player 7
      ring4[21],  // Player 8
    ];
  }

  // Standard 3-6 player layout uses ring 3
  const ring3 = getHexRing(center, 3);

  // Ring 3 has 18 positions, home systems are evenly distributed
  // Position indices for different player counts
  const homePositionIndices: Record<number, number[]> = {
    3: [0, 6, 12],           // Every 6th position (3 positions)
    4: [0, 5, 9, 14],        // 4 positions
    5: [0, 4, 7, 11, 14],    // 5 positions
    6: [0, 3, 6, 9, 12, 15], // Every 3rd position (6 positions)
  };

  const indices = homePositionIndices[playerCount] ?? homePositionIndices[6];
  return indices.map(i => ring3[i]);
}

/**
 * TI4-specific: Get the "slice" positions for a player
 * Each player controls tiles adjacent to their home system
 */
export function getPlayerSlicePositions(
  homePosition: HexCoord,
  playerIndex: number,
  playerCount: number
): { ring1: HexCoord[]; ring2: HexCoord[] } {
  const center: HexCoord = { q: 0, r: 0 };

  // Get all ring positions
  const ring1 = getHexRing(center, 1);
  const ring2 = getHexRing(center, 2);

  // Find positions that are closer to this home system than others
  // This is a simplified approach - actual slices depend on map layout
  const allHomePositions = getHomeSystemPositions(playerCount);

  const isCloserToThisHome = (pos: HexCoord): boolean => {
    const distToHome = hexDistance(pos, homePosition);
    for (const otherHome of allHomePositions) {
      if (otherHome.q === homePosition.q && otherHome.r === homePosition.r) continue;
      if (hexDistance(pos, otherHome) < distToHome) return false;
    }
    return true;
  };

  return {
    ring1: ring1.filter(isCloserToThisHome),
    ring2: ring2.filter(isCloserToThisHome),
  };
}
