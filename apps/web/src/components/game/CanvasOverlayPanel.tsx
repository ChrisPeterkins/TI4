'use client';

import { useState } from 'react';
import type { GameLogEntry, ChatMessageEvent, PlayerState } from '@ti4/shared';
import { GameLog } from './GameLog';
import { Chat } from './Chat';

interface CanvasOverlayPanelProps {
  gameLogEntries: GameLogEntry[];
  chatMessages: ChatMessageEvent[];
  currentPlayerId: string | null;
  players: PlayerState[];
  onSendChatMessage: (message: string, targetPlayerId?: string) => void;
}

export function CanvasOverlayPanel({
  gameLogEntries,
  chatMessages,
  currentPlayerId,
  players,
  onSendChatMessage,
}: CanvasOverlayPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'log' | 'chat'>('log');

  // Minimized state - just a small floating icon
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed right-4 bottom-4 z-30 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full
                   border border-white/20 flex items-center justify-center
                   hover:bg-black/80 hover:border-white/30 transition-all shadow-lg"
        title="Show Log/Chat"
      >
        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {/* Unread indicator */}
        {chatMessages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
        )}
      </button>
    );
  }

  // Expanded panel
  return (
    <div className="fixed right-4 bottom-4 z-30 w-64 bg-black/60 backdrop-blur-sm
                    rounded-lg border border-white/10 shadow-xl overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-stretch border-b border-white/10">
        <button
          onClick={() => setActiveTab('log')}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'log'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          Log
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors relative ${
            activeTab === 'chat'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          Chat
          {chatMessages.length > 0 && activeTab !== 'chat' && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setIsMinimized(true)}
          className="px-2.5 text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors border-l border-white/10"
          title="Minimize"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[200px] overflow-hidden">
        {activeTab === 'log' ? (
          <GameLog
            entries={gameLogEntries}
            variant="overlay"
            maxHeight="200px"
            showTimestamps={false}
          />
        ) : (
          <Chat
            messages={chatMessages}
            currentPlayerId={currentPlayerId}
            players={players}
            onSendMessage={onSendChatMessage}
            variant="overlay"
          />
        )}
      </div>
    </div>
  );
}
