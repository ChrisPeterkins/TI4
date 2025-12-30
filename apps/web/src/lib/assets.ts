import { Assets, Texture } from 'pixi.js';

/**
 * Asset paths configuration
 * Assets are now organized in /images/ with the following structure:
 * - /images/tiles/ - System tiles from KeeganW (webp)
 * - /images/tiles-ttpg/ - System tiles from TTPG (jpg)
 * - /images/units/ - Unit icons (png)
 * - /images/faction-icons/ - Faction symbols (png)
 * - /images/faction-sheets/ - Full faction sheets (jpg)
 * - /images/command-tokens/ - Command tokens per faction (png)
 * - /images/strategy-cards-png/ - Strategy card images (png)
 * - /images/technology/ - Technology cards (jpg)
 * - /images/cards/ - All other game cards (action, agenda, objective, etc.)
 * - /images/tokens/ - Misc tokens (trade goods, commodities, etc.)
 */
const IMAGES_BASE = '/images';
const TILES_PATH = `${IMAGES_BASE}/tiles`;
const UNITS_PATH = `${IMAGES_BASE}/units`;
const FACTION_ICONS_PATH = `${IMAGES_BASE}/faction-icons`;
const FACTION_SHEETS_PATH = `${IMAGES_BASE}/faction-sheets`;
const COMMAND_TOKENS_PATH = `${IMAGES_BASE}/command-tokens`;
const STRATEGY_CARDS_PATH = `${IMAGES_BASE}/strategy-cards-png`;
const TECHNOLOGY_PATH = `${IMAGES_BASE}/technology`;
const CARDS_PATH = `${IMAGES_BASE}/cards`;
const TOKENS_PATH = `${IMAGES_BASE}/tokens`;

/**
 * Tile texture cache
 */
const tileTextureCache = new Map<number, Texture>();

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
 * Uses simple individual asset loading to avoid bundle registration issues
 */
export async function preloadTileTextures(systemIds: number[]): Promise<void> {
  const uniqueIds = [...new Set(systemIds)];
  const idsToLoad = uniqueIds.filter(id => !tileTextureCache.has(id));

  if (idsToLoad.length === 0) {
    console.log('[Assets] All tile textures already cached');
    return;
  }

  console.log('[Assets] Loading', idsToLoad.length, 'tile textures...');

  // Load textures individually using Promise.all for parallelism
  const loadPromises = idsToLoad.map(async (id) => {
    const filename = getTileFilename(id);
    const url = `${TILES_PATH}/${filename}`;
    try {
      const texture = await Assets.load<Texture>(url);
      tileTextureCache.set(id, texture);
      return { id, success: true };
    } catch (error) {
      console.warn(`[Assets] Failed to load tile ${id}:`, error);
      return { id, success: false };
    }
  });

  const results = await Promise.all(loadPromises);
  const loaded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`[Assets] Tile textures loaded: ${loaded} success, ${failed} failed`);
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
 * Get unit asset URL
 * Note: Unit plastics don't have color variants - we'll tint them
 */
export function getUnitAssetUrl(unitType: UnitAssetType): string {
  // Unit type to filename mapping (lowercase, no suffixes)
  const unitFilenames: Record<UnitAssetType, string> = {
    fighter: 'fighter',
    infantry: 'infantry',
    mech: 'infantry', // Fallback - no mech image yet
    destroyer: 'destroyer',
    carrier: 'carrier',
    cruiser: 'cruiser',
    dreadnought: 'dreadnought',
    war_sun: 'warsun',
    flagship: 'flagship',
    pds: 'pds',
    space_dock: 'spacedock',
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
 * Uses simple individual asset loading to avoid bundle registration issues
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

  const typesToLoad = unitTypes.filter(type => !unitTextureCache.has(type));

  if (typesToLoad.length === 0) {
    console.log('[Assets] All unit textures already cached');
    return;
  }

  console.log('[Assets] Loading', typesToLoad.length, 'unit textures...');

  const loadPromises = typesToLoad.map(async (type) => {
    const url = getUnitAssetUrl(type);
    try {
      const texture = await Assets.load<Texture>(url);
      unitTextureCache.set(type, texture);
      return { type, success: true };
    } catch (error) {
      console.warn(`[Assets] Failed to load unit ${type}:`, error);
      return { type, success: false };
    }
  });

  const results = await Promise.all(loadPromises);
  const loaded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`[Assets] Unit textures loaded: ${loaded} success, ${failed} failed`);
}

