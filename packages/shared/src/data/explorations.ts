/**
 * TI4 Prophecy of Kings - Exploration Card Data
 *
 * Exploration cards across 4 deck types:
 * - Cultural (22 cards) - Blue planets
 * - Industrial (22 cards) - Green planets
 * - Hazardous (22 cards) - Red planets
 * - Frontier (14+ cards) - Empty space tokens
 *
 * Cards are tagged with their expansion:
 * - 'pok' - Prophecy of Kings base exploration cards
 * - 'codex3' - Codex III: Vigil additions
 */

import type { Expansion } from '../types/common.js';

// ============================================================================
// Types
// ============================================================================

export type ExplorationDeckType = 'cultural' | 'industrial' | 'hazardous' | 'frontier';
export type ExplorationCardSubtype = 'instant' | 'attach' | 'fragment' | 'persistent';
export type RelicFragmentType = 'cultural' | 'industrial' | 'hazardous' | 'unknown';

export interface AttachmentBonus {
  resources?: number;
  influence?: number;
  techSpecialty?: 'biotic' | 'warfare' | 'propulsion' | 'cybernetic';
  legendary?: boolean;
  trait?: 'cultural' | 'industrial' | 'hazardous';
  production?: number;
}

export interface ExplorationEffect {
  type:
    | 'gain_resources'
    | 'gain_influence'
    | 'gain_trade_goods'
    | 'gain_commodities'
    | 'gain_command_tokens'
    | 'draw_action_cards'
    | 'draw_secret'
    | 'gain_relic'
    | 'gain_unit'
    | 'research_tech'
    | 'attach'
    | 'fragment'
    | 'special';
  amount?: number;
  unitType?: string;
  fragmentType?: RelicFragmentType;
  attachment?: AttachmentBonus;
  special?: string;
}

export interface ExplorationCardDef {
  id: string;
  name: string;
  deckType: ExplorationDeckType;
  subtype: ExplorationCardSubtype;
  description: string;
  effects: ExplorationEffect[];
  imageId: string;
  expansion: Expansion;
}

// ============================================================================
// Cultural Exploration Cards (22 total in PoK)
// ============================================================================

