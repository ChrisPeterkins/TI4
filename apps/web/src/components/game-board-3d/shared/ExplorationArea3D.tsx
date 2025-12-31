'use client';

import { Suspense } from 'react';
import { Text } from '@react-three/drei';
import { Deck3D } from '../cards/Deck3D';
import { getExplorationCardBackUrl } from '@/lib/assets';
import type { ExplorationDeckType } from './SharedElementsLayout3D';

// Exploration deck colors for visual distinction
const EXPLORATION_COLORS: Record<ExplorationDeckType, string> = {
  cultural: '#3b82f6',   // Blue
  industrial: '#22c55e', // Green
  hazardous: '#ef4444',  // Red
  frontier: '#f59e0b',   // Orange/Amber
};

// Spacing for 2x2 grid
const GRID_SPACING = 1.5;

export interface ExplorationDecks {
  cultural: string[];
  industrial: string[];
  hazardous: string[];
  frontier: string[];
}

export interface ExplorationArea3DProps {
  explorationDecks?: ExplorationDecks;
  onDraw?: (type: ExplorationDeckType) => void;
}

/**
 * ExplorationArea3D - South side area containing 4 exploration decks
 *
 * Layout (2x2 grid):
 *   [Cultural]    [Industrial]
 *   [Hazardous]   [Frontier]
 *
 * Each deck is color-coded and shows its card count.
 * Players draw from these during exploration when landing on planets.
 */
export function ExplorationArea3D({
  explorationDecks,
  onDraw,
}: ExplorationArea3DProps) {
  // Get deck counts with fallback to 0
  const culturalCount = explorationDecks?.cultural?.length ?? 0;
  const industrialCount = explorationDecks?.industrial?.length ?? 0;
  const hazardousCount = explorationDecks?.hazardous?.length ?? 0;
  const frontierCount = explorationDecks?.frontier?.length ?? 0;

  return (
    <group name="exploration-area">
      {/* Area title */}
      <Text
        position={[0, 0.5, -GRID_SPACING]}
        fontSize={0.2}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        EXPLORATION
      </Text>

      {/* 2x2 Grid of Exploration Decks */}

      {/* Top Row */}
      {/* Cultural (Blue) - Top Left */}
      <group position={[-GRID_SPACING / 2, 0, -GRID_SPACING / 2 + 0.3]}>
        <Suspense fallback={null}>
          <Deck3D
            cardCount={culturalCount}
            backTexture={getExplorationCardBackUrl('cultural')}
            position={[0, 0, 0]}
            label="Cultural"
            onDraw={() => onDraw?.('cultural')}
          />
        </Suspense>
        {/* Color indicator dot */}
        <mesh position={[0, 0.02, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={EXPLORATION_COLORS.cultural} />
        </mesh>
      </group>

      {/* Industrial (Green) - Top Right */}
      <group position={[GRID_SPACING / 2, 0, -GRID_SPACING / 2 + 0.3]}>
        <Suspense fallback={null}>
          <Deck3D
            cardCount={industrialCount}
            backTexture={getExplorationCardBackUrl('industrial')}
            position={[0, 0, 0]}
            label="Industrial"
            onDraw={() => onDraw?.('industrial')}
          />
        </Suspense>
        <mesh position={[0, 0.02, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={EXPLORATION_COLORS.industrial} />
        </mesh>
      </group>

      {/* Bottom Row */}
      {/* Hazardous (Red) - Bottom Left */}
      <group position={[-GRID_SPACING / 2, 0, GRID_SPACING / 2 + 0.3]}>
        <Suspense fallback={null}>
          <Deck3D
            cardCount={hazardousCount}
            backTexture={getExplorationCardBackUrl('hazardous')}
            position={[0, 0, 0]}
            label="Hazardous"
            onDraw={() => onDraw?.('hazardous')}
          />
        </Suspense>
        <mesh position={[0, 0.02, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={EXPLORATION_COLORS.hazardous} />
        </mesh>
      </group>

      {/* Frontier (Orange) - Bottom Right */}
      <group position={[GRID_SPACING / 2, 0, GRID_SPACING / 2 + 0.3]}>
        <Suspense fallback={null}>
          <Deck3D
            cardCount={frontierCount}
            backTexture={getExplorationCardBackUrl('frontier')}
            position={[0, 0, 0]}
            label="Frontier"
            onDraw={() => onDraw?.('frontier')}
          />
        </Suspense>
        <mesh position={[0, 0.02, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color={EXPLORATION_COLORS.frontier} />
        </mesh>
      </group>
    </group>
  );
}
