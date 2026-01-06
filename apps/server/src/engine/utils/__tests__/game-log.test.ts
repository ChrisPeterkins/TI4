import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, PlayerState } from '@ti4/shared';
import {
  addLogEntry,
  logPhaseChange,
  logRoundStart,
  logTurnStart,
  logPass,
  logStrategyCardPicked,
  logTacticalAction,
  logStrategicAction,
  logSystemActivated,
  logUnitsMoved,
  logCombatStart,
  logDiceRolled,
  logHitsAssigned,
  logUnitDestroyed,
  logCombatEnd,
  logRetreat,
  logUnitsProduced,
  logBombardment,
  logPlanetTaken,
  logActionCardPlayed,
  logSabotage,
  logRiderPlayed,
  logRiderResolved,
  logTechnologyResearched,
  logObjectiveScored,
  logObjectiveRevealed,
  logAgendaRevealed,
  logVoteCast,
  logAgendaResolved,
  logTransactionCompleted,
  logPromissoryNotePlayed,
  logPromissoryNoteReturned,
  logAbilityTriggered,
  logGameWon,
  logComponentAction,
} from '../game-log.js';

// Helper to create mock player
function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    planets: [],
    technologies: [],
    units: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 3,
    strategyCards: [],
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    promissoryNotes: [],
    promissoryNotesInPlay: [],
    relics: [],
    exhaustedRelics: [],
    exhaustedPlanets: [],
    fragments: { cultural: 0, hazardous: 0, industrial: 0, unknown: 0 },
    ...overrides,
  } as PlayerState;
}

// Helper to create mock game state
function createMockGameState(players: PlayerState[] = []): GameState {
  if (players.length === 0) {
    players = [createMockPlayer('player1')];
  }

  return {
    id: 'test-game',
    name: 'Test Game',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'in_progress',
    players,
    currentPlayerIndex: 0,
    phase: 'action',
    round: 1,
    turnNumber: 1,
    map: { tiles: [] },
    speaker: players[0]?.id || 'player1',
    publicObjectives: [],
    publicObjectivesDeck: [],
    secretObjectivesDeck: [],
    agendaDeck: [],
    currentAgenda: null,
    actionCardDeck: [],
    actionCardDiscard: [],
    laws: [],
    passedPlayers: [],
    strategyCardState: {},
    combatState: null,
    activatedSystem: null,
    custodiansTaken: false,
    supportForTheThroneGiven: false,
    availableStrategyCards: [1, 2, 3, 4, 5, 6, 7, 8],
    events: [],
    actionsThisTurn: [],
    lastActionTimestamp: Date.now(),
    gameLog: [],
  } as unknown as GameState;
}

