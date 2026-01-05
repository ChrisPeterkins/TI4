/**
 * Base Game Faction Ability Handlers
 *
 * Implements all triggered and action abilities for the 16 base game factions.
 * Passive abilities (combat modifiers, fleet limits, etc.) are handled in the
 * modifier files instead.
 */

import type { GameState, UnitType, HexCoord } from '@ti4/shared';
import type { AbilityHandler, AbilityContext, AbilityResult } from '../../ability-types.js';
import { registerAbilityHandler } from '../../ability-registry.js';
import { findTileAtPosition } from '../../../utils/hex.js';

// =============================================================================
// ARBOREC
// =============================================================================

/**
 * MITOSIS (Arborec)
 * At the start of the status phase, you may place 1 infantry from your
 * reinforcements on any planet you control that contains 1 of your infantry.
 *
 * LETANI BEHEMOTH (Mech Enhancement)
 * When you use your MITOSIS faction ability, you may replace 1 of your
 * infantry on the game board with 1 mech from your reinforcements instead.
 */
const arborecMitosis: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'arborec') {
    return { success: false, error: 'Not Arborec player' };
  }

  // Requires player to choose a planet
  const targetPlanetId = context.choices?.selectedPlanetId;
  if (!targetPlanetId) {
    return { success: false, error: 'Must select a planet with your infantry' };
  }

  // Check if player chose to place a mech instead (Letani Behemoth enhancement)
  const placeMech = context.choices?.selectedUnitType === 'mech';

  // Find the planet and verify it has Arborec infantry
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets || []) {
      if (planet.id === targetPlanetId) {
        const arborecInfantry = tile.units.filter(
          u => u.ownerId === playerId && u.type === 'infantry' && u.planetId === targetPlanetId
        );

        if (arborecInfantry.length === 0) {
          return { success: false, error: 'Selected planet must have your infantry' };
        }

        if (placeMech) {
          // Letani Behemoth: Replace 1 infantry with 1 mech
          // Check mech limit (max 4 mechs)
          const mechCount = countPlayerMechs(state, playerId);
          if (mechCount >= 4) {
            return { success: false, error: 'Maximum mech limit reached (4)' };
          }

          // Remove one infantry
          const infantryToReplace = arborecInfantry[0];
          const infantryIndex = tile.units.findIndex(u => u.id === infantryToReplace.id);
          if (infantryIndex !== -1) {
            tile.units.splice(infantryIndex, 1);
          }

          // Place the mech
          tile.units.push({
            id: `mech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'mech',
            ownerId: playerId,
            planetId: targetPlanetId,
            damaged: false,
          });

          return {
            success: true,
            stateModified: true,
            triggeredEvents: ['unit_placed', 'unit_removed'],
            data: { unitType: 'mech', planetId: targetPlanetId, replacedInfantry: true },
          };
        } else {
          // Standard Mitosis: Place 1 infantry
          tile.units.push({
            id: `infantry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'infantry',
            ownerId: playerId,
            planetId: targetPlanetId,
            damaged: false,
          });

          return {
            success: true,
            stateModified: true,
            triggeredEvents: ['unit_placed'],
            data: { unitType: 'infantry', planetId: targetPlanetId },
          };
        }
      }
    }
  }

  return { success: false, error: 'Planet not found' };
};

/**
 * Helper: Count player's mechs on the board
 */
function countPlayerMechs(state: GameState, playerId: string): number {
  let count = 0;
  for (const tile of state.map.tiles) {
    count += tile.units.filter(u => u.ownerId === playerId && u.type === 'mech').length;
  }
  return count;
}

// =============================================================================
// MENTAK COALITION
// =============================================================================

/**
 * AMBUSH (Mentak)
 * At the start of a space combat, you may roll 1 die for up to 2 of your
 * cruisers or destroyers. For each hit, your opponent must destroy 1 of their
 * non-fighter ships.
 */
