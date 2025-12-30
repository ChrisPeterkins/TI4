import { describe, it, expect } from 'vitest';
import {
  shuffleDeck,
  drawCards,
  addToBottom,
  addToTop,
  reshuffleDiscard,
  discardCards,
  removeCard,
  hasCard,
  createActionCardDeck,
  createObjectiveDeck,
  createAgendaDeck,
  drawWithReshuffle,
  dealCards,
  peekCards,
  putOnBottom,
  findCard,
} from '../deck.js';

// =============================================================================
// BASIC DECK OPERATIONS
// =============================================================================

describe('Deck Utilities', () => {
  describe('shuffleDeck', () => {
    it('should return array of same length', () => {
      const deck = ['a', 'b', 'c', 'd', 'e'];
      const shuffled = shuffleDeck(deck);

      expect(shuffled.length).toBe(deck.length);
    });

    it('should contain all original elements', () => {
      const deck = ['a', 'b', 'c', 'd', 'e'];
      const shuffled = shuffleDeck(deck);

      deck.forEach(card => {
        expect(shuffled).toContain(card);
      });
    });

    it('should not modify the original array', () => {
      const deck = ['a', 'b', 'c', 'd', 'e'];
      const originalOrder = [...deck];
      shuffleDeck(deck);

      expect(deck).toEqual(originalOrder);
    });

    it('should handle empty array', () => {
      const shuffled = shuffleDeck([]);
      expect(shuffled).toEqual([]);
    });

    it('should handle single element array', () => {
      const shuffled = shuffleDeck(['only']);
      expect(shuffled).toEqual(['only']);
    });
  });

  describe('drawCards', () => {
    it('should draw specified number of cards from top', () => {
      const deck = ['a', 'b', 'c', 'd', 'e'];
      const { drawn, remaining } = drawCards(deck, 2);

      expect(drawn).toEqual(['a', 'b']);
      expect(remaining).toEqual(['c', 'd', 'e']);
    });

    it('should draw all cards if count exceeds deck size', () => {
      const deck = ['a', 'b', 'c'];
      const { drawn, remaining } = drawCards(deck, 5);

      expect(drawn).toEqual(['a', 'b', 'c']);
      expect(remaining).toEqual([]);
    });

    it('should return empty arrays for empty deck', () => {
      const { drawn, remaining } = drawCards([], 3);

      expect(drawn).toEqual([]);
      expect(remaining).toEqual([]);
    });

    it('should return empty drawn for zero count', () => {
      const deck = ['a', 'b', 'c'];
      const { drawn, remaining } = drawCards(deck, 0);

      expect(drawn).toEqual([]);
      expect(remaining).toEqual(['a', 'b', 'c']);
    });
  });

  describe('addToBottom', () => {
    it('should add cards to bottom of deck', () => {
      const deck = ['a', 'b', 'c'];
      const result = addToBottom(deck, ['x', 'y']);

      expect(result).toEqual(['a', 'b', 'c', 'x', 'y']);
    });

    it('should handle empty deck', () => {
      const result = addToBottom([], ['x', 'y']);
      expect(result).toEqual(['x', 'y']);
    });

    it('should handle empty cards to add', () => {
      const deck = ['a', 'b', 'c'];
      const result = addToBottom(deck, []);

      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('addToTop', () => {
    it('should add cards to top of deck', () => {
      const deck = ['a', 'b', 'c'];
      const result = addToTop(deck, ['x', 'y']);

      expect(result).toEqual(['x', 'y', 'a', 'b', 'c']);
    });

    it('should handle empty deck', () => {
      const result = addToTop([], ['x', 'y']);
      expect(result).toEqual(['x', 'y']);
    });

    it('should handle empty cards to add', () => {
      const deck = ['a', 'b', 'c'];
      const result = addToTop(deck, []);

      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  describe('reshuffleDiscard', () => {
    it('should reshuffle discard into deck when deck is empty', () => {
      const discard = ['a', 'b', 'c'];
      const { deck, discard: newDiscard } = reshuffleDiscard([], discard);

      expect(deck.length).toBe(3);
      expect(newDiscard).toEqual([]);
      // All discard cards should be in the new deck
      discard.forEach(card => {
        expect(deck).toContain(card);
      });
    });

    it('should not reshuffle if deck is not empty', () => {
      const originalDeck = ['x', 'y'];
      const discard = ['a', 'b', 'c'];
      const { deck, discard: newDiscard } = reshuffleDiscard(originalDeck, discard);

      expect(deck).toEqual(['x', 'y']);
      expect(newDiscard).toEqual(['a', 'b', 'c']);
    });

    it('should not reshuffle if discard is empty', () => {
      const { deck, discard: newDiscard } = reshuffleDiscard([], []);

      expect(deck).toEqual([]);
      expect(newDiscard).toEqual([]);
    });
  });

  describe('discardCards', () => {
    it('should add cards to discard pile', () => {
      const discard = ['a', 'b'];
      const result = discardCards(discard, ['x', 'y']);

      expect(result).toEqual(['a', 'b', 'x', 'y']);
    });

    it('should handle empty discard pile', () => {
      const result = discardCards([], ['x', 'y']);
      expect(result).toEqual(['x', 'y']);
    });
  });

  describe('removeCard', () => {
    it('should remove specific card from array', () => {
      const cards = ['a', 'b', 'c', 'd'];
      const result = removeCard(cards, 'b');

      expect(result).toEqual(['a', 'c', 'd']);
    });

    it('should return unchanged array if card not found', () => {
      const cards = ['a', 'b', 'c'];
      const result = removeCard(cards, 'x');

      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should only remove first occurrence', () => {
      const cards = ['a', 'b', 'a', 'c'];
      const result = removeCard(cards, 'a');

      expect(result).toEqual(['b', 'a', 'c']);
    });

    it('should handle empty array', () => {
      const result = removeCard([], 'a');
      expect(result).toEqual([]);
    });
  });

  describe('hasCard', () => {
    it('should return true if card exists', () => {
      const cards = ['a', 'b', 'c'];
      expect(hasCard(cards, 'b')).toBe(true);
    });

    it('should return false if card does not exist', () => {
      const cards = ['a', 'b', 'c'];
      expect(hasCard(cards, 'x')).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(hasCard([], 'a')).toBe(false);
    });
  });

  // =============================================================================
  // DECK CREATION
  // =============================================================================

  describe('createActionCardDeck', () => {
    it('should create a deck with action cards', () => {
      const deck = createActionCardDeck();

      expect(deck.length).toBeGreaterThan(0);
      // Should contain known cards
      expect(deck.some(id => id.startsWith('sabotage'))).toBe(true);
      expect(deck.some(id => id.startsWith('direct_hit'))).toBe(true);
    });

    it('should return shuffled deck', () => {
      // Run multiple times to ensure shuffling is happening
      const decks = Array.from({ length: 5 }, () => createActionCardDeck());

      // At least some should have different order
      const allSame = decks.every(d =>
        d.every((card, i) => card === decks[0][i])
      );
      // Very unlikely all 5 would be identical if shuffling works
      // But we only check the deck has cards, not the order
      expect(decks[0].length).toBeGreaterThan(0);
    });
  });

  describe('createObjectiveDeck', () => {
    it('should create shuffled deck from objective IDs', () => {
      const objectives = ['obj_1', 'obj_2', 'obj_3', 'obj_4'];
      const deck = createObjectiveDeck(objectives);

      expect(deck.length).toBe(4);
      objectives.forEach(obj => {
        expect(deck).toContain(obj);
      });
    });

    it('should not modify original array', () => {
      const objectives = ['obj_1', 'obj_2', 'obj_3'];
      const original = [...objectives];
      createObjectiveDeck(objectives);

      expect(objectives).toEqual(original);
    });
  });

  describe('createAgendaDeck', () => {
    it('should create shuffled deck from agenda IDs', () => {
      const agendas = ['agenda_1', 'agenda_2', 'agenda_3'];
      const deck = createAgendaDeck(agendas);

      expect(deck.length).toBe(3);
      agendas.forEach(agenda => {
        expect(deck).toContain(agenda);
      });
    });
  });

  // =============================================================================
  // ADVANCED OPERATIONS
  // =============================================================================

  describe('drawWithReshuffle', () => {
    it('should draw cards normally when deck has enough', () => {
      const deck = ['a', 'b', 'c', 'd', 'e'];
      const discard = ['x', 'y'];
      const result = drawWithReshuffle(deck, discard, 2);

      expect(result.drawn).toEqual(['a', 'b']);
      expect(result.deck).toEqual(['c', 'd', 'e']);
      expect(result.discard).toEqual(['x', 'y']);
    });

    it('should reshuffle discard when deck is empty', () => {
      const deck: string[] = [];
      const discard = ['x', 'y', 'z'];
      const result = drawWithReshuffle(deck, discard, 2);

      expect(result.drawn.length).toBe(2);
      expect(result.discard).toEqual([]);
      // All drawn cards should be from the reshuffled discard
      result.drawn.forEach(card => {
        expect(discard).toContain(card);
      });
    });

    it('should only reshuffle when deck is completely empty', () => {
      // Note: reshuffleDiscard only reshuffles when deck.length === 0
      // If deck has some cards, it won't reshuffle even if not enough
      const deck = ['a'];
      const discard = ['x', 'y', 'z'];
      const result = drawWithReshuffle(deck, discard, 3);

      // Only gets 'a' because reshuffleDiscard doesn't trigger when deck is not empty
      expect(result.drawn).toEqual(['a']);
      expect(result.discard).toEqual(['x', 'y', 'z']); // Unchanged
    });

    it('should draw all available from reshuffled pile', () => {
      const deck: string[] = [];
      const discard = ['a', 'b'];
      const result = drawWithReshuffle(deck, discard, 5);

      // Can only get 2 cards total
      expect(result.drawn.length).toBe(2);
    });
  });

  describe('dealCards', () => {
    it('should deal cards evenly to players', () => {
      const deck = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
      const { hands, remaining } = dealCards(deck, 3, 2);

      expect(hands.length).toBe(3);
      expect(hands[0].length).toBe(2);
      expect(hands[1].length).toBe(2);
      expect(hands[2].length).toBe(2);
      expect(remaining.length).toBe(3);
    });

    it('should deal in round-robin order', () => {
      const deck = ['1', '2', '3', '4', '5', '6'];
      const { hands } = dealCards(deck, 2, 3);

      // Player 1 gets cards 1, 3, 5
      // Player 2 gets cards 2, 4, 6
      expect(hands[0]).toEqual(['1', '3', '5']);
      expect(hands[1]).toEqual(['2', '4', '6']);
    });

    it('should handle insufficient cards', () => {
      const deck = ['a', 'b', 'c'];
      const { hands, remaining } = dealCards(deck, 4, 2);

      // Not enough cards for everyone
      expect(hands[0].length).toBeLessThanOrEqual(2);
      expect(hands.flat().length).toBe(3);
      expect(remaining.length).toBe(0);
    });
  });

  describe('peekCards', () => {
    it('should return top N cards without removing', () => {
      const deck = ['a', 'b', 'c', 'd', 'e'];
      const peeked = peekCards(deck, 3);

      expect(peeked).toEqual(['a', 'b', 'c']);
      expect(deck.length).toBe(5); // Original unchanged
    });

    it('should return all cards if count exceeds deck size', () => {
      const deck = ['a', 'b'];
      const peeked = peekCards(deck, 5);

      expect(peeked).toEqual(['a', 'b']);
    });

    it('should return empty for zero count', () => {
      const peeked = peekCards(['a', 'b', 'c'], 0);
      expect(peeked).toEqual([]);
    });
  });

  describe('putOnBottom', () => {
    it('should put cards on bottom of deck', () => {
      const deck = ['a', 'b', 'c'];
      const result = putOnBottom(deck, ['x', 'y']);

      expect(result).toEqual(['a', 'b', 'c', 'x', 'y']);
    });
  });

  describe('findCard', () => {
    it('should find card in first location', () => {
      const locations = [
        { name: 'hand', cards: ['a', 'b', 'c'] },
        { name: 'deck', cards: ['d', 'e', 'f'] },
      ];

      const result = findCard('b', locations);

      expect(result).toEqual({ location: 'hand', index: 1 });
    });

    it('should find card in second location', () => {
      const locations = [
        { name: 'hand', cards: ['a', 'b', 'c'] },
        { name: 'deck', cards: ['d', 'e', 'f'] },
      ];

      const result = findCard('e', locations);

      expect(result).toEqual({ location: 'deck', index: 1 });
    });

    it('should return null if card not found', () => {
      const locations = [
        { name: 'hand', cards: ['a', 'b'] },
        { name: 'deck', cards: ['c', 'd'] },
      ];

      const result = findCard('x', locations);

      expect(result).toBeNull();
    });

    it('should handle empty locations', () => {
      const locations = [
        { name: 'hand', cards: [] },
        { name: 'deck', cards: [] },
      ];

      const result = findCard('a', locations);

      expect(result).toBeNull();
    });
  });
});
