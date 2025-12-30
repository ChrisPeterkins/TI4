/**
 * Ability Handler Registry
 *
 * Central registry for all faction ability handlers.
 * Handlers are registered by their handlerId and can be looked up
 * to execute abilities at runtime.
 */

import type { GameState } from '@ti4/shared';
import type { AbilityHandler, AbilityContext, AbilityResult } from './ability-types.js';

// Registry of all ability handlers
const abilityHandlers = new Map<string, AbilityHandler>();

/**
 * Register an ability handler
 */
export function registerAbilityHandler(handlerId: string, handler: AbilityHandler): void {
  if (abilityHandlers.has(handlerId)) {
    console.warn(`Ability handler '${handlerId}' is being overwritten`);
  }
  abilityHandlers.set(handlerId, handler);
}

/**
 * Get an ability handler by ID
 */
export function getAbilityHandler(handlerId: string): AbilityHandler | undefined {
  return abilityHandlers.get(handlerId);
}

/**
 * Check if an ability handler exists
 */
export function hasAbilityHandler(handlerId: string): boolean {
  return abilityHandlers.has(handlerId);
}

/**
 * Execute an ability by its handler ID
 */
export function executeAbility(
  state: GameState,
  playerId: string,
  handlerId: string,
  context: AbilityContext = {}
): AbilityResult {
  const handler = abilityHandlers.get(handlerId);

  if (!handler) {
    return {
      success: false,
      error: `No handler found for ability: ${handlerId}`,
    };
  }

  try {
    return handler(state, playerId, context);
  } catch (error) {
    console.error(`Error executing ability ${handlerId}:`, error);
    return {
      success: false,
      error: `Error executing ability: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get all registered handler IDs (for debugging)
 */
export function getRegisteredHandlerIds(): string[] {
  return Array.from(abilityHandlers.keys());
}

/**
 * Clear all handlers (for testing)
 */
export function clearHandlers(): void {
  abilityHandlers.clear();
}

// Re-export types
export type { AbilityHandler, AbilityContext, AbilityResult };
