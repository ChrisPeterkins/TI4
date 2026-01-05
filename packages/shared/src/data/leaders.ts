/**
 * TI4 Leader Data - Maps faction IDs to their leader card IDs
 * Each faction has 3 leaders: Agent, Commander, Hero
 * Exception: Nomad has 3 agents (5 leaders total)
 *
 * Data sourced from: https://twilight-imperium.fandom.com/wiki/Leaders
 */

export interface FactionLeaderIds {
  agent: string;
  /** Nomad has 2 additional agents */
  agent2?: string;
  agent3?: string;
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
  // ============================================
  // BASE GAME FACTIONS (16)
  // ============================================

  arborec: {
    agent: 'letani_ospha',
    commander: 'dirzuga_rophal',
    hero: 'letani_miasmiala',
  },
  creuss: {
    agent: 'emissary_taivra',
    commander: 'sai_seravus',
    hero: 'riftwalker_meian',
  },
  hacan: {
    agent: 'carth_of_golden_sands',
    commander: 'gila_the_silvertongue',
    hero: 'harrugh_gefhara',
  },
  jolnar: {
    agent: 'doctor_sucaban',
    commander: 'ta_zern',
    hero: 'rin_the_masters_legacy',
  },
  l1z1x: {
    agent: 'i48s',
    commander: '2ram',
    hero: 'the_helmsman',
  },
  letnev: {
    agent: 'viscount_unlenn',
    commander: 'rear_admiral_farran',
    hero: 'darktalon_treilla',
  },
  mentak: {
    agent: 'suffi_an',
    commander: 'sula_mentarion',
    hero: 'ipswitch_loose_cannon',
  },
  muaat: {
    agent: 'umbat',
    commander: 'magmus',
    hero: 'adjudicator_baal',
  },
  naalu: {
    agent: 'zeu',
    commander: 'maban',
    hero: 'the_oracle',
  },
  nekro: {
    agent: 'nekro_malleon',
    commander: 'nekro_acidos',
    hero: 'unitdsgnflayesh',
  },
  sardakk: {
    agent: 'tro',
    commander: 'ghom_sekkus',
    hero: 'shval_harbinger',
  },
  saar: {
    agent: 'captain_mendosa',
    commander: 'rowl_sarrig',
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
    hero: 'kyver_blade_and_key',
  },

  // ============================================
  // PROPHECY OF KINGS FACTIONS (7)
  // ============================================

  argent: {
    agent: 'trilossa_aun_mirik',
    commander: 'trrakan_aun_zulok',
    hero: 'mirik_aun_sissiri',
  },
  empyrean: {
    agent: 'acamar',
    commander: 'xuange',
    hero: 'conservator_procyon',
  },
  mahact: {
    agent: 'jae_mir_kan',
    commander: 'il_na_viroset',
    hero: 'airo_shir_aur',
  },
  naazrokha: {
    agent: 'garv_and_gunn',
    commander: 'dart_and_tai',
    hero: 'hesh_and_prit',
  },
  // Nomad is special - has 3 agents
  nomad: {
    agent: 'artuno_the_betrayer',
    agent2: 'field_marshal_mercer',
    agent3: 'the_thundarian',
    commander: 'navarch_feng',
    hero: 'ahksyl_siven',
  },
  titans: {
    agent: 'tellurian',
    commander: 'tungstantus',
    hero: 'ul_the_progenitor',
  },
  cabal: {
    agent: 'it_feeds_on_carrion',
    commander: 'that_which_molds_flesh',
    hero: 'hecatoncheires',
  },

  // ============================================
  // COUNCIL KELERES (Codex III)
  // Keleres chooses a sub-faction which determines their hero
  // ============================================

  // Generic Keleres (uses Argent hero by default)
  keleres: {
    agent: 'xander_alexin_victori_iii',
    commander: 'odlynn_myrr',
    hero: 'kuuasi_aun_jalatai',
  },
  // Keleres with Argent sub-faction
  keleres_argent: {
    agent: 'xander_alexin_victori_iii',
    commander: 'odlynn_myrr',
    hero: 'kuuasi_aun_jalatai',
  },
  // Keleres with Mentak sub-faction
  keleres_mentak: {
    agent: 'xander_alexin_victori_iii',
    commander: 'odlynn_myrr',
    hero: 'harka_leeds',
  },
  // Keleres with Xxcha sub-faction
  keleres_xxcha: {
    agent: 'xander_alexin_victori_iii',
    commander: 'odlynn_myrr',
    hero: 'odlynn_myrr_hero',
  },

  // ============================================
  // THUNDER'S EDGE FACTIONS (6)
  // ============================================

