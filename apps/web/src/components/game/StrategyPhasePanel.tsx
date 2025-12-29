'use client';

import { useState } from 'react';
import Image from 'next/image';
import { strategyCards } from '@ti4/game-data';
import type { GameState, StrategyCardState } from '@ti4/shared';

interface StrategyPhasePanelProps {
  gameState: GameState;
  currentPlayerId: string | null;
  onPickCard: (cardNumber: number) => void;
}

// Map card numbers to image filenames
const CARD_IMAGES: Record<number, string> = {
  1: '/images/strategy-cards/leadership.png',
  2: '/images/strategy-cards/diplomacy.png',
  3: '/images/strategy-cards/politics.png',
  4: '/images/strategy-cards/construction.png',
  5: '/images/strategy-cards/trade.png',
  6: '/images/strategy-cards/warfare.png',
  7: '/images/strategy-cards/technology.png',
  8: '/images/strategy-cards/imperial.png',
};

// Card colors for fallback styling
const CARD_COLORS: Record<number, { bg: string; border: string; glow: string }> = {
  1: { bg: 'from-red-700 via-red-600 to-red-800', border: 'border-red-400', glow: 'shadow-red-500/50' },
  2: { bg: 'from-orange-600 via-orange-500 to-orange-700', border: 'border-orange-300', glow: 'shadow-orange-500/50' },
  3: { bg: 'from-yellow-600 via-amber-500 to-yellow-700', border: 'border-yellow-300', glow: 'shadow-yellow-500/50' },
  4: { bg: 'from-emerald-700 via-green-600 to-emerald-800', border: 'border-green-400', glow: 'shadow-green-500/50' },
  5: { bg: 'from-teal-600 via-cyan-500 to-teal-700', border: 'border-cyan-300', glow: 'shadow-cyan-500/50' },
  6: { bg: 'from-blue-700 via-blue-600 to-blue-800', border: 'border-blue-400', glow: 'shadow-blue-500/50' },
  7: { bg: 'from-indigo-700 via-indigo-600 to-purple-800', border: 'border-indigo-400', glow: 'shadow-indigo-500/50' },
  8: { bg: 'from-purple-800 via-purple-700 to-fuchsia-900', border: 'border-purple-400', glow: 'shadow-purple-500/50' },
};

