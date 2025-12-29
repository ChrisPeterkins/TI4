'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/game-store';
import { useLobbyStore } from '@/stores/lobby-store';
import { GameBoard } from '@/components/game-board';
import { StrategyPhasePanel, PlayerDashboard, ActionPhasePanel, TurnIndicator, StatusPhasePanel } from '@/components/game';
import type { PickStrategyCardAction, PassAction, StrategicAction } from '@ti4/shared';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { isConnected: socketConnected, isLoading: socketLoading } = useSocket();
  const {
    gameId,
    gameState,
    currentPlayerId,
    isLoading,
    error,
    isConnected,
    joinGame,
    leaveGame,
    sendAction,
    setCurrentPlayerId,
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

  // Find current player using the playerId from the store
  const currentPlayer = currentPlayerId
    ? gameState.players.find((p) => p.id === currentPlayerId) ?? null
    : null;

  // Check if it's the current player's turn
  const isMyTurn = currentPlayerId === gameState.activePlayerId;

  // Handle strategy card pick
  const handlePickCard = (cardNumber: number) => {
    sendAction({
      type: 'pick_strategy_card',
      cardNumber,
    } as Omit<PickStrategyCardAction, 'playerId' | 'timestamp'>);
  };

  // Handle tactical action - for now just shows we need to implement system activation
  const handleTacticalAction = () => {
    // TODO: Open system selection modal
    console.log('Tactical action clicked - system selection coming soon');
  };

  // Handle strategic action
  const handleStrategicAction = () => {
    if (!currentPlayer?.strategyCard) return;
    sendAction({
      type: 'strategic_action',
      cardNumber: currentPlayer.strategyCard,
    } as Omit<StrategicAction, 'playerId' | 'timestamp'>);
  };

  // Handle pass
  const handlePass = () => {
    sendAction({
      type: 'pass',
    } as Omit<PassAction, 'playerId' | 'timestamp'>);
  };

  // Handle score objective
  const handleScoreObjective = (objectiveId: string) => {
    sendAction({
      type: 'score_objective',
      objectiveId,
    } as any); // TODO: Add proper type
  };

  // Handle confirm status
  const handleConfirmStatus = () => {
    sendAction({
      type: 'confirm_status',
    } as any); // TODO: Add proper type
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-gray-800/90 backdrop-blur border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white">TI4</h1>
            <TurnIndicator gameState={gameState} currentPlayerId={currentPlayerId} />
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
                useLobbyStore.getState().reset(); // Clear lobby state to prevent redirect back
                router.push('/lobby');
              }}
              className="px-3 py-1 text-sm bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="pt-12 pb-16 flex">
        {/* Left Sidebar - Player Dashboard */}
        <aside className="fixed left-0 top-12 bottom-16 w-72 bg-gray-900 border-r border-gray-700 overflow-y-auto p-4">
          {currentPlayer && (
            <PlayerDashboard
              player={currentPlayer}
              isActivePlayer={currentPlayer.id === gameState.activePlayerId}
            />
          )}
        </aside>

        {/* Game Board - centered */}
        <main className="ml-72 flex-1">
          <GameBoard gameState={gameState} />
        </main>
      </div>

      {/* Strategy Phase Panel */}
      {gameState.phase === 'strategy' && (
        <StrategyPhasePanel
          gameState={gameState}
          currentPlayerId={currentPlayerId}
          onPickCard={handlePickCard}
        />
      )}

      {/* Action Phase Panel */}
      {gameState.phase === 'action' && (
        <ActionPhasePanel
          gameState={gameState}
          currentPlayer={currentPlayer}
          isMyTurn={isMyTurn}
          onTacticalAction={handleTacticalAction}
          onStrategicAction={handleStrategicAction}
          onPass={handlePass}
        />
      )}

      {/* Status Phase Panel */}
      {gameState.phase === 'status' && (
        <StatusPhasePanel
          gameState={gameState}
          currentPlayer={currentPlayer}
          isMyTurn={isMyTurn}
          onScoreObjective={handleScoreObjective}
          onConfirmStatus={handleConfirmStatus}
        />
      )}

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
