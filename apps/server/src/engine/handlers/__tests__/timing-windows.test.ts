import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEligibleCards,
  getEligiblePlayers,
  openTimingWindow,
  handleTimingWindowResponse,
  resolveTimingWindow,
  closeTimingWindowTimeout,
  hasActiveTimingWindow,
  getActiveTimingWindow,
  checkTimingTrigger,
  initializeTimingWindows,
} from '../timing-windows.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  HexCoord,
  TimingWindow,
  TimingWindowResponseAction,
} from '@ti4/shared';

// Mock the @ti4/shared action card functions
vi.mock('@ti4/shared', async () => {
  const actual = await vi.importActual('@ti4/shared');
  return {
    ...actual,
    ACTION_CARDS_BY_ID: {
      sabotage: { id: 'sabotage', name: 'Sabotage', description: 'When an action card is played, cancel that card.' },
      direct_hit: { id: 'direct_hit', name: 'Direct Hit', description: 'When a hit is assigned to your opponent\'s ship, destroy it.' },
      skilled_retreat: { id: 'skilled_retreat', name: 'Skilled Retreat', description: 'At the start of a combat round, your ships may move to an adjacent system.' },
      flank_speed: { id: 'flank_speed', name: 'Flank Speed', description: 'After a system is activated, +1 movement to all ships.' },
      morale_boost: { id: 'morale_boost', name: 'Morale Boost', description: 'At the start of a combat, apply +1 to your combat rolls.' },
      unexpected_action: { id: 'unexpected_action', name: 'Unexpected Action', description: 'ACTION: Remove 1 of your command tokens from the game board.' },
      signal_jamming: { id: 'signal_jamming', name: 'Signal Jamming', description: 'When another player activates a system, place or move 1 command token.' },
      rider: { id: 'rider', name: 'Rider', description: 'After an agenda is revealed, cast additional votes.' },
      veto: { id: 'veto', name: 'Veto', description: 'When an agenda is revealed, discard that agenda.' },
      emergency_repairs: { id: 'emergency_repairs', name: 'Emergency Repairs', description: 'At the start of a combat round, repair your damaged ships.' },
      space_sabotage: { id: 'space_sabotage', name: 'Sabotage', description: 'When an action card is played, cancel it and discard.' },
    },
    isSabotageCard: vi.fn((cardId: string) => {
      return cardId === 'sabotage' || cardId === 'space_sabotage';
    }),
  };
});

// Mock applyCardEffect
vi.mock('../action-card-effects.js', () => ({
  applyCardEffect: vi.fn(() => ({ success: true, triggeredEvents: ['card_effect_applied'] })),
}));

// Mock advanceAfterComponentAction
vi.mock('../component-actions.js', () => ({
  advanceAfterComponentAction: vi.fn(),
}));

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Test Player',
    faction: 'sol',
    color: 'blue',
    isBot: false,
    seatPosition: 0,
    victoryPoints: 0,
    resources: 0,
    influence: 0,
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    planets: [],
    technologies: [],
    promissoryNotes: [],
    actionCards: [],
    scoredObjectives: [],
    secretObjectives: [],
    relics: [],
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    exhaustedPlanets: [],
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    strategyCard: null,
    passed: false,
    speaker: false,
    ...overrides,
  } as PlayerState;
}

function createMockTile(position: HexCoord, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId: 1,
    position,
    rotation: 0,
    planets: [],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game',
    phase: 'action',
    subPhase: 'awaiting_action',
    round: 1,
    turn: 1,
    activePlayerId: 'player1',
    version: 1,
    players: [createMockPlayer()],
    map: {
      tiles: [createMockTile({ q: 0, r: 0 })],
      playerCount: 6,
    },
    objectives: {
      publicStageI: [],
      publicStageII: [],
      revealedCount: 0,
      secretDeck: [],
    },
    laws: [],
    actionCardDeck: [],
    actionCardDiscard: [],
    agendaDeck: [],
    relicDeck: [],
    strategyCardState: {},
    log: [],
    settings: {
      victoryPointLimit: 10,
      gameDuration: 'full',
      mapType: 'standard',
    },
    timingWindowStack: [],
    activeTimingWindow: null,
    ...overrides,
  } as GameState;
}

