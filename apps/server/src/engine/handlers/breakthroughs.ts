/**
 * Thunder's Edge Breakthrough Effect Handlers
 *
 * Implements the effects of all 30 faction breakthroughs.
 * Breakthroughs are unlocked via the expedition mechanic or special conditions.
 */

import type {
  GameState,
  PlayerState,
  HexCoord,
  MapTile,
  PlanetInstance,
  UnitInstance,
  PromissoryNoteInPlay,
  BreachTokenState,
} from '@ti4/shared';
import {
  BREAKTHROUGHS_BY_FACTION,
  BREAKTHROUGHS_BY_ID,
  type BreakthroughDef,
} from '@ti4/shared';
import { initializeFracture } from './fracture.js';

// ============================================================================
// Types
// ============================================================================

export interface BreakthroughEffectContext {
  state: GameState;
  player: PlayerState;
  breakthrough: BreakthroughDef;
  /** Additional context for specific triggers */
  trigger?: BreakthroughTrigger;
  /** Targets for the effect (if applicable) */
  targets?: BreakthroughTargets;
}

export type BreakthroughTrigger =
  | { type: 'action' }
  | { type: 'production'; systemId: string; unitsProduced: number }
  | { type: 'combat_win'; systemId: string; unitsDestroyed: number }
  | { type: 'planet_gained'; planetId: string }
  | { type: 'tech_researched'; techId: string }
  | { type: 'transaction'; targetPlayerId: string }
  | { type: 'status_phase_start' }
  | { type: 'round_end' }
  | { type: 'movement'; systemId: string }
  | { type: 'action_card_discarded'; cardId: string; discardedBy: string }
  | { type: 'secondary_resolved'; strategyCard: number; targetPlayerId: string };

export interface BreakthroughTargets {
  systemId?: string;
  planetId?: string;
  unitIds?: string[];
  techId?: string;
  playerId?: string;
}

export interface HandlerResult {
  success: boolean;
  error?: string;
  triggeredEvents?: string[];
  data?: Record<string, unknown>;
}

// ============================================================================
// Effect Registry
// ============================================================================

type BreakthroughEffectHandler = (context: BreakthroughEffectContext) => HandlerResult;

const BREAKTHROUGH_EFFECTS: Record<string, BreakthroughEffectHandler> = {
  // Base Game Factions
  psychospore: handlePsychospore,
  gravleash_maneuvers: handleGravleashManeuvers,
  deorbit_barrage: handleDeorbitBarrage,
  stellar_genesis: handleStellarGenesis,
  auto_factories: handleAutoFactories,
  bellum_gloriosum: handleBellumGloriosum,
  particle_synthesis: handleParticleSynthesis,
  fealty_uplink: handleFealtyUplink,
  the_tables_grace: handleTheTablesGrace,
  mindsieve: handleMindsieve,
  valefar_assimilator_z: handleValefarAssimilatorZ,
  norr_supremacy: handleNorrSupremacy,
  specialized_compounds: handleSpecializedCompounds,
  imperator: handleImperator,
  archons_gift: handleArchonsGift,
  yin_ascendant: handleYinAscendant,
  deepgloom_executable: handleDeepgloomExecutable,

  // PoK Factions
  wing_transfer: handleWingTransfer,
  void_tether: handleVoidTether,
  vaults_of_the_heir: handleVaultsOfTheHeir,
  absolute_synergy: handleAbsoluteSynergy,
  thunders_paradox: handleThundersParadox,
  slumberstate_computing: handleSlumberstateComputing,
  alraith_ix_ianovar: handleAlRaithIxIanovar,

  // Thunder's Edge Factions
  the_icon: handleTheIcon,
  visionaria_select: handleVisionariaSelect,
  data_skimmer: handleDataSkimmer,
  resonance_generator: handleResonanceGenerator,
  the_sowing: handleTheSowing,
  the_reaping: handleTheReaping,

  // Keleres
  iihq_modernization: handleIihqModernization,
};

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Execute a breakthrough effect
 */