const mentakAmbush: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'mentak') {
    return { success: false, error: 'Not Mentak player' };
  }

  const combat = state.activeCombat;
  if (!combat || combat.type !== 'space') {
    return { success: false, error: 'Not in space combat' };
  }

  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) {
    return { success: false, error: 'Combat system not found' };
  }

  // Get Mentak cruisers and destroyers in the system
  const ambushUnits = tile.units.filter(
    u => u.ownerId === playerId && (u.type === 'cruiser' || u.type === 'destroyer')
  );

  // Can use up to 2 units
  const unitsToUse = Math.min(2, ambushUnits.length);
  if (unitsToUse === 0) {
    return { success: false, error: 'No cruisers or destroyers for ambush' };
  }

  // Roll dice
  const rolls: number[] = [];
  let hits = 0;
  for (let i = 0; i < unitsToUse; i++) {
    const roll = Math.floor(Math.random() * 10) + 1;
    rolls.push(roll);
    // Cruisers hit on 7, destroyers hit on 9, but ambush uses ship's combat value
    const unit = ambushUnits[i];
    const hitValue = unit.type === 'cruiser' ? 7 : 9;
    if (roll >= hitValue) {
      hits++;
    }
  }

  return {
    success: true,
    stateModified: false,
    triggeredEvents: ['ambush_rolled'],
    data: {
      rolls,
      hits,
      unitsUsed: unitsToUse,
      // Hits need to be assigned by opponent to non-fighters
      pendingHits: hits,
    },
  };
};

/**
 * PILLAGE (Mentak)
 * After your neighbor gains trade goods, you may take 1 of those trade goods.
 */
const mentakPillage: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'mentak') {
    return { success: false, error: 'Not Mentak player' };
  }

  const targetPlayerId = context.targetPlayerId;
  if (!targetPlayerId) {
    return { success: false, error: 'No target player specified' };
  }

  // Check if target is a neighbor
  if (!player.neighbors.includes(targetPlayerId)) {
    return { success: false, error: 'Target is not a neighbor' };
  }

  const targetPlayer = state.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { success: false, error: 'Target player not found' };
  }

  // PROMISE OF PROTECTION CHECK
  // "While this card is in your play area, the Mentak player cannot use their
  // PILLAGE faction ability against you."
  const hasPromiseOfProtection = targetPlayer.promissoryNotesInPlay.some(
    note => note.noteId === 'promise_of_protection' && note.originalOwnerId === playerId
  );
  if (hasPromiseOfProtection) {
    return { success: false, error: 'Target has Promise of Protection - cannot Pillage' };
  }

  // Check target has trade goods to steal
  if (targetPlayer.tradeGoods < 1) {
    return { success: false, error: 'Target has no trade goods' };
  }

  // Steal 1 trade good
  targetPlayer.tradeGoods -= 1;
  player.tradeGoods += 1;

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['pillage_triggered'],
    data: { stolenFrom: targetPlayerId, amount: 1 },
  };
};

// =============================================================================
// FEDERATION OF SOL
// =============================================================================

/**
 * ORBITAL DROP (Sol)
 * Action: Spend 1 token from your tactics pool to place 2 infantry from your
 * reinforcements on 1 planet you control.
 */
