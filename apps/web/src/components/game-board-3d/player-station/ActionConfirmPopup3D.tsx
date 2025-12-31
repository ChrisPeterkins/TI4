'use client';

import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';

export interface ActionConfirmPopup3DProps {
  position?: [number, number, number];
  onPlay: () => void;
  onInspect: () => void;
  onClose: () => void;
  playLabel?: string;
  inspectLabel?: string;
  title?: string;
}

/**
 * A 3D confirmation popup that appears when clicking on a playable item.
 * Offers two options: Play (execute action) and Inspect (view card details).
 */
export function ActionConfirmPopup3D({
  position = [0, 0.3, 0],
  onPlay,
  onInspect,
  onClose,
  playLabel = 'Play',
  inspectLabel = 'Inspect',
  title,
}: ActionConfirmPopup3DProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
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
  }, [onClose]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay();
    onClose();
  };

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInspect();
    onClose();
  };

  return (
    <group position={position}>
      <Html center>
        <div
          ref={popupRef}
          className="bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-600 shadow-2xl p-2 min-w-[120px]"
        >
          {title && (
            <div className="text-gray-400 text-xs text-center mb-2 pb-1 border-b border-gray-700">
              {title}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-purple-600/80 hover:bg-purple-500 text-white text-sm font-medium transition-colors w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {playLabel}
            </button>
            <button
              onClick={handleInspect}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-200 text-sm font-medium transition-colors w-full justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {inspectLabel}
            </button>
          </div>
        </div>
      </Html>
    </group>
  );
}
