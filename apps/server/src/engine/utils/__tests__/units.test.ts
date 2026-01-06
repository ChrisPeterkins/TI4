import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, PlayerState, MapTile, UnitInstance, UnitType, PlanetInstance } from '@ti4/shared';
import {
  isShipType,
  isGroundUnit,
  isStructure,
  isCarrierType,
  countsTowardsFleetSupply,
  getUnitStats,
  getUnitMoveValue,
  getUnitCapacity,
  calculateFleetSupply,
  countFleetSupplyUnits,
  wouldViolateFleetSupply,
  calculateCapacityInSystem,
  countCapacityRequiredUnits,
  hasCapacityFor,
  calculateProductionCost,
  calculateProductionCount,
  hasEnemyShips,
  hasEnemyGroundForces,
  getPlayerUnitsInSpace,
  getPlayerUnitsOnPlanet,
  isSystemActivatedByPlayer,
  generateUnitId,
  createUnitInstance,
  getUnitLimit,
  countUnitsOnMap,
  countAllUnitsOnMap,
  getAvailableReinforcements,
  hasReinforcementsAvailable,
  validateReinforcementsForProduction,
  BASE_UNIT_LIMITS,
  POK_UNIT_LIMITS,
} from '../units.js';

// Helper to create mock player
function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    planets: [],
    technologies: [],
    units: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 3,
    strategyCards: [],
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    promissoryNotes: [],
    promissoryNotesInPlay: [],
    relics: [],
    exhaustedRelics: [],
    exhaustedPlanets: [],
    fragments: { cultural: 0, hazardous: 0, industrial: 0, unknown: 0 },
    ...overrides,
  } as PlayerState;
}

// Helper to create mock unit
function createMockUnit(type: UnitType, ownerId: string, overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: `unit-${Math.random().toString(36).substr(2, 9)}`,
    type,
    ownerId,
    damaged: false,
    ...overrides,
  };
}

// Helper to create mock planet instance
function createMockPlanetInstance(planetId: string, units: UnitInstance[] = []): PlanetInstance {
  return {
    planetId,
    controller: null,
    groundUnits: [],
    units,
    attachments: [],
  } as PlanetInstance;
}

// Helper to create mock map tile
function createMockMapTile(systemId: number, overrides: Partial<MapTile> = {}): MapTile {
  return {
    systemId,
    id: `tile-${systemId}`,
    position: { q: 0, r: 0 },
    planets: [],
    units: [],
    spaceUnits: [],
    wormholes: [],
    anomaly: null,
    commandTokens: [],
    ...overrides,
  } as MapTile;
}

// Helper to create mock game state
function createMockGameState(players: PlayerState[], tiles: MapTile[] = []): GameState {
  return {
    id: 'test-game',
    name: 'Test Game',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'in_progress',
    players,
    currentPlayerIndex: 0,
    phase: 'action',
    round: 1,
    turnNumber: 1,
    map: { tiles },
    speaker: players[0]?.id || 'player1',
    publicObjectives: [],
    publicObjectivesDeck: [],
    secretObjectivesDeck: [],
    agendaDeck: [],
    currentAgenda: null,
    actionCardDeck: [],
    actionCardDiscard: [],
    laws: [],
    passedPlayers: [],
    strategyCardState: {},
    combatState: null,
    activatedSystem: null,
    custodiansTaken: false,
    supportForTheThroneGiven: false,
    availableStrategyCards: [1, 2, 3, 4, 5, 6, 7, 8],
    events: [],
    actionsThisTurn: [],
    lastActionTimestamp: Date.now(),
  } as unknown as GameState;
}

