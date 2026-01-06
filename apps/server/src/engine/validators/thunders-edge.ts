/**
 * Thunder's Edge Expansion Validators
 *
 * Validates all Thunder's Edge specific actions:
 * - Expedition claims
 * - Coexistence (Deepwrought)
 * - Structure transport (Ral Nel)
 * - Breach tokens (Crimson Rebellion)
 * - Galvanize (Last Bastion)
 * - Plot cards (Firmament/Obsidian)
 * - Breakthroughs
 */

import type {
  GameState,
  ClaimExpeditionSliceAction,
  StartCoexistenceAction,
  EndCoexistenceAction,
  PlayOceanCardAction,
  PickupStructureAction,
  PlaceStructureAction,
  PlaceBreachTokenAction,
  FlipBreachTokenAction,
  GalvanizeUnitAction,
  RemoveGalvanizeAction,
  DrawPlotCardAction,
  PlayPlotCardAction,
  TransformToObsidianAction,
  UseBreakthroughAction,
} from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { BREAKTHROUGHS_BY_FACTION } from '@ti4/shared';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPlayer(state: GameState, playerId: string) {
  return state.players.find(p => p.id === playerId);
}

function isThundersEdgeFaction(factionId: string): boolean {
  return ['last_bastion', 'deepwrought', 'ral_nel', 'crimson_rebellion', 'firmament', 'obsidian'].includes(factionId);
}

// ============================================================================
// EXPEDITION VALIDATORS
// ============================================================================

/**
 * Validate claim expedition slice action
 */
export function validateClaimExpeditionSlice(
  state: GameState,
  action: ClaimExpeditionSliceAction
): ValidationResult {
  // Must be in action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only claim expedition slices during action phase' };
  }

  // Must be awaiting action
  if (state.subPhase !== 'awaiting_action') {
    return { valid: false, error: 'Cannot claim expedition slice while another action is in progress' };
  }

  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Player must not have passed
  if (player.passed) {
    return { valid: false, error: 'Cannot act after passing' };
  }

  // Check expedition exists
  if (!state.expeditionState) {
    return { valid: false, error: 'Expedition not initialized' };
  }

  // Check expedition not completed
  if (state.expeditionState.completed) {
    return { valid: false, error: 'Expedition already completed' };
  }

  // Check slice is valid (0-5)
  if (action.sliceIndex < 0 || action.sliceIndex > 5) {
    return { valid: false, error: 'Invalid slice index' };
  }

  // Check slice not already claimed
  const slice = state.expeditionState.slices[action.sliceIndex];
  if (!slice || slice.claimed) {
    return { valid: false, error: 'Slice already claimed or invalid' };
  }

  return { valid: true };
}

// ============================================================================
// COEXISTENCE VALIDATORS (Deepwrought)
// ============================================================================

/**
 * Validate start coexistence action
 */
export function validateStartCoexistence(
  state: GameState,
  action: StartCoexistenceAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Deepwrought
  if (player.faction !== 'deepwrought') {
    return { valid: false, error: 'Only Deepwrought can initiate coexistence' };
  }

  // Target player must exist
  const targetPlayer = getPlayer(state, action.withPlayerId);
  if (!targetPlayer) {
    return { valid: false, error: 'Target player not found' };
  }

  // Cannot coexist with yourself
  if (action.playerId === action.withPlayerId) {
    return { valid: false, error: 'Cannot coexist with yourself' };
  }

  return { valid: true };
}

/**
 * Validate end coexistence action
 */
export function validateEndCoexistence(
  state: GameState,
  action: EndCoexistenceAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  return { valid: true };
}

/**
 * Validate play ocean card action
 */
export function validatePlayOceanCard(
  state: GameState,
  action: PlayOceanCardAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Deepwrought
  if (player.faction !== 'deepwrought') {
    return { valid: false, error: 'Only Deepwrought can play ocean cards' };
  }

  return { valid: true };
}

// ============================================================================
// STRUCTURE TRANSPORT VALIDATORS (Ral Nel)
// ============================================================================

/**
 * Validate pickup structure action
 */
