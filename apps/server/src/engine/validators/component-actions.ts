/**
 * Component Action Validators
 *
 * Validates ACTION: abilities from technologies, agents, relics, etc.
 */

import type { GameState, ComponentAction, UnitType } from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { isGroundUnit, getUnitStats } from '../utils/units.js';

/**
 * Validate a component action
 */
export function validateComponentAction(
  state: GameState,
  action: ComponentAction
): ValidationResult {
  // Must be in action phase and awaiting action
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only use component actions during action phase' };
  }

  if (state.subPhase !== 'awaiting_action') {
    return { valid: false, error: 'Cannot use component action during sub-phase' };
  }

  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Player must not have passed
  if (player.passed) {
    return { valid: false, error: 'You have already passed' };
  }

  // Route to specific validator based on component type
  switch (action.componentType) {
    case 'tech':
      return validateTechComponentAction(state, action, player.id);

    case 'faction_ability':
      return validateFactionAbilityAction(state, action, player.id);

    case 'agent':
      return { valid: false, error: 'Use use_agent action for agent abilities' };

    case 'relic':
      return { valid: false, error: 'Use use_relic action for relic abilities' };

    case 'commander':
      return { valid: false, error: 'Commanders do not have ACTION: abilities' };

    case 'promissory':
      return { valid: false, error: 'Promissory ACTION: not yet implemented' };

    default:
      return { valid: false, error: `Unknown component type: ${action.componentType}` };
  }
}

/**
 * Validate ACTION: technology abilities
 */
function validateTechComponentAction(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check player has the technology
  if (!player.technologies?.includes(action.componentId)) {
    return { valid: false, error: `You do not have technology: ${action.componentId}` };
  }

  // Check technology is not exhausted
  if (player.exhaustedTechnologies?.includes(action.componentId)) {
    return { valid: false, error: 'Technology is already exhausted' };
  }

  // Route to specific tech validator
  switch (action.componentId) {
    case 'x89_bacterial_weapon':
      return validateX89BacterialWeapon(state, action, playerId);

    case 'transit_diodes':
      return validateTransitDiodes(state, action, playerId);

    case 'sling_relay':
      return validateSlingRelay(state, action, playerId);

    case 'lazax_gate_folding':
      return validateLazaxGateFolding(state, action, playerId);

    case 'mageon_implants':
      return validateMageonImplants(state, action, playerId);

    case 'production_biomes':
      return validateProductionBiomes(state, action, playerId);

    case 'wormhole_generator':
    case 'wormhole_generator_omega':
      return validateWormholeGenerator(state, action, playerId);

    case 'vortex':
      return validateVortex(state, action, playerId);

    case 'temporal_command_suite':
      return validateTemporalCommandSuite(state, action, playerId);

    default:
      return { valid: false, error: `Technology ${action.componentId} does not have an ACTION: ability` };
  }
}

/**
 * Validate X-89 Bacterial Weapon
 * Requires ships with BOMBARDMENT in the target system
 */
function validateX89BacterialWeapon(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must specify target planet
  const targetPlanetId = action.targets?.planetId;
  if (!targetPlanetId) {
    return { valid: false, error: 'Must specify target planet' };
  }

  // Find the planet and check for bombardment ships
  let planetFound = false;
  let hasBombardmentShips = false;

  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p) => p.planetId === targetPlanetId);
    if (planet) {
      planetFound = true;
      // Check for ships with BOMBARDMENT in this system
      hasBombardmentShips = tile.units.some((u) => {
        if (u.ownerId !== playerId) return false;
        const stats = getUnitStats(u.type, player);
        return stats.bombardment !== undefined;
      });
      break;
    }
  }

  if (!planetFound) {
    return { valid: false, error: 'Planet not found' };
  }

  if (!hasBombardmentShips) {
    return { valid: false, error: 'You must have ships with BOMBARDMENT in the system' };
  }

  return { valid: true };
}

/**
 * Validate Transit Diodes
 * Units can come from anywhere on the board, destinations must be controlled planets
 */
