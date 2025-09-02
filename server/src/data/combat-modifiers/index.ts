// Combat Modifiers - extracted from TI4_map_generator_bot
// Generated: 2025-09-01T18:44:39.047Z

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

export const combatModifiers: CombatModifier[] = [
  {
    "alias": "plus3_1combat_all",
    "type": "DIE_MOD",
    "value": "+3",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ONE_COMBAT",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "action_cards",
        "alias": "close_quarters"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus3_1combat_all_opponent",
    "type": "DIE_MOD",
    "value": "+3",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": true,
    "applyToSelf": true,
    "persistenceType": "ONE_COMBAT",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "action_cards",
        "alias": "close_quarters"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus4_bombard",
    "type": "DIE_MOD",
    "value": "-4",
    "scope": null,
    "forCombatAbility": "bombardment",
    "applyToOpponent": true,
    "applyToSelf": true,
    "persistenceType": "ONE_TACTICAL_ACTION",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "action_cards",
        "alias": "bunker"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_1tacticalaction_all",
    "type": "DIE_MOD",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ONE_TACTICAL_ACTION",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "vaylerianhero"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_mechs_naaz_flagship",
    "type": "extrarolls",
    "value": "+1",
    "scope": "mf",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "naazFS",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": "Naaz Mechs get +1 die due to Flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_mechs_naaz_sigma_flagship",
    "type": "mods",
    "value": "+1",
    "scope": "mf",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_naazrokha_flagship_1"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_1round_all",
    "type": "DIE_MOD",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ONE_ROUND",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "tech",
        "alias": "sc"
      },
      {
        "type": "action_cards",
        "alias": "morale_boost_ds"
      },
      {
        "type": "action_cards",
        "alias": "mb1"
      },
      {
        "type": "action_cards",
        "alias": "mb2"
      },
      {
        "type": "action_cards",
        "alias": "mb3"
      },
      {
        "type": "action_cards",
        "alias": "mb4"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_1round_fighter",
    "type": "DIE_MOD",
    "value": "+2",
    "scope": "ff",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ONE_ROUND",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "action_cards",
        "alias": "f_prototype"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus_1_opponent_tekklar_player_owner",
    "type": "mods",
    "value": "-1",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "opponent_tekklar_player_owner",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": "If your opponent is the N'orr player, apply -1 to the result of each of their unit's combat rolls during this combat."
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_1invasion_combat",
    "type": "DIE_MOD",
    "value": "+1",
    "scope": "_groundforce_",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ONE_COMBAT",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "promissory_notes",
        "alias": "tekklar"
      },
      {
        "type": "promissory_notes",
        "alias": "sigma_tekklar_legion"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_1combat_fighter",
    "type": "DIE_MOD",
    "value": "+1",
    "scope": "ff",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ONE_COMBAT",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "promissory_notes",
        "alias": "dspnkjal"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus1_mod_pds_off_opponent_antimatter",
    "type": "mods",
    "value": "-1",
    "scope": null,
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "opponent_tech",
        "alias": "amd"
      },
      {
        "type": "opponent_tech",
        "alias": "absol_amd"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus2_mod_pds_off_opponent_antimass",
    "type": "mods",
    "value": "-1",
    "scope": null,
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "opponent_tech",
        "alias": "baldrick_amd"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "jolnar_bonus_hits_9_10",
    "type": "bonus_hits",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "jolnar_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_plasmascoring_spacecannon_off",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "tech",
        "alias": "ps"
      },
      {
        "type": "tech",
        "alias": "absol_ps"
      },
      {
        "type": "tech",
        "alias": "baldrick_ps"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus1_mod_pds_def_opponent_antimatter",
    "type": "mods",
    "value": "-1",
    "scope": null,
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "opponent_tech",
        "alias": "amd"
      },
      {
        "type": "opponent_tech",
        "alias": "absol_amd"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus2_mod_pds_def_opponent_antimass",
    "type": "mods",
    "value": "-1",
    "scope": null,
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "opponent_tech",
        "alias": "baldrick_amd"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_plasmascoring_spacecannon_def",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "tech",
        "alias": "ps"
      },
      {
        "type": "tech",
        "alias": "absol_ps"
      },
      {
        "type": "tech",
        "alias": "baldrick_ps"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_in_nebula",
    "type": "mods",
    "value": "+1",
    "scope": "_ship_",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "nebula_defender",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": ":shield: Defenders get +1 to ship rolls in a nebula."
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_in_arcane_citadel",
    "type": "mods",
    "value": "+1",
    "scope": "_groundforce_",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "arcane_defender",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": ":shield: Defenders get +1 to rolls in the arcane citadel."
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "nivyn_commander",
    "type": "extrarolls",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "nivyn_commander_damaged",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": "> Nivyn Commander Grants an Extra Die To Up To 2 Sustained Units\n"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "lizho_commander",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "lizho_commander_particular",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": "> Lizho Commander Grants an Extra Die\n"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "toldar_commander",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "toldar_commander_particular",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": "> Toldar Commander Grants an Extra Die\n"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_vaylerian_hero",
    "type": "mods",
    "value": "+1",
    "scope": "_ship_",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "vaylerianhero",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": "Vaylerian Ships get +1 to combat rolls due to Hero"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "letnev_agent",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "letnevagent",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": "Letnev Agent gives +1 die to best ship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "sol_agent",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "solagent",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": "Sol Agent gives +1 die to best ground force"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_thalnos",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "thalnosPlusOne",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": "Units get +1 to combat rolls due to Thalnos"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_argent_commander_afb",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "AFB",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "argentcommander"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_plasmascoring_afb",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "AFB",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "tech",
        "alias": "baldrick_ps"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus1_roll_tnelis_flagship",
    "type": "extrarolls",
    "value": "-1",
    "scope": "_best_",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "tnelisopponentfs",
    "unitType": null,
    "related": [
      {
        "type": "custom",
        "alias": "custom",
        "message": "Tnelis Flagship causes -1 to best ships rolls"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_cheiran_fs_afb",
    "type": "extrarolls",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "AFB",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "next_to_structure",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "cheiran_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_argent_commander_bombard",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "bombardment",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "argentcommander"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_argent_commander_spacecannonoffence",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "argentcommander"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_argent_commander_spacecannondefence",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "argentcommander"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_2_sigma_argent_spacecannonoffence",
    "type": "mods",
    "value": "+2",
    "scope": null,
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "sigma_argent_flagship_1",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_argent_flagship_1"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus_2_sigma_argent_spacecannonoffence",
    "type": "mods",
    "value": "-2",
    "scope": null,
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": true,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "sigma_argent_flagship_1",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_argent_flagship_1"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_2_sigma_argent_spacecannondefence",
    "type": "mods",
    "value": "+2",
    "scope": null,
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "sigma_argent_flagship_1",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_argent_flagship_1"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus_2_sigma_argent_spacecannondefence",
    "type": "mods",
    "value": "-2",
    "scope": null,
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": true,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "sigma_argent_flagship_1",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_argent_flagship_1"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_3_sigma_argent_spacecannonoffence",
    "type": "mods",
    "value": "+3",
    "scope": null,
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "sigma_argent_flagship_2",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_argent_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus_3_sigma_argent_spacecannonoffence",
    "type": "mods",
    "value": "-3",
    "scope": null,
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": true,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "sigma_argent_flagship_2",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_argent_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_3_sigma_argent_spacecannondefence",
    "type": "mods",
    "value": "+3",
    "scope": null,
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "sigma_argent_flagship_2",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_argent_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus_3_sigma_argent_spacecannondefence",
    "type": "mods",
    "value": "-3",
    "scope": null,
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": true,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "sigma_argent_flagship_2",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_argent_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_plasmascoring",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "bombardment",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "tech",
        "alias": "ps"
      },
      {
        "type": "tech",
        "alias": "absol_ps"
      },
      {
        "type": "tech",
        "alias": "baldrick_ps"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "minus1_always_all",
    "type": "mods",
    "value": "-1",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "ability",
        "alias": "fragile"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_always_all",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "ability",
        "alias": "unrelenting"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus2_2_matching_non_ff",
    "type": "mods",
    "value": "+2",
    "scope": "_ship_no_ff",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "units_two_matching_not_ff",
    "unitType": null,
    "related": [
      {
        "type": "ability",
        "alias": "rule_of_two"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_always_fighter",
    "type": "mods",
    "value": "+1",
    "scope": "ff",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "agenda",
        "alias": "prophecy"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_always_fighter_lomega",
    "type": "mods",
    "value": "+1",
    "scope": "ff",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "agenda",
        "alias": "little_omega_prophecy"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_x_frag_always_flagship",
    "type": "mods",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "bentor_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_x_code_always_mech",
    "type": "mods",
    "value": "+1",
    "scope": "mf",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "toldar_mech"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_x_law_always_flagship",
    "type": "mods",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "edyn_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_half_unit_tech_always_mech",
    "type": "mods",
    "value": "+1",
    "scope": "mf",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "mirveda_mech"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_2x_destroyers_always_flagship",
    "type": "mods",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "nokar_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_always_other_units_with_flagship",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sardakk_flagship"
      },
      {
        "type": "unit",
        "alias": "sigma_norr_flagship_1"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_always_with_flagship_combat",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_norr_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_always_with_flagship_bombard",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "bombardment",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_norr_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_always_with_flagship_afb",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "AFB",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_norr_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_always_with_flagship_cannon_off",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_norr_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_always_with_flagship_cannon_def",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_norr_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_x_opponent_unit_tech_always_flagship",
    "type": "mods",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "zealots_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_2_opponent_cc_not_in_fleet_flagship",
    "type": "mods",
    "value": "+2",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "opponent_no_cc_fleet",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "mahact_flagship"
      },
      {
        "type": "unit",
        "alias": "sigma_mahact_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_opponent_cc_not_in_fleet_flagship",
    "type": "mods",
    "value": "+2",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "opponent_no_cc_fleet",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_mahact_flagship_1"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_cheiran_fs_combat",
    "type": "extrarolls",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "next_to_structure",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "cheiran_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_x_opponent_faction_tech_always_mech",
    "type": "mods",
    "value": "+1",
    "scope": "mf",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "zealots_mech"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_2_opponent_frag_conditional_mech",
    "type": "mods",
    "value": "+2",
    "scope": "mf",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "opponent_frag",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "naalu_mech"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_inf_with_mech",
    "type": "mods",
    "value": "+1",
    "scope": "gf",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "has_ability_fragile",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "jolnar_mech"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_2_opponent_stolen_faction_tech_conditional_mech",
    "type": "mods",
    "value": "+2",
    "scope": "mf",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "opponent_stolen_faction_tech",
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "nekro_mech"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_2_mr_legendary_home_conditional",
    "type": "mods",
    "value": "+2",
    "scope": null,
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "CONDITIONAL",
    "condition": "planet_mr_legendary_home",
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "winnucommander"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_always_afb",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "AFB",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "kolumecommander"
      },
      {
        "type": "relic",
        "alias": "starfall_array"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_starfall_afb",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "AFB",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "relic",
        "alias": "starfall_array"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_starfall_spacecannondefence",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "relic",
        "alias": "starfall_array"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_always_space_cannon_defence",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "SpaceCannonDefence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "kolumecommander"
      },
      {
        "type": "relic",
        "alias": "starfall_array"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_always_space_cannon_offense",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "kolumecommander"
      },
      {
        "type": "relic",
        "alias": "starfall_array"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_starfall_spacecannonoffence",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "relic",
        "alias": "starfall_array"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_0_always_space_cannon_offense",
    "type": "mods",
    "value": "+0",
    "scope": null,
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "mirvedacommander"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_always_bombardment",
    "type": "mods",
    "value": "+1",
    "scope": null,
    "forCombatAbility": "bombardment",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "leader",
        "alias": "kolumecommander"
      },
      {
        "type": "relic",
        "alias": "starfall_array"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus1_roll_starfall_bombardment",
    "type": "extrarolls",
    "value": "+1",
    "scope": "_best_",
    "forCombatAbility": "bombardment",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "relic",
        "alias": "starfall_array"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_x_frag_always_flagship_afb",
    "type": "mods",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "AFB",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "bentor_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_x_frag_always_flagship_spacecannon",
    "type": "mods",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "SpaceCannonOffence",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "bentor_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_x_frag_always_flagship_bombardment",
    "type": "mods",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "bombardment",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "bentor_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "miltymod_cruiser2_bonus_hits_9_10",
    "type": "bonus_hits",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "miltymod_cruiser2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "roll_1_for_every_enemy_non_fighter",
    "type": "extrarolls",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "winnu_flagship"
      },
      {
        "type": "unit",
        "alias": "sigma_winnu_flagship_1"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "roll_1_for_every_enemy_ship",
    "type": "extrarolls",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "sigma_winnu_flagship_2"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "roll_1_for_every_round_of_combat",
    "type": "extrarolls",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "veldyr_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "plus_1_for_every_round_of_combat",
    "type": "mods",
    "value": "+1",
    "scope": "mf",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "uydai_mech"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "roll_1_for_every_adjacent_mech_comb",
    "type": "extrarolls",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "gledge_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "roll_1_for_every_adjacent_asteroid_comb",
    "type": "extrarolls",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "combatround",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "zelian_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "roll_1_for_every_adjacent_asteroid_bomb",
    "type": "extrarolls",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "bombardment",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "zelian_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "roll_1_for_every_adjacent_asteroid_afb",
    "type": "extrarolls",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "AFB",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "zelian_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  },
  {
    "alias": "roll_1_for_every_adjacent_mech_bomb",
    "type": "extrarolls",
    "value": "+1",
    "scope": "fs",
    "forCombatAbility": "bombardment",
    "applyToOpponent": false,
    "applyToSelf": true,
    "persistenceType": "ALWAYS",
    "condition": null,
    "unitType": null,
    "related": [
      {
        "type": "unit",
        "alias": "gledge_flagship"
      }
    ],
    "description": null,
    "source": "combat_modifiers",
    "spaceCombatOnly": false,
    "groundCombatOnly": false,
    "rerollCount": null,
    "rerollMisses": false,
    "homebrewReplacesID": null
  }
];

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
        ? parseInt(modifier.value.replace(/[^d-]/g, '')) 
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
