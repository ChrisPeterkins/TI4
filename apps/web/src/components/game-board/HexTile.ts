import { Container, Graphics, Text, TextStyle, Sprite, Texture } from 'pixi.js';
import type { HexCoord, MapTile, PlayerColor, UnitType } from '@ti4/shared';
import { hexToPixel, getHexCorners, type HexConfig } from '@/lib/hex';
import { SpaceUnitDisplay, PlanetUnitDisplay, type UnitGroup } from './UnitRenderer';

/**
 * Color mapping for player colors
 */
const PLAYER_COLORS: Record<PlayerColor, number> = {
  red: 0xe53935,
  blue: 0x1e88e5,
  yellow: 0xfdd835,
  green: 0x43a047,
  purple: 0x8e24aa,
  orange: 0xfb8c00,
  pink: 0xec407a,
  black: 0x424242,
};

/**
 * Tile type colors (fallback when no texture)
 */
const TILE_COLORS = {
  mecatol: 0xffd700,
  home: 0x4a4a4a,
  blue: 0x1a237e,
  red: 0x4a0000,
  empty: 0x212121,
  hyperlane: 0x37474f,
};

/**
 * Anomaly colors (fallback)
 */
const ANOMALY_COLORS: Record<string, number> = {
  asteroid: 0x5d4037,
  nebula: 0x7b1fa2,
  supernova: 0xff5722,
  gravity_rift: 0x00bcd4,
};

export interface HexTileOptions {
  tile: MapTile;
  config: HexConfig;
  systemType: 'home' | 'blue' | 'red' | 'mecatol' | 'hyperlane';
  ownerColor?: PlayerColor;
  playerColors: Map<string, PlayerColor>;
  texture?: Texture;
  onHover?: (tile: MapTile | null) => void;
  onClick?: (tile: MapTile) => void;
}

/**
 * Pixi.js hex tile renderer with actual tile images
 */
export class HexTileSprite extends Container {
  private tile: MapTile;
  private config: HexConfig;
  private tileSprite: Sprite | null = null;
  private hexMask: Graphics;
  private hexGraphics: Graphics;
  private borderGraphics: Graphics;
  private contentContainer: Container;
  private unitsContainer: Container;
  private spaceUnitDisplay: SpaceUnitDisplay;
  private planetUnitDisplays: Map<string, PlanetUnitDisplay> = new Map();
  private playerColors: Map<string, PlayerColor>;
  private isHovered = false;

