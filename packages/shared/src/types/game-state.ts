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
  /** Player IDs blocked from moving ships by Ceasefire (cleared after tactical action) */
  ceasefireBlocks?: UUID[];
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
  /** Temporary tactical modifiers from action cards (cleared after tactical action) */
  tacticalModifiers?: {
    [playerId: string]: TacticalModifiers;
  };
  /** Ion Storm token - creates a wormhole that flips when ships pass through */
  ionStormToken?: IonStormToken | null;
  /** Creuss wormhole token - delta wormhole placed via Creuss IFF promissory note */
  creussWormholeToken?: CreussWormholeToken | null;
  /** Pending card discards required by abilities (e.g., Yssaril Scheming) */
  pendingDiscards?: PendingDiscard[];
  /** Pending emergency agenda phase triggered by Emergency Meeting action card */
  pendingEmergencyAgenda?: UUID;
  // =============================================================================
  // THUNDER'S EDGE
  // =============================================================================
  /** Active galactic events for this game (selected during setup) */
  activeGalacticEvents?: string[];
  /** The Fracture dimension state */
  fractureState?: FractureState;
  /** Breach tokens placed by Crimson Rebellion */
  breachTokens?: BreachTokenState[];
  /** Coexistence state for Deepwrought Scholarate mechanic */
  coexistenceState?: CoexistenceState[];
  /** Thunder's Edge expedition state */
  expeditionState?: ExpeditionState;
  /** Space station control state (Thunder's Edge) */
  spaceStationState?: SpaceStationState[];
}

/** Pending discard requirement (e.g., from Yssaril Scheming) */
export interface PendingDiscard {
  /** Player who must discard */
  playerId: UUID;
  /** Reason for the discard */
  reason: 'scheming' | 'hand_limit' | 'ability';
  /** Number of cards that must be discarded */
  count: number;
}

/** Ion Storm token state - creates alpha or beta wormhole that flips on ship passage */
export interface IonStormToken {
  /** The system where the token is placed */
  systemId: string;
  /** Which wormhole type the token currently shows */
  side: 'alpha' | 'beta';
}

/** Creuss wormhole token - delta wormhole placed via Creuss IFF promissory note */
export interface CreussWormholeToken {
  /** The system where the token is placed */
  systemId: string;
}

// =============================================================================
// THUNDER'S EDGE STATE INTERFACES
// =============================================================================

/** The Fracture dimension state (Thunder's Edge) */
export interface FractureState {
  /** Whether The Fracture has been activated */
  isActive: boolean;
  /** Ingress tokens allowing access to The Fracture */
  ingressTokens: IngressToken[];
  /** Neutral units guarding Fracture planets */
  neutralUnits: NeutralUnit[];
  /** Players who have entered The Fracture this round */
  playersEnteredThisRound: UUID[];
}

/** Ingress token placed in a system to access The Fracture */
export interface IngressToken {
  /** The system where the token is placed */
  systemId: string;
  /** Player who placed the token */
  playerId: UUID;
  /** Whether the token is active */
  active: boolean;
}

/** Neutral unit guarding a Fracture planet */
export interface NeutralUnit {
  /** Unique ID for this neutral unit */
  id: string;
  /** Type of neutral unit */
  type: 'neutral_cruiser' | 'neutral_fighter' | 'neutral_infantry';
  /** System ID where the unit is located */
  systemId: string;
  /** Planet ID if the unit is on a planet */
  planetId?: string;
}

/** Breach token state (Crimson Rebellion) */
export interface BreachTokenState {
  /** The system containing the breach token */
  systemId: string;
  /** Player who placed the breach token */
  placedBy: UUID;
  /** Whether the breach token is active (flipped) */
  active: boolean;
}

/** Coexistence state for a planet (Deepwrought Scholarate) */
export interface CoexistenceState {
  /** The planet where coexistence is occurring */
  planetId: string;
  /** Player IDs who have units in coexistence on this planet */
  coexistingPlayers: UUID[];
}

/** Space station control state (Thunder's Edge) */
export interface SpaceStationState {
  /** The station's planet ID */
  stationId: string;
  /** System containing the station */
  systemId: string;
  /** Current controller (if any) */
  controllerId?: UUID;
  /** Whether the station is exhausted */
  exhausted: boolean;
}

