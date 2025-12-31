/**
 * Player Station Layout System
 *
 * Provides a structured layout system that prevents component overlap.
 * All dimensions are in 3D world units.
 *
 * Coordinate system:
 * - X: Left (-) to Right (+)
 * - Y: Down (-) to Up (+) (height above table)
 * - Z: Front/Near (-) to Back/Far (+) (toward player)
 */

// ============================================================================
// Component Dimensions (raw, before scaling)
// ============================================================================

export const RAW_DIMENSIONS = {
  factionSheet: { width: 4.69, height: 3.0 },
  commandSheet: { width: 3.0, height: 1.2 },
  strategyCard: { width: 0.8, height: 0.8 },
  vpTrack: { width: 1.2, height: 0.4 },
  passButton: { width: 0.4, height: 0.6 }, // Based on panel_pass texture aspect ratio
  leaderCards: { width: 5.5, height: 1.2 }, // 3 wider cards
  techBoard: { width: 5.7, height: 3.07 },
  actionCards: { width: 7.2, height: 1.26 }, // ~8 cards spread
  secretsMat: { width: 2.1, height: 1.0 }, // 3 cards × 0.6 + gaps, side by side
  promissoryCards: { width: 4.5, height: 1.26 }, // ~5 cards spread
  unitSupply: { width: 8.0, height: 2.75 },
  // Stack layouts (less width)
  actionCardsStack: { width: 1.2, height: 1.26 },
  promissoryCardsStack: { width: 1.0, height: 1.26 },
  // PoK components
  relicFragments: { width: 2.4, height: 0.6 },
  relics: { width: 3.3, height: 1.25 }, // ~4 cards spread
  relicsStack: { width: 1.0, height: 1.25 },
} as const;

// ============================================================================
// Default Scales for Components
// ============================================================================

export const DEFAULT_SCALES = {
  factionSheet: 1.15, // 25% larger than previous 0.92
  commandSheet: 0.9,
  strategyCard: 1.2, // Larger for better visibility
  vpTrack: 0.9,
  passButton: 1.5,
  leaderCards: 0.7,
  techBoard: 0.7, // Scaled up for better readability
  actionCards: 0.7,
  secretsMat: 0.7,
  promissoryCards: 0.6,
  unitSupply: 0.8,
  // PoK components
  relicFragments: 0.8,
  relics: 0.7,
} as const;

// ============================================================================
// Layout Configuration
// ============================================================================

export interface LayoutConfig {
  /** Gap between components horizontally */
  horizontalGap: number;
  /** Gap between rows vertically (Z direction) */
  rowGap: number;
  /** Y offset for components above the base plane */
  yOffset: number;
  /** Whether the viewer is the current player (affects card layouts) */
  isCurrentPlayer: boolean;
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  horizontalGap: 0.15,
  rowGap: 0.2,
  yOffset: 0.02,
  isCurrentPlayer: false,
};

// ============================================================================
// Scaled Dimensions Calculator
// ============================================================================

export interface ScaledDimensions {
  width: number;
  height: number;
  scale: number;
}

export function getScaledDimensions(
  component: keyof typeof RAW_DIMENSIONS,
  customScale?: number
): ScaledDimensions {
  const raw = RAW_DIMENSIONS[component];
  const scale = customScale ?? DEFAULT_SCALES[component as keyof typeof DEFAULT_SCALES] ?? 1;
  return {
    width: raw.width * scale,
    height: raw.height * scale,
    scale,
  };
}

// ============================================================================
// Layout Position Type
// ============================================================================

export interface LayoutPosition {
  position: [number, number, number];
  scale: number;
  visible: boolean;
}

export interface StationLayoutPositions {
  // Row 1: Identity & Resources
  factionSheet: LayoutPosition;
  commandSheet: LayoutPosition;
  strategyCard: LayoutPosition;
  vpTrack: LayoutPosition;
  passButton: LayoutPosition;

  // Row 2: Leaders + Relic Fragments
  leaders: LayoutPosition;
  relicFragments: LayoutPosition;

  // Row 3: Tech Board
  techBoard: LayoutPosition;

  // Row 4: Cards
  actionCards: LayoutPosition;
  secretsMat: LayoutPosition;
  promissoryCards: LayoutPosition;

  // Row 5: Unit Supply + Relics
  unitSupply: LayoutPosition;
  relics: LayoutPosition;

  // Station bounds (for background sizing)
  bounds: {
    width: number;
    height: number;
    centerX: number;
    centerZ: number;
  };
}

