const fs = require('fs');
const path = require('path');

// Source paths
const unitSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/units');
const outputDir = path.join(__dirname, '../../client/src/data/units');

// Comprehensive faction name mapping to ensure consistency
const factionMap = {
  // Base game factions
  'arborec': 'The Arborec',
  'argent': 'The Argent Flight',
  'letnev': 'The Barony of Letnev',
  'saar': 'The Clan of Saar',
  'muaat': 'The Embers of Muaat',
  'hacan': 'The Emirates of Hacan',
  'sol': 'The Federation of Sol',
  'ghost': 'The Ghosts of Creuss',
  'creuss': 'The Ghosts of Creuss',
  'l1z1x': 'The L1Z1X Mindnet',
  'mentak': 'The Mentak Coalition',
  'naalu': 'The Naalu Collective',
  'nekro': 'The Nekro Virus',
  'sardakk': "The Sardakk N'orr",
  'jolnar': 'The Universities of Jol-Nar',
  'jol_nar': 'The Universities of Jol-Nar',
  'winnu': 'The Winnu',
  'xxcha': 'The Xxcha Kingdom',
  'yin': 'The Yin Brotherhood',
  'yssaril': 'The Yssaril Tribes',
  
  // PoK factions
  'mahact': 'The Mahact Gene-Sorcerers',
  'nomad': 'The Nomad',
  'titans': 'The Titans of Ul',
  'ul': 'The Titans of Ul',
  'cabal': "The Vuil'Raith Cabal",
  'vuil_raith': "The Vuil'Raith Cabal",
  'empyrean': 'The Empyrean',
  'naaz': 'The Naaz-Rokha Alliance',
  'naaz_rokha': 'The Naaz-Rokha Alliance',
  'keleres': 'The Council Keleres',
  'keleresa': 'The Council Keleres (Argent)',
  'keleresm': 'The Council Keleres (Mentak)',
  'keleresx': 'The Council Keleres (Xxcha)',
  
  // Discordant Stars factions
  'axis': 'The Axis Order',
  'bentor': 'The Bentor Conglomerate',
  'celdauri': 'The Celdauri Trade Confederation',
  'cheiran': 'The Cheiran Hordes',
  'cymiae': 'The Cymiae Confederation',
  'dihmohn': 'The Dihmohn Flotilla',
  'edyn': 'The Edyn Mandate',
  'florzen': 'The Florzen Gatherers',
  'freesystems': 'The Free Systems Compact',
  'ghemina': 'The Ghemina Raiders',
  'ghoti': 'The Ghoti Wayfarers',
  'gledge': 'The Gledge Union',
  'kollecc': 'The Kollecc Society',
  'kortali': 'The Kortali Tribunal',
  'khrask': 'The Khrask Hives',
  'kyro': 'The Kyro Sodality',
  'lanefir': 'The Lanefir Remnants',
  'lizho': "The Li-Zho Dynasty",
  'mirveda': 'The Mirveda Protectorate',
  'mortheus': 'The Mortheus Mercenaries',
  'mykomentori': 'The Myko-Mentori',
  'nivyn': 'The Nivyn Star Kings',
  'olradin': 'The Olradin League',
  'rohdhna': "The Roh'Dhna Mechatronics",
  'tnelis': "The Tnelis Syndicate",
  'vaden': 'The Vaden Banking Clans',
  'vaylerian': 'The Vaylerian Scourge',
  'veldyr': 'The Veldyr Sovereignty',
  'zelian': 'The Zelian Purifier',
  'kjalengard': 'The Kjalengard Supremacy',
  'kolume': 'The Kolume Collective',
  
  // Other
  'atokera': 'The Atokera Worldbiome',
  'augers': 'The Augurs of Ilyxum',
  'belkosea': 'The Belkosea Allied States',
  'nokar': 'The Nokar Sellships',
  'pharadn': "The Pharad'n Nomads",
  'qhet': 'The Qhet Praetoria',
  'toldar': 'The Toldar Concord',
  'uydai': 'The Uydai Empire',
  'zealots': 'The Zealots of Rhodun',
  'drahn': 'The Drahn Consortium',
  
  // Generic
  'generic': 'Generic',
  'lazax': 'The Lazax'
};