/**
 * Get cached unit texture
 */
export function getUnitTexture(unitType: UnitAssetType): Texture | undefined {
  return unitTextureCache.get(unitType);
}

// =============================================================================
// FACTION ASSETS
// =============================================================================

/**
 * Faction ID to icon filename mapping
 * Some factions have different naming conventions
 */
const FACTION_ICON_NAMES: Record<string, string> = {
  arborec: 'arborec',
  argent: 'argent',
  creuss: 'creuss',
  empyrean: 'empyrean',
  hacan: 'hacan',
  jolnar: 'jolnar',
  keleres: 'keleres',
  keleres_argent: 'keleres_argent',
  keleres_mentak: 'keleres_mentak',
  keleres_xxcha: 'keleres_xxcha',
  l1z1x: 'l1z1x',
  letnev: 'letnev',
  mahact: 'mahact',
  mentak: 'mentak',
  muaat: 'muaat',
  naalu: 'naalu',
  naazrokha: 'naazrokha',
  nekro: 'nekro',
  nomad: 'nomad',
  norr: 'norr',
  sardakk: 'norr', // Sardakk N'orr - maps to norr
  saar: 'saar',
  sol: 'sol',
  titans: 'ul', // Titans of Ul - maps to ul
  ul: 'ul',
  vuilraith: 'vuilraith',
  winnu: 'winnu',
  xxcha: 'xxcha',
  yin: 'yin',
  yssaril: 'yssaril',
};

/**
 * Get faction icon URL
 */
export function getFactionIconUrl(factionId: string): string {
  const iconName = FACTION_ICON_NAMES[factionId] || factionId;
  return `${FACTION_ICONS_PATH}/${iconName}_icon.png`;
}

/**
 * Get faction sheet URL (face or back)
 */
export function getFactionSheetUrl(factionId: string, side: 'face' | 'back' = 'face'): string {
  const iconName = FACTION_ICON_NAMES[factionId] || factionId;
  return `${FACTION_SHEETS_PATH}/${iconName}.${side}.jpg`;
}

/**
 * Command token filename mapping
 * Command tokens use faction IDs directly (sardakk.png, titans.png)
 * unlike faction sheets which use shortened names (norr, ul)
 */
const COMMAND_TOKEN_NAMES: Record<string, string> = {
  // Handle alternate faction ID formats
  norr: 'sardakk', // norr maps back to sardakk for command tokens
  ul: 'titans', // ul maps back to titans for command tokens
  naazrokha: 'nazrokha', // Different spelling in token files
  empyrean: 'empyrian', // Different spelling in token files
};

/**
 * Get command token URL for a faction
 */
export function getCommandTokenUrl(factionId: string): string {
  const tokenName = COMMAND_TOKEN_NAMES[factionId] || factionId;
  return `${COMMAND_TOKENS_PATH}/${tokenName}.png`;
}

// =============================================================================
// STRATEGY CARD ASSETS
// =============================================================================

/**
 * Strategy card initiative to name mapping
 */
const STRATEGY_CARD_NAMES: Record<number, string> = {
  1: 'leadership',
  2: 'diplomacy',
  3: 'politics',
  4: 'construction',
  5: 'trade',
  6: 'warfare',
  7: 'technology',
  8: 'imperial',
};

/**
 * Get strategy card image URL
 * Strategy cards are numbered 1-8 (Leadership through Imperial)
 */
export function getStrategyCardUrl(initiative: number): string {
  const cardName = STRATEGY_CARD_NAMES[initiative] || 'leadership';
  return `${IMAGES_BASE}/strategy-cards/${cardName}.png`;
}

// =============================================================================
// TECHNOLOGY CARD ASSETS
// =============================================================================

