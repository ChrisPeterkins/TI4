/**
 * The Firmament / The Obsidian Faction Ability Handlers
 *
 * Key mechanics:
 * - PLOTS WITHIN PLOTS: Score already-scored secrets to gain plot cards
 * - Plot cards provide one-time powerful effects
 * - PUPPETS OF THE BLADE: Transform from Firmament to Obsidian
 * - Obsidian has different abilities focused on marionettes (puppeted players)
 */

import type {
  GameState,
  PlayerState,
  UnitInstance,
  MapTile,
} from '@ti4/shared';

// ============================================================================
// Types
// ============================================================================

export interface HandlerResult {
  success: boolean;
  error?: string;
  triggeredEvents?: string[];
  data?: Record<string, unknown>;
}

export interface DrawPlotCardAction {
  type: 'draw_plot_card';
  playerId: string;
}

export interface PlayPlotCardAction {
  type: 'play_plot_card';
  playerId: string;
  cardId: string;
  targets?: {
    playerId?: string;
    systemId?: string;
    planetId?: string;
  };
}

export interface TransformToObsidianAction {
  type: 'transform_to_obsidian';
  playerId: string;
}

// Plot card definitions
export type PlotCardId =
  | 'shadow_strike'
  | 'puppet_strings'
  | 'false_flag'
  | 'dark_bargain'
  | 'hidden_agenda'
  | 'blade_in_the_dark';

export interface PlotCard {
  id: PlotCardId;
  name: string;
  description: string;
  timing: 'action' | 'combat' | 'agenda' | 'reaction';
}

const PLOT_CARDS: Record<PlotCardId, PlotCard> = {
  shadow_strike: {
    id: 'shadow_strike',
    name: 'Shadow Strike',
    description: 'Destroy 1 ship in a system containing your units.',
    timing: 'action',
  },
  puppet_strings: {
    id: 'puppet_strings',
    name: 'Puppet Strings',
    description: 'Control another player\'s vote on the current agenda.',
    timing: 'agenda',
  },
  false_flag: {
    id: 'false_flag',
    name: 'False Flag',
    description: 'After combat, the winner does not take control of planets.',
    timing: 'combat',
  },
  dark_bargain: {
    id: 'dark_bargain',
    name: 'Dark Bargain',
    description: 'Gain 3 trade goods and 2 command tokens.',
    timing: 'action',
  },
  hidden_agenda: {
    id: 'hidden_agenda',
    name: 'Hidden Agenda',
    description: 'Look at another player\'s secret objectives.',
    timing: 'action',
  },
  blade_in_the_dark: {
    id: 'blade_in_the_dark',
    name: 'Blade in the Dark',
    description: 'Cancel 1 action card just played.',
    timing: 'reaction',
  },
};

// ============================================================================
// Plot Card Management
// ============================================================================

/**
 * Check if player is Firmament or Obsidian
 */
export function isFirmamentOrObsidian(state: GameState, playerId: string): boolean {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  return player?.faction === 'firmament' || player?.faction === 'obsidian';
}

/**
 * Check if player is specifically Obsidian (transformed)
 */
export function isObsidian(state: GameState, playerId: string): boolean {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  return player?.faction === 'obsidian';
}

/**
 * Get plot cards in hand
 */
export function getPlotCards(state: GameState, playerId: string): string[] {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  return player?.plotCards ?? [];
}

/**
 * Get plot cards in play
 */
export function getPlotCardsInPlay(state: GameState, playerId: string): string[] {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  return player?.plotCardsInPlay ?? [];
}

/**
 * Draw a plot card (PLOTS WITHIN PLOTS ability)
 * Called when Firmament/Obsidian scores an already-scored secret objective
 */
export function handleDrawPlotCard(
  state: GameState,
  action: DrawPlotCardAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!isFirmamentOrObsidian(state, action.playerId)) {
    return { success: false, error: 'Only Firmament/Obsidian can draw plot cards' };
  }

  // Initialize plot cards array if needed
  if (!player.plotCards) {
    player.plotCards = [];
  }

  // Draw a random plot card
  const availableCards = Object.keys(PLOT_CARDS) as PlotCardId[];
  const cardId = availableCards[Math.floor(Math.random() * availableCards.length)];

  player.plotCards.push(cardId);

  return {
    success: true,
    triggeredEvents: ['plot_card_drawn'],
    data: {
      playerId: action.playerId,
      cardId,
      cardName: PLOT_CARDS[cardId].name,
    },
  };
}

/**
 * Play a plot card
 */
