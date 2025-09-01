// Wormholes - extracted from TwilightImperiumUltimate
// Generated: 2025-09-01T17:23:43.233Z

export interface WormholeTile {
  tileCode: string;
  name: string;
  faction?: string | null;
}

export const wormholes: { [key: string]: WormholeTile[] } = {
  "Alpha": [
    {
      "tileCode": "26",
      "name": "Tile 26",
      "faction": null
    }
  ],
  "Beta": [
    {
      "tileCode": "25",
      "name": "Tile 25",
      "faction": null
    }
  ],
  "Gamma": [
    {
      "tileCode": "51",
      "name": "Tile 51",
      "faction": "The Ghosts of Creuss"
    },
    {
      "tileCode": "52",
      "name": "Tile 52",
      "faction": "The Mahact Gene-Sorcerers"
    },
    {
      "tileCode": "53",
      "name": "Tile 53",
      "faction": "The Nomad"
    },
    {
      "tileCode": "54",
      "name": "Tile 54",
      "faction": "The Vuil'Raith Cabal"
    },
    {
      "tileCode": "55",
      "name": "Tile 55",
      "faction": "The Titans of Ul"
    },
    {
      "tileCode": "56",
      "name": "Tile 56",
      "faction": "The Empyrean"
    },
    {
      "tileCode": "57",
      "name": "Tile 57",
      "faction": "The Naaz-Rokha Alliance"
    }
  ],
  "Delta": [
    {
      "tileCode": "17",
      "name": "Tile 17",
      "faction": "The Ghosts of Creuss"
    },
    {
      "tileCode": "51",
      "name": "Tile 51",
      "faction": "The Ghosts of Creuss"
    }
  ]
};

export const getWormholesByType = (type: 'Alpha' | 'Beta' | 'Gamma' | 'Delta'): WormholeTile[] => {
  return wormholes[type] || [];
};

export const areConnected = (tile1: string, tile2: string): boolean => {
  // Check if two tiles share a wormhole type
  for (const [type, tiles] of Object.entries(wormholes)) {
    const codes = tiles.map((t: any) => t.tileCode);
    if (codes.includes(tile1) && codes.includes(tile2)) {
      return true;
    }
  }
  return false;
};

export const getWormholeType = (tileCode: string): string | null => {
  for (const [type, tiles] of Object.entries(wormholes)) {
    if (tiles.some((t: any) => t.tileCode === tileCode)) {
      return type;
    }
  }
  return null;
};
