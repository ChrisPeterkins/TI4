import type { ActionCardData, ActionCardTiming } from '../types/static-data.js';
import type { Expansion } from '../types/common.js';

/**
 * TI4 Action Cards
 *
 * Action cards are drawn during the Status Phase and can be played
 * at various timing windows during the game. Each card has a timing
 * indicator that specifies when it can be played.
 *
 * Timing Categories:
 * - ACTION: Play as a component action during your turn
 * - TACTICAL: Play during a tactical action
 * - COMBAT: Play during combat (general)
 * - AGENDA: Play during the agenda phase
 * - STATUS: Play during the status phase
 * - Specific combat phases: anti_fighter_barrage, space_combat, ground_combat, etc.
 */

// =============================================================================
// SABOTAGE & COUNTER CARDS
// =============================================================================

const SABOTAGE_CARDS: ActionCardData[] = [
  {
    id: 'sabotage_1',
    name: 'Sabotage',
    count: 1,
    timing: 'action',
    description: 'When another player plays an action card: Cancel that action card.',
    flavor: 'The Council has ruled that sabotage is only illegal if you get caught.',
    expansion: 'base',
  },
  {
    id: 'sabotage_2',
    name: 'Sabotage',
    count: 1,
    timing: 'action',
    description: 'When another player plays an action card: Cancel that action card.',
    flavor: 'The Council has ruled that sabotage is only illegal if you get caught.',
    expansion: 'base',
  },
  {
    id: 'sabotage_3',
    name: 'Sabotage',
    count: 1,
    timing: 'action',
    description: 'When another player plays an action card: Cancel that action card.',
    flavor: 'The Council has ruled that sabotage is only illegal if you get caught.',
    expansion: 'base',
  },
  {
    id: 'sabotage_4',
    name: 'Sabotage',
    count: 1,
    timing: 'action',
    description: 'When another player plays an action card: Cancel that action card.',
    flavor: 'The Council has ruled that sabotage is only illegal if you get caught.',
    expansion: 'base',
  },
];

// =============================================================================
// COMBAT CARDS - DIRECT HIT & DAMAGE
// =============================================================================

const COMBAT_DAMAGE_CARDS: ActionCardData[] = [
  {
    id: 'direct_hit_1',
    name: 'Direct Hit',
    count: 1,
    timing: 'combat',
    description: 'After another player\'s ship uses SUSTAIN DAMAGE to cancel a hit produced by your units: Destroy that ship.',
    expansion: 'base',
  },
  {
    id: 'direct_hit_2',
    name: 'Direct Hit',
    count: 1,
    timing: 'combat',
    description: 'After another player\'s ship uses SUSTAIN DAMAGE to cancel a hit produced by your units: Destroy that ship.',
    expansion: 'base',
  },
  {
    id: 'direct_hit_3',
    name: 'Direct Hit',
    count: 1,
    timing: 'combat',
    description: 'After another player\'s ship uses SUSTAIN DAMAGE to cancel a hit produced by your units: Destroy that ship.',
    expansion: 'base',
  },
  {
    id: 'direct_hit_4',
    name: 'Direct Hit',
    count: 1,
    timing: 'combat',
    description: 'After another player\'s ship uses SUSTAIN DAMAGE to cancel a hit produced by your units: Destroy that ship.',
    expansion: 'base',
  },
  {
    id: 'lucky_shot',
    name: 'Lucky Shot',
    count: 1,
    timing: 'action',
    description: 'ACTION: Destroy 1 dreadnought, cruiser, or destroyer in a system that contains your units.',
    expansion: 'base',
  },
  {
    id: 'bunker',
    name: 'Bunker',
    count: 1,
    timing: 'ground_combat',
    description: 'At the start of a ground combat round: Apply -4 to the result of each die roll made by your opponent during this combat round.',
    expansion: 'base',
  },
  {
    id: 'fire_team',
    name: 'Fire Team',
    count: 1,
    timing: 'ground_combat',
    description: 'After your ground forces make combat rolls during a round of ground combat: Reroll any number of your dice.',
    expansion: 'base',
  },
];

// =============================================================================
// COMBAT CARDS - RETREAT & DEFENSE
// =============================================================================

const COMBAT_DEFENSE_CARDS: ActionCardData[] = [
  {
    id: 'skilled_retreat_1',
    name: 'Skilled Retreat',
    count: 1,
    timing: 'combat',
    description: 'At the start of a combat round: Move your ships in the active system to an adjacent system that contains no ships. Then this combat ends.',
    expansion: 'base',
  },
  {
    id: 'skilled_retreat_2',
    name: 'Skilled Retreat',
    count: 1,
    timing: 'combat',
    description: 'At the start of a combat round: Move your ships in the active system to an adjacent system that contains no ships. Then this combat ends.',
    expansion: 'base',
  },
  {
    id: 'skilled_retreat_3',
    name: 'Skilled Retreat',
    count: 1,
    timing: 'combat',
    description: 'At the start of a combat round: Move your ships in the active system to an adjacent system that contains no ships. Then this combat ends.',
    expansion: 'base',
  },
  {
    id: 'skilled_retreat_4',
    name: 'Skilled Retreat',
    count: 1,
    timing: 'combat',
    description: 'At the start of a combat round: Move your ships in the active system to an adjacent system that contains no ships. Then this combat ends.',
    expansion: 'base',
  },
  {
    id: 'emergency_repairs',
    name: 'Emergency Repairs',
    count: 1,
    timing: 'combat',
    description: 'At the start of a combat round: Repair all of your units that have SUSTAIN DAMAGE in the active system.',
    expansion: 'base',
  },
  {
    id: 'shields_holding_1',
    name: 'Shields Holding',
    count: 1,
    timing: 'space_combat',
    description: 'Before you assign hits produced by another player\'s ships during a space combat: Cancel up to 2 hits.',
    expansion: 'base',
  },
  {
    id: 'shields_holding_2',
    name: 'Shields Holding',
    count: 1,
    timing: 'space_combat',
    description: 'Before you assign hits produced by another player\'s ships during a space combat: Cancel up to 2 hits.',
    expansion: 'base',
  },
  {
    id: 'shields_holding_3',
    name: 'Shields Holding',
    count: 1,
    timing: 'space_combat',
    description: 'Before you assign hits produced by another player\'s ships during a space combat: Cancel up to 2 hits.',
    expansion: 'base',
  },
  {
    id: 'shields_holding_4',
    name: 'Shields Holding',
    count: 1,
    timing: 'space_combat',
    description: 'Before you assign hits produced by another player\'s ships during a space combat: Cancel up to 2 hits.',
    expansion: 'base',
  },
];

