'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { GameState, PlayerState, TechColor } from '@ti4/shared';
import { technologies, factions, systems, meetsPrerequisites } from '@ti4/game-data';
import { getTechnologyCardUrl } from '@/lib/assets';

interface TechnologyPanelProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  isResearchMode: boolean;
  onResearchTech: (techId: string, exhaustedPlanets?: string[]) => void;
  onClose?: () => void;
}

const COLOR_LABELS: Record<TechColor, { name: string; color: string; bg: string }> = {
  blue: { name: 'Propulsion', color: '#3b82f6', bg: 'bg-blue-900/50' },
  green: { name: 'Biotic', color: '#22c55e', bg: 'bg-green-900/50' },
  yellow: { name: 'Cybernetic', color: '#eab308', bg: 'bg-yellow-900/50' },
  red: { name: 'Warfare', color: '#ef4444', bg: 'bg-red-900/50' },
};

/**
 * Get a planet's tech specialty from static data
 */
function getPlanetTechSpecialty(planetId: string): TechColor | undefined {
  for (const system of Object.values(systems)) {
    for (const planet of system.planets) {
      if (planet.id === planetId) {
        return planet.techSpecialty as TechColor | undefined;
      }
    }
  }
  return undefined;
}

/**
 * Get planets with tech specialties that the player controls
 */
function getTechSpecialtyPlanets(
  gameState: GameState,
  playerId: string
): { planetId: string; specialty: TechColor; exhausted: boolean }[] {
  const result: { planetId: string; specialty: TechColor; exhausted: boolean }[] = [];

  for (const tile of gameState.map.tiles) {
    for (const planet of tile.planets) {
      if (planet.controlledBy === playerId) {
        const specialty = getPlanetTechSpecialty(planet.planetId);
        if (specialty) {
          result.push({
            planetId: planet.planetId,
            specialty,
            exhausted: planet.exhausted,
          });
        }
      }
    }
  }

  return result;
}

/**
 * Check if a tech can be researched by the player
 */
function canResearchTech(
  player: PlayerState,
  techId: string,
  ignoredPrereqs: number = 0
): { canResearch: boolean; reason?: string } {
  const tech = technologies[techId];
  if (!tech) {
    return { canResearch: false, reason: 'Unknown technology' };
  }

  // Already researched
  if (player.technologies.includes(techId)) {
    return { canResearch: false, reason: 'Already researched' };
  }

  // Faction restriction
  if (tech.factionId && tech.factionId !== player.faction) {
    return { canResearch: false, reason: 'Faction-restricted' };
  }

  // Nekro cannot research
  if (player.faction === 'nekro') {
    return { canResearch: false, reason: 'Nekro Virus cannot research' };
  }

  // Jol-Nar bonus
  const jolnarBonus = player.faction === 'jolnar' ? 1 : 0;
  const totalIgnored = ignoredPrereqs + jolnarBonus;

  // Prerequisites
  if (!meetsPrerequisites(player.technologies, techId, totalIgnored)) {
    return { canResearch: false, reason: 'Prerequisites not met' };
  }

  return { canResearch: true };
}

/**
 * Technology card display for research view
 */
function TechResearchCard({
  techId,
  player,
  availableTechSpecialties,
  onSelect,
  selected,
}: {
  techId: string;
  player: PlayerState;
  availableTechSpecialties: number;
  onSelect: (techId: string) => void;
  selected: boolean;
}) {
  const tech = technologies[techId];
  const { canResearch, reason } = canResearchTech(player, techId, availableTechSpecialties);
  const imagePath = getTechnologyCardUrl(techId);

  if (!tech) return null;

  return (
    <div
      className={`
        relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer
        ${selected ? 'border-green-500 ring-2 ring-green-500/50' : 'border-gray-600'}
        ${canResearch ? 'hover:border-green-400' : 'opacity-50'}
      `}
      onClick={() => canResearch && onSelect(techId)}
    >
      <Image
        src={imagePath}
        alt={tech.name}
        width={180}
        height={120}
        className="w-full h-auto"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement!.innerHTML = `<div class="p-3 bg-gray-800 text-sm">${tech.name}</div>`;
        }}
      />

      {/* Prerequisites badge */}
      {tech.prerequisites.length > 0 && (
        <div className="absolute top-1 left-1 flex gap-0.5">
          {tech.prerequisites.map((prereq, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{ backgroundColor: COLOR_LABELS[prereq.color].color }}
            >
              {prereq.count}
            </div>
          ))}
        </div>
      )}

      {/* Status overlay */}
      {!canResearch && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-xs text-gray-300 px-2 py-1 bg-black/80 rounded">
            {reason}
          </span>
        </div>
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * Tech specialty planet selector
 */
function TechSpecialtySelector({
  planets,
  selectedPlanets,
  onToggle,
}: {
  planets: { planetId: string; specialty: TechColor; exhausted: boolean }[];
  selectedPlanets: string[];
  onToggle: (planetId: string) => void;
}) {
  if (planets.length === 0) return null;

  const availablePlanets = planets.filter(p => !p.exhausted);

  return (
    <div className="mb-4">
      <div className="text-sm text-gray-400 mb-2">
        Exhaust planets to ignore prerequisites:
      </div>
      <div className="flex flex-wrap gap-2">
        {availablePlanets.map((planet) => {
          const isSelected = selectedPlanets.includes(planet.planetId);
          return (
            <button
              key={planet.planetId}
              onClick={() => onToggle(planet.planetId)}
              className={`
                px-3 py-2 rounded-lg border-2 flex items-center gap-2 transition-all
                ${isSelected
                  ? 'border-green-500 bg-green-900/30'
                  : 'border-gray-600 hover:border-gray-400'
                }
              `}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: COLOR_LABELS[planet.specialty].color }}
              />
              <span className="text-sm">{planet.planetId}</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: COLOR_LABELS[planet.specialty].color + '40',
                  color: COLOR_LABELS[planet.specialty].color,
                }}
              >
                {planet.specialty}
              </span>
            </button>
          );
        })}
      </div>
      {availablePlanets.length === 0 && (
        <div className="text-sm text-gray-500">No unexhausted tech specialty planets</div>
      )}
    </div>
  );
}