const solOrbitalDrop: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'sol') {
    return { success: false, error: 'Not Sol player' };
  }

  // Check for tactics token
  if (player.commandTokens.tactics < 1) {
    return { success: false, error: 'No tactics tokens available' };
  }

  // Requires player to choose a planet
  const targetPlanetId = context.choices?.selectedPlanetId;
  if (!targetPlanetId) {
    return { success: false, error: 'Must select a planet you control' };
  }

  // Verify player controls the planet
  const controlsPlanet = player.planets.some(p => p.planetId === targetPlanetId);
  if (!controlsPlanet) {
    return { success: false, error: 'You do not control this planet' };
  }

  // Find the tile containing the planet
  for (const tile of state.map.tiles) {
    const planet = tile.planets?.find(p => p.id === targetPlanetId);
    if (planet) {
      // Spend the token
      player.commandTokens.tactics -= 1;

      // Place 2 infantry
      for (let i = 0; i < 2; i++) {
        tile.units.push({
          id: `infantry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
          type: 'infantry',
          ownerId: playerId,
          planetId: targetPlanetId,
          damaged: false,
        });
      }

      return {
        success: true,
        stateModified: true,
        triggeredEvents: ['orbital_drop', 'unit_placed'],
        data: { planetId: targetPlanetId, unitsPlaced: 2 },
      };
    }
  }

  return { success: false, error: 'Planet not found' };
};

// =============================================================================
// NAALU COLLECTIVE
// =============================================================================

/**
 * TELEPATHY (Naalu)
 * At the end of the strategy phase, place the Naalu "0" token on your
 * strategy card. You are first in initiative order.
 *
 * Note: This is handled automatically - Naalu always has initiative 0.
 * This handler is for manual triggering if needed.
 */
const naaluTelepathy: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'naalu') {
    return { success: false, error: 'Not Naalu player' };
  }

  // Naalu's initiative is always treated as 0
  // This is typically handled in the initiative calculation
  return {
    success: true,
    stateModified: false,
    data: { initiative: 0 },
  };
};

/**
 * FORESIGHT (Naalu)
 * After another player moves ships into a system that contains 1 or more of
 * your ships, you may place 1 token from your strategy pool into an adjacent system.
 * Your ships in the active system may move to that system.
 */
const naaluForesight: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'naalu') {
    return { success: false, error: 'Not Naalu player' };
  }

  if (player.commandTokens.strategy < 1) {
    return { success: false, error: 'No strategy tokens available' };
  }

  const retreatSystem = context.choices?.selectedSystem;
  if (!retreatSystem) {
    return { success: false, error: 'Must select a retreat system' };
  }

  // This is a complex ability - simplified implementation
  // Full implementation would need to validate adjacency and move ships
  player.commandTokens.strategy -= 1;

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['foresight_triggered'],
    data: { retreatSystem },
  };
};

// =============================================================================
// L1Z1X MINDNET
// =============================================================================

/**
 * ASSIMILATE (L1Z1X)
 * When you gain control of a planet, you may place 1 PDS or 1 space dock
 * from your reinforcements on that planet.
 */
const l1z1xAssimilate: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'l1z1x') {
    return { success: false, error: 'Not L1Z1X player' };
  }

  const targetPlanetId = context.targetPlanetId;
  if (!targetPlanetId) {
    return { success: false, error: 'No planet specified' };
  }

  const unitType = context.choices?.selectedUnitType;
  if (unitType !== 'pds' && unitType !== 'space_dock') {
    return { success: false, error: 'Must choose PDS or Space Dock' };
  }

  // Find the tile containing the planet
  for (const tile of state.map.tiles) {
    const planet = tile.planets?.find(p => p.id === targetPlanetId);
    if (planet) {
      // Place the structure
      tile.units.push({
        id: `${unitType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: unitType,
        ownerId: playerId,
        planetId: targetPlanetId,
        damaged: false,
      });

      return {
        success: true,
        stateModified: true,
        triggeredEvents: ['assimilate_triggered', 'unit_placed'],
        data: { unitType, planetId: targetPlanetId },
      };
    }
  }

  return { success: false, error: 'Planet not found' };
};

/**
 * HARROW (L1Z1X)
 * At the end of each round of ground combat, your opponent must destroy 1
 * of their infantry on the planet for each of your dreadnoughts in the system.
 */
const l1z1xHarrow: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'l1z1x') {
    return { success: false, error: 'Not L1Z1X player' };
  }

  const combat = state.activeCombat;
  if (!combat || combat.type !== 'ground') {
    return { success: false, error: 'Not in ground combat' };
  }

  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) {
    return { success: false, error: 'Combat system not found' };
  }

  // Count L1Z1X dreadnoughts in the system
  const dreadnoughtCount = tile.units.filter(
    u => u.ownerId === playerId && u.type === 'dreadnought'
  ).length;

  if (dreadnoughtCount === 0) {
    return { success: true, data: { hits: 0 } };
  }

  return {
    success: true,
    triggeredEvents: ['harrow_triggered'],
    data: {
      dreadnoughtCount,
      pendingHits: dreadnoughtCount,
      // These hits must be assigned to opponent infantry
    },
  };
};

// =============================================================================
// EMIRATES OF HACAN
// =============================================================================

/**
 * MASTERS OF TRADE (Hacan)
 * You do not have to be neighbors with a player to trade with them.
 *
 * Note: This is typically checked in the transaction validation logic.
 */
