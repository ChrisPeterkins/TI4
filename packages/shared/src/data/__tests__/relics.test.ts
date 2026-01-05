/**
 * Tests for TI4 Relic Card Data
 *
 * TI4 Relic Rules (Prophecy of Kings):
 * - Relics are gained by purging 3 relic fragments of the same type
 * - Unknown fragments can substitute for any type, but cannot purge 3 unknowns alone
 * - Relics cannot be traded between players
 * - Relic fragments CAN be traded as part of transactions
 * - When a player is eliminated, their relics are purged (removed from game)
 * - If relic deck is empty, purging fragments yields nothing but is still valid
 * - Relics have various timings: action, passive, combat, agenda, status, tactical
 * - Some relics can be exhausted, others are purged when used
 *
 * Sources:
 * - https://www.tirules.com/R_relics
 * - https://libraryofarcturus.weebly.com/exploration--relics.html
 * - https://scottmk.github.io/ti4-reference/relics/
 */

import { describe, it, expect } from 'vitest';
import {
  RELIC_CARDS,
  RELICS_BY_ID,
  getRelic,
  getRelicName,
  getInitialRelicDeck,
  getRelics,
  isExhaustable,
  isPurgeable,
  getRelicVictoryPoints,
  getRelicsByTiming,
  isRelicAgent,
  areRelicsEnabled,
  type RelicDef,
  type RelicTiming,
  type RelicUsage,
} from '../relics.js';
import type { Expansion } from '../../types/common.js';

