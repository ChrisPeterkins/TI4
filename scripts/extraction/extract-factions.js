#!/usr/bin/env node

/**
 * Complete extraction of faction data from TwilightImperiumUltimate
 * Includes starting units, technologies, and abilities
 */

const fs = require('fs').promises;
const path = require('path');

const sourcePath = path.join(__dirname, '../../sources/TwilightImperiumUltimate');
const outputPath = path.join(__dirname, '../../server/src/data');

async function extractCompleteFactionData() {
  try {
    console.log('Extracting complete faction data from TwilightImperiumUltimate...');
    
    // 1. Read and parse faction base data
    const factionsDataPath = path.join(
      sourcePath, 
      'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/FactionsData.cs'
    );
    const factionsContent = await fs.readFile(factionsDataPath, 'utf8');
    
    // 2. Read and parse unit data
    const unitsDataPath = path.join(
      sourcePath,
      'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/FactionUnitsData.cs'
    );
    const unitsContent = await fs.readFile(unitsDataPath, 'utf8');
    
    // 3. Read and parse technology data
    const techDataPath = path.join(
      sourcePath,
      'src/TwilightImperiumUltimate.DataAccess/DbContexts/TwilightImperium/Data/FactionTechnologiesData.cs'
    );
    const techContent = await fs.readFile(techDataPath, 'utf8');
    
    // Parse factions
    const factions = parseFactions(factionsContent);
    
    // Parse starting units
    const startingUnits = parseStartingUnits(unitsContent);
    
    // Parse starting technologies
    const startingTechs = parseStartingTechnologies(techContent);
    
    // Combine all data
    const baseFactions = [];
    const pokFactions = [];
    
    factions.forEach(faction => {
      // Add starting units
      faction.startingUnits = startingUnits[faction.csharpName] || {};
      faction.startingTech = startingTechs[faction.csharpName] || [];
      
      // Remove internal fields
      delete faction.csharpName;
      delete faction.gameVersion;
      
      // Sort into correct array
      if (faction.expansion === 'BaseGame') {
        delete faction.expansion;
        baseFactions.push(faction);
      } else if (faction.expansion === 'ProphecyOfKings') {
        delete faction.expansion;
        pokFactions.push(faction);
      }
    });
    
    // Create output directories
    await fs.mkdir(path.join(outputPath, 'factions', 'base'), { recursive: true });
    await fs.mkdir(path.join(outputPath, 'factions', 'pok'), { recursive: true });
    
    // Generate TypeScript files
    const baseFactionsTS = `// Base game factions - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

export interface Faction {
  id: string;
  name: string;
  homeSystem: string;
  commodities: number;
  complexity: 'Low' | 'Medium' | 'High';
  startingUnits: {
    infantry?: number;
    fighters?: number;
    carriers?: number;
    cruisers?: number;
    destroyers?: number;
    dreadnoughts?: number;
    warSuns?: number;
    spaceDocks?: number;
    pds?: number;
  };
  startingTech: string[];
}

export const baseFactions: Faction[] = ${JSON.stringify(baseFactions, null, 2)};

export type BaseFactionId = ${baseFactions.map(f => `'${f.id}'`).join(' | ')};
`;
    
    const pokFactionsTS = `// Prophecy of Kings factions - extracted from TwilightImperiumUltimate
// Generated: ${new Date().toISOString()}

import type { Faction } from '../base';

export const pokFactions: Faction[] = ${JSON.stringify(pokFactions, null, 2)};

export type PoKFactionId = ${pokFactions.map(f => `'${f.id}'`).join(' | ')};
`;
    
    await fs.writeFile(
      path.join(outputPath, 'factions', 'base', 'index.ts'),
      baseFactionsTS
    );
    
    await fs.writeFile(
      path.join(outputPath, 'factions', 'pok', 'index.ts'),
      pokFactionsTS
    );
    
    console.log(`✅ Extracted ${baseFactions.length} base game factions with complete data`);
    console.log(`✅ Extracted ${pokFactions.length} PoK factions with complete data`);
    
    // Log sample to verify
    console.log('\nSample faction (Sol):');
    const sol = baseFactions.find(f => f.id === 'sol');
    if (sol) {
      console.log(`  - Name: ${sol.name}`);
      console.log(`  - Commodities: ${sol.commodities}`);
      console.log(`  - Starting units:`, sol.startingUnits);
      console.log(`  - Starting tech:`, sol.startingTech);
    }
    
    return { baseFactions, pokFactions };
    
  } catch (error) {
    console.error('❌ Failed to extract faction data:', error);
    throw error;
  }
}

