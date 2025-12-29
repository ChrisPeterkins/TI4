import type { GameState, PickStrategyCardAction } from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';

/**
 * Validate strategy card selection
 */
export function validatePickStrategyCard(
  state: GameState,
  action: PickStrategyCardAction
): ValidationResult {
  // Must be in strategy phase
  if (state.phase !== 'strategy') {
    return { valid: false, error: 'Not in strategy phase' };
  }

  // Player must not already have a strategy card
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  if (player.strategyCard !== null) {
    return { valid: false, error: 'You already have a strategy card' };
  }

  // Card must exist
  const card = state.strategyCards.find(c => c.number === action.cardNumber);
  if (!card) {
    return { valid: false, error: 'Invalid strategy card number' };
  }

  // Card must not already be picked
  if (card.pickedBy !== null) {
    return { valid: false, error: 'Strategy card already taken' };
  }

  // Validate turn order (speaker picks first, then clockwise)
  if (!isCorrectPickOrder(state, action.playerId)) {
    return { valid: false, error: 'Not your turn to pick' };
  }

  return { valid: true };
}

/**
 * Check if player is next in pick order
 * Pick order: Speaker first, then clockwise by seat position
 */
function isCorrectPickOrder(state: GameState, playerId: string): boolean {
  const speakerIndex = state.players.findIndex(p => p.id === state.speakerId);
  const playerCount = state.players.length;

  // Count how many players have already picked
  const pickedCount = state.players.filter(p => p.strategyCard !== null).length;

  // Determine who should pick next (clockwise from speaker)
  const expectedPickerIndex = (speakerIndex + pickedCount) % playerCount;
  const expectedPicker = state.players[expectedPickerIndex];

  return expectedPicker?.id === playerId;
}

/**
 * Get available strategy cards
 */
export function getAvailableStrategyCards(state: GameState): number[] {
  return state.strategyCards
    .filter(c => c.pickedBy === null)
    .map(c => c.number);
}
