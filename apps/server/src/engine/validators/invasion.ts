import type {
  GameState,
  SelectInvasionTargetsAction,
  CommitGroundForcesAction,
  RollBombardmentAction,
  SkipBombardmentAction,
  AssignBombardmentHitsAction,
  AssignSpaceCannonHitsAction,
  SkipInvasionAction,
} from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { findTileAtPosition } from '../utils/hex.js';
import { isGroundUnit, getUnitStats } from '../utils/units.js';
import { getBombardmentUnits, canUnitSustainDamage } from '../utils/combat.js';

// =============================================================================
// SELECT INVASION TARGETS VALIDATOR
// =============================================================================

/**
 * Validate selecting planets to invade.
 */
export function validateSelectInvasionTargets(
  state: GameState,
  action: SelectInvasionTargetsAction
): ValidationResult {
  // Must be in action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Not in action phase' };
  }

  // Must be in tactical_invasion or select_planets sub-phase
  if (state.subPhase !== 'tactical_invasion' && state.subPhase !== 'select_planets') {
    return { valid: false, error: 'Not in invasion phase' };
  }

  // Must be the active player
  if (action.playerId !== state.activePlayerId) {
    return { valid: false, error: 'Not your turn' };
  }

  // Must have invasion tracking initialized
  if (!state.invasionPhase) {
    return { valid: false, error: 'Invasion phase not initialized' };
  }

  if (state.invasionPhase.currentStep !== 'select_planets') {
    return { valid: false, error: 'Not in planet selection step' };
  }

  // Must have an activated system
  if (!state.activatedSystem) {
    return { valid: false, error: 'No system activated' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { valid: false, error: 'Activated system not found' };
  }

  // Validate each target planet
  for (const planetId of action.targetPlanets) {
    const planet = tile.planets.find(p => p.planetId === planetId);
    if (!planet) {
      return { valid: false, error: `Planet ${planetId} not in this system` };
    }

    // Check if planet can be invaded
    const hasEnemyGroundForces = planet.units.some(
      u => u.ownerId !== action.playerId && isGroundUnit(u.type)
    );
    const isEnemyControlled = planet.controlledBy !== null && planet.controlledBy !== action.playerId;
    const isNeutral = planet.controlledBy === null;
    const alreadyControlled = planet.controlledBy === action.playerId;

    if (alreadyControlled && !hasEnemyGroundForces) {
      return { valid: false, error: `You already control ${planetId}` };
    }

    if (!hasEnemyGroundForces && !isEnemyControlled && !isNeutral) {
      return { valid: false, error: `Planet ${planetId} cannot be invaded` };
    }
  }

  // If targeting planets, must have ground forces to land
  if (action.targetPlanets.length > 0) {
    const hasGroundForces = tile.units.some(
      u => u.ownerId === action.playerId && isGroundUnit(u.type)
    );
    if (!hasGroundForces) {
      return { valid: false, error: 'No ground forces available to land' };
    }
  }

  return { valid: true };
}

// =============================================================================
// COMMIT GROUND FORCES VALIDATOR
// =============================================================================

/**
 * Validate committing ground forces to a planet.
 */
export function validateCommitGroundForces(
  state: GameState,
  action: CommitGroundForcesAction
): ValidationResult {
  // Must be in action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Not in action phase' };
  }

  // Must be in commit_ground_forces step
  if (state.subPhase !== 'commit_ground_forces') {
    return { valid: false, error: 'Not in commit ground forces step' };
  }

  // Must be the active player
  if (action.playerId !== state.activePlayerId) {
    return { valid: false, error: 'Not your turn' };
  }

  // Must have invasion tracking
  if (!state.invasionPhase) {
    return { valid: false, error: 'Invasion phase not initialized' };
  }

  // Must have an activated system
  if (!state.activatedSystem) {
    return { valid: false, error: 'No system activated' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { valid: false, error: 'Activated system not found' };
  }

  // Validate each assignment
  const usedUnitIds = new Set<string>();
  for (const assignment of action.assignments) {
    // Check for duplicate unit assignments
    if (usedUnitIds.has(assignment.unitId)) {
      return { valid: false, error: `Unit ${assignment.unitId} assigned multiple times` };
    }
    usedUnitIds.add(assignment.unitId);

    // Unit must exist in space
    const unit = tile.units.find(u => u.id === assignment.unitId);
    if (!unit) {
      return { valid: false, error: `Unit ${assignment.unitId} not found in system` };
    }

    // Unit must belong to the player
    if (unit.ownerId !== action.playerId) {
      return { valid: false, error: 'Cannot commit units you do not own' };
    }

    // Unit must be a ground unit
    if (!isGroundUnit(unit.type)) {
      return { valid: false, error: 'Only ground forces can be committed to planets' };
    }

    // Planet must be a valid target
    if (!state.invasionPhase.targetPlanets.includes(assignment.planetId)) {
      return { valid: false, error: `Planet ${assignment.planetId} is not a valid target` };
    }

    // Planet must exist in the system
    const planet = tile.planets.find(p => p.planetId === assignment.planetId);
    if (!planet) {
      return { valid: false, error: `Planet ${assignment.planetId} not found` };
    }
  }

  // Must commit at least one unit if there are target planets
  if (state.invasionPhase.targetPlanets.length > 0 && action.assignments.length === 0) {
    return { valid: false, error: 'Must commit at least one ground force' };
  }

  return { valid: true };
}

