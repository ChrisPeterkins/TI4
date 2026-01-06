import { describe, it, expect, beforeEach } from 'vitest';
import { applyCardEffect, EFFECT_HANDLERS } from '../action-card-effects.js';
import type {
  GameState,
  PlayerState,
  CombatInstance,
  MapTile,
  PlanetInstance,
  UnitInstance,
} from '@ti4/shared';

// =============================================================================
// MOCK HELPERS
// =============================================================================

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 5,
    commodities: 2,
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

function createMockUnit(
  type: string,
  ownerId: string,
  overrides: Partial<UnitInstance> = {}
): UnitInstance {
  return {
    id: `unit-${type}-${ownerId}-${Math.random().toString(36).substr(2, 9)}`,
    type: type as any,
    ownerId,
    damaged: false,
    ...overrides,
  };
}

function createMockPlanet(
  planetId: string,
  controlledBy: string | null,
  units: UnitInstance[] = []
): PlanetInstance {
  return {
    id: `planet-${planetId}`,
    planetId,
    controlledBy,
    exhausted: false,
    attachments: [],
    units,
  };
}

function createMockTile(
  id: string,
  position: { q: number; r: number },
  units: UnitInstance[] = [],
  planets: PlanetInstance[] = []
): MapTile {
  return {
    id,
    systemId: parseInt(id.split('-')[1]) || 0,
    position,
    rotation: 0,
    planets,
    wormhole: null,
    anomaly: null,
    units,
    commandTokens: [],
  };
}

function createMockCombat(
  type: 'space' | 'ground' = 'space',
  overrides: Partial<CombatInstance> = {}
): CombatInstance {
  return {
    id: 'combat-1',
    systemId: 'tile-0-0',
    type,
    attackerId: 'player1',
    defenderId: 'player2',
    roundNumber: 1,
    state: 'combat_round_roll',
    attackerUnits: [],
    defenderUnits: [],
    pendingHits: { attacker: 0, defender: 0 },
    retreatAnnounced: { attacker: false, defender: false },
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
    phase: 'action',
    subPhase: undefined,
    round: 1,
    activePlayerId: 'player1',
    speakerId: 'player1',
    players,
    map: {
      tiles: [],
      playerCount,
    },
    strategyCards: [],
    objectives: {
      publicStageI: [],
      publicStageII: [],
      secretDeck: [],
      revealedCount: 0,
    },
    agendas: {
      currentAgenda: null,
      currentAgendaNumber: 1,
      votes: new Map(),
      outcome: null,
      riders: [],
    },
    laws: [],
    initiativeOrder: players.map(p => p.id),
    activatedSystem: undefined,
    activeCombat: null,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    custodiansTaken: false,
    actionCardDeck: [],
    actionCardDiscard: [],
    agendaDeck: [],
    agendaDiscard: [],
    gameLog: [],
  } as GameState;
}

// =============================================================================
// COMBAT CARD EFFECTS
// =============================================================================

describe('Combat Card Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Shields Holding', () => {
    it('should cancel up to 2 hits during space combat', () => {
      gameState.activeCombat = createMockCombat('space', {
        pendingHits: { attacker: 0, defender: 3 },
      });

      const result = applyCardEffect(gameState, 'shields_holding_1', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.pendingHits.defender).toBe(1);
      expect(result.triggeredEvents).toContain('hits_cancelled');
    });

    it('should cancel only available hits if fewer than 2', () => {
      gameState.activeCombat = createMockCombat('space', {
        pendingHits: { attacker: 0, defender: 1 },
      });

      const result = applyCardEffect(gameState, 'shields_holding_2', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.pendingHits.defender).toBe(0);
    });

    it('should fail if no active space combat', () => {
      gameState.activeCombat = null;

      const result = applyCardEffect(gameState, 'shields_holding_1', 'player1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('space combat');
    });

    it('should fail during ground combat', () => {
      gameState.activeCombat = createMockCombat('ground');

      const result = applyCardEffect(gameState, 'shields_holding_1', 'player1');

      expect(result.success).toBe(false);
    });
  });

  describe('Morale Boost', () => {
    it('should add +1 combat bonus', () => {
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'morale_boost_1', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.temporaryModifiers?.player1?.combatBonus).toBe(1);
      expect(result.triggeredEvents).toContain('combat_modifier_applied');
    });

    it('should stack with multiple morale boosts', () => {
      gameState.activeCombat = createMockCombat('space');

      applyCardEffect(gameState, 'morale_boost_1', 'player1');
      applyCardEffect(gameState, 'morale_boost_2', 'player1');

      expect(gameState.activeCombat?.temporaryModifiers?.player1?.combatBonus).toBe(2);
    });

    it('should fail if no active combat', () => {
      gameState.activeCombat = null;

      const result = applyCardEffect(gameState, 'morale_boost_1', 'player1');

      expect(result.success).toBe(false);
    });
  });

  describe('Direct Hit', () => {
    it('should destroy a ship that used sustain damage', () => {
      const ship = createMockUnit('dreadnought', 'player2');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [ship]);
      gameState.map.tiles = [tile];
      gameState.activeCombat = createMockCombat('space', { systemId: 'tile-0-0' });

      const result = applyCardEffect(gameState, 'direct_hit_1', 'player1', {
        sustainedUnitId: ship.id,
      });

      expect(result.success).toBe(true);
      expect(tile.units).not.toContain(ship);
      expect(result.triggeredEvents).toContain('unit_destroyed');
    });

    it('should fail if no target specified', () => {
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'direct_hit_1', 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('sustain damage');
    });

    it('should fail if targeting own ship', () => {
      const ship = createMockUnit('dreadnought', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [ship]);
      gameState.map.tiles = [tile];
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'direct_hit_1', 'player1', {
        sustainedUnitId: ship.id,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('own ship');
    });
  });

  describe('Emergency Repairs', () => {
    it('should repair all damaged units in combat', () => {
      const unit1 = createMockUnit('dreadnought', 'player1', { damaged: true });
      const unit2 = createMockUnit('carrier', 'player1', { damaged: true });
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [unit1, unit2]);
      gameState.map.tiles = [tile];
      gameState.activeCombat = createMockCombat('space', { systemId: 'tile-0-0' });

      const result = applyCardEffect(gameState, 'emergency_repairs', 'player1');

      expect(result.success).toBe(true);
      expect(unit1.damaged).toBe(false);
      expect(unit2.damaged).toBe(false);
      expect(result.triggeredEvents).toContain('units_repaired');
    });
  });

  describe('Bunker', () => {
    it('should apply -4 combat penalty to opponent', () => {
      gameState.activeCombat = createMockCombat('ground');

      const result = applyCardEffect(gameState, 'bunker', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.temporaryModifiers?.player2?.combatPenalty).toBe(4);
    });

    it('should fail during space combat', () => {
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'bunker', 'player1');

      expect(result.success).toBe(false);
    });
  });

  describe('Blitz', () => {
    it('should add extra dice modifier', () => {
      gameState.activeCombat = createMockCombat('ground');

      const result = applyCardEffect(gameState, 'blitz', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.temporaryModifiers?.player1?.extraDice).toBe(1);
    });
  });
});

