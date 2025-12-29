import type { UUID, DiceRoll } from './common.js';
import type { GameState, CombatInstance, TimingWindow } from './game-state.js';
import type { GameAction, ActionResult } from './actions.js';

// Client -> Server Events
export interface ClientToServerEvents {
  // Connection
  join_game: (data: JoinGamePayload) => void;
  leave_game: (data: LeaveGamePayload) => void;
  reconnect: (data: ReconnectPayload) => void;

  // Game Actions
  game_action: (data: GameActionPayload) => void;

  // Chat
  chat_message: (data: ChatMessagePayload) => void;

  // Sync
  request_state: (data: RequestStatePayload) => void;

  // Lobby
  create_lobby: (data: CreateLobbyPayload, callback: (response: LobbyCreatedEvent | ErrorEvent) => void) => void;
  join_lobby: (data: JoinLobbyPayload, callback: (response: LobbyUpdatedEvent | ErrorEvent) => void) => void;
  leave_lobby: (data: LeaveLobbyPayload) => void;
  select_faction: (data: SelectFactionPayload) => void;
  select_color: (data: SelectColorPayload) => void;
  ready_up: (data: ReadyUpPayload) => void;
  start_game: (data: StartGamePayload, callback: (response: GameStartingEvent | ErrorEvent) => void) => void;
  update_settings: (data: UpdateSettingsPayload) => void;
}

// Server -> Client Events
export interface ServerToClientEvents {
  // Connection
  joined_game: (data: JoinedGameResponse) => void;
  player_joined: (data: PlayerJoinedEvent) => void;
  player_left: (data: PlayerLeftEvent) => void;
  player_reconnected: (data: PlayerReconnectedEvent) => void;

  // Game State
  game_state: (data: GameStateEvent) => void;
  state_delta: (data: StateDeltaEvent) => void;
  action_result: (data: ActionResultEvent) => void;

  // Combat
  combat_started: (data: CombatStartedEvent) => void;
  combat_updated: (data: CombatUpdatedEvent) => void;
  combat_ended: (data: CombatEndedEvent) => void;
  dice_rolled: (data: DiceRolledEvent) => void;

  // Timing Windows
  timing_window_opened: (data: TimingWindowOpenedEvent) => void;
  timing_window_closed: (data: TimingWindowClosedEvent) => void;

  // Chat
  chat_message: (data: ChatMessageEvent) => void;

  // Errors
  error: (data: ErrorEvent) => void;

  // Lobby
  lobby_created: (data: LobbyCreatedEvent) => void;
  lobby_updated: (data: LobbyUpdatedEvent) => void;
  player_ready: (data: PlayerReadyEvent) => void;
  game_starting: (data: GameStartingEvent) => void;
}

// Payload Types - Client to Server

export interface JoinGamePayload {
  gameId: UUID;
  playerId: UUID;
  token: string;
}

export interface LeaveGamePayload {
  gameId: UUID;
}

export interface ReconnectPayload {
  gameId: UUID;
  playerId: UUID;
  lastKnownVersion: number;
}

export interface GameActionPayload {
  gameId: UUID;
  action: GameAction;
}

export interface ChatMessagePayload {
  gameId: UUID;
  message: string;
  targetPlayerId?: UUID;
}

export interface RequestStatePayload {
  gameId: UUID;
  fromVersion?: number;
}

// Response/Event Types - Server to Client

export interface JoinedGameResponse {
  success: boolean;
  gameState?: GameState;
  error?: string;
}

export interface PlayerJoinedEvent {
  playerId: UUID;
  playerName: string;
  faction?: string;
}

export interface PlayerLeftEvent {
  playerId: UUID;
}

export interface PlayerReconnectedEvent {
  playerId: UUID;
}

export interface GameStateEvent {
  state: GameState;
}

export interface StateDeltaEvent {
  fromVersion: number;
  toVersion: number;
  delta: StateDelta;
}

export interface StateDelta {
  // Which parts of state changed
  changedPaths: string[];
  // The actual changes (partial game state)
  changes: Partial<GameState>;
  // Actions that triggered these changes
  sourceAction?: GameAction;
}

