'use client';

import { useMemo, Suspense, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text, Html } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { getLeaderCardUrl } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Leader card dimensions (similar to action cards but slightly larger)
const CARD_WIDTH = 0.7;
const CARD_HEIGHT = 1.05;
const CARD_DEPTH = 0.008;
const CARD_SPACING = 0.75;

// Leader types
export type LeaderType = 'agent' | 'commander' | 'hero';

// Leader state
export interface LeaderCardState {
  unlocked: boolean;
  exhausted?: boolean; // Only for agents
  purged?: boolean;    // Only for heroes (used)
}

// Leader card data
export interface LeaderCardData {
  id: string;
  name: string;
  type: LeaderType;
  state: LeaderCardState;
}

export interface LeaderCardsDisplay3DProps {
  leaders: LeaderCardData[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  faceUp?: boolean;
  onLeaderClick?: (leaderId: string, leaderType: LeaderType) => void;
  onLeaderHover?: (leaderId: string | null) => void;
}

// Leader type colors for visual distinction
const LEADER_TYPE_COLORS: Record<LeaderType, string> = {
  agent: '#22c55e',      // Green
  commander: '#f59e0b',  // Amber
  hero: '#ef4444',       // Red
};

// Leader type labels
const LEADER_TYPE_LABELS: Record<LeaderType, string> = {
  agent: 'AGENT',
  commander: 'COMMANDER',
  hero: 'HERO',
};

/**
 * Individual leader card with texture
 */
function LeaderCard({
  leader,
  position,
  scale,
  faceUp,
  isHovered,
  onClick,
  onHover,
}: {
  leader: LeaderCardData;
  position: [number, number, number];
  scale: number;
  faceUp: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load card texture
  const textureUrl = getLeaderCardUrl(leader.id);
  const texture = useLoader(TextureLoader, textureUrl);

  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  const cardWidth = CARD_WIDTH * scale;
  const cardHeight = CARD_HEIGHT * scale;
  const cardDepth = CARD_DEPTH * scale;

  // Determine visual state
  const isLocked = !leader.state.unlocked;
  const isExhausted = leader.type === 'agent' && leader.state.exhausted;
  const isPurged = leader.type === 'hero' && leader.state.purged;
  const typeColor = LEADER_TYPE_COLORS[leader.type];

  // Spring animation for hover
  const { positionY, scaleVal } = useSpring({
    positionY: isHovered ? 0.08 : 0,
    scaleVal: isHovered ? 1.08 : 1,
    config: { mass: 1, tension: 300, friction: 20 },
  });

  // Geometry
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(cardWidth, cardDepth, cardHeight);
  }, [cardWidth, cardHeight, cardDepth]);

  // Materials
  const materials = useMemo(() => {
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: typeColor,
      roughness: 0.6,
      metalness: 0.2,
    });

    // Determine card appearance based on state
    let cardColor = '#ffffff';
    let opacity = 1;
    let emissive = new THREE.Color('#000000');
    let emissiveIntensity = 0;

    if (isPurged) {
      opacity = 0.3;
      cardColor = '#1a1a1a';
    } else if (isLocked) {
      opacity = 0.5;
      cardColor = '#2a2a2a';
    } else if (isExhausted) {
      opacity = 0.7;
    } else {
      emissive = new THREE.Color(typeColor);
      emissiveIntensity = 0.1;
    }

    const frontMaterial = new THREE.MeshStandardMaterial({
      map: faceUp ? texture : null,
      color: faceUp ? cardColor : '#1e3a5f',
      roughness: 0.5,
      metalness: 0.05,
      transparent: true,
      opacity,
      emissive,
      emissiveIntensity,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: '#1e3a5f',
      roughness: 0.6,
      metalness: 0.1,
    });

