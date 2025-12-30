import type {
  GameState,
  PlayerState,
  StrategicPrimaryAction,
  StrategicPrimaryChoices,
  StrategicSecondaryAction,
  StrategicSecondaryChoices,
  HexCoord,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { findTileAtPosition } from '../utils/hex.js';
import { systems, factions } from '@ti4/game-data';
import { createUnitInstance, calculateProductionCost } from '../utils/units.js';
import { checkObjectiveRequirement } from '../utils/objectives.js';

/**
 * Handle strategic primary ability resolution
 */
export function handleStrategicPrimary(
  state: GameState,
  action: StrategicPrimaryAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (state.subPhase !== 'strategic_primary') {
    return { success: false, error: 'Not in strategic primary phase' };
  }

  const tracking = state.strategicActionState;
  if (!tracking || tracking.cardNumber !== action.cardNumber) {
    return { success: false, error: 'Strategy card mismatch' };
  }

  // Route to specific card handler
  let result: HandlerResult;
  switch (action.cardNumber) {
    case 1:
      result = handleLeadershipPrimary(state, player, action.choices);
      break;
    case 2:
      result = handleDiplomacyPrimary(state, player, action.choices);
      break;
    case 3:
      result = handlePoliticsPrimary(state, player, action.choices);
      break;
    case 4:
      result = handleConstructionPrimary(state, player, action.choices);
      break;
    case 5:
      result = handleTradePrimary(state, player, action.choices);
      break;
    case 6:
      result = handleWarfarePrimary(state, player, action.choices);
      break;
    case 7:
      result = handleTechnologyPrimary(state, player, action.choices);
      break;
    case 8:
      result = handleImperialPrimary(state, player, action.choices);
      break;
    default:
      return { success: false, error: 'Unknown strategy card' };
  }

  if (!result.success) {
    return result;
  }

  // Mark primary as resolved and transition to secondary
  tracking.primaryResolved = true;
  state.subPhase = 'strategic_secondary';
  state.version++;

  return {
    success: true,
    triggeredEvents: ['strategic_primary_resolved', ...(result.triggeredEvents || [])],
    data: result.data,
  };
}

/**
 * Handle strategic secondary ability resolution
 */
export function handleStrategicSecondary(
  state: GameState,
  action: StrategicSecondaryAction
): HandlerResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (state.subPhase !== 'strategic_secondary') {
    return { success: false, error: 'Not in strategic secondary phase' };
  }

  const tracking = state.strategicActionState;
  if (!tracking || tracking.cardNumber !== action.cardNumber) {
    return { success: false, error: 'Strategy card mismatch' };
  }

  // Verify it's this player's turn in secondary order
  const currentPlayerId = tracking.secondaryOrder[tracking.currentSecondaryIndex];
  if (currentPlayerId !== action.playerId) {
    return { success: false, error: 'Not your turn to resolve secondary' };
  }

  // If player declined
  if (action.declined) {
    tracking.secondaryResponses[action.playerId] = 'declined';
    return advanceSecondaryResolution(state);
  }

  // Check if player has strategy token to spend (Leadership is free)
  const isFreeSecondary = action.cardNumber === 1 ||
    tracking.freeSecondaryPlayers?.includes(action.playerId);

  if (!isFreeSecondary) {
    if (player.commandTokens.strategy <= 0) {
      return { success: false, error: 'No strategy tokens available' };
    }
    player.commandTokens.strategy--;
  }

  // Route to specific card secondary handler
  let result: HandlerResult;
  switch (action.cardNumber) {
    case 1:
      result = handleLeadershipSecondary(state, player, action.choices || {});
      break;
    case 2:
      result = handleDiplomacySecondary(state, player, action.choices || {});
      break;
    case 3:
      result = handlePoliticsSecondary(state, player, action.choices || {});
      break;
    case 4:
      result = handleConstructionSecondary(state, player, action.choices || {});
      break;
    case 5:
      result = handleTradeSecondary(state, player, action.choices || {});
      break;
    case 6:
      result = handleWarfareSecondary(state, player, action.choices || {});
      break;
    case 7:
      result = handleTechnologySecondary(state, player, action.choices || {});
      break;
    case 8:
      result = handleImperialSecondary(state, player, action.choices || {});
      break;
    default:
      return { success: false, error: 'Unknown strategy card' };
  }

  if (!result.success) {
    // Refund the token if action failed
    if (!isFreeSecondary) {
      player.commandTokens.strategy++;
    }
    return result;
  }

  tracking.secondaryResponses[action.playerId] = 'used';
  return advanceSecondaryResolution(state);
}

