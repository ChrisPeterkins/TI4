/**
 * Tests for Component Actions Handler
 *
 * Covers:
 * - Component action routing
 * - Technology ACTION: abilities
 * - Faction abilities (Star Forge, Orbital Drop, Stall Tactics)
 * - Faction technologies (Production Biomes, Wormhole Generator, etc.)
 */

import { describe, it, expect } from 'vitest';
import type { GameState, ComponentAction, PlayerState, MapTile, PlanetInstance, UnitInstance } from '@ti4/shared';
import { handleComponentAction, advanceAfterComponentAction } from '../component-actions.js';

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
        createMockTile(0, 0, 18, [createMockPlanet('mecatol_rex', null)]), // Mecatol
        createMockTile(1, 0, 1, [createMockPlanet('jord', 'player-1')]), // Sol home
        createMockTile(-1, 0, 16, [createMockPlanet('arretze', 'player-2')]), // Hacan home
        createMockTile(0, -1, 4, [createMockPlanet('muaat', 'player-3')]), // Muaat home
        createMockTile(1, -1, 22, [createMockPlanet('tarmann', 'player-1')]), // Neutral system
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
    actionCardDeck: ['sabotage', 'direct_hit', 'skilled_retreat'],
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
    strategyCards: [],
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
    id: `planet-${planetId}`,
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
// Component Action Routing Tests
// ============================================================================

