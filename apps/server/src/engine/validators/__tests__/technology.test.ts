/**
 * Tests for technology validators
 *
 * TI4 Technology Rules:
 * - Technologies have 4 colors: Green (biotic), Blue (propulsion), Yellow (cybernetic), Red (warfare)
 * - Technologies can have prerequisites (colored tech symbols)
 * - Planets with tech specialties can skip 1 prerequisite (by exhausting the planet)
 * - Jol-Nar can skip 1 additional prerequisite (faction ability)
 * - Nekro Virus cannot research technology (must steal via combat)
 * - Faction technologies can only be researched by that faction
 * - Unit upgrade technologies replace base unit stats
 *
 * Sources:
 * - https://twilight-imperium.fandom.com/wiki/Technology
 * - https://www.tirules.com/R_technology
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GameState, PlayerState, MapTile, PlanetInstance } from '@ti4/shared';
import { validateResearchTechnology, canPlayerResearchTechnology } from '../technology.js';

// Mock the game-data module
vi.mock('@ti4/game-data', () => ({
  technologies: {
    neural_motivator: {
      id: 'neural_motivator',
      name: 'Neural Motivator',
      type: 'green',
      prerequisites: [],
    },
    hyper_metabolism: {
      id: 'hyper_metabolism',
      name: 'Hyper Metabolism',
      type: 'green',
      prerequisites: ['green', 'green'],
    },
    dacxive_animators: {
      id: 'dacxive_animators',
      name: 'Dacxive Animators',
      type: 'green',
      prerequisites: ['green'],
    },
    antimass_deflectors: {
      id: 'antimass_deflectors',
      name: 'Antimass Deflectors',
      type: 'blue',
      prerequisites: [],
    },
    gravity_drive: {
      id: 'gravity_drive',
      name: 'Gravity Drive',
      type: 'blue',
      prerequisites: ['blue'],
    },
    fleet_logistics: {
      id: 'fleet_logistics',
      name: 'Fleet Logistics',
      type: 'blue',
      prerequisites: ['blue', 'blue'],
    },
    sarween_tools: {
      id: 'sarween_tools',
      name: 'Sarween Tools',
      type: 'yellow',
      prerequisites: [],
    },
    plasma_scoring: {
      id: 'plasma_scoring',
      name: 'Plasma Scoring',
      type: 'red',
      prerequisites: [],
    },
    spec_ops_ii: {
      id: 'spec_ops_ii',
      name: 'Spec Ops II',
      type: 'green',
      factionId: 'sol',
      prerequisites: ['green', 'green'],
    },
    l4_disruptors: {
      id: 'l4_disruptors',
      name: 'L4 Disruptors',
      type: 'yellow',
      factionId: 'letnev',
      prerequisites: [],
    },
    carrier_ii: {
      id: 'carrier_ii',
      name: 'Carrier II',
      type: 'blue',
      unitUpgrade: 'carrier',
      prerequisites: ['blue', 'blue'],
    },
  },
  systems: {
    25: {
      id: 25,
      planets: [
        { id: 'wellon', resources: 1, influence: 2, techSpecialty: 'yellow' },
      ],
    },
    26: {
      id: 26,
      planets: [
        { id: 'new_albion', resources: 1, influence: 1, techSpecialty: 'green' },
      ],
    },
    27: {
      id: 27,
      planets: [{ id: 'starpoint', resources: 3, influence: 1, techSpecialty: 'blue' }],
    },
    28: {
      id: 28,
      planets: [{ id: 'regular_planet', resources: 2, influence: 2 }], // No tech specialty
    },
  },
  meetsPrerequisites: vi.fn(
    (playerTechs: string[], techId: string, ignored: number = 0): boolean => {
      const techData: Record<string, string[]> = {
        neural_motivator: [],
        hyper_metabolism: ['green', 'green'],
        dacxive_animators: ['green'],
        antimass_deflectors: [],
        gravity_drive: ['blue'],
        fleet_logistics: ['blue', 'blue'],
        sarween_tools: [],
        plasma_scoring: [],
        spec_ops_ii: ['green', 'green'],
        l4_disruptors: [],
        carrier_ii: ['blue', 'blue'],
      };

      const prereqs = techData[techId] || [];
      const greenCount = prereqs.filter(p => p === 'green').length;
      const blueCount = prereqs.filter(p => p === 'blue').length;
      const yellowCount = prereqs.filter(p => p === 'yellow').length;
      const redCount = prereqs.filter(p => p === 'red').length;

      const playerGreen = playerTechs.filter(t =>
        ['neural_motivator', 'dacxive_animators', 'hyper_metabolism'].includes(t)
      ).length;
      const playerBlue = playerTechs.filter(t =>
        ['antimass_deflectors', 'gravity_drive', 'fleet_logistics'].includes(t)
      ).length;
      const playerYellow = playerTechs.filter(t => ['sarween_tools'].includes(t)).length;
      const playerRed = playerTechs.filter(t => ['plasma_scoring'].includes(t)).length;

      const totalNeeded =
        Math.max(0, greenCount - playerGreen) +
        Math.max(0, blueCount - playerBlue) +
        Math.max(0, yellowCount - playerYellow) +
        Math.max(0, redCount - playerRed);

      return totalNeeded <= ignored;
    }
  ),
}));

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Test Player',
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 2,
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
    relicFragments: { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 },
    relics: [],
    exhaustedRelics: [],
    exhaustedTechnologies: [],
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    ...overrides,
  };
}

function createMockPlanet(overrides: Partial<PlanetInstance> = {}): PlanetInstance {
  const planetId = overrides.planetId || 'planet1';
  return {
    id: planetId,
    planetId,
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
    wormhole: null,
    anomaly: null,
    units: [],
    planets: [],
    commandTokens: [],
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createMockPlayer({ id: 'player1', seatIndex: 0 });
  const player2 = createMockPlayer({ id: 'player2', seatIndex: 1 });

  const tile = createMockTile({
    planets: [createMockPlanet({ planetId: 'wellon', controlledBy: 'player1' })],
  });

  return {
    id: 'game1',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'strategic_primary',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: ['player1', 'player2'],
    players: [player1, player2],
    map: { tiles: [tile], playerCount: 6 },
    strategyCards: [],
    objectives: { publicStageI: [], publicStageII: [], revealedCount: 0, secretDeck: [] },
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
    agendaPhase: undefined,
    gameLog: [],
    ...overrides,
  };
}

describe('validateResearchTechnology', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic validation', () => {
    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action = {
        type: 'research_technology' as const,
        playerId: 'nonexistent',
        techId: 'neural_motivator',
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if not in action phase', () => {
      const state = createMockGameState({ phase: 'strategy' });
      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'neural_motivator',
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only research technology during action phase');
    });

    it('should fail if technology does not exist', () => {
      const state = createMockGameState();
      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'nonexistent_tech',
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown technology: nonexistent_tech');
    });

    it('should fail if player already has technology', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['neural_motivator'];
      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'neural_motivator',
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player already has this technology');
    });
  });

  describe('Nekro Virus restriction', () => {
    it('should fail if Nekro Virus tries to research', () => {
      const state = createMockGameState();
      state.players[0].faction = 'nekro';
      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'neural_motivator',
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Nekro Virus cannot research technologies');
    });
  });

  describe('faction technology restrictions', () => {
    it('should fail if researching another faction technology', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';
      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'l4_disruptors', // Letnev faction tech
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("Cannot research another faction's technology");
    });

    it('should allow researching own faction technology', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';
      state.players[0].technologies = ['neural_motivator', 'dacxive_animators']; // 2 green prereqs
      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'spec_ops_ii', // Sol faction tech
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('prerequisites', () => {
    it('should allow research of tech with no prerequisites', () => {
      const state = createMockGameState();
      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'neural_motivator',
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if prerequisites not met', () => {
      const state = createMockGameState();
      state.players[0].technologies = []; // No techs
      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'hyper_metabolism', // Requires 2 green
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Prerequisites not met');
    });

    it('should allow research if prerequisites met', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['neural_motivator', 'dacxive_animators']; // 2 green
      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'hyper_metabolism', // Requires 2 green
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('tech specialty planets', () => {
    it('should allow using tech specialty planet to skip prerequisite', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['neural_motivator']; // 1 green

      // Add a green tech specialty planet
      const greenTechTile = createMockTile({
        id: 'tile2',
        systemId: 26,
        position: { q: 1, r: 0 },
        planets: [
          createMockPlanet({
            planetId: 'new_albion',
            controlledBy: 'player1',
            exhausted: false,
          }),
        ],
      });
      state.map.tiles.push(greenTechTile);

      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'hyper_metabolism', // Requires 2 green, player has 1 + 1 skip from planet
        exhaustedPlanets: ['new_albion'],
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if planet does not have tech specialty', () => {
      const state = createMockGameState();
      // Give player enough techs to meet prereqs WITHOUT needing the skip
      state.players[0].technologies = ['neural_motivator', 'dacxive_animators'];

      // Add a regular planet without tech specialty
      const regularTile = createMockTile({
        id: 'tile2',
        systemId: 28,
        position: { q: 1, r: 0 },
        planets: [
          createMockPlanet({
            planetId: 'regular_planet',
            controlledBy: 'player1',
            exhausted: false,
          }),
        ],
      });
      state.map.tiles.push(regularTile);

      // Research a tech where prereqs are already met, but we're trying to use an invalid planet
      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'hyper_metabolism',
        exhaustedPlanets: ['regular_planet'],
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Planet regular_planet does not have a tech specialty');
    });

    it('should fail if tech specialty planet is already exhausted', () => {
      const state = createMockGameState();
      // Give player enough techs to meet prereqs
      state.players[0].technologies = ['neural_motivator', 'dacxive_animators'];

      const greenTechTile = createMockTile({
        id: 'tile2',
        systemId: 26,
        position: { q: 1, r: 0 },
        planets: [
          createMockPlanet({
            planetId: 'new_albion',
            controlledBy: 'player1',
            exhausted: true, // Already exhausted
          }),
        ],
      });
      state.map.tiles.push(greenTechTile);

      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'hyper_metabolism',
        exhaustedPlanets: ['new_albion'],
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Planet new_albion is already exhausted');
    });

    it('should fail if tech specialty planet not controlled by player', () => {
      const state = createMockGameState();
      // Give player enough techs to meet prereqs
      state.players[0].technologies = ['neural_motivator', 'dacxive_animators'];

      const greenTechTile = createMockTile({
        id: 'tile2',
        systemId: 26,
        position: { q: 1, r: 0 },
        planets: [
          createMockPlanet({
            planetId: 'new_albion',
            controlledBy: 'player2', // Controlled by other player
            exhausted: false,
          }),
        ],
      });
      state.map.tiles.push(greenTechTile);

      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'hyper_metabolism',
        exhaustedPlanets: ['new_albion'],
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Planet new_albion not controlled by player');
    });
  });

  describe('Jol-Nar faction bonus', () => {
    it('should allow Jol-Nar to skip one additional prerequisite', () => {
      const state = createMockGameState();
      state.players[0].faction = 'jolnar';
      state.players[0].technologies = ['antimass_deflectors']; // 1 blue

      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'fleet_logistics', // Requires 2 blue, player has 1 + 1 Jol-Nar skip
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('unit upgrade technologies', () => {
    it('should allow researching unit upgrade with prerequisites', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['antimass_deflectors', 'gravity_drive']; // 2 blue

      const action = {
        type: 'research_technology' as const,
        playerId: 'player1',
        techId: 'carrier_ii',
        timestamp: Date.now(),
      };

      const result = validateResearchTechnology(state, action);

      expect(result.valid).toBe(true);
    });
  });
});

describe('canPlayerResearchTechnology', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false if player not found', () => {
    const state = createMockGameState();

    const result = canPlayerResearchTechnology(state, 'nonexistent');

    expect(result.canResearch).toBe(false);
    expect(result.reason).toBe('Player not found');
  });

  it('should return false for Nekro Virus', () => {
    const state = createMockGameState();
    state.players[0].faction = 'nekro';

    const result = canPlayerResearchTechnology(state, 'player1');

    expect(result.canResearch).toBe(false);
    expect(result.reason).toBe('Nekro Virus cannot research technologies');
  });

  it('should return false if not in action phase', () => {
    const state = createMockGameState({ phase: 'strategy' });

    const result = canPlayerResearchTechnology(state, 'player1');

    expect(result.canResearch).toBe(false);
    expect(result.reason).toBe('Not in action phase');
  });

  it('should return true for valid player in action phase', () => {
    const state = createMockGameState();

    const result = canPlayerResearchTechnology(state, 'player1');

    expect(result.canResearch).toBe(true);
  });
});
