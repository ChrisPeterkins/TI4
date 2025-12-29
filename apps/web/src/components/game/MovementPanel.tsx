'use client';

import { useState, useMemo } from 'react';
import type { GameState, PlayerState, MapTile, UnitInstance, HexCoord } from '@ti4/shared';
import { systems } from '@ti4/game-data';

interface MovementPanelProps {
  gameState: GameState;
  currentPlayer: PlayerState;
  onMoveUnits: (moves: UnitMoveSelection[]) => void;
  onSkipMovement: () => void;
}

export interface UnitMoveSelection {
  unitId: string;
  from: {
    systemPosition: HexCoord;
    planetId?: string;
  };
  to: {
    systemPosition: HexCoord;
    planetId?: string;
  };
  carrier?: string;
}

interface SelectableUnit {
  unit: UnitInstance;
  tile: MapTile;
  planetId?: string;
}

export function MovementPanel({
  gameState,
  currentPlayer,
  onMoveUnits,
  onSkipMovement,
}: MovementPanelProps) {
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());

  // Get the activated system
  const activatedSystem = gameState.activatedSystem;
  const activatedTile = activatedSystem
    ? gameState.map.tiles.find(
        (t) => t.position.q === activatedSystem.q && t.position.r === activatedSystem.r
      )
    : null;

  // Find all units that can move to the activated system
  const availableUnits = useMemo(() => {
    if (!activatedSystem) return [];

    const units: SelectableUnit[] = [];

    for (const tile of gameState.map.tiles) {
      // Skip the activated system itself (can't move from there)
      if (tile.position.q === activatedSystem.q && tile.position.r === activatedSystem.r) {
        continue;
      }

      // Skip systems already activated by this player this round
      if (tile.commandTokens.includes(currentPlayer.id)) {
        continue;
      }

      // Add ships from this system
      for (const unit of tile.units) {
        if (unit.ownerId === currentPlayer.id) {
          units.push({ unit, tile });
        }
      }

      // Add ground units from planets (for transport)
      for (const planet of tile.planets) {
        for (const unit of planet.units) {
          if (unit.ownerId === currentPlayer.id) {
            units.push({ unit, tile, planetId: planet.planetId });
          }
        }
      }
    }

    return units;
  }, [gameState.map.tiles, activatedSystem, currentPlayer.id]);

  // Group units by system
  const unitsBySystem = useMemo(() => {
    const grouped = new Map<string, SelectableUnit[]>();

    for (const selectable of availableUnits) {
      const key = `${selectable.tile.position.q},${selectable.tile.position.r}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(selectable);
    }

    return grouped;
  }, [availableUnits]);

  const handleToggleUnit = (unitId: string) => {
    setSelectedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
  };

  const handleSelectAll = (systemKey: string) => {
    const systemUnits = unitsBySystem.get(systemKey);
    if (!systemUnits) return;

    setSelectedUnits((prev) => {
      const next = new Set(prev);
      for (const { unit } of systemUnits) {
        next.add(unit.id);
      }
      return next;
    });
  };

  const handleDeselectAll = (systemKey: string) => {
    const systemUnits = unitsBySystem.get(systemKey);
    if (!systemUnits) return;

    setSelectedUnits((prev) => {
      const next = new Set(prev);
      for (const { unit } of systemUnits) {
        next.delete(unit.id);
      }
      return next;
    });
  };

  const handleConfirmMovement = () => {
    if (!activatedSystem || selectedUnits.size === 0) return;

    const moves: UnitMoveSelection[] = [];

    for (const selectable of availableUnits) {
      if (selectedUnits.has(selectable.unit.id)) {
        moves.push({
          unitId: selectable.unit.id,
          from: {
            systemPosition: selectable.tile.position,
            planetId: selectable.planetId,
          },
          to: {
            systemPosition: activatedSystem,
          },
        });
      }
    }

    onMoveUnits(moves);
  };

  const getSystemName = (systemId: number): string => {
    const system = systems[systemId];
    if (system?.planets.length > 0) {
      return system.planets.map((p) => p.name).join(', ');
    }
    return `System ${systemId}`;
  };

  const getUnitDisplayName = (type: string): string => {
    const names: Record<string, string> = {
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

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl">
      <div className="bg-gray-800 rounded-lg border border-green-500/50 p-4 shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-green-400">Movement Phase</h3>
            <p className="text-sm text-gray-400">
              Select units to move to{' '}
              <span className="text-green-300">
                {activatedTile ? getSystemName(activatedTile.systemId) : 'activated system'}
              </span>
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {selectedUnits.size} unit{selectedUnits.size !== 1 ? 's' : ''} selected
          </div>
        </div>

        {/* Unit Selection */}
        <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
          {unitsBySystem.size === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No units available to move
            </div>
          ) : (
            Array.from(unitsBySystem.entries()).map(([systemKey, systemUnits]) => {
              const tile = systemUnits[0].tile;
              const allSelected = systemUnits.every((u) => selectedUnits.has(u.unit.id));
              const someSelected = systemUnits.some((u) => selectedUnits.has(u.unit.id));

              return (
                <div key={systemKey} className="bg-gray-900 rounded-lg p-3">
                  {/* System Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-300">
                      {getSystemName(tile.systemId)}
                      <span className="text-gray-500 ml-2">
                        ({tile.position.q}, {tile.position.r})
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        allSelected ? handleDeselectAll(systemKey) : handleSelectAll(systemKey)
                      }
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* Units Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {systemUnits.map(({ unit, planetId }) => {
                      const isSelected = selectedUnits.has(unit.id);
                      return (
                        <button
                          key={unit.id}
                          onClick={() => handleToggleUnit(unit.id)}
                          className={`
                            flex flex-col items-center p-2 rounded border transition-all
                            ${
                              isSelected
                                ? 'bg-green-600/30 border-green-500'
                                : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                            }
                          `}
                        >
                          <span className="text-xs font-medium">
                            {getUnitDisplayName(unit.type)}
                          </span>
                          {planetId && (
                            <span className="text-[10px] text-gray-500">
                              on planet
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <button
            onClick={onSkipMovement}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            Skip Movement
          </button>

          <button
            onClick={handleConfirmMovement}
            disabled={selectedUnits.size === 0}
            className={`
              px-6 py-2 rounded-lg font-medium transition-colors
              ${
                selectedUnits.size > 0
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Confirm Movement ({selectedUnits.size})
          </button>
        </div>
      </div>
    </div>
  );
}
