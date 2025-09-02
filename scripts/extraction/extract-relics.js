const fs = require('fs');
const path = require('path');

// Source paths
const relicsSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/relics');
const outputDir = path.join(__dirname, '../../server/src/data/cards/relic');

// Load and process relics data
function loadRelicsData() {
  const allRelics = [];
  
  // Get all JSON files in the directory
  const files = fs.readdirSync(relicsSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(relicsSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(relic => {
        const processedRelic = {
          alias: relic.alias,
          name: relic.name,
          text: relic.text,
          
          // Flavor text
          flavourText: relic.flavourText || relic.flavorText || null,
          
          // Properties
          isPurgeable: relic.text.includes('purge this card') || false,
          isExhaustable: relic.text.includes('exhaust this card') || false,
          isPermanent: !relic.text.includes('purge') && !relic.text.includes('exhaust'),
          
          // Victory points
          givesVictoryPoints: relic.text.includes('victory point') || false,
          
          // Source tracking
          source: relic.source || sourceName,
          expansion: relic.expansion || null,
          
          // Image
          imageURL: relic.imageURL || null,
          
          // Homebrew tracking
          homebrewReplacesID: relic.homebrewReplacesID || null
        };
        
        allRelics.push(processedRelic);
      });
    } catch (error) {
      console.warn('Error reading ' + filename + ':', error.message);
    }
  });
  
  return allRelics;
}

