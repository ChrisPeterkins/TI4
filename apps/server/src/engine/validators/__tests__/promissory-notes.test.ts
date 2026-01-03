/**
 * Tests for promissory note validators
 *
 * TI4 Promissory Note Rules:
 * - Each player starts with 6 promissory notes (5 generic + 1 faction)
 * - Notes can be traded (max 1 per transaction)
 * - Notes can be played according to their timing text
 * - A player cannot play their own color's/faction's promissory notes
 * - Some notes require the original owner to pay costs
 * - Support for the Throne and Alliance must be played immediately when received
 * - Notes in play area cannot be further traded
 * - When returned, notes go back to original owner's hand
 *
 * Sources:
 * - https://twilight-imperium.fandom.com/wiki/Promissory_Notes
 * - https://www.tirules.com/R_promissory_notes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GameState, PlayerState, CombatInstance } from '@ti4/shared';
import { validatePlayPromissoryNote } from '../promissory-notes.js';

// Mock the shared imports
vi.mock('@ti4/shared', async () => {
  const actual = await vi.importActual('@ti4/shared');
  return {
    ...actual,
    getPromissoryNoteById: vi.fn((noteId: string) => {
      const notes: Record<string, { id: string; name: string; playTiming: string }> = {
        // Generic notes
        ceasefire_player1: { id: 'ceasefire_player1', name: 'Ceasefire', playTiming: 'after_activation' },
        ceasefire_player2: { id: 'ceasefire_player2', name: 'Ceasefire', playTiming: 'after_activation' },
        trade_agreement_player1: { id: 'trade_agreement_player1', name: 'Trade Agreement', playTiming: 'action' },
        support_for_throne_player1: {
          id: 'support_for_throne_player1',
          name: 'Support for the Throne',
          playTiming: 'immediate',
        },
        political_secret_player1: { id: 'political_secret_player1', name: 'Political Secret', playTiming: 'action' },

        // Faction notes
        war_funding_player1: { id: 'war_funding_player1', name: 'War Funding', playTiming: 'start_of_combat' },
        fires_of_the_gashlai_player1: {
          id: 'fires_of_the_gashlai_player1',
          name: 'Fires of the Gashlai',
          playTiming: 'action',
        },
        political_favor_player1: { id: 'political_favor_player1', name: 'Political Favor', playTiming: 'when_agenda_revealed' },
        military_support_player1: { id: 'military_support_player1', name: 'Military Support', playTiming: 'start_of_combat_round' },
        research_agreement_player1: { id: 'research_agreement_player1', name: 'Research Agreement', playTiming: 'action' },
        spy_net_player1: { id: 'spy_net_player1', name: 'Spy Net', playTiming: 'action' },
        raghs_call_player1: { id: 'raghs_call_player1', name: "Ragh's Call", playTiming: 'start_of_invasion' },

        // Notes with various timings
        test_action_note: { id: 'test_action_note', name: 'Test Action', playTiming: 'action' },
        test_combat_note: { id: 'test_combat_note', name: 'Test Combat', playTiming: 'start_of_combat' },
        test_ground_combat_note: { id: 'test_ground_combat_note', name: 'Test Ground', playTiming: 'start_of_ground_combat' },
        test_strategy_note: { id: 'test_strategy_note', name: 'Test Strategy', playTiming: 'end_of_strategy_phase' },
      };
      return notes[noteId] || null;
    }),
    getBaseNoteId: vi.fn((noteId: string) => {
      return noteId.replace(/_player\d+$/, '');
    }),
  };
});

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    faction: 'sol',
    color: 'blue',
    name: 'Test Player',
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    resources: 5,
    influence: 5,
    commodities: 2,
    maxCommodities: 4,
    tradeGoods: 3,
    technologies: [],
    planets: [],
    controlledSystems: [],
    victoryPoints: 0,
    secretObjectives: [],
    actionCards: ['sabotage', 'skilled_retreat'],
    promissoryNotes: [],
    promissoryNotesInHand: [],
    promissoryNotesOwned: [],
    promissoryNotesInPlay: [],
    scoredObjectives: [],
    scoredSecretObjectives: [],
    custodiansTaken: false,
    passed: false,
    speaker: false,
    strategyCard: null,
    strategyCardUsed: false,
    activatedSystems: [],
    unitUpgrades: {},
    leaders: {
      agent: { id: 'sol_agent', unlocked: true, exhausted: false },
      commander: { id: 'sol_commander', unlocked: false, exhausted: false },
      hero: { id: 'sol_hero', unlocked: false, purged: false },
    },
    relics: [],
    fragments: { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 },
    exhaustedPlanets: [],
    exhaustedTechs: [],
    exhaustedAgents: [],
    ...overrides,
  };
}

function createMockCombat(overrides: Partial<CombatInstance> = {}): CombatInstance {
  return {
    id: 'combat1',
    type: 'space',
    systemId: 'tile1',
    attackerId: 'player1',
    defenderId: 'player2',
    attackerUnits: [],
    defenderUnits: [],
    state: 'combat_round',
    roundNumber: 1,
    pendingHits: { attacker: 0, defender: 0 },
    temporaryModifiers: {},
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const player1 = createMockPlayer({
    id: 'player1',
    promissoryNotesOwned: [
      'ceasefire_player1',
      'trade_agreement_player1',
      'support_for_throne_player1',
      'political_secret_player1',
    ],
  });
  const player2 = createMockPlayer({
    id: 'player2',
    faction: 'letnev',
    promissoryNotesOwned: ['war_funding_player2', 'ceasefire_player2'],
    promissoryNotesInHand: ['ceasefire_player2'],
    tradeGoods: 5,
  });

  return {
    id: 'game1',
    name: 'Test Game',
    phase: 'action',
    subPhase: 'awaiting_action',
    round: 1,
    turn: 0,
    players: [player1, player2],
    map: { tiles: [] },
    objectives: { stage1: [], stage2: [], revealed: [], secret: [] },
    laws: [],
    activePlayerId: 'player1',
    speakerId: 'player1',
    activeCombat: null,
    agendaPhase: null,
    turnOrder: ['player1', 'player2'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    miltyDraft: null,
    actionDeck: [],
    actionDiscardPile: [],
    agendaDeck: [],
    agendaDiscardPile: [],
    stageTwoRevealed: false,
    ...overrides,
  };
}

describe('validatePlayPromissoryNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic validation', () => {
    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'nonexistent',
        noteId: 'trade_agreement_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if promissory note not found', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['nonexistent_note'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'nonexistent_note',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promissory note nonexistent_note not found');
    });

    it('should fail if note not in hand', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = []; // Empty hand

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'trade_agreement_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Promissory note not in hand');
    });

    it('should fail if original owner not found', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['orphan_note'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'test_action_note', // Has no owner
      };

      // Mock this note to be in hand
      state.players[0].promissoryNotesInHand = ['test_action_note'];

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Could not find original owner of note');
    });
  });

  describe('timing validation', () => {
    it('should fail if ACTION note played outside action phase', () => {
      const state = createMockGameState({ phase: 'strategy' });
      state.players[0].promissoryNotesInHand = ['trade_agreement_player1'];
      state.players[0].promissoryNotesOwned = ['trade_agreement_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'trade_agreement_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('ACTION notes can only be played during action phase');
    });

    it('should fail if ACTION note played during another action', () => {
      const state = createMockGameState({ subPhase: 'tactical_movement' });
      state.players[0].promissoryNotesInHand = ['trade_agreement_player1'];
      state.players[0].promissoryNotesOwned = ['trade_agreement_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'trade_agreement_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot play ACTION note during another action');
    });

    it('should fail if ACTION note played not on your turn', () => {
      const state = createMockGameState({ activePlayerId: 'player2' });
      state.players[0].promissoryNotesInHand = ['trade_agreement_player1'];
      state.players[0].promissoryNotesOwned = ['trade_agreement_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'trade_agreement_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only play ACTION notes on your turn');
    });

    it('should fail if IMMEDIATE note played directly', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['support_for_throne_player1'];
      state.players[0].promissoryNotesOwned = ['support_for_throne_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'support_for_throne_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Immediate play notes are handled during transactions');
    });

    it('should fail if start_of_combat note played without combat', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['war_funding_player1'];
      state.players[1].promissoryNotesOwned = ['war_funding_player1']; // Letnev's note

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'war_funding_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No active combat');
    });

    it('should allow start_of_combat note during combat', () => {
      const state = createMockGameState({ activeCombat: createMockCombat() });
      state.players[0].promissoryNotesInHand = ['war_funding_player1'];
      state.players[1].promissoryNotesOwned = ['war_funding_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'war_funding_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if start_of_ground_combat note used in space combat', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({ type: 'space' }),
      });
      state.players[0].promissoryNotesInHand = ['test_ground_combat_note'];
      state.players[0].promissoryNotesOwned = ['test_ground_combat_note'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'test_ground_combat_note',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in ground combat');
    });

    it('should allow start_of_ground_combat note during ground combat', () => {
      const state = createMockGameState({
        activeCombat: createMockCombat({ type: 'ground' }),
      });
      state.players[0].promissoryNotesInHand = ['test_ground_combat_note'];
      state.players[0].promissoryNotesOwned = ['test_ground_combat_note'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'test_ground_combat_note',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if start_of_invasion note played outside invasion', () => {
      const state = createMockGameState({ subPhase: 'tactical_movement' });
      state.players[0].promissoryNotesInHand = ['raghs_call_player1'];
      state.players[0].promissoryNotesOwned = ['raghs_call_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'raghs_call_player1',
        targetPlanetId: 'planet1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Not in invasion phase');
    });

    it('should fail if when_agenda_revealed note played outside agenda phase', () => {
      const state = createMockGameState({ phase: 'action' });
      state.players[0].promissoryNotesInHand = ['political_favor_player1'];
      state.players[1].promissoryNotesOwned = ['political_favor_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'political_favor_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only play when agenda is revealed');
    });

    it('should fail if end_of_strategy_phase note played outside strategy phase', () => {
      const state = createMockGameState({ phase: 'action' });
      state.players[0].promissoryNotesInHand = ['test_strategy_note'];
      state.players[0].promissoryNotesOwned = ['test_strategy_note'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'test_strategy_note',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only play at end of strategy phase');
    });

    it('should fail for timing window notes played directly', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['ceasefire_player2'];
      state.players[1].promissoryNotesOwned = ['ceasefire_player2'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'ceasefire_player2',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('This note is played via timing window');
    });
  });

  describe('note-specific requirements', () => {
    it('should fail War Funding if Letnev has less than 2 trade goods', () => {
      const state = createMockGameState({ activeCombat: createMockCombat() });
      state.players[1].tradeGoods = 1; // Letnev only has 1 TG
      state.players[0].promissoryNotesInHand = ['war_funding_player1'];
      state.players[1].promissoryNotesOwned = ['war_funding_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'war_funding_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Letnev player does not have 2 trade goods');
    });

    it('should allow War Funding if Letnev has 2+ trade goods', () => {
      const state = createMockGameState({ activeCombat: createMockCombat() });
      state.players[1].tradeGoods = 5;
      state.players[0].promissoryNotesInHand = ['war_funding_player1'];
      state.players[1].promissoryNotesOwned = ['war_funding_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'war_funding_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail Fires of the Gashlai if Muaat has no fleet tokens', () => {
      const state = createMockGameState();
      // Add Muaat player
      const muaat = createMockPlayer({
        id: 'player3',
        faction: 'muaat',
        promissoryNotesOwned: ['fires_of_the_gashlai_player1'],
        commandTokens: { tactics: 3, fleet: 0, strategy: 2 }, // No fleet tokens
      });
      state.players.push(muaat);
      state.players[0].promissoryNotesInHand = ['fires_of_the_gashlai_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'fires_of_the_gashlai_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Muaat player has no fleet tokens');
    });

    it('should fail Political Favor if Xxcha has no strategy tokens', () => {
      const state = createMockGameState({ phase: 'agenda' });
      // Add Xxcha player
      const xxcha = createMockPlayer({
        id: 'player3',
        faction: 'xxcha',
        promissoryNotesOwned: ['political_favor_player1'],
        commandTokens: { tactics: 3, fleet: 3, strategy: 0 }, // No strategy tokens
      });
      state.players.push(xxcha);
      state.players[0].promissoryNotesInHand = ['political_favor_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'political_favor_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Xxcha player has no strategy tokens');
    });

    it('should fail Military Support if Sol has no strategy tokens', () => {
      const state = createMockGameState({ activeCombat: createMockCombat() });
      state.players[0].commandTokens.strategy = 0; // Sol has no strategy tokens
      state.players[0].promissoryNotesOwned = ['military_support_player1'];
      state.players[1].promissoryNotesInHand = ['military_support_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player2',
        noteId: 'military_support_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Sol player has no strategy tokens');
    });

    it('should fail Research Agreement without target tech', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['research_agreement_player1'];
      state.players[0].promissoryNotesOwned = ['research_agreement_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'research_agreement_player1',
        // No targetTechId specified
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify technology to gain');
    });

    it('should fail Spy Net without target card', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['spy_net_player1'];
      // Add Yssaril player
      const yssaril = createMockPlayer({
        id: 'player3',
        faction: 'yssaril',
        promissoryNotesOwned: ['spy_net_player1'],
        actionCards: ['sabotage'],
      });
      state.players.push(yssaril);

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'spy_net_player1',
        // No targetCardId specified
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify action card to take');
    });

    it('should fail Spy Net if card not in Yssaril hand', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['spy_net_player1'];
      // Add Yssaril player
      const yssaril = createMockPlayer({
        id: 'player3',
        faction: 'yssaril',
        promissoryNotesOwned: ['spy_net_player1'],
        actionCards: ['direct_hit'], // Different card
      });
      state.players.push(yssaril);

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'spy_net_player1',
        targetCardId: 'sabotage', // Not in Yssaril's hand
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Card not in Yssaril hand');
    });

    it("should fail Ragh's Call without target planet", () => {
      const state = createMockGameState({ subPhase: 'tactical_invasion' });
      state.players[0].promissoryNotesInHand = ['raghs_call_player1'];
      state.players[0].promissoryNotesOwned = ['raghs_call_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'raghs_call_player1',
        // No targetPlanetId specified
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify target planet');
    });
  });

  describe('valid plays', () => {
    it('should allow valid ACTION note play', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['trade_agreement_player1'];
      state.players[0].promissoryNotesOwned = ['trade_agreement_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'trade_agreement_player1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(true);
    });

    it('should allow valid Research Agreement with target tech', () => {
      const state = createMockGameState();
      state.players[0].promissoryNotesInHand = ['research_agreement_player1'];
      state.players[0].promissoryNotesOwned = ['research_agreement_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'research_agreement_player1',
        targetTechId: 'neural_motivator',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(true);
    });

    it("should allow valid Ragh's Call with target planet", () => {
      const state = createMockGameState({ subPhase: 'tactical_invasion' });
      state.players[0].promissoryNotesInHand = ['raghs_call_player1'];
      state.players[0].promissoryNotesOwned = ['raghs_call_player1'];

      const action = {
        type: 'play_promissory_note' as const,
        playerId: 'player1',
        noteId: 'raghs_call_player1',
        targetPlanetId: 'planet1',
      };

      const result = validatePlayPromissoryNote(state, action);

      expect(result.valid).toBe(true);
    });
  });
});
