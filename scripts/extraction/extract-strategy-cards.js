const fs = require('fs');
const path = require('path');

// Source paths
const strategyCardsSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/strategy_cards');
const outputDir = path.join(__dirname, '../../client/src/data/cards/strategy');

// Load and process strategy cards data
function loadStrategyCardsData() {
  const allStrategyCards = [];
  
  // Get all JSON files in the directory
  const files = fs.readdirSync(strategyCardsSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(strategyCardsSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(card => {
        const processedCard = {
          id: card.id,
          name: card.name,
          initiative: card.initiative,
          
          // Primary and secondary abilities
          primaryTexts: card.primaryTexts || [],
          secondaryTexts: card.secondaryTexts || [],
          
          // Visual properties
          colourHexCode: card.colourHexCode || null,
          imageFileName: card.imageFileName || null,
          
          // Source tracking
          source: card.source || sourceName,
          expansion: card.expansion || null,
          
          // Image
          imageURL: card.imageURL || null,
          
          // Set information
          cardSet: extractCardSet(card.id) || sourceName,
          
          // Homebrew tracking
          homebrewReplacesID: card.homebrewReplacesID || null
        };
        
        allStrategyCards.push(processedCard);
      });
    } catch (error) {
      console.warn('Error reading ' + filename + ':', error.message);
    }
  });
  
  return allStrategyCards;
}

// Extract card set from ID (e.g., "pok1leadership" -> "pok")
function extractCardSet(id) {
  if (!id) return null;
  
  // Common patterns
  if (id.startsWith('pok')) return 'pok';
  if (id.startsWith('base')) return 'base';
  if (id.startsWith('codex')) return 'codex';
  if (id.startsWith('absol')) return 'absol';
  if (id.startsWith('discordant')) return 'discordant';
  
  // Extract set name before the number
  const match = id.match(/^([a-z]+)\d/i);
  return match ? match[1] : null;
}

// Group by initiative
function groupByInitiative(cards) {
  const grouped = {};
  
  cards.forEach(card => {
    const init = card.initiative;
    if (!grouped[init]) {
      grouped[init] = [];
    }
    grouped[init].push(card);
  });
  
  return grouped;
}

