import type {
  GameState,
  ExploreAction,
  PurgeRelicFragmentsAction,
  ExplorationDecks,
} from '@ti4/shared';
import {
  getExplorationCard,
  isRelicFragment,
  isAttachment,
  isInstantEffect,
  getInitialExplorationDeck,
  getInitialRelicDeck,
  type RelicFragmentType,
} from '@ti4/shared';
import type { HandlerResult } from '../game-machine.js';
import { systems } from '@ti4/game-data';
import { addLogEntry } from '../utils/game-log.js';
import { shuffleDeck } from '../utils/deck.js';

/**
 * Handle a planet exploration action
 */
export function handleExplore(
  state: GameState,
  action: ExploreAction
): HandlerResult {
  const { playerId, planetId } = action;
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  // Find the planet on the map
  let targetPlanet = null;
  let systemTile = null;

  for (const tile of state.map.tiles) {
    const planet = tile.planets.find((p) => p.planetId === planetId);
    if (planet) {
      targetPlanet = planet;
      systemTile = tile;
      break;
    }
  }

  if (!targetPlanet || !systemTile) {
    return { success: false, error: 'Planet not found' };
  }

  // Get planet data to find trait
  const systemData = systems[systemTile.systemId];
  if (!systemData) {
    return { success: false, error: 'System data not found' };
  }

  const planetData = systemData.planets.find((p: { id: string }) => p.id === planetId);
  if (!planetData?.trait) {
    return { success: false, error: 'Planet has no trait' };
  }

  const deckType = planetData.trait as keyof ExplorationDecks;

  // Initialize exploration decks if needed
  if (!state.explorationDecks) {
    state.explorationDecks = {
      cultural: [],
      industrial: [],
      hazardous: [],
      frontier: [],
    };
  }

  // Draw from deck
  const deck = state.explorationDecks[deckType];
  if (!deck || deck.length === 0) {
    return { success: false, error: `${deckType} exploration deck is empty` };
  }

  const drawnCardId = deck.shift()!;
  const cardData = getExplorationCard(drawnCardId);

  if (!cardData) {
    return { success: false, error: 'Invalid exploration card' };
  }

  // Track explored planet this turn
  if (!state.planetsExploredThisTurn) {
    state.planetsExploredThisTurn = [];
  }
  state.planetsExploredThisTurn.push(planetId);

  // Log the exploration
  addLogEntry(
    state,
    'planet_explored',
    `${player.name} explored ${planetData.name} and drew ${cardData.name}`,
    {
      playerId,
      details: {
        planetId,
        planetName: planetData.name,
        explorationCardId: drawnCardId,
        explorationCardName: cardData.name,
        explorationDeckType: deckType,
      },
    }
  );

  // Resolve card effect based on subtype
  const result = resolveExplorationCard(state, player, targetPlanet, cardData, drawnCardId);

  return {
    success: true,
    triggeredEvents: ['exploration_complete'],
    data: {
      cardId: drawnCardId,
      cardName: cardData.name,
      cardSubtype: cardData.subtype,
      effectResult: result,
    },
  };
}

/**
 * Resolve the effects of an exploration card
 */
