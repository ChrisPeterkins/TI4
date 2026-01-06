import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleStrategicPrimary,
  handleStrategicSecondary,
  advanceSecondaryResolution,
  initializeStrategicAction,
} from '../strategy-cards.js';
import type {
  GameState,
  PlayerState,
  StrategicPrimaryAction,
  StrategicSecondaryAction,
  MapTile,
  PlanetState,
  PlanetInstance,
} from '@ti4/shared';

// ============================================
// Test Helpers
// ============================================

function createMockPlayer(id: string, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id,
    name: `Player ${id}`,
    faction: 'sol',
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 5,
    commodities: 0,
    maxCommodities: 4,
    technologies: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    planets: [],
    strategyCard: null,
    strategyCardUsed: false,
    passed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
    ...overrides,
  };
}

function createMockPlanet(
  planetId: string,
  controlledBy: string | null,
  exhausted: boolean = false
): PlanetInstance {
  return {
    id: `planet-instance-${planetId}`,
    planetId,
    controlledBy,
    exhausted,
    units: [],
    attachments: [],
  };
}

function createMockTile(
  systemId: number,
  position: { q: number; r: number },
  planets: PlanetInstance[] = []
): MapTile {
  return {
    id: `tile-${systemId}`,
    systemId,
    position,
    rotation: 0,
    planets,
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
  };
}

function createMockGameState(playerCount: number = 4): GameState {
  const players: PlayerState[] = [];
  const colors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'] as const;

  for (let i = 0; i < playerCount; i++) {
    players.push(createMockPlayer(`player${i + 1}`, {
      name: `Player ${i + 1}`,
      seatIndex: i,
      color: colors[i],
      strategyCard: i + 1, // Each player has a different strategy card
    }));
  }

  // Create a basic map with home systems and Mecatol Rex
  const tiles: MapTile[] = [
    // Mecatol Rex (system 18)
    createMockTile(18, { q: 0, r: 0 }, [
      createMockPlanet('mecatol-rex', null),
    ]),
    // Player 1 home system (Sol = system 1)
    createMockTile(1, { q: 1, r: 0 }, [
      createMockPlanet('jord', 'player1'),
    ]),
    // Player 2 home system
    createMockTile(2, { q: -1, r: 0 }, [
      createMockPlanet('moll-primus', 'player2'),
    ]),
    // Additional system with planets controlled by player1
    createMockTile(19, { q: 0, r: 1 }, [
      createMockPlanet('wellon', 'player1'),
      createMockPlanet('vefut-ii', 'player1', true), // Exhausted
    ]),
  ];

  // Set player planets
  players[0].planets = [
    { planetId: 'jord', exhausted: false, attachments: [] },
    { planetId: 'wellon', exhausted: false, attachments: [] },
    { planetId: 'vefut-ii', exhausted: true, attachments: [] },
  ];
  players[1].planets = [
    { planetId: 'moll-primus', exhausted: false, attachments: [] },
  ];

  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'strategic_primary',
    activePlayerId: 'player1',
    speakerId: 'player1',
    initiativeOrder: players.map(p => p.id),
    players,
    map: {
      tiles,
      playerCount,
    },
    strategyCards: [
      { number: 1, name: 'Leadership', pickedBy: 'player1', exhausted: false },
      { number: 2, name: 'Diplomacy', pickedBy: 'player2', exhausted: false },
      { number: 3, name: 'Politics', pickedBy: 'player3', exhausted: false },
      { number: 4, name: 'Construction', pickedBy: 'player4', exhausted: false },
      { number: 5, name: 'Trade', pickedBy: null, exhausted: false },
      { number: 6, name: 'Warfare', pickedBy: null, exhausted: false },
      { number: 7, name: 'Technology', pickedBy: null, exhausted: false },
      { number: 8, name: 'Imperial', pickedBy: null, exhausted: false },
    ],
    objectives: {
      publicStageI: [
        { id: 'spend-8-resources', revealed: true, scoredBy: [] },
      ],
      publicStageII: [],
      revealedCount: 1,
      secretDeck: ['secret-1', 'secret-2', 'secret-3'],
    },
    agendas: {
      currentAgenda: null,
      currentAgendaNumber: 1,
      votes: new Map(),
      outcome: null,
      riders: [],
    },
    actionCardDeck: ['card-1', 'card-2', 'card-3', 'card-4'],
    actionCardDiscard: [],
    agendaDeck: ['agenda-1', 'agenda-2', 'agenda-3'],
    agendaDiscard: [],
    laws: [],
    custodiansTaken: false,
    activeCombat: null,
    timingWindowStack: [], activeTimingWindow: null,
    winner: null,
    gameLog: [],
  };
}

