/**
 * Thunder's Edge Galactic Events
 *
 * Galactic Events are optional event cards that can be selected during game setup.
 * Each event modifies the rules of the game in some way for all players.
 * Players typically vote on or randomly select 1-3 galactic events to use.
 *
 * Complexity levels:
 * - 1: Simple rule modifications
 * - 2: Moderate complexity, may affect multiple game phases
 * - 3: Complex, significant rule changes
 */

import type { GalacticEventData, GalacticEventComplexity } from '../types/static-data.js';

// =============================================================================
// ECONOMY EVENTS
// =============================================================================

const ECONOMY_EVENTS: GalacticEventData[] = [
  {
    id: 'age_of_commerce',
    name: 'Age of Commerce',
    complexity: 1,
    description: 'When you replenish commodities, gain 1 additional commodity. Your maximum commodity value is increased by 1.',
    ruleModifications: ['commodity_bonus', 'max_commodities_increase'],
    expansion: 'thunders_edge',
  },
  {
    id: 'stellar_atomics',
    name: 'Stellar Atomics',
    complexity: 1,
    description: 'At the start of the status phase, each player gains 1 trade good for each planet they control that has a technology specialty.',
    ruleModifications: ['status_phase_bonus'],
    expansion: 'thunders_edge',
  },
  {
    id: 'economic_boom',
    name: 'Economic Boom',
    complexity: 1,
    description: 'When you would gain trade goods from another player during a transaction, gain 1 additional trade good.',
    ruleModifications: ['transaction_bonus'],
    expansion: 'thunders_edge',
  },
  {
    id: 'resource_scarcity',
    name: 'Resource Scarcity',
    complexity: 2,
    description: 'When using PRODUCTION, you must spend 1 additional resource for each non-fighter ship you produce.',
    ruleModifications: ['production_cost_increase'],
    expansion: 'thunders_edge',
  },
  {
    id: 'galactic_bank',
    name: 'Galactic Bank',
    complexity: 1,
    description: 'During the strategy phase, place 1 trade good on each unchosen strategy card. When a player picks that strategy card, they gain those trade goods.',
    ruleModifications: ['strategy_phase_trade_goods'],
    expansion: 'thunders_edge',
  },
];

// =============================================================================
// MILITARY EVENTS
// =============================================================================

const MILITARY_EVENTS: GalacticEventData[] = [
  {
    id: 'age_of_fighters',
    name: 'Age of Fighters',
    complexity: 2,
    description: 'Fighters have +1 to their combat value. When you use PRODUCTION, you may produce 2 fighters instead of 1 for each fighter you would produce.',
    ruleModifications: ['fighter_combat_bonus', 'fighter_production_bonus'],
    expansion: 'thunders_edge',
  },
  {
    id: 'dangerous_wilds',
    name: 'Dangerous Wilds',
    complexity: 2,
    description: 'Neutral units are placed on each legendary planet at the start of the game. These units must be defeated before a player can take control of the planet.',
    setupInstructions: 'Place 2 neutral infantry on each legendary planet.',
    ruleModifications: ['legendary_planet_guards'],
    expansion: 'thunders_edge',
  },
  {
    id: 'fortified_positions',
    name: 'Fortified Positions',
    complexity: 1,
    description: 'When defending in ground combat on a planet you control, your ground forces get +1 to their combat value.',
    ruleModifications: ['defender_bonus'],
    expansion: 'thunders_edge',
  },
  {
    id: 'fleet_supremacy',
    name: 'Fleet Supremacy',
    complexity: 1,
    description: 'Each player starts with 1 additional fleet token. Players may have up to 4 fleet tokens.',
    setupInstructions: 'Each player takes 1 additional fleet token from their reinforcements.',
    ruleModifications: ['fleet_pool_increase'],
    expansion: 'thunders_edge',
  },
  {
    id: 'veteran_forces',
    name: 'Veteran Forces',
    complexity: 2,
    description: 'After winning a combat, you may place 1 galvanize token on a participating unit. Galvanized units roll 1 additional die during combat.',
    ruleModifications: ['galvanize_all_factions'],
    expansion: 'thunders_edge',
  },
];

// =============================================================================
// POLITICAL EVENTS
// =============================================================================