export function executeBreakthroughEffect(context: BreakthroughEffectContext): HandlerResult {
  const { breakthrough, player } = context;

  // Check breakthrough is unlocked
  if (!player.breakthrough?.unlocked) {
    return { success: false, error: 'Breakthrough not unlocked' };
  }

  // Check breakthrough matches
  if (player.breakthrough.breakthroughId !== breakthrough.id) {
    return { success: false, error: 'Breakthrough mismatch' };
  }

  // For exhaustable breakthroughs, check not exhausted
  if (breakthrough.isExhaustable && player.breakthrough.exhausted) {
    return { success: false, error: 'Breakthrough is exhausted' };
  }

  // Get handler
  const handler = BREAKTHROUGH_EFFECTS[breakthrough.id];
  if (!handler) {
    return { success: false, error: `No handler for breakthrough: ${breakthrough.id}` };
  }

  // Execute
  const result = handler(context);

  // If successful and exhaustable, exhaust it
  if (result.success && breakthrough.isExhaustable) {
    player.breakthrough.exhausted = true;
  }

  return result;
}

/**
 * Check if a breakthrough can be triggered by a specific event
 */
export function canTriggerBreakthrough(
  player: PlayerState,
  triggerType: BreakthroughTrigger['type']
): boolean {
  if (!player.breakthrough?.unlocked) {
    return false;
  }

  const breakthrough = BREAKTHROUGHS_BY_ID[player.breakthrough.breakthroughId];
  if (!breakthrough) {
    return false;
  }

  // Check if exhaustable and exhausted
  if (breakthrough.isExhaustable && player.breakthrough.exhausted) {
    return false;
  }

  // Map trigger types to breakthroughs
  const triggerMap: Record<string, string[]> = {
    action: ['deorbit_barrage', 'wing_transfer', 'the_icon'],
    production: ['auto_factories', 'bellum_gloriosum', 'particle_synthesis'],
    combat_win: ['norr_supremacy', 'the_reaping'],
    planet_gained: ['fealty_uplink'],
    tech_researched: ['the_tables_grace', 'specialized_compounds', 'visionaria_select'],
    transaction: ['deepgloom_executable'],
    status_phase_start: ['the_sowing', 'the_reaping'],
    round_end: [],
    movement: ['gravleash_maneuvers', 'resonance_generator'],
    action_card_discarded: ['data_skimmer'],
    secondary_resolved: ['mindsieve'],
  };

  const validBreakthroughs = triggerMap[triggerType] || [];
  return validBreakthroughs.includes(breakthrough.id);
}

// ============================================================================
// Base Game Faction Handlers
// ============================================================================

function handlePsychospore(context: BreakthroughEffectContext): HandlerResult {
  const { state, player, targets } = context;

  if (!targets?.systemId) {
    return { success: false, error: 'Must specify system to remove token from' };
  }

  // Find system with player's infantry
  const tile = state.map.tiles.find((t: MapTile) => t.id === targets.systemId);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  // Check for infantry
  const hasInfantry = tile.planets.some((p: PlanetInstance) =>
    p.units.some((u: UnitInstance) => u.ownerId === player.id && u.type === 'infantry')
  );
  if (!hasInfantry) {
    return { success: false, error: 'No infantry in system' };
  }

  // Check for command token
  if (!tile.commandTokens.includes(player.id)) {
    return { success: false, error: 'No command token in system' };
  }

  // Remove command token
  tile.commandTokens = tile.commandTokens.filter((id: string) => id !== player.id);

  // Return to reinforcements (add to tactics pool)
  player.commandTokens.tactics++;

  // Place 1 infantry in a system with units (simplified - would need target selection)
  // For now, just log the effect
  return {
    success: true,
    triggeredEvents: ['psychospore_used'],
    data: { systemId: targets.systemId },
  };
}

function handleGravleashManeuvers(context: BreakthroughEffectContext): HandlerResult {
  // Passive effect: +1 combat in space combat, ships match highest move value
  // This is checked during combat resolution and movement
  return {
    success: true,
    triggeredEvents: ['gravleash_maneuvers_active'],
    data: { effect: 'combat_bonus_and_movement_match' },
  };
}

function handleDeorbitBarrage(context: BreakthroughEffectContext): HandlerResult {
  const { state, player, targets } = context;

  // ACTION: Spend up to 6 resources, roll dice for hits on ground forces
  if (!targets?.systemId) {
    return { success: false, error: 'Must specify target system' };
  }

  // This would involve resource spending and dice rolling
  // Simplified implementation
  return {
    success: true,
    triggeredEvents: ['deorbit_barrage_fired'],
    data: { targetSystem: targets.systemId },
  };
}

