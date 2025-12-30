import type { ObjectiveData } from '../types/static-data.js';

/**
 * All TI4 Objective Cards
 * Includes Base Game and Prophecy of Kings expansion
 */

// =============================================================================
// STAGE I PUBLIC OBJECTIVES (1 VP each)
// =============================================================================

export const STAGE_I_OBJECTIVES: ObjectiveData[] = [
  // Base Game
  {
    id: 'corner_the_market',
    name: 'Corner the Market',
    type: 'stage1',
    points: 1,
    description: 'Control 4 planets that each have the same planet trait.',
    requirement: {
      type: 'control_trait',
      value: 4,
    },
    expansion: 'base',
  },
  {
    id: 'develop_weaponry',
    name: 'Develop Weaponry',
    type: 'stage1',
    points: 1,
    description: 'Own 2 unit upgrade technologies.',
    requirement: {
      type: 'technology_count',
      value: 2,
      customCheck: 'unit_upgrades',
    },
    expansion: 'base',
  },
  {
    id: 'diversify_research',
    name: 'Diversify Research',
    type: 'stage1',
    points: 1,
    description: 'Own 2 technologies in each of 2 colors.',
    requirement: {
      type: 'technology_colors',
      value: 2,
      techColors: ['red', 'blue', 'green', 'yellow'], // Need 2 in any 2 colors
    },
    expansion: 'base',
  },
  {
    id: 'erect_a_monument',
    name: 'Erect a Monument',
    type: 'stage1',
    points: 1,
    description: 'Spend 8 resources.',
    requirement: {
      type: 'spend_resources',
      value: 8,
    },
    expansion: 'base',
  },
  {
    id: 'expand_borders',
    name: 'Expand Borders',
    type: 'stage1',
    points: 1,
    description: 'Control 6 planets in non-home systems.',
    requirement: {
      type: 'control_planets',
      value: 6,
      customCheck: 'non_home_systems',
    },
    expansion: 'base',
  },
  {
    id: 'found_research_outposts',
    name: 'Found Research Outposts',
    type: 'stage1',
    points: 1,
    description: 'Control 3 planets that have technology specialties.',
    requirement: {
      type: 'control_planets',
      value: 3,
      customCheck: 'tech_specialty',
    },
    expansion: 'base',
  },
  {
    id: 'intimidate_council',
    name: 'Intimidate Council',
    type: 'stage1',
    points: 1,
    description: 'Have 1 or more ships in 2 systems that are adjacent to Mecatol Rex.',
    requirement: {
      type: 'custom',
      value: 2,
      customCheck: 'ships_adjacent_mecatol',
    },
    expansion: 'base',
  },
  {
    id: 'lead_from_the_front',
    name: 'Lead from the Front',
    type: 'stage1',
    points: 1,
    description: 'Spend a total of 3 tokens from your tactic and/or strategy pools.',
    requirement: {
      type: 'custom',
      value: 3,
      customCheck: 'spend_tokens',
    },
    expansion: 'base',
  },
  {
    id: 'negotiate_trade_routes',
    name: 'Negotiate Trade Routes',
    type: 'stage1',
    points: 1,
    description: 'Spend 5 trade goods.',
    requirement: {
      type: 'custom',
      value: 5,
      customCheck: 'spend_trade_goods',
    },
    expansion: 'base',
  },
  {
    id: 'sway_the_council',
    name: 'Sway the Council',
    type: 'stage1',
    points: 1,
    description: 'Spend 8 influence.',
    requirement: {
      type: 'spend_influence',
      value: 8,
    },
    expansion: 'base',
  },

  // Prophecy of Kings
  {
    id: 'amass_wealth',
    name: 'Amass Wealth',
    type: 'stage1',
    points: 1,
    description: 'Spend 3 influence, 3 resources, and 3 trade goods.',
    requirement: {
      type: 'custom',
      value: 3,
      customCheck: 'spend_mixed_3_3_3',
    },
    expansion: 'pok',
  },
  {
    id: 'build_defenses',
    name: 'Build Defenses',
    type: 'stage1',
    points: 1,
    description: 'Have 4 or more structures.',
    requirement: {
      type: 'structure_count',
      value: 4,
    },
    expansion: 'pok',
  },
  {
    id: 'discover_lost_outposts',
    name: 'Discover Lost Outposts',
    type: 'stage1',
    points: 1,
    description: 'Control 2 planets that have attachments.',
    requirement: {
      type: 'control_planets',
      value: 2,
      customCheck: 'with_attachments',
    },
    expansion: 'pok',
  },
  {
    id: 'engineer_a_marvel',
    name: 'Engineer a Marvel',
    type: 'stage1',
    points: 1,
    description: 'Have your flagship or a war sun on the game board.',
    requirement: {
      type: 'unit_count',
      value: 1,
      unitTypes: ['flagship', 'war_sun'],
    },
    expansion: 'pok',
  },
  {
    id: 'explore_deep_space',
    name: 'Explore Deep Space',
    type: 'stage1',
    points: 1,
    description: 'Have units in 3 systems that do not contain planets.',
    requirement: {
      type: 'custom',
      value: 3,
      customCheck: 'units_in_empty_systems',
    },
    expansion: 'pok',
  },
  {
    id: 'improve_infrastructure',
    name: 'Improve Infrastructure',
    type: 'stage1',
    points: 1,
    description: 'Have structures on 3 planets outside of your home system.',
    requirement: {
      type: 'structure_count',
      value: 3,
      customCheck: 'outside_home_system',
    },
    expansion: 'pok',
  },
  {
    id: 'make_history',
    name: 'Make History',
    type: 'stage1',
    points: 1,
    description: 'Have units in 2 systems that contain legendary planets, Mecatol Rex, or anomalies.',
    requirement: {
      type: 'custom',
      value: 2,
      customCheck: 'units_in_special_systems',
    },
    expansion: 'pok',
  },
  {
    id: 'populate_the_outer_rim',
    name: 'Populate the Outer Rim',
    type: 'stage1',
    points: 1,
    description: 'Have units in 3 systems on the edge of the game board other than your home system.',
    requirement: {
      type: 'custom',
      value: 3,
      customCheck: 'units_in_edge_systems',
    },
    expansion: 'pok',
  },
  {
    id: 'push_boundaries',
    name: 'Push Boundaries',
    type: 'stage1',
    points: 1,
    description: 'Control more planets than each of 2 of your neighbors.',
    requirement: {
      type: 'neighbor_count',
      value: 2,
      customCheck: 'more_planets_than_neighbors',
    },
    expansion: 'pok',
  },
  {
    id: 'raise_a_fleet',
    name: 'Raise a Fleet',
    type: 'stage1',
    points: 1,
    description: 'Have 5 or more non-fighter ships in 1 system.',
    requirement: {
      type: 'custom',
      value: 5,
      customCheck: 'non_fighter_ships_in_system',
    },
    expansion: 'pok',
  },
];