/** Player's breakthrough state (Thunder's Edge) */
export interface PlayerBreakthroughState {
  /** The breakthrough ID (from breakthroughs.ts) */
  breakthroughId: string;
  /** Whether the breakthrough has been unlocked */
  unlocked: boolean;
  /** Whether the breakthrough is currently exhausted */
  exhausted: boolean;
  /** Trade goods accumulated on the breakthrough (for Firmament's The Sowing) */
  tradeGoodsOnCard?: number;
  /** Action cards collected on breakthrough (for Ral Nel's Data Skimmer) */
  collectedCards?: string[];
}

/** Expedition state tracking (Thunder's Edge) */
export interface ExpeditionState {
  /** The 6 expedition slices and their claim status */
  slices: ExpeditionSlice[];
  /** Players who have claimed slices (in order) */
  claimOrder: UUID[];
  /** Whether the expedition has been completed (all slices claimed or Thunder's Edge placed) */
  completed: boolean;
}

/** A single expedition slice */
export interface ExpeditionSlice {
  /** Slice identifier (1-6) */
  sliceNumber: number;
  /** The cost type required to claim this slice */
  costType: ExpeditionCostType;
  /** Whether this slice has been claimed */
  claimed: boolean;
  /** Player who claimed this slice (if claimed) */
  claimedBy?: UUID;
}

/** Types of costs for expedition slices */
export type ExpeditionCostType =
  | 'resources_5'        // Spend 5 resources
  | 'action_cards_2'     // Discard 2 action cards
  | 'influence_5'        // Spend 5 influence
  | 'secret_objective'   // Discard 1 secret objective
  | 'tech_specialty'     // Exhaust a planet with tech specialty
  | 'trade_goods_3';     // Spend 3 trade goods

/** Temporary tactical modifiers from action cards and relics */
export interface TacticalModifiers {
  /** +N to movement value (Flank Speed) */
  movementBonus?: number;
  /** +N to production value (War Machine) */
  productionBonus?: number;
  /** -N to production value (Tech Sabotage) */
  productionPenalty?: number;
  /** Can pass through enemy ships (In the Silence of Space) */
  canPassThroughShips?: boolean;
  /** Space cannon hits cancelled (Maneuvering Jets) */
  spaceCannonHitsCancelled?: number;
  /** Experimental Battlestation effect */
  experimentalBattlestation?: {
    systemPosition: HexCoord;
    spaceCannon: { value: number; dice: number };
  };
  /** Solar Flare blocks space cannon in this system */
  solarFlareSystem?: HexCoord;
  /** Units with Reveal Prototype (gain sustain damage) */
  revealPrototypeUnits?: string[];
  /** Ignore anomaly effects during movement (Nav Suite) */
  ignoreAnomalies?: boolean;
  /** Can perform strategic action without token (Master Plan) */
  freeStrategicAction?: boolean;
  /** Dominus Orb - Can move from systems with command tokens */
  canMoveFromTokenedSystems?: boolean;
  /** Scepter of Emelpar - Use reinforcement token instead of strategy token */
  useReinforcementForStrategy?: boolean;
  /** Prophet's Tears - Ignore 1 tech prerequisite on next research */
  ignoreOnePrerequisite?: boolean;
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
  /** The home system ID for this player's faction */
  homeSystemId?: number;
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
  exhaustedTechnologies?: string[];
  leaders?: LeaderState;
  /** Political Stability - keep strategy card next round */
  keepStrategyCard?: boolean;
  /** Public Disgrace - commodity refresh blocked */
  commodityRefreshBlocked?: boolean;
  /** Whether this player is controlled by AI */
  isBot?: boolean;
  /** Captured units (Vuil'Raith Vortex ability) */
  capturedUnits?: CapturedUnit[];
  // Commander unlock tracking
  /** Whether player has produced a War Sun this game (Muaat unlock) */
  producedWarSun?: boolean;
  /** Whether player has had combat in Mecatol Rex system (Winnu unlock) */
  hadCombatInMecatol?: boolean;
  /** Tracking faction ability usage for unlock conditions */
  usedFactionAbility?: Record<string, boolean>;
  /** Command tokens collected from other players (Mahact - playerId -> count) */
  collectedCommandTokens?: Record<string, number>;
  /** Units available in reinforcement pool (not yet on the map) */
  reinforcements?: ReinforcementPool;
  /** Naalu's 0 initiative token - always acts first in action phase */
  hasZeroToken?: boolean;
  /** Yssaril Scheming - must discard 1 action card after drawing */
  pendingSchemingDiscard?: boolean;
  /** Nekro Valefar Assimilator tokens - track which faction tech each token is on */
  assimilatorTokens?: {
    x?: { targetTechId: string; targetPlayerId: string };
    y?: { targetTechId: string; targetPlayerId: string };
  };
  // =============================================================================
  // THUNDER'S EDGE - Breakthroughs
  // =============================================================================
  /** Player's breakthrough state (Thunder's Edge) */
  breakthrough?: PlayerBreakthroughState;
  /** Galvanize tokens on units (Last Bastion) */
  galvanizeTokens?: string[]; // Unit IDs that are galvanized
  /** Plot cards in hand (Firmament) */
  plotCards?: string[];
  /** Plot cards in play area (Firmament) */
  plotCardsInPlay?: string[];
  /** Ocean cards in hand (Deepwrought) */
  oceanCards?: string[];
}

