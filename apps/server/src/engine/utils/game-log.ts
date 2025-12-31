/**
 * Game Log Utilities
 *
 * Provides functions for adding log entries to the game state.
 * Handlers should use these utilities to record important game events.
 */

import type {
  GameState,
  GameLogEntry,
  GameLogEntryType,
  GameLogDetails,
  UUID,
  UnitType,
} from '@ti4/shared';

/**
 * Add a log entry to the game state
 */
export function addLogEntry(
  state: GameState,
  type: GameLogEntryType,
  message: string,
  options: {
    playerId?: UUID;
    details?: GameLogDetails;
  } = {}
): void {
  // Ensure gameLog exists (for games created before this field was added)
  if (!state.gameLog) {
    state.gameLog = [];
  }

  const player = options.playerId
    ? state.players.find(p => p.id === options.playerId)
    : undefined;

  const entry: GameLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    type,
    playerId: options.playerId,
    playerName: player?.name,
    playerFaction: player?.faction,
    round: state.round,
    phase: state.phase,
    message,
    details: options.details,
  };

  state.gameLog.push(entry);
}

// =============================================================================
// PHASE & TURN LOGGING
// =============================================================================

export function logPhaseChange(state: GameState, newPhase: string): void {
  addLogEntry(state, 'phase_change', `Phase changed to ${formatPhase(newPhase)}`);
}

export function logRoundStart(state: GameState): void {
  addLogEntry(state, 'round_start', `Round ${state.round} has begun`);
}

export function logTurnStart(state: GameState, playerId: UUID): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(state, 'turn_start', `${player?.name || 'Unknown'}'s turn`, {
    playerId,
  });
}

export function logPass(state: GameState, playerId: UUID): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(state, 'pass', `${player?.name || 'Unknown'} passed`, {
    playerId,
  });
}

// =============================================================================
// STRATEGY PHASE LOGGING
// =============================================================================

export function logStrategyCardPicked(
  state: GameState,
  playerId: UUID,
  cardNumber: number,
  cardName: string
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'strategy_card_picked',
    `${player?.name || 'Unknown'} picked ${cardName}`,
    {
      playerId,
      details: {
        strategyCardNumber: cardNumber,
        strategyCardName: cardName,
      },
    }
  );
}

// =============================================================================
// ACTION PHASE LOGGING
// =============================================================================

export function logTacticalAction(
  state: GameState,
  playerId: UUID,
  systemName: string
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'tactical_action',
    `${player?.name || 'Unknown'} activated ${systemName}`,
    {
      playerId,
      details: { systemName },
    }
  );
}

export function logStrategicAction(
  state: GameState,
  playerId: UUID,
  cardName: string,
  isPrimary: boolean
): void {
  const player = state.players.find(p => p.id === playerId);
  const actionType = isPrimary ? 'primary' : 'secondary';
  addLogEntry(
    state,
    'strategic_action',
    `${player?.name || 'Unknown'} used ${cardName} ${actionType} ability`,
    {
      playerId,
      details: { strategyCardName: cardName },
    }
  );
}

export function logSystemActivated(
  state: GameState,
  playerId: UUID,
  systemId: string,
  systemName: string
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'system_activated',
    `${player?.name || 'Unknown'} activated ${systemName}`,
    {
      playerId,
      details: { systemId, systemName },
    }
  );
}

export function logUnitsMoved(
  state: GameState,
  playerId: UUID,
  fromSystem: string,
  toSystem: string,
  units: Array<{ type: UnitType; count: number }>
): void {
  const player = state.players.find(p => p.id === playerId);
  const unitSummary = units.map(u => `${u.count} ${u.type}`).join(', ');
  addLogEntry(
    state,
    'units_moved',
    `${player?.name || 'Unknown'} moved ${unitSummary} from ${fromSystem} to ${toSystem}`,
    {
      playerId,
      details: { fromSystem, toSystem, unitsMoved: units },
    }
  );
}

// =============================================================================
// COMBAT LOGGING
// =============================================================================

export function logCombatStart(
  state: GameState,
  combatType: 'space' | 'ground',
  attackerId: UUID,
  defenderId: UUID,
  systemName: string
): void {
  const attacker = state.players.find(p => p.id === attackerId);
  const defender = state.players.find(p => p.id === defenderId);
  const typeLabel = combatType === 'space' ? 'Space combat' : 'Ground combat';
  addLogEntry(
    state,
    'combat_start',
    `${typeLabel} started: ${attacker?.name} vs ${defender?.name} in ${systemName}`,
    {
      playerId: attackerId,
      details: {
        attackerId,
        defenderId,
        systemName,
      },
    }
  );
}

