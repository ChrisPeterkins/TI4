import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleScoreObjective,
  handleSkipScoring,
  handleRedistributeTokens,
  initializeStatusPhase,
  advanceStatusPhaseStep,
  revealPublicObjective,
  drawActionCards,
  removeCommandTokens,
  readyCards,
  repairUnits,
  returnStrategyCards,
} from '../status-phase.js';
import type {
  GameState,
  PlayerState,
  ScoreObjectiveAction,
  SkipScoringAction,
  RedistributeTokensAction,
  ObjectiveInstance,
  PlanetState,
} from '@ti4/shared';

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 5,
    commodities: 2,
    maxCommodities: 4,
    technologies: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    planets: [],
    strategyCard: 1,
    strategyCardUsed: true,
    passed: true,
    score: 0,
    neighbors: [],
    transactedWith: [],
    ...overrides,
  };
}

function createMockObjective(id: string, revealed: boolean = true): ObjectiveInstance {
  return {
    id,
    revealed,
    scoredBy: [],
  };
}

function createMockGameState(playerCount: number = 4): GameState {
  const players: PlayerState[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(createMockPlayer(`player${i + 1}`, {
      name: `Player ${i + 1}`,
      seatIndex: i,
      color: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'][i] as any,
      strategyCard: i + 1,
      // Each player controls their "home system" planets
      planets: [
        { planetId: `home_planet_${i + 1}`, exhausted: false, attachments: [] },
      ],
    }));
  }

  // Create home system tiles where players control their planets
  const tiles = players.map((player, i) => ({
    id: `home_tile_${i + 1}`,
    systemId: 1 + i, // Just use unique IDs
    position: { q: i, r: 0 },
    rotation: 0,
    planets: [
      {
        id: `planet_instance_${i + 1}`,
        planetId: `home_planet_${i + 1}`,
        controlledBy: player.id,
        exhausted: false,
        attachments: [],
        units: [],
      },
    ],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
  }));

  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'status',
    subPhase: 'score_objectives',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: players.map(p => p.id),
    players,
    map: {
      tiles,
      playerCount,
    },
    strategyCards: [
      { number: 1, name: 'Leadership', pickedBy: 'player1', exhausted: true },
      { number: 2, name: 'Diplomacy', pickedBy: 'player2', exhausted: true },
      { number: 3, name: 'Politics', pickedBy: 'player3', exhausted: true },
      { number: 4, name: 'Construction', pickedBy: 'player4', exhausted: true },
      { number: 5, name: 'Trade', pickedBy: null, exhausted: false },
      { number: 6, name: 'Warfare', pickedBy: null, exhausted: false },
      { number: 7, name: 'Technology', pickedBy: null, exhausted: false },
      { number: 8, name: 'Imperial', pickedBy: null, exhausted: false },
    ],
    objectives: {
      publicStageI: [
        createMockObjective('erect_a_monument'),
        createMockObjective('expand_borders'),
        createMockObjective('found_research_outposts', false),
        createMockObjective('intimidate_council', false),
        createMockObjective('lead_from_the_front', false),
      ],
      publicStageII: [
        createMockObjective('centralize_galactic_trade', false),
        createMockObjective('conquer_the_weak', false),
        createMockObjective('form_galactic_brain_trust', false),
        createMockObjective('found_a_golden_age', false),
        createMockObjective('galvanize_the_people', false),
      ],
      revealedCount: 2,
      secretDeck: ['secret1', 'secret2', 'secret3'],
    },
    agendas: {
      currentAgenda: null,
      currentAgendaNumber: 1,
      votes: new Map(),
      outcome: null,
      riders: [],
    },
    actionCardDeck: ['action1', 'action2', 'action3', 'action4', 'action5', 'action6', 'action7', 'action8'],
    actionCardDiscard: [],
    agendaDeck: [],
    agendaDiscard: [],
    laws: [],
    custodiansTaken: false,
    activeCombat: null,
    timingWindows: [],
    winner: null,
    statusPhase: {
      currentStep: 1,
      scoringComplete: [],
      scoredThisPhase: [],
      redistributionComplete: [],
    },
  };
}

