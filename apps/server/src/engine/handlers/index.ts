import type { GameState, GameAction } from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { handlePickStrategyCard } from './strategy-phase.js';
import { handlePass, handleTacticalAction, handleStrategicAction } from './action-phase.js';

/**
 * Main action handler - routes to specific handlers based on action type
 * Handlers mutate the game state directly
 */
export function handleAction(state: GameState, action: GameAction): HandlerResult {
  switch (action.type) {
    // Strategy Phase
    case 'pick_strategy_card':
      return handlePickStrategyCard(state, action);

    // Action Phase
    case 'pass':
      return handlePass(state, action);

    case 'tactical_action':
      return handleTacticalAction(state, action);

    case 'strategic_action':
      return handleStrategicAction(state, action);

    // Combat
    case 'assign_hits':
      return handleAssignHits(state, action);

    case 'announce_retreat':
      return handleAnnounceRetreat(state, action);

    // Agenda
    case 'vote':
      return handleVote(state, action);

    default:
      return { success: false, error: `No handler for action type: ${action.type}` };
  }
}

/**
 * Placeholder handlers - to be fully implemented
 */
function handleAssignHits(state: GameState, action: GameAction): HandlerResult {
  // TODO: Implement hit assignment
  return { success: true, triggeredEvents: ['hits_assigned'] };
}

function handleAnnounceRetreat(state: GameState, action: GameAction): HandlerResult {
  // TODO: Implement retreat announcement
  return { success: true, triggeredEvents: ['retreat_announced'] };
}

function handleVote(state: GameState, action: GameAction): HandlerResult {
  // TODO: Implement voting
  return { success: true, triggeredEvents: ['vote_cast'] };
}
