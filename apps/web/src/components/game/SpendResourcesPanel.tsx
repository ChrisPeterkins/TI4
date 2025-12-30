'use client';

import { useState, useMemo } from 'react';
import type { PlayerState, SpentResources, ObjectiveData } from '@ti4/shared';
import { systems } from '@ti4/game-data';

interface SpendResourcesPanelProps {
  objective: ObjectiveData;
  player: PlayerState;
  onConfirm: (spentResources: SpentResources) => void;
  onCancel: () => void;
}

interface PlanetInfo {
  planetId: string;
  name: string;
  resources: number;
  influence: number;
  exhausted: boolean;
}

/**
 * Panel for selecting resources to spend when scoring "spend" objectives
 */
export function SpendResourcesPanel({
  objective,
  player,
  onConfirm,
  onCancel,
}: SpendResourcesPanelProps) {
  const [selectedPlanets, setSelectedPlanets] = useState<Set<string>>(new Set());
  const [tradeGoodsToSpend, setTradeGoodsToSpend] = useState(0);
  const [tacticTokensToSpend, setTacticTokensToSpend] = useState(0);
  const [strategyTokensToSpend, setStrategyTokensToSpend] = useState(0);

  // Parse the requirement
  const requirement = useMemo(() => {
    const req = objective.requirement;
    const customCheck = req.customCheck;

    if (req.type === 'spend_resources') {
      return { resources: req.value || 0, influence: 0, tradeGoods: 0, tokens: 0 };
    }
    if (req.type === 'spend_influence') {
      return { resources: 0, influence: req.value || 0, tradeGoods: 0, tokens: 0 };
    }
    if (customCheck === 'spend_trade_goods') {
      return { resources: 0, influence: 0, tradeGoods: req.value || 0, tokens: 0 };
    }
    if (customCheck === 'spend_tokens') {
      return { resources: 0, influence: 0, tradeGoods: 0, tokens: req.value || 0 };
    }
    if (customCheck === 'spend_mixed_3_3_3') {
      return { resources: 3, influence: 3, tradeGoods: 3, tokens: 0 };
    }
    if (customCheck === 'spend_mixed_6_6_6') {
      return { resources: 6, influence: 6, tradeGoods: 6, tokens: 0 };
    }

    return { resources: 0, influence: 0, tradeGoods: 0, tokens: 0 };
  }, [objective]);

  // Get player's planets with data
  const planets: PlanetInfo[] = useMemo(() => {
    const result: PlanetInfo[] = [];

    for (const planetState of player.planets) {
      // Find planet data
      for (const system of Object.values(systems)) {
        const planetData = system.planets.find(p => p.id === planetState.planetId);
        if (planetData) {
          result.push({
            planetId: planetState.planetId,
            name: planetData.name,
            resources: planetData.resources,
            influence: planetData.influence,
            exhausted: planetState.exhausted,
          });
          break;
        }
      }
    }

    return result.sort((a, b) => {
      // Sort by exhausted status first, then by value
      if (a.exhausted !== b.exhausted) return a.exhausted ? 1 : -1;
      return (b.resources + b.influence) - (a.resources + a.influence);
    });
  }, [player.planets]);

  // Calculate spent totals
  const spent = useMemo(() => {
    let resources = 0;
    let influence = 0;

    for (const planetId of selectedPlanets) {
      const planet = planets.find(p => p.planetId === planetId);
      if (planet) {
        resources += planet.resources;
        influence += planet.influence;
      }
    }

    return {
      resources,
      influence,
      tradeGoods: tradeGoodsToSpend,
      tokens: tacticTokensToSpend + strategyTokensToSpend,
    };
  }, [selectedPlanets, planets, tradeGoodsToSpend, tacticTokensToSpend, strategyTokensToSpend]);

  // Check if requirements are met
  const isMet = useMemo(() => {
    const customCheck = objective.requirement.customCheck;

    // For mixed objectives, each type must be met separately
    if (customCheck === 'spend_mixed_3_3_3' || customCheck === 'spend_mixed_6_6_6') {
      return (
        spent.resources >= requirement.resources &&
        spent.influence >= requirement.influence &&
        spent.tradeGoods >= requirement.tradeGoods
      );
    }

    // For single resource types
    if (requirement.resources > 0) {
      return spent.resources + spent.tradeGoods >= requirement.resources;
    }
    if (requirement.influence > 0) {
      return spent.influence >= requirement.influence;
    }
    if (requirement.tradeGoods > 0) {
      return spent.tradeGoods >= requirement.tradeGoods;
    }
    if (requirement.tokens > 0) {
      return spent.tokens >= requirement.tokens;
    }

    return false;
  }, [spent, requirement, objective.requirement.customCheck]);

  const togglePlanet = (planetId: string) => {
    const planet = planets.find(p => p.planetId === planetId);
    if (!planet || planet.exhausted) return;

    setSelectedPlanets(prev => {
      const next = new Set(prev);
      if (next.has(planetId)) {
        next.delete(planetId);
      } else {
        next.add(planetId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const spentResources: SpentResources = {
      exhaustedPlanets: Array.from(selectedPlanets),
      tradeGoods: tradeGoodsToSpend,
      tacticTokens: tacticTokensToSpend,
      strategyTokens: strategyTokensToSpend,
    };
    onConfirm(spentResources);
  };

  const showTradeGoods = requirement.resources > 0 || requirement.tradeGoods > 0;
  const showTokens = requirement.tokens > 0;
  const isMixedObjective = objective.requirement.customCheck?.includes('spend_mixed');

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">{objective.name}</h2>
          <p className="text-gray-400 mt-1">{objective.description}</p>
        </div>

        {/* Requirements Summary */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Requirements</h3>
          <div className="flex flex-wrap gap-4">
            {requirement.resources > 0 && (
              <RequirementBadge
                label="Resources"
                required={requirement.resources}
                current={isMixedObjective ? spent.resources : spent.resources + spent.tradeGoods}
                color="yellow"
              />
            )}
            {requirement.influence > 0 && (
              <RequirementBadge
                label="Influence"
                required={requirement.influence}
                current={spent.influence}
                color="blue"
              />
            )}
            {requirement.tradeGoods > 0 && (
              <RequirementBadge
                label="Trade Goods"
                required={requirement.tradeGoods}
                current={spent.tradeGoods}
                color="amber"
              />
            )}
            {requirement.tokens > 0 && (
              <RequirementBadge
                label="Tokens"
                required={requirement.tokens}
                current={spent.tokens}
                color="red"
              />
            )}
          </div>
        </div>

        {/* Planet Selection */}
        {(requirement.resources > 0 || requirement.influence > 0) && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Select Planets to Exhaust</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {planets.map(planet => (
                <button
                  key={planet.planetId}
                  onClick={() => togglePlanet(planet.planetId)}
                  disabled={planet.exhausted}
                  className={`
                    p-3 rounded-lg border text-left transition-all
                    ${planet.exhausted
                      ? 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                      : selectedPlanets.has(planet.planetId)
                        ? 'bg-blue-600/20 border-blue-500'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                    }
                  `}
                >
                  <div className="font-medium text-white text-sm truncate">{planet.name}</div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-yellow-400">{planet.resources} R</span>
                    <span className="text-xs text-blue-400">{planet.influence} I</span>
                  </div>
                  {planet.exhausted && (
                    <span className="text-xs text-gray-500">Exhausted</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trade Goods */}
        {showTradeGoods && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Trade Goods</h3>
            <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="text-sm text-gray-400">Available: {player.tradeGoods}</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTradeGoodsToSpend(Math.max(0, tradeGoodsToSpend - 1))}
                  disabled={tradeGoodsToSpend <= 0}
                  className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="text-xl font-bold text-amber-400 w-8 text-center">
                  {tradeGoodsToSpend}
                </span>
                <button
                  onClick={() => setTradeGoodsToSpend(Math.min(player.tradeGoods, tradeGoodsToSpend + 1))}
                  disabled={tradeGoodsToSpend >= player.tradeGoods}
                  className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Command Tokens */}
        {showTokens && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Command Tokens</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-red-400 mb-2">Tactics: {player.commandTokens.tactics}</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTacticTokensToSpend(Math.max(0, tacticTokensToSpend - 1))}
                    disabled={tacticTokensToSpend <= 0}
                    className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-red-400 w-8 text-center">
                    {tacticTokensToSpend}
                  </span>
                  <button
                    onClick={() => setTacticTokensToSpend(Math.min(player.commandTokens.tactics, tacticTokensToSpend + 1))}
                    disabled={tacticTokensToSpend >= player.commandTokens.tactics}
                    className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-yellow-400 mb-2">Strategy: {player.commandTokens.strategy}</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setStrategyTokensToSpend(Math.max(0, strategyTokensToSpend - 1))}
                    disabled={strategyTokensToSpend <= 0}
                    className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-yellow-400 w-8 text-center">
                    {strategyTokensToSpend}
                  </span>
                  <button
                    onClick={() => setStrategyTokensToSpend(Math.min(player.commandTokens.strategy, strategyTokensToSpend + 1))}
                    disabled={strategyTokensToSpend >= player.commandTokens.strategy}
                    className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isMet}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isMet
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm & Score (+{objective.points} VP)
          </button>
        </div>
      </div>
    </div>
  );
}

interface RequirementBadgeProps {
  label: string;
  required: number;
  current: number;
  color: 'yellow' | 'blue' | 'amber' | 'red';
}

function RequirementBadge({ label, required, current, color }: RequirementBadgeProps) {
  const isMet = current >= required;
  const colorClasses = {
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };

  return (
    <div className={`px-3 py-2 rounded-lg ${isMet ? 'bg-green-600/20' : 'bg-gray-700'}`}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-lg font-bold ${isMet ? 'text-green-400' : colorClasses[color]}`}>
        {current} / {required}
      </div>
    </div>
  );
}