/**
 * Advance to next player in secondary resolution or complete
 */
export function advanceSecondaryResolution(state: GameState): HandlerResult {
  const tracking = state.strategicActionState;
  if (!tracking) {
    return { success: false, error: 'No active strategic action' };
  }

  tracking.currentSecondaryIndex++;

  // Check if all players have resolved
  if (tracking.currentSecondaryIndex >= tracking.secondaryOrder.length) {
    // Complete strategic action
    state.subPhase = 'awaiting_action';
    state.strategicActionState = undefined;

    // Advance to next active player
    advanceToNextActivePlayer(state);

    state.version++;
    return {
      success: true,
      triggeredEvents: ['strategic_action_completed'],
    };
  }

  state.version++;
  return {
    success: true,
    triggeredEvents: ['strategic_secondary_advanced'],
  };
}

/**
 * Initialize strategic action state when a player uses their strategy card
 */
export function initializeStrategicAction(
  state: GameState,
  playerId: string,
  cardNumber: number
): void {
  // Build secondary order: all players except the active one, in initiative order
  const secondaryOrder: string[] = [];

  // Find player's position in initiative order
  const activeIndex = state.initiativeOrder.indexOf(playerId);

  // Add players clockwise from active player
  for (let i = 1; i < state.players.length; i++) {
    const index = (activeIndex + i) % state.players.length;
    const pid = state.initiativeOrder[index];
    // Only include non-passed players
    const p = state.players.find(pl => pl.id === pid);
    if (p && !p.passed) {
      secondaryOrder.push(pid);
    }
  }

  state.strategicActionState = {
    cardNumber,
    primaryResolved: false,
    secondaryOrder,
    currentSecondaryIndex: 0,
    secondaryResponses: {},
  };

  // Initialize all secondary responses as pending
  for (const pid of secondaryOrder) {
    state.strategicActionState.secondaryResponses[pid] = 'pending';
  }
}

// ============================================
// Individual Card Handlers - Primary Abilities
// ============================================

function handleLeadershipPrimary(
  state: GameState,
  player: PlayerState,
  choices: StrategicPrimaryChoices
): HandlerResult {
  // Gain 3 command tokens
  const tokensGained = 3;

  // Calculate bonus tokens from influence
  const influenceSpent = choices.influenceSpent || 0;
  const bonusTokens = Math.floor(influenceSpent / 3);

  const totalTokens = tokensGained + bonusTokens;

  // Apply token distribution
  if (choices.tokenDistribution) {
    const { tactics, fleet, strategy } = choices.tokenDistribution;
    if (tactics + fleet + strategy !== totalTokens) {
      return { success: false, error: `Must distribute exactly ${totalTokens} tokens` };
    }
    player.commandTokens.tactics += tactics;
    player.commandTokens.fleet += fleet;
    player.commandTokens.strategy += strategy;
  } else {
    // Default: add all to tactics
    player.commandTokens.tactics += totalTokens;
  }

  // Exhaust planets for influence if spending
  if (influenceSpent > 0 && choices.planetsToReady) {
    // Note: planetsToReady here is repurposed to mean planets to exhaust
    // This should be validated that they have enough influence
    for (const planetId of choices.planetsToReady) {
      exhaustPlayerPlanet(state, player, planetId);
    }
  }

  return {
    success: true,
    triggeredEvents: ['leadership_primary_resolved'],
    data: { tokensGained: totalTokens },
  };
}

