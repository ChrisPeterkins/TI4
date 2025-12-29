import type { GameState, PickStrategyCardAction } from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';

/**
 * Handle strategy card selection
 */
export function handlePickStrategyCard(
  state: GameState,
  action: PickStrategyCardAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const card = state.strategyCards.find(c => c.number === action.cardNumber);
  if (!card) {
    return { success: false, error: 'Strategy card not found' };
  }

  // Assign card to player
  player.strategyCard = action.cardNumber;
  card.pickedBy = action.playerId;

  // Advance to next player in pick order
  advanceStrategyPickOrder(state);

  return {
    success: true,
    triggeredEvents: ['strategy_card_picked'],
  };
}

/**
 * Advance to the next player in strategy card pick order
 */
function advanceStrategyPickOrder(state: GameState): void {
  const speakerIndex = state.players.findIndex(p => p.id === state.speakerId);
  const playerCount = state.players.length;
  const cardCount = state.strategyCards.length;

  // Count how many players have picked
  const pickedCount = state.players.filter(p => p.strategyCard !== null).length;

  // Determine cards per player based on player count
  const cardsPerPlayer = getCardsPerPlayer(playerCount);
  const totalPicks = playerCount * cardsPerPlayer;

  if (pickedCount >= totalPicks) {
    // All picks complete - phase will auto-transition
    return;
  }

  // Determine which pick round we're in
  const pickRound = Math.floor(pickedCount / playerCount);

  // In first round, go clockwise. In second round (for 3-4 players), continue clockwise
  const nextPickerOffset = pickedCount % playerCount;
  const nextPickerIndex = (speakerIndex + nextPickerOffset) % playerCount;

  // Find the next player who still needs to pick
  for (let i = 0; i < playerCount; i++) {
    const checkIndex = (nextPickerIndex + i) % playerCount;
    const checkPlayer = state.players[checkIndex];

    // Check if this player needs another card
    const playerCardCount = checkPlayer.strategyCard !== null ? 1 : 0;
    if (playerCardCount < cardsPerPlayer) {
      state.activePlayerId = checkPlayer.id;
      return;
    }
  }
}

/**
 * Get number of strategy cards per player based on player count
 * 3-4 players: 2 cards each
 * 5-8 players: 1 card each
 */
function getCardsPerPlayer(playerCount: number): number {
  return playerCount <= 4 ? 2 : 1;
}

/**
 * Get bonus trade goods for unpicked strategy cards
 * Cards not picked get trade goods placed on them
 */
export function getTradeGoodBonuses(state: GameState): Map<number, number> {
  const bonuses = new Map<number, number>();

  for (const card of state.strategyCards) {
    if (card.pickedBy === null) {
      // Track trade goods on unpicked cards (cumulative each round)
      const currentBonus = bonuses.get(card.number) ?? 0;
      bonuses.set(card.number, currentBonus + 1);
    }
  }

  return bonuses;
}
