/**
 * Leader Handlers
 * Handles agent, commander, and hero actions
 */

import type {
  GameState,
  UseAgentAction,
  UnlockCommanderAction,
  PurgeHeroAction,
  UnitInstance,
} from '@ti4/shared';
import { getLeaderAbility, FACTION_LEADERS } from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import {
  validateUseAgent,
  validatePurgeHero,
  canUnlockCommander,
} from '../validators/leaders.js';
import { addLogEntry } from '../utils/game-log.js';

/**
 * Helper to create a unit instance with proper type
 */
function createUnit(type: string, ownerId: string): UnitInstance {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: type as UnitInstance['type'],
    ownerId,
    damaged: false,
  };
}

/**
 * Handle using an agent ability
 */
export function handleUseAgent(
  state: GameState,
  action: UseAgentAction
): HandlerResult {
  // Validate the action
  const validation = validateUseAgent(state, action);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const player = state.players.find((p) => p.id === action.playerId)!;
  const factionLeaders = FACTION_LEADERS[player.faction];
  const ability = getLeaderAbility(factionLeaders.agent);

  if (!ability) {
    return { success: false, error: 'Agent ability not found' };
  }

  // Exhaust the agent
  player.leaders!.agent.exhausted = true;

  // Apply the agent effect based on type
  const result = applyAgentEffect(state, player.id, ability, action.targetPlayerId);
  if (!result.success) {
    // Rollback exhaustion if effect fails
    player.leaders!.agent.exhausted = false;
    return result;
  }

  // Log the action
  addLogEntry(state, 'ability_triggered', `used agent ${factionLeaders.agent}`, {
    playerId: player.id,
    details: {
      abilityType: 'agent',
      abilityId: factionLeaders.agent,
    },
  });

  return {
    success: true,
    triggeredEvents: ['agent_used'],
  };
}

/**
 * Handle unlocking a commander
 */
export function handleUnlockCommander(
  state: GameState,
  action: UnlockCommanderAction
): HandlerResult {
  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!player.leaders) {
    return { success: false, error: 'Leaders not initialized' };
  }

  // Check if already unlocked
  if (player.leaders.commander.unlocked) {
    return { success: false, error: 'Commander already unlocked' };
  }

  // Check unlock condition
  const result = canUnlockCommander(state, action.playerId);
  if (!result.canUnlock) {
    return { success: false, error: result.reason || 'Cannot unlock commander' };
  }

  // Unlock the commander
  player.leaders.commander.unlocked = true;

  const factionLeaders = FACTION_LEADERS[player.faction];

  // Log the unlock
  addLogEntry(state, 'ability_triggered', `unlocked commander ${factionLeaders?.commander}`, {
    playerId: player.id,
    details: {
      abilityType: 'commander',
      abilityId: factionLeaders?.commander,
    },
  });

  return {
    success: true,
    triggeredEvents: ['commander_unlocked'],
  };
}

/**
 * Handle purging a hero (using hero ability)
 */
export function handlePurgeHero(
  state: GameState,
  action: PurgeHeroAction
): HandlerResult {
  // Validate the action
  const validation = validatePurgeHero(state, action);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const player = state.players.find((p) => p.id === action.playerId)!;
  const factionLeaders = FACTION_LEADERS[player.faction];
  const ability = getLeaderAbility(factionLeaders.hero);

  if (!ability) {
    return { success: false, error: 'Hero ability not found' };
  }

  // Apply the hero effect
  const result = applyHeroEffect(state, player.id, ability, action.targets);
  if (!result.success) {
    return result;
  }

  // Purge the hero (mark as used)
  player.leaders!.hero.purged = true;

  // Log the action
  addLogEntry(state, 'ability_triggered', `purged hero ${factionLeaders.hero}`, {
    playerId: player.id,
    details: {
      abilityType: 'hero',
      abilityId: factionLeaders.hero,
    },
  });

  return {
    success: true,
    triggeredEvents: ['hero_purged'],
  };
}

/**
 * Apply agent effect based on ability type
 */