export function TechnologyPanel({
  gameState,
  currentPlayer,
  isResearchMode,
  onResearchTech,
  onClose,
}: TechnologyPanelProps) {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TechColor | 'unit' | 'faction'>('blue');

  if (!currentPlayer) return null;

  const techSpecialtyPlanets = useMemo(
    () => getTechSpecialtyPlanets(gameState, currentPlayer.id),
    [gameState, currentPlayer.id]
  );

  const togglePlanet = (planetId: string) => {
    setSelectedPlanets(prev =>
      prev.includes(planetId)
        ? prev.filter(p => p !== planetId)
        : [...prev, planetId]
    );
  };

  const handleResearch = () => {
    if (selectedTech) {
      onResearchTech(selectedTech, selectedPlanets.length > 0 ? selectedPlanets : undefined);
      setSelectedTech(null);
      setSelectedPlanets([]);
    }
  };

  // Group technologies by category
  const techsByCategory = useMemo(() => {
    const result: Record<string, { id: string; tech: typeof technologies[string] }[]> = {
      blue: [],
      green: [],
      yellow: [],
      red: [],
      unit: [],
      faction: [],
    };

    for (const [id, tech] of Object.entries(technologies)) {
      // Skip if already researched
      if (currentPlayer.technologies.includes(id)) continue;

      // Skip other faction's techs
      if (tech.factionId && tech.factionId !== currentPlayer.faction) continue;

      if (tech.factionId) {
        result.faction.push({ id, tech });
      } else if (tech.type === 'unit_upgrade') {
        result.unit.push({ id, tech });
      } else if (tech.color) {
        result[tech.color].push({ id, tech });
      }
    }

    return result;
  }, [currentPlayer.technologies, currentPlayer.faction]);

  const tabs = [
    { key: 'blue' as const, label: 'Blue', color: '#3b82f6' },
    { key: 'green' as const, label: 'Green', color: '#22c55e' },
    { key: 'yellow' as const, label: 'Yellow', color: '#eab308' },
    { key: 'red' as const, label: 'Red', color: '#ef4444' },
    { key: 'unit' as const, label: 'Unit Upgrades', color: '#8b5cf6' },
    { key: 'faction' as const, label: 'Faction', color: '#f97316' },
  ];

  const availableTechSpecialties = selectedPlanets.length +
    (currentPlayer.faction === 'jolnar' ? 1 : 0);

  return (
    <div className="fixed bottom-16 left-72 right-4 z-30 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-t-lg shadow-xl max-h-[60vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white">
          {isResearchMode ? 'Research Technology' : 'Technologies'}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tech specialty planets */}
      {isResearchMode && (
        <div className="px-4 py-3 border-b border-gray-700">
          <TechSpecialtySelector
            planets={techSpecialtyPlanets}
            selectedPlanets={selectedPlanets}
            onToggle={togglePlanet}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-700 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              px-4 py-2 text-sm font-medium transition-colors relative
              ${activeTab === tab.key ? 'text-white' : 'text-gray-400 hover:text-gray-200'}
            `}
          >
            {tab.label}
            <span className="ml-1 text-xs text-gray-500">
              ({techsByCategory[tab.key].length})
            </span>
            {activeTab === tab.key && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: tab.color }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Technology grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {techsByCategory[activeTab].map(({ id }) => (
            <TechResearchCard
              key={id}
              techId={id}
              player={currentPlayer}
              availableTechSpecialties={availableTechSpecialties}
              onSelect={setSelectedTech}
              selected={selectedTech === id}
            />
          ))}
          {techsByCategory[activeTab].length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              No technologies available in this category
            </div>
          )}
        </div>
      </div>

      {/* Research button */}
      {isResearchMode && selectedTech && (
        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <div>
            <span className="text-gray-400">Selected: </span>
            <span className="text-white font-medium">
              {technologies[selectedTech]?.name}
            </span>
          </div>
          <button
            onClick={handleResearch}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
          >
            Research Technology
          </button>
        </div>
      )}
    </div>
  );
}
