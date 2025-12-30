'use client';

import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { PlayerState } from '@ti4/shared';
import { PLAYER_COLORS_3D } from '../constants';

// LOD distance thresholds
const LOD_HIGH_DETAIL = 15; // Full detail within this distance
const LOD_MEDIUM_DETAIL = 30; // Medium detail within this distance
const LOD_LOW_DETAIL = 50; // Low detail within this distance

type LODLevel = 'high' | 'medium' | 'low' | 'minimal';

interface PlayerStationLODProps {
  player: PlayerState;
  position: THREE.Vector3;
  rotation: number;
  isActivePlayer: boolean;
  children: React.ReactNode; // High detail content
}

/**
 * Simplified player station for medium distance
 */
function MediumDetailStation({
  player,
  isActivePlayer,
}: {
  player: PlayerState;
  isActivePlayer: boolean;
}) {
  const playerColor = PLAYER_COLORS_3D[player.color];

  return (
    <group>
      {/* Simple base */}
      <mesh position={[0, 0, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial
          color={isActivePlayer ? playerColor : '#0a0a15'}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Player name */}
      <Text
        position={[0, 0.1, -0.5]}
        fontSize={0.25}
        color={playerColor}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {player.name}
      </Text>

      {/* Simple resource indicators */}
      <group position={[0, 0.05, 0.5]}>
        {/* Strategy card indicator */}
        {player.strategyCard && (
          <mesh position={[-1, 0, 0]}>
            <circleGeometry args={[0.3, 16]} />
            <meshStandardMaterial
              color={player.strategyCardUsed ? '#444' : playerColor}
            />
          </mesh>
        )}

        {/* VP indicator */}
        <mesh position={[1, 0, 0]}>
          <circleGeometry args={[0.25, 16]} />
          <meshStandardMaterial color="#7c3aed" />
        </mesh>
        <Text
          position={[1, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {player.score}
        </Text>
      </group>
    </group>
  );
}

/**
 * Very simplified station for far distance
 */
function LowDetailStation({
  player,
  isActivePlayer,
}: {
  player: PlayerState;
  isActivePlayer: boolean;
}) {
  const playerColor = PLAYER_COLORS_3D[player.color];

  return (
    <group>
      {/* Just a colored rectangle */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 2.5]} />
        <meshStandardMaterial
          color={isActivePlayer ? playerColor : '#1a1a2e'}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Player name only */}
      <Text
        position={[0, 0.05, 0]}
        fontSize={0.3}
        color={playerColor}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {player.name}
      </Text>
    </group>
  );
}

/**
 * Minimal marker for very far distance
 */
function MinimalStation({
  player,
  isActivePlayer,
}: {
  player: PlayerState;
  isActivePlayer: boolean;
}) {
  const playerColor = PLAYER_COLORS_3D[player.color];

  return (
    <mesh position={[0, 0.1, 0]}>
      <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
      <meshStandardMaterial
        color={playerColor}
        emissive={isActivePlayer ? playerColor : '#000000'}
        emissiveIntensity={isActivePlayer ? 0.5 : 0}
      />
    </mesh>
  );
}

/**
 * LOD wrapper for player stations
 * Automatically switches between detail levels based on camera distance
 */
export function PlayerStationLOD({
  player,
  position,
  rotation,
  isActivePlayer,
  children,
}: PlayerStationLODProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [lodLevel, setLodLevel] = useState<LODLevel>('high');
  const { camera } = useThree();

  // Check distance every few frames for performance
  useFrame(() => {
    if (!groupRef.current) return;

    const distance = camera.position.distanceTo(position);

    let newLevel: LODLevel;
    if (distance < LOD_HIGH_DETAIL) {
      newLevel = 'high';
    } else if (distance < LOD_MEDIUM_DETAIL) {
      newLevel = 'medium';
    } else if (distance < LOD_LOW_DETAIL) {
      newLevel = 'low';
    } else {
      newLevel = 'minimal';
    }

    if (newLevel !== lodLevel) {
      setLodLevel(newLevel);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position.toArray()}
      rotation={[0, rotation, 0]}
    >
      {lodLevel === 'high' && children}
      {lodLevel === 'medium' && (
        <MediumDetailStation player={player} isActivePlayer={isActivePlayer} />
      )}
      {lodLevel === 'low' && (
        <LowDetailStation player={player} isActivePlayer={isActivePlayer} />
      )}
      {lodLevel === 'minimal' && (
        <MinimalStation player={player} isActivePlayer={isActivePlayer} />
      )}
    </group>
  );
}

/**
 * Hook to get current LOD level based on distance
 */
export function useLODLevel(position: THREE.Vector3): LODLevel {
  const { camera } = useThree();
  const [level, setLevel] = useState<LODLevel>('high');

  useFrame(() => {
    const distance = camera.position.distanceTo(position);

    let newLevel: LODLevel;
    if (distance < LOD_HIGH_DETAIL) {
      newLevel = 'high';
    } else if (distance < LOD_MEDIUM_DETAIL) {
      newLevel = 'medium';
    } else if (distance < LOD_LOW_DETAIL) {
      newLevel = 'low';
    } else {
      newLevel = 'minimal';
    }

    if (newLevel !== level) {
      setLevel(newLevel);
    }
  });

  return level;
}

export const LOD_THRESHOLDS = {
  high: LOD_HIGH_DETAIL,
  medium: LOD_MEDIUM_DETAIL,
  low: LOD_LOW_DETAIL,
} as const;
