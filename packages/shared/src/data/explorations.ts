/**
 * TI4 Prophecy of Kings - Exploration Card Data
 *
 * 80 exploration cards across 4 deck types:
 * - Cultural (22 cards) - Blue planets
 * - Industrial (22 cards) - Green planets
 * - Hazardous (22 cards) - Red planets
 * - Frontier (14 cards) - Empty space tokens
 */

// ============================================================================
// Types
// ============================================================================

export type ExplorationDeckType = 'cultural' | 'industrial' | 'hazardous' | 'frontier';
export type ExplorationCardSubtype = 'instant' | 'attach' | 'fragment';
export type RelicFragmentType = 'cultural' | 'industrial' | 'hazardous' | 'unknown';

export interface AttachmentBonus {
  resources?: number;
  influence?: number;
  techSpecialty?: 'biotic' | 'warfare' | 'propulsion' | 'cybernetic';
  legendary?: boolean;
}

export interface ExplorationEffect {
  type:
    | 'gain_resources'
    | 'gain_influence'
    | 'gain_trade_goods'
    | 'gain_commodities'
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
  imageId: string; // Matches filename in /images/cards/exploration/
}

// ============================================================================
// Cultural Exploration Cards (22 total)
// ============================================================================

export const CULTURAL_EXPLORATION_CARDS: ExplorationCardDef[] = [
  // Relic Fragments (9 cards)
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `cultural_relic_fragment_${i + 1}`,
    name: 'Cultural Relic Fragment',
    deckType: 'cultural' as ExplorationDeckType,
    subtype: 'fragment' as ExplorationCardSubtype,
    description: 'Gain 1 cultural relic fragment.',
    effects: [{ type: 'fragment' as const, fragmentType: 'cultural' as RelicFragmentType }],
    imageId: `cultural_relic_fragment.${i + 1}`,
  })),

  // Attachments
  {
    id: 'demilitarized_zone',
    name: 'Demilitarized Zone',
    deckType: 'cultural',
    subtype: 'attach',
    description: 'This planet has PRODUCTION 1. You cannot place ground forces or mechs on this planet.',
    effects: [{ type: 'attach', attachment: {} }],
    imageId: 'demilitarized_zone',
  },
  {
    id: 'dyson_sphere',
    name: 'Dyson Sphere',
    deckType: 'cultural',
    subtype: 'attach',
    description: 'This planet has +2 resources and +1 influence.',
    effects: [{ type: 'attach', attachment: { resources: 2, influence: 1 } }],
    imageId: 'dyson_sphere',
  },
  {
    id: 'lazax_survivors',
    name: 'Lazax Survivors',
    deckType: 'cultural',
    subtype: 'attach',
    description: 'This planet has +1 resources and +2 influence.',
    effects: [{ type: 'attach', attachment: { resources: 1, influence: 2 } }],
    imageId: 'lazax_survivors',
  },
  {
    id: 'paradise_world',
    name: 'Paradise World',
    deckType: 'cultural',
    subtype: 'attach',
    description: 'This planet has +2 influence.',
    effects: [{ type: 'attach', attachment: { influence: 2 } }],
    imageId: 'paradise_world',
  },
  {
    id: 'tomb_of_emphidia',
    name: 'Tomb of Emphidia',
    deckType: 'cultural',
    subtype: 'attach',
    description: 'This planet has +1 influence. You may spend 1 influence from this planet to draw 1 relic.',
    effects: [{ type: 'attach', attachment: { influence: 1 } }, { type: 'special', special: 'draw_relic_for_influence' }],
    imageId: 'tomb_of_emphidia',
  },
  {
    id: 'biotic_research_facility',
    name: 'Biotic Research Facility',
    deckType: 'cultural',
    subtype: 'attach',
    description: 'This planet has a green technology specialty.',
    effects: [{ type: 'attach', attachment: { techSpecialty: 'biotic' } }],
    imageId: 'biotic_research_facility',
  },

  // Instant Effects
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `abandoned_warehouses_${i + 1}`,
    name: 'Abandoned Warehouses',
    deckType: 'cultural' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 2 commodities.',
    effects: [{ type: 'gain_commodities' as const, amount: 2 }],
    imageId: `abandoned_warehouses.${i + 1}`,
  })),

  ...Array.from({ length: 3 }, (_, i) => ({
    id: `expedition_${i + 1}`,
    name: 'Expedition',
    deckType: 'cultural' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Draw 2 action cards.',
    effects: [{ type: 'draw_action_cards' as const, amount: 2 }],
    imageId: `expedition.${i + 1}`,
  })),
];

