import type {
  GameState,
  GameAction,
  PlayerState,
  PickStrategyCardAction,
  PassAction,
  StrategicAction,
  StrategicPrimaryAction,
  StrategicPrimaryChoices,
  StrategicSecondaryAction,
  StrategicSecondaryChoices,
  TacticalAction,
  MoveUnitsAction,
  ProduceUnitsAction,
  SkipMovementAction,
  SkipProductionAction,
  AssignHitsAction,
  AnnounceRetreatAction,
  SelectInvasionTargetsAction,
  CommitGroundForcesAction,
  SkipBombardmentAction,
  SkipInvasionAction,
  CastVoteAction,
  ScoreObjectiveAction,
  SkipScoringAction,
  SelectSecretObjectiveAction,
  TimingWindowResponseAction,
  HexCoord,
  MapTile,
  UnitInstance,
  UnitType,
  RedistributeTokensAction,
} from '@ti4/shared';
import { systems, factions, technologies } from '@ti4/game-data';
import { findTileAtPosition, getAdjacentPositions, hexDistance, findPathWithAbilities } from './utils/hex.js';
import { getUnitMoveValue, isShipType, isGroundUnit, getUnitCapacity, countsTowardsFleetSupply } from './utils/units.js';
import { getAvailableTechnologies } from './handlers/technology.js';
import { checkObjectiveRequirement } from './utils/objectives.js';

/**
 * Bot difficulty levels
 */
export type BotDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Check if a player is a bot based on game player records
 */
export function isBot(_gameState: GameState, playerId: string, botPlayerIds: Set<string>): boolean {
  return botPlayerIds.has(playerId);
}

/**
 * Get the current bot that needs to act (either active player or secondary responder)
 */
export function getCurrentBotPlayerId(
  gameState: GameState,
  botPlayerIds: Set<string>
): string | null {
  // Check if we're in secondary phase and a bot needs to respond
  if (gameState.subPhase === 'strategic_secondary' && gameState.strategicActionState) {
    const tracking = gameState.strategicActionState;
    const currentResponderId = tracking.secondaryOrder[tracking.currentSecondaryIndex];
    if (currentResponderId && botPlayerIds.has(currentResponderId)) {
      return currentResponderId;
    }
  }

  // Check for combat sub-phases where any bot participant needs to act
  if (gameState.activeCombat) {
    const combat = gameState.activeCombat;
    // Determine who needs to act based on combat state
    const currentActorId = getCombatCurrentActor(combat, gameState);
    if (currentActorId && botPlayerIds.has(currentActorId)) {
      return currentActorId;
    }
  }

  // Check invasion phase
  if (gameState.invasionPhase) {
    // The active player handles invasion
    if (botPlayerIds.has(gameState.activePlayerId)) {
      return gameState.activePlayerId;
    }
  }

  // Check timing windows
  if (gameState.activeTimingWindow) {
    const window = gameState.activeTimingWindow;
    // Find first eligible player who hasn't responded
    for (const eligibleId of window.eligiblePlayers) {
      if (window.responses[eligibleId] === 'pending' && botPlayerIds.has(eligibleId)) {
        return eligibleId;
      }
    }
  }

  // Check agenda voting
  if (gameState.phase === 'agenda' && gameState.agendaPhase) {
    const agenda = gameState.agendaPhase;
    if (agenda.votingOrder && agenda.currentVoterIndex !== undefined) {
      const currentVoterId = agenda.votingOrder[agenda.currentVoterIndex];
      if (currentVoterId && botPlayerIds.has(currentVoterId)) {
        return currentVoterId;
      }
    }
  }

  // Check status phase scoring
  if (gameState.phase === 'status' && gameState.statusPhase) {
    const status = gameState.statusPhase;
    // Find first player who hasn't completed scoring
    for (const player of gameState.players) {
      if (!status.scoringComplete.includes(player.id) && botPlayerIds.has(player.id)) {
        return player.id;
      }
    }
  }

  // Otherwise check if active player is a bot
  if (botPlayerIds.has(gameState.activePlayerId)) {
    return gameState.activePlayerId;
  }

  return null;
}

/**
 * Determine who needs to act in combat based on state
 */
function getCombatCurrentActor(combat: GameState['activeCombat'], gameState: GameState): string | null {
  if (!combat) return null;

  // In hit assignment, both players might need to assign
  if (combat.state === 'combat_round_assign') {
    if (combat.pendingHits.attacker > 0) return combat.attackerId;
    if (combat.pendingHits.defender > 0) return combat.defenderId;
  }

  // In announce retreat, attacker decides first typically
  if (combat.state === 'announce_retreat') {
    if (!combat.retreatAnnounced.attacker) return combat.attackerId;
    if (!combat.retreatAnnounced.defender) return combat.defenderId;
  }

  // For other states, active player handles it
  return gameState.activePlayerId;
}

/**
 * Generate a bot action for the current game state
 */
export function generateBotAction(
  gameState: GameState,
  playerId: string,
  _difficulty: BotDifficulty = 'medium'
): GameAction | null {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return null;

  // Handle timing windows first
  if (gameState.activeTimingWindow) {
    return generateTimingWindowResponse(gameState, player);
  }

  switch (gameState.phase) {
    case 'setup':
      return generateSetupPhaseAction(gameState, player);
    case 'strategy':
      return generateStrategyPhaseAction(gameState, player);
    case 'action':
      return generateActionPhaseAction(gameState, player);
    case 'status':
      return generateStatusPhaseAction(gameState, player);
    case 'agenda':
      return generateAgendaPhaseAction(gameState, player);
    default:
      return null;
  }
}

/**
 * Calculate delay for bot action (to feel more natural)
 */
export function getBotActionDelay(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case 'easy':
      return 2000 + Math.random() * 1000;
    case 'medium':
      return 1000 + Math.random() * 1000;
    case 'hard':
      return 500 + Math.random() * 500;
    default:
      return 1500;
  }
}

// ============================================================================
// SETUP PHASE
// ============================================================================

function generateSetupPhaseAction(gameState: GameState, player: PlayerState): SelectSecretObjectiveAction | null {
  // During setup, bots need to select which secret objective to keep
  if (player.secretObjectives.length !== 2) {
    return null; // Already selected or no secrets to select from
  }

  // Simple heuristic: pick the first secret objective
  // A more sophisticated bot would evaluate which objective is easier to score
  const selectedObjectiveId = player.secretObjectives[0];
  const discardedObjectiveId = player.secretObjectives[1];

  return {
    type: 'select_secret_objective',
    playerId: player.id,
    timestamp: Date.now(),
    selectedObjectiveId,
    discardedObjectiveId,
  };
}

// ============================================================================
// STRATEGY PHASE
// ============================================================================

function generateStrategyPhaseAction(gameState: GameState, player: PlayerState): PickStrategyCardAction | null {
  if (player.strategyCard !== null) return null;

  const availableCards = gameState.strategyCards.filter(card => !card.pickedBy);
  if (availableCards.length === 0) return null;

  const cardPriority: Record<number, number> = {
    8: 10, // Imperial
    4: 9,  // Construction
    5: 8,  // Trade
    6: 7,  // Warfare
    2: 6,  // Diplomacy
    7: 5,  // Technology
    3: 4,  // Politics
    1: 3,  // Leadership
  };

  const sortedCards = [...availableCards].sort((a, b) => {
    const priorityA = cardPriority[a.number] ?? 0;
    const priorityB = cardPriority[b.number] ?? 0;
    return priorityB - priorityA;
  });

  return {
    type: 'pick_strategy_card',
    playerId: player.id,
    timestamp: Date.now(),
    cardNumber: sortedCards[0].number,
  };
}

// ============================================================================
// ACTION PHASE
// ============================================================================

