/**
 * Ral Nel Consortium Faction Ability Handlers
 *
 * Key mechanics:
 * - MINIATURIZATION: Structures can be transported by ships
 * - SURVIVAL INSTINCT: Relocate ships when system is activated by another player
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

export interface TransportStructureAction {
  type: 'transport_structure';
  playerId: string;
  structureId: string;
  shipId: string;
}

export interface PlaceStructureAction {
  type: 'place_structure';
  playerId: string;
  structureId: string;
  planetId: string;
}

export interface SurvivalInstinctAction {
  type: 'survival_instinct';
  playerId: string;
  systemId: string;
  shipIds: string[]; // Max 2 ships
  fromSystemIds: string[]; // Adjacent systems to relocate from
}

// Structure types that can be transported
const STRUCTURE_TYPES = ['pds', 'space_dock'];

// ============================================================================
// Miniaturization - Structure Transport
// ============================================================================

/**
 * Check if a unit is a structure
 */
export function isStructure(unitType: string): boolean {
  return STRUCTURE_TYPES.includes(unitType);
}

/**
 * Check if Ral Nel player can transport structures
 */
export function canTransportStructures(state: GameState, playerId: string): boolean {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) return false;

  return player.faction === 'ral_nel';
}

/**
 * Get structures in space (being transported)
 */
export function getStructuresInSpace(
  state: GameState,
  playerId: string,
  systemId: string
): UnitInstance[] {
  const tile = state.map.tiles.find((t: MapTile) => t.id === systemId);
  if (!tile) return [];

  return tile.units.filter(
    (u: UnitInstance) => u.ownerId === playerId && isStructure(u.type)
  );
}

/**
 * Pick up a structure for transport
 * Structures in space cannot use their abilities
 */
export function handlePickupStructure(
  state: GameState,
  action: TransportStructureAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!canTransportStructures(state, action.playerId)) {
    return { success: false, error: 'Only Ral Nel can transport structures' };
  }

  // Find the structure (must be on a planet)
  let structurePlanet: PlanetInstance | undefined;
  let structureTile: MapTile | undefined;
  let structure: UnitInstance | undefined;

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      const unit = planet.units.find((u: UnitInstance) => u.id === action.structureId);
      if (unit && isStructure(unit.type)) {
        structurePlanet = planet;
        structureTile = tile;
        structure = unit;
        break;
      }
    }
    if (structure) break;
  }

  if (!structure || !structurePlanet || !structureTile) {
    return { success: false, error: 'Structure not found on a planet' };
  }

  if (structure.ownerId !== action.playerId) {
    return { success: false, error: 'Structure does not belong to player' };
  }

  // Verify ship exists in the same system
  const ship = structureTile.units.find((u: UnitInstance) => u.id === action.shipId);
  if (!ship || ship.ownerId !== action.playerId) {
    return { success: false, error: 'Ship not found in system' };
  }

  // Move structure from planet to space (doesn't count against capacity)
  const structureIndex = structurePlanet.units.findIndex(
    (u: UnitInstance) => u.id === action.structureId
  );
  structurePlanet.units.splice(structureIndex, 1);

  // Add to space area
  delete structure.planetId;
  structureTile.units.push(structure);

  return {
    success: true,
    triggeredEvents: ['structure_picked_up'],
    data: {
      playerId: action.playerId,
      structureId: action.structureId,
      structureType: structure.type,
      fromPlanetId: structurePlanet.id,
      systemId: structureTile.id,
    },
  };
}

/**
 * Place a structure from space onto a planet
 * Called at end of tactical action
 */
