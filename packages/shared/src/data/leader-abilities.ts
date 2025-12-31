/**
 * TI4 Leader Abilities Data
 * Defines all agent, commander, and hero abilities for every faction
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
  | { type: 'control_mecatol' }
  | { type: 'have_technologies'; count: number; color?: string }
  | { type: 'have_trade_goods'; count: number }
  | { type: 'have_command_tokens'; count: number }
  | { type: 'have_action_cards'; count: number }
  | { type: 'have_laws_in_play'; count: number }
  | { type: 'have_units_in_system'; unitType: string; count: number }
  | { type: 'have_units_total'; unitType: string; count: number }
  | { type: 'have_space_docks'; count: number }
  | { type: 'have_pds'; count: number }
  | { type: 'units_in_others_home'; playerCount: number }
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
 */
export const LEADER_ABILITIES: Record<string, LeaderAbility> = {
  // ============================================
  // ARBOREC
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
  letani_miasmiala: {
    id: 'letani_miasmiala',
    name: 'Letani Miasmiala',
    factionId: 'arborec',
    type: 'commander',
    timing: 'passive',
    description: 'After you produce units, you may produce 1 additional infantry for its cost.',
    effect: { type: 'custom', handlerId: 'arborec_commander' },
    unlockCondition: { type: 'have_units_total', unitType: 'infantry', count: 12 },
  },
  letani_behemoth: {
    id: 'letani_behemoth',
    name: 'Letani Behemoth',
    factionId: 'arborec',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place 2 infantry and 1 mech on each planet you control. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'arborec_hero' },
    isComponentAction: true,
  },

  // ============================================
  // GHOSTS OF CREUSS
  // ============================================
  icarus_drive: {
    id: 'icarus_drive',
    name: 'Icarus Drive',
    factionId: 'creuss',
    type: 'agent',
    timing: 'after_activated',
    description: 'After a player activates a system that contains or is adjacent to a wormhole: You may exhaust this card to allow that player to move 1 ship to or from an adjacent system that does not contain any of their ships.',
    effect: { type: 'custom', handlerId: 'creuss_agent' },
    canTargetOthers: true,
  },
  emissary_taivra: {
    id: 'emissary_taivra',
    name: 'Emissary Taivra',
    factionId: 'creuss',
    type: 'commander',
    timing: 'passive',
    description: 'Each system that contains an alpha or beta wormhole is adjacent to each other.',
    effect: { type: 'custom', handlerId: 'creuss_commander' },
    unlockCondition: { type: 'custom', checkerId: 'creuss_wormhole_token' },
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
  // ============================================
  gila_the_silvertongue: {
    id: 'gila_the_silvertongue',
    name: 'Gila the Silvertongue',
    factionId: 'hacan',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card to choose another player. You and that player each gain 2 commodities.',
    effect: { type: 'gain_commodities', amount: 2 },
    canTargetOthers: true,
    isComponentAction: true,
  },
  carth_of_golden_sands: {
    id: 'carth_of_golden_sands',
    name: 'Carth of Golden Sands',
    factionId: 'hacan',
    type: 'commander',
    timing: 'passive',
    description: 'Your commodity value is increased by 1 for each player that is your neighbor.',
    effect: { type: 'custom', handlerId: 'hacan_commander' },
    unlockCondition: { type: 'have_trade_goods', count: 6 },
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
  // ============================================
  ta_zern: {
    id: 'ta_zern',
    name: 'Ta Zern',
    factionId: 'jolnar',
    type: 'agent',
    timing: 'when_researching',
    description: 'When you or another player researches a technology: You may exhaust this card. If you do, that player draws 1 action card.',
    effect: { type: 'draw_action_cards', count: 1 },
    canTargetOthers: true,
  },
  doctor_sucaban: {
    id: 'doctor_sucaban',
    name: 'Doctor Sucaban',
    factionId: 'jolnar',
    type: 'commander',
    timing: 'when_researching',
    description: 'When you research a technology, you may exhaust 1 planet to ignore 1 prerequisite.',
    effect: { type: 'custom', handlerId: 'jolnar_commander' },
    unlockCondition: { type: 'have_technologies', count: 4 },
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
  annihilator: {
    id: 'annihilator',
    name: 'Annihilator',
    factionId: 'l1z1x',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Choose 1 system other than the Mecatol Rex system. Destroy all other players\' infantry and fighters in that system. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'l1z1x_hero' },
    isComponentAction: true,
  },

  // ============================================
  // BARONY OF LETNEV
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
    unlockCondition: { type: 'have_units_in_system', unitType: 'ship', count: 4 },
  },
  darktalon_treilla: {
    id: 'darktalon_treilla',
    name: 'Dark Talon Treilla',
    factionId: 'letnev',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place the Dark Talon token on the game board. All systems adjacent to the Dark Talon token are adjacent to each other and have no defined boundaries. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'letnev_hero' },
    isComponentAction: true,
  },

  // ============================================
  // MENTAK COALITION
  // ============================================
  zeu: {
    id: 'zeu',
    name: 'Zeu',
    factionId: 'mentak',
    type: 'agent',
    timing: 'when_other_activates',
    description: 'When another player activates a system: You may exhaust this card to allow that player to remove 1 of their command tokens from the game board and place it in their reinforcements.',
    effect: { type: 'custom', handlerId: 'mentak_agent' },
    canTargetOthers: true,
  },
  ipswitch_loose_cannon: {
    id: 'ipswitch_loose_cannon',
    name: 'Ipswitch, Loose Cannon',
    factionId: 'mentak',
    type: 'commander',
    timing: 'passive',
    description: 'Before you resolve the AMBUSH ability of 1 or more of your units, you may apply +2 to the result of each of your AMBUSH rolls.',
    effect: { type: 'custom', handlerId: 'mentak_commander' },
    unlockCondition: { type: 'custom', checkerId: 'mentak_ambush_units' },
  },
  kyver_blade_and_key: {
    id: 'kyver_blade_and_key',
    name: 'Kyver, Blade and Key',
    factionId: 'mentak',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Choose 1 planet in a system that contains your units. Gain trade goods equal to that planet\'s combined resource and influence values. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'mentak_hero' },
    isComponentAction: true,
  },

  // ============================================
  // EMBERS OF MUAAT
  // ============================================
  magmus: {
    id: 'magmus',
    name: 'Magmus',
    factionId: 'muaat',
    type: 'agent',
    timing: 'when_producing',
    description: 'At the start of a player\'s turn: You may exhaust this card to allow that player to produce 1 unit in a system that contains their war sun.',
    effect: { type: 'custom', handlerId: 'muaat_agent' },
    canTargetOthers: true,
  },
  ember_colossus: {
    id: 'ember_colossus',
    name: 'Ember Colossus',
    factionId: 'muaat',
    type: 'commander',
    timing: 'passive',
    description: 'Your war suns gain PRODUCTION 5.',
    effect: { type: 'custom', handlerId: 'muaat_commander' },
    unlockCondition: { type: 'have_units_total', unitType: 'war_sun', count: 1 },
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
  // ============================================
  acamar: {
    id: 'acamar',
    name: 'Acamar',
    factionId: 'naalu',
    type: 'agent',
    timing: 'when_combat_start',
    description: 'At the start of ground combat: You may exhaust this card to produce 1 hit that must be assigned to a non-fighter ship.',
    effect: { type: 'custom', handlerId: 'naalu_agent' },
    canTargetOthers: false,
  },
  the_oracle: {
    id: 'the_oracle',
    name: 'The Oracle',
    factionId: 'naalu',
    type: 'commander',
    timing: 'passive',
    description: 'You may look at your secret objectives at any time.',
    effect: { type: 'custom', handlerId: 'naalu_commander' },
    unlockCondition: { type: 'units_in_others_home', playerCount: 2 },
  },
  the_stillness_of_stars: {
    id: 'the_stillness_of_stars',
    name: 'The Stillness of Stars',
    factionId: 'naalu',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: During this game round, other players cannot play action cards. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'naalu_hero' },
    isComponentAction: true,
  },

  // ============================================
  // NEKRO VIRUS
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
  // ============================================
  tro: {
    id: 'tro',
    name: "T'Ro",
    factionId: 'norr',
    type: 'agent',
    timing: 'when_combat_start',
    description: 'At the start of a ground combat round: You may exhaust this card to choose 1 ground force in that combat. That ground force rolls 1 additional die during that combat round.',
    effect: { type: 'reroll_dice', count: 1 },
    canTargetOthers: true,
  },
  shval_harbinger: {
    id: 'shval_harbinger',
    name: "Sh'val, Harbinger",
    factionId: 'norr',
    type: 'commander',
    timing: 'passive',
    description: 'Your units apply +1 to the result of each of their combat rolls during ground combat.',
    effect: { type: 'combat_bonus', value: 1, ground: true },
    unlockCondition: { type: 'have_units_total', unitType: 'infantry', count: 5 },
  },
  rowl_sarrig: {
    id: 'rowl_sarrig',
    name: 'Rowl Sarrig',
    factionId: 'norr',
    type: 'hero',
    timing: 'when_combat_start',
    description: 'At the start of space combat: Destroy all of your opponent\'s fighters in this system. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'norr_hero' },
  },

  // ============================================
  // CLAN OF SAAR
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
  starlancer: {
    id: 'starlancer',
    name: 'Starlancer',
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
    unlockCondition: { type: 'have_command_tokens', count: 6 },
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
    unlockCondition: { type: 'control_mecatol' },
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
  // ============================================
  ggrocuto_rinn: {
    id: 'ggrocuto_rinn',
    name: "G'grocuto Rinn",
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
    unlockCondition: { type: 'have_laws_in_play', count: 1 },
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
    unlockCondition: { type: 'have_units_total', unitType: 'infantry', count: 4 },
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
  // ============================================
  ssruu: {
    id: 'ssruu',
    name: 'Ssruu',
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
    unlockCondition: { type: 'have_action_cards', count: 6 },
  },
  blackshade_infiltrator: {
    id: 'blackshade_infiltrator',
    name: 'Blackshade Infiltrator',
    factionId: 'yssaril',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Look at all other players\' hands of action cards. For each player, you may either take 1 action card, or give that player 1 action card from your hand. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'yssaril_hero' },
    isComponentAction: true,
  },

  // ============================================
  // ARGENT FLIGHT (PoK)
  // ============================================
  aerie_sentinel: {
    id: 'aerie_sentinel',
    name: 'Aerie Sentinel',
    factionId: 'argent',
    type: 'agent',
    timing: 'when_combat_start',
    description: 'At the start of space combat: You may exhaust this card to choose 1 unit in the active system. That unit cannot be destroyed during this combat round.',
    effect: { type: 'custom', handlerId: 'argent_agent' },
    canTargetOthers: true,
  },
  darth_and_tai: {
    id: 'darth_and_tai',
    name: 'Darth and Tai',
    factionId: 'argent',
    type: 'commander',
    timing: 'passive',
    description: 'You may use the ANTI-FIGHTER BARRAGE ability of your PDS units even if not in the active system.',
    effect: { type: 'custom', handlerId: 'argent_commander' },
    unlockCondition: { type: 'have_pds', count: 3 },
  },
  conservator_procyon: {
    id: 'conservator_procyon',
    name: 'Conservator Procyon',
    factionId: 'argent',
    type: 'hero',
    timing: 'when_voting',
    description: 'At the start of the agenda phase: You may purge this card to reveal all cards in the agenda deck, choose 2 agendas, and place those agendas on top of the agenda deck in any order. Place the rest of the cards on the bottom of the agenda deck in any order.',
    effect: { type: 'custom', handlerId: 'argent_hero' },
  },

  // ============================================
  // EMPYREAN (PoK)
  // ============================================
  umbat: {
    id: 'umbat',
    name: 'Umbat',
    factionId: 'empyrean',
    type: 'agent',
    timing: 'when_other_activates',
    description: 'After another player activates a system that contains a planet you control: You may exhaust this card. If you do, that player places 1 trade good from the supply on that planet; units on this planet cannot be produced.',
    effect: { type: 'custom', handlerId: 'empyrean_agent' },
    canTargetOthers: false,
  },
  sai_seravus: {
    id: 'sai_seravus',
    name: 'Sai Seravus',
    factionId: 'empyrean',
    type: 'commander',
    timing: 'passive',
    description: 'After you perform a transaction with a player, you may explore 1 planet that player controls.',
    effect: { type: 'custom', handlerId: 'empyrean_commander' },
    unlockCondition: { type: 'custom', checkerId: 'empyrean_frontier_tokens' },
  },
  shield_paling: {
    id: 'shield_paling',
    name: 'Shield Paling',
    factionId: 'empyrean',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place the Shield Paling token in the active system. Units in that system cannot be destroyed by BOMBARDMENT, SPACE CANNON, or action cards. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'empyrean_hero' },
    isComponentAction: true,
  },

  // ============================================
  // MAHACT GENE-SORCERERS (PoK)
  // ============================================
  il_na_viroset: {
    id: 'il_na_viroset',
    name: 'Il Na Viroset',
    factionId: 'mahact',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card to choose a player. Return 1 of their command tokens from the game board to their reinforcements. Then, place 1 of your command tokens from your reinforcements in a system that does not already contain 1 of your command tokens.',
    effect: { type: 'swap_command_tokens' },
    canTargetOthers: true,
    isComponentAction: true,
  },
  airo_shir_aur: {
    id: 'airo_shir_aur',
    name: 'Airo Shir Aur',
    factionId: 'mahact',
    type: 'commander',
    timing: 'passive',
    description: 'Your mechs are not affected by other players\' abilities that do not cause combat.',
    effect: { type: 'custom', handlerId: 'mahact_commander' },
    unlockCondition: { type: 'custom', checkerId: 'mahact_command_tokens' },
  },
  maban: {
    id: 'maban',
    name: 'Maban',
    factionId: 'mahact',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Purge any number of your command tokens from the game board. For each command token purged, gain 1 trade good and 1 command token. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'mahact_hero' },
    isComponentAction: true,
  },

  // ============================================
  // NAAZ-ROKHA ALLIANCE (PoK)
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
    unlockCondition: { type: 'custom', checkerId: 'naazrokha_relic_fragments' },
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
  // ============================================
  the_thundarian: {
    id: 'the_thundarian',
    name: 'The Thundarian',
    factionId: 'nomad',
    type: 'agent',
    timing: 'when_moving',
    description: 'At the start of a player\'s turn: You may exhaust this card. If you do, during this turn, that player\'s ships may move through systems that contain other players\' ships.',
    effect: { type: 'custom', handlerId: 'nomad_agent' },
    canTargetOthers: true,
  },
  artuno_the_betrayer: {
    id: 'artuno_the_betrayer',
    name: 'Artuno the Betrayer',
    factionId: 'nomad',
    type: 'commander',
    timing: 'passive',
    description: 'When you produce units in a system that does not contain any of your space docks, reduce the combined cost of those units by 1 for each unit you already have in that system.',
    effect: { type: 'custom', handlerId: 'nomad_commander' },
    unlockCondition: { type: 'control_planets', count: 3, trait: 'cultural' },
  },
  navarch_feng: {
    id: 'navarch_feng',
    name: 'Navarch Feng',
    factionId: 'nomad',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Place your flagship in any system on the game board that does not contain another player\'s ships. Move any number of your ships from other systems into the flagship\'s system. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'nomad_hero' },
    isComponentAction: true,
  },

  // ============================================
  // TITANS OF UL (PoK)
  // ============================================
  dunlain_reaper: {
    id: 'dunlain_reaper',
    name: 'Dunlain Reaper',
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
    unlockCondition: { type: 'custom', checkerId: 'titans_sleeper_tokens' },
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
    unlockCondition: { type: 'custom', checkerId: 'cabal_captured_units' },
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
  // COUNCIL KELERES (PoK)
  // ============================================
  tellurian: {
    id: 'tellurian',
    name: 'Tellurian',
    factionId: 'keleres',
    type: 'agent',
    timing: 'action',
    description: 'ACTION: Exhaust this card and choose a player. That player may spend any number of commodities to gain an equal number of trade goods.',
    effect: { type: 'custom', handlerId: 'keleres_agent' },
    canTargetOthers: true,
    isComponentAction: true,
  },
  suffi_an: {
    id: 'suffi_an',
    name: 'Suffi An',
    factionId: 'keleres',
    type: 'commander',
    timing: 'passive',
    description: 'When you cast at least 1 vote, cast 1 additional vote for each other player\'s planet you control.',
    effect: { type: 'custom', handlerId: 'keleres_commander' },
    unlockCondition: { type: 'custom', checkerId: 'keleres_influence' },
  },
  sula_mentarion: {
    id: 'sula_mentarion',
    name: 'Sula Mentarion',
    factionId: 'keleres',
    type: 'hero',
    timing: 'action',
    description: 'ACTION: Elect a law in play. Discard all cards in the law deck and all cards in the law discard pile. Draw an agenda card. That agenda becomes a law in play. Then, purge this card.',
    effect: { type: 'custom', handlerId: 'keleres_hero' },
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
