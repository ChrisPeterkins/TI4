'use client';

import { useLobbyStore } from '@/stores/lobby-store';
import type { LobbySettings, LobbyPlayer } from '@ti4/shared';
import PlayerSlot from './PlayerSlot';
import FactionSelect from './FactionSelect';
import ColorSelect from './ColorSelect';

interface LobbyRoomProps {
  lobbyId: string;
  code: string;
  settings: LobbySettings;
  players: LobbyPlayer[];
  currentUserId: string;
  onLeave: () => void;
}

export default function LobbyRoom({
  code,
  settings,
  players,
  currentUserId,
  onLeave,
}: LobbyRoomProps) {
  const {
    selectFaction,
    selectColor,
    readyUp,
    updateSettings,
    startGame,
    error,
  } = useLobbyStore();

  const currentPlayer = players.find((p) => p.id === currentUserId);
  const isHost = currentPlayer?.isHost ?? false;
  const allReady = players.length >= 3 && players.every((p) => p.ready);
  const canStart = isHost && allReady;

  const handleReadyToggle = () => {
    if (currentPlayer) {
      readyUp(!currentPlayer.ready);
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  // Get taken factions and colors
  const takenFactions = players
    .filter((p) => p.id !== currentUserId && p.faction)
    .map((p) => p.faction!);
  const takenColors = players
    .filter((p) => p.id !== currentUserId && p.color)
    .map((p) => p.color!);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Game Lobby</h1>
            <div className="mt-2 flex items-center gap-4">
              <div className="text-lg font-mono bg-gray-800 px-4 py-2 rounded-lg">
                Code: <span className="text-blue-400 font-bold">{code}</span>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Copy
              </button>
            </div>
          </div>
          <button
            onClick={onLeave}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
          >
            Leave Lobby
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Players List */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Players ({players.length}/{settings.playerCount})
              </h2>
              <div className="space-y-3">
                {/* Filled slots */}
                {players.map((player) => (
                  <PlayerSlot
                    key={player.id}
                    player={player}
                    isCurrentUser={player.id === currentUserId}
                  />
                ))}
                {/* Empty slots */}
                {Array.from({ length: settings.playerCount - players.length }).map(
                  (_, i) => (
                    <PlayerSlot key={`empty-${i}`} player={null} isCurrentUser={false} />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Settings & Actions */}
          <div className="space-y-6">
            {/* Game Settings */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Game Settings</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Players</span>
                  <span>{settings.playerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Victory Points</span>
                  <span>{settings.victoryPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Milty Draft</span>
                  <span>{settings.miltyDraft ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Private</span>
                  <span>{settings.privateGame ? 'Yes' : 'No'}</span>
                </div>
                {settings.expansions.length > 0 && (
                  <div>
                    <span className="text-gray-400">Expansions:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {settings.expansions.map((exp) => (
                        <span
                          key={exp}
                          className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Host controls */}
              {isHost && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => {
                      // Could open a settings modal
                      const newVp = settings.victoryPoints === 10 ? 12 : settings.victoryPoints === 12 ? 14 : 10;
                      updateSettings({ victoryPoints: newVp });
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Edit Settings
                  </button>
                </div>
              )}
            </div>

            {/* Your Selection */}
            {currentPlayer && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Your Selection</h2>

                {/* Faction Select */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    Faction
                  </label>
                  <FactionSelect
                    selectedFaction={currentPlayer.faction}
                    takenFactions={takenFactions}
                    expansions={settings.expansions}
                    onSelect={selectFaction}
                    disabled={currentPlayer.ready}
                  />
                </div>

                {/* Color Select */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">
                    Color
                  </label>
                  <ColorSelect
                    selectedColor={currentPlayer.color}
                    takenColors={takenColors}
                    onSelect={selectColor}
                    disabled={currentPlayer.ready}
                  />
                </div>

                {/* Ready Button */}
                <button
                  onClick={handleReadyToggle}
                  disabled={!currentPlayer.faction || !currentPlayer.color}
                  className={`w-full py-3 rounded-lg font-semibold ${
                    currentPlayer.ready
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {currentPlayer.ready ? 'Cancel Ready' : 'Ready Up'}
                </button>

                {!currentPlayer.faction || !currentPlayer.color ? (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Select faction and color to ready up
                  </p>
                ) : null}
              </div>
            )}

            {/* Start Game Button (Host only) */}
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className="w-full py-4 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
              >
                {!allReady
                  ? players.length < 3
                    ? 'Need at least 3 players'
                    : 'Waiting for all players to ready'
                  : 'Start Game'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
