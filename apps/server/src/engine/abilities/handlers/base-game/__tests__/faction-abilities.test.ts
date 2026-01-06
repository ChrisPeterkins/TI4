import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GameState, PlayerState, MapTile, PlanetInstance, UnitInstance, HexCoord, CombatState } from '@ti4/shared';
import type { AbilityContext, AbilityResult } from '../../../ability-types.js';
import { getAbilityHandler } from '../../../ability-registry.js';
import { registerBaseGameFactionAbilities } from '../faction-abilities.js';

// Register handlers before tests
registerBaseGameFactionAbilities();

// =============================================================================
// Mock Factory Functions
// =============================================================================

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

function createMockTile(position: HexCoord, systemId: number, planets: Partial<PlanetInstance>[] = []): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId,
    position,
    rotation: 0,
    planets: planets.map((p) => ({
      planetId: p.planetId || `planet-${position.q}-${position.r}`,
      id: p.planetId || `planet-${position.q}-${position.r}`,
      controlledBy: p.controlledBy || null,
      exhausted: p.exhausted || false,
      attachments: p.attachments || [],
      units: p.units || [],
    })) as PlanetInstance[],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
  } as MapTile;
}

function createMockGameState(playerCount: number = 4): GameState {
  const players: PlayerState[] = [];
  const factions = ['sol', 'hacan', 'mentak', 'l1z1x', 'arborec', 'naalu'];
  for (let i = 0; i < playerCount; i++) {
    players.push(
      createMockPlayer(`player${i + 1}`, {
        name: `Player ${i + 1}`,
        seatIndex: i,
        faction: factions[i % factions.length] as any,
        color: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'][i] as any,
      })
    );
  }

  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: players.map((p) => p.id),
    players,
    map: {
      tiles: [
        createMockTile({ q: 0, r: 0 }, 18), // Mecatol Rex
        createMockTile({ q: 1, r: 0 }, 19),
        createMockTile({ q: 0, r: 1 }, 20),
        createMockTile({ q: -1, r: 1 }, 21),
      ],
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
    actionCardDeck: ['sabotage', 'direct_hit', 'flank_speed'],
    actionCardDiscard: [],
    agendaDeck: ['arms_reduction', 'anti_intellectual_revolution'],
    agendaDiscard: [],
    laws: [],
    custodiansTaken: false,
    activeCombat: null,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    gameLog: [],
  };
}

// =============================================================================
// ARBOREC Tests
// =============================================================================

