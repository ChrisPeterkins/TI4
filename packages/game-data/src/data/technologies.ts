import type { TechnologyData } from '@ti4/shared';

export const technologies: Record<string, TechnologyData> = {
  // ============================================
  // BLUE (PROPULSION) TECHNOLOGIES
  // ============================================

  // Base Game - Blue
  antimass_deflectors: {
    id: 'antimass_deflectors',
    name: 'Antimass Deflectors',
    type: 'color',
    color: 'blue',
    prerequisites: [],
    expansion: 'base',
    description: 'Your ships can move into and through asteroid fields. When other players\' units use SPACE CANNON against your units, apply -1 to the result of each die roll.',
  },
  gravity_drive: {
    id: 'gravity_drive',
    name: 'Gravity Drive',
    type: 'color',
    color: 'blue',
    prerequisites: [{ color: 'blue', count: 1 }],
    expansion: 'base',
    description: 'After you activate a system, apply +1 to the move value of 1 of your ships during this tactical action.',
  },
  fleet_logistics: {
    id: 'fleet_logistics',
    name: 'Fleet Logistics',
    type: 'color',
    color: 'blue',
    prerequisites: [{ color: 'blue', count: 2 }],
    expansion: 'base',
    description: 'During each of your turns of the action phase, you may perform 2 actions instead of 1.',
  },
  light_wave_deflector: {
    id: 'light_wave_deflector',
    name: 'Light/Wave Deflector',
    type: 'color',
    color: 'blue',
    prerequisites: [{ color: 'blue', count: 3 }],
    expansion: 'base',
    description: 'Your ships can move through systems that contain other players\' ships.',
  },

  // PoK - Blue
  dark_energy_tap: {
    id: 'dark_energy_tap',
    name: 'Dark Energy Tap',
    type: 'color',
    color: 'blue',
    prerequisites: [],
    expansion: 'pok',
    description: 'After you perform a tactical action in a system that contains a frontier token, if you have 1 or more ships in that system, explore that token.',
  },
  sling_relay: {
    id: 'sling_relay',
    name: 'Sling Relay',
    type: 'color',
    color: 'blue',
    prerequisites: [{ color: 'blue', count: 1 }],
    expansion: 'pok',
    description: 'ACTION: Exhaust this card to produce 1 ship in any system that contains one of your space docks.',
  },

  // ============================================
  // GREEN (BIOTIC) TECHNOLOGIES
  // ============================================

  // Base Game - Green
  neural_motivator: {
    id: 'neural_motivator',
    name: 'Neural Motivator',
    type: 'color',
    color: 'green',
    prerequisites: [],
    expansion: 'base',
    description: 'During the status phase, draw 2 action cards instead of 1.',
  },
  dacxive_animators: {
    id: 'dacxive_animators',
    name: 'Dacxive Animators',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 1 }],
    expansion: 'base',
    description: 'After you win a ground combat, you may place 1 infantry from your reinforcements on that planet.',
  },
  hyper_metabolism: {
    id: 'hyper_metabolism',
    name: 'Hyper Metabolism',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 2 }],
    expansion: 'base',
    description: 'During the status phase, gain 3 command tokens instead of 2.',
  },
  x89_bacterial_weapon: {
    id: 'x89_bacterial_weapon',
    name: 'X-89 Bacterial Weapon',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 3 }],
    expansion: 'base',
    description: 'ACTION: Exhaust this card and choose 1 planet in a system that contains 1 or more of your ships that have BOMBARDMENT; destroy all infantry on that planet.',
  },

  // PoK - Green
  psychoarchaeology: {
    id: 'psychoarchaeology',
    name: 'Psychoarchaeology',
    type: 'color',
    color: 'green',
    prerequisites: [],
    expansion: 'pok',
    description: 'You can use technology specialties on planets you control without exhausting them, even if those planets are exhausted.',
  },
  bio_stims: {
    id: 'bio_stims',
    name: 'Bio-Stims',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 1 }],
    expansion: 'pok',
    description: 'You may exhaust this card at the end of your turn to ready 1 of your planets that has a technology specialty or 1 of your other technologies.',
  },

  // ============================================
  // YELLOW (CYBERNETIC) TECHNOLOGIES
  // ============================================

  // Base Game - Yellow
  sarween_tools: {
    id: 'sarween_tools',
    name: 'Sarween Tools',
    type: 'color',
    color: 'yellow',
    prerequisites: [],
    expansion: 'base',
    description: 'When 1 or more of your units use PRODUCTION, reduce the combined cost of the produced units by 1.',
  },
  graviton_laser_system: {
    id: 'graviton_laser_system',
    name: 'Graviton Laser System',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 1 }],
    expansion: 'base',
    description: 'You may exhaust this card before 1 or more of your units uses SPACE CANNON; hits produced by those units must be assigned to non-fighter ships if able.',
  },
  transit_diodes: {
    id: 'transit_diodes',
    name: 'Transit Diodes',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'base',
    description: 'You may exhaust this card at the start of your turn during the action phase; remove up to 4 of your ground forces from the game board and place them on 1 or more planets you control.',
  },
  integrated_economy: {
    id: 'integrated_economy',
    name: 'Integrated Economy',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 3 }],
    expansion: 'base',
    description: 'After you gain control of a planet, you may produce any number of units on that planet that have a combined cost equal to or less than that planet\'s resource value.',
  },

  // PoK - Yellow
  scanlink_drone_network: {
    id: 'scanlink_drone_network',
    name: 'Scanlink Drone Network',
    type: 'color',
    color: 'yellow',
    prerequisites: [],
    expansion: 'pok',
    description: 'When you activate a system, you may explore 1 planet in that system which contains 1 or more of your units.',
  },
  predictive_intelligence: {
    id: 'predictive_intelligence',
    name: 'Predictive Intelligence',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 1 }],
    expansion: 'pok',
    description: 'At the end of your turn, you may exhaust this card to redistribute your command tokens.',
  },

  // ============================================
  // RED (WARFARE) TECHNOLOGIES
  // ============================================

  // Base Game - Red
  plasma_scoring: {
    id: 'plasma_scoring',
    name: 'Plasma Scoring',
    type: 'color',
    color: 'red',
    prerequisites: [],
    expansion: 'base',
    description: 'When 1 or more of your units use BOMBARDMENT or SPACE CANNON, 1 of those units may roll 1 additional die.',
  },
  magen_defense_grid: {
    id: 'magen_defense_grid',
    name: 'Magen Defense Grid',
    type: 'color',
    color: 'red',
    prerequisites: [{ color: 'red', count: 1 }],
    expansion: 'base',
    description: 'You may exhaust this card at the start of ground combat on a planet that contains 1 or more of your units that have PLANETARY SHIELD; your opponent cannot make combat rolls during this combat round.',
  },
  duranium_armor: {
    id: 'duranium_armor',
    name: 'Duranium Armor',
    type: 'color',
    color: 'red',
    prerequisites: [{ color: 'red', count: 2 }],
    expansion: 'base',
    description: 'During each combat round, after you assign hits to your units, repair 1 of your damaged units that did not use SUSTAIN DAMAGE during this combat round.',
  },
  assault_cannon: {
    id: 'assault_cannon',
    name: 'Assault Cannon',
    type: 'color',
    color: 'red',
    prerequisites: [{ color: 'red', count: 3 }],
    expansion: 'base',
    description: 'At the start of a space combat in a system that contains 3 or more of your non-fighter ships, your opponent must destroy 1 of their non-fighter ships.',
  },

  // PoK - Red
  ai_development_algorithm: {
    id: 'ai_development_algorithm',
    name: 'AI Development Algorithm',
    type: 'color',
    color: 'red',
    prerequisites: [],
    expansion: 'pok',
    description: 'When you research a unit upgrade technology, you may exhaust this card to ignore any 1 prerequisite.',
  },
  self_assembly_routines: {
    id: 'self_assembly_routines',
    name: 'Self Assembly Routines',
    type: 'color',
    color: 'red',
    prerequisites: [{ color: 'red', count: 1 }],
    expansion: 'pok',
    description: 'After 1 or more of your units use PRODUCTION, you may exhaust this card to place 1 mech from your reinforcements on a planet you control in that system.',
  },

  // ============================================
  // GENERIC UNIT UPGRADE TECHNOLOGIES
  // ============================================

  carrier_ii: {
    id: 'carrier_ii',
    name: 'Carrier II',
    type: 'unit_upgrade',
    unitType: 'carrier',
    prerequisites: [{ color: 'blue', count: 2 }],
    expansion: 'base',
    description: 'Cost 3, Move 2, Capacity 6',
  },
  cruiser_ii: {
    id: 'cruiser_ii',
    name: 'Cruiser II',
    type: 'unit_upgrade',
    unitType: 'cruiser',
    prerequisites: [
      { color: 'green', count: 1 },
      { color: 'yellow', count: 1 },
      { color: 'red', count: 1 },
    ],
    expansion: 'base',
    description: 'Cost 2, Combat 6, Move 3, Capacity 1',
  },
  destroyer_ii: {
    id: 'destroyer_ii',
    name: 'Destroyer II',
    type: 'unit_upgrade',
    unitType: 'destroyer',
    prerequisites: [{ color: 'red', count: 2 }],
    expansion: 'base',
    description: 'Cost 1, Combat 8, Move 2. ANTI-FIGHTER BARRAGE 6 (x3)',
  },
  dreadnought_ii: {
    id: 'dreadnought_ii',
    name: 'Dreadnought II',
    type: 'unit_upgrade',
    unitType: 'dreadnought',
    prerequisites: [
      { color: 'blue', count: 2 },
      { color: 'yellow', count: 1 },
    ],
    expansion: 'base',
    description: 'Cost 4, Combat 5, Move 2, Capacity 1. SUSTAIN DAMAGE, BOMBARDMENT 5',
  },
  fighter_ii: {
    id: 'fighter_ii',
    name: 'Fighter II',
    type: 'unit_upgrade',
    unitType: 'fighter',
    prerequisites: [{ color: 'green', count: 2 }],
    expansion: 'base',
    description: 'Cost 1/2, Combat 8, Move 2. This unit may move without being transported.',
  },
  infantry_ii: {
    id: 'infantry_ii',
    name: 'Infantry II',
    type: 'unit_upgrade',
    unitType: 'infantry',
    prerequisites: [{ color: 'green', count: 2 }],
    expansion: 'base',
    description: 'Cost 1/2, Combat 7.',
  },
  pds_ii: {
    id: 'pds_ii',
    name: 'PDS II',
    type: 'unit_upgrade',
    unitType: 'pds',
    prerequisites: [
      { color: 'yellow', count: 1 },
      { color: 'red', count: 1 },
    ],
    expansion: 'base',
    description: 'PLANETARY SHIELD, SPACE CANNON 5. You may use this unit\'s SPACE CANNON against ships that are in adjacent systems.',
  },
  space_dock_ii: {
    id: 'space_dock_ii',
    name: 'Space Dock II',
    type: 'unit_upgrade',
    unitType: 'space_dock',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'base',
    description: 'PRODUCTION value is 4 more than the resource value of this planet. This unit produces only 3 fighters and infantry for their cost instead of 2.',
  },
  war_sun: {
    id: 'war_sun',
    name: 'War Sun',
    type: 'unit_upgrade',
    unitType: 'war_sun',
    prerequisites: [
      { color: 'yellow', count: 1 },
      { color: 'red', count: 3 },
    ],
    expansion: 'base',
    description: 'Cost 12, Combat 3 (x3), Move 2, Capacity 6. SUSTAIN DAMAGE, BOMBARDMENT 3 (x3). Other players\' units in this system lose PLANETARY SHIELD.',
  },

  // ============================================
  // FACTION TECHNOLOGIES - BASE GAME
  // ============================================

  // Arborec
  bioplasmosis: {
    id: 'bioplasmosis',
    name: 'Bioplasmosis',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 2 }],
    expansion: 'base',
    factionId: 'arborec',
    description: 'At the end of the status phase, you may remove any number of infantry from planets you control and place them on 1 or more planets you control in the same or adjacent systems.',
  },
  letani_warrior_ii: {
    id: 'letani_warrior_ii',
    name: 'Letani Warrior II',
    type: 'unit_upgrade',
    unitType: 'infantry',
    prerequisites: [{ color: 'green', count: 2 }],
    expansion: 'base',
    factionId: 'arborec',
    description: 'Cost 1/2, Combat 7. After this unit is destroyed, roll 1 die. If the result is 6 or greater, place the unit on this card. At the start of your next turn, place each unit on this card on a planet you control in your home system.',
  },

  // Barony of Letnev
  l4_disruptors: {
    id: 'l4_disruptors',
    name: 'L4 Disruptors',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 1 }],
    expansion: 'base',
    factionId: 'letnev',
    description: 'During an invasion, units cannot use SPACE CANNON against your units.',
  },
  non_euclidean_shielding: {
    id: 'non_euclidean_shielding',
    name: 'Non-Euclidean Shielding',
    type: 'color',
    color: 'red',
    prerequisites: [{ color: 'red', count: 2 }],
    expansion: 'base',
    factionId: 'letnev',
    description: 'When 1 of your units uses SUSTAIN DAMAGE, cancel 2 hits instead of 1.',
  },

  // Clan of Saar
  chaos_mapping: {
    id: 'chaos_mapping',
    name: 'Chaos Mapping',
    type: 'color',
    color: 'blue',
    prerequisites: [{ color: 'blue', count: 1 }],
    expansion: 'base',
    factionId: 'saar',
    description: 'Other players cannot activate asteroid fields that contain 1 or more of your ships. At the start of your turn during the action phase, you may produce 1 unit in a system that contains at least 1 of your units that has PRODUCTION.',
  },
  floating_factory_ii: {
    id: 'floating_factory_ii',
    name: 'Floating Factory II',
    type: 'unit_upgrade',
    unitType: 'space_dock',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'base',
    factionId: 'saar',
    description: 'Move 2, Capacity 5, PRODUCTION 7. This unit is placed in a space area instead of on a planet. This unit can move and retreat as if it were a ship. If this unit is blockaded, it is destroyed.',
  },

  // Embers of Muaat
  magmus_reactor: {
    id: 'magmus_reactor',
    name: 'Magmus Reactor',
    type: 'color',
    color: 'red',
    prerequisites: [{ color: 'red', count: 2 }],
    expansion: 'base',
    factionId: 'muaat',
    description: 'Your ships can move into supernovas. After 1 or more of your units use PRODUCTION in a system that either contains a war sun or is adjacent to a supernova, gain 1 trade good.',
  },
  prototype_war_sun_ii: {
    id: 'prototype_war_sun_ii',
    name: 'Prototype War Sun II',
    type: 'unit_upgrade',
    unitType: 'war_sun',
    prerequisites: [{ color: 'red', count: 3 }],
    expansion: 'base',
    factionId: 'muaat',
    description: 'Cost 10, Combat 3 (x3), Move 3, Capacity 6. SUSTAIN DAMAGE, BOMBARDMENT 3 (x3). Other players\' units in this system lose PLANETARY SHIELD.',
  },

  // Emirates of Hacan
  production_biomes: {
    id: 'production_biomes',
    name: 'Production Biomes',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 2 }],
    expansion: 'base',
    factionId: 'hacan',
    description: 'ACTION: Exhaust this card and spend 1 token from your strategy pool to gain 4 trade goods and choose 1 other player; that player gains 2 trade goods.',
  },
  quantum_datahub_node: {
    id: 'quantum_datahub_node',
    name: 'Quantum Datahub Node',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 3 }],
    expansion: 'base',
    factionId: 'hacan',
    description: 'At the end of the strategy phase, you may spend 1 token from your strategy pool and give another player 3 of your trade goods. If you do, give 1 of your strategy cards to that player and take 1 of their strategy cards.',
  },

  // Federation of Sol
  advanced_carrier_ii: {
    id: 'advanced_carrier_ii',
    name: 'Advanced Carrier II',
    type: 'unit_upgrade',
    unitType: 'carrier',
    prerequisites: [{ color: 'blue', count: 2 }],
    expansion: 'base',
    factionId: 'sol',
    description: 'Cost 3, Move 2, Capacity 8. SUSTAIN DAMAGE',
  },
  spec_ops_ii: {
    id: 'spec_ops_ii',
    name: 'Spec Ops II',
    type: 'unit_upgrade',
    unitType: 'infantry',
    prerequisites: [{ color: 'green', count: 2 }],
    expansion: 'base',
    factionId: 'sol',
    description: 'Cost 1/2, Combat 6. After this unit is destroyed, roll 1 die. If the result is 5 or greater, place the unit on this card. At the start of your next turn, place each unit on this card on a planet you control in your home system.',
  },

  // Ghosts of Creuss
  wormhole_generator: {
    id: 'wormhole_generator',
    name: 'Wormhole Generator',
    type: 'color',
    color: 'blue',
    prerequisites: [{ color: 'blue', count: 2 }],
    expansion: 'base',
    factionId: 'creuss',
    description: 'At the start of the status phase, place or move a Creuss wormhole token into either a system that contains a planet you control or a non-home system that does not contain another player\'s ships.',
  },
  dimensional_splicer: {
    id: 'dimensional_splicer',
    name: 'Dimensional Splicer',
    type: 'color',
    color: 'red',
    prerequisites: [{ color: 'red', count: 1 }],
    expansion: 'base',
    factionId: 'creuss',
    description: 'At the start of space combat in a system that contains a wormhole and 1 or more of your ships, you may produce 1 hit and assign it to 1 of your opponent\'s ships.',
  },

  // L1Z1X Mindnet
  inheritance_systems: {
    id: 'inheritance_systems',
    name: 'Inheritance Systems',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'base',
    factionId: 'l1z1x',
    description: 'You may exhaust this card and spend 2 resources when you research a technology; ignore all of that technology\'s prerequisites.',
  },
  superdreadnought_ii: {
    id: 'superdreadnought_ii',
    name: 'Super Dreadnought II',
    type: 'unit_upgrade',
    unitType: 'dreadnought',
    prerequisites: [
      { color: 'blue', count: 2 },
      { color: 'yellow', count: 1 },
    ],
    expansion: 'base',
    factionId: 'l1z1x',
    description: 'Cost 4, Combat 4, Move 2, Capacity 2. SUSTAIN DAMAGE, BOMBARDMENT 4',
  },

  // Mentak Coalition
  salvage_operations: {
    id: 'salvage_operations',
    name: 'Salvage Operations',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'base',
    factionId: 'mentak',
    description: 'After you win or lose a space combat, gain 1 trade good; if you won the combat, you may also produce 1 ship in that system of any ship type that was destroyed during the combat.',
  },
  mirror_computing: {
    id: 'mirror_computing',
    name: 'Mirror Computing',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 3 }],
    expansion: 'base',
    factionId: 'mentak',
    description: 'When you spend trade goods, each trade good is worth 2 resources or influence instead of 1.',
  },

  // Naalu Collective
  neuroglaive: {
    id: 'neuroglaive',
    name: 'Neuroglaive',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 3 }],
    expansion: 'base',
    factionId: 'naalu',
    description: 'After another player activates a system that contains 1 or more of your ships, that player removes 1 token from their fleet pool and returns it to their reinforcements.',
  },
  hybrid_crystal_fighter_ii: {
    id: 'hybrid_crystal_fighter_ii',
    name: 'Hybrid Crystal Fighter II',
    type: 'unit_upgrade',
    unitType: 'fighter',
    prerequisites: [{ color: 'green', count: 2 }],
    expansion: 'base',
    factionId: 'naalu',
    description: 'Cost 1/2, Combat 7, Move 2. This unit may move without being transported.',
  },

  // Nekro Virus
  valefar_assimilator_x: {
    id: 'valefar_assimilator_x',
    name: 'Valefar Assimilator X',
    type: 'color',
    color: 'yellow',
    prerequisites: [],
    expansion: 'base',
    factionId: 'nekro',
    description: 'When you would gain another player\'s technology using 1 of your faction abilities, you may place the "X" assimilator token on a faction technology owned by that player instead. While that token is on a technology, this card gains that technology\'s text. You cannot place this token on a technology that already has an assimilator token.',
  },
  valefar_assimilator_y: {
    id: 'valefar_assimilator_y',
    name: 'Valefar Assimilator Y',
    type: 'color',
    color: 'yellow',
    prerequisites: [],
    expansion: 'base',
    factionId: 'nekro',
    description: 'When you would gain another player\'s technology using 1 of your faction abilities, you may place the "Y" assimilator token on a faction technology owned by that player instead. While that token is on a technology, this card gains that technology\'s text. You cannot place this token on a technology that already has an assimilator token.',
  },

  // Sardakk N\'orr
  valkyrie_particle_weave: {
    id: 'valkyrie_particle_weave',
    name: 'Valkyrie Particle Weave',
    type: 'color',
    color: 'red',
    prerequisites: [{ color: 'red', count: 2 }],
    expansion: 'base',
    factionId: 'sardakk',
    description: 'After making combat rolls during a round of ground combat, if your opponent produced 1 or more hits, you produce 1 additional hit.',
  },
  exotrireme_ii: {
    id: 'exotrireme_ii',
    name: 'Exotrireme II',
    type: 'unit_upgrade',
    unitType: 'dreadnought',
    prerequisites: [
      { color: 'blue', count: 2 },
      { color: 'yellow', count: 1 },
    ],
    expansion: 'base',
    factionId: 'sardakk',
    description: 'Cost 4, Combat 5, Move 2, Capacity 1. SUSTAIN DAMAGE, BOMBARDMENT 4 (x2). After a round of space combat, you may destroy this unit to destroy up to 2 of your opponent\'s ships in this system.',
  },

  // Universities of Jol-Nar
  e_res_siphons: {
    id: 'e_res_siphons',
    name: 'E-Res Siphons',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'base',
    factionId: 'jolnar',
    description: 'After another player activates a system that contains 1 or more of your ships, gain 4 trade goods.',
  },
  spacial_conduit_cylinder: {
    id: 'spacial_conduit_cylinder',
    name: 'Spacial Conduit Cylinder',
    type: 'color',
    color: 'blue',
    prerequisites: [{ color: 'blue', count: 2 }],
    expansion: 'base',
    factionId: 'jolnar',
    description: 'You may exhaust this card after you activate a system that contains 1 or more of your units; that system is adjacent to all other systems that contain 1 or more of your units during this activation.',
  },

  // Winnu
  lazax_gate_folding: {
    id: 'lazax_gate_folding',
    name: 'Lazax Gate Folding',
    type: 'color',
    color: 'blue',
    prerequisites: [{ color: 'blue', count: 2 }],
    expansion: 'base',
    factionId: 'winnu',
    description: 'During your tactical actions, if you do not control Mecatol Rex, treat its system as if it contains both an alpha and beta wormhole. ACTION: If you control Mecatol Rex, exhaust this card to place 1 infantry from your reinforcements on Mecatol Rex.',
  },
  hegemonic_trade_policy: {
    id: 'hegemonic_trade_policy',
    name: 'Hegemonic Trade Policy',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'base',
    factionId: 'winnu',
    description: 'Exhaust this card when 1 or more of your units use PRODUCTION; swap the resource and influence values of 1 planet you control during that use of PRODUCTION.',
  },

  // Xxcha Kingdom
  nullification_field: {
    id: 'nullification_field',
    name: 'Nullification Field',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'base',
    factionId: 'xxcha',
    description: 'After another player activates a system that contains 1 or more of your ships, you may exhaust this card and spend 1 token from your strategy pool; immediately end that player\'s turn.',
  },
  instinct_training: {
    id: 'instinct_training',
    name: 'Instinct Training',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 1 }],
    expansion: 'base',
    factionId: 'xxcha',
    description: 'You may exhaust this card and spend 1 token from your strategy pool when another player plays an action card; cancel that action card.',
  },

  // Yin Brotherhood
  impulse_core: {
    id: 'impulse_core',
    name: 'Impulse Core',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'base',
    factionId: 'yin',
    description: 'At the start of a space combat, you may destroy 1 of your cruisers or destroyers in the active system to produce 1 hit against your opponent\'s ships; that hit must be assigned by your opponent to 1 of their non-fighter ships, if able.',
  },
  yin_spinner: {
    id: 'yin_spinner',
    name: 'Yin Spinner',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 2 }],
    expansion: 'base',
    factionId: 'yin',
    description: 'After 1 or more of your units use PRODUCTION, place 1 infantry from your reinforcements on a planet you control in that system.',
  },

  // Yssaril Tribes
  transparasteel_plating: {
    id: 'transparasteel_plating',
    name: 'Transparasteel Plating',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 1 }],
    expansion: 'base',
    factionId: 'yssaril',
    description: 'During your turn of the action phase, players that have passed cannot play action cards.',
  },
  mageon_implants: {
    id: 'mageon_implants',
    name: 'Mageon Implants',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 3 }],
    expansion: 'base',
    factionId: 'yssaril',
    description: 'ACTION: Exhaust this card to look at another player\'s hand of action cards. Choose 1 of those cards and add it to your hand.',
  },

  // ============================================
  // FACTION TECHNOLOGIES - PROPHECY OF KINGS
  // ============================================

  // Argent Flight
  aerie_hololattice: {
    id: 'aerie_hololattice',
    name: 'Aerie Hololattice',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 1 }],
    expansion: 'pok',
    factionId: 'argent',
    description: 'Other players cannot move ships through systems that contain your structures. Each planet that contains 1 or more of your structures gains the PRODUCTION 1 ability as if it were a unit.',
  },
  strike_wing_alpha_ii: {
    id: 'strike_wing_alpha_ii',
    name: 'Strike Wing Alpha II',
    type: 'unit_upgrade',
    unitType: 'destroyer',
    prerequisites: [{ color: 'red', count: 2 }],
    expansion: 'pok',
    factionId: 'argent',
    description: 'Cost 1, Combat 7, Move 2, Capacity 1. ANTI-FIGHTER BARRAGE 6 (x3). This unit can transport 1 fighter or 1 infantry.',
  },

  // Empyrean
  aetherstream: {
    id: 'aetherstream',
    name: 'Aetherstream',
    type: 'color',
    color: 'blue',
    prerequisites: [{ color: 'blue', count: 2 }],
    expansion: 'pok',
    factionId: 'empyrean',
    description: 'After you or one of your neighbors activates a system that is adjacent to an anomaly, you may apply +1 to the move value of all of that player\'s ships during this tactical action.',
  },
  voidwatch: {
    id: 'voidwatch',
    name: 'Voidwatch',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 1 }],
    expansion: 'pok',
    factionId: 'empyrean',
    description: 'After a player moves ships into a system that contains 1 or more of your units, they must give you 1 promissory note from their hand, if able.',
  },

  // Mahact Gene-Sorcerers
  genetic_recombination: {
    id: 'genetic_recombination',
    name: 'Genetic Recombination',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 1 }],
    expansion: 'pok',
    factionId: 'mahact',
    description: 'You may exhaust this card before a player casts votes; that player must cast at least 1 vote for an outcome of your choice or remove 1 token from their fleet pool and return it to their reinforcements.',
  },
  crimson_legionnaire_ii: {
    id: 'crimson_legionnaire_ii',
    name: 'Crimson Legionnaire II',
    type: 'unit_upgrade',
    unitType: 'infantry',
    prerequisites: [{ color: 'green', count: 2 }],
    expansion: 'pok',
    factionId: 'mahact',
    description: 'Cost 1/2, Combat 7. After this unit is destroyed, gain 1 commodity or convert 1 of your commodities to a trade good.',
  },

  // Naaz-Rokha Alliance
  supercharge: {
    id: 'supercharge',
    name: 'Supercharge',
    type: 'color',
    color: 'red',
    prerequisites: [{ color: 'red', count: 1 }],
    expansion: 'pok',
    factionId: 'naazrokha',
    description: 'At the start of a combat round, you may exhaust this card to apply +1 to the result of each of your unit\'s combat rolls during this combat round.',
  },
  pre_fab_arcologies: {
    id: 'pre_fab_arcologies',
    name: 'Pre-Fab Arcologies',
    type: 'color',
    color: 'green',
    prerequisites: [{ color: 'green', count: 3 }],
    expansion: 'pok',
    factionId: 'naazrokha',
    description: 'After you explore a planet, ready that planet.',
  },

  // Nomad
  temporal_command_suite: {
    id: 'temporal_command_suite',
    name: 'Temporal Command Suite',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 1 }],
    expansion: 'pok',
    factionId: 'nomad',
    description: 'After any player\'s agent becomes exhausted, you may exhaust this card to ready that agent; if you ready another player\'s agent, you may perform a transaction with that player.',
  },
  memoria_ii: {
    id: 'memoria_ii',
    name: 'Memoria II',
    type: 'unit_upgrade',
    unitType: 'flagship',
    prerequisites: [
      { color: 'blue', count: 1 },
      { color: 'yellow', count: 1 },
    ],
    expansion: 'pok',
    factionId: 'nomad',
    description: 'Cost 8, Combat 5 (x2), Move 2, Capacity 6. SUSTAIN DAMAGE. You may treat this unit as if it were adjacent to systems that contain 1 or more of your mechs. At the start of space combat, you may spend 2 influence; if you do, each other player that has ships in this system may retreat.',
  },

  // Titans of Ul
  saturn_engine_ii: {
    id: 'saturn_engine_ii',
    name: 'Saturn Engine II',
    type: 'unit_upgrade',
    unitType: 'cruiser',
    prerequisites: [
      { color: 'green', count: 1 },
      { color: 'yellow', count: 1 },
      { color: 'red', count: 1 },
    ],
    expansion: 'pok',
    factionId: 'titans',
    description: 'Cost 2, Combat 6, Move 3, Capacity 1. SUSTAIN DAMAGE',
  },
  heltitan_ii: {
    id: 'heltitan_ii',
    name: 'Hel-Titan II',
    type: 'unit_upgrade',
    unitType: 'pds',
    prerequisites: [
      { color: 'yellow', count: 1 },
      { color: 'red', count: 1 },
    ],
    expansion: 'pok',
    factionId: 'titans',
    description: 'PRODUCTION 1, PLANETARY SHIELD, SPACE CANNON 5, SUSTAIN DAMAGE. This unit is treated as both a structure and a ground force. It cannot be transported.',
  },

  // Vuil\'raith Cabal
  vortex: {
    id: 'vortex',
    name: 'Vortex',
    type: 'color',
    color: 'red',
    prerequisites: [{ color: 'red', count: 1 }],
    expansion: 'pok',
    factionId: 'cabal',
    description: 'ACTION: Exhaust this card to choose another player\'s non-structure unit in a system that is adjacent to 1 or more of your space docks. Capture 1 unit of that type from that player\'s reinforcements.',
  },
  dimensional_tear_ii: {
    id: 'dimensional_tear_ii',
    name: 'Dimensional Tear II',
    type: 'unit_upgrade',
    unitType: 'space_dock',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'pok',
    factionId: 'cabal',
    description: 'Move 0, PRODUCTION 7. This unit is placed in a space area. Units can move through systems containing your space docks as if they were adjacent. When you produce units, you may capture 1 unit being produced to gain 1 trade good and place that unit in a system that contains your space dock.',
  },

  // Council Keleres (Codex)
  iihq_modernization: {
    id: 'iihq_modernization',
    name: 'I.I.H.Q. Modernization',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 1 }],
    expansion: 'codex3',
    factionId: 'keleres',
    description: 'You are neighbors with all players that have units or control planets in or adjacent to the Mecatol Rex system. Gain the Custodia Vigilia planet card and its legendary planet ability card.',
  },
  agency_supply_network: {
    id: 'agency_supply_network',
    name: 'Agency Supply Network',
    type: 'color',
    color: 'yellow',
    prerequisites: [{ color: 'yellow', count: 2 }],
    expansion: 'codex3',
    factionId: 'keleres',
    description: 'Whenever you resolve one of your PRODUCTION abilities, you may resolve an additional one of your PRODUCTION abilities in any system.',
  },
};

