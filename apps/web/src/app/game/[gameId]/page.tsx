'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/game-store';
import { GameBoard } from '@/components/game-board';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { isConnected: socketConnected, isLoading: socketLoading } = useSocket();
  const {
    gameId,
    gameState,
    isLoading,
    error,
    isConnected,
    joinGame,
    leaveGame,
  } = useGameStore();

  const urlGameId = params.gameId as string;
  const currentUserId = session?.user?.id;

  // Join game when connected
  useEffect(() => {
    if (socketConnected && !gameId && urlGameId) {
      joinGame(urlGameId);
    }
  }, [socketConnected, gameId, urlGameId, joinGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveGame();
    };
  }, [leaveGame]);

  if (socketLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">
            {socketLoading ? 'Connecting to server...' : 'Loading game...'}
          </div>
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <div className="text-gray-400 mb-6">{error}</div>
          <button
            onClick={() => router.push('/lobby')}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Waiting for game state...</div>
      </div>
    );
  }

  // Find current player
  const currentPlayer = gameState.players.find((p) => {
    // Match by checking game player mapping
    // For now, just use the first player as a placeholder
    return true; // TODO: Match with actual userId
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-gray-800/90 backdrop-blur border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">TI4</h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Round</span>
              <span className="font-mono text-yellow-400">{gameState.round}</span>
              <span className="text-gray-400">|</span>
              <span className="capitalize">{gameState.phase} Phase</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Leave Game */}
            <button
              onClick={() => {
                leaveGame();
                router.push('/lobby');
              }}
              className="px-3 py-1 text-sm bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      {/* Game Board */}
      <main className="pt-12">
        <GameBoard gameState={gameState} />
      </main>

      {/* Player Info Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-gray-800/90 backdrop-blur border-t border-gray-700">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Players */}
          <div className="flex items-center gap-3">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-2 px-3 py-1 rounded ${
                  player.id === gameState.activePlayerId
                    ? 'bg-yellow-600/20 border border-yellow-500'
                    : 'bg-gray-700/50'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full`}
                  style={{ backgroundColor: getColorHex(player.color) }}
                />
                <span className="text-sm font-medium">{player.name}</span>
                <span className="text-xs text-gray-400">{player.score} VP</span>
              </div>
            ))}
          </div>

          {/* Current Player Resources */}
          {currentPlayer && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">TG:</span>
                <span className="text-yellow-400 font-mono">
                  {currentPlayer.tradeGoods}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Comm:</span>
                <span className="text-blue-400 font-mono">
                  {currentPlayer.commodities}/{currentPlayer.maxCommodities}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Tokens:</span>
                <span className="text-green-400 font-mono">
                  {currentPlayer.commandTokens.tactics}/
                  {currentPlayer.commandTokens.fleet}/
                  {currentPlayer.commandTokens.strategy}
                </span>
              </div>
            </div>
          )}
        </div>
      </footer>
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
