import type {
  GameState,
  GameAction,
  RevealAgendaAction,
  CastVoteAction,
  SpeakerTiebreakAction,
  SelectInvasionTargetsAction,
  CommitGroundForcesAction,
  RollBombardmentAction,
  SkipBombardmentAction,
  AssignBombardmentHitsAction,
  AssignSpaceCannonHitsAction,
  SkipInvasionAction,
  PlayActionCardAction,
  DiscardActionCardsAction,
  ResearchTechnologyAction,
  StrategicPrimaryAction,
  StrategicSecondaryAction,
  ProposeTransactionAction,
  AcceptTransactionAction,
  DeclineTransactionAction,
  PlayPromissoryNoteAction,
} from '@ti4/shared';
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
import {
  validateAssignHits,
  validateAnnounceRetreat,
  validateAdvanceCombat,
} from './combat.js';
import {
  validateScoreObjective,
  validateSkipScoring,
  validateRedistributeTokens,
} from './status-phase.js';
import {
  validateRevealAgenda,
  validateCastVote,
  validateSpeakerTiebreak,
} from './agenda-phase.js';
import {
  validateSelectInvasionTargets,
  validateCommitGroundForces,
  validateRollBombardment,
  validateSkipBombardment,
  validateAssignBombardmentHits,
  validateAssignSpaceCannonHits,
  validateSkipInvasion,
} from './invasion.js';
import {
  validatePlayActionCard,
  validateDiscardActionCards,
} from './action-cards.js';
import { validateResearchTechnology } from './technology.js';
import {
  validateStrategicPrimary,
  validateStrategicSecondary,
} from './strategy-cards.js';
import {
  validateProposeTransaction,
  validateAcceptTransaction,
  validateDeclineTransaction,
} from './transactions.js';
import { validatePlayPromissoryNote } from './promissory-notes.js';

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

    case 'strategic_primary':
      return validateStrategicPrimary(state, action as StrategicPrimaryAction);

    case 'strategic_secondary':
      return validateStrategicSecondary(state, action as StrategicSecondaryAction);

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

    case 'advance_combat':
      return validateAdvanceCombat(state, action);

    // Status Phase
    case 'score_objective':
      return validateScoreObjective(state, action);

    case 'skip_scoring':
      return validateSkipScoring(state, action);

    case 'redistribute_tokens':
      return validateRedistributeTokens(state, action);

    // Agenda Phase
    case 'reveal_agenda':
      return validateRevealAgenda(state, action as RevealAgendaAction);

    case 'cast_vote':
      return validateCastVote(state, action as CastVoteAction);

    case 'speaker_tiebreak':
      return validateSpeakerTiebreak(state, action as SpeakerTiebreakAction);

    // Invasion
    case 'select_invasion_targets':
      return validateSelectInvasionTargets(state, action as SelectInvasionTargetsAction);

    case 'commit_ground_forces':
      return validateCommitGroundForces(state, action as CommitGroundForcesAction);

    case 'roll_bombardment':
      return validateRollBombardment(state, action as RollBombardmentAction);

    case 'skip_bombardment':
      return validateSkipBombardment(state, action as SkipBombardmentAction);

    case 'assign_bombardment_hits':
      return validateAssignBombardmentHits(state, action as AssignBombardmentHitsAction);

    case 'assign_space_cannon_hits':
      return validateAssignSpaceCannonHits(state, action as AssignSpaceCannonHitsAction);

    case 'skip_invasion':
      return validateSkipInvasion(state, action as SkipInvasionAction);

    // Action Cards
    case 'play_action_card':
      return validatePlayActionCard(state, action as PlayActionCardAction);

    case 'discard_action_cards':
      return validateDiscardActionCards(state, action as DiscardActionCardsAction);

    // Technology
    case 'research_technology':
      return validateResearchTechnology(state, action as ResearchTechnologyAction);

    // Transactions
    case 'propose_transaction':
      return validateProposeTransaction(state, action as ProposeTransactionAction);

    case 'accept_transaction':
      return validateAcceptTransaction(state, action as AcceptTransactionAction);

    case 'decline_transaction':
      return validateDeclineTransaction(state, action as DeclineTransactionAction);

    // Promissory Notes
    case 'play_promissory_note':
      return validatePlayPromissoryNote(state, action as PlayPromissoryNoteAction);

    default:
      return { valid: false, error: `Unknown action type: ${action.type}` };
  }
}

/**
 * Check if it's the player's turn
 */
function isPlayersTurn(state: GameState, action: GameAction): boolean {
  // Some actions can be taken out of turn (e.g., timing window responses, hit assignment)
  const outOfTurnActions = [
    'timing_window_response',
    'assign_hits',
    'assign_bombardment_hits',  // Defender assigns during attacker's turn
    'assign_space_cannon_hits', // Attacker assigns, but could be out of turn context
    'play_action_card',         // Some action cards can be played in response (e.g., Sabotage)
    'discard_action_cards',     // Discard to hand limit can happen during status phase
    'strategic_secondary',      // Secondary abilities are resolved by non-active players
    'propose_transaction',      // Any player can propose during action phase
    'accept_transaction',       // Target player accepts/declines
    'decline_transaction',      // Either player can decline
    'play_promissory_note',     // Some notes can be played at timing windows
  ];
  if (outOfTurnActions.includes(action.type)) {
    return true;
  }

  return state.activePlayerId === action.playerId;
}
