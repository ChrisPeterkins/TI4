// Board and hex type definitions

export interface HexCoordinate {
  q: number; // Column
  r: number; // Row
  s: number; // s = -q - r (constraint for cubic coordinates)
}

export interface SystemTile {
  id: string;
  position: HexCoordinate;
  type: TileType;
  planets?: Planet[];
  wormhole?: WormholeType;
  anomaly?: AnomalyType;
  units: Unit[];
  owner?: string; // Player ID
}

export interface Planet {
  id: string;
  name: string;
  resources: number;
  influence: number;
  trait?: PlanetTrait;
  techSpecialty?: TechColor;
  legendary?: boolean;
  attachment?: string; // PoK exploration attachments
  units: GroundUnit[];
  exhausted: boolean;
  owner?: string; // Player ID
}

export enum TileType {
  SYSTEM = 'SYSTEM',
  HOME = 'HOME',
  EMPTY = 'EMPTY',
  ANOMALY = 'ANOMALY',
  WORMHOLE = 'WORMHOLE',
  MECATOL_REX = 'MECATOL_REX',
}

export enum WormholeType {
  ALPHA = 'ALPHA',
  BETA = 'BETA',
  GAMMA = 'GAMMA', // PoK
  DELTA = 'DELTA', // Creuss gate
}

export enum AnomalyType {
  GRAVITY_RIFT = 'GRAVITY_RIFT',
  NEBULA = 'NEBULA',
  SUPERNOVA = 'SUPERNOVA',
  ASTEROID_FIELD = 'ASTEROID_FIELD',
  MUAAT_SUPERNOVA = 'MUAAT_SUPERNOVA', // PoK
}

export enum PlanetTrait {
  HAZARDOUS = 'HAZARDOUS',
  INDUSTRIAL = 'INDUSTRIAL',
  CULTURAL = 'CULTURAL',
}

export enum TechColor {
  RED = 'RED',     // Warfare
  BLUE = 'BLUE',   // Propulsion
  GREEN = 'GREEN', // Biotic
  YELLOW = 'YELLOW', // Cybernetic
}

export interface Unit {
  id: string;
  type: string;
  owner: string;
  position: HexCoordinate;
  // Will be expanded with specific unit properties
}

export interface GroundUnit extends Unit {
  planet: string;
}