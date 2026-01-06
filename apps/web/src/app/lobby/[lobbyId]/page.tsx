'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useLobbyStore } from '@/stores/lobby-store';
import LobbyRoom from '@/components/lobby/LobbyRoom';
import MiltyDraft from '@/components/lobby/MiltyDraft';

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
    isGameStarting,
    gameId,
    countdown,
    draftState,
    draftPlayerMapping,
    joinLobby,
    leaveLobby,
  } = useLobbyStore();

  const urlLobbyId = params.lobbyId as string;
  const currentUserId = session?.user?.id;

  // Local countdown state for visual display
  const [displayCountdown, setDisplayCountdown] = useState<number | null>(null);
  // Track when draft completed to show timeout error
  const [draftCompleteTime, setDraftCompleteTime] = useState<number | null>(null);
  const [draftCompleteTimeout, setDraftCompleteTimeout] = useState(false);

  // Join lobby if not already in it
  useEffect(() => {
    if (isConnected && !lobbyId && urlLobbyId) {
      joinLobby(urlLobbyId).catch(() => {
        router.push('/lobby');
      });
    }
  }, [isConnected, lobbyId, urlLobbyId, joinLobby, router]);

  // Track draft completion and set timeout
  useEffect(() => {
    if (draftState?.phase === 'complete' && !isGameStarting && !draftCompleteTime) {
      setDraftCompleteTime(Date.now());
    }
    // Clear when game starts or draft resets
    if (isGameStarting || !draftState || draftState.phase !== 'complete') {
      setDraftCompleteTime(null);
      setDraftCompleteTimeout(false);
    }
  }, [draftState?.phase, isGameStarting, draftCompleteTime]);

  // Poll for game creation when draft completes (in case game_starting event was missed)
  useEffect(() => {
    if (draftCompleteTime && !isGameStarting && lobbyId) {
      let isCancelled = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts over 15 seconds
      const pollInterval = 500;

      const checkForGame = async () => {
        if (isCancelled) return;

        try {
          const response = await fetch(`/api/lobbies/${lobbyId}/game`);
          if (response.ok) {
            const data = await response.json();
            if (data.gameId) {
              // Game was created! Redirect directly
              router.push(`/game/${data.gameId}`);
              return;
            }
          }
        } catch {
          // Ignore errors, will retry
        }

        attempts++;
        if (attempts < maxAttempts && !isCancelled) {
          setTimeout(checkForGame, pollInterval);
        } else if (!isCancelled) {
          setDraftCompleteTimeout(true);
        }
      };

      // Start polling after a short delay (give socket event a chance)
      const startTimer = setTimeout(checkForGame, 1000);

      return () => {
        isCancelled = true;
        clearTimeout(startTimer);
      };
    }
  }, [draftCompleteTime, isGameStarting, lobbyId, router]);

  // Track game verification state
  const [gameVerified, setGameVerified] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);

  // Verify game exists before allowing redirect
  useEffect(() => {
    if (isGameStarting && gameId && !gameVerified && !verificationFailed) {
      // Poll to verify game was created (with retries)
      let attempts = 0;
      const maxAttempts = 5;
      const pollInterval = 500; // 500ms between attempts

      const verifyGame = async () => {
        try {
          const response = await fetch(`/api/games/${gameId}/exists`);
          if (response.ok) {
            const data = await response.json();
            if (data.exists) {
              setGameVerified(true);
              return true;
            }
          }
        } catch {
          // Ignore fetch errors, will retry
        }
        return false;
      };

      const pollForGame = async () => {
        const exists = await verifyGame();
        if (exists) return;

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollForGame, pollInterval);
        } else {
          // Game didn't get created after max attempts
          setVerificationFailed(true);
        }
      };

      pollForGame();
    }
  }, [isGameStarting, gameId, gameVerified, verificationFailed]);

  // Countdown timer with visual decrement (only after game is verified)
  useEffect(() => {
    if (isGameStarting && gameId && countdown && gameVerified) {
      // Initialize display countdown
      setDisplayCountdown(countdown);

      // Decrement every second
      const interval = setInterval(() => {
        setDisplayCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Redirect when countdown reaches 0
      const redirectTimer = setTimeout(() => {
        router.push(`/game/${gameId}`);
      }, countdown * 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(redirectTimer);
      };
    }
  }, [isGameStarting, gameId, countdown, router, gameVerified]);

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

  // Errors are now handled via toast notifications

  if (!settings || !currentUserId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading lobby...</div>
      </div>
    );
  }

  // Game starting countdown
  if (isGameStarting) {
    // Verification failed - show error
    if (verificationFailed) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400 mb-4">
              Failed to Create Game
            </div>
            <div className="text-xl text-gray-300 mb-6">
              The game could not be created. Please try again.
            </div>
            <button
              onClick={() => router.push('/lobby')}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
            >
              Back to Lobby List
            </button>
          </div>
        </div>
      );
    }

    // Verifying game exists
    if (!gameVerified) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-4">
              Creating Game...
            </div>
            <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        </div>
      );
    }

    // Game verified, show countdown
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-4">
            Game Starting!
          </div>
          <div className="text-8xl font-bold text-white animate-pulse">
            {displayCountdown ?? countdown}
          </div>
        </div>
      </div>
    );
  }

  // Milty Draft mode - show draft UI while drafting
  if (draftState && draftState.phase === 'drafting') {
    return (
      <MiltyDraft
        draftState={draftState}
        players={players}
        currentUserId={currentUserId}
        playerMapping={draftPlayerMapping}
      />
    );
  }

  // Draft complete but game not started yet - show loading state
  if (draftState && draftState.phase === 'complete') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-400 mb-4">
            Draft Complete!
          </div>
          {draftCompleteTimeout ? (
            <>
              <div className="text-xl text-red-400 mb-4">
                Failed to start game. There may have been a server error.
              </div>
              <button
                onClick={() => router.push('/lobby')}
                className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 text-white"
              >
                Back to Lobby List
              </button>
            </>
          ) : (
            <>
              <div className="text-xl text-gray-300 mb-6">
                Setting up the game...
              </div>
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </>
          )}
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
