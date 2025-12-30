import type {
  GameState,
  PassAction,
  TacticalAction,
  StrategicAction,
  MoveUnitsAction,
  SkipMovementAction,
  ProduceUnitsAction,
  SkipProductionAction,
  UnitType,
  MapTile,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { findTileAtPosition } from '../utils/hex.js';
import {
  hasEnemyShips,
  isShipType,
  isGroundUnit,
  createUnitInstance,
  calculateProductionCost,
} from '../utils/units.js';
import { findDefenderId } from '../utils/combat.js';
import { initializeCombat } from './combat.js';
import { initializeInvasion, getInvadablePlanets, hasGroundForcesToLand } from './invasion.js';
import { units } from '@ti4/game-data';

/**
 * Handle pass action
 */
export function handlePass(state: GameState, action: PassAction): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  player.passed = true;

  // Find next non-passed player
  advanceToNextActivePlayer(state);

  return {
    success: true,
    triggeredEvents: ['player_passed'],
  };
}

/**
 * Handle tactical action (system activation)
 */
export function handleTacticalAction(
  state: GameState,
  action: TacticalAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const targetTile = findTileAtPosition(state.map, action.systemPosition);
  if (!targetTile) {
    return { success: false, error: 'System not found' };
  }

  // Spend tactics command token
  player.commandTokens.tactics--;

  // Place command token in system
  targetTile.commandTokens.push(action.playerId);

  // Track the activated system for this tactical action
  state.activatedSystem = action.systemPosition;

  // Transition to movement sub-phase
  state.subPhase = 'tactical_movement';

  return {
    success: true,
    triggeredEvents: ['system_activated'],
  };
}

/**
 * Handle strategic action (using strategy card)
 */
export function handleStrategicAction(
  state: GameState,
  action: StrategicAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const card = state.strategyCards.find(c => c.number === action.cardNumber);
  if (!card) {
    return { success: false, error: 'Strategy card not found' };
  }

  // Mark card as used
  player.strategyCardUsed = true;
  card.exhausted = true;

  // Initialize strategic action tracking
  initializeStrategicActionState(state, action.playerId, action.cardNumber);

  // Enter strategic primary sub-phase
  state.subPhase = 'strategic_primary';

  return {
    success: true,
    triggeredEvents: ['strategic_action_started'],
  };
}

/**
 * Initialize strategic action state when a player uses their strategy card
 */
function initializeStrategicActionState(
  state: GameState,
  playerId: string,
  cardNumber: number
): void {
  // Build secondary order: all players except the active one, clockwise from active player
  const secondaryOrder: string[] = [];

  // Find player's position in initiative order
  const activeIndex = state.initiativeOrder.indexOf(playerId);

  // Add players clockwise from active player
  for (let i = 1; i < state.players.length; i++) {
    const index = (activeIndex + i) % state.players.length;
    const pid = state.initiativeOrder[index];
    // Only include non-passed players
    const p = state.players.find(pl => pl.id === pid);
    if (p && !p.passed) {
      secondaryOrder.push(pid);
    }
  }

  state.strategicActionState = {
    cardNumber,
    primaryResolved: false,
    secondaryOrder,
    currentSecondaryIndex: 0,
    secondaryResponses: {},
  };

  // Initialize all secondary responses as pending
  for (const pid of secondaryOrder) {
    state.strategicActionState.secondaryResponses[pid] = 'pending';
  }
}

/**
 * Complete a tactical action and advance turn
 */
export function completeTacticalAction(state: GameState): HandlerResult {
  // Clear the activated system
  state.activatedSystem = undefined;

  state.subPhase = 'awaiting_action';
  advanceToNextActivePlayer(state);

  return {
    success: true,
    triggeredEvents: ['tactical_action_completed'],
  };
}

/**
 * Complete a strategic action and start secondary window
 */
export function completeStrategicPrimary(state: GameState): HandlerResult {
  state.subPhase = 'strategic_secondary';

  // Set up secondary ability resolution order
  // Players resolve in initiative order, starting after the active player

  return {
    success: true,
    triggeredEvents: ['strategic_primary_completed'],
  };
}

/**
 * Complete strategic secondary and advance turn
 */
