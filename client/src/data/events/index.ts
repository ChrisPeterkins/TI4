// Events - extracted from TI4_map_generator_bot
// Generated: 2025-09-01T18:39:59.848Z

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

export const events: Event[] = [
  {
    "id": "baldrick_antiintellectual_revolution",
    "name": "Anti-Intellectual Revolution",
    "type": "Event",
    "text": "Each player may exhaust 1 planet for each 2 technologies they own (round up). If they do not, they return 1 technology to their reinforcements.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_battle_royale",
    "name": "Battle Royale",
    "type": "Event",
    "text": "Each player secretly chooses a number of their units on the gameboard from 0 to 10. Then, each player rolls 1 die for each selected unit. If the result equals the unit's combat value or higher, it is removed. If at least 5 total units are removed, the player who removes the most units in this way gains 1 victory point.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_cabinet_shuffle",
    "name": "Cabinet Shuffle",
    "type": "Event",
    "text": "The speaker may choose 1 public objective that has been scored by 0 players. Discard it and draw a new public objective from the same stage to replace it. If no valid target exists, each player may draw 1 action card.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_cavalcade",
    "name": "Cavalcade",
    "type": "Event",
    "text": "Each player randomly discards 3 action cards from their hand. Then, each player draws 2 action cards.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_acceleration_5000",
    "name": "Acceleration 5000",
    "type": "Event",
    "text": "Apply +1 to the move value of all ships for the remainder of this action phase. At the start of the status phase, discard this card.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_ansible_relays",
    "name": "Ansible Relays",
    "type": "Event",
    "text": "At the start of their turn, the active player may return 1 trade good to the supply. If they do, they may negotiate transactions with players who are not their neighbors during this turn.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_apotheosis",
    "name": "Apotheosis",
    "type": "Event",
    "text": "During the status phase, if 1 player reaches 10 (14) points, the game does not end. Instead, complete the entire status phase. The player with the most points at the end of the status phase wins the game. If more than 1 player is tied with the most points, the winner is determined by speaker order.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_bolide_flares",
    "name": "Bolide Flares",
    "type": "Event",
    "text": "When a player moves units into or through an asteroid field, the player must apply 1 hit to the moving ships.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_cloak_and_dagger",
    "name": "Cloak and Dagger",
    "type": "Event",
    "text": "Each player draws 1 secret objective.\nEach player can have 1 additional scored or unscored secret objective.  ",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_construction_initiative",
    "name": "Construction Initiative",
    "type": "Event",
    "text": "The PRODUCTION capacity of each space dock is increased by 1.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_dimensional_gateway",
    "name": "Dimensional Gateway",
    "type": "Event",
    "text": "Randomly draw 1 blue-backed tile. Place the system off the edge of the gameboard. Place an alpha, beta, and gamma wormhole token on the system.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_entrenchment",
    "name": "Entrenchment",
    "type": "Event",
    "text": "At the start of a ground combat, the defender may produce 1 hit and assign it to the attacker's ground forces.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_galactic_conference",
    "name": "Galactic Conference",
    "type": "Event",
    "text": "Each player may perform the secondary of a readied or unchosen strategy card without spending a command token; command tokens placed by the ability are placed from a player's reinforcements instead.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_good_tidings",
    "name": "Good Tidings",
    "type": "Event",
    "text": "Each player may choose one of the following:\n- gain 1 command token\n- gain 2 trade goods\n- produce up to 3 resources worth of units at one of their space docks in a system that does not contain a command token",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_halsefar_doctrine",
    "name": "Halsefar Doctrine",
    "type": "Event",
    "text": "Each player may perform the secondary of 1 readied or unchosen strategy card. Then, return all strategy cards to their readied state.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_hester's_belt",
    "name": "Hester's Belt",
    "type": "Event",
    "text": "The player with the highest combined resources/influence gains Hester's Belt. If multiple player are tied, roll for possession (highest roll wins). /nHester's Belt: At the end of the status phase, the owner of the belt may score 1 public objective if they qualify for it, draw 1 secret objective, or gain 2 command tokens. /nIf another player wins a combat against the owner of this card, they gain the card.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_intraspatial_fluxuation",
    "name": "Intraspatial Fluxuation",
    "type": "Event",
    "text": "The speaker rolls 1 die. If the result is 1-5, shift the position of each tile adjacent to Mecatol Rex one space clockwise. If the result is 6-10, shift the position of each tile adjacent to Mecatol Rex one space counter-clockwise.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_ixthian_artifact",
    "name": "Ixthian Artifact",
    "type": "Event",
    "text": "The speaker rolls 1 die. If the result is 6-10, each player may research 2 technologies. If the result is 1-5, destroy all units in Mecatol Rex's system, and each player with units in systems adjacent to Mecatol Rex's system destroys 3 of their units in each of those systems.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_ixthian_diadem",
    "name": "Ixthian Diadem",
    "type": "Event",
    "text": "The speaker rolls 1 die. If the result is 6-10, each player may research 2 technologies. If the result is 1-5, remove all units from Mecatol Rex and any planet in a system that is adjacent to the Mecatol Rex system. Return each of the affected planets to neutral status.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_ixthian_urn",
    "name": "Ixthian Urn",
    "type": "Event",
    "text": "The speaker rolls 1 die. If the result is 6-10, each player may research 1 technology.  If the result is 1-5, each player that controls a planet in a system adjacent to the Mecatol Rex system may explore that planet.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_mercenary_guilds",
    "name": "Mercenary Guilds",
    "type": "Event",
    "text": "- Draw a number of agents from unused factions equivalent to player count -1 and place 5 trade goods on each.\n- On their turn in the action phase, a player may purchase rights to the agent by spending resources equivalent to the number of trade goods on the agent. Remove the trade goods from the agent. \n- Once purchased, the agent ability is available to use at any time. Mercenary agents do not ready. Once used, they are discarded permanently.  \n- At the start of the turn of the player holding the Antiquities card, remove 1 trade good from each mercenary agent with 2 or more trade goods on it. ",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_mission_reset",
    "name": "Mission Reset",
    "type": "Event",
    "text": "Return all strategy cards. Starting with the player to the right of the speaker and moving in counter-clockwise order, players select new strategy cards.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_new_challenger",
    "name": "New Challenger",
    "type": "Event",
    "text": "Randomly draw 1 unused faction. Place the faction's starting fleet in the Mecatol Rex system and its starting ground forces on Mecatol Rex. Resolve any resulting combats. \n- If the Custodians point has not been scored, return the Custodians token to the supply. This point may no longer be scored.\n- If the faction's units remain in the system after combat, it will defend on future activations. \n- The faction does not use any faction abilities, and its units cannot leave the Mecatol Rex system.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_overproduction",
    "name": "Overproduction",
    "type": "Event",
    "text": "Each player's commodity value is reduced by 1. Then, each player refreshes their commodities.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_pirate_strike",
    "name": "Pirate Strike",
    "type": "Event",
    "text": "- In each system that contains exactly 1 non-fighter ship, destroy all ships in that system. \n- Each player must return 1 TG to the supply for each 4 TGs on their faction sheet (round up).",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_race_for_the_prize",
    "name": "Race for the Prize",
    "type": "Event",
    "text": "At the start of their turn, a player may perform 1 component action. Component actions do not constitute an action; if a player does not take a tactical or strategic action on their turn, they must pass.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_recharge",
    "name": "Recharge",
    "type": "Event",
    "text": "Each player may remove 1 of their command tokens from the board.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_research_networks",
    "name": "Research Networks",
    "type": "Event",
    "text": "The player with the fewest technologies may research 1 technology. The player with the most technologies may gain 3 trade goods.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_research_spinoffs",
    "name": "Research Spinoffs",
    "type": "Event",
    "text": "Each player may return one technology to their reinforcements. If they do, they may research a technology with the same number of prerequisites or fewer.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_revolt",
    "name": "Revolt",
    "type": "Event",
    "text": "Roll 1 die for each non-home planet that contains 3+ ground forces. On a result of 1-7, the owner must either spend 1 resource or destroy half the ground forces on the planet (round up). On a result of 8-10, destroy all ground forces on the planet and return it to a neutral status.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_rising_empire",
    "name": "Rising Empire",
    "type": "Event",
    "text": "- If no player has more than 4 points, each player gains 1 victory point. \n- If at least 1 player has more than 4 points, each player may place a ship with a cost of 4 or less from their reinforcements in a system that contains 1 or more of their ships.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_shared_research",
    "name": "Shared Research",
    "type": "Event",
    "text": "Each player's units can move through nebulae.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_tangled_wires",
    "name": "Tangled Wires",
    "type": "Event",
    "text": "Each player may place a command token from their reinforcements on their home system. If they do not, or if the system already contains one of their command tokens, they must remove two of their non-fighter ships from the gameboard.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_theodolite_surveillance",
    "name": "Theodolite Surveillance",
    "type": "Event",
    "text": "Each player may explore 1 planet they control.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_total_war",
    "name": "Total War",
    "type": "Event",
    "text": "At the start of the status phase, if a player controls all the planets in their home system and at least one planet in 2 other different players' home systems, they win the game.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_twilight_of_the_idols",
    "name": "Twilight of the Idols",
    "type": "Event",
    "text": "Each player must remove 1 of their non-fighter ships from the gameboard for each objective they have scored.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_weapon_schematics_leak",
    "name": "Weapon Schematics Leak",
    "type": "Event",
    "text": "All players may ignore all prerequisites on war sun technologies.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_wormhole_instability",
    "name": "Wormhole Instability",
    "type": "Event",
    "text": "Each player that has at least 1 non-fighter ship in a wormhole must destroy 1 of their non-fighter ships in each system that contains a wormhole. For each ship that was destroyed, its owner gains one command token",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_wormhole_reconstruction",
    "name": "Wormhole Reconstruction",
    "type": "Event",
    "text": "All systems that contain either an alpha or beta wormhole are adjacent to each other.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  },
  {
    "id": "baldrick_wormhole_research",
    "name": "Wormhole Research",
    "type": "Event",
    "text": "Destroy all ships in systems that contain an alpha or beta wormhole. Then, players who destroyed ships may:\n- Research 1 technology if they destroyed 1-3 non-fighter ships.\n- Research 2 technologies if they destroyed 4-7 non-fighter ships.\n- Research 3 technologies if they destroyed 8+ non-fighter ships.",
    "effect": null,
    "flavor": null,
    "window": null,
    "trigger": null,
    "phase": null,
    "requirement": null,
    "prerequisite": null,
    "choices": [],
    "options": [],
    "target": null,
    "scope": null,
    "affectsAllPlayers": false,
    "source": "ignis_aurora",
    "expansion": null,
    "imagePath": null,
    "persistent": false,
    "oneTimeUse": true,
    "homebrewReplacesID": null
  }
];

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
