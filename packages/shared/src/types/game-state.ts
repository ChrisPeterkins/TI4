import type {
  UUID,
  PlayerColor,
  UnitType,
  HexCoord,
  WormholeType,
  AnomalyType,
  TimingTrigger,
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

export type StatusPhaseState =
  | 'score_objectives'
  | 'reveal_public_objective'
  | 'draw_action_cards'
  | 'remove_command_tokens'
  | 'gain_redistribute_tokens'
  | 'ready_cards'
  | 'repair_units'
  | 'return_strategy_cards';

export type AgendaPhaseState =
  | 'reveal_agenda'
  | 'when_revealed'
  | 'after_revealed'
  | 'voting'
  | 'speaker_tiebreak'
  | 'resolve_outcome';

export type InvasionState =
  | 'select_planets'
  | 'bombardment'
  | 'commit_ground_forces'
  | 'space_cannon_defense'
  | 'ground_combat'
  | 'establish_control';

// =============================================================================
// GAME LOG TYPES
// =============================================================================

export type GameLogEntryType =
  // Phase transitions
  | 'phase_change'
  | 'round_start'
  // Strategy phase
  | 'strategy_card_picked'
  // Action phase
  | 'turn_start'
  | 'tactical_action'
  | 'strategic_action'
  | 'component_action'
  | 'pass'
  // Movement
  | 'units_moved'
  | 'system_activated'
  // Combat
  | 'combat_start'
  | 'combat_round'
  | 'dice_rolled'
  | 'hits_assigned'
  | 'unit_destroyed'
  | 'combat_end'
  | 'retreat'
  // Production
  | 'units_produced'
  // Invasion
  | 'bombardment'
  | 'invasion_start'
  | 'planet_taken'
  // Cards
  | 'action_card_played'
  | 'action_card_drawn'
  | 'sabotage'
  | 'rider_played'
  | 'rider_resolved'
  // Technology
  | 'technology_researched'
  // Objectives
  | 'objective_scored'
  | 'objective_revealed'
  // Agenda
  | 'agenda_revealed'
  | 'vote_cast'
  | 'agenda_resolved'
  // Trade
  | 'transaction_completed'
  | 'commodities_refreshed'
  // Exploration
  | 'planet_explored'
  | 'relic_fragment_gained'
  | 'relic_gained'
  | 'fragments_purged'
  | 'attachment_placed'
  // Other
  | 'promissory_note_played'
  | 'ability_triggered'
  | 'game_won';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  type: GameLogEntryType;
  playerId?: UUID;
  playerName?: string;
  playerFaction?: string;
  round: number;
  phase: GamePhase;
  message: string;
  details?: GameLogDetails;
}

export interface GameLogDetails {
  // Combat details
  attackerId?: UUID;
  defenderId?: UUID;
  systemId?: string;
  systemName?: string;
  rolls?: number[];
  hits?: number;
  unitType?: UnitType;
  unitCount?: number;
  winnerId?: UUID;

  // Card details
  cardId?: string;
  cardName?: string;

  // Technology details
  techId?: string;
  techName?: string;

  // Objective details
  objectiveId?: string;
  objectiveName?: string;
  points?: number;

  // Agenda details
  agendaId?: string;
  agendaName?: string;
  outcome?: string;
  votes?: number;

  // Strategy card details
  strategyCardNumber?: number;
  strategyCardName?: string;

  // Planet details
  planetId?: string;
  planetName?: string;

  // Transaction details
  fromPlayerId?: UUID;
  toPlayerId?: UUID;
  tradeGoods?: number;
  commodities?: number;

  // Production details
  unitsProduced?: Array<{ type: UnitType; count: number }>;
  totalCost?: number;

  // Movement details
  fromSystem?: string;
  toSystem?: string;
  unitsMoved?: Array<{ type: UnitType; count: number }>;

