/**
 * Crimson Rebellion Faction Ability Handlers
 *
 * Key mechanics:
 * - SUNDERED: Cannot use non-epsilon wormholes but can travel via breach tokens
 * - INCURSION: Place breach tokens to create wormhole-like connections
 * - Breach tokens have active/inactive states
 */

import type {
  GameState,
  PlayerState,
  UnitInstance,
  MapTile,
  BreachTokenState,
  WormholeType,
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

export interface PlaceBreachAction {
  type: 'place_breach';
  playerId: string;
  systemId: string;
}

export interface FlipBreachAction {
  type: 'flip_breach';
  playerId: string;
  systemId: string;
}

export interface RemoveBreachAction {
  type: 'remove_breach';
  playerId: string;
  systemId: string;
}

// ============================================================================
// Sundered - Wormhole Restrictions
// ============================================================================

/**
 * Check if player is Sundered (cannot use non-epsilon wormholes)
 */
export function isSundered(state: GameState, playerId: string): boolean {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  return player?.faction === 'crimson_rebellion';
}

/**
 * Check if a wormhole can be used by a player
 * Crimson Rebellion can only use epsilon wormholes
 */
export function canUseWormhole(
  state: GameState,
  playerId: string,
  wormholeType: WormholeType
): boolean {
  if (!isSundered(state, playerId)) {
    return true; // Non-Crimson Rebellion can use any wormhole
  }

  // Crimson Rebellion can only use epsilon wormholes
  return wormholeType === 'epsilon';
}

/**
 * Get wormholes that a player can use
 */
export function getUsableWormholes(
  state: GameState,
  playerId: string
): { systemId: string; wormholeType: WormholeType }[] {
  const result: { systemId: string; wormholeType: WormholeType }[] = [];

  for (const tile of state.map.tiles) {
    if (tile.wormhole && canUseWormhole(state, playerId, tile.wormhole)) {
      result.push({ systemId: tile.id, wormholeType: tile.wormhole });
    }
  }

  return result;
}

// ============================================================================
// Breach Token Management
// ============================================================================

/**
 * Get all breach tokens
 */
export function getBreachTokens(state: GameState): BreachTokenState[] {
  return state.breachTokens ?? [];
}

/**
 * Get breach token in a system
 */
export function getBreachTokenInSystem(
  state: GameState,
  systemId: string
): BreachTokenState | undefined {
  return state.breachTokens?.find((b: BreachTokenState) => b.systemId === systemId);
}

/**
 * Get all active breach tokens
 */
export function getActiveBreachTokens(state: GameState): BreachTokenState[] {
  return (state.breachTokens ?? []).filter((b: BreachTokenState) => b.active);
}

/**
 * Check if a system has an active breach token
 */
export function hasActiveBreachToken(state: GameState, systemId: string): boolean {
  return state.breachTokens?.some(
    (b: BreachTokenState) => b.systemId === systemId && b.active
  ) ?? false;
}

/**
 * Check if two systems are connected via active breach tokens
 * Active breach tokens create adjacency between each other
 */
export function areSystemsConnectedByBreach(
  state: GameState,
  systemId1: string,
  systemId2: string
): boolean {
  const activeTokens = getActiveBreachTokens(state);

  // Both systems must have active breach tokens
  const has1 = activeTokens.some((b: BreachTokenState) => b.systemId === systemId1);
  const has2 = activeTokens.some((b: BreachTokenState) => b.systemId === systemId2);

  return has1 && has2;
}

/**
 * Get systems adjacent to a system via active breach tokens
 */
export function getBreachAdjacentSystems(state: GameState, systemId: string): string[] {
  if (!hasActiveBreachToken(state, systemId)) {
    return [];
  }

  // All other systems with active breach tokens are adjacent
  return getActiveBreachTokens(state)
    .filter((b: BreachTokenState) => b.systemId !== systemId)
    .map((b: BreachTokenState) => b.systemId);
}

/**
 * Place a breach token in a system (INCURSION ability)
 */
export function handlePlaceBreach(
  state: GameState,
  action: PlaceBreachAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (player.faction !== 'crimson_rebellion') {
    return { success: false, error: 'Only Crimson Rebellion can place breach tokens' };
  }

  // Verify system exists
  const tile = state.map.tiles.find((t: MapTile) => t.id === action.systemId);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  // Check if there's already a breach token here
  if (getBreachTokenInSystem(state, action.systemId)) {
    return { success: false, error: 'System already has a breach token' };
  }

  // Initialize breach tokens array if needed
  if (!state.breachTokens) {
    state.breachTokens = [];
  }

  // Count existing tokens - may have a limit
  const playerTokens = state.breachTokens.filter(
    (b: BreachTokenState) => b.placedBy === action.playerId
  );

  // Maximum 3 breach tokens (placeholder limit)
  if (playerTokens.length >= 3) {
    return { success: false, error: 'Maximum breach tokens reached' };
  }

  // Place the token (inactive by default)
  state.breachTokens.push({
    systemId: action.systemId,
    placedBy: action.playerId,
    active: false,
  });

  return {
    success: true,
    triggeredEvents: ['breach_token_placed'],
    data: {
      playerId: action.playerId,
      systemId: action.systemId,
      active: false,
    },
  };
}

/**
 * Flip a breach token (activate/deactivate)
 * Activated when Crimson Rebellion ships enter the system
 */
export function handleFlipBreach(
  state: GameState,
  action: FlipBreachAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const breach = getBreachTokenInSystem(state, action.systemId);
  if (!breach) {
    return { success: false, error: 'No breach token in system' };
  }

  // Only the player who placed the token can flip it
  if (breach.placedBy !== action.playerId) {
    return { success: false, error: 'Can only flip your own breach tokens' };
  }

  // Flip the token
  const wasActive = breach.active;
  breach.active = !breach.active;

  return {
    success: true,
    triggeredEvents: [breach.active ? 'breach_token_activated' : 'breach_token_deactivated'],
    data: {
      playerId: action.playerId,
      systemId: action.systemId,
      active: breach.active,
      wasActive,
    },
  };
}

/**
 * Remove a breach token
 */
export function handleRemoveBreach(
  state: GameState,
  action: RemoveBreachAction
): HandlerResult {
  if (!state.breachTokens) {
    return { success: false, error: 'No breach tokens exist' };
  }

  const index = state.breachTokens.findIndex(
    (b: BreachTokenState) => b.systemId === action.systemId
  );

  if (index === -1) {
    return { success: false, error: 'No breach token in system' };
  }

  const breach = state.breachTokens[index];

  // Check permission (only owner can remove, or when fleet is destroyed)
  if (breach.placedBy !== action.playerId) {
    // Check if Crimson Rebellion has no ships left in the system
    const tile = state.map.tiles.find((t: MapTile) => t.id === action.systemId);
    const hasShips = tile?.units.some(
      (u: UnitInstance) => u.ownerId === breach.placedBy
    );

    if (hasShips) {
      return { success: false, error: 'Can only remove your own breach tokens' };
    }
  }

  state.breachTokens.splice(index, 1);

  return {
    success: true,
    triggeredEvents: ['breach_token_removed'],
    data: {
      playerId: action.playerId,
      systemId: action.systemId,
      wasActive: breach.active,
    },
  };
}

/**
 * Activate breach token when Crimson Rebellion ships enter system
 */
export function activateBreachOnEntry(
  state: GameState,
  playerId: string,
  systemId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'crimson_rebellion') {
    return { success: true, data: { activated: false } };
  }

  const breach = getBreachTokenInSystem(state, systemId);
  if (!breach || breach.placedBy !== playerId || breach.active) {
    return { success: true, data: { activated: false } };
  }

  // Activate the breach token
  breach.active = true;

  return {
    success: true,
    triggeredEvents: ['breach_token_activated'],
    data: {
      playerId,
      systemId,
      activated: true,
    },
  };
}

