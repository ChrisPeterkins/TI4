'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { animated, useSpring } from '@react-spring/three';
import { getFactionSheetUrl } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Faction sheet dimensions (landscape, roughly 7" x 4.5" ratio = 1.55), 75% larger than original
const SHEET_WIDTH = 4.69;
const SHEET_HEIGHT = 3.0;
const SHEET_DEPTH = 0.02;

// Sheet edge color (dark cardboard)
const SHEET_EDGE_COLOR = '#2a2a3a';

export interface FactionSheet3DProps {
  factionId: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  faceUp?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  highlighted?: boolean;
  highlightColor?: string;
}

/**
 * A 3D faction sheet component with front and back textures
 * Can be flipped to show either side
 */
export function FactionSheet3D({
  factionId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  faceUp = true,
  onClick,
  onHover,
  highlighted = false,
  highlightColor = '#4488ff',
}: FactionSheet3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { gl } = useThree();

  // Get max anisotropy supported by the GPU
  const maxAnisotropy = useMemo(
    () => gl.capabilities.getMaxAnisotropy(),
    [gl]
  );

  // Load textures
  const frontTex = useLoader(TextureLoader, getFactionSheetUrl(factionId, 'face'));
  const backTex = useLoader(TextureLoader, getFactionSheetUrl(factionId, 'back'));

  // Configure textures for high quality
  useEffect(() => {
    [frontTex, backTex].forEach((tex) => {
      if (tex) {
        configureHighQualityTexture(tex, maxAnisotropy);
      }
    });
  }, [frontTex, backTex, maxAnisotropy]);

  // Spring animation for flip and hover
  const { rotationY, positionY, emissiveIntensity } = useSpring({
    rotationY: faceUp ? 0 : Math.PI,
    positionY: isHovered ? 0.05 : 0,
    emissiveIntensity: isHovered || highlighted ? 0.2 : 0,
    config: { mass: 1, tension: 150, friction: 20 },
  });

  // Create geometry
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(SHEET_WIDTH, SHEET_DEPTH, SHEET_HEIGHT);
  }, []);

  // Create materials for each face
  // BoxGeometry for flat sheet: [+X, -X, +Y (top), -Y (bottom), +Z, -Z]
  const materials = useMemo(() => {
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: SHEET_EDGE_COLOR,
      roughness: 0.9,
      metalness: 0.0,
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.6,
      metalness: 0.0,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.6,
      metalness: 0.0,
    });

    // [+X, -X, +Y (front face up), -Y (back face down), +Z, -Z]
    return [
      edgeMaterial,   // Right edge
      edgeMaterial,   // Left edge
      frontMaterial,  // Top face (front when face up)
      backMaterial,   // Bottom face (back when face up)
      edgeMaterial,   // Front edge
      edgeMaterial,   // Back edge
    ];
  }, [frontTex, backTex]);

  // Update emissive based on hover/highlight state
  useFrame(() => {
    if (meshRef.current) {
      const mats = meshRef.current.material as THREE.MeshStandardMaterial[];
      const intensity = emissiveIntensity.get();
      const frontMat = mats[2];
      const backMat = mats[3];

      if (frontMat && backMat) {
        const emissiveColor = new THREE.Color(highlightColor);
        frontMat.emissive = emissiveColor;
        frontMat.emissiveIntensity = intensity;
        backMat.emissive = emissiveColor;
        backMat.emissiveIntensity = intensity;
      }
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    onHover?.(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
    onHover?.(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.();
  };

  return (
    <animated.mesh
      ref={meshRef}
      geometry={geometry}
      material={materials}
      position-x={position[0]}
      position-z={position[2]}
      position-y={positionY.to((y) => position[1] + y)}
      rotation-x={rotation[0]}
      rotation-y={rotationY.to((ry) => rotation[1] + ry)}
      rotation-z={rotation[2]}
      scale={scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

/**
 * Constants for faction sheet dimensions
 */
export const FACTION_SHEET_DIMENSIONS = {
  width: SHEET_WIDTH,
  height: SHEET_HEIGHT,
  depth: SHEET_DEPTH,
} as const;
