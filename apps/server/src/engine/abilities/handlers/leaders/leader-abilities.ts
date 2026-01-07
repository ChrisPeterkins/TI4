/**
 * Leader Ability Handlers
 *
 * Implements abilities for Agents, Commanders, and Heroes.
 * Each leader has unique abilities with different timing and effects.
 *
 * Leader Types:
 * - Agent: Can be exhausted to trigger ability, refreshes each round
 * - Commander: Unlocks when condition is met, provides passive or triggered ability
 * - Hero: One-time powerful ability that purges the hero when used
 */

import type { GameState, UnitType, HexCoord } from '@ti4/shared';
import type { AbilityHandler, AbilityContext, AbilityResult } from '../../ability-types.js';
import { registerAbilityHandler } from '../../ability-registry.js';
import { hasCommanderAccess } from '../../../handlers/promissory-notes.js';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a player's agent is available (unlocked and not exhausted)
 */
function isAgentAvailable(state: GameState, playerId: string): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player?.leaders) return false;
  return player.leaders.agent.unlocked && !player.leaders.agent.exhausted;
}

/**
 * Check if a player's commander is unlocked
 */
function isCommanderUnlocked(state: GameState, playerId: string): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player?.leaders) return false;
  return player.leaders.commander.unlocked;
}

/**
 * Check if a player can use a specific faction's commander (own or via Alliance)
 */
function canUseCommanderAbility(state: GameState, playerId: string, factionId: string): boolean {
  return hasCommanderAccess(state, playerId, factionId);
}

/**
 * Check if a player's hero is available (unlocked and not purged)
 */
function isHeroAvailable(state: GameState, playerId: string): boolean {
  const player = state.players.find(p => p.id === playerId);
  if (!player?.leaders) return false;
  return player.leaders.hero.unlocked && !player.leaders.hero.purged;
}

/**
 * Exhaust an agent after use
 */
function exhaustAgent(state: GameState, playerId: string): void {
  const player = state.players.find(p => p.id === playerId);
  if (player?.leaders) {
    player.leaders.agent.exhausted = true;
  }
}

/**
 * Purge a hero after use
 */
function purgeHero(state: GameState, playerId: string): void {
  const player = state.players.find(p => p.id === playerId);
  if (player?.leaders) {
    player.leaders.hero.purged = true;
  }
}

// =============================================================================
// ARBOREC LEADERS
// =============================================================================

/**
 * LETANI OSPHA (Agent)
 * When another player commits 1 or more ground forces to land on a planet:
 * You may exhaust this card; if so, that player removes those units and returns
 * them to their reinforcements.
 */
const arborecAgent: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'arborec') {
    return { success: false, error: 'Not Arborec player' };
  }

  if (!isAgentAvailable(state, playerId)) {
    return { success: false, error: 'Agent not available' };
  }

  const targetPlayerId = context.targetPlayerId;
  if (!targetPlayerId) {
    return { success: false, error: 'Must specify target player' };
  }

  // This is triggered during invasion, units would be returned to reinforcements
  exhaustAgent(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['agent_used', 'invasion_blocked'],
    data: {
      agentId: 'letani_ospha',
      targetPlayer: targetPlayerId,
      effect: 'return_ground_forces_to_reinforcements'
    },
  };
};

/**
 * LETANI MIASMIALA (Commander)
 * UNLOCK: Have 12 or more ground forces on the game board.
 * During ground combat on a planet that contains your mech: At the start of
 * each round of combat, you may have your mech gain PLANETARY SHIELD until
 * the end of this combat round.
 */
const arborecCommander: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check if player can use Arborec commander (own or via Alliance)
  if (!canUseCommanderAbility(state, playerId, 'arborec')) {
    return { success: false, error: 'Arborec commander not accessible (need unlocked or Alliance)' };
  }

  return {
    success: true,
    triggeredEvents: ['commander_ability_used'],
    data: {
      commanderId: 'letani_miasmiala',
      effect: 'mech_gains_planetary_shield'
    },
  };
};

/**
 * LETANI BEHEMOTH (Hero)
 * PURGE this card to move all ground forces from up to 4 different planets
 * to 4 different planets you control, other than Mecatol Rex. Then, place
 * 1 infantry on each planet you control.
 */
