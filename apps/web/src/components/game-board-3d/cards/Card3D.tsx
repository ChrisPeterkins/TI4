'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { animated, useSpring } from '@react-spring/three';

// Standard playing card ratio: 2.5" x 3.5" = 0.714
const CARD_WIDTH = 0.714;
const CARD_HEIGHT = 1.0;
const CARD_DEPTH = 0.01;

// Card edge color
const CARD_EDGE_COLOR = '#1a1a1a';

export interface Card3DProps {
  frontTexture: string;
  backTexture: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  faceUp?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  highlighted?: boolean;
  highlightColor?: string;
  disabled?: boolean;
}

/**
 * A 3D card component with front and back textures
 * Uses BoxGeometry with different materials per face
 */
export function Card3D({
  frontTexture,
  backTexture,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  faceUp = true,
  onClick,
  onHover,
  highlighted = false,
  highlightColor = '#4488ff',
  disabled = false,
}: Card3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Load textures
  const frontTex = useLoader(TextureLoader, frontTexture);
  const backTex = useLoader(TextureLoader, backTexture);

  // Configure textures
  useEffect(() => {
    [frontTex, backTex].forEach((tex) => {
      if (tex) {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
      }
    });
  }, [frontTex, backTex]);

  // Spring animation for flip and hover
  const { rotationY, positionY, emissiveIntensity } = useSpring({
    rotationY: faceUp ? 0 : Math.PI,
    positionY: isHovered && !disabled ? 0.1 : 0,
    emissiveIntensity: (isHovered || highlighted) && !disabled ? 0.3 : 0,
    config: { mass: 1, tension: 200, friction: 20 },
  });

  // Create geometry
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_DEPTH);
  }, []);

  // Create materials for each face
  // BoxGeometry face order: +X, -X, +Y, -Y, +Z (front), -Z (back)
  const materials = useMemo(() => {
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: CARD_EDGE_COLOR,
      roughness: 0.8,
      metalness: 0.1,
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.5,
      metalness: 0.0,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.5,
      metalness: 0.0,
    });

    // [+X, -X, +Y, -Y, +Z (front), -Z (back)]
    return [
      edgeMaterial,  // Right edge
      edgeMaterial,  // Left edge
      edgeMaterial,  // Top edge
      edgeMaterial,  // Bottom edge
      frontMaterial, // Front face (+Z)
      backMaterial,  // Back face (-Z)
    ];
  }, [frontTex, backTex]);

  // Update emissive based on hover/highlight state
  useFrame(() => {
    if (meshRef.current) {
      const mats = meshRef.current.material as THREE.MeshStandardMaterial[];
      const intensity = emissiveIntensity.get();
      const frontMat = mats[4];
      const backMat = mats[5];

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
    if (disabled) return;
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
    if (disabled) return;
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
 * Animated card that can flip between front and back
 */
export interface FlipCard3DProps extends Omit<Card3DProps, 'faceUp'> {
  faceUp: boolean;
  flipDuration?: number;
}

export function FlipCard3D({
  faceUp,
  flipDuration = 500,
  ...props
}: FlipCard3DProps) {
  return <Card3D {...props} faceUp={faceUp} />;
}

/**
 * Constants for card dimensions
 */
export const CARD_DIMENSIONS = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  depth: CARD_DEPTH,
} as const;
