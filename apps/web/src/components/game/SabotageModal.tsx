'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ActionCardData } from '@ti4/shared';
import { ACTION_CARDS_BY_ID, isSabotageCard } from '@ti4/shared';
import { getCardUrl } from '@/lib/assets';

interface SabotageModalProps {
  isOpen: boolean;
  targetCardId: string;
  targetCardName: string;
  sourcePlayerId: string;
  sourcePlayerName: string;
  availableSabotageIds: string[];
  timeoutSeconds?: number;
  onUseSabotage: (sabotageCardId: string) => void;
  onDecline: () => void;
}

export function SabotageModal({
  isOpen,
  targetCardId,
  targetCardName,
  sourcePlayerId,
  sourcePlayerName,
  availableSabotageIds,
  timeoutSeconds = 15,
  onUseSabotage,
  onDecline,
}: SabotageModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeoutSeconds);
  const [isProcessing, setIsProcessing] = useState(false);

  const targetCard = ACTION_CARDS_BY_ID[targetCardId];
  const sabotageCards = availableSabotageIds
    .map(id => ({ id, data: ACTION_CARDS_BY_ID[id] }))
    .filter((card): card is { id: string; data: ActionCardData } => !!card.data && isSabotageCard(card.id));

  // Countdown timer
  useEffect(() => {
    if (!isOpen) {
      setTimeRemaining(timeoutSeconds);
      setIsProcessing(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-decline when time runs out
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeoutSeconds, onDecline]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeRemaining(timeoutSeconds);
      setIsProcessing(false);
    }
  }, [isOpen, timeoutSeconds]);

  const handleUseSabotage = useCallback((sabotageId: string) => {
    setIsProcessing(true);
    onUseSabotage(sabotageId);
  }, [onUseSabotage]);

  const handleDecline = useCallback(() => {
    setIsProcessing(true);
    onDecline();
  }, [onDecline]);

  if (!isOpen || sabotageCards.length === 0) return null;

  // Calculate urgency color based on time
  const urgencyColor = timeRemaining <= 5
    ? 'border-red-500 bg-red-900/20'
    : timeRemaining <= 10
      ? 'border-yellow-500 bg-yellow-900/20'
      : 'border-purple-500 bg-purple-900/20';

  const timerColor = timeRemaining <= 5
    ? 'text-red-400 animate-pulse'
    : timeRemaining <= 10
      ? 'text-yellow-400'
      : 'text-purple-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className={`rounded-xl border-2 w-full max-w-lg mx-4 shadow-2xl overflow-hidden ${urgencyColor}`}>
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-purple-900 to-red-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">⚡</div>
              <div>
                <h2 className="text-xl font-bold text-white">SABOTAGE?</h2>
                <p className="text-purple-200 text-sm">Quick response required!</p>
              </div>
            </div>
            <div className={`text-4xl font-bold ${timerColor}`}>
              {timeRemaining}
            </div>
          </div>
        </div>

        {/* Target Card Info */}
        <div className="p-6 bg-gray-900">
          <div className="flex items-center gap-4 mb-6">
            {/* Card Image */}
            <div className="w-20 h-28 bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden border border-gray-600">
              {targetCard && (
                <img
                  src={getCardUrl('action', targetCardId)}
                  alt={targetCardName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
            </div>

            <div className="flex-1">
              <p className="text-gray-400 text-sm">
                <span className="text-yellow-400 font-medium">{sourcePlayerName}</span> played:
              </p>
              <h3 className="text-xl font-bold text-white mt-1">{targetCardName}</h3>
              {targetCard && (
                <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                  {targetCard.description}
                </p>
              )}
            </div>
          </div>

          {/* Sabotage Options */}
          <div className="space-y-2 mb-6">
            <p className="text-sm text-gray-400">
              You have {sabotageCards.length} Sabotage card{sabotageCards.length !== 1 ? 's' : ''}:
            </p>
            {sabotageCards.map(card => (
              <button
                key={card.id}
                onClick={() => handleUseSabotage(card.id)}
                disabled={isProcessing}
                className={`
                  w-full p-4 rounded-lg border text-left transition-all
                  ${isProcessing
                    ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed'
                    : 'bg-purple-900/30 border-purple-600 hover:bg-purple-900/50 hover:border-purple-400'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-purple-300">🛡️ Use Sabotage</span>
                    <p className="text-xs text-gray-400 mt-1">Cancel {targetCardName}</p>
                  </div>
                  <div className="text-purple-400 text-2xl">→</div>
                </div>
              </button>
            ))}
          </div>

          {/* Decline Button */}
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className={`
              w-full px-6 py-3 rounded-lg font-medium transition-colors
              ${isProcessing
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
              }
            `}
          >
            {isProcessing ? 'Processing...' : 'Let it Resolve'}
          </button>
        </div>
      </div>
    </div>
  );
}
