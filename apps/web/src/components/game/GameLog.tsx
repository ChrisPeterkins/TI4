'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { GameLogEntry, GameLogEntryType } from '@ti4/shared';

interface GameLogProps {
  entries: GameLogEntry[];
  maxHeight?: string;
  showTimestamps?: boolean;
  filterTypes?: GameLogEntryType[];
  variant?: 'sidebar' | 'overlay';
}

// Icon and color mapping for log entry types
const LOG_TYPE_CONFIG: Record<
  GameLogEntryType,
  { icon: string; color: string; bgColor: string }
> = {
  // Phase transitions
  phase_change: { icon: '>', color: 'text-purple-400', bgColor: 'bg-purple-900/20' },
  round_start: { icon: '>', color: 'text-purple-400', bgColor: 'bg-purple-900/20' },
  // Strategy phase
  strategy_card_picked: { icon: '>', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' },
  // Action phase
  turn_start: { icon: '>', color: 'text-blue-400', bgColor: 'bg-blue-900/20' },
  tactical_action: { icon: '>', color: 'text-blue-400', bgColor: 'bg-blue-900/20' },
  strategic_action: { icon: '>', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' },
  component_action: { icon: '>', color: 'text-gray-400', bgColor: 'bg-gray-900/20' },
  pass: { icon: '-', color: 'text-gray-500', bgColor: 'bg-gray-900/20' },
  // Movement
  units_moved: { icon: '>', color: 'text-cyan-400', bgColor: 'bg-cyan-900/20' },
  system_activated: { icon: '!', color: 'text-orange-400', bgColor: 'bg-orange-900/20' },
  // Combat
  combat_start: { icon: '!', color: 'text-red-400', bgColor: 'bg-red-900/30' },
  combat_round: { icon: '>', color: 'text-red-400', bgColor: 'bg-red-900/20' },
  dice_rolled: { icon: '>', color: 'text-red-300', bgColor: 'bg-red-900/20' },
  hits_assigned: { icon: '>', color: 'text-red-300', bgColor: 'bg-red-900/20' },
  unit_destroyed: { icon: 'x', color: 'text-red-500', bgColor: 'bg-red-900/30' },
  combat_end: { icon: '!', color: 'text-red-400', bgColor: 'bg-red-900/30' },
  retreat: { icon: '<', color: 'text-orange-400', bgColor: 'bg-orange-900/20' },
  // Production
  units_produced: { icon: '+', color: 'text-green-400', bgColor: 'bg-green-900/20' },
  // Invasion
  bombardment: { icon: '!', color: 'text-orange-500', bgColor: 'bg-orange-900/20' },
  invasion_start: { icon: '!', color: 'text-orange-400', bgColor: 'bg-orange-900/20' },
  planet_taken: { icon: '+', color: 'text-green-500', bgColor: 'bg-green-900/30' },
  // Cards
  action_card_played: { icon: '>', color: 'text-blue-400', bgColor: 'bg-blue-900/20' },
  action_card_drawn: { icon: '+', color: 'text-blue-300', bgColor: 'bg-blue-900/20' },
  sabotage: { icon: 'x', color: 'text-red-400', bgColor: 'bg-red-900/20' },
  rider_played: { icon: '>', color: 'text-purple-400', bgColor: 'bg-purple-900/20' },
  rider_resolved: { icon: '>', color: 'text-purple-400', bgColor: 'bg-purple-900/20' },
  // Technology
  technology_researched: { icon: '+', color: 'text-cyan-400', bgColor: 'bg-cyan-900/20' },
  // Objectives
  objective_scored: { icon: '*', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' },
  objective_revealed: { icon: '?', color: 'text-yellow-300', bgColor: 'bg-yellow-900/20' },
  // Agenda
  agenda_revealed: { icon: '?', color: 'text-purple-400', bgColor: 'bg-purple-900/20' },
  vote_cast: { icon: '>', color: 'text-purple-300', bgColor: 'bg-purple-900/20' },
  agenda_resolved: { icon: '!', color: 'text-purple-400', bgColor: 'bg-purple-900/30' },
  // Trade
  transaction_completed: { icon: '$', color: 'text-amber-400', bgColor: 'bg-amber-900/20' },
  commodities_refreshed: { icon: '$', color: 'text-amber-300', bgColor: 'bg-amber-900/20' },
  // Exploration
  planet_explored: { icon: '?', color: 'text-teal-400', bgColor: 'bg-teal-900/20' },
  relic_fragment_gained: { icon: '+', color: 'text-violet-400', bgColor: 'bg-violet-900/20' },
  relic_gained: { icon: '*', color: 'text-amber-400', bgColor: 'bg-amber-900/30' },
  fragments_purged: { icon: '-', color: 'text-violet-300', bgColor: 'bg-violet-900/20' },
  attachment_placed: { icon: '+', color: 'text-teal-300', bgColor: 'bg-teal-900/20' },
  // Other
  promissory_note_played: { icon: '>', color: 'text-pink-400', bgColor: 'bg-pink-900/20' },
  ability_triggered: { icon: '*', color: 'text-indigo-400', bgColor: 'bg-indigo-900/20' },
  game_won: { icon: '*', color: 'text-yellow-500', bgColor: 'bg-yellow-900/40' },
};

// Filter categories for UI
const LOG_FILTER_CATEGORIES = [
  { label: 'All', types: null },
  { label: 'Combat', types: ['combat_start', 'combat_round', 'dice_rolled', 'hits_assigned', 'unit_destroyed', 'combat_end', 'retreat', 'bombardment'] },
  { label: 'Actions', types: ['tactical_action', 'strategic_action', 'units_moved', 'units_produced', 'pass'] },
  { label: 'Cards', types: ['action_card_played', 'sabotage', 'technology_researched'] },
  { label: 'Politics', types: ['agenda_revealed', 'vote_cast', 'agenda_resolved', 'rider_played', 'rider_resolved'] },
  { label: 'Objectives', types: ['objective_scored', 'objective_revealed'] },
] as const;

export function GameLog({
  entries,
  maxHeight = '400px',
  showTimestamps = false,
  filterTypes,
  variant = 'sidebar',
}: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const isOverlay = variant === 'overlay';

  // Format entries for text export
  const formatEntryAsText = useCallback((entry: GameLogEntry) => {
    const date = new Date(entry.timestamp);
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return `[R${entry.round}] ${time} - ${entry.message}`;
  }, []);

  // Export to JSON
  const exportToJson = useCallback(() => {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-log-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [entries]);

  // Export to text
  const exportToText = useCallback(() => {
    const text = entries.map(formatEntryAsText).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-log-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [entries, formatEntryAsText]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    const text = entries.map(formatEntryAsText).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    setShowExportMenu(false);
  }, [entries, formatEntryAsText]);

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (filterTypes && !filterTypes.includes(entry.type)) {
      return false;
    }

    // No filtering in overlay mode - show all
    if (isOverlay) return true;

    // Category filter
    const category = LOG_FILTER_CATEGORIES.find(c => c.label === selectedFilter);
    if (category && category.types) {
      if (!(category.types as readonly string[]).includes(entry.type)) {
        return false;
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        entry.message.toLowerCase().includes(query) ||
        (entry.playerName && entry.playerName.toLowerCase().includes(query)) ||
        (entry.playerFaction && entry.playerFaction.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  // Overlay variant - compact, transparent, no filters
  if (isOverlay) {
    return (
      <div className="flex flex-col h-full">
        {/* Log Entries - compact */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-2 space-y-0.5"
          style={{ maxHeight }}
        >
          {filteredEntries.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-xs">
              No events
            </div>
          ) : (
            filteredEntries.slice(-50).map(entry => (
              <LogEntryItemCompact key={entry.id} entry={entry} />
            ))
          )}
        </div>
      </div>
    );
  }

  // Sidebar variant - full featured
  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/50">
        <h3 className="text-sm font-medium text-gray-300">Game Log</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{filteredEntries.length} events</span>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1 rounded transition-colors ${
              showSearch || searchQuery
                ? 'text-blue-400 bg-blue-900/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
            }`}
            title="Search log"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors"
              title="Export log"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                <button
                  onClick={copyToClipboard}
                  className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                >
                  {copySuccess ? (
                    <>
                      <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy to clipboard
                    </>
                  )}
                </button>
                <button
                  onClick={exportToText}
                  className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as .txt
                </button>
                <button
                  onClick={exportToJson}
                  className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  Export as .json
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-2 py-1.5 border-b border-gray-700 bg-gray-800/30">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full px-3 py-1.5 pl-8 text-xs bg-gray-800 border border-gray-600 rounded text-gray-300 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 px-2 py-1.5 border-b border-gray-700 bg-gray-800/30 overflow-x-auto">
        {LOG_FILTER_CATEGORIES.map(category => (
          <button
            key={category.label}
            onClick={() => setSelectedFilter(category.label)}
            className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
              selectedFilter === category.label
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Log Entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 space-y-1"
        style={{ maxHeight }}
      >
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No events to display
          </div>
        ) : (
          filteredEntries.map(entry => (
            <LogEntryItem
              key={entry.id}
              entry={entry}
              showTimestamp={showTimestamps}
            />
          ))
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }}
          className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded shadow-lg"
        >
          Scroll to latest
        </button>
      )}
    </div>
  );
}

// =============================================================================
// LOG ENTRY ITEM COMPONENT
// =============================================================================

interface LogEntryItemProps {
  entry: GameLogEntry;
  showTimestamp?: boolean;
}

function LogEntryItem({ entry, showTimestamp }: LogEntryItemProps) {
  const config = LOG_TYPE_CONFIG[entry.type] || {
    icon: '>',
    color: 'text-gray-400',
    bgColor: 'bg-gray-900/20',
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div
      className={`flex items-start gap-2 px-2 py-1.5 rounded text-sm ${config.bgColor}`}
    >
      {/* Icon */}
      <span className={`font-mono text-xs w-4 text-center ${config.color}`}>
        {config.icon}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Round indicator */}
        <span className="text-xs text-gray-500 mr-2">R{entry.round}</span>

        {/* Message */}
        <span className="text-gray-300">{entry.message}</span>

        {/* Timestamp */}
        {showTimestamp && (
          <span className="text-xs text-gray-600 ml-2">
            {formatTime(entry.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

// Compact log entry for overlay mode
function LogEntryItemCompact({ entry }: { entry: GameLogEntry }) {
  const config = LOG_TYPE_CONFIG[entry.type] || {
    icon: '>',
    color: 'text-gray-400',
  };

  return (
    <div className="flex items-start gap-1.5 text-xs leading-tight">
      <span className={`font-mono ${config.color} flex-shrink-0`}>
        {config.icon}
      </span>
      <span className="text-gray-400 truncate">{entry.message}</span>
    </div>
  );
}

// =============================================================================
// COMPACT GAME LOG (for sidebar)
// =============================================================================

interface CompactGameLogProps {
  entries: GameLogEntry[];
  maxEntries?: number;
}

export function CompactGameLog({ entries, maxEntries = 10 }: CompactGameLogProps) {
  const recentEntries = entries.slice(-maxEntries);

  return (
    <div className="space-y-1">
      {recentEntries.length === 0 ? (
        <div className="text-gray-500 text-xs text-center py-2">No events yet</div>
      ) : (
        recentEntries.map(entry => {
          const config = LOG_TYPE_CONFIG[entry.type] || {
            icon: '>',
            color: 'text-gray-400',
          };
          return (
            <div
              key={entry.id}
              className="flex items-center gap-1.5 text-xs"
            >
              <span className={`font-mono ${config.color}`}>{config.icon}</span>
              <span className="text-gray-400 truncate">{entry.message}</span>
            </div>
          );
        })
      )}
    </div>
  );
}
