/**
 * TI4 Leader Data - Maps faction IDs to their leader card IDs
 * Each faction has 3 leaders: Agent, Commander, Hero
 */

export interface FactionLeaderIds {
  agent: string;
  commander: string;
  hero: string;
}

export interface LeaderInfo {
  id: string;
  name: string;
  type: 'agent' | 'commander' | 'hero';
  factionId: string;
}

/**
 * Mapping of faction IDs to their leader card IDs
 * These IDs match the image filenames in /public/images/cards/leader/
 */
export const FACTION_LEADERS: Record<string, FactionLeaderIds> = {
  // Base Game Factions
  arborec: {
    agent: 'letani_ospha',
    commander: 'letani_miasmiala',
    hero: 'letani_behemoth',
  },
  creuss: {
    agent: 'icarus_drive',
    commander: 'emissary_taivra',
    hero: 'riftwalker_meian',
  },
  hacan: {
    agent: 'gila_the_silvertongue',
    commander: 'carth_of_golden_sands',
    hero: 'harrugh_gefhara',
  },
  jolnar: {
    agent: 'ta_zern',
    commander: 'doctor_sucaban',
    hero: 'rin_the_masters_legacy',
  },
  l1z1x: {
    agent: 'i48s',
    commander: '2ram',
    hero: 'annihilator',
  },
  letnev: {
    agent: 'viscount_unlenn',
    commander: 'rear_admiral_farran',
    hero: 'darktalon_treilla',
  },
  mentak: {
    agent: 'zeu',
    commander: 'ipswitch_loose_cannon',
    hero: 'kyver_blade_and_key',
  },
  muaat: {
    agent: 'magmus',
    commander: 'ember_colossus',
    hero: 'adjudicator_baal',
  },
  naalu: {
    agent: 'acamar',
    commander: 'the_oracle',
    hero: 'the_stillness_of_stars',
  },
  nekro: {
    agent: 'nekro_malleon',
    commander: 'nekro_acidos',
    hero: 'unitdsgnflayesh',
  },
  norr: {
    agent: 'tro',
    commander: 'shval_harbinger',
    hero: 'rowl_sarrig',
  },
  saar: {
    agent: 'captain_mendosa',
    commander: 'starlancer',
    hero: 'gurno_aggero',
  },
  sol: {
    agent: 'evelyn_delouis',
    commander: 'claire_gibson',
    hero: 'jace_x_4th_air_legion',
  },
  winnu: {
    agent: 'berekar_berekon',
    commander: 'rickar_rickani',
    hero: 'mathis_mathinus',
  },
  xxcha: {
    agent: 'ggrocuto_rinn',
    commander: 'elder_qanoj',
    hero: 'xxekir_grom',
  },
  yin: {
    agent: 'brother_milor',
    commander: 'brother_omar',
    hero: 'dannel_of_the_tenth',
  },
  yssaril: {
    agent: 'ssruu',
    commander: 'so_ata',
    hero: 'blackshade_infiltrator',
  },

  // Prophecy of Kings Factions
  argent: {
    agent: 'aerie_sentinel',
    commander: 'darth_and_tai', // Note: filename might be dart_and_tai
    hero: 'conservator_procyon',
  },
  empyrean: {
    agent: 'umbat',
    commander: 'sai_seravus',
    hero: 'shield_paling',
  },
  mahact: {
    agent: 'il_na_viroset',
    commander: 'airo_shir_aur',
    hero: 'maban',
  },
  naazrokha: {
    agent: 'garv_and_gunn',
    commander: 'dart_and_tai',
    hero: 'hesh_and_prit',
  },
  nomad: {
    agent: 'the_thundarian',
    commander: 'artuno_the_betrayer',
    hero: 'navarch_feng',
  },
  titans: {
    agent: 'dunlain_reaper',
    commander: 'tungstantus',
    hero: 'ul_the_progenitor',
  },
  cabal: {
    agent: 'it_feeds_on_carrion',
    commander: 'that_which_molds_flesh',
    hero: 'hecatoncheires',
  },

  // Keleres (special - can have different versions)
  keleres_argent: {
    agent: 'tellurian',
    commander: 'suffi_an',
    hero: 'sula_mentarion',
  },
  keleres_mentak: {
    agent: 'tellurian',
    commander: 'suffi_an',
    hero: 'sula_mentarion',
  },
  keleres_xxcha: {
    agent: 'tellurian',
    commander: 'suffi_an',
    hero: 'sula_mentarion',
  },
};

/**
 * Leader display names (formatted from IDs)
 */
