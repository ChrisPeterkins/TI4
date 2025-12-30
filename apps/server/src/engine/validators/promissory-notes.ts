/**
 * Promissory Note Validators
 *
 * Validates playing promissory notes including:
 * - Note is in player's hand
 * - Correct timing for the note type
 * - Required targets are provided
 * - Original owner can fulfill any costs
 */

import type {
  GameState,
  PlayPromissoryNoteAction,
} from '@ti4/shared';
import { getPromissoryNoteById, getBaseNoteId } from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';

/**
 * Validate a play_promissory_note action
 */
export function validatePlayPromissoryNote(
  state: GameState,
  action: PlayPromissoryNoteAction
): ValidationResult {
  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  const noteId = action.noteId;
  const noteDef = getPromissoryNoteById(noteId);
  if (!noteDef) {
    return { valid: false, error: `Promissory note ${noteId} not found` };
  }

  // Check note is in player's hand
  if (!player.promissoryNotesInHand.includes(noteId)) {
    return { valid: false, error: 'Promissory note not in hand' };
  }

  // Find original owner
  const originalOwner = state.players.find((p) =>
    p.promissoryNotesOwned.includes(noteId)
  );
  if (!originalOwner) {
    return { valid: false, error: 'Could not find original owner of note' };
  }

  // Validate timing
  const timingResult = validateTiming(state, player, noteDef.playTiming);
  if (!timingResult.valid) {
    return timingResult;
  }

  // Validate note-specific requirements
  const baseId = getBaseNoteId(noteId);
  const noteResult = validateNoteSpecificRequirements(state, action, originalOwner, baseId);
  if (!noteResult.valid) {
    return noteResult;
  }

  return { valid: true };
}

/**
 * Validate timing for playing a promissory note
 */
function validateTiming(
  state: GameState,
  player: { id: string },
  timing: string
): ValidationResult {
  switch (timing) {
    case 'action':
      if (state.phase !== 'action') {
        return { valid: false, error: 'ACTION notes can only be played during action phase' };
      }
      if (state.subPhase !== 'awaiting_action') {
        return { valid: false, error: 'Cannot play ACTION note during another action' };
      }
      if (state.activePlayerId !== player.id) {
        return { valid: false, error: 'Can only play ACTION notes on your turn' };
      }
      return { valid: true };

    case 'immediate':
      // Immediate notes are handled during transaction, not by direct play
      return { valid: false, error: 'Immediate play notes are handled during transactions' };

    case 'start_of_turn':
      if (state.phase !== 'action') {
        return { valid: false, error: 'Can only play at start of turn during action phase' };
      }
      if (state.activePlayerId !== player.id) {
        return { valid: false, error: 'Can only play at start of your turn' };
      }
      return { valid: true };

    case 'start_of_combat':
      if (!state.activeCombat) {
        return { valid: false, error: 'No active combat' };
      }
      return { valid: true };

    case 'start_of_combat_round':
      if (!state.activeCombat) {
        return { valid: false, error: 'No active combat' };
      }
      return { valid: true };

    case 'start_of_invasion':
      if (state.subPhase !== 'tactical_invasion') {
        return { valid: false, error: 'Not in invasion phase' };
      }
      return { valid: true };

    case 'start_of_ground_combat':
      if (!state.activeCombat || state.activeCombat.type !== 'ground') {
        return { valid: false, error: 'Not in ground combat' };
      }
      return { valid: true };

    case 'when_agenda_revealed':
      if (state.phase !== 'agenda') {
        return { valid: false, error: 'Can only play when agenda is revealed' };
      }
      return { valid: true };

    case 'end_of_strategy_phase':
      if (state.phase !== 'strategy') {
        return { valid: false, error: 'Can only play at end of strategy phase' };
      }
      return { valid: true };

    // These are handled via timing windows, not direct play
    case 'after_activation':
    case 'when_replenish':
    case 'after_tech_research':
    case 'after_commit_ground':
    case 'after_indoctrination':
      return { valid: false, error: 'This note is played via timing window' };

    default:
      return { valid: false, error: `Unknown timing: ${timing}` };
  }
}

/**
 * Validate note-specific requirements
 */
function validateNoteSpecificRequirements(
  state: GameState,
  action: PlayPromissoryNoteAction,
  originalOwner: { id: string; tradeGoods: number; commandTokens: { strategy: number; fleet: number } },
  baseId: string
): ValidationResult {
  switch (baseId) {
    case 'war_funding':
      // Letnev needs 2 trade goods
      if (originalOwner.tradeGoods < 2) {
        return { valid: false, error: 'Letnev player does not have 2 trade goods' };
      }
      return { valid: true };

    case 'fires_of_the_gashlai':
      // Muaat needs 1 fleet token
      if (originalOwner.commandTokens.fleet < 1) {
        return { valid: false, error: 'Muaat player has no fleet tokens' };
      }
      return { valid: true };

    case 'political_favor':
      // Xxcha needs 1 strategy token
      if (originalOwner.commandTokens.strategy < 1) {
        return { valid: false, error: 'Xxcha player has no strategy tokens' };
      }
      return { valid: true };

    case 'military_support':
      // Sol needs 1 strategy token
      if (originalOwner.commandTokens.strategy < 1) {
        return { valid: false, error: 'Sol player has no strategy tokens' };
      }
      return { valid: true };

    case 'research_agreement':
      // Needs target tech ID
      if (!action.targetTechId) {
        return { valid: false, error: 'Must specify technology to gain' };
      }
      return { valid: true };

    case 'spy_net':
      // Needs target card ID
      if (!action.targetCardId) {
        return { valid: false, error: 'Must specify action card to take' };
      }
      // Card must be in Yssaril's hand
      const yssaril = state.players.find((p) => p.faction === 'yssaril');
      if (!yssaril || !yssaril.actionCards.includes(action.targetCardId)) {
        return { valid: false, error: 'Card not in Yssaril hand' };
      }
      return { valid: true };

    case 'raghs_call':
      // Needs target planet
      if (!action.targetPlanetId) {
        return { valid: false, error: 'Must specify target planet' };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
}
