/**
 * Last Bastion Faction Ability Handlers
 *
 * Key mechanics:
 * - GALVANIZE: Place galvanize tokens on units for extra combat dice
 * - LIBERATE: Ready planets or place infantry when gaining control
 * - PHOENIX STANDARD: After combat, galvanize 1 participating unit
 */

import type {
  GameState,
  PlayerState,
  UnitInstance,
  MapTile,
  PlanetInstance,
} from '@ti4/shared';

// ============================================================================
// Types
// ============================================================================

export interface HandlerResult {
  success: boolean;
  error?: string;
  triggeredEvents?: string[];
  data?: Record<string, unknown>;
}

export interface GalvanizeAction {
  type: 'galvanize';
  playerId: string;
  unitId: string;
}

export interface LiberateAction {
  type: 'liberate';
  playerId: string;
  planetId: string;
}

// ============================================================================
// Galvanize Token Management
// ============================================================================

/**
 * Check if a unit is galvanized
 */
export function isUnitGalvanized(state: GameState, playerId: string, unitId: string): boolean {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) return false;

  return player.galvanizeTokens?.includes(unitId) ?? false;
}

/**
 * Get all galvanized units for a player
 */
export function getGalvanizedUnits(state: GameState, playerId: string): string[] {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) return [];

  return player.galvanizeTokens ?? [];
}

/**
 * Count galvanized units in a specific location
 */
export function countGalvanizedUnitsInSystem(
  state: GameState,
  playerId: string,
  systemId: string
): number {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player?.galvanizeTokens) return 0;

  const tile = state.map.tiles.find((t: MapTile) => t.id === systemId);
  if (!tile) return 0;

  // Count space units
  const spaceUnits = tile.units.filter(
    (u: UnitInstance) => u.ownerId === playerId && player.galvanizeTokens?.includes(u.id)
  ).length;

  // Count planet units
  const planetUnits = tile.planets.reduce((count: number, p: PlanetInstance) => {
    return count + p.units.filter(
      (u: UnitInstance) => u.ownerId === playerId && player.galvanizeTokens?.includes(u.id)
    ).length;
  }, 0);

  return spaceUnits + planetUnits;
}

/**
 * Galvanize a unit (place galvanize token)
 * Galvanized units roll 1 additional die during combat
 */
export function handleGalvanize(
  state: GameState,
  action: GalvanizeAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Last Bastion
  if (player.faction !== 'last_bastion') {
    return { success: false, error: 'Only Last Bastion can galvanize units' };
  }

  // Find the unit
  const unit = findUnitById(state, action.unitId);
  if (!unit) {
    return { success: false, error: 'Unit not found' };
  }

  // Verify unit belongs to player
  if (unit.ownerId !== action.playerId) {
    return { success: false, error: 'Unit does not belong to player' };
  }

  // Check if already galvanized
  if (!player.galvanizeTokens) {
    player.galvanizeTokens = [];
  }

  if (player.galvanizeTokens.includes(action.unitId)) {
    return { success: false, error: 'Unit is already galvanized' };
  }

  // Apply galvanize token
  player.galvanizeTokens.push(action.unitId);

  return {
    success: true,
    triggeredEvents: ['unit_galvanized'],
    data: {
      playerId: action.playerId,
      unitId: action.unitId,
      unitType: unit.type,
    },
  };
}

/**
 * Remove galvanize token from a unit
 * Called when unit is destroyed or token is removed by ability
 */
export function removeGalvanizeToken(
  state: GameState,
  playerId: string,
  unitId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!player.galvanizeTokens) {
    return { success: false, error: 'No galvanize tokens to remove' };
  }

  const tokenIndex = player.galvanizeTokens.indexOf(unitId);
  if (tokenIndex === -1) {
    return { success: false, error: 'Unit is not galvanized' };
  }

  player.galvanizeTokens.splice(tokenIndex, 1);

  return {
    success: true,
    triggeredEvents: ['galvanize_token_removed'],
    data: { playerId, unitId },
  };
}

/**
 * Get combat dice bonus for galvanized units
 * Returns extra dice count for a unit
 */
