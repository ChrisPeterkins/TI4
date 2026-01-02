/**
 * Leader Action Validators
 * Validates agent, commander, and hero actions
 */

import type {
  GameState,
  UseAgentAction,
  PurgeHeroAction,
} from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { getLeaderAbility, FACTION_LEADERS } from '@ti4/shared';

/**
 * Validate using an agent ability
 */
export function validateUseAgent(
  state: GameState,
  action: UseAgentAction
): ValidationResult {
  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if player has leaders initialized
  if (!player.leaders) {
    return { valid: false, error: 'Leaders not initialized' };
  }

  // Check if agent is unlocked (agents start unlocked)
  if (!player.leaders.agent.unlocked) {
    return { valid: false, error: 'Agent is not unlocked' };
  }

  // Check if agent is already exhausted
  if (player.leaders.agent.exhausted) {
    return { valid: false, error: 'Agent is exhausted' };
  }

  // Get agent ability to check timing requirements
  const factionLeaders = FACTION_LEADERS[player.faction];
  if (!factionLeaders) {
    return { valid: false, error: 'Faction leaders not found' };
  }

  const ability = getLeaderAbility(factionLeaders.agent);
  if (!ability) {
    return { valid: false, error: 'Agent ability not defined' };
  }

  // If this is an ACTION: ability, it must be the action phase and player's turn
  if (ability.isComponentAction) {
    if (state.phase !== 'action') {
      return { valid: false, error: 'Agent action can only be used during action phase' };
    }
    if (state.subPhase !== 'awaiting_action') {
      return { valid: false, error: 'Agent action can only be used when awaiting action' };
    }
    if (state.activePlayerId !== action.playerId) {
      return { valid: false, error: 'Agent action can only be used on your turn' };
    }
  }

  // Check target player if required
  if (ability.canTargetOthers && action.targetPlayerId) {
    const targetPlayer = state.players.find((p) => p.id === action.targetPlayerId);
    if (!targetPlayer) {
      return { valid: false, error: 'Target player not found' };
    }
  }

  return { valid: true };
}

/**
 * Validate purging a hero (using hero ability)
 */
