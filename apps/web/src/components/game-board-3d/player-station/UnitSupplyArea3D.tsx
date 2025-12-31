'use client';

import { useRef, useMemo, Suspense, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Text, Html } from '@react-three/drei';
import { useLoader, ThreeEvent } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { PlayerState, GameState, UnitType } from '@ti4/shared';
import { PLAYER_COLORS_3D, UNIT_MODEL_PATHS, UNIT_SCALES } from '../constants';

// Supply area dimensions
const AREA_WIDTH = 6.0;
const AREA_HEIGHT = 2.0;
const AREA_DEPTH = 0.02;

// Unit display configuration
const UNIT_Y_OFFSET = 0.08;

// Scale multiplier for supply display (models are smaller in supply)
const SUPPLY_SCALE_MULTIPLIER = 0.8;

// Unit types to display (in order) - 2 rows of 5
const UNIT_DISPLAY_ORDER: UnitType[] = [
  // Row 1: Capital ships
  'war_sun',
  'flagship',
  'dreadnought',
  'carrier',
  'cruiser',
  // Row 2: Smaller units
  'destroyer',
  'fighter',
  'infantry',
  'pds',
  'space_dock',
];

// Starting unit counts (base game)
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

export interface UnitSupplyArea3DProps {
  player: PlayerState;
  gameState: GameState;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  compact?: boolean;
  onUnitClick?: (unitType: UnitType) => void;
}

/**
 * Calculate remaining units in supply for a player
 */
function calculateUnitSupply(
  player: PlayerState,
  gameState: GameState
): Record<UnitType, number> {
  const supply: Record<string, number> = { ...STARTING_UNITS };

  // Count units on the board
  gameState.map.tiles.forEach((tile) => {
    tile.units.forEach((unit) => {
      if (unit.ownerId === player.id) {
        const type = unit.type as UnitType;
        if (supply[type] !== undefined) {
          supply[type] = Math.max(0, supply[type] - 1);
        }
      }
    });

    // Also count units on planets
    tile.planets.forEach((planet) => {
      planet.units.forEach((unit) => {
        if (unit.ownerId === player.id) {
          const type = unit.type as UnitType;
          if (supply[type] !== undefined) {
            supply[type] = Math.max(0, supply[type] - 1);
          }
        }
      });
    });
  });

  return supply as Record<UnitType, number>;
}

/**
 * 3D Unit model for supply display
 */
function SupplyUnitModel({
  unitType,
  playerColor,
  position,
  scale,
  available,
  rotation = [0, 0, 0],
}: {
  unitType: UnitType;
  playerColor: string;
  position: [number, number, number];
  scale: number;
  available: boolean;
  rotation?: [number, number, number];
}) {
  const modelPath = UNIT_MODEL_PATHS[unitType] || UNIT_MODEL_PATHS.infantry;
  const baseScale = (UNIT_SCALES[unitType] || 0.05) * SUPPLY_SCALE_MULTIPLIER * scale;

  // Load the OBJ model
  const obj = useLoader(OBJLoader, modelPath);

  // Clone and apply material
  const model = useMemo(() => {
    const clone = obj.clone();
    const material = new THREE.MeshStandardMaterial({
      color: available ? playerColor : '#2a2a2a',
      roughness: 0.4,
      metalness: 0.4,
      transparent: !available,
      opacity: available ? 1 : 0.4,
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
      rotation={rotation}
    />
  );
}

/**
 * Fallback placeholder while model loads
 */
function SupplyUnitFallback({
  position,
  scale,
  playerColor,
  available,
}: {
  position: [number, number, number];
  scale: number;
  playerColor: string;
  available: boolean;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.15 * scale, 0.15 * scale, 0.15 * scale]} />
      <meshStandardMaterial
        color={available ? playerColor : '#2a2a2a'}
        transparent={!available}
        opacity={available ? 1 : 0.4}
      />
    </mesh>
  );
}

/**
 * Single unit type display with 3D model and count badge
 */
function UnitSupplySlot({
  unitType,
  count,
  maxCount,
  playerColor,
  position,
  scale,
  onHover,
  onClick,
}: {
  unitType: UnitType;
  count: number;
  maxCount: number;
  playerColor: string;
  position: [number, number, number];
  scale: number;
  onHover?: (unitType: UnitType | null) => void;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const available = count > 0;

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    onHover?.(unitType);
    document.body.style.cursor = 'pointer';
  }, [unitType, onHover]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
    onHover?.(null);
    document.body.style.cursor = 'auto';
  }, [onHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.();
  }, [onClick]);

  // Slot dimensions
  const slotWidth = 1.0 * scale;
  const slotHeight = 0.8 * scale;

  return (
    <group
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Slot background */}
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[slotWidth, slotHeight]} />
        <meshStandardMaterial
          color={isHovered ? '#2a2a4e' : '#1a1a2e'}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Hover highlight */}
      {isHovered && (
        <mesh position={[0, -0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[slotWidth + 0.02, slotHeight + 0.02]} />
          <meshBasicMaterial color={playerColor} transparent opacity={0.3} />
        </mesh>
      )}

      {/* 3D Unit Model */}
      <Suspense
        fallback={
          <SupplyUnitFallback
            position={[0, UNIT_Y_OFFSET, -0.05 * scale]}
            scale={scale}
            playerColor={playerColor}
            available={available}
          />
        }
      >
        <SupplyUnitModel
          unitType={unitType}
          playerColor={playerColor}
          position={[0, UNIT_Y_OFFSET, -0.05 * scale]}
          scale={scale}
          available={available}
          rotation={[0, Math.PI / 4, 0]} // Slight rotation for better visibility
        />
      </Suspense>

      {/* Count badge */}
      <group position={[slotWidth / 2 - 0.12 * scale, 0.02, slotHeight / 2 - 0.1 * scale]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.12 * scale, 16]} />
          <meshStandardMaterial
            color={available ? '#1a1a1a' : '#0a0a0a'}
            transparent
            opacity={0.9}
          />
        </mesh>
        <Text
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.1 * scale}
          color={available ? '#ffffff' : '#666666'}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {count}
        </Text>
      </group>

      {/* Unit name (shown on hover) */}
      {isHovered && (
        <Html position={[0, 0.25, 0]} center>
          <div className="bg-gray-900/95 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {UNIT_NAMES[unitType]} ({count}/{maxCount})
          </div>
        </Html>
      )}

      {/* Max count indicator (small dots) */}
      <group position={[0, 0.005, slotHeight / 2 - 0.02 * scale]}>
        {Array.from({ length: Math.min(maxCount, 5) }).map((_, i) => {
          const filled = i < Math.min(count, 5);
          const dotSpacing = 0.08 * scale;
          const totalWidth = (Math.min(maxCount, 5) - 1) * dotSpacing;
          const x = -totalWidth / 2 + i * dotSpacing;

          return (
            <mesh key={i} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.025 * scale, 8]} />
              <meshStandardMaterial
                color={filled ? playerColor : '#333333'}
                transparent={!filled}
                opacity={filled ? 1 : 0.5}
              />
            </mesh>
          );
        })}
        {/* Show "+N" if more than 5 */}
        {maxCount > 5 && (
          <Text
            position={[0.25 * scale, 0.01, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.05 * scale}
            color="#666666"
            anchorX="left"
            anchorY="middle"
          >
            +{maxCount - 5}
          </Text>
        )}
      </group>
    </group>
  );
}