// ============================================================================
// Sever Promissory Note
// ============================================================================

/**
 * Check if wormholes are severed in a system
 * Used by Sever promissory note to block wormhole use
 */
export function isSystemSevered(state: GameState, systemId: string): boolean {
  // Check for sever token (stored in tacticalModifiers or similar)
  // This would integrate with promissory note system
  return false; // Placeholder
}

// ============================================================================
// Revolution Flagship Ability
// ============================================================================

/**
 * Get Revolution flagship combat bonus
 * +1 to combat rolls for each active breach token in play
 */
export function getRevolutionCombatBonus(state: GameState, playerId: string): number {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'crimson_rebellion') return 0;

  // Check if flagship is in combat
  if (!state.activeCombat) return 0;

  const isInCombat =
    state.activeCombat.attackerId === playerId ||
    state.activeCombat.defenderId === playerId;

  if (!isInCombat) return 0;

  // Check if flagship is in the combat system
  const combatTile = state.map.tiles.find(
    (t: MapTile) => t.id === state.activeCombat?.systemId
  );
  if (!combatTile) return 0;

  const hasFlagship = combatTile.units.some(
    (u: UnitInstance) => u.ownerId === playerId && u.type === 'flagship'
  );
  if (!hasFlagship) return 0;

  // Return bonus equal to number of active breach tokens
  return getActiveBreachTokens(state).length;
}

// ============================================================================
// Revenant Mech Ability
// ============================================================================

/**
 * Handle Revenant mech movement
 * After another player moves ships through a breach token, may move mech
 */