function validateTransitDiodes(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  // Get relocations from action (extended field)
  const relocations = (action as ComponentAction & { relocations?: TransitDiodesRelocation[] }).relocations;

  // If no relocations, that's valid (can exhaust without moving anything)
  if (!relocations || relocations.length === 0) {
    return { valid: true };
  }

  // Validate no more than 4 units
  if (relocations.length > 4) {
    return { valid: false, error: 'Can only relocate up to 4 ground forces' };
  }

  // Validate each relocation
  for (const relocation of relocations) {
    // Find destination planet - must be controlled by player
    let destPlanet = null;
    for (const tile of state.map.tiles) {
      const planet = tile.planets.find((p) => p.planetId === relocation.toPlanetId);
      if (planet) {
        destPlanet = planet;
        break;
      }
    }

    if (!destPlanet) {
      return { valid: false, error: `Destination planet not found: ${relocation.toPlanetId}` };
    }
    if (destPlanet.controlledBy !== playerId) {
      return { valid: false, error: `You do not control destination planet: ${relocation.toPlanetId}` };
    }

    // Find the unit anywhere on the board
    const unitLocation = findUnitOnBoard(state, relocation.unitId);
    if (!unitLocation) {
      return { valid: false, error: `Unit not found: ${relocation.unitId}` };
    }
    if (unitLocation.unit.ownerId !== playerId) {
      return { valid: false, error: 'Can only relocate your own units' };
    }
    if (!isGroundUnit(unitLocation.unit.type)) {
      return { valid: false, error: 'Can only relocate ground forces (infantry/mech)' };
    }
  }

  return { valid: true };
}

/**
 * Validate Sling Relay
 * Requires a space dock in the target system
 */
function validateSlingRelay(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  // Must specify target system and ship type
  const targetSystemIdStr = action.targets?.systemId;
  const shipType = action.targets?.unitType;

  if (!targetSystemIdStr) {
    return { valid: false, error: 'Must specify target system' };
  }

  const targetSystemId = parseInt(targetSystemIdStr, 10);
  if (isNaN(targetSystemId)) {
    return { valid: false, error: 'Invalid system ID' };
  }

  if (!shipType) {
    return { valid: false, error: 'Must specify ship type to produce' };
  }

  // Validate ship type is actually a ship
  const shipTypes = ['carrier', 'cruiser', 'destroyer', 'dreadnought', 'fighter', 'flagship', 'war_sun'];
  if (!shipTypes.includes(shipType)) {
    return { valid: false, error: `${shipType} is not a ship type` };
  }

  // Find the target system
  const targetTile = state.map.tiles.find((t) => t.systemId === targetSystemId);
  if (!targetTile) {
    return { valid: false, error: 'System not found' };
  }

  // Check for space dock in the system (on planets or floating)
  const hasSpaceDock = targetTile.planets.some((planet) =>
    planet.units.some((u) => u.type === 'space_dock' && u.ownerId === playerId)
  );

  const hasFloatingSpaceDock = targetTile.units.some(
    (u) => u.type === 'space_dock' && u.ownerId === playerId
  );

  if (!hasSpaceDock && !hasFloatingSpaceDock) {
    return { valid: false, error: 'You must have a space dock in this system' };
  }

  return { valid: true };
}

/**
 * Validate Lazax Gate Folding (Winnu Faction Tech)
 * Requires controlling Mecatol Rex
 */
function validateLazaxGateFolding(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Verify player is Winnu
  if (player.faction !== 'winnu') {
    return { valid: false, error: 'Only Winnu can use Lazax Gate Folding' };
  }

  // Find Mecatol Rex (system 18)
  const mecatolTile = state.map.tiles.find((t) => t.systemId === 18);
  if (!mecatolTile) {
    return { valid: false, error: 'Mecatol Rex not found on map' };
  }

  const mecatolRex = mecatolTile.planets.find((p) => p.planetId === 'mecatol_rex');
  if (!mecatolRex) {
    return { valid: false, error: 'Mecatol Rex planet not found' };
  }

  // Must control Mecatol Rex
  if (mecatolRex.controlledBy !== playerId) {
    return { valid: false, error: 'You must control Mecatol Rex to use this ability' };
  }

  return { valid: true };
}

/**
 * Validate Mageon Implants (Yssaril Faction Tech)
 * Requires target player and action card
 */
