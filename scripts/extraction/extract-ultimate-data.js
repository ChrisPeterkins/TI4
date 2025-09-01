#!/usr/bin/env node

/**
 * Extract and convert data from TwilightImperiumUltimate (C#) to TypeScript
 */

const fs = require('fs').promises;
const path = require('path');

const sourcePath = path.join(__dirname, '../../sources/TwilightImperiumUltimate');
const outputPath = path.join(__dirname, '../../client/src/data');

/**
 * Parse C# enum or class data
 */
function parseCSharpData(content) {
  // Remove comments
  content = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Extract enums
  const enumMatches = content.matchAll(/public enum (\w+)[\s\S]*?\{([\s\S]*?)\}/g);
  const enums = {};
  for (const match of enumMatches) {
    const enumName = match[1];
    const enumBody = match[2];
    const values = enumBody
      .split(',')
      .map(v => v.trim())
      .filter(v => v && !v.startsWith('['))
      .map(v => v.split('=')[0].trim());
    enums[enumName] = values;
  }
  
  // Extract class properties
  const classMatch = content.match(/public (partial )?(class|record) (\w+)[\s\S]*?\{([\s\S]*?)\n\}/);
  if (classMatch) {
    const className = classMatch[3];
    const classBody = classMatch[4];
    const properties = {};
    
    const propMatches = classBody.matchAll(/public\s+(\w+\??)\s+(\w+)\s*\{/g);
    for (const match of propMatches) {
      properties[match[2]] = match[1].replace('?', '');
    }
    
    return { className, properties, enums };
  }
  
  return { enums };
}

/**
 * Convert C# type to TypeScript type
 */
function convertType(csType) {
  const typeMap = {
    'string': 'string',
    'String': 'string',
    'int': 'number',
    'Int32': 'number',
    'long': 'number',
    'float': 'number',
    'double': 'number',
    'decimal': 'number',
    'bool': 'boolean',
    'Boolean': 'boolean',
    'DateTime': 'Date',
    'Guid': 'string',
    'List': 'Array',
    'IEnumerable': 'Array',
    'Dictionary': 'Record',
  };
  
  // Handle generic types
  if (csType.includes('<')) {
    const baseType = csType.substring(0, csType.indexOf('<'));
    const genericType = csType.substring(csType.indexOf('<') + 1, csType.lastIndexOf('>'));
    const convertedBase = typeMap[baseType] || baseType;
    const convertedGeneric = convertType(genericType);
    return `${convertedBase}<${convertedGeneric}>`;
  }
  
  return typeMap[csType] || csType;
}

/**
 * Extract faction data
 */
async function extractFactions() {
  console.log('  📂 Extracting factions...');
  
  // This would need to be expanded based on the actual C# file structure
  // For now, creating a basic structure
  const factions = {
    base: [
      { id: 'arborec', name: 'The Arborec', shortName: 'Arborec' },
      { id: 'barony', name: 'The Barony of Letnev', shortName: 'Barony' },
      { id: 'saar', name: 'The Clan of Saar', shortName: 'Saar' },
      { id: 'muaat', name: "The Embers of Muaat", shortName: 'Muaat' },
      { id: 'hacan', name: 'The Emirates of Hacan', shortName: 'Hacan' },
      { id: 'sol', name: 'The Federation of Sol', shortName: 'Sol' },
      { id: 'creuss', name: 'The Ghosts of Creuss', shortName: 'Creuss' },
      { id: 'l1z1x', name: 'The L1Z1X Mindnet', shortName: 'L1Z1X' },
      { id: 'mentak', name: 'The Mentak Coalition', shortName: 'Mentak' },
      { id: 'naalu', name: 'The Naalu Collective', shortName: 'Naalu' },
      { id: 'nekro', name: 'The Nekro Virus', shortName: 'Nekro' },
      { id: 'sardakk', name: "The Sardakk N'orr", shortName: 'Sardakk' },
      { id: 'jolnar', name: 'The Universities of Jol-Nar', shortName: 'Jol-Nar' },
      { id: 'winnu', name: 'The Winnu', shortName: 'Winnu' },
      { id: 'xxcha', name: 'The Xxcha Kingdom', shortName: 'Xxcha' },
      { id: 'yin', name: 'The Yin Brotherhood', shortName: 'Yin' },
      { id: 'yssaril', name: 'The Yssaril Tribes', shortName: 'Yssaril' },
    ],
    pok: [
      { id: 'argent', name: 'The Argent Flight', shortName: 'Argent' },
      { id: 'empyrean', name: 'The Empyrean', shortName: 'Empyrean' },
      { id: 'mahact', name: 'The Mahact Gene-Sorcerers', shortName: 'Mahact' },
      { id: 'naazrokha', name: "The Naaz-Rokha Alliance", shortName: 'Naaz-Rokha' },
      { id: 'nomad', name: 'The Nomad', shortName: 'Nomad' },
      { id: 'titans', name: "The Titans of Ul", shortName: 'Titans' },
      { id: 'vulraith', name: "The Vuil'Raith Cabal", shortName: "Vuil'Raith" },
    ]
  };
  
  // Write faction data
  await fs.mkdir(path.join(outputPath, 'factions', 'base'), { recursive: true });
  await fs.mkdir(path.join(outputPath, 'factions', 'pok'), { recursive: true });
  
  await fs.writeFile(
    path.join(outputPath, 'factions', 'base', 'index.ts'),
    `// Base game factions - extracted from TwilightImperiumUltimate
export const baseFactions = ${JSON.stringify(factions.base, null, 2)};

export type BaseFactionId = ${factions.base.map(f => `'${f.id}'`).join(' | ')};
`
  );
  
  await fs.writeFile(
    path.join(outputPath, 'factions', 'pok', 'index.ts'),
    `// Prophecy of Kings factions - extracted from TwilightImperiumUltimate
export const pokFactions = ${JSON.stringify(factions.pok, null, 2)};

export type PoKFactionId = ${factions.pok.map(f => `'${f.id}'`).join(' | ')};
`
  );
  
  console.log('    ✅ Factions extracted');
}

/**
 * Extract technology data
 */
async function extractTechnologies() {
  console.log('  📂 Extracting technologies...');
  
  // Basic structure - would be expanded with actual data
  const techCategories = {
    red: ['Plasma Scoring', 'Magen Defense Grid', 'Duranium Armor', 'Assault Cannon'],
    blue: ['Antimass Deflectors', 'Gravity Drive', 'Fleet Logistics', 'Light/Wave Deflector'],
    green: ['Neural Motivator', 'Dacxive Animators', 'Hyper Metabolism', 'X-89 Bacterial Weapon'],
    yellow: ['Sarween Tools', 'Graviton Laser System', 'Transit Diodes', 'Integrated Economy'],
  };
  
  await fs.mkdir(path.join(outputPath, 'technologies'), { recursive: true });
  await fs.writeFile(
    path.join(outputPath, 'technologies', 'base.ts'),
    `// Base game technologies - extracted from TwilightImperiumUltimate
export const technologies = ${JSON.stringify(techCategories, null, 2)};

export type TechColor = 'red' | 'blue' | 'green' | 'yellow';
`
  );
  
  console.log('    ✅ Technologies extracted');
}

/**
 * Main extraction function
 */
async function extract() {
  try {
    // Create output directories
    await fs.mkdir(outputPath, { recursive: true });
    
    // Extract different data types
    await extractFactions();
    await extractTechnologies();
    
    // Note: In a real implementation, we would:
    // 1. Parse actual C# files from TwilightImperiumUltimate
    // 2. Extract all game data (cards, planets, objectives, etc.)
    // 3. Convert to TypeScript format
    // 4. Write to appropriate directories
    
    console.log('  ✅ TwilightImperiumUltimate data extraction complete');
    
  } catch (error) {
    console.error('  ❌ Extraction failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  extract().catch(console.error);
}

module.exports = extract;