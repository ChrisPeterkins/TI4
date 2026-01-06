/**
 * Deepwrought Scholarate Faction Ability Handlers
 *
 * Key mechanics:
 * - RESEARCH TEAM: Ground forces can coexist with other players' units
 * - OCEANBOUND: Gain ocean cards when coexistence begins
 * - Ocean card abilities and management
 */

import type {
  GameState,
  PlayerState,
  UnitInstance,
  MapTile,
  PlanetInstance,
  CoexistenceState,
} from '@ti4/shared';

// ============================================================================
// Types
// ============================================================================

export interface HandlerResult {
  success: boolean;
  error?: string;
  triggeredEvents?: string[];
  data?: Record<string, unknown>;
}

export interface StartCoexistenceAction {
  type: 'start_coexistence';
  playerId: string;
  planetId: string;
}

export interface EndCoexistenceAction {
  type: 'end_coexistence';
  planetId: string;
  reason: 'combat' | 'withdrawal' | 'ability';
}

export interface OceanCardAction {
  type: 'play_ocean_card';
  playerId: string;
  cardId: string;
  targetPlanetId?: string;
}

// Ocean card types
export type OceanCardId =
  | 'deep_sea_research'
  | 'tidal_navigation'
  | 'aquatic_diplomacy'
  | 'ocean_harvest'
  | 'pressure_adaptation'
  | 'abyssal_secrets';

// ============================================================================
// Coexistence Management
// ============================================================================

/**
 * Check if a planet has coexisting units
 */
export function hasCoexistence(state: GameState, planetId: string): boolean {
  if (!state.coexistenceState) return false;

  return state.coexistenceState.some(
    (c: CoexistenceState) => c.planetId === planetId && c.coexistingPlayers.length >= 2
  );
}

/**
 * Get coexisting players on a planet
 */
export function getCoexistingPlayers(state: GameState, planetId: string): string[] {
  if (!state.coexistenceState) return [];

  const coexistence = state.coexistenceState.find(
    (c: CoexistenceState) => c.planetId === planetId
  );

  return coexistence?.coexistingPlayers ?? [];
}

/**
 * Check if player can initiate coexistence on a planet
 * - Player must be Deepwrought (or have their ability via promissory)
 * - Planet must not already have coexisting units
 * - Another player must have units on the planet
 */
export function canInitiateCoexistence(
  state: GameState,
  playerId: string,
  planetId: string
): boolean {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) return false;

  // Check if player has coexistence ability (Deepwrought or Firmament mech)
  const hasAbility = player.faction === 'deepwrought' || player.faction === 'firmament';
  if (!hasAbility) return false;

  // Check if planet already has coexistence
  if (hasCoexistence(state, planetId)) return false;

  // Find the planet and check for other player's units
  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p: PlanetInstance) => p.id === planetId);
    if (planet) {
      const otherPlayerUnits = planet.units.filter(
        (u: UnitInstance) => u.ownerId !== playerId
      );
      return otherPlayerUnits.length > 0;
    }
  }

  return false;
}

/**
 * Start coexistence on a planet
 * Called when Deepwrought commits ground forces to a planet with other units
 */
