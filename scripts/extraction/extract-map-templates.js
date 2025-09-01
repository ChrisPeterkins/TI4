const fs = require('fs');
const path = require('path');

// Source paths
const mapTemplatesSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/map_templates');
const outputDir = path.join(__dirname, '../../client/src/data/map-templates');

// Load and process map templates data
function loadMapTemplatesData() {
  const allTemplates = [];
  
  // Get all JSON files in the map_templates directory
  const files = fs.readdirSync(mapTemplatesSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(mapTemplatesSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      // Handle both array and single object formats
      const templatesArray = Array.isArray(data) ? data : [data];
      
      templatesArray.forEach(template => {
        const processedTemplate = {
          id: template.id || sourceName,
          name: template.name || sourceName,
          description: template.description || null,
          
          // Player configuration
          playerCount: template.playerCount || template.players || null,
          minPlayers: template.minPlayers || null,
          maxPlayers: template.maxPlayers || null,
          
          // Map layout
          mapString: template.mapString || null,
          tileLayout: template.tileLayout || [],
          hexLayout: template.hexLayout || [],
          
          // Starting positions
          homePositions: template.homePositions || [],
          startingPositions: template.startingPositions || [],
          
          // Tile specifications
          blueTiles: template.blueTiles || [],
          redTiles: template.redTiles || [],
          greenTiles: template.greenTiles || [],
          
          // Special tiles
          mecatolRexPosition: template.mecatolRexPosition || null,
          wormholeTiles: template.wormholeTiles || [],
          anomalyTiles: template.anomalyTiles || [],
          
          // Hyperlanes (PoK)
          hyperlanes: template.hyperlanes || [],
          hasHyperlanes: template.hasHyperlanes || false,
          
          // Map settings
          isSymmetrical: template.isSymmetrical || false,
          isBalanced: template.isBalanced || false,
          
          // Tournament/competitive settings
          isTournamentLegal: template.isTournamentLegal || false,
          tournamentName: template.tournamentName || null,
          
          // Map type
          mapType: template.mapType || determineMapType(template),
          mapStyle: template.mapStyle || 'standard',
          
          // Source tracking
          source: template.source || sourceName,
          author: template.author || null,
          version: template.version || '1.0',
          
          // Additional properties
          notes: template.notes || null,
          tags: template.tags || [],
          
          // Homebrew tracking
          isOfficial: template.isOfficial || false,
          homebrewReplacesID: template.homebrewReplacesID || null
        };
        
        allTemplates.push(processedTemplate);
      });
    } catch (error) {
      console.warn(`Error reading ${filename}:`, error.message);
    }
  });
  
  return allTemplates;
}

// Helper function to determine map type
function determineMapType(template) {
  const playerCount = template.playerCount || template.players;
  if (playerCount === 1) return 'solo';
  if (playerCount === 2) return 'duel';
  if (playerCount >= 3 && playerCount <= 4) return 'small';
  if (playerCount >= 5 && playerCount <= 6) return 'standard';
  if (playerCount >= 7 && playerCount <= 8) return 'large';
  if (playerCount > 8) return 'epic';
  return 'custom';
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Map Templates - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface MapTemplate {
  id: string;
  name: string;
  description?: string | null;
  
  // Player configuration
  playerCount?: number | null;
  minPlayers?: number | null;
  maxPlayers?: number | null;
  
  // Map layout
  mapString?: string | null;
  tileLayout?: string[];
  hexLayout?: HexPosition[];
  
  // Starting positions
  homePositions?: Position[];
  startingPositions?: Position[];
  
  // Tile specifications
  blueTiles?: string[];
  redTiles?: string[];
  greenTiles?: string[];
  
  // Special tiles
  mecatolRexPosition?: Position | null;
  wormholeTiles?: string[];
  anomalyTiles?: string[];
  
  // Hyperlanes (PoK)
  hyperlanes?: Hyperlane[];
  hasHyperlanes?: boolean;
  
  // Map settings
  isSymmetrical?: boolean;
  isBalanced?: boolean;
  
  // Tournament/competitive settings
  isTournamentLegal?: boolean;
  tournamentName?: string | null;
  
  // Map type
  mapType?: MapType;
  mapStyle?: MapStyle;
  
  // Source tracking
  source: string;
  author?: string | null;
  version?: string;
  
  // Additional properties
  notes?: string | null;
  tags?: string[];
  
  // Homebrew tracking
  isOfficial?: boolean;
  homebrewReplacesID?: string | null;
}

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface HexPosition {
  position: Position;
  tileId?: string;
  rotation?: number;
}

export interface Hyperlane {
  id: string;
  tiles: string[];
  positions: Position[];
}

export type MapType = 
  | 'solo'
  | 'duel'
  | 'small'
  | 'standard'
  | 'large'
  | 'epic'
  | 'custom';

export type MapStyle = 
  | 'standard'
  | 'competitive'
  | 'balanced'
  | 'asymmetric'
  | 'hyperlane'
  | 'island'
  | 'spiral';
`;
}

// Generate main index file
function generateMainIndex(templates) {
  let content = generateTypeScriptInterface();
  
  content += `
export const mapTemplates: MapTemplate[] = ${JSON.stringify(templates, null, 2)};

// Helper functions
export const getTemplateById = (id: string): MapTemplate | undefined => {
  return mapTemplates.find(template => template.id === id);
};

export const getTemplateByName = (name: string): MapTemplate | undefined => {
  return mapTemplates.find(template => 
    template.name.toLowerCase() === name.toLowerCase()
  );
};

export const getTemplatesForPlayerCount = (playerCount: number): MapTemplate[] => {
  return mapTemplates.filter(template => 
    template.playerCount === playerCount ||
    (template.minPlayers && template.maxPlayers && 
     playerCount >= template.minPlayers && 
     playerCount <= template.maxPlayers)
  );
};

export const getTemplatesByType = (type: MapType): MapTemplate[] => {
  return mapTemplates.filter(template => template.mapType === type);
};

export const getTemplatesByStyle = (style: MapStyle): MapTemplate[] => {
  return mapTemplates.filter(template => template.mapStyle === style);
};

export const getTournamentTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => template.isTournamentLegal);
};

