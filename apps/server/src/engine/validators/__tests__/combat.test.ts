/**
 * Tests for combat validators
 *
 * TI4 Combat Rules:
 * - Space combat occurs when two players have ships in the same system
 * - Combat has steps: Anti-Fighter Barrage (round 1 only), Announce Retreat, Roll Dice, Assign Hits
 * - Defender cannot retreat during the first round
 * - Retreat destination must be adjacent with own ships/command token and no enemy ships
 * - Sustain Damage: Unit can take damage instead of being destroyed (if not already damaged)
 * - Units with Sustain Damage that have already taken damage cannot sustain again
 * - Must assign all hits unless there aren't enough units to absorb them
 *
 * Sources:
 * - https://twilight-imperium.fandom.com/wiki/Space_Combat
 * - https://www.tirules.com/R_space_combat
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GameState, PlayerState, UnitInstance, CombatInstance, MapTile, HexCoord } from '@ti4/shared';
import {
  validateAssignHits,
  validateAnnounceRetreat,
  validateAdvanceCombat,
} from '../combat.js';

// Mock the combat utility functions
vi.mock('../../utils/combat.js', () => ({
  findUnitById: vi.fn((state: GameState, unitId: string): UnitInstance | null => {
    // Search through tiles
    for (const tile of state.map.tiles) {
      const unit = tile.units.find(u => u.id === unitId);
      if (unit) return unit;
      for (const planet of tile.planets) {
        const planetUnit = planet.units.find(u => u.id === unitId);
        if (planetUnit) return planetUnit;
      }
    }
    return null;
  }),
  canUnitSustainDamage: vi.fn((unit: UnitInstance, _player: PlayerState): boolean => {
    // Ships that can sustain: war_sun, dreadnought, carrier, flagship
    const sustainTypes = ['war_sun', 'dreadnought', 'carrier', 'flagship', 'mech'];
    return sustainTypes.includes(unit.type) && !unit.damaged;
  }),
  getValidRetreatSystems: vi.fn(
    (_state: GameState, _playerId: string, _position: HexCoord): MapTile[] => {
      // Default: return empty (no valid retreat systems)
      return [];
    }
  ),
}));

import { findUnitById, canUnitSustainDamage, getValidRetreatSystems } from '../../utils/combat.js';

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    faction: 'sol',
    color: 'blue',
    name: 'Test Player',
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    resources: 5,
    influence: 5,
    commodities: 2,
    maxCommodities: 4,
    tradeGoods: 2,
    technologies: [],
    planets: [],
    controlledSystems: [],
    victoryPoints: 0,
    secretObjectives: [],
    actionCards: [],
    promissoryNotes: [],
    scoredObjectives: [],
    scoredSecretObjectives: [],
    custodiansTaken: false,
    passed: false,
    speaker: false,
    strategyCard: null,
    strategyCardUsed: false,
    activatedSystems: [],
    unitUpgrades: {},
    leaders: {
      agent: { id: 'sol_agent', unlocked: true, exhausted: false },
      commander: { id: 'sol_commander', unlocked: false, exhausted: false },
      hero: { id: 'sol_hero', unlocked: false, purged: false },
    },
    relics: [],
    fragments: { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 },
    exhaustedPlanets: [],
    exhaustedTechs: [],
    exhaustedAgents: [],
    ...overrides,
  };
}

function createMockUnit(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: 'unit1',
    type: 'cruiser',
    ownerId: 'player1',
    damaged: false,
    ...overrides,
  };
}

function createMockTile(overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: 'tile1',
    systemId: 25,
    position: { q: 0, r: 0 },
    units: [],
    planets: [],
    commandTokens: [],
    ...overrides,
  };
}

function createMockCombat(overrides: Partial<CombatInstance> = {}): CombatInstance {
  return {
    id: 'combat1',
    type: 'space',
    systemId: 'tile1',
    attackerId: 'player1',
    defenderId: 'player2',
    attackerUnits: ['unit1'],
    defenderUnits: ['unit2'],
    state: 'combat_round_assign',
    roundNumber: 1,
    pendingHits: { attacker: 0, defender: 1 },
    temporaryModifiers: {},
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createMockPlayer({ id: 'player1', faction: 'sol' });
  const player2 = createMockPlayer({ id: 'player2', faction: 'letnev' });

  const attackerUnit = createMockUnit({ id: 'unit1', ownerId: 'player1', type: 'cruiser' });
  const defenderUnit = createMockUnit({ id: 'unit2', ownerId: 'player2', type: 'cruiser' });

  const tile = createMockTile({
    id: 'tile1',
    units: [attackerUnit, defenderUnit],
    position: { q: 0, r: 0 },
  });

  return {
    id: 'game1',
    name: 'Test Game',
    phase: 'action',
    subPhase: 'tactical_combat',
    round: 1,
    turn: 0,
    players: [player1, player2],
    map: { tiles: [tile] },
    objectives: { stage1: [], stage2: [], revealed: [], secret: [] },
    laws: [],
    activePlayerId: 'player1',
    speakerId: 'player1',
    activeCombat: createMockCombat(),
    agendaPhase: null,
    turnOrder: ['player1', 'player2'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    miltyDraft: null,
    actionDeck: [],
    actionDiscardPile: [],
    agendaDeck: [],
    agendaDiscardPile: [],
    stageTwoRevealed: false,
    ...overrides,
  };
}

describe('validateAssignHits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic validation', () => {
    it('should fail if no active combat', () => {
      const state = createMockGameState({ activeCombat: null });
      const action = { type: 'assign_hits' as const, playerId: 'player1', assignments: [] };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No active combat');
    });

    it('should fail if not in hit assignment phase', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';
      const action = { type: 'assign_hits' as const, playerId: 'player1', assignments: [] };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in hit assignment phase');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action = { type: 'assign_hits' as const, playerId: 'nonexistent', assignments: [] };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if player is not part of combat', () => {
      const state = createMockGameState();
      state.players.push(createMockPlayer({ id: 'player3' }));
      const action = { type: 'assign_hits' as const, playerId: 'player3', assignments: [] };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You are not part of this combat');
    });
  });

  describe('hit assignment validation', () => {
    it('should fail if assigning hits to same unit multiple times', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 2;

      // Add a second unit so we have enough for 2 hits
      const extraUnit = createMockUnit({ id: 'unit3', ownerId: 'player1' });
      state.map.tiles[0].units.push(extraUnit);
      state.activeCombat!.attackerUnits.push('unit3');

      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [
          { unitId: 'unit1', sustainDamage: false, destroyed: true },
          { unitId: 'unit1', sustainDamage: false, destroyed: true }, // Same unit again
        ],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unit unit1 assigned multiple times');
    });

    it('should fail if unit not found', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 1;
      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'nonexistent', sustainDamage: false, destroyed: true }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unit nonexistent not found');
    });

    it('should fail if unit belongs to another player', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 1;
      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'unit2', sustainDamage: false, destroyed: true }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot assign hits to units you do not own');
    });

    it('should fail if unit is not in this combat', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 1;

      // Add another unit owned by player1 but not in combat
      const extraUnit = createMockUnit({ id: 'unit3', ownerId: 'player1' });
      state.map.tiles[0].units.push(extraUnit);

      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'unit3', sustainDamage: false, destroyed: true }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unit unit3 is not in this combat');
    });

    it('should fail if unit sustains damage AND is destroyed in same assignment', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 1;
      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'unit1', sustainDamage: true, destroyed: true }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unit cannot both sustain damage and be destroyed in same assignment');
    });
  });

  describe('sustain damage validation', () => {
    it('should fail if unit cannot sustain damage', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 1;

      // Cruiser cannot sustain damage
      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'unit1', sustainDamage: true, destroyed: false }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot sustain damage');
    });

    it('should fail if unit already damaged tries to sustain again', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 1;

      // Change unit to dreadnought that can sustain, but is already damaged
      const dreadnought = createMockUnit({
        id: 'unit1',
        ownerId: 'player1',
        type: 'dreadnought',
        damaged: true,
      });
      state.map.tiles[0].units[0] = dreadnought;

      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'unit1', sustainDamage: true, destroyed: false }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot sustain damage');
    });

    it('should allow sustain damage for undamaged dreadnought', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 1;

      // Change unit to dreadnought that can sustain
      const dreadnought = createMockUnit({
        id: 'unit1',
        ownerId: 'player1',
        type: 'dreadnought',
        damaged: false,
      });
      state.map.tiles[0].units[0] = dreadnought;

      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'unit1', sustainDamage: true, destroyed: false }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('hit count validation', () => {
    it('should fail if not all hits are assigned when player has enough units', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 2;

      // Add another unit
      const extraUnit = createMockUnit({ id: 'unit3', ownerId: 'player1' });
      state.map.tiles[0].units.push(extraUnit);
      state.activeCombat!.attackerUnits.push('unit3');

      // Only assign 1 hit when 2 are pending
      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'unit1', sustainDamage: false, destroyed: true }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must assign all 2 hits (assigned 1)');
    });

    it('should allow assigning fewer hits than pending if not enough units', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 5; // More hits than units can absorb

      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'unit1', sustainDamage: false, destroyed: true }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow empty assignments if no pending hits', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 0;

      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(true);
    });

    it('should count sustain damage as one hit absorbed', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 1;

      // Dreadnought can sustain
      const dreadnought = createMockUnit({
        id: 'unit1',
        ownerId: 'player1',
        type: 'dreadnought',
        damaged: false,
      });
      state.map.tiles[0].units[0] = dreadnought;

      const action = {
        type: 'assign_hits' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'unit1', sustainDamage: true, destroyed: false }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('attacker vs defender validation', () => {
    it('should validate hits for defender correctly', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.defender = 1;

      const action = {
        type: 'assign_hits' as const,
        playerId: 'player2',
        assignments: [{ unitId: 'unit2', sustainDamage: false, destroyed: true }],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(true);
    });

    it('should use defender pending hits for defender', () => {
      const state = createMockGameState();
      state.activeCombat!.pendingHits.attacker = 0;
      state.activeCombat!.pendingHits.defender = 1;

      // Defender assigns no hits when they have 1 pending
      const action = {
        type: 'assign_hits' as const,
        playerId: 'player2',
        assignments: [],
      };

      const result = validateAssignHits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must assign all 1 hits (assigned 0)');
    });
  });
});

describe('validateAnnounceRetreat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic validation', () => {
    it('should fail if no active combat', () => {
      const state = createMockGameState({ activeCombat: null });
      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player1',
        retreating: false,
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No active combat');
    });

    it('should fail if not in retreat announcement phase', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'combat_round_assign';
      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player1',
        retreating: false,
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in retreat announcement phase');
    });

    it('should fail if player is not part of combat', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';
      state.players.push(createMockPlayer({ id: 'player3' }));
      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player3',
        retreating: false,
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You are not part of this combat');
    });
  });

  describe('defender retreat rules (TI4: defender cannot retreat round 1)', () => {
    it('should fail if defender tries to retreat on round 1', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';
      state.activeCombat!.roundNumber = 1;
      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player2', // defender
        retreating: true,
        retreatSystem: { q: 1, r: 0 },
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Defender cannot retreat during the first round of combat');
    });

    it('should allow defender to not retreat on round 1', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';
      state.activeCombat!.roundNumber = 1;
      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player2', // defender
        retreating: false,
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow defender to retreat on round 2+', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';
      state.activeCombat!.roundNumber = 2;

      // Mock a valid retreat destination
      const retreatTile = createMockTile({
        id: 'tile2',
        position: { q: 1, r: 0 },
        commandTokens: ['player2'],
      });
      (getValidRetreatSystems as ReturnType<typeof vi.fn>).mockReturnValue([retreatTile]);

      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player2', // defender
        retreating: true,
        retreatSystem: { q: 1, r: 0 },
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('attacker retreat rules', () => {
    it('should allow attacker to retreat on round 1 with valid destination', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';
      state.activeCombat!.roundNumber = 1;

      const retreatTile = createMockTile({
        id: 'tile2',
        position: { q: 1, r: 0 },
        commandTokens: ['player1'],
      });
      (getValidRetreatSystems as ReturnType<typeof vi.fn>).mockReturnValue([retreatTile]);

      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player1', // attacker
        retreating: true,
        retreatSystem: { q: 1, r: 0 },
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow attacker to not retreat', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';
      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player1',
        retreating: false,
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('retreat destination validation', () => {
    it('should fail if no retreat destination specified when retreating', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';
      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player1',
        retreating: true,
        // No retreatSystem specified
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify a retreat destination');
    });

    it('should fail if retreat destination is invalid', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';

      // No valid retreat systems
      (getValidRetreatSystems as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player1',
        retreating: true,
        retreatSystem: { q: 5, r: 5 }, // Invalid destination
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        'Invalid retreat destination - must be adjacent with your ships or command token, no enemy ships'
      );
    });

    it('should validate retreat destination against valid retreat systems', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';

      // Mock valid retreat systems
      const validTile1 = createMockTile({ position: { q: 1, r: 0 } });
      const validTile2 = createMockTile({ position: { q: -1, r: 1 } });
      (getValidRetreatSystems as ReturnType<typeof vi.fn>).mockReturnValue([validTile1, validTile2]);

      // Try to retreat to a valid destination
      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player1',
        retreating: true,
        retreatSystem: { q: -1, r: 1 },
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if combat system not found', () => {
      const state = createMockGameState();
      state.activeCombat!.state = 'announce_retreat';
      state.activeCombat!.systemId = 'nonexistent';
      state.map.tiles = []; // No tiles

      const action = {
        type: 'announce_retreat' as const,
        playerId: 'player1',
        retreating: true,
        retreatSystem: { q: 1, r: 0 },
      };

      const result = validateAnnounceRetreat(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Combat system not found');
    });
  });
});

describe('validateAdvanceCombat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fail if no active combat', () => {
    const state = createMockGameState({ activeCombat: null });
    const action = { playerId: 'player1' };

    const result = validateAdvanceCombat(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('No active combat');
  });

  it('should fail if player is not a combat participant', () => {
    const state = createMockGameState();
    state.players.push(createMockPlayer({ id: 'player3' }));
    const action = { playerId: 'player3' };

    const result = validateAdvanceCombat(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Only combat participants can advance combat');
  });

  it('should allow attacker to advance combat', () => {
    const state = createMockGameState();
    const action = { playerId: 'player1' };

    const result = validateAdvanceCombat(state, action);

    expect(result.valid).toBe(true);
  });

  it('should allow defender to advance combat', () => {
    const state = createMockGameState();
    const action = { playerId: 'player2' };

    const result = validateAdvanceCombat(state, action);

    expect(result.valid).toBe(true);
  });
});
