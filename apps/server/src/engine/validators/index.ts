import type { GameState, GameAction } from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { validatePickStrategyCard } from './strategy-phase.js';
import {
  validatePass,
  validateTacticalAction,
  validateStrategicAction,
  validateMoveUnits,
  validateSkipMovement,
  validateProduceUnits,
  validateSkipProduction,
} from './action-phase.js';

/**
 * Main action validator - routes to specific validators based on action type
 */
export function validateAction(state: GameState, action: GameAction): ValidationResult {
  // Check if it's the player's turn (for most actions)
  if (!isPlayersTurn(state, action)) {
    return { valid: false, error: 'Not your turn' };
  }

  // Route to specific validator
  switch (action.type) {
    // Strategy Phase
    case 'pick_strategy_card':
      return validatePickStrategyCard(state, action);

    // Action Phase
    case 'pass':
      return validatePass(state, action);

    case 'tactical_action':
      return validateTacticalAction(state, action);

    case 'strategic_action':
      return validateStrategicAction(state, action);

    // Tactical Sub-phases
    case 'move_units':
      return validateMoveUnits(state, action);

    case 'skip_movement':
      return validateSkipMovement(state, action);

    case 'produce_units':
      return validateProduceUnits(state, action);

    case 'skip_production':
      return validateSkipProduction(state, action);

    // Combat
    case 'assign_hits':
      return validateAssignHits(state, action);

    case 'announce_retreat':
      return validateAnnounceRetreat(state, action);

    // Agenda
    case 'vote':
      return validateVote(state, action);

    default:
      return { valid: false, error: `Unknown action type: ${action.type}` };
  }
}

/**
 * Check if it's the player's turn
 */
function isPlayersTurn(state: GameState, action: GameAction): boolean {
  // Some actions can be taken out of turn (e.g., timing window responses)
  const outOfTurnActions = ['timing_window_response', 'assign_hits'];
  if (outOfTurnActions.includes(action.type)) {
    return true;
  }

  return state.activePlayerId === action.playerId;
}

/**
 * Placeholder validators - to be implemented
 */
function validateAssignHits(state: GameState, action: GameAction): ValidationResult {
  if (!state.activeCombat) {
    return { valid: false, error: 'No active combat' };
  }

  // TODO: Validate hit assignment
  return { valid: true };
}

function validateAnnounceRetreat(state: GameState, action: GameAction): ValidationResult {
  if (!state.activeCombat) {
    return { valid: false, error: 'No active combat' };
  }

  if (state.activeCombat.state !== 'announce_retreat') {
    return { valid: false, error: 'Cannot announce retreat at this time' };
  }

  return { valid: true };
}

function validateVote(state: GameState, action: GameAction): ValidationResult {
  if (state.phase !== 'agenda') {
    return { valid: false, error: 'Not in agenda phase' };
  }

  if (!state.agendas.currentAgenda) {
    return { valid: false, error: 'No active agenda' };
  }

  return { valid: true };
}