// ============================================================================
// Industrial Exploration Cards (22 total)
// ============================================================================

export const INDUSTRIAL_EXPLORATION_CARDS: ExplorationCardDef[] = [
  // Relic Fragments (5 cards)
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `industrial_relic_fragment_${i + 1}`,
    name: 'Industrial Relic Fragment',
    deckType: 'industrial' as ExplorationDeckType,
    subtype: 'fragment' as ExplorationCardSubtype,
    description: 'Gain 1 industrial relic fragment.',
    effects: [{ type: 'fragment' as const, fragmentType: 'industrial' as RelicFragmentType }],
    imageId: `industrial_relic_fragment.${i + 1}`,
  })),

  // Attachments
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `core_mine_${i + 1}`,
    name: 'Core Mine',
    deckType: 'industrial' as ExplorationDeckType,
    subtype: 'attach' as ExplorationCardSubtype,
    description: 'This planet has +2 resources.',
    effects: [{ type: 'attach' as const, attachment: { resources: 2 } }],
    imageId: `core_mine.${i + 1}`,
  })),

  {
    id: 'cybernetic_research_facility',
    name: 'Cybernetic Research Facility',
    deckType: 'industrial',
    subtype: 'attach',
    description: 'This planet has a yellow technology specialty.',
    effects: [{ type: 'attach', attachment: { techSpecialty: 'cybernetic' } }],
    imageId: 'cybernetic_research_facility',
  },
  {
    id: 'mining_world',
    name: 'Mining World',
    deckType: 'industrial',
    subtype: 'attach',
    description: 'This planet has +2 resources.',
    effects: [{ type: 'attach', attachment: { resources: 2 } }],
    imageId: 'mining_world',
  },
  {
    id: 'rich_world',
    name: 'Rich World',
    deckType: 'industrial',
    subtype: 'attach',
    description: 'This planet has +1 resources.',
    effects: [{ type: 'attach', attachment: { resources: 1 } }],
    imageId: 'rich_world',
  },

  // Instant Effects
  ...Array.from({ length: 4 }, (_, i) => ({
    id: `functioning_base_${i + 1}`,
    name: 'Functioning Base',
    deckType: 'industrial' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 1 commodity and 1 trade good.',
    effects: [
      { type: 'gain_commodities' as const, amount: 1 },
      { type: 'gain_trade_goods' as const, amount: 1 },
    ],
    imageId: `functioning_base.${i + 1}`,
  })),

  ...Array.from({ length: 4 }, (_, i) => ({
    id: `local_fabricators_${i + 1}`,
    name: 'Local Fabricators',
    deckType: 'industrial' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 2 commodities.',
    effects: [{ type: 'gain_commodities' as const, amount: 2 }],
    imageId: `local_fabricators.${i + 1}`,
  })),

  ...Array.from({ length: 3 }, (_, i) => ({
    id: `freelancers_${i + 1}`,
    name: 'Freelancers',
    deckType: 'industrial' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 1 trade good. Place 1 infantry from your reinforcements on this planet.',
    effects: [
      { type: 'gain_trade_goods' as const, amount: 1 },
      { type: 'gain_unit' as const, unitType: 'infantry' },
    ],
    imageId: `freelancers.${i + 1}`,
  })),

  ...Array.from({ length: 3 }, (_, i) => ({
    id: `mercenary_outfit_${i + 1}`,
    name: 'Mercenary Outfit',
    deckType: 'industrial' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Place 1 infantry from your reinforcements on this planet.',
    effects: [{ type: 'gain_unit' as const, unitType: 'infantry' }],
    imageId: `mercenary_outfit.${i + 1}`,
  })),
];

