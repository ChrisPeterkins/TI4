import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCombatModifiers,
  getDefaultCombatModifiers,
  applyHitModifier,
  isHit,
} from '../combat-modifiers.js';
import {
  getMovementModifiers,
  areSystemsAdjacent,
  getAdjacentSystems,
  doesSystemBlockMovement,
} from '../movement-modifiers.js';
import {
  getFleetModifiers,
  getEffectiveFleetLimit,
  getHandLimitModifiers,
  getEffectiveHandLimit,
  getTokenGainModifiers,
  getStatusPhaseTokenGain,
} from '../fleet-modifiers.js';
import {
  getProductionModifiers,
  canProduceUnitType,
  getSaarProductionCapacity,
  isFloatingDock,
} from '../production-modifiers.js';
import type { GameState, PlayerState, MapTile } from '@ti4/shared';

// =============================================================================
// MOCK FACTORIES
// =============================================================================

function createMockPlayer(id: string, faction: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    faction,
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
    strategyCard: 1,
    strategyCardUsed: false,
    passed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
    ...overrides,
  };
}

function createMockTile(id: string, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id,
    systemId: parseInt(id) || 1,
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

function createMockGameState(players: PlayerState[]): GameState {
  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: players[0]?.id || 'player1',
    speakerId: players[0]?.id || 'player1',
    initiativeOrder: players.map(p => p.id),
    players,
    map: {
      tiles: [],
      playerCount: players.length,
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
    timingWindowStack: [], activeTimingWindow: null,
    winner: null,
    gameLog: [],
  };
}

// =============================================================================
// COMBAT MODIFIER TESTS
// =============================================================================

describe('Combat Modifiers', () => {
  describe('getDefaultCombatModifiers', () => {
    it('should return zero modifiers by default', () => {
      const modifiers = getDefaultCombatModifiers();

      expect(modifiers.hitModifier).toBe(0);
      expect(modifiers.additionalDice).toBe(0);
      expect(modifiers.rerollCount).toBe(0);
      expect(modifiers.descriptions).toEqual([]);
    });
  });

  describe('getCombatModifiers', () => {
    it('should give Sardakk N\'orr +1 combat modifier (Unrelenting)', () => {
      const sardakkPlayer = createMockPlayer('player1', 'sardakk');
      const state = createMockGameState([sardakkPlayer]);

      const modifiers = getCombatModifiers(state, 'player1', 'space');

      expect(modifiers.hitModifier).toBe(1);
      expect(modifiers.descriptions).toContain('Unrelenting: +1 combat');
    });

    it('should give Jol-Nar -1 combat modifier (Fragile)', () => {
      const jolnarPlayer = createMockPlayer('player1', 'jolnar');
      const state = createMockGameState([jolnarPlayer]);

      const modifiers = getCombatModifiers(state, 'player1', 'space');

      expect(modifiers.hitModifier).toBe(-1);
      expect(modifiers.descriptions).toContain('Fragile: -1 combat');
    });

    it('should return zero modifiers for factions without combat abilities', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const modifiers = getCombatModifiers(state, 'player1', 'space');

      expect(modifiers.hitModifier).toBe(0);
      expect(modifiers.descriptions).toEqual([]);
    });

    it('should return default modifiers for unknown player', () => {
      const state = createMockGameState([]);

      const modifiers = getCombatModifiers(state, 'nonexistent', 'space');

      expect(modifiers.hitModifier).toBe(0);
    });
  });

  describe('applyHitModifier', () => {
    it('should lower combat value with positive modifier (better for attacker)', () => {
      const modifiers = { ...getDefaultCombatModifiers(), hitModifier: 1 };

      // Base combat value 7, with +1 modifier becomes 6
      const effective = applyHitModifier(7, modifiers);

      expect(effective).toBe(6);
    });

    it('should raise combat value with negative modifier (worse for attacker)', () => {
      const modifiers = { ...getDefaultCombatModifiers(), hitModifier: -1 };

      // Base combat value 7, with -1 modifier becomes 8
      const effective = applyHitModifier(7, modifiers);

      expect(effective).toBe(8);
    });

    it('should cap combat value at minimum 1', () => {
      const modifiers = { ...getDefaultCombatModifiers(), hitModifier: 10 };

      const effective = applyHitModifier(5, modifiers);

      expect(effective).toBe(1);
    });

    it('should cap combat value at maximum 10', () => {
      const modifiers = { ...getDefaultCombatModifiers(), hitModifier: -10 };

      const effective = applyHitModifier(5, modifiers);

      expect(effective).toBe(10);
    });
  });

  describe('isHit', () => {
    it('should return true when roll meets combat value', () => {
      const modifiers = getDefaultCombatModifiers();

      expect(isHit(7, 7, modifiers)).toBe(true);
    });

    it('should return true when roll exceeds combat value', () => {
      const modifiers = getDefaultCombatModifiers();

      expect(isHit(10, 7, modifiers)).toBe(true);
    });

    it('should return false when roll is below combat value', () => {
      const modifiers = getDefaultCombatModifiers();

      expect(isHit(5, 7, modifiers)).toBe(false);
    });

    it('should apply hit modifier when checking', () => {
      // +1 modifier makes combat value 6 instead of 7
      const modifiers = { ...getDefaultCombatModifiers(), hitModifier: 1 };

      // Roll of 6 with base combat 7 would normally miss, but +1 modifier makes it hit
      expect(isHit(6, 7, modifiers)).toBe(true);
    });
  });
});

