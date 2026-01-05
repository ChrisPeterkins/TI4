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
import {
  getUnitStats,
  isShipType,
  isGroundUnit,
  isCarrierType,
  calculateCapacityInSystem,
  countCapacityRequiredUnits,
  getUnitCapacity,
} from './units.js';
import { getCombatModifiers } from '../abilities/index.js';

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

  // Get temporary modifiers from combat state (action cards, etc.)
  const tempMods = combat.temporaryModifiers?.[playerId];

  // Magen Defense Grid: If blocked from combat, player cannot make combat rolls
  if (tempMods?.blockedFromCombat) {
    return [];
  }

  const rolls: DiceRoll[] = [];

  for (const unitId of unitIds) {
    const unit = findUnitById(state, unitId);
    if (!unit) continue;

    const stats = getUnitStats(unit.type, player);
    let combatValue = stats.combat;
    if (combatValue === undefined) continue; // Skip non-combat units

    // Calculate base modifiers (faction abilities, techs, flagships)
    const modifiers = calculateCombatModifiers(state, unit, player, combat);

    // Apply action card modifiers from combat state
    if (tempMods?.combatBonus) {
      modifiers.total += tempMods.combatBonus;
      modifiers.descriptions.push(`Morale Boost: +${tempMods.combatBonus}`);
    }
    if (tempMods?.combatPenalty) {
      modifiers.total -= tempMods.combatPenalty;
      modifiers.descriptions.push(`Combat penalty: -${tempMods.combatPenalty}`);
    }

    // Fighter-specific bonus (Fighter Prototype - first round only)
    if (unit.type === 'fighter' && tempMods?.fighterBonus && combat.roundNumber === 1) {
      modifiers.total += tempMods.fighterBonus;
      modifiers.descriptions.push(`Fighter Prototype: +${tempMods.fighterBonus}`);
    }

    // Calculate dice count (base + any extra from action cards)
    const baseDiceCount = getCombatDiceCount(unit.type);
    const extraDice = tempMods?.extraDice || 0;
    const diceCount = baseDiceCount + extraDice;

    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * 10) + 1; // d10: 1-10
      const modifiedCombatValue = Math.max(1, Math.min(10, combatValue - modifiers.total));

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
 * Note: Combat modifiers do NOT apply to AFB per TI4 rules
 */
export function rollAFBDice(
  units: UnitInstance[],
  player: PlayerState,
  options?: {
    disabledUnits?: string[]; // Units that can't use AFB (Disable action card)
  }
): DiceRoll[] {
  const rolls: DiceRoll[] = [];

  for (const unit of units) {
    // Check if this unit is disabled
    if (options?.disabledUnits?.includes(unit.id)) continue;

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
 * Roll Space Cannon dice
 * @param plasmaScoring - If true, one unit gets +1 die
 * @param antimassDeflectors - If target has Antimass Deflectors, -1 to hit
 * @param gravitonLaser - If true, hits must be assigned to non-fighters
 */
export function rollSpaceCannonDice(
  units: UnitInstance[],
  player: PlayerState,
  options?: {
    plasmaScoring?: boolean;
    antimassDeflectors?: boolean;
    gravitonLaser?: boolean;
  }
): DiceRoll[] {
  const rolls: DiceRoll[] = [];
  let plasmaUsed = false;

  for (const unit of units) {
    const stats = getUnitStats(unit.type, player);
    const spaceCannon = stats.spaceCannon;
    if (!spaceCannon) continue;

    // Calculate dice count (Plasma Scoring adds +1 to first unit)
    let diceCount = spaceCannon.count;
    if (options?.plasmaScoring && !plasmaUsed) {
      diceCount += 1;
      plasmaUsed = true;
    }

    // Calculate hit value (Antimass Deflectors makes it harder)
    let hitValue = spaceCannon.value;
    if (options?.antimassDeflectors) {
      hitValue += 1; // Higher = harder to hit
    }
    hitValue = Math.max(1, Math.min(10, hitValue));

    const modifierDescriptions: string[] = ['Space Cannon'];
    if (options?.plasmaScoring && diceCount > spaceCannon.count) {
      modifierDescriptions.push('Plasma Scoring: +1 die');
    }
    if (options?.antimassDeflectors) {
      modifierDescriptions.push('Antimass Deflectors: -1');
    }
    if (options?.gravitonLaser) {
      modifierDescriptions.push('Graviton Laser: hits to non-fighters');
    }

    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * 10) + 1;

      rolls.push({
        unitId: unit.id,
        unitType: unit.type,
        roll,
        combatValue: hitValue,
        hit: roll >= hitValue,
        modifiers: modifierDescriptions,
      });
    }
  }

  return rolls;
}