/**
 * A 3D display of remaining units in supply with actual 3D models
 */
export function UnitSupplyArea3D({
  player,
  gameState,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  compact = false,
  onUnitClick,
}: UnitSupplyArea3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredUnit, setHoveredUnit] = useState<UnitType | null>(null);

  // Calculate unit supply
  const unitSupply = useMemo(
    () => calculateUnitSupply(player, gameState),
    [player, gameState]
  );

  const playerColor = PLAYER_COLORS_3D[player.color];

  // Layout configuration
  const cols = compact ? 5 : 5;
  const rows = compact ? 1 : 2;
  const slotSpacingX = 1.15;
  const slotSpacingZ = 0.95;

  // Calculate slot positions
  const slotPositions = useMemo(() => {
    const positions: Array<{
      type: UnitType;
      position: [number, number, number];
    }> = [];

    const typesToShow = compact
      ? UNIT_DISPLAY_ORDER.slice(0, 5)
      : UNIT_DISPLAY_ORDER;

    typesToShow.forEach((type, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = (col - (cols - 1) / 2) * slotSpacingX * scale;
      const z = (row - (rows - 1) / 2) * slotSpacingZ * scale;

      positions.push({ type, position: [x, 0, z] });
    });

    return positions;
  }, [compact, cols, rows, scale, slotSpacingX, slotSpacingZ]);

  // Background dimensions
  const bgWidth = (cols * slotSpacingX + 0.3) * scale;
  const bgHeight = (rows * slotSpacingZ + 0.3) * scale;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Background area */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[bgWidth, bgHeight]} />
        <meshStandardMaterial
          color="#0a0a15"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Border */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.max(bgWidth, bgHeight) / 2 - 0.02, Math.max(bgWidth, bgHeight) / 2, 4]} />
        <meshBasicMaterial color="#333333" transparent opacity={0.5} />
      </mesh>

      {/* Unit slots */}
      {slotPositions.map(({ type, position: slotPos }) => (
        <UnitSupplySlot
          key={type}
          unitType={type}
          count={unitSupply[type] || 0}
          maxCount={STARTING_UNITS[type] || 0}
          playerColor={playerColor}
          position={[slotPos[0], AREA_DEPTH / 2, slotPos[2]]}
          scale={scale}
          onHover={setHoveredUnit}
          onClick={() => onUnitClick?.(type)}
        />
      ))}

      {/* Title */}
      <Text
        position={[0, 0.02, -bgHeight / 2 - 0.12 * scale]}
        fontSize={0.1 * scale}
        color="#666666"
        anchorX="center"
        anchorY="middle"
      >
        UNIT SUPPLY
      </Text>
    </group>
  );
}

/**
 * Constants for unit supply area dimensions
 */
export const UNIT_SUPPLY_DIMENSIONS = {
  width: AREA_WIDTH,
  height: AREA_HEIGHT,
  depth: AREA_DEPTH,
} as const;
