import { describe, it, expect, beforeEach } from 'vitest';
import {
  isUnitGalvanized,
  getGalvanizedUnits,
  countGalvanizedUnitsInSystem,
  handleGalvanize,
  removeGalvanizeToken,
  getGalvanizeCombatBonus,
  getGalvanizeBombardmentReduction,
  handleLiberate,
  handlePhoenixStandard,
  canUsePhoenixStandard,
  getPhoenixStandardTargets,
  handleA3ValianceDeath,
  getEgeiroCombatBonus,
  cleanupDestroyedGalvanizedUnits,
  type GalvanizeAction,
  type LiberateAction,
} from '../last-bastion.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  PlanetInstance,
  UnitInstance,
  HexCoord,
} from '@ti4/shared';

// =============================================================================
// Mock Factory Functions
// =============================================================================

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    faction: 'last_bastion',
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
    galvanizeTokens: [],
    ...overrides,
  };
}

function createMockTile(position: HexCoord, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId: 100,
    position,
    rotation: 0,
    planets: [],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
    ...overrides,
  } as MapTile;
}

function createMockGameState(playerCount: number = 4): GameState {
  const players: PlayerState[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(
      createMockPlayer(`player${i + 1}`, {
        name: `Player ${i + 1}`,
        seatIndex: i,
        faction: i === 0 ? 'last_bastion' : 'sol',
        color: ['blue', 'red', 'green', 'yellow'][i] as any,
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
        createMockTile({ q: 0, r: 0 }),
        createMockTile({ q: 1, r: 0 }),
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
  };
}

// =============================================================================
// Galvanize Token Management Tests
// =============================================================================

describe('Last Bastion - Galvanize Token Management', () => {
  describe('isUnitGalvanized', () => {
    it('should return false for player not found', () => {
      const state = createMockGameState();
      expect(isUnitGalvanized(state, 'nonexistent', 'unit-1')).toBe(false);
    });

    it('should return false when player has no galvanize tokens', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = undefined;
      expect(isUnitGalvanized(state, 'player1', 'unit-1')).toBe(false);
    });

    it('should return false when unit is not galvanized', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-2', 'unit-3'];
      expect(isUnitGalvanized(state, 'player1', 'unit-1')).toBe(false);
    });

    it('should return true when unit is galvanized', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1', 'unit-2'];
      expect(isUnitGalvanized(state, 'player1', 'unit-1')).toBe(true);
    });
  });

  describe('getGalvanizedUnits', () => {
    it('should return empty array for player not found', () => {
      const state = createMockGameState();
      expect(getGalvanizedUnits(state, 'nonexistent')).toEqual([]);
    });

    it('should return empty array when no galvanize tokens', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = undefined;
      expect(getGalvanizedUnits(state, 'player1')).toEqual([]);
    });

    it('should return all galvanized unit IDs', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1', 'unit-2', 'unit-3'];
      expect(getGalvanizedUnits(state, 'player1')).toEqual(['unit-1', 'unit-2', 'unit-3']);
    });
  });

  describe('countGalvanizedUnitsInSystem', () => {
    it('should return 0 for player not found', () => {
      const state = createMockGameState();
      expect(countGalvanizedUnitsInSystem(state, 'nonexistent', 'tile-0-0')).toBe(0);
    });

    it('should return 0 for tile not found', () => {
      const state = createMockGameState();
      expect(countGalvanizedUnitsInSystem(state, 'player1', 'nonexistent-tile')).toBe(0);
    });

    it('should count galvanized space units', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['cruiser-1', 'cruiser-2'];
      state.map.tiles[0].units = [
        { id: 'cruiser-1', type: 'cruiser', ownerId: 'player1', damaged: false },
        { id: 'cruiser-2', type: 'cruiser', ownerId: 'player1', damaged: false },
        { id: 'cruiser-3', type: 'cruiser', ownerId: 'player1', damaged: false }, // Not galvanized
      ];

      expect(countGalvanizedUnitsInSystem(state, 'player1', 'tile-0-0')).toBe(2);
    });

    it('should count galvanized planet units', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['inf-1', 'inf-2'];
      state.map.tiles[0].planets = [
        {
          id: 'planet-1',
          planetId: 'planet-1',
          controlledBy: 'player1',
          exhausted: false,
          attachments: [],
          units: [
            { id: 'inf-1', type: 'infantry', ownerId: 'player1', damaged: false },
            { id: 'inf-2', type: 'infantry', ownerId: 'player1', damaged: false },
            { id: 'inf-3', type: 'infantry', ownerId: 'player1', damaged: false },
          ],
        } as PlanetInstance,
      ];

      expect(countGalvanizedUnitsInSystem(state, 'player1', 'tile-0-0')).toBe(2);
    });

    it('should count both space and planet galvanized units', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['cruiser-1', 'inf-1'];
      state.map.tiles[0].units = [
        { id: 'cruiser-1', type: 'cruiser', ownerId: 'player1', damaged: false },
      ];
      state.map.tiles[0].planets = [
        {
          id: 'planet-1',
          planetId: 'planet-1',
          controlledBy: 'player1',
          exhausted: false,
          attachments: [],
          units: [
            { id: 'inf-1', type: 'infantry', ownerId: 'player1', damaged: false },
          ],
        } as PlanetInstance,
      ];

      expect(countGalvanizedUnitsInSystem(state, 'player1', 'tile-0-0')).toBe(2);
    });
  });

  describe('handleGalvanize', () => {
    it('should fail for player not found', () => {
      const state = createMockGameState();
      const action: GalvanizeAction = {
        type: 'galvanize',
        playerId: 'nonexistent',
        unitId: 'unit-1',
      };

      const result = handleGalvanize(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail for non-Last Bastion player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';
      state.map.tiles[0].units = [
        { id: 'unit-1', type: 'cruiser', ownerId: 'player1', damaged: false },
      ];

      const action: GalvanizeAction = {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      };

      const result = handleGalvanize(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only Last Bastion can galvanize units');
    });

    it('should fail for unit not found', () => {
      const state = createMockGameState();
      const action: GalvanizeAction = {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'nonexistent',
      };

      const result = handleGalvanize(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit not found');
    });

    it('should fail for unit not owned by player', () => {
      const state = createMockGameState();
      state.map.tiles[0].units = [
        { id: 'unit-1', type: 'cruiser', ownerId: 'player2', damaged: false },
      ];

      const action: GalvanizeAction = {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      };

      const result = handleGalvanize(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit does not belong to player');
    });

    it('should fail if unit already galvanized', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1'];
      state.map.tiles[0].units = [
        { id: 'unit-1', type: 'cruiser', ownerId: 'player1', damaged: false },
      ];

      const action: GalvanizeAction = {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'unit-1',
      };

      const result = handleGalvanize(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit is already galvanized');
    });

    it('should successfully galvanize a unit', () => {
      const state = createMockGameState();
      state.map.tiles[0].units = [
        { id: 'cruiser-1', type: 'cruiser', ownerId: 'player1', damaged: false },
      ];

      const action: GalvanizeAction = {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'cruiser-1',
      };

      const result = handleGalvanize(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('unit_galvanized');
      expect(state.players[0].galvanizeTokens).toContain('cruiser-1');
      expect(result.data?.unitType).toBe('cruiser');
    });

    it('should galvanize unit on planet', () => {
      const state = createMockGameState();
      state.map.tiles[0].planets = [
        {
          id: 'planet-1',
          planetId: 'planet-1',
          controlledBy: 'player1',
          exhausted: false,
          attachments: [],
          units: [
            { id: 'inf-1', type: 'infantry', ownerId: 'player1', damaged: false },
          ],
        } as PlanetInstance,
      ];

      const action: GalvanizeAction = {
        type: 'galvanize',
        playerId: 'player1',
        unitId: 'inf-1',
      };

      const result = handleGalvanize(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].galvanizeTokens).toContain('inf-1');
    });
  });

  describe('removeGalvanizeToken', () => {
    it('should fail for player not found', () => {
      const state = createMockGameState();

      const result = removeGalvanizeToken(state, 'nonexistent', 'unit-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail when no galvanize tokens exist', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = undefined;

      const result = removeGalvanizeToken(state, 'player1', 'unit-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No galvanize tokens to remove');
    });

    it('should fail when unit is not galvanized', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-2', 'unit-3'];

      const result = removeGalvanizeToken(state, 'player1', 'unit-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unit is not galvanized');
    });

    it('should successfully remove galvanize token', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1', 'unit-2', 'unit-3'];

      const result = removeGalvanizeToken(state, 'player1', 'unit-2');

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('galvanize_token_removed');
      expect(state.players[0].galvanizeTokens).toEqual(['unit-1', 'unit-3']);
    });
  });

  describe('getGalvanizeCombatBonus', () => {
    it('should return 0 for non-galvanized unit', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-2'];

      expect(getGalvanizeCombatBonus(state, 'player1', 'unit-1')).toBe(0);
    });

    it('should return 1 for galvanized unit', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1'];

      expect(getGalvanizeCombatBonus(state, 'player1', 'unit-1')).toBe(1);
    });
  });

  describe('getGalvanizeBombardmentReduction', () => {
    it('should return 0 for non-Last Bastion player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      expect(getGalvanizeBombardmentReduction(state, 'player1', 'planet-1')).toBe(0);
    });

    it('should return 0 for player without galvanize tokens', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = undefined;

      expect(getGalvanizeBombardmentReduction(state, 'player1', 'planet-1')).toBe(0);
    });

    it('should return count of galvanized ground forces on planet', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['inf-1', 'inf-2'];
      state.map.tiles[0].planets = [
        {
          id: 'planet-1',
          planetId: 'planet-1',
          controlledBy: 'player1',
          exhausted: false,
          attachments: [],
          units: [
            { id: 'inf-1', type: 'infantry', ownerId: 'player1', damaged: false },
            { id: 'inf-2', type: 'infantry', ownerId: 'player1', damaged: false },
            { id: 'inf-3', type: 'infantry', ownerId: 'player1', damaged: false }, // Not galvanized
          ],
        } as PlanetInstance,
      ];

      expect(getGalvanizeBombardmentReduction(state, 'player1', 'planet-1')).toBe(2);
    });
  });
});

