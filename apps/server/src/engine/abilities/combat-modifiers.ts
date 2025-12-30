/**
 * Combat Modifier Aggregation
 *
 * Collects and aggregates all combat modifiers from faction abilities,
 * technologies, action cards, and other sources.
 */

import type { GameState, PlayerState } from '@ti4/shared';
import type { CombatModifiers, CombatAbilityContext } from './ability-types.js';
import { factions } from '@ti4/game-data';

/**
 * Default combat modifiers (no bonuses/penalties)
 */
export function getDefaultCombatModifiers(): CombatModifiers {
  return {
    hitModifier: 0,
    additionalDice: 0,
    rerollCount: 0,
    canRerollAll: false,
    hitThresholdOverride: undefined,
    assignToNonFighters: false,
    opponentCanSustain: true,
    descriptions: [],
  };
}

/**
 * Get combat modifiers for a player from faction abilities
 */
export function getFactionCombatModifiers(
  state: GameState,
  playerId: string,
  combatType: 'space' | 'ground',
  context?: CombatAbilityContext
): CombatModifiers {
  const modifiers = getDefaultCombatModifiers();
  const player = state.players.find((p) => p.id === playerId);

  if (!player || !player.faction) {
    return modifiers;
  }

  const faction = factions[player.faction];
  if (!faction) {
    return modifiers;
  }

  // Apply faction-specific combat modifiers
  switch (player.faction) {
    case 'sardakk':
      // UNRELENTING: +1 to all combat rolls
      modifiers.hitModifier += 1;
      modifiers.descriptions.push('Unrelenting: +1 combat');
      break;

    case 'jolnar':
      // FRAGILE: -1 to all combat rolls
      modifiers.hitModifier -= 1;
      modifiers.descriptions.push('Fragile: -1 combat');
      break;

    case 'letnev':
      // Check if Munitions Reserves was activated (tracked in combat state)
      // This is handled separately via timing window
      break;

    case 'mentak':
      // Mentak's Fourth Moon flagship prevents opponent sustain damage
      // This would need to check if flagship is in the system
      if (context && hasFlagshipInSystem(state, playerId, context.systemId)) {
        modifiers.opponentCanSustain = false;
        modifiers.descriptions.push('Fourth Moon: opponent cannot sustain');
      }
      break;

    default:
      break;
  }

  return modifiers;
}

/**
 * Get combat modifiers for a player from all sources
 */
export function getCombatModifiers(
  state: GameState,
  playerId: string,
  combatType: 'space' | 'ground',
  context?: CombatAbilityContext
): CombatModifiers {
  // Start with faction modifiers
  const modifiers = getFactionCombatModifiers(state, playerId, combatType, context);

  // TODO: Add technology modifiers (Hyper Metabolism, etc.)
  // TODO: Add action card modifiers
  // TODO: Add promissory note modifiers
  // TODO: Add flagship ability modifiers (some affect combat)

  return modifiers;
}

/**
 * Apply combat modifiers to a hit roll
 * Returns the effective combat value (lower = better)
 */
export function applyHitModifier(
  baseCombatValue: number,
  modifiers: CombatModifiers
): number {
  // Hit modifier is subtracted from combat value
  // (positive modifier = easier to hit = lower effective combat value)
  const effectiveValue = baseCombatValue - modifiers.hitModifier;

  // Combat value cannot go below 1 or above 10
  return Math.max(1, Math.min(10, effectiveValue));
}

/**
 * Check if a roll is a hit given modifiers
 */
export function isHit(
  roll: number,
  baseCombatValue: number,
  modifiers: CombatModifiers
): boolean {
  const effectiveCombatValue = applyHitModifier(baseCombatValue, modifiers);
  return roll >= effectiveCombatValue;
}

/**
 * Helper to check if player has their flagship in a system
 */
function hasFlagshipInSystem(
  state: GameState,
  playerId: string,
  systemId: string
): boolean {
  const tile = state.map.tiles.find((t) => t.id === systemId);
  if (!tile) return false;

  return tile.units.some(
    (u) => u.ownerId === playerId && u.type === 'flagship'
  );
}

/**
 * Get the opponent's combat modifiers that affect this player
 * (e.g., Mentak's Fourth Moon preventing sustain damage)
 */
export function getOpponentEffectsOnCombat(
  state: GameState,
  playerId: string,
  opponentId: string,
  combatType: 'space' | 'ground',
  context?: CombatAbilityContext
): { canSustainDamage: boolean; hitPenalty: number } {
  let canSustainDamage = true;
  let hitPenalty = 0;

  const opponent = state.players.find((p) => p.id === opponentId);
  if (!opponent || !opponent.faction) {
    return { canSustainDamage, hitPenalty };
  }

  // Check opponent faction abilities that affect this player
  switch (opponent.faction) {
    case 'mentak':
      // Fourth Moon flagship prevents opponent sustain damage
      if (context && hasFlagshipInSystem(state, opponentId, context.systemId)) {
        canSustainDamage = false;
      }
      break;

    case 'sardakk':
      // C'Morran N'orr flagship gives +1 to other Sardakk ships
      // This doesn't affect the opponent directly
      break;

    default:
      break;
  }

  return { canSustainDamage, hitPenalty };
}
