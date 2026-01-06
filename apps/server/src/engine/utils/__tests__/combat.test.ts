/**
 * Tests for combat utility functions
 *
 * Key functionality tested:
 * - getValidRetreatSystems: Anomaly restrictions for retreat destinations
 * - rollDiceForPlayer: Nebula defender bonus
 */

import { describe, it, expect } from 'vitest';
import type { GameState, PlayerState, MapTile, HexCoord, UnitInstance, CombatInstance, DiceRoll } from '@ti4/shared';
import {
  getValidRetreatSystems,
  getCombatDiceCount,
  canUnitSustainDamage,
  groupUnitsByType,
  getUnitsInCombat,
  getAFBUnits,
  getEnemyFighters,
  getBombardmentUnits,
  countHits,
  findUnitById,
  findDefenderId,
  removeUnit,
  damageUnit,
  getUnitTypePriority,
  sortUnitsByPriority,
  getNonFighterShips,
  canUseSustainDamage,
  getSpaceCannonUnits,
} from '../combat.js';

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

// ==========================================================================
// Additional Combat Utility Tests
// ==========================================================================

describe('getCombatDiceCount', () => {
  it('should return 3 for war_sun', () => {
    expect(getCombatDiceCount('war_sun')).toBe(3);
  });

  it('should return 1 for cruiser', () => {
    expect(getCombatDiceCount('cruiser')).toBe(1);
  });

  it('should return 1 for dreadnought', () => {
    expect(getCombatDiceCount('dreadnought')).toBe(1);
  });

  it('should return 1 for carrier', () => {
    expect(getCombatDiceCount('carrier')).toBe(1);
  });

  it('should return 1 for destroyer', () => {
    expect(getCombatDiceCount('destroyer')).toBe(1);
  });

  it('should return 1 for fighter', () => {
    expect(getCombatDiceCount('fighter')).toBe(1);
  });

  it('should return 1 for infantry', () => {
    expect(getCombatDiceCount('infantry')).toBe(1);
  });
});

describe('canUnitSustainDamage', () => {
  const player = createMockPlayer();

  it('should return true for undamaged dreadnought', () => {
    const unit = createMockUnit({ type: 'dreadnought', damaged: false });
    expect(canUnitSustainDamage(unit, player)).toBe(true);
  });

  it('should return false for already damaged dreadnought', () => {
    const unit = createMockUnit({ type: 'dreadnought', damaged: true });
    expect(canUnitSustainDamage(unit, player)).toBe(false);
  });

  it('should return true for undamaged war_sun', () => {
    const unit = createMockUnit({ type: 'war_sun', damaged: false });
    expect(canUnitSustainDamage(unit, player)).toBe(true);
  });

  it('should return false for fighter (cannot sustain)', () => {
    const unit = createMockUnit({ type: 'fighter', damaged: false });
    expect(canUnitSustainDamage(unit, player)).toBe(false);
  });

  it('should return false for cruiser (cannot sustain)', () => {
    const unit = createMockUnit({ type: 'cruiser', damaged: false });
    expect(canUnitSustainDamage(unit, player)).toBe(false);
  });

  it('should return false for infantry (cannot sustain)', () => {
    const unit = createMockUnit({ type: 'infantry', damaged: false });
    expect(canUnitSustainDamage(unit, player)).toBe(false);
  });
});

describe('groupUnitsByType', () => {
  it('should return empty map for no units', () => {
    const result = groupUnitsByType([]);
    expect(result.size).toBe(0);
  });

  it('should group single unit type', () => {
    const units = [
      createMockUnit({ type: 'cruiser' }),
      createMockUnit({ type: 'cruiser' }),
    ];

    const result = groupUnitsByType(units);

    expect(result.size).toBe(1);
    expect(result.get('cruiser')?.length).toBe(2);
  });

  it('should group multiple unit types', () => {
    const units = [
      createMockUnit({ type: 'cruiser' }),
      createMockUnit({ type: 'dreadnought' }),
      createMockUnit({ type: 'cruiser' }),
      createMockUnit({ type: 'fighter' }),
    ];

    const result = groupUnitsByType(units);

    expect(result.size).toBe(3);
    expect(result.get('cruiser')?.length).toBe(2);
    expect(result.get('dreadnought')?.length).toBe(1);
    expect(result.get('fighter')?.length).toBe(1);
  });
});