const hacanMastersOfTrade: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'hacan') {
    return { success: false, error: 'Not Hacan player' };
  }

  // This is a passive ability checked during transaction validation
  return {
    success: true,
    data: { canTradeWithNonNeighbors: true },
  };
};

/**
 * GUILD SHIPS (Hacan)
 * Your trade agreements are worth 1 additional trade good.
 */
const hacanGuildShips: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'hacan') {
    return { success: false, error: 'Not Hacan player' };
  }

  // This modifies commodity value during refresh
  return {
    success: true,
    data: { tradeAgreementBonus: 1 },
  };
};

// =============================================================================
// YSSARIL TRIBES
// =============================================================================

/**
 * STALL TACTICS (Yssaril)
 * Action: Discard 1 action card from your hand to pass.
 */
const yssarilStallTactics: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'yssaril') {
    return { success: false, error: 'Not Yssaril player' };
  }

  if (player.actionCards.length === 0) {
    return { success: false, error: 'No action cards to discard' };
  }

  // Discard an action card
  const cardId = player.actionCards[0]; // Or use context.choices to pick
  player.actionCards = player.actionCards.filter(c => c !== cardId);
  state.actionCardDiscard.push(cardId);

  // Mark as passed but not truly passed - can act again
  // This is a special "stall" pass

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['stall_tactics_used'],
    data: { discardedCard: cardId },
  };
};

/**
 * SCHEMING (Yssaril)
 * When you draw 1 or more action cards, draw 1 additional action card.
 * Then, choose 1 action card from your hand and return it to the deck.
 */
const yssarilScheming: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'yssaril') {
    return { success: false, error: 'Not Yssaril player' };
  }

  // Draw 1 additional card
  if (state.actionCardDeck.length > 0) {
    const drawnCard = state.actionCardDeck.shift()!;
    player.actionCards.push(drawnCard);
  }

  // Player must return 1 card - this would need UI interaction
  // For now, just mark that the ability triggered
  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['scheming_triggered'],
    data: { requiresReturn: true },
  };
};

// =============================================================================
// CLAN OF SAAR
// =============================================================================

/**
 * SCAVENGE (Saar)
 * After you gain control of a planet, gain 1 trade good.
 */
const saarScavenge: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'saar') {
    return { success: false, error: 'Not Saar player' };
  }

  player.tradeGoods += 1;

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['scavenge_triggered'],
    data: { tradeGoodsGained: 1 },
  };
};

// =============================================================================
// BARONY OF LETNEV
// =============================================================================

/**
 * MUNITIONS RESERVES (Letnev)
 * At the start of each round of combat, you may spend 2 trade goods;
 * you may reroll any number of your dice during that combat round.
 */
const letnevMunitionsReserves: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'letnev') {
    return { success: false, error: 'Not Letnev player' };
  }

  if (player.tradeGoods < 2) {
    return { success: false, error: 'Need 2 trade goods' };
  }

  player.tradeGoods -= 2;

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['munitions_reserves_activated'],
    data: { canRerollAll: true },
  };
};

// =============================================================================
// YIN BROTHERHOOD
// =============================================================================

/**
 * INDOCTRINATION (Yin)
 * At the start of ground combat, you may spend 2 influence to replace 1 of
 * your opponent's infantry with 1 of your infantry from your reinforcements.
 */
