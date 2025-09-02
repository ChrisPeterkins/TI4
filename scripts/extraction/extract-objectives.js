const fs = require('fs');
const path = require('path');

// Source paths
const publicObjectivesDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/public_objectives');
const secretObjectivesDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/secret_objectives');
const outputDir = path.join(__dirname, '../../server/src/data/cards/objective');

// Load and process objectives data
function loadObjectivesData(sourceDir, objectiveType) {
  const allObjectives = [];
  
  // Get all JSON files in the directory
  const files = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(sourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(objective => {
        // Normalize phase values
        let normalizedPhase = objective.phase || 'Status';
        if (typeof normalizedPhase === 'string') {
          // Normalize case variations
          if (normalizedPhase.toLowerCase() === 'action') normalizedPhase = 'Action';
          else if (normalizedPhase.toLowerCase() === 'status') normalizedPhase = 'Status';
          else if (normalizedPhase.toLowerCase() === 'agenda') normalizedPhase = 'Agenda';
          else if (normalizedPhase.toLowerCase() === 'strategy') normalizedPhase = 'Strategy';
          else if (normalizedPhase.toLowerCase() === 'omega') normalizedPhase = 'Omega';
          else if (normalizedPhase.toLowerCase().includes('action')) normalizedPhase = 'Action';
          else if (normalizedPhase.toLowerCase().includes('status')) normalizedPhase = 'Status';
        }
        
        const processedObjective = {
          alias: objective.alias,
          name: objective.name,
          type: objectiveType,
          phase: normalizedPhase,
          text: objective.text,
          points: objective.points || 1,
          
          // Stage for public objectives
          stage: objective.stage || (objective.points === 2 ? 2 : 1),
          
          // Additional properties
          requirements: objective.requirements || null,
          prerequisite: objective.prerequisite || null,
          
          // Scoring conditions
          scoringCondition: objective.scoringCondition || null,
          whenScored: objective.whenScored || objective.phase,
          
          // Source tracking
          source: objective.source || sourceName,
          expansion: objective.expansion || null,
          
          // Image
          imageURL: objective.imageURL || null,
          
          // Homebrew tracking
          homebrewReplacesID: objective.homebrewReplacesID || null
        };
        
        allObjectives.push(processedObjective);
      });
    } catch (error) {
      console.warn('Error reading ' + filename + ':', error.message);
    }
  });
  
  return allObjectives;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Objectives - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface ObjectiveCard {
  alias: string;
  name: string;
  type: ObjectiveType;
  phase: ObjectivePhase;
  text: string;
  points: number;
  
  // Stage (for public objectives)
  stage?: number;
  
  // Requirements
  requirements?: string | null;
  prerequisite?: string | null;
  
  // Scoring
  scoringCondition?: string | null;
  whenScored?: string;
  
  // Source tracking
  source: string;
  expansion?: string | null;
  
  // Image
  imageURL?: string | null;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export type ObjectiveType = 'public' | 'secret';

export type ObjectivePhase = 
  | 'Status'
  | 'Action'
  | 'Agenda'
  | 'Strategy'
  | 'Combat'
  | 'Omega';
`;
}

// Generate main index file
function generateMainIndex(publicObjectives, secretObjectives) {
  // Group public objectives by stage
  const stage1 = publicObjectives.filter(o => o.stage === 1);
  const stage2 = publicObjectives.filter(o => o.stage === 2);
  
  let content = generateTypeScriptInterface();
  
  content += '\n\n// All objectives\n';
  content += 'export const objectives: ObjectiveCard[] = ' + JSON.stringify([...publicObjectives, ...secretObjectives], null, 2) + ';\n\n';
  
  content += '// Public objectives\n';
  content += 'export const publicObjectives: ObjectiveCard[] = ' + JSON.stringify(publicObjectives, null, 2) + ';\n\n';
  
  content += '// Secret objectives\n';
  content += 'export const secretObjectives: ObjectiveCard[] = ' + JSON.stringify(secretObjectives, null, 2) + ';\n\n';
  
  content += '// Stage I public objectives\n';
  content += 'export const stageIObjectives: ObjectiveCard[] = ' + JSON.stringify(stage1, null, 2) + ';\n\n';
  
  content += '// Stage II public objectives\n';
  content += 'export const stageIIObjectives: ObjectiveCard[] = ' + JSON.stringify(stage2, null, 2) + ';\n\n';
  
  content += `// Helper functions
export const getObjectiveByAlias = (alias: string): ObjectiveCard | undefined => {
  return objectives.find(objective => objective.alias === alias);
};

export const getObjectiveByName = (name: string): ObjectiveCard | undefined => {
  return objectives.find(objective => 
    objective.name.toLowerCase() === name.toLowerCase()
  );
};

export const getObjectivesByType = (type: ObjectiveType): ObjectiveCard[] => {
  return objectives.filter(objective => objective.type === type);
};

export const getObjectivesByPhase = (phase: ObjectivePhase): ObjectiveCard[] => {
  return objectives.filter(objective => objective.phase === phase);
};

export const getObjectivesByPoints = (points: number): ObjectiveCard[] => {
  return objectives.filter(objective => objective.points === points);
};

export const getObjectivesByStage = (stage: number): ObjectiveCard[] => {
  return publicObjectives.filter(objective => objective.stage === stage);
};

// Get objectives that can be scored in a specific phase
export const getScorableObjectives = (phase: ObjectivePhase, isPublic: boolean): ObjectiveCard[] => {
  const objectives = isPublic ? publicObjectives : secretObjectives;
  return objectives.filter(obj => obj.phase === phase);
};

// Search objectives
export const searchObjectives = (searchTerm: string): ObjectiveCard[] => {
  const term = searchTerm.toLowerCase();
  return objectives.filter(objective => 
    objective.name.toLowerCase().includes(term) ||
    objective.text.toLowerCase().includes(term)
  );
};

// Get objectives by source
export const getOfficialObjectives = (): ObjectiveCard[] => {
  return objectives.filter(objective => 
    objective.source === 'base' || 
    objective.source === 'pok' ||
    objective.source === 'public_objectives' ||
    objective.source === 'secret_objectives'
  );
};

export const getHomebrewObjectives = (): ObjectiveCard[] => {
  return objectives.filter(objective => 
    objective.source !== 'base' && 
    objective.source !== 'pok' &&
    objective.source !== 'public_objectives' &&
    objective.source !== 'secret_objectives'
  );
};

// Statistics
export const getObjectiveStats = () => {
  return {
    total: objectives.length,
    public: publicObjectives.length,
    secret: secretObjectives.length,
    stageI: stageIObjectives.length,
    stageII: stageIIObjectives.length,
    statusPhase: objectives.filter(o => o.phase === 'Status').length,
    actionPhase: objectives.filter(o => o.phase === 'Action').length,
    onePoint: objectives.filter(o => o.points === 1).length,
    twoPoint: objectives.filter(o => o.points === 2).length
  };
};

// Check if objective requires specific game elements
export const objectiveRequires = (objective: ObjectiveCard, element: string): boolean => {
  const text = objective.text.toLowerCase();
  const elementLower = element.toLowerCase();
  return text.includes(elementLower);
};

// Get objectives that mention specific keywords
export const getObjectivesWithKeyword = (keyword: string): ObjectiveCard[] => {
  const keywordLower = keyword.toLowerCase();
  return objectives.filter(obj => 
    obj.text.toLowerCase().includes(keywordLower)
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
  
  console.log('Loading objectives data from TI4_map_generator_bot...');
  
  // Load public and secret objectives
  const publicObjectives = loadObjectivesData(publicObjectivesDir, 'public');
  const secretObjectives = loadObjectivesData(secretObjectivesDir, 'secret');
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(publicObjectives, secretObjectives);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log('Total objectives extracted: ' + (publicObjectives.length + secretObjectives.length));
  console.log('Public objectives: ' + publicObjectives.length);
  console.log('Secret objectives: ' + secretObjectives.length);
  
  // Stage breakdown for public objectives
  const stage1Count = publicObjectives.filter(o => o.stage === 1).length;
  const stage2Count = publicObjectives.filter(o => o.stage === 2).length;
  
  console.log('\n=== Public Objectives by Stage ===');
  console.log('Stage I: ' + stage1Count);
  console.log('Stage II: ' + stage2Count);
  
  // Phase breakdown
  const phaseCounts = {};
  [...publicObjectives, ...secretObjectives].forEach(obj => {
    const phase = obj.phase;
    phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
  });
  
  console.log('\n=== Objectives by Phase ===');
  Object.entries(phaseCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([phase, count]) => {
      console.log(phase + ': ' + count);
    });
  
  // Source breakdown
  const sourceCounts = {};
  [...publicObjectives, ...secretObjectives].forEach(obj => {
    const source = obj.source;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Objectives by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(source + ': ' + count);
    });
  
  console.log('\n✅ Objectives extraction complete!');
  console.log('Generated: ' + path.join(outputDir, 'index.ts'));
}

// Run the extraction
main();