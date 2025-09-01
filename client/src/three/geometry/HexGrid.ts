/**
 * Hexagonal Grid System adapted from von-grid
 * Provides hexagonal grid mathematics and pathfinding
 */

export interface HexCoordinate {
  q: number; // Column
  r: number; // Row  
  s: number; // s = -q - r (cubic coordinate constraint)
}

export interface HexTile {
  position: HexCoordinate;
  walkable: boolean;
  cost: number;
}

export class HexGrid {
  private tiles: Map<string, HexTile> = new Map();
  
  /**
   * Add a tile to the grid
   */
  addTile(tile: HexTile): void {
    const key = this.getKey(tile.position);
    this.tiles.set(key, tile);
  }
  
  /**
   * Get a tile from the grid
   */
  getTile(position: HexCoordinate): HexTile | undefined {
    return this.tiles.get(this.getKey(position));
  }
  
  /**
   * Get unique key for a position
   */
  private getKey(pos: HexCoordinate): string {
    return `${pos.q},${pos.r},${pos.s}`;
  }
  
  /**
   * Calculate distance between two hexes
   */
  distance(a: HexCoordinate, b: HexCoordinate): number {
    return Math.max(
      Math.abs(a.q - b.q),
      Math.abs(a.r - b.r),
      Math.abs(a.s - b.s)
    );
  }
  
  /**
   * Get all neighbors of a hex
   */
  getNeighbors(position: HexCoordinate): HexCoordinate[] {
    const directions = [
      { q: 1, r: 0, s: -1 },
      { q: 1, r: -1, s: 0 },
      { q: 0, r: -1, s: 1 },
      { q: -1, r: 0, s: 1 },
      { q: -1, r: 1, s: 0 },
      { q: 0, r: 1, s: -1 },
    ];
    
    return directions.map(dir => ({
      q: position.q + dir.q,
      r: position.r + dir.r,
      s: position.s + dir.s,
    }));
  }
  
  /**
   * Find path between two hexes using A*
   */
  findPath(start: HexCoordinate, end: HexCoordinate): HexCoordinate[] {
    const openSet = new Set<string>([this.getKey(start)]);
    const cameFrom = new Map<string, HexCoordinate>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    
    gScore.set(this.getKey(start), 0);
    fScore.set(this.getKey(start), this.distance(start, end));
    
    while (openSet.size > 0) {
      // Get node with lowest fScore
      let current: HexCoordinate | null = null;
      let lowestF = Infinity;
      
      for (const key of openSet) {
        const f = fScore.get(key) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          const [q, r, s] = key.split(',').map(Number);
          current = { q, r, s };
        }
      }
      
      if (!current) break;
      
      if (this.getKey(current) === this.getKey(end)) {
        // Reconstruct path
        const path: HexCoordinate[] = [];
        let node: HexCoordinate | undefined = current;
        
        while (node) {
          path.unshift(node);
          node = cameFrom.get(this.getKey(node));
        }
        
        return path;
      }
      
      openSet.delete(this.getKey(current));
      
      // Check neighbors
      for (const neighbor of this.getNeighbors(current)) {
        const tile = this.getTile(neighbor);
        if (!tile || !tile.walkable) continue;
        
        const tentativeG = (gScore.get(this.getKey(current)) || 0) + tile.cost;
        const neighborKey = this.getKey(neighbor);
        
        if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          fScore.set(neighborKey, tentativeG + this.distance(neighbor, end));
          openSet.add(neighborKey);
        }
      }
    }
    
    return []; // No path found
  }
  
  /**
   * Get all hexes within range
   */
  getHexesInRange(center: HexCoordinate, range: number): HexCoordinate[] {
    const hexes: HexCoordinate[] = [];
    
    for (let q = -range; q <= range; q++) {
      for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
        const s = -q - r;
        hexes.push({
          q: center.q + q,
          r: center.r + r,
          s: center.s + s,
        });
      }
    }
    
    return hexes;
  }
  
  /**
   * Convert hex to pixel coordinates
   */
  hexToPixel(hex: HexCoordinate, size: number = 50): { x: number; y: number } {
    const x = size * (3/2 * hex.q);
    const y = size * (Math.sqrt(3)/2 * hex.q + Math.sqrt(3) * hex.r);
    return { x, y };
  }
  
  /**
   * Convert pixel to hex coordinates
   */
  pixelToHex(x: number, y: number, size: number = 50): HexCoordinate {
    const q = (2/3 * x) / size;
    const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;
    const s = -q - r;
    
    // Round to nearest hex
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);
    
    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);
    
    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    } else {
      rs = -rq - rr;
    }
    
    return { q: rq, r: rr, s: rs };
  }
}

export const hexGrid = new HexGrid();
