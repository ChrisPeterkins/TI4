// System Tiles - extracted from TwilightImperiumUltimate
// Generated: 2025-09-01T17:23:43.231Z

export interface SystemTile {
  id: number;
  name: string;
  tileCode: string;
  tileCategory: 'Blue' | 'Red' | 'Green' | 'None' | 'MecatolRex' | 'Hyperlane' | 'ExternalMapTile';
  faction?: string | null;
  anomaly?: string | null;
  isHomeSystem: boolean;
  expansion: string;
  planets: Planet[];
  totalResources: number;
  totalInfluence: number;
}

export interface Planet {
  name: string;
  resources: number;
  influence: number;
  trait?: string | null;
  techSkip?: string | null;
  isLegendary: boolean;
}

// All system tiles
export const systemTiles: SystemTile[] = [
  {
    "id": 6,
    "name": "Tile 01",
    "tileCode": "1",
    "faction": "The Federation of Sol",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Jord",
        "resources": 4,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 2
  },
  {
    "id": 7,
    "name": "Tile 02",
    "tileCode": "2",
    "faction": "The Mentak Coalition",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Moll Primus",
        "resources": 4,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 1
  },
  {
    "id": 8,
    "name": "Tile 03",
    "tileCode": "3",
    "faction": "The Yin Brotherhood",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Darien",
        "resources": 4,
        "influence": 4,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 4
  },
  {
    "id": 9,
    "name": "Tile 04",
    "tileCode": "4",
    "faction": "The Embers of Muaat",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Muaat",
        "resources": 4,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 1
  },
  {
    "id": 10,
    "name": "Tile 05",
    "tileCode": "5",
    "faction": "The Arborec",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Nestphar",
        "resources": 3,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 2
  },
  {
    "id": 11,
    "name": "Tile 06",
    "tileCode": "6",
    "faction": "The L1Z1X Mindnet",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "[0.0.0]",
        "resources": 5,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 5,
    "totalInfluence": 0
  },
  {
    "id": 12,
    "name": "Tile 07",
    "tileCode": "7",
    "faction": "The Winnu",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Winnu",
        "resources": 3,
        "influence": 4,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 4
  },
  {
    "id": 13,
    "name": "Tile 08",
    "tileCode": "8",
    "faction": "The Nekro Virus",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Mordai II",
        "resources": 4,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 0
  },
  {
    "id": 14,
    "name": "Tile 09",
    "tileCode": "9",
    "faction": "The Naalu Collective",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Maaluuk",
        "resources": 0,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Druaa",
        "resources": 3,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  },
  {
    "id": 15,
    "name": "Tile 10",
    "tileCode": "10",
    "faction": "The Barony of Letnev",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Arc Prime",
        "resources": 4,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Wren Terra",
        "resources": 2,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 6,
    "totalInfluence": 1
  },
  {
    "id": 16,
    "name": "Tile 11",
    "tileCode": "11",
    "faction": "The Clan of Saar",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Lisis Two",
        "resources": 1,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Ragh",
        "resources": 2,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 1
  },
  {
    "id": 17,
    "name": "Tile 12",
    "tileCode": "12",
    "faction": "The Universities of Jol-Nar",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Nar",
        "resources": 2,
        "influence": 3,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Jol",
        "resources": 1,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 5
  },
  {
    "id": 18,
    "name": "Tile 13",
    "tileCode": "13",
    "faction": "The Sardakk N'orr",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Trenlak",
        "resources": 1,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Quinarra",
        "resources": 3,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 1
  },
  {
    "id": 19,
    "name": "Tile 14",
    "tileCode": "14",
    "faction": "The Xxcha Kingdom",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Archon Ren",
        "resources": 2,
        "influence": 3,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Archon Tau",
        "resources": 1,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 4
  },
  {
    "id": 20,
    "name": "Tile 15",
    "tileCode": "15",
    "faction": "The Yssaril Tribes",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Retillion",
        "resources": 2,
        "influence": 3,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Shalloq",
        "resources": 1,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 5
  },
  {
    "id": 21,
    "name": "Tile 16",
    "tileCode": "16",
    "faction": "The Emirates of Hacan",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Arretze",
        "resources": 2,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Hercant",
        "resources": 1,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Kamdorn",
        "resources": 0,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 2
  },
  {
    "id": 22,
    "name": "Tile 17",
    "tileCode": "17",
    "faction": "The Ghosts of Creuss",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 23,
    "name": "Tile 18",
    "tileCode": "18",
    "faction": null,
    "anomaly": null,
    "tileCategory": "MecatolRex",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Mecatol Rex",
        "resources": 1,
        "influence": 6,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 6
  },
  {
    "id": 24,
    "name": "Tile 19",
    "tileCode": "19",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Wellon",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": "Cybernetic",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 2
  },
  {
    "id": 25,
    "name": "Tile 20",
    "tileCode": "20",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Vefut Two",
        "resources": 2,
        "influence": 2,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 2
  },
  {
    "id": 26,
    "name": "Tile 21",
    "tileCode": "21",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Thibah",
        "resources": 1,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Propulsion",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 1
  },
  {
    "id": 27,
    "name": "Tile 22",
    "tileCode": "22",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Tar'mann",
        "resources": 1,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Biotic",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 1
  },
  {
    "id": 28,
    "name": "Tile 23",
    "tileCode": "23",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Saudor",
        "resources": 2,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 2
  },
  {
    "id": 29,
    "name": "Tile 24",
    "tileCode": "24",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Mehar Xull",
        "resources": 1,
        "influence": 3,
        "trait": "Hazardous",
        "techSkip": "Warfare",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 3
  },
  {
    "id": 30,
    "name": "Tile 25",
    "tileCode": "25",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Quann",
        "resources": 2,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 1
  },
  {
    "id": 31,
    "name": "Tile 26",
    "tileCode": "26",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Lodor",
        "resources": 3,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 1
  },
  {
    "id": 32,
    "name": "Tile 27",
    "tileCode": "27",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "New Albion",
        "resources": 1,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Biotic",
        "isLegendary": false
      },
      {
        "name": "Starpoint",
        "resources": 3,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 2
  },
  {
    "id": 33,
    "name": "Tile 28",
    "tileCode": "28",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Tequran",
        "resources": 2,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Torkan",
        "resources": 0,
        "influence": 3,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 3
  },
  {
    "id": 34,
    "name": "Tile 29",
    "tileCode": "29",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Qucenn",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Rarron",
        "resources": 0,
        "influence": 3,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 5
  },
  {
    "id": 35,
    "name": "Tile 30",
    "tileCode": "30",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Mellon",
        "resources": 0,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Zohbat",
        "resources": 3,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  },
  {
    "id": 36,
    "name": "Tile 31",
    "tileCode": "31",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Lazar",
        "resources": 1,
        "influence": 0,
        "trait": "Industrial",
        "techSkip": "Cybernetic",
        "isLegendary": false
      },
      {
        "name": "Sakulag",
        "resources": 2,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 1
  },
  {
    "id": 37,
    "name": "Tile 32",
    "tileCode": "32",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Dal Bootha",
        "resources": 0,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Xxehan",
        "resources": 1,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 3
  },
  {
    "id": 38,
    "name": "Tile 33",
    "tileCode": "33",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Corneeq",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Resculon",
        "resources": 2,
        "influence": 0,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 2
  },
  {
    "id": 39,
    "name": "Tile 34",
    "tileCode": "34",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Centauri",
        "resources": 1,
        "influence": 3,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Gral",
        "resources": 1,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Propulsion",
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 4
  },
  {
    "id": 40,
    "name": "Tile 35",
    "tileCode": "35",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Bereg",
        "resources": 3,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Lirta Four",
        "resources": 2,
        "influence": 3,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 5,
    "totalInfluence": 4
  },
  {
    "id": 41,
    "name": "Tile 36",
    "tileCode": "36",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Arnor",
        "resources": 2,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Lor",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  },
  {
    "id": 42,
    "name": "Tile 37",
    "tileCode": "37",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Arinam",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Meer",
        "resources": 0,
        "influence": 4,
        "trait": "Hazardous",
        "techSkip": "Warfare",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 6
  },
  {
    "id": 43,
    "name": "Tile 38",
    "tileCode": "38",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Abyz",
        "resources": 3,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Fria",
        "resources": 2,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 5,
    "totalInfluence": 0
  },
  {
    "id": 44,
    "name": "Tile 39",
    "tileCode": "39",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 45,
    "name": "Tile 40",
    "tileCode": "40",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 46,
    "name": "Tile 41",
    "tileCode": "41",
    "faction": null,
    "anomaly": "GravityRift",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 47,
    "name": "Tile 42",
    "tileCode": "42",
    "faction": null,
    "anomaly": "Nebula",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 48,
    "name": "Tile 43",
    "tileCode": "43",
    "faction": null,
    "anomaly": "Supernova",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 49,
    "name": "Tile 44",
    "tileCode": "44",
    "faction": null,
    "anomaly": "AsteroidField",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 50,
    "name": "Tile 45",
    "tileCode": "45",
    "faction": null,
    "anomaly": "AsteroidField",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 51,
    "name": "Tile 46",
    "tileCode": "46",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 52,
    "name": "Tile 47",
    "tileCode": "47",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 53,
    "name": "Tile 48",
    "tileCode": "48",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 54,
    "name": "Tile 49",
    "tileCode": "49",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 55,
    "name": "Tile 50",
    "tileCode": "50",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 56,
    "name": "Tile 51",
    "tileCode": "51",
    "faction": "The Ghosts of Creuss",
    "anomaly": null,
    "tileCategory": "ExternalMapTile",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Creuss",
        "resources": 4,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 2
  },
  {
    "id": 57,
    "name": "Tile 52",
    "tileCode": "52",
    "faction": "The Mahact Gene-Sorcerers",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "Ixth",
        "resources": 3,
        "influence": 5,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 5
  },
  {
    "id": 58,
    "name": "Tile 53",
    "tileCode": "53",
    "faction": "The Nomad",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "Arcturus",
        "resources": 4,
        "influence": 4,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 4
  },
  {
    "id": 59,
    "name": "Tile 54",
    "tileCode": "54",
    "faction": "The Vuil'Raith Cabal",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "Acheron",
        "resources": 4,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 0
  },
  {
    "id": 60,
    "name": "Tile 55",
    "tileCode": "55",
    "faction": "The Titans of Ul",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "Elysium",
        "resources": 4,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 1
  },
  {
    "id": 61,
    "name": "Tile 56",
    "tileCode": "56",
    "faction": "The Empyrean",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "The Dark",
        "resources": 3,
        "influence": 4,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 4
  },
  {
    "id": 62,
    "name": "Tile 57",
    "tileCode": "57",
    "faction": "The Naaz-Rokha Alliance",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "Naazir",
        "resources": 2,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Rokha",
        "resources": 1,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  },
  {
    "id": 64,
    "name": "Tile 59",
    "tileCode": "59",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Archon Vail",
        "resources": 1,
        "influence": 3,
        "trait": "Hazardous",
        "techSkip": "Propulsion",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 3
  },
  {
    "id": 65,
    "name": "Tile 60",
    "tileCode": "60",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Perimeter",
        "resources": 2,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 1
  },
  {
    "id": 66,
    "name": "Tile 61",
    "tileCode": "61",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Ang",
        "resources": 2,
        "influence": 0,
        "trait": "Industrial",
        "techSkip": "Warfare",
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 0
  },
  {
    "id": 67,
    "name": "Tile 62",
    "tileCode": "62",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Semlore",
        "resources": 3,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": "Cybernetic",
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 2
  },
  {
    "id": 68,
    "name": "Tile 63",
    "tileCode": "63",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Vorhal",
        "resources": 0,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": "Biotic",
        "isLegendary": false
      }
    ],
    "totalResources": 0,
    "totalInfluence": 2
  },
  {
    "id": 69,
    "name": "Tile 64",
    "tileCode": "64",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Atlas",
        "resources": 3,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 1
  },
  {
    "id": 70,
    "name": "Tile 65",
    "tileCode": "65",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Primor",
        "resources": 2,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": true
      }
    ],
    "totalResources": 2,
    "totalInfluence": 1
  },
  {
    "id": 71,
    "name": "Tile 66",
    "tileCode": "66",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Hopes End",
        "resources": 3,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": true
      }
    ],
    "totalResources": 3,
    "totalInfluence": 0
  },
  {
    "id": 72,
    "name": "Tile 67",
    "tileCode": "67",
    "faction": null,
    "anomaly": "GravityRift",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Cormund",
        "resources": 2,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 0
  },
  {
    "id": 73,
    "name": "Tile 68",
    "tileCode": "68",
    "faction": null,
    "anomaly": "Nebula",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Everra",
        "resources": 3,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 1
  },
  {
    "id": 74,
    "name": "Tile 69",
    "tileCode": "69",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Accoen",
        "resources": 2,
        "influence": 3,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Jeol Ir",
        "resources": 2,
        "influence": 3,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 6
  },
  {
    "id": 75,
    "name": "Tile 70",
    "tileCode": "70",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Kraag",
        "resources": 2,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Siig",
        "resources": 0,
        "influence": 2,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 3
  },
  {
    "id": 76,
    "name": "Tile 71",
    "tileCode": "71",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Bakal",
        "resources": 3,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Alio Prima",
        "resources": 1,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 3
  },
  {
    "id": 77,
    "name": "Tile 72",
    "tileCode": "72",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Lisis",
        "resources": 2,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Velnor",
        "resources": 2,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Warfare",
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 3
  },
  {
    "id": 78,
    "name": "Tile 73",
    "tileCode": "73",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Cealdri",
        "resources": 0,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": "Cybernetic",
        "isLegendary": false
      },
      {
        "name": "Xanhact",
        "resources": 0,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 0,
    "totalInfluence": 3
  },
  {
    "id": 79,
    "name": "Tile 74",
    "tileCode": "74",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Vega Major",
        "resources": 2,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Vega Minor",
        "resources": 1,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": "Propulsion",
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  },
  {
    "id": 80,
    "name": "Tile 75",
    "tileCode": "75",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Abaddon",
        "resources": 1,
        "influence": 0,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Loki",
        "resources": 1,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Ashtroth",
        "resources": 2,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 2
  },
  {
    "id": 81,
    "name": "Tile 76",
    "tileCode": "76",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Rigel Two",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Rigel Three",
        "resources": 1,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Biotic",
        "isLegendary": false
      },
      {
        "name": "Rigel One",
        "resources": 0,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 4
  },
  {
    "id": 82,
    "name": "Tile 77",
    "tileCode": "77",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 83,
    "name": "Tile 78",
    "tileCode": "78",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 84,
    "name": "Tile 79",
    "tileCode": "79",
    "faction": null,
    "anomaly": "AsteroidField",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 85,
    "name": "Tile 80",
    "tileCode": "80",
    "faction": null,
    "anomaly": "Supernova",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 86,
    "name": "Tile 81",
    "tileCode": "81",
    "faction": "The Embers of Muaat",
    "anomaly": "Supernova",
    "tileCategory": "Red",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 87,
    "name": "Tile 82A",
    "tileCode": "82A",
    "faction": null,
    "anomaly": null,
    "tileCategory": "ExternalMapTile",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Mallice Inactive",
        "resources": 0,
        "influence": 3,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": true
      }
    ],
    "totalResources": 0,
    "totalInfluence": 3
  },
  {
    "id": 88,
    "name": "Tile 82B",
    "tileCode": "82B",
    "faction": null,
    "anomaly": null,
    "tileCategory": "ExternalMapTile",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Mallice",
        "resources": 0,
        "influence": 3,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": true
      }
    ],
    "totalResources": 0,
    "totalInfluence": 3
  },
  {
    "id": 89,
    "name": "Tile 83A",
    "tileCode": "83A",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 90,
    "name": "Tile 83B",
    "tileCode": "83B",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 91,
    "name": "Tile 84A",
    "tileCode": "84A",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 92,
    "name": "Tile 84B",
    "tileCode": "84B",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 93,
    "name": "Tile 85A",
    "tileCode": "85A",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 94,
    "name": "Tile 85B",
    "tileCode": "85B",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 95,
    "name": "Tile 86A",
    "tileCode": "86A",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 96,
    "name": "Tile 86B",
    "tileCode": "86B",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 97,
    "name": "Tile 87A",
    "tileCode": "87A",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 98,
    "name": "Tile 87B",
    "tileCode": "87B",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 99,
    "name": "Tile 88A",
    "tileCode": "88A",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 100,
    "name": "Tile 88B",
    "tileCode": "88B",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 101,
    "name": "Tile 89A",
    "tileCode": "89A",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 102,
    "name": "Tile 89B",
    "tileCode": "89B",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 103,
    "name": "Tile 90A",
    "tileCode": "90A",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 104,
    "name": "Tile 90B",
    "tileCode": "90B",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 105,
    "name": "Tile 91A",
    "tileCode": "91A",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 106,
    "name": "Tile 91B",
    "tileCode": "91B",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Hyperlane",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 107,
    "name": "Tile 92",
    "tileCode": "92",
    "faction": "TheCouncilKeleres",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "codex",
    "planets": [
      {
        "name": "Moll Primus Council Of Keleres",
        "resources": 4,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 1
  },
  {
    "id": 108,
    "name": "Tile 93",
    "tileCode": "93",
    "faction": "TheCouncilKeleres",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "codex",
    "planets": [
      {
        "name": "Archon Ren Council Of Keleres",
        "resources": 2,
        "influence": 3,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Archon Tau Council Of Keleres",
        "resources": 1,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 4
  },
  {
    "id": 109,
    "name": "Tile 94",
    "tileCode": "94",
    "faction": "TheCouncilKeleres",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "codex",
    "planets": [
      {
        "name": "Ylir Council Of Keleres",
        "resources": 0,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Valk Council Of Keleres",
        "resources": 2,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Avar Council Of Keleres",
        "resources": 1,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  }
];

// Home systems (tiles 1-17, 51-58)
export const homeSystems: SystemTile[] = [
  {
    "id": 6,
    "name": "Tile 01",
    "tileCode": "1",
    "faction": "The Federation of Sol",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Jord",
        "resources": 4,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 2
  },
  {
    "id": 7,
    "name": "Tile 02",
    "tileCode": "2",
    "faction": "The Mentak Coalition",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Moll Primus",
        "resources": 4,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 1
  },
  {
    "id": 8,
    "name": "Tile 03",
    "tileCode": "3",
    "faction": "The Yin Brotherhood",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Darien",
        "resources": 4,
        "influence": 4,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 4
  },
  {
    "id": 9,
    "name": "Tile 04",
    "tileCode": "4",
    "faction": "The Embers of Muaat",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Muaat",
        "resources": 4,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 1
  },
  {
    "id": 10,
    "name": "Tile 05",
    "tileCode": "5",
    "faction": "The Arborec",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Nestphar",
        "resources": 3,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 2
  },
  {
    "id": 11,
    "name": "Tile 06",
    "tileCode": "6",
    "faction": "The L1Z1X Mindnet",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "[0.0.0]",
        "resources": 5,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 5,
    "totalInfluence": 0
  },
  {
    "id": 12,
    "name": "Tile 07",
    "tileCode": "7",
    "faction": "The Winnu",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Winnu",
        "resources": 3,
        "influence": 4,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 4
  },
  {
    "id": 13,
    "name": "Tile 08",
    "tileCode": "8",
    "faction": "The Nekro Virus",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Mordai II",
        "resources": 4,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 0
  },
  {
    "id": 14,
    "name": "Tile 09",
    "tileCode": "9",
    "faction": "The Naalu Collective",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Maaluuk",
        "resources": 0,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Druaa",
        "resources": 3,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  },
  {
    "id": 15,
    "name": "Tile 10",
    "tileCode": "10",
    "faction": "The Barony of Letnev",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Arc Prime",
        "resources": 4,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Wren Terra",
        "resources": 2,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 6,
    "totalInfluence": 1
  },
  {
    "id": 16,
    "name": "Tile 11",
    "tileCode": "11",
    "faction": "The Clan of Saar",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Lisis Two",
        "resources": 1,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Ragh",
        "resources": 2,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 1
  },
  {
    "id": 17,
    "name": "Tile 12",
    "tileCode": "12",
    "faction": "The Universities of Jol-Nar",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Nar",
        "resources": 2,
        "influence": 3,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Jol",
        "resources": 1,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 5
  },
  {
    "id": 18,
    "name": "Tile 13",
    "tileCode": "13",
    "faction": "The Sardakk N'orr",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Trenlak",
        "resources": 1,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Quinarra",
        "resources": 3,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 1
  },
  {
    "id": 19,
    "name": "Tile 14",
    "tileCode": "14",
    "faction": "The Xxcha Kingdom",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Archon Ren",
        "resources": 2,
        "influence": 3,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Archon Tau",
        "resources": 1,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 4
  },
  {
    "id": 20,
    "name": "Tile 15",
    "tileCode": "15",
    "faction": "The Yssaril Tribes",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Retillion",
        "resources": 2,
        "influence": 3,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Shalloq",
        "resources": 1,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 5
  },
  {
    "id": 21,
    "name": "Tile 16",
    "tileCode": "16",
    "faction": "The Emirates of Hacan",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Arretze",
        "resources": 2,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Hercant",
        "resources": 1,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Kamdorn",
        "resources": 0,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 2
  },
  {
    "id": 22,
    "name": "Tile 17",
    "tileCode": "17",
    "faction": "The Ghosts of Creuss",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 56,
    "name": "Tile 51",
    "tileCode": "51",
    "faction": "The Ghosts of Creuss",
    "anomaly": null,
    "tileCategory": "ExternalMapTile",
    "isHomeSystem": true,
    "expansion": "base",
    "planets": [
      {
        "name": "Creuss",
        "resources": 4,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 2
  },
  {
    "id": 57,
    "name": "Tile 52",
    "tileCode": "52",
    "faction": "The Mahact Gene-Sorcerers",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "Ixth",
        "resources": 3,
        "influence": 5,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 5
  },
  {
    "id": 58,
    "name": "Tile 53",
    "tileCode": "53",
    "faction": "The Nomad",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "Arcturus",
        "resources": 4,
        "influence": 4,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 4
  },
  {
    "id": 59,
    "name": "Tile 54",
    "tileCode": "54",
    "faction": "The Vuil'Raith Cabal",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "Acheron",
        "resources": 4,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 0
  },
  {
    "id": 60,
    "name": "Tile 55",
    "tileCode": "55",
    "faction": "The Titans of Ul",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "Elysium",
        "resources": 4,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 1
  },
  {
    "id": 61,
    "name": "Tile 56",
    "tileCode": "56",
    "faction": "The Empyrean",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "The Dark",
        "resources": 3,
        "influence": 4,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 4
  },
  {
    "id": 62,
    "name": "Tile 57",
    "tileCode": "57",
    "faction": "The Naaz-Rokha Alliance",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [
      {
        "name": "Naazir",
        "resources": 2,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Rokha",
        "resources": 1,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  },
  {
    "id": 86,
    "name": "Tile 81",
    "tileCode": "81",
    "faction": "The Embers of Muaat",
    "anomaly": "Supernova",
    "tileCategory": "Red",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 107,
    "name": "Tile 92",
    "tileCode": "92",
    "faction": "TheCouncilKeleres",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "codex",
    "planets": [
      {
        "name": "Moll Primus Council Of Keleres",
        "resources": 4,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 1
  },
  {
    "id": 108,
    "name": "Tile 93",
    "tileCode": "93",
    "faction": "TheCouncilKeleres",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "codex",
    "planets": [
      {
        "name": "Archon Ren Council Of Keleres",
        "resources": 2,
        "influence": 3,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Archon Tau Council Of Keleres",
        "resources": 1,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 4
  },
  {
    "id": 109,
    "name": "Tile 94",
    "tileCode": "94",
    "faction": "TheCouncilKeleres",
    "anomaly": null,
    "tileCategory": "Green",
    "isHomeSystem": true,
    "expansion": "codex",
    "planets": [
      {
        "name": "Ylir Council Of Keleres",
        "resources": 0,
        "influence": 2,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Valk Council Of Keleres",
        "resources": 2,
        "influence": 0,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Avar Council Of Keleres",
        "resources": 1,
        "influence": 1,
        "trait": null,
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  }
];

// Blue tiles (planet systems)
export const blueTiles: SystemTile[] = [
  {
    "id": 24,
    "name": "Tile 19",
    "tileCode": "19",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Wellon",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": "Cybernetic",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 2
  },
  {
    "id": 25,
    "name": "Tile 20",
    "tileCode": "20",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Vefut Two",
        "resources": 2,
        "influence": 2,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 2
  },
  {
    "id": 26,
    "name": "Tile 21",
    "tileCode": "21",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Thibah",
        "resources": 1,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Propulsion",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 1
  },
  {
    "id": 27,
    "name": "Tile 22",
    "tileCode": "22",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Tar'mann",
        "resources": 1,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Biotic",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 1
  },
  {
    "id": 28,
    "name": "Tile 23",
    "tileCode": "23",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Saudor",
        "resources": 2,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 2
  },
  {
    "id": 29,
    "name": "Tile 24",
    "tileCode": "24",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Mehar Xull",
        "resources": 1,
        "influence": 3,
        "trait": "Hazardous",
        "techSkip": "Warfare",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 3
  },
  {
    "id": 30,
    "name": "Tile 25",
    "tileCode": "25",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Quann",
        "resources": 2,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 1
  },
  {
    "id": 31,
    "name": "Tile 26",
    "tileCode": "26",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Lodor",
        "resources": 3,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 1
  },
  {
    "id": 32,
    "name": "Tile 27",
    "tileCode": "27",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "New Albion",
        "resources": 1,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Biotic",
        "isLegendary": false
      },
      {
        "name": "Starpoint",
        "resources": 3,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 2
  },
  {
    "id": 33,
    "name": "Tile 28",
    "tileCode": "28",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Tequran",
        "resources": 2,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Torkan",
        "resources": 0,
        "influence": 3,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 3
  },
  {
    "id": 34,
    "name": "Tile 29",
    "tileCode": "29",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Qucenn",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Rarron",
        "resources": 0,
        "influence": 3,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 5
  },
  {
    "id": 35,
    "name": "Tile 30",
    "tileCode": "30",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Mellon",
        "resources": 0,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Zohbat",
        "resources": 3,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  },
  {
    "id": 36,
    "name": "Tile 31",
    "tileCode": "31",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Lazar",
        "resources": 1,
        "influence": 0,
        "trait": "Industrial",
        "techSkip": "Cybernetic",
        "isLegendary": false
      },
      {
        "name": "Sakulag",
        "resources": 2,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 1
  },
  {
    "id": 37,
    "name": "Tile 32",
    "tileCode": "32",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Dal Bootha",
        "resources": 0,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Xxehan",
        "resources": 1,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 3
  },
  {
    "id": 38,
    "name": "Tile 33",
    "tileCode": "33",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Corneeq",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Resculon",
        "resources": 2,
        "influence": 0,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 2
  },
  {
    "id": 39,
    "name": "Tile 34",
    "tileCode": "34",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Centauri",
        "resources": 1,
        "influence": 3,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Gral",
        "resources": 1,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Propulsion",
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 4
  },
  {
    "id": 40,
    "name": "Tile 35",
    "tileCode": "35",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Bereg",
        "resources": 3,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Lirta Four",
        "resources": 2,
        "influence": 3,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 5,
    "totalInfluence": 4
  },
  {
    "id": 41,
    "name": "Tile 36",
    "tileCode": "36",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Arnor",
        "resources": 2,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Lor",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  },
  {
    "id": 42,
    "name": "Tile 37",
    "tileCode": "37",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Arinam",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Meer",
        "resources": 0,
        "influence": 4,
        "trait": "Hazardous",
        "techSkip": "Warfare",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 6
  },
  {
    "id": 43,
    "name": "Tile 38",
    "tileCode": "38",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [
      {
        "name": "Abyz",
        "resources": 3,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Fria",
        "resources": 2,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 5,
    "totalInfluence": 0
  },
  {
    "id": 64,
    "name": "Tile 59",
    "tileCode": "59",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Archon Vail",
        "resources": 1,
        "influence": 3,
        "trait": "Hazardous",
        "techSkip": "Propulsion",
        "isLegendary": false
      }
    ],
    "totalResources": 1,
    "totalInfluence": 3
  },
  {
    "id": 65,
    "name": "Tile 60",
    "tileCode": "60",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Perimeter",
        "resources": 2,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 1
  },
  {
    "id": 66,
    "name": "Tile 61",
    "tileCode": "61",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Ang",
        "resources": 2,
        "influence": 0,
        "trait": "Industrial",
        "techSkip": "Warfare",
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 0
  },
  {
    "id": 67,
    "name": "Tile 62",
    "tileCode": "62",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Semlore",
        "resources": 3,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": "Cybernetic",
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 2
  },
  {
    "id": 68,
    "name": "Tile 63",
    "tileCode": "63",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Vorhal",
        "resources": 0,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": "Biotic",
        "isLegendary": false
      }
    ],
    "totalResources": 0,
    "totalInfluence": 2
  },
  {
    "id": 69,
    "name": "Tile 64",
    "tileCode": "64",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Atlas",
        "resources": 3,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 1
  },
  {
    "id": 70,
    "name": "Tile 65",
    "tileCode": "65",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Primor",
        "resources": 2,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": true
      }
    ],
    "totalResources": 2,
    "totalInfluence": 1
  },
  {
    "id": 71,
    "name": "Tile 66",
    "tileCode": "66",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Hopes End",
        "resources": 3,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": true
      }
    ],
    "totalResources": 3,
    "totalInfluence": 0
  },
  {
    "id": 74,
    "name": "Tile 69",
    "tileCode": "69",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Accoen",
        "resources": 2,
        "influence": 3,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Jeol Ir",
        "resources": 2,
        "influence": 3,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 6
  },
  {
    "id": 75,
    "name": "Tile 70",
    "tileCode": "70",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Kraag",
        "resources": 2,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Siig",
        "resources": 0,
        "influence": 2,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 3
  },
  {
    "id": 76,
    "name": "Tile 71",
    "tileCode": "71",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Bakal",
        "resources": 3,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Alio Prima",
        "resources": 1,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 3
  },
  {
    "id": 77,
    "name": "Tile 72",
    "tileCode": "72",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Lisis",
        "resources": 2,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Velnor",
        "resources": 2,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Warfare",
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 3
  },
  {
    "id": 78,
    "name": "Tile 73",
    "tileCode": "73",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Cealdri",
        "resources": 0,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": "Cybernetic",
        "isLegendary": false
      },
      {
        "name": "Xanhact",
        "resources": 0,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 0,
    "totalInfluence": 3
  },
  {
    "id": 79,
    "name": "Tile 74",
    "tileCode": "74",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Vega Major",
        "resources": 2,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Vega Minor",
        "resources": 1,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": "Propulsion",
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 3
  },
  {
    "id": 80,
    "name": "Tile 75",
    "tileCode": "75",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Abaddon",
        "resources": 1,
        "influence": 0,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Loki",
        "resources": 1,
        "influence": 2,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Ashtroth",
        "resources": 2,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 4,
    "totalInfluence": 2
  },
  {
    "id": 81,
    "name": "Tile 76",
    "tileCode": "76",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Blue",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Rigel Two",
        "resources": 1,
        "influence": 2,
        "trait": "Industrial",
        "techSkip": null,
        "isLegendary": false
      },
      {
        "name": "Rigel Three",
        "resources": 1,
        "influence": 1,
        "trait": "Industrial",
        "techSkip": "Biotic",
        "isLegendary": false
      },
      {
        "name": "Rigel One",
        "resources": 0,
        "influence": 1,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 4
  }
];

// Red tiles (anomalies)
export const redTiles: SystemTile[] = [
  {
    "id": 44,
    "name": "Tile 39",
    "tileCode": "39",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 45,
    "name": "Tile 40",
    "tileCode": "40",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 46,
    "name": "Tile 41",
    "tileCode": "41",
    "faction": null,
    "anomaly": "GravityRift",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 47,
    "name": "Tile 42",
    "tileCode": "42",
    "faction": null,
    "anomaly": "Nebula",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 48,
    "name": "Tile 43",
    "tileCode": "43",
    "faction": null,
    "anomaly": "Supernova",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 49,
    "name": "Tile 44",
    "tileCode": "44",
    "faction": null,
    "anomaly": "AsteroidField",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 50,
    "name": "Tile 45",
    "tileCode": "45",
    "faction": null,
    "anomaly": "AsteroidField",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 51,
    "name": "Tile 46",
    "tileCode": "46",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 52,
    "name": "Tile 47",
    "tileCode": "47",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 53,
    "name": "Tile 48",
    "tileCode": "48",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 54,
    "name": "Tile 49",
    "tileCode": "49",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 55,
    "name": "Tile 50",
    "tileCode": "50",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "base",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 72,
    "name": "Tile 67",
    "tileCode": "67",
    "faction": null,
    "anomaly": "GravityRift",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Cormund",
        "resources": 2,
        "influence": 0,
        "trait": "Hazardous",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 2,
    "totalInfluence": 0
  },
  {
    "id": 73,
    "name": "Tile 68",
    "tileCode": "68",
    "faction": null,
    "anomaly": "Nebula",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [
      {
        "name": "Everra",
        "resources": 3,
        "influence": 1,
        "trait": "Cultural",
        "techSkip": null,
        "isLegendary": false
      }
    ],
    "totalResources": 3,
    "totalInfluence": 1
  },
  {
    "id": 82,
    "name": "Tile 77",
    "tileCode": "77",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 83,
    "name": "Tile 78",
    "tileCode": "78",
    "faction": null,
    "anomaly": null,
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 84,
    "name": "Tile 79",
    "tileCode": "79",
    "faction": null,
    "anomaly": "AsteroidField",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 85,
    "name": "Tile 80",
    "tileCode": "80",
    "faction": null,
    "anomaly": "Supernova",
    "tileCategory": "Red",
    "isHomeSystem": false,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  },
  {
    "id": 86,
    "name": "Tile 81",
    "tileCode": "81",
    "faction": "The Embers of Muaat",
    "anomaly": "Supernova",
    "tileCategory": "Red",
    "isHomeSystem": true,
    "expansion": "pok",
    "planets": [],
    "totalResources": 0,
    "totalInfluence": 0
  }
];

// Green tiles (special/starting)
export const greenTiles: SystemTile[] = [];

// Mecatol Rex
export const mecatolRex: SystemTile | undefined = {
  "id": 23,
  "name": "Tile 18",
  "tileCode": "18",
  "faction": null,
  "anomaly": null,
  "tileCategory": "MecatolRex",
  "isHomeSystem": false,
  "expansion": "base",
  "planets": [
    {
      "name": "Mecatol Rex",
      "resources": 1,
      "influence": 6,
      "trait": null,
      "techSkip": null,
      "isLegendary": false
    }
  ],
  "totalResources": 1,
  "totalInfluence": 6
};

export const getTileByCode = (code: string): SystemTile | undefined => {
  return systemTiles.find(t => t.tileCode === code);
};

export const getTilesByCategory = (category: 'Blue' | 'Red' | 'Green' | 'None' | 'MecatolRex' | 'Hyperlane' | 'ExternalMapTile'): SystemTile[] => {
  return systemTiles.filter(t => t.tileCategory === category);
};