describe('Arborec Faction Abilities', () => {
  describe('MITOSIS', () => {
    it('should fail if player is not Arborec', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('arborec_mitosis');
      expect(handler).toBeDefined();

      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Arborec player');
    });

    it('should fail without planet selection', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';

      const handler = getAbilityHandler('arborec_mitosis');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must select a planet with your infantry');
    });

    it('should fail if planet has no infantry', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';

      // Add a planet without infantry
      state.map.tiles[0].planets.push({
        id: 'test_planet',
        planetId: 'test_planet',
        controlledBy: 'player1',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      const handler = getAbilityHandler('arborec_mitosis');
      const result = handler!(state, 'player1', {
        choices: { selectedPlanetId: 'test_planet' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Selected planet must have your infantry');
    });

    it('should place infantry on planet with existing infantry', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';

      // Add a planet with infantry
      state.map.tiles[0].planets.push({
        id: 'test_planet',
        planetId: 'test_planet',
        controlledBy: 'player1',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      // Add infantry unit to the tile
      state.map.tiles[0].units.push({
        id: 'infantry-1',
        type: 'infantry',
        ownerId: 'player1',
        planetId: 'test_planet',
        damaged: false,
      });

      const handler = getAbilityHandler('arborec_mitosis');
      const result = handler!(state, 'player1', {
        choices: { selectedPlanetId: 'test_planet' },
      });

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('unit_placed');
      expect(result.data?.unitType).toBe('infantry');

      // Check infantry was placed
      const infantryCount = state.map.tiles[0].units.filter(
        (u) => u.type === 'infantry' && u.planetId === 'test_planet'
      ).length;
      expect(infantryCount).toBe(2);
    });

    it('should replace infantry with mech when using Letani Behemoth enhancement', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';

      state.map.tiles[0].planets.push({
        id: 'test_planet',
        planetId: 'test_planet',
        controlledBy: 'player1',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      state.map.tiles[0].units.push({
        id: 'infantry-1',
        type: 'infantry',
        ownerId: 'player1',
        planetId: 'test_planet',
        damaged: false,
      });

      const handler = getAbilityHandler('arborec_mitosis');
      const result = handler!(state, 'player1', {
        choices: { selectedPlanetId: 'test_planet', selectedUnitType: 'mech' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.unitType).toBe('mech');
      expect(result.data?.replacedInfantry).toBe(true);

      const mechCount = state.map.tiles[0].units.filter(
        (u) => u.type === 'mech' && u.planetId === 'test_planet'
      ).length;
      expect(mechCount).toBe(1);
    });

    it('should fail to place mech if at max limit (4)', () => {
      const state = createMockGameState();
      state.players[0].faction = 'arborec';

      state.map.tiles[0].planets.push({
        id: 'test_planet',
        planetId: 'test_planet',
        controlledBy: 'player1',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      // Add infantry to trigger on
      state.map.tiles[0].units.push({
        id: 'infantry-1',
        type: 'infantry',
        ownerId: 'player1',
        planetId: 'test_planet',
        damaged: false,
      });

      // Add 4 mechs (max limit)
      for (let i = 0; i < 4; i++) {
        state.map.tiles[0].units.push({
          id: `mech-${i}`,
          type: 'mech',
          ownerId: 'player1',
          planetId: 'test_planet',
          damaged: false,
        });
      }

      const handler = getAbilityHandler('arborec_mitosis');
      const result = handler!(state, 'player1', {
        choices: { selectedPlanetId: 'test_planet', selectedUnitType: 'mech' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Maximum mech limit reached (4)');
    });
  });
});

// =============================================================================
// MENTAK COALITION Tests
// =============================================================================

describe('Mentak Coalition Faction Abilities', () => {
  describe('AMBUSH', () => {
    it('should fail if player is not Mentak', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('mentak_ambush');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Mentak player');
    });

    it('should fail if not in space combat', () => {
      const state = createMockGameState();
      state.players[0].faction = 'mentak';

      const handler = getAbilityHandler('mentak_ambush');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in space combat');
    });

    it('should fail with ground combat', () => {
      const state = createMockGameState();
      state.players[0].faction = 'mentak';
      state.activeCombat = {
        id: 'combat-1',
        type: 'ground',
        systemId: 'tile-0-0',
        attackerId: 'player1',
        defenderId: 'player2',
      } as CombatState;

      const handler = getAbilityHandler('mentak_ambush');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in space combat');
    });

    it('should fail if no cruisers or destroyers in combat', () => {
      const state = createMockGameState();
      state.players[0].faction = 'mentak';
      state.activeCombat = {
        id: 'combat-1',
        type: 'space',
        systemId: 'tile-0-0',
        attackerId: 'player1',
        defenderId: 'player2',
      } as CombatState;

      // No cruisers or destroyers
      state.map.tiles[0].units = [
        { id: 'carrier-1', type: 'carrier', ownerId: 'player1', damaged: false },
      ];

      const handler = getAbilityHandler('mentak_ambush');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('No cruisers or destroyers for ambush');
    });

    it('should roll for up to 2 cruisers/destroyers', () => {
      const state = createMockGameState();
      state.players[0].faction = 'mentak';
      state.activeCombat = {
        id: 'combat-1',
        type: 'space',
        systemId: 'tile-0-0',
        attackerId: 'player1',
        defenderId: 'player2',
      } as CombatState;

      state.map.tiles[0].units = [
        { id: 'cruiser-1', type: 'cruiser', ownerId: 'player1', damaged: false },
        { id: 'cruiser-2', type: 'cruiser', ownerId: 'player1', damaged: false },
        { id: 'destroyer-1', type: 'destroyer', ownerId: 'player1', damaged: false },
      ];

      const handler = getAbilityHandler('mentak_ambush');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('ambush_rolled');
      expect(result.data?.unitsUsed).toBe(2);
      expect((result.data?.rolls as number[]).length).toBe(2);
    });
  });

  describe('PILLAGE', () => {
    it('should fail if player is not Mentak', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('mentak_pillage');
      const result = handler!(state, 'player1', { targetPlayerId: 'player2' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Mentak player');
    });

    it('should fail without target player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'mentak';

      const handler = getAbilityHandler('mentak_pillage');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('No target player specified');
    });

    it('should fail if target is not a neighbor', () => {
      const state = createMockGameState();
      state.players[0].faction = 'mentak';
      state.players[0].neighbors = ['player3']; // player2 is not a neighbor

      const handler = getAbilityHandler('mentak_pillage');
      const result = handler!(state, 'player1', { targetPlayerId: 'player2' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target is not a neighbor');
    });

    it('should fail if target has Promise of Protection', () => {
      const state = createMockGameState();
      state.players[0].faction = 'mentak';
      state.players[0].neighbors = ['player2'];
      state.players[1].tradeGoods = 3;
      state.players[1].promissoryNotesInPlay = [
        { noteId: 'promise_of_protection', originalOwnerId: 'player1', receivedFrom: 'player1' },
      ] as any;

      const handler = getAbilityHandler('mentak_pillage');
      const result = handler!(state, 'player1', { targetPlayerId: 'player2' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target has Promise of Protection - cannot Pillage');
    });

    it('should fail if target has no trade goods', () => {
      const state = createMockGameState();
      state.players[0].faction = 'mentak';
      state.players[0].neighbors = ['player2'];
      state.players[1].tradeGoods = 0;

      const handler = getAbilityHandler('mentak_pillage');
      const result = handler!(state, 'player1', { targetPlayerId: 'player2' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target has no trade goods');
    });

    it('should steal 1 trade good from neighbor', () => {
      const state = createMockGameState();
      state.players[0].faction = 'mentak';
      state.players[0].neighbors = ['player2'];
      state.players[0].tradeGoods = 2;
      state.players[1].tradeGoods = 4;

      const handler = getAbilityHandler('mentak_pillage');
      const result = handler!(state, 'player1', { targetPlayerId: 'player2' });

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('pillage_triggered');
      expect(state.players[0].tradeGoods).toBe(3);
      expect(state.players[1].tradeGoods).toBe(3);
    });
  });
});

// =============================================================================
// FEDERATION OF SOL Tests
// =============================================================================

describe('Federation of Sol Faction Abilities', () => {
  describe('ORBITAL DROP', () => {
    it('should fail if player is not Sol', () => {
      const state = createMockGameState();
      state.players[0].faction = 'hacan';

      const handler = getAbilityHandler('sol_orbital_drop');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Sol player');
    });

    it('should fail without tactics tokens', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';
      state.players[0].commandTokens.tactics = 0;

      const handler = getAbilityHandler('sol_orbital_drop');
      const result = handler!(state, 'player1', {
        choices: { selectedPlanetId: 'test_planet' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No tactics tokens available');
    });

    it('should fail without planet selection', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('sol_orbital_drop');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must select a planet you control');
    });

    it('should fail if player does not control the planet', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';
      state.players[0].planets = []; // No planets controlled

      state.map.tiles[0].planets.push({
        id: 'test_planet',
        planetId: 'test_planet',
        controlledBy: 'player2',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      const handler = getAbilityHandler('sol_orbital_drop');
      const result = handler!(state, 'player1', {
        choices: { selectedPlanetId: 'test_planet' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not control this planet');
    });

    it('should spend token and place 2 infantry', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';
      state.players[0].commandTokens.tactics = 3;
      state.players[0].planets = [{ planetId: 'test_planet', exhausted: false, attachments: [] }] as any;

      state.map.tiles[0].planets.push({
        id: 'test_planet',
        planetId: 'test_planet',
        controlledBy: 'player1',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      const handler = getAbilityHandler('sol_orbital_drop');
      const result = handler!(state, 'player1', {
        choices: { selectedPlanetId: 'test_planet' },
      });

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('orbital_drop');
      expect(result.triggeredEvents).toContain('unit_placed');
      expect(state.players[0].commandTokens.tactics).toBe(2);
      expect(result.data?.unitsPlaced).toBe(2);

      const infantryCount = state.map.tiles[0].units.filter(
        (u) => u.type === 'infantry' && u.planetId === 'test_planet'
      ).length;
      expect(infantryCount).toBe(2);
    });
  });
});

// =============================================================================
// L1Z1X MINDNET Tests
// =============================================================================

describe('L1Z1X Mindnet Faction Abilities', () => {
  describe('ASSIMILATE', () => {
    it('should fail if player is not L1Z1X', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('l1z1x_assimilate');
      const result = handler!(state, 'player1', { targetPlanetId: 'test_planet' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not L1Z1X player');
    });

    it('should fail without planet target', () => {
      const state = createMockGameState();
      state.players[0].faction = 'l1z1x';

      const handler = getAbilityHandler('l1z1x_assimilate');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('No planet specified');
    });

    it('should fail without unit type selection', () => {
      const state = createMockGameState();
      state.players[0].faction = 'l1z1x';

      state.map.tiles[0].planets.push({
        id: 'test_planet',
        planetId: 'test_planet',
        controlledBy: 'player1',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      const handler = getAbilityHandler('l1z1x_assimilate');
      const result = handler!(state, 'player1', { targetPlanetId: 'test_planet' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must choose PDS or Space Dock');
    });

    it('should place PDS on gained planet', () => {
      const state = createMockGameState();
      state.players[0].faction = 'l1z1x';

      state.map.tiles[0].planets.push({
        id: 'test_planet',
        planetId: 'test_planet',
        controlledBy: 'player1',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      const handler = getAbilityHandler('l1z1x_assimilate');
      const result = handler!(state, 'player1', {
        targetPlanetId: 'test_planet',
        choices: { selectedUnitType: 'pds' },
      });

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('assimilate_triggered');
      expect(result.data?.unitType).toBe('pds');

      const pdsCount = state.map.tiles[0].units.filter(
        (u) => u.type === 'pds' && u.planetId === 'test_planet'
      ).length;
      expect(pdsCount).toBe(1);
    });

    it('should place Space Dock on gained planet', () => {
      const state = createMockGameState();
      state.players[0].faction = 'l1z1x';

      state.map.tiles[0].planets.push({
        id: 'test_planet',
        planetId: 'test_planet',
        controlledBy: 'player1',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      const handler = getAbilityHandler('l1z1x_assimilate');
      const result = handler!(state, 'player1', {
        targetPlanetId: 'test_planet',
        choices: { selectedUnitType: 'space_dock' },
      });

      expect(result.success).toBe(true);
      expect(result.data?.unitType).toBe('space_dock');
    });
  });

  describe('HARROW', () => {
    it('should fail if not in ground combat', () => {
      const state = createMockGameState();
      state.players[0].faction = 'l1z1x';
      state.activeCombat = {
        id: 'combat-1',
        type: 'space',
        systemId: 'tile-0-0',
        attackerId: 'player1',
        defenderId: 'player2',
      } as CombatState;

      const handler = getAbilityHandler('l1z1x_harrow');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in ground combat');
    });

    it('should return 0 hits if no dreadnoughts', () => {
      const state = createMockGameState();
      state.players[0].faction = 'l1z1x';
      state.activeCombat = {
        id: 'combat-1',
        type: 'ground',
        systemId: 'tile-0-0',
        attackerId: 'player1',
        defenderId: 'player2',
      } as CombatState;

      // No dreadnoughts
      state.map.tiles[0].units = [];

      const handler = getAbilityHandler('l1z1x_harrow');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.data?.hits).toBe(0);
    });

    it('should deal hits equal to dreadnought count', () => {
      const state = createMockGameState();
      state.players[0].faction = 'l1z1x';
      state.activeCombat = {
        id: 'combat-1',
        type: 'ground',
        systemId: 'tile-0-0',
        attackerId: 'player1',
        defenderId: 'player2',
      } as CombatState;

      state.map.tiles[0].units = [
        { id: 'dread-1', type: 'dreadnought', ownerId: 'player1', damaged: false },
        { id: 'dread-2', type: 'dreadnought', ownerId: 'player1', damaged: false },
        { id: 'dread-3', type: 'dreadnought', ownerId: 'player1', damaged: false },
      ];

      const handler = getAbilityHandler('l1z1x_harrow');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('harrow_triggered');
      expect(result.data?.dreadnoughtCount).toBe(3);
      expect(result.data?.pendingHits).toBe(3);
    });
  });
});

// =============================================================================
// CLAN OF SAAR Tests
// =============================================================================

describe('Clan of Saar Faction Abilities', () => {
  describe('SCAVENGE', () => {
    it('should fail if player is not Saar', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('saar_scavenge');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Saar player');
    });

    it('should gain 1 trade good on planet gain', () => {
      const state = createMockGameState();
      state.players[0].faction = 'saar';
      state.players[0].tradeGoods = 2;

      const handler = getAbilityHandler('saar_scavenge');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('scavenge_triggered');
      expect(state.players[0].tradeGoods).toBe(3);
    });
  });
});

// =============================================================================
// BARONY OF LETNEV Tests
// =============================================================================

describe('Barony of Letnev Faction Abilities', () => {
  describe('MUNITIONS RESERVES', () => {
    it('should fail if player is not Letnev', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('letnev_munitions_reserves');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Letnev player');
    });

    it('should fail without 2 trade goods', () => {
      const state = createMockGameState();
      state.players[0].faction = 'letnev';
      state.players[0].tradeGoods = 1;

      const handler = getAbilityHandler('letnev_munitions_reserves');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Need 2 trade goods');
    });

    it('should spend 2 trade goods and allow rerolls', () => {
      const state = createMockGameState();
      state.players[0].faction = 'letnev';
      state.players[0].tradeGoods = 5;

      const handler = getAbilityHandler('letnev_munitions_reserves');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('munitions_reserves_activated');
      expect(result.data?.canRerollAll).toBe(true);
      expect(state.players[0].tradeGoods).toBe(3);
    });
  });
});

// =============================================================================
// YSSARIL TRIBES Tests
// =============================================================================

describe('Yssaril Tribes Faction Abilities', () => {
  describe('STALL TACTICS', () => {
    it('should fail if player is not Yssaril', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('yssaril_stall_tactics');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Yssaril player');
    });

    it('should fail without action cards', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';
      state.players[0].actionCards = [];

      const handler = getAbilityHandler('yssaril_stall_tactics');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('No action cards to discard');
    });

    it('should discard an action card to stall', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';
      state.players[0].actionCards = ['sabotage', 'direct_hit'];

      const handler = getAbilityHandler('yssaril_stall_tactics');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('stall_tactics_used');
      expect(state.players[0].actionCards.length).toBe(1);
      expect(state.actionCardDiscard).toContain('sabotage');
    });
  });

  describe('SCHEMING', () => {
    it('should draw 1 additional action card', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';
      state.players[0].actionCards = ['sabotage'];
      state.actionCardDeck = ['direct_hit', 'flank_speed', 'unexpected_action'];

      const handler = getAbilityHandler('yssaril_scheming');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('scheming_triggered');
      expect(state.players[0].actionCards.length).toBe(2);
      expect(state.players[0].actionCards).toContain('direct_hit');
    });
  });
});

// =============================================================================
// NAALU COLLECTIVE Tests
// =============================================================================

describe('Naalu Collective Faction Abilities', () => {
  describe('TELEPATHY', () => {
    it('should return initiative 0', () => {
      const state = createMockGameState();
      state.players[0].faction = 'naalu';

      const handler = getAbilityHandler('naalu_telepathy');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.data?.initiative).toBe(0);
    });
  });

  describe('FORESIGHT', () => {
    it('should fail without strategy tokens', () => {
      const state = createMockGameState();
      state.players[0].faction = 'naalu';
      state.players[0].commandTokens.strategy = 0;

      const handler = getAbilityHandler('naalu_foresight');
      const result = handler!(state, 'player1', {
        choices: { selectedSystem: { q: 1, r: 0 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No strategy tokens available');
    });

    it('should spend strategy token and trigger retreat', () => {
      const state = createMockGameState();
      state.players[0].faction = 'naalu';
      state.players[0].commandTokens.strategy = 2;

      const handler = getAbilityHandler('naalu_foresight');
      const result = handler!(state, 'player1', {
        choices: { selectedSystem: { q: 1, r: 0 } },
      });

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('foresight_triggered');
      expect(state.players[0].commandTokens.strategy).toBe(1);
    });
  });
});

// =============================================================================
// NEKRO VIRUS Tests
// =============================================================================

describe('Nekro Virus Faction Abilities', () => {
  describe('TECHNOLOGICAL SINGULARITY', () => {
    it('should fail if player is not Nekro', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('nekro_tech_singularity');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Nekro player');
    });

    it('should fail without target player and tech', () => {
      const state = createMockGameState();
      state.players[0].faction = 'nekro';

      const handler = getAbilityHandler('nekro_tech_singularity');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must specify opponent and technology');
    });

    it('should fail if opponent does not have the tech', () => {
      const state = createMockGameState();
      state.players[0].faction = 'nekro';
      state.players[1].technologies = ['neural_motivator'];

      const handler = getAbilityHandler('nekro_tech_singularity');
      const result = handler!(state, 'player1', {
        targetPlayerId: 'player2',
        choices: { selectedTechId: 'sarween_tools' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Opponent does not have this technology');
    });

    it('should fail if Nekro already has the tech', () => {
      const state = createMockGameState();
      state.players[0].faction = 'nekro';
      state.players[0].technologies = ['sarween_tools'];
      state.players[1].technologies = ['sarween_tools'];

      const handler = getAbilityHandler('nekro_tech_singularity');
      const result = handler!(state, 'player1', {
        targetPlayerId: 'player2',
        choices: { selectedTechId: 'sarween_tools' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('You already have this technology');
    });

    it('should copy technology from opponent', () => {
      const state = createMockGameState();
      state.players[0].faction = 'nekro';
      state.players[0].technologies = ['neural_motivator'];
      state.players[1].technologies = ['sarween_tools', 'antimass_deflectors'];

      const handler = getAbilityHandler('nekro_tech_singularity');
      const result = handler!(state, 'player1', {
        targetPlayerId: 'player2',
        choices: { selectedTechId: 'sarween_tools' },
      });

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('tech_copied');
      expect(state.players[0].technologies).toContain('sarween_tools');
      expect(result.data?.copiedTech).toBe('sarween_tools');
      expect(result.data?.from).toBe('player2');
    });
  });
});

// =============================================================================
// XXCHA KINGDOM Tests
// =============================================================================

describe('Xxcha Kingdom Faction Abilities', () => {
  describe('QUASH', () => {
    it('should fail if player is not Xxcha', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('xxcha_quash');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Xxcha player');
    });

    it('should fail without strategy tokens', () => {
      const state = createMockGameState();
      state.players[0].faction = 'xxcha';
      state.players[0].commandTokens.strategy = 0;

      const handler = getAbilityHandler('xxcha_quash');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('No strategy tokens available');
    });

    it('should fail if no current agenda', () => {
      const state = createMockGameState();
      state.players[0].faction = 'xxcha';
      state.agendaPhase = undefined;

      const handler = getAbilityHandler('xxcha_quash');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('No agenda to quash');
    });

    it('should discard agenda and draw new one', () => {
      const state = createMockGameState();
      state.players[0].faction = 'xxcha';
      state.players[0].commandTokens.strategy = 2;
      state.agendaPhase = { currentAgendaId: 'arms_reduction' } as any;
      state.agendaDeck = ['anti_intellectual_revolution', 'classified_document_leaks'];

      const handler = getAbilityHandler('xxcha_quash');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('agenda_quashed');
      expect(state.players[0].commandTokens.strategy).toBe(1);
      expect(state.agendaDiscard).toContain('arms_reduction');
      expect(state.agendaPhase?.currentAgendaId).toBe('anti_intellectual_revolution');
    });
  });
});

// =============================================================================
// EMBERS OF MUAAT Tests
// =============================================================================

describe('Embers of Muaat Faction Abilities', () => {
  describe('STAR FORGE', () => {
    it('should fail if player is not Muaat', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      const handler = getAbilityHandler('muaat_star_forge');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not Muaat player');
    });

    it('should fail without strategy tokens', () => {
      const state = createMockGameState();
      state.players[0].faction = 'muaat';
      state.players[0].commandTokens.strategy = 0;

      const handler = getAbilityHandler('muaat_star_forge');
      const result = handler!(state, 'player1', {
        choices: { selectedSystem: { q: 0, r: 0 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No strategy tokens available');
    });

    it('should fail without War Sun in system', () => {
      const state = createMockGameState();
      state.players[0].faction = 'muaat';
      state.map.tiles[0].units = [];

      const handler = getAbilityHandler('muaat_star_forge');
      const result = handler!(state, 'player1', {
        choices: { selectedSystem: { q: 0, r: 0 } },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No War Sun in this system');
    });

    it('should place 2 fighters in system with War Sun', () => {
      const state = createMockGameState();
      state.players[0].faction = 'muaat';
      state.players[0].commandTokens.strategy = 2;
      state.map.tiles[0].units = [
        { id: 'warsun-1', type: 'war_sun', ownerId: 'player1', damaged: false },
      ];

      const handler = getAbilityHandler('muaat_star_forge');
      const result = handler!(state, 'player1', {
        choices: { selectedSystem: { q: 0, r: 0 }, selectedUnitType: 'fighter' },
      });

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('star_forge_used');
      expect(state.players[0].commandTokens.strategy).toBe(1);

      const fighterCount = state.map.tiles[0].units.filter((u) => u.type === 'fighter').length;
      expect(fighterCount).toBe(2);
    });

    it('should place 1 destroyer in system with War Sun', () => {
      const state = createMockGameState();
      state.players[0].faction = 'muaat';
      state.players[0].commandTokens.strategy = 2;
      state.map.tiles[0].units = [
        { id: 'warsun-1', type: 'war_sun', ownerId: 'player1', damaged: false },
      ];

      const handler = getAbilityHandler('muaat_star_forge');
      const result = handler!(state, 'player1', {
        choices: { selectedSystem: { q: 0, r: 0 }, selectedUnitType: 'destroyer' },
      });

      expect(result.success).toBe(true);

      const destroyerCount = state.map.tiles[0].units.filter((u) => u.type === 'destroyer').length;
      expect(destroyerCount).toBe(1);
    });
  });
});

// =============================================================================
// WINNU Tests
// =============================================================================

describe('Winnu Faction Abilities', () => {
  describe('BLOOD TIES', () => {
    it('should indicate Custodians cost zero', () => {
      const state = createMockGameState();
      state.players[0].faction = 'winnu';

      const handler = getAbilityHandler('winnu_blood_ties');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.data?.custodiansCostZero).toBe(true);
    });
  });

  describe('RECLAMATION', () => {
    it('should fail if player does not control Mecatol Rex', () => {
      const state = createMockGameState();
      state.players[0].faction = 'winnu';
      state.players[0].planets = [];

      state.map.tiles[0].planets.push({
        id: 'mecatol_rex',
        planetId: 'mecatol_rex',
        controlledBy: 'player2',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      const handler = getAbilityHandler('winnu_reclamation');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not control Mecatol Rex');
    });

    it('should place PDS and Space Dock on Mecatol Rex', () => {
      const state = createMockGameState();
      state.players[0].faction = 'winnu';
      state.players[0].planets = [{ planetId: 'mecatol_rex', exhausted: false, attachments: [] }] as any;

      state.map.tiles[0].planets.push({
        id: 'mecatol_rex',
        planetId: 'mecatol_rex',
        controlledBy: 'player1',
        exhausted: false,
        attachments: [],
        units: [],
      } as PlanetInstance);

      const handler = getAbilityHandler('winnu_reclamation');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.stateModified).toBe(true);
      expect(result.triggeredEvents).toContain('reclamation_triggered');
      expect(result.data?.unitsPlaced).toContain('pds');
      expect(result.data?.unitsPlaced).toContain('space_dock');

      const pdsCount = state.map.tiles[0].units.filter((u) => u.type === 'pds').length;
      const dockCount = state.map.tiles[0].units.filter((u) => u.type === 'space_dock').length;
      expect(pdsCount).toBe(1);
      expect(dockCount).toBe(1);
    });
  });
});

// =============================================================================
// UNIVERSITIES OF JOL-NAR Tests
// =============================================================================

describe('Universities of Jol-Nar Faction Abilities', () => {
  describe('BRILLIANT', () => {
    it('should grant additional tech secondary', () => {
      const state = createMockGameState();
      state.players[0].faction = 'jolnar';

      const handler = getAbilityHandler('jolnar_brilliant');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.data?.additionalTechSecondary).toBe(true);
    });
  });

  describe('ANALYTICAL', () => {
    it('should allow ignoring 1 prerequisite', () => {
      const state = createMockGameState();
      state.players[0].faction = 'jolnar';

      const handler = getAbilityHandler('jolnar_analytical');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.data?.ignorePrerequisites).toBe(1);
    });
  });
});

// =============================================================================
// GHOSTS OF CREUSS Tests
// =============================================================================

describe('Ghosts of Creuss Faction Abilities', () => {
  describe('QUANTUM ENTANGLEMENT', () => {
    it('should indicate passive abilities', () => {
      const state = createMockGameState();
      state.players[0].faction = 'creuss';

      const handler = getAbilityHandler('creuss_quantum_entanglement');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.data?.canMoveThroughEnemies).toBe(true);
      expect(result.data?.wormholesAdjacent).toBe(true);
    });
  });
});

// =============================================================================
// EMIRATES OF HACAN Tests
// =============================================================================

describe('Emirates of Hacan Faction Abilities', () => {
  describe('MASTERS OF TRADE', () => {
    it('should indicate can trade with non-neighbors', () => {
      const state = createMockGameState();
      state.players[0].faction = 'hacan';

      const handler = getAbilityHandler('hacan_masters_of_trade');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.data?.canTradeWithNonNeighbors).toBe(true);
    });
  });

  describe('GUILD SHIPS', () => {
    it('should indicate trade agreement bonus', () => {
      const state = createMockGameState();
      state.players[0].faction = 'hacan';

      const handler = getAbilityHandler('hacan_guild_ships');
      const result = handler!(state, 'player1', {});

      expect(result.success).toBe(true);
      expect(result.data?.tradeAgreementBonus).toBe(1);
    });
  });
});