function handleDiplomacyPrimary(
  state: GameState,
  player: PlayerState,
  choices: StrategicPrimaryChoices
): HandlerResult {
  if (!choices.targetSystemPosition) {
    return { success: false, error: 'Must choose a target system' };
  }

  const targetTile = findTileAtPosition(state.map, choices.targetSystemPosition);
  if (!targetTile) {
    return { success: false, error: 'Target system not found' };
  }

  // Validate not Mecatol Rex
  if (targetTile.systemId === 18) { // Mecatol Rex is system 18
    return { success: false, error: 'Cannot choose Mecatol Rex' };
  }

  // Validate player controls a planet in the system
  const controlsPlanet = targetTile.planets.some(p => p.controlledBy === player.id);
  if (!controlsPlanet) {
    return { success: false, error: 'Must control a planet in the chosen system' };
  }

  // Each other player places a command token from reinforcements
  for (const otherPlayer of state.players) {
    if (otherPlayer.id === player.id) continue;

    // Check if they already have a token in this system
    if (targetTile.commandTokens.includes(otherPlayer.id)) continue;

    // Place token from reinforcements (no cost to them)
    targetTile.commandTokens.push(otherPlayer.id);
  }

  // Ready up to 2 exhausted planets
  if (choices.planetsToReady) {
    const planetsToReady = choices.planetsToReady.slice(0, 2);
    for (const planetId of planetsToReady) {
      readyPlayerPlanet(state, player, planetId);
    }
  }

  return {
    success: true,
    triggeredEvents: ['diplomacy_primary_resolved'],
    data: { lockedSystem: choices.targetSystemPosition },
  };
}

function handlePoliticsPrimary(
  state: GameState,
  player: PlayerState,
  choices: StrategicPrimaryChoices
): HandlerResult {
  // Choose new speaker (must be different from current speaker)
  if (!choices.newSpeakerId) {
    return { success: false, error: 'Must choose a new speaker' };
  }

  if (choices.newSpeakerId === state.speakerId) {
    return { success: false, error: 'Must choose a different player as speaker' };
  }

  const newSpeaker = state.players.find(p => p.id === choices.newSpeakerId);
  if (!newSpeaker) {
    return { success: false, error: 'New speaker not found' };
  }

  state.speakerId = choices.newSpeakerId;

  // Draw 2 action cards
  const drawnCards = drawActionCards(state, player, 2);

  // Look at top 2 agenda cards and arrange them
  if (choices.agendaArrangement && state.agendaDeck.length >= 2) {
    const topTwo = [state.agendaDeck.shift()!, state.agendaDeck.shift()!];

    // Rebuild deck based on arrangement
    const newTop: string[] = [];
    const newBottom: string[] = [];

    for (const arrangement of choices.agendaArrangement) {
      const cardId = arrangement.cardId;
      if (topTwo.includes(cardId)) {
        if (arrangement.position === 'top') {
          newTop.push(cardId);
        } else {
          newBottom.push(cardId);
        }
      }
    }

    // Put arranged cards back
    state.agendaDeck = [...newTop, ...state.agendaDeck, ...newBottom];
  }

  return {
    success: true,
    triggeredEvents: ['politics_primary_resolved'],
    data: { newSpeakerId: choices.newSpeakerId, cardsDrawn: drawnCards.length },
  };
}

function handleConstructionPrimary(
  state: GameState,
  player: PlayerState,
  choices: StrategicPrimaryChoices
): HandlerResult {
  const placedStructures: { type: string; planetId: string }[] = [];

  // First structure: PDS or Space Dock
  if (choices.firstStructure) {
    const result = placeStructure(state, player, choices.firstStructure.type, choices.firstStructure.planetId);
    if (!result.success) return result;
    placedStructures.push(choices.firstStructure);
  }

  // Second structure: PDS only
  if (choices.secondStructure) {
    if (choices.secondStructure.type !== 'pds') {
      return { success: false, error: 'Second structure must be a PDS' };
    }
    const result = placeStructure(state, player, 'pds', choices.secondStructure.planetId);
    if (!result.success) return result;
    placedStructures.push(choices.secondStructure);
  }

  return {
    success: true,
    triggeredEvents: ['construction_primary_resolved'],
    data: { placedStructures },
  };
}

function handleTradePrimary(
  state: GameState,
  player: PlayerState,
  choices: StrategicPrimaryChoices
): HandlerResult {
  // Gain 3 trade goods
  player.tradeGoods += 3;

  // Replenish commodities
  player.commodities = player.maxCommodities;

  // Set free secondary players
  if (choices.freeSecondaryPlayers && choices.freeSecondaryPlayers.length > 0) {
    if (state.strategicActionState) {
      state.strategicActionState.freeSecondaryPlayers = choices.freeSecondaryPlayers;
    }
  }

  return {
    success: true,
    triggeredEvents: ['trade_primary_resolved'],
    data: {
      tradeGoodsGained: 3,
      commoditiesReplenished: player.maxCommodities,
      freeSecondaryPlayers: choices.freeSecondaryPlayers,
    },
  };
}

