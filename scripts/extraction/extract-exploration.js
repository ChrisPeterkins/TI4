const fs = require('fs');
const path = require('path');

// Source paths
const exploresSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/explores');
const outputDir = path.join(__dirname, '../../server/src/data/cards/exploration');

// Load and process exploration data
function loadExplorationData() {
  const allExploration = [];
  
  // Get all JSON files in the explores directory
  const files = fs.readdirSync(exploresSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(exploresSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(card => {
        const processedCard = {
          id: card.id,
          name: card.name,
          type: card.type, // Cultural, Hazardous, Industrial
          
          // Card text and effects
          text: card.text || null,
          resolution: card.resolution || null, // Instant, Attach, etc.
          flavorText: card.flavorText || null,
          
          // Additional properties
          attachTo: card.attachTo || null,
          prerequisites: card.prerequisites || null,
          
          // Effects and modifiers
          resourceModifier: card.resourceModifier || 0,
          influenceModifier: card.influenceModifier || 0,
          
          // Special properties
          isRelic: card.isRelic || false,
          isDmz: card.isDmz || false,
          
          // Attachment specific
          canAttachTo: card.canAttachTo || null,
          attachmentType: card.attachmentType || null,
          
          // Source tracking
          source: card.source || sourceName,
          expansion: card.expansion || sourceName,
          
          // Image
          imageURL: card.imageURL || null,
          
          // Homebrew tracking
          homebrewReplacesID: card.homebrewReplacesID || null
        };
        
        allExploration.push(processedCard);
      });
    } catch (error) {
      console.warn('Error reading ' + filename + ':', error.message);
    }
  });
  
  return allExploration;
}

