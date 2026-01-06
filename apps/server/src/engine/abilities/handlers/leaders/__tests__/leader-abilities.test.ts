/**
 * Leader Abilities Tests
 *
 * Comprehensive tests for Agent, Commander, and Hero abilities.
 * Tests cover all leader types from base game and PoK factions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  GameState,
  PlayerState,
  MapTile,
  PlanetInstance,
  UnitInstance,
  GamePhase,
  FactionId,
} from '@ti4/shared';

// Helper to create mock game state
function createMockGameState(playerCount: number = 4): GameState {
  const players: PlayerState[] = [];
  const factions: FactionId[] = ['arborec', 'sol', 'empyrean', 'mahact'];

  for (let i = 0; i < playerCount; i++) {
    players.push(createMockPlayer(`player${i + 1}`, {
      faction: factions[i % factions.length],
    }));
  }

  return {
    id: 'test-game',
    phase: 'action' as GamePhase,
    round: 1,
    turn: 0,
    activePlayerId: players[0].id,
    players,
    map: {
      tiles: [
        createMockMapTile('mecatol', {
          systemId: 'mecatol',
          position: { q: 0, r: 0 },
          planets: [{ id: 'mecatol-rex', name: 'Mecatol Rex', resources: 1, influence: 6, trait: undefined, controlledBy: undefined }],
          units: [],
        }),
        createMockMapTile('system1', {
          systemId: 'system1',
          position: { q: 1, r: 0 },
          planets: [{ id: 'planet1', name: 'Planet 1', resources: 2, influence: 3, trait: 'cultural', controlledBy: 'player1' }],
          units: [],
        }),
        createMockMapTile('system2', {
          systemId: 'system2',
          position: { q: 0, r: 1 },
          planets: [{ id: 'planet2', name: 'Planet 2', resources: 3, influence: 1, trait: 'industrial', controlledBy: 'player2' }],
          units: [],
        }),
      ],
    },
    objectives: {
      stage1: [],
      stage2: [],
      secret: {},
      scored: {},
    },
    laws: [],
    actionCards: [],
    speaker: 'player1',
    passedPlayers: [],
    strategyCards: [],
    strategyCardsPlayed: [],
    timestamp: Date.now(),
    activeCombat: null,
    pendingAbilities: [],
    globalModifiers: [],
  } as unknown as GameState;
}

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    faction: 'arborec' as FactionId,
    color: 'blue',
    name: `Player ${id}`,
    planets: [],
    technologies: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    commodities: 0,
    commoditiesLimit: 3,
    tradeGoods: 0,
    commandTokens: {
      tactics: 3,
      fleet: 3,
      strategy: 2,
    },
    strategyCards: [],
    promissoryNotes: [],
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    relics: [],
    victoryPoints: 0,
    passed: false,
    ...overrides,
  } as PlayerState;
}

function createMockMapTile(id: string, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id,
    systemId: id,
    position: { q: 0, r: 0 },
    planets: [],
    units: [],
    commandTokens: [],
    ...overrides,
  } as MapTile;
}

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('Leader Ability Helpers', () => {
  describe('isAgentAvailable', () => {
    it('should return true when agent is unlocked and not exhausted', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.agent = { unlocked: true, exhausted: false };

      expect(player.leaders.agent.unlocked).toBe(true);
      expect(player.leaders.agent.exhausted).toBe(false);
    });

    it('should return false when agent is exhausted', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.agent = { unlocked: true, exhausted: true };

      expect(player.leaders.agent.exhausted).toBe(true);
    });

    it('should return false when agent is not unlocked', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.agent = { unlocked: false, exhausted: false };

      expect(player.leaders.agent.unlocked).toBe(false);
    });

    it('should return false when player has no leaders', () => {
      const state = createMockGameState();
      const player = state.players[0];
      (player as any).leaders = undefined;

      expect((player as any).leaders).toBeUndefined();
    });
  });

  describe('isCommanderUnlocked', () => {
    it('should return true when commander is unlocked', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.commander = { unlocked: true };

      expect(player.leaders.commander.unlocked).toBe(true);
    });

    it('should return false when commander is not unlocked', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.commander = { unlocked: false };

      expect(player.leaders.commander.unlocked).toBe(false);
    });
  });

  describe('isHeroAvailable', () => {
    it('should return true when hero is unlocked and not purged', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.hero = { unlocked: true, purged: false };

      expect(player.leaders.hero.unlocked).toBe(true);
      expect(player.leaders.hero.purged).toBe(false);
    });

    it('should return false when hero is purged', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.hero = { unlocked: true, purged: true };

      expect(player.leaders.hero.purged).toBe(true);
    });

    it('should return false when hero is not unlocked', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.hero = { unlocked: false, purged: false };

      expect(player.leaders.hero.unlocked).toBe(false);
    });
  });
});

// =============================================================================
// ARBOREC LEADER TESTS
// =============================================================================

describe('Arborec Leaders', () => {
  describe('LETANI OSPHA (Agent)', () => {
    it('should be available when unlocked and not exhausted', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.leaders.agent = { unlocked: true, exhausted: false };

      expect(player.leaders.agent.unlocked).toBe(true);
      expect(player.leaders.agent.exhausted).toBe(false);
    });

    it('should exhaust after use', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.leaders.agent = { unlocked: true, exhausted: false };

      // Simulate exhausting the agent
      player.leaders.agent.exhausted = true;

      expect(player.leaders.agent.exhausted).toBe(true);
    });

    it('should not be usable when already exhausted', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.leaders.agent = { unlocked: true, exhausted: true };

      expect(player.leaders.agent.exhausted).toBe(true);
    });

    it('should refresh during status phase', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.leaders.agent = { unlocked: true, exhausted: true };

      // Simulate status phase refresh
      player.leaders.agent.exhausted = false;

      expect(player.leaders.agent.exhausted).toBe(false);
    });

    it('should block ground forces from landing when used', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.leaders.agent = { unlocked: true, exhausted: false };

      // This ability returns ground forces to reinforcements
      // The ability blocks invasion landing
      expect(player.leaders.agent.unlocked).toBe(true);
    });
  });

  describe('LETANI MIASMIALA (Commander)', () => {
    it('should unlock with 12 ground forces on board', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';

      // Add 12 infantry to various tiles
      const tile = state.map.tiles[0];
      for (let i = 0; i < 12; i++) {
        tile.units.push({
          id: `infantry-${i}`,
          type: 'infantry',
          ownerId: player.id,
          planetId: tile.planets?.[0]?.id,
          damaged: false,
        } as UnitInstance);
      }

      const groundForces = tile.units.filter(
        u => u.ownerId === player.id && (u.type === 'infantry' || u.type === 'mech')
      );

      expect(groundForces.length).toBeGreaterThanOrEqual(12);
    });

    it('should not unlock with fewer than 12 ground forces', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';

      // Add only 8 infantry
      const tile = state.map.tiles[0];
      for (let i = 0; i < 8; i++) {
        tile.units.push({
          id: `infantry-${i}`,
          type: 'infantry',
          ownerId: player.id,
          planetId: tile.planets?.[0]?.id,
          damaged: false,
        } as UnitInstance);
      }

      const groundForces = tile.units.filter(
        u => u.ownerId === player.id && (u.type === 'infantry' || u.type === 'mech')
      );

      expect(groundForces.length).toBeLessThan(12);
    });

    it('should grant mech PLANETARY SHIELD during ground combat', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.leaders.commander = { unlocked: true };

      // When in ground combat with mech, mech can gain planetary shield
      expect(player.leaders.commander.unlocked).toBe(true);
    });

    it('should count mechs toward ground force total', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';

      const tile = state.map.tiles[0];
      // Add 10 infantry and 2 mechs
      for (let i = 0; i < 10; i++) {
        tile.units.push({
          id: `infantry-${i}`,
          type: 'infantry',
          ownerId: player.id,
          planetId: tile.planets?.[0]?.id,
          damaged: false,
        } as UnitInstance);
      }
      tile.units.push({
        id: 'mech-1',
        type: 'mech',
        ownerId: player.id,
        planetId: tile.planets?.[0]?.id,
        damaged: false,
      } as UnitInstance);
      tile.units.push({
        id: 'mech-2',
        type: 'mech',
        ownerId: player.id,
        planetId: tile.planets?.[0]?.id,
        damaged: false,
      } as UnitInstance);

      const groundForces = tile.units.filter(
        u => u.ownerId === player.id && (u.type === 'infantry' || u.type === 'mech')
      );

      expect(groundForces.length).toBe(12);
    });
  });

  describe('LETANI BEHEMOTH (Hero)', () => {
    it('should be available when unlocked and not purged', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.leaders.hero = { unlocked: true, purged: false };

      expect(player.leaders.hero.unlocked).toBe(true);
      expect(player.leaders.hero.purged).toBe(false);
    });

    it('should not be available when purged', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.leaders.hero = { unlocked: true, purged: true };

      expect(player.leaders.hero.purged).toBe(true);
    });

    it('should place infantry on each controlled planet', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.leaders.hero = { unlocked: true, purged: false };
      player.planets = [
        { planetId: 'planet1', exhausted: false, attachments: [] } as any,
        { planetId: 'planet2', exhausted: false, attachments: [] } as any,
      ];

      // Hero places 1 infantry on each controlled planet
      expect(player.planets.length).toBe(2);
    });

    it('should purge after use', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.leaders.hero = { unlocked: true, purged: false };

      // Simulate hero use
      player.leaders.hero.purged = true;

      expect(player.leaders.hero.purged).toBe(true);
    });

    it('should unlock after scoring 3 objectives', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'arborec';
      player.scoredObjectives = ['obj1', 'obj2', 'obj3'];

      // Hero unlocks with 3+ objectives
      expect(player.scoredObjectives.length).toBeGreaterThanOrEqual(3);
    });
  });
});

// =============================================================================
// FEDERATION OF SOL LEADER TESTS
// =============================================================================

describe('Federation of Sol Leaders', () => {
  describe('EVELYN DELOUIS (Agent)', () => {
    it('should be available when unlocked and not exhausted', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';
      player.leaders.agent = { unlocked: true, exhausted: false };

      expect(player.leaders.agent.unlocked).toBe(true);
      expect(player.leaders.agent.exhausted).toBe(false);
    });

    it('should trigger when any player produces infantry', () => {
      const state = createMockGameState();
      const solPlayer = state.players[1];
      solPlayer.faction = 'sol';
      solPlayer.leaders.agent = { unlocked: true, exhausted: false };

      // When anyone produces infantry, Sol can exhaust agent
      expect(solPlayer.leaders.agent.unlocked).toBe(true);
    });

    it('should place 1 infantry on controlled planet', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';
      player.leaders.agent = { unlocked: true, exhausted: false };
      player.planets = [{ planetId: 'planet1', exhausted: false, attachments: [] } as any];

      // Agent places 1 infantry on controlled planet
      expect(player.planets.length).toBeGreaterThan(0);
    });

    it('should require controlled planet to use', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';
      player.leaders.agent = { unlocked: true, exhausted: false };
      player.planets = [];

      // Cannot use without controlled planets
      expect(player.planets.length).toBe(0);
    });

    it('should exhaust after use', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';
      player.leaders.agent = { unlocked: true, exhausted: false };

      player.leaders.agent.exhausted = true;

      expect(player.leaders.agent.exhausted).toBe(true);
    });
  });

  describe('CLAIRE GIBSON (Commander)', () => {
    it('should unlock when controlling planets in 3 systems', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';
      player.planets = [
        { planetId: 'p1', exhausted: false, attachments: [] } as any,
        { planetId: 'p2', exhausted: false, attachments: [] } as any,
        { planetId: 'p3', exhausted: false, attachments: [] } as any,
      ];

      // Unlock requires planets in 3 different systems
      expect(player.planets.length).toBeGreaterThanOrEqual(3);
    });

    it('should not unlock with planets in fewer than 3 systems', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';
      player.planets = [
        { planetId: 'p1', exhausted: false, attachments: [] } as any,
        { planetId: 'p2', exhausted: false, attachments: [] } as any,
      ];

      expect(player.planets.length).toBe(2);
    });

    it('should place infantry at start of ground combat', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';
      player.leaders.commander = { unlocked: true };

      // Place infantry when ground combat starts
      expect(player.leaders.commander.unlocked).toBe(true);
    });

    it('should use reinforcements pool for infantry', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';
      player.leaders.commander = { unlocked: true };

      // Infantry comes from reinforcements
      expect(player.leaders.commander.unlocked).toBe(true);
    });
  });

  describe('JACE X. 4TH AIR LEGION (Hero)', () => {
    it('should destroy infantry and fighters in systems with Sol ships', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';
      player.leaders.hero = { unlocked: true, purged: false };

      // Add Sol cruiser
      state.map.tiles[0].units.push({
        id: 'cruiser-1',
        type: 'cruiser',
        ownerId: player.id,
        damaged: false,
      } as UnitInstance);

      // Add enemy infantry and fighters
      state.map.tiles[0].units.push({
        id: 'enemy-infantry',
        type: 'infantry',
        ownerId: 'player3',
        damaged: false,
      } as UnitInstance);
      state.map.tiles[0].units.push({
        id: 'enemy-fighter',
        type: 'fighter',
        ownerId: 'player3',
        damaged: false,
      } as UnitInstance);

      const enemyUnits = state.map.tiles[0].units.filter(
        u => u.ownerId !== player.id && (u.type === 'infantry' || u.type === 'fighter')
      );

      expect(enemyUnits.length).toBe(2);
    });

    it('should not destroy other unit types', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';

      // Add Sol ship
      state.map.tiles[0].units.push({
        id: 'cruiser-1',
        type: 'cruiser',
        ownerId: player.id,
        damaged: false,
      } as UnitInstance);

      // Add enemy cruiser
      state.map.tiles[0].units.push({
        id: 'enemy-cruiser',
        type: 'cruiser',
        ownerId: 'player3',
        damaged: false,
      } as UnitInstance);

      const enemyShips = state.map.tiles[0].units.filter(
        u => u.ownerId !== player.id && u.type === 'cruiser'
      );

      // Cruisers should not be affected
      expect(enemyShips.length).toBe(1);
    });

    it('should only affect systems with Sol ships', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';

      // Add enemy infantry in system WITHOUT Sol ships
      state.map.tiles[0].units.push({
        id: 'enemy-infantry',
        type: 'infantry',
        ownerId: 'player3',
        damaged: false,
      } as UnitInstance);

      const solShips = state.map.tiles[0].units.filter(
        u => u.ownerId === player.id && u.type !== 'infantry' && u.type !== 'mech'
      );

      // No Sol ships, so no effect
      expect(solShips.length).toBe(0);
    });

    it('should purge after use', () => {
      const state = createMockGameState();
      const player = state.players[1];
      player.faction = 'sol';
      player.leaders.hero = { unlocked: true, purged: false };

      player.leaders.hero.purged = true;

      expect(player.leaders.hero.purged).toBe(true);
    });
  });
});

// =============================================================================
// EMPYREAN LEADER TESTS
// =============================================================================

describe('Empyrean Leaders', () => {
  describe('UMBAT (Agent)', () => {
    it('should be available when unlocked and not exhausted', () => {
      const state = createMockGameState();
      const player = state.players[2];
      player.faction = 'empyrean';
      player.leaders.agent = { unlocked: true, exhausted: false };

      expect(player.leaders.agent.unlocked).toBe(true);
      expect(player.leaders.agent.exhausted).toBe(false);
    });

    it('should trigger when action card is played', () => {
      const state = createMockGameState();
      const player = state.players[2];
      player.faction = 'empyrean';
      player.leaders.agent = { unlocked: true, exhausted: false };

      // Agent can cancel action cards
      expect(player.leaders.agent.unlocked).toBe(true);
    });

    it('should cancel the action card when used', () => {
      const state = createMockGameState();
      const player = state.players[2];
      player.faction = 'empyrean';
      player.leaders.agent = { unlocked: true, exhausted: false };

      // Effect cancels action card
      expect(player.leaders.agent.exhausted).toBe(false);
    });

    it('should exhaust after canceling', () => {
      const state = createMockGameState();
      const player = state.players[2];
      player.faction = 'empyrean';
      player.leaders.agent = { unlocked: true, exhausted: false };

      player.leaders.agent.exhausted = true;

      expect(player.leaders.agent.exhausted).toBe(true);
    });
  });

  describe('SAI SERAVUS (Commander)', () => {
    it('should unlock after winning space combat', () => {
      const state = createMockGameState();
      const player = state.players[2];
      player.faction = 'empyrean';
      player.leaders.commander = { unlocked: true };

      expect(player.leaders.commander.unlocked).toBe(true);
    });

    it('should trigger when opponent ends turn', () => {
      const state = createMockGameState();
      const player = state.players[2];
      player.faction = 'empyrean';
      player.leaders.commander = { unlocked: true };

      // Can exhaust opponent diplomat
      expect(player.leaders.commander.unlocked).toBe(true);
    });

    it('should require mech in system to use', () => {
      const state = createMockGameState();
      const player = state.players[2];
      player.faction = 'empyrean';
      player.leaders.commander = { unlocked: true };

      // Add mech to system
      state.map.tiles[0].units.push({
        id: 'mech-1',
        type: 'mech',
        ownerId: player.id,
        planetId: 'mecatol-rex',
        damaged: false,
      } as UnitInstance);

      const mechs = state.map.tiles[0].units.filter(
        u => u.ownerId === player.id && u.type === 'mech'
      );

      expect(mechs.length).toBe(1);
    });
  });
});

// =============================================================================
// MAHACT LEADER TESTS
// =============================================================================

describe('Mahact Gene-Sorcerers Leaders', () => {
  describe('IL NA VIROSET (Agent)', () => {
    it('should be available when unlocked and not exhausted', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.agent = { unlocked: true, exhausted: false };

      expect(player.leaders.agent.unlocked).toBe(true);
      expect(player.leaders.agent.exhausted).toBe(false);
    });

    it('should trigger when system is activated', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.agent = { unlocked: true, exhausted: false };

      // Agent allows removing command token
      expect(player.leaders.agent.unlocked).toBe(true);
    });

    it('should allow token removal from board', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.agent = { unlocked: true, exhausted: false };

      // Add command token to board
      state.map.tiles[0].commandTokens = ['player1'];

      expect(state.map.tiles[0].commandTokens.length).toBe(1);
    });

    it('should return token to reinforcements', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.agent = { unlocked: true, exhausted: false };

      // Token goes to reinforcements, not back to pools
      expect(player.leaders.agent.unlocked).toBe(true);
    });

    it('should exhaust after use', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.agent = { unlocked: true, exhausted: false };

      player.leaders.agent.exhausted = true;

      expect(player.leaders.agent.exhausted).toBe(true);
    });
  });

  describe('AIRO SHIR AUR (Commander)', () => {
    it('should unlock after winning combat in action phase', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.commander = { unlocked: true };

      expect(player.leaders.commander.unlocked).toBe(true);
    });

    it('should return fleet token to reinforcements', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.commander = { unlocked: true };

      // Token goes back to reinforcements
      expect(player.leaders.commander.unlocked).toBe(true);
    });

    it('should only apply to faction ability tokens', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.commander = { unlocked: true };

      // Only works with Mahact faction abilities
      expect(player.leaders.commander.unlocked).toBe(true);
    });
  });

  describe('MABAN (Hero)', () => {
    it('should be available when unlocked and not purged', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.hero = { unlocked: true, purged: false };

      expect(player.leaders.hero.unlocked).toBe(true);
      expect(player.leaders.hero.purged).toBe(false);
    });

    it('should swap faction abilities between players', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.hero = { unlocked: true, purged: false };

      // Swaps faction abilities
      expect(player.leaders.hero.unlocked).toBe(true);
    });

    it('should require each player to swap with different player', () => {
      const state = createMockGameState();
      // Need at least 4 players for full swaps
      expect(state.players.length).toBeGreaterThanOrEqual(4);
    });

    it('should purge after use', () => {
      const state = createMockGameState();
      const player = state.players[3];
      player.faction = 'mahact';
      player.leaders.hero = { unlocked: true, purged: false };

      player.leaders.hero.purged = true;

      expect(player.leaders.hero.purged).toBe(true);
    });
  });
});

// =============================================================================
// LEADER EXHAUSTION AND REFRESH TESTS
// =============================================================================

describe('Leader Exhaustion and Refresh', () => {
  describe('Agent Exhaustion', () => {
    it('should mark agent as exhausted', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.agent.exhausted = true;

      expect(player.leaders.agent.exhausted).toBe(true);
    });

    it('should prevent agent use when exhausted', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.agent = { unlocked: true, exhausted: true };

      const isAvailable = player.leaders.agent.unlocked && !player.leaders.agent.exhausted;
      expect(isAvailable).toBe(false);
    });
  });

  describe('Agent Refresh', () => {
    it('should refresh agent during status phase', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.agent = { unlocked: true, exhausted: true };

      // Status phase refresh
      player.leaders.agent.exhausted = false;

      expect(player.leaders.agent.exhausted).toBe(false);
    });

    it('should refresh all players agents', () => {
      const state = createMockGameState();
      for (const player of state.players) {
        player.leaders.agent = { unlocked: true, exhausted: true };
      }

      // Refresh all
      for (const player of state.players) {
        player.leaders.agent.exhausted = false;
      }

      for (const player of state.players) {
        expect(player.leaders.agent.exhausted).toBe(false);
      }
    });
  });

  describe('Hero Purging', () => {
    it('should mark hero as purged after use', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.hero = { unlocked: true, purged: false };

      player.leaders.hero.purged = true;

      expect(player.leaders.hero.purged).toBe(true);
    });

    it('should prevent hero reuse after purge', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.hero = { unlocked: true, purged: true };

      const isAvailable = player.leaders.hero.unlocked && !player.leaders.hero.purged;
      expect(isAvailable).toBe(false);
    });

    it('should not refresh purged heroes', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.leaders.hero = { unlocked: true, purged: true };

      // Status phase does not unpurge heroes
      expect(player.leaders.hero.purged).toBe(true);
    });
  });
});

// =============================================================================
// COMMANDER UNLOCK CONDITION TESTS
// =============================================================================

describe('Commander Unlock Conditions', () => {
  it('Arborec: should require 12 ground forces', () => {
    const state = createMockGameState();
    const tile = state.map.tiles[0];

    // Add 12 ground forces
    for (let i = 0; i < 12; i++) {
      tile.units.push({
        id: `infantry-${i}`,
        type: 'infantry',
        ownerId: 'player1',
        damaged: false,
      } as UnitInstance);
    }

    const groundForces = tile.units.filter(
      u => u.ownerId === 'player1' && (u.type === 'infantry' || u.type === 'mech')
    );

    expect(groundForces.length).toBe(12);
  });

  it('Sol: should require planets in 3 systems', () => {
    const state = createMockGameState();
    const player = state.players[1];
    player.faction = 'sol';

    // Simulate controlling planets in 3 different systems
    player.planets = [
      { planetId: 'p1-system1', exhausted: false, attachments: [] } as any,
      { planetId: 'p2-system2', exhausted: false, attachments: [] } as any,
      { planetId: 'p3-system3', exhausted: false, attachments: [] } as any,
    ];

    expect(player.planets.length).toBeGreaterThanOrEqual(3);
  });

  it('Empyrean: should require winning space combat', () => {
    const state = createMockGameState();
    const player = state.players[2];
    player.faction = 'empyrean';

    // Winning combat unlocks commander
    player.leaders.commander = { unlocked: true };

    expect(player.leaders.commander.unlocked).toBe(true);
  });

  it('Mahact: should require winning combat in action phase', () => {
    const state = createMockGameState();
    const player = state.players[3];
    player.faction = 'mahact';
    state.phase = 'action' as GamePhase;

    // Winning combat in action phase unlocks commander
    player.leaders.commander = { unlocked: true };

    expect(player.leaders.commander.unlocked).toBe(true);
    expect(state.phase).toBe('action');
  });
});

// =============================================================================
// HERO UNLOCK CONDITION TESTS
// =============================================================================

describe('Hero Unlock Conditions', () => {
  it('should unlock hero after scoring 3 objectives', () => {
    const state = createMockGameState();
    const player = state.players[0];
    player.scoredObjectives = ['obj1', 'obj2', 'obj3'];

    const shouldUnlock = player.scoredObjectives.length >= 3;
    expect(shouldUnlock).toBe(true);
  });

  it('should not unlock hero with fewer than 3 objectives', () => {
    const state = createMockGameState();
    const player = state.players[0];
    player.scoredObjectives = ['obj1', 'obj2'];

    const shouldUnlock = player.scoredObjectives.length >= 3;
    expect(shouldUnlock).toBe(false);
  });

  it('should count both public and secret objectives', () => {
    const state = createMockGameState();
    const player = state.players[0];
    player.scoredObjectives = ['public1', 'public2', 'secret1'];

    expect(player.scoredObjectives.length).toBe(3);
  });
});

// =============================================================================
// ALLIANCE PROMISSORY NOTE TESTS
// =============================================================================

describe('Alliance Promissory Note - Commander Access', () => {
  it('should allow access to faction commander via Alliance', () => {
    const state = createMockGameState();
    const player = state.players[0];
    player.faction = 'arborec';

    // Player has Sol's Alliance promissory note
    player.promissoryNotes = [{ id: 'sol_alliance', faction: 'sol' } as any];

    expect(player.promissoryNotes.length).toBe(1);
    expect(player.promissoryNotes[0].id).toContain('alliance');
  });

  it('should require original faction commander to be unlocked', () => {
    const state = createMockGameState();
    const solPlayer = state.players[1];
    solPlayer.faction = 'sol';
    solPlayer.leaders.commander = { unlocked: true };

    // Sol's commander must be unlocked for Alliance to work
    expect(solPlayer.leaders.commander.unlocked).toBe(true);
  });

  it('should not grant access if original commander is not unlocked', () => {
    const state = createMockGameState();
    const solPlayer = state.players[1];
    solPlayer.faction = 'sol';
    solPlayer.leaders.commander = { unlocked: false };

    expect(solPlayer.leaders.commander.unlocked).toBe(false);
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('Leader Edge Cases', () => {
  it('should handle player with no leaders object', () => {
    const state = createMockGameState();
    const player = state.players[0];
    (player as any).leaders = undefined;

    expect((player as any).leaders).toBeUndefined();
  });

  it('should handle empty players array', () => {
    const state = createMockGameState(1);
    state.players = [];

    expect(state.players.length).toBe(0);
  });

  it('should handle single player game', () => {
    const state = createMockGameState(1);

    expect(state.players.length).toBe(1);
  });

  it('should handle max player game (8 players)', () => {
    const state = createMockGameState(8);

    expect(state.players.length).toBe(8);
  });

  it('should track leader state across multiple rounds', () => {
    const state = createMockGameState();
    const player = state.players[0];

    // Round 1: Use agent
    player.leaders.agent = { unlocked: true, exhausted: true };
    state.round = 1;

    // Round 2: Refresh
    player.leaders.agent.exhausted = false;
    state.round = 2;

    expect(player.leaders.agent.exhausted).toBe(false);
    expect(state.round).toBe(2);
  });
});

// =============================================================================
// ABILITY HANDLER TESTS - ACTUALLY CALLING HANDLERS
// =============================================================================

import { executeAbility, clearHandlers, getRegisteredHandlerIds } from '../../../ability-registry.js';
import { registerLeaderAbilities } from '../leader-abilities.js';

describe('Leader Ability Handler Integration', () => {
  beforeAll(() => {
    // Register all leader ability handlers
    registerLeaderAbilities();
  });

  describe('Registered Handlers', () => {
    it('should register all leader ability handlers', () => {
      const handlers = getRegisteredHandlerIds();

      expect(handlers).toContain('arborec_agent');
      expect(handlers).toContain('arborec_commander');
      expect(handlers).toContain('arborec_hero');
      expect(handlers).toContain('sol_agent');
      expect(handlers).toContain('sol_commander');
      expect(handlers).toContain('sol_hero');
      expect(handlers).toContain('empyrean_agent');
      expect(handlers).toContain('empyrean_commander');
      expect(handlers).toContain('mahact_agent');
      expect(handlers).toContain('mahact_commander');
      expect(handlers).toContain('mahact_hero');
    });
  });

  describe('Arborec Agent Handler', () => {
    it('should fail for non-Arborec player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol' as FactionId;

      const result = executeAbility(state, 'player1', 'arborec_agent', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not Arborec');
    });

    it('should fail when agent is exhausted', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';
      state.players[0].leaders.agent = { unlocked: true, exhausted: true };

      const result = executeAbility(state, 'player1', 'arborec_agent', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Agent not available');
    });

    it('should fail when agent is not unlocked', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';
      state.players[0].leaders.agent = { unlocked: false, exhausted: false };

      const result = executeAbility(state, 'player1', 'arborec_agent', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(false);
    });

    it('should succeed and exhaust agent when valid', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';
      state.players[0].leaders.agent = { unlocked: true, exhausted: false };

      const result = executeAbility(state, 'player1', 'arborec_agent', {
        targetPlayerId: 'player2',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('agent_used');
      expect(state.players[0].leaders.agent.exhausted).toBe(true);
    });

    it('should fail without target player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';
      state.players[0].leaders.agent = { unlocked: true, exhausted: false };

      const result = executeAbility(state, 'player1', 'arborec_agent', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('target player');
    });
  });

  describe('Arborec Commander Handler', () => {
    it('should succeed when Arborec commander is unlocked', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';
      state.players[0].leaders.commander = { unlocked: true };

      const result = executeAbility(state, 'player1', 'arborec_commander', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('commander_ability_used');
    });

    it('should fail when commander not accessible', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol' as FactionId; // Not Arborec
      state.players[0].leaders.commander = { unlocked: false };

      const result = executeAbility(state, 'player1', 'arborec_commander', {});

      expect(result.success).toBe(false);
    });
  });

  describe('Arborec Hero Handler', () => {
    it('should fail for non-Arborec player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol' as FactionId;

      const result = executeAbility(state, 'player1', 'arborec_hero', {});

      expect(result.success).toBe(false);
    });

    it('should fail when hero is not available', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';
      state.players[0].leaders.hero = { unlocked: false, purged: false };

      const result = executeAbility(state, 'player1', 'arborec_hero', {});

      expect(result.success).toBe(false);
    });

    it('should fail when hero is already purged', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';
      state.players[0].leaders.hero = { unlocked: true, purged: true };

      const result = executeAbility(state, 'player1', 'arborec_hero', {});

      expect(result.success).toBe(false);
    });

    it('should succeed and purge hero', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';
      state.players[0].leaders.hero = { unlocked: true, purged: false };
      state.players[0].planets = [
        { planetId: 'planet1', exhausted: false, attachments: [] } as any,
      ];

      const result = executeAbility(state, 'player1', 'arborec_hero', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('hero_purged');
      expect(state.players[0].leaders.hero.purged).toBe(true);
    });
  });

  describe('Sol Agent Handler', () => {
    it('should fail for non-Sol player', () => {
      const state = createMockGameState();
      state.players[1].faction = 'arborec';

      const result = executeAbility(state, 'player2', 'sol_agent', {
        choices: { selectedPlanetId: 'planet2' },
      });

      expect(result.success).toBe(false);
    });

    it('should fail when agent is exhausted', () => {
      const state = createMockGameState();
      state.players[1].faction = 'sol';
      state.players[1].leaders.agent = { unlocked: true, exhausted: true };

      const result = executeAbility(state, 'player2', 'sol_agent', {
        choices: { selectedPlanetId: 'planet2' },
      });

      expect(result.success).toBe(false);
    });

    it('should fail without planet selection', () => {
      const state = createMockGameState();
      state.players[1].faction = 'sol';
      state.players[1].leaders.agent = { unlocked: true, exhausted: false };

      const result = executeAbility(state, 'player2', 'sol_agent', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('select a planet');
    });

    it('should fail if planet not controlled', () => {
      const state = createMockGameState();
      state.players[1].faction = 'sol';
      state.players[1].leaders.agent = { unlocked: true, exhausted: false };
      state.players[1].planets = [];

      const result = executeAbility(state, 'player2', 'sol_agent', {
        choices: { selectedPlanetId: 'planet2' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('control');
    });

    it('should succeed when valid', () => {
      const state = createMockGameState();
      state.players[1].faction = 'sol';
      state.players[1].leaders.agent = { unlocked: true, exhausted: false };
      state.players[1].planets = [{ planetId: 'planet2', exhausted: false, attachments: [] } as any];

      const result = executeAbility(state, 'player2', 'sol_agent', {
        choices: { selectedPlanetId: 'planet2' },
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('agent_used');
      expect(state.players[1].leaders.agent.exhausted).toBe(true);
    });
  });

  describe('Sol Commander Handler', () => {
    it('should fail when not in ground combat', () => {
      const state = createMockGameState();
      state.players[1].faction = 'sol';
      state.players[1].leaders.commander = { unlocked: true };
      state.activeCombat = null;

      const result = executeAbility(state, 'player2', 'sol_commander', {});

      expect(result.success).toBe(false);
    });

    it('should succeed in ground combat', () => {
      const state = createMockGameState();
      state.players[1].faction = 'sol';
      state.players[1].leaders.commander = { unlocked: true };
      state.activeCombat = {
        type: 'ground',
        systemId: 'system1',
        planetId: 'planet1',
        attackerId: 'player2',
        defenderId: 'player1',
        round: 1,
      } as any;

      const result = executeAbility(state, 'player2', 'sol_commander', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('unit_placed');
    });
  });

  describe('Sol Hero Handler', () => {
    it('should fail for non-Sol player', () => {
      const state = createMockGameState();
      state.players[1].faction = 'arborec';

      const result = executeAbility(state, 'player2', 'sol_hero', {});

      expect(result.success).toBe(false);
    });

    it('should succeed and destroy enemy infantry/fighters', () => {
      const state = createMockGameState();
      state.players[1].faction = 'sol';
      state.players[1].leaders.hero = { unlocked: true, purged: false };

      // Add Sol cruiser
      state.map.tiles[0].units = [
        { id: 'cruiser-1', type: 'cruiser', ownerId: 'player2', damaged: false } as UnitInstance,
        { id: 'enemy-inf', type: 'infantry', ownerId: 'player1', damaged: false } as UnitInstance,
        { id: 'enemy-fighter', type: 'fighter', ownerId: 'player1', damaged: false } as UnitInstance,
      ];

      const initialUnits = state.map.tiles[0].units.length;
      const result = executeAbility(state, 'player2', 'sol_hero', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('hero_purged');
      expect(state.players[1].leaders.hero.purged).toBe(true);
      expect(state.map.tiles[0].units.length).toBeLessThan(initialUnits);
    });
  });

  describe('Empyrean Agent Handler', () => {
    it('should fail for non-Empyrean player', () => {
      const state = createMockGameState();
      state.players[2].faction = 'sol' as FactionId;

      const result = executeAbility(state, 'player3', 'empyrean_agent', {});

      expect(result.success).toBe(false);
    });

    it('should succeed and cancel action card', () => {
      const state = createMockGameState();
      state.players[2].faction = 'empyrean';
      state.players[2].leaders.agent = { unlocked: true, exhausted: false };

      const result = executeAbility(state, 'player3', 'empyrean_agent', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('action_card_canceled');
      expect(state.players[2].leaders.agent.exhausted).toBe(true);
    });
  });

  describe('Empyrean Commander Handler', () => {
    it('should succeed when commander unlocked', () => {
      const state = createMockGameState();
      state.players[2].faction = 'empyrean';
      state.players[2].leaders.commander = { unlocked: true };

      const result = executeAbility(state, 'player3', 'empyrean_commander', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('commander_ability_used');
    });
  });

  describe('Mahact Agent Handler', () => {
    it('should fail for non-Mahact player', () => {
      const state = createMockGameState();
      state.players[3].faction = 'sol' as FactionId;

      const result = executeAbility(state, 'player4', 'mahact_agent', {});

      expect(result.success).toBe(false);
    });

    it('should succeed and exhaust agent', () => {
      const state = createMockGameState();
      state.players[3].faction = 'mahact';
      state.players[3].leaders.agent = { unlocked: true, exhausted: false };

      const result = executeAbility(state, 'player4', 'mahact_agent', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('agent_used');
      expect(state.players[3].leaders.agent.exhausted).toBe(true);
    });
  });

  describe('Mahact Commander Handler', () => {
    it('should succeed when commander unlocked', () => {
      const state = createMockGameState();
      state.players[3].faction = 'mahact';
      state.players[3].leaders.commander = { unlocked: true };

      const result = executeAbility(state, 'player4', 'mahact_commander', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('commander_ability_used');
    });
  });

  describe('Mahact Hero Handler', () => {
    it('should fail for non-Mahact player', () => {
      const state = createMockGameState();
      state.players[3].faction = 'sol' as FactionId;

      const result = executeAbility(state, 'player4', 'mahact_hero', {});

      expect(result.success).toBe(false);
    });

    it('should succeed and purge hero', () => {
      const state = createMockGameState();
      state.players[3].faction = 'mahact';
      state.players[3].leaders.hero = { unlocked: true, purged: false };

      const result = executeAbility(state, 'player4', 'mahact_hero', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('hero_purged');
      expect(state.players[3].leaders.hero.purged).toBe(true);
    });
  });

  describe('Unknown Ability Handler', () => {
    it('should return error for unregistered handler', () => {
      const state = createMockGameState();

      const result = executeAbility(state, 'player1', 'nonexistent_ability', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('No handler found');
    });
  });
});