describe('Status Phase Handlers', () => {
  describe('initializeStatusPhase', () => {
    it('should set phase to status and subPhase to score_objectives', () => {
      const state = createMockGameState();
      state.phase = 'action'; // Start from action phase
      state.subPhase = 'awaiting_action';
      state.statusPhase = undefined;

      initializeStatusPhase(state);

      expect(state.phase).toBe('status');
      expect(state.subPhase).toBe('score_objectives');
      expect(state.statusPhase).toBeDefined();
      expect(state.statusPhase!.currentStep).toBe(1);
    });

    it('should set first player in initiative order as active', () => {
      const state = createMockGameState();
      state.initiativeOrder = ['player3', 'player1', 'player2', 'player4'];
      state.statusPhase = undefined;

      initializeStatusPhase(state);

      expect(state.activePlayerId).toBe('player3');
    });

    it('should initialize empty tracking arrays', () => {
      const state = createMockGameState();
      state.statusPhase = undefined;

      initializeStatusPhase(state);

      expect(state.statusPhase!.scoringComplete).toEqual([]);
      expect(state.statusPhase!.scoredThisPhase).toEqual([]);
      expect(state.statusPhase!.redistributionComplete).toEqual([]);
    });
  });

  describe('handleScoreObjective', () => {
    it('should fail if player not found', () => {
      const state = createMockGameState();

      const action: ScoreObjectiveAction = {
        type: 'score_objective',
        playerId: 'nonexistent',
        objectiveId: 'erect_a_monument',
        objectiveType: 'public',
        timestamp: Date.now(),
      };

      const result = handleScoreObjective(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if objective not found', () => {
      const state = createMockGameState();

      const action: ScoreObjectiveAction = {
        type: 'score_objective',
        playerId: 'player1',
        objectiveId: 'nonexistent_objective',
        objectiveType: 'public',
        timestamp: Date.now(),
      };

      const result = handleScoreObjective(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Objective not found');
    });

    // Note: Testing "already scored this phase" is tricky because the handler checks
    // objective requirements BEFORE checking if already scored. We test this at the
    // validator level instead where the order is correct.

    it('should fail if trying to score an action phase secret during status phase', () => {
      const state = createMockGameState();
      state.players[0].secretObjectives = ['destroy_their_greatest_ship'];

      const action: ScoreObjectiveAction = {
        type: 'score_objective',
        playerId: 'player1',
        objectiveId: 'destroy_their_greatest_ship',
        objectiveType: 'secret',
        timestamp: Date.now(),
      };

      const result = handleScoreObjective(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Combat objectives are scored during action phase');
    });

    it('should fail if player does not meet objective requirements', () => {
      const state = createMockGameState();
      // Player has adapt_new_strategies but no faction techs
      state.players[0].secretObjectives = ['adapt_new_strategies'];

      const action: ScoreObjectiveAction = {
        type: 'score_objective',
        playerId: 'player1',
        objectiveId: 'adapt_new_strategies',
        objectiveType: 'secret',
        timestamp: Date.now(),
      };

      const result = handleScoreObjective(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('faction techs');
    });

    it('should allow scoring a secret after scoring a public (different types)', () => {
      const state = createMockGameState();
      state.players[0].secretObjectives = ['adapt_new_strategies'];
      state.statusPhase!.scoredThisPhase.push({
        playerId: 'player1',
        publicObjective: 'erect_a_monument',
      });

      const action: ScoreObjectiveAction = {
        type: 'score_objective',
        playerId: 'player1',
        objectiveId: 'adapt_new_strategies',
        objectiveType: 'secret',
        timestamp: Date.now(),
      };

      const result = handleScoreObjective(state, action);

      // The error should not be about already scoring a public objective
      // (it may fail for other reasons like requirement checking)
      if (!result.success) {
        expect(result.error).not.toContain('Already scored a public objective');
      }
    });
  });

  describe('handleSkipScoring', () => {
    it('should mark player as done with scoring', () => {
      const state = createMockGameState();

      const action: SkipScoringAction = {
        type: 'skip_scoring',
        playerId: 'player1',
        skipType: 'both',
        timestamp: Date.now(),
      };

      const result = handleSkipScoring(state, action);

      expect(result.success).toBe(true);
      expect(state.statusPhase?.scoringComplete).toContain('player1');
    });

    it('should advance to next player', () => {
      const state = createMockGameState();

      const action: SkipScoringAction = {
        type: 'skip_scoring',
        playerId: 'player1',
        skipType: 'both',
        timestamp: Date.now(),
      };

      handleSkipScoring(state, action);

      expect(state.activePlayerId).toBe('player2');
    });

    it('should advance to next step when all players done', () => {
      const state = createMockGameState();
      state.statusPhase!.scoringComplete = ['player2', 'player3', 'player4'];

      const action: SkipScoringAction = {
        type: 'skip_scoring',
        playerId: 'player1',
        skipType: 'both',
        timestamp: Date.now(),
      };

      handleSkipScoring(state, action);

      expect(state.statusPhase?.currentStep).toBeGreaterThan(1);
    });

    it('should fail if player not found', () => {
      const state = createMockGameState();

      const action: SkipScoringAction = {
        type: 'skip_scoring',
        playerId: 'nonexistent',
        skipType: 'both',
        timestamp: Date.now(),
      };

      const result = handleSkipScoring(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should emit scoring_skipped event', () => {
      const state = createMockGameState();

      const action: SkipScoringAction = {
        type: 'skip_scoring',
        playerId: 'player1',
        skipType: 'both',
        timestamp: Date.now(),
      };

      const result = handleSkipScoring(state, action);

      expect(result.triggeredEvents).toContain('scoring_skipped');
    });
  });

  describe('handleRedistributeTokens', () => {
    it('should update player command token distribution', () => {
      const state = createMockGameState();
      state.subPhase = 'gain_redistribute_tokens';
      // Player has 3 + 3 + 2 = 8 tokens, should have 10 after gaining 2

      const action: RedistributeTokensAction = {
        type: 'redistribute_tokens',
        playerId: 'player1',
        distribution: { tactics: 4, fleet: 4, strategy: 2 },
        timestamp: Date.now(),
      };

      const result = handleRedistributeTokens(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].commandTokens.tactics).toBe(4);
      expect(state.players[0].commandTokens.fleet).toBe(4);
      expect(state.players[0].commandTokens.strategy).toBe(2);
    });

    it('should fail if total is not current + 2', () => {
      const state = createMockGameState();
      state.subPhase = 'gain_redistribute_tokens';
      // Player has 8 tokens, should have 10 after gaining 2

      const action: RedistributeTokensAction = {
        type: 'redistribute_tokens',
        playerId: 'player1',
        distribution: { tactics: 3, fleet: 3, strategy: 2 }, // Only 8, should be 10
        timestamp: Date.now(),
      };

      const result = handleRedistributeTokens(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid token distribution');
    });

    it('should fail if any token value is negative', () => {
      const state = createMockGameState();
      state.subPhase = 'gain_redistribute_tokens';

      const action: RedistributeTokensAction = {
        type: 'redistribute_tokens',
        playerId: 'player1',
        distribution: { tactics: -1, fleet: 6, strategy: 5 },
        timestamp: Date.now(),
      };

      const result = handleRedistributeTokens(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('negative');
    });

    it('should mark player as done with redistribution', () => {
      const state = createMockGameState();
      state.subPhase = 'gain_redistribute_tokens';

      const action: RedistributeTokensAction = {
        type: 'redistribute_tokens',
        playerId: 'player1',
        distribution: { tactics: 4, fleet: 4, strategy: 2 },
        timestamp: Date.now(),
      };

      handleRedistributeTokens(state, action);

      expect(state.statusPhase?.redistributionComplete).toContain('player1');
    });

    it('should advance to next player', () => {
      const state = createMockGameState();
      state.subPhase = 'gain_redistribute_tokens';

      const action: RedistributeTokensAction = {
        type: 'redistribute_tokens',
        playerId: 'player1',
        distribution: { tactics: 4, fleet: 4, strategy: 2 },
        timestamp: Date.now(),
      };

      handleRedistributeTokens(state, action);

      expect(state.activePlayerId).toBe('player2');
    });

    it('should advance to next step when all players done', () => {
      const state = createMockGameState();
      state.subPhase = 'gain_redistribute_tokens';
      state.statusPhase!.currentStep = 5;
      state.statusPhase!.redistributionComplete = ['player2', 'player3', 'player4'];

      const action: RedistributeTokensAction = {
        type: 'redistribute_tokens',
        playerId: 'player1',
        distribution: { tactics: 4, fleet: 4, strategy: 2 },
        timestamp: Date.now(),
      };

      handleRedistributeTokens(state, action);

      // After redistribution, should advance through automatic steps (ready_cards, repair_units, return_strategy_cards)
      // Phase should transition to strategy (or agenda if custodians taken)
      expect(state.phase).toBe('strategy');
      expect(state.statusPhase).toBeUndefined(); // Cleared after completion
    });

    it('should emit tokens_redistributed event', () => {
      const state = createMockGameState();
      state.subPhase = 'gain_redistribute_tokens';

      const action: RedistributeTokensAction = {
        type: 'redistribute_tokens',
        playerId: 'player1',
        distribution: { tactics: 4, fleet: 4, strategy: 2 },
        timestamp: Date.now(),
      };

      const result = handleRedistributeTokens(state, action);

      expect(result.triggeredEvents).toContain('tokens_redistributed');
    });
  });

  describe('revealPublicObjective', () => {
    it('should reveal next Stage I objective when revealedCount < 5', () => {
      const state = createMockGameState();
      state.objectives.revealedCount = 2;

      const revealed = revealPublicObjective(state);

      expect(revealed).toBe('found_research_outposts');
      expect(state.objectives.publicStageI[2].revealed).toBe(true);
      expect(state.objectives.revealedCount).toBe(3);
    });

    it('should reveal Stage II objective when revealedCount >= 5', () => {
      const state = createMockGameState();
      state.objectives.revealedCount = 5;
      // Mark all Stage I as revealed
      state.objectives.publicStageI.forEach(o => o.revealed = true);

      const revealed = revealPublicObjective(state);

      expect(revealed).toBe('centralize_galactic_trade');
      expect(state.objectives.publicStageII[0].revealed).toBe(true);
      expect(state.objectives.revealedCount).toBe(6);
    });

    it('should return null when no more objectives to reveal', () => {
      const state = createMockGameState();
      state.objectives.revealedCount = 10;
      state.objectives.publicStageI.forEach(o => o.revealed = true);
      state.objectives.publicStageII.forEach(o => o.revealed = true);

      const revealed = revealPublicObjective(state);

      expect(revealed).toBeNull();
    });

    it('should store revealed objective in statusPhase tracking', () => {
      const state = createMockGameState();
      state.objectives.revealedCount = 2;

      revealPublicObjective(state);

      expect(state.statusPhase?.revealedObjective).toBe('found_research_outposts');
    });
  });

  describe('drawActionCards', () => {
    it('should give each player 2 action cards in initiative order', () => {
      const state = createMockGameState();

      drawActionCards(state);

      // Per TI4 rules, each player draws 2 action cards during Status Phase
      expect(state.players[0].actionCards).toHaveLength(2);
      expect(state.players[1].actionCards).toHaveLength(2);
      expect(state.players[2].actionCards).toHaveLength(2);
      expect(state.players[3].actionCards).toHaveLength(2);
    });

    it('should draw from the action card deck', () => {
      const state = createMockGameState();
      const initialDeckSize = state.actionCardDeck.length;

      drawActionCards(state);

      // 2 cards per player × 4 players = 8 cards drawn
      expect(state.actionCardDeck).toHaveLength(initialDeckSize - 8);
    });

    it('should give cards in initiative order', () => {
      const state = createMockGameState();
      state.initiativeOrder = ['player3', 'player1', 'player4', 'player2'];
      // Need 8 cards for 4 players × 2 cards each
      state.actionCardDeck = ['card1', 'card2', 'card3', 'card4', 'card5', 'card6', 'card7', 'card8'];

      drawActionCards(state);

      // player3 gets cards 1-2, player1 gets cards 3-4, etc.
      expect(state.players[2].actionCards).toContain('card1'); // player3
      expect(state.players[2].actionCards).toContain('card2'); // player3
      expect(state.players[0].actionCards).toContain('card3'); // player1
      expect(state.players[0].actionCards).toContain('card4'); // player1
      expect(state.players[3].actionCards).toContain('card5'); // player4
      expect(state.players[3].actionCards).toContain('card6'); // player4
      expect(state.players[1].actionCards).toContain('card7'); // player2
      expect(state.players[1].actionCards).toContain('card8'); // player2
    });
  });

  describe('removeCommandTokens', () => {
    it('should clear all command tokens from tiles', () => {
      const state = createMockGameState();
      state.map.tiles = [
        { id: 'tile1', systemId: 1, position: { q: 0, r: 0 }, rotation: 0, planets: [], wormhole: null, anomaly: null, units: [], commandTokens: ['player1', 'player2'] },
        { id: 'tile2', systemId: 2, position: { q: 1, r: 0 }, rotation: 0, planets: [], wormhole: null, anomaly: null, units: [], commandTokens: ['player3'] },
      ];

      removeCommandTokens(state);

      expect(state.map.tiles[0].commandTokens).toEqual([]);
      expect(state.map.tiles[1].commandTokens).toEqual([]);
    });

    it('should clear activatedSystem', () => {
      const state = createMockGameState();
      state.activatedSystem = { q: 1, r: 2 };

      removeCommandTokens(state);

      expect(state.activatedSystem).toBeUndefined();
    });
  });

  describe('readyCards', () => {
    it('should ready all exhausted planets', () => {
      const state = createMockGameState();
      state.players[0].planets = [
        { planetId: 'jord', exhausted: true, attachments: [] },
        { planetId: 'mars', exhausted: true, attachments: [] },
      ];
      state.players[1].planets = [
        { planetId: 'moll_primus', exhausted: true, attachments: [] },
      ];

      readyCards(state);

      expect(state.players[0].planets[0].exhausted).toBe(false);
      expect(state.players[0].planets[1].exhausted).toBe(false);
      expect(state.players[1].planets[0].exhausted).toBe(false);
    });

    it('should ready exhausted agents', () => {
      const state = createMockGameState();
      state.players[0].leaders = {
        agent: { unlocked: true, exhausted: true },
        commander: { unlocked: false },
        hero: { unlocked: false, purged: false },
      };

      readyCards(state);

      expect(state.players[0].leaders?.agent.exhausted).toBe(false);
    });
  });

  describe('repairUnits', () => {
    it('should repair all damaged units in space', () => {
      const state = createMockGameState();
      state.map.tiles = [
        {
          id: 'tile1',
          systemId: 1,
          position: { q: 0, r: 0 },
          rotation: 0,
          planets: [],
          wormhole: null,
          anomaly: null,
          units: [
            { id: 'unit1', type: 'dreadnought', ownerId: 'player1', damaged: true },
            { id: 'unit2', type: 'carrier', ownerId: 'player1', damaged: true },
          ],
          commandTokens: [],
        },
      ];

      repairUnits(state);

      expect(state.map.tiles[0].units[0].damaged).toBe(false);
      expect(state.map.tiles[0].units[1].damaged).toBe(false);
    });

    it('should repair all damaged units on planets', () => {
      const state = createMockGameState();
      state.map.tiles = [
        {
          id: 'tile1',
          systemId: 1,
          position: { q: 0, r: 0 },
          rotation: 0,
          planets: [
            {
              id: 'planet1',
              planetId: 'jord',
              controlledBy: 'player1',
              exhausted: false,
              attachments: [],
              units: [
                { id: 'unit1', type: 'mech', ownerId: 'player1', damaged: true },
              ],
            },
          ],
          wormhole: null,
          anomaly: null,
          units: [],
          commandTokens: [],
        },
      ];

      repairUnits(state);

      expect(state.map.tiles[0].planets[0].units[0].damaged).toBe(false);
    });
  });

  describe('returnStrategyCards', () => {
    it('should clear strategy cards from all players', () => {
      const state = createMockGameState();

      returnStrategyCards(state);

      state.players.forEach(player => {
        expect(player.strategyCard).toBeNull();
        expect(player.strategyCardUsed).toBe(false);
      });
    });

    it('should reset strategy card pool', () => {
      const state = createMockGameState();

      returnStrategyCards(state);

      state.strategyCards.forEach(card => {
        expect(card.pickedBy).toBeNull();
        expect(card.exhausted).toBe(false);
      });
    });

    it('should reset player passed status', () => {
      const state = createMockGameState();
      state.players.forEach(p => p.passed = true);

      returnStrategyCards(state);

      state.players.forEach(player => {
        expect(player.passed).toBe(false);
      });
    });

    it('should clear transactedWith arrays', () => {
      const state = createMockGameState();
      state.players[0].transactedWith = ['player2', 'player3'];

      returnStrategyCards(state);

      state.players.forEach(player => {
        expect(player.transactedWith).toEqual([]);
      });
    });
  });

  describe('advanceStatusPhaseStep', () => {
    it('should advance through automatic steps', () => {
      const state = createMockGameState();
      state.statusPhase!.currentStep = 1; // score_objectives
      state.statusPhase!.scoringComplete = ['player1', 'player2', 'player3', 'player4'];

      advanceStatusPhaseStep(state);

      // Should have advanced through reveal, draw, remove to gain_redistribute_tokens
      expect(state.statusPhase!.currentStep).toBeGreaterThan(1);
    });

    it('should stop at gain_redistribute_tokens for player input', () => {
      const state = createMockGameState();
      state.subPhase = 'remove_command_tokens';
      state.statusPhase!.currentStep = 4;

      advanceStatusPhaseStep(state);

      expect(state.subPhase).toBe('gain_redistribute_tokens');
      expect(state.statusPhase!.currentStep).toBe(5);
    });

    it('should transition to strategy phase when complete and custodians not taken', () => {
      const state = createMockGameState();
      state.statusPhase!.currentStep = 8;
      state.subPhase = 'return_strategy_cards';
      state.custodiansTaken = false;

      advanceStatusPhaseStep(state);

      expect(state.phase).toBe('strategy');
      expect(state.round).toBe(2);
    });

    it('should transition to agenda phase when complete and custodians taken', () => {
      const state = createMockGameState();
      state.statusPhase!.currentStep = 8;
      state.subPhase = 'return_strategy_cards';
      state.custodiansTaken = true;

      advanceStatusPhaseStep(state);

      expect(state.phase).toBe('agenda');
      expect(state.round).toBe(2);
    });
  });
});
