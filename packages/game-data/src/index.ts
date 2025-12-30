// Re-export all game data
export { factions } from './data/factions.js';
export { systems } from './data/systems.js';
export {
  technologies,
  getGenericTechnologies,
  getFactionTechnologies,
  getTechnologiesByColor,
  getUnitUpgrades,
  meetsPrerequisites,
  createTechnologyDeck,
} from './data/technologies.js';
export { strategyCards } from './data/strategy-cards.js';
export { units, upgradedUnits } from './data/units.js';

// Re-export types
export type { TechnologyData } from '@ti4/shared';