export const getSymmetricalTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => template.isSymmetrical);
};

export const getBalancedTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => template.isBalanced);
};

export const getHyperlaneTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => template.hasHyperlanes);
};

export const searchTemplates = (searchTerm: string): MapTemplate[] => {
  const term = searchTerm.toLowerCase();
  return mapTemplates.filter(template => 
    template.name.toLowerCase().includes(term) ||
    template.description?.toLowerCase().includes(term) ||
    template.tournamentName?.toLowerCase().includes(term) ||
    template.tags?.some(tag => tag.toLowerCase().includes(term))
  );
};

// Get official vs community templates
export const getOfficialTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => template.isOfficial);
};

export const getCommunityTemplates = (): MapTemplate[] => {
  return mapTemplates.filter(template => !template.isOfficial);
};

// Get templates by author
export const getTemplatesByAuthor = (author: string): MapTemplate[] => {
  return mapTemplates.filter(template => 
    template.author?.toLowerCase() === author.toLowerCase()
  );
};

// Group templates by player count
export const templatesByPlayerCount = {
  solo: mapTemplates.filter(t => t.playerCount === 1),
  two: mapTemplates.filter(t => t.playerCount === 2),
  three: mapTemplates.filter(t => t.playerCount === 3),
  four: mapTemplates.filter(t => t.playerCount === 4),
  five: mapTemplates.filter(t => t.playerCount === 5),
  six: mapTemplates.filter(t => t.playerCount === 6),
  seven: mapTemplates.filter(t => t.playerCount === 7),
  eight: mapTemplates.filter(t => t.playerCount === 8),
  variable: mapTemplates.filter(t => t.minPlayers && t.maxPlayers && !t.playerCount)
};

// Validate template for player count
export const isTemplateValidForPlayerCount = (template: MapTemplate, playerCount: number): boolean => {
  if (template.playerCount) {
    return template.playerCount === playerCount;
  }
  
  if (template.minPlayers && template.maxPlayers) {
    return playerCount >= template.minPlayers && playerCount <= template.maxPlayers;
  }
  
  return false;
};

// Get recommended templates for player count
export const getRecommendedTemplates = (playerCount: number): MapTemplate[] => {
  const validTemplates = getTemplatesForPlayerCount(playerCount);
  
  // Prioritize tournament legal and balanced templates
  return validTemplates.sort((a, b) => {
    const scoreA = (a.isTournamentLegal ? 2 : 0) + (a.isBalanced ? 1 : 0);
    const scoreB = (b.isTournamentLegal ? 2 : 0) + (b.isBalanced ? 1 : 0);
    return scoreB - scoreA;
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
  
  console.log('Loading map templates data from TI4_map_generator_bot...');
  const templates = loadMapTemplatesData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(templates);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total map templates extracted: ${templates.length}`);
  
  // Player count summary
  const playerCounts = {};
  templates.forEach(template => {
    const count = template.playerCount || 'variable';
    playerCounts[count] = (playerCounts[count] || 0) + 1;
  });
  
  console.log('\n=== Templates by Player Count ===');
  Object.entries(playerCounts)
    .sort(([a], [b]) => {
      if (a === 'variable') return 1;
      if (b === 'variable') return -1;
      return parseInt(a) - parseInt(b);
    })
    .forEach(([count, num]) => {
      console.log(`${count} players: ${num} templates`);
    });
  
  // Type summary
  const typeCounts = {};
  templates.forEach(template => {
    const type = template.mapType || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('\n=== Templates by Type ===');
  Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
  
  // Tournament legal summary
  const tournamentLegal = templates.filter(t => t.isTournamentLegal).length;
  const balanced = templates.filter(t => t.isBalanced).length;
  const symmetrical = templates.filter(t => t.isSymmetrical).length;
  
  console.log('\n=== Template Properties ===');
  console.log(`Tournament Legal: ${tournamentLegal}`);
  console.log(`Balanced: ${balanced}`);
  console.log(`Symmetrical: ${symmetrical}`);
  
  console.log('\n✅ Map templates extraction complete!');
  console.log(`Generated: ${path.join(outputDir, 'index.ts')}`);
}

// Run the extraction
main();