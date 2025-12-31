'use client';

import { useRef, useMemo, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useLoader, useThree, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { useSpring } from '@react-spring/three';
import {
  getCardUrl,
  getTechnologyCardUrl,
  getStrategyCardUrl,
  getActionCardBackUrl,
  getSecretObjectiveCardBackUrl,
  getPromissoryCardBackUrl,
  getFactionSheetUrl,
  getExplorationCardUrl,
  getExplorationCardBackUrl,
  getRelicCardUrl,
  getRelicCardBackUrl,
} from '@/lib/assets';
import { configureHighQualityTexture } from './textureUtils';

export type InspectedCardType = 'action' | 'secret_objective' | 'promissory' | 'technology' | 'strategy' | 'faction_sheet' | 'exploration' | 'relic';

export type ExplorationDeckType = 'cultural' | 'industrial' | 'hazardous' | 'frontier';

export interface InspectedCard {
  id: string;
  type: InspectedCardType;
  faceUp: boolean;
  explorationDeckType?: ExplorationDeckType; // For exploration card backs
}

export interface CardInspector3DProps {
  card: InspectedCard | null;
  onClose: () => void;
}

// Card dimensions for inspection view (smaller since card is close to camera)
const INSPECT_CARD_WIDTH = 1.8;
const INSPECT_CARD_HEIGHT_PORTRAIT = 2.7; // 2:3 ratio for regular cards
const INSPECT_CARD_HEIGHT_LANDSCAPE = 1.2; // 3:2 ratio for tech cards (width > height)
const INSPECT_CARD_SIZE_SQUARE = 1.8; // Square for strategy cards
const INSPECT_FACTION_SHEET_WIDTH = 3.0; // Larger for faction sheets (landscape ~1.55:1 ratio)
const INSPECT_FACTION_SHEET_HEIGHT = 1.94;

/**
 * Get the texture URL for a card
 */
function getCardTextureUrl(card: InspectedCard): string {
  if (!card.faceUp) {
    switch (card.type) {
      case 'action':
        return getActionCardBackUrl();
      case 'secret_objective':
        return getSecretObjectiveCardBackUrl();
      case 'promissory':
        return getPromissoryCardBackUrl();
      case 'technology':
        return getTechnologyCardUrl(card.id); // Tech cards don't have backs in our assets
      case 'strategy':
        return getStrategyCardUrl(parseInt(card.id)); // Strategy cards are always visible
      case 'faction_sheet':
        return getFactionSheetUrl(card.id, 'back');
      case 'exploration':
        return getExplorationCardBackUrl(card.explorationDeckType || 'cultural');
      case 'relic':
        return getRelicCardBackUrl();
      default:
        return getActionCardBackUrl();
    }
  }

  switch (card.type) {
    case 'action':
      return getCardUrl('action', card.id);
    case 'secret_objective':
      return getCardUrl('objective', card.id);
    case 'promissory':
      return getCardUrl('promissory', card.id);
    case 'technology':
      return getTechnologyCardUrl(card.id);
    case 'strategy':
      return getStrategyCardUrl(parseInt(card.id));
    case 'faction_sheet':
      return getFactionSheetUrl(card.id, 'face');
    case 'exploration':
      return getExplorationCardUrl(card.id);
    case 'relic':
      return getRelicCardUrl(card.id);
    default:
      return getCardUrl('action', card.id);
  }
}

/**
 * The actual card mesh that follows the camera
 */
function InspectorCard({
  card,
  onClose,
}: {
  card: InspectedCard;
  onClose: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cardMeshRef = useRef<THREE.Mesh>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);
  const backdropRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Determine card dimensions based on type
  const isLandscape = card.type === 'technology';
  const isSquare = card.type === 'strategy';
  const isFactionSheet = card.type === 'faction_sheet';

  let cardWidth: number;
  let cardHeight: number;

  if (isFactionSheet) {
    cardWidth = INSPECT_FACTION_SHEET_WIDTH;
    cardHeight = INSPECT_FACTION_SHEET_HEIGHT;
  } else if (isSquare) {
    cardWidth = INSPECT_CARD_SIZE_SQUARE;
    cardHeight = INSPECT_CARD_SIZE_SQUARE;
  } else if (isLandscape) {
    cardWidth = INSPECT_CARD_WIDTH;
    cardHeight = INSPECT_CARD_HEIGHT_LANDSCAPE;
  } else {
    cardWidth = INSPECT_CARD_WIDTH;
    cardHeight = INSPECT_CARD_HEIGHT_PORTRAIT;
  }

  // Load texture
  const textureUrl = getCardTextureUrl(card);
  const texture = useLoader(TextureLoader, textureUrl);

  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  // Create materials with proper depth settings for overlay rendering
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

  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#4488ff',
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide,
      depthTest: false,
      depthWrite: false,
    });
  }, []);

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
  const { scale, opacity, rotationY } = useSpring({
    from: { scale: 0.3, opacity: 0, rotationY: -0.5 },
    to: { scale: 1, opacity: 1, rotationY: 0 },
    config: { mass: 1, tension: 200, friction: 20 },
  });

  // Keep the card in front of the camera and update animation
  useFrame(() => {
    if (groupRef.current) {
      // Get camera position and direction
      const cameraPosition = camera.position.clone();
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);

      // Position the card closer to the camera to avoid clipping with scene objects
      const distance = 4; // Distance from camera (closer to avoid clipping)
      const cardPosition = cameraPosition.clone().add(cameraDirection.multiplyScalar(distance));

      groupRef.current.position.copy(cardPosition);

      // Make the card face the camera
      groupRef.current.lookAt(cameraPosition);
    }

    // Update animation values
    const currentScale = scale.get();
    const currentOpacity = opacity.get();
    const currentRotationY = rotationY.get();

    if (cardMeshRef.current) {
      cardMeshRef.current.scale.setScalar(currentScale);
      cardMeshRef.current.rotation.y = currentRotationY;
      cardMaterial.opacity = currentOpacity;
    }

    if (glowMeshRef.current) {
      glowMeshRef.current.scale.setScalar(currentScale);
      glowMeshRef.current.rotation.y = currentRotationY;
      glowMaterial.opacity = currentOpacity * 0.6;
    }

    if (backdropRef.current) {
      backdropMaterial.opacity = currentOpacity * 0.7;
    }
  });

  // Handle click on backdrop to close
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <group ref={groupRef}>
      {/* Semi-transparent backdrop - behind everything */}
      <mesh
        ref={backdropRef}
        position={[0, 0, 0.5]}
        onClick={handleBackdropClick}
        material={backdropMaterial}
        renderOrder={0}
      >
        <planeGeometry args={[100, 100]} />
      </mesh>

      {/* Card border/glow effect (rendered behind card but in front of backdrop) */}
      <mesh
        ref={glowMeshRef}
        position={[0, 0, 0.02]}
        material={glowMaterial}
        renderOrder={1}
      >
        <planeGeometry args={[cardWidth + 0.2, cardHeight + 0.2]} />
      </mesh>

      {/* The card itself - in front of everything */}
      <mesh
        ref={cardMeshRef}
        onClick={(e) => e.stopPropagation()}
        material={cardMaterial}
        renderOrder={2}
      >
        <planeGeometry args={[cardWidth, cardHeight]} />
      </mesh>
    </group>
  );
}

/**
 * Card Inspector - renders a large card view when a card is selected
 * The card appears in front of the camera for easy reading
 */
export function CardInspector3D({ card, onClose }: CardInspector3DProps) {
  if (!card) return null;

  return <InspectorCard card={card} onClose={onClose} />;
}