// =============================================================================
// COMBAT CARDS - MORALE & COMBAT BONUSES
// =============================================================================

const COMBAT_BONUS_CARDS: ActionCardData[] = [
  {
    id: 'morale_boost_1',
    name: 'Morale Boost',
    count: 1,
    timing: 'combat',
    description: 'At the start of a combat round: Apply +1 to the result of each of your unit\'s combat rolls during this combat round.',
    expansion: 'base',
  },
  {
    id: 'morale_boost_2',
    name: 'Morale Boost',
    count: 1,
    timing: 'combat',
    description: 'At the start of a combat round: Apply +1 to the result of each of your unit\'s combat rolls during this combat round.',
    expansion: 'base',
  },
  {
    id: 'morale_boost_3',
    name: 'Morale Boost',
    count: 1,
    timing: 'combat',
    description: 'At the start of a combat round: Apply +1 to the result of each of your unit\'s combat rolls during this combat round.',
    expansion: 'base',
  },
  {
    id: 'morale_boost_4',
    name: 'Morale Boost',
    count: 1,
    timing: 'combat',
    description: 'At the start of a combat round: Apply +1 to the result of each of your unit\'s combat rolls during this combat round.',
    expansion: 'base',
  },
  {
    id: 'courageous_to_the_end',
    name: 'Courageous to the End',
    count: 1,
    timing: 'space_combat',
    description: 'After 1 of your ships is destroyed during a space combat: Roll 2 dice. For each result equal to or greater than that ship\'s combat value, produce 1 hit; your opponent must assign it to 1 of their ships.',
    expansion: 'base',
  },
  {
    id: 'blitz',
    name: 'Blitz',
    count: 1,
    timing: 'invasion',
    description: 'At the start of an invasion: Each of your ground forces may roll 1 additional die during each round of this combat.',
    expansion: 'codex1',
  },
  {
    id: 'parley',
    name: 'Parley',
    count: 1,
    timing: 'invasion',
    description: 'After a player commits ground forces to land on a planet you control: Return those units to that player\'s reinforcements. Then, gain 1 trade good or gain control of the active system\'s planet that contains the most structures.',
    expansion: 'base',
  },
];

// =============================================================================
// TACTICAL CARDS - MOVEMENT & FLANK
// =============================================================================

const TACTICAL_MOVEMENT_CARDS: ActionCardData[] = [
  {
    id: 'flank_speed_1',
    name: 'Flank Speed',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system: Apply +1 to the move value of each of your ships during this tactical action.',
    expansion: 'base',
  },
  {
    id: 'flank_speed_2',
    name: 'Flank Speed',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system: Apply +1 to the move value of each of your ships during this tactical action.',
    expansion: 'base',
  },
  {
    id: 'flank_speed_3',
    name: 'Flank Speed',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system: Apply +1 to the move value of each of your ships during this tactical action.',
    expansion: 'base',
  },
  {
    id: 'flank_speed_4',
    name: 'Flank Speed',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system: Apply +1 to the move value of each of your ships during this tactical action.',
    expansion: 'base',
  },
  {
    id: 'unexpected_action',
    name: 'Unexpected Action',
    count: 1,
    timing: 'action',
    description: 'ACTION: Remove 1 of your command tokens from a system on the game board and return it to your reinforcements.',
    expansion: 'base',
  },
  {
    id: 'in_the_silence_of_space',
    name: 'In the Silence of Space',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system: During this activation, your ships can pass through systems that contain other players\' ships.',
    expansion: 'base',
  },
  {
    id: 'ghost_ship',
    name: 'Ghost Ship',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system: Place 1 destroyer from your reinforcements in that system.',
    expansion: 'base',
  },
];

// =============================================================================
// TACTICAL CARDS - PRODUCTION & DEPLOYMENT
// =============================================================================

const TACTICAL_PRODUCTION_CARDS: ActionCardData[] = [
  {
    id: 'frontline_deployment',
    name: 'Frontline Deployment',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system that contains a planet you control: You may place 3 infantry from your reinforcements on that planet.',
    expansion: 'base',
  },
  {
    id: 'war_machine_1',
    name: 'War Machine',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system that contains 1 or more of your space docks: Apply +4 to the PRODUCTION value of 1 of your space docks in that system.',
    expansion: 'codex1',
  },
  {
    id: 'war_machine_2',
    name: 'War Machine',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system that contains 1 or more of your space docks: Apply +4 to the PRODUCTION value of 1 of your space docks in that system.',
    expansion: 'codex1',
  },
  {
    id: 'war_machine_3',
    name: 'War Machine',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system that contains 1 or more of your space docks: Apply +4 to the PRODUCTION value of 1 of your space docks in that system.',
    expansion: 'codex1',
  },
  {
    id: 'war_machine_4',
    name: 'War Machine',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system that contains 1 or more of your space docks: Apply +4 to the PRODUCTION value of 1 of your space docks in that system.',
    expansion: 'codex1',
  },
  {
    id: 'fighter_prototype',
    name: 'Fighter Prototype',
    count: 1,
    timing: 'tactical',
    description: 'At the start of a combat: Apply +2 to the result of each of your fighters\' combat rolls during this combat. If this is a space combat, apply -1 to each result instead.',
    expansion: 'base',
  },
  {
    id: 'experimental_battlestation',
    name: 'Experimental Battlestation',
    count: 1,
    timing: 'tactical',
    description: 'After another player moves ships into a system that contains 1 or more of your space docks: Your space docks in that system gain SPACE CANNON 5 (x3) until the end of this turn.',
    expansion: 'base',
  },
];

