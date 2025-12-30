import type {
  GameState,
  ScoreObjectiveAction,
  SkipScoringAction,
  RedistributeTokensAction,
  StatusPhaseState,
  UUID,
} from '@ti4/shared';
import { OBJECTIVES_BY_ID } from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import {
  checkObjectiveRequirement,
  controlsHomeSystem,
  getScorableObjectives,
} from '../utils/objectives.js';
import { systems } from '@ti4/game-data';
import { getStatusPhaseTokenGain } from '../abilities/fleet-modifiers.js';

// =============================================================================
// STATUS PHASE STEP DEFINITIONS
// =============================================================================

const STATUS_PHASE_STEPS: StatusPhaseState[] = [
  'score_objectives',
  'reveal_public_objective',
  'draw_action_cards',
  'remove_command_tokens',
  'gain_redistribute_tokens',
  'ready_cards',
  'repair_units',
  'return_strategy_cards',
];

// =============================================================================
// MAIN HANDLERS
// =============================================================================

/**
 * Handle scoring an objective (public or secret)
 * Players can score up to 1 public and 1 secret objective per status phase
 */
export function handleScoreObjective(
  state: GameState,
  action: ScoreObjectiveAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const objective = OBJECTIVES_BY_ID[action.objectiveId];
  if (!objective) {
    return { success: false, error: 'Objective not found' };
  }

  // Verify the objective can be scored
  const result = checkObjectiveRequirement(state, action.playerId, action.objectiveId, action.spentResources);
  if (!result.canScore) {
    return { success: false, error: result.reason || 'Cannot score this objective' };
  }

  // Check if player already scored this type this phase
  const tracking = state.statusPhase;
  if (tracking) {
    const playerScoring = tracking.scoredThisPhase.find(s => s.playerId === action.playerId);
    if (playerScoring) {
      if (action.objectiveType === 'public' && playerScoring.publicObjective) {
        return { success: false, error: 'Already scored a public objective this phase' };
      }
      if (action.objectiveType === 'secret' && playerScoring.secretObjective) {
        return { success: false, error: 'Already scored a secret objective this phase' };
      }
    }
  }

  // Apply spent resources if this is a "spend" objective
  if (action.spentResources) {
    applySpentResources(state, action.playerId, action.spentResources);
  }

  // Score the objective
  player.scoredObjectives.push(action.objectiveId);
  player.score += objective.points;

  // Update objective instance's scoredBy
  if (action.objectiveType === 'public') {
    const publicObj = [...state.objectives.publicStageI, ...state.objectives.publicStageII]
      .find(o => o.id === action.objectiveId);
    if (publicObj) {
      publicObj.scoredBy.push(action.playerId);
    }
  }

  // Track what was scored this phase
  if (state.statusPhase) {
    const existing = state.statusPhase.scoredThisPhase.find(s => s.playerId === action.playerId);
    if (existing) {
      if (action.objectiveType === 'public') {
        existing.publicObjective = action.objectiveId;
      } else {
        existing.secretObjective = action.objectiveId;
      }
    } else {
      state.statusPhase.scoredThisPhase.push({
        playerId: action.playerId,
        publicObjective: action.objectiveType === 'public' ? action.objectiveId : undefined,
        secretObjective: action.objectiveType === 'secret' ? action.objectiveId : undefined,
      });
    }
  }

  return {
    success: true,
    triggeredEvents: ['objective_scored'],
  };
}

/**
 * Handle skipping objective scoring
 * Player can skip public, secret, or both
 */
export function handleSkipScoring(
  state: GameState,
  action: SkipScoringAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Mark player as done with scoring
  if (state.statusPhase) {
    if (!state.statusPhase.scoringComplete.includes(action.playerId)) {
      state.statusPhase.scoringComplete.push(action.playerId);
    }
  }

  // Check if all players are done scoring
  if (state.statusPhase && state.statusPhase.scoringComplete.length >= state.players.length) {
    // Advance to next step
    advanceStatusPhaseStep(state);
  } else {
    // Move to next player in initiative order
    advanceToNextScoringPlayer(state, action.playerId);
  }

  return {
    success: true,
    triggeredEvents: ['scoring_skipped'],
  };
}

/**
 * Handle done scoring for a player (after scoring objectives, move to next player)
 * Called after a player has scored both their public and secret (or chosen to skip)
 */
