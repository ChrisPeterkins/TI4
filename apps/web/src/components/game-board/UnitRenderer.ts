import { Container, Graphics, Text, TextStyle, Sprite, Texture } from 'pixi.js';
import type { UnitType, PlayerColor } from '@ti4/shared';

/**
 * Player color hex values
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
 * Unit texture cache
 */
const unitTextureCache = new Map<UnitType, Texture>();
let texturesLoaded = false;

/**
 * Unit type to filename mapping
 * Files are in /images/units/ with lowercase names
 */
const UNIT_FILENAMES: Record<UnitType, string> = {
  fighter: 'fighter.png',
  infantry: 'infantry.png',
  mech: 'infantry.png', // Fallback - no mech image yet
  destroyer: 'destroyer.png',
  carrier: 'carrier.png',
  cruiser: 'cruiser.png',
  dreadnought: 'dreadnought.png',
  war_sun: 'warsun.png',
  flagship: 'flagship.png',
  pds: 'pds.png',
  space_dock: 'spacedock.png',
};

/**
 * Unit display sizes (for sprites)
 */
const UNIT_SIZES: Record<UnitType, number> = {
  fighter: 16,
  infantry: 14,
  mech: 20,
  destroyer: 20,
  carrier: 26,
  cruiser: 22,
  dreadnought: 28,
  war_sun: 32,
  flagship: 30,
  pds: 18,
  space_dock: 24,
};

/**
 * Fallback unit display configuration (when no texture)
 */
interface UnitConfig {
  shape: 'triangle' | 'diamond' | 'circle' | 'square' | 'hexagon' | 'star';
  size: number;
  filled: boolean;
  strokeWidth: number;
}

const UNIT_CONFIGS: Record<UnitType, UnitConfig> = {
  fighter: { shape: 'triangle', size: 6, filled: true, strokeWidth: 1 },
  infantry: { shape: 'circle', size: 5, filled: true, strokeWidth: 1 },
  mech: { shape: 'hexagon', size: 8, filled: true, strokeWidth: 2 },
  destroyer: { shape: 'triangle', size: 10, filled: false, strokeWidth: 2 },
  carrier: { shape: 'diamond', size: 14, filled: false, strokeWidth: 2 },
  cruiser: { shape: 'diamond', size: 12, filled: true, strokeWidth: 2 },
  dreadnought: { shape: 'square', size: 14, filled: true, strokeWidth: 2 },
  war_sun: { shape: 'star', size: 18, filled: true, strokeWidth: 2 },
  flagship: { shape: 'hexagon', size: 16, filled: true, strokeWidth: 2 },
  pds: { shape: 'square', size: 8, filled: false, strokeWidth: 2 },
  space_dock: { shape: 'square', size: 12, filled: false, strokeWidth: 3 },
};

/**
 * Unit group data for rendering
 */
export interface UnitGroup {
  type: UnitType;
  count: number;
  damaged: number;
  ownerId: string;
  ownerColor: PlayerColor;
}

/**
 * Load all unit textures
 * Uses simple individual asset loading to avoid bundle registration issues
 */
export async function loadUnitTextures(): Promise<void> {
  if (texturesLoaded) return;

  const { Assets } = await import('pixi.js');

  console.log('[UnitRenderer] Loading unit textures...');

  const loadPromises = Object.entries(UNIT_FILENAMES).map(async ([type, filename]) => {
    const url = `/images/units/${filename}`;
    try {
      const texture = await Assets.load<Texture>(url);
      unitTextureCache.set(type as UnitType, texture);
      return { type, success: true };
    } catch (error) {
      console.warn(`[UnitRenderer] Failed to load ${type}:`, error);
      return { type, success: false };
    }
  });

  const results = await Promise.all(loadPromises);
  const loaded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  texturesLoaded = true;
  console.log(`[UnitRenderer] Unit textures loaded: ${loaded} success, ${failed} failed`);
}

/**
 * Check if unit textures are loaded
 */
export function areUnitTexturesLoaded(): boolean {
  return texturesLoaded;
}

/**
 * Get a unit texture
 */
export function getUnitTexture(type: UnitType): Texture | undefined {
  return unitTextureCache.get(type);
}

/**
 * Creates a unit display (sprite if texture available, graphic fallback otherwise)
 */
export function createUnitGraphic(
  type: UnitType,
  color: number,
  damaged: boolean = false
): Container {
  const container = new Container();
  const texture = unitTextureCache.get(type);

  if (texture) {
    // Use sprite with tint
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);

    // Scale sprite to target size
    const targetSize = UNIT_SIZES[type];
    const scale = targetSize / Math.max(texture.width, texture.height);
    sprite.scale.set(scale);

    // Apply player color as tint
    sprite.tint = color;

    container.addChild(sprite);
  } else {
    // Fallback to geometric shape
    const config = UNIT_CONFIGS[type];
    const graphic = new Graphics();
    drawShape(graphic, config.shape, config.size, color, config.filled, config.strokeWidth);
    container.addChild(graphic);
  }

  // Add damage indicator
  if (damaged) {
    const damageIndicator = new Graphics();
    const size = UNIT_SIZES[type] || UNIT_CONFIGS[type].size;
    damageIndicator.circle(size * 0.4, -size * 0.4, 3);
    damageIndicator.fill({ color: 0xff0000 });
    damageIndicator.stroke({ color: 0xffffff, width: 1 });
    container.addChild(damageIndicator);
  }

  return container;
}

/**
 * Draw a shape on a graphics object (fallback rendering)
 */
