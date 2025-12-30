/**
 * Timing Window Manager
 *
 * Handles the lifecycle of timing windows for action cards and abilities.
 * Supports nested windows (e.g., Sabotage on Sabotage) with LIFO resolution.
 */

import type {
  GameState,
  TimingWindow,
  TimingWindowContext,
  TimingWindowResponseAction,
  PlayerState,
  TimingTrigger,
  ActionCardTargets,
} from '@ti4/shared';
import { ACTION_CARDS_BY_ID, isSabotageCard } from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { v4 as uuidv4 } from 'uuid';
import { removeCard, discardCards } from '../utils/deck.js';

// Default timing window duration in milliseconds (30 seconds)
const DEFAULT_WINDOW_TIMEOUT = 30000;

/**
 * Map action card timing keywords to timing triggers
 */
const TIMING_KEYWORD_MAP: Record<string, TimingTrigger[]> = {
  // Action timing - can play as an action
  'action': [],

  // Combat timing
  'at the start of a combat': ['space_combat_start', 'ground_combat_start'],
  'at the start of space combat': ['space_combat_start'],
  'at the start of ground combat': ['ground_combat_start'],
  'at the start of a combat round': ['combat_round_start'],
  'after a round of combat': ['combat_round_end'],
  'before combat rolls': ['before_combat_rolls'],
  'after combat rolls': ['after_combat_rolls'],
  'when a hit is assigned': ['hits_assigned'],

  // Anti-Fighter Barrage
  'before anti-fighter barrage': ['before_afb'],
  'after anti-fighter barrage': ['after_afb'],

  // Bombardment
  'before bombardment': ['before_bombardment'],
  'after bombardment': ['after_bombardment'],

  // Space Cannon
  'before space cannon': ['before_space_cannon'],
  'after space cannon': ['after_space_cannon'],

  // Tactical action
  'when a system is activated': ['system_activated'],
  'after a system is activated': ['system_activated'],
  'when you activate a system': ['system_activated'],
  'when another player activates': ['system_activated'],
  'at the start of your turn': ['start_of_turn'],
  'at the end of your turn': ['end_of_turn'],

  // Invasion
  'at the start of an invasion': ['invasion_start'],
  'before ground forces are committed': ['before_ground_forces_commit'],
  'after ground forces are committed': ['after_ground_forces_commit'],

  // Agenda
  'when an agenda is revealed': ['agenda_revealed'],
  'after an agenda is revealed': ['after_agenda_revealed'],
  'before voting': ['before_voting'],
  'after voting': ['after_voting'],

  // Strategy cards
  'when a player plays a strategy card': ['strategy_card_played'],
  'after the primary ability': ['after_strategy_primary'],
  'before the secondary ability': ['before_strategy_secondary'],

  // Action cards
  'when an action card is played': ['action_card_played'],
  'after an action card is played': ['action_card_played'],

  // Miscellaneous
  'when you research': ['technology_researched'],
  'when you gain control of a planet': ['planet_gained'],
  'when you would gain trade goods': ['trade_goods_gained'],
  'when you replenish commodities': ['commodities_replenished'],
};

/**
 * Get the cards a player can play at a given timing trigger
 */
export function getEligibleCards(
  state: GameState,
  playerId: string,
  trigger: TimingTrigger,
  context?: TimingWindowContext
): string[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  const eligibleCards: string[] = [];

  for (const cardId of player.actionCards) {
    const cardData = ACTION_CARDS_BY_ID[cardId];
    if (!cardData) continue;

    // Check if card can be played at this trigger
    if (canPlayCardAtTrigger(cardData, trigger, state, playerId, context)) {
      eligibleCards.push(cardId);
    }
  }

  return eligibleCards;
}

/**
 * Check if an action card can be played at a specific trigger
 */
