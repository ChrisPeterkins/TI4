'use client';

import { useState, useMemo } from 'react';
import type { GameState, PlayerState, UnitType, HexCoord } from '@ti4/shared';
import { units, systems } from '@ti4/game-data';

interface ProductionPanelProps {
  gameState: GameState;
  currentPlayer: PlayerState;
  onProduceUnits: (units: { type: UnitType; count: number }[]) => void;
  onSkipProduction: () => void;
}

interface ProductionItem {
  type: UnitType;
  count: number;
}

// Unit costs from game data
const UNIT_COSTS: Record<UnitType, number> = {
  fighter: 0.5,
  infantry: 0.5,
  mech: 2,
  destroyer: 1,
  carrier: 3,
  cruiser: 2,
  dreadnought: 4,
  war_sun: 12,
  flagship: 8,
  pds: 0,
  space_dock: 0,
};

// Producible units (excluding structures which are built differently)
const PRODUCIBLE_UNITS: UnitType[] = [
  'infantry',
  'fighter',
  'destroyer',
  'cruiser',
  'carrier',
  'dreadnought',
  'war_sun',
  'flagship',
  'mech',
];

export function ProductionPanel({
  gameState,
  currentPlayer,
  onProduceUnits,
  onSkipProduction,
}: ProductionPanelProps) {
  const [production, setProduction] = useState<Map<UnitType, number>>(new Map());

  // Get the activated system
  const activatedSystem = gameState.activatedSystem;
  const activatedTile = activatedSystem
    ? gameState.map.tiles.find(
        (t) => t.position.q === activatedSystem.q && t.position.r === activatedSystem.r
      )
    : null;

  // Calculate production capacity
  const productionCapacity = useMemo(() => {
    if (!activatedTile) return 0;

    let capacity = 0;

    // Check for space docks on planets
    for (const planet of activatedTile.planets) {
      const spaceDock = planet.units.find(
        (u) => u.ownerId === currentPlayer.id && u.type === 'space_dock'
      );
      if (spaceDock) {
        // Base production is 2, upgraded is 6
        const hasUpgrade = currentPlayer.technologies.includes('space_dock_ii');
        const dockProduction = hasUpgrade ? 6 : 2;

        // Add planet resources
        const planetData = getPlanetData(planet.planetId);
        capacity += dockProduction + (planetData?.resources || 0);
      }
    }

    // Check for floating space dock (Clan of Saar)
    const floatingDock = activatedTile.units.find(
      (u) => u.ownerId === currentPlayer.id && u.type === 'space_dock'
    );
    if (floatingDock) {
      const hasUpgrade = currentPlayer.technologies.includes('space_dock_ii');
      capacity += hasUpgrade ? 6 : 2;
    }

    return capacity;
  }, [activatedTile, currentPlayer]);

  // Calculate available resources
  const availableResources = useMemo(() => {
    let resources = currentPlayer.tradeGoods;

    for (const planet of currentPlayer.planets) {
      if (!planet.exhausted) {
        const planetData = getPlanetData(planet.planetId);
        if (planetData) {
          resources += planetData.resources;
        }
      }
    }

    return resources;
  }, [currentPlayer]);

  // Calculate current production totals
  const { totalCost, totalUnits } = useMemo(() => {
    let cost = 0;
    let count = 0;

    production.forEach((qty, type) => {
      cost += UNIT_COSTS[type] * qty;
      count += qty;
    });

    return { totalCost: cost, totalUnits: count };
  }, [production]);

  const handleIncrement = (type: UnitType) => {
    const currentCount = production.get(type) || 0;
    const unitCost = UNIT_COSTS[type];

    // Check if we can afford it
    if (totalCost + unitCost > availableResources) return;

    // Check production capacity
    if (totalUnits + 1 > productionCapacity) return;

    setProduction((prev) => {
      const next = new Map(prev);
      next.set(type, currentCount + 1);
      return next;
    });
  };

  const handleDecrement = (type: UnitType) => {
    const currentCount = production.get(type) || 0;
    if (currentCount <= 0) return;

    setProduction((prev) => {
      const next = new Map(prev);
      if (currentCount === 1) {
        next.delete(type);
      } else {
        next.set(type, currentCount - 1);
      }
      return next;
    });
  };

  const handleConfirmProduction = () => {
    const unitsToProduce: { type: UnitType; count: number }[] = [];

    production.forEach((count, type) => {
      if (count > 0) {
        unitsToProduce.push({ type, count });
      }
    });

    if (unitsToProduce.length > 0) {
      onProduceUnits(unitsToProduce);
    }
  };

  const getSystemName = (systemId: number): string => {
    const system = systems[systemId];
    if (system?.planets.length > 0) {
      return system.planets.map((p) => p.name).join(', ');
    }
    return `System ${systemId}`;
  };

  const getUnitDisplayName = (type: UnitType): string => {
    const names: Record<UnitType, string> = {
      fighter: 'Fighter',
      infantry: 'Infantry',
      mech: 'Mech',
      destroyer: 'Destroyer',
      carrier: 'Carrier',
      cruiser: 'Cruiser',
      dreadnought: 'Dreadnought',
      war_sun: 'War Sun',
      flagship: 'Flagship',
      pds: 'PDS',
      space_dock: 'Space Dock',
    };
    return names[type] || type;
  };

  // Check if player already has flagship
  const hasFlagship = useMemo(() => {
    for (const tile of gameState.map.tiles) {
      if (tile.units.some((u) => u.ownerId === currentPlayer.id && u.type === 'flagship')) {
        return true;
      }
    }
    return false;
  }, [gameState.map.tiles, currentPlayer.id]);

  // Check if player has war sun tech
  const hasWarSunTech = currentPlayer.technologies.includes('war_sun');

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl">
      <div className="bg-gray-800 rounded-lg border border-yellow-500/50 p-4 shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-yellow-400">Production Phase</h3>
            <p className="text-sm text-gray-400">
              Building in{' '}
              <span className="text-yellow-300">
                {activatedTile ? getSystemName(activatedTile.systemId) : 'activated system'}
              </span>
            </p>
          </div>

          {/* Resource Info */}
          <div className="text-right text-sm">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-gray-500">Capacity:</span>{' '}
                <span className={totalUnits > productionCapacity ? 'text-red-400' : 'text-green-400'}>
                  {totalUnits}/{productionCapacity}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Cost:</span>{' '}
                <span className={totalCost > availableResources ? 'text-red-400' : 'text-yellow-400'}>
                  {totalCost}/{availableResources}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Unit Selection Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {PRODUCIBLE_UNITS.map((unitType) => {
            const count = production.get(unitType) || 0;
            const cost = UNIT_COSTS[unitType];
            const canAfford = totalCost + cost <= availableResources;
            const hasCapacity = totalUnits + 1 <= productionCapacity;
            const canAdd = canAfford && hasCapacity;

            // Special restrictions
            const isFlagship = unitType === 'flagship';
            const isWarSun = unitType === 'war_sun';
            const isDisabled =
              (isFlagship && hasFlagship && count === 0) ||
              (isWarSun && !hasWarSunTech);

            return (
              <div
                key={unitType}
                className={`
                  bg-gray-900 rounded-lg p-3 border
                  ${count > 0 ? 'border-yellow-500/50' : 'border-gray-700'}
                  ${isDisabled ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{getUnitDisplayName(unitType)}</span>
                  <span className="text-xs text-gray-500">
                    {cost % 1 === 0 ? cost : cost.toFixed(1)} res
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleDecrement(unitType)}
                    disabled={count === 0}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${
                        count > 0
                          ? 'bg-red-600/30 text-red-400 hover:bg-red-600/50'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    -
                  </button>

                  <span className="w-8 text-center text-lg font-bold">{count}</span>

                  <button
                    onClick={() => handleIncrement(unitType)}
                    disabled={!canAdd || isDisabled}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      ${
                        canAdd && !isDisabled
                          ? 'bg-green-600/30 text-green-400 hover:bg-green-600/50'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    +
                  </button>
                </div>

                {/* Special warnings */}
                {isFlagship && hasFlagship && count === 0 && (
                  <div className="text-[10px] text-gray-500 text-center mt-1">
                    Already have flagship
                  </div>
                )}
                {isWarSun && !hasWarSunTech && (
                  <div className="text-[10px] text-gray-500 text-center mt-1">
                    Need War Sun tech
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        {totalUnits > 0 && (
          <div className="bg-gray-900 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-400 mb-2">Building:</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(production.entries())
                .filter(([, count]) => count > 0)
                .map(([type, count]) => (
                  <span
                    key={type}
                    className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-sm"
                  >
                    {count}x {getUnitDisplayName(type)}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <button
            onClick={onSkipProduction}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            Skip Production
          </button>

          <button
            onClick={handleConfirmProduction}
            disabled={totalUnits === 0}
            className={`
              px-6 py-2 rounded-lg font-medium transition-colors
              ${
                totalUnits > 0
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Build Units ({totalCost} resources)
          </button>
        </div>
      </div>
    </div>
  );
}

function getPlanetData(planetId: string): { resources: number; influence: number } | null {
  for (const system of Object.values(systems)) {
    const planet = system.planets.find((p) => p.id === planetId);
    if (planet) {
      return { resources: planet.resources, influence: planet.influence };
    }
  }
  return null;
}
