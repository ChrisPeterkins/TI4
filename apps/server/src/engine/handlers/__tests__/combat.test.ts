import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initializeCombat,
  handleAssignHits,
  handleAnnounceRetreat,
  advanceCombatState,
  completeCombat,
  skipAnnounceRetreat,
  rollCombatDice,
  processAntiFighterBarrage,
} from '../combat.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  HexCoord,
  CombatInstance,
  UnitInstance,
  AssignHitsAction,
  AnnounceRetreatAction,
} from '@ti4/shared';

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Test Player',
    faction: 'sol',
    color: 'blue',
    isBot: false,
    seatPosition: 0,
    victoryPoints: 0,
    resources: 0,
    influence: 0,
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    planets: [],
    technologies: [],
    promissoryNotes: [],
    actionCards: [],
    scoredObjectives: [],
    secretObjectives: [],
    relics: [],
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    exhaustedPlanets: [],
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    strategyCard: null,
    passed: false,
    speaker: false,
    ...overrides,
  } as PlayerState;
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
  };
}

function createMockCombat(overrides: Partial<CombatInstance> = {}): CombatInstance {
  return {
    id: 'combat-test',
    type: 'space',
    systemId: 'tile-0-0',
    attackerId: 'player1',
    defenderId: 'player2',
    state: 'announce_retreat',
    roundNumber: 1,
    attackerUnits: ['unit-1', 'unit-2'],
    defenderUnits: ['unit-3', 'unit-4'],
    pendingHits: { attacker: 0, defender: 0 },
    retreatAnnounced: { attacker: false, defender: false },
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game',
    phase: 'action',
    subPhase: 'tactical_space_combat',
    round: 1,
    turn: 1,
    activePlayerId: 'player1',
    players: [
      createMockPlayer({ id: 'player1', faction: 'sol' }),
      createMockPlayer({ id: 'player2', faction: 'hacan' }),
    ],
    map: {
      tiles: [createMockTile({ q: 0, r: 0 })],
      playerCount: 6,
    },
    objectives: {
      publicStageI: [],
      publicStageII: [],
      revealedCount: 0,
      secretDeck: [],
    },
    laws: [],
    actionCardDeck: [],
    agendaDeck: [],
    relicDeck: [],
    strategyCardState: {},
    log: [],
    settings: {
      victoryPointLimit: 10,
      gameDuration: 'full',
      mapType: 'standard',
    },
    activeCombat: null,
    ...overrides,
  } as GameState;
}

