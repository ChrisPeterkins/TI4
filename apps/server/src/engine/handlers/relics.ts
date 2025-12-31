/**
 * Relic Handlers
 *
 * Handles relic card usage and effects for Prophecy of Kings expansion.
 * Relics are powerful artifacts gained by purging relic fragments.
 */

import type {
  GameState,
  UseRelicAction,
  ReadyRelicAction,
} from '@ti4/shared';
import {
  getRelic,
  isExhaustable,
  isPurgeable,
  getRelicName,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { addLogEntry } from '../utils/game-log.js';
import { shuffleDeck } from '../utils/deck.js';

/**
 * Handle using a relic (exhaust or purge)
 */
export function handleUseRelic(
  state: GameState,
  action: UseRelicAction
): HandlerResult {
  const { playerId, relicId, targets } = action;
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check player owns this relic
  if (!player.relics?.includes(relicId)) {
    return { success: false, error: 'You do not own this relic' };
  }

  // Check if relic is exhausted (for exhaust-type relics)
  if (isExhaustable(relicId) && player.exhaustedRelics?.includes(relicId)) {
    return { success: false, error: 'Relic is exhausted' };
  }

  const relicData = getRelic(relicId);
  if (!relicData) {
    return { success: false, error: 'Invalid relic' };
  }

  // Execute relic-specific effect
  const effectResult = executeRelicEffect(state, player, relicId, targets);
  if (!effectResult.success) {
    return effectResult;
  }

  // Handle relic state after use
  if (isPurgeable(relicId)) {
    // Remove relic from player and add to discard
    player.relics = player.relics.filter((r) => r !== relicId);
    if (!state.relicDiscard) {
      state.relicDiscard = [];
    }
    state.relicDiscard.push(relicId);

    addLogEntry(
      state,
      'ability_triggered',
      `${player.name} purged ${relicData.name}`,
      {
        playerId,
        details: {
          relicId,
          relicName: relicData.name,
          effect: 'purged',
        },
      }
    );
  } else if (isExhaustable(relicId)) {
    // Exhaust the relic
    if (!player.exhaustedRelics) {
      player.exhaustedRelics = [];
    }
    player.exhaustedRelics.push(relicId);

    addLogEntry(
      state,
      'ability_triggered',
      `${player.name} exhausted ${relicData.name}`,
      {
        playerId,
        details: {
          relicId,
          relicName: relicData.name,
          effect: 'exhausted',
        },
      }
    );
  }

  return {
    success: true,
    triggeredEvents: ['relic_used'],
    data: {
      relicId,
      relicName: relicData.name,
      effect: effectResult.data,
    },
  };
}

/**
 * Handle readying a relic (during status phase)
 */
export function handleReadyRelic(
  state: GameState,
  action: ReadyRelicAction
): HandlerResult {
  const { playerId, relicId } = action;
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check player owns this relic
  if (!player.relics?.includes(relicId)) {
    return { success: false, error: 'You do not own this relic' };
  }

  // Check if relic is exhausted
  if (!player.exhaustedRelics?.includes(relicId)) {
    return { success: false, error: 'Relic is not exhausted' };
  }

  // Ready the relic
  player.exhaustedRelics = player.exhaustedRelics.filter((r) => r !== relicId);

  return {
    success: true,
    triggeredEvents: ['relic_readied'],
    data: { relicId },
  };
}

/**
 * Execute the specific effect of a relic
 */
function executeRelicEffect(
  state: GameState,
  player: {
    id: string;
    name: string;
    planets: { planetId: string; exhausted: boolean }[];
    technologies: string[];
    actionCards: string[];
    secretObjectives: string[];
  },
  relicId: string,
  targets?: UseRelicAction['targets']
): HandlerResult {
  switch (relicId) {
    case 'dominus_orb':
      // Effect handled by movement phase - allows moving from activated systems
      return { success: true, data: { effect: 'movement_modifier_applied' } };

    case 'maw_of_worlds':
      // Gain any 1 technology after exhausting all planets
      if (!targets?.techId) {
        return { success: false, error: 'Must specify technology to gain' };
      }
      // Exhaust all planets
      for (const planet of player.planets) {
        planet.exhausted = true;
      }
      // Add technology
      if (!player.technologies.includes(targets.techId)) {
        player.technologies.push(targets.techId);
      }
      return { success: true, data: { techGained: targets.techId, planetsExhausted: player.planets.length } };

    case 'scepter_of_emelpar':
      // Effect is passive - checked during strategy token spending
      return { success: true, data: { effect: 'strategy_token_replacement' } };

    case 'shard_of_the_throne':
      // Passive - victory point handled elsewhere
      return { success: true, data: { effect: 'passive_vp' } };

    case 'stellar_converter':
      // Destroy all units on a planet and place destroyed planet token
      if (!targets?.planetId) {
        return { success: false, error: 'Must specify planet to destroy' };
      }
      // Find and destroy planet (mark as destroyed)
      for (const tile of state.map.tiles) {
        const planet = tile.planets.find((p) => p.planetId === targets.planetId);
        if (planet) {
          // Remove all units on the planet
          tile.units = tile.units.filter((u) => u.planetId !== targets.planetId);
          // Clear attachments
          planet.attachments = [];
          // Mark as destroyed (could add a 'destroyed' field)
          return { success: true, data: { planetDestroyed: targets.planetId } };
        }
      }
      return { success: false, error: 'Planet not found' };

    case 'the_codex':
      // Take up to 3 action cards from discard
      if (!targets?.actionCardIds || targets.actionCardIds.length === 0) {
        return { success: false, error: 'Must specify action cards to take' };
      }
      if (targets.actionCardIds.length > 3) {
        return { success: false, error: 'Can only take up to 3 action cards' };
      }
      // Check cards are in discard pile
      for (const cardId of targets.actionCardIds) {
        if (!state.actionCardDiscard.includes(cardId)) {
          return { success: false, error: `Card ${cardId} not in discard pile` };
        }
      }
      // Move cards from discard to player hand
      for (const cardId of targets.actionCardIds) {
        state.actionCardDiscard = state.actionCardDiscard.filter((c) => c !== cardId);
        const fullPlayer = state.players.find((p) => p.id === player.id);
        if (fullPlayer) {
          fullPlayer.actionCards.push(cardId);
        }
      }
      return { success: true, data: { cardsRecovered: targets.actionCardIds.length } };

    case 'the_crown_of_emphidia':
      // Explore a controlled planet (after tactical action)
      if (!targets?.planetId) {
        return { success: false, error: 'Must specify planet to explore' };
      }
      // Check player controls the planet
      if (!player.planets.some((p) => p.planetId === targets.planetId)) {
        return { success: false, error: 'You do not control this planet' };
      }
      // Exploration effect would be handled by explore action
      return { success: true, data: { planetToExplore: targets.planetId } };

    case 'the_crown_of_thalnos':
      // Passive combat effect - reroll at cost of ships
      return { success: true, data: { effect: 'combat_reroll_passive' } };

    case 'the_obsidian':
      // Passive - draw extra secret objective on gain
      // Check if they need to draw a secret
      if (state.objectives.secretDeck.length > 0) {
        const drawnSecret = state.objectives.secretDeck.shift()!;
        const fullPlayer = state.players.find((p) => p.id === player.id);
        if (fullPlayer) {
          fullPlayer.secretObjectives.push(drawnSecret);
        }
        return { success: true, data: { secretDrawn: true } };
      }
      return { success: true, data: { effect: 'extra_secret_objective_capacity' } };

    case 'the_prophets_tears':
      // Effect handled during research - ignore 1 prerequisite
      return { success: true, data: { effect: 'prerequisite_ignore' } };

    default:
      return { success: false, error: `Unknown relic: ${relicId}` };
  }
}

/**
 * Ready all relics for a player (called during status phase)
 */
export function readyAllRelics(state: GameState, playerId: string): void {
  const player = state.players.find((p) => p.id === playerId);
  if (player) {
    player.exhaustedRelics = [];
  }
}

/**
 * Check if player has a specific relic and it's ready
 */
export function hasReadyRelic(state: GameState, playerId: string, relicId: string): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.relics) return false;

  if (!player.relics.includes(relicId)) return false;
  if (player.exhaustedRelics?.includes(relicId)) return false;

  return true;
}

