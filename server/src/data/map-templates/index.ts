// Map Templates - extracted from TI4_map_generator_bot
// Generated: 2025-09-01T18:39:59.902Z

export interface MapTemplate {
  id: string;
  name: string;
  description?: string | null;
  
  // Player configuration
  playerCount?: number | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  
  // Map layout
  mapString?: string | null;
  tileLayout?: string[];
  hexLayout?: HexPosition[];
  
  // Starting positions
  homePositions?: Position[];
  startingPositions?: Position[];
  
  // Tile specifications
  blueTiles?: string[];
  redTiles?: string[];
  greenTiles?: string[];
  
  // Special tiles
  mecatolRexPosition?: Position | null;
  wormholeTiles?: string[];
  anomalyTiles?: string[];
  
  // Hyperlanes (PoK)
  hyperlanes?: Hyperlane[];
  hasHyperlanes?: boolean;
  
  // Map settings
  isSymmetrical?: boolean;
  isBalanced?: boolean;
  
  // Tournament/competitive settings
  isTournamentLegal?: boolean;
  tournamentName?: string | null;
  
  // Map type
  mapType?: MapType;
  mapStyle?: MapStyle;
  
  // Source tracking
  source: string;
  author?: string | null;
  version?: string;
  
  // Additional properties
  notes?: string | null;
  tags?: string[];
  
  // Homebrew tracking
  isOfficial?: boolean;
  homebrewReplacesID?: string | null;
}

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface HexPosition {
  position: Position;
  tileId?: string;
  rotation?: number;
}

export interface Hyperlane {
  id: string;
  tiles: string[];
  positions: Position[];
}

export type MapType = 
  | 'solo'
  | 'duel'
  | 'small'
  | 'standard'
  | 'large'
  | 'epic'
  | 'custom';

export type MapStyle = 
  | 'standard'
  | 'competitive'
  | 'balanced'
  | 'asymmetric'
  | 'hyperlane'
  | 'island'
  | 'spiral';

