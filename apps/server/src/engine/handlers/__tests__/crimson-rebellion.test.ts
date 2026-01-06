/**
 * Crimson Rebellion Faction Handler Tests
 *
 * Tests for the Thunder's Edge expansion Crimson Rebellion faction:
 * - SUNDERED: Cannot use non-epsilon wormholes
 * - INCURSION: Place and manage breach tokens
 * - Breach token adjacency and movement
 * - Revolution flagship combat bonus
 * - Revenant mech movement
 * - Ahk Siever commander ability
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, MapTile, PlayerState, UnitInstance } from '@ti4/shared';
import {
  isSundered,
  canUseWormhole,
  getUsableWormholes,
  getBreachTokens,
  getBreachTokenInSystem,
  getActiveBreachTokens,
  hasActiveBreachToken,
  areSystemsConnectedByBreach,
  getBreachAdjacentSystems,
  handlePlaceBreach,
  handleFlipBreach,
  handleRemoveBreach,
  activateBreachOnEntry,
  getRevolutionCombatBonus,
  handleRevenantMovement,
  handleAhkSieverTrigger,
  getCrimsonMovementTargets,
} from '../crimson-rebellion';

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
        createMockMapTile('system1', { q: 0, r: 0 }),
        createMockMapTile('system2', { q: 1, r: 0 }),
        createMockMapTile('system3', { q: 0, r: 1 }),
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
    breachTokens: [],
  } as unknown as GameState;
}

function createCrimsonRebellionPlayer(state: GameState): PlayerState {
  const player = state.players[0];
  player.faction = 'crimson_rebellion';
  return player;
}

// ============================================================================
// SUNDERED - Wormhole Restrictions
// ============================================================================

describe('Crimson Rebellion - Sundered', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
  });

  describe('isSundered', () => {
    it('should return true for Crimson Rebellion player', () => {
      createCrimsonRebellionPlayer(state);
      expect(isSundered(state, 'player1')).toBe(true);
    });

    it('should return false for non-Crimson Rebellion player', () => {
      expect(isSundered(state, 'player1')).toBe(false);
    });

    it('should return false for non-existent player', () => {
      expect(isSundered(state, 'nonexistent')).toBe(false);
    });
  });

  describe('canUseWormhole', () => {
    it('should allow any wormhole for non-Crimson Rebellion', () => {
      expect(canUseWormhole(state, 'player1', 'alpha')).toBe(true);
      expect(canUseWormhole(state, 'player1', 'beta')).toBe(true);
      expect(canUseWormhole(state, 'player1', 'gamma')).toBe(true);
      expect(canUseWormhole(state, 'player1', 'epsilon')).toBe(true);
    });

    it('should only allow epsilon wormholes for Crimson Rebellion', () => {
      createCrimsonRebellionPlayer(state);
      expect(canUseWormhole(state, 'player1', 'alpha')).toBe(false);
      expect(canUseWormhole(state, 'player1', 'beta')).toBe(false);
      expect(canUseWormhole(state, 'player1', 'gamma')).toBe(false);
      expect(canUseWormhole(state, 'player1', 'epsilon')).toBe(true);
    });
  });

  describe('getUsableWormholes', () => {
    beforeEach(() => {
      state.map.tiles = [
        createMockMapTile('alpha1', { q: 0, r: 0 }, { wormhole: 'alpha' }),
        createMockMapTile('beta1', { q: 1, r: 0 }, { wormhole: 'beta' }),
        createMockMapTile('epsilon1', { q: 2, r: 0 }, { wormhole: 'epsilon' }),
      ];
    });

    it('should return all wormholes for non-Crimson Rebellion', () => {
      const wormholes = getUsableWormholes(state, 'player1');
      expect(wormholes).toHaveLength(3);
    });

    it('should return only epsilon wormholes for Crimson Rebellion', () => {
      createCrimsonRebellionPlayer(state);
      const wormholes = getUsableWormholes(state, 'player1');
      expect(wormholes).toHaveLength(1);
      expect(wormholes[0].wormholeType).toBe('epsilon');
    });
  });
});

// ============================================================================
// Breach Token Management
// ============================================================================

describe('Crimson Rebellion - Breach Tokens', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createCrimsonRebellionPlayer(state);
  });

  describe('getBreachTokens', () => {
    it('should return empty array when no breach tokens', () => {
      state.breachTokens = [];
      expect(getBreachTokens(state)).toEqual([]);
    });

    it('should return all breach tokens', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: false },
        { systemId: 'system2', placedBy: 'player1', active: true },
      ];
      expect(getBreachTokens(state)).toHaveLength(2);
    });

    it('should handle undefined breachTokens', () => {
      state.breachTokens = undefined;
      expect(getBreachTokens(state)).toEqual([]);
    });
  });

  describe('getBreachTokenInSystem', () => {
    it('should return undefined when no token in system', () => {
      state.breachTokens = [];
      expect(getBreachTokenInSystem(state, 'system1')).toBeUndefined();
    });

    it('should return the token when present', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
      ];
      const token = getBreachTokenInSystem(state, 'system1');
      expect(token).toBeDefined();
      expect(token?.active).toBe(true);
    });
  });

  describe('getActiveBreachTokens', () => {
    it('should return only active tokens', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: false },
        { systemId: 'system2', placedBy: 'player1', active: true },
        { systemId: 'system3', placedBy: 'player1', active: true },
      ];
      const active = getActiveBreachTokens(state);
      expect(active).toHaveLength(2);
      expect(active.every(t => t.active)).toBe(true);
    });
  });

  describe('hasActiveBreachToken', () => {
    it('should return true for system with active token', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
      ];
      expect(hasActiveBreachToken(state, 'system1')).toBe(true);
    });

    it('should return false for system with inactive token', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: false },
      ];
      expect(hasActiveBreachToken(state, 'system1')).toBe(false);
    });

    it('should return false for system without token', () => {
      state.breachTokens = [];
      expect(hasActiveBreachToken(state, 'system1')).toBe(false);
    });
  });

  describe('areSystemsConnectedByBreach', () => {
    it('should return true when both systems have active breach tokens', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
        { systemId: 'system2', placedBy: 'player1', active: true },
      ];
      expect(areSystemsConnectedByBreach(state, 'system1', 'system2')).toBe(true);
    });

    it('should return false when one system has inactive token', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
        { systemId: 'system2', placedBy: 'player1', active: false },
      ];
      expect(areSystemsConnectedByBreach(state, 'system1', 'system2')).toBe(false);
    });

    it('should return false when only one system has token', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
      ];
      expect(areSystemsConnectedByBreach(state, 'system1', 'system2')).toBe(false);
    });
  });

  describe('getBreachAdjacentSystems', () => {
    it('should return all other active breach systems', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
        { systemId: 'system2', placedBy: 'player1', active: true },
        { systemId: 'system3', placedBy: 'player1', active: true },
      ];
      const adjacent = getBreachAdjacentSystems(state, 'system1');
      expect(adjacent).toHaveLength(2);
      expect(adjacent).toContain('system2');
      expect(adjacent).toContain('system3');
    });

    it('should return empty array when system has no active breach', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: false },
        { systemId: 'system2', placedBy: 'player1', active: true },
      ];
      expect(getBreachAdjacentSystems(state, 'system1')).toEqual([]);
    });
  });
});

// ============================================================================
// Breach Token Actions
// ============================================================================

describe('Crimson Rebellion - Breach Token Actions', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createCrimsonRebellionPlayer(state);
  });

  describe('handlePlaceBreach', () => {
    it('should place a breach token in a valid system', () => {
      const result = handlePlaceBreach(state, {
        type: 'place_breach',
        playerId: 'player1',
        systemId: 'system1',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('breach_token_placed');
      expect(getBreachTokenInSystem(state, 'system1')).toBeDefined();
      expect(getBreachTokenInSystem(state, 'system1')?.active).toBe(false);
    });

    it('should fail for non-Crimson Rebellion player', () => {
      const result = handlePlaceBreach(state, {
        type: 'place_breach',
        playerId: 'player2',
        systemId: 'system1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only Crimson Rebellion');
    });

    it('should fail for non-existent player', () => {
      const result = handlePlaceBreach(state, {
        type: 'place_breach',
        playerId: 'nonexistent',
        systemId: 'system1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail for non-existent system', () => {
      const result = handlePlaceBreach(state, {
        type: 'place_breach',
        playerId: 'player1',
        systemId: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('System not found');
    });

    it('should fail if system already has breach token', () => {
      state.breachTokens = [{ systemId: 'system1', placedBy: 'player1', active: false }];

      const result = handlePlaceBreach(state, {
        type: 'place_breach',
        playerId: 'player1',
        systemId: 'system1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already has a breach token');
    });

    it('should fail if maximum tokens reached', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: false },
        { systemId: 'system2', placedBy: 'player1', active: false },
        { systemId: 'system3', placedBy: 'player1', active: false },
      ];

      // Add a fourth system to place token in
      state.map.tiles.push(createMockMapTile('system4', { q: 2, r: 0 }));

      const result = handlePlaceBreach(state, {
        type: 'place_breach',
        playerId: 'player1',
        systemId: 'system4',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum breach tokens');
    });
  });

  describe('handleFlipBreach', () => {
    beforeEach(() => {
      state.breachTokens = [{ systemId: 'system1', placedBy: 'player1', active: false }];
    });

    it('should flip inactive to active', () => {
      const result = handleFlipBreach(state, {
        type: 'flip_breach',
        playerId: 'player1',
        systemId: 'system1',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('breach_token_activated');
      expect(getBreachTokenInSystem(state, 'system1')?.active).toBe(true);
    });

    it('should flip active to inactive', () => {
      state.breachTokens[0].active = true;

      const result = handleFlipBreach(state, {
        type: 'flip_breach',
        playerId: 'player1',
        systemId: 'system1',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('breach_token_deactivated');
      expect(getBreachTokenInSystem(state, 'system1')?.active).toBe(false);
    });

    it('should fail for non-existent player', () => {
      const result = handleFlipBreach(state, {
        type: 'flip_breach',
        playerId: 'nonexistent',
        systemId: 'system1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail for system without breach token', () => {
      const result = handleFlipBreach(state, {
        type: 'flip_breach',
        playerId: 'player1',
        systemId: 'system2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No breach token in system');
    });

    it('should fail when flipping another player token', () => {
      state.breachTokens[0].placedBy = 'player2';

      const result = handleFlipBreach(state, {
        type: 'flip_breach',
        playerId: 'player1',
        systemId: 'system1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('only flip your own');
    });
  });

  describe('handleRemoveBreach', () => {
    beforeEach(() => {
      state.breachTokens = [{ systemId: 'system1', placedBy: 'player1', active: true }];
    });

    it('should remove own breach token', () => {
      const result = handleRemoveBreach(state, {
        type: 'remove_breach',
        playerId: 'player1',
        systemId: 'system1',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('breach_token_removed');
      expect(getBreachTokenInSystem(state, 'system1')).toBeUndefined();
    });

    it('should fail for non-existent breach token', () => {
      const result = handleRemoveBreach(state, {
        type: 'remove_breach',
        playerId: 'player1',
        systemId: 'system2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No breach token in system');
    });

    it('should fail when no breach tokens exist', () => {
      state.breachTokens = undefined;

      const result = handleRemoveBreach(state, {
        type: 'remove_breach',
        playerId: 'player1',
        systemId: 'system1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No breach tokens exist');
    });

    it('should fail removing another player token if ships present', () => {
      state.breachTokens[0].placedBy = 'otherPlayer';
      state.map.tiles[0].units.push({
        id: 'ship1',
        type: 'cruiser',
        ownerId: 'otherPlayer',
      } as UnitInstance);

      const result = handleRemoveBreach(state, {
        type: 'remove_breach',
        playerId: 'player1',
        systemId: 'system1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('only remove your own');
    });
  });

  describe('activateBreachOnEntry', () => {
    beforeEach(() => {
      state.breachTokens = [{ systemId: 'system1', placedBy: 'player1', active: false }];
    });

    it('should activate breach token when Crimson Rebellion enters', () => {
      const result = activateBreachOnEntry(state, 'player1', 'system1');

      expect(result.success).toBe(true);
      expect(result.data?.activated).toBe(true);
      expect(getBreachTokenInSystem(state, 'system1')?.active).toBe(true);
    });

    it('should not activate for non-Crimson Rebellion player', () => {
      const result = activateBreachOnEntry(state, 'player2', 'system1');

      expect(result.success).toBe(true);
      expect(result.data?.activated).toBe(false);
    });

    it('should not activate already active token', () => {
      state.breachTokens[0].active = true;

      const result = activateBreachOnEntry(state, 'player1', 'system1');

      expect(result.success).toBe(true);
      expect(result.data?.activated).toBe(false);
    });

    it('should not activate other player token', () => {
      state.breachTokens[0].placedBy = 'player2';

      const result = activateBreachOnEntry(state, 'player1', 'system1');

      expect(result.success).toBe(true);
      expect(result.data?.activated).toBe(false);
    });
  });
});

// ============================================================================
// Revolution Flagship
// ============================================================================

describe('Crimson Rebellion - Revolution Flagship', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createCrimsonRebellionPlayer(state);
  });

  describe('getRevolutionCombatBonus', () => {
    it('should return 0 when not in combat', () => {
      expect(getRevolutionCombatBonus(state, 'player1')).toBe(0);
    });

    it('should return 0 for non-Crimson Rebellion', () => {
      state.activeCombat = {
        systemId: 'system1',
        attackerId: 'player2',
        defenderId: 'player3',
        retreatAnnounced: { attacker: false, defender: false },
      } as GameState['activeCombat'];

      expect(getRevolutionCombatBonus(state, 'player2')).toBe(0);
    });

    it('should return bonus equal to active breach token count', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
        { systemId: 'system2', placedBy: 'player1', active: true },
        { systemId: 'system3', placedBy: 'player1', active: false },
      ];

      state.activeCombat = {
        systemId: 'system1',
        attackerId: 'player1',
        defenderId: 'player2',
        retreatAnnounced: { attacker: false, defender: false },
      } as GameState['activeCombat'];

      // Add flagship to combat system
      state.map.tiles[0].units.push({
        id: 'flagship1',
        type: 'flagship',
        ownerId: 'player1',
      } as UnitInstance);

      expect(getRevolutionCombatBonus(state, 'player1')).toBe(2);
    });

    it('should return 0 when flagship not in combat system', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
      ];

      state.activeCombat = {
        systemId: 'system1',
        attackerId: 'player1',
        defenderId: 'player2',
        retreatAnnounced: { attacker: false, defender: false },
      } as GameState['activeCombat'];

      // No flagship in system
      expect(getRevolutionCombatBonus(state, 'player1')).toBe(0);
    });
  });
});

// ============================================================================
// Revenant Mech Movement
// ============================================================================

describe('Crimson Rebellion - Revenant Mech', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createCrimsonRebellionPlayer(state);

    // Set up planets in systems
    state.map.tiles[0].planets = [{
      id: 'planet1',
      name: 'Planet 1',
      resources: 2,
      influence: 1,
      units: [{
        id: 'mech1',
        type: 'mech',
        ownerId: 'player1',
        planetId: 'planet1',
      } as UnitInstance],
      controlledBy: 'player1',
    }];

    state.map.tiles[1].planets = [{
      id: 'planet2',
      name: 'Planet 2',
      resources: 1,
      influence: 2,
      units: [],
      controlledBy: 'player1',
    }];
  });

  describe('handleRevenantMovement', () => {
    it('should move mech via active breach connection', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
        { systemId: 'system2', placedBy: 'player1', active: true },
      ];

      const result = handleRevenantMovement(
        state,
        'player1',
        'mech1',
        'system1',
        'system2'
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('revenant_movement');
    });

    it('should fail for non-Crimson Rebellion player', () => {
      const result = handleRevenantMovement(
        state,
        'player2',
        'mech1',
        'system1',
        'system2'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only Crimson Rebellion');
    });

    it('should fail when systems not connected by breach', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
        { systemId: 'system2', placedBy: 'player1', active: false },
      ];

      const result = handleRevenantMovement(
        state,
        'player1',
        'mech1',
        'system1',
        'system2'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not connected by active breach');
    });

    it('should fail when mech not found', () => {
      state.breachTokens = [
        { systemId: 'system1', placedBy: 'player1', active: true },
        { systemId: 'system2', placedBy: 'player1', active: true },
      ];

      const result = handleRevenantMovement(
        state,
        'player1',
        'nonexistent',
        'system1',
        'system2'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Mech not found');
    });
  });
});

// ============================================================================
// Ahk Siever Commander
// ============================================================================

describe('Crimson Rebellion - Ahk Siever Commander', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    const crPlayer = createCrimsonRebellionPlayer(state);
    crPlayer.leaders = {
      agent: { id: 'agent', unlocked: false, exhausted: false },
      commander: { id: 'ahk_siever', unlocked: true },
      hero: { id: 'hero', unlocked: false, purged: false },
    };

    // Add Crimson Rebellion units to system
    state.map.tiles[0].units.push({
      id: 'cruiser1',
      type: 'cruiser',
      ownerId: 'player1',
    } as UnitInstance);
  });

  describe('handleAhkSieverTrigger', () => {
    it('should place breach token when system with CR units is activated', () => {
      const result = handleAhkSieverTrigger(state, 'system1');

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('breach_token_placed');
      expect(getBreachTokenInSystem(state, 'system1')).toBeDefined();
    });

    it('should not trigger when commander not unlocked', () => {
      state.players[0].leaders!.commander!.unlocked = false;

      const result = handleAhkSieverTrigger(state, 'system1');

      expect(result.success).toBe(true);
      expect(result.data?.triggered).toBe(false);
    });

    it('should not trigger when no CR units in system', () => {
      state.map.tiles[0].units = [];

      const result = handleAhkSieverTrigger(state, 'system1');

      expect(result.success).toBe(true);
      expect(result.data?.triggered).toBe(false);
    });

    it('should not trigger when breach already exists', () => {
      state.breachTokens = [{ systemId: 'system1', placedBy: 'player1', active: false }];

      const result = handleAhkSieverTrigger(state, 'system1');

      expect(result.success).toBe(true);
      expect(result.data?.triggered).toBe(false);
    });
  });
});

// ============================================================================
// Movement Integration
// ============================================================================

describe('Crimson Rebellion - Movement Integration', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createCrimsonRebellionPlayer(state);

    // Set up map with adjacent tiles
    state.map.tiles = [
      createMockMapTile('center', { q: 0, r: 0 }),
      createMockMapTile('adjacent1', { q: 1, r: 0 }),
      createMockMapTile('adjacent2', { q: -1, r: 0 }),
      createMockMapTile('far', { q: 3, r: 0 }),
      createMockMapTile('epsilon1', { q: 0, r: 0 }, { wormhole: 'epsilon' }),
      createMockMapTile('epsilon2', { q: 5, r: 5 }, { wormhole: 'epsilon' }),
    ];
  });

  describe('getCrimsonMovementTargets', () => {
    it('should include adjacent systems', () => {
      const targets = getCrimsonMovementTargets(state, 'player1', 'center');
      expect(targets).toContain('adjacent1');
      expect(targets).toContain('adjacent2');
    });

    it('should include epsilon wormhole connections', () => {
      // Update center to have epsilon wormhole
      state.map.tiles[0].wormhole = 'epsilon';

      const targets = getCrimsonMovementTargets(state, 'player1', 'center');
      expect(targets).toContain('epsilon2');
    });

    it('should include active breach connections', () => {
      state.breachTokens = [
        { systemId: 'center', placedBy: 'player1', active: true },
        { systemId: 'far', placedBy: 'player1', active: true },
      ];

      const targets = getCrimsonMovementTargets(state, 'player1', 'center');
      expect(targets).toContain('far');
    });

    it('should return empty for non-Crimson Rebellion player', () => {
      const targets = getCrimsonMovementTargets(state, 'player2', 'center');
      expect(targets).toEqual([]);
    });
  });
});
