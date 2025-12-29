'use client';

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
      <div className="text-center py-8 text-gray-400">
        Loading lobbies...
      </div>
    );
  }

  if (lobbies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No public lobbies available. Create one to get started!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lobbies.map((lobby) => (
        <div
          key={lobby.id}
          className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-blue-400">
                {lobby.code}
              </span>
              <span className="text-gray-300">
                hosted by {lobby.hostName}
              </span>
            </div>
            <div className="mt-1 text-sm text-gray-400 flex items-center gap-4">
              <span>
                {lobby.playerCount}/{lobby.maxPlayers} players
              </span>
              <span>
                {lobby.settings.victoryPoints} VP
              </span>
              {lobby.settings.miltyDraft && (
                <span className="text-yellow-400">Milty Draft</span>
              )}
              {lobby.settings.expansions.length > 0 && (
                <span className="text-purple-400">
                  +{lobby.settings.expansions.length} expansions
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => onJoin(lobby.id)}
            disabled={lobby.playerCount >= lobby.maxPlayers}
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {lobby.playerCount >= lobby.maxPlayers ? 'Full' : 'Join'}
          </button>
        </div>
      ))}
    </div>
  );
}
