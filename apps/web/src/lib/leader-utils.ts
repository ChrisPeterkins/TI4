/**
 * Leader Utility Functions
 * Helpers for computing leader unlock progress and preparing leader data for display
 */

import {
  getLeaderAbility,
  getFactionLeaders,
  getLeaderName,
  type CommanderUnlockCondition,
} from '@ti4/shared';
import type { GameState, PlayerState, MapTile } from '@ti4/shared';
import type { LeaderCardData, UnlockProgress, LeaderType } from '@/components/game-board-3d/player-station/LeaderCardsDisplay3D';

/**
 * Compute unlock progress for a commander based on its unlock condition
 */
export function computeUnlockProgress(
  condition: CommanderUnlockCondition,
  player: PlayerState,
  gameState: GameState
): UnlockProgress | undefined {
  const tiles = gameState.map?.tiles || [];

  switch (condition.type) {
    case 'control_planets': {
      const count = tiles
        .flatMap(tile => tile.planets || [])
        .filter(p => p.controlledBy === player.id)
        .length;
      return {
        current: count,
        required: condition.count,
        description: condition.trait ? `${condition.trait} planets` : 'planets',
      };
    }

    case 'control_non_home_planets': {
      // For now, count all controlled planets (would need home system detection)
      const count = tiles
        .flatMap(tile => tile.planets || [])
        .filter(p => p.controlledBy === player.id)
        .length;
      return {
        current: count,
        required: condition.count,
        description: 'non-home planets',
      };
    }

    case 'control_resources':
    case 'control_influence': {
      // Would need static planet data lookup for resources/influence
      // Return placeholder for now
      return {
        current: 0,
        required: condition.count,
        description: condition.type === 'control_resources' ? 'total resources' : 'total influence',
      };
    }

    case 'have_technologies': {
      const techs = player.technologies || [];
      const count = condition.color
        ? techs.filter(t => t.startsWith(condition.color as string)).length
        : techs.length;
      return {
        current: count,
        required: condition.count,
        description: condition.color ? `${condition.color} technologies` : 'technologies',
      };
    }

    case 'have_trade_goods': {
      return {
        current: player.tradeGoods || 0,
        required: condition.count,
        description: 'trade goods',
      };
    }

    case 'have_action_cards': {
      return {
        current: player.actionCards?.length || 0,
        required: condition.count,
        description: 'action cards',
      };
    }

    case 'have_units_total': {
      let count = 0;
      tiles.forEach(tile => {
        // Count units in space
        tile.units?.filter(u => u.ownerId === player.id && u.type === condition.unitType)
          .forEach(() => count++);
        // Count units on planets
        tile.planets?.forEach(p => {
          p.units?.filter(u => u.ownerId === player.id && u.type === condition.unitType)
            .forEach(() => count++);
        });
      });
      return {
        current: count,
        required: condition.count,
        description: condition.unitType,
      };
    }

    case 'have_units_in_system': {
      let maxInSystem = 0;
      tiles.forEach(tile => {
        const inSystem = (tile.units || [])
          .filter(u => u.ownerId === player.id && u.type === condition.unitType)
          .length;
        maxInSystem = Math.max(maxInSystem, inSystem);
      });
      return {
        current: maxInSystem,
        required: condition.count,
        description: `${condition.unitType} in a system`,
      };
    }

    case 'have_space_docks': {
      let count = 0;
      tiles.forEach(tile => {
        tile.planets?.forEach(p => {
          p.units?.filter(u => u.ownerId === player.id && u.type === 'space_dock')
            .forEach(() => count++);
        });
      });
      return {
        current: count,
        required: condition.count,
        description: 'space docks',
      };
    }

    case 'have_structures': {
      let count = 0;
      tiles.forEach(tile => {
        tile.planets?.forEach(p => {
          p.units?.filter(u =>
            u.ownerId === player.id &&
            (u.type === 'space_dock' || u.type === 'pds')
          ).forEach(() => count++);
        });
      });
      return {
        current: count,
        required: condition.count,
        description: 'structures',
      };
    }

    case 'have_scored_secrets': {
      // Count secret objectives that appear in the scoredObjectives array
      const scoredSecrets = player.secretObjectives?.filter(
        obj => player.scoredObjectives?.includes(obj)
      ).length || 0;
      return {
        current: scoredSecrets,
        required: condition.count,
        description: 'scored secrets',
      };
    }

    case 'have_mechs_in_systems': {
      const systemsWithMechs = new Set<number>();
      tiles.forEach(tile => {
        tile.planets?.forEach(p => {
          if (p.units?.some(u => u.ownerId === player.id && u.type === 'mech')) {
            systemsWithMechs.add(tile.systemId);
          }
        });
      });
      return {
        current: systemsWithMechs.size,
        required: condition.count,
        description: 'systems with mechs',
      };
    }

    case 'units_in_wormhole_systems': {
      const wormholeSystems = new Set<number>();
      tiles.forEach(tile => {
        if (tile.wormhole === 'alpha' || tile.wormhole === 'beta') {
          const hasUnits = tile.units?.some(u => u.ownerId === player.id) ||
            tile.planets?.some(p => p.units?.some(u => u.ownerId === player.id));
          if (hasUnits) {
            wormholeSystems.add(tile.systemId);
          }
        }
      });
      return {
        current: wormholeSystems.size,
        required: condition.count,
        description: 'wormhole systems',
      };
    }

    case 'neighbor_all_players': {
      const neighbors = player.neighbors || [];
      const otherPlayers = gameState.players?.filter(p => p.id !== player.id).length || 0;
      return {
        current: neighbors.length,
        required: otherPlayers,
        description: 'neighbor players',
      };
    }

    // Custom conditions don't have quantifiable progress
    case 'custom':
    case 'control_mecatol':
    case 'control_mecatol_or_combat':
    default:
      return undefined;
  }
}