export function logDiceRolled(
  state: GameState,
  playerId: UUID,
  rolls: number[],
  hits: number,
  context?: string
): void {
  const player = state.players.find(p => p.id === playerId);
  const rollsStr = rolls.join(', ');
  const contextStr = context ? ` (${context})` : '';
  addLogEntry(
    state,
    'dice_rolled',
    `${player?.name || 'Unknown'} rolled [${rollsStr}] - ${hits} hit(s)${contextStr}`,
    {
      playerId,
      details: { rolls, hits },
    }
  );
}

export function logHitsAssigned(
  state: GameState,
  playerId: UUID,
  unitsDestroyed: Array<{ type: UnitType; count: number }>,
  unitsSustained: number
): void {
  const player = state.players.find(p => p.id === playerId);
  const destroyedStr = unitsDestroyed.map(u => `${u.count} ${u.type}`).join(', ');
  const parts = [];
  if (destroyedStr) parts.push(`destroyed: ${destroyedStr}`);
  if (unitsSustained > 0) parts.push(`sustained: ${unitsSustained}`);
  addLogEntry(
    state,
    'hits_assigned',
    `${player?.name || 'Unknown'} assigned hits (${parts.join(', ')})`,
    {
      playerId,
    }
  );
}

export function logUnitDestroyed(
  state: GameState,
  playerId: UUID,
  unitType: UnitType,
  count: number = 1
): void {
  const player = state.players.find(p => p.id === playerId);
  const plural = count > 1 ? 's' : '';
  addLogEntry(
    state,
    'unit_destroyed',
    `${player?.name || 'Unknown'} lost ${count} ${unitType}${plural}`,
    {
      playerId,
      details: { unitType, unitCount: count },
    }
  );
}

export function logCombatEnd(
  state: GameState,
  winnerId: UUID | null,
  systemName: string
): void {
  if (winnerId) {
    const winner = state.players.find(p => p.id === winnerId);
    addLogEntry(
      state,
      'combat_end',
      `${winner?.name || 'Unknown'} won the battle in ${systemName}`,
      {
        playerId: winnerId,
        details: { winnerId, systemName },
      }
    );
  } else {
    addLogEntry(state, 'combat_end', `Combat in ${systemName} ended in a draw`, {
      details: { systemName },
    });
  }
}

export function logRetreat(
  state: GameState,
  playerId: UUID,
  fromSystem: string,
  toSystem: string
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'retreat',
    `${player?.name || 'Unknown'} retreated from ${fromSystem} to ${toSystem}`,
    {
      playerId,
      details: { fromSystem, toSystem },
    }
  );
}

// =============================================================================
// PRODUCTION LOGGING
// =============================================================================

export function logUnitsProduced(
  state: GameState,
  playerId: UUID,
  units: Array<{ type: UnitType; count: number }>,
  systemName: string,
  totalCost: number
): void {
  const player = state.players.find(p => p.id === playerId);
  const unitSummary = units.map(u => `${u.count} ${u.type}`).join(', ');
  addLogEntry(
    state,
    'units_produced',
    `${player?.name || 'Unknown'} produced ${unitSummary} in ${systemName} (${totalCost} resources)`,
    {
      playerId,
      details: { unitsProduced: units, totalCost, systemName },
    }
  );
}

// =============================================================================
// INVASION LOGGING
// =============================================================================

export function logBombardment(
  state: GameState,
  playerId: UUID,
  planetName: string,
  hits: number
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'bombardment',
    `${player?.name || 'Unknown'} bombarded ${planetName} for ${hits} hit(s)`,
    {
      playerId,
      details: { planetName, hits },
    }
  );
}

export function logPlanetTaken(
  state: GameState,
  playerId: UUID,
  planetName: string
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'planet_taken',
    `${player?.name || 'Unknown'} took control of ${planetName}`,
    {
      playerId,
      details: { planetName },
    }
  );
}

// =============================================================================
// CARD LOGGING
// =============================================================================

export function logActionCardPlayed(
  state: GameState,
  playerId: UUID,
  cardId: string,
  cardName: string
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'action_card_played',
    `${player?.name || 'Unknown'} played ${cardName}`,
    {
      playerId,
      details: { cardId, cardName },
    }
  );
}

export function logSabotage(
  state: GameState,
  playerId: UUID,
  targetCardName: string,
  targetPlayerName: string
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'sabotage',
    `${player?.name || 'Unknown'} sabotaged ${targetPlayerName}'s ${targetCardName}`,
    {
      playerId,
      details: { cardName: targetCardName },
    }
  );
}

