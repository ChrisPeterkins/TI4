import type {
  GameState,
  SelectInvasionTargetsAction,
  CommitGroundForcesAction,
  RollBombardmentAction,
  SkipBombardmentAction,
  AssignBombardmentHitsAction,
  AssignSpaceCannonHitsAction,
  SkipInvasionAction,
  AssignHitsAction,
  InvasionTracking,
  MapTile,
  PlanetInstance,
  UnitInstance,
  DiceRoll,
  CombatInstance,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { findTileAtPosition } from '../utils/hex.js';
import {
  isGroundUnit,
  isStructure,
  getUnitStats,
} from '../utils/units.js';
import {
  rollBombardmentDice,
  getBombardmentUnits,
  countHits,
  findUnitById,
  removeUnit,
  damageUnit,
  canUnitSustainDamage,
  rollDiceForPlayer,
  checkCombatEnd,
} from '../utils/combat.js';
import { systems } from '@ti4/game-data';
import { handleExplore } from './exploration.js';

/**
 * Initialize invasion phase
 * Called when transitioning to tactical_invasion
 */
export function initializeInvasion(state: GameState): HandlerResult {
  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { success: false, error: 'Activated system not found' };
  }

  const activePlayer = state.players.find(p => p.id === state.activePlayerId);
  if (!activePlayer) {
    return { success: false, error: 'Active player not found' };
  }

  // Find planets that can be invaded (have enemy ground forces or are uncontrolled)
  const invadablePlanets = getInvadablePlanets(tile, state.activePlayerId);

  if (invadablePlanets.length === 0) {
    // No planets to invade, skip to production
    state.subPhase = 'tactical_production';
    return {
      success: true,
      triggeredEvents: ['invasion_skipped'],
    };
  }

  // Initialize invasion tracking
  state.invasionPhase = {
    currentStep: 'select_planets',
    targetPlanets: [],
    currentPlanetIndex: 0,
    bombardmentComplete: false,
    groundForcesCommitted: {},
    spaceCannonComplete: false,
    pendingBombardmentHits: 0,
    pendingSpaceCannonHits: 0,
  };

  state.subPhase = 'select_planets';

  return {
    success: true,
    triggeredEvents: ['invasion_started'],
    data: { invadablePlanets: invadablePlanets.map(p => p.planetId) },
  };
}

/**
 * Get planets that can be invaded in a system
 */
export function getInvadablePlanets(tile: MapTile, playerId: string): PlanetInstance[] {
  return tile.planets.filter(planet => {
    // Can invade if:
    // 1. Planet has enemy ground forces
    // 2. Planet is uncontrolled (neutral)
    // 3. Planet is controlled by enemy (even without ground forces)
    const hasEnemyGroundForces = planet.units.some(
      u => u.ownerId !== playerId && isGroundUnit(u.type)
    );
    const isEnemyControlled = planet.controlledBy !== null && planet.controlledBy !== playerId;
    const isNeutral = planet.controlledBy === null;

    return hasEnemyGroundForces || isEnemyControlled || isNeutral;
  });
}

/**
 * Check if player has ground forces in space (on carriers) that can invade
 */
export function hasGroundForcesToLand(tile: MapTile, playerId: string): boolean {
  // Ground forces in space (being carried)
  return tile.units.some(
    u => u.ownerId === playerId && isGroundUnit(u.type)
  );
}

/**
 * Handle select invasion targets action
 */
export function handleSelectInvasionTargets(
  state: GameState,
  action: SelectInvasionTargetsAction
): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  if (state.invasionPhase.currentStep !== 'select_planets') {
    return { success: false, error: 'Not in planet selection step' };
  }

  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { success: false, error: 'Activated system not found' };
  }

  // Validate all target planets exist and are invadable
  const invadablePlanets = getInvadablePlanets(tile, action.playerId);
  const invadableIds = invadablePlanets.map(p => p.planetId);

  for (const planetId of action.targetPlanets) {
    if (!invadableIds.includes(planetId)) {
      return { success: false, error: `Planet ${planetId} cannot be invaded` };
    }
  }

  // Check if player has ground forces to land
  if (action.targetPlanets.length > 0 && !hasGroundForcesToLand(tile, action.playerId)) {
    return { success: false, error: 'No ground forces available to land' };
  }

  state.invasionPhase.targetPlanets = action.targetPlanets;
  state.invasionPhase.currentPlanetIndex = 0;

  if (action.targetPlanets.length === 0) {
    // Player chose not to invade any planets
    return completeInvasion(state);
  }

  // Move to bombardment step for first planet
  return advanceToNextInvasionStep(state);
}