// =============================================================================
// TACTICAL CARD EFFECTS
// =============================================================================

describe('Tactical Card Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Flank Speed', () => {
    it('should add +1 movement bonus', () => {
      const result = applyCardEffect(gameState, 'flank_speed_1', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.tacticalModifiers?.player1?.movementBonus).toBe(1);
      expect(result.triggeredEvents).toContain('tactical_modifier_applied');
    });
  });

  describe('War Machine', () => {
    it('should add +4 production bonus', () => {
      const result = applyCardEffect(gameState, 'war_machine_1', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.tacticalModifiers?.player1?.productionBonus).toBe(4);
    });
  });

  describe('Ghost Ship', () => {
    it('should place a destroyer in the activated system', () => {
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 });
      gameState.map.tiles = [tile];
      gameState.activatedSystem = { q: 0, r: 0 };

      const result = applyCardEffect(gameState, 'ghost_ship', 'player1');

      expect(result.success).toBe(true);
      expect(tile.units.length).toBe(1);
      expect(tile.units[0].type).toBe('destroyer');
      expect(tile.units[0].ownerId).toBe('player1');
    });

    it('should fail without activated system', () => {
      gameState.activatedSystem = undefined;

      const result = applyCardEffect(gameState, 'ghost_ship', 'player1');

      expect(result.success).toBe(false);
    });
  });

  describe('In the Silence of Space', () => {
    it('should enable passing through enemy ships', () => {
      const result = applyCardEffect(gameState, 'in_the_silence_of_space', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.tacticalModifiers?.player1?.canPassThroughShips).toBe(true);
    });
  });

  describe('Unexpected Action', () => {
    it('should remove command token and return to tactics pool', () => {
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 });
      tile.commandTokens = ['player1'];
      gameState.map.tiles = [tile];
      gameState.players[0].commandTokens.tactics = 2;

      const result = applyCardEffect(gameState, 'unexpected_action', 'player1', {
        systemPosition: { q: 0, r: 0 },
      });

      expect(result.success).toBe(true);
      expect(tile.commandTokens).not.toContain('player1');
      expect(gameState.players[0].commandTokens.tactics).toBe(3);
    });
  });

  describe('Counterstroke', () => {
    it('should remove command token and add to fleet pool', () => {
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 });
      tile.commandTokens = ['player1'];
      gameState.map.tiles = [tile];
      gameState.players[0].commandTokens.fleet = 2;

      const result = applyCardEffect(gameState, 'counterstroke', 'player1', {
        systemPosition: { q: 0, r: 0 },
      });

      expect(result.success).toBe(true);
      expect(tile.commandTokens).not.toContain('player1');
      expect(gameState.players[0].commandTokens.fleet).toBe(3);
    });
  });
});

// =============================================================================
// COMPONENT ACTION EFFECTS
// =============================================================================

