/**
 * TI4 Breakthrough Data (Thunder's Edge Expansion)
 *
 * Breakthroughs are faction-specific abilities that become available when
 * a player has 2 technologies of matching colors (synergy). They are acquired
 * via the Thunder's Edge expedition mechanic.
 *
 * All 30 factions receive a breakthrough:
 * - 17 base game factions
 * - 7 Prophecy of Kings factions
 * - 5 Thunder's Edge factions (+ The Obsidian transformation)
 * - 1 Council Keleres
 */

import type { TechColor, Expansion } from '../types/common.js';
import type { BreakthroughSynergy } from '../types/static-data.js';

// ============================================================================
// Types
// ============================================================================

export interface BreakthroughDef {
  id: string;
  factionId: string;
  name: string;
  description: string;
  synergy: BreakthroughSynergy | null; // null for Nekro Virus (special case)
  isExhaustable: boolean;
  expansion: Expansion;
}

// ============================================================================
// Base Game Faction Breakthroughs (17)
// ============================================================================

const BASE_BREAKTHROUGHS: BreakthroughDef[] = [
  {
    id: 'psychospore',
    factionId: 'arborec',
    name: 'Psychospore',
    description:
      'Exhaust this card to remove a command token from a system that contains your infantry and return it to your reinforcements, then place 1 infantry in a system that contains your units.',
    synergy: { color1: 'red', color2: 'green' },
    isExhaustable: true,
    expansion: 'thunders_edge',
  },
  {
    id: 'gravleash_maneuvers',
    factionId: 'letnev',
    name: 'Gravleash Maneuvers',
    description:
      "Apply +1 to the result of each of your units' combat rolls during space combat. During the \"Move Ships\" step, each of your ships has a movement value equal to the highest movement value among your ships.",
    synergy: { color1: 'blue', color2: 'red' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'deorbit_barrage',
    factionId: 'saar',
    name: 'Deorbit Barrage',
    description:
      'ACTION: Spend up to 6 resources; for each resource spent, roll 1 die and assign hits to ground forces on planets in systems that contain your ships.',
    synergy: { color1: 'blue', color2: 'red' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'stellar_genesis',
    factionId: 'muaat',
    name: 'Stellar Genesis',
    description:
      'Place the Avernus token in a system adjacent to your home system. At the start of your turn, you may move the Avernus token to an adjacent non-home system that contains your war sun.',
    synergy: { color1: 'red', color2: 'yellow' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'auto_factories',
    factionId: 'hacan',
    name: 'Auto-Factories',
    description:
      'When you produce 3 or more non-fighter ships, place 1 command token from your reinforcements in your fleet pool.',
    synergy: { color1: 'red', color2: 'yellow' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'bellum_gloriosum',
    factionId: 'sol',
    name: 'Bellum Gloriosum',
    description:
      'When you produce units, you may produce ground forces and fighters up to your ship capacity in that system without counting toward your PRODUCTION value.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'particle_synthesis',
    factionId: 'creuss',
    name: 'Particle Synthesis',
    description:
      'Your systems that contain wormholes have PRODUCTION 2. When producing units in a system that contains a wormhole, reduce the combined cost of those units by 2.',
    synergy: { color1: 'blue', color2: 'yellow' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'fealty_uplink',
    factionId: 'l1z1x',
    name: 'Fealty Uplink',
    description:
      "When you gain control of a planet, place a number of infantry from your reinforcements on that planet equal to that planet's influence value.",
    synergy: { color1: 'red', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'the_tables_grace',
    factionId: 'mentak',
    name: "The Table's Grace",
    description:
      'When you research Cruiser II, flip this card and place it on that technology. Your cruisers may move through systems that contain other players\' ships.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'mindsieve',
    factionId: 'naalu',
    name: 'Mindsieve',
    description:
      'When another player would resolve the secondary ability of a strategy card, you may give them 1 promissory note from your hand; if you do, that player resolves the secondary ability without spending a command token.',
    synergy: { color1: 'red', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'valefar_assimilator_z',
    factionId: 'nekro',
    name: 'Valefar Assimilator Z',
    description:
      'When you would gain a technology using your faction ability, you may instead place a "Z" assimilator token on that technology. Your flagship gains the abilities of technologies with "Z" assimilator tokens.',
    synergy: null, // Nekro doesn't use synergy
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'norr_supremacy',
    factionId: 'sardakk',
    name: "N'orr Supremacy",
    description:
      'After you win a combat, you may gain 1 command token OR research 1 unit upgrade technology.',
    synergy: { color1: 'blue', color2: 'red' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'specialized_compounds',
    factionId: 'jolnar',
    name: 'Specialized Compounds',
    description:
      'When you research a technology, you may exhaust a planet you control that has a technology specialty instead of spending its matching prerequisite.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'imperator',
    factionId: 'winnu',
    name: 'Imperator',
    description:
      'Apply +1 to the result of each of your units\' combat rolls for each "Support for the Throne" promissory note in your play area. After you gain control of a legendary planet, your ships may move 1 additional space.',
    synergy: { color1: 'blue', color2: 'red' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'archons_gift',
    factionId: 'xxcha',
    name: "Archon's Gift",
    description:
      'You may spend influence as if it were resources, and resources as if they were influence.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'yin_ascendant',
    factionId: 'yin',
    name: 'Yin Ascendant',
    description:
      'When you gain this card, and when you score an objective, gain the alliance ability of a random faction that is not in this game.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'deepgloom_executable',
    factionId: 'yssaril',
    name: 'Deepgloom Executable',
    description:
      'Other players may use your STALL TACTICS faction ability. When you resolve a transaction with another player, you may resolve 1 additional transaction with that player.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
];

// ============================================================================
// Prophecy of Kings Faction Breakthroughs (7)
// ============================================================================

const POK_BREAKTHROUGHS: BreakthroughDef[] = [
  {
    id: 'wing_transfer',
    factionId: 'argent',
    name: 'Wing Transfer',
    description:
      'ACTION: Place command tokens from your reinforcements in systems that are adjacent to each other and contain only your units. Move any number of your ships among those systems.',
    synergy: { color1: 'blue', color2: 'yellow' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'void_tether',
    factionId: 'empyrean',
    name: 'Void Tether',
    description:
      'Place void tether tokens on borders between systems. Other players do not treat systems separated by void tether tokens as adjacent unless you allow them.',
    synergy: { color1: 'green', color2: 'blue' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'vaults_of_the_heir',
    factionId: 'mahact',
    name: 'Vaults of the Heir',
    description:
      'Exhaust this card and purge 1 technology you own to gain 1 relic.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: true,
    expansion: 'thunders_edge',
  },
  {
    id: 'absolute_synergy',
    factionId: 'naazrokha',
    name: 'Absolute Synergy',
    description:
      'Return 3 of your mechs to your reinforcements to place the Eidolon Maximum in this system. The Eidolon Maximum has Combat 5(x3), SUSTAIN DAMAGE, and cannot be destroyed by non-combat abilities.',
    synergy: { color1: 'green', color2: 'blue' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'thunders_paradox',
    factionId: 'nomad',
    name: "Thunder's Paradox",
    description:
      'Exhaust this card and 1 agent to ready any other agent.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: true,
    expansion: 'thunders_edge',
  },
  {
    id: 'slumberstate_computing',
    factionId: 'titans',
    name: 'Slumberstate Computing',
    description:
      'When you would resolve ground combat on a planet, you may instead place your ground forces in coexistence on that planet. At the end of each round, draw 1 action card for each planet where you have ground forces in coexistence.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'alraith_ix_ianovar',
    factionId: 'vuilraith',
    name: "Al'Raith Ix Ianovar",
    description:
      'When you gain this card, The Fracture enters play. Place 1 ingress token in a system adjacent to your home system. At the start of your turn, you may move your ingress token to an adjacent system. Your ships in The Fracture have +1 movement.',
    synergy: { color1: 'red', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
];

// ============================================================================
// Thunder's Edge Faction Breakthroughs (6 - including Obsidian)
// ============================================================================

const THUNDERS_EDGE_BREAKTHROUGHS: BreakthroughDef[] = [
  {
    id: 'the_icon',
    factionId: 'last_bastion',
    name: 'The Icon',
    description:
      'Exhaust this card when you produce units; you may place ships in systems that contain your command tokens and do not contain other players\' ships, and ground forces on planets you control in those systems.',
    synergy: { color1: 'red', color2: 'yellow' },
    isExhaustable: true,
    expansion: 'thunders_edge',
  },
  {
    id: 'visionaria_select',
    factionId: 'deepwrought',
    name: 'Visionaria Select',
    description:
      'Other players must spend 1 trade good to research a technology. When a player researches a technology this way, you also gain that technology.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'data_skimmer',
    factionId: 'ral_nel',
    name: 'Data Skimmer',
    description:
      'When a player discards an action card, place it on this card. When you pass, you may take 1 action card from this card.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'resonance_generator',
    factionId: 'crimson_rebellion',
    name: 'Resonance Generator',
    description:
      'Your ships have +1 movement when starting in your home system or in a system with an active breach token. Exhaust this card to flip a breach token or place a breach token in a system that contains your ships.',
    synergy: { color1: 'blue', color2: 'red' },
    isExhaustable: true,
    expansion: 'thunders_edge',
  },
  {
    id: 'the_sowing',
    factionId: 'firmament',
    name: 'The Sowing',
    description:
      'At the start of the status phase, place 1 trade good from the supply on this card. When you become The Obsidian, flip this card.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
  {
    id: 'the_reaping',
    factionId: 'obsidian',
    name: 'The Reaping',
    description:
      'When you win a combat, gain 1 trade good for each unit you destroyed. At the start of the status phase, double the trade goods on this card, then gain them.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
];

// ============================================================================
// Council Keleres Breakthrough (1)
// ============================================================================

const KELERES_BREAKTHROUGHS: BreakthroughDef[] = [
  {
    id: 'iihq_modernization',
    factionId: 'keleres',
    name: 'I.I.H.Q. Modernization',
    description:
      'Gain the Custodia Vigilia planet card. You are neighbors with all players who have units in the Mecatol Rex system or in systems adjacent to Mecatol Rex.',
    synergy: { color1: 'yellow', color2: 'green' },
    isExhaustable: false,
    expansion: 'thunders_edge',
  },
];

// ============================================================================
// All Breakthroughs Combined
// ============================================================================

export const BREAKTHROUGHS: BreakthroughDef[] = [
  ...BASE_BREAKTHROUGHS,
  ...POK_BREAKTHROUGHS,
  ...THUNDERS_EDGE_BREAKTHROUGHS,
  ...KELERES_BREAKTHROUGHS,
];

// ============================================================================
// Lookup Maps
// ============================================================================

export const BREAKTHROUGHS_BY_ID: Record<string, BreakthroughDef> = Object.fromEntries(
  BREAKTHROUGHS.map((bt) => [bt.id, bt])
);

export const BREAKTHROUGHS_BY_FACTION: Record<string, BreakthroughDef> = Object.fromEntries(
  BREAKTHROUGHS.map((bt) => [bt.factionId, bt])
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get breakthrough by ID
 */
export function getBreakthrough(breakthroughId: string): BreakthroughDef | null {
  return BREAKTHROUGHS_BY_ID[breakthroughId] || null;
}

/**
 * Get breakthrough for a faction
 */
export function getFactionBreakthrough(factionId: string): BreakthroughDef | null {
  return BREAKTHROUGHS_BY_FACTION[factionId] || null;
}

/**
 * Check if a player has the required tech synergy for their breakthrough
 * @param playerTechs Array of technology IDs the player owns
 * @param techColors Record mapping tech IDs to their colors
 * @param synergy The required synergy (2 colors)
 */
export function hasTechSynergy(
  playerTechs: string[],
  techColors: Record<string, TechColor | undefined>,
  synergy: BreakthroughSynergy | null
): boolean {
  if (!synergy) {
    // Nekro doesn't need synergy
    return true;
  }

  const colorCounts: Record<TechColor, number> = {
    red: 0,
    blue: 0,
    yellow: 0,
    green: 0,
  };

  for (const techId of playerTechs) {
    const color = techColors[techId];
    if (color) {
      colorCounts[color]++;
    }
  }

  // Need at least 1 of each required color, or 2 of the same if colors match
  if (synergy.color1 === synergy.color2) {
    return colorCounts[synergy.color1] >= 2;
  }
  return colorCounts[synergy.color1] >= 1 && colorCounts[synergy.color2] >= 1;
}

/**
 * Get all exhaustable breakthroughs
 */
export function getExhaustableBreakthroughs(): BreakthroughDef[] {
  return BREAKTHROUGHS.filter((bt) => bt.isExhaustable);
}

/**
 * Get breakthroughs that don't require exhausting
 */
export function getPassiveBreakthroughs(): BreakthroughDef[] {
  return BREAKTHROUGHS.filter((bt) => !bt.isExhaustable);
}

/**
 * Get breakdown count by category
 */
export function getBreakthroughCounts(): {
  base: number;
  pok: number;
  thundersEdge: number;
  keleres: number;
  total: number;
} {
  return {
    base: BASE_BREAKTHROUGHS.length,
    pok: POK_BREAKTHROUGHS.length,
    thundersEdge: THUNDERS_EDGE_BREAKTHROUGHS.length,
    keleres: KELERES_BREAKTHROUGHS.length,
    total: BREAKTHROUGHS.length,
  };
}
