// Basic Technologies - extracted from TwilightImperiumUltimate
// Generated: 2025-09-01T16:42:01.701Z

export interface Technology {
  id: number;
  name: string;
  techId: string;
  type: 'Biotic' | 'Propulsion' | 'Cybernetic' | 'Warfare';
  level: number;
  expansion: string;
  prerequisites?: {
    count: number;
    type: string;
  };
}

// Green Technologies
export const bioticTechnologies: Technology[] = [
  {
    "id": 1,
    "name": "Neural Motivator",
    "techId": "neural-motivator",
    "type": "Biotic",
    "level": 0,
    "expansion": "base"
  },
  {
    "id": 2,
    "name": "Psychoarchaeology",
    "techId": "psychoarchaeology",
    "type": "Biotic",
    "level": 0,
    "expansion": "pok"
  },
  {
    "id": 3,
    "name": "Dacxive Animators",
    "techId": "dacxive-animators",
    "type": "Biotic",
    "level": 1,
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Biotic"
    }
  },
  {
    "id": 4,
    "name": "Bio Stims",
    "techId": "bio-stims",
    "type": "Biotic",
    "level": 1,
    "expansion": "pok",
    "prerequisites": {
      "count": 1,
      "type": "Biotic"
    }
  },
  {
    "id": 5,
    "name": "Hyper Metabolism",
    "techId": "hyper-metabolism",
    "type": "Biotic",
    "level": 2,
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Biotic"
    }
  },
  {
    "id": 6,
    "name": "X-89 Bacterial Weapon",
    "techId": "x89-bacterial-weapon",
    "type": "Biotic",
    "level": 3,
    "expansion": "deprecated",
    "prerequisites": {
      "count": 3,
      "type": "Biotic"
    }
  },
  {
    "id": 7,
    "name": "X-89 Bacterial Weapon Ω",
    "techId": "x89-bacterial-weapon-omega",
    "type": "Biotic",
    "level": 3,
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": "Biotic"
    }
  }
];

// Blue Technologies  
export const propulsionTechnologies: Technology[] = [
  {
    "id": 8,
    "name": "Antimass Deflectors",
    "techId": "antimass-deflectors",
    "type": "Propulsion",
    "level": 0,
    "expansion": "base"
  },
  {
    "id": 9,
    "name": "Dark Energy Tap",
    "techId": "dark-energy-tap",
    "type": "Propulsion",
    "level": 0,
    "expansion": "pok"
  },
  {
    "id": 10,
    "name": "Gravity Drive",
    "techId": "gravity-drive",
    "type": "Propulsion",
    "level": 1,
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Propulsion"
    }
  },
  {
    "id": 11,
    "name": "Sling Relay",
    "techId": "sling-relay",
    "type": "Propulsion",
    "level": 1,
    "expansion": "pok",
    "prerequisites": {
      "count": 1,
      "type": "Propulsion"
    }
  },
  {
    "id": 12,
    "name": "Fleet Logistics",
    "techId": "fleet-logistics",
    "type": "Propulsion",
    "level": 2,
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Propulsion"
    }
  },
  {
    "id": 13,
    "name": "Light Wave Deflector",
    "techId": "light-wave-deflector",
    "type": "Propulsion",
    "level": 3,
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": "Propulsion"
    }
  }
];

// Yellow Technologies
export const cyberneticTechnologies: Technology[] = [
  {
    "id": 14,
    "name": "Sarween Tools",
    "techId": "sarween-tools",
    "type": "Cybernetic",
    "level": 0,
    "expansion": "base"
  },
  {
    "id": 15,
    "name": "Scanlink Drone Network",
    "techId": "scanlink-drone-network",
    "type": "Cybernetic",
    "level": 0,
    "expansion": "pok"
  },
  {
    "id": 16,
    "name": "Graviton Laser System",
    "techId": "graviton-laser-system",
    "type": "Cybernetic",
    "level": 1,
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 17,
    "name": "Predictive Intelligence",
    "techId": "predictive-intelligence",
    "type": "Cybernetic",
    "level": 1,
    "expansion": "pok",
    "prerequisites": {
      "count": 1,
      "type": "Cybernetic"
    }
  },
  {
    "id": 18,
    "name": "Transit Diodes",
    "techId": "transit-diodes",
    "type": "Cybernetic",
    "level": 2,
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Cybernetic"
    }
  },
  {
    "id": 19,
    "name": "Integrated Economy",
    "techId": "integrated-economy",
    "type": "Cybernetic",
    "level": 3,
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": "Cybernetic"
    }
  }
];

// Red Technologies
export const warfareTechnologies: Technology[] = [
  {
    "id": 20,
    "name": "Plasma Scoring",
    "techId": "plasma-scoring",
    "type": "Warfare",
    "level": 0,
    "expansion": "base"
  },
  {
    "id": 21,
    "name": "AI Development Algorithm",
    "techId": "a-i-development-algorithm",
    "type": "Warfare",
    "level": 0,
    "expansion": "pok"
  },
  {
    "id": 22,
    "name": "Magen Defense Grid",
    "techId": "magen-defense-grid",
    "type": "Warfare",
    "level": 1,
    "expansion": "deprecated",
    "prerequisites": {
      "count": 1,
      "type": "Warfare"
    }
  },
  {
    "id": 23,
    "name": "Magen Defense Grid Ω",
    "techId": "magen-defense-grid-omega",
    "type": "Warfare",
    "level": 1,
    "expansion": "base",
    "prerequisites": {
      "count": 1,
      "type": "Warfare"
    }
  },
  {
    "id": 24,
    "name": "Self Assembly Routines",
    "techId": "self-assembly-routines",
    "type": "Warfare",
    "level": 1,
    "expansion": "pok",
    "prerequisites": {
      "count": 1,
      "type": "Warfare"
    }
  },
  {
    "id": 25,
    "name": "Duranium Armor",
    "techId": "duranium-armor",
    "type": "Warfare",
    "level": 2,
    "expansion": "base",
    "prerequisites": {
      "count": 2,
      "type": "Warfare"
    }
  },
  {
    "id": 26,
    "name": "Assault Cannon",
    "techId": "assault-cannon",
    "type": "Warfare",
    "level": 3,
    "expansion": "base",
    "prerequisites": {
      "count": 3,
      "type": "Warfare"
    }
  }
];

export const allBasicTechnologies = [
  ...bioticTechnologies,
  ...propulsionTechnologies,
  ...cyberneticTechnologies,
  ...warfareTechnologies
];
