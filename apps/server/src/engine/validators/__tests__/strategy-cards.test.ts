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
    type: 'infantry',
    ownerId: 'player1',
    damaged: false,
    ...overrides,
  };
}

function createMockPlanet(overrides: Partial<PlanetInstance> = {}): PlanetInstance {
  return {
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
    units: [],
    planets: [createMockPlanet()],
    commandTokens: [],
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createMockPlayer({ id: 'player1' });
  const player2 = createMockPlayer({ id: 'player2' });

  const tile = createMockTile();

  return {
    id: 'game1',
    name: 'Test Game',
    phase: 'action',
    subPhase: 'strategic_primary',
    round: 1,
    turn: 0,
    players: [player1, player2],
    map: { tiles: [tile] },
    objectives: {
      stage1: [],
      stage2: [],
      revealed: [],
      secret: [],
      publicStageI: [],
      publicStageII: [],
      secretDeck: ['secret1', 'secret2'],
    },
    laws: [],
    activePlayerId: 'player1',
    speakerId: 'player1',
    activeCombat: null,
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
    strategicActionState: {
      cardNumber: 1,
      primaryPlayerId: 'player1',
      secondaryOrder: ['player2'],
      currentSecondaryIndex: 0,
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
      };

      const result = validateStrategicPrimary(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('Construction (4) primary', () => {
    it('should fail if second structure is not PDS', () => {
      const state = createMockGameState();
      state.strategicActionState!.cardNumber = 4;
      const action = {
        type: 'strategic_primary' as const,
        playerId: 'player1',
        cardNumber: 4,
        choices: {
          firstStructure: { type: 'pds', planetId: 'planet1' },
          secondStructure: { type: 'space_dock', planetId: 'planet1' }, // Must be PDS
        },
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
          firstStructure: { type: 'space_dock', planetId: 'planet1' },
        },
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
      };

      const result = validateStrategicSecondary(state, action);

      expect(result.valid).toBe(true);
    });
  });
});
