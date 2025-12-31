import type {
  GameState,
  GameAction,
  PlayerState,
  PickStrategyCardAction,
  PassAction,
  StrategicAction,
  StrategicSecondaryAction,
  StrategicSecondaryChoices,
} from '@ti4/shared';
import { systems } from '@ti4/game-data';

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

  // Otherwise check if active player is a bot
  if (botPlayerIds.has(gameState.activePlayerId)) {
    return gameState.activePlayerId;
  }

  return null;
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

  switch (gameState.phase) {
    case 'strategy':
      return generateStrategyPhaseAction(gameState, player);
    case 'action':
      return generateActionPhaseAction(gameState, player);
    case 'status':
      // Status phase is mostly automatic, no action needed from bots
      return null;
    case 'agenda':
      // Agenda phase - for now, bots abstain
      return null;
    default:
      return null;
  }
}

/**
 * Generate action for strategy phase (pick strategy card)
 */
function generateStrategyPhaseAction(gameState: GameState, player: PlayerState): PickStrategyCardAction | null {
  // Only pick if we don't have a card yet
  if (player.strategyCard !== null) return null;

  // Get available strategy cards
  const availableCards = gameState.strategyCards.filter(card => !card.pickedBy);

  if (availableCards.length === 0) return null;

  // Simple AI: prioritize cards based on general usefulness
  // This is a simplified ranking - a smarter AI would consider game state
  const cardPriority: Record<number, number> = {
    8: 10, // Imperial - score points!
    4: 9,  // Construction - build space docks
    5: 8,  // Trade - get trade goods
    6: 7,  // Warfare - action flexibility
    2: 6,  // Diplomacy - refresh planets
    7: 5,  // Technology - get tech
    3: 4,  // Politics - become speaker
    1: 3,  // Leadership - command tokens
  };

  // Sort by priority
  const sortedCards = [...availableCards].sort((a, b) => {
    const priorityA = cardPriority[a.number] ?? 0;
    const priorityB = cardPriority[b.number] ?? 0;
    return priorityB - priorityA;
  });

  // Pick the best available card
  const chosenCard = sortedCards[0];

  return {
    type: 'pick_strategy_card',
    playerId: player.id,
    timestamp: Date.now(),
    cardNumber: chosenCard.number,
  };
}

/**
 * Generate action for action phase
 */
function generateActionPhaseAction(gameState: GameState, player: PlayerState): GameAction | null {
  const subPhase = gameState.subPhase;

  // Handle strategic secondary phase - any bot that needs to respond
  if (subPhase === 'strategic_secondary' && gameState.strategicActionState) {
    const tracking = gameState.strategicActionState;
    const currentResponderId = tracking.secondaryOrder[tracking.currentSecondaryIndex];

    if (currentResponderId === player.id) {
      return generateSecondaryAction(gameState, player, tracking.cardNumber);
    }
    return null;
  }

  // Check if it's our turn for other actions
  if (gameState.activePlayerId !== player.id) {
    return null;
  }

  // If player already passed, nothing to do
  if (player.passed) {
    return null;
  }

  switch (subPhase) {
    case 'awaiting_action':
      return generateTurnAction(gameState, player);
    case 'strategic_primary':
      // Bot needs to complete primary ability
      // For now, bots auto-complete with defaults
      return null;
    default:
      return null;
  }
}

/**
 * Generate a turn action (when it's the bot's turn to act)
 */
function generateTurnAction(_gameState: GameState, player: PlayerState): GameAction {
  // Priority order for bot actions:
  // 1. Use strategy card if not used
  // 2. Pass if strategy card used or no good moves

  // Check if strategy card is available
  if (player.strategyCard !== null && !player.strategyCardUsed) {
    // Use the strategy card
    const action: StrategicAction = {
      type: 'strategic_action',
      playerId: player.id,
      timestamp: Date.now(),
      cardNumber: player.strategyCard,
    };
    return action;
  }

  // Otherwise, pass
  const passAction: PassAction = {
    type: 'pass',
    playerId: player.id,
    timestamp: Date.now(),
  };
  return passAction;
}

