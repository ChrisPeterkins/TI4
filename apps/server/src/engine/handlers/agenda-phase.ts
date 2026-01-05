import type {
  GameState,
  CastVoteAction,
  SpeakerTiebreakAction,
  PlayRiderAction,
  AgendaPhaseState,
  UUID,
  RiderRecord,
} from '@ti4/shared';
import { AGENDAS_BY_ID, ACTION_CARDS_BY_ID, isRiderCard } from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import {
  calculateVotingOrder,
  calculateVotesFromPlanets,
  tallyVotes,
  determineWinner,
  getValidOutcomes,
} from '../utils/agenda.js';
import { checkTimingTrigger } from './timing-windows.js';
import { removeCard, hasCard, discardCards } from '../utils/deck.js';
import { handleDrawActionCards } from './action-cards.js';

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the agenda phase tracking structure.
 * Called when entering the agenda phase after status phase (when custodians taken).
 */
export function initializeAgendaPhase(state: GameState): void {
  state.phase = 'agenda';
  state.subPhase = 'reveal_agenda';

  // Calculate voting order: left of speaker → clockwise → speaker last
  const votingOrder = calculateVotingOrder(state.players, state.speakerId);

  state.agendaPhase = {
    currentStep: 'reveal_agenda',
    agendaNumber: 1,
    currentAgendaId: null,
    currentAgendaType: null,
    currentElectionType: null,
    votingOrder,
    currentVoterIndex: 0,
    votingComplete: [],
    votes: {},
    voteTallies: {},
    riders: [],
    vetoed: false,
    electedOutcome: null,
    electedPlayer: null,
    electedPlanet: null,
  };

  // Speaker controls agenda phase (reveals agendas)
  state.activePlayerId = state.speakerId;
}

// =============================================================================
// MAIN HANDLERS
// =============================================================================

/**
 * Handle revealing an agenda card.
 * Speaker draws the top agenda and it becomes the current agenda.
 */
export function handleRevealAgenda(
  state: GameState,
  _playerId: UUID
): HandlerResult {
  if (!state.agendaPhase) {
    return { success: false, error: 'Agenda phase not initialized' };
  }

  // Draw the top agenda from the deck
  if (state.agendaDeck.length === 0) {
    // Reshuffle discard into deck
    if (state.agendaDiscard.length === 0) {
      return { success: false, error: 'No agendas available' };
    }
    state.agendaDeck = [...state.agendaDiscard];
    state.agendaDiscard = [];
    shuffleArray(state.agendaDeck);
  }

  const agendaId = state.agendaDeck.shift()!;
  const agenda = AGENDAS_BY_ID[agendaId];

  if (!agenda) {
    return { success: false, error: `Agenda not found: ${agendaId}` };
  }

  // Set current agenda
  state.agendaPhase.currentAgendaId = agendaId;
  state.agendaPhase.currentAgendaType = agenda.type;
  state.agendaPhase.currentElectionType = agenda.electionType;

  // Reset voting state for this agenda
  state.agendaPhase.votes = {};
  state.agendaPhase.voteTallies = {};
  state.agendaPhase.votingComplete = [];
  state.agendaPhase.currentVoterIndex = 0;
  state.agendaPhase.vetoed = false;
  state.agendaPhase.electedOutcome = null;
  state.agendaPhase.electedPlayer = null;
  state.agendaPhase.electedPlanet = null;

  // Update step to "when revealed"
  state.agendaPhase.currentStep = 'when_revealed';
  state.subPhase = 'when_revealed';

  // Trigger timing window for "when agenda revealed"
  const triggeredEvents: string[] = ['agenda_revealed'];
  const data: Record<string, unknown> = {
    agendaId,
    agendaType: agenda.type,
    electionType: agenda.electionType,
  };

  const whenRevealedResult = checkTimingTrigger(state, 'agenda_revealed', {
    agendaId,
    additionalData: {
      agendaType: agenda.type,
      electionType: agenda.electionType,
    },
  });

  if (whenRevealedResult.triggeredEvents?.includes('timing_window_opened')) {
    triggeredEvents.push('timing_window_opened');
    if (whenRevealedResult.data) {
      data.timingWindow = whenRevealedResult.data;
    }
  } else {
    // No one can respond to when_revealed, move to after_revealed
    const afterRevealedResult = checkTimingTrigger(state, 'after_agenda_revealed', {
      agendaId,
      additionalData: {
        agendaType: agenda.type,
        electionType: agenda.electionType,
      },
    });

    if (afterRevealedResult.triggeredEvents?.includes('timing_window_opened')) {
      triggeredEvents.push('timing_window_opened');
      state.agendaPhase.currentStep = 'after_revealed';
      state.subPhase = 'after_revealed';
      if (afterRevealedResult.data) {
        data.timingWindow = afterRevealedResult.data;
      }
    } else {
      // No one can respond to after_revealed either, advance to voting
      advanceToVoting(state);
    }
  }

  return {
    success: true,
    triggeredEvents,
    data,
  };
}

