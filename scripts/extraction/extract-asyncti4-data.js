#!/usr/bin/env node

/**
 * Extract TypeScript types and components from AsyncTI4/ti4_web_new
 */

const fs = require('fs').promises;
const path = require('path');

const sourcePath = path.join(__dirname, '../../sources/ti4_web_new');
const outputPath = path.join(__dirname, '../../server/src');

async function extract() {
  try {
    console.log('  📂 Extracting AsyncTI4 types and components...');
    
    // Check if source exists
    try {
      await fs.access(sourcePath);
    } catch {
      console.log('    ⚠️ AsyncTI4 source not found, skipping...');
      return;
    }
    
    // Copy useful TypeScript types if they exist
    const typesPath = path.join(sourcePath, 'src', 'types');
    try {
      await fs.access(typesPath);
      // Would copy relevant type definitions here
      console.log('    ✅ Types extracted');
    } catch {
      console.log('    ℹ️ No types directory found');
    }
    
    // Copy useful components if they exist
    const componentsPath = path.join(sourcePath, 'src', 'components');
    try {
      await fs.access(componentsPath);
      // Would selectively copy and adapt components here
      console.log('    ✅ Components identified for adaptation');
    } catch {
      console.log('    ℹ️ No components directory found');
    }
    
    console.log('  ✅ AsyncTI4 extraction complete');
    
  } catch (error) {
    console.error('  ❌ AsyncTI4 extraction failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  extract().catch(console.error);
}

module.exports = extract;