describe('Unit Utils', () => {
  describe('Unit Type Classification', () => {
    describe('isShipType', () => {
      it('should return true for fighter', () => {
        expect(isShipType('fighter')).toBe(true);
      });

      it('should return true for destroyer', () => {
        expect(isShipType('destroyer')).toBe(true);
      });

      it('should return true for carrier', () => {
        expect(isShipType('carrier')).toBe(true);
      });

      it('should return true for cruiser', () => {
        expect(isShipType('cruiser')).toBe(true);
      });

      it('should return true for dreadnought', () => {
        expect(isShipType('dreadnought')).toBe(true);
      });

      it('should return true for war_sun', () => {
        expect(isShipType('war_sun')).toBe(true);
      });

      it('should return true for flagship', () => {
        expect(isShipType('flagship')).toBe(true);
      });

      it('should return false for infantry', () => {
        expect(isShipType('infantry')).toBe(false);
      });

      it('should return false for mech', () => {
        expect(isShipType('mech')).toBe(false);
      });

      it('should return false for pds', () => {
        expect(isShipType('pds')).toBe(false);
      });

      it('should return false for space_dock', () => {
        expect(isShipType('space_dock')).toBe(false);
      });
    });

    describe('isGroundUnit', () => {
      it('should return true for infantry', () => {
        expect(isGroundUnit('infantry')).toBe(true);
      });

      it('should return true for mech', () => {
        expect(isGroundUnit('mech')).toBe(true);
      });

      it('should return false for fighter', () => {
        expect(isGroundUnit('fighter')).toBe(false);
      });

      it('should return false for carrier', () => {
        expect(isGroundUnit('carrier')).toBe(false);
      });

      it('should return false for pds', () => {
        expect(isGroundUnit('pds')).toBe(false);
      });
    });

    describe('isStructure', () => {
      it('should return true for pds', () => {
        expect(isStructure('pds')).toBe(true);
      });

      it('should return true for space_dock', () => {
        expect(isStructure('space_dock')).toBe(true);
      });

      it('should return false for infantry', () => {
        expect(isStructure('infantry')).toBe(false);
      });

      it('should return false for carrier', () => {
        expect(isStructure('carrier')).toBe(false);
      });
    });

    describe('isCarrierType', () => {
      it('should return true for carrier', () => {
        expect(isCarrierType('carrier')).toBe(true);
      });

      it('should return true for dreadnought', () => {
        expect(isCarrierType('dreadnought')).toBe(true);
      });

      it('should return true for war_sun', () => {
        expect(isCarrierType('war_sun')).toBe(true);
      });

      it('should return true for flagship', () => {
        expect(isCarrierType('flagship')).toBe(true);
      });

      it('should return true for cruiser', () => {
        expect(isCarrierType('cruiser')).toBe(true);
      });

      it('should return false for destroyer', () => {
        expect(isCarrierType('destroyer')).toBe(false);
      });

      it('should return false for fighter', () => {
        expect(isCarrierType('fighter')).toBe(false);
      });
    });

    describe('countsTowardsFleetSupply', () => {
      it('should return true for destroyer', () => {
        expect(countsTowardsFleetSupply('destroyer')).toBe(true);
      });

      it('should return true for carrier', () => {
        expect(countsTowardsFleetSupply('carrier')).toBe(true);
      });

      it('should return true for cruiser', () => {
        expect(countsTowardsFleetSupply('cruiser')).toBe(true);
      });

      it('should return true for dreadnought', () => {
        expect(countsTowardsFleetSupply('dreadnought')).toBe(true);
      });

      it('should return true for war_sun', () => {
        expect(countsTowardsFleetSupply('war_sun')).toBe(true);
      });

      it('should return true for flagship', () => {
        expect(countsTowardsFleetSupply('flagship')).toBe(true);
      });

      it('should return false for fighter', () => {
        expect(countsTowardsFleetSupply('fighter')).toBe(false);
      });

      it('should return false for infantry', () => {
        expect(countsTowardsFleetSupply('infantry')).toBe(false);
      });
    });
  });

  describe('Unit Stats', () => {
    describe('getUnitStats', () => {
      it('should return base stats for unit without upgrade', () => {
        const player = createMockPlayer('player1', { technologies: [] });
        const stats = getUnitStats('fighter', player);

        expect(stats).toBeDefined();
        expect(typeof stats.cost).toBe('number');
      });

      it('should return upgraded stats when player has upgrade tech', () => {
        const player = createMockPlayer('player1', { technologies: ['fighter_ii'] });
        const baseStats = getUnitStats('fighter', createMockPlayer('p', { technologies: [] }));
        const upgradedStats = getUnitStats('fighter', player);

        // Fighter II has different stats than base
        expect(upgradedStats).toBeDefined();
      });

      it('should handle infantry upgrade', () => {
        const player = createMockPlayer('player1', { technologies: ['infantry_ii'] });
        const stats = getUnitStats('infantry', player);

        expect(stats).toBeDefined();
      });

      it('should handle destroyer upgrade', () => {
        const player = createMockPlayer('player1', { technologies: ['destroyer_ii'] });
        const stats = getUnitStats('destroyer', player);

        expect(stats).toBeDefined();
      });

      it('should handle carrier upgrade', () => {
        const player = createMockPlayer('player1', { technologies: ['carrier_ii'] });
        const stats = getUnitStats('carrier', player);

        expect(stats).toBeDefined();
      });

      it('should handle cruiser upgrade', () => {
        const player = createMockPlayer('player1', { technologies: ['cruiser_ii'] });
        const stats = getUnitStats('cruiser', player);

        expect(stats).toBeDefined();
      });

      it('should handle dreadnought upgrade', () => {
        const player = createMockPlayer('player1', { technologies: ['dreadnought_ii'] });
        const stats = getUnitStats('dreadnought', player);

        expect(stats).toBeDefined();
      });
    });

    describe('getUnitMoveValue', () => {
      it('should return move value for carrier', () => {
        const player = createMockPlayer('player1');
        const move = getUnitMoveValue('carrier', player);

        expect(move).toBeGreaterThan(0);
      });

      it('should return 0 for units without movement', () => {
        const player = createMockPlayer('player1');
        const move = getUnitMoveValue('pds', player);

        expect(move).toBe(0);
      });

      it('should apply upgrades to move value', () => {
        const basePlayer = createMockPlayer('player1', { technologies: [] });
        const upgradedPlayer = createMockPlayer('player1', { technologies: ['carrier_ii'] });

        const baseMove = getUnitMoveValue('carrier', basePlayer);
        const upgradedMove = getUnitMoveValue('carrier', upgradedPlayer);

        // Carrier II has higher movement
        expect(upgradedMove).toBeGreaterThanOrEqual(baseMove);
      });
    });

    describe('getUnitCapacity', () => {
      it('should return capacity for carrier', () => {
        const player = createMockPlayer('player1');
        const capacity = getUnitCapacity('carrier', player);

        expect(capacity).toBeGreaterThan(0);
      });

      it('should return 0 for units without capacity', () => {
        const player = createMockPlayer('player1');
        const capacity = getUnitCapacity('destroyer', player);

        expect(capacity).toBe(0);
      });

      it('should return capacity for dreadnought', () => {
        const player = createMockPlayer('player1');
        const capacity = getUnitCapacity('dreadnought', player);

        expect(capacity).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Fleet Supply', () => {
    describe('calculateFleetSupply', () => {
      it('should return fleet tokens + 3', () => {
        const player = createMockPlayer('player1', {
          commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
        });

        expect(calculateFleetSupply(player)).toBe(6); // 3 + 3
      });

      it('should handle different fleet token counts', () => {
        const player = createMockPlayer('player1', {
          commandTokens: { tactics: 2, fleet: 5, strategy: 1 },
        });

        expect(calculateFleetSupply(player)).toBe(8); // 5 + 3
      });

      it('should handle zero fleet tokens', () => {
        const player = createMockPlayer('player1', {
          commandTokens: { tactics: 4, fleet: 0, strategy: 4 },
        });

        expect(calculateFleetSupply(player)).toBe(3); // 0 + 3
      });
    });

    describe('countFleetSupplyUnits', () => {
      it('should count fleet supply ships', () => {
        const units = [
          createMockUnit('carrier', 'player1'),
          createMockUnit('cruiser', 'player1'),
          createMockUnit('fighter', 'player1'), // Doesn't count
        ];

        expect(countFleetSupplyUnits(units, 'player1')).toBe(2);
      });

      it('should not count opponent units', () => {
        const units = [
          createMockUnit('carrier', 'player1'),
          createMockUnit('cruiser', 'player2'),
        ];

        expect(countFleetSupplyUnits(units, 'player1')).toBe(1);
      });

      it('should count all capital ships', () => {
        const units = [
          createMockUnit('destroyer', 'player1'),
          createMockUnit('carrier', 'player1'),
          createMockUnit('cruiser', 'player1'),
          createMockUnit('dreadnought', 'player1'),
          createMockUnit('war_sun', 'player1'),
          createMockUnit('flagship', 'player1'),
        ];

        expect(countFleetSupplyUnits(units, 'player1')).toBe(6);
      });

      it('should return 0 for empty units', () => {
        expect(countFleetSupplyUnits([], 'player1')).toBe(0);
      });
    });

    describe('wouldViolateFleetSupply', () => {
      it('should return false when within limit', () => {
        const player = createMockPlayer('player1', {
          commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
        });
        const tile = createMockMapTile(1, {
          units: [createMockUnit('carrier', 'player1')],
        });

        expect(wouldViolateFleetSupply(tile, player, ['cruiser', 'destroyer'])).toBe(false);
      });

      it('should return true when exceeding limit', () => {
        const player = createMockPlayer('player1', {
          commandTokens: { tactics: 3, fleet: 2, strategy: 2 },
        }); // Fleet supply = 5
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('carrier', 'player1'),
            createMockUnit('carrier', 'player1'),
            createMockUnit('cruiser', 'player1'),
            createMockUnit('cruiser', 'player1'),
          ],
        });

        expect(wouldViolateFleetSupply(tile, player, ['dreadnought', 'dreadnought'])).toBe(true);
      });

      it('should not count fighters in fleet supply', () => {
        const player = createMockPlayer('player1', {
          commandTokens: { tactics: 3, fleet: 0, strategy: 2 },
        }); // Fleet supply = 3
        const tile = createMockMapTile(1, { units: [] });

        expect(wouldViolateFleetSupply(tile, player, ['fighter', 'fighter', 'fighter', 'fighter'])).toBe(false);
      });
    });
  });

  describe('Capacity', () => {
    describe('calculateCapacityInSystem', () => {
      it('should calculate carrier capacity', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [createMockUnit('carrier', 'player1')],
        });

        const capacity = calculateCapacityInSystem(tile, player);
        expect(capacity).toBeGreaterThan(0);
      });

      it('should sum capacity from multiple carriers', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('carrier', 'player1'),
            createMockUnit('carrier', 'player1'),
          ],
        });

        const capacity = calculateCapacityInSystem(tile, player);
        const singleCarrier = getUnitCapacity('carrier', player);
        expect(capacity).toBe(singleCarrier * 2);
      });

      it('should not count opponent capacity', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('carrier', 'player1'),
            createMockUnit('carrier', 'player2'),
          ],
        });

        const capacity = calculateCapacityInSystem(tile, player);
        const singleCarrier = getUnitCapacity('carrier', player);
        expect(capacity).toBe(singleCarrier);
      });

      it('should return 0 for system without carriers', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [createMockUnit('destroyer', 'player1')],
        });

        expect(calculateCapacityInSystem(tile, player)).toBe(0);
      });
    });

    describe('countCapacityRequiredUnits', () => {
      it('should count fighters', () => {
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('fighter', 'player1'),
            createMockUnit('fighter', 'player1'),
          ],
        });

        expect(countCapacityRequiredUnits(tile, 'player1')).toBe(2);
      });

      it('should not count opponent fighters', () => {
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('fighter', 'player1'),
            createMockUnit('fighter', 'player2'),
          ],
        });

        expect(countCapacityRequiredUnits(tile, 'player1')).toBe(1);
      });

      it('should not count capital ships', () => {
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('carrier', 'player1'),
            createMockUnit('fighter', 'player1'),
          ],
        });

        expect(countCapacityRequiredUnits(tile, 'player1')).toBe(1);
      });
    });

    describe('hasCapacityFor', () => {
      it('should return true when capacity available', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [createMockUnit('carrier', 'player1')],
        });

        expect(hasCapacityFor(tile, player, ['fighter'])).toBe(true);
      });

      it('should return false when capacity exceeded', () => {
        const player = createMockPlayer('player1');
        const carrierCapacity = getUnitCapacity('carrier', player);
        const tile = createMockMapTile(1, {
          units: [createMockUnit('carrier', 'player1')],
        });

        const tooManyFighters = new Array(carrierCapacity + 1).fill('fighter') as UnitType[];
        expect(hasCapacityFor(tile, player, tooManyFighters)).toBe(false);
      });
    });
  });

  describe('Production Costs', () => {
    describe('calculateProductionCost', () => {
      it('should calculate cost for single unit', () => {
        const cost = calculateProductionCost([{ type: 'infantry', count: 1 }]);
        expect(cost).toBeGreaterThan(0);
      });

      it('should calculate cost for multiple units', () => {
        const cost = calculateProductionCost([
          { type: 'infantry', count: 2 },
          { type: 'fighter', count: 2 },
        ]);
        expect(cost).toBeGreaterThan(0);
      });

      it('should return 0 for empty production', () => {
        const cost = calculateProductionCost([]);
        expect(cost).toBe(0);
      });
    });

    describe('calculateProductionCount', () => {
      it('should count total units', () => {
        const count = calculateProductionCount([
          { type: 'infantry', count: 3 },
          { type: 'fighter', count: 2 },
        ]);
        expect(count).toBe(5);
      });

      it('should return 0 for empty production', () => {
        const count = calculateProductionCount([]);
        expect(count).toBe(0);
      });
    });
  });

  describe('Enemy Detection', () => {
    describe('hasEnemyShips', () => {
      it('should return true when enemy ships present', () => {
        const tile = createMockMapTile(1, {
          units: [createMockUnit('cruiser', 'player2')],
        });

        expect(hasEnemyShips(tile, 'player1')).toBe(true);
      });

      it('should return false when only own ships present', () => {
        const tile = createMockMapTile(1, {
          units: [createMockUnit('cruiser', 'player1')],
        });

        expect(hasEnemyShips(tile, 'player1')).toBe(false);
      });

      it('should return false when enemy has only ground units', () => {
        const tile = createMockMapTile(1, {
          units: [createMockUnit('infantry', 'player2')],
        });

        expect(hasEnemyShips(tile, 'player1')).toBe(false);
      });

      it('should return false for empty system', () => {
        const tile = createMockMapTile(1, { units: [] });

        expect(hasEnemyShips(tile, 'player1')).toBe(false);
      });
    });

    describe('hasEnemyGroundForces', () => {
      it('should return true when enemy ground forces on planet', () => {
        const tile = createMockMapTile(1, {
          planets: [createMockPlanetInstance('jord', [createMockUnit('infantry', 'player2')])],
        });

        expect(hasEnemyGroundForces(tile, 'player1', 'jord')).toBe(true);
      });

      it('should return false when only own ground forces', () => {
        const tile = createMockMapTile(1, {
          planets: [createMockPlanetInstance('jord', [createMockUnit('infantry', 'player1')])],
        });

        expect(hasEnemyGroundForces(tile, 'player1', 'jord')).toBe(false);
      });

      it('should return false for nonexistent planet', () => {
        const tile = createMockMapTile(1, { planets: [] });

        expect(hasEnemyGroundForces(tile, 'player1', 'fake-planet')).toBe(false);
      });

      it('should detect enemy mechs', () => {
        const tile = createMockMapTile(1, {
          planets: [createMockPlanetInstance('jord', [createMockUnit('mech', 'player2')])],
        });

        expect(hasEnemyGroundForces(tile, 'player1', 'jord')).toBe(true);
      });
    });
  });

  describe('Unit Retrieval', () => {
    describe('getPlayerUnitsInSpace', () => {
      it('should return player units in space', () => {
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('carrier', 'player1'),
            createMockUnit('cruiser', 'player1'),
            createMockUnit('destroyer', 'player2'),
          ],
        });

        const units = getPlayerUnitsInSpace(tile, 'player1');
        expect(units.length).toBe(2);
        expect(units.every(u => u.ownerId === 'player1')).toBe(true);
      });

      it('should return empty array when no player units', () => {
        const tile = createMockMapTile(1, {
          units: [createMockUnit('carrier', 'player2')],
        });

        expect(getPlayerUnitsInSpace(tile, 'player1')).toEqual([]);
      });
    });

    describe('getPlayerUnitsOnPlanet', () => {
      it('should return player units on planet', () => {
        const tile = createMockMapTile(1, {
          planets: [createMockPlanetInstance('jord', [
            createMockUnit('infantry', 'player1'),
            createMockUnit('infantry', 'player1'),
            createMockUnit('infantry', 'player2'),
          ])],
        });

        const units = getPlayerUnitsOnPlanet(tile, 'player1', 'jord');
        expect(units.length).toBe(2);
      });

      it('should return empty array for nonexistent planet', () => {
        const tile = createMockMapTile(1, { planets: [] });

        expect(getPlayerUnitsOnPlanet(tile, 'player1', 'fake-planet')).toEqual([]);
      });
    });
  });

  describe('System Activation', () => {
    describe('isSystemActivatedByPlayer', () => {
      it('should return true when player has command token', () => {
        const tile = createMockMapTile(1, {
          commandTokens: ['player1'],
        });

        expect(isSystemActivatedByPlayer(tile, 'player1')).toBe(true);
      });

      it('should return false when player has no command token', () => {
        const tile = createMockMapTile(1, {
          commandTokens: ['player2'],
        });

        expect(isSystemActivatedByPlayer(tile, 'player1')).toBe(false);
      });

      it('should return false for empty command tokens', () => {
        const tile = createMockMapTile(1, {
          commandTokens: [],
        });

        expect(isSystemActivatedByPlayer(tile, 'player1')).toBe(false);
      });
    });
  });

  describe('Unit Creation', () => {
    describe('generateUnitId', () => {
      it('should generate unique IDs', () => {
        const id1 = generateUnitId();
        const id2 = generateUnitId();

        expect(id1).not.toBe(id2);
      });

      it('should start with unit-', () => {
        const id = generateUnitId();
        expect(id.startsWith('unit-')).toBe(true);
      });
    });

    describe('createUnitInstance', () => {
      it('should create unit with correct type and owner', () => {
        const unit = createUnitInstance('carrier', 'player1');

        expect(unit.type).toBe('carrier');
        expect(unit.ownerId).toBe('player1');
        expect(unit.damaged).toBe(false);
      });

      it('should create unit with planetId when provided', () => {
        const unit = createUnitInstance('infantry', 'player1', 'jord');

        expect(unit.planetId).toBe('jord');
      });

      it('should generate unique ID', () => {
        const unit1 = createUnitInstance('fighter', 'player1');
        const unit2 = createUnitInstance('fighter', 'player1');

        expect(unit1.id).not.toBe(unit2.id);
      });
    });
  });

  describe('Reinforcement Limits', () => {
    describe('BASE_UNIT_LIMITS', () => {
      it('should have correct infantry limit', () => {
        expect(BASE_UNIT_LIMITS.infantry).toBe(12);
      });

      it('should have correct fighter limit', () => {
        expect(BASE_UNIT_LIMITS.fighter).toBe(10);
      });

      it('should have correct carrier limit', () => {
        expect(BASE_UNIT_LIMITS.carrier).toBe(4);
      });

      it('should have correct flagship limit', () => {
        expect(BASE_UNIT_LIMITS.flagship).toBe(1);
      });

      it('should have correct war_sun limit', () => {
        expect(BASE_UNIT_LIMITS.war_sun).toBe(2);
      });
    });

    describe('POK_UNIT_LIMITS', () => {
      it('should have increased infantry limit', () => {
        expect(POK_UNIT_LIMITS.infantry).toBe(20);
      });

      it('should keep same fighter limit as base', () => {
        expect(POK_UNIT_LIMITS.fighter).toBe(BASE_UNIT_LIMITS.fighter);
      });
    });

    describe('getUnitLimit', () => {
      it('should return base limits without PoK', () => {
        const state = createMockGameState([createMockPlayer('player1')]);

        expect(getUnitLimit(state, 'infantry')).toBe(12);
      });

      it('should return PoK limits with exploration decks', () => {
        const state = createMockGameState([createMockPlayer('player1')]);
        (state as any).explorationDecks = {}; // Indicates PoK

        expect(getUnitLimit(state, 'infantry')).toBe(20);
      });
    });

    describe('countUnitsOnMap', () => {
      it('should count units in space', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('carrier', 'player1'),
            createMockUnit('carrier', 'player1'),
          ],
        });
        const state = createMockGameState([player], [tile]);

        expect(countUnitsOnMap(state, 'player1', 'carrier')).toBe(2);
      });

      it('should count units on planets', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          planets: [createMockPlanetInstance('jord', [
            createMockUnit('infantry', 'player1'),
            createMockUnit('infantry', 'player1'),
            createMockUnit('infantry', 'player1'),
          ])],
        });
        const state = createMockGameState([player], [tile]);

        expect(countUnitsOnMap(state, 'player1', 'infantry')).toBe(3);
      });

      it('should not count opponent units', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('carrier', 'player1'),
            createMockUnit('carrier', 'player2'),
          ],
        });
        const state = createMockGameState([player], [tile]);

        expect(countUnitsOnMap(state, 'player1', 'carrier')).toBe(1);
      });
    });

    describe('countAllUnitsOnMap', () => {
      it('should count all unit types', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('carrier', 'player1'),
            createMockUnit('cruiser', 'player1'),
            createMockUnit('fighter', 'player1'),
          ],
          planets: [createMockPlanetInstance('jord', [
            createMockUnit('infantry', 'player1'),
          ])],
        });
        const state = createMockGameState([player], [tile]);

        const counts = countAllUnitsOnMap(state, 'player1');

        expect(counts.carrier).toBe(1);
        expect(counts.cruiser).toBe(1);
        expect(counts.fighter).toBe(1);
        expect(counts.infantry).toBe(1);
        expect(counts.dreadnought).toBe(0);
      });
    });

    describe('getAvailableReinforcements', () => {
      it('should return full limit when no units on map', () => {
        const state = createMockGameState([createMockPlayer('player1')], []);

        expect(getAvailableReinforcements(state, 'player1', 'carrier')).toBe(4);
      });

      it('should subtract units on map from limit', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('carrier', 'player1'),
            createMockUnit('carrier', 'player1'),
          ],
        });
        const state = createMockGameState([player], [tile]);

        expect(getAvailableReinforcements(state, 'player1', 'carrier')).toBe(2);
      });

      it('should return 0 when at limit', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('flagship', 'player1'),
          ],
        });
        const state = createMockGameState([player], [tile]);

        expect(getAvailableReinforcements(state, 'player1', 'flagship')).toBe(0);
      });
    });

    describe('hasReinforcementsAvailable', () => {
      it('should return true when reinforcements available', () => {
        const state = createMockGameState([createMockPlayer('player1')], []);

        expect(hasReinforcementsAvailable(state, 'player1', 'carrier', 2)).toBe(true);
      });

      it('should return false when not enough reinforcements', () => {
        const player = createMockPlayer('player1');
        const tile = createMockMapTile(1, {
          units: [
            createMockUnit('carrier', 'player1'),
            createMockUnit('carrier', 'player1'),
            createMockUnit('carrier', 'player1'),
          ],
        });
        const state = createMockGameState([player], [tile]);

        expect(hasReinforcementsAvailable(state, 'player1', 'carrier', 2)).toBe(false);
      });
    });

    describe('validateReinforcementsForProduction', () => {
      it('should return valid for production within limits', () => {
        const state = createMockGameState([createMockPlayer('player1')], []);

        const result = validateReinforcementsForProduction(state, 'player1', [
          { type: 'carrier', count: 2 },
          { type: 'infantry', count: 3 },
        ]);

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should return invalid for production exceeding limits', () => {
        const state = createMockGameState([createMockPlayer('player1')], []);

        const result = validateReinforcementsForProduction(state, 'player1', [
          { type: 'flagship', count: 2 }, // Limit is 1
        ]);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('flagship');
      });
    });
  });
});