export const CULTURAL_EXPLORATION_CARDS: ExplorationCardDef[] = [
  // Relic Fragments (9 cards)
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `cultural_relic_fragment_${i + 1}`,
    name: 'Cultural Relic Fragment',
    deckType: 'cultural' as ExplorationDeckType,
    subtype: 'fragment' as ExplorationCardSubtype,
    description: 'Gain this card. You may purge 3 of your relic fragments to gain 1 relic.',
    effects: [{ type: 'fragment' as const, fragmentType: 'cultural' as RelicFragmentType }],
    imageId: `cultural_relic_fragment`,
    expansion: 'pok' as Expansion,
  })),

  // Attachments (5 cards)
  {
    id: 'demilitarized_zone',
    name: 'Demilitarized Zone',
    deckType: 'cultural',
    subtype: 'attach',
    description: 'Return all structures on this planet to your reinforcements. Then, return all ground forces on this planet to the space area. Units cannot be committed to, produced on, or placed on this planet.',
    effects: [{ type: 'attach', attachment: { production: 0 } }],
    imageId: 'demilitarized_zone',
    expansion: 'pok',
  },
  {
    id: 'dyson_sphere',
    name: 'Dyson Sphere',
    deckType: 'cultural',
    subtype: 'attach',
    description: 'This planet\'s resource value is increased by 2 and its influence value is increased by 1.',
    effects: [{ type: 'attach', attachment: { resources: 2, influence: 1 } }],
    imageId: 'dyson_sphere',
    expansion: 'pok',
  },
  {
    id: 'paradise_world',
    name: 'Paradise World',
    deckType: 'cultural',
    subtype: 'attach',
    description: 'This planet\'s influence value is increased by 2.',
    effects: [{ type: 'attach', attachment: { influence: 2 } }],
    imageId: 'paradise_world',
    expansion: 'pok',
  },
  {
    id: 'tomb_of_emphidia',
    name: 'Tomb of Emphidia',
    deckType: 'cultural',
    subtype: 'attach',
    description: 'This planet\'s influence value is increased by 1. If you control The Crown of Emphidia, you may purge it at the end of the status phase to gain 1 victory point.',
    effects: [{ type: 'attach', attachment: { influence: 1 } }],
    imageId: 'tomb_of_emphidia',
    expansion: 'pok',
  },
  {
    id: 'cultural_gamma_wormhole',
    name: 'Gamma Wormhole',
    deckType: 'cultural',
    subtype: 'instant',
    description: 'Place a gamma wormhole token in this system.',
    effects: [{ type: 'special', special: 'place_gamma_wormhole' }],
    imageId: 'gamma_wormhole',
    expansion: 'pok',
  },

  // Instant Effects (8 cards)
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `freelancers_${i + 1}`,
    name: 'Freelancers',
    deckType: 'cultural' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'You may produce 1 unit in this system; you may spend influence as if it were resources to produce this unit.',
    effects: [{ type: 'special' as const, special: 'produce_with_influence' }],
    imageId: 'freelancers',
    expansion: 'pok' as Expansion,
  })),

  ...Array.from({ length: 3 }, (_, i) => ({
    id: `mercenary_outfit_${i + 1}`,
    name: 'Mercenary Outfit',
    deckType: 'cultural' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Place 1 infantry from your reinforcements on this planet.',
    effects: [{ type: 'gain_unit' as const, unitType: 'infantry' }],
    imageId: 'mercenary_outfit',
    expansion: 'pok' as Expansion,
  })),

  ...Array.from({ length: 2 }, (_, i) => ({
    id: `cultural_derelict_vessel_${i + 1}`,
    name: 'Derelict Vessel',
    deckType: 'cultural' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Draw 2 action cards.',
    effects: [{ type: 'draw_action_cards' as const, amount: 2 }],
    imageId: 'derelict_vessel',
    expansion: 'pok' as Expansion,
  })),
];

// ============================================================================
// Industrial Exploration Cards (22 total in PoK)
// ============================================================================

