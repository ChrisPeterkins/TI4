import { describe, it, expect } from 'vitest';
import {
  validateExplore,
  validateExploreFrontier,
  validatePurgeRelicFragments,
} from '../exploration.js';
import type {
  GameState,
  MapTile,
  PlayerState,
  MapState,
  PlanetInstance,
  ExploreAction,
  PurgeRelicFragmentsAction,
  UnitInstance,
  ExplorationDecks,
} from '@ti4/shared';

function createMockUnit(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: 'unit-1',
    type: 'fighter',
    ownerId: 'player1',
    damaged: false,
    ...overrides,
  };
}

function createMockPlanet(overrides: Partial<PlanetInstance> = {}): PlanetInstance {
  return {
    id: 'planet-instance-1',
    planetId: 'planet1',
    controlledBy: null,
    exhausted: false,
    attachments: [],
    units: [],
    ...overrides,
  };
}

function createMockTile(overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: 'tile-1',
    systemId: 19, // A blue tile system
    position: { q: 0, r: 0 },
    rotation: 0,
    planets: [],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
    ...overrides,
  };
}

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Player 1',
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

function createMockExplorationDecks(
  overrides: Partial<ExplorationDecks> = {}
): ExplorationDecks {
  return {
    cultural: ['cultural_card_1', 'cultural_card_2'],
    industrial: ['industrial_card_1', 'industrial_card_2'],
    hazardous: ['hazardous_card_1', 'hazardous_card_2'],
    frontier: ['frontier_card_1', 'frontier_card_2'],
    ...overrides,
  };
}

function createMockGameState(
  players: PlayerState[] = [],
  tiles: MapTile[] = [],
  overrides: Partial<GameState> = {}
): GameState {
  return {
    id: 'game1',
    version: 1,
    round: 1,
    phase: 'action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: [],
    players: players.length > 0 ? players : [createMockPlayer()],
    map: {
      tiles: tiles.length > 0 ? tiles : [createMockTile()],
      playerCount: 6,
    } as MapState,
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
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    gameLog: [],
    explorationDecks: createMockExplorationDecks(),
    relicDeck: ['relic_1', 'relic_2'],
    ...overrides,
  };
}