// =============================================================================
// STAGE II PUBLIC OBJECTIVES (2 VP each)
// =============================================================================

export const STAGE_II_OBJECTIVES: ObjectiveData[] = [
  // Base Game
  {
    id: 'centralize_galactic_trade',
    name: 'Centralize Galactic Trade',
    type: 'stage2',
    points: 2,
    description: 'Spend 10 trade goods.',
    requirement: {
      type: 'custom',
      value: 10,
      customCheck: 'spend_trade_goods',
    },
    expansion: 'base',
  },
  {
    id: 'conquer_the_weak',
    name: 'Conquer the Weak',
    type: 'stage2',
    points: 2,
    description: 'Control 1 planet that is in another player\'s home system.',
    requirement: {
      type: 'control_planets',
      value: 1,
      customCheck: 'enemy_home_system',
    },
    expansion: 'base',
  },
  {
    id: 'form_galactic_brain_trust',
    name: 'Form Galactic Brain Trust',
    type: 'stage2',
    points: 2,
    description: 'Control 5 planets that have technology specialties.',
    requirement: {
      type: 'control_planets',
      value: 5,
      customCheck: 'tech_specialty',
    },
    expansion: 'base',
  },
  {
    id: 'found_a_golden_age',
    name: 'Found a Golden Age',
    type: 'stage2',
    points: 2,
    description: 'Spend 16 resources.',
    requirement: {
      type: 'spend_resources',
      value: 16,
    },
    expansion: 'base',
  },
  {
    id: 'galvanize_the_people',
    name: 'Galvanize the People',
    type: 'stage2',
    points: 2,
    description: 'Spend a total of 6 tokens from your tactic and/or strategy pools.',
    requirement: {
      type: 'custom',
      value: 6,
      customCheck: 'spend_tokens',
    },
    expansion: 'base',
  },
  {
    id: 'manipulate_galactic_law',
    name: 'Manipulate Galactic Law',
    type: 'stage2',
    points: 2,
    description: 'Spend 16 influence.',
    requirement: {
      type: 'spend_influence',
      value: 16,
    },
    expansion: 'base',
  },
  {
    id: 'master_the_sciences',
    name: 'Master the Sciences',
    type: 'stage2',
    points: 2,
    description: 'Own 2 technologies in each of 4 colors.',
    requirement: {
      type: 'technology_colors',
      value: 2,
      techColors: ['red', 'blue', 'green', 'yellow'], // Need 2 in all 4 colors
    },
    expansion: 'base',
  },
  {
    id: 'revolutionize_warfare',
    name: 'Revolutionize Warfare',
    type: 'stage2',
    points: 2,
    description: 'Own 3 unit upgrade technologies.',
    requirement: {
      type: 'technology_count',
      value: 3,
      customCheck: 'unit_upgrades',
    },
    expansion: 'base',
  },
  {
    id: 'subdue_the_galaxy',
    name: 'Subdue the Galaxy',
    type: 'stage2',
    points: 2,
    description: 'Control 11 planets in non-home systems.',
    requirement: {
      type: 'control_planets',
      value: 11,
      customCheck: 'non_home_systems',
    },
    expansion: 'base',
  },
  {
    id: 'unify_the_colonies',
    name: 'Unify the Colonies',
    type: 'stage2',
    points: 2,
    description: 'Control 6 planets that each have the same planet trait.',
    requirement: {
      type: 'control_trait',
      value: 6,
    },
    expansion: 'base',
  },

  // Prophecy of Kings
  {
    id: 'achieve_supremacy',
    name: 'Achieve Supremacy',
    type: 'stage2',
    points: 2,
    description: 'Have your flagship or a war sun in another player\'s home system or the Mecatol Rex system.',
    requirement: {
      type: 'custom',
      value: 1,
      customCheck: 'capital_ship_in_enemy_home_or_mecatol',
    },
    expansion: 'pok',
  },
  {
    id: 'become_a_legend',
    name: 'Become a Legend',
    type: 'stage2',
    points: 2,
    description: 'Have units in 4 systems that contain legendary planets, Mecatol Rex, or anomalies.',
    requirement: {
      type: 'custom',
      value: 4,
      customCheck: 'units_in_special_systems',
    },
    expansion: 'pok',
  },
  {
    id: 'command_an_armada',
    name: 'Command an Armada',
    type: 'stage2',
    points: 2,
    description: 'Have 8 or more non-fighter ships in 1 system.',
    requirement: {
      type: 'custom',
      value: 8,
      customCheck: 'non_fighter_ships_in_system',
    },
    expansion: 'pok',
  },
  {
    id: 'construct_massive_cities',
    name: 'Construct Massive Cities',
    type: 'stage2',
    points: 2,
    description: 'Have 7 or more structures.',
    requirement: {
      type: 'structure_count',
      value: 7,
    },
    expansion: 'pok',
  },
  {
    id: 'control_the_borderlands',
    name: 'Control the Borderlands',
    type: 'stage2',
    points: 2,
    description: 'Have units in 5 systems on the edge of the game board other than your home system.',
    requirement: {
      type: 'custom',
      value: 5,
      customCheck: 'units_in_edge_systems',
    },
    expansion: 'pok',
  },
  {
    id: 'hold_vast_reserves',
    name: 'Hold Vast Reserves',
    type: 'stage2',
    points: 2,
    description: 'Spend 6 influence, 6 resources, and 6 trade goods.',
    requirement: {
      type: 'custom',
      value: 6,
      customCheck: 'spend_mixed_6_6_6',
    },
    expansion: 'pok',
  },
  {
    id: 'patrol_vast_territories',
    name: 'Patrol Vast Territories',
    type: 'stage2',
    points: 2,
    description: 'Have units in 5 systems that do not contain planets.',
    requirement: {
      type: 'custom',
      value: 5,
      customCheck: 'units_in_empty_systems',
    },
    expansion: 'pok',
  },
  {
    id: 'protect_the_border',
    name: 'Protect the Border',
    type: 'stage2',
    points: 2,
    description: 'Have structures on 5 planets outside of your home system.',
    requirement: {
      type: 'structure_count',
      value: 5,
      customCheck: 'outside_home_system',
    },
    expansion: 'pok',
  },
  {
    id: 'reclaim_ancient_monuments',
    name: 'Reclaim Ancient Monuments',
    type: 'stage2',
    points: 2,
    description: 'Control 3 planets that have attachments.',
    requirement: {
      type: 'control_planets',
      value: 3,
      customCheck: 'with_attachments',
    },
    expansion: 'pok',
  },
  {
    id: 'rule_distant_lands',
    name: 'Rule Distant Lands',
    type: 'stage2',
    points: 2,
    description: 'Control 2 planets that are each in or adjacent to a different, other player\'s home system.',
    requirement: {
      type: 'custom',
      value: 2,
      customCheck: 'planets_near_different_homes',
    },
    expansion: 'pok',
  },
];

