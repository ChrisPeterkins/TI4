/**
 * Action Card Validators
 *
 * Validates action card plays, discards, and timing.
 */

import type {
  GameState,
  PlayActionCardAction,
  DiscardActionCardsAction,
  ActionCardTiming,
} from '@ti4/shared';
import { ACTION_CARDS_BY_ID, isSabotageCard, isRiderCard } from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { hasCard } from '../utils/deck.js';

// Action card hand limit
const ACTION_CARD_HAND_LIMIT = 7;

/**
 * Validate playing an action card
 */
export function validatePlayActionCard(
  state: GameState,
  action: PlayActionCardAction
): ValidationResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if player has the card
  if (!hasCard(player.actionCards, action.cardId)) {
    return { valid: false, error: 'Player does not have this action card' };
  }

  // Get card data
  const cardData = ACTION_CARDS_BY_ID[action.cardId];
  if (!cardData) {
    return { valid: false, error: 'Unknown action card' };
  }

  // Validate timing based on card type
  const timingValid = validateCardTiming(state, cardData.timing, action);
  if (!timingValid.valid) {
    return timingValid;
  }

  // Validate targets if required
  const targetsValid = validateCardTargets(state, action);
  if (!targetsValid.valid) {
    return targetsValid;
  }

  return { valid: true };
}

/**
 * Validate card timing against current game state
 */
function validateCardTiming(
  state: GameState,
  timing: ActionCardTiming,
  action: PlayActionCardAction
): ValidationResult {
  switch (timing) {
    case 'action':
      // ACTION: cards can be played as component actions during action phase
      // or some can be played in response to other events
      if (state.phase === 'action') {
        return { valid: true };
      }
      // Sabotage can be played any time another player plays an action card
      if (isSabotageCard(action.cardId)) {
        return { valid: true };
      }
      return { valid: false, error: 'Can only play ACTION cards during action phase' };

    case 'tactical':
      // TACTICAL: cards are played during tactical actions
      if (state.phase !== 'action') {
        return { valid: false, error: 'Can only play tactical cards during action phase' };
      }
      if (!state.activatedSystem) {
        return { valid: false, error: 'Can only play tactical cards during a tactical action' };
      }
      return { valid: true };

    case 'combat':
    case 'space_combat':
    case 'ground_combat':
    case 'anti_fighter_barrage':
    case 'bombardment':
    case 'invasion':
      // Combat cards require active combat
      if (!state.activeCombat) {
        return { valid: false, error: 'Can only play combat cards during combat' };
      }
      // Check specific combat phase if needed
      if (timing === 'space_combat' && state.activeCombat.type !== 'space') {
        return { valid: false, error: 'Can only play space combat cards during space combat' };
      }
      if (timing === 'ground_combat' && state.activeCombat.type !== 'ground') {
        return { valid: false, error: 'Can only play ground combat cards during ground combat' };
      }
      return { valid: true };

    case 'agenda':
      // Agenda cards are played during agenda phase
      if (state.phase !== 'agenda') {
        return { valid: false, error: 'Can only play agenda cards during agenda phase' };
      }
      // Rider cards require an agenda to be revealed
      if (isRiderCard(action.cardId) && !state.agendaPhase?.currentAgendaId) {
        return { valid: false, error: 'Can only play rider cards after an agenda is revealed' };
      }
      return { valid: true };

    case 'status':
      // Status phase cards
      if (state.phase !== 'status') {
        return { valid: false, error: 'Can only play status phase cards during status phase' };
      }
      return { valid: true };

    case 'start_of_combat':
      // Start of combat cards
      if (!state.activeCombat) {
        return { valid: false, error: 'Can only play at start of combat' };
      }
      // Should be in first round, before any combat rolls
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Validate card targets based on card requirements
 */
function validateCardTargets(
  state: GameState,
  action: PlayActionCardAction
): ValidationResult {
  const cardData = ACTION_CARDS_BY_ID[action.cardId];
  if (!cardData) {
    return { valid: false, error: 'Unknown action card' };
  }

  const targets = action.targets;

  // Cards that require a target player
  const requiresTargetPlayer = [
    'spy',
    'signal_jamming',
    'insubordination',
    'uprising',
    'public_disgrace',
    'probe',
  ];

  if (requiresTargetPlayer.some(id => action.cardId.startsWith(id))) {
    if (!targets?.playerId) {
      return { valid: false, error: 'This card requires a target player' };
    }
    // Verify target player exists and is not self
    const targetPlayer = state.players.find(p => p.id === targets.playerId);
    if (!targetPlayer) {
      return { valid: false, error: 'Target player not found' };
    }
    if (targets.playerId === action.playerId) {
      return { valid: false, error: 'Cannot target yourself with this card' };
    }
  }

  // Cards that require a target system
  const requiresTargetSystem = [
    'lucky_shot',
    'reactor_meltdown',
    'tactical_bombardment',
    'solar_flare',
    'cripple_defenses',
  ];

  if (requiresTargetSystem.some(id => action.cardId.startsWith(id))) {
    if (!targets?.systemPosition) {
      return { valid: false, error: 'This card requires a target system' };
    }
    // Could add more validation here for system existence
  }

  // Cards that require a target planet
  const requiresTargetPlanet = [
    'plague',
    'unstable_planet',
    'uprising',
    'ghost_squad',
    'cripple_defenses',
  ];

  if (requiresTargetPlanet.some(id => action.cardId.startsWith(id))) {
    if (!targets?.planetId && !targets?.systemPosition) {
      return { valid: false, error: 'This card requires a target planet' };
    }
  }

  return { valid: true };
}

/**
 * Validate discarding action cards
 */
export function validateDiscardActionCards(
  state: GameState,
  action: DiscardActionCardsAction
): ValidationResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must discard at least one card
  if (action.cardIds.length === 0) {
    return { valid: false, error: 'Must discard at least one card' };
  }

  // Verify player has all the cards they want to discard
  for (const cardId of action.cardIds) {
    if (!hasCard(player.actionCards, cardId)) {
      return { valid: false, error: `Player does not have card: ${cardId}` };
    }
  }

  // If in status phase and exceeding hand limit, verify discarding enough cards
  if (state.phase === 'status') {
    const requiredDiscard = player.actionCards.length - ACTION_CARD_HAND_LIMIT;
    if (requiredDiscard > 0 && action.cardIds.length < requiredDiscard) {
      return {
        valid: false,
        error: `Must discard at least ${requiredDiscard} cards to meet hand limit`,
      };
    }
  }

  return { valid: true };
}

/**
 * Check if a player can play any action cards with the given timing
 */
export function canPlayCardWithTiming(
  state: GameState,
  playerId: string,
  timing: ActionCardTiming
): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return false;

  return player.actionCards.some(cardId => {
    const cardData = ACTION_CARDS_BY_ID[cardId];
    return cardData && cardData.timing === timing;
  });
}

/**
 * Get all playable cards for a player given current timing
 */
export function getPlayableCards(
  state: GameState,
  playerId: string
): string[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  return player.actionCards.filter(cardId => {
    const mockAction: PlayActionCardAction = {
      type: 'play_action_card',
      playerId,
      cardId,
      timestamp: Date.now(),
    };
    const result = validatePlayActionCard(state, mockAction);
    return result.valid;
  });
}