function generateActionPhaseAction(gameState: GameState, player: PlayerState): GameAction | null {
  const subPhase = gameState.subPhase;

  // Handle combat
  if (gameState.activeCombat) {
    const currentActor = getCombatCurrentActor(gameState.activeCombat, gameState);
    if (currentActor === player.id) {
      return generateCombatAction(gameState, player);
    }
  }

  // Handle invasion
  if (gameState.invasionPhase && gameState.activePlayerId === player.id) {
    return generateInvasionAction(gameState, player);
  }

  // Handle strategic secondary phase
  if (subPhase === 'strategic_secondary' && gameState.strategicActionState) {
    const tracking = gameState.strategicActionState;
    const currentResponderId = tracking.secondaryOrder[tracking.currentSecondaryIndex];
    if (currentResponderId === player.id) {
      return generateSecondaryAction(gameState, player, tracking.cardNumber);
    }
    return null;
  }

  // Check if it's our turn
  if (gameState.activePlayerId !== player.id) {
    return null;
  }

  if (player.passed) {
    return null;
  }

  switch (subPhase) {
    case 'awaiting_action':
      return generateTurnAction(gameState, player);

    case 'strategic_primary':
      return generateStrategicPrimaryAction(gameState, player);

    case 'tactical_movement':
      return generateMovementAction(gameState, player);

    case 'tactical_production':
      return generateProductionAction(gameState, player);

    default:
      return null;
  }
}

/**
 * Generate a turn action (when it's the bot's turn to act)
 */
function generateTurnAction(gameState: GameState, player: PlayerState): GameAction {
  // Priority order:
  // 1. Take tactical actions while we have tokens and targets
  // 2. Use strategy card if not used
  // 3. Pass

  // Try tactical action first if we have tokens
  if (player.commandTokens.tactics > 0) {
    const tacticalAction = generateTacticalActionChoice(gameState, player);
    if (tacticalAction) {
      return tacticalAction;
    }
  }

  // Use strategy card if not used
  if (player.strategyCard !== null && !player.strategyCardUsed) {
    return {
      type: 'strategic_action',
      playerId: player.id,
      timestamp: Date.now(),
      cardNumber: player.strategyCard,
    } as StrategicAction;
  }

  // Pass
  return {
    type: 'pass',
    playerId: player.id,
    timestamp: Date.now(),
  } as PassAction;
}

// ============================================================================
// TACTICAL ACTIONS
// ============================================================================

function generateTacticalActionChoice(gameState: GameState, player: PlayerState): TacticalAction | null {
  // Find valuable systems to activate
  const candidates: { tile: MapTile; score: number }[] = [];

  for (const tile of gameState.map.tiles) {
    // Skip systems we already activated
    if (tile.commandTokens.includes(player.id)) continue;

    // Skip empty space tiles
    if (tile.planets.length === 0 && tile.units.length === 0) continue;

    const score = calculateSystemValue(gameState, tile, player);
    if (score > 0) {
      candidates.push({ tile, score });
    }
  }

  // Sort by score and pick highest
  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    return null;
  }

  // Check if we can reach the best target with any ships
  for (const candidate of candidates) {
    const canReach = canReachSystem(gameState, player, candidate.tile);
    if (canReach) {
      return {
        type: 'tactical_action',
        playerId: player.id,
        timestamp: Date.now(),
        systemPosition: candidate.tile.position,
      };
    }
  }

  // If we can't reach any targets but have production in a system, activate for production
  const productionSystem = findBestProductionSystem(gameState, player);
  if (productionSystem && !productionSystem.commandTokens.includes(player.id)) {
    return {
      type: 'tactical_action',
      playerId: player.id,
      timestamp: Date.now(),
      systemPosition: productionSystem.position,
    };
  }

  return null;
}

function calculateSystemValue(gameState: GameState, tile: MapTile, player: PlayerState): number {
  let value = 0;

  // Planet value
  for (const planet of tile.planets) {
    const planetData = findPlanetData(planet.planetId);
    const planetValue = (planetData?.resources || 0) + (planetData?.influence || 0);

    if (planet.controlledBy === null) {
      // Unclaimed planet - high value
      value += planetValue * 2;
    } else if (planet.controlledBy !== player.id) {
      // Enemy planet - value depends on our strength
      value += planetValue * 0.5;
    }
  }

  // Mecatol Rex bonus
  if (tile.systemId === 18) {
    value += 15;
  }

  // Wormhole bonus
  if (tile.wormhole) {
    value += 2;
  }

  // Already have units there - lower value (already controlled)
  const hasOwnUnits = tile.units.some(u => u.ownerId === player.id) ||
    tile.planets.some(p => p.units.some(u => u.ownerId === player.id));
  if (hasOwnUnits) {
    value *= 0.3;
  }

  // Add objective-based bonuses
  value += calculateObjectiveBonus(gameState, tile, player);

  return value;
}

/**
 * Calculate bonus value for a system based on revealed objectives
 */
function calculateObjectiveBonus(gameState: GameState, tile: MapTile, player: PlayerState): number {
  let bonus = 0;

  // Get revealed public objectives
  const revealedObjectives = [
    ...gameState.objectives.publicStageI.filter(o => o.revealed),
    ...gameState.objectives.publicStageII.filter(o => o.revealed),
  ];

  // Also consider player's secret objectives
  const secretObjectives = player.secretObjectives || [];

  // Count current state for comparison
  const controlledPlanets = countControlledPlanets(gameState, player.id);
  const techSpecialtyPlanets = countTechSpecialtyPlanets(gameState, player.id);
  const traitCounts = countPlanetTraits(gameState, player.id);

  for (const objInstance of revealedObjectives) {
    // Skip if already scored
    if (player.scoredObjectives?.includes(objInstance.id)) continue;

    // Get objective data
    const objectiveId = objInstance.id;

    // "Expand Borders" - Control 6 planets in non-home systems
    if (objectiveId === 'expand_borders') {
      const isNonHome = !isPlayerHomeSystem(tile, player);
      if (isNonHome && tile.planets.length > 0) {
        const hasUnclaimedPlanets = tile.planets.some(p => p.controlledBy !== player.id);
        if (hasUnclaimedPlanets && controlledPlanets.nonHome < 6) {
          bonus += 5; // High priority if we need more planets
        }
      }
    }

    // "Found Research Outposts" - Control 3 planets with tech specialties
    if (objectiveId === 'found_research_outposts') {
      for (const planet of tile.planets) {
        if (planet.controlledBy !== player.id) {
          const planetData = findPlanetData(planet.planetId);
          if (planetData?.techSpecialty && techSpecialtyPlanets < 3) {
            bonus += 6; // Tech specialty planets are valuable
          }
        }
      }
    }

    // "Corner the Market" / "Unify the Colonies" - Control 4+ planets with same trait
    if (objectiveId === 'corner_the_market' || objectiveId === 'unify_the_colonies') {
      for (const planet of tile.planets) {
        if (planet.controlledBy !== player.id) {
          const planetData = findPlanetData(planet.planetId);
          if (planetData?.trait) {
            const currentCount = traitCounts[planetData.trait] || 0;
            // Bonus if this trait is close to threshold
            if (currentCount >= 2 && currentCount < 4) {
              bonus += 4;
            }
          }
        }
      }
    }

    // "Intimidate Council" - Ships in 2 systems adjacent to Mecatol
    if (objectiveId === 'intimidate_council') {
      if (isAdjacentToMecatol(tile)) {
        bonus += 4;
      }
    }

    // "Control the Borderlands" - Control 5 planets in non-home systems, same trait
    if (objectiveId === 'control_the_borderlands') {
      const isNonHome = !isPlayerHomeSystem(tile, player);
      if (isNonHome && tile.planets.length > 0) {
        bonus += 3;
      }
    }

    // Stage II: "Hold Vast Reserves" - Spend 6/6/6
    // Not directly system-related, skip

    // Stage II: "Establish a Perimeter" - Control 4 planets with structures
    if (objectiveId === 'establish_a_perimeter') {
      // Prioritize systems we already control (for building)
      const hasOurPlanet = tile.planets.some(p => p.controlledBy === player.id);
      if (hasOurPlanet) {
        bonus += 2;
      }
    }

    // "Become a Legend" - Have units in 4 special systems (legendary, anomaly, Mecatol)
    if (objectiveId === 'become_a_legend' || objectiveId === 'explore_deep_space') {
      const system = systems[tile.systemId];
      if (system) {
        const isSpecial = system.anomaly ||
          system.type === 'mecatol' ||
          system.planets?.some(p => p.legendary);
        if (isSpecial) {
          bonus += 5;
        }
      }
    }

    // "Discover Lost Outposts" - Control 3 legendary planets or planets with attachments
    if (objectiveId === 'discover_lost_outposts') {
      for (const planet of tile.planets) {
        if (planet.controlledBy !== player.id) {
          const planetData = findPlanetData(planet.planetId);
          if (planetData?.legendary) {
            bonus += 8; // Legendary planets are very valuable
          }
        }
      }
    }
  }

  // Check if adjacent to Mecatol (always valuable for positioning)
  if (isAdjacentToMecatol(tile)) {
    bonus += 2;
  }

  return bonus;
}