  last_bastion: {
    agent: 'dame_briar',
    commander: 'nip_and_tuck',
    hero: 'lyra_keen',
  },
  deepwrought: {
    agent: 'dr_carrina',
    commander: 'aello',
    hero: 'ta_zern_hero', // Different from Jol-Nar ta_zern
  },
  ral_nel: {
    agent: 'kan_kip_rel',
    commander: 'watchful_ojz',
    hero: 'director_nel',
  },
  crimson_rebellion: {
    agent: 'ahk_ravin',
    commander: 'ahk_siever',
    hero: 'homesick_phantom',
  },
  firmament: {
    agent: 'myru_vos',
    commander: 'captain_aroz',
    hero: 'sharsiss',
  },
  obsidian: {
    agent: 'vos_hollow',
    commander: 'aroz_hollow',
    hero: 'sharsiss_hollow',
  },
};

/**
 * Leader display names (formatted from IDs)
 */
export const LEADER_NAMES: Record<string, string> = {
  // ============================================
  // ARBOREC
  // ============================================
  letani_ospha: 'Letani Ospha',
  dirzuga_rophal: 'Dirzuga Rophal',
  letani_miasmiala: 'Letani Miasmiala',

  // ============================================
  // GHOSTS OF CREUSS
  // ============================================
  emissary_taivra: 'Emissary Taivra',
  sai_seravus: 'Sai Seravus',
  riftwalker_meian: "Riftwalker Me'ian",

  // ============================================
  // EMIRATES OF HACAN
  // ============================================
  carth_of_golden_sands: 'Carth of Golden Sands',
  gila_the_silvertongue: 'Gila the Silvertongue',
  harrugh_gefhara: 'Harrugh Gefhara',

  // ============================================
  // UNIVERSITIES OF JOL-NAR
  // ============================================
  doctor_sucaban: 'Doctor Sucaban',
  ta_zern: 'Ta Zern',
  rin_the_masters_legacy: "Rin, The Master's Legacy",

  // ============================================
  // L1Z1X MINDNET
  // ============================================
  i48s: 'I48S',
  '2ram': '2RAM',
  the_helmsman: 'The Helmsman',

  // ============================================
  // BARONY OF LETNEV
  // ============================================
  viscount_unlenn: 'Viscount Unlenn',
  rear_admiral_farran: 'Rear Admiral Farran',
  darktalon_treilla: 'Darktalon Treilla',

  // ============================================
  // MENTAK COALITION
  // ============================================
  suffi_an: 'Suffi An',
  sula_mentarion: "S'Ula Mentarion",
  ipswitch_loose_cannon: 'Ipswitch, Loose Cannon',

  // ============================================
  // EMBERS OF MUAAT
  // ============================================
  umbat: 'Umbat',
  magmus: 'Magmus',
  adjudicator_baal: "Adjudicator Ba'al",

  // ============================================
  // NAALU COLLECTIVE
  // ============================================
  zeu: "Z'eu",
  maban: "M'aban",
  the_oracle: 'The Oracle',

  // ============================================
  // NEKRO VIRUS
  // ============================================
  nekro_malleon: 'Nekro Malleon',
  nekro_acidos: 'Nekro Acidos',
  unitdsgnflayesh: 'UNIT.DSGN.FLAYESH',

  // ============================================
  // SARDAKK N'ORR
  // ============================================
  tro: "T'ro",
  ghom_sekkus: "G'hom Sek'kus",
  shval_harbinger: "Sh'val, Harbinger",

  // ============================================
  // CLAN OF SAAR
  // ============================================
  captain_mendosa: 'Captain Mendosa',
  rowl_sarrig: 'Rowl Sarrig',
  gurno_aggero: 'Gurno Aggero',

  // ============================================
  // FEDERATION OF SOL
  // ============================================
  evelyn_delouis: 'Evelyn Delouis',
  claire_gibson: 'Claire Gibson',
  jace_x_4th_air_legion: 'Jace X. 4th Air Legion',

  // ============================================
  // WINNU
  // ============================================
  berekar_berekon: 'Berekar Berekon',
  rickar_rickani: 'Rickar Rickani',
  mathis_mathinus: 'Mathis Mathinus',

  // ============================================
  // XXCHA KINGDOM
  // ============================================
  ggrocuto_rinn: "Ggrocuto Rinn",
  elder_qanoj: 'Elder Qanoj',
  xxekir_grom: 'Xxekir Grom',

  // ============================================
  // YIN BROTHERHOOD
  // ============================================
  brother_milor: 'Brother Milor',
  brother_omar: 'Brother Omar',
  dannel_of_the_tenth: 'Dannel of the Tenth',

  // ============================================
  // YSSARIL TRIBES
  // ============================================
  ssruu: 'Clever Clever Ssruu',
  so_ata: 'So Ata',
  kyver_blade_and_key: 'Kyver, Blade and Key',

  // ============================================
  // ARGENT FLIGHT
  // ============================================
  trilossa_aun_mirik: 'Trilossa Aun Mirik',
  trrakan_aun_zulok: 'Trrakan Aun Zulok',
  mirik_aun_sissiri: 'Mirik Aun Sissiri',

  // ============================================
  // EMPYREAN
  // ============================================
  acamar: 'Acamar',
  xuange: 'Xuange',
  conservator_procyon: 'Conservator Procyon',

  // ============================================
  // MAHACT GENE-SORCERERS
  // ============================================
  jae_mir_kan: 'Jae Mir Kan',
  il_na_viroset: 'Il Na Viroset',
  airo_shir_aur: 'Airo Shir Aur',

  // ============================================
  // NAAZ-ROKHA ALLIANCE
  // ============================================
  garv_and_gunn: 'Garv and Gunn',
  dart_and_tai: 'Dart and Tai',
  hesh_and_prit: 'Hesh and Prit',

  // ============================================
  // NOMAD (5 leaders - 3 agents)
  // ============================================
  artuno_the_betrayer: 'Artuno the Betrayer',
  field_marshal_mercer: 'Field Marshal Mercer',
  the_thundarian: 'The Thundarian',
  navarch_feng: 'Navarch Feng',
  ahksyl_siven: 'Ahk-Syl Siven',

  // ============================================
  // TITANS OF UL
  // ============================================
  tellurian: 'Tellurian',
  tungstantus: 'Tungstantus',
  ul_the_progenitor: 'Ul the Progenitor',

  // ============================================
  // VUIL'RAITH CABAL
  // ============================================
  it_feeds_on_carrion: 'It Feeds on Carrion',
  that_which_molds_flesh: 'That Which Molds Flesh',
  hecatoncheires: 'Hecatoncheires',

  // ============================================
  // COUNCIL KELERES
  // ============================================
  xander_alexin_victori_iii: 'Xander Alexin Victori III',
  odlynn_myrr: 'Odlynn Myrr',
  kuuasi_aun_jalatai: 'Kuuasi Aun Jalatai',
  harka_leeds: 'Harka Leeds',
  odlynn_myrr_hero: 'Odlynn Myrr',

  // ============================================
  // LAST BASTION
  // ============================================
  dame_briar: 'Dame Briar',
  nip_and_tuck: 'Nip and Tuck',
  lyra_keen: 'Lyra Keen',

  // ============================================
  // DEEPWROUGHT SCHOLARATE
  // ============================================
  dr_carrina: 'Dr. Carrina',
  aello: 'Aello',
  ta_zern_hero: 'Ta Zern', // Deepwrought hero (different from Jol-Nar commander)

  // ============================================
  // RAL NEL CONSORTIUM
  // ============================================
  kan_kip_rel: 'Kan Kip Rel',
  watchful_ojz: 'Watchful Ojz',
  director_nel: 'Director Nel',

  // ============================================
  // CRIMSON REBELLION
  // ============================================
  ahk_ravin: 'Ahk Ravin',
  ahk_siever: 'Ahk Siever',
  homesick_phantom: 'Homesick Phantom',

  // ============================================
  // THE FIRMAMENT
  // ============================================
  myru_vos: 'Myru Vos',
  captain_aroz: 'Captain Aroz',
  sharsiss: 'Sharsiss',

  // ============================================
  // THE OBSIDIAN
  // ============================================
  vos_hollow: 'Vos Hollow',
  aroz_hollow: 'Aroz Hollow',
  sharsiss_hollow: 'Sharsiss Hollow',
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
 * Includes all agents for Nomad
 */
export function getFactionLeaderInfo(factionId: string): LeaderInfo[] {
  const leaders = FACTION_LEADERS[factionId];
  if (!leaders) return [];

  const result: LeaderInfo[] = [
    { id: leaders.agent, name: getLeaderName(leaders.agent), type: 'agent', factionId },
  ];

  // Add additional agents for Nomad
  if (leaders.agent2) {
    result.push({ id: leaders.agent2, name: getLeaderName(leaders.agent2), type: 'agent', factionId });
  }
  if (leaders.agent3) {
    result.push({ id: leaders.agent3, name: getLeaderName(leaders.agent3), type: 'agent', factionId });
  }

  result.push(
    { id: leaders.commander, name: getLeaderName(leaders.commander), type: 'commander', factionId },
    { id: leaders.hero, name: getLeaderName(leaders.hero), type: 'hero', factionId }
  );

  return result;
}

/**
 * Get all agent IDs for a faction (handles Nomad's 3 agents)
 */
export function getFactionAgents(factionId: string): string[] {
  const leaders = FACTION_LEADERS[factionId];
  if (!leaders) return [];

  const agents = [leaders.agent];
  if (leaders.agent2) agents.push(leaders.agent2);
  if (leaders.agent3) agents.push(leaders.agent3);
  return agents;
}

/**
 * Check if a faction has multiple agents (Nomad)
 */
export function hasMultipleAgents(factionId: string): boolean {
  const leaders = FACTION_LEADERS[factionId];
  return !!(leaders?.agent2 || leaders?.agent3);
}