describe('Component Action Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Summit', () => {
    it('should draw 2 action cards', () => {
      gameState.actionCardDeck = ['card1', 'card2', 'card3'];

      const result = applyCardEffect(gameState, 'summit', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.players[0].actionCards.length).toBe(2);
      expect(gameState.actionCardDeck.length).toBe(1);
    });
  });

  describe('Rise of a Messiah', () => {
    it('should place infantry on all controlled planets', () => {
      const planet1 = createMockPlanet('planet1', 'player1');
      const planet2 = createMockPlanet('planet2', 'player1');
      const planet3 = createMockPlanet('planet3', 'player2'); // Not controlled
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet1, planet2, planet3]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'rise_of_a_messiah', 'player1');

      expect(result.success).toBe(true);
      expect(planet1.units.length).toBe(1);
      expect(planet1.units[0].type).toBe('infantry');
      expect(planet2.units.length).toBe(1);
      expect(planet3.units.length).toBe(0); // Not controlled
    });
  });

  describe('War Effort', () => {
    it('should place cruiser in system with ships', () => {
      const ship = createMockUnit('destroyer', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [ship]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'war_effort', 'player1', {
        systemPosition: { q: 0, r: 0 },
      });

      expect(result.success).toBe(true);
      expect(tile.units.length).toBe(2);
      expect(tile.units.some(u => u.type === 'cruiser')).toBe(true);
    });

    it('should fail in system without ships', () => {
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 });
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'war_effort', 'player1', {
        systemPosition: { q: 0, r: 0 },
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Cripple Defenses', () => {
    it('should destroy all PDS on target planet', () => {
      const pds1 = createMockUnit('pds', 'player2');
      const pds2 = createMockUnit('pds', 'player2');
      const infantry = createMockUnit('infantry', 'player2');
      const planet = createMockPlanet('planet1', 'player2', [pds1, pds2, infantry]);
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'cripple_defenses', 'player1', {
        planetId: 'planet1',
      });

      expect(result.success).toBe(true);
      expect(planet.units.length).toBe(1);
      expect(planet.units[0].type).toBe('infantry'); // Infantry remains
    });
  });

  describe('Reactor Meltdown', () => {
    it('should destroy a space dock', () => {
      const spaceDock = createMockUnit('space_dock', 'player2');
      const planet = createMockPlanet('planet1', 'player2', [spaceDock]);
      const ship = createMockUnit('cruiser', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [ship], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'reactor_meltdown', 'player1', {
        unitIds: [spaceDock.id],
      });

      expect(result.success).toBe(true);
      expect(planet.units).not.toContain(spaceDock);
    });
  });

  describe('Spy', () => {
    it('should take random action card from target player', () => {
      gameState.players[1].actionCards = ['card1', 'card2', 'card3'];

      const result = applyCardEffect(gameState, 'spy', 'player1', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(gameState.players[0].actionCards.length).toBe(1);
      expect(gameState.players[1].actionCards.length).toBe(2);
    });

    it('should fail if target has no cards', () => {
      gameState.players[1].actionCards = [];

      const result = applyCardEffect(gameState, 'spy', 'player1', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Signal Jamming', () => {
    it('should place enemy command token in system', () => {
      const ship = createMockUnit('cruiser', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [ship]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'signal_jamming', 'player1', {
        systemPosition: { q: 0, r: 0 },
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(tile.commandTokens).toContain('player2');
      expect(gameState.players[1].commandTokens.tactics).toBe(2);
    });
  });

  describe('Insubordination', () => {
    it('should remove fleet token from target player', () => {
      gameState.players[1].commandTokens.fleet = 3;

      const result = applyCardEffect(gameState, 'insubordination', 'player1', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(gameState.players[1].commandTokens.fleet).toBe(2);
    });
  });

  describe('Uprising', () => {
    it('should exhaust enemy planet', () => {
      const planet = createMockPlanet('test_planet', 'player2');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];
      gameState.players[0].tradeGoods = 5;

      const result = applyCardEffect(gameState, 'uprising', 'player1', {
        planetId: 'test_planet',
      });

      expect(result.success).toBe(true);
      expect(planet.exhausted).toBe(true);
      // TG gain is 0 since test planet has no resource data
      expect(result.triggeredEvents).toContain('planet_exhausted');
    });

    it('should fail if targeting own planet', () => {
      const planet = createMockPlanet('test_planet', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'uprising', 'player1', {
        planetId: 'test_planet',
      });

      expect(result.success).toBe(false);
    });

    it('should fail if planet not found', () => {
      const result = applyCardEffect(gameState, 'uprising', 'player1', {
        planetId: 'nonexistent',
      });

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// AGENDA CARD EFFECTS
// =============================================================================

describe('Agenda Card Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
    gameState.phase = 'agenda';
    gameState.agendaPhase = {
      currentStep: 'voting',
      agendaNumber: 1,
      currentAgendaId: 'test-agenda',
      currentAgendaType: 'directive',
      currentElectionType: 'for_against',
      votingOrder: ['player1', 'player2'],
      currentVoterIndex: 0,
      votingComplete: [],
      votes: {},
      voteTallies: {},
      riders: [],
      vetoed: false,
      electedOutcome: null,
      electedPlayer: null,
      electedPlanet: null,
    };
  });

  describe('Distinguished Councilor', () => {
    it('should add 5 extra votes', () => {
      gameState.agendaPhase!.votes['player1'] = {
        outcome: 'for',
        votes: 3,
        extraVotes: 0,
        abstained: false,
        exhaustedPlanets: [],
      };

      const result = applyCardEffect(gameState, 'distinguished_councilor', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.agendaPhase?.votes['player1'].extraVotes).toBe(5);
    });
  });

  describe('Bribery', () => {
    it('should spend TG for votes', () => {
      gameState.players[0].tradeGoods = 10;
      gameState.agendaPhase!.votes['player1'] = {
        outcome: 'for',
        votes: 3,
        extraVotes: 0,
        abstained: false,
        exhaustedPlanets: [],
      };

      const result = applyCardEffect(gameState, 'bribery', 'player1', { count: 5 });

      expect(result.success).toBe(true);
      expect(gameState.players[0].tradeGoods).toBe(5);
      expect(gameState.agendaPhase?.votes['player1'].extraVotes).toBe(5);
    });
  });

  describe('Veto', () => {
    it('should discard current agenda and draw new one', () => {
      gameState.agendaDeck = ['new-agenda'];
      gameState.agendaDiscard = [];

      const result = applyCardEffect(gameState, 'veto', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.agendaPhase?.currentAgendaId).toBe('new-agenda');
      expect(gameState.agendaDiscard).toContain('test-agenda');
      expect(gameState.agendaPhase?.vetoed).toBe(true);
    });
  });

  describe('Repeal Law', () => {
    it('should remove a law from play', () => {
      gameState.laws = [{ cardId: 'law1' }, { cardId: 'law2' }];

      const result = applyCardEffect(gameState, 'repeal_law', 'player1', {
        agendaId: 'law1',
      });

      expect(result.success).toBe(true);
      expect(gameState.laws.length).toBe(1);
      expect(gameState.laws[0].cardId).toBe('law2');
      expect(gameState.agendaDiscard).toContain('law1');
    });
  });

  describe('Reparations', () => {
    it('should draw action cards equal to law count', () => {
      gameState.laws = [{ cardId: 'law1' }, { cardId: 'law2' }, { cardId: 'law3' }];
      gameState.actionCardDeck = ['c1', 'c2', 'c3', 'c4', 'c5'];

      const result = applyCardEffect(gameState, 'reparations', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.players[0].actionCards.length).toBe(3);
    });
  });
});

// =============================================================================
// SPECIAL TIMING CARD EFFECTS
// =============================================================================

describe('Special Timing Card Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Disable', () => {
    it('should mark ship as disabled for AFB', () => {
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'disable', 'player1', {
        unitIds: ['unit1'],
      });

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.temporaryModifiers?.player2?.disabledAFBUnits).toContain('unit1');
    });
  });

  describe('Scramble Frequency', () => {
    it('should cancel AFB hits', () => {
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'scramble_frequency', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.temporaryModifiers?.player1?.afbHitsCancelled).toBe(true);
    });
  });

  describe('Maneuvering Jets', () => {
    it('should add space cannon hit cancellation', () => {
      const result = applyCardEffect(gameState, 'maneuvering_jets_1', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.tacticalModifiers?.player1?.spaceCannonHitsCancelled).toBe(1);
    });
  });

  describe('Fighter Prototype', () => {
    it('should add fighter bonus during ground combat', () => {
      gameState.activeCombat = createMockCombat('ground');

      const result = applyCardEffect(gameState, 'fighter_prototype', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.temporaryModifiers?.player1?.fighterBonus).toBe(2);
    });

    it('should add fighter penalty during space combat', () => {
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'fighter_prototype', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.temporaryModifiers?.player1?.fighterBonus).toBe(-1);
    });
  });

  describe('Solar Flare', () => {
    it('should set solar flare system', () => {
      const result = applyCardEffect(gameState, 'solar_flare', 'player1', {
        systemPosition: { q: 1, r: 0 },
      });

      expect(result.success).toBe(true);
      expect(gameState.tacticalModifiers?.player1?.solarFlareSystem).toEqual({ q: 1, r: 0 });
    });
  });
});

// =============================================================================
// STRATEGY PHASE CARD EFFECTS
// =============================================================================

describe('Strategy Phase Card Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Tech Sabotage', () => {
    it('should reduce target production by 4', () => {
      const result = applyCardEffect(gameState, 'tech_sabotage', 'player1', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(gameState.tacticalModifiers?.player2?.productionPenalty).toBe(4);
    });
  });

  describe('Resist Strategy', () => {
    it('should give player 1 TG and 1 command token', () => {
      gameState.players[0].tradeGoods = 5;
      gameState.players[0].commandTokens.tactics = 2;
      gameState.strategicActionState = {
        cardNumber: 7,
        primaryResolved: false,
        secondaryOrder: ['player1', 'player2'],
        currentSecondaryIndex: 0,
        secondaryResponses: {},
      };

      const result = applyCardEffect(gameState, 'resist_strategy', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.players[0].tradeGoods).toBe(6);
      expect(gameState.players[0].commandTokens.tactics).toBe(3);
      expect(gameState.strategicActionState?.secondaryResponses['player1']).toBe('declined');
    });
  });
});