  // Exploration details
  explorationCardId?: string;
  explorationCardName?: string;
  explorationDeckType?: 'cultural' | 'industrial' | 'hazardous' | 'frontier';
  fragmentType?: 'cultural' | 'industrial' | 'hazardous' | 'unknown';
  fragmentCount?: number;
  relicId?: string;
  relicName?: string;
  attachmentId?: string;
  attachmentName?: string;

  // Generic additional data
  [key: string]: unknown;
}

// =============================================================================
// GAME STATE
// =============================================================================

// Full Game State
export interface GameState {
  id: UUID;
  version: number;
  round: number;
  phase: GamePhase;
  subPhase?: ActionPhaseState | CombatState | StatusPhaseState | AgendaPhaseState | InvasionState;
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
  /** Stack of timing windows - newest at end, resolve LIFO */
  timingWindowStack: TimingWindow[];
  /** The currently active timing window (top of stack) */
  activeTimingWindow: TimingWindow | null;
  winner: UUID | null;
  // Tactical action tracking
  activatedSystem?: HexCoord;
  // Status phase tracking
  statusPhase?: StatusPhaseTracking;
  // Agenda phase tracking
  agendaPhase?: AgendaPhaseTracking;
  // Invasion phase tracking
  invasionPhase?: InvasionTracking;
  // Strategic action tracking
  strategicActionState?: StrategicActionTracking;
  // Pending transaction (for async accept/decline)
  pendingTransaction?: PendingTransaction;
  // Game event log
  gameLog: GameLogEntry[];
  // PoK Exploration System
  explorationDecks?: ExplorationDecks;
  explorationDiscard?: string[];
  relicDeck?: string[];
  relicDiscard?: string[];
  // Planets explored this tactical action (reset each activation)
  planetsExploredThisTurn?: string[];
}

// PoK Exploration Deck State
export interface ExplorationDecks {
  cultural: string[];
  industrial: string[];
  hazardous: string[];
  frontier: string[];
}

// Pending Transaction State
export interface PendingTransaction {
  id: UUID;
  initiatorId: UUID;
  targetId: UUID;
  initiatorOffer: {
    tradeGoods?: number;
    commodities?: number;
    promissoryNotes?: string[]; // Max 1 per transaction
    actionCards?: string[];
  };
  requestedOffer: {
    tradeGoods?: number;
    commodities?: number;
    promissoryNotes?: string[]; // Max 1 per transaction
    actionCards?: string[];
  };
  createdAt: number; // Timestamp
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
  promissoryNotesInPlay: PromissoryNoteInPlay[];
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
  exhaustedRelics?: string[];
  leaders?: LeaderState;
}

export interface LeaderState {
  agent: { unlocked: boolean; exhausted: boolean };
  commander: { unlocked: boolean };
  hero: { unlocked: boolean; purged: boolean };
}

// Promissory Note in Play Area
export interface PromissoryNoteInPlay {
  noteId: string; // The promissory note ID (e.g., 'support_for_the_throne_red')
  originalOwnerId: UUID; // The player who originally owns this note
  receivedFrom?: UUID; // The player who gave this note (may differ from owner if traded)
  placedRound: number; // Which round the note was placed in play area
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
  trigger: TimingTrigger;
  eligiblePlayers: UUID[];
  responses: Record<UUID, 'pass' | 'pending' | 'played'>;
  playedCards: TimingWindowCard[];
  expiresAt: number;
  /** Optional parent window ID for nested windows (e.g., Sabotage on Sabotage) */
  parentWindowId?: UUID;
  /** Context data for this timing window */
  context?: TimingWindowContext;
  /** Whether this window has been resolved */
  resolved: boolean;
}

export interface TimingWindowCard {
  playerId: UUID;
  cardId: string;
  targets?: {
    playerId?: UUID;
    systemPosition?: HexCoord;
    planetId?: string;
    unitIds?: UUID[];
  };
}

export interface TimingWindowContext {
  /** The action card that triggered this window (for Sabotage) */
  sourceCardId?: string;
  /** The player who played the triggering card */
  sourcePlayerId?: UUID;
  /** System position for location-based triggers */
  systemPosition?: HexCoord;
  /** Planet ID for planet-based triggers */
  planetId?: string;
  /** Combat ID for combat triggers */
  combatId?: UUID;
  /** Agenda ID for agenda triggers */
  agendaId?: string;
  /** Any additional data needed for card effects */
  additionalData?: Record<string, unknown>;
}