// =============================================================================
// Liberate Ability Tests
// =============================================================================

describe('Last Bastion - Liberate Ability', () => {
  describe('handleLiberate', () => {
    it('should fail for player not found', () => {
      const state = createMockGameState();
      const action: LiberateAction = {
        type: 'liberate',
        playerId: 'nonexistent',
        planetId: 'planet-1',
      };

      const result = handleLiberate(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail for non-Last Bastion player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';
      const action: LiberateAction = {
        type: 'liberate',
        playerId: 'player1',
        planetId: 'planet-1',
      };

      const result = handleLiberate(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only Last Bastion can use Liberate');
    });

    it('should fail for planet not found', () => {
      const state = createMockGameState();
      const action: LiberateAction = {
        type: 'liberate',
        playerId: 'player1',
        planetId: 'nonexistent',
      };

      const result = handleLiberate(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Planet not found');
    });

    it('should fail if player does not control the planet', () => {
      const state = createMockGameState();
      state.map.tiles[0].planets = [
        {
          id: 'planet-1',
          planetId: 'planet-1',
          controlledBy: 'player2',
          exhausted: false,
          attachments: [],
          units: [],
        } as PlanetInstance,
      ];
      const action: LiberateAction = {
        type: 'liberate',
        playerId: 'player1',
        planetId: 'planet-1',
      };

      const result = handleLiberate(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player does not control this planet');
    });

    it('should ready planet when infantry >= resources', () => {
      const state = createMockGameState();
      state.players[0].planets = [
        { planetId: 'jord', exhausted: true, attachments: [] } as any,
      ];
      state.map.tiles[0].planets = [
        {
          id: 'jord',
          planetId: 'jord',
          controlledBy: 'player1',
          exhausted: true,
          attachments: [],
          units: [
            { id: 'inf-1', type: 'infantry', ownerId: 'player1', damaged: false },
            { id: 'inf-2', type: 'infantry', ownerId: 'player1', damaged: false },
            { id: 'inf-3', type: 'infantry', ownerId: 'player1', damaged: false },
            { id: 'inf-4', type: 'infantry', ownerId: 'player1', damaged: false },
          ],
        } as PlanetInstance,
      ];
      const action: LiberateAction = {
        type: 'liberate',
        playerId: 'player1',
        planetId: 'jord',
      };

      const result = handleLiberate(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('liberate_triggered');
      expect(result.triggeredEvents).toContain('planet_readied');
      expect(result.data?.action).toBe('ready');
      expect(state.players[0].planets[0].exhausted).toBe(false);
    });

    it('should place infantry when infantry < resources', () => {
      const state = createMockGameState();
      state.map.tiles[0].planets = [
        {
          id: 'jord',
          planetId: 'jord',
          controlledBy: 'player1',
          exhausted: false,
          attachments: [],
          units: [
            { id: 'inf-1', type: 'infantry', ownerId: 'player1', damaged: false },
          ],
        } as PlanetInstance,
      ];
      const action: LiberateAction = {
        type: 'liberate',
        playerId: 'player1',
        planetId: 'jord',
      };

      const result = handleLiberate(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('liberate_triggered');
      expect(result.triggeredEvents).toContain('infantry_placed');
      expect(result.data?.action).toBe('place_infantry');
      expect(state.map.tiles[0].planets[0].units.length).toBe(2);
    });
  });
});

// =============================================================================
// Phoenix Standard Tests
// =============================================================================

describe('Last Bastion - Phoenix Standard', () => {
  describe('handlePhoenixStandard', () => {
    it('should fail for non-Last Bastion player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';
      state.map.tiles[0].units = [
        { id: 'unit-1', type: 'cruiser', ownerId: 'player1', damaged: false },
      ];

      const result = handlePhoenixStandard(state, 'player1', 'unit-1');

      expect(result.success).toBe(false);
    });

    it('should successfully galvanize a unit after combat', () => {
      const state = createMockGameState();
      state.map.tiles[0].units = [
        { id: 'cruiser-1', type: 'cruiser', ownerId: 'player1', damaged: false },
      ];

      const result = handlePhoenixStandard(state, 'player1', 'cruiser-1');

      expect(result.success).toBe(true);
      expect(state.players[0].galvanizeTokens).toContain('cruiser-1');
    });
  });

  describe('canUsePhoenixStandard', () => {
    it('should return false for non-Last Bastion player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      expect(canUsePhoenixStandard(state, 'player1', ['unit-1'])).toBe(false);
    });

    it('should return false when all participating units are already galvanized', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1', 'unit-2'];

      expect(canUsePhoenixStandard(state, 'player1', ['unit-1', 'unit-2'])).toBe(false);
    });

    it('should return true when there are ungalvanized participating units', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1'];

      expect(canUsePhoenixStandard(state, 'player1', ['unit-1', 'unit-2', 'unit-3'])).toBe(true);
    });
  });

  describe('getPhoenixStandardTargets', () => {
    it('should return empty array for non-Last Bastion', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      expect(getPhoenixStandardTargets(state, 'player1', ['unit-1'])).toEqual([]);
    });

    it('should return only ungalvanized participating units', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1'];

      const targets = getPhoenixStandardTargets(state, 'player1', ['unit-1', 'unit-2', 'unit-3']);

      expect(targets).toEqual(['unit-2', 'unit-3']);
    });
  });
});