export const mapTemplates: MapTemplate[] = [
  {
    "id": "1pIsland",
    "name": "1pIsland",
    "description": null,
    "playerCount": 1,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "solo",
    "mapStyle": "standard",
    "source": "1pIsland",
    "author": "BigAlCupAChino",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "2p",
    "name": "2p",
    "description": null,
    "playerCount": 2,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "duel",
    "mapStyle": "standard",
    "source": "2p",
    "author": "Jazz",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "3p",
    "name": "3p",
    "description": null,
    "playerCount": 3,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "small",
    "mapStyle": "standard",
    "source": "3p",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "5pStryken",
    "name": "5pStryken",
    "description": null,
    "playerCount": 5,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "standard",
    "mapStyle": "standard",
    "source": "5pStryken",
    "author": "ThunderStryken",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "9pLuminous",
    "name": "9pLuminous",
    "description": null,
    "playerCount": 9,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "epic",
    "mapStyle": "standard",
    "source": "9pLuminous",
    "author": "Luminous",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "TispoonMaps",
    "name": "TispoonMaps",
    "description": null,
    "playerCount": 8,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "large",
    "mapStyle": "standard",
    "source": "TispoonMaps",
    "author": "HolyTispoon",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "TispoonMaps",
    "name": "TispoonMaps",
    "description": null,
    "playerCount": 9,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "epic",
    "mapStyle": "standard",
    "source": "TispoonMaps",
    "author": "HolyTispoon",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "TispoonMaps",
    "name": "TispoonMaps",
    "description": null,
    "playerCount": 9,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "epic",
    "mapStyle": "standard",
    "source": "TispoonMaps",
    "author": "HolyTispoon",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "TispoonMaps",
    "name": "TispoonMaps",
    "description": null,
    "playerCount": 12,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "epic",
    "mapStyle": "standard",
    "source": "TispoonMaps",
    "author": "HolyTispoon",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "TispoonMaps",
    "name": "TispoonMaps",
    "description": null,
    "playerCount": 12,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "epic",
    "mapStyle": "standard",
    "source": "TispoonMaps",
    "author": "HolyTispoon",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "TispoonMaps",
    "name": "TispoonMaps",
    "description": null,
    "playerCount": 12,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "epic",
    "mapStyle": "standard",
    "source": "TispoonMaps",
    "author": "HolyTispoon",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "beMyNeighborMilty",
    "name": "beMyNeighborMilty",
    "description": null,
    "playerCount": 6,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "standard",
    "mapStyle": "standard",
    "source": "beMyNeighborMilty",
    "author": "meadmonkey",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "beMyNeighborMilty",
    "name": "beMyNeighborMilty",
    "description": null,
    "playerCount": 8,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "large",
    "mapStyle": "standard",
    "source": "beMyNeighborMilty",
    "author": "meadmonkey",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "minorFactions",
    "name": "minorFactions",
    "description": null,
    "playerCount": 6,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "standard",
    "mapStyle": "standard",
    "source": "minorFactions",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "minorFactions",
    "name": "minorFactions",
    "description": null,
    "playerCount": 5,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "standard",
    "mapStyle": "standard",
    "source": "minorFactions",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "minorFactions",
    "name": "minorFactions",
    "description": null,
    "playerCount": 4,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "small",
    "mapStyle": "standard",
    "source": "minorFactions",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "minorFactions",
    "name": "minorFactions",
    "description": null,
    "playerCount": 3,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "small",
    "mapStyle": "standard",
    "source": "minorFactions",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "minorFactions",
    "name": "minorFactions",
    "description": null,
    "playerCount": 7,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "large",
    "mapStyle": "standard",
    "source": "minorFactions",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "minorFactions",
    "name": "minorFactions",
    "description": null,
    "playerCount": 8,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "large",
    "mapStyle": "standard",
    "source": "minorFactions",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "scptFinals2025",
    "name": "scptFinals2025",
    "description": null,
    "playerCount": 6,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "standard",
    "mapStyle": "standard",
    "source": "scptFinals2025",
    "author": "SCPT Matt",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "standardMiltyLayouts",
    "name": "standardMiltyLayouts",
    "description": null,
    "playerCount": 6,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "standard",
    "mapStyle": "standard",
    "source": "standardMiltyLayouts",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "standardMiltyLayouts",
    "name": "standardMiltyLayouts",
    "description": null,
    "playerCount": 5,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "standard",
    "mapStyle": "standard",
    "source": "standardMiltyLayouts",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "standardMiltyLayouts",
    "name": "standardMiltyLayouts",
    "description": null,
    "playerCount": 4,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "small",
    "mapStyle": "standard",
    "source": "standardMiltyLayouts",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "standardMiltyLayouts",
    "name": "standardMiltyLayouts",
    "description": null,
    "playerCount": 3,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "small",
    "mapStyle": "standard",
    "source": "standardMiltyLayouts",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "standardMiltyLayouts",
    "name": "standardMiltyLayouts",
    "description": null,
    "playerCount": 7,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "large",
    "mapStyle": "standard",
    "source": "standardMiltyLayouts",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "standardMiltyLayouts",
    "name": "standardMiltyLayouts",
    "description": null,
    "playerCount": 8,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "large",
    "mapStyle": "standard",
    "source": "standardMiltyLayouts",
    "author": null,
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  },
  {
    "id": "wekker",
    "name": "wekker",
    "description": null,
    "playerCount": 6,
    "minPlayers": null,
    "maxPlayers": null,
    "mapString": null,
    "tileLayout": [],
    "hexLayout": [],
    "homePositions": [],
    "startingPositions": [],
    "blueTiles": [],
    "redTiles": [],
    "greenTiles": [],
    "mecatolRexPosition": null,
    "wormholeTiles": [],
    "anomalyTiles": [],
    "hyperlanes": [],
    "hasHyperlanes": false,
    "isSymmetrical": false,
    "isBalanced": false,
    "isTournamentLegal": false,
    "tournamentName": null,
    "mapType": "standard",
    "mapStyle": "standard",
    "source": "wekker",
    "author": "Wekker",
    "version": "1.0",
    "notes": null,
    "tags": [],
    "isOfficial": false,
    "homebrewReplacesID": null
  }
];

