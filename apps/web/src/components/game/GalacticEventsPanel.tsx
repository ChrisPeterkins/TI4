'use client';

import { useState } from 'react';
import { GALACTIC_EVENTS_BY_ID, type GalacticEventData } from '@ti4/shared';

interface GalacticEventsPanelProps {
  eventIds: string[];
}

const COMPLEXITY_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-green-900/30', text: 'text-green-400', label: 'Simple' },
  2: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', label: 'Moderate' },
  3: { bg: 'bg-red-900/30', text: 'text-red-400', label: 'Complex' },
};

export default function GalacticEventsPanel({ eventIds }: GalacticEventsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GalacticEventData | null>(null);

  const events = eventIds
    .map((id) => GALACTIC_EVENTS_BY_ID[id])
    .filter((e): e is GalacticEventData => e !== undefined);

  if (events.length === 0) {
    return null;
  }

  return (
    <>
      {/* Compact Display */}
      <div
        className="fixed top-4 right-4 z-40"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Badge */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 bg-purple-900/80 backdrop-blur-sm border border-purple-500 rounded-lg shadow-lg hover:bg-purple-800/80 transition-colors"
        >
          <span className="text-purple-300">✨</span>
          <span className="text-white font-medium">
            {events.length} Galactic Event{events.length > 1 ? 's' : ''}
          </span>
        </button>

        {/* Expanded Panel */}
        {isExpanded && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
                Active Galactic Events
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {events.map((event) => {
                const complexity = COMPLEXITY_STYLES[event.complexity];
                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="w-full text-left p-3 border-b border-gray-800 last:border-b-0 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-white">{event.name}</div>
                        <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                          {event.description}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 px-1.5 py-0.5 text-xs rounded ${complexity.bg} ${complexity.text}`}
                      >
                        {complexity.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Full Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="max-w-lg w-full mx-4 bg-gray-900 border border-purple-500 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-purple-900/50 border-b border-purple-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  <h2 className="text-xl font-bold text-white">{selectedEvent.name}</h2>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
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
              <div className="mt-2">
                <span
                  className={`inline-block px-2 py-1 text-sm rounded ${
                    COMPLEXITY_STYLES[selectedEvent.complexity].bg
                  } ${COMPLEXITY_STYLES[selectedEvent.complexity].text}`}
                >
                  Complexity: {COMPLEXITY_STYLES[selectedEvent.complexity].label}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="text-gray-200 leading-relaxed">{selectedEvent.description}</div>

              {selectedEvent.setupInstructions && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-500">📋</span>
                    <div>
                      <div className="text-sm font-medium text-yellow-400">Setup Instructions</div>
                      <p className="text-sm text-yellow-200/80 mt-1">
                        {selectedEvent.setupInstructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedEvent.ruleModifications && selectedEvent.ruleModifications.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-400 mb-2">Rule Modifications:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.ruleModifications.map((mod) => (
                      <span
                        key={mod}
                        className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                      >
                        {mod.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-700">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
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
