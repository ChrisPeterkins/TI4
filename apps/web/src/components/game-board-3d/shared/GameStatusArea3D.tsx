'use client';

import { useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Text, Html, RoundedBox } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import type { ActiveLaw, PlayerState, GamePhase } from '@ti4/shared';
import { getCardUrl, getAgendaCardBackUrl } from '@/lib/assets';
import { CARD_DIMENSIONS } from '../cards/Card3D';

// Player color mapping
const PLAYER_COLORS: Record<string, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  orange: '#f97316',
  pink: '#ec4899',
  black: '#374151',
};

export interface GameStatusArea3DProps {
  laws: ActiveLaw[];
  speakerId: string;
  custodiansTaken: boolean;
  players: PlayerState[];
  currentPhase: GamePhase;
  round: number;
}

/**
 * Small law card display
 */
function LawCard3D({
  law,
  position,
}: {
  law: ActiveLaw;
  position: [number, number, number];
}) {
  const texture = useLoader(TextureLoader, getCardUrl('agenda', law.cardId));
  const backTexture = useLoader(TextureLoader, getAgendaCardBackUrl());

  const geometry = useMemo(() => {
    // Smaller card size for compact display
    const scale = 0.6;
    return new THREE.BoxGeometry(
      CARD_DIMENSIONS.width * scale,
      CARD_DIMENSIONS.depth,
      CARD_DIMENSIONS.height * scale
    );
  }, []);

  return (
    <mesh geometry={geometry} position={position}>
      <meshStandardMaterial attach="material-0" color="#1a1a1a" />
      <meshStandardMaterial attach="material-1" color="#1a1a1a" />
      <meshStandardMaterial attach="material-2" map={texture} />
      <meshStandardMaterial attach="material-3" map={backTexture} />
      <meshStandardMaterial attach="material-4" color="#1a1a1a" />
      <meshStandardMaterial attach="material-5" color="#1a1a1a" />
    </mesh>
  );
}

/**
 * GameStatusArea3D - East side area showing game status information
 *
 * Layout (vertical):
 *   [Phase/Round Display]
 *   [Speaker Token]
 *   [Custodians Status]
 *   [Active Laws (if any)]
 */
export function GameStatusArea3D({
  laws,
  speakerId,
  custodiansTaken,
  players,
  currentPhase,
  round,
}: GameStatusArea3DProps) {
  // Find speaker player
  const speakerPlayer = useMemo(
    () => players.find((p) => p.id === speakerId),
    [players, speakerId]
  );

  const speakerColor = speakerPlayer
    ? PLAYER_COLORS[speakerPlayer.color] || '#808080'
    : '#808080';

  // Phase display name
  const phaseName = useMemo(() => {
    switch (currentPhase) {
      case 'setup':
        return 'Setup';
      case 'strategy':
        return 'Strategy';
      case 'action':
        return 'Action';
      case 'status':
        return 'Status';
      case 'agenda':
        return 'Agenda';
      default:
        return currentPhase;
    }
  }, [currentPhase]);

  return (
    <group name="game-status-area">
      {/* Area title */}
      <Text
        position={[0, 0.5, -2.5]}
        fontSize={0.2}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        GAME STATUS
      </Text>

      {/* Round and Phase Display */}
      <group position={[0, 0.1, -1.8]}>
        <RoundedBox args={[2, 0.05, 0.8]} radius={0.02} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1a1a2e" />
        </RoundedBox>
        <Text
          position={[0, 0.04, -0.15]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          Round {round}
        </Text>
        <Text
          position={[0, 0.04, 0.15]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.12}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          {phaseName} Phase
        </Text>
      </group>

      {/* Speaker Token */}
      <group position={[0, 0.1, -0.8]}>
        <RoundedBox args={[2, 0.05, 0.8]} radius={0.02} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1a1a2e" />
        </RoundedBox>
        {/* Speaker icon (gavel shape approximation) */}
        <mesh position={[-0.5, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 32]} />
          <meshStandardMaterial color={speakerColor} />
        </mesh>
        <Text
          position={[0.2, 0.04, -0.1]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.1}
          color="#aaaaaa"
          anchorX="left"
          anchorY="middle"
        >
          Speaker
        </Text>
        <Text
          position={[0.2, 0.04, 0.12]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.12}
          color={speakerColor}
          anchorX="left"
          anchorY="middle"
          fontWeight="bold"
        >
          {speakerPlayer?.name || 'Unknown'}
        </Text>
      </group>

      {/* Custodians Token Status */}
      <group position={[0, 0.1, 0.2]}>
        <RoundedBox args={[2, 0.05, 0.6]} radius={0.02} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1a1a2e" />
        </RoundedBox>
        {/* Custodians icon */}
        <mesh position={[-0.5, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.12, 32]} />
          <meshStandardMaterial
            color={custodiansTaken ? '#666666' : '#fbbf24'}
          />
        </mesh>
        <Text
          position={[0.2, 0.04, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.1}
          color={custodiansTaken ? '#666666' : '#fbbf24'}
          anchorX="left"
          anchorY="middle"
        >
          {custodiansTaken ? 'Custodians Claimed' : 'Custodians on Mecatol'}
        </Text>
      </group>

      {/* Active Laws Section */}
      <group position={[0, 0.1, 1.2]}>
        <Text
          position={[0, 0.04, -0.5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.1}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          Active Laws ({laws.length})
        </Text>

        {/* Law cards (show up to 4 in a row) */}
        {laws.length > 0 ? (
          <group position={[0, 0, 0]}>
            {laws.slice(0, 4).map((law, index) => (
              <Suspense key={law.cardId} fallback={null}>
                <LawCard3D
                  law={law}
                  position={[
                    (index - (Math.min(laws.length, 4) - 1) / 2) * 0.5,
                    0.03,
                    0,
                  ]}
                />
              </Suspense>
            ))}
            {laws.length > 4 && (
              <Text
                position={[1.2, 0.04, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.08}
                color="#666666"
                anchorX="left"
                anchorY="middle"
              >
                +{laws.length - 4} more
              </Text>
            )}
          </group>
        ) : (
          <RoundedBox
            args={[1.5, 0.02, 0.5]}
            radius={0.02}
            position={[0, 0.02, 0]}
          >
            <meshStandardMaterial color="#222222" transparent opacity={0.5} />
          </RoundedBox>
        )}
      </group>
    </group>
  );
}