// =============================================================================
// ACTION CARDS - COMPONENT ACTIONS
// =============================================================================

const COMPONENT_ACTION_CARDS: ActionCardData[] = [
  {
    id: 'focused_research',
    name: 'Focused Research',
    count: 1,
    timing: 'action',
    description: 'ACTION: Spend 4 trade goods to research 1 technology.',
    expansion: 'base',
  },
  {
    id: 'mining_initiative',
    name: 'Mining Initiative',
    count: 1,
    timing: 'action',
    description: 'ACTION: Gain trade goods equal to the resource value of 1 planet you control.',
    expansion: 'base',
  },
  {
    id: 'industrial_initiative',
    name: 'Industrial Initiative',
    count: 1,
    timing: 'action',
    description: 'ACTION: Gain 1 trade good for each industrial planet you control.',
    expansion: 'base',
  },
  {
    id: 'signal_jamming',
    name: 'Signal Jamming',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose a non-home system other than Mecatol Rex that contains or is adjacent to 1 of your ships; place a command token from another player\'s reinforcements in that system.',
    expansion: 'base',
  },
  {
    id: 'cripple_defenses',
    name: 'Cripple Defenses',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose a planet. Destroy each PDS on that planet.',
    expansion: 'base',
  },
  {
    id: 'plague',
    name: 'Plague',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose 1 planet in a system that contains 1 or more of your ships. Roll 1 die for each infantry on that planet. For each result of 6 or greater, destroy that infantry.',
    expansion: 'base',
  },
  {
    id: 'reactor_meltdown',
    name: 'Reactor Meltdown',
    count: 1,
    timing: 'action',
    description: 'ACTION: Destroy 1 space dock in a system that contains or is adjacent to 1 of your ships.',
    expansion: 'base',
  },
  {
    id: 'spy',
    name: 'Spy',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose 1 player. That player gives you 1 random action card from their hand.',
    expansion: 'base',
  },
  {
    id: 'insubordination',
    name: 'Insubordination',
    count: 1,
    timing: 'action',
    description: 'ACTION: Remove 1 token from another player\'s fleet pool and return it to their reinforcements.',
    expansion: 'base',
  },
  {
    id: 'unstable_planet',
    name: 'Unstable Planet',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose 1 hazardous planet. Exhaust that planet and destroy up to 3 infantry on it.',
    expansion: 'base',
  },
  {
    id: 'uprising',
    name: 'Uprising',
    count: 1,
    timing: 'action',
    description: 'ACTION: Exhaust 1 planet controlled by another player. Then, gain trade goods equal to its resource value.',
    expansion: 'base',
  },
  {
    id: 'tactical_bombardment',
    name: 'Tactical Bombardment',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose 1 system that contains 1 or more of your units that have BOMBARDMENT. For each of your units in that system that has BOMBARDMENT, use that BOMBARDMENT ability against each planet in that system.',
    expansion: 'base',
  },
  {
    id: 'solar_flare',
    name: 'Solar Flare',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose a system that is adjacent to your home system; during this tactical action, your opponent cannot use space cannon against your ships in the active system.',
    expansion: 'codex1',
  },
  {
    id: 'summit',
    name: 'Summit',
    count: 1,
    timing: 'action',
    description: 'ACTION: Draw 2 action cards.',
    expansion: 'base',
  },
  {
    id: 'war_effort',
    name: 'War Effort',
    count: 1,
    timing: 'action',
    description: 'ACTION: Place 1 cruiser from your reinforcements in a system that contains 1 or more of your ships.',
    expansion: 'base',
  },
  {
    id: 'master_plan',
    name: 'Master Plan',
    count: 1,
    timing: 'action',
    description: 'ACTION: Perform a strategic action. You do not have to have a command token in your strategy pool to perform this action.',
    expansion: 'codex1',
  },
];

// =============================================================================
// COMBAT SPECIAL ABILITY CARDS
// =============================================================================

const COMBAT_SPECIAL_CARDS: ActionCardData[] = [
  {
    id: 'disable',
    name: 'Disable',
    count: 1,
    timing: 'anti_fighter_barrage',
    description: 'At the start of a space combat: Choose 1 of your opponent\'s ships; that ship cannot use its ANTI-FIGHTER BARRAGE ability during this combat.',
    expansion: 'base',
  },
  {
    id: 'scramble_frequency',
    name: 'Scramble Frequency',
    count: 1,
    timing: 'anti_fighter_barrage',
    description: 'After another player makes ANTI-FIGHTER BARRAGE rolls against your fighters: Cancel all hits.',
    expansion: 'codex1',
  },
  {
    id: 'maneuvering_jets_1',
    name: 'Maneuvering Jets',
    count: 1,
    timing: 'space_combat',
    description: 'Before you assign hits produced by another player\'s SPACE CANNON roll: Cancel 1 hit.',
    expansion: 'base',
  },
  {
    id: 'maneuvering_jets_2',
    name: 'Maneuvering Jets',
    count: 1,
    timing: 'space_combat',
    description: 'Before you assign hits produced by another player\'s SPACE CANNON roll: Cancel 1 hit.',
    expansion: 'base',
  },
  {
    id: 'maneuvering_jets_3',
    name: 'Maneuvering Jets',
    count: 1,
    timing: 'space_combat',
    description: 'Before you assign hits produced by another player\'s SPACE CANNON roll: Cancel 1 hit.',
    expansion: 'base',
  },
  {
    id: 'maneuvering_jets_4',
    name: 'Maneuvering Jets',
    count: 1,
    timing: 'space_combat',
    description: 'Before you assign hits produced by another player\'s SPACE CANNON roll: Cancel 1 hit.',
    expansion: 'base',
  },
  {
    id: 'counterstroke',
    name: 'Counterstroke',
    count: 1,
    timing: 'tactical',
    description: 'After another player activates a system that contains your ships: Remove one of your command tokens from the board and add it to your fleet pool.',
    expansion: 'codex1',
  },
];

