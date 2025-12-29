'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useLobbyStore } from '@/stores/lobby-store';
import { factions, systems } from '@ti4/game-data';
import type { MiltyDraftState, MiltySlice, LobbyPlayer, DraftPlayerInfo } from '@ti4/shared';

interface MiltyDraftProps {
  draftState: MiltyDraftState;
  players: LobbyPlayer[];
  currentUserId: string;
  playerMapping?: Record<string, DraftPlayerInfo> | null;
}

/**
 * Get the tile image path for a system ID
 */
function getTileImagePath(systemId: number): string {
  return `/assets/tiles/ST_${systemId}.webp`;
}

/**
 * Hex tile positions for slice preview
 * Arranged to show how tiles will appear relative to home system
 * Layout (flat-top hex orientation):
 *
 *     [2]   [4]
 *        [0]
 *     [3]   [1]
 *      (home)
 *
 * Position 0 is equidistant (adjacent to Mecatol) at center
 * Positions 1-4 form a diamond around it with tiles touching
 *
 * Hex geometry for touching tiles (width=55):
 * - Horizontal adjacent: 41.25px apart (55 * 0.75)
 * - Diagonal adjacent: ~41.4px (sqrt(20.5² + 36²))
 */
const SLICE_TILE_POSITIONS = [
  { x: 0, y: 0 },         // Position 0: Center (equidistant)
  { x: 20.5, y: 36 },     // Position 1: Lower-right diagonal
  { x: -20.5, y: -36 },   // Position 2: Upper-left diagonal
  { x: -20.5, y: 36 },    // Position 3: Lower-left diagonal
  { x: 20.5, y: -36 },    // Position 4: Upper-right diagonal
];

/**
 * Component to render a slice preview with actual tile images
 */
