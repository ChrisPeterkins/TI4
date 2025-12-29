import type {
  GameState,
  PlayerState,
  MapTile,
  UnitInstance,
  UnitType,
  UnitData,
  HexCoord,
} from '@ti4/shared';
import { units, upgradedUnits } from '@ti4/game-data';
import { systems } from '@ti4/game-data';

// Unit category types for easy categorization
export type ShipType = 'fighter' | 'destroyer' | 'carrier' | 'cruiser' | 'dreadnought' | 'war_sun' | 'flagship';
export type GroundUnitType = 'infantry' | 'mech';
export type StructureType = 'pds' | 'space_dock';

const SHIP_TYPES: Set<UnitType> = new Set([
  'fighter', 'destroyer', 'carrier', 'cruiser', 'dreadnought', 'war_sun', 'flagship'
]);

const GROUND_TYPES: Set<UnitType> = new Set(['infantry', 'mech']);

const STRUCTURE_TYPES: Set<UnitType> = new Set(['pds', 'space_dock']);

// Units that have capacity to carry other units
const CARRIER_TYPES: Set<UnitType> = new Set(['carrier', 'dreadnought', 'war_sun', 'flagship', 'cruiser']);

// Units that count towards fleet supply
const FLEET_SUPPLY_TYPES: Set<UnitType> = new Set([
  'destroyer', 'carrier', 'cruiser', 'dreadnought', 'war_sun', 'flagship'
]);

/**
 * Check if a unit type is a ship (can be in space)
 */
export function isShipType(type: UnitType): boolean {
  return SHIP_TYPES.has(type);
}

/**
 * Check if a unit type is a ground unit
 */
export function isGroundUnit(type: UnitType): boolean {
  return GROUND_TYPES.has(type);
}

/**
 * Check if a unit type is a structure
 */
export function isStructure(type: UnitType): boolean {
  return STRUCTURE_TYPES.has(type);
}

/**
 * Check if a unit type can carry other units
 */
export function isCarrierType(type: UnitType): boolean {
  return CARRIER_TYPES.has(type);
}

/**
 * Check if a unit type counts towards fleet supply
 */
export function countsTowardsFleetSupply(type: UnitType): boolean {
  return FLEET_SUPPLY_TYPES.has(type);
}

/**
 * Get unit data with upgrades applied if the player has them
 */
export function getUnitStats(type: UnitType, player: PlayerState): UnitData {
  const baseStats = units[type];

  // Check for unit upgrade tech
  const upgradeMap: Partial<Record<UnitType, string>> = {
    fighter: 'fighter_ii',
    infantry: 'infantry_ii',
    destroyer: 'destroyer_ii',
    carrier: 'carrier_ii',
    cruiser: 'cruiser_ii',
    dreadnought: 'dreadnought_ii',
    pds: 'pds_ii',
    space_dock: 'space_dock_ii',
  };

  const upgradeTechId = upgradeMap[type];
  if (upgradeTechId && player.technologies.includes(upgradeTechId)) {
    const upgrades = upgradedUnits[type];
    if (upgrades) {
      return { ...baseStats, ...upgrades };
    }
  }

  return baseStats;
}

/**
 * Get movement value for a unit, considering upgrades
 */
export function getUnitMoveValue(type: UnitType, player: PlayerState): number {
  const stats = getUnitStats(type, player);
  return stats.move || 0;
}

/**
 * Get capacity value for a unit, considering upgrades
 */
export function getUnitCapacity(type: UnitType, player: PlayerState): number {
  const stats = getUnitStats(type, player);
  return stats.capacity || 0;
}

/**
 * Calculate player's fleet supply (fleet tokens + 3)
 */
export function calculateFleetSupply(player: PlayerState): number {
  return player.commandTokens.fleet + 3;
}

/**
 * Count ships in a system that count towards fleet supply
 */
export function countFleetSupplyUnits(units: UnitInstance[], playerId: string): number {
  return units.filter(u =>
    u.ownerId === playerId && countsTowardsFleetSupply(u.type)
  ).length;
}

/**
 * Check if adding units would violate fleet supply
 */
export function wouldViolateFleetSupply(
  tile: MapTile,
  player: PlayerState,
  additionalShips: UnitType[]
): boolean {
  const currentCount = countFleetSupplyUnits(tile.units, player.id);
  const newShipCount = additionalShips.filter(t => countsTowardsFleetSupply(t)).length;
  const fleetSupply = calculateFleetSupply(player);

  return (currentCount + newShipCount) > fleetSupply;
}

/**
 * Calculate total capacity available in a system for a player
 */
export function calculateCapacityInSystem(
  tile: MapTile,
  player: PlayerState
): number {
  let capacity = 0;

  for (const unit of tile.units) {
    if (unit.ownerId === player.id && isCarrierType(unit.type)) {
      capacity += getUnitCapacity(unit.type, player);
    }
  }

  return capacity;
}

/**
 * Count units that require capacity (fighters, infantry, mech)
 * Fighters in space, ground units being transported
 */
export function countCapacityRequiredUnits(
  tile: MapTile,
  playerId: string
): number {
  return tile.units.filter(u =>
    u.ownerId === playerId &&
    (u.type === 'fighter' || (!u.planetId && isGroundUnit(u.type)))
  ).length;
}

/**
 * Check if a player can fit units within their capacity
 */