export function handlePlaceStructure(
  state: GameState,
  action: PlaceStructureAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!canTransportStructures(state, action.playerId)) {
    return { success: false, error: 'Only Ral Nel can transport structures' };
  }

  // Find the structure in space
  let structureTile: MapTile | undefined;
  let structure: UnitInstance | undefined;
  let structureIndex = -1;

  for (const tile of state.map.tiles) {
    const idx = tile.units.findIndex(
      (u: UnitInstance) => u.id === action.structureId && isStructure(u.type)
    );
    if (idx !== -1) {
      structureTile = tile;
      structure = tile.units[idx];
      structureIndex = idx;
      break;
    }
  }

  if (!structure || !structureTile || structureIndex === -1) {
    return { success: false, error: 'Structure not found in space' };
  }

  if (structure.ownerId !== action.playerId) {
    return { success: false, error: 'Structure does not belong to player' };
  }

  // Find the target planet (must be in same system and controlled by player)
  const targetPlanet = structureTile.planets.find(
    (p: PlanetInstance) => p.id === action.planetId
  );

  if (!targetPlanet) {
    return { success: false, error: 'Planet not in same system as structure' };
  }

  if (targetPlanet.controlledBy !== action.playerId) {
    return { success: false, error: 'Player does not control this planet' };
  }

  // Move structure from space to planet
  structureTile.units.splice(structureIndex, 1);
  structure.planetId = action.planetId;
  targetPlanet.units.push(structure);

  return {
    success: true,
    triggeredEvents: ['structure_placed'],
    data: {
      playerId: action.playerId,
      structureId: action.structureId,
      structureType: structure.type,
      planetId: action.planetId,
      systemId: structureTile.id,
    },
  };
}

/**
 * Move structures with ships during movement
 * Structures move automatically with any ship (no capacity required)
 */
export function moveStructuresWithShips(
  state: GameState,
  playerId: string,
  fromSystemId: string,
  toSystemId: string,
  movingShipIds: string[]
): HandlerResult {
  if (!canTransportStructures(state, playerId)) {
    return { success: true, data: { structuresMoved: 0 } }; // Not Ral Nel, nothing to do
  }

  const fromTile = state.map.tiles.find((t: MapTile) => t.id === fromSystemId);
  const toTile = state.map.tiles.find((t: MapTile) => t.id === toSystemId);

  if (!fromTile || !toTile) {
    return { success: false, error: 'System not found' };
  }

  // Check if any ships are moving
  const hasMovingShips = movingShipIds.some((shipId: string) =>
    fromTile.units.some((u: UnitInstance) => u.id === shipId)
  );

  if (!hasMovingShips) {
    return { success: true, data: { structuresMoved: 0 } };
  }

  // Move all structures in space with the ships
  const structuresToMove = fromTile.units.filter(
    (u: UnitInstance) => u.ownerId === playerId && isStructure(u.type)
  );

  for (const structure of structuresToMove) {
    const idx = fromTile.units.findIndex((u: UnitInstance) => u.id === structure.id);
    if (idx !== -1) {
      fromTile.units.splice(idx, 1);
      toTile.units.push(structure);
    }
  }

  return {
    success: true,
    triggeredEvents: structuresToMove.length > 0 ? ['structures_transported'] : [],
    data: {
      playerId,
      fromSystemId,
      toSystemId,
      structuresMoved: structuresToMove.length,
      structureIds: structuresToMove.map((s: UnitInstance) => s.id),
    },
  };
}

// ============================================================================
// Survival Instinct
// ============================================================================

/**
 * Check if player can use Survival Instinct
 */
export function canUseSurvivalInstinct(
  state: GameState,
  playerId: string,
  activatedSystemId: string
): boolean {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'ral_nel') return false;

  const activatedTile = state.map.tiles.find((t: MapTile) => t.id === activatedSystemId);
  if (!activatedTile) return false;

  // Check if player has ships in the activated system
  const hasShipsInSystem = activatedTile.units.some(
    (u: UnitInstance) => u.ownerId === playerId && !isStructure(u.type)
  );

  return hasShipsInSystem;
}

/**
 * Get valid ships to relocate with Survival Instinct
 * Returns ships from adjacent systems that don't have player's command tokens
 */
export function getValidSurvivalInstinctShips(
  state: GameState,
  playerId: string,
  targetSystemId: string
): { systemId: string; ships: UnitInstance[] }[] {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'ral_nel') return [];

  const targetTile = state.map.tiles.find((t: MapTile) => t.id === targetSystemId);
  if (!targetTile) return [];

  // Get adjacent systems
  const adjacentTiles = getAdjacentTiles(state, targetTile);

  const result: { systemId: string; ships: UnitInstance[] }[] = [];

  for (const tile of adjacentTiles) {
    // Skip if player has command token in this system
    if (tile.commandTokens.includes(playerId)) continue;

    // Get player's ships (not structures)
    const ships = tile.units.filter(
      (u: UnitInstance) => u.ownerId === playerId && !isStructure(u.type)
    );

    if (ships.length > 0) {
      result.push({ systemId: tile.id, ships });
    }
  }

  return result;
}