/**
 * Check if a tile is adjacent to Mecatol Rex
 */
function isAdjacentToMecatol(tile: MapTile): boolean {
  // Mecatol is at center (0, 0)
  const mecatolPos = { q: 0, r: 0 };
  const distance = hexDistance(tile.position, mecatolPos);
  return distance === 1;
}

/**
 * Check if a tile is the player's home system
 */
function isPlayerHomeSystem(tile: MapTile, player: PlayerState): boolean {
  const faction = factions[player.faction];
  if (!faction) return false;
  return tile.systemId === faction.homeSystemId;
}

/**
 * Count planets controlled by player in different categories
 */
function countControlledPlanets(gameState: GameState, playerId: string): { total: number; nonHome: number } {
  let total = 0;
  let nonHome = 0;

  const player = gameState.players.find(p => p.id === playerId);
  const faction = player ? factions[player.faction] : null;
  const homeSystemId = faction?.homeSystemId;

  for (const tile of gameState.map.tiles) {
    const isHome = tile.systemId === homeSystemId;
    for (const planet of tile.planets) {
      if (planet.controlledBy === playerId) {
        total++;
        if (!isHome) {
          nonHome++;
        }
      }
    }
  }

  return { total, nonHome };
}

/**
 * Count planets with tech specialties controlled by player
 */
function countTechSpecialtyPlanets(gameState: GameState, playerId: string): number {
  let count = 0;

  for (const tile of gameState.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.controlledBy === playerId) {
        const planetData = findPlanetData(planet.planetId);
        if (planetData?.techSpecialty) {
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Count planets by trait for the player
 */
function countPlanetTraits(gameState: GameState, playerId: string): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const tile of gameState.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.controlledBy === playerId) {
        const planetData = findPlanetData(planet.planetId);
        if (planetData?.trait) {
          counts[planetData.trait] = (counts[planetData.trait] || 0) + 1;
        }
      }
    }
  }

  return counts;
}

function canReachSystem(gameState: GameState, player: PlayerState, targetTile: MapTile): boolean {
  // Check if any of our ships can reach this system
  for (const tile of gameState.map.tiles) {
    if (tile.commandTokens.includes(player.id)) continue; // Can't move from activated systems

    for (const unit of tile.units) {
      if (unit.ownerId !== player.id) continue;
      if (!isShipType(unit.type)) continue;

      const moveValue = getUnitMoveValue(unit.type, player);
      const path = findPathWithAbilities(gameState, player.id, tile.position, targetTile.position, moveValue);
      if (path) {
        return true;
      }
    }
  }

  return false;
}

function findBestProductionSystem(gameState: GameState, player: PlayerState): MapTile | null {
  let bestSystem: MapTile | null = null;
  let bestValue = 0;

  for (const tile of gameState.map.tiles) {
    // Check if we have a space dock here
    const hasSpaceDock = tile.planets.some(p =>
      p.units.some(u => u.ownerId === player.id && u.type === 'space_dock')
    );

    if (!hasSpaceDock) continue;

    // Calculate production value (planet resources nearby)
    let productionValue = 0;
    for (const planet of tile.planets) {
      if (planet.controlledBy === player.id) {
        const planetData = findPlanetData(planet.planetId);
        productionValue += planetData?.resources || 0;
      }
    }

    if (productionValue > bestValue) {
      bestValue = productionValue;
      bestSystem = tile;
    }
  }

  return bestSystem;
}

// ============================================================================
// MOVEMENT
// ============================================================================

function generateMovementAction(gameState: GameState, player: PlayerState): MoveUnitsAction | SkipMovementAction {
  if (!gameState.activatedSystem) {
    return { type: 'skip_movement', playerId: player.id, timestamp: Date.now() };
  }

  const targetTile = findTileAtPosition(gameState.map, gameState.activatedSystem);
  if (!targetTile) {
    return { type: 'skip_movement', playerId: player.id, timestamp: Date.now() };
  }

  const moves: MoveUnitsAction['moves'] = [];

  // Find ships that can reach the target
  for (const tile of gameState.map.tiles) {
    if (tile.position.q === targetTile.position.q && tile.position.r === targetTile.position.r) continue;
    if (tile.commandTokens.includes(player.id)) continue;

    const shipsToMove: UnitInstance[] = [];
    const groundUnits: UnitInstance[] = [];
    const fighters: UnitInstance[] = [];

    // Collect units
    for (const unit of tile.units) {
      if (unit.ownerId !== player.id) continue;

      if (isShipType(unit.type) && unit.type !== 'fighter') {
        const moveValue = getUnitMoveValue(unit.type, player);
        const path = findPathWithAbilities(gameState, player.id, tile.position, targetTile.position, moveValue);
        if (path) {
          shipsToMove.push(unit);
        }
      } else if (unit.type === 'fighter') {
        fighters.push(unit);
      }
    }

    // Collect ground units from planets
    for (const planet of tile.planets) {
      for (const unit of planet.units) {
        if (unit.ownerId === player.id && isGroundUnit(unit.type)) {
          groundUnits.push(unit);
        }
      }
    }

    // Add ship moves
    for (const ship of shipsToMove) {
      moves.push({
        unitId: ship.id,
        from: { systemPosition: tile.position },
        to: { systemPosition: targetTile.position },
      });
    }

    // Add carried units (assign to carriers)
    const carriers = shipsToMove.filter(s => getUnitCapacity(s.type, player) > 0);
    let carrierIndex = 0;
    let capacityUsed = 0;

    for (const unit of [...fighters, ...groundUnits]) {
      if (carrierIndex >= carriers.length) break;

      const carrier = carriers[carrierIndex];
      const maxCapacity = getUnitCapacity(carrier.type, player);

      if (capacityUsed >= maxCapacity) {
        carrierIndex++;
        capacityUsed = 0;
        if (carrierIndex >= carriers.length) break;
      }

      const fromLocation = unit.planetId
        ? { systemPosition: tile.position, planetId: unit.planetId }
        : { systemPosition: tile.position };

      moves.push({
        unitId: unit.id,
        from: fromLocation,
        to: { systemPosition: targetTile.position },
        carrier: carriers[carrierIndex].id,
      });

      capacityUsed++;
    }
  }

  if (moves.length === 0) {
    return { type: 'skip_movement', playerId: player.id, timestamp: Date.now() };
  }

  return {
    type: 'move_units',
    playerId: player.id,
    timestamp: Date.now(),
    moves,
  };
}

// ============================================================================
// PRODUCTION
// ============================================================================

