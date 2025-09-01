const fs = require('fs');
const path = require('path');

// Source paths
const tokensSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/tokens');
const outputDir = path.join(__dirname, '../../client/src/data/tokens');

// Load and process tokens data
function loadTokensData() {
  const allTokens = [];
  
  // Get all JSON files in the tokens directory
  const files = fs.readdirSync(tokensSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(tokensSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(token => {
        const processedToken = {
          id: token.id,
          name: token.name || token.id,
          imagePath: token.imagePath || null,
          
          // Location type
          spaceOrPlanet: token.spaceOrPlanet || 'space',
          
          // Aliases for commands/recognition
          aliasList: token.aliasList || [],
          
          // Token type and properties
          tokenType: token.tokenType || determineTokenType(token),
          
          // Wormhole specific
          wormholes: token.wormholes || [],
          wormholeType: token.wormholeType || null,
          
          // Frontier token specific
          frontierType: token.frontierType || null,
          explorationDeck: token.explorationDeck || null,
          
          // Attachment token specific
          attachmentId: token.attachmentId || null,
          
          // Command token specific
          faction: token.faction || null,
          isCommandToken: token.isCommandToken || false,
          
          // Control token specific
          isControlToken: token.isControlToken || false,
          
          // Source tracking
          source: token.source || sourceName,
          
          // Effects
          effect: token.effect || null,
          permanentEffect: token.permanentEffect || null,
          
          // Additional properties
          isRemovable: token.isRemovable !== false, // Default true
          isPermanent: token.isPermanent || false,
          canStack: token.canStack || false,
          
          // Homebrew tracking
          homebrewReplacesID: token.homebrewReplacesID || null
        };
        
        allTokens.push(processedToken);
      });
    } catch (error) {
      console.warn(`Error reading ${filename}:`, error.message);
    }
  });
  
  return allTokens;
}

