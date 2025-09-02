// Faction Technologies - extracted from TwilightImperiumUltimate
// Generated: 2025-09-01T16:42:01.702Z

export interface FactionTechnology {
  id: number;
  name: string;
  techId: string;
  type: string;
  level: number;
  faction: string;
  expansion: string;
  prerequisites?: any;
}

export const factionTechnologies: { [faction: string]: FactionTechnology[] } = {
  "The Empyrean": [
    {
      "id": 50,
      "name": "Voidwatch",
      "techId": "voidwatch",
      "type": "Biotic",
      "level": 1,
      "faction": "The Empyrean",
      "expansion": "base",
      "prerequisites": {
        "count": 1,
        "type": "Biotic"
      }
    },
    {
      "id": 63,
      "name": "Aetherstream",
      "techId": "aetherstream",
      "type": "Propulsion",
      "level": 2,
      "faction": "The Empyrean",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Propulsion"
      }
    }
  ],
  "The Xxcha Kingdom": [
    {
      "id": 51,
      "name": "Instrinct Training",
      "techId": "instrinct-training",
      "type": "Biotic",
      "level": 1,
      "faction": "The Xxcha Kingdom",
      "expansion": "base",
      "prerequisites": {
        "count": 1,
        "type": "Biotic"
      }
    },
    {
      "id": 75,
      "name": "Nullification Field",
      "techId": "nullification-field",
      "type": "Cybernetic",
      "level": 2,
      "faction": "The Xxcha Kingdom",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "The Yssaril Tribes": [
    {
      "id": 52,
      "name": "Transparasteel Plating",
      "techId": "transparasteel-plating",
      "type": "Biotic",
      "level": 1,
      "faction": "The Yssaril Tribes",
      "expansion": "base",
      "prerequisites": {
        "count": 1,
        "type": "Biotic"
      }
    },
    {
      "id": 60,
      "name": "Mageon Implants",
      "techId": "mageon-implants",
      "type": "Biotic",
      "level": 3,
      "faction": "The Yssaril Tribes",
      "expansion": "base",
      "prerequisites": {
        "count": 3,
        "type": "Biotic"
      }
    }
  ],
  "The Mahact Gene-Sorcerers": [
    {
      "id": 53,
      "name": "Genetic Recombination",
      "techId": "genetic-recombination",
      "type": "Biotic",
      "level": 1,
      "faction": "The Mahact Gene-Sorcerers",
      "expansion": "base",
      "prerequisites": {
        "count": 1,
        "type": "Biotic"
      }
    }
  ],
  "The Arborec": [
    {
      "id": 54,
      "name": "Bioplasmosis",
      "techId": "bioplasmosis",
      "type": "Biotic",
      "level": 2,
      "faction": "The Arborec",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Biotic"
      }
    }
  ],
  "The Emirates of Hacan": [
    {
      "id": 55,
      "name": "Production Biomes",
      "techId": "production-biomes",
      "type": "Biotic",
      "level": 2,
      "faction": "The Emirates of Hacan",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Biotic"
      }
    },
    {
      "id": 78,
      "name": "Quantum Datahub Node",
      "techId": "quantum-datahub-node",
      "type": "Cybernetic",
      "level": 3,
      "faction": "The Emirates of Hacan",
      "expansion": "base",
      "prerequisites": {
        "count": 3,
        "type": "Cybernetic"
      }
    }
  ],
  "The Yin Brotherhood": [
    {
      "id": 56,
      "name": "Yin Spinner",
      "techId": "yin-spinner",
      "type": "Biotic",
      "level": 2,
      "faction": "The Yin Brotherhood",
      "expansion": "deprecated",
      "prerequisites": {
        "count": 2,
        "type": "Biotic"
      }
    },
    {
      "id": 57,
      "name": "Yin Spinner Ω",
      "techId": "yin-spinner-omega",
      "type": "Biotic",
      "level": 2,
      "faction": "The Yin Brotherhood",
      "expansion": "codex",
      "prerequisites": {
        "count": 2,
        "type": "Biotic"
      }
    },
    {
      "id": 76,
      "name": "Impulse Core",
      "techId": "impulse-core",
      "type": "Cybernetic",
      "level": 2,
      "faction": "The Yin Brotherhood",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "The Naalu Collective": [
    {
      "id": 58,
      "name": "Neuroglaive",
      "techId": "neuroglaive",
      "type": "Biotic",
      "level": 3,
      "faction": "The Naalu Collective",
      "expansion": "base",
      "prerequisites": {
        "count": 3,
        "type": "Biotic"
      }
    }
  ],
  "The Naaz-Rokha Alliance": [
    {
      "id": 59,
      "name": "Pre Fab Arcologies",
      "techId": "pre-fab-arcologies",
      "type": "Biotic",
      "level": 3,
      "faction": "The Naaz-Rokha Alliance",
      "expansion": "base",
      "prerequisites": {
        "count": 3,
        "type": "Biotic"
      }
    },
    {
      "id": 81,
      "name": "Supercharge",
      "techId": "supercharge",
      "type": "Warfare",
      "level": 1,
      "faction": "The Naaz-Rokha Alliance",
      "expansion": "pok",
      "prerequisites": {
        "count": 1,
        "type": "Warfare"
      }
    }
  ],
  "The Clan of Saar": [
    {
      "id": 61,
      "name": "Chaos Mapping",
      "techId": "chaos-mapping",
      "type": "Propulsion",
      "level": 1,
      "faction": "The Clan of Saar",
      "expansion": "base",
      "prerequisites": {
        "count": 1,
        "type": "Propulsion"
      }
    }
  ],
  "The Universities of Jol-Nar": [
    {
      "id": 62,
      "name": "Spacial Conduit Cylinder",
      "techId": "spacial-conduit-cylinder",
      "type": "Propulsion",
      "level": 2,
      "faction": "The Universities of Jol-Nar",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Propulsion"
      }
    },
    {
      "id": 73,
      "name": "E-Res Siphons",
      "techId": "e-res-siphons",
      "type": "Cybernetic",
      "level": 2,
      "faction": "The Universities of Jol-Nar",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "The Ghosts of Creuss": [
    {
      "id": 64,
      "name": "Wormhole Generator",
      "techId": "wormhole-generator",
      "type": "Propulsion",
      "level": 2,
      "faction": "The Ghosts of Creuss",
      "expansion": "deprecated",
      "prerequisites": {
        "count": 2,
        "type": "Propulsion"
      }
    },
    {
      "id": 65,
      "name": "Wormhole Generator Ω",
      "techId": "wormhole-generator-omega",
      "type": "Propulsion",
      "level": 2,
      "faction": "The Ghosts of Creuss",
      "expansion": "codex",
      "prerequisites": {
        "count": 2,
        "type": "Propulsion"
      }
    },
    {
      "id": 80,
      "name": "Dimensional Splicer",
      "techId": "dimensional-splicer",
      "type": "Warfare",
      "level": 1,
      "faction": "The Ghosts of Creuss",
      "expansion": "base",
      "prerequisites": {
        "count": 1,
        "type": "Warfare"
      }
    }
  ],
  "The Winnu": [
    {
      "id": 66,
      "name": "Lazax Gate Folding",
      "techId": "lazax-gate-folding",
      "type": "Propulsion",
      "level": 2,
      "faction": "The Winnu",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Propulsion"
      }
    },
    {
      "id": 74,
      "name": "Hegemonic Trade Policy",
      "techId": "hegemonic-trade-policy",
      "type": "Cybernetic",
      "level": 2,
      "faction": "The Winnu",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "The Argent Flight": [
    {
      "id": 67,
      "name": "Aerie Hololattice",
      "techId": "aerie-hololattice",
      "type": "Cybernetic",
      "level": 1,
      "faction": "The Argent Flight",
      "expansion": "pok",
      "prerequisites": {
        "count": 1,
        "type": "Cybernetic"
      }
    }
  ],
  "The Barony of Letnev": [
    {
      "id": 68,
      "name": "L4 Disruptors",
      "techId": "l4-disruptors",
      "type": "Cybernetic",
      "level": 1,
      "faction": "The Barony of Letnev",
      "expansion": "base",
      "prerequisites": {
        "count": 1,
        "type": "Cybernetic"
      }
    },
    {
      "id": 83,
      "name": "Non Euclidian Shielding",
      "techId": "non-euclidian-shielding",
      "type": "Warfare",
      "level": 2,
      "faction": "The Barony of Letnev",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    }
  ],
  "The Nomad": [
    {
      "id": 69,
      "name": "Temporal Command Suite",
      "techId": "temporal-command-suite",
      "type": "Cybernetic",
      "level": 1,
      "faction": "The Nomad",
      "expansion": "pok",
      "prerequisites": {
        "count": 1,
        "type": "Cybernetic"
      }
    }
  ],
  "The Council Keleres": [
    {
      "id": 70,
      "name": "I.I.H.Q. Modernization",
      "techId": "iihq-modernization",
      "type": "Cybernetic",
      "level": 1,
      "faction": "The Council Keleres",
      "expansion": "codex",
      "prerequisites": {
        "count": 1,
        "type": "Cybernetic"
      }
    },
    {
      "id": 77,
      "name": "Agency Supply Network",
      "techId": "agency-supply-network",
      "type": "Cybernetic",
      "level": 2,
      "faction": "The Council Keleres",
      "expansion": "codex",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "The Mentak Coalition": [
    {
      "id": 71,
      "name": "Salvage Operations",
      "techId": "salvage-operations",
      "type": "Cybernetic",
      "level": 2,
      "faction": "The Mentak Coalition",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    },
    {
      "id": 79,
      "name": "Mirror Computing",
      "techId": "mirror-computing",
      "type": "Cybernetic",
      "level": 3,
      "faction": "The Mentak Coalition",
      "expansion": "base",
      "prerequisites": {
        "count": 3,
        "type": "Cybernetic"
      }
    }
  ],
  "The L1Z1X Mindnet": [
    {
      "id": 72,
      "name": "Inheritance Systems",
      "techId": "inheritance-systems",
      "type": "Cybernetic",
      "level": 2,
      "faction": "The L1Z1X Mindnet",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "The Vuil'Raith Cabal": [
    {
      "id": 82,
      "name": "Vortex",
      "techId": "vortex",
      "type": "Warfare",
      "level": 1,
      "faction": "The Vuil'Raith Cabal",
      "expansion": "pok",
      "prerequisites": {
        "count": 1,
        "type": "Warfare"
      }
    }
  ],
  "The Embers of Muaat": [
    {
      "id": 84,
      "name": "Magmus Reactor",
      "techId": "magmus-reactor",
      "type": "Warfare",
      "level": 2,
      "faction": "The Embers of Muaat",
      "expansion": "deprecated",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    },
    {
      "id": 85,
      "name": "Magmus Reactor Ω",
      "techId": "magmus-reactor-omega",
      "type": "Warfare",
      "level": 2,
      "faction": "The Embers of Muaat",
      "expansion": "codex",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    }
  ],
  "The Sardakk N'orr": [
    {
      "id": 86,
      "name": "Walkyrie Particle Weave",
      "techId": "walkyrie-particle-weave",
      "type": "Warfare",
      "level": 2,
      "faction": "The Sardakk N'orr",
      "expansion": "base",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    }
  ],
  "The Nekro Virus": [
    {
      "id": 87,
      "name": "Valefar Assimilator X",
      "techId": "valefar-assimilator-x",
      "type": "Faction",
      "level": 0,
      "faction": "The Nekro Virus",
      "expansion": "base"
    },
    {
      "id": 88,
      "name": "Valefar Assimilator Y",
      "techId": "valefar-assimilator-y",
      "type": "Faction",
      "level": 0,
      "faction": "The Nekro Virus",
      "expansion": "base"
    }
  ],
  "TheAugursOfIlyxum": [
    {
      "id": 89,
      "name": "Psychographics",
      "techId": "psychographics",
      "type": "Biotic",
      "level": 3,
      "faction": "TheAugursOfIlyxum",
      "expansion": "discordant",
      "prerequisites": {
        "count": 3,
        "type": "Biotic"
      }
    },
    {
      "id": 90,
      "name": "Sentient Datapool",
      "techId": "sentient-datapool",
      "type": "Cybernetic",
      "level": 2,
      "faction": "TheAugursOfIlyxum",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "TheCeldauriTradeConfederation": [
    {
      "id": 91,
      "name": "Emergency Mobilization Protocols",
      "techId": "emergency-mobilization-protocols",
      "type": "Warfare",
      "level": 2,
      "faction": "TheCeldauriTradeConfederation",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    }
  ],
  "TheDihMohnFlotilla": [
    {
      "id": 93,
      "name": "Impressment Programs",
      "techId": "impressment-programs",
      "type": "Cybernetic",
      "level": 2,
      "faction": "TheDihMohnFlotilla",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "TheFlorzenProfiteers": [
    {
      "id": 95,
      "name": "Blackmail Programs",
      "techId": "blackmail-programs",
      "type": "Biotic",
      "level": 2,
      "faction": "TheFlorzenProfiteers",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Biotic"
      }
    }
  ],
  "TheFreeSystemsCompact": [
    {
      "id": 97,
      "name": "Envoy Network",
      "techId": "envoy-network",
      "type": "Biotic",
      "level": 1,
      "faction": "TheFreeSystemsCompact",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Biotic"
      }
    },
    {
      "id": 98,
      "name": "Covert Strike Teams",
      "techId": "covert-strike-teams",
      "type": "Cybernetic",
      "level": 2,
      "faction": "TheFreeSystemsCompact",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "TheGheminaRaiders": [
    {
      "id": 99,
      "name": "War Song Implants",
      "techId": "war-song-implants",
      "type": "Biotic",
      "level": 3,
      "faction": "TheGheminaRaiders",
      "expansion": "discordant",
      "prerequisites": {
        "count": 3,
        "type": "Biotic"
      }
    }
  ],
  "TheGlimmerOfMortheus": [
    {
      "id": 101,
      "name": "Fractal Plating",
      "techId": "fractal-plating",
      "type": "Warfare",
      "level": 2,
      "faction": "TheGlimmerOfMortheus",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    },
    {
      "id": 102,
      "name": "Fabrication Grid",
      "techId": "fabrication-grid",
      "type": "Cybernetic",
      "level": 2,
      "faction": "TheGlimmerOfMortheus",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "TheKolleccSociety": [
    {
      "id": 103,
      "name": "Seeker Drones",
      "techId": "seeker-drones",
      "type": "Cybernetic",
      "level": 2,
      "faction": "TheKolleccSociety",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    },
    {
      "id": 104,
      "name": "Shrouded Skirmishers",
      "techId": "shrouded-skirmishers",
      "type": "Propulsion",
      "level": 1,
      "faction": "TheKolleccSociety",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Propulsion"
      }
    }
  ],
  "TheKortaliTribunal": [
    {
      "id": 105,
      "name": "Tempest Drive",
      "techId": "tempest-drive",
      "type": "Biotic",
      "level": 2,
      "faction": "TheKortaliTribunal",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Biotic"
      }
    },
    {
      "id": 106,
      "name": "Deliverance Engine",
      "techId": "deliverance-engine",
      "type": "Warfare",
      "level": 2,
      "faction": "TheKortaliTribunal",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    }
  ],
  "TheLiZhoDynasty": [
    {
      "id": 107,
      "name": "Wraith Engine",
      "techId": "wraith-engine",
      "type": "Propulsion",
      "level": 2,
      "faction": "TheLiZhoDynasty",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Propulsion"
      }
    }
  ],
  "TheLTokkKhrask": [
    {
      "id": 109,
      "name": "Stones Embrace",
      "techId": "stones-embrace",
      "type": "Biotic",
      "level": 2,
      "faction": "TheLTokkKhrask",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Biotic"
      }
    }
  ],
  "TheMirvedaProtectorate": [
    {
      "id": 111,
      "name": "Orbital Defense Grid",
      "techId": "orbital-defense-grid",
      "type": "Warfare",
      "level": 2,
      "faction": "TheMirvedaProtectorate",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    }
  ],
  "TheMykoMentori": [
    {
      "id": 113,
      "name": "Psychoactive Armaments",
      "techId": "psychoactive-armaments",
      "type": "Biotic",
      "level": 2,
      "faction": "TheMykoMentori",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Biotic"
      }
    }
  ],
  "TheNivynStarKings": [
    {
      "id": 115,
      "name": "Voidwake Missiles",
      "techId": "voidwake-missiles",
      "type": "Cybernetic",
      "level": 1,
      "faction": "TheNivynStarKings",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Cybernetic"
      }
    }
  ],
  "TheOlradinLeague": [
    {
      "id": 117,
      "name": "False Flag Operations",
      "techId": "false-flag-operations",
      "type": "Warfare",
      "level": 1,
      "faction": "TheOlradinLeague",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Warfare"
      }
    },
    {
      "id": 118,
      "name": "Geosympathic Impeller",
      "techId": "geosympathic-impeller",
      "type": "Propulsion",
      "level": 1,
      "faction": "TheOlradinLeague",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Propulsion"
      }
    }
  ],
  "RohDhnaMechatronics": [
    {
      "id": 119,
      "name": "Contractual Obligations",
      "techId": "contractual-obligations",
      "type": "Cybernetic",
      "level": 2,
      "faction": "RohDhnaMechatronics",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "TheSavagesOfCymiae": [
    {
      "id": 121,
      "name": "Recursive Worm",
      "techId": "recursive-worm",
      "type": "Cybernetic",
      "level": 1,
      "faction": "TheSavagesOfCymiae",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Cybernetic"
      }
    }
  ],
  "TheShipwrightsofAxis": [
    {
      "id": 123,
      "name": "Rift Engines",
      "techId": "rift-engines",
      "type": "Propulsion",
      "level": 1,
      "faction": "TheShipwrightsofAxis",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Propulsion"
      }
    },
    {
      "id": 124,
      "name": "Emergency Deployment",
      "techId": "emergency-deployment",
      "type": "Cybernetic",
      "level": 3,
      "faction": "TheShipwrightsofAxis",
      "expansion": "discordant",
      "prerequisites": {
        "count": 3,
        "type": "Cybernetic"
      }
    }
  ],
  "TheTnelisSyndicate": [
    {
      "id": 125,
      "name": "Daedalon Flight System",
      "techId": "daedalon-flight-system",
      "type": "Cybernetic",
      "level": 1,
      "faction": "TheTnelisSyndicate",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Cybernetic"
      }
    }
  ],
  "TheVadenBankingClans": [
    {
      "id": 127,
      "name": "Midas Turbine",
      "techId": "midas-turbine",
      "type": "Propulsion",
      "level": 1,
      "faction": "TheVadenBankingClans",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Propulsion"
      }
    },
    {
      "id": 128,
      "name": "Krovoz Strike Teams",
      "techId": "krovoz-strike-teams",
      "type": "Cybernetic",
      "level": 2,
      "faction": "TheVadenBankingClans",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "TheVaylerianScourge": [
    {
      "id": 129,
      "name": "Scavenger Exos",
      "techId": "scavenger-exos",
      "type": "Warfare",
      "level": 1,
      "faction": "TheVaylerianScourge",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Warfare"
      }
    }
  ],
  "TheVeldyrSovereignty": [
    {
      "id": 131,
      "name": "Seidr Project",
      "techId": "seidr-project",
      "type": "Warfare",
      "level": 2,
      "faction": "TheVeldyrSovereignty",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    }
  ],
  "TheZealotsOfRhodun": [
    {
      "id": 133,
      "name": "Sanctification Field",
      "techId": "sanctification-field",
      "type": "Cybernetic",
      "level": 3,
      "faction": "TheZealotsOfRhodun",
      "expansion": "discordant",
      "prerequisites": {
        "count": 3,
        "type": "Cybernetic"
      }
    },
    {
      "id": 134,
      "name": "Pilgrimage Beacons",
      "techId": "pilgrimage-beacons",
      "type": "Propulsion",
      "level": 2,
      "faction": "TheZealotsOfRhodun",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Propulsion"
      }
    }
  ],
  "TheZelianPurifier": [
    {
      "id": 135,
      "name": "Shard Volley",
      "techId": "shard-volley",
      "type": "Warfare",
      "level": 1,
      "faction": "TheZelianPurifier",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Warfare"
      }
    }
  ],
  "TheBentorConglomerate": [
    {
      "id": 137,
      "name": "Broker Network",
      "techId": "broker-network",
      "type": "Biotic",
      "level": 1,
      "faction": "TheBentorConglomerate",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Biotic"
      }
    },
    {
      "id": 138,
      "name": "Merged Replicators",
      "techId": "merged-replicators",
      "type": "Cybernetic",
      "level": 2,
      "faction": "TheBentorConglomerate",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "TheCheiranHordes": [
    {
      "id": 139,
      "name": "Brood Pod",
      "techId": "brood-pod",
      "type": "Warfare",
      "level": 2,
      "faction": "TheCheiranHordes",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    }
  ],
  "TheEdynMandate": [
    {
      "id": 141,
      "name": "Unity Algorithm",
      "techId": "unity-algorithm",
      "type": "Biotic",
      "level": 3,
      "faction": "TheEdynMandate",
      "expansion": "discordant",
      "prerequisites": {
        "count": 3,
        "type": "Biotic"
      }
    },
    {
      "id": 142,
      "name": "Encrypted Trade Hub",
      "techId": "encrypted-trade-hub",
      "type": "Cybernetic",
      "level": 2,
      "faction": "TheEdynMandate",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ],
  "TheGhotiWayfarers": [
    {
      "id": 143,
      "name": "Networked Command",
      "techId": "networked-command",
      "type": "Biotic",
      "level": 1,
      "faction": "TheGhotiWayfarers",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Biotic"
      }
    },
    {
      "id": 144,
      "name": "Parallel Production",
      "techId": "parallel-production",
      "type": "Cybernetic",
      "level": 1,
      "faction": "TheGhotiWayfarers",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Cybernetic"
      }
    }
  ],
  "TheGledgeUnion": [
    {
      "id": 145,
      "name": "Lightning Drives",
      "techId": "lightning-drives",
      "type": "Propulsion",
      "level": 3,
      "faction": "TheGledgeUnion",
      "expansion": "discordant",
      "prerequisites": {
        "count": 3,
        "type": "Propulsion"
      }
    }
  ],
  "TheBerserkersOfKjalengard": [
    {
      "id": 147,
      "name": "Zhrgar Stimulants",
      "techId": "zhrgar-stimulants",
      "type": "Biotic",
      "level": 1,
      "faction": "TheBerserkersOfKjalengard",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Biotic"
      }
    }
  ],
  "TheMonksOfKolume": [
    {
      "id": 149,
      "name": "Applied Biothermics",
      "techId": "applied-biothermics",
      "type": "Biotic",
      "level": 2,
      "faction": "TheMonksOfKolume",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Biotic"
      }
    },
    {
      "id": 150,
      "name": "Omniscience Field",
      "techId": "omniscience-field",
      "type": "Warfare",
      "level": 3,
      "faction": "TheMonksOfKolume",
      "expansion": "discordant",
      "prerequisites": {
        "count": 3,
        "type": "Warfare"
      }
    }
  ],
  "TheKyroSodality": [
    {
      "id": 151,
      "name": "Indoctrination Team",
      "techId": "indoctrination-team",
      "type": "Biotic",
      "level": 2,
      "faction": "TheKyroSodality",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Biotic"
      }
    },
    {
      "id": 152,
      "name": "Vector Program",
      "techId": "vector-program",
      "type": "Cybernetic",
      "level": 1,
      "faction": "TheKyroSodality",
      "expansion": "discordant",
      "prerequisites": {
        "count": 1,
        "type": "Cybernetic"
      }
    }
  ],
  "TheLanefirRemnants": [
    {
      "id": 153,
      "name": "Spark Thrusters",
      "techId": "spark-thrusters",
      "type": "Propulsion",
      "level": 2,
      "faction": "TheLanefirRemnants",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Propulsion"
      }
    },
    {
      "id": 154,
      "name": "Ats Armaments",
      "techId": "ats-armaments",
      "type": "Warfare",
      "level": 2,
      "faction": "TheLanefirRemnants",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Warfare"
      }
    }
  ],
  "TheNokarSellships": [
    {
      "id": 155,
      "name": "Local Contracts",
      "techId": "local-contracts",
      "type": "Cybernetic",
      "level": 2,
      "faction": "TheNokarSellships",
      "expansion": "discordant",
      "prerequisites": {
        "count": 2,
        "type": "Cybernetic"
      }
    }
  ]
};

