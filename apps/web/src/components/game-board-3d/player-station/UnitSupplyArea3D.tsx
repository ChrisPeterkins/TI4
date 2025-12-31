'use client';

import React, { useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { PlayerState, GameState, UnitType } from '@ti4/shared';
import { PLAYER_COLORS_3D, UNIT_MODEL_PATHS, UNIT_SCALES } from '../constants';

// Mat dimensions
const MAT_WIDTH = 8.0;
const MAT_HEIGHT = 2.75;

// Starting unit counts (base game + PoK)
const STARTING_UNITS: Record<UnitType, number> = {
  war_sun: 2,
  dreadnought: 5,
  flagship: 1,
  carrier: 4,
  cruiser: 8,
  destroyer: 8,
  fighter: 10,
  infantry: 12,
  mech: 4,
  pds: 6,
  space_dock: 3,
};

// Unit display names
const UNIT_NAMES: Record<UnitType, string> = {
  war_sun: 'War Sun',
  dreadnought: 'Dreadnought',
  flagship: 'Flagship',
  carrier: 'Carrier',
  cruiser: 'Cruiser',
  destroyer: 'Destroyer',
  fighter: 'Fighter',
  infantry: 'Infantry',
  mech: 'Mech',
  pds: 'PDS',
  space_dock: 'Space Dock',
};

// Per-unit scale overrides (multiplier on top of group scale)
const UNIT_SCALE_OVERRIDES: Partial<Record<UnitType, number>> = {
  space_dock: 0.5, // Cut in half
};

// Unit groups with relative scale adjustments
const UNIT_GROUPS = [
  { label: 'Capital Ships', units: ['war_sun', 'flagship', 'dreadnought'] as UnitType[], modelScale: 0.8 },
  { label: 'Fleet', units: ['carrier', 'cruiser', 'destroyer'] as UnitType[], modelScale: 1.1 },
  { label: 'Support', units: ['fighter', 'mech', 'infantry'] as UnitType[], modelScale: 3.6 },
  { label: 'Structures', units: ['pds', 'space_dock'] as UnitType[], modelScale: 4.0 },
];

export interface UnitSupplyArea3DProps {
  player: PlayerState;
  gameState: GameState;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  compact?: boolean; // Kept for API compatibility
  onUnitClick?: (unitType: UnitType) => void;
}

/**
 * Calculate remaining units in supply for a player
 */
function calculateUnitSupply(player: PlayerState, gameState: GameState): Record<UnitType, number> {
  const supply: Record<string, number> = { ...STARTING_UNITS };

  gameState.map.tiles.forEach((tile) => {
    // Count units in space
    tile.units.forEach((unit) => {
      if (unit.ownerId === player.id && supply[unit.type] !== undefined) {
        supply[unit.type] = Math.max(0, supply[unit.type] - 1);
      }
    });

    // Count units on planets
    tile.planets.forEach((planet) => {
      planet.units.forEach((unit) => {
        if (unit.ownerId === player.id && supply[unit.type] !== undefined) {
          supply[unit.type] = Math.max(0, supply[unit.type] - 1);
        }
      });
    });
  });

  return supply as Record<UnitType, number>;
}

/**
 * Single 3D unit model
 */
function UnitModel({
  unitType,
  playerColor,
  position,
  scale,
  available,
}: {
  unitType: UnitType;
  playerColor: string;
  position: [number, number, number];
  scale: number;
  available: boolean;
}) {
  const modelPath = UNIT_MODEL_PATHS[unitType] || UNIT_MODEL_PATHS.infantry;
  const baseScale = (UNIT_SCALES[unitType] || 0.05) * scale;
  const obj = useLoader(OBJLoader, modelPath);

  const model = useMemo(() => {
    const clone = obj.clone();
    const material = new THREE.MeshStandardMaterial({
      color: available ? playerColor : '#1a1a1a',
      roughness: 0.4,
      metalness: 0.5,
      transparent: !available,
      opacity: available ? 1 : 0.2,
      emissive: available ? new THREE.Color(playerColor) : new THREE.Color('#000000'),
      emissiveIntensity: available ? 0.1 : 0,
    });

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        child.castShadow = true;
      }
    });

    return clone;
  }, [obj, playerColor, available]);

  return (
    <primitive
      object={model}
      position={position}
      scale={[baseScale, baseScale, baseScale]}
      rotation={[0, Math.PI / 6, 0]}
    />
  );
}

/**
 * Fallback while model loads
 */
