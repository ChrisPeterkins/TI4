import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleProposeTransaction,
  handleAcceptTransaction,
  handleDeclineTransaction,
  returnPromissoryNote,
  checkPromissoryReturnsOnActivation,
  clearTransactionHistory,
} from '../transactions.js';
import type {
  GameState,
  PlayerState,
  ProposeTransactionAction,
  AcceptTransactionAction,
  DeclineTransactionAction,
} from '@ti4/shared';

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 5,
    commodities: 3,
    maxCommodities: 4,
    technologies: [],
    actionCards: ['action_1', 'action_2'],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotesOwned: [`support_for_the_throne_${id}`, `ceasefire_${id}`],
    promissoryNotesInHand: [`support_for_the_throne_${id}`, `ceasefire_${id}`],
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

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createMockPlayer('player1', {
    neighbors: ['player2'],
    color: 'blue',
    promissoryNotesOwned: ['support_for_the_throne_blue', 'ceasefire_blue'],
    promissoryNotesInHand: ['support_for_the_throne_blue', 'ceasefire_blue'],
  });
  const player2 = createMockPlayer('player2', {
    neighbors: ['player1'],
    color: 'red',
    promissoryNotesOwned: ['support_for_the_throne_red', 'ceasefire_red'],
    promissoryNotesInHand: ['support_for_the_throne_red', 'ceasefire_red'],
  });

  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: ['player1', 'player2'],
    players: [player1, player2],
    map: {
      tiles: [],
      playerCount: 2,
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
    ...overrides,
  };
}

