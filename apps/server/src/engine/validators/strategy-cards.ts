import type {
  GameState,
  StrategicPrimaryAction,
  StrategicSecondaryAction,
  HexCoord,
} from '@ti4/shared';
import type { ValidationResult } from '../game-machine.js';
import { findTileAtPosition } from '../utils/hex.js';
import { technologies, systems, meetsPrerequisites } from '@ti4/game-data';

/**
 * Validate strategic primary action
 */
export function validateStrategicPrimary(
  state: GameState,
  action: StrategicPrimaryAction
): ValidationResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be in strategic_primary sub-phase
  if (state.subPhase !== 'strategic_primary') {
    return { valid: false, error: 'Not in strategic primary phase' };
  }

  // Must be the active player
  if (state.activePlayerId !== action.playerId) {
    return { valid: false, error: 'Not your turn' };
  }

  // Verify tracking matches
  const tracking = state.strategicActionState;
  if (!tracking || tracking.cardNumber !== action.cardNumber) {
    return { valid: false, error: 'Strategy card mismatch' };
  }

  // Validate card-specific choices
  switch (action.cardNumber) {
    case 1:
      return validateLeadershipPrimary(state, player, action);
    case 2:
      return validateDiplomacyPrimary(state, player, action);
    case 3:
      return validatePoliticsPrimary(state, player, action);
    case 4:
      return validateConstructionPrimary(state, player, action);
    case 5:
      return validateTradePrimary(state, player, action);
    case 6:
      return validateWarfarePrimary(state, player, action);
    case 7:
      return validateTechnologyPrimary(state, player, action);
    case 8:
      return validateImperialPrimary(state, player, action);
    default:
      return { valid: false, error: 'Unknown strategy card' };
  }
}

/**
 * Validate strategic secondary action
 */
export function validateStrategicSecondary(
  state: GameState,
  action: StrategicSecondaryAction
): ValidationResult {
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) {
    return { valid: false, error: 'Player not found' };
  }

  // Must be in strategic_secondary sub-phase
  if (state.subPhase !== 'strategic_secondary') {
    return { valid: false, error: 'Not in strategic secondary phase' };
  }

  const tracking = state.strategicActionState;
  if (!tracking || tracking.cardNumber !== action.cardNumber) {
    return { valid: false, error: 'Strategy card mismatch' };
  }

  // Verify it's this player's turn in secondary order
  const currentPlayerId = tracking.secondaryOrder[tracking.currentSecondaryIndex];
  if (currentPlayerId !== action.playerId) {
    return { valid: false, error: 'Not your turn to resolve secondary' };
  }

  // If declining, no further validation needed
  if (action.declined) {
    return { valid: true };
  }

  // Check strategy token (Leadership is free, Trade may have free players)
  const isFreeSecondary = action.cardNumber === 1 ||
    tracking.freeSecondaryPlayers?.includes(action.playerId);

  if (!isFreeSecondary && player.commandTokens.strategy <= 0) {
    return { valid: false, error: 'No strategy tokens available' };
  }

  // Validate card-specific choices
  switch (action.cardNumber) {
    case 1:
      return validateLeadershipSecondary(state, player, action);
    case 2:
      return validateDiplomacySecondary(state, player, action);
    case 3:
      return { valid: true }; // Politics secondary just draws cards
    case 4:
      return validateConstructionSecondary(state, player, action);
    case 5:
      return { valid: true }; // Trade secondary just refreshes commodities
    case 6:
      return validateWarfareSecondary(state, player, action);
    case 7:
      return validateTechnologySecondary(state, player, action);
    case 8:
      return validateImperialSecondary(state, player, action);
    default:
      return { valid: false, error: 'Unknown strategy card' };
  }
}

// ============================================
// Primary Validators
// ============================================

