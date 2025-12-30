import type {
  GameState,
  RevealAgendaAction,
  CastVoteAction,
  SpeakerTiebreakAction,
} from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import {
  getValidOutcomes,
  tallyVotes,
  determineWinner,
} from '../utils/agenda.js';

// =============================================================================
// REVEAL AGENDA VALIDATOR
// =============================================================================

/**
 * Validate revealing an agenda card.
 * Only the speaker can reveal, and only in the correct step.
 */
export function validateRevealAgenda(
  state: GameState,
  action: RevealAgendaAction
): ValidationResult {
  // Must be in agenda phase
  if (state.phase !== 'agenda') {
    return { valid: false, error: 'Not in agenda phase' };
  }

  // Must be in reveal_agenda step
  if (state.subPhase !== 'reveal_agenda') {
    return { valid: false, error: 'Not in reveal agenda step' };
  }

  // Only speaker can reveal
  if (action.playerId !== state.speakerId) {
    return { valid: false, error: 'Only the speaker can reveal agendas' };
  }

  // Check that agenda deck is not empty (or discard can be reshuffled)
  if (state.agendaDeck.length === 0 && state.agendaDiscard.length === 0) {
    return { valid: false, error: 'No agendas remaining in deck or discard' };
  }

  return { valid: true };
}

// =============================================================================
// CAST VOTE VALIDATOR
// =============================================================================

/**
 * Validate casting a vote on the current agenda.
 * Checks turn order, planet ownership, and valid outcomes.
 */
export function validateCastVote(
  state: GameState,
  action: CastVoteAction
): ValidationResult {
  // Must be in agenda phase
  if (state.phase !== 'agenda') {
    return { valid: false, error: 'Not in agenda phase' };
  }

  // Must be in voting step
  if (state.subPhase !== 'voting') {
    return { valid: false, error: 'Not in voting step' };
  }

  // Agenda phase must be initialized
  if (!state.agendaPhase) {
    return { valid: false, error: 'Agenda phase not initialized' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be this player's turn to vote
  const expectedVoter = state.agendaPhase.votingOrder[state.agendaPhase.currentVoterIndex];
  if (action.playerId !== expectedVoter) {
    return { valid: false, error: 'Not your turn to vote' };
  }

  // Player must not have already voted on this agenda
  if (state.agendaPhase.votingComplete.includes(action.playerId)) {
    return { valid: false, error: 'Already voted on this agenda' };
  }

  // If not abstaining, validate outcome and planets
  if (!action.abstain) {
    // Validate outcome is valid for this election type
    const validOutcomes = getValidOutcomes(state, state.agendaPhase.currentElectionType);
    if (!validOutcomes.includes(action.outcome)) {
      return { valid: false, error: `Invalid outcome: ${action.outcome}` };
    }

    // Validate player controls all specified planets
    for (const planetId of action.exhaustedPlanets) {
      const planetState = player.planets.find(p => p.planetId === planetId);
      if (!planetState) {
        return { valid: false, error: `You do not control planet: ${planetId}` };
      }
      if (planetState.exhausted) {
        return { valid: false, error: `Planet is already exhausted: ${planetId}` };
      }
    }
  }

  return { valid: true };
}

// =============================================================================
// SPEAKER TIEBREAK VALIDATOR
// =============================================================================

/**
 * Validate speaker breaking a tie.
 * Only the speaker can break ties, and only when outcomes are actually tied.
 */
export function validateSpeakerTiebreak(
  state: GameState,
  action: SpeakerTiebreakAction
): ValidationResult {
  // Must be in agenda phase
  if (state.phase !== 'agenda') {
    return { valid: false, error: 'Not in agenda phase' };
  }

  // Must be in speaker_tiebreak step
  if (state.subPhase !== 'speaker_tiebreak') {
    return { valid: false, error: 'Not in tiebreak step' };
  }

  // Agenda phase must be initialized
  if (!state.agendaPhase) {
    return { valid: false, error: 'Agenda phase not initialized' };
  }

  // Only speaker can break ties
  if (action.playerId !== state.speakerId) {
    return { valid: false, error: 'Only the speaker can break ties' };
  }

  // Validate the chosen outcome was actually tied
  const tallies = tallyVotes(state.agendaPhase.votes);
  const { tied } = determineWinner(tallies);

  if (tied.length < 2) {
    return { valid: false, error: 'There is no tie to break' };
  }

  if (!tied.includes(action.chosenOutcome)) {
    return { valid: false, error: `${action.chosenOutcome} was not one of the tied outcomes` };
  }

  return { valid: true };
}
