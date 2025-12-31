import type { UUID, HexCoord, UnitType } from './common.js';

// Base action type
export interface BaseAction {
  type: string;
  playerId: UUID;
  timestamp: number;
}

// Strategy Phase Actions
export interface PickStrategyCardAction extends BaseAction {
  type: 'pick_strategy_card';
  cardNumber: number;
}

// Action Phase Actions
export interface PassAction extends BaseAction {
  type: 'pass';
}

export interface TacticalAction extends BaseAction {
  type: 'tactical_action';
  systemPosition: HexCoord;
}

export interface MoveUnitsAction extends BaseAction {
  type: 'move_units';
  moves: UnitMove[];
}

export interface UnitMove {
  unitId: UUID;
  from: {
    systemPosition: HexCoord;
    planetId?: string;
  };
  to: {
    systemPosition: HexCoord;
    planetId?: string;
  };
  carrier?: UUID;
}

export interface ProduceUnitsAction extends BaseAction {
  type: 'produce_units';
  systemPosition: HexCoord;
  planetId?: string;
  units: { type: UnitType; count: number }[];
}

export interface SkipMovementAction extends BaseAction {
  type: 'skip_movement';
}

export interface SkipProductionAction extends BaseAction {
  type: 'skip_production';
}

export interface PlayActionCardAction extends BaseAction {
  type: 'play_action_card';
  cardId: string;
  targets?: ActionCardTargets;
}

export interface DiscardActionCardsAction extends BaseAction {
  type: 'discard_action_cards';
  cardIds: string[];
}

export interface ActionCardTargets {
  playerId?: UUID;
  systemPosition?: HexCoord;
  planetId?: string;
  unitIds?: UUID[];
}

export interface ComponentAction extends BaseAction {
  type: 'component_action';
  componentType: 'agent' | 'tech' | 'relic' | 'commander' | 'promissory';
  componentId: string;
  targets?: ComponentActionTargets;
}

export interface ComponentActionTargets {
  playerId?: UUID;
  systemPosition?: HexCoord;
  planetId?: string;
  techId?: string;
}

// Strategic Action
export interface StrategicAction extends BaseAction {
  type: 'strategic_action';
  cardNumber: number;
}

export interface StrategicSecondaryAction extends BaseAction {
  type: 'strategic_secondary';
  cardNumber: number;
  declined: boolean;
  choices?: StrategicSecondaryChoices;
}

export interface StrategicSecondaryChoices {
  // Leadership - influence spending, token distribution (no token cost!)
  influenceSpent?: number;
  commandTokenDistribution?: {
    tactics: number;
    fleet: number;
    strategy: number;
  };

  // Diplomacy - planets to ready (up to 2)
  readiedPlanets?: string[];

  // Politics - just draws 2 cards, no choices needed
  // (actionCardsDrawn is auto-set to 2)

  // Construction - system token placement and structure
  systemPosition?: HexCoord;
  structureBuilt?: {
    type: 'pds' | 'space_dock';
    planetId: string;
  };

  // Trade - just refreshes commodities, no choices needed

  // Warfare - production in home system (+2 capacity)
  unitsProduced?: { type: UnitType; count: number }[];
  exhaustedPlanets?: string[];

  // Technology - tech and resources (1 token + 4 resources)
  techId?: string;

  // Imperial - just draws secret objective, no choices needed
}

// Strategic Primary Action (resolving primary ability)
export interface StrategicPrimaryAction extends BaseAction {
  type: 'strategic_primary';
  cardNumber: number;
  choices: StrategicPrimaryChoices;
}

export interface StrategicPrimaryChoices {
  // Leadership - gain 3 tokens + optional influence spending
  influenceSpent?: number;
  tokenDistribution?: {
    tactics: number;
    fleet: number;
    strategy: number;
  };

  // Diplomacy - choose system to lock + ready up to 2 planets
  targetSystemPosition?: HexCoord;
  planetsToReady?: string[];

  // Politics - new speaker + agenda arrangement
  newSpeakerId?: UUID;
  agendaArrangement?: { cardId: string; position: 'top' | 'bottom' }[];

  // Construction - place up to 2 structures (1 any type + 1 PDS)
  firstStructure?: { type: 'pds' | 'space_dock'; planetId: string };
  secondStructure?: { type: 'pds'; planetId: string };

  // Trade - choose players for free secondary
  freeSecondaryPlayers?: UUID[];

  // Warfare - remove token from board + redistribute all tokens
  removedTokenSystem?: HexCoord;
  newTokenDistribution?: {
    tactics: number;
    fleet: number;
    strategy: number;
  };

  // Technology - research 1 free tech + optional 2nd for 6 resources
  firstTechId?: string;
  secondTechId?: string;
  exhaustedPlanets?: string[];

  // Imperial - score objective + Mecatol VP or token placement
  scoredObjectiveId?: string;
  placeMecatolToken?: boolean;
}