// =============================================================================
// FLEET MODIFIER TESTS
// =============================================================================

describe('Fleet Modifiers', () => {
  describe('getFleetModifiers', () => {
    it('should give Letnev +2 fleet limit bonus (Armada)', () => {
      const letnevPlayer = createMockPlayer('player1', 'letnev');
      const state = createMockGameState([letnevPlayer]);

      const modifiers = getFleetModifiers(state, 'player1');

      expect(modifiers.fleetLimitBonus).toBe(2);
    });

    it('should give zero bonus for factions without fleet abilities', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const modifiers = getFleetModifiers(state, 'player1');

      expect(modifiers.fleetLimitBonus).toBe(0);
    });
  });

  describe('getEffectiveFleetLimit', () => {
    it('should calculate base fleet limit (equal to fleet tokens)', () => {
      const solPlayer = createMockPlayer('player1', 'sol', {
        commandTokens: { tactics: 3, fleet: 4, strategy: 2 },
      });
      const state = createMockGameState([solPlayer]);

      const fleetLimit = getEffectiveFleetLimit(state, 'player1');

      expect(fleetLimit).toBe(4); // Fleet limit equals fleet pool tokens
    });

    it('should include Letnev Armada +2 bonus', () => {
      const letnevPlayer = createMockPlayer('player1', 'letnev', {
        commandTokens: { tactics: 3, fleet: 4, strategy: 2 },
      });
      const state = createMockGameState([letnevPlayer]);

      const fleetLimit = getEffectiveFleetLimit(state, 'player1');

      expect(fleetLimit).toBe(6); // 4 fleet tokens + 2 Armada
    });
  });

  describe('getHandLimitModifiers', () => {
    it('should give Yssaril no hand limit (Crafty)', () => {
      const yssarilPlayer = createMockPlayer('player1', 'yssaril');
      const state = createMockGameState([yssarilPlayer]);

      const modifiers = getHandLimitModifiers(state, 'player1');

      expect(modifiers.noHandLimit).toBe(true);
    });

    it('should give false for factions with normal hand limit', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const modifiers = getHandLimitModifiers(state, 'player1');

      expect(modifiers.noHandLimit).toBe(false);
    });
  });

  describe('getEffectiveHandLimit', () => {
    it('should return base hand limit of 7 for normal factions', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const handLimit = getEffectiveHandLimit(state, 'player1');

      expect(handLimit).toBe(7);
    });

    it('should return Infinity for Yssaril (no hand limit)', () => {
      const yssarilPlayer = createMockPlayer('player1', 'yssaril');
      const state = createMockGameState([yssarilPlayer]);

      const handLimit = getEffectiveHandLimit(state, 'player1');

      expect(handLimit).toBe(Infinity);
    });
  });

  describe('getStatusPhaseTokenGain', () => {
    it('should return base 2 tokens for normal factions', () => {
      const letnevPlayer = createMockPlayer('player1', 'letnev');
      const state = createMockGameState([letnevPlayer]);

      const tokens = getStatusPhaseTokenGain(state, 'player1');

      expect(tokens).toBe(2);
    });

    it('should return 3 tokens for Sol (Versatile)', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const tokens = getStatusPhaseTokenGain(state, 'player1');

      expect(tokens).toBe(3);
    });
  });
});

// =============================================================================
// PRODUCTION MODIFIER TESTS
// =============================================================================