// Group by usage type
function groupByUsage(relics) {
  const grouped = {
    purgeable: [],
    exhaustable: [],
    permanent: [],
    victoryPoint: []
  };
  
  relics.forEach(relic => {
    if (relic.isPurgeable) {
      grouped.purgeable.push(relic);
    }
    if (relic.isExhaustable) {
      grouped.exhaustable.push(relic);
    }
    if (relic.isPermanent) {
      grouped.permanent.push(relic);
    }
    if (relic.givesVictoryPoints) {
      grouped.victoryPoint.push(relic);
    }
  });
  
  return grouped;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Relic Cards - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface RelicCard {
  alias: string;
  name: string;
  text: string;
  
  // Flavor text
  flavourText?: string | null;
  
  // Properties
  isPurgeable?: boolean;
  isExhaustable?: boolean;
  isPermanent?: boolean;
  
  // Victory points
  givesVictoryPoints?: boolean;
  
  // Source tracking
  source: string;
  expansion?: string | null;
  
  // Image
  imageURL?: string | null;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}
`;
}

// Generate main index file
function generateMainIndex(relics) {
  const grouped = groupByUsage(relics);
  
  let content = generateTypeScriptInterface();
  
  content += '\n\nexport const relicCards: RelicCard[] = ' + JSON.stringify(relics, null, 2) + ';\n\n';
  
  // Export grouped relics
  content += '// Purgeable relics\n';
  content += 'export const purgeableRelics: RelicCard[] = ' + JSON.stringify(grouped.purgeable, null, 2) + ';\n\n';
  
  content += '// Exhaustable relics\n';
  content += 'export const exhaustableRelics: RelicCard[] = ' + JSON.stringify(grouped.exhaustable, null, 2) + ';\n\n';
  
  content += '// Permanent relics\n';
  content += 'export const permanentRelics: RelicCard[] = ' + JSON.stringify(grouped.permanent, null, 2) + ';\n\n';
  
  content += '// Victory point relics\n';
  content += 'export const victoryPointRelics: RelicCard[] = ' + JSON.stringify(grouped.victoryPoint, null, 2) + ';\n\n';
  
  content += `// Helper functions
export const getRelicByAlias = (alias: string): RelicCard | undefined => {
  return relicCards.find(relic => relic.alias === alias);
};

export const getRelicByName = (name: string): RelicCard | undefined => {
  return relicCards.find(relic => 
    relic.name.toLowerCase() === name.toLowerCase()
  );
};

export const getPurgeableRelics = (): RelicCard[] => {
  return relicCards.filter(relic => relic.isPurgeable);
};

export const getExhaustableRelics = (): RelicCard[] => {
  return relicCards.filter(relic => relic.isExhaustable);
};

export const getPermanentRelics = (): RelicCard[] => {
  return relicCards.filter(relic => relic.isPermanent);
};

export const getVictoryPointRelics = (): RelicCard[] => {
  return relicCards.filter(relic => relic.givesVictoryPoints);
};

// Search relics
export const searchRelicCards = (searchTerm: string): RelicCard[] => {
  const term = searchTerm.toLowerCase();
  return relicCards.filter(relic => 
    relic.name.toLowerCase().includes(term) ||
    relic.text.toLowerCase().includes(term) ||
    (relic.flavourText && relic.flavourText.toLowerCase().includes(term))
  );
};

// Get relics by source
export const getOfficialRelics = (): RelicCard[] => {
  return relicCards.filter(relic => 
    relic.source === 'pok' ||
    relic.source === 'codexii' ||
    relic.source === 'codexiv'
  );
};

export const getHomebrewRelics = (): RelicCard[] => {
  return relicCards.filter(relic => 
    relic.source !== 'pok' &&
    relic.source !== 'codexii' &&
    relic.source !== 'codexiv'
  );
};

// Get relics that affect specific timing
export const getRelicsForPhase = (phase: string): RelicCard[] => {
  const phaseLower = phase.toLowerCase();
  return relicCards.filter(relic => 
    relic.text.toLowerCase().includes(phaseLower)
  );
};

// Statistics
export const getRelicStats = () => {
  const sourceCounts = {};
  relicCards.forEach(relic => {
    const source = relic.source;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  return {
    total: relicCards.length,
    purgeable: purgeableRelics.length,
    exhaustable: exhaustableRelics.length,
    permanent: permanentRelics.length,
    victoryPoint: victoryPointRelics.length,
    bySource: sourceCounts
  };
};

// Check if relic affects specific game element
export const relicAffects = (relic: RelicCard, element: string): boolean => {
  const text = relic.text.toLowerCase();
  return text.includes(element.toLowerCase());
};

// Get relics that mention specific keywords
export const getRelicsWithKeyword = (keyword: string): RelicCard[] => {
  const keywordLower = keyword.toLowerCase();
  return relicCards.filter(relic => 
    relicAffects(relic, keywordLower)
  );
};

// Get relics by timing window
export const getRelicsWithTiming = (timing: string): RelicCard[] => {
  const timingLower = timing.toLowerCase();
  return relicCards.filter(relic => {
    const text = relic.text.toLowerCase();
    return text.includes('at the start of') && text.includes(timingLower) ||
           text.includes('at the end of') && text.includes(timingLower) ||
           text.includes('during') && text.includes(timingLower) ||
           text.includes('before') && text.includes(timingLower) ||
           text.includes('after') && text.includes(timingLower) ||
           text.includes('when') && text.includes(timingLower);
  });
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
  
  console.log('Loading relics data from TI4_map_generator_bot...');
  const relics = loadRelicsData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(relics);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log('Total relics extracted: ' + relics.length);
  
  // Usage breakdown
  const purgeableCount = relics.filter(r => r.isPurgeable).length;
  const exhaustableCount = relics.filter(r => r.isExhaustable).length;
  const permanentCount = relics.filter(r => r.isPermanent).length;
  const vpCount = relics.filter(r => r.givesVictoryPoints).length;
  
  console.log('\n=== Relics by Usage ===');
  console.log('Purgeable: ' + purgeableCount);
  console.log('Exhaustable: ' + exhaustableCount);
  console.log('Permanent: ' + permanentCount);
  console.log('Victory Point: ' + vpCount);
  
  // Source breakdown
  const sourceCounts = {};
  relics.forEach(relic => {
    const source = relic.source;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Relics by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(source + ': ' + count);
    });
  
  console.log('\n✅ Relics extraction complete!');
  console.log('Generated: ' + path.join(outputDir, 'index.ts'));
}

// Run the extraction
main();