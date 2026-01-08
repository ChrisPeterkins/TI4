/**
 * Tests for Thunder's Edge Expedition System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  GameState,
  PlayerState,
  ExpeditionState,
  ExpeditionSlice,
  PlanetState,
} from '@ti4/shared';
import {
  initializeExpedition,
  initializePlayerBreakthrough,
  validateExpeditionClaim,
  handleClaimExpeditionSlice,
  unlockBreakthrough,
  exhaustBreakthrough,
  readyBreakthrough,
  checkTechSynergy,
  canClaimExpedition,
  getPlayerSliceCount,
  type ExpeditionPayment,
  type ClaimExpeditionSliceAction,
} from '../expedition.js';

// ============================================================================
// Test Utilities
// ============================================================================

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Test Player',
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 5,
    commodities: 2,
    maxCommodities: 4,
    technologies: ['neural_motivator', 'sarween_tools'],
    actionCards: ['sabotage_1', 'direct_hit_1', 'morale_boost_1'],
    secretObjectives: ['become_a_legend'],
    scoredObjectives: [],
    promissoryNotesOwned: ['sol_pn'],
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    planets: [
      { planetId: 'jord', exhausted: false, attachments: [] } as PlanetState,
      { planetId: 'mars', exhausted: false, attachments: [] } as PlanetState,
    ],
    strategyCard: null,
    strategyCardUsed: false,
    passed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
    ...overrides,
  } as PlayerState;
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: ['player1', 'player2'],
    players: [
      createMockPlayer({ id: 'player1', faction: 'sol' }),
      createMockPlayer({ id: 'player2', faction: 'hacan' }),
    ],
    map: { tiles: [], playerCount: 6 },
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
    expeditionState: initializeExpedition(),
    ...overrides,
  } as GameState;
}

// ============================================================================
// Initialization Tests
// ============================================================================

describe('Expedition Initialization', () => {
  describe('initializeExpedition', () => {
    it('should create expedition state with 6 slices', () => {
      const expedition = initializeExpedition();

      expect(expedition.slices).toHaveLength(6);
      expect(expedition.claimOrder).toHaveLength(0);
      expect(expedition.completed).toBe(false);
    });

    it('should have correct cost types for each slice', () => {
      const expedition = initializeExpedition();

      expect(expedition.slices[0].costType).toBe('resources_5');
      expect(expedition.slices[1].costType).toBe('action_cards_2');
      expect(expedition.slices[2].costType).toBe('influence_5');
      expect(expedition.slices[3].costType).toBe('secret_objective');
      expect(expedition.slices[4].costType).toBe('tech_specialty');
      expect(expedition.slices[5].costType).toBe('trade_goods_3');
    });

    it('should have all slices unclaimed', () => {
      const expedition = initializeExpedition();

      for (const slice of expedition.slices) {
        expect(slice.claimed).toBe(false);
        expect(slice.claimedBy).toBeUndefined();
      }
    });
  });

  describe('initializePlayerBreakthrough', () => {
    it('should create breakthrough state for valid faction', () => {
      const breakthrough = initializePlayerBreakthrough('sol');

      expect(breakthrough).toBeDefined();
      expect(breakthrough?.breakthroughId).toBe('bellum_gloriosum');
      expect(breakthrough?.unlocked).toBe(false);
      expect(breakthrough?.exhausted).toBe(false);
    });

    it('should return undefined for invalid faction', () => {
      const breakthrough = initializePlayerBreakthrough('invalid_faction');

      expect(breakthrough).toBeUndefined();
    });

    it('should initialize special tracking for Firmament', () => {
      const breakthrough = initializePlayerBreakthrough('firmament');

      expect(breakthrough?.tradeGoodsOnCard).toBe(0);
    });

    it('should initialize special tracking for Ral Nel', () => {
      const breakthrough = initializePlayerBreakthrough('ral_nel');

      expect(breakthrough?.collectedCards).toEqual([]);
    });
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('Expedition Validation', () => {
  describe('validateExpeditionClaim', () => {
    it('should fail if expedition not initialized', () => {
      const state = createMockGameState({ expeditionState: undefined });
      const payment: ExpeditionPayment = { tradeGoods: 3 };

      const result = validateExpeditionClaim(state, 'player1', 6, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Expedition not initialized');
    });

    it('should fail if expedition already completed', () => {
      const state = createMockGameState();
      state.expeditionState!.completed = true;
      const payment: ExpeditionPayment = { tradeGoods: 3 };

      const result = validateExpeditionClaim(state, 'player1', 6, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Expedition already completed');
    });

    it('should fail if slice already claimed', () => {
      const state = createMockGameState();
      state.expeditionState!.slices[5].claimed = true;
      const payment: ExpeditionPayment = { tradeGoods: 3 };

      const result = validateExpeditionClaim(state, 'player1', 6, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Slice already claimed');
    });

    it('should fail if player already claimed a slice', () => {
      const state = createMockGameState();
      state.expeditionState!.claimOrder.push('player1');
      const payment: ExpeditionPayment = { tradeGoods: 3 };

      const result = validateExpeditionClaim(state, 'player1', 6, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player has already claimed a slice');
    });

    it('should fail with insufficient trade goods', () => {
      const state = createMockGameState();
      state.players[0].tradeGoods = 2;
      const payment: ExpeditionPayment = { tradeGoods: 3 };

      const result = validateExpeditionClaim(state, 'player1', 6, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Insufficient trade goods');
    });

    it('should succeed with valid trade goods payment', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { tradeGoods: 3 };

      const result = validateExpeditionClaim(state, 'player1', 6, payment);

      expect(result.valid).toBe(true);
    });

    it('should fail with insufficient action cards', () => {
      const state = createMockGameState();
      state.players[0].actionCards = ['sabotage_1'];
      const payment: ExpeditionPayment = { actionCardIds: ['sabotage_1', 'nonexistent'] };

      const result = validateExpeditionClaim(state, 'player1', 2, payment);

      expect(result.valid).toBe(false);
    });

    it('should succeed with valid action card payment', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { actionCardIds: ['sabotage_1', 'direct_hit_1'] };

      const result = validateExpeditionClaim(state, 'player1', 2, payment);

      expect(result.valid).toBe(true);
    });
  });
});

// ============================================================================
// Handler Tests
// ============================================================================

describe('Expedition Handlers', () => {
  describe('handleClaimExpeditionSlice', () => {
    it('should claim slice and deduct payment', () => {
      const state = createMockGameState();
      const action: ClaimExpeditionSliceAction = {
        type: 'claim_expedition_slice',
        playerId: 'player1',
        sliceNumber: 6,
        payment: { tradeGoods: 3 },
      };

      const result = handleClaimExpeditionSlice(state, action);

      expect(result.success).toBe(true);
      expect(state.expeditionState!.slices[5].claimed).toBe(true);
      expect(state.expeditionState!.slices[5].claimedBy).toBe('player1');
      expect(state.players[0].tradeGoods).toBe(2); // 5 - 3
    });

    it('should unlock breakthrough on first claim', () => {
      const state = createMockGameState();
      // Give player the required tech synergy for Sol (yellow/green)
      state.players[0].technologies = ['sarween_tools', 'neural_motivator']; // yellow, green
      state.players[0].breakthrough = initializePlayerBreakthrough('sol');

      const action: ClaimExpeditionSliceAction = {
        type: 'claim_expedition_slice',
        playerId: 'player1',
        sliceNumber: 6,
        payment: { tradeGoods: 3 },
      };

      const result = handleClaimExpeditionSlice(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('breakthrough_unlocked');
    });

    it('should add player to claim order', () => {
      const state = createMockGameState();
      const action: ClaimExpeditionSliceAction = {
        type: 'claim_expedition_slice',
        playerId: 'player1',
        sliceNumber: 6,
        payment: { tradeGoods: 3 },
      };

      handleClaimExpeditionSlice(state, action);

      expect(state.expeditionState!.claimOrder).toContain('player1');
    });
  });
});

// ============================================================================
// Breakthrough Management Tests
// ============================================================================

describe('Breakthrough Management', () => {
  describe('unlockBreakthrough', () => {
    it('should unlock breakthrough with valid tech synergy', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'sol';
      player.technologies = ['sarween_tools', 'neural_motivator']; // yellow, green
      player.breakthrough = initializePlayerBreakthrough('sol');

      const result = unlockBreakthrough(state, player);

      expect(result.success).toBe(true);
      expect(player.breakthrough?.unlocked).toBe(true);
    });

    it('should fail without tech synergy', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'sol';
      player.technologies = ['plasma_scoring']; // Only red, need yellow+green
      player.breakthrough = initializePlayerBreakthrough('sol');

      const result = unlockBreakthrough(state, player);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing tech synergy');
    });

    it('should auto-unlock for Crimson Rebellion', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'crimson_rebellion';
      player.technologies = []; // No tech needed
      player.breakthrough = initializePlayerBreakthrough('crimson_rebellion');

      const result = unlockBreakthrough(state, player);

      expect(result.success).toBe(true);
      expect(player.breakthrough?.unlocked).toBe(true);
    });
  });

  describe('exhaustBreakthrough', () => {
    it('should exhaust exhaustable breakthrough', () => {
      const player = createMockPlayer({
        faction: 'arborec',
        breakthrough: {
          breakthroughId: 'psychospore',
          unlocked: true,
          exhausted: false,
        },
      });

      const result = exhaustBreakthrough(player);

      expect(result.success).toBe(true);
      expect(player.breakthrough?.exhausted).toBe(true);
    });

    it('should fail if already exhausted', () => {
      const player = createMockPlayer({
        faction: 'arborec',
        breakthrough: {
          breakthroughId: 'psychospore',
          unlocked: true,
          exhausted: true,
        },
      });

      const result = exhaustBreakthrough(player);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Breakthrough already exhausted');
    });

    it('should fail for non-exhaustable breakthrough', () => {
      const player = createMockPlayer({
        faction: 'sol',
        breakthrough: {
          breakthroughId: 'bellum_gloriosum',
          unlocked: true,
          exhausted: false,
        },
      });

      const result = exhaustBreakthrough(player);

      expect(result.success).toBe(false);
      expect(result.error).toBe('This breakthrough cannot be exhausted');
    });
  });

  describe('readyBreakthrough', () => {
    it('should ready exhausted breakthrough', () => {
      const player = createMockPlayer({
        breakthrough: {
          breakthroughId: 'psychospore',
          unlocked: true,
          exhausted: true,
        },
      });

      readyBreakthrough(player);

      expect(player.breakthrough?.exhausted).toBe(false);
    });
  });

  describe('checkTechSynergy', () => {
    it('should return true with matching tech colors', () => {
      const player = createMockPlayer({
        faction: 'sol',
        technologies: ['sarween_tools', 'neural_motivator'], // yellow, green
      });

      expect(checkTechSynergy(player)).toBe(true);
    });

    it('should return false without matching tech colors', () => {
      const player = createMockPlayer({
        faction: 'sol',
        technologies: ['plasma_scoring'], // Only red
      });

      expect(checkTechSynergy(player)).toBe(false);
    });
  });

  describe('canClaimExpedition', () => {
    it('should return true for eligible player', () => {
      const state = createMockGameState();

      expect(canClaimExpedition(state, 'player1')).toBe(true);
    });

    it('should return false if player already claimed', () => {
      const state = createMockGameState();
      state.expeditionState!.claimOrder.push('player1');

      expect(canClaimExpedition(state, 'player1')).toBe(false);
    });

    it('should return false if expedition completed', () => {
      const state = createMockGameState();
      state.expeditionState!.completed = true;

      expect(canClaimExpedition(state, 'player1')).toBe(false);
    });

    it('should return false if no expedition state', () => {
      const state = createMockGameState({ expeditionState: undefined });

      expect(canClaimExpedition(state, 'player1')).toBe(false);
    });

    it('should return false if all slices claimed', () => {
      const state = createMockGameState();
      // Mark all slices as claimed
      state.expeditionState!.slices.forEach(s => { s.claimed = true; });

      expect(canClaimExpedition(state, 'player1')).toBe(false);
    });
  });

  describe('getPlayerSliceCount', () => {
    it('should return 0 when player has no claims', () => {
      const expedition = initializeExpedition();

      expect(getPlayerSliceCount(expedition, 'player1')).toBe(0);
    });

    it('should return correct count when player has claims', () => {
      const expedition = initializeExpedition();
      expedition.slices[0].claimedBy = 'player1';
      expedition.slices[2].claimedBy = 'player1';

      expect(getPlayerSliceCount(expedition, 'player1')).toBe(2);
    });

    it('should not count other players claims', () => {
      const expedition = initializeExpedition();
      expedition.slices[0].claimedBy = 'player1';
      expedition.slices[1].claimedBy = 'player2';
      expedition.slices[2].claimedBy = 'player1';

      expect(getPlayerSliceCount(expedition, 'player1')).toBe(2);
      expect(getPlayerSliceCount(expedition, 'player2')).toBe(1);
    });
  });
});

// ============================================================================
// Additional Validation Tests
// ============================================================================

describe('Expedition Validation - Edge Cases', () => {
  describe('validateExpeditionClaim - slice validation', () => {
    it('should fail with invalid slice number', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { tradeGoods: 3 };

      const result = validateExpeditionClaim(state, 'player1', 99, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid slice number');
    });

    it('should fail when player not found', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { tradeGoods: 3 };

      const result = validateExpeditionClaim(state, 'nonexistent', 6, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });
  });

  describe('validateExpeditionClaim - resources_5 payment', () => {
    it('should fail without exhausted planets', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = {};

      const result = validateExpeditionClaim(state, 'player1', 1, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must exhaust planets for resources');
    });

    it('should fail with insufficient resources from planets', () => {
      const state = createMockGameState();
      // Only 1 planet = 2 resources (per placeholder), need 5
      const payment: ExpeditionPayment = { exhaustedPlanets: ['jord'] };

      const result = validateExpeditionClaim(state, 'player1', 1, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Insufficient resources (need 5)');
    });

    it('should succeed with enough planets for resources', () => {
      const state = createMockGameState();
      // 3 planets = 6 resources (per placeholder), need 5
      state.players[0].planets = [
        { planetId: 'jord', exhausted: false, attachments: [] } as PlanetState,
        { planetId: 'mars', exhausted: false, attachments: [] } as PlanetState,
        { planetId: 'earth', exhausted: false, attachments: [] } as PlanetState,
      ];
      const payment: ExpeditionPayment = { exhaustedPlanets: ['jord', 'mars', 'earth'] };

      const result = validateExpeditionClaim(state, 'player1', 1, payment);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateExpeditionClaim - influence_5 payment', () => {
    it('should fail without exhausted planets', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = {};

      const result = validateExpeditionClaim(state, 'player1', 3, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must exhaust planets for influence');
    });

    it('should fail with insufficient influence from planets', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { exhaustedPlanets: ['jord'] };

      const result = validateExpeditionClaim(state, 'player1', 3, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Insufficient influence (need 5)');
    });

    it('should succeed with enough planets for influence', () => {
      const state = createMockGameState();
      state.players[0].planets = [
        { planetId: 'jord', exhausted: false, attachments: [] } as PlanetState,
        { planetId: 'mars', exhausted: false, attachments: [] } as PlanetState,
        { planetId: 'earth', exhausted: false, attachments: [] } as PlanetState,
      ];
      const payment: ExpeditionPayment = { exhaustedPlanets: ['jord', 'mars', 'earth'] };

      const result = validateExpeditionClaim(state, 'player1', 3, payment);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateExpeditionClaim - action_cards_2 payment', () => {
    it('should fail without action cards', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = {};

      const result = validateExpeditionClaim(state, 'player1', 2, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must discard 2 action cards');
    });

    it('should fail with only 1 action card', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { actionCardIds: ['sabotage_1'] };

      const result = validateExpeditionClaim(state, 'player1', 2, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must discard 2 action cards');
    });

    it('should fail when player does not have specified card', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { actionCardIds: ['sabotage_1', 'card_not_owned'] };

      const result = validateExpeditionClaim(state, 'player1', 2, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Player does not have action card');
    });
  });

  describe('validateExpeditionClaim - secret_objective payment', () => {
    it('should fail without secret objective', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = {};

      const result = validateExpeditionClaim(state, 'player1', 4, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must discard a secret objective');
    });

    it('should fail when player does not have the objective', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { secretObjectiveId: 'objective_not_owned' };

      const result = validateExpeditionClaim(state, 'player1', 4, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player does not have that secret objective');
    });

    it('should succeed with valid secret objective', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { secretObjectiveId: 'become_a_legend' };

      const result = validateExpeditionClaim(state, 'player1', 4, payment);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateExpeditionClaim - tech_specialty payment', () => {
    it('should fail without tech specialty planet', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = {};

      const result = validateExpeditionClaim(state, 'player1', 5, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must exhaust a planet with technology specialty');
    });

    it('should fail when player does not control planet', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { techSpecialtyPlanetId: 'planet_not_controlled' };

      const result = validateExpeditionClaim(state, 'player1', 5, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player does not control that planet');
    });

    it('should fail when planet is already exhausted', () => {
      const state = createMockGameState();
      state.players[0].planets[0].exhausted = true;
      const payment: ExpeditionPayment = { techSpecialtyPlanetId: 'jord' };

      const result = validateExpeditionClaim(state, 'player1', 5, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Planet is already exhausted');
    });

    it('should succeed with valid tech specialty planet', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { techSpecialtyPlanetId: 'jord' };

      const result = validateExpeditionClaim(state, 'player1', 5, payment);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateExpeditionClaim - trade_goods_3 payment', () => {
    it('should fail with insufficient trade goods specified', () => {
      const state = createMockGameState();
      const payment: ExpeditionPayment = { tradeGoods: 2 };

      const result = validateExpeditionClaim(state, 'player1', 6, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must spend 3 trade goods');
    });

    it('should fail when player has insufficient trade goods', () => {
      const state = createMockGameState();
      state.players[0].tradeGoods = 1;
      const payment: ExpeditionPayment = { tradeGoods: 3 };

      const result = validateExpeditionClaim(state, 'player1', 6, payment);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Insufficient trade goods');
    });
  });
});

// ============================================================================
// Additional Handler Tests
// ============================================================================

describe('Expedition Handler - Edge Cases', () => {
  describe('handleClaimExpeditionSlice - validation failures', () => {
    it('should return error when validation fails', () => {
      const state = createMockGameState();
      state.players[0].tradeGoods = 0;
      const action: ClaimExpeditionSliceAction = {
        type: 'claim_expedition_slice',
        playerId: 'player1',
        sliceNumber: 6,
        payment: { tradeGoods: 3 },
      };

      const result = handleClaimExpeditionSlice(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient trade goods');
    });
  });

  describe('handleClaimExpeditionSlice - payment application', () => {
    it('should exhaust planets for resources payment', () => {
      const state = createMockGameState();
      state.players[0].planets = [
        { planetId: 'jord', exhausted: false, attachments: [] } as PlanetState,
        { planetId: 'mars', exhausted: false, attachments: [] } as PlanetState,
        { planetId: 'earth', exhausted: false, attachments: [] } as PlanetState,
      ];
      const action: ClaimExpeditionSliceAction = {
        type: 'claim_expedition_slice',
        playerId: 'player1',
        sliceNumber: 1,
        payment: { exhaustedPlanets: ['jord', 'mars', 'earth'] },
      };

      const result = handleClaimExpeditionSlice(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].planets[0].exhausted).toBe(true);
      expect(state.players[0].planets[1].exhausted).toBe(true);
      expect(state.players[0].planets[2].exhausted).toBe(true);
    });

    it('should discard action cards for action_cards_2 payment', () => {
      const state = createMockGameState();
      const action: ClaimExpeditionSliceAction = {
        type: 'claim_expedition_slice',
        playerId: 'player1',
        sliceNumber: 2,
        payment: { actionCardIds: ['sabotage_1', 'direct_hit_1'] },
      };

      const result = handleClaimExpeditionSlice(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].actionCards).not.toContain('sabotage_1');
      expect(state.players[0].actionCards).not.toContain('direct_hit_1');
      expect(state.players[0].actionCards).toContain('morale_boost_1');
    });

    it('should discard secret objective for secret_objective payment', () => {
      const state = createMockGameState();
      const action: ClaimExpeditionSliceAction = {
        type: 'claim_expedition_slice',
        playerId: 'player1',
        sliceNumber: 4,
        payment: { secretObjectiveId: 'become_a_legend' },
      };

      const result = handleClaimExpeditionSlice(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].secretObjectives).not.toContain('become_a_legend');
    });

    it('should exhaust tech specialty planet', () => {
      const state = createMockGameState();
      const action: ClaimExpeditionSliceAction = {
        type: 'claim_expedition_slice',
        playerId: 'player1',
        sliceNumber: 5,
        payment: { techSpecialtyPlanetId: 'jord' },
      };

      const result = handleClaimExpeditionSlice(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].planets[0].exhausted).toBe(true);
    });
  });

  describe('handleClaimExpeditionSlice - expedition completion', () => {
    it('should complete expedition when all slices claimed', () => {
      const state = createMockGameState();
      // Mark 5 slices as claimed by different players
      for (let i = 0; i < 5; i++) {
        state.expeditionState!.slices[i].claimed = true;
        state.expeditionState!.slices[i].claimedBy = `other_player_${i}`;
      }
      // Add enough players
      state.expeditionState!.claimOrder = ['p1', 'p2', 'p3', 'p4', 'p5'];

      const action: ClaimExpeditionSliceAction = {
        type: 'claim_expedition_slice',
        playerId: 'player1',
        sliceNumber: 6,
        payment: { tradeGoods: 3 },
      };

      const result = handleClaimExpeditionSlice(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('expedition_completed');
      expect(state.expeditionState!.completed).toBe(true);
    });

    it('should complete expedition when max players reached', () => {
      const state = createMockGameState();
      // 2 players in game, 1 already claimed
      state.expeditionState!.claimOrder = ['player2'];
      state.expeditionState!.slices[0].claimed = true;
      state.expeditionState!.slices[0].claimedBy = 'player2';

      const action: ClaimExpeditionSliceAction = {
        type: 'claim_expedition_slice',
        playerId: 'player1',
        sliceNumber: 6,
        payment: { tradeGoods: 3 },
      };

      const result = handleClaimExpeditionSlice(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('expedition_completed');
      expect(state.expeditionState!.completed).toBe(true);
    });
  });
});

// ============================================================================
// Additional Breakthrough Tests
// ============================================================================

describe('Breakthrough Management - Edge Cases', () => {
  describe('unlockBreakthrough - edge cases', () => {
    it('should fail if breakthrough already unlocked', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.breakthrough = {
        breakthroughId: 'bellum_gloriosum',
        unlocked: true,
        exhausted: false,
      };

      const result = unlockBreakthrough(state, player);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Breakthrough already unlocked');
    });

    it('should fail for faction with no breakthrough', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'invalid_faction';
      player.breakthrough = undefined;

      const result = unlockBreakthrough(state, player);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Faction has no breakthrough');
    });

    it('should initialize breakthrough if not present', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.faction = 'crimson_rebellion';
      player.breakthrough = undefined;

      const result = unlockBreakthrough(state, player);

      expect(result.success).toBe(true);
      expect(player.breakthrough).toBeDefined();
      expect(player.breakthrough?.unlocked).toBe(true);
    });
  });

  describe('exhaustBreakthrough - edge cases', () => {
    it('should fail if player has no breakthrough', () => {
      const player = createMockPlayer({
        breakthrough: undefined,
      });

      const result = exhaustBreakthrough(player);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player has no breakthrough');
    });

    it('should fail if breakthrough not unlocked', () => {
      const player = createMockPlayer({
        faction: 'arborec',
        breakthrough: {
          breakthroughId: 'psychospore',
          unlocked: false,
          exhausted: false,
        },
      });

      const result = exhaustBreakthrough(player);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Breakthrough not unlocked');
    });
  });

  describe('readyBreakthrough - edge cases', () => {
    it('should do nothing if breakthrough not exhausted', () => {
      const player = createMockPlayer({
        breakthrough: {
          breakthroughId: 'psychospore',
          unlocked: true,
          exhausted: false,
        },
      });

      readyBreakthrough(player);

      expect(player.breakthrough?.exhausted).toBe(false);
    });

    it('should do nothing if no breakthrough', () => {
      const player = createMockPlayer({
        breakthrough: undefined,
      });

      // Should not throw
      readyBreakthrough(player);

      expect(player.breakthrough).toBeUndefined();
    });
  });

  describe('checkTechSynergy - edge cases', () => {
    it('should return false for invalid faction', () => {
      const player = createMockPlayer({
        faction: 'invalid_faction',
      });

      expect(checkTechSynergy(player)).toBe(false);
    });

    it('should return true for faction without synergy requirement', () => {
      const player = createMockPlayer({
        faction: 'nekro',
        technologies: [], // No tech
      });

      // Nekro doesn't need synergy
      expect(checkTechSynergy(player)).toBe(true);
    });
  });
});
