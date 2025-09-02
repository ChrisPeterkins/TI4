#!/usr/bin/env node

/**
 * Extract technology data from TwilightImperiumUltimate
 * Includes: Basic techs, Unit upgrades, Faction techs, and Starting techs
 */

const fs = require('fs').promises;
const path = require('path');

const sourcePath = path.join(__dirname, '../../sources/TwilightImperiumUltimate');
const outputPath = path.join(__dirname, '../../server/src/data/technologies');

async function extractTechnologies() {
  try {
    console.log('Extracting technology data from TwilightImperiumUltimate...');
    
    // Extract technologies
    const allTechnologies = await extractAllTechnologies();
    const startingTechs = await extractStartingTechnologies();
    
    // Organize technologies by type
    const basicTechs = allTechnologies.filter(t => !t.isFactionTechnology && t.type !== 'UnitUpgrade');
    const unitUpgrades = allTechnologies.filter(t => t.type === 'UnitUpgrade' && !t.isFactionTechnology);
    const factionTechs = allTechnologies.filter(t => t.isFactionTechnology && t.type !== 'UnitUpgrade');
    const factionUnitUpgrades = allTechnologies.filter(t => t.isFactionTechnology && t.type === 'UnitUpgrade');
    
    // Further organize basic techs by color
    const bioticTechs = basicTechs.filter(t => t.type === 'Biotic');
    const propulsionTechs = basicTechs.filter(t => t.type === 'Propulsion');
    const cyberneticTechs = basicTechs.filter(t => t.type === 'Cybernetic');
    const warfareTechs = basicTechs.filter(t => t.type === 'Warfare');
    
    // Create output directory structure
    await fs.mkdir(outputPath, { recursive: true });
    await fs.mkdir(path.join(outputPath, 'basic'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'unit-upgrades'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'faction'), { recursive: true });
    
    // Write files
    await writeBasicTechnologies(bioticTechs, propulsionTechs, cyberneticTechs, warfareTechs);
    await writeUnitUpgrades(unitUpgrades, factionUnitUpgrades);
    await writeFactionTechnologies(factionTechs);
    await writeStartingTechnologies(startingTechs);
    await writeMasterIndex(allTechnologies);
    
    console.log('✅ Technology extraction complete!');
    console.log(`  - ${bioticTechs.length} biotic technologies`);
    console.log(`  - ${propulsionTechs.length} propulsion technologies`);
    console.log(`  - ${cyberneticTechs.length} cybernetic technologies`);
    console.log(`  - ${warfareTechs.length} warfare technologies`);
    console.log(`  - ${unitUpgrades.length} unit upgrades`);
    console.log(`  - ${factionTechs.length} faction technologies`);
    console.log(`  - ${factionUnitUpgrades.length} faction unit upgrades`);
    console.log(`  - ${Object.keys(startingTechs).length} factions with starting techs`);
    
  } catch (error) {
    console.error('❌ Failed to extract technologies:', error);
    throw error;
  }
}

async function extractAllTechnologies() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/TechnologiesData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const technologies = [];
  const regex = /new\(\)\s*\{\s*Id\s*=\s*(\d+),\s*TechnologyName\s*=\s*TechnologyName\.(\w+),\s*Type\s*=\s*TechnologyType\.(\w+),\s*Level\s*=\s*TechnologyLevel\.(\w+),\s*IsFactionTechnology\s*=\s*(\w+),\s*FactionName\s*=\s*FactionName\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tech = {
      id: parseInt(match[1]),
      name: formatTechName(match[2]),
      techId: convertToId(match[2]),
      type: match[3],
      level: parseInt(match[4].replace(/\D/g, '')),
      isFactionTechnology: match[5] === 'true',
      faction: match[6] === 'None' ? null : formatFactionName(match[6]),
      expansion: mapGameVersion(match[7])
    };
    
    // Add prerequisites based on level
    if (tech.level > 0) {
      tech.prerequisites = getPrerequisites(tech);
    }
    
    technologies.push(tech);
  }
  
  return technologies;
}

async function extractStartingTechnologies() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/FactionTechnologiesData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const startingTechs = {};
  const regex = /new\(\)\s*\{\s*FactionName\s*=\s*FactionName\.(\w+),\s*TechnologyName\s*=\s*TechnologyName\.(\w+),\s*StartingTechnology\s*=\s*true/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const factionName = formatFactionName(match[1]);
    const techName = formatTechName(match[2]);
    
    if (!startingTechs[factionName]) {
      startingTechs[factionName] = [];
    }
    startingTechs[factionName].push(techName);
  }
  
  return startingTechs;
}