export function handleStartCoexistence(
  state: GameState,
  action: StartCoexistenceAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player can initiate coexistence
  if (!canInitiateCoexistence(state, action.playerId, action.planetId)) {
    return { success: false, error: 'Cannot initiate coexistence on this planet' };
  }

  // Initialize coexistence state if needed
  if (!state.coexistenceState) {
    state.coexistenceState = [];
  }

  // Find the planet and get all players with units there
  let playersOnPlanet: string[] = [];
  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p: PlanetInstance) => p.id === action.planetId);
    if (planet) {
      const owners = new Set(planet.units.map((u: UnitInstance) => u.ownerId));
      owners.add(action.playerId); // Add the incoming player
      playersOnPlanet = [...owners];
      break;
    }
  }

  if (playersOnPlanet.length < 2) {
    return { success: false, error: 'Need at least 2 players for coexistence' };
  }

  // Create coexistence state
  const existingIndex = state.coexistenceState.findIndex(
    (c: CoexistenceState) => c.planetId === action.planetId
  );

  if (existingIndex >= 0) {
    state.coexistenceState[existingIndex].coexistingPlayers = playersOnPlanet;
  } else {
    state.coexistenceState.push({
      planetId: action.planetId,
      coexistingPlayers: playersOnPlanet,
    });
  }

  // Grant ocean card to Deepwrought player (OCEANBOUND ability)
  const triggeredEvents: string[] = ['coexistence_started'];
  const deepwroughtPlayer = state.players.find(
    (p: PlayerState) => playersOnPlanet.includes(p.id) && p.faction === 'deepwrought'
  );

  if (deepwroughtPlayer) {
    const oceanCard = grantOceanCard(state, deepwroughtPlayer.id);
    if (oceanCard) {
      triggeredEvents.push('ocean_card_gained');
    }
  }

  return {
    success: true,
    triggeredEvents,
    data: {
      planetId: action.planetId,
      coexistingPlayers: playersOnPlanet,
    },
  };
}

/**
 * End coexistence on a planet
 * Called when combat starts, a player withdraws, or ability removes coexistence
 */
export function handleEndCoexistence(
  state: GameState,
  action: EndCoexistenceAction
): HandlerResult {
  if (!state.coexistenceState) {
    return { success: false, error: 'No coexistence state' };
  }

  const index = state.coexistenceState.findIndex(
    (c: CoexistenceState) => c.planetId === action.planetId
  );

  if (index === -1) {
    return { success: false, error: 'No coexistence on this planet' };
  }

  const removedCoexistence = state.coexistenceState.splice(index, 1)[0];

  // Check if Deepwrought needs to discard excess ocean cards
  const deepwroughtPlayer = state.players.find(
    (p: PlayerState) => p.faction === 'deepwrought'
  );

  if (deepwroughtPlayer) {
    enforceOceanCardLimit(state, deepwroughtPlayer.id);
  }

  return {
    success: true,
    triggeredEvents: ['coexistence_ended'],
    data: {
      planetId: action.planetId,
      reason: action.reason,
      previousPlayers: removedCoexistence.coexistingPlayers,
    },
  };
}

/**
 * Update coexistence state when units are removed from a planet
 */
export function updateCoexistenceOnUnitRemoval(
  state: GameState,
  planetId: string
): void {
  if (!state.coexistenceState) return;

  const index = state.coexistenceState.findIndex(
    (c: CoexistenceState) => c.planetId === planetId
  );

  if (index === -1) return;

  // Find current players with units on planet
  let currentPlayers: string[] = [];
  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p: PlanetInstance) => p.id === planetId);
    if (planet) {
      currentPlayers = [...new Set(planet.units.map((u: UnitInstance) => u.ownerId))];
      break;
    }
  }

  // Update or remove coexistence
  if (currentPlayers.length < 2) {
    // Only 1 or 0 players - end coexistence
    state.coexistenceState.splice(index, 1);
  } else {
    state.coexistenceState[index].coexistingPlayers = currentPlayers;
  }
}

/**
 * Count planets with active coexistence for a player
 */
export function countCoexistingPlanets(state: GameState, playerId: string): number {
  if (!state.coexistenceState) return 0;

  return state.coexistenceState.filter((c: CoexistenceState) =>
    c.coexistingPlayers.includes(playerId)
  ).length;
}

// ============================================================================
// Ocean Card Management
// ============================================================================

/**
 * Grant an ocean card to a player
 * Called when coexistence begins (OCEANBOUND ability)
 */
