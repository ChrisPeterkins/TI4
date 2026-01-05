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
import { logPromissoryNotePlayed, logPromissoryNoteReturned } from '../utils/game-log.js';

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

  // Log the promissory note play
  logPromissoryNotePlayed(state, player.id, noteId, noteDef.name, originalOwner.id);

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
      // Effect: The player who activated this system cannot move ships into it
      // Must be played after activation (during tactical movement phase)
      if (state.subPhase !== 'tactical_movement') {
        return { success: false, error: 'Ceasefire can only be played during tactical action' };
      }
      // Block the active player from moving ships into the activated system
      if (!state.ceasefireBlocks) {
        state.ceasefireBlocks = [];
      }
      if (!state.ceasefireBlocks.includes(state.activePlayerId)) {
        state.ceasefireBlocks.push(state.activePlayerId);
      }
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
      // Creuss IFF - Place or move a Creuss wormhole token
      // "At the start of your turn during the action phase: Place or move a Creuss wormhole token
      // into either a system that contains a planet you control or a non-home system that does
      // not contain another player's ships."
      return executeCreussIff(state, player, action);

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
      // "Replace each of your infantry on that planet with the same number of fighters from your reinforcements"
      if (!state.activeCombat || state.activeCombat.type !== 'ground') {
        return { success: false, error: 'Can only play at start of ground combat' };
      }
      return executeCyberneticEnhancements(state, player, state.activeCombat);

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
      // Winnu - Exchange strategy card with Winnu at end of strategy phase
      // "Exchange 1 of your strategy cards with a strategy card that was chosen by the Winnu player"
      if (state.phase !== 'strategy') {
        return { success: false, error: 'Can only play Acquiescence at end of strategy phase' };
      }

      // Player must have a strategy card
      if (player.strategyCard === null) {
        return { success: false, error: 'You do not have a strategy card to exchange' };
      }

      // Winnu player must have a strategy card
      if (originalOwner.strategyCard === null) {
        return { success: false, error: 'Winnu player does not have a strategy card' };
      }

      // Exchange strategy cards
      const playerCard = player.strategyCard;
      const winnuCard = originalOwner.strategyCard;

      player.strategyCard = winnuCard;
      originalOwner.strategyCard = playerCard;

      // Reset used flags since we're exchanging
      player.strategyCardUsed = false;
      originalOwner.strategyCardUsed = false;

      return {
        success: true,
        triggeredEvents: ['strategy_cards_exchanged'],
        data: {
          playerReceivedCard: winnuCard,
          winnuReceivedCard: playerCard,
        },
      };

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

/**
 * Check if a player can use a commander ability via Alliance promissory note
 *
 * Alliance allows the holder to use the commander ability of the note's original owner
 * as if it were unlocked (requires the original owner's commander to be unlocked).
 *
 * @param state - Current game state
 * @param playerId - The player who wants to use an ability
 * @param factionId - The faction whose commander is being checked
 * @returns Object indicating if Alliance grants access and the ally player ID
 */
export function canUseCommanderViaAlliance(
  state: GameState,
  playerId: string,
  factionId: string
): { canUse: boolean; allyPlayerId?: string } {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { canUse: false };
  }

  // Check if player has Alliance in play
  for (const noteInPlay of player.promissoryNotesInPlay) {
    if (getBaseNoteId(noteInPlay.noteId) === 'alliance') {
      // Find the original owner of the Alliance
      const allyPlayer = state.players.find(p => p.id === noteInPlay.originalOwnerId);
      if (!allyPlayer) continue;

      // Check if ally is the faction we're looking for
      if (allyPlayer.faction !== factionId) continue;

      // Check if ally's commander is unlocked
      if (allyPlayer.leaders?.commander?.unlocked) {
        return { canUse: true, allyPlayerId: allyPlayer.id };
      }
    }
  }

  return { canUse: false };
}

/**
 * Check if a player has access to a commander (own or via Alliance)
 *
 * @param state - Current game state
 * @param playerId - The player checking access
 * @param factionId - Optional: specific faction's commander to check. If not provided, checks player's own.
 * @returns Whether the player can use the commander ability
 */
export function hasCommanderAccess(
  state: GameState,
  playerId: string,
  factionId?: string
): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return false;

  // If checking a specific faction, see if it's via Alliance
  if (factionId) {
    // If it's the player's own faction, check their commander
    if (player.faction === factionId) {
      return player.leaders?.commander?.unlocked ?? false;
    }

    // Otherwise check Alliance
    return canUseCommanderViaAlliance(state, playerId, factionId).canUse;
  }

  // Default: check own commander
  return player.leaders?.commander?.unlocked ?? false;
}

