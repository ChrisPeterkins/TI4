'use client';

import type { LobbyPlayer } from '@ti4/shared';

interface PlayerSlotProps {
  player: LobbyPlayer | null;
  isCurrentUser: boolean;
}

const COLOR_MAP: Record<string, string> = {
  red: 'bg-red-600',
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-600',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  black: 'bg-gray-800',
};

export default function PlayerSlot({ player, isCurrentUser }: PlayerSlotProps) {
  if (!player) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg border border-dashed border-gray-600">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
          <span className="text-gray-400 text-lg">?</span>
        </div>
        <div className="text-gray-500 italic">Waiting for player...</div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        isCurrentUser
          ? 'bg-blue-900/30 border-blue-500'
          : 'bg-gray-700/50 border-gray-600'
      }`}
    >
      {/* Color indicator */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
          player.color ? COLOR_MAP[player.color] || 'bg-gray-600' : 'bg-gray-600'
        }`}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>

      {/* Player info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{player.name}</span>
          {player.isHost && (
            <span className="px-2 py-0.5 bg-yellow-600 text-xs rounded-full">
              Host
            </span>
          )}
          {isCurrentUser && (
            <span className="text-gray-400 text-sm">(You)</span>
          )}
        </div>
        <div className="text-sm text-gray-400">
          {player.faction || 'No faction selected'}
          {player.color && ` • ${player.color}`}
        </div>
      </div>

      {/* Ready status */}
      <div
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          player.ready
            ? 'bg-green-600/20 text-green-400 border border-green-600'
            : 'bg-gray-600/20 text-gray-400 border border-gray-600'
        }`}
      >
        {player.ready ? 'Ready' : 'Not Ready'}
      </div>
    </div>
  );
}
