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

export interface PlayActionCardAction extends BaseAction {
  type: 'play_action_card';
  cardId: string;
  targets?: ActionCardTargets;
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
  // Leadership
  commandTokenDistribution?: {
    tactics: number;
    fleet: number;
    strategy: number;
  };
  // Diplomacy
  readiedPlanets?: string[];
  // Politics
  actionCardsDrawn?: number;
  // Construction
  structureBuilt?: {
    type: 'pds' | 'space_dock';
    planetId: string;
  };
  // Trade
  refreshCommodities?: boolean;
  // Warfare
  tokenPlacement?: 'tactics' | 'fleet' | 'strategy';
  // Technology
  techResearched?: string;
  // Imperial
  objectiveScored?: string;
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
export interface CommitGroundForcesAction extends BaseAction {
  type: 'commit_ground_forces';
  planetId: string;
  unitIds: UUID[];
}

// Agenda Phase Actions
export interface VoteAction extends BaseAction {
  type: 'vote';
  agendaId: string;
  votes: number;
  outcome: string;
  extraVotes?: number;
  abstain?: boolean;
}

export interface PlayRiderAction extends BaseAction {
  type: 'play_rider';
  cardId: string;
  prediction: string;
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

// Union of all action types
export type GameAction =
  | PickStrategyCardAction
  | PassAction
  | TacticalAction
  | MoveUnitsAction
  | ProduceUnitsAction
  | PlayActionCardAction
  | ComponentAction
  | StrategicAction
  | StrategicSecondaryAction
  | AssignHitsAction
  | AnnounceRetreatAction
  | CancelHitAction
  | CommitGroundForcesAction
  | VoteAction
  | PlayRiderAction
  | ResolveAgendaAction
  | ScoreObjectiveAction
  | ReadyCardsAction
  | RepairUnitsAction
  | ReturnStrategyCardAction
  | GainCommandTokensAction
  | ProposeTransactionAction
  | AcceptTransactionAction
  | DeclineTransactionAction
  | TimingWindowResponseAction
  | ResearchTechnologyAction
  | ExhaustPlanetAction
  | ReadyPlanetAction
  | ExploreAction
  | PurgeRelicFragmentsAction
  | UnlockCommanderAction
  | UseAgentAction
  | PurgeHeroAction;

// Action result
export interface ActionResult {
  success: boolean;
  error?: string;
  stateVersion: number;
  triggeredEvents?: string[];
}