const arborecHero: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'arborec') {
    return { success: false, error: 'Not Arborec player' };
  }

  if (!isHeroAvailable(state, playerId)) {
    return { success: false, error: 'Hero not available' };
  }

  // Place 1 infantry on each planet controlled
  for (const controlledPlanet of player.planets) {
    // Find the tile containing this planet
    for (const tile of state.map.tiles) {
      const planet = tile.planets?.find(p => p.id === controlledPlanet.planetId);
      if (planet) {
        tile.units.push({
          id: `infantry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'infantry',
          ownerId: playerId,
          planetId: controlledPlanet.planetId,
          damaged: false,
        });
        break;
      }
    }
  }

  purgeHero(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['hero_purged', 'units_placed'],
    data: {
      heroId: 'letani_behemoth',
      infantryPlaced: player.planets.length
    },
  };
};

// =============================================================================
// FEDERATION OF SOL LEADERS
// =============================================================================

/**
 * EVELYN DELOUIS (Agent)
 * When any player produces infantry units: You may exhaust this card to place
 * 1 infantry on a planet you control.
 */
const solAgent: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'sol') {
    return { success: false, error: 'Not Sol player' };
  }

  if (!isAgentAvailable(state, playerId)) {
    return { success: false, error: 'Agent not available' };
  }

  const targetPlanetId = context.choices?.selectedPlanetId;
  if (!targetPlanetId) {
    return { success: false, error: 'Must select a planet' };
  }

  // Verify player controls the planet
  if (!player.planets.some(p => p.planetId === targetPlanetId)) {
    return { success: false, error: 'You do not control this planet' };
  }

  // Find tile and place infantry
  for (const tile of state.map.tiles) {
    const planet = tile.planets?.find(p => p.id === targetPlanetId);
    if (planet) {
      tile.units.push({
        id: `infantry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'infantry',
        ownerId: playerId,
        planetId: targetPlanetId,
        damaged: false,
      });

      exhaustAgent(state, playerId);

      return {
        success: true,
        stateModified: true,
        triggeredEvents: ['agent_used', 'unit_placed'],
        data: { agentId: 'evelyn_delouis', planetId: targetPlanetId },
      };
    }
  }

  return { success: false, error: 'Planet not found' };
};

/**
 * CLAIRE GIBSON (Commander)
 * UNLOCK: Control planets in 3 different systems.
 * At the start of ground combat: You may place 1 infantry from your reinforcements
 * on this planet.
 */