/**
 * Handle skip invasion action
 */
export function handleSkipInvasion(
  state: GameState,
  action: SkipInvasionAction
): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  return completeInvasion(state);
}

/**
 * Handle roll bombardment action
 */
export function handleRollBombardment(
  state: GameState,
  action: RollBombardmentAction
): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  if (state.invasionPhase.currentStep !== 'bombardment') {
    return { success: false, error: 'Not in bombardment step' };
  }

  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { success: false, error: 'Activated system not found' };
  }

  const currentPlanetId = state.invasionPhase.targetPlanets[state.invasionPhase.currentPlanetIndex];
  if (action.planetId !== currentPlanetId) {
    return { success: false, error: 'Invalid planet for bombardment' };
  }

  const planet = tile.planets.find(p => p.planetId === currentPlanetId);
  if (!planet) {
    return { success: false, error: 'Planet not found' };
  }

  // Check for Planetary Shield
  if (hasPlanetaryShield(state, planet)) {
    // Skip bombardment, move to commit ground forces
    state.invasionPhase.bombardmentComplete = true;
    state.invasionPhase.currentStep = 'commit_ground_forces';
    state.subPhase = 'commit_ground_forces';

    return {
      success: true,
      triggeredEvents: ['bombardment_blocked'],
      data: { blocked: true, reason: 'Planetary Shield' },
    };
  }

  // Get attacker's ships with bombardment
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  const attackerShips = tile.units.filter(u => u.ownerId === action.playerId);
  const bombardmentUnits = getBombardmentUnits(attackerShips, player);

  if (bombardmentUnits.length === 0) {
    // No bombardment units, skip to commit ground forces
    state.invasionPhase.bombardmentComplete = true;
    state.invasionPhase.currentStep = 'commit_ground_forces';
    state.subPhase = 'commit_ground_forces';

    return {
      success: true,
      triggeredEvents: ['bombardment_skipped'],
    };
  }

  // Roll bombardment dice
  const rolls = rollBombardmentDice(bombardmentUnits, player);
  const hits = countHits(rolls);

  state.invasionPhase.pendingBombardmentHits = hits;

  if (hits === 0) {
    // No hits, move to commit ground forces
    state.invasionPhase.bombardmentComplete = true;
    state.invasionPhase.currentStep = 'commit_ground_forces';
    state.subPhase = 'commit_ground_forces';
  }
  // If there are hits, defender needs to assign them

  return {
    success: true,
    triggeredEvents: ['bombardment_rolled'],
    data: { rolls, hits },
  };
}

/**
 * Handle skip bombardment action
 */
export function handleSkipBombardment(
  state: GameState,
  action: SkipBombardmentAction
): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  if (state.invasionPhase.currentStep !== 'bombardment') {
    return { success: false, error: 'Not in bombardment step' };
  }

  state.invasionPhase.bombardmentComplete = true;
  state.invasionPhase.currentStep = 'commit_ground_forces';
  state.subPhase = 'commit_ground_forces';

  return {
    success: true,
    triggeredEvents: ['bombardment_skipped'],
  };
}

/**
 * Handle assign bombardment hits action (defender assigns)
 */
