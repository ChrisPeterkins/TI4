'use client';

import { useMemo } from 'react';
import { GameBoard } from '@/components/game-board';
import { createMockGameState } from '@/lib/mock-game-state';

export default function Home() {
  // Create a mock game state for testing
  const gameState = useMemo(() => createMockGameState(6), []);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <h1 className="text-xl font-bold tracking-tight">
          Twilight Imperium 4
        </h1>
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span>Round {gameState.round}</span>
          <span className="px-2 py-1 bg-zinc-800 rounded">
            {gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1)} Phase
          </span>
        </div>
      </header>

      {/* Main game board */}
      <main className="flex-1 relative">
        <GameBoard
          gameState={gameState}
          onTileClick={(tile) => {
            console.log('Clicked tile:', tile.systemId, tile.position);
          }}
          onTileHover={(tile) => {
            // Hover handling is done inside GameBoard
          }}
          className="absolute inset-0"
        />
      </main>

      {/* Footer / Player info */}
      <footer className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {gameState.players.slice(0, 6).map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded ${
                  player.id === gameState.activePlayerId
                    ? 'bg-zinc-700 ring-2 ring-yellow-500'
                    : 'bg-zinc-800'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getPlayerColorHex(player.color),
                  }}
                />
                <span className="text-sm font-medium">{player.name}</span>
                <span className="text-xs text-zinc-400">
                  {player.faction.charAt(0).toUpperCase() + player.faction.slice(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="text-sm text-zinc-400">
            VP Target: 10
          </div>
        </div>
      </footer>
    </div>
  );
}

function getPlayerColorHex(color: string): string {
  const colors: Record<string, string> = {
    red: '#e53935',
    blue: '#1e88e5',
    yellow: '#fdd835',
    green: '#43a047',
    purple: '#8e24aa',
    orange: '#fb8c00',
    pink: '#ec407a',
    black: '#424242',
  };
  return colors[color] ?? '#888888';
}