/**
 * Handle a player casting their vote.
 * Exhausts specified planets to gain influence votes.
 */
export function handleCastVote(
  state: GameState,
  action: CastVoteAction
): HandlerResult {
  if (!state.agendaPhase) {
    return { success: false, error: 'Agenda phase not initialized' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Validate it's this player's turn to vote
  const expectedVoter = state.agendaPhase.votingOrder[state.agendaPhase.currentVoterIndex];
  if (action.playerId !== expectedVoter) {
    return { success: false, error: 'Not your turn to vote' };
  }

  // Handle abstaining
  if (action.abstain) {
    state.agendaPhase.votes[action.playerId] = {
      outcome: '',
      votes: 0,
      extraVotes: 0,
      abstained: true,
      exhaustedPlanets: [],
    };
  } else {
    // Validate outcome
    const validOutcomes = getValidOutcomes(state, state.agendaPhase.currentElectionType);
    if (!validOutcomes.includes(action.outcome)) {
      return { success: false, error: `Invalid outcome: ${action.outcome}` };
    }

    // Validate and exhaust planets
    for (const planetId of action.exhaustedPlanets) {
      const planetState = player.planets.find(p => p.planetId === planetId);
      if (!planetState) {
        return { success: false, error: `Planet not controlled: ${planetId}` };
      }
      if (planetState.exhausted) {
        return { success: false, error: `Planet already exhausted: ${planetId}` };
      }
    }

    // Exhaust the planets
    for (const planetId of action.exhaustedPlanets) {
      const planetState = player.planets.find(p => p.planetId === planetId);
      if (planetState) {
        planetState.exhausted = true;
      }
    }

    // Calculate votes from exhausted planets
    const votes = calculateVotesFromPlanets(action.exhaustedPlanets);

    // Record the vote
    state.agendaPhase.votes[action.playerId] = {
      outcome: action.outcome,
      votes,
      extraVotes: 0, // MVP: No extra votes from abilities
      abstained: false,
      exhaustedPlanets: action.exhaustedPlanets,
    };
  }

  // Mark player as voted
  if (!state.agendaPhase.votingComplete.includes(action.playerId)) {
    state.agendaPhase.votingComplete.push(action.playerId);
  }

  // Advance to next voter or tally
  advanceVoting(state);

  return {
    success: true,
    triggeredEvents: ['vote_cast'],
  };
}

/**
 * Handle speaker tiebreak when outcomes are tied.
 * Speaker chooses from the tied outcomes.
 */
export function handleSpeakerTiebreak(
  state: GameState,
  action: SpeakerTiebreakAction
): HandlerResult {
  if (!state.agendaPhase) {
    return { success: false, error: 'Agenda phase not initialized' };
  }

  // Validate speaker is making this choice
  if (action.playerId !== state.speakerId) {
    return { success: false, error: 'Only the speaker can break ties' };
  }

  // Validate we're in tiebreak state
  if (state.agendaPhase.currentStep !== 'speaker_tiebreak') {
    return { success: false, error: 'Not in tiebreak state' };
  }

  // Get the tied outcomes
  const tallies = tallyVotes(state.agendaPhase.votes);
  const { tied } = determineWinner(tallies);

  // Validate chosen outcome was actually tied
  if (!tied.includes(action.chosenOutcome)) {
    return { success: false, error: 'Chosen outcome was not tied' };
  }

  // Set the winner
  state.agendaPhase.electedOutcome = action.chosenOutcome;

  // Handle player/planet elections
  if (state.agendaPhase.currentElectionType === 'player') {
    state.agendaPhase.electedPlayer = action.chosenOutcome as UUID;
  } else if (state.agendaPhase.currentElectionType === 'planet') {
    state.agendaPhase.electedPlanet = action.chosenOutcome;
  }

  // Move to resolve outcome
  advanceToResolveOutcome(state);

  return {
    success: true,
    triggeredEvents: ['tiebreak_resolved'],
  };
}

/**
 * Handle playing a rider card during agenda phase.
 * Players can play riders after an agenda is revealed.
 * They predict an outcome and cannot vote on this agenda.
 */
export function handlePlayRider(
  state: GameState,
  action: PlayRiderAction
): HandlerResult {
  if (!state.agendaPhase) {
    return { success: false, error: 'Agenda phase not initialized' };
  }

  // Can only play riders during the "after_revealed" step
  if (
    state.agendaPhase.currentStep !== 'when_revealed' &&
    state.agendaPhase.currentStep !== 'after_revealed'
  ) {
    return { success: false, error: 'Can only play riders after agenda is revealed' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Validate card is a rider
  if (!isRiderCard(action.cardId)) {
    return { success: false, error: 'Card is not a rider' };
  }

  // Check player has the card
  if (!hasCard(player.actionCards, action.cardId)) {
    return { success: false, error: 'Player does not have this card' };
  }

  // Validate prediction is a valid outcome for this agenda
  const validOutcomes = getValidOutcomes(state, state.agendaPhase.currentElectionType);
  if (!validOutcomes.includes(action.prediction)) {
    return { success: false, error: `Invalid prediction: ${action.prediction}` };
  }

  // Check player hasn't already played a rider
  const alreadyPlayed = state.agendaPhase.riders.some(
    r => r.playerId === action.playerId && !r.resolved
  );
  if (alreadyPlayed) {
    return { success: false, error: 'You have already played a rider on this agenda' };
  }

  // Remove card from player's hand
  player.actionCards = removeCard(player.actionCards, action.cardId);

  // Add to discard pile
  state.actionCardDiscard = discardCards(state.actionCardDiscard, [action.cardId]);

  // Record the rider
  const riderRecord: RiderRecord = {
    playerId: action.playerId,
    cardId: action.cardId,
    prediction: action.prediction,
    resolved: false,
    success: false,
  };
  state.agendaPhase.riders.push(riderRecord);

  const cardData = ACTION_CARDS_BY_ID[action.cardId];

  return {
    success: true,
    triggeredEvents: ['rider_played'],
    data: {
      playerId: action.playerId,
      cardId: action.cardId,
      cardName: cardData?.name || action.cardId,
      prediction: action.prediction,
    },
  };
}

// =============================================================================
// STEP TRANSITIONS
// =============================================================================

/**
 * Advance to voting step.
 * Sets first voter and updates state.
 * Skips players who have played riders (they cannot vote).
 */
function advanceToVoting(state: GameState): void {
  if (!state.agendaPhase) return;

  state.agendaPhase.currentStep = 'voting';
  state.subPhase = 'voting';
  state.agendaPhase.currentVoterIndex = 0;

  // Get players who played riders - they automatically abstain
  const riderPlayerIds = state.agendaPhase.riders.map(r => r.playerId);

  // Mark rider players as having voted (abstained)
  for (const playerId of riderPlayerIds) {
    if (!state.agendaPhase.votingComplete.includes(playerId)) {
      state.agendaPhase.votingComplete.push(playerId);
      // Record as abstained due to rider
      state.agendaPhase.votes[playerId] = {
        outcome: '',
        votes: 0,
        extraVotes: 0,
        abstained: true,
        exhaustedPlanets: [],
      };
    }
  }

  // Find first voter who hasn't played a rider
  while (state.agendaPhase.currentVoterIndex < state.agendaPhase.votingOrder.length) {
    const voter = state.agendaPhase.votingOrder[state.agendaPhase.currentVoterIndex];
    if (!riderPlayerIds.includes(voter)) {
      state.activePlayerId = voter;
      return;
    }
    state.agendaPhase.currentVoterIndex++;
  }

  // All players have riders or have voted - tally votes
  if (state.agendaPhase.votingComplete.length >= state.agendaPhase.votingOrder.length) {
    tallyAndResolve(state);
  }
}

/**
 * Advance voting to next player or tally votes.
 * Skips players who played riders.
 */
function advanceVoting(state: GameState): void {
  if (!state.agendaPhase) return;

  // Get players who played riders - they cannot vote
  const riderPlayerIds = state.agendaPhase.riders.map(r => r.playerId);

  // Get Nekro player ID - Nekro cannot vote (GALACTIC THREAT ability)
  const nekroPlayer = state.players.find(p => p.faction === 'nekro');
  const nekroPlayerId = nekroPlayer?.id;

  // Check if all players have voted (excluding those who can't vote)
  const cannotVoteIds = new Set([...riderPlayerIds]);
  if (nekroPlayerId) cannotVoteIds.add(nekroPlayerId);

  const eligibleVoters = state.agendaPhase.votingOrder.filter(id => !cannotVoteIds.has(id));
  const votedCount = state.agendaPhase.votingComplete.filter(id => eligibleVoters.includes(id)).length;

  if (votedCount >= eligibleVoters.length) {
    // All eligible voters have voted - tally and determine outcome
    tallyAndResolve(state);
    return;
  }

  // Move to next voter
  state.agendaPhase.currentVoterIndex++;

  // Find next player who hasn't voted, hasn't played a rider, and is not Nekro
  while (state.agendaPhase.currentVoterIndex < state.agendaPhase.votingOrder.length) {
    const nextVoter = state.agendaPhase.votingOrder[state.agendaPhase.currentVoterIndex];
    const canVote = !state.agendaPhase.votingComplete.includes(nextVoter) &&
                    !riderPlayerIds.includes(nextVoter) &&
                    nextVoter !== nekroPlayerId;
    if (canVote) {
      state.activePlayerId = nextVoter;
      return;
    }
    state.agendaPhase.currentVoterIndex++;
  }

  // All voted - tally
  tallyAndResolve(state);
}

/**
 * Tally votes and determine if there's a winner or tie.
 */
function tallyAndResolve(state: GameState): void {
  if (!state.agendaPhase) return;

  // Tally all votes
  const tallies = tallyVotes(state.agendaPhase.votes);
  state.agendaPhase.voteTallies = tallies;

  // Determine winner
  const { winner, tied } = determineWinner(tallies);

  if (winner !== null) {
    // Clear winner - resolve outcome
    state.agendaPhase.electedOutcome = winner;

    // Handle player/planet elections
    if (state.agendaPhase.currentElectionType === 'player') {
      state.agendaPhase.electedPlayer = winner as UUID;
    } else if (state.agendaPhase.currentElectionType === 'planet') {
      state.agendaPhase.electedPlanet = winner;
    }

    advanceToResolveOutcome(state);
  } else if (tied.length > 1) {
    // Tie - speaker must break
    state.agendaPhase.currentStep = 'speaker_tiebreak';
    state.subPhase = 'speaker_tiebreak';
    state.activePlayerId = state.speakerId;
  } else {
    // No votes cast - agenda fails (or defaults to negative outcome for for/against)
    if (state.agendaPhase.currentElectionType === 'for_against') {
      state.agendaPhase.electedOutcome = 'against';
    } else {
      state.agendaPhase.electedOutcome = null;
    }
    advanceToResolveOutcome(state);
  }
}

/**
 * Advance to resolve outcome step.
 */
function advanceToResolveOutcome(state: GameState): void {
  if (!state.agendaPhase) return;

  state.agendaPhase.currentStep = 'resolve_outcome';
  state.subPhase = 'resolve_outcome';
  state.activePlayerId = state.speakerId;

  // Apply the outcome
  applyAgendaOutcome(state);

  // Resolve riders - check predictions and apply rewards
  resolveRiders(state);

  // Move agenda to discard
  if (state.agendaPhase.currentAgendaId) {
    // Only discard directives - laws stay in play
    if (state.agendaPhase.currentAgendaType === 'directive') {
      state.agendaDiscard.push(state.agendaPhase.currentAgendaId);
    }
  }

  // Auto-advance to next agenda or complete phase
  advanceToNextAgenda(state);
}

/**
 * Resolve all riders for the current agenda.
 * Check predictions against outcome and apply rewards.
 */
function resolveRiders(state: GameState): void {
  if (!state.agendaPhase) return;

  const outcome = state.agendaPhase.electedOutcome;

  for (const rider of state.agendaPhase.riders) {
    if (rider.resolved) continue;

    rider.resolved = true;
    rider.success = rider.prediction === outcome;

    if (!rider.success) continue;

    // Apply rider reward based on card type
    const player = state.players.find(p => p.id === rider.playerId);
    if (!player) continue;

    switch (rider.cardId) {
      case 'imperial_rider':
        // Gain 1 victory point
        player.score += 1;
        break;

      case 'construction_rider':
        // Place 1 PDS or 1 space dock on a planet you control
        // Note: This requires player choice, so we mark it pending
        // For now, we just flag it as successful - UI will handle choice
        break;

      case 'diplomacy_rider':
        // Choose 1 system with your planet, other players place command token
        // Requires player choice - UI will handle
        break;

      case 'leadership_rider':
        // Gain 3 command tokens
        player.commandTokens.tactics += 1;
        player.commandTokens.fleet += 1;
        player.commandTokens.strategy += 1;
        break;

      case 'politics_rider':
        // Draw 3 action cards and become speaker
        handleDrawActionCards(state, rider.playerId, 3);
        state.speakerId = rider.playerId;
        break;

      case 'technology_rider':
        // Research 1 technology
        // Requires player choice - UI will handle
        break;

      case 'trade_rider':
        // Gain 5 trade goods
        player.tradeGoods += 5;
        break;

      case 'warfare_rider':
        // Place 1 cruiser, 1 destroyer, 1 fighter in a system with your ships
        // Requires player choice - UI will handle
        break;
    }
  }
}

/**
 * Apply the agenda outcome (laws persist, directives are one-time).
 */
function applyAgendaOutcome(state: GameState): void {
  if (!state.agendaPhase || !state.agendaPhase.currentAgendaId) return;

  const agenda = AGENDAS_BY_ID[state.agendaPhase.currentAgendaId];
  if (!agenda) return;

  const outcome = state.agendaPhase.electedOutcome;
  if (!outcome) return;

  // For laws, add to active laws if passed
  if (agenda.type === 'law') {
    // For "for/against" agendas, "for" means it passes
    const passed = agenda.electionType === 'for_against'
      ? outcome === 'for'
      : true; // Elect agendas always "pass" with their elected target

    if (passed) {
      state.laws.push({
        cardId: state.agendaPhase.currentAgendaId,
        electedPlayer: state.agendaPhase.electedPlayer ?? undefined,
        electedPlanet: state.agendaPhase.electedPlanet ?? undefined,
        electedOutcome: outcome,
      });
    }
  }

  // MVP: Directive effects would be applied here
  // For now, directives are just discarded after resolution
}

/**
 * Advance to next agenda or complete the phase.
 */
function advanceToNextAgenda(state: GameState): void {
  if (!state.agendaPhase) return;

  if (state.agendaPhase.agendaNumber < 2) {
    // Move to agenda 2
    state.agendaPhase.agendaNumber = 2;
    state.agendaPhase.currentStep = 'reveal_agenda';
    state.subPhase = 'reveal_agenda';
    state.agendaPhase.currentAgendaId = null;
    state.agendaPhase.currentAgendaType = null;
    state.agendaPhase.currentElectionType = null;
    state.agendaPhase.votes = {};
    state.agendaPhase.voteTallies = {};
    state.agendaPhase.votingComplete = [];
    state.agendaPhase.currentVoterIndex = 0;
    state.agendaPhase.electedOutcome = null;
    state.agendaPhase.electedPlayer = null;
    state.agendaPhase.electedPlanet = null;
    state.agendaPhase.riders = []; // Clear riders for next agenda

    // Speaker reveals next agenda
    state.activePlayerId = state.speakerId;
  } else {
    // Both agendas complete - end phase
    completeAgendaPhase(state);
  }
}

/**
 * Complete the agenda phase.
 * Ready all planets and transition to strategy phase (new round).
 */
function completeAgendaPhase(state: GameState): void {
  // Ready all planets (this happens at the end of agenda phase)
  readyAllPlanets(state);

  // Clear agenda phase tracking
  state.agendaPhase = undefined;
  state.subPhase = undefined;

  // Transition to strategy phase (new round begins)
  state.phase = 'strategy';
  state.activePlayerId = state.speakerId;

  // Note: Round is NOT incremented here - it was already incremented in status phase
}

/**
 * Ready all exhausted planets for all players.
 */
function readyAllPlanets(state: GameState): void {
  for (const player of state.players) {
    for (const planet of player.planets) {
      planet.exhausted = false;
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Fisher-Yates shuffle for agenda deck
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Get current agenda phase info for the frontend.
 */
export function getAgendaPhaseInfo(state: GameState): {
  agendaNumber: 1 | 2;
  currentStep: AgendaPhaseState;
  currentAgendaId: string | null;
  currentAgendaType: 'law' | 'directive' | null;
  currentElectionType: 'for_against' | 'player' | 'planet' | 'scored_secret' | 'law' | 'strategy_card' | 'custom' | null;
  votingOrder: UUID[];
  currentVoter: UUID | null;
  votingComplete: UUID[];
  voteTallies: Record<string, number>;
  electedOutcome: string | null;
} | null {
  if (!state.agendaPhase || state.phase !== 'agenda') {
    return null;
  }

  const currentVoter = state.agendaPhase.currentVoterIndex < state.agendaPhase.votingOrder.length
    ? state.agendaPhase.votingOrder[state.agendaPhase.currentVoterIndex]
    : null;

  return {
    agendaNumber: state.agendaPhase.agendaNumber,
    currentStep: state.agendaPhase.currentStep,
    currentAgendaId: state.agendaPhase.currentAgendaId,
    currentAgendaType: state.agendaPhase.currentAgendaType,
    currentElectionType: state.agendaPhase.currentElectionType,
    votingOrder: state.agendaPhase.votingOrder,
    currentVoter,
    votingComplete: state.agendaPhase.votingComplete,
    voteTallies: state.agendaPhase.voteTallies,
    electedOutcome: state.agendaPhase.electedOutcome,
  };
}
