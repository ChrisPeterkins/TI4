const fs = require('fs');
const path = require('path');

// Read the FactionsInfo.resx file
const resxPath = path.join(__dirname, '../../sources/TwilightImperiumUltimate/src/TwilightImperiumUltimate.Web/Resources/FactionsInfo.resx');
const resxContent = fs.readFileSync(resxPath, 'utf-8');

// Parse leader data from the resx file
function extractLeaders() {
  const leaders = {
    agents: [],
    commanders: [],
    heroes: []
  };
  
  // Regular expression to extract leader headers
  const leaderPattern = /<h1>([^<]+)\s*<sub>\((Agent|Commander|Hero)\)<\/sub><\/h1>/g;
  
  // Extract faction names from data elements
  const factionPattern = /<data name="([A-Za-z0-9]+)_Notes"/g;
  const factions = [];
  let factionMatch;
  while ((factionMatch = factionPattern.exec(resxContent)) !== null) {
    factions.push(factionMatch[1]);
  }
  
  // For each faction, extract its leaders from the Notes section
  factions.forEach(faction => {
    // Find the faction's Notes section
    const notesPattern = new RegExp(`<data name="${faction}_Notes"[^>]*>\\s*<value>([\\s\\S]*?)<\/value>`, 'g');
    const notesMatch = notesPattern.exec(resxContent);
    
    if (notesMatch) {
      const notesContent = notesMatch[1];
      // Decode HTML entities first
      const decodedContent = notesContent
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      
      let leaderMatch;
      const localPattern = /<h1>([^<]+)\s*<sub>\((Agent|Commander|Hero)\)<\/sub><\/h1>/g;
      
      while ((leaderMatch = localPattern.exec(decodedContent)) !== null) {
        const name = leaderMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&rsquo;/g, "'")
          .replace(/&ldquo;/g, '"')
          .replace(/&rdquo;/g, '"')
          .replace(/&mdash;/g, '—')
          .replace(/&ndash;/g, '–')
          .replace(/&Omega;/g, 'Ω')
          .trim();
        
        const type = leaderMatch[2].toLowerCase();
        
        // Parse name and ability for heroes
        let leaderName = name;
        let ability = null;
        if (type === 'hero' && name.includes('—')) {
          const parts = name.split('—');
          leaderName = parts[0].trim();
          ability = parts[1].trim();
        }
        
        const leaderData = {
          name: leaderName,
          faction: formatFactionName(faction),
          type: type.charAt(0).toUpperCase() + type.slice(1)
        };
        
        if (ability) {
          leaderData.ability = ability;
        }
        
        // Add to appropriate category
        if (type === 'agent') {
          leaders.agents.push(leaderData);
        } else if (type === 'commander') {
          leaders.commanders.push(leaderData);
        } else if (type === 'hero') {
          leaders.heroes.push(leaderData);
        }
      }
    }
  });
  
  // Also check for Commander Requirements
  const commanderReqPattern = /<data name="([A-Za-z0-9]+)_CommanderRequirement"[^>]*>\s*<value>([^<]*)<\/value>/g;
  let reqMatch;
  while ((reqMatch = commanderReqPattern.exec(resxContent)) !== null) {
    const faction = formatFactionName(reqMatch[1]);
    const requirement = reqMatch[2].trim();
    
    if (requirement) {
      const commander = leaders.commanders.find(c => c.faction === faction);
      if (commander) {
        commander.unlockRequirement = requirement;
      }
    }
  }
  
  return leaders;
}

function formatFactionName(name) {
  // Convert from PascalCase to readable format
  const formatted = name
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^The /, 'The ');
  
  // Special cases
  const specialCases = {
    'Sardakk Norr': 'The Clan of Saar',
    'None': null
  };
  
  // Map common faction names
  const factionMap = {
    'SardakkNorr': "The Sardakk N'orr",
    'TheArborec': 'The Arborec',
    'TheArgentFlight': 'The Argent Flight',
    'TheAugursOfIlyxum': 'The Augurs of Ilyxum',
    'TheBaronyOfLetnev': 'The Barony of Letnev',
    'TheBentorConglomerate': 'The Bentor Conglomerate',
    'TheClanOfSaar': 'The Clan of Saar',
    'TheCouncilKeleres': 'The Council Keleres',
    'TheEmbersOfMuaat': 'The Embers of Muaat',
    'TheEmiratesOfHacan': 'The Emirates of Hacan',
    'TheEmpyrean': 'The Empyrean',
    'TheFederationOfSol': 'The Federation of Sol',
    'TheGhostsOfCreuss': 'The Ghosts of Creuss',
    'TheKolleccSociety': 'The Kollecc Society',
    'TheL1z1xMindnet': 'The L1Z1X Mindnet',
    'TheMahactGeneSorcerers': 'The Mahact Gene-Sorcerers',
    'TheMentakCoalition': 'The Mentak Coalition',
    'TheNaaluCollective': 'The Naalu Collective',
    'TheNaazRokhaAlliance': 'The Naaz-Rokha Alliance',
    'TheNekroVirus': 'The Nekro Virus',
    'TheNomad': 'The Nomad',
    'TheTitansOfUl': 'The Titans of Ul',
    'TheUniversitiesOfJolNar': 'The Universities of Jol-Nar',
    'TheVuilRaithCabal': "The Vuil'Raith Cabal",
    'TheWinnu': 'The Winnu',
    'TheXxchaKingdom': 'The Xxcha Kingdom',
    'TheYinBrotherhood': 'The Yin Brotherhood',
    'TheYssarilTribes': 'The Yssaril Tribes',
    'RohDhnaMechatronics': 'Roh Dhna Mechatronics',
    'AtokeredLegacy': 'Atokered Legacy',
    'BelkoseaAlliedStates': 'Belkosea Allied States',
    'None': null
  };
  
  return factionMap[name] || name;
}

