import type {
  GameState,
  GameAction,
  AssignHitsAction,
  AnnounceRetreatAction,
  ScoreObjectiveAction,
  SkipScoringAction,
  SelectSecretObjectiveAction,
  RedistributeTokensAction,
  CastVoteAction,
  SpeakerTiebreakAction,
  PlayRiderAction,
  SelectInvasionTargetsAction,
  CommitGroundForcesAction,
  RollBombardmentAction,
  SkipBombardmentAction,
  AssignBombardmentHitsAction,
  AssignSpaceCannonHitsAction,
  SkipInvasionAction,
  PlayActionCardAction,
  DiscardActionCardsAction,
  ResearchTechnologyAction,
  StrategicPrimaryAction,
  StrategicSecondaryAction,
  ProposeTransactionAction,
  AcceptTransactionAction,
  DeclineTransactionAction,
  PlayPromissoryNoteAction,
  TimingWindowResponseAction,
  ExploreAction,
  PurgeRelicFragmentsAction,
  UseRelicAction,
  ReadyRelicAction,
  UseLegendaryAbilityAction,
  UseAgentAction,
  UnlockCommanderAction,
  PurgeHeroAction,
  ComponentAction,
  PlaceIonStormAction,
  // Thunder's Edge Actions
  ClaimExpeditionSliceAction,
  StartCoexistenceAction,
  EndCoexistenceAction,
  PlayOceanCardAction,
  PickupStructureAction,
  PlaceStructureAction,
  PlaceBreachTokenAction,
  FlipBreachTokenAction,
  GalvanizeUnitAction,
  PlayPlotCardAction,
  TransformToObsidianAction,
  UseBreakthroughAction,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { handlePickStrategyCard } from './strategy-phase.js';
import {
  handlePass,
  handleTacticalAction,
  handleStrategicAction,
  handleMoveUnits,
  handleSkipMovement,
  handleProduceUnits,
  handleSkipProduction,
} from './action-phase.js';
import {
  handleAssignHits,
  handleAnnounceRetreat,
  advanceCombatState,
} from './combat.js';
import {
  handleScoreObjective,
  handleSkipScoring,
  handleRedistributeTokens,
  handleSelectSecretObjective,
} from './status-phase.js';
import {
  handleRevealAgenda,
  handleCastVote,
  handleSpeakerTiebreak,
  handlePlayRider,
} from './agenda-phase.js';
import {
  handleSelectInvasionTargets,
  handleCommitGroundForces,
  handleRollBombardment,
  handleSkipBombardment,
  handleAssignBombardmentHits,
  handleAssignSpaceCannonHits,
  handleSkipInvasion,
} from './invasion.js';
import {
  handlePlayActionCard,
  handleDiscardActionCards,
} from './action-cards.js';
import { handleResearchTechnology } from './technology.js';
import {
  handleStrategicPrimary,
  handleStrategicSecondary,
} from './strategy-cards.js';
import {
  handleProposeTransaction,
  handleAcceptTransaction,
  handleDeclineTransaction,
} from './transactions.js';
import { handlePlayPromissoryNote } from './promissory-notes.js';
import { handleTimingWindowResponse } from './timing-windows.js';
import {
  handleExplore,
  handlePurgeRelicFragments,
} from './exploration.js';
import {
  handleUseRelic,
  handleReadyRelic,
} from './relics.js';
import { handleUseLegendaryAbility } from './legendary-planets.js';
import {
  handleUseAgent,
  handleUnlockCommander,
  handlePurgeHero,
} from './leaders.js';
import { handleComponentAction, handlePlaceIonStorm } from './component-actions.js';
// Thunder's Edge Handlers
import {
  handleClaimExpeditionSlice as handleClaimExpeditionSliceInternal,
  type ClaimExpeditionSliceAction as InternalExpeditionAction,
} from './expedition.js';
import {
  handleStartCoexistence as handleStartCoexistenceInternal,
  handleEndCoexistence as handleEndCoexistenceInternal,
  handlePlayOceanCard as handlePlayOceanCardInternal,
  type StartCoexistenceAction as InternalStartCoexistenceAction,
  type EndCoexistenceAction as InternalEndCoexistenceAction,
  type OceanCardAction as InternalOceanCardAction,
} from './deepwrought.js';
import {
  handlePickupStructure as handlePickupStructureInternal,
  handlePlaceStructure as handlePlaceStructureInternal,
  type TransportStructureAction as InternalTransportAction,
  type PlaceStructureAction as InternalPlaceStructureAction,
} from './ral-nel.js';
import {
  handlePlaceBreach as handlePlaceBreachInternal,
  handleFlipBreach as handleFlipBreachInternal,
  type PlaceBreachAction as InternalPlaceBreachAction,
  type FlipBreachAction as InternalFlipBreachAction,
} from './crimson-rebellion.js';
import {
  handleGalvanize as handleGalvanizeInternal,
  type GalvanizeAction as InternalGalvanizeAction,
} from './last-bastion.js';
import {
  handlePlayPlotCard,
  handleTransformToObsidian,
} from './firmament.js';
import { executeBreakthroughEffect } from './breakthroughs.js';
import { BREAKTHROUGHS_BY_FACTION } from '@ti4/shared';

// Adapter functions to convert shared action types to internal handler types
function handleClaimExpeditionSlice(state: GameState, action: ClaimExpeditionSliceAction): HandlerResult {
  const internalAction: InternalExpeditionAction = {
    type: 'claim_expedition_slice',
    playerId: action.playerId,
    sliceNumber: action.sliceIndex, // Map sliceIndex -> sliceNumber
    payment: action.payment,
  };
  return handleClaimExpeditionSliceInternal(state, internalAction);
}

function handleStartCoexistence(state: GameState, action: StartCoexistenceAction): HandlerResult {
  const internalAction: InternalStartCoexistenceAction = {
    type: 'start_coexistence',
    playerId: action.playerId,
    planetId: action.planetId,
  };
  return handleStartCoexistenceInternal(state, internalAction);
}

function handleEndCoexistence(state: GameState, action: EndCoexistenceAction): HandlerResult {
  const internalAction: InternalEndCoexistenceAction = {
    type: 'end_coexistence',
    planetId: action.planetId,
    reason: 'withdrawal', // Default reason for player-initiated end
  };
  return handleEndCoexistenceInternal(state, internalAction);
}

function handlePlayOceanCard(state: GameState, action: PlayOceanCardAction): HandlerResult {
  const internalAction: InternalOceanCardAction = {
    type: 'play_ocean_card',
    playerId: action.playerId,
    cardId: action.cardId,
    targetPlanetId: action.targets?.planetId,
  };
  return handlePlayOceanCardInternal(state, internalAction);
}

function handlePickupStructure(state: GameState, action: PickupStructureAction): HandlerResult {
  const internalAction: InternalTransportAction = {
    type: 'transport_structure',
    playerId: action.playerId,
    structureId: action.structureId,
    shipId: action.carrierId, // Map carrierId -> shipId
  };
  return handlePickupStructureInternal(state, internalAction);
}

function handlePlaceStructure(state: GameState, action: PlaceStructureAction): HandlerResult {
  const internalAction: InternalPlaceStructureAction = {
    type: 'place_structure',
    playerId: action.playerId,
    structureId: action.structureId,
    planetId: action.planetId,
  };
  return handlePlaceStructureInternal(state, internalAction);
}

function handlePlaceBreach(state: GameState, action: PlaceBreachTokenAction): HandlerResult {
  const internalAction: InternalPlaceBreachAction = {
    type: 'place_breach',
    playerId: action.playerId,
    systemId: action.systemId,
  };
  return handlePlaceBreachInternal(state, internalAction);
}

function handleFlipBreach(state: GameState, action: FlipBreachTokenAction): HandlerResult {
  const internalAction: InternalFlipBreachAction = {
    type: 'flip_breach',
    playerId: action.playerId,
    systemId: action.tokenId, // Map tokenId -> systemId (breach identified by system)
  };
  return handleFlipBreachInternal(state, internalAction);
}

function handleGalvanize(state: GameState, action: GalvanizeUnitAction): HandlerResult {
  const internalAction: InternalGalvanizeAction = {
    type: 'galvanize',
    playerId: action.playerId,
    unitId: action.unitId,
  };
  return handleGalvanizeInternal(state, internalAction);
}

/**
 * Main action handler - routes to specific handlers based on action type
 * Handlers mutate the game state directly
 */
export function handleAction(state: GameState, action: GameAction): HandlerResult {
  switch (action.type) {
    // Strategy Phase
    case 'pick_strategy_card':
      return handlePickStrategyCard(state, action);

    // Action Phase
    case 'pass':
      return handlePass(state, action);

    case 'tactical_action':
      return handleTacticalAction(state, action);

    case 'strategic_action':
      return handleStrategicAction(state, action);

    case 'component_action':
      return handleComponentAction(state, action as ComponentAction);

    case 'strategic_primary':
      return handleStrategicPrimary(state, action as StrategicPrimaryAction);

    case 'strategic_secondary':
      return handleStrategicSecondary(state, action as StrategicSecondaryAction);

    // Tactical Sub-phases
    case 'move_units':
      return handleMoveUnits(state, action);

    case 'skip_movement':
      return handleSkipMovement(state, action);

    case 'produce_units':
      return handleProduceUnits(state, action);

    case 'skip_production':
      return handleSkipProduction(state, action);

    // Combat
    case 'assign_hits':
      return handleAssignHits(state, action as AssignHitsAction);

    case 'announce_retreat':
      return handleAnnounceRetreat(state, action as AnnounceRetreatAction);

    case 'advance_combat':
      return advanceCombatState(state);

    // Status Phase
    case 'score_objective':
      return handleScoreObjective(state, action as ScoreObjectiveAction);

    case 'skip_scoring':
      return handleSkipScoring(state, action as SkipScoringAction);

    case 'redistribute_tokens':
      return handleRedistributeTokens(state, action as RedistributeTokensAction);

    case 'select_secret_objective':
      return handleSelectSecretObjective(state, action as SelectSecretObjectiveAction);

    // Agenda Phase
    case 'reveal_agenda':
      return handleRevealAgenda(state, action.playerId);

    case 'cast_vote':
      return handleCastVote(state, action as CastVoteAction);

    case 'speaker_tiebreak':
      return handleSpeakerTiebreak(state, action as SpeakerTiebreakAction);

    case 'play_rider':
      return handlePlayRider(state, action as PlayRiderAction);

    // Invasion
    case 'select_invasion_targets':
      return handleSelectInvasionTargets(state, action as SelectInvasionTargetsAction);

    case 'commit_ground_forces':
      return handleCommitGroundForces(state, action as CommitGroundForcesAction);

    case 'roll_bombardment':
      return handleRollBombardment(state, action as RollBombardmentAction);

    case 'skip_bombardment':
      return handleSkipBombardment(state, action as SkipBombardmentAction);

    case 'assign_bombardment_hits':
      return handleAssignBombardmentHits(state, action as AssignBombardmentHitsAction);

    case 'assign_space_cannon_hits':
      return handleAssignSpaceCannonHits(state, action as AssignSpaceCannonHitsAction);

    case 'skip_invasion':
      return handleSkipInvasion(state, action as SkipInvasionAction);

    // Action Cards
    case 'play_action_card':
      return handlePlayActionCard(state, action as PlayActionCardAction);

    case 'discard_action_cards':
      return handleDiscardActionCards(state, action as DiscardActionCardsAction);

    // Technology
    case 'research_technology':
      return handleResearchTechnology(state, action as ResearchTechnologyAction);

    // Transactions
    case 'propose_transaction':
      return handleProposeTransaction(state, action as ProposeTransactionAction);

    case 'accept_transaction':
      return handleAcceptTransaction(state, action as AcceptTransactionAction);

    case 'decline_transaction':
      return handleDeclineTransaction(state, action as DeclineTransactionAction);

    // Promissory Notes
    case 'play_promissory_note':
      return handlePlayPromissoryNote(state, action as PlayPromissoryNoteAction);

    // Timing Windows
    case 'timing_window_response':
      return handleTimingWindowResponse(state, action as TimingWindowResponseAction);

    // Exploration (PoK)
    case 'explore':
      return handleExplore(state, action as ExploreAction);

    case 'purge_relic_fragments':
      return handlePurgeRelicFragments(state, action as PurgeRelicFragmentsAction);

    // Relic Actions (PoK)
    case 'use_relic':
      return handleUseRelic(state, action as UseRelicAction);

    case 'ready_relic':
      return handleReadyRelic(state, action as ReadyRelicAction);

    // Legendary Planet Actions (PoK)
    case 'use_legendary_ability':
      return handleUseLegendaryAbility(state, action as UseLegendaryAbilityAction);

    // Leader Actions (PoK)
    case 'use_agent':
      return handleUseAgent(state, action as UseAgentAction);

    case 'unlock_commander':
      return handleUnlockCommander(state, action as UnlockCommanderAction);

    case 'purge_hero':
      return handlePurgeHero(state, action as PurgeHeroAction);

    // Ion Storm Token
    case 'place_ion_storm':
      return handlePlaceIonStorm(state, action as PlaceIonStormAction);

    case 'flip_ion_storm':
      // Flip is handled automatically during movement, not as a direct action
      return { success: false, error: 'Ion Storm flips automatically when ships pass through' };

    // Thunder's Edge - Expedition
    case 'claim_expedition_slice':
      return handleClaimExpeditionSlice(state, action as ClaimExpeditionSliceAction);

    // Thunder's Edge - Deepwrought Coexistence
    case 'start_coexistence':
      return handleStartCoexistence(state, action as StartCoexistenceAction);

    case 'end_coexistence':
      return handleEndCoexistence(state, action as EndCoexistenceAction);

    case 'play_ocean_card':
      return handlePlayOceanCard(state, action as PlayOceanCardAction);

    // Thunder's Edge - Ral Nel Structure Transport
    case 'pickup_structure':
      return handlePickupStructure(state, action as PickupStructureAction);

    case 'place_structure':
      return handlePlaceStructure(state, action as PlaceStructureAction);

    // Thunder's Edge - Crimson Rebellion Breach Tokens
    case 'place_breach_token':
      return handlePlaceBreach(state, action as PlaceBreachTokenAction);

    case 'flip_breach_token':
      return handleFlipBreach(state, action as FlipBreachTokenAction);

    // Thunder's Edge - Last Bastion Galvanize
    case 'galvanize_unit':
      return handleGalvanize(state, action as GalvanizeUnitAction);

    // Thunder's Edge - Firmament/Obsidian Plot Cards
    case 'play_plot_card':
      return handlePlayPlotCard(state, action as PlayPlotCardAction);

    case 'transform_to_obsidian':
      return handleTransformToObsidian(state, action as TransformToObsidianAction);

    // Thunder's Edge - Breakthroughs
    case 'use_breakthrough': {
      const breakthroughAction = action as UseBreakthroughAction;
      const player = state.players.find(p => p.id === breakthroughAction.playerId);
      if (!player) {
        return { success: false, error: 'Player not found' };
      }
      const breakthrough = BREAKTHROUGHS_BY_FACTION[player.faction];
      if (!breakthrough) {
        return { success: false, error: 'No breakthrough for faction' };
      }
      return executeBreakthroughEffect({
        state,
        player,
        breakthrough,
        trigger: { type: 'action' },
        targets: breakthroughAction.targets,
      });
    }

    default:
      return { success: false, error: `No handler for action type: ${action.type}` };
  }
}
