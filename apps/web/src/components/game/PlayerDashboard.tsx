'use client';

import { factions } from '@ti4/game-data';
import type { PlayerState } from '@ti4/shared';

interface PlayerDashboardProps {
  player: PlayerState;
  isActivePlayer: boolean;
}

export function PlayerDashboard({ player, isActivePlayer }: PlayerDashboardProps) {
  const faction = factions[player.faction];

  return (
    <div className={`
      bg-gray-800 rounded-lg border-2 p-4
      ${isActivePlayer ? 'border-yellow-500' : 'border-gray-700'}
    `}>
      {/* Header - Faction and Player Name */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: getColorHex(player.color) }}
        >
          {player.name[0]?.toUpperCase()}
        </div>
        <div>
          <h3 className="font-bold text-white">{player.name}</h3>
          <p className="text-sm text-gray-400">{faction?.name || player.faction}</p>
        </div>
        {isActivePlayer && (
          <span className="ml-auto px-2 py-1 bg-yellow-600 text-yellow-100 text-xs rounded font-medium">
            Active
          </span>
        )}
      </div>

      {/* Resources Section */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Trade Goods */}
        <div className="bg-gray-900 rounded p-2">
          <div className="text-xs text-gray-500 mb-1">Trade Goods</div>
          <div className="text-xl font-bold text-yellow-400">{player.tradeGoods}</div>
        </div>

        {/* Commodities */}
        <div className="bg-gray-900 rounded p-2">
          <div className="text-xs text-gray-500 mb-1">Commodities</div>
          <div className="text-xl font-bold text-blue-400">
            {player.commodities}/{player.maxCommodities}
          </div>
        </div>
      </div>

      {/* Command Tokens */}
      <div className="bg-gray-900 rounded p-3 mb-4">
        <div className="text-xs text-gray-500 mb-2">Command Tokens</div>
        <div className="flex justify-between">
          <div className="text-center">
            <div className="text-lg font-bold text-green-400">{player.commandTokens.tactics}</div>
            <div className="text-xs text-gray-500">Tactics</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-400">{player.commandTokens.fleet}</div>
            <div className="text-xs text-gray-500">Fleet</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{player.commandTokens.strategy}</div>
            <div className="text-xs text-gray-500">Strategy</div>
          </div>
        </div>
      </div>

      {/* Strategy Card */}
      {player.strategyCard && (
        <div className="bg-gray-900 rounded p-3 mb-4">
          <div className="text-xs text-gray-500 mb-1">Strategy Card</div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center font-bold">
              {player.strategyCard}
            </div>
            <span className="text-white font-medium">
              {getStrategyCardName(player.strategyCard)}
            </span>
          </div>
        </div>
      )}

      {/* Victory Points */}
      <div className="bg-gray-900 rounded p-3">
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

      {/* Technologies */}
      {player.technologies.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-2">Technologies ({player.technologies.length})</div>
          <div className="flex flex-wrap gap-1">
            {player.technologies.slice(0, 6).map((tech) => (
              <span
                key={tech}
                className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300"
                title={tech}
              >
                {tech.length > 10 ? tech.substring(0, 10) + '...' : tech}
              </span>
            ))}
            {player.technologies.length > 6 && (
              <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
                +{player.technologies.length - 6} more
              </span>
            )}
          </div>
        </div>
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

function getStrategyCardName(number: number): string {
  const names: Record<number, string> = {
    1: 'Leadership',
    2: 'Diplomacy',
    3: 'Politics',
    4: 'Construction',
    5: 'Trade',
    6: 'Warfare',
    7: 'Technology',
    8: 'Imperial',
  };
  return names[number] || `Strategy ${number}`;
}
