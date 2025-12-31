'use client';

import { Suspense } from 'react';
import { Text } from '@react-three/drei';
import type { ObjectiveState, PlayerState } from '@ti4/shared';
import { ObjectiveDisplay3D } from '../cards/ObjectiveDisplay3D';
import { Deck3D } from '../cards/Deck3D';
import { getSecretObjectiveCardBackUrl } from '@/lib/assets';

export interface ObjectivesArea3DProps {
  objectives: ObjectiveState;
  players: PlayerState[];
  currentPlayerId?: string;
  onObjectiveClick?: (objectiveId: string, type: 'stage1' | 'stage2') => void;
  canScoreObjective?: (objectiveId: string) => boolean;
  onSecretDeckDraw?: () => void;
}

/**
 * ObjectivesArea3D - North side area containing all objectives
 *
 * Layout:
 *   [Public Objectives Display (Stage I & II)]   [Secret Deck]
 *
 * Integrates the existing ObjectiveDisplay3D component and adds
 * a Secret Objective deck for drawing during status phase.
 */
export function ObjectivesArea3D({
  objectives,
  players,
  currentPlayerId,
  onObjectiveClick,
  canScoreObjective,
  onSecretDeckDraw,
}: ObjectivesArea3DProps) {
  // Calculate secret deck count
  const secretDeckCount = objectives.secretDeck?.length ?? 0;

  return (
    <group name="objectives-area">
      {/* Area title */}
      <Text
        position={[0, 0.5, -2]}
        fontSize={0.2}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        OBJECTIVES
      </Text>

      {/* Public Objectives Display (existing component) */}
      <Suspense fallback={null}>
        <ObjectiveDisplay3D
          objectives={objectives}
          players={players}
          position={[-1.5, 0, 0]}
          currentPlayerId={currentPlayerId}
          onObjectiveClick={onObjectiveClick}
          canScoreObjective={canScoreObjective}
        />
      </Suspense>

      {/* Secret Objective Deck (on the right side) */}
      <group position={[5, 0, 0]}>
        <Suspense fallback={null}>
          <Deck3D
            cardCount={secretDeckCount}
            backTexture={getSecretObjectiveCardBackUrl()}
            position={[0, 0, 0]}
            label="Secrets"
            onDraw={onSecretDeckDraw}
          />
        </Suspense>
        <Text
          position={[0, 0.02, 0.8]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.1}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          Secret Objectives
        </Text>
      </group>
    </group>
  );
}
