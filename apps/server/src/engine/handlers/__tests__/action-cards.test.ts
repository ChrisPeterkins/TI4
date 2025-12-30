import { describe, it, expect, beforeEach } from 'vitest';
import {
  handlePlayActionCard,
  handleDrawActionCards,
  handleDiscardActionCards,
  exceedsHandLimit,
  getRequiredDiscardCount,
  anyPlayerNeedsToDiscard,
  getPlayersNeedingDiscard,
  initializeActionCardDeck,
} from '../action-cards.js';
import {
  validatePlayActionCard,
  validateDiscardActionCards,
  canPlayCardWithTiming,
  getPlayableCards,
} from '../../validators/action-cards.js';
import type {
  GameState,
  PlayerState,
  PlayActionCardAction,
  DiscardActionCardsAction,
  CombatInstance,
} from '@ti4/shared';

// =============================================================================
// MOCK HELPERS
// =============================================================================

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    faction: 'sol',
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
    strategyCard: null,
    strategyCardUsed: false,
    passed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
    ...overrides,
  };
}

function createMockGameState(playerCount: number = 2): GameState {
  const players: PlayerState[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(createMockPlayer(`player${i + 1}`, {
      name: `Player ${i + 1}`,
      seatIndex: i,
      color: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'][i] as any,
    }));
  }

  return {
    id: 'test-game',
    version: 1,
    phase: 'action',
    subPhase: undefined,
    round: 1,
    activePlayerId: 'player1',
    speakerId: 'player1',
    players,
    map: {
      tiles: [],
      playerCount,
    },
    strategyCards: [],
    objectives: {
      publicStageI: [],
      publicStageII: [],
      secretDeck: [],
      revealedCount: 0,
    },
    agendas: {
      currentAgenda: null,
      currentAgendaNumber: 1,
      votes: new Map(),
      outcome: null,
      riders: [],
    },
    laws: [],
    initiativeOrder: players.map(p => p.id),
    activatedSystem: undefined,
    activeCombat: null,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    custodiansTaken: false,
    actionCardDeck: [
      'morale_boost_1', 'morale_boost_2', 'direct_hit_1', 'direct_hit_2',
      'sabotage_1', 'sabotage_2', 'flank_speed_1', 'shields_holding_1',
    ],
    actionCardDiscard: [],
    agendaDeck: [],
    agendaDiscard: [],
    gameLog: [],
  } as GameState;
}

function createMockCombat(type: 'space' | 'ground' = 'space'): CombatInstance {
  return {
    id: 'combat-1',
    systemId: 'tile-0-0',
    type,
    attackerId: 'player1',
    defenderId: 'player2',
    roundNumber: 1,
    state: 'combat_round_roll',
    attackerUnits: [],
    defenderUnits: [],
    pendingHits: { attacker: 0, defender: 0 },
    retreatAnnounced: { attacker: false, defender: false },
  };
}

// =============================================================================
// HANDLER TESTS
// =============================================================================

