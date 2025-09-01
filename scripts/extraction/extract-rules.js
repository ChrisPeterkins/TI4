const fs = require('fs');
const path = require('path');

// Source paths
const rulesPath = path.join(__dirname, '../../sources/TwilightImperiumUltimate/src/TwilightImperiumUltimate.Web/Resources/Rules.resx');
const ruleNotesPath = path.join(__dirname, '../../sources/TwilightImperiumUltimate/src/TwilightImperiumUltimate.Web/Resources/RuleNotes.resx');
const outputDir = path.join(__dirname, '../../client/src/data/rules');

// Rule categories from the enum
const ruleCategories = [
  'Abilities', 'ActionCards', 'ActionPhase', 'ActivePlayer', 'ActiveSystem',
  'Adjacency', 'AgendaCard', 'AgendaPhase', 'Anomalies', 'AntiFighterBarrage',
  'AsteroidField', 'Attach', 'Attacker', 'Blockaded', 'Bombardment',
  'Capacity', 'Capture', 'Combat', 'CommandSheet', 'CommandTokens',
  'Commodities', 'ComponentAction', 'ComponentLimitations', 'Construction', 'Control',
  'Cost', 'CustodiansToken', 'Deals', 'Defender', 'Deploy',
  'Destroyed', 'Diplomacy', 'Elimination', 'Exhausted', 'Exploration',
  'FighterTokens', 'FleetPool', 'FrontierTokens', 'GameBoard', 'GameRound',
  'GravityRift', 'GroundCombat', 'GroundForces', 'Hyperlanes', 'Imperial',
  'InfantryTokens', 'Influence', 'InitiativeOrder', 'Invasion', 'LeaderSheet',
  'Leaders', 'Leadership', 'LegendaryPlanets', 'MecatolRex', 'Mechs',
  'Modifiers', 'Move', 'Movement', 'Nebula', 'Neighbors',
  'ObjectiveCards', 'Opponent', 'Pds', 'Planets', 'PlanetaryShield',
  'Politics', 'ProducingUnits', 'Production', 'PromissoryNotes', 'Purge',
  'Readied', 'Reinforcements', 'Relics', 'Rerolls', 'Resources',
  'Ships', 'SpaceCannon', 'SpaceCombat', 'SpaceDock', 'Speaker',
  'StatusPhase', 'StrategicAction', 'StrategyCard', 'StrategyPhase', 'Structures',
  'Supernova', 'SustainDamage', 'SystemTiles', 'TacticalAction', 'TechnologySystem',
  'Technology', 'Trade', 'TradeGoods', 'Transactions', 'Transport',
  'Units', 'UnitUpgrades', 'VictoryPoints', 'Warfare', 'WormholeNexus',
  'Wormholes'
];

// Function to parse .resx file
function parseResxFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = {};
  
  // Regular expression to match data entries
  const regex = /<data name="([^"]+)"[^>]*>\s*<value>([\s\S]*?)<\/value>/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const key = match[1];
    const value = match[2].trim();
    data[key] = value;
  }
  
  return data;
}

// Function to clean HTML and format text
function cleanHtmlText(html) {
  if (!html) return '';
  
  // Remove HTML tags but keep structure
  let text = html
    // Convert <br/> and </p> to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    // Convert lists
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/?[ou]l[^>]*>/gi, '')
    // Remove all other HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return text;
}

// Function to extract rules for each category
function extractRules(rulesData, ruleNotesData) {
  const rules = [];
  
  ruleCategories.forEach(category => {
    // Get the title
    const titleKey = `RuleCategoryTitle_${category}`;
    const title = rulesData[titleKey] || category;
    
    // Get the main rule content
    const ruleKey = `RuleCategory_${category}`;
    const ruleContent = rulesData[ruleKey];
    
    // Get the notes
    const notesKey = `RuleCategory_${category}_Notes`;
    const notes = rulesData[notesKey];
    
    if (ruleContent) {
      const rule = {
        id: category.toLowerCase(),
        category: category,
        title: cleanHtmlText(title),
        content: cleanHtmlText(ruleContent),
        notes: notes ? cleanHtmlText(notes) : null
      };
      
      // Parse subsections if the content has clear structure
      const subsections = parseSubsections(rule.content);
      if (subsections.length > 0) {
        rule.subsections = subsections;
      }
      
      rules.push(rule);
    }
  });
  
  return rules;
}

