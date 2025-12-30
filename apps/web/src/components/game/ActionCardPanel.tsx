'use client';

import { useState, useMemo } from 'react';
import type { GameState, PlayerState, ActionCardData, ActionCardTargets } from '@ti4/shared';
import { ACTION_CARDS_BY_ID } from '@ti4/shared';
import { getCardUrl } from '@/lib/assets';

interface ActionCardPanelProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  isOpen: boolean;
  onClose: () => void;
  onPlayCard: (cardId: string, targets?: ActionCardTargets) => void;
  onDiscardCards: (cardIds: string[]) => void;
  discardRequired?: number;
}

const ACTION_CARD_HAND_LIMIT = 7;

// Timing display labels
const TIMING_LABELS: Record<string, { label: string; color: string }> = {
  action: { label: 'ACTION', color: 'bg-green-600' },
  tactical: { label: 'TACTICAL', color: 'bg-blue-600' },
  combat: { label: 'COMBAT', color: 'bg-red-600' },
  space_combat: { label: 'SPACE COMBAT', color: 'bg-red-500' },
  ground_combat: { label: 'GROUND COMBAT', color: 'bg-orange-600' },
  anti_fighter_barrage: { label: 'AFB', color: 'bg-red-400' },
  bombardment: { label: 'BOMBARDMENT', color: 'bg-orange-500' },
  invasion: { label: 'INVASION', color: 'bg-amber-600' },
  agenda: { label: 'AGENDA', color: 'bg-purple-600' },
  status: { label: 'STATUS', color: 'bg-yellow-600' },
  start_of_combat: { label: 'START OF COMBAT', color: 'bg-red-700' },
};

