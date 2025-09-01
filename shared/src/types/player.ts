// Player type definitions

export interface Player {
  id: string;
  userId: string;
  username: string;
  faction: FactionId | null;
  color: PlayerColor | null;
  seatPosition: number;
  isReady: boolean;
  isActive: boolean;
  victoryPoints: number;
  resources: PlayerResources;
  technologies: string[];
  planets: string[];
  hand: PlayerHand;
}

export interface PlayerResources {
  tradeGoods: number;
  commodities: number;
  commandTokens: {
    tactics: number;
    fleet: number;
    strategy: number;
  };
  influence: number;
  resources: number;
}

export interface PlayerHand {
  actionCards: string[];
  secretObjectives: string[];
  promissoryNotes: string[];
  relics?: string[]; // PoK
}

export type PlayerColor = 
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'black';

export type FactionId = string; // Will be expanded with actual faction IDs