export function handleAssignBombardmentHits(
  state: GameState,
  action: AssignBombardmentHitsAction
): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  if (state.invasionPhase.currentStep !== 'bombardment') {
    return { success: false, error: 'Not in bombardment step' };
  }

  const pendingHits = state.invasionPhase.pendingBombardmentHits;
  if (pendingHits === 0) {
    return { success: false, error: 'No bombardment hits to assign' };
  }

  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { success: false, error: 'Activated system not found' };
  }

  const currentPlanetId = state.invasionPhase.targetPlanets[state.invasionPhase.currentPlanetIndex];
  const planet = tile.planets.find(p => p.planetId === currentPlanetId);
  if (!planet) {
    return { success: false, error: 'Planet not found' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Validate assignments
  let assignedHits = 0;
  for (const assignment of action.assignments) {
    const unit = planet.units.find(u => u.id === assignment.unitId);
    if (!unit) {
      return { success: false, error: `Unit ${assignment.unitId} not found on planet` };
    }

    if (unit.ownerId !== action.playerId) {
      return { success: false, error: 'Cannot assign hits to units you do not own' };
    }

    if (!isGroundUnit(unit.type)) {
      return { success: false, error: 'Bombardment only affects ground forces' };
    }

    if (assignment.sustainDamage) {
      if (!canUnitSustainDamage(unit, player)) {
        return { success: false, error: `Unit ${unit.type} cannot sustain damage` };
      }
      damageUnit(state, assignment.unitId);
      assignedHits++;
    }

    if (assignment.destroyed) {
      removeUnit(state, assignment.unitId);
      assignedHits++;
    }
  }

  if (assignedHits < pendingHits) {
    // Check if defender has enough units to take remaining hits
    const remainingGroundForces = planet.units.filter(
      u => u.ownerId === action.playerId && isGroundUnit(u.type)
    ).length;

    if (remainingGroundForces > 0) {
      return { success: false, error: `Must assign all ${pendingHits} hits` };
    }
    // All ground forces destroyed, continue
  }

  state.invasionPhase.pendingBombardmentHits = 0;
  state.invasionPhase.bombardmentComplete = true;
  state.invasionPhase.currentStep = 'commit_ground_forces';
  state.subPhase = 'commit_ground_forces';

  return {
    success: true,
    triggeredEvents: ['bombardment_hits_assigned'],
  };
}

/**
 * Handle commit ground forces action
 */
export function handleCommitGroundForces(
  state: GameState,
  action: CommitGroundForcesAction
): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  if (state.invasionPhase.currentStep !== 'commit_ground_forces') {
    return { success: false, error: 'Not in commit ground forces step' };
  }

  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { success: false, error: 'Activated system not found' };
  }

  // Validate all assignments
  for (const assignment of action.assignments) {
    // Unit must be in space (on carrier)
    const unit = tile.units.find(u => u.id === assignment.unitId);
    if (!unit) {
      return { success: false, error: `Unit ${assignment.unitId} not found in system` };
    }

    if (unit.ownerId !== action.playerId) {
      return { success: false, error: 'Cannot commit units you do not own' };
    }

    if (!isGroundUnit(unit.type)) {
      return { success: false, error: 'Only ground forces can be committed' };
    }

    // Planet must be a target planet
    if (!state.invasionPhase.targetPlanets.includes(assignment.planetId)) {
      return { success: false, error: `Planet ${assignment.planetId} is not a target` };
    }

    const planet = tile.planets.find(p => p.planetId === assignment.planetId);
    if (!planet) {
      return { success: false, error: `Planet ${assignment.planetId} not found` };
    }
  }

  // Move units from space to planets
  for (const assignment of action.assignments) {
    const unitIndex = tile.units.findIndex(u => u.id === assignment.unitId);
    if (unitIndex !== -1) {
      const [unit] = tile.units.splice(unitIndex, 1);
      unit.planetId = assignment.planetId;

      const planet = tile.planets.find(p => p.planetId === assignment.planetId);
      if (planet) {
        planet.units.push(unit);
      }

      // Track committed units
      if (!state.invasionPhase.groundForcesCommitted[assignment.planetId]) {
        state.invasionPhase.groundForcesCommitted[assignment.planetId] = [];
      }
      state.invasionPhase.groundForcesCommitted[assignment.planetId].push(unit.id);
    }
  }

  // Move to space cannon defense
  state.invasionPhase.currentStep = 'space_cannon_defense';
  state.subPhase = 'space_cannon_defense';

  return {
    success: true,
    triggeredEvents: ['ground_forces_committed'],
  };
}

/**
 * Process space cannon defense (automatic)
 */
