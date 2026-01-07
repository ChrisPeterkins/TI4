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
import { systems } from '@ti4/game-data';

// Build a lookup map for planet static data
const planetDataLookup: Map<string, { resources: number; influence: number }> = new Map();
for (const system of Object.values(systems)) {
  for (const planet of system.planets || []) {
    planetDataLookup.set(planet.id, {
      resources: planet.resources,
      influence: planet.influence,
    });
  }
}

/**
 * Get planet resources from static data
 */
function getPlanetResources(planetId: string): number {
  return planetDataLookup.get(planetId)?.resources || 0;
}

/**
 * Get planet influence from static data
 */
function getPlanetInfluence(planetId: string): number {
  return planetDataLookup.get(planetId)?.influence || 0;
}

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
            totalResources += getPlanetResources(planet.planetId);
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
            totalInfluence += getPlanetInfluence(planet.planetId);
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
      // Count scored secret objectives (secrets that appear in both secretObjectives and scoredObjectives)
      const scoredSecrets = player.secretObjectives?.filter(
        obj => player.scoredObjectives?.includes(obj)
      ).length || 0;
      if (scoredSecrets >= condition.count) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need ${condition.count} scored secret objectives, have ${scoredSecrets}` };
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
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { canUnlock: false, reason: 'Player not found' };
  }

  switch (checkerId) {
    case 'muaat_produced_war_sun': {
      // Muaat: Produce a War Sun
      if (player.producedWarSun) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: 'Must produce a War Sun' };
    }

    case 'yin_indoctrination_used': {
      // Yin: Use your Indoctrination faction ability
      if (player.usedFactionAbility?.['indoctrination']) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: 'Must use Indoctrination faction ability' };
    }

    case 'argent_ability_units': {
      // Argent: Have 6 units with ANTI-FIGHTER BARRAGE, SPACE CANNON, or BOMBARDMENT
      // Units with these abilities: Destroyer (AFB), PDS (Space Cannon), War Sun/Dreadnought (Bombardment)
      // Also: Cruiser has AFB with Argent faction ability, Fighters have AFB with Argent tech
      let abilityUnitCount = 0;
      for (const tile of state.map.tiles) {
        for (const unit of tile.units) {
          if (unit.ownerId === playerId && hasAbilityType(unit.type, player.faction)) {
            abilityUnitCount++;
          }
        }
        for (const planet of tile.planets) {
          for (const unit of planet.units) {
            if (unit.ownerId === playerId && hasAbilityType(unit.type, player.faction)) {
              abilityUnitCount++;
            }
          }
        }
      }
      if (abilityUnitCount >= 6) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need 6 units with AFB/SPACE CANNON/BOMBARDMENT, have ${abilityUnitCount}` };
    }

    case 'mahact_command_tokens': {
      // Mahact: Have 2 other players' command tokens in your fleet pool
      const totalCollected = Object.values(player.collectedCommandTokens || {}).reduce((sum, count) => sum + count, 0);
      if (totalCollected >= 2) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need 2 other players' command tokens, have ${totalCollected}` };
    }

    case 'cabal_gravity_rifts': {
      // Cabal: Have units in 3 systems that contain Gravity Rifts
      let gravityRiftSystemsWithUnits = 0;
      for (const tile of state.map.tiles) {
        if (tile.anomaly === 'gravity_rift') {
          const hasPlayerUnits = tile.units.some(u => u.ownerId === playerId) ||
            tile.planets.some(p => p.units.some(u => u.ownerId === playerId));
          if (hasPlayerUnits) {
            gravityRiftSystemsWithUnits++;
          }
        }
      }
      if (gravityRiftSystemsWithUnits >= 3) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need units in 3 Gravity Rift systems, have ${gravityRiftSystemsWithUnits}` };
    }

    case 'cabal_captured_units': {
      // Alternative Cabal condition: Have 2+ captured units
      const capturedCount = player.capturedUnits?.length || 0;
      if (capturedCount >= 2) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need 2 captured units, have ${capturedCount}` };
    }

    case 'keleres_component_action': {
      // Keleres: Spend 1 trade good after you play an action card that has a component action
      // This is tracked via usedFactionAbility
      if (player.usedFactionAbility?.['keleres_component_spent']) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: 'Must spend 1 TG after playing action card with component action' };
    }

    // ============================================
    // THUNDER'S EDGE FACTION UNLOCK CONDITIONS
    // ============================================

    case 'last_bastion_galvanized_units': {
      // Last Bastion: Have 3 galvanized units on the board
      const galvanizedCount = player.galvanizeTokens?.length || 0;
      if (galvanizedCount >= 3) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: `Need 3 galvanized units, have ${galvanizedCount}` };
    }

    case 'deepwrought_ocean_card': {
      // Deepwrought: Have an ocean card in play
      const hasOceanInPlay = (player.oceanCards?.length || 0) > 0;
      if (hasOceanInPlay) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: 'Must have an ocean card in play' };
    }

    case 'ral_nel_last_to_pass': {
      // Ral Nel: Be last to pass during an Action Phase
      // This is tracked via wasLastToPass flag set by the pass handler
      if (player.wasLastToPass) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: 'Must be last to pass during Action Phase' };
    }

    case 'crimson_rebellion_breach_placed': {
      // Crimson Rebellion: Place a breach token in a system that contains another player's unit
      // Check breachTokens on game state for any placed by this player
      const playerBreaches = state.breachTokens?.filter(bt => bt.placedBy === playerId) || [];
      if (playerBreaches.length > 0) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: 'Must place a breach token in a system with opponent units' };
    }

    case 'firmament_plot_card': {
      // Firmament: Have a plot card in play
      const hasPlotInPlay = (player.plotCardsInPlay?.length || 0) > 0;
      if (hasPlotInPlay) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: 'Must have a plot card in play' };
    }

    case 'obsidian_units_in_fracture': {
      // Obsidian: Have units in The Fracture (tiles 125, 126 or isFracture: true)
      const hasUnitsInFracture = state.map.tiles.some(tile => {
        // Check if this is a Fracture tile
        const isFractureTile = tile.systemId === 125 || tile.systemId === 126;
        if (!isFractureTile) return false;

        // Check for player units in space
        const hasSpaceUnits = tile.units.some(u => u.ownerId === playerId);
        // Check for player units on planets
        const hasPlanetUnits = tile.planets.some(p =>
          p.units.some(u => u.ownerId === playerId)
        );

        return hasSpaceUnits || hasPlanetUnits;
      });

      if (hasUnitsInFracture) {
        return { canUnlock: true };
      }
      return { canUnlock: false, reason: 'Must have units in The Fracture' };
    }

    // These are already handled by other condition types in the main function
    case 'creuss_wormhole_token': {
      // Creuss commander is 'units_in_wormhole_systems' - already handled
      return { canUnlock: false, reason: 'Use units_in_wormhole_systems condition' };
    }

    case 'empyrean_frontier_tokens': {
      // Empyrean commander is 'neighbor_all_players' - already handled
      return { canUnlock: false, reason: 'Use neighbor_all_players condition' };
    }

    case 'titans_sleeper_tokens': {
      // Titans commander is 'have_structures' - already handled
      return { canUnlock: false, reason: 'Use have_structures condition' };
    }

    default:
      return { canUnlock: false, reason: `Unknown custom condition: ${checkerId}` };
  }
}

/**
 * Check if a unit type has ANTI-FIGHTER BARRAGE, SPACE CANNON, or BOMBARDMENT
 */
function hasAbilityType(unitType: string, factionId: string): boolean {
  // Base units with abilities:
  // AFB: Destroyer
  // Space Cannon: PDS
  // Bombardment: Dreadnought, War Sun
  const baseAbilityUnits = ['destroyer', 'pds', 'dreadnought', 'war_sun'];

  if (baseAbilityUnits.includes(unitType)) {
    return true;
  }

  // Argent Flight specific: Destroyers gain enhanced AFB, Strike Wing Alpha (fighters) get AFB
  if (factionId === 'argent') {
    // Argent fighters have AFB with their faction tech
    if (unitType === 'fighter') {
      return true; // Assume Strike Wing Alpha is researched for counting purposes
    }
  }

  // L1Z1X: Dreadnought II gains Bombardment 5
  // Titans: Cruiser II gains Space Cannon 5
  // These are faction upgrades that add abilities

  return false;
}

/**
 * Helper to check if a unit type is a ship
 */
function isShipType(unitType: string): boolean {
  return ['carrier', 'cruiser', 'destroyer', 'dreadnought', 'flagship', 'war_sun', 'fighter'].includes(unitType);
}
