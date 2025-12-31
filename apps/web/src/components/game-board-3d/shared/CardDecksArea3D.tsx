'use client';

import { useMemo, Suspense } from 'react';
import { Text } from '@react-three/drei';
import { Deck3D, DiscardPile3D } from '../cards/Deck3D';
import {
  getActionCardBackUrl,
  getAgendaCardBackUrl,
  getRelicCardBackUrl,
  getCardUrl,
} from '@/lib/assets';
import type { GamePhase } from '@ti4/shared';

// Spacing between deck rows
const DECK_SPACING = 2.0;
// Horizontal offset between deck and discard pile
const DISCARD_OFFSET = 1.2;

export interface CardDecksArea3DProps {
  // Action cards
  actionCardDeck: string[];
  actionCardDiscard: string[];
  // Agenda cards
  agendaDeck: string[];
  agendaDiscard: string[];
  // Relic cards
  relicDeck: string[];
  relicDiscard: string[];
  // Callbacks
  onActionCardDraw?: () => void;
  onAgendaReveal?: () => void;
  onRelicDraw?: () => void;
  // Game state for highlighting
  gamePhase?: GamePhase;
  subPhase?: string;
}

/**
 * CardDecksArea3D - West side area containing Action, Agenda, and Relic decks
 *
 * Layout (vertical stack, facing east toward center):
 *
 *   [Action Deck]    [Action Discard]
 *   [Agenda Deck]    [Agenda Discard]
 *   [Relic Deck]     [Relic Discard]
 */
export function CardDecksArea3D({
  actionCardDeck,
  actionCardDiscard,
  agendaDeck,
  agendaDiscard,
  relicDeck,
  relicDiscard,
  onActionCardDraw,
  onAgendaReveal,
  onRelicDraw,
  gamePhase,
  subPhase,
}: CardDecksArea3DProps) {
  // Prepare discard pile cards with textures
  const actionDiscardCards = useMemo(
    () =>
      actionCardDiscard.map((id) => ({
        id,
        frontTexture: getCardUrl('action', id),
      })),
    [actionCardDiscard]
  );

  const agendaDiscardCards = useMemo(
    () =>
      agendaDiscard.map((id) => ({
        id,
        frontTexture: getCardUrl('agenda', id),
      })),
    [agendaDiscard]
  );

  const relicDiscardCards = useMemo(
    () =>
      relicDiscard.map((id) => ({
        id,
        frontTexture: getCardUrl('relic', id),
      })),
    [relicDiscard]
  );

  // Determine which deck should be highlighted based on game phase
  const highlightAction = gamePhase === 'status' && subPhase === 'draw_action_cards';
  const highlightAgenda = gamePhase === 'agenda';
  const highlightRelic = false; // Relics are drawn from exploration, not directly

  return (
    <group name="card-decks-area">
      {/* Area title */}
      <Text
        position={[0, 0.5, -DECK_SPACING * 1.5]}
        fontSize={0.2}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        CARD DECKS
      </Text>

      {/* Action Cards Row (Top) */}
      <group position={[0, 0, -DECK_SPACING]}>
        <Suspense fallback={null}>
          <Deck3D
            cardCount={actionCardDeck?.length ?? 0}
            backTexture={getActionCardBackUrl()}
            position={[-DISCARD_OFFSET / 2, 0, 0]}
            label="Action"
            onDraw={onActionCardDraw}
            highlightTop={highlightAction}
          />
          <DiscardPile3D
            cards={actionDiscardCards}
            backTexture={getActionCardBackUrl()}
            position={[DISCARD_OFFSET / 2, 0, 0]}
            label="Discard"
          />
        </Suspense>
      </group>

      {/* Agenda Cards Row (Middle) */}
      <group position={[0, 0, 0]}>
        <Suspense fallback={null}>
          <Deck3D
            cardCount={agendaDeck?.length ?? 0}
            backTexture={getAgendaCardBackUrl()}
            position={[-DISCARD_OFFSET / 2, 0, 0]}
            label="Agenda"
            onDraw={onAgendaReveal}
            highlightTop={highlightAgenda}
          />
          <DiscardPile3D
            cards={agendaDiscardCards}
            backTexture={getAgendaCardBackUrl()}
            position={[DISCARD_OFFSET / 2, 0, 0]}
            label="Discard"
          />
        </Suspense>
      </group>

      {/* Relic Cards Row (Bottom) */}
      <group position={[0, 0, DECK_SPACING]}>
        <Suspense fallback={null}>
          <Deck3D
            cardCount={relicDeck?.length ?? 0}
            backTexture={getRelicCardBackUrl()}
            position={[-DISCARD_OFFSET / 2, 0, 0]}
            label="Relic"
            onDraw={onRelicDraw}
            highlightTop={highlightRelic}
          />
          <DiscardPile3D
            cards={relicDiscardCards}
            backTexture={getRelicCardBackUrl()}
            position={[DISCARD_OFFSET / 2, 0, 0]}
            label="Discard"
          />
        </Suspense>
      </group>
    </group>
  );
}
