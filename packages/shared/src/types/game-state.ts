import type {
  UUID,
  PlayerColor,
  UnitType,
  HexCoord,
  WormholeType,
  AnomalyType,
} from './common.js';

// Game Phases
export type GamePhase = 'setup' | 'strategy' | 'action' | 'status' | 'agenda';

export type ActionPhaseState =
  | 'awaiting_action'
  | 'tactical_activation'
  | 'tactical_movement'
  | 'tactical_space_combat'
  | 'tactical_invasion'
  | 'tactical_production'
  | 'strategic_primary'
  | 'strategic_secondary'
  | 'component_action';

export type CombatState =
  | 'anti_fighter_barrage'
  | 'announce_retreat'
  | 'space_cannon_offense'
  | 'space_cannon_defense'
  | 'bombardment'
  | 'combat_round_roll'
  | 'combat_round_assign'
  | 'combat_complete';

// Full Game State
export interface GameState {
  id: UUID;
  version: number;
  round: number;
  phase: GamePhase;
  subPhase?: ActionPhaseState | CombatState;
  activePlayerId: UUID;
  speakerId: UUID;
  initiativeOrder: UUID[];
  players: PlayerState[];
  map: MapState;
  strategyCards: StrategyCardState[];
  objectives: ObjectiveState;
  agendas: AgendaState;
  actionCardDeck: string[];
  actionCardDiscard: string[];
  agendaDeck: string[];
  agendaDiscard: string[];
  laws: ActiveLaw[];
  custodiansTaken: boolean;
  activeCombat: CombatInstance | null;
  timingWindows: TimingWindow[];
  winner: UUID | null;
}

// Player State
export interface PlayerState {
  id: UUID;
  name: string;
  faction: string;
  color: PlayerColor;
  seatIndex: number;
  commandTokens: {
    tactics: number;
    fleet: number;
    strategy: number;
  };
  tradeGoods: number;
  commodities: number;
  maxCommodities: number;
  technologies: string[];
  actionCards: string[];
  secretObjectives: string[];
  scoredObjectives: string[];
  promissoryNotesOwned: string[];
  promissoryNotesInHand: string[];
  planets: PlanetState[];
  strategyCard: number | null;
  strategyCardUsed: boolean;
  passed: boolean;
  score: number;
  neighbors: UUID[];
  transactedWith: UUID[];
  // PoK
  relicFragments?: {
    cultural: number;
    industrial: number;
    hazardous: number;
    unknown: number;
  };
  relics?: string[];
  leaders?: LeaderState;
}

export interface LeaderState {
  agent: { unlocked: boolean; exhausted: boolean };
  commander: { unlocked: boolean };
  hero: { unlocked: boolean; purged: boolean };
}

// Map State
export interface MapState {
  tiles: MapTile[];
  playerCount: number;
}

export interface MapTile {
  id: string;
  systemId: number;
  position: HexCoord;
  rotation: number;
  planets: PlanetInstance[];
  wormhole: WormholeType | null;
  anomaly: AnomalyType | null;
  units: UnitInstance[];
  commandTokens: UUID[];
  frontier?: boolean;
}

export interface PlanetInstance {
  id: string;
  planetId: string;
  controlledBy: UUID | null;
  exhausted: boolean;
  attachments: string[];
  units: UnitInstance[];
}

export interface PlanetState {
  planetId: string;
  exhausted: boolean;
  attachments: string[];
}

export interface UnitInstance {
  id: UUID;
  type: UnitType;
  ownerId: UUID;
  damaged: boolean;
  // For ground units on planets
  planetId?: string;
}

// Strategy Cards
export interface StrategyCardState {
  number: number;
  name: string;
  pickedBy: UUID | null;
  exhausted: boolean;
}

// Objectives
export interface ObjectiveState {
  publicStageI: ObjectiveInstance[];
  publicStageII: ObjectiveInstance[];
  revealedCount: number;
  secretDeck: string[];
}

export interface ObjectiveInstance {
  id: string;
  revealed: boolean;
  scoredBy: UUID[];
}

// Agenda
export interface AgendaState {
  currentAgenda: string | null;
  currentAgendaNumber: 1 | 2;
  votes: Map<UUID, AgendaVote>;
  outcome: string | null;
  riders: Rider[];
}

export interface AgendaVote {
  playerId: UUID;
  votes: number;
  outcome: string;
  extraVotes: number;
}

export interface Rider {
  playerId: UUID;
  cardId: string;
  prediction: string;
}

export interface ActiveLaw {
  cardId: string;
  electedPlayer?: UUID;
  electedPlanet?: string;
  electedOutcome?: string;
}

// Combat
export interface CombatInstance {
  id: UUID;
  type: 'space' | 'ground';
  systemId: string;
  planetId?: string;
  attackerId: UUID;
  defenderId: UUID;
  state: CombatState;
  roundNumber: number;
  attackerUnits: UUID[];
  defenderUnits: UUID[];
  pendingHits: {
    attacker: number;
    defender: number;
  };
  retreatAnnounced: {
    attacker: boolean;
    defender: boolean;
  };
}

// Timing Windows for Action Cards
export interface TimingWindow {
  id: UUID;
  trigger: string;
  eligiblePlayers: UUID[];
  responses: Map<UUID, 'pass' | 'pending'>;
  playedCards: { playerId: UUID; cardId: string }[];
  expiresAt: number;
}
