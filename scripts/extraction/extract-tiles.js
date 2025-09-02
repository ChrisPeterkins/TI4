#!/usr/bin/env node

/**
 * Extract tile and planet data from TwilightImperiumUltimate
 * Organizes into: systems, planets, anomalies, wormholes, hyperlanes
 */

const fs = require('fs').promises;
const path = require('path');

const sourcePath = path.join(__dirname, '../../sources/TwilightImperiumUltimate');
const outputPath = path.join(__dirname, '../../server/src/data/tiles');

async function extractTiles() {
  try {
    console.log('Extracting tile and planet data from TwilightImperiumUltimate...');
    
    // Extract system tiles and planets
    const systemTiles = await extractSystemTiles();
    const planets = await extractPlanets();
    
    // Associate planets with their systems
    const enrichedSystems = enrichSystemsWithPlanets(systemTiles, planets);
    
    // Categorize tiles
    const homeSystems = enrichedSystems.filter(t => t.isHomeSystem);
    const blueTiles = enrichedSystems.filter(t => t.tileCategory === 'Blue' && !t.isHomeSystem);
    const redTiles = enrichedSystems.filter(t => t.tileCategory === 'Red');
    const greenTiles = enrichedSystems.filter(t => t.tileCategory === 'Green' && !t.isHomeSystem);
    const mecatolRex = enrichedSystems.find(t => t.tileCode === '18');
    
    // Extract special features
    const anomalies = extractAnomalies(redTiles);
    const wormholeTiles = extractWormholes(enrichedSystems);
    const legendaryPlanets = planets.filter(p => p.isLegendary);
    
    // Write files to appropriate folders
    await writeSystemTiles(enrichedSystems, homeSystems, blueTiles, redTiles, greenTiles, mecatolRex);
    await writePlanets(planets, legendaryPlanets);
    await writeAnomalies(anomalies);
    await writeWormholes(wormholeTiles);
    await writeHyperlanes(); // Placeholder for hyperlane data
    
    console.log('✅ Tile extraction complete!');
    console.log(`  - ${systemTiles.length} system tiles`);
    console.log(`  - ${planets.length} planets`);
    console.log(`  - ${homeSystems.length} home systems`);
    console.log(`  - ${blueTiles.length} blue tiles`);
    console.log(`  - ${redTiles.length} red tiles (anomalies)`);
    console.log(`  - ${legendaryPlanets.length} legendary planets`);
    
  } catch (error) {
    console.error('❌ Failed to extract tiles:', error);
    throw error;
  }
}

async function extractSystemTiles() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/SystemTilesData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const tiles = [];
  const regex = /new\(\)\s*\{[^}]*?Id\s*=\s*(\d+),\s*SystemTileName\s*=\s*SystemTileName\.(\w+),\s*SystemTileCode\s*=\s*"([^"]*)",\s*FactionName\s*=\s*FactionName\.(\w+),\s*Anomaly\s*=\s*AnomalyName\.(\w+),\s*TileCategory\s*=\s*SystemTileCategory\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)[^}]*?\}/gs;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tile = {
      id: parseInt(match[1]),
      name: formatTileName(match[2]),
      tileCode: match[3],
      faction: match[4] === 'None' ? null : formatFactionName(match[4]),
      anomaly: match[5] === 'None' ? null : match[5],
      tileCategory: match[6],
      isHomeSystem: match[4] !== 'None',
      expansion: mapGameVersion(match[7]),
      planets: [] // Will be populated later
    };
    
    // Skip special/custom tiles
    if (tile.tileCode && !['T', ''].includes(tile.tileCode)) {
      tiles.push(tile);
    }
  }
  
  return tiles;
}

async function extractPlanets() {
  const filePath = path.join(sourcePath, 'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/PlanetsData.cs');
  const content = await fs.readFile(filePath, 'utf8');
  
  const planets = [];
  const regex = /new\s+Planet\(\)\s*\{[^}]*?Id\s*=\s*(\d+),\s*PlanetName\s*=\s*PlanetName\.(\w+),\s*PlanetTrait\s*=\s*PlanetTrait\.(\w+),\s*SystemTileName\s*=\s*SystemTileName\.(\w+),\s*Resources\s*=\s*(\d+),\s*Influence\s*=\s*(\d+),\s*IsLegendary\s*=\s*(\w+),\s*TechnologySkip\s*=\s*TechnologyType\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)[^}]*?\}/gs;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    const planet = {
      id: parseInt(match[1]),
      name: formatPlanetName(match[2]),
      planetId: convertToId(match[2]),
      trait: match[3] === 'None' ? null : match[3],
      systemTile: match[4],
      resources: parseInt(match[5]),
      influence: parseInt(match[6]),
      isLegendary: match[7] === 'true',
      techSkip: match[8] === 'None' ? null : match[8],
      expansion: mapGameVersion(match[9])
    };
    
    planets.push(planet);
  }
  
  return planets;
}