describe('Exploration Validators', () => {
  describe('validateExplore', () => {
    it('should reject if player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const action: ExploreAction = {
        type: 'explore',
        playerId: 'nonexistent',
        planetId: 'planet1',
        timestamp: Date.now(),
      };

      const result = validateExplore(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should reject if not in action phase', () => {
      const player = createMockPlayer({ id: 'player1' });
      const state = createMockGameState([player], [], { phase: 'strategy' });

      const action: ExploreAction = {
        type: 'explore',
        playerId: 'player1',
        planetId: 'planet1',
        timestamp: Date.now(),
      };

      const result = validateExplore(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only explore during action phase');
    });

    it('should reject if planet not found on map', () => {
      const player = createMockPlayer({ id: 'player1' });
      const tile = createMockTile({ planets: [] });
      const state = createMockGameState([player], [tile]);

      const action: ExploreAction = {
        type: 'explore',
        playerId: 'player1',
        planetId: 'nonexistent_planet',
        timestamp: Date.now(),
      };

      const result = validateExplore(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Planet not found on map');
    });

    it('should reject if player does not control the planet', () => {
      const player = createMockPlayer({ id: 'player1' });
      const planet = createMockPlanet({
        planetId: 'planet1',
        controlledBy: 'player2', // Different player
      });
      const tile = createMockTile({ planets: [planet] });
      const state = createMockGameState([player], [tile]);

      const action: ExploreAction = {
        type: 'explore',
        playerId: 'player1',
        planetId: 'planet1',
        timestamp: Date.now(),
      };

      const result = validateExplore(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You do not control this planet');
    });

    it('should reject if planet already explored this turn', () => {
      const player = createMockPlayer({ id: 'player1' });
      const planet = createMockPlanet({
        planetId: 'planet1',
        controlledBy: 'player1',
      });
      const tile = createMockTile({ planets: [planet] });
      const state = createMockGameState([player], [tile], {
        planetsExploredThisTurn: ['planet1'],
      });

      const action: ExploreAction = {
        type: 'explore',
        playerId: 'player1',
        planetId: 'planet1',
        timestamp: Date.now(),
      };

      const result = validateExplore(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('This planet has already been explored this turn');
    });
  });

  describe('validateExploreFrontier', () => {
    it('should reject if player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const action = {
        type: 'explore' as const,
        playerId: 'nonexistent',
        planetId: '',
        systemPosition: { q: 0, r: 0 },
        timestamp: Date.now(),
      };

      const result = validateExploreFrontier(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should reject if not in action phase', () => {
      const player = createMockPlayer({
        id: 'player1',
        technologies: ['dark_energy_tap'],
      });
      const state = createMockGameState([player], [], { phase: 'strategy' });

      const action = {
        type: 'explore' as const,
        playerId: 'player1',
        planetId: '',
        systemPosition: { q: 0, r: 0 },
        timestamp: Date.now(),
      };

      const result = validateExploreFrontier(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only explore during action phase');
    });

    it('should reject if player does not have Dark Energy Tap', () => {
      const player = createMockPlayer({ id: 'player1', technologies: [] });
      const state = createMockGameState([player]);

      const action = {
        type: 'explore' as const,
        playerId: 'player1',
        planetId: '',
        systemPosition: { q: 0, r: 0 },
        timestamp: Date.now(),
      };

      const result = validateExploreFrontier(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Dark Energy Tap technology required to explore frontier');
    });

    it('should reject if system position not provided', () => {
      const player = createMockPlayer({
        id: 'player1',
        technologies: ['dark_energy_tap'],
      });
      const state = createMockGameState([player]);

      const action = {
        type: 'explore' as const,
        playerId: 'player1',
        planetId: '',
        timestamp: Date.now(),
      };

      const result = validateExploreFrontier(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('System position required for frontier exploration');
    });

    it('should reject if system not found', () => {
      const player = createMockPlayer({
        id: 'player1',
        technologies: ['dark_energy_tap'],
      });
      const tile = createMockTile({ position: { q: 0, r: 0 } });
      const state = createMockGameState([player], [tile]);

      const action = {
        type: 'explore' as const,
        playerId: 'player1',
        planetId: '',
        systemPosition: { q: 5, r: 5 }, // Non-existent
        timestamp: Date.now(),
      };

      const result = validateExploreFrontier(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('System not found');
    });

    it('should reject if system has no frontier token', () => {
      const player = createMockPlayer({
        id: 'player1',
        technologies: ['dark_energy_tap'],
      });
      const tile = createMockTile({
        position: { q: 0, r: 0 },
        frontier: undefined, // No frontier token
      });
      const state = createMockGameState([player], [tile]);

      const action = {
        type: 'explore' as const,
        playerId: 'player1',
        planetId: '',
        systemPosition: { q: 0, r: 0 },
        timestamp: Date.now(),
      };

      const result = validateExploreFrontier(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('This system does not have a frontier token');
    });

    it('should reject if player has no ships in system', () => {
      const player = createMockPlayer({
        id: 'player1',
        technologies: ['dark_energy_tap'],
      });
      const tile = createMockTile({
        position: { q: 0, r: 0 },
        frontier: true,
        units: [], // No ships
      });
      const state = createMockGameState([player], [tile]);

      const action = {
        type: 'explore' as const,
        playerId: 'player1',
        planetId: '',
        systemPosition: { q: 0, r: 0 },
        timestamp: Date.now(),
      };

      const result = validateExploreFrontier(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You must have ships in the system to explore frontier');
    });

    it('should reject if frontier deck is empty', () => {
      const player = createMockPlayer({
        id: 'player1',
        technologies: ['dark_energy_tap'],
      });
      const tile = createMockTile({
        position: { q: 0, r: 0 },
        frontier: true,
        units: [createMockUnit({ type: 'cruiser', ownerId: 'player1' })],
      });
      const state = createMockGameState([player], [tile], {
        explorationDecks: createMockExplorationDecks({ frontier: [] }),
      });

      const action = {
        type: 'explore' as const,
        playerId: 'player1',
        planetId: '',
        systemPosition: { q: 0, r: 0 },
        timestamp: Date.now(),
      };

      const result = validateExploreFrontier(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No cards remaining in frontier exploration deck');
    });

    it('should allow valid frontier exploration', () => {
      const player = createMockPlayer({
        id: 'player1',
        technologies: ['dark_energy_tap'],
      });
      const tile = createMockTile({
        position: { q: 0, r: 0 },
        frontier: true,
        units: [createMockUnit({ type: 'cruiser', ownerId: 'player1' })],
      });
      const state = createMockGameState([player], [tile]);

      const action = {
        type: 'explore' as const,
        playerId: 'player1',
        planetId: '',
        systemPosition: { q: 0, r: 0 },
        timestamp: Date.now(),
      };

      const result = validateExploreFrontier(state, action);

      expect(result.valid).toBe(true);
    });

    it('should accept any ship type for frontier exploration', () => {
      const shipTypes = ['carrier', 'cruiser', 'destroyer', 'dreadnought', 'flagship', 'war_sun', 'fighter'];

      for (const shipType of shipTypes) {
        const player = createMockPlayer({
          id: 'player1',
          technologies: ['dark_energy_tap'],
        });
        const tile = createMockTile({
          position: { q: 0, r: 0 },
          frontier: true,
          units: [createMockUnit({ type: shipType as UnitInstance['type'], ownerId: 'player1' })],
        });
        const state = createMockGameState([player], [tile]);

        const action = {
          type: 'explore' as const,
          playerId: 'player1',
          planetId: '',
          systemPosition: { q: 0, r: 0 },
          timestamp: Date.now(),
        };

        const result = validateExploreFrontier(state, action);

        expect(result.valid).toBe(true);
      }
    });
  });

  describe('validatePurgeRelicFragments', () => {
    it('should reject if player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const action: PurgeRelicFragmentsAction = {
        type: 'purge_relic_fragments',
        playerId: 'nonexistent',
        fragmentType: 'cultural',
        count: 3,
        timestamp: Date.now(),
      };

      const result = validatePurgeRelicFragments(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should reject if not in action phase', () => {
      const player = createMockPlayer({
        id: 'player1',
        relicFragments: { cultural: 3, industrial: 0, hazardous: 0, unknown: 0 },
      });
      const state = createMockGameState([player], [], { phase: 'strategy' });

      const action: PurgeRelicFragmentsAction = {
        type: 'purge_relic_fragments',
        playerId: 'player1',
        fragmentType: 'cultural',
        count: 3,
        timestamp: Date.now(),
      };

      const result = validatePurgeRelicFragments(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only purge fragments during action phase');
    });

    it('should reject if count is not exactly 3', () => {
      const player = createMockPlayer({
        id: 'player1',
        relicFragments: { cultural: 3, industrial: 0, hazardous: 0, unknown: 0 },
      });
      const state = createMockGameState([player]);

      const action: PurgeRelicFragmentsAction = {
        type: 'purge_relic_fragments',
        playerId: 'player1',
        fragmentType: 'cultural',
        count: 2, // Not 3
        timestamp: Date.now(),
      };

      const result = validatePurgeRelicFragments(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must purge exactly 3 fragments');
    });

    it('should reject if player has no relic fragments', () => {
      const player = createMockPlayer({
        id: 'player1',
        relicFragments: undefined,
      });
      const state = createMockGameState([player]);

      const action: PurgeRelicFragmentsAction = {
        type: 'purge_relic_fragments',
        playerId: 'player1',
        fragmentType: 'cultural',
        count: 3,
        timestamp: Date.now(),
      };

      const result = validatePurgeRelicFragments(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You have no relic fragments');
    });

    it('should reject if not enough fragments of type', () => {
      const player = createMockPlayer({
        id: 'player1',
        relicFragments: { cultural: 1, industrial: 0, hazardous: 0, unknown: 0 },
      });
      const state = createMockGameState([player]);

      const action: PurgeRelicFragmentsAction = {
        type: 'purge_relic_fragments',
        playerId: 'player1',
        fragmentType: 'cultural',
        count: 3,
        timestamp: Date.now(),
      };

      const result = validatePurgeRelicFragments(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not enough cultural fragments (have 1 + 0 unknown)');
    });

    it('should allow using unknown fragments to fill the gap', () => {
      const player = createMockPlayer({
        id: 'player1',
        relicFragments: { cultural: 1, industrial: 0, hazardous: 0, unknown: 2 },
      });
      const state = createMockGameState([player]);

      const action: PurgeRelicFragmentsAction = {
        type: 'purge_relic_fragments',
        playerId: 'player1',
        fragmentType: 'cultural',
        count: 3,
        timestamp: Date.now(),
      };

      const result = validatePurgeRelicFragments(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow purging with all unknown fragments', () => {
      const player = createMockPlayer({
        id: 'player1',
        relicFragments: { cultural: 0, industrial: 0, hazardous: 0, unknown: 3 },
      });
      const state = createMockGameState([player]);

      const action: PurgeRelicFragmentsAction = {
        type: 'purge_relic_fragments',
        playerId: 'player1',
        fragmentType: 'cultural',
        count: 3,
        timestamp: Date.now(),
      };

      const result = validatePurgeRelicFragments(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject if relic deck is empty', () => {
      const player = createMockPlayer({
        id: 'player1',
        relicFragments: { cultural: 3, industrial: 0, hazardous: 0, unknown: 0 },
      });
      const state = createMockGameState([player], [], {
        relicDeck: [],
      });

      const action: PurgeRelicFragmentsAction = {
        type: 'purge_relic_fragments',
        playerId: 'player1',
        fragmentType: 'cultural',
        count: 3,
        timestamp: Date.now(),
      };

      const result = validatePurgeRelicFragments(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No relics remaining in deck');
    });

    it('should allow valid purge action', () => {
      const player = createMockPlayer({
        id: 'player1',
        relicFragments: { cultural: 3, industrial: 0, hazardous: 0, unknown: 0 },
      });
      const state = createMockGameState([player]);

      const action: PurgeRelicFragmentsAction = {
        type: 'purge_relic_fragments',
        playerId: 'player1',
        fragmentType: 'cultural',
        count: 3,
        timestamp: Date.now(),
      };

      const result = validatePurgeRelicFragments(state, action);

      expect(result.valid).toBe(true);
    });

    it('should work with different fragment types', () => {
      const fragmentTypes = ['cultural', 'industrial', 'hazardous'] as const;

      for (const fragmentType of fragmentTypes) {
        const fragments = { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 };
        fragments[fragmentType] = 3;

        const player = createMockPlayer({
          id: 'player1',
          relicFragments: fragments,
        });
        const state = createMockGameState([player]);

        const action: PurgeRelicFragmentsAction = {
          type: 'purge_relic_fragments',
          playerId: 'player1',
          fragmentType,
          count: 3,
          timestamp: Date.now(),
        };

        const result = validatePurgeRelicFragments(state, action);

        expect(result.valid).toBe(true);
      }
    });
  });
});
