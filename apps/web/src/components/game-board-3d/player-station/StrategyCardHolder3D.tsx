'use client';

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { getStrategyCardUrl } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Strategy card dimensions (roughly square with slight height)
const CARD_WIDTH = 0.8;
const CARD_HEIGHT = 0.8;
const CARD_DEPTH = 0.015;

// Card edge color
const CARD_EDGE_COLOR = '#1a1a1a';

// Strategy card names for display
const STRATEGY_CARD_NAMES: Record<number, string> = {
  1: 'Leadership',
  2: 'Diplomacy',
  3: 'Politics',
  4: 'Construction',
  5: 'Trade',
  6: 'Warfare',
  7: 'Technology',
  8: 'Imperial',
};

export interface StrategyCardHolder3DProps {
  strategyCard: number | null;
  exhausted?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

/**
 * Strategy card with texture
 */
function StrategyCardWithTexture({
  cardNumber,
  exhausted,
  isHovered,
}: {
  cardNumber: number;
  exhausted: boolean;
  isHovered: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);
  const texture = useLoader(TextureLoader, getStrategyCardUrl(cardNumber));

  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  // Create geometry
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(CARD_WIDTH, CARD_DEPTH, CARD_HEIGHT);
  }, []);

  // Create materials
  const materials = useMemo(() => {
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: CARD_EDGE_COLOR,
      roughness: 0.8,
      metalness: 0.1,
    });

    const cardMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.4,
      metalness: 0.1,
      // Dim the card if exhausted
      color: exhausted ? '#666666' : '#ffffff',
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: '#1e3a5f',
      roughness: 0.6,
      metalness: 0.1,
    });

    // [+X, -X, +Y (top), -Y (bottom), +Z, -Z]
    return [
      edgeMaterial,   // Right
      edgeMaterial,   // Left
      cardMaterial,   // Top (card face)
      backMaterial,   // Bottom (card back)
      edgeMaterial,   // Front edge
      edgeMaterial,   // Back edge
    ];
  }, [texture, exhausted]);

  // Hover effect
  useFrame(() => {
    if (meshRef.current) {
      const mats = meshRef.current.material as THREE.MeshStandardMaterial[];
      const topMat = mats[2];
      if (topMat) {
        topMat.emissive = new THREE.Color(isHovered && !exhausted ? '#4488ff' : '#000000');
        topMat.emissiveIntensity = isHovered && !exhausted ? 0.2 : 0;
      }
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={materials} />
  );
}

/**
 * Empty card slot when no strategy card
 */
function EmptyCardSlot() {
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(CARD_WIDTH, CARD_DEPTH * 0.5, CARD_HEIGHT);
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a1a2e',
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.5,
    });
  }, []);

  return <mesh geometry={geometry} material={material} />;
}

/**
 * A 3D strategy card holder component
 * Shows the player's strategy card or an empty slot
 */
export function StrategyCardHolder3D({
  strategyCard,
  exhausted = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
  onHover,
}: StrategyCardHolder3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Spring animation for hover
  const { positionY, scaleValue } = useSpring({
    positionY: isHovered && strategyCard && !exhausted ? 0.05 : 0,
    scaleValue: isHovered && strategyCard && !exhausted ? 1.05 : 1,
    config: { mass: 1, tension: 300, friction: 20 },
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    onHover?.(true);
    if (onClick && strategyCard && !exhausted) {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
    onHover?.(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (strategyCard) {
      onClick?.();
    }
  };

  return (
    <animated.group
      ref={groupRef}
      position-x={position[0]}
      position-z={position[2]}
      position-y={positionY.to((y) => position[1] + y)}
      rotation={rotation}
      scale={scaleValue.to((s) => s * scale)}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {strategyCard ? (
        <Suspense fallback={<EmptyCardSlot />}>
          <StrategyCardWithTexture
            cardNumber={strategyCard}
            exhausted={exhausted}
            isHovered={isHovered}
          />
        </Suspense>
      ) : (
        <EmptyCardSlot />
      )}

      {/* Initiative number badge */}
      {strategyCard && (
        <Text
          position={[0, CARD_DEPTH + 0.01, -CARD_HEIGHT / 2 - 0.1]}
          fontSize={0.15}
          color={exhausted ? '#666666' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {strategyCard}
        </Text>
      )}

      {/* Exhausted indicator */}
      {strategyCard && exhausted && (
        <Text
          position={[0, CARD_DEPTH + 0.03, 0]}
          fontSize={0.1}
          color="#ff6b6b"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          USED
        </Text>
      )}

      {/* Card name on hover */}
      {strategyCard && isHovered && (
        <Text
          position={[0, CARD_DEPTH + 0.15, 0]}
          fontSize={0.08}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000000"
        >
          {STRATEGY_CARD_NAMES[strategyCard]}
        </Text>
      )}
    </animated.group>
  );
}

/**
 * Constants for strategy card dimensions
 */
export const STRATEGY_CARD_DIMENSIONS = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  depth: CARD_DEPTH,
} as const;
