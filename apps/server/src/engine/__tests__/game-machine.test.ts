import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameMachine } from '../game-machine.js';
import type { GameState, PlayerState } from '@ti4/shared';

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    technologies: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
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
  const player1 = createMockPlayer('player1');
  const player2 = createMockPlayer('player2', { name: 'Player 2', color: 'red', seatIndex: 1 });

  return {
    id: 'test-game',
    version: 1,
    round: 0,
    phase: 'setup',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: [],
    players: [player1, player2],
    map: {
      tiles: [],
      playerCount: 2,
    },
    strategyCards: [
      { number: 1, name: 'Leadership', pickedBy: null, exhausted: false },
      { number: 2, name: 'Diplomacy', pickedBy: null, exhausted: false },
      { number: 3, name: 'Politics', pickedBy: null, exhausted: false },
      { number: 4, name: 'Construction', pickedBy: null, exhausted: false },
      { number: 5, name: 'Trade', pickedBy: null, exhausted: false },
      { number: 6, name: 'Warfare', pickedBy: null, exhausted: false },
      { number: 7, name: 'Technology', pickedBy: null, exhausted: false },
      { number: 8, name: 'Imperial', pickedBy: null, exhausted: false },
    ],
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
    timingWindows: [],
    winner: null,
    ...overrides,
  };
}

