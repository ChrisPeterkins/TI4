const fs = require('fs');
const path = require('path');

// Source paths
const attachmentsSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/attachments');
const outputDir = path.join(__dirname, '../../server/src/data/attachments');

// Load and process attachments data
function loadAttachmentsData() {
  const allAttachments = [];
  
  // Get all JSON files in the attachments directory
  const files = fs.readdirSync(attachmentsSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(attachmentsSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(attachment => {
        const processedAttachment = {
          id: attachment.id,
          name: attachment.name || attachment.id, // Use id as fallback name
          imagePath: attachment.imagePath || null,
          
          // Modifiers
          resourcesModifier: attachment.resourcesModifier || 0,
          influenceModifier: attachment.influenceModifier || 0,
          
          // Tech specialties
          techSpeciality: attachment.techSpeciality || [],
          
          // Attachment type and restrictions
          attachmentType: attachment.attachmentType || 'planet',
          canAttachTo: attachment.canAttachTo || null,
          restrictions: attachment.restrictions || null,
          
          // Effects
          permanentEffect: attachment.permanentEffect || null,
          continuousEffect: attachment.continuousEffect || null,
          triggerEffect: attachment.triggerEffect || null,
          
          // Source tracking
          source: attachment.source || sourceName,
          
          // Additional properties
          isLegendary: attachment.isLegendary || false,
          isPermanent: attachment.isPermanent || true,
          
          // Homebrew tracking
          homebrewReplacesID: attachment.homebrewReplacesID || null
        };
        
        allAttachments.push(processedAttachment);
      });
    } catch (error) {
      console.warn(`Error reading ${filename}:`, error.message);
    }
  });
  
  return allAttachments;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Attachments - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface Attachment {
  id: string;
  name: string;
  imagePath?: string | null;
  
  // Modifiers
  resourcesModifier?: number;
  influenceModifier?: number;
  
  // Tech specialties
  techSpeciality?: string[];
  
  // Attachment type and restrictions
  attachmentType?: string;
  canAttachTo?: string | null;
  restrictions?: string | null;
  
  // Effects
  permanentEffect?: string | null;
  continuousEffect?: string | null;
  triggerEffect?: string | null;
  
  // Source tracking
  source: string;
  
  // Additional properties
  isLegendary?: boolean;
  isPermanent?: boolean;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export type TechSpeciality = 'biotic' | 'cybernetic' | 'propulsion' | 'warfare';
export type AttachmentType = 'planet' | 'system' | 'unit' | 'player';
`;
}

// Generate main index file
function generateMainIndex(attachments) {
  let content = generateTypeScriptInterface();
  
  content += `
export const attachments: Attachment[] = ${JSON.stringify(attachments, null, 2)};

// Helper functions
export const getAttachmentById = (id: string): Attachment | undefined => {
  return attachments.find(attachment => attachment.id === id);
};

export const getAttachmentByName = (name: string): Attachment | undefined => {
  return attachments.find(attachment => 
    attachment.name.toLowerCase() === name.toLowerCase()
  );
};

export const getAttachmentsByType = (type: string): Attachment[] => {
  return attachments.filter(attachment => 
    attachment.attachmentType === type
  );
};

export const getAttachmentsByTechSpeciality = (speciality: TechSpeciality): Attachment[] => {
  return attachments.filter(attachment => 
    attachment.techSpeciality?.includes(speciality)
  );
};

export const getAttachmentsWithResourceBonus = (): Attachment[] => {
  return attachments.filter(attachment => 
    attachment.resourcesModifier && attachment.resourcesModifier > 0
  );
};

export const getAttachmentsWithInfluenceBonus = (): Attachment[] => {
  return attachments.filter(attachment => 
    attachment.influenceModifier && attachment.influenceModifier > 0
  );
};

export const searchAttachments = (searchTerm: string): Attachment[] => {
  const term = searchTerm.toLowerCase();
  return attachments.filter(attachment => 
    attachment.name.toLowerCase().includes(term) ||
    attachment.permanentEffect?.toLowerCase().includes(term) ||
    attachment.continuousEffect?.toLowerCase().includes(term)
  );
};

// Get official vs homebrew attachments
export const getOfficialAttachments = (): Attachment[] => {
  return attachments.filter(attachment => 
    attachment.source === 'attachments' || 
    attachment.source === 'pok' || 
    attachment.source === 'base'
  );
};

export const getHomebrewAttachments = (): Attachment[] => {
  return attachments.filter(attachment => 
    attachment.source !== 'attachments' && 
    attachment.source !== 'pok' && 
    attachment.source !== 'base'
  );
};

// Group attachments by category
export const attachmentsByCategory = {
  researchFacilities: attachments.filter(a => 
    a.name.toLowerCase().includes('research facility')
  ),
  dmz: attachments.filter(a => 
    a.name.toLowerCase().includes('dmz') || 
    a.name.toLowerCase().includes('demilitarized')
  ),
  mining: attachments.filter(a => 
    a.name.toLowerCase().includes('mining') || 
    a.name.toLowerCase().includes('industrial')
  ),
  cultural: attachments.filter(a => 
    a.name.toLowerCase().includes('cultural') || 
    a.name.toLowerCase().includes('monument')
  ),
  other: attachments.filter(a => 
    !a.name.toLowerCase().includes('research facility') &&
    !a.name.toLowerCase().includes('dmz') &&
    !a.name.toLowerCase().includes('demilitarized') &&
    !a.name.toLowerCase().includes('mining') &&
    !a.name.toLowerCase().includes('industrial') &&
    !a.name.toLowerCase().includes('cultural') &&
    !a.name.toLowerCase().includes('monument')
  )
};

// Calculate total modifiers for a set of attachments
export const calculateTotalModifiers = (attachmentIds: string[]) => {
  const selectedAttachments = attachmentIds
    .map(id => getAttachmentById(id))
    .filter(a => a);
  
  return {
    resources: selectedAttachments.reduce((sum, a) => sum + (a?.resourcesModifier || 0), 0),
    influence: selectedAttachments.reduce((sum, a) => sum + (a?.influenceModifier || 0), 0),
    techSpecialities: Array.from(new Set(
      selectedAttachments.flatMap(a => a?.techSpeciality || [])
    ))
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
  
  console.log('Loading attachments data from TI4_map_generator_bot...');
  const attachments = loadAttachmentsData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(attachments);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total attachments extracted: ${attachments.length}`);
  
  // Type summary
  const typeCounts = {};
  attachments.forEach(attachment => {
    const type = attachment.attachmentType || 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('\n=== Attachments by Type ===');
  Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
  
  // Tech speciality summary
  const techCounts = { biotic: 0, cybernetic: 0, propulsion: 0, warfare: 0 };
  attachments.forEach(attachment => {
    if (attachment.techSpeciality) {
      attachment.techSpeciality.forEach(tech => {
        if (techCounts.hasOwnProperty(tech)) {
          techCounts[tech]++;
        }
      });
    }
  });
  
  console.log('\n=== Tech Specialities ===');
  Object.entries(techCounts).forEach(([tech, count]) => {
    console.log(`${tech}: ${count}`);
  });
  
  // Source summary
  const sourceCounts = {};
  attachments.forEach(attachment => {
    const source = attachment.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Attachments by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(`${source}: ${count}`);
    });
  
  console.log('\n✅ Attachments extraction complete!');
  console.log(`Generated: ${path.join(outputDir, 'index.ts')}`);
}

// Run the extraction
main();