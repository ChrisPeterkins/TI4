const fs = require('fs');
const path = require('path');

// Source paths
const agendasSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/agendas');
const outputDir = path.join(__dirname, '../../server/src/data/cards/agenda');

// Load and process agendas data
function loadAgendasData() {
  const allAgendas = [];
  
  // Get all JSON files in the directory
  const files = fs.readdirSync(agendasSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(agendasSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(agenda => {
        const processedAgenda = {
          alias: agenda.alias,
          name: agenda.name,
          type: agenda.type, // Law or Directive
          target: agenda.target || null,
          
          // Text fields
          text1: agenda.text1 || null,
          text2: agenda.text2 || null,
          mapText: agenda.mapText || null,
          
          // For/Against emojis
          forEmoji: agenda.forEmoji || null,
          againstEmoji: agenda.againstEmoji || null,
          
          // Election options
          elect: agenda.elect || null,
          electPrerequisite: agenda.electPrerequisite || null,
          
          // Source tracking
          source: agenda.source || sourceName,
          expansion: agenda.expansion || null,
          
          // Image
          imageURL: agenda.imageURL || null,
          
          // Homebrew tracking
          homebrewReplacesID: agenda.homebrewReplacesID || null
        };
        
        allAgendas.push(processedAgenda);
      });
    } catch (error) {
      console.warn('Error reading ' + filename + ':', error.message);
    }
  });
  
  return allAgendas;
}

