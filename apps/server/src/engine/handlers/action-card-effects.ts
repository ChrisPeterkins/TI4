/**
 * Action Card Effects Handler
 *
 * Implements the actual effects of all action cards. This file is called
 * after timing window resolution to apply card effects that weren't cancelled.
 *
 * Architecture:
 * 1. Player plays card → timing window opens (others can Sabotage)
 * 2. Window resolves → this handler applies effects (if not cancelled)
 */

import type {
  GameState,
  PlayerState,
  UnitInstance,
  UnitType,
  HexCoord,
  MapTile,
  PlanetInstance,
  ActionCardTargets,
  CombatInstance,
} from '@ti4/shared';
import { getCardBaseName, ACTION_CARDS_BY_ID } from '@ti4/shared';
import { systems, units } from '@ti4/game-data';
import type { HandlerResult } from '../game-machine.js';
import { v4 as uuidv4 } from 'uuid';
import { handleDrawActionCards } from './action-cards.js';

export type EffectHandler = (
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
) => HandlerResult;

// =============================================================================
// EFFECT REGISTRY
// =============================================================================

/**
 * Maps card base names to their effect handlers
 */
const EFFECT_HANDLERS: Record<string, EffectHandler> = {
  // Sabotage is handled specially in timing-windows.ts (cancels cards)
  sabotage: () => ({ success: true, triggeredEvents: [] }),

  // =========================================================================
  // COMBAT CARDS
  // =========================================================================

  // Hit cancellation
  shields_holding: applyShieldsHolding,

  // Combat bonuses
  morale_boost: applyMoraleBoost,

  // Direct damage
  direct_hit: applyDirectHit,
  lucky_shot: applyLuckyShot,

  // Retreat
  skilled_retreat: applySkilledRetreat,

  // Repair
  emergency_repairs: applyEmergencyRepairs,

  // Ground combat
  fire_team: applyFireTeam,
  bunker: applyBunker,
  blitz: applyBlitz,
  courageous_to_the_end: applyCourageousToTheEnd,
  parley: applyParley,
  infiltrate: applyInfiltrate,

  // =========================================================================
  // TACTICAL CARDS
  // =========================================================================

  flank_speed: applyFlankSpeed,
  war_machine: applyWarMachine,
  ghost_ship: applyGhostShip,
  frontline_deployment: applyFrontlineDeployment,
  in_the_silence_of_space: applyInTheSilenceOfSpace,
  unexpected_action: applyUnexpectedAction,
  counterstroke: applyCounterstroke,

  // =========================================================================
  // COMPONENT ACTIONS
  // =========================================================================

  mining_initiative: applyMiningInitiative,
  industrial_initiative: applyIndustrialInitiative,
  summit: applySummit,
  focused_research: applyFocusedResearch,
  ghost_squad: applyGhostSquad,
  rise_of_a_messiah: applyRiseOfAMessiah,
  war_effort: applyWarEffort,
  fighter_conscription: applyFighterConscription,
  cripple_defenses: applyCrippleDefenses,
  reactor_meltdown: applyReactorMeltdown,
  plague: applyPlague,
  unstable_planet: applyUnstablePlanet,
  uprising: applyUprising,
  signal_jamming: applySignalJamming,
  insubordination: applyInsubordination,
  spy: applySpy,
  tactical_bombardment: applyTacticalBombardment,
  master_plan: applyMasterPlan,
  probe: applyProbe,
  harness_energy: applyHarnessEnergy,

  // =========================================================================
  // AGENDA CARDS
  // =========================================================================

  distinguished_councilor: applyDistinguishedCouncilor,
  bribery: applyBribery,
  veto: applyVeto,
  confusing_legal_text: applyConfusingLegalText,
  repeal_law: applyRepealLaw,
  reparations: applyReparations,
  sanctions: applySanctions,
  political_stability: applyPoliticalStability,
  public_disgrace: applyPublicDisgrace,

  // Riders
  imperial_rider: applyRider,
  construction_rider: applyRider,
  diplomacy_rider: applyRider,
  leadership_rider: applyRider,
  politics_rider: applyRider,
  technology_rider: applyRider,
  trade_rider: applyRider,
  warfare_rider: applyRider,

  // =========================================================================
  // SPECIAL TIMING CARDS
  // =========================================================================

  disable: applyDisable,
  scramble_frequency: applyScrambleFrequency,
  maneuvering_jets: applyManeuveringJets,
  experimental_battlestation: applyExperimentalBattlestation,
  fighter_prototype: applyFighterPrototype,
  solar_flare: applySolarFlare,

  // =========================================================================
  // STRATEGY PHASE CARDS
  // =========================================================================

  tech_sabotage: applyTechSabotage,
  resist_strategy: applyResistStrategy,

  // =========================================================================
  // MISCELLANEOUS
  // =========================================================================

  reveal_prototype: applyRevealPrototype,

  // =========================================================================
  // POK ACTION CARDS
  // =========================================================================

  waylay: applyWaylay,
  decoy_operation: applyDecoyOperation,
  intercept: applyIntercept,
  rally: applyRally,
  seize_artifact: applySeizeArtifact,
  ancient_burial_sites: applyAncientBurialSites,
  salvage: applySalvage,
  deadly_plot: applyDeadlyPlot,
  emergency_meeting: applyEmergencyMeeting,
  hack_election: applyHackElection,
  boarding_party: applyBoardingParty,
  scuttle: applyScuttle,
  forward_supply_base: applyForwardSupplyBase,
  coup_detat: applyCoupDetat,
  sanction_rider: applyRider,
  keleres_rider: applyRider,
};

// =============================================================================
// MAIN ROUTER
// =============================================================================

/**
 * Apply the effect of an action card after timing window resolution
 *
 * @param state - Current game state
 * @param cardId - The full card ID (e.g., 'shields_holding_1')
 * @param playerId - The player who played the card
 * @param targets - Optional targets for the card effect
 * @returns HandlerResult with success/error and triggered events
 */
