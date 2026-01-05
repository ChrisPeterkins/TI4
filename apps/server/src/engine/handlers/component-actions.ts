/**
 * Component Action Handler
 *
 * Handles "ACTION:" abilities from technologies, agents, relics, etc.
 * When a player uses a component action, it counts as their action for the turn.
 */

import type {
  GameState,
  ComponentAction,
  MapTile,
  PlanetInstance,
  UnitInstance,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { isGroundUnit, createUnitInstance, getUnitStats } from '../utils/units.js';
import { logComponentAction } from '../utils/game-log.js';

/**
 * Handle a component action (ACTION: abilities on techs, agents, relics, etc.)
 */
export function handleComponentAction(
  state: GameState,
  action: ComponentAction
): HandlerResult {
  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Route to specific handler based on component type
  switch (action.componentType) {
    case 'tech':
      return handleTechComponentAction(state, action, player.id);

    case 'faction_ability':
      return handleFactionAbilityAction(state, action, player.id);

    case 'agent':
      // Agent actions are already handled in leaders.ts via use_agent
      return { success: false, error: 'Use use_agent action for agent abilities' };

    case 'relic':
      // Relic actions are already handled in relics.ts via use_relic
      return { success: false, error: 'Use use_relic action for relic abilities' };

    case 'commander':
      // Commander abilities are passive or triggered, not ACTION:
      return { success: false, error: 'Commanders do not have ACTION: abilities' };

    case 'promissory':
      // Promissory notes with ACTION: would be handled here
      return { success: false, error: 'Promissory ACTION: not yet implemented' };

    default:
      return { success: false, error: `Unknown component type: ${action.componentType}` };
  }
}

/**
 * Handle ACTION: technology abilities
 */
function handleTechComponentAction(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check player has the technology
  if (!player.technologies?.includes(action.componentId)) {
    return { success: false, error: `Player does not have technology: ${action.componentId}` };
  }

  // Check technology is not exhausted
  if (player.exhaustedTechnologies?.includes(action.componentId)) {
    return { success: false, error: 'Technology is already exhausted' };
  }

  // Route to specific tech handler
  switch (action.componentId) {
    case 'x89_bacterial_weapon':
      return handleX89BacterialWeapon(state, action, playerId);

    case 'transit_diodes':
      return handleTransitDiodes(state, action, playerId);

    case 'sling_relay':
      return handleSlingRelay(state, action, playerId);

    case 'lazax_gate_folding':
      return handleLazaxGateFolding(state, action, playerId);

    case 'mageon_implants':
      return handleMageonImplants(state, action, playerId);

    case 'production_biomes':
      return handleProductionBiomes(state, action, playerId);

    case 'wormhole_generator':
    case 'wormhole_generator_omega':
      return handleWormholeGenerator(state, action, playerId);

    case 'vortex':
      return handleVortex(state, action, playerId);

    case 'temporal_command_suite':
      return handleTemporalCommandSuite(state, action, playerId);

    default:
      return { success: false, error: `Technology ${action.componentId} does not have an ACTION: ability` };
  }
}

/**
 * X-89 Bacterial Weapon
 * ACTION: Exhaust this card and choose 1 planet in a system that contains 1 or more
 * of your ships that have BOMBARDMENT; destroy all infantry on that planet.
 */
function handleX89BacterialWeapon(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Validate target planet
  const targetPlanetId = action.targets?.planetId;
  if (!targetPlanetId) {
    return { success: false, error: 'Must specify target planet' };
  }

  // Find the planet and its system
  let targetTile: MapTile | undefined;
  let targetPlanet: PlanetInstance | undefined;

  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p) => p.planetId === targetPlanetId);
    if (planet) {
      targetTile = tile;
      targetPlanet = planet;
      break;
    }
  }

  if (!targetPlanet || !targetTile) {
    return { success: false, error: 'Planet not found' };
  }

  // Must have ships with BOMBARDMENT in the system
  const hasBombardmentShips = targetTile.units.some((u) => {
    if (u.ownerId !== playerId) return false;
    const stats = getUnitStats(u.type, player);
    return stats.bombardment !== undefined;
  });

  if (!hasBombardmentShips) {
    return { success: false, error: 'You must have ships with BOMBARDMENT in the system' };
  }

  // Exhaust the technology
  if (!player.exhaustedTechnologies) {
    player.exhaustedTechnologies = [];
  }
  player.exhaustedTechnologies.push('x89_bacterial_weapon');

  // Destroy all infantry on the planet (belonging to ANY player, including yourself)
  const destroyedCount = targetPlanet.units.filter(
    (u) => u.type === 'infantry'
  ).length;

  targetPlanet.units = targetPlanet.units.filter((u) => u.type !== 'infantry');

  // Log the action
  logComponentAction(state, playerId, 'X-89 Bacterial Weapon', `Destroyed ${destroyedCount} infantry on ${targetPlanetId}`);

  // This counts as the player's action - advance to next player
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'units_destroyed'],
    data: { techId: 'x89_bacterial_weapon', destroyedCount, planetId: targetPlanetId },
  };
}