// Group cards by type
function groupCardsByType(cards) {
  const grouped = {
    cultural: [],
    hazardous: [],
    industrial: [],
    frontier: [],
    other: []
  };
  
  cards.forEach(card => {
    const type = card.type ? card.type.toLowerCase() : 'other';
    if (grouped[type]) {
      grouped[type].push(card);
    } else if (type === 'frontier') {
      grouped.frontier.push(card);
    } else {
      grouped.other.push(card);
    }
  });
  
  return grouped;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Exploration Cards - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface ExplorationCard {
  id: string;
  name: string;
  type: ExplorationType;
  
  // Card text
  text?: string | null;
  resolution?: ResolutionType | null;
  flavorText?: string | null;
  
  // Attachment properties
  attachTo?: string | null;
  prerequisites?: string | null;
  
  // Modifiers
  resourceModifier?: number;
  influenceModifier?: number;
  
  // Special properties
  isRelic?: boolean;
  isDmz?: boolean;
  
  // Attachment specific
  canAttachTo?: string | null;
  attachmentType?: string | null;
  
  // Source tracking
  source: string;
  expansion?: string;
  
  // Image
  imageURL?: string | null;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export type ExplorationType = 
  | 'Cultural'
  | 'Hazardous'
  | 'Industrial'
  | 'Frontier';

export type ResolutionType = 
  | 'Instant'
  | 'Attach'
  | 'Permanent'
  | 'Action'
  | 'Fragment'
  | 'Leader'
  | 'Token';
`;
}

// Generate main index file
function generateMainIndex(cards) {
  const grouped = groupCardsByType(cards);
  let content = generateTypeScriptInterface();
  
  content += '\n\nexport const explorationCards: ExplorationCard[] = ' + JSON.stringify(cards, null, 2) + ';\n\n';
  
  // Add grouped exports
  content += '// Cards grouped by type\n';
  content += 'export const culturalExploration: ExplorationCard[] = ' + JSON.stringify(grouped.cultural, null, 2) + ';\n\n';
  content += 'export const hazardousExploration: ExplorationCard[] = ' + JSON.stringify(grouped.hazardous, null, 2) + ';\n\n';
  content += 'export const industrialExploration: ExplorationCard[] = ' + JSON.stringify(grouped.industrial, null, 2) + ';\n\n';
  
  // Always export frontier even if empty for consistency
  content += 'export const frontierExploration: ExplorationCard[] = ' + JSON.stringify(grouped.frontier, null, 2) + ';\n\n';
  
  content += `// Helper functions
export const getExplorationCardById = (id: string): ExplorationCard | undefined => {
  return explorationCards.find(card => card.id === id);
};

export const getExplorationCardByName = (name: string): ExplorationCard | undefined => {
  return explorationCards.find(card => 
    card.name.toLowerCase() === name.toLowerCase()
  );
};

export const getExplorationCardsByType = (type: ExplorationType): ExplorationCard[] => {
  return explorationCards.filter(card => card.type === type);
};

export const getExplorationCardsByResolution = (resolution: ResolutionType): ExplorationCard[] => {
  return explorationCards.filter(card => card.resolution === resolution);
};

export const getInstantCards = (): ExplorationCard[] => {
  return getExplorationCardsByResolution('Instant');
};

export const getAttachmentCards = (): ExplorationCard[] => {
  return getExplorationCardsByResolution('Attach');
};

export const getRelicFragments = (): ExplorationCard[] => {
  return explorationCards.filter(card => 
    card.name.toLowerCase().includes('relic fragment')
  );
};

export const getDMZCards = (): ExplorationCard[] => {
  return explorationCards.filter(card => 
    card.isDmz || card.name.toLowerCase().includes('demilitarized')
  );
};

export const searchExplorationCards = (searchTerm: string): ExplorationCard[] => {
  const term = searchTerm.toLowerCase();
  return explorationCards.filter(card => 
    card.name.toLowerCase().includes(term) ||
    card.text?.toLowerCase().includes(term) ||
    card.flavorText?.toLowerCase().includes(term)
  );
};

// Get cards by expansion/source
export const getOfficialExplorationCards = (): ExplorationCard[] => {
  return explorationCards.filter(card => 
    card.source === 'pok' || card.source === 'explores'
  );
};

export const getHomebrewExplorationCards = (): ExplorationCard[] => {
  return explorationCards.filter(card => 
    card.source !== 'pok' && card.source !== 'explores'
  );
};

// Count duplicates (cards with same name)
export const getCardCopies = (cardName: string): ExplorationCard[] => {
  return explorationCards.filter(card => 
    card.name.toLowerCase() === cardName.toLowerCase()
  );
};

// Get unique card names
export const getUniqueCardNames = (): string[] => {
  const names = new Set(explorationCards.map(card => card.name));
  return Array.from(names).sort();
};

// Statistics
export const getExplorationStats = () => {
  const stats = {
    total: explorationCards.length,
    cultural: culturalExploration.length,
    hazardous: hazardousExploration.length,
    industrial: industrialExploration.length,
    frontier: frontierExploration.length,
    instant: explorationCards.filter(c => c.resolution === 'Instant').length,
    attach: explorationCards.filter(c => c.resolution === 'Attach').length,
    relicFragments: explorationCards.filter(c => c.name.includes('Relic Fragment')).length
  };
  return stats;
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
  
  console.log('Loading exploration data from TI4_map_generator_bot...');
  const cards = loadExplorationData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(cards);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log('Total exploration cards extracted: ' + cards.length);
  
  // Type summary
  const typeCounts = {};
  cards.forEach(card => {
    const type = card.type || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('\n=== Cards by Type ===');
  Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(type + ': ' + count);
    });
  
  // Resolution summary
  const resolutionCounts = {};
  cards.forEach(card => {
    const resolution = card.resolution || 'none';
    resolutionCounts[resolution] = (resolutionCounts[resolution] || 0) + 1;
  });
  
  console.log('\n=== Cards by Resolution ===');
  Object.entries(resolutionCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([resolution, count]) => {
      console.log(resolution + ': ' + count);
    });
  
  // Source summary
  const sourceCounts = {};
  cards.forEach(card => {
    const source = card.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Cards by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(source + ': ' + count);
    });
  
  // Count unique card names
  const uniqueNames = new Set(cards.map(c => c.name));
  console.log('\nUnique card names: ' + uniqueNames.size);
  console.log('Total copies: ' + cards.length);
  
  console.log('\n✅ Exploration cards extraction complete!');
  console.log('Generated: ' + path.join(outputDir, 'index.ts'));
}

// Run the extraction
main();