function enrichSystemsWithPlanets(systems, planets) {
  return systems.map(system => {
    const systemPlanets = planets.filter(p => p.systemTile === `Tile${system.tileCode.padStart(2, '0')}`);
    // Remove wormholes field from the system object
    const { wormholes, ...systemWithoutWormholes } = system;
    return {
      ...systemWithoutWormholes,
      planets: systemPlanets.map(p => ({
        name: p.name,
        resources: p.resources,
        influence: p.influence,
        trait: p.trait,
        techSkip: p.techSkip,
        isLegendary: p.isLegendary
      })),
      totalResources: systemPlanets.reduce((sum, p) => sum + p.resources, 0),
      totalInfluence: systemPlanets.reduce((sum, p) => sum + p.influence, 0)
    };
  });
}

function extractAnomalies(redTiles) {
  const anomalyTypes = {};
  
  redTiles.forEach(tile => {
    if (tile.anomaly) {
      if (!anomalyTypes[tile.anomaly]) {
        anomalyTypes[tile.anomaly] = [];
      }
      anomalyTypes[tile.anomaly].push({
        tileCode: tile.tileCode,
        name: tile.name
      });
    }
  });
  
  return anomalyTypes;
}

function extractWormholes(systems) {
  // In TI4, wormholes are on specific tiles
  const wormholeTiles = {
    'Alpha': ['26'], // Base game Alpha wormhole
    'Beta': ['25'],  // Base game Beta wormhole
    'Gamma': ['51', '52', '53', '54', '55', '56', '57', '58'], // Creuss home system has Gamma in base, PoK home systems may have others
    'Delta': ['17', '51']  // Creuss home (17) and Creuss Gate (51) for Delta
  };
  
  const wormholes = {};
  Object.entries(wormholeTiles).forEach(([type, tileCodes]) => {
    wormholes[type] = systems
      .filter(s => tileCodes.includes(s.tileCode))
      .map(s => ({
        tileCode: s.tileCode,
        name: s.name,
        faction: s.faction
      }));
  });
  
  return wormholes;
}

// Write functions
async function writeSystemTiles(allSystems, homeSystems, blueTiles, redTiles, greenTiles, mecatolRex) {
  const content = `// System Tiles - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface SystemTile {
  id: number;
  name: string;
  tileCode: string;
  tileCategory: 'Blue' | 'Red' | 'Green' | 'None' | 'MecatolRex' | 'Hyperlane' | 'ExternalMapTile';
  faction?: string | null;
  anomaly?: string | null;
  isHomeSystem: boolean;
  expansion: string;
  planets: Planet[];
  totalResources: number;
  totalInfluence: number;
}

export interface Planet {
  name: string;
  resources: number;
  influence: number;
  trait?: string | null;
  techSkip?: string | null;
  isLegendary: boolean;
}

// All system tiles
export const systemTiles: SystemTile[] = ${JSON.stringify(allSystems, null, 2)};

// Home systems (tiles 1-17, 51-58)
export const homeSystems: SystemTile[] = ${JSON.stringify(homeSystems, null, 2)};

// Blue tiles (planet systems)
export const blueTiles: SystemTile[] = ${JSON.stringify(blueTiles, null, 2)};

// Red tiles (anomalies)
export const redTiles: SystemTile[] = ${JSON.stringify(redTiles, null, 2)};

// Green tiles (special/starting)
export const greenTiles: SystemTile[] = ${JSON.stringify(greenTiles, null, 2)};

// Mecatol Rex
export const mecatolRex: SystemTile | undefined = ${JSON.stringify(mecatolRex, null, 2)};

export const getTileByCode = (code: string): SystemTile | undefined => {
  return systemTiles.find(t => t.tileCode === code);
};

export const getTilesByCategory = (category: 'Blue' | 'Red' | 'Green' | 'None' | 'MecatolRex' | 'Hyperlane' | 'ExternalMapTile'): SystemTile[] => {
  return systemTiles.filter(t => t.tileCategory === category);
};
`;
  
  await fs.writeFile(path.join(outputPath, 'systems', 'index.ts'), content);
}

async function writePlanets(allPlanets, legendaryPlanets) {
  const content = `// Planets - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface PlanetData {
  id: number;
  name: string;
  planetId: string;
  resources: number;
  influence: number;
  trait?: string | null;
  techSkip?: string | null;
  isLegendary: boolean;
  systemTile: string;
  expansion: string;
}

export const planets: PlanetData[] = ${JSON.stringify(allPlanets, null, 2)};

export const legendaryPlanets: PlanetData[] = ${JSON.stringify(legendaryPlanets, null, 2)};

// Trait categories
export const culturalPlanets = planets.filter(p => p.trait === 'Cultural');
export const hazardousPlanets = planets.filter(p => p.trait === 'Hazardous');
export const industrialPlanets = planets.filter(p => p.trait === 'Industrial');

export const getPlanetByName = (name: string): PlanetData | undefined => {
  return planets.find(p => p.name === name);
};
`;
  
  await fs.writeFile(path.join(outputPath, 'planets', 'index.ts'), content);
}

