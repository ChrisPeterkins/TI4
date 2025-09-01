const fs = require('fs');
const path = require('path');

// Source paths
const promissorySourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/promissory_notes');
const outputDir = path.join(__dirname, '../../client/src/data/cards/promissory');

// Load and process promissory notes data
function loadPromissoryData() {
  const allPromissory = [];
  
  // Get all JSON files in the directory
  const files = fs.readdirSync(promissorySourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(promissorySourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(note => {
        const processedNote = {
          alias: note.alias,
          name: note.name,
          faction: note.faction || 'generic',
          text: note.text,
          
          // Play area and timing
          playArea: note.playArea || false,
          playImmediately: note.playImmediately !== false,
          
          // Card properties
          shrinkName: note.shrinkName || false,
          color: note.color || null,
          
          // Additional properties
          returnCondition: note.returnCondition || null,
          prerequisite: note.prerequisite || null,
          
          // Source tracking
          source: note.source || sourceName,
          expansion: note.expansion || null,
          
          // Image
          imageURL: note.imageURL || null,
          
          // Homebrew tracking
          homebrewReplacesID: note.homebrewReplacesID || null
        };
        
        allPromissory.push(processedNote);
      });
    } catch (error) {
      console.warn('Error reading ' + filename + ':', error.message);
    }
  });
  
  return allPromissory;
}

// Group by faction
function groupByFaction(notes) {
  const grouped = {};
  
  notes.forEach(note => {
    const faction = note.faction || 'generic';
    if (!grouped[faction]) {
      grouped[faction] = [];
    }
    grouped[faction].push(note);
  });
  
  return grouped;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Promissory Notes - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface PromissoryNote {
  alias: string;
  name: string;
  faction: string;
  text: string;
  
  // Play area and timing
  playArea?: boolean;
  playImmediately?: boolean;
  
  // Card properties
  shrinkName?: boolean;
  color?: string | null;
  
  // Additional properties
  returnCondition?: string | null;
  prerequisite?: string | null;
  
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
function generateMainIndex(notes) {
  const grouped = groupByFaction(notes);
  
  let content = generateTypeScriptInterface();
  
  content += '\n\nexport const promissoryNotes: PromissoryNote[] = ' + JSON.stringify(notes, null, 2) + ';\n\n';
  
  // Export faction-specific notes
  content += '// Faction-specific promissory notes\n';
  content += 'export const factionPromissoryNotes = ' + JSON.stringify(grouped, null, 2) + ';\n\n';
  
  // Export generic notes
  content += '// Generic promissory notes (Support for the Throne, etc.)\n';
  content += 'export const genericPromissoryNotes: PromissoryNote[] = ' + 
    JSON.stringify(notes.filter(n => n.faction === 'generic'), null, 2) + ';\n\n';
  
  content += `// Helper functions
export const getPromissoryByAlias = (alias: string): PromissoryNote | undefined => {
  return promissoryNotes.find(note => note.alias === alias);
};

export const getPromissoryByName = (name: string): PromissoryNote | undefined => {
  return promissoryNotes.find(note => 
    note.name.toLowerCase() === name.toLowerCase()
  );
};

export const getPromissoryByFaction = (faction: string): PromissoryNote[] => {
  return promissoryNotes.filter(note => 
    note.faction?.toLowerCase() === faction.toLowerCase()
  );
};

export const getPlayAreaNotes = (): PromissoryNote[] => {
  return promissoryNotes.filter(note => note.playArea);
};

export const getImmediateNotes = (): PromissoryNote[] => {
  return promissoryNotes.filter(note => note.playImmediately);
};

// Search promissory notes
export const searchPromissoryNotes = (searchTerm: string): PromissoryNote[] => {
  const term = searchTerm.toLowerCase();
  return promissoryNotes.filter(note => 
    note.name.toLowerCase().includes(term) ||
    note.text.toLowerCase().includes(term) ||
    note.faction?.toLowerCase().includes(term)
  );
};

// Get promissory notes by source
export const getOfficialPromissoryNotes = (): PromissoryNote[] => {
  return promissoryNotes.filter(note => 
    note.source === 'base' || 
    note.source === 'pok' ||
    note.source === 'promissory_notes'
  );
};

export const getHomebrewPromissoryNotes = (): PromissoryNote[] => {
  return promissoryNotes.filter(note => 
    note.source !== 'base' && 
    note.source !== 'pok' &&
    note.source !== 'promissory_notes'
  );
};

// Get all unique factions that have promissory notes
export const getFactionsWithPromissoryNotes = (): string[] => {
  const factions = new Set(
    promissoryNotes
      .map(note => note.faction)
      .filter(faction => faction && faction !== 'generic')
  );
  return Array.from(factions).sort();
};

// Check if a note has specific keywords
export const promissoryNoteHasKeyword = (note: PromissoryNote, keyword: string): boolean => {
  const keywordLower = keyword.toLowerCase();
  return note.text.toLowerCase().includes(keywordLower);
};

// Get notes that mention specific game elements
export const getPromissoryNotesWithElement = (element: string): PromissoryNote[] => {
  return promissoryNotes.filter(note => 
    promissoryNoteHasKeyword(note, element)
  );
};

// Statistics
export const getPromissoryStats = () => {
  const factionCounts = {};
  promissoryNotes.forEach(note => {
    const faction = note.faction || 'generic';
    factionCounts[faction] = (factionCounts[faction] || 0) + 1;
  });
  
  return {
    total: promissoryNotes.length,
    generic: genericPromissoryNotes.length,
    factionSpecific: promissoryNotes.length - genericPromissoryNotes.length,
    playArea: promissoryNotes.filter(n => n.playArea).length,
    immediate: promissoryNotes.filter(n => n.playImmediately).length,
    uniqueFactions: Object.keys(factionCounts).length - 1, // Exclude 'generic'
    byFaction: factionCounts
  };
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
  
  console.log('Loading promissory notes data from TI4_map_generator_bot...');
  const notes = loadPromissoryData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(notes);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log('Total promissory notes extracted: ' + notes.length);
  
  // Faction breakdown
  const factionCounts = {};
  notes.forEach(note => {
    const faction = note.faction || 'generic';
    factionCounts[faction] = (factionCounts[faction] || 0) + 1;
  });
  
  console.log('\n=== Promissory Notes by Faction ===');
  const sortedFactions = Object.entries(factionCounts)
    .sort(([a], [b]) => {
      if (a === 'generic') return -1;
      if (b === 'generic') return 1;
      return a.localeCompare(b);
    });
  
  sortedFactions.slice(0, 15).forEach(([faction, count]) => {
    console.log(faction + ': ' + count);
  });
  
  if (sortedFactions.length > 15) {
    console.log('... and ' + (sortedFactions.length - 15) + ' more factions');
  }
  
  // Play area breakdown
  const playAreaCount = notes.filter(n => n.playArea).length;
  const immediateCount = notes.filter(n => n.playImmediately).length;
  
  console.log('\n=== Play Properties ===');
  console.log('Play in area: ' + playAreaCount);
  console.log('Play immediately: ' + immediateCount);
  
  // Source breakdown
  const sourceCounts = {};
  notes.forEach(note => {
    const source = note.source;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Promissory Notes by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(source + ': ' + count);
    });
  
  console.log('\n✅ Promissory notes extraction complete!');
  console.log('Generated: ' + path.join(outputDir, 'index.ts'));
}

// Run the extraction
main();