import { describe, it, expect, beforeEach } from 'vitest';
import {
  executeBreakthroughEffect,
  canTriggerBreakthrough,
  getBreakthroughCombatBonus,
  getBreakthroughMovementBonus,
  type BreakthroughEffectContext,
  type BreakthroughTrigger,
} from '../breakthroughs.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  PlanetInstance,
  UnitInstance,
  HexCoord,
} from '@ti4/shared';
import { BREAKTHROUGHS_BY_ID } from '@ti4/shared';

// =============================================================================
// Mock Factory Functions
// =============================================================================

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
    breakthrough: undefined,
    homeSystemId: 'home-1',
    ...overrides,
  };
}

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

function createMockGameState(playerCount: number = 4): GameState {
  const players: PlayerState[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(
      createMockPlayer(`player${i + 1}`, {
        name: `Player ${i + 1}`,
        seatIndex: i,
        color: ['blue', 'red', 'green', 'yellow', 'purple', 'orange'][i] as any,
      })
    );
  }

  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: players.map((p) => p.id),
    players,
    map: {
      tiles: [
        createMockTile({ q: 0, r: 0 }, 18), // Mecatol Rex
        createMockTile({ q: 1, r: 0 }, 19),
        createMockTile({ q: 0, r: 1 }, 20),
        createMockTile({ q: -1, r: 1 }, 21),
      ],
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
    agendaDeck: [],
    agendaDiscard: [],
    laws: [],
    custodiansTaken: false,
    activeCombat: null,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    gameLog: [],
    breachTokens: [],
  };
}

// =============================================================================
// executeBreakthroughEffect Tests
// =============================================================================

