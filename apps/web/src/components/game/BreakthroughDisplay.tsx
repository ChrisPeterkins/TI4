'use client';

import { useState } from 'react';
import { BREAKTHROUGHS_BY_FACTION, type BreakthroughDef } from '@ti4/shared';

interface BreakthroughDisplayProps {
  factionId: string;
  isUnlocked: boolean;
  isExhausted?: boolean;
  onUse?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const TECH_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-900/40', text: 'text-blue-400', border: 'border-blue-500' },
  red: { bg: 'bg-red-900/40', text: 'text-red-400', border: 'border-red-500' },
  yellow: { bg: 'bg-yellow-900/40', text: 'text-yellow-400', border: 'border-yellow-500' },
  green: { bg: 'bg-green-900/40', text: 'text-green-400', border: 'border-green-500' },
};

export default function BreakthroughDisplay({
  factionId,
  isUnlocked,
  isExhausted = false,
  onUse,
  size = 'medium',
}: BreakthroughDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  const breakthrough = BREAKTHROUGHS_BY_FACTION[factionId];

  if (!breakthrough) {
    return null;
  }

  const sizeClasses = {
    small: 'w-24 h-32',
    medium: 'w-32 h-44',
    large: 'w-48 h-64',
  };

  const textSizes = {
    small: { title: 'text-xs', body: 'text-[10px]' },
    medium: { title: 'text-sm', body: 'text-xs' },
    large: { title: 'text-base', body: 'text-sm' },
  };

  const synergy1 = breakthrough.synergy ? TECH_COLORS[breakthrough.synergy.color1] : null;
  const synergy2 = breakthrough.synergy ? TECH_COLORS[breakthrough.synergy.color2] : null;

  return (
    <>
      {/* Card Display */}
      <button
        onClick={() => setShowDetails(true)}
        disabled={!isUnlocked}
        className={`relative ${sizeClasses[size]} rounded-lg border-2 overflow-hidden transition-all ${
          isUnlocked
            ? isExhausted
              ? 'border-gray-600 opacity-60 grayscale'
              : 'border-amber-500 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20'
            : 'border-gray-700 opacity-40 grayscale cursor-not-allowed'
        }`}
      >
        {/* Background Gradient */}
        <div
          className={`absolute inset-0 ${
            isUnlocked ? 'bg-gradient-to-b from-amber-900/60 to-gray-900' : 'bg-gray-900'
          }`}
        />

        {/* Synergy Icons */}
        {breakthrough.synergy && (
          <div className="absolute top-1 left-1 flex gap-0.5">
            <div
              className={`w-4 h-4 rounded ${synergy1?.bg} ${synergy1?.border} border flex items-center justify-center`}
            >
              <span className={`${synergy1?.text} text-[10px] font-bold`}>
                {breakthrough.synergy.color1[0].toUpperCase()}
              </span>
            </div>
            <div
              className={`w-4 h-4 rounded ${synergy2?.bg} ${synergy2?.border} border flex items-center justify-center`}
            >
              <span className={`${synergy2?.text} text-[10px] font-bold`}>
                {breakthrough.synergy.color2[0].toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Exhaustable Indicator */}
        {breakthrough.isExhaustable && (
          <div className="absolute top-1 right-1">
            <span
              className={`text-xs ${
                isExhausted ? 'text-gray-500' : 'text-amber-400'
              }`}
              title={isExhausted ? 'Exhausted' : 'Ready'}
            >
              ↻
            </span>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col p-2">
          <div className="flex-1 flex flex-col justify-center">
            <div className={`font-bold text-amber-400 ${textSizes[size].title} text-center mb-1`}>
              {breakthrough.name}
            </div>
            <div
              className={`text-gray-300 ${textSizes[size].body} text-center line-clamp-4 leading-tight`}
            >
              {breakthrough.description}
            </div>
          </div>

          {/* Label */}
          <div className="mt-auto pt-1 border-t border-gray-700">
            <div className="text-[10px] text-gray-500 uppercase tracking-wide text-center">
              Breakthrough
            </div>
          </div>
        </div>

        {/* Locked Overlay */}
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="text-3xl">🔒</div>
          </div>
        )}

        {/* Exhausted Overlay */}
        {isUnlocked && isExhausted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="text-gray-400 text-sm font-medium -rotate-12">EXHAUSTED</div>
          </div>
        )}
      </button>

      {/* Detail Modal */}
      {showDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="max-w-md w-full mx-4 bg-gray-900 border-2 border-amber-500 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-amber-900/60 to-gray-900 border-b border-amber-500/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-amber-400 uppercase tracking-wide">Breakthrough</div>
                  <h2 className="text-xl font-bold text-white">{breakthrough.name}</h2>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
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
              {/* Synergy Requirement */}
              {breakthrough.synergy && (
                <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-400 mb-2">Synergy Requirement</div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 rounded ${synergy1?.bg} ${synergy1?.border} border`}
                    >
                      <span className={`${synergy1?.text} font-medium capitalize`}>
                        {breakthrough.synergy.color1}
                      </span>
                    </div>
                    <span className="text-gray-500">+</span>
                    <div
                      className={`px-3 py-1 rounded ${synergy2?.bg} ${synergy2?.border} border`}
                    >
                      <span className={`${synergy2?.text} font-medium capitalize`}>
                        {breakthrough.synergy.color2}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Requires 2 technologies of each color to activate synergy
                  </p>
                </div>
              )}

              {/* Description */}
              <div className="text-gray-200 leading-relaxed">{breakthrough.description}</div>

              {/* Exhaustable Info */}
              {breakthrough.isExhaustable && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-amber-400">↻</span>
                  <span>This ability can be exhausted and readied</span>
                </div>
              )}

              {/* Status */}
              <div className="mt-4 p-3 rounded-lg bg-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Status:</span>
                  <span
                    className={`text-sm font-medium ${
                      !isUnlocked
                        ? 'text-gray-500'
                        : isExhausted
                        ? 'text-yellow-500'
                        : 'text-green-400'
                    }`}
                  >
                    {!isUnlocked ? 'Locked' : isExhausted ? 'Exhausted' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700 flex gap-2">
              {isUnlocked && breakthrough.isExhaustable && !isExhausted && onUse && (
                <button
                  onClick={() => {
                    onUse();
                    setShowDetails(false);
                  }}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                >
                  Use Ability
                </button>
              )}
              <button
                onClick={() => setShowDetails(false)}
                className={`${
                  isUnlocked && breakthrough.isExhaustable && !isExhausted && onUse
                    ? 'flex-1'
                    : 'w-full'
                } py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors`}
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
