/**
 * Types specific to ability handler system
 */

import type { GameState, UnitType, HexCoord } from '@ti4/shared';

/**
 * Context passed to ability handlers when executing
 */
export interface AbilityContext {
  // The trigger that caused this ability to be checked
  trigger?: string;
  // The player whose ability is being triggered
  playerId?: string;
  // Target player (for abilities affecting other players)
  targetPlayerId?: string;
  // Target system coordinates
  targetSystem?: HexCoord;
  // System ID (for combat/location context)
  systemId?: string;
  // Combat type (for combat abilities)
  combatType?: 'space' | 'ground';
  // Target planet ID
  targetPlanetId?: string;
  // Target unit IDs
  targetUnitIds?: string[];
  // Combat-specific context
  combatContext?: CombatAbilityContext;
  // Additional data specific to the trigger
  data?: Record<string, unknown>;
  // Player choices (for abilities requiring input)
  choices?: AbilityChoices;
  // Count (for counting triggers like action cards drawn)
  count?: number;
  // Card IDs (for card-related triggers)
  cardIds?: string[];
}

/**
 * Combat-specific context for combat abilities
 */
export interface CombatAbilityContext {
  combatType: 'space' | 'ground';
  systemId: string;
  planetId?: string;
  attackerId: string;
  defenderId: string;
  roundNumber: number;
  // Units involved in combat
  attackerUnits: string[];
  defenderUnits: string[];
  // Units destroyed this round (for after-destruction triggers)
  destroyedUnits?: { unitId: string; ownerId: string; type: UnitType }[];
}

/**
 * Player choices for abilities that require input
 */
export interface AbilityChoices {
  // Planet selection (for unit placement, etc.)
  selectedPlanetId?: string;
  // System selection (as tile ID)
  selectedSystem?: HexCoord;
  selectedSystemId?: string;
  // Unit type selection
  selectedUnitType?: UnitType;
  // Number selection (how many to place, spend, etc.)
  amount?: number;
  // Unit IDs selection
  selectedUnitIds?: string[];
  // Single unit selection
  selectedUnitId?: string;
  // Technology selection
  selectedTechId?: string;
  // Player selection
  selectedPlayerId?: string;
  // Generic yes/no choice
  confirmed?: boolean;
  // Whether to convert commodity to trade good
  convertCommodity?: boolean;
  // Action card selection
  selectedCardId?: string;
  // Plot card selection (Firmament)
  selectedPlotCardId?: string;
  // Control token owner selection
  controlTokenPlayerId?: string;
  // Ship swap data (Crimson Rebellion agent)
  ship1?: { unitId: string; fromSystem: string; toSystem: string };
  ship2?: { unitId: string; fromSystem: string; toSystem: string };
}

/**
 * Result of ability handler execution
 */
export interface AbilityResult {
  success: boolean;
  error?: string;
  // State modifications made
  stateModified?: boolean;
  // Events triggered by this ability
  triggeredEvents?: string[];
  // Additional data returned by the handler
  data?: Record<string, unknown>;
}

/**
 * Ability handler function signature
 */
export type AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
) => AbilityResult;

/**
 * Combat modifiers aggregated from all sources
 */
export interface CombatModifiers {
  // Bonus/penalty to hit threshold (negative = easier to hit)
  hitModifier: number;
  // Additional dice to roll
  additionalDice: number;
  // Number of dice that can be rerolled
  rerollCount: number;
  // Whether all dice can be rerolled
  canRerollAll: boolean;
  // Specific hit threshold override (for special units)
  hitThresholdOverride?: number;
  // Whether hits must be assigned to non-fighters
  assignToNonFighters: boolean;
  // Whether opponent can use sustain damage
  opponentCanSustain: boolean;
  // Human-readable descriptions of modifiers applied
  descriptions: string[];
}

/**
 * Movement modifiers aggregated from all sources
 */
export interface MovementModifiers {
  // Bonus to movement value
  movementBonus: number;
  // Systems that are treated as adjacent
  additionalAdjacent: HexCoord[];
  // Can move through systems with enemy ships
  canMoveThroughEnemies: boolean;
  // Immune to specific anomaly effects
  immuneToAnomalies: string[];
}

/**
 * Production modifiers aggregated from all sources
 */
export interface ProductionModifiers {
  // Bonus to production capacity
  capacityBonus: number;
  // Unit types that cannot be produced
  blockedUnits: UnitType[];
  // Resource cost modifier (negative = discount)
  costModifier: number;
}

/**
 * Fleet limit modifiers
 */
export interface FleetModifiers {
  // Bonus to fleet limit
  fleetLimitBonus: number;
}

/**
 * Hand limit modifiers
 */
export interface HandLimitModifiers {
  // Bonus to action card hand limit
  actionCardLimitBonus: number;
  // Whether hand limit is removed entirely
  noHandLimit: boolean;
}

/**
 * Token gain modifiers
 */
export interface TokenGainModifiers {
  // Bonus tokens gained during status phase
  statusPhaseBonus: number;
}

/**
 * Triggered ability info
 */
export interface TriggeredAbility {
  playerId: string;
  factionId: string;
  abilityId: string;
  abilityName: string;
  isOptional: boolean;
  requiresChoice: boolean;
  // Handler to execute
  handlerId: string;
}

/**
 * Pending ability window (when multiple players can respond)
 */
export interface AbilityWindow {
  id: string;
  trigger: string;
  context: AbilityContext;
  // Abilities that can respond
  eligibleAbilities: TriggeredAbility[];
  // Responses received
  responses: Map<string, { abilityId: string | null; choices?: AbilityChoices }>;
  // Whether window is resolved
  resolved: boolean;
}