export function handleDoneScoring(
  state: GameState,
  playerId: UUID
): HandlerResult {
  if (state.statusPhase) {
    if (!state.statusPhase.scoringComplete.includes(playerId)) {
      state.statusPhase.scoringComplete.push(playerId);
    }
  }

  // Check if all players are done scoring
  if (state.statusPhase && state.statusPhase.scoringComplete.length >= state.players.length) {
    advanceStatusPhaseStep(state);
  } else {
    advanceToNextScoringPlayer(state, playerId);
  }

  return { success: true };
}

/**
 * Handle redistributing command tokens after gaining tokens
 * Base is 2 tokens, but Sol Versatile gives +1
 */
export function handleRedistributeTokens(
  state: GameState,
  action: RedistributeTokensAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Calculate current total tokens
  const currentTotal = player.commandTokens.tactics +
                       player.commandTokens.fleet +
                       player.commandTokens.strategy;

  // Get tokens to gain (base 2, Sol Versatile +1)
  const tokensToGain = getStatusPhaseTokenGain(state, action.playerId);

  // New total should be current + tokens to gain
  const newTotal = action.distribution.tactics +
                   action.distribution.fleet +
                   action.distribution.strategy;

  if (newTotal !== currentTotal + tokensToGain) {
    return {
      success: false,
      error: `Invalid token distribution. Expected ${currentTotal + tokensToGain} total, got ${newTotal}`
    };
  }

  // Validate non-negative values
  if (action.distribution.tactics < 0 ||
      action.distribution.fleet < 0 ||
      action.distribution.strategy < 0) {
    return { success: false, error: 'Token values cannot be negative' };
  }

  // Apply new distribution
  player.commandTokens.tactics = action.distribution.tactics;
  player.commandTokens.fleet = action.distribution.fleet;
  player.commandTokens.strategy = action.distribution.strategy;

  // Mark player as done with redistribution
  if (state.statusPhase) {
    if (!state.statusPhase.redistributionComplete.includes(action.playerId)) {
      state.statusPhase.redistributionComplete.push(action.playerId);
    }
  }

  // Check if all players are done
  if (state.statusPhase && state.statusPhase.redistributionComplete.length >= state.players.length) {
    advanceStatusPhaseStep(state);
  } else {
    advanceToNextRedistributionPlayer(state, action.playerId);
  }

  return {
    success: true,
    triggeredEvents: ['tokens_redistributed'],
  };
}

// =============================================================================
// AUTOMATIC STEP HANDLERS
// =============================================================================

/**
 * Initialize status phase tracking
 */
export function initializeStatusPhase(state: GameState): void {
  state.phase = 'status';
  state.subPhase = 'score_objectives';
  state.statusPhase = {
    currentStep: 1,
    scoringComplete: [],
    scoredThisPhase: [],
    redistributionComplete: [],
  };

  // Set first player in initiative order as active
  if (state.initiativeOrder.length > 0) {
    state.activePlayerId = state.initiativeOrder[0];
  }
}

/**
 * Reveal the next public objective
 * Called automatically when moving to step 2
 */
export function revealPublicObjective(state: GameState): string | null {
  // Determine which stage to reveal from based on revealed count
  // First 5 objectives are Stage I, next 5 are Stage II
  const revealedCount = state.objectives.revealedCount;

  if (revealedCount < 5) {
    // Reveal from Stage I
    const unrevealed = state.objectives.publicStageI.find(o => !o.revealed);
    if (unrevealed) {
      unrevealed.revealed = true;
      state.objectives.revealedCount++;
      if (state.statusPhase) {
        state.statusPhase.revealedObjective = unrevealed.id;
      }
      return unrevealed.id;
    }
  } else if (revealedCount < 10) {
    // Reveal from Stage II
    const unrevealed = state.objectives.publicStageII.find(o => !o.revealed);
    if (unrevealed) {
      unrevealed.revealed = true;
      state.objectives.revealedCount++;
      if (state.statusPhase) {
        state.statusPhase.revealedObjective = unrevealed.id;
      }
      return unrevealed.id;
    }
  }

  // No more objectives to reveal
  return null;
}

/**
 * Draw action cards for all players
 * Each player draws 2 action cards in initiative order
 */
