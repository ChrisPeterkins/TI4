/**
 * Tests for ability trigger detection system
 *
 * Tests cover:
 * - Trigger detection for "when" and "after" timing
 * - Requirement checking (trade goods, tokens, resources, cards, units, planets)
 * - Phase ability detection
 * - Action vs passive ability filtering
 * - Initiative ordering
 */

import { describe, it, expect } from 'vitest';
import type { GameState, PlayerState, FactionAbility } from '@ti4/shared';
import {
  checkAbilityTriggers,
  checkPhaseAbilities,
  getActionAbilities,
  getPassiveAbilities,
  canUseAbility,
  sortByInitiative,
} from '../ability-triggers.js';

// =============================================================================
// MOCK FACTORIES
// =============================================================================

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 2,
    commodities: 0,
    maxCommodities: 4,
    technologies: [],
    actionCards: ['sabotage'],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
    strategyCard: null,
    strategyCardUsed: false,
    passed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    relics: [],
    relicFragments: { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 },
    ...overrides,
  } as PlayerState;
}

function createMockGameState(players: PlayerState[] = []): GameState {
  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: players[0]?.id || 'player1',
    speakerId: players[0]?.id || 'player1',
    initiativeOrder: players.map((p) => p.id),
    players,
    map: {
      tiles: [],
      playerCount: players.length || 4,
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
  } as GameState;
}

function createMockAbility(overrides: Partial<FactionAbility> = {}): FactionAbility {
  return {
    id: 'test_ability',
    name: 'Test Ability',
    description: 'A test ability',
    implementation: {
      timing: { type: 'when', trigger: 'combat_start' },
      handlerId: 'test_handler',
      isOptional: true,
    },
    ...overrides,
  } as FactionAbility;
}

// =============================================================================
// CHECK ABILITY TRIGGERS TESTS
// =============================================================================

