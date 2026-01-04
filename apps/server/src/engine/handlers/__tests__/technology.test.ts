import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  handleResearchTechnology,
  getResearchableTechnologies,
  getAvailableTechnologies,
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
  });
});
