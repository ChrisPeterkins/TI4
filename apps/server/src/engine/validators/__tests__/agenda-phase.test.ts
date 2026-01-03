import { describe, it, expect, vi } from 'vitest';
import {
  validateRevealAgenda,
  validateCastVote,
  validateSpeakerTiebreak,
} from '../agenda-phase.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  HexCoord,
  RevealAgendaAction,
  CastVoteAction,
  SpeakerTiebreakAction,
} from '@ti4/shared';

// Mock the agenda utility functions
vi.mock('../../utils/agenda.js', () => ({
  getValidOutcomes: vi.fn((state, electionType) => {
    if (electionType === 'for_against') {
      return ['for', 'against'];
    } else if (electionType === 'player') {
      return state.players.map((p: any) => p.id);
    } else if (electionType === 'planet') {
      return ['mecatol_rex', 'jord', 'abyz'];
    }
    return [];
  }),
  tallyVotes: vi.fn((votes) => {
    const tallies: Record<string, number> = {};
    for (const [outcome, count] of Object.entries(votes)) {
      tallies[outcome] = count as number;
    }
    return tallies;
  }),
  determineWinner: vi.fn((tallies) => {
    const entries = Object.entries(tallies);
    if (entries.length === 0) {
      return { winner: null, tied: [] };
    }
    const maxVotes = Math.max(...entries.map(([, v]) => v as number));
    const tied = entries.filter(([, v]) => v === maxVotes).map(([k]) => k);
    if (tied.length > 1) {
      return { winner: null, tied };
    }
    return { winner: tied[0], tied: [] };
  }),
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
    resources: 10,
    influence: 5,
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    planets: [
      { planetId: 'jord', exhausted: false, attachments: [], resources: 4, influence: 2 },
      { planetId: 'mars', exhausted: false, attachments: [], resources: 2, influence: 3 },
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
    speaker: true,
    ...overrides,
  } as PlayerState;
}

function createMockTile(position: HexCoord, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId: 18,
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
    phase: 'agenda',
    subPhase: 'reveal_agenda',
    round: 2,
    turn: 1,
    activePlayerId: 'player1',
    speakerId: 'player1',
    version: 1,
    players: [
      createMockPlayer({ id: 'player1', speaker: true }),
      createMockPlayer({ id: 'player2', speaker: false }),
    ],
    map: {
      tiles: [createMockTile({ q: 0, r: 0 })],
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
    agendaDeck: ['agenda1', 'agenda2', 'agenda3'],
    agendaDiscard: [],
    relicDeck: [],
    strategyCardState: {},
    log: [],
    settings: {
      victoryPointLimit: 10,
      gameDuration: 'full',
      mapType: 'standard',
    },
    agendaPhase: {
      agendasResolved: 0,
      currentAgenda: null,
      currentElectionType: 'for_against',
      votingOrder: ['player2', 'player1'], // Left of speaker, then speaker
      currentVoterIndex: 0,
      votes: {},
      votingComplete: [],
    },
    ...overrides,
  } as GameState;
}

describe('Agenda Phase Validators', () => {
  describe('validateRevealAgenda', () => {
    it('should fail if not in agenda phase', () => {
      const state = createMockGameState({ phase: 'action' });
      const action: RevealAgendaAction = {
        type: 'reveal_agenda',
        playerId: 'player1',
      };

      const result = validateRevealAgenda(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in agenda phase');
    });

    it('should fail if not in reveal_agenda subphase', () => {
      const state = createMockGameState({ subPhase: 'voting' });
      const action: RevealAgendaAction = {
        type: 'reveal_agenda',
        playerId: 'player1',
      };

      const result = validateRevealAgenda(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in reveal agenda step');
    });

    it('should fail if non-speaker tries to reveal', () => {
      const state = createMockGameState({ speakerId: 'player1' });
      const action: RevealAgendaAction = {
        type: 'reveal_agenda',
        playerId: 'player2', // Not the speaker
      };

      const result = validateRevealAgenda(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only the speaker can reveal agendas');
    });

    it('should fail if no agendas remaining', () => {
      const state = createMockGameState({
        agendaDeck: [],
        agendaDiscard: [],
      });
      const action: RevealAgendaAction = {
        type: 'reveal_agenda',
        playerId: 'player1',
      };

      const result = validateRevealAgenda(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No agendas remaining in deck or discard');
    });

    it('should allow speaker to reveal with deck available', () => {
      const state = createMockGameState({
        speakerId: 'player1',
        agendaDeck: ['agenda1'],
      });
      const action: RevealAgendaAction = {
        type: 'reveal_agenda',
        playerId: 'player1',
      };

      const result = validateRevealAgenda(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow reveal if discard can be reshuffled', () => {
      const state = createMockGameState({
        speakerId: 'player1',
        agendaDeck: [],
        agendaDiscard: ['old_agenda'],
      });
      const action: RevealAgendaAction = {
        type: 'reveal_agenda',
        playerId: 'player1',
      };

      const result = validateRevealAgenda(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateCastVote', () => {
    it('should fail if not in agenda phase', () => {
      const state = createMockGameState({ phase: 'action', subPhase: 'voting' });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        outcome: 'for',
        votes: 3,
        exhaustedPlanets: ['jord'],
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in agenda phase');
    });

    it('should fail if not in voting subphase', () => {
      const state = createMockGameState({ subPhase: 'reveal_agenda' });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        outcome: 'for',
        votes: 3,
        exhaustedPlanets: ['jord'],
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in voting step');
    });

    it('should fail if agenda phase not initialized', () => {
      const state = createMockGameState({
        subPhase: 'voting',
        agendaPhase: undefined,
      });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        outcome: 'for',
        votes: 3,
        exhaustedPlanets: [],
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Agenda phase not initialized');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState({ subPhase: 'voting' });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'nonexistent',
        outcome: 'for',
        votes: 3,
        exhaustedPlanets: [],
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if not player turn to vote', () => {
      const state = createMockGameState({
        subPhase: 'voting',
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 0, // player2's turn
          votes: {},
          votingComplete: [],
        },
      });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player1', // Not player2
        outcome: 'for',
        votes: 3,
        exhaustedPlanets: [],
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not your turn to vote');
    });

    it('should fail if player already voted', () => {
      const state = createMockGameState({
        subPhase: 'voting',
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 0,
          votes: { for: 3 },
          votingComplete: ['player2'], // Already voted
        },
      });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        outcome: 'for',
        votes: 3,
        exhaustedPlanets: [],
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Already voted on this agenda');
    });

    it('should fail if invalid outcome for election type', () => {
      const state = createMockGameState({
        subPhase: 'voting',
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 0,
          votes: {},
          votingComplete: [],
        },
      });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        outcome: 'player1', // Invalid for for_against
        votes: 3,
        exhaustedPlanets: [],
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid outcome');
    });

    it('should fail if player does not control exhausted planet', () => {
      const state = createMockGameState({
        subPhase: 'voting',
        players: [
          createMockPlayer({ id: 'player1' }),
          createMockPlayer({ id: 'player2', planets: [] }), // No planets
        ],
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 0,
          votes: {},
          votingComplete: [],
        },
      });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        outcome: 'for',
        votes: 3,
        exhaustedPlanets: ['jord'], // Does not control
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('do not control planet');
    });

    it('should fail if planet is already exhausted', () => {
      const state = createMockGameState({
        subPhase: 'voting',
        players: [
          createMockPlayer({ id: 'player1' }),
          createMockPlayer({
            id: 'player2',
            planets: [{ planetId: 'jord', exhausted: true, attachments: [] }],
          }),
        ],
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 0,
          votes: {},
          votingComplete: [],
        },
      });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        outcome: 'for',
        votes: 3,
        exhaustedPlanets: ['jord'],
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('already exhausted');
    });

    it('should allow valid vote for for_against', () => {
      const state = createMockGameState({
        subPhase: 'voting',
        players: [
          createMockPlayer({ id: 'player1' }),
          createMockPlayer({
            id: 'player2',
            planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
          }),
        ],
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 0,
          votes: {},
          votingComplete: [],
        },
      });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        outcome: 'for',
        votes: 3,
        exhaustedPlanets: ['jord'],
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow abstaining', () => {
      const state = createMockGameState({
        subPhase: 'voting',
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 0,
          votes: {},
          votingComplete: [],
        },
      });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        outcome: '',
        votes: 0,
        exhaustedPlanets: [],
        abstain: true,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow voting for player in elect player', () => {
      const state = createMockGameState({
        subPhase: 'voting',
        players: [
          createMockPlayer({ id: 'player1' }),
          createMockPlayer({
            id: 'player2',
            planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
          }),
        ],
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'player',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 0,
          votes: {},
          votingComplete: [],
        },
      });
      const action: CastVoteAction = {
        type: 'cast_vote',
        playerId: 'player2',
        outcome: 'player1', // Voting for player1
        votes: 2,
        exhaustedPlanets: ['jord'],
        abstain: false,
      };

      const result = validateCastVote(state, action);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateSpeakerTiebreak', () => {
    it('should fail if not in agenda phase', () => {
      const state = createMockGameState({ phase: 'action', subPhase: 'speaker_tiebreak' });
      const action: SpeakerTiebreakAction = {
        type: 'speaker_tiebreak',
        playerId: 'player1',
        chosenOutcome: 'for',
      };

      const result = validateSpeakerTiebreak(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in agenda phase');
    });

    it('should fail if not in speaker_tiebreak subphase', () => {
      const state = createMockGameState({ subPhase: 'voting' });
      const action: SpeakerTiebreakAction = {
        type: 'speaker_tiebreak',
        playerId: 'player1',
        chosenOutcome: 'for',
      };

      const result = validateSpeakerTiebreak(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in tiebreak step');
    });

    it('should fail if agenda phase not initialized', () => {
      const state = createMockGameState({
        subPhase: 'speaker_tiebreak',
        agendaPhase: undefined,
      });
      const action: SpeakerTiebreakAction = {
        type: 'speaker_tiebreak',
        playerId: 'player1',
        chosenOutcome: 'for',
      };

      const result = validateSpeakerTiebreak(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Agenda phase not initialized');
    });

    it('should fail if non-speaker tries to break tie', () => {
      const state = createMockGameState({
        subPhase: 'speaker_tiebreak',
        speakerId: 'player1',
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 2,
          votes: { for: 3, against: 3 }, // Tied
          votingComplete: ['player1', 'player2'],
        },
      });
      const action: SpeakerTiebreakAction = {
        type: 'speaker_tiebreak',
        playerId: 'player2', // Not speaker
        chosenOutcome: 'for',
      };

      const result = validateSpeakerTiebreak(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only the speaker can break ties');
    });

    it('should fail if there is no tie', () => {
      const state = createMockGameState({
        subPhase: 'speaker_tiebreak',
        speakerId: 'player1',
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 2,
          votes: { for: 5, against: 2 }, // Not tied
          votingComplete: ['player1', 'player2'],
        },
      });
      const action: SpeakerTiebreakAction = {
        type: 'speaker_tiebreak',
        playerId: 'player1',
        chosenOutcome: 'for',
      };

      const result = validateSpeakerTiebreak(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('There is no tie to break');
    });

    it('should fail if chosen outcome was not tied', () => {
      const state = createMockGameState({
        subPhase: 'speaker_tiebreak',
        speakerId: 'player1',
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'player',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 2,
          votes: { player1: 3, player2: 3, player3: 1 }, // player1 and player2 tied
          votingComplete: ['player1', 'player2'],
        },
      });
      const action: SpeakerTiebreakAction = {
        type: 'speaker_tiebreak',
        playerId: 'player1',
        chosenOutcome: 'player3', // Not one of the tied outcomes
      };

      const result = validateSpeakerTiebreak(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('was not one of the tied outcomes');
    });

    it('should allow speaker to break tie with valid outcome', () => {
      const state = createMockGameState({
        subPhase: 'speaker_tiebreak',
        speakerId: 'player1',
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 2,
          votes: { for: 3, against: 3 }, // Tied
          votingComplete: ['player1', 'player2'],
        },
      });
      const action: SpeakerTiebreakAction = {
        type: 'speaker_tiebreak',
        playerId: 'player1',
        chosenOutcome: 'for',
      };

      const result = validateSpeakerTiebreak(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow choosing any tied outcome', () => {
      const state = createMockGameState({
        subPhase: 'speaker_tiebreak',
        speakerId: 'player1',
        agendaPhase: {
          agendasResolved: 0,
          currentAgenda: 'test_agenda',
          currentElectionType: 'for_against',
          votingOrder: ['player2', 'player1'],
          currentVoterIndex: 2,
          votes: { for: 3, against: 3 }, // Tied
          votingComplete: ['player1', 'player2'],
        },
      });
      const action: SpeakerTiebreakAction = {
        type: 'speaker_tiebreak',
        playerId: 'player1',
        chosenOutcome: 'against', // Other tied option
      };

      const result = validateSpeakerTiebreak(state, action);

      expect(result.valid).toBe(true);
    });
  });
});
