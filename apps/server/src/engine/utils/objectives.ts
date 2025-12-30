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
import { isShipType, isStructure } from './units.js';

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

      // Add more custom checks as needed...
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