const solCommander: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check if player can use Sol commander (own or via Alliance)
  if (!canUseCommanderAbility(state, playerId, 'sol')) {
    return { success: false, error: 'Sol commander not accessible (need unlocked or Alliance)' };
  }

  const combat = state.activeCombat;
  if (!combat || combat.type !== 'ground') {
    return { success: false, error: 'Not in ground combat' };
  }

  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) {
    return { success: false, error: 'Combat system not found' };
  }

  // Place infantry on the combat planet
  tile.units.push({
    id: `infantry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'infantry',
    ownerId: playerId,
    planetId: combat.planetId,
    damaged: false,
  });

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['commander_ability_used', 'unit_placed'],
    data: { commanderId: 'claire_gibson', planetId: combat.planetId },
  };
};

/**
 * JACE X. 4TH AIR LEGION (Hero)
 * PURGE this card to destroy all other players' infantry and fighters in
 * systems that contain your ships.
 */
const solHero: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'sol') {
    return { success: false, error: 'Not Sol player' };
  }

  if (!isHeroAvailable(state, playerId)) {
    return { success: false, error: 'Hero not available' };
  }

  let destroyedCount = 0;

  // Find all systems with Sol ships and destroy enemy infantry/fighters
  for (const tile of state.map.tiles) {
    const hasPlayerShip = tile.units.some(
      u => u.ownerId === playerId && (u.type !== 'infantry' && u.type !== 'mech' && u.type !== 'pds' && u.type !== 'space_dock')
    );

    if (hasPlayerShip) {
      const toDestroy = tile.units.filter(
        u => u.ownerId !== playerId && (u.type === 'infantry' || u.type === 'fighter')
      );
      destroyedCount += toDestroy.length;
      tile.units = tile.units.filter(u => !toDestroy.includes(u));
    }
  }

  purgeHero(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['hero_purged', 'units_destroyed'],
    data: { heroId: 'jace_x_4th_air_legion', unitsDestroyed: destroyedCount },
  };
};

// =============================================================================
// EMPYREAN LEADERS (POK)
// =============================================================================

/**
 * UMBAT (Agent)
 * When an action card is played: You may exhaust this card to cancel
 * that action card.
 */
const empyreanAgent: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'empyrean') {
    return { success: false, error: 'Not Empyrean player' };
  }

  if (!isAgentAvailable(state, playerId)) {
    return { success: false, error: 'Agent not available' };
  }

  exhaustAgent(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['agent_used', 'action_card_canceled'],
    data: {
      agentId: 'umbat',
      effect: 'cancel_action_card'
    },
  };
};

/**
 * SAI SERAVUS (Commander)
 * UNLOCK: Win a space combat.
 * When another player ends their turn: You may exhaust their diplomat
 * in a system that contains your mech.
 */
const empyreanCommander: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check if player can use Empyrean commander (own or via Alliance)
  if (!canUseCommanderAbility(state, playerId, 'empyrean')) {
    return { success: false, error: 'Empyrean commander not accessible (need unlocked or Alliance)' };
  }

  return {
    success: true,
    triggeredEvents: ['commander_ability_used'],
    data: {
      commanderId: 'sai_seravus',
      effect: 'exhaust_diplomat'
    },
  };
};

// =============================================================================
// MAHACT GENE-SORCERERS LEADERS (POK)
// =============================================================================

/**
 * IL NA VIROSET (Agent)
 * When a player activates a system: You may exhaust this card to allow
 * that player to remove a command token from the board; that player returns
 * that token to their reinforcements.
 */
const mahactAgent: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'mahact') {
    return { success: false, error: 'Not Mahact player' };
  }

  if (!isAgentAvailable(state, playerId)) {
    return { success: false, error: 'Agent not available' };
  }

  exhaustAgent(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['agent_used'],
    data: {
      agentId: 'il_na_viroset',
      effect: 'return_command_token'
    },
  };
};

/**
 * AIRO SHIR AUR (Commander)
 * UNLOCK: Win a combat during the Action phase.
 * When you use a command token from your fleet pool to resolve 1 of your faction abilities:
 * Return that token to your reinforcements instead.
 */
const mahactCommander: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check if player can use Mahact commander (own or via Alliance)
  if (!canUseCommanderAbility(state, playerId, 'mahact')) {
    return { success: false, error: 'Mahact commander not accessible (need unlocked or Alliance)' };
  }

  return {
    success: true,
    triggeredEvents: ['commander_ability_used'],
    data: {
      commanderId: 'airo_shir_aur',
      effect: 'return_fleet_token'
    },
  };
};

/**
 * MABAN (Hero)
 * PURGE this card to swap the faction abilities of each other player
 * with the faction abilities of an opponent; each player must swap with a
 * different player.
 */
const mahactHero: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'mahact') {
    return { success: false, error: 'Not Mahact player' };
  }

  if (!isHeroAvailable(state, playerId)) {
    return { success: false, error: 'Hero not available' };
  }

  purgeHero(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['hero_purged'],
    data: {
      heroId: 'maban',
      effect: 'swap_faction_abilities'
    },
  };
};

// =============================================================================
// LAST BASTION LEADERS (Thunder's Edge)
// =============================================================================

/**
 * DAME BRIAR (Agent)
 * When a player's unit is destroyed: You may exhaust this card to galvanize
 * another of that player's units in the same system.
 */
const lastBastionAgent: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'last_bastion') {
    return { success: false, error: 'Not Last Bastion player' };
  }

  if (!isAgentAvailable(state, playerId)) {
    return { success: false, error: 'Agent not available' };
  }

  const targetUnitId = context.choices?.selectedUnitId;
  const systemId = context.choices?.selectedSystemId;
  if (!targetUnitId || !systemId) {
    return { success: false, error: 'Must specify unit and system' };
  }

  // Find the unit to galvanize
  const tile = state.map.tiles.find(t => t.id === systemId);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  const unit = tile.units.find(u => u.id === targetUnitId) ||
    tile.planets.flatMap(p => p.units).find(u => u.id === targetUnitId);
  if (!unit) {
    return { success: false, error: 'Unit not found' };
  }

  // Add galvanize token
  const targetPlayer = state.players.find(p => p.id === unit.ownerId);
  if (targetPlayer) {
    if (!targetPlayer.galvanizeTokens) {
      targetPlayer.galvanizeTokens = [];
    }
    targetPlayer.galvanizeTokens.push(targetUnitId);
  }

  exhaustAgent(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['agent_used', 'unit_galvanized'],
    data: {
      agentId: 'dame_briar',
      galvanizedUnit: targetUnitId,
      systemId,
    },
  };
};

/**
 * NIP AND TUCK (Commander)
 * UNLOCK: Have 3 galvanized units on the game board.
 * Your action cards cannot be canceled by the SABOTAGE action card.
 * Players cannot place assimilator tokens on your technologies.
 */
const lastBastionCommander: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Check if player can use Last Bastion commander (own or via Alliance)
  if (!canUseCommanderAbility(state, playerId, 'last_bastion')) {
    return { success: false, error: 'Last Bastion commander not accessible' };
  }

  // This is a passive ability - checked during Sabotage resolution and Nekro assimilation
  return {
    success: true,
    triggeredEvents: ['commander_ability_used'],
    data: {
      commanderId: 'nip_and_tuck',
      effect: 'sabotage_immunity_nekro_protection',
    },
  };
};

/**
 * LYRA KEEN (Hero) - "Apollo"
 * When 1 of your galvanized units is destroyed: PURGE this card to roll 1 die
 * for each opponent unit in this system. For each result equal to or greater
 * than the combat value of your destroyed unit, destroy 1 of those units.
 */
const lastBastionHero: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'last_bastion') {
    return { success: false, error: 'Not Last Bastion player' };
  }

  if (!isHeroAvailable(state, playerId)) {
    return { success: false, error: 'Hero not available' };
  }

  const systemId = context.choices?.selectedSystemId;
  const destroyedUnitCombatValue = (context.data?.combatValue as number) || 7;
  if (!systemId) {
    return { success: false, error: 'Must specify system' };
  }

  const tile = state.map.tiles.find(t => t.id === systemId);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  // Get all opponent units in system
  const opponentUnits = tile.units.filter(u => u.ownerId !== playerId);
  const destroyedUnits: string[] = [];

  // Roll for each opponent unit
  for (const unit of opponentUnits) {
    const roll = Math.floor(Math.random() * 10) + 1;
    if (roll >= destroyedUnitCombatValue) {
      destroyedUnits.push(unit.id);
    }
  }

  // Remove destroyed units
  tile.units = tile.units.filter(u => !destroyedUnits.includes(u.id));

  purgeHero(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['hero_purged', 'units_destroyed'],
    data: {
      heroId: 'lyra_keen',
      destroyedUnits,
      combatValue: destroyedUnitCombatValue,
    },
  };
};

// =============================================================================
// DEEPWROUGHT SCHOLARATE LEADERS (Thunder's Edge)
// =============================================================================

/**
 * DOCTOR CARRINA (Agent)
 * When another player researches a technology: You may exhaust this card;
 * if so, that player may ignore 1 prerequisite on that technology and you
 * place 1 infantry in coexistence on a planet that player controls that is
 * not in their home system.
 */
const deepwroughtAgent: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'deepwrought') {
    return { success: false, error: 'Not Deepwrought player' };
  }

  if (!isAgentAvailable(state, playerId)) {
    return { success: false, error: 'Agent not available' };
  }

  const targetPlayerId = context.targetPlayerId;
  const targetPlanetId = context.choices?.selectedPlanetId;
  if (!targetPlayerId || !targetPlanetId) {
    return { success: false, error: 'Must specify target player and planet' };
  }

  // Find the planet and place infantry in coexistence
  for (const tile of state.map.tiles) {
    const planet = tile.planets?.find(p => p.planetId === targetPlanetId);
    if (planet) {
      // Create coexistence infantry (owned by Deepwrought but on another player's planet)
      planet.units.push({
        id: `infantry-coex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'infantry',
        ownerId: playerId,
        planetId: targetPlanetId,
        damaged: false,
      });

      // Track coexistence state
      if (!state.coexistenceState) {
        state.coexistenceState = [];
      }
      const existingCoex = state.coexistenceState.find(c => c.planetId === targetPlanetId);
      if (existingCoex) {
        if (!existingCoex.coexistingPlayers.includes(playerId)) {
          existingCoex.coexistingPlayers.push(playerId);
        }
      } else {
        state.coexistenceState.push({
          planetId: targetPlanetId,
          coexistingPlayers: [playerId],
        });
      }

      exhaustAgent(state, playerId);

      return {
        success: true,
        stateModified: true,
        triggeredEvents: ['agent_used', 'unit_placed', 'coexistence_established'],
        data: {
          agentId: 'doctor_carrina',
          targetPlayer: targetPlayerId,
          planetId: targetPlanetId,
          effect: 'ignore_prerequisite_place_infantry',
        },
      };
    }
  }

  return { success: false, error: 'Planet not found' };
};

