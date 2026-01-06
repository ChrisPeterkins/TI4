/**
 * Thunder's Edge Faction-Specific Mechanic Handlers
 *
 * Implements the unique mechanics for Thunder's Edge factions:
 * - Last Bastion: Galvanize tokens
 * - Deepwrought Scholarate: Coexistence and Ocean cards
 * - Ral Nel Consortium: Structure transport
 * - Crimson Rebellion: Breach tokens
 * - Firmament/Obsidian: Plot cards and transformation
 */

import type {
  GameState,
  PlayerState,
  UnitInstance,
  MapTile,
  PlanetInstance,
  CoexistenceState,
  BreachTokenState,
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

export interface GalvanizeAction {
  type: 'galvanize';
  playerId: string;
  unitId: string;
}

export interface RemoveGalvanizeAction {
  type: 'remove_galvanize';
  playerId: string;
  unitId: string;
}

export interface CoexistenceAction {
  type: 'start_coexistence' | 'end_coexistence';
  playerId: string;
  planetId: string;
  targetPlayerId?: string; // For start_coexistence
}

export interface BreachTokenAction {
  type: 'place_breach' | 'activate_breach' | 'remove_breach';
  playerId: string;
  systemId: string;
}

export interface PlotCardAction {
  type: 'create_plot' | 'reveal_plot' | 'discard_plot';
  playerId: string;
  plotCardId?: string;
  targetPlayerId?: string; // The "puppeted" player
}

export interface FactionTransformAction {
  type: 'transform_to_obsidian';
  playerId: string;
}

// ============================================================================
// GALVANIZE MECHANICS (Last Bastion)
// ============================================================================

/**
 * Place a galvanize token on a unit
 */
export function handleGalvanize(
  state: GameState,
  action: GalvanizeAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player is Last Bastion
  if (player.faction !== 'last_bastion') {
    return { success: false, error: 'Only Last Bastion can galvanize units' };
  }

  // Find the unit
  const unit = findUnitInGame(state, action.unitId);
  if (!unit) {
    return { success: false, error: 'Unit not found' };
  }

  // Verify unit belongs to player
  if (unit.ownerId !== action.playerId) {
    return { success: false, error: 'Unit does not belong to player' };
  }

  // Initialize galvanize tokens array if needed
  if (!player.galvanizeTokens) {
    player.galvanizeTokens = [];
  }

  // Check if unit already galvanized
  if (player.galvanizeTokens.includes(action.unitId)) {
    return { success: false, error: 'Unit is already galvanized' };
  }

  // Add galvanize token
  player.galvanizeTokens.push(action.unitId);

  return {
    success: true,
    triggeredEvents: ['unit_galvanized'],
    data: {
      playerId: action.playerId,
      unitId: action.unitId,
      unitType: unit.type,
    },
  };
}

/**
 * Remove a galvanize token from a unit
 */
export function handleRemoveGalvanize(
  state: GameState,
  action: RemoveGalvanizeAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!player.galvanizeTokens?.includes(action.unitId)) {
    return { success: false, error: 'Unit is not galvanized' };
  }

  // Remove galvanize token
  player.galvanizeTokens = player.galvanizeTokens.filter(
    (id: string) => id !== action.unitId
  );

  return {
    success: true,
    triggeredEvents: ['galvanize_removed'],
    data: {
      playerId: action.playerId,
      unitId: action.unitId,
    },
  };
}

/**
 * Check if a unit is galvanized
 */
export function isUnitGalvanized(player: PlayerState, unitId: string): boolean {
  return player.galvanizeTokens?.includes(unitId) ?? false;
}

/**
 * Get galvanize combat bonus (extra dice)
 */
export function getGalvanizeCombatBonus(
  player: PlayerState,
  unitId: string
): number {
  if (player.faction !== 'last_bastion') {
    return 0;
  }
  return isUnitGalvanized(player, unitId) ? 1 : 0;
}

/**
 * Handle Phoenix Standard ability - galvanize after combat
 */
export function handlePhoenixStandard(
  state: GameState,
  playerId: string,
  unitId: string
): HandlerResult {
  return handleGalvanize(state, {
    type: 'galvanize',
    playerId,
    unitId,
  });
}

