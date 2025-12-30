'use client';

import { useMemo, Suspense, useState, useCallback } from 'react';
import { Html, Text } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { PlayerState, GameState, UnitType } from '@ti4/shared';
import { factions } from '@ti4/game-data';
import { hexToWorld3D, getHexBounds3D } from './hex3d';
import { PLAYER_COLORS_3D } from './constants';
import {
  FactionSheet3D,
  CommandSheet3D,
  StrategyCardHolder3D,
  VPTrack3D,
  CardHand3D,
  TechnologyDisplay3D,
  UnitSupplyArea3D,
  PlayerStationLOD,
  type TechnologyCard,
  type CardHandCard,
} from './player-station';

interface PlayerStationCallbacks {
  onFactionClick?: (playerId: string, factionId: string, faceUp: boolean) => void;
  onStrategyCardClick?: (playerId: string, cardNumber: number) => void;
  onActionCardClick?: (playerId: string, cardId: string) => void;
  onSecretObjectiveClick?: (playerId: string, cardId: string) => void;
  onPromissoryClick?: (playerId: string, cardId: string) => void;
  onTechClick?: (playerId: string, techId: string) => void;
  onTradeGoodsClick?: (playerId: string) => void;
  onStationFocus?: (playerId: string, position: THREE.Vector3, rotation: number) => void;
}

interface PlayerStation3DProps extends PlayerStationCallbacks {
  player: PlayerState;
  gameState: GameState;
  isCurrentPlayer: boolean;
  isActivePlayer: boolean;
  onStationClick?: () => void;
  enhanced?: boolean; // Use new 3D components
  useLOD?: boolean; // Use Level of Detail optimization
  isInspectingCard?: boolean; // Hide overlays when inspecting a card
}

/**
 * Calculate the position for a player station based on their home system
 * Positions the station outside the board, aligned with their home system
 */
function calculateStationPosition(
  player: PlayerState,
  gameState: GameState
): { position: THREE.Vector3; rotation: number } {
  // Get faction's home system ID
  const faction = factions[player.faction];
  const homeSystemId = faction?.homeSystemId;

  // Find the tile with this home system
  const homeTile = gameState.map.tiles.find(
    (tile) => tile.systemId === homeSystemId
  );

  // Get the center of the board
  const positions = gameState.map.tiles.map((t) => t.position);
  const bounds = getHexBounds3D(positions);
  const boardCenter = bounds.center;

  // If we found the home tile, position station in that direction
  if (homeTile) {
    const homeWorldPos = hexToWorld3D(homeTile.position);

    // Calculate direction from center to home system
    const direction = new THREE.Vector3()
      .subVectors(homeWorldPos, boardCenter)
      .normalize();

    // Calculate distance based on board size
    const boardRadius = Math.max(
      bounds.max.x - bounds.min.x,
      bounds.max.z - bounds.min.z
    ) / 2;

    // Position station outside the board (1.5x the radius + offset)
    const stationDistance = boardRadius + 6; // Increased for larger station
    const stationPos = boardCenter.clone().add(direction.multiplyScalar(stationDistance));
    stationPos.y = 0.1; // Slightly above the plane

    // Calculate rotation to face outward (toward the player, away from center)
    const rotation = Math.atan2(direction.x, direction.z);

    return { position: stationPos, rotation };
  }

  // Fallback: position based on seat index around the board
  const seatIndex = player.seatIndex;
  const totalSeats = gameState.players.length;
  const angle = (seatIndex / totalSeats) * Math.PI * 2 - Math.PI / 2;

  const boardRadius = Math.max(
    bounds.max.x - bounds.min.x,
    bounds.max.z - bounds.min.z
  ) / 2;
  const stationDistance = boardRadius + 6;

  const stationPos = new THREE.Vector3(
    boardCenter.x + Math.cos(angle) * stationDistance,
    0.1,
    boardCenter.z + Math.sin(angle) * stationDistance
  );

  // Face outward (toward the player, away from center)
  const rotation = angle;

  return { position: stationPos, rotation };
}

/**
 * Convert player technologies to TechnologyCard format
 */
