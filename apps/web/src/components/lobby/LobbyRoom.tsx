'use client';

import { useLobbyStore } from '@/stores/lobby-store';
import { useTheme } from '@/contexts/ThemeContext';
import type { LobbySettings, LobbyPlayer } from '@ti4/shared';
import PlayerSlot from './PlayerSlot';
import FactionSelect from './FactionSelect';
import ColorSelect from './ColorSelect';
import GalacticEventsSelect from './GalacticEventsSelect';
import ThemedBackground from '@/components/ui/ThemedBackground';
import ThemedPanel, { ThemedCard, ThemedBadge } from '@/components/ui/ThemedPanel';
import {
  PowerCoreButton,
  GlassButton,
  HoloBorderButton,
  ShieldButton,
  PulseButton,
  CommandButton,
} from '@/components/ui/ThemedButton';

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
  const { theme } = useTheme();
  const {
    selectFaction,
    selectColor,
    readyUp,
    updateSettings,
    startGame,
    startDraft,
    addBot,
    removeBot,
    error,
  } = useLobbyStore();

  const currentPlayer = players.find((p) => p.userId === currentUserId);
  const isHost = currentPlayer?.isHost ?? false;
  const allReady = players.length >= 3 && players.every((p) => {
    if (settings.miltyDraft) {
      return p.ready && p.color;
    }
    return p.ready && p.faction && p.color;
  });
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

  const handleStartDraft = async () => {
    try {
      await startDraft();
    } catch (err) {
      console.error('Failed to start draft:', err);
    }
  };

  const takenFactions = players
    .filter((p) => p.userId !== currentUserId && p.faction)
    .map((p) => p.faction!);
  const takenColors = players
    .filter((p) => p.userId !== currentUserId && p.color)
    .map((p) => p.color!);

  return (
    <ThemedBackground>
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-cyan-400 to-white bg-clip-text text-transparent">
                Game Lobby
              </h1>
              <div className="flex items-center gap-4">
                <ThemedPanel className="px-5 py-3 flex items-center gap-3" glow>
                  <span className="text-slate-400">Code:</span>
                  <span className="text-xl font-mono font-bold text-cyan-400">
                    {code}
                  </span>
                </ThemedPanel>
                <GlassButton
                  color="cyan"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(code)}
                >
                  Copy
                </GlassButton>
              </div>
            </div>
            <HoloBorderButton color="rose" onClick={onLeave}>
              Leave Lobby
            </HoloBorderButton>
          </div>

          {/* Error Display */}
          {error && (
            <ThemedPanel variant="error" glow className="mb-6 p-4">
              <div className="flex items-center gap-2">
                <span className="text-rose-400">Warning</span>
                <span className="text-rose-300">{error}</span>
              </div>
            </ThemedPanel>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Players List */}
            <div className="lg:col-span-2">
              <ThemedCard title={`Players (${players.length}/${settings.playerCount})`}>
                <div className="space-y-3">
                  {players.map((player) => (
                    <PlayerSlot
                      key={player.id}
                      player={player}
                      isCurrentUser={player.userId === currentUserId}
                      isHost={isHost}
                      onRemoveBot={removeBot}
                    />
                  ))}
                  {Array.from({ length: settings.playerCount - players.length }).map(
                    (_, i) => (
                      <PlayerSlot
                        key={`empty-${i}`}
                        player={null}
                        isCurrentUser={false}
                        isHost={isHost}
                        onAddBot={() => addBot()}
                      />
                    )
                  )}
                </div>
              </ThemedCard>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Game Settings */}
              <ThemedCard title="Game Settings">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Players</span>
                    <span className="text-white">{settings.playerCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Victory Points</span>
                    <span className="text-white">{settings.victoryPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Milty Draft</span>
                    <ThemedBadge color={settings.miltyDraft ? 'emerald' : 'cyan'}>
                      {settings.miltyDraft ? 'Yes' : 'No'}
                    </ThemedBadge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Private</span>
                    <ThemedBadge color={settings.privateGame ? 'amber' : 'cyan'}>
                      {settings.privateGame ? 'Yes' : 'No'}
                    </ThemedBadge>
                  </div>
                  {settings.expansions.length > 0 && (
                    <div>
                      <span className="text-slate-400">Expansions:</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {settings.expansions.map((exp) => (
                          <ThemedBadge key={exp} color="purple">
                            {exp}
                          </ThemedBadge>
                        ))}
                      </div>
                    </div>
                  )}
                  {settings.galacticEvents && settings.galacticEvents.length > 0 && (
                    <div>
                      <span className="text-slate-400">Galactic Events:</span>
                      <div className="mt-1">
                        <ThemedBadge color="amber">
                          {settings.galacticEvents.length} selected
                        </ThemedBadge>
                      </div>
                    </div>
                  )}
                </div>

                {isHost && (
                  <div className="mt-4 pt-4 border-t border-cyan-400/20">
                    <GlassButton
                      color="cyan"
                      size="sm"
                      onClick={() => {
                        const newVp = settings.victoryPoints === 10 ? 12 : settings.victoryPoints === 12 ? 14 : 10;
                        updateSettings({ victoryPoints: newVp });
                      }}
                    >
                      Edit Settings
                    </GlassButton>
                  </div>
                )}
              </ThemedCard>

              {/* Galactic Events (Thunder's Edge) */}
              {isHost && settings.expansions.includes('thunders_edge') && (
                <ThemedCard title="Galactic Events">
                  <GalacticEventsSelect
                    selectedEvents={settings.galacticEvents || []}
                    onEventsChange={(events) => updateSettings({ galacticEvents: events })}
                    disabled={players.some((p) => p.ready)}
                    maxEvents={3}
                  />
                </ThemedCard>
              )}

              {/* Your Selection */}
              {currentPlayer && (
                <ThemedCard title="Your Selection">
                  {settings.miltyDraft && (
                    <ThemedPanel variant="highlight" glow className="mb-4 p-3">
                      <p className="text-sm text-cyan-300">
                        <strong>Milty Draft enabled!</strong> Factions will be drafted after everyone is ready.
                      </p>
                    </ThemedPanel>
                  )}

                  {!settings.miltyDraft && (
                    <div className="mb-4">
                      <label className="block text-sm text-slate-400 mb-2">
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
                  )}

                  <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">
                      Color
                    </label>
                    <ColorSelect
                      selectedColor={currentPlayer.color}
                      takenColors={takenColors}
                      onSelect={selectColor}
                      disabled={currentPlayer.ready}
                    />
                  </div>

                  {currentPlayer.ready ? (
                    <PulseButton
                      onClick={handleReadyToggle}
                      color="amber"
                      fullWidth
                    >
                      Cancel Ready
                    </PulseButton>
                  ) : (
                    <ShieldButton
                      onClick={handleReadyToggle}
                      disabled={settings.miltyDraft ? !currentPlayer.color : (!currentPlayer.faction || !currentPlayer.color)}
                      color="emerald"
                      fullWidth
                    >
                      Ready Up
                    </ShieldButton>
                  )}

                  {settings.miltyDraft ? (
                    !currentPlayer.color ? (
                      <p className="text-sm text-slate-400 mt-2 text-center">
                        Select color to ready up
                      </p>
                    ) : null
                  ) : !currentPlayer.faction || !currentPlayer.color ? (
                    <p className="text-sm text-slate-400 mt-2 text-center">
                      Select faction and color to ready up
                    </p>
                  ) : null}
                </ThemedCard>
              )}

              {/* Start Game/Draft Button */}
              {isHost && (
                <CommandButton
                  onClick={settings.miltyDraft ? handleStartDraft : handleStartGame}
                  disabled={!canStart}
                  color={canStart ? 'emerald' : 'cyan'}
                  size="lg"
                  fullWidth
                >
                  {!allReady
                    ? players.length < 3
                      ? 'Need at least 3 players'
                      : 'Waiting for all players'
                    : settings.miltyDraft
                      ? 'Start Milty Draft'
                      : 'Start Game'}
                </CommandButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </ThemedBackground>
  );
}