export function grantOceanCard(state: GameState, playerId: string): string | null {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) return null;

  // Initialize ocean cards array if needed
  if (!player.oceanCards) {
    player.oceanCards = [];
  }

  // Generate a random ocean card
  const oceanCards: OceanCardId[] = [
    'deep_sea_research',
    'tidal_navigation',
    'aquatic_diplomacy',
    'ocean_harvest',
    'pressure_adaptation',
    'abyssal_secrets',
  ];

  // Pick a random card
  const cardId = oceanCards[Math.floor(Math.random() * oceanCards.length)];
  player.oceanCards.push(cardId);

  return cardId;
}

/**
 * Enforce ocean card limit based on coexisting planets
 * Discard excess ocean cards if they outnumber planets with coexisting units
 */
export function enforceOceanCardLimit(state: GameState, playerId: string): string[] {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player?.oceanCards) return [];

  const coexistingPlanets = countCoexistingPlanets(state, playerId);
  const discarded: string[] = [];

  // Discard excess cards (from the end)
  while (player.oceanCards.length > coexistingPlanets && player.oceanCards.length > 0) {
    const removed = player.oceanCards.pop();
    if (removed) discarded.push(removed);
  }

  return discarded;
}

/**
 * Play an ocean card
 */
export function handlePlayOceanCard(
  state: GameState,
  action: OceanCardAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!player.oceanCards || !player.oceanCards.includes(action.cardId)) {
    return { success: false, error: 'Player does not have this ocean card' };
  }

  // Apply card effect
  const effect = applyOceanCardEffect(state, action);
  if (!effect.success) {
    return effect;
  }

  // Remove the card from hand
  const cardIndex = player.oceanCards.indexOf(action.cardId);
  player.oceanCards.splice(cardIndex, 1);

  return {
    success: true,
    triggeredEvents: ['ocean_card_played', ...(effect.triggeredEvents ?? [])],
    data: {
      playerId: action.playerId,
      cardId: action.cardId,
      ...(effect.data ?? {}),
    },
  };
}

/**
 * Apply the effect of an ocean card
 */
function applyOceanCardEffect(
  state: GameState,
  action: OceanCardAction
): HandlerResult {
  switch (action.cardId as OceanCardId) {
    case 'deep_sea_research':
      // Draw 1 action card
      return {
        success: true,
        triggeredEvents: ['draw_action_card'],
        data: { effect: 'draw_action_card', count: 1 },
      };

    case 'tidal_navigation':
      // +1 movement this tactical action
      return {
        success: true,
        triggeredEvents: ['movement_bonus'],
        data: { effect: 'movement_bonus', bonus: 1 },
      };

    case 'aquatic_diplomacy':
      // May refresh a planet in a system with coexistence
      if (!action.targetPlanetId) {
        return { success: false, error: 'Must specify target planet' };
      }
      if (!hasCoexistence(state, action.targetPlanetId)) {
        return { success: false, error: 'Planet must have coexisting units' };
      }
      const player = state.players.find((p: PlayerState) => p.id === action.playerId);
      const targetPlanet = player?.planets.find(p => p.planetId === action.targetPlanetId);
      if (targetPlanet) {
        targetPlanet.exhausted = false;
      }
      return {
        success: true,
        triggeredEvents: ['planet_refreshed'],
        data: { effect: 'refresh_planet', planetId: action.targetPlanetId },
      };

    case 'ocean_harvest':
      // Gain 2 trade goods
      const harvestPlayer = state.players.find((p: PlayerState) => p.id === action.playerId);
      if (harvestPlayer) {
        harvestPlayer.tradeGoods += 2;
      }
      return {
        success: true,
        triggeredEvents: ['trade_goods_gained'],
        data: { effect: 'gain_trade_goods', amount: 2 },
      };

    case 'pressure_adaptation':
      // Ground forces on a coexisting planet get +1 combat this round
      return {
        success: true,
        triggeredEvents: ['combat_bonus'],
        data: { effect: 'ground_combat_bonus', bonus: 1 },
      };

    case 'abyssal_secrets':
      // Look at top 3 cards of action card deck, keep 1
      return {
        success: true,
        triggeredEvents: ['deck_manipulation'],
        data: { effect: 'look_at_action_cards', count: 3, keep: 1 },
      };

    default:
      return { success: false, error: 'Unknown ocean card' };
  }
}

