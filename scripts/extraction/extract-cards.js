#!/usr/bin/env node

/**
 * Extract all card data from TwilightImperiumUltimate
 * Includes: Action, Agenda, Objective, Exploration, Relic, Promissory, Strategy, Frontier cards
 */

const fs = require('fs').promises;
const path = require('path');

const sourcePath = path.join(__dirname, '../../sources/TwilightImperiumUltimate');
const outputPath = path.join(__dirname, '../../server/src/data/cards');

async function extractCards() {
  try {
    console.log('Extracting card data from TwilightImperiumUltimate...');
    
    // Extract each card type
    const actionCards = await extractActionCards();
    const agendaCards = await extractAgendaCards();
    const objectiveCards = await extractObjectiveCards();
    const explorationCards = await extractExplorationCards();
    const relicCards = await extractRelicCards();
    const strategyCards = await extractStrategyCards();
    const promissoryCards = await extractPromissoryCards();
    const frontierCards = await extractFrontierCards();
    
    // Create output directories
    await fs.mkdir(outputPath, { recursive: true });
    await fs.mkdir(path.join(outputPath, 'action'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'agenda'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'objective'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'exploration'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'relic'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'strategy'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'promissory'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'frontier'), { recursive: true });
    
    // Write TypeScript files
    await writeActionCards(actionCards);
    await writeAgendaCards(agendaCards);
    await writeObjectiveCards(objectiveCards);
    await writeExplorationCards(explorationCards);
    await writeRelicCards(relicCards);
    await writeStrategyCards(strategyCards);
    await writePromissoryCards(promissoryCards);
    await writeFrontierCards(frontierCards);
    
    console.log('✅ Card extraction complete!');
    console.log(`  - ${actionCards.length} action cards`);
    console.log(`  - ${agendaCards.length} agenda cards`);
    console.log(`  - ${objectiveCards.length} objective cards`);
    console.log(`  - ${explorationCards.length} exploration cards`);
    console.log(`  - ${relicCards.length} relic cards`);
    console.log(`  - ${strategyCards.length} strategy cards`);
    console.log(`  - ${promissoryCards.length} promissory cards`);
    console.log(`  - ${frontierCards.length} frontier cards`);
    
  } catch (error) {
    console.error('❌ Failed to extract cards:', error);
    throw error;
  }
}

async function extractActionCards() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/ActionCardsData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const cards = [];
  const regex = /new\(\)\s*\{\s*Id\s*=\s*(\d+),\s*EnumName\s*=\s*ActionCardName\.(\w+),\s*TimingWindow\s*=\s*TimingWindow\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    cards.push({
      id: parseInt(match[1]),
      name: formatCardName(match[2]),
      timingWindow: match[3],
      expansion: mapGameVersion(match[4])
    });
  }
  
  return cards;
}

async function extractAgendaCards() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/AgendaCardsData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const cards = [];
  const regex = /new\(\)\s*\{\s*Id\s*=\s*(\d+),\s*EnumName\s*=\s*AgendaCardName\.(\w+),\s*AgendaCardType\s*=\s*AgendaCardType\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    cards.push({
      id: parseInt(match[1]),
      name: formatCardName(match[2]),
      type: match[3], // Law or Directive
      expansion: mapGameVersion(match[4])
    });
  }
  
  return cards;
}

async function extractObjectiveCards() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/ObjectiveCardsData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const cards = [];
  const regex = /new\(\)\s*\{\s*Id\s*=\s*(\d+),\s*EnumName\s*=\s*ObjectiveCardName\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+),\s*ObjectiveCardType\s*=\s*ObjectiveCardType\.(\w+)[^}]*TimingWindow\s*=\s*TimingWindow\.(\w+)/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    cards.push({
      id: parseInt(match[1]),
      name: formatCardName(match[2]),
      expansion: mapGameVersion(match[3]),
      type: match[4], // StageOne, StageTwo, Secret
      timingWindow: match[5],
      points: match[4] === 'Secret' ? 1 : match[4] === 'StageOne' ? 1 : 2
    });
  }
  
  return cards;
}

async function extractExplorationCards() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/ExplorationCardsData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const cards = [];
  const regex = /new\(\)\s*\{\s*Id\s*=\s*(\d+),\s*EnumName\s*=\s*ExplorationCardName\.(\w+),\s*ExplorationPlanetTrait\s*=\s*PlanetTrait\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    cards.push({
      id: parseInt(match[1]),
      name: formatCardName(match[2]),
      planetTrait: match[3], // Cultural, Hazardous, Industrial
      expansion: mapGameVersion(match[4])
    });
  }
  
  return cards;
}

