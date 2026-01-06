/**
 * Thunder's Edge Expedition Handler
 *
 * The expedition mechanic allows players to claim slices by paying various costs.
 * - First player to claim a slice unlocks their breakthrough
 * - Final player to claim places the Thunder's Edge planet
 * - Majority controller of claimed slices gains infantry
 */

import type {
  GameState,
  PlayerState,
  PlanetState,
  ExpeditionState,
  ExpeditionSlice,
  ExpeditionCostType,
  PlayerBreakthroughState,
} from '@ti4/shared';
import {
  BREAKTHROUGHS_BY_FACTION,
  hasTechSynergy,
} from '@ti4/shared';
import { technologies } from '@ti4/game-data';

// Re-export technologies for local use
const TECHNOLOGIES = technologies;

// ============================================================================
// Types
// ============================================================================

export interface ClaimExpeditionSliceAction {
  type: 'claim_expedition_slice';
  playerId: string;
  sliceNumber: number;
  /** Resources spent to pay the cost */
  payment: ExpeditionPayment;
}

export interface ExpeditionPayment {
  /** Planet IDs exhausted for resources/influence */
  exhaustedPlanets?: string[];
  /** Trade goods spent */
  tradeGoods?: number;
  /** Action card IDs discarded */
  actionCardIds?: string[];
  /** Secret objective ID discarded */
  secretObjectiveId?: string;
  /** Planet ID with tech specialty exhausted */
  techSpecialtyPlanetId?: string;
}

