'use client';

import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Html } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { CARD_DIMENSIONS } from './Card3D';

// How much each card in stack is offset
const STACK_HEIGHT_PER_CARD = 0.003;
const MAX_VISIBLE_CARDS = 15;
const RANDOM_OFFSET_RANGE = 0.015;
const RANDOM_ROTATION_RANGE = 0.03;

export interface Deck3DProps {
  cardCount: number;
  backTexture: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  label?: string;
  onDraw?: () => void;
  highlightTop?: boolean;
  disabled?: boolean;
}

/**
 * A 3D deck of cards shown as a stack
 */
export function Deck3D({
  cardCount,
  backTexture,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  label,
  onDraw,
  highlightTop = false,
  disabled = false,
}: Deck3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Load texture
  const texture = useLoader(TextureLoader, backTexture);

  // Configure texture
  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);

  // Generate stable random offsets for stack cards
  const stackOffsets = useMemo(() => {
    const visibleCards = Math.min(cardCount, MAX_VISIBLE_CARDS);
    return Array.from({ length: visibleCards }).map((_, i) => ({
      x: (Math.random() - 0.5) * RANDOM_OFFSET_RANGE,
      z: (Math.random() - 0.5) * RANDOM_OFFSET_RANGE,
      rotY: (Math.random() - 0.5) * RANDOM_ROTATION_RANGE,
      // Use index as seed for stable randomness
      seed: i,
    }));
  }, [cardCount]);

  // Spring for top card hover/highlight
  const { topCardY, glowIntensity } = useSpring({
    topCardY: isHovered && !disabled ? 0.05 : 0,
    glowIntensity: (isHovered || highlightTop) && !disabled ? 0.4 : 0,
    config: { mass: 0.5, tension: 300, friction: 20 },
  });

  // Pulsing glow when highlighted
  const pulseRef = useRef(0);
  useFrame((_, delta) => {
    if (highlightTop && !disabled) {
      pulseRef.current += delta * 3;
    }
  });

  // Card geometry
  const cardGeometry = useMemo(() => {
    return new THREE.BoxGeometry(
      CARD_DIMENSIONS.width,
      CARD_DIMENSIONS.height,
      CARD_DIMENSIONS.depth
    );
  }, []);

  // Materials for stack cards (all showing back)
  const cardMaterials = useMemo(() => {
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.8,
    });

    const faceMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
    });

    return [
      edgeMaterial,
      edgeMaterial,
      edgeMaterial,
      edgeMaterial,
      faceMaterial,
      faceMaterial,
    ];
  }, [texture]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    if (disabled || cardCount === 0) return;
    e.stopPropagation();
    setIsHovered(true);
    if (onDraw) {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (disabled || cardCount === 0) return;
    e.stopPropagation();
    onDraw?.();
  };

  const visibleCards = Math.min(cardCount, MAX_VISIBLE_CARDS);
  const stackHeight = visibleCards * STACK_HEIGHT_PER_CARD;

  if (cardCount === 0) {
    // Empty deck placeholder
    return (
      <group position={position} rotation={rotation}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height]} />
          <meshStandardMaterial
            color="#222"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        {label && (
          <Html position={[0, 0.1, 0]} center>
            <div className="text-gray-500 text-xs whitespace-nowrap bg-black/50 px-2 py-1 rounded">
              {label} (empty)
            </div>
          </Html>
        )}
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Stack of cards lying flat */}
      {stackOffsets.map((offset, i) => (
        <mesh
          key={i}
          geometry={cardGeometry}
          material={cardMaterials}
          position={[
            offset.x,
            i * STACK_HEIGHT_PER_CARD + CARD_DIMENSIONS.depth / 2,
            offset.z,
          ]}
          rotation={[-Math.PI / 2, offset.rotY, 0]}
        />
      ))}

      {/* Top card (interactive) */}
      <animated.mesh
        geometry={cardGeometry}
        material={cardMaterials}
        position-x={0}
        position-y={topCardY.to((y) => stackHeight + CARD_DIMENSIONS.depth / 2 + 0.005 + y)}
        position-z={0}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* Glow effect */}
        {(highlightTop || isHovered) && !disabled && (
          <animated.pointLight
            position={[0, 0.2, 0]}
            color="#4488ff"
            intensity={glowIntensity}
            distance={1}
          />
        )}
      </animated.mesh>

      {/* Card count label */}
      <Html position={[0, stackHeight + 0.3, 0]} center>
        <div className="flex flex-col items-center">
          <div className="text-white text-lg font-bold bg-black/70 px-3 py-1 rounded-full min-w-[40px] text-center">
            {cardCount}
          </div>
          {label && (
            <div className="text-gray-300 text-xs mt-1 whitespace-nowrap bg-black/50 px-2 py-0.5 rounded">
              {label}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

/**
 * Discard pile - similar to deck but shows top card face-up
 */
export interface DiscardPile3DProps {
  cards: { id: string; frontTexture: string }[];
  backTexture: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  label?: string;
  onClick?: () => void;
}

export function DiscardPile3D({
  cards,
  backTexture,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  label,
  onClick,
}: DiscardPile3DProps) {
  const topCard = cards[cards.length - 1];

  // Load textures
  const backTex = useLoader(TextureLoader, backTexture);
  const topTex = useLoader(
    TextureLoader,
    topCard?.frontTexture || backTexture
  );

  // Card geometry
  const cardGeometry = useMemo(() => {
    return new THREE.BoxGeometry(
      CARD_DIMENSIONS.width,
      CARD_DIMENSIONS.height,
      CARD_DIMENSIONS.depth
    );
  }, []);

  const visibleCards = Math.min(cards.length, MAX_VISIBLE_CARDS);

  if (cards.length === 0) {
    return (
      <group position={position} rotation={rotation}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height]} />
          <meshStandardMaterial
            color="#333"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        {label && (
          <Html position={[0, 0.1, 0]} center>
            <div className="text-gray-600 text-xs whitespace-nowrap">
              {label}
            </div>
          </Html>
        )}
      </group>
    );
  }

  return (
    <group position={position} rotation={rotation}>
      {/* Stack of face-down cards */}
      {Array.from({ length: Math.max(0, visibleCards - 1) }).map((_, i) => {
        const edgeMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a' });
        const faceMat = new THREE.MeshStandardMaterial({ map: backTex });

        return (
          <mesh
            key={i}
            geometry={cardGeometry}
            material={[edgeMat, edgeMat, edgeMat, edgeMat, faceMat, faceMat]}
            position={[
              (Math.random() - 0.5) * RANDOM_OFFSET_RANGE,
              i * STACK_HEIGHT_PER_CARD + CARD_DIMENSIONS.depth / 2,
              (Math.random() - 0.5) * RANDOM_OFFSET_RANGE,
            ]}
            rotation={[-Math.PI / 2, (Math.random() - 0.5) * 0.1, 0]}
          />
        );
      })}

      {/* Top card (face-up) */}
      {topCard && (
        <mesh
          geometry={cardGeometry}
          position={[
            0,
            visibleCards * STACK_HEIGHT_PER_CARD + CARD_DIMENSIONS.depth / 2,
            0,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <meshStandardMaterial attach="material-0" color="#1a1a1a" />
          <meshStandardMaterial attach="material-1" color="#1a1a1a" />
          <meshStandardMaterial attach="material-2" color="#1a1a1a" />
          <meshStandardMaterial attach="material-3" color="#1a1a1a" />
          <meshStandardMaterial attach="material-4" map={topTex} />
          <meshStandardMaterial attach="material-5" map={backTex} />
        </mesh>
      )}

      {/* Label */}
      {label && (
        <Html
          position={[0, visibleCards * STACK_HEIGHT_PER_CARD + 0.25, 0]}
          center
        >
          <div className="text-gray-300 text-xs whitespace-nowrap bg-black/50 px-2 py-0.5 rounded">
            {label} ({cards.length})
          </div>
        </Html>
      )}
    </group>
  );
}
