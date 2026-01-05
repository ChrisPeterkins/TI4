import type {
  GameState,
  PassAction,
  TacticalAction,
  StrategicAction,
  MoveUnitsAction,
  SkipMovementAction,
  ProduceUnitsAction,
  SkipProductionAction,
  HexCoord,
  UnitType,
} from '@ti4/shared';
import { getBaseNoteId } from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { findTileAtPosition, getAdjacentPositions, findPath, hexDistance, findPathWithAbilities } from '../utils/hex.js';
import {
  isShipType,
  isGroundUnit,
  isStructure,
  getUnitMoveValue,
  getUnitCapacity,
  calculateFleetSupply,
  calculateFleetSupplyWithAbilities,
  countFleetSupplyUnits,
  calculateCapacityInSystem,
  calculateProductionCapacity,
  calculateProductionCapacityWithAbilities,
  calculateAvailableResources,
  calculateProductionCost,
  calculateProductionCount,
  countsTowardsFleetSupply,
  canProduceUnit,
  validateReinforcementsForProduction,
} from '../utils/units.js';

/**
 * Validate pass action
 */
export function validatePass(state: GameState, action: PassAction): ValidationResult {
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only pass during action phase' };
  }

  if (state.subPhase !== 'awaiting_action') {
    return { valid: false, error: 'Cannot pass while in the middle of an action' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Player must have used their strategy card before passing (or have no card)
  if (player.strategyCard !== null && !player.strategyCardUsed) {
    return { valid: false, error: 'Must use your strategy card before passing' };
  }

  if (player.passed) {
    return { valid: false, error: 'Already passed' };
  }

  return { valid: true };
}

/**
 * Validate tactical action (system activation)
 */
export function validateTacticalAction(
  state: GameState,
  action: TacticalAction
): ValidationResult {
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only take tactical actions during action phase' };
  }

  if (state.subPhase !== 'awaiting_action') {
    return { valid: false, error: 'Cannot start a new action while one is in progress' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if player has tactics tokens
  if (player.commandTokens.tactics < 1) {
    return { valid: false, error: 'No tactics command tokens available' };
  }

  // Validate the target system
  const targetTile = findTileAtPosition(state.map, action.systemPosition);
  if (!targetTile) {
    return { valid: false, error: 'Invalid system position' };
  }

  // Cannot activate a system that already has your command token
  if (targetTile.commandTokens.includes(action.playerId)) {
    return { valid: false, error: 'System already activated by you this round' };
  }

  // Cannot activate your home system (optional rule enforcement)
  // Some games allow this, but by default it's restricted
  const system = state.map.tiles.find(t => t.systemId === targetTile.systemId);
  if (system) {
    // Home systems are 1-17 (faction home systems)
    const isHomeSystem = targetTile.systemId >= 1 && targetTile.systemId <= 17;
    const isMyHomeSystem = state.players.some(
      p => p.id === action.playerId && isPlayerHomeSystem(state, p.faction, targetTile.systemId)
    );

    // Players can activate their own home system, but not others'
    if (isHomeSystem && !isMyHomeSystem) {
      // Check if any other player owns this home system
      const homeOwner = state.players.find(p =>
        isPlayerHomeSystem(state, p.faction, targetTile.systemId)
      );
      if (homeOwner && homeOwner.id !== action.playerId) {
        // This is another player's home system - can only activate if you have ships there
        const hasUnitsInSystem = targetTile.units.some(u => u.ownerId === action.playerId);
        if (!hasUnitsInSystem) {
          return { valid: false, error: 'Cannot activate another player\'s home system without units present' };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Validate strategic action (using strategy card)
 */
export function validateStrategicAction(
  state: GameState,
  action: StrategicAction
): ValidationResult {
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only use strategy cards during action phase' };
  }

  if (state.subPhase !== 'awaiting_action') {
    return { valid: false, error: 'Cannot start a new action while one is in progress' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Player must have this strategy card
  if (player.strategyCard !== action.cardNumber) {
    return { valid: false, error: 'You do not have this strategy card' };
  }

  // Card must not already be used
  if (player.strategyCardUsed) {
    return { valid: false, error: 'Strategy card already used this round' };
  }

  // Card must not be exhausted (shouldn't happen if strategyCardUsed is false)
  const card = state.strategyCards.find(c => c.number === action.cardNumber);
  if (!card) {
    return { valid: false, error: 'Strategy card not found' };
  }

  if (card.exhausted) {
    return { valid: false, error: 'Strategy card is exhausted' };
  }

  return { valid: true };
}

/**
 * Map of faction IDs to home system IDs
 */
const FACTION_HOME_SYSTEM_MAP: Record<string, number> = {
  sol: 1,
  mentak: 2,
  letnev: 3,
  muaat: 4,
  arborec: 5,
  l1z1x: 6,
  winnu: 7,
  nekro: 8,
  naalu: 9,
  hacan: 10,
  saar: 11,
  jolnar: 12,
  sardakk: 13,
  xxcha: 14,
  yin: 15,
  yssaril: 16,
  creuss: 51, // Creuss has special home system
  // PoK factions
  argent: 52,
  empyrean: 53,
  mahact: 54,
  naaz_rokha: 55,
  nomad: 56,
  titans: 57,
  vuil_raith: 58,
  keleres: 59, // Council Keleres
};

/**
 * Check if a system is a player's home system based on faction
 */
function isPlayerHomeSystem(state: GameState, factionId: string, systemId: number): boolean {
  return FACTION_HOME_SYSTEM_MAP[factionId] === systemId;
}

/**
 * Check if a system is any player's home system (excluding a specific player)
 * @param state - The game state
 * @param systemId - The system ID to check
 * @param excludePlayerId - Player ID to exclude from the check
 * @returns True if any other player has this as their home system
 */
function isAnyPlayerHomeSystem(state: GameState, systemId: number, excludePlayerId: string): boolean {
  for (const player of state.players) {
    if (player.id === excludePlayerId) continue;
    if (FACTION_HOME_SYSTEM_MAP[player.faction] === systemId) {
      return true;
    }
  }
  return false;
}

/**
 * Validate move_units action during tactical movement
 */
export function validateMoveUnits(
  state: GameState,
  action: MoveUnitsAction
): ValidationResult {
  // Must be in tactical movement sub-phase
  if (state.subPhase !== 'tactical_movement') {
    return { valid: false, error: 'Can only move units during tactical movement phase' };
  }

  // Must be active player
  if (state.activePlayerId !== action.playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  // Must have an activated system
  if (!state.activatedSystem) {
    return { valid: false, error: 'No system activated for this tactical action' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  const targetTile = findTileAtPosition(state.map, state.activatedSystem);
  if (!targetTile) {
    return { valid: false, error: 'Activated system not found' };
  }

  // Check if player is blocked by Ceasefire from moving ships
  if (state.ceasefireBlocks?.includes(action.playerId)) {
    // Check if any ships are being moved
    for (const move of action.moves) {
      const fromTile = findTileAtPosition(state.map, move.from.systemPosition);
      if (!fromTile) continue;

      const unit = move.from.planetId
        ? fromTile.planets.find(p => p.planetId === move.from.planetId)?.units.find(u => u.id === move.unitId)
        : fromTile.units.find(u => u.id === move.unitId);

      if (unit && isShipType(unit.type)) {
        return { valid: false, error: 'Cannot move ships into this system - blocked by Ceasefire' };
      }
    }
  }

  // Track units moving into the system and their capacity requirements
  const movingShips: UnitType[] = [];
  const movingGroundUnits: UnitType[] = [];
  const movingFighters: number[] = [];

  // Validate each move
  for (const move of action.moves) {
    // All moves must end in the activated system
    if (move.to.systemPosition.q !== state.activatedSystem.q ||
        move.to.systemPosition.r !== state.activatedSystem.r) {
      return { valid: false, error: 'All units must move to the activated system' };
    }

    // Find the source tile
    const fromTile = findTileAtPosition(state.map, move.from.systemPosition);
    if (!fromTile) {
      return { valid: false, error: 'Source system not found' };
    }

    // Cannot move FROM a system you activated this round
    if (fromTile.commandTokens.includes(action.playerId) &&
        (fromTile.position.q !== state.activatedSystem.q ||
         fromTile.position.r !== state.activatedSystem.r)) {
      return { valid: false, error: 'Cannot move units from a system you activated this round' };
    }

    // Find the unit - could be in space or on a planet
    let unit;
    if (move.from.planetId) {
      const planet = fromTile.planets.find(p => p.planetId === move.from.planetId);
      unit = planet?.units.find(u => u.id === move.unitId);
    } else {
      unit = fromTile.units.find(u => u.id === move.unitId);
    }

    if (!unit) {
      return { valid: false, error: `Unit ${move.unitId} not found in source location` };
    }

    if (unit.ownerId !== action.playerId) {
      return { valid: false, error: 'Cannot move units you do not own' };
    }

    // Structures cannot move
    if (isStructure(unit.type)) {
      return { valid: false, error: 'Structures cannot move' };
    }

    // Check if unit has movement value (ships only)
    if (isShipType(unit.type)) {
      const moveValue = getUnitMoveValue(unit.type, player);

      // Check if path exists within movement range (uses faction abilities for movement bonus, wormhole adjacency, anomaly immunity)
      const path = findPathWithAbilities(state, action.playerId, move.from.systemPosition, state.activatedSystem, moveValue);
      if (!path) {
        return { valid: false, error: `${unit.type} cannot reach destination (base movement: ${moveValue})` };
      }

      movingShips.push(unit.type);
    } else if (isGroundUnit(unit.type) || unit.type === 'fighter') {
      // Ground units and fighters need a carrier
      if (!move.carrier) {
        return { valid: false, error: `${unit.type} requires a carrier to move between systems` };
      }

      // Carrier must be in the same source system and also moving
      const carrierMove = action.moves.find(m => m.unitId === move.carrier);
      if (!carrierMove) {
        return { valid: false, error: `Carrier ${move.carrier} is not moving to carry ${unit.type}` };
      }

      if (unit.type === 'fighter') {
        movingFighters.push(1);
      } else {
        movingGroundUnits.push(unit.type);
      }
    }
  }

  // Check fleet supply at destination (uses faction abilities like Letnev Armada +2)
  const currentFleetSupply = countFleetSupplyUnits(targetTile.units, action.playerId);
  const newShipsCountingSupply = movingShips.filter(t => countsTowardsFleetSupply(t)).length;
  const maxFleetSupply = calculateFleetSupplyWithAbilities(state, action.playerId);

  if (currentFleetSupply + newShipsCountingSupply > maxFleetSupply) {
    return {
      valid: false,
      error: `Fleet supply exceeded: ${currentFleetSupply + newShipsCountingSupply}/${maxFleetSupply}`,
    };
  }

  // Check capacity for fighters and ground units
  // Calculate capacity from carriers in destination (existing + moving)
  let totalCapacity = calculateCapacityInSystem(targetTile, player);
  for (const shipType of movingShips) {
    totalCapacity += getUnitCapacity(shipType, player);
  }

  // Count units needing capacity (fighters in space, transported ground units)
  let unitsNeedingCapacity = 0;
  for (const unit of targetTile.units) {
    if (unit.ownerId === action.playerId &&
        (unit.type === 'fighter' || (isGroundUnit(unit.type) && !unit.planetId))) {
      unitsNeedingCapacity++;
    }
  }
  unitsNeedingCapacity += movingFighters.length + movingGroundUnits.length;

  if (unitsNeedingCapacity > totalCapacity) {
    return {
      valid: false,
      error: `Insufficient capacity: ${unitsNeedingCapacity} units need ${totalCapacity} capacity`,
    };
  }

  return { valid: true };
}

/**
 * Validate skip_movement action
 */
export function validateSkipMovement(
  state: GameState,
  action: SkipMovementAction
): ValidationResult {
  if (state.subPhase !== 'tactical_movement') {
    return { valid: false, error: 'Can only skip movement during tactical movement phase' };
  }

  if (state.activePlayerId !== action.playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  return { valid: true };
}

/**
 * Validate produce_units action during tactical production
 */
export function validateProduceUnits(
  state: GameState,
  action: ProduceUnitsAction
): ValidationResult {
  if (state.subPhase !== 'tactical_production') {
    return { valid: false, error: 'Can only produce units during tactical production phase' };
  }

  if (state.activePlayerId !== action.playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  if (!state.activatedSystem) {
    return { valid: false, error: 'No system activated for this tactical action' };
  }

  // Must produce in the activated system
  if (action.systemPosition.q !== state.activatedSystem.q ||
      action.systemPosition.r !== state.activatedSystem.r) {
    return { valid: false, error: 'Can only produce in the activated system' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  const tile = findTileAtPosition(state.map, action.systemPosition);
  if (!tile) {
    return { valid: false, error: 'System not found' };
  }

  // Check for space dock
  const hasSpaceDock = tile.planets.some(p =>
    p.units.some(u => u.ownerId === action.playerId && u.type === 'space_dock')
  ) || tile.units.some(u => u.ownerId === action.playerId && u.type === 'space_dock');

  if (!hasSpaceDock) {
    return { valid: false, error: 'No space dock in this system' };
  }

  // Check for Stymie (Arborec promissory note)
  // If anyone has Stymie in play where this player is the original owner,
  // production is blocked in/adjacent to systems with the holder's units
  for (const otherPlayer of state.players) {
    if (otherPlayer.id === action.playerId) continue;

    for (const noteInPlay of otherPlayer.promissoryNotesInPlay) {
      if (getBaseNoteId(noteInPlay.noteId) === 'stymie' &&
          noteInPlay.originalOwnerId === action.playerId) {
        // Check if production system contains or is adjacent to holder's units
        const productionPosition = action.systemPosition;

        // Check if holder has units in the production system
        const hasUnitsInProductionSystem = tile.units.some(u => u.ownerId === otherPlayer.id) ||
          tile.planets.some(p => p.units.some(u => u.ownerId === otherPlayer.id));

        if (hasUnitsInProductionSystem) {
          return {
            valid: false,
            error: `Stymie prevents production in systems containing ${otherPlayer.name}'s units`,
          };
        }

        // Check if holder has units in adjacent systems
        const adjacentPositions = getAdjacentPositions(productionPosition);
        for (const adjPos of adjacentPositions) {
          const adjTile = findTileAtPosition(state.map, adjPos);
          if (adjTile) {
            const hasUnitsInAdjacentSystem = adjTile.units.some(u => u.ownerId === otherPlayer.id) ||
              adjTile.planets.some(p => p.units.some(u => u.ownerId === otherPlayer.id));

            if (hasUnitsInAdjacentSystem) {
              return {
                valid: false,
                error: `Stymie prevents production in systems adjacent to ${otherPlayer.name}'s units`,
              };
            }
          }
        }
      }
    }
  }

  // Calculate production capacity (uses faction abilities like Saar Production 5)
  const productionCapacity = calculateProductionCapacityWithAbilities(state, tile, action.playerId);
  const unitCount = calculateProductionCount(action.units);

  if (unitCount > productionCapacity) {
    return {
      valid: false,
      error: `Production capacity exceeded: ${unitCount}/${productionCapacity}`,
    };
  }

  // Check if player can produce each unit type (faction restrictions like Arborec no infantry)
  for (const prod of action.units) {
    if (!canProduceUnit(state, action.playerId, prod.type, tile.id)) {
      return {
        valid: false,
        error: `Cannot produce ${prod.type} - blocked by faction ability`,
      };
    }
  }

  // Space Dock placement rules
  const spaceDocksToProduce = action.units.filter(u => u.type === 'space_dock');
  if (spaceDocksToProduce.length > 0) {
    // Check: Cannot build space dock in opponent's home system
    if (isAnyPlayerHomeSystem(state, tile.systemId, action.playerId)) {
      return {
        valid: false,
        error: 'Cannot build space dock in opponent\'s home system',
      };
    }

    // Check: One space dock per planet
    // Find planets where player already has a space dock
    const planetsWithDock = tile.planets
      .filter(p => p.units.some(u => u.ownerId === action.playerId && u.type === 'space_dock'))
      .map(p => p.planetId);

    // Count existing space docks in this system owned by this player
    const existingDocks = tile.planets.reduce((count, p) =>
      count + p.units.filter(u => u.ownerId === action.playerId && u.type === 'space_dock').length, 0
    );

    // Total space docks that would exist after production
    const totalDocksAfter = existingDocks + spaceDocksToProduce.reduce((sum, u) => sum + u.count, 0);
    const planetCount = tile.planets.length;

    // Cannot have more space docks than planets
    if (totalDocksAfter > planetCount) {
      return {
        valid: false,
        error: planetCount === 1
          ? 'Planet already has a space dock'
          : `Cannot build more space docks than planets in system (${planetCount} planets, ${existingDocks} existing docks)`,
      };
    }
  }

  // Check reinforcement limits (unit maximums per player)
  const reinforcementCheck = validateReinforcementsForProduction(state, action.playerId, action.units);
  if (!reinforcementCheck.valid) {
    return reinforcementCheck;
  }

  // Calculate cost
  const cost = calculateProductionCost(action.units);
  const availableResources = calculateAvailableResources(state, player);

  if (cost > availableResources) {
    return {
      valid: false,
      error: `Insufficient resources: need ${cost}, have ${availableResources}`,
    };
  }

  // Check fleet supply for new ships (uses faction abilities like Letnev Armada +2)
  const newShips = action.units
    .filter(u => countsTowardsFleetSupply(u.type))
    .reduce((sum, u) => sum + u.count, 0);
  const currentFleetSupply = countFleetSupplyUnits(tile.units, action.playerId);
  const maxFleetSupply = calculateFleetSupplyWithAbilities(state, action.playerId);

  if (currentFleetSupply + newShips > maxFleetSupply) {
    return {
      valid: false,
      error: `Fleet supply exceeded: ${currentFleetSupply + newShips}/${maxFleetSupply}`,
    };
  }

  // Check capacity for fighters and ground units
  const newFightersAndGround = action.units
    .filter(u => u.type === 'fighter' || isGroundUnit(u.type))
    .reduce((sum, u) => sum + u.count, 0);

  // Add capacity from newly produced carriers
  let newCapacity = 0;
  for (const prod of action.units) {
    if (['carrier', 'dreadnought', 'war_sun', 'flagship', 'cruiser'].includes(prod.type)) {
      newCapacity += getUnitCapacity(prod.type, player) * prod.count;
    }
  }

  const existingCapacity = calculateCapacityInSystem(tile, player);
  const existingNeedingCapacity = tile.units.filter(u =>
    u.ownerId === action.playerId &&
    (u.type === 'fighter' || (isGroundUnit(u.type) && !u.planetId))
  ).length;

  const totalCapacity = existingCapacity + newCapacity;
  const totalNeeding = existingNeedingCapacity + newFightersAndGround;

  if (totalNeeding > totalCapacity) {
    return {
      valid: false,
      error: `Insufficient capacity for produced units: ${totalNeeding}/${totalCapacity}`,
    };
  }

  return { valid: true };
}

/**
 * Validate skip_production action
 */
export function validateSkipProduction(
  state: GameState,
  action: SkipProductionAction
): ValidationResult {
  if (state.subPhase !== 'tactical_production') {
    return { valid: false, error: 'Can only skip production during tactical production phase' };
  }

  if (state.activePlayerId !== action.playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  return { valid: true };
}