/**
 * Handle Survival Instinct - relocate up to 2 ships when system activated
 */
export function handleSurvivalInstinct(
  state: GameState,
  action: SurvivalInstinctAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (player.faction !== 'ral_nel') {
    return { success: false, error: 'Only Ral Nel can use Survival Instinct' };
  }

  if (action.shipIds.length > 2) {
    return { success: false, error: 'Can only relocate up to 2 ships' };
  }

  const targetTile = state.map.tiles.find((t: MapTile) => t.id === action.systemId);
  if (!targetTile) {
    return { success: false, error: 'Target system not found' };
  }

  const movedShips: { shipId: string; fromSystem: string }[] = [];

  for (let i = 0; i < action.shipIds.length; i++) {
    const shipId = action.shipIds[i];
    const fromSystemId = action.fromSystemIds[i];

    const fromTile = state.map.tiles.find((t: MapTile) => t.id === fromSystemId);
    if (!fromTile) continue;

    // Verify no command token
    if (fromTile.commandTokens.includes(action.playerId)) {
      continue;
    }

    // Find and move the ship
    const shipIndex = fromTile.units.findIndex(
      (u: UnitInstance) => u.id === shipId && u.ownerId === action.playerId
    );

    if (shipIndex === -1) continue;

    const ship = fromTile.units.splice(shipIndex, 1)[0];
    targetTile.units.push(ship);

    movedShips.push({ shipId, fromSystem: fromSystemId });
  }

  if (movedShips.length === 0) {
    return { success: false, error: 'No valid ships to relocate' };
  }

  return {
    success: true,
    triggeredEvents: ['survival_instinct_used'],
    data: {
      playerId: action.playerId,
      targetSystemId: action.systemId,
      movedShips,
    },
  };
}

// ============================================================================
// Last Dispatch Flagship Ability
// ============================================================================

/**
 * Handle Last Dispatch flagship retreat ability
 * When declaring retreat, may destroy 1 opponent's ship without SUSTAIN DAMAGE
 */
export function handleLastDispatchRetreat(
  state: GameState,
  playerId: string,
  targetUnitId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (player.faction !== 'ral_nel') {
    return { success: false, error: 'Only Ral Nel can use Last Dispatch ability' };
  }

  // Verify combat is active and retreat was announced
  if (!state.activeCombat) {
    return { success: false, error: 'No active combat' };
  }

  const isAttacker = state.activeCombat.attackerId === playerId;
  const isDefender = state.activeCombat.defenderId === playerId;

  if (!isAttacker && !isDefender) {
    return { success: false, error: 'Player is not in combat' };
  }

  const hasAnnouncedRetreat = isAttacker
    ? state.activeCombat.retreatAnnounced.attacker
    : state.activeCombat.retreatAnnounced.defender;

  if (!hasAnnouncedRetreat) {
    return { success: false, error: 'Must announce retreat first' };
  }

  // Find the target unit
  const opponentId = isAttacker
    ? state.activeCombat.defenderId
    : state.activeCombat.attackerId;

  const combatTile = state.map.tiles.find(
    (t: MapTile) => t.id === state.activeCombat?.systemId
  );
  if (!combatTile) {
    return { success: false, error: 'Combat system not found' };
  }

  const targetUnit = combatTile.units.find(
    (u: UnitInstance) => u.id === targetUnitId && u.ownerId === opponentId
  );

  if (!targetUnit) {
    return { success: false, error: 'Target unit not found' };
  }

  // Check if unit has SUSTAIN DAMAGE (simplified check)
  const sustainDamageUnits = ['dreadnought', 'war_sun', 'flagship', 'mech', 'carrier'];
  if (sustainDamageUnits.includes(targetUnit.type)) {
    return { success: false, error: 'Cannot target units with SUSTAIN DAMAGE' };
  }

  // Destroy the unit
  const unitIndex = combatTile.units.findIndex((u: UnitInstance) => u.id === targetUnitId);
  combatTile.units.splice(unitIndex, 1);

  return {
    success: true,
    triggeredEvents: ['last_dispatch_triggered', 'unit_destroyed'],
    data: {
      playerId,
      targetUnitId,
      targetUnitType: targetUnit.type,
      targetOwnerId: opponentId,
    },
  };
}

