/**
 * Promissory Notes Data
 *
 * Each player starts with 5 promissory notes:
 * - 4 generic color-matched notes (Support for Throne, Ceasefire, Trade Agreement, Political Secret)
 * - 1 faction-specific note
 *
 * Notes can be traded between players and played for their effects.
 * Some notes stay in play area, others resolve immediately and return to owner.
 */

import type { Expansion } from '../types/common.js';

/**
 * When a promissory note can be played
 */
export type PromissoryTiming =
  | 'action' // ACTION: card - use as a component action
  | 'immediate' // Must play immediately when received
  | 'after_activation' // After owner activates a system with holder's units
  | 'when_replenish' // When owner replenishes commodities
  | 'when_agenda_revealed' // When an agenda is revealed
  | 'start_of_turn' // Start of holder's turn in action phase
  | 'start_of_combat' // Start of a combat
  | 'start_of_combat_round' // Start of a round of space combat
  | 'start_of_invasion' // Start of invasion
  | 'start_of_ground_combat' // Start of ground combat
  | 'after_commit_ground' // After committing ground forces to land
  | 'end_of_strategy_phase' // End of strategy phase
  | 'after_tech_research' // After owner researches a non-faction tech
  | 'after_indoctrination'; // After owner uses Indoctrination ability (Yin)

/**
 * What triggers the note to return to its owner
 */
export type ReturnCondition =
  | 'resolve' // Returns after the effect resolves
  | 'activation' // Returns if holder activates system with owner's units
  | 'elimination' // Returns if owner is eliminated (to game box)
  | 'end_of_round' // Returns at end of round
  | 'custom'; // Special return condition defined in handler

/**
 * Extended promissory note definition with gameplay metadata
 */
export interface PromissoryNoteDefinition {
  id: string;
  name: string;
  owner: 'generic' | string; // 'generic' for color notes, faction ID for faction notes
  description: string;
  playTiming: PromissoryTiming;
  staysInPlay: boolean; // Does it stay face-up in play area?
  immediatePlay: boolean; // Must be played when received (Support for Throne, Alliance)
  returnCondition: ReturnCondition;
  vpValue?: number; // Victory points granted (Support for Throne = 1)
  expansion: Expansion;
}

// =============================================================================
// GENERIC PROMISSORY NOTES (4 per player, color-matched)
// =============================================================================

export const GENERIC_PROMISSORY_NOTES: PromissoryNoteDefinition[] = [
  {
    id: 'support_for_the_throne',
    name: 'Support for the Throne',
    owner: 'generic',
    description:
      'When you receive this card, place it face-up in your play area. The player who gave you this card gains 1 victory point. If you activate a system that contains 1 or more of their units, or if that player is eliminated, they regain this card and lose 1 victory point.',
    playTiming: 'immediate',
    staysInPlay: true,
    immediatePlay: true,
    returnCondition: 'activation',
    vpValue: 1,
    expansion: 'base',
  },
  {
    id: 'ceasefire',
    name: 'Ceasefire',
    owner: 'generic',
    description:
      'After the player who gave you this card activates a system that contains 1 or more of your units: That player cannot make moves into the active system during this tactical action. Then, return this card to that player.',
    playTiming: 'after_activation',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },
  {
    id: 'trade_agreement',
    name: 'Trade Agreement',
    owner: 'generic',
    description:
      'When the player who gave you this card replenishes commodities: You may give that player all of your commodities. If you do, they give you all of their commodities. Then, return this card to that player.',
    playTiming: 'when_replenish',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },
  {
    id: 'political_secret',
    name: 'Political Secret',
    owner: 'generic',
    description:
      'When an agenda is revealed: The player who gave you this card cannot vote on this agenda, play action cards, or resolve abilities during this agenda. Then, return this card to that player.',
    playTiming: 'when_agenda_revealed',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },
];

// Alliance is PoK only
export const ALLIANCE_PROMISSORY_NOTE: PromissoryNoteDefinition = {
  id: 'alliance',
  name: 'Alliance',
  owner: 'generic',
  description:
    'When you receive this card, place it face-up in your play area. While this card is in your play area, you may use the commander ability of the player who gave you this card. If you activate a system that contains 1 or more of their units, return this card to that player.',
  playTiming: 'immediate',
  staysInPlay: true,
  immediatePlay: true,
  returnCondition: 'activation',
  expansion: 'pok',
};

// =============================================================================
// FACTION PROMISSORY NOTES (Base Game - 17 factions)
// =============================================================================