function drawShape(
  g: Graphics,
  shape: UnitConfig['shape'],
  size: number,
  color: number,
  filled: boolean,
  strokeWidth: number
): void {
  switch (shape) {
    case 'triangle':
      drawTriangle(g, size);
      break;
    case 'diamond':
      drawDiamond(g, size);
      break;
    case 'circle':
      g.circle(0, 0, size);
      break;
    case 'square':
      g.rect(-size / 2, -size / 2, size, size);
      break;
    case 'hexagon':
      drawHexagon(g, size);
      break;
    case 'star':
      drawStar(g, size);
      break;
  }

  if (filled) {
    g.fill({ color });
  }
  g.stroke({ color, width: strokeWidth });
}

function drawTriangle(g: Graphics, size: number): void {
  const h = size * Math.sqrt(3) / 2;
  g.moveTo(0, -h);
  g.lineTo(size / 2, h / 2);
  g.lineTo(-size / 2, h / 2);
  g.closePath();
}

function drawDiamond(g: Graphics, size: number): void {
  g.moveTo(0, -size);
  g.lineTo(size * 0.6, 0);
  g.lineTo(0, size);
  g.lineTo(-size * 0.6, 0);
  g.closePath();
}

function drawHexagon(g: Graphics, size: number): void {
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    if (i === 0) {
      g.moveTo(x, y);
    } else {
      g.lineTo(x, y);
    }
  }
  g.closePath();
}

function drawStar(g: Graphics, size: number): void {
  const points = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;

  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) {
      g.moveTo(x, y);
    } else {
      g.lineTo(x, y);
    }
  }
  g.closePath();
}

/**
 * Creates a container with grouped units and count badge
 */
export function createUnitGroupDisplay(group: UnitGroup): Container {
  const container = new Container();
  const color = PLAYER_COLORS[group.ownerColor];
  const size = UNIT_SIZES[group.type] || UNIT_CONFIGS[group.type].size;

  // Create the main unit icon
  const unitGraphic = createUnitGraphic(group.type, color, group.damaged > 0);
  container.addChild(unitGraphic);

  // Add count badge if more than 1
  if (group.count > 1) {
    const badge = createCountBadge(group.count, color);
    badge.position.set(size * 0.5, size * 0.4);
    container.addChild(badge);
  }

  // Add damage count if some but not all units are damaged
  if (group.damaged > 0 && group.damaged < group.count) {
    const damageText = new Text({
      text: `${group.damaged}`,
      style: new TextStyle({
        fontSize: 8,
        fill: 0xff0000,
        fontWeight: 'bold',
      }),
    });
    damageText.anchor.set(0.5);
    damageText.position.set(size * 0.5, -size * 0.5);
    container.addChild(damageText);
  }

  return container;
}

/**
 * Creates a count badge
 */
function createCountBadge(count: number, color: number): Container {
  const container = new Container();

  // Badge background
  const bg = new Graphics();
  bg.circle(0, 0, 8);
  bg.fill({ color: 0x000000, alpha: 0.8 });
  bg.stroke({ color, width: 1.5 });
  container.addChild(bg);

  // Count text
  const text = new Text({
    text: count.toString(),
    style: new TextStyle({
      fontSize: 10,
      fill: 0xffffff,
      fontWeight: 'bold',
    }),
  });
  text.anchor.set(0.5);
  container.addChild(text);

  return container;
}

/**
 * Renders all units for a tile's space area
 */
export class SpaceUnitDisplay extends Container {
  private unitGroups: Map<string, Container> = new Map();

  constructor() {
    super();
  }

  /**
   * Update the display with new unit groups
   */
  update(groups: UnitGroup[], maxWidth: number): void {
    // Clear existing
    this.removeChildren();
    this.unitGroups.clear();

    if (groups.length === 0) return;

    // Sort groups by unit type priority (larger ships first)
    const priority: UnitType[] = [
      'war_sun', 'flagship', 'dreadnought', 'carrier', 'cruiser', 'destroyer', 'fighter'
    ];

    const sortedGroups = [...groups].sort((a, b) => {
      const aIdx = priority.indexOf(a.type);
      const bIdx = priority.indexOf(b.type);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

    // Layout units in rows
    const spacing = 28;
    const maxPerRow = Math.floor(maxWidth / spacing);

    sortedGroups.forEach((group, index) => {
      const display = createUnitGroupDisplay(group);
      const row = Math.floor(index / maxPerRow);
      const col = index % maxPerRow;

      const rowWidth = Math.min(sortedGroups.length - row * maxPerRow, maxPerRow) * spacing;
      const startX = -rowWidth / 2 + spacing / 2;

      display.position.set(startX + col * spacing, row * spacing - 10);
      this.addChild(display);
      this.unitGroups.set(`${group.type}-${group.ownerId}`, display);
    });
  }
}

/**
 * Renders ground units on a planet
 */
export class PlanetUnitDisplay extends Container {
  constructor() {
    super();
  }

  /**
   * Update the display with ground unit groups
   */
  update(groups: UnitGroup[], planetRadius: number): void {
    this.removeChildren();

    if (groups.length === 0) return;

    // Filter to ground units only
    const groundUnits = groups.filter(g =>
      g.type === 'infantry' || g.type === 'mech' || g.type === 'pds' || g.type === 'space_dock'
    );

    if (groundUnits.length === 0) return;

    // Layout around the planet
    const angleStep = (Math.PI * 2) / Math.max(groundUnits.length, 4);
    const radius = planetRadius + 12;

    groundUnits.forEach((group, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const display = createUnitGroupDisplay(group);
      display.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      );
      display.scale.set(0.75);
      this.addChild(display);
    });
  }
}

/**
 * Get player color as hex number
 */
export function getPlayerColorHex(color: PlayerColor): number {
  return PLAYER_COLORS[color];
}