export function getGalvanizeCombatBonus(
  state: GameState,
  playerId: string,
  unitId: string
): number {
  if (isUnitGalvanized(state, playerId, unitId)) {
    return 1; // Galvanized units roll 1 additional die
  }
  return 0;
}

/**
 * Get bombardment damage reduction from galvanized units
 * Cancel 1 hit for each galvanized unit present
 */
export function getGalvanizeBombardmentReduction(
  state: GameState,
  playerId: string,
  planetId: string
): number {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player?.galvanizeTokens || player.faction !== 'last_bastion') return 0;

  // Find the planet and count galvanized ground forces
  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p: PlanetInstance) => p.id === planetId);
    if (planet) {
      const galvanizedCount = planet.units.filter(
        (u: UnitInstance) => u.ownerId === playerId && player.galvanizeTokens?.includes(u.id)
      ).length;
      return galvanizedCount;
    }
  }

  return 0;
}

// ============================================================================
// Liberate Ability
// ============================================================================

/**
 * Handle LIBERATE ability when gaining control of a planet
 * If infantry count >= planet resources, ready the planet
 * Otherwise, place 1 infantry from reinforcements
 */
export function handleLiberate(
  state: GameState,
  action: LiberateAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Last Bastion
  if (player.faction !== 'last_bastion') {
    return { success: false, error: 'Only Last Bastion can use Liberate' };
  }

  // Find the planet
  let planetTile: MapTile | undefined;
  let planetInstance: PlanetInstance | undefined;

  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p: PlanetInstance) => p.id === action.planetId);
    if (planet) {
      planetTile = tile;
      planetInstance = planet;
      break;
    }
  }

  if (!planetTile || !planetInstance) {
    return { success: false, error: 'Planet not found' };
  }

  // Verify player controls the planet
  if (planetInstance.controlledBy !== action.playerId) {
    return { success: false, error: 'Player does not control this planet' };
  }

  // Count infantry on the planet
  const infantryCount = planetInstance.units.filter(
    (u: UnitInstance) => u.ownerId === action.playerId && u.type === 'infantry'
  ).length;

  // Get planet resource value (would need planet data lookup in real implementation)
  const planetResources = getPlanetResources(action.planetId);

  const triggeredEvents: string[] = ['liberate_triggered'];
  const result: Record<string, unknown> = {
    playerId: action.playerId,
    planetId: action.planetId,
    infantryCount,
    planetResources,
  };

  if (infantryCount >= planetResources) {
    // Ready the planet
    const playerPlanet = player.planets.find(p => p.planetId === action.planetId);
    if (playerPlanet) {
      playerPlanet.exhausted = false;
      triggeredEvents.push('planet_readied');
      result.action = 'ready';
    }
  } else {
    // Place 1 infantry from reinforcements
    const newInfantry: UnitInstance = {
      id: generateUnitId(),
      type: 'infantry',
      ownerId: action.playerId,
      damaged: false,
      planetId: action.planetId,
    };
    planetInstance.units.push(newInfantry);
    triggeredEvents.push('infantry_placed');
    result.action = 'place_infantry';
    result.newUnitId = newInfantry.id;
  }

  return {
    success: true,
    triggeredEvents,
    data: result,
  };
}

// ============================================================================
// Phoenix Standard Ability
// ============================================================================

/**
 * Handle PHOENIX STANDARD ability after combat
 * After combat, may galvanize 1 participating unit
 */
export function handlePhoenixStandard(
  state: GameState,
  playerId: string,
  unitId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Last Bastion
  if (player.faction !== 'last_bastion') {
    return { success: false, error: 'Only Last Bastion can use Phoenix Standard' };
  }

  // Use galvanize handler
  return handleGalvanize(state, {
    type: 'galvanize',
    playerId,
    unitId,
  });
}

/**
 * Check if player can use Phoenix Standard (has participating units to galvanize)
 */
export function canUsePhoenixStandard(
  state: GameState,
  playerId: string,
  participatingUnitIds: string[]
): boolean {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'last_bastion') return false;

  // Check if any participating unit is not already galvanized
  const galvanizedTokens = player.galvanizeTokens ?? [];
  return participatingUnitIds.some(unitId => !galvanizedTokens.includes(unitId));
}

/**
 * Get valid targets for Phoenix Standard (participating units not already galvanized)
 */
