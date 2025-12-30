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
  // Structured timing for runtime implementation
  implementation?: AbilityImplementation;
}

// Structured ability implementation details
export interface AbilityImplementation {
  // When the ability triggers
  timing: AbilityTiming;
  // What kind of effect it has
  effectType: AbilityEffectType;
  // Requirements to use the ability
  requirements?: AbilityRequirement[];
  // Handler identifier for ability execution
  handlerId: string;
  // Whether using the ability is optional
  isOptional?: boolean;
  // Whether this ability is always active (passive)
  isPassive?: boolean;
}

// When abilities trigger
export type AbilityTiming =
  | { type: 'action' }
  | { type: 'passive' }
  | { type: 'when'; trigger: AbilityTrigger }
  | { type: 'after'; trigger: AbilityTrigger }
  | { type: 'phase'; phase: AbilityPhase; moment: 'start' | 'end' | 'during' };

// Game phases for phase-triggered abilities
export type AbilityPhase =
  | 'strategy'
  | 'action'
  | 'status'
  | 'agenda';

// What events can trigger abilities
export type AbilityTrigger =
  | 'combat_start'
  | 'space_combat_start'
  | 'ground_combat_start'
  | 'combat_round_start'
  | 'combat_round_end'
  | 'space_combat_round_end'
  | 'ground_combat_round_end'
  | 'unit_destroyed'
  | 'ship_destroyed'
  | 'ground_unit_destroyed'
  | 'combat_win'
  | 'combat_loss'
  | 'planet_control_gained'
  | 'movement_into_system'
  | 'system_activated'
  | 'agenda_revealed'
  | 'agenda_outcome'
  | 'trade_goods_gained'
  | 'commodities_gained'
  | 'action_cards_drawn'
  | 'production'
  | 'research'
  | 'exploration'
  | 'transaction'
  | 'diplomacy_resolved'
  | 'custodians_removed'
  | 'mecatol_control_gained'
  | 'token_gain';

// What kind of effect the ability has
export type AbilityEffectType =
  | 'combat_modifier'
  | 'combat_roll'
  | 'movement_modifier'
  | 'adjacency_modifier'
  | 'production_modifier'
  | 'production_restriction'
  | 'resource_gain'
  | 'unit_placement'
  | 'unit_conversion'
  | 'unit_capture'
  | 'tech_gain'
  | 'tech_modifier'
  | 'token_manipulation'
  | 'token_gain'
  | 'vote_modifier'
  | 'agenda_manipulation'
  | 'limit_modifier'
  | 'cost_modifier'
  | 'initiative_modifier'
  | 'retreat'
  | 'reroll'
  | 'steal'
  | 'discard';

// Requirements to activate an ability
export interface AbilityRequirement {
  type: 'spend_resource' | 'spend_token' | 'spend_trade_good' | 'have_unit' | 'control_planet' | 'discard_card';
  amount?: number;
  resource?: 'influence' | 'resources' | 'trade_goods';
  tokenPool?: 'strategy' | 'tactics' | 'fleet' | 'reinforcements';
  unitType?: UnitType;
  cardType?: 'action';
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
