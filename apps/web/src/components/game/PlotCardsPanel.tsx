'use client';

import { useState } from 'react';

// Plot card definitions (matching server-side)
type PlotCardId =
  | 'shadow_strike'
  | 'puppet_strings'
  | 'false_flag'
  | 'dark_bargain'
  | 'hidden_agenda'
  | 'blade_in_the_dark';

interface PlotCard {
  id: PlotCardId;
  name: string;
  description: string;
  timing: 'action' | 'combat' | 'agenda' | 'reaction';
}

const PLOT_CARDS: Record<PlotCardId, PlotCard> = {
  shadow_strike: {
    id: 'shadow_strike',
    name: 'Shadow Strike',
    description: 'Destroy 1 ship in a system containing your units.',
    timing: 'action',
  },
  puppet_strings: {
    id: 'puppet_strings',
    name: 'Puppet Strings',
    description: "Control another player's vote on the current agenda.",
    timing: 'agenda',
  },
  false_flag: {
    id: 'false_flag',
    name: 'False Flag',
    description: 'After combat, the winner does not take control of planets.',
    timing: 'combat',
  },
  dark_bargain: {
    id: 'dark_bargain',
    name: 'Dark Bargain',
    description: 'Gain 3 trade goods and 2 command tokens.',
    timing: 'action',
  },
  hidden_agenda: {
    id: 'hidden_agenda',
    name: 'Hidden Agenda',
    description: "Look at another player's secret objectives.",
    timing: 'action',
  },
  blade_in_the_dark: {
    id: 'blade_in_the_dark',
    name: 'Blade in the Dark',
    description: 'Cancel 1 action card just played.',
    timing: 'reaction',
  },
};

const TIMING_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  action: { bg: 'bg-purple-900/40', text: 'text-purple-400', label: 'Action' },
  combat: { bg: 'bg-red-900/40', text: 'text-red-400', label: 'Combat' },
  agenda: { bg: 'bg-blue-900/40', text: 'text-blue-400', label: 'Agenda' },
  reaction: { bg: 'bg-yellow-900/40', text: 'text-yellow-400', label: 'Reaction' },
};

interface PlotCardsPanelProps {
  plotCards: PlotCardId[];
  facedownCards?: number; // Number of facedown plot cards on the table
  isCurrentPlayer: boolean;
  onPlayCard?: (cardId: PlotCardId) => void;
}

export default function PlotCardsPanel({
  plotCards,
  facedownCards = 0,
  isCurrentPlayer,
  onPlayCard,
}: PlotCardsPanelProps) {
  const [selectedCard, setSelectedCard] = useState<PlotCard | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (plotCards.length === 0 && facedownCards === 0) {
    return null;
  }

  return (
    <>
      {/* Compact View */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🗡️</span>
            <span className="font-medium text-white">Plot Cards</span>
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
              {plotCards.length + facedownCards}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-3 border-t border-gray-700">
            {/* Hand Cards */}
            {plotCards.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">In Hand</div>
                <div className="flex flex-wrap gap-2">
                  {plotCards.map((cardId) => {
                    const card = PLOT_CARDS[cardId];
                    if (!card) return null;
                    const timing = TIMING_STYLES[card.timing];

                    return (
                      <button
                        key={cardId}
                        onClick={() => setSelectedCard(card)}
                        className={`relative p-2 rounded-lg border transition-all hover:scale-105 ${
                          isCurrentPlayer
                            ? 'border-purple-500 bg-purple-900/30 hover:border-purple-400'
                            : 'border-gray-600 bg-gray-800'
                        }`}
                      >
                        <div className="w-20">
                          <div className="text-xs font-medium text-white mb-1">{card.name}</div>
                          <span
                            className={`inline-block px-1.5 py-0.5 text-[10px] rounded ${timing.bg} ${timing.text}`}
                          >
                            {timing.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Facedown Cards (in play) */}
            {facedownCards > 0 && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">In Play (Facedown)</div>
                <div className="flex gap-2">
                  {Array.from({ length: facedownCards }).map((_, i) => (
                    <div
                      key={i}
                      className="w-12 h-16 bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 rounded-lg flex items-center justify-center"
                    >
                      <span className="text-gray-500">🗡️</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These plots are set and will trigger when their conditions are met.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="max-w-sm w-full mx-4 bg-gray-900 border-2 border-purple-500 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-900/60 to-gray-900 border-b border-purple-500/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🗡️</span>
                  <div>
                    <div className="text-xs text-purple-400 uppercase tracking-wide">Plot Card</div>
                    <h2 className="text-xl font-bold text-white">{selectedCard.name}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="p-1 text-gray-400 hover:text-white rounded"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Timing Badge */}
              <div className="mb-4">
                <span
                  className={`inline-block px-2 py-1 rounded ${
                    TIMING_STYLES[selectedCard.timing].bg
                  } ${TIMING_STYLES[selectedCard.timing].text}`}
                >
                  {TIMING_STYLES[selectedCard.timing].label} Window
                </span>
              </div>

              {/* Description */}
              <p className="text-gray-200 leading-relaxed">{selectedCard.description}</p>

              {/* Timing Explanation */}
              <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">When to play:</div>
                <p className="text-sm text-gray-300">
                  {selectedCard.timing === 'action' && 'During the action phase, as an action.'}
                  {selectedCard.timing === 'combat' && 'During or immediately after combat.'}
                  {selectedCard.timing === 'agenda' && 'During the agenda phase voting.'}
                  {selectedCard.timing === 'reaction' && 'In response to another action or ability.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700 flex gap-2">
              {isCurrentPlayer && onPlayCard && (
                <button
                  onClick={() => {
                    onPlayCard(selectedCard.id);
                    setSelectedCard(null);
                  }}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Play Card
                </button>
              )}
              <button
                onClick={() => setSelectedCard(null)}
                className={`${isCurrentPlayer && onPlayCard ? 'flex-1' : 'w-full'} py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
