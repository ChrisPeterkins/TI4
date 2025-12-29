'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useLobbyStore } from '@/stores/lobby-store';
import LobbyRoom from '@/components/lobby/LobbyRoom';

export default function LobbyRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { isConnected, isLoading: socketLoading } = useSocket();
  const {
    lobbyId,
    code,
    settings,
    players,
    isLoading,
    error,
    isGameStarting,
    gameId,
    countdown,
    joinLobby,
    leaveLobby,
  } = useLobbyStore();

  const urlLobbyId = params.lobbyId as string;
  const currentUserId = session?.user?.id;

  // Join lobby if not already in it
  useEffect(() => {
    if (isConnected && !lobbyId && urlLobbyId) {
      joinLobby(urlLobbyId).catch(() => {
        router.push('/lobby');
      });
    }
  }, [isConnected, lobbyId, urlLobbyId, joinLobby, router]);

  // Redirect to game when starting
  useEffect(() => {
    if (isGameStarting && gameId) {
      const timer = setTimeout(() => {
        router.push(`/game/${gameId}`);
      }, (countdown || 3) * 1000);
      return () => clearTimeout(timer);
    }
  }, [isGameStarting, gameId, countdown, router]);

  // Handle leaving lobby
  const handleLeaveLobby = () => {
    leaveLobby();
    router.push('/lobby');
  };

  if (socketLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">
          {socketLoading ? 'Connecting...' : 'Joining lobby...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error</div>
          <div className="text-gray-400 mb-6">{error}</div>
          <button
            onClick={() => router.push('/lobby')}
            className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Lobby List
          </button>
        </div>
      </div>
    );
  }

  if (!settings || !currentUserId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading lobby...</div>
      </div>
    );
  }

  // Game starting countdown
  if (isGameStarting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-4">
            Game Starting!
          </div>
          <div className="text-8xl font-bold text-white animate-pulse">
            {countdown}
          </div>
        </div>
      </div>
    );
  }

  return (
    <LobbyRoom
      lobbyId={lobbyId!}
      code={code!}
      settings={settings}
      players={players}
      currentUserId={currentUserId}
      onLeave={handleLeaveLobby}
    />
  );
}