export function handlePlayPlotCard(
  state: GameState,
  action: PlayPlotCardAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!player.plotCards || !player.plotCards.includes(action.cardId)) {
    return { success: false, error: 'Player does not have this plot card' };
  }

  const plotCard = PLOT_CARDS[action.cardId as PlotCardId];
  if (!plotCard) {
    return { success: false, error: 'Invalid plot card' };
  }

  // Apply card effect
  const effect = applyPlotCardEffect(state, action, plotCard);
  if (!effect.success) {
    return effect;
  }

  // Remove the card from hand
  const cardIndex = player.plotCards.indexOf(action.cardId);
  player.plotCards.splice(cardIndex, 1);

  // Some cards go to play area
  if (!player.plotCardsInPlay) {
    player.plotCardsInPlay = [];
  }

  return {
    success: true,
    triggeredEvents: ['plot_card_played', ...(effect.triggeredEvents ?? [])],
    data: {
      playerId: action.playerId,
      cardId: action.cardId,
      cardName: plotCard.name,
      ...(effect.data ?? {}),
    },
  };
}

/**
 * Apply the effect of a plot card
 */
function applyPlotCardEffect(
  state: GameState,
  action: PlayPlotCardAction,
  plotCard: PlotCard
): HandlerResult {
  switch (action.cardId as PlotCardId) {
    case 'shadow_strike': {
      // Destroy 1 ship in a system containing your units
      if (!action.targets?.systemId) {
        return { success: false, error: 'Must specify target system' };
      }
      const tile = state.map.tiles.find((t: MapTile) => t.id === action.targets?.systemId);
      if (!tile) {
        return { success: false, error: 'System not found' };
      }
      // Verify player has units in system
      const hasUnits = tile.units.some((u: UnitInstance) => u.ownerId === action.playerId);
      if (!hasUnits) {
        return { success: false, error: 'No units in system' };
      }
      // Would need to specify target ship - simplified here
      return {
        success: true,
        triggeredEvents: ['ship_destroyed'],
        data: { effect: 'shadow_strike', systemId: action.targets.systemId },
      };
    }

    case 'puppet_strings': {
      // Control another player's vote
      if (!action.targets?.playerId) {
        return { success: false, error: 'Must specify target player' };
      }
      return {
        success: true,
        triggeredEvents: ['vote_controlled'],
        data: { effect: 'puppet_strings', targetPlayerId: action.targets.playerId },
      };
    }

    case 'false_flag': {
      // After combat, winner doesn't take planets
      return {
        success: true,
        triggeredEvents: ['combat_modified'],
        data: { effect: 'false_flag', preventPlanetCapture: true },
      };
    }

    case 'dark_bargain': {
      // Gain 3 trade goods and 2 command tokens
      const player = state.players.find((p: PlayerState) => p.id === action.playerId);
      if (player) {
        player.tradeGoods += 3;
        player.commandTokens.tactics += 1;
        player.commandTokens.strategy += 1;
      }
      return {
        success: true,
        triggeredEvents: ['resources_gained'],
        data: { effect: 'dark_bargain', tradeGoods: 3, commandTokens: 2 },
      };
    }

    case 'hidden_agenda': {
      // Look at another player's secret objectives
      if (!action.targets?.playerId) {
        return { success: false, error: 'Must specify target player' };
      }
      const targetPlayer = state.players.find(
        (p: PlayerState) => p.id === action.targets?.playerId
      );
      if (!targetPlayer) {
        return { success: false, error: 'Target player not found' };
      }
      return {
        success: true,
        triggeredEvents: ['secrets_revealed'],
        data: {
          effect: 'hidden_agenda',
          targetPlayerId: action.targets.playerId,
          secrets: targetPlayer.secretObjectives,
        },
      };
    }

    case 'blade_in_the_dark': {
      // Cancel 1 action card just played
      return {
        success: true,
        triggeredEvents: ['action_card_cancelled'],
        data: { effect: 'blade_in_the_dark' },
      };
    }

    default:
      return { success: false, error: 'Unknown plot card' };
  }
}

/**
 * Get plot card details
 */
export function getPlotCardDetails(cardId: string): PlotCard | undefined {
  return PLOT_CARDS[cardId as PlotCardId];
}

// ============================================================================
// Transformation - Firmament to Obsidian
// ============================================================================

/**
 * Transform from Firmament to Obsidian
 * Triggered by Sharsiss hero ability (PUPPETS OF THE BLADE)
 */
export function handleTransformToObsidian(
  state: GameState,
  action: TransformToObsidianAction
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === action.playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (player.faction !== 'firmament') {
    return { success: false, error: 'Only Firmament can transform to Obsidian' };
  }

  // Check if hero ability is available
  if (!player.leaders?.hero?.unlocked || player.leaders.hero.purged) {
    return { success: false, error: 'Hero ability not available' };
  }

  // Perform transformation
  player.faction = 'obsidian';

  // Purge the hero
  player.leaders.hero.purged = true;

  // Update home planet if applicable (Cronos -> Cronos Hollow)
  for (const planetState of player.planets) {
    if (planetState.planetId === 'cronos') {
      planetState.planetId = 'cronos_hollow';
    }
  }

  return {
    success: true,
    triggeredEvents: ['faction_transformed', 'hero_purged'],
    data: {
      playerId: action.playerId,
      fromFaction: 'firmament',
      toFaction: 'obsidian',
    },
  };
}