export const INDUSTRIAL_EXPLORATION_CARDS: ExplorationCardDef[] = [
  // Relic Fragments (5 cards)
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `industrial_relic_fragment_${i + 1}`,
    name: 'Industrial Relic Fragment',
    deckType: 'industrial' as ExplorationDeckType,
    subtype: 'fragment' as ExplorationCardSubtype,
    description: 'Gain this card. You may purge 3 of your relic fragments to gain 1 relic.',
    effects: [{ type: 'fragment' as const, fragmentType: 'industrial' as RelicFragmentType }],
    imageId: 'industrial_relic_fragment',
    expansion: 'pok' as Expansion,
  })),

  // Attachments (5 cards)
  {
    id: 'biotic_research_facility',
    name: 'Biotic Research Facility',
    deckType: 'industrial',
    subtype: 'attach',
    description: 'This planet has a green technology specialty. If this planet already has a technology specialty, this planet\'s resource and influence values are each increased by 1 instead.',
    effects: [{ type: 'attach', attachment: { techSpecialty: 'biotic' } }],
    imageId: 'biotic_research_facility',
    expansion: 'pok',
  },
  {
    id: 'cybernetic_research_facility',
    name: 'Cybernetic Research Facility',
    deckType: 'industrial',
    subtype: 'attach',
    description: 'This planet has a yellow technology specialty. If this planet already has a technology specialty, this planet\'s resource and influence values are each increased by 1 instead.',
    effects: [{ type: 'attach', attachment: { techSpecialty: 'cybernetic' } }],
    imageId: 'cybernetic_research_facility',
    expansion: 'pok',
  },
  {
    id: 'mining_world',
    name: 'Mining World',
    deckType: 'industrial',
    subtype: 'attach',
    description: 'This planet\'s resource value is increased by 2.',
    effects: [{ type: 'attach', attachment: { resources: 2 } }],
    imageId: 'mining_world',
    expansion: 'pok',
  },
  {
    id: 'rich_world',
    name: 'Rich World',
    deckType: 'industrial',
    subtype: 'attach',
    description: 'This planet\'s resource value is increased by 1.',
    effects: [{ type: 'attach', attachment: { resources: 1 } }],
    imageId: 'rich_world',
    expansion: 'pok',
  },
  {
    id: 'industrial_gamma_wormhole',
    name: 'Gamma Wormhole',
    deckType: 'industrial',
    subtype: 'instant',
    description: 'Place a gamma wormhole token in this system.',
    effects: [{ type: 'special', special: 'place_gamma_wormhole' }],
    imageId: 'gamma_wormhole',
    expansion: 'pok',
  },

  // Instant Effects (12 cards)
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `abandoned_warehouses_${i + 1}`,
    name: 'Abandoned Warehouses',
    deckType: 'industrial' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 2 commodities, or convert up to 2 of your commodities to trade goods.',
    effects: [{ type: 'special' as const, special: 'commodities_or_convert' }],
    imageId: 'abandoned_warehouses',
    expansion: 'pok' as Expansion,
  })),

  ...Array.from({ length: 4 }, (_, i) => ({
    id: `functioning_base_${i + 1}`,
    name: 'Functioning Base',
    deckType: 'industrial' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 1 commodity, or spend 1 trade good or 1 commodity to draw 1 action card.',
    effects: [{ type: 'special' as const, special: 'commodity_or_action_card' }],
    imageId: 'functioning_base',
    expansion: 'pok' as Expansion,
  })),

  ...Array.from({ length: 4 }, (_, i) => ({
    id: `local_fabricators_${i + 1}`,
    name: 'Local Fabricators',
    deckType: 'industrial' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 1 commodity, or spend 1 trade good or 1 commodity to place 1 mech from your reinforcements on this planet.',
    effects: [{ type: 'special' as const, special: 'commodity_or_mech' }],
    imageId: 'local_fabricators',
    expansion: 'pok' as Expansion,
  })),
];

// ============================================================================
// Hazardous Exploration Cards (22 total in PoK)
// ============================================================================

