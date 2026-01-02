import type { AgendaCardData } from '../types/static-data.js';

// =============================================================================
// LAWS - Permanent effects that remain in play
// =============================================================================

export const LAW_AGENDAS: AgendaCardData[] = [
  // For/Against Laws
  {
    id: 'anti_intellectual_revolution',
    name: 'Anti-Intellectual Revolution',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Each player may no longer exhaust planets to satisfy technology prerequisites. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'articles_of_war',
    name: 'Articles of War',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: All bombardment rolls that do not target a player\'s home system fail. AGAINST: No effect.',
    expansion: 'pok',
  },
  {
    id: 'checks_and_balances',
    name: 'Checks and Balances',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: When a player picks a strategy card, they give a trade good to a player that does not have one. AGAINST: No effect.',
    expansion: 'pok',
  },
  {
    id: 'classified_document_leaks',
    name: 'Classified Document Leaks',
    type: 'law',
    electionType: 'scored_secret',
    description: 'Elect a scored secret objective. The elected secret objective is now public.',
    expansion: 'base',
  },
  {
    id: 'committee_formation',
    name: 'Committee Formation',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. Exhaust this card at the start of the agenda phase; for each agenda, the elected player may cast 1 additional vote.',
    expansion: 'base',
  },
  {
    id: 'conventions_of_war',
    name: 'Conventions of War',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Players cannot use BOMBARDMENT against units on cultural planets. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'core_mining',
    name: 'Core Mining',
    type: 'law',
    electionType: 'planet',
    description: 'Elect a hazardous planet. Attach this card to that planet. The resource value of this planet is increased by 2.',
    expansion: 'base',
  },
  {
    id: 'demilitarized_zone',
    name: 'Demilitarized Zone',
    type: 'law',
    electionType: 'planet',
    description: 'Elect a cultural planet. Attach this card to that planet. Players cannot produce units on this planet.',
    expansion: 'base',
  },
  {
    id: 'enforced_travel_ban',
    name: 'Enforced Travel Ban',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Alpha and beta wormholes have no effect during movement. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'executive_sanctions',
    name: 'Executive Sanctions',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Each player can have a maximum of 3 action cards in hand. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'fleet_regulations',
    name: 'Fleet Regulations',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Each player cannot have more than 4 tokens in their fleet pool. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'holy_planet_of_ixth',
    name: 'Holy Planet of Ixth',
    type: 'law',
    electionType: 'planet',
    description: 'Elect a cultural planet. Attach this card to that planet. The influence value of this planet is increased by 2.',
    expansion: 'base',
  },
  {
    id: 'homeland_defense_act',
    name: 'Homeland Defense Act',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Each player\'s home system has SPACE CANNON 5. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'imperial_arbiter',
    name: 'Imperial Arbiter',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. The elected player may discard this card from play to swap two strategy cards between players.',
    expansion: 'base',
  },
  {
    id: 'minister_of_commerce',
    name: 'Minister of Commerce',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. The elected player gains 1 trade good when any player replenishes commodities.',
    expansion: 'base',
  },
  {
    id: 'minister_of_exploration',
    name: 'Minister of Exploration',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. When the elected player explores a planet, they gain 1 trade good.',
    expansion: 'base',
  },
  {
    id: 'minister_of_industry',
    name: 'Minister of Industry',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. When the elected player places a space dock, they may place it in any system that contains a planet they control.',
    expansion: 'base',
  },
  {
    id: 'minister_of_peace',
    name: 'Minister of Peace',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. After any player activates a system, the elected player may spend 1 trade good; the active player must destroy 1 ship.',
    expansion: 'base',
  },
  {
    id: 'minister_of_policy',
    name: 'Minister of Policy',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. At the end of the status phase, the elected player draws 1 additional action card.',
    expansion: 'base',
  },
  {
    id: 'minister_of_sciences',
    name: 'Minister of Sciences',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. The elected player may exhaust this card to ignore the prerequisites of 1 technology they research.',
    expansion: 'base',
  },
  {
    id: 'minister_of_war',
    name: 'Minister of War',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. The elected player may exhaust this card after performing a tactical action to remove 1 of their command tokens from the game board and return it to their reinforcements.',
    expansion: 'base',
  },
  {
    id: 'mutiny',
    name: 'Mutiny',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Each player who voted "For" gains 1 victory point. AGAINST: Each player who voted "For" loses 1 victory point.',
    expansion: 'base',
  },
  {
    id: 'new_constitution',
    name: 'New Constitution',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Discard all laws in play. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'prophecy_of_ixth',
    name: 'Prophecy of Ixth',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. The elected player applies +1 to the result of each of their unit\'s combat rolls during combat in the Mecatol Rex system.',
    expansion: 'base',
  },
  {
    id: 'publicize_weapon_schematics',
    name: 'Publicize Weapon Schematics',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Each player with a war sun on the game board researches war sun. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'regulated_conscription',
    name: 'Regulated Conscription',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: The cost of each unit is increased by 1. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'representative_government',
    name: 'Representative Government',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Players cannot exhaust planets to cast votes during the agenda phase; each player may cast 1 vote on each agenda instead. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'research_team_biotic',
    name: 'Research Team: Biotic',
    type: 'law',
    electionType: 'planet',
    description: 'Elect an industrial planet. Attach this card to that planet. When the owner of this planet researches technology, they may exhaust this planet to ignore the prerequisite of that technology.',
    expansion: 'base',
  },
  {
    id: 'research_team_cybernetic',
    name: 'Research Team: Cybernetic',
    type: 'law',
    electionType: 'planet',
    description: 'Elect an industrial planet. Attach this card to that planet. When the owner of this planet researches technology, they may exhaust this planet to ignore the prerequisite of that technology.',
    expansion: 'base',
  },
  {
    id: 'research_team_propulsion',
    name: 'Research Team: Propulsion',
    type: 'law',
    electionType: 'planet',
    description: 'Elect an industrial planet. Attach this card to that planet. When the owner of this planet researches technology, they may exhaust this planet to ignore the prerequisite of that technology.',
    expansion: 'base',
  },
  {
    id: 'research_team_warfare',
    name: 'Research Team: Warfare',
    type: 'law',
    electionType: 'planet',
    description: 'Elect a hazardous planet. Attach this card to that planet. When the owner of this planet researches technology, they may exhaust this planet to ignore the prerequisite of that technology.',
    expansion: 'base',
  },
  {
    id: 'search_warrant',
    name: 'Search Warrant',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. The elected player must play all of their action cards face up.',
    expansion: 'pok',
  },
  {
    id: 'seed_of_an_empire',
    name: 'Seed of an Empire',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: The player with the most victory points gains 1 victory point. AGAINST: The player with the fewest victory points gains 1 victory point.',
    expansion: 'base',
  },
  {
    id: 'senate_sanctuary',
    name: 'Senate Sanctuary',
    type: 'law',
    electionType: 'planet',
    description: 'Elect a cultural planet. Attach this card to that planet. This planet is the home system of the speaker.',
    expansion: 'base',
  },
  {
    id: 'shard_of_the_throne',
    name: 'Shard of the Throne',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. The elected player gains 1 victory point. If this law is discarded, the elected player loses 1 victory point.',
    expansion: 'base',
  },
  {
    id: 'shared_research',
    name: 'Shared Research',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: Each player\'s planets with technology specialties provide the matching technology prerequisite to all players. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'terraforming_initiative',
    name: 'Terraforming Initiative',
    type: 'law',
    electionType: 'planet',
    description: 'Elect a hazardous planet. Attach this card to that planet. This planet\'s resource and influence values are each increased by 1.',
    expansion: 'base',
  },
  {
    id: 'the_crown_of_emphidia',
    name: 'The Crown of Emphidia',
    type: 'law',
    electionType: 'player',
    description: 'Elect a player. The elected player gains 1 victory point. When the speaker votes, they may cast 1 additional vote for each law in play.',
    expansion: 'base',
  },
  {
    id: 'wormhole_reconstruction',
    name: 'Wormhole Reconstruction',
    type: 'law',
    electionType: 'for_against',
    description: 'FOR: All systems that contain either an alpha or beta wormhole are adjacent. AGAINST: No effect.',
    expansion: 'base',
  },
];

