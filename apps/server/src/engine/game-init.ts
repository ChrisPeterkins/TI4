import { v4 as uuidv4 } from 'uuid';
import type {
  GameState,
  PlayerState,
  MapState,
  MapTile,
  PlanetInstance,
  StrategyCardState,
  ObjectiveState,
  ObjectiveInstance,
  AgendaState,
  PlayerColor,
  UnitInstance,
  UnitType,
  Expansion,
} from '@ti4/shared';
import {
  STAGE_I_OBJECTIVES,
  STAGE_II_OBJECTIVES,
  SECRET_OBJECTIVES,
  getGenericNoteIdsForColor,
  getInitialExplorationDeck,
  getInitialRelicDeck,
  isExplorationEnabled,
  areRelicsEnabled,
  FACTION_LEADERS,
  createActionCardDeck,
  createAgendaDeck,
} from '@ti4/shared';
import { factions, systems, strategyCards } from '@ti4/game-data';
import { getHomeSystemPositions, generateStandardMapPositions } from './utils/hex.js';

export interface GameSetupOptions {
  playerSetups: PlayerSetup[];
  victoryPoints?: number;
  expansions?: string[];
  speakerIndex?: number; // Index of the player who should be speaker (from draft)
  startPhase?: 'setup' | 'strategy'; // What phase to start in (default: 'setup', after draft: 'strategy')
}

export interface PlayerSetup {
  userId: string | null; // null for bot players
  name: string;
  factionId: string;
  color: PlayerColor;
}

/**
 * Create a new game state with the given setup options
 */
export function createGame(options: GameSetupOptions): GameState {
  const gameId = uuidv4();
  const playerCount = options.playerSetups.length;

  // Create players
  const players = options.playerSetups.map((setup, index) =>
    createPlayer(setup, index)
  );

  // Select speaker - use provided index (from draft) or random
  const speakerIndex = options.speakerIndex ?? Math.floor(Math.random() * playerCount);
  const speakerId = players[speakerIndex].id;

  // Determine starting phase - 'strategy' if coming from draft, 'setup' otherwise
  const startPhase = options.startPhase ?? 'setup';
  // Round 1 starts when we enter strategy phase
  const startRound = startPhase === 'strategy' ? 1 : 0;

  // Create map
  const map = createMap(playerCount, players);

  // Create strategy cards
  const strategyCardStates = createStrategyCards();

  // Create objectives
  const objectives = createObjectives(options.expansions || ['base']);

  // Normalize expansions to Expansion type array
  const expansions = (options.expansions || ['base']) as Expansion[];

  // Create exploration and relic decks based on enabled expansions
  const explorationEnabled = isExplorationEnabled(expansions);
  const relicsEnabled = areRelicsEnabled(expansions);

  // Create initial game state
  const gameState: GameState = {
    id: gameId,
    version: 1,
    round: startRound,
    phase: startPhase,
    activePlayerId: speakerId,
    speakerId,
    initiativeOrder: [],
    players,
    map,
    strategyCards: strategyCardStates,
    objectives,
    agendas: createAgendaState(),
    actionCardDeck: shuffleArray(createActionCardDeck('base')), // TODO: Pass expansions when action cards support it
    actionCardDiscard: [],
    agendaDeck: shuffleArray(createAgendaDeck('base')), // TODO: Pass expansions when agendas support it
    agendaDiscard: [],
    laws: [],
    custodiansTaken: false,
    activeCombat: null,
    timingWindowStack: [],
    activeTimingWindow: null,
    winner: null,
    gameLog: [],
    // PoK exploration decks - only populated if PoK or later expansion is enabled
    explorationDecks: explorationEnabled
      ? {
          cultural: shuffleArray(getInitialExplorationDeck('cultural', expansions)),
          industrial: shuffleArray(getInitialExplorationDeck('industrial', expansions)),
          hazardous: shuffleArray(getInitialExplorationDeck('hazardous', expansions)),
          frontier: shuffleArray(getInitialExplorationDeck('frontier', expansions)),
        }
      : {
          cultural: [],
          industrial: [],
          hazardous: [],
          frontier: [],
        },
    explorationDiscard: [],
    relicDeck: relicsEnabled ? shuffleArray(getInitialRelicDeck(expansions)) : [],
    relicDiscard: [],
  };

  // Place starting units for each player
  for (const player of players) {
    placeStartingUnits(gameState, player);
  }

  // Deal secret objectives to each player (2 cards, they'll keep 1 later)
  dealSecretObjectives(gameState);

  // Deal starting action cards (not implemented yet - just placeholder)
  // dealStartingActionCards(gameState);

  return gameState;
}

/**
 * Create a player state
 */
