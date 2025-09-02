const fs = require('fs');
const path = require('path');

// Source paths
const abilitiesSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/abilities');
const outputDir = path.join(__dirname, '../../server/src/data/abilities');

// Load and process abilities data
function loadAbilitiesData() {
  const allAbilities = [];
  
  // Get all JSON files in the abilities directory
  const files = fs.readdirSync(abilitiesSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(abilitiesSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(ability => {
        const processedAbility = {
          id: ability.id,
          name: ability.name,
          faction: ability.faction || null,
          permanentEffect: ability.permanentEffect || null,
          window: ability.window || null,
          windowEffect: ability.windowEffect || null,
          source: ability.source || sourceName,
          
          // Additional fields that may exist
          description: ability.description || null,
          timing: ability.timing || null,
          phase: ability.phase || null,
          prerequisite: ability.prerequisite || null,
          
          // Homebrew tracking
          homebrewReplacesID: ability.homebrewReplacesID || null
        };
        
        allAbilities.push(processedAbility);
      });
    } catch (error) {
      console.warn(`Error reading ${filename}:`, error.message);
    }
  });
  
  return allAbilities;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Abilities - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface Ability {
  id: string;
  name: string;
  faction?: string | null;
  permanentEffect?: string | null;
  window?: string | null;
  windowEffect?: string | null;
  source: string;
  description?: string | null;
  timing?: string | null;
  phase?: string | null;
  prerequisite?: string | null;
  homebrewReplacesID?: string | null;
}
`;
}

// Generate main index file
function generateMainIndex(abilities) {
  let content = generateTypeScriptInterface();
  
  content += `
export const abilities: Ability[] = ${JSON.stringify(abilities, null, 2)};

// Helper functions
export const getAbilityById = (id: string): Ability | undefined => {
  return abilities.find(ability => ability.id === id);
};

export const getAbilitiesByFaction = (faction: string): Ability[] => {
  return abilities.filter(ability => 
    ability.faction?.toLowerCase() === faction.toLowerCase()
  );
};

export const getAbilitiesByWindow = (window: string): Ability[] => {
  return abilities.filter(ability => 
    ability.window?.toLowerCase().includes(window.toLowerCase())
  );
};

export const getAbilitiesByPhase = (phase: string): Ability[] => {
  return abilities.filter(ability => 
    ability.phase?.toLowerCase() === phase.toLowerCase()
  );
};

export const searchAbilities = (searchTerm: string): Ability[] => {
  const term = searchTerm.toLowerCase();
  return abilities.filter(ability => 
    ability.name.toLowerCase().includes(term) ||
    ability.permanentEffect?.toLowerCase().includes(term) ||
    ability.windowEffect?.toLowerCase().includes(term) ||
    ability.description?.toLowerCase().includes(term)
  );
};

// Get all unique factions that have abilities
export const getFactionsWithAbilities = (): string[] => {
  const factions = new Set<string>(
    abilities
      .map(ability => ability.faction)
      .filter((faction): faction is string => faction !== null && faction !== undefined)
  );
  return Array.from(factions).sort();
};

// Get abilities by source (base game, expansion, homebrew)
export const getOfficialAbilities = (): Ability[] => {
  return abilities.filter(ability => 
    ability.source === 'base' || ability.source === 'pok'
  );
};

export const getHomebrewAbilities = (): Ability[] => {
  return abilities.filter(ability => 
    ability.source !== 'base' && ability.source !== 'pok'
  );
};

// Group abilities by timing window
export const abilitiesByTiming = {
  statusPhase: abilities.filter(a => a.window?.toLowerCase().includes('status phase')),
  actionPhase: abilities.filter(a => a.window?.toLowerCase().includes('action')),
  combatRound: abilities.filter(a => a.window?.toLowerCase().includes('combat')),
  agendaPhase: abilities.filter(a => a.window?.toLowerCase().includes('agenda')),
  strategyPhase: abilities.filter(a => a.window?.toLowerCase().includes('strategy')),
  permanent: abilities.filter(a => !a.window && a.permanentEffect)
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
  
  console.log('Loading abilities data from TI4_map_generator_bot...');
  const abilities = loadAbilitiesData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(abilities);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total abilities extracted: ${abilities.length}`);
  
  // Faction summary
  const factionCounts = {};
  abilities.forEach(ability => {
    const faction = ability.faction || 'generic';
    factionCounts[faction] = (factionCounts[faction] || 0) + 1;
  });
  
  console.log('\n=== Abilities by Faction ===');
  Object.entries(factionCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 10)
    .forEach(([faction, count]) => {
      console.log(`${faction}: ${count}`);
    });
  
  // Source summary
  const sourceCounts = {};
  abilities.forEach(ability => {
    const source = ability.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Abilities by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(`${source}: ${count}`);
    });
  
  console.log('\n✅ Abilities extraction complete!');
  console.log(`Generated: ${path.join(outputDir, 'index.ts')}`);
}

// Run the extraction
main();