// Group by card set
function groupBySet(cards) {
  const grouped = {};
  
  cards.forEach(card => {
    const set = card.cardSet || 'unknown';
    if (!grouped[set]) {
      grouped[set] = [];
    }
    grouped[set].push(card);
  });
  
  return grouped;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Strategy Cards - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface StrategyCard {
  id: string;
  name: string;
  initiative: number;
  
  // Primary and secondary abilities
  primaryTexts: string[];
  secondaryTexts: string[];
  
  // Visual properties
  colourHexCode?: string | null;
  imageFileName?: string | null;
  
  // Source tracking
  source: string;
  expansion?: string | null;
  
  // Image
  imageURL?: string | null;
  
  // Set information
  cardSet?: string | null;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export type StrategyCardName = 
  | 'Leadership'
  | 'Diplomacy'
  | 'Politics'
  | 'Construction'
  | 'Trade'
  | 'Warfare'
  | 'Technology'
  | 'Imperial';
`;
}

// Generate main index file
function generateMainIndex(cards) {
  const byInitiative = groupByInitiative(cards);
  const bySet = groupBySet(cards);
  
  let content = generateTypeScriptInterface();
  
  content += '\n\nexport const strategyCards: StrategyCard[] = ' + JSON.stringify(cards, null, 2) + ';\n\n';
  
  // Export by initiative
  Object.keys(byInitiative).sort((a, b) => Number(a) - Number(b)).forEach(init => {
    content += `// Initiative ${init} strategy cards\n`;
    content += `export const initiative${init}Cards: StrategyCard[] = ` + JSON.stringify(byInitiative[init], null, 2) + ';\n\n';
  });
  
  // Export official sets
  content += '// Base game strategy cards\n';
  content += 'export const baseStrategyCards: StrategyCard[] = ' + 
    JSON.stringify(cards.filter(c => c.cardSet === 'base' || c.source === 'base'), null, 2) + ';\n\n';
  
  content += '// PoK strategy cards\n';
  content += 'export const pokStrategyCards: StrategyCard[] = ' + 
    JSON.stringify(cards.filter(c => c.cardSet === 'pok' || c.source === 'pok'), null, 2) + ';\n\n';
  
  content += `// Helper functions
export const getStrategyCardById = (id: string): StrategyCard | undefined => {
  return strategyCards.find(card => card.id === id);
};

export const getStrategyCardByName = (name: string): StrategyCard | undefined => {
  return strategyCards.find(card => 
    card.name.toLowerCase() === name.toLowerCase()
  );
};

export const getStrategyCardsByInitiative = (initiative: number): StrategyCard[] => {
  return strategyCards.filter(card => card.initiative === initiative);
};

export const getStrategyCardsBySet = (set: string): StrategyCard[] => {
  return strategyCards.filter(card => 
    card.cardSet === set || card.source === set
  );
};

// Get all variations of a card by name
export const getCardVariations = (cardName: string): StrategyCard[] => {
  return strategyCards.filter(card => 
    card.name.toLowerCase() === cardName.toLowerCase()
  );
};

// Search strategy cards
export const searchStrategyCards = (searchTerm: string): StrategyCard[] => {
  const term = searchTerm.toLowerCase();
  return strategyCards.filter(card => 
    card.name.toLowerCase().includes(term) ||
    card.primaryTexts.some(text => text.toLowerCase().includes(term)) ||
    card.secondaryTexts.some(text => text.toLowerCase().includes(term))
  );
};

// Get strategy cards by source
export const getOfficialStrategyCards = (): StrategyCard[] => {
  return strategyCards.filter(card => 
    card.source === 'base' || 
    card.source === 'pok' ||
    card.source === 'codex1' ||
    card.source === 'codex2' ||
    card.source === 'codex3'
  );
};

export const getHomebrewStrategyCards = (): StrategyCard[] => {
  return strategyCards.filter(card => 
    card.source !== 'base' && 
    card.source !== 'pok' &&
    card.source !== 'codex1' &&
    card.source !== 'codex2' &&
    card.source !== 'codex3'
  );
};

// Get unique card names
export const getUniqueStrategyCardNames = (): string[] => {
  const names = new Set(strategyCards.map(card => card.name));
  return Array.from(names).sort();
};

// Get card sets
export const getCardSets = (): string[] => {
  const sets = new Set(strategyCards.map(card => card.cardSet || card.source).filter(Boolean));
  return Array.from(sets).sort();
};

// Statistics
export const getStrategyCardStats = () => {
  const nameCounts = {};
  const setCounts = {};
  const initiativeCounts = {};
  
  strategyCards.forEach(card => {
    // Count by name
    nameCounts[card.name] = (nameCounts[card.name] || 0) + 1;
    
    // Count by set
    const set = card.cardSet || card.source;
    setCounts[set] = (setCounts[set] || 0) + 1;
    
    // Count by initiative
    initiativeCounts[card.initiative] = (initiativeCounts[card.initiative] || 0) + 1;
  });
  
  return {
    total: strategyCards.length,
    uniqueNames: Object.keys(nameCounts).length,
    sets: Object.keys(setCounts).length,
    byName: nameCounts,
    bySet: setCounts,
    byInitiative: initiativeCounts
  };
};

// Check if card provides specific ability
export const cardProvidesAbility = (card: StrategyCard, ability: string): boolean => {
  const abilityLower = ability.toLowerCase();
  const primaryText = card.primaryTexts.join(' ').toLowerCase();
  const secondaryText = card.secondaryTexts.join(' ').toLowerCase();
  return primaryText.includes(abilityLower) || secondaryText.includes(abilityLower);
};

// Get cards that provide command tokens
export const getCommandTokenCards = (): StrategyCard[] => {
  return strategyCards.filter(card => 
    cardProvidesAbility(card, 'command token')
  );
};

// Get cards that provide trade goods
export const getTradeGoodCards = (): StrategyCard[] => {
  return strategyCards.filter(card => 
    cardProvidesAbility(card, 'trade good')
  );
};

// Get cards that allow technology research
export const getTechnologyCards = (): StrategyCard[] => {
  return strategyCards.filter(card => 
    cardProvidesAbility(card, 'research') || cardProvidesAbility(card, 'technology')
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
  
  console.log('Loading strategy cards data from TI4_map_generator_bot...');
  const cards = loadStrategyCardsData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(cards);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log('Total strategy cards extracted: ' + cards.length);
  
  // Get unique names
  const uniqueNames = new Set(cards.map(c => c.name));
  console.log('Unique card names: ' + uniqueNames.size);
  
  // Initiative breakdown
  const initiativeCounts = {};
  cards.forEach(card => {
    const init = card.initiative;
    initiativeCounts[init] = (initiativeCounts[init] || 0) + 1;
  });
  
  console.log('\n=== Strategy Cards by Initiative ===');
  Object.entries(initiativeCounts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .forEach(([init, count]) => {
      console.log('Initiative ' + init + ': ' + count);
    });
  
  // Set breakdown
  const setCounts = {};
  cards.forEach(card => {
    const set = card.cardSet || card.source;
    setCounts[set] = (setCounts[set] || 0) + 1;
  });
  
  console.log('\n=== Strategy Cards by Set ===');
  Object.entries(setCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([set, count]) => {
      console.log(set + ': ' + count);
    });
  
  console.log('\n✅ Strategy cards extraction complete!');
  console.log('Generated: ' + path.join(outputDir, 'index.ts'));
}

// Run the extraction
main();