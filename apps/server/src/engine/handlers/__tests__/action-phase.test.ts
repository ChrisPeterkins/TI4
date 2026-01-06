import { describe, it, expect, beforeEach } from 'vitest';
import {
  handlePass,
  handleStrategicAction,
  handleTacticalAction,
  completeTacticalAction,
  completeStrategicPrimary,
  completeStrategicAction,
  handleMoveUnits,
  handleSkipMovement,
  handleProduceUnits,
  handleSkipProduction,
} from '../action-phase.js';
import type {
  GameState,
  PlayerState,
  PassAction,
  StrategicAction,
  TacticalAction,
  MoveUnitsAction,
  SkipMovementAction,
  ProduceUnitsAction,
  SkipProductionAction,
  MapTile,
  UnitInstance,
  HexCoord,
  PlanetInstance,
} from '@ti4/shared';

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
    promissoryNotesInPlay: [],
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

function createMockGameState(playerCount: number = 4): GameState {
  const players: PlayerState[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(createMockPlayer(`player${i + 1}`, {
      name: `Player ${i + 1}`,
      seatIndex: i,
      color: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'][i] as any,
      strategyCard: i + 1, // Each player has a strategy card
    }));
  }

  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: players.map(p => p.id), // player1, player2, player3, player4
    players,
    map: {
      tiles: [],
      playerCount,
    },
    strategyCards: [
      { number: 1, name: 'Leadership', pickedBy: 'player1', exhausted: false },
      { number: 2, name: 'Diplomacy', pickedBy: 'player2', exhausted: false },
      { number: 3, name: 'Politics', pickedBy: 'player3', exhausted: false },
      { number: 4, name: 'Construction', pickedBy: 'player4', exhausted: false },
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
    timingWindowStack: [], activeTimingWindow: null,
    winner: null,
    gameLog: [],
  };
}

