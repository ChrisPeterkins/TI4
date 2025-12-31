'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type {
  GameState,
  PlayerState,
  StrategicPrimaryChoices,
  StrategicSecondaryChoices,
  HexCoord,
} from '@ti4/shared';
import { strategyCards, systems, factions } from '@ti4/game-data';
import { getStrategyCardUrl } from '@/lib/assets';
import { GameNotification, WaitingNotification } from './GameNotification';

interface StrategyActionPanelProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  onSubmitPrimary: (choices: StrategicPrimaryChoices) => void;
  onSubmitSecondary: (choices: StrategicSecondaryChoices, declined: boolean) => void;
  onClose?: () => void;
}

export function StrategyActionPanel({
  gameState,
  currentPlayer,
  onSubmitPrimary,
  onSubmitSecondary,
  onClose,
}: StrategyActionPanelProps) {
  const tracking = gameState.strategicActionState;

  if (!tracking || !currentPlayer) return null;

  const cardData = strategyCards[tracking.cardNumber];
  const isPrimary = gameState.subPhase === 'strategic_primary';
  const isSecondary = gameState.subPhase === 'strategic_secondary';

  // Check if this player is the one who should act
  const isActiveForPrimary = isPrimary && gameState.activePlayerId === currentPlayer.id;
  const currentSecondaryPlayer = isSecondary
    ? tracking.secondaryOrder[tracking.currentSecondaryIndex]
    : null;
  const isActiveForSecondary = isSecondary && currentSecondaryPlayer === currentPlayer.id;
  const isMyTurn = isActiveForPrimary || isActiveForSecondary;

  // Check if free secondary (Leadership or Trade grant)
  const isFreeSecondary = tracking.cardNumber === 1 ||
    (tracking.freeSecondaryPlayers?.includes(currentPlayer.id) ?? false);

  // If waiting for another player, show compact waiting notification
  if (!isMyTurn) {
    const waitingForId = isPrimary
      ? gameState.activePlayerId
      : tracking.secondaryOrder[tracking.currentSecondaryIndex];
    const waitingForPlayer = gameState.players.find(p => p.id === waitingForId);
    const progress = !isPrimary
      ? `${tracking.currentSecondaryIndex + 1}/${tracking.secondaryOrder.length}`
      : undefined;

    return (
      <WaitingNotification
        playerName={waitingForPlayer?.name || 'player'}
        action={`${cardData.name} ${isPrimary ? 'primary' : 'secondary'}`}
        subText={progress}
      />
    );
  }

  // If it's the player's turn, show collapsible action notification
  const abilityType = isPrimary ? 'Primary' : 'Secondary';
  const summary = isPrimary ? cardData.primaryAbility : cardData.secondaryAbility;

  return (
    <GameNotification
      title={`${cardData.name} - ${abilityType}`}
      summary={summary.length > 30 ? summary.slice(0, 30) + '...' : summary}
      variant="action"
      requiresAction={true}
      defaultExpanded={true}
    >
      <div className="p-3">
        {/* Strategy card preview */}
        <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-700/50">
          <Image
            src={getStrategyCardUrl(tracking.cardNumber)}
            alt={cardData.name}
            width={48}
            height={72}
            className="rounded flex-shrink-0"
          />
          <p className="text-xs text-gray-400 leading-relaxed">
            {isPrimary ? cardData.primaryAbility : cardData.secondaryAbility}
          </p>
        </div>

        {/* Ability panel content */}
        {isPrimary ? (
          <PrimaryAbilityPanel
            cardNumber={tracking.cardNumber}
            gameState={gameState}
            player={currentPlayer}
            onSubmit={onSubmitPrimary}
          />
        ) : (
          <SecondaryAbilityPanel
            cardNumber={tracking.cardNumber}
            gameState={gameState}
            player={currentPlayer}
            isFree={isFreeSecondary}
            onSubmit={onSubmitSecondary}
          />
        )}
      </div>
    </GameNotification>
  );
}

// ===========================================
// Primary Ability Panels
// ===========================================

