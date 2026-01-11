import { describe, it, expect } from 'vitest';
import {
  getDefaultFleetModifiers,
  getFleetModifiers,
  getEffectiveFleetLimit,
  getDefaultHandLimitModifiers,
  getHandLimitModifiers,
  getEffectiveHandLimit,
  getDefaultTokenGainModifiers,
  getTokenGainModifiers,
  getStatusPhaseTokenGain,
} from '../fleet-modifiers.js';
import type { GameState, MapTile, PlayerState, MapState } from '@ti4/shared';

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

function createMockGameState(players: PlayerState[] = []): GameState {
  return {
    id: 'game1',
    version: 1,
    round: 1,
    phase: 'action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: [],
    players: players.length > 0 ? players : [createMockPlayer()],
    map: { tiles: [createMockTile()], playerCount: 6 } as MapState,
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

describe('Fleet Modifiers', () => {
  describe('getDefaultFleetModifiers', () => {
    it('should return default values with no bonuses', () => {
      const modifiers = getDefaultFleetModifiers();

      expect(modifiers.fleetLimitBonus).toBe(0);
    });
  });

  describe('getFleetModifiers', () => {
    it('should return default modifiers for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const modifiers = getFleetModifiers(state, 'nonexistent');

      expect(modifiers.fleetLimitBonus).toBe(0);
    });

    it('should return default modifiers for player without faction', () => {
      const player = createMockPlayer({ faction: undefined });
      const state = createMockGameState([player]);

      const modifiers = getFleetModifiers(state, 'player1');

      expect(modifiers.fleetLimitBonus).toBe(0);
    });

    describe('Barony of Letnev (ARMADA)', () => {
      it('should give +2 fleet limit bonus', () => {
        const letnevPlayer = createMockPlayer({ id: 'player1', faction: 'letnev' });
        const state = createMockGameState([letnevPlayer]);

        const modifiers = getFleetModifiers(state, 'player1');

        expect(modifiers.fleetLimitBonus).toBe(2);
      });
    });

    describe('Other factions', () => {
      it('should return default modifiers for Sol', () => {
        const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
        const state = createMockGameState([solPlayer]);

        const modifiers = getFleetModifiers(state, 'player1');

        expect(modifiers.fleetLimitBonus).toBe(0);
      });
    });
  });

  describe('getEffectiveFleetLimit', () => {
    it('should return 0 for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const limit = getEffectiveFleetLimit(state, 'nonexistent');

      expect(limit).toBe(0);
    });

    it('should return base fleet token count for normal factions', () => {
      const player = createMockPlayer({
        id: 'player1',
        faction: 'sol',
        commandTokens: { tactics: 3, fleet: 4, strategy: 2 },
      });
      const state = createMockGameState([player]);

      const limit = getEffectiveFleetLimit(state, 'player1');

      expect(limit).toBe(4);
    });

    it('should add +2 for Letnev ARMADA ability', () => {
      const letnevPlayer = createMockPlayer({
        id: 'player1',
        faction: 'letnev',
        commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
      });
      const state = createMockGameState([letnevPlayer]);

      const limit = getEffectiveFleetLimit(state, 'player1');

      expect(limit).toBe(5); // 3 base + 2 from ARMADA
    });
  });
});

describe('Hand Limit Modifiers', () => {
  describe('getDefaultHandLimitModifiers', () => {
    it('should return default values', () => {
      const modifiers = getDefaultHandLimitModifiers();

      expect(modifiers.actionCardLimitBonus).toBe(0);
      expect(modifiers.noHandLimit).toBe(false);
    });
  });

  describe('getHandLimitModifiers', () => {
    it('should return default modifiers for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const modifiers = getHandLimitModifiers(state, 'nonexistent');

      expect(modifiers.noHandLimit).toBe(false);
    });

    it('should return default modifiers for player without faction', () => {
      const player = createMockPlayer({ faction: undefined });
      const state = createMockGameState([player]);

      const modifiers = getHandLimitModifiers(state, 'player1');

      expect(modifiers.noHandLimit).toBe(false);
    });

    describe('Yssaril Tribes (CRAFTY)', () => {
      it('should have no hand limit', () => {
        const yssarilPlayer = createMockPlayer({ id: 'player1', faction: 'yssaril' });
        const state = createMockGameState([yssarilPlayer]);

        const modifiers = getHandLimitModifiers(state, 'player1');

        expect(modifiers.noHandLimit).toBe(true);
      });
    });

    describe('Other factions', () => {
      it('should have normal hand limit for Sol', () => {
        const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
        const state = createMockGameState([solPlayer]);

        const modifiers = getHandLimitModifiers(state, 'player1');

        expect(modifiers.noHandLimit).toBe(false);
      });
    });
  });

  describe('getEffectiveHandLimit', () => {
    it('should return base limit of 7 for normal factions', () => {
      const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState([solPlayer]);

      const limit = getEffectiveHandLimit(state, 'player1');

      expect(limit).toBe(7);
    });

    it('should return Infinity for Yssaril (no hand limit)', () => {
      const yssarilPlayer = createMockPlayer({ id: 'player1', faction: 'yssaril' });
      const state = createMockGameState([yssarilPlayer]);

      const limit = getEffectiveHandLimit(state, 'player1');

      expect(limit).toBe(Infinity);
    });
  });
});

