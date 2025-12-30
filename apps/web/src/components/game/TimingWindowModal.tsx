'use client';

import { useState, useEffect } from 'react';
import type { ActionCardData, ActionCardTargets, TimingTrigger } from '@ti4/shared';
import { ACTION_CARDS_BY_ID } from '@ti4/shared';
import { getCardUrl } from '@/lib/assets';

interface TimingWindowModalProps {
  isOpen: boolean;
  trigger: TimingTrigger;
  description: string;
  eligibleCardIds: string[];
  timeoutSeconds?: number;
  onPlayCard: (cardId: string, targets?: ActionCardTargets) => void;
  onPass: () => void;
  sourcePlayerId?: string;
  sourcePlayerName?: string;
  sourceCardName?: string;
}

// Human-readable trigger descriptions
const TRIGGER_DESCRIPTIONS: Partial<Record<TimingTrigger, string>> = {
  action_card_played: 'An action card was played',
  sabotage_played: 'Sabotage was played',
  space_combat_start: 'Space combat has started',
  ground_combat_start: 'Ground combat has started',
  combat_round_start: 'A combat round is starting',
  combat_round_end: 'A combat round has ended',
  before_combat_rolls: 'Before dice are rolled',
  after_combat_rolls: 'Dice have been rolled',
  hits_assigned: 'Hits have been assigned',
  unit_destroyed: 'A unit was destroyed',
  ship_sustains_damage: 'A ship used SUSTAIN DAMAGE',
  before_afb: 'Before Anti-Fighter Barrage',
  after_afb: 'After Anti-Fighter Barrage',
  before_bombardment: 'Before bombardment',
  after_bombardment: 'After bombardment',
  before_space_cannon: 'Before space cannon fire',
  after_space_cannon: 'After space cannon fire',
  agenda_revealed: 'An agenda has been revealed',
  after_agenda_revealed: 'After agenda revealed (riders)',
  before_voting: 'Before voting begins',
  after_voting: 'Voting is complete',
  system_activated: 'A system was activated',
  movement_start: 'Movement is starting',
  movement_end: 'Movement is complete',
  production_start: 'Production is starting',
  production_end: 'Production is complete',
  invasion_start: 'Invasion is starting',
  start_of_turn: 'Start of turn',
  end_of_turn: 'End of turn',
  strategy_card_played: 'A strategy card was played',
};

export function TimingWindowModal({
  isOpen,
  trigger,
  description,
  eligibleCardIds,
  timeoutSeconds = 30,
  onPlayCard,
  onPass,
  sourcePlayerId,
  sourcePlayerName,
  sourceCardName,
}: TimingWindowModalProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeoutSeconds);

  // Get card data for eligible cards
  const eligibleCards = eligibleCardIds
    .map(id => ({ id, data: ACTION_CARDS_BY_ID[id] }))
    .filter((card): card is { id: string; data: ActionCardData } => !!card.data);

  const selectedCard = selectedCardId ? ACTION_CARDS_BY_ID[selectedCardId] : null;

  // Countdown timer
  useEffect(() => {
    if (!isOpen) {
      setTimeRemaining(timeoutSeconds);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-pass when time runs out
          onPass();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeoutSeconds, onPass]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCardId(null);
      setTimeRemaining(timeoutSeconds);
    }
  }, [isOpen, timeoutSeconds]);

  if (!isOpen) return null;

  const handlePlayCard = () => {
    if (selectedCardId) {
      onPlayCard(selectedCardId);
      setSelectedCardId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-yellow-600 w-full max-w-2xl mx-4 shadow-2xl overflow-hidden">
        {/* Header with Timer */}
        <div className="bg-yellow-900/30 border-b border-yellow-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-yellow-400">Timing Window</h2>
              <p className="text-yellow-200/80 text-sm mt-1">
                {TRIGGER_DESCRIPTIONS[trigger] || trigger}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-400'
              }`}>
                {timeRemaining}s
              </div>
              <div className="text-xs text-gray-400">Time remaining</div>
            </div>
          </div>
        </div>

        {/* Context Description */}
        <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/50">
          <p className="text-gray-300">{description}</p>
          {sourceCardName && sourcePlayerName && (
            <p className="text-sm text-gray-400 mt-2">
              <span className="text-yellow-400">{sourcePlayerName}</span> played{' '}
              <span className="text-blue-400 font-medium">{sourceCardName}</span>
            </p>
          )}
        </div>

        {/* Card Selection */}
        <div className="p-6">
          {eligibleCards.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                You have no cards that can respond to this timing window.
              </div>
              <button
                onClick={onPass}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Select a card to play, or pass to let the action resolve:
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {eligibleCards.map(card => (
                  <TimingWindowCard
                    key={card.id}
                    cardId={card.id}
                    cardData={card.data}
                    isSelected={selectedCardId === card.id}
                    onClick={() => setSelectedCardId(card.id === selectedCardId ? null : card.id)}
                  />
                ))}
              </div>

              {/* Selected Card Preview */}
              {selectedCard && (
                <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-blue-600">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-32 bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                      <img
                        src={getCardUrl('action', selectedCardId!)}
                        alt={selectedCard.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-white">{selectedCard.name}</h4>
                      <p className="text-sm text-gray-300 mt-2">{selectedCard.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onPass}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Pass
                </button>
                <button
                  onClick={handlePlayCard}
                  disabled={!selectedCardId}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    selectedCardId
                      ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Play Card
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface TimingWindowCardProps {
  cardId: string;
  cardData: ActionCardData;
  isSelected: boolean;
  onClick: () => void;
}

function TimingWindowCard({ cardId, cardData, isSelected, onClick }: TimingWindowCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        text-left p-3 rounded-lg border transition-all
        ${isSelected
          ? 'bg-yellow-600/20 border-yellow-500 ring-2 ring-yellow-500'
          : 'bg-gray-800 border-gray-700 hover:border-gray-500'
        }
      `}
    >
      <div className="font-medium text-white text-sm">{cardData.name}</div>
      <div className="text-xs text-gray-400 mt-1 line-clamp-2">
        {cardData.description.length > 50
          ? cardData.description.substring(0, 50) + '...'
          : cardData.description}
      </div>
    </button>
  );
}