/**
 * Transit Diodes
 * ACTION: Exhaust this card; remove up to 4 of your ground forces from
 * the game board and place them on 1 or more planets you control.
 */
function handleTransitDiodes(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Transit Diodes uses relocations array: { unitId, toPlanetId }
  // Units can come from anywhere on the board (we find them by ID)
  const relocations = (action as ComponentAction & { relocations?: TransitDiodesRelocation[] }).relocations;

  if (!relocations || relocations.length === 0) {
    // If no relocations specified, just exhaust and do nothing (valid use)
    if (!player.exhaustedTechnologies) {
      player.exhaustedTechnologies = [];
    }
    player.exhaustedTechnologies.push('transit_diodes');

    logComponentAction(state, playerId, 'Transit Diodes', 'No ground forces relocated');
    advanceAfterComponentAction(state);

    return {
      success: true,
      triggeredEvents: ['component_action_used'],
      data: { techId: 'transit_diodes', relocated: 0 },
    };
  }

  // Validate no more than 4 units total
  if (relocations.length > 4) {
    return { success: false, error: 'Can only relocate up to 4 ground forces' };
  }

  // Validate all relocations
  for (const relocation of relocations) {
    // Find destination planet - must be controlled by player
    const destPlanet = findPlanetById(state, relocation.toPlanetId);
    if (!destPlanet) {
      return { success: false, error: `Destination planet not found: ${relocation.toPlanetId}` };
    }
    if (destPlanet.controlledBy !== playerId) {
      return { success: false, error: `You do not control destination planet: ${relocation.toPlanetId}` };
    }

    // Find the unit anywhere on the board
    const unitLocation = findUnitOnBoard(state, relocation.unitId);
    if (!unitLocation) {
      return { success: false, error: `Unit not found: ${relocation.unitId}` };
    }
    if (unitLocation.unit.ownerId !== playerId) {
      return { success: false, error: 'Can only relocate your own units' };
    }
    if (!isGroundUnit(unitLocation.unit.type)) {
      return { success: false, error: 'Can only relocate ground forces (infantry/mech)' };
    }
  }

  // Execute relocations
  for (const relocation of relocations) {
    const unitLocation = findUnitOnBoard(state, relocation.unitId);
    if (!unitLocation) continue; // Should not happen after validation

    const destPlanet = findPlanetById(state, relocation.toPlanetId)!;

    // Remove unit from source planet
    const unitIndex = unitLocation.planet.units.findIndex((u) => u.id === relocation.unitId);
    const [unit] = unitLocation.planet.units.splice(unitIndex, 1);

    // Add unit to destination
    unit.planetId = relocation.toPlanetId;
    destPlanet.units.push(unit);
  }

  // Exhaust the technology
  if (!player.exhaustedTechnologies) {
    player.exhaustedTechnologies = [];
  }
  player.exhaustedTechnologies.push('transit_diodes');

  // Log the action
  logComponentAction(state, playerId, 'Transit Diodes', `Relocated ${relocations.length} ground forces`);

  // Advance to next player
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'units_relocated'],
    data: { techId: 'transit_diodes', relocated: relocations.length },
  };
}

/**
 * Sling Relay
 * ACTION: Exhaust this card to produce 1 ship in any system that contains
 * one of your space docks.
 */
function handleSlingRelay(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Get target system and ship type from action
  const targetSystemIdStr = action.targets?.systemId;
  const shipType = action.targets?.unitType;

  if (!targetSystemIdStr) {
    return { success: false, error: 'Must specify target system' };
  }

  const targetSystemId = parseInt(targetSystemIdStr, 10);
  if (isNaN(targetSystemId)) {
    return { success: false, error: 'Invalid system ID' };
  }

  if (!shipType) {
    return { success: false, error: 'Must specify ship type to produce' };
  }

  // Validate ship type is actually a ship
  const shipTypes = ['carrier', 'cruiser', 'destroyer', 'dreadnought', 'fighter', 'flagship', 'war_sun'];
  if (!shipTypes.includes(shipType)) {
    return { success: false, error: `${shipType} is not a ship type` };
  }

  // Find the target system
  const targetTile = state.map.tiles.find((t) => t.systemId === targetSystemId);
  if (!targetTile) {
    return { success: false, error: 'System not found' };
  }

  // Check for space dock in the system (on planets or in space)
  const hasSpaceDock = targetTile.planets.some((planet) =>
    planet.units.some((u) => u.type === 'space_dock' && u.ownerId === playerId)
  );

  // Also check for floating space dock (Clan of Saar, etc.)
  const hasFloatingSpaceDock = targetTile.units.some(
    (u) => u.type === 'space_dock' && u.ownerId === playerId
  );

  if (!hasSpaceDock && !hasFloatingSpaceDock) {
    return { success: false, error: 'You must have a space dock in this system' };
  }

  // Exhaust the technology
  if (!player.exhaustedTechnologies) {
    player.exhaustedTechnologies = [];
  }
  player.exhaustedTechnologies.push('sling_relay');

  // Create the ship (for free - no resource cost)
  // Ships go into space (no planetId needed since they're in the system's unit array)
  const newUnit = createUnitInstance(shipType as any, playerId);
  targetTile.units.push(newUnit);

  // Log the action
  logComponentAction(state, playerId, 'Sling Relay', `Produced 1 ${shipType} in system ${targetSystemId}`);

  // Advance to next player
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'unit_produced'],
    data: { techId: 'sling_relay', unitType: shipType, systemId: targetSystemId },
  };
}

