// Prophecy of Kings factions - extracted from TwilightImperiumUltimate
// Generated: 2025-09-01T16:19:22.026Z

import type { Faction } from '../base';

export const pokFactions: Faction[] = [
  {
    "name": "The Argent Flight",
    "id": "argent",
    "homeSystem": "Tile58",
    "commodities": 3,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "pds": 1,
      "infantry": 5,
      "fighters": 2,
      "destroyers": 2,
      "carriers": 1
    },
    "startingTech": []
  },
  {
    "name": "The Empyrean",
    "id": "empyrean",
    "homeSystem": "Tile56",
    "commodities": 4,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 4,
      "fighters": 2,
      "destroyers": 1,
      "carriers": 2
    },
    "startingTech": []
  },
  {
    "name": "The Mahact Gene-Sorcerers",
    "id": "mahact",
    "homeSystem": "Tile52",
    "commodities": 3,
    "complexity": "High",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 3,
      "fighters": 2,
      "carriers": 1,
      "cruisers": 1,
      "dreadnoughts": 1
    },
    "startingTech": []
  },
  {
    "name": "The Naaz-Rokha Alliance",
    "id": "naazrokha",
    "homeSystem": "Tile57",
    "commodities": 3,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 3,
      "fighters": 2,
      "destroyers": 1,
      "carriers": 2
    },
    "startingTech": []
  },
  {
    "name": "The Nomad",
    "id": "nomad",
    "homeSystem": "Tile53",
    "commodities": 4,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 4,
      "fighters": 3,
      "destroyers": 1,
      "carriers": 1
    },
    "startingTech": []
  },
  {
    "name": "The Titans of Ul",
    "id": "titans",
    "homeSystem": "Tile55",
    "commodities": 2,
    "complexity": "Medium",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 3,
      "fighters": 2,
      "cruisers": 2,
      "dreadnoughts": 1
    },
    "startingTech": []
  },
  {
    "name": "The Vuil'Raith Cabal",
    "id": "vulraith",
    "homeSystem": "Tile54",
    "commodities": 2,
    "complexity": "High",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 3,
      "fighters": 3,
      "carriers": 1,
      "cruisers": 1,
      "dreadnoughts": 1
    },
    "startingTech": []
  }
];

export type PoKFactionId = 'argent' | 'empyrean' | 'mahact' | 'naazrokha' | 'nomad' | 'titans' | 'vulraith';
