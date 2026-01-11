import { describe, it, expect } from 'vitest';
import {
  getDefaultProductionModifiers,
  getProductionModifiers,
  canProduceUnitType,
  getSaarProductionCapacity,
  isFloatingDock,
  getProductionCostModifier,
  hasSarweenToolsDiscount,
  getEffectiveUnitCost,
} from '../production-modifiers.js';
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

describe('Production Modifiers', () => {
  describe('getDefaultProductionModifiers', () => {
    it('should return default values', () => {
      const modifiers = getDefaultProductionModifiers();

      expect(modifiers.capacityBonus).toBe(0);
      expect(modifiers.blockedUnits).toEqual([]);
      expect(modifiers.costModifier).toBe(0);
    });
  });

  describe('getProductionModifiers', () => {
    it('should return default modifiers for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const modifiers = getProductionModifiers(state, 'nonexistent');

      expect(modifiers.blockedUnits).toEqual([]);
    });

    it('should return default modifiers for player without faction', () => {
      const player = createMockPlayer({ faction: undefined });
      const state = createMockGameState([player]);

      const modifiers = getProductionModifiers(state, 'player1');

      expect(modifiers.blockedUnits).toEqual([]);
    });

    describe('Arborec (MITOSIS)', () => {
      it('should block infantry production from space docks', () => {
        const arborecPlayer = createMockPlayer({ id: 'player1', faction: 'arborec' });
        const state = createMockGameState([arborecPlayer]);

        const modifiers = getProductionModifiers(state, 'player1');

        expect(modifiers.blockedUnits).toContain('infantry');
      });
    });

    describe('Clan of Saar (NOMADIC)', () => {
      it('should return default modifiers (Production 5 handled differently)', () => {
        const saarPlayer = createMockPlayer({ id: 'player1', faction: 'saar' });
        const state = createMockGameState([saarPlayer]);

        const modifiers = getProductionModifiers(state, 'player1');

        // Saar docks have Production 5, but this is handled in getSaarProductionCapacity
        expect(modifiers.capacityBonus).toBe(0);
      });
    });

    describe('Other factions', () => {
      it('should return default modifiers for Sol', () => {
        const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
        const state = createMockGameState([solPlayer]);

        const modifiers = getProductionModifiers(state, 'player1');

        expect(modifiers.blockedUnits).toEqual([]);
      });
    });
  });

  describe('canProduceUnitType', () => {
    it('should allow any unit for normal factions', () => {
      const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState([solPlayer]);

      expect(canProduceUnitType(state, 'player1', 'infantry')).toBe(true);
      expect(canProduceUnitType(state, 'player1', 'fighter')).toBe(true);
      expect(canProduceUnitType(state, 'player1', 'carrier')).toBe(true);
    });

    it('should block infantry for Arborec', () => {
      const arborecPlayer = createMockPlayer({ id: 'player1', faction: 'arborec' });
      const state = createMockGameState([arborecPlayer]);

      expect(canProduceUnitType(state, 'player1', 'infantry')).toBe(false);
    });

    it('should allow other units for Arborec', () => {
      const arborecPlayer = createMockPlayer({ id: 'player1', faction: 'arborec' });
      const state = createMockGameState([arborecPlayer]);

      expect(canProduceUnitType(state, 'player1', 'fighter')).toBe(true);
      expect(canProduceUnitType(state, 'player1', 'carrier')).toBe(true);
    });
  });

  describe('getSaarProductionCapacity', () => {
    it('should return 0 for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const capacity = getSaarProductionCapacity(state, 'nonexistent', 'system-1');

      expect(capacity).toBe(0);
    });

    it('should return 0 for non-Saar faction', () => {
      const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState([solPlayer]);

      const capacity = getSaarProductionCapacity(state, 'player1', 'system-1');

      expect(capacity).toBe(0);
    });

    it('should return 0 for system not found', () => {
      const saarPlayer = createMockPlayer({ id: 'player1', faction: 'saar' });
      const state = createMockGameState([saarPlayer]);

      const capacity = getSaarProductionCapacity(state, 'player1', 'nonexistent');

      expect(capacity).toBe(0);
    });

    it('should return 5 per dock for base Saar space dock', () => {
      const saarPlayer = createMockPlayer({ id: 'player1', faction: 'saar' });
      const tile = createMockTile({
        id: 'system-1',
        units: [createMockUnit({ type: 'space_dock', ownerId: 'player1' })],
      });
      const state = createMockGameState([saarPlayer], [tile]);

      const capacity = getSaarProductionCapacity(state, 'player1', 'system-1');

      expect(capacity).toBe(5);
    });

    it('should return 10 for two base Saar space docks', () => {
      const saarPlayer = createMockPlayer({ id: 'player1', faction: 'saar' });
      const tile = createMockTile({
        id: 'system-1',
        units: [
          createMockUnit({ id: 'dock-1', type: 'space_dock', ownerId: 'player1' }),
          createMockUnit({ id: 'dock-2', type: 'space_dock', ownerId: 'player1' }),
        ],
      });
      const state = createMockGameState([saarPlayer], [tile]);

      const capacity = getSaarProductionCapacity(state, 'player1', 'system-1');

      expect(capacity).toBe(10);
    });

    it('should return 7 per dock with Space Dock II upgrade', () => {
      const saarPlayer = createMockPlayer({
        id: 'player1',
        faction: 'saar',
        technologies: ['space_dock_ii'],
      });
      const tile = createMockTile({
        id: 'system-1',
        units: [createMockUnit({ type: 'space_dock', ownerId: 'player1' })],
      });
      const state = createMockGameState([saarPlayer], [tile]);

      const capacity = getSaarProductionCapacity(state, 'player1', 'system-1');

      expect(capacity).toBe(7);
    });

    it('should not count space docks owned by other players', () => {
      const saarPlayer = createMockPlayer({ id: 'player1', faction: 'saar' });
      const otherPlayer = createMockPlayer({ id: 'player2', faction: 'sol' });
      const tile = createMockTile({
        id: 'system-1',
        units: [
          createMockUnit({ type: 'space_dock', ownerId: 'player2' }),
        ],
      });
      const state = createMockGameState([saarPlayer, otherPlayer], [tile]);

      const capacity = getSaarProductionCapacity(state, 'player1', 'system-1');

      expect(capacity).toBe(0);
    });
  });

  describe('isFloatingDock', () => {
    it('should return true for Saar', () => {
      const saarPlayer = createMockPlayer({ id: 'player1', faction: 'saar' });
      const state = createMockGameState([saarPlayer]);

      expect(isFloatingDock(state, 'player1')).toBe(true);
    });

    it('should return false for other factions', () => {
      const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState([solPlayer]);

      expect(isFloatingDock(state, 'player1')).toBe(false);
    });

    it('should return false for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      expect(isFloatingDock(state, 'nonexistent')).toBe(false);
    });
  });

  describe('getProductionCostModifier', () => {
    it('should return 0 for normal factions', () => {
      const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState([solPlayer]);

      const modifier = getProductionCostModifier(state, 'player1', 'cruiser');

      expect(modifier).toBe(0);
    });
  });

  describe('hasSarweenToolsDiscount', () => {
    it('should return false for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      expect(hasSarweenToolsDiscount(state, 'nonexistent')).toBe(false);
    });

    it('should return false without Sarween Tools', () => {
      const player = createMockPlayer({ id: 'player1' });
      const state = createMockGameState([player]);

      expect(hasSarweenToolsDiscount(state, 'player1')).toBe(false);
    });

    it('should return true with Sarween Tools', () => {
      const player = createMockPlayer({
        id: 'player1',
        technologies: ['sarween_tools'],
      });
      const state = createMockGameState([player]);

      expect(hasSarweenToolsDiscount(state, 'player1')).toBe(true);
    });
  });

  describe('getEffectiveUnitCost', () => {
    it('should return base cost for normal factions', () => {
      const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState([solPlayer]);

      const cost = getEffectiveUnitCost(state, 'player1', 'cruiser', 2);

      expect(cost).toBe(2);
    });

    it('should not go below 0', () => {
      // If there's a large cost reduction (hypothetically)
      const player = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState([player]);

      // With base cost 0, should stay at 0
      const cost = getEffectiveUnitCost(state, 'player1', 'fighter', 0);

      expect(cost).toBe(0);
    });

    it('should apply faction cost modifiers', () => {
      // Currently no factions have cost modifiers in the implementation
      // This test verifies the structure works
      const solPlayer = createMockPlayer({ id: 'player1', faction: 'sol' });
      const state = createMockGameState([solPlayer]);

      const cost = getEffectiveUnitCost(state, 'player1', 'dreadnought', 4);

      expect(cost).toBe(4);
    });
  });
});