export function getPhoenixStandardTargets(
  state: GameState,
  playerId: string,
  participatingUnitIds: string[]
): string[] {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'last_bastion') return [];

  const galvanizedTokens = player.galvanizeTokens ?? [];
  return participatingUnitIds.filter(unitId => !galvanizedTokens.includes(unitId));
}

// ============================================================================
// A3 Valiance Mech Ability
// ============================================================================

/**
 * Handle A3 Valiance mech death - galvanize up to 3 infantry if mech was galvanized
 */
export function handleA3ValianceDeath(
  state: GameState,
  playerId: string,
  mechId: string,
  planetId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check if mech was galvanized
  if (!isUnitGalvanized(state, playerId, mechId)) {
    return { success: false, error: 'Mech was not galvanized' };
  }

  // Remove galvanize token from destroyed mech
  removeGalvanizeToken(state, playerId, mechId);

  // Find infantry on the planet
  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p: PlanetInstance) => p.id === planetId);
    if (planet) {
      const infantry = planet.units.filter(
        (u: UnitInstance) => u.ownerId === playerId && u.type === 'infantry'
      );

      // Galvanize up to 3 infantry that aren't already galvanized
      const toGalvanize = infantry
        .filter((u: UnitInstance) => !isUnitGalvanized(state, playerId, u.id))
        .slice(0, 3);

      for (const unit of toGalvanize) {
        handleGalvanize(state, {
          type: 'galvanize',
          playerId,
          unitId: unit.id,
        });
      }

      return {
        success: true,
        triggeredEvents: ['a3_valiance_triggered'],
        data: {
          playerId,
          mechId,
          planetId,
          galvanizedCount: toGalvanize.length,
        },
      };
    }
  }

  return { success: false, error: 'Planet not found' };
}

// ============================================================================
// The Egeiro Flagship Ability
// ============================================================================

/**
 * Get combat bonus from The Egeiro flagship
 * +1 to all unit combat rolls per non-home system with controlled planets
 */
export function getEgeiroCombatBonus(state: GameState, playerId: string): number {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'last_bastion') return 0;

  // Check if player has The Egeiro in the combat system
  // This would be called from combat handler with combat context

  // Count non-home systems with controlled planets
  let systemCount = 0;
  const countedSystems = new Set<string>();

  for (const tile of state.map.tiles) {
    // Skip home systems
    if (tile.systemId < 100) continue; // Home systems have low IDs

    // Check if any planet in this system is controlled by the player
    const hasControlledPlanet = tile.planets.some(
      (p: PlanetInstance) => p.controlledBy === playerId
    );

    if (hasControlledPlanet && !countedSystems.has(tile.id)) {
      countedSystems.add(tile.id);
      systemCount++;
    }
  }

  return systemCount;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a unit by ID across all locations
 */
function findUnitById(state: GameState, unitId: string): UnitInstance | undefined {
  for (const tile of state.map.tiles) {
    // Check space units
    const spaceUnit = tile.units.find((u: UnitInstance) => u.id === unitId);
    if (spaceUnit) return spaceUnit;

    // Check planet units
    for (const planet of tile.planets) {
      const planetUnit = planet.units.find((u: UnitInstance) => u.id === unitId);
      if (planetUnit) return planetUnit;
    }
  }
  return undefined;
}

/**
 * Generate a unique unit ID
 */
function generateUnitId(): string {
  return `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get planet resource value (placeholder - would use planet data)
 */
function getPlanetResources(planetId: string): number {
  // This would look up from planet data in a real implementation
  // For now, return a default value
  const planetResources: Record<string, number> = {
    // Some example planets
    mecatol_rex: 1,
    jord: 4,
    // Thunder's Edge planets would be added here
  };
  return planetResources[planetId] ?? 2;
}

/**
 * Clean up galvanize tokens for destroyed units
 * Called from combat resolution
 */
export function cleanupDestroyedGalvanizedUnits(
  state: GameState,
  playerId: string,
  destroyedUnitIds: string[]
): void {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player?.galvanizeTokens) return;

  player.galvanizeTokens = player.galvanizeTokens.filter(
    (unitId: string) => !destroyedUnitIds.includes(unitId)
  );
}
