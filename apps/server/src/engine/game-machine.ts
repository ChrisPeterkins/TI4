import type {
  GameState,
  GamePhase,
  ActionPhaseState,
  GameAction,
  ActionResult,
  UUID,
} from '@ti4/shared';
import { validateAction } from './validators/index.js';
import { handleAction } from './handlers/index.js';

/**
 * Valid phase transitions in TI4
 */
const PHASE_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  setup: ['strategy'],
  strategy: ['action'],
  action: ['status'],
  status: ['strategy', 'agenda'], // agenda only after custodians taken
  agenda: ['strategy'],
};

/**
 * Core game state machine for TI4
 * Manages phase transitions, action validation, and state updates
 */
export class GameMachine {
  private state: GameState;
  private eventListeners: Map<string, ((event: GameEvent) => void)[]> = new Map();

  constructor(initialState: GameState) {
    this.state = structuredClone(initialState);
  }

  /**
   * Get current game state (immutable copy)
   */
  getState(): GameState {
    return structuredClone(this.state);
  }

  /**
   * Get current phase
   */
  getPhase(): GamePhase {
    return this.state.phase;
  }

  /**
   * Get current active player
   */
  getActivePlayer(): UUID {
    return this.state.activePlayerId;
  }

  /**
   * Check if a phase transition is valid
   */
  canTransitionTo(nextPhase: GamePhase): boolean {
    const validTransitions = PHASE_TRANSITIONS[this.state.phase];
    if (!validTransitions.includes(nextPhase)) {
      return false;
    }

    // Special case: agenda phase only available after custodians taken
    if (nextPhase === 'agenda' && !this.state.custodiansTaken) {
      return false;
    }

    return true;
  }

  /**
   * Transition to a new phase
   */
  transitionTo(nextPhase: GamePhase): boolean {
    if (!this.canTransitionTo(nextPhase)) {
      return false;
    }

    const previousPhase = this.state.phase;
    this.state.phase = nextPhase;
    this.state.version++;

    // Reset phase-specific state
    this.onPhaseEnter(nextPhase);

    this.emit('phaseChanged', {
      previousPhase,
      newPhase: nextPhase,
      round: this.state.round,
    });

    return true;
  }