// Helper function to determine token type
function determineTokenType(token) {
  if (token.wormholes && token.wormholes.length > 0) return 'wormhole';
  if (token.frontierType) return 'frontier';
  if (token.isCommandToken) return 'command';
  if (token.isControlToken) return 'control';
  if (token.id.includes('custodian')) return 'custodian';
  if (token.id.includes('trade')) return 'trade_good';
  if (token.id.includes('commodity')) return 'commodity';
  if (token.attachmentId) return 'attachment';
  return 'special';
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Tokens - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface Token {
  id: string;
  name: string;
  imagePath?: string | null;
  
  // Location type
  spaceOrPlanet?: string;
  
  // Aliases
  aliasList?: string[];
  
  // Token type
  tokenType?: TokenType;
  
  // Wormhole specific
  wormholes?: string[];
  wormholeType?: string | null;
  
  // Frontier token specific
  frontierType?: string | null;
  explorationDeck?: ExplorationDeck | null;
  
  // Attachment token specific
  attachmentId?: string | null;
  
  // Command/Control token specific
  faction?: string | null;
  isCommandToken?: boolean;
  isControlToken?: boolean;
  
  // Source tracking
  source: string;
  
  // Effects
  effect?: string | null;
  permanentEffect?: string | null;
  
  // Additional properties
  isRemovable?: boolean;
  isPermanent?: boolean;
  canStack?: boolean;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export type TokenType = 
  | 'wormhole'
  | 'frontier'
  | 'command'
  | 'control'
  | 'custodian'
  | 'trade_good'
  | 'commodity'
  | 'attachment'
  | 'special';

export type ExplorationDeck = 
  | 'cultural'
  | 'hazardous'
  | 'industrial'
  | 'frontier';

export type TokenLocation = 
  | 'space'
  | 'planet'
  | 'both';
`;
}

// Generate main index file
function generateMainIndex(tokens) {
  let content = generateTypeScriptInterface();
  
  content += `
export const tokens: Token[] = ${JSON.stringify(tokens, null, 2)};

// Helper functions
export const getTokenById = (id: string): Token | undefined => {
  return tokens.find(token => token.id === id);
};

export const getTokenByAlias = (alias: string): Token | undefined => {
  return tokens.find(token => 
    token.aliasList?.includes(alias)
  );
};

export const getTokensByType = (type: TokenType): Token[] => {
  return tokens.filter(token => token.tokenType === type);
};

export const getTokensByLocation = (location: string): Token[] => {
  return tokens.filter(token => 
    token.spaceOrPlanet === location || token.spaceOrPlanet === 'both'
  );
};

export const getSpaceTokens = (): Token[] => {
  return getTokensByLocation('space');
};

export const getPlanetTokens = (): Token[] => {
  return getTokensByLocation('planet');
};

export const getWormholeTokens = (): Token[] => {
  return tokens.filter(token => 
    token.tokenType === 'wormhole' || 
    (token.wormholes && token.wormholes.length > 0)
  );
};

export const getFrontierTokens = (): Token[] => {
  return tokens.filter(token => 
    token.tokenType === 'frontier' || token.frontierType
  );
};

export const getCommandTokens = (): Token[] => {
  return tokens.filter(token => token.isCommandToken);
};

export const getControlTokens = (): Token[] => {
  return tokens.filter(token => token.isControlToken);
};

export const getTokensByFaction = (faction: string): Token[] => {
  return tokens.filter(token => 
    token.faction?.toLowerCase() === faction.toLowerCase()
  );
};

export const getRemovableTokens = (): Token[] => {
  return tokens.filter(token => token.isRemovable);
};

export const getPermanentTokens = (): Token[] => {
  return tokens.filter(token => token.isPermanent);
};

export const getStackableTokens = (): Token[] => {
  return tokens.filter(token => token.canStack);
};

export const searchTokens = (searchTerm: string): Token[] => {
  const term = searchTerm.toLowerCase();
  return tokens.filter(token => 
    token.name.toLowerCase().includes(term) ||
    token.id.toLowerCase().includes(term) ||
    token.effect?.toLowerCase().includes(term) ||
    token.aliasList?.some(alias => alias.toLowerCase().includes(term))
  );
};

// Get official vs homebrew tokens
export const getOfficialTokens = (): Token[] => {
  return tokens.filter(token => 
    token.source === 'base' || 
    token.source === 'pok'
  );
};

export const getHomebrewTokens = (): Token[] => {
  return tokens.filter(token => 
    token.source !== 'base' && 
    token.source !== 'pok'
  );
};

// Group tokens by category
export const tokensByCategory = {
  wormholes: tokens.filter(t => t.tokenType === 'wormhole'),
  frontier: tokens.filter(t => t.tokenType === 'frontier'),
  command: tokens.filter(t => t.tokenType === 'command'),
  control: tokens.filter(t => t.tokenType === 'control'),
  custodian: tokens.filter(t => t.tokenType === 'custodian'),
  tradeGoods: tokens.filter(t => t.tokenType === 'trade_good'),
  commodities: tokens.filter(t => t.tokenType === 'commodity'),
  attachments: tokens.filter(t => t.tokenType === 'attachment'),
  special: tokens.filter(t => t.tokenType === 'special')
};

// Get tokens for specific exploration deck
export const getTokensForExplorationDeck = (deck: ExplorationDeck): Token[] => {
  return tokens.filter(token => token.explorationDeck === deck);
};

// Check if a token can be placed at a location
export const canPlaceToken = (token: Token, location: TokenLocation): boolean => {
  if (token.spaceOrPlanet === 'both') return true;
  return token.spaceOrPlanet === location;
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
  
  console.log('Loading tokens data from TI4_map_generator_bot...');
  const tokens = loadTokensData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(tokens);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total tokens extracted: ${tokens.length}`);
  
  // Type summary
  const typeCounts = {};
  tokens.forEach(token => {
    const type = token.tokenType || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('\n=== Tokens by Type ===');
  Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
  
  // Location summary
  const locationCounts = {};
  tokens.forEach(token => {
    const location = token.spaceOrPlanet || 'unknown';
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  });
  
  console.log('\n=== Tokens by Location ===');
  Object.entries(locationCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([location, count]) => {
      console.log(`${location}: ${count}`);
    });
  
  // Source summary
  const sourceCounts = {};
  tokens.forEach(token => {
    const source = token.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Tokens by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(`${source}: ${count}`);
    });
  
  console.log('\n✅ Tokens extraction complete!');
  console.log(`Generated: ${path.join(outputDir, 'index.ts')}`);
}

// Run the extraction
main();