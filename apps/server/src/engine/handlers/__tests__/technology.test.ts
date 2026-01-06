import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleResearchTechnology,
  getResearchableTechnologies,
  getAvailableTechnologies,
  placeAssimilatorToken,
  isTechAssimilated,
  hasEffectiveFactionTech,
  getAssimilatedTechs,
  getAssimilatableTechs,
  getAvailableAssimilatorToken,
} from '../technology.js';
import type {
  GameState,
  PlayerState,
  MapTile,
  HexCoord,
  ResearchTechnologyAction,
} from '@ti4/shared';

function createMockPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: 'player1',
    name: 'Test Player',
    faction: 'sol',
    color: 'blue',
    isBot: false,
    seatPosition: 0,
    victoryPoints: 0,
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
    strategyCard: null,
    passed: false,
    speaker: false,
    ...overrides,
  } as PlayerState;
}

function createMockTile(position: HexCoord, overrides: Partial<MapTile> = {}): MapTile {
  return {
    id: `tile-${position.q}-${position.r}`,
    systemId: 1,
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
    subPhase: 'strategic_primary',
    round: 1,
    turn: 1,
    activePlayerId: 'player1',
    version: 1,
    players: [createMockPlayer()],
    map: {
      tiles: [createMockTile({ q: 0, r: 0 })],
      playerCount: 6,
    },
    objectives: {
      publicStageI: [],
      publicStageII: [],
      revealedCount: 0,
      secretDeck: [],
    },
    laws: [],
    actionCardDeck: [],
    agendaDeck: [],
    relicDeck: [],
    strategyCardState: {},
    log: [],
    settings: {
      victoryPointLimit: 10,
      gameDuration: 'full',
      mapType: 'standard',
    },
    ...overrides,
  } as GameState;
}

