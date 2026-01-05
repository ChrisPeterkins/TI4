import type {
  GameState,
  CombatInstance,
  CombatState,
  AssignHitsAction,
  AnnounceRetreatAction,
  DiceRoll,
  HexCoord,
  TimingTrigger,
  PlayerState,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { findTileAtPosition } from '../utils/hex.js';
import { isShipType, isGroundUnit, getUnitStats } from '../utils/units.js';
import { logAbilityTriggered } from '../utils/game-log.js';
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
 * NEKRO TECHNOLOGICAL SINGULARITY
 * "Once per combat, after 1 of your opponent's units is destroyed,
 * you may gain 1 technology that is owned by that player."
 *
 * Check if Nekro can trigger this ability and set up pending tech gain.
 */
function checkTechnologicalSingularity(
  state: GameState,
  combat: CombatInstance,
  destroyedUnitOwnerId: string
): void {
  // Skip if already used this combat
  if (combat.technologicalSingularityUsed) return;

  // Find if either combatant is Nekro
  const nekroPlayer = state.players.find(
    p => p.faction === 'nekro' &&
         (p.id === combat.attackerId || p.id === combat.defenderId)
  );

  if (!nekroPlayer) return;

  // Nekro can only gain tech from the opponent, not from their own destroyed units
  if (destroyedUnitOwnerId === nekroPlayer.id) return;

  // The opponent must be in this combat
  if (destroyedUnitOwnerId !== combat.attackerId &&
      destroyedUnitOwnerId !== combat.defenderId) return;

  // Check if opponent has any technologies to copy
  const opponent = state.players.find(p => p.id === destroyedUnitOwnerId);
  if (!opponent || opponent.technologies.length === 0) return;

  // Set up pending tech gain - Nekro gets to choose
  combat.pendingTechGain = {
    nekroPlayerId: nekroPlayer.id,
    opponentPlayerId: destroyedUnitOwnerId,
  };

  logAbilityTriggered(state, nekroPlayer.id, 'Technological Singularity');
}

/**
 * Handle Nekro gaining a technology via Technological Singularity.
 * Called when Nekro selects which tech to gain from their opponent.
 */
export function handleTechnologicalSingularityGain(
  state: GameState,
  nekroPlayerId: string,
  techId: string,
  useAssimilator?: 'x' | 'y'
): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  if (!combat.pendingTechGain) {
    return { success: false, error: 'No pending tech gain' };
  }

  if (combat.pendingTechGain.nekroPlayerId !== nekroPlayerId) {
    return { success: false, error: 'Not your tech gain choice' };
  }

  const nekroPlayer = state.players.find(p => p.id === nekroPlayerId);
  if (!nekroPlayer) {
    return { success: false, error: 'Player not found' };
  }

  const opponentPlayerId = combat.pendingTechGain.opponentPlayerId;
  const opponent = state.players.find(p => p.id === opponentPlayerId);
  if (!opponent) {
    return { success: false, error: 'Opponent not found' };
  }

  // Validate opponent has this tech
  if (!opponent.technologies.includes(techId)) {
    return { success: false, error: 'Opponent does not have this technology' };
  }

  // Import dynamically to avoid circular dependency
  const { technologies } = require('@ti4/game-data');
  const techData = technologies[techId];

  if (!techData) {
    return { success: false, error: 'Unknown technology' };
  }

  // If using assimilator, must be a faction tech
  if (useAssimilator) {
    if (!techData.factionId) {
      return { success: false, error: 'Valefar Assimilator can only target faction technologies' };
    }

    // Use the assimilator handler
    const { placeAssimilatorToken } = require('./technology.js');
    const result = placeAssimilatorToken(
      state,
      nekroPlayerId,
      techId,
      opponentPlayerId,
      useAssimilator
    );

    if (!result.success) {
      return result;
    }
  } else {
    // Direct tech gain - check if Nekro already has it
    if (nekroPlayer.technologies.includes(techId)) {
      return { success: false, error: 'Nekro already has this technology' };
    }

    // Can't gain faction techs directly (must use assimilator)
    if (techData.factionId && techData.factionId !== 'nekro') {
      return {
        success: false,
        error: 'Cannot gain faction technologies directly - use Valefar Assimilator',
      };
    }

    // Add the technology
    nekroPlayer.technologies.push(techId);
  }

  // Mark ability as used for this combat
  combat.technologicalSingularityUsed = true;
  combat.pendingTechGain = undefined;

  return {
    success: true,
    triggeredEvents: ['technological_singularity_resolved'],
    data: {
      nekroPlayerId,
      techId,
      techName: techData.name,
      usedAssimilator: useAssimilator,
    },
  };
}

/**
 * Skip Technological Singularity - Nekro declines to gain a tech.
 */