// ============================================================================
// Layout Calculator
// ============================================================================

/**
 * Calculate non-overlapping positions for all player station components.
 * Three-column layout:
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  LEFT COLUMN      │  MIDDLE COLUMN    │  RIGHT COLUMN              │
 * │  [Faction Sheet]  │  [Tech Board]     │  [Strat][Secrets][Pass]    │
 * │                   │                   │                             │
 * │  [Unit Supply]    │  [Leaders]        │  [Promissory]               │
 * │                   │  [Command Sheet]  │  [Action Cards]             │
 * │                   │                   │  [Relics]                   │
 * │                   │                   │  [Relic Frags]              │
 * └─────────────────────────────────────────────────────────────────────┘
 */
export function calculateStationLayout(
  config: Partial<LayoutConfig> = {}
): StationLayoutPositions {
  const cfg: LayoutConfig = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  const { horizontalGap, rowGap, yOffset, isCurrentPlayer } = cfg;

  // Get scaled dimensions for all components
  const dims = {
    factionSheet: getScaledDimensions('factionSheet'),
    commandSheet: getScaledDimensions('commandSheet'),
    strategyCard: getScaledDimensions('strategyCard'),
    vpTrack: getScaledDimensions('vpTrack'),
    passButton: getScaledDimensions('passButton'),
    leaderCards: getScaledDimensions('leaderCards'),
    techBoard: getScaledDimensions('techBoard'),
    actionCards: getScaledDimensions(isCurrentPlayer ? 'actionCards' : 'actionCardsStack'),
    secretsMat: getScaledDimensions('secretsMat'),
    promissoryCards: getScaledDimensions(isCurrentPlayer ? 'promissoryCards' : 'promissoryCardsStack'),
    unitSupply: getScaledDimensions('unitSupply'),
    relicFragments: getScaledDimensions('relicFragments'),
    relics: getScaledDimensions(isCurrentPlayer ? 'relics' : 'relicsStack'),
  };

  // ========================================
  // THREE-COLUMN LAYOUT
  // ========================================

  const zone1Z = 0;
  const topRowZ = zone1Z + rowGap;

  // LEFT COLUMN: Faction Sheet + Unit Supply
  const factionSheetLeftEdge = -dims.factionSheet.width / 2 - 4;
  const factionSheetX = factionSheetLeftEdge + dims.factionSheet.width / 2;
  const factionSheetZ = topRowZ + dims.factionSheet.height / 2;
  const factionSheetRightEdge = factionSheetLeftEdge + dims.factionSheet.width;

  // Unit Supply below faction sheet
  const unitSupplyZ = factionSheetZ + dims.factionSheet.height / 2 + rowGap + dims.unitSupply.height / 2;
  const unitSupplyX = factionSheetX;

  // MIDDLE COLUMN: Tech Board + Leaders + Command Sheet
  const middleColumnLeftEdge = factionSheetRightEdge + horizontalGap;
  const techBoardX = middleColumnLeftEdge + dims.techBoard.width / 2;
  const techBoardZ = topRowZ + dims.techBoard.height / 2;
  const techBoardRightEdge = middleColumnLeftEdge + dims.techBoard.width;

  // Leaders below tech board
  const leadersRowZ = techBoardZ + dims.techBoard.height / 2 + rowGap + dims.leaderCards.height / 2;
  const leadersX = techBoardX;

  // Command Sheet below leaders
  const commandSheetZ = leadersRowZ + dims.leaderCards.height / 2 + rowGap + dims.commandSheet.height / 2;
  const commandSheetX = techBoardX;

  // RIGHT COLUMN: Strategy card, Secrets, Pass button on top row
  const rightColumnLeftEdge = techBoardRightEdge + horizontalGap;
  const strategyCardX = rightColumnLeftEdge + dims.strategyCard.width / 2;
  const strategyCardZ = topRowZ + dims.strategyCard.height / 2;

  const secretsMatX = strategyCardX + dims.strategyCard.width / 2 + horizontalGap + dims.secretsMat.width / 2;
  const secretsMatZ = strategyCardZ;

  const passButtonX = secretsMatX + dims.secretsMat.width / 2 + horizontalGap + dims.passButton.width / 2;
  const passButtonZ = strategyCardZ;

  // Center X for right column cards
  const rightColumnCenterX = (strategyCardX + passButtonX) / 2;

  // Promissory below strategy card area
  const promissoryRowZ = strategyCardZ + dims.strategyCard.height / 2 + rowGap + dims.promissoryCards.height / 2;
  const promissoryCardsX = rightColumnCenterX;

  // Action Cards below promissory
  const actionCardsZ = promissoryRowZ + dims.promissoryCards.height / 2 + rowGap + dims.actionCards.height / 2;
  const actionCardsX = rightColumnCenterX;

  // Relics below action cards
  const relicsZ = actionCardsZ + dims.actionCards.height / 2 + rowGap + dims.relics.height / 2;
  const relicsX = rightColumnCenterX;

  // Relic Fragments below relics
  const relicFragmentsZ = relicsZ + dims.relics.height / 2 + rowGap + dims.relicFragments.height / 2;
  const relicFragmentsX = rightColumnCenterX;

  // Calculate bounds
  const leftColumnBottom = unitSupplyZ + dims.unitSupply.height / 2;
  const middleColumnBottom = commandSheetZ + dims.commandSheet.height / 2;
  const rightColumnBottom = relicFragmentsZ + dims.relicFragments.height / 2;
  const totalHeight = Math.max(leftColumnBottom, middleColumnBottom, rightColumnBottom);

  const leftmostX = factionSheetLeftEdge;
  const rightmostX = passButtonX + dims.passButton.width / 2;
  const stationWidth = rightmostX - leftmostX;
  const centerZ = totalHeight / 2;
  const centerX = (leftmostX + rightmostX) / 2;

  return {
    factionSheet: {
      position: [factionSheetX, yOffset, factionSheetZ],
      scale: dims.factionSheet.scale,
      visible: true,
    },
    commandSheet: {
      position: [commandSheetX, yOffset, commandSheetZ],
      scale: dims.commandSheet.scale,
      visible: true,
    },
    strategyCard: {
      position: [strategyCardX, yOffset, strategyCardZ],
      scale: dims.strategyCard.scale,
      visible: true,
    },
    vpTrack: {
      position: [0, yOffset, 0],
      scale: dims.vpTrack.scale,
      visible: false,
    },
    passButton: {
      position: [passButtonX, yOffset, passButtonZ],
      scale: dims.passButton.scale,
      visible: true,
    },
    leaders: {
      position: [leadersX, yOffset, leadersRowZ],
      scale: dims.leaderCards.scale,
      visible: true,
    },
    relicFragments: {
      position: [relicFragmentsX, yOffset, relicFragmentsZ],
      scale: dims.relicFragments.scale,
      visible: true,
    },
    techBoard: {
      position: [techBoardX, yOffset, techBoardZ],
      scale: dims.techBoard.scale,
      visible: true,
    },
    actionCards: {
      position: [actionCardsX, yOffset, actionCardsZ],
      scale: dims.actionCards.scale,
      visible: true,
    },
    secretsMat: {
      position: [secretsMatX, yOffset, secretsMatZ],
      scale: dims.secretsMat.scale,
      visible: true,
    },
    promissoryCards: {
      position: [promissoryCardsX, yOffset, promissoryRowZ],
      scale: dims.promissoryCards.scale,
      visible: true,
    },
    unitSupply: {
      position: [unitSupplyX, yOffset, unitSupplyZ],
      scale: dims.unitSupply.scale,
      visible: true,
    },
    relics: {
      position: [relicsX, yOffset, relicsZ],
      scale: dims.relics.scale,
      visible: true,
    },
    bounds: {
      width: stationWidth + 1.0,
      height: totalHeight + 1.0,
      centerX: centerX,
      centerZ: centerZ,
    },
  };
}

// ============================================================================
// Debug Helper
// ============================================================================

/**
 * Log layout dimensions for debugging
 */
export function debugLayout(layout: StationLayoutPositions): void {
  console.log('=== Station Layout Debug ===');
  console.log(`Bounds: ${layout.bounds.width.toFixed(2)}w × ${layout.bounds.height.toFixed(2)}h`);
  console.log(`Center: (${layout.bounds.centerX.toFixed(2)}, ${layout.bounds.centerZ.toFixed(2)})`);

  const components = [
    'factionSheet', 'commandSheet', 'strategyCard', 'vpTrack', 'passButton',
    'leaders', 'relicFragments', 'techBoard', 'actionCards', 'secretsMat', 'promissoryCards',
    'unitSupply', 'relics'
  ] as const;

  for (const name of components) {
    const pos = layout[name];
    console.log(`${name}: pos=(${pos.position[0].toFixed(2)}, ${pos.position[2].toFixed(2)}) scale=${pos.scale}`);
  }
}
