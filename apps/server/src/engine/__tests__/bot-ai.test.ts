import { describe, it, expect } from 'vitest';
import { generateBotAction, getCurrentBotPlayerId, getBotActionDelay, isBot } from '../bot-ai.js';
import type { GameState, PlayerState, MapTile, HexCoord, UnitInstance } from '@ti4/shared';

function createMockUnit(overrides: Partial<UnitInstance> = {}): UnitInstance {
  return {
    id: `unit-${Math.random().toString(36).substr(2, 9)}`,
    type: 'cruiser',
    ownerId: 'player1',
    damaged: false,
    ...overrides,
  } as UnitInstance;
}

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Test Player',
    faction: 'sol',
    color: 'blue',
    isBot: true,
    seatPosition: 0,
    score: 0,
    resources: 0,
    influence: 0,
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    planets: [],
    technologies: [],
    promissoryNotes: [],
    actionCards: [],
    scoredObjectives: [],
    secretObjectives: [],
    relics: [],
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    exhaustedPlanets: [],
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
    strategyCard: 8, // Imperial
    strategyCardUsed: false,
    passed: false,
    speaker: false,
    ...overrides,
  } as PlayerState;
}

function createMockTile(position: HexCoord, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId: 19, // Generic blue tile
    position,
    rotation: 0,
    planets: [],
    wormhole: null,
    anomaly: null,
    units: [],
    commandTokens: [],
    ...overrides,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game',
    phase: 'action',
    subPhase: 'awaiting_action',
    agendaNumber: 1,
          currentStep: 'voting',
          currentAgendaType: 'directive',
          votingComplete: [],
          voteTallies: {},
          riders: [],
          vetoed: false,
          electedOutcome: null,
          electedPlayer: null,
          electedPlanet: null,
    turn: 1,
    activePlayerId: 'player1',
    version: 1,
    players: [createMockPlayer()],
    map: {
      tiles: [
        // Center (Mecatol)
        createMockTile({ q: 0, r: 0 }, { systemId: 18, planets: [{ planetId: 'mecatol_rex', controlledBy: null, exhausted: false, units: [] } as any] }),
        // Player home system with ships
        createMockTile({ q: 0, r: 3 }, {
          systemId: 1, // Sol home
          planets: [{ planetId: 'jord', controlledBy: 'player1', exhausted: false, units: [] } as any],
          units: [
            createMockUnit({ id: 'carrier-1', type: 'carrier', ownerId: 'player1' }),
            createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' }),
          ],
        }),
        // Tile at ring 1 (adjacent to Mecatol) - empty for transit
        createMockTile({ q: 0, r: 1 }, {
          systemId: 19,
          planets: [],
        }),
        // Adjacent tile with unclaimed planet (1 tile from home) - uses real planet ID "abyz"
        createMockTile({ q: 0, r: 2 }, {
          systemId: 20,
          planets: [{ planetId: 'abyz', controlledBy: null, exhausted: false, units: [] } as any],
        }),
        // Another adjacent tile with real planet "fria"
        createMockTile({ q: 1, r: 2 }, {
          systemId: 21,
          planets: [{ planetId: 'fria', controlledBy: null, exhausted: false, units: [] } as any],
        }),
      ],
      playerCount: 6,
    },
    objectives: {
      revealedCount: 0,
      secretDeck: [],
      publicStageI: [],
      publicStageII: [],
    },
    laws: [],
    actionCardDeck: [],
    agendaDeck: [],
    relicDeck: [],
    strategyCards: [{ number: 8, name: 'Imperial', pickedBy: 'player1', bonus: 0 }],
    strategyCardState: {},
    log: [],
    settings: {
      victoryPointLimit: 10,
      gameDuration: 'full',
      mapType: 'standard',
    },
    speakerId: 'player1',
    ...overrides,
  } as GameState;
}