function resolveExplorationCard(
  state: GameState,
  player: { id: string; name: string; relicFragments?: { cultural: number; industrial: number; hazardous: number; unknown: number }; commodities: number; maxCommodities: number; tradeGoods: number },
  planet: { planetId: string; attachments: string[] },
  cardData: ReturnType<typeof getExplorationCard>,
  cardId: string
): Record<string, unknown> {
  if (!cardData) return {};

  const result: Record<string, unknown> = {};

  if (isRelicFragment(cardId)) {
    // Fragment card - add to player's fragment count
    const fragmentType = cardData.effects[0]?.fragmentType as RelicFragmentType;
    if (fragmentType) {
      if (!player.relicFragments) {
        player.relicFragments = { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 };
      }
      player.relicFragments[fragmentType] = (player.relicFragments[fragmentType] || 0) + 1;
      result.fragmentType = fragmentType;
      result.newFragmentCount = player.relicFragments[fragmentType];

      // Add to discard pile
      if (!state.explorationDiscard) {
        state.explorationDiscard = [];
      }
      state.explorationDiscard.push(cardId);

      addLogEntry(
        state,
        'relic_fragment_gained',
        `${player.name} gained a ${fragmentType} relic fragment`,
        {
          playerId: player.id,
          details: {
            fragmentType,
            fragmentCount: player.relicFragments[fragmentType],
          },
        }
      );
    }
  } else if (isAttachment(cardId)) {
    // Attachment card - attach to planet
    if (!planet.attachments) {
      planet.attachments = [];
    }
    planet.attachments.push(cardId);
    result.attached = true;

    addLogEntry(
      state,
      'attachment_placed',
      `${player.name} attached ${cardData.name} to ${planet.planetId}`,
      {
        playerId: player.id,
        details: {
          attachmentId: cardId,
          attachmentName: cardData.name,
          planetId: planet.planetId,
        },
      }
    );
  } else if (isInstantEffect(cardId)) {
    // Instant effect - apply and discard
    for (const effect of cardData.effects) {
      switch (effect.type) {
        case 'gain_commodities':
          if (effect.amount) {
            const gained = Math.min(effect.amount, player.maxCommodities - player.commodities);
            player.commodities += gained;
            result.commoditiesGained = gained;
          }
          break;

        case 'gain_trade_goods':
          if (effect.amount) {
            player.tradeGoods += effect.amount;
            result.tradeGoodsGained = effect.amount;
          }
          break;

        case 'draw_action_cards':
          if (effect.amount) {
            // Draw from action card deck
            const drawn: string[] = [];
            for (let i = 0; i < effect.amount; i++) {
              if (state.actionCardDeck.length > 0) {
                const card = state.actionCardDeck.shift()!;
                const fullPlayer = state.players.find((p) => p.id === player.id);
                if (fullPlayer) {
                  fullPlayer.actionCards.push(card);
                  drawn.push(card);
                }
              }
            }
            result.actionCardsDrawn = drawn.length;
          }
          break;

        case 'gain_unit':
          // Place unit from reinforcements on the planet
          // This would need unit placement logic
          result.unitGained = effect.unitType;
          break;

        case 'special':
          // Handle special exploration card effects
          result.specialEffect = effect.special;
          switch (effect.special) {
            case 'replenish_commodities':
              // Merchant Station: Replenish commodities
              const commoditiesGained = player.maxCommodities - player.commodities;
              player.commodities = player.maxCommodities;
              result.commoditiesReplenished = commoditiesGained;
              addLogEntry(
                state,
                'planet_explored',
                `${player.name} replenished ${commoditiesGained} commodities`,
                { playerId: player.id }
              );
              break;

            case 'roll_for_reward':
              // Enigmatic Device: Roll 1-3: gain 2 TG, 4-6: gain a relic
              const roll = Math.floor(Math.random() * 6) + 1;
              result.enigmaticDeviceRoll = roll;
              if (roll <= 3) {
                player.tradeGoods += 2;
                result.tradeGoodsGained = 2;
                addLogEntry(
                  state,
                  'planet_explored',
                  `${player.name} rolled ${roll} on Enigmatic Device and gained 2 trade goods`,
                  { playerId: player.id }
                );
              } else {
                // Gain a relic
                if (state.relicDeck && state.relicDeck.length > 0) {
                  const relicId = state.relicDeck.shift()!;
                  const fullPlayer = state.players.find((p) => p.id === player.id);
                  if (fullPlayer) {
                    if (!fullPlayer.relics) {
                      fullPlayer.relics = [];
                    }
                    fullPlayer.relics.push(relicId);
                    result.relicGained = relicId;
                    addLogEntry(
                      state,
                      'planet_explored',
                      `${player.name} rolled ${roll} on Enigmatic Device and gained a relic!`,
                      { playerId: player.id }
                    );
                  }
                }
              }
              break;

            case 'draw_relic_for_influence':
              // Tomb of Emphidia: Player may spend 6 influence to gain a relic
              // This is a choice that needs player interaction
              // For now, mark as pending choice
              result.pendingChoice = 'tomb_of_emphidia';
              result.choiceDescription = 'Spend 6 influence to gain a relic?';
              break;

            case 'combat_penalty':
              // Ion Storm: Attached planet gives -1 to all combat rolls in this system
              // This is stored as an attachment effect (handled in combat)
              result.combatModifier = -1;
              break;

            case 'place_gamma_wormhole':
              // Place a gamma wormhole token in this system (for planet cards)
              // Note: Frontier cards handle this separately
              result.pendingWormhole = 'gamma';
              break;

            case 'place_mirage_planet':
              // Creates a planet in the system
              // This is complex and needs special handling for the Mirage planet
              result.miragePlaced = true;
              break;
          }
          break;
      }
    }

    // Add to discard pile
    if (!state.explorationDiscard) {
      state.explorationDiscard = [];
    }
    state.explorationDiscard.push(cardId);
  }

  return result;
}

/**
 * Handle frontier exploration (empty space)
 */