function validateLeadershipPrimary(
  state: GameState,
  player: { id: string; planets: { planetId: string; exhausted: boolean }[] },
  action: StrategicPrimaryAction
): ValidationResult {
  const choices = action.choices;

  // Validate influence spending
  if (choices.influenceSpent && choices.influenceSpent > 0) {
    // Check player has enough unexhausted planet influence
    const availableInfluence = calculateAvailableInfluence(state, player.id);
    if (choices.influenceSpent > availableInfluence) {
      return { valid: false, error: 'Not enough influence available' };
    }
  }

  // Validate token distribution
  const baseTokens = 3;
  const bonusTokens = choices.influenceSpent ? Math.floor(choices.influenceSpent / 3) : 0;
  const totalTokens = baseTokens + bonusTokens;

  if (choices.tokenDistribution) {
    const { tactics, fleet, strategy } = choices.tokenDistribution;
    if (tactics < 0 || fleet < 0 || strategy < 0) {
      return { valid: false, error: 'Token distribution cannot be negative' };
    }
    if (tactics + fleet + strategy !== totalTokens) {
      return { valid: false, error: `Must distribute exactly ${totalTokens} tokens` };
    }
  }

  return { valid: true };
}

function validateDiplomacyPrimary(
  state: GameState,
  player: { id: string },
  action: StrategicPrimaryAction
): ValidationResult {
  const choices = action.choices;

  if (!choices.targetSystemPosition) {
    return { valid: false, error: 'Must choose a target system' };
  }

  const tile = findTileAtPosition(state.map, choices.targetSystemPosition);
  if (!tile) {
    return { valid: false, error: 'Target system not found' };
  }

  // Cannot be Mecatol Rex
  if (tile.systemId === 18) {
    return { valid: false, error: 'Cannot choose Mecatol Rex' };
  }

  // Must control a planet in the system
  const controlsPlanet = tile.planets.some(p => p.controlledBy === player.id);
  if (!controlsPlanet) {
    return { valid: false, error: 'Must control a planet in the chosen system' };
  }

  // Validate planets to ready (max 2)
  if (choices.planetsToReady && choices.planetsToReady.length > 2) {
    return { valid: false, error: 'Can only ready up to 2 planets' };
  }

  return { valid: true };
}

function validatePoliticsPrimary(
  state: GameState,
  _player: { id: string },
  action: StrategicPrimaryAction
): ValidationResult {
  const choices = action.choices;

  if (!choices.newSpeakerId) {
    return { valid: false, error: 'Must choose a new speaker' };
  }

  if (choices.newSpeakerId === state.speakerId) {
    return { valid: false, error: 'Must choose a different player as speaker' };
  }

  const newSpeaker = state.players.find(p => p.id === choices.newSpeakerId);
  if (!newSpeaker) {
    return { valid: false, error: 'New speaker not found' };
  }

  return { valid: true };
}

function validateConstructionPrimary(
  state: GameState,
  player: { id: string },
  action: StrategicPrimaryAction
): ValidationResult {
  const choices = action.choices;

  // First structure can be PDS or Space Dock
  if (choices.firstStructure) {
    const result = validateStructurePlacement(
      state,
      player.id,
      choices.firstStructure.type,
      choices.firstStructure.planetId
    );
    if (!result.valid) return result;
  }

  // Second structure must be PDS
  if (choices.secondStructure) {
    if (choices.secondStructure.type !== 'pds') {
      return { valid: false, error: 'Second structure must be a PDS' };
    }
    const result = validateStructurePlacement(
      state,
      player.id,
      'pds',
      choices.secondStructure.planetId
    );
    if (!result.valid) return result;
  }

  return { valid: true };
}

function validateTradePrimary(
  state: GameState,
  player: { id: string },
  action: StrategicPrimaryAction
): ValidationResult {
  const choices = action.choices;

  // Validate free secondary players are valid
  if (choices.freeSecondaryPlayers) {
    for (const pid of choices.freeSecondaryPlayers) {
      if (pid === player.id) {
        return { valid: false, error: 'Cannot grant free secondary to yourself' };
      }
      const p = state.players.find(pl => pl.id === pid);
      if (!p) {
        return { valid: false, error: 'Invalid player for free secondary' };
      }
    }
  }

  return { valid: true };
}