function setupStrategicAction(state: GameState, cardNumber: number, playerId: string = 'player1'): void {
  state.subPhase = 'strategic_primary';
  state.activePlayerId = playerId;
  initializeStrategicAction(state, playerId, cardNumber);
}

// ============================================
// Tests: initializeStrategicAction
// ============================================

describe('Strategy Card Handlers', () => {
  describe('initializeStrategicAction', () => {
    it('should create strategic action state with correct secondary order', () => {
      const state = createMockGameState(4);
      state.initiativeOrder = ['player1', 'player2', 'player3', 'player4'];

      initializeStrategicAction(state, 'player1', 1);

      expect(state.strategicActionState).toBeDefined();
      expect(state.strategicActionState!.cardNumber).toBe(1);
      expect(state.strategicActionState!.primaryResolved).toBe(false);
      expect(state.strategicActionState!.secondaryOrder).toEqual(['player2', 'player3', 'player4']);
      expect(state.strategicActionState!.currentSecondaryIndex).toBe(0);
    });

    it('should wrap around player order correctly', () => {
      const state = createMockGameState(4);
      state.initiativeOrder = ['player1', 'player2', 'player3', 'player4'];

      initializeStrategicAction(state, 'player3', 3);

      // Order should be player4, player1, player2 (wrapping around)
      expect(state.strategicActionState!.secondaryOrder).toEqual(['player4', 'player1', 'player2']);
    });

    it('should exclude passed players from secondary order', () => {
      const state = createMockGameState(4);
      state.initiativeOrder = ['player1', 'player2', 'player3', 'player4'];
      state.players[1].passed = true; // player2 has passed

      initializeStrategicAction(state, 'player1', 1);

      expect(state.strategicActionState!.secondaryOrder).toEqual(['player3', 'player4']);
    });

    it('should initialize all secondary responses as pending', () => {
      const state = createMockGameState(4);
      state.initiativeOrder = ['player1', 'player2', 'player3', 'player4'];

      initializeStrategicAction(state, 'player1', 1);

      expect(state.strategicActionState!.secondaryResponses).toEqual({
        player2: 'pending',
        player3: 'pending',
        player4: 'pending',
      });
    });
  });

  // ============================================
  // Tests: Leadership (Card 1)
  // ============================================

  describe('Leadership Primary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 1, 'player1');
    });

    it('should gain 3 command tokens with default distribution', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 1,
        choices: {},
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
      // Default adds to tactics
      expect(state.players[0].commandTokens.tactics).toBe(6); // 3 + 3
    });

    it('should distribute tokens according to choices', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 1,
        choices: {
          tokenDistribution: { tactics: 1, fleet: 1, strategy: 1 },
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].commandTokens.tactics).toBe(4); // 3 + 1
      expect(state.players[0].commandTokens.fleet).toBe(4); // 3 + 1
      expect(state.players[0].commandTokens.strategy).toBe(3); // 2 + 1
    });

    it('should gain bonus tokens from influence spending', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 1,
        choices: {
          influenceSpent: 6, // Should gain 2 bonus tokens
          tokenDistribution: { tactics: 3, fleet: 1, strategy: 1 }, // 5 total
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
      expect((result.data as { tokensGained?: number })?.tokensGained).toBe(5); // 3 base + 2 bonus
    });

    it('should fail with incorrect token distribution', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 1,
        choices: {
          tokenDistribution: { tactics: 1, fleet: 1, strategy: 0 }, // Only 2, need 3
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Must distribute exactly');
    });

    it('should transition to secondary phase after primary', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 1,
        choices: {},
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      expect(state.subPhase).toBe('strategic_secondary');
      expect(state.strategicActionState!.primaryResolved).toBe(true);
    });
  });

  describe('Leadership Secondary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 1, 'player1');
      // Complete primary
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
    });

    it('should not cost a strategy token (unique to Leadership)', () => {
      const initialTokens = state.players[1].commandTokens.strategy;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 1,
        choices: { influenceSpent: 0 },
        declined: false,
        timestamp: Date.now(),
      };

      handleStrategicSecondary(state, action);

      // Should NOT have spent a strategy token
      expect(state.players[1].commandTokens.strategy).toBe(initialTokens);
    });

    it('should allow gaining tokens via influence', () => {
      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 1,
        choices: {
          influenceSpent: 3,
          commandTokenDistribution: { tactics: 1, fleet: 0, strategy: 0 },
        },
        declined: false,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(true);
      expect(state.players[1].commandTokens.tactics).toBe(4); // 3 + 1
    });

    it('should allow declining', () => {
      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 1,
        choices: {},
        declined: true,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(true);
      expect(state.strategicActionState!.secondaryResponses['player2']).toBe('declined');
    });
  });

  // ============================================
  // Tests: Diplomacy (Card 2)
  // ============================================

  describe('Diplomacy Primary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 2, 'player1');
    });

    it('should place command tokens from other players in target system', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 2,
        choices: {
          targetSystemPosition: { q: 0, r: 1 }, // System with wellon/vefut-ii
          planetsToReady: [],
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);

      const targetTile = state.map.tiles.find(t => t.position.q === 0 && t.position.r === 1);
      expect(targetTile?.commandTokens).toContain('player2');
      expect(targetTile?.commandTokens).toContain('player3');
      expect(targetTile?.commandTokens).toContain('player4');
      expect(targetTile?.commandTokens).not.toContain('player1'); // Active player doesn't place
    });

    it('should ready up to 2 exhausted planets', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 2,
        choices: {
          targetSystemPosition: { q: 0, r: 1 },
          planetsToReady: ['vefut-ii'],
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);

      const playerPlanet = state.players[0].planets.find(p => p.planetId === 'vefut-ii');
      expect(playerPlanet?.exhausted).toBe(false);
    });

    it('should fail if targeting Mecatol Rex', () => {
      // Give player control of Mecatol Rex
      const mecatol = state.map.tiles.find(t => t.systemId === 18);
      mecatol!.planets[0].controlledBy = 'player1';

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 2,
        choices: {
          targetSystemPosition: { q: 0, r: 0 }, // Mecatol Rex
          planetsToReady: [],
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot choose Mecatol Rex');
    });

    it('should fail if player does not control a planet in target system', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 2,
        choices: {
          targetSystemPosition: { q: -1, r: 0 }, // Player 2's home system
          planetsToReady: [],
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must control a planet in the chosen system');
    });
  });

  describe('Diplomacy Secondary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 2, 'player1');
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
    });

    it('should cost strategy token', () => {
      const initialTokens = state.players[1].commandTokens.strategy;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 2,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      handleStrategicSecondary(state, action);

      expect(state.players[1].commandTokens.strategy).toBe(initialTokens - 1);
    });

    it('should allow readying exhausted planets', () => {
      state.players[1].planets = [
        { planetId: 'moll-primus', exhausted: true, attachments: [] },
      ];

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 2,
        choices: {
          planetsToReady: ['moll-primus'],
        },
        declined: false,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(true);
    });

    it('should allow declining', () => {
      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 2,
        choices: {},
        declined: true,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(true);
      expect(state.strategicActionState!.secondaryResponses['player2']).toBe('declined');
    });
  });

  // ============================================
  // Tests: Politics (Card 3)
  // ============================================

  describe('Politics Primary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 3, 'player1');
    });

    it('should change speaker to chosen player', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 3,
        choices: {
          newSpeakerId: 'player2',
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
      expect(state.speakerId).toBe('player2');
    });

    it('should fail if choosing self as speaker', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 3,
        choices: {
          newSpeakerId: 'player1', // Same as current speaker
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must choose a different player as speaker');
    });

    it('should draw 2 action cards', () => {
      const initialCards = state.players[0].actionCards.length;

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 3,
        choices: {
          newSpeakerId: 'player2',
        },
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      expect(state.players[0].actionCards.length).toBe(initialCards + 2);
    });

    it('should fail if new speaker not found', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 3,
        choices: {
          newSpeakerId: 'nonexistent',
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('New speaker not found');
    });
  });

  describe('Politics Secondary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 3, 'player1');
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
    });

    it('should cost strategy token', () => {
      const initialTokens = state.players[1].commandTokens.strategy;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 3,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      handleStrategicSecondary(state, action);

      expect(state.players[1].commandTokens.strategy).toBe(initialTokens - 1);
    });

    it('should draw 2 action cards', () => {
      const initialCards = state.players[1].actionCards.length;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 3,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      handleStrategicSecondary(state, action);

      expect(state.players[1].actionCards.length).toBe(initialCards + 2);
    });

    it('should allow declining', () => {
      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 3,
        choices: {},
        declined: true,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(true);
      expect(state.strategicActionState!.secondaryResponses['player2']).toBe('declined');
    });
  });

  // ============================================
  // Tests: Construction (Card 4)
  // ============================================

  describe('Construction Primary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 4, 'player1');
    });

    it('should place PDS on controlled planet', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 4,
        choices: {
          firstStructure: { type: 'pds', planetId: 'jord' },
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('construction_primary_resolved');
    });

    it('should place space dock on controlled planet', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 4,
        choices: {
          firstStructure: { type: 'space_dock', planetId: 'jord' },
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
    });

    it('should place PDS as second structure', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 4,
        choices: {
          firstStructure: { type: 'space_dock', planetId: 'jord' },
          secondStructure: { type: 'pds', planetId: 'wellon' },
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
      expect((result.data as { placedStructures?: any[] })?.placedStructures).toHaveLength(2);
    });

    it('should fail if second structure is not PDS', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 4,
        choices: {
          firstStructure: { type: 'pds', planetId: 'jord' },
          secondStructure: { type: 'space_dock', planetId: 'wellon' }, // Invalid
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Second structure must be a PDS');
    });

    it('should resolve without placing structures', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 4,
        choices: {},
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
    });
  });

  describe('Construction Secondary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 4, 'player1');
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
    });

    it('should cost strategy token', () => {
      const initialTokens = state.players[1].commandTokens.strategy;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 4,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      handleStrategicSecondary(state, action);

      expect(state.players[1].commandTokens.strategy).toBe(initialTokens - 1);
    });

    it('should allow placing PDS on controlled planet', () => {
      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 4,
        choices: {
          firstStructure: { type: 'pds', planetId: 'moll-primus' },
        },
        declined: false,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(true);
    });

    it('should allow declining', () => {
      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 4,
        choices: {},
        declined: true,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(true);
      expect(state.strategicActionState!.secondaryResponses['player2']).toBe('declined');
    });
  });

  // ============================================
  // Tests: Trade (Card 5)
  // ============================================

  describe('Trade Primary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 5, 'player1');
    });

    it('should gain 3 trade goods', () => {
      const initialTG = state.players[0].tradeGoods;

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 5,
        choices: {},
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      expect(state.players[0].tradeGoods).toBe(initialTG + 3);
    });

    it('should replenish commodities', () => {
      state.players[0].commodities = 0;
      state.players[0].maxCommodities = 4;

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 5,
        choices: {},
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      expect(state.players[0].commodities).toBe(4);
    });

    it('should set free secondary players', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 5,
        choices: {
          freeSecondaryPlayers: ['player2', 'player3'],
        },
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      expect(state.strategicActionState!.freeSecondaryPlayers).toEqual(['player2', 'player3']);
    });
  });

  describe('Trade Secondary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 5, 'player1');
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
    });

    it('should cost strategy token normally', () => {
      const initialTokens = state.players[1].commandTokens.strategy;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 5,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      handleStrategicSecondary(state, action);

      expect(state.players[1].commandTokens.strategy).toBe(initialTokens - 1);
    });

    it('should be free if granted by primary', () => {
      state.strategicActionState!.freeSecondaryPlayers = ['player2'];
      const initialTokens = state.players[1].commandTokens.strategy;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 5,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      handleStrategicSecondary(state, action);

      expect(state.players[1].commandTokens.strategy).toBe(initialTokens); // No cost
    });

    it('should replenish commodities', () => {
      state.players[1].commodities = 0;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 5,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      handleStrategicSecondary(state, action);

      expect(state.players[1].commodities).toBe(state.players[1].maxCommodities);
    });
  });

  // ============================================
  // Tests: Warfare (Card 6)
  // ============================================

  describe('Warfare Primary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 6, 'player1');
      // Place a command token on a system
      const tile = state.map.tiles.find(t => t.systemId === 19);
      if (tile) {
        tile.commandTokens.push('player1');
      }
    });

    it('should remove command token from chosen system', () => {
      const tile = state.map.tiles.find(t => t.systemId === 19);
      expect(tile?.commandTokens).toContain('player1');

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 6,
        choices: {
          removedTokenSystem: { q: 0, r: 1 }, // System 19
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
      expect(tile?.commandTokens).not.toContain('player1');
    });

    it('should gain 1 command token', () => {
      const initialTotal = state.players[0].commandTokens.tactics +
        state.players[0].commandTokens.fleet +
        state.players[0].commandTokens.strategy;

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 6,
        choices: {},
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      const newTotal = state.players[0].commandTokens.tactics +
        state.players[0].commandTokens.fleet +
        state.players[0].commandTokens.strategy;

      expect(newTotal).toBe(initialTotal + 1);
    });

    it('should redistribute tokens according to choices', () => {
      const initialTotal = state.players[0].commandTokens.tactics +
        state.players[0].commandTokens.fleet +
        state.players[0].commandTokens.strategy;

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 6,
        choices: {
          newTokenDistribution: {
            tactics: 4,
            fleet: 3,
            strategy: initialTotal + 1 - 7, // Remaining
          },
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].commandTokens.tactics).toBe(4);
      expect(state.players[0].commandTokens.fleet).toBe(3);
    });

    it('should fail with incorrect token distribution', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 6,
        choices: {
          newTokenDistribution: {
            tactics: 10,
            fleet: 10,
            strategy: 10, // Way too many
          },
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Must distribute exactly');
    });

    it('should default to adding to tactics pool', () => {
      const initialTactics = state.players[0].commandTokens.tactics;

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 6,
        choices: {},
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      expect(state.players[0].commandTokens.tactics).toBe(initialTactics + 1);
    });
  });

  describe('Warfare Secondary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 6, 'player1');
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
    });

    it('should allow declining', () => {
      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 6,
        choices: {},
        declined: true,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(true);
      expect(state.strategicActionState!.secondaryResponses['player2']).toBe('declined');
    });
  });

  // ============================================
  // Tests: Technology (Card 7)
  // ============================================

  describe('Technology Primary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 7, 'player1');
    });

    it('should research first tech for free', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 7,
        choices: {
          firstTechId: 'sarween-tools',
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].technologies).toContain('sarween-tools');
    });

    it('should fail if already have the technology', () => {
      state.players[0].technologies = ['sarween-tools'];

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 7,
        choices: {
          firstTechId: 'sarween-tools',
        },
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Already have this technology');
    });

    it('should resolve without researching any tech', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 7,
        choices: {},
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(true);
    });
  });

  describe('Technology Secondary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 7, 'player1');
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
    });

    it('should allow declining', () => {
      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 7,
        choices: {},
        declined: true,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(true);
      expect(state.strategicActionState!.secondaryResponses['player2']).toBe('declined');
    });
  });

  // ============================================
  // Tests: Imperial (Card 8)
  // ============================================

  describe('Imperial Primary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 8, 'player1');
    });

    it('should draw a secret objective', () => {
      const initialSecrets = state.players[0].secretObjectives.length;

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 8,
        choices: {},
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      expect(state.players[0].secretObjectives.length).toBe(initialSecrets + 1);
    });

    it('should not draw secret if already at 3', () => {
      state.players[0].secretObjectives = ['s1', 's2', 's3'];

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 8,
        choices: {},
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      expect(state.players[0].secretObjectives.length).toBe(3);
    });

    it('should gain VP if controlling Mecatol Rex', () => {
      // Give player control of Mecatol Rex
      const mecatol = state.map.tiles.find(t => t.systemId === 18);
      mecatol!.planets[0].controlledBy = 'player1';
      state.players[0].planets.push({ planetId: 'mecatol-rex', exhausted: false, attachments: [] });

      const initialScore = state.players[0].score;

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 8,
        choices: {},
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      expect(state.players[0].score).toBe(initialScore + 1);
    });

    it('should place token in Mecatol if not controlling and requested', () => {
      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 8,
        choices: {
          placeMecatolToken: true,
        },
        timestamp: Date.now(),
      };

      handleStrategicPrimary(state, action);

      const mecatol = state.map.tiles.find(t => t.systemId === 18);
      expect(mecatol!.commandTokens).toContain('player1');
    });
  });

  describe('Imperial Secondary', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 8, 'player1');
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
    });

    it('should draw a secret objective', () => {
      const initialSecrets = state.players[1].secretObjectives.length;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 8,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      handleStrategicSecondary(state, action);

      expect(state.players[1].secretObjectives.length).toBe(initialSecrets + 1);
    });

    it('should fail if at max secrets (3)', () => {
      state.players[1].secretObjectives = ['s1', 's2', 's3'];

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 8,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Already at maximum secret objectives (3)');
    });
  });

  // ============================================
  // Tests: Secondary Resolution Flow
  // ============================================

  describe('advanceSecondaryResolution', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
      setupStrategicAction(state, 1, 'player1');
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
    });

    it('should advance to next player', () => {
      expect(state.strategicActionState!.currentSecondaryIndex).toBe(0);

      advanceSecondaryResolution(state);

      expect(state.strategicActionState!.currentSecondaryIndex).toBe(1);
    });

    it('should complete strategic action when all players resolved', () => {
      state.strategicActionState!.currentSecondaryIndex = 2; // Last player

      advanceSecondaryResolution(state);

      expect(state.subPhase).toBe('awaiting_action');
      expect(state.strategicActionState).toBeUndefined();
    });

    it('should advance to next active player after completing', () => {
      state.strategicActionState!.currentSecondaryIndex = 2;

      advanceSecondaryResolution(state);

      expect(state.activePlayerId).toBe('player2');
    });
  });

  // ============================================
  // Tests: Error Conditions
  // ============================================

  describe('Error Conditions', () => {
    let state: GameState;

    beforeEach(() => {
      state = createMockGameState(4);
    });

    it('should fail if not in strategic primary phase', () => {
      state.subPhase = 'awaiting_action';
      state.strategicActionState = {
        cardNumber: 1,
        primaryResolved: false,
        secondaryOrder: ['player2', 'player3', 'player4'],
        currentSecondaryIndex: 0,
        secondaryResponses: {},
      };

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 1,
        choices: {},
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not in strategic primary phase');
    });

    it('should fail if player not found', () => {
      setupStrategicAction(state, 1, 'player1');

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'nonexistent',
        cardNumber: 1,
        choices: {},
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if card number mismatch', () => {
      setupStrategicAction(state, 1, 'player1');

      const action: StrategicPrimaryAction = {
        type: 'strategic_primary',
        playerId: 'player1',
        cardNumber: 2, // Mismatch
        choices: {},
        timestamp: Date.now(),
      };

      const result = handleStrategicPrimary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Strategy card mismatch');
    });

    it('should fail secondary if not player turn in order', () => {
      setupStrategicAction(state, 1, 'player1');
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player3', // player2 should be first
        cardNumber: 1,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not your turn to resolve secondary');
    });

    it('should fail secondary if no strategy tokens (except Leadership)', () => {
      setupStrategicAction(state, 5, 'player1'); // Trade
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
      state.players[1].commandTokens.strategy = 0;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 5,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No strategy tokens available');
    });

    it('should refund strategy token if secondary action fails', () => {
      setupStrategicAction(state, 8, 'player1'); // Imperial
      state.strategicActionState!.primaryResolved = true;
      state.subPhase = 'strategic_secondary';
      state.players[1].secretObjectives = ['s1', 's2', 's3']; // At max
      const initialTokens = state.players[1].commandTokens.strategy;

      const action: StrategicSecondaryAction = {
        type: 'strategic_secondary',
        playerId: 'player2',
        cardNumber: 8,
        choices: {},
        declined: false,
        timestamp: Date.now(),
      };

      const result = handleStrategicSecondary(state, action);

      expect(result.success).toBe(false);
      // Token should be refunded
      expect(state.players[1].commandTokens.strategy).toBe(initialTokens);
    });
  });
});
