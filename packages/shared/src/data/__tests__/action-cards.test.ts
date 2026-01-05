/**
 * Tests for action card deck building
 */

import { describe, it, expect } from 'vitest';
import {
  createActionCardDeck,
  getEffectiveExpansions,
  getActionCardCountForExpansions,
  ACTION_CARDS,
} from '../action-cards.js';
import type { Expansion } from '../../types/common.js';

describe('Action Card Deck Building', () => {
  describe('getEffectiveExpansions', () => {
    it('should always include base expansion', () => {
      const result = getEffectiveExpansions([]);
      expect(result.has('base')).toBe(true);
    });

    it('should include base when only pok is specified', () => {
      const result = getEffectiveExpansions(['pok']);
      expect(result.has('base')).toBe(true);
      expect(result.has('pok')).toBe(true);
    });

    it('should include all specified expansions', () => {
      const result = getEffectiveExpansions(['base', 'pok', 'codex1']);
      expect(result.has('base')).toBe(true);
      expect(result.has('pok')).toBe(true);
      expect(result.has('codex1')).toBe(true);
    });

    it('should expand thunders_edge to include all codex content', () => {
      const result = getEffectiveExpansions(['thunders_edge']);
      expect(result.has('base')).toBe(true);
      expect(result.has('thunders_edge')).toBe(true);
      expect(result.has('codex1')).toBe(true);
      expect(result.has('codex2')).toBe(true);
      expect(result.has('codex3')).toBe(true);
      expect(result.has('codex4')).toBe(true);
    });
  });

  describe('createActionCardDeck', () => {
    it('should return only base cards when no expansions specified', () => {
      const deck = createActionCardDeck(['base']);
      const baseCards = ACTION_CARDS.filter(c => c.expansion === 'base');

      expect(deck.length).toBe(baseCards.length);
      // All cards in deck should be base cards
      for (const cardId of deck) {
        const card = ACTION_CARDS.find(c => c.id === cardId);
        expect(card?.expansion).toBe('base');
      }
    });

    it('should return base + pok cards when pok is enabled', () => {
      const deck = createActionCardDeck(['base', 'pok']);
      const basePokCards = ACTION_CARDS.filter(
        c => c.expansion === 'base' || c.expansion === 'pok'
      );

      expect(deck.length).toBe(basePokCards.length);
    });

    it('should default to base only when called with no arguments', () => {
      const deck = createActionCardDeck();
      const baseCards = ACTION_CARDS.filter(c => c.expansion === 'base');

      expect(deck.length).toBe(baseCards.length);
    });

    it('should include more cards as more expansions are added', () => {
      const baseOnly = createActionCardDeck(['base']);
      const withPok = createActionCardDeck(['base', 'pok']);

      expect(withPok.length).toBeGreaterThan(baseOnly.length);
    });

    it('should return unique card IDs', () => {
      const deck = createActionCardDeck(['base', 'pok']);
      const uniqueIds = new Set(deck);

      expect(uniqueIds.size).toBe(deck.length);
    });
  });

  describe('getActionCardCountForExpansions', () => {
    it('should match deck length for same expansions', () => {
      const expansions: Expansion[] = ['base', 'pok'];
      const count = getActionCardCountForExpansions(expansions);
      const deck = createActionCardDeck(expansions);

      expect(count).toBe(deck.length);
    });

    it('should return base count for base only', () => {
      const count = getActionCardCountForExpansions(['base']);
      const baseCards = ACTION_CARDS.filter(c => c.expansion === 'base');

      expect(count).toBe(baseCards.length);
    });
  });

  describe('ACTION_CARDS data integrity', () => {
    it('should have unique IDs for all cards', () => {
      const ids = ACTION_CARDS.map(c => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid expansion values', () => {
      const validExpansions: Expansion[] = [
        'base', 'pok', 'codex1', 'codex2', 'codex3', 'codex4', 'thunders_edge'
      ];

      for (const card of ACTION_CARDS) {
        expect(validExpansions).toContain(card.expansion);
      }
    });

    it('should have non-empty descriptions', () => {
      for (const card of ACTION_CARDS) {
        expect(card.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Official card count validation', () => {
    it('should have exactly 80 base game cards', () => {
      const baseCards = ACTION_CARDS.filter(c => c.expansion === 'base');
      expect(baseCards.length).toBe(80);
    });

    it('should have exactly 20 Prophecy of Kings cards', () => {
      const pokCards = ACTION_CARDS.filter(c => c.expansion === 'pok');
      expect(pokCards.length).toBe(20);
    });

    it('should have exactly 20 Codex I cards', () => {
      const codex1Cards = ACTION_CARDS.filter(c => c.expansion === 'codex1');
      expect(codex1Cards.length).toBe(20);
    });

    it('should have exactly 20 Thunder\'s Edge cards', () => {
      const teCards = ACTION_CARDS.filter(c => c.expansion === 'thunders_edge');
      expect(teCards.length).toBe(20);
    });

    it('should have 100 cards total for base + PoK', () => {
      const deck = createActionCardDeck(['base', 'pok']);
      expect(deck.length).toBe(100);
    });

    it('should have 120 cards total for base + PoK + Codex I', () => {
      const deck = createActionCardDeck(['base', 'pok', 'codex1']);
      expect(deck.length).toBe(120);
    });

    it('should have Thunder\'s Edge cards when thunders_edge expansion enabled', () => {
      const deck = createActionCardDeck(['thunders_edge']);
      const teCards = ACTION_CARDS.filter(c => c.expansion === 'thunders_edge');

      // Thunder's Edge includes all codex content, so deck should include TE cards
      for (const card of teCards) {
        expect(deck).toContain(card.id);
      }
    });
  });

  describe('Thunder\'s Edge Action Cards', () => {
    it('should have Black Market Dealings card', () => {
      const card = ACTION_CARDS.find(c => c.id === 'black_market_dealings');
      expect(card).toBeDefined();
      expect(card?.expansion).toBe('thunders_edge');
      expect(card?.timing).toBe('action');
    });

    it('should have 4 Pirate Contract cards', () => {
      const pirateContracts = ACTION_CARDS.filter(
        c => c.name === 'Pirate Contract' && c.expansion === 'thunders_edge'
      );
      expect(pirateContracts.length).toBe(4);
    });

    it('should have 4 Strategize cards', () => {
      const strategize = ACTION_CARDS.filter(
        c => c.name === 'Strategize' && c.expansion === 'thunders_edge'
      );
      expect(strategize.length).toBe(4);
    });

    it('should have Overrule card (perform primary ability of strategy card)', () => {
      const card = ACTION_CARDS.find(c => c.id === 'overrule');
      expect(card).toBeDefined();
      expect(card?.expansion).toBe('thunders_edge');
      expect(card?.description.toLowerCase()).toMatch(/primary ability/i);
    });
  });
});
