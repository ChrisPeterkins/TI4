'use client';

import { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import type { PlayerState, GameState, UnitType } from '@ti4/shared';
import { PLAYER_COLORS_3D, UNIT_MODEL_PATHS, UNIT_SCALES } from '../constants';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// Supply area dimensions
const AREA_WIDTH = 3.0;
const AREA_HEIGHT = 1.0;
const AREA_DEPTH = 0.01;

// Unit display configuration
const UNIT_SPACING = 0.4;
const UNIT_Y_OFFSET = 0.05;

// Unit types to display (in order)
const UNIT_DISPLAY_ORDER: UnitType[] = [
  'war_sun',
  'dreadnought',
  'flagship',
  'carrier',
  'cruiser',
  'destroyer',
  'fighter',
  'infantry',
  'pds',
  'space_dock',
];

// Max units to show per type (for visual clarity)
const MAX_DISPLAY_PER_TYPE = 4;

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

export interface UnitSupplyArea3DProps {
  player: PlayerState;
  gameState: GameState;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  compact?: boolean;
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
  });

  return supply as Record<UnitType, number>;
}

/**
 * Single unit model in supply
 */
function SupplyUnit({
  unitType,
  playerColor,
  position,
  available,
}: {
  unitType: UnitType;
  playerColor: string;
  position: [number, number, number];
  available: boolean;
}) {
  const modelPath = UNIT_MODEL_PATHS[unitType];
  const scale = UNIT_SCALES[unitType] || 0.05;

  // Load the OBJ model
  const obj = useLoader(OBJLoader, modelPath);

  // Clone and apply material
  const model = useMemo(() => {
    const clone = obj.clone();
    const material = new THREE.MeshStandardMaterial({
      color: available ? playerColor : '#333333',
      roughness: 0.5,
      metalness: 0.3,
      transparent: !available,
      opacity: available ? 1 : 0.3,
    });

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
      }
    });

    return clone;
  }, [obj, playerColor, available]);

  return (
    <primitive
      object={model}
      position={position}
      scale={[scale, scale, scale]}
      rotation={[0, 0, 0]}
    />
  );
}

/**
 * Fallback unit placeholder
 */
function FallbackUnit({
  position,
  available,
  playerColor,
}: {
  position: [number, number, number];
  available: boolean;
  playerColor: string;
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.08, 0.08, 0.08]} />
      <meshStandardMaterial
        color={available ? playerColor : '#333333'}
        transparent={!available}
        opacity={available ? 1 : 0.3}
      />
    </mesh>
  );
}

/**
 * Unit type group (label + units)
 */
function UnitTypeGroup({
  unitType,
  count,
  maxCount,
  playerColor,
  position,
}: {
  unitType: UnitType;
  count: number;
  maxCount: number;
  playerColor: string;
  position: [number, number, number];
}) {
  const displayCount = Math.min(count, MAX_DISPLAY_PER_TYPE);
  const displayMax = Math.min(maxCount, MAX_DISPLAY_PER_TYPE);

  // Unit type labels (shortened)
  const unitLabels: Record<UnitType, string> = {
    war_sun: 'WS',
    dreadnought: 'DN',
    flagship: 'FS',
    carrier: 'CV',
    cruiser: 'CR',
    destroyer: 'DD',
    fighter: 'FT',
    infantry: 'GF',
    mech: 'MH',
    pds: 'PDS',
    space_dock: 'SD',
  };

  return (
    <group position={position}>
      {/* Unit type label */}
      <Text
        position={[0, -0.08, 0]}
        fontSize={0.05}
        color="#666666"
        anchorX="center"
        anchorY="middle"
      >
        {unitLabels[unitType]}
      </Text>

      {/* Count label */}
      <Text
        position={[0, 0.12, 0]}
        fontSize={0.06}
        color={count > 0 ? '#ffffff' : '#666666'}
        anchorX="center"
        anchorY="middle"
      >
        {count}/{maxCount}
      </Text>

      {/* Unit indicators */}
      {Array.from({ length: displayMax }).map((_, i) => {
        const available = i < displayCount;
        const xOffset = (i - (displayMax - 1) / 2) * 0.06;

        return (
          <mesh key={i} position={[xOffset, 0.02, 0]}>
            <circleGeometry args={[0.02, 16]} />
            <meshStandardMaterial
              color={available ? playerColor : '#1a1a1a'}
              transparent={!available}
              opacity={available ? 1 : 0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * A 3D display of remaining units in supply
 */
export function UnitSupplyArea3D({
  player,
  gameState,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  compact = false,
}: UnitSupplyArea3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Calculate unit supply
  const unitSupply = useMemo(
    () => calculateUnitSupply(player, gameState),
    [player, gameState]
  );

  const playerColor = PLAYER_COLORS_3D[player.color];

  // Base area geometry and material
  const areaGeometry = useMemo(() => {
    return new THREE.BoxGeometry(AREA_WIDTH, AREA_DEPTH, AREA_HEIGHT);
  }, []);

  const areaMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a1a2e',
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.5,
    });
  }, []);

  // Calculate positions for each unit type
  const unitPositions = useMemo(() => {
    const positions: Array<{
      type: UnitType;
      x: number;
      z: number;
    }> = [];

    const typesToShow = compact
      ? UNIT_DISPLAY_ORDER.slice(0, 5) // Show fewer in compact mode
      : UNIT_DISPLAY_ORDER;

    const cols = compact ? 5 : 5;
    const rows = Math.ceil(typesToShow.length / cols);

    typesToShow.forEach((type, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = (col - (cols - 1) / 2) * UNIT_SPACING;
      const z = (row - (rows - 1) / 2) * UNIT_SPACING * 0.8;

      positions.push({ type, x, z });
    });

    return positions;
  }, [compact]);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Background area */}
      <mesh geometry={areaGeometry} material={areaMaterial} />

      {/* Unit type groups */}
      {unitPositions.map(({ type, x, z }) => (
        <UnitTypeGroup
          key={type}
          unitType={type}
          count={unitSupply[type] || 0}
          maxCount={STARTING_UNITS[type] || 0}
          playerColor={playerColor}
          position={[x, AREA_DEPTH / 2 + UNIT_Y_OFFSET, z]}
        />
      ))}

      {/* Title */}
      <Text
        position={[0, AREA_DEPTH / 2 + 0.02, -AREA_HEIGHT / 2 - 0.08]}
        fontSize={0.07}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        Unit Supply
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
