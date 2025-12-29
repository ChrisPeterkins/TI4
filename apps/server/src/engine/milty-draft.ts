import { systems, factions } from '@ti4/game-data';

// Local type definitions (also defined in @ti4/shared)
export interface MiltySlice {
  id: number;
  systems: number[];
  totalResources: number;
  totalInfluence: number;
  optimalValue: number;
}

export interface MiltyDraftState {
  phase: 'setup' | 'drafting' | 'complete';
  slices: MiltySlice[];
  factionPool: string[];
  speakerOrder: (string | null)[];
  draftOrder: string[];
  currentPickIndex: number;
  picks: MiltyDraftPick[];
}

export interface MiltyDraftPick {
  playerId: string;
  pickType: 'faction' | 'slice' | 'speaker';
  value: string | number;
}

// Tile tiers based on optimal value (resources + influence) - for reference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _TILE_TIERS = {
  top: [26, 27, 28, 29, 30, 35], // High value blue tiles
  mid: [19, 20, 21, 22, 23, 24, 25, 31, 32, 33, 34, 37, 38], // Medium value blue tiles
  low: [36, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50], // Lower value blue tiles
  red: [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80], // Red tiles (anomalies, wormholes, etc)
};

// Minimum thresholds for a valid slice
const MIN_RESOURCES = 3;
const MIN_INFLUENCE = 3;
const MIN_OPTIMAL = 8;
const MAX_OPTIMAL = 14;

/**
 * Calculate the optimal value of a system (resources + influence + special bonuses)
 */
function calculateSystemValue(systemId: number): { resources: number; influence: number; optimal: number } {
  const system = systems[systemId];
  if (!system) return { resources: 0, influence: 0, optimal: 0 };

  let resources = 0;
  let influence = 0;
  let bonus = 0;

  for (const planet of system.planets) {
    resources += planet.resources;
    influence += planet.influence;

    // Bonuses for special traits
    if (planet.trait === 'cultural') bonus += 0.5;
    if (planet.trait === 'industrial') bonus += 0.5;
    if (planet.trait === 'hazardous') bonus += 0.5;
    if (planet.techSpecialty) bonus += 1;
    if (planet.legendary) bonus += 2;
  }

  // Wormholes add connectivity value
  if (system.wormhole) bonus += 0.5;

  return {
    resources,
    influence,
    optimal: resources + influence + bonus,
  };
}

/**
 * Shuffle array using Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Check if a slice is valid (meets minimum thresholds and has no conflicts)
 */
function isValidSlice(systemIds: number[]): boolean {
  let totalResources = 0;
  let totalInfluence = 0;
  let totalOptimal = 0;
  const wormholes = new Set<string>();

  for (const id of systemIds) {
    const values = calculateSystemValue(id);
    totalResources += values.resources;
    totalInfluence += values.influence;
    totalOptimal += values.optimal;

    const system = systems[id];
    if (system?.wormhole) {
      // No duplicate wormhole types
      if (wormholes.has(system.wormhole)) return false;
      wormholes.add(system.wormhole);
    }
  }

  return (
    totalResources >= MIN_RESOURCES &&
    totalInfluence >= MIN_INFLUENCE &&
    totalOptimal >= MIN_OPTIMAL &&
    totalOptimal <= MAX_OPTIMAL
  );
}

/**
 * Generate balanced slices for Milty Draft
 * Each slice contains: 1 top-tier, 1 mid-tier, 1 low-tier blue tile + 2 red tiles
 */