describe('Relic Card Data', () => {
  describe('relic structure and counts', () => {
    it('should have at least 10 relics (base PoK count)', () => {
      expect(RELIC_CARDS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have PoK base relics', () => {
      const pokRelics = RELIC_CARDS.filter(r => r.expansion === 'pok');
      expect(pokRelics.length).toBe(10);
    });

    it('should have Codex relics', () => {
      const codexRelics = RELIC_CARDS.filter(r =>
        r.expansion === 'codex1' || r.expansion === 'codex2'
      );
      expect(codexRelics.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('relic properties', () => {
    it('every relic should have required properties', () => {
      for (const relic of RELIC_CARDS) {
        expect(relic.id).toBeTruthy();
        expect(relic.name).toBeTruthy();
        expect(relic.description).toBeTruthy();
        expect(relic.timing).toBeTruthy();
        expect(relic.usage).toBeTruthy();
        expect(relic.imageId).toBeTruthy();
        expect(relic.expansion).toBeTruthy();
      }
    });

    it('every relic should have a valid timing', () => {
      const validTimings: RelicTiming[] = ['action', 'passive', 'combat', 'agenda', 'status', 'tactical'];
      for (const relic of RELIC_CARDS) {
        expect(validTimings).toContain(relic.timing);
      }
    });

    it('every relic should have a valid usage type', () => {
      const validUsages: RelicUsage[] = ['exhaust', 'purge', 'passive'];
      for (const relic of RELIC_CARDS) {
        expect(validUsages).toContain(relic.usage);
      }
    });

    it('every relic should have a valid expansion tag', () => {
      const validExpansions: Expansion[] = ['pok', 'codex1', 'codex2', 'codex3', 'codex4', 'thunders_edge'];
      for (const relic of RELIC_CARDS) {
        expect(validExpansions).toContain(relic.expansion);
      }
    });

    it('all relics should have unique IDs', () => {
      const ids = RELIC_CARDS.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('PoK base relics', () => {
    it('should have Dominus Orb - movement from activated systems', () => {
      const orb = getRelic('dominus_orb');
      expect(orb).toBeDefined();
      expect(orb?.name).toBe('Dominus Orb');
      expect(orb?.timing).toBe('tactical');
      expect(orb?.usage).toBe('purge');
      expect(orb?.description.toLowerCase()).toMatch(/move.*command token/i);
    });

    it('should have Maw of Worlds - gain any technology', () => {
      const maw = getRelic('maw_of_worlds');
      expect(maw).toBeDefined();
      expect(maw?.timing).toBe('agenda');
      expect(maw?.usage).toBe('purge');
      expect(maw?.description.toLowerCase()).toMatch(/technology/i);
    });

    it('should have Scepter of Emelpar - strategy pool token substitute', () => {
      const scepter = getRelic('scepter_of_emelpar');
      expect(scepter).toBeDefined();
      expect(scepter?.timing).toBe('action');
      expect(scepter?.usage).toBe('exhaust');
      expect(scepter?.description.toLowerCase()).toMatch(/strategy pool/i);
    });

    it('should have Shard of the Throne - victory point relic', () => {
      const shard = getRelic('shard_of_the_throne');
      expect(shard).toBeDefined();
      expect(shard?.timing).toBe('passive');
      expect(shard?.usage).toBe('passive');
      expect(shard?.victoryPoints).toBe(1);
      expect(shard?.description.toLowerCase()).toMatch(/victory point/i);
    });

    it('should have Stellar Converter - destroy planet', () => {
      const stellar = getRelic('stellar_converter');
      expect(stellar).toBeDefined();
      expect(stellar?.timing).toBe('action');
      expect(stellar?.usage).toBe('purge');
      expect(stellar?.description.toLowerCase()).toMatch(/destroy.*planet|destroyed planet/i);
    });

    it('should have The Codex - retrieve action cards from discard', () => {
      const codex = getRelic('the_codex');
      expect(codex).toBeDefined();
      expect(codex?.timing).toBe('action');
      expect(codex?.usage).toBe('purge');
      expect(codex?.description.toLowerCase()).toMatch(/action card.*discard/i);
    });

    it('should have The Crown of Emphidia - explore and VP with Tomb', () => {
      const crown = getRelic('the_crown_of_emphidia');
      expect(crown).toBeDefined();
      expect(crown?.timing).toBe('tactical');
      expect(crown?.usage).toBe('exhaust');
      expect(crown?.description.toLowerCase()).toMatch(/explore/i);
      expect(crown?.description.toLowerCase()).toMatch(/tomb of emphidia/i);
    });

    it('should have The Crown of Thalnos - combat reroll with sacrifice', () => {
      const crown = getRelic('the_crown_of_thalnos');
      expect(crown).toBeDefined();
      expect(crown?.timing).toBe('combat');
      expect(crown?.usage).toBe('passive');
      expect(crown?.description.toLowerCase()).toMatch(/reroll/i);
      expect(crown?.description.toLowerCase()).toMatch(/destroy/i);
    });

    it('should have The Obsidian - extra secret objective', () => {
      const obsidian = getRelic('the_obsidian');
      expect(obsidian).toBeDefined();
      expect(obsidian?.timing).toBe('passive');
      expect(obsidian?.usage).toBe('passive');
      expect(obsidian?.description.toLowerCase()).toMatch(/secret objective/i);
    });

    it("should have The Prophet's Tears - ignore tech prerequisite", () => {
      const tears = getRelic('the_prophets_tears');
      expect(tears).toBeDefined();
      expect(tears?.timing).toBe('action');
      expect(tears?.usage).toBe('exhaust');
      expect(tears?.description.toLowerCase()).toMatch(/prerequisite/i);
    });
  });

  describe('Codex relics', () => {
    it('should have Dynamis Core (Codex I) - commodity bonus and TG gain', () => {
      const core = getRelic('dynamis_core');
      expect(core).toBeDefined();
      expect(core?.expansion).toBe('codex1');
      expect(core?.description.toLowerCase()).toMatch(/commodity/i);
      expect(core?.description.toLowerCase()).toMatch(/trade good/i);
    });

    it('should have JR-XS455-O (Codex II) - agent relic', () => {
      const jr = getRelic('jr_xs455_o');
      expect(jr).toBeDefined();
      expect(jr?.expansion).toBe('codex2');
      expect(jr?.isAgent).toBe(true);
      expect(jr?.description.toLowerCase()).toMatch(/agent/i);
      expect(jr?.description.toLowerCase()).toMatch(/structure/i);
    });

    it('should have Nano-Forge (Codex II) - make planet legendary', () => {
      const forge = getRelic('nano_forge');
      expect(forge).toBeDefined();
      expect(forge?.expansion).toBe('codex2');
      expect(forge?.description.toLowerCase()).toMatch(/legendary/i);
      expect(forge?.description.toLowerCase()).toMatch(/attach/i);
    });
  });

  describe('relic rules compliance', () => {
    it('relics with victory points should be clearly marked', () => {
      const vpRelics = RELIC_CARDS.filter(r => r.victoryPoints && r.victoryPoints > 0);

      for (const relic of vpRelics) {
        // VP relics should mention victory point in description
        expect(relic.description.toLowerCase()).toMatch(/victory point/i);
      }
    });

    it('exhaust relics can be used multiple times (per round refresh)', () => {
      const exhaustRelics = RELIC_CARDS.filter(r => r.usage === 'exhaust');

      // These should not mention "purge" in their main ability text
      for (const relic of exhaustRelics) {
        // Exhaust relics should use "exhaust" in description
        expect(relic.description.toLowerCase()).toMatch(/exhaust/i);
      }
    });

    it('purge relics can only be used once then removed from game', () => {
      const purgeRelics = RELIC_CARDS.filter(r => r.usage === 'purge');

      for (const relic of purgeRelics) {
        // Most purge relics explicitly say "purge", but Nano-Forge says "Attach"
        // since it becomes a planet attachment (still one-time use)
        if (relic.id === 'nano_forge') {
          expect(relic.description.toLowerCase()).toMatch(/attach/i);
        } else {
          expect(relic.description.toLowerCase()).toMatch(/purge/i);
        }
      }
    });

    it('passive relics have ongoing effects', () => {
      const passiveRelics = RELIC_CARDS.filter(r => r.usage === 'passive');

      // Passive relics should describe ongoing conditions
      expect(passiveRelics.length).toBeGreaterThan(0);
    });
  });
});

describe('Relic Helper Functions', () => {
  describe('getRelic', () => {
    it('should return relic by ID', () => {
      const relic = getRelic('dominus_orb');
      expect(relic).toBeDefined();
      expect(relic?.name).toBe('Dominus Orb');
    });

    it('should return null for invalid ID', () => {
      const relic = getRelic('nonexistent_relic');
      expect(relic).toBeNull();
    });
  });

  describe('getRelicName', () => {
    it('should return relic name for valid ID', () => {
      expect(getRelicName('dominus_orb')).toBe('Dominus Orb');
      expect(getRelicName('the_codex')).toBe('The Codex');
    });

    it('should format unknown ID as fallback', () => {
      const name = getRelicName('unknown_relic_id');
      expect(name).toBe('Unknown Relic Id');
    });
  });

  describe('getInitialRelicDeck', () => {
    it('should return array of relic IDs for deck setup', () => {
      const deck = getInitialRelicDeck(['pok']);
      expect(Array.isArray(deck)).toBe(true);
      expect(deck.length).toBeGreaterThan(0);

      // All IDs should be valid
      for (const id of deck) {
        expect(typeof id).toBe('string');
        expect(getRelic(id)).not.toBeNull();
      }
    });

    it('should return only PoK relics for PoK-only game', () => {
      const deck = getInitialRelicDeck(['pok']);
      expect(deck.length).toBe(10);

      for (const id of deck) {
        const relic = getRelic(id);
        expect(relic?.expansion).toBe('pok');
      }
    });

    it('should include Codex relics when Codex expansions enabled', () => {
      const pokOnly = getInitialRelicDeck(['pok']);
      const withCodex = getInitialRelicDeck(['pok', 'codex1', 'codex2']);

      expect(withCodex.length).toBeGreaterThan(pokOnly.length);
      expect(withCodex).toContain('dynamis_core');
      expect(withCodex).toContain('jr_xs455_o');
      expect(withCodex).toContain('nano_forge');
    });

    it('should return empty array for base game only', () => {
      const baseOnly = getInitialRelicDeck(['base']);
      expect(baseOnly.length).toBe(0);
    });
  });

  describe('getRelics', () => {
    it('should return all relics when no expansion filter', () => {
      const allRelics = getRelics();
      expect(allRelics.length).toBe(RELIC_CARDS.length);
    });

    it('should filter by expansions when provided', () => {
      const pokOnly = getRelics(['pok']);
      expect(pokOnly.length).toBe(10);

      for (const relic of pokOnly) {
        expect(relic.expansion).toBe('pok');
      }
    });
  });

  describe('isExhaustable', () => {
    it('should return true for exhaust relics', () => {
      expect(isExhaustable('scepter_of_emelpar')).toBe(true);
      expect(isExhaustable('the_crown_of_emphidia')).toBe(true);
      expect(isExhaustable('the_prophets_tears')).toBe(true);
    });

    it('should return false for non-exhaust relics', () => {
      expect(isExhaustable('dominus_orb')).toBe(false);
      expect(isExhaustable('shard_of_the_throne')).toBe(false);
    });
  });

  describe('isPurgeable', () => {
    it('should return true for purge relics', () => {
      expect(isPurgeable('dominus_orb')).toBe(true);
      expect(isPurgeable('maw_of_worlds')).toBe(true);
      expect(isPurgeable('stellar_converter')).toBe(true);
      expect(isPurgeable('the_codex')).toBe(true);
    });

    it('should return false for non-purge relics', () => {
      expect(isPurgeable('scepter_of_emelpar')).toBe(false);
      expect(isPurgeable('shard_of_the_throne')).toBe(false);
    });
  });

  describe('getRelicVictoryPoints', () => {
    it('should return VP for VP relics', () => {
      expect(getRelicVictoryPoints('shard_of_the_throne')).toBe(1);
    });

    it('should return 0 for non-VP relics', () => {
      expect(getRelicVictoryPoints('dominus_orb')).toBe(0);
      expect(getRelicVictoryPoints('the_codex')).toBe(0);
    });
  });

  describe('getRelicsByTiming', () => {
    it('should return relics by timing type', () => {
      const actionRelics = getRelicsByTiming('action');
      expect(actionRelics.length).toBeGreaterThan(0);

      for (const relic of actionRelics) {
        expect(relic.timing).toBe('action');
      }
    });

    it('should filter by expansions when provided', () => {
      const pokCombatRelics = getRelicsByTiming('combat', ['pok']);

      for (const relic of pokCombatRelics) {
        expect(relic.timing).toBe('combat');
        expect(relic.expansion).toBe('pok');
      }
    });
  });

  describe('isRelicAgent', () => {
    it('should return true for JR-XS455-O', () => {
      expect(isRelicAgent('jr_xs455_o')).toBe(true);
    });

    it('should return false for non-agent relics', () => {
      expect(isRelicAgent('dominus_orb')).toBe(false);
      expect(isRelicAgent('the_codex')).toBe(false);
    });
  });

  describe('areRelicsEnabled', () => {
    it('should return false for base game only', () => {
      expect(areRelicsEnabled(['base'])).toBe(false);
    });

    it('should return true for PoK', () => {
      expect(areRelicsEnabled(['pok'])).toBe(true);
      expect(areRelicsEnabled(['base', 'pok'])).toBe(true);
    });

    it('should return true for Codex expansions', () => {
      expect(areRelicsEnabled(['codex1'])).toBe(true);
      expect(areRelicsEnabled(['codex2'])).toBe(true);
    });

    it('should return true for Thunders Edge', () => {
      expect(areRelicsEnabled(['thunders_edge'])).toBe(true);
    });
  });
});

describe('Relic Lookup Maps', () => {
  describe('RELICS_BY_ID', () => {
    it('should contain all relics', () => {
      expect(Object.keys(RELICS_BY_ID).length).toBe(RELIC_CARDS.length);
    });

    it('should map IDs to correct relics', () => {
      for (const relic of RELIC_CARDS) {
        expect(RELICS_BY_ID[relic.id]).toBe(relic);
      }
    });
  });
});

describe('Relic-Exploration Interactions', () => {
  describe('Crown of Emphidia and Tomb of Emphidia', () => {
    it('Crown should reference Tomb in description', () => {
      const crown = getRelic('the_crown_of_emphidia');
      expect(crown?.description.toLowerCase()).toContain('tomb of emphidia');
    });

    it('Crown victory point ability requires controlling Tomb', () => {
      const crown = getRelic('the_crown_of_emphidia');
      expect(crown?.description.toLowerCase()).toMatch(/control.*tomb|tomb.*control/i);
    });
  });
});

describe('Thunder\'s Edge Relics', () => {
  it('should have exactly 7 Thunder\'s Edge relics', () => {
    const teRelics = RELIC_CARDS.filter(r => r.expansion === 'thunders_edge');
    expect(teRelics.length).toBe(7);
  });

  it('should have Metali Void Armaments - anti-fighter barrage ability', () => {
    const relic = getRelic('metali_void_armaments');
    expect(relic).toBeDefined();
    expect(relic?.expansion).toBe('thunders_edge');
    expect(relic?.timing).toBe('combat');
    expect(relic?.usage).toBe('passive');
    expect(relic?.description.toLowerCase()).toMatch(/anti-fighter barrage/i);
  });

  it('should have The Quantumcore - grants breakthrough and tech synergy', () => {
    const relic = getRelic('the_quantumcore');
    expect(relic).toBeDefined();
    expect(relic?.expansion).toBe('thunders_edge');
    expect(relic?.timing).toBe('passive');
    expect(relic?.description.toLowerCase()).toMatch(/breakthrough/i);
    expect(relic?.description.toLowerCase()).toMatch(/synergy/i);
  });

  it('should have The Silver Flame - risky VP gamble', () => {
    const relic = getRelic('the_silver_flame');
    expect(relic).toBeDefined();
    expect(relic?.expansion).toBe('thunders_edge');
    expect(relic?.timing).toBe('action');
    expect(relic?.usage).toBe('purge');
    expect(relic?.description.toLowerCase()).toMatch(/victory point/i);
    expect(relic?.description.toLowerCase()).toMatch(/roll.*10/i);
  });

  it('should have Lightrail Ordnance - space dock space cannon', () => {
    const relic = getRelic('lightrail_ordnance');
    expect(relic).toBeDefined();
    expect(relic?.expansion).toBe('thunders_edge');
    expect(relic?.timing).toBe('passive');
    expect(relic?.description.toLowerCase()).toMatch(/space dock/i);
    expect(relic?.description.toLowerCase()).toMatch(/space cannon/i);
  });

  it('should have Metali Void Shielding - sustain damage for non-fighters', () => {
    const relic = getRelic('metali_void_shielding');
    expect(relic).toBeDefined();
    expect(relic?.expansion).toBe('thunders_edge');
    expect(relic?.timing).toBe('combat');
    expect(relic?.usage).toBe('passive');
    expect(relic?.description.toLowerCase()).toMatch(/sustain damage/i);
    expect(relic?.description.toLowerCase()).toMatch(/non-fighter/i);
  });

  it('should have The Triad - planet card based on relic fragments', () => {
    const relic = getRelic('the_triad');
    expect(relic).toBeDefined();
    expect(relic?.expansion).toBe('thunders_edge');
    expect(relic?.timing).toBe('passive');
    expect(relic?.usage).toBe('passive');
    expect(relic?.description.toLowerCase()).toMatch(/planet card/i);
    expect(relic?.description.toLowerCase()).toMatch(/relic fragment/i);
  });

  it('should have Heart of Ixth - modify die rolls', () => {
    const relic = getRelic('heart_of_ixth');
    expect(relic).toBeDefined();
    expect(relic?.expansion).toBe('thunders_edge');
    expect(relic?.timing).toBe('action');
    expect(relic?.usage).toBe('exhaust');
    expect(relic?.description.toLowerCase()).toMatch(/die.*roll/i);
    expect(relic?.description.toLowerCase()).toMatch(/add or subtract/i);
  });

  it('should include Thunder\'s Edge relics in deck when expansion enabled', () => {
    const deck = getInitialRelicDeck(['pok', 'thunders_edge']);
    const teRelics = RELIC_CARDS.filter(r => r.expansion === 'thunders_edge');

    for (const relic of teRelics) {
      expect(deck).toContain(relic.id);
    }
  });
});
