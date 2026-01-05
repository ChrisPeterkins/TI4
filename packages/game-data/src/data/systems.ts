import type { SystemData } from '@ti4/shared';

export const systems: Record<number, SystemData> = {
  // Mecatol Rex
  18: {
    id: 18,
    tileNumber: '18',
    type: 'mecatol',
    planets: [
      {
        id: 'mecatol_rex',
        name: 'Mecatol Rex',
        resources: 1,
        influence: 6,
      },
    ],
    expansion: 'base',
  },

  // Home Systems
  1: {
    id: 1,
    tileNumber: '01',
    type: 'home',
    factionId: 'sol',
    planets: [
      {
        id: 'jord',
        name: 'Jord',
        resources: 4,
        influence: 2,
      },
    ],
    expansion: 'base',
  },
  2: {
    id: 2,
    tileNumber: '02',
    type: 'home',
    factionId: 'mentak',
    planets: [
      {
        id: 'moll_primus',
        name: 'Moll Primus',
        resources: 4,
        influence: 1,
      },
    ],
    expansion: 'base',
  },
  3: {
    id: 3,
    tileNumber: '03',
    type: 'home',
    factionId: 'letnev',
    planets: [
      {
        id: 'arc_prime',
        name: 'Arc Prime',
        resources: 4,
        influence: 0,
      },
      {
        id: 'wren_terra',
        name: 'Wren Terra',
        resources: 2,
        influence: 1,
      },
    ],
    expansion: 'base',
  },
  4: {
    id: 4,
    tileNumber: '04',
    type: 'home',
    factionId: 'muaat',
    planets: [
      {
        id: 'muaat',
        name: 'Muaat',
        resources: 4,
        influence: 1,
      },
    ],
    expansion: 'base',
  },
  5: {
    id: 5,
    tileNumber: '05',
    type: 'home',
    factionId: 'arborec',
    planets: [
      {
        id: 'nestphar',
        name: 'Nestphar',
        resources: 3,
        influence: 2,
      },
    ],
    expansion: 'base',
  },
  6: {
    id: 6,
    tileNumber: '06',
    type: 'home',
    factionId: 'l1z1x',
    planets: [
      {
        id: '[0.0.0]',
        name: '[0.0.0]',
        resources: 5,
        influence: 0,
      },
    ],
    expansion: 'base',
  },
  7: {
    id: 7,
    tileNumber: '07',
    type: 'home',
    factionId: 'winnu',
    planets: [
      {
        id: 'winnu',
        name: 'Winnu',
        resources: 3,
        influence: 4,
      },
    ],
    expansion: 'base',
  },
  8: {
    id: 8,
    tileNumber: '08',
    type: 'home',
    factionId: 'nekro',
    planets: [
      {
        id: 'mordai_ii',
        name: 'Mordai II',
        resources: 4,
        influence: 0,
      },
    ],
    expansion: 'base',
  },
  9: {
    id: 9,
    tileNumber: '09',
    type: 'home',
    factionId: 'naalu',
    planets: [
      {
        id: 'maaluuk',
        name: 'Maaluuk',
        resources: 0,
        influence: 2,
      },
      {
        id: 'druaa',
        name: 'Druaa',
        resources: 3,
        influence: 1,
      },
    ],
    expansion: 'base',
  },
  10: {
    id: 10,
    tileNumber: '10',
    type: 'home',
    factionId: 'hacan',
    planets: [
      {
        id: 'arretze',
        name: 'Arretze',
        resources: 2,
        influence: 0,
      },
      {
        id: 'hercant',
        name: 'Hercant',
        resources: 1,
        influence: 1,
      },
      {
        id: 'kamdorn',
        name: 'Kamdorn',
        resources: 0,
        influence: 1,
      },
    ],
    expansion: 'base',
  },
  11: {
    id: 11,
    tileNumber: '11',
    type: 'home',
    factionId: 'saar',
    planets: [
      {
        id: 'lisis_ii',
        name: 'Lisis II',
        resources: 1,
        influence: 0,
      },
      {
        id: 'ragh',
        name: 'Ragh',
        resources: 2,
        influence: 1,
      },
    ],
    expansion: 'base',
  },
  12: {
    id: 12,
    tileNumber: '12',
    type: 'home',
    factionId: 'jolnar',
    planets: [
      {
        id: 'jol',
        name: 'Jol',
        resources: 1,
        influence: 2,
      },
      {
        id: 'nar',
        name: 'Nar',
        resources: 2,
        influence: 3,
      },
    ],
    expansion: 'base',
  },
  13: {
    id: 13,
    tileNumber: '13',
    type: 'home',
    factionId: 'sardakk',
    planets: [
      {
        id: 'tren_lak',
        name: "Tren'Lak",
        resources: 1,
        influence: 0,
      },
      {
        id: 'quinarra',
        name: 'Quinarra',
        resources: 3,
        influence: 1,
      },
    ],
    expansion: 'base',
  },
  14: {
    id: 14,
    tileNumber: '14',
    type: 'home',
    factionId: 'xxcha',
    planets: [
      {
        id: 'archon_ren',
        name: 'Archon Ren',
        resources: 2,
        influence: 3,
      },
      {
        id: 'archon_tau',
        name: 'Archon Tau',
        resources: 1,
        influence: 1,
      },
    ],
    expansion: 'base',
  },
  15: {
    id: 15,
    tileNumber: '15',
    type: 'home',
    factionId: 'yin',
    planets: [
      {
        id: 'darien',
        name: 'Darien',
        resources: 4,
        influence: 4,
      },
    ],
    expansion: 'base',
  },
  16: {
    id: 16,
    tileNumber: '16',
    type: 'home',
    factionId: 'yssaril',
    planets: [
      {
        id: 'retillion',
        name: 'Retillion',
        resources: 2,
        influence: 3,
      },
      {
        id: 'shalloq',
        name: 'Shalloq',
        resources: 1,
        influence: 2,
      },
    ],
    expansion: 'base',
  },
  17: {
    id: 17,
    tileNumber: '17',
    type: 'home',
    factionId: 'creuss',
    wormhole: 'delta',
    planets: [],
    expansion: 'base',
  },
  51: {
    id: 51,
    tileNumber: '51',
    type: 'home',
    factionId: 'creuss',
    planets: [
      {
        id: 'creuss',
        name: 'Creuss',
        resources: 4,
        influence: 2,
      },
    ],
    expansion: 'base',
  },

  // Blue Tiles (planetary systems)
  19: {
    id: 19,
    tileNumber: '19',
    type: 'blue',
    planets: [
      {
        id: 'wellon',
        name: 'Wellon',
        resources: 1,
        influence: 2,
        techSpecialty: 'yellow',
      },
    ],
    expansion: 'base',
  },
  20: {
    id: 20,
    tileNumber: '20',
    type: 'blue',
    planets: [
      {
        id: 'vefut_ii',
        name: 'Vefut II',
        resources: 2,
        influence: 2,
      },
    ],
    expansion: 'base',
  },
  21: {
    id: 21,
    tileNumber: '21',
    type: 'blue',
    planets: [
      {
        id: 'thibah',
        name: 'Thibah',
        resources: 1,
        influence: 1,
        techSpecialty: 'blue',
      },
    ],
    expansion: 'base',
  },
  22: {
    id: 22,
    tileNumber: '22',
    type: 'blue',
    planets: [
      {
        id: 'tarmann',
        name: 'Tarmann',
        resources: 1,
        influence: 1,
        trait: 'industrial',
      },
    ],
    expansion: 'base',
  },
  23: {
    id: 23,
    tileNumber: '23',
    type: 'blue',
    planets: [
      {
        id: 'saudor',
        name: 'Saudor',
        resources: 2,
        influence: 2,
        trait: 'industrial',
      },
    ],
    expansion: 'base',
  },
  24: {
    id: 24,
    tileNumber: '24',
    type: 'blue',
    planets: [
      {
        id: 'mehar_xull',
        name: 'Mehar Xull',
        resources: 1,
        influence: 3,
        techSpecialty: 'red',
      },
    ],
    expansion: 'base',
  },
  25: {
    id: 25,
    tileNumber: '25',
    type: 'blue',
    wormhole: 'beta',
    planets: [
      {
        id: 'quann',
        name: 'Quann',
        resources: 2,
        influence: 1,
        trait: 'cultural',
      },
    ],
    expansion: 'base',
  },
  26: {
    id: 26,
    tileNumber: '26',
    type: 'blue',
    wormhole: 'alpha',
    planets: [
      {
        id: 'lodor',
        name: 'Lodor',
        resources: 3,
        influence: 1,
        trait: 'cultural',
      },
    ],
    expansion: 'base',
  },
  27: {
    id: 27,
    tileNumber: '27',
    type: 'blue',
    planets: [
      {
        id: 'new_albion',
        name: 'New Albion',
        resources: 1,
        influence: 1,
        techSpecialty: 'green',
      },
      {
        id: 'starpoint',
        name: 'Starpoint',
        resources: 3,
        influence: 1,
      },
    ],
    expansion: 'base',
  },
  28: {
    id: 28,
    tileNumber: '28',
    type: 'blue',
    planets: [
      {
        id: 'tequ_ran',
        name: "Tequ'ran",
        resources: 2,
        influence: 0,
        trait: 'hazardous',
      },
      {
        id: 'torkan',
        name: 'Torkan',
        resources: 0,
        influence: 3,
        trait: 'cultural',
      },
    ],
    expansion: 'base',
  },
  29: {
    id: 29,
    tileNumber: '29',
    type: 'blue',
    planets: [
      {
        id: 'qucenn',
        name: "Qucen'n",
        resources: 1,
        influence: 2,
        trait: 'industrial',
      },
      {
        id: 'rarron',
        name: 'Rarron',
        resources: 0,
        influence: 3,
        trait: 'cultural',
      },
    ],
    expansion: 'base',
  },
  30: {
    id: 30,
    tileNumber: '30',
    type: 'blue',
    planets: [
      {
        id: 'mellon',
        name: 'Mellon',
        resources: 0,
        influence: 2,
        trait: 'cultural',
      },
      {
        id: 'zohbat',
        name: 'Zohbat',
        resources: 3,
        influence: 1,
        trait: 'hazardous',
      },
    ],
    expansion: 'base',
  },
  31: {
    id: 31,
    tileNumber: '31',
    type: 'blue',
    planets: [
      {
        id: 'lazar',
        name: 'Lazar',
        resources: 1,
        influence: 0,
        trait: 'industrial',
      },
      {
        id: 'sakulag',
        name: 'Sakulag',
        resources: 2,
        influence: 1,
        trait: 'hazardous',
      },
    ],
    expansion: 'base',
  },
  32: {
    id: 32,
    tileNumber: '32',
    type: 'blue',
    planets: [
      {
        id: 'dal_bootha',
        name: 'Dal Bootha',
        resources: 0,
        influence: 2,
        trait: 'cultural',
      },
      {
        id: 'xxehan',
        name: 'Xxehan',
        resources: 1,
        influence: 1,
        trait: 'cultural',
      },
    ],
    expansion: 'base',
  },
  33: {
    id: 33,
    tileNumber: '33',
    type: 'blue',
    planets: [
      {
        id: 'corneeq',
        name: 'Corneeq',
        resources: 1,
        influence: 2,
        trait: 'cultural',
      },
      {
        id: 'resculon',
        name: 'Resculon',
        resources: 2,
        influence: 0,
        trait: 'cultural',
      },
    ],
    expansion: 'base',
  },
  34: {
    id: 34,
    tileNumber: '34',
    type: 'blue',
    planets: [
      {
        id: 'centauri',
        name: 'Centauri',
        resources: 1,
        influence: 3,
        trait: 'cultural',
      },
      {
        id: 'gral',
        name: 'Gral',
        resources: 1,
        influence: 1,
        techSpecialty: 'blue',
        trait: 'industrial',
      },
    ],
    expansion: 'base',
  },
  35: {
    id: 35,
    tileNumber: '35',
    type: 'blue',
    planets: [
      {
        id: 'bereg',
        name: 'Bereg',
        resources: 3,
        influence: 1,
        trait: 'hazardous',
      },
      {
        id: 'lirta_iv',
        name: 'Lirta IV',
        resources: 2,
        influence: 3,
        trait: 'hazardous',
      },
    ],
    expansion: 'base',
  },
  36: {
    id: 36,
    tileNumber: '36',
    type: 'blue',
    planets: [
      {
        id: 'arnor',
        name: 'Arnor',
        resources: 2,
        influence: 1,
        trait: 'industrial',
      },
      {
        id: 'lor',
        name: 'Lor',
        resources: 1,
        influence: 2,
        trait: 'industrial',
      },
    ],
    expansion: 'base',
  },
  37: {
    id: 37,
    tileNumber: '37',
    type: 'blue',
    planets: [
      {
        id: 'arinam',
        name: 'Arinam',
        resources: 1,
        influence: 2,
        trait: 'industrial',
      },
      {
        id: 'meer',
        name: 'Meer',
        resources: 0,
        influence: 4,
        techSpecialty: 'red',
        trait: 'hazardous',
      },
    ],
    expansion: 'base',
  },
  38: {
    id: 38,
    tileNumber: '38',
    type: 'blue',
    planets: [
      {
        id: 'abyz',
        name: 'Abyz',
        resources: 3,
        influence: 0,
        trait: 'hazardous',
      },
      {
        id: 'fria',
        name: 'Fria',
        resources: 2,
        influence: 0,
        trait: 'hazardous',
      },
    ],
    expansion: 'base',
  },

  // Red Tiles (anomalies and empty)
  39: {
    id: 39,
    tileNumber: '39',
    type: 'red',
    wormhole: 'alpha',
    planets: [],
    expansion: 'base',
  },
  40: {
    id: 40,
    tileNumber: '40',
    type: 'red',
    wormhole: 'beta',
    planets: [],
    expansion: 'base',
  },
  41: {
    id: 41,
    tileNumber: '41',
    type: 'red',
    anomaly: 'gravity_rift',
    planets: [],
    expansion: 'base',
  },
  42: {
    id: 42,
    tileNumber: '42',
    type: 'red',
    anomaly: 'nebula',
    planets: [],
    expansion: 'base',
  },
  43: {
    id: 43,
    tileNumber: '43',
    type: 'red',
    anomaly: 'supernova',
    planets: [],
    expansion: 'base',
  },
  44: {
    id: 44,
    tileNumber: '44',
    type: 'red',
    anomaly: 'asteroid',
    planets: [],
    expansion: 'base',
  },
  45: {
    id: 45,
    tileNumber: '45',
    type: 'red',
    anomaly: 'asteroid',
    planets: [],
    expansion: 'base',
  },
  46: {
    id: 46,
    tileNumber: '46',
    type: 'red',
    planets: [],
    expansion: 'base',
  },
  47: {
    id: 47,
    tileNumber: '47',
    type: 'red',
    planets: [],
    expansion: 'base',
  },
  48: {
    id: 48,
    tileNumber: '48',
    type: 'red',
    planets: [],
    expansion: 'base',
  },
  49: {
    id: 49,
    tileNumber: '49',
    type: 'red',
    planets: [],
    expansion: 'base',
  },
  50: {
    id: 50,
    tileNumber: '50',
    type: 'red',
    planets: [],
    expansion: 'base',
  },

  // =====================================================================
  // PROPHECY OF KINGS - HOME SYSTEMS
  // =====================================================================

  // Tile 52: Argent Flight
  52: {
    id: 52,
    tileNumber: '52',
    type: 'home',
    factionId: 'argent',
    planets: [
      {
        id: 'valk_pok',
        name: 'Valk',
        resources: 2,
        influence: 0,
      },
      {
        id: 'avar_pok',
        name: 'Avar',
        resources: 1,
        influence: 1,
      },
      {
        id: 'ylir',
        name: 'Ylir',
        resources: 0,
        influence: 2,
      },
    ],
    expansion: 'pok',
  },

  // Tile 53: Empyrean
  53: {
    id: 53,
    tileNumber: '53',
    type: 'home',
    factionId: 'empyrean',
    planets: [
      {
        id: 'the_dark',
        name: 'The Dark',
        resources: 3,
        influence: 4,
      },
    ],
    expansion: 'pok',
  },

  // Tile 54: Mahact Gene-Sorcerers
  54: {
    id: 54,
    tileNumber: '54',
    type: 'home',
    factionId: 'mahact',
    planets: [
      {
        id: 'ixth',
        name: 'Ixth',
        resources: 3,
        influence: 5,
      },
    ],
    expansion: 'pok',
  },

  // Tile 55: Naaz-Rokha Alliance
  55: {
    id: 55,
    tileNumber: '55',
    type: 'home',
    factionId: 'naazrokha',
    planets: [
      {
        id: 'naazir',
        name: 'Naazir',
        resources: 2,
        influence: 1,
      },
      {
        id: 'rokha',
        name: 'Rokha',
        resources: 1,
        influence: 2,
      },
    ],
    expansion: 'pok',
  },

  // Tile 56: Nomad
  56: {
    id: 56,
    tileNumber: '56',
    type: 'home',
    factionId: 'nomad',
    planets: [
      {
        id: 'arcturus',
        name: 'Arcturus',
        resources: 4,
        influence: 4,
      },
    ],
    expansion: 'pok',
  },

  // Tile 57: Titans of Ul
  57: {
    id: 57,
    tileNumber: '57',
    type: 'home',
    factionId: 'ul',
    planets: [
      {
        id: 'elysium',
        name: 'Elysium',
        resources: 4,
        influence: 1,
      },
    ],
    expansion: 'pok',
  },

  // Tile 58: Vuil'raith Cabal
  58: {
    id: 58,
    tileNumber: '58',
    type: 'home',
    factionId: 'cabal',
    planets: [
      {
        id: 'acheron',
        name: 'Acheron',
        resources: 4,
        influence: 0,
      },
    ],
    expansion: 'pok',
  },

  // =====================================================================
  // PROPHECY OF KINGS - LEGENDARY PLANET TILES
  // =====================================================================

  // Tile 65: Primor - Legendary Industrial Planet
  65: {
    id: 65,
    tileNumber: '65',
    type: 'blue',
    planets: [
      {
        id: 'primor',
        name: 'Primor',
        resources: 2,
        influence: 1,
        trait: 'industrial',
        legendary: true,
        legendaryAbility: 'ACTION: Exhaust this card to purge up to 2 attachments from planets you control.',
      },
    ],
    expansion: 'pok',
  },

  // Tile 66: Hope\'s End - Legendary Hazardous Planet
  66: {
    id: 66,
    tileNumber: '66',
    type: 'blue',
    planets: [
      {
        id: 'hopes_end',
        name: "Hope's End",
        resources: 3,
        influence: 0,
        trait: 'hazardous',
        legendary: true,
        legendaryAbility: 'ACTION: Exhaust this card to draw 3 action cards. Then, choose 3 action cards from your hand and place them on the bottom of the action card deck in any order.',
      },
    ],
    expansion: 'pok',
  },

  // Tile 82: Mallice - Legendary Wormhole Planet
  82: {
    id: 82,
    tileNumber: '82',
    type: 'blue',
    wormhole: 'alpha',
    planets: [
      {
        id: 'mallice',
        name: 'Mallice',
        resources: 0,
        influence: 3,
        legendary: true,
        legendaryAbility: 'ACTION: Exhaust this card to produce up to 2 units in this system.',
      },
    ],
    expansion: 'pok',
  },

  // =====================================================================
  // PROPHECY OF KINGS - BLUE TILES
  // =====================================================================

  // Tile 59: New Albion + Starpoint
  59: {
    id: 59,
    tileNumber: '59',
    type: 'blue',
    planets: [
      {
        id: 'new_albion',
        name: 'New Albion',
        resources: 1,
        influence: 1,
        trait: 'industrial',
        techSpecialty: 'green',
      },
      {
        id: 'starpoint',
        name: 'Starpoint',
        resources: 3,
        influence: 1,
        trait: 'hazardous',
      },
    ],
    expansion: 'pok',
  },

  // Tile 60: Abyz + Fria
  60: {
    id: 60,
    tileNumber: '60',
    type: 'blue',
    planets: [
      {
        id: 'abyz',
        name: 'Abyz',
        resources: 3,
        influence: 0,
        trait: 'hazardous',
      },
      {
        id: 'fria',
        name: 'Fria',
        resources: 2,
        influence: 0,
        trait: 'hazardous',
      },
    ],
    expansion: 'pok',
  },

  // Tile 61: Axis
  61: {
    id: 61,
    tileNumber: '61',
    type: 'blue',
    planets: [
      {
        id: 'axis',
        name: 'Axis',
        resources: 5,
        influence: 0,
        trait: 'industrial',
      },
    ],
    expansion: 'pok',
  },

  // Tile 62: Etir V
  62: {
    id: 62,
    tileNumber: '62',
    type: 'blue',
    planets: [
      {
        id: 'etir_v',
        name: 'Etir V',
        resources: 2,
        influence: 1,
        trait: 'hazardous',
        techSpecialty: 'yellow',
      },
    ],
    expansion: 'pok',
  },

  // Tile 63: Valk + Avar
  63: {
    id: 63,
    tileNumber: '63',
    type: 'blue',
    planets: [
      {
        id: 'valk',
        name: 'Valk',
        resources: 2,
        influence: 0,
        trait: 'hazardous',
      },
      {
        id: 'avar',
        name: 'Avar',
        resources: 1,
        influence: 1,
        trait: 'industrial',
      },
    ],
    expansion: 'pok',
  },

  // Tile 64: Lirta IV
  64: {
    id: 64,
    tileNumber: '64',
    type: 'blue',
    planets: [
      {
        id: 'lirta_iv',
        name: 'Lirta IV',
        resources: 2,
        influence: 3,
        trait: 'cultural',
      },
    ],
    expansion: 'pok',
  },

  // Tile 67: Cormund
  67: {
    id: 67,
    tileNumber: '67',
    type: 'blue',
    planets: [
      {
        id: 'cormund',
        name: 'Cormund',
        resources: 2,
        influence: 0,
        trait: 'hazardous',
      },
    ],
    expansion: 'pok',
  },

  // Tile 68: Everra
  68: {
    id: 68,
    tileNumber: '68',
    type: 'blue',
    planets: [
      {
        id: 'everra',
        name: 'Everra',
        resources: 3,
        influence: 1,
        trait: 'cultural',
      },
    ],
    expansion: 'pok',
  },

  // Tile 69: Accoen + Jeol Ir
  69: {
    id: 69,
    tileNumber: '69',
    type: 'blue',
    planets: [
      {
        id: 'accoen',
        name: 'Accoen',
        resources: 2,
        influence: 3,
        trait: 'industrial',
      },
      {
        id: 'jeol_ir',
        name: 'Jeol Ir',
        resources: 2,
        influence: 3,
        trait: 'industrial',
      },
    ],
    expansion: 'pok',
  },

  // Tile 70: Kraag + Siig
  70: {
    id: 70,
    tileNumber: '70',
    type: 'blue',
    planets: [
      {
        id: 'kraag',
        name: 'Kraag',
        resources: 2,
        influence: 1,
        trait: 'hazardous',
      },
      {
        id: 'siig',
        name: 'Siig',
        resources: 0,
        influence: 2,
        trait: 'hazardous',
      },
    ],
    expansion: 'pok',
  },

  // Tile 71: Bakal + Alio Prima
  71: {
    id: 71,
    tileNumber: '71',
    type: 'blue',
    planets: [
      {
        id: 'bakal',
        name: 'Bakal',
        resources: 3,
        influence: 2,
        trait: 'industrial',
      },
      {
        id: 'alio_prima',
        name: 'Alio Prima',
        resources: 1,
        influence: 1,
        trait: 'cultural',
      },
    ],
    expansion: 'pok',
  },

  // Tile 72: Lisis + Velnor
  72: {
    id: 72,
    tileNumber: '72',
    type: 'blue',
    planets: [
      {
        id: 'lisis',
        name: 'Lisis',
        resources: 2,
        influence: 2,
        trait: 'industrial',
      },
      {
        id: 'velnor',
        name: 'Velnor',
        resources: 2,
        influence: 0,
        trait: 'industrial',
        techSpecialty: 'red',
      },
    ],
    expansion: 'pok',
  },

  // Tile 73: Cealdri + Xanhact
  73: {
    id: 73,
    tileNumber: '73',
    type: 'blue',
    planets: [
      {
        id: 'cealdri',
        name: 'Cealdri',
        resources: 0,
        influence: 2,
        trait: 'cultural',
        techSpecialty: 'yellow',
      },
      {
        id: 'xanhact',
        name: 'Xanhact',
        resources: 0,
        influence: 1,
        trait: 'hazardous',
      },
    ],
    expansion: 'pok',
  },

  // Tile 74: Vega Major + Vega Minor
  74: {
    id: 74,
    tileNumber: '74',
    type: 'blue',
    planets: [
      {
        id: 'vega_major',
        name: 'Vega Major',
        resources: 2,
        influence: 1,
        trait: 'cultural',
      },
      {
        id: 'vega_minor',
        name: 'Vega Minor',
        resources: 1,
        influence: 2,
        trait: 'cultural',
        techSpecialty: 'blue',
      },
    ],
    expansion: 'pok',
  },

  // Tile 75: Loki
  75: {
    id: 75,
    tileNumber: '75',
    type: 'blue',
    planets: [
      {
        id: 'loki',
        name: 'Loki',
        resources: 1,
        influence: 2,
        trait: 'cultural',
      },
    ],
    expansion: 'pok',
  },

  // Tile 76: Abaddon + Ashtroth + Loki
  76: {
    id: 76,
    tileNumber: '76',
    type: 'blue',
    planets: [
      {
        id: 'abaddon',
        name: 'Abaddon',
        resources: 1,
        influence: 0,
        trait: 'cultural',
      },
      {
        id: 'ashtroth',
        name: 'Ashtroth',
        resources: 2,
        influence: 0,
        trait: 'hazardous',
      },
      {
        id: 'hazadon',
        name: 'Hazadon',
        resources: 1,
        influence: 0,
        trait: 'cultural',
      },
    ],
    expansion: 'pok',
  },

  // =====================================================================
  // PROPHECY OF KINGS - RED TILES
  // =====================================================================

  // Tile 77: Empty
  77: {
    id: 77,
    tileNumber: '77',
    type: 'red',
    planets: [],
    expansion: 'pok',
  },

  // Tile 78: Empty
  78: {
    id: 78,
    tileNumber: '78',
    type: 'red',
    planets: [],
    expansion: 'pok',
  },

  // Tile 79: Gravity Rift
  79: {
    id: 79,
    tileNumber: '79',
    type: 'red',
    anomaly: 'gravity_rift',
    planets: [],
    expansion: 'pok',
  },

  // Tile 80: Supernova
  80: {
    id: 80,
    tileNumber: '80',
    type: 'red',
    anomaly: 'supernova',
    planets: [],
    expansion: 'pok',
  },

  // Tile 81: Muaat supernova (with wormhole)
  81: {
    id: 81,
    tileNumber: '81',
    type: 'red',
    anomaly: 'supernova',
    wormhole: 'beta',
    planets: [],
    expansion: 'pok',
  },

  // =====================================================================
  // PROPHECY OF KINGS - HYPERLANE TILES
  // =====================================================================
  // Hyperlane tiles are used to connect different parts of the 7-8 player maps.
  // They contain no planets but provide movement paths between systems.

  // HYPERLANE TILES (83-91)
  // Edge indices: 0=top, 1=top-right, 2=bottom-right, 3=bottom, 4=bottom-left, 5=top-left
  // Each tile has A and B sides with different connection patterns.
  // hyperlaneConnections = A side, hyperlaneConnectionsB = B side
  // Connections are at rotation 0; actual connections depend on tile rotation in map.
  // IMPORTANT: Edges that converge at a single point are NOT connected to each other.
  // E.g., if edge 0 connects to edges 2, 3, and 4, those three edges don't connect to each other.

  // Tile 83: Straight line (A) / Bent Y-shape (B)
  83: {
    id: 83,
    tileNumber: '83',
    type: 'hyperlane',
    planets: [],
    expansion: 'pok',
    // A side: a → d (straight vertical)
    hyperlaneConnections: [[0, 3]],
    // B side: a → c,d / d → f (bent Y-shape)
    hyperlaneConnectionsB: [
      [0, 2],
      [0, 3],
      [3, 5],
    ],
  },

  // Tile 84: Straight line (A) / Fan with crossover (B)
  84: {
    id: 84,
    tileNumber: '84',
    type: 'hyperlane',
    planets: [],
    expansion: 'pok',
    // A side: a → d (straight vertical)
    hyperlaneConnections: [[0, 3]],
    // B side: a → d,e / d → b (fan from top with crossover)
    hyperlaneConnectionsB: [
      [0, 3],
      [0, 4],
      [3, 1],
    ],
  },

  // Tile 85: Diagonal (A) / Bent Y-shape (B)
  85: {
    id: 85,
    tileNumber: '85',
    type: 'hyperlane',
    planets: [],
    expansion: 'pok',
    // A side: a → c (diagonal)
    hyperlaneConnections: [[0, 2]],
    // B side: a → c,d / d → f (bent Y-shape)
    hyperlaneConnectionsB: [
      [0, 2],
      [0, 3],
      [3, 5],
    ],
  },

  // Tile 86: Diagonal (A) / Same as A (B)
  86: {
    id: 86,
    tileNumber: '86',
    type: 'hyperlane',
    planets: [],
    expansion: 'pok',
    // A side: a → c (diagonal)
    hyperlaneConnections: [[0, 2]],
    // B side: same pattern as A
    hyperlaneConnectionsB: [[0, 2]],
  },

  // Tile 87: Fan to three edges (A) / Fan to two edges (B)
  87: {
    id: 87,
    tileNumber: '87',
    type: 'hyperlane',
    planets: [],
    expansion: 'pok',
    // A side: a → c,d,e (fan from top to three edges)
    hyperlaneConnections: [
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    // B side: a → c,d (fan from top to two edges)
    hyperlaneConnectionsB: [
      [0, 2],
      [0, 3],
    ],
  },

  // Tile 88: Fan to three edges (A) / Bent Y-shape (B)
  88: {
    id: 88,
    tileNumber: '88',
    type: 'hyperlane',
    planets: [],
    expansion: 'pok',
    // A side: a → c,d,e (fan from top to three edges)
    hyperlaneConnections: [
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    // B side: a → c,d / d → f (bent Y-shape)
    hyperlaneConnectionsB: [
      [0, 2],
      [0, 3],
      [3, 5],
    ],
  },

  // Tile 89: Two bent paths (A) / Two diagonal paths (B)
  89: {
    id: 89,
    tileNumber: '89',
    type: 'hyperlane',
    planets: [],
    expansion: 'pok',
    // A side: two bent lines
    hyperlaneConnections: [
      [0, 2],
      [3, 5],
    ],
    // B side: two different bent lines
    hyperlaneConnectionsB: [
      [1, 3],
      [4, 0],
    ],
  },

  // Tile 90: Two crossing paths (A) / Two parallel diagonals (B)
  90: {
    id: 90,
    tileNumber: '90',
    type: 'hyperlane',
    planets: [],
    expansion: 'pok',
    // A side: two crossing diagonal paths
    hyperlaneConnections: [
      [0, 2],
      [1, 5],
    ],
    // B side: two parallel diagonal paths
    hyperlaneConnectionsB: [
      [0, 2],
      [3, 5],
    ],
  },

  // Tile 91: Two straight lines (A) / Complex pattern (B)
  91: {
    id: 91,
    tileNumber: '91',
    type: 'hyperlane',
    planets: [],
    expansion: 'pok',
    // A side: two straight parallel lines
    hyperlaneConnections: [
      [0, 3],
      [1, 4],
    ],
    // B side: different arrangement
    hyperlaneConnectionsB: [
      [0, 3],
      [2, 5],
    ],
  },
};