export function generateSlices(playerCount: number, expansions: string[]): MiltySlice[] {
  const slices: MiltySlice[] = [];
  const maxAttempts = 100;

  // Filter tiles based on expansions
  const availableBlue = Object.values(systems)
    .filter(s => s.type === 'blue' && expansions.includes(s.expansion || 'base'))
    .map(s => s.id);

  const availableRed = Object.values(systems)
    .filter(s => s.type === 'red' && expansions.includes(s.expansion || 'base'))
    .map(s => s.id);

  // Categorize blue tiles by value
  const sortedBlue = [...availableBlue].sort((a, b) => {
    const valA = calculateSystemValue(a).optimal;
    const valB = calculateSystemValue(b).optimal;
    return valB - valA;
  });

  const tierSize = Math.floor(sortedBlue.length / 3);
  const topTier = sortedBlue.slice(0, tierSize);
  const midTier = sortedBlue.slice(tierSize, tierSize * 2);
  const lowTier = sortedBlue.slice(tierSize * 2);

  // Shuffle each tier
  const shuffledTop = shuffleArray(topTier);
  const shuffledMid = shuffleArray(midTier);
  const shuffledLow = shuffleArray(lowTier);
  const shuffledRed = shuffleArray(availableRed);

  for (let i = 0; i < playerCount; i++) {
    let attempt = 0;
    let validSlice = false;
    let sliceSystems: number[] = [];

    while (!validSlice && attempt < maxAttempts) {
      // Pick one from each tier
      const topIdx = (i + attempt) % shuffledTop.length;
      const midIdx = (i + attempt) % shuffledMid.length;
      const lowIdx = (i + attempt) % shuffledLow.length;
      const red1Idx = (i * 2 + attempt) % shuffledRed.length;
      const red2Idx = (i * 2 + 1 + attempt) % shuffledRed.length;

      sliceSystems = [
        shuffledTop[topIdx],
        shuffledMid[midIdx],
        shuffledLow[lowIdx],
        shuffledRed[red1Idx],
        shuffledRed[red2Idx],
      ].filter(id => id !== undefined);

      validSlice = isValidSlice(sliceSystems);
      attempt++;
    }

    // Calculate slice totals
    let totalResources = 0;
    let totalInfluence = 0;
    let totalOptimal = 0;

    for (const id of sliceSystems) {
      const values = calculateSystemValue(id);
      totalResources += values.resources;
      totalInfluence += values.influence;
      totalOptimal += values.optimal;
    }

    slices.push({
      id: i,
      systems: sliceSystems,
      totalResources,
      totalInfluence,
      optimalValue: totalOptimal,
    });
  }

  return slices;
}

/**
 * Generate a pool of factions for drafting
 */
export function generateFactionPool(playerCount: number, expansions: string[]): string[] {
  const availableFactions = Object.values(factions)
    .filter(f => expansions.includes(f.expansion || 'base'))
    .map(f => f.id);

  // Shuffle and take playerCount + 2 (or all if less available)
  const shuffled = shuffleArray(availableFactions);
  return shuffled.slice(0, Math.min(playerCount + 2, shuffled.length));
}

/**
 * Initialize a new Milty Draft state
 */
export function initializeDraft(
  playerCount: number,
  playerIds: string[],
  expansions: string[]
): MiltyDraftState {
  const slices = generateSlices(playerCount, expansions);
  const factionPool = generateFactionPool(playerCount, expansions);

  // Random draft order
  const draftOrder = shuffleArray([...playerIds]);

  // Initialize empty speaker order slots
  const speakerOrder: (string | null)[] = new Array(playerCount).fill(null);

  return {
    phase: 'drafting',
    slices,
    factionPool,
    speakerOrder,
    draftOrder,
    currentPickIndex: 0,
    picks: [],
  };
}

/**
 * Get whose turn it is to pick (snake draft order)
 */
export function getCurrentPicker(draftState: MiltyDraftState): string | null {
  const totalPicks = draftState.picks.length;
  const playerCount = draftState.draftOrder.length;
  const totalRequired = playerCount * 3; // Each player picks 3 things

  if (totalPicks >= totalRequired) {
    return null; // Draft complete
  }

  // Snake draft: 0,1,2,3,4,5,5,4,3,2,1,0,0,1,2...
  const round = Math.floor(totalPicks / playerCount);
  const indexInRound = totalPicks % playerCount;

  const isReverse = round % 2 === 1;
  const playerIndex = isReverse
    ? playerCount - 1 - indexInRound
    : indexInRound;

  return draftState.draftOrder[playerIndex];
}

/**
 * Get what a player still needs to pick
 */
export function getPlayerNeeds(draftState: MiltyDraftState, playerId: string): {
  needsFaction: boolean;
  needsSlice: boolean;
  needsSpeaker: boolean;
} {
  const playerPicks = draftState.picks.filter((p: MiltyDraftPick) => p.playerId === playerId);

  return {
    needsFaction: !playerPicks.some((p: MiltyDraftPick) => p.pickType === 'faction'),
    needsSlice: !playerPicks.some((p: MiltyDraftPick) => p.pickType === 'slice'),
    needsSpeaker: !playerPicks.some((p: MiltyDraftPick) => p.pickType === 'speaker'),
  };
}

/**
 * Get available options for the current pick
 */
