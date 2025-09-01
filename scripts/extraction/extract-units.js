const fs = require('fs');
const path = require('path');

// Source paths
const unitSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/units');
const outputDir = path.join(__dirname, '../../client/src/data/units');

// Unit type categories
const unitCategories = {
  ships: ['flagship', 'warsun', 'dreadnought', 'cruiser', 'carrier', 'destroyer', 'fighter'],
  ground: ['infantry', 'mech'],
  structures: ['spacedock', 'pds']
};

// Load and process unit data
function loadUnitData() {
  const allUnits = [];
  
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
        processUnits(data, allUnits, sourceName);
      } catch (error) {
        console.warn(`Error reading ${filename}:`, error.message);
      }
    }
  });
  
  return allUnits;
}

function processUnits(unitData, allUnits, source) {
  unitData.forEach(unit => {
    const processedUnit = {
      id: unit.id,
      baseType: unit.baseType,
      asyncId: unit.asyncId || null,
      name: unit.name,
      subtitle: unit.subtitle || null,
      faction: unit.faction || 'generic',
      source: unit.source || source,
      
      // Upgrade information
      upgradesToUnitId: unit.upgradesToUnitId || null,
      upgradesFromUnitId: unit.upgradesFromUnitId || null,
      requiredTechId: unit.requiredTechId || null,
      
      // Movement and capacity
      moveValue: unit.moveValue || null,
      capacityValue: unit.capacityValue || null,
      capacityUsed: unit.capacityUsed || null,
      
      // Production
      productionValue: unit.productionValue || null,
      fleetSupplyBonus: unit.fleetSupplyBonus || null,
      
      // Cost
      cost: unit.cost || null,
      
      // Combat
      combatHitsOn: unit.combatHitsOn || null,
      combatDieCount: unit.combatDieCount || null,
      combatAfterRound: unit.combatAfterRound || null,
      
      // Anti-fighter barrage
      afbHitsOn: unit.afbHitsOn || null,
      afbDieCount: unit.afbDieCount || null,
      
      // Bombardment
      bombardmentHitsOn: unit.bombardmentHitsOn || null,
      bombardmentDieCount: unit.bombardmentDieCount || null,
      
      // Space Cannon
      spaceCannonHitsOn: unit.spaceCannonHitsOn || null,
      spaceCannonDieCount: unit.spaceCannonDieCount || null,
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
      
      // Image
      imageURL: unit.imageURL || null
    };
    
    allUnits.push(processedUnit);
  });
}

// Categorize units by type
function categorizeUnits(units) {
  const categorized = {
    flagships: [],
    warsuns: [],
    dreadnoughts: [],
    cruisers: [],
    carriers: [],
    destroyers: [],
    fighters: [],
    infantry: [],
    mechs: [],
    spacedocks: [],
    pds: [],
    other: []
  };
  
  units.forEach(unit => {
    switch(unit.baseType) {
      case 'flagship':
        categorized.flagships.push(unit);
        break;
      case 'warsun':
        categorized.warsuns.push(unit);
        break;
      case 'dreadnought':
        categorized.dreadnoughts.push(unit);
        break;
      case 'cruiser':
        categorized.cruisers.push(unit);
        break;
      case 'carrier':
        categorized.carriers.push(unit);
        break;
      case 'destroyer':
        categorized.destroyers.push(unit);
        break;
      case 'fighter':
        categorized.fighters.push(unit);
        break;
      case 'infantry':
        categorized.infantry.push(unit);
        break;
      case 'mech':
        categorized.mechs.push(unit);
        break;
      case 'spacedock':
        categorized.spacedocks.push(unit);
        break;
      case 'pds':
        categorized.pds.push(unit);
        break;
      default:
        categorized.other.push(unit);
    }
  });
  
  return categorized;
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
function generateMainIndex(allUnits, categorized) {
  let content = generateTypeScriptInterface();
  
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
  return units.filter(unit => 
    unit.faction?.toLowerCase() === faction.toLowerCase()
  );
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
    unit.faction?.toLowerCase() === faction.toLowerCase()
  );
};

export const getFactionMech = (faction: string): Unit | undefined => {
  return units.find(unit => 
    unit.baseType === 'mech' && 
    unit.faction?.toLowerCase() === faction.toLowerCase()
  );
};

export const getGenericUnits = (): Unit[] => {
  return units.filter(unit => 
    unit.faction === 'generic' || !unit.faction
  );
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
      .filter(faction => faction && faction !== 'generic')
  );
  return Array.from(factions).sort();
};

// Combat value helpers
export const getUnitCombatValue = (unit: Unit): string => {
  if (!unit.combatHitsOn) return '-';
  return unit.combatDieCount > 1 
    ? \`\${unit.combatHitsOn}(x\${unit.combatDieCount})\`
    : unit.combatHitsOn.toString();
};

export const getUnitCostValue = (unit: Unit): string => {
  if (unit.cost === null || unit.cost === undefined) return '-';
  return unit.cost.toString();
};
`;
  
  return content;
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
  
  // Categorize units
  const categorized = categorizeUnits(allUnits);
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(allUnits, categorized);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total units extracted: ${allUnits.length}`);
  console.log('\n=== Units by Type ===');
  Object.entries(categorized).forEach(([type, units]) => {
    if (units.length > 0) {
      console.log(`${type}: ${units.length}`);
    }
  });
  
  // Faction summary
  const factionCounts = {};
  allUnits.forEach(unit => {
    const faction = unit.faction || 'generic';
    factionCounts[faction] = (factionCounts[faction] || 0) + 1;
  });
  
  console.log('\n=== Units by Faction ===');
  Object.entries(factionCounts)
    .sort(([a], [b]) => a.localeCompare(b))
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
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(`${source}: ${count} units`);
    });
  
  console.log('\n✅ Unit extraction complete!');
  console.log(`Generated: ${path.join(outputDir, 'index.ts')}`);
}

// Run the extraction
main();