// Normalize faction name
function normalizeFaction(faction) {
  if (!faction) return 'Generic';
  
  // Convert to lowercase for lookup
  const key = faction.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Check all possible keys
  for (const [mapKey, mapValue] of Object.entries(factionMap)) {
    if (mapKey.toLowerCase().replace(/[^a-z0-9]/g, '') === key) {
      return mapValue;
    }
  }
  
  // If not found in map, return original with proper casing
  console.warn(`Unknown faction: ${faction}`);
  return faction;
}

// Load and process unit data
function loadUnitData() {
  const allUnits = [];
  const unitIdSet = new Set(); // Track unique unit IDs to avoid duplicates
  
  // Primary sources in order of importance
  const sources = [
    'baseUnits.json',  // Base game units
    'pok.json',        // Prophecy of Kings expansion
    'ds.json',         // Discordant Stars
    'keleres.json',    // Keleres specific units
    'absol.json',      // Absol's homebrew
    'miltymod.json',   // Milty mod variants
    'flagshipping.json', // Additional flagships
    'project_pi.json', // Project PI units
    'monuments.json'   // Monument units
  ];
  
  sources.forEach(filename => {
    const filePath = path.join(unitSourceDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const sourceName = filename.replace('.json', '');
        processUnits(data, allUnits, sourceName, unitIdSet);
      } catch (error) {
        console.warn(`Error reading ${filename}:`, error.message);
      }
    }
  });
  
  return allUnits;
}

