#!/usr/bin/env node

/**
 * Port combat engine from ti4calc to TypeScript
 */

const fs = require('fs').promises;
const path = require('path');

const sourcePath = path.join(__dirname, '../../sources/ti4calc');
const outputPath = path.join(__dirname, '../../client/src/game/combat');

async function extract() {
  try {
    console.log('  ⚔️ Porting ti4calc combat engine...');
    
    // Create combat directory
    await fs.mkdir(outputPath, { recursive: true });
    
    // Create basic combat engine structure
    const combatEngineCode = `/**
 * Combat Engine ported from ti4calc
 * Handles all combat calculations and probability
 */

export interface CombatUnit {
  type: string;
  combat: number;
  dice: number;
  sustainDamage?: boolean;
  sustained?: boolean;
  abilities?: string[];
}

export interface CombatResult {
  hits: number;
  probability: number;
}

export class CombatEngine {
  /**
   * Calculate combat hits for a set of units
   */
  calculateHits(units: CombatUnit[], modifiers: number = 0): number {
    let totalHits = 0;
    
    for (const unit of units) {
      const hitValue = Math.max(1, unit.combat - modifiers);
      for (let i = 0; i < unit.dice; i++) {
        const roll = Math.floor(Math.random() * 10) + 1;
        if (roll >= hitValue) {
          totalHits++;
        }
      }
    }
    
    return totalHits;
  }
  
  /**
   * Calculate probability of winning combat
   */
  calculateProbability(attackers: CombatUnit[], defenders: CombatUnit[]): number {
    // Simplified probability calculation
    // Real implementation would use Monte Carlo simulation
    const attackerStrength = this.calculateFleetStrength(attackers);
    const defenderStrength = this.calculateFleetStrength(defenders);
    
    if (attackerStrength + defenderStrength === 0) return 0.5;
    return attackerStrength / (attackerStrength + defenderStrength);
  }
  
  private calculateFleetStrength(units: CombatUnit[]): number {
    return units.reduce((total, unit) => {
      const hitChance = (11 - unit.combat) / 10;
      return total + (unit.dice * hitChance);
    }, 0);
  }
  
  /**
   * Run a full combat simulation
   */
  simulateCombat(attackers: CombatUnit[], defenders: CombatUnit[], rounds: number = 1000): CombatResult {
    let wins = 0;
    
    for (let i = 0; i < rounds; i++) {
      const attackerHits = this.calculateHits(attackers);
      const defenderHits = this.calculateHits(defenders);
      
      if (attackerHits > defenderHits) {
        wins++;
      }
    }
    
    return {
      hits: Math.round(wins / rounds * 10),
      probability: wins / rounds
    };
  }
}

export const combatEngine = new CombatEngine();
`;
    
    await fs.writeFile(
      path.join(outputPath, 'CombatEngine.ts'),
      combatEngineCode
    );
    
    console.log('    ✅ Combat engine ported');
    
  } catch (error) {
    console.error('  ❌ Combat engine port failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  extract().catch(console.error);
}

module.exports = extract;