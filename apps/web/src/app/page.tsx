'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface ActiveGame {
  gameId: string;
  round: number;
  phase: string;
  playerCount: number;
  myFaction: string;
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);

  // Fetch active games for authenticated users
  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoadingGames(true);
      fetch('/api/games/active')
        .then((res) => (res.ok ? res.json() : []))
        .then(setActiveGames)
        .catch(() => setActiveGames([]))
        .finally(() => setIsLoadingGames(false));
    }
  }, [status]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Unauthenticated - Landing Page
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Twilight Imperium 4
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              The classic game of galactic conquest, now online.
              Build your empire, forge alliances, and dominate the galaxy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-lg font-semibold transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl px-4">
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
      </div>
    );
  }

  // Authenticated - Dashboard
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Twilight Imperium 4</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              {session?.user?.name || session?.user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <button
            onClick={() => router.push('/lobby')}
            className="p-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl hover:from-blue-500 hover:to-blue-700 transition-all text-left group"
          >
            <div className="text-3xl mb-2">+</div>
            <h2 className="text-2xl font-bold mb-2">Create Game</h2>
            <p className="text-blue-200">
              Start a new lobby and invite friends to play
            </p>
          </button>

          <button
            onClick={() => router.push('/lobby')}
            className="p-8 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl hover:from-purple-500 hover:to-purple-700 transition-all text-left group"
          >
            <div className="text-3xl mb-2">{">"}</div>
            <h2 className="text-2xl font-bold mb-2">Join Game</h2>
            <p className="text-purple-200">
              Enter a lobby code or browse public games
            </p>
          </button>
        </div>

        {/* Active Games */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Your Active Games</h2>
          {isLoadingGames ? (
            <div className="text-gray-400">Loading games...</div>
          ) : activeGames.length === 0 ? (
            <div className="p-8 bg-gray-800/50 rounded-xl text-center">
              <p className="text-gray-400 mb-4">No active games</p>
              <button
                onClick={() => router.push('/lobby')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Start Your First Game
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGames.map((game) => (
                <button
                  key={game.gameId}
                  onClick={() => router.push(`/game/${game.gameId}`)}
                  className="p-6 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-400">
                      Round {game.round}
                    </span>
                    <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs">
                      {game.phase}
                    </span>
                  </div>
                  <div className="font-semibold mb-1 capitalize">
                    {game.myFaction}
                  </div>
                  <div className="text-sm text-gray-400">
                    {game.playerCount} players
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Dev Tools */}
        <section className="mt-12 pt-8 border-t border-gray-800">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Dev Tools</h2>
          <div className="flex gap-3">
            <Link
              href="/test/combat"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            >
              Combat Tester
            </Link>
          </div>
        </section>
      </main>
    </div>
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
    <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
      <div className="text-blue-400 mb-4">{icons[icon]}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
