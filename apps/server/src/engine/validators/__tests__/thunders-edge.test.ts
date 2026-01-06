import { describe, it, expect } from 'vitest';
import {
  validateClaimExpeditionSlice,
  validateStartCoexistence,
  validateEndCoexistence,
  validatePlayOceanCard,
  validatePickupStructure,
  validatePlaceStructure,
  validatePlaceBreachToken,
  validateFlipBreachToken,
  validateGalvanizeUnit,
  validateRemoveGalvanize,
  validatePlayPlotCard,
  validateTransformToObsidian,
  validateUseBreakthrough,
} from '../thunders-edge.js';
import type {
  GameState,
  PlayerState,
  ClaimExpeditionSliceAction,
  StartCoexistenceAction,
  EndCoexistenceAction,
  PlayOceanCardAction,
  PickupStructureAction,
  PlaceStructureAction,
  PlaceBreachTokenAction,
  FlipBreachTokenAction,
  GalvanizeUnitAction,
  RemoveGalvanizeAction,
  PlayPlotCardAction,
  TransformToObsidianAction,
  UseBreakthroughAction,
  ExpeditionSlice,
} from '@ti4/shared';

const now = Date.now();

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Test Player',
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    score: 0,
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    planets: [],
    technologies: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    actionCards: [],
    scoredObjectives: [],
    secretObjectives: [],
    relics: [],
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    strategyCard: 1,
    strategyCardUsed: false,
    passed: false,
    neighbors: [],
    transactedWith: [],
    ...overrides,
  } as PlayerState;
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'game-1',
    name: 'Test Game',
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: 'player1',
    speakerId: 'player1',
    players: [createMockPlayer()],
    map: [],
    turnOrder: ['player1'],
    strategyCardSelectionOrder: ['player1'],
    publicObjectives: [],
    secretObjectivesDeck: [],
    actionCardsDeck: [],
    agendaDeck: [],
    explorationDecks: { cultural: [], industrial: [], hazardous: [], frontier: [] },
    relicDeck: [],
    laws: [],
    events: [],
    actionLog: [],
    settings: {
      expansions: ['thunders_edge'],
      victoryPoints: 10,
      playerCount: 6,
    },
    ...overrides,
  } as unknown as GameState;
}

// ============================================================================
// EXPEDITION VALIDATORS
// ============================================================================

// Helper to create mock expedition slice
function createMockSlice(overrides: Partial<ExpeditionSlice> = {}): ExpeditionSlice {
  return {
    sliceNumber: 1,
    costType: 'resources_5',
    claimed: false,
    ...overrides,
  };
}

describe('validateClaimExpeditionSlice', () => {
  it('should validate a valid expedition claim', () => {
    const state = createMockGameState({
      phase: 'action',
      subPhase: 'awaiting_action',
      expeditionState: {
        slices: [createMockSlice(), createMockSlice({ sliceNumber: 2 })],
        claimOrder: [],
        completed: false,
      },
    });

    const action: ClaimExpeditionSliceAction = {
      type: 'claim_expedition_slice',
      playerId: 'player1',
      sliceIndex: 0,
      payment: { tradeGoods: 0, exhaustedPlanets: [] },
      timestamp: now,
    };

    const result = validateClaimExpeditionSlice(state, action);
    expect(result.valid).toBe(true);
  });

  it('should reject claim outside action phase', () => {
    const state = createMockGameState({
      phase: 'strategy',
      expeditionState: {
        slices: [createMockSlice()],
        claimOrder: [],
        completed: false,
      },
    });

    const action: ClaimExpeditionSliceAction = {
      type: 'claim_expedition_slice',
      playerId: 'player1',
      sliceIndex: 0,
      payment: { tradeGoods: 0, exhaustedPlanets: [] },
      timestamp: now,
    };

    const result = validateClaimExpeditionSlice(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('action phase');
  });

  it('should reject claim for already claimed slice', () => {
    const state = createMockGameState({
      expeditionState: {
        slices: [createMockSlice({ claimed: true, claimedBy: 'player2' })],
        claimOrder: ['player2'],
        completed: false,
      },
    });

    const action: ClaimExpeditionSliceAction = {
      type: 'claim_expedition_slice',
      playerId: 'player1',
      sliceIndex: 0,
      payment: { tradeGoods: 0, exhaustedPlanets: [] },
      timestamp: now,
    };

    const result = validateClaimExpeditionSlice(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('claimed');
  });

  it('should reject claim when player has passed', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ passed: true })],
      expeditionState: {
        slices: [createMockSlice()],
        claimOrder: [],
        completed: false,
      },
    });

    const action: ClaimExpeditionSliceAction = {
      type: 'claim_expedition_slice',
      playerId: 'player1',
      sliceIndex: 0,
      payment: { tradeGoods: 0, exhaustedPlanets: [] },
      timestamp: now,
    };

    const result = validateClaimExpeditionSlice(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('passing');
  });

  it('should reject invalid slice index', () => {
    const state = createMockGameState({
      expeditionState: {
        slices: [createMockSlice()],
        claimOrder: [],
        completed: false,
      },
    });

    const action: ClaimExpeditionSliceAction = {
      type: 'claim_expedition_slice',
      playerId: 'player1',
      sliceIndex: 10,
      payment: { tradeGoods: 0, exhaustedPlanets: [] },
      timestamp: now,
    };

    const result = validateClaimExpeditionSlice(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid slice');
  });
});

