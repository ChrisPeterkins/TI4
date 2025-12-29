'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">My Lobbies</h2>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (lobbies.length === 0) {
    return null; // Don't show section if no lobbies
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">My Lobbies</h2>
      <div className="space-y-3">
        {lobbies.map((lobby) => (
          <Link
            key={lobby.id}
            href={`/lobby/${lobby.id}`}
            className="block p-4 bg-gray-700/50 rounded-lg border border-blue-500/50 hover:border-blue-400 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-blue-400">{lobby.code}</span>
                  {lobby.isHost && (
                    <span className="px-2 py-0.5 bg-yellow-600 text-xs rounded-full">
                      Host
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {lobby.playerCount}/{lobby.maxPlayers} players
                  {' • '}
                  {lobby.settings.victoryPoints} VP
                </div>
              </div>
              <div className="text-blue-400 text-sm">
                Rejoin →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