function generateProductionAction(gameState: GameState, player: PlayerState): ProduceUnitsAction | SkipProductionAction {
  if (!gameState.activatedSystem) {
    return { type: 'skip_production', playerId: player.id, timestamp: Date.now() };
  }

  const tile = findTileAtPosition(gameState.map, gameState.activatedSystem);
  if (!tile) {
    return { type: 'skip_production', playerId: player.id, timestamp: Date.now() };
  }

  // Check for space dock
  let spaceDockPlanet: string | undefined;
  for (const planet of tile.planets) {
    if (planet.units.some(u => u.ownerId === player.id && u.type === 'space_dock')) {
      spaceDockPlanet = planet.planetId;
      break;
    }
  }

  if (!spaceDockPlanet) {
    return { type: 'skip_production', playerId: player.id, timestamp: Date.now() };
  }

  // Calculate available resources
  const availableResources = calculateAvailableResources(gameState, player);
  if (availableResources === 0) {
    return { type: 'skip_production', playerId: player.id, timestamp: Date.now() };
  }

  // Analyze current situation
  const analysis = analyzeProductionNeeds(gameState, player, tile);
  const units: { type: UnitType; count: number }[] = [];
  let resourcesRemaining = availableResources;

  // Calculate production capacity
  const productionCapacity = calculateProductionCapacity(tile, player);
  let unitsProduced = 0;

  const fleetSupply = calculateFleetSupply(player);
  const totalFleet = countTotalFleetUnits(gameState, player.id);

  // Priority 1: Infantry if we need ground forces for invasion/control
  if (analysis.needsGroundForces && resourcesRemaining >= 1 && unitsProduced < productionCapacity) {
    const infantryCount = Math.min(
      Math.floor(resourcesRemaining / 0.5),
      productionCapacity - unitsProduced,
      analysis.groundForcesNeeded
    );
    if (infantryCount > 0) {
      units.push({ type: 'infantry', count: infantryCount });
      resourcesRemaining -= infantryCount * 0.5;
      unitsProduced += infantryCount;
    }
  }

  // Priority 2: Carriers if we need expansion capability
  if (analysis.needsCarriers && resourcesRemaining >= 3 && unitsProduced < productionCapacity && totalFleet < fleetSupply) {
    units.push({ type: 'carrier', count: 1 });
    resourcesRemaining -= 3;
    unitsProduced++;
  }

  // Priority 3: Combat ships if threatened or need offensive power
  if (analysis.needsCombatShips && unitsProduced < productionCapacity && totalFleet < fleetSupply) {
    // Dreadnought if we have lots of resources (strong defensive/offensive)
    if (resourcesRemaining >= 4 && analysis.threatLevel >= 2) {
      units.push({ type: 'dreadnought', count: 1 });
      resourcesRemaining -= 4;
      unitsProduced++;
    }
    // Cruisers for balanced combat power
    else if (resourcesRemaining >= 2 && totalFleet < fleetSupply) {
      const cruiserCount = Math.min(
        Math.floor(resourcesRemaining / 2),
        productionCapacity - unitsProduced,
        fleetSupply - totalFleet,
        2
      );
      if (cruiserCount > 0) {
        units.push({ type: 'cruiser', count: cruiserCount });
        resourcesRemaining -= cruiserCount * 2;
        unitsProduced += cruiserCount;
      }
    }
  }

  // Priority 4: Destroyers for anti-fighter if enemy has fighters
  if (analysis.enemyHasFighters && resourcesRemaining >= 1 && unitsProduced < productionCapacity && totalFleet < fleetSupply) {
    units.push({ type: 'destroyer', count: 1 });
    resourcesRemaining -= 1;
    unitsProduced++;
  }

  // Priority 5: Fighters to fill capacity (cheap combat power)
  if (resourcesRemaining >= 1 && unitsProduced < productionCapacity) {
    const carrierCapacity = calculateCarrierCapacity(gameState, player);
    const currentFighters = countFighters(gameState, player.id);
    const fightersNeeded = Math.max(0, carrierCapacity - currentFighters);

    if (fightersNeeded > 0) {
      const fighterCount = Math.min(
        Math.floor(resourcesRemaining / 0.5),
        productionCapacity - unitsProduced,
        fightersNeeded,
        4
      );
      if (fighterCount > 0) {
        units.push({ type: 'fighter', count: fighterCount });
        resourcesRemaining -= fighterCount * 0.5;
        unitsProduced += fighterCount;
      }
    }
  }

  // Priority 6: More infantry if we still have resources (always useful)
  if (resourcesRemaining >= 1 && unitsProduced < productionCapacity) {
    const infantryCount = Math.min(
      Math.floor(resourcesRemaining / 0.5),
      productionCapacity - unitsProduced,
      3
    );
    if (infantryCount > 0) {
      units.push({ type: 'infantry', count: infantryCount });
      resourcesRemaining -= infantryCount * 0.5;
      unitsProduced += infantryCount;
    }
  }

  if (units.length === 0) {
    return { type: 'skip_production', playerId: player.id, timestamp: Date.now() };
  }

  return {
    type: 'produce_units',
    playerId: player.id,
    timestamp: Date.now(),
    systemPosition: tile.position,
    planetId: spaceDockPlanet,
    units,
  };
}

/**
 * Analyze what the bot needs to produce
 */
function analyzeProductionNeeds(
  gameState: GameState,
  player: PlayerState,
  currentTile: MapTile
): {
  needsGroundForces: boolean;
  groundForcesNeeded: number;
  needsCarriers: boolean;
  needsCombatShips: boolean;
  threatLevel: number;
  enemyHasFighters: boolean;
} {
  // Count current forces
  let totalInfantry = 0;
  let totalCarriers = 0;
  let totalCombatShips = 0;

  for (const tile of gameState.map.tiles) {
    for (const unit of tile.units) {
      if (unit.ownerId !== player.id) continue;
      if (unit.type === 'carrier') totalCarriers++;
      if (['cruiser', 'dreadnought', 'destroyer', 'flagship', 'war_sun'].includes(unit.type)) {
        totalCombatShips++;
      }
    }
    for (const planet of tile.planets) {
      for (const unit of planet.units) {
        if (unit.ownerId !== player.id) continue;
        if (unit.type === 'infantry') totalInfantry++;
      }
    }
  }

  // Count unclaimed/enemy planets nearby
  let unclaimedPlanetsNearby = 0;
  const adjacentPositions = getAdjacentPositions(currentTile.position);
  for (const pos of adjacentPositions) {
    const adjTile = findTileAtPosition(gameState.map, pos);
    if (adjTile) {
      for (const planet of adjTile.planets) {
        if (planet.controlledBy !== player.id) {
          unclaimedPlanetsNearby++;
        }
      }
    }
  }

  // Assess threat level
  let threatLevel = 0;
  let enemyHasFighters = false;
  for (const tile of gameState.map.tiles) {
    // Count enemy ships near our systems
    const enemyShips = tile.units.filter(u => u.ownerId !== player.id && isShipType(u.type));
    if (enemyShips.length > 0) {
      // Check if this system is near our systems
      const ourNearby = gameState.map.tiles.some(t =>
        t.units.some(u => u.ownerId === player.id) &&
        hexDistance(t.position, tile.position) <= 2
      );
      if (ourNearby) {
        threatLevel += enemyShips.length;
      }
      if (enemyShips.some(u => u.type === 'fighter')) {
        enemyHasFighters = true;
      }
    }
  }

  // Determine needs
  const needsGroundForces = totalInfantry < 6 || unclaimedPlanetsNearby > 0;
  const groundForcesNeeded = Math.max(4, unclaimedPlanetsNearby * 2);

  // Need carriers if we don't have enough for expansion
  const needsCarriers = totalCarriers < 2 || (unclaimedPlanetsNearby > 2 && totalCarriers < 3);

  // Need combat ships if threatened or if we want to take Mecatol
  const needsCombatShips = threatLevel > 2 || totalCombatShips < 3;

  return {
    needsGroundForces,
    groundForcesNeeded,
    needsCarriers,
    needsCombatShips,
    threatLevel,
    enemyHasFighters,
  };
}

/**
 * Count total fleet units (for fleet supply)
 */