// =============================================================================
// AGENDA PHASE CARDS
// =============================================================================

const AGENDA_PHASE_CARDS: ActionCardData[] = [
  {
    id: 'veto',
    name: 'Veto',
    count: 1,
    timing: 'agenda',
    description: 'When an agenda is revealed: Discard that agenda and reveal 1 agenda from the top of the deck. Players vote on this agenda instead.',
    expansion: 'base',
  },
  {
    id: 'confusing_legal_text',
    name: 'Confusing Legal Text',
    count: 1,
    timing: 'agenda',
    description: 'When an agenda is revealed: Choose 1 outcome of that agenda. If that outcome is resolved, resolve it as if it were the other outcome instead.',
    expansion: 'base',
  },
  {
    id: 'bribery',
    name: 'Bribery',
    count: 1,
    timing: 'agenda',
    description: 'After the speaker votes on an agenda: Spend any number of trade goods. For each trade good spent, cast 1 additional vote for any outcome.',
    expansion: 'base',
  },
  {
    id: 'distinguished_councilor',
    name: 'Distinguished Councilor',
    count: 1,
    timing: 'agenda',
    description: 'After you cast votes on an agenda: Cast 5 additional votes for any outcome.',
    expansion: 'base',
  },
  {
    id: 'political_stability',
    name: 'Political Stability',
    count: 1,
    timing: 'agenda',
    description: 'When you would return your strategy cards during the status phase: Instead, keep any number of them for the next game round.',
    expansion: 'base',
  },
  {
    id: 'public_disgrace',
    name: 'Public Disgrace',
    count: 1,
    timing: 'action',
    description: 'When another player replenishes commodities: That player does not replenish commodities.',
    expansion: 'base',
  },
  {
    id: 'reparations',
    name: 'Reparations',
    count: 1,
    timing: 'agenda',
    description: 'At the start of the agenda phase: Draw 1 action card for each law in play.',
    expansion: 'base',
  },
  {
    id: 'repeal_law',
    name: 'Repeal Law',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: Discard 1 law from play.',
    expansion: 'base',
  },
  {
    id: 'sanctions',
    name: 'Sanctions',
    count: 1,
    timing: 'agenda',
    description: 'When you cast votes: Each other player must give you 1 trade good, or abstain from voting on this agenda.',
    expansion: 'codex2',
  },
];

// =============================================================================
// RIDER CARDS (Agenda Phase)
// =============================================================================

const RIDER_CARDS: ActionCardData[] = [
  {
    id: 'imperial_rider',
    name: 'Imperial Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, gain 1 victory point.',
    expansion: 'base',
  },
  {
    id: 'construction_rider',
    name: 'Construction Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, place 1 PDS or 1 space dock from your reinforcements on a planet you control.',
    expansion: 'base',
  },
  {
    id: 'diplomacy_rider',
    name: 'Diplomacy Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, choose 1 system that contains a planet you control. Each other player places a command token from their reinforcements in that system.',
    expansion: 'base',
  },
  {
    id: 'leadership_rider',
    name: 'Leadership Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, gain 3 command tokens.',
    expansion: 'base',
  },
  {
    id: 'politics_rider',
    name: 'Politics Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, draw 3 action cards and become the speaker.',
    expansion: 'base',
  },
  {
    id: 'technology_rider',
    name: 'Technology Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, research 1 technology.',
    expansion: 'base',
  },
  {
    id: 'trade_rider',
    name: 'Trade Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, gain 5 trade goods.',
    expansion: 'base',
  },
  {
    id: 'warfare_rider',
    name: 'Warfare Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, place 1 cruiser, 1 destroyer, and 1 fighter from your reinforcements in a system that contains 1 or more of your ships.',
    expansion: 'base',
  },
];

// =============================================================================
// STRATEGY PHASE / STRATEGY CARD CARDS
// =============================================================================

const STRATEGY_CARDS: ActionCardData[] = [
  {
    id: 'tech_sabotage',
    name: 'Tech Sabotage',
    count: 1,
    timing: 'action',
    description: 'When 1 or more of another player\'s units use PRODUCTION: Reduce the PRODUCTION value of each of their units by 4 for this use of PRODUCTION.',
    expansion: 'codex2',
  },
  {
    id: 'resist_strategy',
    name: 'Resist Strategy',
    count: 1,
    timing: 'action',
    description: 'When another player uses a strategy card: You cannot resolve the secondary ability of that strategy card; gain 1 trade good and 1 command token.',
    expansion: 'codex2',
  },
];

// =============================================================================
// MISCELLANEOUS CARDS
// =============================================================================

