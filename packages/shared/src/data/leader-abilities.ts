/**
 * TI4 Leader Abilities Data
 * Defines all agent, commander, and hero abilities for every faction
 *
 * Data sourced from: https://twilight-imperium.fandom.com/wiki/Leaders
 */

// Timing types for leader abilities
export type LeaderTiming =
  | 'action'              // ACTION: component action (uses your turn)
  | 'when_activated'      // When you activate a system
  | 'after_activated'     // After you activate a system
  | 'when_other_activates' // When another player activates a system
  | 'when_combat_start'   // At the start of combat
  | 'after_combat'        // After combat ends
  | 'when_producing'      // When you produce units
  | 'after_producing'     // After you produce units
  | 'when_voting'         // During agenda voting
  | 'after_voting'        // After agenda resolves
  | 'when_researching'    // When researching tech
  | 'when_moving'         // During movement step
  | 'when_invading'       // During invasion
  | 'passive'             // Always active when unlocked
  | 'status_phase'        // During status phase
  | 'strategy_phase';     // During strategy phase

// Leader effect types
export type LeaderEffect =
  | { type: 'gain_trade_goods'; amount: number | 'variable' }
  | { type: 'gain_commodities'; amount: number }
  | { type: 'replenish_commodities' }
  | { type: 'draw_action_cards'; count: number }
  | { type: 'draw_secret_objective' }
  | { type: 'combat_bonus'; value: number; unitTypes?: string[]; ground?: boolean; space?: boolean }
  | { type: 'movement_bonus'; value: number }
  | { type: 'capacity_bonus'; value: number }
  | { type: 'production_bonus'; value: number }
  | { type: 'place_units'; units: { type: string; count: number }[] }
  | { type: 'repair_units'; count: number | 'all' }
  | { type: 'exhaust_planet'; targetPlayer?: boolean }
  | { type: 'ready_planet'; targetPlayer?: boolean }
  | { type: 'cancel_hits'; count: number }
  | { type: 'reroll_dice'; count: number }
  | { type: 'extra_votes'; count: number }
  | { type: 'copy_agent' }
  | { type: 'steal_action_card' }
  | { type: 'look_at_hand' }
  | { type: 'swap_command_tokens' }
  | { type: 'custom'; handlerId: string };

// Commander unlock condition types
export type CommanderUnlockCondition =
  | { type: 'control_planets'; count: number; trait?: string }
  | { type: 'control_non_home_planets'; count: number }
  | { type: 'control_mecatol' }
  | { type: 'control_mecatol_or_combat' }
  | { type: 'control_resources'; count: number }
  | { type: 'control_influence'; count: number }
  | { type: 'have_technologies'; count: number; color?: string }
  | { type: 'have_trade_goods'; count: number }
  | { type: 'have_command_tokens'; count: number }
  | { type: 'have_action_cards'; count: number }
  | { type: 'have_laws_in_play'; count: number }
  | { type: 'have_units_in_system'; unitType: string; count: number }
  | { type: 'have_units_total'; unitType: string; count: number }
  | { type: 'have_space_docks'; count: number }
  | { type: 'have_pds'; count: number }
  | { type: 'have_structures'; count: number }
  | { type: 'have_scored_secrets'; count: number }
  | { type: 'have_mechs_in_systems'; count: number }
  | { type: 'units_in_others_home'; playerCount: number }
  | { type: 'units_in_wormhole_systems'; count: number }
  | { type: 'neighbor_all_players' }
  | { type: 'custom'; checkerId: string };

// Leader ability definition
export interface LeaderAbility {
  id: string;
  name: string;
  factionId: string;
  type: 'agent' | 'commander' | 'hero';
  timing: LeaderTiming;
  description: string;
  effect: LeaderEffect;
  // Only for commanders
  unlockCondition?: CommanderUnlockCondition;
  // Only for agents - can target other players
  canTargetOthers?: boolean;
  // Only for agents with ACTION timing
  isComponentAction?: boolean;
}

/**
 * All leader abilities indexed by leader ID
 * IDs match those in leaders.ts
 */
