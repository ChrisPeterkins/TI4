'use client';

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import {
  getCardUrl,
  getActionCardBackUrl,
  getSecretObjectiveCardBackUrl,
  getPromissoryCardBackUrl,
} from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Card dimensions - matches actual image ratio (340x510 = 2:3), 20% larger
const CARD_WIDTH = 0.84;
const CARD_HEIGHT = 1.26;
const CARD_DEPTH = 0.008;

// Fan configuration
const FAN_ANGLE = 12; // Degrees between cards
const FAN_RADIUS = 2.5; // Radius of the fan arc
const HOVER_LIFT = 0.15;
const HOVER_SCALE = 1.15;

// Spread configuration
const SPREAD_SPACING = 0.9; // Spacing between cards in spread layout

export type CardHandType = 'action' | 'secret_objective' | 'promissory';
export type CardLayoutMode = 'fan' | 'stack' | 'spread';

export interface CardHandCard {
  id: string;
  name?: string;
}

export interface CardHand3DProps {
  cards: CardHandCard[];
  cardType: CardHandType;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  faceUp?: boolean;
  maxVisible?: number;
  onCardClick?: (cardId: string) => void;
  onCardHover?: (cardId: string | null) => void;
  /** @deprecated Use layout='stack' instead */
  compact?: boolean;
  /** Layout mode: 'fan' (curved), 'stack' (piled), 'spread' (side by side) */
  layout?: CardLayoutMode;
}

/**
 * Get the back texture URL for a card type
 */
function getCardBackUrl(cardType: CardHandType): string {
  switch (cardType) {
    case 'action':
      return getActionCardBackUrl();
    case 'secret_objective':
      return getSecretObjectiveCardBackUrl();
    case 'promissory':
      return getPromissoryCardBackUrl();
    default:
      return getActionCardBackUrl();
  }
}

/**
 * Get the front texture URL for a card
 */
function getCardFrontUrl(cardType: CardHandType, cardId: string): string {
  switch (cardType) {
    case 'action':
      return getCardUrl('action', cardId);
    case 'secret_objective':
      return getCardUrl('objective', cardId);
    case 'promissory':
      return getCardUrl('promissory', cardId);
    default:
      return getCardUrl('action', cardId);
  }
}

/**
 * Single card in the hand with texture
 */