function handleStellarGenesis(context: BreakthroughEffectContext): HandlerResult {
  // Places Avernus token, moved with war suns
  // Passive tracking
  return {
    success: true,
    triggeredEvents: ['stellar_genesis_active'],
    data: { effect: 'avernus_token_placed' },
  };
}

function handleAutoFactories(context: BreakthroughEffectContext): HandlerResult {
  const { player, trigger } = context;

  if (trigger?.type !== 'production') {
    return { success: false, error: 'Auto-Factories triggers on production' };
  }

  // Check if 3+ non-fighter ships produced
  // This would be checked during production
  // Gain 1 command token to fleet pool
  player.commandTokens.fleet++;

  return {
    success: true,
    triggeredEvents: ['auto_factories_triggered'],
    data: { tokenGained: 'fleet' },
  };
}

function handleBellumGloriosum(context: BreakthroughEffectContext): HandlerResult {
  // Passive: Produce ground forces/fighters up to ship capacity without counting toward production
  return {
    success: true,
    triggeredEvents: ['bellum_gloriosum_active'],
    data: { effect: 'free_ground_fighter_production' },
  };
}

function handleParticleSynthesis(context: BreakthroughEffectContext): HandlerResult {
  // Passive: Wormhole systems have PRODUCTION 2, -2 cost when producing there
  return {
    success: true,
    triggeredEvents: ['particle_synthesis_active'],
    data: { effect: 'wormhole_production' },
  };
}

function handleFealtyUplink(context: BreakthroughEffectContext): HandlerResult {
  const { player, trigger } = context;

  if (trigger?.type !== 'planet_gained') {
    return { success: false, error: 'Fealty Uplink triggers on planet gain' };
  }

  // Place infantry equal to planet's influence
  // Would need planet data lookup
  return {
    success: true,
    triggeredEvents: ['fealty_uplink_triggered'],
    data: { planetId: trigger.planetId },
  };
}

function handleTheTablesGrace(context: BreakthroughEffectContext): HandlerResult {
  // Triggers when researching Cruiser II - cruisers move through enemy ships
  return {
    success: true,
    triggeredEvents: ['tables_grace_active'],
    data: { effect: 'cruiser_passthrough' },
  };
}

function handleMindsieve(context: BreakthroughEffectContext): HandlerResult {
  const { trigger } = context;

  if (trigger?.type !== 'secondary_resolved') {
    return { success: false, error: 'Mindsieve triggers on secondary resolution' };
  }

  // Give promissory note to let player resolve secondary without token
  return {
    success: true,
    triggeredEvents: ['mindsieve_offered'],
    data: { targetPlayerId: trigger.targetPlayerId },
  };
}

function handleValefarAssimilatorZ(context: BreakthroughEffectContext): HandlerResult {
  // Nekro special - place Z token instead of gaining tech, flagship gains abilities
  return {
    success: true,
    triggeredEvents: ['valefar_z_placed'],
    data: { effect: 'flagship_ability_gain' },
  };
}

function handleNorrSupremacy(context: BreakthroughEffectContext): HandlerResult {
  const { player, trigger } = context;

  if (trigger?.type !== 'combat_win') {
    return { success: false, error: "N'orr Supremacy triggers on combat win" };
  }

  // Choice: gain command token OR research unit upgrade
  // This would present a choice to the player
  return {
    success: true,
    triggeredEvents: ['norr_supremacy_triggered'],
    data: { choice: 'token_or_tech' },
  };
}

function handleSpecializedCompounds(context: BreakthroughEffectContext): HandlerResult {
  // Passive: Exhaust tech specialty planet instead of matching prerequisite
  return {
    success: true,
    triggeredEvents: ['specialized_compounds_active'],
    data: { effect: 'tech_specialty_as_prereq' },
  };
}

function handleImperator(context: BreakthroughEffectContext): HandlerResult {
  // Passive: Combat bonus per Support for Throne, +1 move after legendary planet
  return {
    success: true,
    triggeredEvents: ['imperator_active'],
    data: { effect: 'support_combat_bonus' },
  };
}

function handleArchonsGift(context: BreakthroughEffectContext): HandlerResult {
  // Passive: Spend influence as resources and vice versa
  return {
    success: true,
    triggeredEvents: ['archons_gift_active'],
    data: { effect: 'resource_influence_swap' },
  };
}

function handleYinAscendant(context: BreakthroughEffectContext): HandlerResult {
  // Gain random unused faction alliance ability on breakthrough gain and objective scoring
  return {
    success: true,
    triggeredEvents: ['yin_ascendant_triggered'],
    data: { effect: 'random_alliance_ability' },
  };
}

