'use client';

import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { getPlaymatTextureUrl, PLAYMAT_DIMENSIONS, type PlaymatType } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

export interface PlaymatTexture3DProps {
  matType: PlaymatType;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  opacity?: number;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  children?: React.ReactNode;
}

/**
 * Base component for rendering playmat textures as 3D planes.
 * Cards and tokens can be placed on top using the children prop.
 *
 * The mat is rendered flat (lying on the XZ plane) with proper aspect ratio.
 */
export function PlaymatTexture3D({
  matType,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 1,
  onClick,
  onHover,
  children,
}: PlaymatTexture3DProps) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load texture
  const textureUrl = getPlaymatTextureUrl(matType);
  const texture = useLoader(TextureLoader, textureUrl);

  // Configure texture for high quality
  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  // Get dimensions for this mat type
  const dimensions = PLAYMAT_DIMENSIONS[matType];
  const width = dimensions.width * scale;
  const height = dimensions.height * scale;

  // Create geometry - flat plane on XZ axis
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height);
    // Rotate to lie flat (plane is created on XY, we want XZ)
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [width, height]);

  // Create material with texture
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.05,
      transparent: opacity < 1,
      opacity,
      side: THREE.DoubleSide,
    });
  }, [texture, opacity]);

  const handlePointerOver = () => {
    onHover?.(true);
  };

  const handlePointerOut = () => {
    onHover?.(false);
  };

  return (
    <group position={position} rotation={rotation}>
      {/* The textured mat plane */}
      <mesh
        geometry={geometry}
        material={material}
        position={[0, 0, 0]}
        onClick={onClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* Children (cards, tokens) are placed on top */}
      <group position={[0, 0.01, 0]}>
        {children}
      </group>
    </group>
  );
}

/**
 * Get the slot position on a mat given column and row indices.
 * Returns position relative to the mat center.
 */
export function getMatSlotPosition(
  matType: PlaymatType,
  col: number,
  row: number,
  scale: number = 1
): [number, number, number] {
  const dimensions = PLAYMAT_DIMENSIONS[matType];
  const slots = dimensions.slots;

  if (!slots) {
    return [0, 0.02, 0];
  }

  const width = dimensions.width * scale;
  const height = dimensions.height * scale;

  // Calculate slot size
  const slotWidth = width / slots.cols;
  const slotHeight = height / slots.rows;

  // Calculate position from top-left corner
  // X: left to right (negative to positive)
  // Z: top to bottom (negative to positive in our coordinate system)
  const x = -width / 2 + slotWidth / 2 + col * slotWidth;
  const z = -height / 2 + slotHeight / 2 + row * slotHeight;

  return [x, 0.02, z];
}

/**
 * Get the slot dimensions for a mat type
 */
export function getMatSlotDimensions(
  matType: PlaymatType,
  scale: number = 1
): { width: number; height: number } {
  const dimensions = PLAYMAT_DIMENSIONS[matType];
  const slots = dimensions.slots;

  if (!slots) {
    return { width: dimensions.width * scale, height: dimensions.height * scale };
  }

  return {
    width: (dimensions.width * scale) / slots.cols,
    height: (dimensions.height * scale) / slots.rows,
  };
}

/**
 * Export mat dimensions for external use
 */
export { PLAYMAT_DIMENSIONS };
