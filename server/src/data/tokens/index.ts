// Tokens - extracted from TI4_map_generator_bot
// Generated: 2025-09-01T18:39:59.871Z

export interface Token {
  id: string;
  name: string;
  imagePath?: string | null;
  
  // Location type
  spaceOrPlanet?: string;
  
  // Aliases
  aliasList?: string[];
  
  // Token type
  tokenType?: TokenType;
  
  // Wormhole specific
  wormholes?: string[];
  wormholeType?: string | null;
  
  // Frontier token specific
  frontierType?: string | null;
  explorationDeck?: ExplorationDeck | null;
  
  // Attachment token specific
  attachmentId?: string | null;
  
  // Command/Control token specific
  faction?: string | null;
  isCommandToken?: boolean;
  isControlToken?: boolean;
  
  // Source tracking
  source: string;
  
  // Effects
  effect?: string | null;
  permanentEffect?: string | null;
  
  // Additional properties
  isRemovable?: boolean;
  isPermanent?: boolean;
  canStack?: boolean;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export type TokenType = 
  | 'wormhole'
  | 'frontier'
  | 'command'
  | 'control'
  | 'custodian'
  | 'trade_good'
  | 'commodity'
  | 'attachment'
  | 'special';

export type ExplorationDeck = 
  | 'cultural'
  | 'hazardous'
  | 'industrial'
  | 'frontier';

export type TokenLocation = 
  | 'space'
  | 'planet'
  | 'both';

export const tokens: Token[] = [
  {
    "id": "cradle",
    "name": "cradle",
    "imagePath": "token_cradle.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "cradle",
      "token_cradle"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "ascendant_sun",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "oasis",
    "name": "oasis",
    "imagePath": "token_oasis.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "oasis",
      "token_oasis"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "ascendant_sun",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "creussalpha",
    "name": "creussalpha",
    "imagePath": "token_creussalpha.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "creussalpha",
      "token_creussalpha",
      "ghostalpha",
      "a",
      "alpha_wormhole"
    ],
    "tokenType": "wormhole",
    "wormholes": [
      "ALPHA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "base",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "creussbeta",
    "name": "creussbeta",
    "imagePath": "token_creussbeta.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "creussbeta",
      "token_creussbeta",
      "ghostbeta"
    ],
    "tokenType": "wormhole",
    "wormholes": [
      "BETA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "base",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "custodian",
    "name": "custodian",
    "imagePath": "token_custodian.png",
    "spaceOrPlanet": "planet",
    "aliasList": [
      "custodian",
      "token_custodian"
    ],
    "tokenType": "custodian",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "base",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "custodianvp",
    "name": "custodianvp",
    "imagePath": "token_custodianvp.png",
    "spaceOrPlanet": "planet",
    "aliasList": [
      "custodianvp",
      "token_custodianvp"
    ],
    "tokenType": "custodian",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "base",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "custc1",
    "name": "custc1",
    "imagePath": "token_custc1.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "custc1"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "base",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "custvpc1",
    "name": "custvpc1",
    "imagePath": "token_custvpc1.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "custvpc1"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "base",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "glory",
    "name": "glory",
    "imagePath": "token_ds_glory.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "ds",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "wound",
    "name": "wound",
    "imagePath": "token_ds_wound.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "ds",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "gledge_core",
    "name": "gledge_core",
    "imagePath": "token_ds_gledgecore.png",
    "spaceOrPlanet": "planet",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "ds",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "blight",
    "name": "blight",
    "imagePath": "token_ds_blight.png",
    "spaceOrPlanet": "idk",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "ds",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "sigil",
    "name": "sigil",
    "imagePath": "token_ds_sigil.png",
    "spaceOrPlanet": "planet",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "ds",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "freesystems_raccoon",
    "name": "freesystems_raccoon",
    "imagePath": "token_raccoon.png",
    "spaceOrPlanet": "planet",
    "aliasList": [
      "freesystems_raccoon",
      "raccoon",
      "coon"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "ds",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "anomaly",
    "name": "anomaly",
    "imagePath": "token_anomalydummy.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "big_obelisk",
    "name": "big_obelisk",
    "imagePath": "token_big_obelisk.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "consulate",
    "name": "consulate",
    "imagePath": "token_consulate.png",
    "spaceOrPlanet": "planet",
    "aliasList": [
      "consulate",
      "token_consulate"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "oath_of_kings",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "creussepsilon",
    "name": "creussepsilon",
    "imagePath": "token_creussepsilon.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "EPSILON"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "custom_eronous_whepsilon",
    "name": "custom_eronous_whepsilon",
    "imagePath": "token_custom_eronous_whepsilon.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "CUSTOM_ERONOUS_WHEPSILON"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "eronous",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "custom_eronous_wheta",
    "name": "custom_eronous_wheta",
    "imagePath": "token_custom_eronous_wheta.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "CUSTOM_ERONOUS_WHETA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "eronous",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "custom_eronous_whiota",
    "name": "custom_eronous_whiota",
    "imagePath": "token_custom_eronous_whiota.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "CUSTOM_ERONOUS_WHIOTA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "eronous",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "custom_eronous_whtheta",
    "name": "custom_eronous_whtheta",
    "imagePath": "token_custom_eronous_whtheta.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "CUSTOM_ERONOUS_WHTHETA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "eronous",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "custom_eronous_whzeta",
    "name": "custom_eronous_whzeta",
    "imagePath": "token_custom_eronous_whzeta.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "CUSTOM_ERONOUS_WHZETA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "eronous",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "customempyrean",
    "name": "customempyrean",
    "imagePath": "token_empyrean.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "customkollecc",
    "name": "customkollecc",
    "imagePath": "token_ds_customkollecc.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "customnivyn",
    "name": "customnivyn",
    "imagePath": "token_ds_customnivyn.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "customnokar",
    "name": "customnokar",
    "imagePath": "token_ds_customnokar.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "customtnelis",
    "name": "customtnelis",
    "imagePath": "token_ds_customtnelis.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "customwinnu",
    "name": "customwinnu",
    "imagePath": "token_winnu.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "speaker",
    "name": "speaker",
    "imagePath": "token_speaker.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "speaker",
      "token_speaker"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "installation",
    "name": "installation",
    "imagePath": "token_installation.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "asteroid",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whalpha",
    "name": "whalpha",
    "imagePath": "token_whalpha.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "ALPHA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whbeta",
    "name": "whbeta",
    "imagePath": "token_whbeta.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "BETA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whchampion",
    "name": "whchampion",
    "imagePath": "token_whchampion.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "WHCHAMPION"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "eronous",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whdelta",
    "name": "whdelta",
    "imagePath": "token_whdelta.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "DELTA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whepsilon",
    "name": "whepsilon",
    "imagePath": "token_custom_eronous_whepsilon.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "EPSILON"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "wheta",
    "name": "wheta",
    "imagePath": "token_custom_eronous_wheta.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "ETA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whkappa",
    "name": "whkappa",
    "imagePath": "token_custom_eronous_whkappa.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "KAPPA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whgamma",
    "name": "whgamma",
    "imagePath": "token_whgamma.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "GAMMA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whnarrows",
    "name": "whnarrows",
    "imagePath": "token_whnarrows.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "WHNARROWS"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "eronous",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whprobability",
    "name": "whprobability",
    "imagePath": "token_whprobability.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "WHPROBABILITY"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "eronous",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whvoyage",
    "name": "whvoyage",
    "imagePath": "token_whvoyage.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "WHVOYAGE"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "eronous",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "whzeta",
    "name": "whzeta",
    "imagePath": "token_custom_eronous_whzeta.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "ZETA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "vortex",
    "name": "vortex",
    "imagePath": "token_vortex.png",
    "spaceOrPlanet": "space",
    "aliasList": [],
    "tokenType": "wormhole",
    "wormholes": [
      "VORTEX"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "eronous",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "illusion",
    "name": "illusion",
    "imagePath": "token_illusion.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "illusion",
      "token_illusion"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "phantasm",
    "name": "phantasm",
    "imagePath": "token_phantasm.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "phantasm",
      "token_phantasm"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "other",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "creussgamma",
    "name": "creussgamma",
    "imagePath": "token_creussgamma.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "creussgamma",
      "token_creussgamma",
      "ghostgamma"
    ],
    "tokenType": "wormhole",
    "wormholes": [
      "GAMMA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "pok",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "dmz_large",
    "name": "dmz_large",
    "imagePath": "token_dmz_large.png",
    "spaceOrPlanet": "planet",
    "aliasList": [
      "dmz_large",
      "token_dmz_large",
      "dmz"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "pok",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "frontier",
    "name": "frontier",
    "imagePath": "token_frontier.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "frontier",
      "token_frontier"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "pok",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "gamma",
    "name": "gamma",
    "imagePath": "token_gamma.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "gamma",
      "token_gamma",
      "grandma"
    ],
    "tokenType": "wormhole",
    "wormholes": [
      "GAMMA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "pok",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "gravityrift",
    "name": "gravityrift",
    "imagePath": "token_gravityrift.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "gravityrift",
      "token_gravityrift",
      "gravrift",
      "rift"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "pok",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "ionalpha",
    "name": "ionalpha",
    "imagePath": "token_ionalpha.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "ionalpha",
      "token_ionalpha",
      "ion"
    ],
    "tokenType": "wormhole",
    "wormholes": [
      "ALPHA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "pok",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "ionbeta",
    "name": "ionbeta",
    "imagePath": "token_ionbeta.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "ionbeta",
      "token_ionbeta"
    ],
    "tokenType": "wormhole",
    "wormholes": [
      "BETA"
    ],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "pok",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "mirage",
    "name": "mirage",
    "imagePath": "token_mirage.png",
    "spaceOrPlanet": "space",
    "aliasList": [
      "mirage",
      "token_mirage"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "pok",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "sleeper",
    "name": "sleeper",
    "imagePath": "token_sleeper.png",
    "spaceOrPlanet": "planet",
    "aliasList": [
      "sleeper",
      "token_sleeper"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "pok",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  },
  {
    "id": "worlddestroyed",
    "name": "worlddestroyed",
    "imagePath": "token_worlddestroyed.png",
    "spaceOrPlanet": "planet",
    "aliasList": [
      "worlddestroyed",
      "token_worlddestroyed",
      "stellarconverter",
      "stellar_converter"
    ],
    "tokenType": "special",
    "wormholes": [],
    "wormholeType": null,
    "frontierType": null,
    "explorationDeck": null,
    "attachmentId": null,
    "faction": null,
    "isCommandToken": false,
    "isControlToken": false,
    "source": "pok",
    "effect": null,
    "permanentEffect": null,
    "isRemovable": true,
    "isPermanent": false,
    "canStack": false,
    "homebrewReplacesID": null
  }
];

// Helper functions
export const getTokenById = (id: string): Token | undefined => {
  return tokens.find(token => token.id === id);
};

export const getTokenByAlias = (alias: string): Token | undefined => {
  return tokens.find(token => 
    token.aliasList?.includes(alias)
  );
};

export const getTokensByType = (type: TokenType): Token[] => {
  return tokens.filter(token => token.tokenType === type);
};

export const getTokensByLocation = (location: string): Token[] => {
  return tokens.filter(token => 
    token.spaceOrPlanet === location || token.spaceOrPlanet === 'both'
  );
};

export const getSpaceTokens = (): Token[] => {
  return getTokensByLocation('space');
};

export const getPlanetTokens = (): Token[] => {
  return getTokensByLocation('planet');
};

export const getWormholeTokens = (): Token[] => {
  return tokens.filter(token => 
    token.tokenType === 'wormhole' || 
    (token.wormholes && token.wormholes.length > 0)
  );
};

export const getFrontierTokens = (): Token[] => {
  return tokens.filter(token => 
    token.tokenType === 'frontier' || token.frontierType
  );
};

export const getCommandTokens = (): Token[] => {
  return tokens.filter(token => token.isCommandToken);
};

export const getControlTokens = (): Token[] => {
  return tokens.filter(token => token.isControlToken);
};

export const getTokensByFaction = (faction: string): Token[] => {
  return tokens.filter(token => 
    token.faction?.toLowerCase() === faction.toLowerCase()
  );
};

export const getRemovableTokens = (): Token[] => {
  return tokens.filter(token => token.isRemovable);
};

export const getPermanentTokens = (): Token[] => {
  return tokens.filter(token => token.isPermanent);
};

export const getStackableTokens = (): Token[] => {
  return tokens.filter(token => token.canStack);
};

export const searchTokens = (searchTerm: string): Token[] => {
  const term = searchTerm.toLowerCase();
  return tokens.filter(token => 
    token.name.toLowerCase().includes(term) ||
    token.id.toLowerCase().includes(term) ||
    token.effect?.toLowerCase().includes(term) ||
    token.aliasList?.some(alias => alias.toLowerCase().includes(term))
  );
};

// Get official vs homebrew tokens
export const getOfficialTokens = (): Token[] => {
  return tokens.filter(token => 
    token.source === 'base' || 
    token.source === 'pok'
  );
};

export const getHomebrewTokens = (): Token[] => {
  return tokens.filter(token => 
    token.source !== 'base' && 
    token.source !== 'pok'
  );
};

// Group tokens by category
export const tokensByCategory = {
  wormholes: tokens.filter(t => t.tokenType === 'wormhole'),
  frontier: tokens.filter(t => t.tokenType === 'frontier'),
  command: tokens.filter(t => t.tokenType === 'command'),
  control: tokens.filter(t => t.tokenType === 'control'),
  custodian: tokens.filter(t => t.tokenType === 'custodian'),
  tradeGoods: tokens.filter(t => t.tokenType === 'trade_good'),
  commodities: tokens.filter(t => t.tokenType === 'commodity'),
  attachments: tokens.filter(t => t.tokenType === 'attachment'),
  special: tokens.filter(t => t.tokenType === 'special')
};

// Get tokens for specific exploration deck
export const getTokensForExplorationDeck = (deck: ExplorationDeck): Token[] => {
  return tokens.filter(token => token.explorationDeck === deck);
};

// Check if a token can be placed at a location
export const canPlaceToken = (token: Token, location: TokenLocation): boolean => {
  if (token.spaceOrPlanet === 'both') return true;
  return token.spaceOrPlanet === location;
};
