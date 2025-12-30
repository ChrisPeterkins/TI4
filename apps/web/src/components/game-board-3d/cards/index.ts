/**
 * 3D Card Components
 *
 * Reusable card and deck components for the 3D game board.
 * These can be used for action cards, objective cards, agenda cards, etc.
 */

// Core card component
export { Card3D, FlipCard3D, CARD_DIMENSIONS } from './Card3D';
export type { Card3DProps, FlipCard3DProps } from './Card3D';

// Deck and discard pile
export { Deck3D, DiscardPile3D } from './Deck3D';
export type { Deck3DProps, DiscardPile3DProps } from './Deck3D';

// Card animations
export {
  DrawAnimation,
  PlayAnimation,
  DiscardAnimation,
  CardAnimationManager,
  useCardAnimations,
} from './CardAnimations';
export type {
  AnimatingCard,
  CardAnimationState,
  CardAnimationManagerProps,
} from './CardAnimations';

// Player hand display
export { PlayerHand3D, OpponentHand3D } from './PlayerHand3D';
export type {
  PlayerHand3DProps,
  OpponentHand3DProps,
  HandCard,
} from './PlayerHand3D';

// Objective display
export { ObjectiveDisplay3D } from './ObjectiveDisplay3D';
export type { ObjectiveDisplay3DProps } from './ObjectiveDisplay3D';
