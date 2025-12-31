'use client';

import { useMemo, Suspense, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { getExplorationCardUrl, getPlaymatTextureUrl, PLAYMAT_DIMENSIONS } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Exploration card dimensions
const EXPLORATION_CARD_WIDTH = 0.5;
const EXPLORATION_CARD_HEIGHT = 0.7;
const EXPLORATION_CARD_DEPTH = 0.008;

// Exploration types (columns in the mat)
const EXPLORATION_TYPES = ['cultural', 'hazardous', 'industrial', 'frontier', 'relic'] as const;
export type ExplorationType = (typeof EXPLORATION_TYPES)[number];

export interface ExplorationCardData {
  id: string;
  name: string;
  type: ExplorationType;
  attached?: boolean; // Whether card is attached to a planet
}

export interface ExplorationMat3DProps {
  explorationCards: ExplorationCardData[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onCardClick?: (cardId: string) => void;
  onCardHover?: (cardId: string | null) => void;
}

/**
 * Individual exploration card on the exploration mat
 */
function ExplorationCardOnMat({
  card,
  position,
  scale,
  onClick,
  onHover,
}: {
  card: ExplorationCardData;
  position: [number, number, number];
  scale: number;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load card texture
  const textureUrl = getExplorationCardUrl(card.id);
  const texture = useLoader(TextureLoader, textureUrl);

  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  const cardWidth = EXPLORATION_CARD_WIDTH * scale;
  const cardHeight = EXPLORATION_CARD_HEIGHT * scale;
  const cardDepth = EXPLORATION_CARD_DEPTH * scale;

  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(cardWidth, cardDepth, cardHeight);
  }, [cardWidth, cardHeight, cardDepth]);

  const materials = useMemo(() => {
    // Color code by exploration type
    const typeColors: Record<ExplorationType, string> = {
      cultural: '#3b82f6',    // Blue
      hazardous: '#ef4444',   // Red
      industrial: '#22c55e',  // Green
      frontier: '#8b5cf6',    // Purple
      relic: '#f59e0b',       // Amber
    };

    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: typeColors[card.type] || '#1a1a1a',
      roughness: 0.8,
      metalness: 0.1,
    });

    const cardMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.05,
      // Dim attached cards
      color: card.attached ? '#888888' : '#ffffff',
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: typeColors[card.type] || '#1e3a5f',
      roughness: 0.6,
      metalness: 0.1,
    });

    return [
      edgeMaterial,
      edgeMaterial,
      cardMaterial,
      backMaterial,
      edgeMaterial,
      edgeMaterial,
    ];
  }, [texture, card.type, card.attached]);

  return (
    <mesh
      geometry={geometry}
      material={materials}
      position={position}
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
 * Exploration Mat for PoK exploration cards.
 * Displays cards organized by exploration type (5 columns × 2 rows).
 */
export function ExplorationMat3D({
  explorationCards,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onCardClick,
  onCardHover,
}: ExplorationMat3DProps) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load mat texture
  const matTextureUrl = getPlaymatTextureUrl('exploration_mat');
  const matTexture = useLoader(TextureLoader, matTextureUrl);

  useEffect(() => {
    if (matTexture) {
      configureHighQualityTexture(matTexture, maxAnisotropy);
    }
  }, [matTexture, maxAnisotropy]);

  // Get mat dimensions
  const dimensions = PLAYMAT_DIMENSIONS.exploration_mat;
  const matWidth = dimensions.width * scale;
  const matHeight = dimensions.height * scale;

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

  // Organize cards by type
  const cardsByType = useMemo(() => {
    const organized: Record<ExplorationType, ExplorationCardData[]> = {
      cultural: [],
      hazardous: [],
      industrial: [],
      frontier: [],
      relic: [],
    };

    explorationCards.forEach((card) => {
      if (organized[card.type]) {
        organized[card.type].push(card);
      }
    });

    return organized;
  }, [explorationCards]);

  // Calculate card position in the 5×2 grid
  const getCardPosition = useCallback(
    (colIndex: number, rowIndex: number): [number, number, number] => {
      const colWidth = matWidth / 5;
      const rowHeight = matHeight / 2;

      const x = -matWidth / 2 + colWidth / 2 + colIndex * colWidth;
      const z = -matHeight / 2 + rowHeight / 2 + rowIndex * rowHeight;
      const y = 0.02 + rowIndex * 0.003;

      return [x, y, z];
    },
    [matWidth, matHeight]
  );

  const handleCardClick = useCallback(
    (cardId: string) => {
      onCardClick?.(cardId);
    },
    [onCardClick]
  );

  const handleCardHover = useCallback(
    (cardId: string | null) => {
      onCardHover?.(cardId);
    },
    [onCardHover]
  );

  return (
    <group position={position} rotation={rotation}>
      {/* The exploration mat */}
      <mesh geometry={matGeometry} material={matMaterial} position={[0, 0, 0]} />

      {/* Exploration cards organized by type */}
      <group position={[0, 0.01, 0]}>
        {EXPLORATION_TYPES.map((type, colIndex) =>
          cardsByType[type].slice(0, 2).map((card, rowIndex) => (
            <Suspense key={card.id} fallback={null}>
              <ExplorationCardOnMat
                card={card}
                position={getCardPosition(colIndex, rowIndex)}
                scale={scale}
                onClick={() => handleCardClick(card.id)}
                onHover={(hovered) => handleCardHover(hovered ? card.id : null)}
              />
            </Suspense>
          ))
        )}
      </group>
    </group>
  );
}

/**
 * Export dimensions and types for layout calculations
 */
export const EXPLORATION_MAT_DIMENSIONS = {
  ...PLAYMAT_DIMENSIONS.exploration_mat,
  cardWidth: EXPLORATION_CARD_WIDTH,
  cardHeight: EXPLORATION_CARD_HEIGHT,
  explorationTypes: EXPLORATION_TYPES,
} as const;
