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

  // Bot management
  add_bot: (data: AddBotPayload) => void;
  remove_bot: (data: RemoveBotPayload) => void;
  update_bot: (data: UpdateBotPayload) => void;

  // Milty Draft
  start_draft: (data: StartDraftPayload, callback: (response: DraftStartedEvent | ErrorEvent) => void) => void;
  make_draft_pick: (data: MiltyDraftPayload, callback: (response: DraftUpdatedEvent | ErrorEvent) => void) => void;
}

export interface StartDraftPayload {
  lobbyId: UUID;
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

  // Action Cards
  action_card_played: (data: ActionCardPlayedEvent) => void;
  action_cards_drawn: (data: ActionCardsDrawnEvent) => void;
  action_cards_discarded: (data: ActionCardsDiscardedEvent) => void;

  // Chat
  chat_message: (data: ChatMessageEvent) => void;

  // Errors
  error: (data: ErrorEvent) => void;

  // Lobby
  lobby_created: (data: LobbyCreatedEvent) => void;
  lobby_updated: (data: LobbyUpdatedEvent) => void;
  player_ready: (data: PlayerReadyEvent) => void;
  game_starting: (data: GameStartingEvent) => void;

  // Milty Draft
  draft_started: (data: DraftStartedEvent) => void;
  draft_updated: (data: DraftUpdatedEvent) => void;
  draft_complete: (data: DraftCompleteEvent) => void;
}

// Maps draft player IDs (player_0, player_1, etc.) to real player info
export interface DraftPlayerInfo {
  id: string;         // Real player/user ID
  name: string;       // Player name
  isBot: boolean;
}

export interface DraftStartedEvent {
  lobbyId: UUID;
  draftState: MiltyDraftState;
  playerMapping: Record<string, DraftPlayerInfo>; // draftPlayerId -> player info
}

export interface DraftUpdatedEvent {
  lobbyId: UUID;
  draftState: MiltyDraftState;
  lastPick: MiltyDraftPick;
  playerMapping: Record<string, DraftPlayerInfo>; // draftPlayerId -> player info
}

export interface DraftCompleteEvent {
  lobbyId: UUID;
  playerAssignments: {
    playerId: string;
    faction: string;
    sliceId: number;
    speakerPosition: number;
  }[];
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
  playerId?: UUID; // The player ID for the current user in this game
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

export interface ActionCardPlayedEvent {
  playerId: UUID;
  cardId: string;
  cardName: string;
  targets?: {
    playerId?: UUID;
    systemPosition?: { q: number; r: number };
    planetId?: string;
    unitIds?: UUID[];
  };
}

export interface ActionCardsDrawnEvent {
  playerId: UUID;
  drawnCount: number;
  drawnCards?: string[]; // Only included for the drawing player
}

export interface ActionCardsDiscardedEvent {
  playerId: UUID;
  discardedCount: number;
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

// Bot management payloads
export interface AddBotPayload {
  lobbyId: UUID;
  botName?: string;
  factionId?: string;
  color?: string;
}

export interface RemoveBotPayload {
  lobbyId: UUID;
  seatIndex: number;
}

export interface UpdateBotPayload {
  lobbyId: UUID;
  seatIndex: number;
  botName?: string;
  factionId?: string;
  color?: string;
}

export interface LobbySettings {
  playerCount: number;
  expansions: string[];
  victoryPoints: 10 | 12 | 14;
  mapPreset?: string;
  miltyDraft: boolean;
  privateGame: boolean;
}

// Milty Draft Types
export interface MiltySlice {
  id: number;
  systems: number[]; // System IDs for this slice
  totalResources: number;
  totalInfluence: number;
  optimalValue: number; // Combined resource + influence rating
}

export interface MiltyDraftState {
  phase: 'setup' | 'drafting' | 'complete';
  slices: MiltySlice[];
  factionPool: string[]; // Available factions to draft
  speakerOrder: (string | null)[]; // Player IDs in speaker order slots
  draftOrder: string[]; // Order players pick in
  currentPickIndex: number;
  picks: MiltyDraftPick[];
}

export interface MiltyDraftPick {
  playerId: string;
  pickType: 'faction' | 'slice' | 'speaker';
  value: string | number; // factionId, sliceId, or speaker position
}

export interface MiltyDraftPayload {
  lobbyId: UUID;
  pickType: 'faction' | 'slice' | 'speaker';
  value: string | number;
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
  userId?: UUID; // User ID for human players (undefined for bots)
  name: string;
  faction?: string;
  color?: string;
  ready: boolean;
  isHost: boolean;
  isBot?: boolean;
  seatIndex?: number;
}

export interface PlayerReadyEvent {
  playerId: UUID;
  ready: boolean;
}

export interface GameStartingEvent {
  gameId: UUID;
  countdown: number;
}
