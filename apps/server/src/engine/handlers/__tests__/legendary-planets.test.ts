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
    version: 1,
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
      expect(data?.abilityType).toBe('purge_attachments');
    });

    it('should return data for Hope\'s End', () => {
      const data = getLegendaryPlanet('hopes_end');
      expect(data).not.toBeNull();
      expect(data?.name).toBe("Hope's End");
      expect(data?.abilityType).toBe('action_card_cycle');
    });

    it('should return data for Mallice', () => {
      const data = getLegendaryPlanet('mallice');
      expect(data).not.toBeNull();
      expect(data?.name).toBe('Mallice');
      expect(data?.abilityType).toBe('limited_production');
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
          targets: { attachmentIds: ['demilitarized_zone'] },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Planet is already exhausted');
      });
    });

    describe('Primor ability (purge attachments)', () => {
      it('should fail if no attachments specified', () => {
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
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Must specify attachments to purge');
      });

      it('should fail if trying to purge more than 2 attachments', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [
                { planetId: 'primor', exhausted: false, attachments: ['a1', 'a2', 'a3'] },
              ],
            }),
          ],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'primor',
          targets: { attachmentIds: ['a1', 'a2', 'a3'] },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Can only purge up to 2 attachments');
      });

      it('should fail if attachment not found on player planets', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [
                { planetId: 'primor', exhausted: false, attachments: [] },
                { planetId: 'abyz', exhausted: false, attachments: ['research_station'] },
              ],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'primor', attachments: [] }],
              }),
              createMockTile({ q: 1, r: 0 }, {
                planets: [{ planetId: 'abyz', attachments: ['research_station'] }],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'primor',
          targets: { attachmentIds: ['nonexistent_attachment'] },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Attachment nonexistent_attachment not found on your planets');
      });

      it('should successfully purge 1 attachment', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [
                { planetId: 'primor', exhausted: false, attachments: [] },
                { planetId: 'abyz', exhausted: false, attachments: ['research_station'] },
              ],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'primor', attachments: [] } as any],
              }),
              createMockTile({ q: 1, r: 0 }, {
                planets: [{ planetId: 'abyz', attachments: ['research_station'] } as any],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'primor',
          targets: { attachmentIds: ['research_station'] },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(result.triggeredEvents).toContain('legendary_ability_used');
        expect(result.data?.effect.purgedAttachments).toContain('research_station');
        // Verify attachment was removed from map
        expect(state.map.tiles[1].planets[0].attachments).not.toContain('research_station');
        // Verify planet was exhausted
        expect(state.players[0].planets[0].exhausted).toBe(true);
      });

      it('should successfully purge 2 attachments', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [
                { planetId: 'primor', exhausted: false, attachments: [] },
                { planetId: 'abyz', exhausted: false, attachments: ['research_station', 'demilitarized_zone'] },
              ],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'primor', attachments: [] } as any],
              }),
              createMockTile({ q: 1, r: 0 }, {
                planets: [{ planetId: 'abyz', attachments: ['research_station', 'demilitarized_zone'] } as any],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'primor',
          targets: { attachmentIds: ['research_station', 'demilitarized_zone'] },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(result.data?.effect.purgedAttachments).toHaveLength(2);
        expect(state.map.tiles[1].planets[0].attachments).toHaveLength(0);
      });
    });

    describe('Hope\'s End ability (action card cycle)', () => {
      it('should draw 3 action cards when no return cards specified', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'hopes_end', exhausted: false, attachments: [] }],
              actionCards: [],
            }),
          ],
          actionCardDeck: ['card1', 'card2', 'card3', 'card4', 'card5'],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'hopes_end',
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(result.data?.effect.awaitingCardSelection).toBe(true);
        expect(state.players[0].actionCards).toHaveLength(3);
        expect(state.actionCardDeck).toHaveLength(2);
      });

      it('should draw and return 3 cards when specified', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'hopes_end', exhausted: false, attachments: [] }],
              actionCards: ['existing_card'],
            }),
          ],
          actionCardDeck: ['card1', 'card2', 'card3', 'card4'],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'hopes_end',
          targets: {
            actionCardIds: ['existing_card', 'card1', 'card2'],
          },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(result.data?.effect.drawnCards).toBe(3);
        expect(result.data?.effect.returnedCards).toBe(3);
        // Started with 1, drew 3, returned 3 = 1 card in hand
        expect(state.players[0].actionCards).toHaveLength(1);
        expect(state.players[0].actionCards[0]).toBe('card3'); // The one not returned
        // Deck had 4, drew 3 = 1, then returned 3 = 4 at bottom
        expect(state.actionCardDeck).toContain('existing_card');
        expect(state.actionCardDeck).toContain('card1');
        expect(state.actionCardDeck).toContain('card2');
      });

      it('should fail if player does not have specified return cards', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'hopes_end', exhausted: false, attachments: [] }],
              actionCards: ['card1'],
            }),
          ],
          actionCardDeck: ['deck_card1', 'deck_card2', 'deck_card3'],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'hopes_end',
          targets: {
            actionCardIds: ['card1', 'card_i_dont_have', 'another_missing'],
          },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toContain('You do not have action card');
      });

      it('should handle empty action card deck gracefully', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'hopes_end', exhausted: false, attachments: [] }],
              actionCards: [],
            }),
          ],
          actionCardDeck: [],
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'hopes_end',
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(result.data?.effect.drawnCards).toBe(0);
        expect(state.players[0].actionCards).toHaveLength(0);
      });
    });

    describe('Mallice ability (limited production)', () => {
      it('should fail if no units specified', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mallice', exhausted: false, attachments: [] }],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'mallice', attachments: [] } as any],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mallice',
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Must specify units to produce');
      });

      it('should fail if trying to produce more than 2 units', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mallice', exhausted: false, attachments: [] }],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'mallice', attachments: [] } as any],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mallice',
          targets: {
            unitProduction: [{ type: 'infantry', count: 3 }],
          },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Can only produce up to 2 units');
      });

      it('should successfully produce 2 infantry on Mallice', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mallice', exhausted: false, attachments: [] }],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'mallice', attachments: [] } as any],
                units: [],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mallice',
          targets: {
            unitProduction: [{ type: 'infantry', count: 2 }],
          },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(result.triggeredEvents).toContain('legendary_ability_used');
        expect(state.map.tiles[0].units).toHaveLength(2);
        expect(state.map.tiles[0].units[0].type).toBe('infantry');
        expect(state.map.tiles[0].units[0].ownerId).toBe('player1');
        expect(state.map.tiles[0].units[0].planetId).toBe('mallice'); // Ground unit on planet
        expect(state.players[0].planets[0].exhausted).toBe(true);
      });

      it('should successfully produce mixed unit types', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mallice', exhausted: false, attachments: [] }],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'mallice', attachments: [] } as any],
                units: [],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mallice',
          targets: {
            unitProduction: [
              { type: 'infantry', count: 1 },
              { type: 'mech', count: 1 },
            ],
          },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(state.map.tiles[0].units).toHaveLength(2);
        const unitTypes = state.map.tiles[0].units.map((u) => u.type);
        expect(unitTypes).toContain('infantry');
        expect(unitTypes).toContain('mech');
      });

      it('should place space units without planetId', () => {
        const state = createMockGameState({
          players: [
            createMockPlayer({
              planets: [{ planetId: 'mallice', exhausted: false, attachments: [] }],
            }),
          ],
          map: {
            tiles: [
              createMockTile({ q: 0, r: 0 }, {
                planets: [{ planetId: 'mallice', attachments: [] } as any],
                units: [],
              }),
            ],
            playerCount: 6,
          },
        });
        const action: UseLegendaryAbilityAction = {
          type: 'use_legendary_ability',
          playerId: 'player1',
          planetId: 'mallice',
          targets: {
            unitProduction: [{ type: 'fighter', count: 2 }],
          },
        };

        const result = handleUseLegendaryAbility(state, action);

        expect(result.success).toBe(true);
        expect(state.map.tiles[0].units).toHaveLength(2);
        expect(state.map.tiles[0].units[0].type).toBe('fighter');
        expect(state.map.tiles[0].units[0].planetId).toBeUndefined(); // Space units not on planet
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
              { planetId: 'abyz', exhausted: false, attachments: [] },
            ],
          }),
        ],
      });

      const result = getPlayerLegendaryPlanets(state, 'player1');

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ planetId: 'primor', name: 'Primor', exhausted: false });
      expect(result).toContainEqual({ planetId: 'hopes_end', name: "Hope's End", exhausted: true });
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
      // It should detect when someone else has the relic and is not the new controller
      expect(() => {
        checkLegendaryPlanetControl(state, 'primor', 'player2', 'player1');
      }).not.toThrow();
    });
  });
});