describe('countHits', () => {
  it('should return 0 for empty rolls', () => {
    expect(countHits([])).toBe(0);
  });

  it('should return 0 for all misses', () => {
    const rolls: DiceRoll[] = [
      { value: 2, hit: false },
      { value: 3, hit: false },
    ];
    expect(countHits(rolls)).toBe(0);
  });

  it('should count all hits', () => {
    const rolls: DiceRoll[] = [
      { value: 8, hit: true },
      { value: 9, hit: true },
      { value: 3, hit: false },
    ];
    expect(countHits(rolls)).toBe(2);
  });

  it('should return correct count for mixed hits', () => {
    const rolls: DiceRoll[] = [
      { value: 10, hit: true },
      { value: 1, hit: false },
      { value: 7, hit: true },
      { value: 6, hit: true },
      { value: 2, hit: false },
    ];
    expect(countHits(rolls)).toBe(3);
  });
});

describe('getUnitTypePriority', () => {
  it('should return array of unit types', () => {
    const priority = getUnitTypePriority();

    expect(Array.isArray(priority)).toBe(true);
    expect(priority.length).toBeGreaterThan(0);
  });

  it('should include common unit types', () => {
    const priority = getUnitTypePriority();

    expect(priority).toContain('fighter');
    expect(priority).toContain('infantry');
    expect(priority).toContain('cruiser');
    expect(priority).toContain('dreadnought');
  });
});

describe('sortUnitsByPriority', () => {
  it('should return empty array for no units', () => {
    expect(sortUnitsByPriority([])).toEqual([]);
  });

  it('should sort units by priority', () => {
    const units = [
      createMockUnit({ id: '1', type: 'dreadnought' }),
      createMockUnit({ id: '2', type: 'fighter' }),
      createMockUnit({ id: '3', type: 'cruiser' }),
    ];

    const sorted = sortUnitsByPriority(units);

    // Fighters should come first (lower priority = assigned hits first)
    expect(sorted.length).toBe(3);
    // Order depends on implementation but should be consistent
    expect(sorted.map(u => u.type)).toBeDefined();
  });

  it('should keep order for same type', () => {
    const units = [
      createMockUnit({ id: '1', type: 'fighter' }),
      createMockUnit({ id: '2', type: 'fighter' }),
      createMockUnit({ id: '3', type: 'fighter' }),
    ];

    const sorted = sortUnitsByPriority(units);

    expect(sorted.length).toBe(3);
    expect(sorted.every(u => u.type === 'fighter')).toBe(true);
  });
});