export function validatePurgeHero(
  state: GameState,
  action: PurgeHeroAction
): ValidationResult {
  const player = state.players.find((p) => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if player has leaders initialized
  if (!player.leaders) {
    return { valid: false, error: 'Leaders not initialized' };
  }

  // Check if hero is unlocked (requires 3 scored objectives)
  if (!player.leaders.hero.unlocked) {
    return { valid: false, error: 'Hero is not unlocked - score 3 objectives first' };
  }

  // Check if hero is already purged
  if (player.leaders.hero.purged) {
    return { valid: false, error: 'Hero has already been used' };
  }

  // Get hero ability to check if it's an ACTION
  const factionLeaders = FACTION_LEADERS[player.faction];
  if (!factionLeaders) {
    return { valid: false, error: 'Faction leaders not found' };
  }

  const ability = getLeaderAbility(factionLeaders.hero);
  if (!ability) {
    return { valid: false, error: 'Hero ability not defined' };
  }

  // If this is an ACTION: ability, it must be the action phase and player's turn
  if (ability.isComponentAction) {
    if (state.phase !== 'action') {
      return { valid: false, error: 'Hero action can only be used during action phase' };
    }
    if (state.subPhase !== 'awaiting_action') {
      return { valid: false, error: 'Hero action can only be used when awaiting action' };
    }
    if (state.activePlayerId !== action.playerId) {
      return { valid: false, error: 'Hero action can only be used on your turn' };
    }
  }

  return { valid: true };
}

/**
 * Check if a commander can be unlocked
 */
export function canUnlockCommander(
  state: GameState,
  playerId: string
): { canUnlock: boolean; reason?: string } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { canUnlock: false, reason: 'Player not found' };
  }

  // Check if already unlocked
  if (player.leaders?.commander.unlocked) {
    return { canUnlock: false, reason: 'Commander already unlocked' };
  }

  // Get commander ability to check unlock condition
  const factionLeaders = FACTION_LEADERS[player.faction];
  if (!factionLeaders) {
    return { canUnlock: false, reason: 'Faction leaders not found' };
  }

  const ability = getLeaderAbility(factionLeaders.commander);
  if (!ability || !ability.unlockCondition) {
    return { canUnlock: false, reason: 'Commander unlock condition not defined' };
  }

  const condition = ability.unlockCondition;

  switch (condition.type) {
    case 'control_planets': {
      const controlledCount = player.planets.length;
      if (controlledCount >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} planets, have ${controlledCount}` };
    }

    case 'control_mecatol': {
      // Find Mecatol Rex in the map
      const mecatolTile = state.map.tiles.find(t => t.systemId === 18);
      if (!mecatolTile) {
        return { canUnlock: false, reason: 'Mecatol Rex not found' };
      }
      const mecatolPlanet = mecatolTile.planets.find(p => p.planetId === 'mecatol_rex');
      if (mecatolPlanet?.controlledBy === playerId) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: 'Must control Mecatol Rex' };
    }

    case 'control_mecatol_or_combat': {
      // Winnu: Control Mecatol Rex or enter into combat in Mecatol Rex system
      const mecatolTile2 = state.map.tiles.find(t => t.systemId === 18);
      if (!mecatolTile2) {
        return { canUnlock: false, reason: 'Mecatol Rex not found' };
      }
      const mecatolPlanet2 = mecatolTile2.planets.find(p => p.planetId === 'mecatol_rex');
      if (mecatolPlanet2?.controlledBy === playerId) {
        return { canUnlock: true };
      }
      // Check if player has had combat in Mecatol system (tracked via flag)
      if (player.hadCombatInMecatol) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: 'Must control Mecatol Rex or fight in Mecatol system' };
    }

    case 'control_non_home_planets': {
      // Count planets in non-home systems
      let nonHomePlanetCount = 0;
      for (const tile of state.map.tiles) {
        // Home systems are typically systemId 1-17 (faction home systems)
        // Skip home system tiles (simplified check - home systems have systemId in specific ranges)
        const isHomeSystem = tile.systemId !== undefined && tile.systemId <= 17 && tile.systemId >= 1;
        if (!isHomeSystem) {
          for (const planet of tile.planets) {
            if (planet.controlledBy === playerId) {
              nonHomePlanetCount++;
            }
          }
        }
      }
      if (nonHomePlanetCount >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} non-home system planets, have ${nonHomePlanetCount}` };
    }

    case 'control_resources': {
      // Calculate total resources from controlled planets
      let totalResources = 0;
      for (const tile of state.map.tiles) {
        for (const planet of tile.planets) {
          if (planet.controlledBy === playerId) {
            totalResources += planet.resources || 0;
          }
        }
      }
      if (totalResources >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} total resources, have ${totalResources}` };
    }

    case 'control_influence': {
      // Calculate total influence from controlled planets
      let totalInfluence = 0;
      for (const tile of state.map.tiles) {
        for (const planet of tile.planets) {
          if (planet.controlledBy === playerId) {
            totalInfluence += planet.influence || 0;
          }
        }
      }
      if (totalInfluence >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} total influence, have ${totalInfluence}` };
    }

    case 'have_technologies': {
      const techCount = player.technologies?.length || 0;
      if (techCount >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} technologies, have ${techCount}` };
    }

    case 'have_trade_goods': {
      if (player.tradeGoods >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} trade goods, have ${player.tradeGoods}` };
    }

    case 'have_command_tokens': {
      const totalTokens = player.commandTokens.tactics + player.commandTokens.fleet + player.commandTokens.strategy;
      if (totalTokens >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} command tokens, have ${totalTokens}` };
    }

    case 'have_action_cards': {
      const cardCount = player.actionCards?.length || 0;
      if (cardCount >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} action cards, have ${cardCount}` };
    }

    case 'have_laws_in_play': {
      const lawCount = state.laws?.length || 0;
      if (lawCount >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} laws in play, have ${lawCount}` };
    }

    case 'have_units_total': {
      // Count units of specific type across all tiles
      let unitCount = 0;
      for (const tile of state.map.tiles) {
        for (const unit of tile.units) {
          if (unit.ownerId === playerId && unit.type === condition.unitType) {
            unitCount++;
          }
        }
        // Also count units on planets
        for (const planet of tile.planets) {
          for (const unit of planet.units) {
            if (unit.ownerId === playerId && unit.type === condition.unitType) {
              unitCount++;
            }
          }
        }
      }
      if (unitCount >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} ${condition.unitType}s, have ${unitCount}` };
    }

    case 'have_units_in_system': {
      // Check for X non-fighter ships in one system
      for (const tile of state.map.tiles) {
        const shipsInSystem = tile.units.filter(
          u => u.ownerId === playerId && isShipType(u.type) && u.type !== 'fighter'
        ).length;
        if (shipsInSystem >= condition.count) {
          return { canUnlock: true };
        }
      }
      return { canUnlock: false, reason: `Need ${condition.count} non-fighter ships in one system` };
    }

    case 'have_space_docks': {
      // Count space docks
      let dockCount = 0;
      for (const tile of state.map.tiles) {
        for (const planet of tile.planets) {
          for (const unit of planet.units) {
            if (unit.ownerId === playerId && unit.type === 'space_dock') {
              dockCount++;
            }
          }
        }
      }
      if (dockCount >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} space docks, have ${dockCount}` };
    }

    case 'have_pds': {
      // Count PDS
      let pdsCount = 0;
      for (const tile of state.map.tiles) {
        for (const planet of tile.planets) {
          for (const unit of planet.units) {
            if (unit.ownerId === playerId && unit.type === 'pds') {
              pdsCount++;
            }
          }
        }
      }
      if (pdsCount >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} PDS, have ${pdsCount}` };
    }

    case 'have_structures': {
      // Count structures (space docks and PDS)
      let structureCount = 0;
      for (const tile of state.map.tiles) {
        for (const planet of tile.planets) {
          for (const unit of planet.units) {
            if (unit.ownerId === playerId && (unit.type === 'space_dock' || unit.type === 'pds')) {
              structureCount++;
            }
          }
        }
      }
      if (structureCount >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} structures, have ${structureCount}` };
    }

    case 'have_scored_secrets': {
      // Count scored secret objectives
      const secretCount = player.scoredSecretObjectives?.length || 0;
      if (secretCount >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} scored secret objectives, have ${secretCount}` };
    }

    case 'have_mechs_in_systems': {
      // Count systems that have at least one mech
      const systemsWithMechs = new Set<string>();
      for (const tile of state.map.tiles) {
        for (const planet of tile.planets) {
          if (planet.units.some(u => u.ownerId === playerId && u.type === 'mech')) {
            systemsWithMechs.add(tile.id);
          }
        }
      }
      if (systemsWithMechs.size >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need mechs in ${condition.count} systems, have ${systemsWithMechs.size}` };
    }

    case 'units_in_wormhole_systems': {
      // Count wormhole systems that have player units
      let wormholeSystemsWithUnits = 0;
      for (const tile of state.map.tiles) {
        if (tile.wormhole && (tile.wormhole === 'alpha' || tile.wormhole === 'beta')) {
          const hasPlayerUnits = tile.units.some(u => u.ownerId === playerId) ||
            tile.planets.some(p => p.units.some(u => u.ownerId === playerId));
          if (hasPlayerUnits) {
            wormholeSystemsWithUnits++;
          }
        }
      }
      if (wormholeSystemsWithUnits >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need units in ${condition.count} wormhole systems, have ${wormholeSystemsWithUnits}` };
    }

    case 'neighbor_all_players': {
      // Check if player is neighbor to all other players
      // Two players are neighbors if they have units/planets in adjacent systems
      const otherPlayers = state.players.filter(p => p.id !== playerId);
      const playerSystems = new Set<string>();

      // Find all systems where player has units or controls planets
      for (const tile of state.map.tiles) {
        const hasPresence = tile.units.some(u => u.ownerId === playerId) ||
          tile.planets.some(p => p.controlledBy === playerId);
        if (hasPresence) {
          playerSystems.add(tile.id);
        }
      }

      // For now, simplified check - would need adjacency calculation
      // This is a placeholder that returns false for not implemented
      return { canUnlock: false, reason: 'Neighbor check not fully implemented' };
    }

    case 'units_in_others_home': {
      // Count how many other players' home systems contain your units
      let homeSystemsWithUnits = 0;
      for (const otherPlayer of state.players) {
        if (otherPlayer.id === playerId) continue;
        // Find other player's home system (this is faction-dependent)
        // For simplicity, check if player has units in tile with their name
        for (const tile of state.map.tiles) {
          // Home systems are typically tiles with just the faction's home planet
          const hasYourUnits = tile.units.some(u => u.ownerId === playerId) ||
            tile.planets.some(p => p.units.some(u => u.ownerId === playerId));
          // This is simplified - would need proper home system detection
          if (hasYourUnits) {
            // Check if this is a home system
            // TODO: Implement proper home system detection
          }
        }
      }
      if (homeSystemsWithUnits >= condition.playerCount) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need units in ${condition.playerCount} other players' home systems` };
    }

    case 'custom': {
      // Custom conditions need specific handlers
      return checkCustomUnlockCondition(state, playerId, condition.checkerId);
    }

    default:
      return { canUnlock: false, reason: 'Unknown unlock condition type' };
  }
}