function HandCard({
  cardId,
  cardType,
  faceUp,
  index,
  totalCards,
  isHovered,
  layout,
  onHover,
  onClick,
}: {
  cardId: string;
  cardType: CardHandType;
  faceUp: boolean;
  index: number;
  totalCards: number;
  isHovered: boolean;
  layout: CardLayoutMode;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Calculate position based on layout mode
  const centerIndex = (totalCards - 1) / 2;
  let xOffset: number;
  let zOffset: number;
  let cardRotation: number;

  switch (layout) {
    case 'spread':
      // Side by side horizontal layout
      xOffset = (index - centerIndex) * SPREAD_SPACING;
      zOffset = 0;
      cardRotation = 0;
      break;
    case 'stack':
      // Stacked/piled layout
      xOffset = (index - centerIndex) * 0.03;
      zOffset = index * 0.01;
      cardRotation = 0;
      break;
    case 'fan':
    default:
      // Fan/curved layout
      const angleOffset = (index - centerIndex) * FAN_ANGLE * (Math.PI / 180);
      xOffset = Math.sin(angleOffset) * FAN_RADIUS * 0.3;
      zOffset = -Math.cos(angleOffset) * FAN_RADIUS * 0.05 + index * 0.02;
      cardRotation = angleOffset;
      break;
  }

  // Load textures
  const frontUrl = getCardFrontUrl(cardType, cardId);
  const backUrl = getCardBackUrl(cardType);
  const frontTex = useLoader(TextureLoader, faceUp ? frontUrl : backUrl);
  const backTex = useLoader(TextureLoader, backUrl);

  useEffect(() => {
    [frontTex, backTex].forEach((tex) => {
      if (tex) {
        configureHighQualityTexture(tex, maxAnisotropy);
      }
    });
  }, [frontTex, backTex, maxAnisotropy]);

  // Spring animation for hover
  const { positionY, scaleVal, emissive } = useSpring({
    positionY: isHovered ? HOVER_LIFT : 0,
    scaleVal: isHovered ? HOVER_SCALE : 1,
    emissive: isHovered ? 0.3 : 0,
    config: { mass: 1, tension: 300, friction: 20 },
  });

  // Create geometry
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(CARD_WIDTH, CARD_DEPTH, CARD_HEIGHT);
  }, []);

  // Create materials
  const materials = useMemo(() => {
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.8,
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.5,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.5,
    });

    return [
      edgeMaterial,
      edgeMaterial,
      frontMaterial, // Top
      backMaterial,  // Bottom
      edgeMaterial,
      edgeMaterial,
    ];
  }, [frontTex, backTex]);

  // Update emissive
  useFrame(() => {
    if (meshRef.current) {
      const mats = meshRef.current.material as THREE.MeshStandardMaterial[];
      const topMat = mats[2];
      if (topMat) {
        topMat.emissive = new THREE.Color('#4488ff');
        topMat.emissiveIntensity = emissive.get();
      }
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <animated.mesh
      ref={meshRef}
      geometry={geometry}
      material={materials}
      position-x={xOffset}
      position-y={positionY}
      position-z={zOffset}
      rotation-y={cardRotation}
      scale={scaleVal}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

/**
 * Fallback card (loading state)
 */
function FallbackCard({
  index,
  totalCards,
  layout,
}: {
  index: number;
  totalCards: number;
  layout: CardLayoutMode;
}) {
  const centerIndex = (totalCards - 1) / 2;
  let xOffset: number;
  let zOffset: number;

  switch (layout) {
    case 'spread':
      xOffset = (index - centerIndex) * SPREAD_SPACING;
      zOffset = 0;
      break;
    case 'stack':
      xOffset = (index - centerIndex) * 0.03;
      zOffset = index * 0.01;
      break;
    case 'fan':
    default:
      xOffset = Math.sin((index - centerIndex) * FAN_ANGLE * (Math.PI / 180)) * FAN_RADIUS * 0.3;
      zOffset = index * 0.02;
      break;
  }

  return (
    <mesh position={[xOffset, 0, zOffset]}>
      <boxGeometry args={[CARD_WIDTH, CARD_DEPTH, CARD_HEIGHT]} />
      <meshStandardMaterial color="#2a2a4a" />
    </mesh>
  );
}

/**
 * A 3D hand of cards with multiple layout options
 */
export function CardHand3D({
  cards,
  cardType,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  faceUp = false,
  maxVisible = 10,
  onCardClick,
  onCardHover,
  compact = false,
  layout: layoutProp,
}: CardHand3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Determine layout: prop takes precedence, then compact for backwards compat
  const layout: CardLayoutMode = layoutProp ?? (compact ? 'stack' : 'fan');

  const visibleCards = cards.slice(0, maxVisible);
  const hiddenCount = cards.length - visibleCards.length;

  const handleCardHover = (cardId: string, hovered: boolean) => {
    setHoveredCardId(hovered ? cardId : null);
    onCardHover?.(hovered ? cardId : null);
  };

  // Don't render if no cards
  if (cards.length === 0) {
    return null;
  }

  // Calculate badge position based on layout
  const badgeZOffset = layout === 'stack' ? visibleCards.length * 0.01 + 0.1 : 0.2;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {visibleCards.map((card, index) => (
        <Suspense
          key={card.id}
          fallback={
            <FallbackCard
              index={index}
              totalCards={visibleCards.length}
              layout={layout}
            />
          }
        >
          <HandCard
            cardId={card.id}
            cardType={cardType}
            faceUp={faceUp}
            index={index}
            totalCards={visibleCards.length}
            isHovered={hoveredCardId === card.id}
            layout={layout}
            onHover={(hovered) => handleCardHover(card.id, hovered)}
            onClick={() => onCardClick?.(card.id)}
          />
        </Suspense>
      ))}

      {/* Count badge */}
      <Text
        position={[0, 0.15, badgeZOffset]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.008}
        outlineColor="#000000"
      >
        {cards.length}
      </Text>

      {/* Hidden cards indicator */}
      {hiddenCount > 0 && (
        <Text
          position={[0.3, 0.15, 0]}
          fontSize={0.06}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          +{hiddenCount}
        </Text>
      )}
    </group>
  );
}

/**
 * Constants for card hand dimensions
 */
export const CARD_HAND_DIMENSIONS = {
  cardWidth: CARD_WIDTH,
  cardHeight: CARD_HEIGHT,
  cardDepth: CARD_DEPTH,
} as const;
