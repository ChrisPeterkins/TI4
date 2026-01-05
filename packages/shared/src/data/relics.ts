/**
 * TI4 Relic Card Data
 *
 * Relics are powerful artifacts acquired by purging 3 relic fragments.
 * Each relic has unique abilities that can be used once or passively.
 *
 * Cards are tagged with their expansion:
 * - 'pok' - Prophecy of Kings base relics (10)
 * - 'codex1' - Codex I: Ordinian additions (1)
 * - 'codex2' - Codex II: Affinity additions (2)
 * - 'codex3' - Codex III: Vigil additions (0)
 * - 'thunders_edge' - Thunder's Edge expansion (7)
 */

import type { Expansion } from '../types/common.js';

// ============================================================================
// Types
// ============================================================================

export type RelicTiming = 'action' | 'passive' | 'combat' | 'agenda' | 'status' | 'tactical';
export type RelicUsage = 'exhaust' | 'purge' | 'passive';

export interface RelicDef {
  id: string;
  name: string;
  description: string;
  flavor?: string;
  timing: RelicTiming;
  usage: RelicUsage;
  victoryPoints?: number;
  isAgent?: boolean; // For JR-XS455-0
  imageId: string;
  expansion: Expansion;
}

// ============================================================================
// Prophecy of Kings Relics (10)
// ============================================================================

const POK_RELICS: RelicDef[] = [
  {
    id: 'dominus_orb',
    name: 'Dominus Orb',
    description:
      'Before you move units during a tactical action, you may purge this card to move and transport units from systems that contain 1 of your command tokens.',
    timing: 'tactical',
    usage: 'purge',
    imageId: 'dominus_orb',
    expansion: 'pok',
  },
  {
    id: 'maw_of_worlds',
    name: 'Maw of Worlds',
    description:
      'At the start of the agenda phase, you may purge this card and exhaust all of your planets to gain any 1 technology.',
    timing: 'agenda',
    usage: 'purge',
    imageId: 'maw_of_worlds',
    expansion: 'pok',
  },
  {
    id: 'scepter_of_emelpar',
    name: 'Scepter of Emelpar',
    description:
      'When you would spend a token from your strategy pool, you may exhaust this card to spend a token from your reinforcements instead.',
    timing: 'action',
    usage: 'exhaust',
    imageId: 'scepter_of_emelpar',
    expansion: 'pok',
  },
  {
    id: 'shard_of_the_throne',
    name: 'Shard of the Throne',
    description:
      'When you gain this card, gain 1 victory point. When you lose this card, lose 1 victory point. When a player gains control of a legendary planet or a planet in your home system, that player gains this card.',
    timing: 'passive',
    usage: 'passive',
    victoryPoints: 1,
    imageId: 'shard_of_the_throne',
    expansion: 'pok',
  },
  {
    id: 'stellar_converter',
    name: 'Stellar Converter',
    description:
      'ACTION: Choose 1 non-home, non-legendary planet other than Mecatol Rex in a system that is adjacent to 1 or more of your units that have BOMBARDMENT; destroy all units on that planet and purge its attachments. Then, place the destroyed planet token on that planet and purge this card.',
    timing: 'action',
    usage: 'purge',
    imageId: 'stellar_converter',
    expansion: 'pok',
  },
  {
    id: 'the_codex',
    name: 'The Codex',
    description:
      'ACTION: Purge this card to take up to 3 action cards of your choice from the action card discard pile.',
    timing: 'action',
    usage: 'purge',
    imageId: 'the_codex',
    expansion: 'pok',
  },
  {
    id: 'the_crown_of_emphidia',
    name: 'The Crown of Emphidia',
    description:
      'After you perform a tactical action, you may exhaust this card to explore 1 planet you control. At the end of the status phase, if you control the "Tomb of Emphidia", you may purge this card to gain 1 victory point.',
    timing: 'tactical',
    usage: 'exhaust',
    imageId: 'the_crown_of_emphidia',
    expansion: 'pok',
  },
  {
    id: 'the_crown_of_thalnos',
    name: 'The Crown of Thalnos',
    description:
      'During combat, you may reroll any number of your dice. You must destroy 1 of your non-fighter ships in the active system for each die that does not produce a hit after the reroll.',
    timing: 'combat',
    usage: 'passive',
    imageId: 'the_crown_of_thalnos',
    expansion: 'pok',
  },
  {
    id: 'the_obsidian',
    name: 'The Obsidian',
    description:
      "When you gain this card, draw 1 secret objective. You can have 1 additional scored or unscored secret objective.",
    timing: 'passive',
    usage: 'passive',
    imageId: 'the_obsidian',
    expansion: 'pok',
  },
  {
    id: 'the_prophets_tears',
    name: "The Prophet's Tears",
    description:
      'When you research a technology, you may exhaust this card to ignore 1 prerequisite on that technology. When you would gain a technology, you may exhaust this card to draw 1 action card instead.',
    timing: 'action',
    usage: 'exhaust',
    imageId: 'the_prophets_tears',
    expansion: 'pok',
  },
];

