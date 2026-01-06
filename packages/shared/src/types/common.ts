// Common types used throughout the application

export type UUID = string;

export type PlayerColor =
  | 'red'
  | 'blue'
  | 'yellow'
  | 'green'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'black';

export type TechColor = 'blue' | 'red' | 'green' | 'yellow';

export type Expansion = 'base' | 'pok' | 'codex1' | 'codex2' | 'codex3' | 'codex4' | 'thunders_edge';

export type PlanetTrait = 'cultural' | 'hazardous' | 'industrial';

export type WormholeType = 'alpha' | 'beta' | 'gamma' | 'delta' | 'epsilon';

export type AnomalyType = 'asteroid' | 'nebula' | 'supernova' | 'gravity_rift' | 'entropic_scar';

export type UnitType =
  | 'fighter'
  | 'infantry'
  | 'mech'
  | 'destroyer'
  | 'carrier'
  | 'cruiser'
  | 'dreadnought'
  | 'war_sun'
  | 'flagship'
  | 'pds'
  | 'space_dock';

export type CardType =
  | 'action'
  | 'agenda'
  | 'objective_public_1'
  | 'objective_public_2'
  | 'objective_secret'
  | 'promissory'
  | 'exploration'
  | 'relic';

export interface HexCoord {
  q: number;
  r: number;
}

export interface DiceRoll {
  unitId: string;
  unitType: UnitType;
  roll: number;
  combatValue: number;
  hit: boolean;
  modifiers: string[];
}

/**
 * Timing triggers for action cards and abilities
 * These define when cards/abilities can be played
 */
export type TimingTrigger =
  // Action card specific
  | 'action_card_played'       // When another action card is played (Sabotage)
  | 'sabotage_played'          // When Sabotage is played (counter-Sabotage)

  // Combat triggers
  | 'space_combat_start'       // Start of space combat
  | 'ground_combat_start'      // Start of ground combat
  | 'combat_round_start'       // Start of any combat round
  | 'combat_round_end'         // End of any combat round
  | 'before_combat_rolls'      // Before dice are rolled in combat
  | 'after_combat_rolls'       // After dice are rolled
  | 'hits_assigned'            // After hits are assigned
  | 'unit_destroyed'           // When a unit is destroyed
  | 'ship_sustains_damage'     // When a ship sustains damage
  | 'combat_end'               // At end of combat

  // Combat sub-phases
  | 'before_afb'               // Before Anti-Fighter Barrage
  | 'after_afb'                // After Anti-Fighter Barrage
  | 'before_bombardment'       // Before bombardment
  | 'after_bombardment'        // After bombardment
  | 'before_space_cannon'      // Before space cannon fire
  | 'after_space_cannon'       // After space cannon fire

  // Tactical action triggers
  | 'system_activated'         // When a system is activated
  | 'movement_start'           // Start of movement step
  | 'movement_end'             // After movement complete
  | 'production_start'         // Start of production
  | 'production_end'           // After production

  // Invasion triggers
  | 'invasion_start'           // Start of invasion
  | 'before_ground_forces_commit' // Before committing ground forces
  | 'after_ground_forces_commit'  // After committing ground forces

  // Agenda triggers
  | 'agenda_revealed'          // When an agenda is revealed
  | 'after_agenda_revealed'    // After agenda revealed (for riders)
  | 'before_voting'            // Before voting begins
  | 'after_voting'             // After voting complete
  | 'agenda_resolved'          // When agenda outcome is resolved

  // Strategy card triggers
  | 'strategy_card_played'     // When a strategy card is used
  | 'after_strategy_primary'   // After primary resolved
  | 'before_strategy_secondary' // Before secondary resolution
  | 'after_strategy_secondary' // After secondary resolved

  // Phase triggers
  | 'action_phase_start'       // Start of action phase
  | 'status_phase_start'       // Start of status phase
  | 'agenda_phase_start'       // Start of agenda phase
  | 'status_phase_end'         // End of status phase

  // Turn triggers
  | 'start_of_turn'            // Start of a player's turn
  | 'end_of_turn'              // End of a player's turn

  // Miscellaneous
  | 'technology_researched'    // When technology is researched
  | 'planet_gained'            // When a planet is gained
  | 'planet_lost'              // When a planet is lost
  | 'trade_goods_gained'       // When trade goods are gained
  | 'commodities_replenished'; // When commodities are replenished
