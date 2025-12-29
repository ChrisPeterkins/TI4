import type {
  GameState,
  PassAction,
  TacticalAction,
  StrategicAction,
  HexCoord,
} from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { findTileAtPosition, getAdjacentPositions } from '../utils/hex.js';

/**
 * Validate pass action
 */
export function validatePass(state: GameState, action: PassAction): ValidationResult {
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only pass during action phase' };
  }

  if (state.subPhase !== 'awaiting_action') {
    return { valid: false, error: 'Cannot pass while in the middle of an action' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Player must have used their strategy card before passing (or have no card)
  if (player.strategyCard !== null && !player.strategyCardUsed) {
    return { valid: false, error: 'Must use your strategy card before passing' };
  }

  if (player.passed) {
    return { valid: false, error: 'Already passed' };
  }

  return { valid: true };
}

/**
 * Validate tactical action (system activation)
 */
export function validateTacticalAction(
  state: GameState,
  action: TacticalAction
): ValidationResult {
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only take tactical actions during action phase' };
  }

  if (state.subPhase !== 'awaiting_action') {
    return { valid: false, error: 'Cannot start a new action while one is in progress' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if player has tactics tokens
  if (player.commandTokens.tactics < 1) {
    return { valid: false, error: 'No tactics command tokens available' };
  }

  // Validate the target system
  const targetTile = findTileAtPosition(state.map, action.systemPosition);
  if (!targetTile) {
    return { valid: false, error: 'Invalid system position' };
  }

  // Cannot activate a system that already has your command token
  if (targetTile.commandTokens.includes(action.playerId)) {
    return { valid: false, error: 'System already activated by you this round' };
  }

  // Cannot activate your home system (optional rule enforcement)
  // Some games allow this, but by default it's restricted
  const system = state.map.tiles.find(t => t.systemId === targetTile.systemId);
  if (system) {
    // Home systems are 1-17 (faction home systems)
    const isHomeSystem = targetTile.systemId >= 1 && targetTile.systemId <= 17;
    const isMyHomeSystem = state.players.some(
      p => p.id === action.playerId && isPlayerHomeSystem(state, p.faction, targetTile.systemId)
    );

    // Players can activate their own home system, but not others'
    if (isHomeSystem && !isMyHomeSystem) {
      // Check if any other player owns this home system
      const homeOwner = state.players.find(p =>
        isPlayerHomeSystem(state, p.faction, targetTile.systemId)
      );
      if (homeOwner && homeOwner.id !== action.playerId) {
        // This is another player's home system - can only activate if you have ships there
        const hasUnitsInSystem = targetTile.units.some(u => u.ownerId === action.playerId);
        if (!hasUnitsInSystem) {
          return { valid: false, error: 'Cannot activate another player\'s home system without units present' };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Validate strategic action (using strategy card)
 */
export function validateStrategicAction(
  state: GameState,
  action: StrategicAction
): ValidationResult {
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only use strategy cards during action phase' };
  }

  if (state.subPhase !== 'awaiting_action') {
    return { valid: false, error: 'Cannot start a new action while one is in progress' };
  }

  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Player must have this strategy card
  if (player.strategyCard !== action.cardNumber) {
    return { valid: false, error: 'You do not have this strategy card' };
  }

  // Card must not already be used
  if (player.strategyCardUsed) {
    return { valid: false, error: 'Strategy card already used this round' };
  }

  // Card must not be exhausted (shouldn't happen if strategyCardUsed is false)
  const card = state.strategyCards.find(c => c.number === action.cardNumber);
  if (!card) {
    return { valid: false, error: 'Strategy card not found' };
  }

  if (card.exhausted) {
    return { valid: false, error: 'Strategy card is exhausted' };
  }

  return { valid: true };
}

/**
 * Check if a system is a player's home system based on faction
 */
function isPlayerHomeSystem(state: GameState, factionId: string, systemId: number): boolean {
  // Map faction IDs to home system IDs
  const factionHomeSystemMap: Record<string, number> = {
    sol: 1,
    mentak: 2,
    letnev: 3,
    muaat: 4,
    arborec: 5,
    l1z1x: 6,
    winnu: 7,
    nekro: 8,
    naalu: 9,
    hacan: 10,
    saar: 11,
    jolnar: 12,
    sardakk: 13,
    xxcha: 14,
    yin: 15,
    yssaril: 16,
    creuss: 51, // Creuss has special home system
  };

  return factionHomeSystemMap[factionId] === systemId;
}

/**
 * Validate movement within a tactical action
 */
export function validateMovement(
  state: GameState,
  playerId: string,
  moves: { unitId: string; from: HexCoord; to: HexCoord }[]
): ValidationResult {
  const targetPosition = state.subPhase === 'tactical_movement'
    ? findActivatedSystem(state, playerId)
    : null;

  if (!targetPosition) {
    return { valid: false, error: 'No activated system for movement' };
  }

  // All moves must end in the activated system
  for (const move of moves) {
    if (move.to.q !== targetPosition.q || move.to.r !== targetPosition.r) {
      return { valid: false, error: 'All units must move to the activated system' };
    }
  }

  // Validate each unit can legally move
  for (const move of moves) {
    const fromTile = findTileAtPosition(state.map, move.from);
    if (!fromTile) {
      return { valid: false, error: 'Invalid source system' };
    }

    const unit = fromTile.units.find(u => u.id === move.unitId);
    if (!unit) {
      return { valid: false, error: 'Unit not found in source system' };
    }

    if (unit.ownerId !== playerId) {
      return { valid: false, error: 'Cannot move units you do not own' };
    }

    // TODO: Check unit movement range, capacity, anomaly restrictions, etc.
  }

  return { valid: true };
}

/**
 * Find the system activated by the current player
 */
function findActivatedSystem(state: GameState, playerId: string): HexCoord | null {
  for (const tile of state.map.tiles) {
    // The most recently activated system would be tracked elsewhere
    // For now, return the first tile with the player's command token
    if (tile.commandTokens.includes(playerId)) {
      return tile.position;
    }
  }
  return null;
}