function handleWarfarePrimary(
  state: GameState,
  player: PlayerState,
  choices: StrategicPrimaryChoices
): HandlerResult {
  // Remove 1 command token from the board
  if (choices.removedTokenSystem) {
    const tile = findTileAtPosition(state.map, choices.removedTokenSystem);
    if (tile) {
      const tokenIndex = tile.commandTokens.indexOf(player.id);
      if (tokenIndex !== -1) {
        tile.commandTokens.splice(tokenIndex, 1);
      }
    }
  }

  // Gain 1 command token (handled via redistribution)
  const currentTotal = player.commandTokens.tactics + player.commandTokens.fleet + player.commandTokens.strategy;
  const newTotal = currentTotal + 1;

  // Apply new distribution
  if (choices.newTokenDistribution) {
    const { tactics, fleet, strategy } = choices.newTokenDistribution;
    if (tactics + fleet + strategy !== newTotal) {
      return { success: false, error: `Must distribute exactly ${newTotal} tokens` };
    }
    player.commandTokens.tactics = tactics;
    player.commandTokens.fleet = fleet;
    player.commandTokens.strategy = strategy;
  } else {
    // Default: add to tactics
    player.commandTokens.tactics++;
  }

  return {
    success: true,
    triggeredEvents: ['warfare_primary_resolved'],
  };
}

function handleTechnologyPrimary(
  state: GameState,
  player: PlayerState,
  choices: StrategicPrimaryChoices
): HandlerResult {
  // Research first tech (free)
  if (choices.firstTechId) {
    const result = researchTechnology(state, player, choices.firstTechId);
    if (!result.success) return result;
  }

  // Research second tech (costs 6 resources)
  if (choices.secondTechId) {
    // Exhaust planets for 6 resources
    if (choices.exhaustedPlanets) {
      let resourcesExhausted = 0;
      for (const planetId of choices.exhaustedPlanets) {
        const planetResources = getPlanetResources(planetId);
        exhaustPlayerPlanet(state, player, planetId);
        resourcesExhausted += planetResources;
      }

      // Can also use trade goods for remaining
      const remainingNeeded = 6 - resourcesExhausted;
      if (remainingNeeded > 0) {
        if (player.tradeGoods < remainingNeeded) {
          return { success: false, error: 'Not enough resources for second technology' };
        }
        player.tradeGoods -= remainingNeeded;
      }
    }

    const result = researchTechnology(state, player, choices.secondTechId);
    if (!result.success) return result;
  }

  return {
    success: true,
    triggeredEvents: ['technology_primary_resolved'],
    data: {
      firstTech: choices.firstTechId,
      secondTech: choices.secondTechId,
    },
  };
}

function handleImperialPrimary(
  state: GameState,
  player: PlayerState,
  choices: StrategicPrimaryChoices
): HandlerResult {
  const results: { scored?: string; secretDrawn: boolean; vpGained: boolean; error?: string } = {
    secretDrawn: false,
    vpGained: false,
  };

  // Score 1 public objective if possible
  if (choices.scoredObjectiveId) {
    const objective = findPublicObjective(state, choices.scoredObjectiveId);
    if (!objective) {
      return { success: false, error: 'Objective not found or not revealed' };
    }

    if (objective.scoredBy.includes(player.id)) {
      return { success: false, error: 'You have already scored this objective' };
    }

    // Validate the player can actually score this objective
    const validation = checkObjectiveRequirement(
      state,
      player.id,
      choices.scoredObjectiveId,
      choices.exhaustedPlanets ? { exhaustedPlanets: choices.exhaustedPlanets } : undefined
    );

    if (!validation.canScore) {
      return { success: false, error: validation.reason || 'Cannot score objective' };
    }

    // Apply spent resources for "spend" objectives
    if (choices.exhaustedPlanets) {
      for (const planetId of choices.exhaustedPlanets) {
        exhaustPlayerPlanet(state, player, planetId);
      }
    }

    // Score the objective
    objective.scoredBy.push(player.id);
    player.scoredObjectives.push(choices.scoredObjectiveId);

    // Determine points based on objective type (Stage I = 1 VP, Stage II = 2 VP)
    const isStageII = state.objectives.publicStageII.some(
      o => o.id === choices.scoredObjectiveId
    );
    const points = isStageII ? 2 : 1;
    player.score += points;

    results.scored = choices.scoredObjectiveId;
  }

  // Draw 1 secret objective
  if (state.objectives.secretDeck.length > 0 && player.secretObjectives.length < 3) {
    const secretId = state.objectives.secretDeck.shift()!;
    player.secretObjectives.push(secretId);
    results.secretDrawn = true;
  }

  // Mecatol Rex: gain 1 VP or place token
  const mecatolTile = state.map.tiles.find(t => t.systemId === 18);
  if (mecatolTile) {
    const controlsMecatol = mecatolTile.planets.some(p => p.controlledBy === player.id);

    if (controlsMecatol) {
      player.score++;
      results.vpGained = true;
    } else if (choices.placeMecatolToken) {
      // Place command token in Mecatol Rex system
      if (!mecatolTile.commandTokens.includes(player.id)) {
        mecatolTile.commandTokens.push(player.id);
      }
    }
  }

  return {
    success: true,
    triggeredEvents: ['imperial_primary_resolved'],
    data: results,
  };
}