// =============================================================================
// ROLL BOMBARDMENT VALIDATOR
// =============================================================================

/**
 * Validate rolling bombardment dice.
 */
export function validateRollBombardment(
  state: GameState,
  action: RollBombardmentAction
): ValidationResult {
  // Must be in action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Not in action phase' };
  }

  // Must be in bombardment step
  if (state.subPhase !== 'bombardment') {
    return { valid: false, error: 'Not in bombardment step' };
  }

  // Must be the active player
  if (action.playerId !== state.activePlayerId) {
    return { valid: false, error: 'Not your turn' };
  }

  // Must have invasion tracking
  if (!state.invasionPhase) {
    return { valid: false, error: 'Invasion phase not initialized' };
  }

  // Must have an activated system
  if (!state.activatedSystem) {
    return { valid: false, error: 'No system activated' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { valid: false, error: 'Activated system not found' };
  }

  // Validate the planet ID
  const currentPlanetId = state.invasionPhase.targetPlanets[state.invasionPhase.currentPlanetIndex];
  if (action.planetId !== currentPlanetId) {
    return { valid: false, error: 'Invalid planet for bombardment' };
  }

  // Check player has ships with bombardment
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  const attackerShips = tile.units.filter(u => u.ownerId === action.playerId);
  const bombardmentUnits = getBombardmentUnits(attackerShips, player);

  if (bombardmentUnits.length === 0) {
    return { valid: false, error: 'No units with bombardment ability' };
  }

  return { valid: true };
}

// =============================================================================
// SKIP BOMBARDMENT VALIDATOR
// =============================================================================

/**
 * Validate skipping bombardment.
 */
export function validateSkipBombardment(
  state: GameState,
  action: SkipBombardmentAction
): ValidationResult {
  // Must be in action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Not in action phase' };
  }

  // Must be in bombardment step
  if (state.subPhase !== 'bombardment') {
    return { valid: false, error: 'Not in bombardment step' };
  }

  // Must be the active player
  if (action.playerId !== state.activePlayerId) {
    return { valid: false, error: 'Not your turn' };
  }

  // Must have invasion tracking
  if (!state.invasionPhase) {
    return { valid: false, error: 'Invasion phase not initialized' };
  }

  return { valid: true };
}

// =============================================================================
// ASSIGN BOMBARDMENT HITS VALIDATOR
// =============================================================================

/**
 * Validate assigning bombardment hits (defender assigns).
 */