function PrimaryAbilityPanel({
  cardNumber,
  gameState,
  player,
  onSubmit,
}: {
  cardNumber: number;
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicPrimaryChoices) => void;
}) {
  switch (cardNumber) {
    case 1:
      return <LeadershipPrimaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 2:
      return <DiplomacyPrimaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 3:
      return <PoliticsPrimaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 4:
      return <ConstructionPrimaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 5:
      return <TradePrimaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 6:
      return <WarfarePrimaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 7:
      return <TechnologyPrimaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 8:
      return <ImperialPrimaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    default:
      return <div>Unknown strategy card</div>;
  }
}

// ===========================================
// Secondary Ability Panels
// ===========================================

function SecondaryAbilityPanel({
  cardNumber,
  gameState,
  player,
  isFree,
  onSubmit,
}: {
  cardNumber: number;
  gameState: GameState;
  player: PlayerState;
  isFree: boolean;
  onSubmit: (choices: StrategicSecondaryChoices, declined: boolean) => void;
}) {
  const canAfford = isFree || player.commandTokens.strategy > 0;

  if (!canAfford) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">You don't have a strategy token to spend.</p>
        <button
          onClick={() => onSubmit({}, true)}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
        >
          Decline Secondary
        </button>
      </div>
    );
  }

  switch (cardNumber) {
    case 1:
      return <LeadershipSecondaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 2:
      return <DiplomacySecondaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 3:
      return <PoliticsSecondaryPanel onSubmit={onSubmit} />;
    case 4:
      return <ConstructionSecondaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 5:
      return <TradeSecondaryPanel onSubmit={onSubmit} />;
    case 6:
      return <WarfareSecondaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 7:
      return <TechnologySecondaryPanel gameState={gameState} player={player} onSubmit={onSubmit} />;
    case 8:
      return <ImperialSecondaryPanel player={player} onSubmit={onSubmit} />;
    default:
      return <div>Unknown strategy card</div>;
  }
}

// ===========================================
// Card-Specific Primary Panels
// ===========================================

function LeadershipPrimaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicPrimaryChoices) => void;
}) {
  const [influenceToSpend, setInfluenceToSpend] = useState(0);
  const [distribution, setDistribution] = useState({ tactics: 3, fleet: 0, strategy: 0 });

  const availableInfluence = useMemo(() => {
    let total = 0;
    for (const tile of gameState.map.tiles) {
      for (const planet of tile.planets) {
        if (planet.controlledBy === player.id && !planet.exhausted) {
          const planetData = findPlanetData(planet.planetId);
          if (planetData) total += planetData.influence;
        }
      }
    }
    return total;
  }, [gameState, player.id]);

  const bonusTokens = Math.floor(influenceToSpend / 3);
  const totalTokens = 3 + bonusTokens;

  const handleSubmit = () => {
    onSubmit({
      influenceSpent: influenceToSpend,
      tokenDistribution: distribution,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-white mb-2">You gain 3 command tokens automatically.</p>
        <p className="text-gray-400 text-sm">
          Spend influence to gain additional tokens (1 per 3 influence).
        </p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Influence to spend: {influenceToSpend} (Available: {availableInfluence})
        </label>
        <input
          type="range"
          min={0}
          max={availableInfluence}
          step={3}
          value={influenceToSpend}
          onChange={(e) => setInfluenceToSpend(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-green-400 mt-1">
          +{bonusTokens} bonus tokens = {totalTokens} total
        </div>
      </div>

      <TokenDistributionInput
        total={totalTokens}
        distribution={distribution}
        onChange={setDistribution}
      />

      <button
        onClick={handleSubmit}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
      >
        Confirm Leadership
      </button>
    </div>
  );
}

function DiplomacyPrimaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicPrimaryChoices) => void;
}) {
  const [selectedSystem, setSelectedSystem] = useState<HexCoord | null>(null);
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);

  // Get systems where player controls a planet (excluding Mecatol Rex = system 18)
  const eligibleSystems = useMemo(() => {
    return gameState.map.tiles.filter(tile =>
      tile.systemId !== 18 &&
      tile.planets.some(p => p.controlledBy === player.id)
    );
  }, [gameState, player.id]);

  // Get exhausted planets player controls
  const exhaustedPlanets = useMemo(() => {
    const planets: { id: string; name: string }[] = [];
    for (const tile of gameState.map.tiles) {
      for (const planet of tile.planets) {
        if (planet.controlledBy === player.id && planet.exhausted) {
          planets.push({ id: planet.planetId, name: planet.planetId });
        }
      }
    }
    return planets;
  }, [gameState, player.id]);

  const togglePlanet = (planetId: string) => {
    setSelectedPlanets(prev =>
      prev.includes(planetId)
        ? prev.filter(p => p !== planetId)
        : prev.length < 2 ? [...prev, planetId] : prev
    );
  };

  const handleSubmit = () => {
    if (!selectedSystem) return;
    onSubmit({
      targetSystemPosition: selectedSystem,
      planetsToReady: selectedPlanets,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Choose a system to lock (other players place command tokens):
        </label>
        <select
          value={selectedSystem ? `${selectedSystem.q},${selectedSystem.r}` : ''}
          onChange={(e) => {
            if (e.target.value) {
              const [q, r] = e.target.value.split(',').map(Number);
              setSelectedSystem({ q, r });
            }
          }}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">Select a system...</option>
          {eligibleSystems.map(tile => (
            <option key={tile.id} value={`${tile.position.q},${tile.position.r}`}>
              System {tile.systemId} (Position: {tile.position.q},{tile.position.r})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Ready up to 2 exhausted planets:
        </label>
        <div className="flex flex-wrap gap-2">
          {exhaustedPlanets.map(planet => (
            <button
              key={planet.id}
              onClick={() => togglePlanet(planet.id)}
              className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                selectedPlanets.includes(planet.id)
                  ? 'border-green-500 bg-green-900/30'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
            >
              {planet.name}
            </button>
          ))}
          {exhaustedPlanets.length === 0 && (
            <span className="text-gray-500">No exhausted planets</span>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedSystem}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg"
      >
        Confirm Diplomacy
      </button>
    </div>
  );
}

function PoliticsPrimaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicPrimaryChoices) => void;
}) {
  const [newSpeakerId, setNewSpeakerId] = useState<string>('');

  const eligiblePlayers = gameState.players.filter(p => p.id !== gameState.speakerId);

  const handleSubmit = () => {
    if (!newSpeakerId) return;
    onSubmit({
      newSpeakerId,
      agendaArrangement: [], // TODO: implement agenda viewing
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Choose a new Speaker (cannot be current speaker):
        </label>
        <select
          value={newSpeakerId}
          onChange={(e) => setNewSpeakerId(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">Select a player...</option>
          {eligiblePlayers.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({factions[p.faction]?.name})</option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-400">
        <p>You will also:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Draw 2 action cards</li>
          <li>Look at top 2 agenda cards and arrange them</li>
        </ul>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!newSpeakerId}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg"
      >
        Confirm Politics
      </button>
    </div>
  );
}

function ConstructionPrimaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicPrimaryChoices) => void;
}) {
  const [firstStructure, setFirstStructure] = useState<{ type: 'pds' | 'space_dock'; planetId: string } | null>(null);
  const [secondStructure, setSecondStructure] = useState<{ type: 'pds'; planetId: string } | null>(null);

  const controlledPlanets = useMemo(() => {
    const planets: { id: string; name: string }[] = [];
    for (const tile of gameState.map.tiles) {
      for (const planet of tile.planets) {
        if (planet.controlledBy === player.id) {
          planets.push({ id: planet.planetId, name: planet.planetId });
        }
      }
    }
    return planets;
  }, [gameState, player.id]);

  const handleSubmit = () => {
    onSubmit({
      firstStructure: firstStructure || undefined,
      secondStructure: secondStructure || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          First structure (PDS or Space Dock):
        </label>
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setFirstStructure(firstStructure?.type === 'pds' ? null : { type: 'pds', planetId: firstStructure?.planetId || '' })}
            className={`px-4 py-2 rounded ${firstStructure?.type === 'pds' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            PDS
          </button>
          <button
            onClick={() => setFirstStructure(firstStructure?.type === 'space_dock' ? null : { type: 'space_dock', planetId: firstStructure?.planetId || '' })}
            className={`px-4 py-2 rounded ${firstStructure?.type === 'space_dock' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            Space Dock
          </button>
        </div>
        {firstStructure && (
          <select
            value={firstStructure.planetId}
            onChange={(e) => setFirstStructure({ ...firstStructure, planetId: e.target.value })}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="">Select planet...</option>
            {controlledPlanets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Second structure (PDS only):
        </label>
        <select
          value={secondStructure?.planetId || ''}
          onChange={(e) => setSecondStructure(e.target.value ? { type: 'pds', planetId: e.target.value } : null)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">None / Skip</option>
          {controlledPlanets.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
      >
        Confirm Construction
      </button>
    </div>
  );
}

function TradePrimaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicPrimaryChoices) => void;
}) {
  const [freeSecondaryPlayers, setFreeSecondaryPlayers] = useState<string[]>([]);

  const otherPlayers = gameState.players.filter(p => p.id !== player.id);

  const togglePlayer = (playerId: string) => {
    setFreeSecondaryPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(p => p !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      freeSecondaryPlayers: freeSecondaryPlayers.length > 0 ? freeSecondaryPlayers : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-white">
        <p className="mb-2">You will:</p>
        <ul className="list-disc list-inside text-gray-300">
          <li>Gain 3 trade goods</li>
          <li>Replenish your commodities</li>
        </ul>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Choose players who can use secondary for FREE:
        </label>
        <div className="flex flex-wrap gap-2">
          {otherPlayers.map(p => (
            <button
              key={p.id}
              onClick={() => togglePlayer(p.id)}
              className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                freeSecondaryPlayers.includes(p.id)
                  ? 'border-green-500 bg-green-900/30'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
      >
        Confirm Trade
      </button>
    </div>
  );
}

function WarfarePrimaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicPrimaryChoices) => void;
}) {
  const [removedSystem, setRemovedSystem] = useState<HexCoord | null>(null);
  const [distribution, setDistribution] = useState({
    tactics: player.commandTokens.tactics,
    fleet: player.commandTokens.fleet,
    strategy: player.commandTokens.strategy + 1, // +1 for gained token
  });

  // Get systems where player has command tokens
  const systemsWithTokens = useMemo(() => {
    return gameState.map.tiles.filter(tile =>
      tile.commandTokens.includes(player.id)
    );
  }, [gameState, player.id]);

  const currentTotal = player.commandTokens.tactics + player.commandTokens.fleet + player.commandTokens.strategy;
  const newTotal = currentTotal + 1;

  const handleSubmit = () => {
    onSubmit({
      removedTokenSystem: removedSystem || undefined,
      newTokenDistribution: distribution,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Remove a command token from the board (optional):
        </label>
        <select
          value={removedSystem ? `${removedSystem.q},${removedSystem.r}` : ''}
          onChange={(e) => {
            if (e.target.value) {
              const [q, r] = e.target.value.split(',').map(Number);
              setRemovedSystem({ q, r });
            } else {
              setRemovedSystem(null);
            }
          }}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">Don't remove a token</option>
          {systemsWithTokens.map(tile => (
            <option key={tile.id} value={`${tile.position.q},${tile.position.r}`}>
              System {tile.systemId}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-white mb-2">
          Redistribute your command tokens (+1 gained):
        </p>
        <TokenDistributionInput
          total={newTotal}
          distribution={distribution}
          onChange={setDistribution}
        />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
      >
        Confirm Warfare
      </button>
    </div>
  );
}

function TechnologyPrimaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicPrimaryChoices) => void;
}) {
  const [firstTech, setFirstTech] = useState<string>('');
  const [secondTech, setSecondTech] = useState<string>('');

  // Calculate available resources for second tech
  const availableResources = useMemo(() => {
    let total = player.tradeGoods;
    for (const tile of gameState.map.tiles) {
      for (const planet of tile.planets) {
        if (planet.controlledBy === player.id && !planet.exhausted) {
          const data = findPlanetData(planet.planetId);
          if (data) total += data.resources;
        }
      }
    }
    return total;
  }, [gameState, player]);

  const handleSubmit = () => {
    onSubmit({
      firstTechId: firstTech || undefined,
      secondTechId: secondTech || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-white">First technology (free):</p>
        <input
          type="text"
          value={firstTech}
          onChange={(e) => setFirstTech(e.target.value)}
          placeholder="Enter tech ID..."
          className="mt-2 w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
        />
        <p className="text-xs text-gray-500 mt-1">
          Use the Technology panel for full tech selection
        </p>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-white">
          Second technology (costs 6 resources):
          <span className="text-gray-400 text-sm ml-2">
            Available: {availableResources}
          </span>
        </p>
        <input
          type="text"
          value={secondTech}
          onChange={(e) => setSecondTech(e.target.value)}
          placeholder="Optional - leave blank to skip"
          disabled={availableResources < 6}
          className="mt-2 w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white disabled:opacity-50"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!firstTech}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg"
      >
        Confirm Technology
      </button>
    </div>
  );
}

function ImperialPrimaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicPrimaryChoices) => void;
}) {
  const [selectedObjective, setSelectedObjective] = useState<string>('');
  const [placeMecatolToken, setPlaceMecatolToken] = useState(false);

  // Check Mecatol control
  const mecatolTile = gameState.map.tiles.find(t => t.systemId === 18);
  const controlsMecatol = mecatolTile?.planets.some(p => p.controlledBy === player.id) || false;

  // Get revealed public objectives
  const revealedObjectives = useMemo(() => {
    const objectives: { id: string; name: string; scored: boolean }[] = [];
    for (const obj of gameState.objectives.publicStageI) {
      if (obj.revealed) {
        objectives.push({
          id: obj.id,
          name: obj.id,
          scored: obj.scoredBy.includes(player.id),
        });
      }
    }
    for (const obj of gameState.objectives.publicStageII) {
      if (obj.revealed) {
        objectives.push({
          id: obj.id,
          name: obj.id,
          scored: obj.scoredBy.includes(player.id),
        });
      }
    }
    return objectives;
  }, [gameState, player.id]);

  const handleSubmit = () => {
    onSubmit({
      scoredObjectiveId: selectedObjective || undefined,
      placeMecatolToken: !controlsMecatol && placeMecatolToken,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Score a public objective (optional):
        </label>
        <select
          value={selectedObjective}
          onChange={(e) => setSelectedObjective(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">Don't score an objective</option>
          {revealedObjectives
            .filter(o => !o.scored)
            .map(obj => (
              <option key={obj.id} value={obj.id}>{obj.name}</option>
            ))}
        </select>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-white mb-2">Mecatol Rex:</p>
        {controlsMecatol ? (
          <p className="text-green-400">You control Mecatol Rex - gain 1 VP!</p>
        ) : (
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={placeMecatolToken}
              onChange={(e) => setPlaceMecatolToken(e.target.checked)}
              className="w-4 h-4"
            />
            Place command token in Mecatol Rex system
          </label>
        )}
      </div>

      <div className="text-sm text-gray-400">
        You will also draw 1 secret objective.
      </div>

      <button
        onClick={handleSubmit}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg"
      >
        Confirm Imperial
      </button>
    </div>
  );
}

// ===========================================
// Card-Specific Secondary Panels
// ===========================================

function LeadershipSecondaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicSecondaryChoices, declined: boolean) => void;
}) {
  const [influenceToSpend, setInfluenceToSpend] = useState(0);
  const [distribution, setDistribution] = useState({ tactics: 0, fleet: 0, strategy: 0 });

  const availableInfluence = useMemo(() => {
    let total = 0;
    for (const tile of gameState.map.tiles) {
      for (const planet of tile.planets) {
        if (planet.controlledBy === player.id && !planet.exhausted) {
          const data = findPlanetData(planet.planetId);
          if (data) total += data.influence;
        }
      }
    }
    return total;
  }, [gameState, player.id]);

  const tokensGained = Math.floor(influenceToSpend / 3);

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm">
        Leadership secondary is FREE (no strategy token needed)
      </p>

      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Influence to spend: {influenceToSpend} (Available: {availableInfluence})
        </label>
        <input
          type="range"
          min={0}
          max={availableInfluence}
          step={3}
          value={influenceToSpend}
          onChange={(e) => setInfluenceToSpend(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-green-400 mt-1">
          Gain {tokensGained} command tokens
        </div>
      </div>

      {tokensGained > 0 && (
        <TokenDistributionInput
          total={tokensGained}
          distribution={distribution}
          onChange={setDistribution}
        />
      )}

      <div className="flex gap-4">
        <button
          onClick={() => onSubmit({
            influenceSpent: influenceToSpend,
            commandTokenDistribution: distribution,
          }, false)}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg"
        >
          Use Secondary
        </button>
        <button
          onClick={() => onSubmit({}, true)}
          className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function DiplomacySecondaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicSecondaryChoices, declined: boolean) => void;
}) {
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);

  const exhaustedPlanets = useMemo(() => {
    const planets: { id: string; name: string }[] = [];
    for (const tile of gameState.map.tiles) {
      for (const planet of tile.planets) {
        if (planet.controlledBy === player.id && planet.exhausted) {
          planets.push({ id: planet.planetId, name: planet.planetId });
        }
      }
    }
    return planets;
  }, [gameState, player.id]);

  const togglePlanet = (planetId: string) => {
    setSelectedPlanets(prev =>
      prev.includes(planetId)
        ? prev.filter(p => p !== planetId)
        : prev.length < 2 ? [...prev, planetId] : prev
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400">
        Spend 1 strategy token to ready up to 2 exhausted planets.
      </p>

      <div className="flex flex-wrap gap-2">
        {exhaustedPlanets.map(planet => (
          <button
            key={planet.id}
            onClick={() => togglePlanet(planet.id)}
            className={`px-3 py-2 rounded-lg border-2 transition-colors ${
              selectedPlanets.includes(planet.id)
                ? 'border-green-500 bg-green-900/30'
                : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            {planet.name}
          </button>
        ))}
        {exhaustedPlanets.length === 0 && (
          <span className="text-gray-500">No exhausted planets</span>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onSubmit({ readiedPlanets: selectedPlanets }, false)}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg"
        >
          Use Secondary (1 token)
        </button>
        <button
          onClick={() => onSubmit({}, true)}
          className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function PoliticsSecondaryPanel({
  onSubmit,
}: {
  onSubmit: (choices: StrategicSecondaryChoices, declined: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-white">
        Spend 1 strategy token to draw 2 action cards.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => onSubmit({}, false)}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg"
        >
          Draw 2 Cards (1 token)
        </button>
        <button
          onClick={() => onSubmit({}, true)}
          className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function ConstructionSecondaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicSecondaryChoices, declined: boolean) => void;
}) {
  const [structure, setStructure] = useState<{ type: 'pds' | 'space_dock'; planetId: string } | null>(null);

  const controlledPlanets = useMemo(() => {
    const planets: { id: string; name: string }[] = [];
    for (const tile of gameState.map.tiles) {
      for (const planet of tile.planets) {
        if (planet.controlledBy === player.id) {
          planets.push({ id: planet.planetId, name: planet.planetId });
        }
      }
    }
    return planets;
  }, [gameState, player.id]);

  return (
    <div className="space-y-6">
      <p className="text-gray-400">
        Spend 1 strategy token to place 1 PDS or Space Dock.
      </p>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setStructure(structure?.type === 'pds' ? null : { type: 'pds', planetId: structure?.planetId || '' })}
          className={`px-4 py-2 rounded ${structure?.type === 'pds' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          PDS
        </button>
        <button
          onClick={() => setStructure(structure?.type === 'space_dock' ? null : { type: 'space_dock', planetId: structure?.planetId || '' })}
          className={`px-4 py-2 rounded ${structure?.type === 'space_dock' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Space Dock
        </button>
      </div>

      {structure && (
        <select
          value={structure.planetId}
          onChange={(e) => setStructure({ ...structure, planetId: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">Select planet...</option>
          {controlledPlanets.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => onSubmit({
            structureBuilt: structure && structure.planetId ? structure : undefined,
          }, false)}
          disabled={!structure?.planetId}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-medium rounded-lg"
        >
          Build Structure (1 token)
        </button>
        <button
          onClick={() => onSubmit({}, true)}
          className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function TradeSecondaryPanel({
  onSubmit,
}: {
  onSubmit: (choices: StrategicSecondaryChoices, declined: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-white">
        Spend 1 strategy token to replenish your commodities.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => onSubmit({}, false)}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg"
        >
          Replenish (1 token)
        </button>
        <button
          onClick={() => onSubmit({}, true)}
          className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function WarfareSecondaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicSecondaryChoices, declined: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <p className="text-gray-400">
        Spend 1 strategy token to produce units in your home system.
        Production capacity is increased by 2.
      </p>

      <div className="p-4 bg-gray-800 rounded-lg text-gray-300">
        <p>Use the Production panel to select units after confirming.</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onSubmit({}, false)}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg"
        >
          Use Production (1 token)
        </button>
        <button
          onClick={() => onSubmit({}, true)}
          className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function TechnologySecondaryPanel({
  gameState,
  player,
  onSubmit,
}: {
  gameState: GameState;
  player: PlayerState;
  onSubmit: (choices: StrategicSecondaryChoices, declined: boolean) => void;
}) {
  const [techId, setTechId] = useState('');

  const availableResources = useMemo(() => {
    let total = player.tradeGoods;
    for (const tile of gameState.map.tiles) {
      for (const planet of tile.planets) {
        if (planet.controlledBy === player.id && !planet.exhausted) {
          const data = findPlanetData(planet.planetId);
          if (data) total += data.resources;
        }
      }
    }
    return total;
  }, [gameState, player]);

  const canAfford = availableResources >= 4;

  return (
    <div className="space-y-6">
      <p className="text-gray-400">
        Spend 1 strategy token + 4 resources to research 1 technology.
        <span className={`ml-2 ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
          (Available: {availableResources} resources)
        </span>
      </p>

      <input
        type="text"
        value={techId}
        onChange={(e) => setTechId(e.target.value)}
        placeholder="Enter tech ID..."
        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
      />

      <div className="flex gap-4">
        <button
          onClick={() => onSubmit({ techId }, false)}
          disabled={!canAfford || !techId}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-medium rounded-lg"
        >
          Research Tech (1 token + 4 res)
        </button>
        <button
          onClick={() => onSubmit({}, true)}
          className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

function ImperialSecondaryPanel({
  player,
  onSubmit,
}: {
  player: PlayerState;
  onSubmit: (choices: StrategicSecondaryChoices, declined: boolean) => void;
}) {
  const atLimit = player.secretObjectives.length >= 3;

  return (
    <div className="space-y-6">
      <p className="text-gray-400">
        Spend 1 strategy token to draw 1 secret objective.
      </p>

      {atLimit && (
        <p className="text-red-400">
          You already have 3 secret objectives (maximum).
        </p>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => onSubmit({}, false)}
          disabled={atLimit}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-medium rounded-lg"
        >
          Draw Secret (1 token)
        </button>
        <button
          onClick={() => onSubmit({}, true)}
          className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg"
        >
          Decline
        </button>
      </div>
    </div>
  );
}

// ===========================================
// Helper Components
// ===========================================

function TokenDistributionInput({
  total,
  distribution,
  onChange,
}: {
  total: number;
  distribution: { tactics: number; fleet: number; strategy: number };
  onChange: (d: { tactics: number; fleet: number; strategy: number }) => void;
}) {
  const currentSum = distribution.tactics + distribution.fleet + distribution.strategy;

  const adjust = (pool: 'tactics' | 'fleet' | 'strategy', delta: number) => {
    const newValue = distribution[pool] + delta;
    const newSum = currentSum + delta;

    if (newValue < 0) return;
    if (newSum > total && delta > 0) return;

    onChange({ ...distribution, [pool]: newValue });
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-400 mb-2">
        Distribute {total} tokens (currently: {currentSum})
      </div>
      {(['tactics', 'fleet', 'strategy'] as const).map(pool => (
        <div key={pool} className="flex items-center gap-4">
          <span className="w-20 capitalize text-white">{pool}:</span>
          <button
            onClick={() => adjust(pool, -1)}
            className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded"
          >
            -
          </button>
          <span className="w-8 text-center text-white">{distribution[pool]}</span>
          <button
            onClick={() => adjust(pool, 1)}
            className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded"
          >
            +
          </button>
        </div>
      ))}
    </div>
  );
}

// ===========================================
// Utility Functions
// ===========================================

function findPlanetData(planetId: string): { resources: number; influence: number } | null {
  for (const system of Object.values(systems)) {
    for (const planet of system.planets) {
      if (planet.id === planetId) {
        return { resources: planet.resources, influence: planet.influence };
      }
    }
  }
  return null;
}
