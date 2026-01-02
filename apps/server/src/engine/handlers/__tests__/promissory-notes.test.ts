import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handlePlayPromissoryNote,
  returnPromissoryNoteFromPlay,
  hasNoteInPlay,
  getNoteOriginalOwner,
} from '../promissory-notes.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  HexCoord,
  PlayPromissoryNoteAction,
} from '@ti4/shared';

// Mock the @ti4/shared promissory note functions
vi.mock('@ti4/shared', async () => {
  const actual = await vi.importActual('@ti4/shared');
  return {
    ...actual,
    getPromissoryNoteById: vi.fn((noteId: string) => {
      const notes: Record<string, { id: string; name: string; playTiming: string }> = {
        'support_for_the_throne_blue': { id: 'support_for_the_throne_blue', name: 'Support for the Throne', playTiming: 'immediate' },
        'ceasefire_blue': { id: 'ceasefire_blue', name: 'Ceasefire', playTiming: 'after_activation' },
        'trade_agreement_blue': { id: 'trade_agreement_blue', name: 'Trade Agreement', playTiming: 'when_replenish' },
        'political_secret_blue': { id: 'political_secret_blue', name: 'Political Secret', playTiming: 'when_agenda_revealed' },
        'alliance_blue': { id: 'alliance_blue', name: 'Alliance', playTiming: 'immediate' },
        'war_funding_red': { id: 'war_funding_red', name: 'War Funding', playTiming: 'start_of_combat_round' },
        'fires_of_the_gashlai_red': { id: 'fires_of_the_gashlai_red', name: 'Fires of the Gashlai', playTiming: 'action' },
        'spy_net_green': { id: 'spy_net_green', name: 'Spy Net', playTiming: 'action' },
        'stymie_purple': { id: 'stymie_purple', name: 'Stymie', playTiming: 'action' },
        'research_agreement_yellow': { id: 'research_agreement_yellow', name: 'Research Agreement', playTiming: 'after_tech_research' },
        'military_support_blue': { id: 'military_support_blue', name: 'Military Support', playTiming: 'start_of_turn' },
        'raghs_call_orange': { id: 'raghs_call_orange', name: "Ragh's Call", playTiming: 'after_commit_ground' },
        'political_favor_yellow': { id: 'political_favor_yellow', name: 'Political Favor', playTiming: 'when_agenda_revealed' },
        'cybernetic_enhancements_blue': { id: 'cybernetic_enhancements_blue', name: 'Cybernetic Enhancements', playTiming: 'start_of_ground_combat' },
      };
      return notes[noteId] || null;
    }),
    getBaseNoteId: vi.fn((noteId: string) => {
      // Strip color suffix to get base ID
      return noteId.replace(/_(?:blue|red|green|yellow|purple|orange|black|pink)$/, '');
    }),
    noteStaysInPlay: vi.fn((noteId: string) => {
      const baseId = noteId.replace(/_(?:blue|red|green|yellow|purple|orange|black|pink)$/, '');
      // Notes that stay in play area after being played
      return ['support_for_the_throne', 'alliance', 'stymie', 'trade_convoys', 'promise_of_protection', 'antivirus'].includes(baseId);
    }),
  };
});

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
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    promissoryNotesOwned: [],
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
    score: 0,
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
    players: [
      createMockPlayer({
        id: 'player1',
        color: 'blue',
        promissoryNotesOwned: ['support_for_the_throne_blue', 'ceasefire_blue', 'trade_agreement_blue', 'political_secret_blue', 'alliance_blue'],
      }),
      createMockPlayer({
        id: 'player2',
        color: 'red',
        promissoryNotesOwned: ['support_for_the_throne_red', 'ceasefire_red', 'war_funding_red'],
      }),
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
    agendaDeck: [],
    relicDeck: [],
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

describe('Promissory Note Handlers', () => {
  describe('handlePlayPromissoryNote', () => {
    describe('common validations', () => {
      it('should fail if player not found', () => {
        const state = createMockGameState();
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'nonexistent',
          noteId: 'support_for_the_throne_blue',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Player not found');
      });

      it('should fail if promissory note not found in database', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['unknown_note'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'unknown_note',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      });

      it('should fail if note is not in player hand', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              promissoryNotesInHand: [], // Empty hand
              promissoryNotesOwned: [],
            }),
            createMockPlayer({
              id: 'player2',
              promissoryNotesOwned: ['support_for_the_throne_blue'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'support_for_the_throne_blue',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Promissory note not in hand');
      });

      it('should fail if original owner cannot be found', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['fires_of_the_gashlai_red'],
              promissoryNotesOwned: [], // No owner info
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'fires_of_the_gashlai_red',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Could not find original owner of note');
      });
    });

    describe('timing validation', () => {
      it('should fail ACTION notes when not in action phase', () => {
        const state = createMockGameState({
          phase: 'strategy',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['fires_of_the_gashlai_red'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'red',
              promissoryNotesOwned: ['fires_of_the_gashlai_red'],
              commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'fires_of_the_gashlai_red',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('action phase');
      });

      it('should fail ACTION notes when not awaiting_action subphase', () => {
        const state = createMockGameState({
          phase: 'action',
          subPhase: 'tactical_movement',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['fires_of_the_gashlai_red'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'red',
              promissoryNotesOwned: ['fires_of_the_gashlai_red'],
              commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'fires_of_the_gashlai_red',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('another action');
      });

      it('should fail ACTION notes when not player turn', () => {
        const state = createMockGameState({
          phase: 'action',
          subPhase: 'awaiting_action',
          activePlayerId: 'player2', // Not player1's turn
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['fires_of_the_gashlai_red'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'red',
              promissoryNotesOwned: ['fires_of_the_gashlai_red'],
              commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'fires_of_the_gashlai_red',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('your turn');
      });

      it('should reject immediate play notes through this handler', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['support_for_the_throne_blue'],
            }),
            createMockPlayer({
              id: 'player2',
              promissoryNotesOwned: ['support_for_the_throne_blue'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'support_for_the_throne_blue',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('transactions');
      });

      it('should allow start_of_turn notes at start of player turn', () => {
        const state = createMockGameState({
          phase: 'action',
          subPhase: 'awaiting_action',
          activePlayerId: 'player1',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['military_support_blue'],
            }),
            createMockPlayer({
              id: 'player2',
              promissoryNotesOwned: ['military_support_blue'],
              commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'military_support_blue',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(true);
      });

      it('should fail start_of_combat_round when no active combat', () => {
        const state = createMockGameState({
          activeCombat: undefined,
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['war_funding_red'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'red',
              promissoryNotesOwned: ['war_funding_red'],
              tradeGoods: 5,
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'war_funding_red',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('No active combat');
      });

      it('should allow when_agenda_revealed during agenda phase', () => {
        const state = createMockGameState({
          phase: 'agenda',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['political_secret_blue'],
            }),
            createMockPlayer({
              id: 'player2',
              promissoryNotesOwned: ['political_secret_blue'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'political_secret_blue',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(true);
      });

      it('should fail when_agenda_revealed when not in agenda phase', () => {
        const state = createMockGameState({
          phase: 'action',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['political_secret_blue'],
            }),
            createMockPlayer({
              id: 'player2',
              promissoryNotesOwned: ['political_secret_blue'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'political_secret_blue',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('when agenda is revealed');
      });

      it('should fail start_of_ground_combat when not in ground combat', () => {
        const state = createMockGameState({
          activeCombat: {
            type: 'space',
            roundNumber: 1,
            state: 'combat_round_roll',
          } as any,
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['cybernetic_enhancements_blue'],
            }),
            createMockPlayer({
              id: 'player2',
              promissoryNotesOwned: ['cybernetic_enhancements_blue'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'cybernetic_enhancements_blue',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('ground combat');
      });
    });

    describe('note effects', () => {
      it('should execute Fires of the Gashlai - remove fleet token and gain War Sun', () => {
        const state = createMockGameState({
          phase: 'action',
          subPhase: 'awaiting_action',
          activePlayerId: 'player1',
          players: [
            createMockPlayer({
              technologies: [],
              promissoryNotesInHand: ['fires_of_the_gashlai_red'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'red',
              promissoryNotesOwned: ['fires_of_the_gashlai_red'],
              commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'fires_of_the_gashlai_red',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(true);
        expect(state.players[0].technologies).toContain('war_sun_2');
        expect(state.players[1].commandTokens.fleet).toBe(2); // Reduced by 1
      });

      it('should fail Fires of the Gashlai when Muaat has no fleet tokens', () => {
        const state = createMockGameState({
          phase: 'action',
          subPhase: 'awaiting_action',
          activePlayerId: 'player1',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['fires_of_the_gashlai_red'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'red',
              promissoryNotesOwned: ['fires_of_the_gashlai_red'],
              commandTokens: { tactics: 3, fleet: 0, strategy: 2 },
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'fires_of_the_gashlai_red',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('no fleet tokens');
      });

      it('should execute Spy Net - take action card from Yssaril', () => {
        const state = createMockGameState({
          phase: 'action',
          subPhase: 'awaiting_action',
          activePlayerId: 'player1',
          players: [
            createMockPlayer({
              actionCards: [],
              promissoryNotesInHand: ['spy_net_green'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'green',
              faction: 'yssaril',
              promissoryNotesOwned: ['spy_net_green'],
              actionCards: ['sabotage', 'direct_hit', 'flank_speed'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'spy_net_green',
          targetCardId: 'sabotage',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(true);
        expect(state.players[0].actionCards).toContain('sabotage');
        expect(state.players[1].actionCards).not.toContain('sabotage');
      });

      it('should fail Spy Net without target card specified', () => {
        const state = createMockGameState({
          phase: 'action',
          subPhase: 'awaiting_action',
          activePlayerId: 'player1',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['spy_net_green'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'green',
              promissoryNotesOwned: ['spy_net_green'],
              actionCards: ['sabotage'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'spy_net_green',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Must specify action card');
      });

      it('should fail Spy Net if Yssaril does not have the specified card', () => {
        const state = createMockGameState({
          phase: 'action',
          subPhase: 'awaiting_action',
          activePlayerId: 'player1',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['spy_net_green'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'green',
              promissoryNotesOwned: ['spy_net_green'],
              actionCards: ['direct_hit'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'spy_net_green',
          targetCardId: 'sabotage',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('not in Yssaril hand');
      });

      it('should execute War Funding - Letnev loses 2 trade goods', () => {
        const state = createMockGameState({
          activeCombat: {
            type: 'space',
            roundNumber: 1,
            state: 'combat_round_roll',
          } as any,
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['war_funding_red'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'red',
              faction: 'letnev',
              promissoryNotesOwned: ['war_funding_red'],
              tradeGoods: 5,
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'war_funding_red',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(true);
        expect(state.players[1].tradeGoods).toBe(3);
      });

      it('should fail War Funding if Letnev has less than 2 trade goods', () => {
        const state = createMockGameState({
          activeCombat: {
            type: 'space',
            roundNumber: 1,
            state: 'combat_round_roll',
          } as any,
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['war_funding_red'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'red',
              promissoryNotesOwned: ['war_funding_red'],
              tradeGoods: 1,
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'war_funding_red',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('does not have 2 trade goods');
      });

      it('should execute Political Favor - Xxcha loses strategy token', () => {
        const state = createMockGameState({
          phase: 'agenda',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['political_favor_yellow'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'yellow',
              faction: 'xxcha',
              promissoryNotesOwned: ['political_favor_yellow'],
              commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'political_favor_yellow',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(true);
        expect(state.players[1].commandTokens.strategy).toBe(1);
      });

      it('should fail Political Favor if Xxcha has no strategy tokens', () => {
        const state = createMockGameState({
          phase: 'agenda',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['political_favor_yellow'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'yellow',
              promissoryNotesOwned: ['political_favor_yellow'],
              commandTokens: { tactics: 3, fleet: 3, strategy: 0 },
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'political_favor_yellow',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('no strategy tokens');
      });
    });

    describe('note placement after play', () => {
      it('should place note that stays in play in player play area', () => {
        const state = createMockGameState({
          phase: 'action',
          subPhase: 'awaiting_action',
          activePlayerId: 'player1',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['stymie_purple'],
              promissoryNotesInPlay: [],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'purple',
              faction: 'arborec',
              promissoryNotesOwned: ['stymie_purple'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'stymie_purple',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(true);
        expect(result.data?.staysInPlay).toBe(true);
        expect(state.players[0].promissoryNotesInPlay).toHaveLength(1);
        expect(state.players[0].promissoryNotesInPlay[0].noteId).toBe('stymie_purple');
        expect(state.players[0].promissoryNotesInPlay[0].originalOwnerId).toBe('player2');
        expect(state.players[0].promissoryNotesInHand).not.toContain('stymie_purple');
      });

      it('should return note to original owner hand if it does not stay in play', () => {
        const state = createMockGameState({
          phase: 'action',
          subPhase: 'awaiting_action',
          activePlayerId: 'player1',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['fires_of_the_gashlai_red'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'red',
              promissoryNotesOwned: ['fires_of_the_gashlai_red'],
              promissoryNotesInHand: [],
              commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'fires_of_the_gashlai_red',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.success).toBe(true);
        expect(result.data?.staysInPlay).toBe(false);
        // Note returned to original owner
        expect(state.players[1].promissoryNotesInHand).toContain('fires_of_the_gashlai_red');
        // Removed from player's hand
        expect(state.players[0].promissoryNotesInHand).not.toContain('fires_of_the_gashlai_red');
      });

      it('should increment game version after successful play', () => {
        const state = createMockGameState({
          version: 5,
          phase: 'action',
          subPhase: 'awaiting_action',
          activePlayerId: 'player1',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['stymie_purple'],
            }),
            createMockPlayer({
              id: 'player2',
              color: 'purple',
              promissoryNotesOwned: ['stymie_purple'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'stymie_purple',
        };

        handlePlayPromissoryNote(state, action);

        expect(state.version).toBe(6);
      });

      it('should trigger promissory_note_played event', () => {
        const state = createMockGameState({
          phase: 'agenda',
          players: [
            createMockPlayer({
              promissoryNotesInHand: ['political_secret_blue'],
            }),
            createMockPlayer({
              id: 'player2',
              promissoryNotesOwned: ['political_secret_blue'],
            }),
          ],
        });
        const action: PlayPromissoryNoteAction = {
          type: 'play_promissory_note',
          playerId: 'player1',
          noteId: 'political_secret_blue',
        };

        const result = handlePlayPromissoryNote(state, action);

        expect(result.triggeredEvents).toContain('promissory_note_played');
      });
    });
  });

  describe('returnPromissoryNoteFromPlay', () => {
    it('should fail if holder not found', () => {
      const state = createMockGameState();

      const result = returnPromissoryNoteFromPlay(state, 'nonexistent', 'support_for_the_throne_blue', 'activation');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Holder not found');
    });

    it('should fail if note not found in play area', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            promissoryNotesInPlay: [],
          }),
        ],
      });

      const result = returnPromissoryNoteFromPlay(state, 'player1', 'support_for_the_throne_blue', 'activation');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Note not found in play area');
    });

    it('should return note from play area to original owner hand', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            promissoryNotesInPlay: [
              { noteId: 'stymie_purple', originalOwnerId: 'player2', receivedFrom: 'player2', placedRound: 1 },
            ],
          }),
          createMockPlayer({
            id: 'player2',
            color: 'purple',
            promissoryNotesOwned: ['stymie_purple'],
            promissoryNotesInHand: [],
          }),
        ],
      });

      const result = returnPromissoryNoteFromPlay(state, 'player1', 'stymie_purple', 'activation');

      expect(result.success).toBe(true);
      expect(state.players[0].promissoryNotesInPlay).toHaveLength(0);
      expect(state.players[1].promissoryNotesInHand).toContain('stymie_purple');
    });

    it('should decrement VP when returning Support for the Throne', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            promissoryNotesInPlay: [
              { noteId: 'support_for_the_throne_blue', originalOwnerId: 'player2', receivedFrom: 'player2', placedRound: 1 },
            ],
          }),
          createMockPlayer({
            id: 'player2',
            color: 'blue',
            promissoryNotesOwned: ['support_for_the_throne_blue'],
            promissoryNotesInHand: [],
            score: 3,
          }),
        ],
      });

      const result = returnPromissoryNoteFromPlay(state, 'player1', 'support_for_the_throne_blue', 'activation');

      expect(result.success).toBe(true);
      expect(state.players[1].score).toBe(2); // VP reduced by 1
    });

    it('should not reduce VP below 0', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            promissoryNotesInPlay: [
              { noteId: 'support_for_the_throne_blue', originalOwnerId: 'player2', receivedFrom: 'player2', placedRound: 1 },
            ],
          }),
          createMockPlayer({
            id: 'player2',
            color: 'blue',
            promissoryNotesOwned: ['support_for_the_throne_blue'],
            score: 0,
          }),
        ],
      });

      const result = returnPromissoryNoteFromPlay(state, 'player1', 'support_for_the_throne_blue', 'activation');

      expect(result.success).toBe(true);
      expect(state.players[1].score).toBe(0);
    });

    it('should trigger promissory_note_returned event', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            promissoryNotesInPlay: [
              { noteId: 'alliance_blue', originalOwnerId: 'player2', receivedFrom: 'player2', placedRound: 1 },
            ],
          }),
          createMockPlayer({
            id: 'player2',
            promissoryNotesOwned: ['alliance_blue'],
          }),
        ],
      });

      const result = returnPromissoryNoteFromPlay(state, 'player1', 'alliance_blue', 'resolved');

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('promissory_note_returned');
      expect(result.data?.reason).toBe('resolved');
    });

    it('should increment game version', () => {
      const state = createMockGameState({
        version: 10,
        players: [
          createMockPlayer({
            promissoryNotesInPlay: [
              { noteId: 'stymie_purple', originalOwnerId: 'player2', receivedFrom: 'player2', placedRound: 1 },
            ],
          }),
          createMockPlayer({
            id: 'player2',
            promissoryNotesOwned: ['stymie_purple'],
          }),
        ],
      });

      returnPromissoryNoteFromPlay(state, 'player1', 'stymie_purple', 'elimination');

      expect(state.version).toBe(11);
    });
  });

  describe('hasNoteInPlay', () => {
    it('should return true if player has note in play', () => {
      const player = createMockPlayer({
        promissoryNotesInPlay: [
          { noteId: 'stymie_purple', originalOwnerId: 'player2', receivedFrom: 'player2', placedRound: 1 },
        ],
      });

      expect(hasNoteInPlay(player, 'stymie')).toBe(true);
    });

    it('should return false if player does not have note in play', () => {
      const player = createMockPlayer({
        promissoryNotesInPlay: [],
      });

      expect(hasNoteInPlay(player, 'stymie')).toBe(false);
    });

    it('should match by base note ID (ignoring color)', () => {
      const player = createMockPlayer({
        promissoryNotesInPlay: [
          { noteId: 'support_for_the_throne_blue', originalOwnerId: 'player2', receivedFrom: 'player2', placedRound: 1 },
        ],
      });

      expect(hasNoteInPlay(player, 'support_for_the_throne')).toBe(true);
    });
  });

  describe('getNoteOriginalOwner', () => {
    it('should return original owner ID if note in play', () => {
      const player = createMockPlayer({
        promissoryNotesInPlay: [
          { noteId: 'alliance_blue', originalOwnerId: 'player2', receivedFrom: 'player2', placedRound: 1 },
        ],
      });

      expect(getNoteOriginalOwner(player, 'alliance')).toBe('player2');
    });

    it('should return null if note not in play', () => {
      const player = createMockPlayer({
        promissoryNotesInPlay: [],
      });

      expect(getNoteOriginalOwner(player, 'alliance')).toBeNull();
    });

    it('should match by base note ID', () => {
      const player = createMockPlayer({
        promissoryNotesInPlay: [
          { noteId: 'stymie_purple', originalOwnerId: 'arborec_player', receivedFrom: 'arborec_player', placedRound: 1 },
        ],
      });

      expect(getNoteOriginalOwner(player, 'stymie')).toBe('arborec_player');
    });
  });
});