describe('Bot AI', () => {
  describe('generateBotAction', () => {
    it('should generate a tactical action when tactics tokens available and systems reachable', () => {
      const state = createMockGameState();

      const action = generateBotAction(state, 'player1');

      // Should take a tactical action when reachable systems with value exist
      expect(action).not.toBeNull();
      expect(action?.type).toBe('tactical_action');
    });

    it('should use strategy card if no tactical action available', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            commandTokens: { tactics: 0, fleet: 3, strategy: 2 }, // No tactics tokens
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('strategic_action');
    });

    it('should pass if no actions available', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            commandTokens: { tactics: 0, fleet: 3, strategy: 2 },
            strategyCardUsed: true,
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('pass');
    });

    it('should find ships in home system', () => {
      const state = createMockGameState();

      // Verify ships are in the home system
      const homeTile = state.map.tiles.find(t => t.systemId === 1);
      expect(homeTile).toBeDefined();
      expect(homeTile?.units.length).toBeGreaterThan(0);
      expect(homeTile?.units.some(u => u.type === 'carrier')).toBe(true);
    });
  });

  describe('getCurrentBotPlayerId', () => {
    it('should return active player if they are a bot', () => {
      const state = createMockGameState();
      const botIds = new Set(['player1']);

      const botId = getCurrentBotPlayerId(state, botIds);

      expect(botId).toBe('player1');
    });

    it('should return null if active player is not a bot', () => {
      const state = createMockGameState();
      const botIds = new Set<string>();

      const botId = getCurrentBotPlayerId(state, botIds);

      expect(botId).toBeNull();
    });
  });

  describe('Technology Research (strategic_primary)', () => {
    it('should choose a technology when using Technology strategy card', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'strategic_primary',
        players: [
          createMockPlayer({
            strategyCard: 7, // Technology
            technologies: [], // No techs yet
          }),
        ],
        strategicActionState: {
          cardNumber: 7,
          
          primaryResolved: false,
          secondaryOrder: [],
          currentSecondaryIndex: 0,
          secondaryResponses: {},
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('strategic_primary');
      // Should pick a tech (tier 1 tech since no prerequisites)
      const primaryAction = action as any;
      expect(primaryAction.choices?.firstTechId).toBeDefined();
    });

    it('should prefer high-value technologies like Neural Motivator and Sarween Tools', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'strategic_primary',
        players: [
          createMockPlayer({
            strategyCard: 7,
            technologies: [], // No techs - can only get tier 1
          }),
        ],
        strategicActionState: {
          cardNumber: 7,
          
          primaryResolved: false,
          secondaryOrder: [],
          currentSecondaryIndex: 0,
          secondaryResponses: {},
        },
      });

      const action = generateBotAction(state, 'player1');
      const primaryAction = action as any;

      // Should pick one of the high-value tier 1 techs
      const goodTier1Techs = [
        'neural_motivator',
        'sarween_tools',
        'antimass_deflectors',
        'plasma_scoring',
        'psychoarchaeology',
        'dark_energy_tap',
        'scanlink_drone_network',
        'ai_development_algorithm',
      ];
      expect(goodTier1Techs).toContain(primaryAction.choices?.firstTechId);
    });

    it('should prioritize faction technologies when available', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'strategic_primary',
        players: [
          createMockPlayer({
            faction: 'sol',
            strategyCard: 7,
            // Sol faction tech (Spec Ops II) requires 2 green
            technologies: ['neural_motivator', 'psychoarchaeology'],
          }),
        ],
        strategicActionState: {
          cardNumber: 7,
          
          primaryResolved: false,
          secondaryOrder: [],
          currentSecondaryIndex: 0,
          secondaryResponses: {},
        },
      });

      const action = generateBotAction(state, 'player1');
      const primaryAction = action as any;

      // Sol's faction tech (spec_ops_ii) should be highly valued
      // It requires 2 green which we have
      expect(primaryAction.choices?.firstTechId).toBe('spec_ops_ii');
    });
  });

  describe('Objective-Aware Targeting', () => {
    it('should prioritize tech specialty planets when Found Research Outposts is revealed', () => {
      const state = createMockGameState({
        objectives: {
          revealedCount: 0,
          secretDeck: [],
          publicStageI: [
            { id: 'found_research_outposts', revealed: true, scoredBy: [] },
          ],
          publicStageII: [],
        },
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, { systemId: 18, planets: [{ planetId: 'mecatol_rex', controlledBy: null, exhausted: false, units: [] } as any] }),
            // Home system
            createMockTile({ q: 0, r: 3 }, {
              systemId: 1,
              planets: [{ planetId: 'jord', controlledBy: 'player1', exhausted: false, units: [] } as any],
              units: [
                createMockUnit({ id: 'carrier-1', type: 'carrier', ownerId: 'player1' }),
              ],
            }),
            // Adjacent tile - uses Wellon which has tech specialty
            createMockTile({ q: 0, r: 2 }, {
              systemId: 27, // Wellon has yellow tech specialty
              planets: [{ planetId: 'wellon', controlledBy: null, exhausted: false, units: [] } as any],
            }),
            // Another adjacent tile - regular planet
            createMockTile({ q: 1, r: 2 }, {
              systemId: 20,
              planets: [{ planetId: 'abyz', controlledBy: null, exhausted: false, units: [] } as any],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('tactical_action');
      // Should prefer the tech specialty planet system
      const tacticalAction = action as any;
      // The bot should pick wellon (tech specialty) over abyz (no specialty)
      expect(tacticalAction.systemPosition).toEqual({ q: 0, r: 2 });
    });

    it('should value systems adjacent to Mecatol for Intimidate Council objective', () => {
      const state = createMockGameState({
        objectives: {
          revealedCount: 0,
          secretDeck: [],
          publicStageI: [
            { id: 'intimidate_council', revealed: true, scoredBy: [] },
          ],
          publicStageII: [],
        },
        map: {
          tiles: [
            // Mecatol is NOT accessible (no path), so bot won't pick it
            createMockTile({ q: 0, r: 0 }, { systemId: 18, planets: [{ planetId: 'mecatol_rex', controlledBy: null, exhausted: false, units: [] } as any] }),
            // Adjacent to Mecatol - valuable for Intimidate Council
            createMockTile({ q: 1, r: 0 }, {
              systemId: 19,
              planets: [{ planetId: 'abyz', controlledBy: null, exhausted: false, units: [] } as any],
            }),
            // Another system NOT adjacent to Mecatol - less valuable
            createMockTile({ q: 2, r: 0 }, {
              systemId: 20,
              planets: [{ planetId: 'fria', controlledBy: null, exhausted: false, units: [] } as any],
            }),
            // Home system with ships
            createMockTile({ q: 3, r: 0 }, {
              systemId: 1,
              planets: [{ planetId: 'jord', controlledBy: 'player1', exhausted: false, units: [] } as any],
              units: [
                createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' }),
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('tactical_action');
      // Should prefer the system adjacent to Mecatol (1,0) over the non-adjacent one (2,0)
      // because of the Intimidate Council bonus
      const tacticalAction = action as any;
      expect(tacticalAction.systemPosition).toEqual({ q: 1, r: 0 });
    });
  });

  describe('Smart Production', () => {
    it('should produce carriers when needed for expansion', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'tactical_production',
        activatedSystem: { q: 0, r: 3 },
        players: [
          createMockPlayer({
            // No carriers currently - should prioritize building one
            commandTokens: { tactics: 3, fleet: 5, strategy: 2 },
            // Give the player planets with resources to spend
            planets: [
              { planetId: 'jord', exhausted: false, attachments: [] },
              { planetId: 'centauri', exhausted: false, attachments: [] }, // More resources
            ],
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 3 }, {
              systemId: 1,
              planets: [{
                planetId: 'jord',
                controlledBy: 'player1',
                exhausted: false,
                units: [{ id: 'dock-1', type: 'space_dock', ownerId: 'player1', damaged: false } as any],
              } as any, {
                planetId: 'centauri', // Add second planet with resources
                controlledBy: 'player1',
                exhausted: false,
                units: [],
              } as any],
              units: [], // No carriers
            }),
            // Nearby unclaimed planets (need carriers to reach)
            createMockTile({ q: 0, r: 2 }, {
              systemId: 20,
              planets: [{ planetId: 'abyz', controlledBy: null, exhausted: false, units: [] } as any],
            }),
            createMockTile({ q: 1, r: 2 }, {
              systemId: 21,
              planets: [{ planetId: 'fria', controlledBy: null, exhausted: false, units: [] } as any],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('produce_units');
      const produceAction = action as any;
      // Should include a carrier for expansion
      const hasCarrier = produceAction.units.some((u: any) => u.type === 'carrier');
      expect(hasCarrier).toBe(true);
    });

    it('should produce infantry when planets need to be claimed', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'tactical_production',
        activatedSystem: { q: 0, r: 3 },
        players: [
          createMockPlayer({
            commandTokens: { tactics: 3, fleet: 5, strategy: 2 },
            planets: [
              { planetId: 'jord', exhausted: false, attachments: [] },
              { planetId: 'centauri', exhausted: false, attachments: [] },
            ],
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 3 }, {
              systemId: 1,
              planets: [{
                planetId: 'jord',
                controlledBy: 'player1',
                exhausted: false,
                units: [{ id: 'dock-1', type: 'space_dock', ownerId: 'player1', damaged: false } as any],
              } as any, {
                planetId: 'centauri',
                controlledBy: 'player1',
                exhausted: false,
                units: [],
              } as any],
              units: [
                createMockUnit({ id: 'carrier-1', type: 'carrier', ownerId: 'player1' }),
                createMockUnit({ id: 'carrier-2', type: 'carrier', ownerId: 'player1' }),
              ],
            }),
            // Nearby unclaimed planets
            createMockTile({ q: 0, r: 2 }, {
              systemId: 20,
              planets: [{ planetId: 'abyz', controlledBy: null, exhausted: false, units: [] } as any],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('produce_units');
      const produceAction = action as any;
      // Should include infantry for claiming planets
      const hasInfantry = produceAction.units.some((u: any) => u.type === 'infantry');
      expect(hasInfantry).toBe(true);
    });
  });

  describe('Agenda Voting', () => {
    it('should vote against harmful agendas like fleet_regulations', () => {
      const state = createMockGameState({
        phase: 'agenda',
        subPhase: 'voting',
        agendaPhase: {
          currentAgendaId: 'fleet_regulations',
          currentElectionType: 'for_against',
          votingOrder: ['player1'],
          currentVoterIndex: 0,
          votes: {},
          agendaNumber: 1,
          currentStep: 'voting',
          currentAgendaType: 'directive',
          votingComplete: [],
          voteTallies: {},
          riders: [],
          vetoed: false,
          electedOutcome: null,
          electedPlayer: null,
          electedPlanet: null,
        },
        players: [
          createMockPlayer({
            planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('cast_vote');
      expect((action as any).outcome).toBe('against');
    });

    it('should vote for beneficial agendas like articles_of_war', () => {
      const state = createMockGameState({
        phase: 'agenda',
        subPhase: 'voting',
        agendaPhase: {
          currentAgendaId: 'articles_of_war',
          currentElectionType: 'for_against',
          votingOrder: ['player1'],
          currentVoterIndex: 0,
          votes: {},
          agendaNumber: 1,
          currentStep: 'voting',
          currentAgendaType: 'directive',
          votingComplete: [],
          voteTallies: {},
          riders: [],
          vetoed: false,
          electedOutcome: null,
          electedPlayer: null,
          electedPlanet: null,
        },
        players: [
          createMockPlayer({
            planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('cast_vote');
      expect((action as any).outcome).toBe('for');
    });

    it('should vote for self in beneficial player elections', () => {
      const state = createMockGameState({
        phase: 'agenda',
        subPhase: 'voting',
        agendaPhase: {
          currentAgendaId: 'committee_formation',
          currentElectionType: 'player',
          votingOrder: ['player1'],
          currentVoterIndex: 0,
          votes: {},
          agendaNumber: 1,
          currentStep: 'voting',
          currentAgendaType: 'directive',
          votingComplete: [],
          voteTallies: {},
          riders: [],
          vetoed: false,
          electedOutcome: null,
          electedPlayer: null,
          electedPlanet: null,
        },
        players: [
          createMockPlayer({
            planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('cast_vote');
      expect((action as any).outcome).toBe('player1');
    });

    it('should vote for leading player in negative player elections', () => {
      const state = createMockGameState({
        phase: 'agenda',
        subPhase: 'voting',
        agendaPhase: {
          currentAgendaId: 'political_censure',
          currentElectionType: 'player',
          votingOrder: ['player1'],
          currentVoterIndex: 0,
          votes: {},
          agendaNumber: 1,
          currentStep: 'voting',
          currentAgendaType: 'directive',
          votingComplete: [],
          voteTallies: {},
          riders: [],
          vetoed: false,
          electedOutcome: null,
          electedPlayer: null,
          electedPlanet: null,
        },
        players: [
          createMockPlayer({
            id: 'player1',
            score: 3,
            planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
          }),
          createMockPlayer({
            id: 'player2',
            score: 7, // Leading player
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('cast_vote');
      // Should vote for the leading player (player2)
      expect((action as any).outcome).toBe('player2');
    });
  });

  describe('Token Distribution', () => {
    it('should prioritize tactics tokens early game for expansion', () => {
      const state = createMockGameState({
        phase: 'status',
        subPhase: 'gain_redistribute_tokens',
        statusPhase: {
          currentStep: 5, // gain_redistribute_tokens
          scoringComplete: ['player1'],
          scoredThisPhase: [],
          redistributionComplete: [],
        },
        players: [
          createMockPlayer({
            commandTokens: { tactics: 2, fleet: 2, strategy: 2 },
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('redistribute_tokens');
      const distribution = (action as any).distribution;
      // Should have at least 3 tactics tokens for expansion
      expect(distribution.tactics).toBeGreaterThanOrEqual(3);
    });

    it('should increase fleet supply when fleet size grows', () => {
      const state = createMockGameState({
        phase: 'status',
        subPhase: 'gain_redistribute_tokens',
        round: 3,
        statusPhase: {
          currentStep: 5, // gain_redistribute_tokens
          scoringComplete: ['player1'],
          scoredThisPhase: [],
          redistributionComplete: [],
        },
        players: [
          createMockPlayer({
            commandTokens: { tactics: 2, fleet: 2, strategy: 2 },
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              units: [
                // Large fleet - needs fleet supply
                createMockUnit({ type: 'carrier', ownerId: 'player1' }),
                createMockUnit({ type: 'carrier', ownerId: 'player1' }),
                createMockUnit({ type: 'cruiser', ownerId: 'player1' }),
                createMockUnit({ type: 'cruiser', ownerId: 'player1' }),
                createMockUnit({ type: 'dreadnought', ownerId: 'player1' }),
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('redistribute_tokens');
      const distribution = (action as any).distribution;
      // Should have fleet supply to support 5 ships
      expect(distribution.fleet).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Objective Scoring', () => {
    it('should not try to score objectives when requirements not met', () => {
      const state = createMockGameState({
        phase: 'status',
        subPhase: 'score_objectives',
        statusPhase: {
          currentStep: 1, // score_objectives
          scoringComplete: [],
          scoredThisPhase: [],
          redistributionComplete: [],
        },
        players: [
          createMockPlayer({
            technologies: [], // No techs
            scoredObjectives: [],
          }),
        ],
        objectives: {
          revealedCount: 0,
          secretDeck: [],
          // Objective requires 2 techs in same color - player has none
          publicStageI: [
            { id: 'diversify_research', revealed: true, scoredBy: [] },
          ],
          publicStageII: [],
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('skip_scoring');
    });

    it('should score objectives when requirements are met', () => {
      const state = createMockGameState({
        phase: 'status',
        subPhase: 'score_objectives',
        statusPhase: {
          currentStep: 1, // score_objectives
          scoringComplete: [],
          scoredThisPhase: [],
          redistributionComplete: [],
        },
        players: [
          createMockPlayer({
            // Has 2 blue techs - meets "diversify_research" (2 tech in 2 colors) NO
            // Actually diversify_research needs 2 in 2 colors, let's use a simpler objective
            technologies: ['antimass_deflectors', 'gravity_drive', 'neural_motivator', 'dacxive_animators'],
            scoredObjectives: [],
            // Need to control home system for public objectives
            planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
          }),
        ],
        map: {
          tiles: [
            // Sol home system with player controlling the planet
            createMockTile({ q: 0, r: 3 }, {
              systemId: 1, // Sol home
              planets: [{ planetId: 'jord', controlledBy: 'player1', exhausted: false, units: [] } as any],
            }),
          ],
          playerCount: 6,
        },
        objectives: {
          revealedCount: 0,
          secretDeck: [],
          // diversify_research: 2 tech in 2 different colors
          publicStageI: [
            { id: 'diversify_research', revealed: true, scoredBy: [] },
          ],
          publicStageII: [],
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('score_objective');
      expect((action as any).objectiveId).toBe('diversify_research');
    });

    it('should not score already-scored objectives', () => {
      const state = createMockGameState({
        phase: 'status',
        subPhase: 'score_objectives',
        statusPhase: {
          currentStep: 1, // score_objectives
          scoringComplete: [],
          scoredThisPhase: [],
          redistributionComplete: [],
        },
        players: [
          createMockPlayer({
            technologies: ['antimass_deflectors', 'gravity_drive', 'neural_motivator', 'dacxive_animators'],
            scoredObjectives: ['diversify_research'], // Already scored this one
            planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 3 }, {
              systemId: 1,
              planets: [{ planetId: 'jord', controlledBy: 'player1', exhausted: false, units: [] } as any],
            }),
          ],
          playerCount: 6,
        },
        objectives: {
          revealedCount: 0,
          secretDeck: [],
          publicStageI: [
            { id: 'diversify_research', revealed: true, scoredBy: ['player1'] },
          ],
          publicStageII: [],
        },
      });

      const action = generateBotAction(state, 'player1');

      // Should skip since the only objective is already scored
      expect(action).not.toBeNull();
      expect(action?.type).toBe('skip_scoring');
    });
  });

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  describe('isBot', () => {
    it('should return true if player is in bot set', () => {
      const state = createMockGameState();
      const botIds = new Set(['player1', 'player2']);

      expect(isBot(state, 'player1', botIds)).toBe(true);
      expect(isBot(state, 'player2', botIds)).toBe(true);
    });

    it('should return false if player is not in bot set', () => {
      const state = createMockGameState();
      const botIds = new Set(['player2']);

      expect(isBot(state, 'player1', botIds)).toBe(false);
    });
  });

  describe('getBotActionDelay', () => {
    it('should return shorter delays for harder difficulties', () => {
      const easyDelay = getBotActionDelay('easy');
      const mediumDelay = getBotActionDelay('medium');
      const hardDelay = getBotActionDelay('hard');

      // Easy: 2000-3000ms, Medium: 1000-2000ms, Hard: 500-1000ms
      expect(easyDelay).toBeGreaterThanOrEqual(2000);
      expect(easyDelay).toBeLessThanOrEqual(3000);

      expect(mediumDelay).toBeGreaterThanOrEqual(1000);
      expect(mediumDelay).toBeLessThanOrEqual(2000);

      expect(hardDelay).toBeGreaterThanOrEqual(500);
      expect(hardDelay).toBeLessThanOrEqual(1000);
    });
  });

  // ==========================================================================
  // SETUP PHASE
  // ==========================================================================

  describe('Setup Phase', () => {
    it('should select a secret objective when two are available', () => {
      const state = createMockGameState({
        phase: 'setup',
        subPhase: 'select_secret',
        players: [
          createMockPlayer({
            secretObjectives: ['destroy_their_greatest_ship', 'spark_a_rebellion'],
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('select_secret_objective');
      const selectAction = action as any;
      expect(selectAction.selectedObjectiveId).toBeDefined();
      expect(selectAction.discardedObjectiveId).toBeDefined();
      expect(selectAction.selectedObjectiveId).not.toBe(selectAction.discardedObjectiveId);
    });

    it('should return null if only one secret objective', () => {
      const state = createMockGameState({
        phase: 'setup',
        subPhase: 'select_secret',
        players: [
          createMockPlayer({
            secretObjectives: ['destroy_their_greatest_ship'], // Only 1 - already selected
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).toBeNull();
    });
  });

  // ==========================================================================
  // STRATEGY PHASE
  // ==========================================================================

  describe('Strategy Phase', () => {
    it('should pick Imperial as highest priority when available', () => {
      const state = createMockGameState({
        phase: 'strategy',
        subPhase: 'pick_strategy_card',
        players: [
          createMockPlayer({
            strategyCard: null, // No card yet
          }),
        ],
        strategyCards: [
          { number: 1, name: 'Leadership', pickedBy: null, bonus: 0 },
          { number: 8, name: 'Imperial', pickedBy: null, bonus: 0 },
          { number: 3, name: 'Politics', pickedBy: null, bonus: 0 },
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('pick_strategy_card');
      expect((action as any).cardNumber).toBe(8); // Imperial is highest priority
    });

    it('should pick Construction if Imperial is taken', () => {
      const state = createMockGameState({
        phase: 'strategy',
        subPhase: 'pick_strategy_card',
        players: [
          createMockPlayer({
            strategyCard: null,
          }),
        ],
        strategyCards: [
          { number: 1, name: 'Leadership', pickedBy: null, bonus: 0 },
          { number: 4, name: 'Construction', pickedBy: null, bonus: 0 },
          { number: 8, name: 'Imperial', pickedBy: 'player2', bonus: 0 }, // Taken
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('pick_strategy_card');
      expect((action as any).cardNumber).toBe(4); // Construction is next priority
    });

    it('should return null if player already has a strategy card', () => {
      const state = createMockGameState({
        phase: 'strategy',
        subPhase: 'pick_strategy_card',
        players: [
          createMockPlayer({
            strategyCard: 8, // Already has Imperial
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).toBeNull();
    });
  });

  // ==========================================================================
  // COMBAT
  // ==========================================================================

  describe('Combat Actions', () => {
    // Note: Retreat decision tests require complex state setup that the bot AI
    // validates thoroughly. These tests verify hit assignment which is simpler.

    it('should assign hits using sustain damage first', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'space_combat',
        activeCombat: {
          id: 'combat1',
          systemId: 'tile-0-1',
          attackerId: 'player1',
          defenderId: 'player2',
          type: 'space',
          round: 1,
          state: 'combat_round_assign',
          pendingHits: { attacker: 2, defender: 0 },
          retreatAnnounced: { attacker: false, defender: false },
        } as any,
        players: [createMockPlayer()],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 1 }, {
              id: 'tile-0-1',
              systemId: 19,
              units: [
                createMockUnit({ id: 'dread-1', type: 'dreadnought', ownerId: 'player1', damaged: false }),
                createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' }),
                createMockUnit({ id: 'fighter-1', type: 'fighter', ownerId: 'player1' }),
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('assign_hits');
      const assignments = (action as any).assignments;
      // Should sustain on dreadnought first, then sacrifice fighter
      const dreadAssignment = assignments.find((a: any) => a.unitId === 'dread-1');
      expect(dreadAssignment?.sustainDamage).toBe(true);
      expect(dreadAssignment?.destroyed).toBe(false);
    });

    it('should sacrifice fighters before cruisers', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'space_combat',
        activeCombat: {
          id: 'combat1',
          systemId: 'tile-0-1',
          attackerId: 'player1',
          defenderId: 'player2',
          type: 'space',
          round: 1,
          state: 'combat_round_assign',
          pendingHits: { attacker: 1, defender: 0 },
          retreatAnnounced: { attacker: false, defender: false },
        } as any,
        players: [createMockPlayer()],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 1 }, {
              id: 'tile-0-1',
              systemId: 19,
              units: [
                createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' }),
                createMockUnit({ id: 'fighter-1', type: 'fighter', ownerId: 'player1' }),
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('assign_hits');
      const assignments = (action as any).assignments;
      // Should destroy fighter before cruiser
      const destroyedUnit = assignments.find((a: any) => a.destroyed);
      expect(destroyedUnit?.unitId).toBe('fighter-1');
    });
  });

  // ==========================================================================
  // INVASION
  // ==========================================================================

  describe('Invasion Actions', () => {
    it('should select invasion targets when ground forces available', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'invasion',
        activatedSystem: { q: 0, r: 2 },
        invasionPhase: {
          currentStep: 'select_planets',
          targetPlanets: [],
          groundForceCommitments: {},
          bombardmentComplete: false,
        } as any,
        players: [createMockPlayer()],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 2 }, {
              systemId: 20,
              planets: [
                { planetId: 'abyz', controlledBy: null, exhausted: false, units: [] } as any,
                { planetId: 'fria', controlledBy: 'player2', exhausted: false, units: [] } as any,
              ],
              units: [
                createMockUnit({ type: 'infantry', ownerId: 'player1' }),
                createMockUnit({ type: 'infantry', ownerId: 'player1' }),
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('select_invasion_targets');
      const targets = (action as any).targetPlanets;
      expect(targets).toContain('abyz');
      expect(targets).toContain('fria');
    });

    it('should skip invasion if no ground forces', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'invasion',
        activatedSystem: { q: 0, r: 2 },
        invasionPhase: {
          currentStep: 'select_planets',
          targetPlanets: [],
          groundForceCommitments: {},
          bombardmentComplete: false,
        } as any,
        players: [createMockPlayer()],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 2 }, {
              systemId: 20,
              planets: [
                { planetId: 'abyz', controlledBy: null, exhausted: false, units: [] } as any,
              ],
              units: [
                createMockUnit({ type: 'cruiser', ownerId: 'player1' }), // No ground forces
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('skip_invasion');
    });

    it('should commit ground forces to target planets', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'invasion',
        activatedSystem: { q: 0, r: 2 },
        invasionPhase: {
          currentStep: 'commit_ground_forces',
          targetPlanets: ['abyz', 'fria'],
          groundForceCommitments: {},
          bombardmentComplete: false,
        } as any,
        players: [createMockPlayer()],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 2 }, {
              systemId: 20,
              planets: [
                { planetId: 'abyz', controlledBy: null, exhausted: false, units: [] } as any,
                { planetId: 'fria', controlledBy: null, exhausted: false, units: [] } as any,
              ],
              units: [
                createMockUnit({ id: 'inf-1', type: 'infantry', ownerId: 'player1' }),
                createMockUnit({ id: 'inf-2', type: 'infantry', ownerId: 'player1' }),
                createMockUnit({ id: 'inf-3', type: 'infantry', ownerId: 'player1' }),
                createMockUnit({ id: 'inf-4', type: 'infantry', ownerId: 'player1' }),
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('commit_ground_forces');
      const assignments = (action as any).assignments;
      expect(assignments.length).toBe(4); // All 4 infantry committed
      // Should distribute evenly
      const abyzCount = assignments.filter((a: any) => a.planetId === 'abyz').length;
      const friaCount = assignments.filter((a: any) => a.planetId === 'fria').length;
      expect(abyzCount).toBe(2);
      expect(friaCount).toBe(2);
    });
  });

  // ==========================================================================
  // MOVEMENT
  // ==========================================================================

  describe('Movement Actions', () => {
    it('should move ships to activated system', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'tactical_movement',
        activatedSystem: { q: 0, r: 2 },
        players: [createMockPlayer()],
        map: {
          tiles: [
            // Target system
            createMockTile({ q: 0, r: 2 }, {
              systemId: 20,
              planets: [{ planetId: 'abyz', controlledBy: null, exhausted: false, units: [] } as any],
              units: [],
            }),
            // Home system with ships
            createMockTile({ q: 0, r: 3 }, {
              systemId: 1,
              planets: [{ planetId: 'jord', controlledBy: 'player1', exhausted: false, units: [] } as any],
              units: [
                createMockUnit({ id: 'carrier-1', type: 'carrier', ownerId: 'player1' }),
                createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' }),
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('move_units');
      const moves = (action as any).moves;
      expect(moves.length).toBeGreaterThan(0);
      // All moves should target the activated system
      moves.forEach((move: any) => {
        expect(move.to.systemPosition).toEqual({ q: 0, r: 2 });
      });
    });

    it('should skip movement if no ships can reach', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'tactical_movement',
        activatedSystem: { q: 5, r: 5 }, // Far away
        players: [createMockPlayer()],
        map: {
          tiles: [
            // Target system - far away
            createMockTile({ q: 5, r: 5 }, {
              systemId: 20,
              planets: [{ planetId: 'abyz', controlledBy: null, exhausted: false, units: [] } as any],
              units: [],
            }),
            // Home system with ships (move value 1-2, can't reach q:5,r:5)
            createMockTile({ q: 0, r: 3 }, {
              systemId: 1,
              planets: [{ planetId: 'jord', controlledBy: 'player1', exhausted: false, units: [] } as any],
              units: [
                createMockUnit({ id: 'cruiser-1', type: 'cruiser', ownerId: 'player1' }),
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('skip_movement');
    });
  });

  // ==========================================================================
  // STRATEGIC PRIMARY ACTIONS
  // ==========================================================================

  describe('Strategic Primary Actions', () => {
    it('should generate Leadership primary with token distribution', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'strategic_primary',
        strategicActionState: {
          cardNumber: 1, // Leadership
          primaryResolved: false,
          secondaryOrder: [],
          currentSecondaryIndex: 0,
          secondaryResponses: {},
        },
        players: [createMockPlayer({ strategyCard: 1 })],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('strategic_primary');
      const choices = (action as any).choices;
      expect(choices.tokenDistribution).toBeDefined();
      expect(choices.tokenDistribution.tactics + choices.tokenDistribution.fleet + choices.tokenDistribution.strategy).toBe(3);
    });

    it('should generate Construction primary with structure placement', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'strategic_primary',
        strategicActionState: {
          cardNumber: 4, // Construction
          primaryResolved: false,
          secondaryOrder: [],
          currentSecondaryIndex: 0,
          secondaryResponses: {},
        },
        players: [
          createMockPlayer({
            strategyCard: 4,
            planets: [{ planetId: 'abyz', exhausted: false, attachments: [] }],
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 2 }, {
              systemId: 20,
              planets: [{
                planetId: 'abyz',
                controlledBy: 'player1',
                exhausted: false,
                units: [], // No space dock
              } as any],
            }),
          ],
          playerCount: 6,
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('strategic_primary');
      const choices = (action as any).choices;
      expect(choices.firstStructure).toBeDefined();
      expect(choices.firstStructure.type).toBe('space_dock');
    });

    it('should generate Warfare primary with token redistribution', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'strategic_primary',
        strategicActionState: {
          cardNumber: 6, // Warfare
          primaryResolved: false,
          secondaryOrder: [],
          currentSecondaryIndex: 0,
          secondaryResponses: {},
        },
        players: [
          createMockPlayer({
            strategyCard: 6,
            commandTokens: { tactics: 2, fleet: 3, strategy: 1 },
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('strategic_primary');
      const choices = (action as any).choices;
      expect(choices.newTokenDistribution).toBeDefined();
      // Should add 1 to tactics
      expect(choices.newTokenDistribution.tactics).toBe(3);
    });

    it('should generate Imperial primary to score objective if possible', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'strategic_primary',
        strategicActionState: {
          cardNumber: 8, // Imperial
          primaryResolved: false,
          secondaryOrder: [],
          currentSecondaryIndex: 0,
          secondaryResponses: {},
        },
        players: [
          createMockPlayer({
            strategyCard: 8,
            technologies: ['antimass_deflectors', 'gravity_drive', 'neural_motivator', 'dacxive_animators'],
            scoredObjectives: [],
            planets: [{ planetId: 'jord', exhausted: false, attachments: [] }],
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 3 }, {
              systemId: 1,
              planets: [{ planetId: 'jord', controlledBy: 'player1', exhausted: false, units: [] } as any],
            }),
          ],
          playerCount: 6,
        },
        objectives: {
          revealedCount: 0,
          secretDeck: [],
          publicStageI: [
            { id: 'diversify_research', revealed: true, scoredBy: [] },
          ],
          publicStageII: [],
        },
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('strategic_primary');
      const choices = (action as any).choices;
      expect(choices.scoredObjectiveId).toBe('diversify_research');
    });
  });

  // ==========================================================================
  // STRATEGIC SECONDARY ACTIONS
  // ==========================================================================

  describe('Strategic Secondary Actions', () => {
    it('should decline secondary if no strategy tokens', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'strategic_secondary',
        activePlayerId: 'player2', // Different player is active
        strategicActionState: {
          cardNumber: 7, // Technology
          primaryResolved: true,
          secondaryOrder: ['player1'],
          currentSecondaryIndex: 0,
          secondaryResponses: {},
        },
        players: [
          createMockPlayer({
            commandTokens: { tactics: 3, fleet: 3, strategy: 0 }, // No strategy tokens
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('strategic_secondary');
      expect((action as any).declined).toBe(true);
    });

    it('should use Trade secondary to replenish commodities', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'strategic_secondary',
        activePlayerId: 'player2',
        strategicActionState: {
          cardNumber: 5, // Trade
          primaryResolved: true,
          secondaryOrder: ['player1'],
          currentSecondaryIndex: 0,
          secondaryResponses: {},
        },
        players: [
          createMockPlayer({
            commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
            commodities: 0,
            maxCommodities: 4,
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('strategic_secondary');
      expect((action as any).declined).toBe(false); // Should use to get commodities
    });

    it('should decline Trade secondary if already at max commodities', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'strategic_secondary',
        activePlayerId: 'player2',
        strategicActionState: {
          cardNumber: 5, // Trade
          primaryResolved: true,
          secondaryOrder: ['player1'],
          currentSecondaryIndex: 0,
          secondaryResponses: {},
        },
        players: [
          createMockPlayer({
            commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
            commodities: 4, // Already at max
            maxCommodities: 4,
          }),
        ],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('strategic_secondary');
      expect((action as any).declined).toBe(true); // No benefit
    });
  });

  // ==========================================================================
  // TIMING WINDOWS
  // ==========================================================================

  describe('Timing Windows', () => {
    it('should pass on timing windows', () => {
      const state = createMockGameState({
        phase: 'action',
        activeTimingWindow: {
          id: 'window1',
          type: 'after_activation',
          triggerPlayerId: 'player1',
          eligiblePlayers: ['player1'],
          responses: { player1: 'pending' },
        } as any,
        players: [createMockPlayer()],
      });

      const action = generateBotAction(state, 'player1');

      expect(action).not.toBeNull();
      expect(action?.type).toBe('timing_window_response');
      expect((action as any).response).toBe('pass');
    });
  });

  // ==========================================================================
  // getCurrentBotPlayerId EDGE CASES
  // ==========================================================================

  describe('getCurrentBotPlayerId edge cases', () => {
    it('should return bot in combat hit assignment phase', () => {
      const state = createMockGameState({
        phase: 'action',
        subPhase: 'space_combat',
        activeCombat: {
          id: 'combat1',
          systemId: 'tile-0-1',
          attackerId: 'player1',
          defenderId: 'player2',
          type: 'space',
          round: 1,
          state: 'combat_round_assign',
          pendingHits: { attacker: 2, defender: 0 }, // Attacker needs to assign
          retreatAnnounced: { attacker: false, defender: false },
        } as any,
      });

      const botIds = new Set(['player1']);
      const botId = getCurrentBotPlayerId(state, botIds);

      expect(botId).toBe('player1');
    });

    it('should return bot in timing window', () => {
      const state = createMockGameState({
        phase: 'action',
        activeTimingWindow: {
          id: 'window1',
          type: 'after_activation',
          triggerPlayerId: 'player2',
          eligiblePlayers: ['player1', 'player2'],
          responses: { player1: 'pending', player2: 'pass' },
        } as any,
      });

      const botIds = new Set(['player1']);
      const botId = getCurrentBotPlayerId(state, botIds);

      expect(botId).toBe('player1');
    });

    it('should return bot in status phase scoring', () => {
      const state = createMockGameState({
        phase: 'status',
        subPhase: 'score_objectives',
        statusPhase: {
          currentStep: 1,
          scoringComplete: [], // No one has scored yet
          scoredThisPhase: [],
          redistributionComplete: [],
        },
        players: [
          createMockPlayer({ id: 'player1' }),
          createMockPlayer({ id: 'player2' }),
        ],
      });

      const botIds = new Set(['player1']);
      const botId = getCurrentBotPlayerId(state, botIds);

      expect(botId).toBe('player1');
    });
  });
});
