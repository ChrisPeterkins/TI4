// Strategy Cards - extracted from TI4_map_generator_bot
// Generated: 2025-09-01T19:23:19.555Z

export interface StrategyCard {
  id: string;
  name: string;
  initiative: number;
  
  // Primary and secondary abilities
  primaryTexts: string[];
  secondaryTexts: string[];
  
  // Visual properties
  colourHexCode?: string | null;
  imageFileName?: string | null;
  
  // Source tracking
  source: string;
  expansion?: string | null;
  
  // Image
  imageURL?: string | null;
  
  // Set information
  cardSet?: string | null;
  
  // Homebrew tracking
  homebrewReplacesID?: string | null;
}

export type StrategyCardName = 
  | 'Leadership'
  | 'Diplomacy'
  | 'Politics'
  | 'Construction'
  | 'Trade'
  | 'Warfare'
  | 'Technology'
  | 'Imperial';


export const strategyCards: StrategyCard[] = [
  {
    "id": "alexg9830_imperial",
    "name": "Imperial",
    "initiative": 8,
    "primaryTexts": [
      "Immediately score 1 public objective if you fulfill its requirements.",
      "Gain 1 victory point if you control Mecatol Rex; otherwise, draw 2 secret objectives, select 1 and shuffle the other in the secret objectives deck."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 2 secret objectives, select 1 and shuffle the other in the secret objectives deck."
    ],
    "colourHexCode": "#752b90",
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "alexg",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy1",
    "name": "Leadership",
    "initiative": 1,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#FFFFFF",
    "imageFileName": "anarchy_1",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy2",
    "name": "Preparation",
    "initiative": 2,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_2",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy3",
    "name": "Diplomacy",
    "initiative": 3,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_3",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy4",
    "name": "Politics",
    "initiative": 4,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "_4",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy5",
    "name": "Construction",
    "initiative": 5,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_5",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy6",
    "name": "Trade",
    "initiative": 6,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "_6",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy7",
    "name": "Fabrication",
    "initiative": 7,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_7",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy8",
    "name": "Warfare",
    "initiative": 8,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_8",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy9",
    "name": "Technology",
    "initiative": 9,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_9",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy10",
    "name": "Espionage",
    "initiative": 10,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_10",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy11",
    "name": "Imperial",
    "initiative": 11,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_11",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped1A",
    "name": "Leadership",
    "initiative": 11,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped2A",
    "name": "Diplomacy",
    "initiative": 21,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped3",
    "name": "Politics",
    "initiative": 30,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped3A",
    "name": "Politics",
    "initiative": 31,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped3B",
    "name": "Politics",
    "initiative": 32,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped3C",
    "name": "Politics",
    "initiative": 33,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped4A",
    "name": "Construction",
    "initiative": 41,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped5A",
    "name": "Trade",
    "initiative": 51,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped6A",
    "name": "Warfare",
    "initiative": 61,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped7A",
    "name": "Technology",
    "initiative": 71,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped8A",
    "name": "Imperial",
    "initiative": 81,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped1B",
    "name": "Leadership",
    "initiative": 12,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped2B",
    "name": "Diplomacy",
    "initiative": 22,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped4B",
    "name": "Construction",
    "initiative": 42,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped5B",
    "name": "Trade",
    "initiative": 52,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped6B",
    "name": "Warfare",
    "initiative": 62,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped7B",
    "name": "Technology",
    "initiative": 72,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped8B",
    "name": "Imperial",
    "initiative": 82,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped1C",
    "name": "Leadership",
    "initiative": 13,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped2C",
    "name": "Diplomacy",
    "initiative": 23,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped4C",
    "name": "Construction",
    "initiative": 43,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped5C",
    "name": "Trade",
    "initiative": 53,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped6C",
    "name": "Warfare",
    "initiative": 63,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped7C",
    "name": "Technology",
    "initiative": 73,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped8C",
    "name": "Imperial",
    "initiative": 83,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped1D",
    "name": "Leadership",
    "initiative": 14,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped2D",
    "name": "Diplomacy",
    "initiative": 24,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped4D",
    "name": "Construction",
    "initiative": 44,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped5D",
    "name": "Trade",
    "initiative": 54,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped6D",
    "name": "Warfare",
    "initiative": 64,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped7D",
    "name": "Technology",
    "initiative": 74,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped8D",
    "name": "Imperial",
    "initiative": 84,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped1E",
    "name": "Leadership",
    "initiative": 15,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped2E",
    "name": "Diplomacy",
    "initiative": 25,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped4E",
    "name": "Construction",
    "initiative": 45,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped5E",
    "name": "Trade",
    "initiative": 55,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped6E",
    "name": "Warfare",
    "initiative": 65,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped7E",
    "name": "Technology",
    "initiative": 75,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped8E",
    "name": "Imperial",
    "initiative": 85,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped1F",
    "name": "Leadership",
    "initiative": 16,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped2F",
    "name": "Diplomacy",
    "initiative": 26,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped4F",
    "name": "Construction",
    "initiative": 46,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped5F",
    "name": "Trade",
    "initiative": 56,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped6F",
    "name": "Warfare",
    "initiative": 66,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped7F",
    "name": "Technology",
    "initiative": 76,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped8F",
    "name": "Imperial",
    "initiative": 86,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped1G",
    "name": "Leadership",
    "initiative": 17,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped2G",
    "name": "Diplomacy",
    "initiative": 27,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped4G",
    "name": "Construction",
    "initiative": 47,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped5G",
    "name": "Trade",
    "initiative": 57,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped6G",
    "name": "Warfare",
    "initiative": 67,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped7G",
    "name": "Technology",
    "initiative": 77,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped8G",
    "name": "Imperial",
    "initiative": 87,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped1H",
    "name": "Leadership",
    "initiative": 18,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped2H",
    "name": "Diplomacy",
    "initiative": 28,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped4H",
    "name": "Construction",
    "initiative": 48,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped5H",
    "name": "Trade",
    "initiative": 58,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped6H",
    "name": "Warfare",
    "initiative": 68,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped7H",
    "name": "Technology",
    "initiative": 78,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped8H",
    "name": "Imperial",
    "initiative": 88,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "ignisaurora3",
    "name": "Politics",
    "initiative": 3,
    "primaryTexts": [
      "Ready the speaker token.",
      "Choose a player other than the speaker. That player gains the speaker token.",
      "Draw 2 action cards and gain 2 vote tokens.",
      "Look at the top 3 cards of the agenda deck. Place 2 on the top and 1 on the bottom of the deck."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 2 action cards and one vote token."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "ignis_aurora",
    "expansion": null,
    "imageURL": null,
    "cardSet": "ignisaurora",
    "homebrewReplacesID": null
  },
  {
    "id": "ignisaurora2",
    "name": "Antiquities",
    "initiative": 2,
    "primaryTexts": [
      "Gain a relic.",
      "Reveal an Event card and resolve the event."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to gain an unknown fragment."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "ignis_aurora",
    "expansion": null,
    "imageURL": null,
    "cardSet": "ignisaurora",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous1",
    "name": "Anticipation",
    "initiative": 1,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "luminous_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous2",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "luminous_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous3",
    "name": "Leadership",
    "initiative": 3,
    "primaryTexts": [
      "Gain 3 command tokens",
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "secondaryTexts": [
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "colourHexCode": null,
    "imageFileName": "luminous_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous4",
    "name": "Politics",
    "initiative": 4,
    "primaryTexts": [
      "Choose a player other than the speaker.  That player gains the speaker token.",
      "Draw 2 action cards",
      "Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of the deck in any order."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 2 action cards."
    ],
    "colourHexCode": null,
    "imageFileName": "luminous_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous5",
    "name": "Construction",
    "initiative": 5,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "luminous_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous6",
    "name": "Trade",
    "initiative": 6,
    "primaryTexts": [
      "Gain 3 trade goods.",
      "Replenish commodities.",
      "Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to replenish your commodities."
    ],
    "colourHexCode": null,
    "imageFileName": "luminous_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous7",
    "name": "Warfare",
    "initiative": 7,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "luminous_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous8",
    "name": "Technology",
    "initiative": 8,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": "luminous_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous9",
    "name": "Espionage",
    "initiative": 9,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "luminous_9",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous10",
    "name": "Imperial",
    "initiative": 10,
    "primaryTexts": [
      "Immediately score 1 public objective if you fulfill its requirements.",
      "Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 1 secret objective."
    ],
    "colourHexCode": null,
    "imageFileName": "luminous_10",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech8",
    "name": "Technology",
    "initiative": 8,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech9",
    "name": "Technology",
    "initiative": 9,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech10",
    "name": "Technology",
    "initiative": 10,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech11",
    "name": "Technology",
    "initiative": 11,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech12",
    "name": "Technology",
    "initiative": 12,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech13",
    "name": "Imperial",
    "initiative": 13,
    "primaryTexts": [
      "Immediately score 1 public objective if you fulfill its requirements.",
      "Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 1 secret objective."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "miltymod_4",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "miltymod_4",
    "source": "miltymod",
    "expansion": null,
    "imageURL": null,
    "cardSet": "miltymod",
    "homebrewReplacesID": null
  },
  {
    "id": "monuments4construction",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [
      "Place 1 PDS or 1 Space Dock on a planet you control.",
      "Place 1 PDS on a planet you control.",
      "Place your Monument on a planet you control that matches at least one of it's listed planetary requirements."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and place it in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system"
    ],
    "colourHexCode": "#39b54a",
    "imageFileName": null,
    "source": "monuments",
    "expansion": null,
    "imageURL": null,
    "cardSet": "monuments",
    "homebrewReplacesID": null
  },
  {
    "id": "base2",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [
      "Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system.\nThen, ready each exhausted planet you control in that system."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to ready up to 2 exhausted planets"
    ],
    "colourHexCode": null,
    "imageFileName": "base_game_2",
    "source": "base",
    "expansion": null,
    "imageURL": null,
    "cardSet": "base",
    "homebrewReplacesID": null
  },
  {
    "id": "base4",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [
      "Place 1 PDS or 1 Space Dock on a planet you control.",
      "Place 1 PDS on a planet you control."
    ],
    "secondaryTexts": [
      "Place 1 token from your strategy pool in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system."
    ],
    "colourHexCode": null,
    "imageFileName": "base_game_4",
    "source": "base",
    "expansion": null,
    "imageURL": null,
    "cardSet": "base",
    "homebrewReplacesID": null
  },
  {
    "id": "pok1leadership",
    "name": "Leadership",
    "initiative": 1,
    "primaryTexts": [
      "Gain 3 command tokens",
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "secondaryTexts": [
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "colourHexCode": "#ec1c24",
    "imageFileName": "base_game_1",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Leadership.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok2diplomacy",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [
      "Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system. Then, ready up to 2 exhausted planets you control."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to ready up to 2 exhausted planets you control."
    ],
    "colourHexCode": "#f69421",
    "imageFileName": "pok_2",
    "source": "codex1",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/DiplomacyCodexOrdinian.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok3politics",
    "name": "Politics",
    "initiative": 3,
    "primaryTexts": [
      "Choose a player other than the speaker.  That player gains the speaker token.",
      "Draw 2 action cards",
      "Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of the deck in any order."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 2 action cards."
    ],
    "colourHexCode": "#fff200",
    "imageFileName": "base_game_3",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Politics.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok4construction",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [
      "Place 1 PDS or 1 Space Dock on a planet you control.",
      "Place 1 PDS on a planet you control."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and place it in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system"
    ],
    "colourHexCode": "#39b54a",
    "imageFileName": "pok_4",
    "source": "pok",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/ConstructionProphecyOfKings.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok5trade",
    "name": "Trade",
    "initiative": 5,
    "primaryTexts": [
      "Gain 3 trade goods.",
      "Replenish commodities.",
      "Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to replenish your commodities."
    ],
    "colourHexCode": "#00a99d",
    "imageFileName": "base_game_5",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Trade.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok6warfare",
    "name": "Warfare",
    "initiative": 6,
    "primaryTexts": [
      "Remove 1 of your command tokens from the game board; then, gain 1 command token.",
      "Redistribute any number of the command tokens on your command sheet."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to use the PRODUCTION ability of 1 of your space docks in your home system (this token is not placed in your home system)."
    ],
    "colourHexCode": "#008ed4",
    "imageFileName": "base_game_6",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Warfare.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok7technology",
    "name": "Technology",
    "initiative": 7,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": "#15489f",
    "imageFileName": "base_game_7",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Technology.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok8imperial",
    "name": "Imperial",
    "initiative": 8,
    "primaryTexts": [
      "Immediately score 1 public objective if you fulfill its requirements.",
      "Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 1 secret objective."
    ],
    "colourHexCode": "#752b90",
    "imageFileName": "base_game_8",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Imperial.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "project_pi_4",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pi_4",
    "source": "project_pi",
    "expansion": null,
    "imageURL": null,
    "cardSet": "project_pi",
    "homebrewReplacesID": null
  },
  {
    "id": "riftset_9",
    "name": "Sacrifice",
    "initiative": 9,
    "primaryTexts": [
      "Release up to 3 of your non-fighter ships from the Cabal.",
      "Place up to 2 of those released units in systems that contains at least one of your space docks."
    ],
    "secondaryTexts": [
      "Select a system with at least one of your non-fighter ships. For each non-fighter ship, roll a die; on a 3 or lower, it is captured. Gain Trade Goods equal to the total value of captured units."
    ],
    "colourHexCode": "#290b2f",
    "imageFileName": "riftset_9",
    "source": "riftset",
    "expansion": null,
    "imageURL": null,
    "cardSet": "riftset",
    "homebrewReplacesID": null
  },
  {
    "id": "minor1",
    "name": "Minor Leadership",
    "initiative": 11,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "When resolving the secondary ability of the Leadership strategy card, gain 1 Command Token."
    ],
    "colourHexCode": "#c05f60",
    "imageFileName": "11_leadership_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  },
  {
    "id": "minor2",
    "name": "Minor Diplomacy",
    "initiative": 12,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Diplomacy strategy card."
    ],
    "colourHexCode": "#c78b60",
    "imageFileName": "12_diplomacy_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  },
  {
    "id": "minor3",
    "name": "Minor Politics",
    "initiative": 13,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Politics strategy card."
    ],
    "colourHexCode": "#cdc45c",
    "imageFileName": "13_politics_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  },
  {
    "id": "minor4",
    "name": "Minor Construction",
    "initiative": 14,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary abilitiy of the Construction strategy card. Any tokens placed by this ability are placed from your reinforcements instead."
    ],
    "colourHexCode": "#659d69",
    "imageFileName": "14_construction_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  },
  {
    "id": "minor5",
    "name": "Minor Trade",
    "initiative": 15,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Trade strategy card. When you replenish commodities following the Trade Strategy card, convert all your commodities into Trade Goods."
    ],
    "colourHexCode": "#5c9690",
    "imageFileName": "15_trade_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  },
  {
    "id": "minor6",
    "name": "Minor Warfare",
    "initiative": 16,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Warfare strategy card."
    ],
    "colourHexCode": "#5c89b3",
    "imageFileName": "16_warfare_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  },
  {
    "id": "minor7",
    "name": "Minor Technology",
    "initiative": 17,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Technology strategy card."
    ],
    "colourHexCode": "#5e6991",
    "imageFileName": "17_technology_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  },
  {
    "id": "minor8",
    "name": "Minor Imperial",
    "initiative": 18,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Imperial strategy card."
    ],
    "colourHexCode": "#7b6189",
    "imageFileName": "18_imperial_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon1",
    "name": "Anticipation",
    "initiative": 1,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ff1600",
    "imageFileName": "tispoon_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon2",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ff6901",
    "imageFileName": "tispoon_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon3",
    "name": "Leadership",
    "initiative": 3,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ffc401",
    "imageFileName": "tispoon_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon4",
    "name": "Politics",
    "initiative": 4,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#fcfc01",
    "imageFileName": "tispoon_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon5",
    "name": "Construction",
    "initiative": 5,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#65d915",
    "imageFileName": "tispoon_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon6",
    "name": "Trade",
    "initiative": 6,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#01bb5d",
    "imageFileName": "tispoon_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon7",
    "name": "Warfare",
    "initiative": 7,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#02eaf4",
    "imageFileName": "tispoon_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon8",
    "name": "Technology",
    "initiative": 8,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#015bbe",
    "imageFileName": "tispoon_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon9",
    "name": "Espionage",
    "initiative": 9,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#3f05ab",
    "imageFileName": "tispoon_9",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon10",
    "name": "Imperial",
    "initiative": 10,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#942de3",
    "imageFileName": "tispoon_10",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal1",
    "name": "Anticipation",
    "initiative": 1,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ff1600",
    "imageFileName": "tribunal_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal2",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ff6901",
    "imageFileName": "tribunal_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal3",
    "name": "Leadership",
    "initiative": 3,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ffc401",
    "imageFileName": "tribunal_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal4",
    "name": "Politics",
    "initiative": 4,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#fcfc01",
    "imageFileName": "tribunal_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal5",
    "name": "Construction",
    "initiative": 5,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#65d915",
    "imageFileName": "tribunal_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal6",
    "name": "Trade",
    "initiative": 6,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#01bb5d",
    "imageFileName": "tribunal_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal7",
    "name": "Warfare",
    "initiative": 7,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#02eaf4",
    "imageFileName": "tribunal_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal8",
    "name": "Technology",
    "initiative": 8,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#015bbe",
    "imageFileName": "tribunal_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal9",
    "name": "Espionage",
    "initiative": 9,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#3f05ab",
    "imageFileName": "tribunal_9",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal10",
    "name": "Imperial",
    "initiative": 10,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#942de3",
    "imageFileName": "tribunal_10",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "unfulvio9intrigue",
    "name": "Intrigue",
    "initiative": 9,
    "primaryTexts": [
      "Secretly look at the next unrevealed public objective; You may reveal it.",
      "Perform the secondary ability of 1 readied strategy card, incuding this, spending a command token from your reinforcements instead of your strategy pool."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to secretly look at the next unrevealed public objective."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "unfulvio",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Leadership.webp",
    "cardSet": "unfulvio",
    "homebrewReplacesID": null
  },
  {
    "id": "cryypter_3",
    "name": "Politics",
    "initiative": 3,
    "primaryTexts": [
      "Choose a player other than the speaker.  That player gains the speaker token.",
      "Draw 3 action cards, discard 1, and keep the rest.",
      "Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of the deck in any order, then look at the top 2 cards of the agenda deck."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 3 action cards, discard 1, and keep the rest."
    ],
    "colourHexCode": null,
    "imageFileName": "cryypter_3",
    "source": "voices_of_the_council",
    "expansion": null,
    "imageURL": null,
    "cardSet": "voices_of_the_council",
    "homebrewReplacesID": null
  }
];

// Initiative 1 strategy cards
export const initiative1Cards: StrategyCard[] = [
  {
    "id": "anarchy1",
    "name": "Leadership",
    "initiative": 1,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#FFFFFF",
    "imageFileName": "anarchy_1",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous1",
    "name": "Anticipation",
    "initiative": 1,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "luminous_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "pok1leadership",
    "name": "Leadership",
    "initiative": 1,
    "primaryTexts": [
      "Gain 3 command tokens",
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "secondaryTexts": [
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "colourHexCode": "#ec1c24",
    "imageFileName": "base_game_1",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Leadership.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon1",
    "name": "Anticipation",
    "initiative": 1,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ff1600",
    "imageFileName": "tispoon_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal1",
    "name": "Anticipation",
    "initiative": 1,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ff1600",
    "imageFileName": "tribunal_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  }
];

// Initiative 2 strategy cards
export const initiative2Cards: StrategyCard[] = [
  {
    "id": "anarchy2",
    "name": "Preparation",
    "initiative": 2,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_2",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "ignisaurora2",
    "name": "Antiquities",
    "initiative": 2,
    "primaryTexts": [
      "Gain a relic.",
      "Reveal an Event card and resolve the event."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to gain an unknown fragment."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "ignis_aurora",
    "expansion": null,
    "imageURL": null,
    "cardSet": "ignisaurora",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous2",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "luminous_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "base2",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [
      "Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system.\nThen, ready each exhausted planet you control in that system."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to ready up to 2 exhausted planets"
    ],
    "colourHexCode": null,
    "imageFileName": "base_game_2",
    "source": "base",
    "expansion": null,
    "imageURL": null,
    "cardSet": "base",
    "homebrewReplacesID": null
  },
  {
    "id": "pok2diplomacy",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [
      "Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system. Then, ready up to 2 exhausted planets you control."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to ready up to 2 exhausted planets you control."
    ],
    "colourHexCode": "#f69421",
    "imageFileName": "pok_2",
    "source": "codex1",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/DiplomacyCodexOrdinian.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon2",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ff6901",
    "imageFileName": "tispoon_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal2",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ff6901",
    "imageFileName": "tribunal_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  }
];

// Initiative 3 strategy cards
export const initiative3Cards: StrategyCard[] = [
  {
    "id": "anarchy3",
    "name": "Diplomacy",
    "initiative": 3,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_3",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "ignisaurora3",
    "name": "Politics",
    "initiative": 3,
    "primaryTexts": [
      "Ready the speaker token.",
      "Choose a player other than the speaker. That player gains the speaker token.",
      "Draw 2 action cards and gain 2 vote tokens.",
      "Look at the top 3 cards of the agenda deck. Place 2 on the top and 1 on the bottom of the deck."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 2 action cards and one vote token."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "ignis_aurora",
    "expansion": null,
    "imageURL": null,
    "cardSet": "ignisaurora",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous3",
    "name": "Leadership",
    "initiative": 3,
    "primaryTexts": [
      "Gain 3 command tokens",
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "secondaryTexts": [
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "colourHexCode": null,
    "imageFileName": "luminous_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "pok3politics",
    "name": "Politics",
    "initiative": 3,
    "primaryTexts": [
      "Choose a player other than the speaker.  That player gains the speaker token.",
      "Draw 2 action cards",
      "Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of the deck in any order."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 2 action cards."
    ],
    "colourHexCode": "#fff200",
    "imageFileName": "base_game_3",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Politics.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon3",
    "name": "Leadership",
    "initiative": 3,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ffc401",
    "imageFileName": "tispoon_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal3",
    "name": "Leadership",
    "initiative": 3,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#ffc401",
    "imageFileName": "tribunal_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "cryypter_3",
    "name": "Politics",
    "initiative": 3,
    "primaryTexts": [
      "Choose a player other than the speaker.  That player gains the speaker token.",
      "Draw 3 action cards, discard 1, and keep the rest.",
      "Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of the deck in any order, then look at the top 2 cards of the agenda deck."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 3 action cards, discard 1, and keep the rest."
    ],
    "colourHexCode": null,
    "imageFileName": "cryypter_3",
    "source": "voices_of_the_council",
    "expansion": null,
    "imageURL": null,
    "cardSet": "voices_of_the_council",
    "homebrewReplacesID": null
  }
];

// Initiative 4 strategy cards
export const initiative4Cards: StrategyCard[] = [
  {
    "id": "anarchy4",
    "name": "Politics",
    "initiative": 4,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "_4",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous4",
    "name": "Politics",
    "initiative": 4,
    "primaryTexts": [
      "Choose a player other than the speaker.  That player gains the speaker token.",
      "Draw 2 action cards",
      "Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of the deck in any order."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 2 action cards."
    ],
    "colourHexCode": null,
    "imageFileName": "luminous_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "miltymod_4",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "miltymod_4",
    "source": "miltymod",
    "expansion": null,
    "imageURL": null,
    "cardSet": "miltymod",
    "homebrewReplacesID": null
  },
  {
    "id": "monuments4construction",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [
      "Place 1 PDS or 1 Space Dock on a planet you control.",
      "Place 1 PDS on a planet you control.",
      "Place your Monument on a planet you control that matches at least one of it's listed planetary requirements."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and place it in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system"
    ],
    "colourHexCode": "#39b54a",
    "imageFileName": null,
    "source": "monuments",
    "expansion": null,
    "imageURL": null,
    "cardSet": "monuments",
    "homebrewReplacesID": null
  },
  {
    "id": "base4",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [
      "Place 1 PDS or 1 Space Dock on a planet you control.",
      "Place 1 PDS on a planet you control."
    ],
    "secondaryTexts": [
      "Place 1 token from your strategy pool in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system."
    ],
    "colourHexCode": null,
    "imageFileName": "base_game_4",
    "source": "base",
    "expansion": null,
    "imageURL": null,
    "cardSet": "base",
    "homebrewReplacesID": null
  },
  {
    "id": "pok4construction",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [
      "Place 1 PDS or 1 Space Dock on a planet you control.",
      "Place 1 PDS on a planet you control."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and place it in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system"
    ],
    "colourHexCode": "#39b54a",
    "imageFileName": "pok_4",
    "source": "pok",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/ConstructionProphecyOfKings.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "project_pi_4",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pi_4",
    "source": "project_pi",
    "expansion": null,
    "imageURL": null,
    "cardSet": "project_pi",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon4",
    "name": "Politics",
    "initiative": 4,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#fcfc01",
    "imageFileName": "tispoon_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal4",
    "name": "Politics",
    "initiative": 4,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#fcfc01",
    "imageFileName": "tribunal_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  }
];

// Initiative 5 strategy cards
export const initiative5Cards: StrategyCard[] = [
  {
    "id": "anarchy5",
    "name": "Construction",
    "initiative": 5,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_5",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous5",
    "name": "Construction",
    "initiative": 5,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "luminous_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "pok5trade",
    "name": "Trade",
    "initiative": 5,
    "primaryTexts": [
      "Gain 3 trade goods.",
      "Replenish commodities.",
      "Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to replenish your commodities."
    ],
    "colourHexCode": "#00a99d",
    "imageFileName": "base_game_5",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Trade.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon5",
    "name": "Construction",
    "initiative": 5,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#65d915",
    "imageFileName": "tispoon_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal5",
    "name": "Construction",
    "initiative": 5,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#65d915",
    "imageFileName": "tribunal_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  }
];

// Initiative 6 strategy cards
export const initiative6Cards: StrategyCard[] = [
  {
    "id": "anarchy6",
    "name": "Trade",
    "initiative": 6,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "_6",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous6",
    "name": "Trade",
    "initiative": 6,
    "primaryTexts": [
      "Gain 3 trade goods.",
      "Replenish commodities.",
      "Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to replenish your commodities."
    ],
    "colourHexCode": null,
    "imageFileName": "luminous_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "pok6warfare",
    "name": "Warfare",
    "initiative": 6,
    "primaryTexts": [
      "Remove 1 of your command tokens from the game board; then, gain 1 command token.",
      "Redistribute any number of the command tokens on your command sheet."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to use the PRODUCTION ability of 1 of your space docks in your home system (this token is not placed in your home system)."
    ],
    "colourHexCode": "#008ed4",
    "imageFileName": "base_game_6",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Warfare.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon6",
    "name": "Trade",
    "initiative": 6,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#01bb5d",
    "imageFileName": "tispoon_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal6",
    "name": "Trade",
    "initiative": 6,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#01bb5d",
    "imageFileName": "tribunal_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  }
];

// Initiative 7 strategy cards
export const initiative7Cards: StrategyCard[] = [
  {
    "id": "anarchy7",
    "name": "Fabrication",
    "initiative": 7,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_7",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous7",
    "name": "Warfare",
    "initiative": 7,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "luminous_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "pok7technology",
    "name": "Technology",
    "initiative": 7,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": "#15489f",
    "imageFileName": "base_game_7",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Technology.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon7",
    "name": "Warfare",
    "initiative": 7,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#02eaf4",
    "imageFileName": "tispoon_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal7",
    "name": "Warfare",
    "initiative": 7,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#02eaf4",
    "imageFileName": "tribunal_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  }
];

// Initiative 8 strategy cards
export const initiative8Cards: StrategyCard[] = [
  {
    "id": "alexg9830_imperial",
    "name": "Imperial",
    "initiative": 8,
    "primaryTexts": [
      "Immediately score 1 public objective if you fulfill its requirements.",
      "Gain 1 victory point if you control Mecatol Rex; otherwise, draw 2 secret objectives, select 1 and shuffle the other in the secret objectives deck."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 2 secret objectives, select 1 and shuffle the other in the secret objectives deck."
    ],
    "colourHexCode": "#752b90",
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "alexg",
    "homebrewReplacesID": null
  },
  {
    "id": "anarchy8",
    "name": "Warfare",
    "initiative": 8,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_8",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous8",
    "name": "Technology",
    "initiative": 8,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": "luminous_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech8",
    "name": "Technology",
    "initiative": 8,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "pok8imperial",
    "name": "Imperial",
    "initiative": 8,
    "primaryTexts": [
      "Immediately score 1 public objective if you fulfill its requirements.",
      "Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 1 secret objective."
    ],
    "colourHexCode": "#752b90",
    "imageFileName": "base_game_8",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Imperial.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon8",
    "name": "Technology",
    "initiative": 8,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#015bbe",
    "imageFileName": "tispoon_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal8",
    "name": "Technology",
    "initiative": 8,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#015bbe",
    "imageFileName": "tribunal_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  }
];

// Initiative 9 strategy cards
export const initiative9Cards: StrategyCard[] = [
  {
    "id": "anarchy9",
    "name": "Technology",
    "initiative": 9,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_9",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous9",
    "name": "Espionage",
    "initiative": 9,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "luminous_9",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech9",
    "name": "Technology",
    "initiative": 9,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "riftset_9",
    "name": "Sacrifice",
    "initiative": 9,
    "primaryTexts": [
      "Release up to 3 of your non-fighter ships from the Cabal.",
      "Place up to 2 of those released units in systems that contains at least one of your space docks."
    ],
    "secondaryTexts": [
      "Select a system with at least one of your non-fighter ships. For each non-fighter ship, roll a die; on a 3 or lower, it is captured. Gain Trade Goods equal to the total value of captured units."
    ],
    "colourHexCode": "#290b2f",
    "imageFileName": "riftset_9",
    "source": "riftset",
    "expansion": null,
    "imageURL": null,
    "cardSet": "riftset",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon9",
    "name": "Espionage",
    "initiative": 9,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#3f05ab",
    "imageFileName": "tispoon_9",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal9",
    "name": "Espionage",
    "initiative": 9,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#3f05ab",
    "imageFileName": "tribunal_9",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  },
  {
    "id": "unfulvio9intrigue",
    "name": "Intrigue",
    "initiative": 9,
    "primaryTexts": [
      "Secretly look at the next unrevealed public objective; You may reveal it.",
      "Perform the secondary ability of 1 readied strategy card, incuding this, spending a command token from your reinforcements instead of your strategy pool."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to secretly look at the next unrevealed public objective."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "unfulvio",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Leadership.webp",
    "cardSet": "unfulvio",
    "homebrewReplacesID": null
  }
];

// Initiative 10 strategy cards
export const initiative10Cards: StrategyCard[] = [
  {
    "id": "anarchy10",
    "name": "Espionage",
    "initiative": 10,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_10",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "luminous10",
    "name": "Imperial",
    "initiative": 10,
    "primaryTexts": [
      "Immediately score 1 public objective if you fulfill its requirements.",
      "Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 1 secret objective."
    ],
    "colourHexCode": null,
    "imageFileName": "luminous_10",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "luminous",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech10",
    "name": "Technology",
    "initiative": 10,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "tispoon10",
    "name": "Imperial",
    "initiative": 10,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#942de3",
    "imageFileName": "tispoon_10",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tispoon",
    "homebrewReplacesID": null
  },
  {
    "id": "tribunal10",
    "name": "Imperial",
    "initiative": 10,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": "#942de3",
    "imageFileName": "tribunal_10",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "tribunal",
    "homebrewReplacesID": null
  }
];

// Initiative 11 strategy cards
export const initiative11Cards: StrategyCard[] = [
  {
    "id": "anarchy11",
    "name": "Imperial",
    "initiative": 11,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "anarchy_11",
    "source": "asteroid",
    "expansion": null,
    "imageURL": null,
    "cardSet": "anarchy",
    "homebrewReplacesID": null
  },
  {
    "id": "grouped1A",
    "name": "Leadership",
    "initiative": 11,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech11",
    "name": "Technology",
    "initiative": 11,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "minor1",
    "name": "Minor Leadership",
    "initiative": 11,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "When resolving the secondary ability of the Leadership strategy card, gain 1 Command Token."
    ],
    "colourHexCode": "#c05f60",
    "imageFileName": "11_leadership_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  }
];

// Initiative 12 strategy cards
export const initiative12Cards: StrategyCard[] = [
  {
    "id": "grouped1B",
    "name": "Leadership",
    "initiative": 12,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech12",
    "name": "Technology",
    "initiative": 12,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "minor2",
    "name": "Minor Diplomacy",
    "initiative": 12,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Diplomacy strategy card."
    ],
    "colourHexCode": "#c78b60",
    "imageFileName": "12_diplomacy_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  }
];

// Initiative 13 strategy cards
export const initiative13Cards: StrategyCard[] = [
  {
    "id": "grouped1C",
    "name": "Leadership",
    "initiative": 13,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "manytech13",
    "name": "Imperial",
    "initiative": 13,
    "primaryTexts": [
      "Immediately score 1 public objective if you fulfill its requirements.",
      "Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 1 secret objective."
    ],
    "colourHexCode": null,
    "imageFileName": null,
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "manytech",
    "homebrewReplacesID": null
  },
  {
    "id": "minor3",
    "name": "Minor Politics",
    "initiative": 13,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Politics strategy card."
    ],
    "colourHexCode": "#cdc45c",
    "imageFileName": "13_politics_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  }
];

// Initiative 14 strategy cards
export const initiative14Cards: StrategyCard[] = [
  {
    "id": "grouped1D",
    "name": "Leadership",
    "initiative": 14,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "minor4",
    "name": "Minor Construction",
    "initiative": 14,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary abilitiy of the Construction strategy card. Any tokens placed by this ability are placed from your reinforcements instead."
    ],
    "colourHexCode": "#659d69",
    "imageFileName": "14_construction_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  }
];

// Initiative 15 strategy cards
export const initiative15Cards: StrategyCard[] = [
  {
    "id": "grouped1E",
    "name": "Leadership",
    "initiative": 15,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "minor5",
    "name": "Minor Trade",
    "initiative": 15,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Trade strategy card. When you replenish commodities following the Trade Strategy card, convert all your commodities into Trade Goods."
    ],
    "colourHexCode": "#5c9690",
    "imageFileName": "15_trade_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  }
];

// Initiative 16 strategy cards
export const initiative16Cards: StrategyCard[] = [
  {
    "id": "grouped1F",
    "name": "Leadership",
    "initiative": 16,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "minor6",
    "name": "Minor Warfare",
    "initiative": 16,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Warfare strategy card."
    ],
    "colourHexCode": "#5c89b3",
    "imageFileName": "16_warfare_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  }
];

// Initiative 17 strategy cards
export const initiative17Cards: StrategyCard[] = [
  {
    "id": "grouped1G",
    "name": "Leadership",
    "initiative": 17,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "minor7",
    "name": "Minor Technology",
    "initiative": 17,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Technology strategy card."
    ],
    "colourHexCode": "#5e6991",
    "imageFileName": "17_technology_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  }
];

// Initiative 18 strategy cards
export const initiative18Cards: StrategyCard[] = [
  {
    "id": "grouped1H",
    "name": "Leadership",
    "initiative": 18,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_1",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  },
  {
    "id": "minor8",
    "name": "Minor Imperial",
    "initiative": 18,
    "primaryTexts": [
      "You may spend a strategy token and give your ally a Pass Turn token to have your ally take a strategic action on your turn. After the strategic action is completed, your turn resumes as normal.",
      "Your ally may spend any number of tokens from their strategy pool. You gain that number of command tokens."
    ],
    "secondaryTexts": [
      "You do not have to spend a strategy token to resolve the secondary ability of the Imperial strategy card."
    ],
    "colourHexCode": "#7b6189",
    "imageFileName": "18_imperial_minor",
    "source": "salliance",
    "expansion": null,
    "imageURL": null,
    "cardSet": "minor",
    "homebrewReplacesID": null
  }
];

// Initiative 21 strategy cards
export const initiative21Cards: StrategyCard[] = [
  {
    "id": "grouped2A",
    "name": "Diplomacy",
    "initiative": 21,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 22 strategy cards
export const initiative22Cards: StrategyCard[] = [
  {
    "id": "grouped2B",
    "name": "Diplomacy",
    "initiative": 22,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 23 strategy cards
export const initiative23Cards: StrategyCard[] = [
  {
    "id": "grouped2C",
    "name": "Diplomacy",
    "initiative": 23,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 24 strategy cards
export const initiative24Cards: StrategyCard[] = [
  {
    "id": "grouped2D",
    "name": "Diplomacy",
    "initiative": 24,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 25 strategy cards
export const initiative25Cards: StrategyCard[] = [
  {
    "id": "grouped2E",
    "name": "Diplomacy",
    "initiative": 25,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 26 strategy cards
export const initiative26Cards: StrategyCard[] = [
  {
    "id": "grouped2F",
    "name": "Diplomacy",
    "initiative": 26,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 27 strategy cards
export const initiative27Cards: StrategyCard[] = [
  {
    "id": "grouped2G",
    "name": "Diplomacy",
    "initiative": 27,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 28 strategy cards
export const initiative28Cards: StrategyCard[] = [
  {
    "id": "grouped2H",
    "name": "Diplomacy",
    "initiative": 28,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_2",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 30 strategy cards
export const initiative30Cards: StrategyCard[] = [
  {
    "id": "grouped3",
    "name": "Politics",
    "initiative": 30,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 31 strategy cards
export const initiative31Cards: StrategyCard[] = [
  {
    "id": "grouped3A",
    "name": "Politics",
    "initiative": 31,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 32 strategy cards
export const initiative32Cards: StrategyCard[] = [
  {
    "id": "grouped3B",
    "name": "Politics",
    "initiative": 32,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 33 strategy cards
export const initiative33Cards: StrategyCard[] = [
  {
    "id": "grouped3C",
    "name": "Politics",
    "initiative": 33,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_3",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 41 strategy cards
export const initiative41Cards: StrategyCard[] = [
  {
    "id": "grouped4A",
    "name": "Construction",
    "initiative": 41,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 42 strategy cards
export const initiative42Cards: StrategyCard[] = [
  {
    "id": "grouped4B",
    "name": "Construction",
    "initiative": 42,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 43 strategy cards
export const initiative43Cards: StrategyCard[] = [
  {
    "id": "grouped4C",
    "name": "Construction",
    "initiative": 43,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 44 strategy cards
export const initiative44Cards: StrategyCard[] = [
  {
    "id": "grouped4D",
    "name": "Construction",
    "initiative": 44,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 45 strategy cards
export const initiative45Cards: StrategyCard[] = [
  {
    "id": "grouped4E",
    "name": "Construction",
    "initiative": 45,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 46 strategy cards
export const initiative46Cards: StrategyCard[] = [
  {
    "id": "grouped4F",
    "name": "Construction",
    "initiative": 46,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 47 strategy cards
export const initiative47Cards: StrategyCard[] = [
  {
    "id": "grouped4G",
    "name": "Construction",
    "initiative": 47,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 48 strategy cards
export const initiative48Cards: StrategyCard[] = [
  {
    "id": "grouped4H",
    "name": "Construction",
    "initiative": 48,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "pok_4",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 51 strategy cards
export const initiative51Cards: StrategyCard[] = [
  {
    "id": "grouped5A",
    "name": "Trade",
    "initiative": 51,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 52 strategy cards
export const initiative52Cards: StrategyCard[] = [
  {
    "id": "grouped5B",
    "name": "Trade",
    "initiative": 52,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 53 strategy cards
export const initiative53Cards: StrategyCard[] = [
  {
    "id": "grouped5C",
    "name": "Trade",
    "initiative": 53,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 54 strategy cards
export const initiative54Cards: StrategyCard[] = [
  {
    "id": "grouped5D",
    "name": "Trade",
    "initiative": 54,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 55 strategy cards
export const initiative55Cards: StrategyCard[] = [
  {
    "id": "grouped5E",
    "name": "Trade",
    "initiative": 55,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 56 strategy cards
export const initiative56Cards: StrategyCard[] = [
  {
    "id": "grouped5F",
    "name": "Trade",
    "initiative": 56,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 57 strategy cards
export const initiative57Cards: StrategyCard[] = [
  {
    "id": "grouped5G",
    "name": "Trade",
    "initiative": 57,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 58 strategy cards
export const initiative58Cards: StrategyCard[] = [
  {
    "id": "grouped5H",
    "name": "Trade",
    "initiative": 58,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_5",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 61 strategy cards
export const initiative61Cards: StrategyCard[] = [
  {
    "id": "grouped6A",
    "name": "Warfare",
    "initiative": 61,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 62 strategy cards
export const initiative62Cards: StrategyCard[] = [
  {
    "id": "grouped6B",
    "name": "Warfare",
    "initiative": 62,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 63 strategy cards
export const initiative63Cards: StrategyCard[] = [
  {
    "id": "grouped6C",
    "name": "Warfare",
    "initiative": 63,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 64 strategy cards
export const initiative64Cards: StrategyCard[] = [
  {
    "id": "grouped6D",
    "name": "Warfare",
    "initiative": 64,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 65 strategy cards
export const initiative65Cards: StrategyCard[] = [
  {
    "id": "grouped6E",
    "name": "Warfare",
    "initiative": 65,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 66 strategy cards
export const initiative66Cards: StrategyCard[] = [
  {
    "id": "grouped6F",
    "name": "Warfare",
    "initiative": 66,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 67 strategy cards
export const initiative67Cards: StrategyCard[] = [
  {
    "id": "grouped6G",
    "name": "Warfare",
    "initiative": 67,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 68 strategy cards
export const initiative68Cards: StrategyCard[] = [
  {
    "id": "grouped6H",
    "name": "Warfare",
    "initiative": 68,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_6",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 71 strategy cards
export const initiative71Cards: StrategyCard[] = [
  {
    "id": "grouped7A",
    "name": "Technology",
    "initiative": 71,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 72 strategy cards
export const initiative72Cards: StrategyCard[] = [
  {
    "id": "grouped7B",
    "name": "Technology",
    "initiative": 72,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 73 strategy cards
export const initiative73Cards: StrategyCard[] = [
  {
    "id": "grouped7C",
    "name": "Technology",
    "initiative": 73,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 74 strategy cards
export const initiative74Cards: StrategyCard[] = [
  {
    "id": "grouped7D",
    "name": "Technology",
    "initiative": 74,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 75 strategy cards
export const initiative75Cards: StrategyCard[] = [
  {
    "id": "grouped7E",
    "name": "Technology",
    "initiative": 75,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 76 strategy cards
export const initiative76Cards: StrategyCard[] = [
  {
    "id": "grouped7F",
    "name": "Technology",
    "initiative": 76,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 77 strategy cards
export const initiative77Cards: StrategyCard[] = [
  {
    "id": "grouped7G",
    "name": "Technology",
    "initiative": 77,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 78 strategy cards
export const initiative78Cards: StrategyCard[] = [
  {
    "id": "grouped7H",
    "name": "Technology",
    "initiative": 78,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_7",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 81 strategy cards
export const initiative81Cards: StrategyCard[] = [
  {
    "id": "grouped8A",
    "name": "Imperial",
    "initiative": 81,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 82 strategy cards
export const initiative82Cards: StrategyCard[] = [
  {
    "id": "grouped8B",
    "name": "Imperial",
    "initiative": 82,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 83 strategy cards
export const initiative83Cards: StrategyCard[] = [
  {
    "id": "grouped8C",
    "name": "Imperial",
    "initiative": 83,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 84 strategy cards
export const initiative84Cards: StrategyCard[] = [
  {
    "id": "grouped8D",
    "name": "Imperial",
    "initiative": 84,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 85 strategy cards
export const initiative85Cards: StrategyCard[] = [
  {
    "id": "grouped8E",
    "name": "Imperial",
    "initiative": 85,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 86 strategy cards
export const initiative86Cards: StrategyCard[] = [
  {
    "id": "grouped8F",
    "name": "Imperial",
    "initiative": 86,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 87 strategy cards
export const initiative87Cards: StrategyCard[] = [
  {
    "id": "grouped8G",
    "name": "Imperial",
    "initiative": 87,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Initiative 88 strategy cards
export const initiative88Cards: StrategyCard[] = [
  {
    "id": "grouped8H",
    "name": "Imperial",
    "initiative": 88,
    "primaryTexts": [],
    "secondaryTexts": [],
    "colourHexCode": null,
    "imageFileName": "base_game_8",
    "source": "other",
    "expansion": null,
    "imageURL": null,
    "cardSet": "grouped",
    "homebrewReplacesID": null
  }
];

// Base game strategy cards
export const baseStrategyCards: StrategyCard[] = [
  {
    "id": "base2",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [
      "Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system.\nThen, ready each exhausted planet you control in that system."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to ready up to 2 exhausted planets"
    ],
    "colourHexCode": null,
    "imageFileName": "base_game_2",
    "source": "base",
    "expansion": null,
    "imageURL": null,
    "cardSet": "base",
    "homebrewReplacesID": null
  },
  {
    "id": "base4",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [
      "Place 1 PDS or 1 Space Dock on a planet you control.",
      "Place 1 PDS on a planet you control."
    ],
    "secondaryTexts": [
      "Place 1 token from your strategy pool in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system."
    ],
    "colourHexCode": null,
    "imageFileName": "base_game_4",
    "source": "base",
    "expansion": null,
    "imageURL": null,
    "cardSet": "base",
    "homebrewReplacesID": null
  },
  {
    "id": "pok1leadership",
    "name": "Leadership",
    "initiative": 1,
    "primaryTexts": [
      "Gain 3 command tokens",
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "secondaryTexts": [
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "colourHexCode": "#ec1c24",
    "imageFileName": "base_game_1",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Leadership.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok3politics",
    "name": "Politics",
    "initiative": 3,
    "primaryTexts": [
      "Choose a player other than the speaker.  That player gains the speaker token.",
      "Draw 2 action cards",
      "Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of the deck in any order."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 2 action cards."
    ],
    "colourHexCode": "#fff200",
    "imageFileName": "base_game_3",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Politics.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok5trade",
    "name": "Trade",
    "initiative": 5,
    "primaryTexts": [
      "Gain 3 trade goods.",
      "Replenish commodities.",
      "Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to replenish your commodities."
    ],
    "colourHexCode": "#00a99d",
    "imageFileName": "base_game_5",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Trade.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok6warfare",
    "name": "Warfare",
    "initiative": 6,
    "primaryTexts": [
      "Remove 1 of your command tokens from the game board; then, gain 1 command token.",
      "Redistribute any number of the command tokens on your command sheet."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to use the PRODUCTION ability of 1 of your space docks in your home system (this token is not placed in your home system)."
    ],
    "colourHexCode": "#008ed4",
    "imageFileName": "base_game_6",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Warfare.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok7technology",
    "name": "Technology",
    "initiative": 7,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": "#15489f",
    "imageFileName": "base_game_7",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Technology.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok8imperial",
    "name": "Imperial",
    "initiative": 8,
    "primaryTexts": [
      "Immediately score 1 public objective if you fulfill its requirements.",
      "Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 1 secret objective."
    ],
    "colourHexCode": "#752b90",
    "imageFileName": "base_game_8",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Imperial.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  }
];

// PoK strategy cards
export const pokStrategyCards: StrategyCard[] = [
  {
    "id": "pok1leadership",
    "name": "Leadership",
    "initiative": 1,
    "primaryTexts": [
      "Gain 3 command tokens",
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "secondaryTexts": [
      "Spend any amount of influence to gain 1 command token for every 3 influence spent"
    ],
    "colourHexCode": "#ec1c24",
    "imageFileName": "base_game_1",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Leadership.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok2diplomacy",
    "name": "Diplomacy",
    "initiative": 2,
    "primaryTexts": [
      "Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system. Then, ready up to 2 exhausted planets you control."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to ready up to 2 exhausted planets you control."
    ],
    "colourHexCode": "#f69421",
    "imageFileName": "pok_2",
    "source": "codex1",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/DiplomacyCodexOrdinian.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok3politics",
    "name": "Politics",
    "initiative": 3,
    "primaryTexts": [
      "Choose a player other than the speaker.  That player gains the speaker token.",
      "Draw 2 action cards",
      "Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of the deck in any order."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 2 action cards."
    ],
    "colourHexCode": "#fff200",
    "imageFileName": "base_game_3",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Politics.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok4construction",
    "name": "Construction",
    "initiative": 4,
    "primaryTexts": [
      "Place 1 PDS or 1 Space Dock on a planet you control.",
      "Place 1 PDS on a planet you control."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and place it in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system"
    ],
    "colourHexCode": "#39b54a",
    "imageFileName": "pok_4",
    "source": "pok",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/ConstructionProphecyOfKings.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok5trade",
    "name": "Trade",
    "initiative": 5,
    "primaryTexts": [
      "Gain 3 trade goods.",
      "Replenish commodities.",
      "Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to replenish your commodities."
    ],
    "colourHexCode": "#00a99d",
    "imageFileName": "base_game_5",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Trade.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok6warfare",
    "name": "Warfare",
    "initiative": 6,
    "primaryTexts": [
      "Remove 1 of your command tokens from the game board; then, gain 1 command token.",
      "Redistribute any number of the command tokens on your command sheet."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to use the PRODUCTION ability of 1 of your space docks in your home system (this token is not placed in your home system)."
    ],
    "colourHexCode": "#008ed4",
    "imageFileName": "base_game_6",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Warfare.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok7technology",
    "name": "Technology",
    "initiative": 7,
    "primaryTexts": [
      "Research 1 technology.",
      "Spend 6 resources to research 1 technology."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool and 4 resources to research 1 technology."
    ],
    "colourHexCode": "#15489f",
    "imageFileName": "base_game_7",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Technology.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  },
  {
    "id": "pok8imperial",
    "name": "Imperial",
    "initiative": 8,
    "primaryTexts": [
      "Immediately score 1 public objective if you fulfill its requirements.",
      "Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective."
    ],
    "secondaryTexts": [
      "Spend 1 token from your strategy pool to draw 1 secret objective."
    ],
    "colourHexCode": "#752b90",
    "imageFileName": "base_game_8",
    "source": "base",
    "expansion": null,
    "imageURL": "https://ti4ultimate.com/resources/images/en-US/cards/strategy/Imperial.webp",
    "cardSet": "pok",
    "homebrewReplacesID": null
  }
];

// Helper functions
export const getStrategyCardById = (id: string): StrategyCard | undefined => {
  return strategyCards.find(card => card.id === id);
};

export const getStrategyCardByName = (name: string): StrategyCard | undefined => {
  return strategyCards.find(card => 
    card.name.toLowerCase() === name.toLowerCase()
  );
};

export const getStrategyCardsByInitiative = (initiative: number): StrategyCard[] => {
  return strategyCards.filter(card => card.initiative === initiative);
};

export const getStrategyCardsBySet = (set: string): StrategyCard[] => {
  return strategyCards.filter(card => 
    card.cardSet === set || card.source === set
  );
};

// Get all variations of a card by name
export const getCardVariations = (cardName: string): StrategyCard[] => {
  return strategyCards.filter(card => 
    card.name.toLowerCase() === cardName.toLowerCase()
  );
};

// Search strategy cards
export const searchStrategyCards = (searchTerm: string): StrategyCard[] => {
  const term = searchTerm.toLowerCase();
  return strategyCards.filter(card => 
    card.name.toLowerCase().includes(term) ||
    card.primaryTexts.some(text => text.toLowerCase().includes(term)) ||
    card.secondaryTexts.some(text => text.toLowerCase().includes(term))
  );
};

// Get strategy cards by source
export const getOfficialStrategyCards = (): StrategyCard[] => {
  return strategyCards.filter(card => 
    card.source === 'base' || 
    card.source === 'pok' ||
    card.source === 'codex1' ||
    card.source === 'codex2' ||
    card.source === 'codex3'
  );
};

export const getHomebrewStrategyCards = (): StrategyCard[] => {
  return strategyCards.filter(card => 
    card.source !== 'base' && 
    card.source !== 'pok' &&
    card.source !== 'codex1' &&
    card.source !== 'codex2' &&
    card.source !== 'codex3'
  );
};

// Get unique card names
export const getUniqueStrategyCardNames = (): string[] => {
  const names = new Set(strategyCards.map(card => card.name));
  return Array.from(names).sort();
};

// Get card sets
export const getCardSets = (): string[] => {
  const sets = new Set(strategyCards.map(card => card.cardSet || card.source).filter(Boolean));
  return Array.from(sets).sort();
};

// Statistics
export const getStrategyCardStats = () => {
  const nameCounts = {};
  const setCounts = {};
  const initiativeCounts = {};
  
  strategyCards.forEach(card => {
    // Count by name
    nameCounts[card.name] = (nameCounts[card.name] || 0) + 1;
    
    // Count by set
    const set = card.cardSet || card.source;
    setCounts[set] = (setCounts[set] || 0) + 1;
    
    // Count by initiative
    initiativeCounts[card.initiative] = (initiativeCounts[card.initiative] || 0) + 1;
  });
  
  return {
    total: strategyCards.length,
    uniqueNames: Object.keys(nameCounts).length,
    sets: Object.keys(setCounts).length,
    byName: nameCounts,
    bySet: setCounts,
    byInitiative: initiativeCounts
  };
};

// Check if card provides specific ability
export const cardProvidesAbility = (card: StrategyCard, ability: string): boolean => {
  const abilityLower = ability.toLowerCase();
  const primaryText = card.primaryTexts.join(' ').toLowerCase();
  const secondaryText = card.secondaryTexts.join(' ').toLowerCase();
  return primaryText.includes(abilityLower) || secondaryText.includes(abilityLower);
};

// Get cards that provide command tokens
export const getCommandTokenCards = (): StrategyCard[] => {
  return strategyCards.filter(card => 
    cardProvidesAbility(card, 'command token')
  );
};

// Get cards that provide trade goods
export const getTradeGoodCards = (): StrategyCard[] => {
  return strategyCards.filter(card => 
    cardProvidesAbility(card, 'trade good')
  );
};

// Get cards that allow technology research
export const getTechnologyCards = (): StrategyCard[] => {
  return strategyCards.filter(card => 
    cardProvidesAbility(card, 'research') || cardProvidesAbility(card, 'technology')
  );
};