export const FACTION_PROMISSORY_NOTES: PromissoryNoteDefinition[] = [
  // The Arborec - Stymie
  {
    id: 'stymie',
    name: 'Stymie',
    owner: 'arborec',
    description:
      "ACTION: Place this card face-up in your play area. While this card is in your play area, the Arborec player cannot produce units in or adjacent to non-home systems that contain 1 or more of your units. If you activate a system that contains 1 or more of the Arborec player's units, return this card to the Arborec player.",
    playTiming: 'action',
    staysInPlay: true,
    immediatePlay: false,
    returnCondition: 'activation',
    expansion: 'base',
  },

  // The Ghosts of Creuss - Creuss Iff
  {
    id: 'creuss_iff',
    name: 'Creuss Iff',
    owner: 'creuss',
    description:
      "At the start of your turn during the action phase: Place or move a Creuss wormhole token into either a system that contains a planet you control or a non-home system that does not contain another player's ships. Then, return this card to the Ghosts of Creuss player.",
    playTiming: 'start_of_turn',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The Emirates of Hacan - Trade Convoys
  {
    id: 'trade_convoys',
    name: 'Trade Convoys',
    owner: 'hacan',
    description:
      "ACTION: Place this card face-up in your play area. While this card is in your play area, you may negotiate transactions with players who are not your neighbors. If the Hacan player activates a system that contains 1 or more of your units, return this card to the Hacan player.",
    playTiming: 'action',
    staysInPlay: true,
    immediatePlay: false,
    returnCondition: 'activation',
    expansion: 'base',
  },

  // The Universities of Jol-Nar - Research Agreement
  {
    id: 'research_agreement',
    name: 'Research Agreement',
    owner: 'jolnar',
    description:
      'After the Jol-Nar player researches a technology that is not a faction technology: Gain that technology. Then, return this card to the Jol-Nar player.',
    playTiming: 'after_tech_research',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The L1Z1X Mindnet - Cybernetic Enhancements
  {
    id: 'cybernetic_enhancements',
    name: 'Cybernetic Enhancements',
    owner: 'l1z1x',
    description:
      'At the start of a ground combat on a planet that contains 1 or more of your units: Replace each of your infantry on that planet with the same number of fighters from your reinforcements. Then return this card to the L1Z1X player.',
    playTiming: 'start_of_ground_combat',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The Barony of Letnev - War Funding
  {
    id: 'war_funding',
    name: 'War Funding',
    owner: 'letnev',
    description:
      'At the start of a round of space combat: The Letnev player loses 2 trade goods. During this combat round, reroll any number of your dice. Then, return this card to the Letnev player.',
    playTiming: 'start_of_combat_round',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The Mentak Coalition - Promise of Protection
  {
    id: 'promise_of_protection',
    name: 'Promise of Protection',
    owner: 'mentak',
    description:
      "ACTION: Place this card face-up in your play area. While this card is in your play area, the Mentak player cannot use their PILLAGE faction ability against you. If you activate a system that contains 1 or more of the Mentak player's units, return this card to the Mentak player.",
    playTiming: 'action',
    staysInPlay: true,
    immediatePlay: false,
    returnCondition: 'activation',
    expansion: 'base',
  },

  // The Embers of Muaat - Fires of the Gashlai
  {
    id: 'fires_of_the_gashlai',
    name: 'Fires of the Gashlai',
    owner: 'muaat',
    description:
      "ACTION: Remove 1 token from the Muaat player's fleet pool and return it to their reinforcements. Then, gain your war sun unit upgrade technology card. Then, return this card to the Muaat player.",
    playTiming: 'action',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The Naalu Collective - Gift of Prescience
  {
    id: 'gift_of_prescience',
    name: 'Gift of Prescience',
    owner: 'naalu',
    description:
      'At the start of your turn during the action phase: Place the Naalu "0" token on your strategy card. The initiative value of this strategy card is 0 until the end of this strategy phase. Then, return this card to the Naalu player.',
    playTiming: 'start_of_turn',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The Nekro Virus - Antivirus
  {
    id: 'antivirus',
    name: 'Antivirus',
    owner: 'nekro',
    description:
      "At the start of a combat against the Nekro player: Place this card in your play area. While this card is in your play area, the Nekro player cannot use their TECHNOLOGICAL SINGULARITY faction ability against you. If you activate a system that contains 1 or more of the Nekro player's units, return this card to the Nekro player.",
    playTiming: 'start_of_combat',
    staysInPlay: true,
    immediatePlay: false,
    returnCondition: 'activation',
    expansion: 'base',
  },

  // The Clan of Saar - Ragh's Call
  {
    id: 'raghs_call',
    name: "Ragh's Call",
    owner: 'saar',
    description:
      "After you commit 1 or more units to land on a planet: Remove all of the Saar player's ground forces from that planet and place them on a planet controlled by the Saar player. Then, return this card to the Saar player.",
    playTiming: 'after_commit_ground',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // Sardakk N'orr - Tekklar Legion
  {
    id: 'tekklar_legion',
    name: 'Tekklar Legion',
    owner: 'sardakk',
    description:
      "At the start of an invasion: Apply +1 to the result of each of your unit's combat rolls during this invasion. If your opponent is the N'orr player, apply -1 to the result of each of the N'orr player's unit's combat rolls during this invasion. Then, return this card to the N'orr player.",
    playTiming: 'start_of_invasion',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The Federation of Sol - Military Support
  {
    id: 'military_support',
    name: 'Military Support',
    owner: 'sol',
    description:
      "At the start of the Sol player's turn: Remove 1 token from the Sol player's strategy pool, if able, and return it to their reinforcements. Then, you may place 2 infantry from your reinforcements on any planet you control. Then, return this card to the Sol player.",
    playTiming: 'start_of_turn',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The Winnu - Acquiescence
  {
    id: 'acquiescence',
    name: 'Acquiescence',
    owner: 'winnu',
    description:
      'At the end of the strategy phase: Exchange 1 of your strategy cards with a strategy card that was chosen by the Winnu player. Then return this card to the Winnu player.',
    playTiming: 'end_of_strategy_phase',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The Xxcha Kingdom - Political Favor
  {
    id: 'political_favor',
    name: 'Political Favor',
    owner: 'xxcha',
    description:
      "When an agenda is revealed: Remove 1 token from the Xxcha player's strategy pool and return it to their reinforcements. Then, discard the revealed agenda and reveal 1 agenda from the top of the deck. Players vote on this agenda instead. Then return this card to the Xxcha player.",
    playTiming: 'when_agenda_revealed',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The Yin Brotherhood - Greyfire Mutagen
  {
    id: 'greyfire_mutagen',
    name: 'Greyfire Mutagen',
    owner: 'yin',
    description:
      'After the Yin player uses their INDOCTRINATION faction ability: Gain the infantry unit that was replaced. Then, return this card to the Yin player.',
    playTiming: 'after_indoctrination',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },

  // The Yssaril Tribes - Spy Net
  {
    id: 'spy_net',
    name: 'Spy Net',
    owner: 'yssaril',
    description:
      "At the start of your turn during the action phase: Look at the Yssaril player's hand of action cards. Choose 1 of those cards and add it to your hand. Then, return this card to the Yssaril player.",
    playTiming: 'start_of_turn',
    staysInPlay: false,
    immediatePlay: false,
    returnCondition: 'resolve',
    expansion: 'base',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all promissory notes for a given expansion set
 */
export function getPromissoryNotes(expansions: Expansion[] = ['base']): PromissoryNoteDefinition[] {
  const notes: PromissoryNoteDefinition[] = [];

  // Add generic notes
  notes.push(...GENERIC_PROMISSORY_NOTES.filter((n) => expansions.includes(n.expansion)));

  // Add Alliance if PoK is enabled
  if (expansions.includes('pok')) {
    notes.push(ALLIANCE_PROMISSORY_NOTE);
  }

  // Add faction notes
  notes.push(...FACTION_PROMISSORY_NOTES.filter((n) => expansions.includes(n.expansion)));

  return notes;
}

/**
 * Get a specific promissory note by ID
 */
export function getPromissoryNoteById(noteId: string): PromissoryNoteDefinition | undefined {
  // Check generic notes (handle color-suffixed IDs)
  const baseId = noteId.replace(/_[a-z]+$/, ''); // Remove color suffix like _red, _blue

  const genericNote = GENERIC_PROMISSORY_NOTES.find((n) => n.id === baseId);
  if (genericNote) return genericNote;

  if (baseId === 'alliance') return ALLIANCE_PROMISSORY_NOTE;

  // Check faction notes
  return FACTION_PROMISSORY_NOTES.find((n) => n.id === noteId);
}

/**
 * Get the base note ID without color suffix
 */
export function getBaseNoteId(noteId: string): string {
  // Generic notes have color suffix: support_for_the_throne_red
  // Faction notes don't have suffix: stymie
  return noteId.replace(/_(?:red|blue|green|yellow|purple|orange|pink|black)$/, '');
}

/**
 * Get the original owner's color from a generic note ID
 */
export function getNoteOwnerColor(noteId: string): string | null {
  const match = noteId.match(/_([a-z]+)$/);
  return match ? match[1] : null;
}

/**
 * Check if a note must be played immediately when received
 */
export function isImmediatePlayNote(noteId: string): boolean {
  const note = getPromissoryNoteById(noteId);
  return note?.immediatePlay ?? false;
}

/**
 * Check if a note stays in play area after being played
 */
export function noteStaysInPlay(noteId: string): boolean {
  const note = getPromissoryNoteById(noteId);
  return note?.staysInPlay ?? false;
}

/**
 * Get the generic note IDs for a player color
 */
export function getGenericNoteIdsForColor(color: string, expansions: Expansion[] = ['base']): string[] {
  const notes = [
    `support_for_the_throne_${color}`,
    `ceasefire_${color}`,
    `trade_agreement_${color}`,
    `political_secret_${color}`,
  ];

  if (expansions.includes('pok')) {
    notes.push(`alliance_${color}`);
  }

  return notes;
}

/**
 * Map of note IDs to their definitions for quick lookup
 */
export const PROMISSORY_NOTES_BY_ID: Record<string, PromissoryNoteDefinition> = {};

// Populate the map
for (const note of GENERIC_PROMISSORY_NOTES) {
  PROMISSORY_NOTES_BY_ID[note.id] = note;
}
PROMISSORY_NOTES_BY_ID[ALLIANCE_PROMISSORY_NOTE.id] = ALLIANCE_PROMISSORY_NOTE;
for (const note of FACTION_PROMISSORY_NOTES) {
  PROMISSORY_NOTES_BY_ID[note.id] = note;
}