/**
 * Lazax Gate Folding (Winnu Faction Tech)
 * ACTION: If you control Mecatol Rex, exhaust this card to place 1 infantry
 * from your reinforcements on Mecatol Rex.
 */
function handleLazaxGateFolding(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Winnu
  if (player.faction !== 'winnu') {
    return { success: false, error: 'Only Winnu can use Lazax Gate Folding' };
  }

  // Find Mecatol Rex (system 18)
  const mecatolTile = state.map.tiles.find((t) => t.systemId === 18);
  if (!mecatolTile) {
    return { success: false, error: 'Mecatol Rex not found on map' };
  }

  const mecatolRex = mecatolTile.planets.find((p) => p.planetId === 'mecatol_rex');
  if (!mecatolRex) {
    return { success: false, error: 'Mecatol Rex planet not found' };
  }

  // Must control Mecatol Rex
  if (mecatolRex.controlledBy !== playerId) {
    return { success: false, error: 'You must control Mecatol Rex to use this ability' };
  }

  // Exhaust the technology
  if (!player.exhaustedTechnologies) {
    player.exhaustedTechnologies = [];
  }
  player.exhaustedTechnologies.push('lazax_gate_folding');

  // Place 1 infantry on Mecatol Rex
  const newInfantry = createUnitInstance('infantry', playerId, mecatolRex.planetId);
  mecatolRex.units.push(newInfantry);

  // Log the action
  logComponentAction(state, playerId, 'Lazax Gate Folding', 'Placed 1 infantry on Mecatol Rex');

  // Advance to next player
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'unit_produced'],
    data: { techId: 'lazax_gate_folding', planetId: 'mecatol_rex' },
  };
}

/**
 * Mageon Implants (Yssaril Faction Tech)
 * ACTION: Exhaust this card to look at another player's hand of action cards.
 * Choose 1 of those cards and add it to your hand.
 */
function handleMageonImplants(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Yssaril
  if (player.faction !== 'yssaril') {
    return { success: false, error: 'Only Yssaril can use Mageon Implants' };
  }

  // Get target player and card from action
  const targetPlayerId = action.targets?.playerId;
  const targetCardId = action.targets?.actionCardId;

  if (!targetPlayerId) {
    return { success: false, error: 'Must specify target player' };
  }

  if (!targetCardId) {
    return { success: false, error: 'Must specify action card to steal' };
  }

  const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { success: false, error: 'Target player not found' };
  }

  if (targetPlayerId === playerId) {
    return { success: false, error: 'Cannot target yourself' };
  }

  // Find and remove the card from target's hand (action cards are stored as string IDs)
  const cardIndex = targetPlayer.actionCards?.indexOf(targetCardId) ?? -1;
  if (cardIndex === -1) {
    return { success: false, error: 'Target player does not have that action card' };
  }

  const [stolenCard] = targetPlayer.actionCards!.splice(cardIndex, 1);

  // Add to player's hand
  if (!player.actionCards) {
    player.actionCards = [];
  }
  player.actionCards.push(stolenCard);

  // Exhaust the technology
  if (!player.exhaustedTechnologies) {
    player.exhaustedTechnologies = [];
  }
  player.exhaustedTechnologies.push('mageon_implants');

  // Log the action
  logComponentAction(state, playerId, 'Mageon Implants', `Stole action card from ${targetPlayer.faction}`);

  // Advance to next player
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'action_card_stolen'],
    data: { techId: 'mageon_implants', targetPlayerId, cardId: stolenCard },
  };
}

/**
 * Helper interface for Transit Diodes relocations
 * Units are found by ID from anywhere on the board
 */
interface TransitDiodesRelocation {
  unitId: string;
  toPlanetId: string;
}

/**
 * Find a planet by ID across all tiles
 */
function findPlanetById(state: GameState, planetId: string): PlanetInstance | undefined {
  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p) => p.planetId === planetId);
    if (planet) {
      return planet;
    }
  }
  return undefined;
}

/**
 * Find a unit on the board and return its location
 */
