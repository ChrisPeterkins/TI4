// Anomalies - extracted from TwilightImperiumUltimate
// Generated: 2025-09-01T17:23:43.232Z

export interface Anomaly {
  type: string;
  tiles: Array<{
    tileCode: string;
    name: string;
  }>;
}

export const anomalies: { [key: string]: Anomaly['tiles'] } = {
  "GravityRift": [
    {
      "tileCode": "41",
      "name": "Tile 41"
    },
    {
      "tileCode": "67",
      "name": "Tile 67"
    }
  ],
  "Nebula": [
    {
      "tileCode": "42",
      "name": "Tile 42"
    },
    {
      "tileCode": "68",
      "name": "Tile 68"
    }
  ],
  "Supernova": [
    {
      "tileCode": "43",
      "name": "Tile 43"
    },
    {
      "tileCode": "80",
      "name": "Tile 80"
    },
    {
      "tileCode": "81",
      "name": "Tile 81"
    }
  ],
  "AsteroidField": [
    {
      "tileCode": "44",
      "name": "Tile 44"
    },
    {
      "tileCode": "45",
      "name": "Tile 45"
    },
    {
      "tileCode": "79",
      "name": "Tile 79"
    }
  ]
};

export const anomalyTypes = Object.keys(anomalies);

export const getTilesByAnomaly = (anomalyType: string): Anomaly['tiles'] => {
  return anomalies[anomalyType] || [];
};