export function applyCardEffect(
  state: GameState,
  cardId: string,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  const baseName = getCardBaseName(cardId);

  const handler = EFFECT_HANDLERS[baseName];
  if (!handler) {
    console.warn(`No effect handler for card: ${cardId} (base: ${baseName})`);
    // Return success - card was played, just no special effect
    return { success: true, triggeredEvents: [] };
  }

  try {
    return handler(state, playerId, targets);
  } catch (error) {
    console.error(`Error applying effect for ${cardId}:`, error);
    return {
      success: false,
      error: `Failed to apply effect: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function findPlayer(state: GameState, playerId: string): PlayerState | undefined {
  return state.players.find(p => p.id === playerId);
}

function findTile(state: GameState, position: HexCoord): MapTile | undefined {
  return state.map.tiles.find(t => t.position.q === position.q && t.position.r === position.r);
}

function findTileById(state: GameState, tileId: string): MapTile | undefined {
  return state.map.tiles.find(t => t.id === tileId);
}

function findPlanet(state: GameState, planetId: string): { tile: MapTile; planet: PlanetInstance } | undefined {
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.planetId === planetId || planet.id === planetId) {
        return { tile, planet };
      }
    }
  }
  return undefined;
}

/**
 * Look up planet data from static game data
 */
function getPlanetData(planetId: string): { resources: number; influence: number; trait?: string } | null {
  // Search through all systems for the planet
  for (const system of Object.values(systems)) {
    const planet = system.planets.find((p: { id: string }) => p.id === planetId);
    if (planet) {
      return { resources: planet.resources, influence: planet.influence, trait: planet.trait };
    }
  }
  return null;
}

function findUnit(state: GameState, unitId: string): { tile: MapTile; unit: UnitInstance; planetId?: string } | undefined {
  for (const tile of state.map.tiles) {
    // Check space units
    const spaceUnit = tile.units.find(u => u.id === unitId);
    if (spaceUnit) {
      return { tile, unit: spaceUnit };
    }

    // Check planet units
    for (const planet of tile.planets) {
      const planetUnit = planet.units.find(u => u.id === unitId);
      if (planetUnit) {
        return { tile, unit: planetUnit, planetId: planet.planetId };
      }
    }
  }
  return undefined;
}

function destroyUnit(state: GameState, unitId: string): boolean {
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

function placeUnit(
  state: GameState,
  playerId: string,
  unitType: UnitType,
  location: { tileId?: string; position?: HexCoord; planetId?: string }
): UnitInstance | null {
  let tile: MapTile | undefined;

  if (location.tileId) {
    tile = findTileById(state, location.tileId);
  } else if (location.position) {
    tile = findTile(state, location.position);
  } else if (location.planetId) {
    const result = findPlanet(state, location.planetId);
    tile = result?.tile;
  }

  if (!tile) {
    return null;
  }

  const newUnit: UnitInstance = {
    id: uuidv4(),
    type: unitType,
    ownerId: playerId,
    damaged: false,
  };

  if (location.planetId) {
    const planet = tile.planets.find(p => p.planetId === location.planetId || p.id === location.planetId);
    if (planet) {
      newUnit.planetId = planet.planetId;
      planet.units.push(newUnit);
    } else {
      return null;
    }
  } else {
    tile.units.push(newUnit);
  }

  return newUnit;
}

function getPlayerControlledPlanets(state: GameState, playerId: string): { tile: MapTile; planet: PlanetInstance }[] {
  const result: { tile: MapTile; planet: PlanetInstance }[] = [];
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.controlledBy === playerId) {
        result.push({ tile, planet });
      }
    }
  }
  return result;
}

function getSystemsWithPlayerShips(state: GameState, playerId: string): MapTile[] {
  return state.map.tiles.filter(tile =>
    tile.units.some(u => u.ownerId === playerId && isShip(u.type))
  );
}

function isShip(unitType: UnitType): boolean {
  return ['war_sun', 'dreadnought', 'flagship', 'carrier', 'cruiser', 'destroyer', 'fighter'].includes(unitType);
}

function isGroundForce(unitType: UnitType): boolean {
  return ['infantry', 'mech'].includes(unitType);
}

function getActiveCombat(state: GameState): CombatInstance | null {
  return state.activeCombat;
}

function ensureCombatModifiers(state: GameState, playerId: string): void {
  const combat = state.activeCombat;
  if (!combat) return;

  if (!combat.temporaryModifiers) {
    combat.temporaryModifiers = {};
  }
  if (!combat.temporaryModifiers[playerId]) {
    combat.temporaryModifiers[playerId] = {};
  }
}

function ensureTacticalModifiers(state: GameState, playerId: string): void {
  if (!state.tacticalModifiers) {
    state.tacticalModifiers = {};
  }
  if (!state.tacticalModifiers[playerId]) {
    state.tacticalModifiers[playerId] = {};
  }
}

// =============================================================================
// COMBAT CARD EFFECTS
// =============================================================================

/**
 * Shields Holding: Cancel up to 2 hits during space combat
 */
function applyShieldsHolding(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat || combat.type !== 'space') {
    return { success: false, error: 'No active space combat' };
  }

  const isAttacker = playerId === combat.attackerId;
  const hitsKey = isAttacker ? 'defender' : 'attacker';
  const hitsToCancel = Math.min(targets?.count ?? 2, combat.pendingHits[hitsKey]);

  combat.pendingHits[hitsKey] = Math.max(0, combat.pendingHits[hitsKey] - hitsToCancel);

  return {
    success: true,
    triggeredEvents: ['hits_cancelled'],
    data: { cancelled: hitsToCancel, playerId },
  };
}

/**
 * Morale Boost: +1 to combat rolls this round
 */
function applyMoraleBoost(
  state: GameState,
  playerId: string
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  ensureCombatModifiers(state, playerId);
  const mods = combat.temporaryModifiers![playerId];
  mods.combatBonus = (mods.combatBonus || 0) + 1;

  return {
    success: true,
    triggeredEvents: ['combat_modifier_applied'],
    data: { modifier: '+1 combat', playerId },
  };
}

/**
 * Direct Hit: Destroy a ship that used sustain damage
 */
function applyDirectHit(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.sustainedUnitId) {
    return { success: false, error: 'Must specify the ship that used sustain damage' };
  }

  const unitData = findUnit(state, targets.sustainedUnitId);
  if (!unitData) {
    return { success: false, error: 'Target ship not found' };
  }

  // Verify it's an enemy ship
  if (unitData.unit.ownerId === playerId) {
    return { success: false, error: 'Cannot Direct Hit your own ship' };
  }

  // Verify it's a ship (not ground force)
  if (!isShip(unitData.unit.type)) {
    return { success: false, error: 'Direct Hit only works on ships' };
  }

  const destroyed = destroyUnit(state, targets.sustainedUnitId);
  if (!destroyed) {
    return { success: false, error: 'Failed to destroy unit' };
  }

  return {
    success: true,
    triggeredEvents: ['unit_destroyed', 'direct_hit_applied'],
    data: {
      unitId: targets.sustainedUnitId,
      unitType: unitData.unit.type,
      ownerId: unitData.unit.ownerId,
    },
  };
}

/**
 * Lucky Shot: Destroy an enemy dreadnought, cruiser, or destroyer
 */
function applyLuckyShot(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.unitIds || targets.unitIds.length === 0) {
    return { success: false, error: 'Must select a ship to destroy' };
  }

  const unitId = targets.unitIds[0];
  const unitData = findUnit(state, unitId);
  if (!unitData) {
    return { success: false, error: 'Target ship not found' };
  }

  // Verify it's an enemy ship
  if (unitData.unit.ownerId === playerId) {
    return { success: false, error: 'Cannot Lucky Shot your own ship' };
  }

  // Verify it's dreadnought, cruiser, or destroyer
  if (!['dreadnought', 'cruiser', 'destroyer'].includes(unitData.unit.type)) {
    return { success: false, error: 'Lucky Shot only works on dreadnought, cruiser, or destroyer' };
  }

  // Verify player has units in the system
  const hasUnitsInSystem = unitData.tile.units.some(u => u.ownerId === playerId) ||
    unitData.tile.planets.some(p => p.units.some(u => u.ownerId === playerId));

  if (!hasUnitsInSystem) {
    return { success: false, error: 'Must have units in the system' };
  }

  const destroyed = destroyUnit(state, unitId);
  if (!destroyed) {
    return { success: false, error: 'Failed to destroy unit' };
  }

  return {
    success: true,
    triggeredEvents: ['unit_destroyed'],
    data: {
      unitId,
      unitType: unitData.unit.type,
      ownerId: unitData.unit.ownerId,
    },
  };
}

/**
 * Skilled Retreat: Move ships to adjacent system and end combat
 */
function applySkilledRetreat(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  if (!targets?.destinationSystem) {
    return { success: false, error: 'Must specify retreat destination' };
  }

  const destTile = findTile(state, targets.destinationSystem);
  if (!destTile) {
    return { success: false, error: 'Destination system not found' };
  }

  // Verify destination has no enemy ships
  const hasEnemyShips = destTile.units.some(u => u.ownerId !== playerId && isShip(u.type));
  if (hasEnemyShips) {
    return { success: false, error: 'Destination contains enemy ships' };
  }

  // Find current system and move ships
  const currentTile = findTileById(state, combat.systemId);
  if (!currentTile) {
    return { success: false, error: 'Combat system not found' };
  }

  // Move all player ships to destination
  const shipsToMove = currentTile.units.filter(u => u.ownerId === playerId && isShip(u.type));
  for (const ship of shipsToMove) {
    const idx = currentTile.units.indexOf(ship);
    if (idx !== -1) {
      currentTile.units.splice(idx, 1);
      destTile.units.push(ship);
    }
  }

  // End combat
  combat.state = 'combat_complete';

  return {
    success: true,
    triggeredEvents: ['retreat_completed', 'combat_ended'],
    data: {
      playerId,
      shipsRetreated: shipsToMove.length,
      destination: targets.destinationSystem,
    },
  };
}

/**
 * Emergency Repairs: Repair all sustained damage
 */
function applyEmergencyRepairs(
  state: GameState,
  playerId: string
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  const tile = findTileById(state, combat.systemId);
  if (!tile) {
    return { success: false, error: 'Combat system not found' };
  }

  let repairedCount = 0;

  // Repair space units
  for (const unit of tile.units) {
    if (unit.ownerId === playerId && unit.damaged) {
      unit.damaged = false;
      repairedCount++;
    }
  }

  // Repair ground units if ground combat
  if (combat.type === 'ground' && combat.planetId) {
    const planet = tile.planets.find(p => p.planetId === combat.planetId);
    if (planet) {
      for (const unit of planet.units) {
        if (unit.ownerId === playerId && unit.damaged) {
          unit.damaged = false;
          repairedCount++;
        }
      }
    }
  }

  return {
    success: true,
    triggeredEvents: ['units_repaired'],
    data: { playerId, repairedCount },
  };
}

/**
 * Fire Team: Reroll ground combat dice (store modifier for reroll)
 */
function applyFireTeam(
  state: GameState,
  playerId: string
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat || combat.type !== 'ground') {
    return { success: false, error: 'No active ground combat' };
  }

  ensureCombatModifiers(state, playerId);
  combat.temporaryModifiers![playerId].rerollsAvailable = 999; // Unlimited rerolls

  return {
    success: true,
    triggeredEvents: ['combat_modifier_applied'],
    data: { modifier: 'reroll available', playerId },
  };
}

/**
 * Bunker: -4 to opponent's ground combat rolls
 */
function applyBunker(
  state: GameState,
  playerId: string
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat || combat.type !== 'ground') {
    return { success: false, error: 'No active ground combat' };
  }

  const opponentId = playerId === combat.attackerId ? combat.defenderId : combat.attackerId;
  ensureCombatModifiers(state, opponentId);
  combat.temporaryModifiers![opponentId].combatPenalty =
    (combat.temporaryModifiers![opponentId].combatPenalty || 0) + 4;

  return {
    success: true,
    triggeredEvents: ['combat_modifier_applied'],
    data: { modifier: '-4 to opponent', playerId, opponentId },
  };
}

/**
 * Blitz: Extra ground combat die each round
 */
function applyBlitz(
  state: GameState,
  playerId: string
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat || combat.type !== 'ground') {
    return { success: false, error: 'No active ground combat' };
  }

  ensureCombatModifiers(state, playerId);
  combat.temporaryModifiers![playerId].extraDice =
    (combat.temporaryModifiers![playerId].extraDice || 0) + 1;

  return {
    success: true,
    triggeredEvents: ['combat_modifier_applied'],
    data: { modifier: '+1 die per ground force', playerId },
  };
}

/**
 * Courageous to the End: Roll dice when ship destroyed, produce hits
 */
function applyCourageousToTheEnd(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat || combat.type !== 'space') {
    return { success: false, error: 'No active space combat' };
  }

  if (!targets?.sustainedUnitId) {
    return { success: false, error: 'Must specify the destroyed ship' };
  }

  // Roll 2 dice
  const die1 = Math.floor(Math.random() * 10) + 1;
  const die2 = Math.floor(Math.random() * 10) + 1;

  // TODO: Get the combat value of the destroyed ship
  // For now, assume a default combat value of 7
  const combatValue = 7;

  const hits = [die1, die2].filter(d => d >= combatValue).length;

  // Apply hits to opponent
  const isAttacker = playerId === combat.attackerId;
  const opponentHitsKey = isAttacker ? 'attacker' : 'defender';
  combat.pendingHits[opponentHitsKey] += hits;

  return {
    success: true,
    triggeredEvents: ['courageous_to_the_end'],
    data: {
      playerId,
      rolls: [die1, die2],
      combatValue,
      hits,
    },
  };
}

/**
 * Parley: Return invading units to reinforcements, gain TG
 */
function applyParley(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  // This is complex - involves returning committed ground forces
  // The targets should include the planet being invaded

  if (!targets?.planetId) {
    return { success: false, error: 'Must specify planet being invaded' };
  }

  const result = findPlanet(state, targets.planetId);
  if (!result) {
    return { success: false, error: 'Planet not found' };
  }

  // Find invading player (not the defender/playerId)
  // Remove their committed ground forces (from invasion tracking)
  const invasion = state.invasionPhase;
  if (!invasion) {
    return { success: false, error: 'No active invasion' };
  }

  const committedUnits = invasion.groundForcesCommitted[targets.planetId] || [];

  // Remove those units from the planet
  for (const unitId of committedUnits) {
    destroyUnit(state, unitId); // Returns to reinforcements
  }

  // Clear the committed forces
  invasion.groundForcesCommitted[targets.planetId] = [];

  // Give defender 1 trade good
  const player = findPlayer(state, playerId);
  if (player) {
    player.tradeGoods += 1;
  }

  return {
    success: true,
    triggeredEvents: ['parley_applied'],
    data: {
      playerId,
      unitsReturned: committedUnits.length,
      tradeGoodsGained: 1,
    },
  };
}

/**
 * Infiltrate: Remove up to 2 infantry from combat participation
 */
function applyInfiltrate(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat || combat.type !== 'ground') {
    return { success: false, error: 'No active ground combat' };
  }

  if (!targets?.unitIds || targets.unitIds.length === 0) {
    return { success: false, error: 'Must select infantry to infiltrate' };
  }

  if (targets.unitIds.length > 2) {
    return { success: false, error: 'Can only infiltrate up to 2 infantry' };
  }

  ensureCombatModifiers(state, playerId);
  combat.temporaryModifiers![playerId].infiltratedUnits = targets.unitIds;

  return {
    success: true,
    triggeredEvents: ['infiltrate_applied'],
    data: { playerId, infiltratedCount: targets.unitIds.length },
  };
}

// =============================================================================
// TACTICAL CARD EFFECTS
// =============================================================================

/**
 * Flank Speed: +1 movement this tactical action
 */
function applyFlankSpeed(
  state: GameState,
  playerId: string
): HandlerResult {
  ensureTacticalModifiers(state, playerId);
  state.tacticalModifiers![playerId].movementBonus =
    (state.tacticalModifiers![playerId].movementBonus || 0) + 1;

  return {
    success: true,
    triggeredEvents: ['tactical_modifier_applied'],
    data: { modifier: '+1 movement', playerId },
  };
}

/**
 * War Machine: +4 production value
 */
function applyWarMachine(
  state: GameState,
  playerId: string
): HandlerResult {
  ensureTacticalModifiers(state, playerId);
  state.tacticalModifiers![playerId].productionBonus =
    (state.tacticalModifiers![playerId].productionBonus || 0) + 4;

  return {
    success: true,
    triggeredEvents: ['tactical_modifier_applied'],
    data: { modifier: '+4 production', playerId },
  };
}

/**
 * Ghost Ship: Place destroyer in activated system
 */
function applyGhostShip(
  state: GameState,
  playerId: string
): HandlerResult {
  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  const tile = findTile(state, state.activatedSystem);
  if (!tile) {
    return { success: false, error: 'Activated system not found' };
  }

  const unit = placeUnit(state, playerId, 'destroyer', { position: state.activatedSystem });
  if (!unit) {
    return { success: false, error: 'Failed to place destroyer' };
  }

  return {
    success: true,
    triggeredEvents: ['unit_placed'],
    data: { unitType: 'destroyer', playerId, systemId: tile.id },
  };
}

/**
 * Frontline Deployment: Place 3 infantry on planet in activated system
 */
function applyFrontlineDeployment(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.planetId) {
    return { success: false, error: 'Must select a planet' };
  }

  const result = findPlanet(state, targets.planetId);
  if (!result) {
    return { success: false, error: 'Planet not found' };
  }

  // Verify planet is in activated system
  if (state.activatedSystem &&
      (result.tile.position.q !== state.activatedSystem.q ||
       result.tile.position.r !== state.activatedSystem.r)) {
    return { success: false, error: 'Planet must be in activated system' };
  }

  // Verify player controls planet
  if (result.planet.controlledBy !== playerId) {
    return { success: false, error: 'Must select a planet you control' };
  }

  // Place 3 infantry
  for (let i = 0; i < 3; i++) {
    placeUnit(state, playerId, 'infantry', { planetId: targets.planetId });
  }

  return {
    success: true,
    triggeredEvents: ['units_placed'],
    data: { unitType: 'infantry', count: 3, playerId, planetId: targets.planetId },
  };
}

/**
 * In the Silence of Space: Can pass through enemy ships
 */
function applyInTheSilenceOfSpace(
  state: GameState,
  playerId: string
): HandlerResult {
  ensureTacticalModifiers(state, playerId);
  state.tacticalModifiers![playerId].canPassThroughShips = true;

  return {
    success: true,
    triggeredEvents: ['tactical_modifier_applied'],
    data: { modifier: 'pass through ships', playerId },
  };
}

/**
 * Unexpected Action: Remove command token from system
 */
function applyUnexpectedAction(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.systemPosition) {
    return { success: false, error: 'Must select a system' };
  }

  const tile = findTile(state, targets.systemPosition);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  const tokenIndex = tile.commandTokens.indexOf(playerId);
  if (tokenIndex === -1) {
    return { success: false, error: 'No command token in that system' };
  }

  tile.commandTokens.splice(tokenIndex, 1);

  // Return token to reinforcements (tactics pool)
  const player = findPlayer(state, playerId);
  if (player) {
    player.commandTokens.tactics += 1;
  }

  return {
    success: true,
    triggeredEvents: ['command_token_removed'],
    data: { playerId, systemId: tile.id },
  };
}

/**
 * Counterstroke: Remove command token from board, add to fleet pool
 */
function applyCounterstroke(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.systemPosition) {
    return { success: false, error: 'Must select a system with your command token' };
  }

  const tile = findTile(state, targets.systemPosition);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  const tokenIndex = tile.commandTokens.indexOf(playerId);
  if (tokenIndex === -1) {
    return { success: false, error: 'No command token in that system' };
  }

  tile.commandTokens.splice(tokenIndex, 1);

  // Add to fleet pool
  const player = findPlayer(state, playerId);
  if (player) {
    player.commandTokens.fleet += 1;
  }

  return {
    success: true,
    triggeredEvents: ['command_token_moved'],
    data: { playerId, from: 'board', to: 'fleet' },
  };
}

// =============================================================================
// COMPONENT ACTION EFFECTS
// =============================================================================

/**
 * Mining Initiative: Gain TG equal to planet's resource value
 */
function applyMiningInitiative(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.planetId) {
    return { success: false, error: 'Must select a planet' };
  }

  const result = findPlanet(state, targets.planetId);
  if (!result || result.planet.controlledBy !== playerId) {
    return { success: false, error: 'Must select a planet you control' };
  }

  // Get planet's resource value from static data
  const planetData = getPlanetData(result.planet.planetId);
  const resources = planetData?.resources || 0;

  const player = findPlayer(state, playerId);
  if (player) {
    player.tradeGoods += resources;
  }

  return {
    success: true,
    triggeredEvents: ['trade_goods_gained'],
    data: { playerId, amount: resources, source: 'mining_initiative' },
  };
}

/**
 * Industrial Initiative: Gain 1 TG per industrial planet
 */
function applyIndustrialInitiative(
  state: GameState,
  playerId: string
): HandlerResult {
  const controlledPlanets = getPlayerControlledPlanets(state, playerId);

  let industrialCount = 0;
  for (const { planet } of controlledPlanets) {
    const planetData = getPlanetData(planet.planetId);
    if (planetData?.trait === 'industrial') {
      industrialCount++;
    }
  }

  const player = findPlayer(state, playerId);
  if (player) {
    player.tradeGoods += industrialCount;
  }

  return {
    success: true,
    triggeredEvents: ['trade_goods_gained'],
    data: { playerId, amount: industrialCount, source: 'industrial_initiative' },
  };
}

/**
 * Summit: Draw 2 action cards
 */
function applySummit(
  state: GameState,
  playerId: string
): HandlerResult {
  return handleDrawActionCards(state, playerId, 2);
}

/**
 * Focused Research: Spend 4 TG to research tech
 */
function applyFocusedResearch(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  const player = findPlayer(state, playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (player.tradeGoods < 4) {
    return { success: false, error: 'Not enough trade goods (need 4)' };
  }

  if (!targets?.techId) {
    return { success: false, error: 'Must select a technology to research' };
  }

  // TODO: Validate tech prerequisites
  player.tradeGoods -= 4;
  player.technologies.push(targets.techId);

  return {
    success: true,
    triggeredEvents: ['technology_researched', 'trade_goods_spent'],
    data: { playerId, techId: targets.techId, cost: 4 },
  };
}

/**
 * Ghost Squad: Place infantry on planet with no structures
 */
function applyGhostSquad(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.planetId) {
    return { success: false, error: 'Must select a planet' };
  }

  const result = findPlanet(state, targets.planetId);
  if (!result) {
    return { success: false, error: 'Planet not found' };
  }

  // Check if planet has structures
  const hasStructures = result.planet.units.some(u =>
    ['pds', 'space_dock'].includes(u.type)
  );

  if (hasStructures) {
    return { success: false, error: 'Planet must not have structures' };
  }

  // Check it's not Mecatol Rex
  if (result.planet.planetId === 'mecatol_rex') {
    return { success: false, error: 'Cannot place on Mecatol Rex' };
  }

  const unit = placeUnit(state, playerId, 'infantry', { planetId: targets.planetId });
  if (!unit) {
    return { success: false, error: 'Failed to place infantry' };
  }

  return {
    success: true,
    triggeredEvents: ['unit_placed'],
    data: { unitType: 'infantry', playerId, planetId: targets.planetId },
  };
}

/**
 * Rise of a Messiah: Place 1 infantry on each planet you control
 */
function applyRiseOfAMessiah(
  state: GameState,
  playerId: string
): HandlerResult {
  const controlledPlanets = getPlayerControlledPlanets(state, playerId);
  let placedCount = 0;

  for (const { planet } of controlledPlanets) {
    const unit = placeUnit(state, playerId, 'infantry', { planetId: planet.planetId });
    if (unit) placedCount++;
  }

  return {
    success: true,
    triggeredEvents: ['units_placed'],
    data: { unitType: 'infantry', count: placedCount, playerId },
  };
}

/**
 * War Effort: Place cruiser in system with your ships
 */
function applyWarEffort(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.systemPosition) {
    return { success: false, error: 'Must select a system' };
  }

  const tile = findTile(state, targets.systemPosition);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  // Verify player has ships there
  const hasShips = tile.units.some(u => u.ownerId === playerId && isShip(u.type));
  if (!hasShips) {
    return { success: false, error: 'Must have ships in the system' };
  }

  const unit = placeUnit(state, playerId, 'cruiser', { position: targets.systemPosition });
  if (!unit) {
    return { success: false, error: 'Failed to place cruiser' };
  }

  return {
    success: true,
    triggeredEvents: ['unit_placed'],
    data: { unitType: 'cruiser', playerId, systemId: tile.id },
  };
}

/**
 * Fighter Conscription: Place fighter in each system with ships with capacity
 */
function applyFighterConscription(
  state: GameState,
  playerId: string
): HandlerResult {
  const systems = getSystemsWithPlayerShips(state, playerId);
  let placedCount = 0;

  for (const tile of systems) {
    // Check if player has ships with capacity (carriers, dreadnoughts, etc.)
    const hasCapacity = tile.units.some(u =>
      u.ownerId === playerId &&
      ['carrier', 'dreadnought', 'war_sun', 'flagship', 'cruiser'].includes(u.type)
    );

    if (hasCapacity) {
      const unit = placeUnit(state, playerId, 'fighter', { tileId: tile.id });
      if (unit) placedCount++;
    }
  }

  return {
    success: true,
    triggeredEvents: ['units_placed'],
    data: { unitType: 'fighter', count: placedCount, playerId },
  };
}

/**
 * Cripple Defenses: Destroy all PDS on a planet
 */
function applyCrippleDefenses(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.planetId) {
    return { success: false, error: 'Must select a planet' };
  }

  const result = findPlanet(state, targets.planetId);
  if (!result) {
    return { success: false, error: 'Planet not found' };
  }

  const pdsUnits = result.planet.units.filter(u => u.type === 'pds');
  let destroyedCount = 0;

  for (const pds of pdsUnits) {
    if (destroyUnit(state, pds.id)) {
      destroyedCount++;
    }
  }

  return {
    success: true,
    triggeredEvents: ['units_destroyed'],
    data: { unitType: 'pds', count: destroyedCount, planetId: targets.planetId },
  };
}

/**
 * Reactor Meltdown: Destroy a space dock
 */
function applyReactorMeltdown(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.unitIds || targets.unitIds.length === 0) {
    return { success: false, error: 'Must select a space dock' };
  }

  const unitId = targets.unitIds[0];
  const unitData = findUnit(state, unitId);

  if (!unitData || unitData.unit.type !== 'space_dock') {
    return { success: false, error: 'Must select a space dock' };
  }

  // Verify player has ships in or adjacent to the system
  const hasShipsInOrAdjacent = unitData.tile.units.some(u => u.ownerId === playerId && isShip(u.type));
  // TODO: Check adjacent systems too

  if (!hasShipsInOrAdjacent) {
    return { success: false, error: 'Must have ships in or adjacent to the system' };
  }

  const destroyed = destroyUnit(state, unitId);
  if (!destroyed) {
    return { success: false, error: 'Failed to destroy space dock' };
  }

  return {
    success: true,
    triggeredEvents: ['unit_destroyed'],
    data: { unitType: 'space_dock', unitId },
  };
}

/**
 * Plague: Roll to destroy infantry on a planet
 */
function applyPlague(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.planetId) {
    return { success: false, error: 'Must select a planet' };
  }

  const result = findPlanet(state, targets.planetId);
  if (!result) {
    return { success: false, error: 'Planet not found' };
  }

  // Verify player has ships in the system
  const hasShips = result.tile.units.some(u => u.ownerId === playerId && isShip(u.type));
  if (!hasShips) {
    return { success: false, error: 'Must have ships in the system' };
  }

  const infantry = result.planet.units.filter(u => u.type === 'infantry');
  const rolls: { unitId: string; roll: number; destroyed: boolean }[] = [];

  for (const inf of infantry) {
    const roll = Math.floor(Math.random() * 10) + 1;
    const destroyed = roll >= 6;
    rolls.push({ unitId: inf.id, roll, destroyed });

    if (destroyed) {
      destroyUnit(state, inf.id);
    }
  }

  return {
    success: true,
    triggeredEvents: ['plague_applied'],
    data: {
      planetId: targets.planetId,
      rolls,
      destroyedCount: rolls.filter(r => r.destroyed).length,
    },
  };
}

/**
 * Unstable Planet: Exhaust hazardous planet and destroy up to 3 infantry
 */
function applyUnstablePlanet(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.planetId) {
    return { success: false, error: 'Must select a hazardous planet' };
  }

  const result = findPlanet(state, targets.planetId);
  if (!result) {
    return { success: false, error: 'Planet not found' };
  }

  // Verify planet is hazardous
  const planetData = getPlanetData(result.planet.planetId);
  if (planetData?.trait !== 'hazardous') {
    return { success: false, error: 'Must select a hazardous planet' };
  }

  // Exhaust the planet
  result.planet.exhausted = true;

  // Destroy up to 3 infantry
  const infantry = result.planet.units.filter(u => u.type === 'infantry');
  const toDestroy = infantry.slice(0, 3);
  let destroyedCount = 0;

  for (const inf of toDestroy) {
    if (destroyUnit(state, inf.id)) {
      destroyedCount++;
    }
  }

  return {
    success: true,
    triggeredEvents: ['planet_exhausted', 'units_destroyed'],
    data: { planetId: targets.planetId, destroyedCount },
  };
}

/**
 * Uprising: Exhaust enemy planet, gain TG equal to resources
 */
function applyUprising(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.planetId) {
    return { success: false, error: 'Must select a planet' };
  }

  const result = findPlanet(state, targets.planetId);
  if (!result) {
    return { success: false, error: 'Planet not found' };
  }

  // Verify controlled by another player
  if (result.planet.controlledBy === playerId || !result.planet.controlledBy) {
    return { success: false, error: 'Must select a planet controlled by another player' };
  }

  // Exhaust the planet
  result.planet.exhausted = true;

  // Gain TG equal to resource value
  const planetData = getPlanetData(result.planet.planetId);
  const resources = planetData?.resources || 0;

  const player = findPlayer(state, playerId);
  if (player) {
    player.tradeGoods += resources;
  }

  return {
    success: true,
    triggeredEvents: ['planet_exhausted', 'trade_goods_gained'],
    data: { planetId: targets.planetId, tradeGoodsGained: resources },
  };
}

/**
 * Signal Jamming: Place enemy command token in a system
 */
function applySignalJamming(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.systemPosition || !targets?.targetPlayerId) {
    return { success: false, error: 'Must select a system and target player' };
  }

  const tile = findTile(state, targets.systemPosition);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  // Verify system is non-home and not Mecatol Rex
  // TODO: Check if it's a home system

  // Verify system contains or is adjacent to player's ships
  const hasShips = tile.units.some(u => u.ownerId === playerId && isShip(u.type));
  // TODO: Check adjacent systems too

  if (!hasShips) {
    return { success: false, error: 'Must have ships in or adjacent to the system' };
  }

  // Place enemy command token (from their reinforcements)
  const targetPlayer = findPlayer(state, targets.targetPlayerId);
  if (!targetPlayer || targetPlayer.commandTokens.tactics <= 0) {
    return { success: false, error: 'Target player has no command tokens' };
  }

  targetPlayer.commandTokens.tactics -= 1;
  tile.commandTokens.push(targets.targetPlayerId);

  return {
    success: true,
    triggeredEvents: ['command_token_placed'],
    data: {
      systemId: tile.id,
      targetPlayerId: targets.targetPlayerId,
    },
  };
}

/**
 * Insubordination: Remove token from enemy fleet pool
 */
function applyInsubordination(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.targetPlayerId) {
    return { success: false, error: 'Must select a player' };
  }

  const targetPlayer = findPlayer(state, targets.targetPlayerId);
  if (!targetPlayer) {
    return { success: false, error: 'Target player not found' };
  }

  if (targetPlayer.commandTokens.fleet <= 0) {
    return { success: false, error: 'Target player has no fleet tokens' };
  }

  targetPlayer.commandTokens.fleet -= 1;

  return {
    success: true,
    triggeredEvents: ['fleet_token_removed'],
    data: { targetPlayerId: targets.targetPlayerId },
  };
}

/**
 * Spy: Take random action card from another player
 */
function applySpy(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.targetPlayerId) {
    return { success: false, error: 'Must select a player' };
  }

  const targetPlayer = findPlayer(state, targets.targetPlayerId);
  if (!targetPlayer || targetPlayer.actionCards.length === 0) {
    return { success: false, error: 'Target player has no action cards' };
  }

  const player = findPlayer(state, playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Take random card
  const randomIndex = Math.floor(Math.random() * targetPlayer.actionCards.length);
  const stolenCard = targetPlayer.actionCards.splice(randomIndex, 1)[0];
  player.actionCards.push(stolenCard);

  return {
    success: true,
    triggeredEvents: ['action_card_stolen'],
    data: {
      playerId,
      targetPlayerId: targets.targetPlayerId,
      // Don't reveal which card was stolen
    },
  };
}

/**
 * Tactical Bombardment: Use bombardment outside of combat
 */
function applyTacticalBombardment(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.systemPosition) {
    return { success: false, error: 'Must select a system' };
  }

  const tile = findTile(state, targets.systemPosition);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  // Find units with bombardment
  const bombardUnits = tile.units.filter(u => {
    if (u.ownerId !== playerId) return false;
    const stats = units[u.type];
    return stats?.bombardment;
  });

  if (bombardUnits.length === 0) {
    return { success: false, error: 'No units with bombardment in the system' };
  }

  // Roll bombardment for each planet
  const results: { planetId: string; hits: number }[] = [];

  for (const planet of tile.planets) {
    let totalHits = 0;

    for (const unit of bombardUnits) {
      const stats = units[unit.type];
      if (stats?.bombardment) {
        const count = stats.bombardment.count || 1;
        const value = stats.bombardment.value || 5;

        for (let i = 0; i < count; i++) {
          const roll = Math.floor(Math.random() * 10) + 1;
          if (roll >= value) totalHits++;
        }
      }
    }

    results.push({ planetId: planet.planetId, hits: totalHits });
  }

  // TODO: Apply hits to infantry on planets

  return {
    success: true,
    triggeredEvents: ['tactical_bombardment'],
    data: { systemId: tile.id, results },
  };
}

/**
 * Master Plan: Perform strategic action without strategy token
 */
function applyMasterPlan(
  state: GameState,
  playerId: string
): HandlerResult {
  ensureTacticalModifiers(state, playerId);
  state.tacticalModifiers![playerId].freeStrategicAction = true;

  return {
    success: true,
    triggeredEvents: ['master_plan_active'],
    data: { playerId },
  };
}

/**
 * Probe: Look at player's hand (info only, no state change)
 */
function applyProbe(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.targetPlayerId) {
    return { success: false, error: 'Must select a player' };
  }

  const targetPlayer = findPlayer(state, targets.targetPlayerId);
  if (!targetPlayer) {
    return { success: false, error: 'Target player not found' };
  }

  return {
    success: true,
    triggeredEvents: ['probe_used'],
    data: {
      playerId,
      targetPlayerId: targets.targetPlayerId,
      // The client will handle showing the cards to the player
      revealedCards: targetPlayer.actionCards,
    },
  };
}

/**
 * Harness Energy: Gain 1 TG per planet with units
 */
function applyHarnessEnergy(
  state: GameState,
  playerId: string
): HandlerResult {
  const controlledPlanets = getPlayerControlledPlanets(state, playerId);
  let count = 0;

  for (const { planet } of controlledPlanets) {
    if (planet.units.some(u => u.ownerId === playerId)) {
      count++;
    }
  }

  const player = findPlayer(state, playerId);
  if (player) {
    player.tradeGoods += count;
  }

  return {
    success: true,
    triggeredEvents: ['trade_goods_gained'],
    data: { playerId, amount: count, source: 'harness_energy' },
  };
}

// =============================================================================
// AGENDA CARD EFFECTS
// =============================================================================

/**
 * Distinguished Councilor: Cast 5 additional votes
 */
function applyDistinguishedCouncilor(
  state: GameState,
  playerId: string
): HandlerResult {
  if (!state.agendaPhase) {
    return { success: false, error: 'No active agenda phase' };
  }

  const vote = state.agendaPhase.votes[playerId];
  if (vote) {
    vote.extraVotes += 5;
  }

  return {
    success: true,
    triggeredEvents: ['extra_votes_gained'],
    data: { playerId, extraVotes: 5 },
  };
}

/**
 * Bribery: Spend TG for votes
 */
function applyBribery(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!state.agendaPhase || !targets?.count) {
    return { success: false, error: 'Must specify TG to spend' };
  }

  const player = findPlayer(state, playerId);
  if (!player || player.tradeGoods < targets.count) {
    return { success: false, error: 'Not enough trade goods' };
  }

  player.tradeGoods -= targets.count;

  const vote = state.agendaPhase.votes[playerId];
  if (vote) {
    vote.extraVotes += targets.count;
  }

  return {
    success: true,
    triggeredEvents: ['bribery_used'],
    data: { playerId, tradeGoodsSpent: targets.count },
  };
}

/**
 * Veto: Discard agenda and reveal new one
 */
function applyVeto(
  state: GameState,
  playerId: string
): HandlerResult {
  if (!state.agendaPhase || !state.agendaPhase.currentAgendaId) {
    return { success: false, error: 'No active agenda' };
  }

  const discardedAgenda = state.agendaPhase.currentAgendaId;

  // Move current agenda to discard
  state.agendaDiscard.push(discardedAgenda);

  // Draw new agenda
  if (state.agendaDeck.length > 0) {
    const newAgenda = state.agendaDeck.shift()!;
    state.agendaPhase.currentAgendaId = newAgenda;
    state.agendaPhase.vetoed = true;

    // Reset voting
    state.agendaPhase.votes = {};
    state.agendaPhase.voteTallies = {};
  }

  return {
    success: true,
    triggeredEvents: ['agenda_vetoed'],
    data: { playerId, discardedAgenda },
  };
}

/**
 * Confusing Legal Text: Swap outcome effects
 */
function applyConfusingLegalText(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!state.agendaPhase) {
    return { success: false, error: 'No active agenda phase' };
  }

  // Mark that outcomes should be swapped on resolution
  state.agendaPhase.confusingLegalText = true;

  return {
    success: true,
    triggeredEvents: ['confusing_legal_text_applied'],
    data: { playerId },
  };
}

/**
 * Repeal Law: Discard a law from play
 */
function applyRepealLaw(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.agendaId) {
    return { success: false, error: 'Must select a law to repeal' };
  }

  const lawIndex = state.laws.findIndex(l => l.cardId === targets.agendaId);
  if (lawIndex === -1) {
    return { success: false, error: 'Law not found' };
  }

  const [repealedLaw] = state.laws.splice(lawIndex, 1);
  state.agendaDiscard.push(repealedLaw.cardId);

  return {
    success: true,
    triggeredEvents: ['law_repealed'],
    data: { playerId, lawId: targets.agendaId },
  };
}

/**
 * Reparations: Draw 1 action card per law in play
 */
function applyReparations(
  state: GameState,
  playerId: string
): HandlerResult {
  const lawCount = state.laws.length;
  if (lawCount === 0) {
    return { success: true, triggeredEvents: [], data: { drawnCount: 0 } };
  }

  return handleDrawActionCards(state, playerId, lawCount);
}

/**
 * Sanctions: Others pay TG or abstain
 */
function applySanctions(
  state: GameState,
  playerId: string
): HandlerResult {
  if (!state.agendaPhase) {
    return { success: false, error: 'No active agenda phase' };
  }

  // Mark sanctions active - other players must pay 1 TG to vote
  state.agendaPhase.sanctionsActive = playerId;

  return {
    success: true,
    triggeredEvents: ['sanctions_applied'],
    data: { playerId },
  };
}

/**
 * Political Stability: Keep strategy cards next round
 */
function applyPoliticalStability(
  state: GameState,
  playerId: string
): HandlerResult {
  const player = findPlayer(state, playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Mark that player keeps strategy card
  player.keepStrategyCard = true;

  return {
    success: true,
    triggeredEvents: ['political_stability_applied'],
    data: { playerId },
  };
}

/**
 * Public Disgrace: Block commodity refresh
 */
function applyPublicDisgrace(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.targetPlayerId) {
    return { success: false, error: 'Must select a player' };
  }

  const targetPlayer = findPlayer(state, targets.targetPlayerId);
  if (!targetPlayer) {
    return { success: false, error: 'Target player not found' };
  }

  // Mark that player can't refresh commodities
  targetPlayer.commodityRefreshBlocked = true;

  return {
    success: true,
    triggeredEvents: ['public_disgrace_applied'],
    data: { playerId, targetPlayerId: targets.targetPlayerId },
  };
}

/**
 * Generic Rider handler - stores the prediction for agenda resolution
 */
function applyRider(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!state.agendaPhase || !targets?.prediction) {
    return { success: false, error: 'Must predict an outcome' };
  }

  // Get the card ID from the calling context
  // This will be set by the routing function
  const cardBaseName = targets.cardId ? getCardBaseName(targets.cardId) : 'rider';

  // Record the rider prediction
  state.agendaPhase.riders.push({
    playerId,
    cardId: cardBaseName,
    prediction: targets.prediction,
    resolved: false,
    success: false,
  });

  // Player cannot vote on this agenda
  const vote = state.agendaPhase.votes[playerId];
  if (vote) {
    vote.abstained = true;
  }

  return {
    success: true,
    triggeredEvents: ['rider_played'],
    data: { playerId, prediction: targets.prediction, cardId: cardBaseName },
  };
}

// =============================================================================
// SPECIAL TIMING CARD EFFECTS
// =============================================================================

/**
 * Disable: Prevent ship from using AFB
 */
function applyDisable(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat || combat.type !== 'space') {
    return { success: false, error: 'No active space combat' };
  }

  if (!targets?.unitIds || targets.unitIds.length === 0) {
    return { success: false, error: 'Must select a ship to disable' };
  }

  const opponentId = playerId === combat.attackerId ? combat.defenderId : combat.attackerId;
  ensureCombatModifiers(state, opponentId);
  combat.temporaryModifiers![opponentId].disabledAFBUnits =
    combat.temporaryModifiers![opponentId].disabledAFBUnits || [];
  combat.temporaryModifiers![opponentId].disabledAFBUnits!.push(targets.unitIds[0]);

  return {
    success: true,
    triggeredEvents: ['unit_disabled'],
    data: { unitId: targets.unitIds[0], ability: 'afb' },
  };
}

/**
 * Scramble Frequency: Cancel all AFB hits
 */
function applyScrambleFrequency(
  state: GameState,
  playerId: string
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  // Cancel pending AFB hits against this player
  const isAttacker = playerId === combat.attackerId;
  const hitsKey = isAttacker ? 'defender' : 'attacker';

  // Store cancelled AFB hits
  ensureCombatModifiers(state, playerId);
  combat.temporaryModifiers![playerId].afbHitsCancelled = true;

  return {
    success: true,
    triggeredEvents: ['afb_hits_cancelled'],
    data: { playerId },
  };
}

/**
 * Maneuvering Jets: Cancel 1 space cannon hit
 */
function applyManeuveringJets(
  state: GameState,
  playerId: string
): HandlerResult {
  ensureTacticalModifiers(state, playerId);
  state.tacticalModifiers![playerId].spaceCannonHitsCancelled =
    (state.tacticalModifiers![playerId].spaceCannonHitsCancelled || 0) + 1;

  return {
    success: true,
    triggeredEvents: ['space_cannon_hit_cancelled'],
    data: { playerId, cancelled: 1 },
  };
}

/**
 * Experimental Battlestation: Space dock gains SPACE CANNON 5 (x3)
 */
function applyExperimentalBattlestation(
  state: GameState,
  playerId: string
): HandlerResult {
  if (!state.activatedSystem) {
    return { success: false, error: 'No activated system' };
  }

  ensureTacticalModifiers(state, playerId);
  state.tacticalModifiers![playerId].experimentalBattlestation = {
    systemPosition: state.activatedSystem,
    spaceCannon: { value: 5, dice: 3 },
  };

  return {
    success: true,
    triggeredEvents: ['experimental_battlestation_active'],
    data: { playerId, systemPosition: state.activatedSystem },
  };
}

/**
 * Fighter Prototype: +2 to fighter combat (or -1 in space combat)
 */
function applyFighterPrototype(
  state: GameState,
  playerId: string
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  ensureCombatModifiers(state, playerId);
  const modifier = combat.type === 'space' ? -1 : 2;
  combat.temporaryModifiers![playerId].fighterBonus = modifier;

  return {
    success: true,
    triggeredEvents: ['fighter_prototype_active'],
    data: { playerId, modifier },
  };
}

/**
 * Solar Flare: Block space cannon in adjacent system
 */
function applySolarFlare(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.systemPosition) {
    return { success: false, error: 'Must select a system' };
  }

  // TODO: Verify system is adjacent to player's home system

  ensureTacticalModifiers(state, playerId);
  state.tacticalModifiers![playerId].solarFlareSystem = targets.systemPosition;

  return {
    success: true,
    triggeredEvents: ['solar_flare_active'],
    data: { playerId, systemPosition: targets.systemPosition },
  };
}

// =============================================================================
// STRATEGY PHASE CARD EFFECTS
// =============================================================================

/**
 * Tech Sabotage: Reduce production by 4
 */
function applyTechSabotage(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.targetPlayerId) {
    return { success: false, error: 'Must select a player' };
  }

  ensureTacticalModifiers(state, targets.targetPlayerId);
  state.tacticalModifiers![targets.targetPlayerId].productionPenalty =
    (state.tacticalModifiers![targets.targetPlayerId].productionPenalty || 0) + 4;

  return {
    success: true,
    triggeredEvents: ['tech_sabotage_applied'],
    data: { targetPlayerId: targets.targetPlayerId, reduction: 4 },
  };
}

/**
 * Resist Strategy: Skip secondary, gain 1 TG and 1 command token
 */
function applyResistStrategy(
  state: GameState,
  playerId: string
): HandlerResult {
  const player = findPlayer(state, playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  player.tradeGoods += 1;
  player.commandTokens.tactics += 1;

  // Mark that player cannot use secondary
  if (state.strategicActionState) {
    state.strategicActionState.secondaryResponses[playerId] = 'declined';
  }

  return {
    success: true,
    triggeredEvents: ['resist_strategy_applied'],
    data: { playerId },
  };
}

// =============================================================================
// MISCELLANEOUS CARD EFFECTS
// =============================================================================

/**
 * Reveal Prototype: Give sustain damage to newly produced unit
 */
function applyRevealPrototype(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.unitIds || targets.unitIds.length === 0) {
    return { success: false, error: 'Must select a unit' };
  }

  const unitData = findUnit(state, targets.unitIds[0]);
  if (!unitData || unitData.unit.ownerId !== playerId) {
    return { success: false, error: 'Must select your own unit' };
  }

  // Mark unit as having sustain damage capability
  // (This is tracked separately since the unit type may not normally have it)
  ensureTacticalModifiers(state, playerId);
  if (!state.tacticalModifiers![playerId].revealPrototypeUnits) {
    state.tacticalModifiers![playerId].revealPrototypeUnits = [];
  }
  state.tacticalModifiers![playerId].revealPrototypeUnits!.push(targets.unitIds[0]);

  return {
    success: true,
    triggeredEvents: ['reveal_prototype_applied'],
    data: { playerId, unitId: targets.unitIds[0] },
  };
}

// =============================================================================
// POK ACTION CARD EFFECTS
// =============================================================================

/**
 * Waylay: At start of space combat as defender, opponent cannot retreat
 */
function applyWaylay(
  state: GameState,
  playerId: string
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat || combat.type !== 'space') {
    return { success: false, error: 'No active space combat' };
  }

  // Verify player is the defender
  if (combat.defenderId !== playerId) {
    return { success: false, error: 'Must be the defender to play Waylay' };
  }

  // Block attacker's retreat
  const attackerId = combat.attackerId;
  ensureCombatModifiers(state, attackerId);
  combat.temporaryModifiers![attackerId].cannotRetreat = true;

  return {
    success: true,
    triggeredEvents: ['waylay_applied'],
    data: { playerId, attackerId },
  };
}

/**
 * Decoy Operation: Swap ship with transported unit during tactical action
 */
function applyDecoyOperation(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.unitIds || targets.unitIds.length < 2) {
    return { success: false, error: 'Must select a ship and a transported unit to swap' };
  }

  const [shipId, transportedId] = targets.unitIds;

  const shipData = findUnit(state, shipId);
  const transportedData = findUnit(state, transportedId);

  if (!shipData || !transportedData) {
    return { success: false, error: 'Units not found' };
  }

  if (shipData.unit.ownerId !== playerId || transportedData.unit.ownerId !== playerId) {
    return { success: false, error: 'Must select your own units' };
  }

  // Verify ship has capacity
  if (!['carrier', 'dreadnought', 'war_sun', 'flagship', 'cruiser'].includes(shipData.unit.type)) {
    return { success: false, error: 'First unit must be a ship with capacity' };
  }

  // Verify transported unit can be transported
  if (!['fighter', 'infantry', 'mech'].includes(transportedData.unit.type)) {
    return { success: false, error: 'Second unit must be a transportable unit' };
  }

  // Swap positions
  const shipTile = shipData.tile;
  const transportedTile = transportedData.tile;

  // Remove from current locations
  const shipIndex = shipTile.units.findIndex(u => u.id === shipId);
  if (shipIndex !== -1) shipTile.units.splice(shipIndex, 1);

  const transportedIndex = transportedData.planetId
    ? transportedTile.planets.find(p => p.planetId === transportedData.planetId)?.units.findIndex(u => u.id === transportedId)
    : transportedTile.units.findIndex(u => u.id === transportedId);

  // Add to swapped locations
  if (transportedData.planetId) {
    const planet = transportedTile.planets.find(p => p.planetId === transportedData.planetId);
    if (planet && transportedIndex !== undefined && transportedIndex !== -1) {
      planet.units.splice(transportedIndex, 1);
      planet.units.push(shipData.unit);
    }
  } else if (transportedIndex !== undefined && transportedIndex !== -1) {
    transportedTile.units.splice(transportedIndex, 1);
    transportedTile.units.push(shipData.unit);
  }

  shipTile.units.push(transportedData.unit);

  return {
    success: true,
    triggeredEvents: ['decoy_operation_applied'],
    data: { playerId, shipId, transportedId },
  };
}

/**
 * Intercept: Move ships to adjacent system at start of space combat
 */
function applyIntercept(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat || combat.type !== 'space') {
    return { success: false, error: 'No active space combat' };
  }

  if (!targets?.unitIds || targets.unitIds.length === 0) {
    return { success: false, error: 'Must select ships to move' };
  }

  const combatTile = findTileById(state, combat.systemId);
  if (!combatTile) {
    return { success: false, error: 'Combat system not found' };
  }

  // Move selected ships to combat system
  for (const unitId of targets.unitIds) {
    const unitData = findUnit(state, unitId);
    if (!unitData || unitData.unit.ownerId !== playerId) continue;
    if (!isShip(unitData.unit.type)) continue;

    // Remove from current tile
    const idx = unitData.tile.units.findIndex(u => u.id === unitId);
    if (idx !== -1) {
      unitData.tile.units.splice(idx, 1);
      combatTile.units.push(unitData.unit);
    }
  }

  return {
    success: true,
    triggeredEvents: ['intercept_applied'],
    data: { playerId, shipsMovedCount: targets.unitIds.length },
  };
}

/**
 * Rally: Draw action cards for each ship type with ground forces
 */
function applyRally(
  state: GameState,
  playerId: string
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat) {
    return { success: false, error: 'No active combat' };
  }

  const tile = findTileById(state, combat.systemId);
  if (!tile) {
    return { success: false, error: 'Combat system not found' };
  }

  // Count unique ship types that have ground forces
  const shipTypes = new Set<UnitType>();
  const shipsWithGroundForces = tile.units.filter(u =>
    u.ownerId === playerId && isShip(u.type)
  );

  // For simplicity, assume any ship with capacity carrying ground forces qualifies
  for (const ship of shipsWithGroundForces) {
    if (['carrier', 'dreadnought', 'war_sun', 'flagship'].includes(ship.type)) {
      shipTypes.add(ship.type);
    }
  }

  const cardsToDraw = shipTypes.size;
  if (cardsToDraw === 0) {
    return { success: true, triggeredEvents: [], data: { drawnCount: 0 } };
  }

  return handleDrawActionCards(state, playerId, cardsToDraw);
}

/**
 * Seize Artifact: Steal a relic from opponent after winning combat
 */
function applySeizeArtifact(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.targetPlayerId) {
    return { success: false, error: 'Must select a player to steal from' };
  }

  const player = findPlayer(state, playerId);
  const targetPlayer = findPlayer(state, targets.targetPlayerId);

  if (!player || !targetPlayer) {
    return { success: false, error: 'Player not found' };
  }

  if (!targetPlayer.relics || targetPlayer.relics.length === 0) {
    return { success: false, error: 'Target player has no relics' };
  }

  // Take random relic
  const randomIndex = Math.floor(Math.random() * targetPlayer.relics.length);
  const stolenRelic = targetPlayer.relics.splice(randomIndex, 1)[0];

  if (!player.relics) player.relics = [];
  player.relics.push(stolenRelic);

  return {
    success: true,
    triggeredEvents: ['relic_stolen'],
    data: { playerId, targetPlayerId: targets.targetPlayerId, relicId: stolenRelic },
  };
}

/**
 * Ancient Burial Sites: Gain 1 additional VP when scoring
 */
function applyAncientBurialSites(
  state: GameState,
  playerId: string
): HandlerResult {
  const player = findPlayer(state, playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Grant 1 additional VP
  player.score += 1;

  return {
    success: true,
    triggeredEvents: ['bonus_vp_gained'],
    data: { playerId, amount: 1 },
  };
}

/**
 * Salvage: Gain TG equal to cost of destroyed ships after space combat
 */
function applySalvage(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  // Get destroyed ships value from combat log
  const destroyedValue = targets?.count || 0;

  const player = findPlayer(state, playerId);
  if (player) {
    player.tradeGoods += destroyedValue;
  }

  return {
    success: true,
    triggeredEvents: ['salvage_gained'],
    data: { playerId, tradeGoodsGained: destroyedValue },
  };
}

/**
 * Deadly Plot: Roll to destroy units on a planet
 */
function applyDeadlyPlot(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.planetId) {
    return { success: false, error: 'Must select a planet' };
  }

  const result = findPlanet(state, targets.planetId);
  if (!result) {
    return { success: false, error: 'Planet not found' };
  }

  const allUnits = result.planet.units.filter(u => u.ownerId !== playerId);
  const rolls: { unitId: string; roll: number; destroyed: boolean }[] = [];

  for (const unit of allUnits) {
    const roll = Math.floor(Math.random() * 10) + 1;
    const destroyed = roll >= 6;
    rolls.push({ unitId: unit.id, roll, destroyed });

    if (destroyed) {
      destroyUnit(state, unit.id);
    }
  }

  return {
    success: true,
    triggeredEvents: ['deadly_plot_applied'],
    data: {
      planetId: targets.planetId,
      rolls,
      destroyedCount: rolls.filter(r => r.destroyed).length,
    },
  };
}

/**
 * Emergency Meeting: Trigger immediate agenda phase
 */
function applyEmergencyMeeting(
  state: GameState,
  playerId: string
): HandlerResult {
  // Mark that an emergency agenda phase should occur
  state.pendingEmergencyAgenda = playerId;

  return {
    success: true,
    triggeredEvents: ['emergency_meeting_called'],
    data: { playerId },
  };
}

/**
 * Hack Election: Look at top 3 agendas and rearrange
 */
function applyHackElection(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.agendaOrder || targets.agendaOrder.length === 0) {
    // Just reveal top 3 for now
    const top3 = state.agendaDeck.slice(0, 3);

    return {
      success: true,
      triggeredEvents: ['hack_election_revealed'],
      data: {
        playerId,
        revealedAgendas: top3,
        needsReorder: true,
      },
    };
  }

  // Apply the new order
  const top3 = state.agendaDeck.splice(0, 3);
  for (let i = 0; i < targets.agendaOrder.length && i < 3; i++) {
    const agendaId = targets.agendaOrder[i];
    const agenda = top3.find(a => a === agendaId);
    if (agenda) {
      state.agendaDeck.splice(i, 0, agenda);
    }
  }

  return {
    success: true,
    triggeredEvents: ['hack_election_applied'],
    data: { playerId, newOrder: targets.agendaOrder.slice(0, 3) },
  };
}

/**
 * Boarding Party: Steal cargo from enemy ship during space combat
 */
function applyBoardingParty(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  const combat = getActiveCombat(state);
  if (!combat || combat.type !== 'space') {
    return { success: false, error: 'No active space combat' };
  }

  if (!targets?.unitIds || targets.unitIds.length === 0) {
    return { success: false, error: 'Must select an enemy ship' };
  }

  const unitData = findUnit(state, targets.unitIds[0]);
  if (!unitData) {
    return { success: false, error: 'Ship not found' };
  }

  if (unitData.unit.ownerId === playerId) {
    return { success: false, error: 'Must select an enemy ship' };
  }

  // TODO: Implement cargo stealing logic
  // For now, just mark the effect
  ensureCombatModifiers(state, playerId);
  combat.temporaryModifiers![playerId].boardingPartyTarget = targets.unitIds[0];

  return {
    success: true,
    triggeredEvents: ['boarding_party_applied'],
    data: { playerId, targetShipId: targets.unitIds[0] },
  };
}

/**
 * Scuttle: Destroy your ship to place infantry on planet
 */
function applyScuttle(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!targets?.unitIds || targets.unitIds.length === 0 || !targets.planetId) {
    return { success: false, error: 'Must select a ship to destroy and a planet' };
  }

  const unitData = findUnit(state, targets.unitIds[0]);
  if (!unitData || unitData.unit.ownerId !== playerId) {
    return { success: false, error: 'Must select your own ship' };
  }

  if (!isShip(unitData.unit.type)) {
    return { success: false, error: 'Must select a ship' };
  }

  // Get ship cost for infantry count
  const shipCosts: Record<string, number> = {
    fighter: 1,
    destroyer: 1,
    cruiser: 2,
    carrier: 3,
    dreadnought: 4,
    war_sun: 12,
    flagship: 8,
  };
  const infantryCount = shipCosts[unitData.unit.type] || 1;

  // Destroy the ship
  destroyUnit(state, targets.unitIds[0]);

  // Place infantry on planet
  for (let i = 0; i < infantryCount; i++) {
    placeUnit(state, playerId, 'infantry', { planetId: targets.planetId });
  }

  return {
    success: true,
    triggeredEvents: ['scuttle_applied'],
    data: { playerId, shipDestroyed: unitData.unit.type, infantryPlaced: infantryCount },
  };
}

/**
 * Forward Supply Base: Gain resources from exhausted planets as TG
 */
function applyForwardSupplyBase(
  state: GameState,
  playerId: string
): HandlerResult {
  const controlledPlanets = getPlayerControlledPlanets(state, playerId);
  let totalResources = 0;

  for (const { planet } of controlledPlanets) {
    if (planet.exhausted) {
      const planetData = getPlanetData(planet.planetId);
      totalResources += planetData?.resources || 0;
    }
  }

  const player = findPlayer(state, playerId);
  if (player) {
    player.tradeGoods += totalResources;
  }

  return {
    success: true,
    triggeredEvents: ['forward_supply_base_applied'],
    data: { playerId, tradeGoodsGained: totalResources },
  };
}

/**
 * Coup D'etat: Replace the speaker during agenda phase
 */
function applyCoupDetat(
  state: GameState,
  playerId: string,
  targets?: ActionCardTargets
): HandlerResult {
  if (!state.agendaPhase) {
    return { success: false, error: 'No active agenda phase' };
  }

  if (!targets?.targetPlayerId) {
    return { success: false, error: 'Must select the new speaker' };
  }

  const previousSpeaker = state.speakerId;
  state.speakerId = targets.targetPlayerId;

  return {
    success: true,
    triggeredEvents: ['speaker_changed'],
    data: { playerId, previousSpeaker, newSpeaker: targets.targetPlayerId },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { EFFECT_HANDLERS };
