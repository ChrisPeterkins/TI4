import type {
  GameState,
  PlayerState,
  MapTile,
  UnitInstance,
  UnitType,
  CombatInstance,
  DiceRoll,
  HexCoord,
} from '@ti4/shared';
import { getUnitStats, isShipType, isGroundUnit } from './units.js';

// Number of dice each unit type rolls in combat
// Most units roll 1, but War Sun rolls 3
const COMBAT_DICE_COUNT: Partial<Record<UnitType, number>> = {
  war_sun: 3,
};

/**
 * Get the number of combat dice a unit type rolls
 */
export function getCombatDiceCount(type: UnitType): number {
  return COMBAT_DICE_COUNT[type] || 1;
}

/**
 * Check if a unit can sustain damage (hasn't already sustained)
 */
export function canUnitSustainDamage(unit: UnitInstance, player: PlayerState): boolean {
  const stats = getUnitStats(unit.type, player);
  return stats.sustainDamage === true && !unit.damaged;
}

/**
 * Group units by type for organized display and rolling
 */
export function groupUnitsByType(units: UnitInstance[]): Map<UnitType, UnitInstance[]> {
  const groups = new Map<UnitType, UnitInstance[]>();

  for (const unit of units) {
    const existing = groups.get(unit.type);
    if (existing) {
      existing.push(unit);
    } else {
      groups.set(unit.type, [unit]);
    }
  }

  return groups;
}

/**
 * Get units participating in combat for a player
 * For space combat: all ships in the system
 * For ground combat: all ground units on the planet
 */
export function getUnitsInCombat(
  state: GameState,
  combat: CombatInstance,
  playerId: string
): UnitInstance[] {
  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) return [];

  if (combat.type === 'space') {
    return tile.units.filter(u =>
      u.ownerId === playerId && isShipType(u.type)
    );
  } else {
    // Ground combat
    const planet = tile.planets.find(p => p.planetId === combat.planetId);
    if (!planet) return [];

    return planet.units.filter(u =>
      u.ownerId === playerId && isGroundUnit(u.type)
    );
  }
}

/**
 * Get units with Anti-Fighter Barrage ability
 */
export function getAFBUnits(units: UnitInstance[], player: PlayerState): UnitInstance[] {
  return units.filter(unit => {
    const stats = getUnitStats(unit.type, player);
    return stats.antiFighterBarrage !== undefined;
  });
}

/**
 * Get enemy fighters that can be targeted by AFB
 */
export function getEnemyFighters(
  state: GameState,
  combat: CombatInstance,
  targetPlayerId: string
): UnitInstance[] {
  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) return [];

  return tile.units.filter(u =>
    u.ownerId === targetPlayerId && u.type === 'fighter'
  );
}

/**
 * Get units with Bombardment ability
 */
export function getBombardmentUnits(units: UnitInstance[], player: PlayerState): UnitInstance[] {
  return units.filter(unit => {
    const stats = getUnitStats(unit.type, player);
    return stats.bombardment !== undefined;
  });
}

/**
 * Roll dice for a player's units in combat
 * Returns dice rolls grouped by unit for display
 */
export function rollDiceForPlayer(
  state: GameState,
  combat: CombatInstance,
  playerId: string
): DiceRoll[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  const unitIds = playerId === combat.attackerId
    ? combat.attackerUnits
    : combat.defenderUnits;

  const rolls: DiceRoll[] = [];

  for (const unitId of unitIds) {
    const unit = findUnitById(state, unitId);
    if (!unit) continue;

    const stats = getUnitStats(unit.type, player);
    const combatValue = stats.combat;
    if (combatValue === undefined) continue; // Skip non-combat units

    const diceCount = getCombatDiceCount(unit.type);
    const modifiers = calculateCombatModifiers(state, unit, player);

    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * 10) + 1; // d10: 1-10
      const modifiedCombatValue = Math.max(1, combatValue - modifiers.total);

      rolls.push({
        unitId: unit.id,
        unitType: unit.type,
        roll,
        combatValue: modifiedCombatValue,
        hit: roll >= modifiedCombatValue,
        modifiers: modifiers.descriptions,
      });
    }
  }

  return rolls;
}

/**
 * Roll Anti-Fighter Barrage dice
 */
export function rollAFBDice(
  units: UnitInstance[],
  player: PlayerState
): DiceRoll[] {
  const rolls: DiceRoll[] = [];

  for (const unit of units) {
    const stats = getUnitStats(unit.type, player);
    const afb = stats.antiFighterBarrage;
    if (!afb) continue;

    for (let i = 0; i < afb.count; i++) {
      const roll = Math.floor(Math.random() * 10) + 1;

      rolls.push({
        unitId: unit.id,
        unitType: unit.type,
        roll,
        combatValue: afb.value,
        hit: roll >= afb.value,
        modifiers: ['Anti-Fighter Barrage'],
      });
    }
  }

  return rolls;
}

/**
 * Roll Bombardment dice
 */
export function rollBombardmentDice(
  units: UnitInstance[],
  player: PlayerState
): DiceRoll[] {
  const rolls: DiceRoll[] = [];

  for (const unit of units) {
    const stats = getUnitStats(unit.type, player);
    const bombardment = stats.bombardment;
    if (!bombardment) continue;

    for (let i = 0; i < bombardment.count; i++) {
      const roll = Math.floor(Math.random() * 10) + 1;

      rolls.push({
        unitId: unit.id,
        unitType: unit.type,
        roll,
        combatValue: bombardment.value,
        hit: roll >= bombardment.value,
        modifiers: ['Bombardment'],
      });
    }
  }

  return rolls;
}

