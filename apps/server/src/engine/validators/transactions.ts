/**
 * Transaction Validators
 *
 * Validates trading between players including:
 * - Trade goods and commodities
 * - Promissory notes (max 1 per transaction)
 * - Action cards
 *
 * Rules:
 * - Players can only transact with neighbors (unless one has Trade Convoys)
 * - Each player can only transact once per action phase with each other player
 * - Max 1 promissory note per direction per transaction
 * - Notes in play area cannot be traded
 */

import type {
  GameState,
  PlayerState,
  ProposeTransactionAction,
  AcceptTransactionAction,
  DeclineTransactionAction,
  TransactionOffer,
} from '@ti4/shared';
import { getBaseNoteId } from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';

/**
 * Validate a propose_transaction action
 */
export function validateProposeTransaction(
  state: GameState,
  action: ProposeTransactionAction
): ValidationResult {
  // Must be action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Transactions can only occur during action phase' };
  }

  // Check for existing pending transaction
  if (state.pendingTransaction) {
    return { valid: false, error: 'There is already a pending transaction' };
  }

  const initiator = state.players.find((p) => p.id === action.playerId);
  const target = state.players.find((p) => p.id === action.targetPlayerId);

  if (!initiator) {
    return { valid: false, error: 'Initiator player not found' };
  }
  if (!target) {
    return { valid: false, error: 'Target player not found' };
  }

  // Cannot transact with self
  if (initiator.id === target.id) {
    return { valid: false, error: 'Cannot transact with yourself' };
  }

  // Validate players are neighbors (or Trade Convoys is active)
  if (!canTransact(state, initiator, target)) {
    return { valid: false, error: 'Players cannot transact - not neighbors and no Trade Convoys' };
  }

  // Validate players haven't already transacted this action phase
  if (initiator.transactedWith.includes(target.id)) {
    return { valid: false, error: 'Already transacted with this player this action phase' };
  }

  // Validate the initiator's offer
  const initiatorOfferValid = validateOffer(initiator, action.offering);
  if (!initiatorOfferValid.valid) {
    return { valid: false, error: `Invalid offer: ${initiatorOfferValid.error}` };
  }

  // Validate the requested offer from target
  const targetOfferValid = validateOffer(target, action.requesting);
  if (!targetOfferValid.valid) {
    return { valid: false, error: `Invalid request: ${targetOfferValid.error}` };
  }

  return { valid: true };
}

/**
 * Validate an accept_transaction action
 */
export function validateAcceptTransaction(
  state: GameState,
  action: AcceptTransactionAction
): ValidationResult {
  const transaction = state.pendingTransaction;
  if (!transaction) {
    return { valid: false, error: 'No pending transaction' };
  }

  if (transaction.id !== action.transactionId) {
    return { valid: false, error: 'Transaction ID mismatch' };
  }

  // Only target can accept
  if (action.playerId !== transaction.targetId) {
    return { valid: false, error: 'Only the target player can accept the transaction' };
  }

  const initiator = state.players.find((p) => p.id === transaction.initiatorId);
  const target = state.players.find((p) => p.id === transaction.targetId);

  if (!initiator || !target) {
    return { valid: false, error: 'Players not found' };
  }

  // Re-validate offers (in case state changed since proposal)
  const initiatorOfferValid = validateOffer(initiator, transaction.initiatorOffer);
  if (!initiatorOfferValid.valid) {
    return { valid: false, error: `Initiator can no longer fulfill offer: ${initiatorOfferValid.error}` };
  }

  const targetOfferValid = validateOffer(target, transaction.requestedOffer);
  if (!targetOfferValid.valid) {
    return { valid: false, error: `Target can no longer fulfill request: ${targetOfferValid.error}` };
  }

  return { valid: true };
}

/**
 * Validate a decline_transaction action
 */
export function validateDeclineTransaction(
  state: GameState,
  action: DeclineTransactionAction
): ValidationResult {
  const transaction = state.pendingTransaction;
  if (!transaction) {
    return { valid: false, error: 'No pending transaction' };
  }

  if (transaction.id !== action.transactionId) {
    return { valid: false, error: 'Transaction ID mismatch' };
  }

  // Either player can decline
  if (action.playerId !== transaction.targetId && action.playerId !== transaction.initiatorId) {
    return { valid: false, error: 'Only involved players can decline the transaction' };
  }

  return { valid: true };
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
  offer: TransactionOffer
): { valid: boolean; error?: string } {
  // Validate trade goods
  if (offer.tradeGoods && offer.tradeGoods > player.tradeGoods) {
    return { valid: false, error: 'Not enough trade goods' };
  }

  if (offer.tradeGoods && offer.tradeGoods < 0) {
    return { valid: false, error: 'Cannot offer negative trade goods' };
  }

  // Validate commodities
  if (offer.commodities && offer.commodities > player.commodities) {
    return { valid: false, error: 'Not enough commodities' };
  }

  if (offer.commodities && offer.commodities < 0) {
    return { valid: false, error: 'Cannot offer negative commodities' };
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

  // Validate action cards
  if (offer.actionCards && offer.actionCards.length > 0) {
    for (const cardId of offer.actionCards) {
      if (!player.actionCards.includes(cardId)) {
        return { valid: false, error: `Action card ${cardId} not in hand` };
      }
    }
  }

  return { valid: true };
}