export function ActionCardPanel({
  gameState,
  currentPlayer,
  isOpen,
  onClose,
  onPlayCard,
  onDiscardCards,
  discardRequired = 0,
}: ActionCardPanelProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [discardMode, setDiscardMode] = useState(discardRequired > 0);
  const [selectedForDiscard, setSelectedForDiscard] = useState<Set<string>>(new Set());

  // Get the player's action cards with their data
  const playerCards = useMemo(() => {
    if (!currentPlayer) return [];
    return currentPlayer.actionCards
      .map(cardId => ({
        id: cardId,
        data: ACTION_CARDS_BY_ID[cardId],
      }))
      .filter((card): card is { id: string; data: ActionCardData } => !!card.data);
  }, [currentPlayer]);

  // Group cards by timing for better organization
  const cardsByTiming = useMemo(() => {
    const groups: Record<string, typeof playerCards> = {};
    for (const card of playerCards) {
      const timing = card.data.timing;
      if (!groups[timing]) {
        groups[timing] = [];
      }
      groups[timing].push(card);
    }
    return groups;
  }, [playerCards]);

  const selectedCard = selectedCardId ? ACTION_CARDS_BY_ID[selectedCardId] : null;
  const overHandLimit = playerCards.length > ACTION_CARD_HAND_LIMIT;
  const requiredDiscards = Math.max(0, playerCards.length - ACTION_CARD_HAND_LIMIT, discardRequired);

  // Check if a card can be played in the current game state
  const canPlayCard = (cardData: ActionCardData): boolean => {
    if (discardMode) return false;

    const { phase, activatedSystem, activeCombat, agendaPhase } = gameState;

    switch (cardData.timing) {
      case 'action':
        // ACTION cards can be played as component action or in response to events
        // Sabotage can be played anytime someone plays a card
        if (cardData.id.startsWith('sabotage_')) return true;
        return phase === 'action';

      case 'tactical':
        return phase === 'action' && !!activatedSystem;

      case 'combat':
      case 'space_combat':
      case 'ground_combat':
      case 'anti_fighter_barrage':
      case 'bombardment':
      case 'invasion':
      case 'start_of_combat':
        return !!activeCombat;

      case 'agenda':
        return phase === 'agenda';

      case 'status':
        return phase === 'status';

      default:
        return false;
    }
  };

  const handleCardClick = (cardId: string) => {
    if (discardMode) {
      setSelectedForDiscard(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cardId)) {
          newSet.delete(cardId);
        } else {
          newSet.add(cardId);
        }
        return newSet;
      });
    } else {
      setSelectedCardId(cardId === selectedCardId ? null : cardId);
    }
  };

  const handlePlayCard = () => {
    if (selectedCardId) {
      onPlayCard(selectedCardId);
      setSelectedCardId(null);
    }
  };

  const handleConfirmDiscard = () => {
    if (selectedForDiscard.size >= requiredDiscards) {
      onDiscardCards(Array.from(selectedForDiscard));
      setSelectedForDiscard(new Set());
      setDiscardMode(false);
    }
  };

  const handleCancelDiscard = () => {
    setSelectedForDiscard(new Set());
    setDiscardMode(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-5xl max-h-[90vh] mx-4 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">Action Cards</h2>
            <span className="text-sm text-gray-400">
              {playerCards.length} / {ACTION_CARD_HAND_LIMIT} cards
              {overHandLimit && (
                <span className="ml-2 text-red-400">
                  (must discard {playerCards.length - ACTION_CARD_HAND_LIMIT})
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!discardMode && overHandLimit && (
              <button
                onClick={() => setDiscardMode(true)}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg"
              >
                Discard Cards
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Discard Mode Banner */}
        {discardMode && (
          <div className="bg-red-900/30 border-b border-red-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-red-300 font-medium">Discard Mode</span>
                <span className="text-red-400 ml-2">
                  Select {requiredDiscards} card{requiredDiscards !== 1 ? 's' : ''} to discard
                  ({selectedForDiscard.size} selected)
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelDiscard}
                  className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDiscard}
                  disabled={selectedForDiscard.size < requiredDiscards}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    selectedForDiscard.size >= requiredDiscards
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm Discard
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Card List */}
          <div className="flex-1 overflow-y-auto p-4">
            {Object.keys(cardsByTiming).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No action cards in hand
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(cardsByTiming).map(([timing, cards]) => (
                  <div key={timing}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        TIMING_LABELS[timing]?.color || 'bg-gray-600'
                      } text-white`}>
                        {TIMING_LABELS[timing]?.label || timing.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {cards.length} card{cards.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {cards.map(card => (
                        <ActionCardItem
                          key={card.id}
                          cardId={card.id}
                          cardData={card.data}
                          isSelected={discardMode ? selectedForDiscard.has(card.id) : selectedCardId === card.id}
                          isPlayable={canPlayCard(card.data)}
                          isDiscardMode={discardMode}
                          onClick={() => handleCardClick(card.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card Detail Panel */}
          {selectedCard && !discardMode && (
            <div className="w-80 border-l border-gray-700 p-4 flex flex-col">
              <CardDetailView
                cardData={selectedCard}
                canPlay={canPlayCard(selectedCard)}
                onPlay={handlePlayCard}
                onClose={() => setSelectedCardId(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ActionCardItemProps {
  cardId: string;
  cardData: ActionCardData;
  isSelected: boolean;
  isPlayable: boolean;
  isDiscardMode: boolean;
  onClick: () => void;
}

function ActionCardItem({
  cardId,
  cardData,
  isSelected,
  isPlayable,
  isDiscardMode,
  onClick,
}: ActionCardItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative text-left p-3 rounded-lg border transition-all
        ${isSelected
          ? isDiscardMode
            ? 'bg-red-600/20 border-red-500 ring-2 ring-red-500'
            : 'bg-blue-600/20 border-blue-500 ring-2 ring-blue-500'
          : isPlayable && !isDiscardMode
            ? 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-750'
            : 'bg-gray-800/50 border-gray-700'
        }
      `}
    >
      {/* Playable indicator */}
      {isPlayable && !isDiscardMode && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      )}

      {/* Discard checkbox indicator */}
      {isDiscardMode && (
        <div className="absolute top-1 right-1">
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
            isSelected ? 'bg-red-500 border-red-500' : 'border-gray-500'
          }`}>
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      )}

      <div className="font-medium text-white text-sm truncate pr-6">
        {cardData.name}
      </div>
      <div className="text-xs text-gray-400 mt-1 line-clamp-2">
        {cardData.description.length > 60
          ? cardData.description.substring(0, 60) + '...'
          : cardData.description}
      </div>
    </button>
  );
}

interface CardDetailViewProps {
  cardData: ActionCardData;
  canPlay: boolean;
  onPlay: () => void;
  onClose: () => void;
}

function CardDetailView({ cardData, canPlay, onPlay, onClose }: CardDetailViewProps) {
  const timingInfo = TIMING_LABELS[cardData.timing] || {
    label: cardData.timing.toUpperCase(),
    color: 'bg-gray-600',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Card Image Placeholder */}
      <div className="aspect-[2.5/3.5] bg-gray-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
        <img
          src={getCardUrl('action', cardData.id)}
          alt={cardData.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide broken image and show placeholder
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.classList.add('flex', 'items-center', 'justify-center');
              const placeholder = document.createElement('div');
              placeholder.className = 'text-center p-4';
              placeholder.innerHTML = `
                <div class="text-4xl mb-2">🃏</div>
                <div class="text-gray-400 text-sm">${cardData.name}</div>
              `;
              parent.appendChild(placeholder);
            }
          }}
        />
      </div>

      {/* Card Info */}
      <div className="flex-1">
        <h3 className="text-lg font-bold text-white mb-2">{cardData.name}</h3>

        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${timingInfo.color} text-white mb-3`}>
          {timingInfo.label}
        </span>

        <p className="text-sm text-gray-300 mb-4">{cardData.description}</p>

        {cardData.flavor && (
          <p className="text-xs text-gray-500 italic border-t border-gray-700 pt-3">
            "{cardData.flavor}"
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
        >
          Cancel
        </button>
        <button
          onClick={onPlay}
          disabled={!canPlay}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
            canPlay
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canPlay ? 'Play Card' : 'Cannot Play'}
        </button>
      </div>
    </div>
  );
}