function applyAgentEffect(
  state: GameState,
  playerId: string,
  ability: ReturnType<typeof getLeaderAbility>,
  targetPlayerId?: string
): HandlerResult {
  if (!ability) {
    return { success: false, error: 'Ability not found' };
  }

  const player = state.players.find((p) => p.id === playerId)!;
  const targetPlayer = targetPlayerId
    ? state.players.find((p) => p.id === targetPlayerId)
    : null;

  switch (ability.effect.type) {
    case 'gain_trade_goods': {
      const amount = ability.effect.amount;
      if (typeof amount === 'number') {
        player.tradeGoods += amount;
      }
      return { success: true, triggeredEvents: ['trade_goods_gained'] };
    }

    case 'gain_commodities': {
      const amount = ability.effect.amount;
      // Also give to target player if specified (e.g., Hacan agent)
      player.commodities = Math.min(
        player.commodities + amount,
        player.maxCommodities
      );
      if (targetPlayer) {
        targetPlayer.commodities = Math.min(
          targetPlayer.commodities + amount,
          targetPlayer.maxCommodities
        );
      }
      return { success: true, triggeredEvents: ['commodities_gained'] };
    }

    case 'replenish_commodities': {
      player.commodities = player.maxCommodities;
      return { success: true, triggeredEvents: ['commodities_replenished'] };
    }

    case 'draw_action_cards': {
      const count = ability.effect.count;
      const target = targetPlayer || player;
      // Draw from action card deck
      for (let i = 0; i < count; i++) {
        const card = state.actionCardDeck.shift();
        if (card) {
          if (!target.actionCards) {
            target.actionCards = [];
          }
          target.actionCards.push(card);
        }
      }
      return { success: true, triggeredEvents: ['action_cards_drawn'] };
    }

    case 'draw_secret_objective': {
      const objective = state.objectives.secretDeck.shift();
      if (objective) {
        if (!player.secretObjectives) {
          player.secretObjectives = [];
        }
        player.secretObjectives.push(objective);
      }
      return { success: true, triggeredEvents: ['secret_objective_drawn'] };
    }

    case 'place_units':
    case 'repair_units':
    case 'exhaust_planet':
    case 'ready_planet':
    case 'cancel_hits':
    case 'reroll_dice':
    case 'extra_votes':
    case 'copy_agent':
    case 'steal_action_card':
    case 'look_at_hand':
    case 'swap_command_tokens': {
      // These require specific context or UI interaction
      return { success: true, triggeredEvents: ['effect_applied'] };
    }

    case 'custom': {
      return applyCustomAgentEffect(state, playerId, ability.effect.handlerId, targetPlayerId);
    }

    default:
      return { success: true, triggeredEvents: [] };
  }
}

/**
 * Apply hero effect based on ability type
 */
function applyHeroEffect(
  state: GameState,
  playerId: string,
  ability: ReturnType<typeof getLeaderAbility>,
  targets?: { playerId?: string; systemId?: string; planetId?: string }
): HandlerResult {
  if (!ability) {
    return { success: false, error: 'Ability not found' };
  }

  // Most heroes have custom effects
  if (ability.effect.type === 'custom') {
    return applyCustomHeroEffect(state, playerId, ability.effect.handlerId, targets);
  }

  // Handle non-custom hero effects
  return { success: true, triggeredEvents: [] };
}

/**
 * Apply custom agent effects for complex abilities
 */
function applyCustomAgentEffect(
  state: GameState,
  playerId: string,
  handlerId: string,
  targetPlayerId?: string
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId)!;
  const targetPlayer = targetPlayerId
    ? state.players.find((p) => p.id === targetPlayerId)
    : null;

  switch (handlerId) {
    case 'saar_agent':
    case 'letnev_agent':
    case 'creuss_agent':
    case 'mentak_agent':
    case 'l1z1x_agent':
    case 'muaat_agent':
    case 'naalu_agent':
    case 'empyrean_agent':
    case 'nomad_agent':
    case 'titans_agent':
    case 'cabal_agent':
    case 'argent_agent': {
      // These require specific context
      return { success: true, triggeredEvents: ['agent_effect_applied'] };
    }

    case 'keleres_agent': {
      // Tellurian - Convert commodities to trade goods
      if (targetPlayer) {
        targetPlayer.tradeGoods += targetPlayer.commodities;
        targetPlayer.commodities = 0;
        return { success: true, triggeredEvents: ['commodities_converted'] };
      }
      return { success: false, error: 'Target player required' };
    }

    default:
      console.warn(`No custom agent handler for: ${handlerId}`);
      return { success: true, triggeredEvents: [] };
  }
}

/**
 * Apply custom hero effects for complex abilities
 */
