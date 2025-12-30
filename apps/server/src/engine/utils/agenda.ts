import type {
  GameState,
  PlayerState,
  UUID,
} from '@ti4/shared';
import { systems } from '@ti4/game-data';

/**
 * Calculate the voting order for the agenda phase.
 * Order is: starting from player to the left of speaker, clockwise, speaker votes last.
 *
 * @param players - All players in the game
 * @param speakerId - ID of the current speaker
 * @returns Array of player IDs in voting order
 */
export function calculateVotingOrder(players: PlayerState[], speakerId: UUID): UUID[] {
  // Sort players by seatIndex (clockwise seating)
  const sortedPlayers = [...players].sort((a, b) => a.seatIndex - b.seatIndex);

  // Find speaker's position
  const speakerIndex = sortedPlayers.findIndex(p => p.id === speakerId);
  if (speakerIndex === -1) {
    // Fallback: return players in seat order
    return sortedPlayers.map(p => p.id);
  }

  const playerCount = sortedPlayers.length;
  const order: UUID[] = [];

  // Start from the player to the left of speaker (next clockwise position)
  // and continue clockwise until we've added all non-speaker players
  for (let i = 1; i < playerCount; i++) {
    const index = (speakerIndex + i) % playerCount;
    order.push(sortedPlayers[index].id);
  }

  // Speaker votes last
  order.push(speakerId);

  return order;
}

/**
 * Calculate available influence votes for a player.
 * Only unexhausted planets can be used for voting.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Object with total influence and planet details
 */
export function calculateAvailableVotes(
  state: GameState,
  playerId: UUID
): {
  totalInfluence: number;
  planets: Array<{
    planetId: string;
    name: string;
    influence: number;
    exhausted: boolean;
  }>;
} {
  const player = state.players.find(p => p.id === playerId);
  if (!player) {
    return { totalInfluence: 0, planets: [] };
  }

  const planets: Array<{
    planetId: string;
    name: string;
    influence: number;
    exhausted: boolean;
  }> = [];

  let totalInfluence = 0;

  for (const planetState of player.planets) {
    const planetData = findPlanetData(planetState.planetId);
    if (!planetData) continue;

    planets.push({
      planetId: planetState.planetId,
      name: planetData.name,
      influence: planetData.influence,
      exhausted: planetState.exhausted,
    });

    // Only count unexhausted planets
    if (!planetState.exhausted) {
      totalInfluence += planetData.influence;
    }
  }

  return { totalInfluence, planets };
}

/**
 * Calculate votes from a set of exhausted planets.
 *
 * @param planetIds - Array of planet IDs being exhausted
 * @returns Total influence votes
 */
export function calculateVotesFromPlanets(planetIds: string[]): number {
  let total = 0;

  for (const planetId of planetIds) {
    const planetData = findPlanetData(planetId);
    if (planetData) {
      total += planetData.influence;
    }
  }

  return total;
}

/**
 * Find planet data by planet ID.
 *
 * @param planetId - The planet ID to look up
 * @returns Planet data or null if not found
 */
export function findPlanetData(planetId: string): {
  id: string;
  name: string;
  resources: number;
  influence: number;
} | null {
  for (const system of Object.values(systems)) {
    const planet = system.planets.find(p => p.id === planetId);
    if (planet) {
      return {
        id: planet.id,
        name: planet.name,
        resources: planet.resources,
        influence: planet.influence,
      };
    }
  }
  return null;
}

/**
 * Get valid outcomes for an agenda based on its election type.
 *
 * @param state - Current game state
 * @param electionType - Type of election
 * @returns Array of valid outcome strings
 */
export function getValidOutcomes(
  state: GameState,
  electionType: 'for_against' | 'player' | 'planet' | 'scored_secret' | 'law' | 'strategy_card' | 'custom' | null
): string[] {
  switch (electionType) {
    case 'for_against':
      return ['for', 'against'];

    case 'player':
      return state.players.map(p => p.id);

    case 'planet':
      // All controlled planets
      const planets: string[] = [];
      for (const player of state.players) {
        for (const planet of player.planets) {
          planets.push(planet.planetId);
        }
      }
      return planets;

    case 'scored_secret':
      // All scored secret objectives
      const scoredSecrets: string[] = [];
      for (const player of state.players) {
        for (const objId of player.scoredObjectives) {
          if (!scoredSecrets.includes(objId)) {
            scoredSecrets.push(objId);
          }
        }
      }
      return scoredSecrets;

    case 'law':
      // All laws currently in play
      return state.laws.map(law => law.cardId);

    case 'strategy_card':
      // All strategy cards (1-8)
      return ['1', '2', '3', '4', '5', '6', '7', '8'];

    case 'custom':
      // Custom elections need specific handling
      // For now, return empty array - should be handled case by case
      return [];

    default:
      return [];
  }
}

/**
 * Check if a player can vote (has not been blocked by effects).
 * MVP: Returns true for all players.
 *
 * @param state - Current game state
 * @param playerId - ID of the player
 * @returns Whether the player can vote
 */
export function canPlayerVote(state: GameState, playerId: UUID): boolean {
  // MVP: All players can vote
  // Future: Check for Assassinate Representative, Nekro Virus faction ability, etc.
  return true;
}

/**
 * Tally votes for each outcome.
 *
 * @param votes - Map of player ID to their vote record
 * @returns Map of outcome to total votes
 */
export function tallyVotes(
  votes: Record<UUID, { outcome: string; votes: number; extraVotes: number; abstained: boolean }>
): Record<string, number> {
  const tallies: Record<string, number> = {};

  for (const vote of Object.values(votes)) {
    if (vote.abstained) continue;

    const totalVotes = vote.votes + vote.extraVotes;
    tallies[vote.outcome] = (tallies[vote.outcome] || 0) + totalVotes;
  }

  return tallies;
}

/**
 * Determine the winning outcome from vote tallies.
 * Returns null if there's a tie that requires speaker tiebreak.
 *
 * @param tallies - Vote tallies by outcome
 * @returns The winning outcome, or null if tied
 */
export function determineWinner(tallies: Record<string, number>): {
  winner: string | null;
  tied: string[];
  topVotes: number;
} {
  const entries = Object.entries(tallies);

  if (entries.length === 0) {
    return { winner: null, tied: [], topVotes: 0 };
  }

  // Sort by votes descending
  entries.sort((a, b) => b[1] - a[1]);

  const topVotes = entries[0][1];
  const tied = entries.filter(([_, votes]) => votes === topVotes).map(([outcome]) => outcome);

  if (tied.length === 1) {
    return { winner: tied[0], tied: [], topVotes };
  }

  // Tie - needs speaker to break
  return { winner: null, tied, topVotes };
}
