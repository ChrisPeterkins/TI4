'use client';

import { useMemo, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { ObjectiveState, ObjectiveInstance, PlayerState } from '@ti4/shared';
import { STAGE_I_OBJECTIVES, STAGE_II_OBJECTIVES } from '@ti4/shared';
import { Card3D, CARD_DIMENSIONS } from './Card3D';
import { Deck3D } from './Deck3D';
import {
  getCardUrl,
  getObjectiveCardBackUrl,
} from '@/lib/assets';

// Spacing between cards
const CARD_SPACING = CARD_DIMENSIONS.width + 0.15;
const ROW_SPACING = CARD_DIMENSIONS.height + 0.3;

// Fallback texture for when card images fail to load
const FALLBACK_TEXTURE = '/images/card-backs/objective_stage1.png';

export interface ObjectiveDisplay3DProps {
  objectives: ObjectiveState;
  players: PlayerState[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  onObjectiveClick?: (objectiveId: string, type: 'stage1' | 'stage2') => void;
  canScoreObjective?: (objectiveId: string) => boolean;
  currentPlayerId?: string;
}

/**
 * 3D display for public objectives
 * Shows Stage I and Stage II objectives as card rows with decks
 */
export function ObjectiveDisplay3D({
  objectives,
  players,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onObjectiveClick,
  canScoreObjective,
  currentPlayerId,
}: ObjectiveDisplay3DProps) {
  const [hoveredObjective, setHoveredObjective] = useState<string | null>(null);

  // Get objective data by ID
  const getObjectiveData = (id: string, type: 'stage1' | 'stage2') => {
    const list = type === 'stage1' ? STAGE_I_OBJECTIVES : STAGE_II_OBJECTIVES;
    return list.find((obj) => obj.id === id);
  };

  // Calculate revealed vs unrevealed objectives
  const stageIRevealed = objectives.publicStageI.filter((obj) => obj.revealed);
  const stageIUnrevealed = objectives.publicStageI.filter((obj) => !obj.revealed);
  const stageIIRevealed = objectives.publicStageII.filter((obj) => obj.revealed);
  const stageIIUnrevealed = objectives.publicStageII.filter((obj) => !obj.revealed);

  // Get player colors for scoring indicators
  const getPlayerColor = (playerId: string): string => {
    const player = players.find((p) => p.id === playerId);
    return player?.color || '#808080';
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Stage I Row Label */}
      <Html position={[-3, 0.3, 0]} center>
        <div className="text-blue-400 text-sm font-bold bg-black/70 px-2 py-1 rounded whitespace-nowrap">
          Stage I Objectives
        </div>
      </Html>

      {/* Stage I Deck (unrevealed cards) */}
      <Suspense fallback={null}>
        <Deck3D
          cardCount={stageIUnrevealed.length}
          backTexture={getObjectiveCardBackUrl('stage1')}
          position={[-2.5, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          label={`${stageIUnrevealed.length} remaining`}
          disabled
        />
      </Suspense>

      {/* Stage I Revealed Cards */}
      {stageIRevealed.map((objective, index) => (
        <ObjectiveCard3D
          key={objective.id}
          objective={objective}
          type="stage1"
          position={[-1.5 + index * CARD_SPACING, 0, 0]}
          players={players}
          isHovered={hoveredObjective === objective.id}
          canScore={canScoreObjective?.(objective.id) ?? false}
          currentPlayerId={currentPlayerId}
          onClick={() => onObjectiveClick?.(objective.id, 'stage1')}
          onHover={(hovered) =>
            setHoveredObjective(hovered ? objective.id : null)
          }
        />
      ))}

      {/* Stage II Row Label */}
      <Html position={[-3, 0.3, -ROW_SPACING]} center>
        <div className="text-purple-400 text-sm font-bold bg-black/70 px-2 py-1 rounded whitespace-nowrap">
          Stage II Objectives
        </div>
      </Html>

      {/* Stage II Deck (unrevealed cards) */}
      <Suspense fallback={null}>
        <Deck3D
          cardCount={stageIIUnrevealed.length}
          backTexture={getObjectiveCardBackUrl('stage2')}
          position={[-2.5, 0, -ROW_SPACING]}
          rotation={[-Math.PI / 2, 0, 0]}
          label={`${stageIIUnrevealed.length} remaining`}
          disabled
        />
      </Suspense>

      {/* Stage II Revealed Cards */}
      {stageIIRevealed.map((objective, index) => (
        <ObjectiveCard3D
          key={objective.id}
          objective={objective}
          type="stage2"
          position={[-1.5 + index * CARD_SPACING, 0, -ROW_SPACING]}
          players={players}
          isHovered={hoveredObjective === objective.id}
          canScore={canScoreObjective?.(objective.id) ?? false}
          currentPlayerId={currentPlayerId}
          onClick={() => onObjectiveClick?.(objective.id, 'stage2')}
          onHover={(hovered) =>
            setHoveredObjective(hovered ? objective.id : null)
          }
        />
      ))}
    </group>
  );
}

interface ObjectiveCard3DProps {
  objective: ObjectiveInstance;
  type: 'stage1' | 'stage2';
  position: [number, number, number];
  players: PlayerState[];
  isHovered: boolean;
  canScore: boolean;
  currentPlayerId?: string;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

/**
 * Individual 3D objective card with scoring indicators
 */
function ObjectiveCard3D({
  objective,
  type,
  position,
  players,
  isHovered,
  canScore,
  currentPlayerId,
  onClick,
  onHover,
}: ObjectiveCard3DProps) {
  // Get objective data
  const objectiveData = useMemo(() => {
    const list = type === 'stage1' ? STAGE_I_OBJECTIVES : STAGE_II_OBJECTIVES;
    return list.find((obj) => obj.id === objective.id);
  }, [objective.id, type]);

  // Get front texture URL
  const frontTexture = useMemo(() => {
    return getCardUrl('objective', objective.id);
  }, [objective.id]);

  // Get back texture URL
  const backTexture = useMemo(() => {
    return getObjectiveCardBackUrl(type);
  }, [type]);

  // Check if current player has scored
  const hasCurrentPlayerScored = Boolean(
    currentPlayerId && objective.scoredBy.includes(currentPlayerId)
  );

  // Highlight color based on state
  const highlightColor = useMemo(() => {
    if (hasCurrentPlayerScored) return '#22c55e'; // Green - already scored
    if (canScore) return '#3b82f6'; // Blue - can score
    if (isHovered) return '#6b7280'; // Gray - just hovering
    return '#4488ff';
  }, [hasCurrentPlayerScored, canScore, isHovered]);

  return (
    <group position={position}>
      <Suspense fallback={<ObjectiveCardPlaceholder type={type} />}>
        <Card3D
          frontTexture={frontTexture}
          backTexture={backTexture}
          position={[0, CARD_DIMENSIONS.depth / 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          faceUp={objective.revealed}
          highlighted={isHovered || canScore || hasCurrentPlayerScored}
          highlightColor={highlightColor}
          onClick={canScore ? onClick : undefined}
          onHover={onHover}
          disabled={!canScore}
        />
      </Suspense>

      {/* Scoring indicators - show player tokens who scored */}
      {objective.scoredBy.length > 0 && (
        <ScoringIndicators
          scoredBy={objective.scoredBy}
          players={players}
          position={[0, 0.1, CARD_DIMENSIONS.height / 2 + 0.1]}
        />
      )}

      {/* Hover tooltip */}
      {isHovered && objectiveData && (
        <Html position={[0, 0.5, 0]} center>
          <ObjectiveTooltip
            objective={objectiveData}
            scoredBy={objective.scoredBy}
            players={players}
            canScore={canScore}
          />
        </Html>
      )}

      {/* "Can Score" indicator */}
      {canScore && !hasCurrentPlayerScored && (
        <Html position={[0, 0.15, 0]} center>
          <div className="animate-pulse text-xs font-bold text-blue-400 bg-black/80 px-2 py-1 rounded">
            Click to Score
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Placeholder shown while card texture loads
 */
function ObjectiveCardPlaceholder({ type }: { type: 'stage1' | 'stage2' }) {
  const color = type === 'stage1' ? '#3b82f6' : '#8b5cf6';

  return (
    <mesh
      position={[0, CARD_DIMENSIONS.depth / 2, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <boxGeometry
        args={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, CARD_DIMENSIONS.depth]}
      />
      <meshStandardMaterial color={color} opacity={0.5} transparent />
    </mesh>
  );
}

interface ScoringIndicatorsProps {
  scoredBy: string[];
  players: PlayerState[];
  position: [number, number, number];
}

/**
 * Small colored circles showing which players have scored
 */
function ScoringIndicators({
  scoredBy,
  players,
  position,
}: ScoringIndicatorsProps) {
  const indicatorSize = 0.06;
  const spacing = indicatorSize * 2.5;
  const startX = -((scoredBy.length - 1) * spacing) / 2;

  return (
    <group position={position}>
      {scoredBy.map((playerId, index) => {
        const player = players.find((p) => p.id === playerId);
        const color = player?.color || '#808080';

        return (
          <mesh
            key={playerId}
            position={[startX + index * spacing, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[indicatorSize, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

interface ObjectiveTooltipProps {
  objective: { id: string; name: string; description: string; points: number };
  scoredBy: string[];
  players: PlayerState[];
  canScore: boolean;
}

/**
 * Tooltip showing objective details
 */
function ObjectiveTooltip({
  objective,
  scoredBy,
  players,
  canScore,
}: ObjectiveTooltipProps) {
  return (
    <div className="pointer-events-none w-64 p-3 bg-gray-900/95 border border-gray-700 rounded-lg shadow-xl">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-white text-sm">{objective.name}</h4>
        <span className="text-yellow-400 font-bold text-sm">
          {objective.points} VP
        </span>
      </div>
      <p className="text-gray-400 text-xs mb-2">{objective.description}</p>

      {scoredBy.length > 0 && (
        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="text-xs text-gray-500 mb-1">Scored by:</div>
          <div className="flex flex-wrap gap-1">
            {scoredBy.map((playerId) => {
              const player = players.find((p) => p.id === playerId);
              return (
                <span
                  key={playerId}
                  className="px-2 py-0.5 rounded text-xs"
                  style={{
                    backgroundColor: player?.color || '#808080',
                    color: '#fff',
                  }}
                >
                  {player?.name || 'Unknown'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {canScore && (
        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="text-blue-400 text-xs font-medium">
            ✓ You can score this objective
          </div>
        </div>
      )}
    </div>
  );
}

export default ObjectiveDisplay3D;
