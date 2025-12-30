import type {
  UnitType,
  TechColor,
  PlanetTrait,
  WormholeType,
  AnomalyType,
  Expansion,
} from './common.js';

// Faction Data
export interface FactionData {
  id: string;
  name: string;
  shortName: string;
  expansion: Expansion;
  homeSystemId: number;
  startingTech: string[];
  startingUnits: StartingUnit[];
  commodities: number;
  abilities: FactionAbility[];
  promissoryNote: PromissoryNoteData;
  leaders?: FactionLeaders;
  flagship: FlagshipData;
  mech?: MechData;
}

export interface StartingUnit {
  type: UnitType;
  count: number;
  planet?: string;
}

export interface FactionAbility {
  id: string;
  name: string;
  description: string;
  timing?: string;
}

export interface FactionLeaders {
  agent: LeaderData;
  commander: LeaderData;
  hero: LeaderData;
}

export interface LeaderData {
  id: string;
  name: string;
  title: string;
  ability: string;
  unlockCondition?: string;
}

export interface FlagshipData {
  id: string;
  name: string;
  cost: number;
  combat: number;
  move: number;
  capacity: number;
  abilities: string[];
}

export interface MechData {
  id: string;
  name: string;
  cost: number;
  combat: number;
  abilities: string[];
}

// Technology Data
export interface TechnologyData {
  id: string;
  name: string;
  type: 'unit_upgrade' | 'color';
  color?: TechColor;
  unitType?: UnitType;
  prerequisites: TechPrerequisite[];
  expansion: Expansion;
  factionId?: string;
  description: string;
}

export interface TechPrerequisite {
  color: TechColor;
  count: number;
}

// Unit Data (base stats)
export interface UnitData {
  type: UnitType;
  cost: number;
  combat?: number;
  move?: number;
  capacity?: number;
  production?: number;
  spaceCannon?: { value: number; count: number };
  antiFighterBarrage?: { value: number; count: number };
  bombardment?: { value: number; count: number };
  sustainDamage?: boolean;
  planetaryShield?: boolean;
  isGround?: boolean;
  isShip?: boolean;
  isStructure?: boolean;
}

// System / Tile Data
export interface SystemData {
  id: number;
  tileNumber: string;
  type: 'home' | 'blue' | 'red' | 'hyperlane' | 'mecatol';
  factionId?: string;
  planets: PlanetData[];
  wormhole?: WormholeType;
  anomaly?: AnomalyType;
  expansion: Expansion;
}

export interface PlanetData {
  id: string;
  name: string;
  resources: number;
  influence: number;
  trait?: PlanetTrait;
  techSpecialty?: TechColor;
  legendary?: boolean;
  legendaryAbility?: string;
}

// Strategy Card Data
export interface StrategyCardData {
  number: number;
  name: string;
  initiative: number;
  primaryAbility: string;
  secondaryAbility: string;
}

// Objective Data
export interface ObjectiveData {
  id: string;
  name: string;
  type: 'stage1' | 'stage2' | 'secret';
  points: number;
  description: string;
  requirement: ObjectiveRequirement;
  expansion: Expansion;
}

export interface ObjectiveRequirement {
  type:
    | 'spend_resources'
    | 'spend_influence'
    | 'control_planets'
    | 'control_trait'
    | 'technology_count'
    | 'technology_colors'
    | 'unit_count'
    | 'structure_count'
    | 'win_combat'
    | 'control_mecatol'
    | 'neighbor_count'
    | 'custom';
  value?: number;
  trait?: PlanetTrait;
  techColors?: TechColor[];
  unitTypes?: UnitType[];
  customCheck?: string;
}

// Action Card Data
export interface ActionCardData {
  id: string;
  name: string;
  count: number;
  timing: ActionCardTiming;
  description: string;
  flavor?: string;
  expansion: Expansion;
}

export type ActionCardTiming =
  | 'action'
  | 'combat'
  | 'tactical'
  | 'agenda'
  | 'status'
  | 'start_of_combat'
  | 'anti_fighter_barrage'
  | 'space_combat'
  | 'ground_combat'
  | 'invasion'
  | 'bombardment';

// Agenda Card Data
export interface AgendaCardData {
  id: string;
  name: string;
  type: 'law' | 'directive';
  electionType: 'player' | 'planet' | 'for_against' | 'scored_secret' | 'law' | 'strategy_card' | 'custom';
  description: string;
  expansion: Expansion;
}

// Promissory Note Data
export interface PromissoryNoteData {
  id: string;
  name: string;
  owner: 'generic' | string;
  description: string;
  timing?: string;
}

// Exploration Card Data (PoK)
export interface ExplorationCardData {
  id: string;
  name: string;
  type: 'cultural' | 'industrial' | 'hazardous' | 'frontier';
  subtype?: 'attach' | 'fragment' | 'instant';
  fragmentType?: 'cultural' | 'industrial' | 'hazardous' | 'unknown';
  description: string;
  count: number;
}

// Relic Data (PoK)
export interface RelicData {
  id: string;
  name: string;
  description: string;
  timing?: string;
  purge?: boolean;
}

// Planet Attachment Data
export interface AttachmentData {
  id: string;
  name: string;
  resourceModifier?: number;
  influenceModifier?: number;
  techSpecialty?: TechColor;
  abilities?: string[];
}

// Complete Game Data Container
export interface GameDataContainer {
  factions: Record<string, FactionData>;
  technologies: Record<string, TechnologyData>;
  systems: Record<number, SystemData>;
  planets: Record<string, PlanetData>;
  strategyCards: Record<number, StrategyCardData>;
  objectives: Record<string, ObjectiveData>;
  actionCards: Record<string, ActionCardData>;
  agendaCards: Record<string, AgendaCardData>;
  promissoryNotes: Record<string, PromissoryNoteData>;
  explorationCards: Record<string, ExplorationCardData>;
  relics: Record<string, RelicData>;
  attachments: Record<string, AttachmentData>;
  units: Record<UnitType, UnitData>;
}