/**
 * Get technology card image URL
 * Handles _ii to _2 conversion for unit upgrades
 */
export function getTechnologyCardUrl(techId: string): string {
  // Convert _ii suffix to _2 for unit upgrades
  let imageId = techId.replace(/_ii$/, '_2');
  // Handle special cases
  if (techId === 'light_wave_deflector') {
    imageId = 'lightwave_deflector';
  }
  return `${TECHNOLOGY_PATH}/${imageId}.jpg`;
}

// =============================================================================
// GAME CARD ASSETS
// =============================================================================

export type CardType =
  | 'action'
  | 'agenda'
  | 'objective'
  | 'exploration'
  | 'relic'
  | 'leader'
  | 'promissory'
  | 'planet'
  | 'alliance';

/**
 * Get game card image URL
 */
/**
 * Player colors that may be suffixed to promissory note IDs
 */
const PLAYER_COLOR_SUFFIXES = [
  '_blue', '_red', '_yellow', '_green', '_purple', '_orange', '_pink', '_black'
];

/**
 * Strip player color suffix from a promissory note ID
 * e.g., "support_for_the_throne_blue" -> "support_for_the_throne"
 */
function stripColorSuffix(cardId: string): string {
  for (const suffix of PLAYER_COLOR_SUFFIXES) {
    if (cardId.endsWith(suffix)) {
      return cardId.slice(0, -suffix.length);
    }
  }
  return cardId;
}

export function getCardUrl(cardType: CardType, cardId: string): string {
  // Promissory notes have color suffixes in game data but not in image filenames
  const imageId = cardType === 'promissory' ? stripColorSuffix(cardId) : cardId;
  return `${CARDS_PATH}/${cardType}/${imageId}.jpg`;
}

// =============================================================================
// CARD BACK ASSETS
// =============================================================================

const CARD_BACKS_PATH = `${IMAGES_BASE}/card-backs`;

/**
 * Get action card back URL
 */
export function getActionCardBackUrl(): string {
  return `${CARD_BACKS_PATH}/action.png`;
}

/**
 * Get agenda card back URL
 */
export function getAgendaCardBackUrl(): string {
  return `${CARD_BACKS_PATH}/agenda.png`;
}

/**
 * Get objective card back URL
 * @param tier - 'stage1' or 'stage2' for different tiers
 */
export function getObjectiveCardBackUrl(tier: 'stage1' | 'stage2' = 'stage1'): string {
  return `${CARD_BACKS_PATH}/objective_${tier}.png`;
}

/**
 * Get exploration card back URL
 * @param type - 'cultural', 'hazardous', 'industrial', or 'frontier'
 */
export function getExplorationCardBackUrl(
  type: 'cultural' | 'hazardous' | 'industrial' | 'frontier' = 'cultural'
): string {
  return `${CARD_BACKS_PATH}/exploration_${type}.png`;
}

/**
 * Get relic card back URL
 */
export function getRelicCardBackUrl(): string {
  return `${CARD_BACKS_PATH}/relic.png`;
}

/**
 * Get promissory note back URL
 * @param factionId - faction ID for faction-specific backs, or 'generic' for standard
 */
export function getPromissoryCardBackUrl(factionId?: string): string {
  if (factionId) {
    return `${CARD_BACKS_PATH}/promissory_${factionId}.png`;
  }
  return `${CARD_BACKS_PATH}/promissory.png`;
}

/**
 * Get secret objective card back URL
 */
export function getSecretObjectiveCardBackUrl(): string {
  return `${CARD_BACKS_PATH}/secret_objective.png`;
}

/**
 * Generic card back for fallback
 */
export function getGenericCardBackUrl(): string {
  return `${CARD_BACKS_PATH}/generic.png`;
}

// =============================================================================
// TOKEN ASSETS
// =============================================================================

/**
 * Get trade good token URL
 */
export function getTradeGoodTokenUrl(): string {
  return `${TOKENS_PATH}/tradegood_1_c.png`;
}

/**
 * Get commodity token URL
 */