export function drawActionCards(state: GameState): void {
  const CARDS_TO_DRAW = 2;

  for (const playerId of state.initiativeOrder) {
    const player = state.players.find(p => p.id === playerId);
    if (!player) continue;

    for (let i = 0; i < CARDS_TO_DRAW; i++) {
      // Reshuffle discard if deck is empty
      if (state.actionCardDeck.length === 0 && state.actionCardDiscard.length > 0) {
        state.actionCardDeck = shuffleDeck([...state.actionCardDiscard]);
        state.actionCardDiscard = [];
      }

      // Draw a card from the deck
      if (state.actionCardDeck.length > 0) {
        const drawnCard = state.actionCardDeck.shift()!;
        player.actionCards.push(drawnCard);
      }
    }
  }
}

/**
 * Fisher-Yates shuffle for deck reshuffling
 */
function shuffleDeck<T>(cards: T[]): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Remove all command tokens from the board
 */
export function removeCommandTokens(state: GameState): void {
  for (const tile of state.map.tiles) {
    tile.commandTokens = [];
  }

  // Also clear the activated system tracking
  state.activatedSystem = undefined;
}

/**
 * Ready all exhausted cards (planets, technologies, etc.)
 */
export function readyCards(state: GameState): void {
  for (const player of state.players) {
    // Ready all planets
    for (const planet of player.planets) {
      planet.exhausted = false;
    }

    // Ready all exhausted leaders
    if (player.leaders) {
      if (player.leaders.agent.exhausted) {
        player.leaders.agent.exhausted = false;
      }
    }
  }
}

/**
 * Repair all damaged units
 */
export function repairUnits(state: GameState): void {
  // Repair units in space
  for (const tile of state.map.tiles) {
    for (const unit of tile.units) {
      if (unit.damaged) {
        unit.damaged = false;
      }
    }

    // Repair units on planets
    for (const planet of tile.planets) {
      for (const unit of planet.units) {
        if (unit.damaged) {
          unit.damaged = false;
        }
      }
    }
  }
}

/**
 * Return all strategy cards to the common pool
 */
export function returnStrategyCards(state: GameState): void {
  // Clear strategy cards from players
  for (const player of state.players) {
    player.strategyCard = null;
    player.strategyCardUsed = false;
    player.passed = false;
    player.transactedWith = [];
  }

  // Reset strategy card pool
  for (const card of state.strategyCards) {
    card.pickedBy = null;
    card.exhausted = false;
  }
}

// =============================================================================
// STEP ADVANCEMENT
// =============================================================================

/**
 * Advance to the next step in the status phase
 */
export function advanceStatusPhaseStep(state: GameState): void {
  if (!state.statusPhase) return;

  const currentStep = state.statusPhase.currentStep;
  const nextStep = currentStep + 1;

  if (nextStep > STATUS_PHASE_STEPS.length) {
    // Status phase complete - transition to next phase
    completeStatusPhase(state);
    return;
  }

  state.statusPhase.currentStep = nextStep;
  state.subPhase = STATUS_PHASE_STEPS[nextStep - 1];

  // Execute automatic steps
  switch (state.subPhase) {
    case 'reveal_public_objective':
      revealPublicObjective(state);
      // Automatically advance after revealing
      advanceStatusPhaseStep(state);
      break;

    case 'draw_action_cards':
      drawActionCards(state);
      advanceStatusPhaseStep(state);
      break;

    case 'remove_command_tokens':
      removeCommandTokens(state);
      advanceStatusPhaseStep(state);
      break;

    case 'gain_redistribute_tokens':
      // This step requires player input
      // Set first player in initiative order as active
      if (state.initiativeOrder.length > 0) {
        state.activePlayerId = state.initiativeOrder[0];
      }
      break;

    case 'ready_cards':
      readyCards(state);
      advanceStatusPhaseStep(state);
      break;

    case 'repair_units':
      repairUnits(state);
      advanceStatusPhaseStep(state);
      break;

    case 'return_strategy_cards':
      returnStrategyCards(state);
      advanceStatusPhaseStep(state);
      break;
  }
}

/**
 * Complete the status phase and transition to the next phase
 */
