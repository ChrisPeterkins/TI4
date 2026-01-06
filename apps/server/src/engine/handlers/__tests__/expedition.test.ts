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
  });
});
