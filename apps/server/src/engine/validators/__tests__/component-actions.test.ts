/**
 * Tests for Component Action Validators
 *
 * Covers:
 * - Component action validation routing
 * - Phase and subPhase checks
 * - Technology ACTION: ability validation
 * - Faction ability validation
 * - Faction technology validation
 */

import { describe, it, expect } from 'vitest';
import type { GameState, ComponentAction, PlayerState, MapTile, PlanetInstance, UnitInstance } from '@ti4/shared';
import { validateComponentAction } from '../component-actions.js';

// ============================================================================
// Mock Factories
// ============================================================================

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test-game',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: 'player-1',
    speakerId: 'player-1',
    initiativeOrder: ['player-1', 'player-2', 'player-3'],
    players: [
      createMockPlayer('player-1', 'sol'),
      createMockPlayer('player-2', 'hacan'),
      createMockPlayer('player-3', 'muaat'),
    ],
    map: {
      tiles: [
        createMockTile(0, 0, 18, [createMockPlanet('mecatol_rex', null)]),
        createMockTile(1, 0, 1, [createMockPlanet('jord', 'player-1')]),
        createMockTile(-1, 0, 16, [createMockPlanet('arretze', 'player-2')]),
        createMockTile(0, -1, 4, [createMockPlanet('muaat', 'player-3')]),
        createMockTile(1, -1, 22, [createMockPlanet('tarmann', 'player-1')]),
      ],
      playerCount: 3,
    },
    strategyCards: [],
    objectives: {
      publicStageI: [],
      publicStageII: [],
      revealedCount: 0,
      secretDeck: [],
    },
    agendas: {
      currentAgenda: null,
      currentAgendaNumber: 1,
      votes: new Map(),
      outcome: null,
      riders: [],
    },
    actionCardDeck: [],
    actionCardDiscard: [],
    agendaDeck: [],
    agendaDiscard: [],
    laws: [],
    custodiansTaken: false,
    activeCombat: null,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    gameLog: [],
    ...overrides,
  } as GameState;
}

function createMockPlayer(id: string, faction: string): PlayerState {
  return {
    id,
    name: faction.charAt(0).toUpperCase() + faction.slice(1),
    faction,
    color: 'blue',
    seatIndex: 0,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    technologies: [],
    exhaustedTechnologies: [],
    actionCards: ['sabotage', 'direct_hit'],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    promissoryNotesInPlay: [],
    planets: [],
    score: 0,
    passed: false,
    strategyCard: null,
    strategyCardUsed: false,
    neighbors: [],
    transactedWith: [],
    leaders: {
      agent: { unlocked: true, exhausted: false },
      commander: { unlocked: false },
      hero: { unlocked: false, purged: false },
    },
  } as PlayerState;
}

function createMockTile(q: number, r: number, systemId: number, planets: PlanetInstance[], units: UnitInstance[] = []): MapTile {
  return {
    id: `tile-${systemId}`,
    systemId,
    position: { q, r },
    rotation: 0,
    planets,
    wormhole: null,
    anomaly: null,
    units,
    commandTokens: [],
  };
}

function createMockPlanet(planetId: string, controlledBy: string | null, units: UnitInstance[] = []): PlanetInstance {
  return {
    id: planetId,
    planetId,
    controlledBy,
    exhausted: false,
    attachments: [],
    units,
  };
}

function createMockUnit(type: string, ownerId: string, id?: string): UnitInstance {
  return {
    id: id || `${type}-${Math.random().toString(36).substr(2, 9)}`,
    type: type as UnitInstance['type'],
    ownerId,
    damaged: false,
  };
}

// ============================================================================
// Phase and Subphase Validation Tests
// ============================================================================

