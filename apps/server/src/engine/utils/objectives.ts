import type {
  GameState,
  PlayerState,
  MapTile,
  PlanetTrait,
  TechColor,
  ObjectiveData,
  SpentResources,
  HexCoord,
} from '@ti4/shared';
import { OBJECTIVES_BY_ID } from '@ti4/shared';
import { systems, technologies, factions } from '@ti4/game-data';
import { isShipType, isStructure, isGroundUnit } from './units.js';
import { getAdjacentTiles, getAdjacentPositions, findTileAtPosition } from './hex.js';

// =============================================================================
// HOME SYSTEM CONTROL
// =============================================================================

/**
 * Get the home system tile for a player's faction
 */
export function getHomeSystemTile(state: GameState, playerId: string): MapTile | null {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return null;

  const faction = factions[player.faction];
  if (!faction) return null;

  const homeSystemId = faction.homeSystemId;
  return state.map.tiles.find(t => t.systemId === homeSystemId) || null;
}

/**
 * Get all planet IDs in a player's home system
 */
export function getHomeSystemPlanetIds(state: GameState, playerId: string): string[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  const faction = factions[player.faction];
  if (!faction) return [];

  const homeSystem = systems[faction.homeSystemId];
  if (!homeSystem) return [];

  return homeSystem.planets.map(p => p.id);
}

/**
 * Check if a player controls all planets in their home system
 * Required for scoring public objectives
 */
export function controlsHomeSystem(state: GameState, playerId: string): boolean {
  const homeSystemPlanetIds = getHomeSystemPlanetIds(state, playerId);
  if (homeSystemPlanetIds.length === 0) return false;

  const homeTile = getHomeSystemTile(state, playerId);
  if (!homeTile) return false;

  // Check each home system planet is controlled by the player
  for (const planetId of homeSystemPlanetIds) {
    const planetInstance = homeTile.planets.find(p => p.planetId === planetId);
    if (!planetInstance || planetInstance.controlledBy !== playerId) {
      return false;
    }
  }

  return true;
}

// =============================================================================
// PLANET HELPERS
// =============================================================================

/**
 * Get all planets controlled by a player (from all tiles)
 */
export function getControlledPlanets(state: GameState, playerId: string): {
  planetId: string;
  tileId: string;
  trait?: PlanetTrait;
  techSpecialty?: TechColor;
  resources: number;
  influence: number;
  legendary?: boolean;
  attachments: string[];
}[] {
  const controlled: {
    planetId: string;
    tileId: string;
    trait?: PlanetTrait;
    techSpecialty?: TechColor;
    resources: number;
    influence: number;
    legendary?: boolean;
    attachments: string[];
  }[] = [];

  for (const tile of state.map.tiles) {
    for (const planetInstance of tile.planets) {
      if (planetInstance.controlledBy === playerId) {
        // Find planet data
        const system = systems[tile.systemId];
        const planetData = system?.planets.find(p => p.id === planetInstance.planetId);

        if (planetData) {
          controlled.push({
            planetId: planetInstance.planetId,
            tileId: tile.id,
            trait: planetData.trait,
            techSpecialty: planetData.techSpecialty,
            resources: planetData.resources,
            influence: planetData.influence,
            legendary: planetData.legendary,
            attachments: planetInstance.attachments,
          });
        }
      }
    }
  }

  return controlled;
}

/**
 * Check if a tile is a home system (for any player)
 */
export function isHomeSystem(tile: MapTile): boolean {
  const system = systems[tile.systemId];
  return system?.type === 'home';
}

/**
 * Check if a tile is another player's home system
 */
export function isEnemyHomeSystem(state: GameState, tile: MapTile, playerId: string): boolean {
  if (!isHomeSystem(tile)) return false;

  const system = systems[tile.systemId];
  if (!system?.factionId) return false;

  // Find the player who owns this home system
  const owningPlayer = state.players.find(p => p.faction === system.factionId);
  return owningPlayer !== undefined && owningPlayer.id !== playerId;
}

// =============================================================================
// TECHNOLOGY HELPERS
// =============================================================================

/**
 * Count technologies by color for a player
 */
export function countTechByColor(player: PlayerState): Record<TechColor, number> {
  const counts: Record<TechColor, number> = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
  };

  for (const techId of player.technologies) {
    const tech = technologies[techId];
    if (tech?.type === 'color' && tech.color) {
      counts[tech.color]++;
    }
  }

  return counts;
}

/**
 * Count unit upgrade technologies for a player
 */
export function countUnitUpgradeTechs(player: PlayerState): number {
  let count = 0;

  for (const techId of player.technologies) {
    const tech = technologies[techId];
    if (tech?.type === 'unit_upgrade') {
      count++;
    }
  }

  return count;
}

/**
 * Count faction-specific technologies for a player
 */
export function countFactionTechs(player: PlayerState): number {
  let count = 0;

  for (const techId of player.technologies) {
    const tech = technologies[techId];
    if (tech?.factionId && tech.factionId === player.faction) {
      count++;
    }
  }

  return count;
}

// =============================================================================
// UNIT HELPERS
// =============================================================================

/**
 * Count all units of specified types owned by a player on the board
 */
