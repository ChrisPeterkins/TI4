'use client';

import type { GameState } from '@ti4/shared';

interface TurnIndicatorProps {
  gameState: GameState;
  currentPlayerId: string | null;
}

const PHASE_ICONS: Record<string, string> = {
  setup: '⚙️',
  strategy: '🎯',
  action: '⚔️',
  status: '📊',
  agenda: '🗳️',
};

const PHASE_COLORS: Record<string, string> = {
  setup: 'bg-gray-600',
  strategy: 'bg-purple-600',
  action: 'bg-green-600',
  status: 'bg-blue-600',
  agenda: 'bg-orange-600',
};

export function TurnIndicator({ gameState, currentPlayerId }: TurnIndicatorProps) {
  const activePlayer = gameState.players.find((p) => p.id === gameState.activePlayerId);
  const isMyTurn = currentPlayerId === gameState.activePlayerId;

  return (
    <div className="flex items-center gap-4">
      {/* Phase Badge */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${PHASE_COLORS[gameState.phase] || 'bg-gray-600'}`}>
        <span className="text-lg">{PHASE_ICONS[gameState.phase] || '🎮'}</span>
        <span className="text-white font-medium capitalize">{gameState.phase}</span>
      </div>

      {/* Round Counter */}
      <div className="flex items-center gap-1 text-sm">
        <span className="text-gray-400">Round</span>
        <span className="px-2 py-0.5 bg-gray-700 rounded font-mono text-yellow-400">
          {gameState.round}
        </span>
      </div>

      {/* Active Player */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Active:</span>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            isMyTurn
              ? 'bg-yellow-600/30 border border-yellow-500 text-yellow-300'
              : 'bg-gray-700/50 text-gray-300'
          }`}
        >
          {activePlayer && (
            <>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getColorHex(activePlayer.color) }}
              />
              <span className="font-medium">
                {isMyTurn ? 'You' : activePlayer.name}
              </span>
            </>
          )}
        </div>
      </div>
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
