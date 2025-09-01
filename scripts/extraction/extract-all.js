#!/usr/bin/env node

/**
 * Master extraction script for TI4 data
 * Extracts and converts data from all source repositories
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Color output for console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function extractAll() {
  log('🚀 Starting TI4 Data Extraction Pipeline', 'bright');
  
  try {
    // 1. Check if source repositories exist
    log('\n📦 Checking source repositories...', 'blue');
    const sourcesPath = path.join(__dirname, '../../sources');
    const repos = [
      'ti4_web_new',
      'TwilightImperiumUltimate',
      'ti4calc',
      'ti4',
      'von-grid',
      'TI4_map_generator_bot'
    ];
    
    for (const repo of repos) {
      const repoPath = path.join(sourcesPath, repo);
      try {
        await fs.access(repoPath);
        log(`  ✅ ${repo} found`, 'green');
      } catch {
        log(`  ❌ ${repo} not found - please clone it first`, 'red');
        process.exit(1);
      }
    }
    
    // 2. Extract TypeScript types from AsyncTI4
    log('\n📝 Extracting TypeScript types from AsyncTI4...', 'blue');
    await require('./extract-asyncti4-data')();
    
    // 3. Convert C# data from TwilightImperiumUltimate
    log('\n🔄 Converting C# data from TwilightImperiumUltimate...', 'blue');
    await require('./extract-ultimate-data')();
    
    // 4. Port combat engine from ti4calc
    log('\n⚔️ Porting combat engine from ti4calc...', 'blue');
    await require('./port-combat-engine')();
    
    // 5. Extract map generation from KeeganW/ti4
    log('\n🗺️ Extracting map generation algorithms...', 'blue');
    await require('./extract-map-generator')();
    
    // 6. Copy von-grid library
    log('\n🎲 Installing von-grid hexagonal math...', 'blue');
    await require('./install-von-grid')();
    
    // 7. Validate extracted data
    log('\n✅ Validating extracted data...', 'blue');
    await require('./validate-data')();
    
    log('\n✨ Extraction complete!', 'green');
    log('📊 Summary:', 'bright');
    log('  - TypeScript types extracted', 'green');
    log('  - Game data converted from C#', 'green');
    log('  - Combat engine ported', 'green');
    log('  - Map generation extracted', 'green');
    log('  - Hexagonal math library installed', 'green');
    log('  - All data validated', 'green');
    
  } catch (error) {
    log(`\n❌ Extraction failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  extractAll().catch(console.error);
}

module.exports = extractAll;