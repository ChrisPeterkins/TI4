'use client';

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { getTechnologyCardUrl } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Tech card dimensions - matches actual image ratio (510x340 = 3:2, landscape), 20% larger
const TECH_WIDTH = 1.08;
const TECH_HEIGHT = 0.72;
const TECH_DEPTH = 0.006;

// Grid configuration
const GRID_SPACING_X = 1.2;
const GRID_SPACING_Z = 0.85;
const CARDS_PER_ROW = 4;

// Tech type colors for borders
const TECH_COLORS: Record<string, string> = {
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#eab308',
  red: '#dc2626',
  unit: '#6b7280',
};

export interface TechnologyCard {
  id: string;
  name: string;
  type: 'blue' | 'green' | 'yellow' | 'red' | 'unit';
}

export interface TechnologyDisplay3DProps {
  technologies: TechnologyCard[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  maxVisible?: number;
  onTechClick?: (techId: string) => void;
  onTechHover?: (techId: string | null) => void;
}

/**
 * Single technology card
 */
function TechCard({
  tech,
  gridPosition,
  isHovered,
  onHover,
  onClick,
}: {
  tech: TechnologyCard;
  gridPosition: [number, number, number];
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);
  const texture = useLoader(TextureLoader, getTechnologyCardUrl(tech.id));

  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  // Spring animation for hover
  const { positionY, emissive } = useSpring({
    positionY: isHovered ? 0.08 : 0,
    emissive: isHovered ? 0.3 : 0,
    config: { mass: 1, tension: 300, friction: 20 },
  });

  // Create geometry
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(TECH_WIDTH, TECH_DEPTH, TECH_HEIGHT);
  }, []);

  // Create materials with tech type colored border
  const materials = useMemo(() => {
    const borderColor = TECH_COLORS[tech.type] || TECH_COLORS.unit;

    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: borderColor,
      roughness: 0.6,
      metalness: 0.2,
    });

    const cardMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a2e',
      roughness: 0.8,
    });

    return [
      edgeMaterial,
      edgeMaterial,
      cardMaterial, // Top
      backMaterial, // Bottom
      edgeMaterial,
      edgeMaterial,
    ];
  }, [texture, tech.type]);

  // Update emissive
  useFrame(() => {
    if (meshRef.current) {
      const mats = meshRef.current.material as THREE.MeshStandardMaterial[];
      const topMat = mats[2];
      if (topMat) {
        topMat.emissive = new THREE.Color(TECH_COLORS[tech.type] || '#4488ff');
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
      position-x={gridPosition[0]}
      position-y={positionY.to((y) => gridPosition[1] + y)}
      position-z={gridPosition[2]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

/**
 * Fallback tech card (loading state)
 */
function FallbackTechCard({
  gridPosition,
  techType,
}: {
  gridPosition: [number, number, number];
  techType: string;
}) {
  return (
    <mesh position={gridPosition}>
      <boxGeometry args={[TECH_WIDTH, TECH_DEPTH, TECH_HEIGHT]} />
      <meshStandardMaterial color={TECH_COLORS[techType] || '#333333'} />
    </mesh>
  );
}

/**
 * A 3D grid display of technology cards
 */
export function TechnologyDisplay3D({
  technologies,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  maxVisible = 16,
  onTechClick,
  onTechHover,
}: TechnologyDisplay3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredTechId, setHoveredTechId] = useState<string | null>(null);

  const visibleTechs = technologies.slice(0, maxVisible);

  // Calculate grid position for each tech
  const getGridPosition = (index: number): [number, number, number] => {
    const row = Math.floor(index / CARDS_PER_ROW);
    const col = index % CARDS_PER_ROW;
    const centerOffset = (CARDS_PER_ROW - 1) / 2;

    return [
      (col - centerOffset) * GRID_SPACING_X,
      0,
      row * GRID_SPACING_Z,
    ];
  };

  const handleTechHover = (techId: string, hovered: boolean) => {
    setHoveredTechId(hovered ? techId : null);
    onTechHover?.(hovered ? techId : null);
  };

  // Don't render if no technologies
  if (technologies.length === 0) {
    return (
      <group position={position} rotation={rotation} scale={scale}>
        <Text
          position={[0, 0.05, 0]}
          fontSize={0.08}
          color="#666666"
          anchorX="center"
          anchorY="middle"
        >
          No Technologies
        </Text>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Tech cards grid */}
      {visibleTechs.map((tech, index) => (
        <Suspense
          key={tech.id}
          fallback={
            <FallbackTechCard
              gridPosition={getGridPosition(index)}
              techType={tech.type}
            />
          }
        >
          <TechCard
            tech={tech}
            gridPosition={getGridPosition(index)}
            isHovered={hoveredTechId === tech.id}
            onHover={(hovered) => handleTechHover(tech.id, hovered)}
            onClick={() => onTechClick?.(tech.id)}
          />
        </Suspense>
      ))}

      {/* Tech count label */}
      <Text
        position={[0, 0.1, -GRID_SPACING_Z * 0.7]}
        fontSize={0.08}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        Technologies: {technologies.length}
      </Text>

      {/* Hovered tech name */}
      {hoveredTechId && (
        <Text
          position={[0, 0.2, 0]}
          fontSize={0.07}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.005}
          outlineColor="#000000"
        >
          {technologies.find((t) => t.id === hoveredTechId)?.name || hoveredTechId}
        </Text>
      )}
    </group>
  );
}

/**
 * Constants for technology display dimensions
 */
export const TECHNOLOGY_DISPLAY_DIMENSIONS = {
  cardWidth: TECH_WIDTH,
  cardHeight: TECH_HEIGHT,
  gridSpacingX: GRID_SPACING_X,
  gridSpacingZ: GRID_SPACING_Z,
  cardsPerRow: CARDS_PER_ROW,
} as const;