// ============================================================================
// Codex I: Ordinian Relics (1)
// ============================================================================

const CODEX1_RELICS: RelicDef[] = [
  {
    id: 'dynamis_core',
    name: 'Dynamis Core',
    description:
      'While this card is in your play area, your commodity value is increased by 2. ACTION: Purge this card to gain trade goods equal to your printed commodity value plus 2.',
    timing: 'action',
    usage: 'purge',
    imageId: 'dynamis_core',
    expansion: 'codex1',
  },
];

// ============================================================================
// Codex II: Affinity Relics (2)
// ============================================================================

const CODEX2_RELICS: RelicDef[] = [
  {
    id: 'jr_xs455_o',
    name: 'JR-XS455-O',
    description:
      'This card is a Titan agent. At the start of your turn: You may exhaust this agent and choose a player and a planet they control; that player may place 1 structure on that planet. If they do not, they gain 1 trade good.',
    flavor: 'Lost Titan Prototype',
    timing: 'action',
    usage: 'exhaust',
    isAgent: true,
    imageId: 'jr_xs455_o',
    expansion: 'codex2',
  },
  {
    id: 'nano_forge',
    name: 'Nano-Forge',
    description:
      'ACTION: Attach this card to a non-legendary, non-home planet you control; its resource and influence values are each increased by 2 and it is a legendary planet.',
    timing: 'action',
    usage: 'purge', // Effectively purged as it becomes attached
    imageId: 'nano_forge',
    expansion: 'codex2',
  },
];

// ============================================================================
// Thunder's Edge Relics (7)
// ============================================================================

const THUNDERS_EDGE_RELICS: RelicDef[] = [
  {
    id: 'metali_void_armaments',
    name: 'Metali Void Armaments',
    description:
      'During the "Anti-Fighter Barrage" step of space combat, you may resolve ANTI-FIGHTER BARRAGE 6 (x3) against your opponent\'s units.',
    timing: 'combat',
    usage: 'passive',
    imageId: 'metali_void_armaments',
    expansion: 'thunders_edge',
  },
  {
    id: 'the_quantumcore',
    name: 'The Quantumcore',
    description:
      'When you gain this card, gain your breakthrough. You have the required synergy for each technology type.',
    timing: 'passive',
    usage: 'passive',
    imageId: 'the_quantumcore',
    expansion: 'thunders_edge',
  },
  {
    id: 'the_silver_flame',
    name: 'The Silver Flame',
    description:
      'This card may be exchanged as part of a transaction. ACTION: Purge this card and roll 1 die. If the result is 10, gain 1 victory point. Otherwise, purge your home system planet card; you cannot score public objectives.',
    timing: 'action',
    usage: 'purge',
    imageId: 'the_silver_flame',
    expansion: 'thunders_edge',
  },
  {
    id: 'lightrail_ordnance',
    name: 'Lightrail Ordnance',
    description:
      'Your space docks gain SPACE CANNON 5 (x2). You may use the SPACE CANNON abilities of your space docks against ships in adjacent systems.',
    timing: 'passive',
    usage: 'passive',
    imageId: 'lightrail_ordnance',
    expansion: 'thunders_edge',
  },
  {
    id: 'metali_void_shielding',
    name: 'Metali Void Shielding',
    description:
      'When hits are produced against your units, 1 of your non-fighter ships in the active system may use SUSTAIN DAMAGE to cancel 1 of those hits.',
    timing: 'combat',
    usage: 'passive',
    imageId: 'metali_void_shielding',
    expansion: 'thunders_edge',
  },
  {
    id: 'the_triad',
    name: 'The Triad',
    description:
      'This card is a planet card. Its resource value and influence value are each equal to the number of different relic fragment types you have (including unknown). This planet does not have a trait and cannot be explored.',
    timing: 'passive',
    usage: 'passive',
    imageId: 'the_triad',
    expansion: 'thunders_edge',
  },
  {
    id: 'heart_of_ixth',
    name: 'Heart of Ixth',
    description:
      'After a die is rolled, you may exhaust this card to add or subtract 1 from the result of that roll.',
    timing: 'action',
    usage: 'exhaust',
    imageId: 'heart_of_ixth',
    expansion: 'thunders_edge',
  },
];