describe('Action Card Handlers', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('handlePlayActionCard', () => {
    it('should play a card successfully', () => {
      // Give player a card
      gameState.players[0].actionCards = ['morale_boost_1'];

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'morale_boost_1',
        timestamp: Date.now(),
      };

      const result = handlePlayActionCard(gameState, action);

      expect(result.success).toBe(true);
      expect(gameState.players[0].actionCards).not.toContain('morale_boost_1');
      expect(gameState.actionCardDiscard).toContain('morale_boost_1');
      expect(result.triggeredEvents).toContain('action_card_played');
    });

    it('should fail if player does not have the card', () => {
      gameState.players[0].actionCards = ['direct_hit_1'];

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'morale_boost_1', // Player doesn't have this
        timestamp: Date.now(),
      };

      const result = handlePlayActionCard(gameState, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not have');
    });

    it('should fail for unknown card', () => {
      gameState.players[0].actionCards = ['nonexistent_card'];

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'nonexistent_card',
        timestamp: Date.now(),
      };

      const result = handlePlayActionCard(gameState, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown');
    });

    it('should trigger sabotage_played event for sabotage cards', () => {
      gameState.players[0].actionCards = ['sabotage_1'];

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'sabotage_1',
        timestamp: Date.now(),
      };

      const result = handlePlayActionCard(gameState, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('sabotage_played');
      expect(result.triggeredEvents).toContain('action_card_played');
    });

    it('should fail if player not found', () => {
      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'nonexistent_player',
        cardId: 'morale_boost_1',
        timestamp: Date.now(),
      };

      const result = handlePlayActionCard(gameState, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Player not found');
    });
  });

  describe('handleDrawActionCards', () => {
    it('should draw cards from deck', () => {
      const initialDeckSize = gameState.actionCardDeck.length;

      const result = handleDrawActionCards(gameState, 'player1', 2);

      expect(result.success).toBe(true);
      expect(gameState.players[0].actionCards.length).toBe(2);
      expect(gameState.actionCardDeck.length).toBe(initialDeckSize - 2);
      expect(result.triggeredEvents).toContain('action_cards_drawn');
      expect((result.data as { drawnCount: number })?.drawnCount).toBe(2);
    });

    it('should reshuffle discard when deck is empty', () => {
      gameState.actionCardDeck = ['morale_boost_1']; // Only 1 card
      gameState.actionCardDiscard = ['direct_hit_1', 'direct_hit_2', 'sabotage_1'];

      const result = handleDrawActionCards(gameState, 'player1', 3);

      expect(result.success).toBe(true);
      expect(gameState.players[0].actionCards.length).toBe(3);
      expect(gameState.actionCardDiscard.length).toBe(0); // Discard was reshuffled
    });

    it('should draw as many as available if not enough cards', () => {
      gameState.actionCardDeck = ['morale_boost_1'];
      gameState.actionCardDiscard = [];

      const result = handleDrawActionCards(gameState, 'player1', 5);

      expect(result.success).toBe(true);
      expect(gameState.players[0].actionCards.length).toBe(1);
      expect((result.data as { drawnCount: number })?.drawnCount).toBe(1);
    });

    it('should fail if player not found', () => {
      const result = handleDrawActionCards(gameState, 'nonexistent_player', 2);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Player not found');
    });
  });

  describe('handleDiscardActionCards', () => {
    it('should discard cards successfully', () => {
      gameState.players[0].actionCards = ['morale_boost_1', 'direct_hit_1', 'sabotage_1'];

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'player1',
        cardIds: ['morale_boost_1', 'direct_hit_1'],
        timestamp: Date.now(),
      };

      const result = handleDiscardActionCards(gameState, action);

      expect(result.success).toBe(true);
      expect(gameState.players[0].actionCards).toEqual(['sabotage_1']);
      expect(gameState.actionCardDiscard).toContain('morale_boost_1');
      expect(gameState.actionCardDiscard).toContain('direct_hit_1');
      expect(result.triggeredEvents).toContain('action_cards_discarded');
    });

    it('should fail if player does not have the card', () => {
      gameState.players[0].actionCards = ['morale_boost_1'];

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'player1',
        cardIds: ['direct_hit_1'], // Player doesn't have this
        timestamp: Date.now(),
      };

      const result = handleDiscardActionCards(gameState, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not have');
    });
  });

  describe('Hand limit helpers', () => {
    it('exceedsHandLimit should return true when over 7 cards', () => {
      const player = createMockPlayer('p1', {
        actionCards: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'],
      });

      expect(exceedsHandLimit(player)).toBe(true);
    });

    it('exceedsHandLimit should return false when at or below 7 cards', () => {
      const player = createMockPlayer('p1', {
        actionCards: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'],
      });

      expect(exceedsHandLimit(player)).toBe(false);
    });

    it('getRequiredDiscardCount should return correct count', () => {
      const player = createMockPlayer('p1', {
        actionCards: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'],
      });

      expect(getRequiredDiscardCount(player)).toBe(2);
    });

    it('anyPlayerNeedsToDiscard should check all players', () => {
      gameState.players[0].actionCards = Array(8).fill('card');
      gameState.players[1].actionCards = [];

      expect(anyPlayerNeedsToDiscard(gameState)).toBe(true);
    });

    it('getPlayersNeedingDiscard should return correct players', () => {
      gameState.players[0].actionCards = Array(8).fill('card');
      gameState.players[1].actionCards = Array(10).fill('card');

      const result = getPlayersNeedingDiscard(gameState);

      expect(result).toContain('player1');
      expect(result).toContain('player2');
      expect(result.length).toBe(2);
    });
  });

  describe('initializeActionCardDeck', () => {
    it('should create a shuffled deck', () => {
      gameState.actionCardDeck = [];
      gameState.actionCardDiscard = ['old_card'];

      initializeActionCardDeck(gameState);

      expect(gameState.actionCardDeck.length).toBeGreaterThan(0);
      expect(gameState.actionCardDiscard).toEqual([]);
    });
  });
});

// =============================================================================
// VALIDATOR TESTS
// =============================================================================