// =============================================================================
// SECRET OBJECTIVES (1 VP each)
// =============================================================================

export const SECRET_OBJECTIVES: ObjectiveData[] = [
  // -------------------------------------------------------------------------
  // ACTION PHASE - Base Game
  // -------------------------------------------------------------------------
  {
    id: 'destroy_their_greatest_ship',
    name: 'Destroy Their Greatest Ship',
    type: 'secret',
    points: 1,
    description: 'Destroy another player\'s war sun or flagship.',
    requirement: {
      type: 'win_combat',
      customCheck: 'destroy_war_sun_or_flagship',
    },
    expansion: 'base',
  },
  {
    id: 'make_an_example_of_their_world',
    name: 'Make an Example of Their World',
    type: 'secret',
    points: 1,
    description: 'Use BOMBARDMENT to destroy the last of a player\'s ground forces on a planet.',
    requirement: {
      type: 'custom',
      customCheck: 'bombardment_destroy_last_ground',
    },
    expansion: 'base',
  },
  {
    id: 'spark_a_rebellion',
    name: 'Spark a Rebellion',
    type: 'secret',
    points: 1,
    description: 'Win a combat against a player who has the most victory points.',
    requirement: {
      type: 'win_combat',
      customCheck: 'win_vs_leader',
    },
    expansion: 'base',
  },
  {
    id: 'turn_their_fleets_to_dust',
    name: 'Turn Their Fleets to Dust',
    type: 'secret',
    points: 1,
    description: 'Use SPACE CANNON to destroy the last of a player\'s ships in a system.',
    requirement: {
      type: 'custom',
      customCheck: 'space_cannon_destroy_last_ship',
    },
    expansion: 'base',
  },
  {
    id: 'unveil_flagship',
    name: 'Unveil Flagship',
    type: 'secret',
    points: 1,
    description: 'Win a space combat in a system that contains your flagship. You cannot score this objective if your flagship is destroyed in the combat.',
    requirement: {
      type: 'win_combat',
      customCheck: 'win_with_flagship',
    },
    expansion: 'base',
  },

  // -------------------------------------------------------------------------
  // ACTION PHASE - Prophecy of Kings
  // -------------------------------------------------------------------------
  {
    id: 'become_a_martyr',
    name: 'Become a Martyr',
    type: 'secret',
    points: 1,
    description: 'Lose a combat in a system that contains your flagship. You cannot score this objective if your flagship is not destroyed in the combat.',
    requirement: {
      type: 'custom',
      customCheck: 'lose_flagship_in_combat',
    },
    expansion: 'pok',
  },
  {
    id: 'betray_a_friend',
    name: 'Betray a Friend',
    type: 'secret',
    points: 1,
    description: 'Win a combat against a player whose promissory note you had in your play area at the start of your tactical action.',
    requirement: {
      type: 'win_combat',
      customCheck: 'win_vs_promissory_holder',
    },
    expansion: 'pok',
  },
  {
    id: 'brave_the_void',
    name: 'Brave the Void',
    type: 'secret',
    points: 1,
    description: 'Win a combat in an anomaly.',
    requirement: {
      type: 'win_combat',
      customCheck: 'win_in_anomaly',
    },
    expansion: 'pok',
  },
  {
    id: 'darken_the_skies',
    name: 'Darken the Skies',
    type: 'secret',
    points: 1,
    description: 'Win a combat in another player\'s home system.',
    requirement: {
      type: 'win_combat',
      customCheck: 'win_in_enemy_home',
    },
    expansion: 'pok',
  },
  {
    id: 'demonstrate_your_power',
    name: 'Demonstrate Your Power',
    type: 'secret',
    points: 1,
    description: 'Have 3 or more non-fighter ships in the active system at the end of a space combat.',
    requirement: {
      type: 'custom',
      customCheck: 'three_ships_after_combat',
    },
    expansion: 'pok',
  },
  {
    id: 'fight_with_precision',
    name: 'Fight with Precision',
    type: 'secret',
    points: 1,
    description: 'Use ANTI-FIGHTER BARRAGE to destroy the last of a player\'s fighters in a system.',
    requirement: {
      type: 'custom',
      customCheck: 'afb_destroy_last_fighters',
    },
    expansion: 'pok',
  },
  {
    id: 'prove_endurance',
    name: 'Prove Endurance',
    type: 'secret',
    points: 1,
    description: 'Be the last player to pass during a game round.',
    requirement: {
      type: 'custom',
      customCheck: 'last_to_pass',
    },
    expansion: 'pok',
  },

  // -------------------------------------------------------------------------
  // STATUS PHASE - Base Game
  // -------------------------------------------------------------------------
  {
    id: 'adapt_new_strategies',
    name: 'Adapt New Strategies',
    type: 'secret',
    points: 1,
    description: 'Have 2 faction technologies. Faction ones.',
    requirement: {
      type: 'technology_count',
      value: 2,
      customCheck: 'faction_techs',
    },
    expansion: 'base',
  },
  {
    id: 'become_the_gatekeeper',
    name: 'Become the Gatekeeper',
    type: 'secret',
    points: 1,
    description: 'Have 1 or more ships in a system that contains an alpha wormhole and 1 or more ships in a system that contains a beta wormhole.',
    requirement: {
      type: 'custom',
      customCheck: 'ships_in_both_wormholes',
    },
    expansion: 'base',
  },
  {
    id: 'control_the_region',
    name: 'Control the Region',
    type: 'secret',
    points: 1,
    description: 'Have 1 or more ships in 6 systems.',
    requirement: {
      type: 'custom',
      value: 6,
      customCheck: 'ships_in_systems',
    },
    expansion: 'base',
  },
  {
    id: 'cut_supply_lines',
    name: 'Cut Supply Lines',
    type: 'secret',
    points: 1,
    description: 'Have 1 or more ships in the same system as another player\'s space dock.',
    requirement: {
      type: 'custom',
      customCheck: 'ships_with_enemy_dock',
    },
    expansion: 'base',
  },
  {
    id: 'establish_a_perimeter',
    name: 'Establish a Perimeter',
    type: 'secret',
    points: 1,
    description: 'Have 4 PDS units on the game board.',
    requirement: {
      type: 'unit_count',
      value: 4,
      unitTypes: ['pds'],
    },
    expansion: 'base',
  },
  {
    id: 'forge_an_alliance',
    name: 'Forge an Alliance',
    type: 'secret',
    points: 1,
    description: 'Control 4 cultural planets.',
    requirement: {
      type: 'control_trait',
      value: 4,
      trait: 'cultural',
    },
    expansion: 'base',
  },
  {
    id: 'form_a_spy_network',
    name: 'Form a Spy Network',
    type: 'secret',
    points: 1,
    description: 'Discard 5 action cards.',
    requirement: {
      type: 'custom',
      value: 5,
      customCheck: 'discard_action_cards',
    },
    expansion: 'base',
  },
  {
    id: 'fuel_the_war_machine',
    name: 'Fuel the War Machine',
    type: 'secret',
    points: 1,
    description: 'Have 3 space docks on the game board.',
    requirement: {
      type: 'unit_count',
      value: 3,
      unitTypes: ['space_dock'],
    },
    expansion: 'base',
  },
  {
    id: 'gather_a_mighty_fleet',
    name: 'Gather a Mighty Fleet',
    type: 'secret',
    points: 1,
    description: 'Have 5 dreadnoughts on the game board.',
    requirement: {
      type: 'unit_count',
      value: 5,
      unitTypes: ['dreadnought'],
    },
    expansion: 'base',
  },
  {
    id: 'learn_the_secrets_of_the_cosmos',
    name: 'Learn the Secrets of the Cosmos',
    type: 'secret',
    points: 1,
    description: 'Have 1 or more ships in 3 systems that are each adjacent to an anomaly.',
    requirement: {
      type: 'custom',
      value: 3,
      customCheck: 'ships_adjacent_anomaly',
    },
    expansion: 'base',
  },
  {
    id: 'master_the_laws_of_physics',
    name: 'Master the Laws of Physics',
    type: 'secret',
    points: 1,
    description: 'Have 4 technology cards in any 1 color.',
    requirement: {
      type: 'technology_colors',
      value: 4,
      customCheck: 'single_color',
    },
    expansion: 'base',
  },
  {
    id: 'mine_rare_metals',
    name: 'Mine Rare Metals',
    type: 'secret',
    points: 1,
    description: 'Control 4 hazardous planets.',
    requirement: {
      type: 'control_trait',
      value: 4,
      trait: 'hazardous',
    },
    expansion: 'base',
  },
  {
    id: 'monopolize_production',
    name: 'Monopolize Production',
    type: 'secret',
    points: 1,
    description: 'Control 4 industrial planets.',
    requirement: {
      type: 'control_trait',
      value: 4,
      trait: 'industrial',
    },
    expansion: 'base',
  },
  {
    id: 'occupy_the_seat_of_the_empire',
    name: 'Occupy the Seat of the Empire',
    type: 'secret',
    points: 1,
    description: 'Control Mecatol Rex and have 3 or more ships in its system.',
    requirement: {
      type: 'control_mecatol',
      value: 3,
      customCheck: 'with_ships',
    },
    expansion: 'base',
  },
  {
    id: 'threaten_enemies',
    name: 'Threaten Enemies',
    type: 'secret',
    points: 1,
    description: 'Have 1 or more ships in a system that is adjacent to another player\'s home system.',
    requirement: {
      type: 'custom',
      customCheck: 'ships_adjacent_enemy_home',
    },
    expansion: 'base',
  },

  // -------------------------------------------------------------------------
  // STATUS PHASE - Prophecy of Kings
  // -------------------------------------------------------------------------
  {
    id: 'defy_space_and_time',
    name: 'Defy Space and Time',
    type: 'secret',
    points: 1,
    description: 'Have units in the wormhole nexus.',
    requirement: {
      type: 'custom',
      customCheck: 'units_in_nexus',
    },
    expansion: 'pok',
  },
  {
    id: 'destroy_heretical_works',
    name: 'Destroy Heretical Works',
    type: 'secret',
    points: 1,
    description: 'Purge 2 of your relic fragments of any type.',
    requirement: {
      type: 'custom',
      value: 2,
      customCheck: 'purge_fragments',
    },
    expansion: 'pok',
  },
  {
    id: 'establish_hegemony',
    name: 'Establish Hegemony',
    type: 'secret',
    points: 1,
    description: 'Control planets that have a combined influence value of at least 12.',
    requirement: {
      type: 'custom',
      value: 12,
      customCheck: 'total_influence',
    },
    expansion: 'pok',
  },
  {
    id: 'foster_cohesion',
    name: 'Foster Cohesion',
    type: 'secret',
    points: 1,
    description: 'Be neighbors with all other players.',
    requirement: {
      type: 'neighbor_count',
      customCheck: 'all_neighbors',
    },
    expansion: 'pok',
  },
  {
    id: 'hoard_raw_materials',
    name: 'Hoard Raw Materials',
    type: 'secret',
    points: 1,
    description: 'Control planets that have a combined resource value of at least 12.',
    requirement: {
      type: 'custom',
      value: 12,
      customCheck: 'total_resources',
    },
    expansion: 'pok',
  },
  {
    id: 'mechanize_the_military',
    name: 'Mechanize The Military',
    type: 'secret',
    points: 1,
    description: 'Have 4 mechs on the game board.',
    requirement: {
      type: 'unit_count',
      value: 4,
      unitTypes: ['mech'],
    },
    expansion: 'pok',
  },
  {
    id: 'occupy_the_fringe',
    name: 'Occupy The Fringe',
    type: 'secret',
    points: 1,
    description: 'Have 9 or more ground forces on a planet that does not contain 1 of your space docks.',
    requirement: {
      type: 'custom',
      value: 9,
      customCheck: 'ground_forces_no_dock',
    },
    expansion: 'pok',
  },
  {
    id: 'produce_en_masse',
    name: 'Produce En Masse',
    type: 'secret',
    points: 1,
    description: 'Have units with a combined PRODUCTION value of at least 8 in a single system.',
    requirement: {
      type: 'custom',
      value: 8,
      customCheck: 'production_in_system',
    },
    expansion: 'pok',
  },
  {
    id: 'seize_an_icon',
    name: 'Seize An Icon',
    type: 'secret',
    points: 1,
    description: 'Control a legendary planet.',
    requirement: {
      type: 'control_planets',
      value: 1,
      customCheck: 'legendary',
    },
    expansion: 'pok',
  },
  {
    id: 'stake_your_claim',
    name: 'Stake your Claim',
    type: 'secret',
    points: 1,
    description: 'Control a planet in a system that contains a planet controlled by another player.',
    requirement: {
      type: 'custom',
      customCheck: 'shared_system_control',
    },
    expansion: 'pok',
  },
  {
    id: 'strengthen_bonds',
    name: 'Strengthen Bonds',
    type: 'secret',
    points: 1,
    description: 'Have another player\'s promissory note in your play area.',
    requirement: {
      type: 'custom',
      customCheck: 'has_promissory_note',
    },
    expansion: 'pok',
  },

  // -------------------------------------------------------------------------
  // AGENDA PHASE - Prophecy of Kings
  // -------------------------------------------------------------------------
  {
    id: 'dictate_policy',
    name: 'Dictate Policy',
    type: 'secret',
    points: 1,
    description: 'There are 3 or more laws in play.',
    requirement: {
      type: 'custom',
      value: 3,
      customCheck: 'laws_in_play',
    },
    expansion: 'pok',
  },
  {
    id: 'drive_the_debate',
    name: 'Drive the Debate',
    type: 'secret',
    points: 1,
    description: 'You or a planet you control are elected by an agenda.',
    requirement: {
      type: 'custom',
      customCheck: 'elected_by_agenda',
    },
    expansion: 'pok',
  },
];

