import { describe, it, expect, beforeEach } from 'vitest';
import {
  isLegendaryPlanet,
  getLegendaryPlanet,
  handleUseLegendaryAbility,
  getPlayerLegendaryPlanets,
  checkLegendaryPlanetControl,
} from '../legendary-planets.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  HexCoord,
  UseLegendaryAbilityAction,
} from '@ti4/shared';

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Test Player',
    faction: 'sol',
    color: 'blue',
    isBot: false,
    seatPosition: 0,
    score: 0,
    resources: 0,
    influence: 0,
    tradeGoods: 0,
    commodities: 3,
    maxCommodities: 4,
    planets: [],
    technologies: [],
    promissoryNotes: [],
    promissoryNotesInPlay: [],
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
    strategyCardUsed: false,
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
    subPhase: 'tactical_action',
    round: 1,
    turn: 1,
    activePlayerId: 'player1',
    speakerId: 'player1',
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
    strategyCards: [],
    log: [],
    settings: {
      victoryPointLimit: 10,
      gameDuration: 'full',
      mapType: 'standard',
    },
    ...overrides,
  } as GameState;
}

describe('Legendary Planet Handlers', () => {
  describe('isLegendaryPlanet', () => {
    it('should return true for Primor', () => {
      expect(isLegendaryPlanet('primor')).toBe(true);
    });

    it('should return true for Hope\'s End', () => {
      expect(isLegendaryPlanet('hopes_end')).toBe(true);
    });

    it('should return true for Mallice', () => {
      expect(isLegendaryPlanet('mallice')).toBe(true);
    });

    it('should return true for Mirage', () => {
      expect(isLegendaryPlanet('mirage')).toBe(true);
    });

    it('should return false for regular planets', () => {
      expect(isLegendaryPlanet('mecatol_rex')).toBe(false);
      expect(isLegendaryPlanet('jord')).toBe(false);
      expect(isLegendaryPlanet('abyz')).toBe(false);
    });
  });

  describe('getLegendaryPlanet', () => {
    it('should return data for Primor', () => {
      const data = getLegendaryPlanet('primor');
      expect(data).not.toBeNull();
      expect(data?.name).toBe('Primor');
      expect(data?.abilityName).toBe('The Atrament');
      expect(data?.abilityType).toBe('place_infantry');
    });

    it('should return data for Hope\'s End', () => {
      const data = getLegendaryPlanet('hopes_end');
      expect(data).not.toBeNull();
      expect(data?.name).toBe("Hope's End");
      expect(data?.abilityName).toBe('Imperial Arms Vault');
      expect(data?.abilityType).toBe('place_mech_or_draw');
    });

    it('should return data for Mallice', () => {
      const data = getLegendaryPlanet('mallice');
      expect(data).not.toBeNull();
      expect(data?.name).toBe('Mallice');
      expect(data?.abilityName).toBe('Exterrix Headquarters');
      expect(data?.abilityType).toBe('gain_tg_or_convert');
    });

    it('should return data for Mirage', () => {
      const data = getLegendaryPlanet('mirage');
      expect(data).not.toBeNull();
      expect(data?.name).toBe('Mirage');
      expect(data?.abilityName).toBe('Flight Academy');
      expect(data?.abilityType).toBe('place_fighters');
    });

    it('should return null for non-legendary planets', () => {
      expect(getLegendaryPlanet('mecatol_rex')).toBeNull();
      expect(getLegendaryPlanet('jord')).toBeNull();
    });
  });

  describe('handleUseLegendaryAbility', () => {
    describe('common validations', () => {
      it('should fail if player not found', () => {
        const state = createMockGameState();
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'nonexistent',
          planetId: 'primor',
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Player not found');
      });

      it('should fail if player does not control the planet', () => {
        const state = createMockGameState({
          players: [createMockPlayer({ planets: [] })],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'primor',
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('You do not control this planet');
      });

      it('should fail if planet is not legendary', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mecatol_rex', exhausted: false, attachments: [] }],
            }),
          ],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mecatol_rex',
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('This is not a legendary planet');
      });

      it('should fail if planet is exhausted', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'primor', exhausted: true, attachments: [] }],
            }),
          ],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'primor',
          targets: { targetPlanetId: 'primor' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Planet is already exhausted');
      });
    });

    describe('Primor ability (place infantry)', () => {
      it('should fail if no target planet specified', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'primor', exhausted: false, attachments: [] }],
            }),
          ],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'primor',
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Must specify a target planet');
      });

      it('should fail if player does not control target planet', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'primor', exhausted: false, attachments: [] }],
            }),
          ],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'primor',
          targets: { targetPlanetId: 'abyz' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('You do not control the target planet');
      });

      it('should successfully place 2 infantry on target planet', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [
                { planetId: 'primor', exhausted: false, attachments: [] },
                { planetId: 'abyz', exhausted: false, attachments: [] },
              ],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'primor', attachments: [], units: [] } as any],
              }),
              createMockTile({ q: 1, r: 0 }, {
                planets: [{ planetId: 'abyz', attachments: [], units: [] } as any],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'primor',
          targets: { targetPlanetId: 'abyz' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(result.triggeredEvents).toContain('legendary_ability_used');
        expect((result.data as any)?.effect.unitsPlaced).toBe(2);
        expect((result.data as any)?.effect.unitType).toBe('infantry');
        // Verify infantry were placed
        expect(state.map.tiles[1].planets[0].units).toHaveLength(2);
        expect(state.map.tiles[1].planets[0].units[0].type).toBe('infantry');
        // Verify planet was exhausted
        expect(state.players[0].planets[0].exhausted).toBe(true);
      });

      it('should successfully place 1 infantry if count is 1', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'primor', exhausted: false, attachments: [] }],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'primor', attachments: [], units: [] } as any],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'primor',
          targets: { targetPlanetId: 'primor', count: 1 },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect((result.data as any)?.effect.unitsPlaced).toBe(1);
        expect(state.map.tiles[0].planets[0].units).toHaveLength(1);
      });
    });

    describe('Hope\'s End ability (place mech or draw card)', () => {
      it('should draw 1 action card when choice is draw_card', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'hopes_end', exhausted: false, attachments: [] }],
              actionCards: [],
            }),
          ],
          actionCardDeck: ['card1', 'card2', 'card3'],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'hopes_end',
          targets: { choice: 'draw_card' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect((result.data as any)?.effect.effect).toBe('drew_action_card');
        expect(state.players[0].actionCards).toHaveLength(1);
        expect(state.actionCardDeck).toHaveLength(2);
        expect(state.players[0].planets[0].exhausted).toBe(true);
      });

      it('should place 1 mech when choice is place_mech with target planet', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [
                { planetId: 'hopes_end', exhausted: false, attachments: [] },
                { planetId: 'abyz', exhausted: false, attachments: [] },
              ],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'hopes_end', attachments: [], units: [] } as any],
              }),
              createMockTile({ q: 1, r: 0 }, {
                planets: [{ planetId: 'abyz', attachments: [], units: [] } as any],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'hopes_end',
          targets: { choice: 'place_mech', targetPlanetId: 'abyz' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect((result.data as any)?.effect.effect).toBe('placed_mech');
        expect(state.map.tiles[1].planets[0].units).toHaveLength(1);
        expect(state.map.tiles[1].planets[0].units[0].type).toBe('mech');
        expect(state.players[0].planets[0].exhausted).toBe(true);
      });

      it('should fail if no choice and no target planet', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'hopes_end', exhausted: false, attachments: [] }],
            }),
          ],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'hopes_end',
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Must choose');
      });

      it('should reshuffle discard if deck is empty', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'hopes_end', exhausted: false, attachments: [] }],
              actionCards: [],
            }),
          ],
          actionCardDeck: [],
          actionCardDiscard: ['discarded1', 'discarded2'],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'hopes_end',
          targets: { choice: 'draw_card' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(state.players[0].actionCards).toHaveLength(1);
        expect(state.actionCardDiscard).toHaveLength(0);
      });
    });

    describe('Mallice ability (gain TG or convert commodities)', () => {
      it('should gain 2 trade goods when choice is gain_tg', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mallice', exhausted: false, attachments: [] }],
              tradeGoods: 5,
            }),
          ],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mallice',
          targets: { choice: 'gain_tg' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect((result.data as any)?.effect.effect).toBe('gained_trade_goods');
        expect((result.data as any)?.effect.tradeGoodsGained).toBe(2);
        expect(state.players[0].tradeGoods).toBe(7);
        expect(state.players[0].planets[0].exhausted).toBe(true);
      });

      it('should convert all commodities to trade goods when choice is convert', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mallice', exhausted: false, attachments: [] }],
              tradeGoods: 2,
              commodities: 4,
            }),
          ],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mallice',
          targets: { choice: 'convert' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect((result.data as any)?.effect.effect).toBe('converted_commodities');
        expect((result.data as any)?.effect.commoditiesConverted).toBe(4);
        expect(state.players[0].tradeGoods).toBe(6);
        expect(state.players[0].commodities).toBe(0);
      });

      it('should default to gain 2 TG if no choice specified', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mallice', exhausted: false, attachments: [] }],
              tradeGoods: 0,
            }),
          ],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mallice',
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(state.players[0].tradeGoods).toBe(2);
      });
    });

    describe('Mirage ability (place fighters)', () => {
      it('should fail if no target system specified', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mirage', exhausted: false, attachments: [] }],
            }),
          ],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mirage',
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Must specify a target system');
      });

      it('should fail if player has no ships in target system', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mirage', exhausted: false, attachments: [] }],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                id: 'system1',
                planets: [{ planetId: 'mirage', attachments: [], units: [] } as any],
                units: [], // No ships
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mirage',
          targets: { systemId: 'system1' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('You have no ships in this system');
      });

      it('should successfully place 2 fighters in system with ships', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mirage', exhausted: false, attachments: [] }],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                id: 'system1',
                planets: [{ planetId: 'mirage', attachments: [], units: [] } as any],
                units: [{ id: 'carrier1', type: 'carrier', ownerId: 'player1', damaged: false }],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mirage',
          targets: { systemId: 'system1' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect((result.data as any)?.effect.unitsPlaced).toBe(2);
        expect((result.data as any)?.effect.unitType).toBe('fighter');
        // Original carrier + 2 new fighters
        expect(state.map.tiles[0].units).toHaveLength(3);
        expect(state.map.tiles[0].units.filter(u => u.type === 'fighter')).toHaveLength(2);
        expect(state.players[0].planets[0].exhausted).toBe(true);
      });

      it('should allow placing in different system than Mirage', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mirage', exhausted: false, attachments: [] }],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                id: 'mirage_system',
                planets: [{ planetId: 'mirage', attachments: [], units: [] } as any],
                units: [],
              }),
              createMockTile({ q: 1, r: 0 }, {
                id: 'other_system',
                planets: [],
                units: [{ id: 'dread1', type: 'dreadnought', ownerId: 'player1', damaged: false }],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mirage',
          targets: { systemId: 'other_system' },
          timestamp: Date.now(),
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(state.map.tiles[1].units.filter(u => u.type === 'fighter')).toHaveLength(2);
      });
    });
  });

  describe('getPlayerLegendaryPlanets', () => {
    it('should return empty array if player not found', () => {
      const state = createMockGameState();

      const result = getPlayerLegendaryPlanets(state, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should return empty array if player has no legendary planets', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            planets: [
              { planetId: 'mecatol_rex', exhausted: false, attachments: [] },
              { planetId: 'abyz', exhausted: false, attachments: [] },
            ],
          }),
        ],
      });

      const result = getPlayerLegendaryPlanets(state, 'player1');

      expect(result).toEqual([]);
    });

    it('should return all legendary planets controlled by player', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            planets: [
              { planetId: 'primor', exhausted: false, attachments: [] },
              { planetId: 'hopes_end', exhausted: true, attachments: [] },
              { planetId: 'mirage', exhausted: false, attachments: [] },
              { planetId: 'abyz', exhausted: false, attachments: [] },
            ],
          }),
        ],
      });

      const result = getPlayerLegendaryPlanets(state, 'player1');

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ planetId: 'primor', name: 'Primor', abilityName: 'The Atrament', exhausted: false });
      expect(result).toContainEqual({ planetId: 'hopes_end', name: "Hope's End", abilityName: 'Imperial Arms Vault', exhausted: true });
      expect(result).toContainEqual({ planetId: 'mirage', name: 'Mirage', abilityName: 'Flight Academy', exhausted: false });
    });

    it('should correctly report exhausted status', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            planets: [
              { planetId: 'mallice', exhausted: true, attachments: [] },
            ],
          }),
        ],
      });

      const result = getPlayerLegendaryPlanets(state, 'player1');

      expect(result).toHaveLength(1);
      expect(result[0].exhausted).toBe(true);
      expect(result[0].abilityName).toBe('Exterrix Headquarters');
    });
  });

  describe('checkLegendaryPlanetControl', () => {
    it('should do nothing for non-legendary planets', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            relics: ['shard_of_the_throne'],
          }),
          createMockPlayer({
            id: 'player2',
          }),
        ],
      });

      // Should not throw or modify state
      expect(() => {
        checkLegendaryPlanetControl(state, 'mecatol_rex', 'player2', 'player1');
      }).not.toThrow();
    });

    it('should detect when legendary planet control changes', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            relics: ['shard_of_the_throne'],
          }),
          createMockPlayer({
            id: 'player2',
          }),
        ],
      });

      // This function checks for Shard of the Throne transfer
      expect(() => {
        checkLegendaryPlanetControl(state, 'primor', 'player2', 'player1');
      }).not.toThrow();
    });
  });
});