export function handleExploreFrontier(
  state: GameState,
  action: ExploreAction & { systemPosition?: { q: number; r: number } }
): HandlerResult {
  const { playerId, systemPosition } = action;
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!systemPosition) {
    return { success: false, error: 'System position required for frontier exploration' };
  }

  // Find the tile
  const tile = state.map.tiles.find(
    (t) => t.position.q === systemPosition.q && t.position.r === systemPosition.r
  );

  if (!tile) {
    return { success: false, error: 'System not found' };
  }

  if (!tile.frontier) {
    return { success: false, error: 'This system does not have a frontier token' };
  }

  // Initialize frontier deck if needed
  if (!state.explorationDecks) {
    state.explorationDecks = {
      cultural: [],
      industrial: [],
      hazardous: [],
      frontier: [],
    };
  }

  const deck = state.explorationDecks.frontier;
  if (!deck || deck.length === 0) {
    return { success: false, error: 'Frontier exploration deck is empty' };
  }

  const drawnCardId = deck.shift()!;
  const cardData = getExplorationCard(drawnCardId);

  if (!cardData) {
    return { success: false, error: 'Invalid exploration card' };
  }

  // Remove the frontier token - it can only be explored once
  tile.frontier = undefined;

  addLogEntry(
    state,
    'planet_explored',
    `${player.name} explored the frontier and drew ${cardData.name}`,
    {
      playerId,
      details: {
        explorationCardId: drawnCardId,
        explorationCardName: cardData.name,
        explorationDeckType: 'frontier',
        systemPosition,
      },
    }
  );

  // Apply the frontier card effect
  const effectResult = resolveFrontierCard(state, player, cardData, drawnCardId, tile);

  return {
    success: true,
    triggeredEvents: ['exploration_complete'],
    data: {
      cardId: drawnCardId,
      cardName: cardData.name,
      cardSubtype: cardData.subtype,
      ...effectResult,
    },
  };
}

/**
 * Resolve a frontier exploration card effect
 * Frontier cards are fragments, instant effects, or special (gamma wormhole, ion storm, mirage)
 */
function resolveFrontierCard(
  state: GameState,
  player: { id: string; name: string; relicFragments?: { cultural: number; industrial: number; hazardous: number; unknown: number }; commodities: number; maxCommodities: number; tradeGoods: number },
  cardData: ReturnType<typeof getExplorationCard>,
  cardId: string,
  tile: { position: { q: number; r: number }; wormhole: string | null }
): Record<string, unknown> {
  if (!cardData) return {};

  const result: Record<string, unknown> = {};

  if (isRelicFragment(cardId)) {
    // Fragment card - add to player's fragment count (frontier gives 'unknown' fragments)
    const fragmentType = cardData.effects[0]?.fragmentType as RelicFragmentType || 'unknown';
    if (!player.relicFragments) {
      player.relicFragments = { cultural: 0, industrial: 0, hazardous: 0, unknown: 0 };
    }
    player.relicFragments[fragmentType] = (player.relicFragments[fragmentType] || 0) + 1;
    result.fragmentType = fragmentType;
    result.newFragmentCount = player.relicFragments[fragmentType];

    // Add to discard pile
    if (!state.explorationDiscard) {
      state.explorationDiscard = [];
    }
    state.explorationDiscard.push(cardId);

    addLogEntry(
      state,
      'relic_fragment_gained',
      `${player.name} gained an unknown relic fragment from frontier exploration`,
      {
        playerId: player.id,
        details: {
          fragmentType,
          fragmentCount: player.relicFragments[fragmentType],
        },
      }
    );
  } else if (isInstantEffect(cardId)) {
    // Instant effect - apply and discard
    for (const effect of cardData.effects) {
      switch (effect.type) {
        case 'gain_commodities':
          if (effect.amount) {
            const gained = Math.min(effect.amount, player.maxCommodities - player.commodities);
            player.commodities += gained;
            result.commoditiesGained = gained;
          }
          break;

        case 'gain_trade_goods':
          if (effect.amount) {
            player.tradeGoods += effect.amount;
            result.tradeGoodsGained = effect.amount;
          }
          break;

        case 'draw_action_cards':
          if (effect.amount) {
            const drawn: string[] = [];
            for (let i = 0; i < effect.amount; i++) {
              if (state.actionCardDeck.length > 0) {
                const card = state.actionCardDeck.shift()!;
                const fullPlayer = state.players.find((p) => p.id === player.id);
                if (fullPlayer) {
                  fullPlayer.actionCards.push(card);
                  drawn.push(card);
                }
              }
            }
            result.actionCardsDrawn = drawn.length;
          }
          break;

        case 'gain_unit':
          // Place unit in space from reinforcements
          // For frontier, units go in space not on a planet
          result.unitGained = effect.unitType;
          break;

        case 'special':
          // Handle frontier-specific special effects
          result.specialEffect = effect.special;
          break;
      }
    }

    // Add to discard pile
    if (!state.explorationDiscard) {
      state.explorationDiscard = [];
    }
    state.explorationDiscard.push(cardId);
  } else {
    // Special frontier cards (gamma wormhole, ion storm, mirage)
    for (const effect of cardData.effects) {
      if (effect.type === 'special') {
        switch (effect.special) {
          case 'gamma_wormhole':
            // Add gamma wormhole to this system
            (tile as { wormhole: string | null }).wormhole = 'gamma';
            result.wormholeAdded = 'gamma';
            addLogEntry(
              state,
              'planet_explored',
              `A gamma wormhole appeared at position (${tile.position.q}, ${tile.position.r})`,
              {
                playerId: player.id,
                details: {
                  explorationDeckType: 'frontier',
                },
              }
            );
            break;

          case 'ion_storm':
            // Ion storm affects combat in this system
            result.ionStorm = true;
            // TODO: Add ion storm token tracking when implemented
            break;

          case 'mirage':
            // Creates a temporary planet in this system
            result.mirage = true;
            // TODO: Add mirage planet when implemented
            break;
        }
      }
    }
  }

  return result;
}

