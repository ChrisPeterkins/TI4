/**
 * Production Modifier Aggregation
 *
 * Collects and aggregates production modifiers from faction abilities,
 * technologies, and other sources.
 */

import type { GameState, UnitType, MapTile } from '@ti4/shared';
import type { ProductionModifiers } from './ability-types.js';
import { factions } from '@ti4/game-data';

/**
 * Default production modifiers
 */
export function getDefaultProductionModifiers(): ProductionModifiers {
  return {
    capacityBonus: 0,
    blockedUnits: [],
    costModifier: 0,
  };
}

/**
 * Get production modifiers for a player
 */
export function getProductionModifiers(
  state: GameState,
  playerId: string,
  systemId?: string
): ProductionModifiers {
  const modifiers = getDefaultProductionModifiers();
  const player = state.players.find((p) => p.id === playerId);

  if (!player || !player.faction) {
    return modifiers;
  }

  // Apply faction-specific production modifiers
  switch (player.faction) {
    case 'arborec':
      // Space docks cannot produce infantry (Mitosis handles infantry placement)
      modifiers.blockedUnits.push('infantry');
      break;

    case 'saar':
      // NOMADIC: Space docks have Production 5 (this is handled differently)
      // Their docks float in space
      break;

    default:
      break;
  }

  return modifiers;
}

/**
 * Check if a player can produce a specific unit type
 */
export function canProduceUnitType(
  state: GameState,
  playerId: string,
  unitType: UnitType,
  systemId?: string
): boolean {
  const modifiers = getProductionModifiers(state, playerId, systemId);
  return !modifiers.blockedUnits.includes(unitType);
}

/**
 * Get production capacity for Saar floating space docks
 * Saar space docks have Production 5 instead of normal production (resource-based)
 * Space Dock II upgrade increases this to Production 7
 */
export function getSaarProductionCapacity(
  state: GameState,
  playerId: string,
  systemId: string
): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || player.faction !== 'saar') {
    return 0;
  }

  const tile = state.map.tiles.find((t) => t.id === systemId);
  if (!tile) return 0;

  // Count Saar space docks in the space area (they float)
  const saarDocks = tile.units.filter(
    (u) => u.ownerId === playerId && u.type === 'space_dock'
  );

  // Check if player has Space Dock II upgrade
  const hasSpaceDockII = player.technologies.includes('space_dock_ii');

  // Base Saar dock has Production 5, upgraded has Production 7
  const productionPerDock = hasSpaceDockII ? 7 : 5;

  return saarDocks.length * productionPerDock;
}

/**
 * Check if a player's space dock is a floating dock (Saar)
 */
export function isFloatingDock(
  state: GameState,
  playerId: string
): boolean {
  const player = state.players.find((p) => p.id === playerId);
  return player?.faction === 'saar';
}

/**
 * Get resource cost modifier for production
 * Negative values = discount
 */
export function getProductionCostModifier(
  state: GameState,
  playerId: string,
  unitType: UnitType
): number {
  const modifiers = getProductionModifiers(state, playerId);
  return modifiers.costModifier;
}

/**
 * Apply Sarween Tools discount if player has the technology
 * Reduces production cost by 1 (minimum 1 per production)
 */
export function hasSarweenToolsDiscount(
  state: GameState,
  playerId: string
): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;

  return player.technologies.includes('sarween_tools');
}

/**
 * Calculate effective production cost for a unit
 */
export function getEffectiveUnitCost(
  state: GameState,
  playerId: string,
  unitType: UnitType,
  baseCost: number
): number {
  let cost = baseCost;

  // Apply faction production modifiers
  const modifiers = getProductionModifiers(state, playerId);
  cost += modifiers.costModifier;

  // Note: Sarween Tools gives a 1 resource discount per PRODUCTION action,
  // not per unit. This should be applied at the total cost level.

  return Math.max(0, cost);
}
