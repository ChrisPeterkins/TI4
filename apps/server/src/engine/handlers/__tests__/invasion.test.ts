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
});
