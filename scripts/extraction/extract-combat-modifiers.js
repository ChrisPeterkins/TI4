const fs = require('fs');
const path = require('path');

// Source paths
const combatModifiersSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/combat_modifiers');
const outputDir = path.join(__dirname, '../../server/src/data/combat-modifiers');

// Load and process combat modifiers data
function loadCombatModifiersData() {
  const allModifiers = [];
  
  // Get all JSON files in the combat_modifiers directory
  const files = fs.readdirSync(combatModifiersSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(combatModifiersSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(modifier => {
        const processedModifier = {
          alias: modifier.alias,
          type: modifier.type,
          value: modifier.value,
          scope: modifier.scope || null,
          
          // Combat ability targeting
          forCombatAbility: modifier.forCombatAbility || null,
          
          // Application rules
          applyToOpponent: modifier.applyToOpponent || false,
          applyToSelf: modifier.applyToSelf !== false, // Default true
          
          // Persistence
          persistenceType: modifier.persistenceType || 'ONE_ROUND',
          
          // Conditions
          condition: modifier.condition || null,
          unitType: modifier.unitType || null,
          
          // Related items (what triggers this modifier)
          related: modifier.related || [],
          
          // Additional properties
          description: modifier.description || null,
          source: modifier.source || sourceName,
          
          // Specific combat phases
          spaceCombatOnly: modifier.spaceCombatOnly || false,
          groundCombatOnly: modifier.groundCombatOnly || false,
          
          // Reroll specific
          rerollCount: modifier.rerollCount || null,
          rerollMisses: modifier.rerollMisses || false,
          
          // Homebrew tracking
          homebrewReplacesID: modifier.homebrewReplacesID || null
        };
        
        allModifiers.push(processedModifier);
      });
    } catch (error) {
      console.warn(`Error reading ${filename}:`, error.message);
    }
  });
  
  return allModifiers;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Combat Modifiers - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface CombatModifier {
  alias: string;
  type: ModifierType;
  value: string | number;
  scope?: string | null;
  
  // Combat ability targeting
  forCombatAbility?: string | null;
  
  // Application rules
  applyToOpponent?: boolean;
  applyToSelf?: boolean;
  
  // Persistence
  persistenceType?: PersistenceType;
  
  // Conditions
  condition?: string | null;
  unitType?: string | null;
  
  // Related items
  related?: RelatedItem[];
  
  // Additional properties
  description?: string | null;
  source: string;
  
  // Combat type restrictions
  spaceCombatOnly?: boolean;
  groundCombatOnly?: boolean;
  
  // Reroll specific
  rerollCount?: number | null;
  rerollMisses?: boolean;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export interface RelatedItem {
  type: string;
  alias: string;
  message?: string;
}

export type ModifierType = 
  | 'DIE_MOD'
  | 'REROLL'
  | 'EXTRA_DICE'
  | 'AUTO_HIT'
  | 'CANCEL_HIT'
  | 'SUSTAIN_DAMAGE'
  | 'ASSIGN_HIT'
  | 'BOMBARDMENT'
  | 'AFB'
  | 'SPACE_CANNON'
  | 'extrarolls'
  | 'mods'
  | 'bonus_hits';

export type PersistenceType = 
  | 'ONE_ROUND'
  | 'ONE_COMBAT'
  | 'PERMANENT'
  | 'UNTIL_END_OF_TURN'
  | 'CONDITIONAL'
  | 'ONE_TACTICAL_ACTION'
  | 'ALWAYS';
`;
}

// Generate main index file
function generateMainIndex(modifiers) {
  let content = generateTypeScriptInterface();
  
  content += `
export const combatModifiers: CombatModifier[] = ${JSON.stringify(modifiers, null, 2)};

// Helper functions
export const getModifierByAlias = (alias: string): CombatModifier | undefined => {
  return combatModifiers.find(modifier => modifier.alias === alias);
};

export const getModifiersByType = (type: ModifierType): CombatModifier[] => {
  return combatModifiers.filter(modifier => modifier.type === type);
};

export const getModifiersForCombatAbility = (ability: string): CombatModifier[] => {
  return combatModifiers.filter(modifier => 
    modifier.forCombatAbility === ability
  );
};

export const getModifiersByPersistence = (persistence: PersistenceType): CombatModifier[] => {
  return combatModifiers.filter(modifier => 
    modifier.persistenceType === persistence
  );
};

export const getSpaceCombatModifiers = (): CombatModifier[] => {
  return combatModifiers.filter(modifier => 
    !modifier.groundCombatOnly
  );
};

export const getGroundCombatModifiers = (): CombatModifier[] => {
  return combatModifiers.filter(modifier => 
    !modifier.spaceCombatOnly
  );
};

export const getRerollModifiers = (): CombatModifier[] => {
  return combatModifiers.filter(modifier => 
    modifier.type === 'REROLL' || modifier.rerollCount
  );
};

export const getDieModifiers = (): CombatModifier[] => {
  return combatModifiers.filter(modifier => 
    modifier.type === 'DIE_MOD'
  );
};

// Get modifiers related to specific game elements
export const getModifiersRelatedTo = (type: string, alias: string): CombatModifier[] => {
  return combatModifiers.filter(modifier => 
    modifier.related?.some(r => r.type === type && r.alias === alias)
  );
};

export const getModifiersForActionCard = (cardAlias: string): CombatModifier[] => {
  return getModifiersRelatedTo('action_cards', cardAlias);
};

export const getModifiersForTechnology = (techAlias: string): CombatModifier[] => {
  return getModifiersRelatedTo('technologies', techAlias);
};

export const getModifiersForAbility = (abilityAlias: string): CombatModifier[] => {
  return getModifiersRelatedTo('abilities', abilityAlias);
};

// Calculate total modifier value for a set of modifiers
export const calculateTotalModifier = (modifiers: CombatModifier[]): number => {
  return modifiers.reduce((total, modifier) => {
    if (modifier.type === 'DIE_MOD') {
      const value = typeof modifier.value === 'string' 
        ? parseInt(modifier.value.replace(/[^\d-]/g, '')) 
        : modifier.value;
      return total + (value || 0);
    }
    return total;
  }, 0);
};

// Group modifiers by type
export const modifiersByType = {
  dieModifiers: combatModifiers.filter(m => m.type === 'DIE_MOD'),
  rerolls: combatModifiers.filter(m => m.type === 'REROLL'),
  extraDice: combatModifiers.filter(m => m.type === 'EXTRA_DICE'),
  autoHits: combatModifiers.filter(m => m.type === 'AUTO_HIT'),
  cancelHits: combatModifiers.filter(m => m.type === 'CANCEL_HIT'),
  sustainDamage: combatModifiers.filter(m => m.type === 'SUSTAIN_DAMAGE'),
  bombardment: combatModifiers.filter(m => m.type === 'BOMBARDMENT'),
  antiFighterBarrage: combatModifiers.filter(m => m.type === 'AFB'),
  spaceCannon: combatModifiers.filter(m => m.type === 'SPACE_CANNON')
};

// Check if modifiers conflict
export const doModifiersConflict = (mod1: CombatModifier, mod2: CombatModifier): boolean => {
  // Check if they apply to the same combat ability
  if (mod1.forCombatAbility && mod1.forCombatAbility === mod2.forCombatAbility) {
    // Check if one applies to self and other to opponent
    if (mod1.applyToSelf !== mod2.applyToSelf || mod1.applyToOpponent !== mod2.applyToOpponent) {
      return false; // They target different participants
    }
    return true; // They might conflict
  }
  return false;
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
  
  console.log('Loading combat modifiers data from TI4_map_generator_bot...');
  const modifiers = loadCombatModifiersData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(modifiers);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total combat modifiers extracted: ${modifiers.length}`);
  
  // Type summary
  const typeCounts = {};
  modifiers.forEach(modifier => {
    const type = modifier.type;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('\n=== Modifiers by Type ===');
  Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
  
  // Persistence summary
  const persistenceCounts = {};
  modifiers.forEach(modifier => {
    const persistence = modifier.persistenceType || 'ONE_ROUND';
    persistenceCounts[persistence] = (persistenceCounts[persistence] || 0) + 1;
  });
  
  console.log('\n=== Modifiers by Persistence ===');
  Object.entries(persistenceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([persistence, count]) => {
      console.log(`${persistence}: ${count}`);
    });
  
  // Combat type summary
  const spaceCombat = modifiers.filter(m => !m.groundCombatOnly).length;
  const groundCombat = modifiers.filter(m => !m.spaceCombatOnly).length;
  
  console.log('\n=== Combat Type Coverage ===');
  console.log(`Space Combat: ${spaceCombat}`);
  console.log(`Ground Combat: ${groundCombat}`);
  
  console.log('\n✅ Combat modifiers extraction complete!');
  console.log(`Generated: ${path.join(outputDir, 'index.ts')}`);
}

// Run the extraction
main();