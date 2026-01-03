/**
 * Tests for transaction validators
 *
 * TI4 Transaction Rules:
 * - Transactions can only occur during action phase
 * - Players must be neighbors OR have Trade Convoys in play (Hacan promissory)
 * - Each player can only transact once per action phase with each other player
 * - Can exchange: trade goods, commodities, promissory notes (max 1), relic fragments
 * - Commodities convert to trade goods when exchanged
 * - Promissory notes in play area cannot be traded
 * - Emirates of Hacan can trade action cards
 * - Transactions don't have to be equal
 *
 * Sources:
 * - https://twilight-imperium.fandom.com/wiki/Transactions_&_Deals
 * - https://www.tirules.com/R_transactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GameState, PlayerState, TransactionOffer, PendingTransaction } from '@ti4/shared';
import {
  validateProposeTransaction,
  validateAcceptTransaction,
  validateDeclineTransaction,
} from '../transactions.js';

// Mock getBaseNoteId
vi.mock('@ti4/shared', async () => {
  const actual = await vi.importActual('@ti4/shared');
  return {
    ...actual,
    getBaseNoteId: vi.fn((noteId: string) => {
      // trade_convoys_player1 -> trade_convoys
      return noteId.replace(/_player\d+$/, '');
    }),
  };
});

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    faction: 'sol',
    color: 'blue',
    name: 'Test Player',
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    resources: 5,
    influence: 5,
    commodities: 2,
    maxCommodities: 4,
    tradeGoods: 3,
    technologies: [],
    planets: [],
    controlledSystems: [],
    victoryPoints: 0,
    secretObjectives: [],
    actionCards: [],
    promissoryNotes: [],
    promissoryNotesInHand: ['support_for_the_throne_player1'],
    promissoryNotesInPlay: [],
    scoredObjectives: [],
    scoredSecretObjectives: [],
    custodiansTaken: false,
    passed: false,
    speaker: false,
    strategyCard: null,
    strategyCardUsed: false,
    activatedSystems: [],
    unitUpgrades: {},
    leaders: {
      agent: { id: 'sol_agent', unlocked: true, exhausted: false },
      commander: { id: 'sol_commander', unlocked: false, exhausted: false },
      hero: { id: 'sol_hero', unlocked: false, purged: false },
    },
    relics: [],
    fragments: { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 },
    exhaustedPlanets: [],
    exhaustedTechs: [],
    exhaustedAgents: [],
    neighbors: ['player2'],
    transactedWith: [],
    ...overrides,
  };
}

function createMockOffer(overrides: Partial<TransactionOffer> = {}): TransactionOffer {
  return {
    tradeGoods: 0,
    commodities: 0,
    promissoryNotes: [],
    actionCards: [],
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createMockPlayer({
    id: 'player1',
    neighbors: ['player2'],
    tradeGoods: 3,
    commodities: 2,
  });
  const player2 = createMockPlayer({
    id: 'player2',
    neighbors: ['player1'],
    tradeGoods: 2,
    commodities: 3,
  });

  return {
    id: 'game1',
    name: 'Test Game',
    phase: 'action',
    subPhase: 'active',
    round: 1,
    turn: 0,
    players: [player1, player2],
    map: { tiles: [] },
    objectives: { stage1: [], stage2: [], revealed: [], secret: [] },
    laws: [],
    activePlayerId: 'player1',
    speakerId: 'player1',
    activeCombat: null,
    agendaPhase: null,
    turnOrder: ['player1', 'player2'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    miltyDraft: null,
    actionDeck: [],
    actionDiscardPile: [],
    agendaDeck: [],
    agendaDiscardPile: [],
    stageTwoRevealed: false,
    pendingTransaction: null,
    ...overrides,
  };
}

describe('validateProposeTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic validation', () => {
    it('should fail if not in action phase', () => {
      const state = createMockGameState({ phase: 'strategy' });
      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ tradeGoods: 1 }),
        requesting: createMockOffer({ commodities: 1 }),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Transactions can only occur during action phase');
    });

    it('should fail if there is already a pending transaction', () => {
      const state = createMockGameState();
      state.pendingTransaction = {
        id: 'tx1',
        initiatorId: 'player1',
        targetId: 'player2',
        initiatorOffer: createMockOffer(),
        requestedOffer: createMockOffer(),
      };

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer(),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('There is already a pending transaction');
    });

    it('should fail if initiator not found', () => {
      const state = createMockGameState();
      const action = {
        type: 'propose_transaction' as const,
        playerId: 'nonexistent',
        targetPlayerId: 'player2',
        offering: createMockOffer(),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Initiator player not found');
    });

    it('should fail if target not found', () => {
      const state = createMockGameState();
      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'nonexistent',
        offering: createMockOffer(),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Target player not found');
    });

    it('should fail if transacting with self', () => {
      const state = createMockGameState();
      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player1',
        offering: createMockOffer(),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot transact with yourself');
    });
  });

  describe('neighbor validation', () => {
    it('should fail if players are not neighbors and no Trade Convoys', () => {
      const state = createMockGameState();
      state.players[0].neighbors = []; // No neighbors
      state.players[1].neighbors = [];

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer(),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Players cannot transact - not neighbors and no Trade Convoys');
    });

    it('should allow transaction between neighbors', () => {
      const state = createMockGameState();

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ tradeGoods: 1 }),
        requesting: createMockOffer({ commodities: 1 }),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow transaction with Trade Convoys even if not neighbors', () => {
      const state = createMockGameState();
      state.players[0].neighbors = []; // Not neighbors
      state.players[1].neighbors = [];
      // Player1 has Trade Convoys in play
      state.players[0].promissoryNotesInPlay = [{ noteId: 'trade_convoys_player1', targetId: null }];

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ tradeGoods: 1 }),
        requesting: createMockOffer({ commodities: 1 }),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('transacted this turn validation', () => {
    it('should fail if already transacted with target this action phase', () => {
      const state = createMockGameState();
      state.players[0].transactedWith = ['player2'];

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer(),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Already transacted with this player this action phase');
    });
  });

  describe('offer validation', () => {
    it('should fail if offering more trade goods than available', () => {
      const state = createMockGameState();

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ tradeGoods: 10 }), // Only has 3
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid offer: Not enough trade goods');
    });

    it('should fail if offering negative trade goods', () => {
      const state = createMockGameState();

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ tradeGoods: -1 }),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid offer: Cannot offer negative trade goods');
    });

    it('should fail if offering more commodities than available', () => {
      const state = createMockGameState();

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ commodities: 10 }), // Only has 2
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid offer: Not enough commodities');
    });

    it('should fail if offering negative commodities', () => {
      const state = createMockGameState();

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ commodities: -1 }),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid offer: Cannot offer negative commodities');
    });

    it('should fail if offering more than 1 promissory note', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['note1', 'note2'];

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ promissoryNotes: ['note1', 'note2'] }),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid offer: Can only trade 1 promissory note per transaction');
    });

    it('should fail if promissory note not in hand', () => {
      const state = createMockGameState();

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ promissoryNotes: ['note_not_in_hand'] }),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid offer: Promissory note not in hand');
    });

    it('should fail if promissory note is in play area', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['note1'];
      state.players[0].promissoryNotesInPlay = [{ noteId: 'note1', targetId: 'player2' }];

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ promissoryNotes: ['note1'] }),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid offer: Cannot trade promissory notes in play area');
    });

    it('should fail if action card not in hand', () => {
      const state = createMockGameState();
      state.players[0].actionCards = [];

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ actionCards: ['card_not_in_hand'] }),
        requesting: createMockOffer(),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid offer: Action card card_not_in_hand not in hand');
    });
  });

  describe('request validation', () => {
    it('should fail if requesting more trade goods than target has', () => {
      const state = createMockGameState();

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ tradeGoods: 1 }),
        requesting: createMockOffer({ tradeGoods: 10 }), // Player2 only has 2
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid request: Not enough trade goods');
    });
  });

  describe('valid transactions', () => {
    it('should allow valid trade of trade goods for commodities', () => {
      const state = createMockGameState();

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ tradeGoods: 2 }),
        requesting: createMockOffer({ commodities: 3 }),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow valid trade with promissory note', () => {
      const state = createMockGameState();
      state.players[1].promissoryNotesInHand = ['their_note'];

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ promissoryNotes: ['support_for_the_throne_player1'] }),
        requesting: createMockOffer({ promissoryNotes: ['their_note'] }),
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow unequal trades (giving without receiving)', () => {
      const state = createMockGameState();

      const action = {
        type: 'propose_transaction' as const,
        playerId: 'player1',
        targetPlayerId: 'player2',
        offering: createMockOffer({ tradeGoods: 2, commodities: 1 }),
        requesting: createMockOffer(), // Nothing requested
      };

      const result = validateProposeTransaction(state, action);

      expect(result.valid).toBe(true);
    });
  });
});

describe('validateAcceptTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fail if no pending transaction', () => {
    const state = createMockGameState({ pendingTransaction: null });
    const action = {
      type: 'accept_transaction' as const,
      playerId: 'player2',
      transactionId: 'tx1',
    };

    const result = validateAcceptTransaction(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('No pending transaction');
  });

  it('should fail if transaction ID mismatch', () => {
    const state = createMockGameState();
    state.pendingTransaction = {
      id: 'tx1',
      initiatorId: 'player1',
      targetId: 'player2',
      initiatorOffer: createMockOffer(),
      requestedOffer: createMockOffer(),
    };

    const action = {
      type: 'accept_transaction' as const,
      playerId: 'player2',
      transactionId: 'wrong_id',
    };

    const result = validateAcceptTransaction(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Transaction ID mismatch');
  });

  it('should fail if non-target tries to accept', () => {
    const state = createMockGameState();
    state.pendingTransaction = {
      id: 'tx1',
      initiatorId: 'player1',
      targetId: 'player2',
      initiatorOffer: createMockOffer(),
      requestedOffer: createMockOffer(),
    };

    const action = {
      type: 'accept_transaction' as const,
      playerId: 'player1', // Initiator, not target
      transactionId: 'tx1',
    };

    const result = validateAcceptTransaction(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Only the target player can accept the transaction');
  });

  it('should fail if initiator can no longer fulfill offer', () => {
    const state = createMockGameState();
    state.pendingTransaction = {
      id: 'tx1',
      initiatorId: 'player1',
      targetId: 'player2',
      initiatorOffer: createMockOffer({ tradeGoods: 5 }), // More than player1 has
      requestedOffer: createMockOffer(),
    };

    const action = {
      type: 'accept_transaction' as const,
      playerId: 'player2',
      transactionId: 'tx1',
    };

    const result = validateAcceptTransaction(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Initiator can no longer fulfill offer: Not enough trade goods');
  });

  it('should fail if target can no longer fulfill request', () => {
    const state = createMockGameState();
    state.pendingTransaction = {
      id: 'tx1',
      initiatorId: 'player1',
      targetId: 'player2',
      initiatorOffer: createMockOffer({ tradeGoods: 1 }),
      requestedOffer: createMockOffer({ commodities: 10 }), // More than player2 has
    };

    const action = {
      type: 'accept_transaction' as const,
      playerId: 'player2',
      transactionId: 'tx1',
    };

    const result = validateAcceptTransaction(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Target can no longer fulfill request: Not enough commodities');
  });

  it('should allow valid accept', () => {
    const state = createMockGameState();
    state.pendingTransaction = {
      id: 'tx1',
      initiatorId: 'player1',
      targetId: 'player2',
      initiatorOffer: createMockOffer({ tradeGoods: 1 }),
      requestedOffer: createMockOffer({ commodities: 1 }),
    };

    const action = {
      type: 'accept_transaction' as const,
      playerId: 'player2',
      transactionId: 'tx1',
    };

    const result = validateAcceptTransaction(state, action);

    expect(result.valid).toBe(true);
  });
});

describe('validateDeclineTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fail if no pending transaction', () => {
    const state = createMockGameState({ pendingTransaction: null });
    const action = {
      type: 'decline_transaction' as const,
      playerId: 'player2',
      transactionId: 'tx1',
    };

    const result = validateDeclineTransaction(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('No pending transaction');
  });

  it('should fail if transaction ID mismatch', () => {
    const state = createMockGameState();
    state.pendingTransaction = {
      id: 'tx1',
      initiatorId: 'player1',
      targetId: 'player2',
      initiatorOffer: createMockOffer(),
      requestedOffer: createMockOffer(),
    };

    const action = {
      type: 'decline_transaction' as const,
      playerId: 'player2',
      transactionId: 'wrong_id',
    };

    const result = validateDeclineTransaction(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Transaction ID mismatch');
  });

  it('should fail if non-involved player tries to decline', () => {
    const state = createMockGameState();
    state.players.push(createMockPlayer({ id: 'player3' }));
    state.pendingTransaction = {
      id: 'tx1',
      initiatorId: 'player1',
      targetId: 'player2',
      initiatorOffer: createMockOffer(),
      requestedOffer: createMockOffer(),
    };

    const action = {
      type: 'decline_transaction' as const,
      playerId: 'player3', // Not involved
      transactionId: 'tx1',
    };

    const result = validateDeclineTransaction(state, action);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Only involved players can decline the transaction');
  });

  it('should allow target to decline', () => {
    const state = createMockGameState();
    state.pendingTransaction = {
      id: 'tx1',
      initiatorId: 'player1',
      targetId: 'player2',
      initiatorOffer: createMockOffer(),
      requestedOffer: createMockOffer(),
    };

    const action = {
      type: 'decline_transaction' as const,
      playerId: 'player2',
      transactionId: 'tx1',
    };

    const result = validateDeclineTransaction(state, action);

    expect(result.valid).toBe(true);
  });

  it('should allow initiator to decline (withdraw)', () => {
    const state = createMockGameState();
    state.pendingTransaction = {
      id: 'tx1',
      initiatorId: 'player1',
      targetId: 'player2',
      initiatorOffer: createMockOffer(),
      requestedOffer: createMockOffer(),
    };

    const action = {
      type: 'decline_transaction' as const,
      playerId: 'player1',
      transactionId: 'tx1',
    };

    const result = validateDeclineTransaction(state, action);

    expect(result.valid).toBe(true);
  });
});