// Extract and organize leader data
const leadersData = extractLeaders();

// Create output directory structure
const outputDir = path.join(__dirname, '../../client/src/data/leaders');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create subdirectories
['agents', 'commanders', 'heroes'].forEach(dir => {
  const subDir = path.join(outputDir, dir);
  if (!fs.existsSync(subDir)) {
    fs.mkdirSync(subDir, { recursive: true });
  }
});

// Generate TypeScript files for each leader type
function generateTypeScriptFile(leaders, type, typeName) {
  const interfaceName = `${typeName}Leader`;
  
  let content = `// ${typeName}s - extracted from TwilightImperiumUltimate\n`;
  content += `// Generated: ${new Date().toISOString()}\n\n`;
  
  content += `export interface ${interfaceName} {\n`;
  content += `  name: string;\n`;
  content += `  faction: string;\n`;
  content += `  type: '${typeName}';\n`;
  
  if (type === 'heroes') {
    content += `  ability?: string;\n`;
  }
  
  if (type === 'commanders') {
    content += `  unlockRequirement?: string;\n`;
  }
  
  content += `}\n\n`;
  
  content += `export const ${type}: ${interfaceName}[] = ${JSON.stringify(leaders, null, 2)};\n\n`;
  
  content += `export const get${typeName}ByFaction = (faction: string): ${interfaceName} | undefined => {\n`;
  content += `  return ${type}.find(leader => leader.faction === faction);\n`;
  content += `};\n\n`;
  
  content += `export const get${typeName}ByName = (name: string): ${interfaceName} | undefined => {\n`;
  content += `  return ${type}.find(leader => leader.name === name);\n`;
  content += `};\n`;
  
  fs.writeFileSync(path.join(outputDir, type, 'index.ts'), content);
}

// Generate TypeScript files
generateTypeScriptFile(leadersData.agents, 'agents', 'Agent');
generateTypeScriptFile(leadersData.commanders, 'commanders', 'Commander');
generateTypeScriptFile(leadersData.heroes, 'heroes', 'Hero');

// Generate main index file
let mainIndex = `// Leaders - extracted from TwilightImperiumUltimate\n`;
mainIndex += `// Generated: ${new Date().toISOString()}\n\n`;
mainIndex += `export * from './agents';\n`;
mainIndex += `export * from './commanders';\n`;
mainIndex += `export * from './heroes';\n\n`;

mainIndex += `import { agents } from './agents';\n`;
mainIndex += `import { commanders } from './commanders';\n`;
mainIndex += `import { heroes } from './heroes';\n\n`;

mainIndex += `export interface Leader {\n`;
mainIndex += `  name: string;\n`;
mainIndex += `  faction: string;\n`;
mainIndex += `  type: 'Agent' | 'Commander' | 'Hero';\n`;
mainIndex += `  ability?: string;\n`;
mainIndex += `  unlockRequirement?: string;\n`;
mainIndex += `}\n\n`;

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
mainIndex += `};\n`;

fs.writeFileSync(path.join(outputDir, 'index.ts'), mainIndex);

// Output summary
console.log('Leader extraction complete!');
console.log(`Extracted ${leadersData.agents.length} agents`);
console.log(`Extracted ${leadersData.commanders.length} commanders`);
console.log(`Extracted ${leadersData.heroes.length} heroes`);
console.log(`Total: ${leadersData.agents.length + leadersData.commanders.length + leadersData.heroes.length} leaders`);

// Group by faction for summary
const byFaction = {};
[...leadersData.agents, ...leadersData.commanders, ...leadersData.heroes].forEach(leader => {
  if (leader.faction) {
    if (!byFaction[leader.faction]) {
      byFaction[leader.faction] = { agents: 0, commanders: 0, heroes: 0 };
    }
    byFaction[leader.faction][leader.type.toLowerCase() + 's']++;
  }
});

console.log('\nLeaders by faction:');
Object.entries(byFaction).sort().forEach(([faction, counts]) => {
  console.log(`  ${faction}: ${counts.agents} agents, ${counts.commanders} commanders, ${counts.heroes} heroes`);
});