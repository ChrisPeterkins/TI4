/**
 * Promissory Note Play Handlers
 *
 * Handles playing promissory notes from hand for their effects:
 * - ACTION: notes (component actions)
 * - Timing-based notes (when specific triggers occur)
 * - Immediate play notes (Support for Throne, Alliance)
 *
 * Notes can:
 * - Stay in play area (ongoing effects)
 * - Resolve immediately and return to owner
 */

import type {
  GameState,
  PlayerState,
  PlayPromissoryNoteAction,
} from '@ti4/shared';
import {
  getPromissoryNoteById,
  getBaseNoteId,
  noteStaysInPlay,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';

/**
 * Handle playing a promissory note
 */
export function handlePlayPromissoryNote(
  state: GameState,
  action: PlayPromissoryNoteAction
): HandlerResult {
  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const noteId = action.noteId;
  const noteDef = getPromissoryNoteById(noteId);
  if (!noteDef) {
    return { success: false, error: `Promissory note ${noteId} not found` };
  }

  // Check note is in player's hand
  const noteIndex = player.promissoryNotesInHand.indexOf(noteId);
  if (noteIndex === -1) {
    return { success: false, error: 'Promissory note not in hand' };
  }

  // Validate timing
  const timingValid = validateNoteTiming(state, player, noteDef.playTiming);
  if (!timingValid.valid) {
    return { success: false, error: timingValid.error };
  }

  // Remove from hand
  player.promissoryNotesInHand.splice(noteIndex, 1);

  // Find original owner
  const originalOwner = findOriginalOwner(state, noteId);
  if (!originalOwner) {
    return { success: false, error: 'Could not find original owner of note' };
  }

  // Execute the note's effect
  const result = executeNoteEffect(state, player, originalOwner, noteId, action);
  if (!result.success) {
    // Rollback - put note back in hand
    player.promissoryNotesInHand.push(noteId);
    return result;
  }

  // Handle note placement
  if (noteStaysInPlay(noteId)) {
    // Place in player's play area
    player.promissoryNotesInPlay.push({
      noteId,
      originalOwnerId: originalOwner.id,
      receivedFrom: originalOwner.id,
      placedRound: state.round,
    });
  } else {
    // Return to original owner's hand
    originalOwner.promissoryNotesInHand.push(noteId);
  }

  state.version++;

  return {
    success: true,
    triggeredEvents: ['promissory_note_played'],
    data: {
      noteId,
      playerId: player.id,
      originalOwnerId: originalOwner.id,
      staysInPlay: noteStaysInPlay(noteId),
    },
  };
}

/**
 * Validate that the note can be played at the current timing
 */
function validateNoteTiming(
  state: GameState,
  player: PlayerState,
  timing: string
): { valid: boolean; error?: string } {
  switch (timing) {
    case 'action':
      // Must be action phase, awaiting action, and player's turn
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
      // These are handled during transaction, not by this handler
      return { valid: false, error: 'Immediate play notes are handled during transactions' };

    case 'start_of_turn':
      // Must be action phase and player's turn
      if (state.phase !== 'action') {
        return { valid: false, error: 'Can only play at start of turn during action phase' };
      }
      if (state.activePlayerId !== player.id) {
        return { valid: false, error: 'Can only play at start of your turn' };
      }
      return { valid: true };

    case 'start_of_combat':
      // Must be in combat (early states like anti_fighter_barrage or announce_retreat)
      if (!state.activeCombat) {
        return { valid: false, error: 'No active combat' };
      }
      // Can play at start of combat (before main combat rounds)
      if (
        state.activeCombat.state !== 'anti_fighter_barrage' &&
        state.activeCombat.state !== 'announce_retreat' &&
        state.activeCombat.roundNumber > 1
      ) {
        return { valid: false, error: 'Combat has already started' };
      }
      return { valid: true };

    case 'start_of_combat_round':
      // Must be in combat, at round start
      if (!state.activeCombat) {
        return { valid: false, error: 'No active combat' };
      }
      if (state.activeCombat.state !== 'combat_round_roll') {
        return { valid: false, error: 'Not at start of combat round' };
      }
      return { valid: true };

    case 'start_of_invasion':
      // Must be in invasion phase
      if (state.subPhase !== 'tactical_invasion') {
        return { valid: false, error: 'Not in invasion phase' };
      }
      return { valid: true };

    case 'start_of_ground_combat':
      // Must be in ground combat
      if (!state.activeCombat || state.activeCombat.type !== 'ground') {
        return { valid: false, error: 'Not in ground combat' };
      }
      // Can play at start of ground combat (round 1)
      if (state.activeCombat.roundNumber > 1) {
        return { valid: false, error: 'Ground combat has already started' };
      }
      return { valid: true };

    case 'after_activation':
      // Handled via timing window, not direct play
      return { valid: false, error: 'This note is played via timing window after activation' };

    case 'when_replenish':
      // Handled via timing window during Trade secondary
      return { valid: false, error: 'This note is played when commodities are replenished' };

    case 'when_agenda_revealed':
      // Must be agenda phase, agenda just revealed
      if (state.phase !== 'agenda') {
        return { valid: false, error: 'Can only play when agenda is revealed' };
      }
      return { valid: true };

    case 'end_of_strategy_phase':
      // Must be end of strategy phase
      if (state.phase !== 'strategy') {
        return { valid: false, error: 'Can only play at end of strategy phase' };
      }
      return { valid: true };

    case 'after_tech_research':
      // Handled via timing window after Jol-Nar researches
      return { valid: false, error: 'This note is played via timing window after tech research' };

    case 'after_commit_ground':
      // Handled via timing window after committing ground forces
      return { valid: false, error: 'This note is played via timing window after committing forces' };

    case 'after_indoctrination':
      // Handled via timing window after Yin uses Indoctrination
      return { valid: false, error: 'This note is played via timing window after Indoctrination' };

    default:
      return { valid: false, error: `Unknown timing: ${timing}` };
  }
}

/**
 * Find the original owner of a promissory note
 */
function findOriginalOwner(state: GameState, noteId: string): PlayerState | undefined {
  for (const player of state.players) {
    if (player.promissoryNotesOwned.includes(noteId)) {
      return player;
    }
  }
  return undefined;
}

/**
 * Execute the specific effect of a promissory note
 */
function executeNoteEffect(
  state: GameState,
  player: PlayerState,
  originalOwner: PlayerState,
  noteId: string,
  action: PlayPromissoryNoteAction
): HandlerResult {
  const baseId = getBaseNoteId(noteId);

  switch (baseId) {
    // =========================================================================
    // GENERIC NOTES
    // =========================================================================

    case 'support_for_the_throne':
      // Handled during transaction - grants 1 VP to original owner
      originalOwner.score += 1;
      return { success: true };

    case 'ceasefire':
      // Effect: Owner cannot move into active system this tactical action
      // This is tracked via a flag or checked during movement validation
      if (!state.activeCombat && state.subPhase !== 'tactical_movement') {
        return { success: false, error: 'Ceasefire can only be played during tactical action' };
      }
      // The effect is enforced by movement validators checking for ceasefire
      return { success: true };

    case 'trade_agreement':
      // Effect: Swap commodities with original owner
      const playerCommodities = player.commodities;
      const ownerCommodities = originalOwner.commodities;
      player.commodities = ownerCommodities;
      originalOwner.commodities = playerCommodities;
      // Note: The swapped commodities stay as commodities, not trade goods
      return { success: true };

    case 'political_secret':
      // Effect: Original owner cannot vote or play cards during this agenda
      // This is enforced by the agenda voting validators
      return { success: true };

    case 'alliance':
      // Effect: Player can use original owner's commander
      // This is checked during ability resolution
      return { success: true };

    // =========================================================================
    // FACTION NOTES
    // =========================================================================

    case 'stymie':
      // Arborec - Player places in play area, Arborec can't produce near player's units
      // Effect is enforced by production validators
      return { success: true };

    case 'creuss_iff':
      // Creuss - Place/move Creuss wormhole token
      // Would need wormhole token tracking
      return { success: true };

    case 'trade_convoys':
      // Hacan - Player can transact with non-neighbors
      // Effect is enforced by transaction validators (canTransact check)
      return { success: true };

    case 'research_agreement':
      // Jol-Nar - Gain same tech that Jol-Nar just researched
      if (!action.targetTechId) {
        return { success: false, error: 'Must specify technology to gain' };
      }
      if (!player.technologies.includes(action.targetTechId)) {
        player.technologies.push(action.targetTechId);
      }
      return { success: true };

    case 'cybernetic_enhancements':
      // L1Z1X - Replace infantry with fighters at start of ground combat
      if (!state.activeCombat || state.activeCombat.type !== 'ground') {
        return { success: false, error: 'Can only play at start of ground combat' };
      }
      // The actual replacement would be handled by the combat system
      return { success: true };

    case 'war_funding':
      // Letnev - Letnev loses 2 TG, player can reroll dice this combat round
      if (originalOwner.tradeGoods < 2) {
        return { success: false, error: 'Letnev player does not have 2 trade goods' };
      }
      originalOwner.tradeGoods -= 2;
      // Reroll ability would be tracked on the combat state
      return { success: true };

    case 'promise_of_protection':
      // Mentak - Mentak can't use Pillage against player
      // Effect is enforced by Pillage ability checks
      return { success: true };

    case 'fires_of_the_gashlai':
      // Muaat - Remove 1 fleet token from Muaat, gain War Sun upgrade
      if (originalOwner.commandTokens.fleet < 1) {
        return { success: false, error: 'Muaat player has no fleet tokens' };
      }
      originalOwner.commandTokens.fleet -= 1;
      // Grant War Sun II technology
      if (!player.technologies.includes('war_sun_2')) {
        player.technologies.push('war_sun_2');
      }
      return { success: true };

    case 'gift_of_prescience':
      // Naalu - Place Naalu "0" token on strategy card
      // This would need a special tracking field for the "0" initiative
      return { success: true };

    case 'antivirus':
      // Nekro - Nekro can't use Technological Singularity against player
      // Effect is enforced by ability checks
      return { success: true };

    case 'raghs_call':
      // Saar - Remove Saar's ground forces from invaded planet
      // Would need target planet and relocation planet
      if (!action.targetPlanetId) {
        return { success: false, error: 'Must specify target planet' };
      }
      // The actual unit removal would be handled by invasion system
      return { success: true };

    case 'tekklar_legion':
      // Sardakk - +1 to player's combat rolls, -1 to N'orr's during invasion
      // Effect is applied during combat roll phase
      return { success: true };

    case 'military_support':
      // Sol - Remove Sol strategy token, player gains 2 infantry
      if (originalOwner.commandTokens.strategy < 1) {
        return { success: false, error: 'Sol player has no strategy tokens' };
      }
      originalOwner.commandTokens.strategy -= 1;
      // Player would place 2 infantry on a planet they control
      // Would need target planet
      return { success: true };

    case 'acquiescence':
      // Winnu - Exchange strategy card with Winnu
      // Would need target strategy card selection
      return { success: true };

    case 'political_favor':
      // Xxcha - Remove Xxcha strategy token, discard agenda and reveal new one
      if (originalOwner.commandTokens.strategy < 1) {
        return { success: false, error: 'Xxcha player has no strategy tokens' };
      }
      originalOwner.commandTokens.strategy -= 1;
      // The agenda replacement would be handled by agenda system
      return { success: true };

    case 'greyfire_mutagen':
      // Yin - Gain infantry that was replaced by Indoctrination
      // Would need the unit that was just replaced
      return { success: true };

    case 'spy_net':
      // Yssaril - Look at Yssaril's action cards, take one
      if (!action.targetCardId) {
        return { success: false, error: 'Must specify action card to take' };
      }
      const cardIndex = originalOwner.actionCards.indexOf(action.targetCardId);
      if (cardIndex === -1) {
        return { success: false, error: 'Card not in Yssaril hand' };
      }
      originalOwner.actionCards.splice(cardIndex, 1);
      player.actionCards.push(action.targetCardId);
      return { success: true };

    default:
      return { success: false, error: `Unknown promissory note: ${baseId}` };
  }
}

/**
 * Return a promissory note from play area to owner's hand
 */
export function returnPromissoryNoteFromPlay(
  state: GameState,
  holderId: string,
  noteId: string,
  reason: 'activation' | 'elimination' | 'resolved'
): HandlerResult {
  const holder = state.players.find((p) => p.id === holderId);
  if (!holder) {
    return { success: false, error: 'Holder not found' };
  }

  // Find note in play area
  const playIndex = holder.promissoryNotesInPlay.findIndex((n) => n.noteId === noteId);
  if (playIndex === -1) {
    return { success: false, error: 'Note not found in play area' };
  }

  const noteInPlay = holder.promissoryNotesInPlay[playIndex];
  const baseId = getBaseNoteId(noteId);

  // Handle special effects when returning
  if (baseId === 'support_for_the_throne') {
    // Original owner loses 1 VP
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

  state.version++;

  return {
    success: true,
    triggeredEvents: ['promissory_note_returned'],
    data: { noteId, reason, originalOwnerId: noteInPlay.originalOwnerId },
  };
}

/**
 * Check if a player has a specific promissory note in play
 * (used by validators and ability checks)
 */
export function hasNoteInPlay(player: PlayerState, baseNoteId: string): boolean {
  return player.promissoryNotesInPlay.some(
    (note) => getBaseNoteId(note.noteId) === baseNoteId
  );
}

/**
 * Get the original owner ID of a note in a player's play area
 */
export function getNoteOriginalOwner(player: PlayerState, baseNoteId: string): string | null {
  const note = player.promissoryNotesInPlay.find(
    (n) => getBaseNoteId(n.noteId) === baseNoteId
  );
  return note?.originalOwnerId ?? null;
}