const MISC_CARDS: ActionCardData[] = [
  // Missing base game cards
  {
    id: 'assassinate_representative',
    name: 'Assassinate Representative',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: Choose a player; that player cannot vote on this agenda.',
    expansion: 'base',
  },
  {
    id: 'economic_initiative',
    name: 'Economic Initiative',
    count: 1,
    timing: 'action',
    description: 'ACTION: Ready each of your cultural planets.',
    expansion: 'base',
  },
  {
    id: 'lost_star_chart',
    name: 'Lost Star Chart',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system: During this activation, you may move ships through systems that contain other players\' ships.',
    expansion: 'base',
  },
  {
    id: 'upgrade',
    name: 'Upgrade',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose 1 system that contains your units. Replace each of your cruisers in that system with dreads from your reinforcements.',
    expansion: 'base',
  },
  // Codex I cards in MISC_CARDS
  {
    id: 'ghost_squad',
    name: 'Ghost Squad',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose a planet other than Mecatol Rex that has no structures; place 1 infantry from your reinforcements on that planet.',
    expansion: 'codex1',
  },
  {
    id: 'harness_energy',
    name: 'Harness Energy',
    count: 1,
    timing: 'action',
    description: 'ACTION: Gain 1 trade good for each planet you control that has at least 1 unit on it.',
    expansion: 'codex1',
  },
  {
    id: 'infiltrate',
    name: 'Infiltrate',
    count: 1,
    timing: 'combat',
    description: 'After you commit ground forces to land on a planet: Choose up to 2 infantry on that planet; those units do not participate in ground combat.',
    expansion: 'base',
  },
  {
    id: 'probe',
    name: 'Probe',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose 1 player; look at that player\'s hand of action cards.',
    expansion: 'codex2',
  },
  {
    id: 'rise_of_a_messiah',
    name: 'Rise of a Messiah',
    count: 1,
    timing: 'action',
    description: 'ACTION: Place 1 infantry from your reinforcements on each planet you control.',
    expansion: 'base',
  },
  {
    id: 'fighter_conscription',
    name: 'Fighter Conscription',
    count: 1,
    timing: 'action',
    description: 'ACTION: Place 1 fighter from your reinforcements in each system that contains 1 or more of your ships that has capacity.',
    expansion: 'codex1',
  },
];

// =============================================================================
// POK ACTION CARDS
// =============================================================================