describe('Component Action Validators', () => {
  describe('validateComponentAction - phase checks', () => {
    it('should reject if not in action phase', () => {
      const state = createMockGameState({ phase: 'strategy' });
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only use component actions during action phase');
    });

    it('should reject if not awaiting action', () => {
      const state = createMockGameState({ subPhase: 'tactical_movement' });
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot use component action during sub-phase');
    });

    it('should reject if player not found', () => {
      const state = createMockGameState();
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'unknown-player',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should reject if player has passed', () => {
      const state = createMockGameState();
      state.players[0].passed = true;
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You have already passed');
    });
  });

  describe('validateComponentAction - routing', () => {
    it('should reject agent component type', () => {
      const state = createMockGameState();
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'agent',
        componentId: 'some_agent',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Use use_agent action for agent abilities');
    });

    it('should reject relic component type', () => {
      const state = createMockGameState();
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'relic',
        componentId: 'some_relic',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Use use_relic action for relic abilities');
    });

    it('should reject commander component type', () => {
      const state = createMockGameState();
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'commander',
        componentId: 'some_commander',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Commanders do not have ACTION: abilities');
    });

    it('should reject unknown component type', () => {
      const state = createMockGameState();
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'unknown' as any,
        componentId: 'something',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown component type: unknown');
    });
  });

  // ============================================================================
  // Tech Validator Tests
  // ============================================================================

  describe('Tech validators', () => {
    it('should reject if player does not have technology', () => {
      const state = createMockGameState();
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You do not have technology: x89_bacterial_weapon');
    });

    it('should reject if technology is exhausted', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['x89_bacterial_weapon'];
      state.players[0].exhaustedTechnologies = ['x89_bacterial_weapon'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Technology is already exhausted');
    });

    it('should reject unknown technology with ACTION ability', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['antimass_deflectors'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'antimass_deflectors',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Technology antimass_deflectors does not have an ACTION: ability');
    });
  });

  describe('X-89 Bacterial Weapon validator', () => {
    it('should validate successfully with bombardment ships', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['x89_bacterial_weapon'];
      state.map.tiles[1].units.push(createMockUnit('dreadnought', 'player-1'));

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
        targets: { planetId: 'jord' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject without target planet', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['x89_bacterial_weapon'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify target planet');
    });

    it('should reject if planet not found', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['x89_bacterial_weapon'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
        targets: { planetId: 'nonexistent' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Planet not found');
    });

    it('should reject without bombardment ships', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['x89_bacterial_weapon'];
      state.map.tiles[1].units.push(createMockUnit('cruiser', 'player-1')); // No bombardment

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
        targets: { planetId: 'jord' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You must have ships with BOMBARDMENT in the system');
    });
  });

  describe('Sling Relay validator', () => {
    it('should validate successfully with space dock', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['sling_relay'];
      state.map.tiles[1].planets[0].units.push(createMockUnit('space_dock', 'player-1'));

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'sling_relay',
        targets: { systemId: '1', unitType: 'cruiser' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject without target system', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['sling_relay'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'sling_relay',
        targets: { unitType: 'cruiser' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify target system');
    });

    it('should reject without ship type', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['sling_relay'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'sling_relay',
        targets: { systemId: '1' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify ship type to produce');
    });

    it('should reject non-ship unit type', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['sling_relay'];
      state.map.tiles[1].planets[0].units.push(createMockUnit('space_dock', 'player-1'));

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'sling_relay',
        targets: { systemId: '1', unitType: 'infantry' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('infantry is not a ship type');
    });

    it('should reject without space dock', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['sling_relay'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'sling_relay',
        targets: { systemId: '1', unitType: 'cruiser' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You must have a space dock in this system');
    });
  });

  describe('Transit Diodes validator', () => {
    it('should validate with no relocations', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['transit_diodes'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'transit_diodes',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject more than 4 relocations', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['transit_diodes'];

      const action = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'transit_diodes',
        relocations: [
          { unitId: 'u1', toPlanetId: 'jord' },
          { unitId: 'u2', toPlanetId: 'jord' },
          { unitId: 'u3', toPlanetId: 'jord' },
          { unitId: 'u4', toPlanetId: 'jord' },
          { unitId: 'u5', toPlanetId: 'jord' },
        ],
      } as ComponentAction;

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Can only relocate up to 4 ground forces');
    });
  });

  // ============================================================================
  // Faction Ability Validator Tests
  // ============================================================================

  describe('Star Forge validator (Muaat)', () => {
    it('should validate for Muaat with strategy token', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player-3'; // Muaat

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-3',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'star_forge',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject for non-Muaat', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1', // Sol
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'star_forge',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only Muaat can use Star Forge');
    });

    it('should reject without strategy tokens', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player-3';
      state.players[2].commandTokens.strategy = 0;

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-3',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'star_forge',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('No strategy tokens available');
    });
  });

  describe('Orbital Drop validator (Sol)', () => {
    it('should validate for Sol with controlled planet', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1', // Sol
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'orbital_drop',
        targets: { planetId: 'jord' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject for non-Sol', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-2', // Hacan
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'orbital_drop',
        targets: { planetId: 'arretze' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only Sol can use Orbital Drop');
    });

    it('should reject without target planet', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'orbital_drop',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify target planet');
    });

    it('should reject uncontrolled planet', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'orbital_drop',
        targets: { planetId: 'mecatol_rex' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You must control the target planet');
    });
  });

  describe('Stall Tactics validator (Yssaril)', () => {
    it('should validate for Yssaril with action card', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'stall_tactics',
        targets: { actionCardId: 'sabotage' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject for non-Yssaril', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1', // Sol
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'stall_tactics',
        targets: { actionCardId: 'sabotage' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only Yssaril can use Stall Tactics');
    });

    it('should reject without action card specified', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'stall_tactics',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify action card to discard');
    });

    it('should reject if player does not have the card', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'stall_tactics',
        targets: { actionCardId: 'nonexistent_card' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You do not have that action card');
    });
  });

  // ============================================================================
  // Faction Tech Validator Tests
  // ============================================================================

  describe('Production Biomes validator (Hacan)', () => {
    it('should validate for Hacan with target player', () => {
      const state = createMockGameState();
      state.players[1].technologies = ['production_biomes'];
      state.activePlayerId = 'player-2';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-2',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'production_biomes',
        targets: { playerId: 'player-1' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject for non-Hacan', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['production_biomes'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1', // Sol
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'production_biomes',
        targets: { playerId: 'player-2' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only Hacan can use Production Biomes');
    });

    it('should reject without target player', () => {
      const state = createMockGameState();
      state.players[1].technologies = ['production_biomes'];
      state.activePlayerId = 'player-2';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-2',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'production_biomes',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must specify another player');
    });

    it('should reject targeting self', () => {
      const state = createMockGameState();
      state.players[1].technologies = ['production_biomes'];
      state.activePlayerId = 'player-2';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-2',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'production_biomes',
        targets: { playerId: 'player-2' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Must choose another player');
    });
  });

  describe('Lazax Gate Folding validator (Winnu)', () => {
    it('should validate for Winnu controlling Mecatol', () => {
      const state = createMockGameState();
      state.players[0].faction = 'winnu';
      state.players[0].technologies = ['lazax_gate_folding'];
      state.map.tiles[0].planets[0].controlledBy = 'player-1';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'lazax_gate_folding',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject for non-Winnu', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['lazax_gate_folding'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1', // Sol
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'lazax_gate_folding',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only Winnu can use Lazax Gate Folding');
    });

    it('should reject without Mecatol control', () => {
      const state = createMockGameState();
      state.players[0].faction = 'winnu';
      state.players[0].technologies = ['lazax_gate_folding'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'lazax_gate_folding',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('You must control Mecatol Rex to use this ability');
    });
  });

  describe('Mageon Implants validator (Yssaril)', () => {
    it('should validate for Yssaril stealing card', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';
      state.players[0].technologies = ['mageon_implants'];
      state.players[1].actionCards = ['focused_research'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'mageon_implants',
        targets: { playerId: 'player-2', actionCardId: 'focused_research' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject targeting self', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';
      state.players[0].technologies = ['mageon_implants'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'mageon_implants',
        targets: { playerId: 'player-1', actionCardId: 'sabotage' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot target yourself');
    });

    it('should reject if target does not have card', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';
      state.players[0].technologies = ['mageon_implants'];
      state.players[1].actionCards = [];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'mageon_implants',
        targets: { playerId: 'player-2', actionCardId: 'some_card' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Target player does not have that action card');
    });
  });

  describe('Temporal Command Suite validator (Nomad)', () => {
    it('should validate for Nomad readying exhausted agent', () => {
      const state = createMockGameState();
      state.players[0].faction = 'nomad';
      state.players[0].technologies = ['temporal_command_suite'];
      state.players[1].leaders!.agent.exhausted = true;

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'temporal_command_suite',
        targets: { playerId: 'player-2' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(true);
    });

    it('should reject for non-Nomad', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['temporal_command_suite'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1', // Sol
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'temporal_command_suite',
        targets: { playerId: 'player-2' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only Nomad can use Temporal Command Suite');
    });

    it('should reject if agent not exhausted', () => {
      const state = createMockGameState();
      state.players[0].faction = 'nomad';
      state.players[0].technologies = ['temporal_command_suite'];
      state.players[1].leaders!.agent.exhausted = false;

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'temporal_command_suite',
        targets: { playerId: 'player-2' },
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Target agent is not exhausted');
    });
  });

  describe('Unknown faction ability', () => {
    it('should reject unknown faction ability', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'unknown_ability',
      };

      const result = validateComponentAction(state, action);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown faction ability: unknown_ability');
    });
  });
});
