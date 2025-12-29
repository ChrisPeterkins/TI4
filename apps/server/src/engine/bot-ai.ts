import type {
  GameState,
  GameAction,
  PlayerState,
  PickStrategyCardAction,
  PassAction,
  StrategicAction,
} from '@ti4/shared';

/**
 * Bot difficulty levels
 */
export type BotDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Check if a player is a bot based on game player records
 */
export function isBot(_gameState: GameState, playerId: string, botPlayerIds: Set<string>): boolean {
  return botPlayerIds.has(playerId);
}

/**
 * Generate a bot action for the current game state
 */
export function generateBotAction(
  gameState: GameState,
  playerId: string,
  _difficulty: BotDifficulty = 'medium'
): GameAction | null {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  switch (gameState.phase) {
    case 'strategy':
      return generateStrategyPhaseAction(gameState, player);
    case 'action':
      return generateActionPhaseAction(gameState, player);
    case 'status':
      // Status phase is mostly automatic, no action needed from bots
      return null;
    case 'agenda':
      // Agenda phase - for now, bots abstain
      return null;
    default:
      return null;
  }
}

/**
 * Generate action for strategy phase (pick strategy card)
 */
function generateStrategyPhaseAction(gameState: GameState, player: PlayerState): PickStrategyCardAction | null {
  // Only pick if we don't have a card yet
  if (player.strategyCard !== null) return null;

  // Get available strategy cards
  const availableCards = gameState.strategyCards.filter(card => !card.pickedBy);

  if (availableCards.length === 0) return null;

  // Simple AI: prioritize cards based on general usefulness
  // This is a simplified ranking - a smarter AI would consider game state
  const cardPriority: Record<number, number> = {
    8: 10, // Imperial - score points!
    4: 9,  // Construction - build space docks
    5: 8,  // Trade - get trade goods
    6: 7,  // Warfare - action flexibility
    2: 6,  // Diplomacy - refresh planets
    7: 5,  // Technology - get tech
    3: 4,  // Politics - become speaker
    1: 3,  // Leadership - command tokens
  };

  // Sort by priority
  const sortedCards = [...availableCards].sort((a, b) => {
    const priorityA = cardPriority[a.number] ?? 0;
    const priorityB = cardPriority[b.number] ?? 0;
    return priorityB - priorityA;
  });

  // Pick the best available card
  const chosenCard = sortedCards[0];

  return {
    type: 'pick_strategy_card',
    playerId: player.id,
    timestamp: Date.now(),
    cardNumber: chosenCard.number,
  };
}

/**
 * Generate action for action phase
 */
function generateActionPhaseAction(gameState: GameState, player: PlayerState): GameAction | null {
  const subPhase = gameState.subPhase;

  // Check if it's our turn
  if (gameState.activePlayerId !== player.id) {
    return null;
  }

  // If player already passed, nothing to do
  if (player.passed) {
    return null;
  }

  switch (subPhase) {
    case 'awaiting_action':
      return generateTurnAction(gameState, player);
    case 'strategic_primary':
    case 'strategic_secondary':
      // We're in the middle of a strategic action - this shouldn't happen for bots
      // as we initiate and complete in one step
      return null;
    default:
      return null;
  }
}

/**
 * Generate a turn action (when it's the bot's turn to act)
 */
function generateTurnAction(_gameState: GameState, player: PlayerState): GameAction {
  // Priority order for bot actions:
  // 1. Use strategy card if not used
  // 2. Pass if strategy card used or no good moves

  // Check if strategy card is available
  if (player.strategyCard !== null && !player.strategyCardUsed) {
    // Use the strategy card
    const action: StrategicAction = {
      type: 'strategic_action',
      playerId: player.id,
      timestamp: Date.now(),
      cardNumber: player.strategyCard,
    };
    return action;
  }

  // Otherwise, pass
  const passAction: PassAction = {
    type: 'pass',
    playerId: player.id,
    timestamp: Date.now(),
  };
  return passAction;
}

/**
 * Calculate delay for bot action (to feel more natural)
 */
export function getBotActionDelay(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case 'easy':
      return 2000 + Math.random() * 1000; // 2-3 seconds
    case 'medium':
      return 1000 + Math.random() * 1000; // 1-2 seconds
    case 'hard':
      return 500 + Math.random() * 500;  // 0.5-1 second
    default:
      return 1500;
  }
}