const POK_ACTION_CARDS: ActionCardData[] = [
  // Combat Cards
  {
    id: 'waylay',
    name: 'Waylay',
    count: 1,
    timing: 'space_combat',
    description: 'At the start of a space combat in which you are the defender: Your opponent cannot retreat during the ANNOUNCE RETREATS step of this combat.',
    expansion: 'pok',
  },
  {
    id: 'decoy_operation',
    name: 'Decoy Operation',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system: During this tactical action, you may swap the positions of 1 of your ships with capacity with 1 of your other ships that is being transported by that ship.',
    expansion: 'pok',
  },
  {
    id: 'intercept',
    name: 'Intercept',
    count: 1,
    timing: 'tactical',
    description: 'After a player activates a system that contains 1 or more of your ships: Place 1 destroyer from your reinforcements in that system.',
    expansion: 'base',
  },
  {
    id: 'rally',
    name: 'Rally',
    count: 1,
    timing: 'action',
    description: 'ACTION: Place 2 fighters from your reinforcements in a system that contains 1 or more of your ships with capacity.',
    expansion: 'codex1',
  },
  // Exploration/Relic Cards
  {
    id: 'seize_artifact',
    name: 'Seize Artifact',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose 1 of your neighbors that has 1 or more relic fragments; that player gives you 1 of their relic fragments of your choice.',
    expansion: 'pok',
  },
  {
    id: 'ancient_burial_sites',
    name: 'Ancient Burial Sites',
    count: 1,
    timing: 'action',
    description: 'ACTION: Exhaust 1 planet you control to gain 1 trade good or draw 1 action card.',
    expansion: 'base',
  },
  {
    id: 'salvage',
    name: 'Salvage',
    count: 1,
    timing: 'combat',
    description: 'After you win a space combat: Choose 1 of your opponent\'s non-fighter ships that was destroyed during the combat and place it in the space area of the active system; that ship is now yours.',
    expansion: 'base',
  },
  // Agenda Cards
  {
    id: 'deadly_plot',
    name: 'Deadly Plot',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: Choose 1 player; if that player does not cast at least 4 votes on this agenda, they cannot research technology this game round.',
    expansion: 'pok',
  },
  {
    id: 'emergency_meeting',
    name: 'Emergency Meeting',
    count: 1,
    timing: 'agenda',
    description: 'At the start of the first agenda this agenda phase: Do not reveal an agenda from the top of the deck. Instead, you may resolve the outcome of an agenda that matches a law in play without voting.',
    expansion: 'codex2',
  },
  {
    id: 'hack_election',
    name: 'Hack Election',
    count: 1,
    timing: 'agenda',
    description: 'When votes are being counted: Exchange the vote totals of 2 outcomes.',
    expansion: 'codex1',
  },
  // Tactical Cards
  {
    id: 'boarding_party',
    name: 'Boarding Party',
    count: 1,
    timing: 'space_combat',
    description: 'At the start of a space combat: Choose 1 of your opponent\'s non-fighter ships; replace that ship with a ship of the same type from your reinforcements if able.',
    expansion: 'codex2',
  },
  {
    id: 'scuttle',
    name: 'Scuttle',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose 1 non-fighter ship you control; destroy that ship to place an equal number of trade goods on this card. You may spend these trade goods as if they were in your trade good area.',
    expansion: 'pok',
  },
  {
    id: 'forward_supply_base',
    name: 'Forward Supply Base',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose 1 planet that contains 1 or more of your ground forces; gain trade goods equal to the combined resource value of your exhausted planets.',
    expansion: 'codex1',
  },
  // Leader Cards
  {
    id: 'coup_detat',
    name: 'Coup d\'Etat',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose 1 player other than the speaker; that player becomes the speaker. Then, exhaust each planet you control.',
    expansion: 'pok',
  },
  // Riders (PoK additions)
  {
    id: 'sanction_rider',
    name: 'Sanction Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, the player who voted most against the chosen outcome loses 2 command tokens.',
    expansion: 'codex3',
  },
  {
    id: 'keleres_rider',
    name: 'Keleres Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, choose 1 non-home planet controlled by another player; gain control of that planet.',
    expansion: 'codex3',
  },
  // =========================================================================
  // MISSING POK CARDS (Added January 2026)
  // =========================================================================
  // Exploration Cards
  {
    id: 'archaeological_expedition',
    name: 'Archaeological Expedition',
    count: 1,
    timing: 'action',
    description: 'ACTION: Reveal the top 3 cards of an exploration deck that matches a planet you control; gain any relic fragments that you reveal and discard the rest.',
    expansion: 'pok',
  },
  {
    id: 'exploration_probe',
    name: 'Exploration Probe',
    count: 1,
    timing: 'action',
    description: 'ACTION: Explore a frontier token that is in or adjacent to a system that contains 1 or more of your ships.',
    expansion: 'pok',
  },
  // Agenda Cards
  {
    id: 'confounding_legal_text',
    name: 'Confounding Legal Text',
    count: 1,
    timing: 'agenda',
    description: 'After another player is elected as the outcome of an agenda: You are the elected player instead.',
    expansion: 'pok',
  },
  {
    id: 'diplomatic_pressure_1',
    name: 'Diplomatic Pressure',
    count: 1,
    timing: 'agenda',
    description: 'When an agenda is revealed: Choose another player; that player must give you 1 promissory note from their hand.',
    expansion: 'pok',
  },
  {
    id: 'diplomatic_pressure_2',
    name: 'Diplomatic Pressure',
    count: 1,
    timing: 'agenda',
    description: 'When an agenda is revealed: Choose another player; that player must give you 1 promissory note from their hand.',
    expansion: 'pok',
  },
  {
    id: 'diplomatic_pressure_3',
    name: 'Diplomatic Pressure',
    count: 1,
    timing: 'agenda',
    description: 'When an agenda is revealed: Choose another player; that player must give you 1 promissory note from their hand.',
    expansion: 'pok',
  },
  {
    id: 'diplomatic_pressure_4',
    name: 'Diplomatic Pressure',
    count: 1,
    timing: 'agenda',
    description: 'When an agenda is revealed: Choose another player; that player must give you 1 promissory note from their hand.',
    expansion: 'pok',
  },
  // Technology/Research Cards
  {
    id: 'divert_funding',
    name: 'Divert Funding',
    count: 1,
    timing: 'action',
    description: 'ACTION: Return 1 of your non-unit upgrade, non-faction technologies to your technology deck, then research 1 technology. You must still meet the prerequisites for the technology you research.',
    expansion: 'pok',
  },
  {
    id: 'reveal_prototype',
    name: 'Reveal Prototype',
    count: 1,
    timing: 'space_combat',
    description: 'At the start of a combat: Spend 4 resources to research 1 unit upgrade technology of the same type as 1 of your units that is participating in this combat.',
    expansion: 'pok',
  },
  {
    id: 'reverse_engineer',
    name: 'Reverse Engineer',
    count: 1,
    timing: 'action',
    description: 'When an action card is discarded from play: Take that action card from the discard pile.',
    expansion: 'pok',
  },
  // Tactical/Movement Cards
  {
    id: 'nav_suite',
    name: 'Nav Suite',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system: During the "Movement" step of this tactical action, ignore the effects of anomalies.',
    expansion: 'pok',
  },
  {
    id: 'rout',
    name: 'Rout',
    count: 1,
    timing: 'space_combat',
    description: 'At the start of a combat round: Your opponent must announce a retreat during the "Announce Retreats" step of this combat round, if able.',
    expansion: 'pok',
  },
  // Unit/Infantry Cards
  {
    id: 'refit_troops',
    name: 'Refit Troops',
    count: 1,
    timing: 'action',
    description: 'ACTION: Replace up to 2 of your infantry on the game board with mechs from your reinforcements.',
    expansion: 'pok',
  },
  // Strategy Phase Cards
  {
    id: 'manipulate_investments',
    name: 'Manipulate Investments',
    count: 1,
    timing: 'status',
    description: 'At the start of the strategy phase: Place a total of up to 5 trade goods from the supply on any number of strategy cards. When a player chooses a strategy card that contains trade goods, that player gains those trade goods.',
    expansion: 'pok',
  },
];

// =============================================================================
// CODEX I ACTION CARDS (Additional - some Codex I cards are in other sections)
// =============================================================================

const CODEX1_ACTION_CARDS: ActionCardData[] = [
  {
    id: 'impersonation',
    name: 'Impersonation',
    count: 1,
    timing: 'action',
    description: 'ACTION: Spend 3 influence to draw 1 secret objective.',
    expansion: 'codex1',
  },
  {
    id: 'insider_information',
    name: 'Insider Information',
    count: 1,
    timing: 'agenda',
    description: 'After the speaker votes on an agenda: Look at the top 2 cards of the agenda deck. Place them on the top or bottom of the deck in any order.',
    expansion: 'codex1',
  },
  {
    id: 'plagiarize',
    name: 'Plagiarize',
    count: 1,
    timing: 'action',
    description: 'ACTION: Spend 5 influence to research 1 technology that 1 of your neighbors has. You ignore prerequisites.',
    expansion: 'codex1',
  },
  {
    id: 'reflective_shielding',
    name: 'Reflective Shielding',
    count: 1,
    timing: 'space_combat',
    description: 'At the start of a round of space combat: For each hit your opponent produces against your ships this combat round, your opponent destroys 1 of their fighters, if able.',
    expansion: 'codex1',
  },
  {
    id: 'sanction',
    name: 'Sanction',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: Choose a player. That player cannot vote on this agenda and cannot cast votes using abilities.',
    expansion: 'codex1',
  },
];

