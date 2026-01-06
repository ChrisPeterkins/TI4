'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemedBackground from '@/components/ui/ThemedBackground';
import ThemedPanel from '@/components/ui/ThemedPanel';
import { PowerCoreButton } from '@/components/ui/ThemedButton';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/lobby');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ThemedPanel glow className="p-8">
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-white via-cyan-400 to-white bg-clip-text text-transparent">
              Sign In
            </h1>
            <p className="text-center text-slate-400 mb-8">
              Welcome back to TI4 Online
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <ThemedPanel variant="error" className="mb-6 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-rose-400">⚠</span>
                    <span className="text-rose-300">{error}</span>
                  </div>
                </ThemedPanel>
              )}

              <div className="mb-5">
                <label htmlFor="email" className="block text-cyan-200 mb-2 text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    w-full px-4 py-3
                    bg-cyan-950/30
                    border border-cyan-400/30
                    rounded-lg
                    text-white
                    placeholder-slate-500
                    focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]
                    transition-all duration-300
                  "
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-cyan-200 mb-2 text-sm font-medium">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full px-4 py-3
                    bg-cyan-950/30
                    border border-cyan-400/30
                    rounded-lg
                    text-white
                    placeholder-slate-500
                    focus:outline-none focus:border-cyan-400/60 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)]
                    transition-all duration-300
                  "
                  placeholder="••••••••"
                  required
                />
              </div>

              <PowerCoreButton
                type="submit"
                disabled={isLoading}
                color="cyan"
                size="lg"
                fullWidth
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </PowerCoreButton>

              <p className="mt-6 text-center text-slate-400">
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Register
                </Link>
              </p>
            </form>
          </ThemedPanel>
        </div>
      </div>
    </ThemedBackground>
  );
}
