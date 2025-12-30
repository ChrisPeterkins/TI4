'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { animated, useSprings, SpringValue } from '@react-spring/three';
import { CARD_DIMENSIONS } from './Card3D';

export interface HandCard {
  id: string;
  frontTexture: string;
  backTexture: string;
}

export interface PlayerHand3DProps {
  cards: HandCard[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  fanAngle?: number; // Total arc in degrees
  fanRadius?: number; // Distance from pivot point
  cardSpacing?: number; // Overlap factor (0-1, lower = more overlap)
  isLocalPlayer: boolean;
  onCardClick?: (cardId: string) => void;
  onCardHover?: (cardId: string | null) => void;
  selectedCardId?: string;
  highlightedCardIds?: string[];
  disabled?: boolean;
}

// How much a hovered card rises
const HOVER_LIFT = 0.15;
// How much a selected card rises
const SELECT_LIFT = 0.25;
// Card scale on hover
const HOVER_SCALE = 1.1;

/**
 * Fan display of cards in player's hand
 */
export function PlayerHand3D({
  cards,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  fanAngle = 40,
  fanRadius = 2,
  cardSpacing = 0.7,
  isLocalPlayer,
  onCardClick,
  onCardHover,
  selectedCardId,
  highlightedCardIds = [],
  disabled = false,
}: PlayerHand3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Calculate card positions in fan
  const cardPositions = useMemo(() => {
    const count = cards.length;
    if (count === 0) return [];

    const angleRange = (fanAngle * Math.PI) / 180;
    const startAngle = -angleRange / 2;
    const angleStep = count > 1 ? angleRange / (count - 1) : 0;

    return cards.map((_, i) => {
      const angle = startAngle + angleStep * i;
      // Position in arc
      const x = Math.sin(angle) * fanRadius * cardSpacing;
      const z = (1 - Math.cos(angle)) * fanRadius * 0.3;
      const rotY = -angle * 0.5; // Cards tilt slightly

      return { x, z, rotY, angle };
    });
  }, [cards.length, fanAngle, fanRadius, cardSpacing]);

  // Springs for each card's hover/select animation
  const [springs] = useSprings(cards.length, (index) => {
    const card = cards[index];
    const isHovered = hoveredCardId === card.id;
    const isSelected = selectedCardId === card.id;
    const isHighlighted = highlightedCardIds.includes(card.id);

    return {
      y: isSelected ? SELECT_LIFT : isHovered ? HOVER_LIFT : 0,
      scale: isHovered || isSelected ? HOVER_SCALE : 1,
      emissive: isHighlighted ? 0.3 : 0,
      config: { mass: 0.5, tension: 300, friction: 20 },
    };
  }, [hoveredCardId, selectedCardId, highlightedCardIds, cards]);

  const handlePointerOver = useCallback(
    (cardId: string) => (e: ThreeEvent<PointerEvent>) => {
      if (disabled) return;
      e.stopPropagation();
      setHoveredCardId(cardId);
      onCardHover?.(cardId);
      document.body.style.cursor = 'pointer';
    },
    [disabled, onCardHover]
  );

  const handlePointerOut = useCallback(
    () => (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      setHoveredCardId(null);
      onCardHover?.(null);
      document.body.style.cursor = 'auto';
    },
    [onCardHover]
  );

  const handleClick = useCallback(
    (cardId: string) => (e: ThreeEvent<MouseEvent>) => {
      if (disabled) return;
      e.stopPropagation();
      onCardClick?.(cardId);
    },
    [disabled, onCardClick]
  );

  if (cards.length === 0) return null;

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {cards.map((card, index) => (
        <HandCard3D
          key={card.id}
          card={card}
          position={cardPositions[index]}
          spring={springs[index]}
          isLocalPlayer={isLocalPlayer}
          isHighlighted={highlightedCardIds.includes(card.id)}
          onPointerOver={handlePointerOver(card.id)}
          onPointerOut={handlePointerOut()}
          onClick={handleClick(card.id)}
          zIndex={
            hoveredCardId === card.id || selectedCardId === card.id
              ? cards.length + 1
              : index
          }
        />
      ))}
    </group>
  );
}

interface HandCard3DProps {
  card: HandCard;
  position: { x: number; z: number; rotY: number };
  spring: {
    y: SpringValue<number>;
    scale: SpringValue<number>;
    emissive: SpringValue<number>;
  };
  isLocalPlayer: boolean;
  isHighlighted: boolean;
  onPointerOver: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  zIndex: number;
}

function HandCard3D({
  card,
  position,
  spring,
  isLocalPlayer,
  isHighlighted,
  onPointerOver,
  onPointerOut,
  onClick,
  zIndex,
}: HandCard3DProps) {
  // Load textures
  const frontTex = useLoader(TextureLoader, card.frontTexture);
  const backTex = useLoader(TextureLoader, card.backTexture);

  // Configure textures
  useMemo(() => {
    [frontTex, backTex].forEach((tex) => {
      if (tex) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
      }
    });
  }, [frontTex, backTex]);

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

    // Set emissive for highlighted cards
    if (isHighlighted) {
      frontMaterial.emissive = new THREE.Color('#4488ff');
      frontMaterial.emissiveIntensity = 0.3;
    }

    return [
      edgeMaterial,
      edgeMaterial,
      edgeMaterial,
      edgeMaterial,
      frontMaterial,
      backMaterial,
    ];
  }, [frontTex, backTex, isHighlighted]);

  // Card geometry
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(
      CARD_DIMENSIONS.width,
      CARD_DIMENSIONS.height,
      CARD_DIMENSIONS.depth
    );
  }, []);

  return (
    <animated.mesh
      geometry={geometry}
      material={materials}
      position-x={position.x}
      position-y={spring.y}
      position-z={position.z}
      rotation-y={position.rotY + (isLocalPlayer ? 0 : Math.PI)}
      scale={spring.scale}
      renderOrder={zIndex}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    />
  );
}

/**
 * Compact hand display for opponents (shows card backs)
 */
export interface OpponentHand3DProps {
  cardCount: number;
  backTexture: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  playerName?: string;
  playerColor?: string;
}

export function OpponentHand3D({
  cardCount,
  backTexture,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  playerName,
  playerColor = '#666',
}: OpponentHand3DProps) {
  const backTex = useLoader(TextureLoader, backTexture);

  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(
      CARD_DIMENSIONS.width,
      CARD_DIMENSIONS.height,
      CARD_DIMENSIONS.depth
    );
  }, []);

  // Show stacked cards fanned slightly
  const visibleCards = Math.min(cardCount, 7);
  const fanOffset = 0.08;

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: visibleCards }).map((_, i) => {
        const edgeMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a' });
        const faceMat = new THREE.MeshStandardMaterial({ map: backTex });

        return (
          <mesh
            key={i}
            geometry={geometry}
            material={[edgeMat, edgeMat, edgeMat, edgeMat, faceMat, faceMat]}
            position={[i * fanOffset - (visibleCards * fanOffset) / 2, 0, i * 0.01]}
            rotation={[0, Math.PI, 0]}
          />
        );
      })}

      {/* Card count indicator */}
      {cardCount > 0 && (
        <mesh position={[0, -0.6, 0.1]}>
          <circleGeometry args={[0.15, 16]} />
          <meshBasicMaterial color={playerColor} />
        </mesh>
      )}
    </group>
  );
}