// =============================================================================
// THUNDER'S EDGE ACTION CARDS (20 cards - 14 unique)
// =============================================================================

const THUNDERS_EDGE_CARDS: ActionCardData[] = [
  // Single copies (12)
  {
    id: 'black_market_dealings',
    name: 'Black Market Dealings',
    count: 1,
    timing: 'action',
    description: 'When you are negotiating a transaction with a player: You may include relics, action cards, and unscored secret objectives in that transaction.',
    expansion: 'thunders_edge',
  },
  {
    id: 'brillance',
    name: 'Brillance',
    count: 1,
    timing: 'action',
    description: "ACTION: Ready a planet you control that has a technology specialty, OR choose a player; you may use that player's breakthrough ability until the end of the round.",
    expansion: 'thunders_edge',
  },
  {
    id: 'crash_landing',
    name: 'Crash Landing',
    count: 1,
    timing: 'combat',
    description: 'When your last ship in the active system is destroyed: Place 1 of your ground forces from the space area of the active system onto a planet in that system.',
    expansion: 'thunders_edge',
  },
  {
    id: 'crisis',
    name: 'Crisis',
    count: 1,
    timing: 'action',
    description: "At the end of any player's turn, if 2 or more players have not passed: Skip the next player's turn.",
    expansion: 'thunders_edge',
  },
  {
    id: 'exchange_program',
    name: 'Exchange Program',
    count: 1,
    timing: 'action',
    description: 'ACTION: You and another player may agree to each place 1 infantry from your reinforcements in coexistence on a planet that player controls.',
    expansion: 'thunders_edge',
  },
  {
    id: 'extreme_duress',
    name: 'Extreme Duress',
    count: 1,
    timing: 'action',
    description: "At the start of another player's turn, if you have a readied strategy card: That player's first action this turn must be a strategic action. If it is not, that player discards all of their action cards and trade goods.",
    expansion: 'thunders_edge',
  },
  {
    id: 'lie_in_wait',
    name: 'Lie in Wait',
    count: 1,
    timing: 'action',
    description: "After 2 of your neighbors resolve a transaction: Look at each of those players' hands of action cards, then choose and take 1 action card from each.",
    expansion: 'thunders_edge',
  },
  {
    id: 'mercenary_contract',
    name: 'Mercenary Contract',
    count: 1,
    timing: 'action',
    description: 'ACTION: Spend 2 trade goods to place 2 neutral infantry on a non-home planet.',
    expansion: 'thunders_edge',
  },
  {
    id: 'pirate_fleet',
    name: 'Pirate Fleet',
    count: 1,
    timing: 'action',
    description: "ACTION: Spend 3 resources to place 1 neutral carrier with 2 neutral fighters and 1 neutral destroyer in a non-home system that does not contain another player's ships.",
    expansion: 'thunders_edge',
  },
  {
    id: 'puppets_on_a_string',
    name: 'Puppets on a String',
    count: 1,
    timing: 'action',
    description: 'At the end of your turn, if you have passed: Perform 1 additional action.',
    expansion: 'thunders_edge',
  },
  {
    id: 'rescue',
    name: 'Rescue',
    count: 1,
    timing: 'tactical',
    description: 'After another player moves ships into a system: Move 1 of your ships from an adjacent system into the active system.',
    expansion: 'thunders_edge',
  },
  {
    id: 'overrule',
    name: 'Overrule',
    count: 1,
    timing: 'action',
    description: 'ACTION: Perform the primary ability of a readied strategy card that was not chosen this round, or of an unchosen strategy card.',
    expansion: 'thunders_edge',
  },
  // Multiple copies - Pirate Contract (4)
  {
    id: 'pirate_contract_1',
    name: 'Pirate Contract',
    count: 1,
    timing: 'action',
    description: 'ACTION: Place 1 neutral destroyer in a non-home system that does not contain non-neutral ships.',
    expansion: 'thunders_edge',
  },
  {
    id: 'pirate_contract_2',
    name: 'Pirate Contract',
    count: 1,
    timing: 'action',
    description: 'ACTION: Place 1 neutral destroyer in a non-home system that does not contain non-neutral ships.',
    expansion: 'thunders_edge',
  },
  {
    id: 'pirate_contract_3',
    name: 'Pirate Contract',
    count: 1,
    timing: 'action',
    description: 'ACTION: Place 1 neutral destroyer in a non-home system that does not contain non-neutral ships.',
    expansion: 'thunders_edge',
  },
  {
    id: 'pirate_contract_4',
    name: 'Pirate Contract',
    count: 1,
    timing: 'action',
    description: 'ACTION: Place 1 neutral destroyer in a non-home system that does not contain non-neutral ships.',
    expansion: 'thunders_edge',
  },
  // Multiple copies - Strategize (4)
  {
    id: 'strategize_1',
    name: 'Strategize',
    count: 1,
    timing: 'action',
    description: 'ACTION: Perform the secondary ability of a readied strategy card you have, or of an unchosen strategy card, without spending a command token.',
    expansion: 'thunders_edge',
  },
  {
    id: 'strategize_2',
    name: 'Strategize',
    count: 1,
    timing: 'action',
    description: 'ACTION: Perform the secondary ability of a readied strategy card you have, or of an unchosen strategy card, without spending a command token.',
    expansion: 'thunders_edge',
  },
  {
    id: 'strategize_3',
    name: 'Strategize',
    count: 1,
    timing: 'action',
    description: 'ACTION: Perform the secondary ability of a readied strategy card you have, or of an unchosen strategy card, without spending a command token.',
    expansion: 'thunders_edge',
  },
  {
    id: 'strategize_4',
    name: 'Strategize',
    count: 1,
    timing: 'action',
    description: 'ACTION: Perform the secondary ability of a readied strategy card you have, or of an unchosen strategy card, without spending a command token.',
    expansion: 'thunders_edge',
  },
];