export function handleSkipTechnologicalSingularity(
  state: GameState,
  nekroPlayerId: string
): HandlerResult {
  const combat = state.activeCombat;
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  if (!combat.pendingTechGain) {
    return { success: false, error: 'No pending tech gain' };
  }

  if (combat.pendingTechGain.nekroPlayerId !== nekroPlayerId) {
    return { success: false, error: 'Not your tech gain choice' };
  }

  // Clear the pending choice
  combat.pendingTechGain = undefined;

  return {
    success: true,
    triggeredEvents: ['technological_singularity_skipped'],
  };
}

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

      // NEKRO TECHNOLOGICAL SINGULARITY: After opponent's unit destroyed, gain tech
      checkTechnologicalSingularity(state, combat, action.playerId);
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

    // L1Z1X HARROW: At the end of each round of ground combat, ships may use Bombardment
    // Only triggers when L1Z1X is the attacker (active player)
    if (combat.type === 'ground') {
      const harrowResult = checkAndApplyHarrow(state, combat, triggeredEvents);
      if (harrowResult && harrowResult.harrowHits > 0) {
        // Harrow hits need to be assigned to defender ground forces
        // This is handled as automatic hits against the defender
        triggeredEvents.push('harrow_triggered');
      }
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
 * Check and apply L1Z1X Harrow ability
 * At the end of each round of ground combat, L1Z1X ships may use Bombardment
 * against opponent's ground forces on the planet.
 *
 * IMPORTANT: Only the ACTIVE player (attacker) can use Harrow
 */
function checkAndApplyHarrow(
  state: GameState,
  combat: CombatInstance,
  triggeredEvents: string[]
): { harrowHits: number } | null {
  const attacker = state.players.find(p => p.id === combat.attackerId);
  if (!attacker || attacker.faction !== 'l1z1x') {
    return null;
  }

  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) return null;

  const planet = tile.planets.find(p => p.planetId === combat.planetId);
  if (!planet) return null;

  // Check if defender has Planetary Shield (blocks bombardment unless 2RAM unlocked)
  const defender = state.players.find(p => p.id === combat.defenderId);
  const hasL1z1xCommander = attacker.leaders?.commander?.unlocked ?? false;

  // 2RAM Commander: "Units that have Planetary Shield do not prevent you from using Bombardment"
  if (!hasL1z1xCommander) {
    const hasShield = planet.units.some(u =>
      u.ownerId === combat.defenderId && (u.type === 'pds' || u.type === 'mech')
    );
    // Check for Magen Defense Grid on defender's PDS
    const defenderHasMagen = defender?.technologies?.includes('magen_defense_grid');
    if (hasShield || defenderHasMagen) {
      // Planetary Shield blocks Harrow bombardment
      return null;
    }
  }

  // Get all ships with Bombardment in the system
  const bombardmentUnits = tile.units.filter(u => {
    if (u.ownerId !== combat.attackerId) return false;
    const stats = getUnitStats(u.type, attacker);
    return stats.bombardment !== undefined;
  });

  if (bombardmentUnits.length === 0) return null;

  // Roll bombardment dice for each unit
  let totalHits = 0;
  const rolls: DiceRoll[] = [];

  for (const unit of bombardmentUnits) {
    const stats = getUnitStats(unit.type, attacker);
    if (!stats.bombardment) continue;

    const diceCount = stats.bombardment.count || 1;
    const hitValue = stats.bombardment.value;

    for (let i = 0; i < diceCount; i++) {
      const roll = Math.floor(Math.random() * 10) + 1;
      const isHit = roll >= hitValue;
      rolls.push({
        roll,
        combatValue: hitValue,
        hit: isHit,
        unitId: unit.id,
        unitType: unit.type,
        modifiers: [],
      });
      if (isHit) totalHits++;
    }
  }

  if (totalHits > 0) {
    // Apply hits to defender's ground forces
    const defenderGroundForces = planet.units
      .filter(u => u.ownerId === combat.defenderId && isGroundUnit(u.type))
      .sort((a, b) => {
        // Priority: infantry first, then mechs
        if (a.type === 'infantry' && b.type !== 'infantry') return -1;
        if (b.type === 'infantry' && a.type !== 'infantry') return 1;
        return 0;
      });

    let hitsAssigned = 0;
    for (const unit of defenderGroundForces) {
      if (hitsAssigned >= totalHits) break;

      // Mechs can sustain damage
      if (unit.type === 'mech' && !unit.damaged && canUnitSustainDamage(unit, defender!)) {
        damageUnit(state, unit.id);
        hitsAssigned++;
      } else {
        removeUnit(state, unit.id);
        // Remove from combat defender units
        const idx = combat.defenderUnits.indexOf(unit.id);
        if (idx !== -1) combat.defenderUnits.splice(idx, 1);
        hitsAssigned++;
      }
    }

    // Log the harrow
    logAbilityTriggered(state, combat.attackerId, 'Harrow');
  }

  return { harrowHits: totalHits };
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