// =============================================================================
// DIRECTIVES - One-time effects that are discarded after resolution
// =============================================================================

export const DIRECTIVE_AGENDAS: AgendaCardData[] = [
  {
    id: 'archived_secret',
    name: 'Archived Secret',
    type: 'directive',
    electionType: 'for_against',
    description: 'FOR: Each player researches 1 technology; each player that owns no secret objectives draws 1 secret objective. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'arms_reduction',
    name: 'Arms Reduction',
    type: 'directive',
    electionType: 'for_against',
    description: 'FOR: Each player destroys all but 2 of their dreadnoughts and all but 4 of their cruisers. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'colonial_redistribution',
    name: 'Colonial Redistribution',
    type: 'directive',
    electionType: 'planet',
    description: 'Elect a non-home planet controlled by a player other than the speaker. Take control of that planet.',
    expansion: 'base',
  },
  {
    id: 'compensated_disarmament',
    name: 'Compensated Disarmament',
    type: 'directive',
    electionType: 'planet',
    description: 'Elect a planet. Destroy all units on that planet and give its controller trade goods equal to the combined cost of those units.',
    expansion: 'base',
  },
  {
    id: 'economic_equality',
    name: 'Economic Equality',
    type: 'directive',
    electionType: 'for_against',
    description: 'FOR: Each player returns all of their trade goods to the supply. Then, each player gains 5 trade goods. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'incentive_program',
    name: 'Incentive Program',
    type: 'directive',
    electionType: 'for_against',
    description: 'FOR: Draw and reveal a stage 1 public objective from the deck. AGAINST: Draw and reveal a stage 2 public objective from the deck.',
    expansion: 'base',
  },
  {
    id: 'ixthian_artifact',
    name: 'Ixthian Artifact',
    type: 'directive',
    electionType: 'for_against',
    description: 'FOR: The speaker rolls 1 die. On a result of 6-10, each player may research 2 technologies. On a result of 1-5, destroy all units in Mecatol Rex\'s system and each player with units on Mecatol Rex loses 1 victory point. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'judicial_abolishment',
    name: 'Judicial Abolishment',
    type: 'directive',
    electionType: 'law',
    description: 'Elect a law. Discard that law.',
    expansion: 'base',
  },
  {
    id: 'miscount_disclosed',
    name: 'Miscount Disclosed',
    type: 'directive',
    electionType: 'law',
    description: 'Elect a law. Discard that law and resolve the other outcome of that law.',
    expansion: 'base',
  },
  {
    id: 'new_galactic_order',
    name: 'New Galactic Order',
    type: 'directive',
    electionType: 'for_against',
    description: 'FOR: Return all strategy cards to the common play area. Each player, beginning with the speaker, picks 1 strategy card. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'public_disgrace',
    name: 'Public Disgrace',
    type: 'directive',
    electionType: 'player',
    description: 'Elect a player. That player must discard 1 action card from their hand.',
    expansion: 'pok',
  },
  {
    id: 'public_execution',
    name: 'Public Execution',
    type: 'directive',
    electionType: 'player',
    description: 'Elect a player. That player exhausts 1 of their agents.',
    expansion: 'pok',
  },
  {
    id: 'rearmament_agreement',
    name: 'Rearmament Agreement',
    type: 'directive',
    electionType: 'for_against',
    description: 'FOR: Each player places 1 mech from their reinforcements on a planet they control in their home system. AGAINST: No effect.',
    expansion: 'pok',
  },
  {
    id: 'unconventional_measures',
    name: 'Unconventional Measures',
    type: 'directive',
    electionType: 'for_against',
    description: 'FOR: Each player that voted "For" draws 2 action cards. AGAINST: Each player that voted "Against" draws 2 action cards.',
    expansion: 'base',
  },
  {
    id: 'wormhole_research',
    name: 'Wormhole Research',
    type: 'directive',
    electionType: 'for_against',
    description: 'FOR: Each player that has 1 or more ships in a system that contains a wormhole may research 1 technology. AGAINST: No effect.',
    expansion: 'base',
  },
  {
    id: 'swords_to_plowshares',
    name: 'Swords to Plowshares',
    type: 'directive',
    electionType: 'for_against',
    description: 'FOR: Each player may destroy up to 4 of their ships. For each ship a player destroys, that player gains 1 trade good. AGAINST: No effect.',
    expansion: 'pok',
  },
];