export const HAZARDOUS_EXPLORATION_CARDS: ExplorationCardDef[] = [
  // Relic Fragments (7 cards)
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `hazardous_relic_fragment_${i + 1}`,
    name: 'Hazardous Relic Fragment',
    deckType: 'hazardous' as ExplorationDeckType,
    subtype: 'fragment' as ExplorationCardSubtype,
    description: 'Gain this card. You may purge 3 of your relic fragments to gain 1 relic.',
    effects: [{ type: 'fragment' as const, fragmentType: 'hazardous' as RelicFragmentType }],
    imageId: 'hazardous_relic_fragment',
    expansion: 'pok' as Expansion,
  })),

  // Attachments (6 cards)
  {
    id: 'lazax_survivors',
    name: 'Lazax Survivors',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet\'s resource value is increased by 1 and its influence value is increased by 2.',
    effects: [{ type: 'attach', attachment: { resources: 1, influence: 2 } }],
    imageId: 'lazax_survivors',
    expansion: 'pok',
  },
  {
    id: 'hazardous_mining_world',
    name: 'Mining World',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet\'s resource value is increased by 2.',
    effects: [{ type: 'attach', attachment: { resources: 2 } }],
    imageId: 'mining_world',
    expansion: 'pok',
  },
  {
    id: 'hazardous_rich_world',
    name: 'Rich World',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet\'s resource value is increased by 1.',
    effects: [{ type: 'attach', attachment: { resources: 1 } }],
    imageId: 'rich_world',
    expansion: 'pok',
  },
  {
    id: 'propulsion_research_facility',
    name: 'Propulsion Research Facility',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet has a blue technology specialty. If this planet already has a technology specialty, this planet\'s resource and influence values are each increased by 1 instead.',
    effects: [{ type: 'attach', attachment: { techSpecialty: 'propulsion' } }],
    imageId: 'propulsion_research_facility',
    expansion: 'pok',
  },
  {
    id: 'warfare_research_facility',
    name: 'Warfare Research Facility',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet has a red technology specialty. If this planet already has a technology specialty, this planet\'s resource and influence values are each increased by 1 instead.',
    effects: [{ type: 'attach', attachment: { techSpecialty: 'warfare' } }],
    imageId: 'warfare_research_facility',
    expansion: 'pok',
  },
  {
    id: 'hazardous_gamma_wormhole',
    name: 'Gamma Wormhole',
    deckType: 'hazardous',
    subtype: 'instant',
    description: 'Place a gamma wormhole token in this system.',
    effects: [{ type: 'special', special: 'place_gamma_wormhole' }],
    imageId: 'gamma_wormhole',
    expansion: 'pok',
  },

  // Instant Effects (9 cards)
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `core_mine_${i + 1}`,
    name: 'Core Mine',
    deckType: 'hazardous' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'If you have at least 1 mech on this planet, or if you remove 1 infantry from this planet, gain 1 trade good.',
    effects: [{ type: 'special' as const, special: 'mech_or_infantry_for_tg' }],
    imageId: 'core_mine',
    expansion: 'pok' as Expansion,
  })),

  ...Array.from({ length: 3 }, (_, i) => ({
    id: `expedition_${i + 1}`,
    name: 'Expedition',
    deckType: 'hazardous' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'If you have at least 1 mech on this planet, or if you remove 1 infantry from this planet, ready this planet.',
    effects: [{ type: 'special' as const, special: 'mech_or_infantry_for_ready' }],
    imageId: 'expedition',
    expansion: 'pok' as Expansion,
  })),

  ...Array.from({ length: 3 }, (_, i) => ({
    id: `volatile_fuel_source_${i + 1}`,
    name: 'Volatile Fuel Source',
    deckType: 'hazardous' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'If you have at least 1 mech on this planet, or if you remove 1 infantry from this planet, gain 1 command token.',
    effects: [{ type: 'special' as const, special: 'mech_or_infantry_for_ct' }],
    imageId: 'volatile_fuel_source',
    expansion: 'pok' as Expansion,
  })),
];

// ============================================================================
// Frontier Exploration Cards (14 PoK + 4 Codex III = 18 total)
// ============================================================================

