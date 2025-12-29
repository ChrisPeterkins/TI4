'use client';

import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { UnitType, PlayerColor } from '@ti4/shared';
import { UNIT_MODEL_PATHS, UNIT_SCALES, UNIT_HOVER_HEIGHT, PLAYER_COLORS_3D } from './constants';

interface Unit3DProps {
  type: UnitType;
  ownerColor: PlayerColor;
  position: [number, number, number];
  damaged?: boolean;
  count?: number;
  onClick?: () => void;
}

/**
 * Load an OBJ model and apply player color
 */
function UnitModel({
  type,
  ownerColor,
  position,
  damaged = false,
}: Omit<Unit3DProps, 'count' | 'onClick'>) {
  const meshRef = useRef<THREE.Group>(null);

  // Get model path
  const modelPath = UNIT_MODEL_PATHS[type] || UNIT_MODEL_PATHS.infantry;
  const scale = UNIT_SCALES[type] || 0.05;

  // Load OBJ model
  const obj = useLoader(OBJLoader, modelPath);

  // Clone and configure the model
  const model = useMemo(() => {
    const cloned = obj.clone();
    const color = new THREE.Color(PLAYER_COLORS_3D[ownerColor]);

    // Apply material to all meshes in the model
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.5,
          metalness: 0.3,
          emissive: damaged ? new THREE.Color('#ff0000') : undefined,
          emissiveIntensity: damaged ? 0.3 : 0,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return cloned;
  }, [obj, ownerColor, damaged]);

  // Gentle hover animation for space units
  useFrame((state) => {
    if (meshRef.current && position[1] > 0) {
      meshRef.current.position.y =
        position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  return (
    <primitive
      ref={meshRef}
      object={model}
      position={position}
      scale={[scale, scale, scale]}
    />
  );
}

/**
 * Fallback while loading unit model
 */
function UnitFallback({
  ownerColor,
  position,
}: {
  ownerColor: PlayerColor;
  position: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color={PLAYER_COLORS_3D[ownerColor]} />
    </mesh>
  );
}

/**
 * Single 3D unit with loading suspense
 */
export function Unit3D({ type, ownerColor, position, damaged, onClick }: Unit3DProps) {
  return (
    <Suspense
      fallback={<UnitFallback ownerColor={ownerColor} position={position} />}
    >
      <group onClick={onClick}>
        <UnitModel
          type={type}
          ownerColor={ownerColor}
          position={position}
          damaged={damaged}
        />
      </group>
    </Suspense>
  );
}

/**
 * Group of units of the same type (with count badge)
 */
interface UnitGroup3DProps {
  type: UnitType;
  count: number;
  ownerColor: PlayerColor;
  damaged: number;
  basePosition: [number, number, number];
  spacing?: number;
}

export function UnitGroup3D({
  type,
  count,
  ownerColor,
  damaged,
  basePosition,
  spacing = 0.15,
}: UnitGroup3DProps) {
  // Arrange units in a row
  const positions = useMemo(() => {
    const result: [number, number, number][] = [];
    const totalWidth = (count - 1) * spacing;
    const startX = -totalWidth / 2;

    for (let i = 0; i < count; i++) {
      result.push([
        basePosition[0] + startX + i * spacing,
        basePosition[1],
        basePosition[2],
      ]);
    }

    return result;
  }, [count, spacing, basePosition]);

  return (
    <group>
      {positions.map((pos, index) => (
        <Unit3D
          key={index}
          type={type}
          ownerColor={ownerColor}
          position={pos}
          damaged={index < damaged}
        />
      ))}
    </group>
  );
}

/**
 * All units on a tile (space + ground)
 */
interface TileUnits3DProps {
  spaceUnits: {
    type: UnitType;
    count: number;
    ownerColor: PlayerColor;
    damaged: number;
  }[];
  groundUnits?: {
    planetId: string;
    units: {
      type: UnitType;
      count: number;
      ownerColor: PlayerColor;
      damaged: number;
    }[];
  }[];
  tilePosition: [number, number, number];
}

export function TileUnits3D({
  spaceUnits,
  groundUnits,
  tilePosition,
}: TileUnits3DProps) {
  // Layout space units above the tile
  const spaceUnitPositions = useMemo(() => {
    const result: { group: typeof spaceUnits[0]; position: [number, number, number] }[] =
      [];

    // Sort by unit priority (larger ships first)
    const priority: UnitType[] = [
      'war_sun',
      'flagship',
      'dreadnought',
      'carrier',
      'cruiser',
      'destroyer',
      'fighter',
    ];

    const sortedUnits = [...spaceUnits].sort((a, b) => {
      const aIdx = priority.indexOf(a.type);
      const bIdx = priority.indexOf(b.type);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

    const spacing = 0.4;
    const totalWidth = (sortedUnits.length - 1) * spacing;
    const startX = -totalWidth / 2;

    sortedUnits.forEach((group, index) => {
      result.push({
        group,
        position: [
          tilePosition[0] + startX + index * spacing,
          tilePosition[1] + UNIT_HOVER_HEIGHT,
          tilePosition[2] - 0.3,
        ],
      });
    });

    return result;
  }, [spaceUnits, tilePosition]);

  return (
    <group>
      {/* Space units */}
      {spaceUnitPositions.map(({ group, position }, index) => (
        <UnitGroup3D
          key={`space-${index}`}
          type={group.type}
          count={group.count}
          ownerColor={group.ownerColor}
          damaged={group.damaged}
          basePosition={position}
          spacing={0.1}
        />
      ))}

      {/* Ground units would go here, positioned around planets */}
    </group>
  );
}