// Combat Actions
export interface AssignHitsAction extends BaseAction {
  type: 'assign_hits';
  assignments: HitAssignment[];
}

export interface HitAssignment {
  unitId: UUID;
  destroyed: boolean;
  sustainDamage: boolean;
}

export interface AnnounceRetreatAction extends BaseAction {
  type: 'announce_retreat';
  retreating: boolean;
  retreatSystem?: HexCoord;
}

export interface CancelHitAction extends BaseAction {
  type: 'cancel_hit';
  method: string;
  unitId?: UUID;
}

// Ground Combat / Invasion
export interface SelectInvasionTargetsAction extends BaseAction {
  type: 'select_invasion_targets';
  /** Planet IDs to invade in this system */
  targetPlanets: string[];
}

export interface CommitGroundForcesAction extends BaseAction {
  type: 'commit_ground_forces';
  /** Assignments of ground units to planets */
  assignments: { unitId: UUID; planetId: string }[];
}

export interface RollBombardmentAction extends BaseAction {
  type: 'roll_bombardment';
  /** Planet being bombarded */
  planetId: string;
}

export interface SkipBombardmentAction extends BaseAction {
  type: 'skip_bombardment';
}

export interface AssignBombardmentHitsAction extends BaseAction {
  type: 'assign_bombardment_hits';
  /** Unit assignments for bombardment hits */
  assignments: HitAssignment[];
}

export interface AssignSpaceCannonHitsAction extends BaseAction {
  type: 'assign_space_cannon_hits';
  /** Unit assignments for space cannon hits */
  assignments: HitAssignment[];
}

export interface SkipInvasionAction extends BaseAction {
  type: 'skip_invasion';
}

// Agenda Phase Actions
export interface RevealAgendaAction extends BaseAction {
  type: 'reveal_agenda';
}

export interface CastVoteAction extends BaseAction {
  type: 'cast_vote';
  /** The outcome to vote for ('for'/'against' or player/planet id) */
  outcome: string;
  /** Planet IDs to exhaust for influence votes */
  exhaustedPlanets: string[];
  /** Whether to abstain (cast 0 votes) */
  abstain?: boolean;
}

export interface SpeakerTiebreakAction extends BaseAction {
  type: 'speaker_tiebreak';
  /** The tied outcome the speaker chooses */
  chosenOutcome: string;
}

export interface PlayRiderAction extends BaseAction {
  type: 'play_rider';
  cardId: string;
  prediction: string;
}

export interface VoteAction extends BaseAction {
  type: 'vote';
  agendaId: string;
  votes: number;
  outcome: string;
  extraVotes?: number;
  abstain?: boolean;
}

export interface ResolveAgendaAction extends BaseAction {
  type: 'resolve_agenda';
  agendaId: string;
  outcome: string;
  electedPlayer?: UUID;
  electedPlanet?: string;
}

// Status Phase Actions
export interface ScoreObjectiveAction extends BaseAction {
  type: 'score_objective';
  objectiveId: string;
  objectiveType: 'public' | 'secret';
  /** For "spend X" objectives, specify what is being spent */
  spentResources?: SpentResources;
}

export interface SpentResources {
  /** Planet IDs to exhaust for resources/influence */
  exhaustedPlanets?: string[];
  /** Trade goods to spend */
  tradeGoods?: number;
  /** Command tokens to spend from tactic pool */
  tacticTokens?: number;
  /** Command tokens to spend from strategy pool */
  strategyTokens?: number;
  /** Action cards to discard */
  actionCardIds?: string[];
}

export interface SkipScoringAction extends BaseAction {
  type: 'skip_scoring';
  /** Which objective type(s) to skip */
  skipType: 'public' | 'secret' | 'both';
}

export interface SelectSecretObjectiveAction extends BaseAction {
  type: 'select_secret_objective';
  /** The secret objective to keep */
  selectedObjectiveId: string;
  /** The secret objective to discard back to deck */
  discardedObjectiveId: string;
}

export interface RedistributeTokensAction extends BaseAction {
  type: 'redistribute_tokens';
  /** New distribution after gaining 2 tokens */
  distribution: {
    tactics: number;
    fleet: number;
    strategy: number;
  };
}

export interface ReadyCardsAction extends BaseAction {
  type: 'ready_cards';
}

export interface RepairUnitsAction extends BaseAction {
  type: 'repair_units';
  unitIds: UUID[];
}

export interface ReturnStrategyCardAction extends BaseAction {
  type: 'return_strategy_card';
}

export interface GainCommandTokensAction extends BaseAction {
  type: 'gain_command_tokens';
  distribution: {
    tactics: number;
    fleet: number;
    strategy: number;
  };
}

// Transaction Actions
export interface ProposeTransactionAction extends BaseAction {
  type: 'propose_transaction';
  targetPlayerId: UUID;
  offering: TransactionOffer;
  requesting: TransactionOffer;
}