// ============================================
// Individual Card Handlers - Secondary Abilities
// ============================================

function handleLeadershipSecondary(
  state: GameState,
  player: PlayerState,
  choices: StrategicSecondaryChoices
): HandlerResult {
  // Note: Leadership secondary has no token cost (unique)
  const influenceSpent = choices.influenceSpent || 0;
  const tokensGained = Math.floor(influenceSpent / 3);

  if (tokensGained > 0) {
    if (choices.commandTokenDistribution) {
      const { tactics, fleet, strategy } = choices.commandTokenDistribution;
      if (tactics + fleet + strategy !== tokensGained) {
        return { success: false, error: `Must distribute exactly ${tokensGained} tokens` };
      }
      player.commandTokens.tactics += tactics;
      player.commandTokens.fleet += fleet;
      player.commandTokens.strategy += strategy;
    } else {
      player.commandTokens.tactics += tokensGained;
    }
  }

  return {
    success: true,
    triggeredEvents: ['leadership_secondary_resolved'],
    data: { tokensGained },
  };
}

function handleDiplomacySecondary(
  state: GameState,
  player: PlayerState,
  choices: StrategicSecondaryChoices
): HandlerResult {
  // Ready up to 2 exhausted planets
  if (choices.readiedPlanets) {
    const planetsToReady = choices.readiedPlanets.slice(0, 2);
    for (const planetId of planetsToReady) {
      readyPlayerPlanet(state, player, planetId);
    }
  }

  return {
    success: true,
    triggeredEvents: ['diplomacy_secondary_resolved'],
    data: { planetsReadied: choices.readiedPlanets?.length || 0 },
  };
}

function handlePoliticsSecondary(
  state: GameState,
  player: PlayerState,
  _choices: StrategicSecondaryChoices
): HandlerResult {
  // Draw 2 action cards
  const drawnCards = drawActionCards(state, player, 2);

  return {
    success: true,
    triggeredEvents: ['politics_secondary_resolved'],
    data: { cardsDrawn: drawnCards.length },
  };
}

function handleConstructionSecondary(
  state: GameState,
  player: PlayerState,
  choices: StrategicSecondaryChoices
): HandlerResult {
  // Place token in chosen system (or return to reinforcements if already present)
  if (choices.systemPosition) {
    const tile = findTileAtPosition(state.map, choices.systemPosition);
    if (tile && !tile.commandTokens.includes(player.id)) {
      tile.commandTokens.push(player.id);
    }
    // If already has token, it just goes back to reinforcements (no action needed)
  }

  // Place 1 PDS or Space Dock
  if (choices.structureBuilt) {
    const result = placeStructure(state, player, choices.structureBuilt.type, choices.structureBuilt.planetId);
    if (!result.success) return result;
  }

  return {
    success: true,
    triggeredEvents: ['construction_secondary_resolved'],
  };
}

function handleTradeSecondary(
  state: GameState,
  player: PlayerState,
  _choices: StrategicSecondaryChoices
): HandlerResult {
  // Replenish commodities
  player.commodities = player.maxCommodities;

  return {
    success: true,
    triggeredEvents: ['trade_secondary_resolved'],
    data: { commoditiesReplenished: player.maxCommodities },
  };
}

