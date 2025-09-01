const fs = require('fs');
const path = require('path');

// Source paths
const eventsSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/events');
const outputDir = path.join(__dirname, '../../client/src/data/events');

// Load and process events data
function loadEventsData() {
  const allEvents = [];
  
  // Get all JSON files in the events directory
  const files = fs.readdirSync(eventsSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(eventsSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      // Handle both array and single object formats
      const eventsArray = Array.isArray(data) ? data : [data];
      
      eventsArray.forEach(event => {
        const processedEvent = {
          id: event.id || event.alias,
          name: event.name,
          type: event.type || 'event',
          
          // Event text and effects
          text: event.text || event.description || null,
          effect: event.effect || null,
          flavor: event.flavor || event.flavorText || null,
          
          // Timing and triggers
          window: event.window || null,
          trigger: event.trigger || null,
          phase: event.phase || null,
          
          // Requirements
          requirement: event.requirement || null,
          prerequisite: event.prerequisite || null,
          
          // Choices and options
          choices: event.choices || [],
          options: event.options || [],
          
          // Target and scope
          target: event.target || null,
          scope: event.scope || null,
          affectsAllPlayers: event.affectsAllPlayers || false,
          
          // Source tracking
          source: event.source || sourceName,
          expansion: event.expansion || null,
          
          // Additional properties
          imagePath: event.imagePath || null,
          persistent: event.persistent || false,
          oneTimeUse: event.oneTimeUse || true,
          
          // Homebrew tracking
          homebrewReplacesID: event.homebrewReplacesID || null
        };
        
        allEvents.push(processedEvent);
      });
    } catch (error) {
      console.warn(`Error reading ${filename}:`, error.message);
    }
  });
  
  return allEvents;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Events - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface Event {
  id: string;
  name: string;
  type?: string;
  
  // Event text and effects
  text?: string | null;
  effect?: string | null;
  flavor?: string | null;
  
  // Timing and triggers
  window?: string | null;
  trigger?: string | null;
  phase?: string | null;
  
  // Requirements
  requirement?: string | null;
  prerequisite?: string | null;
  
  // Choices and options
  choices?: EventChoice[];
  options?: EventOption[];
  
  // Target and scope
  target?: string | null;
  scope?: string | null;
  affectsAllPlayers?: boolean;
  
  // Source tracking
  source: string;
  expansion?: string | null;
  
  // Additional properties
  imagePath?: string | null;
  persistent?: boolean;
  oneTimeUse?: boolean;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export interface EventChoice {
  id: string;
  text: string;
  effect: string;
  cost?: string;
}

export interface EventOption {
  id: string;
  text: string;
  result: string;
}

export type EventType = 
  | 'event'
  | 'agenda_event'
  | 'combat_event'
  | 'exploration_event'
  | 'status_event';

export type EventPhase = 
  | 'action'
  | 'status'
  | 'agenda'
  | 'strategy'
  | 'combat';
`;
}

// Generate main index file
function generateMainIndex(events) {
  let content = generateTypeScriptInterface();
  
  content += `
export const events: Event[] = ${JSON.stringify(events, null, 2)};

// Helper functions
export const getEventById = (id: string): Event | undefined => {
  return events.find(event => event.id === id);
};

export const getEventByName = (name: string): Event | undefined => {
  return events.find(event => 
    event.name.toLowerCase() === name.toLowerCase()
  );
};

export const getEventsByType = (type: string): Event[] => {
  return events.filter(event => event.type === type);
};

export const getEventsByPhase = (phase: string): Event[] => {
  return events.filter(event => 
    event.phase?.toLowerCase() === phase.toLowerCase()
  );
};

export const getEventsByWindow = (window: string): Event[] => {
  return events.filter(event => 
    event.window?.toLowerCase().includes(window.toLowerCase())
  );
};

export const getPersistentEvents = (): Event[] => {
  return events.filter(event => event.persistent);
};

export const getOneTimeEvents = (): Event[] => {
  return events.filter(event => event.oneTimeUse);
};

export const getEventsAffectingAllPlayers = (): Event[] => {
  return events.filter(event => event.affectsAllPlayers);
};

export const searchEvents = (searchTerm: string): Event[] => {
  const term = searchTerm.toLowerCase();
  return events.filter(event => 
    event.name.toLowerCase().includes(term) ||
    event.text?.toLowerCase().includes(term) ||
    event.effect?.toLowerCase().includes(term) ||
    event.flavor?.toLowerCase().includes(term)
  );
};

// Get official vs homebrew events
export const getOfficialEvents = (): Event[] => {
  return events.filter(event => 
    event.source === 'base' || 
    event.source === 'pok' ||
    event.source === 'ignis_aurora'
  );
};

export const getHomebrewEvents = (): Event[] => {
  return events.filter(event => 
    event.source !== 'base' && 
    event.source !== 'pok' &&
    event.source !== 'ignis_aurora'
  );
};

// Group events by timing
export const eventsByTiming = {
  actionPhase: events.filter(e => e.phase === 'action'),
  statusPhase: events.filter(e => e.phase === 'status'),
  agendaPhase: events.filter(e => e.phase === 'agenda'),
  strategyPhase: events.filter(e => e.phase === 'strategy'),
  combatEvents: events.filter(e => e.phase === 'combat' || e.window?.includes('combat')),
  anytime: events.filter(e => !e.phase && !e.window)
};

// Get events with choices
export const getEventsWithChoices = (): Event[] => {
  return events.filter(event => 
    event.choices && event.choices.length > 0
  );
};

// Get events with specific requirements
export const getEventsWithRequirements = (): Event[] => {
  return events.filter(event => 
    event.requirement || event.prerequisite
  );
};

// Check if an event can be triggered
export const canTriggerEvent = (event: Event, currentPhase: string): boolean => {
  if (event.phase && event.phase !== currentPhase) {
    return false;
  }
  
  if (event.window && !event.window.toLowerCase().includes(currentPhase.toLowerCase())) {
    return false;
  }
  
  return true;
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
  
  console.log('Loading events data from TI4_map_generator_bot...');
  const events = loadEventsData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(events);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log(`Total events extracted: ${events.length}`);
  
  // Type summary
  const typeCounts = {};
  events.forEach(event => {
    const type = event.type || 'event';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('\n=== Events by Type ===');
  Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });
  
  // Phase summary
  const phaseCounts = {};
  events.forEach(event => {
    const phase = event.phase || 'any';
    phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
  });
  
  console.log('\n=== Events by Phase ===');
  Object.entries(phaseCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([phase, count]) => {
      console.log(`${phase}: ${count}`);
    });
  
  // Source summary
  const sourceCounts = {};
  events.forEach(event => {
    const source = event.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n=== Events by Source ===');
  Object.entries(sourceCounts)
    .sort(([a], [b]) => b - a)
    .forEach(([source, count]) => {
      console.log(`${source}: ${count}`);
    });
  
  console.log('\n✅ Events extraction complete!');
  console.log(`Generated: ${path.join(outputDir, 'index.ts')}`);
}

// Run the extraction
main();