export function hasCapacityFor(
  tile: MapTile,
  player: PlayerState,
  additionalUnits: UnitType[]
): boolean {
  const capacity = calculateCapacityInSystem(tile, player);
  const current = countCapacityRequiredUnits(tile, player.id);
  const additional = additionalUnits.filter(t =>
    t === 'fighter' || isGroundUnit(t)
  ).length;

  return (current + additional) <= capacity;
}

/**
 * Calculate production capacity at a space dock
 * Base production is 2 (or 6 for upgraded), plus planet resources
 */
export function calculateProductionCapacity(
  tile: MapTile,
  player: PlayerState
): number {
  // Find space dock on any planet in this system
  let totalProduction = 0;

  for (const planet of tile.planets) {
    const spaceDock = planet.units.find(
      u => u.ownerId === player.id && u.type === 'space_dock'
    );

    if (spaceDock) {
      const stats = getUnitStats('space_dock', player);
      const baseProduction = stats.production !== undefined ? stats.production : 0;
      // Base production is 2 for regular space dock (production: 0 means base 2)
      // Upgraded is 6 (production: 4 means base 2 + 4 = 6)
      const dockProduction = 2 + baseProduction;

      // Find planet data to get resources
      const planetData = getPlanetResources(planet.planetId);
      const resources = planetData?.resources || 0;

      totalProduction += dockProduction + resources;
    }
  }

  // Also check for floating space docks (Clan of Saar)
  const floatingDock = tile.units.find(
    u => u.ownerId === player.id && u.type === 'space_dock'
  );
  if (floatingDock) {
    const stats = getUnitStats('space_dock', player);
    const baseProduction = stats.production !== undefined ? stats.production : 0;
    totalProduction += 2 + baseProduction;
  }

  return totalProduction;
}

/**
 * Calculate available resources from unexhausted planets and trade goods
 */
export function calculateAvailableResources(
  state: GameState,
  player: PlayerState
): number {
  let resources = 0;

  // Add trade goods
  resources += player.tradeGoods;

  // Add resources from unexhausted planets
  for (const planet of player.planets) {
    if (!planet.exhausted) {
      const planetData = getPlanetResources(planet.planetId);
      if (planetData) {
        resources += planetData.resources;
      }
    }
  }

  return resources;
}

/**
 * Get planet resources from game data
 */
function getPlanetResources(planetId: string): { resources: number; influence: number } | null {
  // Search through all systems for the planet
  for (const system of Object.values(systems)) {
    const planet = system.planets.find(p => p.id === planetId);
    if (planet) {
      return { resources: planet.resources, influence: planet.influence };
    }
  }
  return null;
}

/**
 * Calculate total cost of units to produce
 */
export function calculateProductionCost(
  unitsToProduce: { type: UnitType; count: number }[]
): number {
  let cost = 0;

  for (const production of unitsToProduce) {
    const unitData = units[production.type];
    cost += unitData.cost * production.count;
  }

  return cost;
}

/**
 * Calculate total production count (number of units)
 */
export function calculateProductionCount(
  unitsToProduce: { type: UnitType; count: number }[]
): number {
  return unitsToProduce.reduce((sum, p) => sum + p.count, 0);
}

/**
 * Check if a system has enemy ships (for combat detection)
 */
export function hasEnemyShips(tile: MapTile, playerId: string): boolean {
  return tile.units.some(u =>
    u.ownerId !== playerId && isShipType(u.type)
  );
}

/**
 * Check if a planet has enemy ground forces (for invasion)
 */
export function hasEnemyGroundForces(tile: MapTile, playerId: string, planetId: string): boolean {
  const planet = tile.planets.find(p => p.planetId === planetId);
  if (!planet) return false;

  return planet.units.some(u =>
    u.ownerId !== playerId && isGroundUnit(u.type)
  );
}

/**
 * Get all units owned by a player in a system (space only)
 */
export function getPlayerUnitsInSpace(tile: MapTile, playerId: string): UnitInstance[] {
  return tile.units.filter(u => u.ownerId === playerId);
}

/**
 * Get all units owned by a player on a specific planet
 */
export function getPlayerUnitsOnPlanet(
  tile: MapTile,
  playerId: string,
  planetId: string
): UnitInstance[] {
  const planet = tile.planets.find(p => p.planetId === planetId);
  if (!planet) return [];

  return planet.units.filter(u => u.ownerId === playerId);
}

/**
 * Find the activated system (most recently placed command token by player)
 * In a tactical action, this is where units must move TO
 */
export function findActivatedSystem(state: GameState, playerId: string): MapTile | null {
  // The activated system is stored separately on the game state when we implement it
  // For now, we'll use the first tile with the player's command token that was placed this turn
  // In the full implementation, we'd track this on the state during tactical action

  for (const tile of state.map.tiles) {
    if (tile.commandTokens.includes(playerId)) {
      return tile;
    }
  }

  return null;
}

/**
 * Check if a system was activated this round by the player
 */
export function isSystemActivatedByPlayer(tile: MapTile, playerId: string): boolean {
  return tile.commandTokens.includes(playerId);
}

/**
 * Generate a unique ID for a new unit
 */
export function generateUnitId(): string {
  return `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new unit instance
 */
export function createUnitInstance(
  type: UnitType,
  ownerId: string,
  planetId?: string
): UnitInstance {
  return {
    id: generateUnitId(),
    type,
    ownerId,
    damaged: false,
    planetId,
  };
}