function handleWarfareSecondary(
  state: GameState,
  player: PlayerState,
  choices: StrategicSecondaryChoices
): HandlerResult {
  // Find home system
  const homeSystem = findPlayerHomeSystem(state, player);
  if (!homeSystem) {
    return { success: false, error: 'Home system not found' };
  }

  // Find space dock in home system
  const spaceDock = homeSystem.planets.flatMap(p => p.units)
    .find(u => u.type === 'space_dock' && u.ownerId === player.id);

  if (!spaceDock) {
    return { success: false, error: 'No space dock in home system' };
  }

  // Production with +2 capacity bonus
  if (choices.unitsProduced && choices.unitsProduced.length > 0) {
    const totalCost = calculateProductionCost(choices.unitsProduced);

    // Exhaust planets for resources
    let resourcesAvailable = 0;
    if (choices.exhaustedPlanets) {
      for (const planetId of choices.exhaustedPlanets) {
        resourcesAvailable += getPlanetResources(planetId);
        exhaustPlayerPlanet(state, player, planetId);
      }
    }
    resourcesAvailable += player.tradeGoods;

    if (resourcesAvailable < totalCost) {
      return { success: false, error: 'Not enough resources' };
    }

    // Spend trade goods if needed
    const tradeGoodsNeeded = Math.max(0, totalCost - (resourcesAvailable - player.tradeGoods));
    player.tradeGoods -= tradeGoodsNeeded;

    // Create units
    for (const production of choices.unitsProduced) {
      for (let i = 0; i < production.count; i++) {
        const unit = createUnitInstance(production.type, player.id);
        homeSystem.units.push(unit);
      }
    }
  }

  return {
    success: true,
    triggeredEvents: ['warfare_secondary_resolved'],
  };
}

function handleTechnologySecondary(
  state: GameState,
  player: PlayerState,
  choices: StrategicSecondaryChoices
): HandlerResult {
  // Costs 1 strategy token (already spent) + 4 resources
  if (!choices.techId) {
    return { success: false, error: 'Must choose a technology to research' };
  }

  // Pay 4 resources
  let resourcesPaid = 0;
  if (choices.exhaustedPlanets) {
    for (const planetId of choices.exhaustedPlanets) {
      resourcesPaid += getPlanetResources(planetId);
      exhaustPlayerPlanet(state, player, planetId);
    }
  }

  const remaining = 4 - resourcesPaid;
  if (remaining > 0) {
    if (player.tradeGoods < remaining) {
      return { success: false, error: 'Not enough resources (need 4 total)' };
    }
    player.tradeGoods -= remaining;
  }

  // Research the technology
  return researchTechnology(state, player, choices.techId);
}

function handleImperialSecondary(
  state: GameState,
  player: PlayerState,
  _choices: StrategicSecondaryChoices
): HandlerResult {
  // Draw 1 secret objective
  if (player.secretObjectives.length >= 3) {
    return { success: false, error: 'Already at maximum secret objectives (3)' };
  }

  if (state.objectives.secretDeck.length === 0) {
    return { success: false, error: 'No secret objectives remaining' };
  }

  const secretId = state.objectives.secretDeck.shift()!;
  player.secretObjectives.push(secretId);

  return {
    success: true,
    triggeredEvents: ['imperial_secondary_resolved'],
    data: { secretDrawn: true },
  };
}

// ============================================
// Helper Functions
// ============================================

function advanceToNextActivePlayer(state: GameState): void {
  const currentIndex = state.initiativeOrder.indexOf(state.activePlayerId);
  const playerCount = state.initiativeOrder.length;

  for (let i = 1; i <= playerCount; i++) {
    const nextIndex = (currentIndex + i) % playerCount;
    const nextPlayerId = state.initiativeOrder[nextIndex];
    const nextPlayer = state.players.find(p => p.id === nextPlayerId);

    if (nextPlayer && !nextPlayer.passed) {
      state.activePlayerId = nextPlayerId;
      return;
    }
  }
}