describe('Technology Handlers', () => {
  describe('handleResearchTechnology', () => {
    it('should fail if player not found', () => {
      const state = createMockGameState();
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'nonexistent',
        techId: 'neural_motivator',
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if technology does not exist', () => {
      const state = createMockGameState();
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'fake_tech',
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown technology: fake_tech');
    });

    it('should fail if player already has the technology', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: ['neural_motivator'],
          }),
        ],
      });
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'neural_motivator',
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player already has this technology');
    });

    it('should fail if trying to research another faction\'s technology', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'sol', // Sol player
            technologies: [],
          }),
        ],
      });
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'e_res_siphons', // Hacan faction tech
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot research another faction\'s technology');
    });

    it('should fail if prerequisites not met', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: [], // No techs, can't get tier 2
          }),
        ],
      });
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'hyper_metabolism', // Requires 2 green
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prerequisites not met');
    });

    it('should successfully research a tier 1 technology', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: [],
          }),
        ],
      });
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'neural_motivator', // Tier 1 green, no prerequisites
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('technology_researched');
      expect(state.players[0].technologies).toContain('neural_motivator');
    });

    it('should successfully research a tier 2 technology with prerequisites', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: ['neural_motivator', 'psychoarchaeology'], // 2 green techs
          }),
        ],
      });
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'hyper_metabolism', // Tier 2 green, requires 2 green
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].technologies).toContain('hyper_metabolism');
    });

    it('should successfully research faction technology', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'sol',
            technologies: ['neural_motivator', 'psychoarchaeology'], // 2 green techs for prerequisites
          }),
        ],
      });
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'spec_ops_ii', // Sol faction tech, requires 2 green
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].technologies).toContain('spec_ops_ii');
    });

    it('should increment version after research', () => {
      const state = createMockGameState({
        version: 5,
        players: [createMockPlayer()],
      });
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'neural_motivator',
        timestamp: Date.now(),
      };

      const initialVersion = state.version;
      handleResearchTechnology(state, action);

      expect(state.version).toBe(initialVersion + 1);
    });

    it('should allow Jol-Nar to ignore one prerequisite', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'jolnar',
            technologies: ['neural_motivator'], // Only 1 green tech, but Jol-Nar can ignore 1 prereq
          }),
        ],
      });
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'hyper_metabolism', // Requires 2 green
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].technologies).toContain('hyper_metabolism');
    });
  });

  describe('getResearchableTechnologies', () => {
    it('should return empty array if player not found', () => {
      const state = createMockGameState();

      const result = getResearchableTechnologies(state, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should exclude already researched technologies', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: ['neural_motivator'],
          }),
        ],
      });

      const result = getResearchableTechnologies(state, 'player1');

      const techIds = result.map(t => t.id);
      expect(techIds).not.toContain('neural_motivator');
    });

    it('should exclude other faction\'s technologies', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'sol',
          }),
        ],
      });

      const result = getResearchableTechnologies(state, 'player1');

      // Sol should not see Hacan's faction tech
      const techIds = result.map(t => t.id);
      expect(techIds).not.toContain('e_res_siphons');
    });

    it('should include own faction technologies', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'sol',
          }),
        ],
      });

      const result = getResearchableTechnologies(state, 'player1');

      // Sol should see their own faction techs
      const techIds = result.map(t => t.id);
      expect(techIds).toContain('spec_ops_ii');
    });

    it('should include generic technologies', () => {
      const state = createMockGameState({
        players: [createMockPlayer()],
      });

      const result = getResearchableTechnologies(state, 'player1');

      const techIds = result.map(t => t.id);
      expect(techIds).toContain('neural_motivator');
      expect(techIds).toContain('sarween_tools');
      expect(techIds).toContain('antimass_deflectors');
    });
  });

  describe('getAvailableTechnologies', () => {
    it('should return empty array if player not found', () => {
      const state = createMockGameState();

      const result = getAvailableTechnologies(state, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should return empty array for Nekro Virus', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'nekro',
          }),
        ],
      });

      const result = getAvailableTechnologies(state, 'player1');

      expect(result).toEqual([]);
    });

    it('should return only techs with met prerequisites', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: [], // No techs
          }),
        ],
      });

      const result = getAvailableTechnologies(state, 'player1');

      // Should only include tier 1 techs (no prerequisites)
      const techIds = result.map(t => t.id);
      expect(techIds).toContain('neural_motivator'); // Tier 1
      expect(techIds).not.toContain('hyper_metabolism'); // Tier 2, requires 2 green
    });

    it('should include higher tier techs when prerequisites met', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: ['neural_motivator', 'psychoarchaeology'], // 2 green
          }),
        ],
      });

      const result = getAvailableTechnologies(state, 'player1');

      const techIds = result.map(t => t.id);
      expect(techIds).toContain('hyper_metabolism'); // Now accessible
    });

    it('should account for tech specialty planets for prerequisites', () => {
      // Player with a tech specialty planet should be able to ignore 1 prereq
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: ['neural_motivator'], // Only 1 green
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [{
                planetId: 'wellon', // Has cybernetic tech specialty
                controlledBy: 'player1',
                exhausted: false,
                units: [],
                attachments: [],
              }],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = getAvailableTechnologies(state, 'player1');
      const techIds = result.map(t => t.id);
      // With 1 green tech + 1 tech specialty, can research tier 2 (requires 2 green)
      expect(techIds).toContain('hyper_metabolism');
    });

    it('should not count exhausted tech specialty planets', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: ['neural_motivator'], // Only 1 green
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [{
                planetId: 'wellon', // Has tech specialty
                controlledBy: 'player1',
                exhausted: true, // Exhausted!
                units: [],
                attachments: [],
              }],
            }),
          ],
          playerCount: 6,
        },
      });

      const result = getAvailableTechnologies(state, 'player1');
      const techIds = result.map(t => t.id);
      // Without tech specialty (exhausted), can't research tier 2
      expect(techIds).not.toContain('hyper_metabolism');
    });
  });

  // ==========================================================================
  // NEKRO VIRUS - VALEFAR ASSIMILATOR TESTS
  // ==========================================================================

  describe('placeAssimilatorToken', () => {
    it('should fail if Nekro player not found', () => {
      const state = createMockGameState();

      const result = placeAssimilatorToken(
        state,
        'nonexistent',
        'e_res_siphons',
        'player2',
        'x'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should fail if player is not Nekro Virus', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'sol', // Not Nekro
          }),
        ],
      });

      const result = placeAssimilatorToken(
        state,
        'player1',
        'e_res_siphons',
        'player2',
        'x'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only Nekro Virus can use Valefar Assimilator');
    });

    it('should fail if Nekro does not have assimilator tech', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: [], // No assimilator tech
          }),
        ],
      });

      const result = placeAssimilatorToken(
        state,
        'nekro1',
        'e_res_siphons',
        'player2',
        'x'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Nekro does not have Valefar Assimilator X');
    });

    it('should fail if target tech does not exist', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: ['valefar_assimilator_x'],
          }),
        ],
      });

      const result = placeAssimilatorToken(
        state,
        'nekro1',
        'fake_tech',
        'player2',
        'x'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown technology');
    });

    it('should fail if target tech is not a faction tech', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: ['valefar_assimilator_x'],
          }),
          createMockPlayer({
            id: 'player2',
            faction: 'sol',
            technologies: ['neural_motivator'], // Generic tech, not faction tech
          }),
        ],
      });

      const result = placeAssimilatorToken(
        state,
        'nekro1',
        'neural_motivator',
        'player2',
        'x'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Valefar Assimilator can only copy faction technologies');
    });

    it('should fail if target player not found', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: ['valefar_assimilator_x'],
          }),
        ],
      });

      const result = placeAssimilatorToken(
        state,
        'nekro1',
        'e_res_siphons',
        'nonexistent',
        'x'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target player not found');
    });

    it('should fail if target player does not own the tech', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: ['valefar_assimilator_x'],
          }),
          createMockPlayer({
            id: 'player2',
            faction: 'hacan',
            technologies: [], // Does not have e_res_siphons
          }),
        ],
      });

      const result = placeAssimilatorToken(
        state,
        'nekro1',
        'e_res_siphons',
        'player2',
        'x'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target player does not own this technology');
    });

    it('should successfully place assimilator X token', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: ['valefar_assimilator_x'],
          }),
          createMockPlayer({
            id: 'player2',
            faction: 'hacan',
            technologies: ['e_res_siphons'],
          }),
        ],
      });

      const result = placeAssimilatorToken(
        state,
        'nekro1',
        'e_res_siphons',
        'player2',
        'x'
      );

      expect(result.success).toBe(true);
      expect(result.triggeredEvents).toContain('assimilator_placed');
      expect(result.data).toMatchObject({
        nekroPlayerId: 'nekro1',
        tokenType: 'x',
        targetTechId: 'e_res_siphons',
        targetPlayerId: 'player2',
      });
    });

    it('should successfully place assimilator Y token', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: ['valefar_assimilator_y'],
          }),
          createMockPlayer({
            id: 'player2',
            faction: 'sol',
            technologies: ['spec_ops_ii'],
          }),
        ],
      });

      const result = placeAssimilatorToken(
        state,
        'nekro1',
        'spec_ops_ii',
        'player2',
        'y'
      );

      expect(result.success).toBe(true);
      expect(result.data?.tokenType).toBe('y');
    });

    it('should fail if tech already has assimilator token', () => {
      const nekroPlayer = createMockPlayer({
        id: 'nekro1',
        faction: 'nekro',
        technologies: ['valefar_assimilator_x', 'valefar_assimilator_y'],
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        x: { targetTechId: 'e_res_siphons', targetPlayerId: 'player2' },
      };

      const state = createMockGameState({
        players: [
          nekroPlayer,
          createMockPlayer({
            id: 'player2',
            faction: 'hacan',
            technologies: ['e_res_siphons'],
          }),
        ],
      });

      // Try to place Y token on same tech
      const result = placeAssimilatorToken(
        state,
        'nekro1',
        'e_res_siphons',
        'player2',
        'y'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot place assimilator token on a technology that already has one');
    });
  });

  describe('isTechAssimilated', () => {
    it('should return false when no Nekro player exists', () => {
      const state = createMockGameState();

      const result = isTechAssimilated(state, 'e_res_siphons');

      expect(result).toBe(false);
    });

    it('should return false when Nekro has no assimilator tokens', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            faction: 'nekro',
          }),
        ],
      });

      const result = isTechAssimilated(state, 'e_res_siphons');

      expect(result).toBe(false);
    });

    it('should return true when tech has X token', () => {
      const nekroPlayer = createMockPlayer({
        faction: 'nekro',
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        x: { targetTechId: 'e_res_siphons', targetPlayerId: 'player2' },
      };

      const state = createMockGameState({
        players: [nekroPlayer],
      });

      const result = isTechAssimilated(state, 'e_res_siphons');

      expect(result).toBe(true);
    });

    it('should return true when tech has Y token', () => {
      const nekroPlayer = createMockPlayer({
        faction: 'nekro',
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        y: { targetTechId: 'spec_ops_ii', targetPlayerId: 'player2' },
      };

      const state = createMockGameState({
        players: [nekroPlayer],
      });

      const result = isTechAssimilated(state, 'spec_ops_ii');

      expect(result).toBe(true);
    });

    it('should return false for non-assimilated tech', () => {
      const nekroPlayer = createMockPlayer({
        faction: 'nekro',
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        x: { targetTechId: 'e_res_siphons', targetPlayerId: 'player2' },
      };

      const state = createMockGameState({
        players: [nekroPlayer],
      });

      const result = isTechAssimilated(state, 'spec_ops_ii'); // Different tech

      expect(result).toBe(false);
    });
  });

  describe('hasEffectiveFactionTech', () => {
    it('should return false if player not found', () => {
      const state = createMockGameState();

      const result = hasEffectiveFactionTech(state, 'nonexistent', 'e_res_siphons');

      expect(result).toBe(false);
    });

    it('should return true for direct tech ownership', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'hacan',
            technologies: ['e_res_siphons'],
          }),
        ],
      });

      const result = hasEffectiveFactionTech(state, 'player1', 'e_res_siphons');

      expect(result).toBe(true);
    });

    it('should return false when player does not have tech', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'hacan',
            technologies: [],
          }),
        ],
      });

      const result = hasEffectiveFactionTech(state, 'player1', 'e_res_siphons');

      expect(result).toBe(false);
    });

    it('should return true for Nekro via X assimilator', () => {
      const nekroPlayer = createMockPlayer({
        id: 'nekro1',
        faction: 'nekro',
        technologies: ['valefar_assimilator_x'],
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        x: { targetTechId: 'e_res_siphons', targetPlayerId: 'player2' },
      };

      const state = createMockGameState({
        players: [nekroPlayer],
      });

      const result = hasEffectiveFactionTech(state, 'nekro1', 'e_res_siphons');

      expect(result).toBe(true);
    });

    it('should return true for Nekro via Y assimilator', () => {
      const nekroPlayer = createMockPlayer({
        id: 'nekro1',
        faction: 'nekro',
        technologies: ['valefar_assimilator_y'],
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        y: { targetTechId: 'spec_ops_ii', targetPlayerId: 'player2' },
      };

      const state = createMockGameState({
        players: [nekroPlayer],
      });

      const result = hasEffectiveFactionTech(state, 'nekro1', 'spec_ops_ii');

      expect(result).toBe(true);
    });

    it('should return false for non-Nekro without direct ownership', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'sol', // Not Nekro, can't use assimilator
            technologies: [],
          }),
        ],
      });

      const result = hasEffectiveFactionTech(state, 'player1', 'e_res_siphons');

      expect(result).toBe(false);
    });
  });

  describe('getAssimilatedTechs', () => {
    it('should return empty array if player not found', () => {
      const state = createMockGameState();

      const result = getAssimilatedTechs(state, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should return empty array if player is not Nekro', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'sol',
          }),
        ],
      });

      const result = getAssimilatedTechs(state, 'player1');

      expect(result).toEqual([]);
    });

    it('should return empty array if Nekro has no tokens placed', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
          }),
        ],
      });

      const result = getAssimilatedTechs(state, 'nekro1');

      expect(result).toEqual([]);
    });

    it('should return X token tech', () => {
      const nekroPlayer = createMockPlayer({
        id: 'nekro1',
        faction: 'nekro',
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        x: { targetTechId: 'e_res_siphons', targetPlayerId: 'player2' },
      };

      const state = createMockGameState({
        players: [nekroPlayer],
      });

      const result = getAssimilatedTechs(state, 'nekro1');

      expect(result).toContain('e_res_siphons');
    });

    it('should return Y token tech', () => {
      const nekroPlayer = createMockPlayer({
        id: 'nekro1',
        faction: 'nekro',
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        y: { targetTechId: 'spec_ops_ii', targetPlayerId: 'player2' },
      };

      const state = createMockGameState({
        players: [nekroPlayer],
      });

      const result = getAssimilatedTechs(state, 'nekro1');

      expect(result).toContain('spec_ops_ii');
    });

    it('should return both X and Y token techs', () => {
      const nekroPlayer = createMockPlayer({
        id: 'nekro1',
        faction: 'nekro',
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        x: { targetTechId: 'e_res_siphons', targetPlayerId: 'player2' },
        y: { targetTechId: 'spec_ops_ii', targetPlayerId: 'player3' },
      };

      const state = createMockGameState({
        players: [nekroPlayer],
      });

      const result = getAssimilatedTechs(state, 'nekro1');

      expect(result).toHaveLength(2);
      expect(result).toContain('e_res_siphons');
      expect(result).toContain('spec_ops_ii');
    });
  });

  describe('getAssimilatableTechs', () => {
    it('should return empty array if player not found', () => {
      const state = createMockGameState();

      const result = getAssimilatableTechs(state, 'nonexistent');

      expect(result).toEqual([]);
    });

    it('should return empty array if player has no faction techs', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'hacan',
            technologies: ['neural_motivator'], // Generic tech only
          }),
        ],
      });

      const result = getAssimilatableTechs(state, 'player1');

      expect(result).toEqual([]);
    });

    it('should return faction techs that can be assimilated', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'hacan',
            technologies: ['e_res_siphons', 'production_biomes'],
          }),
        ],
      });

      const result = getAssimilatableTechs(state, 'player1');

      expect(result.length).toBeGreaterThan(0);
      const techIds = result.map(t => t.id);
      expect(techIds).toContain('e_res_siphons');
    });

    it('should exclude already assimilated techs', () => {
      const nekroPlayer = createMockPlayer({
        id: 'nekro1',
        faction: 'nekro',
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        x: { targetTechId: 'e_res_siphons', targetPlayerId: 'player1' },
      };

      const state = createMockGameState({
        players: [
          nekroPlayer,
          createMockPlayer({
            id: 'player1',
            faction: 'hacan',
            technologies: ['e_res_siphons', 'production_biomes'],
          }),
        ],
      });

      const result = getAssimilatableTechs(state, 'player1');

      const techIds = result.map(t => t.id);
      expect(techIds).not.toContain('e_res_siphons'); // Already assimilated
    });
  });

  describe('getAvailableAssimilatorToken', () => {
    it('should return null if player not found', () => {
      const state = createMockGameState();

      const result = getAvailableAssimilatorToken(state, 'nonexistent');

      expect(result).toBeNull();
    });

    it('should return null if player is not Nekro', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'player1',
            faction: 'sol',
          }),
        ],
      });

      const result = getAvailableAssimilatorToken(state, 'player1');

      expect(result).toBeNull();
    });

    it('should return null if Nekro has no assimilator techs', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: [],
          }),
        ],
      });

      const result = getAvailableAssimilatorToken(state, 'nekro1');

      expect(result).toBeNull();
    });

    it('should return x if X assimilator available', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: ['valefar_assimilator_x'],
          }),
        ],
      });

      const result = getAvailableAssimilatorToken(state, 'nekro1');

      expect(result).toBe('x');
    });

    it('should return y if only Y assimilator available', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: ['valefar_assimilator_y'],
          }),
        ],
      });

      const result = getAvailableAssimilatorToken(state, 'nekro1');

      expect(result).toBe('y');
    });

    it('should prefer X over Y when both available', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            id: 'nekro1',
            faction: 'nekro',
            technologies: ['valefar_assimilator_x', 'valefar_assimilator_y'],
          }),
        ],
      });

      const result = getAvailableAssimilatorToken(state, 'nekro1');

      expect(result).toBe('x');
    });

    it('should return y if X is already placed', () => {
      const nekroPlayer = createMockPlayer({
        id: 'nekro1',
        faction: 'nekro',
        technologies: ['valefar_assimilator_x', 'valefar_assimilator_y'],
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        x: { targetTechId: 'e_res_siphons', targetPlayerId: 'player2' },
      };

      const state = createMockGameState({
        players: [nekroPlayer],
      });

      const result = getAvailableAssimilatorToken(state, 'nekro1');

      expect(result).toBe('y');
    });

    it('should return null if both tokens placed', () => {
      const nekroPlayer = createMockPlayer({
        id: 'nekro1',
        faction: 'nekro',
        technologies: ['valefar_assimilator_x', 'valefar_assimilator_y'],
      }) as PlayerState & { assimilatorTokens?: Record<string, any> };

      nekroPlayer.assimilatorTokens = {
        x: { targetTechId: 'e_res_siphons', targetPlayerId: 'player2' },
        y: { targetTechId: 'spec_ops_ii', targetPlayerId: 'player3' },
      };

      const state = createMockGameState({
        players: [nekroPlayer],
      });

      const result = getAvailableAssimilatorToken(state, 'nekro1');

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // ADDITIONAL EDGE CASE TESTS
  // ==========================================================================

  describe('handleResearchTechnology - additional edge cases', () => {
    it('should exhaust planets used for tech specialties', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: ['neural_motivator'], // 1 green
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [{
                planetId: 'wellon',
                controlledBy: 'player1',
                exhausted: false,
                units: [],
                attachments: [],
              }],
            }),
          ],
          playerCount: 6,
        },
      });

      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'hyper_metabolism',
        exhaustedPlanets: ['wellon'],
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(true);
      // Planet should be exhausted
      const planet = state.map.tiles[0].planets.find((p: any) => p.planetId === 'wellon');
      expect(planet?.exhausted).toBe(true);
    });

    it('should allow multiple tech specialty planets to be exhausted', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: [], // No techs
          }),
        ],
        map: {
          tiles: [
            createMockTile({ q: 0, r: 0 }, {
              planets: [
                {
                  planetId: 'wellon',
                  controlledBy: 'player1',
                  exhausted: false,
                  units: [],
                  attachments: [],
                },
                {
                  planetId: 'thibah',
                  controlledBy: 'player1',
                  exhausted: false,
                  units: [],
                  attachments: [],
                },
              ],
            }),
          ],
          playerCount: 6,
        },
      });

      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'hyper_metabolism', // Requires 2 green
        exhaustedPlanets: ['wellon', 'thibah'],
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(true);
    });

    it('should return tech data in result', () => {
      const state = createMockGameState({
        players: [createMockPlayer()],
      });
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'neural_motivator',
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        playerId: 'player1',
        techId: 'neural_motivator',
      });
      expect(result.data?.techName).toBeDefined();
    });

    it('should work with unit upgrade technologies', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: ['antimass_deflectors', 'dark_energy_tap', 'sarween_tools'], // 2 blue + 1 yellow
          }),
        ],
      });
      const action: ResearchTechnologyAction = {
        type: 'research_technology',
        playerId: 'player1',
        techId: 'dreadnought_ii', // Unit upgrade requiring 2 blue + 1 yellow
        timestamp: Date.now(),
      };

      const result = handleResearchTechnology(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].technologies).toContain('dreadnought_ii');
    });
  });

  describe('getResearchableTechnologies - additional cases', () => {
    it('should return unit upgrade techs', () => {
      const state = createMockGameState({
        players: [createMockPlayer()],
      });

      const result = getResearchableTechnologies(state, 'player1');

      const techIds = result.map(t => t.id);
      expect(techIds).toContain('carrier_ii');
      expect(techIds).toContain('cruiser_ii');
      expect(techIds).toContain('dreadnought_ii');
    });

    it('should handle multiple researched techs', () => {
      const state = createMockGameState({
        players: [
          createMockPlayer({
            technologies: [
              'neural_motivator',
              'psychoarchaeology',
              'hyper_metabolism',
              'antimass_deflectors',
            ],
          }),
        ],
      });

      const result = getResearchableTechnologies(state, 'player1');

      const techIds = result.map(t => t.id);
      expect(techIds).not.toContain('neural_motivator');
      expect(techIds).not.toContain('psychoarchaeology');
      expect(techIds).not.toContain('hyper_metabolism');
      expect(techIds).not.toContain('antimass_deflectors');
    });
  });
});
