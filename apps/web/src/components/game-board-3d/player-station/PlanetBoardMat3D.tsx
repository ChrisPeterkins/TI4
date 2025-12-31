'use client';

import { useMemo, Suspense, useCallback, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useLoader, useThree, ThreeEvent } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text } from '@react-three/drei';
import { getPlanetCardUrl, getPlaymatTextureUrl, PLAYMAT_DIMENSIONS } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Planet card dimensions (fit the 4x4 grid)
const PLANET_CARD_WIDTH = 0.55;
const PLANET_CARD_HEIGHT = 0.85;
const PLANET_CARD_DEPTH = 0.008;

// Planet trait colors
const TRAIT_COLORS: Record<string, string> = {
  cultural: '#3b82f6',   // Blue
  industrial: '#22c55e', // Green
  hazardous: '#ef4444',  // Red
};

export type PlanetTrait = 'cultural' | 'industrial' | 'hazardous';

export interface PlanetAttachment {
  id: string;
  name: string;
  resourceBonus?: number;
  influenceBonus?: number;
}

export interface PlanetCardData {
  id: string;          // Planet ID
  name: string;        // Planet name
  exhausted: boolean;  // Whether the planet is exhausted (rotated 90 degrees)
  resources?: number;
  influence?: number;
  trait?: PlanetTrait;  // Planet trait for exploration
  attachments?: PlanetAttachment[]; // Exploration attachments
  modifiedResources?: number; // Resources after attachment bonuses
  modifiedInfluence?: number; // Influence after attachment bonuses
}

export interface PlanetBoardMat3DProps {
  planets: PlanetCardData[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onPlanetClick?: (planetId: string) => void;
  onPlanetHover?: (planetId: string | null) => void;
}

/**
 * Individual planet card on the planet board with trait indicator and attachments
 */
function PlanetCardOnBoard({
  planet,
  position,
  scale,
  onClick,
  onHover,
}: {
  planet: PlanetCardData;
  position: [number, number, number];
  scale: number;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);
  const [isHovered, setIsHovered] = useState(false);

  // Load planet card texture
  const textureUrl = getPlanetCardUrl(planet.id);
  const texture = useLoader(TextureLoader, textureUrl);

  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  const cardWidth = PLANET_CARD_WIDTH * scale;
  const cardHeight = PLANET_CARD_HEIGHT * scale;
  const cardDepth = PLANET_CARD_DEPTH * scale;

  // Create geometry and materials
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(cardWidth, cardDepth, cardHeight);
  }, [cardWidth, cardHeight, cardDepth]);

  const materials = useMemo(() => {
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.8,
      metalness: 0.1,
    });

    const cardMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.05,
      // Dim exhausted planets
      color: planet.exhausted ? '#888888' : '#ffffff',
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: '#1e3a5f',
      roughness: 0.6,
      metalness: 0.1,
    });

    // [+X, -X, +Y (top), -Y (bottom), +Z, -Z]
    return [
      edgeMaterial,   // Right edge
      edgeMaterial,   // Left edge
      cardMaterial,   // Top (card face)
      backMaterial,   // Bottom (card back)
      edgeMaterial,   // Front edge
      edgeMaterial,   // Back edge
    ];
  }, [texture, planet.exhausted]);

  // Rotation: exhausted cards are rotated 90 degrees
  const cardRotation: [number, number, number] = planet.exhausted
    ? [0, Math.PI / 2, 0]
    : [0, 0, 0];

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    onHover?.(true);
    document.body.style.cursor = 'pointer';
  }, [onHover]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
    onHover?.(false);
    document.body.style.cursor = 'auto';
  }, [onHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.();
  }, [onClick]);

  const hasAttachments = planet.attachments && planet.attachments.length > 0;
  const hasModifiedStats = planet.modifiedResources !== undefined || planet.modifiedInfluence !== undefined;

  return (
    <group position={position} rotation={cardRotation}>
      {/* Main card */}
      <mesh
        geometry={geometry}
        material={materials}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* Trait indicator (top-left corner) */}
      {planet.trait && (
        <group position={[-cardWidth * 0.35, cardDepth + 0.01, -cardHeight * 0.35]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.04 * scale, 16]} />
            <meshBasicMaterial color={TRAIT_COLORS[planet.trait]} />
          </mesh>
        </group>
      )}

      {/* Attachment indicators (top-right corner, stacked) */}
      {hasAttachments && planet.attachments!.map((attachment, index) => (
        <group
          key={attachment.id}
          position={[cardWidth * 0.35, cardDepth + 0.02 + index * 0.015, -cardHeight * 0.35]}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.06 * scale, 0.06 * scale, 0.01]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#6d28d9"
              emissiveIntensity={0.3}
            />
          </mesh>
        </group>
      ))}

      {/* Modified stats display (bottom of card, only when hovered or has modifications) */}
      {hasModifiedStats && (isHovered || hasAttachments) && (
        <group position={[0, cardDepth + 0.015, cardHeight * 0.35]}>
          {/* Resource bonus indicator */}
          {planet.modifiedResources !== undefined && planet.modifiedResources !== planet.resources && (
            <Text
              position={[-cardWidth * 0.2, 0, 0]}
              fontSize={0.06 * scale}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
              rotation={[-Math.PI / 2, 0, 0]}
            >
              R:{planet.modifiedResources}
            </Text>
          )}
          {/* Influence bonus indicator */}
          {planet.modifiedInfluence !== undefined && planet.modifiedInfluence !== planet.influence && (
            <Text
              position={[cardWidth * 0.2, 0, 0]}
              fontSize={0.06 * scale}
              color="#60a5fa"
              anchorX="center"
              anchorY="middle"
              rotation={[-Math.PI / 2, 0, 0]}
            >
              I:{planet.modifiedInfluence}
            </Text>
          )}
        </group>
      )}

      {/* Attachment tooltip on hover */}
      {isHovered && hasAttachments && (
        <group position={[0, cardDepth + 0.1, 0]}>
          {planet.attachments!.map((attachment, index) => (
            <Text
              key={attachment.id}
              position={[0, 0.05 * index, 0]}
              fontSize={0.035 * scale}
              color="#c4b5fd"
              anchorX="center"
              anchorY="middle"
              rotation={[-Math.PI / 2, 0, 0]}
            >
              {attachment.name}
            </Text>
          ))}
        </group>
      )}
    </group>
  );
}