function findUnitOnBoard(
  state: GameState,
  unitId: string
): { planet: PlanetInstance; unit: UnitInstance } | undefined {
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

/**
 * Advance game state after a component action
 * Similar to how tactical/strategic actions advance the turn
 */
export function advanceAfterComponentAction(state: GameState): void {
  // Component action counts as the player's action for the turn
  // Move to next player in initiative order
  const currentIndex = state.initiativeOrder.indexOf(state.activePlayerId);

  // Find next non-passed player
  for (let i = 1; i <= state.initiativeOrder.length; i++) {
    const nextIndex = (currentIndex + i) % state.initiativeOrder.length;
    const nextPlayerId = state.initiativeOrder[nextIndex];
    const nextPlayer = state.players.find((p) => p.id === nextPlayerId);

    if (nextPlayer && !nextPlayer.passed) {
      state.activePlayerId = nextPlayerId;
      state.subPhase = 'awaiting_action';
      return;
    }
  }

  // All players have passed - this shouldn't happen during action phase
  // but handle gracefully
  state.subPhase = 'awaiting_action';
}

// ============================================================================
// FACTION ABILITY HANDLERS
// ============================================================================

/**
 * Handle ACTION: faction abilities
 */
function handleFactionAbilityAction(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  switch (action.componentId) {
    case 'star_forge':
      return handleStarForge(state, action, playerId);

    case 'orbital_drop':
      return handleOrbitalDrop(state, action, playerId);

    case 'stall_tactics':
      return handleStallTactics(state, action, playerId);

    case 'peace_accords':
      return handlePeaceAccords(state, action, playerId);

    default:
      return { success: false, error: `Unknown faction ability: ${action.componentId}` };
  }
}

/**
 * Star Forge (Muaat Faction Ability)
 * ACTION: Spend 1 token from your strategy pool to place 1 cruiser in your home system.
 */
function handleStarForge(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Muaat
  if (player.faction !== 'muaat') {
    return { success: false, error: 'Only Muaat can use Star Forge' };
  }

  // Check for strategy token
  if (player.commandTokens.strategy < 1) {
    return { success: false, error: 'No strategy tokens available' };
  }

  // Find home system
  const homeTile = state.map.tiles.find((t) => t.systemId === getHomeSystemId(player.faction));
  if (!homeTile) {
    return { success: false, error: 'Home system not found' };
  }

  // Spend strategy token
  player.commandTokens.strategy -= 1;

  // Place cruiser in home system
  const newCruiser = createUnitInstance('cruiser', playerId);
  homeTile.units.push(newCruiser);

  logComponentAction(state, playerId, 'Star Forge', 'Placed 1 cruiser in home system');
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'unit_produced'],
    data: { abilityId: 'star_forge', unitType: 'cruiser' },
  };
}

/**
 * Orbital Drop (Sol Faction Ability)
 * ACTION: Spend 1 token from your strategy pool to place 2 infantry on 1 planet you control.
 */
function handleOrbitalDrop(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Sol
  if (player.faction !== 'sol') {
    return { success: false, error: 'Only Sol can use Orbital Drop' };
  }

  // Check for strategy token
  if (player.commandTokens.strategy < 1) {
    return { success: false, error: 'No strategy tokens available' };
  }

  // Must specify target planet
  const targetPlanetId = action.targets?.planetId;
  if (!targetPlanetId) {
    return { success: false, error: 'Must specify target planet' };
  }

  // Find and validate planet
  const targetPlanet = findPlanetById(state, targetPlanetId);
  if (!targetPlanet) {
    return { success: false, error: 'Planet not found' };
  }
  if (targetPlanet.controlledBy !== playerId) {
    return { success: false, error: 'You must control the target planet' };
  }

  // Spend strategy token
  player.commandTokens.strategy -= 1;

  // Place 2 infantry
  for (let i = 0; i < 2; i++) {
    const newInfantry = createUnitInstance('infantry', playerId, targetPlanetId);
    targetPlanet.units.push(newInfantry);
  }

  logComponentAction(state, playerId, 'Orbital Drop', `Placed 2 infantry on ${targetPlanetId}`);
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'units_produced'],
    data: { abilityId: 'orbital_drop', planetId: targetPlanetId, count: 2 },
  };
}

/**
 * Stall Tactics (Yssaril Faction Ability)
 * ACTION: Discard 1 action card from your hand.
 * (This allows Yssaril to take an action without doing anything significant)
 */
function handleStallTactics(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Yssaril
  if (player.faction !== 'yssaril') {
    return { success: false, error: 'Only Yssaril can use Stall Tactics' };
  }

  // Must specify action card to discard
  const cardToDiscard = action.targets?.actionCardId;
  if (!cardToDiscard) {
    return { success: false, error: 'Must specify action card to discard' };
  }

  // Check player has the card
  const cardIndex = player.actionCards?.indexOf(cardToDiscard) ?? -1;
  if (cardIndex === -1) {
    return { success: false, error: 'You do not have that action card' };
  }

  // Discard the card
  player.actionCards!.splice(cardIndex, 1);
  if (!state.actionCardDiscard) {
    state.actionCardDiscard = [];
  }
  state.actionCardDiscard.push(cardToDiscard);

  logComponentAction(state, playerId, 'Stall Tactics', 'Discarded 1 action card');

  // Blackshade Infiltrator mech DEPLOY trigger:
  // "After you use your Stall Tactics faction ability, you may place 1 mech on a planet you control."
  // This is tracked via the triggered event so the UI can prompt for mech deployment
  const canDeployMech = canDeployBlackshadeInfiltrator(state, playerId);

  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: canDeployMech
      ? ['component_action_used', 'action_card_discarded', 'blackshade_infiltrator_deploy_available']
      : ['component_action_used', 'action_card_discarded'],
    data: { abilityId: 'stall_tactics', cardId: cardToDiscard, canDeployMech },
  };
}