/**
 * AELLO (Commander)
 * UNLOCK: Have an ocean card in play.
 * When another player spends resources to research a technology: That player
 * may reduce the resource cost of that technology by 1. If they do, gain 1
 * commodity, or convert 1 of your commodities to a trade good.
 */
const deepwroughtCommander: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!canUseCommanderAbility(state, playerId, 'deepwrought')) {
    return { success: false, error: 'Deepwrought commander not accessible' };
  }

  // Grant the benefit - gain commodity or convert to trade good
  const convertToTG = context.choices?.convertCommodity || false;
  if (convertToTG && player.commodities > 0) {
    player.commodities--;
    player.tradeGoods++;
  } else if (player.commodities < player.maxCommodities) {
    player.commodities++;
  }

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['commander_ability_used'],
    data: {
      commanderId: 'aello',
      effect: 'tech_cost_reduction_commodity_gain',
      converted: convertToTG,
    },
  };
};

/**
 * TA ZERN (Hero)
 * ACTION: Purge this card and 1 of your technology cards that is not a unit
 * upgrade technology. Purge all copies of that technology card from every
 * other player's hand. Then, each other player whose technology was purged
 * this way may research 1 technology.
 */
const deepwroughtHero: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'deepwrought') {
    return { success: false, error: 'Not Deepwrought player' };
  }

  if (!isHeroAvailable(state, playerId)) {
    return { success: false, error: 'Hero not available' };
  }

  const techToPurge = context.choices?.selectedTechId;
  if (!techToPurge) {
    return { success: false, error: 'Must select a technology to purge' };
  }

  // Remove from own player
  const ownTechIndex = player.technologies?.indexOf(techToPurge) ?? -1;
  if (ownTechIndex >= 0) {
    player.technologies?.splice(ownTechIndex, 1);
  }

  // Remove from all other players and track who lost it
  const affectedPlayers: string[] = [];
  for (const otherPlayer of state.players) {
    if (otherPlayer.id === playerId) continue;

    const techIndex = otherPlayer.technologies?.indexOf(techToPurge) ?? -1;
    if (techIndex >= 0) {
      otherPlayer.technologies?.splice(techIndex, 1);
      affectedPlayers.push(otherPlayer.id);
    }
  }

  purgeHero(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['hero_purged', 'technology_purged'],
    data: {
      heroId: 'ta_zern',
      purgedTech: techToPurge,
      affectedPlayers,
      pendingTechResearch: affectedPlayers, // These players may research 1 tech
    },
  };
};