/**
 * Calculate delay for bot action (to feel more natural)
 */
export function getBotActionDelay(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case 'easy':
      return 2000 + Math.random() * 1000; // 2-3 seconds
    case 'medium':
      return 1000 + Math.random() * 1000; // 1-2 seconds
    case 'hard':
      return 500 + Math.random() * 500;  // 0.5-1 second
    default:
      return 1500;
  }
}

// ============================================================================
// Secondary Action Generation
// ============================================================================

/**
 * Generate a strategic secondary action for a bot
 */
function generateSecondaryAction(
  gameState: GameState,
  player: PlayerState,
  cardNumber: number
): StrategicSecondaryAction | null {
  const tracking = gameState.strategicActionState;
  const isFreeSecondary = cardNumber === 1 || tracking?.freeSecondaryPlayers?.includes(player.id);

  // Check if player has strategy token (except for Leadership which is free)
  if (!isFreeSecondary && player.commandTokens.strategy <= 0) {
    // Must decline - no strategy token
    return {
      type: 'strategic_secondary',
      playerId: player.id,
      timestamp: Date.now(),
      cardNumber,
      declined: true,
    };
  }

  // Generate choices based on card type
  let choices: StrategicSecondaryChoices = {};
  let shouldUse = true;

  switch (cardNumber) {
    case 1: // Leadership - Spend influence for command tokens (FREE)
      const leadershipChoices = generateLeadershipSecondaryChoices(gameState, player);
      choices = leadershipChoices.choices;
      shouldUse = leadershipChoices.shouldUse;
      break;

    case 2: // Diplomacy - Ready up to 2 planets
      choices = generateDiplomacySecondaryChoices(gameState, player);
      shouldUse = true; // Always worth using
      break;

    case 3: // Politics - Draw 2 action cards
      choices = {}; // No choices needed
      shouldUse = true; // Always worth using
      break;

    case 4: // Construction - Build structure
      const constructionChoices = generateConstructionSecondaryChoices(gameState, player);
      choices = constructionChoices.choices;
      shouldUse = constructionChoices.shouldUse;
      break;

    case 5: // Trade - Replenish commodities
      choices = {}; // No choices needed
      shouldUse = player.commodities < player.maxCommodities; // Only if can gain commodities
      break;

    case 6: // Warfare - Produce in home system
      const warfareChoices = generateWarfareSecondaryChoices(gameState, player);
      choices = warfareChoices.choices;
      shouldUse = warfareChoices.shouldUse;
      break;

    case 7: // Technology - Research 1 tech for 4 resources + 1 strategy token
      const techChoices = generateTechnologySecondaryChoices(gameState, player);
      choices = techChoices.choices;
      shouldUse = techChoices.shouldUse;
      break;

    case 8: // Imperial - Draw secret objective
      choices = {}; // No choices needed
      shouldUse = player.secretObjectives.length < 3; // Only if under limit
      break;

    default:
      shouldUse = false;
  }

  // Decide whether to use or decline
  if (!shouldUse) {
    return {
      type: 'strategic_secondary',
      playerId: player.id,
      timestamp: Date.now(),
      cardNumber,
      declined: true,
    };
  }

  return {
    type: 'strategic_secondary',
    playerId: player.id,
    timestamp: Date.now(),
    cardNumber,
    declined: false,
    choices,
  };
}

/**
 * Leadership Secondary: Spend influence for command tokens (1 per 3 influence)
 */
