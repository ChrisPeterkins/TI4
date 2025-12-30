/**
 * Ability Trigger System
 *
 * Detects when faction abilities can be triggered based on game events.
 * Returns a list of abilities that players can activate at the current timing.
 */

import type { GameState, FactionAbility, AbilityTrigger as AbilityTriggerType } from '@ti4/shared';
import type { AbilityContext, TriggeredAbility } from './ability-types.js';
import { factions } from '@ti4/game-data';

/**
 * Check for abilities that can be triggered at a given timing
 */
export function checkAbilityTriggers(
  state: GameState,
  trigger: AbilityTriggerType,
  context: AbilityContext = {}
): TriggeredAbility[] {
  const triggered: TriggeredAbility[] = [];

  for (const player of state.players) {
    if (!player.faction) continue;

    const faction = factions[player.faction];
    if (!faction) continue;

    for (const ability of faction.abilities) {
      // Skip abilities without implementation details
      if (!ability.implementation) continue;

      const impl = ability.implementation;
      const timing = impl.timing;

      // Check if this ability triggers at this timing
      let shouldTrigger = false;

      if (timing.type === 'when' && timing.trigger === trigger) {
        shouldTrigger = true;
      } else if (timing.type === 'after' && timing.trigger === trigger) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        // Check if ability requirements are met
        if (canUseAbility(state, player.id, ability, context)) {
          triggered.push({
            playerId: player.id,
            factionId: player.faction,
            abilityId: ability.id,
            abilityName: ability.name,
            isOptional: impl.isOptional ?? true,
            requiresChoice: requiresPlayerChoice(ability),
            handlerId: impl.handlerId,
          });
        }
      }
    }
  }

  return triggered;
}

/**
 * Check for phase-triggered abilities
 */
export function checkPhaseAbilities(
  state: GameState,
  phase: 'strategy' | 'action' | 'status' | 'agenda',
  moment: 'start' | 'end' | 'during'
): TriggeredAbility[] {
  const triggered: TriggeredAbility[] = [];

  for (const player of state.players) {
    if (!player.faction) continue;

    const faction = factions[player.faction];
    if (!faction) continue;

    for (const ability of faction.abilities) {
      if (!ability.implementation) continue;

      const impl = ability.implementation;
      const timing = impl.timing;

      if (
        timing.type === 'phase' &&
        timing.phase === phase &&
        timing.moment === moment
      ) {
        if (canUseAbility(state, player.id, ability, {})) {
          triggered.push({
            playerId: player.id,
            factionId: player.faction,
            abilityId: ability.id,
            abilityName: ability.name,
            isOptional: impl.isOptional ?? true,
            requiresChoice: requiresPlayerChoice(ability),
            handlerId: impl.handlerId,
          });
        }
      }
    }
  }

  return triggered;
}

/**
 * Get all ACTION abilities available to a player
 */
export function getActionAbilities(
  state: GameState,
  playerId: string
): TriggeredAbility[] {
  const abilities: TriggeredAbility[] = [];
  const player = state.players.find((p) => p.id === playerId);

  if (!player || !player.faction) {
    return abilities;
  }

  const faction = factions[player.faction];
  if (!faction) {
    return abilities;
  }

  for (const ability of faction.abilities) {
    if (!ability.implementation) continue;

    const impl = ability.implementation;

    if (impl.timing.type === 'action') {
      if (canUseAbility(state, playerId, ability, {})) {
        abilities.push({
          playerId,
          factionId: player.faction,
          abilityId: ability.id,
          abilityName: ability.name,
          isOptional: true, // ACTION abilities are always optional
          requiresChoice: requiresPlayerChoice(ability),
          handlerId: impl.handlerId,
        });
      }
    }
  }

  return abilities;
}

/**
 * Get all passive abilities for a player (always active)
 */
export function getPassiveAbilities(
  state: GameState,
  playerId: string
): FactionAbility[] {
  const abilities: FactionAbility[] = [];
  const player = state.players.find((p) => p.id === playerId);

  if (!player || !player.faction) {
    return abilities;
  }

  const faction = factions[player.faction];
  if (!faction) {
    return abilities;
  }

  for (const ability of faction.abilities) {
    if (!ability.implementation) continue;

    if (ability.implementation.timing.type === 'passive') {
      abilities.push(ability);
    }
  }

  return abilities;
}

/**
 * Check if a player can use a specific ability
 */
export function canUseAbility(
  state: GameState,
  playerId: string,
  ability: FactionAbility,
  context: AbilityContext
): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;

  const impl = ability.implementation;
  if (!impl) return false;

  // Check requirements
  if (impl.requirements) {
    for (const req of impl.requirements) {
      if (!checkRequirement(state, playerId, req)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check a single ability requirement
 */
function checkRequirement(
  state: GameState,
  playerId: string,
  requirement: { type: string; amount?: number; resource?: string; tokenPool?: string; unitType?: string; cardType?: string }
): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;

  switch (requirement.type) {
    case 'spend_trade_good':
      return player.tradeGoods >= (requirement.amount ?? 1);

    case 'spend_token':
      if (requirement.tokenPool === 'strategy') {
        return player.commandTokens.strategy >= (requirement.amount ?? 1);
      } else if (requirement.tokenPool === 'tactics') {
        return player.commandTokens.tactics >= (requirement.amount ?? 1);
      } else if (requirement.tokenPool === 'fleet') {
        return player.commandTokens.fleet >= (requirement.amount ?? 1);
      }
      return false;

    case 'spend_resource':
      // Calculate available resources from unexhausted planets
      const resources = player.planets
        .filter((p) => !p.exhausted)
        .reduce((sum, p) => {
          // Would need planet data lookup here
          return sum;
        }, 0);
      return resources >= (requirement.amount ?? 1);

    case 'discard_card':
      if (requirement.cardType === 'action') {
        return player.actionCards.length >= (requirement.amount ?? 1);
      }
      return false;

    case 'have_unit':
      // Would need to check for units of the specified type
      return true;

    case 'control_planet':
      return player.planets.length > 0;

    default:
      return true;
  }
}

/**
 * Check if an ability requires player choice to use
 */
function requiresPlayerChoice(ability: FactionAbility): boolean {
  const impl = ability.implementation;
  if (!impl) return false;

  // ACTION abilities always require explicit choice to use
  if (impl.timing.type === 'action') {
    return true;
  }

  // Abilities with requirements need confirmation
  if (impl.requirements && impl.requirements.length > 0) {
    return true;
  }

  // Unit placement abilities need target selection
  if (impl.effectType === 'unit_placement') {
    return true;
  }

  // Reroll abilities need confirmation
  if (impl.effectType === 'reroll') {
    return true;
  }

  return false;
}

/**
 * Sort triggered abilities by initiative order
 */
export function sortByInitiative(
  state: GameState,
  abilities: TriggeredAbility[]
): TriggeredAbility[] {
  return abilities.sort((a, b) => {
    const indexA = state.initiativeOrder.indexOf(a.playerId);
    const indexB = state.initiativeOrder.indexOf(b.playerId);
    return indexA - indexB;
  });
}
