'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ObjectiveData } from '@ti4/shared';
import { getCardUrl, getObjectiveCardBackUrl, getSecretObjectiveCardBackUrl } from '@/lib/assets';

interface ObjectiveCardProps {
  objective: ObjectiveData;
  size?: 'small' | 'medium' | 'large';
  faceUp?: boolean;
  isSelected?: boolean;
  isScored?: boolean;
  canScore?: boolean;
  showImage?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}

const CARD_SIZES = {
  small: { width: 80, height: 112 },
  medium: { width: 120, height: 168 },
  large: { width: 180, height: 252 },
};

/**
 * Enhanced Objective Card component with image support
 * Displays objective card artwork with hover preview and status indicators
 */
export function ObjectiveCard({
  objective,
  size = 'medium',
  faceUp = true,
  isSelected = false,
  isScored = false,
  canScore = true,
  showImage = true,
  onClick,
  onHover,
}: ObjectiveCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { width, height } = CARD_SIZES[size];
  const isSecret = objective.type === 'secret';
  const isStage2 = objective.type === 'stage2';

  // Get card image URL
  const getImageUrl = () => {
    if (!faceUp) {
      return isSecret
        ? getSecretObjectiveCardBackUrl()
        : getObjectiveCardBackUrl(isStage2 ? 'stage2' : 'stage1');
    }
    return getCardUrl('objective', objective.id);
  };

  // Get border/glow color based on state
  const getBorderStyle = () => {
    if (isScored) {
      return 'border-green-500 shadow-green-500/30 shadow-lg';
    }
    if (isSelected) {
      return isStage2
        ? 'border-purple-500 shadow-purple-500/30 shadow-lg'
        : isSecret
          ? 'border-pink-500 shadow-pink-500/30 shadow-lg'
          : 'border-blue-500 shadow-blue-500/30 shadow-lg';
    }
    if (isHovered && canScore) {
      return 'border-gray-400';
    }
    return 'border-gray-700';
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(false);
  };

  const handleClick = () => {
    if (canScore && onClick) {
      onClick();
    }
  };

  // Show image if available and not errored
  const shouldShowImage = showImage && !imageError;

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={!canScore && !isScored}
        className={`
          relative overflow-hidden rounded-lg border-2 transition-all duration-200
          ${getBorderStyle()}
          ${canScore && onClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
          ${!canScore && !isScored ? 'opacity-50' : ''}
        `}
        style={{ width, height }}
      >
        {shouldShowImage ? (
          <Image
            src={getImageUrl()}
            alt={objective.name}
            fill
            className="object-cover"
            sizes={`${width}px`}
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback text display when image not available
          <FallbackCard objective={objective} width={width} height={height} />
        )}

        {/* Scored overlay */}
        {isScored && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
            <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded rotate-[-15deg]">
              SCORED
            </div>
          </div>
        )}

        {/* VP Badge */}
        <div className="absolute bottom-1 right-1 bg-black/80 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded">
          {objective.points} VP
        </div>

        {/* Type indicator */}
        <div className={`
          absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded
          ${isStage2
            ? 'bg-purple-600/80 text-purple-200'
            : isSecret
              ? 'bg-pink-600/80 text-pink-200'
              : 'bg-blue-600/80 text-blue-200'
          }
        `}>
          {isStage2 ? 'II' : isSecret ? 'S' : 'I'}
        </div>
      </button>

      {/* Hover tooltip with full details */}
      {isHovered && faceUp && size !== 'large' && (
        <ObjectiveTooltip objective={objective} />
      )}
    </div>
  );
}

interface FallbackCardProps {
  objective: ObjectiveData;
  width: number;
  height: number;
}

function FallbackCard({ objective, width, height }: FallbackCardProps) {
  const isStage2 = objective.type === 'stage2';
  const isSecret = objective.type === 'secret';

  const bgColor = isStage2
    ? 'bg-gradient-to-b from-purple-900 to-purple-950'
    : isSecret
      ? 'bg-gradient-to-b from-pink-900 to-pink-950'
      : 'bg-gradient-to-b from-blue-900 to-blue-950';

  return (
    <div className={`w-full h-full ${bgColor} p-2 flex flex-col`}>
      <div className="text-white text-xs font-bold text-center mb-1 line-clamp-2">
        {objective.name}
      </div>
      <div className="text-gray-300 text-[8px] leading-tight flex-1 overflow-hidden">
        {objective.description}
      </div>
    </div>
  );
}

interface ObjectiveTooltipProps {
  objective: ObjectiveData;
}

function ObjectiveTooltip({ objective }: ObjectiveTooltipProps) {
  const isStage2 = objective.type === 'stage2';
  const isSecret = objective.type === 'secret';

  return (
    <div className="absolute z-50 left-full ml-2 top-0 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl pointer-events-none">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-white">{objective.name}</h4>
        <span className={`
          text-xs px-2 py-0.5 rounded font-medium
          ${isStage2
            ? 'bg-purple-600/30 text-purple-300'
            : isSecret
              ? 'bg-pink-600/30 text-pink-300'
              : 'bg-blue-600/30 text-blue-300'
          }
        `}>
          {isStage2 ? 'Stage II' : isSecret ? 'Secret' : 'Stage I'}
        </span>
      </div>
      <p className="text-gray-400 text-sm">{objective.description}</p>
      <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between items-center">
        <span className="text-xs text-gray-500">Victory Points</span>
        <span className="text-yellow-400 font-bold">{objective.points}</span>
      </div>
    </div>
  );
}

/**
 * Large objective card view for detailed display
 */
interface ObjectiveCardLargeProps {
  objective: ObjectiveData;
  isScored?: boolean;
  canScore?: boolean;
  onClick?: () => void;
}

export function ObjectiveCardLarge({
  objective,
  isScored = false,
  canScore = true,
  onClick,
}: ObjectiveCardLargeProps) {
  const [imageError, setImageError] = useState(false);
  const isStage2 = objective.type === 'stage2';
  const isSecret = objective.type === 'secret';

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer
        ${isScored
          ? 'border-green-500 bg-green-900/20'
          : canScore
            ? 'border-gray-600 hover:border-gray-400 bg-gray-800'
            : 'border-gray-700 bg-gray-800/50 opacity-60'
        }
      `}
      onClick={canScore ? onClick : undefined}
    >
      <div className="flex">
        {/* Card Image */}
        <div className="relative w-32 h-44 flex-shrink-0">
          {!imageError ? (
            <Image
              src={getCardUrl('objective', objective.id)}
              alt={objective.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <FallbackCard objective={objective} width={128} height={176} />
          )}
        </div>

        {/* Card Info */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-white text-lg">{objective.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`
                text-xs px-2 py-1 rounded font-medium
                ${isStage2
                  ? 'bg-purple-600/30 text-purple-300'
                  : isSecret
                    ? 'bg-pink-600/30 text-pink-300'
                    : 'bg-blue-600/30 text-blue-300'
                }
              `}>
                {isStage2 ? 'Stage II' : isSecret ? 'Secret' : 'Stage I'}
              </span>
              <span className="text-yellow-400 font-bold text-lg">{objective.points} VP</span>
            </div>
          </div>
          <p className="text-gray-400">{objective.description}</p>

          {isScored && (
            <div className="mt-3 inline-flex items-center gap-1 text-green-400 text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Scored
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
