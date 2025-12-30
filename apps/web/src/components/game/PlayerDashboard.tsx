'use client';

import { useState } from 'react';
import Image from 'next/image';
import { factions, technologies } from '@ti4/game-data';
import type { PlayerState } from '@ti4/shared';
import {
  getFactionIconUrl,
  getCommandTokenUrl,
  getStrategyCardUrl,
  getTechnologyCardUrl,
} from '@/lib/assets';
import { PromissoryNotesPanel } from './PromissoryNotesPanel';

interface PlayerDashboardProps {
  player: PlayerState;
  isActivePlayer: boolean;
}

// Strategy card names
const STRATEGY_CARD_NAMES: Record<number, string> = {
  1: 'Leadership',
  2: 'Diplomacy',
  3: 'Politics',
  4: 'Construction',
  5: 'Trade',
  6: 'Warfare',
  7: 'Technology',
  8: 'Imperial',
};

// Command token component - uses faction command token images
function CommandToken({
  type,
  count,
  factionId,
}: {
  type: 'tactics' | 'fleet' | 'strategy';
  count: number;
  factionId: string;
}) {
  const descriptions: Record<string, string> = {
    tactics: 'Tactics',
    fleet: 'Fleet',
    strategy: 'Strategy',
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0.5 mb-1 flex-wrap justify-center max-w-20">
        {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
          <div key={i} className="w-5 h-5 relative">
            <Image
              src={getCommandTokenUrl(factionId)}
              alt={`${type} token`}
              fill
              className="object-contain"
              onError={(e) => {
                // Fallback to colored square
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        ))}
        {count > 8 && (
          <span className="text-xs text-gray-400 ml-1">+{count - 8}</span>
        )}
      </div>
      <div className="text-xs text-gray-500">{descriptions[type]}</div>
      <div className="text-lg font-bold text-white">{count}</div>
    </div>
  );
}

// Technology card component - displays actual card image with modal on click
function TechnologyCard({ techId, onSelect }: { techId: string; onSelect: (techId: string) => void }) {
  const tech = technologies[techId];
  const imagePath = getTechnologyCardUrl(techId);

  return (
    <div
      className="w-full rounded overflow-hidden border border-gray-600 hover:border-gray-400 transition-colors cursor-pointer"
      onClick={() => onSelect(techId)}
    >
      <Image
        src={imagePath}
        alt={tech?.name || techId}
        width={120}
        height={80}
        className="w-full h-auto"
        onError={(e) => {
          // Show fallback text if image fails
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement!.innerHTML = `<div class="p-2 text-xs text-gray-400 bg-gray-800">${tech?.name || techId}</div>`;
        }}
      />
    </div>
  );
}