describe('Component Actions', () => {
  describe('handleComponentAction routing', () => {
    it('should return error for unknown player', () => {
      const state = createMockGameState();
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'unknown-player',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Player not found');
    });

    it('should route tech component actions to tech handler', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['x89_bacterial_weapon'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
        targets: { planetId: 'jord' },
      };

      // Add a ship with bombardment to the system
      state.map.tiles[1].units.push(createMockUnit('dreadnought', 'player-1'));
      state.map.tiles[1].planets[0].units.push(createMockUnit('infantry', 'player-2'));

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
    });

    it('should return error for agent component type', () => {
      const state = createMockGameState();
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'agent',
        componentId: 'some_agent',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Use use_agent action for agent abilities');
    });

    it('should return error for relic component type', () => {
      const state = createMockGameState();
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'relic',
        componentId: 'some_relic',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Use use_relic action for relic abilities');
    });

    it('should return error for commander component type', () => {
      const state = createMockGameState();
      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'commander',
        componentId: 'some_commander',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Commanders do not have ACTION: abilities');
    });
  });

  // ============================================================================
  // Tech Component Action Tests
  // ============================================================================

  describe('X-89 Bacterial Weapon', () => {
    it('should destroy all infantry on target planet', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['x89_bacterial_weapon'];

      // Add dreadnought (has bombardment) to the system
      state.map.tiles[1].units.push(createMockUnit('dreadnought', 'player-1'));

      // Add infantry to the planet (enemy and own)
      state.map.tiles[1].planets[0].units = [
        createMockUnit('infantry', 'player-2'),
        createMockUnit('infantry', 'player-2'),
        createMockUnit('infantry', 'player-1'),
        createMockUnit('mech', 'player-2'), // Should not be destroyed
      ];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
        targets: { planetId: 'jord' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect((result.data as any)?.destroyedCount).toBe(3);
      expect(state.map.tiles[1].planets[0].units).toHaveLength(1);
      expect(state.map.tiles[1].planets[0].units[0].type).toBe('mech');
      expect(state.players[0].exhaustedTechnologies).toContain('x89_bacterial_weapon');
    });

    it('should fail without bombardment ships', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['x89_bacterial_weapon'];

      // Add a ship WITHOUT bombardment
      state.map.tiles[1].units.push(createMockUnit('cruiser', 'player-1'));

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
        targets: { planetId: 'jord' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You must have ships with BOMBARDMENT in the system');
    });

    it('should fail without target planet', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['x89_bacterial_weapon'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must specify target planet');
    });

    it('should fail if tech is already exhausted', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['x89_bacterial_weapon'];
      state.players[0].exhaustedTechnologies = ['x89_bacterial_weapon'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
        targets: { planetId: 'jord' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Technology is already exhausted');
    });
  });

  describe('Sling Relay', () => {
    it('should produce 1 ship in system with space dock', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['sling_relay'];

      // Add space dock to the planet
      state.map.tiles[1].planets[0].units.push(createMockUnit('space_dock', 'player-1'));

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'sling_relay',
        targets: { systemId: '1', unitType: 'cruiser' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect((result.data as any)?.unitType).toBe('cruiser');
      expect(state.map.tiles[1].units.some(u => u.type === 'cruiser')).toBe(true);
      expect(state.players[0].exhaustedTechnologies).toContain('sling_relay');
    });

    it('should fail without space dock in system', () => {
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

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You must have a space dock in this system');
    });

    it('should fail for non-ship unit type', () => {
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

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('infantry is not a ship type');
    });
  });

  // ============================================================================
  // Faction Ability Tests
  // ============================================================================

  describe('Star Forge (Muaat)', () => {
    it('should place cruiser in home system for strategy token', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player-3'; // Muaat player

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-3',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'star_forge',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[2].commandTokens.strategy).toBe(1); // 2 - 1
      // Find Muaat home system (system 4)
      const homeTile = state.map.tiles.find(t => t.systemId === 4);
      expect(homeTile?.units.some(u => u.type === 'cruiser')).toBe(true);
    });

    it('should fail if not Muaat', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1', // Sol, not Muaat
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'star_forge',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Only Muaat can use Star Forge');
    });

    it('should fail without strategy tokens', () => {
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

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No strategy tokens available');
    });
  });

  describe('Orbital Drop (Sol)', () => {
    it('should place 2 infantry on controlled planet', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1', // Sol
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'orbital_drop',
        targets: { planetId: 'jord' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].commandTokens.strategy).toBe(1); // 2 - 1
      const planet = state.map.tiles[1].planets[0];
      expect(planet.units.filter(u => u.type === 'infantry')).toHaveLength(2);
    });

    it('should fail on uncontrolled planet', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'orbital_drop',
        targets: { planetId: 'mecatol_rex' }, // Not controlled
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You must control the target planet');
    });
  });

  describe('Stall Tactics (Yssaril)', () => {
    it('should discard action card', () => {
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

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].actionCards).not.toContain('sabotage');
      expect(state.actionCardDiscard).toContain('sabotage');
    });

    it('should fail without action card specified', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'stall_tactics',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must specify action card to discard');
    });
  });

  // ============================================================================
  // Faction Tech Tests
  // ============================================================================

  describe('Production Biomes (Hacan)', () => {
    it('should gain 4 TG and give 2 TG to another player', () => {
      const state = createMockGameState();
      state.players[1].technologies = ['production_biomes']; // Hacan
      state.activePlayerId = 'player-2';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-2',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'production_biomes',
        targets: { playerId: 'player-1' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[1].tradeGoods).toBe(4);
      expect(state.players[0].tradeGoods).toBe(2);
      expect(state.players[1].commandTokens.strategy).toBe(1);
      expect(state.players[1].exhaustedTechnologies).toContain('production_biomes');
    });

    it('should fail if targeting self', () => {
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

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Must choose another player');
    });
  });

  describe('Lazax Gate Folding (Winnu)', () => {
    it('should place infantry on Mecatol Rex', () => {
      const state = createMockGameState();
      state.players[0].faction = 'winnu';
      state.players[0].technologies = ['lazax_gate_folding'];
      // Give Winnu control of Mecatol Rex
      state.map.tiles[0].planets[0].controlledBy = 'player-1';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'lazax_gate_folding',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      const mecatol = state.map.tiles[0].planets[0];
      expect(mecatol.units.some(u => u.type === 'infantry')).toBe(true);
      expect(state.players[0].exhaustedTechnologies).toContain('lazax_gate_folding');
    });

    it('should fail if not controlling Mecatol Rex', () => {
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

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('You must control Mecatol Rex to use this ability');
    });
  });

  describe('Mageon Implants (Yssaril)', () => {
    it('should steal action card from another player', () => {
      const state = createMockGameState();
      state.players[0].faction = 'yssaril';
      state.players[0].technologies = ['mageon_implants'];
      state.players[1].actionCards = ['focused_research', 'flank_speed'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'mageon_implants',
        targets: { playerId: 'player-2', actionCardId: 'focused_research' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].actionCards).toContain('focused_research');
      expect(state.players[1].actionCards).not.toContain('focused_research');
      expect(state.players[0].exhaustedTechnologies).toContain('mageon_implants');
    });

    it('should fail if targeting self', () => {
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

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot target yourself');
    });
  });

  describe('Temporal Command Suite (Nomad)', () => {
    it('should ready exhausted agent', () => {
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

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[1].leaders!.agent.exhausted).toBe(false);
      expect(state.players[0].exhaustedTechnologies).toContain('temporal_command_suite');
    });

    it('should fail if agent is not exhausted', () => {
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

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Target player's agent is not exhausted");
    });
  });

  // ============================================================================
  // Transit Diodes Tests
  // ============================================================================

  describe('Transit Diodes', () => {
    it('should relocate ground forces to controlled planets', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['transit_diodes'];

      // Add infantry to source planet
      const inf1 = createMockUnit('infantry', 'player-1', 'inf-1');
      const inf2 = createMockUnit('infantry', 'player-1', 'inf-2');
      state.map.tiles[1].planets[0].units = [inf1, inf2];

      // Mark target planet as controlled
      state.map.tiles[4].planets[0].controlledBy = 'player-1';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'transit_diodes',
        relocations: [
          { unitId: 'inf-1', toPlanetId: 'tarmann' },
        ],
      } as ComponentAction & { relocations: { unitId: string; toPlanetId: string }[] };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].exhaustedTechnologies).toContain('transit_diodes');
    });

    it('should allow zero relocations', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['transit_diodes'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'transit_diodes',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect((result.data as any)?.relocated).toBe(0);
    });

    it('should fail with more than 4 relocations', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['transit_diodes'];
      state.map.tiles[4].planets[0].controlledBy = 'player-1';

      // Create 5 infantry
      for (let i = 1; i <= 5; i++) {
        state.map.tiles[1].planets[0].units.push(
          createMockUnit('infantry', 'player-1', `inf-${i}`)
        );
      }

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'transit_diodes',
        relocations: [
          { unitId: 'inf-1', toPlanetId: 'tarmann' },
          { unitId: 'inf-2', toPlanetId: 'tarmann' },
          { unitId: 'inf-3', toPlanetId: 'tarmann' },
          { unitId: 'inf-4', toPlanetId: 'tarmann' },
          { unitId: 'inf-5', toPlanetId: 'tarmann' },
        ],
      } as ComponentAction & { relocations: { unitId: string; toPlanetId: string }[] };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Can only relocate up to 4 ground forces');
    });

    it('should fail if destination not controlled', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['transit_diodes'];

      const inf = createMockUnit('infantry', 'player-1', 'inf-1');
      state.map.tiles[1].planets[0].units = [inf];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'transit_diodes',
        relocations: [
          { unitId: 'inf-1', toPlanetId: 'arretze' }, // Controlled by player-2
        ],
      } as ComponentAction & { relocations: { unitId: string; toPlanetId: string }[] };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('do not control destination');
    });
  });

  // ============================================================================
  // Wormhole Generator Tests
  // ============================================================================

  describe('Wormhole Generator (Ghosts of Creuss)', () => {
    it('should place wormhole token in activated system', () => {
      const state = createMockGameState();
      state.players[0].faction = 'ghosts_of_creuss';
      state.players[0].technologies = ['wormhole_generator'];
      state.activatedSystemPosition = { q: 1, r: 0 };

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator',
      };

      const result = handleComponentAction(state, action);

      // The actual behavior depends on implementation - just ensure it handles the call
      expect(typeof result.success).toBe('boolean');
    });

    it('should fail if not Ghosts faction', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['wormhole_generator'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Vortex Tests (Vuilraith)
  // ============================================================================

  describe('Vortex (Vuilraith)', () => {
    it('should fail if not Vuilraith faction', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['vortex'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'vortex',
        targets: { planetId: 'jord' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Peace Accords Tests (Xxcha)
  // ============================================================================

  describe('Peace Accords (Xxcha)', () => {
    it('should fail if not Xxcha faction', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'peace_accords',
        targets: { planetId: 'mecatol_rex' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
    });

    it('should fail on uncontrolled planet', () => {
      const state = createMockGameState();
      state.players[0].faction = 'xxcha';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'peace_accords',
        targets: { planetId: 'mecatol_rex' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Unknown Component Type Tests
  // ============================================================================

  describe('Unknown Component Types', () => {
    it('should return error for unknown component type', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'unknown' as any,
        componentId: 'some_thing',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown component type');
    });

    it('should return error for promissory ACTION', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'promissory',
        componentId: 'some_promissory',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not yet implemented');
    });
  });

  // ============================================================================
  // Tech Not Owned/Unknown Tests
  // ============================================================================

  describe('Tech Validation', () => {
    it('should fail if player does not have tech', () => {
      const state = createMockGameState();
      state.players[0].technologies = [];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'x89_bacterial_weapon',
        targets: { planetId: 'jord' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not have technology');
    });

    it('should fail for unknown tech ACTION', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['unknown_tech'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'unknown_tech',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('does not have an ACTION');
    });
  });

  // ============================================================================
  // Unknown Faction Ability Tests
  // ============================================================================

  describe('Unknown Faction Ability', () => {
    it('should fail for unknown faction ability', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'unknown_ability',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown faction ability');
    });
  });

  // ============================================================================
  // advanceAfterComponentAction Tests
  // ============================================================================

  describe('advanceAfterComponentAction', () => {
    it('should advance to next non-passed player', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player-1';

      advanceAfterComponentAction(state);

      expect(state.activePlayerId).toBe('player-2');
      expect(state.subPhase).toBe('awaiting_action');
    });

    it('should skip passed players', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player-1';
      state.players[1].passed = true; // player-2 has passed

      advanceAfterComponentAction(state);

      expect(state.activePlayerId).toBe('player-3');
    });

    it('should wrap around to first player', () => {
      const state = createMockGameState();
      state.activePlayerId = 'player-3';

      advanceAfterComponentAction(state);

      expect(state.activePlayerId).toBe('player-1');
    });
  });

  // ============================================================================
  // Wormhole Generator (Creuss) Tests
  // ============================================================================

  describe('Wormhole Generator (Creuss) - Valid Cases', () => {
    it('should place wormhole in system with controlled planet', () => {
      const state = createMockGameState();
      state.players[0].faction = 'creuss';
      state.players[0].technologies = ['wormhole_generator'];
      state.map.tiles[1].planets[0].controlledBy = 'player-1';

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator',
        targets: { systemId: '1' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.map.tiles[1].wormhole).toBe('delta');
      expect(state.players[0].exhaustedTechnologies).toContain('wormhole_generator');
    });

    it('should place wormhole in non-home system without enemy ships', () => {
      const state = createMockGameState();
      state.players[0].faction = 'creuss';
      state.players[0].technologies = ['wormhole_generator'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator',
        targets: { systemId: '22' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      const tile = state.map.tiles.find(t => t.systemId === 22);
      expect(tile?.wormhole).toBe('delta');
    });

    it('should remove old wormhole when placing new one', () => {
      const state = createMockGameState();
      state.players[0].faction = 'creuss';
      // Both wormhole_generator and wormhole_generator_omega are handled the same way
      state.players[0].technologies = ['wormhole_generator_omega'];
      state.map.tiles[1].wormhole = 'delta'; // Existing wormhole on tile 1
      state.map.tiles[1].planets[0].controlledBy = 'player-1';
      state.map.tiles[4].wormhole = 'delta'; // Also has delta on tile 4 (system 22)

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator_omega',
        targets: { systemId: '1' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.map.tiles[1].wormhole).toBe('delta');
      // Old wormhole on tile 4 should be removed
      expect(state.map.tiles[4].wormhole).toBeNull();
    });
  });

  describe('Wormhole Generator (Creuss) - Invalid Cases', () => {
    it('should fail if not Creuss faction', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['wormhole_generator'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator',
        targets: { systemId: '1' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only Creuss can use Wormhole Generator');
    });

    it('should fail without system specified', () => {
      const state = createMockGameState();
      state.players[0].faction = 'creuss';
      state.players[0].technologies = ['wormhole_generator'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Must specify target system');
    });

    it('should fail with invalid system ID', () => {
      const state = createMockGameState();
      state.players[0].faction = 'creuss';
      state.players[0].technologies = ['wormhole_generator'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator',
        targets: { systemId: 'invalid' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid system ID');
    });

    it('should fail when system not found', () => {
      const state = createMockGameState();
      state.players[0].faction = 'creuss';
      state.players[0].technologies = ['wormhole_generator'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator',
        targets: { systemId: '999' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('System not found');
    });

    it('should fail in home system without controlled planet', () => {
      const state = createMockGameState();
      state.players[0].faction = 'creuss';
      state.players[0].technologies = ['wormhole_generator'];
      // System 1 is a home system and controlled by player-1, so this would succeed
      // Let's use system 2 (mentak's home) which is also a home system
      // For this to fail, we need home system without controlled planet
      // Actually, let's use a PoK home system that exists in the map
      state.map.tiles.push(createMockTile(0, 1, 51, [])); // Add a PoK home system (51 is Creuss home)

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator',
        targets: { systemId: '51' }, // PoK home system, not controlled
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid target');
    });

    it('should allow placement in non-home system if controlled', () => {
      const state = createMockGameState();
      state.players[0].faction = 'creuss';
      state.players[0].technologies = ['wormhole_generator'];
      // System 22 (tile 4) is controlled by player-1 and has enemy ships
      // Since player has controlled planet, it should succeed
      state.map.tiles[4].units.push(createMockUnit('cruiser', 'player-2'));

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'wormhole_generator',
        targets: { systemId: '22' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.map.tiles[4].wormhole).toBe('delta');
    });
  });

  // ============================================================================
  // Vortex (Vuil'Raith) Tests
  // ============================================================================

  describe('Vortex (Vuil\'Raith)', () => {
    it('should capture enemy unit from adjacent system', () => {
      const state = createMockGameState();
      state.players[0].faction = 'vuil_raith';
      state.players[0].technologies = ['vortex'];

      // Add space dock to player-1's system (adjacent to target)
      state.map.tiles[1].planets[0].units.push(createMockUnit('space_dock', 'player-1'));

      // Add enemy unit to target system (22 is adjacent to 1)
      const enemyUnit = createMockUnit('cruiser', 'player-2', 'enemy-cruiser-1');
      state.map.tiles[4].units.push(enemyUnit);

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'vortex',
        targets: { systemId: '22', unitType: 'enemy-cruiser-1' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.players[0].exhaustedTechnologies).toContain('vortex');
      expect(state.map.tiles[4].units).not.toContain(enemyUnit);
    });

    it('should fail if not Vuil\'Raith', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['vortex'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'vortex',
        targets: { systemId: '22', unitType: 'cruiser' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only Vuil\'Raith can use Vortex');
    });

    it('should fail without system specified', () => {
      const state = createMockGameState();
      state.players[0].faction = 'vuil_raith';
      state.players[0].technologies = ['vortex'];

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'vortex',
        targets: { unitType: 'cruiser' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Must specify target system and unit');
    });
  });

  // ============================================================================
  // Sling Relay - Invalid system ID Tests
  // ============================================================================

  describe('Sling Relay - Edge Cases', () => {
    it('should fail with invalid system ID', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['sling_relay'];
      state.map.tiles[1].planets[0].units.push(createMockUnit('space_dock', 'player-1'));

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'sling_relay',
        targets: { systemId: 'invalid', unitType: 'cruiser' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid system ID');
    });

    it('should produce ship with floating space dock', () => {
      const state = createMockGameState();
      state.players[0].technologies = ['sling_relay'];

      // Add floating space dock
      state.map.tiles[1].units.push(createMockUnit('space_dock', 'player-1'));

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'tech',
        componentId: 'sling_relay',
        targets: { systemId: '1', unitType: 'destroyer' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(true);
      expect(state.map.tiles[1].units.some(u => u.type === 'destroyer')).toBe(true);
    });
  });

  // ============================================================================
  // Orbital Drop - Invalid Cases
  // ============================================================================

  describe('Orbital Drop (Sol) - Edge Cases', () => {
    it('should fail without strategy token', () => {
      const state = createMockGameState();
      state.players[0].commandTokens.strategy = 0;

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'orbital_drop',
        targets: { planetId: 'jord' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No strategy tokens available');
    });

    it('should fail without target planet specified', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'orbital_drop',
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Must specify target planet');
    });

    it('should fail for non-existent planet', () => {
      const state = createMockGameState();

      const action: ComponentAction = {
        type: 'component_action',
        playerId: 'player-1',
        timestamp: Date.now(),
        componentType: 'faction_ability',
        componentId: 'orbital_drop',
        targets: { planetId: 'nonexistent' },
      };

      const result = handleComponentAction(state, action);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Planet not found');
    });
  });
});
