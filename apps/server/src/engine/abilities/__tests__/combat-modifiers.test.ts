import { describe, it, expect } from 'vitest';
import {
  getDefaultCombatModifiers,
  getFactionCombatModifiers,
  getCombatModifiers,
  applyHitModifier,
  isHit,
  getOpponentEffectsOnCombat,
} from '../combat-modifiers.js';
import type { GameState, MapTile, PlayerState, MapState, UnitInstance } from '@ti4/shared';

function createMockUnit(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: 'unit-1',
    type: 'fighter',
    ownerId: 'player1',
    damaged: false,
    ...overrides,
  };
}

function createMockTile(overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: 'tile-1',
    systemId: 1,
    position: { q: 0, r: 0 },
    rotation: 0,
    planets: [],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
    ...overrides,
  };
}

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Player 1',
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    technologies: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    planets: [],
    strategyCard: null,
    strategyCardUsed: false,
    passed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
    ...overrides,
  };
}

function createMockGameState(
  players: PlayerState[] = [],
  tiles: MapTile[] = []
): GameState {
  return {
    id: 'game1',
    version: 1,
    round: 1,
    phase: 'action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: [],
    players: players.length > 0 ? players : [createMockPlayer()],
    map: {
      tiles: tiles.length > 0 ? tiles : [createMockTile()],
      playerCount: 6,
    } as MapState,
    strategyCards: [],
    objectives: {
      publicStageI: [],
      publicStageII: [],
      revealedCount: 0,
      secretDeck: [],
    },
    agendas: {
      currentAgenda: null,
      currentAgendaNumber: 1,
      votes: new Map(),
      outcome: null,
      riders: [],
    },
    actionCardDeck: [],
    actionCardDiscard: [],
    agendaDeck: [],
    agendaDiscard: [],
    laws: [],
    custodiansTaken: false,
    activeCombat: null,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    gameLog: [],
  };
}

