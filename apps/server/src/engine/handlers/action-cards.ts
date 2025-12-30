/**
 * Action Card Handlers
 *
 * Handles playing, drawing, and discarding action cards.
 */

import type {
  GameState,
  PlayActionCardAction,
  DiscardActionCardsAction,
  PlayerState,
} from '@ti4/shared';
import { ACTION_CARDS_BY_ID, isSabotageCard } from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { drawCards, discardCards, removeCard, hasCard } from '../utils/deck.js';
import { checkTimingTrigger } from './timing-windows.js';

// Action card hand limit
const ACTION_CARD_HAND_LIMIT = 7;

/**
 * Handle playing an action card
 */
export function handlePlayActionCard(
  state: GameState,
  action: PlayActionCardAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check if player has the card
  if (!hasCard(player.actionCards, action.cardId)) {
    return { success: false, error: 'Player does not have this action card' };
  }

  // Get card data
  const cardData = ACTION_CARDS_BY_ID[action.cardId];
  if (!cardData) {
    return { success: false, error: 'Unknown action card' };
  }

  // Remove card from player's hand
  player.actionCards = removeCard(player.actionCards, action.cardId);

  // Add to discard pile
  state.actionCardDiscard = discardCards(state.actionCardDiscard, [action.cardId]);

  // Handle Sabotage cards specially - they target another action card
  if (isSabotageCard(action.cardId)) {
    return {
      success: true,
      triggeredEvents: ['action_card_played', 'sabotage_played'],
      data: {
        cardId: action.cardId,
        cardName: cardData.name,
        playerId: action.playerId,
        targets: action.targets,
      },
    };
  }

  // Open a timing window for other players to potentially Sabotage
  const timingResult = checkTimingTrigger(state, 'action_card_played', {
    sourceCardId: action.cardId,
    sourcePlayerId: action.playerId,
    additionalData: {
      cardName: cardData.name,
      targets: action.targets,
    },
  });

  // Build result with timing window info
  const triggeredEvents = ['action_card_played'];
  const data: Record<string, unknown> = {
    cardId: action.cardId,
    cardName: cardData.name,
    playerId: action.playerId,
    targets: action.targets,
  };

  if (timingResult.triggeredEvents?.includes('timing_window_opened')) {
    triggeredEvents.push('timing_window_opened');
    if (timingResult.data) {
      data.timingWindow = timingResult.data;
    }
  }

  return {
    success: true,
    triggeredEvents,
    data,
  };
}

/**
 * Draw action cards for a player
 * Called during Status Phase or from other effects
 */
export function handleDrawActionCards(
  state: GameState,
  playerId: string,
  count: number
): HandlerResult {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check if deck needs reshuffling
  if (state.actionCardDeck.length < count && state.actionCardDiscard.length > 0) {
    // Shuffle discard into deck
    const shuffled = shuffleDeck([...state.actionCardDiscard]);
    state.actionCardDeck = [...state.actionCardDeck, ...shuffled];
    state.actionCardDiscard = [];
  }

  // Draw cards
  const { drawn, remaining } = drawCards(state.actionCardDeck, count);
  state.actionCardDeck = remaining;

  // Add to player's hand
  player.actionCards = [...player.actionCards, ...drawn];

  return {
    success: true,
    triggeredEvents: ['action_cards_drawn'],
    data: {
      playerId,
      drawnCount: drawn.length,
      drawnCards: drawn, // Only visible to the drawing player
    },
  };
}

/**
 * Handle discarding action cards (to meet hand limit)
 */
export function handleDiscardActionCards(
  state: GameState,
  action: DiscardActionCardsAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Verify player has all the cards they want to discard
  for (const cardId of action.cardIds) {
    if (!hasCard(player.actionCards, cardId)) {
      return { success: false, error: `Player does not have card: ${cardId}` };
    }
  }

  // Remove cards from player's hand
  for (const cardId of action.cardIds) {
    player.actionCards = removeCard(player.actionCards, cardId);
  }

  // Add to discard pile
  state.actionCardDiscard = discardCards(state.actionCardDiscard, action.cardIds);

  return {
    success: true,
    triggeredEvents: ['action_cards_discarded'],
    data: {
      playerId: action.playerId,
      discardedCount: action.cardIds.length,
    },
  };
}

/**
 * Check if a player exceeds hand limit
 */
export function exceedsHandLimit(player: PlayerState): boolean {
  return player.actionCards.length > ACTION_CARD_HAND_LIMIT;
}

/**
 * Get required discard count for hand limit
 */
export function getRequiredDiscardCount(player: PlayerState): number {
  return Math.max(0, player.actionCards.length - ACTION_CARD_HAND_LIMIT);
}

/**
 * Check if any player needs to discard cards
 */
export function anyPlayerNeedsToDiscard(state: GameState): boolean {
  return state.players.some(p => exceedsHandLimit(p));
}

/**
 * Get players who need to discard cards
 */
export function getPlayersNeedingDiscard(state: GameState): string[] {
  return state.players
    .filter(p => exceedsHandLimit(p))
    .map(p => p.id);
}

// Helper: Fisher-Yates shuffle
function shuffleDeck<T>(cards: T[]): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Initialize the action card deck for a new game
 */
export function initializeActionCardDeck(state: GameState): void {
  const { createActionCardDeck } = require('@ti4/shared');
  state.actionCardDeck = shuffleDeck(createActionCardDeck());
  state.actionCardDiscard = [];
}