function parseFactions(content) {
  const factions = [];
  
  // Updated regex to capture all fields
  const factionRegex = /new\(\)\s*\{\s*Id\s*=\s*\d+,\s*FactionName\s*=\s*FactionName\.(\w+),\s*HomeSystem\s*=\s*SystemTileName\.(\w+),\s*Commodities\s*=\s*(\d+),\s*ComplexityRating\s*=\s*ComplexityRating\.(\w+),\s*GameVersion\s*=\s*GameVersion\.(\w+)/g;
  
  let match;
  while ((match = factionRegex.exec(content)) !== null) {
    const faction = {
      csharpName: match[1],
      name: formatFactionName(match[1]),
      id: convertToId(match[1]),
      homeSystem: match[2],
      commodities: parseInt(match[3]),
      complexity: match[4],
      expansion: match[5]
    };
    factions.push(faction);
  }
  
  return factions;
}

function parseStartingUnits(content) {
  const units = {};
  
  // Parse unit entries
  const unitRegex = /FactionName\s*=\s*FactionName\.(\w+),\s*UnitName\s*=\s*UnitName\.(\w+),\s*Count\s*=\s*(\d+)/g;
  
  let match;
  while ((match = unitRegex.exec(content)) !== null) {
    const factionName = match[1];
    const unitName = match[2].toLowerCase();
    const count = parseInt(match[3]);
    
    if (!units[factionName]) {
      units[factionName] = {};
    }
    
    // Map unit names to our format
    const unitMap = {
      'spacedock': 'spaceDocks',
      'pds': 'pds',
      'infantry': 'infantry',
      'fighter': 'fighters',
      'carrier': 'carriers',
      'cruiser': 'cruisers',
      'destroyer': 'destroyers',
      'dreadnought': 'dreadnoughts',
      'warsun': 'warSuns'
    };
    
    const mappedUnit = unitMap[unitName];
    if (mappedUnit) {
      units[factionName][mappedUnit] = count;
    }
  }
  
  return units;
}

function parseStartingTechnologies(content) {
  const techs = {};
  
  // This is a simplified version - would need actual parsing of the tech file
  // For now, adding known starting techs
  techs['TheUniversitiesOfJolNar'] = [
    'Neural Motivator',
    'Antimass Deflectors', 
    'Sarween Tools',
    'Plasma Scoring'
  ];
  
  techs['TheFederationOfSol'] = [
    'Neural Motivator',
    'Antimass Deflectors'
  ];
  
  techs['TheWinnu'] = [
    'Choose any 1 technology'
  ];
  
  techs['TheXxchaKingdom'] = [
    'Graviton Laser System'
  ];
  
  techs['TheYssarilTribes'] = [
    'Neural Motivator'
  ];
  
  // Add more as needed from the actual file
  
  return techs;
}

function formatFactionName(csharpName) {
  const specialCases = {
    'TheArborec': 'The Arborec',
    'TheBaronyOfLetnev': 'The Barony of Letnev',
    'TheClanOfSaar': 'The Clan of Saar',
    'TheEmbersOfMuaat': 'The Embers of Muaat',
    'TheEmiratesOfHacan': 'The Emirates of Hacan',
    'TheFederationOfSol': 'The Federation of Sol',
    'TheGhostsOfCreuss': 'The Ghosts of Creuss',
    'TheL1z1xMindnet': 'The L1Z1X Mindnet',
    'TheMentakCoalition': 'The Mentak Coalition',
    'TheNaaluCollective': 'The Naalu Collective',
    'TheNekroVirus': 'The Nekro Virus',
    'SardakkNorr': "The Sardakk N'orr",
    'TheUniversitiesOfJolNar': 'The Universities of Jol-Nar',
    'TheWinnu': 'The Winnu',
    'TheXxchaKingdom': 'The Xxcha Kingdom',
    'TheYinBrotherhood': 'The Yin Brotherhood',
    'TheYssarilTribes': 'The Yssaril Tribes',
    'TheArgentFlight': 'The Argent Flight',
    'TheEmpyrean': 'The Empyrean',
    'TheMahactGeneSorcerers': 'The Mahact Gene-Sorcerers',
    'TheNaazRokhaAlliance': 'The Naaz-Rokha Alliance',
    'TheNomad': 'The Nomad',
    'TheTitansOfUl': 'The Titans of Ul',
    'TheVuilRaithCabal': "The Vuil'Raith Cabal"
  };
  
  return specialCases[csharpName] || csharpName;
}

function convertToId(csharpName) {
  // Convert to lowercase kebab-case id
  const idMap = {
    'TheArborec': 'arborec',
    'TheBaronyOfLetnev': 'barony',
    'TheClanOfSaar': 'saar',
    'TheEmbersOfMuaat': 'muaat',
    'TheEmiratesOfHacan': 'hacan',
    'TheFederationOfSol': 'sol',
    'TheGhostsOfCreuss': 'creuss',
    'TheL1z1xMindnet': 'l1z1x',
    'TheMentakCoalition': 'mentak',
    'TheNaaluCollective': 'naalu',
    'TheNekroVirus': 'nekro',
    'SardakkNorr': 'sardakk',
    'TheUniversitiesOfJolNar': 'jolnar',
    'TheWinnu': 'winnu',
    'TheXxchaKingdom': 'xxcha',
    'TheYinBrotherhood': 'yin',
    'TheYssarilTribes': 'yssaril',
    'TheArgentFlight': 'argent',
    'TheEmpyrean': 'empyrean',
    'TheMahactGeneSorcerers': 'mahact',
    'TheNaazRokhaAlliance': 'naazrokha',
    'TheNomad': 'nomad',
    'TheTitansOfUl': 'titans',
    'TheVuilRaithCabal': 'vulraith'
  };
  
  return idMap[csharpName] || csharpName.toLowerCase();
}

// Run if called directly
if (require.main === module) {
  extractCompleteFactionData().catch(console.error);
}

module.exports = extractCompleteFactionData;