function SlicePreview({
  slice,
  size = 'normal',
  showStats = true,
}: {
  slice: MiltySlice;
  size?: 'small' | 'normal' | 'large';
  showStats?: boolean;
}) {
  const tileSize = size === 'small' ? 40 : size === 'large' ? 70 : 55;
  // Container sized to fit the diamond arrangement with tiles touching
  const containerWidth = size === 'small' ? 90 : size === 'large' ? 160 : 120;
  const containerHeight = size === 'small' ? 110 : size === 'large' ? 180 : 140;

  // Scale positions based on tile size
  const scale = tileSize / 55;

  return (
    <div className="flex flex-col items-center">
      {/* Hex tile arrangement */}
      <div
        className="relative"
        style={{
          width: containerWidth,
          height: containerHeight,
        }}
      >
        {slice.systems.map((systemId, index) => {
          const system = systems[systemId];
          const pos = SLICE_TILE_POSITIONS[index] || { x: 0, y: 0 };

          return (
            <div
              key={systemId}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(50% + ${pos.x * scale}px)`,
                top: `calc(50% + ${pos.y * scale}px)`,
                width: tileSize,
                height: tileSize,
              }}
              title={system?.planets[0]?.name || `System ${systemId}`}
            >
              <Image
                src={getTileImagePath(systemId)}
                alt={`System ${systemId}`}
                width={tileSize}
                height={tileSize}
                className="object-contain"
                style={{
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                }}
              />
              {/* System info overlay on hover - only for larger sizes */}
              {size !== 'small' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/60 rounded">
                  <div className="text-center text-xs">
                    <div className="text-white font-bold">{systemId}</div>
                    {system?.planets.map(p => (
                      <div key={p.id} className="text-gray-300">
                        {p.resources}R/{p.influence}I
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Slice stats */}
      {showStats && (
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="text-green-400 font-medium">{slice.totalResources}R</span>
          <span className="text-blue-400 font-medium">{slice.totalInfluence}I</span>
          <span className="text-yellow-400 font-medium">{slice.optimalValue.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

export default function MiltyDraft({ draftState, players, currentUserId, playerMapping }: MiltyDraftProps) {
  const { makeDraftPick, error } = useLobbyStore();

  // Find current player's draft ID by looking through the playerMapping
  const currentPlayerDraftId = useMemo(() => {
    if (!playerMapping) return null;
    for (const [draftId, info] of Object.entries(playerMapping)) {
      if (info.id === currentUserId) {
        return draftId;
      }
    }
    return null;
  }, [playerMapping, currentUserId]);

  // Get whose turn it is
  const currentPickerIndex = useMemo(() => {
    const totalPicks = draftState.picks.length;
    const playerCount = draftState.draftOrder.length;
    const totalRequired = playerCount * 3;

    if (totalPicks >= totalRequired) return null;

    const round = Math.floor(totalPicks / playerCount);
    const indexInRound = totalPicks % playerCount;
    const isReverse = round % 2 === 1;

    return isReverse ? playerCount - 1 - indexInRound : indexInRound;
  }, [draftState.picks.length, draftState.draftOrder.length]);

  const currentPicker = currentPickerIndex !== null
    ? draftState.draftOrder[currentPickerIndex]
    : null;

  const isMyTurn = currentPicker === currentPlayerDraftId;

  // Get what current picker still needs
  const pickerNeeds = useMemo(() => {
    if (!currentPicker) return { needsFaction: false, needsSlice: false, needsSpeaker: false };

    const playerPicks = draftState.picks.filter(p => p.playerId === currentPicker);
    return {
      needsFaction: !playerPicks.some(p => p.pickType === 'faction'),
      needsSlice: !playerPicks.some(p => p.pickType === 'slice'),
      needsSpeaker: !playerPicks.some(p => p.pickType === 'speaker'),
    };
  }, [currentPicker, draftState.picks]);

  // Get available options
  const available = useMemo(() => {
    const pickedFactions = new Set(
      draftState.picks.filter(p => p.pickType === 'faction').map(p => p.value as string)
    );
    const pickedSlices = new Set(
      draftState.picks.filter(p => p.pickType === 'slice').map(p => p.value as number)
    );
    const pickedSpeakerPositions = new Set(
      draftState.picks.filter(p => p.pickType === 'speaker').map(p => p.value as number)
    );

    return {
      factions: draftState.factionPool.filter(f => !pickedFactions.has(f)),
      slices: draftState.slices.filter(s => !pickedSlices.has(s.id)),
      speakerPositions: Array.from({ length: draftState.speakerOrder.length }, (_, i) => i)
        .filter(i => !pickedSpeakerPositions.has(i)),
    };
  }, [draftState]);

  // Get player's picks
  const getPlayerPicks = (playerId: string) => {
    return draftState.picks.filter(p => p.playerId === playerId);
  };

  // Handle picking
  const handlePick = async (pickType: 'faction' | 'slice' | 'speaker', value: string | number) => {
    try {
      await makeDraftPick(pickType, value);
    } catch (err) {
      console.error('Failed to make pick:', err);
    }
  };

  // Get player name from draft ID using playerMapping
  const getPlayerName = (draftPlayerId: string) => {
    if (playerMapping && playerMapping[draftPlayerId]) {
      return playerMapping[draftPlayerId].name;
    }
    // Fallback: try to find player in lobby players array (shouldn't normally happen)
    const player = players.find(p => p.id === draftPlayerId);
    return player?.name || 'Unknown';
  };

  // Get faction name
  const getFactionName = (factionId: string) => {
    return factions[factionId]?.name || factionId;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Milty Draft</h1>
          <p className="text-gray-400">
            {draftState.phase === 'complete'
              ? 'Draft Complete!'
              : `Pick a faction, map slice, or speaker position`}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Current Turn Indicator */}
        {draftState.phase === 'drafting' && currentPicker && (
          <div className={`mb-6 p-4 rounded-lg text-center ${
            isMyTurn ? 'bg-green-900/50 border border-green-500' : 'bg-gray-800'
          }`}>
            <span className="text-lg">
              {isMyTurn ? (
                <span className="font-bold text-green-400">Your turn to pick!</span>
              ) : (
                <>Waiting for <span className="font-bold text-yellow-400">{getPlayerName(currentPicker)}</span> to pick</>
              )}
            </span>
            {isMyTurn && (
              <div className="mt-2 text-sm text-gray-400">
                You can pick:
                {pickerNeeds.needsFaction && <span className="text-blue-400 ml-2">Faction</span>}
                {pickerNeeds.needsSlice && <span className="text-purple-400 ml-2">Slice</span>}
                {pickerNeeds.needsSpeaker && <span className="text-yellow-400 ml-2">Speaker Position</span>}
              </div>
            )}
          </div>
        )}

        {/* Main Content - Slices get most space */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Sidebar - Draft Order (narrower) */}
          <div className="xl:col-span-1 order-2 xl:order-1">
            <h2 className="text-xl font-semibold mb-4">Draft Order</h2>
            <div className="space-y-3">
              {draftState.draftOrder.map((playerId, index) => {
                const playerPicks = getPlayerPicks(playerId);
                const factionPick = playerPicks.find(p => p.pickType === 'faction');
                const slicePick = playerPicks.find(p => p.pickType === 'slice');
                const speakerPick = playerPicks.find(p => p.pickType === 'speaker');
                const isCurrentPicker = currentPicker === playerId;

                return (
                  <div
                    key={playerId}
                    className={`p-3 rounded-lg ${
                      isCurrentPicker ? 'bg-yellow-900/30 border border-yellow-500' : 'bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">
                        {index + 1}. {getPlayerName(playerId)}
                        {playerId === currentPlayerDraftId && (
                          <span className="ml-1 text-xs text-blue-400">(You)</span>
                        )}
                      </span>
                      {isCurrentPicker && (
                        <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded">Picking</span>
                      )}
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-14">Faction:</span>
                        {factionPick ? (
                          <span className="text-blue-400 truncate">{getFactionName(factionPick.value as string)}</span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-14">Slice:</span>
                        {slicePick ? (
                          <span className="text-purple-400">Slice {(slicePick.value as number) + 1}</span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-14">Speaker:</span>
                        {speakerPick ? (
                          <span className="text-yellow-400">#{(speakerPick.value as number) + 1}</span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Speaker Order - Compact */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Speaker Order</h2>
              <div className="space-y-2">
                {Array.from({ length: draftState.draftOrder.length }, (_, i) => i).map((position) => {
                  const isPicked = !available.speakerPositions.includes(position);
                  const canPick = isMyTurn && pickerNeeds.needsSpeaker && !isPicked;
                  const pickedBy = draftState.speakerOrder[position];

                  return (
                    <div
                      key={position}
                      className={`p-2 rounded-lg border transition-all ${
                        isPicked
                          ? 'bg-gray-800/50 border-gray-700 opacity-50'
                          : canPick
                          ? 'bg-yellow-900/30 border-yellow-500 cursor-pointer hover:bg-yellow-900/50'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                      onClick={() => canPick && handlePick('speaker', position)}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          #{position + 1}
                          {position === 0 && <span className="ml-1 text-yellow-400 text-xs">(Speaker)</span>}
                        </span>
                        {isPicked && pickedBy && (
                          <span className="text-xs text-gray-400 truncate ml-2">{getPlayerName(pickedBy)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center - Slices (takes up most space) */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <h2 className="text-xl font-semibold mb-4">Map Slices</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {draftState.slices.map((slice) => {
                const isPicked = !available.slices.some(s => s.id === slice.id);
                const canPick = isMyTurn && pickerNeeds.needsSlice && !isPicked;
                const pickedByPlayer = draftState.picks.find(p => p.pickType === 'slice' && p.value === slice.id);

                return (
                  <div
                    key={slice.id}
                    className={`p-3 rounded-lg border transition-all ${
                      isPicked
                        ? 'bg-gray-800/50 border-gray-700 opacity-60'
                        : canPick
                        ? 'bg-purple-900/30 border-purple-500 cursor-pointer hover:bg-purple-900/50 hover:scale-105'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                    onClick={() => canPick && handlePick('slice', slice.id)}
                  >
                    <div className="text-center mb-2">
                      <span className="font-semibold">Slice {slice.id + 1}</span>
                    </div>
                    <SlicePreview slice={slice} size="normal" />
                    {isPicked && pickedByPlayer && (
                      <div className="mt-2 text-xs text-center text-gray-400">
                        Picked by {getPlayerName(pickedByPlayer.playerId)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar - Factions */}
          <div className="xl:col-span-1 order-3">
            <h2 className="text-xl font-semibold mb-4">Factions</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {draftState.factionPool.map((factionId) => {
                const faction = factions[factionId];
                const isPicked = !available.factions.includes(factionId);
                const canPick = isMyTurn && pickerNeeds.needsFaction && !isPicked;

                return (
                  <div
                    key={factionId}
                    className={`p-3 rounded-lg border transition-all ${
                      isPicked
                        ? 'bg-gray-800/50 border-gray-700 opacity-50'
                        : canPick
                        ? 'bg-blue-900/30 border-blue-500 cursor-pointer hover:bg-blue-900/50'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                    onClick={() => canPick && handlePick('faction', factionId)}
                  >
                    <div className="font-medium text-sm">{faction?.name || factionId}</div>
                    {isPicked && (
                      <div className="mt-1 text-xs text-gray-500">
                        Picked by {getPlayerName(
                          draftState.picks.find(p => p.pickType === 'faction' && p.value === factionId)?.playerId || ''
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Draft Complete */}
        {draftState.phase === 'complete' && (
          <div className="mt-8 p-6 bg-green-900/30 border border-green-500 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Draft Complete!</h2>
            <p className="text-gray-300 mb-4">All players have made their selections. The game will start shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
