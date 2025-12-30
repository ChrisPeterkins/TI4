/**
 * Faction Abilities System
 *
 * Central exports for the ability system including:
 * - Ability handler registry
 * - Combat/Movement/Production modifiers
 * - Ability trigger detection
 */

// Core types
export type {
  AbilityContext,
  AbilityResult,
  AbilityHandler,
  AbilityChoices,
  CombatAbilityContext,
  CombatModifiers,
  MovementModifiers,
  ProductionModifiers,
  FleetModifiers,
  HandLimitModifiers,
  TokenGainModifiers,
  TriggeredAbility,
  AbilityWindow,
} from './ability-types.js';

// Ability registry
export {
  registerAbilityHandler,
  getAbilityHandler,
  hasAbilityHandler,
  executeAbility,
  getRegisteredHandlerIds,
  clearHandlers,
} from './ability-registry.js';

// Combat modifiers
export {
  getCombatModifiers,
  getFactionCombatModifiers,
  getDefaultCombatModifiers,
  applyHitModifier,
  isHit,
  getOpponentEffectsOnCombat,
} from './combat-modifiers.js';

// Movement modifiers
export {
  getMovementModifiers,
  getDefaultMovementModifiers,
  areSystemsAdjacent,
  getAdjacentSystems,
  doesSystemBlockMovement,
} from './movement-modifiers.js';

// Fleet and limit modifiers
export {
  getFleetModifiers,
  getDefaultFleetModifiers,
  getEffectiveFleetLimit,
  getHandLimitModifiers,
  getDefaultHandLimitModifiers,
  getEffectiveHandLimit,
  getTokenGainModifiers,
  getDefaultTokenGainModifiers,
  getStatusPhaseTokenGain,
} from './fleet-modifiers.js';

// Production modifiers
export {
  getProductionModifiers,
  getDefaultProductionModifiers,
  canProduceUnitType,
  getSaarProductionCapacity,
  isFloatingDock,
  getProductionCostModifier,
  hasSarweenToolsDiscount,
  getEffectiveUnitCost,
} from './production-modifiers.js';

// Ability triggers
export {
  checkAbilityTriggers,
  checkPhaseAbilities,
  getActionAbilities,
  getPassiveAbilities,
  canUseAbility,
  sortByInitiative,
} from './ability-triggers.js';

// Base game faction ability handlers
import { registerBaseGameFactionAbilities } from './handlers/base-game/index.js';

/**
 * Initialize all ability handlers.
 * Call this once when the server starts.
 */
export function initializeAbilityHandlers(): void {
  registerBaseGameFactionAbilities();
}

// Auto-initialize handlers on module load
initializeAbilityHandlers();