// Helper functions
export const getTemplateById = (id: string): MapTemplate | undefined => {
  return mapTemplates.find(template => template.id === id);
};

export const getTemplateByName = (name: string): MapTemplate | undefined => {
  return mapTemplates.find(template => 
    template.name.toLowerCase() === name.toLowerCase()
  );
};

export const getTemplatesForPlayerCount = (playerCount: number): MapTemplate[] => {
  return mapTemplates.filter(template => 
    template.playerCount === playerCount ||
    (template.minPlayers && template.maxPlayers && 
     playerCount >= template.minPlayers && 
     playerCount <= template.maxPlayers)
  );
};

export const getTemplatesByType = (type: MapType): MapTemplate[] => {
  return mapTemplates.filter(template => template.mapType === type);
};

export const getTemplatesByStyle = (style: MapStyle): MapTemplate[] => {
  return mapTemplates.filter(template => template.mapStyle === style);
};

export const getTournamentTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => template.isTournamentLegal);
};

export const getSymmetricalTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => template.isSymmetrical);
};

export const getBalancedTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => template.isBalanced);
};

export const getHyperlaneTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => template.hasHyperlanes);
};

export const searchTemplates = (searchTerm: string): MapTemplate[] => {
  const term = searchTerm.toLowerCase();
  return mapTemplates.filter(template => 
    template.name.toLowerCase().includes(term) ||
    template.description?.toLowerCase().includes(term) ||
    template.tournamentName?.toLowerCase().includes(term) ||
    template.tags?.some(tag => tag.toLowerCase().includes(term))
  );
};

// Get official vs community templates
export const getOfficialTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => template.isOfficial);
};

export const getCommunityTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => !template.isOfficial);
};

// Get templates by author
export const getTemplatesByAuthor = (author: string): MapTemplate[] => {
  return mapTemplates.filter(template => 
    template.author?.toLowerCase() === author.toLowerCase()
  );
};

// Group templates by player count
export const templatesByPlayerCount = {
  solo: mapTemplates.filter(t => t.playerCount === 1),
  two: mapTemplates.filter(t => t.playerCount === 2),
  three: mapTemplates.filter(t => t.playerCount === 3),
  four: mapTemplates.filter(t => t.playerCount === 4),
  five: mapTemplates.filter(t => t.playerCount === 5),
  six: mapTemplates.filter(t => t.playerCount === 6),
  seven: mapTemplates.filter(t => t.playerCount === 7),
  eight: mapTemplates.filter(t => t.playerCount === 8),
  variable: mapTemplates.filter(t => t.minPlayers && t.maxPlayers && !t.playerCount)
};

// Validate template for player count
export const isTemplateValidForPlayerCount = (template: MapTemplate, playerCount: number): boolean => {
  if (template.playerCount) {
    return template.playerCount === playerCount;
  }
  
  if (template.minPlayers && template.maxPlayers) {
    return playerCount >= template.minPlayers && playerCount <= template.maxPlayers;
  }
  
  return false;
};

// Get recommended templates for player count
export const getRecommendedTemplates = (playerCount: number): MapTemplate[] => {
  const validTemplates = getTemplatesForPlayerCount(playerCount);
  
  // Prioritize tournament legal and balanced templates
  return validTemplates.sort((a, b) => {
    const scoreA = (a.isTournamentLegal ? 2 : 0) + (a.isBalanced ? 1 : 0);
    const scoreB = (b.isTournamentLegal ? 2 : 0) + (b.isBalanced ? 1 : 0);
    return scoreB - scoreA;
  });
};
