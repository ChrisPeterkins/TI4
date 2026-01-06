/**
 * Tests for strategy card validators
 *
 * TI4 Strategy Card Rules:
 * - During Strategy Phase, players choose strategy cards in speaker order
 * - During Action Phase, player can perform a strategic action (play their card)
 * - Primary ability is used by the active player, often more powerful
 * - Secondary ability can be used by other players, requires spending a strategy token
 * - Leadership secondary is free (no strategy token required)
 * - The 8 strategy cards are: Leadership, Diplomacy, Politics, Construction,
 *   Trade, Warfare, Technology, Imperial
 *
 * Sources:
 * - https://twilight-imperium.fandom.com/wiki/Strategy_Cards
 * - https://www.tirules.com/R_strategy_card
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  GameState,
  PlayerState,
  UnitInstance,
  MapTile,
  PlanetInstance,
} from '@ti4/shared';
import {
  validateStrategicPrimary,
  validateStrategicSecondary,
} from '../strategy-cards.js';

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

vi.mock('@ti4/game-data', () => ({
  technologies: {
    neural_motivator: { id: 'neural_motivator', name: 'Neural Motivator', type: 'green', prerequisites: [] },
    sarween_tools: { id: 'sarween_tools', name: 'Sarween Tools', type: 'yellow', prerequisites: [] },
    antimass_deflectors: { id: 'antimass_deflectors', name: 'Antimass Deflectors', type: 'blue', prerequisites: [] },
    plasma_scoring: { id: 'plasma_scoring', name: 'Plasma Scoring', type: 'red', prerequisites: [] },
    hyper_metabolism: { id: 'hyper_metabolism', name: 'Hyper Metabolism', type: 'green', prerequisites: ['green', 'green'] },
    sol_spec_ops_ii: { id: 'sol_spec_ops_ii', name: 'Spec Ops II', type: 'green', factionId: 'sol', prerequisites: ['green', 'green'] },
    letnev_munitions: { id: 'letnev_munitions', name: 'L4 Disruptors', type: 'yellow', factionId: 'letnev', prerequisites: [] },
  },
  systems: {
    25: { id: 25, planets: [{ id: 'planet1', resources: 2, influence: 3 }] },
    26: { id: 26, planets: [{ id: 'planet2', resources: 3, influence: 2 }] },
  },
  meetsPrerequisites: vi.fn((playerTechs: string[], techId: string) => {
    // Simplified prereq check
    if (techId === 'hyper_metabolism') {
      return playerTechs.filter(t => t === 'neural_motivator').length >= 2;
    }
    if (techId === 'sol_spec_ops_ii') {
      return playerTechs.filter(t => ['neural_motivator'].includes(t)).length >= 2;
    }
    return true;
  }),
  factions: {
    sol: { homeSystem: 1, name: 'Federation of Sol' },
    letnev: { homeSystem: 2, name: 'Barony of Letnev' },
  },
  units: {
    infantry: { cost: 0.5 },
    fighter: { cost: 0.5 },
    carrier: { cost: 3 },
    cruiser: { cost: 2 },
    dreadnought: { cost: 4 },
    destroyer: { cost: 1 },
    war_sun: { cost: 12 },
  },
}));

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
    score: 0,
    secretObjectives: [],
    actionCards: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    scoredObjectives: [],
    passed: false,
    strategyCard: null,
    strategyCardUsed: false,
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
    id: 'planet-instance-1',
    planetId: 'planet1',
    controlledBy: 'player1',
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
    commandTokens: [],
    wormhole: null,
    anomaly: null,
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createMockPlayer({ id: 'player1' });
  const player2 = createMockPlayer({ id: 'player2' });

  const tile = createMockTile();

  return {
    id: 'game1',
    version: 1,
    phase: 'action',
    subPhase: 'strategic_primary',
    round: 1,
    players: [player1, player2],
    map: { tiles: [tile], playerCount: 6 },
    objectives: {
      publicStageI: [],
      publicStageII: [],
      revealedCount: 0,
      secretDeck: ['secret1', 'secret2'],
    },
    laws: [],
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: ['player1', 'player2'],
    strategyCards: [],
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
    activeCombat: null,
    custodiansTaken: false,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    gameLog: [],
    agendaPhase: undefined,
    strategicActionState: {
      cardNumber: 1,
      secondaryOrder: ['player2'],
      currentSecondaryIndex: 0,
      primaryResolved: false,
      secondaryResponses: {},
    },
    ...overrides,
  };
}

describe('validateStrategicPrimary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic validation', () => {
    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'nonexistent',
        cardNumber: 1,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if not in strategic primary phase', () => {
      const state = createMockGameState({ subPhase: 'tactical_movement' });
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 1,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in strategic primary phase');
    });

    it('should fail if not the active player', () => {
      const state = createMockGameState();
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player2',
        cardNumber: 1,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn');
    });

    it('should fail if strategy card mismatch', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 1;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 2, // Mismatch
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Strategy card mismatch');
    });

    it('should fail for unknown strategy card', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 99;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 99,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown strategy card');
    });
  });

  describe('Leadership (1) primary', () => {
    it('should validate Leadership primary with valid token distribution', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 1;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 1,
        choices: {
          influenceSpent: 0,
          tokenDistribution: { tactics: 1, fleet: 1, strategy: 1 }, // 3 tokens
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if token distribution does not equal base + bonus tokens', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 1;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 1,
        choices: {
          influenceSpent: 0,
          tokenDistribution: { tactics: 1, fleet: 1, strategy: 0 }, // Only 2, need 3
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must distribute exactly 3 tokens');
    });

    it('should fail if negative token distribution', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 1;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 1,
        choices: {
          influenceSpent: 0,
          tokenDistribution: { tactics: -1, fleet: 2, strategy: 2 },
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token distribution cannot be negative');
    });
  });

  describe('Diplomacy (2) primary', () => {
    it('should fail if no target system specified', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 2;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 2,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must choose a target system');
    });

    it('should fail if target system not found', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 2;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 2,
        choices: { targetSystemPosition: { q: 99, r: 99 } },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Target system not found');
    });

    it('should fail if target is Mecatol Rex (system 18)', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 2;
      const mecatol = createMockTile({ systemId: 18, position: { q: 1, r: 1 } });
      state.map.tiles.push(mecatol);

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 2,
        choices: { targetSystemPosition: { q: 1, r: 1 } },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot choose Mecatol Rex');
    });

    it('should fail if player does not control a planet in system', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 2;
      // Set planet as controlled by player2
      state.map.tiles[0].planets[0].controlledBy = 'player2';

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 2,
        choices: { targetSystemPosition: { q: 0, r: 0 } },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must control a planet in the chosen system');
    });

    it('should fail if trying to ready more than 2 planets', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 2;

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 2,
        choices: {
          targetSystemPosition: { q: 0, r: 0 },
          planetsToReady: ['p1', 'p2', 'p3'], // 3 planets, max is 2
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only ready up to 2 planets');
    });

    it('should allow valid Diplomacy primary', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 2;

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 2,
        choices: {
          targetSystemPosition: { q: 0, r: 0 },
          planetsToReady: ['p1', 'p2'],
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('Politics (3) primary', () => {
    it('should fail if no new speaker chosen', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 3;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 3,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must choose a new speaker');
    });

    it('should fail if choosing current speaker', () => {
      const state = createMockGameState({ speakerId: 'player1' });
      state.strategicActionState!.cardNumber = 3;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 3,
        choices: { newSpeakerId: 'player1' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must choose a different player as speaker');
    });

    it('should fail if new speaker not found', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 3;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 3,
        choices: { newSpeakerId: 'nonexistent' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('New speaker not found');
    });

    it('should allow valid Politics primary', () => {
      const state = createMockGameState({ speakerId: 'player1' });
      state.strategicActionState!.cardNumber = 3;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 3,
        choices: { newSpeakerId: 'player2' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('Construction (4) primary', () => {
    it('should fail if second structure is not PDS', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 4;
      // Test that validator rejects space_dock as second structure
      // We need to cast to any to bypass TypeScript's static type checking
      // since the type system correctly prevents this invalid combination
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 4,
        choices: {
          firstStructure: { type: 'pds' as const, planetId: 'planet1' },
          secondStructure: { type: 'space_dock' as 'pds', planetId: 'planet1' }, // Must be PDS - intentionally wrong for test
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Second structure must be a PDS');
    });

    it('should allow valid Construction primary', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 4;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 4,
        choices: {
          firstStructure: { type: 'space_dock' as const, planetId: 'planet1' },
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('Trade (5) primary', () => {
    it('should fail if granting free secondary to self', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 5;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 5,
        choices: { freeSecondaryPlayers: ['player1'] },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot grant free secondary to yourself');
    });

    it('should fail if granting free secondary to invalid player', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 5;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 5,
        choices: { freeSecondaryPlayers: ['nonexistent'] },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid player for free secondary');
    });

    it('should allow valid Trade primary', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 5;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 5,
        choices: { freeSecondaryPlayers: ['player2'] },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('Technology (7) primary', () => {
    it('should fail if researching same tech twice', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 7;
      // Give player enough resources
      state.map.tiles[0].planets[0].exhausted = false;

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 7,
        choices: {
          firstTechId: 'neural_motivator',
          secondTechId: 'neural_motivator', // Same tech
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot research the same technology twice');
    });

    it('should allow researching first tech for free', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 7;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 7,
        choices: { firstTechId: 'neural_motivator' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if already have the technology', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 7;
      state.players[0].technologies = ['neural_motivator'];

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 7,
        choices: { firstTechId: 'neural_motivator' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Already have this technology');
    });

    it('should fail if researching another faction technology', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 7;
      // Player is Sol, trying to research Letnev faction tech
      state.players[0].faction = 'sol';

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 7,
        choices: { firstTechId: 'letnev_munitions' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Cannot research another faction's technology");
    });

    it('should fail if unknown technology', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 7;

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 7,
        choices: { firstTechId: 'nonexistent_tech' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown technology');
    });

    it('should fail if not enough resources for second tech', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 7;
      // Exhaust all planets and set trade goods to 0 so player has < 6 resources
      state.map.tiles[0].planets[0].exhausted = true;
      state.players[0].tradeGoods = 0;

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 7,
        choices: {
          firstTechId: 'neural_motivator',
          secondTechId: 'sarween_tools',
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not enough resources for second technology (need 6)');
    });
  });

  describe('Warfare (6) primary', () => {
    it('should fail if removing token from system without own token', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 6;
      // No command token in system
      state.map.tiles[0].commandTokens = [];

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 6,
        choices: { removedTokenSystem: { q: 0, r: 0 } },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No command token in that system');
    });

    it('should fail if removing token from nonexistent system', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 6;

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 6,
        choices: { removedTokenSystem: { q: 99, r: 99 } },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('System not found');
    });

    it('should fail if negative token redistribution', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 6;
      state.players[0].commandTokens = { tactics: 3, fleet: 3, strategy: 2 };

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 6,
        choices: {
          newTokenDistribution: { tactics: -1, fleet: 5, strategy: 5 },
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token distribution cannot be negative');
    });

    it('should fail if token redistribution does not equal current + 1', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 6;
      state.players[0].commandTokens = { tactics: 3, fleet: 3, strategy: 2 }; // Total 8

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 6,
        choices: {
          newTokenDistribution: { tactics: 3, fleet: 3, strategy: 2 }, // Total 8, should be 9
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must distribute exactly 9 tokens');
    });

    it('should allow valid Warfare primary', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 6;
      state.players[0].commandTokens = { tactics: 3, fleet: 3, strategy: 2 }; // Total 8

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 6,
        choices: {
          newTokenDistribution: { tactics: 3, fleet: 4, strategy: 2 }, // Total 9 (current + 1)
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow removing command token from own system', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 6;
      state.map.tiles[0].commandTokens = ['player1'];
      state.players[0].commandTokens = { tactics: 3, fleet: 3, strategy: 2 };

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 6,
        choices: {
          removedTokenSystem: { q: 0, r: 0 },
          newTokenDistribution: { tactics: 3, fleet: 4, strategy: 2 },
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('Imperial (8) primary', () => {
    it('should fail if objective not found', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 8;

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 8,
        choices: { scoredObjectiveId: 'nonexistent' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Objective not found or not revealed');
    });

    it('should fail if already scored the objective', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 8;
      state.objectives.publicStageI = [
        { id: 'obj1', revealed: true, scoredBy: ['player1'] } as any,
      ];

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 8,
        choices: { scoredObjectiveId: 'obj1' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Already scored this objective');
    });

    it('should allow scoring valid public objective Stage I', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 8;
      state.objectives.publicStageI = [
        { id: 'obj1', revealed: true, scoredBy: [] } as any,
      ];

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 8,
        choices: { scoredObjectiveId: 'obj1' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow scoring valid public objective Stage II', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 8;
      state.objectives.publicStageII = [
        { id: 'obj2', revealed: true, scoredBy: [] } as any,
      ];

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 8,
        choices: { scoredObjectiveId: 'obj2' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if objective is not revealed', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 8;
      state.objectives.publicStageI = [
        { id: 'obj1', revealed: false, scoredBy: [] } as any,
      ];

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 8,
        choices: { scoredObjectiveId: 'obj1' },
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Objective not found or not revealed');
    });

    it('should allow Imperial primary with no objective score', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 8;

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 8,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });
  });
});

describe('validateStrategicSecondary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic validation', () => {
    it('should fail if player not found', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'nonexistent',
        cardNumber: 1,
        declined: false,
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if not in strategic secondary phase', () => {
      const state = createMockGameState({ subPhase: 'strategic_primary' });
      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 1,
        declined: false,
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in strategic secondary phase');
    });

    it('should fail if not this player turn for secondary', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.secondaryOrder = ['player2'];
      state.strategicActionState!.currentSecondaryIndex = 0;
      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player1', // Not player2's turn
        cardNumber: 1,
        declined: false,
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn to resolve secondary');
    });

    it('should allow declining secondary', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 1,
        declined: true,
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('strategy token requirement', () => {
    it('should fail if no strategy tokens and secondary requires token', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      // Card 2 (Diplomacy) requires strategy token
      state.strategicActionState!.cardNumber = 2;
      // Set player2 to have 0 strategy tokens
      state.players[1].commandTokens.strategy = 0;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 2,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No strategy tokens available');
    });

    it('should allow Leadership secondary without strategy token', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 1;
      // Set player2 to have 0 strategy tokens
      state.players[1].commandTokens.strategy = 0;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 1,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow free secondary for Trade card recipients', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 5; // Trade
      state.strategicActionState!.freeSecondaryPlayers = ['player2'];
      state.players[1].commandTokens.strategy = 0;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 5,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('Diplomacy (2) secondary', () => {
    it('should fail if trying to ready more than 2 planets', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 2;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 2,
        declined: false,
        choices: { readiedPlanets: ['p1', 'p2', 'p3'] },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only ready up to 2 planets');
    });
  });

  describe('Technology (7) secondary', () => {
    it('should fail if no tech specified', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 7;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 7,
        declined: false,
        choices: {}, // No techId
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must choose a technology to research');
    });
  });

  describe('Imperial (8) secondary', () => {
    it('should fail if already at maximum secret objectives (3)', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 8;
      state.players[1].secretObjectives = ['s1', 's2', 's3'];

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 8,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Already at maximum secret objectives (3)');
    });

    it('should fail if no secret objectives in deck', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 8;
      (state.objectives as any).secretDeck = [];

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 8,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No secret objectives remaining in deck');
    });

    it('should allow drawing secret objective when below limit', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 8;
      state.players[1].secretObjectives = ['s1'];
      (state.objectives as any).secretDeck = ['s2', 's3'];

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 8,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('Leadership (1) secondary', () => {
    it('should fail if not enough influence for tokens', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 1;
      // Exhaust all planets
      state.map.tiles[0].planets[0].exhausted = true;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 1,
        declined: false,
        choices: {
          influenceSpent: 10, // More than available
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not enough influence available');
    });

    it('should fail if token distribution does not match influence spent', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 1;
      // Give player2 a planet with lots of influence (3 influence according to mock)
      // Adding multiple planets to have more than 3 influence available
      const player2Tile1 = createMockTile({
        position: { q: 1, r: 1 },
        systemId: 26,
        planets: [createMockPlanet({
          planetId: 'planet2',
          controlledBy: 'player2',
          exhausted: false,
        })],
      });
      const player2Tile2 = createMockTile({
        position: { q: 2, r: 1 },
        systemId: 25,
        planets: [createMockPlanet({
          planetId: 'planet1',
          controlledBy: 'player2',
          exhausted: false,
        })],
      });
      state.map.tiles.push(player2Tile1, player2Tile2);

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 1,
        declined: false,
        choices: {
          influenceSpent: 3, // Should give 1 token
          commandTokenDistribution: { tactics: 2, fleet: 0, strategy: 0 }, // Distributing 2, should be 1
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must distribute exactly 1 tokens');
    });

    it('should allow valid Leadership secondary with 0 influence spent', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 1;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 1,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('Construction (4) secondary', () => {
    it('should fail if no system specified for structure placement', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 4;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 4,
        declined: false,
        choices: {
          structureBuilt: { type: 'pds' as const, planetId: 'planet1' },
          // Missing systemPosition
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify a system for structure placement');
    });

    it('should fail if system not found', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 4;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 4,
        declined: false,
        choices: {
          structureBuilt: { type: 'pds' as const, planetId: 'planet1' },
          systemPosition: { q: 99, r: 99 },
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('System not found');
    });

    it('should fail if planet not controlled by player', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 4;
      // Planet controlled by player1, not player2
      state.map.tiles[0].planets[0].controlledBy = 'player1';

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 4,
        declined: false,
        choices: {
          structureBuilt: { type: 'pds' as const, planetId: 'planet1' },
          systemPosition: { q: 0, r: 0 },
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You do not control this planet');
    });

    it('should allow valid Construction secondary', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 4;
      state.map.tiles[0].planets[0].controlledBy = 'player2';

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 4,
        declined: false,
        choices: {
          structureBuilt: { type: 'pds' as const, planetId: 'planet1' },
          systemPosition: { q: 0, r: 0 },
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow Construction secondary without building', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 4;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 4,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if PDS limit reached (6)', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 4;
      state.map.tiles[0].planets[0].controlledBy = 'player2';
      // Add 6 PDS units for player2
      const pdsUnits = Array.from({ length: 6 }, (_, i) => createMockUnit({
        id: `pds-${i}`,
        type: 'pds',
        ownerId: 'player2',
      }));
      state.map.tiles[0].planets[0].units = pdsUnits;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 4,
        declined: false,
        choices: {
          structureBuilt: { type: 'pds' as const, planetId: 'planet1' },
          systemPosition: { q: 0, r: 0 },
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Maximum PDS limit reached (6)');
    });

    it('should fail if Space Dock limit reached (3)', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 4;
      state.map.tiles[0].planets[0].controlledBy = 'player2';
      // Add 3 space docks for player2 across different planets
      const spaceDocks = Array.from({ length: 3 }, (_, i) => createMockUnit({
        id: `sd-${i}`,
        type: 'space_dock',
        ownerId: 'player2',
      }));
      state.map.tiles[0].planets[0].units = spaceDocks;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 4,
        declined: false,
        choices: {
          structureBuilt: { type: 'space_dock' as const, planetId: 'planet1' },
          systemPosition: { q: 0, r: 0 },
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Maximum Space Dock limit reached (3)');
    });

    it('should fail if planet already has a Space Dock', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 4;
      state.map.tiles[0].planets[0].controlledBy = 'player2';
      state.map.tiles[0].planets[0].units = [createMockUnit({
        id: 'sd-1',
        type: 'space_dock',
        ownerId: 'player2',
      })];

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 4,
        declined: false,
        choices: {
          structureBuilt: { type: 'space_dock' as const, planetId: 'planet1' },
          systemPosition: { q: 0, r: 0 },
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Planet already has a Space Dock');
    });
  });

  describe('Warfare (6) secondary', () => {
    // Note: validateWarfareSecondary uses require('@ti4/game-data') for faction lookup
    // which doesn't work well with vitest mocks, so we test the error path
    it('should fail if home system not found', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 6;
      // Remove all tiles so no home system exists
      state.map.tiles = [];

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 6,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      // When home system isn't found, the validator returns 'Home system not found'
      expect(result.error).toBe('Home system not found');
    });
  });

  describe('Technology (7) secondary', () => {
    it('should fail if not enough resources for tech (need 4)', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 7;
      state.players[1].tradeGoods = 0;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 7,
        declined: false,
        choices: {
          techId: 'neural_motivator',
          exhaustedPlanets: [],
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not enough resources (need 4)');
    });

    it('should allow valid Technology secondary with enough resources', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 7;
      state.players[1].tradeGoods = 5;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 7,
        declined: false,
        choices: {
          techId: 'neural_motivator',
          exhaustedPlanets: [],
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if player already has the technology', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 7;
      state.players[1].tradeGoods = 5;
      state.players[1].technologies = ['neural_motivator'];

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 7,
        declined: false,
        choices: {
          techId: 'neural_motivator',
          exhaustedPlanets: [],
        },
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Already have this technology');
    });
  });

  describe('Politics (3) secondary', () => {
    it('should always be valid (just draws cards)', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 3;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 3,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('Trade (5) secondary', () => {
    it('should always be valid (just refreshes commodities)', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 5;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 5,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('unknown strategy card', () => {
    it('should fail for unknown primary strategy card', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState!.cardNumber = 99;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 99,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown strategy card');
    });
  });

  describe('edge cases', () => {
    it('should fail if strategic action state is null', () => {
      const state = createMockGameState({ subPhase: 'strategic_secondary' });
      state.strategicActionState = null as any;

      const action = {
        type: 'strategic_secondary' as const,
        playerId: 'player2',
        cardNumber: 1,
        declined: false,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Strategy card mismatch');
    });

    it('should fail primary if strategic action state is null', () => {
      const state = createMockGameState();
      state.strategicActionState = null as any;

      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 1,
        choices: {},
        timestamp: Date.now(),
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Strategy card mismatch');
    });
  });
});
