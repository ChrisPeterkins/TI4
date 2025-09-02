// Card type definitions - shared between client and server

export interface ActionCard {
  alias: string;
  name: string;
  phase?: string | null;
  window?: string | null;
  text: string;
  automationID?: string | null;
  flavorText?: string | null;
  isSabotage?: boolean;
  isComponentAction?: boolean;
  timing?: string | null;
  prerequisite?: string | null;
  source: string;
  expansion?: string | null;
  imageURL?: string | null;
  homebrewReplacesID?: string | null;
}

export interface AgendaCard {
  alias: string;
  name: string;
  type: AgendaType;
  text: string;
  electText?: string | null;
  forText?: string | null;
  againstText?: string | null;
  source: string;
  expansion?: string | null;
  imageURL?: string | null;
  homebrewReplacesID?: string | null;
}

export interface ExplorationCard {
  alias: string;
  name: string;
  type: ExplorationType;
  text: string;
  attachTo?: string | null;
  traits?: string[] | null;
  source: string;
  expansion?: string | null;
  imageURL?: string | null;
}

export interface FrontierCard {
  alias: string;
  name: string;
  text: string;
  traits?: string[] | null;
  resources?: number;
  influence?: number;
  source: string;
  expansion?: string | null;
  imageURL?: string | null;
}

export interface ObjectiveCard {
  alias: string;
  name: string;
  type: ObjectiveType;
  phase: ObjectivePhase;
  text: string;
  points: number;
  stage?: number;
  requirements?: string | null;
  prerequisite?: string | null;
  scoringCondition?: string | null;
  whenScored?: string;
  source: string;
  expansion?: string | null;
  imageURL?: string | null;
  homebrewReplacesID?: string | null;
}

export interface PromissoryCard {
  alias: string;
  name: string;
  faction?: string | null;
  text: string;
  color?: string | null;
  playArea?: string | null;
  source: string;
  expansion?: string | null;
  imageURL?: string | null;
  homebrewReplacesID?: string | null;
}

export interface RelicCard {
  alias: string;
  name: string;
  text: string;
  traits?: string[] | null;
  playArea?: string | null;
  source: string;
  expansion?: string | null;
  imageURL?: string | null;
  homebrewReplacesID?: string | null;
}

export interface StrategyCard {
  alias: string;
  name: string;
  order: number;
  text: string;
  primaryText: string;
  secondaryText: string;
  source: string;
  expansion?: string | null;
  imageURL?: string | null;
}

// Enums for card types
export type ActionCardPhase = 
  | 'Agenda'
  | 'Tactical' 
  | 'Strategy'
  | 'Status'
  | 'Action'
  | 'Combat';

export type AgendaType = 
  | 'Law'
  | 'Directive'
  | 'Agenda Phase';

export type ExplorationType = 
  | 'cultural'
  | 'hazardous'
  | 'industrial'
  | 'frontier';

export type ObjectiveType = 'public' | 'secret';

export type ObjectivePhase = 
  | 'Status'
  | 'Action'
  | 'Agenda'
  | 'Strategy'
  | 'Combat'
  | 'Omega';

// API response types
export interface PublicGameCards {
  publicObjectives: ObjectiveCard[];
  strategyCards: StrategyCard[];
  agendaDiscard: AgendaCard[];
}

export interface PlayerCards {
  hand: ActionCard[];
  promissoryNotes: PromissoryCard[];
  relics: RelicCard[];
  secretObjectives: ObjectiveCard[];
}