function validateWarfarePrimary(
  state: GameState,
  player: { id: string; commandTokens: { tactics: number; fleet: number; strategy: number } },
  action: StrategicPrimaryAction
): ValidationResult {
  const choices = action.choices;

  // Validate token removal system
  if (choices.removedTokenSystem) {
    const tile = findTileAtPosition(state.map, choices.removedTokenSystem);
    if (!tile) {
      return { valid: false, error: 'System not found' };
    }
    if (!tile.commandTokens.includes(player.id)) {
      return { valid: false, error: 'No command token in that system' };
    }
  }

  // Validate token distribution
  const currentTotal = player.commandTokens.tactics + player.commandTokens.fleet + player.commandTokens.strategy;
  const newTotal = currentTotal + 1; // Gain 1 token

  if (choices.newTokenDistribution) {
    const { tactics, fleet, strategy } = choices.newTokenDistribution;
    if (tactics < 0 || fleet < 0 || strategy < 0) {
      return { valid: false, error: 'Token distribution cannot be negative' };
    }
    if (tactics + fleet + strategy !== newTotal) {
      return { valid: false, error: `Must distribute exactly ${newTotal} tokens` };
    }
  }

  return { valid: true };
}

function validateTechnologyPrimary(
  state: GameState,
  player: { id: string; technologies: string[]; faction: string },
  action: StrategicPrimaryAction
): ValidationResult {
  const choices = action.choices;

  // Validate first tech (free)
  if (choices.firstTechId) {
    const result = validateTechResearch(state, player, choices.firstTechId);
    if (!result.valid) return result;
  }

  // Validate second tech (requires 6 resources)
  if (choices.secondTechId) {
    // Can't research same tech twice
    if (choices.secondTechId === choices.firstTechId) {
      return { valid: false, error: 'Cannot research the same technology twice' };
    }

    const result = validateTechResearch(state, player, choices.secondTechId);
    if (!result.valid) return result;

    // Validate has 6 resources
    const availableResources = calculateAvailableResources(state, player.id);
    if (availableResources < 6) {
      return { valid: false, error: 'Not enough resources for second technology (need 6)' };
    }
  }

  return { valid: true };
}

function validateImperialPrimary(
  state: GameState,
  player: { id: string; scoredObjectives: string[]; secretObjectives: string[] },
  action: StrategicPrimaryAction
): ValidationResult {
  const choices = action.choices;

  // Validate objective scoring
  if (choices.scoredObjectiveId) {
    const objective = findPublicObjective(state, choices.scoredObjectiveId);
    if (!objective) {
      return { valid: false, error: 'Objective not found or not revealed' };
    }
    if (objective.scoredBy.includes(player.id)) {
      return { valid: false, error: 'Already scored this objective' };
    }
  }

  return { valid: true };
}

// ============================================
// Secondary Validators
// ============================================

function validateLeadershipSecondary(
  state: GameState,
  player: { id: string },
  action: StrategicSecondaryAction
): ValidationResult {
  const choices = action.choices || {};

  if (choices.influenceSpent && choices.influenceSpent > 0) {
    const availableInfluence = calculateAvailableInfluence(state, player.id);
    if (choices.influenceSpent > availableInfluence) {
      return { valid: false, error: 'Not enough influence available' };
    }

    const tokensGained = Math.floor(choices.influenceSpent / 3);
    if (choices.commandTokenDistribution) {
      const { tactics, fleet, strategy } = choices.commandTokenDistribution;
      if (tactics + fleet + strategy !== tokensGained) {
        return { valid: false, error: `Must distribute exactly ${tokensGained} tokens` };
      }
    }
  }

  return { valid: true };
}

function validateDiplomacySecondary(
  state: GameState,
  player: { id: string },
  action: StrategicSecondaryAction
): ValidationResult {
  const choices = action.choices || {};

  // Validate planets to ready (max 2, must be owned and exhausted)
  if (choices.readiedPlanets) {
    if (choices.readiedPlanets.length > 2) {
      return { valid: false, error: 'Can only ready up to 2 planets' };
    }

    for (const planetId of choices.readiedPlanets) {
      const planet = findPlayerPlanet(state, player.id, planetId);
      if (!planet) {
        return { valid: false, error: `Planet ${planetId} not controlled by you` };
      }
      if (!planet.exhausted) {
        return { valid: false, error: `Planet ${planetId} is not exhausted` };
      }
    }
  }

  return { valid: true };
}

