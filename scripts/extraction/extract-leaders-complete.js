const fs = require('fs');
const path = require('path');

// Source paths
const leaderSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/leaders');
const outputDir = path.join(__dirname, '../../client/src/data/leaders');

// Faction name mapping between TI4_map_generator_bot and our naming convention
const factionMap = {
  'arborec': "The Arborec",
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
  'keleres': 'The Council Keleres',
  'mahact': 'The Mahact Gene-Sorcerers',
  'nomad': 'The Nomad',
  'titans': 'The Titans of Ul',
  'ul': 'The Titans of Ul',
  'cabal': "The Vuil'Raith Cabal",
  'vuil_raith': "The Vuil'Raith Cabal",
  'empyrean': 'The Empyrean',
  'naaz_rokha': 'The Naaz-Rokha Alliance',
  'rohdhna': 'Roh Dhna Mechatronics',
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
  'rohdina': "The Roh'Dhna Mechatronics",
  'tnelis': "The Tnelis Syndicate",
  'vaden': 'The Vaden Banking Clans',
  'vaylerian': 'The Vaylerian Scourge',
  'veldyr': 'The Veldyr Sovereignty',
  'zelian': 'The Zelian Purifier'
};

// Load and process leader data
function loadLeaderData() {
  const allLeaders = {
    agents: [],
    commanders: [],
    heroes: []
  };

  // Primary sources we want to extract
  const sources = ['pok.json', 'ds.json', 'keleres.json'];
  
  // Load POK leaders first (official content)
  const pokFile = path.join(leaderSourceDir, 'pok.json');
  if (fs.existsSync(pokFile)) {
    const pokData = JSON.parse(fs.readFileSync(pokFile, 'utf-8'));
    processLeaders(pokData, allLeaders, 'pok');
  }

  // Load DS leaders (Discordant Stars expansion)
  const dsFile = path.join(leaderSourceDir, 'ds.json');
  if (fs.existsSync(dsFile)) {
    const dsData = JSON.parse(fs.readFileSync(dsFile, 'utf-8'));
    processLeaders(dsData, allLeaders, 'ds');
  }

  // Load additional Keleres content if exists
  const keleresFile = path.join(leaderSourceDir, 'keleresplus.json');
  if (fs.existsSync(keleresFile)) {
    const keleresData = JSON.parse(fs.readFileSync(keleresFile, 'utf-8'));
    processLeaders(keleresData, allLeaders, 'keleres_plus');
  }

  return allLeaders;
}

function processLeaders(leaderData, allLeaders, source) {
  leaderData.forEach(leader => {
    const processedLeader = {
      id: leader.id,
      name: leader.name,
      title: leader.title || null,
      faction: mapFactionName(leader.faction),
      type: capitalizeFirst(leader.type),
      abilityName: leader.abilityName || null,
      abilityWindow: leader.abilityWindow || null,
      abilityText: leader.abilityText || null,
      unlockCondition: leader.unlockCondition || null,
      source: source,
      shortName: leader.shortName || null
    };

    // Categorize by type
    switch (leader.type.toLowerCase()) {
      case 'agent':
        allLeaders.agents.push(processedLeader);
        break;
      case 'commander':
        allLeaders.commanders.push(processedLeader);
        break;
      case 'hero':
        allLeaders.heroes.push(processedLeader);
        break;
      case 'envoy':
        // Some homebrew content has envoys, treating as agents
        processedLeader.type = 'Agent';
        allLeaders.agents.push(processedLeader);
        break;
    }
  });
}