// Status Phase Tracking
export interface StatusPhaseTracking {
  /** Current step (1-8) */
  currentStep: number;
  /** Players who have completed scoring (step 1) */
  scoringComplete: UUID[];
  /** What each player scored this phase */
  scoredThisPhase: {
    playerId: UUID;
    publicObjective?: string;
    secretObjective?: string;
  }[];
  /** Players who have redistributed tokens (step 5) */
  redistributionComplete: UUID[];
  /** The objective that was revealed this phase (if any) */
  revealedObjective?: string;
}

// Agenda Phase Tracking
export interface AgendaPhaseTracking {
  /** Current step in the agenda resolution */
  currentStep: AgendaPhaseState;
  /** Which agenda we're on (1 or 2) */
  agendaNumber: 1 | 2;
  /** ID of the current agenda card */
  currentAgendaId: string | null;
  /** Type of current agenda */
  currentAgendaType: 'law' | 'directive' | null;
  /** Election type of current agenda */
  currentElectionType: 'for_against' | 'player' | 'planet' | 'scored_secret' | 'law' | 'strategy_card' | 'custom' | null;
  /** Voting order: player IDs from left of speaker clockwise, speaker last */
  votingOrder: UUID[];
  /** Index into votingOrder for current voter */
  currentVoterIndex: number;
  /** Players who have finished voting this agenda */
  votingComplete: UUID[];
  /** Map of playerId to their vote details */
  votes: Record<UUID, AgendaVoteRecord>;
  /** Vote tallies by outcome */
  voteTallies: Record<string, number>;
  /** Active riders for this agenda */
  riders: RiderRecord[];
  /** Whether the current agenda was vetoed */
  vetoed: boolean;
  /** The winning outcome */
  electedOutcome: string | null;
  /** For player elections, the elected player */
  electedPlayer: UUID | null;
  /** For planet elections, the elected planet */
  electedPlanet: string | null;
}

export interface AgendaVoteRecord {
  /** The outcome voted for */
  outcome: string;
  /** Base votes from planet influence */
  votes: number;
  /** Extra votes from abilities/cards */
  extraVotes: number;
  /** Whether player abstained */
  abstained: boolean;
  /** Planets exhausted for this vote */
  exhaustedPlanets: string[];
}

export interface RiderRecord {
  playerId: UUID;
  cardId: string;
  prediction: string;
  resolved: boolean;
  success: boolean;
}

// Invasion Phase Tracking
export interface InvasionTracking {
  /** Current step in the invasion process */
  currentStep: InvasionState;
  /** Planet IDs being invaded */
  targetPlanets: string[];
  /** Index of current planet being resolved */
  currentPlanetIndex: number;
  /** Whether bombardment has been completed for current planet */
  bombardmentComplete: boolean;
  /** Map of planetId to committed unit IDs */
  groundForcesCommitted: Record<string, string[]>;
  /** Whether space cannon defense has been completed for current planet */
  spaceCannonComplete: boolean;
  /** Pending bombardment hits to assign */
  pendingBombardmentHits: number;
  /** Pending space cannon hits to assign */
  pendingSpaceCannonHits: number;
}

// Strategic Action Tracking
export interface StrategicActionTracking {
  /** Which strategy card is being resolved */
  cardNumber: number;
  /** Whether the primary ability has been resolved */
  primaryResolved: boolean;
  /** Player IDs in secondary resolution order (clockwise from active player) */
  secondaryOrder: UUID[];
  /** Index into secondaryOrder for current player resolving */
  currentSecondaryIndex: number;
  /** Each player's response to the secondary ability */
  secondaryResponses: Record<UUID, 'pending' | 'used' | 'declined'>;
  /** For Trade card: players who were granted free secondary */
  freeSecondaryPlayers?: UUID[];
}
