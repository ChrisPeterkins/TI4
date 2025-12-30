'use client';

import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import {
  getCommandTokenUrl,
  getTradeGoodTokenUrl,
  getCommodityTokenUrl,
  getFighterTokenUrl,
  getInfantryTokenUrl,
} from '@/lib/assets';

// Token dimensions
const TOKEN_RADIUS = 0.15;
const TOKEN_HEIGHT = 0.02;
const STACK_OFFSET = 0.015; // Vertical offset per token in stack
const MAX_VISIBLE_TOKENS = 10;

export type TokenType = 'command' | 'trade_good' | 'commodity' | 'fighter' | 'infantry';

export interface TokenStack3DProps {
  tokenType: TokenType;
  count: number;
  factionId?: string; // Required for command tokens
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  label?: string;
  showCount?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  color?: string; // Override color for non-textured tokens
}

/**
 * Get texture URL based on token type
 */
function getTokenTextureUrl(tokenType: TokenType, factionId?: string): string | null {
  switch (tokenType) {
    case 'command':
      return factionId ? getCommandTokenUrl(factionId) : null;
    case 'trade_good':
      return getTradeGoodTokenUrl();
    case 'commodity':
      return getCommodityTokenUrl();
    case 'fighter':
      return getFighterTokenUrl();
    case 'infantry':
      return getInfantryTokenUrl();
    default:
      return null;
  }
}

/**
 * Default colors for token types (fallback when no texture)
 */
const TOKEN_COLORS: Record<TokenType, string> = {
  command: '#666666',
  trade_good: '#fbbf24',
  commodity: '#60a5fa',
  fighter: '#f97316',
  infantry: '#22c55e',
};

/**
 * Individual token component
 */
function Token3DElement({
  texture,
  color,
  position,
  rotation,
  isTop,
  isHovered,
  highlightColor = '#ffffff',
}: {
  texture: THREE.Texture | null;
  color: string;
  position: [number, number, number];
  rotation: [number, number, number];
  isTop: boolean;
  isHovered: boolean;
  highlightColor?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create geometry
  const geometry = useMemo(() => {
    return new THREE.CylinderGeometry(TOKEN_RADIUS, TOKEN_RADIUS, TOKEN_HEIGHT, 32);
  }, []);

  // Create materials
  const materials = useMemo(() => {
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.1,
    });

    const topMaterial = texture
      ? new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.5,
          metalness: 0.0,
        })
      : new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.5,
          metalness: 0.0,
        });

    const bottomMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.9,
      metalness: 0.0,
    });

    // Cylinder materials: [side, top cap, bottom cap]
    return [sideMaterial, topMaterial, bottomMaterial];
  }, [texture, color]);

  // Emissive effect for top token when hovered
  useFrame(() => {
    if (meshRef.current && isTop) {
      const mats = meshRef.current.material as THREE.MeshStandardMaterial[];
      const topMat = mats[1];
      if (topMat) {
        topMat.emissive = new THREE.Color(isHovered ? highlightColor : '#000000');
        topMat.emissiveIntensity = isHovered ? 0.3 : 0;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={materials}
      position={position}
      rotation={rotation}
    />
  );
}

/**
 * Textured token stack component with loading
 */
function TexturedTokenStack({
  textureUrl,
  tokenType,
  count,
  position,
  rotation,
  color,
  isHovered,
}: {
  textureUrl: string;
  tokenType: TokenType;
  count: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  isHovered: boolean;
}) {
  const texture = useLoader(TextureLoader, textureUrl);

  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    }
  }, [texture]);

  const visibleCount = Math.min(count, MAX_VISIBLE_TOKENS);

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: visibleCount }).map((_, i) => (
        <Token3DElement
          key={i}
          texture={texture}
          color={color}
          position={[
            (Math.random() - 0.5) * 0.02, // Slight random offset for natural look
            i * STACK_OFFSET,
            (Math.random() - 0.5) * 0.02,
          ]}
          rotation={[0, Math.random() * 0.2, 0]} // Slight random rotation
          isTop={i === visibleCount - 1}
          isHovered={isHovered}
        />
      ))}
    </group>
  );
}

/**
 * Fallback non-textured token stack
 */
function ColoredTokenStack({
  tokenType,
  count,
  position,
  rotation,
  color,
  isHovered,
}: {
  tokenType: TokenType;
  count: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  isHovered: boolean;
}) {
  const visibleCount = Math.min(count, MAX_VISIBLE_TOKENS);

  return (
    <group position={position} rotation={rotation}>
      {Array.from({ length: visibleCount }).map((_, i) => (
        <Token3DElement
          key={i}
          texture={null}
          color={color}
          position={[
            (Math.random() - 0.5) * 0.02,
            i * STACK_OFFSET,
            (Math.random() - 0.5) * 0.02,
          ]}
          rotation={[0, Math.random() * 0.2, 0]}
          isTop={i === visibleCount - 1}
          isHovered={isHovered}
        />
      ))}
    </group>
  );
}

/**
 * A 3D stack of tokens with count badge
 */
export function TokenStack3D({
  tokenType,
  count,
  factionId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  label,
  showCount = true,
  onClick,
  onHover,
  color,
}: TokenStack3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Spring animation for hover
  const { scaleValue } = useSpring({
    scaleValue: isHovered ? 1.1 : 1,
    config: { mass: 1, tension: 300, friction: 20 },
  });

  // Get texture URL
  const textureUrl = getTokenTextureUrl(tokenType, factionId);

  // Determine color
  const tokenColor = color || TOKEN_COLORS[tokenType];

  // Don't render if count is 0
  if (count === 0) {
    return null;
  }

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    onHover?.(true);
    if (onClick) {
      document.body.style.cursor = 'pointer';
    }
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

  const stackHeight = Math.min(count, MAX_VISIBLE_TOKENS) * STACK_OFFSET;

  return (
    <animated.group
      ref={groupRef}
      scale={scaleValue.to((s) => s * scale)}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Token stack */}
      {textureUrl ? (
        <Suspense
          fallback={
            <ColoredTokenStack
              tokenType={tokenType}
              count={count}
              position={position}
              rotation={rotation}
              color={tokenColor}
              isHovered={isHovered}
            />
          }
        >
          <TexturedTokenStack
            textureUrl={textureUrl}
            tokenType={tokenType}
            count={count}
            position={position}
            rotation={rotation}
            color={tokenColor}
            isHovered={isHovered}
          />
        </Suspense>
      ) : (
        <ColoredTokenStack
          tokenType={tokenType}
          count={count}
          position={position}
          rotation={rotation}
          color={tokenColor}
          isHovered={isHovered}
        />
      )}

      {/* Count badge */}
      {showCount && count > 0 && (
        <Text
          position={[position[0], position[1] + stackHeight + 0.08, position[2]]}
          fontSize={0.12}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {count}
        </Text>
      )}

      {/* Label */}
      {label && (
        <Text
          position={[position[0], position[1] - 0.05, position[2] + TOKEN_RADIUS + 0.08]}
          fontSize={0.06}
          color="#999999"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </animated.group>
  );
}

/**
 * Constants for token dimensions
 */
export const TOKEN_DIMENSIONS = {
  radius: TOKEN_RADIUS,
  height: TOKEN_HEIGHT,
  stackOffset: STACK_OFFSET,
} as const;
