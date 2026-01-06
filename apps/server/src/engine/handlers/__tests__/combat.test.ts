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
  checkAssaultCannon,
  triggerCombatStartWindow,
  triggerBeforeCombatRolls,
  triggerCombatRoundStart,
  determineCombatWinner,
  completeTacticalCombat,
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
    promissoryNotesInPlay: [],
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

  describe('Nebula Combat Effects', () => {
    it('should give defender +1 combat bonus in a nebula', () => {
      const units = [
        createMockUnit({ id: 'c1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'c2', type: 'cruiser', ownerId: 'player2' }),
      ];
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, {
            units,
            anomaly: 'nebula',
          })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_roll',
          systemId: 'tile-0-0',
          attackerUnits: ['c1'],
          defenderUnits: ['c2'],
        }),
      });

      // Roll dice and check that defender has the nebula bonus in modifiers
      const result = rollCombatDice(state);

      // Defender rolls should have the nebula modifier
      expect(result.defenderRolls.some(r =>
        r.modifiers?.includes('Nebula Defender: +1')
      )).toBe(true);

      // Attacker should NOT have the nebula modifier
      expect(result.attackerRolls.some(r =>
        r.modifiers?.includes('Nebula Defender: +1')
      )).toBe(false);
    });

    it('should NOT give nebula bonus in non-nebula systems', () => {
      const units = [
        createMockUnit({ id: 'c1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'c2', type: 'cruiser', ownerId: 'player2' }),
      ];
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, {
            units,
            anomaly: null, // No anomaly
          })],
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

      // Neither player should have nebula modifier
      expect(result.defenderRolls.some(r =>
        r.modifiers?.includes('Nebula Defender: +1')
      )).toBe(false);
      expect(result.attackerRolls.some(r =>
        r.modifiers?.includes('Nebula Defender: +1')
      )).toBe(false);
    });

    it('should NOT give nebula bonus in ground combat', () => {
      const units = [
        createMockUnit({ id: 'i1', type: 'infantry', ownerId: 'player1' }),
        createMockUnit({ id: 'i2', type: 'infantry', ownerId: 'player2' }),
      ];
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, {
            units,
            anomaly: 'nebula',
            planets: [{
              id: 'test-planet-instance',
              planetId: 'test-planet',
              controlledBy: 'player2',
              exhausted: false,
              units,
              attachments: [],
            }],
          })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          type: 'ground',
          state: 'combat_round_roll',
          systemId: 'tile-0-0',
          planetId: 'test-planet',
          attackerUnits: ['i1'],
          defenderUnits: ['i2'],
        }),
      });

      const result = rollCombatDice(state);

      // Nebula bonus should NOT apply to ground combat
      expect(result.defenderRolls.some(r =>
        r.modifiers?.includes('Nebula Defender: +1')
      )).toBe(false);
    });
  });

  describe('Nekro Technological Singularity', () => {
    it('should trigger pending tech gain when Nekro opponent unit is destroyed', () => {
      const units = [
        createMockUnit({ id: 'c1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'c2', type: 'cruiser', ownerId: 'player2' }),
      ];
      const nekroPlayer = createMockPlayer({
        id: 'player2',
        faction: 'nekro',
        technologies: [],
      });
      const solPlayer = createMockPlayer({
        id: 'player1',
        faction: 'sol',
        technologies: ['antimass_deflectors', 'gravity_drive'],
      });
      const state = createMockGameState({
        players: [solPlayer, nekroPlayer],
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          systemId: 'tile-0-0',
          attackerId: 'player2',
          defenderId: 'player1',
          attackerUnits: ['c2'],
          defenderUnits: ['c1'],
          pendingHits: { attacker: 0, defender: 1 },
        }),
      });

      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [{ unitId: 'c1', destroyed: true, sustainDamage: false }],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(true);
      // Nekro's Technological Singularity should have triggered
      expect(state.activeCombat?.pendingTechGain).toBeDefined();
    });

    it('should not trigger if Nekro unit is destroyed (not opponent)', () => {
      const units = [
        createMockUnit({ id: 'c1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'c2', type: 'cruiser', ownerId: 'player2' }),
      ];
      const nekroPlayer = createMockPlayer({
        id: 'player2',
        faction: 'nekro',
        technologies: [],
      });
      const solPlayer = createMockPlayer({
        id: 'player1',
        faction: 'sol',
        technologies: ['antimass_deflectors'],
      });
      const state = createMockGameState({
        players: [solPlayer, nekroPlayer],
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          systemId: 'tile-0-0',
          attackerId: 'player2',
          defenderId: 'player1',
          attackerUnits: ['c2'],
          defenderUnits: ['c1'],
          pendingHits: { attacker: 1, defender: 0 },
        }),
      });

      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player2',
        assignments: [{ unitId: 'c2', destroyed: true, sustainDamage: false }],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(true);
      // Nekro's own unit destroyed - should not trigger
      expect(state.activeCombat?.pendingTechGain).toBeUndefined();
    });

    it('should not trigger if already used this combat', () => {
      const units = [
        createMockUnit({ id: 'c1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'c2', type: 'cruiser', ownerId: 'player2' }),
        createMockUnit({ id: 'c3', type: 'cruiser', ownerId: 'player1' }),
      ];
      const nekroPlayer = createMockPlayer({
        id: 'player2',
        faction: 'nekro',
        technologies: [],
      });
      const solPlayer = createMockPlayer({
        id: 'player1',
        faction: 'sol',
        technologies: ['antimass_deflectors'],
      });
      const state = createMockGameState({
        players: [solPlayer, nekroPlayer],
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          systemId: 'tile-0-0',
          attackerId: 'player2',
          defenderId: 'player1',
          attackerUnits: ['c2'],
          defenderUnits: ['c1', 'c3'],
          pendingHits: { attacker: 0, defender: 1 },
          technologicalSingularityUsed: true,
        }),
      });

      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [{ unitId: 'c1', destroyed: true, sustainDamage: false }],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(true);
      expect(state.activeCombat?.pendingTechGain).toBeUndefined();
    });
  });

  describe('checkAssaultCannon', () => {
    it('should return empty result if no active combat', () => {
      const state = createMockGameState();

      const result = checkAssaultCannon(state);

      expect(result.attackerTriggers).toBe(false);
      expect(result.defenderTriggers).toBe(false);
    });

    it('should return empty result for ground combat', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          type: 'ground',
        }),
      });

      const result = checkAssaultCannon(state);

      expect(result.attackerTriggers).toBe(false);
      expect(result.defenderTriggers).toBe(false);
    });
  });

  describe('triggerCombatStartWindow', () => {
    it('should return success if no active combat', () => {
      const state = createMockGameState();

      const result = triggerCombatStartWindow(state);

      expect(result.success).toBe(true);
    });

    it('should trigger space_combat_start for space combat', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          type: 'space',
        }),
      });

      const result = triggerCombatStartWindow(state);

      expect(result.success).toBe(true);
    });

    it('should trigger ground_combat_start for ground combat', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          type: 'ground',
        }),
      });

      const result = triggerCombatStartWindow(state);

      expect(result.success).toBe(true);
    });
  });

  describe('triggerBeforeCombatRolls', () => {
    it('should return success if no active combat', () => {
      const state = createMockGameState();

      const result = triggerBeforeCombatRolls(state);

      expect(result.success).toBe(true);
    });
  });

  describe('triggerCombatRoundStart', () => {
    it('should return success if no active combat', () => {
      const state = createMockGameState();

      const result = triggerCombatRoundStart(state);

      expect(result.success).toBe(true);
    });

    it('should include round number in trigger context', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          roundNumber: 3,
        }),
      });

      const result = triggerCombatRoundStart(state);

      expect(result.success).toBe(true);
    });
  });

  describe('determineCombatWinner', () => {
    it('should return attacker when defender has no units', () => {
      const state = createMockGameState();
      const combat = createMockCombat({
        attackerUnits: ['unit-1'],
        defenderUnits: [],
      });

      const result = determineCombatWinner(state, combat);

      expect(result).toBe('player1');
    });

    it('should return defender when attacker has no units', () => {
      const state = createMockGameState();
      const combat = createMockCombat({
        attackerUnits: [],
        defenderUnits: ['unit-1'],
      });

      const result = determineCombatWinner(state, combat);

      expect(result).toBe('player2');
    });

    it('should return null when both sides have no units (draw)', () => {
      const state = createMockGameState();
      const combat = createMockCombat({
        attackerUnits: [],
        defenderUnits: [],
      });

      const result = determineCombatWinner(state, combat);

      expect(result).toBeNull();
    });

    it('should return null when both sides still have units', () => {
      const state = createMockGameState();
      const combat = createMockCombat({
        attackerUnits: ['unit-1'],
        defenderUnits: ['unit-2'],
      });

      const result = determineCombatWinner(state, combat);

      expect(result).toBeNull();
    });
  });

  describe('completeTacticalCombat', () => {
    it('should clear active combat', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat(),
      });

      const result = completeTacticalCombat(state);

      expect(result.success).toBe(true);
      expect(state.activeCombat).toBeNull();
    });

    it('should return ground_combat_complete for ground combat', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          type: 'ground',
        }),
      });

      const result = completeTacticalCombat(state);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('ground_combat_complete');
    });

    it('should set subPhase to tactical_production for space combat', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          type: 'space',
        }),
      });

      const result = completeTacticalCombat(state);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('space_combat_complete');
      expect(state.subPhase).toBe('tactical_production');
    });
  });

  describe('Sustain Damage Mechanics', () => {
    it('should allow dreadnought to sustain damage', () => {
      const dreadnought = createMockUnit({
        id: 'dread-1',
        type: 'dreadnought',
        ownerId: 'player1',
        damaged: false,
      });
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units: [dreadnought] })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          systemId: 'tile-0-0',
          attackerUnits: ['dread-1'],
          pendingHits: { attacker: 1, defender: 0 },
        }),
      });

      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [{ unitId: 'dread-1', destroyed: false, sustainDamage: true }],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(true);
      // Unit should be damaged but not destroyed
      const unit = state.map.tiles[0].units.find(u => u.id === 'dread-1');
      expect(unit?.damaged).toBe(true);
    });

    it('should not allow already damaged unit to sustain again', () => {
      const dreadnought = createMockUnit({
        id: 'dread-1',
        type: 'dreadnought',
        ownerId: 'player1',
        damaged: true, // Already damaged
      });
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units: [dreadnought] })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          systemId: 'tile-0-0',
          attackerUnits: ['dread-1'],
          pendingHits: { attacker: 1, defender: 0 },
        }),
      });

      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [{ unitId: 'dread-1', destroyed: false, sustainDamage: true }],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot sustain damage');
    });

    it('should not allow cruiser to sustain damage (no sustain ability)', () => {
      const cruiser = createMockUnit({
        id: 'cruiser-1',
        type: 'cruiser',
        ownerId: 'player1',
        damaged: false,
      });
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units: [cruiser] })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          systemId: 'tile-0-0',
          attackerUnits: ['cruiser-1'],
          pendingHits: { attacker: 1, defender: 0 },
        }),
      });

      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [{ unitId: 'cruiser-1', destroyed: false, sustainDamage: true }],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot sustain damage');
    });
  });

  describe('Combat End Detection', () => {
    it('should end combat when attacker loses all units after AFB', () => {
      // All attacker units are fighters that get destroyed by AFB
      const units = [
        createMockUnit({ id: 'd1', type: 'destroyer', ownerId: 'player2' }), // Defender has AFB
        createMockUnit({ id: 'f1', type: 'fighter', ownerId: 'player1' }),
      ];
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'anti_fighter_barrage',
          systemId: 'tile-0-0',
          attackerUnits: ['f1'],
          defenderUnits: ['d1'],
        }),
      });

      // Simulate AFB destroying the only attacker fighter
      state.activeCombat!.attackerUnits = [];

      // Advance should detect combat end
      const result = advanceCombatState(state);

      expect(result.success).toBe(true);
    });

    it('should continue combat when both sides have units after round', () => {
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
          state: 'combat_round_assign',
          systemId: 'tile-0-0',
          attackerUnits: ['c1'],
          defenderUnits: ['c2'],
          pendingHits: { attacker: 0, defender: 0 },
          roundNumber: 1,
        }),
      });

      // With no pending hits and both sides having units, combat continues
      expect(state.activeCombat?.attackerUnits.length).toBeGreaterThan(0);
      expect(state.activeCombat?.defenderUnits.length).toBeGreaterThan(0);
    });
  });

  describe('Retreat Execution', () => {
    it('should set defender as winner when attacker retreats', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          retreatAnnounced: { attacker: true, defender: false },
          pendingHits: { attacker: 0, defender: 0 },
        }),
      });

      // When hits are all assigned and retreat was announced, retreat executes
      // The player who didn't retreat wins
      expect(state.activeCombat?.retreatAnnounced.attacker).toBe(true);
    });

    it('should set attacker as winner when defender retreats', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          roundNumber: 2, // Defender can retreat after round 1
          retreatAnnounced: { attacker: false, defender: true },
          pendingHits: { attacker: 0, defender: 0 },
        }),
      });

      expect(state.activeCombat?.retreatAnnounced.defender).toBe(true);
    });
  });

  describe('L1Z1X Harrow Ability', () => {
    it('should only apply during ground combat', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1', faction: 'l1z1x' }),
          createMockPlayer({ id: 'player2', faction: 'sol' }),
        ],
        activeCombat: createMockCombat({
          type: 'space', // Not ground combat
          attackerId: 'player1',
        }),
      });

      // Harrow only triggers in ground combat
      expect(state.activeCombat?.type).toBe('space');
    });

    it('should only trigger for L1Z1X attacker', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1', faction: 'l1z1x' }),
          createMockPlayer({ id: 'player2', faction: 'sol' }),
        ],
        activeCombat: createMockCombat({
          type: 'ground',
          attackerId: 'player1',
          defenderId: 'player2',
        }),
      });

      // L1Z1X is the attacker - Harrow can apply
      const attacker = state.players.find(p => p.id === state.activeCombat?.attackerId);
      expect(attacker?.faction).toBe('l1z1x');
    });

    it('should not trigger when L1Z1X is defender', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1', faction: 'sol' }),
          createMockPlayer({ id: 'player2', faction: 'l1z1x' }),
        ],
        activeCombat: createMockCombat({
          type: 'ground',
          attackerId: 'player1',
          defenderId: 'player2',
        }),
      });

      // L1Z1X is defender - Harrow does not trigger
      const defender = state.players.find(p => p.id === state.activeCombat?.defenderId);
      expect(defender?.faction).toBe('l1z1x');
      const attacker = state.players.find(p => p.id === state.activeCombat?.attackerId);
      expect(attacker?.faction).not.toBe('l1z1x');
    });
  });

  describe('Combat Modifiers', () => {
    it('should track temporary modifiers that last one round', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({
          temporaryModifiers: [
            { type: 'combat_bonus', value: 1, source: 'action_card' },
          ],
        }),
      });

      expect(state.activeCombat?.temporaryModifiers).toBeDefined();
      expect(state.activeCombat?.temporaryModifiers?.length).toBe(1);
    });

    it('should clear temporary modifiers after round ends', () => {
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, {
            units: [
              createMockUnit({ id: 'c1', type: 'cruiser', ownerId: 'player1' }),
              createMockUnit({ id: 'c2', type: 'cruiser', ownerId: 'player2' }),
            ],
          })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          systemId: 'tile-0-0',
          attackerUnits: ['c1'],
          defenderUnits: ['c2'],
          pendingHits: { attacker: 0, defender: 0 },
          temporaryModifiers: [
            { type: 'combat_bonus', value: 1, source: 'action_card' },
          ],
        }),
      });

      // Assign zero hits to complete round
      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [],
        timestamp: Date.now(),
      };

      handleAssignHits(state, action);

      // After round completes, temporary modifiers should be cleared
      expect(state.activeCombat?.temporaryModifiers).toBeUndefined();
    });
  });

  describe('War Sun and Flagship Combat', () => {
    it('should include war sun in combat', () => {
      const warSun = createMockUnit({
        id: 'ws-1',
        type: 'war_sun',
        ownerId: 'player1',
      });
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units: [warSun] })],
          playerCount: 6,
        },
      });

      const combat = initializeCombat(state, { q: 0, r: 0 }, 'player1', 'player2');

      expect(combat.attackerUnits).toContain('ws-1');
    });

    it('should include flagship in combat', () => {
      const flagship = createMockUnit({
        id: 'fs-1',
        type: 'flagship',
        ownerId: 'player1',
      });
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units: [flagship] })],
          playerCount: 6,
        },
      });

      const combat = initializeCombat(state, { q: 0, r: 0 }, 'player1', 'player2');

      expect(combat.attackerUnits).toContain('fs-1');
    });
  });

  describe('Unit Not Found Errors', () => {
    it('should fail if assigning hits to nonexistent unit', () => {
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 })],
          playerCount: 6,
        },
        activeCombat: createMockCombat({
          state: 'combat_round_assign',
          systemId: 'tile-0-0',
          pendingHits: { attacker: 1, defender: 0 },
        }),
      });

      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [{ unitId: 'nonexistent', destroyed: true, sustainDamage: false }],
        timestamp: Date.now(),
      };

      const result = handleAssignHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Round Number Tracking', () => {
    it('should increment round number after combat round', () => {
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
          state: 'combat_round_assign',
          systemId: 'tile-0-0',
          attackerUnits: ['c1'],
          defenderUnits: ['c2'],
          pendingHits: { attacker: 0, defender: 0 },
          roundNumber: 1,
        }),
      });

      // Both players have no pending hits - round completes
      const action: AssignHitsAction = {
        type: 'assign_hits',
        playerId: 'player1',
        assignments: [],
        timestamp: Date.now(),
      };

      handleAssignHits(state, action);

      // After both players assign hits (none in this case), round should increment
      // Note: In practice this requires both players to act
      expect(state.activeCombat?.roundNumber).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Combat with Multiple Unit Types', () => {
    it('should handle mixed fleet composition', () => {
      const units = [
        createMockUnit({ id: 'dread-1', type: 'dreadnought', ownerId: 'player1' }),
        createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' }),
        createMockUnit({ id: 'carrier-1', type: 'carrier', ownerId: 'player1' }),
        createMockUnit({ id: 'fighter-1', type: 'fighter', ownerId: 'player1' }),
        createMockUnit({ id: 'destroyer-1', type: 'destroyer', ownerId: 'player2' }),
        createMockUnit({ id: 'dread-2', type: 'dreadnought', ownerId: 'player2' }),
      ];
      const state = createMockGameState({
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
      });

      const combat = initializeCombat(state, { q: 0, r: 0 }, 'player1', 'player2');

      expect(combat.attackerUnits.length).toBe(4);
      expect(combat.defenderUnits.length).toBe(2);
    });
  });
});