// ============================================================================
// Alarum Mech Ability
// ============================================================================

/**
 * Handle Alarum mech ground reinforcement
 * At end of ground combat round, may move up to 2 ground forces from adjacent systems
 */
export function handleAlarumReinforce(
  state: GameState,
  playerId: string,
  mechPlanetId: string,
  unitIds: string[],
  fromSystemIds: string[]
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (player.faction !== 'ral_nel') {
    return { success: false, error: 'Only Ral Nel can use Alarum ability' };
  }

  if (unitIds.length > 2) {
    return { success: false, error: 'Can only move up to 2 ground forces' };
  }

  // Find the mech's planet
  let targetTile: MapTile | undefined;
  let targetPlanet: PlanetInstance | undefined;

  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p: PlanetInstance) => p.id === mechPlanetId);
    if (planet) {
      targetTile = tile;
      targetPlanet = planet;
      break;
    }
  }

  if (!targetTile || !targetPlanet) {
    return { success: false, error: 'Planet not found' };
  }

  // Verify there's an Alarum mech on the planet
  const hasMech = targetPlanet.units.some(
    (u: UnitInstance) => u.ownerId === playerId && u.type === 'mech'
  );
  if (!hasMech) {
    return { success: false, error: 'No Alarum mech on planet' };
  }

  const movedUnits: { unitId: string; fromSystem: string }[] = [];

  for (let i = 0; i < unitIds.length; i++) {
    const unitId = unitIds[i];
    const fromSystemId = fromSystemIds[i];

    const fromTile = state.map.tiles.find((t: MapTile) => t.id === fromSystemId);
    if (!fromTile) continue;

    // Find the ground force (check all planets in the system)
    let found = false;
    for (const planet of fromTile.planets) {
      const unitIndex = planet.units.findIndex(
        (u: UnitInstance) =>
          u.id === unitId &&
          u.ownerId === playerId &&
          (u.type === 'infantry' || u.type === 'mech')
      );

      if (unitIndex !== -1) {
        const unit = planet.units.splice(unitIndex, 1)[0];
        unit.planetId = mechPlanetId;
        targetPlanet.units.push(unit);
        movedUnits.push({ unitId, fromSystem: fromSystemId });
        found = true;
        break;
      }
    }
  }

  if (movedUnits.length === 0) {
    return { success: false, error: 'No valid ground forces to move' };
  }

  return {
    success: true,
    triggeredEvents: ['alarum_reinforcement'],
    data: {
      playerId,
      targetPlanetId: mechPlanetId,
      movedUnits,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get adjacent tiles (simplified - would use hex math in real implementation)
 */
function getAdjacentTiles(state: GameState, tile: MapTile): MapTile[] {
  // This is a simplified version - real implementation would use hex coordinates
  const pos = tile.position;
  const adjacentPositions = [
    { q: pos.q + 1, r: pos.r },
    { q: pos.q - 1, r: pos.r },
    { q: pos.q, r: pos.r + 1 },
    { q: pos.q, r: pos.r - 1 },
    { q: pos.q + 1, r: pos.r - 1 },
    { q: pos.q - 1, r: pos.r + 1 },
  ];

  return state.map.tiles.filter((t: MapTile) =>
    adjacentPositions.some((adj) => adj.q === t.position.q && adj.r === t.position.r)
  );
}

/**
 * Check if structures in space are valid (can only exist during tactical action)
 * Should be called at end of tactical action to enforce placement
 */
export function hasStructuresInSpace(state: GameState, playerId: string): boolean {
  for (const tile of state.map.tiles) {
    const hasStructure = tile.units.some(
      (u: UnitInstance) => u.ownerId === playerId && isStructure(u.type)
    );
    if (hasStructure) return true;
  }
  return false;
}