// =============================================================================
// ALL OBJECTIVES COMBINED
// =============================================================================

export const ALL_OBJECTIVES: ObjectiveData[] = [
  ...STAGE_I_OBJECTIVES,
  ...STAGE_II_OBJECTIVES,
  ...SECRET_OBJECTIVES,
];

// =============================================================================
// HELPER MAPS FOR QUICK LOOKUP
// =============================================================================

export const OBJECTIVES_BY_ID: Record<string, ObjectiveData> = Object.fromEntries(
  ALL_OBJECTIVES.map(obj => [obj.id, obj])
);

export const OBJECTIVES_BY_TYPE = {
  stage1: STAGE_I_OBJECTIVES,
  stage2: STAGE_II_OBJECTIVES,
  secret: SECRET_OBJECTIVES,
};

// =============================================================================
// TIMING HELPERS
// =============================================================================

/**
 * Secret objectives that can be scored during the Action Phase
 */
export const ACTION_PHASE_SECRETS = SECRET_OBJECTIVES.filter(obj =>
  [
    'destroy_their_greatest_ship',
    'make_an_example_of_their_world',
    'spark_a_rebellion',
    'turn_their_fleets_to_dust',
    'unveil_flagship',
    'become_a_martyr',
    'betray_a_friend',
    'brave_the_void',
    'darken_the_skies',
    'demonstrate_your_power',
    'fight_with_precision',
    'prove_endurance',
  ].includes(obj.id)
);

