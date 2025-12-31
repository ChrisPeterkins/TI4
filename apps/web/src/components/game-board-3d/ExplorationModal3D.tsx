'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useLoader, useThree, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text, Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { getExplorationCardUrl, getExplorationCardBackUrl } from '@/lib/assets';
import { configureHighQualityTexture } from './textureUtils';

export type ExplorationDeckType = 'cultural' | 'industrial' | 'hazardous' | 'frontier';

export interface ExplorationResult {
  cardId: string;
  cardName: string;
  deckType: ExplorationDeckType;
  effect: ExplorationEffect;
  planetId?: string;
  planetName?: string;
}

export type ExplorationEffect =
  | { type: 'attachment'; name: string; resourceBonus?: number; influenceBonus?: number }
  | { type: 'fragment'; fragmentType: 'cultural' | 'industrial' | 'hazardous' | 'unknown' }
  | { type: 'action'; description: string }
  | { type: 'instant'; description: string };

export interface ExplorationModal3DProps {
  result: ExplorationResult | null;
  onDismiss: () => void;
}

// Card dimensions for modal view
const MODAL_CARD_WIDTH = 2.2;
const MODAL_CARD_HEIGHT = 3.3; // 2:3 ratio

// Deck type colors
const DECK_COLORS: Record<ExplorationDeckType, string> = {
  cultural: '#3b82f6',   // Blue
  industrial: '#22c55e', // Green
  hazardous: '#ef4444',  // Red
  frontier: '#a855f7',   // Purple
};

// Effect type icons/colors
const EFFECT_COLORS: Record<string, string> = {
  attachment: '#f59e0b',  // Amber
  fragment: '#8b5cf6',    // Purple
  action: '#3b82f6',      // Blue
  instant: '#22c55e',     // Green
};

/**
 * The actual modal content that follows the camera
 */
