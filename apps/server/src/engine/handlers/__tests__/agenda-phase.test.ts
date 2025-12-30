import { describe, it, expect } from 'vitest';
import {
  initializeAgendaPhase,
  handleRevealAgenda,
  handleCastVote,
  handleSpeakerTiebreak,
} from '../agenda-phase.js';
import type {
  GameState,
  PlayerState,
  CastVoteAction,
  SpeakerTiebreakAction,
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
      planets: [
        { planetId: `planet_${i + 1}_a`, exhausted: false, attachments: [] },
        { planetId: `planet_${i + 1}_b`, exhausted: false, attachments: [] },
      ],
    }));
  }

  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'agenda',
    subPhase: 'reveal_agenda',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: players.map(p => p.id),
    players,
    map: {
      tiles: [],
      playerCount,
    },
    strategyCards: [],
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
    agendaDeck: ['anti_intellectual_revolution', 'classified_document_leaks', 'committee_formation'],
    agendaDiscard: [],
    laws: [],
    custodiansTaken: true,
    activeCombat: null,
    timingWindows: [],
    winner: null,
  };
}

describe('Agenda Phase Handlers', () => {
  describe('initializeAgendaPhase', () => {
    it('should set phase to agenda and subPhase to reveal_agenda', () => {
      const state = createMockGameState();
      state.phase = 'status'; // Start from status phase

      initializeAgendaPhase(state);

      expect(state.phase).toBe('agenda');
      expect(state.subPhase).toBe('reveal_agenda');
    });

    it('should set speaker as active player', () => {
      const state = createMockGameState();
      state.speakerId = 'player2';

      initializeAgendaPhase(state);

      expect(state.activePlayerId).toBe('player2');
    });

    it('should calculate voting order starting from left of speaker', () => {
      const state = createMockGameState();
      state.speakerId = 'player1'; // Speaker is first player (seat 0)

      initializeAgendaPhase(state);

      // Voting order should be: player2, player3, player4, player1 (speaker last)
      expect(state.agendaPhase!.votingOrder).toEqual([
        'player2', 'player3', 'player4', 'player1'
      ]);
    });

    it('should initialize agenda phase tracking with empty state', () => {
      const state = createMockGameState();

      initializeAgendaPhase(state);

      expect(state.agendaPhase).toBeDefined();
      expect(state.agendaPhase!.agendaNumber).toBe(1);
      expect(state.agendaPhase!.currentAgendaId).toBeNull();
      expect(state.agendaPhase!.votes).toEqual({});
      expect(state.agendaPhase!.voteTallies).toEqual({});
      expect(state.agendaPhase!.votingComplete).toEqual([]);
    });
  });

  describe('handleRevealAgenda', () => {
    it('should draw agenda from deck and set as current', () => {
      const state = createMockGameState();
      initializeAgendaPhase(state);
      const deckSize = state.agendaDeck.length;

      const result = handleRevealAgenda(state, 'player1');

      expect(result.success).toBe(true);
      expect(state.agendaDeck.length).toBe(deckSize - 1);
      expect(state.agendaPhase!.currentAgendaId).toBe('anti_intellectual_revolution');
    });

    it('should advance to voting step after reveal', () => {
      const state = createMockGameState();
      initializeAgendaPhase(state);

      handleRevealAgenda(state, 'player1');

      expect(state.agendaPhase!.currentStep).toBe('voting');
      expect(state.subPhase).toBe('voting');
    });

    it('should set first voter as active player', () => {
      const state = createMockGameState();
      state.speakerId = 'player1';
      initializeAgendaPhase(state);

      handleRevealAgenda(state, 'player1');

      // First voter is player2 (left of speaker)
      expect(state.activePlayerId).toBe('player2');
    });
  });

  describe('handleCastVote', () => {
    it('should record vote with specified outcome', () => {
      const state = createMockGameState();
      initializeAgendaPhase(state);
      handleRevealAgenda(state, 'player1');

      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        timestamp: Date.now(),
        outcome: 'for',
        exhaustedPlanets: [],
      };

      const result = handleCastVote(state, action);

      expect(result.success).toBe(true);
      expect(state.agendaPhase!.votes['player2']).toBeDefined();
      expect(state.agendaPhase!.votes['player2'].outcome).toBe('for');
    });

    it('should allow abstaining', () => {
      const state = createMockGameState();
      initializeAgendaPhase(state);
      handleRevealAgenda(state, 'player1');

      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        timestamp: Date.now(),
        outcome: '',
        exhaustedPlanets: [],
        abstain: true,
      };

      const result = handleCastVote(state, action);

      expect(result.success).toBe(true);
      expect(state.agendaPhase!.votes['player2'].abstained).toBe(true);
    });

    it('should advance to next voter after casting vote', () => {
      const state = createMockGameState();
      initializeAgendaPhase(state);
      handleRevealAgenda(state, 'player1');

      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        timestamp: Date.now(),
        outcome: 'for',
        exhaustedPlanets: [],
      };

      handleCastVote(state, action);

      // Should advance to player3
      expect(state.activePlayerId).toBe('player3');
      expect(state.agendaPhase!.currentVoterIndex).toBe(1);
    });
  });

  describe('handleSpeakerTiebreak', () => {
    it('should advance to next agenda after resolving tiebreak', () => {
      const state = createMockGameState();
      initializeAgendaPhase(state);
      handleRevealAgenda(state, 'player1');

      // Set up a tie scenario with correct structure
      state.agendaPhase!.votes = {
        'player2': { outcome: 'for', votes: 2, extraVotes: 0, abstained: false, exhaustedPlanets: [] },
        'player3': { outcome: 'against', votes: 2, extraVotes: 0, abstained: false, exhaustedPlanets: [] },
        'player4': { outcome: '', votes: 0, extraVotes: 0, abstained: true, exhaustedPlanets: [] },
        'player1': { outcome: '', votes: 0, extraVotes: 0, abstained: true, exhaustedPlanets: [] },
      };
      state.agendaPhase!.voteTallies = { 'for': 2, 'against': 2 };
      state.agendaPhase!.votingComplete = ['player2', 'player3', 'player4', 'player1'];
      state.agendaPhase!.currentStep = 'speaker_tiebreak';
      state.subPhase = 'speaker_tiebreak';
      state.activePlayerId = state.speakerId;

      const action: SpeakerTiebreakAction = {
        type: 'speaker_tiebreak',
        playerId: 'player1',
        timestamp: Date.now(),
        chosenOutcome: 'for',
      };

      const result = handleSpeakerTiebreak(state, action);

      expect(result.success).toBe(true);
      // After tiebreak, the phase advances to agenda 2
      expect(state.agendaPhase!.agendaNumber).toBe(2);
      expect(state.agendaPhase!.currentStep).toBe('reveal_agenda');
      // The law was added since 'for' won
      expect(state.laws.length).toBe(1);
      expect(state.laws[0].electedOutcome).toBe('for');
    });
  });

  describe('voting order', () => {
    it('should have speaker vote last', () => {
      const state = createMockGameState();
      state.speakerId = 'player3';

      initializeAgendaPhase(state);

      const votingOrder = state.agendaPhase!.votingOrder;
      expect(votingOrder[votingOrder.length - 1]).toBe('player3');
    });

    it('should start voting from left of speaker (clockwise)', () => {
      const state = createMockGameState();
      state.speakerId = 'player2'; // Seat index 1

      initializeAgendaPhase(state);

      // Player 3 (seat 2) should vote first, then 4, then 1, then speaker (2)
      expect(state.agendaPhase!.votingOrder[0]).toBe('player3');
    });
  });
});
