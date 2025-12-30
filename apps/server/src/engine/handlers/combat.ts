import type {
  GameState,
  CombatInstance,
  CombatState,
  AssignHitsAction,
  AnnounceRetreatAction,
  DiceRoll,
  HexCoord,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { findTileAtPosition } from '../utils/hex.js';
import { isShipType, getUnitStats } from '../utils/units.js';
import {
  rollDiceForPlayer,
  rollAFBDice,
  getAFBUnits,
  getEnemyFighters,
  getUnitsInCombat,
  findUnitById,
  removeUnit,
  damageUnit,
  checkCombatEnd,
  canUnitSustainDamage,
  countHits,
  findDefenderId,
  getValidRetreatSystems,
} from '../utils/combat.js';

/**
 * Initialize a new combat instance
 */
export function initializeCombat(
  state: GameState,
  systemPosition: HexCoord,
  attackerId: string,
  defenderId: string
): CombatInstance {
  const tile = findTileAtPosition(state.map, systemPosition);
  if (!tile) {
    throw new Error('System not found for combat initialization');
  }

  // Get units for each side
  const attackerUnits = tile.units
    .filter(u => u.ownerId === attackerId && isShipType(u.type))
    .map(u => u.id);

  const defenderUnits = tile.units
    .filter(u => u.ownerId === defenderId && isShipType(u.type))
    .map(u => u.id);

  const combat: CombatInstance = {
    id: `combat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'space',
    systemId: tile.id,
    attackerId,
    defenderId,
    state: 'anti_fighter_barrage',
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

  return combat;
}

/**
 * Process Anti-Fighter Barrage phase
 * Both sides with destroyers roll AFB against enemy fighters
 */
export function processAntiFighterBarrage(state: GameState): {
  attackerRolls: DiceRoll[];
  defenderRolls: DiceRoll[];
  attackerHits: number;
  defenderHits: number;
} {
  const combat = state.activeCombat;
  if (!combat) {
    return { attackerRolls: [], defenderRolls: [], attackerHits: 0, defenderHits: 0 };
  }

  const attacker = state.players.find(p => p.id === combat.attackerId);
  const defender = state.players.find(p => p.id === combat.defenderId);
  if (!attacker || !defender) {
    return { attackerRolls: [], defenderRolls: [], attackerHits: 0, defenderHits: 0 };
  }

  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) {
    return { attackerRolls: [], defenderRolls: [], attackerHits: 0, defenderHits: 0 };
  }

  // Get AFB units for each side
  const attackerShips = tile.units.filter(u => u.ownerId === combat.attackerId);
  const defenderShips = tile.units.filter(u => u.ownerId === combat.defenderId);

  const attackerAFBUnits = getAFBUnits(attackerShips, attacker);
  const defenderAFBUnits = getAFBUnits(defenderShips, defender);

  // Roll AFB dice
  const attackerRolls = rollAFBDice(attackerAFBUnits, attacker);
  const defenderRolls = rollAFBDice(defenderAFBUnits, defender);

  const attackerHits = countHits(attackerRolls);
  const defenderHits = countHits(defenderRolls);

  // AFB hits are automatically assigned to fighters
  // Destroy fighters up to the number of hits
  const enemyFightersOfAttacker = getEnemyFighters(state, combat, combat.defenderId);
  const enemyFightersOfDefender = getEnemyFighters(state, combat, combat.attackerId);

  // Attacker's AFB hits defender's fighters
  for (let i = 0; i < Math.min(attackerHits, enemyFightersOfAttacker.length); i++) {
    const fighter = enemyFightersOfAttacker[i];
    removeUnit(state, fighter.id);
    // Also remove from combat units list
    const index = combat.defenderUnits.indexOf(fighter.id);
    if (index !== -1) combat.defenderUnits.splice(index, 1);
  }

  // Defender's AFB hits attacker's fighters
  for (let i = 0; i < Math.min(defenderHits, enemyFightersOfDefender.length); i++) {
    const fighter = enemyFightersOfDefender[i];
    removeUnit(state, fighter.id);
    const index = combat.attackerUnits.indexOf(fighter.id);
    if (index !== -1) combat.attackerUnits.splice(index, 1);
  }

  return { attackerRolls, defenderRolls, attackerHits, defenderHits };
}

/**
 * Roll combat dice for both players
 * Returns the dice rolls grouped by player
 */
export function rollCombatDice(state: GameState): {
  attackerRolls: DiceRoll[];
  defenderRolls: DiceRoll[];
} {
  const combat = state.activeCombat;
  if (!combat) {
    return { attackerRolls: [], defenderRolls: [] };
  }

  const attackerRolls = rollDiceForPlayer(state, combat, combat.attackerId);
  const defenderRolls = rollDiceForPlayer(state, combat, combat.defenderId);

  // Calculate pending hits
  combat.pendingHits.attacker = countHits(defenderRolls); // Defender's hits apply to attacker
  combat.pendingHits.defender = countHits(attackerRolls); // Attacker's hits apply to defender

  return { attackerRolls, defenderRolls };
}

/**
 * Handle assign_hits action
 */
export function handleAssignHits(
  state: GameState,
  action: AssignHitsAction
): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  if (combat.state !== 'combat_round_assign') {
    return { success: false, error: 'Not in hit assignment phase' };
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
    const unit = findUnitById(state, assignment.unitId);
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
        const index = combat.attackerUnits.indexOf(assignment.unitId);
        if (index !== -1) combat.attackerUnits.splice(index, 1);
      } else {
        const index = combat.defenderUnits.indexOf(assignment.unitId);
        if (index !== -1) combat.defenderUnits.splice(index, 1);
      }
      assignedHits++;
    }
  }

  // Verify all hits were assigned
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
      return completeCombat(state, combatEnd.winnerId);
    }

    // Check for retreat
    if (combat.retreatAnnounced.attacker || combat.retreatAnnounced.defender) {
      return executeRetreat(state);
    }

    // Continue to next round
    combat.roundNumber++;
    combat.state = 'announce_retreat';
  }

  return {
    success: true,
    triggeredEvents: ['hits_assigned'],
  };
}

/**
 * Handle announce_retreat action
 */
export function handleAnnounceRetreat(
  state: GameState,
  action: AnnounceRetreatAction
): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  if (combat.state !== 'announce_retreat') {
    return { success: false, error: 'Not in retreat announcement phase' };
  }

  // Ground combat does not allow retreat
  if (combat.type === 'ground') {
    return { success: false, error: 'Cannot retreat from ground combat' };
  }

  const isAttacker = action.playerId === combat.attackerId;

  // Defender cannot retreat on first round
  if (!isAttacker && combat.roundNumber === 1) {
    return { success: false, error: 'Defender cannot retreat on first round' };
  }

  if (action.retreating) {
    // Validate retreat system
    if (!action.retreatSystem) {
      return { success: false, error: 'Must specify retreat system' };
    }

    const tile = state.map.tiles.find(t => t.id === combat.systemId);
    if (!tile) {
      return { success: false, error: 'Combat system not found' };
    }

    const validSystems = getValidRetreatSystems(state, action.playerId, tile.position);
    const isValidRetreat = validSystems.some(t =>
      t.position.q === action.retreatSystem!.q &&
      t.position.r === action.retreatSystem!.r
    );

    if (!isValidRetreat) {
      return { success: false, error: 'Invalid retreat system' };
    }

    if (isAttacker) {
      combat.retreatAnnounced.attacker = true;
    } else {
      combat.retreatAnnounced.defender = true;
    }
  }

  // Move to combat roll phase
  // For simplicity, we auto-advance after both players have had a chance
  // In a full implementation, you'd wait for both players to confirm
  combat.state = 'combat_round_roll';

  return {
    success: true,
    triggeredEvents: ['retreat_announced'],
  };
}

/**
 * Advance combat to next state
 */
export function advanceCombatState(state: GameState): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  switch (combat.state) {
    case 'anti_fighter_barrage':
      // Process AFB and move to announce retreat
      processAntiFighterBarrage(state);

      // Check if combat should end after AFB
      const afbEnd = checkCombatEnd(state, combat);
      if (afbEnd.ended) {
        return completeCombat(state, afbEnd.winnerId);
      }

      combat.state = 'announce_retreat';
      return { success: true, triggeredEvents: ['afb_complete'] };

    case 'announce_retreat':
      // Move to combat roll
      combat.state = 'combat_round_roll';
      return { success: true, triggeredEvents: ['retreat_phase_complete'] };

    case 'combat_round_roll':
      // Roll dice and move to assignment
      const rolls = rollCombatDice(state);
      combat.state = 'combat_round_assign';
      return {
        success: true,
        triggeredEvents: ['dice_rolled'],
        data: rolls,
      };

    case 'combat_round_assign':
      // This is handled by handleAssignHits
      return { success: true };

    case 'combat_complete':
      // Combat is done, transition out
      return completeTacticalCombat(state);

    default:
      return { success: false, error: `Unknown combat state: ${combat.state}` };
  }
}

/**
 * Execute retreat - move retreating player's ships
 */
function executeRetreat(state: GameState): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  // Determine winner (the player who didn't retreat, or both retreat = draw)
  let winnerId: string | null = null;
  if (combat.retreatAnnounced.attacker && !combat.retreatAnnounced.defender) {
    winnerId = combat.defenderId;
  } else if (!combat.retreatAnnounced.attacker && combat.retreatAnnounced.defender) {
    winnerId = combat.attackerId;
  }

  return completeCombat(state, winnerId);
}

/**
 * Complete combat and clean up
 */
export function completeCombat(
  state: GameState,
  winnerId: string | null
): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  combat.state = 'combat_complete';

  return {
    success: true,
    triggeredEvents: ['combat_ended'],
    data: { winnerId },
  };
}

/**
 * Complete tactical combat phase and transition to next phase
 * For space combat: goes to invasion or production
 * For ground combat: handled by invasion handlers
 */
export function completeTacticalCombat(state: GameState): HandlerResult {
  const combatType = state.activeCombat?.type;

  // Clear active combat
  state.activeCombat = null;

  // For ground combat, the invasion handler manages transitions
  if (combatType === 'ground') {
    return {
      success: true,
      triggeredEvents: ['ground_combat_complete'],
    };
  }

  // For space combat, check if we need to invade or go to production
  // Invasion transition is handled by action-phase after this returns
  state.subPhase = 'tactical_production';

  return {
    success: true,
    triggeredEvents: ['space_combat_complete'],
  };
}

/**
 * Skip to next combat phase (for automated flow)
 */
export function skipAnnounceRetreat(state: GameState): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  if (combat.state !== 'announce_retreat') {
    return { success: false, error: 'Not in retreat announcement phase' };
  }

  combat.state = 'combat_round_roll';

  return {
    success: true,
    triggeredEvents: ['retreat_phase_skipped'],
  };
}