const POLITICAL_EVENTS: GalacticEventData[] = [
  {
    id: 'civilized_society',
    name: 'Civilized Society',
    complexity: 2,
    description: 'Players cannot use abilities that force other players to lose victory points. Secret objectives that would cause a player to lose victory points cannot be scored.',
    ruleModifications: ['vp_loss_prevention'],
    expansion: 'thunders_edge',
  },
  {
    id: 'galactic_senate',
    name: 'Galactic Senate',
    complexity: 2,
    description: 'During the agenda phase, players resolve 3 agendas instead of 2.',
    ruleModifications: ['additional_agenda'],
    expansion: 'thunders_edge',
  },
  {
    id: 'diplomatic_immunity',
    name: 'Diplomatic Immunity',
    complexity: 1,
    description: 'The speaker cannot be the target of abilities that would remove the speaker token or prevent them from voting.',
    ruleModifications: ['speaker_protection'],
    expansion: 'thunders_edge',
  },
  {
    id: 'power_politics',
    name: 'Power Politics',
    complexity: 1,
    description: 'When voting on an agenda, each player gains +1 vote for each strategy card they have.',
    ruleModifications: ['strategy_card_votes'],
    expansion: 'thunders_edge',
  },
  {
    id: 'secret_alliances',
    name: 'Secret Alliances',
    complexity: 3,
    description: 'At the start of the game, each player secretly writes down another player. If both players wrote each other, they form a secret alliance and may share victory when winning.',
    setupInstructions: 'Each player secretly writes the name of another player on a piece of paper.',
    ruleModifications: ['shared_victory'],
    expansion: 'thunders_edge',
  },
];

// =============================================================================
// EXPLORATION EVENTS
// =============================================================================

const EXPLORATION_EVENTS: GalacticEventData[] = [
  {
    id: 'age_of_exploration',
    name: 'Age of Exploration',
    complexity: 2,
    description: 'When you explore a planet, draw 2 exploration cards and choose 1 to resolve. Return the other to the bottom of the deck.',
    ruleModifications: ['exploration_choice'],
    expansion: 'thunders_edge',
  },
  {
    id: 'ancient_ruins',
    name: 'Ancient Ruins',
    complexity: 1,
    description: 'When you take control of a planet for the first time this game, gain 1 relic fragment matching that planet\'s trait.',
    ruleModifications: ['planet_control_bonus'],
    expansion: 'thunders_edge',
  },
  {
    id: 'contested_territories',
    name: 'Contested Territories',
    complexity: 1,
    description: 'When you take control of a planet that was previously controlled by another player, gain 1 trade good.',
    ruleModifications: ['conquest_bonus'],
    expansion: 'thunders_edge',
  },
  {
    id: 'frontier_expansion',
    name: 'Frontier Expansion',
    complexity: 1,
    description: 'At the start of the status phase, each player may explore 1 planet they control that has not been explored.',
    ruleModifications: ['status_phase_exploration'],
    expansion: 'thunders_edge',
  },
  {
    id: 'relic_hunters',
    name: 'Relic Hunters',
    complexity: 1,
    description: 'When you purge relic fragments to gain a relic, you only need to purge 2 fragments instead of 3.',
    ruleModifications: ['relic_fragment_reduction'],
    expansion: 'thunders_edge',
  },
];

// =============================================================================
// SPECIAL EVENTS
// =============================================================================

const SPECIAL_EVENTS: GalacticEventData[] = [
  {
    id: 'accelerated_victory',
    name: 'Accelerated Victory',
    complexity: 1,
    description: 'The game ends when a player reaches 8 victory points instead of 10.',
    ruleModifications: ['victory_point_target_8'],
    expansion: 'thunders_edge',
  },
  {
    id: 'extended_campaign',
    name: 'Extended Campaign',
    complexity: 2,
    description: 'The game ends when a player reaches 14 victory points instead of 10. Reveal 1 additional Stage I and Stage II public objective during setup.',
    setupInstructions: 'Reveal 1 additional Stage I and Stage II public objective.',
    ruleModifications: ['victory_point_target_14', 'additional_objectives'],
    expansion: 'thunders_edge',
  },
  {
    id: 'rapid_deployment',
    name: 'Rapid Deployment',
    complexity: 1,
    description: 'During setup, after placing starting units, each player may move up to 2 of their ships to an adjacent system.',
    ruleModifications: ['setup_movement'],
    expansion: 'thunders_edge',
  },
  {
    id: 'technology_race',
    name: 'Technology Race',
    complexity: 2,
    description: 'When you research a technology, if you are the first player to research that technology this game, gain 1 victory point. This can only happen once per technology.',
    ruleModifications: ['tech_victory_points'],
    expansion: 'thunders_edge',
  },
  {
    id: 'limited_resources',
    name: 'Limited Resources',
    complexity: 1,
    description: 'Each player has a maximum hand size of 5 action cards. At the end of the status phase, discard down to this limit.',
    ruleModifications: ['action_card_hand_limit'],
    expansion: 'thunders_edge',
  },
];