// =============================================================================
// A3 Valiance Mech Tests
// =============================================================================

describe('Last Bastion - A3 Valiance Mech', () => {
  describe('handleA3ValianceDeath', () => {
    it('should fail if mech was not galvanized', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = [];

      const result = handleA3ValianceDeath(state, 'player1', 'mech-1', 'planet-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Mech was not galvanized');
    });

    it('should galvanize up to 3 infantry when mech dies', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['mech-1'];
      state.map.tiles[0].planets = [
        {
          id: 'planet-1',
          planetId: 'planet-1',
          controlledBy: 'player1',
          exhausted: false,
          attachments: [],
          units: [
            { id: 'inf-1', type: 'infantry', ownerId: 'player1', damaged: false },
            { id: 'inf-2', type: 'infantry', ownerId: 'player1', damaged: false },
            { id: 'inf-3', type: 'infantry', ownerId: 'player1', damaged: false },
            { id: 'inf-4', type: 'infantry', ownerId: 'player1', damaged: false }, // Only 3 should be galvanized
          ],
        } as PlanetInstance,
      ];

      const result = handleA3ValianceDeath(state, 'player1', 'mech-1', 'planet-1');

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('a3_valiance_triggered');
      expect(result.data?.galvanizedCount).toBe(3);
      // Mech token should be removed
      expect(state.players[0].galvanizeTokens).not.toContain('mech-1');
      // 3 infantry should now be galvanized
      expect(state.players[0].galvanizeTokens.length).toBe(3);
    });

    it('should fail if planet not found', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['mech-1'];

      const result = handleA3ValianceDeath(state, 'player1', 'mech-1', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Planet not found');
    });
  });
});