async function writeAnomalies(anomalies) {
  const content = `// Anomalies - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface Anomaly {
  type: string;
  tiles: Array<{
    tileCode: string;
    name: string;
  }>;
}

export const anomalies: { [key: string]: Anomaly['tiles'] } = ${JSON.stringify(anomalies, null, 2)};

export const anomalyTypes = Object.keys(anomalies);

export const getTilesByAnomaly = (anomalyType: string): Anomaly['tiles'] => {
  return anomalies[anomalyType] || [];
};
`;
  
  await fs.writeFile(path.join(outputPath, 'anomalies', 'index.ts'), content);
}

async function writeWormholes(wormholes) {
  const content = `// Wormholes - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface WormholeTile {
  tileCode: string;
  name: string;
  faction?: string | null;
}

export const wormholes: { [key: string]: WormholeTile[] } = ${JSON.stringify(wormholes, null, 2)};

export const getWormholesByType = (type: 'Alpha' | 'Beta' | 'Gamma' | 'Delta'): WormholeTile[] => {
  return wormholes[type] || [];
};

export const areConnected = (tile1: string, tile2: string): boolean => {
  // Check if two tiles share a wormhole type
  for (const [type, tiles] of Object.entries(wormholes)) {
    const codes = tiles.map((t: any) => t.tileCode);
    if (codes.includes(tile1) && codes.includes(tile2)) {
      return true;
    }
  }
  return false;
};

export const getWormholeType = (tileCode: string): string | null => {
  for (const [type, tiles] of Object.entries(wormholes)) {
    if (tiles.some((t: any) => t.tileCode === tileCode)) {
      return type;
    }
  }
  return null;
};
`;
  
  await fs.writeFile(path.join(outputPath, 'wormholes', 'index.ts'), content);
}

async function writeHyperlanes() {
  // Hyperlanes are special tiles in PoK
  const content = `// Hyperlanes - Prophecy of Kings special tiles
// Generated: ${new Date().toISOString()}

export interface Hyperlane {
  id: number;
  tileCode: string;
  connections: string[]; // Connected tile positions
}

// Hyperlane tiles from PoK (tiles 83-91)
export const hyperlanes: Hyperlane[] = [
  { id: 83, tileCode: '83A/B', connections: [] },
  { id: 84, tileCode: '84A/B', connections: [] },
  { id: 85, tileCode: '85A/B', connections: [] },
  { id: 86, tileCode: '86A/B', connections: [] },
  { id: 87, tileCode: '87A/B', connections: [] },
  { id: 88, tileCode: '88A/B', connections: [] },
  { id: 89, tileCode: '89A/B', connections: [] },
  { id: 90, tileCode: '90A/B', connections: [] },
  { id: 91, tileCode: '91A/B', connections: [] }
];

export const isHyperlane = (tileCode: string): boolean => {
  return hyperlanes.some(h => h.tileCode === tileCode);
};
`;
  
  await fs.writeFile(path.join(outputPath, 'hyperlanes', 'index.ts'), content);
}

// Helper functions
function formatTileName(enumName) {
  if (enumName.startsWith('Tile')) {
    const number = enumName.substring(4);
    return `Tile ${number}`;
  }
  return enumName;
}

function formatPlanetName(enumName) {
  const specialCases = {
    'MollPrimus': 'Moll Primus',
    'MordaiTwo': 'Mordai II',
    'ZeroDotZeroDotZeroDot': '[0.0.0]',
    'Maaluuk': "Maaluuk",
    'Druaa': "Druaa",
    'NewAlbion': 'New Albion',
    'TrenLak': 'Tren\'lak',
    'QuinArra': 'Quin\'arra',
    'RarCobalt': 'Rar Cobalt',
    'TarMann': 'Tar\'mann',
    'TequRan': 'Tequ\'ran',
    'TorkanAuda': 'Torkan Auda',
    'QuecennEtaQuatro': 'Quecen\'n EtaQuatro',
    'LokiSpaceDockBeta': 'Loki (Space Dock Beta)',
    'SigmaIridiumTerminus': 'Sigma Iridium Terminus'
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
    'TheVuilRaithCabal': "The Vuil'Raith Cabal"
  };
  
  return specialCases[enumName] || enumName;
}

function convertToId(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
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
    'Custom': 'custom',
    'Deprecated': 'deprecated'
  };
  
  return versionMap[version] || version.toLowerCase();
}

// Run if called directly
if (require.main === module) {
  extractTiles().catch(console.error);
}

module.exports = extractTiles;