/**
 * Check if a hero can be unlocked (3 objectives scored)
 */
export function canUnlockHero(
  state: GameState,
  playerId: string
): { canUnlock: boolean; reason?: string } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return { canUnlock: false, reason: 'Player not found' };
  }

  // Check if already unlocked
  if (player.leaders?.hero.unlocked) {
    return { canUnlock: false, reason: 'Hero already unlocked' };
  }

  // Count scored objectives (not VP, but actual objective cards)
  const scoredCount = player.scoredObjectives?.length || 0;

  if (scoredCount >= 3) {
    return { canUnlock: true };
  }

  return { canUnlock: false, reason: `Need 3 scored objectives, have ${scoredCount}` };
}

/**
 * Handle custom unlock conditions for specific factions
 */
function checkCustomUnlockCondition(
  state: GameState,
  playerId: string,
  checkerId: string
): { canUnlock: boolean; reason?: string } {
  switch (checkerId) {
    case 'creuss_wormhole_token':
      // Creuss: Have a wormhole token in a system
      // TODO: Implement when wormhole tokens are added
      return { canUnlock: false, reason: 'Wormhole token tracking not implemented' };

    case 'mentak_ambush_units':
      // Mentak: Have 2+ units with AMBUSH ability
      // Cruisers have AMBUSH
      return { canUnlock: false, reason: 'AMBUSH unit tracking not implemented' };

    case 'empyrean_frontier_tokens':
      // Empyrean: Have 2 frontier tokens
      return { canUnlock: false, reason: 'Frontier token tracking not implemented' };

    case 'naazrokha_relic_fragments':
      // Naaz-Rokha: Have 2 relic fragments
      const player = state.players.find(p => p.id === playerId);
      if (player?.relicFragments) {
        const totalFragments =
          player.relicFragments.cultural +
          player.relicFragments.industrial +
          player.relicFragments.hazardous +
          player.relicFragments.unknown;
        if (totalFragments >= 2) {
          return { canUnlock: true };
        }
      }
      return { canUnlock: false, reason: 'Need 2 relic fragments' };

    case 'titans_sleeper_tokens':
      // Titans: Have 2 sleeper tokens
      return { canUnlock: false, reason: 'Sleeper token tracking not implemented' };

    case 'cabal_captured_units':
      // Cabal: Have 2 captured units
      return { canUnlock: false, reason: 'Captured unit tracking not implemented' };

    case 'mahact_command_tokens':
      // Mahact: Have 2 other players' command tokens
      return { canUnlock: false, reason: 'Mahact command token tracking not implemented' };

    case 'keleres_influence':
      // Keleres: Have 12+ influence
      return { canUnlock: false, reason: 'Influence calculation not implemented' };

    default:
      return { canUnlock: false, reason: `Unknown custom condition: ${checkerId}` };
  }
}

/**
 * Helper to check if a unit type is a ship
 */
function isShipType(unitType: string): boolean {
  return ['carrier', 'cruiser', 'destroyer', 'dreadnought', 'flagship', 'war_sun', 'fighter'].includes(unitType);
}