export interface HandlerResult {
  success: boolean;
  error?: string;
  triggeredEvents?: string[];
  data?: Record<string, unknown>;
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the expedition state for a Thunder's Edge game
 */
export function initializeExpedition(): ExpeditionState {
  return {
    slices: [
      { sliceNumber: 1, costType: 'resources_5', claimed: false },
      { sliceNumber: 2, costType: 'action_cards_2', claimed: false },
      { sliceNumber: 3, costType: 'influence_5', claimed: false },
      { sliceNumber: 4, costType: 'secret_objective', claimed: false },
      { sliceNumber: 5, costType: 'tech_specialty', claimed: false },
      { sliceNumber: 6, costType: 'trade_goods_3', claimed: false },
    ],
    claimOrder: [],
    completed: false,
  };
}

/**
 * Initialize a player's breakthrough state
 */
export function initializePlayerBreakthrough(factionId: string): PlayerBreakthroughState | undefined {
  const breakthrough = BREAKTHROUGHS_BY_FACTION[factionId];
  if (!breakthrough) {
    return undefined;
  }

  return {
    breakthroughId: breakthrough.id,
    unlocked: false,
    exhausted: false,
    // Initialize special tracking for certain breakthroughs
    ...(breakthrough.id === 'the_sowing' && { tradeGoodsOnCard: 0 }),
    ...(breakthrough.id === 'data_skimmer' && { collectedCards: [] }),
  };
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate if a player can claim an expedition slice
 */
export function validateExpeditionClaim(
  state: GameState,
  playerId: string,
  sliceNumber: number,
  payment: ExpeditionPayment
): { valid: boolean; error?: string } {
  // Check expedition exists
  if (!state.expeditionState) {
    return { valid: false, error: 'Expedition not initialized' };
  }

  // Check expedition not completed
  if (state.expeditionState.completed) {
    return { valid: false, error: 'Expedition already completed' };
  }

  // Find the slice
  const slice = state.expeditionState.slices.find((s: ExpeditionSlice) => s.sliceNumber === sliceNumber);
  if (!slice) {
    return { valid: false, error: 'Invalid slice number' };
  }

  // Check slice not already claimed
  if (slice.claimed) {
    return { valid: false, error: 'Slice already claimed' };
  }

  // Find player
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check player hasn't already claimed a slice
  if (state.expeditionState.claimOrder.includes(playerId)) {
    return { valid: false, error: 'Player has already claimed a slice' };
  }

  // Validate payment based on cost type
  const paymentValidation = validatePayment(player, slice.costType, payment);
  if (!paymentValidation.valid) {
    return paymentValidation;
  }

  return { valid: true };
}

/**
 * Validate the payment for a specific cost type
 */
function validatePayment(
  player: PlayerState,
  costType: ExpeditionCostType,
  payment: ExpeditionPayment
): { valid: boolean; error?: string } {
  switch (costType) {
    case 'resources_5': {
      // Need to exhaust planets for 5 resources
      if (!payment.exhaustedPlanets || payment.exhaustedPlanets.length === 0) {
        return { valid: false, error: 'Must exhaust planets for resources' };
      }
      const totalResources = calculatePlanetResources(player, payment.exhaustedPlanets);
      if (totalResources < 5) {
        return { valid: false, error: 'Insufficient resources (need 5)' };
      }
      return { valid: true };
    }

    case 'action_cards_2': {
      // Need to discard 2 action cards
      if (!payment.actionCardIds || payment.actionCardIds.length < 2) {
        return { valid: false, error: 'Must discard 2 action cards' };
      }
      // Verify player has these cards
      for (const cardId of payment.actionCardIds) {
        if (!player.actionCards.includes(cardId)) {
          return { valid: false, error: `Player does not have action card: ${cardId}` };
        }
      }
      return { valid: true };
    }

    case 'influence_5': {
      // Need to exhaust planets for 5 influence
      if (!payment.exhaustedPlanets || payment.exhaustedPlanets.length === 0) {
        return { valid: false, error: 'Must exhaust planets for influence' };
      }
      const totalInfluence = calculatePlanetInfluence(player, payment.exhaustedPlanets);
      if (totalInfluence < 5) {
        return { valid: false, error: 'Insufficient influence (need 5)' };
      }
      return { valid: true };
    }

    case 'secret_objective': {
      // Need to discard 1 secret objective
      if (!payment.secretObjectiveId) {
        return { valid: false, error: 'Must discard a secret objective' };
      }
      if (!player.secretObjectives.includes(payment.secretObjectiveId)) {
        return { valid: false, error: 'Player does not have that secret objective' };
      }
      return { valid: true };
    }

    case 'tech_specialty': {
      // Need to exhaust a planet with tech specialty
      if (!payment.techSpecialtyPlanetId) {
        return { valid: false, error: 'Must exhaust a planet with technology specialty' };
      }
      const planet = player.planets.find((p: PlanetState) => p.planetId === payment.techSpecialtyPlanetId);
      if (!planet) {
        return { valid: false, error: 'Player does not control that planet' };
      }
      if (planet.exhausted) {
        return { valid: false, error: 'Planet is already exhausted' };
      }
      // Note: We'd need to check the planet data to verify it has a tech specialty
      // For now, trust the client
      return { valid: true };
    }

    case 'trade_goods_3': {
      // Need to spend 3 trade goods
      const tgSpent = payment.tradeGoods || 0;
      if (tgSpent < 3) {
        return { valid: false, error: 'Must spend 3 trade goods' };
      }
      if (player.tradeGoods < 3) {
        return { valid: false, error: 'Insufficient trade goods' };
      }
      return { valid: true };
    }

    default:
      return { valid: false, error: 'Unknown cost type' };
  }
}

// ============================================================================
// Handlers
// ============================================================================

/**
 * Handle claiming an expedition slice
 */
export function handleClaimExpeditionSlice(
  state: GameState,
  action: ClaimExpeditionSliceAction
): HandlerResult {
  const { playerId, sliceNumber, payment } = action;

  // Validate
  const validation = validateExpeditionClaim(state, playerId, sliceNumber, payment);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const player = state.players.find((p: PlayerState) => p.id === playerId)!;
  const expedition = state.expeditionState!;
  const slice = expedition.slices.find((s: ExpeditionSlice) => s.sliceNumber === sliceNumber)!;

  // Apply payment
  applyPayment(player, slice.costType, payment);

  // Mark slice as claimed
  slice.claimed = true;
  slice.claimedBy = playerId;
  expedition.claimOrder.push(playerId);

  const triggeredEvents: string[] = ['expedition_slice_claimed'];
  const data: Record<string, unknown> = {
    playerId,
    sliceNumber,
    costType: slice.costType,
  };

  // First claim - player unlocks breakthrough
  if (expedition.claimOrder.length === 1) {
    const unlockResult = unlockBreakthrough(state, player);
    if (unlockResult.success) {
      triggeredEvents.push('breakthrough_unlocked');
      data.breakthroughUnlocked = true;
      data.breakthroughId = player.breakthrough?.breakthroughId;
    }
  }

  // Check if expedition is complete (all slices claimed or max players)
  const allClaimed = expedition.slices.every(s => s.claimed);
  const maxPlayers = expedition.claimOrder.length >= state.players.length;

  if (allClaimed || maxPlayers) {
    expedition.completed = true;
    triggeredEvents.push('expedition_completed');

    // Final claimer places Thunder's Edge planet
    // (This would involve map manipulation - simplified here)
    data.thundersEdgePlaced = true;

    // Majority controller gains infantry
    // (Would need to track slice positions and count by player)
  }

  return {
    success: true,
    triggeredEvents,
    data,
  };
}

/**
 * Apply the payment for claiming a slice
 */
function applyPayment(
  player: PlayerState,
  costType: ExpeditionCostType,
  payment: ExpeditionPayment
): void {
  switch (costType) {
    case 'resources_5':
    case 'influence_5':
      // Exhaust planets
      if (payment.exhaustedPlanets) {
        for (const planetId of payment.exhaustedPlanets) {
          const planet = player.planets.find((p: PlanetState) => p.planetId === planetId);
          if (planet) {
            planet.exhausted = true;
          }
        }
      }
      break;

    case 'action_cards_2':
      // Discard action cards
      if (payment.actionCardIds) {
        player.actionCards = player.actionCards.filter(
          id => !payment.actionCardIds!.includes(id)
        );
      }
      break;

    case 'secret_objective':
      // Discard secret objective
      if (payment.secretObjectiveId) {
        player.secretObjectives = player.secretObjectives.filter(
          id => id !== payment.secretObjectiveId
        );
      }
      break;

    case 'tech_specialty':
      // Exhaust the tech specialty planet
      if (payment.techSpecialtyPlanetId) {
        const planet = player.planets.find((p: PlanetState) => p.planetId === payment.techSpecialtyPlanetId);
        if (planet) {
          planet.exhausted = true;
        }
      }
      break;

    case 'trade_goods_3':
      // Spend trade goods
      player.tradeGoods -= 3;
      break;
  }
}

// ============================================================================
// Breakthrough Management
// ============================================================================

/**
 * Unlock a player's breakthrough
 */
export function unlockBreakthrough(
  state: GameState,
  player: PlayerState
): HandlerResult {
  // Initialize breakthrough if not present
  if (!player.breakthrough) {
    player.breakthrough = initializePlayerBreakthrough(player.faction);
    if (!player.breakthrough) {
      return { success: false, error: 'Faction has no breakthrough' };
    }
  }

  // Check if already unlocked
  if (player.breakthrough.unlocked) {
    return { success: false, error: 'Breakthrough already unlocked' };
  }

  // Check tech synergy
  const breakthrough = BREAKTHROUGHS_BY_FACTION[player.faction];
  if (!breakthrough) {
    return { success: false, error: 'Breakthrough not found' };
  }

  // Build tech color map
  const techColors: Record<string, 'red' | 'blue' | 'yellow' | 'green' | undefined> = {};
  for (const tech of Object.values(TECHNOLOGIES)) {
    if (tech.color) {
      techColors[tech.id] = tech.color;
    }
  }

  // Check synergy (Crimson Rebellion starts with breakthrough unlocked)
  if (player.faction !== 'crimson_rebellion') {
    if (!hasTechSynergy(player.technologies, techColors, breakthrough.synergy)) {
      return {
        success: false,
        error: `Missing tech synergy: need ${breakthrough.synergy?.color1} and ${breakthrough.synergy?.color2} technologies`,
      };
    }
  }

  // Unlock!
  player.breakthrough.unlocked = true;

  return {
    success: true,
    triggeredEvents: ['breakthrough_unlocked'],
    data: {
      playerId: player.id,
      breakthroughId: breakthrough.id,
    },
  };
}

/**
 * Exhaust a player's breakthrough (for exhaustable breakthroughs)
 */
export function exhaustBreakthrough(player: PlayerState): HandlerResult {
  if (!player.breakthrough) {
    return { success: false, error: 'Player has no breakthrough' };
  }

  if (!player.breakthrough.unlocked) {
    return { success: false, error: 'Breakthrough not unlocked' };
  }

  if (player.breakthrough.exhausted) {
    return { success: false, error: 'Breakthrough already exhausted' };
  }

  const breakthrough = BREAKTHROUGHS_BY_FACTION[player.faction];
  if (!breakthrough?.isExhaustable) {
    return { success: false, error: 'This breakthrough cannot be exhausted' };
  }

  player.breakthrough.exhausted = true;

  return {
    success: true,
    triggeredEvents: ['breakthrough_exhausted'],
    data: {
      playerId: player.id,
      breakthroughId: player.breakthrough.breakthroughId,
    },
  };
}

/**
 * Ready a player's breakthrough (during status phase)
 */
export function readyBreakthrough(player: PlayerState): void {
  if (player.breakthrough?.exhausted) {
    player.breakthrough.exhausted = false;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate total resources from a list of planets
 */
function calculatePlanetResources(player: PlayerState, planetIds: string[]): number {
  let total = 0;
  for (const planetId of planetIds) {
    const planet = player.planets.find((p: PlanetState) => p.planetId === planetId);
    if (planet && !planet.exhausted) {
      // We'd need planet data to get resource value
      // For now, assume 2 resources per planet as a placeholder
      total += 2;
    }
  }
  return total;
}

/**
 * Calculate total influence from a list of planets
 */
function calculatePlanetInfluence(player: PlayerState, planetIds: string[]): number {
  let total = 0;
  for (const planetId of planetIds) {
    const planet = player.planets.find((p: PlanetState) => p.planetId === planetId);
    if (planet && !planet.exhausted) {
      // We'd need planet data to get influence value
      // For now, assume 2 influence per planet as a placeholder
      total += 2;
    }
  }
  return total;
}

/**
 * Check if a player meets the tech synergy requirement for their breakthrough
 */
export function checkTechSynergy(player: PlayerState): boolean {
  const breakthrough = BREAKTHROUGHS_BY_FACTION[player.faction];
  if (!breakthrough) {
    return false;
  }

  // Nekro doesn't need synergy
  if (!breakthrough.synergy) {
    return true;
  }

  // Build tech color map
  const techColors: Record<string, 'red' | 'blue' | 'yellow' | 'green' | undefined> = {};
  for (const tech of Object.values(TECHNOLOGIES)) {
    if (tech.color) {
      techColors[tech.id] = tech.color;
    }
  }

  return hasTechSynergy(player.technologies, techColors, breakthrough.synergy);
}

/**
 * Get the number of slices a player has claimed
 */
export function getPlayerSliceCount(expedition: ExpeditionState, playerId: string): number {
  return expedition.slices.filter(s => s.claimedBy === playerId).length;
}

/**
 * Check if expedition is available to claim
 */
export function canClaimExpedition(state: GameState, playerId: string): boolean {
  if (!state.expeditionState) {
    return false;
  }

  if (state.expeditionState.completed) {
    return false;
  }

  // Player already claimed
  if (state.expeditionState.claimOrder.includes(playerId)) {
    return false;
  }

  // Check if any slice is available
  return state.expeditionState.slices.some(s => !s.claimed);
}
