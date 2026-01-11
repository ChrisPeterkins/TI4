import { describe, it, expect } from 'vitest';
import {
  validatePlayActionCard,
  validateDiscardActionCards,
  canPlayCardWithTiming,
  getPlayableCards,
} from '../action-cards.js';
import type {
  GameState,
  MapTile,
  PlayerState,
  MapState,
  PlayActionCardAction,
  DiscardActionCardsAction,
  CombatState,
} from '@ti4/shared';

function createMockTile(overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: 'tile-1',
    systemId: 1,
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

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Player 1',
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

function createMockGameState(
  players: PlayerState[] = [],
  overrides: Partial<GameState> = {}
): GameState {
  return {
    id: 'game1',
    version: 1,
    round: 1,
    phase: 'action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: [],
    players: players.length > 0 ? players : [createMockPlayer()],
    map: { tiles: [createMockTile()], playerCount: 6 } as MapState,
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
    ...overrides,
  };
}

function createMockCombat(type: 'space' | 'ground'): CombatState {
  return {
    systemId: 'system-1',
    attackerId: 'player1',
    defenderId: 'player2',
    type,
    round: 1,
    phase: 'roll',
    attackerUnits: [],
    defenderUnits: [],
    attackerHits: 0,
    defenderHits: 0,
    attackerHitsAssigned: false,
    defenderHitsAssigned: false,
  };
}

describe('Action Card Validators', () => {
  describe('validatePlayActionCard', () => {
    it('should reject if player not found', () => {
      const player = createMockPlayer({ id: 'player1', actionCards: ['sabotage_1'] });
      const state = createMockGameState([player]);

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'nonexistent',
        cardId: 'sabotage_1',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should reject if player does not have the card', () => {
      const player = createMockPlayer({ id: 'player1', actionCards: ['direct_hit_1'] });
      const state = createMockGameState([player]);

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'sabotage_1',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player does not have this action card');
    });

    it('should reject unknown action card', () => {
      const player = createMockPlayer({ id: 'player1', actionCards: ['unknown_card'] });
      const state = createMockGameState([player]);

      const action: PlayActionCardAction = {
        type: 'play_action_card',
        playerId: 'player1',
        cardId: 'unknown_card',
        timestamp: Date.now(),
      };

      const result = validatePlayActionCard(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown action card');
    });

    describe('ACTION timing cards', () => {
      it('should allow playing action cards during action phase', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['sabotage_1'] });
        const state = createMockGameState([player], { phase: 'action' });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'sabotage_1',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(true);
      });

      it('should allow Sabotage outside action phase (can counter other action cards)', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['sabotage_1'] });
        const state = createMockGameState([player], { phase: 'strategy' });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'sabotage_1',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(true);
      });
    });

    describe('TACTICAL timing cards', () => {
      it('should reject tactical cards outside action phase', () => {
        // Using a known tactical card
        const player = createMockPlayer({ id: 'player1', actionCards: ['flank_speed_1'] });
        const state = createMockGameState([player], { phase: 'strategy' });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'flank_speed_1',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Can only play tactical cards during action phase');
      });

      it('should reject tactical cards without activated system', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['flank_speed_1'] });
        const state = createMockGameState([player], {
          phase: 'action',
          activatedSystem: undefined,
        });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'flank_speed_1',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Can only play tactical cards during a tactical action');
      });

      it('should allow tactical cards during tactical action', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['flank_speed_1'] });
        const state = createMockGameState([player], {
          phase: 'action',
          activatedSystem: 'system-1',
        });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'flank_speed_1',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(true);
      });
    });

    describe('COMBAT timing cards', () => {
      it('should reject combat cards without active combat', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['direct_hit_1'] });
        const state = createMockGameState([player], {
          phase: 'action',
          activeCombat: null,
        });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'direct_hit_1',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Can only play combat cards during combat');
      });

      it('should allow combat cards during active combat', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['direct_hit_1'] });
        const state = createMockGameState([player], {
          phase: 'action',
          activeCombat: createMockCombat('space'),
        });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'direct_hit_1',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(true);
      });
    });

    describe('AGENDA timing cards', () => {
      it('should reject agenda cards outside agenda phase', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['veto'] });
        const state = createMockGameState([player], { phase: 'action' });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'veto',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Can only play agenda cards during agenda phase');
      });

      it('should reject rider cards without revealed agenda', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['imperial_rider'] });
        const state = createMockGameState([player], {
          phase: 'agenda',
          agendaPhase: {
            currentAgendaId: undefined,
          },
        });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'imperial_rider',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Can only play rider cards after an agenda is revealed');
      });

      it('should allow rider cards after agenda is revealed', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['imperial_rider'] });
        const state = createMockGameState([player], {
          phase: 'agenda',
          agendaPhase: {
            currentAgendaId: 'some_agenda',
          },
        });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'imperial_rider',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(true);
      });
    });

    describe('STATUS timing cards', () => {
      it('should reject status phase cards outside status phase', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['manipulate_investments'] });
        const state = createMockGameState([player], { phase: 'action' });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'manipulate_investments',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Can only play status phase cards during status phase');
      });

      it('should allow status phase cards during status phase', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['manipulate_investments'] });
        const state = createMockGameState([player], { phase: 'status' });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'manipulate_investments',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(true);
      });
    });

    describe('Target validation', () => {
      it('should require target player for cards that need it', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['spy'] });
        const state = createMockGameState([player], { phase: 'action' });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'spy',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('This card requires a target player');
      });

      it('should reject self-targeting for cards that target other players', () => {
        const player1 = createMockPlayer({ id: 'player1', actionCards: ['spy'] });
        const player2 = createMockPlayer({ id: 'player2' });
        const state = createMockGameState([player1, player2], { phase: 'action' });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'spy',
          targets: { playerId: 'player1' },
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Cannot target yourself with this card');
      });

      it('should reject nonexistent target player', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['spy'] });
        const state = createMockGameState([player], { phase: 'action' });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'spy',
          targets: { playerId: 'nonexistent' },
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Target player not found');
      });

      it('should allow valid target player', () => {
        const player1 = createMockPlayer({ id: 'player1', actionCards: ['spy'] });
        const player2 = createMockPlayer({ id: 'player2' });
        const state = createMockGameState([player1, player2], { phase: 'action' });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'spy',
          targets: { playerId: 'player2' },
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(true);
      });

      it('should require target system for cards that need it', () => {
        const player = createMockPlayer({ id: 'player1', actionCards: ['lucky_shot'] });
        const state = createMockGameState([player], {
          phase: 'action',
          activeCombat: createMockCombat('space'),
        });

        const action: PlayActionCardAction = {
          type: 'play_action_card',
          playerId: 'player1',
          cardId: 'lucky_shot',
          timestamp: Date.now(),
        };

        const result = validatePlayActionCard(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('This card requires a target system');
      });
    });
  });

  describe('validateDiscardActionCards', () => {
    it('should reject if player not found', () => {
      const player = createMockPlayer({ id: 'player1', actionCards: ['sabotage_1'] });
      const state = createMockGameState([player]);

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'nonexistent',
        cardIds: ['sabotage_1'],
        timestamp: Date.now(),
      };

      const result = validateDiscardActionCards(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should reject empty card list', () => {
      const player = createMockPlayer({ id: 'player1', actionCards: ['sabotage_1'] });
      const state = createMockGameState([player]);

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'player1',
        cardIds: [],
        timestamp: Date.now(),
      };

      const result = validateDiscardActionCards(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must discard at least one card');
    });

    it('should reject if player does not have the card', () => {
      const player = createMockPlayer({ id: 'player1', actionCards: ['direct_hit_1'] });
      const state = createMockGameState([player]);

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'player1',
        cardIds: ['sabotage_1'],
        timestamp: Date.now(),
      };

      const result = validateDiscardActionCards(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player does not have card: sabotage_1');
    });

    it('should allow discarding owned cards', () => {
      const player = createMockPlayer({
        id: 'player1',
        actionCards: ['sabotage_1', 'direct_hit_1'],
      });
      const state = createMockGameState([player]);

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'player1',
        cardIds: ['sabotage_1'],
        timestamp: Date.now(),
      };

      const result = validateDiscardActionCards(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow discarding multiple cards', () => {
      const player = createMockPlayer({
        id: 'player1',
        actionCards: ['sabotage_1', 'direct_hit_1', 'morale_boost_1'],
      });
      const state = createMockGameState([player]);

      const action: DiscardActionCardsAction = {
        type: 'discard_action_cards',
        playerId: 'player1',
        cardIds: ['sabotage_1', 'direct_hit_1'],
        timestamp: Date.now(),
      };

      const result = validateDiscardActionCards(state, action);

      expect(result.valid).toBe(true);
    });

    describe('Hand limit enforcement during status phase', () => {
      it('should require discarding enough cards to meet hand limit', () => {
        const player = createMockPlayer({
          id: 'player1',
          // 9 cards - need to discard 2 to get to 7
          actionCards: [
            'sabotage_1', 'sabotage_2', 'sabotage_3',
            'direct_hit_1', 'direct_hit_2', 'direct_hit_3',
            'morale_boost_1', 'morale_boost_2', 'morale_boost_3',
          ],
        });
        const state = createMockGameState([player], { phase: 'status' });

        const action: DiscardActionCardsAction = {
          type: 'discard_action_cards',
          playerId: 'player1',
          cardIds: ['sabotage_1'], // Only discarding 1
          timestamp: Date.now(),
        };

        const result = validateDiscardActionCards(state, action);

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Must discard at least 2 cards to meet hand limit');
      });

      it('should allow discarding exactly enough cards', () => {
        const player = createMockPlayer({
          id: 'player1',
          actionCards: [
            'sabotage_1', 'sabotage_2', 'sabotage_3',
            'direct_hit_1', 'direct_hit_2', 'direct_hit_3',
            'morale_boost_1', 'morale_boost_2', 'morale_boost_3',
          ],
        });
        const state = createMockGameState([player], { phase: 'status' });

        const action: DiscardActionCardsAction = {
          type: 'discard_action_cards',
          playerId: 'player1',
          cardIds: ['sabotage_1', 'sabotage_2'],
          timestamp: Date.now(),
        };

        const result = validateDiscardActionCards(state, action);

        expect(result.valid).toBe(true);
      });

      it('should allow discarding when already at or below hand limit', () => {
        const player = createMockPlayer({
          id: 'player1',
          actionCards: ['sabotage_1', 'direct_hit_1'], // Only 2 cards
        });
        const state = createMockGameState([player], { phase: 'status' });

        const action: DiscardActionCardsAction = {
          type: 'discard_action_cards',
          playerId: 'player1',
          cardIds: ['sabotage_1'],
          timestamp: Date.now(),
        };

        const result = validateDiscardActionCards(state, action);

        expect(result.valid).toBe(true);
      });
    });
  });

  describe('canPlayCardWithTiming', () => {
    it('should return false for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const result = canPlayCardWithTiming(state, 'nonexistent', 'action');

      expect(result).toBe(false);
    });

    it('should return false when player has no cards with timing', () => {
      const player = createMockPlayer({
        id: 'player1',
        actionCards: ['direct_hit_1'], // combat timing
      });
      const state = createMockGameState([player]);

      const result = canPlayCardWithTiming(state, 'player1', 'agenda');

      expect(result).toBe(false);
    });

    it('should return true when player has cards with matching timing', () => {
      const player = createMockPlayer({
        id: 'player1',
        actionCards: ['sabotage_1'], // action timing
      });
      const state = createMockGameState([player]);

      const result = canPlayCardWithTiming(state, 'player1', 'action');

      expect(result).toBe(true);
    });
  });

  describe('getPlayableCards', () => {
    it('should return empty array for player not found', () => {
      const state = createMockGameState([createMockPlayer({ id: 'player1' })]);

      const result = getPlayableCards(state, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should return only playable cards for current state', () => {
      const player = createMockPlayer({
        id: 'player1',
        actionCards: ['sabotage_1', 'direct_hit_1'], // action and combat timing
      });
      const state = createMockGameState([player], {
        phase: 'action',
        activeCombat: null,
      });

      const result = getPlayableCards(state, 'player1');

      // sabotage_1 should be playable in action phase
      // direct_hit_1 requires combat, so not playable
      expect(result).toContain('sabotage_1');
      expect(result).not.toContain('direct_hit_1');
    });

    it('should return combat cards when in combat', () => {
      const player = createMockPlayer({
        id: 'player1',
        actionCards: ['direct_hit_1'],
      });
      const state = createMockGameState([player], {
        phase: 'action',
        activeCombat: createMockCombat('space'),
      });

      const result = getPlayableCards(state, 'player1');

      expect(result).toContain('direct_hit_1');
    });
  });
});
