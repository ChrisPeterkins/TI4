'use client';

import { useState } from 'react';
import Image from 'next/image';
import { factions } from '@ti4/game-data';
import { getFactionIconUrl } from '@/lib/assets';

interface FactionSelectProps {
  selectedFaction?: string;
  takenFactions: string[];
  expansions: string[];
  onSelect: (factionId: string) => void;
  disabled?: boolean;
}

export default function FactionSelect({
  selectedFaction,
  takenFactions,
  expansions,
  onSelect,
  disabled = false,
}: FactionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter factions based on expansions
  const availableFactions = Object.values(factions).filter((faction) => {
    if (faction.expansion === 'base') return true;
    if (faction.expansion === 'pok' && expansions.includes('pok')) return true;
    return false;
  });

  const selectedFactionData = selectedFaction ? factions[selectedFaction] : null;

  const handleSelect = (factionId: string) => {
    onSelect(factionId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Selected Faction Display / Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full p-3 bg-gray-700 rounded-lg text-left flex items-center gap-3 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 cursor-pointer'
        }`}
      >
        {selectedFactionData ? (
          <>
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image
                src={getFactionIconUrl(selectedFactionData.id)}
                alt={selectedFactionData.name}
                fill
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1">
              <div className="font-medium">{selectedFactionData.name}</div>
              <div className="text-sm text-gray-400">{selectedFactionData.shortName}</div>
            </div>
          </>
        ) : (
          <span className="text-gray-400">Select a faction...</span>
        )}
        <svg
          className={`w-5 h-5 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {availableFactions.map((faction) => {
            const isTaken = takenFactions.includes(faction.id);
            const isSelected = selectedFaction === faction.id;

            return (
              <button
                key={faction.id}
                type="button"
                onClick={() => !isTaken && handleSelect(faction.id)}
                disabled={isTaken}
                className={`w-full p-3 text-left flex items-center gap-3 border-b border-gray-700 last:border-0 ${
                  isSelected
                    ? 'bg-blue-600'
                    : isTaken
                    ? 'bg-gray-700/50 opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-700'
                }`}
              >
                <div className="w-8 h-8 relative flex-shrink-0">
                  <Image
                    src={getFactionIconUrl(faction.id)}
                    alt={faction.name}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{faction.name}</div>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <span>{faction.shortName}</span>
                    {faction.expansion !== 'base' && (
                      <span className="px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs">
                        {faction.expansion.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {isTaken && (
                  <span className="text-xs text-red-400 flex-shrink-0">Taken</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
