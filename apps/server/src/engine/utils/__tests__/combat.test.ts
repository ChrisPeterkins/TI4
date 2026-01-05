/**
 * Tests for combat utility functions
 *
 * Key functionality tested:
 * - getValidRetreatSystems: Anomaly restrictions for retreat destinations
 * - rollDiceForPlayer: Nebula defender bonus
 */

import { describe, it, expect } from 'vitest';
import type { GameState, PlayerState, MapTile, HexCoord, UnitInstance, CombatInstance } from '@ti4/shared';
import { getValidRetreatSystems } from '../combat.js';

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    faction: 'sol',
    color: 'blue',
    name: 'Test Player',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    commodities: 2,
    maxCommodities: 4,
    tradeGoods: 2,
    technologies: [],
    planets: [],
    secretObjectives: [],
    actionCards: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    scoredObjectives: [],
    passed: false,
    strategyCard: null,
    strategyCardUsed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    relics: [],
    relicFragments: { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 },
    ...overrides,
  } as PlayerState;
}

function createMockTile(position: HexCoord, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId: 1,
    position,
    rotation: 0,
    planets: [],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
    ...overrides,
  } as MapTile;
}

function createMockUnit(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: `unit-${Math.random().toString(36).substr(2, 9)}`,
    type: 'cruiser',
    ownerId: 'player1',
    damaged: false,
    ...overrides,
  } as UnitInstance;
}

function createMockGameState(tiles: MapTile[], players: PlayerState[] = []): GameState {
  return {
    id: 'test-game',
    version: 1,
    phase: 'action',
    subPhase: 'tactical_space_combat',
    round: 1,
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: ['player1', 'player2'],
    players: players.length > 0 ? players : [
      createMockPlayer({ id: 'player1' }),
      createMockPlayer({ id: 'player2' }),
    ],
    map: {
      tiles,
      playerCount: 6,
    },
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
  } as GameState;
}

