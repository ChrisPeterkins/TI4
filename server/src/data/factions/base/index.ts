// Base game factions - extracted from TwilightImperiumUltimate
// Generated: 2025-09-01T16:19:22.025Z

export interface Faction {
  id: string;
  name: string;
  homeSystem: string;
  commodities: number;
  complexity: 'Low' | 'Medium' | 'High';
  startingUnits: {
    infantry?: number;
    fighters?: number;
    carriers?: number;
    cruisers?: number;
    destroyers?: number;
    dreadnoughts?: number;
    warSuns?: number;
    spaceDocks?: number;
    pds?: number;
  };
  startingTech: string[];
}

export const baseFactions: Faction[] = [
  {
    "name": "The Arborec",
    "id": "arborec",
    "homeSystem": "Tile05",
    "commodities": 3,
    "complexity": "High",
    "startingUnits": {
      "spaceDocks": 1,
      "pds": 1,
      "infantry": 4,
      "fighters": 2,
      "carriers": 1,
      "cruisers": 1
    },
    "startingTech": []
  },
  {
    "name": "The Barony of Letnev",
    "id": "barony",
    "homeSystem": "Tile10",
    "commodities": 2,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 3,
      "fighters": 1,
      "destroyers": 1,
      "carriers": 1,
      "dreadnoughts": 1
    },
    "startingTech": []
  },
  {
    "name": "The Clan of Saar",
    "id": "saar",
    "homeSystem": "Tile11",
    "commodities": 3,
    "complexity": "Medium",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 4,
      "fighters": 2,
      "carriers": 2,
      "cruisers": 1
    },
    "startingTech": []
  },
  {
    "name": "The Embers of Muaat",
    "id": "muaat",
    "homeSystem": "Tile04",
    "commodities": 4,
    "complexity": "High",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 4,
      "fighters": 2,
      "warSuns": 1
    },
    "startingTech": []
  },
  {
    "name": "The Emirates of Hacan",
    "id": "hacan",
    "homeSystem": "Tile16",
    "commodities": 6,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 4,
      "fighters": 2,
      "cruisers": 1,
      "carriers": 2
    },
    "startingTech": []
  },
  {
    "name": "The Federation of Sol",
    "id": "sol",
    "homeSystem": "Tile01",
    "commodities": 4,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 5,
      "fighters": 3,
      "destroyers": 1,
      "carriers": 2
    },
    "startingTech": [
      "Neural Motivator",
      "Antimass Deflectors"
    ]
  },
  {
    "name": "The Ghosts of Creuss",
    "id": "creuss",
    "homeSystem": "Tile17",
    "commodities": 4,
    "complexity": "Medium",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 4,
      "fighters": 2,
      "destroyers": 2,
      "carriers": 1
    },
    "startingTech": []
  },
  {
    "name": "The L1Z1X Mindnet",
    "id": "l1z1x",
    "homeSystem": "Tile06",
    "commodities": 2,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "pds": 1,
      "infantry": 5,
      "fighters": 3,
      "carriers": 1,
      "dreadnoughts": 1
    },
    "startingTech": []
  },
  {
    "name": "The Mentak Coalition",
    "id": "mentak",
    "homeSystem": "Tile02",
    "commodities": 2,
    "complexity": "High",
    "startingUnits": {
      "spaceDocks": 1,
      "pds": 1,
      "infantry": 4,
      "fighters": 3,
      "carriers": 1,
      "cruisers": 2
    },
    "startingTech": []
  },
  {
    "name": "The Naalu Collective",
    "id": "naalu",
    "homeSystem": "Tile09",
    "commodities": 3,
    "complexity": "Medium",
    "startingUnits": {
      "spaceDocks": 1,
      "pds": 1,
      "infantry": 4,
      "fighters": 3,
      "destroyers": 1,
      "carriers": 1,
      "cruisers": 1
    },
    "startingTech": []
  },
  {
    "name": "The Nekro Virus",
    "id": "nekro",
    "homeSystem": "Tile08",
    "commodities": 3,
    "complexity": "High",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 2,
      "fighters": 2,
      "carriers": 1,
      "cruisers": 1,
      "dreadnoughts": 1
    },
    "startingTech": []
  },
  {
    "name": "The Sardakk N'orr",
    "id": "sardakk",
    "homeSystem": "Tile13",
    "commodities": 3,
    "complexity": "Medium",
    "startingUnits": {
      "spaceDocks": 1,
      "pds": 1,
      "infantry": 5,
      "carriers": 2,
      "cruisers": 1
    },
    "startingTech": []
  },
  {
    "name": "The Universities of Jol-Nar",
    "id": "jolnar",
    "homeSystem": "Tile12",
    "commodities": 4,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "pds": 2,
      "infantry": 2,
      "fighters": 1,
      "carriers": 2,
      "dreadnoughts": 1
    },
    "startingTech": [
      "Neural Motivator",
      "Antimass Deflectors",
      "Sarween Tools",
      "Plasma Scoring"
    ]
  },
  {
    "name": "The Winnu",
    "id": "winnu",
    "homeSystem": "Tile07",
    "commodities": 3,
    "complexity": "Medium",
    "startingUnits": {
      "spaceDocks": 1,
      "pds": 1,
      "infantry": 2,
      "fighters": 2,
      "carriers": 1,
      "cruisers": 1
    },
    "startingTech": [
      "Choose any 1 technology"
    ]
  },
  {
    "name": "The Xxcha Kingdom",
    "id": "xxcha",
    "homeSystem": "Tile14",
    "commodities": 4,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "pds": 1,
      "infantry": 4,
      "fighters": 3,
      "carriers": 1,
      "cruisers": 2
    },
    "startingTech": [
      "Graviton Laser System"
    ]
  },
  {
    "name": "The Yin Brotherhood",
    "id": "yin",
    "homeSystem": "Tile03",
    "commodities": 2,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "infantry": 4,
      "fighters": 4,
      "destroyers": 1,
      "carriers": 2
    },
    "startingTech": []
  },
  {
    "name": "The Yssaril Tribes",
    "id": "yssaril",
    "homeSystem": "Tile15",
    "commodities": 3,
    "complexity": "Low",
    "startingUnits": {
      "spaceDocks": 1,
      "pds": 1,
      "infantry": 5,
      "fighters": 2,
      "carriers": 2,
      "cruisers": 1
    },
    "startingTech": [
      "Neural Motivator"
    ]
  }
];

export type BaseFactionId = 'arborec' | 'barony' | 'saar' | 'muaat' | 'hacan' | 'sol' | 'creuss' | 'l1z1x' | 'mentak' | 'naalu' | 'nekro' | 'sardakk' | 'jolnar' | 'winnu' | 'xxcha' | 'yin' | 'yssaril';
