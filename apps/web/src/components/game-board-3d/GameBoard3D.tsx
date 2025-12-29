'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import type { MapTile, GameState, PlayerColor, UnitType } from '@ti4/shared';
import { HexTile3D } from './HexTile3D';
import { TileUnits3D } from './Unit3D';
import { SpaceBackground, SpaceDust } from './SpaceBackground';
import { CameraControls } from './CameraControls';
import { getHexBounds3D, hexToWorld3D } from './hex3d';
import * as THREE from 'three';

interface GameBoard3DProps {
  gameState: GameState;
  onTileClick?: (tile: MapTile) => void;
  onTileHover?: (tile: MapTile | null) => void;
  highlightedTiles?: { q: number; r: number }[];
  className?: string;
}

/**
 * Loading indicator while scene is loading
 */
function LoadingIndicator() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#444" wireframe />
    </mesh>
  );
}

/**
 * Scene lighting setup
 */
function SceneLighting() {
  return (
    <>
      {/* Ambient light for base visibility */}
      <ambientLight intensity={0.6} />

      {/* Main directional light (like sun) */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-10, 10, -10]}
        intensity={0.6}
      />

      {/* Subtle colored rim lights for atmosphere */}
      <pointLight position={[0, 10, 20]} intensity={0.4} color="#4488ff" />
      <pointLight position={[0, 10, -20]} intensity={0.4} color="#ff8844" />
    </>
  );
}

/**
 * Group units by owner and type
 */
function groupUnits(
  units: { id: string; type: UnitType; ownerId: string; damaged: boolean }[],
  playerColors: Map<string, PlayerColor>
): { type: UnitType; count: number; ownerColor: PlayerColor; damaged: number }[] {
  const groups = new Map<string, { type: UnitType; count: number; ownerColor: PlayerColor; damaged: number }>();

  for (const unit of units) {
    const key = `${unit.ownerId}-${unit.type}`;
    const existing = groups.get(key);
    const ownerColor = playerColors.get(unit.ownerId) ?? 'black';

    if (existing) {
      existing.count++;
      if (unit.damaged) existing.damaged++;
    } else {
      groups.set(key, {
        type: unit.type,
        count: 1,
        damaged: unit.damaged ? 1 : 0,
        ownerColor: ownerColor as PlayerColor,
      });
    }
  }

  return Array.from(groups.values());
}

/**
 * The hex grid of tiles
 */
function HexGrid({
  tiles,
  playerColors,
  onTileClick,
  onTileHover,
  highlightedTiles,
}: {
  tiles: MapTile[];
  playerColors: Map<string, PlayerColor>;
  onTileClick?: (tile: MapTile) => void;
  onTileHover?: (tile: MapTile | null) => void;
  highlightedTiles?: { q: number; r: number }[];
}) {
  // Create a set of highlighted positions for quick lookup
  const highlightedSet = useMemo(() => {
    const set = new Set<string>();
    highlightedTiles?.forEach((pos) => {
      set.add(`${pos.q},${pos.r}`);
    });
    return set;
  }, [highlightedTiles]);

  return (
    <group>
      {tiles.map((tile) => {
        const key = `${tile.position.q},${tile.position.r}`;
        const isHighlighted = highlightedSet.has(key);
        const tileWorldPos = hexToWorld3D(tile.position);

        // Group space units (units not on a planet)
        const spaceUnits = tile.units.filter((u) => !u.planetId);
        const spaceUnitGroups = groupUnits(spaceUnits, playerColors);

        return (
          <group key={key}>
            <HexTile3D
              tile={tile}
              onHover={onTileHover}
              onClick={onTileClick}
              isHighlighted={isHighlighted}
            />
            {/* Render units on this tile */}
            {spaceUnitGroups.length > 0 && (
              <TileUnits3D
                spaceUnits={spaceUnitGroups}
                tilePosition={[tileWorldPos.x, 0, tileWorldPos.z]}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

/**
 * Main 3D Game Board component
 * Drop-in replacement for the 2D GameBoard
 */
export function GameBoard3D({
  gameState,
  onTileClick,
  onTileHover,
  highlightedTiles,
  className,
}: GameBoard3DProps) {
  const [hoveredTile, setHoveredTile] = useState<MapTile | null>(null);

  // Build player color map
  const playerColors = useMemo(() => {
    const colors = new Map<string, PlayerColor>();
    gameState.players.forEach((player) => {
      colors.set(player.id, player.color);
    });
    return colors;
  }, [gameState.players]);

  // Calculate center of the board for camera target
  const boardCenter = useMemo(() => {
    const positions = gameState.map.tiles.map((t) => t.position);
    const bounds = getHexBounds3D(positions);
    return bounds.center;
  }, [gameState.map.tiles]);

  // Handle tile hover
  const handleTileHover = useCallback(
    (tile: MapTile | null) => {
      setHoveredTile(tile);
      onTileHover?.(tile);
    },
    [onTileHover]
  );

  // Handle tile click
  const handleTileClick = useCallback(
    (tile: MapTile) => {
      onTileClick?.(tile);
    },
    [onTileClick]
  );

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <Canvas
        camera={{
          fov: 60,
          near: 0.1,
          far: 1000,
          position: [0, 15, 12],
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        shadows
        style={{ background: '#030308' }}
      >
        <Suspense fallback={<LoadingIndicator />}>
          {/* Lighting */}
          <SceneLighting />

          {/* Space background */}
          <SpaceBackground />
          <SpaceDust />

          {/* Camera controls */}
          <CameraControls target={boardCenter} />

          {/* Hex tile grid */}
          <HexGrid
            tiles={gameState.map.tiles}
            playerColors={playerColors}
            onTileClick={handleTileClick}
            onTileHover={handleTileHover}
            highlightedTiles={highlightedTiles}
          />
        </Suspense>
      </Canvas>

      {/* Tile info overlay */}
      {hoveredTile && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-sm pointer-events-none">
          <div className="font-bold">System {hoveredTile.systemId}</div>
          <div className="text-gray-400">
            Position: ({hoveredTile.position.q}, {hoveredTile.position.r})
          </div>
          {hoveredTile.planets.length > 0 && (
            <div className="mt-1">Planets: {hoveredTile.planets.length}</div>
          )}
          {hoveredTile.wormhole && (
            <div className="text-purple-400">
              Wormhole: {hoveredTile.wormhole}
            </div>
          )}
          {hoveredTile.anomaly && (
            <div className="text-red-400">
              Anomaly: {hoveredTile.anomaly}
            </div>
          )}
          {hoveredTile.units.length > 0 && (
            <div className="text-blue-400">
              Units: {hoveredTile.units.length}
            </div>
          )}
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute top-4 right-4 bg-black/60 text-white/60 p-2 rounded text-xs">
        <div>Scroll to zoom</div>
        <div>Click + drag to rotate</div>
        <div>Right-click + drag to pan</div>
      </div>
    </div>
  );
}