function handleDeepgloomExecutable(context: BreakthroughEffectContext): HandlerResult {
  // Share Stall Tactics/Scheming, extra transaction during transactions
  return {
    success: true,
    triggeredEvents: ['deepgloom_executable_active'],
    data: { effect: 'shared_abilities_extra_transaction' },
  };
}

// ============================================================================
// PoK Faction Handlers
// ============================================================================

function handleWingTransfer(context: BreakthroughEffectContext): HandlerResult {
  // ACTION: Place tokens in adjacent systems with only your units, move ships among them
  return {
    success: true,
    triggeredEvents: ['wing_transfer_used'],
    data: { effect: 'ship_redistribution' },
  };
}

function handleVoidTether(context: BreakthroughEffectContext): HandlerResult {
  // Place void tether tokens blocking adjacency
  return {
    success: true,
    triggeredEvents: ['void_tether_placed'],
    data: { effect: 'adjacency_blocked' },
  };
}

function handleVaultsOfTheHeir(context: BreakthroughEffectContext): HandlerResult {
  const { player, targets } = context;

  if (!targets?.techId) {
    return { success: false, error: 'Must specify technology to purge' };
  }

  // Exhaust and purge tech to gain relic
  if (!player.technologies.includes(targets.techId)) {
    return { success: false, error: 'Player does not have that technology' };
  }

  // Remove tech
  player.technologies = player.technologies.filter((t: string) => t !== targets.techId);

  // Gain relic (would draw from relic deck)
  return {
    success: true,
    triggeredEvents: ['vaults_of_heir_used', 'relic_gained'],
    data: { purgedTech: targets.techId },
  };
}

function handleAbsoluteSynergy(context: BreakthroughEffectContext): HandlerResult {
  // Return 3 mechs to place Eidolon Maximum
  return {
    success: true,
    triggeredEvents: ['absolute_synergy_used'],
    data: { effect: 'eidolon_maximum_placed' },
  };
}

function handleThundersParadox(context: BreakthroughEffectContext): HandlerResult {
  // Exhaust this and 1 agent to ready any other agent
  return {
    success: true,
    triggeredEvents: ['thunders_paradox_used'],
    data: { effect: 'agent_readied' },
  };
}

function handleSlumberstateComputing(context: BreakthroughEffectContext): HandlerResult {
  // Choose coexistence instead of ground combat, draw cards from coexisting
  return {
    success: true,
    triggeredEvents: ['slumberstate_computing_active'],
    data: { effect: 'coexistence_option' },
  };
}

function handleAlRaithIxIanovar(context: BreakthroughEffectContext): HandlerResult {
  const { state, player } = context;

  // Activate The Fracture, place ingress token
  if (!state.fractureState) {
    state.fractureState = initializeFracture();
  }
  state.fractureState.isActive = true;

  return {
    success: true,
    triggeredEvents: ['fracture_activated', 'ingress_token_placed'],
    data: { playerId: player.id },
  };
}

// ============================================================================
// Thunder's Edge Faction Handlers
// ============================================================================

function handleTheIcon(context: BreakthroughEffectContext): HandlerResult {
  // Exhaust to place produced units in systems with tokens
  return {
    success: true,
    triggeredEvents: ['the_icon_used'],
    data: { effect: 'remote_unit_placement' },
  };
}

function handleVisionariaSelect(context: BreakthroughEffectContext): HandlerResult {
  const { player, trigger } = context;

  if (trigger?.type !== 'tech_researched') {
    return { success: false, error: 'Visionaria Select triggers on tech research' };
  }

  // Other players must spend 1 TG to research tech
  // When they do, Deepwrought also gains that tech
  if (!player.technologies.includes(trigger.techId)) {
    player.technologies.push(trigger.techId);
  }

  return {
    success: true,
    triggeredEvents: ['visionaria_select_triggered'],
    data: { techGained: trigger.techId },
  };
}

function handleDataSkimmer(context: BreakthroughEffectContext): HandlerResult {
  const { player, trigger } = context;

  if (trigger?.type !== 'action_card_discarded') {
    return { success: false, error: 'Data Skimmer triggers on action card discard' };
  }

  // Collect discarded action card on this breakthrough
  if (!player.breakthrough?.collectedCards) {
    player.breakthrough!.collectedCards = [];
  }
  player.breakthrough!.collectedCards.push(trigger.cardId);

  return {
    success: true,
    triggeredEvents: ['data_skimmer_collected'],
    data: { cardCollected: trigger.cardId },
  };
}