/** Track available reinforcements per unit type */
export interface ReinforcementPool {
  infantry: number;
  fighter: number;
  carrier: number;
  cruiser: number;
  destroyer: number;
  dreadnought: number;
  war_sun: number;
  flagship: number;
  pds: number;
  space_dock: number;
  mech: number;
}

export interface CapturedUnit {
  id: string;
  type: UnitType;
  ownerId: string;
  damaged: boolean;
  originalOwnerId: string;
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
  /** For hyperlane tiles: which side is face-up ('A' or 'B'). Defaults to 'A'. */
  hyperlaneSide?: 'A' | 'B';
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
  /** Trade goods placed on this card (Manipulate Investments) */
  tradeGoods?: number;
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
  /** Temporary combat modifiers from action cards (cleared after each round) */
  temporaryModifiers?: {
    [playerId: string]: CombatModifiers;
  };
  /** Nekro Technological Singularity - has been used this combat */
  technologicalSingularityUsed?: boolean;
  /** Nekro pending tech gain choice - player can select tech from opponent */
  pendingTechGain?: {
    nekroPlayerId: string;
    opponentPlayerId: string;
  };
}

/** Temporary combat modifiers from action cards */
export interface CombatModifiers {
  /** +N to combat roll results (Morale Boost) */
  combatBonus?: number;
  /** -N to combat roll results (Bunker) */
  combatPenalty?: number;
  /** Number of rerolls available (Fire Team) */
  rerollsAvailable?: number;
  /** Extra dice per unit (Blitz) */
  extraDice?: number;
  /** Units excluded from combat (Infiltrate) */
  infiltratedUnits?: string[];
  /** Units that can't use AFB (Disable) */
  disabledAFBUnits?: string[];
  /** AFB hits are cancelled (Scramble Frequency) */
  afbHitsCancelled?: boolean;
  /** Fighter combat bonus/penalty (Fighter Prototype) */
  fighterBonus?: number;
  /** Cannot make combat rolls this round (Magen Defense Grid) */
  blockedFromCombat?: boolean;
  /** Cannot retreat this combat (Waylay) */
  cannotRetreat?: boolean;
  /** Must announce retreat this combat (Rout) */
  mustRetreat?: boolean;
  /** Unit ID targeted for boarding party cargo steal */
  boardingPartyTarget?: string;
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
  /** Confusing Legal Text swaps outcomes */
  confusingLegalText?: boolean;
  /** Sanctions forces TG payment to vote */
  sanctionsActive?: UUID;
  /** Nekro GALACTIC THREAT prediction - once per agenda phase */
  nekroPrediction?: {
    playerId: UUID;
    prediction: string;
    hasPredicted: boolean;
  };
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
  /** Map of planetId to fighter IDs committed as ground forces (Naalu Matriarch) */
  fightersAsGroundForces?: Record<string, string[]>;
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
