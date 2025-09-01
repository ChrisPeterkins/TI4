const fs = require('fs');
const path = require('path');

// Source paths
const decksSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/decks');
const outputDir = path.join(__dirname, '../../client/src/data/decks');

// Load and process decks data
function loadDecksData() {
  const allDecks = [];
  
  // Get all JSON files in the decks directory
  const files = fs.readdirSync(decksSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(decksSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      // Handle both array and single object formats
      const decksArray = Array.isArray(data) ? data : [data];
      
      decksArray.forEach(deck => {
        const processedDeck = {
          alias: deck.alias,
          name: deck.name,
          type: deck.type,
          description: deck.description || null,
          
          // Card IDs that make up this deck
          cardIDs: deck.cardIDs || [],
          
          // Additional deck properties
          size: deck.size || (deck.cardIDs ? deck.cardIDs.length : 0),
          
          // Deck composition details
          composition: deck.composition || null,
          
          // Game mode/variant
          gameMode: deck.gameMode || 'standard',
          playerCount: deck.playerCount || null,
          
          // Expansion/variant tracking
          includesExpansion: deck.includesExpansion || [],
          excludesExpansion: deck.excludesExpansion || [],
          
          // Source tracking
          source: deck.source || sourceName,
          
          // Additional metadata
          isOfficial: deck.isOfficial !== false,
          isBalanced: deck.isBalanced || false,
          isTournamentLegal: deck.isTournamentLegal || false,
          
          // Version tracking
          version: deck.version || '1.0',
          lastUpdated: deck.lastUpdated || null,
          
          // Notes
          notes: deck.notes || null,
          
          // Homebrew tracking
          homebrewReplacesID: deck.homebrewReplacesID || null
        };
        
        allDecks.push(processedDeck);
      });
    } catch (error) {
      console.warn('Error reading ' + filename + ':', error.message);
    }
  });
  
  return allDecks;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return \`// Decks - extracted from TI4_map_generator_bot
// Generated: \${new Date().toISOString()}

export interface Deck {
  alias: string;
  name: string;
  type: DeckType;
  description?: string | null;
  
  // Card composition
  cardIDs: string[];
  size: number;
  composition?: DeckComposition | null;
  
  // Game configuration
  gameMode?: string;
  playerCount?: number | null;
  
  // Expansion tracking
  includesExpansion?: string[];
  excludesExpansion?: string[];
  
  // Source tracking
  source: string;
  
  // Metadata
  isOfficial?: boolean;
  isBalanced?: boolean;
  isTournamentLegal?: boolean;
  
  // Version tracking
  version?: string;
  lastUpdated?: string | null;
  
  // Notes
  notes?: string | null;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export interface DeckComposition {
  [cardType: string]: number;
}

export type DeckType = 
  | 'action_card'
  | 'agenda'
  | 'objective'
  | 'secret_objective'
  | 'exploration'
  | 'relic'
  | 'technology'
  | 'promissory'
  | 'strategy'
  | 'mixed';
\`;
}

// Generate main index file
function generateMainIndex(decks) {
  let content = generateTypeScriptInterface();
  
  content += \`

export const decks: Deck[] = \${JSON.stringify(decks, null, 2)};

// Helper functions
export const getDeckByAlias = (alias: string): Deck | undefined => {
  return decks.find(deck => deck.alias === alias);
};

export const getDeckByName = (name: string): Deck | undefined => {
  return decks.find(deck => 
    deck.name.toLowerCase() === name.toLowerCase()
  );
};

export const getDecksByType = (type: DeckType): Deck[] => {
  return decks.filter(deck => deck.type === type);
};

export const getDecksByGameMode = (gameMode: string): Deck[] => {
  return decks.filter(deck => 
    deck.gameMode === gameMode
  );
};

export const getDecksForPlayerCount = (playerCount: number): Deck[] => {
  return decks.filter(deck => 
    !deck.playerCount || deck.playerCount === playerCount
  );
};

export const getOfficialDecks = (): Deck[] => {
  return decks.filter(deck => deck.isOfficial);
};

export const getTournamentLegalDecks = (): Deck[] => {
  return decks.filter(deck => deck.isTournamentLegal);
};

export const getBalancedDecks = (): Deck[] => {
  return decks.filter(deck => deck.isBalanced);
};

// Get decks that include specific expansions
export const getDecksWithExpansion = (expansion: string): Deck[] => {
  return decks.filter(deck => 
    deck.includesExpansion?.includes(expansion)
  );
};

// Get decks that exclude specific expansions
export const getDecksWithoutExpansion = (expansion: string): Deck[] => {
  return decks.filter(deck => 
    deck.excludesExpansion?.includes(expansion) ||
    (!deck.includesExpansion?.includes(expansion) && deck.source === 'base')
  );
};

// Search decks
export const searchDecks = (searchTerm: string): Deck[] => {
  const term = searchTerm.toLowerCase();
  return decks.filter(deck => 
    deck.name.toLowerCase().includes(term) ||
    deck.description?.toLowerCase().includes(term) ||
    deck.alias.toLowerCase().includes(term)
  );
};

// Get all card IDs in a deck
export const getDeckCards = (deckAlias: string): string[] => {
  const deck = getDeckByAlias(deckAlias);
  return deck?.cardIDs || [];
};

// Check if a card is in a deck
export const isCardInDeck = (deckAlias: string, cardId: string): boolean => {
  const deck = getDeckByAlias(deckAlias);
  return deck?.cardIDs.includes(cardId) || false;
};

// Get deck statistics
export const getDeckStats = (deckAlias: string) => {
  const deck = getDeckByAlias(deckAlias);
  if (!deck) return null;
  
  return {
    totalCards: deck.size,
    uniqueCards: new Set(deck.cardIDs).size,
    duplicates: deck.size - new Set(deck.cardIDs).size,
    composition: deck.composition
  };
};

// Group decks by type
export const decksByType = {
  actionCards: decks.filter(d => d.type === 'action_card'),
  agendas: decks.filter(d => d.type === 'agenda'),
  objectives: decks.filter(d => d.type === 'objective'),
  secretObjectives: decks.filter(d => d.type === 'secret_objective'),
  exploration: decks.filter(d => d.type === 'exploration'),
  relics: decks.filter(d => d.type === 'relic'),
  technologies: decks.filter(d => d.type === 'technology'),
  promissory: decks.filter(d => d.type === 'promissory'),
  strategy: decks.filter(d => d.type === 'strategy'),
  mixed: decks.filter(d => d.type === 'mixed')
};

// Combine multiple decks
export const combineDecks = (deckAliases: string[]): string[] => {
  const combinedCards: string[] = [];
  
  deckAliases.forEach(alias => {
    const deck = getDeckByAlias(alias);
    if (deck) {
      combinedCards.push(...deck.cardIDs);
    }
  });
  
  return combinedCards;
};

// Get unique cards from multiple decks
export const getUniqueCardsFromDecks = (deckAliases: string[]): string[] => {
  const allCards = combineDecks(deckAliases);
  return Array.from(new Set(allCards));
};
\`;
  
  return content;
}

// Main execution
function main() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('Loading decks data from TI4_map_generator_bot...');
  const decks = loadDecksData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(decks);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\\n=== Extraction Summary ===');
  console.log(\`Total decks extracted: \${decks.length}\`);
  
  // Type summary
  const typeCounts = {};
  decks.forEach(deck => {
    const type = deck.type;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('\\n=== Decks by Type ===');
  Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(\`\${type}: \${count}\`);
    });
  
  // Source summary
  const sourceCounts = {};
  decks.forEach(deck => {
    const source = deck.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\\n=== Decks by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(\`\${source}: \${count}\`);
    });
  
  // Card count summary
  const totalCards = decks.reduce((sum, deck) => sum + deck.size, 0);
  console.log(\`\\n=== Total Cards Across All Decks ===\`);
  console.log(\`Total: \${totalCards}\`);
  
  console.log('\\n✅ Decks extraction complete!');
  console.log(\`Generated: \${path.join(outputDir, 'index.ts')}\`);
}

// Run the extraction
main();