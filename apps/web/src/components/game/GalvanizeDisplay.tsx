'use client';

import { useState } from 'react';

interface GalvanizedUnit {
  unitId: string;
  unitType: string;
  systemId: string;
  planetId?: string;
}

interface GalvanizeDisplayProps {
  galvanizedUnits: GalvanizedUnit[];
  maxGalvanizeTokens: number;
  isCurrentPlayer: boolean;
  onViewUnit?: (unit: GalvanizedUnit) => void;
}

const UNIT_ICONS: Record<string, string> = {
  carrier: '🚢',
  cruiser: '🛳️',
  destroyer: '⚓',
  dreadnought: '🛡️',
  flagship: '🚀',
  war_sun: '☀️',
  fighter: '✈️',
  infantry: '🎖️',
  mech: '🤖',
  pds: '📡',
  space_dock: '🏭',
};

export default function GalvanizeDisplay({
  galvanizedUnits,
  maxGalvanizeTokens,
  isCurrentPlayer,
  onViewUnit,
}: GalvanizeDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const availableTokens = maxGalvanizeTokens - galvanizedUnits.length;

  return (
    <div className="bg-gray-900 border border-amber-500/50 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-amber-900/30 to-gray-900 hover:from-amber-900/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-black text-sm font-bold">G</span>
          </div>
          <span className="font-medium text-white">Galvanize</span>
          <div className="flex items-center gap-1">
            <span className="px-2 py-0.5 bg-amber-600 text-white text-xs rounded-full">
              {galvanizedUnits.length}/{maxGalvanizeTokens}
            </span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 border-t border-amber-500/30">
          {/* Token Pool */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Token Pool</div>
            <div className="flex items-center gap-1">
              {/* Used tokens */}
              {Array.from({ length: galvanizedUnits.length }).map((_, i) => (
                <div
                  key={`used-${i}`}
                  className="w-8 h-8 bg-amber-600 border-2 border-amber-400 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20"
                >
                  <span className="text-black text-xs font-bold">G</span>
                </div>
              ))}
              {/* Available tokens */}
              {Array.from({ length: availableTokens }).map((_, i) => (
                <div
                  key={`available-${i}`}
                  className="w-8 h-8 bg-gray-700 border-2 border-gray-500 rounded-full flex items-center justify-center opacity-40"
                >
                  <span className="text-gray-400 text-xs font-bold">G</span>
                </div>
              ))}
            </div>
          </div>

          {/* Galvanized Units */}
          {galvanizedUnits.length > 0 ? (
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Galvanized Units
              </div>
              <div className="space-y-2">
                {galvanizedUnits.map((unit) => (
                  <button
                    key={unit.unitId}
                    onClick={() => onViewUnit?.(unit)}
                    className="w-full flex items-center gap-3 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-amber-900/40 border border-amber-500 rounded-lg flex items-center justify-center">
                      <span className="text-lg">{UNIT_ICONS[unit.unitType] || '🔷'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white capitalize">
                        {unit.unitType.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-400">
                        System {unit.systemId}
                        {unit.planetId && ` • ${unit.planetId}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      <span className="text-xs">+1 die</span>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">No galvanized units</p>
              {isCurrentPlayer && (
                <p className="text-gray-500 text-xs mt-1">
                  Win combat to galvanize a participating unit
                </p>
              )}
            </div>
          )}

          {/* Ability Description */}
          <div className="mt-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
            <div className="text-xs text-amber-400 font-medium mb-1">Galvanize Ability</div>
            <p className="text-xs text-gray-300">
              After winning combat, place a galvanize token on a participating unit. Galvanized
              units roll 1 additional die during combat. You may have up to {maxGalvanizeTokens}{' '}
              galvanize tokens.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