export function completeStrategicAction(state: GameState): HandlerResult {
  state.subPhase = 'awaiting_action';
  advanceToNextActivePlayer(state);

  return {
    success: true,
    triggeredEvents: ['strategic_action_completed'],
  };
}

/**
 * Advance to the next active (non-passed) player
 */
function advanceToNextActivePlayer(state: GameState): void {
  const currentIndex = state.initiativeOrder.indexOf(state.activePlayerId);
  const playerCount = state.initiativeOrder.length;

  // Find next non-passed player in initiative order
  for (let i = 1; i <= playerCount; i++) {
    const nextIndex = (currentIndex + i) % playerCount;
    const nextPlayerId = state.initiativeOrder[nextIndex];
    const nextPlayer = state.players.find(p => p.id === nextPlayerId);

    if (nextPlayer && !nextPlayer.passed) {
      state.activePlayerId = nextPlayerId;
      return;
    }
  }

  // All players have passed - phase will auto-transition
}

/**
 * Handle move_units action - moves units to the activated system
 */
export function handleMoveUnits(
  state: GameState,
  action: MoveUnitsAction
): HandlerResult {
  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const targetTile = findTileAtPosition(state.map, state.activatedSystem);
  if (!targetTile) {
    return { success: false, error: 'Target system not found' };
  }

  // Process each move
  for (const move of action.moves) {
    const fromTile = findTileAtPosition(state.map, move.from.systemPosition);
    if (!fromTile) continue;

    // Find and remove the unit from source
    let unit;
    if (move.from.planetId) {
      const planet = fromTile.planets.find(p => p.planetId === move.from.planetId);
      if (planet) {
        const unitIndex = planet.units.findIndex(u => u.id === move.unitId);
        if (unitIndex !== -1) {
          unit = planet.units.splice(unitIndex, 1)[0];
        }
      }
    } else {
      const unitIndex = fromTile.units.findIndex(u => u.id === move.unitId);
      if (unitIndex !== -1) {
        unit = fromTile.units.splice(unitIndex, 1)[0];
      }
    }

    if (!unit) continue;

    // Add unit to destination
    if (move.to.planetId) {
      // Moving to a planet (ground units during invasion)
      const targetPlanet = targetTile.planets.find(p => p.planetId === move.to.planetId);
      if (targetPlanet) {
        unit.planetId = move.to.planetId;
        targetPlanet.units.push(unit);
      }
    } else {
      // Moving to space area
      unit.planetId = undefined;
      targetTile.units.push(unit);
    }
  }

  // Check for combat - if enemy ships present, transition to space combat
  if (hasEnemyShips(targetTile, action.playerId)) {
    const defenderId = findDefenderId(targetTile, action.playerId);
    if (defenderId) {
      // Initialize combat
      const combat = initializeCombat(
        state,
        state.activatedSystem,
        action.playerId,
        defenderId
      );
      state.activeCombat = combat;
      state.subPhase = 'tactical_space_combat';

      return {
        success: true,
        triggeredEvents: ['units_moved', 'space_combat_initiated'],
        data: { combatId: combat.id },
      };
    }
  }

  // No space combat - check for invasion opportunities
  return checkForInvasion(state, targetTile, action.playerId, ['units_moved']);
}

/**
 * Handle skip_movement action - skips movement, checks for invasion, then production
 */
export function handleSkipMovement(
  state: GameState,
  action: SkipMovementAction
): HandlerResult {
  if (!state.activatedSystem) {
    state.subPhase = 'tactical_production';
    return {
      success: true,
      triggeredEvents: ['movement_skipped'],
    };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    state.subPhase = 'tactical_production';
    return {
      success: true,
      triggeredEvents: ['movement_skipped'],
    };
  }

  // Check for invasion opportunities
  return checkForInvasion(state, tile, action.playerId, ['movement_skipped']);
}

/**
 * Handle produce_units action - builds units in the activated system
 */
