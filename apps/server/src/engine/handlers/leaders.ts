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

  // Special case: Titans hero (Ul the Progenitor) attaches to Elysium instead of being purged
  const isTitansHero = ability.effect.type === 'custom' && ability.effect.handlerId === 'titans_hero';
  if (!isTitansHero) {
    // Purge the hero (mark as used)
    player.leaders!.hero.purged = true;
  }

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
  targetPlayerId?: string,
  context?: { systemId?: string; planetId?: string; unitId?: string }
): HandlerResult {
  const player = state.players.find((p) => p.id === playerId)!;
  const targetPlayer = targetPlayerId
    ? state.players.find((p) => p.id === targetPlayerId)
    : null;

  switch (handlerId) {
    case 'saar_agent': {
      // Gsooh Ii: Exhaust or ready a non-home planet (context required)
      // This is handled in the action - the effect is applied there
      return { success: true, triggeredEvents: ['planet_state_changed'] };
    }

    case 'letnev_agent': {
      // Viscount Unlenn: Gain 1 trade good or repair 1 ship
      // Default to gaining 1 trade good if no specific choice is made
      player.tradeGoods += 1;
      return { success: true, triggeredEvents: ['trade_goods_gained'] };
    }

    case 'creuss_agent': {
      // Emissary Taivra: Treat wormholes in the active system as connected
      // This modifies movement - effect is passive during tactical action
      return { success: true, triggeredEvents: ['wormhole_connection_enabled'] };
    }

    case 'mentak_agent': {
      // Suffi An: When player activates system with their ships, return command token
      // Effect applied during tactical activation
      if (targetPlayer) {
        targetPlayer.commandTokens.tactics += 1;
        return { success: true, triggeredEvents: ['command_token_returned'] };
      }
      return { success: true, triggeredEvents: ['agent_effect_applied'] };
    }

    case 'l1z1x_agent': {
      // I48S: Prevent a ship from being destroyed during combat
      // Effect applied during combat - marks the protection
      return { success: true, triggeredEvents: ['ship_protected'] };
    }

    case 'muaat_agent': {
      // Umbat: Allow production in system with war sun (after tactical activation)
      return { success: true, triggeredEvents: ['production_enabled'] };
    }

    case 'naalu_agent': {
      // Z'eu: Produce 1 hit against non-fighter ship in ground combat
      return { success: true, triggeredEvents: ['hit_produced'] };
    }

    case 'empyrean_agent': {
      // Acamar: Place trade good on planet to prevent production there
      return { success: true, triggeredEvents: ['production_blocked'] };
    }

    case 'nomad_agent': {
      // Artuno The Betrayer: Ships can move through systems with other players' ships
      // Effect is passive during movement
      return { success: true, triggeredEvents: ['movement_modified'] };
    }

    case 'titans_agent': {
      // Tungstantus: Counter 1 bombardment or space cannon hit
      // Effect applied during combat resolution
      return { success: true, triggeredEvents: ['hit_cancelled'] };
    }

    case 'cabal_agent': {
      // Nekro Malleon: Capture 1 destroyed non-fighter ship (during combat)
      // The capture is handled in combat resolution
      return { success: true, triggeredEvents: ['ship_captured'] };
    }

    case 'argent_agent': {
      // Trillossa Aun Mirik: Cancel 1 hit assigned to your units (combat)
      return { success: true, triggeredEvents: ['hit_cancelled'] };
    }

    case 'jolnar_agent': {
      // Doctor Sucaban: When researching, ignore 1 prerequisite
      // Effect modifies research action
      return { success: true, triggeredEvents: ['prerequisite_ignored'] };
    }

    case 'xxcha_agent': {
      // Ggrocuto Rinn: After agenda revealed, look at top 2 agenda cards and place back
      // Requires UI interaction
      return { success: true, triggeredEvents: ['agenda_cards_viewed'] };
    }

    case 'yssaril_agent': {
      // Ssruu: Look at a player's hand (action cards)
      if (targetPlayer) {
        // In actual game, this would show cards to the user
        return { success: true, triggeredEvents: ['hand_viewed'] };
      }
      return { success: false, error: 'Target player required' };
    }

    case 'naazrokha_agent': {
      // Garv and Guuc: Gain 1 trade good for each mech you control in that system
      return { success: true, triggeredEvents: ['trade_goods_gained'] };
    }

    case 'mahact_agent': {
      // Xander Alexin Victori III: Swap control of planets with same trait
      return { success: true, triggeredEvents: ['planets_swapped'] };
    }

    case 'keleres_agent': {
      // Tellurian (Mentak Keleres): Convert commodities to trade goods
      // Xander (Xxcha Keleres): Gain trade goods equal to another player's vote count
      // Garv (Argent Keleres): Gain trade goods for mechs
      if (targetPlayer) {
        targetPlayer.tradeGoods += targetPlayer.commodities;
        targetPlayer.commodities = 0;
        return { success: true, triggeredEvents: ['commodities_converted'] };
      }
      return { success: false, error: 'Target player required' };
    }

    case 'winnu_agent': {
      // Berekar Berekon: When producing in Mecatol system, produce up to 2 extra units
      return { success: true, triggeredEvents: ['production_bonus_applied'] };
    }

    case 'nekro_agent': {
      // Nekro Agate: After combat, copy technology from opponent
      return { success: true, triggeredEvents: ['technology_copied'] };
    }

    case 'arborec_agent': {
      // Letani Miasmiala: Produce 2 infantry in system with your units
      if (context?.systemId) {
        const tile = state.map.tiles.find(t => t.systemId?.toString() === context.systemId);
        if (tile && tile.planets.length > 0) {
          // Place infantry on first controlled planet
          const controlledPlanet = tile.planets.find(p => p.controlledBy === playerId);
          if (controlledPlanet) {
            controlledPlanet.units.push(createUnit('infantry', playerId));
            controlledPlanet.units.push(createUnit('infantry', playerId));
          }
        }
      }
      return { success: true, triggeredEvents: ['infantry_produced'] };
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
      // Dannel of the Tenth - Replace all opponent infantry on legendary/home planets with your infantry
      for (const tile of state.map.tiles) {
        // Check if this is a home system or contains legendary planets
        const isHomeSystem = tile.systemId <= 17 && tile.systemId >= 1;
        for (const planet of tile.planets) {
          const isLegendary = planet.attachments?.includes('legendary') || false;
          if (isHomeSystem || isLegendary) {
            // Replace all opponent infantry with player's infantry
            const opponentInfantry = planet.units.filter(
              u => u.type === 'infantry' && u.ownerId !== playerId
            );
            // Remove opponent infantry
            planet.units = planet.units.filter(
              u => !(u.type === 'infantry' && u.ownerId !== playerId)
            );
            // Add player's infantry
            for (let i = 0; i < opponentInfantry.length; i++) {
              planet.units.push(createUnit('infantry', playerId));
            }
          }
        }
      }
      return { success: true, triggeredEvents: ['infantry_replaced'] };
    }

    case 'jolnar_hero': {
      // Rin, The Master's Legacy - Research 3 technologies
      // This requires UI interaction to select technologies
      // For now, mark as successful - actual tech selection happens in UI
      return { success: true, triggeredEvents: ['technologies_to_research'] };
    }

    case 'nekro_hero': {
      // Nekro Virus - Research 2 technologies from other players
      // This requires selecting technologies owned by opponents
      return { success: true, triggeredEvents: ['technologies_to_copy'] };
    }

    case 'xxcha_hero': {
      // Xxekir Grom - Resolve the agenda as if you cast all votes
      // Applied during agenda resolution
      return { success: true, triggeredEvents: ['agenda_controlled'] };
    }

    case 'yssaril_hero': {
      // So Ata - Look at all action card hands, take 1 card, give 1 card
      // Requires complex UI interaction
      return { success: true, triggeredEvents: ['hands_viewed'] };
    }

    case 'mahact_hero': {
      // Il Na Vansen - Purge opponent command tokens for trade goods
      // Each purged token grants 1 trade good
      const tokensToGain = Object.values(player.collectedCommandTokens || {})
        .reduce((sum, count) => sum + count, 0);
      player.tradeGoods += tokensToGain;
      player.collectedCommandTokens = {};
      return { success: true, triggeredEvents: ['tokens_purged'] };
    }

    case 'nomad_hero': {
      // Memoria I/II - Place flagship in any system, may move units to it
      // Requires system selection in UI
      return { success: true, triggeredEvents: ['flagship_placed'] };
    }

    case 'titans_hero': {
      // Ul the Progenitor - Attach to Elysium (instead of purging)
      // Special case: hero doesn't get purged
      // Find Elysium planet and attach the hero
      for (const tile of state.map.tiles) {
        const elysium = tile.planets.find(p => p.planetId === 'elysium');
        if (elysium) {
          if (!elysium.attachments) {
            elysium.attachments = [];
          }
          elysium.attachments.push('titans_hero');
          // Don't purge - handled specially in handlePurgeHero
          return { success: true, triggeredEvents: ['hero_attached'] };
        }
      }
      return { success: true, triggeredEvents: ['hero_effect_applied'] };
    }

    case 'cabal_hero': {
      // The Stillness of Stars - Capture all non-structure enemy units on your planets
      for (const tile of state.map.tiles) {
        for (const planet of tile.planets) {
          if (planet.controlledBy === playerId) {
            const unitsToCapture = planet.units.filter(
              u => u.ownerId !== playerId && u.type !== 'space_dock' && u.type !== 'pds'
            );
            // Move units to captured units
            for (const unit of unitsToCapture) {
              if (!player.capturedUnits) {
                player.capturedUnits = [];
              }
              player.capturedUnits.push({
                id: unit.id,
                type: unit.type,
                ownerId: playerId,
                damaged: unit.damaged,
                originalOwnerId: unit.ownerId,
              });
            }
            // Remove captured units from planet
            planet.units = planet.units.filter(
              u => u.ownerId === playerId || u.type === 'space_dock' || u.type === 'pds'
            );
          }
        }
      }
      return { success: true, triggeredEvents: ['units_captured'] };
    }

    case 'empyrean_hero': {
      // Conservator Procyon - Place Shield Paling token that blocks ship movement
      // Requires system selection
      return { success: true, triggeredEvents: ['shield_paling_placed'] };
    }

    case 'naazrokha_hero': {
      // Hesh and Prit - Gain 1 relic and explore 3 planets
      // Draw relic
      const relic = state.relicDeck?.shift();
      if (relic) {
        if (!player.relics) {
          player.relics = [];
        }
        player.relics.push(relic);
      }
      // Explore 3 planets - requires planet selection
      return { success: true, triggeredEvents: ['relic_gained', 'planets_to_explore'] };
    }

    case 'argent_hero': {
      // Mirik Aun Sissiri - Look at top 10 agenda cards, choose 2 to resolve
      // Complex agenda manipulation
      return { success: true, triggeredEvents: ['agendas_chosen'] };
    }

    case 'creuss_hero': {
      // Ixthian the Xeno - Place Creuss Gate in a non-home system
      // Requires system selection
      return { success: true, triggeredEvents: ['creuss_gate_placed'] };
    }

    case 'letnev_hero': {
      // Darktalon Treilla - Place Dark Talon token, system is adjacent to all systems
      // Requires system selection
      return { success: true, triggeredEvents: ['dark_talon_placed'] };
    }

    case 'keleres_hero': {
      // Odlynn Myrr - Discard a law in play and choose new outcome
      // Requires law selection
      return { success: true, triggeredEvents: ['law_replaced'] };
    }

    case 'mentak_hero': {
      // Iperia Ixth - Gain trade goods equal to resources+influence of planets in system
      if (targets?.systemId) {
        const tile = state.map.tiles.find(t => t.systemId?.toString() === targets.systemId);
        if (tile) {
          let total = 0;
          for (const planet of tile.planets) {
            // Would need planet data to get resource/influence values
            total += 2; // Placeholder - need actual planet data lookup
          }
          player.tradeGoods += total;
        }
      }
      return { success: true, triggeredEvents: ['trade_goods_gained'] };
    }

    case 'muaat_hero': {
      // Adjudicator Ba'al - Place war sun in system with your infantry
      // Requires system selection
      return { success: true, triggeredEvents: ['war_sun_to_place'] };
    }

    case 'naalu_hero': {
      // The Oracle - Other players cannot play action cards this round
      // Set a flag on game state
      return { success: true, triggeredEvents: ['action_cards_blocked'] };
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