export interface TransactionOffer {
  tradeGoods?: number;
  commodities?: number;
  promissoryNotes?: string[];
  actionCards?: string[];
  supportForTheThrone?: boolean;
  ceasefire?: boolean;
}

export interface AcceptTransactionAction extends BaseAction {
  type: 'accept_transaction';
  transactionId: UUID;
}

export interface DeclineTransactionAction extends BaseAction {
  type: 'decline_transaction';
  transactionId: UUID;
}

// Promissory Note Actions
export interface PlayPromissoryNoteAction extends BaseAction {
  type: 'play_promissory_note';
  noteId: string;
  targetPlayerId?: UUID;
  targetPlanetId?: string;
  targetTechId?: string;
  targetCardId?: string;
}

// Timing Window Responses
export interface TimingWindowResponseAction extends BaseAction {
  type: 'timing_window_response';
  windowId: UUID;
  response: 'pass' | 'play_card';
  cardId?: string;
  targets?: ActionCardTargets;
}

// Technology Actions
export interface ResearchTechnologyAction extends BaseAction {
  type: 'research_technology';
  techId: string;
  exhaustedPlanets?: string[];
}

// Planet Actions
export interface ExhaustPlanetAction extends BaseAction {
  type: 'exhaust_planet';
  planetId: string;
}

export interface ReadyPlanetAction extends BaseAction {
  type: 'ready_planet';
  planetId: string;
}

// Exploration (PoK)
export interface ExploreAction extends BaseAction {
  type: 'explore';
  planetId: string;
  explorationCardId?: string;
}

export interface PurgeRelicFragmentsAction extends BaseAction {
  type: 'purge_relic_fragments';
  fragmentType: 'cultural' | 'industrial' | 'hazardous' | 'unknown';
  count: number;
}

// Relic Actions (PoK)
export interface UseRelicAction extends BaseAction {
  type: 'use_relic';
  relicId: string;
  /** For relics that require target selection */
  targets?: {
    playerId?: UUID;
    systemId?: string;
    planetId?: string;
    techId?: string;
    actionCardIds?: string[];
  };
}

export interface ReadyRelicAction extends BaseAction {
  type: 'ready_relic';
  relicId: string;
}

// Legendary Planet Actions (PoK)
export interface UseLegendaryAbilityAction extends BaseAction {
  type: 'use_legendary_ability';
  planetId: string;
  /** For abilities that require targets */
  targets?: {
    attachmentIds?: string[];  // For Primor (purge attachments)
    actionCardIds?: string[];  // For Hope's End (return to deck)
    unitProduction?: { type: string; count: number }[];  // For Mallice
  };
}

// Leader Actions (PoK)
export interface UnlockCommanderAction extends BaseAction {
  type: 'unlock_commander';
}

export interface UseAgentAction extends BaseAction {
  type: 'use_agent';
  targetPlayerId?: UUID;
}

export interface PurgeHeroAction extends BaseAction {
  type: 'purge_hero';
  targets?: ComponentActionTargets;
}

// Combat Flow Actions
export interface AdvanceCombatAction extends BaseAction {
  type: 'advance_combat';
}

// Union of all action types
export type GameAction =
  | PickStrategyCardAction
  | PassAction
  | TacticalAction
  | MoveUnitsAction
  | ProduceUnitsAction
  | SkipMovementAction
  | SkipProductionAction
  | PlayActionCardAction
  | DiscardActionCardsAction
  | ComponentAction
  | StrategicAction
  | StrategicPrimaryAction
  | StrategicSecondaryAction
  | AssignHitsAction
  | AnnounceRetreatAction
  | CancelHitAction
  | SelectInvasionTargetsAction
  | CommitGroundForcesAction
  | RollBombardmentAction
  | SkipBombardmentAction
  | AssignBombardmentHitsAction
  | AssignSpaceCannonHitsAction
  | SkipInvasionAction
  | RevealAgendaAction
  | CastVoteAction
  | SpeakerTiebreakAction
  | VoteAction
  | PlayRiderAction
  | ResolveAgendaAction
  | ScoreObjectiveAction
  | SkipScoringAction
  | SelectSecretObjectiveAction
  | RedistributeTokensAction
  | ReadyCardsAction
  | RepairUnitsAction
  | ReturnStrategyCardAction
  | GainCommandTokensAction
  | ProposeTransactionAction
  | AcceptTransactionAction
  | DeclineTransactionAction
  | PlayPromissoryNoteAction
  | TimingWindowResponseAction
  | ResearchTechnologyAction
  | ExhaustPlanetAction
  | ReadyPlanetAction
  | ExploreAction
  | PurgeRelicFragmentsAction
  | UseRelicAction
  | ReadyRelicAction
  | UseLegendaryAbilityAction
  | UnlockCommanderAction
  | UseAgentAction
  | PurgeHeroAction
  | AdvanceCombatAction;

// Action result
export interface ActionResult {
  success: boolean;
  error?: string;
  stateVersion: number;
  triggeredEvents?: string[];
}
