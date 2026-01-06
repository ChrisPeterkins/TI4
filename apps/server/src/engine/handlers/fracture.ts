/**
 * Thunder's Edge Fracture System Handlers
 *
 * The Fracture is a special extra-dimensional region accessible only through
 * Ingress tokens. It contains valuable planets guarded by neutral units.
 *
 * Key mechanics:
 * - Ingress tokens placed by Vul'Raith or certain abilities
 * - Movement through Fracture grants +1 movement
 * - Controlling Fracture planets grants relics
 * - Neutral units guard Fracture planets
 */

import type {
  GameState,
  PlayerState,
  MapTile,
  UnitInstance,
  FractureState,
  IngressToken,
  NeutralUnit,
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

export interface PlaceIngressAction {
  type: 'place_ingress';
  playerId: string;
  systemId: string;
}

export interface MoveIngressAction {
  type: 'move_ingress';
  playerId: string;
  toSystemId: string;
}

export interface EnterFractureAction {
  type: 'enter_fracture';
  playerId: string;
  fromSystemId: string;
  unitIds: string[];
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize The Fracture system state
 * Called when Vul'Raith unlocks their breakthrough or Thunder's Edge is gained
 */
export function initializeFracture(): FractureState {
  return {
    isActive: true,
    ingressTokens: [],
    neutralUnits: generateFractureGuards(),
    playersEnteredThisRound: [],
  };
}

/**
 * Generate the initial neutral units guarding Fracture planets
 */
function generateFractureGuards(): NeutralUnit[] {
  const guards: NeutralUnit[] = [];
  let unitCounter = 0;

  // Cocytus guards
  guards.push(
    { id: `neutral-${unitCounter++}`, type: 'neutral_cruiser', systemId: '125' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_fighter', systemId: '125' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '125', planetId: 'cocytus' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '125', planetId: 'cocytus' }
  );

  // Styx guards (more heavily defended - legendary)
  guards.push(
    { id: `neutral-${unitCounter++}`, type: 'neutral_cruiser', systemId: '125' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_cruiser', systemId: '125' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_fighter', systemId: '125' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_fighter', systemId: '125' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '125', planetId: 'styx' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '125', planetId: 'styx' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '125', planetId: 'styx' }
  );

  // Lethe guards
  guards.push(
    { id: `neutral-${unitCounter++}`, type: 'neutral_cruiser', systemId: '126' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '126', planetId: 'lethe' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '126', planetId: 'lethe' }
  );

  // Phlegethon guards
  guards.push(
    { id: `neutral-${unitCounter++}`, type: 'neutral_cruiser', systemId: '126' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_fighter', systemId: '126' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '126', planetId: 'phlegethon' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '126', planetId: 'phlegethon' }
  );

  // Acheron guards
  guards.push(
    { id: `neutral-${unitCounter++}`, type: 'neutral_cruiser', systemId: '127' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_cruiser', systemId: '127' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_fighter', systemId: '127' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '127', planetId: 'acheron' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '127', planetId: 'acheron' },
    { id: `neutral-${unitCounter++}`, type: 'neutral_infantry', systemId: '127', planetId: 'acheron' }
  );

  return guards;
}

// ============================================================================
// Ingress Token Management
// ============================================================================

/**
 * Place an ingress token in a system
 */
export function handlePlaceIngress(
  state: GameState,
  action: PlaceIngressAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Initialize fracture state if needed
  if (!state.fractureState) {
    state.fractureState = initializeFracture();
  }

  // Check if player already has an ingress token
  const existingToken = state.fractureState.ingressTokens.find(
    (t: IngressToken) => t.playerId === action.playerId
  );
  if (existingToken) {
    return { success: false, error: 'Player already has an ingress token' };
  }

  // Verify system exists and player has units there
  const tile = state.map.tiles.find((t: MapTile) => t.id === action.systemId);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  const hasUnits = tile.units.some((u: UnitInstance) => u.ownerId === action.playerId) ||
    tile.planets.some((p) => p.units.some((u: UnitInstance) => u.ownerId === action.playerId));
  if (!hasUnits) {
    return { success: false, error: 'Player must have units in the system' };
  }

  // Place the token
  state.fractureState.ingressTokens.push({
    playerId: action.playerId,
    systemId: action.systemId,
    active: true,
  });

  return {
    success: true,
    triggeredEvents: ['ingress_token_placed'],
    data: {
      playerId: action.playerId,
      systemId: action.systemId,
    },
  };
}

/**
 * Move an ingress token to an adjacent system
 */
export function handleMoveIngress(
  state: GameState,
  action: MoveIngressAction
): HandlerResult {
  if (!state.fractureState) {
    return { success: false, error: 'Fracture not active' };
  }

  const token = state.fractureState.ingressTokens.find(
    (t: IngressToken) => t.playerId === action.playerId
  );
  if (!token) {
    return { success: false, error: 'Player has no ingress token' };
  }

  // Verify new system exists
  const newTile = state.map.tiles.find((t: MapTile) => t.id === action.toSystemId);
  if (!newTile) {
    return { success: false, error: 'Target system not found' };
  }

  // Move the token
  const oldSystemId = token.systemId;
  token.systemId = action.toSystemId;

  return {
    success: true,
    triggeredEvents: ['ingress_token_moved'],
    data: {
      playerId: action.playerId,
      fromSystemId: oldSystemId,
      toSystemId: action.toSystemId,
    },
  };
}

/**
 * Remove an ingress token
 */
export function removeIngressToken(
  state: GameState,
  playerId: string
): HandlerResult {
  if (!state.fractureState) {
    return { success: false, error: 'Fracture not active' };
  }

  const tokenIndex = state.fractureState.ingressTokens.findIndex(
    (t: IngressToken) => t.playerId === playerId
  );
  if (tokenIndex === -1) {
    return { success: false, error: 'Player has no ingress token' };
  }

  state.fractureState.ingressTokens.splice(tokenIndex, 1);

  return {
    success: true,
    triggeredEvents: ['ingress_token_removed'],
    data: { playerId },
  };
}

// ============================================================================
// Fracture Access
// ============================================================================

/**
 * Check if a player can access The Fracture from a given system
 */
export function canAccessFracture(
  state: GameState,
  playerId: string,
  fromSystemId: string
): boolean {
  if (!state.fractureState?.isActive) {
    return false;
  }

  // Player must have an active ingress token in the system
  const hasIngress = state.fractureState.ingressTokens.some(
    (t: IngressToken) =>
      t.playerId === playerId &&
      t.systemId === fromSystemId &&
      t.active
  );

  return hasIngress;
}

/**
 * Get movement bonus for units in The Fracture
 * Vul'Raith with Al'Raith Ix Ianovar breakthrough gets +1 movement in Fracture
 */
export function getFractureMovementBonus(
  state: GameState,
  playerId: string
): number {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return 0;
  }

  // Check for Vul'Raith breakthrough
  if (player.breakthrough?.breakthroughId === 'alraith_ix_ianovar' &&
      player.breakthrough.unlocked) {
    return 1;
  }

  return 0;
}

/**
 * Check if a system is in The Fracture
 */
export function isInFracture(systemId: string): boolean {
  const fractureSystemIds = ['125', '126', '127'];
  return fractureSystemIds.includes(systemId);
}

/**
 * Get Fracture system IDs
 */
export function getFractureSystemIds(): string[] {
  return ['125', '126', '127'];
}

// ============================================================================
// Neutral Unit Combat
// ============================================================================

/**
 * Get neutral units in a Fracture system
 */
export function getNeutralUnitsInSystem(
  state: GameState,
  systemId: string
): NeutralUnit[] {
  if (!state.fractureState) {
    return [];
  }

  return state.fractureState.neutralUnits.filter(
    (u: NeutralUnit) => u.systemId === systemId
  );
}

/**
 * Remove a neutral unit (when destroyed in combat)
 */
export function removeNeutralUnit(
  state: GameState,
  unitId: string
): HandlerResult {
  if (!state.fractureState) {
    return { success: false, error: 'Fracture not active' };
  }

  const unitIndex = state.fractureState.neutralUnits.findIndex(
    (u: NeutralUnit) => u.id === unitId
  );
  if (unitIndex === -1) {
    return { success: false, error: 'Neutral unit not found' };
  }

  const unit = state.fractureState.neutralUnits[unitIndex];
  state.fractureState.neutralUnits.splice(unitIndex, 1);

  return {
    success: true,
    triggeredEvents: ['neutral_unit_destroyed'],
    data: {
      unitId,
      unitType: unit.type,
      systemId: unit.systemId,
    },
  };
}

/**
 * Get neutral unit combat stats
 */
export function getNeutralUnitCombatValue(unitType: NeutralUnit['type']): number {
  switch (unitType) {
    case 'neutral_cruiser':
      return 7;
    case 'neutral_fighter':
      return 9;
    case 'neutral_infantry':
      return 8;
    default:
      return 9;
  }
}

// ============================================================================
// Fracture Planet Control
// ============================================================================

/**
 * Handle gaining control of a Fracture planet
 * Grants a relic to the controlling player
 */
export function handleFracturePlanetGained(
  state: GameState,
  playerId: string,
  planetId: string
): HandlerResult {
  const fracturePlanets = ['cocytus', 'styx', 'lethe', 'phlegethon', 'acheron'];
  if (!fracturePlanets.includes(planetId)) {
    return { success: false, error: 'Not a Fracture planet' };
  }

  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check if all neutral units on this planet are defeated
  const remainingNeutrals = state.fractureState?.neutralUnits.filter(
    (u: NeutralUnit) => u.planetId === planetId
  ) || [];

  if (remainingNeutrals.length > 0) {
    return { success: false, error: 'Neutral units still defending this planet' };
  }

  // Grant a relic (this would interact with the relic deck)
  const triggeredEvents = ['fracture_planet_gained', 'relic_gained'];

  // Styx is legendary - grants VP
  if (planetId === 'styx') {
    player.score += 1;
    triggeredEvents.push('victory_point_gained');
  }

  return {
    success: true,
    triggeredEvents,
    data: {
      playerId,
      planetId,
      relicGranted: true,
      vpGranted: planetId === 'styx',
    },
  };
}

/**
 * Handle losing control of a Fracture planet
 */
export function handleFracturePlanetLost(
  state: GameState,
  playerId: string,
  planetId: string
): HandlerResult {
  // Styx - lose VP
  if (planetId === 'styx') {
    const player = state.players.find((p: PlayerState) => p.id === playerId);
    if (player && player.score > 0) {
      player.score -= 1;
      return {
        success: true,
        triggeredEvents: ['fracture_planet_lost', 'victory_point_lost'],
        data: { playerId, planetId },
      };
    }
  }

  return {
    success: true,
    triggeredEvents: ['fracture_planet_lost'],
    data: { playerId, planetId },
  };
}

// ============================================================================
// Round Reset
// ============================================================================

/**
 * Reset Fracture state at the start of a new round
 */
export function resetFractureForNewRound(state: GameState): void {
  if (state.fractureState) {
    state.fractureState.playersEnteredThisRound = [];
  }
}
