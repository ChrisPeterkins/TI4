// Core game type definitions

export enum GamePhase {
  STRATEGY = 'STRATEGY',
  ACTION = 'ACTION',
  STATUS = 'STATUS',
  AGENDA = 'AGENDA',
}

export enum GameStatus {
  WAITING = 'WAITING',
  STARTING = 'STARTING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export interface GameState {
  id: string;
  status: GameStatus;
  phase: GamePhase;
  round: number;
  currentPlayer: string | null;
  players: string[];
  board: BoardState;
  settings: GameSettings;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export interface GameSettings {
  name: string;
  maxPlayers: number;
  minPlayers: number;
  pointsToWin: number;
  mapType: 'standard' | 'custom' | 'preset';
  expansions: {
    prophecyOfKings: boolean;
  };
  houseRules: Record<string, boolean>;
  timerEnabled: boolean;
  timerMinutes?: number;
}

export interface BoardState {
  // Will be expanded with actual board implementation
  tiles: any[];
  units: any[];
  mecatolRex: any;
}