export function logRiderPlayed(
  state: GameState,
  playerId: UUID,
  cardName: string,
  prediction: string
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'rider_played',
    `${player?.name || 'Unknown'} played ${cardName} predicting "${prediction}"`,
    {
      playerId,
      details: { cardName, outcome: prediction },
    }
  );
}

export function logRiderResolved(
  state: GameState,
  playerId: UUID,
  cardName: string,
  success: boolean
): void {
  const player = state.players.find(p => p.id === playerId);
  const result = success ? 'succeeded' : 'failed';
  addLogEntry(
    state,
    'rider_resolved',
    `${player?.name || 'Unknown'}'s ${cardName} ${result}`,
    {
      playerId,
      details: { cardName },
    }
  );
}

// =============================================================================
// TECHNOLOGY LOGGING
// =============================================================================

export function logTechnologyResearched(
  state: GameState,
  playerId: UUID,
  techId: string,
  techName: string
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'technology_researched',
    `${player?.name || 'Unknown'} researched ${techName}`,
    {
      playerId,
      details: { techId, techName },
    }
  );
}

// =============================================================================
// OBJECTIVE LOGGING
// =============================================================================

export function logObjectiveScored(
  state: GameState,
  playerId: UUID,
  objectiveName: string,
  points: number
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'objective_scored',
    `${player?.name || 'Unknown'} scored "${objectiveName}" (+${points} VP)`,
    {
      playerId,
      details: { objectiveName, points },
    }
  );
}

export function logObjectiveRevealed(
  state: GameState,
  objectiveName: string,
  stage: number
): void {
  addLogEntry(
    state,
    'objective_revealed',
    `Stage ${stage} objective revealed: "${objectiveName}"`,
    {
      details: { objectiveName },
    }
  );
}

// =============================================================================
// AGENDA LOGGING
// =============================================================================

export function logAgendaRevealed(
  state: GameState,
  agendaName: string,
  agendaType: string
): void {
  addLogEntry(
    state,
    'agenda_revealed',
    `Agenda revealed: "${agendaName}" (${agendaType})`,
    {
      details: { agendaName },
    }
  );
}

export function logVoteCast(
  state: GameState,
  playerId: UUID,
  votes: number,
  outcome: string,
  abstained: boolean
): void {
  const player = state.players.find(p => p.id === playerId);
  if (abstained) {
    addLogEntry(state, 'vote_cast', `${player?.name || 'Unknown'} abstained`, {
      playerId,
    });
  } else {
    addLogEntry(
      state,
      'vote_cast',
      `${player?.name || 'Unknown'} voted ${votes} for "${outcome}"`,
      {
        playerId,
        details: { votes, outcome },
      }
    );
  }
}

export function logAgendaResolved(
  state: GameState,
  agendaName: string,
  outcome: string
): void {
  addLogEntry(
    state,
    'agenda_resolved',
    `Agenda "${agendaName}" resolved: ${outcome}`,
    {
      details: { agendaName, outcome },
    }
  );
}

// =============================================================================
// TRADE LOGGING
// =============================================================================

export function logTransactionCompleted(
  state: GameState,
  fromPlayerId: UUID,
  toPlayerId: UUID,
  summary: string
): void {
  const from = state.players.find(p => p.id === fromPlayerId);
  const to = state.players.find(p => p.id === toPlayerId);
  addLogEntry(
    state,
    'transaction_completed',
    `${from?.name || 'Unknown'} traded with ${to?.name || 'Unknown'}: ${summary}`,
    {
      playerId: fromPlayerId,
      details: { fromPlayerId, toPlayerId },
    }
  );
}

// =============================================================================
// OTHER LOGGING
// =============================================================================

export function logAbilityTriggered(
  state: GameState,
  playerId: UUID,
  abilityName: string
): void {
  const player = state.players.find(p => p.id === playerId);
  addLogEntry(
    state,
    'ability_triggered',
    `${player?.name || 'Unknown'} used ${abilityName}`,
    {
      playerId,
    }
  );
}

export function logGameWon(state: GameState, winnerId: UUID): void {
  const winner = state.players.find(p => p.id === winnerId);
  addLogEntry(state, 'game_won', `${winner?.name || 'Unknown'} has won the game!`, {
    playerId: winnerId,
    details: { winnerId },
  });
}

// =============================================================================
// HELPERS
// =============================================================================

function formatPhase(phase: string): string {
  switch (phase) {
    case 'strategy':
      return 'Strategy Phase';
    case 'action':
      return 'Action Phase';
    case 'status':
      return 'Status Phase';
    case 'agenda':
      return 'Agenda Phase';
    default:
      return phase.charAt(0).toUpperCase() + phase.slice(1);
  }
}
