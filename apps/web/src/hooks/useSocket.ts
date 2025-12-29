'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSocketStore } from '../stores/socket-store';

/**
 * Fetch a signed JWT for socket authentication
 */
async function fetchSocketToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/socket-token');
    if (!response.ok) return null;
    const data = await response.json();
    return data.token;
  } catch {
    return null;
  }
}

/**
 * Hook to manage socket connection based on auth state
 */
export function useSocket() {
  const { data: session, status } = useSession();
  const { socket, isConnected, connectionError, connect, disconnect } = useSocketStore();
  const [tokenFetched, setTokenFetched] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !tokenFetched) {
      setTokenFetched(true);
      fetchSocketToken().then((token) => {
        if (token) {
          connect(token);
        }
      });
    }
  }, [status, session, tokenFetched, connect]);

  useEffect(() => {
    // Disconnect and reset when logged out
    if (status === 'unauthenticated') {
      disconnect();
      setTokenFetched(false);
    }
  }, [status, disconnect]);

  return {
    socket,
    isConnected,
    connectionError,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}
