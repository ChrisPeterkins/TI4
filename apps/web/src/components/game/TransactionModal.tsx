'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { PlayerState, TransactionOffer, PendingTransaction } from '@ti4/shared';
import { getPromissoryNoteById } from '@ti4/shared';
import { getFactionIconUrl } from '@/lib/assets';

interface TransactionModalProps {
  currentPlayer: PlayerState;
  allPlayers: PlayerState[];
  pendingTransaction?: PendingTransaction;
  onPropose: (targetPlayerId: string, offering: TransactionOffer, requesting: TransactionOffer) => void;
  onAccept: (transactionId: string) => void;
  onDecline: (transactionId: string) => void;
  onClose: () => void;
}

// Offer builder component
function OfferBuilder({
  player,
  offer,
  setOffer,
  label,
  isCurrentPlayer,
}: {
  player: PlayerState;
  offer: TransactionOffer;
  setOffer: (offer: TransactionOffer) => void;
  label: string;
  isCurrentPlayer: boolean;
}) {
  const tradableNotes = useMemo(() => {
    // Only show notes that are in hand (not in play) and tradable
    return player.promissoryNotesInHand.filter(noteId => {
      const note = getPromissoryNoteById(noteId);
      // Can't trade immediate play notes that are already in play
      return note && !note.immediatePlay;
    });
  }, [player.promissoryNotesInHand]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-sm font-medium text-gray-300 mb-3">{label}</h4>

      {/* Trade Goods */}
      <div className="mb-3">
        <label className="flex items-center justify-between text-sm text-gray-400 mb-1">
          <span>Trade Goods</span>
          <span className="text-yellow-400">Available: {player.tradeGoods}</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded bg-gray-700 text-white disabled:opacity-50"
            onClick={() => setOffer({ ...offer, tradeGoods: Math.max(0, (offer.tradeGoods || 0) - 1) })}
            disabled={!offer.tradeGoods || !isCurrentPlayer}
          >
            -
          </button>
          <input
            type="number"
            value={offer.tradeGoods || 0}
            onChange={(e) => setOffer({ ...offer, tradeGoods: Math.min(player.tradeGoods, Math.max(0, parseInt(e.target.value) || 0)) })}
            className="w-16 text-center bg-gray-700 text-yellow-400 rounded px-2 py-1"
            min="0"
            max={player.tradeGoods}
            disabled={!isCurrentPlayer}
          />
          <button
            className="w-8 h-8 rounded bg-gray-700 text-white disabled:opacity-50"
            onClick={() => setOffer({ ...offer, tradeGoods: Math.min(player.tradeGoods, (offer.tradeGoods || 0) + 1) })}
            disabled={(offer.tradeGoods || 0) >= player.tradeGoods || !isCurrentPlayer}
          >
            +
          </button>
        </div>
      </div>

      {/* Commodities */}
      <div className="mb-3">
        <label className="flex items-center justify-between text-sm text-gray-400 mb-1">
          <span>Commodities</span>
          <span className="text-blue-400">Available: {player.commodities}</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded bg-gray-700 text-white disabled:opacity-50"
            onClick={() => setOffer({ ...offer, commodities: Math.max(0, (offer.commodities || 0) - 1) })}
            disabled={!offer.commodities || !isCurrentPlayer}
          >
            -
          </button>
          <input
            type="number"
            value={offer.commodities || 0}
            onChange={(e) => setOffer({ ...offer, commodities: Math.min(player.commodities, Math.max(0, parseInt(e.target.value) || 0)) })}
            className="w-16 text-center bg-gray-700 text-blue-400 rounded px-2 py-1"
            min="0"
            max={player.commodities}
            disabled={!isCurrentPlayer}
          />
          <button
            className="w-8 h-8 rounded bg-gray-700 text-white disabled:opacity-50"
            onClick={() => setOffer({ ...offer, commodities: Math.min(player.commodities, (offer.commodities || 0) + 1) })}
            disabled={(offer.commodities || 0) >= player.commodities || !isCurrentPlayer}
          >
            +
          </button>
        </div>
      </div>

      {/* Promissory Notes */}
      {tradableNotes.length > 0 && (
        <div className="mb-3">
          <label className="block text-sm text-gray-400 mb-1">Promissory Note (max 1)</label>
          <select
            value={offer.promissoryNotes?.[0] || ''}
            onChange={(e) => setOffer({
              ...offer,
              promissoryNotes: e.target.value ? [e.target.value] : [],
            })}
            className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm"
            disabled={!isCurrentPlayer}
          >
            <option value="">None</option>
            {tradableNotes.map(noteId => {
              const note = getPromissoryNoteById(noteId);
              return (
                <option key={noteId} value={noteId}>
                  {note?.name || noteId}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Action Cards */}
      {player.actionCards.length > 0 && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">Action Cards</label>
          <div className="flex flex-wrap gap-1">
            {player.actionCards.map(cardId => (
              <button
                key={cardId}
                className={`px-2 py-1 text-xs rounded ${
                  offer.actionCards?.includes(cardId)
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => {
                  const currentCards = offer.actionCards || [];
                  const newCards = currentCards.includes(cardId)
                    ? currentCards.filter(c => c !== cardId)
                    : [...currentCards, cardId];
                  setOffer({ ...offer, actionCards: newCards });
                }}
                disabled={!isCurrentPlayer}
              >
                {cardId.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Player selector component
function PlayerSelector({
  players,
  currentPlayerId,
  selectedPlayerId,
  onSelect,
}: {
  players: PlayerState[];
  currentPlayerId: string;
  selectedPlayerId: string | null;
  onSelect: (playerId: string) => void;
}) {
  const eligiblePlayers = players.filter(p => p.id !== currentPlayerId);

  return (
    <div className="mb-4">
      <label className="block text-sm text-gray-400 mb-2">Select Player to Trade With</label>
      <div className="flex flex-wrap gap-2">
        {eligiblePlayers.map(player => (
          <button
            key={player.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
              selectedPlayerId === player.id
                ? 'border-yellow-500 bg-gray-700'
                : 'border-gray-600 bg-gray-800 hover:border-gray-500'
            }`}
            onClick={() => onSelect(player.id)}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden" style={{ backgroundColor: getColorHex(player.color) }}>
              <Image
                src={getFactionIconUrl(player.faction)}
                alt={player.faction}
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-white text-sm">{player.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TransactionModal({
  currentPlayer,
  allPlayers,
  pendingTransaction,
  onPropose,
  onAccept,
  onDecline,
  onClose,
}: TransactionModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [offering, setOffering] = useState<TransactionOffer>({});
  const [requesting, setRequesting] = useState<TransactionOffer>({});

  // Check if viewing a pending transaction
  const isViewingPending = pendingTransaction && (
    pendingTransaction.initiatorId === currentPlayer.id ||
    pendingTransaction.targetId === currentPlayer.id
  );
  const isInitiator = pendingTransaction?.initiatorId === currentPlayer.id;
  const isTarget = pendingTransaction?.targetId === currentPlayer.id;

  const targetPlayer = useMemo(() => {
    if (pendingTransaction) {
      return allPlayers.find(p => p.id === (isInitiator ? pendingTransaction.targetId : pendingTransaction.initiatorId));
    }
    return allPlayers.find(p => p.id === selectedPlayerId);
  }, [pendingTransaction, isInitiator, allPlayers, selectedPlayerId]);

  const hasOffer = (offering.tradeGoods || 0) > 0 ||
    (offering.commodities || 0) > 0 ||
    (offering.promissoryNotes?.length || 0) > 0 ||
    (offering.actionCards?.length || 0) > 0;

  const hasRequest = (requesting.tradeGoods || 0) > 0 ||
    (requesting.commodities || 0) > 0 ||
    (requesting.promissoryNotes?.length || 0) > 0 ||
    (requesting.actionCards?.length || 0) > 0;

  const canPropose = selectedPlayerId && (hasOffer || hasRequest);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {isViewingPending ? 'Pending Transaction' : 'Propose Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            &times;
          </button>
        </div>

        <div className="p-4">
          {/* Player selector (only when proposing) */}
          {!isViewingPending && (
            <PlayerSelector
              players={allPlayers}
              currentPlayerId={currentPlayer.id}
              selectedPlayerId={selectedPlayerId}
              onSelect={setSelectedPlayerId}
            />
          )}

          {/* Trade offers */}
          {(selectedPlayerId || isViewingPending) && targetPlayer && (
            <div className="grid grid-cols-2 gap-4">
              {/* Your offer */}
              <div>
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full" style={{ backgroundColor: getColorHex(currentPlayer.color) }} />
                  {isViewingPending
                    ? (isInitiator ? 'Your Offer' : 'They Offer')
                    : 'You Offer'}
                </h3>
                {isViewingPending ? (
                  <OfferDisplay
                    offer={isInitiator ? pendingTransaction!.initiatorOffer : pendingTransaction!.requestedOffer}
                    player={isInitiator ? currentPlayer : targetPlayer}
                  />
                ) : (
                  <OfferBuilder
                    player={currentPlayer}
                    offer={offering}
                    setOffer={setOffering}
                    label="Your Offer"
                    isCurrentPlayer={true}
                  />
                )}
              </div>

              {/* Exchange arrow */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 hidden">
                <span className="text-2xl text-gray-500">⇄</span>
              </div>

              {/* Their offer */}
              <div>
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full" style={{ backgroundColor: getColorHex(targetPlayer.color) }} />
                  {isViewingPending
                    ? (isInitiator ? 'They Offer' : 'You Provide')
                    : 'You Request'}
                </h3>
                {isViewingPending ? (
                  <OfferDisplay
                    offer={isInitiator ? pendingTransaction!.requestedOffer : pendingTransaction!.initiatorOffer}
                    player={isInitiator ? targetPlayer : currentPlayer}
                  />
                ) : (
                  <OfferBuilder
                    player={targetPlayer}
                    offer={requesting}
                    setOffer={setRequesting}
                    label="You Request"
                    isCurrentPlayer={true}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="sticky bottom-0 bg-gray-900 p-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>

          {isViewingPending ? (
            <>
              {isTarget && (
                <button
                  onClick={() => onAccept(pendingTransaction!.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
                >
                  Accept
                </button>
              )}
              <button
                onClick={() => onDecline(pendingTransaction!.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
              >
                {isInitiator ? 'Cancel' : 'Decline'}
              </button>
            </>
          ) : (
            <button
              onClick={() => selectedPlayerId && onPropose(selectedPlayerId, offering, requesting)}
              disabled={!canPropose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Propose Trade
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Display-only offer component (for viewing pending transactions)
function OfferDisplay({ offer, player }: { offer: TransactionOffer; player: PlayerState }) {
  const isEmpty = !(offer.tradeGoods || offer.commodities || offer.promissoryNotes?.length || offer.actionCards?.length);

  if (isEmpty) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-gray-500 text-center">
        Nothing offered
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-2">
      {offer.tradeGoods && offer.tradeGoods > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">{offer.tradeGoods}</span>
          <span className="text-gray-400">Trade Goods</span>
        </div>
      )}
      {offer.commodities && offer.commodities > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-blue-400">{offer.commodities}</span>
          <span className="text-gray-400">Commodities</span>
        </div>
      )}
      {offer.promissoryNotes?.map(noteId => {
        const note = getPromissoryNoteById(noteId);
        return (
          <div key={noteId} className="flex items-center gap-2">
            <span className="text-purple-400">{note?.name || noteId}</span>
          </div>
        );
      })}
      {offer.actionCards?.map(cardId => (
        <div key={cardId} className="flex items-center gap-2">
          <span className="text-purple-400">{cardId.replace(/_/g, ' ')}</span>
        </div>
      ))}
    </div>
  );
}

function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    red: '#dc2626',
    blue: '#2563eb',
    green: '#16a34a',
    yellow: '#eab308',
    purple: '#9333ea',
    orange: '#ea580c',
    pink: '#ec4899',
    black: '#1f2937',
  };
  return colors[color] || '#6b7280';
}