/**
 * Handle A3 Valiance death - galvanize infantry when destroyed while galvanized
 */
export function handleA3ValianceDeath(
  state: GameState,
  playerId: string,
  systemId: string,
  mechUnitId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check if mech was galvanized
  if (!isUnitGalvanized(player, mechUnitId)) {
    return { success: false, error: 'Mech was not galvanized' };
  }

  // Find infantry in the system
  const tile = state.map.tiles.find((t: MapTile) => t.id === systemId);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  const infantry: UnitInstance[] = [];
  for (const planet of tile.planets) {
    for (const unit of planet.units) {
      if (unit.ownerId === playerId && unit.type === 'infantry') {
        infantry.push(unit);
      }
    }
  }

  // Galvanize up to 3 infantry
  const toGalvanize = infantry.slice(0, 3);
  const galvanized: string[] = [];

  for (const unit of toGalvanize) {
    if (!player.galvanizeTokens) {
      player.galvanizeTokens = [];
    }
    if (!player.galvanizeTokens.includes(unit.id)) {
      player.galvanizeTokens.push(unit.id);
      galvanized.push(unit.id);
    }
  }

  return {
    success: true,
    triggeredEvents: ['a3_valiance_triggered', 'infantry_galvanized'],
    data: {
      mechId: mechUnitId,
      galvanizedInfantry: galvanized,
      count: galvanized.length,
    },
  };
}

// ============================================================================
// COEXISTENCE MECHANICS (Deepwrought Scholarate)
// ============================================================================

/**
 * Start coexistence on a planet
 */
export function handleStartCoexistence(
  state: GameState,
  action: CoexistenceAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Only Deepwrought or players with Titans breakthrough can coexist
  const canCoexist =
    player.faction === 'deepwrought' ||
    player.breakthrough?.breakthroughId === 'slumberstate_computing';

  if (!canCoexist) {
    return { success: false, error: 'Player cannot initiate coexistence' };
  }

  if (!action.targetPlayerId) {
    return { success: false, error: 'Must specify target player for coexistence' };
  }

  // Initialize coexistence state if needed
  if (!state.coexistenceState) {
    state.coexistenceState = [];
  }

  // Check if planet already has coexisting units
  const existingCoexistence = state.coexistenceState.find(
    (c: CoexistenceState) => c.planetId === action.planetId
  );

  if (existingCoexistence) {
    // Add player to existing coexistence if not already present
    if (!existingCoexistence.coexistingPlayers.includes(action.playerId)) {
      existingCoexistence.coexistingPlayers.push(action.playerId);
    }
    if (!existingCoexistence.coexistingPlayers.includes(action.targetPlayerId)) {
      existingCoexistence.coexistingPlayers.push(action.targetPlayerId);
    }
  } else {
    // Create new coexistence
    state.coexistenceState.push({
      planetId: action.planetId,
      coexistingPlayers: [action.playerId, action.targetPlayerId],
    });
  }

  // Trigger Oceanbound ability for Deepwrought
  if (player.faction === 'deepwrought') {
    gainOceanCard(state, player);
  }

  return {
    success: true,
    triggeredEvents: ['coexistence_started'],
    data: {
      planetId: action.planetId,
      players: [action.playerId, action.targetPlayerId],
    },
  };
}

/**
 * End coexistence on a planet
 */
export function handleEndCoexistence(
  state: GameState,
  action: CoexistenceAction
): HandlerResult {
  if (!state.coexistenceState) {
    return { success: false, error: 'No coexistence state exists' };
  }

  const coexistenceIndex = state.coexistenceState.findIndex(
    (c: CoexistenceState) => c.planetId === action.planetId
  );

  if (coexistenceIndex === -1) {
    return { success: false, error: 'No coexistence on this planet' };
  }

  // Remove coexistence
  state.coexistenceState.splice(coexistenceIndex, 1);

  // Check if Deepwrought player needs to discard ocean cards
  const deepwrought = state.players.find(
    (p: PlayerState) => p.faction === 'deepwrought'
  );
  if (deepwrought) {
    checkOceanCardLimit(state, deepwrought);
  }

  return {
    success: true,
    triggeredEvents: ['coexistence_ended'],
    data: {
      planetId: action.planetId,
    },
  };
}

