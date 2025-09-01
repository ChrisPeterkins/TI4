#!/usr/bin/env node

/**
 * Validate all extracted data
 */

const fs = require('fs').promises;
const path = require('path');

async function validate() {
  try {
    console.log('  ✅ Validating extracted data...');
    
    const errors = [];
    const warnings = [];
    
    // Check if key directories exist
    const requiredDirs = [
      'client/src/data/factions',
      'client/src/data/technologies',
      'client/src/game/combat',
      'client/src/game/map',
      'client/src/three/geometry',
    ];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(__dirname, '../..', dir);
      try {
        await fs.access(dirPath);
        console.log(`    ✅ ${dir} exists`);
      } catch {
        errors.push(`Missing directory: ${dir}`);
      }
    }
    
    // Check if key files exist
    const requiredFiles = [
      'client/src/game/combat/CombatEngine.ts',
      'client/src/game/map/MapGenerator.ts',
      'client/src/three/geometry/HexGrid.ts',
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '../..', file);
      try {
        await fs.access(filePath);
        console.log(`    ✅ ${file} exists`);
      } catch {
        warnings.push(`Missing file: ${file}`);
      }
    }
    
    // Report results
    if (errors.length > 0) {
      console.log('  ❌ Validation errors:');
      errors.forEach(err => console.log(`    - ${err}`));
      throw new Error('Validation failed');
    }
    
    if (warnings.length > 0) {
      console.log('  ⚠️ Validation warnings:');
      warnings.forEach(warn => console.log(`    - ${warn}`));
    }
    
    console.log('  ✅ Data validation complete');
    
  } catch (error) {
    console.error('  ❌ Validation failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  validate().catch(console.error);
}

module.exports = validate;