function getPrerequisites(tech) {
  // Determine prerequisites based on tech level and type
  const prereqs = {
    count: tech.level,
    type: tech.type === 'UnitUpgrade' ? getUpgradePrereqs(tech) : tech.type
  };
  
  return prereqs;
}

function getUpgradePrereqs(tech) {
  // Unit upgrades have specific color requirements
  const upgradePrereqs = {
    'Infantry Two': { red: 2 },
    'Fighter Two': { blue: 2 },
    'Destroyer Two': { red: 2 },
    'Carrier Two': { blue: 2 },
    'Cruiser Two': { green: 1, yellow: 1, red: 1 },
    'Dreadnought Two': { blue: 2, yellow: 1 },
    'War Sun': { red: 1, yellow: 3 },
    'Space Dock Two': { yellow: 2 },
    'Pds Two': { red: 1, yellow: 1 }
  };
  
  return upgradePrereqs[tech.name] || { any: tech.level };
}

// Write functions for each technology category
async function writeBasicTechnologies(biotic, propulsion, cybernetic, warfare) {
  // Clean up the objects to remove unnecessary fields
  const cleanTech = (techs) => techs.map(t => ({
    id: t.id,
    name: t.name,
    techId: t.techId,
    type: t.type,
    level: t.level,
    expansion: t.expansion,
    ...(t.prerequisites && { prerequisites: t.prerequisites })
  }));
  
  const content = `// Basic Technologies - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface Technology {
  id: number;
  name: string;
  techId: string;
  type: 'Biotic' | 'Propulsion' | 'Cybernetic' | 'Warfare';
  level: number;
  expansion: string;
  prerequisites?: {
    count: number;
    type: string;
  };
}

// Green Technologies
export const bioticTechnologies: Technology[] = ${JSON.stringify(cleanTech(biotic), null, 2)};

// Blue Technologies  
export const propulsionTechnologies: Technology[] = ${JSON.stringify(cleanTech(propulsion), null, 2)};

// Yellow Technologies
export const cyberneticTechnologies: Technology[] = ${JSON.stringify(cleanTech(cybernetic), null, 2)};

// Red Technologies
export const warfareTechnologies: Technology[] = ${JSON.stringify(cleanTech(warfare), null, 2)};

export const allBasicTechnologies = [
  ...bioticTechnologies,
  ...propulsionTechnologies,
  ...cyberneticTechnologies,
  ...warfareTechnologies
];
`;
  
  await fs.writeFile(path.join(outputPath, 'basic', 'index.ts'), content);
}

async function writeUnitUpgrades(standard, faction) {
  // Clean up the objects
  const cleanUpgrade = (upgrades) => upgrades.map(u => ({
    id: u.id,
    name: u.name,
    techId: u.techId,
    type: u.type,
    level: u.level,
    ...(u.faction && { faction: u.faction }),
    expansion: u.expansion,
    ...(u.prerequisites && { prerequisites: u.prerequisites })
  }));
  
  const content = `// Unit Upgrade Technologies - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface UnitUpgrade {
  id: number;
  name: string;
  techId: string;
  type: 'UnitUpgrade';
  level: number;
  faction?: string;
  expansion: string;
  prerequisites?: any;
}

export const standardUnitUpgrades: UnitUpgrade[] = ${JSON.stringify(cleanUpgrade(standard), null, 2)};

export const factionUnitUpgrades: UnitUpgrade[] = ${JSON.stringify(cleanUpgrade(faction), null, 2)};

export const allUnitUpgrades = [...standardUnitUpgrades, ...factionUnitUpgrades];
`;
  
  await fs.writeFile(path.join(outputPath, 'unit-upgrades', 'index.ts'), content);
}

async function writeFactionTechnologies(factionTechs) {
  // Clean up and group by faction
  const cleanTech = (tech) => ({
    id: tech.id,
    name: tech.name,
    techId: tech.techId,
    type: tech.type,
    level: tech.level,
    faction: tech.faction,
    expansion: tech.expansion,
    ...(tech.prerequisites && { prerequisites: tech.prerequisites })
  });
  
  const cleanedTechs = factionTechs.map(cleanTech);
  const byFaction = {};
  cleanedTechs.forEach(tech => {
    if (!byFaction[tech.faction]) {
      byFaction[tech.faction] = [];
    }
    byFaction[tech.faction].push(tech);
  });
  
  const content = `// Faction Technologies - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface FactionTechnology {
  id: number;
  name: string;
  techId: string;
  type: string;
  level: number;
  faction: string;
  expansion: string;
  prerequisites?: any;
}

export const factionTechnologies: { [faction: string]: FactionTechnology[] } = ${JSON.stringify(byFaction, null, 2)};

export const allFactionTechnologies: FactionTechnology[] = ${JSON.stringify(cleanedTechs, null, 2)};
`;
  
  await fs.writeFile(path.join(outputPath, 'faction', 'index.ts'), content);
}