async function extractRelicCards() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/RelicCardsData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const cards = [];
  const regex = /new\(\)\s*\{\s*Id\s*=\s*(\d+),\s*EnumName\s*=\s*RelicCardName\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    cards.push({
      id: parseInt(match[1]),
      name: formatCardName(match[2]),
      expansion: mapGameVersion(match[3])
    });
  }
  
  return cards;
}

async function extractStrategyCards() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/StrategyCardsData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const cards = [];
  const regex = /new\(\)\s*\{\s*Id\s*=\s*(\d+),\s*EnumName\s*=\s*StrategyCardName\.(\w+),\s*InitiativeOrder\s*=\s*InitiativeOrder\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)/g;
  
  // Map initiative order words to numbers
  const initiativeMap = {
    'First': 1,
    'Second': 2,
    'Third': 3,
    'Fourth': 4,
    'Fifth': 5,
    'Sixth': 6,
    'Seventh': 7,
    'Eighth': 8
  };
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    cards.push({
      id: parseInt(match[1]),
      name: formatCardName(match[2]),
      initiative: initiativeMap[match[3]] || 0,
      expansion: mapGameVersion(match[4])
    });
  }
  
  return cards;
}

async function extractPromissoryCards() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/PromissaryNoteCardsData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const cards = [];
  const regex = /new\(\)\s*\{\s*Id\s*=\s*(\d+),\s*EnumName\s*=\s*PromissoryNoteCardName\.(\w+),\s*Faction\s*=\s*FactionName\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    cards.push({
      id: parseInt(match[1]),
      name: formatCardName(match[2]),
      faction: formatFactionName(match[3]),
      expansion: mapGameVersion(match[4])
    });
  }
  
  return cards;
}

async function extractFrontierCards() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/FrontierCardsData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const cards = [];
  const regex = /new\(\)\s*\{\s*Id\s*=\s*(\d+),\s*EnumName\s*=\s*FrontierCardName\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    cards.push({
      id: parseInt(match[1]),
      name: formatCardName(match[2]),
      expansion: mapGameVersion(match[3])
    });
  }
  
  return cards;
}

// Write functions for each card type
async function writeActionCards(cards) {
  const baseCards = cards.filter(c => c.expansion === 'base');
  const pokCards = cards.filter(c => c.expansion === 'pok');
  const codexCards = cards.filter(c => c.expansion === 'codex');
  
  const content = `// Action Cards - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface ActionCard {
  id: number;
  name: string;
  timingWindow: string;
  expansion: 'base' | 'pok' | 'codex';
}

export const baseActionCards: ActionCard[] = ${JSON.stringify(baseCards, null, 2)};

export const pokActionCards: ActionCard[] = ${JSON.stringify(pokCards, null, 2)};

export const codexActionCards: ActionCard[] = ${JSON.stringify(codexCards, null, 2)};

export const allActionCards = [...baseActionCards, ...pokActionCards, ...codexActionCards];
`;
  
  await fs.writeFile(path.join(outputPath, 'action', 'index.ts'), content);
}

async function writeAgendaCards(cards) {
  const laws = cards.filter(c => c.type === 'Law');
  const directives = cards.filter(c => c.type === 'Directive');
  
  const content = `// Agenda Cards - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface AgendaCard {
  id: number;
  name: string;
  type: 'Law' | 'Directive';
  expansion: string;
}

export const lawCards: AgendaCard[] = ${JSON.stringify(laws, null, 2)};

export const directiveCards: AgendaCard[] = ${JSON.stringify(directives, null, 2)};

export const allAgendaCards = [...lawCards, ...directiveCards];
`;
  
  await fs.writeFile(path.join(outputPath, 'agenda', 'index.ts'), content);
}

async function writeObjectiveCards(cards) {
  const stageOne = cards.filter(c => c.type === 'StageOne');
  const stageTwo = cards.filter(c => c.type === 'StageTwo');
  const secret = cards.filter(c => c.type === 'Secret');
  
  const content = `// Objective Cards - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface ObjectiveCard {
  id: number;
  name: string;
  type: 'StageOne' | 'StageTwo' | 'Secret';
  points: number;
  timingWindow: string;
  expansion: string;
}

export const stageOneObjectives: ObjectiveCard[] = ${JSON.stringify(stageOne, null, 2)};

export const stageTwoObjectives: ObjectiveCard[] = ${JSON.stringify(stageTwo, null, 2)};

export const secretObjectives: ObjectiveCard[] = ${JSON.stringify(secret, null, 2)};

export const allObjectiveCards = [...stageOneObjectives, ...stageTwoObjectives, ...secretObjectives];
`;
  
  await fs.writeFile(path.join(outputPath, 'objective', 'index.ts'), content);
}