export function countUnitsOnBoard(
  state: GameState,
  playerId: string,
  unitTypes: string[]
): number {
  let count = 0;

  for (const tile of state.map.tiles) {
    // Units in space
    for (const unit of tile.units) {
      if (unit.ownerId === playerId && unitTypes.includes(unit.type)) {
        count++;
      }
    }

    // Units on planets
    for (const planet of tile.planets) {
      for (const unit of planet.units) {
        if (unit.ownerId === playerId && unitTypes.includes(unit.type)) {
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Count structures owned by a player
 */
export function countStructures(state: GameState, playerId: string): number {
  return countUnitsOnBoard(state, playerId, ['pds', 'space_dock']);
}

/**
 * Count structures on planets outside home system
 */
export function countStructuresOutsideHome(state: GameState, playerId: string): number {
  const homeSystemPlanetIds = new Set(getHomeSystemPlanetIds(state, playerId));
  let count = 0;

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (homeSystemPlanetIds.has(planet.planetId)) continue;

      for (const unit of planet.units) {
        if (unit.ownerId === playerId && isStructure(unit.type)) {
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Count planets with structures outside home system
 */
export function countPlanetsWithStructuresOutsideHome(state: GameState, playerId: string): number {
  const homeSystemPlanetIds = new Set(getHomeSystemPlanetIds(state, playerId));
  let count = 0;

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (homeSystemPlanetIds.has(planet.planetId)) continue;

      const hasStructure = planet.units.some(
        u => u.ownerId === playerId && isStructure(u.type)
      );
      if (hasStructure) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Count systems where player has ships
 */
export function countSystemsWithShips(state: GameState, playerId: string): number {
  let count = 0;

  for (const tile of state.map.tiles) {
    const hasShips = tile.units.some(
      u => u.ownerId === playerId && isShipType(u.type)
    );
    if (hasShips) {
      count++;
    }
  }

  return count;
}

/**
 * Count non-fighter ships in a single system
 */
export function countNonFighterShipsInSystem(tile: MapTile, playerId: string): number {
  return tile.units.filter(
    u => u.ownerId === playerId && isShipType(u.type) && u.type !== 'fighter'
  ).length;
}

/**
 * Get max non-fighter ships in any single system
 */
export function getMaxNonFighterShipsInAnySystem(state: GameState, playerId: string): number {
  let max = 0;

  for (const tile of state.map.tiles) {
    const count = countNonFighterShipsInSystem(tile, playerId);
    if (count > max) {
      max = count;
    }
  }

  return max;
}

// =============================================================================
// SPECIAL SYSTEM HELPERS
// =============================================================================

/**
 * Check if a tile is adjacent to Mecatol Rex
 */
export function isAdjacentToMecatol(state: GameState, tilePosition: HexCoord): boolean {
  // Find Mecatol Rex tile
  const mecatolTile = state.map.tiles.find(t => {
    const system = systems[t.systemId];
    return system?.type === 'mecatol';
  });

  if (!mecatolTile) return false;

  // Check if positions are adjacent (distance of 1)
  const dq = Math.abs(tilePosition.q - mecatolTile.position.q);
  const dr = Math.abs(tilePosition.r - mecatolTile.position.r);
  const ds = Math.abs((-tilePosition.q - tilePosition.r) - (-mecatolTile.position.q - mecatolTile.position.r));

  return Math.max(dq, dr, ds) === 1;
}

/**
 * Count systems adjacent to Mecatol where player has ships
 */
export function countSystemsAdjacentToMecatolWithShips(state: GameState, playerId: string): number {
  let count = 0;

  for (const tile of state.map.tiles) {
    if (!isAdjacentToMecatol(state, tile.position)) continue;

    const hasShips = tile.units.some(
      u => u.ownerId === playerId && isShipType(u.type)
    );
    if (hasShips) {
      count++;
    }
  }

  return count;
}

/**
 * Check if player controls Mecatol Rex
 */
export function controlsMecatol(state: GameState, playerId: string): boolean {
  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (system?.type !== 'mecatol') continue;

    const mecatolPlanet = tile.planets.find(p => p.planetId === 'mecatol_rex');
    return mecatolPlanet?.controlledBy === playerId;
  }

  return false;
}

/**
 * Count ships in Mecatol system
 */
export function countShipsAtMecatol(state: GameState, playerId: string): number {
  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (system?.type !== 'mecatol') continue;

    return tile.units.filter(
      u => u.ownerId === playerId && isShipType(u.type)
    ).length;
  }

  return 0;
}

// =============================================================================
// ADDITIONAL OBJECTIVE HELPERS
// =============================================================================

/**
 * Count systems where player has units but system has no planets (empty systems)
 */
export function countSystemsWithUnitsNoPlanets(state: GameState, playerId: string): number {
  let count = 0;

  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (!system) continue;

    // Empty system = no planets
    if (system.planets.length > 0) continue;

    // Check for units owned by player
    const hasUnits = tile.units.some(u => u.ownerId === playerId);
    if (hasUnits) {
      count++;
    }
  }

  return count;
}

/**
 * Count systems with units that are "special" (legendary planet, Mecatol, or anomaly)
 */
export function countSpecialSystemsWithUnits(state: GameState, playerId: string): number {
  let count = 0;

  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (!system) continue;

    // Check if special: has anomaly, is Mecatol, or has legendary planet
    const isSpecial =
      system.anomaly !== undefined ||
      system.type === 'mecatol' ||
      system.planets.some(p => p.legendary);

    if (!isSpecial) continue;

    // Check for units (in space or on planets)
    const hasUnits =
      tile.units.some(u => u.ownerId === playerId) ||
      tile.planets.some(p => p.units.some(u => u.ownerId === playerId));

    if (hasUnits) {
      count++;
    }
  }

  return count;
}

/**
 * Count edge systems where player has units (edge = not adjacent to center / ring 3)
 * For standard maps, edge systems are furthest from center
 */
export function countEdgeSystemsWithUnits(state: GameState, playerId: string): number {
  let count = 0;

  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (!system) continue;

    // Skip home systems
    if (system.type === 'home') continue;

    // Edge systems are at distance 3 from center (q=0, r=0) in a standard 6-player map
    // Also consider ring 2 for smaller maps
    const distance = Math.max(
      Math.abs(tile.position.q),
      Math.abs(tile.position.r),
      Math.abs(-tile.position.q - tile.position.r)
    );

    // Consider edge as distance >= 2 (outer rings)
    if (distance < 2) continue;

    // Check for units
    const hasUnits =
      tile.units.some(u => u.ownerId === playerId) ||
      tile.planets.some(p => p.units.some(u => u.ownerId === playerId));

    if (hasUnits) {
      count++;
    }
  }

  return count;
}

/**
 * Check if player has a capital ship (flagship or war sun) in enemy home system or Mecatol
 */
export function hasCapitalShipInEnemyHomeOrMecatol(state: GameState, playerId: string): boolean {
  const capitalShipTypes = ['flagship', 'war_sun'];

  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (!system) continue;

    // Check if this is Mecatol or enemy home system
    const isMecatol = system.type === 'mecatol';
    const isEnemyHome = system.type === 'home' && system.factionId !== undefined &&
      state.players.some(p => p.id !== playerId && p.faction === system.factionId);

    if (!isMecatol && !isEnemyHome) continue;

    // Check for capital ships
    const hasCapitalShip = tile.units.some(
      u => u.ownerId === playerId && capitalShipTypes.includes(u.type)
    );

    if (hasCapitalShip) {
      return true;
    }
  }

  return false;
}

/**
 * Count different enemy home systems where player controls adjacent planets
 */
export function countEnemyHomesWithAdjacentPlanets(state: GameState, playerId: string): number {
  const enemyHomesWithAdjacentControl = new Set<string>();

  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (!system) continue;

    // Skip if not an enemy home system
    if (system.type !== 'home' || !system.factionId) continue;
    if (!state.players.some(p => p.id !== playerId && p.faction === system.factionId)) continue;

    // Get adjacent tiles
    const adjacentTiles = getAdjacentTiles(state.map, tile.position);

    // Check if player controls any planet in adjacent systems
    for (const adjTile of adjacentTiles) {
      const controlsPlanet = adjTile.planets.some(p => p.controlledBy === playerId);
      if (controlsPlanet) {
        enemyHomesWithAdjacentControl.add(system.factionId);
        break;
      }
    }
  }

  return enemyHomesWithAdjacentControl.size;
}

/**
 * Check if player has ships in both alpha AND beta wormhole systems
 */
export function hasShipsInBothWormholeTypes(state: GameState, playerId: string): boolean {
  let hasAlpha = false;
  let hasBeta = false;

  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (!system?.wormhole) continue;

    const hasShips = tile.units.some(u => u.ownerId === playerId && isShipType(u.type));
    if (!hasShips) continue;

    if (system.wormhole === 'alpha') hasAlpha = true;
    if (system.wormhole === 'beta') hasBeta = true;

    if (hasAlpha && hasBeta) return true;
  }

  return false;
}

/**
 * Check if player has ships in a system with an enemy space dock
 */
export function hasShipsWithEnemyDock(state: GameState, playerId: string): boolean {
  for (const tile of state.map.tiles) {
    // Check for player's ships
    const hasShips = tile.units.some(u => u.ownerId === playerId && isShipType(u.type));
    if (!hasShips) continue;

    // Check for enemy space dock on any planet
    const hasEnemyDock = tile.planets.some(planet =>
      planet.units.some(u => u.ownerId !== playerId && u.type === 'space_dock')
    );

    if (hasEnemyDock) {
      return true;
    }
  }

  return false;
}

/**
 * Check if player has ships adjacent to an enemy home system
 */
export function hasShipsAdjacentToEnemyHome(state: GameState, playerId: string): boolean {
  // Find all enemy home systems
  const enemyHomePositions: HexCoord[] = [];

  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (!system) continue;

    if (system.type === 'home' && system.factionId) {
      const isEnemy = state.players.some(p => p.id !== playerId && p.faction === system.factionId);
      if (isEnemy) {
        enemyHomePositions.push(tile.position);
      }
    }
  }

  // Check for ships adjacent to enemy homes
  for (const tile of state.map.tiles) {
    const hasShips = tile.units.some(u => u.ownerId === playerId && isShipType(u.type));
    if (!hasShips) continue;

    // Check if adjacent to any enemy home
    for (const homePos of enemyHomePositions) {
      const adjacentPositions = getAdjacentPositions(homePos);
      if (adjacentPositions.some(p => p.q === tile.position.q && p.r === tile.position.r)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if player has ships in systems adjacent to anomalies
 */
export function hasShipsAdjacentToAnomaly(state: GameState, playerId: string): boolean {
  // Find all anomaly systems
  const anomalyPositions: HexCoord[] = [];

  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (system?.anomaly) {
      anomalyPositions.push(tile.position);
    }
  }

  // Check for ships adjacent to anomalies
  for (const tile of state.map.tiles) {
    const hasShips = tile.units.some(u => u.ownerId === playerId && isShipType(u.type));
    if (!hasShips) continue;

    // Check if adjacent to any anomaly
    for (const anomalyPos of anomalyPositions) {
      const adjacentPositions = getAdjacentPositions(anomalyPos);
      if (adjacentPositions.some(p => p.q === tile.position.q && p.r === tile.position.r)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate total planet resources (all controlled planets, not just unexhausted)
 */
export function calculateTotalResources(state: GameState, playerId: string): number {
  const planets = getControlledPlanets(state, playerId);
  return planets.reduce((sum, p) => sum + p.resources, 0);
}

/**
 * Calculate total planet influence (all controlled planets, not just unexhausted)
 */
export function calculateTotalInfluence(state: GameState, playerId: string): number {
  const planets = getControlledPlanets(state, playerId);
  return planets.reduce((sum, p) => sum + p.influence, 0);
}

/**
 * Count ground forces on planets without a space dock
 */
export function countGroundForcesOnPlanetsWithoutDock(state: GameState, playerId: string): number {
  let count = 0;

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      // Check if planet has a space dock
      const hasDock = planet.units.some(u => u.type === 'space_dock');
      if (hasDock) continue;

      // Count player's ground forces
      count += planet.units.filter(
        u => u.ownerId === playerId && isGroundUnit(u.type)
      ).length;
    }
  }

  return count;
}

/**
 * Check if player has units/planets in the same system as another player
 */
export function hasSharedSystemControl(state: GameState, playerId: string): boolean {
  for (const tile of state.map.tiles) {
    // Check if player has presence (ships in space or units/control on planets)
    const playerHasShips = tile.units.some(u => u.ownerId === playerId);
    const playerControlsPlanet = tile.planets.some(p => p.controlledBy === playerId);
    const playerHasPlanetUnits = tile.planets.some(p =>
      p.units.some(u => u.ownerId === playerId)
    );

    const playerPresence = playerHasShips || playerControlsPlanet || playerHasPlanetUnits;
    if (!playerPresence) continue;

    // Check if any other player has presence
    for (const otherPlayer of state.players) {
      if (otherPlayer.id === playerId) continue;

      const otherHasShips = tile.units.some(u => u.ownerId === otherPlayer.id);
      const otherControlsPlanet = tile.planets.some(p => p.controlledBy === otherPlayer.id);
      const otherHasPlanetUnits = tile.planets.some(p =>
        p.units.some(u => u.ownerId === otherPlayer.id)
      );

      const otherPresence = otherHasShips || otherControlsPlanet || otherHasPlanetUnits;
      if (otherPresence) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if player has a promissory note from another player
 */
export function hasPromissoryFromOther(state: GameState, player: PlayerState): boolean {
  // Promissory notes in hand that weren't originally theirs
  const notes = player.promissoryNotesOwned || [];
  for (const noteId of notes) {
    // Check if this note belongs to another faction
    // Note format is typically "faction_notetype" like "sol_ceasefire"
    const noteFaction = noteId.split('_')[0];
    if (noteFaction && noteFaction !== player.faction) {
      return true;
    }
  }

  return false;
}

/**
 * Check if player has units in the Creuss Gate / Nexus system (PoK)
 */
export function hasUnitsInNexus(state: GameState, playerId: string): boolean {
  for (const tile of state.map.tiles) {
    const system = systems[tile.systemId];
    if (!system) continue;

    // Creuss Gate is system 17 (delta wormhole) or check for special system identifiers
    // The Ghosts of Creuss home has delta wormhole
    if (system.wormhole !== 'delta' && system.type !== 'home') continue;
    if (system.type === 'home' && system.factionId !== 'creuss') continue;

    const hasUnits =
      tile.units.some(u => u.ownerId === playerId) ||
      tile.planets.some(p => p.units.some(u => u.ownerId === playerId));

    if (hasUnits) {
      return true;
    }
  }

  return false;
}

// =============================================================================
// SPEND CALCULATION HELPERS
// =============================================================================

/**
 * Calculate total resources available to spend (unexhausted planets + trade goods)
 */
export function calculateSpendableResources(state: GameState, player: PlayerState): number {
  let total = player.tradeGoods;

  for (const planet of player.planets) {
    if (!planet.exhausted) {
      // Find planet data
      for (const system of Object.values(systems)) {
        const planetData = system.planets.find(p => p.id === planet.planetId);
        if (planetData) {
          total += planetData.resources;
          break;
        }
      }
    }
  }

  return total;
}

/**
 * Calculate total influence available to spend (unexhausted planets)
 */
export function calculateSpendableInfluence(state: GameState, player: PlayerState): number {
  let total = 0;

  for (const planet of player.planets) {
    if (!planet.exhausted) {
      for (const system of Object.values(systems)) {
        const planetData = system.planets.find(p => p.id === planet.planetId);
        if (planetData) {
          total += planetData.influence;
          break;
        }
      }
    }
  }

  return total;
}

/**
 * Calculate total command tokens available to spend (tactics + strategy pools)
 */
export function calculateSpendableTokens(player: PlayerState): number {
  return player.commandTokens.tactics + player.commandTokens.strategy;
}

// =============================================================================
// MAIN OBJECTIVE CHECKER
// =============================================================================

/**
 * Check if a player meets the requirements for an objective
 * Returns { canScore, reason } where reason explains why they can't score
 */
export function checkObjectiveRequirement(
  state: GameState,
  playerId: string,
  objectiveId: string,
  spentResources?: SpentResources
): { canScore: boolean; reason?: string } {
  const objective = OBJECTIVES_BY_ID[objectiveId];
  if (!objective) {
    return { canScore: false, reason: 'Unknown objective' };
  }

  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { canScore: false, reason: 'Player not found' };
  }

  // Public objectives require controlling home system
  if (objective.type === 'stage1' || objective.type === 'stage2') {
    if (!controlsHomeSystem(state, playerId)) {
      return { canScore: false, reason: 'You must control all planets in your home system' };
    }
  }

  const req = objective.requirement;

  switch (req.type) {
    case 'spend_resources': {
      const available = calculateSpendableResources(state, player);
      const required = req.value || 0;
      if (available < required) {
        return { canScore: false, reason: `Need ${required} resources, have ${available} available` };
      }
      // Verify spentResources actually covers the cost
      if (spentResources) {
        const spent = calculateSpentResourcesTotal(state, player, spentResources, 'resources');
        if (spent < required) {
          return { canScore: false, reason: `Must spend ${required} resources` };
        }
      }
      return { canScore: true };
    }

    case 'spend_influence': {
      const available = calculateSpendableInfluence(state, player);
      const required = req.value || 0;
      if (available < required) {
        return { canScore: false, reason: `Need ${required} influence, have ${available} available` };
      }
      if (spentResources) {
        const spent = calculateSpentResourcesTotal(state, player, spentResources, 'influence');
        if (spent < required) {
          return { canScore: false, reason: `Must spend ${required} influence` };
        }
      }
      return { canScore: true };
    }

    case 'control_trait': {
      const planets = getControlledPlanets(state, playerId);
      const targetTrait = req.trait;
      const required = req.value || 0;

      if (targetTrait) {
        // Count specific trait
        const count = planets.filter(p => p.trait === targetTrait).length;
        if (count < required) {
          return { canScore: false, reason: `Need ${required} ${targetTrait} planets, have ${count}` };
        }
      } else {
        // Count any single trait (Corner the Market, Unify the Colonies)
        const traitCounts: Record<string, number> = {};
        for (const planet of planets) {
          if (planet.trait) {
            traitCounts[planet.trait] = (traitCounts[planet.trait] || 0) + 1;
          }
        }
        const maxTrait = Math.max(0, ...Object.values(traitCounts));
        if (maxTrait < required) {
          return { canScore: false, reason: `Need ${required} planets with same trait, best is ${maxTrait}` };
        }
      }
      return { canScore: true };
    }

    case 'control_planets': {
      const planets = getControlledPlanets(state, playerId);
      const required = req.value || 0;
      const customCheck = req.customCheck;

      let filtered = planets;

      if (customCheck === 'non_home_systems') {
        const homeSystemPlanetIds = new Set(getHomeSystemPlanetIds(state, playerId));
        filtered = planets.filter(p => !homeSystemPlanetIds.has(p.planetId));
      } else if (customCheck === 'tech_specialty') {
        filtered = planets.filter(p => p.techSpecialty !== undefined);
      } else if (customCheck === 'with_attachments') {
        filtered = planets.filter(p => p.attachments.length > 0);
      } else if (customCheck === 'legendary') {
        filtered = planets.filter(p => p.legendary);
      } else if (customCheck === 'enemy_home_system') {
        // Control planet in another player's home system
        filtered = [];
        for (const tile of state.map.tiles) {
          if (!isEnemyHomeSystem(state, tile, playerId)) continue;
          for (const planet of tile.planets) {
            if (planet.controlledBy === playerId) {
              const pData = planets.find(p => p.planetId === planet.planetId);
              if (pData) filtered.push(pData);
            }
          }
        }
      }

      if (filtered.length < required) {
        return { canScore: false, reason: `Need ${required} matching planets, have ${filtered.length}` };
      }
      return { canScore: true };
    }

    case 'technology_colors': {
      const techCounts = countTechByColor(player);
      const required = req.value || 0;

      if (req.customCheck === 'single_color') {
        // Need X tech in any single color
        const maxColor = Math.max(...Object.values(techCounts));
        if (maxColor < required) {
          return { canScore: false, reason: `Need ${required} tech in one color, best is ${maxColor}` };
        }
      } else {
        // Need X tech in Y different colors
        // For diversify_research: 2 tech in 2 colors
        // For master_the_sciences: 2 tech in 4 colors
        const colorsWithEnough = Object.values(techCounts).filter(c => c >= required).length;
        const requiredColors = objective.id === 'master_the_sciences' ? 4 : 2;

        if (colorsWithEnough < requiredColors) {
          return {
            canScore: false,
            reason: `Need ${required} tech in ${requiredColors} colors, only have ${colorsWithEnough} qualifying`,
          };
        }
      }
      return { canScore: true };
    }

    case 'technology_count': {
      const required = req.value || 0;

      if (req.customCheck === 'unit_upgrades') {
        const count = countUnitUpgradeTechs(player);
        if (count < required) {
          return { canScore: false, reason: `Need ${required} unit upgrades, have ${count}` };
        }
      } else if (req.customCheck === 'faction_techs') {
        const count = countFactionTechs(player);
        if (count < required) {
          return { canScore: false, reason: `Need ${required} faction techs, have ${count}` };
        }
      }
      return { canScore: true };
    }

    case 'unit_count': {
      const required = req.value || 0;
      const unitTypes = req.unitTypes || [];
      const count = countUnitsOnBoard(state, playerId, unitTypes);

      if (count < required) {
        return { canScore: false, reason: `Need ${required} ${unitTypes.join('/')}, have ${count}` };
      }
      return { canScore: true };
    }

    case 'structure_count': {
      const required = req.value || 0;

      if (req.customCheck === 'outside_home_system') {
        const count = countPlanetsWithStructuresOutsideHome(state, playerId);
        if (count < required) {
          return { canScore: false, reason: `Need structures on ${required} planets outside home, have ${count}` };
        }
      } else {
        const count = countStructures(state, playerId);
        if (count < required) {
          return { canScore: false, reason: `Need ${required} structures, have ${count}` };
        }
      }
      return { canScore: true };
    }

    case 'control_mecatol': {
      if (!controlsMecatol(state, playerId)) {
        return { canScore: false, reason: 'Must control Mecatol Rex' };
      }

      if (req.customCheck === 'with_ships') {
        const shipCount = countShipsAtMecatol(state, playerId);
        const required = req.value || 0;
        if (shipCount < required) {
          return { canScore: false, reason: `Need ${required} ships at Mecatol, have ${shipCount}` };
        }
      }
      return { canScore: true };
    }

    case 'neighbor_count': {
      if (req.customCheck === 'more_planets_than_neighbors') {
        const myPlanets = getControlledPlanets(state, playerId).length;
        let neighborsBeaten = 0;

        for (const neighborId of player.neighbors) {
          const neighbor = state.players.find(p => p.id === neighborId);
          if (neighbor) {
            const neighborPlanets = getControlledPlanets(state, neighborId).length;
            if (myPlanets > neighborPlanets) {
              neighborsBeaten++;
            }
          }
        }

        const required = req.value || 0;
        if (neighborsBeaten < required) {
          return { canScore: false, reason: `Need more planets than ${required} neighbors, only beat ${neighborsBeaten}` };
        }
      } else if (req.customCheck === 'all_neighbors') {
        const totalPlayers = state.players.length - 1; // Exclude self
        if (player.neighbors.length < totalPlayers) {
          return { canScore: false, reason: 'Must be neighbors with all other players' };
        }
      }
      return { canScore: true };
    }

    case 'custom': {
      // Handle various custom checks
      const check = req.customCheck;
      const value = req.value || 0;

      if (check === 'spend_trade_goods') {
        if (player.tradeGoods < value) {
          return { canScore: false, reason: `Need ${value} trade goods, have ${player.tradeGoods}` };
        }
        if (spentResources && (spentResources.tradeGoods || 0) < value) {
          return { canScore: false, reason: `Must spend ${value} trade goods` };
        }
        return { canScore: true };
      }

      if (check === 'spend_tokens') {
        const available = calculateSpendableTokens(player);
        if (available < value) {
          return { canScore: false, reason: `Need ${value} tokens, have ${available}` };
        }
        if (spentResources) {
          const spent = (spentResources.tacticTokens || 0) + (spentResources.strategyTokens || 0);
          if (spent < value) {
            return { canScore: false, reason: `Must spend ${value} tokens` };
          }
        }
        return { canScore: true };
      }

      if (check === 'ships_adjacent_mecatol') {
        const count = countSystemsAdjacentToMecatolWithShips(state, playerId);
        if (count < value) {
          return { canScore: false, reason: `Need ships in ${value} systems adjacent to Mecatol, have ${count}` };
        }
        return { canScore: true };
      }

      if (check === 'non_fighter_ships_in_system') {
        const max = getMaxNonFighterShipsInAnySystem(state, playerId);
        if (max < value) {
          return { canScore: false, reason: `Need ${value} non-fighter ships in one system, best is ${max}` };
        }
        return { canScore: true };
      }

      if (check === 'ships_in_systems') {
        const count = countSystemsWithShips(state, playerId);
        if (count < value) {
          return { canScore: false, reason: `Need ships in ${value} systems, have ${count}` };
        }
        return { canScore: true };
      }

      // Spend mixed objectives (influence + resources + trade goods)
      if (check === 'spend_mixed_3_3_3') {
        const availableInfluence = calculateSpendableInfluence(state, player);
        const availableResources = calculateSpendableResources(state, player);
        if (availableInfluence < 3) {
          return { canScore: false, reason: `Need 3 influence, have ${availableInfluence} available` };
        }
        if (availableResources < 3) {
          return { canScore: false, reason: `Need 3 resources, have ${availableResources} available` };
        }
        if (player.tradeGoods < 3) {
          return { canScore: false, reason: `Need 3 trade goods, have ${player.tradeGoods}` };
        }
        if (spentResources) {
          const spentInfluence = calculateSpentResourcesTotal(state, player, spentResources, 'influence');
          const spentRes = calculateSpentResourcesTotal(state, player, spentResources, 'resources');
          const spentTG = spentResources.tradeGoods || 0;
          if (spentInfluence < 3) return { canScore: false, reason: 'Must spend 3 influence' };
          if (spentRes < 3) return { canScore: false, reason: 'Must spend 3 resources' };
          if (spentTG < 3) return { canScore: false, reason: 'Must spend 3 trade goods' };
        }
        return { canScore: true };
      }

      if (check === 'spend_mixed_6_6_6') {
        const availableInfluence = calculateSpendableInfluence(state, player);
        const availableResources = calculateSpendableResources(state, player);
        if (availableInfluence < 6) {
          return { canScore: false, reason: `Need 6 influence, have ${availableInfluence} available` };
        }
        if (availableResources < 6) {
          return { canScore: false, reason: `Need 6 resources, have ${availableResources} available` };
        }
        if (player.tradeGoods < 6) {
          return { canScore: false, reason: `Need 6 trade goods, have ${player.tradeGoods}` };
        }
        if (spentResources) {
          const spentInfluence = calculateSpentResourcesTotal(state, player, spentResources, 'influence');
          const spentRes = calculateSpentResourcesTotal(state, player, spentResources, 'resources');
          const spentTG = spentResources.tradeGoods || 0;
          if (spentInfluence < 6) return { canScore: false, reason: 'Must spend 6 influence' };
          if (spentRes < 6) return { canScore: false, reason: 'Must spend 6 resources' };
          if (spentTG < 6) return { canScore: false, reason: 'Must spend 6 trade goods' };
        }
        return { canScore: true };
      }

      // Units in systems without planets
      if (check === 'units_in_empty_systems') {
        const count = countSystemsWithUnitsNoPlanets(state, playerId);
        if (count < value) {
          return { canScore: false, reason: `Need units in ${value} empty systems, have ${count}` };
        }
        return { canScore: true };
      }

      // Units in special systems (legendary, Mecatol, anomaly)
      if (check === 'units_in_special_systems') {
        const count = countSpecialSystemsWithUnits(state, playerId);
        if (count < value) {
          return { canScore: false, reason: `Need units in ${value} special systems, have ${count}` };
        }
        return { canScore: true };
      }

      // Units in edge systems (outer ring, not home)
      if (check === 'units_in_edge_systems') {
        const count = countEdgeSystemsWithUnits(state, playerId);
        if (count < value) {
          return { canScore: false, reason: `Need units in ${value} edge systems, have ${count}` };
        }
        return { canScore: true };
      }

      // Capital ship (flagship/war sun) in enemy home or Mecatol
      if (check === 'capital_ship_in_enemy_home_or_mecatol') {
        if (!hasCapitalShipInEnemyHomeOrMecatol(state, playerId)) {
          return { canScore: false, reason: 'Need flagship or war sun in enemy home system or Mecatol Rex' };
        }
        return { canScore: true };
      }

      // Control planets adjacent to different enemy home systems
      if (check === 'planets_near_different_homes') {
        const count = countEnemyHomesWithAdjacentPlanets(state, playerId);
        if (count < value) {
          return { canScore: false, reason: `Need planets adjacent to ${value} different enemy home systems, have ${count}` };
        }
        return { canScore: true };
      }

      // Ships in both alpha AND beta wormhole systems
      if (check === 'ships_in_both_wormholes') {
        if (!hasShipsInBothWormholeTypes(state, playerId)) {
          return { canScore: false, reason: 'Need ships in both alpha and beta wormhole systems' };
        }
        return { canScore: true };
      }

      // Ships in system with enemy space dock
      if (check === 'ships_with_enemy_dock') {
        if (!hasShipsWithEnemyDock(state, playerId)) {
          return { canScore: false, reason: 'Need ships in a system with an enemy space dock' };
        }
        return { canScore: true };
      }

      // Ships adjacent to enemy home system
      if (check === 'ships_adjacent_enemy_home') {
        if (!hasShipsAdjacentToEnemyHome(state, playerId)) {
          return { canScore: false, reason: 'Need ships adjacent to an enemy home system' };
        }
        return { canScore: true };
      }

      // Ships in systems adjacent to anomalies
      if (check === 'ships_adjacent_anomaly') {
        if (!hasShipsAdjacentToAnomaly(state, playerId)) {
          return { canScore: false, reason: 'Need ships in a system adjacent to an anomaly' };
        }
        return { canScore: true };
      }

      // Discard action cards (action phase secret)
      if (check === 'discard_action_cards') {
        if (player.actionCards.length < value) {
          return { canScore: false, reason: `Need ${value} action cards to discard, have ${player.actionCards.length}` };
        }
        return { canScore: true };
      }

      // Total planet influence (all planets, not just unexhausted)
      if (check === 'total_influence') {
        const total = calculateTotalInfluence(state, playerId);
        if (total < value) {
          return { canScore: false, reason: `Need ${value} total influence, have ${total}` };
        }
        return { canScore: true };
      }

      // Total planet resources (all planets, not just unexhausted)
      if (check === 'total_resources') {
        const total = calculateTotalResources(state, playerId);
        if (total < value) {
          return { canScore: false, reason: `Need ${value} total resources, have ${total}` };
        }
        return { canScore: true };
      }

      // Ground forces on planets without space dock
      if (check === 'ground_forces_no_dock') {
        const count = countGroundForcesOnPlanetsWithoutDock(state, playerId);
        if (count < value) {
          return { canScore: false, reason: `Need ${value} ground forces on planets without docks, have ${count}` };
        }
        return { canScore: true };
      }

      // Production in system (action phase secret - triggered during production)
      if (check === 'production_in_system') {
        // This is an action phase trigger, not a state check
        return { canScore: false, reason: 'This objective is scored when using production in a system' };
      }

      // Shared system control with another player
      if (check === 'shared_system_control') {
        if (!hasSharedSystemControl(state, playerId)) {
          return { canScore: false, reason: 'Need to share a system with another player' };
        }
        return { canScore: true };
      }

      // Has promissory note from another player
      if (check === 'has_promissory_note') {
        if (!hasPromissoryFromOther(state, player)) {
          return { canScore: false, reason: 'Need a promissory note from another player' };
        }
        return { canScore: true };
      }

      // Laws in play
      if (check === 'laws_in_play') {
        const lawsCount = state.laws?.length || 0;
        if (lawsCount < value) {
          return { canScore: false, reason: `Need ${value} laws in play, have ${lawsCount}` };
        }
        return { canScore: true };
      }

      // Units in Nexus/Creuss Gate (PoK)
      if (check === 'units_in_nexus') {
        if (!hasUnitsInNexus(state, playerId)) {
          return { canScore: false, reason: 'Need units in the Creuss Gate or Nexus system' };
        }
        return { canScore: true };
      }

      // Purge relic fragments (PoK) - requires tracking of purged fragments
      if (check === 'purge_fragments') {
        // This requires action during the game - check if player has fragments to purge
        const fragments = player.relicFragments || { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 };
        const total = fragments.cultural + fragments.industrial + fragments.hazardous + (fragments.unknown || 0);
        if (total < value) {
          return { canScore: false, reason: `Need ${value} relic fragments to purge, have ${total}` };
        }
        return { canScore: true };
      }

      // Elected by agenda (action phase secret - triggered by agenda)
      if (check === 'elected_by_agenda') {
        // This is an action phase trigger that happens during agenda
        return { canScore: false, reason: 'This objective is scored when elected by an agenda' };
      }

      // Combat-based checks (action phase secrets)
      // These are triggered during combat resolution, not checked against state
      if (check === 'destroy_war_sun_or_flagship' ||
          check === 'bombardment_destroy_last_ground' ||
          check === 'win_vs_leader' ||
          check === 'space_cannon_destroy_last_ship' ||
          check === 'win_with_flagship' ||
          check === 'lose_flagship_in_combat' ||
          check === 'win_vs_promissory_holder' ||
          check === 'win_in_anomaly' ||
          check === 'win_in_enemy_home' ||
          check === 'three_ships_after_combat' ||
          check === 'afb_destroy_last_fighters' ||
          check === 'last_to_pass') {
        return { canScore: false, reason: 'This objective is scored during the action phase when triggered' };
      }

      // Unknown custom check - should be implemented
      return { canScore: false, reason: `Unimplemented check: ${check}` };
    }

    case 'win_combat':
      // These are action phase secrets, tracked elsewhere
      return { canScore: false, reason: 'Combat objectives are scored during action phase' };

    default:
      return { canScore: false, reason: `Unknown requirement type: ${req.type}` };
  }
}

/**
 * Calculate total spent from SpentResources for a specific type
 */
function calculateSpentResourcesTotal(
  state: GameState,
  player: PlayerState,
  spent: SpentResources,
  type: 'resources' | 'influence'
): number {
  let total = 0;

  // Add trade goods (count as resources)
  if (type === 'resources' && spent.tradeGoods) {
    total += spent.tradeGoods;
  }

  // Add from exhausted planets
  if (spent.exhaustedPlanets) {
    for (const planetId of spent.exhaustedPlanets) {
      for (const system of Object.values(systems)) {
        const planetData = system.planets.find(p => p.id === planetId);
        if (planetData) {
          total += type === 'resources' ? planetData.resources : planetData.influence;
          break;
        }
      }
    }
  }

  return total;
}

/**
 * Context for checking action phase secret objective triggers
 */
export interface ActionPhaseTriggerContext {
  type: 'combat_won' | 'combat_lost' | 'bombardment' | 'space_cannon' | 'afb' | 'production';
  playerId: string;
  enemyPlayerId?: string;
  systemId?: number;
  unitsDestroyed?: { type: string; ownerId: string }[];
  wasLastEnemy?: boolean;
  flagshipInvolved?: boolean;
  inAnomaly?: boolean;
  inEnemyHome?: boolean;
  shipsRemaining?: number;
  isAgainstLeader?: boolean;
  hasPromissoryFrom?: boolean;
}

/**
 * Check which action phase secret objectives were triggered by an event
 * Returns IDs of secrets that can now be scored
 */
export function checkActionPhaseTriggers(
  state: GameState,
  context: ActionPhaseTriggerContext
): string[] {
  const player = state.players.find(p => p.id === context.playerId);
  if (!player) return [];

  const triggeredSecrets: string[] = [];

  for (const secretId of player.secretObjectives) {
    // Skip already scored
    if (player.scoredObjectives.includes(secretId)) continue;

    const objective = OBJECTIVES_BY_ID[secretId];
    if (!objective) continue;

    const req = objective.requirement;
    const customCheck = req.customCheck;

    // Check each trigger type
    if (context.type === 'combat_won') {
      // Destroy Their Greatest Ship - destroy war sun or flagship
      if (customCheck === 'destroy_war_sun_or_flagship') {
        const destroyed = context.unitsDestroyed || [];
        const hasDestroyed = destroyed.some(
          u => (u.type === 'war_sun' || u.type === 'flagship') && u.ownerId !== context.playerId
        );
        if (hasDestroyed) triggeredSecrets.push(secretId);
      }

      // Spark a Rebellion - win vs the leader
      if (customCheck === 'win_vs_leader' && context.isAgainstLeader) {
        triggeredSecrets.push(secretId);
      }

      // Unveil Flagship - win with your flagship in combat
      if (customCheck === 'win_with_flagship' && context.flagshipInvolved) {
        triggeredSecrets.push(secretId);
      }

      // Brave the Void - win combat in an anomaly
      if (customCheck === 'win_in_anomaly' && context.inAnomaly) {
        triggeredSecrets.push(secretId);
      }

      // Demonstrate Your Power - win in enemy home system
      if (customCheck === 'win_in_enemy_home' && context.inEnemyHome) {
        triggeredSecrets.push(secretId);
      }

      // Prove Endurance - have 3+ ships remaining after winning combat
      if (customCheck === 'three_ships_after_combat') {
        if ((context.shipsRemaining || 0) >= 3) {
          triggeredSecrets.push(secretId);
        }
      }

      // Betray a Friend - win vs someone whose promissory you hold
      if (customCheck === 'win_vs_promissory_holder' && context.hasPromissoryFrom) {
        triggeredSecrets.push(secretId);
      }
    }

    if (context.type === 'combat_lost') {
      // Become a Martyr - lose your flagship in combat
      if (customCheck === 'lose_flagship_in_combat') {
        const destroyed = context.unitsDestroyed || [];
        const lostFlagship = destroyed.some(
          u => u.type === 'flagship' && u.ownerId === context.playerId
        );
        if (lostFlagship) triggeredSecrets.push(secretId);
      }
    }

    if (context.type === 'bombardment') {
      // Make an Example of Their World - bombardment destroys last ground force
      if (customCheck === 'bombardment_destroy_last_ground' && context.wasLastEnemy) {
        triggeredSecrets.push(secretId);
      }
    }

    if (context.type === 'space_cannon') {
      // Turn Their Fleets to Dust - space cannon destroys last ship
      if (customCheck === 'space_cannon_destroy_last_ship' && context.wasLastEnemy) {
        triggeredSecrets.push(secretId);
      }
    }

    if (context.type === 'afb') {
      // Darken the Skies - AFB destroys last fighters
      if (customCheck === 'afb_destroy_last_fighters' && context.wasLastEnemy) {
        triggeredSecrets.push(secretId);
      }

      // Fight With Precision - AFB hit every fighter
      if (customCheck === 'afb_hit_all_fighters') {
        // This requires knowing all fighters were hit - context must include this
        triggeredSecrets.push(secretId);
      }
    }
  }

  return triggeredSecrets;
}

/**
 * Get all objectives a player can currently score
 */
export function getScorableObjectives(
  state: GameState,
  playerId: string,
  phase: 'status' | 'action' | 'agenda'
): { publicObjectives: string[]; secretObjectives: string[] } {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { publicObjectives: [], secretObjectives: [] };
  }

  const scorablePublic: string[] = [];
  const scorableSecret: string[] = [];

  // Check revealed public objectives
  for (const objInstance of state.objectives.publicStageI) {
    if (!objInstance.revealed) continue;
    if (player.scoredObjectives.includes(objInstance.id)) continue;

    const result = checkObjectiveRequirement(state, playerId, objInstance.id);
    if (result.canScore) {
      scorablePublic.push(objInstance.id);
    }
  }

  for (const objInstance of state.objectives.publicStageII) {
    if (!objInstance.revealed) continue;
    if (player.scoredObjectives.includes(objInstance.id)) continue;

    const result = checkObjectiveRequirement(state, playerId, objInstance.id);
    if (result.canScore) {
      scorablePublic.push(objInstance.id);
    }
  }

  // Check player's secret objectives (only status phase ones for now)
  for (const secretId of player.secretObjectives) {
    if (player.scoredObjectives.includes(secretId)) continue;

    // TODO: Filter by phase timing when we have that data
    const result = checkObjectiveRequirement(state, playerId, secretId);
    if (result.canScore) {
      scorableSecret.push(secretId);
    }
  }

  return { publicObjectives: scorablePublic, secretObjectives: scorableSecret };
}