function validateConstructionSecondary(
  state: GameState,
  player: { id: string },
  action: StrategicSecondaryAction
): ValidationResult {
  const choices = action.choices || {};

  if (choices.structureBuilt) {
    // Must have specified a system
    if (!choices.systemPosition) {
      return { valid: false, error: 'Must specify a system for structure placement' };
    }

    const tile = findTileAtPosition(state.map, choices.systemPosition);
    if (!tile) {
      return { valid: false, error: 'System not found' };
    }

    return validateStructurePlacement(
      state,
      player.id,
      choices.structureBuilt.type,
      choices.structureBuilt.planetId
    );
  }

  return { valid: true };
}

function validateWarfareSecondary(
  state: GameState,
  player: { id: string; faction: string; tradeGoods: number },
  action: StrategicSecondaryAction
): ValidationResult {
  const choices = action.choices || {};

  // Find home system
  const homeSystem = findPlayerHomeSystem(state, player.id, player.faction);
  if (!homeSystem) {
    return { valid: false, error: 'Home system not found' };
  }

  // Must have space dock
  const hasSpaceDock = homeSystem.planets.some(p =>
    p.units.some(u => u.type === 'space_dock' && u.ownerId === player.id)
  );
  if (!hasSpaceDock) {
    return { valid: false, error: 'No space dock in home system' };
  }

  // Validate production if units specified
  if (choices.unitsProduced && choices.unitsProduced.length > 0) {
    // Calculate available resources
    let resources = player.tradeGoods;
    if (choices.exhaustedPlanets) {
      for (const planetId of choices.exhaustedPlanets) {
        resources += getPlanetResources(planetId);
      }
    }

    // Calculate cost
    let cost = 0;
    for (const unit of choices.unitsProduced) {
      cost += getUnitCost(unit.type) * unit.count;
    }

    if (cost > resources) {
      return { valid: false, error: 'Not enough resources for production' };
    }
  }

  return { valid: true };
}

function validateTechnologySecondary(
  state: GameState,
  player: { id: string; technologies: string[]; faction: string; tradeGoods: number },
  action: StrategicSecondaryAction
): ValidationResult {
  const choices = action.choices || {};

  if (!choices.techId) {
    return { valid: false, error: 'Must choose a technology to research' };
  }

  // Validate tech research
  const result = validateTechResearch(state, player, choices.techId);
  if (!result.valid) return result;

  // Validate 4 resources available
  let resources = player.tradeGoods;
  if (choices.exhaustedPlanets) {
    for (const planetId of choices.exhaustedPlanets) {
      resources += getPlanetResources(planetId);
    }
  }

  if (resources < 4) {
    return { valid: false, error: 'Not enough resources (need 4)' };
  }

  return { valid: true };
}

function validateImperialSecondary(
  state: GameState,
  player: { id: string; secretObjectives: string[] },
  _action: StrategicSecondaryAction
): ValidationResult {
  // Check secret objective limit
  if (player.secretObjectives.length >= 3) {
    return { valid: false, error: 'Already at maximum secret objectives (3)' };
  }

  // Check deck has cards
  if (state.objectives.secretDeck.length === 0) {
    return { valid: false, error: 'No secret objectives remaining in deck' };
  }

  return { valid: true };
}

// ============================================
// Helper Functions
// ============================================

function calculateAvailableInfluence(state: GameState, playerId: string): number {
  let influence = 0;

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.controlledBy === playerId && !planet.exhausted) {
        influence += getPlanetInfluence(planet.planetId);
      }
    }
  }

  return influence;
}

