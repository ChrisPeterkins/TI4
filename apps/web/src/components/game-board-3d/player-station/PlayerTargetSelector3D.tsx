'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Html } from '@react-three/drei';
import type { PlayerColor } from '@ti4/shared';
import { PLAYER_COLORS_3D } from '../constants';

export interface TargetablePlayer {
  id: string;
  name: string;
  faction: string;
  factionShortName?: string;
  color: PlayerColor;
}

export interface PlayerTargetSelector3DProps {
  position?: [number, number, number];
  players: TargetablePlayer[];
  onSelect: (playerId: string) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  /** Allow selecting self (default: false) */
  allowSelf?: boolean;
  /** The current player's ID (used to exclude self) */
  currentPlayerId?: string;
}

/**
 * A 3D popup that allows selecting a player to target with an ability.
 * Shows player names with their faction icons and colors.
 */
export function PlayerTargetSelector3D({
  position = [0, 0.5, 0],
  players,
  onSelect,
  onCancel,
  title = 'Select Target',
  description,
  allowSelf = false,
  currentPlayerId,
}: PlayerTargetSelector3DProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Filter out self if not allowed
  const targetablePlayers = allowSelf
    ? players
    : players.filter(p => p.id !== currentPlayerId);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };

    // Delay adding listener to prevent immediate close
    const timeoutId = setTimeout(() => {
      window.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  const handleSelect = useCallback((e: React.MouseEvent, playerId: string) => {
    e.stopPropagation();
    onSelect(playerId);
  }, [onSelect]);

  const handleCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
  }, [onCancel]);

  return (
    <group position={position}>
      <Html center>
        <div
          ref={popupRef}
          className="bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-600 shadow-2xl p-3 min-w-[200px] max-w-[280px]"
        >
          {/* Header */}
          <div className="text-center mb-3 pb-2 border-b border-gray-700">
            <div className="text-white font-bold text-sm">{title}</div>
            {description && (
              <div className="text-gray-400 text-xs mt-1">{description}</div>
            )}
          </div>

          {/* Player List */}
          <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
            {targetablePlayers.length === 0 ? (
              <div className="text-gray-500 text-xs text-center py-2">
                No valid targets available
              </div>
            ) : (
              targetablePlayers.map((player) => {
                const playerColor = PLAYER_COLORS_3D[player.color];
                return (
                  <button
                    key={player.id}
                    onClick={(e) => handleSelect(e, player.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-800/80 hover:bg-gray-700 transition-colors w-full text-left group"
                    style={{
                      borderLeft: `3px solid ${playerColor}`,
                    }}
                  >
                    {/* Player color indicator */}
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: playerColor }}
                    />

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate group-hover:text-blue-300 transition-colors">
                        {player.name}
                      </div>
                      <div className="text-gray-400 text-xs truncate">
                        {player.factionShortName || player.faction}
                      </div>
                    </div>

                    {/* Selection arrow */}
                    <svg
                      className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                );
              })
            )}
          </div>

          {/* Cancel Button */}
          <div className="mt-3 pt-2 border-t border-gray-700">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-700/60 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
          </div>
        </div>
      </Html>
    </group>
  );
}
