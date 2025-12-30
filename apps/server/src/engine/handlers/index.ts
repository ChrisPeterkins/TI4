import type {
  GameState,
  GameAction,
  AssignHitsAction,
  AnnounceRetreatAction,
  ScoreObjectiveAction,
  SkipScoringAction,
  RedistributeTokensAction,
  CastVoteAction,
  SpeakerTiebreakAction,
  SelectInvasionTargetsAction,
  CommitGroundForcesAction,
  RollBombardmentAction,
  SkipBombardmentAction,
  AssignBombardmentHitsAction,
  AssignSpaceCannonHitsAction,
  SkipInvasionAction,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { handlePickStrategyCard } from './strategy-phase.js';
import {
  handlePass,
  handleTacticalAction,
  handleStrategicAction,
  handleMoveUnits,
  handleSkipMovement,
  handleProduceUnits,
  handleSkipProduction,
} from './action-phase.js';
import {
  handleAssignHits,
  handleAnnounceRetreat,
  advanceCombatState,
} from './combat.js';
import {
  handleScoreObjective,
  handleSkipScoring,
  handleRedistributeTokens,
} from './status-phase.js';
import {
  handleRevealAgenda,
  handleCastVote,
  handleSpeakerTiebreak,
} from './agenda-phase.js';
import {
  handleSelectInvasionTargets,
  handleCommitGroundForces,
  handleRollBombardment,
  handleSkipBombardment,
  handleAssignBombardmentHits,
  handleAssignSpaceCannonHits,
  handleSkipInvasion,
} from './invasion.js';

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

    // Tactical Sub-phases
    case 'move_units':
      return handleMoveUnits(state, action);

    case 'skip_movement':
      return handleSkipMovement(state, action);

    case 'produce_units':
      return handleProduceUnits(state, action);

    case 'skip_production':
      return handleSkipProduction(state, action);

    // Combat
    case 'assign_hits':
      return handleAssignHits(state, action as AssignHitsAction);

    case 'announce_retreat':
      return handleAnnounceRetreat(state, action as AnnounceRetreatAction);

    case 'advance_combat':
      return advanceCombatState(state);

    // Status Phase
    case 'score_objective':
      return handleScoreObjective(state, action as ScoreObjectiveAction);

    case 'skip_scoring':
      return handleSkipScoring(state, action as SkipScoringAction);

    case 'redistribute_tokens':
      return handleRedistributeTokens(state, action as RedistributeTokensAction);

    // Agenda Phase
    case 'reveal_agenda':
      return handleRevealAgenda(state, action.playerId);

    case 'cast_vote':
      return handleCastVote(state, action as CastVoteAction);

    case 'speaker_tiebreak':
      return handleSpeakerTiebreak(state, action as SpeakerTiebreakAction);

    // Invasion
    case 'select_invasion_targets':
      return handleSelectInvasionTargets(state, action as SelectInvasionTargetsAction);

    case 'commit_ground_forces':
      return handleCommitGroundForces(state, action as CommitGroundForcesAction);

    case 'roll_bombardment':
      return handleRollBombardment(state, action as RollBombardmentAction);

    case 'skip_bombardment':
      return handleSkipBombardment(state, action as SkipBombardmentAction);

    case 'assign_bombardment_hits':
      return handleAssignBombardmentHits(state, action as AssignBombardmentHitsAction);

    case 'assign_space_cannon_hits':
      return handleAssignSpaceCannonHits(state, action as AssignSpaceCannonHitsAction);

    case 'skip_invasion':
      return handleSkipInvasion(state, action as SkipInvasionAction);

    default:
      return { success: false, error: `No handler for action type: ${action.type}` };
  }
}
