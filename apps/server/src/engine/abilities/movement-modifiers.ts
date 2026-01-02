/**
 * Movement Modifier Aggregation
 *
 * Collects and aggregates all movement modifiers from faction abilities,
 * technologies, and other sources.
 */

import type { GameState, HexCoord, MapTile } from '@ti4/shared';
import type { MovementModifiers } from './ability-types.js';
import { factions } from '@ti4/game-data';

/**
 * Default movement modifiers
 */
export function getDefaultMovementModifiers(): MovementModifiers {
  return {
    movementBonus: 0,
    additionalAdjacent: [],
    canMoveThroughEnemies: false,
    immuneToAnomalies: [],
  };
}

/**
 * Get movement modifiers for a player's ship starting from a specific system
 */
export function getMovementModifiers(
  state: GameState,
  playerId: string,
  startSystem: MapTile | null
): MovementModifiers {
  const modifiers = getDefaultMovementModifiers();
  const player = state.players.find((p) => p.id === playerId);

  if (!player || !player.faction) {
    return modifiers;
  }

  const faction = factions[player.faction];
  if (!faction) {
    return modifiers;
  }

  // Apply faction-specific movement modifiers
  switch (player.faction) {
    case 'creuss':
      // SLIPSTREAM: +1 movement when starting in home system or wormhole system
      if (startSystem) {
        const isHomeSystem = isPlayerHomeSystem(state, playerId, startSystem);
        const hasWormhole = startSystem.wormhole !== null;

        if (isHomeSystem || hasWormhole) {
          modifiers.movementBonus += 1;
        }
      }
      break;

    case 'empyrean':
      // VOIDBORN: Nebulae do not affect movement
      modifiers.immuneToAnomalies.push('nebula');
      break;

    case 'yssaril':
      // Y'sia Y'ssrila flagship can move through enemy ships
      // This would need to check if the flagship is the unit moving
      break;

    case 'muaat':
      // GASHLAI PHYSIOLOGY: Ships can move through supernovas
      modifiers.immuneToAnomalies.push('supernova');
      break;

    default:
      break;
  }

  // Apply technology-based movement modifiers
  if (player.technologies) {
    // ANTIMASS DEFLECTORS: Ships can move through asteroid fields
    if (player.technologies.includes('antimass_deflectors')) {
      modifiers.immuneToAnomalies.push('asteroid');
    }

    // LIGHT/WAVE DEFLECTOR: Ships can move through systems with enemy ships
    if (player.technologies.includes('light_wave_deflector')) {
      modifiers.canMoveThroughEnemies = true;
    }

    // GRAVITY DRIVE: +1 movement to 1 ship after activating a system
    // For simplicity, we apply this as a general bonus during tactical actions
    // In full implementation, player would select which ship gets the bonus
    if (player.technologies.includes('gravity_drive')) {
      modifiers.movementBonus += 1;
    }
  }

  return modifiers;
}

/**
 * Check if two systems are adjacent, accounting for faction abilities
 */
export function areSystemsAdjacent(
  state: GameState,
  playerId: string,
  fromSystem: MapTile,
  toSystem: MapTile
): boolean {
  const player = state.players.find((p) => p.id === playerId);

  // Standard adjacency check (hex neighbors)
  if (isHexAdjacent(fromSystem.position, toSystem.position)) {
    return true;
  }

  // Check for wormhole adjacency
  if (fromSystem.wormhole && toSystem.wormhole) {
    // Same type wormholes are adjacent (alpha to alpha, beta to beta)
    if (fromSystem.wormhole === toSystem.wormhole) {
      return true;
    }

    // Creuss: QUANTUM ENTANGLEMENT - all alpha/beta wormholes adjacent
    if (player?.faction === 'creuss') {
      const wormholeTypes = ['alpha', 'beta'];
      if (
        wormholeTypes.includes(fromSystem.wormhole) &&
        wormholeTypes.includes(toSystem.wormhole)
      ) {
        return true;
      }
    }
  }

  // Check for Creuss flagship delta wormhole
  // The Hil Colish creates a delta wormhole in its system
  if (player?.faction === 'creuss') {
    const hasFlagshipInFrom = hasFlagshipInSystem(state, playerId, fromSystem);
    const hasFlagshipInTo = hasFlagshipInSystem(state, playerId, toSystem);

    // Flagship creates delta wormhole - connects to all other wormholes
    if (hasFlagshipInFrom && toSystem.wormhole) {
      return true;
    }
    if (hasFlagshipInTo && fromSystem.wormhole) {
      return true;
    }
  }

  return false;
}

