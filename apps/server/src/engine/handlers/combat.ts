import type {
  GameState,
  CombatInstance,
  CombatState,
  AssignHitsAction,
  AnnounceRetreatAction,
  DiceRoll,
  HexCoord,
  TimingTrigger,
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
  shouldTriggerAssaultCannon,
  getNonFighterShips,
  applyDuraniumArmor,
  canUseSustainDamage,
} from '../utils/combat.js';
import { checkTimingTrigger } from './timing-windows.js';
import { checkAbilityTriggers } from '../abilities/ability-triggers.js';

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
 * Trigger timing windows at combat start
 * Call this after combat is initialized and before first AFB
 */
export function triggerCombatStartWindow(state: GameState): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: true };
  }

  const trigger: TimingTrigger = combat.type === 'space' ? 'space_combat_start' : 'ground_combat_start';

  return checkTimingTrigger(state, trigger, {
    combatId: combat.id,
    systemPosition: findCombatSystemPosition(state, combat.systemId),
  });
}

/**
 * Check and apply Assault Cannon at start of space combat
 * Returns info about whether opponent needs to destroy a ship
 */
export function checkAssaultCannon(state: GameState): {
  attackerTriggers: boolean;
  defenderTriggers: boolean;
  attackerTargets: string[];
  defenderTargets: string[];
} {
  const combat = state.activeCombat;
  const result = {
    attackerTriggers: false,
    defenderTriggers: false,
    attackerTargets: [] as string[],
    defenderTargets: [] as string[],
  };

  if (!combat || combat.type !== 'space') {
    return result;
  }

  // Check if attacker has Assault Cannon
  if (shouldTriggerAssaultCannon(state, combat.attackerId, combat.systemId)) {
    result.attackerTriggers = true;
    // Defender must choose a non-fighter ship to destroy
    result.defenderTargets = getNonFighterShips(state, combat.defenderId, combat.systemId)
      .map(u => u.id);
  }

  // Check if defender has Assault Cannon
  if (shouldTriggerAssaultCannon(state, combat.defenderId, combat.systemId)) {
    result.defenderTriggers = true;
    // Attacker must choose a non-fighter ship to destroy
    result.attackerTargets = getNonFighterShips(state, combat.attackerId, combat.systemId)
      .map(u => u.id);
  }

  return result;
}

/**
 * Trigger timing windows before combat dice are rolled
 */
export function triggerBeforeCombatRolls(state: GameState): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: true };
  }

  return checkTimingTrigger(state, 'before_combat_rolls', {
    combatId: combat.id,
    systemPosition: findCombatSystemPosition(state, combat.systemId),
  });
}

/**
 * Trigger timing windows at start of a combat round
 */
export function triggerCombatRoundStart(state: GameState): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: true };
  }

  return checkTimingTrigger(state, 'combat_round_start', {
    combatId: combat.id,
    systemPosition: findCombatSystemPosition(state, combat.systemId),
    additionalData: { roundNumber: combat.roundNumber },
  });
}

/**
 * Helper to find the system position from a combat system ID
 */
function findCombatSystemPosition(state: GameState, systemId: string): HexCoord | undefined {
  const tile = state.map.tiles.find(t => t.id === systemId);
  return tile?.position;
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

  // Check if player can use sustain damage (Mentak's Fourth Moon blocks it)
  const sustainAllowed = canUseSustainDamage(state, action.playerId, combat);

  // Track units that sustain damage this round (for Duranium Armor)
  const justSustainedUnitIds: string[] = [];

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
      // Check if sustain is blocked by Mentak's Fourth Moon
      if (!sustainAllowed) {
        return { success: false, error: 'Sustain Damage blocked by Fourth Moon flagship' };
      }
      if (!canUnitSustainDamage(unit, player)) {
        return { success: false, error: `Unit ${unit.type} cannot sustain damage` };
      }
      damageUnit(state, assignment.unitId);
      justSustainedUnitIds.push(assignment.unitId);
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

  // Apply Duranium Armor - repair 1 damaged unit that didn't just sustain
  const repairedUnitId = applyDuraniumArmor(state, combat, action.playerId, justSustainedUnitIds);

  // Clear pending hits for this player
  if (isAttacker) {
    combat.pendingHits.attacker = 0;
  } else {
    combat.pendingHits.defender = 0;
  }

  const triggeredEvents: string[] = ['hits_assigned'];
  if (repairedUnitId) {
    triggeredEvents.push('duranium_armor_repair');
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

    // Clear temporary modifiers (they only last for one round)
    combat.temporaryModifiers = undefined;
  }

  return {
    success: true,
    triggeredEvents,
    data: repairedUnitId ? { repairedUnitId } : undefined,
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
 * Determine the winner of combat based on remaining units
 * Returns the player ID of the winner, or null if it's a draw
 */
export function determineCombatWinner(
  state: GameState,
  combat: CombatInstance
): string | null {
  // Count remaining units for each side
  const attackerHasUnits = combat.attackerUnits.length > 0;
  const defenderHasUnits = combat.defenderUnits.length > 0;

  if (attackerHasUnits && !defenderHasUnits) {
    return combat.attackerId;
  } else if (!attackerHasUnits && defenderHasUnits) {
    return combat.defenderId;
  } else if (!attackerHasUnits && !defenderHasUnits) {
    // Both sides annihilated - no winner (draw)
    return null;
  } else {
    // Both sides have units - shouldn't happen at combat end
    // This could occur if retreat was announced
    return null;
  }
}

/**
 * Complete combat and clean up
 * Fires combat_win and combat_loss triggers for faction abilities (e.g., Nekro Galactic Threat)
 */
export function completeCombat(
  state: GameState,
  winnerId: string | null
): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  // If winnerId wasn't passed, determine it from remaining units
  const actualWinnerId = winnerId ?? determineCombatWinner(state, combat);
  const loserId = actualWinnerId
    ? (actualWinnerId === combat.attackerId ? combat.defenderId : combat.attackerId)
    : null;

  combat.state = 'combat_complete';

  // Fire combat_win trigger for winner (e.g., Nekro's Galactic Threat)
  if (actualWinnerId && loserId) {
    const winTriggers = checkAbilityTriggers(state, 'combat_win', {
      playerId: actualWinnerId,
      targetPlayerId: loserId,
      systemId: combat.systemId,
      combatType: combat.type,
    });

    // Fire combat_loss trigger for loser (if any abilities use it)
    const lossTriggers = checkAbilityTriggers(state, 'combat_loss', {
      playerId: loserId,
      targetPlayerId: actualWinnerId,
      systemId: combat.systemId,
      combatType: combat.type,
    });

    // TODO: Process triggered abilities (Nekro tech copy, etc.)
    // For now, log that triggers were detected
    if (winTriggers.length > 0) {
      console.log('Combat win triggers:', winTriggers.map(t => t.abilityName));
    }
    if (lossTriggers.length > 0) {
      console.log('Combat loss triggers:', lossTriggers.map(t => t.abilityName));
    }
  }

  return {
    success: true,
    triggeredEvents: ['combat_ended', ...(actualWinnerId ? ['combat_win'] : [])],
    data: { winnerId: actualWinnerId, loserId },
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