export function processSpaceCannonDefense(state: GameState): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  if (state.invasionPhase.currentStep !== 'space_cannon_defense') {
    return { success: false, error: 'Not in space cannon defense step' };
  }

  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { success: false, error: 'Activated system not found' };
  }

  const currentPlanetId = state.invasionPhase.targetPlanets[state.invasionPhase.currentPlanetIndex];
  const planet = tile.planets.find(p => p.planetId === currentPlanetId);
  if (!planet) {
    return { success: false, error: 'Planet not found' };
  }

  // Get defender's PDS units on the planet
  const defenderId = planet.controlledBy;
  if (!defenderId) {
    // Neutral planet, no space cannon defense
    state.invasionPhase.spaceCannonComplete = true;
    state.invasionPhase.currentStep = 'ground_combat';
    state.subPhase = 'ground_combat';

    return {
      success: true,
      triggeredEvents: ['space_cannon_skipped'],
    };
  }

  const defender = state.players.find(p => p.id === defenderId);
  if (!defender) {
    state.invasionPhase.spaceCannonComplete = true;
    state.invasionPhase.currentStep = 'ground_combat';
    state.subPhase = 'ground_combat';

    return {
      success: true,
      triggeredEvents: ['space_cannon_skipped'],
    };
  }

  // Find PDS units on the planet
  const pdsUnits = planet.units.filter(u => {
    if (u.ownerId !== defenderId) return false;
    const stats = getUnitStats(u.type, defender);
    return stats.spaceCannon !== undefined;
  });

  if (pdsUnits.length === 0) {
    state.invasionPhase.spaceCannonComplete = true;
    state.invasionPhase.currentStep = 'ground_combat';
    state.subPhase = 'ground_combat';

    return {
      success: true,
      triggeredEvents: ['space_cannon_skipped'],
    };
  }

  // Roll space cannon dice
  const rolls: DiceRoll[] = [];
  for (const pds of pdsUnits) {
    const stats = getUnitStats(pds.type, defender);
    const spaceCannon = stats.spaceCannon;
    if (!spaceCannon) continue;

    for (let i = 0; i < spaceCannon.count; i++) {
      const roll = Math.floor(Math.random() * 10) + 1;
      rolls.push({
        unitId: pds.id,
        unitType: pds.type,
        roll,
        combatValue: spaceCannon.value,
        hit: roll >= spaceCannon.value,
        modifiers: ['Space Cannon Defense'],
      });
    }
  }

  const hits = countHits(rolls);
  state.invasionPhase.pendingSpaceCannonHits = hits;

  if (hits === 0) {
    state.invasionPhase.spaceCannonComplete = true;
    state.invasionPhase.currentStep = 'ground_combat';
    state.subPhase = 'ground_combat';
  }
  // If there are hits, attacker needs to assign them

  return {
    success: true,
    triggeredEvents: ['space_cannon_defense_rolled'],
    data: { rolls, hits },
  };
}

/**
 * Handle assign space cannon hits action (attacker assigns)
 */
