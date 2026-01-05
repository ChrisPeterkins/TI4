/**
 * Legendary Planet Handlers
 *
 * Handles legendary planet ability usage for Prophecy of Kings expansion.
 * Legendary planets have special abilities that can be exhausted at END of turn.
 *
 * Official abilities:
 * - Primor (The Atrament): Place up to 2 infantry on any planet you control
 * - Hope's End (Imperial Arms Vault): Place 1 mech on any planet OR draw 1 action card
 * - Mallice (Exterrix Headquarters): Gain 2 TG OR convert all commodities to TG
 * - Mirage (Flight Academy): Place up to 2 fighters in any system with your ships
 */

import type {
  GameState,
  UseLegendaryAbilityAction,
  PlayerState,
  UnitType,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { addLogEntry } from '../utils/game-log.js';

// Legendary planet ability types
type LegendaryAbilityType =
  | 'place_infantry'      // Primor
  | 'place_mech_or_draw'  // Hope's End
  | 'gain_tg_or_convert'  // Mallice
  | 'place_fighters';     // Mirage

// Map of legendary planet IDs to their ability data
const LEGENDARY_PLANETS: Record<string, {
  name: string;
  abilityName: string;
  abilityType: LegendaryAbilityType;
  description: string;
}> = {
  primor: {
    name: 'Primor',
    abilityName: 'The Atrament',
    abilityType: 'place_infantry',
    description: 'Place up to 2 infantry from your reinforcements on any planet you control.',
  },
  hopes_end: {
    name: "Hope's End",
    abilityName: 'Imperial Arms Vault',
    abilityType: 'place_mech_or_draw',
    description: 'Place 1 mech from your reinforcements on any planet you control, or draw 1 action card.',
  },
  mallice: {
    name: 'Mallice',
    abilityName: 'Exterrix Headquarters',
    abilityType: 'gain_tg_or_convert',
    description: 'Gain 2 trade goods or convert all of your commodities into trade goods.',
  },
  mirage: {
    name: 'Mirage',
    abilityName: 'Flight Academy',
    abilityType: 'place_fighters',
    description: 'Place up to 2 fighters from your reinforcements in any system that contains 1 or more of your ships.',
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
 * Get all legendary planet definitions (for UI)
 */
export function getAllLegendaryPlanets(): typeof LEGENDARY_PLANETS {
  return LEGENDARY_PLANETS;
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
    case 'place_infantry':
      effectResult = executePrimorAbility(state, player, targets);
      break;
    case 'place_mech_or_draw':
      effectResult = executeHopesEndAbility(state, player, targets);
      break;
    case 'gain_tg_or_convert':
      effectResult = executeMalliceAbility(state, player, targets);
      break;
    case 'place_fighters':
      effectResult = executeMirageAbility(state, player, targets);
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
    `${player.name} used ${legendaryData.abilityName} (${legendaryData.name})`,
    {
      playerId,
      details: {
        planetId,
        planetName: legendaryData.name,
        abilityName: legendaryData.abilityName,
        effect: effectResult.data,
      },
    }
  );

  state.version++;

  return {
    success: true,
    triggeredEvents: ['legendary_ability_used'],
    data: {
      planetId,
      planetName: legendaryData.name,
      abilityName: legendaryData.abilityName,
      effect: effectResult.data,
    },
  };
}

/**
 * Primor - The Atrament: Place up to 2 infantry on any planet you control
 */
function executePrimorAbility(
  state: GameState,
  player: PlayerState,
  targets?: UseLegendaryAbilityAction['targets']
): HandlerResult {
  if (!targets?.targetPlanetId) {
    return { success: false, error: 'Must specify a target planet' };
  }

  const count = targets.count ?? 2; // Default to 2 infantry
  if (count < 1 || count > 2) {
    return { success: false, error: 'Can place 1 or 2 infantry' };
  }

  // Check player controls target planet
  if (!player.planets.some(p => p.planetId === targets.targetPlanetId)) {
    return { success: false, error: 'You do not control the target planet' };
  }

  // Find the planet in the map
  let targetPlanet = null;
  for (const tile of state.map.tiles) {
    const planet = tile.planets.find(p => p.planetId === targets.targetPlanetId);
    if (planet) {
      targetPlanet = planet;
      break;
    }
  }

  if (!targetPlanet) {
    return { success: false, error: 'Target planet not found' };
  }

  // Place infantry
  for (let i = 0; i < count; i++) {
    const unitId = `infantry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    targetPlanet.units.push({
      id: unitId,
      type: 'infantry',
      ownerId: player.id,
      damaged: false,
    });
  }

  return {
    success: true,
    data: {
      unitsPlaced: count,
      unitType: 'infantry',
      targetPlanet: targets.targetPlanetId,
    },
  };
}

/**
 * Hope's End - Imperial Arms Vault: Place 1 mech OR draw 1 action card
 */
function executeHopesEndAbility(
  state: GameState,
  player: PlayerState,
  targets?: UseLegendaryAbilityAction['targets']
): HandlerResult {
  const choice = targets?.choice;

  if (choice === 'draw_card' || choice === 'action_card') {
    // Draw 1 action card
    if (state.actionCardDeck.length === 0) {
      // Reshuffle discard if needed
      if (state.actionCardDiscard.length > 0) {
        state.actionCardDeck = [...state.actionCardDiscard].sort(() => Math.random() - 0.5);
        state.actionCardDiscard = [];
      } else {
        return { success: false, error: 'No action cards available' };
      }
    }

    const card = state.actionCardDeck.shift()!;
    player.actionCards.push(card);

    return {
      success: true,
      data: {
        effect: 'drew_action_card',
        cardDrawn: 1,
      },
    };
  } else if (choice === 'place_mech' || targets?.targetPlanetId) {
    // Place 1 mech on a planet
    if (!targets?.targetPlanetId) {
      return { success: false, error: 'Must specify a target planet for mech placement' };
    }

    // Check player controls target planet
    if (!player.planets.some(p => p.planetId === targets.targetPlanetId)) {
      return { success: false, error: 'You do not control the target planet' };
    }

    // Find the planet in the map
    let targetPlanet = null;
    for (const tile of state.map.tiles) {
      const planet = tile.planets.find(p => p.planetId === targets.targetPlanetId);
      if (planet) {
        targetPlanet = planet;
        break;
      }
    }

    if (!targetPlanet) {
      return { success: false, error: 'Target planet not found' };
    }

    // Place mech
    const unitId = `mech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    targetPlanet.units.push({
      id: unitId,
      type: 'mech',
      ownerId: player.id,
      damaged: false,
    });

    return {
      success: true,
      data: {
        effect: 'placed_mech',
        targetPlanet: targets.targetPlanetId,
      },
    };
  }

  return { success: false, error: 'Must choose: draw_card or place_mech with targetPlanetId' };
}

/**
 * Mallice - Exterrix Headquarters: Gain 2 TG OR convert all commodities to TG
 */
function executeMalliceAbility(
  state: GameState,
  player: PlayerState,
  targets?: UseLegendaryAbilityAction['targets']
): HandlerResult {
  const choice = targets?.choice;

  if (choice === 'gain_tg' || choice === 'trade_goods') {
    // Gain 2 trade goods
    player.tradeGoods += 2;

    return {
      success: true,
      data: {
        effect: 'gained_trade_goods',
        tradeGoodsGained: 2,
      },
    };
  } else if (choice === 'convert' || choice === 'convert_commodities') {
    // Convert all commodities to trade goods
    const converted = player.commodities;
    player.tradeGoods += player.commodities;
    player.commodities = 0;

    return {
      success: true,
      data: {
        effect: 'converted_commodities',
        commoditiesConverted: converted,
      },
    };
  }

  // Default: gain 2 TG if no choice specified (most common use)
  player.tradeGoods += 2;
  return {
    success: true,
    data: {
      effect: 'gained_trade_goods',
      tradeGoodsGained: 2,
    },
  };
}

/**
 * Mirage - Flight Academy: Place up to 2 fighters in any system with your ships
 */
function executeMirageAbility(
  state: GameState,
  player: PlayerState,
  targets?: UseLegendaryAbilityAction['targets']
): HandlerResult {
  if (!targets?.systemId) {
    return { success: false, error: 'Must specify a target system' };
  }

  const count = targets.count ?? 2; // Default to 2 fighters
  if (count < 1 || count > 2) {
    return { success: false, error: 'Can place 1 or 2 fighters' };
  }

  // Find the system
  const targetTile = state.map.tiles.find(t => t.id === targets.systemId);
  if (!targetTile) {
    return { success: false, error: 'Target system not found' };
  }

  // Check player has ships in this system
  const playerShips = targetTile.units.filter(
    u => u.ownerId === player.id && isShip(u.type)
  );

  if (playerShips.length === 0) {
    return { success: false, error: 'You have no ships in this system' };
  }

  // Place fighters
  for (let i = 0; i < count; i++) {
    const unitId = `fighter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    targetTile.units.push({
      id: unitId,
      type: 'fighter',
      ownerId: player.id,
      damaged: false,
    });
  }

  return {
    success: true,
    data: {
      unitsPlaced: count,
      unitType: 'fighter',
      targetSystem: targets.systemId,
    },
  };
}

/**
 * Check if a unit type is a ship
 */
function isShip(unitType: UnitType | string): boolean {
  return ['carrier', 'cruiser', 'destroyer', 'dreadnought', 'flagship', 'war_sun', 'fighter'].includes(unitType);
}

/**
 * Get all legendary planets controlled by a player
 */
export function getPlayerLegendaryPlanets(
  state: GameState,
  playerId: string
): Array<{ planetId: string; name: string; abilityName: string; exhausted: boolean }> {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];

  return player.planets
    .filter((p) => isLegendaryPlanet(p.planetId))
    .map((p) => ({
      planetId: p.planetId,
      name: LEGENDARY_PLANETS[p.planetId]?.name || p.planetId,
      abilityName: LEGENDARY_PLANETS[p.planetId]?.abilityName || '',
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