/**
 * Handle purging relic fragments to gain a relic
 */
export function handlePurgeRelicFragments(
  state: GameState,
  action: PurgeRelicFragmentsAction
): HandlerResult {
  const { playerId, fragmentType } = action;
  const player = state.players.find((p) => p.id === playerId);

  if (!player) {
    return { success: false, error: 'Player not found' };
  }

  if (!player.relicFragments) {
    return { success: false, error: 'No relic fragments' };
  }

  // Determine how many specific fragments and unknown fragments to use
  const specificCount = player.relicFragments[fragmentType] || 0;
  const unknownCount = player.relicFragments.unknown || 0;

  let specificUsed = Math.min(specificCount, 3);
  let unknownUsed = 3 - specificUsed;

  if (specificUsed + unknownUsed < 3 || unknownUsed > unknownCount) {
    return { success: false, error: 'Not enough fragments' };
  }

  // Deduct fragments
  player.relicFragments[fragmentType] -= specificUsed;
  player.relicFragments.unknown -= unknownUsed;

  // Draw a random relic
  if (!state.relicDeck || state.relicDeck.length === 0) {
    return { success: false, error: 'No relics remaining' };
  }

  // Shuffle and draw
  const shuffledDeck = shuffleDeck([...state.relicDeck]);
  const drawnRelicId = shuffledDeck.shift()!;
  state.relicDeck = shuffledDeck;

  // Add relic to player
  if (!player.relics) {
    player.relics = [];
  }
  player.relics.push(drawnRelicId);

  addLogEntry(
    state,
    'fragments_purged',
    `${player.name} purged ${specificUsed} ${fragmentType}${unknownUsed > 0 ? ` and ${unknownUsed} unknown` : ''} fragments`,
    {
      playerId,
      details: {
        fragmentType,
        fragmentCount: 3,
      },
    }
  );

  addLogEntry(
    state,
    'relic_gained',
    `${player.name} gained the ${drawnRelicId} relic`,
    {
      playerId,
      details: {
        relicId: drawnRelicId,
      },
    }
  );

  return {
    success: true,
    triggeredEvents: ['relic_gained'],
    data: {
      relicId: drawnRelicId,
      fragmentsUsed: {
        [fragmentType]: specificUsed,
        unknown: unknownUsed,
      },
    },
  };
}

/**
 * Initialize exploration decks for game setup
 */
export function initializeExplorationDecks(state: GameState): void {
  state.explorationDecks = {
    cultural: shuffleDeck(getInitialExplorationDeck('cultural')),
    industrial: shuffleDeck(getInitialExplorationDeck('industrial')),
    hazardous: shuffleDeck(getInitialExplorationDeck('hazardous')),
    frontier: shuffleDeck(getInitialExplorationDeck('frontier')),
  };
  state.explorationDiscard = [];
}

/**
 * Initialize relic deck for game setup
 */
export function initializeRelicDeck(state: GameState): void {
  state.relicDeck = shuffleDeck(getInitialRelicDeck());
  state.relicDiscard = [];
}