describe('Token Gain Modifiers', () => {
  describe('getDefaultTokenGainModifiers', () => {
    it('should return default values', () => {
      const modifiers = getDefaultTokenGainModifiers();

      expect(modifiers.statusPhaseBonus).toBe(0);
    });
  });

  describe('getTokenGainModifiers', () => {
    it('should return default modifiers for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const modifiers = getTokenGainModifiers(state, 'nonexistent');

      expect(modifiers.statusPhaseBonus).toBe(0);
    });

    it('should return default modifiers for player without faction', () => {
      const player = createMockPlayer({ faction: undefined });
      const state = createMockGameState([player]);

      const modifiers = getTokenGainModifiers(state, 'player1');

      expect(modifiers.statusPhaseBonus).toBe(0);
    });

    describe('Federation of Sol (VERSATILE)', () => {
      it('should give +1 token during status phase', () => {
        const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
        const state = createMockGameState([solPlayer]);

        const modifiers = getTokenGainModifiers(state, 'player1');

        expect(modifiers.statusPhaseBonus).toBe(1);
      });
    });

    describe('Hyper Metabolism technology', () => {
      it('should give +1 token for any faction with the tech', () => {
        const player = createMockPlayer({
          id: 'player1',
          faction: 'hacan',
          technologies: ['hyper_metabolism'],
        });
        const state = createMockGameState([player]);

        const modifiers = getTokenGainModifiers(state, 'player1');

        expect(modifiers.statusPhaseBonus).toBe(1);
      });

      it('should stack with Sol VERSATILE ability', () => {
        const solPlayer = createMockPlayer({
          id: 'player1',
          faction: 'sol',
          technologies: ['hyper_metabolism'],
        });
        const state = createMockGameState([solPlayer]);

        const modifiers = getTokenGainModifiers(state, 'player1');

        expect(modifiers.statusPhaseBonus).toBe(2); // 1 from Sol + 1 from tech
      });
    });

    describe('Other factions without tech', () => {
      it('should return 0 bonus for Hacan without tech', () => {
        const hacanPlayer = createMockPlayer({ id: 'player1', faction: 'hacan' });
        const state = createMockGameState([hacanPlayer]);

        const modifiers = getTokenGainModifiers(state, 'player1');

        expect(modifiers.statusPhaseBonus).toBe(0);
      });
    });
  });

  describe('getStatusPhaseTokenGain', () => {
    it('should return base 2 tokens for normal factions', () => {
      const hacanPlayer = createMockPlayer({ id: 'player1', faction: 'hacan' });
      const state = createMockGameState([hacanPlayer]);

      const tokens = getStatusPhaseTokenGain(state, 'player1');

      expect(tokens).toBe(2);
    });

    it('should return 3 tokens for Sol', () => {
      const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState([solPlayer]);

      const tokens = getStatusPhaseTokenGain(state, 'player1');

      expect(tokens).toBe(3); // 2 base + 1 from VERSATILE
    });

    it('should return 3 tokens for faction with Hyper Metabolism', () => {
      const player = createMockPlayer({
        id: 'player1',
        faction: 'hacan',
        technologies: ['hyper_metabolism'],
      });
      const state = createMockGameState([player]);

      const tokens = getStatusPhaseTokenGain(state, 'player1');

      expect(tokens).toBe(3); // 2 base + 1 from tech
    });

    it('should return 4 tokens for Sol with Hyper Metabolism', () => {
      const solPlayer = createMockPlayer({
        id: 'player1',
        faction: 'sol',
        technologies: ['hyper_metabolism'],
      });
      const state = createMockGameState([solPlayer]);

      const tokens = getStatusPhaseTokenGain(state, 'player1');

      expect(tokens).toBe(4); // 2 base + 1 from VERSATILE + 1 from tech
    });
  });
});