/**
 * Get ocean card names
 */
export function getOceanCardName(cardId: string): string {
  const names: Record<string, string> = {
    deep_sea_research: 'Deep Sea Research',
    tidal_navigation: 'Tidal Navigation',
    aquatic_diplomacy: 'Aquatic Diplomacy',
    ocean_harvest: 'Ocean Harvest',
    pressure_adaptation: 'Pressure Adaptation',
    abyssal_secrets: 'Abyssal Secrets',
  };
  return names[cardId] ?? cardId;
}

// ============================================================================
// D.W.S. Luminous Flagship Ability
// ============================================================================

/**
 * Get movement bonus for D.W.S. Luminous flagship
 * +1 move for each system it moves through containing friendly units
 */
export function getLuminousMovementBonus(
  state: GameState,
  playerId: string,
  systemsMovedThrough: string[]
): number {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'deepwrought') return 0;

  let bonus = 0;
  for (const systemId of systemsMovedThrough) {
    const tile = state.map.tiles.find((t: MapTile) => t.id === systemId);
    if (tile) {
      const hasFriendlyUnits = tile.units.some(
        (u: UnitInstance) => u.ownerId === playerId
      ) || tile.planets.some((p: PlanetInstance) =>
        p.units.some((u: UnitInstance) => u.ownerId === playerId)
      );
      if (hasFriendlyUnits) bonus++;
    }
  }

  return bonus;
}

// ============================================================================
// Eanautic Mech Ability
// ============================================================================

/**
 * Handle Eanautic mech retreat to home system
 * When another player activates system, may move mech and infantry to home
 */
export function handleEanauticRetreat(
  state: GameState,
  playerId: string,
  mechId: string,
  planetId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (player.faction !== 'deepwrought') {
    return { success: false, error: 'Only Deepwrought can use Eanautic retreat' };
  }

  // Find the mech's planet
  let sourceTile: MapTile | undefined;
  let sourcePlanet: PlanetInstance | undefined;

  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p: PlanetInstance) => p.id === planetId);
    if (planet) {
      sourceTile = tile;
      sourcePlanet = planet;
      break;
    }
  }

  if (!sourceTile || !sourcePlanet) {
    return { success: false, error: 'Planet not found' };
  }

  // Find home system
  const homeSystemId = player.homeSystemId;
  const homeTile = state.map.tiles.find((t: MapTile) => t.systemId === homeSystemId);
  if (!homeTile || homeTile.planets.length === 0) {
    return { success: false, error: 'Home system not found or has no planets' };
  }

  const homePlanet = homeTile.planets[0];

  // Move mech
  const mechIndex = sourcePlanet.units.findIndex((u: UnitInstance) => u.id === mechId);
  if (mechIndex === -1) {
    return { success: false, error: 'Mech not found on planet' };
  }

  const mech = sourcePlanet.units.splice(mechIndex, 1)[0];
  mech.planetId = homePlanet.id;
  homePlanet.units.push(mech);

  // Move all infantry from source planet
  const infantry = sourcePlanet.units.filter(
    (u: UnitInstance) => u.ownerId === playerId && u.type === 'infantry'
  );
  sourcePlanet.units = sourcePlanet.units.filter(
    (u: UnitInstance) => !(u.ownerId === playerId && u.type === 'infantry')
  );

  for (const inf of infantry) {
    inf.planetId = homePlanet.id;
    homePlanet.units.push(inf);
  }

  // Update coexistence if needed
  updateCoexistenceOnUnitRemoval(state, planetId);

  return {
    success: true,
    triggeredEvents: ['eanautic_retreat'],
    data: {
      playerId,
      mechId,
      fromPlanetId: planetId,
      toSystemId: homeSystemId,
      infantryMoved: infantry.length,
    },
  };
}