describe('Action Card Validators', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = createMockGameState();
  });

  describe('validatePlayActionCard', () => {
    it('should validate successfully for action cards during action phase', () => {
      gameState.players[0].actionCards = ['mining_initiative'];
      gameState.phase = 'action';

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'mining_initiative',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(true);
    });

    it('should reject action cards outside action phase', () => {
      gameState.players[0].actionCards = ['mining_initiative'];
      gameState.phase = 'strategy';

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'mining_initiative',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('ACTION cards during action phase');
    });

    it('should allow sabotage anytime', () => {
      gameState.players[0].actionCards = ['sabotage_1'];
      gameState.phase = 'strategy'; // Not action phase

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'sabotage_1',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(true);
    });

    it('should validate tactical cards during tactical action', () => {
      gameState.players[0].actionCards = ['flank_speed_1'];
      gameState.phase = 'action';
      gameState.activatedSystem = { q: 0, r: 0 };

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'flank_speed_1',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(true);
    });

    it('should reject tactical cards without activated system', () => {
      gameState.players[0].actionCards = ['flank_speed_1'];
      gameState.phase = 'action';
      gameState.activatedSystem = undefined;

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'flank_speed_1',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('tactical action');
    });

    it('should validate combat cards during combat', () => {
      gameState.players[0].actionCards = ['morale_boost_1'];
      gameState.activeCombat = createMockCombat('space');

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'morale_boost_1',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(true);
    });

    it('should reject combat cards outside combat', () => {
      gameState.players[0].actionCards = ['morale_boost_1'];
      gameState.activeCombat = null;

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'morale_boost_1',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('combat');
    });

    it('should reject space combat cards during ground combat', () => {
      gameState.players[0].actionCards = ['shields_holding_1'];
      gameState.activeCombat = createMockCombat('ground');

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'shields_holding_1',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('space combat');
    });

    it('should validate agenda cards during agenda phase', () => {
      gameState.players[0].actionCards = ['veto'];
      gameState.phase = 'agenda';

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'veto',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(true);
    });

    it('should reject agenda cards outside agenda phase', () => {
      gameState.players[0].actionCards = ['veto'];
      gameState.phase = 'action';

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'veto',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('agenda');
    });

    it('should require target player for spy card', () => {
      gameState.players[0].actionCards = ['spy'];
      gameState.phase = 'action';

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'spy',
        timestamp: Date.now(),
        // No targets provided
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('target player');
    });

    it('should reject targeting yourself', () => {
      gameState.players[0].actionCards = ['spy'];
      gameState.phase = 'action';

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'spy',
        timestamp: Date.now(),
        targets: { playerId: 'player1' }, // Targeting self
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Cannot target yourself');
    });

    it('should require target system for reactor_meltdown', () => {
      gameState.players[0].actionCards = ['reactor_meltdown'];
      gameState.phase = 'action';

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'reactor_meltdown',
        timestamp: Date.now(),
        // No targets provided
      };

      const result = validatePlayActionCard(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('target system');
    });
  });

  describe('validateDiscardActionCards', () => {
    it('should validate successful discard', () => {
      gameState.players[0].actionCards = ['morale_boost_1', 'direct_hit_1'];

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'player1',
        cardIds: ['morale_boost_1'],
        timestamp: Date.now(),
      };

      const result = validateDiscardActionCards(gameState, action);

      expect(result.valid).toBe(true);
    });

    it('should reject empty discard', () => {
      gameState.players[0].actionCards = ['morale_boost_1'];

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'player1',
        cardIds: [],
        timestamp: Date.now(),
      };

      const result = validateDiscardActionCards(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least one');
    });

    it('should reject discarding cards not owned', () => {
      gameState.players[0].actionCards = ['morale_boost_1'];

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'player1',
        cardIds: ['direct_hit_1'], // Player doesn't have this
        timestamp: Date.now(),
      };

      const result = validateDiscardActionCards(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not have');
    });

    it('should enforce minimum discard during status phase hand limit', () => {
      gameState.players[0].actionCards = Array(9).fill(null).map((_, i) => `card_${i}`);
      gameState.phase = 'status';

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'player1',
        cardIds: ['card_0'], // Only discarding 1, needs to discard 2
        timestamp: Date.now(),
      };

      const result = validateDiscardActionCards(gameState, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('hand limit');
    });
  });

  describe('canPlayCardWithTiming', () => {
    it('should return true if player has card with matching timing', () => {
      gameState.players[0].actionCards = ['morale_boost_1']; // combat timing

      const result = canPlayCardWithTiming(gameState, 'player1', 'combat');

      expect(result).toBe(true);
    });

    it('should return false if no matching cards', () => {
      gameState.players[0].actionCards = ['mining_initiative']; // action timing

      const result = canPlayCardWithTiming(gameState, 'player1', 'combat');

      expect(result).toBe(false);
    });
  });

  describe('getPlayableCards', () => {
    it('should return cards that can be played in current state', () => {
      gameState.players[0].actionCards = ['mining_initiative', 'morale_boost_1'];
      gameState.phase = 'action';
      gameState.activeCombat = null;

      const result = getPlayableCards(gameState, 'player1');

      // mining_initiative is an action card playable during action phase
      expect(result).toContain('mining_initiative');
      // morale_boost_1 is a combat card, not playable without combat
      expect(result).not.toContain('morale_boost_1');
    });

    it('should return combat cards during combat', () => {
      gameState.players[0].actionCards = ['morale_boost_1', 'direct_hit_1'];
      gameState.activeCombat = createMockCombat('space');

      const result = getPlayableCards(gameState, 'player1');

      expect(result).toContain('morale_boost_1');
      expect(result).toContain('direct_hit_1');
    });
  });
});