/**
 * Get all systems adjacent to a given system for a player
 * (accounting for faction abilities like Creuss wormhole adjacency)
 */
export function getAdjacentSystems(
  state: GameState,
  playerId: string,
  system: MapTile
): MapTile[] {
  const adjacent: MapTile[] = [];

  for (const tile of state.map.tiles) {
    if (tile.id === system.id) continue;

    if (areSystemsAdjacent(state, playerId, system, tile)) {
      adjacent.push(tile);
    }
  }

  return adjacent;
}

/**
 * Check if a system is a player's home system
 */
function isPlayerHomeSystem(
  state: GameState,
  playerId: string,
  system: MapTile
): boolean {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.faction) return false;

  const faction = factions[player.faction];
  if (!faction) return false;

  return system.systemId === faction.homeSystemId;
}

/**
 * Check if two hex positions are adjacent
 */
function isHexAdjacent(pos1: HexCoord, pos2: HexCoord): boolean {
  // In axial coordinates, adjacent hexes differ by at most 1 in each direction
  // and the sum of differences equals 1 or 2
  const dq = Math.abs(pos1.q - pos2.q);
  const dr = Math.abs(pos1.r - pos2.r);
  const ds = Math.abs((-pos1.q - pos1.r) - (-pos2.q - pos2.r));

  return Math.max(dq, dr, ds) === 1;
}

/**
 * Check if player has flagship in a system
 */
function hasFlagshipInSystem(
  state: GameState,
  playerId: string,
  system: MapTile
): boolean {
  return system.units.some(
    (u) => u.ownerId === playerId && u.type === 'flagship'
  );
}

/**
 * Check if a system blocks movement for a player
 * (asteroids, gravity rifts, etc.)
 */
export function doesSystemBlockMovement(
  state: GameState,
  playerId: string,
  system: MapTile
): boolean {
  const modifiers = getMovementModifiers(state, playerId, null);

  // Check for anomalies
  if (system.anomaly) {
    // If player is immune to this anomaly type, it doesn't block
    if (modifiers.immuneToAnomalies.includes(system.anomaly)) {
      return false;
    }

    // Supernova blocks movement (except Muaat)
    if (system.anomaly === 'supernova') {
      return true;
    }
  }

  return false;
}

/**
 * Check if a ship can end its movement in a system
 * Asteroid fields prevent ending movement (unless it's the activated/destination system)
 */
export function canEndMovementInSystem(
  state: GameState,
  playerId: string,
  system: MapTile,
  isActivatedSystem: boolean
): boolean {
  const modifiers = getMovementModifiers(state, playerId, null);

  if (system.anomaly === 'asteroid') {
    // Can only end in asteroid field if it's the activated system
    if (!isActivatedSystem) {
      // Check for immunity (e.g., from Antimass Deflectors tech)
      if (!modifiers.immuneToAnomalies.includes('asteroid')) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get the movement cost to enter a system
 * Nebulae and gravity rifts cost +1 movement to leave
 */
export function getMovementCostToEnter(
  state: GameState,
  playerId: string,
  fromSystem: MapTile,
  _toSystem: MapTile
): number {
  const modifiers = getMovementModifiers(state, playerId, null);
  let cost = 1; // Base cost is 1

  // Leaving a nebula costs +1 movement (unless immune)
  if (fromSystem.anomaly === 'nebula') {
    if (!modifiers.immuneToAnomalies.includes('nebula')) {
      cost += 1;
    }
  }

  // Leaving a gravity rift costs +1 movement (unless immune)
  if (fromSystem.anomaly === 'gravity_rift') {
    if (!modifiers.immuneToAnomalies.includes('gravity_rift')) {
      cost += 1;
    }
  }

  return cost;
}

/**
 * Check if a system has gravity rift danger
 * Ships moving through a gravity rift must roll: 1-3 = destroyed, 4-10 = safe
 */
export function hasGravityRiftDanger(
  state: GameState,
  playerId: string,
  system: MapTile
): boolean {
  if (system.anomaly !== 'gravity_rift') {
    return false;
  }

  const modifiers = getMovementModifiers(state, playerId, null);

  // Check for immunity
  if (modifiers.immuneToAnomalies.includes('gravity_rift')) {
    return false;
  }

  return true;
}

/**
 * Roll for gravity rift destruction
 * Returns true if the ship survives, false if destroyed
 */
export function rollGravityRift(): { survived: boolean; roll: number } {
  const roll = Math.floor(Math.random() * 10) + 1; // 1-10
  return {
    survived: roll >= 4, // 4-10 survives, 1-3 destroyed
    roll,
  };
}
