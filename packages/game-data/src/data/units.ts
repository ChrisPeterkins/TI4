import type { UnitData, UnitType } from '@ti4/shared';

export const units: Record<UnitType, UnitData> = {
  fighter: {
    type: 'fighter',
    cost: 0.5,
    combat: 9,
    isShip: true,
  },
  infantry: {
    type: 'infantry',
    cost: 0.5,
    combat: 8,
    isGround: true,
  },
  mech: {
    type: 'mech',
    cost: 2,
    combat: 6,
    sustainDamage: true,
    isGround: true,
  },
  destroyer: {
    type: 'destroyer',
    cost: 1,
    combat: 9,
    move: 2,
    antiFighterBarrage: { value: 9, count: 2 },
    isShip: true,
  },
  carrier: {
    type: 'carrier',
    cost: 3,
    combat: 9,
    move: 1,
    capacity: 4,
    isShip: true,
  },
  cruiser: {
    type: 'cruiser',
    cost: 2,
    combat: 7,
    move: 2,
    isShip: true,
  },
  dreadnought: {
    type: 'dreadnought',
    cost: 4,
    combat: 5,
    move: 1,
    capacity: 1,
    sustainDamage: true,
    bombardment: { value: 5, count: 1 },
    isShip: true,
  },
  war_sun: {
    type: 'war_sun',
    cost: 12,
    combat: 3,
    move: 2,
    capacity: 6,
    sustainDamage: true,
    bombardment: { value: 3, count: 3 },
    isShip: true,
  },
  flagship: {
    type: 'flagship',
    cost: 8,
    combat: 7,
    move: 1,
    capacity: 3,
    sustainDamage: true,
    isShip: true,
  },
  pds: {
    type: 'pds',
    cost: 0,
    spaceCannon: { value: 6, count: 1 },
    planetaryShield: true,
    isStructure: true,
  },
  space_dock: {
    type: 'space_dock',
    cost: 0,
    production: 0,
    isStructure: true,
  },
};

// Upgraded unit stats
export const upgradedUnits: Partial<Record<UnitType, Partial<UnitData>>> = {
  fighter: {
    combat: 8,
    move: 2,
  },
  infantry: {
    combat: 7,
  },
  destroyer: {
    combat: 8,
    move: 2,
    antiFighterBarrage: { value: 6, count: 3 },
  },
  carrier: {
    move: 2,
    capacity: 6,
  },
  cruiser: {
    combat: 6,
    move: 3,
    capacity: 1,
  },
  dreadnought: {
    move: 2,
    capacity: 1,
  },
  pds: {
    spaceCannon: { value: 5, count: 1 },
  },
  space_dock: {
    production: 4,
  },
};
