'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useLobbyStore } from '@/stores/lobby-store';
import CreateLobbyModal from '@/components/lobby/CreateLobbyModal';
import LobbyList from '@/components/lobby/LobbyList';
import MyLobbies from '@/components/lobby/MyLobbies';

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Connecting...</div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Connection Error</div>
          <div className="text-gray-400">{connectionError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Game Lobby</h1>

        {/* Connection Status */}
        <div className="mb-6 flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Error Display */}
        {lobbyError && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            {lobbyError}
          </div>
        )}

        {/* My Lobbies */}
        <MyLobbies />

        {/* Join by Code */}
        <div className="mb-8 p-6 bg-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Join by Code</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="Enter 6-character code"
              className="flex-1 px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none uppercase"
              maxLength={6}
            />
            <button
              onClick={handleJoinByCode}
              disabled={joinCode.length !== 6 || lobbyLoading}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {lobbyLoading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>

        {/* Create Lobby Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!isConnected || lobbyLoading}
            className="w-full py-4 bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 text-lg font-semibold"
          >
            Create New Lobby
          </button>
        </div>

        {/* Public Lobbies */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Public Lobbies</h2>
          <LobbyList
            lobbies={lobbies}
            isLoading={isLoadingLobbies}
            onJoin={handleJoinLobby}
          />
        </div>

        {/* Create Lobby Modal */}
        {showCreateModal && (
          <CreateLobbyModal onClose={() => setShowCreateModal(false)} />
        )}
      </div>
    </div>
  );
}