// Position cards in a ring (centered at 0,0)
function getCardPosition(index: number, total: number, radius: number) {
  // Start from top and go clockwise
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

export function StrategyPhasePanel({
  gameState,
  currentPlayerId,
  onPickCard,
}: StrategyPhasePanelProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const isMyTurn = gameState.activePlayerId === currentPlayerId;
  const activePlayer = gameState.players.find(p => p.id === gameState.activePlayerId);

  // Get player who picked each card
  const getCardOwner = (cardNumber: number): string | null => {
    const player = gameState.players.find(p => p.strategyCard === cardNumber);
    return player?.name || null;
  };

  // Check if card is available
  const isCardAvailable = (card: StrategyCardState): boolean => {
    return card.pickedBy === null;
  };

  const handleCardClick = (cardNumber: number, canPick: boolean) => {
    if (canPick) {
      setSelectedCard(cardNumber);
    }
  };

  const handleConfirmPick = () => {
    if (selectedCard && isMyTurn) {
      onPickCard(selectedCard);
      setSelectedCard(null);
    }
  };

  const cards = Object.values(strategyCards);
  const displayCard = hoveredCard !== null ? strategyCards[hoveredCard] :
                      selectedCard !== null ? strategyCards[selectedCard] : null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden">
      {/* Background stars effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.3 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-30">
        <h2 className="text-3xl font-bold text-white mb-2 tracking-wider">
          STRATEGY PHASE
        </h2>
        <p className="text-lg text-gray-300">
          {isMyTurn ? (
            <span className="text-yellow-400 font-semibold">Your turn to select a strategy card</span>
          ) : (
            <span>
              Waiting for <span className="text-yellow-400 font-semibold">{activePlayer?.name}</span> to select...
            </span>
          )}
        </p>
      </div>

      {/* Main content area */}
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Ring of Strategy Cards */}
        <div className="relative" style={{ width: '800px', height: '800px' }}>
          {/* Center display for selected/hovered card details */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 text-center z-20">
            {displayCard ? (
              <div className={`bg-gradient-to-br ${CARD_COLORS[displayCard.number].bg} rounded-xl p-5 border-2 ${CARD_COLORS[displayCard.number].border} shadow-2xl`}>
                <div className="text-sm text-white/70 mb-1">#{displayCard.number}</div>
                <h3 className="text-xl font-bold text-white mb-3">{displayCard.name}</h3>
                <div className="text-left space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Primary</div>
                    <p className="text-xs text-white/90 leading-relaxed">{displayCard.primaryAbility}</p>
                  </div>
                  <div className="border-t border-white/20 pt-2">
                    <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Secondary</div>
                    <p className="text-xs text-white/80 leading-relaxed">{displayCard.secondaryAbility}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600">
                <p className="text-gray-400 text-lg">Hover over a card to see details</p>
                <p className="text-gray-500 text-sm mt-2">Click to select</p>
              </div>
            )}
          </div>

          {/* Cards arranged in a ring */}
          {cards.map((cardData, index) => {
            const position = getCardPosition(index, cards.length, 320);
            const cardState = gameState.strategyCards.find(c => c.number === cardData.number);
            const isAvailable = cardState ? isCardAvailable(cardState) : true;
            const pickedBy = getCardOwner(cardData.number);
            const canPick = isMyTurn && isAvailable;
            const isSelected = selectedCard === cardData.number;
            const isHovered = hoveredCard === cardData.number;
            const style = CARD_COLORS[cardData.number];

            return (
              <button
                key={cardData.number}
                onClick={() => handleCardClick(cardData.number, canPick)}
                onDoubleClick={() => canPick && onPickCard(cardData.number)}
                onMouseEnter={() => setHoveredCard(cardData.number)}
                onMouseLeave={() => setHoveredCard(null)}
                disabled={!isAvailable}
                className={`
                  absolute transition-all duration-300 rounded-lg overflow-hidden
                  transform -translate-x-1/2 -translate-y-1/2
                  ${isAvailable
                    ? canPick
                      ? 'cursor-pointer hover:scale-110 hover:z-10'
                      : 'opacity-70'
                    : 'opacity-30 cursor-not-allowed grayscale'
                  }
                  ${isSelected ? `ring-4 ring-yellow-400 scale-110 z-20 shadow-xl ${style.glow}` : ''}
                  ${isHovered && !isSelected ? 'scale-105 z-10' : ''}
                `}
                style={{
                  left: `calc(50% + ${position.x}px)`,
                  top: `calc(50% + ${position.y}px)`,
                  width: '120px',
                  height: '180px',
                }}
              >
                {/* Card Image */}
                <div className="relative w-full h-full">
                  <Image
                    src={CARD_IMAGES[cardData.number]}
                    alt={cardData.name}
                    fill
                    className="object-cover"
                    sizes="120px"
                    priority
                  />

                  {/* Card Number Badge */}
                  <div className="absolute top-1 left-1 w-7 h-7 rounded-full bg-black/80 border border-white/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{cardData.number}</span>
                  </div>

                  {/* Picked Overlay */}
                  {pickedBy && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                      <div className="text-xs text-gray-400">Picked</div>
                      <div className="text-sm font-bold text-white">{pickedBy}</div>
                    </div>
                  )}

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-bounce" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selection Confirmation */}
      {selectedCard && isMyTurn && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
          <button
            onClick={() => setSelectedCard(null)}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmPick}
            className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-bold transition-colors shadow-lg shadow-yellow-500/30"
          >
            Confirm Pick: {strategyCards[selectedCard]?.name}
          </button>
        </div>
      )}

      {/* Pick Order */}
      <div className="absolute bottom-6 left-6 z-30 bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Pick Order</div>
        <div className="flex flex-col gap-1">
          {gameState.players
            .sort((a, b) => {
              // Speaker picks first, then clockwise
              if (a.id === gameState.speakerId) return -1;
              if (b.id === gameState.speakerId) return 1;
              return a.seatIndex - b.seatIndex;
            })
            .map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 text-sm ${
                  p.id === gameState.activePlayerId ? 'text-yellow-400 font-bold' : 'text-gray-400'
                }`}
              >
                {p.id === gameState.speakerId && <span className="text-xs">Speaker</span>}
                <span>{p.name}</span>
                {p.strategyCard && (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-700 rounded">
                    #{p.strategyCard}
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-6 right-6 z-30 bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Controls</div>
        <div className="text-sm text-gray-300 space-y-1">
          <div>Hover to preview</div>
          <div>Click to select</div>
          <div>Double-click to pick instantly</div>
        </div>
      </div>
    </div>
  );
}