export function handleRevenantMovement(
  state: GameState,
  playerId: string,
  mechId: string,
  fromSystemId: string,
  toSystemId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (player.faction !== 'crimson_rebellion') {
    return { success: false, error: 'Only Crimson Rebellion can use Revenant ability' };
  }

  // Verify systems are connected by breach
  if (!areSystemsConnectedByBreach(state, fromSystemId, toSystemId)) {
    return { success: false, error: 'Systems not connected by active breach tokens' };
  }

  // Find the mech
  let fromTile: MapTile | undefined;
  let mech: UnitInstance | undefined;
  let fromPlanetId: string | undefined;

  for (const tile of state.map.tiles) {
    if (tile.id === fromSystemId) {
      fromTile = tile;
      for (const planet of tile.planets) {
        const unit = planet.units.find(
          (u: UnitInstance) => u.id === mechId && u.type === 'mech' && u.ownerId === playerId
        );
        if (unit) {
          mech = unit;
          fromPlanetId = planet.id;
          break;
        }
      }
    }
  }

  if (!fromTile || !mech || !fromPlanetId) {
    return { success: false, error: 'Mech not found in source system' };
  }

  const toTile = state.map.tiles.find((t: MapTile) => t.id === toSystemId);
  if (!toTile || toTile.planets.length === 0) {
    return { success: false, error: 'Destination system not found or has no planets' };
  }

  // Remove from source planet
  const fromPlanet = fromTile.planets.find(p => p.id === fromPlanetId);
  if (fromPlanet) {
    const mechIndex = fromPlanet.units.findIndex((u: UnitInstance) => u.id === mechId);
    if (mechIndex !== -1) {
      fromPlanet.units.splice(mechIndex, 1);
    }
  }

  // Add to destination planet (first planet in system)
  const toPlanet = toTile.planets[0];
  mech.planetId = toPlanet.id;
  toPlanet.units.push(mech);

  return {
    success: true,
    triggeredEvents: ['revenant_movement'],
    data: {
      playerId,
      mechId,
      fromSystemId,
      toSystemId,
      fromPlanetId,
      toPlanetId: toPlanet.id,
    },
  };
}

// ============================================================================
// Ahk Siever Commander Ability
// ============================================================================

/**
 * Handle Ahk Siever commander - create breach in activated system
 * When Crimson Rebellion is activated by another player,
 * may place breach token in the activated system
 */
export function handleAhkSieverTrigger(
  state: GameState,
  activatedSystemId: string
): HandlerResult {
  // Find Crimson Rebellion player
  const crPlayer = state.players.find(
    (p: PlayerState) => p.faction === 'crimson_rebellion'
  );
  if (!crPlayer) {
    return { success: true, data: { triggered: false } };
  }

  // Check if commander is unlocked
  if (!crPlayer.leaders?.commander?.unlocked) {
    return { success: true, data: { triggered: false } };
  }

  // Check if Crimson Rebellion has units in the system
  const tile = state.map.tiles.find((t: MapTile) => t.id === activatedSystemId);
  if (!tile) {
    return { success: true, data: { triggered: false } };
  }

  const hasUnits = tile.units.some((u: UnitInstance) => u.ownerId === crPlayer.id) ||
    tile.planets.some(p => p.units.some((u: UnitInstance) => u.ownerId === crPlayer.id));

  if (!hasUnits) {
    return { success: true, data: { triggered: false } };
  }

  // Check if there's already a breach token
  if (getBreachTokenInSystem(state, activatedSystemId)) {
    return { success: true, data: { triggered: false } };
  }

  // Place a breach token
  return handlePlaceBreach(state, {
    type: 'place_breach',
    playerId: crPlayer.id,
    systemId: activatedSystemId,
  });
}

// ============================================================================
// Movement Integration
// ============================================================================

/**
 * Get all systems a Crimson Rebellion player can move to from a system
 * Includes: adjacent systems, epsilon wormholes, and active breach connections
 */
export function getCrimsonMovementTargets(
  state: GameState,
  playerId: string,
  fromSystemId: string
): string[] {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'crimson_rebellion') {
    return []; // Use regular movement for non-Crimson players
  }

  const targets = new Set<string>();
  const fromTile = state.map.tiles.find((t: MapTile) => t.id === fromSystemId);
  if (!fromTile) return [];

  // Add adjacent systems (regular movement)
  const adjacentTiles = getAdjacentTiles(state, fromTile);
  for (const tile of adjacentTiles) {
    targets.add(tile.id);
  }

  // Add epsilon wormhole connections
  if (fromTile.wormhole === 'epsilon') {
    for (const tile of state.map.tiles) {
      if (tile.id !== fromSystemId && tile.wormhole === 'epsilon') {
        targets.add(tile.id);
      }
    }
  }

  // Add active breach connections
  const breachTargets = getBreachAdjacentSystems(state, fromSystemId);
  for (const systemId of breachTargets) {
    targets.add(systemId);
  }

  return [...targets];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get adjacent tiles (simplified - would use hex math in real implementation)
 */
function getAdjacentTiles(state: GameState, tile: MapTile): MapTile[] {
  const pos = tile.position;
  const adjacentPositions = [
    { q: pos.q + 1, r: pos.r },
    { q: pos.q - 1, r: pos.r },
    { q: pos.q, r: pos.r + 1 },
    { q: pos.q, r: pos.r - 1 },
    { q: pos.q + 1, r: pos.r - 1 },
    { q: pos.q - 1, r: pos.r + 1 },
  ];

  return state.map.tiles.filter((t: MapTile) =>
    adjacentPositions.some((adj) => adj.q === t.position.q && adj.r === t.position.r)
  );
}