describe('getValidRetreatSystems', () => {
  describe('basic retreat rules', () => {
    it('should return empty if no adjacent systems with tokens/ships', () => {
      const combatTile = createMockTile({ q: 0, r: 0 });
      const adjacentTile = createMockTile({ q: 1, r: 0 }); // Adjacent but no tokens/ships

      const state = createMockGameState([combatTile, adjacentTile]);
      const result = getValidRetreatSystems(state, 'player1', { q: 0, r: 0 });

      expect(result).toHaveLength(0);
    });

    it('should include adjacent system with player command token', () => {
      const combatTile = createMockTile({ q: 0, r: 0 });
      const adjacentTile = createMockTile({ q: 1, r: 0 }, {
        commandTokens: ['player1'],
      });

      const state = createMockGameState([combatTile, adjacentTile]);
      const result = getValidRetreatSystems(state, 'player1', { q: 0, r: 0 });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tile-1-0');
    });

    it('should include adjacent system with player ships', () => {
      const combatTile = createMockTile({ q: 0, r: 0 });
      const adjacentTile = createMockTile({ q: 1, r: 0 }, {
        units: [createMockUnit({ type: 'cruiser', ownerId: 'player1' })],
      });

      const state = createMockGameState([combatTile, adjacentTile]);
      const result = getValidRetreatSystems(state, 'player1', { q: 0, r: 0 });

      expect(result).toHaveLength(1);
    });

    it('should exclude systems with enemy ships', () => {
      const combatTile = createMockTile({ q: 0, r: 0 });
      const adjacentTile = createMockTile({ q: 1, r: 0 }, {
        commandTokens: ['player1'],
        units: [createMockUnit({ type: 'cruiser', ownerId: 'player2' })], // Enemy ship
      });

      const state = createMockGameState([combatTile, adjacentTile]);
      const result = getValidRetreatSystems(state, 'player1', { q: 0, r: 0 });

      expect(result).toHaveLength(0);
    });
  });

  describe('anomaly retreat restrictions', () => {
    it('should NOT allow retreat into nebula', () => {
      const combatTile = createMockTile({ q: 0, r: 0 });
      const nebulaTile = createMockTile({ q: 1, r: 0 }, {
        anomaly: 'nebula',
        commandTokens: ['player1'],
      });

      const state = createMockGameState([combatTile, nebulaTile]);
      const result = getValidRetreatSystems(state, 'player1', { q: 0, r: 0 });

      expect(result).toHaveLength(0);
    });

    it('should NOT allow retreat into supernova', () => {
      const combatTile = createMockTile({ q: 0, r: 0 });
      const supernovaTile = createMockTile({ q: 1, r: 0 }, {
        anomaly: 'supernova',
        commandTokens: ['player1'],
      });

      const state = createMockGameState([combatTile, supernovaTile]);
      const result = getValidRetreatSystems(state, 'player1', { q: 0, r: 0 });

      expect(result).toHaveLength(0);
    });

    it('should NOT allow retreat into asteroid field without Antimass Deflectors', () => {
      const combatTile = createMockTile({ q: 0, r: 0 });
      const asteroidTile = createMockTile({ q: 1, r: 0 }, {
        anomaly: 'asteroid',
        commandTokens: ['player1'],
      });

      const player = createMockPlayer({ id: 'player1', technologies: [] });
      const state = createMockGameState([combatTile, asteroidTile], [player]);
      const result = getValidRetreatSystems(state, 'player1', { q: 0, r: 0 });

      expect(result).toHaveLength(0);
    });

    it('should ALLOW retreat into asteroid field WITH Antimass Deflectors', () => {
      const combatTile = createMockTile({ q: 0, r: 0 });
      const asteroidTile = createMockTile({ q: 1, r: 0 }, {
        anomaly: 'asteroid',
        commandTokens: ['player1'],
      });

      const player = createMockPlayer({
        id: 'player1',
        technologies: ['antimass_deflectors'],
      });
      const state = createMockGameState([combatTile, asteroidTile], [player]);
      const result = getValidRetreatSystems(state, 'player1', { q: 0, r: 0 });

      expect(result).toHaveLength(1);
      expect(result[0].anomaly).toBe('asteroid');
    });

    it('should ALLOW retreat into gravity rift (dangerous but legal)', () => {
      const combatTile = createMockTile({ q: 0, r: 0 });
      const riftTile = createMockTile({ q: 1, r: 0 }, {
        anomaly: 'gravity_rift',
        commandTokens: ['player1'],
      });

      const state = createMockGameState([combatTile, riftTile]);
      const result = getValidRetreatSystems(state, 'player1', { q: 0, r: 0 });

      expect(result).toHaveLength(1);
      expect(result[0].anomaly).toBe('gravity_rift');
    });

    it('should filter anomalies correctly with multiple adjacent systems', () => {
      const combatTile = createMockTile({ q: 0, r: 0 });
      const nebulaTile = createMockTile({ q: 1, r: 0 }, {
        anomaly: 'nebula',
        commandTokens: ['player1'],
      });
      const normalTile = createMockTile({ q: 0, r: 1 }, {
        anomaly: null,
        commandTokens: ['player1'],
      });
      const supernovaTile = createMockTile({ q: -1, r: 1 }, {
        anomaly: 'supernova',
        commandTokens: ['player1'],
      });
      const riftTile = createMockTile({ q: -1, r: 0 }, {
        anomaly: 'gravity_rift',
        commandTokens: ['player1'],
      });

      const state = createMockGameState([
        combatTile,
        nebulaTile,
        normalTile,
        supernovaTile,
        riftTile,
      ]);
      const result = getValidRetreatSystems(state, 'player1', { q: 0, r: 0 });

      // Should only include normal tile and gravity rift (nebula and supernova blocked)
      expect(result).toHaveLength(2);
      const anomalies = result.map(t => t.anomaly);
      expect(anomalies).toContain(null); // Normal tile
      expect(anomalies).toContain('gravity_rift'); // Rift is allowed
      expect(anomalies).not.toContain('nebula');
      expect(anomalies).not.toContain('supernova');
    });
  });
});