// ============================================================================
// Hazardous Exploration Cards (22 total)
// ============================================================================

export const HAZARDOUS_EXPLORATION_CARDS: ExplorationCardDef[] = [
  // Relic Fragments (7 cards)
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `hazardous_relic_fragment_${i + 1}`,
    name: 'Hazardous Relic Fragment',
    deckType: 'hazardous' as ExplorationDeckType,
    subtype: 'fragment' as ExplorationCardSubtype,
    description: 'Gain 1 hazardous relic fragment.',
    effects: [{ type: 'fragment' as const, fragmentType: 'hazardous' as RelicFragmentType }],
    imageId: `hazardous_relic_fragment.${i + 1}`,
  })),

  // Attachments
  {
    id: 'dead_world',
    name: 'Dead World',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet gains the CULTURAL trait.',
    effects: [{ type: 'attach', attachment: {} }],
    imageId: 'dead_world',
  },
  {
    id: 'entropic_field',
    name: 'Entropic Field',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet has -1 resources but +1 influence.',
    effects: [{ type: 'attach', attachment: { resources: -1, influence: 1 } }],
    imageId: 'entropic_field',
  },
  {
    id: 'minor_entropic_field',
    name: 'Minor Entropic Field',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet has +1 influence.',
    effects: [{ type: 'attach', attachment: { influence: 1 } }],
    imageId: 'minor_entropic_field',
  },
  {
    id: 'major_entropic_field',
    name: 'Major Entropic Field',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet has -2 resources but +3 influence.',
    effects: [{ type: 'attach', attachment: { resources: -2, influence: 3 } }],
    imageId: 'major_entropic_field',
  },
  {
    id: 'propulsion_research_facility',
    name: 'Propulsion Research Facility',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet has a blue technology specialty.',
    effects: [{ type: 'attach', attachment: { techSpecialty: 'propulsion' } }],
    imageId: 'propulsion_research_facility',
  },
  {
    id: 'warfare_research_facility',
    name: 'Warfare Research Facility',
    deckType: 'hazardous',
    subtype: 'attach',
    description: 'This planet has a red technology specialty.',
    effects: [{ type: 'attach', attachment: { techSpecialty: 'warfare' } }],
    imageId: 'warfare_research_facility',
  },

  // Instant Effects
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `volatile_fuel_source_${i + 1}`,
    name: 'Volatile Fuel Source',
    deckType: 'hazardous' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 2 trade goods.',
    effects: [{ type: 'gain_trade_goods' as const, amount: 2 }],
    imageId: `volatile_fuel_source.${i + 1}`,
  })),

  ...Array.from({ length: 6 }, (_, i) => ({
    id: `hazardous_expedition_${i + 1}`,
    name: 'Expedition',
    deckType: 'hazardous' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 1 trade good.',
    effects: [{ type: 'gain_trade_goods' as const, amount: 1 }],
    imageId: `expedition.${i + 1}`,
  })),
];

// ============================================================================
// Frontier Exploration Cards (14 total)
// ============================================================================