/**
 * Calculate combat modifiers from technologies, abilities, etc.
 */
export function calculateCombatModifiers(
  state: GameState,
  unit: UnitInstance,
  player: PlayerState
): { total: number; descriptions: string[] } {
  const descriptions: string[] = [];
  let total = 0;

  // Morale Boost tech (+1 to combat during a round)
  // Plasma Scoring tech (+1 to bombardment and space cannon)
  // etc. - implement as needed

  return { total, descriptions };
}

/**
 * Find a unit by ID anywhere in the game state
 */
export function findUnitById(state: GameState, unitId: string): UnitInstance | null {
  // Check space units
  for (const tile of state.map.tiles) {
    const spaceUnit = tile.units.find(u => u.id === unitId);
    if (spaceUnit) return spaceUnit;

    // Check planet units
    for (const planet of tile.planets) {
      const planetUnit = planet.units.find(u => u.id === unitId);
      if (planetUnit) return planetUnit;
    }
  }

  return null;
}

/**
 * Count total hits from dice rolls
 */
export function countHits(rolls: DiceRoll[]): number {
  return rolls.filter(r => r.hit).length;
}

/**
 * Get valid retreat systems for a player
 * Must be adjacent system with no enemy ships that player has activated
 * or contains their own ships
 */
export function getValidRetreatSystems(
  state: GameState,
  playerId: string,
  combatSystemPosition: HexCoord
): MapTile[] {
  const validTiles: MapTile[] = [];

  for (const tile of state.map.tiles) {
    // Skip the combat system itself
    if (tile.position.q === combatSystemPosition.q &&
        tile.position.r === combatSystemPosition.r) {
      continue;
    }

    // Must be adjacent (distance 1)
    if (!isAdjacent(combatSystemPosition, tile.position)) {
      continue;
    }

    // Cannot have enemy ships
    const hasEnemies = tile.units.some(u =>
      u.ownerId !== playerId && isShipType(u.type)
    );
    if (hasEnemies) continue;

    // Must have player's command token or ships
    const hasCommandToken = tile.commandTokens.includes(playerId);
    const hasOwnShips = tile.units.some(u =>
      u.ownerId === playerId && isShipType(u.type)
    );

    if (hasCommandToken || hasOwnShips) {
      validTiles.push(tile);
    }
  }

  return validTiles;
}

/**
 * Check if two hex positions are adjacent
 */
function isAdjacent(a: HexCoord, b: HexCoord): boolean {
  const dq = Math.abs(a.q - b.q);
  const dr = Math.abs(a.r - b.r);
  const ds = Math.abs((-a.q - a.r) - (-b.q - b.r));

  return (dq + dr + ds) === 2;
}

/**
 * Determine the defender in a combat (the player who isn't the attacker)
 */
export function findDefenderId(tile: MapTile, attackerId: string): string | null {
  for (const unit of tile.units) {
    if (unit.ownerId !== attackerId && isShipType(unit.type)) {
      return unit.ownerId;
    }
  }
  return null;
}

/**
 * Remove a unit from the game state (destroyed)
 */
export function removeUnit(state: GameState, unitId: string): boolean {
  for (const tile of state.map.tiles) {
    // Check space units
    const spaceIndex = tile.units.findIndex(u => u.id === unitId);
    if (spaceIndex !== -1) {
      tile.units.splice(spaceIndex, 1);
      return true;
    }

    // Check planet units
    for (const planet of tile.planets) {
      const planetIndex = planet.units.findIndex(u => u.id === unitId);
      if (planetIndex !== -1) {
        planet.units.splice(planetIndex, 1);
        return true;
      }
    }
  }

  return false;
}

/**
 * Mark a unit as damaged (sustained damage)
 */
export function damageUnit(state: GameState, unitId: string): boolean {
  const unit = findUnitById(state, unitId);
  if (unit) {
    unit.damaged = true;
    return true;
  }
  return false;
}

/**
 * Check if combat should end (one side has no units left)
 * For ground combat, defender wins on a draw (both sides eliminated)
 */
export function checkCombatEnd(
  state: GameState,
  combat: CombatInstance
): { ended: boolean; winnerId: string | null } {
  const attackerUnits = combat.attackerUnits.filter(id => findUnitById(state, id) !== null);
  const defenderUnits = combat.defenderUnits.filter(id => findUnitById(state, id) !== null);

  if (attackerUnits.length === 0 && defenderUnits.length === 0) {
    // Draw - in ground combat, defender retains control
    if (combat.type === 'ground') {
      return { ended: true, winnerId: combat.defenderId };
    }
    return { ended: true, winnerId: null }; // Space combat draw
  }

  if (attackerUnits.length === 0) {
    return { ended: true, winnerId: combat.defenderId };
  }

  if (defenderUnits.length === 0) {
    return { ended: true, winnerId: combat.attackerId };
  }

  return { ended: false, winnerId: null };
}

/**
 * Get the priority order for unit types in combat (for display)
 */
export function getUnitTypePriority(): UnitType[] {
  return [
    'war_sun',
    'flagship',
    'dreadnought',
    'carrier',
    'cruiser',
    'destroyer',
    'fighter',
    'mech',
    'infantry',
  ];
}

/**
 * Sort units by combat priority for display
 */
export function sortUnitsByPriority(units: UnitInstance[]): UnitInstance[] {
  const priority = getUnitTypePriority();
  return [...units].sort((a, b) => {
    const aIndex = priority.indexOf(a.type);
    const bIndex = priority.indexOf(b.type);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
}
