import { useState, useEffect } from 'react';
import gameDataService from '../services/api/gameDataService';

// Generic hook for fetching game data
export function useGameData<T>(
  fetcher: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error, refetch: () => fetcher().then(setData) };
}

// Specific hooks for common data

export function useFactions() {
  return useGameData(
    async () => {
      const setup = await gameDataService.getGameSetupData();
      return setup.factions;
    },
    []
  );
}

export function useFactionDetails(factionId: string | null) {
  return useGameData(
    async () => {
      if (!factionId) return null;
      return gameDataService.getFactionData(factionId);
    },
    [factionId]
  );
}

export function usePublicObjectives() {
  return useGameData(
    () => gameDataService.getPublicObjectives(),
    []
  );
}

export function useStrategyCards() {
  return useGameData(
    () => gameDataService.getStrategyCards(),
    []
  );
}

export function useSystemTiles() {
  return useGameData(
    () => gameDataService.getSystemTiles(),
    []
  );
}

export function useReferenceData() {
  return useGameData(
    () => gameDataService.getReferenceData(),
    []
  );
}

export function usePublicGameState(gameId: string | null) {
  return useGameData(
    async () => {
      if (!gameId) return null;
      return gameDataService.getPublicGameState(gameId);
    },
    [gameId]
  );
}

export function usePlayerCards(gameId: string | null, playerId: string | null) {
  return useGameData(
    async () => {
      if (!gameId || !playerId) return null;
      return gameDataService.getPlayerCards(gameId, playerId);
    },
    [gameId, playerId]
  );
}