import type {
  GameSetupData,
  GameReferenceData,
  PublicGameData,
  PlayerCards,
  FactionLeaders,
  PlayerTechnologies,
  Faction,
  ObjectiveCard,
  StrategyCard,
  SystemTile,
  Technology
} from '@ti4/shared';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class GameDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Helper method for fetching with cache
  private async fetchWithCache<T>(url: string, cacheKey?: string): Promise<T> {
    const key = cacheKey || url;
    
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }

    // Fetch from API
    const response = await fetch(`${API_BASE_URL}${url}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Update cache
    this.cache.set(key, { data, timestamp: Date.now() });
    
    return data as T;
  }

  // Clear cache (useful when game state changes)
  clearCache() {
    this.cache.clear();
  }

  // Public data endpoints (no auth required)

  async getGameSetupData(): Promise<GameSetupData> {
    return this.fetchWithCache<GameSetupData>('/data/setup', 'setup');
  }

  async getReferenceData(): Promise<GameReferenceData> {
    return this.fetchWithCache<GameReferenceData>('/data/reference', 'reference');
  }

  async getFactionData(factionId: string): Promise<{
    faction: Faction;
    leaders: FactionLeaders;
    technologies: Technology[];
  }> {
    return this.fetchWithCache(`/data/faction/${factionId}`, `faction-${factionId}`);
  }

  async getPublicObjectives(): Promise<ObjectiveCard[]> {
    return this.fetchWithCache<ObjectiveCard[]>('/data/objectives/public', 'public-objectives');
  }

  async getStrategyCards(): Promise<StrategyCard[]> {
    return this.fetchWithCache<StrategyCard[]>('/data/strategy-cards', 'strategy-cards');
  }

  async getSystemTiles(): Promise<SystemTile[]> {
    return this.fetchWithCache<SystemTile[]>('/data/tiles/systems', 'system-tiles');
  }

  // Game-specific endpoints (may require auth)

  async getPublicGameState(gameId: string): Promise<PublicGameData> {
    // Don't cache game state as it changes frequently
    const response = await fetch(`${API_BASE_URL}/data/game/${gameId}/public`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async getPlayerCards(gameId: string, playerId: string): Promise<PlayerCards> {
    // Don't cache player cards as they change frequently
    const response = await fetch(
      `${API_BASE_URL}/data/game/${gameId}/player/${playerId}/cards`,
      {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async getPlayerTechnologies(gameId: string, playerId: string): Promise<PlayerTechnologies> {
    const response = await fetch(
      `${API_BASE_URL}/data/game/${gameId}/player/${playerId}/technologies`,
      {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  // Helper method to get auth token (implement based on your auth system)
  private getAuthToken(): string {
    // TODO: Get from localStorage, Redux store, or context
    return localStorage.getItem('authToken') || '';
  }

  // Preload commonly used data
  async preloadCommonData(): Promise<void> {
    await Promise.all([
      this.getGameSetupData(),
      this.getReferenceData(),
      this.getPublicObjectives(),
      this.getStrategyCards()
    ]);
  }
}

// Export singleton instance
export const gameDataService = new GameDataService();
export default gameDataService;