describe('Combat Handlers', () => {
  describe('initializeCombat', () => {
    it('should initialize combat with correct players and units', () => {
      const attackerUnits = [
        createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'carrier-1', type: 'carrier', ownerId: 'player1' }),
      ];
      const defenderUnits = [
        createMockUnit({ id: 'destroyer-1', type: 'destroyer', ownerId: 'player2' }),
        createMockUnit({ id: 'dreadnought-1', type: 'dreadnought', ownerId: 'player2' }),
      ];

      const state = createMockGameState({
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              units: [...attackerUnits, ...defenderUnits],
            }),
          ],
          playerCount: 6,
        },
      });

      const combat = initializeCombat(
        state,
        { q: 0, r: 0 },
        'player1',
        'player2'
      );

      expect(combat.attackerId).toBe('player1');
      expect(combat.defenderId).toBe('player2');
      expect(combat.type).toBe('space');
      expect(combat.state).toBe('anti_fighter_barrage');
      expect(combat.roundNumber).toBe(1);
      expect(combat.attackerUnits).toContain('cruiser-1');
      expect(combat.attackerUnits).toContain('carrier-1');
      expect(combat.defenderUnits).toContain('destroyer-1');
      expect(combat.defenderUnits).toContain('dreadnought-1');
    });

    it('should throw error if system not found', () => {
      const state = createMockGameState();

      expect(() => {
        initializeCombat(state, { q: 99, r: 99 }, 'player1', 'player2');
      }).toThrow('System not found for combat initialization');
    });

    it('should only include ship-type units in combat', () => {
      const units = [
        createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'infantry-1', type: 'infantry', ownerId: 'player1' }), // Ground force, not ship
        createMockUnit({ id: 'destroyer-1', type: 'destroyer', ownerId: 'player2' }),
      ];

      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
      });

      const combat = initializeCombat(state, { q: 0, r: 0 }, 'player1', 'player2');

      expect(combat.attackerUnits).toContain('cruiser-1');
      expect(combat.attackerUnits).not.toContain('infantry-1');
    });
  });

  describe('handleAssignHits', () => {
    it('should fail if no active combat', () => {
      const state = createMockGameState();
      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active combat');
    });

    it('should fail if not in hit assignment phase', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'announce_retreat',
        }),
      });
      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in hit assignment phase');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
        }),
      });
      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'nonexistent',
        assignments: [],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should assign hits by destroying units', () => {
      const cruiser = createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' });
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units: [cruiser] })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          attackerUnits: ['cruiser-1'],
          pendingHits: { attacker: 1, defender: 0 },
        }),
      });

      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [{ unitId: 'cruiser-1', destroyed: true, sustainDamage: false }],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(true);
      expect(state.activeCombat?.pendingHits.attacker).toBe(0);
    });

    it('should fail if not enough hits assigned', () => {
      const cruiser = createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' });
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units: [cruiser] })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          attackerUnits: ['cruiser-1'],
          pendingHits: { attacker: 2, defender: 0 },
        }),
      });

      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [{ unitId: 'cruiser-1', destroyed: true, sustainDamage: false }], // Only 1 hit, need 2
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must assign all 2 hits');
    });

    it('should fail if trying to assign hits to enemy units', () => {
      const enemyCruiser = createMockUnit({ id: 'enemy-cruiser', type: 'cruiser', ownerId: 'player2' });
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units: [enemyCruiser] })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          pendingHits: { attacker: 1, defender: 0 },
        }),
      });

      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [{ unitId: 'enemy-cruiser', destroyed: true, sustainDamage: false }],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot assign hits to units you do not own');
    });
  });

  describe('handleAnnounceRetreat', () => {
    it('should fail if no active combat', () => {
      const state = createMockGameState();
      const action: AnnounceRetreatAction = {
        type: 'announce_retreat',
        playerId: 'player1',
        retreating: false,
        timestamp: Date.now(),
      };

      const result = handleAnnounceRetreat(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active combat');
    });

    it('should fail if not in retreat announcement phase', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'combat_round_roll',
        }),
      });
      const action: AnnounceRetreatAction = {
        type: 'announce_retreat',
        playerId: 'player1',
        retreating: false,
        timestamp: Date.now(),
      };

      const result = handleAnnounceRetreat(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in retreat announcement phase');
    });

    it('should fail if trying to retreat from ground combat', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          type: 'ground',
          state: 'announce_retreat',
        }),
      });
      const action: AnnounceRetreatAction = {
        type: 'announce_retreat',
        playerId: 'player1',
        retreating: true,
        retreatSystem: { q: 1, r: 0 },
        timestamp: Date.now(),
      };

      const result = handleAnnounceRetreat(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot retreat from ground combat');
    });

    it('should fail if defender tries to retreat on first round', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'announce_retreat',
          roundNumber: 1,
        }),
      });
      const action: AnnounceRetreatAction = {
        type: 'announce_retreat',
        playerId: 'player2', // Defender
        retreating: true,
        retreatSystem: { q: 1, r: 0 },
        timestamp: Date.now(),
      };

      const result = handleAnnounceRetreat(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Defender cannot retreat on first round');
    });

    it('should fail if retreating without specifying retreat system', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'announce_retreat',
          roundNumber: 2,
        }),
      });
      const action: AnnounceRetreatAction = {
        type: 'announce_retreat',
        playerId: 'player1',
        retreating: true,
        // No retreatSystem specified
        timestamp: Date.now(),
      };

      const result = handleAnnounceRetreat(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must specify retreat system');
    });

    it('should succeed when not retreating', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'announce_retreat',
        }),
      });
      const action: AnnounceRetreatAction = {
        type: 'announce_retreat',
        playerId: 'player1',
        retreating: false,
        timestamp: Date.now(),
      };

      const result = handleAnnounceRetreat(state, action);

      expect(result.success).toBe(true);
      expect(state.activeCombat?.state).toBe('combat_round_roll');
    });
  });

  describe('advanceCombatState', () => {
    it('should fail if no active combat', () => {
      const state = createMockGameState();

      const result = advanceCombatState(state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active combat');
    });

    it('should advance from AFB to announce_retreat', () => {
      const units = [
        createMockUnit({ id: 'c1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'c2', type: 'cruiser', ownerId: 'player2' }),
      ];
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'anti_fighter_barrage',
          systemId: 'tile-0-0',
          attackerUnits: ['c1'],
          defenderUnits: ['c2'],
        }),
      });

      const result = advanceCombatState(state);

      expect(result.success).toBe(true);
      // After AFB, if units remain on both sides, we continue to retreat phase
      // If no AFB hits, units remain and state should be announce_retreat
      expect(state.activeCombat?.state).toBe('announce_retreat');
    });

    it('should advance from announce_retreat to combat_round_roll', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'announce_retreat',
        }),
      });

      const result = advanceCombatState(state);

      expect(result.success).toBe(true);
      expect(state.activeCombat?.state).toBe('combat_round_roll');
    });

    it('should advance from combat_round_roll to combat_round_assign', () => {
      const units = [
        createMockUnit({ id: 'c1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'c2', type: 'cruiser', ownerId: 'player2' }),
      ];
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_roll',
          systemId: 'tile-0-0',
        }),
      });

      const result = advanceCombatState(state);

      expect(result.success).toBe(true);
      expect(state.activeCombat?.state).toBe('combat_round_assign');
      expect(result.data).toHaveProperty('attackerRolls');
      expect(result.data).toHaveProperty('defenderRolls');
    });
  });

  describe('completeCombat', () => {
    it('should fail if no active combat', () => {
      const state = createMockGameState();

      const result = completeCombat(state, 'player1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active combat');
    });

    it('should complete combat with winner', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat(),
      });

      const result = completeCombat(state, 'player1');

      expect(result.success).toBe(true);
      expect((result.data as any)?.winnerId).toBe('player1');
      expect(state.activeCombat?.state).toBe('combat_complete');
    });

    it('should complete combat with no winner (draw)', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat(),
      });

      const result = completeCombat(state, null);

      expect(result.success).toBe(true);
      expect((result.data as any)?.winnerId).toBeNull();
    });
  });

  describe('skipAnnounceRetreat', () => {
    it('should fail if no active combat', () => {
      const state = createMockGameState();

      const result = skipAnnounceRetreat(state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active combat');
    });

    it('should fail if not in retreat announcement phase', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'combat_round_roll',
        }),
      });

      const result = skipAnnounceRetreat(state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in retreat announcement phase');
    });

    it('should skip to combat roll phase', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'announce_retreat',
        }),
      });

      const result = skipAnnounceRetreat(state);

      expect(result.success).toBe(true);
      expect(state.activeCombat?.state).toBe('combat_round_roll');
    });
  });

  describe('rollCombatDice', () => {
    it('should return empty rolls if no active combat', () => {
      const state = createMockGameState();

      const result = rollCombatDice(state);

      expect(result.attackerRolls).toEqual([]);
      expect(result.defenderRolls).toEqual([]);
    });

    it('should roll dice for both players', () => {
      const units = [
        createMockUnit({ id: 'c1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'c2', type: 'cruiser', ownerId: 'player2' }),
      ];
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_roll',
          systemId: 'tile-0-0',
          attackerUnits: ['c1'],
          defenderUnits: ['c2'],
        }),
      });

      const result = rollCombatDice(state);

      expect(Array.isArray(result.attackerRolls)).toBe(true);
      expect(Array.isArray(result.defenderRolls)).toBe(true);
    });
  });

  describe('processAntiFighterBarrage', () => {
    it('should return empty results if no active combat', () => {
      const state = createMockGameState();

      const result = processAntiFighterBarrage(state);

      expect(result.attackerRolls).toEqual([]);
      expect(result.defenderRolls).toEqual([]);
      expect(result.attackerHits).toBe(0);
      expect(result.defenderHits).toBe(0);
    });

    it('should process AFB when players have destroyers and fighters', () => {
      const units = [
        createMockUnit({ id: 'd1', type: 'destroyer', ownerId: 'player1' }), // Has AFB
        createMockUnit({ id: 'f1', type: 'fighter', ownerId: 'player2' }),   // Target for AFB
        createMockUnit({ id: 'f2', type: 'fighter', ownerId: 'player2' }),   // Target for AFB
      ];
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'anti_fighter_barrage',
          systemId: 'tile-0-0',
          attackerUnits: ['d1'],
          defenderUnits: ['f1', 'f2'],
        }),
      });

      const result = processAntiFighterBarrage(state);

      // Should have some rolls (even if no hits)
      expect(Array.isArray(result.attackerRolls)).toBe(true);
      expect(Array.isArray(result.defenderRolls)).toBe(true);
    });
  });
});
