/**
 * Legendary Planet Handlers
 *
 * Handles legendary planet ability usage for Prophecy of Kings expansion.
 * Legendary planets have special abilities that can be exhausted.
 */

import type {
  GameState,
  UseLegendaryAbilityAction,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { addLogEntry } from '../utils/game-log.js';
import { systems } from '@ti4/game-data';

// Map of legendary planet IDs to their ability types
const LEGENDARY_PLANETS: Record<string, {
  name: string;
  abilityType: 'purge_attachments' | 'action_card_cycle' | 'limited_production';
}> = {
  primor: {
    name: 'Primor',
    abilityType: 'purge_attachments',
  },
  hopes_end: {
    name: "Hope's End",
    abilityType: 'action_card_cycle',
  },
  mallice: {
    name: 'Mallice',
    abilityType: 'limited_production',
  },
};

/**
 * Check if a planet is legendary
 */
export function isLegendaryPlanet(planetId: string): boolean {
  return planetId in LEGENDARY_PLANETS;
}

/**
 * Get legendary planet data
 */
export function getLegendaryPlanet(planetId: string): typeof LEGENDARY_PLANETS[string] | null {
  return LEGENDARY_PLANETS[planetId] || null;
}

/**
 * Handle using a legendary planet ability
 */
export function handleUseLegendaryAbility(
  state: GameState,
  action: UseLegendaryAbilityAction
): HandlerResult {
  const { playerId, planetId, targets } = action;
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check player controls this planet
  const controlledPlanet = player.planets.find((p) => p.planetId === planetId);
  if (!controlledPlanet) {
    return { success: false, error: 'You do not control this planet' };
  }

  // Check if planet is legendary
  const legendaryData = getLegendaryPlanet(planetId);
  if (!legendaryData) {
    return { success: false, error: 'This is not a legendary planet' };
  }

  // Check if planet is already exhausted
  if (controlledPlanet.exhausted) {
    return { success: false, error: 'Planet is already exhausted' };
  }

  // Execute ability based on type
  let effectResult: HandlerResult;

  switch (legendaryData.abilityType) {
    case 'purge_attachments':
      effectResult = executePrimorAbility(state, player, targets);
      break;
    case 'action_card_cycle':
      effectResult = executeHopesEndAbility(state, player, targets);
      break;
    case 'limited_production':
      effectResult = executeMalliceAbility(state, player, planetId, targets);
      break;
    default:
      return { success: false, error: 'Unknown legendary ability type' };
  }

  if (!effectResult.success) {
    return effectResult;
  }

  // Exhaust the planet
  controlledPlanet.exhausted = true;

  addLogEntry(
    state,
    'ability_triggered',
    `${player.name} used ${legendaryData.name}'s legendary ability`,
    {
      playerId,
      details: {
        planetId,
        planetName: legendaryData.name,
        effect: effectResult.data,
      },
    }
  );

  return {
    success: true,
    triggeredEvents: ['legendary_ability_used'],
    data: {
      planetId,
      planetName: legendaryData.name,
      effect: effectResult.data,
    },
  };
}

/**
 * Primor: Purge up to 2 attachments from planets you control
 */
function executePrimorAbility(
  state: GameState,
  player: { id: string; name: string; planets: { planetId: string; attachments: string[] }[] },
  targets?: UseLegendaryAbilityAction['targets']
): HandlerResult {
  if (!targets?.attachmentIds || targets.attachmentIds.length === 0) {
    return { success: false, error: 'Must specify attachments to purge' };
  }

  if (targets.attachmentIds.length > 2) {
    return { success: false, error: 'Can only purge up to 2 attachments' };
  }

  const purgedAttachments: string[] = [];

  for (const attachmentId of targets.attachmentIds) {
    // Find which planet has this attachment
    let found = false;
    for (const controlledPlanet of player.planets) {
      // Find the planet in the map
      for (const tile of state.map.tiles) {
        const planet = tile.planets.find((p) => p.planetId === controlledPlanet.planetId);
        if (planet && planet.attachments.includes(attachmentId)) {
          // Remove the attachment
          planet.attachments = planet.attachments.filter((a) => a !== attachmentId);
          controlledPlanet.attachments = controlledPlanet.attachments.filter((a) => a !== attachmentId);
          purgedAttachments.push(attachmentId);
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      return { success: false, error: `Attachment ${attachmentId} not found on your planets` };
    }
  }

  return {
    success: true,
    data: { purgedAttachments },
  };
}

/**
 * Hope's End: Draw 3 action cards, then put 3 on bottom of deck
 */
function executeHopesEndAbility(
  state: GameState,
  player: { id: string; name: string },
  targets?: UseLegendaryAbilityAction['targets']
): HandlerResult {
  const fullPlayer = state.players.find((p) => p.id === player.id);
  if (!fullPlayer) {
    return { success: false, error: 'Player not found' };
  }

  // Draw 3 action cards
  const drawnCards: string[] = [];
  for (let i = 0; i < 3; i++) {
    if (state.actionCardDeck.length > 0) {
      const card = state.actionCardDeck.shift()!;
      fullPlayer.actionCards.push(card);
      drawnCards.push(card);
    }
  }

  // Check if we need to return cards (targets provided)
  if (targets?.actionCardIds && targets.actionCardIds.length === 3) {
    // Verify player has these cards
    for (const cardId of targets.actionCardIds) {
      if (!fullPlayer.actionCards.includes(cardId)) {
        return { success: false, error: `You do not have action card: ${cardId}` };
      }
    }

    // Remove from hand and place on bottom of deck
    for (const cardId of targets.actionCardIds) {
      fullPlayer.actionCards = fullPlayer.actionCards.filter((c) => c !== cardId);
      state.actionCardDeck.push(cardId);
    }

    return {
      success: true,
      data: { drawnCards: drawnCards.length, returnedCards: 3 },
    };
  }

  // If no targets provided, ability is in progress (waiting for card selection)
  return {
    success: true,
    data: {
      drawnCards: drawnCards.length,
      awaitingCardSelection: true,
      message: 'Select 3 action cards to place on bottom of deck',
    },
  };
}

/**
 * Mallice: Produce up to 2 units in this system
 */
function executeMalliceAbility(
  state: GameState,
  player: { id: string; name: string },
  planetId: string,
  targets?: UseLegendaryAbilityAction['targets']
): HandlerResult {
  if (!targets?.unitProduction || targets.unitProduction.length === 0) {
    return { success: false, error: 'Must specify units to produce' };
  }

  // Count total units
  const totalUnits = targets.unitProduction.reduce((sum, u) => sum + u.count, 0);
  if (totalUnits > 2) {
    return { success: false, error: 'Can only produce up to 2 units' };
  }

  // Find the system containing Mallice
  let systemTile = null;
  for (const tile of state.map.tiles) {
    if (tile.planets.some((p) => p.planetId === planetId)) {
      systemTile = tile;
      break;
    }
  }

  if (!systemTile) {
    return { success: false, error: 'System not found' };
  }

  // Place units
  const producedUnits: Array<{ type: string; count: number }> = [];
  for (const production of targets.unitProduction) {
    for (let i = 0; i < production.count; i++) {
      const unitId = `${production.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      systemTile.units.push({
        id: unitId,
        type: production.type as any,
        ownerId: player.id,
        damaged: false,
        // Ground units go on the planet
        ...(isGroundUnit(production.type) ? { planetId } : {}),
      });
    }
    producedUnits.push(production);
  }

  return {
    success: true,
    data: { producedUnits },
  };
}

/**
 * Check if a unit type is a ground unit
 */
function isGroundUnit(unitType: string): boolean {
  return ['infantry', 'mech'].includes(unitType);
}

/**
 * Get all legendary planets controlled by a player
 */
export function getPlayerLegendaryPlanets(
  state: GameState,
  playerId: string
): Array<{ planetId: string; name: string; exhausted: boolean }> {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];

  return player.planets
    .filter((p) => isLegendaryPlanet(p.planetId))
    .map((p) => ({
      planetId: p.planetId,
      name: LEGENDARY_PLANETS[p.planetId]?.name || p.planetId,
      exhausted: p.exhausted,
    }));
}

/**
 * Check if a player gained control of a legendary planet
 * (for Shard of the Throne transfer)
 */
export function checkLegendaryPlanetControl(
  state: GameState,
  planetId: string,
  newControllerId: string,
  previousControllerId?: string
): void {
  if (!isLegendaryPlanet(planetId)) return;

  // Check if any player has Shard of the Throne
  for (const player of state.players) {
    if (player.relics?.includes('shard_of_the_throne') && player.id !== newControllerId) {
      // Transfer Shard of the Throne to new controller
      // (handled by relics.ts handleShardTransfer)
      return;
    }
  }
}