// Helper to convert string numbers to actual numbers
function parseNumericValue(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove '+' prefix and parse
    const cleaned = value.replace(/^\+/, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function processUnits(unitData, allUnits, source, unitIdSet) {
  unitData.forEach(unit => {
    // Skip duplicates
    if (unitIdSet.has(unit.id)) {
      return;
    }
    unitIdSet.add(unit.id);
    
    const processedUnit = {
      id: unit.id,
      baseType: unit.baseType,
      asyncId: unit.asyncId || null,
      name: unit.name,
      subtitle: unit.subtitle || null,
      faction: normalizeFaction(unit.faction),
      source: unit.source || source,
      
      // Upgrade information
      upgradesToUnitId: unit.upgradesToUnitId || null,
      upgradesFromUnitId: unit.upgradesFromUnitId || null,
      requiredTechId: unit.requiredTechId || null,
      
      // Movement and capacity
      moveValue: parseNumericValue(unit.moveValue),
      capacityValue: parseNumericValue(unit.capacityValue),
      capacityUsed: parseNumericValue(unit.capacityUsed),
      
      // Production
      productionValue: parseNumericValue(unit.productionValue),
      fleetSupplyBonus: parseNumericValue(unit.fleetSupplyBonus),
      
      // Cost
      cost: parseNumericValue(unit.cost),
      
      // Combat
      combatHitsOn: parseNumericValue(unit.combatHitsOn),
      combatDieCount: parseNumericValue(unit.combatDieCount),
      combatAfterRound: parseNumericValue(unit.combatAfterRound),
      
      // Anti-fighter barrage
      afbHitsOn: parseNumericValue(unit.afbHitsOn),
      afbDieCount: parseNumericValue(unit.afbDieCount),
      
      // Bombardment
      bombardmentHitsOn: parseNumericValue(unit.bombardmentHitsOn),
      bombardmentDieCount: parseNumericValue(unit.bombardmentDieCount),
      
      // Space Cannon
      spaceCannonHitsOn: parseNumericValue(unit.spaceCannonHitsOn),
      spaceCannonDieCount: parseNumericValue(unit.spaceCannonDieCount),
      spaceCannonRange: unit.spaceCannonRange || null,
      
      // Abilities
      sustainDamage: unit.sustainDamage || false,
      planetaryShield: unit.planetaryShield || false,
      canBeDirectHit: unit.canBeDirectHit || false,
      autoModDamageRepair: unit.autoModDamageRepair || false,
      
      // Unit type flags
      isShip: unit.isShip || false,
      isGroundForce: unit.isGroundForce || false,
      isStructure: unit.isStructure || false,
      
      // Special abilities
      ability: unit.ability || null,
      
      // Homebrew tracking
      homebrewReplacesID: unit.homebrewReplacesID || null,
      
      // Image - remove if it's a full URL to avoid external dependencies
      imageURL: unit.imageURL && !unit.imageURL.startsWith('http') ? unit.imageURL : null
    };
    
    allUnits.push(processedUnit);
  });
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Units - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface Unit {
  id: string;
  baseType: string;
  asyncId?: string | null;
  name: string;
  subtitle?: string | null;
  faction: string;
  source: string;
  
  // Upgrade information
  upgradesToUnitId?: string | null;
  upgradesFromUnitId?: string | null;
  requiredTechId?: string | null;
  
  // Movement and capacity
  moveValue?: number | null;
  capacityValue?: number | null;
  capacityUsed?: number | null;
  
  // Production
  productionValue?: number | null;
  fleetSupplyBonus?: number | null;
  
  // Cost
  cost?: number | null;
  
  // Combat
  combatHitsOn?: number | null;
  combatDieCount?: number | null;
  combatAfterRound?: number | null;
  
  // Anti-fighter barrage
  afbHitsOn?: number | null;
  afbDieCount?: number | null;
  
  // Bombardment
  bombardmentHitsOn?: number | null;
  bombardmentDieCount?: number | null;
  
  // Space Cannon
  spaceCannonHitsOn?: number | null;
  spaceCannonDieCount?: number | null;
  spaceCannonRange?: string | null;
  
  // Abilities
  sustainDamage?: boolean;
  planetaryShield?: boolean;
  canBeDirectHit?: boolean;
  autoModDamageRepair?: boolean;
  
  // Unit type flags
  isShip?: boolean;
  isGroundForce?: boolean;
  isStructure?: boolean;
  
  // Special abilities
  ability?: string | null;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
  
  // Image
  imageURL?: string | null;
}

export type UnitType = 
  | 'flagship'
  | 'warsun'
  | 'dreadnought'
  | 'cruiser'
  | 'carrier'
  | 'destroyer'
  | 'fighter'
  | 'infantry'
  | 'mech'
  | 'spacedock'
  | 'pds';
`;
}

// Generate main index file
function generateMainIndex(allUnits) {
  let content = generateTypeScriptInterface();
  
  // Sort units by faction, then by type, then by name for consistency
  allUnits.sort((a, b) => {
    if (a.faction !== b.faction) {
      return a.faction.localeCompare(b.faction);
    }
    if (a.baseType !== b.baseType) {
      return a.baseType.localeCompare(b.baseType);
    }
    return a.name.localeCompare(b.name);
  });
  
  content += `
export const units: Unit[] = ${JSON.stringify(allUnits, null, 2)};

// Categorized units for easier access
export const unitsByType = {
  flagships: units.filter(u => u.baseType === 'flagship'),
  warsuns: units.filter(u => u.baseType === 'warsun'),
  dreadnoughts: units.filter(u => u.baseType === 'dreadnought'),
  cruisers: units.filter(u => u.baseType === 'cruiser'),
  carriers: units.filter(u => u.baseType === 'carrier'),
  destroyers: units.filter(u => u.baseType === 'destroyer'),
  fighters: units.filter(u => u.baseType === 'fighter'),
  infantry: units.filter(u => u.baseType === 'infantry'),
  mechs: units.filter(u => u.baseType === 'mech'),
  spacedocks: units.filter(u => u.baseType === 'spacedock'),
  pds: units.filter(u => u.baseType === 'pds')
};

// Helper functions
export const getUnitById = (id: string): Unit | undefined => {
  return units.find(unit => unit.id === id);
};

export const getUnitsByFaction = (faction: string): Unit[] => {
  return units.filter(unit => unit.faction === faction);
};

export const getUnitsByType = (type: UnitType): Unit[] => {
  return units.filter(unit => unit.baseType === type);
};

export const getUpgradeForUnit = (unitId: string): Unit | undefined => {
  const unit = getUnitById(unitId);
  if (!unit || !unit.upgradesToUnitId) return undefined;
  return getUnitById(unit.upgradesToUnitId);
};

export const getBaseUnit = (upgradedUnitId: string): Unit | undefined => {
  const unit = getUnitById(upgradedUnitId);
  if (!unit || !unit.upgradesFromUnitId) return undefined;
  return getUnitById(unit.upgradesFromUnitId);
};

export const getFactionFlagship = (faction: string): Unit | undefined => {
  return units.find(unit => 
    unit.baseType === 'flagship' && 
    unit.faction === faction
  );
};

export const getFactionMech = (faction: string): Unit | undefined => {
  return units.find(unit => 
    unit.baseType === 'mech' && 
    unit.faction === faction
  );
};

export const getGenericUnits = (): Unit[] => {
  return units.filter(unit => unit.faction === 'Generic');
};

export const getOfficialUnits = (): Unit[] => {
  return units.filter(unit => 
    unit.source === 'base' || unit.source === 'pok' || unit.source === 'baseUnits'
  );
};

export const getHomebrewUnits = (): Unit[] => {
  return units.filter(unit => 
    unit.source !== 'base' && unit.source !== 'pok' && unit.source !== 'baseUnits'
  );
};

// Get all unique factions that have units
export const getFactionsWithUnits = (): string[] => {
  const factions = new Set(
    units
      .map(unit => unit.faction)
      .filter(faction => faction && faction !== 'Generic')
  );
  return Array.from(factions).sort();
};

// Combat value helpers
export const getUnitCombatValue = (unit: Unit): string => {
  if (!unit.combatHitsOn) return '-';
  return unit.combatDieCount && unit.combatDieCount > 1 
    ? \`\${unit.combatHitsOn}(x\${unit.combatDieCount})\`
    : unit.combatHitsOn.toString();
};

export const getUnitCostValue = (unit: Unit): string => {
  if (unit.cost === null || unit.cost === undefined) return '-';
  return unit.cost.toString();
};

export const getUnitMoveValue = (unit: Unit): string => {
  if (unit.moveValue === null || unit.moveValue === undefined) return '-';
  return unit.moveValue.toString();
};

export const getUnitCapacityValue = (unit: Unit): string => {
  if (unit.capacityValue === null || unit.capacityValue === undefined) return '-';
  return unit.capacityValue.toString();
};
`;
  
  return content;
}

// Clean up empty directories
function cleanupEmptyDirs() {
  const subdirs = ['abilities', 'costs', 'mechs', 'stats'];
  subdirs.forEach(dir => {
    const dirPath = path.join(outputDir, dir);
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmdirSync(dirPath);
        console.log(`Removed empty directory: ${dir}`);
      } catch (error) {
        // Directory might not be empty or other error
      }
    }
  });
}

// Main execution
function main() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Load all unit data
  console.log('Loading unit data from TI4_map_generator_bot...');
  const allUnits = loadUnitData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(allUnits);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Clean up empty directories
  cleanupEmptyDirs();
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total units extracted: ${allUnits.length}`);
  
  // Type summary
  const typeCounts = {};
  allUnits.forEach(unit => {
    typeCounts[unit.baseType] = (typeCounts[unit.baseType] || 0) + 1;
  });
  
  console.log('\n=== Units by Type ===');
  Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
  
  // Faction summary
  const factionCounts = {};
  allUnits.forEach(unit => {
    factionCounts[unit.faction] = (factionCounts[unit.faction] || 0) + 1;
  });
  
  console.log('\n=== Units by Faction (Top 20) ===');
  Object.entries(factionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .forEach(([faction, count]) => {
      console.log(`${faction}: ${count} units`);
    });
  
  // Source summary
  const sourceCounts = {};
  allUnits.forEach(unit => {
    const source = unit.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Units by Source ===');
  Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([source, count]) => {
      console.log(`${source}: ${count} units`);
    });
  
  console.log('\n✅ Unit extraction complete!');
  console.log(`Generated: ${path.join(outputDir, 'index.ts')}`);
}

// Run the extraction
main();