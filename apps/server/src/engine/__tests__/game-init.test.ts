import { describe, it, expect } from 'vitest';
import { createGame, type GameSetupOptions, type PlayerSetup } from '../game-init.js';
import type { PlayerColor } from '@ti4/shared';

function createBasicSetup(playerCount: number): GameSetupOptions {
  const factions = ['sol', 'hacan', 'letnev', 'sardakk', 'jolnar', 'xxcha'];
  const colors: PlayerColor[] = ['blue', 'red', 'yellow', 'green', 'purple', 'orange'];

  const playerSetups: PlayerSetup[] = [];
  for (let i = 0; i < playerCount; i++) {
    playerSetups.push({
      userId: `user-${i + 1}`,
      name: `Player ${i + 1}`,
      factionId: factions[i],
      color: colors[i],
    });
  }

  return {
    playerSetups,
    expansions: ['base'],
  };
}

describe('Game Initialization', () => {
  describe('createGame', () => {
    describe('Basic game creation', () => {
      it('should create a game with valid ID', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        expect(state.id).toBeDefined();
        expect(typeof state.id).toBe('string');
        expect(state.id.length).toBeGreaterThan(0);
      });

      it('should start at version 1', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        expect(state.version).toBe(1);
      });

      it('should start in setup phase by default', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        expect(state.phase).toBe('setup');
        expect(state.round).toBe(0);
      });

      it('should start in strategy phase when coming from draft', () => {
        const options = createBasicSetup(3);
        options.startPhase = 'strategy';
        const state = createGame(options);

        expect(state.phase).toBe('strategy');
        expect(state.round).toBe(1);
      });

      it('should have no winner initially', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        expect(state.winner).toBeNull();
      });

      it('should have no active combat initially', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        expect(state.activeCombat).toBeNull();
      });

      it('should have custodians not taken initially', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        expect(state.custodiansTaken).toBe(false);
      });
    });

    describe('Player creation', () => {
      it('should create correct number of players', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.players).toHaveLength(4);
      });

      it('should assign correct factions to players', () => {
        const options: GameSetupOptions = {
          playerSetups: [
            { userId: 'user1', name: 'P1', factionId: 'sol', color: 'blue' },
            { userId: 'user2', name: 'P2', factionId: 'hacan', color: 'red' },
            { userId: 'user3', name: 'P3', factionId: 'jolnar', color: 'yellow' },
          ],
          expansions: ['base'],
        };
        const state = createGame(options);

        expect(state.players[0].faction).toBe('sol');
        expect(state.players[1].faction).toBe('hacan');
        expect(state.players[2].faction).toBe('jolnar');
      });

      it('should assign correct colors to players', () => {
        const options: GameSetupOptions = {
          playerSetups: [
            { userId: 'user1', name: 'P1', factionId: 'sol', color: 'blue' },
            { userId: 'user2', name: 'P2', factionId: 'hacan', color: 'purple' },
          ],
          expansions: ['base'],
        };
        const state = createGame(options);

        expect(state.players[0].color).toBe('blue');
        expect(state.players[1].color).toBe('purple');
      });

      it('should assign correct names to players', () => {
        const options: GameSetupOptions = {
          playerSetups: [
            { userId: 'user1', name: 'Alice', factionId: 'sol', color: 'blue' },
            { userId: 'user2', name: 'Bob', factionId: 'hacan', color: 'red' },
          ],
          expansions: ['base'],
        };
        const state = createGame(options);

        expect(state.players[0].name).toBe('Alice');
        expect(state.players[1].name).toBe('Bob');
      });

      it('should assign correct seat indices to players', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.players[0].seatIndex).toBe(0);
        expect(state.players[1].seatIndex).toBe(1);
        expect(state.players[2].seatIndex).toBe(2);
        expect(state.players[3].seatIndex).toBe(3);
      });

      it('should give each player unique IDs', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        const ids = state.players.map(p => p.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(4);
      });

      it('should mark bot players correctly', () => {
        const options: GameSetupOptions = {
          playerSetups: [
            { userId: 'user1', name: 'Human', factionId: 'sol', color: 'blue' },
            { userId: null, name: 'Bot', factionId: 'hacan', color: 'red' },
          ],
          expansions: ['base'],
        };
        const state = createGame(options);

        expect(state.players[0].isBot).toBe(false);
        expect(state.players[1].isBot).toBe(true);
      });
    });

    describe('Initial resources', () => {
      it('should give players starting command tokens', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.commandTokens.tactics).toBe(3);
          expect(player.commandTokens.fleet).toBe(3);
          expect(player.commandTokens.strategy).toBe(2);
        }
      });

      it('should start players with 0 trade goods', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.tradeGoods).toBe(0);
        }
      });

      it('should start players with 0 commodities', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.commodities).toBe(0);
        }
      });

      it('should set max commodities based on faction', () => {
        const options: GameSetupOptions = {
          playerSetups: [
            { userId: 'user1', name: 'P1', factionId: 'hacan', color: 'blue' },
          ],
          expansions: ['base'],
        };
        const state = createGame(options);

        // Hacan has 6 commodities
        expect(state.players[0].maxCommodities).toBe(6);
      });

      it('should give players their faction starting technologies', () => {
        const options: GameSetupOptions = {
          playerSetups: [
            { userId: 'user1', name: 'P1', factionId: 'jolnar', color: 'blue' },
          ],
          expansions: ['base'],
        };
        const state = createGame(options);

        // Jol-Nar starts with multiple techs
        expect(state.players[0].technologies.length).toBeGreaterThan(0);
      });

      it('should start players with 0 score', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.score).toBe(0);
        }
      });

      it('should have players not passed initially', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.passed).toBe(false);
        }
      });
    });

    describe('Speaker selection', () => {
      it('should select a speaker', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.speakerId).toBeDefined();
        const speakerExists = state.players.some(p => p.id === state.speakerId);
        expect(speakerExists).toBe(true);
      });

      it('should use provided speaker index', () => {
        const options = createBasicSetup(4);
        options.speakerIndex = 2;
        const state = createGame(options);

        expect(state.speakerId).toBe(state.players[2].id);
      });

      it('should set active player to speaker', () => {
        const options = createBasicSetup(4);
        options.speakerIndex = 1;
        const state = createGame(options);

        expect(state.activePlayerId).toBe(state.speakerId);
      });
    });

    describe('Map creation', () => {
      it('should create map with correct player count', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.map.playerCount).toBe(4);
      });

      it('should include Mecatol Rex at center', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        const mecatolTile = state.map.tiles.find(t => t.systemId === 18);
        expect(mecatolTile).toBeDefined();
        expect(mecatolTile!.position).toEqual({ q: 0, r: 0 });
      });

      it('should include home systems for each player', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        // Each player should have a home system
        for (const player of state.players) {
          const homeSystemTile = state.map.tiles.find(tile => {
            // Check if any planet on the tile is controlled by this player
            return tile.planets.some(p => p.controlledBy === player.id);
          });
          expect(homeSystemTile).toBeDefined();
        }
      });

      it('should have valid positions for all tiles', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        for (const tile of state.map.tiles) {
          expect(tile.position).toBeDefined();
          expect(typeof tile.position.q).toBe('number');
          expect(typeof tile.position.r).toBe('number');
        }
      });

      it('should give tiles unique IDs', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        const ids = state.map.tiles.map(t => t.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(state.map.tiles.length);
      });
    });

    describe('Starting units', () => {
      it('should place starting units in home systems', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        for (const player of state.players) {
          // Find home system
          const homeSystemTile = state.map.tiles.find(tile =>
            tile.planets.some(p => p.controlledBy === player.id)
          );

          expect(homeSystemTile).toBeDefined();

          // Should have some units (space or ground)
          const spaceUnits = homeSystemTile!.units.filter(u => u.ownerId === player.id);
          const groundUnits = homeSystemTile!.planets.flatMap(p =>
            p.units.filter(u => u.ownerId === player.id)
          );

          const totalUnits = spaceUnits.length + groundUnits.length;
          expect(totalUnits).toBeGreaterThan(0);
        }
      });

      it('should give each unit a unique ID', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        const allUnitIds: string[] = [];

        for (const tile of state.map.tiles) {
          for (const unit of tile.units) {
            allUnitIds.push(unit.id);
          }
          for (const planet of tile.planets) {
            for (const unit of planet.units) {
              allUnitIds.push(unit.id);
            }
          }
        }

        const uniqueIds = new Set(allUnitIds);
        expect(uniqueIds.size).toBe(allUnitIds.length);
      });

      it('should not have damaged units initially', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        for (const tile of state.map.tiles) {
          for (const unit of tile.units) {
            expect(unit.damaged).toBe(false);
          }
          for (const planet of tile.planets) {
            for (const unit of planet.units) {
              expect(unit.damaged).toBe(false);
            }
          }
        }
      });
    });

    describe('Strategy cards', () => {
      it('should create all 8 strategy cards', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.strategyCards).toHaveLength(8);
      });

      it('should have all strategy cards unpicked', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        for (const card of state.strategyCards) {
          expect(card.pickedBy).toBeNull();
        }
      });

      it('should have all strategy cards not exhausted', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        for (const card of state.strategyCards) {
          expect(card.exhausted).toBe(false);
        }
      });

      it('should have strategy cards numbered 1-8', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        const numbers = state.strategyCards.map(c => c.number);
        expect(numbers.sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      });
    });

    describe('Objectives', () => {
      it('should have Stage I objectives', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.objectives.publicStageI.length).toBeGreaterThan(0);
      });

      it('should have Stage II objectives', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.objectives.publicStageII.length).toBeGreaterThan(0);
      });

      it('should reveal 2 Stage I objectives at start', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        const revealed = state.objectives.publicStageI.filter(o => o.revealed);
        expect(revealed.length).toBe(2);
        expect(state.objectives.revealedCount).toBe(2);
      });

      it('should not reveal Stage II objectives at start', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        const revealed = state.objectives.publicStageII.filter(o => o.revealed);
        expect(revealed.length).toBe(0);
      });

      it('should have secret objective deck', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.objectives.secretDeck.length).toBeGreaterThan(0);
      });

      it('should deal 2 secret objectives to each player', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.secretObjectives.length).toBe(2);
        }
      });
    });

    describe('Decks', () => {
      it('should create action card deck', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.actionCardDeck.length).toBeGreaterThan(0);
      });

      it('should have empty action card discard', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.actionCardDiscard).toHaveLength(0);
      });

      it('should create agenda deck', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.agendaDeck.length).toBeGreaterThan(0);
      });

      it('should have empty agenda discard', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.agendaDiscard).toHaveLength(0);
      });

      it('should have no laws in play initially', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.laws).toHaveLength(0);
      });
    });

    describe('Exploration decks (PoK)', () => {
      it('should create exploration decks when PoK enabled', () => {
        const options = createBasicSetup(4);
        options.expansions = ['base', 'pok'];
        const state = createGame(options);

        expect(state.explorationDecks).toBeDefined();
        expect(state.explorationDecks!.cultural.length).toBeGreaterThan(0);
        expect(state.explorationDecks!.industrial.length).toBeGreaterThan(0);
        expect(state.explorationDecks!.hazardous.length).toBeGreaterThan(0);
        expect(state.explorationDecks!.frontier.length).toBeGreaterThan(0);
      });

      it('should have empty exploration decks for base game only', () => {
        const options = createBasicSetup(4);
        options.expansions = ['base'];
        const state = createGame(options);

        expect(state.explorationDecks).toBeDefined();
        expect(state.explorationDecks!.cultural).toHaveLength(0);
        expect(state.explorationDecks!.industrial).toHaveLength(0);
        expect(state.explorationDecks!.hazardous).toHaveLength(0);
        expect(state.explorationDecks!.frontier).toHaveLength(0);
      });

      it('should create relic deck when PoK enabled', () => {
        const options = createBasicSetup(4);
        options.expansions = ['base', 'pok'];
        const state = createGame(options);

        expect(state.relicDeck!.length).toBeGreaterThan(0);
      });

      it('should have empty relic deck for base game only', () => {
        const options = createBasicSetup(4);
        options.expansions = ['base'];
        const state = createGame(options);

        expect(state.relicDeck).toHaveLength(0);
      });
    });

    describe('Promissory notes', () => {
      it('should give players faction promissory notes', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        for (const player of state.players) {
          // Each player should have promissory notes
          // The faction note is at least one of the notes owned
          // Generic notes are things like 'support_for_the_throne_blue', 'ceasefire_blue', etc.
          // Faction notes have their own unique IDs
          expect(player.promissoryNotesOwned.length).toBeGreaterThan(0);
        }
      });

      it('should give players generic promissory notes', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        for (const player of state.players) {
          // Should have generic notes (Support, Ceasefire, Trade Agreement, Political Secret)
          expect(player.promissoryNotesOwned.length).toBeGreaterThan(1);
        }
      });

      it('should start with all owned notes in hand', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.promissoryNotesInHand).toEqual(player.promissoryNotesOwned);
        }
      });

      it('should start with no notes in play', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.promissoryNotesInPlay).toHaveLength(0);
        }
      });
    });

    describe('Leaders (PoK)', () => {
      it('should create leaders for PoK factions', () => {
        const options = createBasicSetup(3);
        options.expansions = ['base', 'pok'];
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.leaders).toBeDefined();
          expect(player.leaders!.agent).toBeDefined();
          expect(player.leaders!.commander).toBeDefined();
          expect(player.leaders!.hero).toBeDefined();
        }
      });

      it('should have agents unlocked at start', () => {
        const options = createBasicSetup(3);
        options.expansions = ['base', 'pok'];
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.leaders!.agent.unlocked).toBe(true);
          expect(player.leaders!.agent.exhausted).toBe(false);
        }
      });

      it('should have commanders locked at start', () => {
        const options = createBasicSetup(3);
        options.expansions = ['base', 'pok'];
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.leaders!.commander.unlocked).toBe(false);
        }
      });

      it('should have heroes locked and not purged at start', () => {
        const options = createBasicSetup(3);
        options.expansions = ['base', 'pok'];
        const state = createGame(options);

        for (const player of state.players) {
          expect(player.leaders!.hero.unlocked).toBe(false);
          expect(player.leaders!.hero.purged).toBe(false);
        }
      });
    });

    describe('Player count variations', () => {
      it('should support 3 player games', () => {
        const options = createBasicSetup(3);
        const state = createGame(options);

        expect(state.players).toHaveLength(3);
        expect(state.map.playerCount).toBe(3);
      });

      it('should support 4 player games', () => {
        const options = createBasicSetup(4);
        const state = createGame(options);

        expect(state.players).toHaveLength(4);
        expect(state.map.playerCount).toBe(4);
      });

      it('should support 5 player games', () => {
        const options = createBasicSetup(5);
        const state = createGame(options);

        expect(state.players).toHaveLength(5);
        expect(state.map.playerCount).toBe(5);
      });

      it('should support 6 player games', () => {
        const options = createBasicSetup(6);
        const state = createGame(options);

        expect(state.players).toHaveLength(6);
        expect(state.map.playerCount).toBe(6);
      });
    });

    describe('Error handling', () => {
      it('should throw error for unknown faction', () => {
        const options: GameSetupOptions = {
          playerSetups: [
            { userId: 'user1', name: 'P1', factionId: 'unknown_faction', color: 'blue' },
          ],
          expansions: ['base'],
        };

        expect(() => createGame(options)).toThrow('Unknown faction: unknown_faction');
      });
    });
  });
});