export const LEADER_ABILITIES: Record<string, LeaderAbility> = {
  // ============================================
  // ARBOREC
  // Agent: Letani Ospha
  // Commander: Dirzuga Rophal
  // Hero: Letani Miasmiala
  // ============================================
  letani_ospha: {
    id: 'letani_ospha',
    name: 'Letani Ospha',
    factionId: 'arborec',
    type: 'agent',
    timing: 'when_producing',
    description: 'When you or another player produces units: You may exhaust this card to place 1 infantry from your reinforcements on a planet that player controls.',
    effect: { type: 'place_units', units: [{ type: 'infantry', count: 1 }] },
    canTargetOthers: true,
  },
  dirzuga_rophal: {
    id: 'dirzuga_rophal',
    name: 'Dirzuga Rophal',
    factionId: 'arborec',
    type: 'commander',
    timing: 'passive',
    description: 'After you produce units, you may produce 1 additional infantry for its cost.',
    effect: { type: 'custom', handlerId: 'arborec_commander' },
    // UNLOCK: Have 12 ground forces on planets you control
    unlockCondition: { type: 'have_units_total', unitType: 'infantry', count: 12 },
  },
  letani_miasmiala: {
    id: 'letani_miasmiala',
    name: 'Letani Miasmiala',
    factionId: 'arborec',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place 2 infantry and 1 mech on each planet you control. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'arborec_hero' },
    isComponentAction: true,
  },

  // ============================================
  // GHOSTS OF CREUSS
  // Agent: Emissary Taivra
  // Commander: Sai Seravus
  // Hero: Riftwalker Me'ian
  // ============================================
  emissary_taivra: {
    id: 'emissary_taivra',
    name: 'Emissary Taivra',
    factionId: 'creuss',
    type: 'agent',
    timing: 'after_activated',
    description: 'After a player activates a system that contains or is adjacent to a wormhole: You may exhaust this card to allow that player to move 1 ship to or from an adjacent system that does not contain any of their ships.',
    effect: { type: 'custom', handlerId: 'creuss_agent' },
    canTargetOthers: true,
  },
  sai_seravus: {
    id: 'sai_seravus',
    name: 'Sai Seravus',
    factionId: 'creuss',
    type: 'commander',
    timing: 'passive',
    description: 'Each system that contains an alpha or beta wormhole is adjacent to each other.',
    effect: { type: 'custom', handlerId: 'creuss_commander' },
    // UNLOCK: Have units in 3 systems that contain alpha or beta wormholes
    unlockCondition: { type: 'units_in_wormhole_systems', count: 3 },
  },
  riftwalker_meian: {
    id: 'riftwalker_meian',
    name: "Riftwalker Me'ian",
    factionId: 'creuss',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place the Creuss Gate in a system that contains a wormhole and no other players\' ships. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'creuss_hero' },
    isComponentAction: true,
  },

  // ============================================
  // EMIRATES OF HACAN
  // Agent: Carth of Golden Sands
  // Commander: Gila the Silvertongue
  // Hero: Harrugh Gefhara
  // ============================================
  carth_of_golden_sands: {
    id: 'carth_of_golden_sands',
    name: 'Carth of Golden Sands',
    factionId: 'hacan',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card to choose another player. You and that player each gain 2 commodities.',
    effect: { type: 'gain_commodities', amount: 2 },
    canTargetOthers: true,
    isComponentAction: true,
  },
  gila_the_silvertongue: {
    id: 'gila_the_silvertongue',
    name: 'Gila the Silvertongue',
    factionId: 'hacan',
    type: 'commander',
    timing: 'passive',
    description: 'Your commodity value is increased by 1 for each player that is your neighbor.',
    effect: { type: 'custom', handlerId: 'hacan_commander' },
    // UNLOCK: Have 10 trade goods
    unlockCondition: { type: 'have_trade_goods', count: 10 },
  },
  harrugh_gefhara: {
    id: 'harrugh_gefhara',
    name: 'Harrugh Gefhara',
    factionId: 'hacan',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Each other player gives you all of their trade goods. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'hacan_hero' },
    isComponentAction: true,
  },

  // ============================================
  // UNIVERSITIES OF JOL-NAR
  // Agent: Doctor Sucaban
  // Commander: Ta Zern
  // Hero: Rin, The Master's Legacy
  // ============================================
  doctor_sucaban: {
    id: 'doctor_sucaban',
    name: 'Doctor Sucaban',
    factionId: 'jolnar',
    type: 'agent',
    timing: 'when_researching',
    description: 'When you or another player researches a technology: You may exhaust this card. If you do, that player draws 1 action card.',
    effect: { type: 'draw_action_cards', count: 1 },
    canTargetOthers: true,
  },
  ta_zern: {
    id: 'ta_zern',
    name: 'Ta Zern',
    factionId: 'jolnar',
    type: 'commander',
    timing: 'when_researching',
    description: 'When you research a technology, you may exhaust 1 planet to ignore 1 prerequisite.',
    effect: { type: 'custom', handlerId: 'jolnar_commander' },
    // UNLOCK: Own 8 technologies
    unlockCondition: { type: 'have_technologies', count: 8 },
  },
  rin_the_masters_legacy: {
    id: 'rin_the_masters_legacy',
    name: "Rin, The Master's Legacy",
    factionId: 'jolnar',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Research 3 technologies. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'jolnar_hero' },
    isComponentAction: true,
  },

  // ============================================
  // L1Z1X MINDNET
  // Agent: I48S
  // Commander: 2RAM
  // Hero: The Helmsman
  // ============================================
  i48s: {
    id: 'i48s',
    name: 'I48S',
    factionId: 'l1z1x',
    type: 'agent',
    timing: 'when_combat_start',
    description: 'At the start of a space combat: You may exhaust this card to choose 1 ship of a player in that combat. That ship cannot be destroyed during this combat.',
    effect: { type: 'custom', handlerId: 'l1z1x_agent' },
    canTargetOthers: true,
  },
  '2ram': {
    id: '2ram',
    name: '2RAM',
    factionId: 'l1z1x',
    type: 'commander',
    timing: 'passive',
    description: 'Each of your dreadnoughts gains BOMBARDMENT 5.',
    effect: { type: 'custom', handlerId: 'l1z1x_commander' },
    unlockCondition: { type: 'have_units_total', unitType: 'dreadnought', count: 4 },
  },
  the_helmsman: {
    id: 'the_helmsman',
    name: 'The Helmsman',
    factionId: 'l1z1x',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Choose 1 system other than the Mecatol Rex system. Destroy all other players\' infantry and fighters in that system. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'l1z1x_hero' },
    isComponentAction: true,
  },

  // ============================================
  // BARONY OF LETNEV
  // Agent: Viscount Unlenn
  // Commander: Rear Admiral Farran
  // Hero: Darktalon Treilla
  // ============================================
  viscount_unlenn: {
    id: 'viscount_unlenn',
    name: 'Viscount Unlenn',
    factionId: 'letnev',
    type: 'agent',
    timing: 'after_combat',
    description: 'At the end of a player\'s turn: You may exhaust this card to allow that player to gain 1 trade good or repair 1 of their units.',
    effect: { type: 'custom', handlerId: 'letnev_agent' },
    canTargetOthers: true,
  },
  rear_admiral_farran: {
    id: 'rear_admiral_farran',
    name: 'Rear Admiral Farran',
    factionId: 'letnev',
    type: 'commander',
    timing: 'passive',
    description: 'When 1 or more of your units make a roll for a unit ability, you may spend 1 trade good to reroll those dice.',
    effect: { type: 'custom', handlerId: 'letnev_commander' },
    // UNLOCK: Have 5 non-fighter ships in 1 system
    unlockCondition: { type: 'have_units_in_system', unitType: 'ship', count: 5 },
  },
  darktalon_treilla: {
    id: 'darktalon_treilla',
    name: 'Darktalon Treilla',
    factionId: 'letnev',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place the Dark Talon token on the game board. All systems adjacent to the Dark Talon token are adjacent to each other and have no defined boundaries. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'letnev_hero' },
    isComponentAction: true,
  },

  // ============================================
  // MENTAK COALITION
  // Agent: Suffi An
  // Commander: S'Ula Mentarion
  // Hero: Ipswitch, Loose Cannon
  // ============================================
  suffi_an: {
    id: 'suffi_an',
    name: 'Suffi An',
    factionId: 'mentak',
    type: 'agent',
    timing: 'when_other_activates',
    description: 'When another player activates a system: You may exhaust this card to allow that player to remove 1 of their command tokens from the game board and place it in their reinforcements.',
    effect: { type: 'custom', handlerId: 'mentak_agent' },
    canTargetOthers: true,
  },
  sula_mentarion: {
    id: 'sula_mentarion',
    name: "S'Ula Mentarion",
    factionId: 'mentak',
    type: 'commander',
    timing: 'passive',
    description: 'Before you resolve the AMBUSH ability of 1 or more of your units, you may apply +2 to the result of each of your AMBUSH rolls.',
    effect: { type: 'custom', handlerId: 'mentak_commander' },
    // UNLOCK: Have 4 cruisers on the game board
    unlockCondition: { type: 'have_units_total', unitType: 'cruiser', count: 4 },
  },
  ipswitch_loose_cannon: {
    id: 'ipswitch_loose_cannon',
    name: 'Ipswitch, Loose Cannon',
    factionId: 'mentak',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Choose 1 planet in a system that contains your units. Gain trade goods equal to that planet\'s combined resource and influence values. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'mentak_hero' },
    isComponentAction: true,
  },

  // ============================================
  // EMBERS OF MUAAT
  // Agent: Umbat
  // Commander: Magmus
  // Hero: Adjudicator Ba'al
  // ============================================
  umbat: {
    id: 'umbat',
    name: 'Umbat',
    factionId: 'muaat',
    type: 'agent',
    timing: 'when_producing',
    description: 'At the start of a player\'s turn: You may exhaust this card to allow that player to produce 1 unit in a system that contains their war sun.',
    effect: { type: 'custom', handlerId: 'muaat_agent' },
    canTargetOthers: true,
  },
  magmus: {
    id: 'magmus',
    name: 'Magmus',
    factionId: 'muaat',
    type: 'commander',
    timing: 'passive',
    description: 'Your war suns gain PRODUCTION 5.',
    effect: { type: 'custom', handlerId: 'muaat_commander' },
    // UNLOCK: Produce a War Sun (triggered by production action)
    unlockCondition: { type: 'custom', checkerId: 'muaat_produced_war_sun' },
  },
  adjudicator_baal: {
    id: 'adjudicator_baal',
    name: "Adjudicator Ba'al",
    factionId: 'muaat',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place 1 war sun from your reinforcements in a non-home system that contains 1 or more of your infantry. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'muaat_hero' },
    isComponentAction: true,
  },

  // ============================================
  // NAALU COLLECTIVE
  // Agent: Z'eu
  // Commander: M'aban
  // Hero: The Oracle
  // ============================================
  zeu: {
    id: 'zeu',
    name: "Z'eu",
    factionId: 'naalu',
    type: 'agent',
    timing: 'when_combat_start',
    description: 'At the start of ground combat: You may exhaust this card to produce 1 hit that must be assigned to a non-fighter ship.',
    effect: { type: 'custom', handlerId: 'naalu_agent' },
    canTargetOthers: false,
  },
  maban: {
    id: 'maban',
    name: "M'aban",
    factionId: 'naalu',
    type: 'commander',
    timing: 'passive',
    description: 'You may look at your opponents\' secret objectives at any time.',
    effect: { type: 'custom', handlerId: 'naalu_commander' },
    // UNLOCK: Have 12 fighters on the game board
    unlockCondition: { type: 'have_units_total', unitType: 'fighter', count: 12 },
  },
  the_oracle: {
    id: 'the_oracle',
    name: 'The Oracle',
    factionId: 'naalu',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: During this game round, other players cannot play action cards. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'naalu_hero' },
    isComponentAction: true,
  },

  // ============================================
  // NEKRO VIRUS
  // Agent: Nekro Malleon
  // Commander: Nekro Acidos
  // Hero: UNIT.DSGN.FLAYESH
  // ============================================
  nekro_malleon: {
    id: 'nekro_malleon',
    name: 'Nekro Malleon',
    factionId: 'nekro',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card to choose 1 player. That player may exhaust 1 of their agents to resolve its ability. Then, you may resolve that agent\'s ability.',
    effect: { type: 'copy_agent' },
    canTargetOthers: true,
    isComponentAction: true,
  },
  nekro_acidos: {
    id: 'nekro_acidos',
    name: 'Nekro Acidos',
    factionId: 'nekro',
    type: 'commander',
    timing: 'passive',
    description: 'After you gain a technology from another player, you may gain 1 command token.',
    effect: { type: 'custom', handlerId: 'nekro_commander' },
    unlockCondition: { type: 'have_technologies', count: 3 },
  },
  unitdsgnflayesh: {
    id: 'unitdsgnflayesh',
    name: 'UNIT.DSGN.FLAYESH',
    factionId: 'nekro',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: You may research 2 technologies that are owned by other players. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'nekro_hero' },
    isComponentAction: true,
  },

  // ============================================
  // SARDAKK N'ORR
  // Agent: T'ro
  // Commander: G'hom Sek'kus
  // Hero: Sh'val, Harbinger
  // ============================================
  tro: {
    id: 'tro',
    name: "T'ro",
    factionId: 'sardakk',
    type: 'agent',
    timing: 'when_combat_start',
    description: 'At the start of a ground combat round: You may exhaust this card to choose 1 ground force in that combat. That ground force rolls 1 additional die during that combat round.',
    effect: { type: 'reroll_dice', count: 1 },
    canTargetOthers: true,
  },
  ghom_sekkus: {
    id: 'ghom_sekkus',
    name: "G'hom Sek'kus",
    factionId: 'sardakk',
    type: 'commander',
    timing: 'passive',
    description: 'Your units apply +1 to the result of each of their combat rolls during ground combat.',
    effect: { type: 'combat_bonus', value: 1, ground: true },
    // UNLOCK: Control 5 planets in non-home systems
    unlockCondition: { type: 'control_non_home_planets', count: 5 },
  },
  shval_harbinger: {
    id: 'shval_harbinger',
    name: "Sh'val, Harbinger",
    factionId: 'sardakk',
    type: 'hero',
    timing: 'when_combat_start',
    description: 'At the start of space combat: Destroy all of your opponent\'s fighters in this system. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'sardakk_hero' },
  },

  // ============================================
  // CLAN OF SAAR
  // Agent: Captain Mendosa
  // Commander: Rowl Sarrig
  // Hero: Gurno Aggero
  // ============================================
  captain_mendosa: {
    id: 'captain_mendosa',
    name: 'Captain Mendosa',
    factionId: 'saar',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card and choose a player\'s planet. Exhaust or ready that planet.',
    effect: { type: 'custom', handlerId: 'saar_agent' },
    canTargetOthers: true,
    isComponentAction: true,
  },
  rowl_sarrig: {
    id: 'rowl_sarrig',
    name: 'Rowl Sarrig',
    factionId: 'saar',
    type: 'commander',
    timing: 'passive',
    description: 'Your space docks can produce units in systems adjacent to systems that contain your space docks.',
    effect: { type: 'custom', handlerId: 'saar_commander' },
    unlockCondition: { type: 'have_space_docks', count: 3 },
  },
  gurno_aggero: {
    id: 'gurno_aggero',
    name: 'Gurno Aggero',
    factionId: 'saar',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Gain 1 relic. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'saar_hero' },
    isComponentAction: true,
  },

  // ============================================
  // FEDERATION OF SOL
  // Agent: Evelyn Delouis
  // Commander: Claire Gibson
  // Hero: Jace X. 4th Air Legion
  // ============================================
  evelyn_delouis: {
    id: 'evelyn_delouis',
    name: 'Evelyn Delouis',
    factionId: 'sol',
    type: 'agent',
    timing: 'when_other_activates',
    description: 'When another player activates a system that contains 1 or more of your ships: You may exhaust this card. If you do, you gain 2 trade goods.',
    effect: { type: 'gain_trade_goods', amount: 2 },
    canTargetOthers: false,
  },
  claire_gibson: {
    id: 'claire_gibson',
    name: 'Claire Gibson',
    factionId: 'sol',
    type: 'commander',
    timing: 'when_producing',
    description: 'After you produce 1 or more infantry, produce 1 infantry in the same system.',
    effect: { type: 'place_units', units: [{ type: 'infantry', count: 1 }] },
    // UNLOCK: Control planets that have a combined total of at least 12 resources
    unlockCondition: { type: 'control_resources', count: 12 },
  },
  jace_x_4th_air_legion: {
    id: 'jace_x_4th_air_legion',
    name: 'Jace X. 4th Air Legion',
    factionId: 'sol',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place 1 infantry from your reinforcements on each planet you control. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'sol_hero' },
    isComponentAction: true,
  },

  // ============================================
  // WINNU
  // Agent: Berekar Berekon
  // Commander: Rickar Rickani
  // Hero: Mathis Mathinus
  // ============================================
  berekar_berekon: {
    id: 'berekar_berekon',
    name: 'Berekar Berekon',
    factionId: 'winnu',
    type: 'agent',
    timing: 'when_other_activates',
    description: 'When a player activates a system that contains the Mecatol Rex or your ships: You may exhaust this card to allow that player to gain 1 trade good.',
    effect: { type: 'gain_trade_goods', amount: 1 },
    canTargetOthers: true,
  },
  rickar_rickani: {
    id: 'rickar_rickani',
    name: 'Rickar Rickani',
    factionId: 'winnu',
    type: 'commander',
    timing: 'passive',
    description: 'You do not have to pay any resources when you use the secondary ability of the "Technology" strategy card.',
    effect: { type: 'custom', handlerId: 'winnu_commander' },
    // UNLOCK: Control Mecatol Rex or enter into combat in the Mecatol Rex system
    unlockCondition: { type: 'control_mecatol_or_combat' },
  },
  mathis_mathinus: {
    id: 'mathis_mathinus',
    name: 'Mathis Mathinus',
    factionId: 'winnu',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: For each technology you own, ready 1 planet you control. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'winnu_hero' },
    isComponentAction: true,
  },

  // ============================================
  // XXCHA KINGDOM
  // Agent: Ggrocuto Rinn
  // Commander: Elder Qanoj
  // Hero: Xxekir Grom
  // ============================================
  ggrocuto_rinn: {
    id: 'ggrocuto_rinn',
    name: 'Ggrocuto Rinn',
    factionId: 'xxcha',
    type: 'agent',
    timing: 'when_voting',
    description: 'When players would vote on an agenda: You may exhaust this card to choose a player. That player casts an additional number of votes equal to their maximum fleet supply during this agenda.',
    effect: { type: 'extra_votes', count: -1 }, // -1 means fleet supply
    canTargetOthers: true,
  },
  elder_qanoj: {
    id: 'elder_qanoj',
    name: 'Elder Qanoj',
    factionId: 'xxcha',
    type: 'commander',
    timing: 'when_voting',
    description: 'After the speaker reveals an agenda: You may cast 1 vote from a ready planet you control.',
    effect: { type: 'custom', handlerId: 'xxcha_commander' },
    // UNLOCK: Control planets that have a combined total of at least 12 influence
    unlockCondition: { type: 'control_influence', count: 12 },
  },
  xxekir_grom: {
    id: 'xxekir_grom',
    name: 'Xxekir Grom',
    factionId: 'xxcha',
    type: 'hero',
    timing: 'when_voting',
    description: 'When an agenda is revealed: You may cast your votes for an outcome of your choice. If you do, resolve the agenda as if that outcome received the most votes. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'xxcha_hero' },
  },

  // ============================================
  // YIN BROTHERHOOD
  // Agent: Brother Milor
  // Commander: Brother Omar
  // Hero: Dannel of the Tenth
  // ============================================
  brother_milor: {
    id: 'brother_milor',
    name: 'Brother Milor',
    factionId: 'yin',
    type: 'agent',
    timing: 'when_producing',
    description: 'After a player produces 1 or more ships: You may exhaust this card to place 1 infantry from your reinforcements on a planet that player controls.',
    effect: { type: 'place_units', units: [{ type: 'infantry', count: 1 }] },
    canTargetOthers: true,
  },
  brother_omar: {
    id: 'brother_omar',
    name: 'Brother Omar',
    factionId: 'yin',
    type: 'commander',
    timing: 'passive',
    description: 'When you commit 1 or more ground forces to a planet, you may place 1 infantry from your reinforcements on that planet.',
    effect: { type: 'place_units', units: [{ type: 'infantry', count: 1 }] },
    // UNLOCK: Use your Indoctrination faction ability
    unlockCondition: { type: 'custom', checkerId: 'yin_indoctrination_used' },
  },
  dannel_of_the_tenth: {
    id: 'dannel_of_the_tenth',
    name: 'Dannel of the Tenth',
    factionId: 'yin',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: For each planet that has a legendary ability or is a home planet other than your own: Replace all of 1 opponent\'s infantry on that planet with infantry from your reinforcements. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'yin_hero' },
    isComponentAction: true,
  },

  // ============================================
  // YSSARIL TRIBES
  // Agent: Clever Clever Ssruu
  // Commander: So Ata
  // Hero: Kyver, Blade and Key
  // ============================================
  ssruu: {
    id: 'ssruu',
    name: 'Clever Clever Ssruu',
    factionId: 'yssaril',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card to choose a player (other than yourself). That player shows you 1 action card from their hand. You may take that card.',
    effect: { type: 'steal_action_card' },
    canTargetOthers: true,
    isComponentAction: true,
  },
  so_ata: {
    id: 'so_ata',
    name: 'So Ata',
    factionId: 'yssaril',
    type: 'commander',
    timing: 'passive',
    description: 'You may have any number of action cards in your hand.',
    effect: { type: 'custom', handlerId: 'yssaril_commander' },
    // UNLOCK: Have 7 action cards
    unlockCondition: { type: 'have_action_cards', count: 7 },
  },
  kyver_blade_and_key: {
    id: 'kyver_blade_and_key',
    name: 'Kyver, Blade and Key',
    factionId: 'yssaril',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Look at all other players\' hands of action cards. For each player, you may either take 1 action card, or give that player 1 action card from your hand. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'yssaril_hero' },
    isComponentAction: true,
  },

  // ============================================
  // ARGENT FLIGHT (PoK)
  // Agent: Trilossa Aun Mirik
  // Commander: Trrakan Aun Zulok
  // Hero: Mirik Aun Sissiri
  // ============================================
  trilossa_aun_mirik: {
    id: 'trilossa_aun_mirik',
    name: 'Trilossa Aun Mirik',
    factionId: 'argent',
    type: 'agent',
    timing: 'when_combat_start',
    description: 'At the start of space combat: You may exhaust this card to choose 1 unit in the active system. That unit cannot be destroyed during this combat round.',
    effect: { type: 'custom', handlerId: 'argent_agent' },
    canTargetOthers: true,
  },
  trrakan_aun_zulok: {
    id: 'trrakan_aun_zulok',
    name: 'Trrakan Aun Zulok',
    factionId: 'argent',
    type: 'commander',
    timing: 'passive',
    description: 'You may use the ANTI-FIGHTER BARRAGE ability of your PDS units even if not in the active system.',
    effect: { type: 'custom', handlerId: 'argent_commander' },
    // UNLOCK: Have 6 units that have ANTI-FIGHTER BARRAGE, SPACE CANNON or BOMBARDMENT
    unlockCondition: { type: 'custom', checkerId: 'argent_ability_units' },
  },
  mirik_aun_sissiri: {
    id: 'mirik_aun_sissiri',
    name: 'Mirik Aun Sissiri',
    factionId: 'argent',
    type: 'hero',
    timing: 'when_voting',
    description: 'At the start of the agenda phase: You may purge this card to reveal all cards in the agenda deck, choose 2 agendas, and place those agendas on top of the agenda deck in any order. Place the rest of the cards on the bottom of the agenda deck in any order.',
    effect: { type: 'custom', handlerId: 'argent_hero' },
  },

  // ============================================
  // EMPYREAN (PoK)
  // Agent: Acamar
  // Commander: Xuange
  // Hero: Conservator Procyon
  // ============================================
  acamar: {
    id: 'acamar',
    name: 'Acamar',
    factionId: 'empyrean',
    type: 'agent',
    timing: 'when_other_activates',
    description: 'After another player activates a system that contains a planet you control: You may exhaust this card. If you do, that player places 1 trade good from the supply on that planet; units on this planet cannot be produced.',
    effect: { type: 'custom', handlerId: 'empyrean_agent' },
    canTargetOthers: false,
  },
  xuange: {
    id: 'xuange',
    name: 'Xuange',
    factionId: 'empyrean',
    type: 'commander',
    timing: 'passive',
    description: 'After you perform a transaction with a player, you may explore 1 planet that player controls.',
    effect: { type: 'custom', handlerId: 'empyrean_commander' },
    // UNLOCK: Be neighbors with all other players
    unlockCondition: { type: 'neighbor_all_players' },
  },
  conservator_procyon: {
    id: 'conservator_procyon',
    name: 'Conservator Procyon',
    factionId: 'empyrean',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place the Shield Paling token in the active system. Units in that system cannot be destroyed by BOMBARDMENT, SPACE CANNON, or action cards. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'empyrean_hero' },
    isComponentAction: true,
  },

  // ============================================
  // MAHACT GENE-SORCERERS (PoK)
  // Agent: Jae Mir Kan
  // Commander: Il Na Viroset
  // Hero: Airo Shir Aur
  // ============================================
  jae_mir_kan: {
    id: 'jae_mir_kan',
    name: 'Jae Mir Kan',
    factionId: 'mahact',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card to choose a player. Return 1 of their command tokens from the game board to their reinforcements. Then, place 1 of your command tokens from your reinforcements in a system that does not already contain 1 of your command tokens.',
    effect: { type: 'swap_command_tokens' },
    canTargetOthers: true,
    isComponentAction: true,
  },
  il_na_viroset: {
    id: 'il_na_viroset',
    name: 'Il Na Viroset',
    factionId: 'mahact',
    type: 'commander',
    timing: 'passive',
    description: 'Your mechs are not affected by other players\' abilities that do not cause combat.',
    effect: { type: 'custom', handlerId: 'mahact_commander' },
    unlockCondition: { type: 'custom', checkerId: 'mahact_command_tokens' },
  },
  airo_shir_aur: {
    id: 'airo_shir_aur',
    name: 'Airo Shir Aur',
    factionId: 'mahact',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Purge any number of your command tokens from the game board. For each command token purged, gain 1 trade good and 1 command token. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'mahact_hero' },
    isComponentAction: true,
  },

  // ============================================
  // NAAZ-ROKHA ALLIANCE (PoK)
  // Agent: Garv and Gunn
  // Commander: Dart and Tai
  // Hero: Hesh and Prit
  // ============================================
  garv_and_gunn: {
    id: 'garv_and_gunn',
    name: 'Garv and Gunn',
    factionId: 'naazrokha',
    type: 'agent',
    timing: 'when_producing',
    description: 'After a player produces 1 or more mechs: You may exhaust this card. If you do, that player may place 1 mech from their reinforcements on a planet they control in the same system.',
    effect: { type: 'place_units', units: [{ type: 'mech', count: 1 }] },
    canTargetOthers: true,
  },
  dart_and_tai: {
    id: 'dart_and_tai',
    name: 'Dart and Tai',
    factionId: 'naazrokha',
    type: 'commander',
    timing: 'passive',
    description: 'When you explore a planet, you may explore it again.',
    effect: { type: 'custom', handlerId: 'naazrokha_commander' },
    // UNLOCK: Have 3 mechs in 3 different systems
    unlockCondition: { type: 'have_mechs_in_systems', count: 3 },
  },
  hesh_and_prit: {
    id: 'hesh_and_prit',
    name: 'Hesh and Prit',
    factionId: 'naazrokha',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Gain 1 relic from the relic deck. For each mech you have on the game board, draw 1 exploration card from a deck of your choice; purge each exploration card that has the "attach" ability. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'naazrokha_hero' },
    isComponentAction: true,
  },

  // ============================================
  // NOMAD (PoK)
  // Has 3 Agents: Artuno the Betrayer, Field Marshall Mercer, The Thundarian
  // Commander: Navarch Feng
  // Hero: Ahk-Syl Siven
  // ============================================
  artuno_the_betrayer: {
    id: 'artuno_the_betrayer',
    name: 'Artuno the Betrayer',
    factionId: 'nomad',
    type: 'agent',
    timing: 'when_other_activates',
    description: 'After another player activates a system: You may exhaust this card to allow that player to place 1 cruiser from their reinforcements in the active system.',
    effect: { type: 'place_units', units: [{ type: 'cruiser', count: 1 }] },
    canTargetOthers: true,
  },
  field_marshal_mercer: {
    id: 'field_marshal_mercer',
    name: 'Field Marshal Mercer',
    factionId: 'nomad',
    type: 'agent',
    timing: 'when_combat_start',
    description: 'At the start of a combat: You may exhaust this card to choose 1 of your units in the active system. That unit rolls 1 additional die during this combat.',
    effect: { type: 'custom', handlerId: 'nomad_agent_mercer' },
    canTargetOthers: false,
  },
  the_thundarian: {
    id: 'the_thundarian',
    name: 'The Thundarian',
    factionId: 'nomad',
    type: 'agent',
    timing: 'when_moving',
    description: 'At the start of a player\'s turn: You may exhaust this card. If you do, during this turn, that player\'s ships may move through systems that contain other players\' ships.',
    effect: { type: 'custom', handlerId: 'nomad_agent_thundarian' },
    canTargetOthers: true,
  },
  navarch_feng: {
    id: 'navarch_feng',
    name: 'Navarch Feng',
    factionId: 'nomad',
    type: 'commander',
    timing: 'passive',
    description: 'When you produce units in a system that does not contain any of your space docks, reduce the combined cost of those units by 1 for each unit you already have in that system.',
    effect: { type: 'custom', handlerId: 'nomad_commander' },
    // UNLOCK: Have 1 scored secret objective
    unlockCondition: { type: 'have_scored_secrets', count: 1 },
  },
  ahksyl_siven: {
    id: 'ahksyl_siven',
    name: 'Ahk-Syl Siven',
    factionId: 'nomad',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place your flagship in any system on the game board that does not contain another player\'s ships. Move any number of your ships from other systems into the flagship\'s system. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'nomad_hero' },
    isComponentAction: true,
  },

  // ============================================
  // TITANS OF UL (PoK)
  // Agent: Tellurian
  // Commander: Tungstantus
  // Hero: Ul the Progenitor (special - attaches to Elysium)
  // ============================================
  tellurian: {
    id: 'tellurian',
    name: 'Tellurian',
    factionId: 'titans',
    type: 'agent',
    timing: 'when_combat_start',
    description: 'When a player\'s unit uses BOMBARDMENT or SPACE CANNON: You may exhaust this card. If you do, for each hit result that unit produces against your units, that player must destroy 1 of their infantry on a planet in or adjacent to that unit\'s system.',
    effect: { type: 'custom', handlerId: 'titans_agent' },
    canTargetOthers: false,
  },
  tungstantus: {
    id: 'tungstantus',
    name: 'Tungstantus',
    factionId: 'titans',
    type: 'commander',
    timing: 'passive',
    description: 'When you would be dealt a damage from a source other than combat, cancel that damage.',
    effect: { type: 'custom', handlerId: 'titans_commander' },
    // UNLOCK: Have 5 structures on the game board
    unlockCondition: { type: 'have_structures', count: 5 },
  },
  ul_the_progenitor: {
    id: 'ul_the_progenitor',
    name: 'Ul the Progenitor',
    factionId: 'titans',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Attach this card to the planet Elysium. This planet\'s resource and influence values are each increased by 3. Ground forces on this planet cannot be destroyed.',
    effect: { type: 'custom', handlerId: 'titans_hero' },
    isComponentAction: true,
  },

  // ============================================
  // VUIL'RAITH CABAL (PoK)
  // Agent: It Feeds on Carrion
  // Commander: That Which Molds Flesh
  // Hero: Hecatoncheires
  // ============================================
  it_feeds_on_carrion: {
    id: 'it_feeds_on_carrion',
    name: 'It Feeds on Carrion',
    factionId: 'cabal',
    type: 'agent',
    timing: 'after_combat',
    description: 'After a player wins a combat: You may exhaust this card. If you do, that player may capture 1 unit that was destroyed during that combat.',
    effect: { type: 'custom', handlerId: 'cabal_agent' },
    canTargetOthers: true,
  },
  that_which_molds_flesh: {
    id: 'that_which_molds_flesh',
    name: 'That Which Molds Flesh',
    factionId: 'cabal',
    type: 'commander',
    timing: 'passive',
    description: 'When you produce units, you may destroy any number of your captured units. For each unit destroyed, reduce the combined cost of the units you produce by the cost of that destroyed unit.',
    effect: { type: 'custom', handlerId: 'cabal_commander' },
    // UNLOCK: Have units in 3 Gravity Rifts
    unlockCondition: { type: 'custom', checkerId: 'cabal_gravity_rifts' },
  },
  hecatoncheires: {
    id: 'hecatoncheires',
    name: 'Hecatoncheires',
    factionId: 'cabal',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Capture all non-structure enemy units on planets you control. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'cabal_hero' },
    isComponentAction: true,
  },

  // ============================================
  // COUNCIL KELERES (Codex III)
  // Agent: Xander Alexin Victori III
  // Commander: Odlynn Myrr
  // Hero: Kuuasi Aun Jalatai (Argent), Harka Leeds (Mentak), or Odlynn Myrr (Xxcha)
  // ============================================
  xander_alexin_victori_iii: {
    id: 'xander_alexin_victori_iii',
    name: 'Xander Alexin Victori III',
    factionId: 'keleres',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card and choose a player. That player may spend any number of commodities to gain an equal number of trade goods.',
    effect: { type: 'custom', handlerId: 'keleres_agent' },
    canTargetOthers: true,
    isComponentAction: true,
  },
  odlynn_myrr: {
    id: 'odlynn_myrr',
    name: 'Odlynn Myrr',
    factionId: 'keleres',
    type: 'commander',
    timing: 'passive',
    description: 'When you cast at least 1 vote, cast 1 additional vote for each other player\'s planet you control.',
    effect: { type: 'custom', handlerId: 'keleres_commander' },
    // UNLOCK: Spend 1 trade good after you play an action card that has a component action
    unlockCondition: { type: 'custom', checkerId: 'keleres_component_action' },
  },
  // Keleres has 3 possible heroes depending on sub-faction
  kuuasi_aun_jalatai: {
    id: 'kuuasi_aun_jalatai',
    name: 'Kuuasi Aun Jalatai',
    factionId: 'keleres',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Each other player must give you 1 promissory note from their hand. You may trade any promissory notes in your hand to any player. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'keleres_hero_argent' },
    isComponentAction: true,
  },
  harka_leeds: {
    id: 'harka_leeds',
    name: 'Harka Leeds',
    factionId: 'keleres',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Each other player must give you 1 promissory note from their hand. You may trade any promissory notes in your hand to any player. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'keleres_hero_mentak' },
    isComponentAction: true,
  },
  odlynn_myrr_hero: {
    id: 'odlynn_myrr_hero',
    name: 'Odlynn Myrr',
    factionId: 'keleres',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Each other player must give you 1 promissory note from their hand. You may trade any promissory notes in your hand to any player. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'keleres_hero_xxcha' },
    isComponentAction: true,
  },

  // ============================================
  // LAST BASTION (Thunder's Edge)
  // Agent: Dame Briar
  // Commander: Nip and Tuck
  // Hero: Lyra Keen
  // ============================================
  dame_briar: {
    id: 'dame_briar',
    name: 'Dame Briar',
    factionId: 'last_bastion',
    type: 'agent',
    timing: 'after_combat',
    description: 'When a player\'s unit is destroyed: You may exhaust this card to galvanize another of that player\'s units in the destroyed unit\'s system.',
    effect: { type: 'custom', handlerId: 'last_bastion_agent' },
    canTargetOthers: true,
  },
  nip_and_tuck: {
    id: 'nip_and_tuck',
    name: 'Nip and Tuck',
    factionId: 'last_bastion',
    type: 'commander',
    timing: 'passive',
    description: 'Your action cards cannot be canceled by Sabotage action cards. The Nekro Virus cannot place assimilator tokens on your components.',
    effect: { type: 'custom', handlerId: 'last_bastion_commander' },
    // UNLOCK: Have 3 or more galvanized units
    unlockCondition: { type: 'custom', checkerId: 'last_bastion_galvanized_units' },
  },
  lyra_keen: {
    id: 'lyra_keen',
    name: 'Lyra Keen',
    factionId: 'last_bastion',
    type: 'hero',
    timing: 'after_combat',
    description: 'When one of your galvanized units is destroyed: You may purge this card to roll 1 die for each opponent unit in its system; if the result is equal to or greater than the galvanized unit\'s combat value, destroy that unit.',
    effect: { type: 'custom', handlerId: 'last_bastion_hero' },
  },

  // ============================================
  // DEEPWROUGHT SCHOLARATE (Thunder's Edge)
  // Agent: Dr. Carrina
  // Commander: Aello
  // Hero: Ta Zern
  // ============================================
  dr_carrina: {
    id: 'dr_carrina',
    name: 'Dr. Carrina',
    factionId: 'deepwrought',
    type: 'agent',
    timing: 'when_researching',
    description: 'When another player researches a technology: You may exhaust this card to allow them to ignore 1 prerequisite. If they do, place 1 infantry into coexistence on a non-home planet they control.',
    effect: { type: 'custom', handlerId: 'deepwrought_agent' },
    canTargetOthers: true,
  },
  aello: {
    id: 'aello',
    name: 'Aello',
    factionId: 'deepwrought',
    type: 'commander',
    timing: 'when_researching',
    description: 'When another player spends resources to research a technology: That player may reduce the cost by 1. If they do, gain 1 commodity or convert 1 of your commodities to a trade good.',
    effect: { type: 'custom', handlerId: 'deepwrought_commander' },
    // UNLOCK: Have an ocean card in play
    unlockCondition: { type: 'custom', checkerId: 'deepwrought_ocean_card' },
  },
  ta_zern_hero: {
    id: 'ta_zern_hero',
    name: 'Ta Zern',
    factionId: 'deepwrought',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Purge this card and a non-unit upgrade technology you own. Each other player that owns a copy of that technology purges it. Then, each player that purged a technology researches 1 technology.',
    effect: { type: 'custom', handlerId: 'deepwrought_hero' },
    isComponentAction: true,
  },

  // ============================================
  // RAL NEL CONSORTIUM (Thunder's Edge)
  // Agent: Kan Kip Rel
  // Commander: Watchful Ojz
  // Hero: Director Nel
  // ============================================
  kan_kip_rel: {
    id: 'kan_kip_rel',
    name: 'Kan Kip Rel',
    factionId: 'ral_nel',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card to draw 2 action cards. Give 1 of those cards to another player.',
    effect: { type: 'draw_action_cards', count: 2 },
    canTargetOthers: true,
    isComponentAction: true,
  },
  watchful_ojz: {
    id: 'watchful_ojz',
    name: 'Watchful Ojz',
    factionId: 'ral_nel',
    type: 'commander',
    timing: 'passive',
    description: 'When you declare a retreat: Immediately retreat up to 2 of your ships from the active system to an adjacent system that does not contain another player\'s ships. Place a command token from your reinforcements into that system.',
    effect: { type: 'custom', handlerId: 'ral_nel_commander' },
    // UNLOCK: Be last to pass during the Action Phase
    unlockCondition: { type: 'custom', checkerId: 'ral_nel_last_to_pass' },
  },
  director_nel: {
    id: 'director_nel',
    name: 'Director Nel',
    factionId: 'ral_nel',
    type: 'hero',
    timing: 'action',
    description: 'After the last player passes: You may choose to no longer be passed. If you do, gain 2 command tokens, draw 1 action card, and purge this card.',
    effect: { type: 'custom', handlerId: 'ral_nel_hero' },
  },

  // ============================================
  // CRIMSON REBELLION (Thunder's Edge)
  // Agent: Ahk Ravin
  // Commander: Ahk Siever
  // Hero: Homesick Phantom
  // ============================================
  ahk_ravin: {
    id: 'ahk_ravin',
    name: 'Ahk Ravin',
    factionId: 'crimson_rebellion',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card to choose 1 player. That player may swap the position of 2 of their ships in any systems.',
    effect: { type: 'custom', handlerId: 'crimson_rebellion_agent' },
    canTargetOthers: true,
    isComponentAction: true,
  },
  ahk_siever: {
    id: 'ahk_siever',
    name: 'Ahk Siever',
    factionId: 'crimson_rebellion',
    type: 'commander',
    timing: 'after_combat',
    description: 'After any combat: Gain 1 commodity or convert 1 of your commodities to a trade good.',
    effect: { type: 'gain_commodities', amount: 1 },
    // UNLOCK: Place a breach token in a system that contains another player's unit
    unlockCondition: { type: 'custom', checkerId: 'crimson_rebellion_breach_placed' },
  },
  homesick_phantom: {
    id: 'homesick_phantom',
    name: 'Homesick Phantom',
    factionId: 'crimson_rebellion',
    type: 'hero',
    timing: 'when_producing',
    description: 'When you produce ships: You may place any of those ships on this card instead of in a system. At the start of space combat, you may purge this card to place all ships from this card into the active system.',
    effect: { type: 'custom', handlerId: 'crimson_rebellion_hero' },
  },

  // ============================================
  // THE FIRMAMENT (Thunder's Edge)
  // Agent: Myru Vos
  // Commander: Captain Aroz
  // Hero: Sharsiss
  // ============================================
  myru_vos: {
    id: 'myru_vos',
    name: 'Myru Vos',
    factionId: 'firmament',
    type: 'agent',
    timing: 'when_moving',
    description: 'When another player moves ships: You may exhaust this card to prevent SPACE CANNON use against those ships and allow them to move through systems containing your ships.',
    effect: { type: 'custom', handlerId: 'firmament_agent' },
    canTargetOthers: true,
  },
  captain_aroz: {
    id: 'captain_aroz',
    name: 'Captain Aroz',
    factionId: 'firmament',
    type: 'commander',
    timing: 'passive',
    description: 'Treat planets in systems that contain your ships as planets you control for the purposes of scoring secret objectives.',
    effect: { type: 'custom', handlerId: 'firmament_commander' },
    // UNLOCK: Have at least 1 plot card in play
    unlockCondition: { type: 'custom', checkerId: 'firmament_plot_card' },
  },
  sharsiss: {
    id: 'sharsiss',
    name: 'Sharsiss',
    factionId: 'firmament',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place your plot cards with any opponent\'s control token on them. You may rearrange control tokens between your plot cards. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'firmament_hero' },
    isComponentAction: true,
  },

  // ============================================
  // THE OBSIDIAN (Thunder's Edge - transformed Firmament)
  // Agent: Vos Hollow
  // Commander: Aroz Hollow
  // Hero: Sharsiss Hollow
  // ============================================
  vos_hollow: {
    id: 'vos_hollow',
    name: 'Vos Hollow',
    factionId: 'obsidian',
    type: 'agent',
    timing: 'after_combat',
    description: 'When an opponent\'s ship is destroyed: You may exhaust this card to force that opponent to destroy 1 ship of the same type in the active system.',
    effect: { type: 'custom', handlerId: 'obsidian_agent' },
    canTargetOthers: false,
  },
  aroz_hollow: {
    id: 'aroz_hollow',
    name: 'Aroz Hollow',
    factionId: 'obsidian',
    type: 'commander',
    timing: 'passive',
    description: 'Apply +1 to the result of each of your combat rolls in The Fracture.',
    effect: { type: 'combat_bonus', value: 1 },
    // UNLOCK: Have units in The Fracture
    unlockCondition: { type: 'custom', checkerId: 'obsidian_units_in_fracture' },
  },
  sharsiss_hollow: {
    id: 'sharsiss_hollow',
    name: 'Sharsiss Hollow',
    factionId: 'obsidian',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Ready all planets you control. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'obsidian_hero' },
    isComponentAction: true,
  },
};

/**
 * Get leader ability by ID
 */
export function getLeaderAbility(leaderId: string): LeaderAbility | null {
  return LEADER_ABILITIES[leaderId] || null;
}

/**
 * Get all leader abilities for a faction
 */
export function getFactionLeaderAbilities(factionId: string): LeaderAbility[] {
  return Object.values(LEADER_ABILITIES).filter(a => a.factionId === factionId);
}

/**
 * Get all agents (for timing checks)
 */
export function getAllAgents(): LeaderAbility[] {
  return Object.values(LEADER_ABILITIES).filter(a => a.type === 'agent');
}

/**
 * Get agents by timing (for event triggers)
 */
export function getAgentsByTiming(timing: LeaderTiming): LeaderAbility[] {
  return Object.values(LEADER_ABILITIES).filter(
    a => a.type === 'agent' && a.timing === timing
  );
}
