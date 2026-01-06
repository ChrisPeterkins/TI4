'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useLobbyStore } from '@/stores/lobby-store';
import { useTheme } from '@/contexts/ThemeContext';
import CreateLobbyModal from '@/components/lobby/CreateLobbyModal';
import LobbyList from '@/components/lobby/LobbyList';
import MyLobbies from '@/components/lobby/MyLobbies';
import ThemedBackground from '@/components/ui/ThemedBackground';
import ThemedPanel, { ThemedCard, ThemedBadge } from '@/components/ui/ThemedPanel';
import { PowerCoreButton, HexButton, GlassButton } from '@/components/ui/ThemedButton';

interface PublicLobby {
  id: string;
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  settings: {
    playerCount: number;
    victoryPoints: 10 | 12 | 14;
    expansions: string[];
    miltyDraft: boolean;
  };
}

export default function LobbyPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isConnected, isLoading: socketLoading, connectionError } = useSocket();
  const { lobbyId, isLoading: lobbyLoading, error: lobbyError, joinLobby } = useLobbyStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [lobbies, setLobbies] = useState<PublicLobby[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(true);

  // Redirect to lobby room if already in a lobby
  useEffect(() => {
    if (lobbyId) {
      router.push(`/lobby/${lobbyId}`);
    }
  }, [lobbyId, router]);

  // Fetch public lobbies
  useEffect(() => {
    async function fetchLobbies() {
      try {
        const response = await fetch('/api/lobbies');
        if (response.ok) {
          const data = await response.json();
          setLobbies(data);
        }
      } catch (err) {
        console.error('Failed to fetch lobbies:', err);
      } finally {
        setIsLoadingLobbies(false);
      }
    }

    if (isConnected) {
      fetchLobbies();
      // Refresh every 10 seconds
      const interval = setInterval(fetchLobbies, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const handleJoinByCode = async () => {
    if (joinCode.length === 6) {
      try {
        await joinLobby(joinCode.toUpperCase());
      } catch (err) {
        console.error('Failed to join lobby:', err);
      }
    }
  };

  const handleJoinLobby = async (lobbyId: string) => {
    try {
      await joinLobby(lobbyId);
    } catch (err) {
      console.error('Failed to join lobby:', err);
    }
  };

  if (socketLoading) {
    return (
      <ThemedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className={`text-xl ${theme.colors.textPrimary} mb-4`}>Connecting...</div>
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      </ThemedBackground>
    );
  }

  if (connectionError) {
    return (
      <ThemedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <ThemedPanel variant="error" glow className="p-8 text-center max-w-md">
            <div className="text-xl text-rose-400 mb-4">Connection Error</div>
            <div className={theme.colors.textMuted}>{connectionError}</div>
          </ThemedPanel>
        </div>
      </ThemedBackground>
    );
  }

  return (
    <ThemedBackground>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className={`text-4xl font-bold mb-8 bg-gradient-to-r from-white via-cyan-400 to-white bg-clip-text text-transparent`}>
            Game Lobby
          </h1>

          {/* Connection Status */}
          <div className="mb-6 flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected
                  ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                  : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
              }`}
            />
            <span className={theme.colors.textMuted}>
              {isConnected ? 'Connected to server' : 'Disconnected'}
            </span>
          </div>

          {/* Error Display */}
          {lobbyError && (
            <ThemedPanel variant="error" glow className="mb-6 p-4">
              <div className="flex items-center gap-2">
                <span className="text-rose-400">⚠</span>
                <span>{lobbyError}</span>
              </div>
            </ThemedPanel>
          )}

          {/* My Lobbies */}
          <MyLobbies />

          {/* Join by Code */}
          <ThemedCard title="Join by Code" className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="Enter 6-character code"
                className={`
                  flex-1 px-4 py-3
                  bg-cyan-950/30
                  border border-cyan-400/30
                  rounded-lg
                  text-white
                  placeholder-slate-500
                  focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]
                  uppercase font-mono text-lg tracking-wider
                  transition-all duration-300
                `}
                maxLength={6}
              />
              <HexButton
                onClick={handleJoinByCode}
                disabled={joinCode.length !== 6 || lobbyLoading}
                color="cyan"
              >
                {lobbyLoading ? 'Joining...' : 'Join'}
              </HexButton>
            </div>
          </ThemedCard>

          {/* Create Lobby Button */}
          <div className="mb-8">
            <PowerCoreButton
              onClick={() => setShowCreateModal(true)}
              disabled={!isConnected || lobbyLoading}
              color="emerald"
              size="lg"
              fullWidth
            >
              Create New Lobby
            </PowerCoreButton>
          </div>

          {/* Public Lobbies */}
          <ThemedCard title="Public Lobbies">
            <LobbyList
              lobbies={lobbies}
              isLoading={isLoadingLobbies}
              onJoin={handleJoinLobby}
            />
          </ThemedCard>

          {/* Create Lobby Modal */}
          {showCreateModal && (
            <CreateLobbyModal onClose={() => setShowCreateModal(false)} />
          )}
        </div>
      </div>
    </ThemedBackground>
  );
}
