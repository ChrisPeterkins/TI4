'use client';

import { useMemo, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Text, RoundedBox } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { ThreeEvent } from '@react-three/fiber';

// Fragment display dimensions
const DISPLAY_WIDTH = 2.4;
const DISPLAY_HEIGHT = 0.6;
const DISPLAY_DEPTH = 0.02;
const FRAGMENT_SIZE = 0.12;
const FRAGMENT_SPACING = 0.55;

export type FragmentType = 'cultural' | 'industrial' | 'hazardous' | 'unknown';

export interface RelicFragments {
  cultural: number;
  industrial: number;
  hazardous: number;
  unknown: number;
}

export interface RelicFragmentDisplay3DProps {
  fragments: RelicFragments;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onFragmentClick?: (type: FragmentType) => void;
  onPurgeClick?: (type: FragmentType) => void;
}

// Fragment type colors matching TI4 planet traits
const FRAGMENT_COLORS: Record<FragmentType, string> = {
  cultural: '#3b82f6',   // Blue
  industrial: '#22c55e', // Green
  hazardous: '#ef4444',  // Red
  unknown: '#a855f7',    // Purple (frontier)
};

// Fragment type labels
const FRAGMENT_LABELS: Record<FragmentType, string> = {
  cultural: 'CUL',
  industrial: 'IND',
  hazardous: 'HAZ',
  unknown: 'UNK',
};

export const RELIC_FRAGMENT_DIMENSIONS = {
  width: DISPLAY_WIDTH,
  height: DISPLAY_HEIGHT,
  depth: DISPLAY_DEPTH,
};

/**
 * Individual fragment counter with icon and count
 */
function FragmentCounter({
  type,
  count,
  position,
  scale,
  canPurge,
  isHovered,
  onClick,
  onHover,
}: {
  type: FragmentType;
  count: number;
  position: [number, number, number];
  scale: number;
  canPurge: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}) {
  const color = FRAGMENT_COLORS[type];
  const label = FRAGMENT_LABELS[type];

  // Animation for hover/purge state
  const { hoverScale, glowOpacity } = useSpring({
    hoverScale: isHovered ? 1.15 : 1,
    glowOpacity: canPurge ? 0.6 : isHovered ? 0.3 : 0,
    config: { tension: 300, friction: 20 },
  });

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(true);
    document.body.style.cursor = 'pointer';
  }, [onHover]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(false);
    document.body.style.cursor = 'auto';
  }, [onHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  const fragmentSize = FRAGMENT_SIZE * scale;

  return (
    <animated.group
      position={position}
      scale={hoverScale.to((s) => [s, s, s] as [number, number, number])}
    >
      {/* Fragment gem/icon */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        rotation={[0, 0, Math.PI / 4]}
      >
        <boxGeometry args={[fragmentSize, fragmentSize, fragmentSize * 0.5]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={canPurge ? 0.5 : 0.2}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Glow effect when can purge */}
      <animated.mesh
        rotation={[0, 0, Math.PI / 4]}
        scale={1.4}
      >
        <boxGeometry args={[fragmentSize, fragmentSize, fragmentSize * 0.3]} />
        <animated.meshBasicMaterial
          color={color}
          transparent
          opacity={glowOpacity}
        />
      </animated.mesh>

      {/* Fragment type label */}
      <Text
        position={[0, -fragmentSize * 1.2, 0.01]}
        fontSize={0.06 * scale}
        color={color}
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-medium.woff"
      >
        {label}
      </Text>

      {/* Count badge */}
      <group position={[fragmentSize * 0.8, fragmentSize * 0.6, 0.02]}>
        <mesh>
          <circleGeometry args={[0.06 * scale, 16]} />
          <meshBasicMaterial color={count >= 3 ? '#fbbf24' : '#374151'} />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.055 * scale}
          color={count >= 3 ? '#000000' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          {count}
        </Text>
      </group>

      {/* "PURGE" indicator when 3+ fragments */}
      {canPurge && (
        <Text
          position={[0, fragmentSize * 1.4, 0.01]}
          fontSize={0.04 * scale}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
        >
          PURGE
        </Text>
      )}
    </animated.group>
  );
}

/**
 * Relic Fragment Display Component
 *
 * Shows all 4 fragment types with counts.
 * Highlights when 3+ of a type are available for purging.
 */
export function RelicFragmentDisplay3D({
  fragments,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onFragmentClick,
  onPurgeClick,
}: RelicFragmentDisplay3DProps) {
  const [hoveredType, setHoveredType] = useState<FragmentType | null>(null);

  const fragmentTypes: FragmentType[] = ['cultural', 'industrial', 'hazardous', 'unknown'];

  // Calculate if any type can be purged (3+ of same type, or 3+ with unknown wild)
  const canPurgeType = useCallback((type: FragmentType): boolean => {
    const typeCount = fragments[type];
    const unknownCount = fragments.unknown;

    if (type === 'unknown') {
      // Can't specifically purge unknown - they're wild
      return false;
    }

    // Can purge if 3+ of this type OR if type + unknown >= 3
    return typeCount >= 3 || (typeCount > 0 && typeCount + unknownCount >= 3);
  }, [fragments]);

  const handleFragmentClick = useCallback((type: FragmentType) => {
    if (canPurgeType(type) && onPurgeClick) {
      onPurgeClick(type);
    } else if (onFragmentClick) {
      onFragmentClick(type);
    }
  }, [canPurgeType, onFragmentClick, onPurgeClick]);

  const displayWidth = DISPLAY_WIDTH * scale;
  const displayHeight = DISPLAY_HEIGHT * scale;

  return (
    <group
      position={position}
      rotation={rotation as unknown as THREE.Euler}
    >
      {/* Background panel */}
      <RoundedBox
        args={[displayWidth, displayHeight, DISPLAY_DEPTH * scale]}
        radius={0.03 * scale}
        smoothness={4}
      >
        <meshStandardMaterial
          color="#1f2937"
          metalness={0.3}
          roughness={0.7}
        />
      </RoundedBox>

      {/* Title */}
      <Text
        position={[0, displayHeight * 0.35, 0.02]}
        fontSize={0.055 * scale}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-medium.woff"
      >
        RELIC FRAGMENTS
      </Text>

      {/* Fragment counters */}
      {fragmentTypes.map((type, index) => {
        const xOffset = (index - 1.5) * FRAGMENT_SPACING * scale;
        return (
          <FragmentCounter
            key={type}
            type={type}
            count={fragments[type]}
            position={[xOffset, -0.05 * scale, 0.02]}
            scale={scale}
            canPurge={canPurgeType(type)}
            isHovered={hoveredType === type}
            onClick={() => handleFragmentClick(type)}
            onHover={(hovered) => setHoveredType(hovered ? type : null)}
          />
        );
      })}

      {/* Total count indicator */}
      <group position={[displayWidth * 0.4, -displayHeight * 0.35, 0.02]}>
        <Text
          fontSize={0.04 * scale}
          color="#6b7280"
          anchorX="right"
          anchorY="middle"
          font="/fonts/inter-medium.woff"
        >
          Total: {fragments.cultural + fragments.industrial + fragments.hazardous + fragments.unknown}
        </Text>
      </group>
    </group>
  );
}

export default RelicFragmentDisplay3D;
