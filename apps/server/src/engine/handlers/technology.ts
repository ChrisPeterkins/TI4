import type {
  GameState,
  ResearchTechnologyAction,
  PlayerState,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { technologies, systems, meetsPrerequisites, type TechnologyData } from '@ti4/game-data';

/**
 * Handle researching a technology
 */
export function handleResearchTechnology(
  state: GameState,
  action: ResearchTechnologyAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const tech = technologies[action.techId];
  if (!tech) {
    return { success: false, error: `Unknown technology: ${action.techId}` };
  }

  // Check if player already has this tech
  if (player.technologies.includes(action.techId)) {
    return { success: false, error: 'Player already has this technology' };
  }

  // Check if this is a faction tech for another faction
  if (tech.factionId && tech.factionId !== player.faction) {
    return { success: false, error: 'Cannot research another faction\'s technology' };
  }

  // Calculate tech specialties from planets for prerequisite ignoring
  const ignoredPrerequisites = calculateIgnoredPrerequisites(
    state,
    player,
    action.exhaustedPlanets || []
  );

  // Check prerequisites (unless player has special ability to ignore them)
  const ignoreAllPrereqs = hasIgnorePrerequisitesAbility(player);

  if (!ignoreAllPrereqs && !meetsPrerequisites(player.technologies, action.techId, ignoredPrerequisites)) {
    return { success: false, error: 'Prerequisites not met' };
  }

  // Add the technology to the player
  player.technologies.push(action.techId);

  // Exhaust planets used for tech specialties
  if (action.exhaustedPlanets) {
    for (const planetId of action.exhaustedPlanets) {
      const planetData = findPlayerPlanet(state, player.id, planetId);
      if (planetData) {
        planetData.exhausted = true;
      }
    }
  }

  // Increment version
  state.version++;

  return {
    success: true,
    triggeredEvents: ['technology_researched'],
    data: {
      playerId: player.id,
      techId: action.techId,
      techName: tech.name,
    },
  };
}

/**
 * Calculate how many prerequisites of each color can be ignored
 * based on exhausted planets with tech specialties
 */
function calculateIgnoredPrerequisites(
  state: GameState,
  player: PlayerState,
  exhaustedPlanetIds: string[]
): number {
  let ignoredCount = 0;

  for (const planetId of exhaustedPlanetIds) {
    const planetData = findPlayerPlanetData(state, player.id, planetId);
    if (planetData) {
      // Look up tech specialty from static data
      const techSpecialty = getPlanetTechSpecialty(planetId);
      if (techSpecialty) {
        ignoredCount++;
      }
    }
  }

  // Add faction bonuses
  // Jol-Nar's "Analytical" ability: Can ignore 1 prerequisite
  if (player.faction === 'jolnar') {
    ignoredCount++;
  }

  return ignoredCount;
}

/**
 * Get a planet's tech specialty from static data
 */
function getPlanetTechSpecialty(planetId: string): string | undefined {
  for (const system of Object.values(systems)) {
    for (const planet of system.planets) {
      if (planet.id === planetId) {
        return planet.techSpecialty;
      }
    }
  }
  return undefined;
}

/**
 * Check if player has ability to ignore all prerequisites
 * (e.g., L1Z1X "Inheritance Systems" with 2 resources paid)
 */
function hasIgnorePrerequisitesAbility(player: PlayerState): boolean {
  // Nekro Virus cannot research technologies normally
  if (player.faction === 'nekro') {
    return false;
  }

  // L1Z1X can spend 2 resources to ignore all prerequisites
  // This would be indicated by a separate action or flag
  return false;
}

/**
 * Find a planet controlled by a player
 */
function findPlayerPlanet(
  state: GameState,
  playerId: string,
  planetId: string
): { exhausted: boolean } | null {
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.planetId === planetId && planet.controlledBy === playerId) {
        return planet;
      }
    }
  }
  return null;
}

/**
 * Find planet data with tile reference
 */
function findPlayerPlanetData(
  state: GameState,
  playerId: string,
  planetId: string
): { tile: any; planet: any } | null {
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.planetId === planetId && planet.controlledBy === playerId) {
        return { tile, planet };
      }
    }
  }
  return null;
}

/**
 * Get technologies available for a player to research
 * Includes generic technologies and their faction technologies
 */
export function getResearchableTechnologies(
  state: GameState,
  playerId: string
): TechnologyData[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  const allTechs = Object.values(technologies);

  return allTechs.filter(tech => {
    // Skip if already researched
    if (player.technologies.includes(tech.id)) {
      return false;
    }

    // Skip faction techs for other factions
    if (tech.factionId && tech.factionId !== player.faction) {
      return false;
    }

    return true;
  });
}

/**
 * Get technologies that a player can currently research
 * (has prerequisites or can use tech specialties to meet them)
 */
export function getAvailableTechnologies(
  state: GameState,
  playerId: string
): TechnologyData[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  // Nekro Virus cannot research
  if (player.faction === 'nekro') {
    return [];
  }

  const researchable = getResearchableTechnologies(state, playerId);

  // Count available tech specialty planets
  const techSpecialtyCount = countTechSpecialtyPlanets(state, playerId);

  // Jol-Nar bonus
  const jolnarBonus = player.faction === 'jolnar' ? 1 : 0;
  const maxIgnored = techSpecialtyCount + jolnarBonus;

  return researchable.filter(tech => {
    // Check if prerequisites can be met (possibly by ignoring some with tech specialties)
    return meetsPrerequisites(player.technologies, tech.id, maxIgnored);
  });
}

/**
 * Count planets with tech specialties that aren't exhausted
 */
function countTechSpecialtyPlanets(state: GameState, playerId: string): number {
  let count = 0;

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (
        planet.controlledBy === playerId &&
        !planet.exhausted
      ) {
        // Look up tech specialty from static data
        const techSpecialty = getPlanetTechSpecialty(planet.planetId);
        if (techSpecialty) {
          count++;
        }
      }
    }
  }

  return count;
}