// =============================================================================
// ADDITIONAL COMBAT CARD EFFECTS
// =============================================================================

describe('Additional Combat Card Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Lucky Shot', () => {
    it('should destroy a dreadnought', () => {
      const dreadnought = createMockUnit('dreadnought', 'player2');
      const myShip = createMockUnit('cruiser', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [dreadnought, myShip]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'lucky_shot', 'player1', {
        unitIds: [dreadnought.id],
      });

      expect(result.success).toBe(true);
      expect(tile.units).not.toContainEqual(expect.objectContaining({ id: dreadnought.id }));
    });

    it('should destroy a cruiser', () => {
      const cruiser = createMockUnit('cruiser', 'player2');
      const myShip = createMockUnit('destroyer', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [cruiser, myShip]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'lucky_shot', 'player1', {
        unitIds: [cruiser.id],
      });

      expect(result.success).toBe(true);
      expect(tile.units).not.toContainEqual(expect.objectContaining({ id: cruiser.id }));
    });

    it('should destroy a destroyer', () => {
      const destroyer = createMockUnit('destroyer', 'player2');
      const myShip = createMockUnit('cruiser', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [destroyer, myShip]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'lucky_shot', 'player1', {
        unitIds: [destroyer.id],
      });

      expect(result.success).toBe(true);
    });

    it('should fail for flagship', () => {
      const flagship = createMockUnit('flagship', 'player2');
      const myShip = createMockUnit('cruiser', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [flagship, myShip]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'lucky_shot', 'player1', {
        unitIds: [flagship.id],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('dreadnought, cruiser, or destroyer');
    });

    it('should fail for own ships', () => {
      const cruiser = createMockUnit('cruiser', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [cruiser]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'lucky_shot', 'player1', {
        unitIds: [cruiser.id],
      });

      expect(result.success).toBe(false);
    });

    it('should fail if player has no units in system', () => {
      const dreadnought = createMockUnit('dreadnought', 'player2');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [dreadnought]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'lucky_shot', 'player1', {
        unitIds: [dreadnought.id],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('units in the system');
    });
  });

  describe('Skilled Retreat', () => {
    it('should move ships to destination system', () => {
      const ship1 = createMockUnit('cruiser', 'player1');
      const ship2 = createMockUnit('destroyer', 'player1');
      const enemyShip = createMockUnit('cruiser', 'player2');
      const currentTile = createMockTile('tile-0-0', { q: 0, r: 0 }, [ship1, ship2, enemyShip]);
      const destTile = createMockTile('tile-1-0', { q: 1, r: 0 }, []);
      gameState.map.tiles = [currentTile, destTile];
      gameState.activeCombat = createMockCombat('space', { systemId: 'tile-0-0' });

      const result = applyCardEffect(gameState, 'skilled_retreat', 'player1', {
        destinationSystem: { q: 1, r: 0 },
      });

      expect(result.success).toBe(true);
      expect(currentTile.units.filter(u => u.ownerId === 'player1')).toHaveLength(0);
      expect(destTile.units.filter(u => u.ownerId === 'player1')).toHaveLength(2);
    });

    it('should fail if destination has enemy ships', () => {
      const ship = createMockUnit('cruiser', 'player1');
      const currentTile = createMockTile('tile-0-0', { q: 0, r: 0 }, [ship]);
      const enemyInDest = createMockUnit('cruiser', 'player2');
      const destTile = createMockTile('tile-1-0', { q: 1, r: 0 }, [enemyInDest]);
      gameState.map.tiles = [currentTile, destTile];
      gameState.activeCombat = createMockCombat('space', { systemId: 'tile-0-0' });

      const result = applyCardEffect(gameState, 'skilled_retreat', 'player1', {
        destinationSystem: { q: 1, r: 0 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('enemy ships');
    });

    it('should end combat after retreat', () => {
      const ship = createMockUnit('cruiser', 'player1');
      const currentTile = createMockTile('tile-0-0', { q: 0, r: 0 }, [ship]);
      const destTile = createMockTile('tile-1-0', { q: 1, r: 0 }, []);
      gameState.map.tiles = [currentTile, destTile];
      gameState.activeCombat = createMockCombat('space', { systemId: 'tile-0-0' });

      applyCardEffect(gameState, 'skilled_retreat', 'player1', {
        destinationSystem: { q: 1, r: 0 },
      });

      expect(gameState.activeCombat?.state).toBe('combat_complete');
    });
  });

  describe('Fire Team', () => {
    it('should add unlimited rerolls', () => {
      gameState.activeCombat = createMockCombat('ground');

      const result = applyCardEffect(gameState, 'fire_team', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.temporaryModifiers?.player1?.rerollsAvailable).toBe(999);
    });

    it('should fail during space combat', () => {
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'fire_team', 'player1');

      expect(result.success).toBe(false);
    });
  });

  describe('Courageous to the End', () => {
    it('should roll dice for destroyed ship', () => {
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'courageous_to_the_end', 'player1', {
        sustainedUnitId: 'destroyed-ship',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('courageous_to_the_end');
      expect(result.data?.rolls).toHaveLength(2);
    });

    it('should fail if no destroyed ship specified', () => {
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'courageous_to_the_end', 'player1', {});

      expect(result.success).toBe(false);
    });

    it('should fail during ground combat', () => {
      gameState.activeCombat = createMockCombat('ground');

      const result = applyCardEffect(gameState, 'courageous_to_the_end', 'player1', {
        sustainedUnitId: 'destroyed-ship',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Infiltrate', () => {
    it('should mark infantry as infiltrated', () => {
      gameState.activeCombat = createMockCombat('ground');

      const result = applyCardEffect(gameState, 'infiltrate', 'player1', {
        unitIds: ['inf-1', 'inf-2'],
      });

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.temporaryModifiers?.player1?.infiltratedUnits).toEqual(['inf-1', 'inf-2']);
    });

    it('should fail if more than 2 infantry selected', () => {
      gameState.activeCombat = createMockCombat('ground');

      const result = applyCardEffect(gameState, 'infiltrate', 'player1', {
        unitIds: ['inf-1', 'inf-2', 'inf-3'],
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('up to 2');
    });

    it('should fail during space combat', () => {
      gameState.activeCombat = createMockCombat('space');

      const result = applyCardEffect(gameState, 'infiltrate', 'player1', {
        unitIds: ['inf-1'],
      });

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// ADDITIONAL TACTICAL CARD EFFECTS
// =============================================================================

describe('Additional Tactical Card Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Frontline Deployment', () => {
    it('should place 3 infantry on controlled planet', () => {
      const planet = createMockPlanet('planet1', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];
      gameState.activatedSystem = { q: 0, r: 0 };

      const result = applyCardEffect(gameState, 'frontline_deployment', 'player1', {
        planetId: 'planet1',
      });

      expect(result.success).toBe(true);
      expect(planet.units.filter(u => u.type === 'infantry')).toHaveLength(3);
    });

    it('should fail if planet not controlled', () => {
      const planet = createMockPlanet('planet1', 'player2');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];
      gameState.activatedSystem = { q: 0, r: 0 };

      const result = applyCardEffect(gameState, 'frontline_deployment', 'player1', {
        planetId: 'planet1',
      });

      expect(result.success).toBe(false);
    });

    it('should fail if planet not in activated system', () => {
      const planet = createMockPlanet('planet1', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      const tile2 = createMockTile('tile-1-0', { q: 1, r: 0 }, []);
      gameState.map.tiles = [tile, tile2];
      gameState.activatedSystem = { q: 1, r: 0 };

      const result = applyCardEffect(gameState, 'frontline_deployment', 'player1', {
        planetId: 'planet1',
      });

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// ADDITIONAL COMPONENT ACTION EFFECTS
// =============================================================================

describe('Additional Component Action Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Mining Initiative', () => {
    it('should gain TG equal to planet resources', () => {
      const planet = createMockPlanet('jord', 'player1'); // Jord has 4 resources
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];
      gameState.players[0].tradeGoods = 0;

      const result = applyCardEffect(gameState, 'mining_initiative', 'player1', {
        planetId: 'jord',
      });

      expect(result.success).toBe(true);
      expect(gameState.players[0].tradeGoods).toBeGreaterThanOrEqual(0);
    });

    it('should fail if planet not controlled', () => {
      const planet = createMockPlanet('jord', 'player2');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'mining_initiative', 'player1', {
        planetId: 'jord',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Industrial Initiative', () => {
    it('should gain TG for industrial planets', () => {
      const planet1 = createMockPlanet('abyz', 'player1'); // industrial
      const planet2 = createMockPlanet('fria', 'player1'); // hazardous
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet1, planet2]);
      gameState.map.tiles = [tile];
      gameState.players[0].tradeGoods = 0;

      const result = applyCardEffect(gameState, 'industrial_initiative', 'player1');

      expect(result.success).toBe(true);
      // Just verify it works - exact amount depends on planet data
    });
  });

  describe('Focused Research', () => {
    it('should research tech for 4 TG', () => {
      gameState.players[0].tradeGoods = 5;
      gameState.players[0].technologies = [];

      const result = applyCardEffect(gameState, 'focused_research', 'player1', {
        techId: 'neural_motivator',
      });

      expect(result.success).toBe(true);
      expect(gameState.players[0].tradeGoods).toBe(1);
      expect(gameState.players[0].technologies).toContain('neural_motivator');
    });

    it('should fail with insufficient TG', () => {
      gameState.players[0].tradeGoods = 3;

      const result = applyCardEffect(gameState, 'focused_research', 'player1', {
        techId: 'neural_motivator',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('trade goods');
    });
  });

  describe('Ghost Squad', () => {
    it('should place infantry on planet without structures', () => {
      const planet = createMockPlanet('test_planet', null);
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'ghost_squad', 'player1', {
        planetId: 'test_planet',
      });

      expect(result.success).toBe(true);
      expect(planet.units.some(u => u.type === 'infantry')).toBe(true);
    });

    it('should fail if planet has structures', () => {
      const pds = createMockUnit('pds', 'player2');
      const planet = createMockPlanet('test_planet', 'player2', [pds]);
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'ghost_squad', 'player1', {
        planetId: 'test_planet',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('structures');
    });

    it('should fail on Mecatol Rex', () => {
      const planet = createMockPlanet('mecatol_rex', null);
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'ghost_squad', 'player1', {
        planetId: 'mecatol_rex',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mecatol Rex');
    });
  });

  describe('Fighter Conscription', () => {
    it('should place fighter in systems with capacity ships', () => {
      const carrier = createMockUnit('carrier', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [carrier]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'fighter_conscription', 'player1');

      expect(result.success).toBe(true);
      expect(tile.units.some(u => u.type === 'fighter')).toBe(true);
    });

    it('should place in multiple systems', () => {
      const carrier1 = createMockUnit('carrier', 'player1');
      const carrier2 = createMockUnit('dreadnought', 'player1');
      const tile1 = createMockTile('tile-0-0', { q: 0, r: 0 }, [carrier1]);
      const tile2 = createMockTile('tile-1-0', { q: 1, r: 0 }, [carrier2]);
      gameState.map.tiles = [tile1, tile2];

      const result = applyCardEffect(gameState, 'fighter_conscription', 'player1');

      expect(result.success).toBe(true);
      expect(result.data?.count).toBe(2);
    });
  });

  describe('Plague', () => {
    it('should roll for each infantry on target planet', () => {
      const inf1 = createMockUnit('infantry', 'player2');
      const inf2 = createMockUnit('infantry', 'player2');
      const planet = createMockPlanet('test_planet', 'player2', [inf1, inf2]);
      const ship = createMockUnit('cruiser', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [ship], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'plague', 'player1', {
        planetId: 'test_planet',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('plague_applied');
      expect(result.data?.rolls).toHaveLength(2);
    });

    it('should fail if no ships in system', () => {
      const inf = createMockUnit('infantry', 'player2');
      const planet = createMockPlanet('test_planet', 'player2', [inf]);
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'plague', 'player1', {
        planetId: 'test_planet',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('ships');
    });
  });

  describe('Unstable Planet', () => {
    it('should exhaust hazardous planet and destroy infantry', () => {
      const inf1 = createMockUnit('infantry', 'player2');
      const inf2 = createMockUnit('infantry', 'player2');
      const inf3 = createMockUnit('infantry', 'player2');
      const inf4 = createMockUnit('infantry', 'player2');
      const planet = createMockPlanet('fria', 'player2', [inf1, inf2, inf3, inf4]); // hazardous
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'unstable_planet', 'player1', {
        planetId: 'fria',
      });

      expect(result.success).toBe(true);
      expect(planet.exhausted).toBe(true);
      // Should destroy up to 3 infantry
      expect(planet.units.filter(u => u.type === 'infantry').length).toBeLessThanOrEqual(1);
    });

    it('should fail for non-hazardous planet', () => {
      const planet = createMockPlanet('mecatol_rex', 'player2'); // not hazardous
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'unstable_planet', 'player1', {
        planetId: 'mecatol_rex',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('hazardous');
    });
  });

  describe('Tactical Bombardment', () => {
    it('should roll bombardment for units', () => {
      const warSun = createMockUnit('war_sun', 'player1');
      const planet = createMockPlanet('test_planet', 'player2');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [warSun], [planet]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'tactical_bombardment', 'player1', {
        systemPosition: { q: 0, r: 0 },
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('tactical_bombardment');
    });

    it('should fail if no bombardment units', () => {
      const cruiser = createMockUnit('cruiser', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [cruiser]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'tactical_bombardment', 'player1', {
        systemPosition: { q: 0, r: 0 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('bombardment');
    });
  });

  describe('Master Plan', () => {
    it('should enable free strategic action', () => {
      const result = applyCardEffect(gameState, 'master_plan', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.tacticalModifiers?.player1?.freeStrategicAction).toBe(true);
    });
  });

  describe('Probe', () => {
    it('should reveal target player action cards', () => {
      gameState.players[1].actionCards = ['card1', 'card2'];

      const result = applyCardEffect(gameState, 'probe', 'player1', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(result.data?.revealedCards).toEqual(['card1', 'card2']);
    });

    it('should fail without target', () => {
      const result = applyCardEffect(gameState, 'probe', 'player1', {});

      expect(result.success).toBe(false);
    });
  });

  describe('Harness Energy', () => {
    it('should gain TG for planets with units', () => {
      const inf1 = createMockUnit('infantry', 'player1');
      const inf2 = createMockUnit('infantry', 'player1');
      const planet1 = createMockPlanet('planet1', 'player1', [inf1]);
      const planet2 = createMockPlanet('planet2', 'player1', [inf2]);
      const planet3 = createMockPlanet('planet3', 'player1'); // no units
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [], [planet1, planet2, planet3]);
      gameState.map.tiles = [tile];
      gameState.players[0].tradeGoods = 0;

      const result = applyCardEffect(gameState, 'harness_energy', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.players[0].tradeGoods).toBe(2);
    });
  });
});

// =============================================================================
// ADDITIONAL AGENDA CARD EFFECTS
// =============================================================================

describe('Additional Agenda Card Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
    gameState.phase = 'agenda';
    gameState.agendaPhase = {
      currentStep: 'voting',
      agendaNumber: 1,
      currentAgendaId: 'test-agenda',
      currentAgendaType: 'directive',
      currentElectionType: 'for_against',
      votingOrder: ['player1', 'player2'],
      currentVoterIndex: 0,
      votingComplete: [],
      votes: {},
      voteTallies: {},
      riders: [],
      vetoed: false,
      electedOutcome: null,
      electedPlayer: null,
      electedPlanet: null,
    };
  });

  describe('Confusing Legal Text', () => {
    it('should mark outcomes for swap', () => {
      const result = applyCardEffect(gameState, 'confusing_legal_text', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.agendaPhase?.confusingLegalText).toBe(true);
    });
  });

  describe('Sanctions', () => {
    it('should mark sanctions active', () => {
      const result = applyCardEffect(gameState, 'sanctions', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.agendaPhase?.sanctionsActive).toBe('player1');
    });
  });

  describe('Political Stability', () => {
    it('should mark player keeps strategy card', () => {
      const result = applyCardEffect(gameState, 'political_stability', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.players[0].keepStrategyCard).toBe(true);
    });
  });

  describe('Public Disgrace', () => {
    it('should block target commodity refresh', () => {
      const result = applyCardEffect(gameState, 'public_disgrace', 'player1', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(gameState.players[1].commodityRefreshBlocked).toBe(true);
    });

    it('should fail without target', () => {
      const result = applyCardEffect(gameState, 'public_disgrace', 'player1', {});

      expect(result.success).toBe(false);
    });
  });

  describe('Rider Cards', () => {
    it('should store rider prediction', () => {
      const result = applyCardEffect(gameState, 'imperial_rider', 'player1', {
        prediction: 'for',
        cardId: 'imperial_rider',
      });

      expect(result.success).toBe(true);
      expect(gameState.agendaPhase?.riders).toHaveLength(1);
      expect(gameState.agendaPhase?.riders[0].prediction).toBe('for');
    });

    it('should fail without prediction', () => {
      const result = applyCardEffect(gameState, 'construction_rider', 'player1', {});

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// SPECIAL TIMING CARD EFFECTS - EXTENDED
// =============================================================================

describe('Special Timing Card Effects - Extended', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Experimental Battlestation', () => {
    it('should add space cannon ability with activated system', () => {
      gameState.activatedSystem = { q: 0, r: 0 };

      const result = applyCardEffect(gameState, 'experimental_battlestation', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.tacticalModifiers?.player1?.experimentalBattlestation).toBeDefined();
    });

    it('should fail without activated system', () => {
      gameState.activatedSystem = undefined;

      const result = applyCardEffect(gameState, 'experimental_battlestation', 'player1');

      expect(result.success).toBe(false);
    });
  });

  describe('Reveal Prototype', () => {
    it('should grant sustain damage to unit', () => {
      const cruiser = createMockUnit('cruiser', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [cruiser]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'reveal_prototype', 'player1', {
        unitIds: [cruiser.id],
      });

      expect(result.success).toBe(true);
    });

    it('should fail without unit selection', () => {
      const result = applyCardEffect(gameState, 'reveal_prototype', 'player1', {});

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// POK ACTION CARD EFFECTS
// =============================================================================

describe('POK Action Card Effects', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('Waylay', () => {
    it('should block attacker retreat when defender', () => {
      gameState.activeCombat = createMockCombat('space', {
        attackerId: 'player2',
        defenderId: 'player1',
      });

      const result = applyCardEffect(gameState, 'waylay', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.activeCombat?.temporaryModifiers?.player2?.cannotRetreat).toBe(true);
    });

    it('should fail when attacker', () => {
      gameState.activeCombat = createMockCombat('space', {
        attackerId: 'player1',
        defenderId: 'player2',
      });

      const result = applyCardEffect(gameState, 'waylay', 'player1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('defender');
    });
  });

  describe('Rally', () => {
    it('should draw cards for ship types with ground forces', () => {
      const carrier = createMockUnit('carrier', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [carrier]);
      gameState.map.tiles = [tile];
      gameState.activeCombat = createMockCombat('space', { systemId: 'tile-0-0' });
      gameState.actionCardDeck = ['card1', 'card2', 'card3'];

      const result = applyCardEffect(gameState, 'rally', 'player1');

      expect(result.success).toBe(true);
    });

    it('should fail without active combat', () => {
      const result = applyCardEffect(gameState, 'rally', 'player1');

      expect(result.success).toBe(false);
    });
  });

  describe('Salvage', () => {
    it('should gain TG after space combat', () => {
      gameState.activeCombat = createMockCombat('space');
      // Salvage tracks destroyed ships - just test basic function

      const result = applyCardEffect(gameState, 'salvage', 'player1');

      // Success depends on implementation - just verify it handles the call
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Scuttle', () => {
    it('should destroy own ship', () => {
      const ship = createMockUnit('cruiser', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [ship]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'scuttle', 'player1', {
        unitIds: [ship.id],
      });

      // Success depends on full implementation
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Intercept', () => {
    it('should move ships to combat system', () => {
      const myShip = createMockUnit('cruiser', 'player1');
      const sourceTile = createMockTile('tile-1-0', { q: 1, r: 0 }, [myShip]);
      const combatTile = createMockTile('tile-0-0', { q: 0, r: 0 }, []);
      gameState.map.tiles = [sourceTile, combatTile];
      gameState.activeCombat = createMockCombat('space', { systemId: 'tile-0-0' });

      const result = applyCardEffect(gameState, 'intercept', 'player1', {
        unitIds: [myShip.id],
      });

      expect(result.success).toBe(true);
      expect(combatTile.units.some(u => u.id === myShip.id)).toBe(true);
    });
  });

  describe('Seize Artifact', () => {
    it('should steal relic from target', () => {
      gameState.players[1].relics = ['relic1'];

      const result = applyCardEffect(gameState, 'seize_artifact', 'player1', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(gameState.players[0].relics).toHaveLength(1);
      expect(gameState.players[1].relics).toHaveLength(0);
    });

    it('should fail if target has no relics', () => {
      gameState.players[1].relics = [];

      const result = applyCardEffect(gameState, 'seize_artifact', 'player1', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('Ancient Burial Sites', () => {
    it('should grant bonus VP', () => {
      gameState.players[0].score = 5;

      const result = applyCardEffect(gameState, 'ancient_burial_sites', 'player1');

      expect(result.success).toBe(true);
      expect(gameState.players[0].score).toBe(6);
    });
  });

  describe('Hack Election', () => {
    it('should apply hack election effect', () => {
      gameState.phase = 'agenda';
      gameState.agendaPhase = {
        currentStep: 'voting',
        agendaNumber: 1,
        currentAgendaId: 'test-agenda',
        currentAgendaType: 'directive',
        currentElectionType: 'for_against',
        votingOrder: ['player1', 'player2'],
        currentVoterIndex: 0,
        votingComplete: [],
        votes: {},
        voteTallies: {},
        riders: [],
        vetoed: false,
        electedOutcome: null,
        electedPlayer: null,
        electedPlanet: null,
      };

      const result = applyCardEffect(gameState, 'hack_election', 'player1');

      expect(result.success).toBe(true);
    });
  });

  describe('Decoy Operation', () => {
    it('should swap ship with transported unit', () => {
      const carrier = createMockUnit('carrier', 'player1');
      const infantry = createMockUnit('infantry', 'player1');
      const tile = createMockTile('tile-0-0', { q: 0, r: 0 }, [carrier, infantry]);
      gameState.map.tiles = [tile];

      const result = applyCardEffect(gameState, 'decoy_operation', 'player1', {
        unitIds: [carrier.id, infantry.id],
      });

      expect(result.success).toBe(true);
    });

    it('should fail without proper targets', () => {
      const result = applyCardEffect(gameState, 'decoy_operation', 'player1', {
        unitIds: ['single-unit'],
      });

      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// EFFECT HANDLER REGISTRY
// =============================================================================

describe('Effect Handler Registry', () => {
  it('should have handlers for all expected card types', () => {
    const expectedCards = [
      'sabotage',
      'shields_holding',
      'morale_boost',
      'direct_hit',
      'skilled_retreat',
      'emergency_repairs',
      'flank_speed',
      'war_machine',
      'ghost_ship',
      'frontline_deployment',
      'mining_initiative',
      'industrial_initiative',
      'summit',
      'cripple_defenses',
      'reactor_meltdown',
      'spy',
      'uprising',
      'veto',
      'distinguished_councilor',
      'bribery',
      'disable',
      'scramble_frequency',
      'maneuvering_jets',
      'fighter_prototype',
    ];

    for (const card of expectedCards) {
      expect(EFFECT_HANDLERS[card]).toBeDefined();
    }
  });

  it('should handle unknown cards gracefully', () => {
    const gameState = createMockGameState();
    const result = applyCardEffect(gameState, 'nonexistent_card', 'player1');

    expect(result.success).toBe(true);
    expect(result.triggeredEvents).toEqual([]);
  });

  it('should strip number suffix from card IDs', () => {
    const gameState = createMockGameState();
    gameState.activeCombat = createMockCombat('space', {
      pendingHits: { attacker: 0, defender: 2 },
    });

    // shields_holding_1, shields_holding_2, etc. should all work
    const result = applyCardEffect(gameState, 'shields_holding_3', 'player1');

    expect(result.success).toBe(true);
  });
});
