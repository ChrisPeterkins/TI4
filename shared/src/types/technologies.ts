// Technology type definitions

export interface Technology {
  id: number;
  name: string;
  techId: string;
  type: TechType;
  level?: number;
  expansion: string;
  prerequisites?: {
    count: number;
    type: string;
  };
  faction?: string;
  description?: string;
  abilityText?: string;
}

export type TechType = 
  | 'Biotic' 
  | 'Propulsion' 
  | 'Cybernetic' 
  | 'Warfare'
  | 'UnitUpgrade';

export interface UnitUpgradeTechnology extends Technology {
  type: 'UnitUpgrade';
  upgradesUnit: string;
}

export interface FactionTechnology extends Technology {
  faction: string;
}

// API response types
export interface TechTree {
  basic: Technology[];
  unitUpgrades: UnitUpgradeTechnology[];
  faction: FactionTechnology[];
}

export interface PlayerTechnologies {
  researched: string[];
  available: string[];
  startingTech: string[];
}