/**
 * Calculate the number of scored objectives for hero unlock
 * Heroes unlock after scoring 3 objectives (public or secret)
 */
export function getHeroUnlockProgress(player: PlayerState): UnlockProgress {
  // scoredObjectives contains all scored objectives (both public and secret)
  const totalScored = player.scoredObjectives?.length || 0;
  return {
    current: totalScored,
    required: 3,
    description: 'objectives scored',
  };
}

/**
 * Prepare leader card data for display from game state
 */
export function prepareLeaderCardsData(
  player: PlayerState,
  gameState: GameState
): LeaderCardData[] {
  const factionLeaders = getFactionLeaders(player.faction);
  if (!factionLeaders) return [];

  const leaders: LeaderCardData[] = [];
  const playerLeaders = player.leaders;

  // Default leader state when not defined
  const defaultLeaderState = {
    agent: { unlocked: true, exhausted: false },
    commander: { unlocked: false },
    hero: { unlocked: false, purged: false },
  };

  // Helper to add a leader
  const addLeader = (leaderId: string, type: LeaderType) => {
    const ability = getLeaderAbility(leaderId);
    // Get state by leader type (agent, commander, hero), not by leader ID
    const leaderState = playerLeaders?.[type] || defaultLeaderState[type];
    const state = {
      unlocked: leaderState.unlocked,
      exhausted: type === 'agent' ? (leaderState as { exhausted?: boolean }).exhausted || false : false,
      purged: type === 'hero' ? (leaderState as { purged?: boolean }).purged || false : false,
    };

    // Compute unlock progress for commanders
    let unlockProgress: UnlockProgress | undefined;
    if (type === 'commander' && ability?.unlockCondition && !state.unlocked) {
      unlockProgress = computeUnlockProgress(ability.unlockCondition, player, gameState);
    }
    if (type === 'hero' && !state.unlocked) {
      unlockProgress = getHeroUnlockProgress(player);
    }

    leaders.push({
      id: leaderId,
      name: getLeaderName(leaderId),
      type,
      state: {
        unlocked: state.unlocked,
        exhausted: state.exhausted,
        purged: state.purged,
        unlockProgress,
      },
      abilityDescription: ability?.description,
      canTargetOthers: ability?.canTargetOthers,
    });
  };

  // Add primary agent
  addLeader(factionLeaders.agent, 'agent');

  // Add additional agents for Nomad
  if (factionLeaders.agent2) {
    addLeader(factionLeaders.agent2, 'agent');
  }
  if (factionLeaders.agent3) {
    addLeader(factionLeaders.agent3, 'agent');
  }

  // Add commander and hero
  addLeader(factionLeaders.commander, 'commander');
  addLeader(factionLeaders.hero, 'hero');

  return leaders;
}
