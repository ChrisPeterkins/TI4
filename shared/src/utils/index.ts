// Utility functions

/**
 * Calculate hex distance between two cubic coordinates
 */
export function hexDistance(a: { q: number; r: number; s: number }, b: { q: number; r: number; s: number }): number {
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs(a.s - b.s)
  );
}

/**
 * Check if two hex coordinates are adjacent
 */
export function areHexesAdjacent(a: { q: number; r: number; s: number }, b: { q: number; r: number; s: number }): boolean {
  return hexDistance(a, b) === 1;
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}