/**
 * Check if Yssaril can deploy Blackshade Infiltrator mech
 * Requires: player controls at least one planet and has mechs in reinforcements
 */
function canDeployBlackshadeInfiltrator(state: GameState, playerId: string): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.faction !== 'yssaril') return false;

  // Check if player controls any planets
  if (!player.planets || player.planets.length === 0) return false;

  // Check if player has mechs available in reinforcements (max 4)
  const mechCount = state.map.tiles.reduce((count, tile) => {
    return count + tile.units.filter((u) => u.ownerId === playerId && u.type === 'mech').length;
  }, 0);

  return mechCount < 4;
}

/**
 * Peace Accords (Xxcha Faction Ability)
 * After you resolve the primary or secondary ability of the "Diplomacy" strategy card,
 * you may gain control of 1 planet other than Mecatol Rex that does not contain any
 * units and is in a system that is adjacent to a planet you control.
 *
 * Note: This is triggered via the 'peace_accords_available' event from Diplomacy resolution.
 */
function handlePeaceAccords(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Xxcha
  if (player.faction !== 'xxcha') {
    return { success: false, error: 'Only Xxcha can use Peace Accords' };
  }

  // Must specify target planet
  const targetPlanetId = action.targets?.planetId;
  if (!targetPlanetId) {
    return { success: false, error: 'Must specify a planet to claim' };
  }

  // Validate the target planet:
  // 1. Not Mecatol Rex
  // 2. No units on it
  // 3. In a system adjacent to a system where Xxcha controls a planet

  let targetPlanet = null;
  let targetTile = null;

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.planetId === targetPlanetId) {
        targetPlanet = planet;
        targetTile = tile;
        break;
      }
    }
    if (targetPlanet) break;
  }

  if (!targetPlanet || !targetTile) {
    return { success: false, error: 'Planet not found' };
  }

  // Check not Mecatol Rex
  if (targetPlanetId === 'mecatol_rex') {
    return { success: false, error: 'Cannot claim Mecatol Rex with Peace Accords' };
  }

  // Check no units on the planet
  if (targetPlanet.units && targetPlanet.units.length > 0) {
    return { success: false, error: 'Planet has units on it' };
  }

  // Check if it's the player's own planet
  if (targetPlanet.controlledBy === playerId) {
    return { success: false, error: 'You already control this planet' };
  }

  // Check adjacency to a system where player controls a planet
  let isAdjacentToControlled = false;
  for (const tile of state.map.tiles) {
    const controlsPlanetInTile = tile.planets.some((p) => p.controlledBy === playerId);
    if (controlsPlanetInTile) {
      // Check if target tile is adjacent to this tile
      const dq = Math.abs(targetTile.position.q - tile.position.q);
      const dr = Math.abs(targetTile.position.r - tile.position.r);
      const ds = Math.abs(
        (-targetTile.position.q - targetTile.position.r) - (-tile.position.q - tile.position.r)
      );
      if (dq <= 1 && dr <= 1 && ds <= 1 && dq + dr + ds === 2) {
        isAdjacentToControlled = true;
        break;
      }
    }
  }

  if (!isAdjacentToControlled) {
    return { success: false, error: 'Planet must be in a system adjacent to one you control' };
  }

  // Transfer control
  const previousOwner = targetPlanet.controlledBy;
  targetPlanet.controlledBy = playerId;
  targetPlanet.exhausted = true; // Planets are gained exhausted

  // Update player's planet list
  player.planets.push({
    planetId: targetPlanetId,
    exhausted: true,
    attachments: [],
  });

  // Remove from previous owner if any
  if (previousOwner) {
    const prevPlayer = state.players.find((p) => p.id === previousOwner);
    if (prevPlayer) {
      const idx = prevPlayer.planets.findIndex((p) => p.planetId === targetPlanetId);
      if (idx !== -1) {
        prevPlayer.planets.splice(idx, 1);
      }
    }
  }

  logComponentAction(state, playerId, 'Peace Accords', `Claimed planet ${targetPlanetId}`);
  // Note: No advanceAfterComponentAction - Peace Accords is triggered during strategic action, not as standalone action

  return {
    success: true,
    triggeredEvents: ['peace_accords_claimed', 'planet_control_changed'],
    data: { abilityId: 'peace_accords', planetId: targetPlanetId, previousOwner },
  };
}

// ============================================================================
// ADDITIONAL FACTION TECH HANDLERS
// ============================================================================

/**
 * Production Biomes (Hacan Faction Tech)
 * ACTION: Exhaust this card and spend 1 token from your strategy pool to gain 4 trade goods
 * and choose 1 other player; that player gains 2 trade goods.
 */
