'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { PLAYER_COLORS_3D } from '../constants';
import type { PlayerColor } from '@ti4/shared';

// VP track dimensions
const TRACK_WIDTH = 1.2;
const TRACK_HEIGHT = 0.4;
const TRACK_DEPTH = 0.01;

const MARKER_RADIUS = 0.08;
const MARKER_HEIGHT = 0.04;

export interface VPTrack3DProps {
  score: number;
  maxScore?: number;
  playerColor: PlayerColor;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

/**
 * A 3D victory point track with player marker
 */
export function VPTrack3D({
  score,
  maxScore = 10,
  playerColor,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: VPTrack3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Calculate marker position based on score
  const markerX = (score / maxScore) * TRACK_WIDTH - TRACK_WIDTH / 2;

  // Spring animation for marker position
  const { markerPosX } = useSpring({
    markerPosX: markerX,
    config: { mass: 1, tension: 200, friction: 25 },
  });

  // Track base geometry and material
  const trackGeometry = useMemo(() => {
    return new THREE.BoxGeometry(TRACK_WIDTH, TRACK_DEPTH, TRACK_HEIGHT);
  }, []);

  const trackMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a1a2e',
      roughness: 0.9,
      metalness: 0.0,
    });
  }, []);

  // Marker geometry and material
  const markerGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(MARKER_RADIUS, MARKER_RADIUS, MARKER_HEIGHT, 16);
  }, []);

  const markerMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: PLAYER_COLORS_3D[playerColor],
      roughness: 0.4,
      metalness: 0.3,
      emissive: PLAYER_COLORS_3D[playerColor],
      emissiveIntensity: 0.2,
    });
  }, [playerColor]);

  // Track notch positions
  const notches = useMemo(() => {
    return Array.from({ length: maxScore + 1 }, (_, i) => ({
      x: (i / maxScore) * TRACK_WIDTH - TRACK_WIDTH / 2,
      label: i.toString(),
    }));
  }, [maxScore]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Track base */}
      <mesh geometry={trackGeometry} material={trackMaterial} />

      {/* Track notches */}
      {notches.map((notch, i) => (
        <group key={i} position={[notch.x, TRACK_DEPTH / 2 + 0.005, 0]}>
          {/* Notch line */}
          <mesh>
            <boxGeometry args={[0.01, 0.005, TRACK_HEIGHT * 0.6]} />
            <meshStandardMaterial color="#3a3a4e" />
          </mesh>
          {/* Score number (every 2 points or at start/end) */}
          {(i % 2 === 0 || i === maxScore) && (
            <Text
              position={[0, 0.01, TRACK_HEIGHT / 2 + 0.05]}
              fontSize={0.05}
              color="#666666"
              anchorX="center"
              anchorY="middle"
            >
              {notch.label}
            </Text>
          )}
        </group>
      ))}

      {/* Score marker */}
      <animated.mesh
        geometry={markerGeometry}
        material={markerMaterial}
        position-x={markerPosX}
        position-y={TRACK_DEPTH / 2 + MARKER_HEIGHT / 2}
        position-z={0}
      />

      {/* VP Label */}
      <Text
        position={[-TRACK_WIDTH / 2 - 0.15, TRACK_DEPTH / 2 + 0.02, 0]}
        fontSize={0.08}
        color="#888888"
        anchorX="right"
        anchorY="middle"
      >
        VP
      </Text>

      {/* Current score label */}
      <Text
        position={[TRACK_WIDTH / 2 + 0.1, TRACK_DEPTH / 2 + 0.02, 0]}
        fontSize={0.12}
        color={PLAYER_COLORS_3D[playerColor]}
        anchorX="left"
        anchorY="middle"
        outlineWidth={0.005}
        outlineColor="#000000"
      >
        {score}
      </Text>
    </group>
  );
}

/**
 * Constants for VP track dimensions
 */
export const VP_TRACK_DIMENSIONS = {
  width: TRACK_WIDTH,
  height: TRACK_HEIGHT,
  depth: TRACK_DEPTH,
} as const;