/**
 * Check if a planet has units in coexistence
 */
export function hasCoexistence(state: GameState, planetId: string): boolean {
  return state.coexistenceState?.some(
    (c: CoexistenceState) => c.planetId === planetId
  ) ?? false;
}

/**
 * Get players coexisting on a planet
 */
export function getCoexistingPlayers(
  state: GameState,
  planetId: string
): string[] {
  const coexistence = state.coexistenceState?.find(
    (c: CoexistenceState) => c.planetId === planetId
  );
  return coexistence?.coexistingPlayers ?? [];
}

// ============================================================================
// OCEAN CARD MECHANICS (Deepwrought Scholarate)
// ============================================================================

/**
 * Gain an ocean card
 */
export function gainOceanCard(state: GameState, player: PlayerState): void {
  if (!player.oceanCards) {
    player.oceanCards = [];
  }

  // Draw from ocean card deck (simplified - would need actual deck)
  const newCardId = `ocean_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  player.oceanCards.push(newCardId);
}

/**
 * Check if player exceeds ocean card limit
 */
export function checkOceanCardLimit(
  state: GameState,
  player: PlayerState
): void {
  if (!player.oceanCards || !state.coexistenceState) {
    return;
  }

  // Count planets with coexisting units for this player
  const coexistingPlanetCount = state.coexistenceState.filter(
    (c: CoexistenceState) => c.coexistingPlayers.includes(player.id)
  ).length;

  // Discard excess ocean cards
  while (player.oceanCards.length > coexistingPlanetCount) {
    player.oceanCards.pop();
  }
}

// ============================================================================
// BREACH TOKEN MECHANICS (Crimson Rebellion)
// ============================================================================

/**
 * Place a breach token in a system
 */
export function handlePlaceBreachToken(
  state: GameState,
  action: BreachTokenAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Only Crimson Rebellion can place breach tokens
  if (player.faction !== 'crimson_rebellion') {
    return { success: false, error: 'Only Crimson Rebellion can place breach tokens' };
  }

  // Initialize breach tokens array if needed
  if (!state.breachTokens) {
    state.breachTokens = [];
  }

  // Check if system already has a breach token
  const existingToken = state.breachTokens.find(
    (bt: BreachTokenState) => bt.systemId === action.systemId
  );

  if (existingToken) {
    return { success: false, error: 'System already has a breach token' };
  }

  // Place new breach token (inactive by default)
  state.breachTokens.push({
    systemId: action.systemId,
    placedBy: action.playerId,
    active: false,
  });

  return {
    success: true,
    triggeredEvents: ['breach_token_placed'],
    data: {
      systemId: action.systemId,
      active: false,
    },
  };
}

/**
 * Activate a breach token
 */
export function handleActivateBreachToken(
  state: GameState,
  action: BreachTokenAction
): HandlerResult {
  if (!state.breachTokens) {
    return { success: false, error: 'No breach tokens exist' };
  }

  const token = state.breachTokens.find(
    (bt: BreachTokenState) => bt.systemId === action.systemId
  );

  if (!token) {
    return { success: false, error: 'No breach token in this system' };
  }

  if (token.active) {
    return { success: false, error: 'Breach token is already active' };
  }

  token.active = true;

  return {
    success: true,
    triggeredEvents: ['breach_token_activated'],
    data: {
      systemId: action.systemId,
    },
  };
}

/**
 * Remove a breach token from a system
 */
export function handleRemoveBreachToken(
  state: GameState,
  action: BreachTokenAction
): HandlerResult {
  if (!state.breachTokens) {
    return { success: false, error: 'No breach tokens exist' };
  }

  const tokenIndex = state.breachTokens.findIndex(
    (bt: BreachTokenState) => bt.systemId === action.systemId
  );

  if (tokenIndex === -1) {
    return { success: false, error: 'No breach token in this system' };
  }

  state.breachTokens.splice(tokenIndex, 1);

  return {
    success: true,
    triggeredEvents: ['breach_token_removed'],
    data: {
      systemId: action.systemId,
    },
  };
}

/**
 * Remove all breach tokens (at end of status phase)
 */
export function removeAllBreachTokens(state: GameState): HandlerResult {
  const removedCount = state.breachTokens?.length ?? 0;
  state.breachTokens = [];

  return {
    success: true,
    triggeredEvents: ['all_breach_tokens_removed'],
    data: {
      removedCount,
    },
  };
}

/**
 * Check if two systems are adjacent via active breach tokens
 */
export function areSystemsBreachAdjacent(
  state: GameState,
  systemId1: string,
  systemId2: string
): boolean {
  if (!state.breachTokens) {
    return false;
  }

  // Systems with active breach tokens are adjacent to each other
  const system1HasActiveBreach = state.breachTokens.some(
    (bt: BreachTokenState) => bt.systemId === systemId1 && bt.active
  );
  const system2HasActiveBreach = state.breachTokens.some(
    (bt: BreachTokenState) => bt.systemId === systemId2 && bt.active
  );

  return system1HasActiveBreach && system2HasActiveBreach;
}

/**
 * Check if Crimson Rebellion can use a wormhole
 */
export function canCrimsonUseWormhole(
  wormholeType: string,
  player: PlayerState
): boolean {
  if (player.faction !== 'crimson_rebellion') {
    return true; // Other factions have no restriction
  }

  // Crimson Rebellion can only use epsilon wormholes
  return wormholeType === 'epsilon';
}

// ============================================================================
// PLOT CARD MECHANICS (Firmament / Obsidian)
// ============================================================================

/**
 * Create a plot card (when scoring other player's secret objective)
 */
export function handleCreatePlotCard(
  state: GameState,
  action: PlotCardAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Only Firmament/Obsidian can create plot cards
  if (player.faction !== 'firmament' && player.faction !== 'obsidian') {
    return { success: false, error: 'Only Firmament/Obsidian can create plot cards' };
  }

  if (!action.targetPlayerId) {
    return { success: false, error: 'Must specify target player for plot card' };
  }

  // Initialize plot cards arrays if needed
  if (!player.plotCards) {
    player.plotCards = [];
  }

  // Create new plot card with target player's control token
  const plotCardId = `plot_${action.targetPlayerId}_${Date.now()}`;
  player.plotCards.push(plotCardId);

  return {
    success: true,
    triggeredEvents: ['plot_card_created'],
    data: {
      plotCardId,
      targetPlayerId: action.targetPlayerId,
    },
  };
}

/**
 * Reveal a plot card (put into play)
 */
export function handleRevealPlotCard(
  state: GameState,
  action: PlotCardAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!action.plotCardId) {
    return { success: false, error: 'Must specify plot card to reveal' };
  }

  if (!player.plotCards?.includes(action.plotCardId)) {
    return { success: false, error: 'Player does not have that plot card' };
  }

  // Move from hand to play area
  player.plotCards = player.plotCards.filter((id: string) => id !== action.plotCardId);

  if (!player.plotCardsInPlay) {
    player.plotCardsInPlay = [];
  }
  player.plotCardsInPlay.push(action.plotCardId);

  return {
    success: true,
    triggeredEvents: ['plot_card_revealed'],
    data: {
      plotCardId: action.plotCardId,
    },
  };
}

/**
 * Get players that are "puppeted" by plot cards
 */
export function getPuppetedPlayers(player: PlayerState): string[] {
  if (player.faction !== 'obsidian' || !player.plotCardsInPlay) {
    return [];
  }

  // Extract target player IDs from plot card IDs
  // Format: plot_{targetPlayerId}_{timestamp}
  return player.plotCardsInPlay
    .map((cardId: string) => {
      const parts = cardId.split('_');
      return parts.length >= 2 ? parts[1] : null;
    })
    .filter((id: string | null): id is string => id !== null);
}

/**
 * Check if a player is puppeted by Obsidian
 */
export function isPlayerPuppeted(state: GameState, playerId: string): boolean {
  const obsidian = state.players.find(
    (p: PlayerState) => p.faction === 'obsidian'
  );
  if (!obsidian) {
    return false;
  }

  return getPuppetedPlayers(obsidian).includes(playerId);
}

// ============================================================================
// FACTION TRANSFORMATION (Firmament -> Obsidian)
// ============================================================================

/**
 * Transform from Firmament to Obsidian
 */
export function handleTransformToObsidian(
  state: GameState,
  action: FactionTransformAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (player.faction !== 'firmament') {
    return { success: false, error: 'Only Firmament can transform to Obsidian' };
  }

  // Must have at least 1 plot card in play
  if (!player.plotCardsInPlay || player.plotCardsInPlay.length === 0) {
    return {
      success: false,
      error: 'Must have at least 1 plot card in play to transform',
    };
  }

  // Transform faction
  player.faction = 'obsidian';

  // Flip breakthrough from The Sowing to The Reaping
  if (player.breakthrough) {
    // Transfer accumulated trade goods
    const accumulatedTg = player.breakthrough.tradeGoodsOnCard || 0;
    player.breakthrough = {
      breakthroughId: 'the_reaping',
      unlocked: true,
      exhausted: false,
      tradeGoodsOnCard: accumulatedTg, // Inherited for The Reaping
    };
  }

  // Ready home system planets
  for (const planetState of player.planets) {
    if (planetState.planetId === 'cronos' || planetState.planetId === 'cronos_hollow') {
      planetState.exhausted = false;
    }
  }

  return {
    success: true,
    triggeredEvents: ['faction_transformed', 'obsidian_awakened'],
    data: {
      previousFaction: 'firmament',
      newFaction: 'obsidian',
      plotCardsInPlay: player.plotCardsInPlay.length,
    },
  };
}

// ============================================================================
// STRUCTURE TRANSPORT (Ral Nel Consortium)
// ============================================================================

/**
 * Check if a unit type is a transportable structure for Ral Nel
 */
export function isTransportableStructure(
  unitType: string,
  player: PlayerState
): boolean {
  if (player.faction !== 'ral_nel') {
    return false;
  }

  return unitType === 'pds' || unitType === 'space_dock';
}

/**
 * Handle structure landing (end of tactical action)
 */
export function handleStructureLanding(
  state: GameState,
  playerId: string,
  systemId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (player.faction !== 'ral_nel') {
    return { success: false, error: 'Only Ral Nel can land structures' };
  }

  const tile = state.map.tiles.find((t: MapTile) => t.id === systemId);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  // Find structures in space area that belong to player
  const structuresInSpace = tile.units.filter(
    (u: UnitInstance) =>
      u.ownerId === playerId &&
      (u.type === 'pds' || u.type === 'space_dock')
  );

  if (structuresInSpace.length === 0) {
    return { success: false, error: 'No structures in space to land' };
  }

  // Find controlled planets
  const controlledPlanets = tile.planets.filter((p: PlanetInstance) =>
    player.planets.some((ps) => ps.planetId === p.id)
  );

  if (controlledPlanets.length === 0) {
    return { success: false, error: 'No controlled planets to land on' };
  }

  // Move structures to first controlled planet (would need selection UI)
  const targetPlanet = controlledPlanets[0];
  const movedStructures: string[] = [];

  for (const structure of structuresInSpace) {
    // Remove from space
    tile.units = tile.units.filter((u: UnitInstance) => u.id !== structure.id);
    // Add to planet
    targetPlanet.units.push(structure);
    movedStructures.push(structure.id);
  }

  return {
    success: true,
    triggeredEvents: ['structures_landed'],
    data: {
      systemId,
      planetId: targetPlanet.id,
      structureIds: movedStructures,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find a unit anywhere in the game
 */
function findUnitInGame(
  state: GameState,
  unitId: string
): UnitInstance | undefined {
  for (const tile of state.map.tiles) {
    // Check space area
    const spaceUnit = tile.units.find((u: UnitInstance) => u.id === unitId);
    if (spaceUnit) {
      return spaceUnit;
    }

    // Check planets
    for (const planet of tile.planets) {
      const planetUnit = planet.units.find((u: UnitInstance) => u.id === unitId);
      if (planetUnit) {
        return planetUnit;
      }
    }
  }

  return undefined;
}