describe('Game Log Utils', () => {
  describe('addLogEntry', () => {
    it('should add entry to gameLog', () => {
      const state = createMockGameState();

      addLogEntry(state, 'phase_change', 'Test message');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].message).toBe('Test message');
      expect(state.gameLog[0].type).toBe('phase_change');
    });

    it('should initialize gameLog if not present', () => {
      const state = createMockGameState();
      delete (state as any).gameLog;

      addLogEntry(state, 'phase_change', 'Test message');

      expect(state.gameLog).toBeDefined();
      expect(state.gameLog.length).toBe(1);
    });

    it('should include player info when playerId provided', () => {
      const player = createMockPlayer('player1', { name: 'Test Player' });
      const state = createMockGameState([player]);

      addLogEntry(state, 'turn_start', 'Test message', { playerId: 'player1' });

      expect(state.gameLog[0].playerId).toBe('player1');
      expect(state.gameLog[0].playerName).toBe('Test Player');
      expect(state.gameLog[0].playerFaction).toBe('sol');
    });

    it('should include round and phase info', () => {
      const state = createMockGameState();
      state.round = 3;
      state.phase = 'strategy';

      addLogEntry(state, 'phase_change', 'Test message');

      expect(state.gameLog[0].round).toBe(3);
      expect(state.gameLog[0].phase).toBe('strategy');
    });

    it('should include details when provided', () => {
      const state = createMockGameState();

      addLogEntry(state, 'strategic_action', 'Test message', {
        details: { strategyCardNumber: 1, strategyCardName: 'Leadership' },
      });

      expect(state.gameLog[0].details).toBeDefined();
      expect(state.gameLog[0].details?.strategyCardNumber).toBe(1);
    });

    it('should generate unique IDs', () => {
      const state = createMockGameState();

      addLogEntry(state, 'phase_change', 'Message 1');
      addLogEntry(state, 'phase_change', 'Message 2');

      expect(state.gameLog[0].id).not.toBe(state.gameLog[1].id);
    });
  });

  describe('Phase & Turn Logging', () => {
    it('should log phase change', () => {
      const state = createMockGameState();

      logPhaseChange(state, 'strategy');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('phase_change');
    });

    it('should log round start', () => {
      const state = createMockGameState();
      state.round = 2;

      logRoundStart(state);

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('round_start');
      expect(state.gameLog[0].message).toContain('Round 2');
    });

    it('should log turn start', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logTurnStart(state, 'player1');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('turn_start');
      expect(state.gameLog[0].message).toContain('Alice');
    });

    it('should log pass', () => {
      const player = createMockPlayer('player1', { name: 'Bob' });
      const state = createMockGameState([player]);

      logPass(state, 'player1');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('pass');
      expect(state.gameLog[0].message).toContain('Bob');
      expect(state.gameLog[0].message).toContain('passed');
    });
  });

  describe('Strategy Phase Logging', () => {
    it('should log strategy card picked', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logStrategyCardPicked(state, 'player1', 1, 'Leadership');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('strategy_card_picked');
      expect(state.gameLog[0].message).toContain('Leadership');
      expect(state.gameLog[0].details?.strategyCardNumber).toBe(1);
    });
  });

  describe('Action Phase Logging', () => {
    it('should log tactical action', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logTacticalAction(state, 'player1', 'Mecatol Rex');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('tactical_action');
      expect(state.gameLog[0].message).toContain('activated');
      expect(state.gameLog[0].message).toContain('Mecatol Rex');
    });

    it('should log strategic action primary', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logStrategicAction(state, 'player1', 'Leadership', true);

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('strategic_action');
      expect(state.gameLog[0].message).toContain('primary');
    });

    it('should log strategic action secondary', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logStrategicAction(state, 'player1', 'Leadership', false);

      expect(state.gameLog[0].message).toContain('secondary');
    });

    it('should log system activated', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logSystemActivated(state, 'player1', '18', 'Mecatol Rex');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].message).toContain('Mecatol Rex');
    });

    it('should log units moved', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logUnitsMoved(state, 'player1', 'System A', 'System B', [
        { type: 'carrier' as const, count: 2 },
        { type: 'fighter' as const, count: 4 },
      ]);

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('units_moved');
    });

    it('should log units produced', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logUnitsProduced(state, 'player1', [
        { type: 'infantry' as const, count: 2 },
        { type: 'fighter' as const, count: 1 },
      ], 'Jord', 3);

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('units_produced');
    });

    it('should log component action', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logComponentAction(state, 'player1', 'Agent', 'Cleverness');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('component_action');
    });
  });

  describe('Combat Logging', () => {
    it('should log combat start', () => {
      const player1 = createMockPlayer('player1', { name: 'Alice' });
      const player2 = createMockPlayer('player2', { name: 'Bob' });
      const state = createMockGameState([player1, player2]);

      logCombatStart(state, 'space', 'player1', 'player2', 'Mecatol Rex');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('combat_start');
    });

    it('should log dice rolled', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logDiceRolled(state, 'player1', [8, 5, 3], 2);

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('dice_rolled');
    });

    it('should log hits assigned', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logHitsAssigned(state, 'player1', [{ type: 'fighter' as const, count: 2 }], 0);

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('hits_assigned');
    });

    it('should log unit destroyed', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logUnitDestroyed(state, 'player1', 'cruiser');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('unit_destroyed');
    });

    it('should log combat end', () => {
      const state = createMockGameState();

      logCombatEnd(state, 'player1', 'Mecatol Rex');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('combat_end');
    });

    it('should log retreat', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logRetreat(state, 'player1', 'System A', 'System B');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('retreat');
    });

    it('should log bombardment', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logBombardment(state, 'player1', 'Jord', 3);

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('bombardment');
    });
  });

  describe('Technology Logging', () => {
    it('should log technology researched', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logTechnologyResearched(state, 'player1', 'neural_motivator', 'Neural Motivator');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('technology_researched');
      expect(state.gameLog[0].message).toContain('Neural Motivator');
    });
  });

  describe('Planet Control Logging', () => {
    it('should log planet taken', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logPlanetTaken(state, 'player1', 'Mecatol Rex');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('planet_taken');
      expect(state.gameLog[0].message).toContain('Mecatol Rex');
    });
  });

  describe('Objective Logging', () => {
    it('should log objective scored', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logObjectiveScored(state, 'player1', 'Spend 8 Resources', 'public');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('objective_scored');
    });

    it('should log objective revealed', () => {
      const state = createMockGameState();

      logObjectiveRevealed(state, 'Spend 8 Resources', 1);

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('objective_revealed');
    });
  });

  describe('Trade Logging', () => {
    it('should log transaction completed', () => {
      const player1 = createMockPlayer('player1', { name: 'Alice' });
      const player2 = createMockPlayer('player2', { name: 'Bob' });
      const state = createMockGameState([player1, player2]);

      logTransactionCompleted(state, 'player1', 'player2', '3 trade goods for 2 commodities');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('transaction_completed');
    });
  });

  describe('Promissory Note Logging', () => {
    it('should log promissory note played', () => {
      const player1 = createMockPlayer('player1', { name: 'Alice' });
      const player2 = createMockPlayer('player2', { name: 'Bob' });
      const state = createMockGameState([player1, player2]);

      logPromissoryNotePlayed(state, 'player1', 'trade_agreement', 'Trade Agreement', 'player2');

      expect(state.gameLog.length).toBe(1);
      // Note: logPromissoryNotePlayed uses 'ability_triggered' type
      expect(state.gameLog[0].type).toBe('ability_triggered');
    });

    it('should log promissory note returned', () => {
      const player1 = createMockPlayer('player1', { name: 'Alice' });
      const player2 = createMockPlayer('player2', { name: 'Bob' });
      const state = createMockGameState([player1, player2]);

      logPromissoryNoteReturned(state, 'player1', 'trade_agreement', 'Trade Agreement', 'player2', 'activation');

      expect(state.gameLog.length).toBe(1);
      // Note: logPromissoryNoteReturned uses 'ability_triggered' type
      expect(state.gameLog[0].type).toBe('ability_triggered');
    });
  });

  describe('Agenda Phase Logging', () => {
    it('should log agenda revealed', () => {
      const state = createMockGameState();

      logAgendaRevealed(state, 'Anti-Intellectual Revolution');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('agenda_revealed');
    });

    it('should log vote cast', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logVoteCast(state, 'player1', 'for', 5);

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('vote_cast');
    });

    it('should log agenda resolved', () => {
      const state = createMockGameState();

      logAgendaResolved(state, 'Anti-Intellectual Revolution', 'for');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('agenda_resolved');
    });

    it('should log rider played', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logRiderPlayed(state, 'player1', 'Trade Rider', 'for');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('rider_played');
    });

    it('should log rider resolved', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logRiderResolved(state, 'player1', 'Trade Rider', true);

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('rider_resolved');
    });
  });

  describe('Ability Logging', () => {
    it('should log ability triggered', () => {
      const player = createMockPlayer('player1', { name: 'Alice', faction: 'sol' });
      const state = createMockGameState([player]);

      logAbilityTriggered(state, 'player1', 'Orbital Drop');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('ability_triggered');
    });
  });

  describe('Action Card Logging', () => {
    it('should log action card played', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logActionCardPlayed(state, 'player1', 'sabotage', 'Sabotage');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('action_card_played');
    });

    it('should log sabotage', () => {
      const player1 = createMockPlayer('player1', { name: 'Alice' });
      const player2 = createMockPlayer('player2', { name: 'Bob' });
      const state = createMockGameState([player1, player2]);

      logSabotage(state, 'player1', 'Direct Hit', 'Bob');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('sabotage');
    });
  });

  describe('Game End Logging', () => {
    it('should log game won', () => {
      const player = createMockPlayer('player1', { name: 'Alice' });
      const state = createMockGameState([player]);

      logGameWon(state, 'player1');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].type).toBe('game_won');
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown player gracefully', () => {
      const state = createMockGameState();

      logTurnStart(state, 'unknown-player');

      expect(state.gameLog.length).toBe(1);
      expect(state.gameLog[0].message).toContain('Unknown');
    });

    it('should handle multiple log entries', () => {
      const state = createMockGameState();

      logPhaseChange(state, 'strategy');
      logRoundStart(state);
      logPhaseChange(state, 'action');

      expect(state.gameLog.length).toBe(3);
    });
  });
});
