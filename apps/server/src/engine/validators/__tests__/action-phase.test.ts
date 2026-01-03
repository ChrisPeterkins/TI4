import { describe, it, expect, vi } from 'vitest';
import {
  validatePass,
  validateTacticalAction,
  validateStrategicAction,
  validateMoveUnits,
  validateSkipMovement,
  validateProduceUnits,
  validateSkipProduction,
} from '../action-phase.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  HexCoord,
  PassAction,
  TacticalAction,
  StrategicAction,
  MoveUnitsAction,
  SkipMovementAction,
  ProduceUnitsAction,
  SkipProductionAction,
  Unit,
} from '@ti4/shared';

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Test Player',
    faction: 'sol',
    color: 'blue',
    isBot: false,
    seatPosition: 0,
    victoryPoints: 0,
    resources: 10,
    influence: 5,
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    planets: [
      { planetId: 'jord', exhausted: false, attachments: [], resources: 4, influence: 2 },
    ],
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
    strategyCard: 1,
    strategyCardUsed: false,
    passed: false,
    speaker: false,
    ...overrides,
  } as PlayerState;
}

function createMockTile(position: HexCoord, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId: 18, // Non-home system
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

function createMockUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    id: 'unit-1',
    type: 'carrier',
    ownerId: 'player1',
    damaged: false,
    ...overrides,
  } as Unit;
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
      tiles: [
        createMockTile({ q: 0, r: 0 }), // Center (Mecatol)
        createMockTile({ q: 1, r: 0 }),
        createMockTile({ q: 0, r: 1 }),
      ],
      playerCount: 6,
    },
    objectives: {
      stage1: [],
      stage2: [],
      revealed: [],
      secretDeck: [],
    },
    laws: [],
    actionCardDeck: [],
    actionCardDiscard: [],
    agendaDeck: [],
    relicDeck: [],
    strategyCards: [
      { number: 1, exhausted: false },
      { number: 2, exhausted: false },
    ],
    strategyCardState: {},
    log: [],
    settings: {
      victoryPointLimit: 10,
      gameDuration: 'full',
      mapType: 'standard',
    },
    ...overrides,
  } as GameState;
}