// =============================================================================
// ALL GALACTIC EVENTS COMBINED
// =============================================================================

export const GALACTIC_EVENTS: GalacticEventData[] = [
  ...ECONOMY_EVENTS,
  ...MILITARY_EVENTS,
  ...POLITICAL_EVENTS,
  ...EXPLORATION_EVENTS,
  ...SPECIAL_EVENTS,
];

// =============================================================================
// HELPER MAPS FOR QUICK LOOKUP
// =============================================================================

export const GALACTIC_EVENTS_BY_ID: Record<string, GalacticEventData> = Object.fromEntries(
  GALACTIC_EVENTS.map(event => [event.id, event])
);

type EventCategory = 'economy' | 'military' | 'political' | 'exploration' | 'special';

const EVENT_CATEGORIES: Record<string, EventCategory> = {
  age_of_commerce: 'economy',
  stellar_atomics: 'economy',
  economic_boom: 'economy',
  resource_scarcity: 'economy',
  galactic_bank: 'economy',
  age_of_fighters: 'military',
  dangerous_wilds: 'military',
  fortified_positions: 'military',
  fleet_supremacy: 'military',
  veteran_forces: 'military',
  civilized_society: 'political',
  galactic_senate: 'political',
  diplomatic_immunity: 'political',
  power_politics: 'political',
  secret_alliances: 'political',
  age_of_exploration: 'exploration',
  ancient_ruins: 'exploration',
  contested_territories: 'exploration',
  frontier_expansion: 'exploration',
  relic_hunters: 'exploration',
  accelerated_victory: 'special',
  extended_campaign: 'special',
  rapid_deployment: 'special',
  technology_race: 'special',
  limited_resources: 'special',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get galactic events by category
 */
export function getGalacticEventsByCategory(category: EventCategory): GalacticEventData[] {
  return GALACTIC_EVENTS.filter(event => EVENT_CATEGORIES[event.id] === category);
}

/**
 * Get galactic events by complexity level
 */
export function getGalacticEventsByComplexity(complexity: GalacticEventComplexity): GalacticEventData[] {
  return GALACTIC_EVENTS.filter(event => event.complexity === complexity);
}

/**
 * Get a random selection of galactic events
 * Typically used during game setup
 */
export function getRandomGalacticEvents(count: number = 3): GalacticEventData[] {
  const shuffled = [...GALACTIC_EVENTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get galactic events by IDs
 */
export function getGalacticEventsByIds(ids: string[]): GalacticEventData[] {
  return ids
    .map(id => GALACTIC_EVENTS_BY_ID[id])
    .filter((event): event is GalacticEventData => event !== undefined);
}

/**
 * Validate that selected galactic events are compatible
 * Some events may conflict with each other
 */
export function validateGalacticEventSelection(ids: string[]): {
  valid: boolean;
  conflicts: string[];
} {
  const conflicts: string[] = [];

  // Check for conflicting events
  if (ids.includes('accelerated_victory') && ids.includes('extended_campaign')) {
    conflicts.push('Cannot use both Accelerated Victory and Extended Campaign');
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Get all galactic events count
 */
export function getGalacticEventCount(): number {
  return GALACTIC_EVENTS.length;
}

/**
 * Get events that require setup modifications
 */
export function getEventsWithSetupInstructions(): GalacticEventData[] {
  return GALACTIC_EVENTS.filter(event => event.setupInstructions);
}

/**
 * Get category of a galactic event
 */
export function getEventCategory(eventId: string): EventCategory | undefined {
  return EVENT_CATEGORIES[eventId];
}
