/**
 * Firmament / Obsidian Faction Handler Tests
 *
 * Tests for the Thunder's Edge expansion Firmament/Obsidian faction:
 * - PLOTS WITHIN PLOTS: Draw and play plot cards
 * - PUPPETS OF THE BLADE: Transform to Obsidian
 * - Marionette mechanics
 * - Flagship abilities (Dark Mirror, Hollowing)
 * - Mech abilities (Shadow, Hollowed)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, PlayerState, MapTile, UnitInstance } from '@ti4/shared';
import {
  isFirmamentOrObsidian,
  isObsidian,
  getPlotCards,
  getPlotCardsInPlay,
  handleDrawPlotCard,
  handlePlayPlotCard,
  getPlotCardDetails,
  handleTransformToObsidian,
  isMarionette,
  getMarionettes,
  applyBladesOrchestra,
  getDarkMirrorProductionBonus,
  handleHollowingAbility,
  canShadowMechCoexist,
} from '../firmament';

// ============================================================================
// Mock Factories
// ============================================================================

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    faction: 'arborec',
    color: 'blue',
    name: `Player ${id}`,
    tradeGoods: 0,
    commodities: 0,
    commoditiesLimit: 3,
    strategyCards: [],
    technologies: [],
    planets: [],
    actionCards: [],
    secretObjectives: ['obj1', 'obj2'],
    scoredObjectives: [],
    promissoryNotes: [],
    relics: [],
    leaders: {
      agent: { id: 'test-agent', unlocked: false, exhausted: false },
      commander: { id: 'test-commander', unlocked: false },
      hero: { id: 'test-hero', unlocked: true, purged: false },
    },
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    victoryPoints: 0,
    isEliminated: false,
    hasPassedThisRound: false,
    activeInRound: true,
    ...overrides,
  } as PlayerState;
}

function createMockMapTile(id: string, position: { q: number; r: number }, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id,
    systemId: id,
    position,
    units: [],
    planets: [],
    commandTokens: [],
    ...overrides,
  } as MapTile;
}

function createMockGameState(playerCount: number): GameState {
  const players = Array.from({ length: playerCount }, (_, i) =>
    createMockPlayer(`player${i + 1}`)
  );

  return {
    id: 'test-game',
    players,
    currentPlayerIndex: 0,
    phase: 'action',
    round: 1,
    map: {
      tiles: [
        createMockMapTile('system1', { q: 0, r: 0 }),
        createMockMapTile('system2', { q: 1, r: 0 }),
        createMockMapTile('system3', { q: 0, r: 1 }),
      ],
    },
    publicObjectives: { stageI: [], stageII: [] },
    secretObjectives: [],
    laws: [],
    turnOrder: players.map((p) => p.id),
    actionCards: { deck: [], discard: [] },
    explorationDecks: {
      cultural: { deck: [], discard: [] },
      industrial: { deck: [], discard: [] },
      hazardous: { deck: [], discard: [] },
      frontier: { deck: [], discard: [] },
    },
    relicDeck: { deck: [], discard: [] },
    victoryPointLimit: 10,
    settings: {
      expansions: ['thunders_edge'],
      victoryPoints: 10,
    },
    timestamp: Date.now(),
  } as unknown as GameState;
}

function createFirmamentPlayer(state: GameState): PlayerState {
  const player = state.players[0];
  player.faction = 'firmament';
  return player;
}

function createObsidianPlayer(state: GameState): PlayerState {
  const player = state.players[0];
  player.faction = 'obsidian';
  return player;
}

// ============================================================================
// Faction Detection Tests
// ============================================================================

describe('Firmament - Faction Detection', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
  });

  describe('isFirmamentOrObsidian', () => {
    it('should return true for Firmament player', () => {
      createFirmamentPlayer(state);
      expect(isFirmamentOrObsidian(state, 'player1')).toBe(true);
    });

    it('should return true for Obsidian player', () => {
      createObsidianPlayer(state);
      expect(isFirmamentOrObsidian(state, 'player1')).toBe(true);
    });

    it('should return false for other factions', () => {
      expect(isFirmamentOrObsidian(state, 'player1')).toBe(false);
    });

    it('should return false for non-existent player', () => {
      expect(isFirmamentOrObsidian(state, 'nonexistent')).toBe(false);
    });
  });

  describe('isObsidian', () => {
    it('should return true for Obsidian player', () => {
      createObsidianPlayer(state);
      expect(isObsidian(state, 'player1')).toBe(true);
    });

    it('should return false for Firmament player', () => {
      createFirmamentPlayer(state);
      expect(isObsidian(state, 'player1')).toBe(false);
    });

    it('should return false for other factions', () => {
      expect(isObsidian(state, 'player1')).toBe(false);
    });
  });
});

// ============================================================================
// Plot Card Management Tests
// ============================================================================

describe('Firmament - Plot Cards', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createFirmamentPlayer(state);
  });

  describe('getPlotCards', () => {
    it('should return empty array when no plot cards', () => {
      expect(getPlotCards(state, 'player1')).toEqual([]);
    });

    it('should return plot cards in hand', () => {
      state.players[0].plotCards = ['shadow_strike', 'dark_bargain'];
      expect(getPlotCards(state, 'player1')).toHaveLength(2);
      expect(getPlotCards(state, 'player1')).toContain('shadow_strike');
    });
  });

  describe('getPlotCardsInPlay', () => {
    it('should return empty array when no plot cards in play', () => {
      expect(getPlotCardsInPlay(state, 'player1')).toEqual([]);
    });

    it('should return plot cards in play', () => {
      state.players[0].plotCardsInPlay = ['false_flag'];
      expect(getPlotCardsInPlay(state, 'player1')).toHaveLength(1);
    });
  });

  describe('getPlotCardDetails', () => {
    it('should return details for valid plot card', () => {
      const card = getPlotCardDetails('shadow_strike');
      expect(card).toBeDefined();
      expect(card?.name).toBe('Shadow Strike');
      expect(card?.timing).toBe('action');
    });

    it('should return undefined for invalid card', () => {
      const card = getPlotCardDetails('nonexistent');
      expect(card).toBeUndefined();
    });

    it('should return correct details for dark_bargain', () => {
      const card = getPlotCardDetails('dark_bargain');
      expect(card?.name).toBe('Dark Bargain');
      expect(card?.timing).toBe('action');
    });

    it('should return correct details for puppet_strings', () => {
      const card = getPlotCardDetails('puppet_strings');
      expect(card?.name).toBe('Puppet Strings');
      expect(card?.timing).toBe('agenda');
    });
  });
});

// ============================================================================
// Draw Plot Card Tests
// ============================================================================

describe('Firmament - Draw Plot Card', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
  });

  describe('handleDrawPlotCard', () => {
    it('should draw a plot card for Firmament player', () => {
      createFirmamentPlayer(state);

      const result = handleDrawPlotCard(state, {
        type: 'draw_plot_card',
        playerId: 'player1',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('plot_card_drawn');
      expect(state.players[0].plotCards).toHaveLength(1);
    });

    it('should draw a plot card for Obsidian player', () => {
      createObsidianPlayer(state);

      const result = handleDrawPlotCard(state, {
        type: 'draw_plot_card',
        playerId: 'player1',
      });

      expect(result.success).toBe(true);
      expect(state.players[0].plotCards).toHaveLength(1);
    });

    it('should fail for non-Firmament/Obsidian player', () => {
      const result = handleDrawPlotCard(state, {
        type: 'draw_plot_card',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only Firmament/Obsidian');
    });

    it('should fail for non-existent player', () => {
      const result = handleDrawPlotCard(state, {
        type: 'draw_plot_card',
        playerId: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should initialize plotCards array if undefined', () => {
      createFirmamentPlayer(state);
      state.players[0].plotCards = undefined;

      handleDrawPlotCard(state, {
        type: 'draw_plot_card',
        playerId: 'player1',
      });

      expect(state.players[0].plotCards).toBeDefined();
      expect(state.players[0].plotCards).toHaveLength(1);
    });
  });
});

// ============================================================================
// Play Plot Card Tests
// ============================================================================

describe('Firmament - Play Plot Card', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createFirmamentPlayer(state);
    state.players[0].plotCards = ['shadow_strike', 'dark_bargain', 'hidden_agenda', 'puppet_strings'];
  });

  describe('handlePlayPlotCard - Shadow Strike', () => {
    it('should play shadow_strike with valid target', () => {
      // Add units to system
      state.map.tiles[0].units = [
        { id: 'ship1', type: 'cruiser', ownerId: 'player1' } as UnitInstance,
      ];

      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'shadow_strike',
        targets: { systemId: 'system1' },
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('plot_card_played');
      expect(result.triggeredEvents).toContain('ship_destroyed');
    });

    it('should fail without target system', () => {
      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'shadow_strike',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('target system');
    });

    it('should fail for non-existent system', () => {
      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'shadow_strike',
        targets: { systemId: 'nonexistent' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('System not found');
    });

    it('should fail when no units in system', () => {
      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'shadow_strike',
        targets: { systemId: 'system1' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No units in system');
    });
  });

  describe('handlePlayPlotCard - Dark Bargain', () => {
    it('should give 3 trade goods and 2 command tokens', () => {
      const initialTradeGoods = state.players[0].tradeGoods;
      const initialTactics = state.players[0].commandTokens.tactics;
      const initialStrategy = state.players[0].commandTokens.strategy;

      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'dark_bargain',
      });

      expect(result.success).toBe(true);
      expect(state.players[0].tradeGoods).toBe(initialTradeGoods + 3);
      expect(state.players[0].commandTokens.tactics).toBe(initialTactics + 1);
      expect(state.players[0].commandTokens.strategy).toBe(initialStrategy + 1);
    });
  });

  describe('handlePlayPlotCard - Hidden Agenda', () => {
    it('should reveal target player secrets', () => {
      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'hidden_agenda',
        targets: { playerId: 'player2' },
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('secrets_revealed');
      expect((result.data as { secrets?: string[] }).secrets).toBeDefined();
    });

    it('should fail without target player', () => {
      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'hidden_agenda',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('target player');
    });

    it('should fail for non-existent target player', () => {
      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'hidden_agenda',
        targets: { playerId: 'nonexistent' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target player not found');
    });
  });

  describe('handlePlayPlotCard - Puppet Strings', () => {
    it('should control vote with valid target', () => {
      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'puppet_strings',
        targets: { playerId: 'player2' },
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('vote_controlled');
    });

    it('should fail without target player', () => {
      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'puppet_strings',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('handlePlayPlotCard - Common Cases', () => {
    it('should remove card from hand after playing', () => {
      state.map.tiles[0].units = [
        { id: 'ship1', type: 'cruiser', ownerId: 'player1' } as UnitInstance,
      ];

      handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'shadow_strike',
        targets: { systemId: 'system1' },
      });

      expect(state.players[0].plotCards).not.toContain('shadow_strike');
    });

    it('should fail for non-existent player', () => {
      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'nonexistent',
        cardId: 'shadow_strike',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail for card not in hand', () => {
      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'false_flag',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not have this plot card');
    });

    it('should fail for invalid card', () => {
      state.players[0].plotCards.push('invalid_card');

      const result = handlePlayPlotCard(state, {
        type: 'play_plot_card',
        playerId: 'player1',
        cardId: 'invalid_card',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid plot card');
    });
  });
});

// ============================================================================
// Transformation Tests
// ============================================================================

describe('Firmament - Transformation to Obsidian', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
    createFirmamentPlayer(state);
    state.players[0].leaders = {
      agent: { id: 'agent', unlocked: false, exhausted: false },
      commander: { id: 'commander', unlocked: false },
      hero: { id: 'sharsiss', unlocked: true, purged: false },
    };
  });

  describe('handleTransformToObsidian', () => {
    it('should transform Firmament to Obsidian', () => {
      const result = handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('faction_transformed');
      expect(state.players[0].faction).toBe('obsidian');
    });

    it('should purge the hero after transformation', () => {
      handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(state.players[0].leaders?.hero?.purged).toBe(true);
    });

    it('should update home planet from cronos to cronos_hollow', () => {
      state.players[0].planets = [{ planetId: 'cronos', controlledBy: 'player1' }];

      handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(state.players[0].planets[0].planetId).toBe('cronos_hollow');
    });

    it('should fail for non-Firmament player', () => {
      state.players[0].faction = 'arborec';

      const result = handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only Firmament can transform to Obsidian');
    });

    it('should fail when hero not unlocked', () => {
      state.players[0].leaders!.hero!.unlocked = false;

      const result = handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hero ability not available');
    });

    it('should fail when hero already purged', () => {
      state.players[0].leaders!.hero!.purged = true;

      const result = handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'player1',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hero ability not available');
    });

    it('should fail for non-existent player', () => {
      const result = handleTransformToObsidian(state, {
        type: 'transform_to_obsidian',
        playerId: 'nonexistent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });
  });
});

// ============================================================================
// Marionette Tests
// ============================================================================

describe('Firmament - Marionette Mechanics', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
  });

  describe('isMarionette', () => {
    it('should return false when no Obsidian player', () => {
      expect(isMarionette(state, 'player2')).toBe(false);
    });

    it('should return false when player is not puppeted', () => {
      createObsidianPlayer(state);
      expect(isMarionette(state, 'player2')).toBe(false);
    });
  });

  describe('getMarionettes', () => {
    it('should return empty array when no marionettes', () => {
      expect(getMarionettes(state)).toEqual([]);
    });
  });

  describe('applyBladesOrchestra', () => {
    it('should return true for non-marionette', () => {
      createObsidianPlayer(state);
      expect(applyBladesOrchestra(state, 'player1', 'player2', 'for')).toBe(true);
    });
  });
});

// ============================================================================
// Flagship Ability Tests
// ============================================================================

describe('Firmament - Flagship Abilities', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
  });

  describe('getDarkMirrorProductionBonus', () => {
    it('should return bonus for Firmament player', () => {
      createFirmamentPlayer(state);
      const bonus = getDarkMirrorProductionBonus(state, 'player1');
      expect(bonus).toBeDefined();
      expect(bonus?.bonusShip).toBe(true);
      expect(bonus?.type).toBe('non_fighter');
    });

    it('should return null for non-Firmament player', () => {
      const bonus = getDarkMirrorProductionBonus(state, 'player1');
      expect(bonus).toBeNull();
    });

    it('should return null for Obsidian player', () => {
      createObsidianPlayer(state);
      const bonus = getDarkMirrorProductionBonus(state, 'player1');
      expect(bonus).toBeNull();
    });
  });

  describe('handleHollowingAbility', () => {
    it('should work for Obsidian player after combat', () => {
      createObsidianPlayer(state);
      state.activeCombat = undefined; // Combat ended

      const result = handleHollowingAbility(state, 'player1', 'ship123');

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('ship_puppeted');
    });

    it('should fail for non-Obsidian player', () => {
      const result = handleHollowingAbility(state, 'player1', 'ship123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only Obsidian can use Hollowing ability');
    });

    it('should fail during active combat', () => {
      createObsidianPlayer(state);
      state.activeCombat = {
        systemId: 'system1',
        attackerId: 'player1',
        defenderId: 'player2',
      } as GameState['activeCombat'];

      const result = handleHollowingAbility(state, 'player1', 'ship123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Combat is still active');
    });
  });
});

// ============================================================================
// Mech Ability Tests
// ============================================================================

describe('Firmament - Mech Abilities', () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState(4);
  });

  describe('canShadowMechCoexist', () => {
    it('should return true for Firmament player', () => {
      createFirmamentPlayer(state);
      expect(canShadowMechCoexist(state, 'player1')).toBe(true);
    });

    it('should return false for non-Firmament player', () => {
      expect(canShadowMechCoexist(state, 'player1')).toBe(false);
    });

    it('should return false for Obsidian player', () => {
      createObsidianPlayer(state);
      expect(canShadowMechCoexist(state, 'player1')).toBe(false);
    });
  });
});