// ============================================================================
// Obsidian-Specific Abilities
// ============================================================================

/**
 * Check if a player is a marionette (puppeted by Obsidian)
 */
export function isMarionette(state: GameState, playerId: string): boolean {
  // Check if Obsidian player has puppeted this player
  // This would be tracked in game state
  const obsidianPlayer = state.players.find(
    (p: PlayerState) => p.faction === 'obsidian'
  );
  if (!obsidianPlayer) return false;

  // Placeholder - would check marionette state
  return false;
}

/**
 * Get Obsidian's marionettes
 */
export function getMarionettes(state: GameState): string[] {
  // Placeholder - would return list of puppeted player IDs
  return [];
}

/**
 * Apply Obsidian's BLADE'S ORCHESTRA ability
 * Marionettes cannot vote against Obsidian player
 */
export function applyBladesOrchestra(
  state: GameState,
  obsidianPlayerId: string,
  votingPlayerId: string,
  voteOutcome: string
): boolean {
  // Check if voting player is a marionette
  if (!isMarionette(state, votingPlayerId)) {
    return true; // Not a marionette, can vote normally
  }

  // Check if vote is against Obsidian player
  // This would need context about what "against" means for the current agenda
  return true; // Placeholder
}

// ============================================================================
// Flagship Abilities
// ============================================================================

/**
 * Handle The Dark Mirror flagship ability (Firmament)
 * When producing ships, may produce 1 additional non-fighter ship
 */
export function getDarkMirrorProductionBonus(
  state: GameState,
  playerId: string
): { bonusShip: boolean; type: 'non_fighter' } | null {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'firmament') return null;

  // Check if flagship is in the production system
  // This would be called from production handler
  return { bonusShip: true, type: 'non_fighter' };
}

/**
 * Handle Hollowing flagship ability (Obsidian)
 * After winning a space combat, may make 1 opponent ship into a marionette
 */
export function handleHollowingAbility(
  state: GameState,
  playerId: string,
  targetShipId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'obsidian') {
    return { success: false, error: 'Only Obsidian can use Hollowing ability' };
  }

  // Verify combat just ended and player won
  if (state.activeCombat) {
    return { success: false, error: 'Combat is still active' };
  }

  // Would implement marionette conversion here
  return {
    success: true,
    triggeredEvents: ['ship_puppeted'],
    data: {
      playerId,
      targetShipId,
    },
  };
}

// ============================================================================
// Mech Abilities
// ============================================================================

/**
 * Handle Shadow mech ability (Firmament)
 * May coexist with other players' ground forces
 */
export function canShadowMechCoexist(state: GameState, playerId: string): boolean {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  return player?.faction === 'firmament';
}

/**
 * Handle Hollowed mech ability (Obsidian)
 * When destroyed, may puppet 1 enemy infantry on the same planet
 */
export function handleHollowedMechDeath(
  state: GameState,
  playerId: string,
  mechId: string,
  planetId: string
): HandlerResult {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || player.faction !== 'obsidian') {
    return { success: true, data: { triggered: false } };
  }

  // Find enemy infantry on the planet
  for (const tile of state.map.tiles) {
    const planet = tile.planets.find(p => p.id === planetId);
    if (planet) {
      const enemyInfantry = planet.units.find(
        (u: UnitInstance) => u.ownerId !== playerId && u.type === 'infantry'
      );

      if (enemyInfantry) {
        // Convert infantry to Obsidian's control
        enemyInfantry.ownerId = playerId;

        return {
          success: true,
          triggeredEvents: ['infantry_puppeted'],
          data: {
            playerId,
            mechId,
            planetId,
            puppetedUnitId: enemyInfantry.id,
          },
        };
      }
    }
  }

  return { success: true, data: { triggered: false } };
}

// ============================================================================
// Plots Within Plots - Scoring Trigger
// ============================================================================

/**
 * Check if scoring an objective should trigger plot card draw
 * Returns true if the objective was already scored by another player
 */
export function shouldTriggerPlotsWithinPlots(
  state: GameState,
  playerId: string,
  objectiveId: string
): boolean {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player || !isFirmamentOrObsidian(state, playerId)) {
    return false;
  }

  // Check if objective was already scored by another player
  for (const objective of [...state.objectives.publicStageI, ...state.objectives.publicStageII]) {
    if (objective.id === objectiveId) {
      // Check if any other player scored this
      return objective.scoredBy.some((scorerId: string) => scorerId !== playerId);
    }
  }

  return false;
}

/**
 * Handle post-scoring for Plots Within Plots
 */
export function handlePlotsWithinPlotsScoring(
  state: GameState,
  playerId: string,
  objectiveId: string
): HandlerResult {
  if (!shouldTriggerPlotsWithinPlots(state, playerId, objectiveId)) {
    return { success: true, data: { plotCardDrawn: false } };
  }

  return handleDrawPlotCard(state, {
    type: 'draw_plot_card',
    playerId,
  });
}
