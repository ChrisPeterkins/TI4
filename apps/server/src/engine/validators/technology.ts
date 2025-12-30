import type {
  GameState,
  ResearchTechnologyAction,
  PlayerState,
} from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { technologies, systems, meetsPrerequisites } from '@ti4/game-data';

/**
 * Validate research technology action
 */
export function validateResearchTechnology(
  state: GameState,
  action: ResearchTechnologyAction
): ValidationResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check phase - technology can be researched during:
  // 1. Technology strategy card primary ability
  // 2. Technology strategy card secondary ability
  // 3. Some action card windows
  // For now, we allow research during action phase when appropriate context is set
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only research technology during action phase' };
  }

  // Nekro Virus cannot research technologies normally
  if (player.faction === 'nekro') {
    return { valid: false, error: 'Nekro Virus cannot research technologies' };
  }

  // Check if technology exists
  const tech = technologies[action.techId];
  if (!tech) {
    return { valid: false, error: `Unknown technology: ${action.techId}` };
  }

  // Check if player already has this technology
  if (player.technologies.includes(action.techId)) {
    return { valid: false, error: 'Player already has this technology' };
  }

  // Check if this is a faction-specific technology for another faction
  if (tech.factionId && tech.factionId !== player.faction) {
    return { valid: false, error: 'Cannot research another faction\'s technology' };
  }

  // Calculate available prerequisite ignoring from tech specialties
  const exhaustedPlanets = action.exhaustedPlanets || [];
  const ignoredFromPlanets = countValidTechSpecialtyPlanets(state, player, exhaustedPlanets);

  // Add Jol-Nar bonus
  const jolnarBonus = player.faction === 'jolnar' ? 1 : 0;
  const totalIgnored = ignoredFromPlanets + jolnarBonus;

  // Validate prerequisites
  if (!meetsPrerequisites(player.technologies, action.techId, totalIgnored)) {
    return { valid: false, error: 'Prerequisites not met' };
  }

  // Validate exhausted planets exist and are controlled by player and not already exhausted
  for (const planetId of exhaustedPlanets) {
    const planetInfo = findPlayerPlanet(state, player.id, planetId);
    if (!planetInfo) {
      return { valid: false, error: `Planet ${planetId} not controlled by player` };
    }
    if (planetInfo.exhausted) {
      return { valid: false, error: `Planet ${planetId} is already exhausted` };
    }
    const techSpecialty = getPlanetTechSpecialty(planetId);
    if (!techSpecialty) {
      return { valid: false, error: `Planet ${planetId} does not have a tech specialty` };
    }
  }

  return { valid: true };
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
 * Count tech specialty planets that can be used to ignore prerequisites
 */
function countValidTechSpecialtyPlanets(
  state: GameState,
  player: PlayerState,
  exhaustedPlanetIds: string[]
): number {
  let count = 0;

  for (const planetId of exhaustedPlanetIds) {
    const planetInfo = findPlayerPlanet(state, player.id, planetId);
    if (planetInfo && !planetInfo.exhausted) {
      const techSpecialty = getPlanetTechSpecialty(planetId);
      if (techSpecialty) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Find a planet and check if it's controlled by the player
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
 * Validate that the player is currently allowed to research technology
 * This checks the game context (strategic action, secondary, etc.)
 */
export function canPlayerResearchTechnology(
  state: GameState,
  playerId: string
): { canResearch: boolean; reason?: string } {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { canResearch: false, reason: 'Player not found' };
  }

  // Nekro cannot research
  if (player.faction === 'nekro') {
    return { canResearch: false, reason: 'Nekro Virus cannot research technologies' };
  }

  // Check if in appropriate game context
  // This would be expanded based on when technology can be researched
  // For now, we just check phase
  if (state.phase !== 'action') {
    return { canResearch: false, reason: 'Not in action phase' };
  }

  return { canResearch: true };
}
