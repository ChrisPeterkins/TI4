'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ThemedBackground from '@/components/ui/ThemedBackground';
import { ThemedCard, ThemedBadge } from '@/components/ui/ThemedPanel';
import {
  PowerCoreButton,
  HoloBorderButton,
  PulseButton,
  GlassButton,
  WarpButton,
  NexusButton,
} from '@/components/ui/ThemedButton';

interface ActiveGame {
  gameId: string;
  round: number;
  phase: string;
  playerCount: number;
  myFaction: string;
  myPlayerId: string;
  isMyTurn: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ActiveLobby {
  id: string;
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  isHost: boolean;
  settings: {
    miltyDraft: boolean;
  };
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [activeLobbies, setActiveLobbies] = useState<ActiveLobby[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isLoadingLobbies, setIsLoadingLobbies] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoadingGames(true);
      fetch('/api/games/active')
        .then((res) => (res.ok ? res.json() : []))
        .then(setActiveGames)
        .catch(() => setActiveGames([]))
        .finally(() => setIsLoadingGames(false));

      setIsLoadingLobbies(true);
      fetch('/api/lobbies/my')
        .then((res) => (res.ok ? res.json() : []))
        .then(setActiveLobbies)
        .catch(() => setActiveLobbies([]))
        .finally(() => setIsLoadingLobbies(false));
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <ThemedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      </ThemedBackground>
    );
  }

  // Unauthenticated - Landing Page
  if (status === 'unauthenticated') {
    return (
      <ThemedBackground>
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-clip-text text-transparent">
              Twilight Imperium 4
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-12">
              The classic game of galactic conquest, now online.
              Build your empire, forge alliances, and dominate the galaxy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <PowerCoreButton color="cyan" size="lg">
                  Sign In
                </PowerCoreButton>
              </Link>
              <Link href="/register">
                <HoloBorderButton color="cyan" size="lg">
                  Create Account
                </HoloBorderButton>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl px-4">
            <FeatureCard
              title="Real-time Multiplayer"
              description="Play with 3-6 players online with live updates and synchronized game state."
              icon="globe"
            />
            <FeatureCard
              title="Full TI4 Rules"
              description="Complete implementation of Twilight Imperium 4th Edition with all factions."
              icon="book"
            />
            <FeatureCard
              title="Easy Lobby System"
              description="Create or join games with a simple code. Invite friends with one click."
              icon="users"
            />
          </div>
        </div>
      </ThemedBackground>
    );
  }

  // Authenticated - Dashboard
  return (
    <ThemedBackground>
      {/* Header */}
      <header className="border-b border-cyan-400/20 bg-black/30 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
            Twilight Imperium 4
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              {session?.user?.name || session?.user?.email}
            </span>
            <GlassButton
              onClick={() => signOut()}
              color="cyan"
              size="sm"
            >
              Sign Out
            </GlassButton>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => router.push('/lobby')}
            className="group p-8 rounded-xl bg-gradient-to-br from-cyan-900/40 to-cyan-950/60 border border-cyan-400/30 hover:border-cyan-400/60 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="text-4xl mb-3 text-cyan-400">+</div>
              <h2 className="text-2xl font-bold mb-2 text-white">Create Game</h2>
              <p className="text-cyan-200/70">
                Start a new lobby and invite friends to play
              </p>
            </div>
          </button>

          <button
            onClick={() => router.push('/lobby')}
            className="group p-8 rounded-xl bg-gradient-to-br from-purple-900/40 to-purple-950/60 border border-purple-400/30 hover:border-purple-400/60 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="text-4xl mb-3 text-purple-400">{">"}</div>
              <h2 className="text-2xl font-bold mb-2 text-white">Join Game</h2>
              <p className="text-purple-200/70">
                Enter a lobby code or browse public games
              </p>
            </div>
          </button>
        </div>

        {/* Active Games */}
        <section>
          <h2 className="text-xl font-semibold mb-4 text-cyan-300">Your Active Games</h2>
          {isLoadingGames ? (
            <div className="text-slate-400">Loading games...</div>
          ) : activeGames.length === 0 ? (
            <ThemedCard className="text-center py-8">
              <p className="text-slate-400 mb-6">No active games</p>
              <PowerCoreButton
                onClick={() => router.push('/lobby')}
                color="cyan"
              >
                Start Your First Game
              </PowerCoreButton>
            </ThemedCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGames.map((game) => (
                <div
                  key={game.gameId}
                  className={`p-6 rounded-xl transition-all text-left ${
                    game.isMyTurn
                      ? 'bg-emerald-900/30 border-2 border-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.2)]'
                      : 'bg-cyan-950/30 border border-cyan-400/20 hover:border-cyan-400/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">
                      Round {game.round}
                    </span>
                    <div className="flex items-center gap-2">
                      {game.isMyTurn && (
                        <ThemedBadge color="emerald" pulse>
                          Your Turn!
                        </ThemedBadge>
                      )}
                      <ThemedBadge color="amber">
                        {game.phase}
                      </ThemedBadge>
                    </div>
                  </div>
                  <div className="font-semibold mb-1 text-white capitalize">
                    {game.myFaction.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-slate-400 mb-4">
                    {game.playerCount} players
                  </div>
                  {game.isMyTurn ? (
                    <PulseButton
                      onClick={() => router.push(`/game/${game.gameId}`)}
                      color="emerald"
                      size="sm"
                      fullWidth
                    >
                      Play Now
                    </PulseButton>
                  ) : (
                    <GlassButton
                      onClick={() => router.push(`/game/${game.gameId}`)}
                      color="cyan"
                      size="sm"
                      fullWidth
                    >
                      View Game
                    </GlassButton>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active Lobbies */}
        {(isLoadingLobbies || activeLobbies.length > 0) && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-cyan-300">Your Active Lobbies</h2>
            {isLoadingLobbies ? (
              <div className="text-slate-400">Loading lobbies...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeLobbies.map((lobby) => (
                  <div
                    key={lobby.id}
                    className="p-6 rounded-xl bg-cyan-950/30 border border-cyan-400/20 hover:border-cyan-400/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-mono text-cyan-400">
                        {lobby.code}
                      </span>
                      <div className="flex items-center gap-2">
                        {lobby.isHost && (
                          <ThemedBadge color="purple">Host</ThemedBadge>
                        )}
                        {lobby.settings.miltyDraft && (
                          <ThemedBadge color="cyan">Milty Draft</ThemedBadge>
                        )}
                      </div>
                    </div>
                    <div className="font-semibold mb-1 text-white">
                      {lobby.hostName}&apos;s Lobby
                    </div>
                    <div className="text-sm text-slate-400 mb-4">
                      {lobby.playerCount}/{lobby.maxPlayers} players
                    </div>
                    <PulseButton
                      onClick={() => router.push(`/lobby/${lobby.id}`)}
                      color="cyan"
                      size="sm"
                      fullWidth
                    >
                      Rejoin
                    </PulseButton>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Dev Tools */}
        <section className="mt-12 pt-8 border-t border-cyan-400/20">
          <h2 className="text-sm font-medium text-slate-500 mb-3">Dev Tools</h2>
          <div className="flex gap-3">
            <Link href="/test/combat">
              <GlassButton color="cyan" size="sm">
                Combat Tester
              </GlassButton>
            </Link>
          </div>
        </section>
      </main>
    </ThemedBackground>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: 'globe' | 'book' | 'users';
}) {
  const icons = {
    globe: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    book: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    users: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  };

  return (
    <div className="p-6 bg-cyan-950/30 rounded-xl border border-cyan-400/20 backdrop-blur-sm">
      <div className="text-cyan-400 mb-4">{icons[icon]}</div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
