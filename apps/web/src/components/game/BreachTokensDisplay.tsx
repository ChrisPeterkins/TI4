'use client';

import { useState } from 'react';

interface BreachToken {
  id: string;
  systemId: string;
  isFlipped: boolean; // Flipped = connected to Ahk Creuxx
  connectedTo?: string; // Other breach token it connects to
}

interface BreachTokensDisplayProps {
  breachTokens: BreachToken[];
  maxBreachTokens: number;
  isSundered: boolean;
  isCurrentPlayer: boolean;
  onPlaceBreach?: () => void;
  onFlipBreach?: (tokenId: string) => void;
  onViewSystem?: (systemId: string) => void;
}

export default function BreachTokensDisplay({
  breachTokens,
  maxBreachTokens,
  isSundered,
  isCurrentPlayer,
  onPlaceBreach,
  onFlipBreach,
  onViewSystem,
}: BreachTokensDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedToken, setSelectedToken] = useState<BreachToken | null>(null);

  const availableTokens = maxBreachTokens - breachTokens.length;
  const flippedTokens = breachTokens.filter((t) => t.isFlipped);
  const unflippedTokens = breachTokens.filter((t) => !t.isFlipped);

  return (
    <>
      <div className="bg-gray-900 border border-red-500/50 rounded-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-red-900/30 to-gray-900 hover:from-red-900/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative">
              <div className="absolute inset-0 bg-red-600 rounded-full animate-pulse opacity-50" />
              <div className="relative w-full h-full bg-red-700 rounded-full flex items-center justify-center border border-red-500">
                <span className="text-white text-xs">⌾</span>
              </div>
            </div>
            <span className="font-medium text-white">Breach Tokens</span>
            <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
              {breachTokens.length}/{maxBreachTokens}
            </span>
            {isSundered && (
              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                Sundered
              </span>
            )}
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
          <div className="p-3 border-t border-red-500/30">
            {/* Sundered Status */}
            {isSundered && (
              <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💔</span>
                  <div>
                    <div className="text-sm font-medium text-purple-400">Sundered</div>
                    <p className="text-xs text-gray-300">
                      Other players cannot use wormholes to move into or out of systems you control.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Token Pool */}
            <div className="mb-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Token Pool</div>
              <div className="flex items-center gap-1">
                {/* Placed tokens */}
                {breachTokens.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => setSelectedToken(token)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 ${
                      token.isFlipped
                        ? 'bg-red-600 border-red-400 shadow-lg shadow-red-500/30'
                        : 'bg-gray-600 border-gray-400'
                    }`}
                  >
                    <span className="text-white text-xs">⌾</span>
                  </button>
                ))}
                {/* Available tokens */}
                {Array.from({ length: availableTokens }).map((_, i) => (
                  <div
                    key={`available-${i}`}
                    className="w-8 h-8 bg-gray-800 border-2 border-gray-600 rounded-full flex items-center justify-center opacity-40"
                  >
                    <span className="text-gray-500 text-xs">⌾</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Breach Token List */}
            {breachTokens.length > 0 ? (
              <div className="space-y-3">
                {/* Active Breaches */}
                {flippedTokens.length > 0 && (
                  <div>
                    <div className="text-xs text-red-400 uppercase tracking-wide mb-2">
                      Active Breaches
                    </div>
                    <div className="space-y-2">
                      {flippedTokens.map((token) => (
                        <button
                          key={token.id}
                          onClick={() => onViewSystem?.(token.systemId)}
                          className="w-full flex items-center gap-3 p-2 bg-red-900/30 border border-red-500/30 rounded-lg hover:bg-red-900/40 transition-colors text-left"
                        >
                          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center animate-pulse">
                            <span className="text-white text-lg">⌾</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">
                              System {token.systemId}
                            </div>
                            <div className="text-xs text-red-400">
                              Connected to Ahk Creuxx (Epsilon wormhole)
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unflipped Breaches */}
                {unflippedTokens.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                      Placed (Not Active)
                    </div>
                    <div className="space-y-2">
                      {unflippedTokens.map((token) => (
                        <div
                          key={token.id}
                          className="flex items-center gap-3 p-2 bg-gray-800 border border-gray-600 rounded-lg"
                        >
                          <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-lg">⌾</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">
                              System {token.systemId}
                            </div>
                            <div className="text-xs text-gray-400">Ready to activate</div>
                          </div>
                          {isCurrentPlayer && onFlipBreach && (
                            <button
                              onClick={() => onFlipBreach(token.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">No breach tokens placed</p>
                {isCurrentPlayer && availableTokens > 0 && onPlaceBreach && (
                  <button
                    onClick={onPlaceBreach}
                    className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Place Breach Token
                  </button>
                )}
              </div>
            )}

            {/* Ability Description */}
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="text-xs text-red-400 font-medium mb-1">Breach Mechanics</div>
              <p className="text-xs text-gray-300">
                Place breach tokens in systems during tactical actions. Flip tokens to connect them
                to Ahk Creuxx as an epsilon wormhole. Your ships can move through breaches as if
                they were adjacent systems.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Token Detail Modal */}
      {selectedToken && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedToken(null)}
        >
          <div
            className="max-w-sm w-full mx-4 bg-gray-900 border-2 border-red-500 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-red-900/60 to-gray-900 border-b border-red-500/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedToken.isFlipped ? 'bg-red-600 animate-pulse' : 'bg-gray-600'
                    }`}
                  >
                    <span className="text-white text-xl">⌾</span>
                  </div>
                  <div>
                    <div className="text-xs text-red-400 uppercase tracking-wide">Breach Token</div>
                    <h2 className="text-xl font-bold text-white">System {selectedToken.systemId}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedToken(null)}
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
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    selectedToken.isFlipped
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {selectedToken.isFlipped ? 'Active - Epsilon Wormhole' : 'Inactive'}
                </span>
              </div>

              <p className="text-gray-200 leading-relaxed">
                {selectedToken.isFlipped
                  ? 'This breach is active and functions as an epsilon wormhole, connecting this system to Ahk Creuxx. Ships can move through as if adjacent.'
                  : 'This breach token is placed but not yet activated. Flip it to create an epsilon wormhole connection to your home system.'}
              </p>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700 flex gap-2">
              {!selectedToken.isFlipped && isCurrentPlayer && onFlipBreach && (
                <button
                  onClick={() => {
                    onFlipBreach(selectedToken.id);
                    setSelectedToken(null);
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Activate Breach
                </button>
              )}
              <button
                onClick={() => {
                  onViewSystem?.(selectedToken.systemId);
                  setSelectedToken(null);
                }}
                className={`${
                  !selectedToken.isFlipped && isCurrentPlayer && onFlipBreach ? 'flex-1' : 'w-full'
                } py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors`}
              >
                View System
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