export const FRONTIER_EXPLORATION_CARDS: ExplorationCardDef[] = [
  // Relic Fragments (3 cards)
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `unknown_relic_fragment_${i + 1}`,
    name: 'Unknown Relic Fragment',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'fragment' as ExplorationCardSubtype,
    description: 'Gain 1 unknown relic fragment. Unknown fragments can substitute for any fragment type.',
    effects: [{ type: 'fragment' as const, fragmentType: 'unknown' as RelicFragmentType }],
    imageId: `unknown_relic_fragment.${i + 1}`,
  })),

  // Attachments (Frontier tokens)
  {
    id: 'gamma_relay',
    name: 'Gamma Relay',
    deckType: 'frontier',
    subtype: 'attach',
    description: 'Place a gamma wormhole token in this system.',
    effects: [{ type: 'special', special: 'place_gamma_wormhole' }],
    imageId: 'gamma_relay',
  },
  {
    id: 'ion_storm',
    name: 'Ion Storm',
    deckType: 'frontier',
    subtype: 'attach',
    description: 'Place this card in this system. Ships in this system have -1 to combat rolls.',
    effects: [{ type: 'special', special: 'combat_penalty' }],
    imageId: 'ion_storm',
  },

  // Instant Effects
  ...Array.from({ length: 2 }, (_, i) => ({
    id: `derelict_vessel_${i + 1}`,
    name: 'Derelict Vessel',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Draw 2 action cards.',
    effects: [{ type: 'draw_action_cards' as const, amount: 2 }],
    imageId: `derelict_vessel.${i + 1}`,
  })),

  ...Array.from({ length: 2 }, (_, i) => ({
    id: `enigmatic_device_${i + 1}`,
    name: 'Enigmatic Device',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Roll a die. On 1-3, gain 2 trade goods. On 4-6, gain 1 relic.',
    effects: [{ type: 'special' as const, special: 'roll_for_reward' }],
    imageId: `enigmatic_device.${i + 1}`,
  })),

  ...Array.from({ length: 2 }, (_, i) => ({
    id: `keleres_ship_${i + 1}`,
    name: 'Keleres Ship',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Place 1 cruiser in this system from your reinforcements.',
    effects: [{ type: 'gain_unit' as const, unitType: 'cruiser' }],
    imageId: `keleres_ship.${i + 1}`,
  })),

  ...Array.from({ length: 2 }, (_, i) => ({
    id: `lost_crew_${i + 1}`,
    name: 'Lost Crew',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Gain 2 commodities.',
    effects: [{ type: 'gain_commodities' as const, amount: 2 }],
    imageId: `lost_crew.${i + 1}`,
  })),

  ...Array.from({ length: 2 }, (_, i) => ({
    id: `merchant_station_${i + 1}`,
    name: 'Merchant Station',
    deckType: 'frontier' as ExplorationDeckType,
    subtype: 'instant' as ExplorationCardSubtype,
    description: 'Replenish your commodities.',
    effects: [{ type: 'special' as const, special: 'replenish_commodities' }],
    imageId: `merchant_station.${i + 1}`,
  })),

  // Special - Mirage
  {
    id: 'mirage',
    name: 'Mirage',
    deckType: 'frontier',
    subtype: 'attach',
    description: 'Place the Mirage planet token in this system. It has 1 resource, 2 influence, and the cultural trait.',
    effects: [{ type: 'special', special: 'place_mirage_planet' }],
    imageId: 'mirage',
  },

  // Gamma Wormhole (attachment variant)
  {
    id: 'gamma_wormhole',
    name: 'Gamma Wormhole',
    deckType: 'frontier',
    subtype: 'attach',
    description: 'Place a gamma wormhole token in this system.',
    effects: [{ type: 'special', special: 'place_gamma_wormhole' }],
    imageId: 'gamma_wormhole',
  },
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

export const EXPLORATION_CARDS_BY_DECK: Record<ExplorationDeckType, ExplorationCardDef[]> = {
  cultural: CULTURAL_EXPLORATION_CARDS,
  industrial: INDUSTRIAL_EXPLORATION_CARDS,
  hazardous: HAZARDOUS_EXPLORATION_CARDS,
  frontier: FRONTIER_EXPLORATION_CARDS,
};

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
 * Get all cards for a given deck type
 */
export function getExplorationDeck(deckType: ExplorationDeckType): ExplorationCardDef[] {
  return EXPLORATION_CARDS_BY_DECK[deckType] || [];
}

/**
 * Get initial deck card IDs (for game setup - creates shuffleable array)
 */
export function getInitialExplorationDeck(deckType: ExplorationDeckType): string[] {
  return EXPLORATION_CARDS_BY_DECK[deckType].map((card) => card.id);
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