// Modal for displaying enlarged technology card
function TechCardModal({ techId, onClose }: { techId: string; onClose: () => void }) {
  const tech = technologies[techId];
  const imagePath = getTechnologyCardUrl(techId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-gray-400 hover:text-white text-sm"
        >
          Click anywhere to close
        </button>

        {/* Card image */}
        <div className="rounded-lg overflow-hidden border-2 border-gray-500 shadow-2xl">
          <Image
            src={imagePath}
            alt={tech?.name || techId}
            width={400}
            height={267}
            className="w-full h-auto"
          />
        </div>

        {/* Card info */}
        {tech && (
          <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-gray-600">
            <h3 className="text-lg font-bold text-white mb-2">{tech.name}</h3>
            {tech.description && (
              <p className="text-sm text-gray-300 leading-relaxed">{tech.description}</p>
            )}
            {tech.prerequisites && tech.prerequisites.length > 0 && (
              <div className="mt-3 text-xs text-gray-400">
                Prerequisites: {tech.prerequisites.map(p => `${p.count} ${p.color}`).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PlayerDashboard({ player, isActivePlayer }: PlayerDashboardProps) {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const faction = factions[player.faction];

  return (
    <div className={`
      bg-gray-800 rounded-lg border-2 p-4
      ${isActivePlayer ? 'border-yellow-500' : 'border-gray-700'}
    `}>
      {/* Header - Faction Icon and Player Name */}
      <div className="flex items-center gap-3 mb-4">
        {/* Faction icon with color ring */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center p-1"
          style={{ backgroundColor: getColorHex(player.color) }}
        >
          <div className="w-10 h-10 relative">
            <Image
              src={getFactionIconUrl(player.faction)}
              alt={faction?.name || player.faction}
              fill
              className="object-contain"
              onError={(e) => {
                // Fallback to initial
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white">{player.name}</h3>
          <p className="text-sm text-gray-400">{faction?.name || player.faction}</p>
        </div>
        {isActivePlayer && (
          <span className="px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded font-medium">
            Active
          </span>
        )}
      </div>

      {/* Command Sheet with Tokens */}
      <div className="bg-gray-900 rounded-lg p-3 mb-4 relative">
        <div className="text-xs text-gray-500 mb-3 text-center">Command Sheet</div>

        {/* Token pools arranged like the real command sheet */}
        <div className="flex justify-around items-start">
          <CommandToken type="tactics" count={player.commandTokens.tactics} factionId={player.faction} />
          <CommandToken type="fleet" count={player.commandTokens.fleet} factionId={player.faction} />
          <CommandToken type="strategy" count={player.commandTokens.strategy} factionId={player.faction} />
        </div>

        {/* Trade Goods section */}
        <div className="mt-3 pt-3 border-t border-gray-700 flex justify-center gap-4">
          <div className="text-center">
            <div className="flex gap-1 justify-center mb-1">
              {Array.from({ length: Math.min(player.tradeGoods, 10) }).map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-300" />
              ))}
              {player.tradeGoods > 10 && (
                <span className="text-xs text-yellow-400">+{player.tradeGoods - 10}</span>
              )}
            </div>
            <div className="text-xs text-gray-500">Trade Goods</div>
            <div className="text-lg font-bold text-yellow-400">{player.tradeGoods}</div>
          </div>

          <div className="text-center">
            <div className="flex gap-1 justify-center mb-1">
              {Array.from({ length: player.maxCommodities }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full border ${
                    i < player.commodities
                      ? 'bg-blue-500 border-blue-300'
                      : 'bg-gray-700 border-gray-600'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500">Commodities</div>
            <div className="text-lg font-bold text-blue-400">
              {player.commodities}/{player.maxCommodities}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Card - Full Image */}
      {player.strategyCard && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Strategy Card</div>
          <div className="relative w-full aspect-[2/3] max-w-[170px] mx-auto rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg">
            <Image
              src={getStrategyCardUrl(player.strategyCard)}
              alt={STRATEGY_CARD_NAMES[player.strategyCard]}
              fill
              className="object-cover"
              sizes="170px"
            />
            {player.strategyCardUsed && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-sm rotate-[-15deg]">EXHAUSTED</span>
              </div>
            )}
          </div>
          <div className="text-center mt-2 text-sm font-medium text-white">
            {STRATEGY_CARD_NAMES[player.strategyCard]}
          </div>
        </div>
      )}

      {/* Victory Points */}
      <div className="bg-gray-900 rounded p-3 mb-4">
        <div className="text-xs text-gray-500 mb-1">Victory Points</div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">{player.score}</span>
          <span className="text-gray-500">/ 10</span>
        </div>
        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300"
            style={{ width: `${(player.score / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Technologies - Display card images */}
      {player.technologies.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-2">Technologies ({player.technologies.length})</div>
          <div className="grid grid-cols-2 gap-2">
            {player.technologies.map((tech) => (
              <TechnologyCard key={tech} techId={tech} onSelect={setSelectedTech} />
            ))}
          </div>
        </div>
      )}

      {/* Promissory Notes */}
      <PromissoryNotesPanel player={player} compact />

      {/* Tech card modal */}
      {selectedTech && (
        <TechCardModal techId={selectedTech} onClose={() => setSelectedTech(null)} />
      )}
    </div>
  );
}

function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    red: '#dc2626',
    blue: '#2563eb',
    green: '#16a34a',
    yellow: '#eab308',
    purple: '#9333ea',
    orange: '#ea580c',
    pink: '#ec4899',
    black: '#1f2937',
  };
  return colors[color] || '#6b7280';
}