function calculateAvailableResources(state: GameState, playerId: string): number {
  let resources = 0;
  const player = state.players.find(p => p.id === playerId);
  if (player) {
    resources += player.tradeGoods;
  }

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.controlledBy === playerId && !planet.exhausted) {
        resources += getPlanetResources(planet.planetId);
      }
    }
  }

  return resources;
}

function getPlanetInfluence(planetId: string): number {
  for (const system of Object.values(systems)) {
    for (const planet of system.planets) {
      if (planet.id === planetId) {
        return planet.influence;
      }
    }
  }
  return 0;
}

function getPlanetResources(planetId: string): number {
  for (const system of Object.values(systems)) {
    for (const planet of system.planets) {
      if (planet.id === planetId) {
        return planet.resources;
      }
    }
  }
  return 0;
}

function validateStructurePlacement(
  state: GameState,
  playerId: string,
  structureType: 'pds' | 'space_dock',
  planetId: string
): ValidationResult {
  // Find planet
  let planet = null;
  for (const tile of state.map.tiles) {
    for (const p of tile.planets) {
      if (p.planetId === planetId) {
        planet = p;
        break;
      }
    }
    if (planet) break;
  }

  if (!planet) {
    return { valid: false, error: 'Planet not found' };
  }

  if (planet.controlledBy !== playerId) {
    return { valid: false, error: 'You do not control this planet' };
  }

  // Check structure limits
  const structures = countPlayerStructures(state, playerId);

  if (structureType === 'pds' && structures.pds >= 6) {
    return { valid: false, error: 'Maximum PDS limit reached (6)' };
  }

  if (structureType === 'space_dock') {
    if (structures.spaceDock >= 3) {
      return { valid: false, error: 'Maximum Space Dock limit reached (3)' };
    }
    const hasSpaceDock = planet.units.some(u => u.type === 'space_dock');
    if (hasSpaceDock) {
      return { valid: false, error: 'Planet already has a Space Dock' };
    }
  }

  return { valid: true };
}

function countPlayerStructures(state: GameState, playerId: string): { pds: number; spaceDock: number } {
  let pds = 0;
  let spaceDock = 0;

  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      for (const unit of planet.units) {
        if (unit.ownerId === playerId) {
          if (unit.type === 'pds') pds++;
          if (unit.type === 'space_dock') spaceDock++;
        }
      }
    }
  }

  return { pds, spaceDock };
}

function validateTechResearch(
  state: GameState,
  player: { id: string; technologies: string[]; faction: string },
  techId: string
): ValidationResult {
  const tech = technologies[techId];
  if (!tech) {
    return { valid: false, error: 'Unknown technology' };
  }

  if (player.technologies.includes(techId)) {
    return { valid: false, error: 'Already have this technology' };
  }

  if (tech.factionId && tech.factionId !== player.faction) {
    return { valid: false, error: 'Cannot research another faction\'s technology' };
  }

  // Check prerequisites
  if (!meetsPrerequisites(player.technologies, techId, 0)) {
    return { valid: false, error: 'Prerequisites not met' };
  }

  return { valid: true };
}

function findPlayerPlanet(
  state: GameState,
  playerId: string,
  planetId: string
): { exhausted: boolean } | null {
  for (const tile of state.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.planetId === planetId && planet.controlledBy === playerId) {
        return planet;
      }
    }
  }
  return null;
}

function findPublicObjective(state: GameState, objectiveId: string) {
  for (const obj of state.objectives.publicStageI) {
    if (obj.id === objectiveId && obj.revealed) return obj;
  }
  for (const obj of state.objectives.publicStageII) {
    if (obj.id === objectiveId && obj.revealed) return obj;
  }
  return null;
}

function findPlayerHomeSystem(state: GameState, playerId: string, faction: string) {
  const { factions } = require('@ti4/game-data');
  const factionData = factions[faction];
  if (!factionData) return null;

  const homeSystemId = factionData.homeSystem;
  return state.map.tiles.find(t => t.systemId === homeSystemId);
}

function getUnitCost(unitType: string): number {
  const { units } = require('@ti4/game-data');
  const unit = units[unitType];
  return unit?.cost || 0;
}