describe('Transaction Handlers', () => {
  describe('handleProposeTransaction', () => {
    it('should create a pending transaction for trade goods', () => {
      const state = createMockGameState();
      const action: ProposeTransactionAction = {
        type: 'propose_transaction',
        playerId: 'player1',
        targetPlayerId: 'player2',
        timestamp: Date.now(),
        offering: { tradeGoods: 2 },
        requesting: { tradeGoods: 1 },
      };

      const result = handleProposeTransaction(state, action);

      expect(result.success).toBe(true);
      expect(state.pendingTransaction).toBeDefined();
      expect(state.pendingTransaction?.initiatorId).toBe('player1');
      expect(state.pendingTransaction?.targetId).toBe('player2');
      expect(state.pendingTransaction?.initiatorOffer.tradeGoods).toBe(2);
    });

    it('should fail if players are not neighbors', () => {
      const state = createMockGameState();
      state.players[0].neighbors = []; // Remove neighbor relationship

      const action: ProposeTransactionAction = {
        type: 'propose_transaction',
        playerId: 'player1',
        targetPlayerId: 'player2',
        timestamp: Date.now(),
        offering: { tradeGoods: 1 },
        requesting: { tradeGoods: 1 },
      };

      const result = handleProposeTransaction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not neighbors');
    });

    it('should allow transaction if player has Trade Convoys', () => {
      const state = createMockGameState();
      state.players[0].neighbors = []; // Remove neighbor relationship
      state.players[0].promissoryNotesInPlay.push({
        noteId: 'trade_convoys',
        originalOwnerId: 'hacan_player',
        placedRound: 1,
      });

      const action: ProposeTransactionAction = {
        type: 'propose_transaction',
        playerId: 'player1',
        targetPlayerId: 'player2',
        timestamp: Date.now(),
        offering: { tradeGoods: 1 },
        requesting: { tradeGoods: 1 },
      };

      const result = handleProposeTransaction(state, action);

      expect(result.success).toBe(true);
    });

    it('should fail if players already transacted this action phase', () => {
      const state = createMockGameState();
      state.players[0].transactedWith = ['player2'];

      const action: ProposeTransactionAction = {
        type: 'propose_transaction',
        playerId: 'player1',
        targetPlayerId: 'player2',
        timestamp: Date.now(),
        offering: { tradeGoods: 1 },
        requesting: { tradeGoods: 1 },
      };

      const result = handleProposeTransaction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Already transacted');
    });

    it('should fail if offering more trade goods than available', () => {
      const state = createMockGameState();
      state.players[0].tradeGoods = 1;

      const action: ProposeTransactionAction = {
        type: 'propose_transaction',
        playerId: 'player1',
        targetPlayerId: 'player2',
        timestamp: Date.now(),
        offering: { tradeGoods: 5 },
        requesting: { tradeGoods: 1 },
      };

      const result = handleProposeTransaction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not enough trade goods');
    });

    it('should fail if offering more than 1 promissory note', () => {
      const state = createMockGameState();

      const action: ProposeTransactionAction = {
        type: 'propose_transaction',
        playerId: 'player1',
        targetPlayerId: 'player2',
        timestamp: Date.now(),
        offering: { promissoryNotes: ['support_for_the_throne_blue', 'ceasefire_blue'] },
        requesting: {},
      };

      const result = handleProposeTransaction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Can only trade 1 promissory note');
    });

    it('should fail if there is already a pending transaction', () => {
      const state = createMockGameState();
      state.pendingTransaction = {
        id: 'existing',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: {},
        requestedOffer: {},
        createdAt: Date.now(),
      };

      const action: ProposeTransactionAction = {
        type: 'propose_transaction',
        playerId: 'player1',
        targetPlayerId: 'player2',
        timestamp: Date.now(),
        offering: { tradeGoods: 1 },
        requesting: {},
      };

      const result = handleProposeTransaction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already a pending transaction');
    });
  });

  describe('handleAcceptTransaction', () => {
    it('should execute trade goods exchange', () => {
      const state = createMockGameState();
      state.players[0].tradeGoods = 5;
      state.players[1].tradeGoods = 3;
      state.pendingTransaction = {
        id: 'tx-1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: { tradeGoods: 2 },
        requestedOffer: { tradeGoods: 1 },
        createdAt: Date.now(),
      };

      const action: AcceptTransactionAction = {
        type: 'accept_transaction',
        playerId: 'player2',
        transactionId: 'tx-1',
        timestamp: Date.now(),
      };

      const result = handleAcceptTransaction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].tradeGoods).toBe(4); // 5 - 2 + 1
      expect(state.players[1].tradeGoods).toBe(4); // 3 + 2 - 1
      expect(state.pendingTransaction).toBeUndefined();
    });

    it('should convert commodities to trade goods when traded', () => {
      const state = createMockGameState();
      state.players[0].commodities = 3;
      state.players[1].tradeGoods = 0;
      state.pendingTransaction = {
        id: 'tx-1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: { commodities: 2 },
        requestedOffer: {},
        createdAt: Date.now(),
      };

      const action: AcceptTransactionAction = {
        type: 'accept_transaction',
        playerId: 'player2',
        transactionId: 'tx-1',
        timestamp: Date.now(),
      };

      const result = handleAcceptTransaction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].commodities).toBe(1);
      expect(state.players[1].tradeGoods).toBe(2); // Commodities become TG
    });

    it('should transfer promissory note', () => {
      const state = createMockGameState();
      state.pendingTransaction = {
        id: 'tx-1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: { promissoryNotes: ['ceasefire_blue'] },
        requestedOffer: {},
        createdAt: Date.now(),
      };

      const action: AcceptTransactionAction = {
        type: 'accept_transaction',
        playerId: 'player2',
        transactionId: 'tx-1',
        timestamp: Date.now(),
      };

      const result = handleAcceptTransaction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].promissoryNotesInHand).not.toContain('ceasefire_blue');
      expect(state.players[1].promissoryNotesInHand).toContain('ceasefire_blue');
    });

    it('should place Support for the Throne in play area and grant VP', () => {
      const state = createMockGameState();
      state.players[0].score = 0;
      state.pendingTransaction = {
        id: 'tx-1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: { promissoryNotes: ['support_for_the_throne_blue'] },
        requestedOffer: {},
        createdAt: Date.now(),
      };

      const action: AcceptTransactionAction = {
        type: 'accept_transaction',
        playerId: 'player2',
        transactionId: 'tx-1',
        timestamp: Date.now(),
      };

      const result = handleAcceptTransaction(state, action);

      expect(result.success).toBe(true);
      // Support for Throne goes to play area, not hand
      expect(state.players[1].promissoryNotesInHand).not.toContain('support_for_the_throne_blue');
      expect(state.players[1].promissoryNotesInPlay).toHaveLength(1);
      expect(state.players[1].promissoryNotesInPlay[0].noteId).toBe('support_for_the_throne_blue');
      // Original owner (player1) gains 1 VP
      expect(state.players[0].score).toBe(1);
    });

    it('should transfer action cards', () => {
      const state = createMockGameState();
      state.pendingTransaction = {
        id: 'tx-1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: { actionCards: ['action_1'] },
        requestedOffer: {},
        createdAt: Date.now(),
      };

      const action: AcceptTransactionAction = {
        type: 'accept_transaction',
        playerId: 'player2',
        transactionId: 'tx-1',
        timestamp: Date.now(),
      };

      const result = handleAcceptTransaction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].actionCards).not.toContain('action_1');
      expect(state.players[1].actionCards).toContain('action_1');
    });

    it('should mark players as having transacted', () => {
      const state = createMockGameState();
      state.pendingTransaction = {
        id: 'tx-1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: { tradeGoods: 1 },
        requestedOffer: {},
        createdAt: Date.now(),
      };

      const action: AcceptTransactionAction = {
        type: 'accept_transaction',
        playerId: 'player2',
        transactionId: 'tx-1',
        timestamp: Date.now(),
      };

      handleAcceptTransaction(state, action);

      expect(state.players[0].transactedWith).toContain('player2');
      expect(state.players[1].transactedWith).toContain('player1');
    });

    it('should fail if only initiator tries to accept', () => {
      const state = createMockGameState();
      state.pendingTransaction = {
        id: 'tx-1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: { tradeGoods: 1 },
        requestedOffer: {},
        createdAt: Date.now(),
      };

      const action: AcceptTransactionAction = {
        type: 'accept_transaction',
        playerId: 'player1', // Wrong player
        transactionId: 'tx-1',
        timestamp: Date.now(),
      };

      const result = handleAcceptTransaction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only the target player');
    });
  });

  describe('handleDeclineTransaction', () => {
    it('should clear pending transaction when target declines', () => {
      const state = createMockGameState();
      state.pendingTransaction = {
        id: 'tx-1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: { tradeGoods: 1 },
        requestedOffer: {},
        createdAt: Date.now(),
      };

      const action: DeclineTransactionAction = {
        type: 'decline_transaction',
        playerId: 'player2',
        transactionId: 'tx-1',
        timestamp: Date.now(),
      };

      const result = handleDeclineTransaction(state, action);

      expect(result.success).toBe(true);
      expect(state.pendingTransaction).toBeUndefined();
    });

    it('should allow initiator to decline (cancel)', () => {
      const state = createMockGameState();
      state.pendingTransaction = {
        id: 'tx-1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: { tradeGoods: 1 },
        requestedOffer: {},
        createdAt: Date.now(),
      };

      const action: DeclineTransactionAction = {
        type: 'decline_transaction',
        playerId: 'player1',
        transactionId: 'tx-1',
        timestamp: Date.now(),
      };

      const result = handleDeclineTransaction(state, action);

      expect(result.success).toBe(true);
    });

    it('should fail if third party tries to decline', () => {
      const state = createMockGameState();
      state.players.push(createMockPlayer('player3'));
      state.pendingTransaction = {
        id: 'tx-1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: { tradeGoods: 1 },
        requestedOffer: {},
        createdAt: Date.now(),
      };

      const action: DeclineTransactionAction = {
        type: 'decline_transaction',
        playerId: 'player3',
        transactionId: 'tx-1',
        timestamp: Date.now(),
      };

      const result = handleDeclineTransaction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only the involved players');
    });
  });

  describe('returnPromissoryNote', () => {
    it('should return note from play area to owner', () => {
      const state = createMockGameState();
      state.players[1].promissoryNotesInPlay.push({
        noteId: 'ceasefire_blue',
        originalOwnerId: 'player1',
        placedRound: 1,
      });

      const result = returnPromissoryNote(state, 'player2', 'ceasefire_blue', 'activation');

      expect(result.success).toBe(true);
      expect(state.players[1].promissoryNotesInPlay).toHaveLength(0);
      expect(state.players[0].promissoryNotesInHand).toContain('ceasefire_blue');
    });

    it('should remove VP when Support for Throne is returned', () => {
      const state = createMockGameState();
      state.players[0].score = 2;
      state.players[1].promissoryNotesInPlay.push({
        noteId: 'support_for_the_throne_blue',
        originalOwnerId: 'player1',
        placedRound: 1,
      });

      const result = returnPromissoryNote(state, 'player2', 'support_for_the_throne_blue', 'activation');

      expect(result.success).toBe(true);
      expect(state.players[0].score).toBe(1); // Lost 1 VP
    });
  });

  describe('clearTransactionHistory', () => {
    it('should clear transactedWith for all players', () => {
      const state = createMockGameState();
      state.players[0].transactedWith = ['player2'];
      state.players[1].transactedWith = ['player1'];

      clearTransactionHistory(state);

      expect(state.players[0].transactedWith).toHaveLength(0);
      expect(state.players[1].transactedWith).toHaveLength(0);
    });
  });
});
