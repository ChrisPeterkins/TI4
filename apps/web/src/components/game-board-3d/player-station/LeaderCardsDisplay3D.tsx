'use client';

import { useMemo, Suspense, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, ThreeEvent, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { Text, Html } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import { getLeaderCardUrl, getLeaderCardBackUrl } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';
import { PlayerTargetSelector3D, type TargetablePlayer } from './PlayerTargetSelector3D';

// Leader card dimensions (wider aspect ratio)
const CARD_WIDTH = 1.4;
const CARD_HEIGHT = 1.05;
const CARD_DEPTH = 0.008;
const CARD_SPACING = 1.5;

// Leader types
export type LeaderType = 'agent' | 'commander' | 'hero';

// Commander unlock progress tracking
export interface UnlockProgress {
  current: number;
  required: number;
  description: string;  // e.g., "infantry on planets", "technologies", "trade goods"
}

// Leader state
export interface LeaderCardState {
  unlocked: boolean;
  exhausted?: boolean; // Only for agents
  purged?: boolean;    // Only for heroes (used)
  unlockProgress?: UnlockProgress; // Commander unlock progress
}

// Leader card data
export interface LeaderCardData {
  id: string;
  name: string;
  type: LeaderType;
  state: LeaderCardState;
  abilityDescription?: string; // The ability text
  canTargetOthers?: boolean;   // Whether this leader can target other players
}

export interface LeaderCardsDisplay3DProps {
  leaders: LeaderCardData[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  faceUp?: boolean;
  /** Called when a leader is clicked (for non-targeting abilities or inspection) */
  onLeaderClick?: (leaderId: string, leaderType: LeaderType) => void;
  /** Called when a leader ability targets another player */
  onLeaderTargetPlayer?: (leaderId: string, leaderType: LeaderType, targetPlayerId: string) => void;
  onLeaderHover?: (leaderId: string | null) => void;
  /** List of players that can be targeted (required for targeting abilities) */
  targetablePlayers?: TargetablePlayer[];
  /** The current player's ID (used to exclude self from targeting) */
  currentPlayerId?: string;
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

  // Load card textures (both front and back)
  const frontTextureUrl = getLeaderCardUrl(leader.id);
  const backTextureUrl = getLeaderCardBackUrl();
  const frontTexture = useLoader(TextureLoader, frontTextureUrl);
  const backTexture = useLoader(TextureLoader, backTextureUrl);

  useEffect(() => {
    [frontTexture, backTexture].forEach((tex) => {
      if (tex) {
        configureHighQualityTexture(tex, maxAnisotropy);
      }
    });
  }, [frontTexture, backTexture, maxAnisotropy]);

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

    // Top face shows front or back texture depending on faceUp
    const topMaterial = new THREE.MeshStandardMaterial({
      map: faceUp ? frontTexture : backTexture,
      color: cardColor,
      roughness: 0.5,
      metalness: 0.05,
      transparent: true,
      opacity,
      emissive,
      emissiveIntensity,
    });

    // Bottom face shows the opposite texture
    const bottomMaterial = new THREE.MeshStandardMaterial({
      map: faceUp ? backTexture : frontTexture,
      roughness: 0.6,
      metalness: 0.1,
    });

    return [
      edgeMaterial,
      edgeMaterial,
      topMaterial,  // Top
      bottomMaterial,  // Bottom
      edgeMaterial,
      edgeMaterial,
    ];
  }, [frontTexture, backTexture, faceUp, typeColor, isLocked, isExhausted, isPurged]);

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

      {/* Lock overlay for locked leaders - show unlock progress for commanders */}
      {isLocked && (
        <group position={[0, 0.03, 0]}>
          {leader.type === 'commander' && leader.state.unlockProgress ? (
            // Show unlock progress bar for commanders
            <>
              {/* Progress bar background */}
              <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[cardWidth * 0.7, 0.08 * scale]} />
                <meshStandardMaterial color="#1a1a1a" transparent opacity={0.9} />
              </mesh>
              {/* Progress bar fill */}
              <mesh
                position={[
                  -cardWidth * 0.35 * (1 - leader.state.unlockProgress.current / leader.state.unlockProgress.required),
                  0.001,
                  0
                ]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[
                  cardWidth * 0.7 * Math.min(1, leader.state.unlockProgress.current / leader.state.unlockProgress.required),
                  0.06 * scale
                ]} />
                <meshStandardMaterial color={typeColor} transparent opacity={0.8} />
              </mesh>
              {/* Progress text */}
              <Text
                position={[0, 0.015, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.04 * scale}
                color="white"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                {`${leader.state.unlockProgress.current}/${leader.state.unlockProgress.required}`}
              </Text>
            </>
          ) : (
            // Default lock icon for agents and heroes
            <>
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
            </>
          )}
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

      {/* Hover tooltip with ability description */}
      {isHovered && (
        <Html position={[0, 0.25, 0]} center>
          <div className="bg-gray-900/95 text-white text-xs px-3 py-2 rounded max-w-64 shadow-lg border border-gray-700">
            {/* Header with type and name */}
            <div className="font-bold text-sm" style={{ color: typeColor }}>
              {LEADER_TYPE_LABELS[leader.type]}
            </div>
            <div className="text-white font-medium text-sm mb-1">{leader.name}</div>

            {/* Ability description */}
            {leader.abilityDescription && (
              <div className="text-gray-300 text-[10px] leading-relaxed mb-2 border-t border-gray-700 pt-1 mt-1">
                {leader.abilityDescription}
              </div>
            )}

            {/* Status indicator */}
            <div className="text-[10px] font-medium pt-1 border-t border-gray-700">
              {isLocked && leader.type === 'commander' && leader.state.unlockProgress && (
                <div className="text-amber-400">
                  Unlock: {leader.state.unlockProgress.current}/{leader.state.unlockProgress.required} {leader.state.unlockProgress.description}
                </div>
              )}
              {isLocked && (!leader.state.unlockProgress || leader.type !== 'commander') && (
                <div className="text-gray-500">
                  {leader.type === 'agent' && '🔒 Agents are unlocked at game start'}
                  {leader.type === 'commander' && '🔒 Unlock condition not met'}
                  {leader.type === 'hero' && '🔒 Score 3 objectives to unlock'}
                </div>
              )}
              {!isLocked && isExhausted && (
                <div className="text-gray-500">⏸️ Exhausted - refreshes in Status Phase</div>
              )}
              {!isLocked && isPurged && (
                <div className="text-red-400">✖ Purged - hero ability used</div>
              )}
              {!isLocked && !isExhausted && !isPurged && (
                <div className="text-green-400">
                  ✓ Ready
                  {leader.canTargetOthers && <span className="text-blue-400 ml-1">(can target players)</span>}
                </div>
              )}
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

// State for tracking which leader is currently selecting a target
interface TargetingState {
  leaderId: string;
  leaderType: LeaderType;
  leaderName: string;
}

/**
 * Display of leader cards (Agent, Commander, Hero)
 * Shows 3 cards side by side with state indicators
 * Supports target selection for abilities that can target other players
 */
export function LeaderCardsDisplay3D({
  leaders,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  faceUp = true,
  onLeaderClick,
  onLeaderTargetPlayer,
  onLeaderHover,
  targetablePlayers = [],
  currentPlayerId,
}: LeaderCardsDisplay3DProps) {
  const [hoveredLeaderId, setHoveredLeaderId] = useState<string | null>(null);
  const [targetingState, setTargetingState] = useState<TargetingState | null>(null);

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
    const leader = leaders.find(l => l.id === leaderId);

    // If this leader can target other players and we have players to target
    if (leader?.canTargetOthers && targetablePlayers.length > 0 && onLeaderTargetPlayer) {
      // Check if the leader is usable (unlocked, not exhausted/purged)
      const isUsable = leader.state.unlocked &&
        !(leader.type === 'agent' && leader.state.exhausted) &&
        !(leader.type === 'hero' && leader.state.purged);

      if (isUsable) {
        // Open target selection
        setTargetingState({
          leaderId,
          leaderType,
          leaderName: leader.name,
        });
        return;
      }
    }

    // Otherwise, just call the regular click handler (for inspection, etc.)
    onLeaderClick?.(leaderId, leaderType);
  }, [leaders, targetablePlayers, onLeaderTargetPlayer, onLeaderClick]);

  const handleTargetSelect = useCallback((targetPlayerId: string) => {
    if (targetingState && onLeaderTargetPlayer) {
      onLeaderTargetPlayer(targetingState.leaderId, targetingState.leaderType, targetPlayerId);
    }
    setTargetingState(null);
  }, [targetingState, onLeaderTargetPlayer]);

  const handleTargetCancel = useCallback(() => {
    setTargetingState(null);
  }, []);

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

      {/* Target selection popup */}
      {targetingState && (
        <PlayerTargetSelector3D
          position={[0, 0.6, 0]}
          players={targetablePlayers}
          onSelect={handleTargetSelect}
          onCancel={handleTargetCancel}
          title={`Use ${targetingState.leaderName}`}
          description="Select a player to target"
          currentPlayerId={currentPlayerId}
          allowSelf={false}
        />
      )}
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
