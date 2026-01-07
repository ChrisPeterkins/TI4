import type {
  GameState,
  ResearchTechnologyAction,
  PlayerState,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { technologies, systems, meetsPrerequisites, type TechnologyData } from '@ti4/game-data';
import { checkAllCommanderUnlocks } from './leaders.js';
import { logAbilityTriggered } from '../utils/game-log.js';
import { checkAbilityTriggers } from '../abilities/ability-triggers.js';

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

  // DEEPWROUGHT AGENT/COMMANDER: Doctor Carrina / Aello
  // Fire technology_researched trigger for all other players (Deepwrought may respond)
  for (const otherPlayer of state.players) {
    if (otherPlayer.id === action.playerId) continue;
    if (otherPlayer.faction === 'deepwrought') {
      // Doctor Carrina (Agent): When another player researches - may ignore prerequisite, place infantry
      // Aello (Commander): When another spends resources to research - may reduce cost, gain commodity
      const techTriggers = checkAbilityTriggers(state, 'technology_researched', {
        playerId: otherPlayer.id,
        targetPlayerId: action.playerId,
        techId: action.techId,
      });
      for (const trigger of techTriggers) {
        console.log(`Technology trigger: ${trigger.abilityName} for Deepwrought player ${trigger.playerId}`);
      }
    }
  }

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

  // Check for commander unlocks (some commanders unlock based on tech count)
  const unlockedCommanders = checkAllCommanderUnlocks(state);

  const triggeredEvents = ['technology_researched'];
  if (unlockedCommanders.length > 0) {
    triggeredEvents.push('commander_unlocked');
  }

  return {
    success: true,
    triggeredEvents,
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

// =============================================================================
// NEKRO VALEFAR ASSIMILATOR
// =============================================================================

/**
 * Place a Valefar Assimilator token on a faction technology.
 * Called when Nekro would gain a technology via Technological Singularity or Galactic Threat
 * and chooses to use the assimilator instead.
 *
 * @param state - Game state
 * @param nekroPlayerId - The Nekro player's ID
 * @param targetTechId - The faction technology to copy
 * @param targetPlayerId - The player who owns the faction technology
 * @param tokenType - 'x' or 'y' to indicate which assimilator to use
 */
export function placeAssimilatorToken(
  state: GameState,
  nekroPlayerId: string,
  targetTechId: string,
  targetPlayerId: string,
  tokenType: 'x' | 'y'
): HandlerResult {
  const nekroPlayer = state.players.find(p => p.id === nekroPlayerId);
  if (!nekroPlayer) {
    return { success: false, error: 'Player not found' };
  }

  if (nekroPlayer.faction !== 'nekro') {
    return { success: false, error: 'Only Nekro Virus can use Valefar Assimilator' };
  }

  // Check if Nekro has the assimilator tech
  const assimilatorTechId = `valefar_assimilator_${tokenType}`;
  if (!nekroPlayer.technologies.includes(assimilatorTechId)) {
    return { success: false, error: `Nekro does not have Valefar Assimilator ${tokenType.toUpperCase()}` };
  }

  // Validate target tech is a faction technology
  const targetTech = technologies[targetTechId];
  if (!targetTech) {
    return { success: false, error: 'Unknown technology' };
  }

  if (!targetTech.factionId) {
    return { success: false, error: 'Valefar Assimilator can only copy faction technologies' };
  }

  // Validate target player owns the tech
  const targetPlayer = state.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { success: false, error: 'Target player not found' };
  }

  if (!targetPlayer.technologies.includes(targetTechId)) {
    return { success: false, error: 'Target player does not own this technology' };
  }

  // Check if there's already an assimilator token on this tech
  if (isTechAssimilated(state, targetTechId)) {
    return { success: false, error: 'Cannot place assimilator token on a technology that already has one' };
  }

  // Initialize assimilator tracking if needed
  if (!nekroPlayer.assimilatorTokens) {
    nekroPlayer.assimilatorTokens = {};
  }

  // Place the token
  nekroPlayer.assimilatorTokens[tokenType] = {
    targetTechId,
    targetPlayerId,
  };

  logAbilityTriggered(state, nekroPlayerId, `Valefar Assimilator ${tokenType.toUpperCase()}`);

  return {
    success: true,
    triggeredEvents: ['assimilator_placed'],
    data: {
      nekroPlayerId,
      tokenType,
      targetTechId,
      targetPlayerId,
      targetTechName: targetTech.name,
    },
  };
}

/**
 * Check if a technology already has an assimilator token on it.
 */
export function isTechAssimilated(state: GameState, techId: string): boolean {
  // Check all Nekro players (usually just one)
  for (const player of state.players) {
    if (player.faction === 'nekro' && player.assimilatorTokens) {
      if (
        player.assimilatorTokens.x?.targetTechId === techId ||
        player.assimilatorTokens.y?.targetTechId === techId
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if Nekro has a faction technology's effects (either directly or via assimilator).
 * Use this when checking if a player has a specific faction tech.
 */
export function hasEffectiveFactionTech(
  state: GameState,
  playerId: string,
  techId: string
): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return false;

  // Direct ownership
  if (player.technologies.includes(techId)) {
    return true;
  }

  // Nekro can have faction techs via assimilator
  if (player.faction === 'nekro' && player.assimilatorTokens) {
    if (
      player.assimilatorTokens.x?.targetTechId === techId ||
      player.assimilatorTokens.y?.targetTechId === techId
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get the faction technologies that Nekro has assimilated.
 * Returns array of tech IDs.
 */
export function getAssimilatedTechs(state: GameState, nekroPlayerId: string): string[] {
  const nekroPlayer = state.players.find(p => p.id === nekroPlayerId);
  if (!nekroPlayer || nekroPlayer.faction !== 'nekro') return [];

  const techs: string[] = [];

  if (nekroPlayer.assimilatorTokens?.x?.targetTechId) {
    techs.push(nekroPlayer.assimilatorTokens.x.targetTechId);
  }
  if (nekroPlayer.assimilatorTokens?.y?.targetTechId) {
    techs.push(nekroPlayer.assimilatorTokens.y.targetTechId);
  }

  return techs;
}

/**
 * Get available faction technologies that can be targeted with Valefar Assimilator.
 * Returns technologies owned by a specific player that:
 * - Are faction technologies
 * - Don't already have an assimilator token
 */
export function getAssimilatableTechs(
  state: GameState,
  targetPlayerId: string
): TechnologyData[] {
  const targetPlayer = state.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) return [];

  return targetPlayer.technologies
    .map(techId => technologies[techId])
    .filter((tech): tech is TechnologyData =>
      tech !== undefined &&
      tech.factionId !== undefined &&
      !isTechAssimilated(state, tech.id)
    );
}

/**
 * Check if Nekro has an available assimilator token to use.
 * Returns 'x', 'y', or null if none available.
 */
export function getAvailableAssimilatorToken(
  state: GameState,
  nekroPlayerId: string
): 'x' | 'y' | null {
  const nekroPlayer = state.players.find(p => p.id === nekroPlayerId);
  if (!nekroPlayer || nekroPlayer.faction !== 'nekro') return null;

  // Check if X is available (has tech and token not placed)
  if (
    nekroPlayer.technologies.includes('valefar_assimilator_x') &&
    !nekroPlayer.assimilatorTokens?.x
  ) {
    return 'x';
  }

  // Check if Y is available
  if (
    nekroPlayer.technologies.includes('valefar_assimilator_y') &&
    !nekroPlayer.assimilatorTokens?.y
  ) {
    return 'y';
  }

  return null;
}