function completeStatusPhase(state: GameState): void {
  // Clear status phase tracking
  state.statusPhase = undefined;
  state.subPhase = undefined;

  // Increment round counter
  state.round++;

  // Determine next phase based on custodians token
  if (state.custodiansTaken) {
    // If custodians have been taken (Mecatol Rex claimed), go to Agenda Phase
    state.phase = 'agenda';
    state.activePlayerId = state.speakerId;
  } else {
    // Otherwise, go directly to Strategy Phase
    state.phase = 'strategy';
    state.activePlayerId = state.speakerId;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Advance to the next player for scoring in initiative order
 */
function advanceToNextScoringPlayer(state: GameState, currentPlayerId: UUID): void {
  const currentIndex = state.initiativeOrder.indexOf(currentPlayerId);

  for (let i = 1; i <= state.initiativeOrder.length; i++) {
    const nextIndex = (currentIndex + i) % state.initiativeOrder.length;
    const nextPlayerId = state.initiativeOrder[nextIndex];

    // Check if this player has completed scoring
    if (!state.statusPhase?.scoringComplete.includes(nextPlayerId)) {
      state.activePlayerId = nextPlayerId;
      return;
    }
  }

  // All players done - advance step
  advanceStatusPhaseStep(state);
}

/**
 * Advance to the next player for token redistribution in initiative order
 */
function advanceToNextRedistributionPlayer(state: GameState, currentPlayerId: UUID): void {
  const currentIndex = state.initiativeOrder.indexOf(currentPlayerId);

  for (let i = 1; i <= state.initiativeOrder.length; i++) {
    const nextIndex = (currentIndex + i) % state.initiativeOrder.length;
    const nextPlayerId = state.initiativeOrder[nextIndex];

    // Check if this player has completed redistribution
    if (!state.statusPhase?.redistributionComplete.includes(nextPlayerId)) {
      state.activePlayerId = nextPlayerId;
      return;
    }
  }

  // All players done - advance step
  advanceStatusPhaseStep(state);
}

/**
 * Apply spent resources for "spend" objectives
 */
function applySpentResources(
  state: GameState,
  playerId: UUID,
  spent: {
    exhaustedPlanets?: string[];
    tradeGoods?: number;
    tacticTokens?: number;
    strategyTokens?: number;
    actionCardIds?: string[];
  }
): void {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return;

  // Exhaust planets
  if (spent.exhaustedPlanets) {
    for (const planetId of spent.exhaustedPlanets) {
      const planet = player.planets.find(p => p.planetId === planetId);
      if (planet) {
        planet.exhausted = true;
      }
    }
  }

  // Spend trade goods
  if (spent.tradeGoods && spent.tradeGoods > 0) {
    player.tradeGoods = Math.max(0, player.tradeGoods - spent.tradeGoods);
  }

  // Spend tactic tokens
  if (spent.tacticTokens && spent.tacticTokens > 0) {
    player.commandTokens.tactics = Math.max(0, player.commandTokens.tactics - spent.tacticTokens);
  }

  // Spend strategy tokens
  if (spent.strategyTokens && spent.strategyTokens > 0) {
    player.commandTokens.strategy = Math.max(0, player.commandTokens.strategy - spent.strategyTokens);
  }

  // Discard action cards
  if (spent.actionCardIds) {
    for (const cardId of spent.actionCardIds) {
      const cardIndex = player.actionCards.indexOf(cardId);
      if (cardIndex !== -1) {
        player.actionCards.splice(cardIndex, 1);
        state.actionCardDiscard.push(cardId);
      }
    }
  }
}

/**
 * Get the number of tokens a player gains during status phase
 * Base is 2, Sol Versatile grants +1
 */
export function getPlayerTokenGain(state: GameState, playerId: UUID): number {
  return getStatusPhaseTokenGain(state, playerId);
}

/**
 * Get the current step information for the frontend
 */
export function getStatusPhaseStepInfo(state: GameState): {
  currentStep: number;
  totalSteps: number;
  stepName: StatusPhaseState;
  waitingFor?: UUID[];
} | null {
  if (!state.statusPhase || state.phase !== 'status') {
    return null;
  }

  const stepIndex = state.statusPhase.currentStep - 1;
  const stepName = STATUS_PHASE_STEPS[stepIndex];

  let waitingFor: UUID[] | undefined;

  if (stepName === 'score_objectives') {
    waitingFor = state.initiativeOrder.filter(
      id => !state.statusPhase?.scoringComplete.includes(id)
    );
  } else if (stepName === 'gain_redistribute_tokens') {
    waitingFor = state.initiativeOrder.filter(
      id => !state.statusPhase?.redistributionComplete.includes(id)
    );
  }

  return {
    currentStep: state.statusPhase.currentStep,
    totalSteps: STATUS_PHASE_STEPS.length,
    stepName,
    waitingFor,
  };
}