describe('Production Modifiers', () => {
  describe('getProductionModifiers', () => {
    it('should block infantry production for Arborec', () => {
      const arborecPlayer = createMockPlayer('player1', 'arborec');
      const state = createMockGameState([arborecPlayer]);

      const modifiers = getProductionModifiers(state, 'player1');

      expect(modifiers.blockedUnits).toContain('infantry');
    });

    it('should not block any units for normal factions', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const modifiers = getProductionModifiers(state, 'player1');

      expect(modifiers.blockedUnits).toEqual([]);
    });
  });

  describe('canProduceUnitType', () => {
    it('should return false for Arborec producing infantry', () => {
      const arborecPlayer = createMockPlayer('player1', 'arborec');
      const state = createMockGameState([arborecPlayer]);

      const canProduce = canProduceUnitType(state, 'player1', 'infantry');

      expect(canProduce).toBe(false);
    });

    it('should return true for Arborec producing other units', () => {
      const arborecPlayer = createMockPlayer('player1', 'arborec');
      const state = createMockGameState([arborecPlayer]);

      expect(canProduceUnitType(state, 'player1', 'fighter')).toBe(true);
      expect(canProduceUnitType(state, 'player1', 'cruiser')).toBe(true);
      expect(canProduceUnitType(state, 'player1', 'mech')).toBe(true);
    });

    it('should return true for Sol producing infantry', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const canProduce = canProduceUnitType(state, 'player1', 'infantry');

      expect(canProduce).toBe(true);
    });
  });

  describe('isFloatingDock', () => {
    it('should return true for Saar faction', () => {
      const saarPlayer = createMockPlayer('player1', 'saar');
      const state = createMockGameState([saarPlayer]);

      expect(isFloatingDock(state, 'player1')).toBe(true);
    });

    it('should return false for non-Saar factions', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      expect(isFloatingDock(state, 'player1')).toBe(false);
    });
  });

  describe('getSaarProductionCapacity', () => {
    it('should return 5 per floating space dock in system', () => {
      const saarPlayer = createMockPlayer('player1', 'saar');
      const state = createMockGameState([saarPlayer]);

      const tile = createMockTile('system1', {
        units: [
          { id: 'dock1', type: 'space_dock', ownerId: 'player1', damaged: false },
        ],
      });
      state.map.tiles = [tile];

      const capacity = getSaarProductionCapacity(state, 'player1', 'system1');

      expect(capacity).toBe(5);
    });

    it('should return 10 for two floating space docks', () => {
      const saarPlayer = createMockPlayer('player1', 'saar');
      const state = createMockGameState([saarPlayer]);

      const tile = createMockTile('system1', {
        units: [
          { id: 'dock1', type: 'space_dock', ownerId: 'player1', damaged: false },
          { id: 'dock2', type: 'space_dock', ownerId: 'player1', damaged: false },
        ],
      });
      state.map.tiles = [tile];

      const capacity = getSaarProductionCapacity(state, 'player1', 'system1');

      expect(capacity).toBe(10);
    });

    it('should return 0 for non-Saar factions', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const tile = createMockTile('system1');
      state.map.tiles = [tile];

      const capacity = getSaarProductionCapacity(state, 'player1', 'system1');

      expect(capacity).toBe(0);
    });
  });
});

// =============================================================================
// MOVEMENT MODIFIER TESTS
// =============================================================================

