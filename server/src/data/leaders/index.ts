// Leaders - extracted from TI4_map_generator_bot
// Generated: 2025-09-01T17:46:34.164Z

export * from './agents';
export * from './commanders';
export * from './heroes';

import { agents, AgentLeader } from './agents';
import { commanders, CommanderLeader } from './commanders';
import { heroes, HeroLeader } from './heroes';

export type Leader = AgentLeader | CommanderLeader | HeroLeader;

export const allLeaders: Leader[] = [
  ...agents,
  ...commanders,
  ...heroes
];

export const getLeadersByFaction = (faction: string): Leader[] => {
  return allLeaders.filter(leader => leader.faction === faction);
};

export const getLeaderByName = (name: string): Leader | undefined => {
  return allLeaders.find(leader => leader.name === name);
};

export const getLeaderById = (id: string): Leader | undefined => {
  return allLeaders.find(leader => leader.id === id);
};

export const getOfficialLeaders = (): Leader[] => {
  return allLeaders.filter(leader => leader.source === 'pok');
};

export const getDiscordantStarsLeaders = (): Leader[] => {
  return allLeaders.filter(leader => leader.source === 'ds');
};

// Get unique factions that have leaders
export const getFactionsWithLeaders = (): string[] => {
  const factions = new Set(allLeaders.map(leader => leader.faction));
  return Array.from(factions).sort();
};