export function handleAssignSpaceCannonHits(
  state: GameState,
  action: AssignSpaceCannonHitsAction
): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  if (state.invasionPhase.currentStep !== 'space_cannon_defense') {
    return { success: false, error: 'Not in space cannon defense step' };
  }

  const pendingHits = state.invasionPhase.pendingSpaceCannonHits;
  if (pendingHits === 0) {
    return { success: false, error: 'No space cannon hits to assign' };
  }

  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { success: false, error: 'Activated system not found' };
  }

  const currentPlanetId = state.invasionPhase.targetPlanets[state.invasionPhase.currentPlanetIndex];
  const planet = tile.planets.find(p => p.planetId === currentPlanetId);
  if (!planet) {
    return { success: false, error: 'Planet not found' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Validate assignments - must be committed ground forces
  const committedUnits = state.invasionPhase.groundForcesCommitted[currentPlanetId] || [];

  let assignedHits = 0;
  for (const assignment of action.assignments) {
    if (!committedUnits.includes(assignment.unitId)) {
      return { success: false, error: `Unit ${assignment.unitId} was not committed to this planet` };
    }

    const unit = planet.units.find(u => u.id === assignment.unitId);
    if (!unit) {
      return { success: false, error: `Unit ${assignment.unitId} not found on planet` };
    }

    if (assignment.sustainDamage) {
      if (!canUnitSustainDamage(unit, player)) {
        return { success: false, error: `Unit ${unit.type} cannot sustain damage` };
      }
      damageUnit(state, assignment.unitId);
      assignedHits++;
    }

    if (assignment.destroyed) {
      removeUnit(state, assignment.unitId);
      // Remove from committed list
      const idx = committedUnits.indexOf(assignment.unitId);
      if (idx !== -1) committedUnits.splice(idx, 1);
      assignedHits++;
    }
  }

  if (assignedHits < pendingHits) {
    const remainingCommitted = committedUnits.filter(id =>
      planet.units.some(u => u.id === id)
    ).length;

    if (remainingCommitted > 0) {
      return { success: false, error: `Must assign all ${pendingHits} hits` };
    }
  }

  state.invasionPhase.pendingSpaceCannonHits = 0;
  state.invasionPhase.spaceCannonComplete = true;
  state.invasionPhase.currentStep = 'ground_combat';
  state.subPhase = 'ground_combat';

  return {
    success: true,
    triggeredEvents: ['space_cannon_hits_assigned'],
  };
}

/**
 * Initialize ground combat for the current planet
 */
export function initializeGroundCombat(state: GameState): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  if (state.invasionPhase.currentStep !== 'ground_combat') {
    return { success: false, error: 'Not in ground combat step' };
  }

  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { success: false, error: 'Activated system not found' };
  }

  const currentPlanetId = state.invasionPhase.targetPlanets[state.invasionPhase.currentPlanetIndex];
  const planet = tile.planets.find(p => p.planetId === currentPlanetId);
  if (!planet) {
    return { success: false, error: 'Planet not found' };
  }

  const attackerId = state.activePlayerId;
  const defenderId = planet.controlledBy;

  // Get ground forces on the planet
  const attackerUnits = planet.units
    .filter(u => u.ownerId === attackerId && isGroundUnit(u.type))
    .map(u => u.id);

  const defenderUnits = defenderId
    ? planet.units
        .filter(u => u.ownerId === defenderId && isGroundUnit(u.type))
        .map(u => u.id)
    : [];

  // If no defender ground forces, attacker wins immediately
  if (defenderUnits.length === 0) {
    return establishControl(state, tile, planet, attackerId);
  }

  // If no attacker ground forces, defender retains control
  if (attackerUnits.length === 0) {
    // Move to next planet or complete invasion
    return advanceToNextPlanet(state);
  }

  // Create ground combat instance
  const combat: CombatInstance = {
    id: `combat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'ground',
    systemId: tile.id,
    planetId: currentPlanetId,
    attackerId,
    defenderId: defenderId!,
    state: 'combat_round_roll',
    roundNumber: 1,
    attackerUnits,
    defenderUnits,
    pendingHits: {
      attacker: 0,
      defender: 0,
    },
    retreatAnnounced: {
      attacker: false,
      defender: false,
    },
  };

  state.activeCombat = combat;

  return {
    success: true,
    triggeredEvents: ['ground_combat_started'],
    data: { combat },
  };
}

/**
 * Roll ground combat dice for both sides
 */
export function rollGroundCombatDice(state: GameState): {
  attackerRolls: DiceRoll[];
  defenderRolls: DiceRoll[];
} {
  const combat = state.activeCombat;
  if (!combat || combat.type !== 'ground') {
    return { attackerRolls: [], defenderRolls: [] };
  }

  const attackerRolls = rollDiceForPlayer(state, combat, combat.attackerId);
  const defenderRolls = rollDiceForPlayer(state, combat, combat.defenderId);

  // Calculate pending hits
  combat.pendingHits.attacker = countHits(defenderRolls);
  combat.pendingHits.defender = countHits(attackerRolls);

  return { attackerRolls, defenderRolls };
}

/**
 * Handle ground combat hit assignment
 */
export function handleGroundCombatAssignHits(
  state: GameState,
  action: AssignHitsAction
): HandlerResult {
  const combat = state.activeCombat;
  if (!combat || combat.type !== 'ground') {
    return { success: false, error: 'No active ground combat' };
  }

  if (combat.state !== 'combat_round_assign') {
    return { success: false, error: 'Not in hit assignment phase' };
  }

  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { success: false, error: 'Activated system not found' };
  }

  const planet = tile.planets.find(p => p.planetId === combat.planetId);
  if (!planet) {
    return { success: false, error: 'Planet not found' };
  }

  const isAttacker = action.playerId === combat.attackerId;
  const pendingHits = isAttacker ? combat.pendingHits.attacker : combat.pendingHits.defender;
  const player = state.players.find(p => p.id === action.playerId);

  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Validate assignments
  let assignedHits = 0;
  for (const assignment of action.assignments) {
    const unit = planet.units.find(u => u.id === assignment.unitId);
    if (!unit) {
      return { success: false, error: `Unit ${assignment.unitId} not found` };
    }

    if (unit.ownerId !== action.playerId) {
      return { success: false, error: 'Cannot assign hits to units you do not own' };
    }

    if (assignment.sustainDamage) {
      if (!canUnitSustainDamage(unit, player)) {
        return { success: false, error: `Unit ${unit.type} cannot sustain damage` };
      }
      damageUnit(state, assignment.unitId);
      assignedHits++;
    }

    if (assignment.destroyed) {
      removeUnit(state, assignment.unitId);
      // Remove from combat unit list
      if (isAttacker) {
        const idx = combat.attackerUnits.indexOf(assignment.unitId);
        if (idx !== -1) combat.attackerUnits.splice(idx, 1);
      } else {
        const idx = combat.defenderUnits.indexOf(assignment.unitId);
        if (idx !== -1) combat.defenderUnits.splice(idx, 1);
      }
      assignedHits++;
    }
  }

  if (assignedHits < pendingHits) {
    return { success: false, error: `Must assign all ${pendingHits} hits` };
  }

  // Clear pending hits for this player
  if (isAttacker) {
    combat.pendingHits.attacker = 0;
  } else {
    combat.pendingHits.defender = 0;
  }

  // Check if both players have assigned hits
  if (combat.pendingHits.attacker === 0 && combat.pendingHits.defender === 0) {
    // Check for combat end
    const combatEnd = checkCombatEnd(state, combat);
    if (combatEnd.ended) {
      return resolveGroundCombat(state, tile, combatEnd.winnerId);
    }

    // Continue to next round
    combat.roundNumber++;
    combat.state = 'combat_round_roll';
  }

  return {
    success: true,
    triggeredEvents: ['ground_combat_hits_assigned'],
  };
}

/**
 * Check ground combat end - handles defender winning on draw
 */
export function checkGroundCombatEnd(
  state: GameState,
  combat: CombatInstance
): { ended: boolean; winnerId: string | null } {
  if (!state.activatedSystem) {
    return { ended: false, winnerId: null };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { ended: false, winnerId: null };
  }

  const planet = tile.planets.find(p => p.planetId === combat.planetId);
  if (!planet) {
    return { ended: false, winnerId: null };
  }

  const attackerUnits = planet.units.filter(
    u => u.ownerId === combat.attackerId && isGroundUnit(u.type)
  );
  const defenderUnits = planet.units.filter(
    u => u.ownerId === combat.defenderId && isGroundUnit(u.type)
  );

  if (attackerUnits.length === 0 && defenderUnits.length === 0) {
    // Draw - defender retains control in ground combat
    return { ended: true, winnerId: combat.defenderId };
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
 * Resolve ground combat and establish control
 */
export function resolveGroundCombat(
  state: GameState,
  tile: MapTile,
  winnerId: string | null
): HandlerResult {
  const combat = state.activeCombat;
  if (!combat || combat.type !== 'ground') {
    return { success: false, error: 'No active ground combat' };
  }

  const planet = tile.planets.find(p => p.planetId === combat.planetId);
  if (!planet) {
    return { success: false, error: 'Planet not found' };
  }

  // Clear active combat
  state.activeCombat = null;

  if (winnerId === combat.attackerId) {
    // Attacker wins - establish control
    return establishControl(state, tile, planet, winnerId);
  } else {
    // Defender wins or draw - defender retains control
    return advanceToNextPlanet(state);
  }
}

/**
 * Establish control of a planet
 */
export function establishControl(
  state: GameState,
  tile: MapTile,
  planet: PlanetInstance,
  newControllerId: string
): HandlerResult {
  const previousController = planet.controlledBy;

  // If control is changing, destroy structures
  if (previousController && previousController !== newControllerId) {
    // Remove structures (PDS, Space Dock)
    planet.units = planet.units.filter(u => !isStructure(u.type));

    // Remove planet from previous controller's list
    const prevPlayer = state.players.find(p => p.id === previousController);
    if (prevPlayer) {
      prevPlayer.planets = prevPlayer.planets.filter(p => p.planetId !== planet.planetId);
    }
  }

  // Set new controller
  planet.controlledBy = newControllerId;

  // Add planet to new controller's list if not already there
  const newPlayer = state.players.find(p => p.id === newControllerId);
  if (newPlayer) {
    const alreadyOwns = newPlayer.planets.some(p => p.planetId === planet.planetId);
    if (!alreadyOwns) {
      newPlayer.planets.push({
        planetId: planet.planetId,
        exhausted: true, // Newly conquered planets are exhausted
        attachments: [...planet.attachments],
      });
    }
  }

  // Trigger exploration if taking control of an uncontrolled planet (not from another player)
  if (previousController === null) {
    triggerExploration(state, tile, planet, newControllerId);
  }

  // Move to next planet or complete invasion
  return advanceToNextPlanet(state);
}

/**
 * Advance to next planet or complete invasion
 */
export function advanceToNextPlanet(state: GameState): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  state.invasionPhase.currentPlanetIndex++;

  if (state.invasionPhase.currentPlanetIndex >= state.invasionPhase.targetPlanets.length) {
    // All planets processed, complete invasion
    return completeInvasion(state);
  }

  // Reset state for next planet
  state.invasionPhase.bombardmentComplete = false;
  state.invasionPhase.spaceCannonComplete = false;
  state.invasionPhase.pendingBombardmentHits = 0;
  state.invasionPhase.pendingSpaceCannonHits = 0;

  // Move to bombardment for next planet
  state.invasionPhase.currentStep = 'bombardment';
  state.subPhase = 'bombardment';

  return {
    success: true,
    triggeredEvents: ['next_planet'],
    data: {
      planetIndex: state.invasionPhase.currentPlanetIndex,
      planetId: state.invasionPhase.targetPlanets[state.invasionPhase.currentPlanetIndex],
    },
  };
}

/**
 * Advance to next invasion step for current planet
 */
export function advanceToNextInvasionStep(state: GameState): HandlerResult {
  if (!state.invasionPhase) {
    return { success: false, error: 'Not in invasion phase' };
  }

  const currentStep = state.invasionPhase.currentStep;

  switch (currentStep) {
    case 'select_planets':
      state.invasionPhase.currentStep = 'bombardment';
      state.subPhase = 'bombardment';
      break;

    case 'bombardment':
      state.invasionPhase.currentStep = 'commit_ground_forces';
      state.subPhase = 'commit_ground_forces';
      state.invasionPhase.bombardmentComplete = true;
      break;

    case 'commit_ground_forces':
      state.invasionPhase.currentStep = 'space_cannon_defense';
      state.subPhase = 'space_cannon_defense';
      break;

    case 'space_cannon_defense':
      state.invasionPhase.currentStep = 'ground_combat';
      state.subPhase = 'ground_combat';
      state.invasionPhase.spaceCannonComplete = true;
      break;

    case 'ground_combat':
      state.invasionPhase.currentStep = 'establish_control';
      state.subPhase = 'establish_control';
      break;

    case 'establish_control':
      return advanceToNextPlanet(state);
  }

  return {
    success: true,
    triggeredEvents: ['invasion_step_advanced'],
  };
}

/**
 * Complete invasion and transition to production
 */
export function completeInvasion(state: GameState): HandlerResult {
  // Clear invasion tracking
  state.invasionPhase = undefined;

  // Clear any active ground combat
  if (state.activeCombat?.type === 'ground') {
    state.activeCombat = null;
  }

  // Transition to production
  state.subPhase = 'tactical_production';

  return {
    success: true,
    triggeredEvents: ['invasion_complete'],
  };
}

/**
 * Check if a planet has Planetary Shield (from PDS)
 */
function hasPlanetaryShield(state: GameState, planet: PlanetInstance): boolean {
  const defenderId = planet.controlledBy;
  if (!defenderId) return false;

  const defender = state.players.find(p => p.id === defenderId);
  if (!defender) return false;

  return planet.units.some(u => {
    if (u.ownerId !== defenderId) return false;
    const stats = getUnitStats(u.type, defender);
    return stats.planetaryShield === true;
  });
}

/**
 * Trigger exploration when taking control of an uncontrolled planet
 * Only planets with traits (cultural, industrial, hazardous) can be explored
 */
function triggerExploration(
  state: GameState,
  tile: MapTile,
  planet: PlanetInstance,
  playerId: string
): void {
  // Get planet data to check for trait
  const systemData = systems[tile.systemId];
  if (!systemData) return;

  const planetData = systemData.planets.find((p: { id: string }) => p.id === planet.planetId);
  if (!planetData?.trait) {
    // No trait means planet cannot be explored (e.g., Mecatol Rex, home system planets)
    return;
  }

  // Check if exploration decks are initialized
  if (!state.explorationDecks) {
    return;
  }

  // Call the exploration handler
  handleExplore(state, {
    type: 'explore',
    playerId,
    planetId: planet.planetId,
    timestamp: Date.now(),
  });
}
