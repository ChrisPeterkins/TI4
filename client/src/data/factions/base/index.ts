// Base game factions - extracted from TwilightImperiumUltimate
// Generated: 2025-09-01T16:15:22.060Z

export interface Faction {
  id: string;
  name: string;
  homeSystem: string;
  commodities: number;
  complexity: 'Low' | 'Medium' | 'High';
  startingUnits: Record<string, number>;
  startingTech: string[];
}

export const baseFactions: Faction[] = [
  {
    "name": "The Arborec",
    "id": "thearborec",
    "homeSystem": "Tile05",
    "commodities": 3,
    "complexity": "High",
    "gameVersion": "BaseGame",
    "startingUnits": {
      "infantry": 4,
      "fighters": 2,
      "cruisers": 1,
      "carriers": 1,
      "spaceDocks": 1,
      "pds": 1
    },
    "startingTech": []
  },
  {
    "name": "The Barony Of Letnev",
    "id": "thebaronyofletnev",
    "homeSystem": "Tile10",
    "commodities": 2,
    "complexity": "Low",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Clan Of Saar",
    "id": "theclanofsaar",
    "homeSystem": "Tile11",
    "commodities": 3,
    "complexity": "Medium",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Embers Of Muaat",
    "id": "theembersofmuaat",
    "homeSystem": "Tile04",
    "commodities": 4,
    "complexity": "High",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Emirates Of Hacan",
    "id": "theemiratesofhacan",
    "homeSystem": "Tile16",
    "commodities": 6,
    "complexity": "Low",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Federation Of Sol",
    "id": "thefederationofsol",
    "homeSystem": "Tile01",
    "commodities": 4,
    "complexity": "Low",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Ghosts Of Creuss",
    "id": "theghostsofcreuss",
    "homeSystem": "Tile17",
    "commodities": 4,
    "complexity": "Medium",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The L1Z1X Mindnet",
    "id": "thel1z1xmindnet",
    "homeSystem": "Tile06",
    "commodities": 2,
    "complexity": "Low",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Mentak Coalition",
    "id": "thementakcoalition",
    "homeSystem": "Tile02",
    "commodities": 2,
    "complexity": "High",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Naalu Collective",
    "id": "thenaalucollective",
    "homeSystem": "Tile09",
    "commodities": 3,
    "complexity": "Medium",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Nekro Virus",
    "id": "thenekrovirus",
    "homeSystem": "Tile08",
    "commodities": 3,
    "complexity": "High",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Sardakk N'orr",
    "id": "sardakknorr",
    "homeSystem": "Tile13",
    "commodities": 3,
    "complexity": "Medium",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Universities of Jol-Nar",
    "id": "theuniversitiesofjolnar",
    "homeSystem": "Tile12",
    "commodities": 4,
    "complexity": "Low",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": [
      "Neural Motivator",
      "Antimass Deflectors",
      "Sarween Tools",
      "Plasma Scoring"
    ]
  },
  {
    "name": "The Winnu",
    "id": "thewinnu",
    "homeSystem": "Tile07",
    "commodities": 3,
    "complexity": "Medium",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Xxcha Kingdom",
    "id": "thexxchakingdom",
    "homeSystem": "Tile14",
    "commodities": 4,
    "complexity": "Low",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Yin Brotherhood",
    "id": "theyinbrotherhood",
    "homeSystem": "Tile03",
    "commodities": 2,
    "complexity": "Low",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  },
  {
    "name": "The Yssaril Tribes",
    "id": "theyssariltribes",
    "homeSystem": "Tile15",
    "commodities": 3,
    "complexity": "Low",
    "gameVersion": "BaseGame",
    "startingUnits": {},
    "startingTech": []
  }
];

export type BaseFactionId = 'thearborec' | 'thebaronyofletnev' | 'theclanofsaar' | 'theembersofmuaat' | 'theemiratesofhacan' | 'thefederationofsol' | 'theghostsofcreuss' | 'thel1z1xmindnet' | 'thementakcoalition' | 'thenaalucollective' | 'thenekrovirus' | 'sardakknorr' | 'theuniversitiesofjolnar' | 'thewinnu' | 'thexxchakingdom' | 'theyinbrotherhood' | 'theyssariltribes';
