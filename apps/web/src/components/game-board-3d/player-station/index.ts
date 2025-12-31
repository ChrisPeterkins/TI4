// Player Station 3D Components
export { FactionSheet3D, FACTION_SHEET_DIMENSIONS } from './FactionSheet3D';
export type { FactionSheet3DProps } from './FactionSheet3D';

export { TokenStack3D, TOKEN_DIMENSIONS } from './TokenStack3D';
export type { TokenStack3DProps, TokenType } from './TokenStack3D';

export { StrategyCardHolder3D, STRATEGY_CARD_DIMENSIONS } from './StrategyCardHolder3D';
export type { StrategyCardHolder3DProps } from './StrategyCardHolder3D';

export { CommandSheet3D, COMMAND_SHEET_DIMENSIONS } from './CommandSheet3D';
export type { CommandSheet3DProps } from './CommandSheet3D';

export { VPTrack3D, VP_TRACK_DIMENSIONS } from './VPTrack3D';
export type { VPTrack3DProps } from './VPTrack3D';

export { CardHand3D, CARD_HAND_DIMENSIONS } from './CardHand3D';
export type { CardHand3DProps, CardHandType, CardHandCard } from './CardHand3D';

export { TechnologyDisplay3D, TECHNOLOGY_DISPLAY_DIMENSIONS } from './TechnologyDisplay3D';
export type { TechnologyDisplay3DProps, TechnologyCard } from './TechnologyDisplay3D';

export { UnitSupplyArea3D, UNIT_SUPPLY_DIMENSIONS } from './UnitSupplyArea3D';
export type { UnitSupplyArea3DProps } from './UnitSupplyArea3D';

export { PassButton3D } from './PassButton3D';
export type { PassButton3DProps } from './PassButton3D';

export { ActionConfirmPopup3D } from './ActionConfirmPopup3D';
export type { ActionConfirmPopup3DProps } from './ActionConfirmPopup3D';

// Performance optimized components
export { InstancedTokens3D, InstancedCommandPool, INSTANCED_TOKEN_DIMENSIONS } from './InstancedTokens3D';

export { PlayerStationLOD, useLODLevel, LOD_THRESHOLDS } from './PlayerStationLOD';

// Playmat components (textured mats with card slots)
export { PlaymatTexture3D, getMatSlotPosition, getMatSlotDimensions, PLAYMAT_DIMENSIONS } from './PlaymatTexture3D';
export type { PlaymatTexture3DProps } from './PlaymatTexture3D';

export { TechBoardMat3D, TECH_BOARD_MAT_DIMENSIONS } from './TechBoardMat3D';
export type { TechBoardMat3DProps, TechBoardTechnology } from './TechBoardMat3D';

export { PlanetBoardMat3D, PLANET_BOARD_MAT_DIMENSIONS } from './PlanetBoardMat3D';
export type { PlanetBoardMat3DProps, PlanetCardData } from './PlanetBoardMat3D';

export { SecretsMat3D, SECRETS_MAT_DIMENSIONS } from './SecretsMat3D';
export type { SecretsMat3DProps, SecretObjectiveData } from './SecretsMat3D';

export { ExplorationMat3D, EXPLORATION_MAT_DIMENSIONS } from './ExplorationMat3D';
export type { ExplorationMat3DProps, ExplorationCardData, ExplorationType } from './ExplorationMat3D';

export { LeaderCardsDisplay3D, LEADER_CARDS_DIMENSIONS } from './LeaderCardsDisplay3D';
export type { LeaderCardsDisplay3DProps, LeaderCardData, LeaderCardState, LeaderType } from './LeaderCardsDisplay3D';

export { RelicFragmentDisplay3D, RELIC_FRAGMENT_DIMENSIONS } from './RelicFragmentDisplay3D';
export type { RelicFragmentDisplay3DProps, RelicFragments, FragmentType } from './RelicFragmentDisplay3D';

export { RelicCardsDisplay3D, RELIC_CARDS_DIMENSIONS } from './RelicCardsDisplay3D';
export type { RelicCardsDisplay3DProps, RelicCardData, RelicCardState, RelicUsage } from './RelicCardsDisplay3D';

// Layout system
export {
  calculateStationLayout,
  getScaledDimensions,
  DEFAULT_SCALES,
  DEFAULT_LAYOUT_CONFIG,
  RAW_DIMENSIONS,
  debugLayout,
} from './StationLayout';
export type {
  StationLayoutPositions,
  LayoutPosition,
  LayoutConfig,
  ScaledDimensions,
} from './StationLayout';