export const FRONTIER_EXPLORATION_CARDS: ExplorationCardDef[] = [
  // PoK Frontier Cards (14)

  // Relic Fragments (3 cards)
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `unknown_relic_fragment_${i + 1}`,
    name: 'Unknown Relic Fragment',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'fragment' as ExplorationCardSubtype,
    description: 'Gain this card. This card counts as a relic fragment of any type. You may purge 3 of your relic fragments to gain 1 relic; you cannot purge only unknown fragments.',
    effects: [{ type: 'fragment' as const, fragmentType: 'unknown' as RelicFragmentType }],
    imageId: 'unknown_relic_fragment',
    expansion: 'pok' as Expansion,
  })),

  // Persistent cards (stay in play)
  {
    id: 'enigmatic_device_1',
    name: 'Enigmatic Device',
    deckType: 'frontier',
    subtype: 'persistent',
    description: 'Place this card face up in the common play area. As an action, a player may spend 6 resources and purge this card to research 1 technology.',
    effects: [{ type: 'special', special: 'enigmatic_device' }],
    imageId: 'enigmatic_device',
    expansion: 'pok',
  },
  {
    id: 'enigmatic_device_2',
    name: 'Enigmatic Device',
    deckType: 'frontier',
    subtype: 'persistent',
    description: 'Place this card face up in the common play area. As an action, a player may spend 6 resources and purge this card to research 1 technology.',
    effects: [{ type: 'special', special: 'enigmatic_device' }],
    imageId: 'enigmatic_device',
    expansion: 'pok',
  },
  {
    id: 'ion_storm',
    name: 'Ion Storm',
    deckType: 'frontier',
    subtype: 'persistent',
    description: 'Place this card in a non-home system that contains an alpha or beta wormhole. This system contains a gamma wormhole in addition to its other wormholes. When a ship uses this card\'s wormhole, flip this card and place it in the active system.',
    effects: [{ type: 'special', special: 'ion_storm' }],
    imageId: 'ion_storm',
    expansion: 'pok',
  },

  // Special attachment
  {
    id: 'mirage',
    name: 'Mirage',
    deckType: 'frontier',
    subtype: 'attach',
    description: 'Place the Mirage planet token in this system and gain control of it; ready it. It has 1 resource, 2 influence, and the cultural trait. Then, purge this card.',
    effects: [{ type: 'special', special: 'place_mirage_planet' }],
    imageId: 'mirage',
    expansion: 'pok',
  },
  {
    id: 'gamma_relay',
    name: 'Gamma Relay',
    deckType: 'frontier',
    subtype: 'instant',
    description: 'Place a gamma wormhole token in this system. Then, purge this card.',
    effects: [{ type: 'special', special: 'place_gamma_wormhole' }],
    imageId: 'gamma_relay',
    expansion: 'pok',
  },

  // Instant Effects
  ...Array.from({ length: 2 }, (_, i) => ({
    id: `derelict_vessel_${i + 1}`,
    name: 'Derelict Vessel',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Draw 1 secret objective.',
    effects: [{ type: 'draw_secret' as const }],
    imageId: 'derelict_vessel',
    expansion: 'pok' as Expansion,
  })),

  ...Array.from({ length: 2 }, (_, i) => ({
    id: `lost_crew_${i + 1}`,
    name: 'Lost Crew',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Draw 2 action cards.',
    effects: [{ type: 'draw_action_cards' as const, amount: 2 }],
    imageId: 'lost_crew',
    expansion: 'pok' as Expansion,
  })),

  ...Array.from({ length: 2 }, (_, i) => ({
    id: `merchant_station_${i + 1}`,
    name: 'Merchant Station',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Replenish your commodities, or convert your commodities to trade goods.',
    effects: [{ type: 'special' as const, special: 'replenish_or_convert' }],
    imageId: 'merchant_station',
    expansion: 'pok' as Expansion,
  })),

  // ============================================================================
  // Codex III: Vigil Frontier Cards (4)
  // ============================================================================

  {
    id: 'dead_world',
    name: 'Dead World',
    deckType: 'frontier',
    subtype: 'instant',
    description: 'Draw 1 relic.',
    effects: [{ type: 'gain_relic' }],
    imageId: 'dead_world',
    expansion: 'codex3',
  },
  {
    id: 'entropic_field',
    name: 'Entropic Field',
    deckType: 'frontier',
    subtype: 'instant',
    description: 'Gain 1 command token and 2 trade goods.',
    effects: [
      { type: 'gain_command_tokens', amount: 1 },
      { type: 'gain_trade_goods', amount: 2 },
    ],
    imageId: 'entropic_field',
    expansion: 'codex3',
  },
  {
    id: 'major_entropic_field',
    name: 'Major Entropic Field',
    deckType: 'frontier',
    subtype: 'instant',
    description: 'Gain 1 command token and 3 trade goods.',
    effects: [
      { type: 'gain_command_tokens', amount: 1 },
      { type: 'gain_trade_goods', amount: 3 },
    ],
    imageId: 'major_entropic_field',
    expansion: 'codex3',
  },
  {
    id: 'minor_entropic_field',
    name: 'Minor Entropic Field',
    deckType: 'frontier',
    subtype: 'instant',
    description: 'Gain 1 command token and 1 trade good.',
    effects: [
      { type: 'gain_command_tokens', amount: 1 },
      { type: 'gain_trade_goods', amount: 1 },
    ],
    imageId: 'minor_entropic_field',
    expansion: 'codex3',
  },

  // Keleres Ship (Codex III) - 2 copies
  ...Array.from({ length: 2 }, (_, i) => ({
    id: `keleres_ship_${i + 1}`,
    name: 'Keleres Ship',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 2 command tokens.',
    effects: [{ type: 'gain_command_tokens' as const, amount: 2 }],
    imageId: 'keleres_ship',
    expansion: 'codex3' as Expansion,
  })),
];

