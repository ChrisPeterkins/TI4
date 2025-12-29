'use client';

import type { LobbyPlayer } from '@ti4/shared';

interface PlayerSlotProps {
  player: LobbyPlayer | null;
  isCurrentUser: boolean;
  isHost?: boolean;
  onAddBot?: () => void;
  onRemoveBot?: (seatIndex: number) => void;
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

export default function PlayerSlot({
  player,
  isCurrentUser,
  isHost,
  onAddBot,
  onRemoveBot,
}: PlayerSlotProps) {
  if (!player) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg border border-dashed border-gray-600">
        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
          <span className="text-gray-400 text-lg">?</span>
        </div>
        <div className="flex-1 text-gray-500 italic">Waiting for player...</div>
        {isHost && onAddBot && (
          <button
            onClick={onAddBot}
            className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            + Add Bot
          </button>
        )}
      </div>
    );
  }

  const isBot = player.isBot === true;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        isCurrentUser
          ? 'bg-blue-900/30 border-blue-500'
          : isBot
          ? 'bg-purple-900/20 border-purple-600'
          : 'bg-gray-700/50 border-gray-600'
      }`}
    >
      {/* Color indicator */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
          player.color ? COLOR_MAP[player.color] || 'bg-gray-600' : 'bg-gray-600'
        }`}
      >
        {isBot ? '🤖' : player.name.charAt(0).toUpperCase()}
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
          {isBot && (
            <span className="px-2 py-0.5 bg-purple-600 text-xs rounded-full">
              Bot
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

      {/* Remove bot button (host only) */}
      {isBot && isHost && onRemoveBot && player.seatIndex !== undefined && (
        <button
          onClick={() => onRemoveBot(player.seatIndex!)}
          className="px-2 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors"
          title="Remove bot"
        >
          ✕
        </button>
      )}
    </div>
  );
}
