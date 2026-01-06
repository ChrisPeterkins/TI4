'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useLobbyStore } from '@/stores/lobby-store';
import { useTheme } from '@/contexts/ThemeContext';
import { factions, systems } from '@ti4/game-data';
import type { MiltyDraftState, MiltySlice, LobbyPlayer, DraftPlayerInfo } from '@ti4/shared';
import { getFactionIconUrl } from '@/lib/assets';
import ThemedBackground from '@/components/ui/ThemedBackground';
import ThemedPanel, { ThemedCard, ThemedBadge } from '@/components/ui/ThemedPanel';

interface MiltyDraftProps {
  draftState: MiltyDraftState;
  players: LobbyPlayer[];
  currentUserId: string;
  playerMapping?: Record<string, DraftPlayerInfo> | null;
}

function getTileImagePath(systemId: number): string {
  return `/images/tiles/ST_${systemId}.webp`;
}

const SLICE_TILE_POSITIONS = [
  { x: 0, y: 0 },
  { x: 20.5, y: 36 },
  { x: -20.5, y: -36 },
  { x: -20.5, y: 36 },
  { x: 20.5, y: -36 },
];

function SlicePreview({
  slice,
  size = 'normal',
  showStats = true,
}: {
  slice: MiltySlice;
  size?: 'small' | 'normal' | 'large';
  showStats?: boolean;
}) {
  const { theme } = useTheme();
  const tileSize = size === 'small' ? 40 : size === 'large' ? 70 : 55;
  const containerWidth = size === 'small' ? 90 : size === 'large' ? 160 : 120;
  const containerHeight = size === 'small' ? 110 : size === 'large' ? 180 : 140;
  const scale = tileSize / 55;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{ width: containerWidth, height: containerHeight }}
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
              {size !== 'small' && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/70 rounded">
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

      {showStats && (
        <div className="flex items-center gap-3 mt-2 text-sm">
          <span className="text-emerald-400 font-medium">{slice.totalResources}R</span>
          <span className="text-blue-400 font-medium">{slice.totalInfluence}I</span>
          <span className={`text-${theme.colors.warning} font-medium`}>{slice.optimalValue.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}

export default function MiltyDraft({ draftState, players, currentUserId, playerMapping }: MiltyDraftProps) {
  const { theme } = useTheme();
  const { makeDraftPick, error } = useLobbyStore();

  const currentPlayerDraftId = useMemo(() => {
    if (!playerMapping) return null;
    for (const [draftId, info] of Object.entries(playerMapping)) {
      if (info.id === currentUserId) {
        return draftId;
      }
    }
    return null;
  }, [playerMapping, currentUserId]);

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

  const pickerNeeds = useMemo(() => {
    if (!currentPicker) return { needsFaction: false, needsSlice: false, needsSpeaker: false };

    const playerPicks = draftState.picks.filter(p => p.playerId === currentPicker);
    return {
      needsFaction: !playerPicks.some(p => p.pickType === 'faction'),
      needsSlice: !playerPicks.some(p => p.pickType === 'slice'),
      needsSpeaker: !playerPicks.some(p => p.pickType === 'speaker'),
    };
  }, [currentPicker, draftState.picks]);

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

  const getPlayerPicks = (playerId: string) => {
    return draftState.picks.filter(p => p.playerId === playerId);
  };

  const handlePick = async (pickType: 'faction' | 'slice' | 'speaker', value: string | number) => {
    try {
      await makeDraftPick(pickType, value);
    } catch (err) {
      console.error('Failed to make pick:', err);
    }
  };

  const getPlayerName = (draftPlayerId: string) => {
    if (playerMapping && playerMapping[draftPlayerId]) {
      return playerMapping[draftPlayerId].name;
    }
    const player = players.find(p => p.id === draftPlayerId);
    return player?.name || 'Unknown';
  };

  const getFactionName = (factionId: string) => {
    return factions[factionId]?.name || factionId;
  };

  return (
    <ThemedBackground>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className={`text-4xl font-bold mb-2 bg-gradient-to-r from-white via-${theme.colors.accent} to-white bg-clip-text text-transparent`}>
              Milty Draft
            </h1>
            <p className={theme.colors.textMuted}>
              {draftState.phase === 'complete'
                ? 'Draft Complete!'
                : 'Pick a faction, map slice, or speaker position'}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <ThemedPanel variant="error" glow className="mb-6 p-4 text-center">
              {error}
            </ThemedPanel>
          )}

          {/* Current Turn Indicator */}
          {draftState.phase === 'drafting' && currentPicker && (
            <ThemedPanel
              variant={isMyTurn ? 'success' : 'default'}
              glow={isMyTurn}
              className="mb-6 p-4 text-center"
            >
              <span className="text-lg">
                {isMyTurn ? (
                  <span className="font-bold text-emerald-400 animate-pulse">Your turn to pick!</span>
                ) : (
                  <>Waiting for <span className={`font-bold text-${theme.colors.warning}`}>{getPlayerName(currentPicker)}</span> to pick</>
                )}
              </span>
              {isMyTurn && (
                <div className={`mt-2 text-sm ${theme.colors.textMuted}`}>
                  You can pick:
                  {pickerNeeds.needsFaction && <ThemedBadge variant="info" className="ml-2">Faction</ThemedBadge>}
                  {pickerNeeds.needsSlice && <ThemedBadge variant="info" className="ml-2">Slice</ThemedBadge>}
                  {pickerNeeds.needsSpeaker && <ThemedBadge variant="warning" className="ml-2">Speaker</ThemedBadge>}
                </div>
              )}
            </ThemedPanel>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Sidebar - Draft Order */}
            <div className="xl:col-span-1 order-2 xl:order-1">
              <ThemedCard title="Draft Order">
                <div className="space-y-3">
                  {draftState.draftOrder.map((playerId, index) => {
                    const playerPicks = getPlayerPicks(playerId);
                    const factionPick = playerPicks.find(p => p.pickType === 'faction');
                    const slicePick = playerPicks.find(p => p.pickType === 'slice');
                    const speakerPick = playerPicks.find(p => p.pickType === 'speaker');
                    const isCurrentPicker = currentPicker === playerId;

                    return (
                      <ThemedPanel
                        key={playerId}
                        variant={isCurrentPicker ? 'warning' : 'default'}
                        glow={isCurrentPicker}
                        className="p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">
                            {index + 1}. {getPlayerName(playerId)}
                            {playerId === currentPlayerDraftId && (
                              <ThemedBadge variant="info" className="ml-2">You</ThemedBadge>
                            )}
                          </span>
                          {isCurrentPicker && (
                            <ThemedBadge variant="warning" pulse>Picking</ThemedBadge>
                          )}
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={theme.colors.textMuted + ' w-14'}>Faction:</span>
                            {factionPick ? (
                              <span className="text-blue-400 truncate">{getFactionName(factionPick.value as string)}</span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={theme.colors.textMuted + ' w-14'}>Slice:</span>
                            {slicePick ? (
                              <span className="text-purple-400">Slice {(slicePick.value as number) + 1}</span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={theme.colors.textMuted + ' w-14'}>Speaker:</span>
                            {speakerPick ? (
                              <span className="text-amber-400">#{(speakerPick.value as number) + 1}</span>
                            ) : (
                              <span className="text-gray-600">-</span>
                            )}
                          </div>
                        </div>
                      </ThemedPanel>
                    );
                  })}
                </div>
              </ThemedCard>

              {/* Speaker Order */}
              <ThemedCard title="Speaker Order" className="mt-6">
                <div className="space-y-2">
                  {Array.from({ length: draftState.draftOrder.length }, (_, i) => i).map((position) => {
                    const isPicked = !available.speakerPositions.includes(position);
                    const canPick = isMyTurn && pickerNeeds.needsSpeaker && !isPicked;
                    const pickedBy = draftState.speakerOrder[position];

                    return (
                      <ThemedPanel
                        key={position}
                        variant={canPick ? 'warning' : 'default'}
                        glow={canPick}
                        hover={canPick}
                        onClick={canPick ? () => handlePick('speaker', position) : undefined}
                        className={`p-2 ${isPicked ? 'opacity-50' : ''} ${canPick ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">
                            #{position + 1}
                            {position === 0 && <span className="ml-1 text-amber-400 text-xs">(Speaker)</span>}
                          </span>
                          {isPicked && pickedBy && (
                            <span className={`text-xs ${theme.colors.textMuted} truncate ml-2`}>
                              {getPlayerName(pickedBy)}
                            </span>
                          )}
                        </div>
                      </ThemedPanel>
                    );
                  })}
                </div>
              </ThemedCard>
            </div>

            {/* Center - Slices */}
            <div className="xl:col-span-2 order-1 xl:order-2">
              <ThemedCard title="Map Slices">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {draftState.slices.map((slice) => {
                    const isPicked = !available.slices.some(s => s.id === slice.id);
                    const canPick = isMyTurn && pickerNeeds.needsSlice && !isPicked;
                    const pickedByPlayer = draftState.picks.find(p => p.pickType === 'slice' && p.value === slice.id);

                    return (
                      <ThemedPanel
                        key={slice.id}
                        variant={canPick ? 'highlight' : 'default'}
                        glow={canPick}
                        hover={canPick}
                        onClick={canPick ? () => handlePick('slice', slice.id) : undefined}
                        className={`p-3 ${isPicked ? 'opacity-50' : ''} ${canPick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                      >
                        <div className="text-center mb-2">
                          <span className="font-semibold">Slice {slice.id + 1}</span>
                        </div>
                        <SlicePreview slice={slice} size="normal" />
                        {isPicked && pickedByPlayer && (
                          <div className={`mt-2 text-xs text-center ${theme.colors.textMuted}`}>
                            Picked by {getPlayerName(pickedByPlayer.playerId)}
                          </div>
                        )}
                      </ThemedPanel>
                    );
                  })}
                </div>
              </ThemedCard>
            </div>

            {/* Right Sidebar - Factions */}
            <div className="xl:col-span-1 order-3">
              <ThemedCard title="Factions">
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {draftState.factionPool.map((factionId) => {
                    const faction = factions[factionId];
                    const isPicked = !available.factions.includes(factionId);
                    const canPick = isMyTurn && pickerNeeds.needsFaction && !isPicked;

                    return (
                      <ThemedPanel
                        key={factionId}
                        variant={canPick ? 'highlight' : 'default'}
                        glow={canPick}
                        hover={canPick}
                        onClick={canPick ? () => handlePick('faction', factionId) : undefined}
                        className={`p-3 ${isPicked ? 'opacity-50' : ''} ${canPick ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 relative flex-shrink-0">
                            <Image
                              src={getFactionIconUrl(factionId)}
                              alt={faction?.name || factionId}
                              fill
                              className="object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="font-medium text-sm">{faction?.name || factionId}</div>
                        </div>
                        {isPicked && (
                          <div className={`mt-1 text-xs ${theme.colors.textMuted} pl-10`}>
                            Picked by {getPlayerName(
                              draftState.picks.find(p => p.pickType === 'faction' && p.value === factionId)?.playerId || ''
                            )}
                          </div>
                        )}
                      </ThemedPanel>
                    );
                  })}
                </div>
              </ThemedCard>
            </div>
          </div>

          {/* Draft Complete */}
          {draftState.phase === 'complete' && (
            <ThemedPanel variant="success" glow className="mt-8 p-6 text-center">
              <h2 className="text-2xl font-bold text-emerald-400 mb-4">Draft Complete!</h2>
              <p className={theme.colors.textSecondary}>
                All players have made their selections. The game will start shortly.
              </p>
            </ThemedPanel>
          )}
        </div>
      </div>
    </ThemedBackground>
  );
}