export interface ActionResultEvent {
  actionId: UUID;
  result: ActionResult;
  newVersion: number;
}

export interface CombatStartedEvent {
  combat: CombatInstance;
}

export interface CombatUpdatedEvent {
  combat: CombatInstance;
  lastEvent?: CombatEvent;
}

export interface CombatEndedEvent {
  combatId: UUID;
  winnerId: UUID | null;
  systemId: string;
  planetId?: string;
}

export interface CombatEvent {
  type:
    | 'round_started'
    | 'dice_rolled'
    | 'hits_assigned'
    | 'retreat_announced'
    | 'unit_destroyed'
    | 'damage_sustained';
  data: unknown;
}

export interface DiceRolledEvent {
  combatId: UUID;
  playerId: UUID;
  rolls: DiceRoll[];
  totalHits: number;
}

export interface TimingWindowOpenedEvent {
  window: TimingWindow;
}

export interface TimingWindowClosedEvent {
  windowId: UUID;
  playedCards: { playerId: UUID; cardId: string }[];
}

export interface ChatMessageEvent {
  id: UUID;
  playerId: UUID;
  playerName: string;
  message: string;
  timestamp: number;
  isPrivate: boolean;
}

export interface ErrorEvent {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export type ErrorCode =
  | 'INVALID_ACTION'
  | 'NOT_YOUR_TURN'
  | 'INVALID_STATE'
  | 'GAME_NOT_FOUND'
  | 'PLAYER_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'VERSION_CONFLICT'
  | 'TIMEOUT'
  | 'SERVER_ERROR';

// Lobby Events (before game starts)
export interface LobbyClientEvents {
  create_lobby: (data: CreateLobbyPayload) => void;
  join_lobby: (data: JoinLobbyPayload) => void;
  leave_lobby: (data: LeaveLobbyPayload) => void;
  select_faction: (data: SelectFactionPayload) => void;
  select_color: (data: SelectColorPayload) => void;
  ready_up: (data: ReadyUpPayload) => void;
  start_game: (data: StartGamePayload) => void;
  update_settings: (data: UpdateSettingsPayload) => void;
}

export interface LobbyServerEvents {
  lobby_created: (data: LobbyCreatedEvent) => void;
  lobby_updated: (data: LobbyUpdatedEvent) => void;
  player_ready: (data: PlayerReadyEvent) => void;
  game_starting: (data: GameStartingEvent) => void;
}

export interface CreateLobbyPayload {
  hostId: UUID;
  hostName: string;
  settings: LobbySettings;
}

export interface JoinLobbyPayload {
  lobbyId?: UUID;
  code?: string; // Can join by code instead of lobbyId
}

export interface LeaveLobbyPayload {
  lobbyId: UUID;
}

export interface SelectFactionPayload {
  lobbyId: UUID;
  factionId: string;
}

export interface SelectColorPayload {
  lobbyId: UUID;
  color: string;
}

export interface ReadyUpPayload {
  lobbyId: UUID;
  ready: boolean;
}

export interface StartGamePayload {
  lobbyId: UUID;
}

export interface UpdateSettingsPayload {
  lobbyId: UUID;
  settings: Partial<LobbySettings>;
}

export interface LobbySettings {
  playerCount: number;
  expansions: string[];
  victoryPoints: 10 | 12 | 14;
  mapPreset?: string;
  miltyDraft: boolean;
  privateGame: boolean;
}

export interface LobbyCreatedEvent {
  lobbyId: UUID;
  code: string;
  settings: LobbySettings;
  players: LobbyPlayer[];
}

export interface LobbyUpdatedEvent {
  lobbyId: UUID;
  code: string;
  players: LobbyPlayer[];
  settings: LobbySettings;
}

export interface LobbyPlayer {
  id: UUID;
  name: string;
  faction?: string;
  color?: string;
  ready: boolean;
  isHost: boolean;
}

export interface PlayerReadyEvent {
  playerId: UUID;
  ready: boolean;
}

export interface GameStartingEvent {
  gameId: UUID;
  countdown: number;
}
