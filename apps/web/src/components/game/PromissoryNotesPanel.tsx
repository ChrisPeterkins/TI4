'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { PlayerState, PromissoryNoteInPlay } from '@ti4/shared';
import { getPromissoryNoteById } from '@ti4/shared';
import { getCardUrl } from '@/lib/assets';

interface PromissoryNotesPanelProps {
  player: PlayerState;
  allPlayers?: PlayerState[];
  onPlayNote?: (noteId: string) => void;
  compact?: boolean;
}

// Get card image URL with fallback handling
function getNoteImageUrl(noteId: string): string {
  // Extract base note id (remove faction prefix if any)
  const baseId = noteId.replace(/_[a-z]+$/, '');
  return getCardUrl('promissory', baseId);
}

// Single promissory note card display
function PromissoryNoteCard({
  noteId,
  onClick,
  isInPlay,
  originalOwnerName,
}: {
  noteId: string;
  onClick?: () => void;
  isInPlay?: boolean;
  originalOwnerName?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const note = getPromissoryNoteById(noteId);
  const imagePath = getNoteImageUrl(noteId);

  if (!note) {
    return (
      <div className="bg-gray-700 rounded p-2 text-xs text-gray-400">
        Unknown note: {noteId}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded overflow-hidden border transition-all cursor-pointer ${
        isInPlay
          ? 'border-green-500/50 bg-green-900/20'
          : 'border-gray-600 hover:border-gray-400'
      }`}
      onClick={onClick}
    >
      {!imageError ? (
        <Image
          src={imagePath}
          alt={note.name}
          width={100}
          height={140}
          className="w-full h-auto"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="p-2 bg-gray-800">
          <div className="text-xs font-medium text-white mb-1">{note.name}</div>
          <div className="text-xs text-gray-400 line-clamp-3">{note.description}</div>
        </div>
      )}

      {isInPlay && (
        <div className="absolute top-1 right-1 px-1 py-0.5 bg-green-600/90 rounded text-xs text-white font-medium">
          In Play
        </div>
      )}

      {originalOwnerName && (
        <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/70 text-xs text-gray-300 truncate">
          From: {originalOwnerName}
        </div>
      )}
    </div>
  );
}

// Modal for viewing a promissory note in detail
function NoteDetailModal({
  noteId,
  note,
  isInPlay,
  canPlay,
  onPlay,
  onClose,
}: {
  noteId: string;
  note: ReturnType<typeof getPromissoryNoteById>;
  isInPlay: boolean;
  canPlay: boolean;
  onPlay?: () => void;
  onClose: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const imagePath = getNoteImageUrl(noteId);

  if (!note) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-gray-400 hover:text-white text-sm"
        >
          Click anywhere to close
        </button>

        {/* Card image */}
        <div className="rounded-lg overflow-hidden border-2 border-gray-500 shadow-2xl">
          {!imageError ? (
            <Image
              src={imagePath}
              alt={note.name}
              width={300}
              height={420}
              className="w-full h-auto"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="p-4 bg-gray-800 aspect-[5/7]">
              <div className="text-lg font-bold text-white mb-2">{note.name}</div>
              <div className="text-sm text-gray-300">{note.description}</div>
            </div>
          )}
        </div>

        {/* Card info */}
        <div className="mt-4 bg-gray-800 rounded-lg p-4 border border-gray-600">
          <h3 className="text-lg font-bold text-white mb-2">{note.name}</h3>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">{note.description}</p>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Timing: <span className="text-purple-400">{note.playTiming}</span>
            </span>
            {note.immediatePlay && (
              <span className="px-2 py-0.5 bg-yellow-600/30 text-yellow-400 rounded">
                Immediate Play
              </span>
            )}
          </div>

          {/* Play button */}
          {canPlay && !isInPlay && onPlay && (
            <button
              onClick={() => {
                onPlay();
                onClose();
              }}
              className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 font-medium"
            >
              Play Note
            </button>
          )}

          {isInPlay && (
            <div className="mt-4 px-4 py-2 bg-green-600/20 border border-green-500/50 text-green-400 rounded text-center text-sm">
              Currently in play
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PromissoryNotesPanel({
  player,
  allPlayers,
  onPlayNote,
  compact = false,
}: PromissoryNotesPanelProps) {
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  // Get player names map for showing original owners
  const playerNames = useMemo(() => {
    const names: Record<string, string> = {};
    if (allPlayers) {
      allPlayers.forEach(p => {
        names[p.id] = p.name;
      });
    }
    return names;
  }, [allPlayers]);

  // Get notes in hand and in play
  const notesInHand = player.promissoryNotesInHand || [];
  const notesInPlay = player.promissoryNotesInPlay || [];

  // Don't render if player has no promissory notes
  if (notesInHand.length === 0 && notesInPlay.length === 0) {
    return null;
  }

  const selectedNoteData = selectedNote ? getPromissoryNoteById(selectedNote) : null;
  const isSelectedInPlay = notesInPlay.some(n => n.noteId === selectedNote);

  return (
    <div className="mb-4">
      <div className="text-xs text-gray-500 mb-2">
        Promissory Notes ({notesInHand.length + notesInPlay.length})
      </div>

      {/* Notes in Play */}
      {notesInPlay.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-green-400 mb-1">In Play</div>
          <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            {notesInPlay.map((noteInPlay: PromissoryNoteInPlay) => (
              <PromissoryNoteCard
                key={noteInPlay.noteId}
                noteId={noteInPlay.noteId}
                onClick={() => setSelectedNote(noteInPlay.noteId)}
                isInPlay={true}
                originalOwnerName={playerNames[noteInPlay.originalOwnerId]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes in Hand */}
      {notesInHand.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 mb-1">In Hand</div>
          <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            {notesInHand.map((noteId: string) => (
              <PromissoryNoteCard
                key={noteId}
                noteId={noteId}
                onClick={() => setSelectedNote(noteId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && selectedNoteData && (
        <NoteDetailModal
          noteId={selectedNote}
          note={selectedNoteData}
          isInPlay={isSelectedInPlay}
          canPlay={!!onPlayNote && !isSelectedInPlay}
          onPlay={() => onPlayNote?.(selectedNote)}
          onClose={() => setSelectedNote(null)}
        />
      )}
    </div>
  );
}