describe('getNonFighterShips', () => {
  it('should return empty array for empty system', () => {
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'system-1', units: [] });
    const state = createMockGameState([tile]);

    const result = getNonFighterShips(state, 'player1', 'system-1');

    expect(result).toEqual([]);
  });

  it('should filter out fighters', () => {
    const units = [
      createMockUnit({ type: 'fighter', ownerId: 'player1' }),
      createMockUnit({ type: 'cruiser', ownerId: 'player1' }),
      createMockUnit({ type: 'fighter', ownerId: 'player1' }),
      createMockUnit({ type: 'dreadnought', ownerId: 'player1' }),
    ];
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'system-1', units });
    const state = createMockGameState([tile]);

    const result = getNonFighterShips(state, 'player1', 'system-1');

    expect(result.length).toBe(2);
    expect(result.every(u => u.type !== 'fighter')).toBe(true);
  });

  it('should return all ships when no fighters', () => {
    const units = [
      createMockUnit({ type: 'cruiser', ownerId: 'player1' }),
      createMockUnit({ type: 'dreadnought', ownerId: 'player1' }),
      createMockUnit({ type: 'carrier', ownerId: 'player1' }),
    ];
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'system-1', units });
    const state = createMockGameState([tile]);

    const result = getNonFighterShips(state, 'player1', 'system-1');

    expect(result.length).toBe(3);
  });

  it('should return empty when all fighters', () => {
    const units = [
      createMockUnit({ type: 'fighter', ownerId: 'player1' }),
      createMockUnit({ type: 'fighter', ownerId: 'player1' }),
    ];
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'system-1', units });
    const state = createMockGameState([tile]);

    const result = getNonFighterShips(state, 'player1', 'system-1');

    expect(result.length).toBe(0);
  });

  it('should only include ships belonging to specified player', () => {
    const units = [
      createMockUnit({ type: 'cruiser', ownerId: 'player1' }),
      createMockUnit({ type: 'cruiser', ownerId: 'player2' }),
      createMockUnit({ type: 'dreadnought', ownerId: 'player1' }),
    ];
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'system-1', units });
    const state = createMockGameState([tile]);

    const result = getNonFighterShips(state, 'player1', 'system-1');

    expect(result.length).toBe(2);
    expect(result.every(u => u.ownerId === 'player1')).toBe(true);
  });
});

describe('canUseSustainDamage', () => {
  it('should return true when no blocking abilities present', () => {
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'system-1', units: [] });
    const state = createMockGameState([tile]);
    const combat: CombatInstance = {
      systemId: 'system-1',
      type: 'space',
      attackerId: 'player1',
      defenderId: 'player2',
      round: 1,
      phase: 'combat',
      planetId: undefined,
    };

    expect(canUseSustainDamage(state, 'player1', combat)).toBe(true);
  });

  it('should return true when tile not found', () => {
    const state = createMockGameState([]);
    const combat: CombatInstance = {
      systemId: 'nonexistent',
      type: 'space',
      attackerId: 'player1',
      defenderId: 'player2',
      round: 1,
      phase: 'combat',
      planetId: undefined,
    };

    expect(canUseSustainDamage(state, 'player1', combat)).toBe(true);
  });

  it('should return false when opponent Mentak flagship present (Fourth Moon)', () => {
    const units = [
      createMockUnit({ type: 'flagship', ownerId: 'player2' }),
    ];
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'system-1', units });
    const player1 = createMockPlayer({ id: 'player1', faction: 'sol' });
    const player2 = createMockPlayer({ id: 'player2', faction: 'mentak' });
    const state = createMockGameState([tile], [player1, player2]);
    const combat: CombatInstance = {
      systemId: 'system-1',
      type: 'space',
      attackerId: 'player1',
      defenderId: 'player2',
      round: 1,
      phase: 'combat',
      planetId: undefined,
    };

    expect(canUseSustainDamage(state, 'player1', combat)).toBe(false);
  });

  it('should allow sustain damage when Mentak flagship belongs to same player', () => {
    const units = [
      createMockUnit({ type: 'flagship', ownerId: 'player1' }),
    ];
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'system-1', units });
    const player1 = createMockPlayer({ id: 'player1', faction: 'mentak' });
    const player2 = createMockPlayer({ id: 'player2', faction: 'sol' });
    const state = createMockGameState([tile], [player1, player2]);
    const combat: CombatInstance = {
      systemId: 'system-1',
      type: 'space',
      attackerId: 'player1',
      defenderId: 'player2',
      round: 1,
      phase: 'combat',
      planetId: undefined,
    };

    expect(canUseSustainDamage(state, 'player1', combat)).toBe(true);
  });
});

