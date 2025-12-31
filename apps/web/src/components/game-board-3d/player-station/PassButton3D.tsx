'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { configureHighQualityTexture } from '../textureUtils';

// Pass button dimensions (based on 256x384 image aspect ratio)
const BUTTON_WIDTH = 0.4;
const BUTTON_HEIGHT = 0.6;
const BUTTON_DEPTH = 0.01;

export interface PassButton3DProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onPass: () => void;
  canPass: boolean;        // Whether player can legally pass
  hasPassed?: boolean;     // Whether player has already passed
  visible?: boolean;       // Whether to show the button (only for current player)
}

/**
 * A 3D pass button rendered on the player station
 * Uses texture images for pass on/off states
 */
export function PassButton3D({
  position = [0, 0.1, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onPass,
  canPass,
  hasPassed = false,
  visible = true,
}: PassButton3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load both textures
  const passOnTexture = useLoader(TextureLoader, '/images/ui/panel_pass_on.png');
  const passOffTexture = useLoader(TextureLoader, '/images/ui/panel_pass_off.png');

  useEffect(() => {
    if (passOnTexture) {
      configureHighQualityTexture(passOnTexture, maxAnisotropy);
    }
    if (passOffTexture) {
      configureHighQualityTexture(passOffTexture, maxAnisotropy);
    }
  }, [passOnTexture, passOffTexture, maxAnisotropy]);

  // Select texture based on state
  const currentTexture = canPass && !hasPassed ? passOnTexture : passOffTexture;

  const handleClick = useCallback(() => {
    if (canPass && !hasPassed) {
      onPass();
    }
  }, [canPass, hasPassed, onPass]);

  const buttonWidth = BUTTON_WIDTH * scale;
  const buttonHeight = BUTTON_HEIGHT * scale;
  const buttonDepth = BUTTON_DEPTH * scale;

  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(buttonWidth, buttonDepth, buttonHeight);
  }, [buttonWidth, buttonHeight, buttonDepth]);

  const materials = useMemo(() => {
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.8,
      metalness: 0.1,
    });

    const faceMaterial = new THREE.MeshStandardMaterial({
      map: currentTexture,
      roughness: 0.5,
      metalness: 0.05,
      // Dim the button when hovered for feedback, or when passed
      emissive: isHovered && canPass && !hasPassed
        ? new THREE.Color('#ffffff')
        : hasPassed
          ? new THREE.Color('#333333')
          : new THREE.Color('#000000'),
      emissiveIntensity: isHovered && canPass && !hasPassed ? 0.15 : hasPassed ? 0.1 : 0,
      // Reduce opacity when can't pass or already passed
      transparent: !canPass || hasPassed,
      opacity: hasPassed ? 0.5 : canPass ? 1.0 : 0.6,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: '#1e1e1e',
      roughness: 0.6,
      metalness: 0.1,
    });

    // Box geometry faces: +X, -X, +Y (top), -Y (bottom), +Z, -Z
    return [
      edgeMaterial, // +X
      edgeMaterial, // -X
      faceMaterial, // +Y (top - the visible face)
      backMaterial, // -Y (bottom)
      edgeMaterial, // +Z
      edgeMaterial, // -Z
    ];
  }, [currentTexture, isHovered, canPass, hasPassed]);

  if (!visible) return null;

  return (
    <mesh
      geometry={geometry}
      material={materials}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
        if (canPass && !hasPassed) {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setIsHovered(false);
        document.body.style.cursor = 'auto';
      }}
    />
  );
}

/**
 * Export dimensions for layout calculations
 */
export const PASS_BUTTON_DIMENSIONS = {
  width: BUTTON_WIDTH,
  height: BUTTON_HEIGHT,
} as const;
