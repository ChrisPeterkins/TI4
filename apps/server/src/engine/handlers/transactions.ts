/**
 * Transaction Handlers
 *
 * Handles trading between players including:
 * - Trade goods and commodities
 * - Promissory notes (max 1 per transaction)
 * - Action cards
 *
 * Rules:
 * - Players can only transact with neighbors (unless one has Trade Convoys)
 * - Each player can only transact once per action phase with each other player
 * - Max 1 promissory note per direction per transaction
 * - Notes in play area cannot be traded
 * - Support for the Throne and Alliance must be played immediately when received
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  GameState,
  PlayerState,
  ProposeTransactionAction,
  AcceptTransactionAction,
  DeclineTransactionAction,
  PendingTransaction,
} from '@ti4/shared';
import {
  isImmediatePlayNote,
  noteStaysInPlay,
  getBaseNoteId,
  getPromissoryNoteById,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { logPromissoryNoteReturned } from '../utils/game-log.js';

/**
 * Handle a player proposing a transaction to another player
 */
export function handleProposeTransaction(
  state: GameState,
  action: ProposeTransactionAction
): HandlerResult {
  const initiator = state.players.find((p) => p.id === action.playerId);
  const target = state.players.find((p) => p.id === action.targetPlayerId);

  if (!initiator) {
    return { success: false, error: 'Initiator player not found' };
  }
  if (!target) {
    return { success: false, error: 'Target player not found' };
  }

  // Validate it's action phase
  if (state.phase !== 'action') {
    return { success: false, error: 'Transactions can only occur during action phase' };
  }

  // Check if there's already a pending transaction
  if (state.pendingTransaction) {
    return { success: false, error: 'There is already a pending transaction' };
  }

  // Validate players are neighbors (or Trade Convoys is active)
  if (!canTransact(state, initiator, target)) {
    return { success: false, error: 'Players cannot transact - not neighbors' };
  }

  // Validate players haven't already transacted this action phase
  if (initiator.transactedWith.includes(target.id)) {
    return { success: false, error: 'Already transacted with this player this action phase' };
  }

  // Validate the offers
  const initiatorOfferValid = validateOffer(initiator, action.offering);
  if (!initiatorOfferValid.valid) {
    return { success: false, error: `Invalid offer: ${initiatorOfferValid.error}` };
  }

  const targetOfferValid = validateOffer(target, action.requesting);
  if (!targetOfferValid.valid) {
    return { success: false, error: `Invalid request: ${targetOfferValid.error}` };
  }

  // Create pending transaction
  state.pendingTransaction = {
    id: uuidv4(),
    initiatorId: initiator.id,
    targetId: target.id,
    initiatorOffer: action.offering,
    requestedOffer: action.requesting,
    createdAt: Date.now(),
  };

  state.version++;

  return {
    success: true,
    triggeredEvents: ['transaction_proposed'],
    data: { transactionId: state.pendingTransaction.id },
  };
}

/**
 * Handle target player accepting a transaction
 */
export function handleAcceptTransaction(
  state: GameState,
  action: AcceptTransactionAction
): HandlerResult {
  const transaction = state.pendingTransaction;
  if (!transaction || transaction.id !== action.transactionId) {
    return { success: false, error: 'Transaction not found' };
  }

  // Only target can accept
  if (action.playerId !== transaction.targetId) {
    return { success: false, error: 'Only the target player can accept the transaction' };
  }

  const initiator = state.players.find((p) => p.id === transaction.initiatorId);
  const target = state.players.find((p) => p.id === transaction.targetId);

  if (!initiator || !target) {
    return { success: false, error: 'Players not found' };
  }

  // Re-validate offers (in case state changed)
  const initiatorOfferValid = validateOffer(initiator, transaction.initiatorOffer);
  if (!initiatorOfferValid.valid) {
    state.pendingTransaction = undefined;
    return { success: false, error: `Initiator can no longer fulfill offer: ${initiatorOfferValid.error}` };
  }

  const targetOfferValid = validateOffer(target, transaction.requestedOffer);
  if (!targetOfferValid.valid) {
    state.pendingTransaction = undefined;
    return { success: false, error: `Target can no longer fulfill request: ${targetOfferValid.error}` };
  }

  // Execute the transaction
  executeTransaction(state, initiator, target, transaction);

  // Clear pending transaction
  state.pendingTransaction = undefined;
  state.version++;

  return {
    success: true,
    triggeredEvents: ['transaction_accepted'],
    data: { transactionId: action.transactionId },
  };
}

