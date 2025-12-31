/**
 * Planet utility functions
 * Includes attachment modifier calculations
 */

import type { PlanetInstance, GameState } from '@ti4/shared';
import { getExplorationCard } from '@ti4/shared';
import { systems } from '@ti4/game-data';

export type TechColor = 'biotic' | 'warfare' | 'propulsion' | 'cybernetic';

export interface PlanetEffectiveStats {
  resources: number;
  influence: number;
  techSpecialties: TechColor[];
  trait?: string;
}

// Build a planet lookup table from systems
const planetLookup: Record<string, { resources: number; influence: number; techSpecialty?: string; trait?: string }> = {};
for (const systemId in systems) {
  const system = systems[parseInt(systemId)];
  if (system?.planets) {
    for (const planet of system.planets) {
      planetLookup[planet.id] = {
        resources: planet.resources,
        influence: planet.influence,
        techSpecialty: planet.techSpecialty,
        trait: planet.trait,
      };
    }
  }
}

/**
 * Get the effective resources, influence, and tech specialties for a planet
 * including all attachment modifiers
 */
export function getPlanetEffectiveStats(
  planet: PlanetInstance,
  systemId?: number
): PlanetEffectiveStats {
  // Get base planet data
  const basePlanet = planetLookup[planet.planetId];

  if (!basePlanet) {
    // Fallback for unknown planets
    return {
      resources: 0,
      influence: 0,
      techSpecialties: [],
    };
  }

  let resources = basePlanet.resources;
  let influence = basePlanet.influence;
  const techSpecialties: TechColor[] = [];

  // Add base tech specialty if present
  if (basePlanet.techSpecialty) {
    techSpecialties.push(basePlanet.techSpecialty as TechColor);
  }

  // Apply attachment modifiers
  if (planet.attachments && planet.attachments.length > 0) {
    for (const attachmentId of planet.attachments) {
      const card = getExplorationCard(attachmentId);
      if (card) {
        for (const effect of card.effects) {
          if (effect.type === 'attach' && effect.attachment) {
            const attachment = effect.attachment;
            if (attachment.resources !== undefined) {
              resources += attachment.resources;
            }
            if (attachment.influence !== undefined) {
              influence += attachment.influence;
            }
            if (attachment.techSpecialty) {
              techSpecialties.push(attachment.techSpecialty as TechColor);
            }
          }
        }
      }
    }
  }

  // Ensure resources and influence don't go negative
  return {
    resources: Math.max(0, resources),
    influence: Math.max(0, influence),
    techSpecialties,
    trait: basePlanet.trait,
  };
}

/**
 * Calculate the total resources a player can spend from their planets
 * (only exhausted planets, including attachment bonuses)
 */
export function calculateAvailableResources(
  state: GameState,
  playerId: string,
  includeExhausted: boolean = false
): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 0;

  let total = 0;

  for (const playerPlanet of player.planets) {
    if (includeExhausted || !playerPlanet.exhausted) {
      // Find planet instance on map
      for (const tile of state.map.tiles) {
        const planetInstance = tile.planets.find(
          (p) => p.planetId === playerPlanet.planetId
        );
        if (planetInstance) {
          const stats = getPlanetEffectiveStats(planetInstance, tile.systemId);
          total += stats.resources;
          break;
        }
      }
    }
  }

  return total;
}

/**
 * Calculate the total influence a player can spend from their planets
 * (only non-exhausted planets, including attachment bonuses)
 */
export function calculateAvailableInfluence(
  state: GameState,
  playerId: string,
  includeExhausted: boolean = false
): number {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return 0;

  let total = 0;

  for (const playerPlanet of player.planets) {
    if (includeExhausted || !playerPlanet.exhausted) {
      // Find planet instance on map
      for (const tile of state.map.tiles) {
        const planetInstance = tile.planets.find(
          (p) => p.planetId === playerPlanet.planetId
        );
        if (planetInstance) {
          const stats = getPlanetEffectiveStats(planetInstance, tile.systemId);
          total += stats.influence;
          break;
        }
      }
    }
  }

  return total;
}

/**
 * Get all tech specialties a player has access to from planets
 * (including attachments)
 */
export function getPlayerTechSpecialties(
  state: GameState,
  playerId: string
): TechColor[] {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return [];

  const specialties: Set<TechColor> = new Set();

  for (const playerPlanet of player.planets) {
    if (!playerPlanet.exhausted) {
      // Find planet instance on map
      for (const tile of state.map.tiles) {
        const planetInstance = tile.planets.find(
          (p) => p.planetId === playerPlanet.planetId
        );
        if (planetInstance) {
          const stats = getPlanetEffectiveStats(planetInstance, tile.systemId);
          for (const spec of stats.techSpecialties) {
            specialties.add(spec);
          }
          break;
        }
      }
    }
  }

  return Array.from(specialties);
}

/**
 * Get planet instance from the game state by planetId
 */
export function findPlanetInstance(
  state: GameState,
  planetId: string
): { planet: PlanetInstance; tile: { systemId: number } } | null {
  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p) => p.planetId === planetId);
    if (planet) {
      return { planet, tile: { systemId: tile.systemId } };
    }
  }
  return null;
}
