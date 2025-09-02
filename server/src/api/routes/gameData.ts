import { Router, Request, Response, NextFunction } from 'express';
import { 
  PublicGameData,
  PlayerCards,
  FactionLeaders,
  PlayerTechnologies
} from '@ti4/shared';

// Import all server-side data
import { baseFactions } from '../../data/factions/base';
import { pokFactions } from '../../data/factions/pok';
import { systemTiles } from '../../data/tiles/systems';
import { objectives } from '../../data/cards/objective';
import { strategyCards } from '../../data/cards/strategy';
import { actionCards } from '../../data/cards/action';
import { agendaCards } from '../../data/cards/agenda';
import { explorationCards } from '../../data/cards/exploration';
import { promissoryNotes } from '../../data/cards/promissory';
import { relicCards } from '../../data/cards/relic';
import { agents } from '../../data/leaders/agents';
import { commanders } from '../../data/leaders/commanders';
import { heroes } from '../../data/leaders/heroes';
import { allBasicTechnologies } from '../../data/technologies/basic';
import { allUnitUpgrades } from '../../data/technologies/unit-upgrades';
import { allFactionTechnologies, factionTechnologies } from '../../data/technologies/faction';
import { mapTemplates } from '../../data/map-templates';
import { units } from '../../data/units';
import { rules } from '../../data/rules';
import { combatModifiers } from '../../data/combat-modifiers';

const router = Router();

// Public endpoints - no authentication required

// Get initial game setup data
router.get('/setup', (_req: Request, res: Response) => {
  // Type assertion since our extracted data has simpler structure
  const setupData = {
    factions: [...baseFactions, ...pokFactions] as any,
    mapTemplates: mapTemplates as any,
    availableColors: ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'pink', 'black']
  };
  res.json(setupData);
});

// Get reference data (rules, units, etc)
router.get('/reference', (_req: Request, res: Response) => {
  const referenceData = {
    technologies: [...allBasicTechnologies, ...allUnitUpgrades, ...allFactionTechnologies] as any,
    units: units as any,
    rules: rules as any,
    combatModifiers: combatModifiers as any
  };
  res.json(referenceData);
});

// Get specific faction data
router.get('/faction/:factionId', (req: Request, res: Response) => {
  const { factionId } = req.params;
  
  const faction = [...baseFactions, ...pokFactions].find(f => f.id === factionId);
  if (!faction) {
    return res.status(404).json({ error: 'Faction not found' });
  }
  
  const factionLeaders: FactionLeaders = {
    agent: agents.find(a => a.faction === factionId)!,
    commander: commanders.find(c => c.faction === factionId)!,
    hero: heroes.find(h => h.faction === factionId)!
  };
  
  const factionTechs = factionTechnologies[factionId] || [];
  
  return res.json({
    faction,
    leaders: factionLeaders,
    technologies: factionTechs
  });
});

// Get public objectives only
router.get('/objectives/public', (_req: Request, res: Response) => {
  const publicObjectives = objectives.filter(obj => obj.type === 'public');
  res.json(publicObjectives);
});

// Get strategy cards
router.get('/strategy-cards', (_req: Request, res: Response) => {
  res.json(strategyCards);
});

// Get system tiles (for map generation)
router.get('/tiles/systems', (_req: Request, res: Response) => {
  res.json(systemTiles);
});

// Protected endpoints - require authentication and game context

// Get player's private cards (requires auth)
router.get('/game/:gameId/player/:playerId/cards', authenticate, (_req: Request, res: Response) => {
  // const { gameId, playerId } = req.params; // TODO: Use when implementing game state
  
  // TODO: Verify player is in this game
  // TODO: Get actual player cards from game state
  
  // Mock response for now
  const playerCards: PlayerCards = {
    hand: [], // Would be populated from game state
    promissoryNotes: [],
    relics: [],
    secretObjectives: []
  };
  
  res.json(playerCards);
});

// Get player's technologies (requires auth)
router.get('/game/:gameId/player/:playerId/technologies', authenticate, (_req: Request, res: Response) => {
  // const { gameId, playerId } = req.params; // TODO: Use when implementing game state
  
  // TODO: Get from game state
  const playerTech: PlayerTechnologies = {
    researched: [],
    available: [],
    startingTech: []
  };
  
  res.json(playerTech);
});

// Get current public game state
router.get('/game/:gameId/public', (_req: Request, res: Response) => {
  // const { gameId } = req.params; // TODO: Use when implementing actual game state
  
  // TODO: Get from actual game state
  const publicData: PublicGameData = {
    board: [], // Current board state
    publicObjectives: [], // Currently revealed objectives
    strategyCards: strategyCards as any, // Type assertion for incomplete data
    currentPhase: 'strategy',
    round: 1,
    speaker: ''
  };
  
  res.json(publicData);
});

// Admin endpoints for testing

// Get all data (dev only)
router.get('/admin/all-data', authenticate, requireAdmin, (_req: Request, res: Response) => {
  res.json({
    factions: [...baseFactions, ...pokFactions],
    cards: {
      action: actionCards,
      agenda: agendaCards,
      exploration: explorationCards,
      objective: objectives,
      promissory: promissoryNotes,
      relic: relicCards,
      strategy: strategyCards
    },
    leaders: {
      agents,
      commanders,
      heroes
    },
    technologies: {
      basic: allBasicTechnologies,
      unitUpgrades: allUnitUpgrades,
      faction: factionTechnologies
    },
    tiles: systemTiles,
    units,
    rules,
    combatModifiers
  });
});

// Middleware functions (placeholder)
function authenticate(_req: Request, _res: Response, next: NextFunction) {
  // TODO: Implement JWT or session authentication
  next();
}

function requireAdmin(_req: Request, _res: Response, next: NextFunction) {
  // TODO: Check if user is admin
  next();
}

export default router;