// Common types used throughout the application

export type UUID = string;

export type PlayerColor =
  | 'red'
  | 'blue'
  | 'yellow'
  | 'green'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'black';

export type TechColor = 'blue' | 'red' | 'green' | 'yellow';

export type Expansion = 'base' | 'pok' | 'codex1' | 'codex2' | 'codex3' | 'codex4' | 'thunders_edge';

export type PlanetTrait = 'cultural' | 'hazardous' | 'industrial';

export type WormholeType = 'alpha' | 'beta' | 'gamma' | 'delta';

export type AnomalyType = 'asteroid' | 'nebula' | 'supernova' | 'gravity_rift';

export type UnitType =
  | 'fighter'
  | 'infantry'
  | 'mech'
  | 'destroyer'
  | 'carrier'
  | 'cruiser'
  | 'dreadnought'
  | 'war_sun'
  | 'flagship'
  | 'pds'
  | 'space_dock';

export type CardType =
  | 'action'
  | 'agenda'
  | 'objective_public_1'
  | 'objective_public_2'
  | 'objective_secret'
  | 'promissory'
  | 'exploration'
  | 'relic';

export interface HexCoord {
  q: number;
  r: number;
}

export interface DiceRoll {
  unitId: string;
  unitType: UnitType;
  roll: number;
  combatValue: number;
  hit: boolean;
  modifiers: string[];
}
