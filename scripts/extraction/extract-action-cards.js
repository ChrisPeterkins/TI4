const fs = require('fs');
const path = require('path');

// Source paths
const actionCardsSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/action_cards');
const outputDir = path.join(__dirname, '../../server/src/data/cards/action');

// Load and process action cards data
function loadActionCardsData() {
  const allActionCards = [];
  
  // Get all JSON files in the directory
  const files = fs.readdirSync(actionCardsSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(actionCardsSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(card => {
        const processedCard = {
          alias: card.alias,
          name: card.name,
          phase: card.phase || null,
          window: card.window || null,
          text: card.text,
          
          // Automation
          automationID: card.automationID || null,
          
          // Flavor
          flavorText: card.flavorText || null,
          
          // Card properties
          isSabotage: card.isSabotage || card.name.includes('Sabotage'),
          isComponentAction: card.isComponentAction || false,
          
          // Timing and restrictions
          timing: card.timing || null,
          prerequisite: card.prerequisite || null,
          
          // Source tracking
          source: card.source || sourceName,
          expansion: card.expansion || null,
          
          // Image
          imageURL: card.imageURL || null,
          
          // Homebrew tracking
          homebrewReplacesID: card.homebrewReplacesID || null
        };
        
        allActionCards.push(processedCard);
      });
    } catch (error) {
      console.warn('Error reading ' + filename + ':', error.message);
    }
  });
  
  return allActionCards;
}

