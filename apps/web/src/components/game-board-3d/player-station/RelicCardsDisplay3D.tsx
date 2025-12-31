'use client';

import { useMemo, Suspense, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text, Html, RoundedBox } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { getRelicCardUrl } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Relic card dimensions (similar to action cards)
const CARD_WIDTH = 0.7;
const CARD_HEIGHT = 1.05;
const CARD_DEPTH = 0.008;
const CARD_SPACING = 0.75;
const MAX_VISIBLE_CARDS = 4;

export type RelicUsage = 'exhaust' | 'purge' | 'passive';

export interface RelicCardState {
  exhausted?: boolean;
  purged?: boolean;
}

export interface RelicCardData {
  id: string;
  name: string;
  usage: RelicUsage;
  state: RelicCardState;
}

export interface RelicCardsDisplay3DProps {
  relics: RelicCardData[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  faceUp?: boolean;
  onRelicClick?: (relicId: string) => void;
  onRelicHover?: (relicId: string | null) => void;
}

// Usage type colors
const USAGE_COLORS: Record<RelicUsage, string> = {
  exhaust: '#f59e0b',  // Amber - can be used multiple times
  purge: '#ef4444',    // Red - one-time use
  passive: '#22c55e',  // Green - always active
};

export const RELIC_CARDS_DIMENSIONS = {
  width: MAX_VISIBLE_CARDS * CARD_SPACING + 0.3,
  height: CARD_HEIGHT + 0.2,
  depth: CARD_DEPTH,
};

/**
 * Individual relic card with texture
 */
function RelicCard({
  relic,
  position,
  scale,
  faceUp,
  isHovered,
  onClick,
  onHover,
}: {
  relic: RelicCardData;
  position: [number, number, number];
  scale: number;
  faceUp: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load card texture
  const textureUrl = getRelicCardUrl(relic.id);
  const texture = useLoader(TextureLoader, textureUrl);

  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  const cardWidth = CARD_WIDTH * scale;
  const cardHeight = CARD_HEIGHT * scale;
  const cardDepth = CARD_DEPTH * scale;

  // Determine visual state
  const isExhausted = relic.state.exhausted;
  const isPurged = relic.state.purged;

  // Animation springs
  const { hoverY, rotationX, exhaustRotation } = useSpring({
    hoverY: isHovered && !isPurged ? 0.1 * scale : 0,
    rotationX: isPurged ? Math.PI / 2 : 0,
    exhaustRotation: isExhausted ? Math.PI / 12 : 0,
    config: { tension: 300, friction: 20 },
  });

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!isPurged) {
      onHover(true);
      document.body.style.cursor = 'pointer';
    }
  }, [onHover, isPurged]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(false);
    document.body.style.cursor = 'auto';
  }, [onHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!isPurged) {
      onClick();
    }
  }, [onClick, isPurged]);

  // Card back color based on usage type
  const usageColor = USAGE_COLORS[relic.usage];

  return (
    <animated.group
      position={position}
      position-y={hoverY}
      rotation-x={rotationX}
      rotation-z={exhaustRotation}
    >
      {/* Card mesh */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[cardWidth, cardHeight, cardDepth]} />
        <meshStandardMaterial
          map={faceUp && !isPurged ? texture : null}
          color={faceUp && !isPurged ? '#ffffff' : usageColor}
          opacity={isPurged ? 0.3 : isExhausted ? 0.6 : 1}
          transparent={isPurged || isExhausted}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Exhausted overlay */}
      {isExhausted && !isPurged && (
        <mesh position={[0, 0, cardDepth]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.4} />
        </mesh>
      )}

      {/* Exhausted label */}
      {isExhausted && !isPurged && (
        <Text
          position={[0, 0, cardDepth * 2]}
          fontSize={0.08 * scale}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-bold.woff"
          rotation={[0, 0, -Math.PI / 12]}
        >
          EXHAUSTED
        </Text>
      )}

      {/* Purged overlay */}
      {isPurged && (
        <>
          <mesh position={[0, 0, cardDepth]}>
            <planeGeometry args={[cardWidth, cardHeight]} />
            <meshBasicMaterial color="#1f2937" transparent opacity={0.7} />
          </mesh>
          <Text
            position={[0, 0, cardDepth * 2]}
            fontSize={0.1 * scale}
            color="#ef4444"
            anchorX="center"
            anchorY="middle"
            font="/fonts/inter-bold.woff"
          >
            PURGED
          </Text>
        </>
      )}

      {/* Usage type indicator */}
      <mesh position={[cardWidth * 0.35, -cardHeight * 0.42, cardDepth * 1.5]}>
        <circleGeometry args={[0.04 * scale, 16]} />
        <meshBasicMaterial color={usageColor} />
      </mesh>

      {/* Card border glow on hover */}
      {isHovered && !isPurged && (
        <mesh position={[0, 0, -cardDepth]}>
          <planeGeometry args={[cardWidth + 0.02, cardHeight + 0.02]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} />
        </mesh>
      )}
    </animated.group>
  );
}