function handleProductionBiomes(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Hacan
  if (player.faction !== 'hacan') {
    return { success: false, error: 'Only Hacan can use Production Biomes' };
  }

  // Check for strategy token
  if (player.commandTokens.strategy < 1) {
    return { success: false, error: 'No strategy tokens available' };
  }

  // Must specify target player
  const targetPlayerId = action.targets?.playerId;
  if (!targetPlayerId) {
    return { success: false, error: 'Must specify another player to give trade goods' };
  }
  if (targetPlayerId === playerId) {
    return { success: false, error: 'Must choose another player' };
  }

  const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { success: false, error: 'Target player not found' };
  }

  // Spend strategy token
  player.commandTokens.strategy -= 1;

  // Exhaust tech
  if (!player.exhaustedTechnologies) {
    player.exhaustedTechnologies = [];
  }
  player.exhaustedTechnologies.push('production_biomes');

  // Gain 4 trade goods
  player.tradeGoods += 4;

  // Target gains 2 trade goods
  targetPlayer.tradeGoods += 2;

  logComponentAction(state, playerId, 'Production Biomes', `Gained 4 TG, ${targetPlayer.faction} gained 2 TG`);
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'trade_goods_gained'],
    data: { techId: 'production_biomes', playerGained: 4, targetGained: 2, targetPlayerId },
  };
}

/**
 * Wormhole Generator Ω (Creuss Faction Tech)
 * ACTION: Exhaust this card to place or move a Creuss wormhole token into either a system
 * that contains a planet you control or a non-home system that does not contain another player's ships.
 */
function handleWormholeGenerator(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Creuss
  if (player.faction !== 'creuss') {
    return { success: false, error: 'Only Creuss can use Wormhole Generator' };
  }

  // Must specify target system
  const targetSystemIdStr = action.targets?.systemId;
  if (!targetSystemIdStr) {
    return { success: false, error: 'Must specify target system' };
  }

  const targetSystemId = parseInt(targetSystemIdStr, 10);
  if (isNaN(targetSystemId)) {
    return { success: false, error: 'Invalid system ID' };
  }

  const targetTile = state.map.tiles.find((t) => t.systemId === targetSystemId);
  if (!targetTile) {
    return { success: false, error: 'System not found' };
  }

  // Check valid placement: planet you control OR non-home with no enemy ships
  const hasControlledPlanet = targetTile.planets.some((p) => p.controlledBy === playerId);
  const isHomeSystem = isHomeSystemTile(targetTile);
  const hasEnemyShips = targetTile.units.some((u) => u.ownerId !== playerId);

  if (!hasControlledPlanet && (isHomeSystem || hasEnemyShips)) {
    return { success: false, error: 'Invalid target: must control a planet or be a non-home system without enemy ships' };
  }

  // Exhaust tech
  if (!player.exhaustedTechnologies) {
    player.exhaustedTechnologies = [];
  }
  player.exhaustedTechnologies.push('wormhole_generator');

  // Remove existing Creuss wormhole token from any tile
  for (const tile of state.map.tiles) {
    if (tile.wormhole === 'delta') {
      tile.wormhole = null;
    }
  }

  // Place Creuss (delta) wormhole in target system
  targetTile.wormhole = 'delta';

  logComponentAction(state, playerId, 'Wormhole Generator', `Placed delta wormhole in system ${targetSystemId}`);
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'wormhole_placed'],
    data: { techId: 'wormhole_generator', systemId: targetSystemId },
  };
}

/**
 * Vortex (Vuil'Raith Faction Tech)
 * ACTION: Exhaust this card to choose another player's non-structure unit in a system that is
 * adjacent to 1 or more of your space docks. Capture that unit.
 */
