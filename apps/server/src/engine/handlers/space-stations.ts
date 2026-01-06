/**
 * Thunder's Edge Space Station Handlers
 *
 * Space Stations are a new location type in Thunder's Edge that provide
 * economic benefits to their controllers:
 * - +1 commodity value per controlled station
 * - Exhaust to convert commodities to trade goods
 * - Enable transactions between non-neighbors who both control stations
 */

import type {
  GameState,
  PlayerState,
  MapTile,
  UnitInstance,
} from '@ti4/shared';

// ============================================================================
// Types
// ============================================================================

export interface HandlerResult {
  success: boolean;
  error?: string;
  triggeredEvents?: string[];
  data?: Record<string, unknown>;
}

export interface SpaceStationState {
  /** The station's planet ID */
  stationId: string;
  /** System containing the station */
  systemId: string;
  /** Current controller (if any) */
  controllerId?: string;
  /** Whether the station is exhausted */
  exhausted: boolean;
}

// Space station planet IDs
const SPACE_STATION_IDS = ['tsion_station', 'oluz_station', 'the_watchtower'];

// ============================================================================
// Station Control
// ============================================================================

/**
 * Check who controls a space station
 * A station is controlled by the player who has the only ships in that system
 * Once controlled, it stays controlled until another player has the only ships there
 */
export function getStationController(
  state: GameState,
  stationId: string
): string | null {
  // Find the system containing this station
  const tile = state.map.tiles.find((t: MapTile) =>
    t.planets.some((p) => p.id === stationId)
  );
  if (!tile) {
    return null;
  }

  // Get ships in the system
  const shipsInSystem = tile.units.filter((u: UnitInstance) =>
    isShipType(u.type)
  );

  if (shipsInSystem.length === 0) {
    // No ships - retain previous controller (check station state)
    return state.spaceStationState?.find(
      (s: SpaceStationState) => s.stationId === stationId
    )?.controllerId ?? null;
  }

  // Check if all ships belong to one player
  const owners = [...new Set(shipsInSystem.map((u: UnitInstance) => u.ownerId))];
  if (owners.length === 1) {
    return owners[0];
  }

  // Multiple players have ships - station is contested, retain previous controller
  return state.spaceStationState?.find(
    (s: SpaceStationState) => s.stationId === stationId
  )?.controllerId ?? null;
}

/**
 * Update space station control for all stations
 */
export function updateAllStationControl(state: GameState): void {
  if (!state.spaceStationState) {
    state.spaceStationState = [];
  }

  for (const stationId of SPACE_STATION_IDS) {
    const tile = state.map.tiles.find((t: MapTile) =>
      t.planets.some((p) => p.id === stationId)
    );
    if (!tile) continue;

    const newController = getStationController(state, stationId);

    let stationState = state.spaceStationState.find(
      (s: SpaceStationState) => s.stationId === stationId
    );

    if (!stationState) {
      stationState = {
        stationId,
        systemId: tile.id,
        controllerId: newController ?? undefined,
        exhausted: false,
      };
      state.spaceStationState.push(stationState);
    } else if (newController !== stationState.controllerId) {
      stationState.controllerId = newController ?? undefined;
      // Ready the station when control changes
      stationState.exhausted = false;
    }
  }
}

/**
 * Get all stations controlled by a player
 */
export function getControlledStations(
  state: GameState,
  playerId: string
): SpaceStationState[] {
  if (!state.spaceStationState) {
    return [];
  }

  return state.spaceStationState.filter(
    (s: SpaceStationState) => s.controllerId === playerId
  );
}

// ============================================================================
// Commodity Bonus
// ============================================================================

/**
 * Get the commodity bonus for a player based on controlled stations
 */
export function getStationCommodityBonus(
  state: GameState,
  playerId: string
): number {
  const controlledStations = getControlledStations(state, playerId);
  return controlledStations.length;
}

/**
 * Get a player's effective maximum commodities (including station bonus)
 */
export function getEffectiveMaxCommodities(
  state: GameState,
  player: PlayerState
): number {
  const baseMax = player.maxCommodities;
  const stationBonus = getStationCommodityBonus(state, player.id);
  return baseMax + stationBonus;
}

// ============================================================================
// Station Abilities
// ============================================================================

/**
 * Exhaust a station to convert commodities to trade goods
 */
export function handleExhaustStation(
  state: GameState,
  playerId: string,
  stationId: string
): HandlerResult {
  if (!state.spaceStationState) {
    return { success: false, error: 'No stations in game' };
  }

  const stationState = state.spaceStationState.find(
    (s: SpaceStationState) => s.stationId === stationId
  );
  if (!stationState) {
    return { success: false, error: 'Station not found' };
  }

  if (stationState.controllerId !== playerId) {
    return { success: false, error: 'Player does not control this station' };
  }

  if (stationState.exhausted) {
    return { success: false, error: 'Station is already exhausted' };
  }

  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Convert all commodities to trade goods
  const commoditiesToConvert = player.commodities;
  if (commoditiesToConvert === 0) {
    return { success: false, error: 'No commodities to convert' };
  }

  player.tradeGoods += commoditiesToConvert;
  player.commodities = 0;
  stationState.exhausted = true;

  return {
    success: true,
    triggeredEvents: ['station_exhausted', 'commodities_converted'],
    data: {
      stationId,
      commoditiesConverted: commoditiesToConvert,
      newTradeGoods: player.tradeGoods,
    },
  };
}

/**
 * Ready all stations (during status phase)
 */
export function readyAllStations(state: GameState): void {
  if (!state.spaceStationState) {
    return;
  }

  for (const station of state.spaceStationState) {
    station.exhausted = false;
  }
}

// ============================================================================
// Transaction Rules
// ============================================================================

/**
 * Check if two players can transact via space stations
 * Players who both control space stations can transact even if not neighbors
 */
export function canTransactViaStations(
  state: GameState,
  player1Id: string,
  player2Id: string
): boolean {
  const player1Stations = getControlledStations(state, player1Id);
  const player2Stations = getControlledStations(state, player2Id);

  return player1Stations.length > 0 && player2Stations.length > 0;
}

/**
 * Get all players a given player can transact with (including via stations)
 */
export function getTransactionPartners(
  state: GameState,
  playerId: string
): string[] {
  const player = state.players.find((p: PlayerState) => p.id === playerId);
  if (!player) {
    return [];
  }

  const partners = new Set<string>();

  // Add normal neighbors
  for (const neighborId of player.neighbors) {
    partners.add(neighborId);
  }

  // Add station partners
  const playerHasStation = getControlledStations(state, playerId).length > 0;
  if (playerHasStation) {
    for (const otherPlayer of state.players) {
      if (otherPlayer.id !== playerId) {
        const otherHasStation = getControlledStations(state, otherPlayer.id).length > 0;
        if (otherHasStation) {
          partners.add(otherPlayer.id);
        }
      }
    }
  }

  return [...partners];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a unit type is a ship
 */
function isShipType(unitType: string): boolean {
  const shipTypes = ['fighter', 'destroyer', 'carrier', 'cruiser', 'dreadnought', 'war_sun', 'flagship'];
  return shipTypes.includes(unitType);
}

/**
 * Check if a planet is a space station
 */
export function isSpaceStation(planetId: string): boolean {
  return SPACE_STATION_IDS.includes(planetId);
}

/**
 * Get all space station IDs
 */
export function getSpaceStationIds(): string[] {
  return [...SPACE_STATION_IDS];
}