/**
 * Loading placeholder for relic card
 */
function RelicCardPlaceholder({ scale }: { scale: number }) {
  const cardWidth = CARD_WIDTH * scale;
  const cardHeight = CARD_HEIGHT * scale;

  return (
    <mesh>
      <boxGeometry args={[cardWidth, cardHeight, CARD_DEPTH * scale]} />
      <meshStandardMaterial color="#374151" />
    </mesh>
  );
}

/**
 * Relic Cards Display Component
 *
 * Displays acquired relic cards in a horizontal layout.
 * Shows exhausted/purged state visually.
 */
export function RelicCardsDisplay3D({
  relics,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  faceUp = true,
  onRelicClick,
  onRelicHover,
}: RelicCardsDisplay3DProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleRelicClick = useCallback((relicId: string) => {
    onRelicClick?.(relicId);
  }, [onRelicClick]);

  const handleRelicHover = useCallback((relicId: string | null) => {
    setHoveredId(relicId);
    onRelicHover?.(relicId);
  }, [onRelicHover]);

  // Calculate card positions
  const cardPositions = useMemo(() => {
    const activeRelics = relics.filter(r => !r.state.purged);
    const count = Math.min(activeRelics.length, MAX_VISIBLE_CARDS);
    const totalWidth = (count - 1) * CARD_SPACING * scale;
    const startX = -totalWidth / 2;

    return relics.map((relic, index) => {
      const activeIndex = relics.slice(0, index + 1).filter(r => !r.state.purged).length - 1;
      const x = startX + activeIndex * CARD_SPACING * scale;
      return [x, 0, 0] as [number, number, number];
    });
  }, [relics, scale]);

  // Empty state message
  if (relics.length === 0) {
    return (
      <group position={position} rotation={rotation as unknown as THREE.Euler}>
        <RoundedBox
          args={[RELIC_CARDS_DIMENSIONS.width * scale, RELIC_CARDS_DIMENSIONS.height * scale, 0.02 * scale]}
          radius={0.03 * scale}
          smoothness={4}
        >
          <meshStandardMaterial color="#1f2937" transparent opacity={0.5} />
        </RoundedBox>
        <Text
          position={[0, 0, 0.02]}
          fontSize={0.08 * scale}
          color="#6b7280"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-medium.woff"
        >
          No Relics
        </Text>
      </group>
    );
  }

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* Background panel */}
      <RoundedBox
        args={[
          Math.max(relics.length * CARD_SPACING * scale + 0.3 * scale, RELIC_CARDS_DIMENSIONS.width * scale),
          RELIC_CARDS_DIMENSIONS.height * scale,
          0.02 * scale,
        ]}
        radius={0.03 * scale}
        smoothness={4}
        position={[0, 0, -0.02]}
      >
        <meshStandardMaterial color="#1f2937" transparent opacity={0.3} />
      </RoundedBox>

      {/* Title */}
      <Text
        position={[0, (CARD_HEIGHT / 2 + 0.08) * scale, 0.01]}
        fontSize={0.05 * scale}
        color="#9ca3af"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-medium.woff"
      >
        RELICS ({relics.filter(r => !r.state.purged).length})
      </Text>

      {/* Relic cards */}
      {relics.map((relic, index) => (
        <Suspense key={relic.id} fallback={<RelicCardPlaceholder scale={scale} />}>
          <RelicCard
            relic={relic}
            position={cardPositions[index]}
            scale={scale}
            faceUp={faceUp}
            isHovered={hoveredId === relic.id}
            onClick={() => handleRelicClick(relic.id)}
            onHover={(hovered) => handleRelicHover(hovered ? relic.id : null)}
          />
        </Suspense>
      ))}
    </group>
  );
}

export default RelicCardsDisplay3D;
