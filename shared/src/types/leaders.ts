// Leader type definitions

export interface BaseLeader {
  id: string;
  name: string;
  title?: string | null;
  faction: string;
  abilityName?: string | null;
  abilityWindow?: string | null;
  abilityText?: string | null;
  unlockCondition?: string | null;
  source: string;
  shortName?: string | null;
}

export interface AgentLeader extends BaseLeader {
  type: 'Agent';
}

export interface CommanderLeader extends BaseLeader {
  type: 'Commander';
}

export interface HeroLeader extends BaseLeader {
  type: 'Hero';
  isExhausted?: boolean;
}

export type Leader = AgentLeader | CommanderLeader | HeroLeader;

// API response types
export interface FactionLeaders {
  agent: AgentLeader;
  commander: CommanderLeader;
  hero: HeroLeader;
}