/**
 * Get units with Space Cannon ability
 */
export function getSpaceCannonUnits(units: UnitInstance[], player: PlayerState): UnitInstance[] {
  return units.filter(unit => {
    const stats = getUnitStats(unit.type, player);
    return stats.spaceCannon !== undefined;
  });
}

/**
 * Get PDS II units from adjacent systems that can fire Space Cannon Offense
 * PDS II has the ability to fire at ships in adjacent systems
 * @param state - The game state
 * @param targetSystemId - The system being targeted (where enemy ships are)
 * @param playerId - The player who owns the PDS
 * @returns Array of PDS II units that can fire from adjacent systems
 */
export function getAdjacentPDSIIUnits(
  state: GameState,
  targetSystemId: string,
  playerId: string
): UnitInstance[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  // Check if player has PDS II upgrade
  const hasPDSII = player.technologies.includes('pds_ii');
  if (!hasPDSII) return [];

  const targetTile = state.map.tiles.find(t => t.id === targetSystemId);
  if (!targetTile) return [];

  const adjacentPDSUnits: UnitInstance[] = [];

  // Find all adjacent systems
  for (const tile of state.map.tiles) {
    // Skip the target system itself
    if (tile.id === targetSystemId) continue;

    // Check if adjacent (distance 1)
    if (!isAdjacentHex(targetTile.position, tile.position)) continue;

    // Get PDS units from this adjacent system (on planets)
    for (const planet of tile.planets) {
      const pdsUnits = planet.units.filter(u =>
        u.ownerId === playerId && u.type === 'pds'
      );
      adjacentPDSUnits.push(...pdsUnits);
    }
  }

  return adjacentPDSUnits;
}

/**
 * Get all PDS units that can fire Space Cannon Offense at a target system
 * Includes PDS in the target system AND PDS II from adjacent systems
 */
export function getAllSpaceCannonOffenseUnits(
  state: GameState,
  targetSystemId: string,
  playerId: string
): UnitInstance[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  const tile = state.map.tiles.find(t => t.id === targetSystemId);
  if (!tile) return [];

  // Get PDS in the target system (on planets)
  const localPDS: UnitInstance[] = [];
  for (const planet of tile.planets) {
    const pdsUnits = planet.units.filter(u =>
      u.ownerId === playerId && u.type === 'pds'
    );
    localPDS.push(...pdsUnits);
  }

  // Get PDS II from adjacent systems
  const adjacentPDS = getAdjacentPDSIIUnits(state, targetSystemId, playerId);

  return [...localPDS, ...adjacentPDS];
}

/**
 * Helper: Check if two hex positions are adjacent
 */
function isAdjacentHex(a: HexCoord, b: HexCoord): boolean {
  const dq = Math.abs(a.q - b.q);
  const dr = Math.abs(a.r - b.r);
  const ds = Math.abs((-a.q - a.r) - (-b.q - b.r));
  return (dq + dr + ds) === 2;
}

/**
 * Roll Bombardment dice
 * @param plasmaScoring - If true, one unit gets +1 die (player's choice - we add to first unit)
 * @param bunkerPenalty - Penalty from Bunker action card (typically -4)
 */
export function rollBombardmentDice(
  units: UnitInstance[],
  player: PlayerState,
  options?: {
    plasmaScoring?: boolean;
    bunkerPenalty?: number;
  }
): DiceRoll[] {
  const rolls: DiceRoll[] = [];
  let plasmaUsed = false;

  for (const unit of units) {
    const stats = getUnitStats(unit.type, player);
    const bombardment = stats.bombardment;
    if (!bombardment) continue;

    // Calculate dice count (Plasma Scoring adds +1 to first unit)
    let diceCount = bombardment.count;
    if (options?.plasmaScoring && !plasmaUsed) {
      diceCount += 1;
      plasmaUsed = true;
    }

    // Calculate hit value (Bunker applies penalty)
    let hitValue = bombardment.value;
    if (options?.bunkerPenalty) {
      hitValue += options.bunkerPenalty; // Higher = harder to hit
    }
    hitValue = Math.max(1, Math.min(10, hitValue));

    const modifierDescriptions: string[] = ['Bombardment'];
    if (options?.plasmaScoring && diceCount > bombardment.count) {
      modifierDescriptions.push('Plasma Scoring: +1 die');
    }
    if (options?.bunkerPenalty) {
      modifierDescriptions.push(`Bunker: -${options.bunkerPenalty}`);
    }

    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * 10) + 1;

      rolls.push({
        unitId: unit.id,
        unitType: unit.type,
        roll,
        combatValue: hitValue,
        hit: roll >= hitValue,
        modifiers: modifierDescriptions,
      });
    }
  }

  return rolls;
}