// ============================================================================
// All Exploration Cards
// ============================================================================

export const ALL_EXPLORATION_CARDS: ExplorationCardDef[] = [
  ...CULTURAL_EXPLORATION_CARDS,
  ...INDUSTRIAL_EXPLORATION_CARDS,
  ...HAZARDOUS_EXPLORATION_CARDS,
  ...FRONTIER_EXPLORATION_CARDS,
];

// ============================================================================
// Lookup Maps
// ============================================================================

export const EXPLORATION_CARDS_BY_ID: Record<string, ExplorationCardDef> = Object.fromEntries(
  ALL_EXPLORATION_CARDS.map((card) => [card.id, card])
);

// Build deck maps dynamically based on all cards
function buildDeckMap(): Record<ExplorationDeckType, ExplorationCardDef[]> {
  const map: Record<ExplorationDeckType, ExplorationCardDef[]> = {
    cultural: [],
    industrial: [],
    hazardous: [],
    frontier: [],
  };
  for (const card of ALL_EXPLORATION_CARDS) {
    map[card.deckType].push(card);
  }
  return map;
}

export const EXPLORATION_CARDS_BY_DECK = buildDeckMap();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get exploration card by ID
 */
export function getExplorationCard(cardId: string): ExplorationCardDef | null {
  return EXPLORATION_CARDS_BY_ID[cardId] || null;
}

/**
 * Get all cards for a given deck type, optionally filtered by expansions
 */
export function getExplorationDeck(
  deckType: ExplorationDeckType,
  expansions?: Expansion[]
): ExplorationCardDef[] {
  const cards = EXPLORATION_CARDS_BY_DECK[deckType] || [];
  if (!expansions) {
    return cards;
  }
  return cards.filter((card) => expansions.includes(card.expansion));
}

/**
 * Get initial deck card IDs (for game setup - creates shuffleable array)
 * Filters by enabled expansions
 */
export function getInitialExplorationDeck(
  deckType: ExplorationDeckType,
  expansions: Expansion[] = ['pok']
): string[] {
  return EXPLORATION_CARDS_BY_DECK[deckType]
    .filter((card) => expansions.includes(card.expansion))
    .map((card) => card.id);
}

/**
 * Get the deck type for a given planet trait
 */
export function getExplorationDeckForTrait(
  trait: 'cultural' | 'industrial' | 'hazardous'
): ExplorationDeckType {
  return trait;
}

/**
 * Check if a card is a relic fragment
 */
export function isRelicFragment(cardId: string): boolean {
  const card = EXPLORATION_CARDS_BY_ID[cardId];
  return card?.subtype === 'fragment';
}

/**
 * Check if a card is an attachment
 */
export function isAttachment(cardId: string): boolean {
  const card = EXPLORATION_CARDS_BY_ID[cardId];
  return card?.subtype === 'attach';
}

/**
 * Check if a card has instant effects (discarded after use)
 */
export function isInstantEffect(cardId: string): boolean {
  const card = EXPLORATION_CARDS_BY_ID[cardId];
  return card?.subtype === 'instant';
}

/**
 * Check if a card is persistent (stays in play)
 */
export function isPersistent(cardId: string): boolean {
  const card = EXPLORATION_CARDS_BY_ID[cardId];
  return card?.subtype === 'persistent';
}

/**
 * Get fragment type from a relic fragment card
 */
export function getFragmentType(cardId: string): RelicFragmentType | null {
  const card = EXPLORATION_CARDS_BY_ID[cardId];
  if (card?.subtype !== 'fragment') return null;
  const fragmentEffect = card.effects.find((e) => e.type === 'fragment');
  return fragmentEffect?.fragmentType || null;
}

/**
 * Check if exploration is enabled (requires PoK or later expansions)
 */
export function isExplorationEnabled(expansions: Expansion[]): boolean {
  return expansions.some((exp) => exp === 'pok' || exp.startsWith('codex') || exp === 'thunders_edge');
}
