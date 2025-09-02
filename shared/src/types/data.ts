// Data type definitions for all game entities

import { Faction } from './factions';
import { Technology } from './technologies';
import { ObjectiveCard, StrategyCard } from './cards';

// Tiles and Map - Data-specific system tile (different from board SystemTile)
export interface DataSystemTile {
  id: number;
  name: string;
  tileCode: string;
  tileCategory: TileCategory;
  faction?: string | null;
  anomaly?: string | null;
  isHomeSystem: boolean;
  expansion: string;
  planets: DataPlanet[];
  totalResources: number;
  totalInfluence: number;
}

export interface DataPlanet {
  name: string;
  resources: number;
  influence: number;
  trait?: string | null;
  techSkip?: string | null;
  isLegendary: boolean;
}

export type TileCategory = 
  | 'Blue' 
  | 'Red' 
  | 'Green' 
  | 'None' 
  | 'MecatolRex' 
  | 'Hyperlane' 
  | 'ExternalMapTile';

// Units
export interface DataUnitStats {
  name: string;
  type: DataUnitType;
  cost?: number;
  combat?: number;
  move?: number;
  capacity?: number;
  sustainDamage?: boolean;
  bombardment?: number;
  antiFighterBarrage?: number;
  spaceCannon?: number;
  planetaryShield?: boolean;
  production?: number;
}

export type DataUnitType = 
  | 'Fighter'
  | 'Infantry'
  | 'Carrier'
  | 'Cruiser'
  | 'Destroyer'
  | 'Dreadnought'
  | 'Flagship'
  | 'War Sun'
  | 'PDS'
  | 'Space Dock'
  | 'Mech';

// Abilities
export interface DataFactionAbility {
  id: string;
  name: string;
  faction: string;
  type: AbilityType;
  text: string;
  window?: string;
  source: string;
}

export type AbilityType = 
  | 'passive' 
  | 'action' 
  | 'combat' 
  | 'special';

// Rules
export interface GameRule {
  id: string;
  category: string;
  name: string;
  text: string;
  source: string;
}

// Map Templates
export interface MapTemplate {
  name: string;
  playerCount: number;
  tilePositions: TilePosition[];
  description?: string;
}

export interface TilePosition {
  position: string;
  tileId?: number;
  locked?: boolean;
}

// Combat Modifiers
export interface CombatModifier {
  id: string;
  name: string;
  type: 'space' | 'ground';
  modifier: number;
  condition: string;
  source: string;
}

// Tokens
export interface Token {
  id: string;
  name: string;
  type: TokenType;
  description: string;
}

export type TokenType = 
  | 'command'
  | 'control'
  | 'trade_good'
  | 'commodity'
  | 'fighter'
  | 'infantry'
  | 'frontier';

// API Response types for fetching game data
export interface GameSetupData {
  factions: Faction[];
  mapTemplates: MapTemplate[];
  availableColors: string[];
}

export interface GameReferenceData {
  technologies: Technology[];
  units: DataUnitStats[];
  rules: GameRule[];
  combatModifiers: CombatModifier[];
}

export interface PublicGameData {
  board: DataSystemTile[];
  publicObjectives: ObjectiveCard[];
  strategyCards: StrategyCard[];
  currentPhase: string;
  round: number;
  speaker: string;
}