function getTechnologyCards(player: PlayerState): TechnologyCard[] {
  return player.technologies.map((techId) => {
    // Determine tech type from ID prefix or other logic
    let type: TechnologyCard['type'] = 'unit';
    if (techId.includes('carrier') || techId.includes('cruiser') || techId.includes('destroyer') ||
        techId.includes('dreadnought') || techId.includes('fighter') || techId.includes('infantry') ||
        techId.includes('pds') || techId.includes('war_sun')) {
      type = 'unit';
    } else if (techId.includes('antimass') || techId.includes('gravity') || techId.includes('fleet') ||
               techId.includes('light_wave') || techId.includes('dark_energy')) {
      type = 'blue';
    } else if (techId.includes('neural') || techId.includes('bio') || techId.includes('hyper') ||
               techId.includes('x89') || techId.includes('dacxive') || techId.includes('psycho')) {
      type = 'green';
    } else if (techId.includes('plasma') || techId.includes('magen') || techId.includes('duranium') ||
               techId.includes('assault') || techId.includes('ai_development')) {
      type = 'red';
    } else if (techId.includes('sarween') || techId.includes('graviton') || techId.includes('transit') ||
               techId.includes('integrated') || techId.includes('scanlink')) {
      type = 'yellow';
    }

    return {
      id: techId,
      name: techId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      type,
    };
  });
}

/**
 * Convert action cards to CardHandCard format
 */
function getActionCards(player: PlayerState): CardHandCard[] {
  return player.actionCards.map((cardId) => ({
    id: cardId,
    name: cardId.replace(/_/g, ' '),
  }));
}

/**
 * Convert secret objectives to CardHandCard format
 */
function getSecretObjectives(player: PlayerState): CardHandCard[] {
  return player.secretObjectives.map((objId) => ({
    id: objId,
    name: objId.replace(/_/g, ' '),
  }));
}

/**
 * Convert promissory notes to CardHandCard format
 */
function getPromissoryNotes(player: PlayerState): CardHandCard[] {
  return player.promissoryNotesInHand.map((noteId) => ({
    id: noteId,
    name: noteId.replace(/_/g, ' '),
  }));
}

/**
 * Enhanced 3D Player Station with real game assets
 */