describe('Movement Modifiers', () => {
  describe('getMovementModifiers', () => {
    it('should give Muaat immunity to supernova', () => {
      const muaatPlayer = createMockPlayer('player1', 'muaat');
      const state = createMockGameState([muaatPlayer]);

      const modifiers = getMovementModifiers(state, 'player1', null);

      expect(modifiers.immuneToAnomalies).toContain('supernova');
    });

    // Note: Empyrean is a Prophecy of Kings expansion faction
    // The nebula immunity test would be added when POK factions are implemented

    it('should give Creuss +1 movement from home system (Slipstream)', () => {
      const creussPlayer = createMockPlayer('player1', 'creuss');
      const state = createMockGameState([creussPlayer]);

      // Create Creuss home system tile (systemId 51)
      const homeTile = createMockTile('home', { systemId: 51 });
      state.map.tiles = [homeTile];

      const modifiers = getMovementModifiers(state, 'player1', homeTile);

      expect(modifiers.movementBonus).toBe(1);
    });

    it('should give Creuss +1 movement from wormhole system (Slipstream)', () => {
      const creussPlayer = createMockPlayer('player1', 'creuss');
      const state = createMockGameState([creussPlayer]);

      const wormholeTile = createMockTile('wormhole', { wormhole: 'alpha' });
      state.map.tiles = [wormholeTile];

      const modifiers = getMovementModifiers(state, 'player1', wormholeTile);

      expect(modifiers.movementBonus).toBe(1);
    });

    it('should give zero movement bonus for normal factions', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const modifiers = getMovementModifiers(state, 'player1', null);

      expect(modifiers.movementBonus).toBe(0);
    });
  });

  describe('areSystemsAdjacent', () => {
    it('should return true for hex-adjacent systems', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const tile1 = createMockTile('1', { position: { q: 0, r: 0 } });
      const tile2 = createMockTile('2', { position: { q: 1, r: 0 } });
      state.map.tiles = [tile1, tile2];

      expect(areSystemsAdjacent(state, 'player1', tile1, tile2)).toBe(true);
    });

    it('should return false for non-adjacent systems', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const tile1 = createMockTile('1', { position: { q: 0, r: 0 } });
      const tile2 = createMockTile('2', { position: { q: 3, r: 0 } });
      state.map.tiles = [tile1, tile2];

      expect(areSystemsAdjacent(state, 'player1', tile1, tile2)).toBe(false);
    });

    it('should return true for same-type wormholes', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const tile1 = createMockTile('1', { position: { q: 0, r: 0 }, wormhole: 'alpha' });
      const tile2 = createMockTile('2', { position: { q: 5, r: 5 }, wormhole: 'alpha' });
      state.map.tiles = [tile1, tile2];

      expect(areSystemsAdjacent(state, 'player1', tile1, tile2)).toBe(true);
    });

    it('should return false for different-type wormholes (non-Creuss)', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const tile1 = createMockTile('1', { position: { q: 0, r: 0 }, wormhole: 'alpha' });
      const tile2 = createMockTile('2', { position: { q: 5, r: 5 }, wormhole: 'beta' });
      state.map.tiles = [tile1, tile2];

      expect(areSystemsAdjacent(state, 'player1', tile1, tile2)).toBe(false);
    });

    it('should return true for alpha/beta wormholes for Creuss (Quantum Entanglement)', () => {
      const creussPlayer = createMockPlayer('player1', 'creuss');
      const state = createMockGameState([creussPlayer]);

      const tile1 = createMockTile('1', { position: { q: 0, r: 0 }, wormhole: 'alpha' });
      const tile2 = createMockTile('2', { position: { q: 5, r: 5 }, wormhole: 'beta' });
      state.map.tiles = [tile1, tile2];

      expect(areSystemsAdjacent(state, 'player1', tile1, tile2)).toBe(true);
    });
  });

  describe('doesSystemBlockMovement', () => {
    it('should block supernova for normal factions', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const supernovaTile = createMockTile('supernova', { anomaly: 'supernova' });
      state.map.tiles = [supernovaTile];

      expect(doesSystemBlockMovement(state, 'player1', supernovaTile)).toBe(true);
    });

    it('should not block supernova for Muaat (Gashlai Physiology)', () => {
      const muaatPlayer = createMockPlayer('player1', 'muaat');
      const state = createMockGameState([muaatPlayer]);

      const supernovaTile = createMockTile('supernova', { anomaly: 'supernova' });
      state.map.tiles = [supernovaTile];

      expect(doesSystemBlockMovement(state, 'player1', supernovaTile)).toBe(false);
    });

    it('should not block normal systems', () => {
      const solPlayer = createMockPlayer('player1', 'sol');
      const state = createMockGameState([solPlayer]);

      const normalTile = createMockTile('normal');
      state.map.tiles = [normalTile];

      expect(doesSystemBlockMovement(state, 'player1', normalTile)).toBe(false);
    });
  });
});

// =============================================================================
// COMBINED INTEGRATION TESTS
// =============================================================================

describe('Ability Integration', () => {
  it('should correctly combine multiple faction abilities', () => {
    // Sardakk has +1 combat, +2 fleet from flagship
    const sardakkPlayer = createMockPlayer('player1', 'sardakk');
    const state = createMockGameState([sardakkPlayer]);

    const combatMods = getCombatModifiers(state, 'player1', 'space');
    const fleetMods = getFleetModifiers(state, 'player1');

    expect(combatMods.hitModifier).toBe(1); // Unrelenting
    expect(fleetMods.fleetLimitBonus).toBe(0); // No fleet bonus (not Letnev)
  });

  it('should return default modifiers for unknown factions', () => {
    const unknownPlayer = createMockPlayer('player1', 'unknown_faction');
    const state = createMockGameState([unknownPlayer]);

    const combatMods = getCombatModifiers(state, 'player1', 'space');
    const movementMods = getMovementModifiers(state, 'player1', null);
    const fleetMods = getFleetModifiers(state, 'player1');
    const prodMods = getProductionModifiers(state, 'player1');

    expect(combatMods.hitModifier).toBe(0);
    expect(movementMods.movementBonus).toBe(0);
    expect(fleetMods.fleetLimitBonus).toBe(0);
    expect(prodMods.blockedUnits).toEqual([]);
  });
});
