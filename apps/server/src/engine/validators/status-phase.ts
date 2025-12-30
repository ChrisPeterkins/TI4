import type {
  GameState,
  ScoreObjectiveAction,
  SkipScoringAction,
  RedistributeTokensAction,
  SpentResources,
} from '@ti4/shared';
import { OBJECTIVES_BY_ID } from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import {
  checkObjectiveRequirement,
  controlsHomeSystem,
  calculateSpendableResources,
  calculateSpendableInfluence,
  calculateSpendableTokens,
} from '../utils/objectives.js';
import { systems } from '@ti4/game-data';

// =============================================================================
// SCORE OBJECTIVE VALIDATOR
// =============================================================================

/**
 * Validate scoring an objective
 */
export function validateScoreObjective(
  state: GameState,
  action: ScoreObjectiveAction
): ValidationResult {
  // Must be in status phase, score_objectives step
  if (state.phase !== 'status') {
    return { valid: false, error: 'Not in status phase' };
  }

  if (state.subPhase !== 'score_objectives') {
    return { valid: false, error: 'Not in scoring step' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  const objective = OBJECTIVES_BY_ID[action.objectiveId];
  if (!objective) {
    return { valid: false, error: 'Objective not found' };
  }

  // Validate objective type matches
  if (action.objectiveType === 'public') {
    if (objective.type !== 'stage1' && objective.type !== 'stage2') {
      return { valid: false, error: 'Invalid objective type - expected public objective' };
    }

    // Check if objective is revealed
    const publicObjs = [...state.objectives.publicStageI, ...state.objectives.publicStageII];
    const objInstance = publicObjs.find(o => o.id === action.objectiveId);
    if (!objInstance || !objInstance.revealed) {
      return { valid: false, error: 'Objective is not revealed' };
    }

    // Check if player controls home system (required for public objectives)
    if (!controlsHomeSystem(state, action.playerId)) {
      return { valid: false, error: 'Must control all planets in your home system to score public objectives' };
    }
  } else if (action.objectiveType === 'secret') {
    if (objective.type !== 'secret') {
      return { valid: false, error: 'Invalid objective type - expected secret objective' };
    }

    // Check if player owns this secret objective
    if (!player.secretObjectives.includes(action.objectiveId)) {
      return { valid: false, error: 'You do not have this secret objective' };
    }
  }

  // Check if already scored this objective
  if (player.scoredObjectives.includes(action.objectiveId)) {
    return { valid: false, error: 'Already scored this objective' };
  }

  // Check if already scored this type this phase
  if (state.statusPhase) {
    const playerScoring = state.statusPhase.scoredThisPhase.find(s => s.playerId === action.playerId);
    if (playerScoring) {
      if (action.objectiveType === 'public' && playerScoring.publicObjective) {
        return { valid: false, error: 'Already scored a public objective this phase' };
      }
      if (action.objectiveType === 'secret' && playerScoring.secretObjective) {
        return { valid: false, error: 'Already scored a secret objective this phase' };
      }
    }
  }

  // Validate the player meets the objective requirements
  const requirementCheck = checkObjectiveRequirement(
    state,
    action.playerId,
    action.objectiveId,
    action.spentResources
  );

  if (!requirementCheck.canScore) {
    return { valid: false, error: requirementCheck.reason || 'Requirements not met' };
  }

  // For "spend" objectives, validate the spent resources
  if (action.spentResources) {
    const spendValidation = validateSpentResources(state, action.playerId, action.spentResources);
    if (!spendValidation.valid) {
      return spendValidation;
    }
  }

  return { valid: true };
}

// =============================================================================
// SKIP SCORING VALIDATOR
// =============================================================================

/**
 * Validate skipping objective scoring
 */
export function validateSkipScoring(
  state: GameState,
  action: SkipScoringAction
): ValidationResult {
  // Must be in status phase, score_objectives step
  if (state.phase !== 'status') {
    return { valid: false, error: 'Not in status phase' };
  }

  if (state.subPhase !== 'score_objectives') {
    return { valid: false, error: 'Not in scoring step' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if player has already completed scoring
  if (state.statusPhase?.scoringComplete.includes(action.playerId)) {
    return { valid: false, error: 'Already completed scoring' };
  }

  return { valid: true };
}

// =============================================================================
// REDISTRIBUTE TOKENS VALIDATOR
// =============================================================================

/**
 * Validate redistributing command tokens
 */
export function validateRedistributeTokens(
  state: GameState,
  action: RedistributeTokensAction
): ValidationResult {
  // Must be in status phase, gain_redistribute_tokens step
  if (state.phase !== 'status') {
    return { valid: false, error: 'Not in status phase' };
  }

  if (state.subPhase !== 'gain_redistribute_tokens') {
    return { valid: false, error: 'Not in token redistribution step' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if player has already redistributed
  if (state.statusPhase?.redistributionComplete.includes(action.playerId)) {
    return { valid: false, error: 'Already redistributed tokens' };
  }

  // Calculate current total
  const currentTotal = player.commandTokens.tactics +
                       player.commandTokens.fleet +
                       player.commandTokens.strategy;

  // New total should be current + 2 (gaining 2 tokens)
  const newTotal = action.distribution.tactics +
                   action.distribution.fleet +
                   action.distribution.strategy;

  if (newTotal !== currentTotal + 2) {
    return {
      valid: false,
      error: `Invalid token count. Must have ${currentTotal + 2} total tokens (${currentTotal} current + 2 gained), but got ${newTotal}`
    };
  }

  // Validate non-negative values
  if (action.distribution.tactics < 0) {
    return { valid: false, error: 'Tactics tokens cannot be negative' };
  }
  if (action.distribution.fleet < 0) {
    return { valid: false, error: 'Fleet tokens cannot be negative' };
  }
  if (action.distribution.strategy < 0) {
    return { valid: false, error: 'Strategy tokens cannot be negative' };
  }

  return { valid: true };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate that spent resources are valid
 */
function validateSpentResources(
  state: GameState,
  playerId: string,
  spent: SpentResources
): ValidationResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Validate exhausted planets
  if (spent.exhaustedPlanets) {
    for (const planetId of spent.exhaustedPlanets) {
      const planet = player.planets.find(p => p.planetId === planetId);
      if (!planet) {
        return { valid: false, error: `Planet ${planetId} not controlled` };
      }
      if (planet.exhausted) {
        return { valid: false, error: `Planet ${planetId} is already exhausted` };
      }
    }
  }

  // Validate trade goods
  if (spent.tradeGoods !== undefined) {
    if (spent.tradeGoods < 0) {
      return { valid: false, error: 'Cannot spend negative trade goods' };
    }
    if (spent.tradeGoods > player.tradeGoods) {
      return { valid: false, error: `Not enough trade goods. Have ${player.tradeGoods}, trying to spend ${spent.tradeGoods}` };
    }
  }

  // Validate tactic tokens
  if (spent.tacticTokens !== undefined) {
    if (spent.tacticTokens < 0) {
      return { valid: false, error: 'Cannot spend negative tactic tokens' };
    }
    if (spent.tacticTokens > player.commandTokens.tactics) {
      return { valid: false, error: `Not enough tactic tokens. Have ${player.commandTokens.tactics}, trying to spend ${spent.tacticTokens}` };
    }
  }

  // Validate strategy tokens
  if (spent.strategyTokens !== undefined) {
    if (spent.strategyTokens < 0) {
      return { valid: false, error: 'Cannot spend negative strategy tokens' };
    }
    if (spent.strategyTokens > player.commandTokens.strategy) {
      return { valid: false, error: `Not enough strategy tokens. Have ${player.commandTokens.strategy}, trying to spend ${spent.strategyTokens}` };
    }
  }

  // Validate action cards
  if (spent.actionCardIds) {
    for (const cardId of spent.actionCardIds) {
      if (!player.actionCards.includes(cardId)) {
        return { valid: false, error: `Action card ${cardId} not in hand` };
      }
    }
  }

  return { valid: true };
}