/**
 * Calculate combat modifiers from technologies, abilities, flagships, commanders, etc.
 */
export function calculateCombatModifiers(
  state: GameState,
  unit: UnitInstance,
  player: PlayerState,
  combat?: CombatInstance
): { total: number; descriptions: string[] } {
  const descriptions: string[] = [];
  let total = 0;

  // Determine combat type based on unit
  const combatType = isGroundUnit(unit.type) ? 'ground' : 'space';

  // Get faction combat modifiers (Sardakk +1, Jol-Nar -1, etc.)
  const factionModifiers = getCombatModifiers(state, player.id, combatType);

  // Apply hit modifier (positive = better, lowers target number)
  if (factionModifiers.hitModifier !== 0) {
    total += factionModifiers.hitModifier;
    descriptions.push(...factionModifiers.descriptions);
  }

  // Get tile for flagship/commander checks
  const tile = combat ? state.map.tiles.find(t => t.id === combat.systemId) : null;

  // =========================================================================
  // FLAGSHIP COMBAT ABILITIES
  // =========================================================================
  if (tile && combatType === 'space') {
    const flagship = tile.units.find(u => u.ownerId === player.id && u.type === 'flagship');
    if (flagship) {
      switch (player.faction) {
        case 'sardakk':
          // C'Morran N'orr: +1 to all space combat rolls in this system
          total += 1;
          descriptions.push("C'Morran N'orr: +1");
          break;

        case 'letnev':
          // Arc Secundus: No combat bonus, but repairs at start of round (handled elsewhere)
          break;

        case 'mahact':
          // Arvicon Rex: +2 if opponent has no fleet token in this system
          if (combat) {
            const opponentId = combat.attackerId === player.id ? combat.defenderId : combat.attackerId;
            if (!tile.commandTokens.includes(opponentId)) {
              total += 2;
              descriptions.push('Arvicon Rex: +2');
            }
          }
          break;

        case 'naazrokha':
          // Visz el Vir: Mechs in space roll additional die (handled in dice count)
          break;

        // Other flagships have non-combat-roll effects
      }
    }
  }

  // =========================================================================
  // COMMANDER COMBAT ABILITIES
  // =========================================================================
  if (player.leaders?.commander.unlocked && tile) {
    switch (player.faction) {
      case 'winnu':
        // Rickar Rickani: +2 in Mecatol Rex, home system, or legendary planet systems
        const isMecatol = tile.systemId === 18;
        const isHome = tile.systemId >= 1 && tile.systemId <= 17; // Home systems
        const hasLegendary = tile.planets.some(p =>
          p.planetId.includes('primor') || p.planetId.includes('mallice') ||
          p.planetId.includes('mirage') || p.planetId.includes('hopes_end')
        );
        if (isMecatol || isHome || hasLegendary) {
          total += 2;
          descriptions.push('Rickar Rickani: +2');
        }
        break;

      // Other commanders with combat effects can be added here
    }
  }

  // =========================================================================
  // OPPONENT EFFECTS (from enemy flagships/abilities)
  // =========================================================================
  if (combat && tile) {
    const opponentId = combat.attackerId === player.id ? combat.defenderId : combat.attackerId;
    const opponentPlayer = state.players.find(p => p.id === opponentId);

    if (opponentPlayer) {
      const opponentFlagship = tile.units.find(u => u.ownerId === opponentId && u.type === 'flagship');

      if (opponentFlagship && opponentPlayer.faction === 'mentak') {
        // Fourth Moon: This player cannot use sustain damage
        // (Handled in hit assignment, not here - just noting for awareness)
      }
    }
  }

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
 * If the unit was a carrier-type ship, checks for capacity overflow
 * and destroys excess fighters/ground forces
 */
export function removeUnit(state: GameState, unitId: string): boolean {
  for (const tile of state.map.tiles) {
    // Check space units
    const spaceIndex = tile.units.findIndex(u => u.id === unitId);
    if (spaceIndex !== -1) {
      const unit = tile.units[spaceIndex];
      const wasCarrier = isCarrierType(unit.type);
      const ownerId = unit.ownerId;

      // Remove the unit
      tile.units.splice(spaceIndex, 1);

      // If it was a carrier, check for capacity overflow
      if (wasCarrier) {
        resolveCapacityOverflow(state, tile, ownerId);
      }

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
 * Check if there's a capacity overflow in a system for a player
 * @returns Array of unit IDs that exceed capacity (need to be destroyed)
 */
export function checkCapacityOverflow(
  state: GameState,
  tile: MapTile,
  playerId: string
): UnitInstance[] {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return [];

  // Calculate current capacity (from remaining carriers)
  const capacity = calculateCapacityInSystem(tile, player);

  // Count units requiring capacity (fighters in space, ground units not on planets)
  const unitsNeedingCapacity = tile.units.filter(u =>
    u.ownerId === playerId &&
    (u.type === 'fighter' || (isGroundUnit(u.type) && !u.planetId))
  );

  const overflow = unitsNeedingCapacity.length - capacity;

  if (overflow <= 0) {
    return []; // No overflow
  }

  // Return excess units - prioritize fighters first, then ground units
  // This is player's choice in real game, but we auto-select for simplicity
  const sortedUnits = unitsNeedingCapacity.sort((a, b) => {
    // Fighters first, then infantry, then mechs (mechs are most valuable)
    const priority: Record<UnitType, number> = {
      fighter: 0,
      infantry: 1,
      mech: 2,
    } as Record<UnitType, number>;
    return (priority[a.type] ?? 99) - (priority[b.type] ?? 99);
  });

  return sortedUnits.slice(0, overflow);
}

/**
 * Resolve capacity overflow by destroying excess units
 * @returns Object containing destroyed units info
 */
export function resolveCapacityOverflow(
  state: GameState,
  tile: MapTile,
  playerId: string
): { destroyed: UnitInstance[] } {
  const overflowUnits = checkCapacityOverflow(state, tile, playerId);

  if (overflowUnits.length === 0) {
    return { destroyed: [] };
  }

  // Remove each overflow unit
  const destroyed: UnitInstance[] = [];
  for (const unit of overflowUnits) {
    // Find and remove from tile.units
    const index = tile.units.findIndex(u => u.id === unit.id);
    if (index !== -1) {
      destroyed.push({ ...tile.units[index] });
      tile.units.splice(index, 1);
    }
  }

  return { destroyed };
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

// ============================================================================
// TECHNOLOGY COMBAT HELPERS
// ============================================================================

/**
 * Get bombardment options based on player's technologies and combat state
 */
export function getBombardmentOptions(
  state: GameState,
  playerId: string,
  defenderId: string
): {
  plasmaScoring: boolean;
  bunkerPenalty: number;
} {
  const player = state.players.find(p => p.id === playerId);
  const defender = state.players.find(p => p.id === defenderId);

  // Check Plasma Scoring tech
  const plasmaScoring = player?.technologies.includes('plasma_scoring') ?? false;

  // Check Bunker action card effect on defender
  const combat = state.activeCombat;
  const bunkerPenalty = combat?.temporaryModifiers?.[defenderId]?.combatPenalty ?? 0;

  return { plasmaScoring, bunkerPenalty };
}

/**
 * Get space cannon options based on player's technologies
 */
export function getSpaceCannonOptions(
  state: GameState,
  firingPlayerId: string,
  targetPlayerId: string
): {
  plasmaScoring: boolean;
  antimassDeflectors: boolean;
  gravitonLaser: boolean;
} {
  const firingPlayer = state.players.find(p => p.id === firingPlayerId);
  const targetPlayer = state.players.find(p => p.id === targetPlayerId);

  return {
    plasmaScoring: firingPlayer?.technologies.includes('plasma_scoring') ?? false,
    antimassDeflectors: targetPlayer?.technologies.includes('antimass_deflectors') ?? false,
    gravitonLaser: firingPlayer?.technologies.includes('graviton_laser_system') ?? false,
  };
}

/**
 * Validate space cannon hit assignments for Graviton Laser System
 * When the firing player has Graviton Laser System, hits must be assigned to non-fighters first
 * @param units - All targetable units owned by the target player
 * @param assignments - The hit assignments being validated
 * @param gravitonLaser - Whether the firing player has Graviton Laser System
 * @returns Validation result with valid flag and optional error
 */
export function validateGravitonLaserAssignment(
  units: UnitInstance[],
  assignments: Array<{ unitId: string; destroyed?: boolean; sustainDamage?: boolean }>,
  gravitonLaser: boolean
): { valid: boolean; error?: string } {
  if (!gravitonLaser) {
    return { valid: true }; // No restriction if no Graviton Laser
  }

  // Get non-fighters that could be targeted
  const nonFighters = units.filter(u => u.type !== 'fighter');
  const fighters = units.filter(u => u.type === 'fighter');

  // Count how many hits are going to fighters vs non-fighters
  let fighterHits = 0;
  let nonFighterHits = 0;

  for (const assignment of assignments) {
    if (assignment.destroyed || assignment.sustainDamage) {
      const unit = units.find(u => u.id === assignment.unitId);
      if (unit) {
        if (unit.type === 'fighter') {
          fighterHits++;
        } else {
          nonFighterHits++;
        }
      }
    }
  }

  // Calculate total hits
  const totalHits = fighterHits + nonFighterHits;

  // If there are non-fighters available, they must be targeted first
  // (before any fighters can be targeted)
  const nonFighterCapacity = nonFighters.length; // How many non-fighters can take hits

  // With Graviton Laser, non-fighters must be exhausted before fighters can be hit
  if (fighterHits > 0 && nonFighterHits < nonFighterCapacity) {
    return {
      valid: false,
      error: 'Graviton Laser System: Must assign hits to non-fighters before fighters',
    };
  }

  return { valid: true };
}

/**
 * Apply Duranium Armor effect - repair 1 damaged unit after assigning hits
 * The unit must not have just used Sustain Damage this round
 * @param justSustainedUnitIds - Unit IDs that used Sustain Damage this round
 * @returns The ID of the repaired unit, or null if no repair was made
 */
export function applyDuraniumArmor(
  state: GameState,
  combat: CombatInstance,
  playerId: string,
  justSustainedUnitIds: string[]
): string | null {
  const player = state.players.find(p => p.id === playerId);
  if (!player?.technologies.includes('duranium_armor')) {
    return null;
  }

  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) return null;

  // Find damaged units that didn't just sustain
  const units = combat.type === 'space'
    ? tile.units.filter(u => u.ownerId === playerId)
    : tile.planets.flatMap(p => p.units.filter(u => u.ownerId === playerId));

  const repairableUnits = units.filter(u =>
    u.damaged && !justSustainedUnitIds.includes(u.id)
  );

  if (repairableUnits.length === 0) {
    return null;
  }

  // Repair the first repairable unit (could be player choice in future)
  const unitToRepair = repairableUnits[0];
  unitToRepair.damaged = false;

  return unitToRepair.id;
}

/**
 * Check if Assault Cannon should trigger at start of space combat
 * Returns true if player has 3+ non-fighter ships and the tech
 */
export function shouldTriggerAssaultCannon(
  state: GameState,
  playerId: string,
  systemId: string
): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player?.technologies.includes('assault_cannon')) {
    return false;
  }

  const tile = state.map.tiles.find(t => t.id === systemId);
  if (!tile) return false;

  const nonFighterShips = tile.units.filter(u =>
    u.ownerId === playerId &&
    isShipType(u.type) &&
    u.type !== 'fighter'
  );

  return nonFighterShips.length >= 3;
}

/**
 * Get non-fighter ships for Assault Cannon target selection
 */
export function getNonFighterShips(
  state: GameState,
  playerId: string,
  systemId: string
): UnitInstance[] {
  const tile = state.map.tiles.find(t => t.id === systemId);
  if (!tile) return [];

  return tile.units.filter(u =>
    u.ownerId === playerId &&
    isShipType(u.type) &&
    u.type !== 'fighter'
  );
}

/**
 * Check if Mentak's Fourth Moon flagship prevents sustain damage
 */
export function canUseSustainDamage(
  state: GameState,
  playerId: string,
  combat: CombatInstance
): boolean {
  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) return true;

  // Check for opponent's Fourth Moon (Mentak flagship)
  const opponentId = combat.attackerId === playerId ? combat.defenderId : combat.attackerId;
  const opponent = state.players.find(p => p.id === opponentId);

  if (opponent?.faction === 'mentak') {
    const fourthMoon = tile.units.find(u =>
      u.ownerId === opponentId && u.type === 'flagship'
    );
    if (fourthMoon) {
      return false; // Cannot sustain when Fourth Moon is present
    }
  }

  return true;
}