function exhaustPlayerPlanet(state: GameState, player: PlayerState, planetId: string): void {
  // Update player's planet state
  const planetState = player.planets.find(p => p.planetId === planetId);
  if (planetState) {
    planetState.exhausted = true;
  }

  // Update map planet state
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.planetId === planetId && planet.controlledBy === player.id) {
        planet.exhausted = true;
        return;
      }
    }
  }
}

function readyPlayerPlanet(state: GameState, player: PlayerState, planetId: string): void {
  // Update player's planet state
  const planetState = player.planets.find(p => p.planetId === planetId);
  if (planetState) {
    planetState.exhausted = false;
  }

  // Update map planet state
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.planetId === planetId && planet.controlledBy === player.id) {
        planet.exhausted = false;
        return;
      }
    }
  }
}

function getPlanetResources(planetId: string): number {
  for (const system of Object.values(systems)) {
    for (const planet of system.planets) {
      if (planet.id === planetId) {
        return planet.resources;
      }
    }
  }
  return 0;
}

function drawActionCards(state: GameState, player: PlayerState, count: number): string[] {
  const drawn: string[] = [];

  for (let i = 0; i < count; i++) {
    if (state.actionCardDeck.length === 0) {
      // Reshuffle discard
      if (state.actionCardDiscard.length === 0) break;
      state.actionCardDeck = [...state.actionCardDiscard].sort(() => Math.random() - 0.5);
      state.actionCardDiscard = [];
    }

    const card = state.actionCardDeck.shift();
    if (card) {
      player.actionCards.push(card);
      drawn.push(card);
    }
  }

  return drawn;
}

function placeStructure(
  state: GameState,
  player: PlayerState,
  structureType: 'pds' | 'space_dock',
  planetId: string
): HandlerResult {
  // Find the planet
  let targetPlanet = null;
  let targetTile = null;

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.planetId === planetId) {
        targetPlanet = planet;
        targetTile = tile;
        break;
      }
    }
    if (targetPlanet) break;
  }

  if (!targetPlanet || !targetTile) {
    return { success: false, error: 'Planet not found' };
  }

  if (targetPlanet.controlledBy !== player.id) {
    return { success: false, error: 'You do not control this planet' };
  }

  // Check structure limits
  const existingStructures = countPlayerStructures(state, player.id);

  if (structureType === 'pds' && existingStructures.pds >= 6) {
    return { success: false, error: 'Maximum PDS limit reached (6)' };
  }

  if (structureType === 'space_dock') {
    if (existingStructures.spaceDock >= 3) {
      return { success: false, error: 'Maximum Space Dock limit reached (3)' };
    }
    // Check if planet already has a space dock
    const hasSpaceDock = targetPlanet.units.some(u => u.type === 'space_dock');
    if (hasSpaceDock) {
      return { success: false, error: 'Planet already has a Space Dock' };
    }
  }

  // Place the structure
  const unit = createUnitInstance(structureType, player.id);
  unit.planetId = planetId;
  targetPlanet.units.push(unit);

  return { success: true };
}

function countPlayerStructures(state: GameState, playerId: string): { pds: number; spaceDock: number } {
  let pds = 0;
  let spaceDock = 0;

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      for (const unit of planet.units) {
        if (unit.ownerId === playerId) {
          if (unit.type === 'pds') pds++;
          if (unit.type === 'space_dock') spaceDock++;
        }
      }
    }
  }

  return { pds, spaceDock };
}

function researchTechnology(
  state: GameState,
  player: PlayerState,
  techId: string
): HandlerResult {
  // Check if player already has this tech
  if (player.technologies.includes(techId)) {
    return { success: false, error: 'Already have this technology' };
  }

  // Add the technology
  player.technologies.push(techId);

  return {
    success: true,
    triggeredEvents: ['technology_researched'],
    data: { techId },
  };
}

function findPublicObjective(state: GameState, objectiveId: string) {
  for (const obj of state.objectives.publicStageI) {
    if (obj.id === objectiveId && obj.revealed) return obj;
  }
  for (const obj of state.objectives.publicStageII) {
    if (obj.id === objectiveId && obj.revealed) return obj;
  }
  return null;
}

function findPlayerHomeSystem(state: GameState, player: PlayerState) {
  const faction = factions[player.faction];
  if (!faction) return null;

  const homeSystemId = faction.homeSystemId;
  return state.map.tiles.find(t => t.systemId === homeSystemId);
}