export const allFactionTechnologies: FactionTechnology[] = [
  {
    "id": 50,
    "name": "Voidwatch",
    "techId": "voidwatch",
    "type": "Biotic",
    "level": 1,
    "faction": "The Empyrean",
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Biotic"
    }
  },
  {
    "id": 51,
    "name": "Instrinct Training",
    "techId": "instrinct-training",
    "type": "Biotic",
    "level": 1,
    "faction": "The Xxcha Kingdom",
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Biotic"
    }
  },
  {
    "id": 52,
    "name": "Transparasteel Plating",
    "techId": "transparasteel-plating",
    "type": "Biotic",
    "level": 1,
    "faction": "The Yssaril Tribes",
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Biotic"
    }
  },
  {
    "id": 53,
    "name": "Genetic Recombination",
    "techId": "genetic-recombination",
    "type": "Biotic",
    "level": 1,
    "faction": "The Mahact Gene-Sorcerers",
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Biotic"
    }
  },
  {
    "id": 54,
    "name": "Bioplasmosis",
    "techId": "bioplasmosis",
    "type": "Biotic",
    "level": 2,
    "faction": "The Arborec",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 55,
    "name": "Production Biomes",
    "techId": "production-biomes",
    "type": "Biotic",
    "level": 2,
    "faction": "The Emirates of Hacan",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 56,
    "name": "Yin Spinner",
    "techId": "yin-spinner",
    "type": "Biotic",
    "level": 2,
    "faction": "The Yin Brotherhood",
    "expansion": "deprecated",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 57,
    "name": "Yin Spinner Ω",
    "techId": "yin-spinner-omega",
    "type": "Biotic",
    "level": 2,
    "faction": "The Yin Brotherhood",
    "expansion": "codex",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 58,
    "name": "Neuroglaive",
    "techId": "neuroglaive",
    "type": "Biotic",
    "level": 3,
    "faction": "The Naalu Collective",
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": "Biotic"
    }
  },
  {
    "id": 59,
    "name": "Pre Fab Arcologies",
    "techId": "pre-fab-arcologies",
    "type": "Biotic",
    "level": 3,
    "faction": "The Naaz-Rokha Alliance",
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": "Biotic"
    }
  },
  {
    "id": 60,
    "name": "Mageon Implants",
    "techId": "mageon-implants",
    "type": "Biotic",
    "level": 3,
    "faction": "The Yssaril Tribes",
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": "Biotic"
    }
  },
  {
    "id": 61,
    "name": "Chaos Mapping",
    "techId": "chaos-mapping",
    "type": "Propulsion",
    "level": 1,
    "faction": "The Clan of Saar",
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Propulsion"
    }
  },
  {
    "id": 62,
    "name": "Spacial Conduit Cylinder",
    "techId": "spacial-conduit-cylinder",
    "type": "Propulsion",
    "level": 2,
    "faction": "The Universities of Jol-Nar",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Propulsion"
    }
  },
  {
    "id": 63,
    "name": "Aetherstream",
    "techId": "aetherstream",
    "type": "Propulsion",
    "level": 2,
    "faction": "The Empyrean",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Propulsion"
    }
  },
  {
    "id": 64,
    "name": "Wormhole Generator",
    "techId": "wormhole-generator",
    "type": "Propulsion",
    "level": 2,
    "faction": "The Ghosts of Creuss",
    "expansion": "deprecated",
    "prerequisites": {
      "count": 2,
      "type": "Propulsion"
    }
  },
  {
    "id": 65,
    "name": "Wormhole Generator Ω",
    "techId": "wormhole-generator-omega",
    "type": "Propulsion",
    "level": 2,
    "faction": "The Ghosts of Creuss",
    "expansion": "codex",
    "prerequisites": {
      "count": 2,
      "type": "Propulsion"
    }
  },
  {
    "id": 66,
    "name": "Lazax Gate Folding",
    "techId": "lazax-gate-folding",
    "type": "Propulsion",
    "level": 2,
    "faction": "The Winnu",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Propulsion"
    }
  },
  {
    "id": 67,
    "name": "Aerie Hololattice",
    "techId": "aerie-hololattice",
    "type": "Cybernetic",
    "level": 1,
    "faction": "The Argent Flight",
    "expansion": "pok",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 68,
    "name": "L4 Disruptors",
    "techId": "l4-disruptors",
    "type": "Cybernetic",
    "level": 1,
    "faction": "The Barony of Letnev",
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 69,
    "name": "Temporal Command Suite",
    "techId": "temporal-command-suite",
    "type": "Cybernetic",
    "level": 1,
    "faction": "The Nomad",
    "expansion": "pok",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 70,
    "name": "I.I.H.Q. Modernization",
    "techId": "iihq-modernization",
    "type": "Cybernetic",
    "level": 1,
    "faction": "The Council Keleres",
    "expansion": "codex",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 71,
    "name": "Salvage Operations",
    "techId": "salvage-operations",
    "type": "Cybernetic",
    "level": 2,
    "faction": "The Mentak Coalition",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 72,
    "name": "Inheritance Systems",
    "techId": "inheritance-systems",
    "type": "Cybernetic",
    "level": 2,
    "faction": "The L1Z1X Mindnet",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 73,
    "name": "E-Res Siphons",
    "techId": "e-res-siphons",
    "type": "Cybernetic",
    "level": 2,
    "faction": "The Universities of Jol-Nar",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 74,
    "name": "Hegemonic Trade Policy",
    "techId": "hegemonic-trade-policy",
    "type": "Cybernetic",
    "level": 2,
    "faction": "The Winnu",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 75,
    "name": "Nullification Field",
    "techId": "nullification-field",
    "type": "Cybernetic",
    "level": 2,
    "faction": "The Xxcha Kingdom",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 76,
    "name": "Impulse Core",
    "techId": "impulse-core",
    "type": "Cybernetic",
    "level": 2,
    "faction": "The Yin Brotherhood",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 77,
    "name": "Agency Supply Network",
    "techId": "agency-supply-network",
    "type": "Cybernetic",
    "level": 2,
    "faction": "The Council Keleres",
    "expansion": "codex",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 78,
    "name": "Quantum Datahub Node",
    "techId": "quantum-datahub-node",
    "type": "Cybernetic",
    "level": 3,
    "faction": "The Emirates of Hacan",
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": "Cybernetic"
    }
  },
  {
    "id": 79,
    "name": "Mirror Computing",
    "techId": "mirror-computing",
    "type": "Cybernetic",
    "level": 3,
    "faction": "The Mentak Coalition",
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": "Cybernetic"
    }
  },
  {
    "id": 80,
    "name": "Dimensional Splicer",
    "techId": "dimensional-splicer",
    "type": "Warfare",
    "level": 1,
    "faction": "The Ghosts of Creuss",
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Warfare"
    }
  },
  {
    "id": 81,
    "name": "Supercharge",
    "techId": "supercharge",
    "type": "Warfare",
    "level": 1,
    "faction": "The Naaz-Rokha Alliance",
    "expansion": "pok",
    "prerequisites": {
      "count": 1,
      "type": "Warfare"
    }
  },
  {
    "id": 82,
    "name": "Vortex",
    "techId": "vortex",
    "type": "Warfare",
    "level": 1,
    "faction": "The Vuil'Raith Cabal",
    "expansion": "pok",
    "prerequisites": {
      "count": 1,
      "type": "Warfare"
    }
  },
  {
    "id": 83,
    "name": "Non Euclidian Shielding",
    "techId": "non-euclidian-shielding",
    "type": "Warfare",
    "level": 2,
    "faction": "The Barony of Letnev",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 84,
    "name": "Magmus Reactor",
    "techId": "magmus-reactor",
    "type": "Warfare",
    "level": 2,
    "faction": "The Embers of Muaat",
    "expansion": "deprecated",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 85,
    "name": "Magmus Reactor Ω",
    "techId": "magmus-reactor-omega",
    "type": "Warfare",
    "level": 2,
    "faction": "The Embers of Muaat",
    "expansion": "codex",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 86,
    "name": "Walkyrie Particle Weave",
    "techId": "walkyrie-particle-weave",
    "type": "Warfare",
    "level": 2,
    "faction": "The Sardakk N'orr",
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 87,
    "name": "Valefar Assimilator X",
    "techId": "valefar-assimilator-x",
    "type": "Faction",
    "level": 0,
    "faction": "The Nekro Virus",
    "expansion": "base"
  },
  {
    "id": 88,
    "name": "Valefar Assimilator Y",
    "techId": "valefar-assimilator-y",
    "type": "Faction",
    "level": 0,
    "faction": "The Nekro Virus",
    "expansion": "base"
  },
  {
    "id": 89,
    "name": "Psychographics",
    "techId": "psychographics",
    "type": "Biotic",
    "level": 3,
    "faction": "TheAugursOfIlyxum",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": "Biotic"
    }
  },
  {
    "id": 90,
    "name": "Sentient Datapool",
    "techId": "sentient-datapool",
    "type": "Cybernetic",
    "level": 2,
    "faction": "TheAugursOfIlyxum",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 91,
    "name": "Emergency Mobilization Protocols",
    "techId": "emergency-mobilization-protocols",
    "type": "Warfare",
    "level": 2,
    "faction": "TheCeldauriTradeConfederation",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 93,
    "name": "Impressment Programs",
    "techId": "impressment-programs",
    "type": "Cybernetic",
    "level": 2,
    "faction": "TheDihMohnFlotilla",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 95,
    "name": "Blackmail Programs",
    "techId": "blackmail-programs",
    "type": "Biotic",
    "level": 2,
    "faction": "TheFlorzenProfiteers",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 97,
    "name": "Envoy Network",
    "techId": "envoy-network",
    "type": "Biotic",
    "level": 1,
    "faction": "TheFreeSystemsCompact",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Biotic"
    }
  },
  {
    "id": 98,
    "name": "Covert Strike Teams",
    "techId": "covert-strike-teams",
    "type": "Cybernetic",
    "level": 2,
    "faction": "TheFreeSystemsCompact",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 99,
    "name": "War Song Implants",
    "techId": "war-song-implants",
    "type": "Biotic",
    "level": 3,
    "faction": "TheGheminaRaiders",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": "Biotic"
    }
  },
  {
    "id": 101,
    "name": "Fractal Plating",
    "techId": "fractal-plating",
    "type": "Warfare",
    "level": 2,
    "faction": "TheGlimmerOfMortheus",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 102,
    "name": "Fabrication Grid",
    "techId": "fabrication-grid",
    "type": "Cybernetic",
    "level": 2,
    "faction": "TheGlimmerOfMortheus",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 103,
    "name": "Seeker Drones",
    "techId": "seeker-drones",
    "type": "Cybernetic",
    "level": 2,
    "faction": "TheKolleccSociety",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 104,
    "name": "Shrouded Skirmishers",
    "techId": "shrouded-skirmishers",
    "type": "Propulsion",
    "level": 1,
    "faction": "TheKolleccSociety",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Propulsion"
    }
  },
  {
    "id": 105,
    "name": "Tempest Drive",
    "techId": "tempest-drive",
    "type": "Biotic",
    "level": 2,
    "faction": "TheKortaliTribunal",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 106,
    "name": "Deliverance Engine",
    "techId": "deliverance-engine",
    "type": "Warfare",
    "level": 2,
    "faction": "TheKortaliTribunal",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 107,
    "name": "Wraith Engine",
    "techId": "wraith-engine",
    "type": "Propulsion",
    "level": 2,
    "faction": "TheLiZhoDynasty",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Propulsion"
    }
  },
  {
    "id": 109,
    "name": "Stones Embrace",
    "techId": "stones-embrace",
    "type": "Biotic",
    "level": 2,
    "faction": "TheLTokkKhrask",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 111,
    "name": "Orbital Defense Grid",
    "techId": "orbital-defense-grid",
    "type": "Warfare",
    "level": 2,
    "faction": "TheMirvedaProtectorate",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 113,
    "name": "Psychoactive Armaments",
    "techId": "psychoactive-armaments",
    "type": "Biotic",
    "level": 2,
    "faction": "TheMykoMentori",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 115,
    "name": "Voidwake Missiles",
    "techId": "voidwake-missiles",
    "type": "Cybernetic",
    "level": 1,
    "faction": "TheNivynStarKings",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 117,
    "name": "False Flag Operations",
    "techId": "false-flag-operations",
    "type": "Warfare",
    "level": 1,
    "faction": "TheOlradinLeague",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Warfare"
    }
  },
  {
    "id": 118,
    "name": "Geosympathic Impeller",
    "techId": "geosympathic-impeller",
    "type": "Propulsion",
    "level": 1,
    "faction": "TheOlradinLeague",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Propulsion"
    }
  },
  {
    "id": 119,
    "name": "Contractual Obligations",
    "techId": "contractual-obligations",
    "type": "Cybernetic",
    "level": 2,
    "faction": "RohDhnaMechatronics",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 121,
    "name": "Recursive Worm",
    "techId": "recursive-worm",
    "type": "Cybernetic",
    "level": 1,
    "faction": "TheSavagesOfCymiae",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 123,
    "name": "Rift Engines",
    "techId": "rift-engines",
    "type": "Propulsion",
    "level": 1,
    "faction": "TheShipwrightsofAxis",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Propulsion"
    }
  },
  {
    "id": 124,
    "name": "Emergency Deployment",
    "techId": "emergency-deployment",
    "type": "Cybernetic",
    "level": 3,
    "faction": "TheShipwrightsofAxis",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": "Cybernetic"
    }
  },
  {
    "id": 125,
    "name": "Daedalon Flight System",
    "techId": "daedalon-flight-system",
    "type": "Cybernetic",
    "level": 1,
    "faction": "TheTnelisSyndicate",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 127,
    "name": "Midas Turbine",
    "techId": "midas-turbine",
    "type": "Propulsion",
    "level": 1,
    "faction": "TheVadenBankingClans",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Propulsion"
    }
  },
  {
    "id": 128,
    "name": "Krovoz Strike Teams",
    "techId": "krovoz-strike-teams",
    "type": "Cybernetic",
    "level": 2,
    "faction": "TheVadenBankingClans",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 129,
    "name": "Scavenger Exos",
    "techId": "scavenger-exos",
    "type": "Warfare",
    "level": 1,
    "faction": "TheVaylerianScourge",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Warfare"
    }
  },
  {
    "id": 131,
    "name": "Seidr Project",
    "techId": "seidr-project",
    "type": "Warfare",
    "level": 2,
    "faction": "TheVeldyrSovereignty",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 133,
    "name": "Sanctification Field",
    "techId": "sanctification-field",
    "type": "Cybernetic",
    "level": 3,
    "faction": "TheZealotsOfRhodun",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": "Cybernetic"
    }
  },
  {
    "id": 134,
    "name": "Pilgrimage Beacons",
    "techId": "pilgrimage-beacons",
    "type": "Propulsion",
    "level": 2,
    "faction": "TheZealotsOfRhodun",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Propulsion"
    }
  },
  {
    "id": 135,
    "name": "Shard Volley",
    "techId": "shard-volley",
    "type": "Warfare",
    "level": 1,
    "faction": "TheZelianPurifier",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Warfare"
    }
  },
  {
    "id": 137,
    "name": "Broker Network",
    "techId": "broker-network",
    "type": "Biotic",
    "level": 1,
    "faction": "TheBentorConglomerate",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Biotic"
    }
  },
  {
    "id": 138,
    "name": "Merged Replicators",
    "techId": "merged-replicators",
    "type": "Cybernetic",
    "level": 2,
    "faction": "TheBentorConglomerate",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 139,
    "name": "Brood Pod",
    "techId": "brood-pod",
    "type": "Warfare",
    "level": 2,
    "faction": "TheCheiranHordes",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 141,
    "name": "Unity Algorithm",
    "techId": "unity-algorithm",
    "type": "Biotic",
    "level": 3,
    "faction": "TheEdynMandate",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": "Biotic"
    }
  },
  {
    "id": 142,
    "name": "Encrypted Trade Hub",
    "techId": "encrypted-trade-hub",
    "type": "Cybernetic",
    "level": 2,
    "faction": "TheEdynMandate",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 143,
    "name": "Networked Command",
    "techId": "networked-command",
    "type": "Biotic",
    "level": 1,
    "faction": "TheGhotiWayfarers",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Biotic"
    }
  },
  {
    "id": 144,
    "name": "Parallel Production",
    "techId": "parallel-production",
    "type": "Cybernetic",
    "level": 1,
    "faction": "TheGhotiWayfarers",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 145,
    "name": "Lightning Drives",
    "techId": "lightning-drives",
    "type": "Propulsion",
    "level": 3,
    "faction": "TheGledgeUnion",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": "Propulsion"
    }
  },
  {
    "id": 147,
    "name": "Zhrgar Stimulants",
    "techId": "zhrgar-stimulants",
    "type": "Biotic",
    "level": 1,
    "faction": "TheBerserkersOfKjalengard",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Biotic"
    }
  },
  {
    "id": 149,
    "name": "Applied Biothermics",
    "techId": "applied-biothermics",
    "type": "Biotic",
    "level": 2,
    "faction": "TheMonksOfKolume",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 150,
    "name": "Omniscience Field",
    "techId": "omniscience-field",
    "type": "Warfare",
    "level": 3,
    "faction": "TheMonksOfKolume",
    "expansion": "discordant",
    "prerequisites": {
      "count": 3,
      "type": "Warfare"
    }
  },
  {
    "id": 151,
    "name": "Indoctrination Team",
    "techId": "indoctrination-team",
    "type": "Biotic",
    "level": 2,
    "faction": "TheKyroSodality",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 152,
    "name": "Vector Program",
    "techId": "vector-program",
    "type": "Cybernetic",
    "level": 1,
    "faction": "TheKyroSodality",
    "expansion": "discordant",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 153,
    "name": "Spark Thrusters",
    "techId": "spark-thrusters",
    "type": "Propulsion",
    "level": 2,
    "faction": "TheLanefirRemnants",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Propulsion"
    }
  },
  {
    "id": 154,
    "name": "Ats Armaments",
    "techId": "ats-armaments",
    "type": "Warfare",
    "level": 2,
    "faction": "TheLanefirRemnants",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 155,
    "name": "Local Contracts",
    "techId": "local-contracts",
    "type": "Cybernetic",
    "level": 2,
    "faction": "TheNokarSellships",
    "expansion": "discordant",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  }
];
