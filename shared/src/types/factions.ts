// Faction type definitions

export interface Faction {
  id: string;
  name: string;
  shortName: string;
  description: string;
  lore: string;
  homeSystem: string;
  startingUnits: StartingUnits;
  startingTech: string[];
  commodities: number;
  abilities: FactionAbility[];
  promissoryNote: string;
  flagshipName: string;
  flagshipAbilities: string[];
  agent?: Agent; // PoK
  commander?: Commander; // PoK
  hero?: Hero; // PoK
  mech?: MechUnit; // PoK
}

export interface StartingUnits {
  carriers: number;
  cruisers: number;
  destroyers: number;
  dreadnoughts: number;
  fighters: number;
  infantry: number;
  pds: number;
  spaceDocks: number;
}

export interface FactionAbility {
  name: string;
  description: string;
  type: 'passive' | 'action' | 'combat';
}

// Prophecy of Kings Leaders
export interface Agent {
  name: string;
  ability: string;
  unlock: 'start';
}

export interface Commander {
  name: string;
  ability: string;
  unlock: string; // Unlock condition
}

export interface Hero {
  name: string;
  ability: string;
  purgeEffect: string;
}

export interface MechUnit {
  name: string;
  combat: number;
  sustainDamage: boolean;
  ability: string;
}

// Base game factions
export enum BaseFactions {
  ARBOREC = 'ARBOREC',
  BARONY_OF_LETNEV = 'BARONY_OF_LETNEV',
  CLAN_OF_SAAR = 'CLAN_OF_SAAR',
  EMBERS_OF_MUAAT = 'EMBERS_OF_MUAAT',
  EMIRATES_OF_HACAN = 'EMIRATES_OF_HACAN',
  FEDERATION_OF_SOL = 'FEDERATION_OF_SOL',
  GHOSTS_OF_CREUSS = 'GHOSTS_OF_CREUSS',
  L1Z1X_MINDNET = 'L1Z1X_MINDNET',
  MENTAK_COALITION = 'MENTAK_COALITION',
  NAALU_COLLECTIVE = 'NAALU_COLLECTIVE',
  NEKRO_VIRUS = 'NEKRO_VIRUS',
  SARDAKK_NORR = 'SARDAKK_NORR',
  UNIVERSITIES_OF_JOL_NAR = 'UNIVERSITIES_OF_JOL_NAR',
  WINNU = 'WINNU',
  XXCHA_KINGDOM = 'XXCHA_KINGDOM',
  YIN_BROTHERHOOD = 'YIN_BROTHERHOOD',
  YSSARIL_TRIBES = 'YSSARIL_TRIBES',
}

// Prophecy of Kings factions
export enum PoKFactions {
  ARGENT_FLIGHT = 'ARGENT_FLIGHT',
  EMPYREAN = 'EMPYREAN',
  MAHACT_GENE_SORCERERS = 'MAHACT_GENE_SORCERERS',
  NAAZ_ROKHA_ALLIANCE = 'NAAZ_ROKHA_ALLIANCE',
  NOMAD = 'NOMAD',
  TITANS_OF_UL = 'TITANS_OF_UL',
  VUIL_RAITH_CABAL = 'VUIL_RAITH_CABAL',
}