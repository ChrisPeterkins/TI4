'use client';

import { ThemedBadge } from '@/components/ui/ThemedPanel';
import { GlassButton, HexButton } from '@/components/ui/ThemedButton';

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

interface LobbyListProps {
  lobbies: PublicLobby[];
  isLoading: boolean;
  onJoin: (lobbyId: string) => void;
}

export default function LobbyList({ lobbies, isLoading, onJoin }: LobbyListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-slate-400">
        <div className="inline-block w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
        <div>Scanning for lobbies...</div>
      </div>
    );
  }

  if (lobbies.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-500 mb-2">No public lobbies available</div>
        <div className="text-sm text-slate-600">Create one to get started!</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lobbies.map((lobby) => (
        <div
          key={lobby.id}
          className="flex items-center justify-between p-4 rounded-lg bg-cyan-950/20 border border-cyan-400/20 hover:border-cyan-400/40 transition-all duration-300"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-lg font-bold text-cyan-400 tracking-wider">
                {lobby.code}
              </span>
              <span className="text-slate-400">
                hosted by <span className="text-cyan-300">{lobby.hostName}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400">
                <span className="text-cyan-300">{lobby.playerCount}</span>
                <span className="text-slate-500">/{lobby.maxPlayers}</span>
                {' players'}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                <span className="text-cyan-300">{lobby.settings.victoryPoints}</span>
                {' VP'}
              </span>
              {lobby.settings.miltyDraft && (
                <>
                  <span className="text-slate-500">•</span>
                  <ThemedBadge color="amber">Milty Draft</ThemedBadge>
                </>
              )}
              {lobby.settings.expansions.length > 0 && (
                <>
                  <span className="text-slate-500">•</span>
                  <ThemedBadge color="purple">
                    +{lobby.settings.expansions.length} exp
                  </ThemedBadge>
                </>
              )}
            </div>
          </div>
          {lobby.playerCount >= lobby.maxPlayers ? (
            <GlassButton
              disabled
              color="cyan"
              size="sm"
            >
              Full
            </GlassButton>
          ) : (
            <HexButton
              onClick={() => onJoin(lobby.id)}
              color="cyan"
              size="sm"
            >
              Join
            </HexButton>
          )}
        </div>
      ))}
    </div>
  );
}