function createPlayer(setup: PlayerSetup, seatIndex: number): PlayerState {
  const faction = factions[setup.factionId];
  if (!faction) {
    throw new Error(`Unknown faction: ${setup.factionId}`);
  }

  // Get generic promissory notes for this player's color
  // Base game: Support for Throne, Ceasefire, Trade Agreement, Political Secret
  const genericNotes = getGenericNoteIdsForColor(setup.color, ['base']);

  // All promissory notes this player owns (faction + generic)
  const allOwnedNotes = [faction.promissoryNote.id, ...genericNotes];

  // Get leader info for this faction (PoK leaders)
  const factionLeaders = FACTION_LEADERS[setup.factionId];

  return {
    id: uuidv4(),
    name: setup.name,
    faction: setup.factionId,
    color: setup.color,
    seatIndex,
    commandTokens: {
      tactics: 3,
      fleet: 3,
      strategy: 2,
    },
    tradeGoods: 0,
    commodities: 0,
    maxCommodities: faction.commodities,
    technologies: [...faction.startingTech],
    actionCards: [],
    secretObjectives: [],
    scoredObjectives: [],
    promissoryNotesOwned: allOwnedNotes,
    promissoryNotesInHand: [...allOwnedNotes], // Start with all notes in hand
    promissoryNotesInPlay: [], // No notes in play initially
    planets: [],
    strategyCard: null,
    strategyCardUsed: false,
    passed: false,
    score: 0,
    neighbors: [],
    transactedWith: [],
    // PoK Leaders - agents start unlocked, commanders/heroes need to be unlocked
    leaders: factionLeaders ? {
      agent: {
        unlocked: true,  // Agents are always unlocked from the start
        exhausted: false,
      },
      commander: {
        unlocked: false, // Commanders require faction-specific unlock conditions
      },
      hero: {
        unlocked: false, // Heroes require scoring 3 objectives
        purged: false,   // Heroes are purged after use
      },
    } : undefined,
    // Bot flag - userId is null for bot players
    isBot: setup.userId === null,
  };
}

/**
 * Create the game map
 */
function createMap(playerCount: number, players: PlayerState[]): MapState {
  const tiles: MapTile[] = [];
  const homePositions = getHomeSystemPositions(playerCount);

  // Place Mecatol Rex at center
  tiles.push(createMapTile(18, { q: 0, r: 0 }));

  // Place home systems
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const faction = factions[player.faction];
    if (!faction) continue;

    const position = homePositions[i];
    const homeSystemId = faction.homeSystemId;

    tiles.push(createMapTile(homeSystemId, position, player.id));
  }

  // Generate positions for other tiles
  const allPositions = generateStandardMapPositions(playerCount);
  const usedPositions = new Set<string>();

  // Mark used positions
  usedPositions.add('0,0'); // Mecatol
  for (const pos of homePositions) {
    usedPositions.add(`${pos.q},${pos.r}`);
  }

  // Get available blue and red tiles
  const blueTiles = Object.values(systems).filter(s => s.type === 'blue');
  const redTiles = Object.values(systems).filter(s => s.type === 'red');

  // Shuffle tiles
  const shuffledBlue = shuffleArray([...blueTiles]);
  const shuffledRed = shuffleArray([...redTiles]);

  // Fill remaining positions
  let blueIndex = 0;
  let redIndex = 0;

  for (const pos of allPositions) {
    const key = `${pos.q},${pos.r}`;
    if (usedPositions.has(key)) continue;

    // Alternate between blue and red tiles (roughly)
    // Aim for ~70% blue, 30% red, but ensure we always place a tile
    let tilePlaced = false;

    if (Math.random() > 0.3 && blueIndex < shuffledBlue.length) {
      // Use blue tile
      tiles.push(createMapTile(shuffledBlue[blueIndex].id, pos));
      blueIndex++;
      tilePlaced = true;
    } else if (redIndex < shuffledRed.length) {
      // Use red tile
      tiles.push(createMapTile(shuffledRed[redIndex].id, pos));
      redIndex++;
      tilePlaced = true;
    } else if (blueIndex < shuffledBlue.length) {
      // Fallback to blue if we ran out of red
      tiles.push(createMapTile(shuffledBlue[blueIndex].id, pos));
      blueIndex++;
      tilePlaced = true;
    }

    // If we still haven't placed a tile (ran out of both), use empty space (system 0)
    if (!tilePlaced) {
      console.warn(`No tiles available for position ${key}, using empty space`);
      tiles.push(createMapTile(0, pos));
    }

    usedPositions.add(key);
  }

  return {
    tiles,
    playerCount,
  };
}

/**
 * Create a map tile from a system ID
 */
