// Colors - extracted from TI4_map_generator_bot
// Generated: 2025-09-01T18:53:05.966Z

export interface Color {
  alias: string;
  name: string;
  displayName: string;
  colorType: ColorType;
  aliases: string[];
  textColor: string;
  primaryColor?: RGB | null;
  secondaryColor?: RGB | null;
  gradientColors?: RGB[] | null;
  gradientDirection?: string | null;
  hue?: string | null;
  hexCode?: string | null;
  rgb?: RGB | null;
  source: string;
}

export interface RGB {
  red: number;
  green: number;
  blue: number;
}

export type ColorType = 'solid' | 'gradient' | 'split';

export type Hue = 
  | 'RED'
  | 'ORANGE'
  | 'YELLOW'
  | 'GREEN'
  | 'BLUE'
  | 'PURPLE'
  | 'PINK'
  | 'GRAY'
  | 'BLACK'
  | 'WHITE';


export const colors: Color[] = [
  {
    "alias": "crm",
    "name": "chrome",
    "displayName": "chrome",
    "colorType": "gradient",
    "aliases": [
      "crm"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 104,
      "green": 180,
      "blue": 238
    },
    "secondaryColor": {
      "red": 228,
      "green": 175,
      "blue": 30
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MULTI2",
    "hexCode": "#68b4ee",
    "rgb": {
      "red": 104,
      "green": 180,
      "blue": 238
    },
    "source": "gradientColors"
  },
  {
    "alias": "sns",
    "name": "sunset",
    "displayName": "sunset",
    "colorType": "gradient",
    "aliases": [
      "sns"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 120,
      "green": 129,
      "blue": 255
    },
    "secondaryColor": {
      "red": 255,
      "green": 90,
      "blue": 132
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "PURPLE",
    "hexCode": "#7881ff",
    "rgb": {
      "red": 120,
      "green": 129,
      "blue": 255
    },
    "source": "gradientColors"
  },
  {
    "alias": "mgm",
    "name": "magma",
    "displayName": "magma",
    "colorType": "gradient",
    "aliases": [
      "mgm"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 240,
      "green": 6,
      "blue": 6
    },
    "secondaryColor": {
      "red": 245,
      "green": 245,
      "blue": 6
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "RED",
    "hexCode": "#f00606",
    "rgb": {
      "red": 240,
      "green": 6,
      "blue": 6
    },
    "source": "gradientColors"
  },
  {
    "alias": "gcr",
    "name": "glacier",
    "displayName": "glacier",
    "colorType": "gradient",
    "aliases": [
      "gcr"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 5,
      "green": 240,
      "blue": 240
    },
    "secondaryColor": {
      "red": 5,
      "green": 5,
      "blue": 245
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "BLUE",
    "hexCode": "#05f0f0",
    "rgb": {
      "red": 5,
      "green": 240,
      "blue": 240
    },
    "source": "gradientColors"
  },
  {
    "alias": "tpl",
    "name": "tropical",
    "displayName": "tropical",
    "colorType": "gradient",
    "aliases": [
      "tpl"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 255,
      "green": 178,
      "blue": 120
    },
    "secondaryColor": {
      "red": 89,
      "green": 255,
      "blue": 131
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GREEN",
    "hexCode": "#ffb278",
    "rgb": {
      "red": 255,
      "green": 178,
      "blue": 120
    },
    "source": "gradientColors"
  },
  {
    "alias": "tqs",
    "name": "turquoise",
    "displayName": "turquoise",
    "colorType": "gradient",
    "aliases": [
      "tqs",
      "torq",
      "turquoise",
      "torquoise",
      "turq",
      "turquis"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 63,
      "green": 255,
      "blue": 145
    },
    "secondaryColor": {
      "red": 40,
      "green": 255,
      "blue": 255
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GREEN",
    "hexCode": "#3fff91",
    "rgb": {
      "red": 63,
      "green": 255,
      "blue": 145
    },
    "source": "gradientColors"
  },
  {
    "alias": "gld",
    "name": "gold",
    "displayName": "gold",
    "colorType": "gradient",
    "aliases": [
      "gld"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 255,
      "green": 100,
      "blue": 1
    },
    "secondaryColor": {
      "red": 190,
      "green": 190,
      "blue": 1
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "YELLOW",
    "hexCode": "#ff6401",
    "rgb": {
      "red": 255,
      "green": 100,
      "blue": 1
    },
    "source": "gradientColors"
  },
  {
    "alias": "bld",
    "name": "bloodred",
    "displayName": "bloodred",
    "colorType": "gradient",
    "aliases": [
      "bld"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 230,
      "green": 0,
      "blue": 40
    },
    "secondaryColor": {
      "red": 80,
      "green": 0,
      "blue": 20
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "RED",
    "hexCode": "#e60028",
    "rgb": {
      "red": 230,
      "green": 0,
      "blue": 40
    },
    "source": "gradientColors"
  },
  {
    "alias": "cpr",
    "name": "copper",
    "displayName": "copper",
    "colorType": "gradient",
    "aliases": [
      "cpr"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 229,
      "green": 134,
      "blue": 0
    },
    "secondaryColor": {
      "red": 79,
      "green": 40,
      "blue": 0
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "ORANGE",
    "hexCode": "#e58600",
    "rgb": {
      "red": 229,
      "green": 134,
      "blue": 0
    },
    "source": "gradientColors"
  },
  {
    "alias": "nvy",
    "name": "navy",
    "displayName": "navy",
    "colorType": "gradient",
    "aliases": [
      "nvy"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 50,
      "green": 60,
      "blue": 255
    },
    "secondaryColor": {
      "red": 5,
      "green": 5,
      "blue": 120
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "BLUE",
    "hexCode": "#323cff",
    "rgb": {
      "red": 50,
      "green": 60,
      "blue": 255
    },
    "source": "gradientColors"
  },
  {
    "alias": "chk",
    "name": "chocolate",
    "displayName": "chocolate",
    "colorType": "gradient",
    "aliases": [
      "chk"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 140,
      "green": 60,
      "blue": 55
    },
    "secondaryColor": {
      "red": 60,
      "green": 30,
      "blue": 25
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "ORANGE",
    "hexCode": "#8c3c37",
    "rgb": {
      "red": 140,
      "green": 60,
      "blue": 55
    },
    "source": "gradientColors"
  },
  {
    "alias": "eme",
    "name": "emerald",
    "displayName": "emerald",
    "colorType": "gradient",
    "aliases": [
      "eme"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 37,
      "green": 255,
      "blue": 47
    },
    "secondaryColor": {
      "red": 0,
      "green": 90,
      "blue": 30
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GREEN",
    "hexCode": "#25ff2f",
    "rgb": {
      "red": 37,
      "green": 255,
      "blue": 47
    },
    "source": "gradientColors"
  },
  {
    "alias": "wtm",
    "name": "watermelon",
    "displayName": "watermelon",
    "colorType": "gradient",
    "aliases": [
      "wtm"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 240,
      "green": 6,
      "blue": 6
    },
    "secondaryColor": {
      "red": 6,
      "green": 175,
      "blue": 50
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MULTI2",
    "hexCode": "#f00606",
    "rgb": {
      "red": 240,
      "green": 6,
      "blue": 6
    },
    "source": "gradientColors"
  },
  {
    "alias": "vpw",
    "name": "vapourwave",
    "displayName": "vapourwave",
    "colorType": "gradient",
    "aliases": [
      "vpw",
      "vaporwave"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 6,
      "green": 239,
      "blue": 240
    },
    "secondaryColor": {
      "red": 175,
      "green": 6,
      "blue": 131
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MULTI2",
    "hexCode": "#06eff0",
    "rgb": {
      "red": 6,
      "green": 239,
      "blue": 240
    },
    "source": "gradientColors"
  },
  {
    "alias": "jpt",
    "name": "jupiter",
    "displayName": "jupiter",
    "colorType": "gradient",
    "aliases": [
      "jpt"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 6,
      "green": 75,
      "blue": 203
    },
    "secondaryColor": {
      "red": 240,
      "green": 180,
      "blue": 6
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MILTI2",
    "hexCode": "#064bcb",
    "rgb": {
      "red": 6,
      "green": 75,
      "blue": 203
    },
    "source": "gradientColors"
  },
  {
    "alias": "psn",
    "name": "poison",
    "displayName": "poison",
    "colorType": "gradient",
    "aliases": [
      "psn"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 6,
      "green": 175,
      "blue": 50
    },
    "secondaryColor": {
      "red": 146,
      "green": 6,
      "blue": 186
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MULTI2",
    "hexCode": "#06af32",
    "rgb": {
      "red": 6,
      "green": 175,
      "blue": 50
    },
    "source": "gradientColors"
  },
  {
    "alias": "rbw",
    "name": "rainbow",
    "displayName": "rainbow",
    "colorType": "gradient",
    "aliases": [
      "rbw"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 255,
      "green": 0,
      "blue": 0
    },
    "secondaryColor": {
      "red": 0,
      "green": 255,
      "blue": 0
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MULTI1",
    "hexCode": "#ff0000",
    "rgb": {
      "red": 255,
      "green": 0,
      "blue": 0
    },
    "source": "gradientColors"
  },
  {
    "alias": "sbt",
    "name": "sherbet",
    "displayName": "sherbet",
    "colorType": "gradient",
    "aliases": [
      "sbt"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 255,
      "green": 0,
      "blue": 0
    },
    "secondaryColor": {
      "red": 0,
      "green": 255,
      "blue": 0
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MULTI1",
    "hexCode": "#ff0000",
    "rgb": {
      "red": 255,
      "green": 0,
      "blue": 0
    },
    "source": "gradientColors"
  },
  {
    "alias": "ptb",
    "name": "paintball",
    "displayName": "paintball",
    "colorType": "gradient",
    "aliases": [
      "ptb"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 255,
      "green": 0,
      "blue": 0
    },
    "secondaryColor": {
      "red": 0,
      "green": 255,
      "blue": 0
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MULTI1",
    "hexCode": "#ff0000",
    "rgb": {
      "red": 255,
      "green": 0,
      "blue": 0
    },
    "source": "gradientColors"
  },
  {
    "alias": "wsp",
    "name": "wasp",
    "displayName": "wasp",
    "colorType": "gradient",
    "aliases": [
      "wsp"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 245,
      "green": 245,
      "blue": 6
    },
    "secondaryColor": {
      "red": 0,
      "green": 0,
      "blue": 0
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "YELLOW",
    "hexCode": "#f5f506",
    "rgb": {
      "red": 245,
      "green": 245,
      "blue": 6
    },
    "source": "gradientColors"
  },
  {
    "alias": "cqr",
    "name": "checker",
    "displayName": "checker",
    "colorType": "gradient",
    "aliases": [
      "cqr",
      "chequer"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 255,
      "green": 255,
      "blue": 255
    },
    "secondaryColor": {
      "red": 0,
      "green": 0,
      "blue": 0
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GRAY",
    "hexCode": "#ffffff",
    "rgb": {
      "red": 255,
      "green": 255,
      "blue": 255
    },
    "source": "gradientColors"
  },
  {
    "alias": "pld",
    "name": "plaid",
    "displayName": "plaid",
    "colorType": "gradient",
    "aliases": [
      "pld",
      "plaid"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 240,
      "green": 6,
      "blue": 6
    },
    "secondaryColor": {
      "red": 50,
      "green": 50,
      "blue": 50
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "RED",
    "hexCode": "#f00606",
    "rgb": {
      "red": 240,
      "green": 6,
      "blue": 6
    },
    "source": "gradientColors"
  },
  {
    "alias": "hqn",
    "name": "harlequin",
    "displayName": "harlequin",
    "colorType": "gradient",
    "aliases": [
      "hqn",
      "harlequin"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 6,
      "green": 175,
      "blue": 50
    },
    "secondaryColor": {
      "red": 5,
      "green": 45,
      "blue": 176
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MULTI2",
    "hexCode": "#06af32",
    "rgb": {
      "red": 6,
      "green": 175,
      "blue": 50
    },
    "source": "gradientColors"
  },
  {
    "alias": "ero",
    "name": "riftset",
    "displayName": "riftset",
    "colorType": "gradient",
    "aliases": [
      "ero",
      "riftset"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 74,
      "green": 27,
      "blue": 36
    },
    "secondaryColor": {
      "red": 135,
      "green": 0,
      "blue": 4
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GRAY",
    "hexCode": "#4a1b24",
    "rgb": {
      "red": 74,
      "green": 27,
      "blue": 36
    },
    "source": "gradientColors"
  },
  {
    "alias": "nm",
    "name": "nightmare",
    "displayName": "nightmare",
    "colorType": "gradient",
    "aliases": [
      "nm",
      "nightmare",
      "night"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 109,
      "green": 0,
      "blue": 10
    },
    "secondaryColor": {
      "red": 79,
      "green": 50,
      "blue": 81
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MULTI2",
    "hexCode": "#6d000a",
    "rgb": {
      "red": 109,
      "green": 0,
      "blue": 10
    },
    "source": "gradientColors"
  },
  {
    "alias": "dw",
    "name": "dawn",
    "displayName": "dawn",
    "colorType": "gradient",
    "aliases": [
      "dw",
      "dawn"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 242,
      "green": 242,
      "blue": 242
    },
    "secondaryColor": {
      "red": 255,
      "green": 210,
      "blue": 112
    },
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "MULTI2",
    "hexCode": "#f2f2f2",
    "rgb": {
      "red": 242,
      "green": 242,
      "blue": 242
    },
    "source": "gradientColors"
  },
  {
    "alias": "lgy",
    "name": "lightgray",
    "displayName": "LightGray",
    "colorType": "solid",
    "aliases": [
      "lgy",
      "lightgrey",
      "white",
      "W"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 206,
      "green": 206,
      "blue": 206
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GRAY",
    "hexCode": "#cecece",
    "rgb": {
      "red": 206,
      "green": 206,
      "blue": 206
    },
    "source": "solidColors"
  },
  {
    "alias": "red",
    "name": "red",
    "displayName": "red",
    "colorType": "solid",
    "aliases": [
      "red"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 240,
      "green": 6,
      "blue": 6
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "RED",
    "hexCode": "#f00606",
    "rgb": {
      "red": 240,
      "green": 6,
      "blue": 6
    },
    "source": "solidColors"
  },
  {
    "alias": "org",
    "name": "orange",
    "displayName": "orange",
    "colorType": "solid",
    "aliases": [
      "orange",
      "E",
      "org"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 240,
      "green": 180,
      "blue": 6
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "ORANGE",
    "hexCode": "#f0b406",
    "rgb": {
      "red": 240,
      "green": 180,
      "blue": 6
    },
    "source": "solidColors"
  },
  {
    "alias": "ylw",
    "name": "yellow",
    "displayName": "yellow",
    "colorType": "solid",
    "aliases": [
      "yellow",
      "Y",
      "ylw"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 245,
      "green": 245,
      "blue": 6
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "YELLOW",
    "hexCode": "#f5f506",
    "rgb": {
      "red": 245,
      "green": 245,
      "blue": 6
    },
    "source": "solidColors"
  },
  {
    "alias": "grn",
    "name": "green",
    "displayName": "green",
    "colorType": "solid",
    "aliases": [
      "green",
      "grn"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 6,
      "green": 175,
      "blue": 50
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GREEN",
    "hexCode": "#06af32",
    "rgb": {
      "red": 6,
      "green": 175,
      "blue": 50
    },
    "source": "solidColors"
  },
  {
    "alias": "blu",
    "name": "blue",
    "displayName": "blue",
    "colorType": "solid",
    "aliases": [
      "blue",
      "blu"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 6,
      "green": 75,
      "blue": 203
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "BLUE",
    "hexCode": "#064bcb",
    "rgb": {
      "red": 6,
      "green": 75,
      "blue": 203
    },
    "source": "solidColors"
  },
  {
    "alias": "ppl",
    "name": "purple",
    "displayName": "purple",
    "colorType": "solid",
    "aliases": [
      "purple",
      "P",
      "ppl"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 146,
      "green": 6,
      "blue": 186
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "PURPLE",
    "hexCode": "#9206ba",
    "rgb": {
      "red": 146,
      "green": 6,
      "blue": 186
    },
    "source": "solidColors"
  },
  {
    "alias": "pnk",
    "name": "pink",
    "displayName": "pink",
    "colorType": "solid",
    "aliases": [
      "pink",
      "K",
      "pnk"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 240,
      "green": 138,
      "blue": 240
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "PINK",
    "hexCode": "#f08af0",
    "rgb": {
      "red": 240,
      "green": 138,
      "blue": 240
    },
    "source": "solidColors"
  },
  {
    "alias": "blk",
    "name": "black",
    "displayName": "black",
    "colorType": "solid",
    "aliases": [
      "black",
      "blk"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 50,
      "green": 50,
      "blue": 50
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GRAY",
    "hexCode": "#323232",
    "rgb": {
      "red": 50,
      "green": 50,
      "blue": 50
    },
    "source": "solidColors"
  },
  {
    "alias": "ptr",
    "name": "petrol",
    "displayName": "petrol",
    "colorType": "solid",
    "aliases": [
      "ptr"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 66,
      "green": 140,
      "blue": 140
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "BLUE",
    "hexCode": "#428c8c",
    "rgb": {
      "red": 66,
      "green": 140,
      "blue": 140
    },
    "source": "solidColors"
  },
  {
    "alias": "rst",
    "name": "rust",
    "displayName": "rust",
    "colorType": "solid",
    "aliases": [
      "rst"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 140,
      "green": 66,
      "blue": 72
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "RED",
    "hexCode": "#8c4248",
    "rgb": {
      "red": 140,
      "green": 66,
      "blue": 72
    },
    "source": "solidColors"
  },
  {
    "alias": "bwn",
    "name": "brown",
    "displayName": "brown",
    "colorType": "solid",
    "aliases": [
      "bwn"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 150,
      "green": 80,
      "blue": 42
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "ORANGE",
    "hexCode": "#96502a",
    "rgb": {
      "red": 150,
      "green": 80,
      "blue": 42
    },
    "source": "solidColors"
  },
  {
    "alias": "gry",
    "name": "gray",
    "displayName": "gray",
    "colorType": "solid",
    "aliases": [
      "gray",
      "grey",
      "gry"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 110,
      "green": 122,
      "blue": 150
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GRAY",
    "hexCode": "#6e7a96",
    "rgb": {
      "red": 110,
      "green": 122,
      "blue": 150
    },
    "source": "solidColors"
  },
  {
    "alias": "tan",
    "name": "tan",
    "displayName": "tan",
    "colorType": "solid",
    "aliases": [
      "tan"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 172,
      "green": 160,
      "blue": 116
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "ORANGE",
    "hexCode": "#aca074",
    "rgb": {
      "red": 172,
      "green": 160,
      "blue": 116
    },
    "source": "solidColors"
  },
  {
    "alias": "frs",
    "name": "forest",
    "displayName": "forest",
    "colorType": "solid",
    "aliases": [
      "frs"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 90,
      "green": 150,
      "blue": 100
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GREEN",
    "hexCode": "#5a9664",
    "rgb": {
      "red": 90,
      "green": 150,
      "blue": 100
    },
    "source": "solidColors"
  },
  {
    "alias": "plm",
    "name": "plum",
    "displayName": "plum",
    "colorType": "solid",
    "aliases": [
      "plm"
    ],
    "textColor": "white",
    "primaryColor": {
      "red": 150,
      "green": 90,
      "blue": 140
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "PURPLE",
    "hexCode": "#965a8c",
    "rgb": {
      "red": 150,
      "green": 90,
      "blue": 140
    },
    "source": "solidColors"
  },
  {
    "alias": "tea",
    "name": "teal",
    "displayName": "teal",
    "colorType": "solid",
    "aliases": [
      "tea"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 0,
      "green": 235,
      "blue": 255
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "BLUE",
    "hexCode": "#00ebff",
    "rgb": {
      "red": 0,
      "green": 235,
      "blue": 255
    },
    "source": "solidColors"
  },
  {
    "alias": "rse",
    "name": "rose",
    "displayName": "rose",
    "colorType": "solid",
    "aliases": [
      "rse"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 217,
      "green": 165,
      "blue": 229
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "PINK",
    "hexCode": "#d9a5e5",
    "rgb": {
      "red": 217,
      "green": 165,
      "blue": 229
    },
    "source": "solidColors"
  },
  {
    "alias": "lme",
    "name": "lime",
    "displayName": "lime",
    "colorType": "solid",
    "aliases": [
      "lme"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 177,
      "green": 229,
      "blue": 165
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "GREEN",
    "hexCode": "#b1e5a5",
    "rgb": {
      "red": 177,
      "green": 229,
      "blue": 165
    },
    "source": "solidColors"
  },
  {
    "alias": "lvn",
    "name": "lavender",
    "displayName": "lavender",
    "colorType": "solid",
    "aliases": [
      "lvn"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 169,
      "green": 167,
      "blue": 231
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "PURPLE",
    "hexCode": "#a9a7e7",
    "rgb": {
      "red": 169,
      "green": 167,
      "blue": 231
    },
    "source": "solidColors"
  },
  {
    "alias": "spr",
    "name": "spring",
    "displayName": "spring",
    "colorType": "solid",
    "aliases": [
      "spr"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 219,
      "green": 231,
      "blue": 167
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "YELLOW",
    "hexCode": "#dbe7a7",
    "rgb": {
      "red": 219,
      "green": 231,
      "blue": 167
    },
    "source": "solidColors"
  },
  {
    "alias": "pch",
    "name": "peach",
    "displayName": "peach",
    "colorType": "solid",
    "aliases": [
      "pch"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 232,
      "green": 184,
      "blue": 167
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "ORANGE",
    "hexCode": "#e8b8a7",
    "rgb": {
      "red": 232,
      "green": 184,
      "blue": 167
    },
    "source": "solidColors"
  },
  {
    "alias": "eth",
    "name": "ethereal",
    "displayName": "ethereal",
    "colorType": "solid",
    "aliases": [
      "eth"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 35,
      "green": 104,
      "blue": 200
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "BLUE",
    "hexCode": "#2368c8",
    "rgb": {
      "red": 35,
      "green": 104,
      "blue": 200
    },
    "source": "solidColors"
  },
  {
    "alias": "rby",
    "name": "ruby",
    "displayName": "ruby",
    "colorType": "solid",
    "aliases": [
      "rby"
    ],
    "textColor": "black",
    "primaryColor": {
      "red": 212,
      "green": 43,
      "blue": 75
    },
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": "RED",
    "hexCode": "#d42b4b",
    "rgb": {
      "red": 212,
      "green": 43,
      "blue": 75
    },
    "source": "solidColors"
  },
  {
    "alias": "orca",
    "name": "orca",
    "displayName": "orca",
    "colorType": "split",
    "aliases": [
      "orca",
      "splitlgy",
      "splitlightgrey",
      "splitwhite"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitred",
    "name": "splitred",
    "displayName": "splitred",
    "colorType": "split",
    "aliases": [
      "splitred"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitblu",
    "name": "splitblue",
    "displayName": "splitblue",
    "colorType": "split",
    "aliases": [
      "splitblu",
      "splitblue"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitgrn",
    "name": "splitgreen",
    "displayName": "splitgreen",
    "colorType": "split",
    "aliases": [
      "splitgrn",
      "splitgreen"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitppl",
    "name": "splitpurple",
    "displayName": "splitpurple",
    "colorType": "split",
    "aliases": [
      "splitppl",
      "splitpurple"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitorg",
    "name": "splitorange",
    "displayName": "splitorange",
    "colorType": "split",
    "aliases": [
      "splitorg",
      "splitorange"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitylw",
    "name": "splityellow",
    "displayName": "splityellow",
    "colorType": "split",
    "aliases": [
      "splitylw",
      "splityellow"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitpnk",
    "name": "splitpink",
    "displayName": "splitpink",
    "colorType": "split",
    "aliases": [
      "splitpnk",
      "splitpink"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitlme",
    "name": "splitlime",
    "displayName": "splitlime",
    "colorType": "split",
    "aliases": [
      "splitlme",
      "splitlime"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splittan",
    "name": "splittan",
    "displayName": "splittan",
    "colorType": "split",
    "aliases": [
      "splittan"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splittea",
    "name": "splitteal",
    "displayName": "splitteal",
    "colorType": "split",
    "aliases": [
      "splittea",
      "splitteal"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitptr",
    "name": "splitpetrol",
    "displayName": "splitpetrol",
    "colorType": "split",
    "aliases": [
      "splitptr",
      "splitpetrol"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splittqs",
    "name": "splitturquoise",
    "displayName": "splitturquoise",
    "colorType": "split",
    "aliases": [
      "splittqs",
      "splitturquoise"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitgld",
    "name": "splitgold",
    "displayName": "splitgold",
    "colorType": "split",
    "aliases": [
      "splitgld",
      "splitgold"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitbld",
    "name": "splitbloodred",
    "displayName": "splitbloodred",
    "colorType": "split",
    "aliases": [
      "splitbld",
      "splitbloodred"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitnvy",
    "name": "splitnavy",
    "displayName": "splitnavy",
    "colorType": "split",
    "aliases": [
      "splitnvy",
      "splitnavy"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitchk",
    "name": "splitchocolate",
    "displayName": "splitchocolate",
    "colorType": "split",
    "aliases": [
      "splitchk",
      "splitchocolate"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "spliteme",
    "name": "splitemerald",
    "displayName": "splitemerald",
    "colorType": "split",
    "aliases": [
      "spliteme",
      "splitemerald"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  },
  {
    "alias": "splitrbw",
    "name": "splitrainbow",
    "displayName": "splitrainbow",
    "colorType": "split",
    "aliases": [
      "splitrbw",
      "splitrainbow"
    ],
    "textColor": "white",
    "primaryColor": null,
    "secondaryColor": null,
    "gradientColors": null,
    "gradientDirection": null,
    "hue": null,
    "hexCode": null,
    "source": "splitColors"
  }
];

// Helper functions
export const getColorByAlias = (alias: string): Color | undefined => {
  const lowerAlias = alias.toLowerCase();
  return colors.find(color => 
    color.alias.toLowerCase() === lowerAlias ||
    color.aliases.some(a => a.toLowerCase() === lowerAlias)
  );
};

export const getColorByName = (name: string): Color | undefined => {
  return colors.find(color => 
    color.name.toLowerCase() === name.toLowerCase()
  );
};

export const getColorsByType = (type: ColorType): Color[] => {
  return colors.filter(color => color.colorType === type);
};

export const getColorsByHue = (hue: string): Color[] => {
  return colors.filter(color => 
    color.hue === hue.toUpperCase()
  );
};

export const getSolidColors = (): Color[] => {
  return getColorsByType('solid');
};

export const getGradientColors = (): Color[] => {
  return getColorsByType('gradient');
};

export const getSplitColors = (): Color[] => {
  return getColorsByType('split');
};

// Get colors with good contrast for text
export const getColorsWithLightText = (): Color[] => {
  return colors.filter(color => color.textColor === 'white');
};

export const getColorsWithDarkText = (): Color[] => {
  return colors.filter(color => color.textColor === 'black');
};

// Search colors
export const searchColors = (searchTerm: string): Color[] => {
  const term = searchTerm.toLowerCase();
  return colors.filter(color => 
    color.name.toLowerCase().includes(term) ||
    color.displayName.toLowerCase().includes(term) ||
    color.aliases.some(alias => alias.toLowerCase().includes(term))
  );
};

// Get a color's hex code
export const getColorHex = (alias: string): string | null => {
  const color = getColorByAlias(alias);
  return color?.hexCode || null;
};

// Color utility functions
export const rgbToHex = (rgb: RGB): string => {
  const r = rgb.red.toString(16).padStart(2, '0');
  const g = rgb.green.toString(16).padStart(2, '0');
  const b = rgb.blue.toString(16).padStart(2, '0');
  return '#' + r + g + b;
};

export const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    red: parseInt(result[1], 16),
    green: parseInt(result[2], 16),
    blue: parseInt(result[3], 16)
  } : null;
};

// Get contrasting text color for a background
export const getContrastingTextColor = (backgroundColor: RGB): 'black' | 'white' => {
  // Using relative luminance formula
  const luminance = (0.299 * backgroundColor.red + 
                    0.587 * backgroundColor.green + 
                    0.114 * backgroundColor.blue) / 255;
  return luminance > 0.5 ? 'black' : 'white';
};
