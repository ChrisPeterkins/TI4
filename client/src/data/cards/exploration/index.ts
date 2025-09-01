// Exploration Cards - extracted from TwilightImperiumUltimate
// Generated: 2025-09-01T16:34:51.054Z

export interface ExplorationCard {
  id: number;
  name: string;
  planetTrait: 'Cultural' | 'Hazardous' | 'Industrial';
  expansion: string;
}

export const culturalExploration: ExplorationCard[] = [
  {
    "id": 1,
    "name": "Cultural Relic Fragment",
    "planetTrait": "Cultural",
    "expansion": "pok"
  },
  {
    "id": 2,
    "name": "Demilitarized Zone",
    "planetTrait": "Cultural",
    "expansion": "pok"
  },
  {
    "id": 3,
    "name": "Dyson Sphere",
    "planetTrait": "Cultural",
    "expansion": "pok"
  },
  {
    "id": 4,
    "name": "Freelancers",
    "planetTrait": "Cultural",
    "expansion": "pok"
  },
  {
    "id": 5,
    "name": "Gamma Wormhole",
    "planetTrait": "Cultural",
    "expansion": "pok"
  },
  {
    "id": 6,
    "name": "Mercenary Outfit",
    "planetTrait": "Cultural",
    "expansion": "pok"
  },
  {
    "id": 7,
    "name": "Paradise World",
    "planetTrait": "Cultural",
    "expansion": "pok"
  },
  {
    "id": 8,
    "name": "Tomb Of Emphidia",
    "planetTrait": "Cultural",
    "expansion": "pok"
  },
  {
    "id": 9,
    "name": "Council Preserve",
    "planetTrait": "Cultural",
    "expansion": "uncharted"
  },
  {
    "id": 10,
    "name": "Deserted Trade Station",
    "planetTrait": "Cultural",
    "expansion": "uncharted"
  },
  {
    "id": 11,
    "name": "Distinguished Admiral",
    "planetTrait": "Cultural",
    "expansion": "uncharted"
  },
  {
    "id": 12,
    "name": "Star Chart Cultural",
    "planetTrait": "Cultural",
    "expansion": "uncharted"
  }
];

export const hazardousExploration: ExplorationCard[] = [
  {
    "id": 13,
    "name": "Core Mine",
    "planetTrait": "Hazardous",
    "expansion": "pok"
  },
  {
    "id": 14,
    "name": "Expedition",
    "planetTrait": "Hazardous",
    "expansion": "pok"
  },
  {
    "id": 15,
    "name": "Hazardous Relic Fragment",
    "planetTrait": "Hazardous",
    "expansion": "pok"
  },
  {
    "id": 16,
    "name": "Lazax Survivors",
    "planetTrait": "Hazardous",
    "expansion": "pok"
  },
  {
    "id": 17,
    "name": "Mining World",
    "planetTrait": "Hazardous",
    "expansion": "pok"
  },
  {
    "id": 18,
    "name": "Rich World",
    "planetTrait": "Hazardous",
    "expansion": "pok"
  },
  {
    "id": 19,
    "name": "Volatile Fuel Source",
    "planetTrait": "Hazardous",
    "expansion": "pok"
  },
  {
    "id": 20,
    "name": "Warfare Research Facility",
    "planetTrait": "Hazardous",
    "expansion": "pok"
  },
  {
    "id": 21,
    "name": "Arcane Citadel",
    "planetTrait": "Hazardous",
    "expansion": "uncharted"
  },
  {
    "id": 22,
    "name": "Scorched Depot",
    "planetTrait": "Hazardous",
    "expansion": "uncharted"
  },
  {
    "id": 23,
    "name": "Seedy Spaceport",
    "planetTrait": "Hazardous",
    "expansion": "uncharted"
  },
  {
    "id": 24,
    "name": "Star Chart Hazardous",
    "planetTrait": "Hazardous",
    "expansion": "uncharted"
  }
];

export const industrialExploration: ExplorationCard[] = [
  {
    "id": 25,
    "name": "Abandoned Warehouses",
    "planetTrait": "Industrial",
    "expansion": "pok"
  },
  {
    "id": 26,
    "name": "Biotic Research Facility",
    "planetTrait": "Industrial",
    "expansion": "pok"
  },
  {
    "id": 27,
    "name": "Cybernetic Research Facility",
    "planetTrait": "Industrial",
    "expansion": "pok"
  },
  {
    "id": 28,
    "name": "Functioning Base",
    "planetTrait": "Industrial",
    "expansion": "pok"
  },
  {
    "id": 29,
    "name": "Industrial Relic Fragment",
    "planetTrait": "Industrial",
    "expansion": "pok"
  },
  {
    "id": 30,
    "name": "Local Fabricators",
    "planetTrait": "Industrial",
    "expansion": "pok"
  },
  {
    "id": 31,
    "name": "Propulsion Research Facility",
    "planetTrait": "Industrial",
    "expansion": "pok"
  },
  {
    "id": 32,
    "name": "Ancient Shipyard",
    "planetTrait": "Industrial",
    "expansion": "uncharted"
  },
  {
    "id": 33,
    "name": "Hidden Lab",
    "planetTrait": "Industrial",
    "expansion": "uncharted"
  },
  {
    "id": 34,
    "name": "Orbital Foundries",
    "planetTrait": "Industrial",
    "expansion": "uncharted"
  },
  {
    "id": 35,
    "name": "Star Chart Industrial",
    "planetTrait": "Industrial",
    "expansion": "uncharted"
  }
];

export const allExplorationCards = [...culturalExploration, ...hazardousExploration, ...industrialExploration];