// Group cards by type
function groupCardsByType(cards) {
  const grouped = {
    sabotage: [],
    agenda: [],
    tactical: [],
    strategic: [],
    status: [],
    combat: [],
    other: []
  };
  
  cards.forEach(card => {
    if (card.isSabotage || card.name.toLowerCase().includes('sabotage')) {
      grouped.sabotage.push(card);
    } else if (card.phase === 'Agenda') {
      grouped.agenda.push(card);
    } else if (card.phase === 'Tactical' || card.window?.toLowerCase().includes('tactical')) {
      grouped.tactical.push(card);
    } else if (card.phase === 'Strategy') {
      grouped.strategic.push(card);
    } else if (card.phase === 'Status') {
      grouped.status.push(card);
    } else if (card.window?.toLowerCase().includes('combat')) {
      grouped.combat.push(card);
    } else {
      grouped.other.push(card);
    }
  });
  
  return grouped;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Action Cards - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface ActionCard {
  alias: string;
  name: string;
  phase?: string | null;
  window?: string | null;
  text: string;
  
  // Automation
  automationID?: string | null;
  
  // Flavor
  flavorText?: string | null;
  
  // Card properties
  isSabotage?: boolean;
  isComponentAction?: boolean;
  
  // Timing and restrictions
  timing?: string | null;
  prerequisite?: string | null;
  
  // Source tracking
  source: string;
  expansion?: string | null;
  
  // Image
  imageURL?: string | null;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export type ActionCardPhase = 
  | 'Agenda'
  | 'Tactical'
  | 'Strategy'
  | 'Status'
  | 'Action'
  | 'Combat';
`;
}

// Generate main index file
function generateMainIndex(cards) {
  const grouped = groupCardsByType(cards);
  
  let content = generateTypeScriptInterface();
  
  content += '\n\nexport const actionCards: ActionCard[] = ' + JSON.stringify(cards, null, 2) + ';\n\n';
  
  // Export grouped cards
  content += '// Sabotage cards\n';
  content += 'export const sabotageCards: ActionCard[] = ' + JSON.stringify(grouped.sabotage, null, 2) + ';\n\n';
  
  content += '// Agenda phase action cards\n';
  content += 'export const agendaActionCards: ActionCard[] = ' + JSON.stringify(grouped.agenda, null, 2) + ';\n\n';
  
  content += '// Combat action cards\n';
  content += 'export const combatActionCards: ActionCard[] = ' + JSON.stringify(grouped.combat, null, 2) + ';\n\n';
  
  content += `// Helper functions
export const getActionCardByAlias = (alias: string): ActionCard | undefined => {
  return actionCards.find(card => card.alias === alias);
};

export const getActionCardByName = (name: string): ActionCard | undefined => {
  return actionCards.find(card => 
    card.name.toLowerCase() === name.toLowerCase()
  );
};

export const getActionCardsByPhase = (phase: string): ActionCard[] => {
  return actionCards.filter(card => card.phase === phase);
};

export const getActionCardsByWindow = (window: string): ActionCard[] => {
  return actionCards.filter(card => 
    card.window?.toLowerCase().includes(window.toLowerCase())
  );
};

export const getSabotageCards = (): ActionCard[] => {
  return actionCards.filter(card => 
    card.isSabotage || card.name.toLowerCase().includes('sabotage')
  );
};

export const getComponentActionCards = (): ActionCard[] => {
  return actionCards.filter(card => card.isComponentAction);
};

// Search action cards
export const searchActionCards = (searchTerm: string): ActionCard[] => {
  const term = searchTerm.toLowerCase();
  return actionCards.filter(card => 
    card.name.toLowerCase().includes(term) ||
    card.text.toLowerCase().includes(term) ||
    card.flavorText?.toLowerCase().includes(term)
  );
};

// Get action cards by source
export const getOfficialActionCards = (): ActionCard[] => {
  return actionCards.filter(card => 
    card.source === 'base' || 
    card.source === 'pok' ||
    card.source === 'action_cards'
  );
};

export const getHomebrewActionCards = (): ActionCard[] => {
  return actionCards.filter(card => 
    card.source !== 'base' && 
    card.source !== 'pok' &&
    card.source !== 'action_cards'
  );
};

// Get cards playable at specific timing
export const getPlayableCards = (phase: string, window?: string): ActionCard[] => {
  return actionCards.filter(card => {
    const phaseMatch = !card.phase || card.phase === phase;
    const windowMatch = !window || !card.window || 
      card.window.toLowerCase().includes(window.toLowerCase());
    return phaseMatch && windowMatch;
  });
};

// Count card copies
export const getCardCopies = (cardName: string): ActionCard[] => {
  return actionCards.filter(card => 
    card.name.toLowerCase() === cardName.toLowerCase()
  );
};

// Get unique card names
export const getUniqueCardNames = (): string[] => {
  const names = new Set(actionCards.map(card => card.name));
  return Array.from(names).sort();
};

// Statistics
export const getActionCardStats = () => {
  const phaseCounts = {};
  actionCards.forEach(card => {
    const phase = card.phase || 'Any';
    phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
  });
  
  const uniqueNames = getUniqueCardNames();
  
  return {
    total: actionCards.length,
    unique: uniqueNames.length,
    sabotage: sabotageCards.length,
    agenda: agendaActionCards.length,
    combat: combatActionCards.length,
    byPhase: phaseCounts
  };
};

// Check if card affects specific game element
export const cardAffects = (card: ActionCard, element: string): boolean => {
  const text = (card.text + ' ' + (card.window || '')).toLowerCase();
  return text.includes(element.toLowerCase());
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
  
  console.log('Loading action cards data from TI4_map_generator_bot...');
  const cards = loadActionCardsData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(cards);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log('Total action cards extracted: ' + cards.length);
  
  // Get unique card names
  const uniqueNames = new Set(cards.map(c => c.name));
  console.log('Unique card names: ' + uniqueNames.size);
  
  // Phase breakdown
  const phaseCounts = {};
  cards.forEach(card => {
    const phase = card.phase || 'Any';
    phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
  });
  
  console.log('\n=== Action Cards by Phase ===');
  Object.entries(phaseCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([phase, count]) => {
      console.log(phase + ': ' + count);
    });
  
  // Special cards
  const sabotageCount = cards.filter(c => c.name.toLowerCase().includes('sabotage')).length;
  console.log('\n=== Special Card Types ===');
  console.log('Sabotage cards: ' + sabotageCount);
  
  // Source breakdown
  const sourceCounts = {};
  cards.forEach(card => {
    const source = card.source;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Action Cards by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(source + ': ' + count);
    });
  
  console.log('\n✅ Action cards extraction complete!');
  console.log('Generated: ' + path.join(outputDir, 'index.ts'));
}

// Run the extraction
main();