// =============================================================================
// RAL NEL CONSORTIUM LEADERS (Thunder's Edge)
// =============================================================================

/**
 * KAN KIP REL (Agent)
 * ACTION: Exhaust this card to draw 2 action cards; give 1 of those cards
 * to another player.
 */
const ralNelAgent: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'ral_nel') {
    return { success: false, error: 'Not Ral Nel player' };
  }

  if (!isAgentAvailable(state, playerId)) {
    return { success: false, error: 'Agent not available' };
  }

  const targetPlayerId = context.targetPlayerId;
  const cardToGive = context.choices?.selectedCardId;
  if (!targetPlayerId) {
    return { success: false, error: 'Must specify target player' };
  }

  const targetPlayer = state.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { success: false, error: 'Target player not found' };
  }

  // Draw 2 action cards (implementation would add to hand)
  // Give 1 to the target player
  exhaustAgent(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['agent_used', 'action_cards_drawn', 'card_given'],
    data: {
      agentId: 'kan_kip_rel',
      targetPlayer: targetPlayerId,
      effect: 'draw_2_give_1',
    },
  };
};

/**
 * WATCHFUL OJZ (Commander)
 * UNLOCK: Be last to pass during the Action Phase.
 * When you declare a retreat: Immediately retreat up to 2 of your ships from
 * the active system to an adjacent system that does not contain another
 * player's ships. Place a command token from your reinforcements into that system.
 */
const ralNelCommander: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!canUseCommanderAbility(state, playerId, 'ral_nel')) {
    return { success: false, error: 'Ral Nel commander not accessible' };
  }

  const selectedShips = context.choices?.selectedUnitIds as string[] || [];
  const targetSystemId = context.choices?.selectedSystemId;

  if (selectedShips.length > 2) {
    return { success: false, error: 'Can only retreat up to 2 ships' };
  }

  if (!targetSystemId) {
    return { success: false, error: 'Must specify retreat destination' };
  }

  // Verify target system has no opponent ships
  const targetTile = state.map.tiles.find(t => t.id === targetSystemId);
  if (!targetTile) {
    return { success: false, error: 'Target system not found' };
  }

  const hasOpponentShips = targetTile.units.some(u => u.ownerId !== playerId);
  if (hasOpponentShips) {
    return { success: false, error: 'Cannot retreat to system with opponent ships' };
  }

  // Move ships to target system
  const activeCombat = state.activeCombat;
  if (!activeCombat) {
    return { success: false, error: 'No active combat' };
  }

  const sourceTile = state.map.tiles.find(t => t.id === activeCombat.systemId);
  if (!sourceTile) {
    return { success: false, error: 'Source system not found' };
  }

  const retreatedShips: string[] = [];
  for (const shipId of selectedShips) {
    const shipIndex = sourceTile.units.findIndex(u => u.id === shipId && u.ownerId === playerId);
    if (shipIndex >= 0) {
      const ship = sourceTile.units.splice(shipIndex, 1)[0];
      targetTile.units.push(ship);
      retreatedShips.push(shipId);
    }
  }

  // Place command token from reinforcements
  if (player.commandTokens.tactics > 0) {
    player.commandTokens.tactics--;
    if (!targetTile.commandTokens) {
      targetTile.commandTokens = [];
    }
    targetTile.commandTokens.push(playerId);
  }

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['commander_ability_used', 'early_retreat'],
    data: {
      commanderId: 'watchful_ojz',
      retreatedShips,
      targetSystem: targetSystemId,
    },
  };
};