// ============================================================================
// COEXISTENCE VALIDATORS (Deepwrought)
// ============================================================================

describe('validateStartCoexistence', () => {
  it('should validate coexistence for Deepwrought player', () => {
    const state = createMockGameState({
      players: [
        createMockPlayer({ id: 'player1', faction: 'deepwrought' }),
        createMockPlayer({ id: 'player2', faction: 'sol' }),
      ],
    });

    const action: StartCoexistenceAction = {
      type: 'start_coexistence',
      playerId: 'player1',
      planetId: 'mecatol_rex',
      withPlayerId: 'player2',
      timestamp: now,
    };

    const result = validateStartCoexistence(state, action);
    expect(result.valid).toBe(true);
  });

  it('should reject coexistence from non-Deepwrought player', () => {
    const state = createMockGameState({
      players: [
        createMockPlayer({ id: 'player1', faction: 'sol' }),
        createMockPlayer({ id: 'player2', faction: 'hacan' }),
      ],
    });

    const action: StartCoexistenceAction = {
      type: 'start_coexistence',
      playerId: 'player1',
      planetId: 'mecatol_rex',
      withPlayerId: 'player2',
      timestamp: now,
    };

    const result = validateStartCoexistence(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Deepwrought');
  });

  it('should reject coexistence with yourself', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'deepwrought' })],
    });

    const action: StartCoexistenceAction = {
      type: 'start_coexistence',
      playerId: 'player1',
      planetId: 'mecatol_rex',
      withPlayerId: 'player1',
      timestamp: now,
    };

    const result = validateStartCoexistence(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('yourself');
  });
});

describe('validateEndCoexistence', () => {
  it('should validate ending coexistence', () => {
    const state = createMockGameState({
      players: [createMockPlayer()],
    });

    const action: EndCoexistenceAction = {
      type: 'end_coexistence',
      playerId: 'player1',
      planetId: 'mecatol_rex',
      timestamp: now,
    };

    const result = validateEndCoexistence(state, action);
    expect(result.valid).toBe(true);
  });

  it('should reject for unknown player', () => {
    const state = createMockGameState();

    const action: EndCoexistenceAction = {
      type: 'end_coexistence',
      playerId: 'unknown',
      planetId: 'mecatol_rex',
      timestamp: now,
    };

    const result = validateEndCoexistence(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not found');
  });
});

// ============================================================================
// STRUCTURE TRANSPORT VALIDATORS (Ral Nel)
// ============================================================================

describe('validatePickupStructure', () => {
  it('should validate structure pickup for Ral Nel', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'ral_nel' })],
    });

    const action: PickupStructureAction = {
      type: 'pickup_structure',
      playerId: 'player1',
      structureId: 'structure-1',
      carrierId: 'carrier-1',
      timestamp: now,
    };

    const result = validatePickupStructure(state, action);
    expect(result.valid).toBe(true);
  });

  it('should reject structure pickup for non-Ral Nel', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'sol' })],
    });

    const action: PickupStructureAction = {
      type: 'pickup_structure',
      playerId: 'player1',
      structureId: 'structure-1',
      carrierId: 'carrier-1',
      timestamp: now,
    };

    const result = validatePickupStructure(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Ral Nel');
  });
});

describe('validatePlaceStructure', () => {
  it('should validate structure placement for Ral Nel', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'ral_nel' })],
    });

    const action: PlaceStructureAction = {
      type: 'place_structure',
      playerId: 'player1',
      structureId: 'structure-1',
      planetId: 'planet-1',
      timestamp: now,
    };

    const result = validatePlaceStructure(state, action);
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// BREACH TOKEN VALIDATORS (Crimson Rebellion)
// ============================================================================

describe('validatePlaceBreachToken', () => {
  it('should validate breach placement for Crimson Rebellion', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'crimson_rebellion' })],
    });

    const action: PlaceBreachTokenAction = {
      type: 'place_breach_token',
      playerId: 'player1',
      systemId: 'system-1',
      timestamp: now,
    };

    const result = validatePlaceBreachToken(state, action);
    expect(result.valid).toBe(true);
  });

  it('should reject breach placement for non-Crimson Rebellion', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'sol' })],
    });

    const action: PlaceBreachTokenAction = {
      type: 'place_breach_token',
      playerId: 'player1',
      systemId: 'system-1',
      timestamp: now,
    };

    const result = validatePlaceBreachToken(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Crimson Rebellion');
  });
});

