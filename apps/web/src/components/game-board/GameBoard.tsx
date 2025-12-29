'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Application, Container } from 'pixi.js';
import type { MapState, MapTile, GameState, PlayerColor } from '@ti4/shared';
import { HexTileSprite } from './HexTile';
import { getHexBounds, type HexConfig } from '@/lib/hex';
import { systems } from '@ti4/game-data';
import { preloadTileTextures, getTileTexture } from '@/lib/assets';
import { loadUnitTextures } from './UnitRenderer';

interface GameBoardProps {
  gameState: GameState;
  onTileClick?: (tile: MapTile) => void;
  onTileHover?: (tile: MapTile | null) => void;
  className?: string;
}

/**
 * Main game board component using Pixi.js
 */
export function GameBoard({ gameState, onTileClick, onTileHover, className }: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const boardContainerRef = useRef<Container | null>(null);
  const tilesRef = useRef<Map<string, HexTileSprite>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [hoveredTile, setHoveredTile] = useState<MapTile | null>(null);
  const [loadingProgress, setLoadingProgress] = useState('');

  // Hex configuration - flat-top orientation matches TI4 tile images
  const hexConfig: HexConfig = {
    size: 60,
    orientation: 'flat',
    origin: { x: 0, y: 0 },
  };

  // Build player color map
  const playerColors = useMemo(() => {
    const colors = new Map<string, PlayerColor>();
    gameState.players.forEach(player => {
      colors.set(player.id, player.color);
    });
    return colors;
  }, [gameState.players]);

  // Preload tile and unit textures
  useEffect(() => {
    const loadTextures = async () => {
      setLoadingProgress('Loading tile textures...');
      const systemIds = gameState.map.tiles.map(t => t.systemId);
      try {
        await preloadTileTextures(systemIds);
        setLoadingProgress('Loading unit textures...');
        await loadUnitTextures();
        setTexturesLoaded(true);
        setLoadingProgress('');
      } catch (error) {
        console.error('Failed to load some textures:', error);
        // Continue anyway - we have fallback rendering
        setTexturesLoaded(true);
        setLoadingProgress('');
      }
    };

    loadTextures();
  }, [gameState.map.tiles]);

  // Initialize Pixi.js application
  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    const initPixi = async () => {
      const app = new Application();

      await app.init({
        background: '#0a0a0a',
        resizeTo: containerRef.current!,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      containerRef.current!.appendChild(app.canvas);
      appRef.current = app;

      // Create main board container
      const boardContainer = new Container();
      app.stage.addChild(boardContainer);
      boardContainerRef.current = boardContainer;

      // Enable stage interactivity
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;

      // Set up panning and zooming
      setupPanZoom(app, boardContainer);

      setIsReady(true);
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  // Render tiles when ready and textures are loaded
  useEffect(() => {
    if (!isReady || !texturesLoaded || !boardContainerRef.current || !appRef.current) return;

    renderTiles(gameState.map);
    centerBoard();
  }, [isReady, texturesLoaded, gameState.map]);

  /**
   * Render all map tiles
   */
  const renderTiles = useCallback((map: MapState) => {
    if (!boardContainerRef.current) return;

    const boardContainer = boardContainerRef.current;

    // Clear existing tiles
    tilesRef.current.forEach(tile => tile.destroy());
    tilesRef.current.clear();
    boardContainer.removeChildren();

    // Create tiles
    map.tiles.forEach(tile => {
      const system = systems[tile.systemId];
      const systemType = system?.type ?? 'blue';

      // Find owner color for home systems
      let ownerColor: string | undefined;
      if (systemType === 'home') {
        const owner = gameState.players.find(p => {
          const playerFactionHome = systems[tile.systemId]?.factionId;
          return playerFactionHome === p.faction;
        });
        ownerColor = owner?.color;
      }

      // Get preloaded texture
      const texture = getTileTexture(tile.systemId);

      const hexTile = new HexTileSprite({
        tile,
        config: hexConfig,
        systemType: systemType as 'home' | 'blue' | 'red' | 'mecatol' | 'hyperlane',
        ownerColor: ownerColor as PlayerColor | undefined,
        playerColors,
        texture,
        onHover: (t) => {
          setHoveredTile(t);
          onTileHover?.(t);
        },
        onClick: (t) => {
          onTileClick?.(t);
        },
      });

      boardContainer.addChild(hexTile);
      tilesRef.current.set(`${tile.position.q},${tile.position.r}`, hexTile);
    });
  }, [gameState.players, hexConfig, playerColors, onTileClick, onTileHover]);

  /**
   * Center the board in the viewport
   */
  const centerBoard = useCallback(() => {
    if (!appRef.current || !boardContainerRef.current || !gameState.map.tiles.length) return;

    const app = appRef.current;
    const boardContainer = boardContainerRef.current;

    // Calculate bounds
    const positions = gameState.map.tiles.map(t => t.position);
    const bounds = getHexBounds(positions, hexConfig);

    // Center the board
    boardContainer.position.set(
      app.screen.width / 2 - (bounds.minX + bounds.width / 2),
      app.screen.height / 2 - (bounds.minY + bounds.height / 2)
    );
  }, [gameState.map.tiles, hexConfig]);

  /**
   * Set up pan and zoom controls
   */
  const setupPanZoom = (app: Application, boardContainer: Container) => {
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let containerStart = { x: 0, y: 0 };
    let hasDragged = false;

    // Zoom limits
    const MIN_ZOOM = 0.2;
    const MAX_ZOOM = 5;

    // Pan with any mouse button drag
    app.stage.on('pointerdown', (event) => {
      isDragging = true;
      hasDragged = false;
      dragStart = { x: event.globalX, y: event.globalY };
      containerStart = { x: boardContainer.x, y: boardContainer.y };

      // Change cursor to grabbing
      app.canvas.style.cursor = 'grabbing';
    });

    app.stage.on('pointerup', () => {
      isDragging = false;
      app.canvas.style.cursor = 'grab';
    });

    app.stage.on('pointerupoutside', () => {
      isDragging = false;
      app.canvas.style.cursor = 'grab';
    });

    app.stage.on('pointermove', (event) => {
      if (isDragging) {
        const dx = event.globalX - dragStart.x;
        const dy = event.globalY - dragStart.y;

        // Only start panning if moved more than 3 pixels (prevents accidental drags)
        if (!hasDragged && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
          hasDragged = true;
        }

        if (hasDragged) {
          boardContainer.position.set(containerStart.x + dx, containerStart.y + dy);
        }
      }
    });

    // Set initial cursor
    app.canvas.style.cursor = 'grab';

    // Zoom with mouse wheel
    const canvas = app.canvas;

    // Throttle wheel events for performance
    let lastWheelTime = 0;
    const WHEEL_THROTTLE = 16; // ~60fps

    canvas.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();

      // Throttle wheel events
      const now = Date.now();
      if (now - lastWheelTime < WHEEL_THROTTLE) return;
      lastWheelTime = now;

      // Use smaller scale factor for smoother zooming
      const scaleFactor = event.deltaY > 0 ? 0.92 : 1.08;
      const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, boardContainer.scale.x * scaleFactor));

      // Zoom toward mouse position
      const mouseX = event.offsetX;
      const mouseY = event.offsetY;

      const worldPos = {
        x: (mouseX - boardContainer.x) / boardContainer.scale.x,
        y: (mouseY - boardContainer.y) / boardContainer.scale.y,
      };

      boardContainer.scale.set(newScale);

      boardContainer.position.set(
        mouseX - worldPos.x * newScale,
        mouseY - worldPos.y * newScale
      );
    }, { passive: false });
  };

  /**
   * Highlight valid move targets
   */
  const highlightTiles = useCallback((positions: { q: number; r: number }[], color?: number) => {
    positions.forEach(pos => {
      const key = `${pos.q},${pos.r}`;
      const tile = tilesRef.current.get(key);
      tile?.highlight(color);
    });
  }, []);

  /**
   * Clear all highlights
   */
  const clearHighlights = useCallback(() => {
    tilesRef.current.forEach(tile => tile.clearHighlight());
  }, []);

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading indicator */}
      {loadingProgress && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white">{loadingProgress}</div>
        </div>
      )}

      {/* Tile info overlay */}
      {hoveredTile && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-sm">
          <div className="font-bold">System {hoveredTile.systemId}</div>
          <div className="text-gray-400">
            Position: ({hoveredTile.position.q}, {hoveredTile.position.r})
          </div>
          {hoveredTile.planets.length > 0 && (
            <div className="mt-1">
              Planets: {hoveredTile.planets.length}
            </div>
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
        <div>Click + drag to pan</div>
      </div>
    </div>
  );
}
