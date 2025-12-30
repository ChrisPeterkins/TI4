/**
 * Fleet Modifier Aggregation
 *
 * Collects and aggregates fleet limit modifiers from faction abilities,
 * technologies, and other sources.
 */

import type { GameState } from '@ti4/shared';
import type { FleetModifiers, HandLimitModifiers, TokenGainModifiers } from './ability-types.js';
import { factions } from '@ti4/game-data';

/**
 * Default fleet modifiers
 */
export function getDefaultFleetModifiers(): FleetModifiers {
  return {
    fleetLimitBonus: 0,
  };
}

/**
 * Get fleet limit modifiers for a player
 */
export function getFleetModifiers(
  state: GameState,
  playerId: string
): FleetModifiers {
  const modifiers = getDefaultFleetModifiers();
  const player = state.players.find((p) => p.id === playerId);

  if (!player || !player.faction) {
    return modifiers;
  }

  // Apply faction-specific fleet modifiers
  switch (player.faction) {
    case 'letnev':
      // ARMADA: +2 to fleet limit
      modifiers.fleetLimitBonus += 2;
      break;

    default:
      break;
  }

  return modifiers;
}

/**
 * Calculate effective fleet limit for a player
 * Base is the number of tokens in fleet pool
 */
export function getEffectiveFleetLimit(
  state: GameState,
  playerId: string
): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 0;

  const baseFleetLimit = player.commandTokens.fleet;
  const modifiers = getFleetModifiers(state, playerId);

  return baseFleetLimit + modifiers.fleetLimitBonus;
}

/**
 * Default hand limit modifiers
 */
export function getDefaultHandLimitModifiers(): HandLimitModifiers {
  return {
    actionCardLimitBonus: 0,
    noHandLimit: false,
  };
}

/**
 * Get hand limit modifiers for a player
 */
export function getHandLimitModifiers(
  state: GameState,
  playerId: string
): HandLimitModifiers {
  const modifiers = getDefaultHandLimitModifiers();
  const player = state.players.find((p) => p.id === playerId);

  if (!player || !player.faction) {
    return modifiers;
  }

  // Apply faction-specific hand limit modifiers
  switch (player.faction) {
    case 'yssaril':
      // CRAFTY: No action card hand limit
      modifiers.noHandLimit = true;
      break;

    default:
      break;
  }

  return modifiers;
}

/**
 * Get effective action card hand limit for a player
 * Default is 7 cards
 */
export function getEffectiveHandLimit(
  state: GameState,
  playerId: string
): number {
  const modifiers = getHandLimitModifiers(state, playerId);

  if (modifiers.noHandLimit) {
    return Infinity;
  }

  const baseLimit = 7;
  return baseLimit + modifiers.actionCardLimitBonus;
}

/**
 * Default token gain modifiers
 */
export function getDefaultTokenGainModifiers(): TokenGainModifiers {
  return {
    statusPhaseBonus: 0,
  };
}

/**
 * Get token gain modifiers for a player
 */
export function getTokenGainModifiers(
  state: GameState,
  playerId: string
): TokenGainModifiers {
  const modifiers = getDefaultTokenGainModifiers();
  const player = state.players.find((p) => p.id === playerId);

  if (!player || !player.faction) {
    return modifiers;
  }

  // Apply faction-specific token gain modifiers
  switch (player.faction) {
    case 'sol':
      // VERSATILE: +1 command token during status phase
      modifiers.statusPhaseBonus += 1;
      break;

    default:
      break;
  }

  return modifiers;
}

/**
 * Get total tokens to gain during status phase
 * Base is 2 tokens
 */
export function getStatusPhaseTokenGain(
  state: GameState,
  playerId: string
): number {
  const baseTokens = 2;
  const modifiers = getTokenGainModifiers(state, playerId);

  return baseTokens + modifiers.statusPhaseBonus;
}
