'use client';

import { useMemo } from 'react';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { PlayerState, GameState, UnitType } from '@ti4/shared';
import { factions, units as unitData } from '@ti4/game-data';
import { hexToWorld3D, getHexBounds3D } from './hex3d';
import { PLAYER_COLORS_3D, HEX_CONFIG } from './constants';

interface PlayerStation3DProps {
  player: PlayerState;
  gameState: GameState;
  isCurrentPlayer: boolean;
  isActivePlayer: boolean;
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
    const stationDistance = boardRadius + 4;
    const stationPos = boardCenter.clone().add(direction.multiplyScalar(stationDistance));
    stationPos.y = 0.1; // Slightly above the plane

    // Calculate rotation to face the center
    const rotation = Math.atan2(direction.x, direction.z) + Math.PI;

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
  const stationDistance = boardRadius + 4;

  const stationPos = new THREE.Vector3(
    boardCenter.x + Math.cos(angle) * stationDistance,
    0.1,
    boardCenter.z + Math.sin(angle) * stationDistance
  );

  const rotation = angle + Math.PI;

  return { position: stationPos, rotation };
}

/**
 * Calculate unit supply (how many units a player has left to place)
 */
function calculateUnitSupply(player: PlayerState, gameState: GameState): Record<UnitType, { total: number; onBoard: number; remaining: number }> {
  // Default unit supplies per faction (can be customized)
  const baseSupplies: Record<UnitType, number> = {
    carrier: 4,
    cruiser: 8,
    destroyer: 8,
    dreadnought: 5,
    fighter: 10,
    flagship: 1,
    infantry: 12,
    mech: 4,
    pds: 6,
    space_dock: 3,
    war_sun: 2,
  };

  const supply: Record<UnitType, { total: number; onBoard: number; remaining: number }> = {} as any;

  // Count units on board for this player
  const onBoardCounts: Record<UnitType, number> = {} as any;
  for (const tile of gameState.map.tiles) {
    for (const unit of tile.units) {
      if (unit.ownerId === player.id) {
        onBoardCounts[unit.type] = (onBoardCounts[unit.type] || 0) + 1;
      }
    }
  }

  // Calculate remaining
  for (const unitType of Object.keys(baseSupplies) as UnitType[]) {
    const total = baseSupplies[unitType];
    const onBoard = onBoardCounts[unitType] || 0;
    supply[unitType] = {
      total,
      onBoard,
      remaining: total - onBoard,
    };
  }

  return supply;
}

/**
 * A 3D token representation
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
      <Text
        position={[0, -0.1, size * 1.5]}
        fontSize={0.08}
        color="#888"
        anchorX="center"
        anchorY="top"
      >
        {label}
      </Text>
    </group>
  );
}

/**
 * Unit supply indicator showing how many units remain
 */
function UnitSupplyRow({
  unitType,
  remaining,
  total,
  color,
  position,
}: {
  unitType: UnitType;
  remaining: number;
  total: number;
  color: string;
  position: [number, number, number];
}) {
  // Only show ship types (not ground units or structures for now)
  const displayName = unitType.replace('_', ' ');

  return (
    <group position={position}>
      {/* Unit indicator circles */}
      <group position={[0, 0, 0]}>
        {Array.from({ length: Math.min(total, 6) }).map((_, i) => {
          const isAvailable = i < remaining;
          return (
            <mesh key={i} position={[i * 0.15, 0, 0]}>
              <circleGeometry args={[0.05, 16]} />
              <meshStandardMaterial
                color={isAvailable ? color : '#333'}
                transparent={!isAvailable}
                opacity={isAvailable ? 1 : 0.3}
              />
            </mesh>
          );
        })}
      </group>
      <Text
        position={[-0.3, 0, 0]}
        fontSize={0.08}
        color="#aaa"
        anchorX="right"
        anchorY="middle"
      >
        {displayName.charAt(0).toUpperCase() + displayName.slice(1)}
      </Text>
    </group>
  );
}