function createMapTile(
  systemId: number,
  position: { q: number; r: number },
  controlledBy?: string
): MapTile {
  const system = systems[systemId];

  const planets: PlanetInstance[] = system?.planets.map(planet => ({
    id: uuidv4(),
    planetId: planet.id,
    controlledBy: controlledBy ?? null,
    exhausted: false,
    attachments: [],
    units: [],
  })) ?? [];

  // Frontier tokens are placed on systems with no planets (except home systems and Mecatol)
  // Home systems have a factionId, Mecatol Rex is system 18
  const hasFrontier = planets.length === 0 && !system?.factionId && systemId !== 18;

  return {
    id: uuidv4(),
    systemId,
    position,
    rotation: 0,
    planets,
    wormhole: system?.wormhole ?? null,
    anomaly: system?.anomaly ?? null,
    units: [],
    commandTokens: [],
    frontier: hasFrontier || undefined,
  };
}

/**
 * Create strategy card states
 */
function createStrategyCards(): StrategyCardState[] {
  return Object.values(strategyCards).map(card => ({
    number: card.number,
    name: card.name,
    pickedBy: null,
    exhausted: false,
  }));
}

/**
 * Create initial objectives state
 * - Shuffles Stage I and Stage II objective decks
 * - Reveals 2 Stage I objectives at start
 * - Creates shuffled secret objective deck
 */
function createObjectives(expansions: string[] = ['base']): ObjectiveState {
  // Filter objectives by expansion
  const stageI = STAGE_I_OBJECTIVES.filter(obj =>
    expansions.includes(obj.expansion)
  );
  const stageII = STAGE_II_OBJECTIVES.filter(obj =>
    expansions.includes(obj.expansion)
  );
  const secrets = SECRET_OBJECTIVES.filter(obj =>
    expansions.includes(obj.expansion)
  );

  // Shuffle the decks
  const shuffledStageI = shuffleArray(stageI);
  const shuffledStageII = shuffleArray(stageII);
  const shuffledSecrets = shuffleArray(secrets);

  // Create objective instances for Stage I (5 objectives)
  // First 2 are revealed at start
  const publicStageI: ObjectiveInstance[] = shuffledStageI.slice(0, 5).map((obj, index) => ({
    id: obj.id,
    revealed: index < 2, // First 2 are revealed
    scoredBy: [],
  }));

  // Create objective instances for Stage II (5 objectives)
  // None revealed at start
  const publicStageII: ObjectiveInstance[] = shuffledStageII.slice(0, 5).map(obj => ({
    id: obj.id,
    revealed: false,
    scoredBy: [],
  }));

  // Secret deck is just IDs
  const secretDeck = shuffledSecrets.map(obj => obj.id);

  return {
    publicStageI,
    publicStageII,
    revealedCount: 2, // 2 Stage I objectives revealed at start
    secretDeck,
  };
}

/**
 * Deal 2 secret objectives to each player
 * In TI4, players keep 1 and discard 1 during setup
 * For now, we store both in their secretObjectives array
 * A later action will let them choose which to keep
 */
function dealSecretObjectives(state: GameState): void {
  const deck = state.objectives.secretDeck;

  for (const player of state.players) {
    // Deal 2 secret objectives to each player
    if (deck.length >= 2) {
      const secret1 = deck.shift()!;
      const secret2 = deck.shift()!;
      player.secretObjectives = [secret1, secret2];
    }
  }
}

/**
 * Create initial agenda state
 */
function createAgendaState(): AgendaState {
  return {
    currentAgenda: null,
    currentAgendaNumber: 1,
    votes: new Map(),
    outcome: null,
    riders: [],
  };
}


/**
 * Place starting units for a player
 */
function placeStartingUnits(state: GameState, player: PlayerState): void {
  const faction = factions[player.faction];
  if (!faction) return;

  // Find player's home system tile
  const homeTile = state.map.tiles.find(tile => {
    const system = systems[tile.systemId];
    return system?.factionId === player.faction;
  });

  if (!homeTile) return;

  for (const startingUnit of faction.startingUnits) {
    for (let i = 0; i < startingUnit.count; i++) {
      const unit = createUnit(startingUnit.type, player.id);

      if (startingUnit.planet) {
        // Place on planet
        const planet = homeTile.planets.find(
          p => p.planetId === startingUnit.planet
        );
        if (planet) {
          unit.planetId = planet.planetId;
          planet.units.push(unit);

          // Add planet to player's controlled planets
          if (!player.planets.some(p => p.planetId === planet.planetId)) {
            player.planets.push({
              planetId: planet.planetId,
              exhausted: false,
              attachments: [],
            });
          }
        }
      } else {
        // Place in space
        homeTile.units.push(unit);
      }
    }
  }
}

/**
 * Create a unit instance
 */
function createUnit(type: UnitType, ownerId: string): UnitInstance {
  return {
    id: uuidv4(),
    type,
    ownerId,
    damaged: false,
  };
}

/**
 * Shuffle an array (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