  /**
   * Process a player action
   */
  processAction(action: GameAction): ActionResult {
    // Validate the action
    const validationResult = validateAction(this.state, action);
    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.error,
        stateVersion: this.state.version,
      };
    }

    // Handle the action (mutates state)
    const handlerResult = handleAction(this.state, action);
    if (!handlerResult.success) {
      return {
        success: false,
        error: handlerResult.error,
        stateVersion: this.state.version,
      };
    }

    // Increment version
    this.state.version++;

    // Emit action processed event
    this.emit('actionProcessed', {
      action,
      newVersion: this.state.version,
    });

    // Check for automatic phase transitions
    this.checkAutoTransitions();

    return {
      success: true,
      stateVersion: this.state.version,
      triggeredEvents: handlerResult.triggeredEvents,
    };
  }

  /**
   * Handle phase entry logic
   */
  private onPhaseEnter(phase: GamePhase): void {
    switch (phase) {
      case 'strategy':
        this.enterStrategyPhase();
        break;
      case 'action':
        this.enterActionPhase();
        break;
      case 'status':
        this.enterStatusPhase();
        break;
      case 'agenda':
        this.enterAgendaPhase();
        break;
    }
  }

  private enterStrategyPhase(): void {
    // Reset strategy cards
    for (const card of this.state.strategyCards) {
      card.pickedBy = null;
      card.exhausted = false;
    }

    // Reset player passed status
    for (const player of this.state.players) {
      player.passed = false;
      player.strategyCard = null;
      player.strategyCardUsed = false;
    }

    // Set speaker as active player
    this.state.activePlayerId = this.state.speakerId;
    this.state.subPhase = undefined;
  }

  private enterActionPhase(): void {
    // Build initiative order based on strategy card numbers
    this.state.initiativeOrder = this.state.players
      .filter(p => p.strategyCard !== null)
      .sort((a, b) => (a.strategyCard ?? 99) - (b.strategyCard ?? 99))
      .map(p => p.id);

    // Set first player in initiative order as active
    if (this.state.initiativeOrder.length > 0) {
      this.state.activePlayerId = this.state.initiativeOrder[0];
    }

    this.state.subPhase = 'awaiting_action';
  }

  private enterStatusPhase(): void {
    // Increment round counter when entering status phase
    this.state.round++;
    this.state.subPhase = undefined;

    // Clear command tokens from the board
    for (const tile of this.state.map.tiles) {
      tile.commandTokens = [];
    }

    // Ready all exhausted planets
    for (const player of this.state.players) {
      for (const planet of player.planets) {
        planet.exhausted = false;
      }
    }
  }

  private enterAgendaPhase(): void {
    // Reset agenda state
    this.state.agendas = {
      currentAgenda: null,
      currentAgendaNumber: 1,
      votes: new Map(),
      outcome: null,
      riders: [],
    };

    // Speaker controls agenda phase
    this.state.activePlayerId = this.state.speakerId;
  }

  /**
   * Check for automatic phase transitions
   */
  private checkAutoTransitions(): void {
    switch (this.state.phase) {
      case 'strategy':
        // All players have picked strategy cards
        if (this.allPlayersHaveStrategyCards()) {
          this.transitionTo('action');
        }
        break;

      case 'action':
        // All players have passed
        if (this.allPlayersPassed()) {
          this.transitionTo('status');
        }
        break;

      case 'status':
        // Status phase complete - check if agenda phase should trigger
        // This is typically handled by explicit action, not auto-transition
        break;

      case 'agenda':
        // Both agendas resolved
        if (this.state.agendas.currentAgendaNumber > 2) {
          this.transitionTo('strategy');
        }
        break;
    }
  }

  /**
   * Check if all players have picked strategy cards
   */
  private allPlayersHaveStrategyCards(): boolean {
    return this.state.players.every(p => p.strategyCard !== null);
  }

  /**
   * Check if all players have passed
   */
  private allPlayersPassed(): boolean {
    return this.state.players.every(p => p.passed);
  }

  /**
   * Advance to next player in turn order
   */
  advanceToNextPlayer(): void {
    const currentIndex = this.state.initiativeOrder.indexOf(this.state.activePlayerId);

    // Find next non-passed player
    for (let i = 1; i <= this.state.initiativeOrder.length; i++) {
      const nextIndex = (currentIndex + i) % this.state.initiativeOrder.length;
      const nextPlayerId = this.state.initiativeOrder[nextIndex];
      const nextPlayer = this.state.players.find(p => p.id === nextPlayerId);

      if (nextPlayer && !nextPlayer.passed) {
        this.state.activePlayerId = nextPlayerId;
        this.state.subPhase = 'awaiting_action';
        this.state.version++;

        this.emit('turnAdvanced', {
          playerId: nextPlayerId,
        });
        return;
      }
    }

    // All players passed - this should trigger phase transition
    this.checkAutoTransitions();
  }

  /**
   * Check for win condition
   */
  checkWinCondition(): UUID | null {
    const victoryPointTarget = 10; // Base game default

    for (const player of this.state.players) {
      if (player.score >= victoryPointTarget) {
        this.state.winner = player.id;
        this.emit('gameEnded', { winnerId: player.id });
        return player.id;
      }
    }

    return null;
  }

  /**
   * Event emitter
   */
  on(event: string, callback: (event: GameEvent) => void): void {
    const listeners = this.eventListeners.get(event) ?? [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  private emit(event: string, data: Record<string, unknown>): void {
    const listeners = this.eventListeners.get(event) ?? [];
    const gameEvent: GameEvent = {
      type: event,
      timestamp: Date.now(),
      data,
    };
    for (const listener of listeners) {
      listener(gameEvent);
    }
  }
}

export interface GameEvent {
  type: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface HandlerResult {
  success: boolean;
  error?: string;
  triggeredEvents?: string[];
}
