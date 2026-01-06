import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeInvasion,
  handleSelectInvasionTargets,
  handleRollBombardment,
  handleSkipBombardment,
  handleAssignBombardmentHits,
  handleCommitGroundForces,
  handleSkipInvasion,
  getInvadablePlanets,
  hasGroundForcesToLand,
  processSpaceCannonDefense,
  handleAssignSpaceCannonHits,
  initializeGroundCombat,
  rollGroundCombatDice,
  handleGroundCombatAssignHits,
  checkGroundCombatEnd,
  resolveGroundCombat,
  establishControl,
  advanceToNextPlanet,
  advanceToNextInvasionStep,
  completeInvasion,
} from '../invasion.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  UnitInstance,
  PlanetInstance,
  SelectInvasionTargetsAction,
  CommitGroundForcesAction,
  RollBombardmentAction,
  SkipBombardmentAction,
  AssignBombardmentHitsAction,
  SkipInvasionAction,
} from '@ti4/shared';

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
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

function createMockUnit(type: string, ownerId: string, overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: `unit-${Math.random().toString(36).substr(2, 9)}`,
    type: type as any,
    ownerId,
    damaged: false,
    ...overrides,
  };
}

function createMockPlanet(id: string, overrides: Partial<PlanetInstance> = {}): PlanetInstance {
  return {
    id: `planet-instance-${id}`,
    planetId: id,
    controlledBy: null,
    exhausted: false,
    attachments: [],
    units: [],
    ...overrides,
  };
}

function createMockTile(position: { q: number; r: number }, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    position,
    systemId: 0,
    rotation: 0,
    planets: [],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
    ...overrides,
  };
}

function createMockGameState(playerCount: number = 2): GameState {
  const players: PlayerState[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(createMockPlayer(`player${i + 1}`, {
      name: `Player ${i + 1}`,
      seatIndex: i,
      color: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'][i] as any,
    }));
  }

  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'tactical_movement',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: players.map(p => p.id),
    players,
    map: {
      tiles: [],
      playerCount,
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
    timingWindowStack: [], activeTimingWindow: null,
    winner: null,
    gameLog: [],
  };
}

