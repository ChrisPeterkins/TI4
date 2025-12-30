import type {
  GameState,
  AssignHitsAction,
  AnnounceRetreatAction,
  HitAssignment,
} from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { findUnitById, canUnitSustainDamage, getValidRetreatSystems } from '../utils/combat.js';

/**
 * Validate assign_hits action during combat
 */
export function validateAssignHits(
  state: GameState,
  action: AssignHitsAction
): ValidationResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { valid: false, error: 'No active combat' };
  }

  if (combat.state !== 'combat_round_assign') {
    return { valid: false, error: 'Not in hit assignment phase' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if player is part of this combat
  const isAttacker = action.playerId === combat.attackerId;
  const isDefender = action.playerId === combat.defenderId;
  if (!isAttacker && !isDefender) {
    return { valid: false, error: 'You are not part of this combat' };
  }

  // Get pending hits for this player
  const pendingHits = isAttacker
    ? combat.pendingHits.attacker
    : combat.pendingHits.defender;

  // Validate each assignment
  let assignedHits = 0;
  const assignedUnitIds = new Set<string>();

  for (const assignment of action.assignments) {
    // Check for duplicate unit assignments
    if (assignedUnitIds.has(assignment.unitId)) {
      return { valid: false, error: `Unit ${assignment.unitId} assigned multiple times` };
    }
    assignedUnitIds.add(assignment.unitId);

    // Find the unit
    const unit = findUnitById(state, assignment.unitId);
    if (!unit) {
      return { valid: false, error: `Unit ${assignment.unitId} not found` };
    }

    // Verify ownership
    if (unit.ownerId !== action.playerId) {
      return { valid: false, error: 'Cannot assign hits to units you do not own' };
    }

    // Verify unit is in this combat
    const unitInCombat = isAttacker
      ? combat.attackerUnits.includes(assignment.unitId)
      : combat.defenderUnits.includes(assignment.unitId);

    if (!unitInCombat) {
      return { valid: false, error: `Unit ${assignment.unitId} is not in this combat` };
    }

    // Validate assignment type
    if (assignment.sustainDamage && assignment.destroyed) {
      return { valid: false, error: 'Unit cannot both sustain damage and be destroyed in same assignment' };
    }

    if (assignment.sustainDamage) {
      if (!canUnitSustainDamage(unit, player)) {
        return { valid: false, error: `${unit.type} cannot sustain damage (already damaged or lacks ability)` };
      }
      assignedHits++;
    }

    if (assignment.destroyed) {
      assignedHits++;
    }
  }

  // Must assign all hits (unless no units left)
  if (assignedHits < pendingHits) {
    // Check if player has enough units to take the hits
    const playerUnits = isAttacker ? combat.attackerUnits : combat.defenderUnits;
    const aliveUnits = playerUnits.filter(id => findUnitById(state, id) !== null);

    // Count max absorbable hits
    let maxAbsorbable = 0;
    for (const unitId of aliveUnits) {
      const unit = findUnitById(state, unitId);
      if (unit) {
        maxAbsorbable++; // Can always destroy
        if (canUnitSustainDamage(unit, player)) {
          maxAbsorbable++; // Can also sustain
        }
      }
    }

    if (pendingHits <= maxAbsorbable) {
      return { valid: false, error: `Must assign all ${pendingHits} hits (assigned ${assignedHits})` };
    }
    // Otherwise, player has fewer units than hits, which is valid
  }

  return { valid: true };
}

/**
 * Validate announce_retreat action during combat
 */
export function validateAnnounceRetreat(
  state: GameState,
  action: AnnounceRetreatAction
): ValidationResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { valid: false, error: 'No active combat' };
  }

  if (combat.state !== 'announce_retreat') {
    return { valid: false, error: 'Not in retreat announcement phase' };
  }

  // Check if player is part of this combat
  const isAttacker = action.playerId === combat.attackerId;
  const isDefender = action.playerId === combat.defenderId;
  if (!isAttacker && !isDefender) {
    return { valid: false, error: 'You are not part of this combat' };
  }

  // Defender cannot retreat on first round (TI4 rule)
  if (isDefender && combat.roundNumber === 1) {
    if (action.retreating) {
      return { valid: false, error: 'Defender cannot retreat during the first round of combat' };
    }
  }

  // If retreating, validate retreat destination
  if (action.retreating) {
    if (!action.retreatSystem) {
      return { valid: false, error: 'Must specify a retreat destination' };
    }

    const tile = state.map.tiles.find(t => t.id === combat.systemId);
    if (!tile) {
      return { valid: false, error: 'Combat system not found' };
    }

    const validSystems = getValidRetreatSystems(state, action.playerId, tile.position);
    const isValidDestination = validSystems.some(t =>
      t.position.q === action.retreatSystem!.q &&
      t.position.r === action.retreatSystem!.r
    );

    if (!isValidDestination) {
      return { valid: false, error: 'Invalid retreat destination - must be adjacent with your ships or command token, no enemy ships' };
    }
  }

  return { valid: true };
}

/**
 * Validate advance_combat action (server-driven state advancement)
 */
export function validateAdvanceCombat(
  state: GameState,
  action: { playerId: string }
): ValidationResult {
  if (!state.activeCombat) {
    return { valid: false, error: 'No active combat' };
  }

  // Only combat participants can advance
  const combat = state.activeCombat;
  if (action.playerId !== combat.attackerId && action.playerId !== combat.defenderId) {
    return { valid: false, error: 'Only combat participants can advance combat' };
  }

  return { valid: true };
}