function handleResonanceGenerator(context: BreakthroughEffectContext): HandlerResult {
  // Ships have +1 movement from home/breach systems
  // Exhaust to flip/place breach token
  return {
    success: true,
    triggeredEvents: ['resonance_generator_used'],
    data: { effect: 'breach_token_manipulation' },
  };
}

function handleTheSowing(context: BreakthroughEffectContext): HandlerResult {
  const { player, trigger } = context;

  if (trigger?.type !== 'status_phase_start') {
    return { success: false, error: 'The Sowing triggers at status phase start' };
  }

  // Place 1 trade good on this card
  if (!player.breakthrough?.tradeGoodsOnCard) {
    player.breakthrough!.tradeGoodsOnCard = 0;
  }
  player.breakthrough!.tradeGoodsOnCard++;

  return {
    success: true,
    triggeredEvents: ['the_sowing_accumulated'],
    data: { tradeGoodsOnCard: player.breakthrough!.tradeGoodsOnCard },
  };
}

function handleTheReaping(context: BreakthroughEffectContext): HandlerResult {
  const { player, trigger } = context;

  if (trigger?.type === 'combat_win') {
    // Gain 1 TG per unit destroyed
    const tgGained = trigger.unitsDestroyed || 0;
    player.tradeGoods += tgGained;
    return {
      success: true,
      triggeredEvents: ['the_reaping_combat'],
      data: { tradeGoodsGained: tgGained },
    };
  }

  if (trigger?.type === 'status_phase_start') {
    // Double TG on card, then gain them
    const onCard = player.breakthrough?.tradeGoodsOnCard || 0;
    const doubled = onCard * 2;
    player.tradeGoods += doubled;
    player.breakthrough!.tradeGoodsOnCard = 0;
    return {
      success: true,
      triggeredEvents: ['the_reaping_harvest'],
      data: { tradeGoodsGained: doubled },
    };
  }

  return { success: false, error: 'Invalid trigger for The Reaping' };
}

function handleIihqModernization(context: BreakthroughEffectContext): HandlerResult {
  // Gain Custodia Vigilia planet, neighbors with all in Mecatol area
  return {
    success: true,
    triggeredEvents: ['iihq_modernization_active'],
    data: { effect: 'custodia_vigilia_gained' },
  };
}

// ============================================================================
// Combat Modifier Helpers
// ============================================================================

/**
 * Get combat bonus from active breakthroughs
 */
export function getBreakthroughCombatBonus(
  player: PlayerState,
  combatType: 'space' | 'ground'
): number {
  if (!player.breakthrough?.unlocked) {
    return 0;
  }

  const breakthroughId = player.breakthrough.breakthroughId;

  // Gravleash Maneuvers: +1 in space combat
  if (breakthroughId === 'gravleash_maneuvers' && combatType === 'space') {
    return 1;
  }

  // Imperator: +1 per Support for Throne
  if (breakthroughId === 'imperator') {
    const supportCount = player.promissoryNotesInPlay.filter(
      (pn: PromissoryNoteInPlay) => pn.noteId.includes('support_for_the_throne')
    ).length;
    return supportCount;
  }

  return 0;
}

/**
 * Get movement bonus from active breakthroughs
 */
export function getBreakthroughMovementBonus(
  player: PlayerState,
  fromSystemId: string,
  state: GameState
): number {
  if (!player.breakthrough?.unlocked) {
    return 0;
  }

  const breakthroughId = player.breakthrough.breakthroughId;

  // Resonance Generator: +1 from home system or breach system
  if (breakthroughId === 'resonance_generator') {
    // Check if from home system
    const fromTile = state.map.tiles.find((t: MapTile) => t.id === fromSystemId);
    if (fromTile?.systemId === player.homeSystemId) {
      return 1;
    }
    // Check if from breach system
    const hasBreach = state.breachTokens?.some(
      (bt: BreachTokenState) => bt.systemId === fromSystemId && bt.active
    );
    if (hasBreach) {
      return 1;
    }
  }

  // Al'Raith Ix Ianovar: +1 in The Fracture
  if (breakthroughId === 'alraith_ix_ianovar') {
    // Would check if system is in The Fracture
  }

  return 0;
}
