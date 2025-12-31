'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { ChatMessageEvent, PlayerState } from '@ti4/shared';

interface ChatProps {
  messages: ChatMessageEvent[];
  currentPlayerId: string | null;
  players: PlayerState[];
  onSendMessage: (message: string, targetPlayerId?: string) => void;
  variant?: 'sidebar' | 'overlay';
}

// Color mapping for player colors
const PLAYER_COLORS: Record<string, string> = {
  red: 'text-red-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
  orange: 'text-orange-400',
  pink: 'text-pink-400',
  black: 'text-gray-400',
};

export function Chat({ messages, currentPlayerId, players, onSendMessage, variant = 'sidebar' }: ChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messageText, setMessageText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);

  const isOverlay = variant === 'overlay';

  // Get player color class
  const getPlayerColorClass = useCallback((playerId: string): string => {
    const player = players.find(p => p.id === playerId);
    if (!player) return 'text-gray-400';
    return PLAYER_COLORS[player.color] || 'text-gray-400';
  }, [players]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, autoScroll]);

  // Detect manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    onSendMessage(messageText, selectedRecipient || undefined);
    setMessageText('');
    inputRef.current?.focus();
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get other players for private message dropdown
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);

  // Overlay variant - compact, transparent
  if (isOverlay) {
    return (
      <div className="flex flex-col h-full">
        {/* Messages - compact */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-2 space-y-1"
          style={{ maxHeight: '150px' }}
        >
          {messages.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-xs">
              No messages
            </div>
          ) : (
            messages.slice(-20).map((msg) => (
              <ChatMessageCompact
                key={msg.id}
                message={msg}
                isOwnMessage={msg.playerId === currentPlayerId}
                playerColorClass={getPlayerColorClass(msg.playerId)}
              />
            ))
          )}
        </div>

        {/* Compact Input */}
        <form onSubmit={handleSubmit} className="border-t border-white/10 p-1.5">
          <div className="flex gap-1">
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Message..."
              maxLength={500}
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="px-2 py-1 bg-blue-600/50 hover:bg-blue-600/70 disabled:bg-gray-700/50 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Sidebar variant - full featured
  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800/50">
        <h3 className="text-sm font-medium text-gray-300">Chat</h3>
        <span className="text-xs text-gray-500">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2"
        style={{ minHeight: '200px' }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No messages yet. Start chatting!
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              isOwnMessage={msg.playerId === currentPlayerId}
              playerColorClass={getPlayerColorClass(msg.playerId)}
              formatTime={formatTime}
            />
          ))
        )}
      </div>

      {/* Scroll to latest indicator */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }}
          className="absolute bottom-16 right-4 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded shadow-lg"
        >
          New messages
        </button>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-700 p-2">
        {/* Recipient selector for private messages */}
        <div className="flex items-center gap-2 mb-2">
          <select
            value={selectedRecipient || ''}
            onChange={(e) => setSelectedRecipient(e.target.value || null)}
            className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Players</option>
            {otherPlayers.map((player) => (
              <option key={player.id} value={player.id}>
                Whisper to {player.name}
              </option>
            ))}
          </select>
          {selectedRecipient && (
            <span className="text-xs text-yellow-400">Private</span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={selectedRecipient ? 'Private message...' : 'Type a message...'}
            maxLength={500}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

// =============================================================================
// CHAT MESSAGE COMPONENT
// =============================================================================

interface ChatMessageProps {
  message: ChatMessageEvent;
  isOwnMessage: boolean;
  playerColorClass: string;
  formatTime: (timestamp: number) => string;
}

function ChatMessage({ message, isOwnMessage, playerColorClass, formatTime }: ChatMessageProps) {
  return (
    <div
      className={`flex flex-col gap-0.5 ${
        isOwnMessage ? 'items-end' : 'items-start'
      }`}
    >
      {/* Header: name + timestamp */}
      <div className="flex items-center gap-2 text-xs">
        <span className={`font-medium ${playerColorClass}`}>
          {message.playerName}
        </span>
        {message.isPrivate && (
          <span className="text-yellow-400">(private)</span>
        )}
        <span className="text-gray-600">{formatTime(message.timestamp)}</span>
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[85%] px-3 py-1.5 rounded-lg text-sm ${
          isOwnMessage
            ? 'bg-blue-600/30 text-blue-100'
            : message.isPrivate
            ? 'bg-yellow-600/20 text-yellow-100 border border-yellow-600/30'
            : 'bg-gray-700/50 text-gray-200'
        }`}
      >
        {message.message}
      </div>
    </div>
  );
}

// Compact chat message for overlay mode
interface ChatMessageCompactProps {
  message: ChatMessageEvent;
  isOwnMessage: boolean;
  playerColorClass: string;
}

function ChatMessageCompact({ message, isOwnMessage, playerColorClass }: ChatMessageCompactProps) {
  return (
    <div className="flex items-start gap-1.5 text-xs leading-tight">
      <span className={`font-medium flex-shrink-0 ${playerColorClass}`}>
        {message.playerName.slice(0, 8)}:
      </span>
      <span className={`truncate ${isOwnMessage ? 'text-blue-300' : 'text-gray-300'}`}>
        {message.message}
      </span>
      {message.isPrivate && (
        <span className="text-yellow-400 flex-shrink-0">*</span>
      )}
    </div>
  );
}

// =============================================================================
// COMPACT CHAT (for sidebar/minimal view)
// =============================================================================

interface CompactChatProps {
  messages: ChatMessageEvent[];
  maxMessages?: number;
}

export function CompactChat({ messages, maxMessages = 5 }: CompactChatProps) {
  const recentMessages = messages.slice(-maxMessages);

  return (
    <div className="space-y-1">
      {recentMessages.length === 0 ? (
        <div className="text-gray-500 text-xs text-center py-2">No messages</div>
      ) : (
        recentMessages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-1.5 text-xs">
            <span className="text-gray-400 font-medium truncate max-w-[80px]">
              {msg.playerName}:
            </span>
            <span className="text-gray-300 truncate flex-1">{msg.message}</span>
          </div>
        ))
      )}
    </div>
  );
}
