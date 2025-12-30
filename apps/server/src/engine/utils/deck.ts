/**
 * Deck Utility Functions
 *
 * Generic utilities for managing card decks in TI4.
 * Used for action cards, objectives, agendas, exploration, etc.
 */

import { ACTION_CARDS } from '@ti4/shared';

/**
 * Fisher-Yates shuffle algorithm
 * Returns a new shuffled array without modifying the original
 */
export function shuffleDeck<T>(cards: T[]): T[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draw N cards from a deck
 * Returns the drawn cards and the remaining deck
 */
export function drawCards(
  deck: string[],
  count: number
): { drawn: string[]; remaining: string[] } {
  const actualCount = Math.min(count, deck.length);
  return {
    drawn: deck.slice(0, actualCount),
    remaining: deck.slice(actualCount),
  };
}

/**
 * Add cards to the bottom of a deck
 */
export function addToBottom(deck: string[], cards: string[]): string[] {
  return [...deck, ...cards];
}

/**
 * Add cards to the top of a deck
 */
export function addToTop(deck: string[], cards: string[]): string[] {
  return [...cards, ...deck];
}

/**
 * Reshuffle discard pile into deck when deck is empty
 * Returns new deck (shuffled discard) and empty discard pile
 */
export function reshuffleDiscard(
  deck: string[],
  discard: string[]
): { deck: string[]; discard: string[] } {
  if (deck.length > 0 || discard.length === 0) {
    return { deck, discard };
  }
  return {
    deck: shuffleDeck(discard),
    discard: [],
  };
}

/**
 * Add cards to discard pile
 */
export function discardCards(discard: string[], cards: string[]): string[] {
  return [...discard, ...cards];
}

/**
 * Remove a specific card from an array (e.g., player's hand)
 * Returns the modified array without the card
 */
export function removeCard(cards: string[], cardId: string): string[] {
  const index = cards.indexOf(cardId);
  if (index === -1) return cards;
  return [...cards.slice(0, index), ...cards.slice(index + 1)];
}

/**
 * Check if a card exists in an array
 */
export function hasCard(cards: string[], cardId: string): boolean {
  return cards.includes(cardId);
}

/**
 * Create the initial action card deck for a game
 * Each card appears in the deck according to its count in the card data
 */
export function createActionCardDeck(): string[] {
  const deck: string[] = [];
  for (const card of ACTION_CARDS) {
    // Each card ID is unique, so we add it once
    // The count field is for reference only - each card ID is unique
    deck.push(card.id);
  }
  return shuffleDeck(deck);
}

/**
 * Create an objective deck from an array of objective IDs
 */
export function createObjectiveDeck(objectiveIds: string[]): string[] {
  return shuffleDeck([...objectiveIds]);
}

/**
 * Create an agenda deck from an array of agenda IDs
 */
export function createAgendaDeck(agendaIds: string[]): string[] {
  return shuffleDeck([...agendaIds]);
}

/**
 * Draw cards with automatic reshuffle from discard
 * If deck is empty, reshuffles discard pile first
 */
export function drawWithReshuffle(
  deck: string[],
  discard: string[],
  count: number
): { drawn: string[]; deck: string[]; discard: string[] } {
  // If we need more cards than in deck, reshuffle first
  if (deck.length < count && discard.length > 0) {
    const reshuffled = reshuffleDiscard(deck, discard);
    deck = reshuffled.deck;
    discard = reshuffled.discard;
  }

  const { drawn, remaining } = drawCards(deck, count);
  return {
    drawn,
    deck: remaining,
    discard,
  };
}

/**
 * Deal cards evenly to multiple players
 * Returns an array of hands, one for each player
 */
export function dealCards(
  deck: string[],
  playerCount: number,
  cardsPerPlayer: number
): { hands: string[][]; remaining: string[] } {
  const hands: string[][] = Array.from({ length: playerCount }, () => []);
  let currentDeck = [...deck];

  for (let card = 0; card < cardsPerPlayer; card++) {
    for (let player = 0; player < playerCount; player++) {
      if (currentDeck.length > 0) {
        const { drawn, remaining } = drawCards(currentDeck, 1);
        if (drawn.length > 0) {
          hands[player].push(drawn[0]);
          currentDeck = remaining;
        }
      }
    }
  }

  return {
    hands,
    remaining: currentDeck,
  };
}

/**
 * Peek at the top N cards of a deck without removing them
 */
export function peekCards(deck: string[], count: number): string[] {
  return deck.slice(0, Math.min(count, deck.length));
}

/**
 * Put cards on the bottom of a deck (in order)
 */
export function putOnBottom(deck: string[], cards: string[]): string[] {
  return [...deck, ...cards];
}

/**
 * Find a card in multiple locations (hand, deck, discard)
 * Returns the location where the card was found
 */
export function findCard(
  cardId: string,
  locations: { name: string; cards: string[] }[]
): { location: string; index: number } | null {
  for (const { name, cards } of locations) {
    const index = cards.indexOf(cardId);
    if (index !== -1) {
      return { location: name, index };
    }
  }
  return null;
}