function EnhancedPlayerStation3D({
  player,
  gameState,
  isCurrentPlayer,
  isActivePlayer,
  onStationClick,
  onFactionClick,
  onStrategyCardClick,
  onActionCardClick,
  onSecretObjectiveClick,
  onPromissoryClick,
  onTechClick,
  onTradeGoodsClick,
  onStationFocus,
  isInspectingCard = false,
}: Omit<PlayerStation3DProps, 'enhanced'>) {
  const { position, rotation } = useMemo(
    () => calculateStationPosition(player, gameState),
    [player, gameState]
  );

  const [factionSheetFlipped, setFactionSheetFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const playerColor = PLAYER_COLORS_3D[player.color];
  const faction = factions[player.faction];

  // Prepare data for components
  const technologies = useMemo(() => getTechnologyCards(player), [player.technologies]);
  const actionCards = useMemo(() => getActionCards(player), [player.actionCards]);
  const secretObjectives = useMemo(() => getSecretObjectives(player), [player.secretObjectives]);
  const promissoryNotes = useMemo(() => getPromissoryNotes(player), [player.promissoryNotesInHand]);

  // Station layout offsets (relative to center)
  // Faction sheet is centered, other elements arranged around it
  const layout = {
    factionSheet: [0, 0.02, 0],           // Center of station
    strategyCard: [3.2, 0.02, 0],         // Right of faction sheet
    vpTrack: [-3.2, 0.02, 0],             // Left of faction sheet
    commandSheet: [0, 0.02, 2.5],         // Below faction sheet
    actionCards: [0, 0.02, 4.5],          // Below command sheet
    secretObjectives: [-2.5, 0.02, 5.8],
    promissoryNotes: [2.5, 0.02, 5.8],
    technologies: [0, 0.02, 7.2],
    unitSupply: [0, 0.02, 8.8],
  };

  // Interaction handlers
  const handleFactionClick = useCallback(() => {
    // Pass the current face-up state (before flipping) to show in inspector
    onFactionClick?.(player.id, player.faction, !factionSheetFlipped);
  }, [player.id, player.faction, factionSheetFlipped, onFactionClick]);

  const handleStrategyCardClick = useCallback(() => {
    if (player.strategyCard) {
      onStrategyCardClick?.(player.id, player.strategyCard);
    }
  }, [player.id, player.strategyCard, onStrategyCardClick]);

  const handleActionCardClick = useCallback((cardId: string) => {
    onActionCardClick?.(player.id, cardId);
  }, [player.id, onActionCardClick]);

  const handleSecretObjectiveClick = useCallback((cardId: string) => {
    onSecretObjectiveClick?.(player.id, cardId);
  }, [player.id, onSecretObjectiveClick]);

  const handlePromissoryClick = useCallback((cardId: string) => {
    onPromissoryClick?.(player.id, cardId);
  }, [player.id, onPromissoryClick]);

  const handleTechClick = useCallback((techId: string) => {
    onTechClick?.(player.id, techId);
  }, [player.id, onTechClick]);

  const handleTradeGoodsClick = useCallback(() => {
    onTradeGoodsClick?.(player.id);
  }, [player.id, onTradeGoodsClick]);

  const handleStationClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onStationFocus?.(player.id, position, rotation);
    onStationClick?.();
  }, [player.id, position, rotation, onStationFocus, onStationClick]);

  const handlePointerOver = useCallback(() => {
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setIsHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  return (
    <group position={position.toArray()} rotation={[0, rotation, 0]}>
      {/* Station base/mat - clickable to focus */}
      <mesh
        position={[0, 0, 4]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleStationClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[8, 12]} />
        <meshStandardMaterial
          color={isActivePlayer ? playerColor : isHovered ? '#1a1a3e' : '#0a0a15'}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glowing border for active player */}
      {isActivePlayer && (
        <mesh position={[0, 0.01, 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.5, 5.6, 32]} />
          <meshBasicMaterial color={playerColor} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Hover border */}
      {isHovered && !isActivePlayer && (
        <mesh position={[0, 0.005, 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.55, 5.6, 32]} />
          <meshBasicMaterial color="#4488ff" transparent opacity={0.4} />
        </mesh>
      )}

      {/* Player name header */}
      <group position={[0, 0.05, -2.0]}>
        <Text
          fontSize={0.2}
          color={playerColor}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {player.name}
        </Text>
        <Text
          position={[0, 0, 0.2]}
          fontSize={0.1}
          color="#888"
          anchorX="center"
          anchorY="middle"
        >
          {faction?.shortName || player.faction}
        </Text>
      </group>

      {/* Faction Sheet */}
      <Suspense fallback={null}>
        <FactionSheet3D
          factionId={player.faction}
          position={layout.factionSheet as [number, number, number]}
          scale={0.8}
          faceUp={!factionSheetFlipped}
          onClick={handleFactionClick}
        />
      </Suspense>

      {/* Strategy Card */}
      <StrategyCardHolder3D
        strategyCard={player.strategyCard || null}
        exhausted={player.strategyCardUsed}
        position={layout.strategyCard as [number, number, number]}
        scale={0.9}
        onClick={handleStrategyCardClick}
      />

      {/* Command Sheet (tokens + resources) */}
      <CommandSheet3D
        player={player}
        position={layout.commandSheet as [number, number, number]}
        scale={0.9}
        onTradeGoodsClick={handleTradeGoodsClick}
      />

      {/* VP Track */}
      <VPTrack3D
        score={player.score}
        maxScore={10}
        playerColor={player.color}
        position={layout.vpTrack as [number, number, number]}
        scale={0.9}
      />

      {/* Action Cards (face up for owner, face down for others) */}
      {actionCards.length > 0 && (
        <CardHand3D
          cards={actionCards}
          cardType="action"
          position={layout.actionCards as [number, number, number]}
          faceUp={isCurrentPlayer}
          layout={isCurrentPlayer ? 'spread' : 'stack'}
          maxVisible={isCurrentPlayer ? 8 : 5}
          scale={0.7}
          onCardClick={handleActionCardClick}
        />
      )}

      {/* Secret Objectives (face up for owner only) */}
      {secretObjectives.length > 0 && (
        <CardHand3D
          cards={secretObjectives}
          cardType="secret_objective"
          position={layout.secretObjectives as [number, number, number]}
          faceUp={isCurrentPlayer}
          layout={isCurrentPlayer ? 'spread' : 'stack'}
          maxVisible={3}
          scale={0.6}
          onCardClick={handleSecretObjectiveClick}
        />
      )}

      {/* Promissory Notes (face up for owner, face down for others) */}
      {promissoryNotes.length > 0 && (
        <CardHand3D
          cards={promissoryNotes}
          cardType="promissory"
          position={layout.promissoryNotes as [number, number, number]}
          faceUp={isCurrentPlayer}
          layout={isCurrentPlayer ? 'spread' : 'stack'}
          maxVisible={5}
          scale={0.6}
          onCardClick={handlePromissoryClick}
        />
      )}

      {/* Technologies */}
      {technologies.length > 0 && (
        <TechnologyDisplay3D
          technologies={technologies}
          position={layout.technologies as [number, number, number]}
          scale={0.8}
          maxVisible={12}
          onTechClick={handleTechClick}
        />
      )}

      {/* Unit Supply */}
      <UnitSupplyArea3D
        player={player}
        gameState={gameState}
        position={layout.unitSupply as [number, number, number]}
        scale={0.8}
        compact={true}
      />

      {/* Current player indicator - hidden when inspecting a card */}
      {isCurrentPlayer && !isInspectingCard && (
        <Html position={[0, 0.8, -2.2]} center>
          <div className="bg-white/90 text-black px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg border-2 border-blue-500">
            YOUR STATION
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Legacy Player Station (original simple version)
 */
function LegacyPlayerStation3D({
  player,
  gameState,
  isCurrentPlayer,
  isActivePlayer,
}: Omit<PlayerStation3DProps, 'enhanced'>) {
  const { position, rotation } = useMemo(
    () => calculateStationPosition(player, gameState),
    [player, gameState]
  );

  const playerColor = PLAYER_COLORS_3D[player.color];
  const faction = factions[player.faction];

  const stationWidth = 3;
  const stationDepth = 2;

  return (
    <group position={position.toArray()} rotation={[0, rotation, 0]}>
      {/* Station base/mat */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[stationWidth, stationDepth]} />
        <meshStandardMaterial
          color={isActivePlayer ? playerColor : '#1a1a2e'}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Player name and faction */}
      <group position={[0, 0.02, -stationDepth / 2 + 0.15]}>
        <Text
          fontSize={0.15}
          color={playerColor}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {player.name}
        </Text>
        <Text
          position={[0, 0, 0.15]}
          fontSize={0.08}
          color="#888"
          anchorX="center"
          anchorY="middle"
        >
          {faction?.shortName || player.faction}
        </Text>
      </group>

      {/* Command Tokens */}
      <group position={[-stationWidth / 2 + 0.5, 0.03, -0.2]}>
        <Token3D position={[0, 0, 0]} color="#22c55e" label="T" count={player.commandTokens.tactics} />
        <Token3D position={[0.5, 0, 0]} color="#3b82f6" label="F" count={player.commandTokens.fleet} />
        <Token3D position={[1.0, 0, 0]} color="#f59e0b" label="S" count={player.commandTokens.strategy} />
      </group>

      {/* Trade Goods and Commodities */}
      <group position={[stationWidth / 2 - 0.6, 0.03, -0.2]}>
        <Token3D position={[0, 0, 0]} color="#fbbf24" label="TG" count={player.tradeGoods} size={0.18} />
        <Token3D position={[0.45, 0, 0]} color="#60a5fa" label="C" count={player.commodities} size={0.18} />
      </group>

      {/* Strategy Card */}
      {player.strategyCard && (
        <group position={[0, 0.03, 0.3]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.4, 0.55]} />
            <meshStandardMaterial
              color={player.strategyCardUsed ? '#444' : playerColor}
              transparent
              opacity={player.strategyCardUsed ? 0.5 : 1}
            />
          </mesh>
          <Text
            position={[0, 0.02, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={0.15}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {player.strategyCard}
          </Text>
        </group>
      )}

      {/* Victory Points */}
      <group position={[stationWidth / 2 - 0.3, 0.03, 0.6]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.25, 32]} />
          <meshStandardMaterial color="#7c3aed" />
        </mesh>
        <Text
          position={[0, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {player.score}
        </Text>
      </group>

      {/* Technologies count */}
      <group position={[-stationWidth / 2 + 0.3, 0.03, 0.6]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.2, 32]} />
          <meshStandardMaterial color="#0ea5e9" />
        </mesh>
        <Text
          position={[0, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.15}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {player.technologies.length}
        </Text>
      </group>

      {/* Current player indicator */}
      {isCurrentPlayer && (
        <Html position={[0, 0.5, 0]} center>
          <div className="bg-white/90 text-black px-2 py-1 rounded text-xs font-bold shadow">
            YOU
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Simple token component for legacy mode
 */
function Token3D({
  position,
  color,
  label,
  count,
  size = 0.2,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  count: number;
  size?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[size, size, 0.05, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
      <Text
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={size * 0.6}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {count}
      </Text>
    </group>
  );
}

/**
 * Main player station component
 * Supports both enhanced (new 3D assets) and legacy (simple shapes) modes
 * Optionally uses LOD (Level of Detail) for performance
 */
export function PlayerStation3D({
  player,
  gameState,
  isCurrentPlayer,
  isActivePlayer,
  onStationClick,
  onFactionClick,
  onStrategyCardClick,
  onActionCardClick,
  onSecretObjectiveClick,
  onPromissoryClick,
  onTechClick,
  onTradeGoodsClick,
  onStationFocus,
  enhanced = true, // Default to enhanced mode
  useLOD = false, // LOD available but disabled by default (needs positioning refactor)
  isInspectingCard = false,
}: PlayerStation3DProps) {
  // Calculate position for LOD wrapper
  const { position, rotation } = useMemo(
    () => calculateStationPosition(player, gameState),
    [player, gameState]
  );

  // High-detail content
  const highDetailContent = enhanced ? (
    <EnhancedPlayerStation3D
      player={player}
      gameState={gameState}
      isCurrentPlayer={isCurrentPlayer}
      isActivePlayer={isActivePlayer}
      onStationClick={onStationClick}
      onFactionClick={onFactionClick}
      onStrategyCardClick={onStrategyCardClick}
      onActionCardClick={onActionCardClick}
      onSecretObjectiveClick={onSecretObjectiveClick}
      onPromissoryClick={onPromissoryClick}
      onTechClick={onTechClick}
      onTradeGoodsClick={onTradeGoodsClick}
      onStationFocus={onStationFocus}
      isInspectingCard={isInspectingCard}
    />
  ) : (
    <LegacyPlayerStation3D
      player={player}
      gameState={gameState}
      isCurrentPlayer={isCurrentPlayer}
      isActivePlayer={isActivePlayer}
    />
  );

  // Use LOD wrapper for automatic detail level switching
  if (useLOD) {
    return (
      <PlayerStationLOD
        player={player}
        position={position}
        rotation={rotation}
        isActivePlayer={isActivePlayer}
      >
        {/* Remove outer group positioning since LOD handles it */}
        <group position={[-position.x, -position.y, -position.z]} rotation={[0, -rotation, 0]}>
          {highDetailContent}
        </group>
      </PlayerStationLOD>
    );
  }

  return highDetailContent;
}

interface PlayerStations3DProps extends PlayerStationCallbacks {
  gameState: GameState;
  currentPlayerId: string | null;
  enhanced?: boolean;
  useLOD?: boolean;
  isInspectingCard?: boolean;
}

/**
 * Container that renders all player stations
 */
export function PlayerStations3D({
  gameState,
  currentPlayerId,
  enhanced = true,
  useLOD = false,
  isInspectingCard = false,
  onFactionClick,
  onStrategyCardClick,
  onActionCardClick,
  onSecretObjectiveClick,
  onPromissoryClick,
  onTechClick,
  onTradeGoodsClick,
  onStationFocus,
}: PlayerStations3DProps) {
  return (
    <group>
      {gameState.players.map((player) => (
        <PlayerStation3D
          key={player.id}
          player={player}
          gameState={gameState}
          isCurrentPlayer={player.id === currentPlayerId}
          isActivePlayer={player.id === gameState.activePlayerId}
          enhanced={enhanced}
          useLOD={useLOD}
          isInspectingCard={isInspectingCard}
          onFactionClick={onFactionClick}
          onStrategyCardClick={onStrategyCardClick}
          onActionCardClick={onActionCardClick}
          onSecretObjectiveClick={onSecretObjectiveClick}
          onPromissoryClick={onPromissoryClick}
          onTechClick={onTechClick}
          onTradeGoodsClick={onTradeGoodsClick}
          onStationFocus={onStationFocus}
        />
      ))}
    </group>
  );
}

/**
 * Export types for external use
 */
export type { PlayerStationCallbacks };