// =============================================================================
// Egeiro Flagship Tests
// =============================================================================

describe('Last Bastion - The Egeiro Flagship', () => {
  describe('getEgeiroCombatBonus', () => {
    it('should return 0 for non-Last Bastion player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'sol';

      expect(getEgeiroCombatBonus(state, 'player1')).toBe(0);
    });

    it('should return count of non-home systems with controlled planets', () => {
      const state = createMockGameState();
      // Add systems with controlled planets (systemId >= 100 are non-home)
      state.map.tiles = [
        {
          ...createMockTile({ q: 0, r: 0 }),
          systemId: 100,
          planets: [
            { id: 'p1', planetId: 'p1', controlledBy: 'player1' } as PlanetInstance,
          ],
        },
        {
          ...createMockTile({ q: 1, r: 0 }),
          systemId: 101,
          planets: [
            { id: 'p2', planetId: 'p2', controlledBy: 'player1' } as PlanetInstance,
          ],
        },
        {
          ...createMockTile({ q: 2, r: 0 }),
          systemId: 102,
          planets: [
            { id: 'p3', planetId: 'p3', controlledBy: 'player2' } as PlanetInstance, // Not controlled
          ],
        },
      ];

      expect(getEgeiroCombatBonus(state, 'player1')).toBe(2);
    });

    it('should not count home systems (systemId < 100)', () => {
      const state = createMockGameState();
      state.map.tiles = [
        {
          ...createMockTile({ q: 0, r: 0 }),
          systemId: 1, // Home system
          planets: [
            { id: 'p1', planetId: 'p1', controlledBy: 'player1' } as PlanetInstance,
          ],
        },
        {
          ...createMockTile({ q: 1, r: 0 }),
          systemId: 100, // Non-home system
          planets: [
            { id: 'p2', planetId: 'p2', controlledBy: 'player1' } as PlanetInstance,
          ],
        },
      ];

      expect(getEgeiroCombatBonus(state, 'player1')).toBe(1);
    });
  });
});

// =============================================================================
// Cleanup Tests
// =============================================================================

describe('Last Bastion - Cleanup', () => {
  describe('cleanupDestroyedGalvanizedUnits', () => {
    it('should not fail if player has no galvanize tokens', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = undefined;

      // Should not throw
      cleanupDestroyedGalvanizedUnits(state, 'player1', ['unit-1']);

      expect(state.players[0].galvanizeTokens).toBeUndefined();
    });

    it('should remove galvanize tokens from destroyed units', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1', 'unit-2', 'unit-3', 'unit-4'];

      cleanupDestroyedGalvanizedUnits(state, 'player1', ['unit-2', 'unit-4']);

      expect(state.players[0].galvanizeTokens).toEqual(['unit-1', 'unit-3']);
    });

    it('should handle when none of the destroyed units were galvanized', () => {
      const state = createMockGameState();
      state.players[0].galvanizeTokens = ['unit-1', 'unit-2'];

      cleanupDestroyedGalvanizedUnits(state, 'player1', ['unit-5', 'unit-6']);

      expect(state.players[0].galvanizeTokens).toEqual(['unit-1', 'unit-2']);
    });
  });
});