function ExplorationModalContent({
  result,
  onDismiss,
}: {
  result: ExplorationResult;
  onDismiss: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cardMeshRef = useRef<THREE.Mesh>(null);
  const backdropRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load card texture
  const textureUrl = getExplorationCardUrl(result.cardId);
  const texture = useLoader(TextureLoader, textureUrl);

  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  // Create materials
  const cardMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide,
      depthTest: false,
      depthWrite: false,
    });
  }, [texture]);

  const backdropMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

  // Animation spring
  const { scale, opacity, posY } = useSpring({
    from: { scale: 0.5, opacity: 0, posY: -1 },
    to: { scale: 1, opacity: 1, posY: 0 },
    config: { mass: 1, tension: 200, friction: 20 },
  });

  // Keep the modal in front of the camera
  useFrame(() => {
    if (groupRef.current) {
      const cameraPosition = camera.position.clone();
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);

      const distance = 5;
      const modalPosition = cameraPosition.clone().add(cameraDirection.multiplyScalar(distance));

      groupRef.current.position.copy(modalPosition);
      groupRef.current.lookAt(cameraPosition);
    }

    // Update animation values
    const currentScale = scale.get();
    const currentOpacity = opacity.get();

    if (cardMeshRef.current) {
      cardMeshRef.current.scale.setScalar(currentScale);
      cardMaterial.opacity = currentOpacity;
    }

    if (backdropRef.current) {
      backdropMaterial.opacity = currentOpacity * 0.75;
    }
  });

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const handleBackdropClick = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // Get effect description
  const effectDescription = useMemo(() => {
    switch (result.effect.type) {
      case 'attachment':
        const bonuses: string[] = [];
        if (result.effect.resourceBonus) bonuses.push(`+${result.effect.resourceBonus} Resources`);
        if (result.effect.influenceBonus) bonuses.push(`+${result.effect.influenceBonus} Influence`);
        return `Attached: ${result.effect.name}${bonuses.length ? ` (${bonuses.join(', ')})` : ''}`;
      case 'fragment':
        return `Gained ${result.effect.fragmentType.toUpperCase()} Relic Fragment`;
      case 'action':
        return result.effect.description;
      case 'instant':
        return result.effect.description;
      default:
        return 'Unknown effect';
    }
  }, [result.effect]);

  const deckColor = DECK_COLORS[result.deckType];
  const effectColor = EFFECT_COLORS[result.effect.type];

  return (
    <group ref={groupRef}>
      {/* Semi-transparent backdrop */}
      <mesh
        ref={backdropRef}
        position={[0, 0, 0.5]}
        onClick={handleBackdropClick}
        material={backdropMaterial}
        renderOrder={0}
      >
        <planeGeometry args={[100, 100]} />
      </mesh>

      {/* Modal panel */}
      <animated.group position-y={posY}>
        {/* Glow effect */}
        <mesh position={[0, 0, 0.01]} renderOrder={1}>
          <planeGeometry args={[MODAL_CARD_WIDTH + 0.3, MODAL_CARD_HEIGHT + 0.8]} />
          <meshBasicMaterial
            color={deckColor}
            transparent
            opacity={0.4}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        {/* Card background panel */}
        <mesh position={[0, 0, 0.02]} renderOrder={1}>
          <planeGeometry args={[MODAL_CARD_WIDTH + 0.2, MODAL_CARD_HEIGHT + 0.7]} />
          <meshBasicMaterial
            color="#1a1a2e"
            transparent
            opacity={0.95}
            depthTest={false}
            depthWrite={false}
          />
        </mesh>

        {/* Header: Planet name or "Frontier Explored" */}
        <Text
          position={[0, MODAL_CARD_HEIGHT / 2 + 0.25, 0.03]}
          fontSize={0.15}
          color={deckColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
          renderOrder={2}
        >
          {result.planetName ? `${result.planetName} Explored!` : 'Frontier Explored!'}
        </Text>

        {/* The exploration card */}
        <mesh
          ref={cardMeshRef}
          position={[0, 0.1, 0.03]}
          material={cardMaterial}
          onClick={(e) => e.stopPropagation()}
          renderOrder={2}
        >
          <planeGeometry args={[MODAL_CARD_WIDTH, MODAL_CARD_HEIGHT]} />
        </mesh>

        {/* Effect description panel */}
        <group position={[0, -MODAL_CARD_HEIGHT / 2 - 0.15, 0.03]}>
          {/* Effect type badge */}
          <mesh position={[0, 0.08, 0]} renderOrder={2}>
            <planeGeometry args={[1.2, 0.18]} />
            <meshBasicMaterial
              color={effectColor}
              transparent
              opacity={0.9}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          <Text
            position={[0, 0.08, 0.01]}
            fontSize={0.09}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            renderOrder={3}
          >
            {result.effect.type.toUpperCase()}
          </Text>

          {/* Effect description */}
          <Text
            position={[0, -0.08, 0]}
            fontSize={0.08}
            color="#e2e8f0"
            anchorX="center"
            anchorY="middle"
            maxWidth={MODAL_CARD_WIDTH}
            textAlign="center"
            renderOrder={2}
          >
            {effectDescription}
          </Text>
        </group>

        {/* Dismiss button */}
        <group position={[0, -MODAL_CARD_HEIGHT / 2 - 0.45, 0.03]}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto';
            }}
            renderOrder={2}
          >
            <planeGeometry args={[1.0, 0.25]} />
            <meshBasicMaterial
              color="#4ade80"
              transparent
              opacity={0.9}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.1}
            color="#000000"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            renderOrder={3}
          >
            Continue
          </Text>
        </group>

        {/* Deck type indicator (corner badge) */}
        <group position={[MODAL_CARD_WIDTH / 2 - 0.15, MODAL_CARD_HEIGHT / 2 - 0.1, 0.04]}>
          <mesh renderOrder={3}>
            <circleGeometry args={[0.12, 16]} />
            <meshBasicMaterial
              color={deckColor}
              transparent
              opacity={1}
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.06}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            renderOrder={4}
          >
            {result.deckType.charAt(0).toUpperCase()}
          </Text>
        </group>
      </animated.group>
    </group>
  );
}

/**
 * Exploration Modal - shows when a planet is explored
 * Displays the drawn card and its effect
 */
export function ExplorationModal3D({ result, onDismiss }: ExplorationModal3DProps) {
  if (!result) return null;

  return <ExplorationModalContent result={result} onDismiss={onDismiss} />;
}