function canPlayCardAtTrigger(
  cardData: { name: string; description: string; timing?: string },
  trigger: TimingTrigger,
  state: GameState,
  playerId: string,
  context?: TimingWindowContext
): boolean {
  // Special handling for Sabotage
  if (isSabotageCard(cardData.name.toLowerCase().replace(/ /g, '_'))) {
    // Sabotage can only be played when an action card is played
    if (trigger === 'action_card_played') {
      // Can't sabotage your own cards
      if (context?.sourcePlayerId === playerId) return false;
      return true;
    }
    // Counter-Sabotage: can play Sabotage when Sabotage is played against you
    if (trigger === 'sabotage_played') {
      // Only the target of the Sabotage can counter
      if (context?.sourcePlayerId === playerId) return false;
      return true;
    }
    return false;
  }

  // Check card description for timing keywords
  const description = cardData.description.toLowerCase();

  for (const [keyword, triggers] of Object.entries(TIMING_KEYWORD_MAP)) {
    if (description.includes(keyword.toLowerCase())) {
      if (triggers.includes(trigger)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get players who have cards they can play at this timing
 */
export function getEligiblePlayers(
  state: GameState,
  trigger: TimingTrigger,
  context?: TimingWindowContext
): string[] {
  const eligiblePlayers: string[] = [];

  for (const player of state.players) {
    const cards = getEligibleCards(state, player.id, trigger, context);
    if (cards.length > 0) {
      eligiblePlayers.push(player.id);
    }
  }

  return eligiblePlayers;
}

/**
 * Open a new timing window
 */
export function openTimingWindow(
  state: GameState,
  trigger: TimingTrigger,
  context?: TimingWindowContext
): TimingWindow | null {
  // Get eligible players
  const eligiblePlayers = getEligiblePlayers(state, trigger, context);

  // If no one can respond, no need to open a window
  if (eligiblePlayers.length === 0) {
    return null;
  }

  // Create the timing window
  const window: TimingWindow = {
    id: uuidv4(),
    trigger,
    eligiblePlayers,
    responses: {},
    playedCards: [],
    expiresAt: Date.now() + DEFAULT_WINDOW_TIMEOUT,
    parentWindowId: state.activeTimingWindow?.id,
    context,
    resolved: false,
  };

  // Initialize all responses as pending
  for (const playerId of eligiblePlayers) {
    window.responses[playerId] = 'pending';
  }

  // Add to stack and set as active
  state.timingWindowStack.push(window);
  state.activeTimingWindow = window;

  return window;
}

/**
 * Handle a player's response to a timing window
 */
export function handleTimingWindowResponse(
  state: GameState,
  action: TimingWindowResponseAction
): HandlerResult {
  const window = state.activeTimingWindow;

  if (!window) {
    return { success: false, error: 'No active timing window' };
  }

  if (window.id !== action.windowId) {
    return { success: false, error: 'Window ID mismatch' };
  }

  if (!window.eligiblePlayers.includes(action.playerId)) {
    return { success: false, error: 'Player not eligible for this window' };
  }

  if (window.responses[action.playerId] !== 'pending') {
    return { success: false, error: 'Player has already responded' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (action.response === 'pass') {
    window.responses[action.playerId] = 'pass';
  } else if (action.response === 'play_card') {
    if (!action.cardId) {
      return { success: false, error: 'Card ID required to play a card' };
    }

    // Validate player has the card
    if (!player.actionCards.includes(action.cardId)) {
      return { success: false, error: 'Player does not have this card' };
    }

    // Validate card can be played at this timing
    const cardData = ACTION_CARDS_BY_ID[action.cardId];
    if (!cardData) {
      return { success: false, error: 'Unknown action card' };
    }

    if (!canPlayCardAtTrigger(cardData, window.trigger, state, action.playerId, window.context)) {
      return { success: false, error: 'Card cannot be played at this timing' };
    }

    // Remove card from player's hand
    player.actionCards = removeCard(player.actionCards, action.cardId);

    // Add to discard
    state.actionCardDiscard = discardCards(state.actionCardDiscard, [action.cardId]);

    // Record the played card
    window.playedCards.push({
      playerId: action.playerId,
      cardId: action.cardId,
      targets: action.targets,
    });

    window.responses[action.playerId] = 'played';

    // Check if this is a Sabotage card - need to open nested window
    if (isSabotageCard(action.cardId)) {
      const nestedWindow = openTimingWindow(state, 'sabotage_played', {
        sourceCardId: action.cardId,
        sourcePlayerId: action.playerId,
        additionalData: {
          targetCardId: window.context?.sourceCardId,
          targetPlayerId: window.context?.sourcePlayerId,
        },
      });

      if (nestedWindow) {
        return {
          success: true,
          triggeredEvents: ['timing_window_response', 'sabotage_played', 'timing_window_opened'],
          data: {
            windowId: window.id,
            nestedWindowId: nestedWindow.id,
            cardPlayed: action.cardId,
          },
        };
      }
    }
  }

  // Check if all players have responded
  const allResponded = Object.values(window.responses).every(r => r !== 'pending');

  if (allResponded) {
    // Resolve the window
    return resolveTimingWindow(state, window);
  }

  return {
    success: true,
    triggeredEvents: ['timing_window_response'],
    data: {
      windowId: window.id,
      playerId: action.playerId,
      response: action.response,
      cardPlayed: action.response === 'play_card' ? action.cardId : undefined,
    },
  };
}

/**
 * Resolve a timing window after all players have responded
 */
export function resolveTimingWindow(
  state: GameState,
  window: TimingWindow
): HandlerResult {
  window.resolved = true;

  // Process played cards in order (LIFO for interrupts, FIFO for effects)
  const effects: { playerId: string; cardId: string; cancelled: boolean }[] = [];

  // Check for Sabotage cancellations
  for (const playedCard of window.playedCards) {
    const cardData = ACTION_CARDS_BY_ID[playedCard.cardId];
    let cancelled = false;

    // Check if this card was Sabotaged
    if (window.trigger === 'action_card_played' && isSabotageCard(playedCard.cardId)) {
      // Find the nested window (if any) to see if it was counter-Sabotaged
      const nestedWindow = state.timingWindowStack.find(
        w => w.parentWindowId === window.id && w.trigger === 'sabotage_played'
      );

      if (nestedWindow) {
        // Check if counter-Sabotage was played
        const counterSabotage = nestedWindow.playedCards.find(
          c => isSabotageCard(c.cardId)
        );
        if (counterSabotage) {
          cancelled = true;
        }
      }
    }

    effects.push({
      playerId: playedCard.playerId,
      cardId: playedCard.cardId,
      cancelled,
    });
  }

  // Pop this window from the stack
  const windowIndex = state.timingWindowStack.findIndex(w => w.id === window.id);
  if (windowIndex !== -1) {
    state.timingWindowStack.splice(windowIndex, 1);
  }

  // Set active window to parent (if any)
  if (window.parentWindowId) {
    state.activeTimingWindow = state.timingWindowStack.find(
      w => w.id === window.parentWindowId
    ) ?? null;
  } else {
    // No parent - check if there are other windows on stack
    state.activeTimingWindow = state.timingWindowStack.length > 0
      ? state.timingWindowStack[state.timingWindowStack.length - 1]
      : null;
  }

  return {
    success: true,
    triggeredEvents: ['timing_window_closed'],
    data: {
      windowId: window.id,
      playedCards: effects,
      parentWindowId: window.parentWindowId,
    },
  };
}

/**
 * Close a timing window due to timeout
 */
export function closeTimingWindowTimeout(
  state: GameState,
  windowId: string
): HandlerResult {
  const window = state.timingWindowStack.find(w => w.id === windowId);

  if (!window) {
    return { success: false, error: 'Window not found' };
  }

  // Mark all pending responses as pass
  for (const playerId of Object.keys(window.responses)) {
    if (window.responses[playerId] === 'pending') {
      window.responses[playerId] = 'pass';
    }
  }

  return resolveTimingWindow(state, window);
}

/**
 * Check if there's an active timing window awaiting responses
 */
export function hasActiveTimingWindow(state: GameState): boolean {
  return state.activeTimingWindow !== null && !state.activeTimingWindow.resolved;
}

/**
 * Get the current active timing window
 */
export function getActiveTimingWindow(state: GameState): TimingWindow | null {
  return state.activeTimingWindow;
}

/**
 * Check if a specific timing trigger should open a window
 * Call this at appropriate points in the game flow
 */
export function checkTimingTrigger(
  state: GameState,
  trigger: TimingTrigger,
  context?: TimingWindowContext
): HandlerResult {
  // Don't open nested windows while one is being resolved
  if (state.activeTimingWindow && !state.activeTimingWindow.resolved) {
    // Exception: Sabotage windows can nest
    if (trigger !== 'sabotage_played' && trigger !== 'action_card_played') {
      return { success: true };
    }
  }

  const window = openTimingWindow(state, trigger, context);

  if (window) {
    return {
      success: true,
      triggeredEvents: ['timing_window_opened'],
      data: {
        windowId: window.id,
        trigger,
        eligiblePlayers: window.eligiblePlayers,
        expiresAt: window.expiresAt,
        context,
      },
    };
  }

  return { success: true };
}

/**
 * Initialize timing window state for a new game
 */
export function initializeTimingWindows(state: GameState): void {
  state.timingWindowStack = [];
  state.activeTimingWindow = null;
}
