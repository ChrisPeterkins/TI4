'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Html, Text } from '@react-three/drei';
import type { MapTile } from '@ti4/shared';
import { hexToWorld3D } from './hex3d';
import { HEX_CONFIG, TILE_SIDE_COLOR, HIGHLIGHT_COLORS } from './constants';

interface HexTile3DProps {
  tile: MapTile;
  onHover?: (tile: MapTile | null) => void;
  onClick?: (tile: MapTile) => void;
  onActivate?: (tile: MapTile) => void;  // Left-click when activatable
  onInspect?: (tile: MapTile) => void;   // Right-click to inspect
  isHighlighted?: boolean;
  highlightColor?: string;
  canActivate?: boolean;                  // Whether tile can be activated (tactical action)
  activationColor?: string;               // Color for activation highlight
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
 * Frontier Token - Floating crystal/gem indicating explorable empty space
 */
function FrontierToken3D({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Gentle floating and rotation animation
  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation
      meshRef.current.rotation.y += 0.008;
      // Gentle floating motion
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    }
    if (glowRef.current) {
      // Pulsing glow
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh ref={glowRef} scale={1.6}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshBasicMaterial
          color="#a855f7"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Main crystal */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.15, 0]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#6d28d9"
          emissiveIntensity={0.4}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Inner core */}
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshBasicMaterial color="#c4b5fd" transparent opacity={0.8} />
      </mesh>

      {/* Label */}
      <Text
        position={[0, -0.25, 0]}
        fontSize={0.1}
        color="#a855f7"
        anchorX="center"
        anchorY="top"
        outlineWidth={0.01}
        outlineColor="#1a1a2e"
      >
        FRONTIER
      </Text>
    </group>
  );
}

/**
 * 3D Hexagonal tile with texture
 */
export function HexTile3D({
  tile,
  onHover,
  onClick,
  onActivate,
  onInspect,
  isHighlighted = false,
  highlightColor = HIGHLIGHT_COLORS.valid,
  canActivate = false,
  activationColor = '#22c55e', // Green for tactical activation
}: HexTile3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Calculate world position from hex coordinates
  const position = useMemo(
    () => hexToWorld3D(tile.position),
    [tile.position]
  );

  // Close popup when canActivate changes to false
  useEffect(() => {
    if (!canActivate && showPopup) {
      setShowPopup(false);
    }
  }, [canActivate, showPopup]);

  // Close on Escape key
  useEffect(() => {
    if (!showPopup) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowPopup(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPopup]);

  // Close on click outside
  useEffect(() => {
    if (!showPopup) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false);
      }
    };

    // Delay adding listener to prevent immediate close
    const timeoutId = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  const handleActivate = useCallback(() => {
    onActivate?.(tile);
    setShowPopup(false);
  }, [tile, onActivate]);

  const handleInspect = useCallback(() => {
    onInspect?.(tile);
    setShowPopup(false);
  }, [tile, onInspect]);

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

    // Determine highlight color and intensity
    // Priority: activation (when hovered + can activate) > hover > isHighlighted
    if (isHovered && canActivate) {
      // Strong green glow when hovering over activatable tile
      topMaterial.emissive = new THREE.Color(activationColor);
      topMaterial.emissiveIntensity = 0.5;
      sideMaterial.emissive = new THREE.Color(activationColor);
      sideMaterial.emissiveIntensity = 0.4;
    } else if (canActivate) {
      // Subtle glow for activatable tiles
      topMaterial.emissive = new THREE.Color(activationColor);
      topMaterial.emissiveIntensity = 0.15;
      sideMaterial.emissive = new THREE.Color(activationColor);
      sideMaterial.emissiveIntensity = 0.1;
    } else if (isHovered || isHighlighted) {
      const color = isHovered ? HIGHLIGHT_COLORS.hover : highlightColor;
      topMaterial.emissive = new THREE.Color(color);
      topMaterial.emissiveIntensity = 0.3;
      sideMaterial.emissive = new THREE.Color(color);
      sideMaterial.emissiveIntensity = 0.2;
    }

    return [sideMaterial, topMaterial, bottomMaterial];
  }, [texture, isHovered, isHighlighted, highlightColor, canActivate, activationColor]);

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    onHover?.(tile);
    // Change cursor when hovering activatable tile
    if (canActivate) {
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(false);
    onHover?.(null);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Left-click: show popup if activatable, otherwise call generic onClick
    if (canActivate) {
      setShowPopup(true);
    } else {
      onClick?.(tile);
    }
  };

  const handleContextMenu = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // Prevent browser context menu
    e.nativeEvent.preventDefault();
    // Right-click always inspects
    onInspect?.(tile);
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={materials}
        position={[position.x, HEX_CONFIG.height / 2, position.z]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      />

      {/* Frontier Token - shows on empty systems that can be explored */}
      {tile.frontier && (
        <FrontierToken3D position={[position.x, HEX_CONFIG.height + 0.15, position.z]} />
      )}

      {/* Action confirmation popup */}
      {showPopup && canActivate && (
        <group position={[position.x, HEX_CONFIG.height + 0.5, position.z]}>
          <Html center>
            <div
              ref={popupRef}
              className="bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-600 shadow-2xl p-2 min-w-[140px]"
            >
              <div className="text-gray-400 text-xs text-center mb-2 pb-1 border-b border-gray-700">
                System {tile.systemId}
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); handleActivate(); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-600/80 hover:bg-green-500 text-white text-sm font-medium transition-colors w-full justify-center"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Activate
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleInspect(); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors w-full justify-center"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Inspect
                </button>
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
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