/**
 * Get all relics owned by a player
 */
export function getPlayerRelics(state: GameState, playerId: string): string[] {
  const player = state.players.find((p) => p.id === playerId);
  return player?.relics || [];
}

/**
 * Check if using Shard of the Throne (for VP calculations)
 */
export function getShardOfThroneOwner(state: GameState): string | null {
  for (const player of state.players) {
    if (player.relics?.includes('shard_of_the_throne')) {
      return player.id;
    }
  }
  return null;
}

/**
 * Transfer Shard of the Throne when legendary planet control changes
 */
export function handleShardTransfer(
  state: GameState,
  newOwnerId: string,
  previousOwnerId: string
): void {
  const previousOwner = state.players.find((p) => p.id === previousOwnerId);
  const newOwner = state.players.find((p) => p.id === newOwnerId);

  if (previousOwner && newOwner && previousOwner.relics?.includes('shard_of_the_throne')) {
    // Remove from previous owner
    previousOwner.relics = previousOwner.relics.filter((r) => r !== 'shard_of_the_throne');
    // Adjust victory points
    previousOwner.score = Math.max(0, previousOwner.score - 1);

    // Add to new owner
    if (!newOwner.relics) {
      newOwner.relics = [];
    }
    newOwner.relics.push('shard_of_the_throne');
    newOwner.score += 1;

    addLogEntry(
      state,
      'ability_triggered',
      `${newOwner.name} gained Shard of the Throne from ${previousOwner.name}`,
      {
        playerId: newOwnerId,
        details: {
          relicId: 'shard_of_the_throne',
          previousOwnerId,
          effect: 'transferred',
        },
      }
    );
  }
}