describe('Action Phase Validators', () => {
  describe('validatePass', () => {
    it('should fail if not in action phase', () => {
      const state = createMockGameState({ phase: 'strategy' });
      const action: PassAction = { type: 'pass', playerId: 'player1' };

      const result = validatePass(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only pass during action phase');
    });

    it('should fail if not in awaiting_action subphase', () => {
      const state = createMockGameState({ subPhase: 'tactical_movement' });
      const action: PassAction = { type: 'pass', playerId: 'player1' };

      const result = validatePass(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot pass while in the middle of an action');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action: PassAction = { type: 'pass', playerId: 'nonexistent' };

      const result = validatePass(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if strategy card not used yet', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ strategyCard: 1, strategyCardUsed: false })],
      });
      const action: PassAction = { type: 'pass', playerId: 'player1' };

      const result = validatePass(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must use your strategy card before passing');
    });

    it('should fail if player already passed', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ strategyCardUsed: true, passed: true })],
      });
      const action: PassAction = { type: 'pass', playerId: 'player1' };

      const result = validatePass(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Already passed');
    });

    it('should allow pass if strategy card is used', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ strategyCardUsed: true, passed: false })],
      });
      const action: PassAction = { type: 'pass', playerId: 'player1' };

      const result = validatePass(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow pass if player has no strategy card', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ strategyCard: null, passed: false })],
      });
      const action: PassAction = { type: 'pass', playerId: 'player1' };

      const result = validatePass(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateTacticalAction', () => {
    it('should fail if not in action phase', () => {
      const state = createMockGameState({ phase: 'strategy' });
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
      };

      const result = validateTacticalAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only take tactical actions during action phase');
    });

    it('should fail if not in awaiting_action subphase', () => {
      const state = createMockGameState({ subPhase: 'tactical_movement' });
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
      };

      const result = validateTacticalAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot start a new action while one is in progress');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'nonexistent',
        systemPosition: { q: 0, r: 0 },
      };

      const result = validateTacticalAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if no tactics tokens available', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ commandTokens: { tactics: 0, fleet: 3, strategy: 2 } })],
      });
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
      };

      const result = validateTacticalAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No tactics command tokens available');
    });

    it('should fail if target system does not exist', () => {
      const state = createMockGameState();
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 99, r: 99 }, // Non-existent
      };

      const result = validateTacticalAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid system position');
    });

    it('should fail if system already has player command token', () => {
      const state = createMockGameState({
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, { commandTokens: ['player1'] }),
          ],
          playerCount: 6,
        },
      });
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
      };

      const result = validateTacticalAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('System already activated by you this round');
    });

    it('should allow activating a system without command token', () => {
      const state = createMockGameState();
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
      };

      const result = validateTacticalAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow activating own home system', () => {
      const state = createMockGameState({
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, { systemId: 1 }), // Sol home system
          ],
          playerCount: 6,
        },
        players: [createMockPlayer({ faction: 'sol' })],
      });
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
      };

      const result = validateTacticalAction(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateStrategicAction', () => {
    it('should fail if not in action phase', () => {
      const state = createMockGameState({ phase: 'strategy' });
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
      };

      const result = validateStrategicAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only use strategy cards during action phase');
    });

    it('should fail if not in awaiting_action subphase', () => {
      const state = createMockGameState({ subPhase: 'tactical_movement' });
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
      };

      const result = validateStrategicAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot start a new action while one is in progress');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'nonexistent',
        cardNumber: 1,
      };

      const result = validateStrategicAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if player does not have this strategy card', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ strategyCard: 2 })], // Has card 2, not 1
      });
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
      };

      const result = validateStrategicAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You do not have this strategy card');
    });

    it('should fail if strategy card already used', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ strategyCard: 1, strategyCardUsed: true })],
      });
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
      };

      const result = validateStrategicAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Strategy card already used this round');
    });

    it('should fail if strategy card is exhausted', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ strategyCard: 1, strategyCardUsed: false })],
        strategyCards: [{ number: 1, exhausted: true }],
      });
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
      };

      const result = validateStrategicAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Strategy card is exhausted');
    });

    it('should allow using valid strategy card', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ strategyCard: 1, strategyCardUsed: false })],
        strategyCards: [{ number: 1, exhausted: false }],
      });
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
      };

      const result = validateStrategicAction(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateMoveUnits', () => {
    it('should fail if not in tactical_movement subphase', () => {
      const state = createMockGameState({ subPhase: 'awaiting_action' });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only move units during tactical movement phase');
    });

    it('should fail if not active player', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activePlayerId: 'player2',
      });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn');
    });

    it('should fail if no system activated', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activatedSystem: undefined,
      });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No system activated for this tactical action');
    });

    it('should fail if not active player (player not found case)', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activatedSystem: { q: 0, r: 0 },
        activePlayerId: 'player1',
      });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'nonexistent', // Not the active player
        moves: [],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(false);
      // Active player check happens before player lookup
      expect(result.error).toBe('Not your turn');
    });

    it('should fail if move destination is not activated system', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activatedSystem: { q: 0, r: 0 },
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }),
            createMockTile({ q: 1, r: 0 }, {
              units: [createMockUnit({ id: 'carrier-1', type: 'carrier' })],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [
          {
            unitId: 'carrier-1',
            from: { systemPosition: { q: 1, r: 0 } },
            to: { systemPosition: { q: 2, r: 0 } }, // Not the activated system
          },
        ],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('All units must move to the activated system');
    });

    it('should fail if moving from already-activated system', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activatedSystem: { q: 0, r: 0 },
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }),
            createMockTile({ q: 1, r: 0 }, {
              commandTokens: ['player1'], // Already activated
              units: [createMockUnit({ id: 'carrier-1', type: 'carrier' })],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [
          {
            unitId: 'carrier-1',
            from: { systemPosition: { q: 1, r: 0 } },
            to: { systemPosition: { q: 0, r: 0 } },
          },
        ],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot move units from a system you activated this round');
    });

    it('should fail if unit not found', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activatedSystem: { q: 0, r: 0 },
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }),
            createMockTile({ q: 1, r: 0 }, { units: [] }), // No units
          ],
          playerCount: 6,
        },
      });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [
          {
            unitId: 'nonexistent-unit',
            from: { systemPosition: { q: 1, r: 0 } },
            to: { systemPosition: { q: 0, r: 0 } },
          },
        ],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found in source location');
    });

    it('should fail if moving unit owned by another player', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activatedSystem: { q: 0, r: 0 },
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }),
            createMockTile({ q: 1, r: 0 }, {
              units: [createMockUnit({ id: 'carrier-1', type: 'carrier', ownerId: 'player2' })],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [
          {
            unitId: 'carrier-1',
            from: { systemPosition: { q: 1, r: 0 } },
            to: { systemPosition: { q: 0, r: 0 } },
          },
        ],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot move units you do not own');
    });

    it('should fail if trying to move structure', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activatedSystem: { q: 0, r: 0 },
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }),
            createMockTile({ q: 1, r: 0 }, {
              units: [createMockUnit({ id: 'dock-1', type: 'space_dock' })],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [
          {
            unitId: 'dock-1',
            from: { systemPosition: { q: 1, r: 0 } },
            to: { systemPosition: { q: 0, r: 0 } },
          },
        ],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Structures cannot move');
    });

    it('should fail if ground unit moves without carrier', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activatedSystem: { q: 0, r: 0 },
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }),
            createMockTile({ q: 1, r: 0 }, {
              units: [createMockUnit({ id: 'inf-1', type: 'infantry' })],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [
          {
            unitId: 'inf-1',
            from: { systemPosition: { q: 1, r: 0 } },
            to: { systemPosition: { q: 0, r: 0 } },
            // No carrier specified
          },
        ],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('requires a carrier');
    });

    it('should allow valid empty moves (skip movement)', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activatedSystem: { q: 0, r: 0 },
      });
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [],
      };

      const result = validateMoveUnits(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateSkipMovement', () => {
    it('should fail if not in tactical_movement subphase', () => {
      const state = createMockGameState({ subPhase: 'awaiting_action' });
      const action: SkipMovementAction = {
        type: 'skip_movement',
        playerId: 'player1',
      };

      const result = validateSkipMovement(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only skip movement during tactical movement phase');
    });

    it('should fail if not active player', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activePlayerId: 'player2',
      });
      const action: SkipMovementAction = {
        type: 'skip_movement',
        playerId: 'player1',
      };

      const result = validateSkipMovement(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn');
    });

    it('should allow skipping movement as active player', () => {
      const state = createMockGameState({
        subPhase: 'tactical_movement',
        activePlayerId: 'player1',
      });
      const action: SkipMovementAction = {
        type: 'skip_movement',
        playerId: 'player1',
      };

      const result = validateSkipMovement(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateProduceUnits', () => {
    it('should fail if not in tactical_production subphase', () => {
      const state = createMockGameState({ subPhase: 'tactical_movement' });
      const action: ProduceUnitsAction = {
        type: 'produce_units',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
        units: [],
      };

      const result = validateProduceUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only produce units during tactical production phase');
    });

    it('should fail if not active player', () => {
      const state = createMockGameState({
        subPhase: 'tactical_production',
        activePlayerId: 'player2',
        activatedSystem: { q: 0, r: 0 },
      });
      const action: ProduceUnitsAction = {
        type: 'produce_units',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
        units: [],
      };

      const result = validateProduceUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn');
    });

    it('should fail if no system activated', () => {
      const state = createMockGameState({
        subPhase: 'tactical_production',
        activatedSystem: undefined,
      });
      const action: ProduceUnitsAction = {
        type: 'produce_units',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
        units: [],
      };

      const result = validateProduceUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No system activated for this tactical action');
    });

    it('should fail if production not in activated system', () => {
      const state = createMockGameState({
        subPhase: 'tactical_production',
        activatedSystem: { q: 0, r: 0 },
      });
      const action: ProduceUnitsAction = {
        type: 'produce_units',
        playerId: 'player1',
        systemPosition: { q: 1, r: 0 }, // Different from activated
        units: [],
      };

      const result = validateProduceUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only produce in the activated system');
    });

    it('should fail if no space dock in system', () => {
      const state = createMockGameState({
        subPhase: 'tactical_production',
        activatedSystem: { q: 0, r: 0 },
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, { units: [] }), // No space dock
          ],
          playerCount: 6,
        },
      });
      const action: ProduceUnitsAction = {
        type: 'produce_units',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
        units: [{ type: 'infantry', count: 1 }],
      };

      const result = validateProduceUnits(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No space dock in this system');
    });

    it('should allow skipping production with empty units array', () => {
      const state = createMockGameState({
        subPhase: 'tactical_production',
        activatedSystem: { q: 0, r: 0 },
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [{
                planetId: 'testplanet',
                units: [createMockUnit({ id: 'dock-1', type: 'space_dock' })],
                attachments: [],
                resources: 3,
                influence: 2,
              } as any],
              units: [],
            }),
          ],
          playerCount: 6,
        },
        players: [createMockPlayer({
          planets: [{ planetId: 'testplanet', exhausted: false, attachments: [], resources: 3, influence: 2 }],
        })],
      });
      const action: ProduceUnitsAction = {
        type: 'produce_units',
        playerId: 'player1',
        systemPosition: { q: 0, r: 0 },
        units: [], // Empty - effectively skip production
      };

      const result = validateProduceUnits(state, action);

      // Even with 0 units, validation should pass if space dock exists
      expect(result.valid).toBe(true);
    });
  });

  describe('validateSkipProduction', () => {
    it('should fail if not in tactical_production subphase', () => {
      const state = createMockGameState({ subPhase: 'tactical_movement' });
      const action: SkipProductionAction = {
        type: 'skip_production',
        playerId: 'player1',
      };

      const result = validateSkipProduction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only skip production during tactical production phase');
    });

    it('should fail if not active player', () => {
      const state = createMockGameState({
        subPhase: 'tactical_production',
        activePlayerId: 'player2',
      });
      const action: SkipProductionAction = {
        type: 'skip_production',
        playerId: 'player1',
      };

      const result = validateSkipProduction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn');
    });

    it('should allow skipping production as active player', () => {
      const state = createMockGameState({
        subPhase: 'tactical_production',
        activePlayerId: 'player1',
      });
      const action: SkipProductionAction = {
        type: 'skip_production',
        playerId: 'player1',
      };

      const result = validateSkipProduction(state, action);

      expect(result.valid).toBe(true);
    });
  });
});
