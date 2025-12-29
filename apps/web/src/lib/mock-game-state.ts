import type { GameState, MapState, MapTile, PlayerState, UnitInstance, UnitType } from '@ti4/shared';
import { generateMap, validateMap } from './map-generator';

let unitIdCounter = 0;
function createUnit(type: UnitType, ownerId: string, damaged = false): UnitInstance {
  return {
    id: `unit-${++unitIdCounter}`,
    type,
    ownerId,
    damaged,
  };
}

/**
 * Default factions for different player counts
 */
const DEFAULT_FACTIONS: Record<number, string[]> = {
  3: ['sol', 'hacan', 'letnev'],
  4: ['sol', 'hacan', 'letnev', 'xxcha'],
  5: ['sol', 'hacan', 'letnev', 'xxcha', 'sardakk'],
  6: ['sol', 'hacan', 'xxcha', 'letnev', 'sardakk', 'jolnar'],
};

/**
 * Player colors by index
 */
const PLAYER_COLORS = ['blue', 'yellow', 'green', 'red', 'orange', 'purple'] as const;

/**
 * Generate a mock game state for testing the board renderer
 */
export function createMockGameState(playerCount: number = 6): GameState {
  const factions = DEFAULT_FACTIONS[playerCount] ?? DEFAULT_FACTIONS[6];
  const players = createMockPlayers(playerCount, factions);

  // Generate a valid map using the map generator
  const map = generateMap(playerCount, factions, { seed: 42 });

  // Validate the generated map
  const validation = validateMap(map.tiles);
  if (!validation.valid) {
    console.warn('Map validation warnings:', validation.errors);
  }

  // Add starting units to home systems
  addStartingUnits(map, players);

  // Add some mid-game units for visual testing
  addTestUnits(map, players);

  return {
    id: 'mock-game-1',
    version: 1,
    round: 1,
    phase: 'action',
    subPhase: 'awaiting_action',
    activePlayerId: players[0].id,
    speakerId: players[0].id,
    initiativeOrder: players.map(p => p.id),
    players,
    map,
    strategyCards: [
      { number: 1, name: 'Leadership', pickedBy: players[0]?.id ?? null, exhausted: false },
      { number: 2, name: 'Diplomacy', pickedBy: players[1]?.id ?? null, exhausted: false },
      { number: 3, name: 'Politics', pickedBy: players[2]?.id ?? null, exhausted: false },
      { number: 4, name: 'Construction', pickedBy: players[3]?.id ?? null, exhausted: false },
      { number: 5, name: 'Trade', pickedBy: players[4]?.id ?? null, exhausted: false },
      { number: 6, name: 'Warfare', pickedBy: players[5]?.id ?? null, exhausted: false },
      { number: 7, name: 'Technology', pickedBy: null, exhausted: false },
      { number: 8, name: 'Imperial', pickedBy: null, exhausted: false },
    ],
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
    timingWindows: [],
    winner: null,
  };
}

/**
 * Create mock players
 */
function createMockPlayers(count: number, factions: string[]): PlayerState[] {
  return Array.from({ length: Math.min(count, 6) }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    faction: factions[i],
    color: PLAYER_COLORS[i],
    seatIndex: i,
    commandTokens: { tactics: 3, fleet: 3, strategy: 2 },
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: 4,
    technologies: [],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotesOwned: [],
    promissoryNotesInHand: [],
    planets: [],
    strategyCard: i + 1,
    strategyCardUsed: false,
    passed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
  }));
}

/**
 * Add starting units to home systems
 */
function addStartingUnits(map: MapState, players: PlayerState[]): void {
  // Find home system tiles (they have controlledBy set)
  const homeTiles = map.tiles.filter(tile =>
    tile.planets.some(p => p.controlledBy !== null)
  );

  for (const tile of homeTiles) {
    const playerId = tile.planets[0]?.controlledBy;
    if (!playerId) continue;

    // Add standard starting fleet
    tile.units.push(
      createUnit('carrier', playerId),
      createUnit('carrier', playerId),
      createUnit('destroyer', playerId),
      createUnit('fighter', playerId),
      createUnit('fighter', playerId),
      createUnit('fighter', playerId),
    );

    // Add ground units on first planet
    if (tile.planets.length > 0) {
      tile.planets[0].units.push(
        createUnit('infantry', playerId),
        createUnit('infantry', playerId),
        createUnit('infantry', playerId),
        createUnit('infantry', playerId),
        createUnit('pds', playerId),
        createUnit('space_dock', playerId),
      );
    }
  }
}

/**
 * Add test units to simulate mid-game state
 */
function addTestUnits(map: MapState, players: PlayerState[]): void {
  if (players.length < 2) return;

  // Find Mecatol Rex (center tile)
  const mecatolTile = map.tiles.find(tile => tile.position.q === 0 && tile.position.r === 0);

  if (mecatolTile) {
    // Player 1 has a fleet at Mecatol
    mecatolTile.units.push(
      createUnit('dreadnought', players[0].id),
      createUnit('dreadnought', players[0].id, true), // damaged
      createUnit('cruiser', players[0].id),
      createUnit('fighter', players[0].id),
      createUnit('fighter', players[0].id),
    );

    // Ground forces on Mecatol Rex
    if (mecatolTile.planets.length > 0) {
      mecatolTile.planets[0].controlledBy = players[0].id;
      mecatolTile.planets[0].units.push(
        createUnit('infantry', players[0].id),
        createUnit('infantry', players[0].id),
        createUnit('mech', players[0].id),
      );
    }

    // Add command token
    mecatolTile.commandTokens.push(players[0].id);
  }

  // Find ring 1 tiles for additional units
  const ring1Tiles = map.tiles.filter(tile => {
    const dist = Math.abs(tile.position.q) + Math.abs(tile.position.r) + Math.abs(-tile.position.q - tile.position.r);
    return dist === 2; // Ring 1 has distance 1 from center
  });

  if (ring1Tiles.length > 0 && players.length >= 2) {
    // Player 2 has units in a nearby system
    const tile1 = ring1Tiles[0];
    tile1.units.push(
      createUnit('carrier', players[1].id),
      createUnit('cruiser', players[1].id),
      createUnit('cruiser', players[1].id),
      createUnit('fighter', players[1].id),
      createUnit('fighter', players[1].id),
    );
    tile1.commandTokens.push(players[1].id);
  }

  if (ring1Tiles.length > 1 && players.length >= 3) {
    // Player 3 has a war sun!
    const tile2 = ring1Tiles[1];
    tile2.units.push(
      createUnit('war_sun', players[2].id),
      createUnit('fighter', players[2].id),
      createUnit('fighter', players[2].id),
      createUnit('fighter', players[2].id),
      createUnit('fighter', players[2].id),
    );
  }

  if (ring1Tiles.length > 2 && players.length >= 4) {
    // Player 4 has a flagship
    const tile3 = ring1Tiles[2];
    tile3.units.push(
      createUnit('flagship', players[3].id),
      createUnit('destroyer', players[3].id),
      createUnit('destroyer', players[3].id),
    );
  }
}