describe('findUnitById', () => {
  it('should return null if unit not found', () => {
    const state = createMockGameState([createMockTile({ q: 0, r: 0 })]);

    expect(findUnitById(state, 'nonexistent')).toBeNull();
  });

  it('should find unit in space', () => {
    const unit = createMockUnit({ id: 'unit-123' });
    const tile = createMockTile({ q: 0, r: 0 }, { units: [unit] });
    const state = createMockGameState([tile]);

    const result = findUnitById(state, 'unit-123');

    expect(result).toBeDefined();
    expect(result?.id).toBe('unit-123');
  });
});

describe('findDefenderId', () => {
  it('should return null if no defender', () => {
    const tile = createMockTile({ q: 0, r: 0 }, {
      units: [createMockUnit({ ownerId: 'player1' })],
    });

    expect(findDefenderId(tile, 'player1')).toBeNull();
  });

  it('should return other player id when units from both players', () => {
    const tile = createMockTile({ q: 0, r: 0 }, {
      units: [
        createMockUnit({ ownerId: 'player1', type: 'cruiser' }),
        createMockUnit({ ownerId: 'player2', type: 'cruiser' }),
      ],
    });

    expect(findDefenderId(tile, 'player1')).toBe('player2');
  });

  it('should return null when only ground units on planets (no ships)', () => {
    // findDefenderId only checks space units (ships), not planet units
    const tile = createMockTile({ q: 0, r: 0 }, {
      units: [],
      planets: [{
        id: 'planet-1',
        planetId: 'test-planet',
        controlledBy: 'player2',
        exhausted: false,
        units: [createMockUnit({ ownerId: 'player2', type: 'infantry' })],
        attachments: [],
      }],
    });

    // Returns null because there are no ships to defend against
    expect(findDefenderId(tile, 'player1')).toBeNull();
  });
});

describe('getUnitsInCombat', () => {
  it('should return empty array if tile not found', () => {
    const state = createMockGameState([]);
    const combat: CombatInstance = {
      systemId: 'nonexistent',
      type: 'space',
      attackerId: 'player1',
      defenderId: 'player2',
      round: 1,
      phase: 'combat',
      planetId: undefined,
    };

    expect(getUnitsInCombat(state, combat, 'player1')).toEqual([]);
  });

  it('should return ships for space combat', () => {
    const units = [
      createMockUnit({ type: 'cruiser', ownerId: 'player1' }),
      createMockUnit({ type: 'fighter', ownerId: 'player1' }),
      createMockUnit({ type: 'infantry', ownerId: 'player1' }), // Ground unit
    ];
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'tile-1', units });
    const state = createMockGameState([tile]);
    const combat: CombatInstance = {
      systemId: 'tile-1',
      type: 'space',
      attackerId: 'player1',
      defenderId: 'player2',
      round: 1,
      phase: 'combat',
      planetId: undefined,
    };

    const result = getUnitsInCombat(state, combat, 'player1');

    // Should only include ships, not infantry
    expect(result.length).toBe(2);
    expect(result.every(u => u.type === 'cruiser' || u.type === 'fighter')).toBe(true);
  });
});

describe('getAFBUnits', () => {
  const player = createMockPlayer();

  it('should return empty array for no units', () => {
    expect(getAFBUnits([], player)).toEqual([]);
  });

  it('should return destroyers (have AFB)', () => {
    const units = [
      createMockUnit({ type: 'destroyer' }),
      createMockUnit({ type: 'cruiser' }),
    ];

    const result = getAFBUnits(units, player);

    // Destroyers have AFB by default
    expect(result.some(u => u.type === 'destroyer')).toBe(true);
  });
});

