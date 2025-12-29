import type { StrategyCardData } from '@ti4/shared';

export const strategyCards: Record<number, StrategyCardData> = {
  1: {
    number: 1,
    name: 'Leadership',
    initiative: 1,
    primaryAbility: 'Gain 3 command tokens. Then, spend any amount of influence to gain 1 command token for every 3 influence spent.',
    secondaryAbility: 'Spend any amount of influence to gain 1 command token for every 3 influence spent.',
  },
  2: {
    number: 2,
    name: 'Diplomacy',
    initiative: 2,
    primaryAbility: 'Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system. Then, ready up to 2 exhausted planets you control.',
    secondaryAbility: 'Spend 1 token from your strategy pool to ready up to 2 exhausted planets you control.',
  },
  3: {
    number: 3,
    name: 'Politics',
    initiative: 3,
    primaryAbility: 'Choose a player other than the speaker. That player gains the speaker token. Draw 2 action cards. Look at the top 2 cards of the agenda deck. Place each card on the top or bottom of that deck in any order.',
    secondaryAbility: 'Spend 1 token from your strategy pool to draw 2 action cards.',
  },
  4: {
    number: 4,
    name: 'Construction',
    initiative: 4,
    primaryAbility: 'Place 1 PDS or 1 space dock on a planet you control. Then, place 1 PDS on a planet you control.',
    secondaryAbility: 'Spend 1 token from your strategy pool and place it in any system; you may place either 1 PDS or 1 space dock on a planet you control in that system.',
  },
  5: {
    number: 5,
    name: 'Trade',
    initiative: 5,
    primaryAbility: 'Gain 3 trade goods. Replenish commodities. Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token.',
    secondaryAbility: 'Spend 1 token from your strategy pool to replenish your commodities.',
  },
  6: {
    number: 6,
    name: 'Warfare',
    initiative: 6,
    primaryAbility: 'Remove 1 of your command tokens from the game board; then, gain 1 command token. You may redistribute your command tokens.',
    secondaryAbility: 'Spend 1 token from your strategy pool to use the PRODUCTION ability of 1 of your space docks in your home system. PRODUCTION value of this use of the PRODUCTION ability is increased by 2.',
  },
  7: {
    number: 7,
    name: 'Technology',
    initiative: 7,
    primaryAbility: 'Research 1 technology. Then, you may spend 6 resources to research 1 technology.',
    secondaryAbility: 'Spend 1 token from your strategy pool and 4 resources to research 1 technology.',
  },
  8: {
    number: 8,
    name: 'Imperial',
    initiative: 8,
    primaryAbility: 'Immediately score 1 public objective if you fulfill its requirements. Then, draw 1 secret objective. Then, gain 1 victory point if you control Mecatol Rex; otherwise, you may place 1 command token from your reinforcements in the Mecatol Rex system.',
    secondaryAbility: 'Spend 1 token from your strategy pool to draw 1 secret objective.',
  },
};
