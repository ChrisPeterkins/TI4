import type {
  GameState,
  PassAction,
  TacticalAction,
  StrategicAction,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { findTileAtPosition } from '../utils/hex.js';

/**
 * Handle pass action
 */
export function handlePass(state: GameState, action: PassAction): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  player.passed = true;

  // Find next non-passed player
  advanceToNextActivePlayer(state);

  return {
    success: true,
    triggeredEvents: ['player_passed'],
  };
}

/**
 * Handle tactical action (system activation)
 */
export function handleTacticalAction(
  state: GameState,
  action: TacticalAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const targetTile = findTileAtPosition(state.map, action.systemPosition);
  if (!targetTile) {
    return { success: false, error: 'System not found' };
  }

  // Spend tactics command token
  player.commandTokens.tactics--;

  // Place command token in system
  targetTile.commandTokens.push(action.playerId);

  // Transition to movement sub-phase
  state.subPhase = 'tactical_movement';

  return {
    success: true,
    triggeredEvents: ['system_activated'],
  };
}

/**
 * Handle strategic action (using strategy card)
 */
export function handleStrategicAction(
  state: GameState,
  action: StrategicAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const card = state.strategyCards.find(c => c.number === action.cardNumber);
  if (!card) {
    return { success: false, error: 'Strategy card not found' };
  }

  // Mark card as used
  player.strategyCardUsed = true;
  card.exhausted = true;

  // Enter strategic primary sub-phase
  state.subPhase = 'strategic_primary';

  return {
    success: true,
    triggeredEvents: ['strategic_action_started'],
  };
}

/**
 * Complete a tactical action and advance turn
 */
export function completeTacticalAction(state: GameState): HandlerResult {
  state.subPhase = 'awaiting_action';
  advanceToNextActivePlayer(state);

  return {
    success: true,
    triggeredEvents: ['tactical_action_completed'],
  };
}

/**
 * Complete a strategic action and start secondary window
 */
export function completeStrategicPrimary(state: GameState): HandlerResult {
  state.subPhase = 'strategic_secondary';

  // Set up secondary ability resolution order
  // Players resolve in initiative order, starting after the active player

  return {
    success: true,
    triggeredEvents: ['strategic_primary_completed'],
  };
}

/**
 * Complete strategic secondary and advance turn
 */
export function completeStrategicAction(state: GameState): HandlerResult {
  state.subPhase = 'awaiting_action';
  advanceToNextActivePlayer(state);

  return {
    success: true,
    triggeredEvents: ['strategic_action_completed'],
  };
}

/**
 * Advance to the next active (non-passed) player
 */
function advanceToNextActivePlayer(state: GameState): void {
  const currentIndex = state.initiativeOrder.indexOf(state.activePlayerId);
  const playerCount = state.initiativeOrder.length;

  // Find next non-passed player in initiative order
  for (let i = 1; i <= playerCount; i++) {
    const nextIndex = (currentIndex + i) % playerCount;
    const nextPlayerId = state.initiativeOrder[nextIndex];
    const nextPlayer = state.players.find(p => p.id === nextPlayerId);

    if (nextPlayer && !nextPlayer.passed) {
      state.activePlayerId = nextPlayerId;
      return;
    }
  }

  // All players have passed - phase will auto-transition
}

/**
 * Handle movement within a tactical action
 */
export function handleMovement(
  state: GameState,
  playerId: string,
  moves: { unitId: string; toPosition: { q: number; r: number } }[]
): HandlerResult {
  // TODO: Implement full movement logic
  // - Move units between systems
  // - Check capacity constraints
  // - Handle transport of ground forces
  // - Trigger space cannon offense if entering hostile system

  return {
    success: true,
    triggeredEvents: ['units_moved'],
  };
}

/**
 * Handle production within a tactical action
 */
export function handleProduction(
  state: GameState,
  playerId: string,
  productions: { unitType: string; count: number; planetId?: string }[]
): HandlerResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // TODO: Implement full production logic
  // - Check production capacity
  // - Deduct resources
  // - Create unit instances
  // - Place units in system/on planet

  return {
    success: true,
    triggeredEvents: ['units_produced'],
  };
}