// =============================================================================
// EXPORTS
// =============================================================================

export const ALL_AGENDAS: AgendaCardData[] = [...LAW_AGENDAS, ...DIRECTIVE_AGENDAS];

export const AGENDAS_BY_ID: Record<string, AgendaCardData> = Object.fromEntries(
  ALL_AGENDAS.map(a => [a.id, a])
);

export const LAW_AGENDAS_BY_ID: Record<string, AgendaCardData> = Object.fromEntries(
  LAW_AGENDAS.map(a => [a.id, a])
);

export const DIRECTIVE_AGENDAS_BY_ID: Record<string, AgendaCardData> = Object.fromEntries(
  DIRECTIVE_AGENDAS.map(a => [a.id, a])
);

// Helper to get agendas by type
export function getAgendasByType(type: 'law' | 'directive'): AgendaCardData[] {
  return type === 'law' ? LAW_AGENDAS : DIRECTIVE_AGENDAS;
}

// Helper to get agendas by election type
export function getAgendasByElectionType(electionType: AgendaCardData['electionType']): AgendaCardData[] {
  return ALL_AGENDAS.filter(a => a.electionType === electionType);
}

/**
 * Create the initial agenda deck for a game
 * Returns array of agenda IDs to shuffle
 */
export function createAgendaDeck(expansion: 'base' | 'pok' = 'base'): string[] {
  return ALL_AGENDAS
    .filter(a => a.expansion === expansion || a.expansion === 'base')
    .map(a => a.id);
}
