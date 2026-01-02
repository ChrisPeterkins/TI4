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
import { systems, factions } from '@ti4/game-data';
import { findTileAtPosition, getAdjacentPositions, hexDistance, findPathWithAbilities } from './utils/hex.js';
import { getUnitMoveValue, isShipType, isGroundUnit, getUnitCapacity, countsTowardsFleetSupply } from './utils/units.js';

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

  if (candidates.length === 0) return null;

  // Check if we can reach the best target with any ships
  for (const candidate of candidates) {
    if (canReachSystem(gameState, player, candidate.tile)) {
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

  return value;
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
      if (path) return true;
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

  // Simple production strategy: produce infantry and fighters
  const units: { type: UnitType; count: number }[] = [];
  let resourcesRemaining = availableResources;

  // Calculate production capacity
  const productionCapacity = calculateProductionCapacity(tile, player);
  let unitsProduced = 0;

  // Prioritize infantry if we have unclaimed/enemy planets
  const needsGround = tile.planets.some(p => p.controlledBy !== player.id);
  if (needsGround && resourcesRemaining >= 1 && unitsProduced < productionCapacity) {
    const infantryCount = Math.min(
      Math.floor(resourcesRemaining / 0.5),
      productionCapacity - unitsProduced,
      4 // Max 4 infantry per production
    );
    if (infantryCount > 0) {
      units.push({ type: 'infantry', count: infantryCount });
      resourcesRemaining -= infantryCount * 0.5;
      unitsProduced += infantryCount;
    }
  }

  // Then fighters if we have capacity
  if (resourcesRemaining >= 1 && unitsProduced < productionCapacity) {
    const fighterCount = Math.min(
      Math.floor(resourcesRemaining / 0.5),
      productionCapacity - unitsProduced,
      3
    );
    if (fighterCount > 0) {
      units.push({ type: 'fighter', count: fighterCount });
      resourcesRemaining -= fighterCount * 0.5;
      unitsProduced += fighterCount;
    }
  }

  // Then ships if we have resources
  const fleetSupply = calculateFleetSupply(player);
  const currentFleet = countFleetUnits(tile.units, player.id);

  if (resourcesRemaining >= 3 && unitsProduced < productionCapacity && currentFleet < fleetSupply) {
    // Produce a cruiser
    units.push({ type: 'cruiser', count: 1 });
    unitsProduced++;
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
  // Just skip if no clear tech choice
  return {};
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
      return generateRedistributeTokensAction(player);

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
  // Check public objectives
  for (const obj of [...gameState.objectives.publicStageI, ...gameState.objectives.publicStageII]) {
    if (!obj.revealed) continue;
    if (obj.scoredBy.includes(player.id)) continue;
    // Would need objective validation here - for now just return first unscored
    // This is simplified; real implementation would check requirements
    return obj.id;
  }
  return undefined;
}

function generateRedistributeTokensAction(player: PlayerState): RedistributeTokensAction {
  const total = player.commandTokens.tactics + player.commandTokens.fleet + player.commandTokens.strategy + 2;
  return {
    type: 'redistribute_tokens',
    playerId: player.id,
    timestamp: Date.now(),
    distribution: {
      tactics: Math.ceil(total / 2),
      fleet: Math.floor(total / 4) + 1,
      strategy: total - Math.ceil(total / 2) - Math.floor(total / 4) - 1,
    },
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

  // Simple voting: vote with all available influence
  const availableInfluence = calculateAvailableInfluence(gameState, player);
  const exhaustedPlanets = player.planets
    .filter(p => !p.exhausted)
    .map(p => p.planetId);

  // Determine outcome based on election type
  let outcome = 'for';
  if (agenda.currentElectionType === 'for_against') {
    outcome = 'for';
  } else if (agenda.currentElectionType === 'player') {
    // Vote for self
    outcome = player.id;
  } else if (agenda.currentElectionType === 'planet') {
    // Vote for one of our planets
    outcome = player.planets[0]?.planetId || '';
  }

  return {
    type: 'cast_vote',
    playerId: player.id,
    timestamp: Date.now(),
    outcome,
    exhaustedPlanets,
    abstain: availableInfluence === 0,
  };
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