/**
 * DIRECTOR NEL (Hero)
 * After the last player passes: You may choose to no longer be passed. If you
 * do, gain 2 command tokens (from reinforcements), draw 1 action card, and
 * purge this card.
 */
const ralNelHero: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'ral_nel') {
    return { success: false, error: 'Not Ral Nel player' };
  }

  if (!isHeroAvailable(state, playerId)) {
    return { success: false, error: 'Hero not available' };
  }

  // Un-pass the player
  player.passed = false;

  // Gain 2 command tokens
  player.commandTokens.tactics += 2;

  // Draw 1 action card (would be implemented elsewhere)

  purgeHero(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['hero_purged', 'player_unpassed', 'command_tokens_gained'],
    data: {
      heroId: 'director_nel',
      effect: 'unpass_gain_tokens_draw_card',
    },
  };
};

// =============================================================================
// CRIMSON REBELLION LEADERS (Thunder's Edge)
// =============================================================================

/**
 * AHK RAVIN (Agent)
 * ACTION: Exhaust this card; another player swaps 2 of their ships between
 * any systems. Those ships may transport units.
 */
const crimsonRebellionAgent: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'crimson_rebellion') {
    return { success: false, error: 'Not Crimson Rebellion player' };
  }

  if (!isAgentAvailable(state, playerId)) {
    return { success: false, error: 'Agent not available' };
  }

  const targetPlayerId = context.targetPlayerId;
  const ship1 = context.choices?.ship1 as { unitId: string; fromSystem: string; toSystem: string } | undefined;
  const ship2 = context.choices?.ship2 as { unitId: string; fromSystem: string; toSystem: string } | undefined;

  if (!targetPlayerId || !ship1 || !ship2) {
    return { success: false, error: 'Must specify target player and two ships to swap' };
  }

  // Swap the ships between systems
  const tile1 = state.map.tiles.find(t => t.id === ship1.fromSystem);
  const tile2 = state.map.tiles.find(t => t.id === ship2.fromSystem);
  const destTile1 = state.map.tiles.find(t => t.id === ship1.toSystem);
  const destTile2 = state.map.tiles.find(t => t.id === ship2.toSystem);

  if (!tile1 || !tile2 || !destTile1 || !destTile2) {
    return { success: false, error: 'One or more systems not found' };
  }

  // Move ship 1
  const ship1Index = tile1.units.findIndex(u => u.id === ship1.unitId);
  if (ship1Index >= 0) {
    const unit = tile1.units.splice(ship1Index, 1)[0];
    destTile1.units.push(unit);
  }

  // Move ship 2
  const ship2Index = tile2.units.findIndex(u => u.id === ship2.unitId);
  if (ship2Index >= 0) {
    const unit = tile2.units.splice(ship2Index, 1)[0];
    destTile2.units.push(unit);
  }

  exhaustAgent(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['agent_used', 'ships_swapped'],
    data: {
      agentId: 'ahk_ravin',
      targetPlayer: targetPlayerId,
      swappedShips: [ship1.unitId, ship2.unitId],
    },
  };
};

/**
 * AHK SIEVER (Commander)
 * UNLOCK: Place a breach token in a system that contains another player's unit.
 * After combat ends: Gain 1 commodity, or convert 1 of your commodities to a
 * trade good.
 */
const crimsonRebellionCommander: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!canUseCommanderAbility(state, playerId, 'crimson_rebellion')) {
    return { success: false, error: 'Crimson Rebellion commander not accessible' };
  }

  // Grant the benefit - gain commodity or convert to trade good
  const convertToTG = context.choices?.convertCommodity || false;
  if (convertToTG && player.commodities > 0) {
    player.commodities--;
    player.tradeGoods++;
  } else if (player.commodities < player.maxCommodities) {
    player.commodities++;
  }

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['commander_ability_used'],
    data: {
      commanderId: 'ahk_siever',
      effect: 'post_combat_commodity',
      converted: convertToTG,
    },
  };
};

/**
 * HOMESICK PHANTOM (Hero)
 * When you produce ships, you may place any number of those ships on this card
 * instead of in a system. During a space combat: PURGE this card to place all
 * ships on this card into the active system.
 */