const yinIndoctrination: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'yin') {
    return { success: false, error: 'Not Yin player' };
  }

  const combat = state.activeCombat;
  if (!combat || combat.type !== 'ground') {
    return { success: false, error: 'Not in ground combat' };
  }

  // Calculate available influence
  const availableInfluence = player.planets
    .filter(p => !p.exhausted)
    .reduce((sum, p) => sum + 2, 0); // Simplified - would need actual influence values

  if (availableInfluence < 2) {
    return { success: false, error: 'Not enough influence' };
  }

  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) {
    return { success: false, error: 'Combat system not found' };
  }

  const opponentId = combat.attackerId === playerId ? combat.defenderId : combat.attackerId;
  const opponentInfantry = tile.units.find(
    u => u.ownerId === opponentId && u.type === 'infantry'
  );

  if (!opponentInfantry) {
    return { success: false, error: 'No opponent infantry to indoctrinate' };
  }

  // Replace opponent infantry with Yin infantry
  opponentInfantry.ownerId = playerId;

  // Check if opponent has Greyfire Mutagen in play
  // "After the Yin player uses their INDOCTRINATION faction ability:
  // Gain the infantry unit that was replaced."
  const opponent = state.players.find(p => p.id === opponentId);
  let greyfireMutagenTriggered = false;

  if (opponent) {
    const greyfireMutagenIndex = opponent.promissoryNotesInPlay.findIndex(
      note => note.noteId === 'greyfire_mutagen'
    );

    if (greyfireMutagenIndex !== -1) {
      // Give the opponent a new infantry unit on the combat planet
      const planet = tile.planets.find(p => p.planetId === combat.planetId);
      if (planet) {
        planet.units.push({
          id: `infantry-gm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'infantry',
          ownerId: opponentId,
          damaged: false,
        });
        greyfireMutagenTriggered = true;

        // Return Greyfire Mutagen to Yin player
        opponent.promissoryNotesInPlay.splice(greyfireMutagenIndex, 1);
        player.promissoryNotesInHand.push('greyfire_mutagen');
      }
    }
  }

  const triggeredEvents: string[] = ['indoctrination_triggered'];
  if (greyfireMutagenTriggered) {
    triggeredEvents.push('greyfire_mutagen_triggered');
  }

  return {
    success: true,
    stateModified: true,
    triggeredEvents,
    data: {
      convertedUnitId: opponentInfantry.id,
      greyfireMutagenTriggered,
    },
  };
};

/**
 * DEVOTION (Yin)
 * After each round of combat, you may destroy 1 of your cruisers or
 * destroyers in that system to produce 1 hit.
 */
const yinDevotion: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'yin') {
    return { success: false, error: 'Not Yin player' };
  }

  const combat = state.activeCombat;
  if (!combat) {
    return { success: false, error: 'Not in combat' };
  }

  const tile = state.map.tiles.find(t => t.id === combat.systemId);
  if (!tile) {
    return { success: false, error: 'Combat system not found' };
  }

  const sacrificeUnit = tile.units.find(
    u => u.ownerId === playerId && (u.type === 'cruiser' || u.type === 'destroyer')
  );

  if (!sacrificeUnit) {
    return { success: false, error: 'No cruiser or destroyer to sacrifice' };
  }

  // Remove the unit
  tile.units = tile.units.filter(u => u.id !== sacrificeUnit.id);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['devotion_triggered'],
    data: {
      sacrificedUnit: sacrificeUnit.id,
      sacrificedType: sacrificeUnit.type,
      hitsProduced: 1,
    },
  };
};

// =============================================================================
// NEKRO VIRUS
// =============================================================================

/**
 * TECHNOLOGICAL SINGULARITY (Nekro)
 * Once per combat, after 1 of your opponent's units is destroyed, you may
 * copy 1 technology that opponent owns.
 */
const nekroTechSingularity: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'nekro') {
    return { success: false, error: 'Not Nekro player' };
  }

  const targetPlayerId = context.targetPlayerId;
  const techId = context.choices?.selectedTechId;

  if (!targetPlayerId || !techId) {
    return { success: false, error: 'Must specify opponent and technology' };
  }

  const targetPlayer = state.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) {
    return { success: false, error: 'Target player not found' };
  }

  // Check opponent has the tech
  if (!targetPlayer.technologies.includes(techId)) {
    return { success: false, error: 'Opponent does not have this technology' };
  }

  // Check Nekro doesn't already have it
  if (player.technologies.includes(techId)) {
    return { success: false, error: 'You already have this technology' };
  }

  // Copy the tech
  player.technologies.push(techId);

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['tech_copied'],
    data: { copiedTech: techId, from: targetPlayerId },
  };
};

// =============================================================================
// XXCHA KINGDOM
// =============================================================================

/**
 * QUASH (Xxcha)
 * When an agenda is revealed, you may spend 1 token from your strategy pool
 * to discard that agenda and reveal another.
 */
const xxchaQuash: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'xxcha') {
    return { success: false, error: 'Not Xxcha player' };
  }

  if (player.commandTokens.strategy < 1) {
    return { success: false, error: 'No strategy tokens available' };
  }

  if (!state.agendaPhase?.currentAgendaId) {
    return { success: false, error: 'No agenda to quash' };
  }

  const quashedAgenda = state.agendaPhase.currentAgendaId;

  // Spend the token
  player.commandTokens.strategy -= 1;

  // Discard current agenda
  state.agendaDiscard.push(quashedAgenda);

  // Draw new agenda
  if (state.agendaDeck.length > 0) {
    state.agendaPhase.currentAgendaId = state.agendaDeck.shift()!;
  } else {
    state.agendaPhase.currentAgendaId = null;
  }

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['agenda_quashed'],
    data: { quashedAgenda, newAgenda: state.agendaPhase.currentAgendaId },
  };
};

/**
 * PEACE ACCORDS (Xxcha)
 * After you resolve the primary or secondary ability of the "Diplomacy" strategy card,
 * you may gain control of 1 planet other than Mecatol Rex that does not contain any
 * units and is in a system that is adjacent to a planet you control.
 */
const xxchaPeaceAccords: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'xxcha') {
    return { success: false, error: 'Not Xxcha player' };
  }

  // Get target planet from choices
  const targetPlanetId = context.choices?.selectedPlanetId;
  if (!targetPlanetId) {
    // Return valid planets for selection
    const validPlanets = getValidPeaceAccordsPlanets(state, playerId);
    if (validPlanets.length === 0) {
      return { success: false, error: 'No valid planets to claim' };
    }
    return {
      success: false,
      error: 'Must select a planet to claim',
      data: { validPlanets },
    };
  }

  // Validate the target planet
  const validPlanets = getValidPeaceAccordsPlanets(state, playerId);
  if (!validPlanets.includes(targetPlanetId)) {
    return { success: false, error: 'Invalid planet selection' };
  }

  // Find and claim the planet
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.planetId === targetPlanetId) {
        // Transfer control
        const previousOwner = planet.controlledBy;
        planet.controlledBy = playerId;
        planet.exhausted = true; // Planets are gained exhausted

        // Update player's planet list
        player.planets.push({
          planetId: targetPlanetId,
          exhausted: true,
          attachments: [],
        });

        // Remove from previous owner if any
        if (previousOwner) {
          const prevPlayer = state.players.find(p => p.id === previousOwner);
          if (prevPlayer) {
            const idx = prevPlayer.planets.findIndex(p => p.planetId === targetPlanetId);
            if (idx !== -1) {
              prevPlayer.planets.splice(idx, 1);
            }
          }
        }

        return {
          success: true,
          stateModified: true,
          triggeredEvents: ['peace_accords_claimed'],
          data: { planetId: targetPlanetId, previousOwner },
        };
      }
    }
  }

  return { success: false, error: 'Planet not found' };
};

/**
 * Helper: Get valid planets for Peace Accords
 * - Not Mecatol Rex
 * - Contains no units (from any player)
 * - Is in a system adjacent to a planet the player controls
 */
function getValidPeaceAccordsPlanets(state: GameState, playerId: string): string[] {
  const validPlanets: string[] = [];

  // Get all systems where player controls at least one planet
  const controlledSystemPositions = new Set<string>();
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.controlledBy === playerId) {
        controlledSystemPositions.add(`${tile.position.q},${tile.position.r}`);
      }
    }
  }

  // Find adjacent systems with empty planets
  for (const tile of state.map.tiles) {
    const tileKey = `${tile.position.q},${tile.position.r}`;

    // Check if this tile is adjacent to any controlled system
    let isAdjacent = false;
    for (const controlledKey of controlledSystemPositions) {
      const [q, r] = controlledKey.split(',').map(Number);
      const controlledPos: HexCoord = { q, r };
      if (areHexAdjacent(tile.position, controlledPos)) {
        isAdjacent = true;
        break;
      }
    }

    if (!isAdjacent) continue;

    // Check each planet in this adjacent system
    for (const planet of tile.planets) {
      // Skip Mecatol Rex
      if (planet.planetId === 'mecatol_rex') continue;

      // Skip if planet has any units
      if (planet.units && planet.units.length > 0) continue;

      // Skip if it's the player's own planet
      if (planet.controlledBy === playerId) continue;

      validPlanets.push(planet.planetId);
    }
  }

  return validPlanets;
}

/**
 * Helper: Check if two hex positions are adjacent
 */
function areHexAdjacent(a: HexCoord, b: HexCoord): boolean {
  const dq = Math.abs(a.q - b.q);
  const dr = Math.abs(a.r - b.r);
  const ds = Math.abs((-a.q - a.r) - (-b.q - b.r)); // s = -q - r in cube coords

  // Two hexes are adjacent if the sum of absolute differences is 2
  // and each individual difference is at most 1
  return (dq <= 1 && dr <= 1 && ds <= 1) && (dq + dr + ds === 2);
}

// =============================================================================
// WINNU
// =============================================================================

/**
 * BLOOD TIES (Winnu)
 * You do not have to spend influence to remove the Custodians token from
 * Mecatol Rex.
 *
 * Note: This is checked when landing on Mecatol Rex.
 */
const winnuBloodTies: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'winnu') {
    return { success: false, error: 'Not Winnu player' };
  }

  return {
    success: true,
    data: { custodiansCostZero: true },
  };
};

/**
 * RECLAMATION (Winnu)
 * After you resolve a tactical action during which you gained control of
 * Mecatol Rex, you may place 1 PDS and 1 space dock on Mecatol Rex.
 */
const winnuReclamation: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'winnu') {
    return { success: false, error: 'Not Winnu player' };
  }

  // Find Mecatol Rex tile
  const mecatolTile = state.map.tiles.find(t =>
    t.planets?.some(p => p.id === 'mecatol_rex')
  );

  if (!mecatolTile) {
    return { success: false, error: 'Mecatol Rex not found' };
  }

  // Check Winnu controls Mecatol Rex
  const controlsMecatol = player.planets.some(p => p.planetId === 'mecatol_rex');
  if (!controlsMecatol) {
    return { success: false, error: 'You do not control Mecatol Rex' };
  }

  // Place PDS
  mecatolTile.units.push({
    id: `pds-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'pds',
    ownerId: playerId,
    planetId: 'mecatol_rex',
    damaged: false,
  });

  // Place Space Dock
  mecatolTile.units.push({
    id: `space_dock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'space_dock',
    ownerId: playerId,
    planetId: 'mecatol_rex',
    damaged: false,
  });

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['reclamation_triggered'],
    data: { unitsPlaced: ['pds', 'space_dock'] },
  };
};

// =============================================================================
// UNIVERSITIES OF JOL-NAR
// =============================================================================

/**
 * BRILLIANT (Jol-Nar)
 * When you spend a command token to resolve the secondary ability of the
 * Technology strategy card, you may resolve the secondary ability a second time.
 */
const jolnarBrilliant: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'jolnar') {
    return { success: false, error: 'Not Jol-Nar player' };
  }

  // This grants an additional technology secondary resolution
  return {
    success: true,
    data: { additionalTechSecondary: true },
  };
};

/**
 * ANALYTICAL (Jol-Nar)
 * When you research a technology that is not a unit upgrade, you may ignore
 * 1 prerequisite.
 */
const jolnarAnalytical: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'jolnar') {
    return { success: false, error: 'Not Jol-Nar player' };
  }

  // This is applied during technology research validation
  return {
    success: true,
    data: { ignorePrerequisites: 1 },
  };
};

// =============================================================================
// GHOSTS OF CREUSS
// =============================================================================

/**
 * QUANTUM ENTANGLEMENT (Creuss)
 * Your ships can move through, but not into, systems that contain other
 * players' ships. (Creuss also treats alpha/beta wormholes as adjacent.)
 */
const creussQuantumEntanglement: AbilityHandler = (
  state: GameState,
  playerId: string,
  _context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'creuss') {
    return { success: false, error: 'Not Creuss player' };
  }

  // This is a passive ability applied during movement validation
  return {
    success: true,
    data: {
      canMoveThroughEnemies: true,
      wormholesAdjacent: true,
    },
  };
};

// =============================================================================
// EMBERS OF MUAAT
// =============================================================================

/**
 * STAR FORGE (Muaat)
 * Action: Spend 1 token from your strategy pool to place either 2 fighters
 * or 1 destroyer from your reinforcements in a system that contains 1 or
 * more of your war suns.
 */
const muaatStarForge: AbilityHandler = (
  state: GameState,
  playerId: string,
  context: AbilityContext
): AbilityResult => {
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.faction !== 'muaat') {
    return { success: false, error: 'Not Muaat player' };
  }

  if (player.commandTokens.strategy < 1) {
    return { success: false, error: 'No strategy tokens available' };
  }

  const targetSystem = context.choices?.selectedSystem;
  if (!targetSystem) {
    return { success: false, error: 'Must select a system with your War Sun' };
  }

  const tile = findTileAtPosition(state.map, targetSystem);
  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  // Check for War Sun
  const hasWarSun = tile.units.some(
    u => u.ownerId === playerId && u.type === 'war_sun'
  );
  if (!hasWarSun) {
    return { success: false, error: 'No War Sun in this system' };
  }

  // Spend the token
  player.commandTokens.strategy -= 1;

  // Choose: 2 fighters or 1 destroyer (default to 2 fighters)
  const choice = context.choices?.selectedUnitType || 'fighter';

  if (choice === 'fighter') {
    for (let i = 0; i < 2; i++) {
      tile.units.push({
        id: `fighter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
        type: 'fighter',
        ownerId: playerId,
        damaged: false,
      });
    }
  } else {
    tile.units.push({
      id: `destroyer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'destroyer',
      ownerId: playerId,
      damaged: false,
    });
  }

  return {
    success: true,
    stateModified: true,
    triggeredEvents: ['star_forge_used'],
    data: { systemId: tile.id, unitsPlaced: choice === 'fighter' ? 2 : 1 },
  };
};

// =============================================================================
// REGISTER ALL HANDLERS
// =============================================================================

export function registerBaseGameFactionAbilities(): void {
  // Arborec
  registerAbilityHandler('arborec_mitosis', arborecMitosis);

  // Mentak
  registerAbilityHandler('mentak_ambush', mentakAmbush);
  registerAbilityHandler('mentak_pillage', mentakPillage);

  // Sol
  registerAbilityHandler('sol_orbital_drop', solOrbitalDrop);

  // Naalu
  registerAbilityHandler('naalu_telepathy', naaluTelepathy);
  registerAbilityHandler('naalu_foresight', naaluForesight);

  // L1Z1X
  registerAbilityHandler('l1z1x_assimilate', l1z1xAssimilate);
  registerAbilityHandler('l1z1x_harrow', l1z1xHarrow);

  // Hacan
  registerAbilityHandler('hacan_masters_of_trade', hacanMastersOfTrade);
  registerAbilityHandler('hacan_guild_ships', hacanGuildShips);

  // Yssaril
  registerAbilityHandler('yssaril_stall_tactics', yssarilStallTactics);
  registerAbilityHandler('yssaril_scheming', yssarilScheming);

  // Saar
  registerAbilityHandler('saar_scavenge', saarScavenge);

  // Letnev
  registerAbilityHandler('letnev_munitions_reserves', letnevMunitionsReserves);

  // Yin
  registerAbilityHandler('yin_indoctrination', yinIndoctrination);
  registerAbilityHandler('yin_devotion', yinDevotion);

  // Nekro
  registerAbilityHandler('nekro_tech_singularity', nekroTechSingularity);

  // Xxcha
  registerAbilityHandler('xxcha_quash', xxchaQuash);
  registerAbilityHandler('xxcha_peace_accords', xxchaPeaceAccords);

  // Winnu
  registerAbilityHandler('winnu_blood_ties', winnuBloodTies);
  registerAbilityHandler('winnu_reclamation', winnuReclamation);

  // Jol-Nar
  registerAbilityHandler('jolnar_brilliant', jolnarBrilliant);
  registerAbilityHandler('jolnar_analytical', jolnarAnalytical);

  // Creuss
  registerAbilityHandler('creuss_quantum_entanglement', creussQuantumEntanglement);

  // Muaat
  registerAbilityHandler('muaat_star_forge', muaatStarForge);
}