describe('Breakthroughs', () => {
  describe('executeBreakthroughEffect', () => {
    describe('validation', () => {
      it('should fail if breakthrough not unlocked', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'psychospore',
          unlocked: false,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['psychospore'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Breakthrough not unlocked');
      });

      it('should fail if breakthrough ID mismatch', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'gravleash_maneuvers',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['psychospore'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Breakthrough mismatch');
      });

      it('should fail if exhaustable breakthrough is exhausted', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'psychospore',
          unlocked: true,
          exhausted: true,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['psychospore'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Breakthrough is exhausted');
      });

      it('should exhaust breakthrough after successful use if exhaustable', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'gravleash_maneuvers',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['gravleash_maneuvers'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        if (breakthrough.isExhaustable) {
          expect(player.breakthrough.exhausted).toBe(true);
        }
      });
    });

    describe('Psychospore (Arborec)', () => {
      it('should remove command token and return it to tactics pool', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'psychospore',
          unlocked: true,
          exhausted: false,
        };
        player.commandTokens.tactics = 2;

        // Add infantry to the system
        const tile = state.map.tiles[0];
        tile.planets.push({
          planetId: 'test_planet',
          controlledBy: player.id,
          exhausted: false,
          attachments: [],
          units: [{ id: 'inf-1', type: 'infantry', ownerId: player.id, damaged: false }],
        } as PlanetInstance);

        // Add command token to the system
        tile.commandTokens.push(player.id);

        const breakthrough = BREAKTHROUGHS_BY_ID['psychospore'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          targets: { systemId: tile.id },
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(tile.commandTokens).not.toContain(player.id);
        expect(player.commandTokens.tactics).toBe(3);
        expect(result.triggeredEvents).toContain('psychospore_used');
      });

      it('should fail without system target', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'psychospore',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['psychospore'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Must specify system to remove token from');
      });

      it('should fail if no infantry in system', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'psychospore',
          unlocked: true,
          exhausted: false,
        };

        const tile = state.map.tiles[0];
        tile.commandTokens.push(player.id);

        const breakthrough = BREAKTHROUGHS_BY_ID['psychospore'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          targets: { systemId: tile.id },
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(false);
        expect(result.error).toBe('No infantry in system');
      });

      it('should fail if no command token in system', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'psychospore',
          unlocked: true,
          exhausted: false,
        };

        const tile = state.map.tiles[0];
        tile.planets.push({
          planetId: 'test_planet',
          controlledBy: player.id,
          exhausted: false,
          attachments: [],
          units: [{ id: 'inf-1', type: 'infantry', ownerId: player.id, damaged: false }],
        } as PlanetInstance);

        const breakthrough = BREAKTHROUGHS_BY_ID['psychospore'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          targets: { systemId: tile.id },
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(false);
        expect(result.error).toBe('No command token in system');
      });
    });

    describe('Gravleash Maneuvers (Barony)', () => {
      it('should return success with combat bonus effect', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'gravleash_maneuvers',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['gravleash_maneuvers'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(result.triggeredEvents).toContain('gravleash_maneuvers_active');
        expect(result.data?.effect).toBe('combat_bonus_and_movement_match');
      });
    });

    describe('Auto-Factories (Jol-Nar)', () => {
      it('should grant fleet token on production trigger', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'auto_factories',
          unlocked: true,
          exhausted: false,
        };
        player.commandTokens.fleet = 2;

        const breakthrough = BREAKTHROUGHS_BY_ID['auto_factories'];
        const trigger: BreakthroughTrigger = {
          type: 'production',
          systemId: 'test-system',
          unitsProduced: 3,
        };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(player.commandTokens.fleet).toBe(3);
        expect(result.triggeredEvents).toContain('auto_factories_triggered');
      });

      it('should fail without production trigger', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'auto_factories',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['auto_factories'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Auto-Factories triggers on production');
      });
    });

    describe('Fealty Uplink (Sol)', () => {
      it('should trigger on planet gain', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'fealty_uplink',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['fealty_uplink'];
        const trigger: BreakthroughTrigger = {
          type: 'planet_gained',
          planetId: 'mecatol_rex',
        };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(result.triggeredEvents).toContain('fealty_uplink_triggered');
        expect(result.data?.planetId).toBe('mecatol_rex');
      });

      it('should fail without planet_gained trigger', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'fealty_uplink',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['fealty_uplink'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Fealty Uplink triggers on planet gain');
      });
    });

    describe("N'orr Supremacy (Sardakk N'orr)", () => {
      it('should trigger on combat win with choice', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'norr_supremacy',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['norr_supremacy'];
        const trigger: BreakthroughTrigger = {
          type: 'combat_win',
          systemId: 'test-system',
          unitsDestroyed: 3,
        };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(result.triggeredEvents).toContain('norr_supremacy_triggered');
        expect(result.data?.choice).toBe('token_or_tech');
      });
    });

    describe('Mindsieve (Naalu)', () => {
      it('should trigger on secondary resolution', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'mindsieve',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['mindsieve'];
        const trigger: BreakthroughTrigger = {
          type: 'secondary_resolved',
          strategyCard: 1,
          targetPlayerId: 'player2',
        };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(result.triggeredEvents).toContain('mindsieve_offered');
        expect(result.data?.targetPlayerId).toBe('player2');
      });
    });

    describe('Vaults of the Heir (Empyrean)', () => {
      it('should purge tech to gain relic', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'vaults_of_the_heir',
          unlocked: true,
          exhausted: false,
        };
        player.technologies = ['antimass_deflectors', 'neural_motivator'];

        const breakthrough = BREAKTHROUGHS_BY_ID['vaults_of_the_heir'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          targets: { techId: 'antimass_deflectors' },
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(player.technologies).not.toContain('antimass_deflectors');
        expect(player.technologies).toContain('neural_motivator');
        expect(result.triggeredEvents).toContain('vaults_of_heir_used');
        expect(result.triggeredEvents).toContain('relic_gained');
        expect(result.data?.purgedTech).toBe('antimass_deflectors');
      });

      it('should fail without tech target', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'vaults_of_the_heir',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['vaults_of_the_heir'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Must specify technology to purge');
      });

      it('should fail if player does not have the tech', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'vaults_of_the_heir',
          unlocked: true,
          exhausted: false,
        };
        player.technologies = ['neural_motivator'];

        const breakthrough = BREAKTHROUGHS_BY_ID['vaults_of_the_heir'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          targets: { techId: 'antimass_deflectors' },
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Player does not have that technology');
      });
    });

    describe("Al'Raith Ix Ianovar (Vuil'Raith)", () => {
      it('should activate The Fracture', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'alraith_ix_ianovar',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['alraith_ix_ianovar'];
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(state.fractureState?.isActive).toBe(true);
        expect(result.triggeredEvents).toContain('fracture_activated');
        expect(result.triggeredEvents).toContain('ingress_token_placed');
      });
    });

    describe('Visionaria Select (Deepwrought)', () => {
      it('should gain tech when other researches', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'visionaria_select',
          unlocked: true,
          exhausted: false,
        };
        player.technologies = [];

        const breakthrough = BREAKTHROUGHS_BY_ID['visionaria_select'];
        const trigger: BreakthroughTrigger = {
          type: 'tech_researched',
          techId: 'sarween_tools',
        };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(player.technologies).toContain('sarween_tools');
        expect(result.triggeredEvents).toContain('visionaria_select_triggered');
        expect(result.data?.techGained).toBe('sarween_tools');
      });

      it('should not duplicate tech if already owned', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'visionaria_select',
          unlocked: true,
          exhausted: false,
        };
        player.technologies = ['sarween_tools'];

        const breakthrough = BREAKTHROUGHS_BY_ID['visionaria_select'];
        const trigger: BreakthroughTrigger = {
          type: 'tech_researched',
          techId: 'sarween_tools',
        };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(player.technologies.filter((t) => t === 'sarween_tools').length).toBe(1);
      });
    });

    describe('Data Skimmer (Qzenn)', () => {
      it('should collect discarded action cards', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'data_skimmer',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['data_skimmer'];
        const trigger: BreakthroughTrigger = {
          type: 'action_card_discarded',
          cardId: 'sabotage',
          discardedBy: 'player2',
        };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(player.breakthrough?.collectedCards).toContain('sabotage');
        expect(result.triggeredEvents).toContain('data_skimmer_collected');
        expect(result.data?.cardCollected).toBe('sabotage');
      });
    });

    describe('The Sowing (Last Bastion)', () => {
      it('should accumulate trade goods on card at status phase', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'the_sowing',
          unlocked: true,
          exhausted: false,
          tradeGoodsOnCard: 2,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['the_sowing'];
        const trigger: BreakthroughTrigger = { type: 'status_phase_start' };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(player.breakthrough?.tradeGoodsOnCard).toBe(3);
        expect(result.triggeredEvents).toContain('the_sowing_accumulated');
      });

      it('should initialize trade goods counter if not set', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'the_sowing',
          unlocked: true,
          exhausted: false,
        };

        const breakthrough = BREAKTHROUGHS_BY_ID['the_sowing'];
        const trigger: BreakthroughTrigger = { type: 'status_phase_start' };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(player.breakthrough?.tradeGoodsOnCard).toBe(1);
      });
    });

    describe('The Reaping (Last Bastion)', () => {
      it('should gain trade goods on combat win per unit destroyed', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'the_reaping',
          unlocked: true,
          exhausted: false,
        };
        player.tradeGoods = 2;

        const breakthrough = BREAKTHROUGHS_BY_ID['the_reaping'];
        const trigger: BreakthroughTrigger = {
          type: 'combat_win',
          systemId: 'test-system',
          unitsDestroyed: 4,
        };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(player.tradeGoods).toBe(6);
        expect(result.triggeredEvents).toContain('the_reaping_combat');
        expect(result.data?.tradeGoodsGained).toBe(4);
      });

      it('should double and collect trade goods at status phase', () => {
        const state = createMockGameState();
        const player = state.players[0];
        player.breakthrough = {
          breakthroughId: 'the_reaping',
          unlocked: true,
          exhausted: false,
          tradeGoodsOnCard: 5,
        };
        player.tradeGoods = 1;

        const breakthrough = BREAKTHROUGHS_BY_ID['the_reaping'];
        const trigger: BreakthroughTrigger = { type: 'status_phase_start' };
        const context: BreakthroughEffectContext = {
          state,
          player,
          breakthrough,
          trigger,
        };

        const result = executeBreakthroughEffect(context);

        expect(result.success).toBe(true);
        expect(player.tradeGoods).toBe(11); // 1 + (5 * 2)
        expect(player.breakthrough?.tradeGoodsOnCard).toBe(0);
        expect(result.triggeredEvents).toContain('the_reaping_harvest');
        expect(result.data?.tradeGoodsGained).toBe(10);
      });
    });
  });

  // =============================================================================
  // canTriggerBreakthrough Tests
  // =============================================================================

  describe('canTriggerBreakthrough', () => {
    it('should return false if breakthrough not unlocked', () => {
      const player = createMockPlayer('player1');
      player.breakthrough = {
        breakthroughId: 'psychospore',
        unlocked: false,
        exhausted: false,
      };

      const result = canTriggerBreakthrough(player, 'action');

      expect(result).toBe(false);
    });

    it('should return false if exhaustable breakthrough is exhausted', () => {
      const player = createMockPlayer('player1');
      // the_icon is exhaustable and has action trigger
      player.breakthrough = {
        breakthroughId: 'the_icon',
        unlocked: true,
        exhausted: true,
      };

      const result = canTriggerBreakthrough(player, 'action');

      expect(result).toBe(false);
    });

    it('should return false for invalid breakthrough ID', () => {
      const player = createMockPlayer('player1');
      player.breakthrough = {
        breakthroughId: 'nonexistent_breakthrough',
        unlocked: true,
        exhausted: false,
      };

      const result = canTriggerBreakthrough(player, 'action');

      expect(result).toBe(false);
    });

    describe('action triggers', () => {
      it('should return true for deorbit_barrage on action', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'deorbit_barrage',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'action');

        expect(result).toBe(true);
      });

      it('should return true for wing_transfer on action', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'wing_transfer',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'action');

        expect(result).toBe(true);
      });

      it('should return true for the_icon on action', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'the_icon',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'action');

        expect(result).toBe(true);
      });
    });

    describe('production triggers', () => {
      it('should return true for auto_factories on production', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'auto_factories',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'production');

        expect(result).toBe(true);
      });

      it('should return true for bellum_gloriosum on production', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'bellum_gloriosum',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'production');

        expect(result).toBe(true);
      });

      it('should return true for particle_synthesis on production', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'particle_synthesis',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'production');

        expect(result).toBe(true);
      });
    });

    describe('combat_win triggers', () => {
      it('should return true for norr_supremacy on combat_win', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'norr_supremacy',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'combat_win');

        expect(result).toBe(true);
      });

      it('should return true for the_reaping on combat_win', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'the_reaping',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'combat_win');

        expect(result).toBe(true);
      });
    });

    describe('tech_researched triggers', () => {
      it('should return true for the_tables_grace on tech_researched', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'the_tables_grace',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'tech_researched');

        expect(result).toBe(true);
      });

      it('should return true for visionaria_select on tech_researched', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'visionaria_select',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'tech_researched');

        expect(result).toBe(true);
      });
    });

    describe('movement triggers', () => {
      it('should return true for gravleash_maneuvers on movement', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'gravleash_maneuvers',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'movement');

        expect(result).toBe(true);
      });

      it('should return true for resonance_generator on movement', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'resonance_generator',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'movement');

        expect(result).toBe(true);
      });
    });

    describe('other triggers', () => {
      it('should return true for fealty_uplink on planet_gained', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'fealty_uplink',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'planet_gained');

        expect(result).toBe(true);
      });

      it('should return true for deepgloom_executable on transaction', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'deepgloom_executable',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'transaction');

        expect(result).toBe(true);
      });

      it('should return true for data_skimmer on action_card_discarded', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'data_skimmer',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'action_card_discarded');

        expect(result).toBe(true);
      });

      it('should return true for mindsieve on secondary_resolved', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'mindsieve',
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'secondary_resolved');

        expect(result).toBe(true);
      });
    });

    describe('mismatch cases', () => {
      it('should return false when trigger type does not match breakthrough', () => {
        const player = createMockPlayer('player1');
        player.breakthrough = {
          breakthroughId: 'auto_factories', // production trigger
          unlocked: true,
          exhausted: false,
        };

        const result = canTriggerBreakthrough(player, 'combat_win'); // wrong trigger

        expect(result).toBe(false);
      });
    });
  });

  // =============================================================================
  // getBreakthroughCombatBonus Tests
  // =============================================================================

  describe('getBreakthroughCombatBonus', () => {
    it('should return 0 if breakthrough not unlocked', () => {
      const player = createMockPlayer('player1');
      player.breakthrough = undefined;

      const bonus = getBreakthroughCombatBonus(player, 'space');

      expect(bonus).toBe(0);
    });

    it('should return +1 for gravleash_maneuvers in space combat', () => {
      const player = createMockPlayer('player1');
      player.breakthrough = {
        breakthroughId: 'gravleash_maneuvers',
        unlocked: true,
        exhausted: false,
      };

      const bonus = getBreakthroughCombatBonus(player, 'space');

      expect(bonus).toBe(1);
    });

    it('should return 0 for gravleash_maneuvers in ground combat', () => {
      const player = createMockPlayer('player1');
      player.breakthrough = {
        breakthroughId: 'gravleash_maneuvers',
        unlocked: true,
        exhausted: false,
      };

      const bonus = getBreakthroughCombatBonus(player, 'ground');

      expect(bonus).toBe(0);
    });

    it('should return bonus per Support for Throne for imperator', () => {
      const player = createMockPlayer('player1');
      player.breakthrough = {
        breakthroughId: 'imperator',
        unlocked: true,
        exhausted: false,
      };
      player.promissoryNotesInPlay = [
        { noteId: 'support_for_the_throne_player2', receivedFrom: 'player2' },
        { noteId: 'support_for_the_throne_player3', receivedFrom: 'player3' },
      ] as any;

      const bonus = getBreakthroughCombatBonus(player, 'space');

      expect(bonus).toBe(2);
    });

    it('should return 0 for imperator with no Support for Throne', () => {
      const player = createMockPlayer('player1');
      player.breakthrough = {
        breakthroughId: 'imperator',
        unlocked: true,
        exhausted: false,
      };
      player.promissoryNotesInPlay = [];

      const bonus = getBreakthroughCombatBonus(player, 'space');

      expect(bonus).toBe(0);
    });

    it('should return 0 for breakthrough without combat bonus', () => {
      const player = createMockPlayer('player1');
      player.breakthrough = {
        breakthroughId: 'auto_factories',
        unlocked: true,
        exhausted: false,
      };

      const bonus = getBreakthroughCombatBonus(player, 'space');

      expect(bonus).toBe(0);
    });
  });

  // =============================================================================
  // getBreakthroughMovementBonus Tests
  // =============================================================================

  describe('getBreakthroughMovementBonus', () => {
    it('should return 0 if breakthrough not unlocked', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.breakthrough = undefined;

      const bonus = getBreakthroughMovementBonus(player, 'tile-0-0', state);

      expect(bonus).toBe(0);
    });

    it('should return +1 for resonance_generator from home system', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.breakthrough = {
        breakthroughId: 'resonance_generator',
        unlocked: true,
        exhausted: false,
      };
      player.homeSystemId = 19;

      // Set the tile systemId to match player's home
      state.map.tiles[1].systemId = 19;

      const bonus = getBreakthroughMovementBonus(player, state.map.tiles[1].id, state);

      expect(bonus).toBe(1);
    });

    it('should return +1 for resonance_generator from active breach system', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.breakthrough = {
        breakthroughId: 'resonance_generator',
        unlocked: true,
        exhausted: false,
      };
      player.homeSystemId = 999; // Different from tile

      state.breachTokens = [
        { systemId: 'tile-1-0', active: true, playerId: player.id },
      ] as any;

      const bonus = getBreakthroughMovementBonus(player, 'tile-1-0', state);

      expect(bonus).toBe(1);
    });

    it('should return 0 for resonance_generator from inactive breach system', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.breakthrough = {
        breakthroughId: 'resonance_generator',
        unlocked: true,
        exhausted: false,
      };
      player.homeSystemId = 999;

      state.breachTokens = [
        { systemId: 'tile-1-0', active: false, playerId: player.id },
      ] as any;

      const bonus = getBreakthroughMovementBonus(player, 'tile-1-0', state);

      expect(bonus).toBe(0);
    });

    it('should return 0 for resonance_generator from regular system', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.breakthrough = {
        breakthroughId: 'resonance_generator',
        unlocked: true,
        exhausted: false,
      };
      player.homeSystemId = 999;
      state.breachTokens = [];

      const bonus = getBreakthroughMovementBonus(player, 'tile-1-0', state);

      expect(bonus).toBe(0);
    });

    it('should return 0 for non-movement breakthrough', () => {
      const state = createMockGameState();
      const player = state.players[0];
      player.breakthrough = {
        breakthroughId: 'auto_factories',
        unlocked: true,
        exhausted: false,
      };

      const bonus = getBreakthroughMovementBonus(player, 'tile-0-0', state);

      expect(bonus).toBe(0);
    });
  });
});
