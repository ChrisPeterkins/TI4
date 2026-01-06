/**
 * Deepwrought Scholarate Faction Handler Tests
 *
 * Tests for the Thunder's Edge expansion Deepwrought faction:
 * - RESEARCH TEAM: Ground forces can coexist with other players
 * - OCEANBOUND: Gain ocean cards when coexistence begins
 * - Ocean card abilities and management
 * - Coexistence state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, PlayerState, MapTile, UnitInstance, PlanetInstance } from '@ti4/shared';
import {
  hasCoexistence,
  getCoexistingPlayers,
  canInitiateCoexistence,
  handleStartCoexistence,
  handleEndCoexistence,
  updateCoexistenceOnUnitRemoval,
  countCoexistingPlanets,
  grantOceanCard,
  enforceOceanCardLimit,
  handlePlayOceanCard,
} from '../deepwrought';

// ============================================================================
// Mock Factories
// ============================================================================

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    faction: 'arborec',
    color: 'blue',
    name: `Player ${id}`,
    tradeGoods: 0,
    commodities: 0,
    commoditiesLimit: 3,
    strategyCards: [],
    technologies: [],
    planets: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotes: [],
    relics: [],
    leaders: {
      agent: { id: 'test-agent', unlocked: false, exhausted: false },
      commander: { id: 'test-commander', unlocked: false },
      hero: { id: 'test-hero', unlocked: false, purged: false },
    },
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    victoryPoints: 0,
    isEliminated: false,
    hasPassedThisRound: false,
    activeInRound: true,
    ...overrides,
  } as PlayerState;
}

function createMockPlanet(id: string, overrides: Partial<PlanetInstance> = {}): PlanetInstance {
  return {
    id,
    name: `Planet ${id}`,
    resources: 2,
    influence: 1,
    units: [],
    controlledBy: undefined,
    ...overrides,
  } as PlanetInstance;
}

function createMockMapTile(id: string, position: { q: number; r: number }, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id,
    systemId: id,
    position,
    units: [],
    planets: [],
    commandTokens: [],
    ...overrides,
  } as MapTile;
}

function createMockGameState(playerCount: number): GameState {
  const players = Array.from({ length: playerCount }, (_, i) =>
    createMockPlayer(`player${i + 1}`)
  );

  return {
    id: 'test-game',
    players,
    currentPlayerIndex: 0,
    phase: 'action',
    round: 1,
    map: {
      tiles: [
        createMockMapTile('system1', { q: 0, r: 0 }, {
          planets: [createMockPlanet('planet1')],
        }),
        createMockMapTile('system2', { q: 1, r: 0 }, {
          planets: [createMockPlanet('planet2')],
        }),
      ],
    },
    publicObjectives: { stageI: [], stageII: [] },
    secretObjectives: [],
    laws: [],
    turnOrder: players.map((p) => p.id),
    actionCards: { deck: [], discard: [] },
    explorationDecks: {
      cultural: { deck: [], discard: [] },
      industrial: { deck: [], discard: [] },
      hazardous: { deck: [], discard: [] },
      frontier: { deck: [], discard: [] },
    },
    relicDeck: { deck: [], discard: [] },
    victoryPointLimit: 10,
    settings: {
      expansions: ['thunders_edge'],
      victoryPoints: 10,
    },
    timestamp: Date.now(),
    coexistenceState: [],
  } as unknown as GameState;
}

function createDeepwroughtPlayer(state: GameState): PlayerState {
  const player = state.players[0];
  player.faction = 'deepwrought';
  return player;
}

// ============================================================================
// Coexistence Detection Tests
// ============================================================================

describe('Deepwrought - Coexistence Detection', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
  });

  describe('hasCoexistence', () => {
    it('should return false when no coexistence state', () => {
      state.coexistenceState = undefined;
      expect(hasCoexistence(state, 'planet1')).toBe(false);
    });

    it('should return false when empty coexistence state', () => {
      state.coexistenceState = [];
      expect(hasCoexistence(state, 'planet1')).toBe(false);
    });

    it('should return true when planet has coexisting players', () => {
      state.coexistenceState = [{
        planetId: 'planet1',
        coexistingPlayers: ['player1', 'player2'],
      }];
      expect(hasCoexistence(state, 'planet1')).toBe(true);
    });

    it('should return false when planet has fewer than 2 players', () => {
      state.coexistenceState = [{
        planetId: 'planet1',
        coexistingPlayers: ['player1'],
      }];
      expect(hasCoexistence(state, 'planet1')).toBe(false);
    });
  });

  describe('getCoexistingPlayers', () => {
    it('should return empty array when no coexistence state', () => {
      state.coexistenceState = undefined;
      expect(getCoexistingPlayers(state, 'planet1')).toEqual([]);
    });

    it('should return empty array when planet not found', () => {
      state.coexistenceState = [];
      expect(getCoexistingPlayers(state, 'planet1')).toEqual([]);
    });

    it('should return coexisting player IDs', () => {
      state.coexistenceState = [{
        planetId: 'planet1',
        coexistingPlayers: ['player1', 'player2', 'player3'],
      }];
      const players = getCoexistingPlayers(state, 'planet1');
      expect(players).toHaveLength(3);
      expect(players).toContain('player1');
      expect(players).toContain('player2');
    });
  });

  describe('canInitiateCoexistence', () => {
    it('should return true for Deepwrought with other player units on planet', () => {
      createDeepwroughtPlayer(state);
      state.map.tiles[0].planets[0].units = [
        { id: 'unit1', type: 'infantry', ownerId: 'player2' } as UnitInstance,
      ];

      expect(canInitiateCoexistence(state, 'player1', 'planet1')).toBe(true);
    });

    it('should return false for non-Deepwrought player', () => {
      state.map.tiles[0].planets[0].units = [
        { id: 'unit1', type: 'infantry', ownerId: 'player2' } as UnitInstance,
      ];

      expect(canInitiateCoexistence(state, 'player1', 'planet1')).toBe(false);
    });

    it('should return true for Firmament player (Shadow mech)', () => {
      state.players[0].faction = 'firmament';
      state.map.tiles[0].planets[0].units = [
        { id: 'unit1', type: 'infantry', ownerId: 'player2' } as UnitInstance,
      ];

      expect(canInitiateCoexistence(state, 'player1', 'planet1')).toBe(true);
    });

    it('should return false when planet already has coexistence', () => {
      createDeepwroughtPlayer(state);
      state.coexistenceState = [{
        planetId: 'planet1',
        coexistingPlayers: ['player2', 'player3'],
      }];
      state.map.tiles[0].planets[0].units = [
        { id: 'unit1', type: 'infantry', ownerId: 'player2' } as UnitInstance,
      ];

      expect(canInitiateCoexistence(state, 'player1', 'planet1')).toBe(false);
    });

    it('should return false when no other player units on planet', () => {
      createDeepwroughtPlayer(state);
      state.map.tiles[0].planets[0].units = [
        { id: 'unit1', type: 'infantry', ownerId: 'player1' } as UnitInstance,
      ];

      expect(canInitiateCoexistence(state, 'player1', 'planet1')).toBe(false);
    });

    it('should return false for non-existent player', () => {
      expect(canInitiateCoexistence(state, 'nonexistent', 'planet1')).toBe(false);
    });
  });

  describe('countCoexistingPlanets', () => {
    it('should return 0 when no coexistence state', () => {
      state.coexistenceState = undefined;
      expect(countCoexistingPlanets(state, 'player1')).toBe(0);
    });

    it('should count planets with player in coexistence', () => {
      state.coexistenceState = [
        { planetId: 'planet1', coexistingPlayers: ['player1', 'player2'] },
        { planetId: 'planet2', coexistingPlayers: ['player1', 'player3'] },
        { planetId: 'planet3', coexistingPlayers: ['player2', 'player3'] },
      ];

      expect(countCoexistingPlanets(state, 'player1')).toBe(2);
      expect(countCoexistingPlanets(state, 'player3')).toBe(2);
      expect(countCoexistingPlanets(state, 'player4')).toBe(0);
    });
  });
});

// ============================================================================
// Coexistence Action Tests
// ============================================================================

describe('Deepwrought - Coexistence Actions', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
  });

  describe('handleStartCoexistence', () => {
    it('should start coexistence for Deepwrought player', () => {
      createDeepwroughtPlayer(state);
      state.map.tiles[0].planets[0].units = [
        { id: 'unit1', type: 'infantry', ownerId: 'player2' } as UnitInstance,
      ];

      const result = handleStartCoexistence(state, {
        type: 'start_coexistence',
        playerId: 'player1',
        planetId: 'planet1',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('coexistence_started');
      expect(state.coexistenceState).toHaveLength(1);
    });

    it('should grant ocean card to Deepwrought player', () => {
      createDeepwroughtPlayer(state);
      state.map.tiles[0].planets[0].units = [
        { id: 'unit1', type: 'infantry', ownerId: 'player2' } as UnitInstance,
      ];

      const result = handleStartCoexistence(state, {
        type: 'start_coexistence',
        playerId: 'player1',
        planetId: 'planet1',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('ocean_card_gained');
      expect(state.players[0].oceanCards).toHaveLength(1);
    });

    it('should fail for non-existent player', () => {
      const result = handleStartCoexistence(state, {
        type: 'start_coexistence',
        playerId: 'nonexistent',
        planetId: 'planet1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail when cannot initiate coexistence', () => {
      // Not Deepwrought
      const result = handleStartCoexistence(state, {
        type: 'start_coexistence',
        playerId: 'player1',
        planetId: 'planet1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot initiate coexistence');
    });

    it('should fail when less than 2 players on planet', () => {
      createDeepwroughtPlayer(state);
      // Only player1's units on planet
      state.map.tiles[0].planets[0].units = [];

      const result = handleStartCoexistence(state, {
        type: 'start_coexistence',
        playerId: 'player1',
        planetId: 'planet1',
      });

      expect(result.success).toBe(false);
    });

    it('should update existing coexistence state', () => {
      createDeepwroughtPlayer(state);
      state.map.tiles[0].planets[0].units = [
        { id: 'unit1', type: 'infantry', ownerId: 'player2' } as UnitInstance,
      ];
      state.coexistenceState = [{
        planetId: 'planet1',
        coexistingPlayers: [],
      }];

      handleStartCoexistence(state, {
        type: 'start_coexistence',
        playerId: 'player1',
        planetId: 'planet1',
      });

      expect(state.coexistenceState).toHaveLength(1);
      expect(state.coexistenceState[0].coexistingPlayers.length).toBeGreaterThan(0);
    });
  });

  describe('handleEndCoexistence', () => {
    beforeEach(() => {
      createDeepwroughtPlayer(state);
      state.coexistenceState = [{
        planetId: 'planet1',
        coexistingPlayers: ['player1', 'player2'],
      }];
    });

    it('should end coexistence on planet', () => {
      const result = handleEndCoexistence(state, {
        type: 'end_coexistence',
        planetId: 'planet1',
        reason: 'combat',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('coexistence_ended');
      expect(state.coexistenceState).toHaveLength(0);
    });

    it('should include reason in result data', () => {
      const result = handleEndCoexistence(state, {
        type: 'end_coexistence',
        planetId: 'planet1',
        reason: 'withdrawal',
      });

      expect(result.success).toBe(true);
      expect((result.data as { reason: string }).reason).toBe('withdrawal');
    });

    it('should fail when no coexistence state', () => {
      state.coexistenceState = undefined;

      const result = handleEndCoexistence(state, {
        type: 'end_coexistence',
        planetId: 'planet1',
        reason: 'combat',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No coexistence state');
    });

    it('should fail when no coexistence on planet', () => {
      state.coexistenceState = [];

      const result = handleEndCoexistence(state, {
        type: 'end_coexistence',
        planetId: 'planet1',
        reason: 'combat',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No coexistence on this planet');
    });
  });

  describe('updateCoexistenceOnUnitRemoval', () => {
    it('should do nothing when no coexistence state', () => {
      state.coexistenceState = undefined;
      updateCoexistenceOnUnitRemoval(state, 'planet1');
      expect(state.coexistenceState).toBeUndefined();
    });

    it('should do nothing when planet not in coexistence', () => {
      state.coexistenceState = [];
      updateCoexistenceOnUnitRemoval(state, 'planet1');
      expect(state.coexistenceState).toHaveLength(0);
    });

    it('should end coexistence when fewer than 2 players remain', () => {
      state.coexistenceState = [{
        planetId: 'planet1',
        coexistingPlayers: ['player1', 'player2'],
      }];
      state.map.tiles[0].planets[0].units = [
        { id: 'unit1', type: 'infantry', ownerId: 'player1' } as UnitInstance,
      ];

      updateCoexistenceOnUnitRemoval(state, 'planet1');

      expect(state.coexistenceState).toHaveLength(0);
    });

    it('should update player list when players remain', () => {
      state.coexistenceState = [{
        planetId: 'planet1',
        coexistingPlayers: ['player1', 'player2', 'player3'],
      }];
      state.map.tiles[0].planets[0].units = [
        { id: 'unit1', type: 'infantry', ownerId: 'player1' } as UnitInstance,
        { id: 'unit2', type: 'infantry', ownerId: 'player2' } as UnitInstance,
      ];

      updateCoexistenceOnUnitRemoval(state, 'planet1');

      expect(state.coexistenceState).toHaveLength(1);
      expect(state.coexistenceState[0].coexistingPlayers).toContain('player1');
      expect(state.coexistenceState[0].coexistingPlayers).toContain('player2');
      expect(state.coexistenceState[0].coexistingPlayers).not.toContain('player3');
    });
  });
});

// ============================================================================
// Ocean Card Tests
// ============================================================================

describe('Deepwrought - Ocean Cards', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createDeepwroughtPlayer(state);
  });

  describe('grantOceanCard', () => {
    it('should grant an ocean card to player', () => {
      const cardId = grantOceanCard(state, 'player1');

      expect(cardId).toBeDefined();
      expect(state.players[0].oceanCards).toHaveLength(1);
      expect(state.players[0].oceanCards).toContain(cardId);
    });

    it('should return null for non-existent player', () => {
      const cardId = grantOceanCard(state, 'nonexistent');
      expect(cardId).toBeNull();
    });

    it('should initialize oceanCards array if undefined', () => {
      state.players[0].oceanCards = undefined;

      grantOceanCard(state, 'player1');

      expect(state.players[0].oceanCards).toBeDefined();
      expect(state.players[0].oceanCards).toHaveLength(1);
    });

    it('should add to existing ocean cards', () => {
      state.players[0].oceanCards = ['deep_sea_research'];

      grantOceanCard(state, 'player1');

      expect(state.players[0].oceanCards.length).toBe(2);
    });
  });

  describe('enforceOceanCardLimit', () => {
    it('should return empty array when no cards need discarding', () => {
      state.players[0].oceanCards = ['deep_sea_research'];
      state.coexistenceState = [{
        planetId: 'planet1',
        coexistingPlayers: ['player1', 'player2'],
      }];

      const discarded = enforceOceanCardLimit(state, 'player1');

      expect(discarded).toHaveLength(0);
      expect(state.players[0].oceanCards).toHaveLength(1);
    });

    it('should discard excess ocean cards', () => {
      state.players[0].oceanCards = ['deep_sea_research', 'tidal_navigation', 'ocean_harvest'];
      state.coexistenceState = [{
        planetId: 'planet1',
        coexistingPlayers: ['player1', 'player2'],
      }];

      const discarded = enforceOceanCardLimit(state, 'player1');

      expect(discarded).toHaveLength(2);
      expect(state.players[0].oceanCards).toHaveLength(1);
    });

    it('should discard all cards when no coexistence', () => {
      state.players[0].oceanCards = ['deep_sea_research', 'tidal_navigation'];
      state.coexistenceState = [];

      const discarded = enforceOceanCardLimit(state, 'player1');

      expect(discarded).toHaveLength(2);
      expect(state.players[0].oceanCards).toHaveLength(0);
    });

    it('should return empty array when player has no cards', () => {
      state.players[0].oceanCards = undefined;

      const discarded = enforceOceanCardLimit(state, 'player1');

      expect(discarded).toHaveLength(0);
    });
  });

  describe('handlePlayOceanCard', () => {
    beforeEach(() => {
      state.players[0].oceanCards = [
        'deep_sea_research',
        'tidal_navigation',
        'ocean_harvest',
      ];
    });

    it('should play deep_sea_research (draw action card)', () => {
      const result = handlePlayOceanCard(state, {
        type: 'play_ocean_card',
        playerId: 'player1',
        cardId: 'deep_sea_research',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('ocean_card_played');
      expect(result.triggeredEvents).toContain('draw_action_card');
      expect(state.players[0].oceanCards).not.toContain('deep_sea_research');
    });

    it('should play tidal_navigation (movement bonus)', () => {
      const result = handlePlayOceanCard(state, {
        type: 'play_ocean_card',
        playerId: 'player1',
        cardId: 'tidal_navigation',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('movement_bonus');
      expect((result.data as { bonus?: number }).bonus).toBe(1);
    });

    it('should fail for non-existent player', () => {
      const result = handlePlayOceanCard(state, {
        type: 'play_ocean_card',
        playerId: 'nonexistent',
        cardId: 'deep_sea_research',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail for card not in hand', () => {
      const result = handlePlayOceanCard(state, {
        type: 'play_ocean_card',
        playerId: 'player1',
        cardId: 'abyssal_secrets',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not have this ocean card');
    });

    it('should fail when player has no ocean cards', () => {
      state.players[0].oceanCards = undefined;

      const result = handlePlayOceanCard(state, {
        type: 'play_ocean_card',
        playerId: 'player1',
        cardId: 'deep_sea_research',
      });

      expect(result.success).toBe(false);
    });

    it('should remove card from hand after playing', () => {
      handlePlayOceanCard(state, {
        type: 'play_ocean_card',
        playerId: 'player1',
        cardId: 'deep_sea_research',
      });

      expect(state.players[0].oceanCards).not.toContain('deep_sea_research');
      expect(state.players[0].oceanCards).toHaveLength(2);
    });
  });
});
