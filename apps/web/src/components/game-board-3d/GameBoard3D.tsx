'use client';

import { Suspense, useMemo, useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import type { MapTile, GameState, PlayerColor, UnitType } from '@ti4/shared';
import { HexTile3D } from './HexTile3D';
import { TileUnits3D } from './Unit3D';
import { SpaceBackground, SpaceDust } from './SpaceBackground';
import { CameraControls } from './CameraControls';
import { SharedElementsLayout3D, type ExplorationDeckType } from './shared';
import { PlayerStations3D } from './PlayerStation3D';
import { CameraProvider, useCamera, calculateStationCameraTarget } from './CameraContext';
import { TexturePreloader } from './TexturePreloader';
import { CardInspector3D, type InspectedCard } from './CardInspector3D';
import { getHexBounds3D, hexToWorld3D } from './hex3d';
import * as THREE from 'three';

interface GameBoard3DProps {
  gameState: GameState;
  currentPlayerId?: string | null;
  onTileClick?: (tile: MapTile) => void;
  onTileHover?: (tile: MapTile | null) => void;
  highlightedTiles?: { q: number; r: number }[];
  className?: string;
  // Shared elements visibility
  showSharedElements?: boolean;
  showPlayerStations?: boolean;
  // Card deck interactions
  onActionCardDeckClick?: () => void;
  onAgendaReveal?: () => void;
  onRelicDraw?: () => void;
  onExplorationDraw?: (type: ExplorationDeckType) => void;
  onSecretObjectiveDraw?: () => void;
  // Objective display props
  onObjectiveClick?: (objectiveId: string, type: 'stage1' | 'stage2') => void;
  canScoreObjective?: (objectiveId: string) => boolean;
  // Player station interaction callbacks
  onStrategyCardClick?: (playerId: string, cardNumber: number) => void;
  onActionCardClick?: (playerId: string, cardId: string) => void;
  onTechClick?: (playerId: string, techId: string) => void;
  onTradeGoodsClick?: (playerId: string) => void;
  // 3D Action declaration callbacks
  onTileActivate?: (tile: MapTile) => void;        // Tactical action: activate a system
  onTileInspect?: (tile: MapTile) => void;         // Right-click to inspect tile
  onStrategyCardPlay?: (playerId: string, cardNumber: number) => void;  // Strategic action
  onPass?: (playerId: string) => void;             // Pass turn
  activatableTiles?: { q: number; r: number }[];   // Tiles that can be activated (tactical action)
  // Exploration & Relic callbacks
  onRelicFragmentPurge?: (playerId: string, fragmentType: string) => void;  // Purge fragments for relic
  onRelicClick?: (playerId: string, relicId: string) => void;  // Use/activate a relic
  // Leader callbacks
  onLeaderClick?: (playerId: string, leaderId: string, leaderType: 'agent' | 'commander' | 'hero') => void;
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
  onTileActivate,
  onTileInspect,
  highlightedTiles,
  activatableTiles,
}: {
  tiles: MapTile[];
  playerColors: Map<string, PlayerColor>;
  onTileClick?: (tile: MapTile) => void;
  onTileHover?: (tile: MapTile | null) => void;
  onTileActivate?: (tile: MapTile) => void;
  onTileInspect?: (tile: MapTile) => void;
  highlightedTiles?: { q: number; r: number }[];
  activatableTiles?: { q: number; r: number }[];
}) {
  // Create a set of highlighted positions for quick lookup
  const highlightedSet = useMemo(() => {
    const set = new Set<string>();
    highlightedTiles?.forEach((pos) => {
      set.add(`${pos.q},${pos.r}`);
    });
    return set;
  }, [highlightedTiles]);

  // Create a set of activatable positions for quick lookup
  const activatableSet = useMemo(() => {
    const set = new Set<string>();
    activatableTiles?.forEach((pos) => {
      set.add(`${pos.q},${pos.r}`);
    });
    return set;
  }, [activatableTiles]);

  return (
    <group>
      {tiles.map((tile) => {
        const key = `${tile.position.q},${tile.position.r}`;
        const isHighlighted = highlightedSet.has(key);
        const canActivate = activatableSet.has(key);
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
              onActivate={onTileActivate}
              onInspect={onTileInspect}
              isHighlighted={isHighlighted}
              canActivate={canActivate}
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
 * Scene content component that uses camera context
 */
function SceneContent({
  gameState,
  currentPlayerId,
  playerColors,
  boardCenter,
  boardBounds,
  onTileClick,
  onTileHover,
  onTileActivate,
  onTileInspect,
  highlightedTiles,
  activatableTiles,
  showPlayerStations,
  showSharedElements,
  onActionCardDeckClick,
  onAgendaReveal,
  onRelicDraw,
  onExplorationDraw,
  onSecretObjectiveDraw,
  onObjectiveClick,
  canScoreObjective,
  onStrategyCardClick,
  onStrategyCardPlay,
  onPass,
  onActionCardClick,
  onTechClick,
  onTradeGoodsClick,
  onRelicFragmentPurge,
  onRelicClick,
  onLeaderClick,
  setResetCameraFn,
  inspectedCard,
  onCardInspect,
  onCloseInspect,
}: {
  gameState: GameState;
  currentPlayerId: string | null;
  playerColors: Map<string, PlayerColor>;
  boardCenter: THREE.Vector3;
  boardBounds: { center: THREE.Vector3; radius: number };
  onTileClick?: (tile: MapTile) => void;
  onTileHover?: (tile: MapTile | null) => void;
  onTileActivate?: (tile: MapTile) => void;
  onTileInspect?: (tile: MapTile) => void;
  highlightedTiles?: { q: number; r: number }[];
  activatableTiles?: { q: number; r: number }[];
  showPlayerStations: boolean;
  showSharedElements: boolean;
  onActionCardDeckClick?: () => void;
  onAgendaReveal?: () => void;
  onRelicDraw?: () => void;
  onExplorationDraw?: (type: ExplorationDeckType) => void;
  onSecretObjectiveDraw?: () => void;
  onObjectiveClick?: (objectiveId: string, type: 'stage1' | 'stage2') => void;
  canScoreObjective?: (objectiveId: string) => boolean;
  onStrategyCardClick?: (playerId: string, cardNumber: number) => void;
  onStrategyCardPlay?: (playerId: string, cardNumber: number) => void;
  onPass?: (playerId: string) => void;
  onActionCardClick?: (playerId: string, cardId: string) => void;
  onTechClick?: (playerId: string, techId: string) => void;
  onTradeGoodsClick?: (playerId: string) => void;
  onRelicFragmentPurge?: (playerId: string, fragmentType: string) => void;
  onRelicClick?: (playerId: string, relicId: string) => void;
  onLeaderClick?: (playerId: string, leaderId: string, leaderType: 'agent' | 'commander' | 'hero') => void;
  setResetCameraFn: (fn: () => void) => void;
  inspectedCard: InspectedCard | null;
  onCardInspect: (card: InspectedCard) => void;
  onCloseInspect: () => void;
}) {
  const { focusOn, resetToOverview, isFocused } = useCamera();

  // Register reset function with parent on mount
  if (setResetCameraFn) {
    setResetCameraFn(resetToOverview);
  }

  // Handle station focus (camera zoom to player station)
  const handleStationFocus = useCallback(
    (playerId: string, position: THREE.Vector3, rotation: number) => {
      const cameraTarget = calculateStationCameraTarget(position, rotation);
      focusOn(cameraTarget, 1000);
    },
    [focusOn]
  );

  // Handle background click to reset camera
  const handleBackgroundClick = useCallback(() => {
    if (isFocused) {
      resetToOverview();
    }
  }, [isFocused, resetToOverview]);

  // Handle card clicks to open inspector - wrap external handler with inspector
  const handleActionCardInspect = useCallback(
    (playerId: string, cardId: string) => {
      const player = gameState.players.find(p => p.id === playerId);
      const isOwner = playerId === currentPlayerId;
      onCardInspect({
        id: cardId,
        type: 'action',
        faceUp: isOwner,
      });
      // Also call the external handler if provided
      onActionCardClick?.(playerId, cardId);
    },
    [gameState.players, currentPlayerId, onCardInspect, onActionCardClick]
  );

  const handleTechCardInspect = useCallback(
    (playerId: string, techId: string) => {
      onCardInspect({
        id: techId,
        type: 'technology',
        faceUp: true, // Tech cards are always face up
      });
      // Also call the external handler if provided
      onTechClick?.(playerId, techId);
    },
    [onCardInspect, onTechClick]
  );

  const handleSecretObjectiveInspect = useCallback(
    (playerId: string, cardId: string) => {
      const isOwner = playerId === currentPlayerId;
      onCardInspect({
        id: cardId,
        type: 'secret_objective',
        faceUp: isOwner, // Only owner sees face up
      });
    },
    [currentPlayerId, onCardInspect]
  );

  const handlePromissoryInspect = useCallback(
    (playerId: string, cardId: string) => {
      const isOwner = playerId === currentPlayerId;
      onCardInspect({
        id: cardId,
        type: 'promissory',
        faceUp: isOwner, // Only owner sees face up
      });
    },
    [currentPlayerId, onCardInspect]
  );

  const handleStrategyCardInspect = useCallback(
    (playerId: string, cardNumber: number) => {
      onCardInspect({
        id: cardNumber.toString(),
        type: 'strategy',
        faceUp: true, // Strategy cards are always visible
      });
      // Also call external handler if provided
      onStrategyCardClick?.(playerId, cardNumber);
    },
    [onCardInspect, onStrategyCardClick]
  );

  const handleFactionSheetInspect = useCallback(
    (playerId: string, factionId: string, faceUp: boolean) => {
      onCardInspect({
        id: factionId,
        type: 'faction_sheet',
        faceUp: faceUp,
      });
    },
    [onCardInspect]
  );

  return (
    <>
      {/* Lighting */}
      <SceneLighting />

      {/* Space background */}
      <SpaceBackground />
      <SpaceDust />

      {/* Camera controls */}
      <CameraControls target={boardCenter} />

      {/* Clickable background plane to reset camera */}
      {isFocused && (
        <mesh
          position={[0, -0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleBackgroundClick}
        >
          <planeGeometry args={[200, 200]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {/* Hex tile grid */}
      <HexGrid
        tiles={gameState.map.tiles}
        playerColors={playerColors}
        onTileClick={onTileClick}
        onTileHover={onTileHover}
        onTileActivate={onTileActivate}
        onTileInspect={onTileInspect}
        highlightedTiles={highlightedTiles}
        activatableTiles={activatableTiles}
      />

      {/* Player Stations */}
      {showPlayerStations && (
        <PlayerStations3D
          gameState={gameState}
          currentPlayerId={currentPlayerId}
          isInspectingCard={inspectedCard !== null}
          onFactionClick={handleFactionSheetInspect}
          onStrategyCardClick={handleStrategyCardInspect}
          onStrategyCardPlay={onStrategyCardPlay}
          onPass={onPass}
          onActionCardClick={handleActionCardInspect}
          onSecretObjectiveClick={handleSecretObjectiveInspect}
          onPromissoryClick={handlePromissoryInspect}
          onTechClick={handleTechCardInspect}
          onTradeGoodsClick={onTradeGoodsClick}
          onStationFocus={handleStationFocus}
          onRelicFragmentPurge={onRelicFragmentPurge}
          onRelicClick={onRelicClick}
          onLeaderClick={onLeaderClick}
        />
      )}

      {/* Shared Elements (Card Decks, Objectives, Exploration, Game Status) */}
      {showSharedElements && (
        <SharedElementsLayout3D
          gameState={gameState}
          boardBounds={boardBounds}
          currentPlayerId={currentPlayerId ?? undefined}
          onActionCardDraw={onActionCardDeckClick}
          onAgendaReveal={onAgendaReveal}
          onExplorationDraw={onExplorationDraw}
          onRelicDraw={onRelicDraw}
          onSecretObjectiveDraw={onSecretObjectiveDraw}
          onObjectiveClick={onObjectiveClick}
          canScoreObjective={canScoreObjective}
        />
      )}

      {/* Card Inspector - rendered last to be on top */}
      <CardInspector3D card={inspectedCard} onClose={onCloseInspect} />
    </>
  );
}

/**
 * Main 3D Game Board component
 * Drop-in replacement for the 2D GameBoard
 */
export function GameBoard3D({
  gameState,
  currentPlayerId,
  onTileClick,
  onTileHover,
  onTileActivate,
  onTileInspect,
  highlightedTiles,
  activatableTiles,
  className,
  showSharedElements = true,
  showPlayerStations = true,
  onActionCardDeckClick,
  onAgendaReveal,
  onRelicDraw,
  onExplorationDraw,
  onSecretObjectiveDraw,
  onObjectiveClick,
  canScoreObjective,
  onStrategyCardClick,
  onStrategyCardPlay,
  onPass,
  onActionCardClick,
  onTechClick,
  onTradeGoodsClick,
  onRelicFragmentPurge,
  onRelicClick,
  onLeaderClick,
}: GameBoard3DProps) {
  const [hoveredTile, setHoveredTile] = useState<MapTile | null>(null);
  const [isCameraFocused, setIsCameraFocused] = useState(false);
  const [inspectedCard, setInspectedCard] = useState<InspectedCard | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);

  // Card inspection handlers
  const handleCardInspect = useCallback((card: InspectedCard) => {
    setInspectedCard(card);
  }, []);

  const handleCloseInspect = useCallback(() => {
    setInspectedCard(null);
  }, []);

  // Build player color map
  const playerColors = useMemo(() => {
    const colors = new Map<string, PlayerColor>();
    gameState.players.forEach((player) => {
      colors.set(player.id, player.color);
    });
    return colors;
  }, [gameState.players]);

  // Calculate board bounds (center and radius) for camera target and shared elements positioning
  const { boardCenter, boardBounds } = useMemo(() => {
    const positions = gameState.map.tiles.map((t) => t.position);
    const bounds = getHexBounds3D(positions);
    const radius = Math.max(
      bounds.max.x - bounds.min.x,
      bounds.max.z - bounds.min.z
    ) / 2;
    return {
      boardCenter: bounds.center,
      boardBounds: { center: bounds.center, radius },
    };
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
        {/* Preload essential textures in background */}
        <TexturePreloader gameState={gameState} />

        <Suspense fallback={<LoadingIndicator />}>
          <CameraProvider
            boardCenter={boardCenter}
            onFocusChange={setIsCameraFocused}
          >
            <SceneContent
              gameState={gameState}
              currentPlayerId={currentPlayerId ?? null}
              playerColors={playerColors}
              boardCenter={boardCenter}
              boardBounds={boardBounds}
              onTileClick={handleTileClick}
              onTileHover={handleTileHover}
              onTileActivate={onTileActivate}
              onTileInspect={onTileInspect}
              highlightedTiles={highlightedTiles}
              activatableTiles={activatableTiles}
              showPlayerStations={showPlayerStations}
              showSharedElements={showSharedElements}
              onActionCardDeckClick={onActionCardDeckClick}
              onAgendaReveal={onAgendaReveal}
              onRelicDraw={onRelicDraw}
              onExplorationDraw={onExplorationDraw}
              onSecretObjectiveDraw={onSecretObjectiveDraw}
              onObjectiveClick={onObjectiveClick}
              canScoreObjective={canScoreObjective}
              onStrategyCardClick={onStrategyCardClick}
              onStrategyCardPlay={onStrategyCardPlay}
              onPass={onPass}
              onActionCardClick={onActionCardClick}
              onTechClick={onTechClick}
              onTradeGoodsClick={onTradeGoodsClick}
              onRelicFragmentPurge={onRelicFragmentPurge}
              onRelicClick={onRelicClick}
              onLeaderClick={onLeaderClick}
              setResetCameraFn={(fn) => { resetCameraRef.current = fn; }}
              inspectedCard={inspectedCard}
              onCardInspect={handleCardInspect}
              onCloseInspect={handleCloseInspect}
            />
          </CameraProvider>
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

      {/* Return to Overview button - shown when camera is focused on a station */}
      {isCameraFocused && (
        <button
          onClick={() => resetCameraRef.current?.()}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Overview
        </button>
      )}
    </div>
  );
}