const crimsonRebellionHero: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'crimson_rebellion') {
    return { success: false, error: 'Not Crimson Rebellion player' };
  }

  if (!isHeroAvailable(state, playerId)) {
    return { success: false, error: 'Hero not available' };
  }

  const activeCombat = state.activeCombat;
  if (!activeCombat || activeCombat.type !== 'space') {
    return { success: false, error: 'Must be in space combat to use this ability' };
  }

  const tile = state.map.tiles.find(t => t.id === activeCombat.systemId);
  if (!tile) {
    return { success: false, error: 'Combat system not found' };
  }

  // Get stored ships from hero card (would be tracked in player state)
  const storedShips = player.storedHeroShips || [];
  const deployedCount = storedShips.length;

  // Deploy all stored ships to the active system
  for (const shipData of storedShips) {
    tile.units.push({
      id: `ship-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: shipData.type as UnitType,
      ownerId: playerId,
      damaged: false,
    });
  }

  // Clear stored ships
  player.storedHeroShips = [];

  purgeHero(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['hero_purged', 'ships_deployed'],
    data: {
      heroId: 'homesick_phantom',
      deployedShips: deployedCount,
      systemId: activeCombat.systemId,
    },
  };
};

// =============================================================================
// THE FIRMAMENT LEADERS (Thunder's Edge)
// =============================================================================

/**
 * MYRU VOS (Agent)
 * When a player moves ships: You may exhaust this card; space cannon abilities
 * cannot be used against that player's ships during this movement. If those
 * ships are not transporting any units, they may move through systems that
 * contain other players' ships.
 */
const firmamentAgent: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'firmament') {
    return { success: false, error: 'Not Firmament player' };
  }

  if (!isAgentAvailable(state, playerId)) {
    return { success: false, error: 'Agent not available' };
  }

  const targetPlayerId = context.targetPlayerId || playerId;

  exhaustAgent(state, playerId);

  // Set temporary movement flags (would be checked by movement/space cannon handlers)
  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['agent_used', 'movement_protection_granted'],
    data: {
      agentId: 'myru_vos',
      targetPlayer: targetPlayerId,
      effect: 'space_cannon_immunity_ship_passthrough',
    },
  };
};

/**
 * CAPTAIN AROZ (Commander)
 * UNLOCK: Have a plot card in play.
 * For the purposes of scoring secret objectives, planets in systems that
 * contain your ships are treated as though you control those planets.
 */
const firmamentCommander: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!canUseCommanderAbility(state, playerId, 'firmament')) {
    return { success: false, error: 'Firmament commander not accessible' };
  }

  // This is a passive ability - checked during secret objective scoring
  return {
    success: true,
    triggeredEvents: ['commander_ability_used'],
    data: {
      commanderId: 'captain_aroz',
      effect: 'virtual_planet_control_for_secrets',
    },
  };
};

/**
 * SHARSISS (Hero)
 * ACTION: Place 1 of your plot cards faceup in your play area with any player's
 * control token on it. Then, you may place any player's control token on another
 * plot card in your play area. Then, PURGE this card.
 */
const firmamentHero: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'firmament') {
    return { success: false, error: 'Not Firmament player' };
  }

  if (!isHeroAvailable(state, playerId)) {
    return { success: false, error: 'Hero not available' };
  }

  const plotCardId = context.choices?.selectedPlotCardId;
  const controlTokenPlayerId = context.choices?.controlTokenPlayerId;
  if (!plotCardId || !controlTokenPlayerId) {
    return { success: false, error: 'Must select plot card and control token owner' };
  }

  // Place plot card in play area with control token
  if (!player.plotCardsInPlay) {
    player.plotCardsInPlay = [];
  }
  player.plotCardsInPlay.push(plotCardId);

  // Remove from hand
  const cardIndex = player.plotCards?.indexOf(plotCardId) ?? -1;
  if (cardIndex >= 0) {
    player.plotCards?.splice(cardIndex, 1);
  }

  purgeHero(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['hero_purged', 'plot_card_placed'],
    data: {
      heroId: 'sharsiss',
      plotCard: plotCardId,
      controlToken: controlTokenPlayerId,
    },
  };
};

// =============================================================================
// THE OBSIDIAN LEADERS (Thunder's Edge - Firmament Transform)
// =============================================================================

/**
 * VOS HOLLOW (Agent)
 * When a ship is destroyed during a combat in which you are participating:
 * You may exhaust this card; the opponent who destroyed that ship must
 * destroy 1 of their ships of the same type, if able.
 */
const obsidianAgent: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'obsidian') {
    return { success: false, error: 'Not Obsidian player' };
  }

  if (!isAgentAvailable(state, playerId)) {
    return { success: false, error: 'Agent not available' };
  }

  const destroyedShipType = context.data?.destroyedShipType as UnitType;
  const opponentId = context.targetPlayerId;

  if (!destroyedShipType || !opponentId) {
    return { success: false, error: 'Must specify destroyed ship type and opponent' };
  }

  const activeCombat = state.activeCombat;
  if (!activeCombat) {
    return { success: false, error: 'Not in combat' };
  }

  const tile = state.map.tiles.find(t => t.id === activeCombat.systemId);
  if (!tile) {
    return { success: false, error: 'Combat system not found' };
  }

  // Find opponent ship of same type to destroy
  const opponentShipIndex = tile.units.findIndex(
    u => u.ownerId === opponentId && u.type === destroyedShipType
  );

  if (opponentShipIndex >= 0) {
    const destroyedShip = tile.units.splice(opponentShipIndex, 1)[0];

    exhaustAgent(state, playerId);

    return {
      success: true,
      stateModified: true,
      triggeredEvents: ['agent_used', 'retaliatory_destruction'],
      data: {
        agentId: 'vos_hollow',
        destroyedShip: destroyedShip.id,
        shipType: destroyedShipType,
      },
    };
  }

  return { success: false, error: 'No matching ship to destroy' };
};

/**
 * AROZ HOLLOW (Commander)
 * UNLOCK: Have units in The Fracture.
 * Apply +1 to the result of each of your unit's combat rolls during combat
 * in The Fracture.
 */
const obsidianCommander: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!canUseCommanderAbility(state, playerId, 'obsidian')) {
    return { success: false, error: 'Obsidian commander not accessible' };
  }

  // This is a passive combat modifier - checked during combat in Fracture systems
  return {
    success: true,
    triggeredEvents: ['commander_ability_used'],
    data: {
      commanderId: 'aroz_hollow',
      effect: 'fracture_combat_bonus',
      modifier: 1,
    },
  };
};

/**
 * SHARSISS HOLLOW (Hero)
 * ACTION: Ready all of your planets. Then, PURGE this card.
 */
const obsidianHero: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'obsidian') {
    return { success: false, error: 'Not Obsidian player' };
  }

  if (!isHeroAvailable(state, playerId)) {
    return { success: false, error: 'Hero not available' };
  }

  // Ready all planets
  let readiedCount = 0;
  for (const planet of player.planets) {
    if (planet.exhausted) {
      planet.exhausted = false;
      readiedCount++;
    }
  }

  purgeHero(state, playerId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['hero_purged', 'planets_readied'],
    data: {
      heroId: 'sharsiss_hollow',
      readiedPlanets: readiedCount,
    },
  };
};

// =============================================================================
// REGISTER ALL LEADER HANDLERS
// =============================================================================

export function registerLeaderAbilities(): void {
  // Arborec
  registerAbilityHandler('arborec_agent', arborecAgent);
  registerAbilityHandler('arborec_commander', arborecCommander);
  registerAbilityHandler('arborec_hero', arborecHero);

  // Federation of Sol
  registerAbilityHandler('sol_agent', solAgent);
  registerAbilityHandler('sol_commander', solCommander);
  registerAbilityHandler('sol_hero', solHero);

  // Empyrean (PoK)
  registerAbilityHandler('empyrean_agent', empyreanAgent);
  registerAbilityHandler('empyrean_commander', empyreanCommander);

  // Mahact (PoK)
  registerAbilityHandler('mahact_agent', mahactAgent);
  registerAbilityHandler('mahact_commander', mahactCommander);
  registerAbilityHandler('mahact_hero', mahactHero);

  // ============================================
  // THUNDER'S EDGE FACTION LEADERS
  // ============================================

  // Last Bastion
  registerAbilityHandler('last_bastion_agent', lastBastionAgent);
  registerAbilityHandler('last_bastion_commander', lastBastionCommander);
  registerAbilityHandler('last_bastion_hero', lastBastionHero);

  // Deepwrought Scholarate
  registerAbilityHandler('deepwrought_agent', deepwroughtAgent);
  registerAbilityHandler('deepwrought_commander', deepwroughtCommander);
  registerAbilityHandler('deepwrought_hero', deepwroughtHero);

  // Ral Nel Consortium
  registerAbilityHandler('ral_nel_agent', ralNelAgent);
  registerAbilityHandler('ral_nel_commander', ralNelCommander);
  registerAbilityHandler('ral_nel_hero', ralNelHero);

  // Crimson Rebellion
  registerAbilityHandler('crimson_rebellion_agent', crimsonRebellionAgent);
  registerAbilityHandler('crimson_rebellion_commander', crimsonRebellionCommander);
  registerAbilityHandler('crimson_rebellion_hero', crimsonRebellionHero);

  // The Firmament
  registerAbilityHandler('firmament_agent', firmamentAgent);
  registerAbilityHandler('firmament_commander', firmamentCommander);
  registerAbilityHandler('firmament_hero', firmamentHero);

  // The Obsidian
  registerAbilityHandler('obsidian_agent', obsidianAgent);
  registerAbilityHandler('obsidian_commander', obsidianCommander);
  registerAbilityHandler('obsidian_hero', obsidianHero);
}