/**
 * Secret objectives that can be scored during the Status Phase
 */
export const STATUS_PHASE_SECRETS = SECRET_OBJECTIVES.filter(obj =>
  [
    'adapt_new_strategies',
    'become_the_gatekeeper',
    'control_the_region',
    'cut_supply_lines',
    'establish_a_perimeter',
    'forge_an_alliance',
    'form_a_spy_network',
    'fuel_the_war_machine',
    'gather_a_mighty_fleet',
    'learn_the_secrets_of_the_cosmos',
    'master_the_laws_of_physics',
    'mine_rare_metals',
    'monopolize_production',
    'occupy_the_seat_of_the_empire',
    'threaten_enemies',
    'defy_space_and_time',
    'destroy_heretical_works',
    'establish_hegemony',
    'foster_cohesion',
    'hoard_raw_materials',
    'mechanize_the_military',
    'occupy_the_fringe',
    'produce_en_masse',
    'seize_an_icon',
    'stake_your_claim',
    'strengthen_bonds',
  ].includes(obj.id)
);

/**
 * Secret objectives that can be scored during the Agenda Phase
 */
export const AGENDA_PHASE_SECRETS = SECRET_OBJECTIVES.filter(obj =>
  ['dictate_policy', 'drive_the_debate'].includes(obj.id)
);
