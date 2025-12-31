'use client';

import { useMemo, Suspense, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { getTechnologyCardUrl, getPlaymatTextureUrl, PLAYMAT_DIMENSIONS } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Technology card dimensions (smaller than standard cards to fit the grid)
const TECH_CARD_WIDTH = 0.9;
const TECH_CARD_HEIGHT = 0.55;
const TECH_CARD_DEPTH = 0.008;
const CARD_STACK_OFFSET = 0.15; // Vertical stacking offset within a column

// Technology types corresponding to columns
const TECH_COLUMNS = ['blue', 'green', 'yellow', 'red', 'unit'] as const;
type TechColumn = (typeof TECH_COLUMNS)[number];

export interface TechBoardTechnology {
  id: string;
  name: string;
  type: TechColumn;
}

export interface TechBoardMat3DProps {
  technologies: TechBoardTechnology[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onTechClick?: (techId: string) => void;
  onTechHover?: (techId: string | null) => void;
}

/**
 * Individual technology card on the tech board
 */
function TechCardOnBoard({
  technology,
  position,
  scale,
  onClick,
  onHover,
}: {
  technology: TechBoardTechnology;
  position: [number, number, number];
  scale: number;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load tech card texture
  const textureUrl = getTechnologyCardUrl(technology.id);
  const texture = useLoader(TextureLoader, textureUrl);

  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  const cardWidth = TECH_CARD_WIDTH * scale;
  const cardHeight = TECH_CARD_HEIGHT * scale;
  const cardDepth = TECH_CARD_DEPTH * scale;

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
  }, [texture]);

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
 * Technology Board Mat with 5 columns for tech types.
 * Renders the tech_board.jpg texture and places technology cards on top.
 */
export function TechBoardMat3D({
  technologies,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onTechClick,
  onTechHover,
}: TechBoardMat3DProps) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load mat texture
  const matTextureUrl = getPlaymatTextureUrl('tech_board');
  const matTexture = useLoader(TextureLoader, matTextureUrl);

  useEffect(() => {
    if (matTexture) {
      configureHighQualityTexture(matTexture, maxAnisotropy);
    }
  }, [matTexture, maxAnisotropy]);

  // Get mat dimensions
  const dimensions = PLAYMAT_DIMENSIONS.tech_board;
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

  // Organize technologies by column
  const techsByColumn = useMemo(() => {
    const columns: Record<TechColumn, TechBoardTechnology[]> = {
      blue: [],
      green: [],
      yellow: [],
      red: [],
      unit: [],
    };

    technologies.forEach((tech) => {
      if (columns[tech.type]) {
        columns[tech.type].push(tech);
      }
    });

    return columns;
  }, [technologies]);

  // Calculate card positions
  const getCardPosition = useCallback(
    (columnIndex: number, rowIndex: number): [number, number, number] => {
      const colWidth = matWidth / 5;
      const x = -matWidth / 2 + colWidth / 2 + columnIndex * colWidth;

      // Start from bottom row (row 3 in the mat), stack upward
      // The tech icons are in the bottom row, so we stack above them
      const baseZ = matHeight / 2 - (TECH_CARD_HEIGHT * scale) / 2 - 0.15 * scale;
      const z = baseZ - rowIndex * (CARD_STACK_OFFSET * scale + TECH_CARD_HEIGHT * scale);

      // Cards stack vertically (y increases with each card)
      const y = 0.02 + rowIndex * 0.005;

      return [x, y, z];
    },
    [matWidth, matHeight, scale]
  );

  const handleTechClick = useCallback(
    (techId: string) => {
      onTechClick?.(techId);
    },
    [onTechClick]
  );

  const handleTechHover = useCallback(
    (techId: string | null) => {
      onTechHover?.(techId);
    },
    [onTechHover]
  );

  return (
    <group position={position} rotation={rotation}>
      {/* The tech board mat */}
      <mesh geometry={matGeometry} material={matMaterial} position={[0, 0, 0]} />

      {/* Technology cards placed on the mat */}
      <group position={[0, 0.01, 0]}>
        {TECH_COLUMNS.map((column, colIndex) =>
          techsByColumn[column].map((tech, rowIndex) => (
            <Suspense key={tech.id} fallback={null}>
              <TechCardOnBoard
                technology={tech}
                position={getCardPosition(colIndex, rowIndex)}
                scale={scale}
                onClick={() => handleTechClick(tech.id)}
                onHover={(hovered) => handleTechHover(hovered ? tech.id : null)}
              />
            </Suspense>
          ))
        )}
      </group>
    </group>
  );
}

/**
 * Export dimensions for layout calculations
 */
export const TECH_BOARD_MAT_DIMENSIONS = {
  ...PLAYMAT_DIMENSIONS.tech_board,
  cardWidth: TECH_CARD_WIDTH,
  cardHeight: TECH_CARD_HEIGHT,
} as const;
