import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleUseRelic,
  handleReadyRelic,
  readyAllRelics,
  hasReadyRelic,
  getPlayerRelics,
  getShardOfThroneOwner,
  handleShardTransfer,
} from '../relics.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  HexCoord,
  UseRelicAction,
  ReadyRelicAction,
} from '@ti4/shared';

// Mock the @ti4/shared relic functions
vi.mock('@ti4/shared', async () => {
  const actual = await vi.importActual('@ti4/shared');
  return {
    ...actual,
    getRelic: vi.fn((relicId: string) => {
      const relics: Record<string, { id: string; name: string }> = {
        dominus_orb: { id: 'dominus_orb', name: 'Dominus Orb' },
        maw_of_worlds: { id: 'maw_of_worlds', name: 'Maw of Worlds' },
        scepter_of_emelpar: { id: 'scepter_of_emelpar', name: 'Scepter of Emelpar' },
        shard_of_the_throne: { id: 'shard_of_the_throne', name: 'Shard of the Throne' },
        stellar_converter: { id: 'stellar_converter', name: 'Stellar Converter' },
        the_codex: { id: 'the_codex', name: 'The Codex' },
        the_crown_of_emphidia: { id: 'the_crown_of_emphidia', name: 'The Crown of Emphidia' },
        the_crown_of_thalnos: { id: 'the_crown_of_thalnos', name: 'The Crown of Thalnos' },
        the_obsidian: { id: 'the_obsidian', name: 'The Obsidian' },
        the_prophets_tears: { id: 'the_prophets_tears', name: "The Prophet's Tears" },
      };
      return relics[relicId] || null;
    }),
    isExhaustable: vi.fn((relicId: string) => {
      // Relics that exhaust (not purge)
      return ['dominus_orb', 'maw_of_worlds', 'scepter_of_emelpar', 'the_crown_of_emphidia', 'the_prophets_tears'].includes(relicId);
    }),
    isPurgeable: vi.fn((relicId: string) => {
      // Relics that are purged on use
      return ['stellar_converter', 'the_codex'].includes(relicId);
    }),
    getRelicName: vi.fn((relicId: string) => {
      const names: Record<string, string> = {
        dominus_orb: 'Dominus Orb',
        maw_of_worlds: 'Maw of Worlds',
        scepter_of_emelpar: 'Scepter of Emelpar',
        shard_of_the_throne: 'Shard of the Throne',
        stellar_converter: 'Stellar Converter',
        the_codex: 'The Codex',
        the_crown_of_emphidia: 'The Crown of Emphidia',
        the_crown_of_thalnos: 'The Crown of Thalnos',
        the_obsidian: 'The Obsidian',
        the_prophets_tears: "The Prophet's Tears",
      };
      return names[relicId] || relicId;
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
    actionCards: [],
    scoredObjectives: [],
    secretObjectives: [],
    relics: [],
    exhaustedRelics: [],
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
    players: [createMockPlayer()],
    map: {
      tiles: [createMockTile({ q: 0, r: 0 })],
      playerCount: 6,
    },
    objectives: {
      publicStageI: [],
      publicStageII: [],
      revealedCount: 0,
      secretDeck: [],
    },
    laws: [],
    actionCardDeck: [],
    actionCardDiscard: [],
    agendaDeck: [],
    relicDeck: [],
    relicDiscard: [],
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

describe('Relic Handlers', () => {
  describe('handleUseRelic', () => {
    describe('common validations', () => {
      it('should fail if player not found', () => {
        const state = createMockGameState();
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'nonexistent',
          relicId: 'dominus_orb',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Player not found');
      });

      it('should fail if player does not own the relic', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: [] })],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'dominus_orb',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('You do not own this relic');
      });

      it('should fail if exhaustable relic is already exhausted', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              relics: ['dominus_orb'],
              exhaustedRelics: ['dominus_orb'],
            }),
          ],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'dominus_orb',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Relic is exhausted');
      });

      it('should fail if relic ID is invalid', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['fake_relic'] })],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'fake_relic',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid relic');
      });
    });

    describe('Dominus Orb', () => {
      it('should exhaust Dominus Orb when used', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              relics: ['dominus_orb'],
              exhaustedRelics: [],
            }),
          ],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'dominus_orb',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        expect(result.triggeredEvents).toContain('relic_used');
        expect(state.players[0].exhaustedRelics).toContain('dominus_orb');
        expect(state.players[0].relics).toContain('dominus_orb'); // Not purged
      });
    });

    describe('Maw of Worlds', () => {
      it('should fail without technology specified', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              relics: ['maw_of_worlds'],
              planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
            }),
          ],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'maw_of_worlds',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Must specify technology to gain');
      });

      it('should exhaust all planets and grant technology', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              relics: ['maw_of_worlds'],
              technologies: [],
              planets: [
                { planetId: 'jord', exhausted: false, attachments: [] },
                { planetId: 'abyz', exhausted: false, attachments: [] },
                { planetId: 'fria', exhausted: true, attachments: [] }, // Already exhausted
              ],
            }),
          ],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'maw_of_worlds',
          targets: { techId: 'war_sun' },
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        expect(state.players[0].technologies).toContain('war_sun');
        // All planets should be exhausted
        expect(state.players[0].planets.every((p) => p.exhausted)).toBe(true);
        expect(state.players[0].exhaustedRelics).toContain('maw_of_worlds');
      });

      it('should not duplicate technology if player already has it', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              relics: ['maw_of_worlds'],
              technologies: ['war_sun'],
              planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
            }),
          ],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'maw_of_worlds',
          targets: { techId: 'war_sun' },
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        // Should still have exactly 1 copy
        expect(state.players[0].technologies.filter((t) => t === 'war_sun')).toHaveLength(1);
      });
    });

    describe('Stellar Converter', () => {
      it('should fail without planet specified', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['stellar_converter'] })],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'stellar_converter',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Must specify planet to destroy');
      });

      it('should fail if planet not found', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['stellar_converter'] })],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'stellar_converter',
          targets: { planetId: 'nonexistent_planet' },
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Planet not found');
      });

      it('should destroy planet and purge relic', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['stellar_converter'] })],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [
                  { planetId: 'target_planet', attachments: ['research_station'] } as any,
                ],
                units: [
                  { id: 'unit1', type: 'infantry', ownerId: 'player2', planetId: 'target_planet' } as any,
                  { id: 'unit2', type: 'mech', ownerId: 'player2', planetId: 'target_planet' } as any,
                  { id: 'unit3', type: 'carrier', ownerId: 'player1' } as any, // Space unit, should remain
                ],
              }),
            ],
            playerCount: 6,
          },
          relicDiscard: [],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'stellar_converter',
          targets: { planetId: 'target_planet' },
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        // Units on planet destroyed
        const remainingUnits = state.map.tiles[0].units;
        expect(remainingUnits).toHaveLength(1);
        expect(remainingUnits[0].id).toBe('unit3'); // Carrier remains
        // Attachments cleared
        expect(state.map.tiles[0].planets[0].attachments).toHaveLength(0);
        // Relic purged
        expect(state.players[0].relics).not.toContain('stellar_converter');
        expect(state.relicDiscard).toContain('stellar_converter');
      });
    });

    describe('The Codex', () => {
      it('should fail without action cards specified', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['the_codex'] })],
          actionCardDiscard: ['sabotage', 'direct_hit'],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_codex',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Must specify action cards to take');
      });

      it('should fail if trying to take more than 3 cards', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['the_codex'] })],
          actionCardDiscard: ['card1', 'card2', 'card3', 'card4'],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_codex',
          targets: { actionCardIds: ['card1', 'card2', 'card3', 'card4'] },
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Can only take up to 3 action cards');
      });

      it('should fail if card not in discard pile', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['the_codex'] })],
          actionCardDiscard: ['sabotage'],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_codex',
          targets: { actionCardIds: ['direct_hit'] },
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('not in discard pile');
      });

      it('should take cards from discard and purge relic', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              relics: ['the_codex'],
              actionCards: [],
            }),
          ],
          actionCardDiscard: ['sabotage', 'direct_hit', 'flank_speed', 'skilled_retreat'],
          relicDiscard: [],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_codex',
          targets: { actionCardIds: ['sabotage', 'direct_hit', 'flank_speed'] },
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        expect(state.players[0].actionCards).toContain('sabotage');
        expect(state.players[0].actionCards).toContain('direct_hit');
        expect(state.players[0].actionCards).toContain('flank_speed');
        expect(state.actionCardDiscard).not.toContain('sabotage');
        expect(state.actionCardDiscard).toContain('skilled_retreat'); // Not taken
        // Relic purged
        expect(state.players[0].relics).not.toContain('the_codex');
        expect(state.relicDiscard).toContain('the_codex');
      });
    });

    describe('The Crown of Emphidia', () => {
      it('should fail without planet specified', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['the_crown_of_emphidia'] })],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_crown_of_emphidia',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Must specify planet to explore');
      });

      it('should fail if player does not control the planet', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              relics: ['the_crown_of_emphidia'],
              planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
            }),
          ],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_crown_of_emphidia',
          targets: { planetId: 'uncontrolled_planet' },
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('You do not control this planet');
      });

      it('should exhaust and allow exploration of controlled planet', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              relics: ['the_crown_of_emphidia'],
              planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
            }),
          ],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_crown_of_emphidia',
          targets: { planetId: 'jord' },
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        expect(state.players[0].exhaustedRelics).toContain('the_crown_of_emphidia');
        expect((result.data as any)?.effect.planetToExplore).toBe('jord');
      });
    });

    describe('The Obsidian', () => {
      it('should draw secret objective from deck when available', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              relics: ['the_obsidian'],
              secretObjectives: ['existing_secret'],
            }),
          ],
          objectives: {
            publicStageI: [],
            publicStageII: [],
            revealedCount: 0,
            secretDeck: ['new_secret_1', 'new_secret_2'],
          },
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_obsidian',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        expect(state.players[0].secretObjectives).toContain('new_secret_1');
        expect(state.objectives.secretDeck).not.toContain('new_secret_1');
      });

      it('should handle empty secret deck gracefully', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              relics: ['the_obsidian'],
            }),
          ],
          objectives: {
            publicStageI: [],
            publicStageII: [],
            revealedCount: 0,
            secretDeck: [],
          },
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_obsidian',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        expect((result.data as any)?.effect.effect).toBe('extra_secret_objective_capacity');
      });
    });

    describe('passive relics', () => {
      it('should return success for Scepter of Emelpar (passive effect)', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['scepter_of_emelpar'] })],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'scepter_of_emelpar',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        expect(state.players[0].exhaustedRelics).toContain('scepter_of_emelpar');
      });

      it('should return success for The Crown of Thalnos (passive effect)', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['the_crown_of_thalnos'] })],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_crown_of_thalnos',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        expect((result.data as any)?.effect.effect).toBe('combat_reroll_passive');
      });

      it('should return success for The Prophet\'s Tears (passive effect)', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ relics: ['the_prophets_tears'] })],
        });
        const action: UseRelicAction = {
          type: 'use_relic',
          playerId: 'player1',
          relicId: 'the_prophets_tears',
          timestamp: Date.now(),
        };

        const result = handleUseRelic(state, action);

        expect(result.success).toBe(true);
        expect(state.players[0].exhaustedRelics).toContain('the_prophets_tears');
      });
    });
  });

  describe('handleReadyRelic', () => {
    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action: ReadyRelicAction = {
        type: 'ready_relic',
        playerId: 'nonexistent',
        relicId: 'dominus_orb',
        timestamp: Date.now(),
      };

      const result = handleReadyRelic(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if player does not own the relic', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ relics: [] })],
      });
      const action: ReadyRelicAction = {
        type: 'ready_relic',
        playerId: 'player1',
        relicId: 'dominus_orb',
        timestamp: Date.now(),
      };

      const result = handleReadyRelic(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You do not own this relic');
    });

    it('should fail if relic is not exhausted', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            relics: ['dominus_orb'],
            exhaustedRelics: [],
          }),
        ],
      });
      const action: ReadyRelicAction = {
        type: 'ready_relic',
        playerId: 'player1',
        relicId: 'dominus_orb',
        timestamp: Date.now(),
      };

      const result = handleReadyRelic(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Relic is not exhausted');
    });

    it('should ready an exhausted relic', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            relics: ['dominus_orb'],
            exhaustedRelics: ['dominus_orb'],
          }),
        ],
      });
      const action: ReadyRelicAction = {
        type: 'ready_relic',
        playerId: 'player1',
        relicId: 'dominus_orb',
        timestamp: Date.now(),
      };

      const result = handleReadyRelic(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('relic_readied');
      expect(state.players[0].exhaustedRelics).not.toContain('dominus_orb');
    });
  });

  describe('readyAllRelics', () => {
    it('should ready all exhausted relics for a player', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            relics: ['dominus_orb', 'maw_of_worlds', 'scepter_of_emelpar'],
            exhaustedRelics: ['dominus_orb', 'maw_of_worlds'],
          }),
        ],
      });

      readyAllRelics(state, 'player1');

      expect(state.players[0].exhaustedRelics).toHaveLength(0);
    });

    it('should handle player with no exhausted relics', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            relics: ['dominus_orb'],
            exhaustedRelics: [],
          }),
        ],
      });

      readyAllRelics(state, 'player1');

      expect(state.players[0].exhaustedRelics).toHaveLength(0);
    });

    it('should do nothing for nonexistent player', () => {
      const state = createMockGameState();

      // Should not throw
      expect(() => readyAllRelics(state, 'nonexistent')).not.toThrow();
    });
  });

  describe('hasReadyRelic', () => {
    it('should return true if player has ready relic', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            relics: ['dominus_orb'],
            exhaustedRelics: [],
          }),
        ],
      });

      expect(hasReadyRelic(state, 'player1', 'dominus_orb')).toBe(true);
    });

    it('should return false if player does not have the relic', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ relics: [] })],
      });

      expect(hasReadyRelic(state, 'player1', 'dominus_orb')).toBe(false);
    });

    it('should return false if relic is exhausted', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            relics: ['dominus_orb'],
            exhaustedRelics: ['dominus_orb'],
          }),
        ],
      });

      expect(hasReadyRelic(state, 'player1', 'dominus_orb')).toBe(false);
    });

    it('should return false for nonexistent player', () => {
      const state = createMockGameState();

      expect(hasReadyRelic(state, 'nonexistent', 'dominus_orb')).toBe(false);
    });
  });

  describe('getPlayerRelics', () => {
    it('should return all relics owned by player', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            relics: ['dominus_orb', 'maw_of_worlds', 'shard_of_the_throne'],
          }),
        ],
      });

      const relics = getPlayerRelics(state, 'player1');

      expect(relics).toHaveLength(3);
      expect(relics).toContain('dominus_orb');
      expect(relics).toContain('maw_of_worlds');
      expect(relics).toContain('shard_of_the_throne');
    });

    it('should return empty array if player has no relics', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ relics: [] })],
      });

      const relics = getPlayerRelics(state, 'player1');

      expect(relics).toHaveLength(0);
    });

    it('should return empty array for nonexistent player', () => {
      const state = createMockGameState();

      const relics = getPlayerRelics(state, 'nonexistent');

      expect(relics).toHaveLength(0);
    });
  });

  describe('getShardOfThroneOwner', () => {
    it('should return player ID who owns Shard of the Throne', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1', relics: [] }),
          createMockPlayer({ id: 'player2', relics: ['shard_of_the_throne'] }),
        ],
      });

      const owner = getShardOfThroneOwner(state);

      expect(owner).toBe('player2');
    });

    it('should return null if no one owns Shard of the Throne', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1', relics: ['dominus_orb'] }),
          createMockPlayer({ id: 'player2', relics: ['maw_of_worlds'] }),
        ],
      });

      const owner = getShardOfThroneOwner(state);

      expect(owner).toBeNull();
    });
  });

  describe('handleShardTransfer', () => {
    it('should transfer Shard of the Throne between players', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            relics: ['shard_of_the_throne'],
            score: 5,
          }),
          createMockPlayer({
            id: 'player2',
            relics: [],
            score: 3,
          }),
        ],
      });

      handleShardTransfer(state, 'player2', 'player1');

      expect(state.players[0].relics).not.toContain('shard_of_the_throne');
      expect(state.players[1].relics).toContain('shard_of_the_throne');
      expect(state.players[0].score).toBe(4); // Lost 1 VP
      expect(state.players[1].score).toBe(4); // Gained 1 VP
    });

    it('should not reduce VP below 0', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            relics: ['shard_of_the_throne'],
            score: 0,
          }),
          createMockPlayer({
            id: 'player2',
            relics: [],
            score: 3,
          }),
        ],
      });

      handleShardTransfer(state, 'player2', 'player1');

      expect(state.players[0].score).toBe(0);
      expect(state.players[1].score).toBe(4);
    });

    it('should do nothing if previous owner does not have Shard', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            relics: ['dominus_orb'],
            score: 5,
          }),
          createMockPlayer({
            id: 'player2',
            relics: [],
            score: 3,
          }),
        ],
      });

      handleShardTransfer(state, 'player2', 'player1');

      expect(state.players[0].score).toBe(5); // Unchanged
      expect(state.players[1].score).toBe(3); // Unchanged
    });

    it('should initialize relics array if new owner has none', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            relics: ['shard_of_the_throne'],
            score: 5,
          }),
          {
            ...createMockPlayer({ id: 'player2', score: 3 }),
            relics: undefined,
          } as PlayerState,
        ],
      });

      handleShardTransfer(state, 'player2', 'player1');

      expect(state.players[1].relics).toContain('shard_of_the_throne');
    });

    it('should transfer correctly when both players are valid', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            name: 'Alice',
            relics: ['shard_of_the_throne'],
            score: 5,
          }),
          createMockPlayer({
            id: 'player2',
            name: 'Bob',
            relics: [],
            score: 3,
          }),
        ],
      });

      handleShardTransfer(state, 'player2', 'player1');

      // Verify transfer happened correctly
      expect(state.players[0].relics).not.toContain('shard_of_the_throne');
      expect(state.players[1].relics).toContain('shard_of_the_throne');
      expect(state.players[0].score).toBe(4);
      expect(state.players[1].score).toBe(4);
    });
  });
});
