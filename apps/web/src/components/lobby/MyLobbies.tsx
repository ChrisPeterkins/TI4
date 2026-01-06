'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemedCard, ThemedBadge } from '@/components/ui/ThemedPanel';
import { PulseButton } from '@/components/ui/ThemedButton';

interface MyLobby {
  id: string;
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  isHost: boolean;
  settings: {
    playerCount: number;
    victoryPoints: 10 | 12 | 14;
    expansions: string[];
    miltyDraft: boolean;
  };
}

export default function MyLobbies() {
  const router = useRouter();
  const [lobbies, setLobbies] = useState<MyLobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMyLobbies() {
      try {
        const response = await fetch('/api/lobbies/my');
        if (response.ok) {
          const data = await response.json();
          setLobbies(data);
        }
      } catch (error) {
        console.error('Failed to fetch my lobbies:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyLobbies();
  }, []);

  if (isLoading) {
    return (
      <ThemedCard title="My Lobbies" className="mb-8">
        <div className="text-slate-400 text-center py-4">Loading...</div>
      </ThemedCard>
    );
  }

  if (lobbies.length === 0) {
    return null;
  }

  return (
    <ThemedCard title="My Lobbies" className="mb-8">
      <div className="space-y-3">
        {lobbies.map((lobby) => (
          <div
            key={lobby.id}
            className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-lg text-cyan-400 tracking-wider">
                    {lobby.code}
                  </span>
                  {lobby.isHost && (
                    <ThemedBadge color="amber">Host</ThemedBadge>
                  )}
                </div>
                <div className="text-sm text-slate-400">
                  <span className="text-cyan-300">{lobby.playerCount}</span>
                  <span className="text-slate-500">/{lobby.maxPlayers}</span>
                  {' players • '}
                  <span className="text-cyan-300">{lobby.settings.victoryPoints}</span>
                  {' VP'}
                </div>
              </div>
              <PulseButton
                onClick={() => router.push(`/lobby/${lobby.id}`)}
                color="cyan"
                size="sm"
              >
                Rejoin
              </PulseButton>
            </div>
          </div>
        ))}
      </div>
    </ThemedCard>
  );
}
