// Hyperlanes - Prophecy of Kings special tiles
// Generated: 2025-09-01T17:23:43.233Z

export interface Hyperlane {
  id: number;
  tileCode: string;
  connections: string[]; // Connected tile positions
}

// Hyperlane tiles from PoK (tiles 83-91)
export const hyperlanes: Hyperlane[] = [
  { id: 83, tileCode: '83A/B', connections: [] },
  { id: 84, tileCode: '84A/B', connections: [] },
  { id: 85, tileCode: '85A/B', connections: [] },
  { id: 86, tileCode: '86A/B', connections: [] },
  { id: 87, tileCode: '87A/B', connections: [] },
  { id: 88, tileCode: '88A/B', connections: [] },
  { id: 89, tileCode: '89A/B', connections: [] },
  { id: 90, tileCode: '90A/B', connections: [] },
  { id: 91, tileCode: '91A/B', connections: [] }
];

export const isHyperlane = (tileCode: string): boolean => {
  return hyperlanes.some(h => h.tileCode === tileCode);
};
