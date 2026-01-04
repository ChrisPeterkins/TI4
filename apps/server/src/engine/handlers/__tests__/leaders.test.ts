import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleUseAgent,
  handleUnlockCommander,
  handlePurgeHero,
  readyAllAgents,
  checkAllCommanderUnlocks,
  checkAllHeroUnlocks,
} from '../leaders.js';
import type {
  GameState,
  PlayerState,
  UseAgentAction,
  UnlockCommanderAction,
  PurgeHeroAction,
  MapTile,
  HexCoord,
} from '@ti4/shared';

// Mock the game-log module
vi.mock('../../utils/game-log.js', () => ({
  addLogEntry: vi.fn(),
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
    commandTokens: {
      tactics: 3,
      fleet: 3,
      strategy: 2,
    },
    exhaustedPlanets: [],
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    strategyCard: null,
    passed: false,
    speaker: false,
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
    players: [createMockPlayer()],
    map: {
      tiles: [createMockTile({ q: 0, r: 0 })],
      playerCount: 6,
    },
    objectives: {
      publicStageI: [],
      publicStageII: [],
      revealedCount: 0,
      secretDeck: ['secret1', 'secret2', 'secret3'],
    },
    laws: [],
    actionCardDeck: ['action1', 'action2', 'action3'],
    agendaDeck: [],
    relicDeck: ['relic1', 'relic2'],
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

describe('Leader Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleUseAgent', () => {
    it('should exhaust agent when used', () => {
      const state = createMockGameState();
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleUseAgent(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].leaders!.agent.exhausted).toBe(true);
    });

    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'nonexistent',
        timestamp: Date.now(),
      };

      const result = handleUseAgent(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if leaders not initialized', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ leaders: undefined })],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleUseAgent(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Leaders not initialized');
    });

    it('should fail if agent is not unlocked', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            leaders: {
              agent: { unlocked: false, exhausted: false },
              commander: { unlocked: false },
              hero: { unlocked: false, purged: false },
            },
          }),
        ],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleUseAgent(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Agent is not unlocked');
    });

    it('should fail if agent is exhausted', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            leaders: {
              agent: { unlocked: true, exhausted: true },
              commander: { unlocked: false },
              hero: { unlocked: false, purged: false },
            },
          }),
        ],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleUseAgent(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Agent is exhausted');
    });

    it('should apply gain_trade_goods effect', () => {
      // Hacan agent gives trade goods
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'hacan',
            tradeGoods: 0,
          }),
        ],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleUseAgent(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('agent_used');
    });

    it('should apply draw_action_cards effect', () => {
      // Some agents draw action cards
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'yssaril',
            actionCards: [],
          }),
        ],
        actionCardDeck: ['card1', 'card2', 'card3'],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleUseAgent(state, action);

      expect(result.success).toBe(true);
    });

    it('should apply agent effect with target player', () => {
      const player1 = createMockPlayer({
        id: 'player1',
        faction: 'keleres_argent',
        commodities: 2,
        maxCommodities: 4,
      });
      const player2 = createMockPlayer({
        id: 'player2',
        faction: 'hacan',
        commodities: 3,
        maxCommodities: 5,
        tradeGoods: 0,
      });
      const state = createMockGameState({
        players: [player1, player2],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
        targetPlayerId: 'player2',
        timestamp: Date.now(),
      };

      const result = handleUseAgent(state, action);

      expect(result.success).toBe(true);
    });
  });

  describe('handleUnlockCommander', () => {
    it('should unlock commander when conditions met', () => {
      // Sol commander: Control planets with 12+ combined resources
      // Using real planets: jord (4 res), moll_primus (4 res), arc_prime (4 res) = 12 total
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'sol',
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'jord', controlledBy: 'player1', units: [], exhausted: false } as any,
                { planetId: 'moll_primus', controlledBy: 'player1', units: [], exhausted: false } as any,
                { planetId: 'arc_prime', controlledBy: 'player1', units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: UnlockCommanderAction = {
        type: 'unlock_commander',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleUnlockCommander(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].leaders!.commander.unlocked).toBe(true);
      expect(result.triggeredEvents).toContain('commander_unlocked');
    });

    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action: UnlockCommanderAction = {
        type: 'unlock_commander',
        playerId: 'nonexistent',
        timestamp: Date.now(),
      };

      const result = handleUnlockCommander(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if leaders not initialized', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ leaders: undefined })],
      });
      const action: UnlockCommanderAction = {
        type: 'unlock_commander',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleUnlockCommander(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Leaders not initialized');
    });

    it('should fail if commander already unlocked', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: false, purged: false },
            },
          }),
        ],
      });
      const action: UnlockCommanderAction = {
        type: 'unlock_commander',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleUnlockCommander(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Commander already unlocked');
    });

    it('should fail if unlock conditions not met', () => {
      // Sol commander needs 12+ combined resources on controlled planets
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'sol',
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'p1', controlledBy: 'player1', resources: 2, influence: 1, units: [], exhausted: false } as any,
                { planetId: 'p2', controlledBy: 'player1', resources: 3, influence: 2, units: [], exhausted: false } as any,
              ], // Only 5 resources
            }),
          ],
          playerCount: 6,
        },
      });
      const action: UnlockCommanderAction = {
        type: 'unlock_commander',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handleUnlockCommander(state, action);

      expect(result.success).toBe(false);
    });
  });

  describe('handlePurgeHero', () => {
    it('should purge hero when used', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'sol',
            scoredObjectives: ['obj1', 'obj2', 'obj3'],
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: false },
            },
          }),
        ],
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].leaders!.hero.purged).toBe(true);
      expect(result.triggeredEvents).toContain('hero_purged');
    });

    it('should fail if hero not unlocked', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: false },
              hero: { unlocked: false, purged: false },
            },
          }),
        ],
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hero is not unlocked - score 3 objectives first');
    });

    it('should fail if hero already purged', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: false },
              hero: { unlocked: true, purged: true },
            },
          }),
        ],
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hero has already been used');
    });

    it('should apply Sol hero effect (infantry on each planet)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'sol',
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: false },
            },
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'planet1', controlledBy: 'player1', units: [], exhausted: false } as any,
                { planetId: 'planet2', controlledBy: 'player1', units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      // Sol hero places 1 infantry on each controlled planet
      const planet1 = state.map.tiles[0].planets[0];
      const planet2 = state.map.tiles[0].planets[1];
      expect(planet1.units.some(u => u.type === 'infantry')).toBe(true);
      expect(planet2.units.some(u => u.type === 'infantry')).toBe(true);
    });

    it('should apply Hacan hero effect (take all trade goods)', () => {
      const player1 = createMockPlayer({
        id: 'player1',
        faction: 'hacan',
        tradeGoods: 0,
        leaders: {
          agent: { unlocked: true, exhausted: false },
          commander: { unlocked: true },
          hero: { unlocked: true, purged: false },
        },
      });
      const player2 = createMockPlayer({
        id: 'player2',
        faction: 'sol',
        tradeGoods: 5,
      });
      const player3 = createMockPlayer({
        id: 'player3',
        faction: 'letnev',
        tradeGoods: 3,
      });
      const state = createMockGameState({
        players: [player1, player2, player3],
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      // Hacan hero takes all trade goods from other players
      expect(state.players[0].tradeGoods).toBe(8); // 5 + 3
      expect(state.players[1].tradeGoods).toBe(0);
      expect(state.players[2].tradeGoods).toBe(0);
    });

    it('should apply Arborec hero effect (2 infantry + 1 mech per planet)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'arborec',
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: false },
            },
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'planet1', controlledBy: 'player1', units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      const planet = state.map.tiles[0].planets[0];
      const infantryCount = planet.units.filter(u => u.type === 'infantry').length;
      const mechCount = planet.units.filter(u => u.type === 'mech').length;
      expect(infantryCount).toBe(2);
      expect(mechCount).toBe(1);
    });

    it('should apply L1Z1X hero effect (destroy infantry and fighters)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'l1z1x',
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: false },
            },
          }),
          createMockPlayer({
            id: 'player2',
            faction: 'sol',
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              systemId: 42,
              units: [
                { id: 'f1', type: 'fighter', ownerId: 'player2', damaged: false },
                { id: 'c1', type: 'cruiser', ownerId: 'player2', damaged: false },
              ],
              planets: [
                {
                  planetId: 'planet1',
                  controlledBy: 'player2',
                  units: [
                    { id: 'i1', type: 'infantry', ownerId: 'player2', damaged: false },
                    { id: 'i2', type: 'infantry', ownerId: 'player2', damaged: false },
                    { id: 'm1', type: 'mech', ownerId: 'player2', damaged: false },
                  ],
                  exhausted: false,
                } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        targets: { systemId: '42' },
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      // L1Z1X hero destroys all enemy infantry and fighters
      const tile = state.map.tiles[0];
      expect(tile.units.some(u => u.type === 'fighter')).toBe(false);
      expect(tile.units.some(u => u.type === 'cruiser')).toBe(true); // Non-fighters preserved
      const planet = tile.planets[0];
      expect(planet.units.some(u => u.type === 'infantry')).toBe(false);
      expect(planet.units.some(u => u.type === 'mech')).toBe(true); // Non-infantry preserved
    });

    it('should apply Saar hero effect (gain relic)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'saar',
            relics: [],
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: false },
            },
          }),
        ],
        relicDeck: ['the_crown_of_emphidia', 'maw_of_worlds'],
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].relics).toContain('the_crown_of_emphidia');
      expect(state.relicDeck).not.toContain('the_crown_of_emphidia');
    });

    it('should apply Winnu hero effect (ready planets per tech)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'winnu',
            technologies: ['neural_motivator', 'sarween_tools', 'antimass_deflectors'],
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: false },
            },
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'planet1', controlledBy: 'player1', units: [], exhausted: true } as any,
                { planetId: 'planet2', controlledBy: 'player1', units: [], exhausted: true } as any,
                { planetId: 'planet3', controlledBy: 'player1', units: [], exhausted: true } as any,
                { planetId: 'planet4', controlledBy: 'player1', units: [], exhausted: true } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      // Winnu hero readies 1 planet per tech (3 techs = 3 planets readied)
      const planets = state.map.tiles[0].planets;
      const readyCount = planets.filter(p => !p.exhausted).length;
      expect(readyCount).toBe(3);
    });
  });

  describe('readyAllAgents', () => {
    it('should ready all exhausted agents', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            leaders: {
              agent: { unlocked: true, exhausted: true },
              commander: { unlocked: false },
              hero: { unlocked: false, purged: false },
            },
          }),
          createMockPlayer({
            id: 'player2',
            leaders: {
              agent: { unlocked: true, exhausted: true },
              commander: { unlocked: false },
              hero: { unlocked: false, purged: false },
            },
          }),
        ],
      });

      readyAllAgents(state);

      expect(state.players[0].leaders!.agent.exhausted).toBe(false);
      expect(state.players[1].leaders!.agent.exhausted).toBe(false);
    });

    it('should handle players without leaders', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({ leaders: undefined }),
          createMockPlayer({
            leaders: {
              agent: { unlocked: true, exhausted: true },
              commander: { unlocked: false },
              hero: { unlocked: false, purged: false },
            },
          }),
        ],
      });

      // Should not throw
      readyAllAgents(state);

      expect(state.players[1].leaders!.agent.exhausted).toBe(false);
    });
  });

  describe('checkAllCommanderUnlocks', () => {
    it('should unlock commanders for eligible players', () => {
      // Sol needs 12+ resources
      // Using real planets: jord (4 res), moll_primus (4 res), arc_prime (4 res), axis (5 res) = 17 total
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'sol',
          }),
          createMockPlayer({
            id: 'player2',
            faction: 'hacan',
            tradeGoods: 5, // Hacan needs 10 TGs
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'jord', controlledBy: 'player1', units: [], exhausted: false } as any,
                { planetId: 'moll_primus', controlledBy: 'player1', units: [], exhausted: false } as any,
                { planetId: 'arc_prime', controlledBy: 'player1', units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const unlocked = checkAllCommanderUnlocks(state);

      expect(unlocked).toContain('player1');
      expect(unlocked).not.toContain('player2');
      expect(state.players[0].leaders!.commander.unlocked).toBe(true);
      expect(state.players[1].leaders!.commander.unlocked).toBe(false);
    });

    it('should not unlock already unlocked commanders', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'sol',
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true }, // Already unlocked
              hero: { unlocked: false, purged: false },
            },
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'p1', controlledBy: 'player1', resources: 15, influence: 5, units: [], exhausted: false } as any,
              ], // Meets requirements but already unlocked
            }),
          ],
          playerCount: 6,
        },
      });

      const unlocked = checkAllCommanderUnlocks(state);

      expect(unlocked).toHaveLength(0);
    });

    it('should return empty array when no players qualify', () => {
      // Sol commander needs 12+ combined resources on controlled planets
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'sol',
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'p1', controlledBy: 'player1', resources: 3, influence: 2, units: [], exhausted: false } as any,
              ], // Only 3 resources < 12
            }),
          ],
          playerCount: 6,
        },
      });

      const unlocked = checkAllCommanderUnlocks(state);

      expect(unlocked).toHaveLength(0);
    });
  });

  describe('checkAllHeroUnlocks', () => {
    it('should unlock heroes for players with 3+ objectives', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            scoredObjectives: ['obj1', 'obj2', 'obj3'],
          }),
          createMockPlayer({
            id: 'player2',
            scoredObjectives: ['obj1', 'obj2'],
          }),
        ],
      });

      const unlocked = checkAllHeroUnlocks(state);

      expect(unlocked).toContain('player1');
      expect(unlocked).not.toContain('player2');
      expect(state.players[0].leaders!.hero.unlocked).toBe(true);
      expect(state.players[1].leaders!.hero.unlocked).toBe(false);
    });

    it('should not unlock already unlocked heroes', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            scoredObjectives: ['obj1', 'obj2', 'obj3', 'obj4'],
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: false },
              hero: { unlocked: true, purged: false }, // Already unlocked
            },
          }),
        ],
      });

      const unlocked = checkAllHeroUnlocks(state);

      expect(unlocked).toHaveLength(0);
    });

    it('should return empty array when no players qualify', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            scoredObjectives: ['obj1', 'obj2'], // Only 2
          }),
        ],
      });

      const unlocked = checkAllHeroUnlocks(state);

      expect(unlocked).toHaveLength(0);
    });
  });

  describe('Special Hero Effects', () => {
    it('should not purge Titans hero (attaches to Elysium instead)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'titans',
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: false },
            },
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { id: 'e1', planetId: 'elysium', controlledBy: 'player1', units: [], exhausted: false, attachments: [] } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      // Titans hero should NOT be purged - it attaches to Elysium
      expect(state.players[0].leaders!.hero.purged).toBe(false);
      // The hero should be attached to Elysium
      const elysium = state.map.tiles[0].planets.find(p => p.planetId === 'elysium');
      expect(elysium?.attachments).toContain('titans_hero');
    });

    it('should apply Cabal hero effect (capture all enemy units on controlled planets)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'cabal',
            capturedUnits: [],
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: false },
            },
          }),
          createMockPlayer({
            id: 'player2',
            faction: 'sol',
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                {
                  id: 'p1',
                  planetId: 'planet1',
                  controlledBy: 'player1', // Cabal controls this planet
                  units: [
                    { id: 'i1', type: 'infantry', ownerId: 'player2', damaged: false }, // Enemy infantry
                    { id: 'i2', type: 'infantry', ownerId: 'player2', damaged: false }, // Enemy infantry
                    { id: 'm1', type: 'mech', ownerId: 'player2', damaged: false }, // Enemy mech
                    { id: 'sd1', type: 'space_dock', ownerId: 'player2', damaged: false }, // Structure - not captured
                  ],
                  exhausted: false,
                  attachments: [],
                } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      // Should have captured 3 units (2 infantry + 1 mech, not the space dock)
      expect(state.players[0].capturedUnits?.length).toBe(3);
      // Planet should only have the structure left
      const planet = state.map.tiles[0].planets[0];
      expect(planet.units.length).toBe(1);
      expect(planet.units[0].type).toBe('space_dock');
    });

    it('should apply Mahact hero effect (purge collected tokens for trade goods)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'mahact',
            tradeGoods: 2,
            collectedCommandTokens: { player2: 3, player3: 2 }, // 5 tokens total
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: false },
            },
          }),
        ],
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      // Should have gained 5 trade goods from purging 5 command tokens
      expect(state.players[0].tradeGoods).toBe(7); // 2 + 5 = 7
      // Collected tokens should be cleared
      expect(Object.keys(state.players[0].collectedCommandTokens || {}).length).toBe(0);
    });

    it('should apply Naaz-Rokha hero effect (gain relic)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'naazrokha',
            relics: [],
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: false },
            },
          }),
        ],
        relicDeck: ['shard_of_the_throne', 'the_obsidian'],
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
        timestamp: Date.now(),
      };

      const result = handlePurgeHero(state, action);

      expect(result.success).toBe(true);
      // Should have gained the top relic
      expect(state.players[0].relics).toContain('shard_of_the_throne');
      expect(state.relicDeck).not.toContain('shard_of_the_throne');
    });
  });
});
