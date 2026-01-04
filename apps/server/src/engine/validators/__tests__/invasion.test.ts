/**
 * Tests for invasion validators
 *
 * TI4 Invasion Rules:
 * - Invasion is step 4 of a tactical action (after Space Combat)
 * - Step 1: Bombardment - Active player may use bombardment abilities (optional)
 * - Step 2: Commit Ground Forces - Land ground forces from space onto planets
 * - Step 3: Space Cannon Defense - Defender's PDS can fire at committed ground forces
 * - Step 4: Ground Combat - Resolve combat if both players have ground forces
 * - Step 5: Establish Control - Gain control of planets with surviving forces
 * - Planetary Shield prevents bombardment
 * - Ground forces in space must be committed to target planets
 *
 * Sources:
 * - https://twilight-imperium.fandom.com/wiki/Invasion
 * - https://www.tirules.com/R_invasion
 * - https://www.tirules.com/R_bombardment
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  GameState,
  PlayerState,
  UnitInstance,
  MapTile,
  PlanetInstance,
  InvasionTracking,
} from '@ti4/shared';
import {
  validateSelectInvasionTargets,
  validateCommitGroundForces,
  validateRollBombardment,
  validateSkipBombardment,
  validateAssignBombardmentHits,
  validateAssignSpaceCannonHits,
  validateSkipInvasion,
} from '../invasion.js';

// Mock the utility functions
vi.mock('../../utils/hex.js', () => ({
  findTileAtPosition: vi.fn(
    (map: { tiles: MapTile[] }, position: { q: number; r: number }): MapTile | null => {
      return map.tiles.find(
        t => t.position.q === position.q && t.position.r === position.r
      ) || null;
    }
  ),
}));

vi.mock('../../utils/units.js', () => ({
  isGroundUnit: vi.fn((type: string): boolean => {
    return type === 'infantry' || type === 'mech';
  }),
  getUnitStats: vi.fn(() => ({})),
}));

vi.mock('../../utils/combat.js', () => ({
  getBombardmentUnits: vi.fn((units: UnitInstance[], _player: PlayerState): UnitInstance[] => {
    // War Sun, Dreadnought have bombardment
    return units.filter(u => u.type === 'war_sun' || u.type === 'dreadnought');
  }),
  canUnitSustainDamage: vi.fn((unit: UnitInstance): boolean => {
    // Mechs can sustain
    return unit.type === 'mech' && !unit.damaged;
  }),
}));

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    faction: 'sol',
    color: 'blue',
    name: 'Test Player',
    seatIndex: 0,
    score: 0,
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
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    relics: [],
    relicFragments: { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 },
    neighbors: [],
    transactedWith: [],
    ...overrides,
  };
}

function createMockUnit(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: 'unit1',
    type: 'infantry',
    ownerId: 'player1',
    damaged: false,
    ...overrides,
  };
}

function createMockPlanet(overrides: Partial<PlanetInstance> = {}): PlanetInstance {
  return {
    id: 'planet1-instance',
    planetId: 'planet1',
    controlledBy: null,
    units: [],
    exhausted: false,
    attachments: [],
    ...overrides,
  };
}

function createMockTile(overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: 'tile1',
    systemId: 25,
    position: { q: 0, r: 0 },
    rotation: 0,
    units: [],
    planets: [createMockPlanet()],
    wormhole: null,
    anomaly: null,
    commandTokens: [],
    ...overrides,
  };
}

function createMockInvasionPhase(overrides: Partial<InvasionTracking> = {}): InvasionTracking {
  return {
    targetPlanets: ['planet1'],
    currentPlanetIndex: 0,
    currentStep: 'select_planets',
    bombardmentComplete: false,
    groundForcesCommitted: {},
    spaceCannonComplete: false,
    pendingBombardmentHits: 0,
    pendingSpaceCannonHits: 0,
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createMockPlayer({ id: 'player1', seatIndex: 0 });
  const player2 = createMockPlayer({ id: 'player2', seatIndex: 1 });

  const infantry1 = createMockUnit({ id: 'infantry1', type: 'infantry', ownerId: 'player1' });
  const infantry2 = createMockUnit({ id: 'infantry2', type: 'infantry', ownerId: 'player2' });

  const planet = createMockPlanet({
    planetId: 'planet1',
    controlledBy: 'player2',
    units: [infantry2],
  });

  const tile = createMockTile({
    id: 'tile1',
    position: { q: 0, r: 0 },
    units: [infantry1],
    planets: [planet],
  });

  return {
    id: 'game1',
    version: 1,
    phase: 'action',
    subPhase: 'tactical_invasion',
    round: 1,
    players: [player1, player2],
    map: { tiles: [tile], playerCount: 2 },
    objectives: { publicStageI: [], publicStageII: [], revealedCount: 0, secretDeck: [] },
    strategyCards: [],
    agendas: { currentAgenda: null, currentAgendaNumber: 1, votes: new Map(), outcome: null, riders: [] },
    laws: [],
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: ['player1', 'player2'],
    activeCombat: null,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    actionCardDeck: [],
    actionCardDiscard: [],
    agendaDeck: [],
    agendaDiscard: [],
    custodiansTaken: false,
    gameLog: [],
    activatedSystem: { q: 0, r: 0 },
    invasionPhase: createMockInvasionPhase(),
    ...overrides,
  };
}

describe('validateSelectInvasionTargets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic validation', () => {
    it('should fail if not in action phase', () => {
      const state = createMockGameState({ phase: 'strategy' });
      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player1',
        targetPlanets: ['planet1'],
        timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in action phase');
    });

    it('should fail if not in invasion subphase', () => {
      const state = createMockGameState({ subPhase: 'tactical_movement' });
      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player1',
        targetPlanets: ['planet1'], timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in invasion phase');
    });

    it('should fail if not the active player', () => {
      const state = createMockGameState();
      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player2',
        targetPlanets: ['planet1'], timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn');
    });

    it('should fail if invasion phase not initialized', () => {
      const state = createMockGameState({ invasionPhase: undefined });
      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player1',
        targetPlanets: ['planet1'],
        timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invasion phase not initialized');
    });

    it('should fail if no system activated', () => {
      const state = createMockGameState({ activatedSystem: undefined });
      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player1',
        targetPlanets: ['planet1'],
        timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No system activated');
    });
  });

  describe('planet validation', () => {
    it('should fail if planet not in system', () => {
      const state = createMockGameState();
      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player1',
        targetPlanets: ['nonexistent'],
        timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Planet nonexistent not in this system');
    });

    it('should fail if player already controls planet without enemy forces', () => {
      const state = createMockGameState();
      // Set planet as controlled by player1 with no enemy units
      state.map.tiles[0].planets[0].controlledBy = 'player1';
      state.map.tiles[0].planets[0].units = [];

      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player1',
        targetPlanets: ['planet1'], timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You already control planet1');
    });

    it('should fail if no ground forces available for invasion', () => {
      const state = createMockGameState();
      // Remove all ground forces from space
      state.map.tiles[0].units = [];

      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player1',
        targetPlanets: ['planet1'], timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No ground forces available to land');
    });

    it('should allow selecting enemy-controlled planet with ground forces', () => {
      const state = createMockGameState();

      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player1',
        targetPlanets: ['planet1'], timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow selecting neutral planet', () => {
      const state = createMockGameState();
      state.map.tiles[0].planets[0].controlledBy = null;
      state.map.tiles[0].planets[0].units = [];

      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player1',
        targetPlanets: ['planet1'], timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow selecting no planets (skip invasion)', () => {
      const state = createMockGameState();

      const action = {
        type: 'select_invasion_targets' as const,
        playerId: 'player1',
        targetPlanets: [],
        timestamp: Date.now(),
      };

      const result = validateSelectInvasionTargets(state, action);

      expect(result.valid).toBe(true);
    });
  });
});

describe('validateCommitGroundForces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic validation', () => {
    it('should fail if not in action phase', () => {
      const state = createMockGameState({
        phase: 'strategy',
        subPhase: 'commit_ground_forces',
      });
      const action = {
        type: 'commit_ground_forces' as const,
        playerId: 'player1',
        assignments: [], timestamp: Date.now(),
      };

      const result = validateCommitGroundForces(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in action phase');
    });

    it('should fail if not in commit ground forces step', () => {
      const state = createMockGameState({ subPhase: 'bombardment' });
      const action = {
        type: 'commit_ground_forces' as const,
        playerId: 'player1',
        assignments: [], timestamp: Date.now(),
      };

      const result = validateCommitGroundForces(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in commit ground forces step');
    });

    it('should fail if not the active player', () => {
      const state = createMockGameState({ subPhase: 'commit_ground_forces' });
      const action = {
        type: 'commit_ground_forces' as const,
        playerId: 'player2',
        assignments: [], timestamp: Date.now(),
      };

      const result = validateCommitGroundForces(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn');
    });
  });

  describe('assignment validation', () => {
    it('should fail if assigning same unit multiple times', () => {
      const state = createMockGameState({ subPhase: 'commit_ground_forces' });
      const action = {
        type: 'commit_ground_forces' as const,
        playerId: 'player1',
        assignments: [
          { unitId: 'infantry1', planetId: 'planet1' },
          { unitId: 'infantry1', planetId: 'planet1' },
        ],
        timestamp: Date.now(),
      };

      const result = validateCommitGroundForces(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unit infantry1 assigned multiple times');
    });

    it('should fail if unit not found in system', () => {
      const state = createMockGameState({ subPhase: 'commit_ground_forces' });
      const action = {
        type: 'commit_ground_forces' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'nonexistent', planetId: 'planet1' }],
        timestamp: Date.now(),
      };

      const result = validateCommitGroundForces(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unit nonexistent not found in system');
    });

    it('should fail if unit belongs to another player', () => {
      const state = createMockGameState({ subPhase: 'commit_ground_forces' });
      // Add enemy infantry to space
      const enemyUnit = createMockUnit({
        id: 'enemy_infantry',
        type: 'infantry',
        ownerId: 'player2',
      });
      state.map.tiles[0].units.push(enemyUnit);

      const action = {
        type: 'commit_ground_forces' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'enemy_infantry', planetId: 'planet1' }],
        timestamp: Date.now(),
      };

      const result = validateCommitGroundForces(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot commit units you do not own');
    });

    it('should fail if unit is not a ground unit', () => {
      const state = createMockGameState({ subPhase: 'commit_ground_forces' });
      // Add a ship to space
      const cruiser = createMockUnit({ id: 'cruiser1', type: 'cruiser', ownerId: 'player1' });
      state.map.tiles[0].units.push(cruiser);

      const action = {
        type: 'commit_ground_forces' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'cruiser1', planetId: 'planet1' }],
        timestamp: Date.now(),
      };

      const result = validateCommitGroundForces(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only ground forces can be committed to planets');
    });

    it('should fail if planet is not a valid target', () => {
      const state = createMockGameState({ subPhase: 'commit_ground_forces' });
      state.invasionPhase!.targetPlanets = ['planet2']; // Different planet

      const action = {
        type: 'commit_ground_forces' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'infantry1', planetId: 'planet1' }],
        timestamp: Date.now(),
      };

      const result = validateCommitGroundForces(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Planet planet1 is not a valid target');
    });

    it('should fail if must commit at least one unit to target planets', () => {
      const state = createMockGameState({ subPhase: 'commit_ground_forces' });
      state.invasionPhase!.targetPlanets = ['planet1'];

      const action = {
        type: 'commit_ground_forces' as const,
        playerId: 'player1',
        assignments: [], // No units committed
        timestamp: Date.now(),
      };

      const result = validateCommitGroundForces(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must commit at least one ground force');
    });

    it('should allow committing ground forces to valid target', () => {
      const state = createMockGameState({ subPhase: 'commit_ground_forces' });

      const action = {
        type: 'commit_ground_forces' as const,
        playerId: 'player1',
        assignments: [{ unitId: 'infantry1', planetId: 'planet1' }],
        timestamp: Date.now(),
      };

      const result = validateCommitGroundForces(state, action);

      expect(result.valid).toBe(true);
    });
  });
});

describe('validateRollBombardment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fail if not in bombardment step', () => {
    const state = createMockGameState({ subPhase: 'tactical_invasion' });
    const action = {
      type: 'roll_bombardment' as const,
      playerId: 'player1',
      planetId: 'planet1', timestamp: Date.now(),
    };

    const result = validateRollBombardment(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not in bombardment step');
  });

  it('should fail if not the active player', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    const action = {
      type: 'roll_bombardment' as const,
      playerId: 'player2',
      planetId: 'planet1', timestamp: Date.now(),
    };

    const result = validateRollBombardment(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not your turn');
  });

  it('should fail if wrong planet for current bombardment', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    state.invasionPhase!.targetPlanets = ['planet1'];
    state.invasionPhase!.currentPlanetIndex = 0;

    const action = {
      type: 'roll_bombardment' as const,
      playerId: 'player1',
      planetId: 'planet2', // Wrong planet
      timestamp: Date.now(),
    };

    const result = validateRollBombardment(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid planet for bombardment');
  });

  it('should fail if no units with bombardment ability', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    // Only infantry in space (no bombardment)
    state.map.tiles[0].units = [
      createMockUnit({ id: 'infantry1', type: 'infantry', ownerId: 'player1' }),
    ];

    const action = {
      type: 'roll_bombardment' as const,
      playerId: 'player1',
      planetId: 'planet1', timestamp: Date.now(),
    };

    const result = validateRollBombardment(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('No units with bombardment ability');
  });

  it('should allow bombardment with dreadnought', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    // Add dreadnought (has bombardment)
    state.map.tiles[0].units = [
      createMockUnit({ id: 'dread1', type: 'dreadnought', ownerId: 'player1' }),
    ];

    const action = {
      type: 'roll_bombardment' as const,
      playerId: 'player1',
      planetId: 'planet1', timestamp: Date.now(),
    };

    const result = validateRollBombardment(state, action);

    expect(result.valid).toBe(true);
  });
});

describe('validateSkipBombardment', () => {
  it('should fail if not in bombardment step', () => {
    const state = createMockGameState({ subPhase: 'tactical_invasion' });
    const action = {
      type: 'skip_bombardment' as const,
      playerId: 'player1',
      timestamp: Date.now(),
    };

    const result = validateSkipBombardment(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not in bombardment step');
  });

  it('should fail if not the active player', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    const action = {
      type: 'skip_bombardment' as const,
      playerId: 'player2',
      timestamp: Date.now(),
    };

    const result = validateSkipBombardment(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not your turn');
  });

  it('should allow active player to skip bombardment', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    const action = {
      type: 'skip_bombardment' as const,
      playerId: 'player1',
      timestamp: Date.now(),
    };

    const result = validateSkipBombardment(state, action);

    expect(result.valid).toBe(true);
  });
});

describe('validateAssignBombardmentHits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fail if no bombardment hits to assign', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    state.invasionPhase!.pendingBombardmentHits = 0;

    const action = {
      type: 'assign_bombardment_hits' as const,
      playerId: 'player2',
      assignments: [], timestamp: Date.now(),
    };

    const result = validateAssignBombardmentHits(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('No bombardment hits to assign');
  });

  it('should fail if player is not the defender (planet controller)', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    state.invasionPhase!.pendingBombardmentHits = 1;
    state.map.tiles[0].planets[0].controlledBy = 'player2';

    const action = {
      type: 'assign_bombardment_hits' as const,
      playerId: 'player1', // Not the defender
      assignments: [], timestamp: Date.now(),
    };

    const result = validateAssignBombardmentHits(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Only the defender can assign bombardment hits');
  });

  it('should fail if unit not found on planet', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    state.invasionPhase!.pendingBombardmentHits = 1;
    state.map.tiles[0].planets[0].controlledBy = 'player2';

    const action = {
      type: 'assign_bombardment_hits' as const,
      playerId: 'player2',
      assignments: [{ unitId: 'nonexistent', sustainDamage: false, destroyed: true }],
      timestamp: Date.now(),
    };

    const result = validateAssignBombardmentHits(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Unit nonexistent not found on planet');
  });

  it('should fail if unit belongs to another player', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    state.invasionPhase!.pendingBombardmentHits = 1;
    state.map.tiles[0].planets[0].controlledBy = 'player2';

    // Add player1's infantry to planet (shouldn't be there normally)
    const enemyInfantry = createMockUnit({
      id: 'enemy_inf',
      type: 'infantry',
      ownerId: 'player1',
    });
    state.map.tiles[0].planets[0].units.push(enemyInfantry);

    const action = {
      type: 'assign_bombardment_hits' as const,
      playerId: 'player2',
      assignments: [{ unitId: 'enemy_inf', sustainDamage: false, destroyed: true }],
      timestamp: Date.now(),
    };

    const result = validateAssignBombardmentHits(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot assign hits to units you do not own');
  });

  it('should fail if assigning hit to non-ground unit', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    state.invasionPhase!.pendingBombardmentHits = 1;
    state.map.tiles[0].planets[0].controlledBy = 'player2';

    // Add a PDS (not a ground unit)
    const pds = createMockUnit({ id: 'pds1', type: 'pds', ownerId: 'player2' });
    state.map.tiles[0].planets[0].units.push(pds);

    const action = {
      type: 'assign_bombardment_hits' as const,
      playerId: 'player2',
      assignments: [{ unitId: 'pds1', sustainDamage: false, destroyed: true }],
      timestamp: Date.now(),
    };

    const result = validateAssignBombardmentHits(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Bombardment only affects ground forces');
  });

  it('should allow defender to assign bombardment hits to their infantry', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    state.invasionPhase!.pendingBombardmentHits = 1;
    state.map.tiles[0].planets[0].controlledBy = 'player2';

    // Ensure defender has infantry on planet
    const defenderInfantry = createMockUnit({
      id: 'def_inf1',
      type: 'infantry',
      ownerId: 'player2',
    });
    state.map.tiles[0].planets[0].units = [defenderInfantry];

    const action = {
      type: 'assign_bombardment_hits' as const,
      playerId: 'player2',
      assignments: [{ unitId: 'def_inf1', sustainDamage: false, destroyed: true }],
      timestamp: Date.now(),
    };

    const result = validateAssignBombardmentHits(state, action);

    expect(result.valid).toBe(true);
  });
});

describe('validateAssignSpaceCannonHits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fail if not in space cannon defense step', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    const action = {
      type: 'assign_space_cannon_hits' as const,
      playerId: 'player1',
      assignments: [], timestamp: Date.now(),
    };

    const result = validateAssignSpaceCannonHits(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not in space cannon defense step');
  });

  it('should fail if no space cannon hits to assign', () => {
    const state = createMockGameState({ subPhase: 'space_cannon_defense' });
    state.invasionPhase!.pendingSpaceCannonHits = 0;

    const action = {
      type: 'assign_space_cannon_hits' as const,
      playerId: 'player1',
      assignments: [], timestamp: Date.now(),
    };

    const result = validateAssignSpaceCannonHits(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('No space cannon hits to assign');
  });

  it('should fail if unit was not committed to this planet', () => {
    const state = createMockGameState({ subPhase: 'space_cannon_defense' });
    state.invasionPhase!.pendingSpaceCannonHits = 1;
    state.invasionPhase!.groundForcesCommitted = { planet1: [] }; // No units committed

    // Put infantry on planet
    const infantry = createMockUnit({ id: 'inf1', type: 'infantry', ownerId: 'player1' });
    state.map.tiles[0].planets[0].units.push(infantry);

    const action = {
      type: 'assign_space_cannon_hits' as const,
      playerId: 'player1',
      assignments: [{ unitId: 'inf1', sustainDamage: false, destroyed: true }],
      timestamp: Date.now(),
    };

    const result = validateAssignSpaceCannonHits(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Unit inf1 was not committed to this planet');
  });

  it('should allow assigning hits to committed ground forces', () => {
    const state = createMockGameState({ subPhase: 'space_cannon_defense' });
    state.invasionPhase!.pendingSpaceCannonHits = 1;
    state.invasionPhase!.groundForcesCommitted = { planet1: ['inf1'] };

    // Put committed infantry on planet
    const infantry = createMockUnit({ id: 'inf1', type: 'infantry', ownerId: 'player1' });
    state.map.tiles[0].planets[0].units = [infantry];

    const action = {
      type: 'assign_space_cannon_hits' as const,
      playerId: 'player1',
      assignments: [{ unitId: 'inf1', sustainDamage: false, destroyed: true }],
      timestamp: Date.now(),
    };

    const result = validateAssignSpaceCannonHits(state, action);

    expect(result.valid).toBe(true);
  });
});

describe('validateSkipInvasion', () => {
  it('should fail if not in action phase', () => {
    const state = createMockGameState({ phase: 'strategy' });
    const action = {
      type: 'skip_invasion' as const,
      playerId: 'player1',
      timestamp: Date.now(),
    };

    const result = validateSkipInvasion(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not in action phase');
  });

  it('should fail if not in invasion subphase', () => {
    const state = createMockGameState({ subPhase: 'tactical_movement' });
    const action = {
      type: 'skip_invasion' as const,
      playerId: 'player1',
      timestamp: Date.now(),
    };

    const result = validateSkipInvasion(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not in invasion phase');
  });

  it('should fail if not the active player', () => {
    const state = createMockGameState();
    const action = {
      type: 'skip_invasion' as const,
      playerId: 'player2',
      timestamp: Date.now(),
    };

    const result = validateSkipInvasion(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Not your turn');
  });

  it('should allow active player to skip invasion in tactical_invasion subphase', () => {
    const state = createMockGameState({ subPhase: 'tactical_invasion' });
    const action = {
      type: 'skip_invasion' as const,
      playerId: 'player1',
      timestamp: Date.now(),
    };

    const result = validateSkipInvasion(state, action);

    expect(result.valid).toBe(true);
  });

  it('should allow skipping in select_planets subphase', () => {
    const state = createMockGameState({ subPhase: 'select_planets' });
    const action = {
      type: 'skip_invasion' as const,
      playerId: 'player1',
      timestamp: Date.now(),
    };

    const result = validateSkipInvasion(state, action);

    expect(result.valid).toBe(true);
  });

  it('should allow skipping in bombardment subphase', () => {
    const state = createMockGameState({ subPhase: 'bombardment' });
    const action = {
      type: 'skip_invasion' as const,
      playerId: 'player1',
      timestamp: Date.now(),
    };

    const result = validateSkipInvasion(state, action);

    expect(result.valid).toBe(true);
  });

  it('should allow skipping in commit_ground_forces subphase', () => {
    const state = createMockGameState({ subPhase: 'commit_ground_forces' });
    const action = {
      type: 'skip_invasion' as const,
      playerId: 'player1',
      timestamp: Date.now(),
    };

    const result = validateSkipInvasion(state, action);

    expect(result.valid).toBe(true);
  });
});
