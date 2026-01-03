/**
 * Tests for TI4 Exploration Card Data
 *
 * TI4 Exploration Rules (Prophecy of Kings):
 * - 4 exploration deck types: cultural, industrial, hazardous, frontier
 * - Planets are explored when a player gains control of an uncontrolled planet with a trait
 * - Exploration cards are resolved immediately upon drawing
 * - Cards with "attach" header stay attached to the planet
 * - Relic fragment cards are placed in player's play area
 * - Other cards are discarded after resolving
 * - Unknown relic fragments (frontier) count as any fragment type
 * - Cannot purge 3 unknown fragments alone - need at least 1 typed fragment
 *
 * Sources:
 * - https://twilight-imperium.fandom.com/wiki/Exploration
 * - https://www.tirules.com/R_exploration
 * - https://libraryofarcturus.weebly.com/exploration--relics.html
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_EXPLORATION_CARDS,
  CULTURAL_EXPLORATION_CARDS,
  INDUSTRIAL_EXPLORATION_CARDS,
  HAZARDOUS_EXPLORATION_CARDS,
  FRONTIER_EXPLORATION_CARDS,
  EXPLORATION_CARDS_BY_ID,
  EXPLORATION_CARDS_BY_DECK,
  getExplorationCard,
  getExplorationDeck,
  getInitialExplorationDeck,
  getExplorationDeckForTrait,
  isRelicFragment,
  isAttachment,
  isInstantEffect,
  isPersistent,
  getFragmentType,
  isExplorationEnabled,
  type ExplorationCardDef,
  type ExplorationDeckType,
} from '../explorations.js';
import type { Expansion } from '../../types/common.js';

describe('Exploration Card Data', () => {
  describe('deck structure and counts', () => {
    it('should have 4 exploration deck types', () => {
      const deckTypes: ExplorationDeckType[] = ['cultural', 'industrial', 'hazardous', 'frontier'];
      expect(Object.keys(EXPLORATION_CARDS_BY_DECK)).toHaveLength(4);
      for (const deckType of deckTypes) {
        expect(EXPLORATION_CARDS_BY_DECK[deckType]).toBeDefined();
      }
    });

    it('should have approximately 20+ cards per planetary deck (cultural, industrial, hazardous)', () => {
      // TI4 PoK has ~20 cards per planetary exploration deck
      expect(CULTURAL_EXPLORATION_CARDS.length).toBeGreaterThanOrEqual(20);
      expect(INDUSTRIAL_EXPLORATION_CARDS.length).toBeGreaterThanOrEqual(20);
      expect(HAZARDOUS_EXPLORATION_CARDS.length).toBeGreaterThanOrEqual(20);
    });

    it('should have frontier cards for empty space exploration', () => {
      expect(FRONTIER_EXPLORATION_CARDS.length).toBeGreaterThan(10);
    });

    it('should have correct total card count across all decks', () => {
      const totalCards =
        CULTURAL_EXPLORATION_CARDS.length +
        INDUSTRIAL_EXPLORATION_CARDS.length +
        HAZARDOUS_EXPLORATION_CARDS.length +
        FRONTIER_EXPLORATION_CARDS.length;

      expect(ALL_EXPLORATION_CARDS.length).toBe(totalCards);
      expect(totalCards).toBeGreaterThanOrEqual(80); // At least 80 cards in PoK
    });
  });

  describe('card properties', () => {
    it('every card should have required properties', () => {
      for (const card of ALL_EXPLORATION_CARDS) {
        expect(card.id).toBeTruthy();
        expect(card.name).toBeTruthy();
        expect(card.deckType).toBeTruthy();
        expect(card.subtype).toBeTruthy();
        expect(card.description).toBeTruthy();
        expect(card.effects).toBeDefined();
        expect(Array.isArray(card.effects)).toBe(true);
        expect(card.imageId).toBeTruthy();
        expect(card.expansion).toBeTruthy();
      }
    });

    it('every card should have a valid deck type', () => {
      const validDeckTypes: ExplorationDeckType[] = ['cultural', 'industrial', 'hazardous', 'frontier'];
      for (const card of ALL_EXPLORATION_CARDS) {
        expect(validDeckTypes).toContain(card.deckType);
      }
    });

    it('every card should have a valid subtype', () => {
      const validSubtypes = ['instant', 'attach', 'fragment', 'persistent'];
      for (const card of ALL_EXPLORATION_CARDS) {
        expect(validSubtypes).toContain(card.subtype);
      }
    });

    it('every card should have a valid expansion tag', () => {
      const validExpansions: Expansion[] = ['pok', 'codex1', 'codex2', 'codex3', 'codex4', 'thunders_edge'];
      for (const card of ALL_EXPLORATION_CARDS) {
        expect(validExpansions).toContain(card.expansion);
      }
    });

    it('all cards should have unique IDs', () => {
      const ids = ALL_EXPLORATION_CARDS.map(card => card.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('relic fragments', () => {
    it('cultural deck should have cultural relic fragments', () => {
      const fragments = CULTURAL_EXPLORATION_CARDS.filter(card => card.subtype === 'fragment');
      expect(fragments.length).toBeGreaterThan(0);

      for (const fragment of fragments) {
        expect(fragment.name).toContain('Relic Fragment');
        const fragmentEffect = fragment.effects.find(e => e.type === 'fragment');
        expect(fragmentEffect?.fragmentType).toBe('cultural');
      }
    });

    it('industrial deck should have industrial relic fragments', () => {
      const fragments = INDUSTRIAL_EXPLORATION_CARDS.filter(card => card.subtype === 'fragment');
      expect(fragments.length).toBeGreaterThan(0);

      for (const fragment of fragments) {
        expect(fragment.name).toContain('Relic Fragment');
        const fragmentEffect = fragment.effects.find(e => e.type === 'fragment');
        expect(fragmentEffect?.fragmentType).toBe('industrial');
      }
    });

    it('hazardous deck should have hazardous relic fragments', () => {
      const fragments = HAZARDOUS_EXPLORATION_CARDS.filter(card => card.subtype === 'fragment');
      expect(fragments.length).toBeGreaterThan(0);

      for (const fragment of fragments) {
        expect(fragment.name).toContain('Relic Fragment');
        const fragmentEffect = fragment.effects.find(e => e.type === 'fragment');
        expect(fragmentEffect?.fragmentType).toBe('hazardous');
      }
    });

    it('frontier deck should have unknown relic fragments', () => {
      const fragments = FRONTIER_EXPLORATION_CARDS.filter(card => card.subtype === 'fragment');
      expect(fragments.length).toBeGreaterThan(0);

      for (const fragment of fragments) {
        expect(fragment.name).toContain('Unknown Relic Fragment');
        const fragmentEffect = fragment.effects.find(e => e.type === 'fragment');
        expect(fragmentEffect?.fragmentType).toBe('unknown');
      }
    });

    it('unknown fragments should mention they count as any type in description', () => {
      const unknownFragments = FRONTIER_EXPLORATION_CARDS.filter(
        card => card.subtype === 'fragment' && card.name.includes('Unknown')
      );

      for (const fragment of unknownFragments) {
        expect(fragment.description.toLowerCase()).toMatch(/any|substitute|wildcard/i);
      }
    });

    it('fragment descriptions should mention the purging rule', () => {
      const allFragments = ALL_EXPLORATION_CARDS.filter(card => card.subtype === 'fragment');

      for (const fragment of allFragments) {
        expect(fragment.description.toLowerCase()).toMatch(/purge|relic/i);
      }
    });
  });

  describe('attachments', () => {
    it('attachment cards should have attach effect type', () => {
      const attachments = ALL_EXPLORATION_CARDS.filter(card => card.subtype === 'attach');

      for (const attachment of attachments) {
        const hasAttachEffect = attachment.effects.some(e => e.type === 'attach' || e.type === 'special');
        expect(hasAttachEffect).toBe(true);
      }
    });

    it('tech specialty attachments should have valid tech colors', () => {
      const validTechSpecialties = ['biotic', 'warfare', 'propulsion', 'cybernetic'];
      const attachments = ALL_EXPLORATION_CARDS.filter(card => card.subtype === 'attach');

      for (const attachment of attachments) {
        const attachEffect = attachment.effects.find(e => e.type === 'attach');
        if (attachEffect?.attachment?.techSpecialty) {
          expect(validTechSpecialties).toContain(attachEffect.attachment.techSpecialty);
        }
      }
    });

    it('should have research facility attachments for each tech color', () => {
      const attachments = ALL_EXPLORATION_CARDS.filter(card => card.subtype === 'attach');
      const techFacilities = attachments.filter(card => card.name.includes('Research Facility'));

      // Should have at least biotic, cybernetic, propulsion, warfare
      expect(techFacilities.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('instant effect cards', () => {
    it('instant cards should have immediate effects', () => {
      const instants = ALL_EXPLORATION_CARDS.filter(card => card.subtype === 'instant');

      for (const instant of instants) {
        expect(instant.effects.length).toBeGreaterThan(0);
      }
    });

    it('should have cards that grant commodities', () => {
      const commodityCards = ALL_EXPLORATION_CARDS.filter(card =>
        card.effects.some(e => e.type === 'gain_commodities' || e.special?.includes('commodit'))
      );
      expect(commodityCards.length).toBeGreaterThan(0);
    });

    it('should have cards that grant trade goods', () => {
      const tgCards = ALL_EXPLORATION_CARDS.filter(card =>
        card.effects.some(e => e.type === 'gain_trade_goods')
      );
      expect(tgCards.length).toBeGreaterThan(0);
    });

    it('should have cards that grant units', () => {
      const unitCards = ALL_EXPLORATION_CARDS.filter(card =>
        card.effects.some(e => e.type === 'gain_unit')
      );
      expect(unitCards.length).toBeGreaterThan(0);
    });
  });

  describe('frontier-specific cards', () => {
    it('frontier deck should have gamma wormhole placement cards', () => {
      const gammaCards = FRONTIER_EXPLORATION_CARDS.filter(card =>
        card.name.toLowerCase().includes('gamma') ||
        card.effects.some(e => e.special?.includes('gamma'))
      );
      expect(gammaCards.length).toBeGreaterThan(0);
    });

    it('frontier deck should have Mirage planet card', () => {
      const mirageCard = FRONTIER_EXPLORATION_CARDS.find(card => card.id === 'mirage');
      expect(mirageCard).toBeDefined();
      expect(mirageCard?.description.toLowerCase()).toContain('mirage');
    });

    it('frontier deck should have Ion Storm persistent card', () => {
      const ionStorm = FRONTIER_EXPLORATION_CARDS.find(card => card.id === 'ion_storm');
      expect(ionStorm).toBeDefined();
      expect(ionStorm?.subtype).toBe('persistent');
    });

    it('frontier deck should have Enigmatic Device persistent cards', () => {
      const enigmaticDevices = FRONTIER_EXPLORATION_CARDS.filter(card =>
        card.name === 'Enigmatic Device'
      );
      expect(enigmaticDevices.length).toBe(2); // 2 copies
      for (const device of enigmaticDevices) {
        expect(device.subtype).toBe('persistent');
      }
    });
  });

  describe('Codex III cards', () => {
    it('should have Dead World frontier card that grants a relic', () => {
      const deadWorld = FRONTIER_EXPLORATION_CARDS.find(card => card.id === 'dead_world');
      expect(deadWorld).toBeDefined();
      expect(deadWorld?.expansion).toBe('codex3');
      expect(deadWorld?.effects.some(e => e.type === 'gain_relic')).toBe(true);
    });

    it('should have Entropic Field cards that grant command tokens and trade goods', () => {
      const entropicFields = FRONTIER_EXPLORATION_CARDS.filter(card =>
        card.name.includes('Entropic Field')
      );
      expect(entropicFields.length).toBe(3); // regular, minor, major

      for (const field of entropicFields) {
        expect(field.expansion).toBe('codex3');
        expect(field.effects.some(e => e.type === 'gain_command_tokens')).toBe(true);
        expect(field.effects.some(e => e.type === 'gain_trade_goods')).toBe(true);
      }
    });

    it('should have Keleres Ship cards that grant command tokens', () => {
      const keleresShips = FRONTIER_EXPLORATION_CARDS.filter(card =>
        card.name === 'Keleres Ship'
      );
      expect(keleresShips.length).toBe(2);

      for (const ship of keleresShips) {
        expect(ship.expansion).toBe('codex3');
        const ctEffect = ship.effects.find(e => e.type === 'gain_command_tokens');
        expect(ctEffect).toBeDefined();
        expect(ctEffect?.amount).toBe(2);
      }
    });
  });
});

describe('Exploration Helper Functions', () => {
  describe('getExplorationCard', () => {
    it('should return card by ID', () => {
      const card = getExplorationCard('demilitarized_zone');
      expect(card).toBeDefined();
      expect(card?.name).toBe('Demilitarized Zone');
    });

    it('should return null for invalid ID', () => {
      const card = getExplorationCard('nonexistent_card');
      expect(card).toBeNull();
    });
  });

  describe('getExplorationDeck', () => {
    it('should return all cards for a deck type', () => {
      const cultural = getExplorationDeck('cultural');
      expect(cultural.length).toBe(CULTURAL_EXPLORATION_CARDS.length);
    });

    it('should filter by expansions when provided', () => {
      const pokOnly = getExplorationDeck('frontier', ['pok']);
      const pokAndCodex = getExplorationDeck('frontier', ['pok', 'codex3']);

      expect(pokAndCodex.length).toBeGreaterThan(pokOnly.length);

      // All pokOnly cards should be in pokAndCodex
      for (const card of pokOnly) {
        expect(pokAndCodex.find(c => c.id === card.id)).toBeDefined();
      }
    });
  });

  describe('getInitialExplorationDeck', () => {
    it('should return array of card IDs for deck setup', () => {
      const deck = getInitialExplorationDeck('cultural', ['pok']);
      expect(Array.isArray(deck)).toBe(true);
      expect(deck.length).toBeGreaterThan(0);

      // All IDs should be valid
      for (const id of deck) {
        expect(typeof id).toBe('string');
        expect(getExplorationCard(id)).not.toBeNull();
      }
    });

    it('should filter by expansions', () => {
      const pokOnly = getInitialExplorationDeck('frontier', ['pok']);
      const withCodex = getInitialExplorationDeck('frontier', ['pok', 'codex3']);

      expect(withCodex.length).toBeGreaterThan(pokOnly.length);
    });

    it('should return empty array for base game only', () => {
      // Exploration is PoK feature, so base-only should work but filter out all cards
      const baseOnly = getInitialExplorationDeck('cultural', ['base']);
      expect(baseOnly.length).toBe(0);
    });
  });

  describe('getExplorationDeckForTrait', () => {
    it('should map planet traits to deck types', () => {
      expect(getExplorationDeckForTrait('cultural')).toBe('cultural');
      expect(getExplorationDeckForTrait('industrial')).toBe('industrial');
      expect(getExplorationDeckForTrait('hazardous')).toBe('hazardous');
    });
  });

  describe('isRelicFragment', () => {
    it('should return true for fragment cards', () => {
      expect(isRelicFragment('cultural_relic_fragment_1')).toBe(true);
      expect(isRelicFragment('industrial_relic_fragment_1')).toBe(true);
      expect(isRelicFragment('hazardous_relic_fragment_1')).toBe(true);
      expect(isRelicFragment('unknown_relic_fragment_1')).toBe(true);
    });

    it('should return false for non-fragment cards', () => {
      expect(isRelicFragment('demilitarized_zone')).toBe(false);
      expect(isRelicFragment('mirage')).toBe(false);
    });
  });

  describe('isAttachment', () => {
    it('should return true for attachment cards', () => {
      expect(isAttachment('demilitarized_zone')).toBe(true);
      expect(isAttachment('dyson_sphere')).toBe(true);
      expect(isAttachment('mirage')).toBe(true);
    });

    it('should return false for non-attachment cards', () => {
      expect(isAttachment('cultural_relic_fragment_1')).toBe(false);
      expect(isAttachment('dead_world')).toBe(false);
    });
  });

  describe('isInstantEffect', () => {
    it('should return true for instant cards', () => {
      expect(isInstantEffect('dead_world')).toBe(true);
      expect(isInstantEffect('entropic_field')).toBe(true);
    });

    it('should return false for non-instant cards', () => {
      expect(isInstantEffect('cultural_relic_fragment_1')).toBe(false);
      expect(isInstantEffect('ion_storm')).toBe(false);
    });
  });

  describe('isPersistent', () => {
    it('should return true for persistent cards', () => {
      expect(isPersistent('ion_storm')).toBe(true);
      expect(isPersistent('enigmatic_device_1')).toBe(true);
    });

    it('should return false for non-persistent cards', () => {
      expect(isPersistent('demilitarized_zone')).toBe(false);
      expect(isPersistent('dead_world')).toBe(false);
    });
  });

  describe('getFragmentType', () => {
    it('should return correct fragment type for fragment cards', () => {
      expect(getFragmentType('cultural_relic_fragment_1')).toBe('cultural');
      expect(getFragmentType('industrial_relic_fragment_1')).toBe('industrial');
      expect(getFragmentType('hazardous_relic_fragment_1')).toBe('hazardous');
      expect(getFragmentType('unknown_relic_fragment_1')).toBe('unknown');
    });

    it('should return null for non-fragment cards', () => {
      expect(getFragmentType('demilitarized_zone')).toBeNull();
      expect(getFragmentType('mirage')).toBeNull();
    });
  });

  describe('isExplorationEnabled', () => {
    it('should return false for base game only', () => {
      expect(isExplorationEnabled(['base'])).toBe(false);
    });

    it('should return true for PoK', () => {
      expect(isExplorationEnabled(['pok'])).toBe(true);
      expect(isExplorationEnabled(['base', 'pok'])).toBe(true);
    });

    it('should return true for Codex expansions', () => {
      expect(isExplorationEnabled(['codex1'])).toBe(true);
      expect(isExplorationEnabled(['codex2'])).toBe(true);
      expect(isExplorationEnabled(['codex3'])).toBe(true);
    });

    it('should return true for Thunders Edge', () => {
      expect(isExplorationEnabled(['thunders_edge'])).toBe(true);
    });
  });
});

describe('Exploration Card Lookup Maps', () => {
  describe('EXPLORATION_CARDS_BY_ID', () => {
    it('should contain all cards', () => {
      expect(Object.keys(EXPLORATION_CARDS_BY_ID).length).toBe(ALL_EXPLORATION_CARDS.length);
    });

    it('should map IDs to correct cards', () => {
      for (const card of ALL_EXPLORATION_CARDS) {
        expect(EXPLORATION_CARDS_BY_ID[card.id]).toBe(card);
      }
    });
  });

  describe('EXPLORATION_CARDS_BY_DECK', () => {
    it('should have all deck types', () => {
      expect(EXPLORATION_CARDS_BY_DECK.cultural).toBeDefined();
      expect(EXPLORATION_CARDS_BY_DECK.industrial).toBeDefined();
      expect(EXPLORATION_CARDS_BY_DECK.hazardous).toBeDefined();
      expect(EXPLORATION_CARDS_BY_DECK.frontier).toBeDefined();
    });

    it('should correctly categorize cards by deck type', () => {
      for (const card of EXPLORATION_CARDS_BY_DECK.cultural) {
        expect(card.deckType).toBe('cultural');
      }
      for (const card of EXPLORATION_CARDS_BY_DECK.industrial) {
        expect(card.deckType).toBe('industrial');
      }
      for (const card of EXPLORATION_CARDS_BY_DECK.hazardous) {
        expect(card.deckType).toBe('hazardous');
      }
      for (const card of EXPLORATION_CARDS_BY_DECK.frontier) {
        expect(card.deckType).toBe('frontier');
      }
    });
  });
});