export function validateAssignBombardmentHits(
  state: GameState,
  action: AssignBombardmentHitsAction
): ValidationResult {
  // Must be in action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Not in action phase' };
  }

  // Must be in bombardment step
  if (state.subPhase !== 'bombardment') {
    return { valid: false, error: 'Not in bombardment step' };
  }

  // Must have invasion tracking
  if (!state.invasionPhase) {
    return { valid: false, error: 'Invasion phase not initialized' };
  }

  // Must have pending hits
  if (state.invasionPhase.pendingBombardmentHits === 0) {
    return { valid: false, error: 'No bombardment hits to assign' };
  }

  // Must have an activated system
  if (!state.activatedSystem) {
    return { valid: false, error: 'No system activated' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { valid: false, error: 'Activated system not found' };
  }

  const currentPlanetId = state.invasionPhase.targetPlanets[state.invasionPhase.currentPlanetIndex];
  const planet = tile.planets.find(p => p.planetId === currentPlanetId);
  if (!planet) {
    return { valid: false, error: 'Planet not found' };
  }

  // Player must be the defender (planet controller)
  if (action.playerId !== planet.controlledBy) {
    return { valid: false, error: 'Only the defender can assign bombardment hits' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Validate each assignment
  let assignedHits = 0;
  for (const assignment of action.assignments) {
    const unit = planet.units.find(u => u.id === assignment.unitId);
    if (!unit) {
      return { valid: false, error: `Unit ${assignment.unitId} not found on planet` };
    }

    if (unit.ownerId !== action.playerId) {
      return { valid: false, error: 'Cannot assign hits to units you do not own' };
    }

    if (!isGroundUnit(unit.type)) {
      return { valid: false, error: 'Bombardment only affects ground forces' };
    }

    if (assignment.sustainDamage && !canUnitSustainDamage(unit, player)) {
      return { valid: false, error: `Unit ${unit.type} cannot sustain damage` };
    }

    if (assignment.sustainDamage) assignedHits++;
    if (assignment.destroyed) assignedHits++;
  }

  // Must assign all hits (unless not enough units)
  const defenderGroundForces = planet.units.filter(
    u => u.ownerId === action.playerId && isGroundUnit(u.type)
  );
  const maxAssignable = defenderGroundForces.length;

  if (assignedHits < Math.min(state.invasionPhase.pendingBombardmentHits, maxAssignable)) {
    return { valid: false, error: 'Must assign all bombardment hits' };
  }

  return { valid: true };
}

// =============================================================================
// ASSIGN SPACE CANNON HITS VALIDATOR
// =============================================================================

/**
 * Validate assigning space cannon hits (attacker assigns).
 */
export function validateAssignSpaceCannonHits(
  state: GameState,
  action: AssignSpaceCannonHitsAction
): ValidationResult {
  // Must be in action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Not in action phase' };
  }

  // Must be in space_cannon_defense step
  if (state.subPhase !== 'space_cannon_defense') {
    return { valid: false, error: 'Not in space cannon defense step' };
  }

  // Must be the active player (attacker)
  if (action.playerId !== state.activePlayerId) {
    return { valid: false, error: 'Not your turn' };
  }

  // Must have invasion tracking
  if (!state.invasionPhase) {
    return { valid: false, error: 'Invasion phase not initialized' };
  }

  // Must have pending hits
  if (state.invasionPhase.pendingSpaceCannonHits === 0) {
    return { valid: false, error: 'No space cannon hits to assign' };
  }

  // Must have an activated system
  if (!state.activatedSystem) {
    return { valid: false, error: 'No system activated' };
  }

  const tile = findTileAtPosition(state.map, state.activatedSystem);
  if (!tile) {
    return { valid: false, error: 'Activated system not found' };
  }

  const currentPlanetId = state.invasionPhase.targetPlanets[state.invasionPhase.currentPlanetIndex];
  const planet = tile.planets.find(p => p.planetId === currentPlanetId);
  if (!planet) {
    return { valid: false, error: 'Planet not found' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Validate each assignment - must be committed ground forces
  const committedUnits = state.invasionPhase.groundForcesCommitted[currentPlanetId] || [];

  let assignedHits = 0;
  for (const assignment of action.assignments) {
    if (!committedUnits.includes(assignment.unitId)) {
      return { valid: false, error: `Unit ${assignment.unitId} was not committed to this planet` };
    }

    const unit = planet.units.find(u => u.id === assignment.unitId);
    if (!unit) {
      return { valid: false, error: `Unit ${assignment.unitId} not found on planet` };
    }

    if (assignment.sustainDamage && !canUnitSustainDamage(unit, player)) {
      return { valid: false, error: `Unit ${unit.type} cannot sustain damage` };
    }

    if (assignment.sustainDamage) assignedHits++;
    if (assignment.destroyed) assignedHits++;
  }

  // Must assign all hits (unless not enough units)
  const remainingCommitted = committedUnits.filter(id =>
    planet.units.some(u => u.id === id)
  );

  if (assignedHits < Math.min(state.invasionPhase.pendingSpaceCannonHits, remainingCommitted.length)) {
    return { valid: false, error: 'Must assign all space cannon hits' };
  }

  return { valid: true };
}

// =============================================================================
// SKIP INVASION VALIDATOR
// =============================================================================

/**
 * Validate skipping the entire invasion.
 */
export function validateSkipInvasion(
  state: GameState,
  action: SkipInvasionAction
): ValidationResult {
  // Must be in action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Not in action phase' };
  }

  // Must be in an invasion sub-phase
  const invasionSubPhases = [
    'tactical_invasion',
    'select_planets',
    'bombardment',
    'commit_ground_forces',
  ];
  if (!invasionSubPhases.includes(state.subPhase as string)) {
    return { valid: false, error: 'Not in invasion phase' };
  }

  // Must be the active player
  if (action.playerId !== state.activePlayerId) {
    return { valid: false, error: 'Not your turn' };
  }

  return { valid: true };
}
