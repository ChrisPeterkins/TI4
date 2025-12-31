'use client';

import { useMemo, Suspense, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { getPlanetCardUrl, getPlaymatTextureUrl, PLAYMAT_DIMENSIONS } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Planet card dimensions (fit the 4x4 grid)
const PLANET_CARD_WIDTH = 0.55;
const PLANET_CARD_HEIGHT = 0.85;
const PLANET_CARD_DEPTH = 0.008;

export interface PlanetCardData {
  id: string;          // Planet ID
  name: string;        // Planet name
  exhausted: boolean;  // Whether the planet is exhausted (rotated 90 degrees)
  resources?: number;
  influence?: number;
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
 * Individual planet card on the planet board
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

  return (
    <mesh
      geometry={geometry}
      material={materials}
      position={position}
      rotation={cardRotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover?.(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover?.(false);
        document.body.style.cursor = 'auto';
      }}
    />
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