export function getCommodityTokenUrl(): string {
  return `${TOKENS_PATH}/commodity_1_c.png`;
}

/**
 * Get fighter token URL
 */
export function getFighterTokenUrl(): string {
  return `${TOKENS_PATH}/fighter_1_c.png`;
}

/**
 * Get infantry token URL
 */
export function getInfantryTokenUrl(): string {
  return `${TOKENS_PATH}/infantry_1_c.png`;
}

// =============================================================================
// 3D MODEL ASSETS
// =============================================================================

const MODELS_BASE = '/models';
const TOKEN_MODELS_PATH = `${MODELS_BASE}/tokens`;
const MAT_MODELS_PATH = `${MODELS_BASE}/mats`;
const UNIT_MODELS_PATH = `${MODELS_BASE}/units`;

/**
 * Get command token 3D model URL
 */
export function getCommandTokenModelUrl(): string {
  return `${TOKEN_MODELS_PATH}/command_token.obj`;
}

/**
 * Get round token 3D model URL (for TG, commodities, etc.)
 */
export function getRoundTokenModelUrl(): string {
  return `${TOKEN_MODELS_PATH}/round_token.obj`;
}

/**
 * Get scoreboard 3D model URL
 */
export function getScoreboardModelUrl(): string {
  return `${TOKEN_MODELS_PATH}/scoreboard.obj`;
}

/**
 * Get unit 3D model URL
 */
export function getUnitModelUrl(unitType: UnitAssetType): string {
  const modelFilenames: Record<UnitAssetType, string> = {
    fighter: 'fighter',
    infantry: 'infantry',
    mech: 'infantry', // Fallback until mech model exists
    destroyer: 'destroyer',
    carrier: 'carrier',
    cruiser: 'cruiser',
    dreadnought: 'dreadnought',
    war_sun: 'warsun',
    flagship: 'flagship',
    pds: 'pds',
    space_dock: 'spacedock',
  };
  const filename = modelFilenames[unitType];
  return `${UNIT_MODELS_PATH}/${filename}.obj`;
}

// =============================================================================
// PLAYMAT TEXTURE ASSETS
// =============================================================================

const MATS_PATH = `${IMAGES_BASE}/mats`;

export type PlaymatType = 'build_area' | 'tech_board' | 'planet_board' | 'secrets_mat' | 'exploration_mat';

/**
 * Get playmat texture URL
 */
export function getPlaymatTextureUrl(type: PlaymatType): string {
  const extensions: Record<PlaymatType, string> = {
    build_area: 'png',
    tech_board: 'jpg',
    planet_board: 'jpg',
    secrets_mat: 'jpg',
    exploration_mat: 'jpg',
  };
  return `${MATS_PATH}/${type}.${extensions[type]}`;
}

// =============================================================================
// PLANET CARD ASSETS
// =============================================================================

/**
 * Get planet card image URL
 */
export function getPlanetCardUrl(planetId: string): string {
  return `${CARDS_PATH}/planet/${planetId}.jpg`;
}

// =============================================================================
// SECRET OBJECTIVE ASSETS
// =============================================================================

/**
 * Get secret objective card image URL
 */
export function getSecretObjectiveCardUrl(objectiveId: string): string {
  return `${CARDS_PATH}/objective/${objectiveId}.jpg`;
}

// =============================================================================
// LEADER CARD ASSETS (PoK)
// =============================================================================

/**
 * Get leader card image URL
 */
export function getLeaderCardUrl(leaderId: string): string {
  return `${CARDS_PATH}/leader/${leaderId}.jpg`;
}

// =============================================================================
// EXPLORATION CARD ASSETS (PoK)
// =============================================================================

/**
 * Get exploration card image URL
 */
export function getExplorationCardUrl(cardId: string): string {
  return `${CARDS_PATH}/exploration/${cardId}.jpg`;
}

// =============================================================================
// RELIC CARD ASSETS (PoK)
// =============================================================================

/**
 * Get relic card image URL
 */
export function getRelicCardUrl(relicId: string): string {
  return `${CARDS_PATH}/relic/${relicId}.jpg`;
}