function countTotalFleetUnits(gameState: GameState, playerId: string): number {
  let count = 0;
  for (const tile of gameState.map.tiles) {
    for (const unit of tile.units) {
      if (unit.ownerId === playerId && countsTowardsFleetSupply(unit.type)) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Calculate total carrier capacity
 */
function calculateCarrierCapacity(gameState: GameState, player: PlayerState): number {
  let capacity = 0;
  for (const tile of gameState.map.tiles) {
    for (const unit of tile.units) {
      if (unit.ownerId === player.id) {
        capacity += getUnitCapacity(unit.type, player);
      }
    }
  }
  return capacity;
}

/**
 * Count total fighters
 */
function countFighters(gameState: GameState, playerId: string): number {
  let count = 0;
  for (const tile of gameState.map.tiles) {
    for (const unit of tile.units) {
      if (unit.ownerId === playerId && unit.type === 'fighter') {
        count++;
      }
    }
  }
  return count;
}

// ============================================================================
// COMBAT
// ============================================================================

function generateCombatAction(gameState: GameState, player: PlayerState): GameAction | null {
  const combat = gameState.activeCombat;
  if (!combat) return null;

  const combatState = combat.state;

  switch (combatState) {
    case 'announce_retreat':
      return generateRetreatDecision(gameState, player, combat);

    case 'combat_round_assign':
      return generateHitAssignment(gameState, player, combat);

    case 'combat_round_roll':
      // Automatic, no action needed
      return null;

    default:
      return null;
  }
}

function generateRetreatDecision(
  gameState: GameState,
  player: PlayerState,
  combat: GameState['activeCombat']
): AnnounceRetreatAction {
  if (!combat) {
    return { type: 'announce_retreat', playerId: player.id, timestamp: Date.now(), retreating: false };
  }

  const tile = gameState.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) {
    return { type: 'announce_retreat', playerId: player.id, timestamp: Date.now(), retreating: false };
  }

  // Never retreat from home system or Mecatol
  const isHomeSystem = tile.systemId >= 1 && tile.systemId <= 17;
  const isMecatol = tile.systemId === 18;
  if (isHomeSystem || isMecatol) {
    return { type: 'announce_retreat', playerId: player.id, timestamp: Date.now(), retreating: false };
  }

  // Calculate combat power
  const myUnits = tile.units.filter(u => u.ownerId === player.id);
  const enemyUnits = tile.units.filter(u => u.ownerId !== player.id);

  const myPower = estimateCombatPower(myUnits, player);
  const enemyPlayer = gameState.players.find(p => p.id !== player.id && enemyUnits.some(u => u.ownerId === p.id));
  const enemyPower = enemyPlayer ? estimateCombatPower(enemyUnits, enemyPlayer) : 0;

  // Retreat if significantly outmatched
  if (enemyPower > myPower * 2) {
    // Find adjacent system to retreat to
    const adjacentPositions = getAdjacentPositions(tile.position);
    for (const pos of adjacentPositions) {
      const adjacentTile = findTileAtPosition(gameState.map, pos);
      if (adjacentTile && !adjacentTile.units.some(u => u.ownerId !== player.id)) {
        return {
          type: 'announce_retreat',
          playerId: player.id,
          timestamp: Date.now(),
          retreating: true,
          retreatSystem: pos,
        };
      }
    }
  }

  return { type: 'announce_retreat', playerId: player.id, timestamp: Date.now(), retreating: false };
}

function generateHitAssignment(
  gameState: GameState,
  player: PlayerState,
  combat: GameState['activeCombat']
): AssignHitsAction | null {
  if (!combat) return null;

  const tile = gameState.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) return null;

  const isAttacker = player.id === combat.attackerId;
  const hitsToAssign = isAttacker ? combat.pendingHits.attacker : combat.pendingHits.defender;

  if (hitsToAssign === 0) {
    return { type: 'assign_hits', playerId: player.id, timestamp: Date.now(), assignments: [] };
  }

  // Get our units in combat
  const myUnits = combat.type === 'ground'
    ? tile.planets.flatMap(p => p.units.filter(u => u.ownerId === player.id))
    : tile.units.filter(u => u.ownerId === player.id);

  // Priority: sustain first, then sacrifice in order
  const sacrificeOrder: UnitType[] = [
    'fighter', 'infantry', 'mech', 'destroyer', 'carrier', 'cruiser', 'dreadnought', 'war_sun', 'flagship'
  ];

  const assignments: AssignHitsAction['assignments'] = [];
  let hitsRemaining = hitsToAssign;

  // First, try to sustain damage
  for (const unit of myUnits) {
    if (hitsRemaining === 0) break;
    if (unit.damaged) continue;

    const canSustain = ['dreadnought', 'war_sun', 'flagship', 'mech'].includes(unit.type);
    if (canSustain) {
      assignments.push({ unitId: unit.id, destroyed: false, sustainDamage: true });
      hitsRemaining--;
    }
  }

  // Then destroy units in sacrifice order
  for (const unitType of sacrificeOrder) {
    for (const unit of myUnits) {
      if (hitsRemaining === 0) break;
      if (unit.type !== unitType) continue;
      if (assignments.some(a => a.unitId === unit.id)) continue;

      assignments.push({ unitId: unit.id, destroyed: true, sustainDamage: false });
      hitsRemaining--;
    }
    if (hitsRemaining === 0) break;
  }

  return { type: 'assign_hits', playerId: player.id, timestamp: Date.now(), assignments };
}

function estimateCombatPower(units: UnitInstance[], player: PlayerState): number {
  return units.reduce((power, unit) => {
    const stats = getUnitCombatValue(unit.type);
    const hitChance = (11 - stats) / 10;
    const sustainBonus = ['dreadnought', 'war_sun', 'flagship', 'mech'].includes(unit.type) ? 0.5 : 0;
    return power + hitChance + sustainBonus;
  }, 0);
}

function getUnitCombatValue(type: UnitType): number {
  const combatValues: Partial<Record<UnitType, number>> = {
    fighter: 9, infantry: 8, mech: 6, destroyer: 9, carrier: 9,
    cruiser: 7, dreadnought: 5, war_sun: 3, flagship: 5,
  };
  return combatValues[type] ?? 10;
}

// ============================================================================
// INVASION
// ============================================================================

function generateInvasionAction(gameState: GameState, player: PlayerState): GameAction | null {
  const invasion = gameState.invasionPhase;
  if (!invasion) return null;

  switch (invasion.currentStep) {
    case 'select_planets':
      return generateInvasionTargetSelection(gameState, player, invasion);

    case 'commit_ground_forces':
      return generateGroundForceCommitment(gameState, player, invasion);

    case 'bombardment':
      return { type: 'skip_bombardment', playerId: player.id, timestamp: Date.now() } as SkipBombardmentAction;

    case 'ground_combat':
      // Ground combat uses activeCombat, which is handled by generateCombatAction
      if (gameState.activeCombat && gameState.activeCombat.type === 'ground') {
        return generateCombatAction(gameState, player);
      }
      return null;

    default:
      return null;
  }
}

function generateInvasionTargetSelection(
  gameState: GameState,
  player: PlayerState,
  _invasion: NonNullable<GameState['invasionPhase']>
): SelectInvasionTargetsAction | SkipInvasionAction {
  if (!gameState.activatedSystem) {
    return { type: 'skip_invasion', playerId: player.id, timestamp: Date.now() };
  }

  const tile = findTileAtPosition(gameState.map, gameState.activatedSystem);
  if (!tile) {
    return { type: 'skip_invasion', playerId: player.id, timestamp: Date.now() };
  }

  // Find planets we can invade (enemy or unclaimed with ground units)
  const invadablePlanets: string[] = [];
  for (const planet of tile.planets) {
    if (planet.controlledBy !== player.id) {
      invadablePlanets.push(planet.planetId);
    }
  }

  // Check if we have ground forces
  const hasGroundForces = tile.units.some(u =>
    u.ownerId === player.id && isGroundUnit(u.type)
  );

  if (!hasGroundForces || invadablePlanets.length === 0) {
    return { type: 'skip_invasion', playerId: player.id, timestamp: Date.now() };
  }

  return {
    type: 'select_invasion_targets',
    playerId: player.id,
    timestamp: Date.now(),
    targetPlanets: invadablePlanets,
  };
}

function generateGroundForceCommitment(
  gameState: GameState,
  player: PlayerState,
  invasion: NonNullable<GameState['invasionPhase']>
): CommitGroundForcesAction {
  const assignments: { unitId: string; planetId: string }[] = [];

  if (!gameState.activatedSystem) {
    return { type: 'commit_ground_forces', playerId: player.id, timestamp: Date.now(), assignments };
  }

  const tile = findTileAtPosition(gameState.map, gameState.activatedSystem);
  if (tile && invasion.targetPlanets.length > 0) {
    const groundUnits = tile.units.filter(u =>
      u.ownerId === player.id && isGroundUnit(u.type)
    );

    // Distribute ground units evenly among target planets
    let planetIndex = 0;
    for (const unit of groundUnits) {
      const targetPlanet = invasion.targetPlanets[planetIndex % invasion.targetPlanets.length];
      assignments.push({ unitId: unit.id, planetId: targetPlanet });
      planetIndex++;
    }
  }

  return {
    type: 'commit_ground_forces',
    playerId: player.id,
    timestamp: Date.now(),
    assignments,
  };
}

// ============================================================================
// STRATEGIC PRIMARY
// ============================================================================

function generateStrategicPrimaryAction(gameState: GameState, player: PlayerState): StrategicPrimaryAction | null {
  const tracking = gameState.strategicActionState;
  if (!tracking) return null;

  const cardNumber = tracking.cardNumber;
  let choices: StrategicPrimaryChoices = {};

  switch (cardNumber) {
    case 1: // Leadership
      choices = generateLeadershipPrimaryChoices(gameState, player);
      break;
    case 2: // Diplomacy
      choices = generateDiplomacyPrimaryChoices(gameState, player);
      break;
    case 3: // Politics
      choices = generatePoliticsPrimaryChoices(gameState, player);
      break;
    case 4: // Construction
      choices = generateConstructionPrimaryChoices(gameState, player);
      break;
    case 5: // Trade
      choices = generateTradePrimaryChoices(gameState, player);
      break;
    case 6: // Warfare
      choices = generateWarfarePrimaryChoices(gameState, player);
      break;
    case 7: // Technology
      choices = generateTechnologyPrimaryChoices(gameState, player);
      break;
    case 8: // Imperial
      choices = generateImperialPrimaryChoices(gameState, player);
      break;
    default:
      return null;
  }

  return {
    type: 'strategic_primary',
    playerId: player.id,
    timestamp: Date.now(),
    cardNumber,
    choices,
  };
}

function generateLeadershipPrimaryChoices(gameState: GameState, player: PlayerState): StrategicPrimaryChoices {
  // Gain 3 tokens, distribute them
  return {
    tokenDistribution: { tactics: 2, fleet: 1, strategy: 0 },
  };
}

function generateDiplomacyPrimaryChoices(gameState: GameState, player: PlayerState): StrategicPrimaryChoices {
  // Choose a system with our planet
  let targetSystem: HexCoord | undefined;
  for (const tile of gameState.map.tiles) {
    if (tile.systemId === 18) continue; // Not Mecatol
    if (tile.planets.some(p => p.controlledBy === player.id)) {
      targetSystem = tile.position;
      break;
    }
  }

  // Ready highest value exhausted planets
  const exhaustedPlanets = player.planets
    .filter(p => p.exhausted)
    .map(p => ({ id: p.planetId, value: findPlanetData(p.planetId)?.resources || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map(p => p.id);

  return {
    targetSystemPosition: targetSystem,
    planetsToReady: exhaustedPlanets,
  };
}

function generatePoliticsPrimaryChoices(gameState: GameState, player: PlayerState): StrategicPrimaryChoices {
  // Choose a different player as speaker (just pick first non-self, non-speaker)
  const newSpeaker = gameState.players.find(p =>
    p.id !== player.id && p.id !== gameState.speakerId
  );

  return {
    newSpeakerId: newSpeaker?.id || gameState.speakerId,
  };
}

function generateConstructionPrimaryChoices(gameState: GameState, player: PlayerState): StrategicPrimaryChoices {
  // Build space dock on highest resource planet without one
  let bestPlanet: { planetId: string; resources: number } | null = null;

  for (const tile of gameState.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.controlledBy !== player.id) continue;
      if (planet.units.some(u => u.type === 'space_dock')) continue;

      const data = findPlanetData(planet.planetId);
      if (data && (!bestPlanet || data.resources > bestPlanet.resources)) {
        bestPlanet = { planetId: planet.planetId, resources: data.resources };
      }
    }
  }

  if (bestPlanet) {
    return {
      firstStructure: { type: 'space_dock', planetId: bestPlanet.planetId },
    };
  }

  return {};
}

function generateTradePrimaryChoices(gameState: GameState, player: PlayerState): StrategicPrimaryChoices {
  // Give free secondary to players with most commodities
  const playersWithCommodities = gameState.players
    .filter(p => p.id !== player.id)
    .sort((a, b) => b.maxCommodities - a.maxCommodities)
    .slice(0, 2)
    .map(p => p.id);

  return {
    freeSecondaryPlayers: playersWithCommodities,
  };
}

function generateWarfarePrimaryChoices(gameState: GameState, player: PlayerState): StrategicPrimaryChoices {
  // Keep current token distribution + 1 tactics
  const current = player.commandTokens;
  return {
    newTokenDistribution: {
      tactics: current.tactics + 1,
      fleet: current.fleet,
      strategy: current.strategy,
    },
  };
}

function generateTechnologyPrimaryChoices(gameState: GameState, player: PlayerState): StrategicPrimaryChoices {
  // Get technologies the bot can actually research (meets prerequisites)
  const availableTechs = getAvailableTechnologies(gameState, player.id);

  if (availableTechs.length === 0) {
    return {};
  }

  // Score each technology by usefulness
  const scoredTechs = availableTechs.map(tech => ({
    tech,
    score: calculateTechValue(tech, player),
  }));

  // Sort by score descending
  scoredTechs.sort((a, b) => b.score - a.score);

  // Pick the best technology
  const bestTech = scoredTechs[0];
  if (bestTech && bestTech.score > 0) {
    return {
      techId: bestTech.tech.id,
    };
  }

  return {};
}

/**
 * Calculate the value of a technology for a bot
 */
function calculateTechValue(tech: typeof technologies[string], player: PlayerState): number {
  let score = 0;

  // Base value by tier (higher tier = more powerful but less accessible)
  const prereqCount = tech.prerequisites?.length || 0;
  const tier = prereqCount === 0 ? 1 : prereqCount <= 1 ? 2 : prereqCount <= 2 ? 3 : 4;

  // Prefer lower tier techs early (easier to get)
  score += (5 - tier) * 2;

  // Faction technologies are very valuable
  if (tech.factionId === player.faction) {
    score += 15;
  }

  // Unit upgrades are good for combat
  if (tech.type === 'unit_upgrade') {
    score += 8;
    // Cruiser II and Dreadnought II are particularly good
    if (tech.id === 'cruiser_ii' || tech.id === 'dreadnought_ii') {
      score += 5;
    }
    // Carrier II for expansion
    if (tech.id === 'carrier_ii') {
      score += 4;
    }
  }

  // Value by color - prioritize based on general usefulness
  if (tech.color === 'blue') {
    // Blue (Propulsion) - mobility is crucial
    score += 6;
    // Gravity Drive is excellent
    if (tech.id === 'gravity_drive') score += 4;
    // Fleet Logistics is game-changing
    if (tech.id === 'fleet_logistics') score += 6;
  } else if (tech.color === 'green') {
    // Green (Biotic) - economy and cards
    score += 5;
    // Neural Motivator for card draw
    if (tech.id === 'neural_motivator') score += 4;
    // Hyper Metabolism for tokens
    if (tech.id === 'hyper_metabolism') score += 5;
  } else if (tech.color === 'yellow') {
    // Yellow (Cybernetic) - production
    score += 4;
    // Sarween Tools saves resources
    if (tech.id === 'sarween_tools') score += 4;
    // Transit Diodes for infantry movement
    if (tech.id === 'transit_diodes') score += 3;
  } else if (tech.color === 'red') {
    // Red (Warfare) - combat
    score += 4;
    // Plasma Scoring for PDS/bombardment
    if (tech.id === 'plasma_scoring') score += 3;
    // Magen Defense Grid for defense
    if (tech.id === 'magen_defense_grid') score += 2;
  }

  // Avoid technologies we already have the color coverage for (diversify)
  const techCounts: Record<string, number> = { blue: 0, green: 0, yellow: 0, red: 0 };
  for (const ownedTechId of player.technologies) {
    const ownedTech = technologies[ownedTechId];
    if (ownedTech?.color) {
      techCounts[ownedTech.color]++;
    }
  }

  // Slight bonus for colors we have fewer of (diversification for objectives)
  if (tech.color && techCounts[tech.color] < 2) {
    score += 3;
  }

  return score;
}

function generateImperialPrimaryChoices(gameState: GameState, player: PlayerState): StrategicPrimaryChoices {
  // Try to score any available public objective
  const scorableObjective = findScorableObjective(gameState, player);
  return {
    scoredObjectiveId: scorableObjective,
  };
}

// ============================================================================
// STATUS PHASE
// ============================================================================

function generateStatusPhaseAction(gameState: GameState, player: PlayerState): GameAction | null {
  const status = gameState.statusPhase;
  if (!status) return null;

  // Use game state's subPhase which holds the StatusPhaseState
  const statusSubPhase = gameState.subPhase;

  switch (statusSubPhase) {
    case 'score_objectives':
      return generateScoringAction(gameState, player);

    case 'gain_redistribute_tokens':
      return generateRedistributeTokensAction(gameState, player);

    default:
      return null;
  }
}

function generateScoringAction(gameState: GameState, player: PlayerState): ScoreObjectiveAction | SkipScoringAction {
  const objectiveId = findScorableObjective(gameState, player);

  if (objectiveId) {
    const isSecret = player.secretObjectives?.includes(objectiveId);
    return {
      type: 'score_objective',
      playerId: player.id,
      timestamp: Date.now(),
      objectiveId,
      objectiveType: isSecret ? 'secret' : 'public',
    };
  }

  return {
    type: 'skip_scoring',
    playerId: player.id,
    timestamp: Date.now(),
    skipType: 'both',
  };
}

function findScorableObjective(gameState: GameState, player: PlayerState): string | undefined {
  // Track scored objectives for this player
  const alreadyScored = new Set(player.scoredObjectives || []);

  // Check public Stage I objectives first (worth 1 VP each)
  for (const obj of gameState.objectives.publicStageI) {
    if (!obj.revealed) continue;
    if (alreadyScored.has(obj.id)) continue;
    if (obj.scoredBy?.includes(player.id)) continue;

    // Validate the objective requirements
    const result = checkObjectiveRequirement(gameState, player.id, obj.id);
    if (result.canScore) {
      return obj.id;
    }
  }

  // Check public Stage II objectives (worth 2 VP each)
  for (const obj of gameState.objectives.publicStageII) {
    if (!obj.revealed) continue;
    if (alreadyScored.has(obj.id)) continue;
    if (obj.scoredBy?.includes(player.id)) continue;

    // Validate the objective requirements
    const result = checkObjectiveRequirement(gameState, player.id, obj.id);
    if (result.canScore) {
      return obj.id;
    }
  }

  // Check secret objectives
  for (const secretId of player.secretObjectives || []) {
    if (alreadyScored.has(secretId)) continue;

    // Validate the secret objective requirements
    const result = checkObjectiveRequirement(gameState, player.id, secretId);
    if (result.canScore) {
      return secretId;
    }
  }

  return undefined;
}

function generateRedistributeTokensAction(gameState: GameState, player: PlayerState): RedistributeTokensAction {
  // Total tokens available (current + 2 gained in status phase)
  const total = player.commandTokens.tactics + player.commandTokens.fleet + player.commandTokens.strategy + 2;

  // Analyze needs based on game state
  const analysis = analyzeTokenNeeds(gameState, player);

  // Calculate distribution based on needs
  let tactics = 0;
  let fleet = 0;
  let strategy = 0;

  // Minimum allocations
  const minTactics = 2;  // Always need some tactics for actions
  const minFleet = Math.max(2, analysis.currentFleetSize - 1);  // Support current fleet
  const minStrategy = 1; // Always want at least 1 for secondaries

  // Start with minimums
  tactics = Math.min(minTactics, total);
  let remaining = total - tactics;

  fleet = Math.min(minFleet, remaining);
  remaining -= fleet;

  strategy = Math.min(minStrategy, remaining);
  remaining -= strategy;

  // Distribute remaining tokens based on priorities
  while (remaining > 0) {
    if (analysis.needsExpansion && tactics < 4) {
      // Prioritize tactics for expansion/aggression
      tactics++;
      remaining--;
    } else if (analysis.currentFleetSize > fleet && fleet < 6) {
      // Need more fleet supply for our ships
      fleet++;
      remaining--;
    } else if (analysis.wantsSecondaries && strategy < 3) {
      // Want to use secondaries
      strategy++;
      remaining--;
    } else if (tactics < 5) {
      // Default: more tactics is always useful
      tactics++;
      remaining--;
    } else if (fleet < 5) {
      // Build up fleet supply
      fleet++;
      remaining--;
    } else {
      // Dump remaining into strategy
      strategy++;
      remaining--;
    }
  }

  return {
    type: 'redistribute_tokens',
    playerId: player.id,
    timestamp: Date.now(),
    distribution: { tactics, fleet, strategy },
  };
}

/**
 * Analyze what token distribution the bot needs
 */
function analyzeTokenNeeds(
  gameState: GameState,
  player: PlayerState
): {
  needsExpansion: boolean;
  currentFleetSize: number;
  wantsSecondaries: boolean;
} {
  // Count current fleet size
  let currentFleetSize = 0;
  for (const tile of gameState.map.tiles) {
    for (const unit of tile.units) {
      if (unit.ownerId === player.id && countsTowardsFleetSupply(unit.type)) {
        currentFleetSize++;
      }
    }
  }

  // Check if we need to expand
  const controlledPlanets = countControlledPlanets(gameState, player.id);
  const needsExpansion = controlledPlanets.nonHome < 4 || gameState.round <= 3;

  // Check if we want secondaries (based on strategy cards available)
  // Early game: want secondaries for tech, production
  // Late game: less important
  const wantsSecondaries = gameState.round <= 4 || player.technologies.length < 6;

  return {
    needsExpansion,
    currentFleetSize,
    wantsSecondaries,
  };
}

// ============================================================================
// AGENDA PHASE
// ============================================================================

function generateAgendaPhaseAction(gameState: GameState, player: PlayerState): CastVoteAction | null {
  const agenda = gameState.agendaPhase;
  if (!agenda) return null;

  // Only act if we're the current voter
  if (agenda.votingOrder[agenda.currentVoterIndex] !== player.id) {
    return null;
  }

  // Calculate available influence
  const availableInfluence = calculateAvailableInfluence(gameState, player);
  const exhaustedPlanets = player.planets
    .filter(p => !p.exhausted)
    .map(p => p.planetId);

  // Evaluate and determine best outcome
  const { outcome, shouldAbstain } = evaluateAgendaOutcome(gameState, player, agenda);

  return {
    type: 'cast_vote',
    playerId: player.id,
    timestamp: Date.now(),
    outcome,
    exhaustedPlanets,
    abstain: shouldAbstain || availableInfluence === 0,
  };
}

/**
 * Evaluate the best outcome for an agenda based on its effects
 */
function evaluateAgendaOutcome(
  gameState: GameState,
  player: PlayerState,
  agenda: NonNullable<GameState['agendaPhase']>
): { outcome: string; shouldAbstain: boolean } {
  const agendaId = agenda.currentAgendaId;
  const electionType = agenda.currentElectionType;

  // For/Against agendas - evaluate if the effect helps or hurts us
  if (electionType === 'for_against') {
    const preference = evaluateForAgainstAgenda(gameState, player, agendaId);
    return { outcome: preference, shouldAbstain: false };
  }

  // Player elections - choose strategically
  if (electionType === 'player') {
    const targetPlayer = evaluatePlayerElection(gameState, player, agendaId);
    return { outcome: targetPlayer, shouldAbstain: false };
  }

  // Planet elections - choose based on agenda effect
  if (electionType === 'planet') {
    const targetPlanet = evaluatePlanetElection(gameState, player, agendaId);
    return { outcome: targetPlanet, shouldAbstain: !targetPlanet };
  }

  // Secret objective elections
  if (electionType === 'scored_secret') {
    // Just pick the first available if any
    const scoredSecrets = gameState.players.flatMap(p => p.scoredObjectives || []);
    return { outcome: scoredSecrets[0] || '', shouldAbstain: scoredSecrets.length === 0 };
  }

  // Default: vote for if unknown
  return { outcome: 'for', shouldAbstain: false };
}

/**
 * Evaluate for/against agendas based on their effects
 */
function evaluateForAgainstAgenda(
  gameState: GameState,
  player: PlayerState,
  agendaId: string
): 'for' | 'against' {
  // Agendas that are generally BAD for players (vote against)
  const badAgendas = [
    'anti_intellectual_revolution',  // Hurts tech research
    'executive_sanctions',           // Limits action cards
    'fleet_regulations',             // Limits fleet size
    'enforced_travel_ban',           // Limits wormhole movement
    'regulated_conscription',        // Limits infantry
    'research_team_biotic',          // Locks out green tech
    'research_team_cybernetic',      // Locks out yellow tech
    'research_team_propulsion',      // Locks out blue tech
    'research_team_warfare',         // Locks out red tech
  ];

  // Agendas that are generally GOOD for players (vote for)
  const goodAgendas = [
    'articles_of_war',               // Protects non-home systems from bombardment
    'conventions_of_war',            // Protects cultural planets
    'publicize_weapon_schematics',   // Everyone gets a tech
    'shared_research',               // Cheaper tech
    'wormhole_reconstruction',       // More wormhole connections
  ];

  // Context-specific evaluation
  if (badAgendas.includes(agendaId)) {
    return 'against';
  }

  if (goodAgendas.includes(agendaId)) {
    return 'for';
  }

  // Specific evaluations based on player state
  if (agendaId === 'ixthian_artifact') {
    // Risky - vote against unless we're winning
    const isWinning = player.victoryPoints >= 8;
    return isWinning ? 'for' : 'against';
  }

  if (agendaId === 'unconventional_measures') {
    // Skip action cards - bad if we have many
    return (player.actionCards?.length || 0) > 3 ? 'against' : 'for';
  }

  if (agendaId === 'clandestine_operations') {
    // Limits action cards to 3 - bad if we have more
    return (player.actionCards?.length || 0) > 3 ? 'against' : 'for';
  }

  // Default: vote for (most agendas are neutral or slightly positive)
  return 'for';
}

/**
 * Choose a player for player elections
 */
function evaluatePlayerElection(
  gameState: GameState,
  player: PlayerState,
  agendaId: string
): string {
  // Positive elections - vote for self
  const positiveElections = [
    'committee_formation',           // Extra vote
    'representative_government',     // Become speaker
    'political_censure',             // Target loses a secret objective (vote for enemy)
    'minister_of_commerce',          // Gain trade goods
    'minister_of_exploration',       // Gain exploration card
    'minister_of_industry',          // Production bonus
    'minister_of_peace',             // Defense bonus
    'minister_of_policy',            // Action card bonus
    'minister_of_sciences',          // Tech discount
    'minister_of_war',               // Combat bonus
  ];

  if (positiveElections.includes(agendaId)) {
    // If it's beneficial, vote for self
    if (!agendaId.startsWith('political_')) {
      return player.id;
    }
    // For negative effects like political_censure, vote for the leader
    const leader = findLeadingPlayer(gameState, player.id);
    return leader?.id || player.id;
  }

  // Negative elections - vote for enemy
  const negativeElections = [
    'political_censure',             // Target loses secret objective
    'assassinate_representative',    // Target loses a card
  ];

  if (negativeElections.includes(agendaId)) {
    const leader = findLeadingPlayer(gameState, player.id);
    return leader?.id || gameState.players.find(p => p.id !== player.id)?.id || player.id;
  }

  // Default: vote for self
  return player.id;
}

/**
 * Choose a planet for planet elections
 */
function evaluatePlanetElection(
  gameState: GameState,
  player: PlayerState,
  agendaId: string
): string {
  // Positive effects - choose our own planet
  const positiveElections = [
    'core_mining',                   // +2 resources
    'holy_planet_of_ixth',           // +influence
    'terraforming_initiative',       // Gain trade goods
    'seed_of_an_empire',             // VP location
  ];

  if (positiveElections.includes(agendaId)) {
    // Pick our best planet
    const ourPlanets = player.planets || [];
    if (ourPlanets.length > 0) {
      // For core_mining, pick hazardous planet
      // For holy_planet, pick cultural planet
      // Default: pick any of our planets
      return ourPlanets[0].planetId;
    }
  }

  // Negative effects - choose enemy planet
  const negativeElections = [
    'demilitarized_zone',            // Can't produce units
    'research_team_biotic',          // Locks tech color
    'research_team_cybernetic',
    'research_team_propulsion',
    'research_team_warfare',
  ];

  if (negativeElections.includes(agendaId)) {
    // Find an enemy planet
    for (const tile of gameState.map.tiles) {
      for (const planet of tile.planets) {
        if (planet.controlledBy && planet.controlledBy !== player.id) {
          return planet.planetId;
        }
      }
    }
  }

  // Default: pick any planet we own
  return player.planets?.[0]?.planetId || '';
}

/**
 * Find the player with the most victory points (excluding self)
 */
function findLeadingPlayer(gameState: GameState, excludePlayerId: string): PlayerState | null {
  let leader: PlayerState | null = null;
  let maxVP = -1;

  for (const p of gameState.players) {
    if (p.id === excludePlayerId) continue;
    if (p.victoryPoints > maxVP) {
      maxVP = p.victoryPoints;
      leader = p;
    }
  }

  return leader;
}

// ============================================================================
// TIMING WINDOWS
// ============================================================================

function generateTimingWindowResponse(gameState: GameState, player: PlayerState): TimingWindowResponseAction | null {
  const window = gameState.activeTimingWindow;
  if (!window) return null;

  // Bots pass on timing windows (don't play action cards reactively)
  return {
    type: 'timing_window_response',
    playerId: player.id,
    timestamp: Date.now(),
    windowId: window.id,
    response: 'pass',
  };
}

// ============================================================================
// SECONDARY ACTIONS (existing, enhanced)
// ============================================================================

function generateSecondaryAction(
  gameState: GameState,
  player: PlayerState,
  cardNumber: number
): StrategicSecondaryAction {
  const tracking = gameState.strategicActionState;
  const isFreeSecondary = cardNumber === 1 || tracking?.freeSecondaryPlayers?.includes(player.id);

  if (!isFreeSecondary && player.commandTokens.strategy <= 0) {
    return {
      type: 'strategic_secondary',
      playerId: player.id,
      timestamp: Date.now(),
      cardNumber,
      declined: true,
    };
  }

  let choices: StrategicSecondaryChoices = {};
  let shouldUse = true;

  switch (cardNumber) {
    case 1: // Leadership
      const leadershipChoices = generateLeadershipSecondaryChoices(gameState, player);
      choices = leadershipChoices.choices;
      shouldUse = leadershipChoices.shouldUse;
      break;
    case 2: // Diplomacy
      choices = generateDiplomacySecondaryChoices(player);
      break;
    case 3: // Politics
      break;
    case 4: // Construction
      shouldUse = false;
      break;
    case 5: // Trade
      shouldUse = player.commodities < player.maxCommodities;
      break;
    case 6: // Warfare
      shouldUse = false;
      break;
    case 7: // Technology
      shouldUse = false;
      break;
    case 8: // Imperial
      shouldUse = player.secretObjectives.length < 3;
      break;
    default:
      shouldUse = false;
  }

  return {
    type: 'strategic_secondary',
    playerId: player.id,
    timestamp: Date.now(),
    cardNumber,
    declined: !shouldUse,
    choices: shouldUse ? choices : undefined,
  };
}

function generateLeadershipSecondaryChoices(
  gameState: GameState,
  player: PlayerState
): { choices: StrategicSecondaryChoices; shouldUse: boolean } {
  const availableInfluence = calculateAvailableInfluence(gameState, player);
  const maxTokens = Math.floor(availableInfluence / 3);

  if (maxTokens === 0) {
    return { choices: {}, shouldUse: false };
  }

  return {
    choices: {
      influenceSpent: maxTokens * 3,
      commandTokenDistribution: {
        tactics: Math.ceil(maxTokens / 2),
        fleet: Math.floor(maxTokens / 3),
        strategy: maxTokens - Math.ceil(maxTokens / 2) - Math.floor(maxTokens / 3),
      },
    },
    shouldUse: true,
  };
}

function generateDiplomacySecondaryChoices(player: PlayerState): StrategicSecondaryChoices {
  const exhaustedPlanets = player.planets
    .filter(p => p.exhausted)
    .map(p => ({ planetId: p.planetId, value: findPlanetData(p.planetId)?.resources || 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map(p => p.planetId);

  return { readiedPlanets: exhaustedPlanets };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateAvailableInfluence(gameState: GameState, player: PlayerState): number {
  let influence = 0;
  for (const tile of gameState.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.controlledBy === player.id && !planet.exhausted) {
        influence += getPlanetInfluence(planet.planetId);
      }
    }
  }
  return influence;
}

function calculateAvailableResources(gameState: GameState, player: PlayerState): number {
  let resources = player.tradeGoods;
  for (const tile of gameState.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.controlledBy === player.id && !planet.exhausted) {
        const data = findPlanetData(planet.planetId);
        resources += data?.resources || 0;
      }
    }
  }
  return resources;
}

function calculateProductionCapacity(tile: MapTile, player: PlayerState): number {
  let capacity = 0;
  for (const planet of tile.planets) {
    if (planet.controlledBy !== player.id) continue;
    for (const unit of planet.units) {
      if (unit.ownerId === player.id && unit.type === 'space_dock') {
        const planetData = findPlanetData(planet.planetId);
        capacity += (planetData?.resources || 0) + 2; // PRODUCTION value
      }
    }
  }
  return capacity;
}

function calculateFleetSupply(player: PlayerState): number {
  return player.commandTokens.fleet + 3;
}

function countFleetUnits(units: UnitInstance[], playerId: string): number {
  return units.filter(u => u.ownerId === playerId && countsTowardsFleetSupply(u.type)).length;
}

function getPlanetInfluence(planetId: string): number {
  for (const system of Object.values(systems)) {
    const planet = system.planets.find(p => p.id === planetId);
    if (planet) return planet.influence;
  }
  return 0;
}

function findPlanetData(planetId: string): { resources: number; influence: number } | null {
  for (const system of Object.values(systems)) {
    const planet = system.planets.find(p => p.id === planetId);
    if (planet) return { resources: planet.resources, influence: planet.influence };
  }
  return null;
}