function handleVortex(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Vuil'Raith
  if (player.faction !== 'vuil_raith' && player.faction !== 'vuil\'raith' && player.faction !== 'cabal') {
    return { success: false, error: 'Only Vuil\'Raith can use Vortex' };
  }

  // Must specify target system and unit
  const targetSystemIdStr = action.targets?.systemId;
  const targetUnitId = action.targets?.unitType; // Reusing unitType as unit ID for now

  if (!targetSystemIdStr || !targetUnitId) {
    return { success: false, error: 'Must specify target system and unit' };
  }

  const targetSystemId = parseInt(targetSystemIdStr, 10);
  if (isNaN(targetSystemId)) {
    return { success: false, error: 'Invalid system ID' };
  }

  const targetTile = state.map.tiles.find((t) => t.systemId === targetSystemId);
  if (!targetTile) {
    return { success: false, error: 'System not found' };
  }

  // Check if system is adjacent to a space dock
  const spaceDockSystems = findSystemsWithSpaceDock(state, playerId);
  const isAdjacent = spaceDockSystems.some((sdTile) =>
    areSystemsAdjacent(state, sdTile.systemId, targetSystemId)
  );

  if (!isAdjacent) {
    return { success: false, error: 'Target system must be adjacent to one of your space docks' };
  }

  // Find the target unit (in space or on planet)
  let capturedUnit: UnitInstance | undefined;
  let unitSource: 'space' | 'planet' = 'space';

  // Check space units
  const spaceUnitIndex = targetTile.units.findIndex(
    (u) => u.id === targetUnitId && u.ownerId !== playerId
  );
  if (spaceUnitIndex !== -1) {
    capturedUnit = targetTile.units[spaceUnitIndex];
    targetTile.units.splice(spaceUnitIndex, 1);
  } else {
    // Check planet units
    for (const planet of targetTile.planets) {
      const planetUnitIndex = planet.units.findIndex(
        (u) => u.id === targetUnitId && u.ownerId !== playerId
      );
      if (planetUnitIndex !== -1) {
        capturedUnit = planet.units[planetUnitIndex];
        planet.units.splice(planetUnitIndex, 1);
        unitSource = 'planet';
        break;
      }
    }
  }

  if (!capturedUnit) {
    return { success: false, error: 'Target unit not found or is your own' };
  }

  // Can't capture structures
  if (capturedUnit.type === 'space_dock' || capturedUnit.type === 'pds') {
    return { success: false, error: 'Cannot capture structures' };
  }

  // Exhaust tech
  if (!player.exhaustedTechnologies) {
    player.exhaustedTechnologies = [];
  }
  player.exhaustedTechnologies.push('vortex');

  // Add to captured units (initialize if needed)
  if (!player.capturedUnits) {
    player.capturedUnits = [];
  }
  player.capturedUnits.push({
    ...capturedUnit,
    originalOwnerId: capturedUnit.ownerId,
  });

  logComponentAction(state, playerId, 'Vortex', `Captured ${capturedUnit.type} from system ${targetSystemId}`);
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'unit_captured'],
    data: { techId: 'vortex', unitType: capturedUnit.type, systemId: targetSystemId },
  };
}

/**
 * Temporal Command Suite (Nomad Faction Tech)
 * ACTION: After any player's agent becomes exhausted, you may exhaust this card to ready that agent.
 * Note: This is typically used reactively, but can also be used proactively.
 */
function handleTemporalCommandSuite(
  state: GameState,
  action: ComponentAction,
  playerId: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Nomad
  if (player.faction !== 'nomad') {
    return { success: false, error: 'Only Nomad can use Temporal Command Suite' };
  }

  // Must specify target player whose agent to ready
  const targetPlayerId = action.targets?.playerId;
  if (!targetPlayerId) {
    return { success: false, error: 'Must specify player whose agent to ready' };
  }

  const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { success: false, error: 'Target player not found' };
  }

  // Check target player has an exhausted agent
  if (!targetPlayer.leaders?.agent?.exhausted) {
    return { success: false, error: 'Target player\'s agent is not exhausted' };
  }

  // Exhaust tech
  if (!player.exhaustedTechnologies) {
    player.exhaustedTechnologies = [];
  }
  player.exhaustedTechnologies.push('temporal_command_suite');

  // Ready the target agent
  targetPlayer.leaders.agent.exhausted = false;

  logComponentAction(state, playerId, 'Temporal Command Suite', `Readied ${targetPlayer.faction}'s agent`);
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['component_action_used', 'agent_readied'],
    data: { techId: 'temporal_command_suite', targetPlayerId },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get home system ID for a faction
 */
function getHomeSystemId(faction: string): number {
  const homeSystemIds: Record<string, number> = {
    arborec: 5,
    barony: 10,
    hacan: 16,
    jolnar: 12,
    l1z1x: 8,
    letnev: 10,
    mentak: 2,
    muaat: 4,
    naalu: 9,
    nekro: 13,
    saar: 11,
    sardakk: 14,
    sol: 1,
    winnu: 7,
    xxcha: 15,
    yin: 3,
    yssaril: 6,
    argent: 58,
    cabal: 54,
    empyrean: 56,
    mahact: 52,
    naazrokha: 57,
    nomad: 53,
    titans: 55,
    creuss: 51, // Creuss has special home system
  };
  return homeSystemIds[faction] || 0;
}

/**
 * Check if a tile is a home system
 */
function isHomeSystemTile(tile: MapTile): boolean {
  // Home systems are generally system IDs 1-17 for base game, 51-58 for PoK
  return (tile.systemId >= 1 && tile.systemId <= 17) ||
         (tile.systemId >= 51 && tile.systemId <= 58);
}

/**
 * Find all systems with player's space dock
 */
function findSystemsWithSpaceDock(state: GameState, playerId: string): MapTile[] {
  return state.map.tiles.filter((tile) => {
    // Check planets for space docks
    const hasOnPlanet = tile.planets.some((planet) =>
      planet.units.some((u) => u.type === 'space_dock' && u.ownerId === playerId)
    );
    // Check space for floating space docks (Saar)
    const hasInSpace = tile.units.some(
      (u) => u.type === 'space_dock' && u.ownerId === playerId
    );
    return hasOnPlanet || hasInSpace;
  });
}

/**
 * Check if two systems are adjacent
 * Simple implementation - checks if hex coordinates are neighbors
 */
