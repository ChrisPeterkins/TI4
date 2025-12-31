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
  leaderCards: { width: 2.25, height: 1.05 }, // 3 cards × 0.75 spacing
  techBoard: { width: 5.7, height: 3.07 },
  actionCards: { width: 7.2, height: 1.26 }, // ~8 cards spread
  secretsMat: { width: 2.1, height: 1.0 }, // 3 cards × 0.6 + gaps, side by side
  promissoryCards: { width: 4.5, height: 1.26 }, // ~5 cards spread
  unitSupply: { width: 6.0, height: 2.0 },
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
  factionSheet: 0.8,
  commandSheet: 0.9,
  strategyCard: 0.9,
  vpTrack: 0.9,
  passButton: 1.0,
  leaderCards: 0.7,
  techBoard: 0.55,
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
 * Uses a two-column layout to better utilize space:
 *
 * ┌───────────────────────────────────────────────────────────────┐
 * │  LEFT COLUMN           │  RIGHT COLUMN              │ [Pass]  │
 * │  [Faction Sheet]       │  [Strat][Leaders] [Frags]  │         │
 * │                        │  [Command] [VP]            │         │
 * │  [Tech Board]          │  [Secrets] [Promissory]    │         │
 * │                        │  [Unit Supply]             │         │
 * ├────────────────────────┴────────────────────────────┴─────────┤
 * │  [Action Cards] [Relics]                                      │
 * └───────────────────────────────────────────────────────────────┘
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

  const columnGap = horizontalGap * 2; // Gap between left and right columns

  // ========================================
  // TWO-COLUMN ZONE (TOP)
  // Left: Faction Sheet + Tech Board below
  // Right: Leaders/Fragments + Command/Controls below
  // ========================================

  // LEFT COLUMN dimensions
  const leftColumnWidth = Math.max(dims.factionSheet.width, dims.techBoard.width);

  // RIGHT COLUMN dimensions
  // Strategy card + Leaders + Fragments on top, command sheet + VP below
  const strategyLeadersWidth = dims.strategyCard.width + horizontalGap +
                               dims.leaderCards.width + horizontalGap + dims.relicFragments.width;
  const controlsRowWidth = dims.commandSheet.width + horizontalGap +
                           dims.vpTrack.width;
  const rightColumnWidth = Math.max(strategyLeadersWidth, controlsRowWidth);

  // Total width of two-column zone
  const twoColumnWidth = leftColumnWidth + columnGap + rightColumnWidth;

  // Column X positions (centered overall)
  const leftColumnCenterX = -twoColumnWidth / 2 + leftColumnWidth / 2;
  const rightColumnCenterX = twoColumnWidth / 2 - rightColumnWidth / 2;

  // Z positions for two-column zone
  const zone1Z = 0; // Start at 0

  // Left column offset - push faction sheet + tech board down so they're within bounds
  const leftColumnStartZ = zone1Z + dims.factionSheet.height / 2 + rowGap;

  // LEFT COLUMN: Faction Sheet
  const factionSheetX = leftColumnCenterX;
  const factionSheetZ = leftColumnStartZ;

  // RIGHT COLUMN: Strategy Card + Leaders + Fragments (top row)
  let topRowX = rightColumnCenterX - strategyLeadersWidth / 2;
  const strategyCardX = topRowX + dims.strategyCard.width / 2;
  topRowX += dims.strategyCard.width + horizontalGap;
  const leadersX = topRowX + dims.leaderCards.width / 2;
  topRowX += dims.leaderCards.width + horizontalGap;
  const relicFragmentsX = topRowX + dims.relicFragments.width / 2;
  const leadersFragmentsZ = zone1Z + dims.leaderCards.height / 2 + rowGap;

  // RIGHT COLUMN: Controls row below leaders
  const controlsRowZ = leadersFragmentsZ + dims.leaderCards.height / 2 + rowGap + dims.commandSheet.height / 2;

  // Position controls left to right within right column
  let controlsX = rightColumnCenterX - controlsRowWidth / 2;

  const commandSheetX = controlsX + dims.commandSheet.width / 2;
  controlsX += dims.commandSheet.width + horizontalGap;

  const vpTrackX = controlsX + dims.vpTrack.width / 2;

  // PASS BUTTON: Top right corner of the station
  const passButtonX = twoColumnWidth / 2 + horizontalGap + dims.passButton.width / 2;
  const passButtonZ = zone1Z + dims.passButton.height / 2 + rowGap;

  // RIGHT COLUMN: Secrets + Promissory row (below controls)
  const secretsPromissoryWidth = dims.secretsMat.width + horizontalGap + dims.promissoryCards.width;
  const secretsPromissoryZ = controlsRowZ + dims.commandSheet.height / 2 + rowGap +
                             Math.max(dims.secretsMat.height, dims.promissoryCards.height) / 2;
  let secretsPromissoryX = rightColumnCenterX - secretsPromissoryWidth / 2;
  const secretsMatX = secretsPromissoryX + dims.secretsMat.width / 2;
  secretsPromissoryX += dims.secretsMat.width + horizontalGap;
  const promissoryCardsX = secretsPromissoryX + dims.promissoryCards.width / 2;

  // RIGHT COLUMN: Unit Supply (below secrets/promissory)
  const unitSupplyZ = secretsPromissoryZ + Math.max(dims.secretsMat.height, dims.promissoryCards.height) / 2 +
                      rowGap + dims.unitSupply.height / 2;
  const unitSupplyX = rightColumnCenterX;

  // LEFT COLUMN: Tech Board (below faction sheet)
  const techBoardZ = factionSheetZ + dims.factionSheet.height / 2 + rowGap + dims.techBoard.height / 2;
  const techBoardX = leftColumnCenterX;

  // Calculate end of two-column zone
  const leftColumnBottom = techBoardZ + dims.techBoard.height / 2;
  const rightColumnBottom = unitSupplyZ + dims.unitSupply.height / 2;
  const twoColumnZoneEnd = Math.max(leftColumnBottom, rightColumnBottom);

  // ========================================
  // CARDS ROW (below two-column zone)
  // [Action Cards] [Relics]
  // ========================================
  const cardsRowHeight = Math.max(
    dims.actionCards.height,
    dims.relics.height
  );
  const cardsRowZ = twoColumnZoneEnd + rowGap + cardsRowHeight / 2;

  // Calculate cards row total width
  const cardsRowWidth = dims.actionCards.width + dims.relics.width + horizontalGap;
  let cardsX = -cardsRowWidth / 2;

  const actionCardsX = cardsX + dims.actionCards.width / 2;
  cardsX += dims.actionCards.width + horizontalGap;

  const relicsX = cardsX + dims.relics.width / 2;

  // ========================================
  // Calculate bounds
  // ========================================
  // Include pass button in width calculation (it's in top right corner)
  const stationWidthWithPassButton = twoColumnWidth + horizontalGap + dims.passButton.width;
  const maxWidth = Math.max(stationWidthWithPassButton, cardsRowWidth);
  const totalHeight = cardsRowZ + cardsRowHeight / 2;
  const centerZ = totalHeight / 2;

  return {
    factionSheet: {
      position: [factionSheetX, yOffset, factionSheetZ],
      scale: dims.factionSheet.scale,
      visible: true,
    },
    commandSheet: {
      position: [commandSheetX, yOffset, controlsRowZ],
      scale: dims.commandSheet.scale,
      visible: true,
    },
    strategyCard: {
      position: [strategyCardX, yOffset, leadersFragmentsZ],
      scale: dims.strategyCard.scale,
      visible: true,
    },
    vpTrack: {
      position: [vpTrackX, yOffset, controlsRowZ],
      scale: dims.vpTrack.scale,
      visible: true,
    },
    passButton: {
      position: [passButtonX, yOffset, passButtonZ],
      scale: dims.passButton.scale,
      visible: true,
    },
    leaders: {
      position: [leadersX, yOffset, leadersFragmentsZ],
      scale: dims.leaderCards.scale,
      visible: true,
    },
    relicFragments: {
      position: [relicFragmentsX, yOffset, leadersFragmentsZ],
      scale: dims.relicFragments.scale,
      visible: true,
    },
    techBoard: {
      position: [techBoardX, yOffset, techBoardZ],
      scale: dims.techBoard.scale,
      visible: true,
    },
    actionCards: {
      position: [actionCardsX, yOffset, cardsRowZ],
      scale: dims.actionCards.scale,
      visible: true,
    },
    secretsMat: {
      position: [secretsMatX, yOffset, secretsPromissoryZ],
      scale: dims.secretsMat.scale,
      visible: true,
    },
    promissoryCards: {
      position: [promissoryCardsX, yOffset, secretsPromissoryZ],
      scale: dims.promissoryCards.scale,
      visible: true,
    },
    unitSupply: {
      position: [unitSupplyX, yOffset, unitSupplyZ],
      scale: dims.unitSupply.scale,
      visible: true,
    },
    relics: {
      position: [relicsX, yOffset, cardsRowZ],
      scale: dims.relics.scale,
      visible: true,
    },
    bounds: {
      width: maxWidth + 1.0, // Add padding
      height: totalHeight + 1.0,
      centerX: 0,
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
