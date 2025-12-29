import { Assets, Texture } from 'pixi.js';

/**
 * Asset paths configuration
 */
const ASSET_BASE = '/assets';
const TILES_PATH = `${ASSET_BASE}/tiles`;
const UNITS_PATH = `${ASSET_BASE}/units`;

/**
 * Tile texture cache
 */
const tileTextureCache = new Map<number, Texture>();
let assetsInitialized = false;

/**
 * Get the tile filename for a given system ID
 * Most tiles use ST_{id}.webp, but some need special handling
 */
function getTileFilename(systemId: number): string {
  // System IDs map directly to tile numbers
  return `ST_${systemId}.webp`;
}

/**
 * Load a single tile texture
 */
export async function loadTileTexture(systemId: number): Promise<Texture> {
  // Check cache first
  const cached = tileTextureCache.get(systemId);
  if (cached) return cached;

  const filename = getTileFilename(systemId);
  const url = `${TILES_PATH}/${filename}`;

  try {
    const texture = await Assets.load<Texture>(url);
    tileTextureCache.set(systemId, texture);
    return texture;
  } catch (error) {
    console.warn(`Failed to load tile texture for system ${systemId}:`, error);
    // Return a placeholder texture or throw
    throw new Error(`Failed to load tile ${systemId}`);
  }
}

/**
 * Preload all tile textures used in a game
 */
export async function preloadTileTextures(systemIds: number[]): Promise<void> {
  const uniqueIds = [...new Set(systemIds)];
  const urls: Record<string, string> = {};

  for (const id of uniqueIds) {
    if (!tileTextureCache.has(id)) {
      const filename = getTileFilename(id);
      urls[`tile-${id}`] = `${TILES_PATH}/${filename}`;
    }
  }

  if (Object.keys(urls).length === 0) return;

  // Add all URLs to the asset bundle
  Assets.addBundle('tiles', urls);
  const textures = await Assets.loadBundle('tiles');

  // Cache the loaded textures
  for (const id of uniqueIds) {
    const key = `tile-${id}`;
    if (textures[key]) {
      tileTextureCache.set(id, textures[key]);
    }
  }
}

/**
 * Get a cached tile texture (must be preloaded first)
 */
export function getTileTexture(systemId: number): Texture | undefined {
  return tileTextureCache.get(systemId);
}

/**
 * Check if a tile texture is loaded
 */
export function isTileTextureLoaded(systemId: number): boolean {
  return tileTextureCache.has(systemId);
}

/**
 * Clear all cached textures
 */
export function clearTextureCache(): void {
  tileTextureCache.clear();
}

/**
 * Unit asset types
 */
export type UnitAssetType =
  | 'fighter'
  | 'infantry'
  | 'mech'
  | 'destroyer'
  | 'carrier'
  | 'cruiser'
  | 'dreadnought'
  | 'war_sun'
  | 'flagship'
  | 'pds'
  | 'space_dock';

/**
 * Unit texture cache (keyed by unit type and color)
 */
const unitTextureCache = new Map<string, Texture>();

/**
 * Get unit asset URL from wiki
 * Note: Unit plastics don't have color variants - we'll tint them
 */
export function getUnitAssetUrl(unitType: UnitAssetType): string {
  // Unit type to wiki filename mapping
  const unitFilenames: Record<UnitAssetType, string> = {
    fighter: 'Fighter_Plastic',
    infantry: 'Infantry_Plastic',
    mech: 'Mech_Plastic',
    destroyer: 'Destroyer_Plastic',
    carrier: 'Carrier_Plastic',
    cruiser: 'Cruiser_Plastic',
    dreadnought: 'Dreadnought_Plastic',
    war_sun: 'War_Sun_Plastic',
    flagship: 'Flagship_Plastic',
    pds: 'PDS_Plastic',
    space_dock: 'Space_Dock_Plastic',
  };

  const filename = unitFilenames[unitType];
  return `${UNITS_PATH}/${filename}.png`;
}

/**
 * Load a unit texture
 */
export async function loadUnitTexture(unitType: UnitAssetType): Promise<Texture> {
  const cacheKey = unitType;
  const cached = unitTextureCache.get(cacheKey);
  if (cached) return cached;

  const url = getUnitAssetUrl(unitType);

  try {
    const texture = await Assets.load<Texture>(url);
    unitTextureCache.set(cacheKey, texture);
    return texture;
  } catch (error) {
    console.warn(`Failed to load unit texture for ${unitType}:`, error);
    throw new Error(`Failed to load unit ${unitType}`);
  }
}

/**
 * Preload all unit textures
 */
export async function preloadUnitTextures(): Promise<void> {
  const unitTypes: UnitAssetType[] = [
    'fighter',
    'infantry',
    'mech',
    'destroyer',
    'carrier',
    'cruiser',
    'dreadnought',
    'war_sun',
    'flagship',
    'pds',
    'space_dock',
  ];

  const urls: Record<string, string> = {};
  for (const type of unitTypes) {
    urls[type] = getUnitAssetUrl(type);
  }

  Assets.addBundle('units', urls);

  try {
    const textures = await Assets.loadBundle('units');
    for (const type of unitTypes) {
      if (textures[type]) {
        unitTextureCache.set(type, textures[type]);
      }
    }
  } catch (error) {
    console.warn('Some unit textures failed to load:', error);
  }
}

/**
 * Get cached unit texture
 */
export function getUnitTexture(unitType: UnitAssetType): Texture | undefined {
  return unitTextureCache.get(unitType);
}