// Helper function to get all generic (non-faction) technologies
export function getGenericTechnologies(): TechnologyData[] {
  return Object.values(technologies).filter(tech => !tech.factionId);
}

// Helper function to get faction technologies
export function getFactionTechnologies(factionId: string): TechnologyData[] {
  return Object.values(technologies).filter(tech => tech.factionId === factionId);
}

// Helper function to get technologies by color
export function getTechnologiesByColor(color: 'blue' | 'green' | 'yellow' | 'red'): TechnologyData[] {
  return Object.values(technologies).filter(tech => tech.color === color && !tech.factionId);
}

// Helper function to get unit upgrades
export function getUnitUpgrades(factionId?: string): TechnologyData[] {
  return Object.values(technologies).filter(tech => {
    if (tech.type !== 'unit_upgrade') return false;
    if (factionId) {
      // Return generic upgrades or faction-specific upgrades for this faction
      return !tech.factionId || tech.factionId === factionId;
    }
    return !tech.factionId;
  });
}

// Helper function to check if a player meets prerequisites for a tech
export function meetsPrerequisites(
  ownedTechIds: string[],
  targetTechId: string,
  ignoredPrerequisites: number = 0
): boolean {
  const targetTech = technologies[targetTechId];
  if (!targetTech) return false;

  // Count owned techs by color
  const ownedByColor: Record<string, number> = {
    blue: 0,
    green: 0,
    yellow: 0,
    red: 0,
  };

  for (const techId of ownedTechIds) {
    const tech = technologies[techId];
    if (tech && tech.color && tech.type === 'color') {
      ownedByColor[tech.color]++;
    }
  }

  // Check each prerequisite
  let totalPrereqsNeeded = 0;
  let totalPrereqsMet = 0;

  for (const prereq of targetTech.prerequisites) {
    const needed = prereq.count;
    const owned = ownedByColor[prereq.color] || 0;
    totalPrereqsNeeded += needed;
    totalPrereqsMet += Math.min(needed, owned);
  }

  // Account for ignored prerequisites (from tech specialties or abilities)
  const unmetPrereqs = totalPrereqsNeeded - totalPrereqsMet;
  return unmetPrereqs <= ignoredPrerequisites;
}

// Helper function to create a player's technology deck
export function createTechnologyDeck(factionId: string): string[] {
  const deck: string[] = [];

  // Add all generic technologies
  for (const tech of Object.values(technologies)) {
    if (!tech.factionId) {
      deck.push(tech.id);
    }
  }

  // Add faction-specific technologies
  for (const tech of Object.values(technologies)) {
    if (tech.factionId === factionId) {
      deck.push(tech.id);
    }
  }

  return deck;
}