describe('Combat Modifiers', () => {
  describe('getDefaultCombatModifiers', () => {
    it('should return default values with no bonuses', () => {
      const modifiers = getDefaultCombatModifiers();

      expect(modifiers.hitModifier).toBe(0);
      expect(modifiers.additionalDice).toBe(0);
      expect(modifiers.rerollCount).toBe(0);
      expect(modifiers.canRerollAll).toBe(false);
      expect(modifiers.hitThresholdOverride).toBeUndefined();
      expect(modifiers.assignToNonFighters).toBe(false);
      expect(modifiers.opponentCanSustain).toBe(true);
      expect(modifiers.descriptions).toEqual([]);
    });
  });

  describe('getFactionCombatModifiers', () => {
    it('should return default modifiers for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const modifiers = getFactionCombatModifiers(state, 'nonexistent', 'space');

      expect(modifiers.hitModifier).toBe(0);
    });

    it('should return default modifiers for player without faction', () => {
      const player = createMockPlayer({ faction: undefined });
      const state = createMockGameState([player]);

      const modifiers = getFactionCombatModifiers(state, 'player1', 'space');

      expect(modifiers.hitModifier).toBe(0);
    });

    describe("Sardakk N'orr (UNRELENTING)", () => {
      it('should give +1 to all combat rolls', () => {
        const sardakkPlayer = createMockPlayer({ id: 'player1', faction: 'sardakk' });
        const state = createMockGameState([sardakkPlayer]);

        const modifiers = getFactionCombatModifiers(state, 'player1', 'space');

        expect(modifiers.hitModifier).toBe(1);
        expect(modifiers.descriptions).toContain('Unrelenting: +1 combat');
      });

      it('should apply to ground combat as well', () => {
        const sardakkPlayer = createMockPlayer({ id: 'player1', faction: 'sardakk' });
        const state = createMockGameState([sardakkPlayer]);

        const modifiers = getFactionCombatModifiers(state, 'player1', 'ground');

        expect(modifiers.hitModifier).toBe(1);
      });
    });

    describe('Jol-Nar (FRAGILE)', () => {
      it('should give -1 to all combat rolls', () => {
        const jolnarPlayer = createMockPlayer({ id: 'player1', faction: 'jolnar' });
        const state = createMockGameState([jolnarPlayer]);

        const modifiers = getFactionCombatModifiers(state, 'player1', 'space');

        expect(modifiers.hitModifier).toBe(-1);
        expect(modifiers.descriptions).toContain('Fragile: -1 combat');
      });

      it('should apply to ground combat as well', () => {
        const jolnarPlayer = createMockPlayer({ id: 'player1', faction: 'jolnar' });
        const state = createMockGameState([jolnarPlayer]);

        const modifiers = getFactionCombatModifiers(state, 'player1', 'ground');

        expect(modifiers.hitModifier).toBe(-1);
      });
    });

    describe('Mentak Coalition (Fourth Moon flagship)', () => {
      it('should prevent opponent sustain when flagship is in system', () => {
        const mentakPlayer = createMockPlayer({ id: 'player1', faction: 'mentak' });
        const tile = createMockTile({
          id: 'system-1',
          units: [createMockUnit({ type: 'flagship', ownerId: 'player1' })],
        });
        const state = createMockGameState([mentakPlayer], [tile]);

        const modifiers = getFactionCombatModifiers(state, 'player1', 'space', {
          systemId: 'system-1',
        });

        expect(modifiers.opponentCanSustain).toBe(false);
        expect(modifiers.descriptions).toContain('Fourth Moon: opponent cannot sustain');
      });

      it('should not affect combat when flagship is not in system', () => {
        const mentakPlayer = createMockPlayer({ id: 'player1', faction: 'mentak' });
        const tile = createMockTile({
          id: 'system-1',
          units: [createMockUnit({ type: 'cruiser', ownerId: 'player1' })],
        });
        const state = createMockGameState([mentakPlayer], [tile]);

        const modifiers = getFactionCombatModifiers(state, 'player1', 'space', {
          systemId: 'system-1',
        });

        expect(modifiers.opponentCanSustain).toBe(true);
      });

      it('should not affect combat when no context is provided', () => {
        const mentakPlayer = createMockPlayer({ id: 'player1', faction: 'mentak' });
        const state = createMockGameState([mentakPlayer]);

        const modifiers = getFactionCombatModifiers(state, 'player1', 'space');

        expect(modifiers.opponentCanSustain).toBe(true);
      });
    });

    describe('Letnev', () => {
      it('should return default modifiers (Munitions Reserves handled separately)', () => {
        const letnevPlayer = createMockPlayer({ id: 'player1', faction: 'letnev' });
        const state = createMockGameState([letnevPlayer]);

        const modifiers = getFactionCombatModifiers(state, 'player1', 'space');

        expect(modifiers.hitModifier).toBe(0);
      });
    });

    describe('Generic faction', () => {
      it('should return default modifiers for Sol', () => {
        const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
        const state = createMockGameState([solPlayer]);

        const modifiers = getFactionCombatModifiers(state, 'player1', 'space');

        expect(modifiers.hitModifier).toBe(0);
        expect(modifiers.descriptions).toEqual([]);
      });
    });
  });

  describe('getCombatModifiers', () => {
    it('should aggregate faction modifiers', () => {
      const sardakkPlayer = createMockPlayer({ id: 'player1', faction: 'sardakk' });
      const state = createMockGameState([sardakkPlayer]);

      const modifiers = getCombatModifiers(state, 'player1', 'space');

      expect(modifiers.hitModifier).toBe(1);
    });
  });

  describe('applyHitModifier', () => {
    it('should reduce effective combat value with positive modifier', () => {
      const modifiers = {
        ...getDefaultCombatModifiers(),
        hitModifier: 2,
      };

      // Base combat value 7 with +2 modifier = effective 5
      const effectiveValue = applyHitModifier(7, modifiers);

      expect(effectiveValue).toBe(5);
    });

    it('should increase effective combat value with negative modifier', () => {
      const modifiers = {
        ...getDefaultCombatModifiers(),
        hitModifier: -1,
      };

      // Base combat value 7 with -1 modifier = effective 8
      const effectiveValue = applyHitModifier(7, modifiers);

      expect(effectiveValue).toBe(8);
    });

    it('should not go below 1', () => {
      const modifiers = {
        ...getDefaultCombatModifiers(),
        hitModifier: 10,
      };

      // Base combat value 5 with +10 modifier would be -5, clamped to 1
      const effectiveValue = applyHitModifier(5, modifiers);

      expect(effectiveValue).toBe(1);
    });

    it('should not go above 10', () => {
      const modifiers = {
        ...getDefaultCombatModifiers(),
        hitModifier: -5,
      };

      // Base combat value 8 with -5 modifier would be 13, clamped to 10
      const effectiveValue = applyHitModifier(8, modifiers);

      expect(effectiveValue).toBe(10);
    });

    it('should handle zero modifier', () => {
      const modifiers = getDefaultCombatModifiers();

      const effectiveValue = applyHitModifier(7, modifiers);

      expect(effectiveValue).toBe(7);
    });
  });

  describe('isHit', () => {
    it('should return true when roll equals effective combat value', () => {
      const modifiers = getDefaultCombatModifiers();

      // Roll 7, combat value 7, no modifiers
      expect(isHit(7, 7, modifiers)).toBe(true);
    });

    it('should return true when roll exceeds effective combat value', () => {
      const modifiers = getDefaultCombatModifiers();

      // Roll 9, combat value 7
      expect(isHit(9, 7, modifiers)).toBe(true);
    });

    it('should return false when roll is below effective combat value', () => {
      const modifiers = getDefaultCombatModifiers();

      // Roll 6, combat value 7
      expect(isHit(6, 7, modifiers)).toBe(false);
    });

    it('should apply hit modifier to calculation', () => {
      const modifiers = {
        ...getDefaultCombatModifiers(),
        hitModifier: 2, // +2 makes it easier
      };

      // Roll 5, base combat value 7, modifier +2 = effective 5
      // Roll 5 >= 5, so hit
      expect(isHit(5, 7, modifiers)).toBe(true);
    });

    it('should apply negative hit modifier', () => {
      const modifiers = {
        ...getDefaultCombatModifiers(),
        hitModifier: -1, // -1 makes it harder
      };

      // Roll 7, base combat value 7, modifier -1 = effective 8
      // Roll 7 < 8, so miss
      expect(isHit(7, 7, modifiers)).toBe(false);
    });

    it('should always hit on 10 (natural 10 is always a hit)', () => {
      const modifiers = {
        ...getDefaultCombatModifiers(),
        hitModifier: -5, // Even with big penalty
      };

      // Roll 10 should hit even with effective combat value of 10+5=15->10
      // But actually after clamping, effective value is 10
      // Roll 10 >= 10, so hit
      expect(isHit(10, 5, modifiers)).toBe(true);
    });
  });

  describe('getOpponentEffectsOnCombat', () => {
    it('should return default values when opponent not found', () => {
      const player = createMockPlayer({ id: 'player1' });
      const state = createMockGameState([player]);

      const effects = getOpponentEffectsOnCombat(
        state,
        'player1',
        'nonexistent',
        'space'
      );

      expect(effects.canSustainDamage).toBe(true);
      expect(effects.hitPenalty).toBe(0);
    });

    it('should return default values when opponent has no faction', () => {
      const player = createMockPlayer({ id: 'player1' });
      const opponent = createMockPlayer({ id: 'player2', faction: undefined });
      const state = createMockGameState([player, opponent]);

      const effects = getOpponentEffectsOnCombat(
        state,
        'player1',
        'player2',
        'space'
      );

      expect(effects.canSustainDamage).toBe(true);
    });

    describe('Mentak Fourth Moon effect', () => {
      it('should prevent sustain when Mentak flagship is in system', () => {
        const player = createMockPlayer({ id: 'player1' });
        const mentakOpponent = createMockPlayer({ id: 'player2', faction: 'mentak' });
        const tile = createMockTile({
          id: 'system-1',
          units: [createMockUnit({ type: 'flagship', ownerId: 'player2' })],
        });
        const state = createMockGameState([player, mentakOpponent], [tile]);

        const effects = getOpponentEffectsOnCombat(
          state,
          'player1',
          'player2',
          'space',
          { systemId: 'system-1' }
        );

        expect(effects.canSustainDamage).toBe(false);
      });

      it('should allow sustain when Mentak flagship is not in system', () => {
        const player = createMockPlayer({ id: 'player1' });
        const mentakOpponent = createMockPlayer({ id: 'player2', faction: 'mentak' });
        const tile = createMockTile({
          id: 'system-1',
          units: [createMockUnit({ type: 'cruiser', ownerId: 'player2' })],
        });
        const state = createMockGameState([player, mentakOpponent], [tile]);

        const effects = getOpponentEffectsOnCombat(
          state,
          'player1',
          'player2',
          'space',
          { systemId: 'system-1' }
        );

        expect(effects.canSustainDamage).toBe(true);
      });
    });

    describe("Sardakk N'orr C'Morran N'orr effect", () => {
      it('should not affect opponent directly', () => {
        const player = createMockPlayer({ id: 'player1' });
        const sardakkOpponent = createMockPlayer({ id: 'player2', faction: 'sardakk' });
        const tile = createMockTile({
          id: 'system-1',
          units: [createMockUnit({ type: 'flagship', ownerId: 'player2' })],
        });
        const state = createMockGameState([player, sardakkOpponent], [tile]);

        const effects = getOpponentEffectsOnCombat(
          state,
          'player1',
          'player2',
          'space',
          { systemId: 'system-1' }
        );

        expect(effects.canSustainDamage).toBe(true);
        expect(effects.hitPenalty).toBe(0);
      });
    });
  });
});