// Group by type
function groupByType(agendas) {
  const grouped = {
    law: [],
    directive: []
  };
  
  agendas.forEach(agenda => {
    if (agenda.type === 'Law') {
      grouped.law.push(agenda);
    } else if (agenda.type === 'Directive') {
      grouped.directive.push(agenda);
    }
  });
  
  return grouped;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Agenda Cards - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface AgendaCard {
  alias: string;
  name: string;
  type: AgendaType;
  target?: string | null;
  
  // Text fields
  text1?: string | null;
  text2?: string | null;
  mapText?: string | null;
  
  // For/Against emojis
  forEmoji?: string | null;
  againstEmoji?: string | null;
  
  // Election options
  elect?: string | null;
  electPrerequisite?: string | null;
  
  // Source tracking
  source: string;
  expansion?: string | null;
  
  // Image
  imageURL?: string | null;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export type AgendaType = 'Law' | 'Directive' | 'Agenda Phase';

export type VoteTarget = 
  | 'For/Against'
  | 'Elect Player'
  | 'Elect Planet'
  | 'Elect Cultural Planet'
  | 'Elect Hazardous Planet'
  | 'Elect Industrial Planet'
  | 'Elect Non-Home Planet Other Than Mecatol Rex'
  | 'Elect Scored Secret Objective'
  | 'Elect Law'
  | 'Elect Player With Most Victory Points'
  | 'Elect Player With Least Victory Points';
`;
}

// Generate main index file
function generateMainIndex(agendas) {
  const grouped = groupByType(agendas);
  
  let content = generateTypeScriptInterface();
  
  content += '\n\nexport const agendaCards: AgendaCard[] = ' + JSON.stringify(agendas, null, 2) + ';\n\n';
  
  // Export grouped agendas
  content += '// Law agendas\n';
  content += 'export const lawAgendas: AgendaCard[] = ' + JSON.stringify(grouped.law, null, 2) + ';\n\n';
  
  content += '// Directive agendas\n';
  content += 'export const directiveAgendas: AgendaCard[] = ' + JSON.stringify(grouped.directive, null, 2) + ';\n\n';
  
  content += `// Helper functions
export const getAgendaByAlias = (alias: string): AgendaCard | undefined => {
  return agendaCards.find(agenda => agenda.alias === alias);
};

export const getAgendaByName = (name: string): AgendaCard | undefined => {
  return agendaCards.find(agenda => 
    agenda.name.toLowerCase() === name.toLowerCase()
  );
};

export const getAgendaByType = (type: AgendaType): AgendaCard[] => {
  return agendaCards.filter(agenda => agenda.type === type);
};

export const getAgendasByTarget = (target: string): AgendaCard[] => {
  return agendaCards.filter(agenda => 
    agenda.target?.toLowerCase().includes(target.toLowerCase())
  );
};

// Get For/Against agendas
export const getForAgainstAgendas = (): AgendaCard[] => {
  return agendaCards.filter(agenda => 
    agenda.target === 'For/Against'
  );
};

// Get Elect Player agendas
export const getElectPlayerAgendas = (): AgendaCard[] => {
  return agendaCards.filter(agenda => 
    agenda.target?.includes('Elect Player')
  );
};

// Get Elect Planet agendas
export const getElectPlanetAgendas = (): AgendaCard[] => {
  return agendaCards.filter(agenda => 
    agenda.target?.includes('Elect') && agenda.target?.includes('Planet')
  );
};

// Search agendas
export const searchAgendaCards = (searchTerm: string): AgendaCard[] => {
  const term = searchTerm.toLowerCase();
  return agendaCards.filter(agenda => 
    agenda.name.toLowerCase().includes(term) ||
    (agenda.text1 && agenda.text1.toLowerCase().includes(term)) ||
    (agenda.text2 && agenda.text2.toLowerCase().includes(term))
  );
};

// Get agendas by source
export const getOfficialAgendas = (): AgendaCard[] => {
  return agendaCards.filter(agenda => 
    agenda.source === 'base' || 
    agenda.source === 'pok' ||
    agenda.source === 'codex1' ||
    agenda.source === 'codex2' ||
    agenda.source === 'codex3'
  );
};

export const getHomebrewAgendas = (): AgendaCard[] => {
  return agendaCards.filter(agenda => 
    agenda.source !== 'base' && 
    agenda.source !== 'pok' &&
    agenda.source !== 'codex1' &&
    agenda.source !== 'codex2' &&
    agenda.source !== 'codex3'
  );
};

// Statistics
export const getAgendaStats = () => {
  return {
    total: agendaCards.length,
    laws: lawAgendas.length,
    directives: directiveAgendas.length,
    forAgainst: getForAgainstAgendas().length,
    electPlayer: getElectPlayerAgendas().length,
    electPlanet: getElectPlanetAgendas().length
  };
};

// Check if agenda affects specific game element
export const agendaAffects = (agenda: AgendaCard, element: string): boolean => {
  const text = ((agenda.text1 || '') + ' ' + (agenda.text2 || '') + ' ' + (agenda.mapText || '')).toLowerCase();
  return text.includes(element.toLowerCase());
};

// Get agendas that mention specific keywords
export const getAgendasWithKeyword = (keyword: string): AgendaCard[] => {
  const keywordLower = keyword.toLowerCase();
  return agendaCards.filter(agenda => 
    agendaAffects(agenda, keywordLower)
  );
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
  
  console.log('Loading agendas data from TI4_map_generator_bot...');
  const agendas = loadAgendasData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(agendas);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log('Total agendas extracted: ' + agendas.length);
  
  // Type breakdown
  const typeCounts = {};
  agendas.forEach(agenda => {
    const type = agenda.type;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('\n=== Agendas by Type ===');
  Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(type + ': ' + count);
    });
  
  // Target breakdown
  const targetCounts = {};
  agendas.forEach(agenda => {
    if (agenda.target) {
      const target = agenda.target.split('(')[0].trim();
      targetCounts[target] = (targetCounts[target] || 0) + 1;
    }
  });
  
  console.log('\n=== Agendas by Target ===');
  Object.entries(targetCounts)
    .sort(([a], [b]) => b - a)
    .slice(0, 10)
    .forEach(([target, count]) => {
      console.log(target + ': ' + count);
    });
  
  // Source breakdown
  const sourceCounts = {};
  agendas.forEach(agenda => {
    const source = agenda.source;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Agendas by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(source + ': ' + count);
    });
  
  console.log('\n✅ Agendas extraction complete!');
  console.log('Generated: ' + path.join(outputDir, 'index.ts'));
}

// Run the extraction
main();