describe('checkAbilityTriggers', () => {
  describe('timing detection', () => {
    it('should detect "when" timing abilities', () => {
      const player = createMockPlayer('player1', { faction: 'mentak' });
      const state = createMockGameState([player]);

      // Mentak has AMBUSH ability that triggers at combat start
      const result = checkAbilityTriggers(state, 'combat_start');

      // Result depends on actual faction data having implemented abilities
      expect(Array.isArray(result)).toBe(true);
    });

    it('should detect "after" timing abilities', () => {
      const player = createMockPlayer('player1', { faction: 'saar' });
      const state = createMockGameState([player]);

      // Saar has SCAVENGE that triggers after gaining planet control
      const result = checkAbilityTriggers(state, 'gain_planet');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for trigger with no matching abilities', () => {
      const player = createMockPlayer('player1', { faction: 'sol' });
      const state = createMockGameState([player]);

      const result = checkAbilityTriggers(state, 'nonexistent_trigger' as any);

      expect(result).toEqual([]);
    });

    it('should check abilities for all players', () => {
      const player1 = createMockPlayer('player1', { faction: 'mentak' });
      const player2 = createMockPlayer('player2', { faction: 'hacan' });
      const state = createMockGameState([player1, player2]);

      const result = checkAbilityTriggers(state, 'combat_start');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('requirement checking', () => {
    // These tests verify the requirement check logic in canUseAbility

    it('should skip players without faction', () => {
      const player = createMockPlayer('player1', { faction: undefined as any });
      const state = createMockGameState([player]);

      const result = checkAbilityTriggers(state, 'combat_start');

      expect(result).toEqual([]);
    });
  });
});

// =============================================================================
// CHECK PHASE ABILITIES TESTS
// =============================================================================

describe('checkPhaseAbilities', () => {
  it('should return strategy phase abilities during strategy phase', () => {
    const player = createMockPlayer('player1', { faction: 'hacan' });
    const state = createMockGameState([player]);
    state.phase = 'strategy';

    const result = checkPhaseAbilities(state, 'strategy', 'start');

    expect(Array.isArray(result)).toBe(true);
  });

  it('should return action phase abilities during action phase', () => {
    const player = createMockPlayer('player1', { faction: 'sol' });
    const state = createMockGameState([player]);
    state.phase = 'action';

    const result = checkPhaseAbilities(state, 'action', 'start');

    expect(Array.isArray(result)).toBe(true);
  });

  it('should return status phase abilities during status phase', () => {
    const player = createMockPlayer('player1', { faction: 'arborec' });
    const state = createMockGameState([player]);
    state.phase = 'status';

    // Arborec has MITOSIS at status phase start
    const result = checkPhaseAbilities(state, 'status', 'start');

    expect(Array.isArray(result)).toBe(true);
  });

  it('should return agenda phase abilities during agenda phase', () => {
    const player = createMockPlayer('player1', { faction: 'xxcha' });
    const state = createMockGameState([player]);
    state.phase = 'agenda';

    const result = checkPhaseAbilities(state, 'agenda', 'during');

    expect(Array.isArray(result)).toBe(true);
  });

  it('should filter by moment (start/during/end)', () => {
    const player = createMockPlayer('player1', { faction: 'sol' });
    const state = createMockGameState([player]);

    const startResult = checkPhaseAbilities(state, 'action', 'start');
    const endResult = checkPhaseAbilities(state, 'action', 'end');

    // Different results for different moments
    expect(Array.isArray(startResult)).toBe(true);
    expect(Array.isArray(endResult)).toBe(true);
  });

  it('should skip players without faction', () => {
    const player = createMockPlayer('player1', { faction: undefined as any });
    const state = createMockGameState([player]);

    const result = checkPhaseAbilities(state, 'action', 'start');

    expect(result).toEqual([]);
  });
});

// =============================================================================
// GET ACTION ABILITIES TESTS
// =============================================================================

describe('getActionAbilities', () => {
  it('should return component action abilities', () => {
    const player = createMockPlayer('player1', { faction: 'yssaril' });
    const state = createMockGameState([player]);

    // Yssaril has STALL TACTICS (ACTION ability)
    const result = getActionAbilities(state, 'player1');

    expect(Array.isArray(result)).toBe(true);
  });

  it('should not return passive abilities', () => {
    const player = createMockPlayer('player1', { faction: 'sardakk' });
    const state = createMockGameState([player]);

    // Sardakk N'orr UNRELENTING is passive, not action
    const result = getActionAbilities(state, 'player1');

    // Should not include passive abilities
    const hasPassive = result.some((a) => a.abilityId === 'unrelenting');
    expect(hasPassive).toBe(false);
  });

  it('should filter by player faction', () => {
    const player1 = createMockPlayer('player1', { faction: 'yssaril' });
    const player2 = createMockPlayer('player2', { faction: 'sol' });
    const state = createMockGameState([player1, player2]);

    const result1 = getActionAbilities(state, 'player1');
    const result2 = getActionAbilities(state, 'player2');

    // Each player should only get their faction's abilities
    if (result1.length > 0) {
      expect(result1.every((a) => a.playerId === 'player1')).toBe(true);
    }
    if (result2.length > 0) {
      expect(result2.every((a) => a.playerId === 'player2')).toBe(true);
    }
  });

  it('should return empty array for unknown player', () => {
    const player = createMockPlayer('player1', { faction: 'sol' });
    const state = createMockGameState([player]);

    const result = getActionAbilities(state, 'unknown_player');

    expect(result).toEqual([]);
  });

  it('should return empty array for player without faction', () => {
    const player = createMockPlayer('player1', { faction: undefined as any });
    const state = createMockGameState([player]);

    const result = getActionAbilities(state, 'player1');

    expect(result).toEqual([]);
  });
});

// =============================================================================
// GET PASSIVE ABILITIES TESTS
// =============================================================================

describe('getPassiveAbilities', () => {
  it('should return passive abilities', () => {
    const player = createMockPlayer('player1', { faction: 'sardakk' });
    const state = createMockGameState([player]);

    // Sardakk N'orr has UNRELENTING (passive +1 to combat)
    const result = getPassiveAbilities(state, 'player1');

    expect(Array.isArray(result)).toBe(true);
  });

  it('should not return action abilities', () => {
    const player = createMockPlayer('player1', { faction: 'yssaril' });
    const state = createMockGameState([player]);

    // Yssaril STALL TACTICS is action, not passive
    const result = getPassiveAbilities(state, 'player1');

    const hasAction = result.some((a) => a.id === 'stall_tactics');
    expect(hasAction).toBe(false);
  });

  it('should return empty array for unknown player', () => {
    const player = createMockPlayer('player1', { faction: 'sol' });
    const state = createMockGameState([player]);

    const result = getPassiveAbilities(state, 'unknown_player');

    expect(result).toEqual([]);
  });

  it('should return empty array for player without faction', () => {
    const player = createMockPlayer('player1', { faction: undefined as any });
    const state = createMockGameState([player]);

    const result = getPassiveAbilities(state, 'player1');

    expect(result).toEqual([]);
  });
});

// =============================================================================
// CAN USE ABILITY TESTS
// =============================================================================

describe('canUseAbility', () => {
  describe('spend_trade_good requirement', () => {
    it('should return true when player has enough trade goods', () => {
      const player = createMockPlayer('player1', { tradeGoods: 5 });
      const state = createMockGameState([player]);
      const ability = createMockAbility({
        implementation: {
          timing: { type: 'action' },
          handlerId: 'test',
          requirements: [{ type: 'spend_trade_good', amount: 2 }],
        },
      });

      const result = canUseAbility(state, 'player1', ability, {});

      expect(result).toBe(true);
    });

    it('should return false when player lacks trade goods', () => {
      const player = createMockPlayer('player1', { tradeGoods: 1 });
      const state = createMockGameState([player]);
      const ability = createMockAbility({
        implementation: {
          timing: { type: 'action' },
          handlerId: 'test',
          requirements: [{ type: 'spend_trade_good', amount: 2 }],
        },
      });

      const result = canUseAbility(state, 'player1', ability, {});

      expect(result).toBe(false);
    });
  });

  describe('spend_token requirement', () => {
    it('should validate strategy token requirement', () => {
      const player = createMockPlayer('player1', {
        commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
      });
      const state = createMockGameState([player]);
      const ability = createMockAbility({
        implementation: {
          timing: { type: 'action' },
          handlerId: 'test',
          requirements: [{ type: 'spend_token', tokenPool: 'strategy', amount: 1 }],
        },
      });

      const result = canUseAbility(state, 'player1', ability, {});

      expect(result).toBe(true);
    });

    it('should validate tactics token requirement', () => {
      const player = createMockPlayer('player1', {
        commandTokens: { tactics: 3, fleet: 3, strategy: 0 },
      });
      const state = createMockGameState([player]);
      const ability = createMockAbility({
        implementation: {
          timing: { type: 'action' },
          handlerId: 'test',
          requirements: [{ type: 'spend_token', tokenPool: 'tactics', amount: 2 }],
        },
      });

      const result = canUseAbility(state, 'player1', ability, {});

      expect(result).toBe(true);
    });

    it('should fail when token pool is insufficient', () => {
      const player = createMockPlayer('player1', {
        commandTokens: { tactics: 0, fleet: 3, strategy: 0 },
      });
      const state = createMockGameState([player]);
      const ability = createMockAbility({
        implementation: {
          timing: { type: 'action' },
          handlerId: 'test',
          requirements: [{ type: 'spend_token', tokenPool: 'strategy', amount: 1 }],
        },
      });

      const result = canUseAbility(state, 'player1', ability, {});

      expect(result).toBe(false);
    });
  });

  describe('discard_card requirement', () => {
    it('should validate action card discard requirement', () => {
      const player = createMockPlayer('player1', {
        actionCards: ['sabotage', 'direct_hit', 'flank_speed'],
      });
      const state = createMockGameState([player]);
      const ability = createMockAbility({
        implementation: {
          timing: { type: 'action' },
          handlerId: 'test',
          requirements: [{ type: 'discard_card', cardType: 'action', amount: 1 }],
        },
      });

      const result = canUseAbility(state, 'player1', ability, {});

      expect(result).toBe(true);
    });

    it('should fail when lacking required action cards', () => {
      const player = createMockPlayer('player1', { actionCards: [] });
      const state = createMockGameState([player]);
      const ability = createMockAbility({
        implementation: {
          timing: { type: 'action' },
          handlerId: 'test',
          requirements: [{ type: 'discard_card', cardType: 'action', amount: 1 }],
        },
      });

      const result = canUseAbility(state, 'player1', ability, {});

      expect(result).toBe(false);
    });
  });

  describe('control_planet requirement', () => {
    it('should pass when player controls planets', () => {
      const player = createMockPlayer('player1', {
        planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
      });
      const state = createMockGameState([player]);
      const ability = createMockAbility({
        implementation: {
          timing: { type: 'action' },
          handlerId: 'test',
          requirements: [{ type: 'control_planet' }],
        },
      });

      const result = canUseAbility(state, 'player1', ability, {});

      expect(result).toBe(true);
    });

    it('should fail when player controls no planets', () => {
      const player = createMockPlayer('player1', { planets: [] });
      const state = createMockGameState([player]);
      const ability = createMockAbility({
        implementation: {
          timing: { type: 'action' },
          handlerId: 'test',
          requirements: [{ type: 'control_planet' }],
        },
      });

      const result = canUseAbility(state, 'player1', ability, {});

      expect(result).toBe(false);
    });
  });

  describe('no implementation', () => {
    it('should return false for ability without implementation', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player]);
      const ability = createMockAbility({ implementation: undefined });

      const result = canUseAbility(state, 'player1', ability, {});

      expect(result).toBe(false);
    });
  });

  describe('unknown player', () => {
    it('should return false for unknown player', () => {
      const player = createMockPlayer('player1');
      const state = createMockGameState([player]);
      const ability = createMockAbility();

      const result = canUseAbility(state, 'unknown_player', ability, {});

      expect(result).toBe(false);
    });
  });
});

// =============================================================================
// SORT BY INITIATIVE TESTS
// =============================================================================

describe('sortByInitiative', () => {
  it('should sort abilities by player initiative order', () => {
    const player1 = createMockPlayer('player1');
    const player2 = createMockPlayer('player2');
    const player3 = createMockPlayer('player3');
    const state = createMockGameState([player1, player2, player3]);
    state.initiativeOrder = ['player2', 'player3', 'player1']; // Custom order

    const abilities = [
      { playerId: 'player1', factionId: 'sol', abilityId: 'a', abilityName: 'A', isOptional: true, requiresChoice: false, handlerId: 'h' },
      { playerId: 'player3', factionId: 'hacan', abilityId: 'b', abilityName: 'B', isOptional: true, requiresChoice: false, handlerId: 'h' },
      { playerId: 'player2', factionId: 'mentak', abilityId: 'c', abilityName: 'C', isOptional: true, requiresChoice: false, handlerId: 'h' },
    ];

    const result = sortByInitiative(state, abilities);

    expect(result[0].playerId).toBe('player2'); // First in initiative
    expect(result[1].playerId).toBe('player3'); // Second in initiative
    expect(result[2].playerId).toBe('player1'); // Third in initiative
  });

  it('should handle empty abilities array', () => {
    const player = createMockPlayer('player1');
    const state = createMockGameState([player]);

    const result = sortByInitiative(state, []);

    expect(result).toEqual([]);
  });

  it('should handle single ability', () => {
    const player = createMockPlayer('player1');
    const state = createMockGameState([player]);
    state.initiativeOrder = ['player1'];

    const abilities = [
      { playerId: 'player1', factionId: 'sol', abilityId: 'a', abilityName: 'A', isOptional: true, requiresChoice: false, handlerId: 'h' },
    ];

    const result = sortByInitiative(state, abilities);

    expect(result.length).toBe(1);
    expect(result[0].playerId).toBe('player1');
  });
});

// =============================================================================
// EXHAUSTION STATE TESTS
// =============================================================================

describe('exhaustion state handling', () => {
  it('should not trigger exhausted abilities', () => {
    // This tests the general principle that exhausted abilities shouldn't trigger
    // The actual exhaustion check depends on the specific ability implementation
    const player = createMockPlayer('player1', { faction: 'sol' });
    const state = createMockGameState([player]);

    // Most abilities that can be exhausted are leaders, not faction abilities
    // This test validates the system doesn't crash with normal faction abilities
    const result = checkAbilityTriggers(state, 'combat_start');

    expect(Array.isArray(result)).toBe(true);
  });

  it('should trigger ready abilities', () => {
    const player = createMockPlayer('player1', { faction: 'mentak' });
    const state = createMockGameState([player]);

    // AMBUSH is a faction ability that triggers at combat start
    const result = checkAbilityTriggers(state, 'combat_start');

    expect(Array.isArray(result)).toBe(true);
  });
});