describe('validateFlipBreachToken', () => {
  it('should validate breach flip for Crimson Rebellion', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'crimson_rebellion' })],
    });

    const action: FlipBreachTokenAction = {
      type: 'flip_breach_token',
      playerId: 'player1',
      tokenId: 'token-1',
      timestamp: now,
    };

    const result = validateFlipBreachToken(state, action);
    expect(result.valid).toBe(true);
  });
});

// ============================================================================
// GALVANIZE VALIDATORS (Last Bastion)
// ============================================================================

describe('validateGalvanizeUnit', () => {
  it('should validate galvanize for Last Bastion', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'last_bastion' })],
    });

    const action: GalvanizeUnitAction = {
      type: 'galvanize_unit',
      playerId: 'player1',
      unitId: 'unit-1',
      timestamp: now,
    };

    const result = validateGalvanizeUnit(state, action);
    expect(result.valid).toBe(true);
  });

  it('should reject galvanize for non-Last Bastion', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'sol' })],
    });

    const action: GalvanizeUnitAction = {
      type: 'galvanize_unit',
      playerId: 'player1',
      unitId: 'unit-1',
      timestamp: now,
    };

    const result = validateGalvanizeUnit(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Last Bastion');
  });
});

// ============================================================================
// PLOT CARD VALIDATORS (Firmament/Obsidian)
// ============================================================================

describe('validatePlayPlotCard', () => {
  it('should validate plot card for Firmament', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'firmament' })],
    });

    const action: PlayPlotCardAction = {
      type: 'play_plot_card',
      playerId: 'player1',
      cardId: 'plot-1',
      timestamp: now,
    };

    const result = validatePlayPlotCard(state, action);
    expect(result.valid).toBe(true);
  });

  it('should validate plot card for Obsidian', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'obsidian' })],
    });

    const action: PlayPlotCardAction = {
      type: 'play_plot_card',
      playerId: 'player1',
      cardId: 'plot-1',
      timestamp: now,
    };

    const result = validatePlayPlotCard(state, action);
    expect(result.valid).toBe(true);
  });

  it('should reject plot card for non-Firmament/Obsidian', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'sol' })],
    });

    const action: PlayPlotCardAction = {
      type: 'play_plot_card',
      playerId: 'player1',
      cardId: 'plot-1',
      timestamp: now,
    };

    const result = validatePlayPlotCard(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Firmament');
  });
});

describe('validateTransformToObsidian', () => {
  it('should validate transformation for Firmament', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'firmament' })],
    });

    const action: TransformToObsidianAction = {
      type: 'transform_to_obsidian',
      playerId: 'player1',
      timestamp: now,
    };

    const result = validateTransformToObsidian(state, action);
    expect(result.valid).toBe(true);
  });

  it('should reject transformation for non-Firmament', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'obsidian' })],
    });

    const action: TransformToObsidianAction = {
      type: 'transform_to_obsidian',
      playerId: 'player1',
      timestamp: now,
    };

    const result = validateTransformToObsidian(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Firmament');
  });
});

// ============================================================================
// BREAKTHROUGH VALIDATORS
// ============================================================================

describe('validateUseBreakthrough', () => {
  it('should validate breakthrough use when unlocked', () => {
    const state = createMockGameState({
      players: [
        createMockPlayer({
          id: 'player1',
          faction: 'sol',
          breakthrough: {
            breakthroughId: 'sol_breakthrough',
            unlocked: true,
            exhausted: false,
          },
        }),
      ],
    });

    const action: UseBreakthroughAction = {
      type: 'use_breakthrough',
      playerId: 'player1',
      timestamp: now,
    };

    const result = validateUseBreakthrough(state, action);
    expect(result.valid).toBe(true);
  });

  it('should reject breakthrough use when not unlocked', () => {
    const state = createMockGameState({
      players: [
        createMockPlayer({
          id: 'player1',
          faction: 'sol',
          breakthrough: {
            breakthroughId: 'sol_breakthrough',
            unlocked: false,
            exhausted: false,
          },
        }),
      ],
    });

    const action: UseBreakthroughAction = {
      type: 'use_breakthrough',
      playerId: 'player1',
      timestamp: now,
    };

    const result = validateUseBreakthrough(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('unlocked');
  });

  it('should reject breakthrough use when no breakthrough', () => {
    const state = createMockGameState({
      players: [createMockPlayer({ id: 'player1', faction: 'sol' })],
    });

    const action: UseBreakthroughAction = {
      type: 'use_breakthrough',
      playerId: 'player1',
      timestamp: now,
    };

    const result = validateUseBreakthrough(state, action);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('breakthrough');
  });
});