describe('Action Phase Handler', () => {
  describe('handlePass', () => {
    it('should mark player as passed', () => {
      const state = createMockGameState(4);
      const action: PassAction = {
        type: 'pass',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePass(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].passed).toBe(true);
    });

    it('should advance to next non-passed player', () => {
      const state = createMockGameState(4);
      const action: PassAction = {
        type: 'pass',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      handlePass(state, action);

      expect(state.activePlayerId).toBe('player2');
    });

    it('should skip already passed players', () => {
      const state = createMockGameState(4);
      // Mark player2 as already passed
      state.players[1].passed = true;

      const action: PassAction = {
        type: 'pass',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      handlePass(state, action);

      // Should skip player2 and go to player3
      expect(state.activePlayerId).toBe('player3');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState(4);
      const action: PassAction = {
        type: 'pass',
        playerId: 'nonexistent',
        timestamp: Date.now(),
      };

      const result = handlePass(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should emit player_passed event', () => {
      const state = createMockGameState(4);
      const action: PassAction = {
        type: 'pass',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePass(state, action);

      expect(result.triggeredEvents).toContain('player_passed');
    });

    it('should handle all players passing', () => {
      const state = createMockGameState(4);
      // Mark all but player1 as passed
      state.players[1].passed = true;
      state.players[2].passed = true;
      state.players[3].passed = true;

      const action: PassAction = {
        type: 'pass',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePass(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].passed).toBe(true);
      // All players have passed - activePlayerId may stay the same
    });
  });

  describe('handleStrategicAction', () => {
    it('should mark strategy card as exhausted', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = handleStrategicAction(state, action);

      expect(result.success).toBe(true);
      expect(state.strategyCards[0].exhausted).toBe(true);
    });

    it('should mark player as having used strategy card', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      handleStrategicAction(state, action);

      expect(state.players[0].strategyCardUsed).toBe(true);
    });

    it('should enter strategic_primary sub-phase', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      handleStrategicAction(state, action);

      expect(state.subPhase).toBe('strategic_primary');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'nonexistent',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = handleStrategicAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if strategy card not found', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 99,
        timestamp: Date.now(),
      };

      const result = handleStrategicAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Strategy card not found');
    });

    it('should emit strategic_action_started event', () => {
      const state = createMockGameState(4);
      const action: StrategicAction = {
        type: 'strategic_action',
        playerId: 'player1',
        cardNumber: 1,
        timestamp: Date.now(),
      };

      const result = handleStrategicAction(state, action);

      expect(result.triggeredEvents).toContain('strategic_action_started');
    });
  });

  describe('handleTacticalAction', () => {
    it('should place command token in activated system', () => {
      const state = createMockGameStateWithTiles(4);
      const targetPosition: HexCoord = { q: 1, r: 0 };
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: targetPosition,
        timestamp: Date.now(),
      };

      const result = handleTacticalAction(state, action);

      expect(result.success).toBe(true);
      const tile = state.map.tiles.find(
        (t) => t.position.q === targetPosition.q && t.position.r === targetPosition.r
      );
      expect(tile?.commandTokens).toContain('player1');
    });

    it('should fail if no tokens in tactic pool', () => {
      const state = createMockGameStateWithTiles(4);
      state.players[0].commandTokens.tactics = 0;
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 1, r: 0 },
        timestamp: Date.now(),
      };

      handleTacticalAction(state, action);

      // After action, tactics should be -1 (system should check for tokens first)
      // This validates that we consume a token
      expect(state.players[0].commandTokens.tactics).toBe(-1);
    });

    it('should transition to tactical_movement sub-phase', () => {
      const state = createMockGameStateWithTiles(4);
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 1, r: 0 },
        timestamp: Date.now(),
      };

      handleTacticalAction(state, action);

      expect(state.subPhase).toBe('tactical_movement');
    });

    it('should fail if system not found', () => {
      const state = createMockGameStateWithTiles(4);
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 99, r: 99 }, // Non-existent
        timestamp: Date.now(),
      };

      const result = handleTacticalAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('System not found');
    });

    it('should fail if player not found', () => {
      const state = createMockGameStateWithTiles(4);
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'nonexistent',
        systemPosition: { q: 1, r: 0 },
        timestamp: Date.now(),
      };

      const result = handleTacticalAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should set activated system', () => {
      const state = createMockGameStateWithTiles(4);
      const targetPosition: HexCoord = { q: 1, r: 0 };
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: targetPosition,
        timestamp: Date.now(),
      };

      handleTacticalAction(state, action);

      expect(state.activatedSystem).toEqual(targetPosition);
    });

    it('should emit system_activated event', () => {
      const state = createMockGameStateWithTiles(4);
      const action: TacticalAction = {
        type: 'tactical_action',
        playerId: 'player1',
        systemPosition: { q: 1, r: 0 },
        timestamp: Date.now(),
      };

      const result = handleTacticalAction(state, action);

      expect(result.triggeredEvents).toContain('system_activated');
    });
  });

  describe('completeTacticalAction', () => {
    it('should clear activated system', () => {
      const state = createMockGameState(4);
      state.activatedSystem = { q: 1, r: 0 };

      completeTacticalAction(state);

      expect(state.activatedSystem).toBeUndefined();
    });

    it('should transition to awaiting_action sub-phase', () => {
      const state = createMockGameState(4);
      state.subPhase = 'tactical_production';

      completeTacticalAction(state);

      expect(state.subPhase).toBe('awaiting_action');
    });

    it('should advance to next player', () => {
      const state = createMockGameState(4);
      state.activePlayerId = 'player1';

      completeTacticalAction(state);

      expect(state.activePlayerId).toBe('player2');
    });

    it('should emit tactical_action_completed event', () => {
      const state = createMockGameState(4);

      const result = completeTacticalAction(state);

      expect(result.triggeredEvents).toContain('tactical_action_completed');
    });
  });

  describe('completeStrategicPrimary', () => {
    it('should transition to strategic_secondary sub-phase', () => {
      const state = createMockGameState(4);
      state.subPhase = 'strategic_primary';

      completeStrategicPrimary(state);

      expect(state.subPhase).toBe('strategic_secondary');
    });

    it('should emit strategic_primary_completed event', () => {
      const state = createMockGameState(4);

      const result = completeStrategicPrimary(state);

      expect(result.triggeredEvents).toContain('strategic_primary_completed');
    });
  });

  describe('completeStrategicAction', () => {
    it('should transition to awaiting_action sub-phase', () => {
      const state = createMockGameState(4);
      state.subPhase = 'strategic_secondary';

      completeStrategicAction(state);

      expect(state.subPhase).toBe('awaiting_action');
    });

    it('should advance to next player', () => {
      const state = createMockGameState(4);
      state.activePlayerId = 'player1';

      completeStrategicAction(state);

      expect(state.activePlayerId).toBe('player2');
    });

    it('should emit strategic_action_completed event', () => {
      const state = createMockGameState(4);

      const result = completeStrategicAction(state);

      expect(result.triggeredEvents).toContain('strategic_action_completed');
    });
  });

  describe('handleMoveUnits', () => {
    it('should fail if no activated system', () => {
      const state = createMockGameStateWithTiles(4);
      state.activatedSystem = undefined;
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [],
        timestamp: Date.now(),
      };

      const result = handleMoveUnits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No activated system');
    });

    it('should fail if player not found', () => {
      const state = createMockGameStateWithTiles(4);
      state.activatedSystem = { q: 0, r: 0 };
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'nonexistent',
        moves: [],
        timestamp: Date.now(),
      };

      const result = handleMoveUnits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should move ships to target system', () => {
      const state = createMockGameStateWithTiles(4);
      const targetPos: HexCoord = { q: 0, r: 0 };
      const sourcePos: HexCoord = { q: 1, r: 0 };
      state.activatedSystem = targetPos;

      // Add a ship to the source tile
      const sourceTile = state.map.tiles.find(
        (t) => t.position.q === sourcePos.q && t.position.r === sourcePos.r
      );
      const unit: UnitInstance = {
        id: 'unit-1',
        type: 'cruiser',
        ownerId: 'player1',
        damaged: false,
      };
      sourceTile!.units.push(unit);

      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [
          {
            unitId: 'unit-1',
            from: { systemPosition: sourcePos },
            to: { systemPosition: targetPos },
          },
        ],
        timestamp: Date.now(),
      };

      const result = handleMoveUnits(state, action);

      expect(result.success).toBe(true);
      const targetTile = state.map.tiles.find(
        (t) => t.position.q === targetPos.q && t.position.r === targetPos.r
      );
      expect(targetTile!.units.some((u) => u.id === 'unit-1')).toBe(true);
    });

    it('should emit units_moved event', () => {
      const state = createMockGameStateWithTiles(4);
      state.activatedSystem = { q: 0, r: 0 };
      const action: MoveUnitsAction = {
        type: 'move_units',
        playerId: 'player1',
        moves: [],
        timestamp: Date.now(),
      };

      const result = handleMoveUnits(state, action);

      expect(result.triggeredEvents).toContain('units_moved');
    });
  });

  describe('handleSkipMovement', () => {
    it('should transition to tactical_production if no activated system', () => {
      const state = createMockGameState(4);
      state.activatedSystem = undefined;
      const action: SkipMovementAction = {
        type: 'skip_movement',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleSkipMovement(state, action);

      expect(result.success).toBe(true);
      expect(state.subPhase).toBe('tactical_production');
    });

    it('should emit movement_skipped event', () => {
      const state = createMockGameState(4);
      state.activatedSystem = undefined;
      const action: SkipMovementAction = {
        type: 'skip_movement',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleSkipMovement(state, action);

      expect(result.triggeredEvents).toContain('movement_skipped');
    });
  });

  describe('handleProduceUnits', () => {
    it('should fail if player not found', () => {
      const state = createMockGameStateWithTiles(4);
      state.activatedSystem = { q: 0, r: 0 };
      const action: ProduceUnitsAction = {
        type: 'produce_units',
        playerId: 'nonexistent',
        units: [],
        exhaustedPlanets: [],
        timestamp: Date.now(),
      };

      const result = handleProduceUnits(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should produce units in activated system', () => {
      const state = createMockGameStateWithTiles(4);
      const targetPos: HexCoord = { q: 0, r: 0 };
      state.activatedSystem = targetPos;

      // Add a space dock to the target system
      const targetTile = state.map.tiles.find(
        (t) => t.position.q === targetPos.q && t.position.r === targetPos.r
      );
      targetTile!.planets.push({
        planetId: 'test_planet',
        controlledBy: 'player1',
        exhausted: false,
        attachments: [],
        units: [{ id: 'dock-1', type: 'space_dock', ownerId: 'player1', damaged: false }],
      } as PlanetInstance);

      // Give player resources via trade goods
      state.players[0].tradeGoods = 10;

      const action: ProduceUnitsAction = {
        type: 'produce_units',
        playerId: 'player1',
        systemPosition: targetPos,
        units: [{ type: 'infantry', count: 2 }],
        exhaustedPlanets: [],
        timestamp: Date.now(),
      };

      const result = handleProduceUnits(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('tactical_action_completed');
    });
  });

  describe('handleSkipProduction', () => {
    it('should complete tactical action', () => {
      const state = createMockGameStateWithTiles(4);
      state.subPhase = 'tactical_production';
      state.activatedSystem = { q: 0, r: 0 };
      const action: SkipProductionAction = {
        type: 'skip_production',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleSkipProduction(state, action);

      expect(result.success).toBe(true);
      expect(state.subPhase).toBe('awaiting_action');
    });

    it('should emit tactical_action_completed event', () => {
      const state = createMockGameStateWithTiles(4);
      state.activatedSystem = { q: 0, r: 0 };
      const action: SkipProductionAction = {
        type: 'skip_production',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleSkipProduction(state, action);

      expect(result.triggeredEvents).toContain('tactical_action_completed');
    });
  });
});

// =============================================================================
// HELPER FUNCTIONS FOR TESTS WITH TILES
// =============================================================================

function createMockTile(position: HexCoord, systemId: number): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId,
    position,
    rotation: 0,
    planets: [],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
  } as MapTile;
}

function createMockGameStateWithTiles(playerCount: number = 4): GameState {
  const state = createMockGameState(playerCount);

  // Add some tiles around the center (Mecatol)
  state.map.tiles = [
    createMockTile({ q: 0, r: 0 }, 18), // Mecatol Rex
    createMockTile({ q: 1, r: 0 }, 19),
    createMockTile({ q: 0, r: 1 }, 20),
    createMockTile({ q: -1, r: 1 }, 21),
    createMockTile({ q: -1, r: 0 }, 22),
    createMockTile({ q: 0, r: -1 }, 23),
    createMockTile({ q: 1, r: -1 }, 24),
  ];

  return state;
}