/**
 * Planet Board Mat with 4x4 grid for planet cards.
 * Exhausted planets are rotated 90 degrees.
 */
export function PlanetBoardMat3D({
  planets,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onPlanetClick,
  onPlanetHover,
}: PlanetBoardMat3DProps) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load mat texture
  const matTextureUrl = getPlaymatTextureUrl('planet_board');
  const matTexture = useLoader(TextureLoader, matTextureUrl);

  useEffect(() => {
    if (matTexture) {
      configureHighQualityTexture(matTexture, maxAnisotropy);
    }
  }, [matTexture, maxAnisotropy]);

  // Get mat dimensions
  const dimensions = PLAYMAT_DIMENSIONS.planet_board;
  const matWidth = dimensions.width * scale;
  const matHeight = dimensions.height * scale;

  // Create mat geometry (flat on XZ plane)
  const matGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(matWidth, matHeight);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [matWidth, matHeight]);

  const matMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: matTexture,
      roughness: 0.85,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
  }, [matTexture]);

  // Calculate card position in the 4x4 grid
  const getCardPosition = useCallback(
    (index: number): [number, number, number] => {
      const cols = 4;
      const col = index % cols;
      const row = Math.floor(index / cols);

      const slotWidth = matWidth / cols;
      const slotHeight = matHeight / 4;

      const x = -matWidth / 2 + slotWidth / 2 + col * slotWidth;
      const z = -matHeight / 2 + slotHeight / 2 + row * slotHeight;
      const y = 0.02;

      return [x, y, z];
    },
    [matWidth, matHeight]
  );

  const handlePlanetClick = useCallback(
    (planetId: string) => {
      onPlanetClick?.(planetId);
    },
    [onPlanetClick]
  );

  const handlePlanetHover = useCallback(
    (planetId: string | null) => {
      onPlanetHover?.(planetId);
    },
    [onPlanetHover]
  );

  return (
    <group position={position} rotation={rotation}>
      {/* The planet board mat */}
      <mesh geometry={matGeometry} material={matMaterial} position={[0, 0, 0]} />

      {/* Planet cards placed on the mat */}
      <group position={[0, 0.01, 0]}>
        {planets.slice(0, 16).map((planet, index) => (
          <Suspense key={planet.id} fallback={null}>
            <PlanetCardOnBoard
              planet={planet}
              position={getCardPosition(index)}
              scale={scale}
              onClick={() => handlePlanetClick(planet.id)}
              onHover={(hovered) => handlePlanetHover(hovered ? planet.id : null)}
            />
          </Suspense>
        ))}
      </group>
    </group>
  );
}

/**
 * Export dimensions for layout calculations
 */
export const PLANET_BOARD_MAT_DIMENSIONS = {
  ...PLAYMAT_DIMENSIONS.planet_board,
  cardWidth: PLANET_CARD_WIDTH,
  cardHeight: PLANET_CARD_HEIGHT,
  maxPlanets: 16,
} as const;