export function handleProduceUnits(
  state: GameState,
  action: ProduceUnitsAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const tile = findTileAtPosition(state.map, action.systemPosition);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  // Calculate total cost
  const totalCost = calculateProductionCost(action.units);

  // Exhaust planets to pay for production
  let resourcesNeeded = totalCost;

  // First try to use trade goods
  if (player.tradeGoods >= resourcesNeeded) {
    player.tradeGoods -= resourcesNeeded;
    resourcesNeeded = 0;
  } else {
    resourcesNeeded -= player.tradeGoods;
    player.tradeGoods = 0;

    // Exhaust planets for remaining resources
    for (const planetState of player.planets) {
      if (resourcesNeeded <= 0) break;
      if (planetState.exhausted) continue;

      // Find planet data to get resources
      const planetData = findPlanetData(planetState.planetId);
      if (planetData) {
        planetState.exhausted = true;
        resourcesNeeded -= planetData.resources;
      }
    }
  }

  // Create and place the units
  for (const production of action.units) {
    for (let i = 0; i < production.count; i++) {
      const unit = createUnitInstance(production.type, action.playerId);

      // Ships go to space, ground units go to planet if specified
      if (isShipType(production.type)) {
        tile.units.push(unit);
      } else if (isGroundUnit(production.type)) {
        // Place on the planet with the space dock
        const dockPlanet = tile.planets.find(p =>
          p.units.some(u => u.ownerId === action.playerId && u.type === 'space_dock')
        );
        if (dockPlanet) {
          unit.planetId = dockPlanet.planetId;
          dockPlanet.units.push(unit);
        }
      } else if (production.type === 'fighter') {
        // Fighters go to space
        tile.units.push(unit);
      } else if (production.type === 'pds') {
        // PDS go on planet
        const dockPlanet = tile.planets.find(p =>
          p.units.some(u => u.ownerId === action.playerId && u.type === 'space_dock')
        );
        if (dockPlanet) {
          unit.planetId = dockPlanet.planetId;
          dockPlanet.units.push(unit);
        }
      }
    }
  }

  // Complete the tactical action
  return completeTacticalActionInternal(state);
}

/**
 * Handle skip_production action - ends tactical action without producing
 */
export function handleSkipProduction(
  state: GameState,
  action: SkipProductionAction
): HandlerResult {
  // Complete the tactical action
  return completeTacticalActionInternal(state);
}

/**
 * Internal helper to complete tactical action
 */
function completeTacticalActionInternal(state: GameState): HandlerResult {
  // Clear the activated system
  state.activatedSystem = undefined;

  state.subPhase = 'awaiting_action';
  advanceToNextActivePlayer(state);

  return {
    success: true,
    triggeredEvents: ['tactical_action_completed'],
  };
}

/**
 * Find planet data by ID
 */
function findPlanetData(planetId: string): { resources: number; influence: number } | null {
  // Import systems from game-data
  const { systems } = require('@ti4/game-data');

  for (const system of Object.values(systems)) {
    const sysData = system as { planets: Array<{ id: string; resources: number; influence: number }> };
    const planet = sysData.planets.find(p => p.id === planetId);
    if (planet) {
      return { resources: planet.resources, influence: planet.influence };
    }
  }
  return null;
}

/**
 * Check if invasion is possible and transition to invasion or production
 */
function checkForInvasion(
  state: GameState,
  tile: MapTile,
  playerId: string,
  existingEvents: string[]
): HandlerResult {
  // Check if there are invadable planets
  const invadablePlanets = getInvadablePlanets(tile, playerId);

  // Check if player has ground forces to land
  const hasGroundForces = hasGroundForcesToLand(tile, playerId);

  if (invadablePlanets.length > 0 && hasGroundForces) {
    // Initialize invasion phase
    const result = initializeInvasion(state);
    if (result.success) {
      return {
        success: true,
        triggeredEvents: [...existingEvents, 'invasion_started'],
        data: result.data,
      };
    }
  }

  // No invasion - go to production
  state.subPhase = 'tactical_production';

  return {
    success: true,
    triggeredEvents: existingEvents,
  };
}

/**
 * Transition from space combat to invasion (called after space combat ends)
 */
export function transitionToInvasionAfterSpaceCombat(state: GameState): HandlerResult {
  if (!state.activatedSystem) {
    state.subPhase = 'tactical_production';
    return {
      success: true,
      triggeredEvents: ['space_combat_complete'],
    };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    state.subPhase = 'tactical_production';
    return {
      success: true,
      triggeredEvents: ['space_combat_complete'],
    };
  }

  return checkForInvasion(state, tile, state.activePlayerId, ['space_combat_complete']);
}
