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
}