async function writeExplorationCards(cards) {
  const cultural = cards.filter(c => c.planetTrait === 'Cultural');
  const hazardous = cards.filter(c => c.planetTrait === 'Hazardous');
  const industrial = cards.filter(c => c.planetTrait === 'Industrial');
  
  const content = `// Exploration Cards - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface ExplorationCard {
  id: number;
  name: string;
  planetTrait: 'Cultural' | 'Hazardous' | 'Industrial';
  expansion: string;
}

export const culturalExploration: ExplorationCard[] = ${JSON.stringify(cultural, null, 2)};

export const hazardousExploration: ExplorationCard[] = ${JSON.stringify(hazardous, null, 2)};

export const industrialExploration: ExplorationCard[] = ${JSON.stringify(industrial, null, 2)};

export const allExplorationCards = [...culturalExploration, ...hazardousExploration, ...industrialExploration];
`;
  
  await fs.writeFile(path.join(outputPath, 'exploration', 'index.ts'), content);
}

async function writeRelicCards(cards) {
  const content = `// Relic Cards - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface RelicCard {
  id: number;
  name: string;
  expansion: string;
}

export const relicCards: RelicCard[] = ${JSON.stringify(cards, null, 2)};
`;
  
  await fs.writeFile(path.join(outputPath, 'relic', 'index.ts'), content);
}

async function writeStrategyCards(cards) {
  const content = `// Strategy Cards - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface StrategyCard {
  id: number;
  name: string;
  initiative: number;
  expansion: string;
}

export const strategyCards: StrategyCard[] = ${JSON.stringify(cards, null, 2)};
`;
  
  await fs.writeFile(path.join(outputPath, 'strategy', 'index.ts'), content);
}

async function writePromissoryCards(cards) {
  const content = `// Promissory Note Cards - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface PromissoryCard {
  id: number;
  name: string;
  faction: string;
  expansion: string;
}

export const promissoryCards: PromissoryCard[] = ${JSON.stringify(cards, null, 2)};
`;
  
  await fs.writeFile(path.join(outputPath, 'promissory', 'index.ts'), content);
}

async function writeFrontierCards(cards) {
  const content = `// Frontier Cards - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface FrontierCard {
  id: number;
  name: string;
  expansion: string;
}

export const frontierCards: FrontierCard[] = ${JSON.stringify(cards, null, 2)};
`;
  
  await fs.writeFile(path.join(outputPath, 'frontier', 'index.ts'), content);
}

// Helper functions
function formatCardName(enumName) {
  // Convert from PascalCase enum to readable name
  return enumName
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^./, str => str.toUpperCase());
}

function formatFactionName(enumName) {
  const specialCases = {
    'TheArborec': 'The Arborec',
    'TheBaronyOfLetnev': 'The Barony of Letnev',
    'TheClanOfSaar': 'The Clan of Saar',
    'TheEmbersOfMuaat': 'The Embers of Muaat',
    'TheEmiratesOfHacan': 'The Emirates of Hacan',
    'TheFederationOfSol': 'The Federation of Sol',
    'TheGhostsOfCreuss': 'The Ghosts of Creuss',
    'TheL1z1xMindnet': 'The L1Z1X Mindnet',
    'TheMentakCoalition': 'The Mentak Coalition',
    'TheNaaluCollective': 'The Naalu Collective',
    'TheNekroVirus': 'The Nekro Virus',
    'SardakkNorr': "The Sardakk N'orr",
    'TheUniversitiesOfJolNar': 'The Universities of Jol-Nar',
    'TheWinnu': 'The Winnu',
    'TheXxchaKingdom': 'The Xxcha Kingdom',
    'TheYinBrotherhood': 'The Yin Brotherhood',
    'TheYssarilTribes': 'The Yssaril Tribes'
  };
  
  return specialCases[enumName] || enumName;
}

function mapGameVersion(version) {
  const versionMap = {
    'BaseGame': 'base',
    'ProphecyOfKings': 'pok',
    'CodexOrdinian': 'codex',
    'CodexVigil': 'codex',
    'CodexAffinity': 'codex',
    'UnchartedSpace': 'uncharted',
    'Deprecated': 'deprecated'
  };
  
  return versionMap[version] || version.toLowerCase();
}

// Run if called directly
if (require.main === module) {
  extractCards().catch(console.error);
}

module.exports = extractCards;