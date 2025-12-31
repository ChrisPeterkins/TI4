import type {
  GameState,
  ExploreAction,
  PurgeRelicFragmentsAction,
  ExplorationDecks,
} from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { systems } from '@ti4/game-data';

/**
 * Validate an exploration action
 */
export function validateExplore(
  state: GameState,
  action: ExploreAction
): ValidationResult {
  const { playerId, planetId } = action;
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if we're in action phase during a tactical action
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only explore during action phase' };
  }

  // Find the planet on the map
  let targetPlanet = null;
  let systemTile = null;

  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p) => p.planetId === planetId);
    if (planet) {
      targetPlanet = planet;
      systemTile = tile;
      break;
    }
  }

  if (!targetPlanet || !systemTile) {
    return { valid: false, error: 'Planet not found on map' };
  }

  // Check if player controls the planet
  if (targetPlanet.controlledBy !== playerId) {
    return { valid: false, error: 'You do not control this planet' };
  }

  // Check if planet has already been explored this turn
  if (state.planetsExploredThisTurn?.includes(planetId)) {
    return { valid: false, error: 'This planet has already been explored this turn' };
  }

  // Get planet data to check trait
  const systemData = systems[systemTile.systemId];
  if (!systemData) {
    return { valid: false, error: 'System data not found' };
  }

  const planetData = systemData.planets.find((p: { id: string }) => p.id === planetId);
  if (!planetData) {
    return { valid: false, error: 'Planet data not found' };
  }

  // Check if planet has a trait (required for exploration)
  if (!planetData.trait) {
    return { valid: false, error: 'This planet has no trait and cannot be explored' };
  }

  // Check if the exploration deck has cards
  const deckType = planetData.trait as keyof ExplorationDecks;
  const deck = state.explorationDecks?.[deckType];

  if (!deck || deck.length === 0) {
    return { valid: false, error: `No cards remaining in ${deckType} exploration deck` };
  }

  return { valid: true };
}

/**
 * Validate a frontier exploration action (empty space with frontier token)
 */
export function validateExploreFrontier(
  state: GameState,
  action: ExploreAction & { systemPosition?: { q: number; r: number } }
): ValidationResult {
  const { playerId, systemPosition } = action;
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if we're in action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only explore during action phase' };
  }

  // Check if player has Dark Energy Tap technology
  if (!player.technologies?.includes('dark_energy_tap')) {
    return { valid: false, error: 'Dark Energy Tap technology required to explore frontier' };
  }

  // Find the system
  if (!systemPosition) {
    return { valid: false, error: 'System position required for frontier exploration' };
  }

  const tile = state.map.tiles.find(
    (t) => t.position.q === systemPosition.q && t.position.r === systemPosition.r
  );

  if (!tile) {
    return { valid: false, error: 'System not found' };
  }

  // Check if system has a frontier token
  if (!tile.frontier) {
    return { valid: false, error: 'This system does not have a frontier token' };
  }

  // Check if player has ships in the system
  const playerShips = tile.units.filter(
    (u) => u.ownerId === playerId && ['carrier', 'cruiser', 'destroyer', 'dreadnought', 'flagship', 'war_sun', 'fighter'].includes(u.type)
  );

  if (playerShips.length === 0) {
    return { valid: false, error: 'You must have ships in the system to explore frontier' };
  }

  // Check frontier deck
  const deck = state.explorationDecks?.frontier;
  if (!deck || deck.length === 0) {
    return { valid: false, error: 'No cards remaining in frontier exploration deck' };
  }

  return { valid: true };
}

/**
 * Validate purging relic fragments to gain a relic
 */
export function validatePurgeRelicFragments(
  state: GameState,
  action: PurgeRelicFragmentsAction
): ValidationResult {
  const { playerId, fragmentType, count } = action;
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Check if we're in action phase
  if (state.phase !== 'action') {
    return { valid: false, error: 'Can only purge fragments during action phase' };
  }

  // Must purge exactly 3 fragments
  if (count !== 3) {
    return { valid: false, error: 'Must purge exactly 3 fragments' };
  }

  // Check if player has enough fragments
  const fragments = player.relicFragments;
  if (!fragments) {
    return { valid: false, error: 'You have no relic fragments' };
  }

  // Calculate available fragments of the specified type
  // Unknown fragments can substitute for any type
  const specificFragments = fragments[fragmentType] || 0;
  const unknownFragments = fragments.unknown || 0;

  if (specificFragments + unknownFragments < 3) {
    return {
      valid: false,
      error: `Not enough ${fragmentType} fragments (have ${specificFragments} + ${unknownFragments} unknown)`,
    };
  }

  // Check if relic deck has cards
  const relicDeck = state.relicDeck;
  if (!relicDeck || relicDeck.length === 0) {
    return { valid: false, error: 'No relics remaining in deck' };
  }

  return { valid: true };
}
