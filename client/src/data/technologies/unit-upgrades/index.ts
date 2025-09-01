// Unit Upgrade Technologies - extracted from TwilightImperiumUltimate
// Generated: 2025-09-01T16:42:01.702Z

export interface UnitUpgrade {
  id: number;
  name: string;
  techId: string;
  type: 'UnitUpgrade';
  level: number;
  faction?: string;
  expansion: string;
  prerequisites?: any;
}

export const standardUnitUpgrades: UnitUpgrade[] = [
  {
    "id": 27,
    "name": "Infantry II",
    "techId": "infantry-two",
    "type": "UnitUpgrade",
    "level": 2,
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 31,
    "name": "Fighter II",
    "techId": "fighter-two",
    "type": "UnitUpgrade",
    "level": 2,
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 33,
    "name": "Destroyer II",
    "techId": "destroyer-two",
    "type": "UnitUpgrade",
    "level": 2,
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 35,
    "name": "Carrier II",
    "techId": "carrier-two",
    "type": "UnitUpgrade",
    "level": 2,
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 37,
    "name": "Cruiser II",
    "techId": "cruiser-two",
    "type": "UnitUpgrade",
    "level": 3,
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 39,
    "name": "Dreadnought II",
    "techId": "dreadnought-two",
    "type": "UnitUpgrade",
    "level": 3,
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 43,
    "name": "War Sun",
    "techId": "war-sun",
    "type": "UnitUpgrade",
    "level": 4,
    "expansion": "base",
    "prerequisites": {
      "count": 4,
      "type": {
        "red": 1,
        "yellow": 3
      }
    }
  },
  {
    "id": 45,
    "name": "Space Dock II",
    "techId": "space-dock-two",
    "type": "UnitUpgrade",
    "level": 2,
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 48,
    "name": "PDS II",
    "techId": "pds-two",
    "type": "UnitUpgrade",
    "level": 2,
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  }
];

export const factionUnitUpgrades: UnitUpgrade[] = [
  {
    "id": 28,
    "name": "Spec Ops",
    "techId": "spec-ops",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "The Federation of Sol",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 29,
    "name": "Letani Warrior",
    "techId": "letani-warrior",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "The Arborec",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 30,
    "name": "Crimson Legionnaire",
    "techId": "crimson-legionnaire",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "The Mahact Gene-Sorcerers",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 32,
    "name": "Hybrid Crystal Fighter",
    "techId": "hybrid-crystal-fighter",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "The Naalu Collective",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 34,
    "name": "Strike Wing Alpha",
    "techId": "strike-wing-alpha",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "The Argent Flight",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 36,
    "name": "Advanced Carrier",
    "techId": "advanced-carrier",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "The Federation of Sol",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 38,
    "name": "Saturn Engine",
    "techId": "saturn-engine",
    "type": "UnitUpgrade",
    "level": 3,
    "faction": "The Titans of Ul",
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 40,
    "name": "Super Dreadnought",
    "techId": "super-dreadnought",
    "type": "UnitUpgrade",
    "level": 3,
    "faction": "The L1Z1X Mindnet",
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 41,
    "name": "Exotrireme",
    "techId": "exotrireme",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "The Sardakk N'orr",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 42,
    "name": "Memoria",
    "techId": "memoria",
    "type": "UnitUpgrade",
    "level": 3,
    "faction": "The Nomad",
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 44,
    "name": "Prototype War Sun",
    "techId": "prototype-war-sun",
    "type": "UnitUpgrade",
    "level": 4,
    "faction": "The Embers of Muaat",
    "expansion": "base",
    "prerequisites": {
      "count": 4,
      "type": {
        "any": 4
      }
    }
  },
  {
    "id": 46,
    "name": "Floating Factory",
    "techId": "floating-factory",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "The Clan of Saar",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 47,
    "name": "Dimensional Tear",
    "techId": "dimensional-tear",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "The Vuil'Raith Cabal",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 49,
    "name": "Hel Titan",
    "techId": "hel-titan",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "The Titans of Ul",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 92,
    "name": "Trade Port Two",
    "techId": "trade-port-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheCeldauriTradeConfederation",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 94,
    "name": "Aegis Two",
    "techId": "aegis-two",
    "type": "UnitUpgrade",
    "level": 3,
    "faction": "TheDihMohnFlotilla",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 96,
    "name": "Corsair Two",
    "techId": "corsair-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheFlorzenProfiteers",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 100,
    "name": "Combat Transport Two",
    "techId": "combat-transport-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheGheminaRaiders",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 108,
    "name": "Heavy Bomber Two",
    "techId": "heavy-bomber-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheLiZhoDynasty",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 110,
    "name": "Shattered Sky Two",
    "techId": "shattered-sky-two",
    "type": "UnitUpgrade",
    "level": 3,
    "faction": "TheLTokkKhrask",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 112,
    "name": "Gauss Cannon Two",
    "techId": "gauss-cannon-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheMirvedaProtectorate",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 114,
    "name": "Mycelium Ring Two",
    "techId": "mycelium-ring-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheMykoMentori",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 116,
    "name": "Voidflare Warden Two",
    "techId": "voidflare-warden-two",
    "type": "UnitUpgrade",
    "level": 3,
    "faction": "TheNivynStarKings",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 120,
    "name": "Terrafactory Two",
    "techId": "terrafactory-two",
    "type": "UnitUpgrade",
    "level": 4,
    "faction": "RohDhnaMechatronics",
    "expansion": "discordant",
    "prerequisites": {
      "count": 4,
      "type": {
        "any": 4
      }
    }
  },
  {
    "id": 122,
    "name": "Unholy Abomination Two",
    "techId": "unholy-abomination-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheSavagesOfCymiae",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 126,
    "name": "Blockade Runner Two",
    "techId": "blockade-runner-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheTnelisSyndicate",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 130,
    "name": "Raider Two",
    "techId": "raider-two",
    "type": "UnitUpgrade",
    "level": 3,
    "faction": "TheVaylerianScourge",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 132,
    "name": "Lancer Dreadnought Two",
    "techId": "lancer-dreadnought-two",
    "type": "UnitUpgrade",
    "level": 3,
    "faction": "TheVeldyrSovereignty",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 136,
    "name": "Impactor Two",
    "techId": "impactor-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheZelianPurifier",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 140,
    "name": "Chitin Hulk Two",
    "techId": "chitin-hulk-two",
    "type": "UnitUpgrade",
    "level": 3,
    "faction": "TheCheiranHordes",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": {
        "any": 3
      }
    }
  },
  {
    "id": 146,
    "name": "Orion Platform Two",
    "techId": "orion-platform-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheGledgeUnion",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 148,
    "name": "Star Dragon Two",
    "techId": "star-dragon-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheBerserkersOfKjalengard",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  },
  {
    "id": 156,
    "name": "Sabre Two",
    "techId": "sabre-two",
    "type": "UnitUpgrade",
    "level": 2,
    "faction": "TheNokarSellships",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": {
        "any": 2
      }
    }
  }
];

export const allUnitUpgrades = [...standardUnitUpgrades, ...factionUnitUpgrades];