// ============================================================================
// All Relic Cards
// ============================================================================

export const RELIC_CARDS: RelicDef[] = [
  ...POK_RELICS,
  ...CODEX1_RELICS,
  ...CODEX2_RELICS,
  ...THUNDERS_EDGE_RELICS,
];

// ============================================================================
// Lookup Maps
// ============================================================================

export const RELICS_BY_ID: Record<string, RelicDef> = Object.fromEntries(
  RELIC_CARDS.map((relic) => [relic.id, relic])
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get relic by ID
 */
export function getRelic(relicId: string): RelicDef | null {
  return RELICS_BY_ID[relicId] || null;
}

/**
 * Get relic name from ID
 */
export function getRelicName(relicId: string): string {
  const relic = RELICS_BY_ID[relicId];
  return relic?.name || relicId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Get all relic IDs for initial deck setup, filtered by expansions
 */
export function getInitialRelicDeck(expansions: Expansion[] = ['pok']): string[] {
  return RELIC_CARDS
    .filter((relic) => expansions.includes(relic.expansion))
    .map((relic) => relic.id);
}

/**
 * Get all relics, optionally filtered by expansions
 */
export function getRelics(expansions?: Expansion[]): RelicDef[] {
  if (!expansions) {
    return RELIC_CARDS;
  }
  return RELIC_CARDS.filter((relic) => expansions.includes(relic.expansion));
}

/**
 * Check if a relic can be exhausted (vs purged or passive)
 */
export function isExhaustable(relicId: string): boolean {
  const relic = RELICS_BY_ID[relicId];
  return relic?.usage === 'exhaust';
}

/**
 * Check if a relic is purged when used
 */
export function isPurgeable(relicId: string): boolean {
  const relic = RELICS_BY_ID[relicId];
  return relic?.usage === 'purge';
}

/**
 * Check if a relic provides victory points
 */
export function getRelicVictoryPoints(relicId: string): number {
  const relic = RELICS_BY_ID[relicId];
  return relic?.victoryPoints || 0;
}

/**
 * Get relics by timing (when they can be used)
 */
export function getRelicsByTiming(timing: RelicTiming, expansions?: Expansion[]): RelicDef[] {
  let relics = RELIC_CARDS.filter((relic) => relic.timing === timing);
  if (expansions) {
    relics = relics.filter((relic) => expansions.includes(relic.expansion));
  }
  return relics;
}

/**
 * Check if a relic is an agent (JR-XS455-O)
 */
export function isRelicAgent(relicId: string): boolean {
  const relic = RELICS_BY_ID[relicId];
  return relic?.isAgent === true;
}

/**
 * Check if relics are enabled (requires PoK or later expansions)
 */
export function areRelicsEnabled(expansions: Expansion[]): boolean {
  return expansions.some((exp) => exp === 'pok' || exp.startsWith('codex') || exp === 'thunders_edge');
}
