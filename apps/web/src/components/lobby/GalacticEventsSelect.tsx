'use client';

import { useState, useMemo } from 'react';
import {
  GALACTIC_EVENTS,
  getGalacticEventsByCategory,
  validateGalacticEventSelection,
  type GalacticEventData,
} from '@ti4/shared';

type EventCategory = 'economy' | 'military' | 'political' | 'exploration' | 'special';

interface GalacticEventsSelectProps {
  selectedEvents: string[];
  onEventsChange: (eventIds: string[]) => void;
  disabled?: boolean;
  maxEvents?: number;
}

const CATEGORY_INFO: Record<EventCategory, { label: string; color: string; icon: string }> = {
  economy: { label: 'Economy', color: 'text-yellow-400', icon: '💰' },
  military: { label: 'Military', color: 'text-red-400', icon: '⚔️' },
  political: { label: 'Political', color: 'text-blue-400', icon: '🏛️' },
  exploration: { label: 'Exploration', color: 'text-green-400', icon: '🔭' },
  special: { label: 'Special', color: 'text-purple-400', icon: '✨' },
};

const COMPLEXITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Simple', color: 'bg-green-600' },
  2: { label: 'Moderate', color: 'bg-yellow-600' },
  3: { label: 'Complex', color: 'bg-red-600' },
};

export default function GalacticEventsSelect({
  selectedEvents,
  onEventsChange,
  disabled = false,
  maxEvents = 3,
}: GalacticEventsSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<EventCategory>('economy');

  const eventsByCategory = useMemo(() => {
    const categories: EventCategory[] = ['economy', 'military', 'political', 'exploration', 'special'];
    return categories.reduce((acc, cat) => {
      acc[cat] = getGalacticEventsByCategory(cat);
      return acc;
    }, {} as Record<EventCategory, GalacticEventData[]>);
  }, []);

  const validation = useMemo(() => {
    return validateGalacticEventSelection(selectedEvents);
  }, [selectedEvents]);

  const toggleEvent = (eventId: string) => {
    if (disabled) return;

    if (selectedEvents.includes(eventId)) {
      onEventsChange(selectedEvents.filter((id) => id !== eventId));
    } else if (selectedEvents.length < maxEvents) {
      onEventsChange([...selectedEvents, eventId]);
    }
  };

  const clearAll = () => {
    if (!disabled) {
      onEventsChange([]);
    }
  };

  const selectedEventData = GALACTIC_EVENTS.filter((e) => selectedEvents.includes(e.id));

  return (
    <div className="w-full">
      {/* Header / Toggle Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
          isOpen
            ? 'bg-purple-900/30 border-purple-500'
            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-purple-400">✨</span>
          <span className="font-medium">Galactic Events</span>
          {selectedEvents.length > 0 && (
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
              {selectedEvents.length}/{maxEvents}
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Panel */}
      {isOpen && (
        <div className="mt-2 p-4 bg-gray-800 rounded-lg border border-gray-700">
          {/* Selected Events Summary */}
          {selectedEventData.length > 0 && (
            <div className="mb-4 p-3 bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">Selected Events</span>
                <button
                  onClick={clearAll}
                  disabled={disabled}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedEventData.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => toggleEvent(event.id)}
                    disabled={disabled}
                    className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                  >
                    {event.name}
                    <span className="text-purple-300">×</span>
                  </button>
                ))}
              </div>
              {!validation.valid && (
                <div className="mt-2 text-sm text-red-400">
                  {validation.conflicts.map((conflict, i) => (
                    <div key={i}>⚠️ {conflict}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 mb-4">
            {(Object.keys(CATEGORY_INFO) as EventCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  activeCategory === cat
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <span className="mr-1">{CATEGORY_INFO[cat].icon}</span>
                {CATEGORY_INFO[cat].label}
              </button>
            ))}
          </div>

          {/* Event Cards */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {eventsByCategory[activeCategory].map((event) => {
              const isSelected = selectedEvents.includes(event.id);
              const isMaxed = selectedEvents.length >= maxEvents && !isSelected;
              const complexity = COMPLEXITY_LABELS[event.complexity];

              return (
                <button
                  key={event.id}
                  onClick={() => toggleEvent(event.id)}
                  disabled={disabled || isMaxed}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-purple-900/40 border-purple-500'
                      : isMaxed
                      ? 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{event.name}</span>
                        <span
                          className={`px-1.5 py-0.5 text-xs rounded ${complexity.color} text-white`}
                        >
                          {complexity.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{event.description}</p>
                      {event.setupInstructions && (
                        <p className="text-xs text-yellow-500 mt-1">
                          📋 Setup: {event.setupInstructions}
                        </p>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-600'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Help Text */}
          <p className="mt-4 text-xs text-gray-500">
            Galactic Events are optional rule modifiers that affect all players. Select up to{' '}
            {maxEvents} events for this game.
          </p>
        </div>
      )}
    </div>
  );
}