function validateMageonImplants(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Verify player is Yssaril
  if (player.faction !== 'yssaril') {
    return { valid: false, error: 'Only Yssaril can use Mageon Implants' };
  }

  // Get target player and card from action
  const targetPlayerId = action.targets?.playerId;
  const targetCardId = action.targets?.actionCardId;

  if (!targetPlayerId) {
    return { valid: false, error: 'Must specify target player' };
  }

  if (!targetCardId) {
    return { valid: false, error: 'Must specify action card to steal' };
  }

  const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { valid: false, error: 'Target player not found' };
  }

  if (targetPlayerId === playerId) {
    return { valid: false, error: 'Cannot target yourself' };
  }

  // Verify target has the action card (action cards are stored as string IDs)
  const hasCard = targetPlayer.actionCards?.includes(targetCardId);
  if (!hasCard) {
    return { valid: false, error: 'Target player does not have that action card' };
  }

  return { valid: true };
}

/**
 * Helper interface for Transit Diodes relocations
 */
interface TransitDiodesRelocation {
  unitId: string;
  toPlanetId: string;
}

/**
 * Find a unit on the board and return its location
 */
function findUnitOnBoard(
  state: GameState,
  unitId: string
): { planet: { units: Array<{ id: string; ownerId: string; type: UnitType }> }; unit: { id: string; ownerId: string; type: UnitType } } | undefined {
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      const unit = planet.units.find((u) => u.id === unitId);
      if (unit) {
        return { planet, unit };
      }
    }
  }
  return undefined;
}

// ============================================================================
// FACTION ABILITY VALIDATORS
// ============================================================================

/**
 * Validate faction ability actions
 */
function validateFactionAbilityAction(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  switch (action.componentId) {
    case 'star_forge':
      return validateStarForge(state, action, playerId);

    case 'orbital_drop':
      return validateOrbitalDrop(state, action, playerId);

    case 'stall_tactics':
      return validateStallTactics(state, action, playerId);

    default:
      return { valid: false, error: `Unknown faction ability: ${action.componentId}` };
  }
}

/**
 * Validate Star Forge (Muaat)
 */
function validateStarForge(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (player.faction !== 'muaat') {
    return { valid: false, error: 'Only Muaat can use Star Forge' };
  }

  if (player.commandTokens.strategy < 1) {
    return { valid: false, error: 'No strategy tokens available' };
  }

  return { valid: true };
}

/**
 * Validate Orbital Drop (Sol)
 */
function validateOrbitalDrop(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (player.faction !== 'sol') {
    return { valid: false, error: 'Only Sol can use Orbital Drop' };
  }

  if (player.commandTokens.strategy < 1) {
    return { valid: false, error: 'No strategy tokens available' };
  }

  const targetPlanetId = action.targets?.planetId;
  if (!targetPlanetId) {
    return { valid: false, error: 'Must specify target planet' };
  }

  const targetPlanet = findPlanetById(state, targetPlanetId);
  if (!targetPlanet) {
    return { valid: false, error: 'Planet not found' };
  }

  if (targetPlanet.controlledBy !== playerId) {
    return { valid: false, error: 'You must control the target planet' };
  }

  return { valid: true };
}

/**
 * Validate Stall Tactics (Yssaril)
 */
function validateStallTactics(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (player.faction !== 'yssaril') {
    return { valid: false, error: 'Only Yssaril can use Stall Tactics' };
  }

  const cardToDiscard = action.targets?.actionCardId;
  if (!cardToDiscard) {
    return { valid: false, error: 'Must specify action card to discard' };
  }

  if (!player.actionCards?.includes(cardToDiscard)) {
    return { valid: false, error: 'You do not have that action card' };
  }

  return { valid: true };
}

// ============================================================================
// ADDITIONAL TECH VALIDATORS
// ============================================================================

/**
 * Validate Production Biomes (Hacan)
 */
function validateProductionBiomes(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (player.faction !== 'hacan') {
    return { valid: false, error: 'Only Hacan can use Production Biomes' };
  }

  if (player.commandTokens.strategy < 1) {
    return { valid: false, error: 'No strategy tokens available' };
  }

  const targetPlayerId = action.targets?.playerId;
  if (!targetPlayerId) {
    return { valid: false, error: 'Must specify another player' };
  }

  if (targetPlayerId === playerId) {
    return { valid: false, error: 'Must choose another player' };
  }

  const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { valid: false, error: 'Target player not found' };
  }

  return { valid: true };
}

/**
 * Validate Wormhole Generator (Creuss)
 */