/**
 * Main player station component
 * Displays all player resources in 3D space outside the board
 */
export function PlayerStation3D({
  player,
  gameState,
  isCurrentPlayer,
  isActivePlayer,
}: PlayerStation3DProps) {
  const { position, rotation } = useMemo(
    () => calculateStationPosition(player, gameState),
    [player, gameState]
  );

  const unitSupply = useMemo(
    () => calculateUnitSupply(player, gameState),
    [player, gameState]
  );

  const playerColor = PLAYER_COLORS_3D[player.color];
  const faction = factions[player.faction];

  // Station dimensions
  const stationWidth = 3;
  const stationDepth = 2;

  // Ship types to display in supply
  const shipTypes: UnitType[] = ['carrier', 'cruiser', 'destroyer', 'dreadnought', 'fighter', 'flagship', 'war_sun'];

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

      {/* Glowing border for active player */}
      {isActivePlayer && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[stationWidth / 2 - 0.05, stationWidth / 2, 32]} />
          <meshBasicMaterial color={playerColor} transparent opacity={0.6} />
        </mesh>
      )}

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
        <Token3D
          position={[0, 0, 0]}
          color="#22c55e" // Tactics - green
          label="T"
          count={player.commandTokens.tactics}
        />
        <Token3D
          position={[0.5, 0, 0]}
          color="#3b82f6" // Fleet - blue
          label="F"
          count={player.commandTokens.fleet}
        />
        <Token3D
          position={[1.0, 0, 0]}
          color="#f59e0b" // Strategy - yellow/orange
          label="S"
          count={player.commandTokens.strategy}
        />
      </group>

      {/* Trade Goods and Commodities */}
      <group position={[stationWidth / 2 - 0.6, 0.03, -0.2]}>
        <Token3D
          position={[0, 0, 0]}
          color="#fbbf24"
          label="TG"
          count={player.tradeGoods}
          size={0.18}
        />
        <Token3D
          position={[0.45, 0, 0]}
          color="#60a5fa"
          label="C"
          count={player.commodities}
          size={0.18}
        />
      </group>

      {/* Strategy Card (if picked) */}
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
        <Text
          position={[0, 0, 0.35]}
          fontSize={0.06}
          color="#888"
          anchorX="center"
          anchorY="top"
        >
          VP
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
        <Text
          position={[0, 0, 0.3]}
          fontSize={0.06}
          color="#888"
          anchorX="center"
          anchorY="top"
        >
          Tech
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

      {/* Action cards count (face down) */}
      <group position={[0, 0.03, 0.7]}>
        {/* Stack of cards */}
        {Array.from({ length: Math.min(player.actionCards.length, 5) }).map((_, i) => (
          <mesh
            key={i}
            position={[0 + i * 0.02, i * 0.01, 0]}
            rotation={[-Math.PI / 2, 0, (Math.random() - 0.5) * 0.1]}
          >
            <planeGeometry args={[0.25, 0.35]} />
            <meshStandardMaterial color="#2a2a4a" />
          </mesh>
        ))}
        <Text
          position={[0.2, 0.1, 0]}
          fontSize={0.1}
          color="#888"
          anchorX="left"
          anchorY="middle"
        >
          {player.actionCards.length} cards
        </Text>
      </group>
    </group>
  );
}

/**
 * Container that renders all player stations
 */
export function PlayerStations3D({
  gameState,
  currentPlayerId,
}: {
  gameState: GameState;
  currentPlayerId: string | null;
}) {
  return (
    <group>
      {gameState.players.map((player) => (
        <PlayerStation3D
          key={player.id}
          player={player}
          gameState={gameState}
          isCurrentPlayer={player.id === currentPlayerId}
          isActivePlayer={player.id === gameState.activePlayerId}
        />
      ))}
    </group>
  );
}
