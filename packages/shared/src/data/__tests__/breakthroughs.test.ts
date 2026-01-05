/**
 * Tests for TI4 Breakthrough Data (Thunder's Edge)
 *
 * Breakthroughs are faction-specific abilities unlocked via the Thunder's Edge
 * expedition mechanic when a player has 2 technologies of matching colors (synergy).
 *
 * All 30 playable factions receive a breakthrough:
 * - 17 base game factions
 * - 7 Prophecy of Kings factions
 * - 5 Thunder's Edge factions (+ The Obsidian transformation)
 * - 1 Council Keleres
 */

import { describe, it, expect } from 'vitest';
import {
  BREAKTHROUGHS,
  BREAKTHROUGHS_BY_ID,
  BREAKTHROUGHS_BY_FACTION,
  getBreakthrough,
  getFactionBreakthrough,
  hasTechSynergy,
  getExhaustableBreakthroughs,
  getPassiveBreakthroughs,
  getBreakthroughCounts,
  type BreakthroughDef,
} from '../breakthroughs.js';
import type { TechColor } from '../../types/common.js';

describe('Breakthrough Data', () => {
  describe('breakthrough counts', () => {
    it('should have exactly 31 breakthroughs (30 factions + Obsidian)', () => {
      // 17 base + 7 PoK + 5 Thunder's Edge + 1 Obsidian + 1 Keleres = 31
      expect(BREAKTHROUGHS.length).toBe(31);
    });

    it('should have correct breakdown by category', () => {
      const counts = getBreakthroughCounts();
      expect(counts.base).toBe(17);
      expect(counts.pok).toBe(7);
      expect(counts.thundersEdge).toBe(6); // 5 TE factions + Obsidian
      expect(counts.keleres).toBe(1);
      expect(counts.total).toBe(31);
    });
  });

  describe('breakthrough structure', () => {
    it('every breakthrough should have required properties', () => {
      for (const bt of BREAKTHROUGHS) {
        expect(bt.id).toBeTruthy();
        expect(bt.factionId).toBeTruthy();
        expect(bt.name).toBeTruthy();
        expect(bt.description).toBeTruthy();
        expect(bt.expansion).toBe('thunders_edge');
        expect(typeof bt.isExhaustable).toBe('boolean');
      }
    });

    it('all breakthroughs should have unique IDs', () => {
      const ids = BREAKTHROUGHS.map(bt => bt.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('all breakthroughs should have unique faction IDs', () => {
      const factionIds = BREAKTHROUGHS.map(bt => bt.factionId);
      const uniqueFactionIds = new Set(factionIds);
      expect(uniqueFactionIds.size).toBe(factionIds.length);
    });

    it('every breakthrough except Nekro should have a synergy', () => {
      for (const bt of BREAKTHROUGHS) {
        if (bt.factionId === 'nekro') {
          expect(bt.synergy).toBeNull();
        } else {
          expect(bt.synergy).not.toBeNull();
          expect(bt.synergy?.color1).toBeTruthy();
          expect(bt.synergy?.color2).toBeTruthy();
        }
      }
    });
  });

  describe('base game faction breakthroughs', () => {
    const baseFactions = [
      'arborec', 'letnev', 'saar', 'muaat', 'hacan', 'sol', 'creuss',
      'l1z1x', 'mentak', 'naalu', 'nekro', 'sardakk', 'jolnar',
      'winnu', 'xxcha', 'yin', 'yssaril'
    ];

    it('should have breakthroughs for all 17 base factions', () => {
      for (const factionId of baseFactions) {
        const bt = getFactionBreakthrough(factionId);
        expect(bt).not.toBeNull();
        expect(bt?.factionId).toBe(factionId);
      }
    });

    it('should have Psychospore for Arborec (red/green)', () => {
      const bt = getFactionBreakthrough('arborec');
      expect(bt?.name).toBe('Psychospore');
      expect(bt?.synergy).toEqual({ color1: 'red', color2: 'green' });
      expect(bt?.isExhaustable).toBe(true);
    });

    it('should have Gravleash Maneuvers for Letnev (blue/red)', () => {
      const bt = getFactionBreakthrough('letnev');
      expect(bt?.name).toBe('Gravleash Maneuvers');
      expect(bt?.synergy).toEqual({ color1: 'blue', color2: 'red' });
    });

    it('should have Valefar Assimilator Z for Nekro (no synergy)', () => {
      const bt = getFactionBreakthrough('nekro');
      expect(bt?.name).toBe('Valefar Assimilator Z');
      expect(bt?.synergy).toBeNull();
    });
  });

  describe('Prophecy of Kings faction breakthroughs', () => {
    const pokFactions = [
      'argent', 'empyrean', 'mahact', 'naazrokha', 'nomad', 'titans', 'vuilraith'
    ];

    it('should have breakthroughs for all 7 PoK factions', () => {
      for (const factionId of pokFactions) {
        const bt = getFactionBreakthrough(factionId);
        expect(bt).not.toBeNull();
        expect(bt?.factionId).toBe(factionId);
      }
    });

    it('should have Wing Transfer for Argent Flight (blue/yellow)', () => {
      const bt = getFactionBreakthrough('argent');
      expect(bt?.name).toBe('Wing Transfer');
      expect(bt?.synergy).toEqual({ color1: 'blue', color2: 'yellow' });
    });

    it('should have Al\'Raith Ix Ianovar for Vuil\'Raith Cabal (red/green)', () => {
      const bt = getFactionBreakthrough('vuilraith');
      expect(bt?.name).toBe("Al'Raith Ix Ianovar");
      expect(bt?.synergy).toEqual({ color1: 'red', color2: 'green' });
    });
  });

  describe('Thunder\'s Edge faction breakthroughs', () => {
    const teFactions = [
      'last_bastion', 'deepwrought', 'ral_nel', 'crimson_rebellion', 'firmament', 'obsidian'
    ];

    it('should have breakthroughs for all 6 Thunder\'s Edge factions', () => {
      for (const factionId of teFactions) {
        const bt = getFactionBreakthrough(factionId);
        expect(bt).not.toBeNull();
        expect(bt?.factionId).toBe(factionId);
      }
    });

    it('should have The Icon for Last Bastion (red/yellow)', () => {
      const bt = getFactionBreakthrough('last_bastion');
      expect(bt?.name).toBe('The Icon');
      expect(bt?.synergy).toEqual({ color1: 'red', color2: 'yellow' });
      expect(bt?.isExhaustable).toBe(true);
    });

    it('should have The Sowing for Firmament (yellow/green)', () => {
      const bt = getFactionBreakthrough('firmament');
      expect(bt?.name).toBe('The Sowing');
      expect(bt?.synergy).toEqual({ color1: 'yellow', color2: 'green' });
    });

    it('should have The Reaping for Obsidian (yellow/green)', () => {
      const bt = getFactionBreakthrough('obsidian');
      expect(bt?.name).toBe('The Reaping');
      expect(bt?.synergy).toEqual({ color1: 'yellow', color2: 'green' });
    });
  });

  describe('Council Keleres breakthrough', () => {
    it('should have I.I.H.Q. Modernization for Keleres (yellow/green)', () => {
      const bt = getFactionBreakthrough('keleres');
      expect(bt?.name).toBe('I.I.H.Q. Modernization');
      expect(bt?.synergy).toEqual({ color1: 'yellow', color2: 'green' });
    });
  });
});

describe('Breakthrough Helper Functions', () => {
  describe('getBreakthrough', () => {
    it('should return breakthrough by ID', () => {
      const bt = getBreakthrough('psychospore');
      expect(bt).not.toBeNull();
      expect(bt?.name).toBe('Psychospore');
    });

    it('should return null for invalid ID', () => {
      const bt = getBreakthrough('nonexistent_breakthrough');
      expect(bt).toBeNull();
    });
  });

  describe('getFactionBreakthrough', () => {
    it('should return breakthrough by faction ID', () => {
      const bt = getFactionBreakthrough('arborec');
      expect(bt).not.toBeNull();
      expect(bt?.id).toBe('psychospore');
    });

    it('should return null for invalid faction ID', () => {
      const bt = getFactionBreakthrough('nonexistent_faction');
      expect(bt).toBeNull();
    });
  });

  describe('hasTechSynergy', () => {
    const techColors: Record<string, TechColor | undefined> = {
      'neural_motivator': 'green',
      'dacxive_animators': 'green',
      'antimass_deflectors': 'blue',
      'gravity_drive': 'blue',
      'plasma_scoring': 'red',
      'magen_defense_grid': 'red',
      'sarween_tools': 'yellow',
      'scanlink_drone_network': 'yellow',
    };

    it('should return true when player has required synergy colors', () => {
      // Green + Red = Arborec synergy
      const playerTechs = ['neural_motivator', 'plasma_scoring'];
      const arborecSynergy = { color1: 'red' as TechColor, color2: 'green' as TechColor };

      expect(hasTechSynergy(playerTechs, techColors, arborecSynergy)).toBe(true);
    });

    it('should return false when player lacks synergy colors', () => {
      // Only has blue techs, needs red/green
      const playerTechs = ['antimass_deflectors', 'gravity_drive'];
      const arborecSynergy = { color1: 'red' as TechColor, color2: 'green' as TechColor };

      expect(hasTechSynergy(playerTechs, techColors, arborecSynergy)).toBe(false);
    });

    it('should return true for Nekro (null synergy)', () => {
      const playerTechs: string[] = [];
      expect(hasTechSynergy(playerTechs, techColors, null)).toBe(true);
    });

    it('should work when same color is needed twice', () => {
      // If a synergy needed green/green
      const sameColorSynergy = { color1: 'green' as TechColor, color2: 'green' as TechColor };

      // One green tech - not enough
      expect(hasTechSynergy(['neural_motivator'], techColors, sameColorSynergy)).toBe(false);

      // Two green techs - enough
      expect(hasTechSynergy(['neural_motivator', 'dacxive_animators'], techColors, sameColorSynergy)).toBe(true);
    });
  });

  describe('getExhaustableBreakthroughs', () => {
    it('should return only exhaustable breakthroughs', () => {
      const exhaustable = getExhaustableBreakthroughs();

      expect(exhaustable.length).toBeGreaterThan(0);
      for (const bt of exhaustable) {
        expect(bt.isExhaustable).toBe(true);
      }
    });
  });

  describe('getPassiveBreakthroughs', () => {
    it('should return only non-exhaustable breakthroughs', () => {
      const passive = getPassiveBreakthroughs();

      expect(passive.length).toBeGreaterThan(0);
      for (const bt of passive) {
        expect(bt.isExhaustable).toBe(false);
      }
    });
  });
});

describe('Breakthrough Lookup Maps', () => {
  describe('BREAKTHROUGHS_BY_ID', () => {
    it('should contain all breakthroughs', () => {
      expect(Object.keys(BREAKTHROUGHS_BY_ID).length).toBe(BREAKTHROUGHS.length);
    });

    it('should map IDs to correct breakthroughs', () => {
      for (const bt of BREAKTHROUGHS) {
        expect(BREAKTHROUGHS_BY_ID[bt.id]).toBe(bt);
      }
    });
  });

  describe('BREAKTHROUGHS_BY_FACTION', () => {
    it('should contain all breakthroughs', () => {
      expect(Object.keys(BREAKTHROUGHS_BY_FACTION).length).toBe(BREAKTHROUGHS.length);
    });

    it('should map faction IDs to correct breakthroughs', () => {
      for (const bt of BREAKTHROUGHS) {
        expect(BREAKTHROUGHS_BY_FACTION[bt.factionId]).toBe(bt);
      }
    });
  });
});

describe('Breakthrough Synergy Distribution', () => {
  it('should have variety of synergy combinations', () => {
    const synergyCombos = new Set<string>();

    for (const bt of BREAKTHROUGHS) {
      if (bt.synergy) {
        // Normalize order for counting
        const colors = [bt.synergy.color1, bt.synergy.color2].sort();
        synergyCombos.add(colors.join('/'));
      }
    }

    // Should have at least 4 different combinations used
    expect(synergyCombos.size).toBeGreaterThanOrEqual(4);
  });

  it('all tech colors should be represented in synergies', () => {
    const colorsUsed = new Set<TechColor>();

    for (const bt of BREAKTHROUGHS) {
      if (bt.synergy) {
        colorsUsed.add(bt.synergy.color1);
        colorsUsed.add(bt.synergy.color2);
      }
    }

    expect(colorsUsed.has('red')).toBe(true);
    expect(colorsUsed.has('blue')).toBe(true);
    expect(colorsUsed.has('yellow')).toBe(true);
    expect(colorsUsed.has('green')).toBe(true);
  });
});