// Function to parse subsections from rule content
function parseSubsections(content) {
  const subsections = [];
  const lines = content.split('\n');
  let currentSubsection = null;
  let currentContent = [];
  
  lines.forEach(line => {
    // Check if line looks like a subsection header (numbered or bulleted)
    const numberMatch = line.match(/^(\d+(\.\d+)*)\s+(.+)/);
    const bulletMatch = line.match(/^•\s+(.+)/);
    
    if (numberMatch && numberMatch[3].endsWith(':')) {
      // Save previous subsection if exists
      if (currentSubsection) {
        currentSubsection.content = currentContent.join('\n').trim();
        subsections.push(currentSubsection);
      }
      
      // Start new numbered subsection
      currentSubsection = {
        number: numberMatch[1],
        title: numberMatch[3].replace(':', ''),
        content: ''
      };
      currentContent = [];
    } else if (currentSubsection) {
      currentContent.push(line);
    }
  });
  
  // Save last subsection
  if (currentSubsection) {
    currentSubsection.content = currentContent.join('\n').trim();
    subsections.push(currentSubsection);
  }
  
  return subsections;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Rules - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface Rule {
  id: string;
  category: string;
  title: string;
  content: string;
  notes?: string | null;
  subsections?: RuleSubsection[];
}

export interface RuleSubsection {
  number?: string;
  title: string;
  content: string;
}

export type RuleCategory = 
  | 'Abilities'
  | 'ActionCards'
  | 'ActionPhase'
  | 'ActivePlayer'
  | 'ActiveSystem'
  | 'Adjacency'
  | 'AgendaCard'
  | 'AgendaPhase'
  | 'Anomalies'
  | 'AntiFighterBarrage'
  | 'AsteroidField'
  | 'Attach'
  | 'Attacker'
  | 'Blockaded'
  | 'Bombardment'
  | 'Capacity'
  | 'Capture'
  | 'Combat'
  | 'CommandSheet'
  | 'CommandTokens'
  | 'Commodities'
  | 'ComponentAction'
  | 'ComponentLimitations'
  | 'Construction'
  | 'Control'
  | 'Cost'
  | 'CustodiansToken'
  | 'Deals'
  | 'Defender'
  | 'Deploy'
  | 'Destroyed'
  | 'Diplomacy'
  | 'Elimination'
  | 'Exhausted'
  | 'Exploration'
  | 'FighterTokens'
  | 'FleetPool'
  | 'FrontierTokens'
  | 'GameBoard'
  | 'GameRound'
  | 'GravityRift'
  | 'GroundCombat'
  | 'GroundForces'
  | 'Hyperlanes'
  | 'Imperial'
  | 'InfantryTokens'
  | 'Influence'
  | 'InitiativeOrder'
  | 'Invasion'
  | 'LeaderSheet'
  | 'Leaders'
  | 'Leadership'
  | 'LegendaryPlanets'
  | 'MecatolRex'
  | 'Mechs'
  | 'Modifiers'
  | 'Move'
  | 'Movement'
  | 'Nebula'
  | 'Neighbors'
  | 'ObjectiveCards'
  | 'Opponent'
  | 'Pds'
  | 'Planets'
  | 'PlanetaryShield'
  | 'Politics'
  | 'ProducingUnits'
  | 'Production'
  | 'PromissoryNotes'
  | 'Purge'
  | 'Readied'
  | 'Reinforcements'
  | 'Relics'
  | 'Rerolls'
  | 'Resources'
  | 'Ships'
  | 'SpaceCannon'
  | 'SpaceCombat'
  | 'SpaceDock'
  | 'Speaker'
  | 'StatusPhase'
  | 'StrategicAction'
  | 'StrategyCard'
  | 'StrategyPhase'
  | 'Structures'
  | 'Supernova'
  | 'SustainDamage'
  | 'SystemTiles'
  | 'TacticalAction'
  | 'TechnologySystem'
  | 'Technology'
  | 'Trade'
  | 'TradeGoods'
  | 'Transactions'
  | 'Transport'
  | 'Units'
  | 'UnitUpgrades'
  | 'VictoryPoints'
  | 'Warfare'
  | 'WormholeNexus'
  | 'Wormholes';
`;
}

// Generate main index file
function generateMainIndex(rules) {
  let content = generateTypeScriptInterface();
  
  content += `
export const rules: Rule[] = ${JSON.stringify(rules, null, 2)};

// Helper functions
export const getRuleByCategory = (category: RuleCategory): Rule | undefined => {
  return rules.find(rule => rule.category === category);
};

export const getRuleById = (id: string): Rule | undefined => {
  return rules.find(rule => rule.id === id);
};

export const searchRules = (searchTerm: string): Rule[] => {
  const term = searchTerm.toLowerCase();
  return rules.filter(rule => 
    rule.title.toLowerCase().includes(term) ||
    rule.content.toLowerCase().includes(term) ||
    (rule.notes && rule.notes.toLowerCase().includes(term))
  );
};

export const getRulesByKeyword = (keyword: string): Rule[] => {
  const term = keyword.toLowerCase();
  return rules.filter(rule => 
    rule.content.toLowerCase().includes(term) ||
    (rule.notes && rule.notes.toLowerCase().includes(term))
  );
};

// Get all rule categories
export const getAllCategories = (): RuleCategory[] => {
  return rules.map(rule => rule.category as RuleCategory);
};

// Group rules by related topics
export const ruleGroups = {
  phases: [
    'StrategyPhase',
    'ActionPhase',
    'StatusPhase',
    'AgendaPhase'
  ],
  combat: [
    'Combat',
    'SpaceCombat',
    'GroundCombat',
    'AntiFighterBarrage',
    'Bombardment',
    'SpaceCannon'
  ],
  units: [
    'Units',
    'Ships',
    'GroundForces',
    'Structures',
    'Mechs',
    'UnitUpgrades'
  ],
  movement: [
    'Movement',
    'Move',
    'Transport',
    'Capacity'
  ],
  economy: [
    'Resources',
    'Influence',
    'TradeGoods',
    'Commodities',
    'Trade',
    'Production'
  ],
  politics: [
    'Politics',
    'AgendaCard',
    'Speaker',
    'VictoryPoints'
  ],
  tiles: [
    'SystemTiles',
    'Planets',
    'Anomalies',
    'Wormholes',
    'MecatolRex'
  ],
  special: [
    'Abilities',
    'Leaders',
    'Relics',
    'Exploration',
    'PromissoryNotes'
  ]
};

export const getRulesByGroup = (groupName: keyof typeof ruleGroups): Rule[] => {
  const categories = ruleGroups[groupName];
  return rules.filter(rule => categories.includes(rule.category));
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
  
  console.log('Loading rules data from TwilightImperiumUltimate...');
  
  // Parse the resource files
  const rulesData = parseResxFile(rulesPath);
  const ruleNotesData = fs.existsSync(ruleNotesPath) ? parseResxFile(ruleNotesPath) : {};
  
  // Extract rules
  const rules = extractRules(rulesData, ruleNotesData);
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(rules);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total rules extracted: ${rules.length}`);
  
  // Category coverage
  const extractedCategories = rules.map(r => r.category);
  const missingCategories = ruleCategories.filter(c => !extractedCategories.includes(c));
  
  if (missingCategories.length > 0) {
    console.log(`\nMissing categories (no content found):`);
    missingCategories.forEach(cat => console.log(`  - ${cat}`));
  }
  
  // Rules with notes
  const rulesWithNotes = rules.filter(r => r.notes);
  console.log(`\nRules with notes: ${rulesWithNotes.length}`);
  
  // Rules with subsections
  const rulesWithSubsections = rules.filter(r => r.subsections && r.subsections.length > 0);
  console.log(`Rules with subsections: ${rulesWithSubsections.length}`);
  
  console.log('\n✅ Rules extraction complete!');
  console.log(`Generated: ${path.join(outputDir, 'index.ts')}`);
}

// Run the extraction
main();