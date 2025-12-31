'use client';

import { useRef, useEffect, useState } from 'react';
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

  const isOverlay = variant === 'overlay';

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (filterTypes && !filterTypes.includes(entry.type)) {
      return false;
    }

    // No filtering in overlay mode - show all
    if (isOverlay) return true;

    const category = LOG_FILTER_CATEGORIES.find(c => c.label === selectedFilter);
    if (category && category.types) {
      return (category.types as readonly string[]).includes(entry.type);
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
        <span className="text-xs text-gray-500">{filteredEntries.length} events</span>
      </div>

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