/**
 * Handle target player declining a transaction
 */
export function handleDeclineTransaction(
  state: GameState,
  action: DeclineTransactionAction
): HandlerResult {
  const transaction = state.pendingTransaction;
  if (!transaction || transaction.id !== action.transactionId) {
    return { success: false, error: 'Transaction not found' };
  }

  // Either player can decline
  if (action.playerId !== transaction.targetId && action.playerId !== transaction.initiatorId) {
    return { success: false, error: 'Only the involved players can decline the transaction' };
  }

  // Clear pending transaction
  state.pendingTransaction = undefined;
  state.version++;

  return {
    success: true,
    triggeredEvents: ['transaction_declined'],
    data: { transactionId: action.transactionId },
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if two players can transact
 * Players must be neighbors OR one has Trade Convoys in play
 */
function canTransact(state: GameState, player1: PlayerState, player2: PlayerState): boolean {
  // Check if they're neighbors
  if (player1.neighbors.includes(player2.id)) {
    return true;
  }

  // Check if either has Trade Convoys (Hacan promissory) in play
  const hasTradeConvoys = (player: PlayerState) =>
    player.promissoryNotesInPlay.some((note) => getBaseNoteId(note.noteId) === 'trade_convoys');

  if (hasTradeConvoys(player1) || hasTradeConvoys(player2)) {
    return true;
  }

  return false;
}

/**
 * Validate that a player can fulfill an offer
 */
function validateOffer(
  player: PlayerState,
  offer: PendingTransaction['initiatorOffer']
): { valid: boolean; error?: string } {
  // Validate trade goods
  if (offer.tradeGoods && offer.tradeGoods > player.tradeGoods) {
    return { valid: false, error: 'Not enough trade goods' };
  }

  // Validate commodities
  if (offer.commodities && offer.commodities > player.commodities) {
    return { valid: false, error: 'Not enough commodities' };
  }

  // Validate promissory notes
  if (offer.promissoryNotes && offer.promissoryNotes.length > 0) {
    // Max 1 promissory note per transaction
    if (offer.promissoryNotes.length > 1) {
      return { valid: false, error: 'Can only trade 1 promissory note per transaction' };
    }

    const noteId = offer.promissoryNotes[0];

    // Must be in hand
    if (!player.promissoryNotesInHand.includes(noteId)) {
      return { valid: false, error: 'Promissory note not in hand' };
    }

    // Cannot trade notes in play area
    if (player.promissoryNotesInPlay.some((n) => n.noteId === noteId)) {
      return { valid: false, error: 'Cannot trade promissory notes in play area' };
    }
  }

  // Validate action cards (only Hacan can trade via Arbiters ability)
  if (offer.actionCards && offer.actionCards.length > 0) {
    // Only Hacan can trade action cards (Arbiters faction ability)
    if (player.faction !== 'hacan') {
      return { valid: false, error: 'Only the Emirates of Hacan can trade action cards' };
    }

    for (const cardId of offer.actionCards) {
      if (!player.actionCards.includes(cardId)) {
        return { valid: false, error: 'Action card not in hand' };
      }
    }
  }

  return { valid: true };
}

/**
 * Execute a transaction between two players
 */
function executeTransaction(
  state: GameState,
  initiator: PlayerState,
  target: PlayerState,
  transaction: PendingTransaction
): void {
  const { initiatorOffer, requestedOffer } = transaction;

  // Transfer from initiator to target
  transferOffer(state, initiator, target, initiatorOffer);

  // Transfer from target to initiator
  transferOffer(state, target, initiator, requestedOffer);

  // Mark as transacted with each other
  initiator.transactedWith.push(target.id);
  target.transactedWith.push(initiator.id);
}

/**
 * Transfer items from one player to another
 */
function transferOffer(
  state: GameState,
  from: PlayerState,
  to: PlayerState,
  offer: PendingTransaction['initiatorOffer']
): void {
  // Transfer trade goods
  if (offer.tradeGoods && offer.tradeGoods > 0) {
    from.tradeGoods -= offer.tradeGoods;
    to.tradeGoods += offer.tradeGoods;
  }

  // Transfer commodities (become trade goods for recipient)
  if (offer.commodities && offer.commodities > 0) {
    from.commodities -= offer.commodities;
    to.tradeGoods += offer.commodities; // Commodities become TG when traded
  }

  // Transfer promissory notes
  if (offer.promissoryNotes && offer.promissoryNotes.length > 0) {
    for (const noteId of offer.promissoryNotes) {
      // Remove from sender's hand
      const noteIndex = from.promissoryNotesInHand.indexOf(noteId);
      if (noteIndex !== -1) {
        from.promissoryNotesInHand.splice(noteIndex, 1);
      }

      // Handle immediate play notes (Support for Throne, Alliance)
      if (isImmediatePlayNote(noteId)) {
        handleImmediatePlayNote(state, to, from, noteId);
      } else {
        // Add to recipient's hand
        to.promissoryNotesInHand.push(noteId);
      }
    }
  }

  // Transfer action cards
  if (offer.actionCards && offer.actionCards.length > 0) {
    for (const cardId of offer.actionCards) {
      const cardIndex = from.actionCards.indexOf(cardId);
      if (cardIndex !== -1) {
        from.actionCards.splice(cardIndex, 1);
        to.actionCards.push(cardId);
      }
    }
  }
}

/**
 * Handle promissory notes that must be played immediately when received
 * (Support for the Throne, Alliance)
 */
function handleImmediatePlayNote(
  state: GameState,
  receiver: PlayerState,
  giver: PlayerState,
  noteId: string
): void {
  const baseId = getBaseNoteId(noteId);

  if (baseId === 'support_for_the_throne') {
    // Place in receiver's play area
    receiver.promissoryNotesInPlay.push({
      noteId,
      originalOwnerId: getOriginalOwner(state, noteId),
      receivedFrom: giver.id,
      placedRound: state.round,
    });

    // Giver gains 1 VP
    const originalOwner = state.players.find(
      (p) => p.promissoryNotesOwned.includes(noteId)
    );
    if (originalOwner) {
      originalOwner.score += 1;
    }
  } else if (baseId === 'alliance') {
    // Place in receiver's play area
    receiver.promissoryNotesInPlay.push({
      noteId,
      originalOwnerId: getOriginalOwner(state, noteId),
      receivedFrom: giver.id,
      placedRound: state.round,
    });
    // Alliance enables commander ability sharing - handled elsewhere
  }
}

/**
 * Get the original owner of a promissory note
 */
function getOriginalOwner(state: GameState, noteId: string): string {
  for (const player of state.players) {
    if (player.promissoryNotesOwned.includes(noteId)) {
      return player.id;
    }
  }
  return '';
}

/**
 * Return a promissory note to its original owner
 * Called when return conditions are met (system activation, etc.)
 */
export function returnPromissoryNote(
  state: GameState,
  holderId: string,
  noteId: string,
  reason: 'activation' | 'elimination' | 'resolved'
): HandlerResult {
  const holder = state.players.find((p) => p.id === holderId);
  if (!holder) {
    return { success: false, error: 'Holder not found' };
  }

  // Check if note is in play area
  const playIndex = holder.promissoryNotesInPlay.findIndex((n) => n.noteId === noteId);
  if (playIndex !== -1) {
    const noteInPlay = holder.promissoryNotesInPlay[playIndex];

    // Handle Support for the Throne VP loss
    const baseId = getBaseNoteId(noteId);
    if (baseId === 'support_for_the_throne') {
      const originalOwner = state.players.find((p) => p.id === noteInPlay.originalOwnerId);
      if (originalOwner) {
        originalOwner.score = Math.max(0, originalOwner.score - 1);
      }
    }

    // Remove from play area
    holder.promissoryNotesInPlay.splice(playIndex, 1);

    // Return to original owner's hand
    const originalOwner = state.players.find((p) => p.id === noteInPlay.originalOwnerId);
    if (originalOwner) {
      originalOwner.promissoryNotesInHand.push(noteId);
    }

    // Log the return
    const noteDef = getPromissoryNoteById(noteId);
    logPromissoryNoteReturned(
      state,
      holderId,
      noteId,
      noteDef?.name || noteId,
      noteInPlay.originalOwnerId,
      reason
    );

    return {
      success: true,
      triggeredEvents: ['promissory_note_returned'],
      data: { noteId, reason },
    };
  }

  // Check if note is in hand
  const handIndex = holder.promissoryNotesInHand.indexOf(noteId);
  if (handIndex !== -1) {
    holder.promissoryNotesInHand.splice(handIndex, 1);

    const originalOwnerId = getOriginalOwner(state, noteId);
    const originalOwner = state.players.find((p) => p.id === originalOwnerId);
    if (originalOwner) {
      originalOwner.promissoryNotesInHand.push(noteId);
    }

    return {
      success: true,
      triggeredEvents: ['promissory_note_returned'],
      data: { noteId, reason },
    };
  }

  return { success: false, error: 'Note not found with holder' };
}

/**
 * Check and return promissory notes when a player activates a system
 * containing another player's units
 */
export function checkPromissoryReturnsOnActivation(
  state: GameState,
  activatingPlayerId: string,
  systemId: string
): void {
  const activatingPlayer = state.players.find((p) => p.id === activatingPlayerId);
  if (!activatingPlayer) return;

  // Find the tile
  const tile = state.map.tiles.find((t) => t.id === systemId);
  if (!tile) return;

  // Find all other players with units in this system
  const playersInSystem = new Set<string>();

  // Check space units
  for (const unit of tile.units) {
    if (unit.ownerId !== activatingPlayerId) {
      playersInSystem.add(unit.ownerId);
    }
  }

  // Check planet units
  for (const planet of tile.planets) {
    for (const unit of planet.units) {
      if (unit.ownerId !== activatingPlayerId) {
        playersInSystem.add(unit.ownerId);
      }
    }
  }

  // For each player in the system, check if the activating player has their notes
  for (const otherPlayerId of playersInSystem) {
    // Check activating player's notes in play that belong to this player
    const notesToReturn: string[] = [];

    for (const noteInPlay of activatingPlayer.promissoryNotesInPlay) {
      if (noteInPlay.originalOwnerId === otherPlayerId) {
        // Check if this note has activation return condition
        const baseId = getBaseNoteId(noteInPlay.noteId);
        if (
          baseId === 'support_for_the_throne' ||
          baseId === 'alliance' ||
          baseId === 'ceasefire' ||
          baseId === 'stymie' ||
          baseId === 'trade_convoys' ||
          baseId === 'promise_of_protection' ||
          baseId === 'antivirus'
        ) {
          notesToReturn.push(noteInPlay.noteId);
        }
      }
    }

    // Return each note
    for (const noteId of notesToReturn) {
      returnPromissoryNote(state, activatingPlayerId, noteId, 'activation');
    }
  }
}

/**
 * Clear transactedWith lists at the start of each action phase round
 * (Called when a new round of actions begins)
 */
export function clearTransactionHistory(state: GameState): void {
  for (const player of state.players) {
    player.transactedWith = [];
  }
}