export function validatePickupStructure(
  state: GameState,
  action: PickupStructureAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Ral Nel
  if (player.faction !== 'ral_nel') {
    return { valid: false, error: 'Only Ral Nel Consortium can transport structures' };
  }

  return { valid: true };
}

/**
 * Validate place structure action
 */
export function validatePlaceStructure(
  state: GameState,
  action: PlaceStructureAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Ral Nel
  if (player.faction !== 'ral_nel') {
    return { valid: false, error: 'Only Ral Nel Consortium can transport structures' };
  }

  return { valid: true };
}

// ============================================================================
// BREACH TOKEN VALIDATORS (Crimson Rebellion)
// ============================================================================

/**
 * Validate place breach token action
 */
export function validatePlaceBreachToken(
  state: GameState,
  action: PlaceBreachTokenAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Crimson Rebellion
  if (player.faction !== 'crimson_rebellion') {
    return { valid: false, error: 'Only Crimson Rebellion can place breach tokens' };
  }

  return { valid: true };
}

/**
 * Validate flip breach token action
 */
export function validateFlipBreachToken(
  state: GameState,
  action: FlipBreachTokenAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Crimson Rebellion
  if (player.faction !== 'crimson_rebellion') {
    return { valid: false, error: 'Only Crimson Rebellion can flip breach tokens' };
  }

  return { valid: true };
}

// ============================================================================
// GALVANIZE VALIDATORS (Last Bastion)
// ============================================================================

/**
 * Validate galvanize unit action
 */
export function validateGalvanizeUnit(
  state: GameState,
  action: GalvanizeUnitAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Last Bastion
  if (player.faction !== 'last_bastion') {
    return { valid: false, error: 'Only Last Bastion can galvanize units' };
  }

  return { valid: true };
}

/**
 * Validate remove galvanize action
 */
export function validateRemoveGalvanize(
  state: GameState,
  action: RemoveGalvanizeAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Last Bastion
  if (player.faction !== 'last_bastion') {
    return { valid: false, error: 'Only Last Bastion can remove galvanize' };
  }

  return { valid: true };
}

// ============================================================================
// PLOT CARD VALIDATORS (Firmament/Obsidian)
// ============================================================================

/**
 * Validate draw plot card action
 */
export function validateDrawPlotCard(
  state: GameState,
  action: DrawPlotCardAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Firmament or Obsidian
  if (player.faction !== 'firmament' && player.faction !== 'obsidian') {
    return { valid: false, error: 'Only The Firmament or The Obsidian can draw plot cards' };
  }

  return { valid: true };
}

/**
 * Validate play plot card action
 */
export function validatePlayPlotCard(
  state: GameState,
  action: PlayPlotCardAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Firmament or Obsidian
  if (player.faction !== 'firmament' && player.faction !== 'obsidian') {
    return { valid: false, error: 'Only The Firmament or The Obsidian can play plot cards' };
  }

  return { valid: true };
}

/**
 * Validate transform to Obsidian action
 */
export function validateTransformToObsidian(
  state: GameState,
  action: TransformToObsidianAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be Firmament
  if (player.faction !== 'firmament') {
    return { valid: false, error: 'Only The Firmament can transform to The Obsidian' };
  }

  return { valid: true };
}

// ============================================================================
// BREAKTHROUGH VALIDATORS
// ============================================================================

/**
 * Validate use breakthrough action
 */
export function validateUseBreakthrough(
  state: GameState,
  action: UseBreakthroughAction
): ValidationResult {
  const player = getPlayer(state, action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check player has a breakthrough
  if (!player.breakthrough) {
    return { valid: false, error: 'No breakthrough' };
  }

  // Check breakthrough is unlocked
  if (!player.breakthrough.unlocked) {
    return { valid: false, error: 'Breakthrough not yet unlocked' };
  }

  // Get breakthrough definition
  const breakthroughDef = BREAKTHROUGHS_BY_FACTION[player.faction];
  if (!breakthroughDef) {
    return { valid: false, error: 'Breakthrough definition not found' };
  }

  // If exhaustable, check not exhausted
  if (breakthroughDef.isExhaustable && player.breakthrough.exhausted) {
    return { valid: false, error: 'Breakthrough is exhausted' };
  }

  return { valid: true };
}