function UnitFallback({ position, scale, color }: { position: [number, number, number]; scale: number; color: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.06 * scale, 0.06 * scale, 0.06 * scale]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/**
 * Row of units for a single unit type
 */
function UnitRow({
  unitType,
  count,
  maxCount,
  playerColor,
  yPos,
  modelScale,
  rowWidth,
  xOffset = 0,
}: {
  unitType: UnitType;
  count: number;
  maxCount: number;
  playerColor: string;
  yPos: number;
  modelScale: number;
  rowWidth: number;
  xOffset?: number;
}) {
  const spacing = Math.min(rowWidth / maxCount, 0.22);
  const totalWidth = (maxCount - 1) * spacing;
  const labelOffset = 0.35; // Shift models right to avoid overlapping with labels
  const startX = -totalWidth / 2 + labelOffset;

  return (
    <group position={[xOffset, 0.05, yPos]}>
      {/* Unit name on left */}
      <Text
        position={[-rowWidth / 2 + 0.3, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.07}
        color="#666666"
        anchorX="right"
        anchorY="middle"
      >
        {UNIT_NAMES[unitType]}
      </Text>

      {/* Count on right */}
      <Text
        position={[rowWidth / 2 + 0.06, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.08}
        color={count > 0 ? '#888888' : '#444444'}
        anchorX="left"
        anchorY="middle"
      >
        {count}/{maxCount}
      </Text>

      {/* Unit models */}
      {Array.from({ length: maxCount }).map((_, i) => {
        const unitScale = modelScale * (UNIT_SCALE_OVERRIDES[unitType] || 1);
        return (
          <Suspense key={i} fallback={<UnitFallback position={[startX + i * spacing, 0, 0]} scale={unitScale} color={playerColor} />}>
            <UnitModel
              unitType={unitType}
              playerColor={playerColor}
              position={[startX + i * spacing, 0, 0]}
              scale={unitScale}
              available={i < count}
            />
          </Suspense>
        );
      })}
    </group>
  );
}

/**
 * Render a single column of unit groups
 */
function UnitColumn({
  groups,
  unitSupply,
  playerColor,
  xOffset,
  scale,
  columnWidth,
  startY,
}: {
  groups: typeof UNIT_GROUPS;
  unitSupply: Record<UnitType, number>;
  playerColor: string;
  xOffset: number;
  scale: number;
  columnWidth: number;
  startY: number;
}) {
  const rowHeight = 0.35 * scale;
  const groupGap = 0.12 * scale;
  const labelHeight = 0.12 * scale;

  let currentY = startY;
  const elements: React.ReactNode[] = [];

  groups.forEach((group, groupIndex) => {
    // Group label
    elements.push(
      <Text
        key={`label-${groupIndex}`}
        position={[xOffset, 0.02, currentY]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.09 * scale}
        color="#777777"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {group.label.toUpperCase()}
      </Text>
    );

    currentY += labelHeight;

    // Separator line
    elements.push(
      <mesh key={`sep-${groupIndex}`} position={[xOffset, 0.005, currentY]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[columnWidth * 0.9, 0.008]} />
        <meshBasicMaterial color="#444444" transparent opacity={0.5} />
      </mesh>
    );

    currentY += 0.15 * scale; // Margin after separator before units

    // Unit rows
    group.units.forEach((unitType) => {
      elements.push(
        <UnitRow
          key={unitType}
          unitType={unitType}
          count={unitSupply[unitType] || 0}
          maxCount={STARTING_UNITS[unitType] || 0}
          playerColor={playerColor}
          yPos={currentY}
          modelScale={scale * group.modelScale}
          rowWidth={columnWidth * 0.85}
          xOffset={xOffset}
        />
      );
      currentY += rowHeight;
    });

    currentY += groupGap;
  });

  return <>{elements}</>;
}

/**
 * Main unit supply area component - 2 column layout
 */
export function UnitSupplyArea3D({
  player,
  gameState,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onUnitClick,
}: UnitSupplyArea3DProps) {
  const unitSupply = useMemo(() => calculateUnitSupply(player, gameState), [player, gameState]);
  const playerColor = PLAYER_COLORS_3D[player.color];

  const width = MAT_WIDTH * scale;
  const height = MAT_HEIGHT * scale;
  const columnWidth = width / 2 - 0.1 * scale;
  const columnGap = 0.15 * scale;

  // Split groups into left and right columns
  const leftGroups = [UNIT_GROUPS[0], UNIT_GROUPS[2]]; // Capital Ships, Support
  const rightGroups = [UNIT_GROUPS[1], UNIT_GROUPS[3]]; // Fleet, Structures

  const startY = -height / 2 + 0.1 * scale;
  const leftX = -width / 4;
  const rightX = width / 4;

  return (
    <group position={position} rotation={rotation}>
      {/* Background mat */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#080810" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Border */}
      <lineSegments position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, height)]} />
        <lineBasicMaterial color="#333340" />
      </lineSegments>

      {/* Center divider line */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.008, height * 0.9]} />
        <meshBasicMaterial color="#333340" transparent opacity={0.4} />
      </mesh>

      {/* Title outside mat */}
      <Text
        position={[0, 0.02, -height / 2 - 0.15 * scale]}
        fontSize={0.14 * scale}
        color="#666666"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        REINFORCEMENTS
      </Text>

      {/* Player color indicator */}
      <mesh position={[-width / 2 + 0.1 * scale, 0.01, -height / 2 - 0.15 * scale]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08 * scale, 16]} />
        <meshBasicMaterial color={playerColor} />
      </mesh>

      {/* Left column: Capital Ships, Support */}
      <UnitColumn
        groups={leftGroups}
        unitSupply={unitSupply}
        playerColor={playerColor}
        xOffset={leftX}
        scale={scale}
        columnWidth={columnWidth}
        startY={startY}
      />

      {/* Right column: Fleet, Structures */}
      <UnitColumn
        groups={rightGroups}
        unitSupply={unitSupply}
        playerColor={playerColor}
        xOffset={rightX}
        scale={scale}
        columnWidth={columnWidth}
        startY={startY}
      />
    </group>
  );
}

export const UNIT_SUPPLY_DIMENSIONS = {
  width: MAT_WIDTH,
  height: MAT_HEIGHT,
} as const;