function areSystemsAdjacent(state: GameState, systemId1: number, systemId2: number): boolean {
  const tile1 = state.map.tiles.find((t) => t.systemId === systemId1);
  const tile2 = state.map.tiles.find((t) => t.systemId === systemId2);

  if (!tile1 || !tile2) return false;

  const pos1 = tile1.position;
  const pos2 = tile2.position;

  // Hex neighbors differ by at most 1 in each coordinate and sum to 0
  const dq = Math.abs(pos1.q - pos2.q);
  const dr = Math.abs(pos1.r - pos2.r);
  const ds = Math.abs((-pos1.q - pos1.r) - (-pos2.q - pos2.r));

  // Adjacent hexes have exactly 2 coordinates differ by 1
  return (dq + dr + ds) === 2;
}

// ============================================================================
// ION STORM TOKEN HANDLERS
// ============================================================================

/**
 * Handle placing the Ion Storm token
 * ACTION: Place the Ion Storm token in any system, choosing alpha or beta side.
 */
export function handlePlaceIonStorm(
  state: GameState,
  action: { playerId: string; systemId: string; side: 'alpha' | 'beta' }
): HandlerResult {
  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Find the target system
  const targetTile = state.map.tiles.find((t) => t.id === action.systemId);
  if (!targetTile) {
    return { success: false, error: 'System not found' };
  }

  // Cannot place in home systems
  if (isHomeSystemTile(targetTile)) {
    return { success: false, error: 'Cannot place Ion Storm in a home system' };
  }

  // Cannot place in system that already has a wormhole
  if (targetTile.wormhole) {
    return { success: false, error: 'Cannot place Ion Storm in a system with an existing wormhole' };
  }

  // Place the Ion Storm token
  state.ionStormToken = {
    systemId: action.systemId,
    side: action.side,
  };

  logComponentAction(state, action.playerId, 'Ion Storm', `Placed Ion Storm (${action.side}) in system ${targetTile.systemId}`);
  advanceAfterComponentAction(state);

  return {
    success: true,
    triggeredEvents: ['ion_storm_placed'],
    data: { systemId: action.systemId, side: action.side },
  };
}

/**
 * Flip the Ion Storm token to the opposite side
 * Called when ships pass through the Ion Storm wormhole during movement.
 * NOTE: Does NOT flip for Skilled Retreat action card.
 */
export function flipIonStorm(state: GameState): void {
  if (!state.ionStormToken) return;

  // Flip to opposite side
  state.ionStormToken.side = state.ionStormToken.side === 'alpha' ? 'beta' : 'alpha';
}

/**
 * Check if a system has the Ion Storm token and get its wormhole type
 */
export function getIonStormWormhole(state: GameState, systemId: string): 'alpha' | 'beta' | null {
  if (state.ionStormToken && state.ionStormToken.systemId === systemId) {
    return state.ionStormToken.side;
  }
  return null;
}

/**
 * Check if movement through wormhole should trigger Ion Storm flip
 * Returns true if ships used the Ion Storm wormhole for movement
 */
export function shouldFlipIonStorm(
  state: GameState,
  fromSystemId: string,
  toSystemId: string,
  isSkillRetreat: boolean = false
): boolean {
  // Skilled Retreat does NOT flip the Ion Storm
  if (isSkillRetreat) return false;

  // No Ion Storm token placed
  if (!state.ionStormToken) return false;

  const ionStormSystemId = state.ionStormToken.systemId;
  const ionStormSide = state.ionStormToken.side;

  // Check if either system is the Ion Storm system
  const fromIsIonStorm = fromSystemId === ionStormSystemId;
  const toIsIonStorm = toSystemId === ionStormSystemId;

  if (!fromIsIonStorm && !toIsIonStorm) return false;

  // Find the tiles
  const fromTile = state.map.tiles.find((t) => t.id === fromSystemId);
  const toTile = state.map.tiles.find((t) => t.id === toSystemId);

  if (!fromTile || !toTile) return false;

  // Check if movement used the wormhole connection
  // (not hex adjacency - must have gone through wormhole)
  const isHexAdjacent = checkHexAdjacent(fromTile.position, toTile.position);
  if (isHexAdjacent) return false; // Moved via hex adjacency, not wormhole

  // Check if the other system has a matching wormhole
  const otherSystem = fromIsIonStorm ? toTile : fromTile;
  const otherWormhole = otherSystem.wormhole;

  // If the other system's wormhole matches the Ion Storm side, ships used the wormhole
  if (otherWormhole === ionStormSide) {
    return true;
  }

  return false;
}

/**
 * Helper to check hex adjacency
 */
function checkHexAdjacent(pos1: { q: number; r: number }, pos2: { q: number; r: number }): boolean {
  const dq = Math.abs(pos1.q - pos2.q);
  const dr = Math.abs(pos1.r - pos2.r);
  const ds = Math.abs((-pos1.q - pos1.r) - (-pos2.q - pos2.r));
  return Math.max(dq, dr, ds) === 1;
}