function validateWormholeGenerator(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (player.faction !== 'creuss') {
    return { valid: false, error: 'Only Creuss can use Wormhole Generator' };
  }

  const targetSystemIdStr = action.targets?.systemId;
  if (!targetSystemIdStr) {
    return { valid: false, error: 'Must specify target system' };
  }

  const targetSystemId = parseInt(targetSystemIdStr, 10);
  if (isNaN(targetSystemId)) {
    return { valid: false, error: 'Invalid system ID' };
  }

  const targetTile = state.map.tiles.find((t) => t.systemId === targetSystemId);
  if (!targetTile) {
    return { valid: false, error: 'System not found' };
  }

  // Check valid placement
  const hasControlledPlanet = targetTile.planets.some((p) => p.controlledBy === playerId);
  const isHomeSystem = isHomeSystemTile(targetTile);
  const hasEnemyShips = targetTile.units.some((u) => u.ownerId !== playerId);

  if (!hasControlledPlanet && (isHomeSystem || hasEnemyShips)) {
    return { valid: false, error: 'Invalid target system' };
  }

  return { valid: true };
}

/**
 * Validate Vortex (Vuil'Raith)
 */
function validateVortex(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (player.faction !== 'vuil_raith' && player.faction !== 'cabal') {
    return { valid: false, error: 'Only Vuil\'Raith can use Vortex' };
  }

  const targetSystemIdStr = action.targets?.systemId;
  const targetUnitId = action.targets?.unitType;

  if (!targetSystemIdStr || !targetUnitId) {
    return { valid: false, error: 'Must specify target system and unit' };
  }

  const targetSystemId = parseInt(targetSystemIdStr, 10);
  if (isNaN(targetSystemId)) {
    return { valid: false, error: 'Invalid system ID' };
  }

  const targetTile = state.map.tiles.find((t) => t.systemId === targetSystemId);
  if (!targetTile) {
    return { valid: false, error: 'System not found' };
  }

  // Check adjacency to space dock
  const spaceDockSystems = findSystemsWithSpaceDock(state, playerId);
  const isAdjacent = spaceDockSystems.some((sdTile) =>
    areSystemsAdjacent(state, sdTile.systemId, targetSystemId)
  );

  if (!isAdjacent) {
    return { valid: false, error: 'Target must be adjacent to your space dock' };
  }

  return { valid: true };
}

/**
 * Validate Temporal Command Suite (Nomad)
 */
function validateTemporalCommandSuite(
  state: GameState,
  action: ComponentAction,
  playerId: string
): ValidationResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (player.faction !== 'nomad') {
    return { valid: false, error: 'Only Nomad can use Temporal Command Suite' };
  }

  const targetPlayerId = action.targets?.playerId;
  if (!targetPlayerId) {
    return { valid: false, error: 'Must specify target player' };
  }

  const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { valid: false, error: 'Target player not found' };
  }

  if (!targetPlayer.leaders?.agent?.exhausted) {
    return { valid: false, error: 'Target agent is not exhausted' };
  }

  return { valid: true };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find a planet by ID
 */
function findPlanetById(state: GameState, planetId: string) {
  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p) => p.planetId === planetId);
    if (planet) return planet;
  }
  return undefined;
}

/**
 * Check if a tile is a home system
 */
function isHomeSystemTile(tile: { systemId: number }): boolean {
  return (tile.systemId >= 1 && tile.systemId <= 17) ||
         (tile.systemId >= 51 && tile.systemId <= 58);
}

/**
 * Find systems with player's space dock
 */
function findSystemsWithSpaceDock(state: GameState, playerId: string) {
  return state.map.tiles.filter((tile) => {
    const hasOnPlanet = tile.planets.some((planet) =>
      planet.units.some((u) => u.type === 'space_dock' && u.ownerId === playerId)
    );
    const hasInSpace = tile.units.some(
      (u) => u.type === 'space_dock' && u.ownerId === playerId
    );
    return hasOnPlanet || hasInSpace;
  });
}

/**
 * Check if two systems are adjacent
 */
function areSystemsAdjacent(state: GameState, systemId1: number, systemId2: number): boolean {
  const tile1 = state.map.tiles.find((t) => t.systemId === systemId1);
  const tile2 = state.map.tiles.find((t) => t.systemId === systemId2);

  if (!tile1 || !tile2) return false;

  const pos1 = tile1.position;
  const pos2 = tile2.position;

  const dq = Math.abs(pos1.q - pos2.q);
  const dr = Math.abs(pos1.r - pos2.r);
  const ds = Math.abs((-pos1.q - pos1.r) - (-pos2.q - pos2.r));

  return (dq + dr + ds) === 2;
}