async function writeStartingTechnologies(startingTechs) {
  const content = `// Starting Technologies by Faction - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export const startingTechnologies: { [faction: string]: string[] } = ${JSON.stringify(startingTechs, null, 2)};
`;
  
  await fs.writeFile(path.join(outputPath, 'starting.ts'), content);
}

async function writeMasterIndex(allTechnologies) {
  const content = `// Master Technology Index - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export * from './basic';
export * from './unit-upgrades';
export * from './faction';
export * from './starting';

// Technology type colors for UI
export const techColors = {
  Biotic: 'green',
  Propulsion: 'blue',
  Cybernetic: 'yellow',
  Warfare: 'red',
  UnitUpgrade: 'gray',
  Faction: 'purple'
};

// Tech count by type
export const techStats = {
  total: ${allTechnologies.length},
  basic: ${allTechnologies.filter(t => !t.isFactionTechnology && t.type !== 'UnitUpgrade').length},
  unitUpgrades: ${allTechnologies.filter(t => t.type === 'UnitUpgrade').length},
  faction: ${allTechnologies.filter(t => t.isFactionTechnology).length}
};
`;
  
  await fs.writeFile(path.join(outputPath, 'index.ts'), content);
}

// Helper functions
function formatTechName(enumName) {
  // Handle special cases
  const specialCases = {
    'X89BacterialWeapon': 'X-89 Bacterial Weapon',
    'X89BacterialWeaponOmega': 'X-89 Bacterial Weapon Ω',
    'MagenDefenseGrid': 'Magen Defense Grid',
    'MagenDefenseGridOmega': 'Magen Defense Grid Ω',
    'YinSpinner': 'Yin Spinner',
    'YinSpinnerOmega': 'Yin Spinner Ω',
    'WormholeGenerator': 'Wormhole Generator',
    'WormholeGeneratorOmega': 'Wormhole Generator Ω',
    'MagmusReactor': 'Magmus Reactor',
    'MagmusReactorOmega': 'Magmus Reactor Ω',
    'AIDevelopmentAlgorithm': 'AI Development Algorithm',
    'L4Disruptors': 'L4 Disruptors',
    'IihqModernization': 'I.I.H.Q. Modernization',
    'EResSiphons': 'E-Res Siphons',
    'InfantryTwo': 'Infantry II',
    'FighterTwo': 'Fighter II',
    'DestroyerTwo': 'Destroyer II',
    'CarrierTwo': 'Carrier II',
    'CruiserTwo': 'Cruiser II',
    'DreadnoughtTwo': 'Dreadnought II',
    'SpaceDockTwo': 'Space Dock II',
    'PdsTwo': 'PDS II',
    'ValefarAssimilatorX': 'Valefar Assimilator X',
    'ValefarAssimilatorY': 'Valefar Assimilator Y'
  };
  
  if (specialCases[enumName]) {
    return specialCases[enumName];
  }
  
  // Add spaces before capital letters
  return enumName
    .replace(/([A-Z])/g, ' $1')
    .trim();
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
    'TheYssarilTribes': 'The Yssaril Tribes',
    'TheArgentFlight': 'The Argent Flight',
    'TheEmpyrean': 'The Empyrean',
    'TheMahactGeneSorcerers': 'The Mahact Gene-Sorcerers',
    'TheNaazRokhaAlliance': 'The Naaz-Rokha Alliance',
    'TheNomad': 'The Nomad',
    'TheTitansOfUl': 'The Titans of Ul',
    'TheVuilRaithCabal': "The Vuil'Raith Cabal",
    'TheCouncilKeleres': 'The Council Keleres'
  };
  
  return specialCases[enumName] || enumName;
}

function convertToId(techName) {
  // Convert to lowercase kebab-case id
  return techName
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/--/g, '-');
}

function mapGameVersion(version) {
  const versionMap = {
    'BaseGame': 'base',
    'ProphecyOfKings': 'pok',
    'CodexOrdinian': 'codex',
    'CodexVigil': 'codex',
    'CodexAffinity': 'codex',
    'DiscordantStars': 'discordant',
    'UnchartedSpace': 'uncharted',
    'Deprecated': 'deprecated'
  };
  
  return versionMap[version] || version.toLowerCase();
}

// Run if called directly
if (require.main === module) {
  extractTechnologies().catch(console.error);
}

module.exports = extractTechnologies;