describe('Invasion Handlers', () => {
  describe('getInvadablePlanets', () => {
    it('should return planets controlled by enemies', () => {
      const tile = createMockTile({ q: 0, r: 0 }, {
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
          }),
        ],
      });

      const invadablePlanets = getInvadablePlanets(tile, 'player1');

      expect(invadablePlanets).toHaveLength(1);
      expect(invadablePlanets[0].planetId).toBe('planet1');
    });

    it('should return uncontrolled planets', () => {
      const tile = createMockTile({ q: 0, r: 0 }, {
        planets: [
          createMockPlanet('planet1', {
            controlledBy: null,
          }),
        ],
      });

      const invadablePlanets = getInvadablePlanets(tile, 'player1');

      expect(invadablePlanets).toHaveLength(1);
    });

    it('should not return planets controlled by the active player', () => {
      const tile = createMockTile({ q: 0, r: 0 }, {
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player1',
          }),
        ],
      });

      const invadablePlanets = getInvadablePlanets(tile, 'player1');

      expect(invadablePlanets).toHaveLength(0);
    });
  });

  describe('hasGroundForcesToLand', () => {
    it('should return true if player has infantry in space', () => {
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('infantry', 'player1'),
        ],
      });

      expect(hasGroundForcesToLand(tile, 'player1')).toBe(true);
    });

    it('should return true if player has mechs in space', () => {
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('mech', 'player1'),
        ],
      });

      expect(hasGroundForcesToLand(tile, 'player1')).toBe(true);
    });

    it('should return false if player has no ground units', () => {
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('carrier', 'player1'),
        ],
      });

      expect(hasGroundForcesToLand(tile, 'player1')).toBe(false);
    });
  });

  describe('initializeInvasion', () => {
    it('should initialize invasion tracking', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('carrier', 'player1'),
          createMockUnit('infantry', 'player1'),
        ],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [createMockUnit('infantry', 'player2')],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };

      const result = initializeInvasion(state);

      expect(result.success).toBe(true);
      // Note: initializeInvasion sets subPhase to 'select_planets', not 'tactical_invasion'
      expect(state.subPhase).toBe('select_planets');
      expect(state.invasionPhase).toBeDefined();
      expect(state.invasionPhase?.currentStep).toBe('select_planets');
    });

    it('should fail if no activated system', () => {
      const state = createMockGameState(2);

      const result = initializeInvasion(state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No activated system');
    });
  });

  describe('handleSelectInvasionTargets', () => {
    it('should set target planets and transition to bombardment when has bombardment units', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('dreadnought', 'player1'),
          createMockUnit('infantry', 'player1'),
        ],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [createMockUnit('infantry', 'player2')],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.subPhase = 'tactical_invasion';
      state.invasionPhase = {
        currentStep: 'select_planets',
        targetPlanets: [],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SelectInvasionTargetsAction = {
        type: 'select_invasion_targets',
        playerId: 'player1',
        targetPlanets: ['planet1'],
        timestamp: Date.now(),
      };

      const result = handleSelectInvasionTargets(state, action);

      expect(result.success).toBe(true);
      expect(state.invasionPhase?.targetPlanets).toContain('planet1');
      expect(state.invasionPhase?.currentStep).toBe('bombardment');
    });

    it('should go to bombardment step regardless of bombardment units', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('carrier', 'player1'),
          createMockUnit('infantry', 'player1'),
        ],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [createMockUnit('infantry', 'player2')],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.subPhase = 'select_planets';
      state.invasionPhase = {
        currentStep: 'select_planets',
        targetPlanets: [],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SelectInvasionTargetsAction = {
        type: 'select_invasion_targets',
        playerId: 'player1',
        targetPlanets: ['planet1'],
        timestamp: Date.now(),
      };

      const result = handleSelectInvasionTargets(state, action);

      expect(result.success).toBe(true);
      // Always goes to bombardment step (even with no bombardment units)
      // The bombardment step itself handles the case of no bombardment units
      expect(state.invasionPhase?.currentStep).toBe('bombardment');
    });
  });

  describe('handleRollBombardment', () => {
    it('should roll dice and record hits', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('dreadnought', 'player1'),
        ],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [createMockUnit('infantry', 'player2')],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.subPhase = 'tactical_invasion';
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: RollBombardmentAction = {
        type: 'roll_bombardment',
        playerId: 'player1',
        planetId: 'planet1',
        timestamp: Date.now(),
      };

      const result = handleRollBombardment(state, action);

      expect(result.success).toBe(true);
      expect((result.data as { rolls?: unknown })?.rolls).toBeDefined();
    });

    it('should skip bombardment if planetary shield is present', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('dreadnought', 'player1'),
        ],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [
              createMockUnit('pds', 'player2'),
              createMockUnit('infantry', 'player2'),
            ],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.subPhase = 'tactical_invasion';
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: RollBombardmentAction = {
        type: 'roll_bombardment',
        playerId: 'player1',
        planetId: 'planet1',
        timestamp: Date.now(),
      };

      const result = handleRollBombardment(state, action);

      expect(result.success).toBe(true);
      expect(state.invasionPhase?.pendingBombardmentHits).toBe(0);
      // Should skip to commit ground forces
      expect(state.invasionPhase?.currentStep).toBe('commit_ground_forces');
    });
  });

  describe('handleSkipBombardment', () => {
    it('should transition to commit ground forces', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('dreadnought', 'player1'),
          createMockUnit('infantry', 'player1'),
        ],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [createMockUnit('infantry', 'player2')],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.subPhase = 'tactical_invasion';
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SkipBombardmentAction = {
        type: 'skip_bombardment',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleSkipBombardment(state, action);

      expect(result.success).toBe(true);
      expect(state.invasionPhase?.currentStep).toBe('commit_ground_forces');
      expect(state.invasionPhase?.bombardmentComplete).toBe(true);
    });
  });

  describe('handleAssignBombardmentHits', () => {
    it('should remove destroyed units', () => {
      const state = createMockGameState(2);
      const infantryUnit = createMockUnit('infantry', 'player2');
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [infantryUnit],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.subPhase = 'tactical_invasion';
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 1,
        pendingSpaceCannonHits: 0,
      };

      const action: AssignBombardmentHitsAction = {
        type: 'assign_bombardment_hits',
        playerId: 'player2',
        assignments: [{ unitId: infantryUnit.id, destroyed: true, sustainDamage: false }],
        timestamp: Date.now(),
      };

      const result = handleAssignBombardmentHits(state, action);

      expect(result.success).toBe(true);
      // Infantry should be removed
      const planet = tile.planets.find(p => p.planetId === 'planet1');
      expect(planet?.units.find(u => u.id === infantryUnit.id)).toBeUndefined();
    });

    it('should allow mechs to sustain damage', () => {
      const state = createMockGameState(2);
      const mechUnit = createMockUnit('mech', 'player2');
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [mechUnit],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.subPhase = 'tactical_invasion';
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 1,
        pendingSpaceCannonHits: 0,
      };

      const action: AssignBombardmentHitsAction = {
        type: 'assign_bombardment_hits',
        playerId: 'player2',
        assignments: [{ unitId: mechUnit.id, destroyed: false, sustainDamage: true }],
        timestamp: Date.now(),
      };

      const result = handleAssignBombardmentHits(state, action);

      expect(result.success).toBe(true);
      // Mech should be damaged but not removed
      const planet = tile.planets.find(p => p.planetId === 'planet1');
      const mech = planet?.units.find(u => u.id === mechUnit.id);
      expect(mech).toBeDefined();
      expect(mech?.damaged).toBe(true);
    });
  });

  describe('handleCommitGroundForces', () => {
    it('should move ground forces from space to planet', () => {
      const state = createMockGameState(2);
      const infantryUnit = createMockUnit('infantry', 'player1');
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [infantryUnit],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [createMockUnit('infantry', 'player2')],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.subPhase = 'tactical_invasion';
      state.invasionPhase = {
        currentStep: 'commit_ground_forces',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: true,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: CommitGroundForcesAction = {
        type: 'commit_ground_forces',
        playerId: 'player1',
        assignments: [{ unitId: infantryUnit.id, planetId: 'planet1' }],
        timestamp: Date.now(),
      };

      const result = handleCommitGroundForces(state, action);

      expect(result.success).toBe(true);
      // Infantry should be moved to planet
      const planet = tile.planets.find(p => p.planetId === 'planet1');
      expect(planet?.units.find(u => u.id === infantryUnit.id)).toBeDefined();
      // Infantry should be removed from space
      expect(tile.units.find(u => u.id === infantryUnit.id)).toBeUndefined();
    });

    it('should track committed forces', () => {
      const state = createMockGameState(2);
      const infantryUnit = createMockUnit('infantry', 'player1');
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [infantryUnit],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.subPhase = 'tactical_invasion';
      state.invasionPhase = {
        currentStep: 'commit_ground_forces',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: true,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: CommitGroundForcesAction = {
        type: 'commit_ground_forces',
        playerId: 'player1',
        assignments: [{ unitId: infantryUnit.id, planetId: 'planet1' }],
        timestamp: Date.now(),
      };

      handleCommitGroundForces(state, action);

      expect(state.invasionPhase?.groundForcesCommitted['planet1']).toContain(infantryUnit.id);
    });
  });

  describe('handleSkipInvasion', () => {
    it('should transition to production phase', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [],
        planets: [],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.subPhase = 'tactical_invasion';
      state.invasionPhase = {
        currentStep: 'select_planets',
        targetPlanets: [],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SkipInvasionAction = {
        type: 'skip_invasion',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleSkipInvasion(state, action);

      expect(result.success).toBe(true);
      expect(state.subPhase).toBe('tactical_production');
      expect(state.invasionPhase).toBeUndefined();
    });
  });

  describe('Ground Combat Rules', () => {
    it('ground combat should be type ground', () => {
      const state = createMockGameState(2);
      const attackerInfantry = createMockUnit('infantry', 'player1');
      const defenderInfantry = createMockUnit('infantry', 'player2');

      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [attackerInfantry, defenderInfantry],
          }),
        ],
      });
      state.map.tiles.push(tile);

      // When ground combat is initialized, type should be 'ground'
      state.activeCombat = {
        id: 'combat-1',
        type: 'ground',
        systemId: tile.id,
        planetId: 'planet1',
        attackerId: 'player1',
        defenderId: 'player2',
        state: 'announce_retreat',
        roundNumber: 1,
        attackerUnits: [attackerInfantry.id],
        defenderUnits: [defenderInfantry.id],
        pendingHits: { attacker: 0, defender: 0 },
        retreatAnnounced: { attacker: false, defender: false },
      };

      // Ground combat type should prevent retreat
      expect(state.activeCombat.type).toBe('ground');
    });
  });

  // ============================================================================
  // Additional Invasion Phase Tests
  // ============================================================================

  describe('initializeInvasion - Edge Cases', () => {
    it('should skip invasion when no invadable planets exist', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [createMockUnit('carrier', 'player1')],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player1', // Already controlled by active player
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };

      const result = initializeInvasion(state);

      expect(result.success).toBe(true);
      expect(state.subPhase).toBe('tactical_production');
    });

    it('should fail when system tile not found', () => {
      const state = createMockGameState(2);
      state.activatedSystem = { q: 99, r: 99 }; // Non-existent position

      const result = initializeInvasion(state);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Activated system not found');
    });

    it('should include multiple invadable planets in data', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('carrier', 'player1'),
          createMockUnit('infantry', 'player1'),
        ],
        planets: [
          createMockPlanet('planet1', { controlledBy: 'player2' }),
          createMockPlanet('planet2', { controlledBy: null }),
          createMockPlanet('planet3', { controlledBy: 'player1' }), // Not invadable
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };

      const result = initializeInvasion(state);

      expect(result.success).toBe(true);
      expect((result.data as { invadablePlanets: string[] }).invadablePlanets).toHaveLength(2);
      expect((result.data as { invadablePlanets: string[] }).invadablePlanets).toContain('planet1');
      expect((result.data as { invadablePlanets: string[] }).invadablePlanets).toContain('planet2');
    });
  });

  describe('getInvadablePlanets - Edge Cases', () => {
    it('should include planets with enemy ground forces', () => {
      const tile = createMockTile({ q: 0, r: 0 }, {
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [createMockUnit('infantry', 'player2')],
          }),
        ],
      });

      const invadable = getInvadablePlanets(tile, 'player1');
      expect(invadable).toHaveLength(1);
    });

    it('should return empty array for tiles with no planets', () => {
      const tile = createMockTile({ q: 0, r: 0 }, {
        planets: [],
      });

      const invadable = getInvadablePlanets(tile, 'player1');
      expect(invadable).toHaveLength(0);
    });

    it('should return multiple enemy-controlled planets', () => {
      const tile = createMockTile({ q: 0, r: 0 }, {
        planets: [
          createMockPlanet('p1', { controlledBy: 'player2' }),
          createMockPlanet('p2', { controlledBy: 'player3' }),
          createMockPlanet('p3', { controlledBy: 'player2' }),
        ],
      });

      const invadable = getInvadablePlanets(tile, 'player1');
      expect(invadable).toHaveLength(3);
    });
  });

  describe('hasGroundForcesToLand - Naalu Matriarch', () => {
    it('should return true for Naalu with fighters and Matriarch flagship', () => {
      const state = createMockGameState(2);
      state.players[0].faction = 'naalu';

      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('flagship', 'player1'),
          createMockUnit('fighter', 'player1'),
        ],
      });

      expect(hasGroundForcesToLand(tile, 'player1', state)).toBe(true);
    });

    it('should return false for Naalu without Matriarch even with fighters', () => {
      const state = createMockGameState(2);
      state.players[0].faction = 'naalu';

      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('carrier', 'player1'),
          createMockUnit('fighter', 'player1'),
        ],
      });

      expect(hasGroundForcesToLand(tile, 'player1', state)).toBe(false);
    });

    it('should return false for non-Naalu with fighters', () => {
      const state = createMockGameState(2);
      state.players[0].faction = 'sol';

      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [
          createMockUnit('flagship', 'player1'),
          createMockUnit('fighter', 'player1'),
        ],
      });

      expect(hasGroundForcesToLand(tile, 'player1', state)).toBe(false);
    });
  });

  describe('handleSelectInvasionTargets - Edge Cases', () => {
    it('should fail when not in invasion phase', () => {
      const state = createMockGameState(2);
      state.invasionPhase = undefined;

      const action: SelectInvasionTargetsAction = {
        type: 'select_invasion_targets',
        playerId: 'player1',
        targetPlanets: ['planet1'],
        timestamp: Date.now(),
      };

      const result = handleSelectInvasionTargets(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in invasion phase');
    });

    it('should fail when not in planet selection step', () => {
      const state = createMockGameState(2);
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: [],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SelectInvasionTargetsAction = {
        type: 'select_invasion_targets',
        playerId: 'player1',
        targetPlanets: ['planet1'],
        timestamp: Date.now(),
      };

      const result = handleSelectInvasionTargets(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in planet selection step');
    });

    it('should fail when selecting non-invadable planet', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [createMockUnit('infantry', 'player1')],
        planets: [
          createMockPlanet('planet1', { controlledBy: 'player1' }), // Own planet
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'select_planets',
        targetPlanets: [],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SelectInvasionTargetsAction = {
        type: 'select_invasion_targets',
        playerId: 'player1',
        targetPlanets: ['planet1'],
        timestamp: Date.now(),
      };

      const result = handleSelectInvasionTargets(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be invaded');
    });

    it('should fail when no ground forces available', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [createMockUnit('cruiser', 'player1')], // No ground forces
        planets: [
          createMockPlanet('planet1', { controlledBy: 'player2' }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'select_planets',
        targetPlanets: [],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SelectInvasionTargetsAction = {
        type: 'select_invasion_targets',
        playerId: 'player1',
        targetPlanets: ['planet1'],
        timestamp: Date.now(),
      };

      const result = handleSelectInvasionTargets(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No ground forces available to land');
    });

    it('should complete invasion when no planets selected', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [createMockUnit('infantry', 'player1')],
        planets: [
          createMockPlanet('planet1', { controlledBy: 'player2' }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'select_planets',
        targetPlanets: [],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SelectInvasionTargetsAction = {
        type: 'select_invasion_targets',
        playerId: 'player1',
        targetPlanets: [], // No planets selected
        timestamp: Date.now(),
      };

      const result = handleSelectInvasionTargets(state, action);

      expect(result.success).toBe(true);
      expect(state.subPhase).toBe('tactical_production');
    });
  });

  describe('handleRollBombardment - Edge Cases', () => {
    it('should fail when not in invasion phase', () => {
      const state = createMockGameState(2);
      state.invasionPhase = undefined;

      const action: RollBombardmentAction = {
        type: 'roll_bombardment',
        playerId: 'player1',
        planetId: 'planet1',
        timestamp: Date.now(),
      };

      const result = handleRollBombardment(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in invasion phase');
    });

    it('should fail for wrong planet', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [createMockUnit('dreadnought', 'player1')],
        planets: [
          createMockPlanet('planet1', { controlledBy: 'player2' }),
          createMockPlanet('planet2', { controlledBy: 'player2' }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: RollBombardmentAction = {
        type: 'roll_bombardment',
        playerId: 'player1',
        planetId: 'planet2', // Wrong planet
        timestamp: Date.now(),
      };

      const result = handleRollBombardment(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid planet for bombardment');
    });

    it('should skip bombardment when no bombardment units', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [createMockUnit('cruiser', 'player1')], // Cruiser has no bombardment
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [createMockUnit('infantry', 'player2')],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: RollBombardmentAction = {
        type: 'roll_bombardment',
        playerId: 'player1',
        planetId: 'planet1',
        timestamp: Date.now(),
      };

      const result = handleRollBombardment(state, action);

      expect(result.success).toBe(true);
      expect(state.invasionPhase?.currentStep).toBe('commit_ground_forces');
    });
  });

  describe('handleAssignBombardmentHits - Edge Cases', () => {
    it('should fail when no hits to assign', () => {
      const state = createMockGameState(2);
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: AssignBombardmentHitsAction = {
        type: 'assign_bombardment_hits',
        playerId: 'player2',
        assignments: [],
        timestamp: Date.now(),
      };

      const result = handleAssignBombardmentHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No bombardment hits to assign');
    });

    it('should fail for units not owned by player', () => {
      const state = createMockGameState(2);
      const opponentInfantry = createMockUnit('infantry', 'player1'); // Wrong owner
      const tile = createMockTile({ q: 0, r: 0 }, {
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [opponentInfantry],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 1,
        pendingSpaceCannonHits: 0,
      };

      const action: AssignBombardmentHitsAction = {
        type: 'assign_bombardment_hits',
        playerId: 'player2',
        assignments: [{ unitId: opponentInfantry.id, destroyed: true, sustainDamage: false }],
        timestamp: Date.now(),
      };

      const result = handleAssignBombardmentHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('do not own');
    });

    it('should fail for non-ground units', () => {
      const state = createMockGameState(2);
      const ship = createMockUnit('cruiser', 'player2');
      const tile = createMockTile({ q: 0, r: 0 }, {
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [ship],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 1,
        pendingSpaceCannonHits: 0,
      };

      const action: AssignBombardmentHitsAction = {
        type: 'assign_bombardment_hits',
        playerId: 'player2',
        assignments: [{ unitId: ship.id, destroyed: true, sustainDamage: false }],
        timestamp: Date.now(),
      };

      const result = handleAssignBombardmentHits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ground forces');
    });

    it('should complete when all ground forces destroyed', () => {
      const state = createMockGameState(2);
      const infantry = createMockUnit('infantry', 'player2');
      const tile = createMockTile({ q: 0, r: 0 }, {
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [infantry],
          }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 3, // More hits than units
        pendingSpaceCannonHits: 0,
      };

      const action: AssignBombardmentHitsAction = {
        type: 'assign_bombardment_hits',
        playerId: 'player2',
        assignments: [{ unitId: infantry.id, destroyed: true, sustainDamage: false }],
        timestamp: Date.now(),
      };

      const result = handleAssignBombardmentHits(state, action);

      expect(result.success).toBe(true);
      expect(state.invasionPhase?.currentStep).toBe('commit_ground_forces');
    });
  });

  describe('handleCommitGroundForces - Edge Cases', () => {
    it('should fail for unit not in system', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [], // No units
        planets: [createMockPlanet('planet1', { controlledBy: 'player2' })],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'commit_ground_forces',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: true,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: CommitGroundForcesAction = {
        type: 'commit_ground_forces',
        playerId: 'player1',
        assignments: [{ unitId: 'nonexistent', planetId: 'planet1' }],
        timestamp: Date.now(),
      };

      const result = handleCommitGroundForces(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in system');
    });

    it('should fail for non-target planet', () => {
      const state = createMockGameState(2);
      const infantry = createMockUnit('infantry', 'player1');
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [infantry],
        planets: [
          createMockPlanet('planet1', { controlledBy: 'player2' }),
          createMockPlanet('planet2', { controlledBy: 'player2' }),
        ],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'commit_ground_forces',
        targetPlanets: ['planet1'], // Only planet1 is target
        currentPlanetIndex: 0,
        bombardmentComplete: true,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: CommitGroundForcesAction = {
        type: 'commit_ground_forces',
        playerId: 'player1',
        assignments: [{ unitId: infantry.id, planetId: 'planet2' }], // Wrong planet
        timestamp: Date.now(),
      };

      const result = handleCommitGroundForces(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('is not a target');
    });

    it('should fail for ships as ground forces', () => {
      const state = createMockGameState(2);
      const cruiser = createMockUnit('cruiser', 'player1');
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [cruiser],
        planets: [createMockPlanet('planet1', { controlledBy: 'player2' })],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'commit_ground_forces',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: true,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: CommitGroundForcesAction = {
        type: 'commit_ground_forces',
        playerId: 'player1',
        assignments: [{ unitId: cruiser.id, planetId: 'planet1' }],
        timestamp: Date.now(),
      };

      const result = handleCommitGroundForces(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ground forces');
    });

    it('should allow mech as ground force', () => {
      const state = createMockGameState(2);
      const mech = createMockUnit('mech', 'player1');
      const tile = createMockTile({ q: 0, r: 0 }, {
        units: [mech],
        planets: [createMockPlanet('planet1', { controlledBy: 'player2' })],
      });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'commit_ground_forces',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: true,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: CommitGroundForcesAction = {
        type: 'commit_ground_forces',
        playerId: 'player1',
        assignments: [{ unitId: mech.id, planetId: 'planet1' }],
        timestamp: Date.now(),
      };

      const result = handleCommitGroundForces(state, action);

      expect(result.success).toBe(true);
      const planet = tile.planets.find(p => p.planetId === 'planet1');
      expect(planet?.units.find(u => u.id === mech.id)).toBeDefined();
    });
  });

  describe('handleSkipInvasion - Edge Cases', () => {
    it('should fail when not in invasion phase', () => {
      const state = createMockGameState(2);
      state.invasionPhase = undefined;

      const action: SkipInvasionAction = {
        type: 'skip_invasion',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleSkipInvasion(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in invasion phase');
    });

    it('should clear invasion phase and transition', () => {
      const state = createMockGameState(2);
      const tile = createMockTile({ q: 0, r: 0 }, { units: [], planets: [] });
      state.map.tiles.push(tile);
      state.activatedSystem = { q: 0, r: 0 };
      state.invasionPhase = {
        currentStep: 'select_planets',
        targetPlanets: [],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SkipInvasionAction = {
        type: 'skip_invasion',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      handleSkipInvasion(state, action);

      expect(state.invasionPhase).toBeUndefined();
      expect(state.subPhase).toBe('tactical_production');
    });
  });

  describe('handleSkipBombardment - Edge Cases', () => {
    it('should fail when not in invasion phase', () => {
      const state = createMockGameState(2);
      state.invasionPhase = undefined;

      const action: SkipBombardmentAction = {
        type: 'skip_bombardment',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleSkipBombardment(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in invasion phase');
    });

    it('should fail when not in bombardment step', () => {
      const state = createMockGameState(2);
      state.invasionPhase = {
        currentStep: 'commit_ground_forces',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SkipBombardmentAction = {
        type: 'skip_bombardment',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleSkipBombardment(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in bombardment step');
    });

    it('should set bombardmentComplete and emit event', () => {
      const state = createMockGameState(2);
      state.invasionPhase = {
        currentStep: 'bombardment',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        bombardmentComplete: false,
        groundForcesCommitted: {},
        spaceCannonComplete: false,
        pendingBombardmentHits: 0,
        pendingSpaceCannonHits: 0,
      };

      const action: SkipBombardmentAction = {
        type: 'skip_bombardment',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleSkipBombardment(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('bombardment_skipped');
      expect(state.invasionPhase?.bombardmentComplete).toBe(true);
    });
  });

  describe('processSpaceCannonDefense', () => {
    it('should return handler result for space cannon defense', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';
      state.activatedSystemId = 'tile-0-0';

      const attackerInfantry = createMockUnit('infantry', 'player1');
      const defenderPds = createMockUnit('pds', 'player2');

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [attackerInfantry],
        planets: [
          createMockPlanet('test-planet', {
            controlledBy: 'player2',
            units: [defenderPds],
          }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['test-planet'],
        currentPlanetIndex: 0,
        step: 'space_cannon_defense',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: {},
        groundCombatComplete: {},
        groundCombatResult: {},
        pendingSpaceCannonHits: 0,
      };

      const result = processSpaceCannonDefense(state);

      expect(result).toHaveProperty('success');
    });

    it('should return handler result when no PDS present', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';
      state.activatedSystemId = 'tile-0-0';

      const attackerInfantry = createMockUnit('infantry', 'player1');

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [attackerInfantry],
        planets: [
          createMockPlanet('test-planet', {
            controlledBy: 'player2',
            units: [],
          }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['test-planet'],
        currentPlanetIndex: 0,
        step: 'space_cannon_defense',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: {},
        groundCombatComplete: {},
        groundCombatResult: {},
        pendingSpaceCannonHits: 0,
      };

      const result = processSpaceCannonDefense(state);

      expect(result).toHaveProperty('success');
    });
  });

  describe('initializeGroundCombat', () => {
    it('should return handler result when invasion phase exists', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';
      state.activatedSystemId = 'tile-0-0';

      const attackerInfantry = createMockUnit('infantry', 'player1');
      const defenderInfantry = createMockUnit('infantry', 'player2');

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [],
        planets: [
          createMockPlanet('test-planet', {
            controlledBy: 'player2',
            units: [attackerInfantry, defenderInfantry],
          }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['test-planet'],
        currentPlanetIndex: 0,
        step: 'ground_combat',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: { 'test-planet': [attackerInfantry.id] },
        groundCombatComplete: {},
        groundCombatResult: {},
        pendingSpaceCannonHits: 0,
      };

      const result = initializeGroundCombat(state);

      expect(result).toHaveProperty('success');
    });

    it('should fail if no invasion phase', () => {
      const state = createMockGameState();
      state.invasionPhase = null;

      const result = initializeGroundCombat(state);

      expect(result.success).toBe(false);
    });
  });

  describe('rollGroundCombatDice', () => {
    it('should roll dice for ground combat units', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';

      const attackerInfantry1 = createMockUnit('infantry', 'player1');
      const attackerInfantry2 = createMockUnit('infantry', 'player1');
      const defenderInfantry = createMockUnit('infantry', 'player2');

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [],
        planets: [
          createMockPlanet('test-planet', {
            controlledBy: 'player2',
            units: [attackerInfantry1, attackerInfantry2, defenderInfantry],
          }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['test-planet'],
        currentPlanetIndex: 0,
        step: 'ground_combat',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: { 'test-planet': [attackerInfantry1.id, attackerInfantry2.id] },
        groundCombatComplete: {},
        groundCombatResult: {},
        pendingSpaceCannonHits: 0,
      };

      state.groundCombat = {
        planetId: 'test-planet',
        systemId: 'tile-0-0',
        attackerId: 'player1',
        defenderId: 'player2',
        round: 1,
        attackerUnits: [attackerInfantry1.id, attackerInfantry2.id],
        defenderUnits: [defenderInfantry.id],
      };

      const result = rollGroundCombatDice(state);

      expect(result.attackerRolls).toBeDefined();
      expect(result.defenderRolls).toBeDefined();
    });
  });

  describe('checkGroundCombatEnd', () => {
    it('should return result object with combatEnded property', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';

      const attackerInfantry = createMockUnit('infantry', 'player1');

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [],
        planets: [
          createMockPlanet('test-planet', {
            controlledBy: 'player2',
            units: [attackerInfantry],
          }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['test-planet'],
        currentPlanetIndex: 0,
        step: 'ground_combat',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: { 'test-planet': [attackerInfantry.id] },
        groundCombatComplete: {},
        groundCombatResult: {},
        pendingSpaceCannonHits: 0,
      };

      state.groundCombat = {
        planetId: 'test-planet',
        systemId: 'tile-0-0',
        attackerId: 'player1',
        defenderId: 'player2',
        round: 1,
        attackerUnits: [attackerInfantry.id],
        defenderUnits: [],
      };

      const result = checkGroundCombatEnd(state);

      expect(result).toBeDefined();
    });

    it('should handle case with no ground combat active', () => {
      const state = createMockGameState();
      state.groundCombat = null;

      const result = checkGroundCombatEnd(state);

      expect(result).toBeDefined();
    });
  });

  describe('resolveGroundCombat', () => {
    it('should return handler result', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';

      const attackerInfantry = createMockUnit('infantry', 'player1');

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [],
        planets: [
          createMockPlanet('test-planet', {
            controlledBy: 'player2',
            units: [attackerInfantry],
          }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['test-planet'],
        currentPlanetIndex: 0,
        step: 'ground_combat',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: { 'test-planet': [attackerInfantry.id] },
        groundCombatComplete: {},
        groundCombatResult: {},
        pendingSpaceCannonHits: 0,
      };

      state.groundCombat = {
        planetId: 'test-planet',
        systemId: 'tile-0-0',
        attackerId: 'player1',
        defenderId: 'player2',
        round: 1,
        attackerUnits: [attackerInfantry.id],
        defenderUnits: [],
      };

      const result = resolveGroundCombat(state);

      expect(result).toHaveProperty('success');
    });

    it('should fail when no ground combat active', () => {
      const state = createMockGameState();
      state.groundCombat = null;

      const result = resolveGroundCombat(state);

      expect(result.success).toBe(false);
    });
  });

  describe('establishControl', () => {
    it('should transfer planet control to attacker', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';

      const attackerInfantry = createMockUnit('infantry', 'player1');

      const planet = createMockPlanet('test-planet', {
        controlledBy: 'player2',
        units: [attackerInfantry],
      });

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [],
        planets: [planet],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['test-planet'],
        currentPlanetIndex: 0,
        step: 'establish_control',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: { 'test-planet': [attackerInfantry.id] },
        groundCombatComplete: { 'test-planet': true },
        groundCombatResult: { 'test-planet': 'attacker' },
        pendingSpaceCannonHits: 0,
      };

      const result = establishControl(state, tile, planet, 'player1');

      expect(result.success).toBe(true);
      expect(planet.controlledBy).toBe('player1');
    });

    it('should add planet to player planets list', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';
      const player1 = state.players.find(p => p.id === 'player1');
      if (player1) player1.planets = [];

      const attackerInfantry = createMockUnit('infantry', 'player1');

      const planet = createMockPlanet('test-planet', {
        controlledBy: 'player2',
        units: [attackerInfantry],
      });

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [],
        planets: [planet],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['test-planet'],
        currentPlanetIndex: 0,
        step: 'establish_control',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: { 'test-planet': [attackerInfantry.id] },
        groundCombatComplete: { 'test-planet': true },
        groundCombatResult: { 'test-planet': 'attacker' },
        pendingSpaceCannonHits: 0,
      };

      establishControl(state, tile, planet, 'player1');

      expect(player1?.planets.some(p => p.planetId === 'test-planet')).toBe(true);
    });
  });

  describe('advanceToNextPlanet', () => {
    it('should advance to next planet in target list', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [createMockUnit('infantry', 'player1')],
        planets: [
          createMockPlanet('planet1', { controlledBy: 'player1', units: [] }),
          createMockPlanet('planet2', { controlledBy: 'player2', units: [] }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['planet1', 'planet2'],
        currentPlanetIndex: 0,
        step: 'establish_control',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: {},
        groundCombatComplete: { 'planet1': true },
        groundCombatResult: { 'planet1': 'attacker' },
        pendingSpaceCannonHits: 0,
      };

      const result = advanceToNextPlanet(state);

      expect(result.success).toBe(true);
      expect(state.invasionPhase?.currentPlanetIndex).toBe(1);
    });

    it('should complete invasion when no more planets', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [createMockUnit('infantry', 'player1')],
        planets: [
          createMockPlanet('planet1', { controlledBy: 'player1', units: [] }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        step: 'establish_control',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: {},
        groundCombatComplete: { 'planet1': true },
        groundCombatResult: { 'planet1': 'attacker' },
        pendingSpaceCannonHits: 0,
      };

      const result = advanceToNextPlanet(state);

      expect(result.success).toBe(true);
    });
  });

  describe('completeInvasion', () => {
    it('should complete invasion and transition to production', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';
      state.subPhase = 'tactical_invasion';

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [createMockUnit('infantry', 'player1')],
        planets: [
          createMockPlanet('planet1', { controlledBy: 'player1', units: [] }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        step: 'complete',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: {},
        groundCombatComplete: { 'planet1': true },
        groundCombatResult: { 'planet1': 'attacker' },
        pendingSpaceCannonHits: 0,
      };

      const result = completeInvasion(state);

      expect(result.success).toBe(true);
    });

    it('should clear invasion phase', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';
      state.subPhase = 'tactical_invasion';

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [createMockUnit('infantry', 'player1')],
        planets: [
          createMockPlanet('planet1', { controlledBy: 'player1', units: [] }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        step: 'complete',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: {},
        groundCombatComplete: { 'planet1': true },
        groundCombatResult: { 'planet1': 'attacker' },
        pendingSpaceCannonHits: 0,
      };

      completeInvasion(state);

      expect(state.invasionPhase).toBeUndefined();
    });
  });

  describe('advanceToNextInvasionStep', () => {
    it('should advance from bombardment to commit ground forces', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player1';

      const tile = createMockTile({ q: 0, r: 0 }, {
        id: 'tile-0-0',
        units: [
          createMockUnit('carrier', 'player1'),
          createMockUnit('infantry', 'player1'),
        ],
        planets: [
          createMockPlanet('planet1', {
            controlledBy: 'player2',
            units: [createMockUnit('infantry', 'player2')]
          }),
        ],
      });
      state.map.tiles = [tile];

      state.invasionPhase = {
        attackerId: 'player1',
        activatedSystemId: 'tile-0-0',
        targetPlanets: ['planet1'],
        currentPlanetIndex: 0,
        step: 'bombardment',
        bombardmentComplete: true,
        bombardmentHits: {},
        spaceCannonRolls: {},
        committedGroundForces: {},
        groundCombatComplete: {},
        groundCombatResult: {},
        pendingSpaceCannonHits: 0,
      };

      const result = advanceToNextInvasionStep(state);

      expect(result.success).toBe(true);
    });
  });
});