function mapFactionName(factionId) {
  if (!factionId) return 'Unknown';
  const mapped = factionMap[factionId.toLowerCase()];
  if (!mapped) {
    console.warn(`Unknown faction: ${factionId}`);
    return factionId;
  }
  return mapped;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Generate TypeScript files
function generateTypeScriptFile(leaders, type, typeName) {
  const interfaceName = `${typeName}Leader`;
  
  let content = `// ${typeName}s - extracted from TI4_map_generator_bot\n`;
  content += `// Generated: ${new Date().toISOString()}\n\n`;
  
  content += `export interface ${interfaceName} {\n`;
  content += `  id: string;\n`;
  content += `  name: string;\n`;
  content += `  title?: string | null;\n`;
  content += `  faction: string;\n`;
  content += `  type: '${typeName}';\n`;
  content += `  abilityName?: string | null;\n`;
  content += `  abilityWindow?: string | null;\n`;
  content += `  abilityText?: string | null;\n`;
  content += `  unlockCondition?: string | null;\n`;
  content += `  source: string;\n`;
  content += `  shortName?: string | null;\n`;
  content += `}\n\n`;
  
  // Sort leaders by faction then by name for consistency
  leaders.sort((a, b) => {
    if (a.faction !== b.faction) {
      return a.faction.localeCompare(b.faction);
    }
    return a.name.localeCompare(b.name);
  });
  
  content += `export const ${type}: ${interfaceName}[] = ${JSON.stringify(leaders, null, 2)};\n\n`;
  
  content += `export const get${typeName}ByFaction = (faction: string): ${interfaceName}[] => {\n`;
  content += `  return ${type}.filter(leader => leader.faction === faction);\n`;
  content += `};\n\n`;
  
  content += `export const get${typeName}ByName = (name: string): ${interfaceName} | undefined => {\n`;
  content += `  return ${type}.find(leader => leader.name === name);\n`;
  content += `};\n\n`;
  
  content += `export const get${typeName}ById = (id: string): ${interfaceName} | undefined => {\n`;
  content += `  return ${type}.find(leader => leader.id === id);\n`;
  content += `};\n`;
  
  const outputPath = path.join(outputDir, type, 'index.ts');
  fs.writeFileSync(outputPath, content);
  console.log(`Generated ${outputPath}`);
}

// Generate main index file
function generateMainIndex(leadersData) {
  let mainIndex = `// Leaders - extracted from TI4_map_generator_bot\n`;
  mainIndex += `// Generated: ${new Date().toISOString()}\n\n`;
  mainIndex += `export * from './agents';\n`;
  mainIndex += `export * from './commanders';\n`;
  mainIndex += `export * from './heroes';\n\n`;

  mainIndex += `import { agents, AgentLeader } from './agents';\n`;
  mainIndex += `import { commanders, CommanderLeader } from './commanders';\n`;
  mainIndex += `import { heroes, HeroLeader } from './heroes';\n\n`;

  mainIndex += `export type Leader = AgentLeader | CommanderLeader | HeroLeader;\n\n`;

  mainIndex += `export const allLeaders: Leader[] = [\n`;
  mainIndex += `  ...agents,\n`;
  mainIndex += `  ...commanders,\n`;
  mainIndex += `  ...heroes\n`;
  mainIndex += `];\n\n`;

  mainIndex += `export const getLeadersByFaction = (faction: string): Leader[] => {\n`;
  mainIndex += `  return allLeaders.filter(leader => leader.faction === faction);\n`;
  mainIndex += `};\n\n`;

  mainIndex += `export const getLeaderByName = (name: string): Leader | undefined => {\n`;
  mainIndex += `  return allLeaders.find(leader => leader.name === name);\n`;
  mainIndex += `};\n\n`;

  mainIndex += `export const getLeaderById = (id: string): Leader | undefined => {\n`;
  mainIndex += `  return allLeaders.find(leader => leader.id === id);\n`;
  mainIndex += `};\n\n`;

  mainIndex += `export const getOfficialLeaders = (): Leader[] => {\n`;
  mainIndex += `  return allLeaders.filter(leader => leader.source === 'pok');\n`;
  mainIndex += `};\n\n`;

  mainIndex += `export const getDiscordantStarsLeaders = (): Leader[] => {\n`;
  mainIndex += `  return allLeaders.filter(leader => leader.source === 'ds');\n`;
  mainIndex += `};\n\n`;

  mainIndex += `// Get unique factions that have leaders\n`;
  mainIndex += `export const getFactionsWithLeaders = (): string[] => {\n`;
  mainIndex += `  const factions = new Set(allLeaders.map(leader => leader.faction));\n`;
  mainIndex += `  return Array.from(factions).sort();\n`;
  mainIndex += `};\n`;

  fs.writeFileSync(path.join(outputDir, 'index.ts'), mainIndex);
  console.log(`Generated ${path.join(outputDir, 'index.ts')}`);
}

// Main execution
function main() {
  // Ensure output directories exist
  ['agents', 'commanders', 'heroes'].forEach(dir => {
    const dirPath = path.join(outputDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });

  // Load all leader data
  console.log('Loading leader data from TI4_map_generator_bot...');
  const leadersData = loadLeaderData();

  // Generate TypeScript files
  console.log('\nGenerating TypeScript files...');
  generateTypeScriptFile(leadersData.agents, 'agents', 'Agent');
  generateTypeScriptFile(leadersData.commanders, 'commanders', 'Commander');
  generateTypeScriptFile(leadersData.heroes, 'heroes', 'Hero');
  
  // Generate main index
  generateMainIndex(leadersData);

  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total agents: ${leadersData.agents.length}`);
  console.log(`Total commanders: ${leadersData.commanders.length}`);
  console.log(`Total heroes: ${leadersData.heroes.length}`);
  console.log(`Grand total: ${leadersData.agents.length + leadersData.commanders.length + leadersData.heroes.length} leaders`);

  // Group by faction for summary
  const byFaction = {};
  [...leadersData.agents, ...leadersData.commanders, ...leadersData.heroes].forEach(leader => {
    if (!byFaction[leader.faction]) {
      byFaction[leader.faction] = { agents: 0, commanders: 0, heroes: 0, source: new Set() };
    }
    byFaction[leader.faction][leader.type.toLowerCase() + 's']++;
    byFaction[leader.faction].source.add(leader.source);
  });

  console.log('\n=== Leaders by Faction ===');
  Object.entries(byFaction).sort().forEach(([faction, counts]) => {
    const sources = Array.from(counts.source).join(', ');
    console.log(`${faction}: ${counts.agents} agents, ${counts.commanders} commanders, ${counts.heroes} heroes [${sources}]`);
  });

  // Show POK vs DS breakdown
  const pokCount = [...leadersData.agents, ...leadersData.commanders, ...leadersData.heroes]
    .filter(l => l.source === 'pok').length;
  const dsCount = [...leadersData.agents, ...leadersData.commanders, ...leadersData.heroes]
    .filter(l => l.source === 'ds').length;
  const otherCount = [...leadersData.agents, ...leadersData.commanders, ...leadersData.heroes]
    .filter(l => l.source !== 'pok' && l.source !== 'ds').length;

  console.log('\n=== Content Sources ===');
  console.log(`Prophecy of Kings (official): ${pokCount} leaders`);
  console.log(`Discordant Stars (fan expansion): ${dsCount} leaders`);
  if (otherCount > 0) {
    console.log(`Other sources: ${otherCount} leaders`);
  }
}

// Run the extraction
main();