/**
 * TI4 Prophecy of Kings - Relic Card Data
 *
 * 10 unique relic cards that can be acquired by purging 3 relic fragments.
 * Each relic has powerful abilities that can be used once or passively.
 */

// ============================================================================
// Types
// ============================================================================

export type RelicTiming = 'action' | 'passive' | 'combat' | 'agenda' | 'status';
export type RelicUsage = 'exhaust' | 'purge' | 'passive';

export interface RelicDef {
  id: string;
  name: string;
  description: string;
  flavor?: string;
  timing: RelicTiming;
  usage: RelicUsage;
  victoryPoints?: number;
  imageId: string; // Matches filename in /images/cards/relic/
}

// ============================================================================
// Relic Definitions
// ============================================================================

export const RELIC_CARDS: RelicDef[] = [
  {
    id: 'dominus_orb',
    name: 'Dominus Orb',
    description:
      'Before you move units during a tactical action, you may purge this card to move and transport units from systems that contain 1 of your command tokens.',
    timing: 'action',
    usage: 'purge',
    imageId: 'dominus_orb',
  },
  {
    id: 'maw_of_worlds',
    name: 'Maw of Worlds',
    description:
      'At the start of the agenda phase, you may purge this card and exhaust all of your planets to gain any 1 technology.',
    timing: 'agenda',
    usage: 'purge',
    imageId: 'maw_of_worlds',
  },
  {
    id: 'scepter_of_emelpar',
    name: 'Scepter of Emelpar',
    description:
      'When you would spend a token from your strategy pool, you may exhaust this card to spend a token from your reinforcements instead.',
    timing: 'action',
    usage: 'exhaust',
    imageId: 'scepter_of_emelpar',
  },
  {
    id: 'shard_of_the_throne',
    name: 'Shard of the Throne',
    description:
      'When you gain this card, gain 1 victory point. When you lose this card, lose 1 victory point. When a player gains control of a legendary planet you control, that player gains this card.',
    timing: 'passive',
    usage: 'passive',
    victoryPoints: 1,
    imageId: 'shard_of_the_throne',
  },
  {
    id: 'stellar_converter',
    name: 'Stellar Converter',
    description:
      'ACTION: Choose 1 non-home, non-legendary planet other than Mecatol Rex in a system that is adjacent to 1 or more of your units that have BOMBARDMENT; destroy all units on that planet and purge its attachments. Then, place the destroyed planet token on that planet and purge this card.',
    timing: 'action',
    usage: 'purge',
    imageId: 'stellar_converter',
  },
  {
    id: 'the_codex',
    name: 'The Codex',
    description:
      'ACTION: Purge this card to take up to 3 action cards of your choice from the action card discard pile.',
    timing: 'action',
    usage: 'purge',
    imageId: 'the_codex',
  },
  {
    id: 'the_crown_of_emphidia',
    name: 'The Crown of Emphidia',
    description:
      'After you perform a tactical action, you may exhaust this card to explore 1 planet you control. At the end of the status phase, if you control the "Tomb of Emphidia", you may purge this card to gain 1 victory point.',
    timing: 'action',
    usage: 'exhaust',
    imageId: 'the_crown_of_emphidia',
  },
  {
    id: 'the_crown_of_thalnos',
    name: 'The Crown of Thalnos',
    description:
      'During combat, you may reroll any number of your dice. You must destroy 1 of your non-fighter ships in the active system for each die you reroll.',
    timing: 'combat',
    usage: 'passive',
    imageId: 'the_crown_of_thalnos',
  },
  {
    id: 'the_obsidian',
    name: 'The Obsidian',
    description:
      "When you gain this card, draw 1 secret objective. You can have 1 additional scored or unscored secret objective.",
    timing: 'passive',
    usage: 'passive',
    imageId: 'the_obsidian',
  },
  {
    id: 'the_prophets_tears',
    name: "The Prophet's Tears",
    description:
      'When you research a technology, you may exhaust this card to ignore 1 prerequisite on that technology.',
    timing: 'action',
    usage: 'exhaust',
    imageId: 'the_prophets_tears',
  },
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
 * Get all relic IDs for initial deck setup
 */
export function getInitialRelicDeck(): string[] {
  return RELIC_CARDS.map((relic) => relic.id);
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
export function getRelicsByTiming(timing: RelicTiming): RelicDef[] {
  return RELIC_CARDS.filter((relic) => relic.timing === timing);
}