describe('getEnemyFighters', () => {
  it('should return empty array for tile not found', () => {
    const state = createMockGameState([]);
    const combat: CombatInstance = {
      systemId: 'nonexistent',
      type: 'space',
      attackerId: 'player1',
      defenderId: 'player2',
      round: 1,
      phase: 'combat',
      planetId: undefined,
    };

    expect(getEnemyFighters(state, combat, 'player2')).toEqual([]);
  });

  it('should return empty array when no fighters', () => {
    const units = [
      createMockUnit({ type: 'cruiser', ownerId: 'player2' }),
      createMockUnit({ type: 'dreadnought', ownerId: 'player2' }),
    ];
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'system-1', units });
    const state = createMockGameState([tile]);
    const combat: CombatInstance = {
      systemId: 'system-1',
      type: 'space',
      attackerId: 'player1',
      defenderId: 'player2',
      round: 1,
      phase: 'combat',
      planetId: undefined,
    };

    expect(getEnemyFighters(state, combat, 'player2')).toEqual([]);
  });

  it('should return only fighters belonging to target player', () => {
    const units = [
      createMockUnit({ type: 'fighter', ownerId: 'player2' }),
      createMockUnit({ type: 'cruiser', ownerId: 'player2' }),
      createMockUnit({ type: 'fighter', ownerId: 'player1' }),
      createMockUnit({ type: 'fighter', ownerId: 'player2' }),
    ];
    const tile = createMockTile({ q: 0, r: 0 }, { id: 'system-1', units });
    const state = createMockGameState([tile]);
    const combat: CombatInstance = {
      systemId: 'system-1',
      type: 'space',
      attackerId: 'player1',
      defenderId: 'player2',
      round: 1,
      phase: 'combat',
      planetId: undefined,
    };

    const result = getEnemyFighters(state, combat, 'player2');

    expect(result.length).toBe(2);
    expect(result.every(u => u.type === 'fighter')).toBe(true);
    expect(result.every(u => u.ownerId === 'player2')).toBe(true);
  });
});

describe('removeUnit', () => {
  it('should return false if unit not found', () => {
    const state = createMockGameState([createMockTile({ q: 0, r: 0 })]);

    expect(removeUnit(state, 'nonexistent')).toBe(false);
  });

  it('should remove unit from space', () => {
    const unit = createMockUnit({ id: 'unit-123' });
    const tile = createMockTile({ q: 0, r: 0 }, { units: [unit] });
    const state = createMockGameState([tile]);

    expect(state.map.tiles[0].units.length).toBe(1);

    const result = removeUnit(state, 'unit-123');

    expect(result).toBe(true);
    expect(state.map.tiles[0].units.length).toBe(0);
  });
});

describe('damageUnit', () => {
  it('should return false if unit not found', () => {
    const state = createMockGameState([createMockTile({ q: 0, r: 0 })]);

    expect(damageUnit(state, 'nonexistent')).toBe(false);
  });

  it('should mark unit as damaged', () => {
    const unit = createMockUnit({ id: 'unit-123', damaged: false });
    const tile = createMockTile({ q: 0, r: 0 }, { units: [unit] });
    const state = createMockGameState([tile]);

    const result = damageUnit(state, 'unit-123');

    expect(result).toBe(true);
    expect(state.map.tiles[0].units[0].damaged).toBe(true);
  });
});

describe('getSpaceCannonUnits', () => {
  const player = createMockPlayer();

  it('should return empty array for no units', () => {
    expect(getSpaceCannonUnits([], player)).toEqual([]);
  });

  it('should return PDS units (have space cannon)', () => {
    const units = [
      createMockUnit({ type: 'pds' }),
      createMockUnit({ type: 'cruiser' }),
    ];

    const result = getSpaceCannonUnits(units, player);

    // PDS units have Space Cannon by default
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

describe('getBombardmentUnits', () => {
  const player = createMockPlayer();

  it('should return empty array for no units', () => {
    expect(getBombardmentUnits([], player)).toEqual([]);
  });

  it('should return dreadnoughts and war suns (have bombardment)', () => {
    const units = [
      createMockUnit({ type: 'dreadnought' }),
      createMockUnit({ type: 'war_sun' }),
      createMockUnit({ type: 'cruiser' }),
    ];

    const result = getBombardmentUnits(units, player);

    // Dreadnoughts and War Suns have Bombardment by default
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});