    return [
      edgeMaterial,
      edgeMaterial,
      frontMaterial, // Top
      backMaterial,  // Bottom
      edgeMaterial,
      edgeMaterial,
    ];
  }, [texture, faceUp, typeColor, isLocked, isExhausted, isPurged]);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(true);
    document.body.style.cursor = 'pointer';
  }, [onHover]);

  const handlePointerOut = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(false);
    document.body.style.cursor = 'auto';
  }, [onHover]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  }, [onClick]);

  // Rotation for exhausted state
  const cardRotation = isExhausted ? Math.PI / 2 : 0;

  return (
    <group position={position}>
      <animated.mesh
        geometry={geometry}
        material={materials}
        position-y={positionY}
        scale={scaleVal}
        rotation={[0, cardRotation, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />

      {/* Type indicator badge */}
      <group position={[0, 0.02, -cardHeight / 2 - 0.08 * scale]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[cardWidth * 0.8, 0.12 * scale]} />
          <meshStandardMaterial
            color={isLocked || isPurged ? '#333333' : typeColor}
            transparent
            opacity={isLocked ? 0.5 : 0.9}
          />
        </mesh>
        <Text
          position={[0, 0.01, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.05 * scale}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {LEADER_TYPE_LABELS[leader.type]}
        </Text>
      </group>

      {/* Lock overlay for locked leaders */}
      {isLocked && (
        <group position={[0, 0.03, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15 * scale, 32]} />
            <meshStandardMaterial
              color="#1a1a1a"
              transparent
              opacity={0.9}
            />
          </mesh>
          <Text
            position={[0, 0.01, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.12 * scale}
            color="#666666"
            anchorX="center"
            anchorY="middle"
          >
            🔒
          </Text>
        </group>
      )}

      {/* Purged overlay for used heroes */}
      {isPurged && (
        <group position={[0, 0.03, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[cardWidth * 0.8, 0.2 * scale]} />
            <meshStandardMaterial
              color="#1a1a1a"
              transparent
              opacity={0.9}
            />
          </mesh>
          <Text
            position={[0, 0.01, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.06 * scale}
            color="#ef4444"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            PURGED
          </Text>
        </group>
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <Html position={[0, 0.25, 0]} center>
          <div className="bg-gray-900/95 text-white text-xs px-3 py-2 rounded whitespace-nowrap max-w-48">
            <div className="font-bold" style={{ color: typeColor }}>
              {LEADER_TYPE_LABELS[leader.type]}
            </div>
            <div className="text-white font-medium">{leader.name}</div>
            <div className="text-gray-400 mt-1 text-[10px]">
              {isLocked && 'Locked - unlock condition not met'}
              {!isLocked && isExhausted && 'Exhausted - used this round'}
              {!isLocked && isPurged && 'Purged - hero ability used'}
              {!isLocked && !isExhausted && !isPurged && 'Ready'}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Fallback card (loading state)
 */
function FallbackCard({
  position,
  scale,
  leaderType,
}: {
  position: [number, number, number];
  scale: number;
  leaderType: LeaderType;
}) {
  const cardWidth = CARD_WIDTH * scale;
  const cardHeight = CARD_HEIGHT * scale;

  return (
    <mesh position={position}>
      <boxGeometry args={[cardWidth, CARD_DEPTH * scale, cardHeight]} />
      <meshStandardMaterial color={LEADER_TYPE_COLORS[leaderType]} opacity={0.3} transparent />
    </mesh>
  );
}

/**
 * Display of leader cards (Agent, Commander, Hero)
 * Shows 3 cards side by side with state indicators
 */
export function LeaderCardsDisplay3D({
  leaders,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  faceUp = true,
  onLeaderClick,
  onLeaderHover,
}: LeaderCardsDisplay3DProps) {
  const [hoveredLeaderId, setHoveredLeaderId] = useState<string | null>(null);

  // Sort leaders by type order: agent, commander, hero
  const sortedLeaders = useMemo(() => {
    const typeOrder: LeaderType[] = ['agent', 'commander', 'hero'];
    return [...leaders].sort((a, b) =>
      typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
    );
  }, [leaders]);

  // Calculate positions for each card
  const getCardPosition = useCallback((index: number): [number, number, number] => {
    const totalWidth = (sortedLeaders.length - 1) * CARD_SPACING * scale;
    const startX = -totalWidth / 2;
    return [startX + index * CARD_SPACING * scale, 0, 0];
  }, [sortedLeaders.length, scale]);

  const handleLeaderClick = useCallback((leaderId: string, leaderType: LeaderType) => {
    onLeaderClick?.(leaderId, leaderType);
  }, [onLeaderClick]);

  const handleLeaderHover = useCallback((leaderId: string | null) => {
    setHoveredLeaderId(leaderId);
    onLeaderHover?.(leaderId);
  }, [onLeaderHover]);

  // Don't render if no leaders
  if (leaders.length === 0) {
    return null;
  }

  return (
    <group position={position} rotation={rotation}>
      {/* Background area */}
      <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[(sortedLeaders.length * CARD_SPACING + 0.3) * scale, (CARD_HEIGHT + 0.5) * scale]} />
        <meshStandardMaterial
          color="#0a0a15"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Title */}
      <Text
        position={[0, 0.02, -(CARD_HEIGHT / 2 + 0.3) * scale]}
        fontSize={0.08 * scale}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        LEADERS
      </Text>

      {/* Leader cards */}
      {sortedLeaders.map((leader, index) => (
        <Suspense
          key={leader.id}
          fallback={
            <FallbackCard
              position={getCardPosition(index)}
              scale={scale}
              leaderType={leader.type}
            />
          }
        >
          <LeaderCard
            leader={leader}
            position={getCardPosition(index)}
            scale={scale}
            faceUp={faceUp}
            isHovered={hoveredLeaderId === leader.id}
            onClick={() => handleLeaderClick(leader.id, leader.type)}
            onHover={(hovered) => handleLeaderHover(hovered ? leader.id : null)}
          />
        </Suspense>
      ))}
    </group>
  );
}

/**
 * Export dimensions for layout calculations
 */
export const LEADER_CARDS_DIMENSIONS = {
  cardWidth: CARD_WIDTH,
  cardHeight: CARD_HEIGHT,
  cardSpacing: CARD_SPACING,
  totalWidth: (count: number) => count * CARD_SPACING,
} as const;