export const LEADER_NAMES: Record<string, string> = {
  // Arborec
  letani_ospha: 'Letani Ospha',
  letani_miasmiala: 'Letani Miasmiala',
  letani_behemoth: 'Letani Behemoth',

  // Ghosts of Creuss
  icarus_drive: 'Icarus Drive',
  emissary_taivra: 'Emissary Taivra',
  riftwalker_meian: "Riftwalker Me'ian",

  // Emirates of Hacan
  gila_the_silvertongue: 'Gila the Silvertongue',
  carth_of_golden_sands: 'Carth of Golden Sands',
  harrugh_gefhara: 'Harrugh Gefhara',

  // Universities of Jol-Nar
  ta_zern: "Ta Zern",
  doctor_sucaban: 'Doctor Sucaban',
  rin_the_masters_legacy: "Rin, The Master's Legacy",

  // L1Z1X Mindnet
  i48s: 'I48S',
  '2ram': '2RAM',
  annihilator: 'Annihilator',

  // Barony of Letnev
  viscount_unlenn: 'Viscount Unlenn',
  rear_admiral_farran: 'Rear Admiral Farran',
  darktalon_treilla: 'Dark Talon Treilla',

  // Mentak Coalition
  zeu: 'Zeu',
  ipswitch_loose_cannon: 'Ipswitch, Loose Cannon',
  kyver_blade_and_key: 'Kyver, Blade and Key',

  // Embers of Muaat
  magmus: 'Magmus',
  ember_colossus: 'Ember Colossus',
  adjudicator_baal: "Adjudicator Ba'al",

  // Naalu Collective
  acamar: 'Acamar',
  the_oracle: 'The Oracle',
  the_stillness_of_stars: 'The Stillness of Stars',

  // Nekro Virus
  nekro_malleon: 'Nekro Malleon',
  nekro_acidos: 'Nekro Acidos',
  unitdsgnflayesh: 'UNIT.DSGN.FLAYESH',

  // Sardakk N\'orr
  tro: "T'Ro",
  shval_harbinger: "Sh'val, Harbinger",
  rowl_sarrig: "Rowl Sarrig",

  // Clan of Saar
  captain_mendosa: 'Captain Mendosa',
  starlancer: 'Starlancer',
  gurno_aggero: 'Gurno Aggero',

  // Federation of Sol
  evelyn_delouis: 'Evelyn Delouis',
  claire_gibson: 'Claire Gibson',
  jace_x_4th_air_legion: 'Jace X. 4th Air Legion',

  // Winnu
  berekar_berekon: 'Berekar Berekon',
  rickar_rickani: 'Rickar Rickani',
  mathis_mathinus: 'Mathis Mathinus',

  // Xxcha Kingdom
  ggrocuto_rinn: "G'grocuto Rinn",
  elder_qanoj: 'Elder Qanoj',
  xxekir_grom: "Xxekir Grom",

  // Yin Brotherhood
  brother_milor: 'Brother Milor',
  brother_omar: 'Brother Omar',
  dannel_of_the_tenth: 'Dannel of the Tenth',

  // Yssaril Tribes
  ssruu: 'Ssruu',
  so_ata: "So Ata",
  blackshade_infiltrator: 'Blackshade Infiltrator',

  // Argent Flight
  aerie_sentinel: 'Aerie Sentinel',
  darth_and_tai: 'Darth and Tai',
  conservator_procyon: 'Conservator Procyon',

  // Empyrean
  umbat: 'Umbat',
  sai_seravus: 'Sai Seravus',
  shield_paling: 'Shield Paling',

  // Mahact Gene-Sorcerers
  il_na_viroset: "Il Na Viroset",
  airo_shir_aur: "Airo Shir Aur",
  maban: "Maban",

  // Naaz-Rokha Alliance
  garv_and_gunn: 'Garv and Gunn',
  dart_and_tai: 'Dart and Tai',
  hesh_and_prit: 'Hesh and Prit',

  // Nomad
  the_thundarian: 'The Thundarian',
  artuno_the_betrayer: 'Artuno the Betrayer',
  navarch_feng: 'Navarch Feng',

  // Titans of Ul
  dunlain_reaper: 'Dunlain Reaper',
  tungstantus: 'Tungstantus',
  ul_the_progenitor: 'Ul the Progenitor',

  // Vuil\'raith Cabal
  it_feeds_on_carrion: 'It Feeds on Carrion',
  that_which_molds_flesh: 'That Which Molds Flesh',
  hecatoncheires: 'Hecatoncheires',

  // Keleres
  tellurian: 'Tellurian',
  suffi_an: "Suffi An",
  sula_mentarion: 'Sula Mentarion',
};

/**
 * Get leader data for a faction
 */
export function getFactionLeaders(factionId: string): FactionLeaderIds | null {
  return FACTION_LEADERS[factionId] || null;
}

/**
 * Get formatted leader name from ID
 */
export function getLeaderName(leaderId: string): string {
  return LEADER_NAMES[leaderId] || leaderId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get all leader info for a faction
 */
export function getFactionLeaderInfo(factionId: string): LeaderInfo[] {
  const leaders = FACTION_LEADERS[factionId];
  if (!leaders) return [];

  return [
    { id: leaders.agent, name: getLeaderName(leaders.agent), type: 'agent', factionId },
    { id: leaders.commander, name: getLeaderName(leaders.commander), type: 'commander', factionId },
    { id: leaders.hero, name: getLeaderName(leaders.hero), type: 'hero', factionId },
  ];
}
