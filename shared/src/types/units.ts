// Unit type definitions

export interface UnitStats {
  cost: number;
  combat: number;
  move: number;
  capacity: number;
}

export enum UnitType {
  // Ships
  FIGHTER = 'FIGHTER',
  CARRIER = 'CARRIER',
  DESTROYER = 'DESTROYER',
  CRUISER = 'CRUISER',
  DREADNOUGHT = 'DREADNOUGHT',
  WAR_SUN = 'WAR_SUN',
  FLAGSHIP = 'FLAGSHIP',
  
  // Ground Forces
  INFANTRY = 'INFANTRY',
  MECH = 'MECH', // PoK
  
  // Structures
  PDS = 'PDS',
  SPACE_DOCK = 'SPACE_DOCK',
}

export interface Ship {
  id: string;
  type: UnitType;
  owner: string;
  position: string; // System ID
  sustained: boolean;
  upgraded: boolean;
}

export interface GroundForce {
  id: string;
  type: UnitType.INFANTRY | UnitType.MECH;
  owner: string;
  planet: string;
  sustained?: boolean; // For mechs
}

export interface Structure {
  id: string;
  type: UnitType.PDS | UnitType.SPACE_DOCK;
  owner: string;
  planet: string;
}

export interface Fleet {
  owner: string;
  system: string;
  ships: Ship[];
  totalCapacity: number;
  usedCapacity: number;
}