// =============================================================================
// ALL ACTION CARDS COMBINED
// =============================================================================

export const ACTION_CARDS: ActionCardData[] = [
  ...SABOTAGE_CARDS,
  ...COMBAT_DAMAGE_CARDS,
  ...COMBAT_DEFENSE_CARDS,
  ...COMBAT_BONUS_CARDS,
  ...TACTICAL_MOVEMENT_CARDS,
  ...TACTICAL_PRODUCTION_CARDS,
  ...COMPONENT_ACTION_CARDS,
  ...COMBAT_SPECIAL_CARDS,
  ...AGENDA_PHASE_CARDS,
  ...RIDER_CARDS,
  ...STRATEGY_CARDS,
  ...MISC_CARDS,
  ...POK_ACTION_CARDS,
  ...CODEX1_ACTION_CARDS,
  ...THUNDERS_EDGE_CARDS,
];

// =============================================================================
// HELPER MAPS FOR QUICK LOOKUP
// =============================================================================

export const ACTION_CARDS_BY_ID: Record<string, ActionCardData> = Object.fromEntries(
  ACTION_CARDS.map(card => [card.id, card])
);

export const ACTION_CARDS_BY_TIMING: Record<ActionCardTiming, ActionCardData[]> = ACTION_CARDS.reduce(
  (acc, card) => {
    if (!acc[card.timing]) {
      acc[card.timing] = [];
    }
    acc[card.timing].push(card);
    return acc;
  },
  {} as Record<ActionCardTiming, ActionCardData[]>
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all action cards for a specific timing window
 */
export function getActionCardsByTiming(timing: ActionCardTiming): ActionCardData[] {
  return ACTION_CARDS_BY_TIMING[timing] || [];
}

/**
 * Check if a card is a Sabotage card
 */
export function isSabotageCard(cardId: string): boolean {
  return cardId.startsWith('sabotage_');
}

/**
 * Check if a card is a Rider card
 */
export function isRiderCard(cardId: string): boolean {
  return cardId.endsWith('_rider');
}

/**
 * Get the base name of a card (without number suffix)
 */
export function getCardBaseName(cardId: string): string {
  return cardId.replace(/_\d+$/, '');
}

/**
 * Get all unique card types (by base name)
 */
export function getUniqueCardTypes(): string[] {
  const baseNames = new Set(ACTION_CARDS.map(card => getCardBaseName(card.id)));
  return Array.from(baseNames);
}

/**
 * Get the set of expansions that should be included based on enabled expansions.
 * This handles the hierarchical nature of expansions:
 * - 'base' is always included
 * - 'pok' includes base + pok content
 * - 'codex1' through 'codex4' are additive (require explicit enabling)
 * - 'thunders_edge' includes all codex content
 *
 * @param enabledExpansions - Array of explicitly enabled expansions
 * @returns Set of all expansions whose content should be included
 */
export function getEffectiveExpansions(enabledExpansions: Expansion[]): Set<Expansion> {
  const effective = new Set<Expansion>(['base']); // Base is always included

  for (const exp of enabledExpansions) {
    effective.add(exp);

    // Thunder's Edge includes all codex content
    if (exp === 'thunders_edge') {
      effective.add('codex1');
      effective.add('codex2');
      effective.add('codex3');
      effective.add('codex4');
    }
  }

  return effective;
}

/**
 * Create the initial action card deck for a game based on enabled expansions.
 * Returns array of card IDs to shuffle.
 *
 * Card counts by expansion:
 * - Base Game: 80 cards
 * - Prophecy of Kings: +20 cards (100 total)
 * - Codex I: +20 cards (120 total)
 * - Thunder's Edge: +20 cards (140 total)
 *
 * @param expansions - Array of enabled expansions (e.g., ['base', 'pok'])
 * @returns Array of card IDs for the deck
 */
export function createActionCardDeck(expansions: Expansion[] = ['base']): string[] {
  const effectiveExpansions = getEffectiveExpansions(expansions);
  const deck: string[] = [];

  for (const card of ACTION_CARDS) {
    if (effectiveExpansions.has(card.expansion)) {
      deck.push(card.id);
    }
  }

  return deck;
}

/**
 * Get action card count for specific expansions
 */
export function getActionCardCountForExpansions(expansions: Expansion[]): number {
  const effectiveExpansions = getEffectiveExpansions(expansions);
  return ACTION_CARDS.filter(card => effectiveExpansions.has(card.expansion)).length;
}

/**
 * Get total count of all action cards
 */
export function getActionCardCount(): number {
  return ACTION_CARDS.reduce((sum, card) => sum + card.count, 0);
}

/**
 * Get cards that can be played as component actions
 */
export function getComponentActionCards(): ActionCardData[] {
  return ACTION_CARDS.filter(card =>
    card.description.toUpperCase().startsWith('ACTION:')
  );
}

/**
 * Get cards that can be played during combat
 */
export function getCombatActionCards(): ActionCardData[] {
  const combatTimings: ActionCardTiming[] = [
    'combat',
    'space_combat',
    'ground_combat',
    'anti_fighter_barrage',
    'bombardment',
    'invasion',
  ];
  return ACTION_CARDS.filter(card => combatTimings.includes(card.timing));
}