// =============================================================================
// PROMISSORY NOTE EFFECT IMPLEMENTATIONS
// =============================================================================

/**
 * Cybernetic Enhancements (L1Z1X Promissory Note)
 * "At the start of a ground combat on a planet that contains 1 or more of your units:
 * Replace each of your infantry on that planet with the same number of fighters
 * from your reinforcements."
 *
 * The fighters replace infantry for ground combat - they fight as ground forces
 * but return to being fighters after combat ends (handled by combat resolution).
 */
function executeCyberneticEnhancements(
  state: GameState,
  player: PlayerState,
  combat: { systemId: string; planetId?: string }
): HandlerResult {
  if (!combat.planetId) {
    return { success: false, error: 'No planet specified for ground combat' };
  }

  // Find the planet
  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) {
    return { success: false, error: 'Combat system not found' };
  }

  const planet = tile.planets.find(p => p.planetId === combat.planetId);
  if (!planet) {
    return { success: false, error: 'Combat planet not found' };
  }

  // Count player's infantry on the planet
  const infantryOnPlanet = planet.units.filter(
    u => u.ownerId === player.id && u.type === 'infantry'
  );

  if (infantryOnPlanet.length === 0) {
    return { success: false, error: 'No infantry on planet to replace' };
  }

  // Remove infantry and add fighters in their place
  // The fighters will participate in ground combat as if they were ground forces
  const infantryCount = infantryOnPlanet.length;

  // Remove all infantry
  planet.units = planet.units.filter(
    u => !(u.ownerId === player.id && u.type === 'infantry')
  );

  // Add fighters (these are "cybernetic enhanced" fighters fighting as ground forces)
  // They stay on the planet during ground combat
  for (let i = 0; i < infantryCount; i++) {
    planet.units.push({
      id: `fighter-ce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'fighter',
      ownerId: player.id,
      damaged: false,
      // Mark these as cybernetically enhanced so they're handled properly
      // after combat (they stay as fighters, not converted back)
    });
  }

  return {
    success: true,
    triggeredEvents: ['cybernetic_enhancements_activated'],
    data: {
      infantryReplaced: infantryCount,
      planetId: combat.planetId,
    },
  };
}

/**
 * Creuss IFF (Ghosts of Creuss Promissory Note)
 * "At the start of your turn during the action phase: Place or move a Creuss wormhole token
 * into either a system that contains a planet you control or a non-home system that does
 * not contain another player's ships."
 *
 * The Creuss wormhole token creates a delta wormhole that connects to other delta wormholes.
 */
function executeCreussIff(
  state: GameState,
  player: PlayerState,
  action: PlayPromissoryNoteAction
): HandlerResult {
  if (!action.targetSystemId) {
    return { success: false, error: 'Must specify a target system for Creuss wormhole token' };
  }

  // Find the target system
  const targetTile = state.map.tiles.find(t => t.id === action.targetSystemId);
  if (!targetTile) {
    return { success: false, error: 'Target system not found' };
  }

  // Validate placement rules:
  // 1. System contains a planet player controls, OR
  // 2. Non-home system that doesn't contain another player's ships

  const playerControlsPlanet = targetTile.planets.some(
    p => p.controlledBy === player.id
  );

  // Check if it's a home system
  const isHomeSystem = state.players.some(
    p => p.homeSystemId === targetTile.systemId
  );

  // Check if another player has ships in the system
  const hasOtherPlayerShips = targetTile.units.some(
    u => u.ownerId !== player.id
  );

  if (!playerControlsPlanet) {
    // Must be non-home system without other players' ships
    if (isHomeSystem) {
      return { success: false, error: 'Cannot place Creuss wormhole token in a home system without controlling a planet there' };
    }
    if (hasOtherPlayerShips) {
      return { success: false, error: 'Cannot place Creuss wormhole token in a system with another player\'s ships' };
    }
  }

  // Check if there's already a wormhole in the system (not allowed per rules)
  if (targetTile.wormhole) {
    return { success: false, error: 'Cannot place Creuss wormhole token in a system that already has a wormhole' };
  }

  // Place/move the Creuss wormhole token
  state.creussWormholeToken = {
    systemId: action.targetSystemId,
  };

  return {
    success: true,
    triggeredEvents: ['creuss_wormhole_token_placed'],
    data: {
      systemId: action.targetSystemId,
    },
  };
}