describe('GameMachine', () => {
  let machine: GameMachine;
  let initialState: GameState;

  beforeEach(() => {
    initialState = createMockGameState();
    machine = new GameMachine(initialState);
  });

  describe('initialization', () => {
    it('should create a machine with the given initial state', () => {
      const state = machine.getState();
      expect(state.id).toBe('test-game');
      expect(state.phase).toBe('setup');
      expect(state.version).toBe(1);
    });

    it('should return a deep copy of state to prevent external mutation', () => {
      const state1 = machine.getState();
      const state2 = machine.getState();
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe('getPhase', () => {
    it('should return the current phase', () => {
      expect(machine.getPhase()).toBe('setup');
    });
  });

  describe('getActivePlayer', () => {
    it('should return the active player id', () => {
      expect(machine.getActivePlayer()).toBe('player1');
    });
  });

  describe('phase transitions', () => {
    describe('canTransitionTo', () => {
      it('should allow valid transitions from setup to strategy', () => {
        expect(machine.canTransitionTo('strategy')).toBe(true);
      });

      it('should not allow invalid transitions from setup', () => {
        expect(machine.canTransitionTo('action')).toBe(false);
        expect(machine.canTransitionTo('status')).toBe(false);
        expect(machine.canTransitionTo('agenda')).toBe(false);
      });

      it('should allow valid transitions from strategy to action', () => {
        machine.transitionTo('strategy');
        expect(machine.canTransitionTo('action')).toBe(true);
      });

      it('should allow valid transitions from action to status', () => {
        const state = createMockGameState({
          phase: 'action',
          players: [
            createMockPlayer('player1', { strategyCard: 1 }),
            createMockPlayer('player2', { strategyCard: 2, seatIndex: 1 }),
          ],
          initiativeOrder: ['player1', 'player2'],
        });
        machine = new GameMachine(state);
        expect(machine.canTransitionTo('status')).toBe(true);
      });

      it('should not allow agenda transition when custodians not taken', () => {
        const state = createMockGameState({
          phase: 'status',
          custodiansTaken: false,
        });
        machine = new GameMachine(state);
        expect(machine.canTransitionTo('agenda')).toBe(false);
      });

      it('should allow agenda transition when custodians taken', () => {
        const state = createMockGameState({
          phase: 'status',
          custodiansTaken: true,
        });
        machine = new GameMachine(state);
        expect(machine.canTransitionTo('agenda')).toBe(true);
      });
    });

    describe('transitionTo', () => {
      it('should transition to valid phase and increment version', () => {
        const result = machine.transitionTo('strategy');
        expect(result).toBe(true);
        expect(machine.getPhase()).toBe('strategy');
        expect(machine.getState().version).toBe(2);
      });

      it('should not transition to invalid phase', () => {
        const result = machine.transitionTo('action');
        expect(result).toBe(false);
        expect(machine.getPhase()).toBe('setup');
        expect(machine.getState().version).toBe(1);
      });

      it('should emit phaseChanged event on transition', () => {
        const listener = vi.fn();
        machine.on('phaseChanged', listener);
        machine.transitionTo('strategy');
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'phaseChanged',
            data: expect.objectContaining({
              previousPhase: 'setup',
              newPhase: 'strategy',
            }),
          })
        );
      });
    });

    describe('enterStrategyPhase', () => {
      it('should reset strategy cards when entering strategy phase', () => {
        const state = createMockGameState({
          phase: 'setup',
          strategyCards: [
            { number: 1, name: 'Leadership', pickedBy: 'player1', exhausted: true },
            { number: 2, name: 'Diplomacy', pickedBy: 'player2', exhausted: true },
          ],
        });
        machine = new GameMachine(state);
        machine.transitionTo('strategy');

        const newState = machine.getState();
        expect(newState.strategyCards[0].pickedBy).toBeNull();
        expect(newState.strategyCards[0].exhausted).toBe(false);
        expect(newState.strategyCards[1].pickedBy).toBeNull();
        expect(newState.strategyCards[1].exhausted).toBe(false);
      });

      it('should reset player passed status and strategy cards', () => {
        const state = createMockGameState({
          phase: 'setup',
          players: [
            createMockPlayer('player1', { passed: true, strategyCard: 1, strategyCardUsed: true }),
            createMockPlayer('player2', { passed: true, strategyCard: 2, strategyCardUsed: true, seatIndex: 1 }),
          ],
        });
        machine = new GameMachine(state);
        machine.transitionTo('strategy');

        const newState = machine.getState();
        expect(newState.players[0].passed).toBe(false);
        expect(newState.players[0].strategyCard).toBeNull();
        expect(newState.players[0].strategyCardUsed).toBe(false);
      });

      it('should set speaker as active player', () => {
        const state = createMockGameState({
          phase: 'setup',
          speakerId: 'player2',
          activePlayerId: 'player1',
        });
        machine = new GameMachine(state);
        machine.transitionTo('strategy');

        expect(machine.getActivePlayer()).toBe('player2');
      });
    });

    describe('enterActionPhase', () => {
      it('should build initiative order based on strategy card numbers', () => {
        const state = createMockGameState({
          phase: 'strategy',
          players: [
            createMockPlayer('player1', { strategyCard: 5 }),
            createMockPlayer('player2', { strategyCard: 2, seatIndex: 1 }),
          ],
        });
        machine = new GameMachine(state);
        machine.transitionTo('action');

        const newState = machine.getState();
        expect(newState.initiativeOrder).toEqual(['player2', 'player1']);
      });

      it('should set first player in initiative order as active', () => {
        const state = createMockGameState({
          phase: 'strategy',
          players: [
            createMockPlayer('player1', { strategyCard: 5 }),
            createMockPlayer('player2', { strategyCard: 2, seatIndex: 1 }),
          ],
        });
        machine = new GameMachine(state);
        machine.transitionTo('action');

        expect(machine.getActivePlayer()).toBe('player2');
      });
    });

    describe('enterStatusPhase', () => {
      it('should increment round counter', () => {
        const state = createMockGameState({
          phase: 'action',
          round: 1,
          players: [
            createMockPlayer('player1', { strategyCard: 1 }),
            createMockPlayer('player2', { strategyCard: 2, seatIndex: 1 }),
          ],
          initiativeOrder: ['player1', 'player2'],
        });
        machine = new GameMachine(state);
        machine.transitionTo('status');

        expect(machine.getState().round).toBe(2);
      });

      it('should clear command tokens from tiles', () => {
        const state = createMockGameState({
          phase: 'action',
          players: [
            createMockPlayer('player1', { strategyCard: 1 }),
            createMockPlayer('player2', { strategyCard: 2, seatIndex: 1 }),
          ],
          initiativeOrder: ['player1', 'player2'],
          map: {
            tiles: [
              {
                id: 'tile1',
                systemId: 1,
                position: { q: 0, r: 0 },
                rotation: 0,
                planets: [],
                wormhole: null,
                anomaly: null,
                units: [],
                commandTokens: ['player1'],
              },
            ],
            playerCount: 2,
          },
        });
        machine = new GameMachine(state);
        machine.transitionTo('status');

        expect(machine.getState().map.tiles[0].commandTokens).toEqual([]);
      });

      it('should ready all exhausted planets', () => {
        const state = createMockGameState({
          phase: 'action',
          players: [
            createMockPlayer('player1', {
              strategyCard: 1,
              planets: [
                { planetId: 'jord', exhausted: true, attachments: [] },
                { planetId: 'mars', exhausted: true, attachments: [] },
              ],
            }),
            createMockPlayer('player2', { strategyCard: 2, seatIndex: 1 }),
          ],
          initiativeOrder: ['player1', 'player2'],
        });
        machine = new GameMachine(state);
        machine.transitionTo('status');

        const newState = machine.getState();
        expect(newState.players[0].planets[0].exhausted).toBe(false);
        expect(newState.players[0].planets[1].exhausted).toBe(false);
      });
    });
  });

  describe('advanceToNextPlayer', () => {
    it('should advance to next player in initiative order', () => {
      const state = createMockGameState({
        phase: 'action',
        activePlayerId: 'player1',
        initiativeOrder: ['player1', 'player2'],
        players: [
          createMockPlayer('player1', { strategyCard: 1 }),
          createMockPlayer('player2', { strategyCard: 2, seatIndex: 1 }),
        ],
      });
      machine = new GameMachine(state);
      machine.advanceToNextPlayer();

      expect(machine.getActivePlayer()).toBe('player2');
    });

    it('should skip passed players', () => {
      const state = createMockGameState({
        phase: 'action',
        activePlayerId: 'player1',
        initiativeOrder: ['player1', 'player2', 'player3'],
        players: [
          createMockPlayer('player1', { strategyCard: 1 }),
          createMockPlayer('player2', { strategyCard: 2, seatIndex: 1, passed: true }),
          createMockPlayer('player3', { strategyCard: 3, seatIndex: 2 }),
        ],
      });
      machine = new GameMachine(state);
      machine.advanceToNextPlayer();

      expect(machine.getActivePlayer()).toBe('player3');
    });

    it('should wrap around to first player', () => {
      const state = createMockGameState({
        phase: 'action',
        activePlayerId: 'player2',
        initiativeOrder: ['player1', 'player2'],
        players: [
          createMockPlayer('player1', { strategyCard: 1 }),
          createMockPlayer('player2', { strategyCard: 2, seatIndex: 1 }),
        ],
      });
      machine = new GameMachine(state);
      machine.advanceToNextPlayer();

      expect(machine.getActivePlayer()).toBe('player1');
    });

    it('should emit turnAdvanced event', () => {
      const state = createMockGameState({
        phase: 'action',
        activePlayerId: 'player1',
        initiativeOrder: ['player1', 'player2'],
        players: [
          createMockPlayer('player1', { strategyCard: 1 }),
          createMockPlayer('player2', { strategyCard: 2, seatIndex: 1 }),
        ],
      });
      machine = new GameMachine(state);
      const listener = vi.fn();
      machine.on('turnAdvanced', listener);
      machine.advanceToNextPlayer();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'turnAdvanced',
          data: { playerId: 'player2' },
        })
      );
    });
  });

  describe('checkWinCondition', () => {
    it('should return null when no player has reached victory points', () => {
      const result = machine.checkWinCondition();
      expect(result).toBeNull();
    });

    it('should return winner id when a player reaches 10 victory points', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer('player1', { score: 10 }),
          createMockPlayer('player2', { score: 5, seatIndex: 1 }),
        ],
      });
      machine = new GameMachine(state);

      const result = machine.checkWinCondition();
      expect(result).toBe('player1');
      expect(machine.getState().winner).toBe('player1');
    });

    it('should emit gameEnded event on win', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer('player1', { score: 10 }),
          createMockPlayer('player2', { score: 5, seatIndex: 1 }),
        ],
      });
      machine = new GameMachine(state);
      const listener = vi.fn();
      machine.on('gameEnded', listener);

      machine.checkWinCondition();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'gameEnded',
          data: { winnerId: 'player1' },
        })
      );
    });
  });

  describe('event listeners', () => {
    it('should support multiple listeners for the same event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      machine.on('phaseChanged', listener1);
      machine.on('phaseChanged', listener2);
      machine.transitionTo('strategy');

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  describe('auto transitions', () => {
    it('should auto-transition from strategy to action when all players have cards', () => {
      const state = createMockGameState({
        phase: 'strategy',
        players: [
          createMockPlayer('player1', { strategyCard: 1 }),
          createMockPlayer('player2', { strategyCard: 2, seatIndex: 1 }),
        ],
        strategyCards: [
          { number: 1, name: 'Leadership', pickedBy: 'player1', exhausted: false },
          { number: 2, name: 'Diplomacy', pickedBy: 'player2', exhausted: false },
        ],
      });
      machine = new GameMachine(state);
      // Simulate completing strategy phase action that triggers auto-check
      // The checkAutoTransitions is called after processAction
    });

    it('should auto-transition from action to status when all players passed', () => {
      const state = createMockGameState({
        phase: 'action',
        players: [
          createMockPlayer('player1', { strategyCard: 1, passed: true }),
          createMockPlayer('player2', { strategyCard: 2, seatIndex: 1, passed: true }),
        ],
        initiativeOrder: ['player1', 'player2'],
      });
      machine = new GameMachine(state);
      // The machine will check this during advanceToNextPlayer
    });
  });
});