describe('Timing Window Handlers', () => {
  describe('getEligibleCards', () => {
    it('should return empty array if player not found', () => {
      const state = createMockGameState();

      const cards = getEligibleCards(state, 'nonexistent', 'space_combat_start');

      expect(cards).toEqual([]);
    });

    it('should return cards that match the timing trigger', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            actionCards: ['skilled_retreat', 'morale_boost', 'emergency_repairs'],
          }),
        ],
      });

      // 'skilled_retreat' and 'emergency_repairs' can be played "at the start of a combat round"
      const cards = getEligibleCards(state, 'player1', 'combat_round_start');

      expect(cards).toContain('skilled_retreat');
      expect(cards).toContain('emergency_repairs');
      // 'morale_boost' says "at the start of combat" not "at the start of a combat round"
      expect(cards).not.toContain('morale_boost');
    });

    it('should return sabotage when action card is played by another player', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            actionCards: ['sabotage', 'direct_hit'],
          }),
        ],
      });

      const cards = getEligibleCards(state, 'player1', 'action_card_played', {
        sourcePlayerId: 'player2', // Another player played a card
        sourceCardId: 'direct_hit',
      });

      expect(cards).toContain('sabotage');
    });

    it('should not return sabotage when player plays their own card', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            actionCards: ['sabotage', 'direct_hit'],
          }),
        ],
      });

      const cards = getEligibleCards(state, 'player1', 'action_card_played', {
        sourcePlayerId: 'player1', // Same player
        sourceCardId: 'direct_hit',
      });

      expect(cards).not.toContain('sabotage');
    });

    it('should return cards matching system_activated trigger', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            actionCards: ['flank_speed', 'signal_jamming'],
          }),
        ],
      });

      const cards = getEligibleCards(state, 'player1', 'system_activated');

      expect(cards).toContain('flank_speed');
      expect(cards).toContain('signal_jamming');
    });

    it('should return cards matching agenda_revealed trigger', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            actionCards: ['rider', 'veto'],
          }),
        ],
      });

      const cards = getEligibleCards(state, 'player1', 'agenda_revealed');

      expect(cards).toContain('veto');
    });
  });

  describe('getEligiblePlayers', () => {
    it('should return empty array if no players have eligible cards', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1', actionCards: [] }),
          createMockPlayer({ id: 'player2', actionCards: [] }),
        ],
      });

      const players = getEligiblePlayers(state, 'space_combat_start');

      expect(players).toEqual([]);
    });

    it('should return players who have eligible cards', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1', actionCards: ['morale_boost'] }), // "at the start of combat"
          createMockPlayer({ id: 'player2', actionCards: [] }),
          createMockPlayer({ id: 'player3', actionCards: ['morale_boost'] }), // "at the start of combat"
        ],
      });

      // morale_boost says "at the start of combat" which matches space_combat_start
      const players = getEligiblePlayers(state, 'space_combat_start');

      expect(players).toContain('player1');
      expect(players).not.toContain('player2');
      expect(players).toContain('player3');
    });
  });

  describe('openTimingWindow', () => {
    it('should return null if no players have eligible cards', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ actionCards: [] })],
        timingWindowStack: [],
      });

      const window = openTimingWindow(state, 'space_combat_start');

      expect(window).toBeNull();
    });

    it('should create a timing window with eligible players', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1', actionCards: ['sabotage'] }),
          createMockPlayer({ id: 'player2', actionCards: ['sabotage'] }),
        ],
        timingWindowStack: [],
      });

      const window = openTimingWindow(state, 'action_card_played', {
        sourcePlayerId: 'player3',
        sourceCardId: 'direct_hit',
      });

      expect(window).not.toBeNull();
      expect(window!.eligiblePlayers).toContain('player1');
      expect(window!.eligiblePlayers).toContain('player2');
      expect(window!.trigger).toBe('action_card_played');
      expect(window!.responses).toEqual({
        player1: 'pending',
        player2: 'pending',
      });
    });

    it('should add window to stack and set as active', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ actionCards: ['sabotage'] })],
        timingWindowStack: [],
        activeTimingWindow: null,
      });

      const window = openTimingWindow(state, 'action_card_played', {
        sourcePlayerId: 'player2',
        sourceCardId: 'direct_hit',
      });

      expect(state.timingWindowStack).toHaveLength(1);
      expect(state.activeTimingWindow).toBe(window);
    });

    it('should set parentWindowId when nested', () => {
      const parentWindow: TimingWindow = {
        id: 'parent-window',
        trigger: 'action_card_played',
        eligiblePlayers: ['player1'],
        responses: { player1: 'played' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };

      const state = createMockGameState({
        players: [createMockPlayer({ id: 'player2', actionCards: ['sabotage'] })],
        timingWindowStack: [parentWindow],
        activeTimingWindow: parentWindow,
      });

      const nestedWindow = openTimingWindow(state, 'sabotage_played', {
        sourcePlayerId: 'player1',
        sourceCardId: 'sabotage',
      });

      expect(nestedWindow?.parentWindowId).toBe('parent-window');
    });
  });

  describe('handleTimingWindowResponse', () => {
    it('should fail if no active timing window', () => {
      const state = createMockGameState({
        activeTimingWindow: null,
      });
      const action: TimingWindowResponseAction = {
        type: 'timing_window_response',
        playerId: 'player1',
        windowId: 'some-window',
        response: 'pass',
        timestamp: Date.now(),
      };

      const result = handleTimingWindowResponse(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active timing window');
    });

    it('should fail if window ID mismatch', () => {
      const window: TimingWindow = {
        id: 'correct-window-id',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pending' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        activeTimingWindow: window,
        timingWindowStack: [window],
      });
      const action: TimingWindowResponseAction = {
        type: 'timing_window_response',
        playerId: 'player1',
        windowId: 'wrong-window-id',
        response: 'pass',
        timestamp: Date.now(),
      };

      const result = handleTimingWindowResponse(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Window ID mismatch');
    });

    it('should fail if player not eligible', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pending' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        activeTimingWindow: window,
        timingWindowStack: [window],
      });
      const action: TimingWindowResponseAction = {
        type: 'timing_window_response',
        playerId: 'player2', // Not in eligiblePlayers
        windowId: 'test-window',
        response: 'pass',
        timestamp: Date.now(),
      };

      const result = handleTimingWindowResponse(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not eligible for this window');
    });

    it('should fail if player already responded', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pass' }, // Already responded
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        activeTimingWindow: window,
        timingWindowStack: [window],
      });
      const action: TimingWindowResponseAction = {
        type: 'timing_window_response',
        playerId: 'player1',
        windowId: 'test-window',
        response: 'pass',
        timestamp: Date.now(),
      };

      const result = handleTimingWindowResponse(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player has already responded');
    });

    it('should record pass response', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1', 'player2'],
        responses: { player1: 'pending', player2: 'pending' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1' }),
          createMockPlayer({ id: 'player2' }),
        ],
        activeTimingWindow: window,
        timingWindowStack: [window],
      });
      const action: TimingWindowResponseAction = {
        type: 'timing_window_response',
        playerId: 'player1',
        windowId: 'test-window',
        response: 'pass',
        timestamp: Date.now(),
      };

      const result = handleTimingWindowResponse(state, action);

      expect(result.success).toBe(true);
      expect(window.responses.player1).toBe('pass');
    });

    it('should require card ID when playing a card', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pending' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        players: [createMockPlayer({ actionCards: ['morale_boost'] })],
        activeTimingWindow: window,
        timingWindowStack: [window],
      });
      const action: TimingWindowResponseAction = {
        type: 'timing_window_response',
        playerId: 'player1',
        windowId: 'test-window',
        response: 'play_card',
        // Missing cardId
        timestamp: Date.now(),
      };

      const result = handleTimingWindowResponse(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Card ID required to play a card');
    });

    it('should fail if player does not have the card', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pending' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        players: [createMockPlayer({ actionCards: [] })], // No cards
        activeTimingWindow: window,
        timingWindowStack: [window],
      });
      const action: TimingWindowResponseAction = {
        type: 'timing_window_response',
        playerId: 'player1',
        windowId: 'test-window',
        response: 'play_card',
        cardId: 'morale_boost',
        timestamp: Date.now(),
      };

      const result = handleTimingWindowResponse(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player does not have this card');
    });

    it('should remove card from hand and add to discard when played', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pending' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        players: [createMockPlayer({ actionCards: ['morale_boost', 'direct_hit'] })],
        activeTimingWindow: window,
        timingWindowStack: [window],
        actionCardDiscard: [],
      });
      const action: TimingWindowResponseAction = {
        type: 'timing_window_response',
        playerId: 'player1',
        windowId: 'test-window',
        response: 'play_card',
        cardId: 'morale_boost',
        timestamp: Date.now(),
      };

      const result = handleTimingWindowResponse(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].actionCards).not.toContain('morale_boost');
      expect(state.players[0].actionCards).toContain('direct_hit');
      expect(state.actionCardDiscard).toContain('morale_boost');
    });

    it('should resolve window when all players have responded', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pending' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        players: [createMockPlayer({ actionCards: [] })],
        activeTimingWindow: window,
        timingWindowStack: [window],
      });
      const action: TimingWindowResponseAction = {
        type: 'timing_window_response',
        playerId: 'player1',
        windowId: 'test-window',
        response: 'pass',
        timestamp: Date.now(),
      };

      const result = handleTimingWindowResponse(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('timing_window_closed');
      expect(window.resolved).toBe(true);
    });
  });

  describe('closeTimingWindowTimeout', () => {
    it('should fail if window not found', () => {
      const state = createMockGameState({
        timingWindowStack: [],
      });

      const result = closeTimingWindowTimeout(state, 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Window not found');
    });

    it('should mark all pending responses as pass', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1', 'player2'],
        responses: { player1: 'pending', player2: 'pass' },
        playedCards: [],
        expiresAt: Date.now() - 1000, // Expired
        resolved: false,
      };
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1' }),
          createMockPlayer({ id: 'player2' }),
        ],
        timingWindowStack: [window],
        activeTimingWindow: window,
      });

      const result = closeTimingWindowTimeout(state, 'test-window');

      expect(result.success).toBe(true);
      expect(window.responses.player1).toBe('pass');
      expect(window.responses.player2).toBe('pass');
      expect(window.resolved).toBe(true);
    });
  });

  describe('hasActiveTimingWindow', () => {
    it('should return false if no active window', () => {
      const state = createMockGameState({
        activeTimingWindow: null,
      });

      expect(hasActiveTimingWindow(state)).toBe(false);
    });

    it('should return false if active window is resolved', () => {
      const state = createMockGameState({
        activeTimingWindow: {
          id: 'test-window',
          trigger: 'space_combat_start',
          eligiblePlayers: [],
          responses: {},
          playedCards: [],
          expiresAt: Date.now() + 30000,
          resolved: true,
        },
      });

      expect(hasActiveTimingWindow(state)).toBe(false);
    });

    it('should return true if active window is not resolved', () => {
      const state = createMockGameState({
        activeTimingWindow: {
          id: 'test-window',
          trigger: 'space_combat_start',
          eligiblePlayers: ['player1'],
          responses: { player1: 'pending' },
          playedCards: [],
          expiresAt: Date.now() + 30000,
          resolved: false,
        },
      });

      expect(hasActiveTimingWindow(state)).toBe(true);
    });
  });

  describe('getActiveTimingWindow', () => {
    it('should return null if no active window', () => {
      const state = createMockGameState({
        activeTimingWindow: null,
      });

      expect(getActiveTimingWindow(state)).toBeNull();
    });

    it('should return the active window', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pending' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        activeTimingWindow: window,
      });

      expect(getActiveTimingWindow(state)).toBe(window);
    });
  });

  describe('checkTimingTrigger', () => {
    it('should return success without opening window if no eligible players', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ actionCards: [] })],
        timingWindowStack: [],
        activeTimingWindow: null,
      });

      const result = checkTimingTrigger(state, 'space_combat_start');

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toBeUndefined();
      expect(state.activeTimingWindow).toBeNull();
    });

    it('should open window and trigger event when eligible players exist', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ actionCards: ['sabotage'] })],
        timingWindowStack: [],
        activeTimingWindow: null,
      });

      const result = checkTimingTrigger(state, 'action_card_played', {
        sourcePlayerId: 'player2',
        sourceCardId: 'direct_hit',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('timing_window_opened');
      expect(state.activeTimingWindow).not.toBeNull();
    });

    it('should not open non-sabotage windows while unresolved window exists', () => {
      const existingWindow: TimingWindow = {
        id: 'existing-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pending' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        players: [createMockPlayer({ actionCards: ['morale_boost'] })],
        timingWindowStack: [existingWindow],
        activeTimingWindow: existingWindow,
      });

      const result = checkTimingTrigger(state, 'combat_round_start');

      expect(result.success).toBe(true);
      // Should not open a new window
      expect(state.timingWindowStack).toHaveLength(1);
    });

    it('should allow sabotage_played to nest within existing window', () => {
      const existingWindow: TimingWindow = {
        id: 'existing-window',
        trigger: 'action_card_played',
        eligiblePlayers: ['player1'],
        responses: { player1: 'played' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        players: [createMockPlayer({ id: 'player2', actionCards: ['sabotage'] })],
        timingWindowStack: [existingWindow],
        activeTimingWindow: existingWindow,
      });

      const result = checkTimingTrigger(state, 'sabotage_played', {
        sourcePlayerId: 'player1',
        sourceCardId: 'sabotage',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('timing_window_opened');
      expect(state.timingWindowStack).toHaveLength(2);
    });
  });

  describe('initializeTimingWindows', () => {
    it('should clear timing window stack and active window', () => {
      const existingWindow: TimingWindow = {
        id: 'old-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: {},
        playedCards: [],
        expiresAt: Date.now(),
        resolved: true,
      };
      const state = createMockGameState({
        timingWindowStack: [existingWindow],
        activeTimingWindow: existingWindow,
      });

      initializeTimingWindows(state);

      expect(state.timingWindowStack).toHaveLength(0);
      expect(state.activeTimingWindow).toBeNull();
    });
  });

  describe('resolveTimingWindow', () => {
    it('should mark window as resolved', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pass' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        timingWindowStack: [window],
        activeTimingWindow: window,
      });

      const result = resolveTimingWindow(state, window);

      expect(result.success).toBe(true);
      expect(window.resolved).toBe(true);
    });

    it('should pop window from stack', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: ['player1'],
        responses: { player1: 'pass' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        timingWindowStack: [window],
        activeTimingWindow: window,
      });

      resolveTimingWindow(state, window);

      expect(state.timingWindowStack).toHaveLength(0);
    });

    it('should set active window to parent when nested', () => {
      const parentWindow: TimingWindow = {
        id: 'parent-window',
        trigger: 'action_card_played',
        eligiblePlayers: ['player1'],
        responses: { player1: 'played' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const nestedWindow: TimingWindow = {
        id: 'nested-window',
        trigger: 'sabotage_played',
        eligiblePlayers: ['player2'],
        responses: { player2: 'pass' },
        playedCards: [],
        expiresAt: Date.now() + 30000,
        parentWindowId: 'parent-window',
        resolved: false,
      };
      const state = createMockGameState({
        timingWindowStack: [parentWindow, nestedWindow],
        activeTimingWindow: nestedWindow,
      });

      resolveTimingWindow(state, nestedWindow);

      expect(state.activeTimingWindow).toBe(parentWindow);
    });

    it('should trigger timing_window_closed event', () => {
      const window: TimingWindow = {
        id: 'test-window',
        trigger: 'space_combat_start',
        eligiblePlayers: [],
        responses: {},
        playedCards: [],
        expiresAt: Date.now() + 30000,
        resolved: false,
      };
      const state = createMockGameState({
        timingWindowStack: [window],
        activeTimingWindow: window,
      });

      const result = resolveTimingWindow(state, window);

      expect(result.triggeredEvents).toContain('timing_window_closed');
    });
  });
});
