import { describe, it, expect } from 'vitest';
import {
  validateUseAgent,
  validatePurgeHero,
  canUnlockCommander,
  canUnlockHero,
} from '../leaders.js';
import type {
  GameState,
  PlayerState,
  UseAgentAction,
  PurgeHeroAction,
  MapTile,
  HexCoord,
} from '@ti4/shared';

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

describe('Leader Validators', () => {
  describe('validateUseAgent', () => {
    it('should validate agent use successfully', () => {
      const state = createMockGameState();
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
      };

      const result = validateUseAgent(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'nonexistent',
      };

      const result = validateUseAgent(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if leaders not initialized', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ leaders: undefined })],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
      };

      const result = validateUseAgent(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Leaders not initialized');
    });

    it('should fail if agent not unlocked', () => {
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
      };

      const result = validateUseAgent(state, action);

      expect(result.valid).toBe(false);
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
      };

      const result = validateUseAgent(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Agent is exhausted');
    });

    it('should fail ACTION agent outside action phase', () => {
      // Hacan agent is an ACTION: ability
      const state = createMockGameState({
        phase: 'strategy',
        subPhase: null,
        players: [createMockPlayer({ faction: 'hacan' })],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
      };

      const result = validateUseAgent(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Agent action can only be used during action phase');
    });

    it('should fail ACTION agent when not awaiting_action', () => {
      // Hacan agent is an ACTION: ability
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'tactical_movement',
        players: [createMockPlayer({ faction: 'hacan' })],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
      };

      const result = validateUseAgent(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Agent action can only be used when awaiting action');
    });

    it('should fail ACTION agent on another players turn', () => {
      // Hacan agent is an ACTION: ability
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'awaiting_action',
        activePlayerId: 'player2',
        players: [createMockPlayer({ faction: 'hacan' })],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
      };

      const result = validateUseAgent(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Agent action can only be used on your turn');
    });

    it('should validate target player if specified', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({ id: 'player1', faction: 'hacan' }),
          createMockPlayer({ id: 'player2', faction: 'sol' }),
        ],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
        targetPlayerId: 'player2',
      };

      const result = validateUseAgent(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if target player not found', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'hacan' })],
      });
      const action: UseAgentAction = {
        type: 'use_agent',
        playerId: 'player1',
        targetPlayerId: 'nonexistent',
      };

      const result = validateUseAgent(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Target player not found');
    });
  });

  describe('validatePurgeHero', () => {
    it('should validate hero purge successfully', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
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
      };

      const result = validatePurgeHero(state, action);

      expect(result.valid).toBe(true);
    });

    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'nonexistent',
      };

      const result = validatePurgeHero(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if leaders not initialized', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ leaders: undefined })],
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
      };

      const result = validatePurgeHero(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Leaders not initialized');
    });

    it('should fail if hero not unlocked', () => {
      const state = createMockGameState();
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
      };

      const result = validatePurgeHero(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Hero is not unlocked - score 3 objectives first');
    });

    it('should fail if hero already purged', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: true },
              hero: { unlocked: true, purged: true },
            },
          }),
        ],
      });
      const action: PurgeHeroAction = {
        type: 'purge_hero',
        playerId: 'player1',
      };

      const result = validatePurgeHero(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Hero has already been used');
    });

    it('should fail ACTION hero outside action phase', () => {
      const state = createMockGameState({
        phase: 'status',
        players: [
          createMockPlayer({
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
      };

      const result = validatePurgeHero(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Hero action can only be used during action phase');
    });

    it('should fail ACTION hero on another players turn', () => {
      const state = createMockGameState({
        activePlayerId: 'player2',
        players: [
          createMockPlayer({
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
      };

      const result = validatePurgeHero(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Hero action can only be used on your turn');
    });
  });

  describe('canUnlockCommander', () => {
    it('should return false if player not found', () => {
      const state = createMockGameState();

      const result = canUnlockCommander(state, 'nonexistent');

      expect(result.canUnlock).toBe(false);
      expect(result.reason).toBe('Player not found');
    });

    it('should return false if commander already unlocked', () => {
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

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
      expect(result.reason).toBe('Commander already unlocked');
    });

    // Have scored secrets condition
    it('should check have_scored_secrets condition (Nomad)', () => {
      // Nomad commander requires 1 scored secret objective
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'nomad',
            scoredSecretObjectives: ['secret1'],
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail have_scored_secrets if none scored', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'nomad',
            scoredSecretObjectives: [],
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Control Mecatol or win combat condition (Winnu)
    it('should check control_mecatol_or_combat condition via Mecatol (Winnu)', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'winnu' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              systemId: 18, // Mecatol Rex
              planets: [
                { planetId: 'mecatol_rex', controlledBy: 'player1', units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should check control_mecatol_or_combat condition via combat in Mecatol (Winnu)', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'winnu', hadCombatInMecatol: true })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              systemId: 18,
              planets: [
                { planetId: 'mecatol_rex', controlledBy: 'player2', units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail control_mecatol_or_combat if neither condition met', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'winnu', hadCombatInMecatol: false })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              systemId: 18,
              planets: [
                { planetId: 'mecatol_rex', controlledBy: 'player2', units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
      expect(result.reason).toBe('Must control Mecatol Rex or fight in Mecatol system');
    });

    // Have technologies condition
    it('should check have_technologies condition (Jol-Nar - 8 techs)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'jolnar',
            technologies: ['tech1', 'tech2', 'tech3', 'tech4', 'tech5', 'tech6', 'tech7', 'tech8'],
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail have_technologies if not enough (need 8)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'jolnar',
            technologies: ['tech1', 'tech2', 'tech3', 'tech4', 'tech5', 'tech6', 'tech7'], // Only 7
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Have trade goods condition
    it('should check have_trade_goods condition (Hacan - 10 TG)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'hacan',
            tradeGoods: 10,
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail have_trade_goods if not enough (need 10)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'hacan',
            tradeGoods: 9,
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Control resources condition
    it('should check control_resources condition (Sol - 12 resources)', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'sol' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'p1', controlledBy: 'player1', resources: 5, influence: 2, units: [], exhausted: false } as any,
                { planetId: 'p2', controlledBy: 'player1', resources: 4, influence: 3, units: [], exhausted: false } as any,
                { planetId: 'p3', controlledBy: 'player1', resources: 4, influence: 2, units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail control_resources if not enough (need 12)', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'sol' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'p1', controlledBy: 'player1', resources: 3, influence: 2, units: [], exhausted: false } as any,
                { planetId: 'p2', controlledBy: 'player1', resources: 3, influence: 3, units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Have action cards condition
    it('should check have_action_cards condition (Yssaril - 7 cards)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'yssaril',
            actionCards: ['card1', 'card2', 'card3', 'card4', 'card5', 'card6', 'card7'],
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail have_action_cards if not enough (need 7)', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'yssaril',
            actionCards: ['card1', 'card2', 'card3', 'card4', 'card5', 'card6'], // Only 6
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Control influence condition
    it('should check control_influence condition (Xxcha - 12 influence)', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'xxcha' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'p1', controlledBy: 'player1', resources: 2, influence: 5, units: [], exhausted: false } as any,
                { planetId: 'p2', controlledBy: 'player1', resources: 3, influence: 4, units: [], exhausted: false } as any,
                { planetId: 'p3', controlledBy: 'player1', resources: 1, influence: 4, units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail control_influence if not enough (need 12)', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'xxcha' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'p1', controlledBy: 'player1', resources: 2, influence: 3, units: [], exhausted: false } as any,
                { planetId: 'p2', controlledBy: 'player1', resources: 3, influence: 4, units: [], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Have units total condition
    it('should check have_units_total condition (Arborec - 12 infantry)', () => {
      const infantry = Array.from({ length: 12 }, (_, i) => ({
        id: `infantry${i}`,
        type: 'infantry' as const,
        ownerId: 'player1',
        damaged: false,
      }));
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'arborec' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'planet1', controlledBy: 'player1', units: infantry, exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should count units in space for have_units_total', () => {
      const dreadnoughts = Array.from({ length: 4 }, (_, i) => ({
        id: `dread${i}`,
        type: 'dreadnought' as const,
        ownerId: 'player1',
        damaged: false,
      }));
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'l1z1x' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, { units: dreadnoughts }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail have_units_total if not enough', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'arborec' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                {
                  planetId: 'planet1',
                  controlledBy: 'player1',
                  units: [{ id: 'i1', type: 'infantry', ownerId: 'player1', damaged: false }],
                  exhausted: false,
                } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Have units in system condition
    it('should check have_units_in_system condition (Letnev - 5 non-fighter ships)', () => {
      const ships = [
        { id: 'c1', type: 'cruiser' as const, ownerId: 'player1', damaged: false },
        { id: 'c2', type: 'cruiser' as const, ownerId: 'player1', damaged: false },
        { id: 'd1', type: 'destroyer' as const, ownerId: 'player1', damaged: false },
        { id: 'd2', type: 'dreadnought' as const, ownerId: 'player1', damaged: false },
        { id: 'ca1', type: 'carrier' as const, ownerId: 'player1', damaged: false },
      ];
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'letnev' })],
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units: ships })],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should not count fighters for have_units_in_system (need 5)', () => {
      const units = [
        { id: 'c1', type: 'cruiser' as const, ownerId: 'player1', damaged: false },
        { id: 'c2', type: 'cruiser' as const, ownerId: 'player1', damaged: false },
        { id: 'c3', type: 'cruiser' as const, ownerId: 'player1', damaged: false },
        { id: 'c4', type: 'cruiser' as const, ownerId: 'player1', damaged: false },
        { id: 'f1', type: 'fighter' as const, ownerId: 'player1', damaged: false },
        { id: 'f2', type: 'fighter' as const, ownerId: 'player1', damaged: false },
      ];
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'letnev' })],
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      // 4 cruisers is not enough, need 5 non-fighter ships
      expect(result.canUnlock).toBe(false);
    });

    // Have space docks condition
    it('should check have_space_docks condition (Saar - 3 space docks)', () => {
      const spaceDocks = [
        { planetId: 'p1', controlledBy: 'player1', units: [{ id: 'sd1', type: 'space_dock' as const, ownerId: 'player1', damaged: false }], exhausted: false },
        { planetId: 'p2', controlledBy: 'player1', units: [{ id: 'sd2', type: 'space_dock' as const, ownerId: 'player1', damaged: false }], exhausted: false },
        { planetId: 'p3', controlledBy: 'player1', units: [{ id: 'sd3', type: 'space_dock' as const, ownerId: 'player1', damaged: false }], exhausted: false },
      ];
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'saar' })],
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { planets: spaceDocks as any })],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail have_space_docks if not enough', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'saar' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                {
                  planetId: 'p1',
                  controlledBy: 'player1',
                  units: [{ id: 'sd1', type: 'space_dock', ownerId: 'player1', damaged: false }],
                  exhausted: false,
                } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Custom condition (Argent - 6 units with abilities)
    it('should handle custom condition (Argent)', () => {
      // Argent has a custom unlock condition for units with special abilities
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'argent' })],
        map: {
          tiles: [createMockTile({ q: 0, r: 0 })],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      // Custom condition not fully implemented, should return false with reason
      expect(result.canUnlock).toBe(false);
      expect(result.reason).toBeDefined();
    });

    // Have mechs in systems condition
    it('should check have_mechs_in_systems condition (Naaz-Rokha - 3 systems)', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'naazrokha' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'p1', controlledBy: 'player1', units: [{ id: 'm1', type: 'mech', ownerId: 'player1', damaged: false }], exhausted: false } as any,
              ],
            }),
            createMockTile({ q: 1, r: 0 }, {
              planets: [
                { planetId: 'p2', controlledBy: 'player1', units: [{ id: 'm2', type: 'mech', ownerId: 'player1', damaged: false }], exhausted: false } as any,
              ],
            }),
            createMockTile({ q: 2, r: 0 }, {
              planets: [
                { planetId: 'p3', controlledBy: 'player1', units: [{ id: 'm3', type: 'mech', ownerId: 'player1', damaged: false }], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail have_mechs_in_systems if not enough systems', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'naazrokha' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                { planetId: 'p1', controlledBy: 'player1', units: [{ id: 'm1', type: 'mech', ownerId: 'player1', damaged: false }], exhausted: false } as any,
                { planetId: 'p2', controlledBy: 'player1', units: [{ id: 'm2', type: 'mech', ownerId: 'player1', damaged: false }], exhausted: false } as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      // Two mechs in same system only counts as 1 system
      expect(result.canUnlock).toBe(false);
    });

    // Units in wormhole systems condition
    it('should check units_in_wormhole_systems condition (Creuss - 3 systems)', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'creuss' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              wormhole: 'alpha',
              units: [{ id: 'c1', type: 'cruiser', ownerId: 'player1', damaged: false }],
            }),
            createMockTile({ q: 1, r: 0 }, {
              wormhole: 'beta',
              units: [{ id: 'c2', type: 'cruiser', ownerId: 'player1', damaged: false }],
            }),
            createMockTile({ q: 2, r: 0 }, {
              wormhole: 'alpha', // Another alpha wormhole
              units: [{ id: 'c3', type: 'cruiser', ownerId: 'player1', damaged: false }],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail units_in_wormhole_systems if not enough systems', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'creuss' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              wormhole: 'alpha',
              units: [{ id: 'c1', type: 'cruiser', ownerId: 'player1', damaged: false }],
            }),
            createMockTile({ q: 1, r: 0 }, {
              wormhole: 'beta',
              units: [{ id: 'c2', type: 'cruiser', ownerId: 'player1', damaged: false }],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });
  });

  describe('canUnlockHero', () => {
    it('should return false if player not found', () => {
      const state = createMockGameState();

      const result = canUnlockHero(state, 'nonexistent');

      expect(result.canUnlock).toBe(false);
      expect(result.reason).toBe('Player not found');
    });

    it('should return false if hero already unlocked', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            leaders: {
              agent: { unlocked: true, exhausted: false },
              commander: { unlocked: false },
              hero: { unlocked: true, purged: false },
            },
          }),
        ],
      });

      const result = canUnlockHero(state, 'player1');

      expect(result.canUnlock).toBe(false);
      expect(result.reason).toBe('Hero already unlocked');
    });

    it('should unlock hero with 3+ scored objectives', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            scoredObjectives: ['obj1', 'obj2', 'obj3'],
          }),
        ],
      });

      const result = canUnlockHero(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should not unlock hero with fewer than 3 objectives', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            scoredObjectives: ['obj1', 'obj2'],
          }),
        ],
      });

      const result = canUnlockHero(state, 'player1');

      expect(result.canUnlock).toBe(false);
      expect(result.reason).toBe('Need 3 scored objectives, have 2');
    });

    it('should unlock hero with more than 3 objectives', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            scoredObjectives: ['obj1', 'obj2', 'obj3', 'obj4', 'obj5'],
          }),
        ],
      });

      const result = canUnlockHero(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });
  });

  describe('Custom Commander Unlock Conditions', () => {
    // Muaat - Produce a War Sun
    it('should check muaat_produced_war_sun condition', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'muaat',
            producedWarSun: true,
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail muaat_produced_war_sun if not produced', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'muaat',
            producedWarSun: false,
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
      expect(result.reason).toBe('Must produce a War Sun');
    });

    // Yin - Use Indoctrination
    it('should check yin_indoctrination_used condition', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'yin',
            usedFactionAbility: { indoctrination: true },
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail yin_indoctrination_used if not used', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'yin',
            usedFactionAbility: {},
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
      expect(result.reason).toBe('Must use Indoctrination faction ability');
    });

    // Argent - 6 units with abilities
    it('should check argent_ability_units condition (6 units with AFB/SC/Bombardment)', () => {
      const units = [
        { id: 'd1', type: 'destroyer' as const, ownerId: 'player1', damaged: false },
        { id: 'd2', type: 'destroyer' as const, ownerId: 'player1', damaged: false },
        { id: 'dr1', type: 'dreadnought' as const, ownerId: 'player1', damaged: false },
        { id: 'dr2', type: 'dreadnought' as const, ownerId: 'player1', damaged: false },
        { id: 'ws1', type: 'war_sun' as const, ownerId: 'player1', damaged: false },
        { id: 'ws2', type: 'war_sun' as const, ownerId: 'player1', damaged: false },
      ];
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'argent' })],
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail argent_ability_units if not enough ability units', () => {
      const units = [
        { id: 'd1', type: 'destroyer' as const, ownerId: 'player1', damaged: false },
        { id: 'd2', type: 'destroyer' as const, ownerId: 'player1', damaged: false },
        { id: 'c1', type: 'cruiser' as const, ownerId: 'player1', damaged: false }, // No ability
        { id: 'c2', type: 'cruiser' as const, ownerId: 'player1', damaged: false }, // No ability
      ];
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'argent' })],
        map: {
          tiles: [createMockTile({ q: 0, r: 0 }, { units })],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Mahact - 2 other players' command tokens
    it('should check mahact_command_tokens condition', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'mahact',
            collectedCommandTokens: { player2: 1, player3: 1 },
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail mahact_command_tokens if not enough tokens', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'mahact',
            collectedCommandTokens: { player2: 1 },
          }),
        ],
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Cabal - Units in 3 Gravity Rift systems
    it('should check cabal_gravity_rifts condition', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'cabal' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              anomaly: 'gravity_rift' as const,
              units: [{ id: 'c1', type: 'cruiser', ownerId: 'player1', damaged: false }],
            }),
            createMockTile({ q: 1, r: 0 }, {
              anomaly: 'gravity_rift' as const,
              units: [{ id: 'c2', type: 'cruiser', ownerId: 'player1', damaged: false }],
            }),
            createMockTile({ q: 2, r: 0 }, {
              anomaly: 'gravity_rift' as const,
              units: [{ id: 'c3', type: 'cruiser', ownerId: 'player1', damaged: false }],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });

    it('should fail cabal_gravity_rifts if not enough systems', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'cabal' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              anomaly: 'gravity_rift' as const,
              units: [{ id: 'c1', type: 'cruiser', ownerId: 'player1', damaged: false }],
            }),
            createMockTile({ q: 1, r: 0 }, {
              anomaly: 'gravity_rift' as const,
              units: [{ id: 'c2', type: 'cruiser', ownerId: 'player1', damaged: false }],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(false);
    });

    // Cabal with combined conditions (gravity rifts + units)
    it('should check cabal gravity rifts with units on planets', () => {
      const state = createMockGameState({
        players: [createMockPlayer({ faction: 'cabal' })],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              anomaly: 'gravity_rift' as const,
              planets: [
                { id: 'p1', planetId: 'planet1', controlledBy: 'player1', exhausted: false, attachments: [], units: [
                  { id: 'i1', type: 'infantry' as const, ownerId: 'player1', damaged: false }
                ]} as any,
              ],
            }),
            createMockTile({ q: 1, r: 0 }, {
              anomaly: 'gravity_rift' as const,
              planets: [
                { id: 'p2', planetId: 'planet2', controlledBy: 'player1', exhausted: false, attachments: [], units: [
                  { id: 'i2', type: 'infantry' as const, ownerId: 'player1', damaged: false }
                ]} as any,
              ],
            }),
            createMockTile({ q: 2, r: 0 }, {
              anomaly: 'gravity_rift' as const,
              planets: [
                { id: 'p3', planetId: 'planet3', controlledBy: 'player1', exhausted: false, attachments: [], units: [
                  { id: 'i3', type: 'infantry' as const, ownerId: 'player1', damaged: false }
                ]} as any,
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = canUnlockCommander(state, 'player1');

      expect(result.canUnlock).toBe(true);
    });
  });
});
