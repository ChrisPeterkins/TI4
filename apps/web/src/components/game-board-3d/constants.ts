import type { PlayerColor } from '@ti4/shared';

/**
 * 3D Hex tile configuration
 */
export const HEX_CONFIG = {
  /** Radius of hexagon (distance from center to corner) */
  radius: 1,
  /** Height/thickness of hexagon */
  height: 0.1,
  /** Gap between hexagons */
  gap: 0.02,
  /** Rotation for flat-top orientation (degrees) */
  rotation: 30,
};

/**
 * Camera configuration
 */
export const CAMERA_CONFIG = {
  /** Initial camera position */
  position: { x: 0, y: 15, z: 12 },
  /** Camera target (look at point) */
  target: { x: 0, y: 0, z: 0 },
  /** Field of view */
  fov: 60,
  /** Near clipping plane */
  near: 0.1,
  /** Far clipping plane */
  far: 1000,
  /** Min zoom distance */
  minDistance: 5,
  /** Max zoom distance */
  maxDistance: 50,
  /** Max polar angle (prevents going under board) */
  maxPolarAngle: Math.PI / 2.2,
};

/**
 * Player color hex values for 3D materials
 */
export const PLAYER_COLORS_3D: Record<PlayerColor, string> = {
  red: '#e53935',
  blue: '#1e88e5',
  yellow: '#fdd835',
  green: '#43a047',
  purple: '#8e24aa',
  orange: '#fb8c00',
  pink: '#ec407a',
  black: '#424242',
};

/**
 * Unit model paths
 */
export const UNIT_MODEL_PATHS: Record<string, string> = {
  carrier: '/models/units/carrier.obj',
  cruiser: '/models/units/cruiser.obj',
  destroyer: '/models/units/destroyer.obj',
  dreadnought: '/models/units/dreadnought.obj',
  fighter: '/models/units/fighter.obj',
  flagship: '/models/units/flagship.obj',
  infantry: '/models/units/infantry.obj',
  pds: '/models/units/pds.obj',
  space_dock: '/models/units/spacedock.obj',
  war_sun: '/models/units/warsun.obj',
  mech: '/models/units/infantry.obj', // Fallback to infantry
};

/**
 * Unit scale factors (models need different scaling)
 */
export const UNIT_SCALES: Record<string, number> = {
  carrier: 0.08,
  cruiser: 0.06,
  destroyer: 0.05,
  dreadnought: 0.1,
  fighter: 0.03,
  flagship: 0.12,
  infantry: 0.04,
  mech: 0.05,
  pds: 0.04,
  space_dock: 0.08,
  war_sun: 0.12,
};

/**
 * Unit height above tile (for space units)
 */
export const UNIT_HOVER_HEIGHT = 0.3;

/**
 * Tile side colors (dark space material)
 */
export const TILE_SIDE_COLOR = '#1a1a2e';

/**
 * Highlight colors for tiles
 */
export const HIGHLIGHT_COLORS = {
  hover: '#ffffff',
  selected: '#00ff00',
  valid: '#00ff00',
  invalid: '#ff0000',
};
