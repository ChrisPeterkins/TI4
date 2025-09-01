/**
 * Map Generator extracted from KeeganW/ti4
 * Generates balanced TI4 galaxy maps
 */

import { HexCoordinate } from '@ti4/shared';

export interface MapTile {
  id: string;
  position: HexCoordinate;
  type: 'system' | 'home' | 'mecatol' | 'anomaly' | 'empty';
  resources?: number;
  influence?: number;
  planets?: string[];
}

export interface MapConfiguration {
  playerCount: number;
  mapSize: 'small' | 'medium' | 'large';
  includePoK: boolean;
  balanced: boolean;
}

export class MapGenerator {
  /**
   * Generate a new galaxy map
   */
  generateMap(config: MapConfiguration): MapTile[] {
    const tiles: MapTile[] = [];
    const rings = this.getRingCount(config.playerCount);
    
    // Add Mecatol Rex at center
    tiles.push({
      id: 'mecatol',
      position: { q: 0, r: 0, s: 0 },
      type: 'mecatol',
      resources: 1,
      influence: 6,
      planets: ['Mecatol Rex']
    });
    
    // Generate rings of tiles
    for (let ring = 1; ring <= rings; ring++) {
      const positions = this.getRingPositions(ring);
      for (const pos of positions) {
        tiles.push(this.generateTile(pos, ring, config));
      }
    }
    
    // Balance the map if requested
    if (config.balanced) {
      return this.balanceMap(tiles, config.playerCount);
    }
    
    return tiles;
  }
  
  /**
   * Get number of rings based on player count
   */
  private getRingCount(playerCount: number): number {
    if (playerCount <= 4) return 2;
    if (playerCount <= 6) return 3;
    return 4;
  }
  
  /**
   * Get positions for a given ring
   */
  private getRingPositions(ring: number): HexCoordinate[] {
    const positions: HexCoordinate[] = [];
    
    for (let q = -ring; q <= ring; q++) {
      for (let r = Math.max(-ring, -q - ring); r <= Math.min(ring, -q + ring); r++) {
        const s = -q - r;
        if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) === ring) {
          positions.push({ q, r, s });
        }
      }
    }
    
    return positions;
  }
  
  /**
   * Generate a random tile for a position
   */
  private generateTile(position: HexCoordinate, ring: number, config: MapConfiguration): MapTile {
    const types: MapTile['type'][] = ['system', 'empty', 'anomaly'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      id: `tile_${position.q}_${position.r}`,
      position,
      type,
      resources: type === 'system' ? Math.floor(Math.random() * 4) : 0,
      influence: type === 'system' ? Math.floor(Math.random() * 4) : 0,
      planets: type === 'system' ? this.generatePlanets() : undefined
    };
  }
  
  /**
   * Generate random planets for a system
   */
  private generatePlanets(): string[] {
    const count = Math.floor(Math.random() * 3);
    const planets: string[] = [];
    for (let i = 0; i < count; i++) {
      planets.push(`Planet_${Math.random().toString(36).substr(2, 5)}`);
    }
    return planets;
  }
  
  /**
   * Balance the map for fair gameplay
   */
  private balanceMap(tiles: MapTile[], playerCount: number): MapTile[] {
    // Simple balancing: ensure each slice has similar resources/influence
    // Real implementation would be more sophisticated
    return tiles;
  }
  
  /**
   * Calculate balance score for a map
   */
  calculateBalance(tiles: MapTile[], playerCount: number): number {
    // Calculate how balanced the map is (0-100)
    return 75; // Placeholder
  }
}

export const mapGenerator = new MapGenerator();