export function getAvailableOptions(draftState: MiltyDraftState): {
  factions: string[];
  slices: number[];
  speakerPositions: number[];
} {
  const pickedFactions = new Set(
    draftState.picks
      .filter((p: MiltyDraftPick) => p.pickType === 'faction')
      .map((p: MiltyDraftPick) => p.value as string)
  );

  const pickedSlices = new Set(
    draftState.picks
      .filter((p: MiltyDraftPick) => p.pickType === 'slice')
      .map((p: MiltyDraftPick) => p.value as number)
  );

  const pickedSpeakerPositions = new Set(
    draftState.picks
      .filter((p: MiltyDraftPick) => p.pickType === 'speaker')
      .map((p: MiltyDraftPick) => p.value as number)
  );

  return {
    factions: draftState.factionPool.filter((f: string) => !pickedFactions.has(f)),
    slices: draftState.slices.map((s: MiltySlice) => s.id).filter((id: number) => !pickedSlices.has(id)),
    speakerPositions: Array.from(
      { length: draftState.speakerOrder.length },
      (_, i) => i
    ).filter((i: number) => !pickedSpeakerPositions.has(i)),
  };
}

/**
 * Make a draft pick
 */
export function makePick(
  draftState: MiltyDraftState,
  playerId: string,
  pickType: 'faction' | 'slice' | 'speaker',
  value: string | number
): { success: boolean; error?: string; draftState: MiltyDraftState } {
  // Validate it's this player's turn
  const currentPicker = getCurrentPicker(draftState);
  if (currentPicker !== playerId) {
    return { success: false, error: 'Not your turn to pick', draftState };
  }

  // Validate player needs this type of pick
  const needs = getPlayerNeeds(draftState, playerId);
  if (pickType === 'faction' && !needs.needsFaction) {
    return { success: false, error: 'Already picked a faction', draftState };
  }
  if (pickType === 'slice' && !needs.needsSlice) {
    return { success: false, error: 'Already picked a slice', draftState };
  }
  if (pickType === 'speaker' && !needs.needsSpeaker) {
    return { success: false, error: 'Already picked a speaker position', draftState };
  }

  // Validate option is available
  const available = getAvailableOptions(draftState);
  if (pickType === 'faction' && !available.factions.includes(value as string)) {
    return { success: false, error: 'Faction not available', draftState };
  }
  if (pickType === 'slice' && !available.slices.includes(value as number)) {
    return { success: false, error: 'Slice not available', draftState };
  }
  if (pickType === 'speaker' && !available.speakerPositions.includes(value as number)) {
    return { success: false, error: 'Speaker position not available', draftState };
  }

  // Make the pick
  const newPick: MiltyDraftPick = { playerId, pickType, value };
  const newPicks = [...draftState.picks, newPick];

  // Update speaker order if picking speaker position
  let newSpeakerOrder = [...draftState.speakerOrder];
  if (pickType === 'speaker') {
    newSpeakerOrder[value as number] = playerId;
  }

  // Check if draft is complete
  const playerCount = draftState.draftOrder.length;
  const isComplete = newPicks.length >= playerCount * 3;

  const newDraftState: MiltyDraftState = {
    ...draftState,
    picks: newPicks,
    speakerOrder: newSpeakerOrder,
    currentPickIndex: draftState.currentPickIndex + 1,
    phase: isComplete ? 'complete' : 'drafting',
  };

  return { success: true, draftState: newDraftState };
}

/**
 * Get final assignments after draft is complete
 */
export function getFinalAssignments(draftState: MiltyDraftState): {
  playerId: string;
  faction: string;
  sliceId: number;
  speakerPosition: number;
}[] {
  const assignments: {
    playerId: string;
    faction: string;
    sliceId: number;
    speakerPosition: number;
  }[] = [];

  for (const playerId of draftState.draftOrder) {
    const playerPicks = draftState.picks.filter((p: MiltyDraftPick) => p.playerId === playerId);

    const factionPick = playerPicks.find((p: MiltyDraftPick) => p.pickType === 'faction');
    const slicePick = playerPicks.find((p: MiltyDraftPick) => p.pickType === 'slice');
    const speakerPick = playerPicks.find((p: MiltyDraftPick) => p.pickType === 'speaker');

    const faction = factionPick?.value as string;
    const sliceId = slicePick?.value as number;
    const speakerPosition = speakerPick?.value as number;

    if (faction && sliceId !== undefined && speakerPosition !== undefined) {
      assignments.push({ playerId, faction, sliceId, speakerPosition });
    }
  }

  return assignments;
}