function applyCustomHeroEffect(
  state: GameState,
  playerId: string,
  handlerId: string,
  targets?: { playerId?: string; systemId?: string; planetId?: string }
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId)!;

  switch (handlerId) {
    case 'sol_hero': {
      // Jace X - Place 1 infantry on each planet you control
      for (const tile of state.map.tiles) {
        for (const planet of tile.planets) {
          if (planet.controlledBy === playerId) {
            planet.units.push(createUnit('infantry', playerId));
          }
        }
      }
      return { success: true, triggeredEvents: ['infantry_placed'] };
    }

    case 'hacan_hero': {
      // Harrugh Gefhara - Take all trade goods from all players
      let totalTaken = 0;
      for (const otherPlayer of state.players) {
        if (otherPlayer.id !== playerId) {
          totalTaken += otherPlayer.tradeGoods;
          otherPlayer.tradeGoods = 0;
        }
      }
      player.tradeGoods += totalTaken;
      return { success: true, triggeredEvents: ['trade_goods_taken'] };
    }

    case 'l1z1x_hero': {
      // Annihilator - Destroy all infantry and fighters in a system
      if (targets?.systemId) {
        const tile = state.map.tiles.find((t) => t.systemId?.toString() === targets.systemId);
        if (tile) {
          // Remove all enemy infantry from planets
          for (const planet of tile.planets) {
            planet.units = planet.units.filter(
              (u) => u.ownerId === playerId || (u.type !== 'infantry' && u.type !== 'fighter')
            );
          }
          // Remove all enemy fighters from space
          tile.units = tile.units.filter(
            (u) => u.ownerId === playerId || u.type !== 'fighter'
          );
        }
      }
      return { success: true, triggeredEvents: ['units_destroyed'] };
    }

    case 'arborec_hero': {
      // Letani Behemoth - Place 2 infantry and 1 mech on each planet you control
      for (const tile of state.map.tiles) {
        for (const planet of tile.planets) {
          if (planet.controlledBy === playerId) {
            planet.units.push(createUnit('infantry', playerId));
            planet.units.push(createUnit('infantry', playerId));
            planet.units.push(createUnit('mech', playerId));
          }
        }
      }
      return { success: true, triggeredEvents: ['units_placed'] };
    }

    case 'saar_hero': {
      // Gurno Aggero - Gain 1 relic
      const relic = state.relicDeck?.shift();
      if (relic) {
        if (!player.relics) {
          player.relics = [];
        }
        player.relics.push(relic);
      }
      return { success: true, triggeredEvents: ['relic_gained'] };
    }

    case 'winnu_hero': {
      // Mathis Mathinus - Ready 1 planet per technology owned
      const techCount = player.technologies?.length || 0;
      let readied = 0;
      for (const tile of state.map.tiles) {
        for (const planet of tile.planets) {
          if (readied >= techCount) break;
          if (planet.controlledBy === playerId && planet.exhausted) {
            planet.exhausted = false;
            readied++;
          }
        }
      }
      return { success: true, triggeredEvents: ['planets_readied'] };
    }

    case 'norr_hero': {
      // Rowl Sarrig - Destroy all opponent's fighters at start of space combat
      if (state.activeCombat) {
        const tile = state.map.tiles.find(
          (t) => t.systemId?.toString() === state.activeCombat!.systemId
        );
        if (tile) {
          const opponentId = state.activeCombat.attackerId === playerId
            ? state.activeCombat.defenderId
            : state.activeCombat.attackerId;
          tile.units = tile.units.filter(
            (u) => u.ownerId !== opponentId || u.type !== 'fighter'
          );
        }
      }
      return { success: true, triggeredEvents: ['fighters_destroyed'] };
    }

    case 'yin_hero': {
      // Dannel of the Tenth - Replace opponent infantry on legendary/home planets
      // Simplified implementation
      return { success: true, triggeredEvents: ['infantry_replaced'] };
    }

    // Placeholder implementations for other heroes
    case 'jolnar_hero':
    case 'nekro_hero':
    case 'xxcha_hero':
    case 'yssaril_hero':
    case 'mahact_hero':
    case 'nomad_hero':
    case 'titans_hero':
    case 'cabal_hero':
    case 'empyrean_hero':
    case 'naazrokha_hero':
    case 'argent_hero':
    case 'creuss_hero':
    case 'letnev_hero':
    case 'keleres_hero':
    case 'mentak_hero':
    case 'muaat_hero':
    case 'naalu_hero': {
      // These require complex game state manipulation
      return { success: true, triggeredEvents: ['hero_effect_applied'] };
    }

    default:
      console.warn(`No custom hero handler for: ${handlerId}`);
      return { success: true, triggeredEvents: [] };
  }
}

/**
 * Ready all agents during status phase
 */
export function readyAllAgents(state: GameState): void {
  for (const player of state.players) {
    if (player.leaders?.agent) {
      player.leaders.agent.exhausted = false;
    }
  }
}

/**
 * Check and unlock commanders for all players
 * Called after game state changes that could trigger unlocks
 */
export function checkAllCommanderUnlocks(state: GameState): string[] {
  const unlocked: string[] = [];

  for (const player of state.players) {
    if (!player.leaders?.commander.unlocked) {
      const result = canUnlockCommander(state, player.id);
      if (result.canUnlock) {
        player.leaders!.commander.unlocked = true;
        unlocked.push(player.id);

        addLogEntry(state, 'ability_triggered', 'unlocked commander', {
          playerId: player.id,
        });
      }
    }
  }

  return unlocked;
}

/**
 * Check and unlock heroes for all players
 * Called when objectives are scored
 */
export function checkAllHeroUnlocks(state: GameState): string[] {
  const unlocked: string[] = [];

  for (const player of state.players) {
    if (!player.leaders?.hero.unlocked) {
      const scoredCount = player.scoredObjectives?.length || 0;
      if (scoredCount >= 3) {
        player.leaders!.hero.unlocked = true;
        unlocked.push(player.id);

        addLogEntry(state, 'ability_triggered', 'unlocked hero', {
          playerId: player.id,
        });
      }
    }
  }

  return unlocked;
}
