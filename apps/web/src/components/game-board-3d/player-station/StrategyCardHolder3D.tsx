'use client';

import { useRef, useState, useMemo, useEffect, Suspense, useCallback } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { getStrategyCardUrl } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';
import { ActionConfirmPopup3D } from './ActionConfirmPopup3D';

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
  onPlay?: () => void;             // Called when clicking playable card (strategic action)
  onInspect?: () => void;          // Called on right-click to inspect
  onHover?: (hovered: boolean) => void;
  canPlay?: boolean;               // Whether card can be played (player's turn, not exhausted)
}

/**
 * Strategy card with texture - flips when exhausted
 */
function StrategyCardWithTexture({
  cardNumber,
  exhausted,
  isHovered,
  canPlay = false,
}: {
  cardNumber: number;
  exhausted: boolean;
  isHovered: boolean;
  canPlay?: boolean;
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

  // Flip animation when exhausted
  const { flipRotation } = useSpring({
    flipRotation: exhausted ? Math.PI : 0,
    config: { mass: 1, tension: 180, friction: 20 },
  });

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
      color: '#ffffff',
    });

    // Back material - dark with subtle pattern
    const backMaterial = new THREE.MeshStandardMaterial({
      color: '#0a1525',
      roughness: 0.7,
      metalness: 0.2,
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
  }, [texture]);

  // Hover and playable effects
  useFrame(() => {
    if (meshRef.current) {
      const mats = meshRef.current.material as THREE.MeshStandardMaterial[];
      const topMat = mats[2];
      if (topMat) {
        // Priority: hovered+playable (bright purple) > playable (subtle purple) > hovered (blue) > none
        if (isHovered && canPlay) {
          topMat.emissive = new THREE.Color('#a855f7'); // Bright purple for playable + hovered
          topMat.emissiveIntensity = 0.5;
        } else if (canPlay) {
          topMat.emissive = new THREE.Color('#a855f7'); // Subtle purple glow for playable
          topMat.emissiveIntensity = 0.2;
        } else if (isHovered && !exhausted) {
          topMat.emissive = new THREE.Color('#4488ff'); // Blue for hover (inspect)
          topMat.emissiveIntensity = 0.2;
        } else {
          topMat.emissive = new THREE.Color('#000000');
          topMat.emissiveIntensity = 0;
        }
      }
    }
  });

  return (
    <animated.mesh
      ref={meshRef}
      geometry={geometry}
      material={materials}
      rotation-x={flipRotation}
    />
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
  onPlay,
  onInspect,
  onHover,
  canPlay = false,
}: StrategyCardHolder3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Spring animation for hover (also animate when playable)
  const { positionY, scaleValue } = useSpring({
    positionY: isHovered && strategyCard && (canPlay || !exhausted) ? 0.05 : 0,
    scaleValue: isHovered && strategyCard && (canPlay || !exhausted) ? 1.05 : 1,
    config: { mass: 1, tension: 300, friction: 20 },
  });

  // Close popup when canPlay changes to false
  useEffect(() => {
    if (!canPlay && showPopup) {
      setShowPopup(false);
    }
  }, [canPlay, showPopup]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    onHover?.(true);
    if (strategyCard) {
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
      // If can play, show confirmation popup instead of directly playing
      if (canPlay) {
        setShowPopup(true);
      } else {
        // If can't play, just inspect
        onInspect?.();
      }
    }
  };

  const handlePlay = useCallback(() => {
    onPlay?.();
    setShowPopup(false);
  }, [onPlay]);

  const handleInspect = useCallback(() => {
    onInspect?.();
    setShowPopup(false);
  }, [onInspect]);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
  }, []);

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    e.nativeEvent.preventDefault();
    // Right-click always inspects
    if (strategyCard) {
      onInspect?.();
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
      onContextMenu={handleContextMenu}
    >
      {strategyCard ? (
        <Suspense fallback={<EmptyCardSlot />}>
          <StrategyCardWithTexture
            cardNumber={strategyCard}
            exhausted={exhausted}
            isHovered={isHovered}
            canPlay={canPlay}
          />
        </Suspense>
      ) : (
        <EmptyCardSlot />
      )}

      {/* Initiative number badge - shown when card is face up */}
      {strategyCard && !exhausted && (
        <Text
          position={[0, CARD_DEPTH + 0.01, -CARD_HEIGHT / 2 - 0.1]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {strategyCard}
        </Text>
      )}

      {/* Large number on back when exhausted (flipped) */}
      {strategyCard && exhausted && (
        <group rotation={[Math.PI, 0, 0]} position={[0, -CARD_DEPTH - 0.01, 0]}>
          <Text
            position={[0, 0, 0]}
            fontSize={0.35}
            color="#3b82f6"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#0a1525"
            fontWeight="bold"
          >
            {strategyCard}
          </Text>
        </group>
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

      {/* Play indicator when card is playable and hovered (but popup not showing) */}
      {strategyCard && canPlay && isHovered && !showPopup && (
        <Text
          position={[0, CARD_DEPTH + 0.25, 0]}
          fontSize={0.1}
          color="#a855f7"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#000000"
          fontWeight="bold"
        >
          CLICK FOR OPTIONS
        </Text>
      )}

      {/* Action confirmation popup */}
      {showPopup && strategyCard && (
        <ActionConfirmPopup3D
          position={[0, CARD_DEPTH + 0.4, 0]}
          onPlay={handlePlay}
          onInspect={handleInspect}
          onClose={handleClosePopup}
          playLabel="Play Card"
          inspectLabel="View Card"
          title={STRATEGY_CARD_NAMES[strategyCard]}
        />
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
