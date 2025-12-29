'use client';

import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { MapTile } from '@ti4/shared';
import { hexToWorld3D } from './hex3d';
import { HEX_CONFIG, TILE_SIDE_COLOR, HIGHLIGHT_COLORS } from './constants';

interface HexTile3DProps {
  tile: MapTile;
  onHover?: (tile: MapTile | null) => void;
  onClick?: (tile: MapTile) => void;
  isHighlighted?: boolean;
  highlightColor?: string;
}

/**
 * Create a hexagonal cylinder geometry with proper UVs for top face texture
 */
function createHexCylinderGeometry(radius: number, height: number): THREE.CylinderGeometry {
  // CylinderGeometry with 6 radial segments creates a hexagon
  const geo = new THREE.CylinderGeometry(
    radius,    // radiusTop
    radius,    // radiusBottom
    height,    // height
    6,         // radialSegments (6 = hexagon)
    1,         // heightSegments
    false      // openEnded
  );

  // Rotate 30 degrees for flat-top orientation (default is pointy-top)
  geo.rotateY(Math.PI / 6);

  // Fix UVs for the top cap to properly map the square texture
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const normal = geo.attributes.normal;

  for (let i = 0; i < pos.count; i++) {
    const ny = normal.getY(i);

    // Top face vertices (normal pointing up)
    if (ny > 0.9) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Map hex coordinates to UV space (0-1)
      // Hexagon fits in a square, so we map from [-radius, radius] to [0, 1]
      const u = (x / (radius * 2)) + 0.5;
      const v = (z / (radius * 2)) + 0.5;
      uv.setXY(i, u, 1 - v); // Flip V for correct orientation
    }
  }

  uv.needsUpdate = true;
  return geo;
}

/**
 * 3D Hexagonal tile with texture
 */
export function HexTile3D({
  tile,
  onHover,
  onClick,
  isHighlighted = false,
  highlightColor = HIGHLIGHT_COLORS.valid,
}: HexTile3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate world position from hex coordinates
  const position = useMemo(
    () => hexToWorld3D(tile.position),
    [tile.position]
  );

  // Load tile texture
  const textureUrl = `/images/tiles/ST_${tile.systemId}.webp`;
  const texture = useLoader(TextureLoader, textureUrl);

  // Configure texture
  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);

  // Create hex cylinder geometry
  const geometry = useMemo(() => {
    return createHexCylinderGeometry(HEX_CONFIG.radius, HEX_CONFIG.height);
  }, []);

  // Create materials array for the cylinder
  // CylinderGeometry material order: [side, top, bottom]
  const materials = useMemo(() => {
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: TILE_SIDE_COLOR,
      roughness: 0.9,
      metalness: 0.0,
    });

    const topMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.1,
    });

    const bottomMaterial = new THREE.MeshStandardMaterial({
      color: '#0a0a0a',
      roughness: 0.9,
      metalness: 0.0,
    });

    // Highlight effect
    if (isHovered || isHighlighted) {
      const color = isHovered ? HIGHLIGHT_COLORS.hover : highlightColor;
      topMaterial.emissive = new THREE.Color(color);
      topMaterial.emissiveIntensity = 0.3;
      sideMaterial.emissive = new THREE.Color(color);
      sideMaterial.emissiveIntensity = 0.2;
    }

    return [sideMaterial, topMaterial, bottomMaterial];
  }, [texture, isHovered, isHighlighted, highlightColor]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    onHover?.(tile);
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
    onHover?.(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(tile);
  };

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={materials}
      position={[position.x, HEX_CONFIG.height / 2, position.z]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

/**
 * Fallback hex tile when texture fails to load
 */
export function HexTile3DFallback({
  tile,
  color = '#1a237e',
}: {
  tile: MapTile;
  color?: string;
}) {
  const position = useMemo(
    () => hexToWorld3D(tile.position),
    [tile.position]
  );

  const geometry = useMemo(() => {
    return createHexCylinderGeometry(HEX_CONFIG.radius, HEX_CONFIG.height);
  }, []);

  return (
    <mesh
      geometry={geometry}
      position={[position.x, HEX_CONFIG.height / 2, position.z]}
    >
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}