  constructor(options: HexTileOptions) {
    super();

    this.tile = options.tile;
    this.config = options.config;
    this.playerColors = options.playerColors;

    // Position the container
    const pixelPos = hexToPixel(this.tile.position, this.config);
    this.position.set(pixelPos.x, pixelPos.y);

    // Create hex mask for clipping the tile sprite
    this.hexMask = new Graphics();
    this.addChild(this.hexMask);
    this.drawHexMask();

    // Create fallback hex shape (shown if no texture)
    this.hexGraphics = new Graphics();
    this.addChild(this.hexGraphics);

    // If we have a texture, create the sprite
    if (options.texture) {
      this.createTileSprite(options.texture);
    } else {
      // Draw fallback colored hex
      this.drawFallbackHex(options.systemType, options.ownerColor);
    }

    // Create border (always visible)
    this.borderGraphics = new Graphics();
    this.addChild(this.borderGraphics);

    // Create content container for overlays
    this.contentContainer = new Container();
    this.addChild(this.contentContainer);

    // Create units container (on top)
    this.unitsContainer = new Container();
    this.addChild(this.unitsContainer);

    // Create space unit display
    this.spaceUnitDisplay = new SpaceUnitDisplay();
    this.spaceUnitDisplay.position.set(0, -this.config.size * 0.25);
    this.unitsContainer.addChild(this.spaceUnitDisplay);

    // Draw overlays
    this.drawOverlays();

    // Draw default border
    this.drawBorder(0x333333, 1);

    // Draw units
    this.drawUnits();

    // Set up interactivity
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', () => {
      this.isHovered = true;
      this.drawBorder(0xffffff, 3);
      options.onHover?.(this.tile);
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.drawBorder(0x333333, 1);
      options.onHover?.(null);
    });

    this.on('pointertap', () => {
      options.onClick?.(this.tile);
    });
  }

  /**
   * Draw the hex mask for clipping
   */
  private drawHexMask(): void {
    const corners = getHexCorners({ x: 0, y: 0 }, this.config.size, this.config.orientation);
    this.hexMask.clear();
    this.hexMask.poly(corners.flatMap(c => [c.x, c.y]));
    this.hexMask.fill({ color: 0xffffff });
  }

  /**
   * Create the tile sprite from texture
   */
  private createTileSprite(texture: Texture): void {
    this.tileSprite = new Sprite(texture);

    // Center the sprite
    this.tileSprite.anchor.set(0.5);

    // Scale to fit the hex exactly
    // TI4 tile images are square with hexagonal content that fills edge-to-edge
    // For flat-top: width = 2 * size, height = sqrt(3) * size
    // For pointy-top: width = sqrt(3) * size, height = 2 * size
    const hexWidth = this.config.orientation === 'flat'
      ? 2 * this.config.size
      : Math.sqrt(3) * this.config.size;

    // Scale so the image hex fills our display hex exactly
    const scale = hexWidth / texture.width;

    this.tileSprite.scale.set(scale);

    // Apply hex mask to clip to hexagonal shape
    this.tileSprite.mask = this.hexMask;

    // Add sprite behind the graphics
    this.addChildAt(this.tileSprite, 1);
  }

  /**
   * Draw fallback colored hex when no texture
   */
  private drawFallbackHex(systemType: string, ownerColor?: PlayerColor): void {
    const corners = getHexCorners({ x: 0, y: 0 }, this.config.size, this.config.orientation);

    let fillColor = TILE_COLORS.empty;

    if (this.tile.anomaly && ANOMALY_COLORS[this.tile.anomaly]) {
      fillColor = ANOMALY_COLORS[this.tile.anomaly];
    } else if (systemType === 'mecatol') {
      fillColor = TILE_COLORS.mecatol;
    } else if (systemType === 'home' && ownerColor) {
      fillColor = PLAYER_COLORS[ownerColor];
    } else if (systemType === 'blue') {
      fillColor = TILE_COLORS.blue;
    } else if (systemType === 'red') {
      fillColor = TILE_COLORS.red;
    }

    this.hexGraphics.clear();
    this.hexGraphics.poly(corners.flatMap(c => [c.x, c.y]));
    this.hexGraphics.fill({ color: fillColor, alpha: 0.8 });
  }

  /**
   * Draw tile border
   */
  private drawBorder(color: number, width: number): void {
    const corners = getHexCorners({ x: 0, y: 0 }, this.config.size, this.config.orientation);

    this.borderGraphics.clear();
    this.borderGraphics.poly(corners.flatMap(c => [c.x, c.y]));
    this.borderGraphics.stroke({ color, width, alpha: 1 });
  }

  /**
   * Draw overlays (wormholes, command tokens, etc.)
   * Note: We no longer draw planets as circles since they're visible in the tile image
   */
  private drawOverlays(): void {
    // Draw wormhole indicator
    if (this.tile.wormhole) {
      this.drawWormhole(this.tile.wormhole);
    }

    // Draw command tokens
    this.drawCommandTokens();

    // Draw tile number (semi-transparent, for debugging)
    this.drawTileNumber();
  }

  /**
   * Draw wormhole indicator
   */
  private drawWormhole(wormholeType: string): void {
    const colors: Record<string, number> = {
      alpha: 0x00ff00,
      beta: 0xff0000,
      gamma: 0x0000ff,
      delta: 0xffff00,
    };

    const color = colors[wormholeType] ?? 0xffffff;
    const size = this.config.size * 0.15;

    const wormhole = new Graphics();
    wormhole.circle(0, -this.config.size * 0.55, size);
    wormhole.fill({ color, alpha: 0.9 });
    wormhole.stroke({ color: 0xffffff, width: 2 });

    // Add label
    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 10,
      fill: 0xffffff,
      fontWeight: 'bold',
    });

    const label = new Text({
      text: wormholeType.charAt(0).toUpperCase(),
      style,
    });
    label.anchor.set(0.5);
    label.position.set(0, -this.config.size * 0.55);

    this.contentContainer.addChild(wormhole);
    this.contentContainer.addChild(label);
  }

  /**
   * Draw tile system number (semi-transparent debug info)
   */
  private drawTileNumber(): void {
    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 10,
      fill: 0xffffff,
    });

    const text = new Text({
      text: this.tile.systemId.toString(),
      style,
    });
    text.anchor.set(0.5);
    text.position.set(0, this.config.size * 0.7);
    text.alpha = 0.4;

    this.contentContainer.addChild(text);
  }

  /**
   * Draw command tokens on the tile
   */
  private drawCommandTokens(): void {
    const tokens = this.tile.commandTokens;
    if (tokens.length === 0) return;

    const tokenSize = this.config.size * 0.12;
    const startY = -this.config.size * 0.35;

    tokens.forEach((playerId, index) => {
      const token = new Graphics();
      const x = (index - (tokens.length - 1) / 2) * tokenSize * 2.5;

      const playerColor = this.playerColors.get(playerId);
      const colorHex = playerColor ? PLAYER_COLORS[playerColor] : 0xff9800;

      // Draw command token as a small rounded rectangle
      token.roundRect(x - tokenSize / 2, startY - tokenSize / 2, tokenSize, tokenSize, 2);
      token.fill({ color: colorHex });
      token.stroke({ color: 0xffffff, width: 1 });

      this.contentContainer.addChild(token);
    });
  }

  /**
   * Draw units in space and on planets
   */
  private drawUnits(): void {
    // Group space units by owner and type
    const spaceUnits = this.tile.units.filter(u => !u.planetId);
    const spaceUnitGroups = this.groupUnits(spaceUnits);
    this.spaceUnitDisplay.update(spaceUnitGroups, this.config.size * 1.5);

    // Draw ground units on each planet
    this.tile.planets.forEach((planet, index) => {
      const groundUnits = planet.units;
      if (groundUnits.length === 0) return;

      const groundGroups = this.groupUnits(groundUnits);

      let planetDisplay = this.planetUnitDisplays.get(planet.planetId);
      if (!planetDisplay) {
        planetDisplay = new PlanetUnitDisplay();
        this.planetUnitDisplays.set(planet.planetId, planetDisplay);
        this.unitsContainer.addChild(planetDisplay);
      }

      // Position ground units based on planet position
      // For now, use approximate positions based on planet count
      const planetSpacing = this.config.size * 0.4;
      const startX = -((this.tile.planets.length - 1) * planetSpacing) / 2;
      planetDisplay.position.set(startX + index * planetSpacing, this.config.size * 0.15);

      planetDisplay.update(groundGroups, this.config.size * 0.12);
    });
  }

  /**
   * Group units by owner and type
   */
  private groupUnits(units: { id: string; type: UnitType; ownerId: string; damaged: boolean }[]): UnitGroup[] {
    const groups = new Map<string, UnitGroup>();

    for (const unit of units) {
      const key = `${unit.ownerId}-${unit.type}`;
      const existing = groups.get(key);

      if (existing) {
        existing.count++;
        if (unit.damaged) existing.damaged++;
      } else {
        const ownerColor = this.playerColors.get(unit.ownerId) ?? 'black';
        groups.set(key, {
          type: unit.type,
          count: 1,
          damaged: unit.damaged ? 1 : 0,
          ownerId: unit.ownerId,
          ownerColor: ownerColor as PlayerColor,
        });
      }
    }

    return Array.from(groups.values());
  }

  /**
   * Update the tile texture
   */
  setTexture(texture: Texture): void {
    if (this.tileSprite) {
      this.tileSprite.texture = texture;
    } else {
      this.createTileSprite(texture);
      // Hide fallback graphics
      this.hexGraphics.visible = false;
    }
  }

  /**
   * Update tile state
   */
  updateTile(tile: MapTile, systemType: string, ownerColor?: PlayerColor): void {
    this.tile = tile;
    this.contentContainer.removeChildren();
    this.drawOverlays();
    this.drawUnits();
  }

  /**
   * Highlight the tile
   */
  highlight(color: number = 0x00ff00): void {
    this.drawBorder(color, 3);
  }

  /**
   * Remove highlight
   */
  clearHighlight(): void {
    if (!this.isHovered) {
      this.drawBorder(0x333333, 1);
    }
  }

  /**
   * Get the tile data
   */
  getTile(): MapTile {
    return this.tile;
  }

  /**
   * Get tile position
   */
  getHexPosition(): HexCoord {
    return this.tile.position;
  }
}
