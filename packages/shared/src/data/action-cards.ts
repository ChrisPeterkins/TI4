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
    expansion: 'base',
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
    expansion: 'base',
  },
  {
    id: 'war_machine_2',
    name: 'War Machine',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system that contains 1 or more of your space docks: Apply +4 to the PRODUCTION value of 1 of your space docks in that system.',
    expansion: 'base',
  },
  {
    id: 'war_machine_3',
    name: 'War Machine',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system that contains 1 or more of your space docks: Apply +4 to the PRODUCTION value of 1 of your space docks in that system.',
    expansion: 'base',
  },
  {
    id: 'war_machine_4',
    name: 'War Machine',
    count: 1,
    timing: 'tactical',
    description: 'After you activate a system that contains 1 or more of your space docks: Apply +4 to the PRODUCTION value of 1 of your space docks in that system.',
    expansion: 'base',
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
    expansion: 'base',
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
    expansion: 'base',
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
    expansion: 'base',
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
    id: 'counterstroke',
    name: 'Counterstroke',
    count: 1,
    timing: 'tactical',
    description: 'After another player activates a system that contains your ships: Remove one of your command tokens from the board and add it to your fleet pool.',
    expansion: 'base',
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
    expansion: 'base',
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
    expansion: 'base',
  },
  {
    id: 'resist_strategy',
    name: 'Resist Strategy',
    count: 1,
    timing: 'action',
    description: 'When another player uses a strategy card: You cannot resolve the secondary ability of that strategy card; gain 1 trade good and 1 command token.',
    expansion: 'base',
  },
];

// =============================================================================
// MISCELLANEOUS CARDS
// =============================================================================

const MISC_CARDS: ActionCardData[] = [
  {
    id: 'ghost_squad',
    name: 'Ghost Squad',
    count: 1,
    timing: 'action',
    description: 'ACTION: Choose a planet other than Mecatol Rex that has no structures; place 1 infantry from your reinforcements on that planet.',
    expansion: 'base',
  },
  {
    id: 'harness_energy',
    name: 'Harness Energy',
    count: 1,
    timing: 'action',
    description: 'ACTION: Gain 1 trade good for each planet you control that has at least 1 unit on it.',
    expansion: 'base',
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
    expansion: 'base',
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
    id: 'reveal_prototype_1',
    name: 'Reveal Prototype',
    count: 1,
    timing: 'action',
    description: 'After you produce a unit using a space dock: Replace that unit with a unit of the same type that has SUSTAIN DAMAGE.',
    expansion: 'base',
  },
  {
    id: 'reveal_prototype_2',
    name: 'Reveal Prototype',
    count: 1,
    timing: 'action',
    description: 'After you produce a unit using a space dock: Replace that unit with a unit of the same type that has SUSTAIN DAMAGE.',
    expansion: 'base',
  },
  {
    id: 'fighter_conscription',
    name: 'Fighter Conscription',
    count: 1,
    timing: 'action',
    description: 'ACTION: Place 1 fighter from your reinforcements in each system that contains 1 or more of your ships that has capacity.',
    expansion: 'base',
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
    expansion: 'pok',
  },
  {
    id: 'rally',
    name: 'Rally',
    count: 1,
    timing: 'action',
    description: 'ACTION: Place 2 fighters from your reinforcements in a system that contains 1 or more of your ships with capacity.',
    expansion: 'pok',
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
    description: 'Before you explore a planet: Gain 1 relic fragment of the same trait as that planet.',
    expansion: 'pok',
  },
  {
    id: 'salvage',
    name: 'Salvage',
    count: 1,
    timing: 'combat',
    description: 'After you win a space combat: Choose 1 of your opponent\'s non-fighter ships that was destroyed during the combat and place it in the space area of the active system; that ship is now yours.',
    expansion: 'pok',
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
    expansion: 'pok',
  },
  {
    id: 'hack_election',
    name: 'Hack Election',
    count: 1,
    timing: 'agenda',
    description: 'When votes are being counted: Exchange the vote totals of 2 outcomes.',
    expansion: 'pok',
  },
  // Tactical Cards
  {
    id: 'boarding_party',
    name: 'Boarding Party',
    count: 1,
    timing: 'space_combat',
    description: 'At the start of a space combat: Choose 1 of your opponent\'s non-fighter ships; replace that ship with a ship of the same type from your reinforcements if able.',
    expansion: 'pok',
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
    expansion: 'pok',
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
    expansion: 'pok',
  },
  {
    id: 'keleres_rider',
    name: 'Keleres Rider',
    count: 1,
    timing: 'agenda',
    description: 'After an agenda is revealed: You cannot vote on this agenda. Predict an outcome of this agenda. If your prediction is correct, choose 1 non-home planet controlled by another player; gain control of that planet.',
    expansion: 'pok',
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
 * Create the initial action card deck for a game
 * Returns array of card IDs to shuffle
 */
export function createActionCardDeck(expansion: Expansion = 'base'): string[] {
  const deck: string[] = [];
  for (const card of ACTION_CARDS) {
    if (card.expansion === expansion || card.expansion === 'base') {
      deck.push(card.id);
    }
  }
  return deck;
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