function generateLeadershipSecondaryChoices(
  gameState: GameState,
  player: PlayerState
): { choices: StrategicSecondaryChoices; shouldUse: boolean } {
  const availableInfluence = calculateAvailableInfluence(gameState, player);

  // Calculate how many tokens we can gain
  const maxTokens = Math.floor(availableInfluence / 3);

  if (maxTokens === 0) {
    return { choices: {}, shouldUse: false };
  }

  // Simple AI: spend enough influence to gain as many tokens as possible
  const influenceToSpend = maxTokens * 3;
  const tokensToGain = maxTokens;

  // Distribute tokens: prioritize tactics, then fleet, then strategy
  // Simple heuristic: put most in tactics
  const distribution = {
    tactics: Math.ceil(tokensToGain / 2),
    fleet: Math.floor(tokensToGain / 3),
    strategy: tokensToGain - Math.ceil(tokensToGain / 2) - Math.floor(tokensToGain / 3),
  };

  // Ensure total matches
  const total = distribution.tactics + distribution.fleet + distribution.strategy;
  if (total !== tokensToGain) {
    distribution.tactics += tokensToGain - total;
  }

  return {
    choices: {
      influenceSpent: influenceToSpend,
      commandTokenDistribution: distribution,
    },
    shouldUse: true,
  };
}

/**
 * Diplomacy Secondary: Ready up to 2 exhausted planets
 */
function generateDiplomacySecondaryChoices(
  gameState: GameState,
  player: PlayerState
): StrategicSecondaryChoices {
  // Find exhausted planets to ready (prefer high value)
  const exhaustedPlanets: { planetId: string; value: number }[] = [];

  for (const planetState of player.planets) {
    if (planetState.exhausted) {
      const planetData = findPlanetData(planetState.planetId);
      if (planetData) {
        exhaustedPlanets.push({
          planetId: planetState.planetId,
          value: planetData.resources + planetData.influence,
        });
      }
    }
  }

  // Sort by value (highest first) and take up to 2
  exhaustedPlanets.sort((a, b) => b.value - a.value);
  const planetsToReady = exhaustedPlanets.slice(0, 2).map(p => p.planetId);

  return { readiedPlanets: planetsToReady };
}

/**
 * Construction Secondary: Build 1 PDS or Space Dock
 * For simplicity, bots decline construction secondary for now
 */
function generateConstructionSecondaryChoices(
  _gameState: GameState,
  _player: PlayerState
): { choices: StrategicSecondaryChoices; shouldUse: boolean } {
  // Construction secondary requires complex decisions about where to build
  // For now, bots decline
  return { choices: {}, shouldUse: false };
}

/**
 * Warfare Secondary: Produce in home system
 * For simplicity, bots decline warfare secondary for now
 */
function generateWarfareSecondaryChoices(
  _gameState: GameState,
  _player: PlayerState
): { choices: StrategicSecondaryChoices; shouldUse: boolean } {
  // Warfare secondary requires complex production decisions
  // For now, bots decline
  return { choices: {}, shouldUse: false };
}

/**
 * Technology Secondary: Research 1 tech for 4 resources
 * For simplicity, bots decline technology secondary for now
 */
function generateTechnologySecondaryChoices(
  _gameState: GameState,
  _player: PlayerState
): { choices: StrategicSecondaryChoices; shouldUse: boolean } {
  // Technology secondary requires complex decisions about which tech and resources
  // For now, bots decline
  return { choices: {}, shouldUse: false };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate available influence from unexhausted planets
 */
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

/**
 * Get planet influence from game data
 */
function getPlanetInfluence(planetId: string): number {
  for (const system of Object.values(systems)) {
    for (const planet of system.planets) {
      if (planet.id === planetId) {
        return planet.influence;
      }
    }
  }
  return 0;
}

/**
 * Find planet data by ID
 */
function findPlanetData(planetId: string): { resources: number; influence: number } | null {
  for (const system of Object.values(systems)) {
    const planet = system.planets.find(p => p.id === planetId);
    if (planet) {
      return { resources: planet.resources, influence: planet.influence };
    }
  }
  return null;
}
