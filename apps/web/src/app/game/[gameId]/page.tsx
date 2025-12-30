'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useGameStore } from '@/stores/game-store';
import { useLobbyStore } from '@/stores/lobby-store';
import { GameBoard } from '@/components/game-board';
import dynamic from 'next/dynamic';
import { StrategyPhasePanel, PlayerDashboard, ActionPhasePanel, TurnIndicator, StatusPhasePanel, CombatPanel, AgendaPhasePanel, InvasionPanel } from '@/components/game';
import type { UnitMoveSelection } from '@/components/game';

// Dynamically import 3D board to avoid SSR issues with Three.js
const GameBoard3D = dynamic(
  () => import('@/components/game-board-3d').then(mod => mod.GameBoard3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading 3D board...</div>
      </div>
    ),
  }
);
import type {
  PickStrategyCardAction,
  PassAction,
  StrategicAction,
  TacticalAction,
  MoveUnitsAction,
  SkipMovementAction,
  ProduceUnitsAction,
  SkipProductionAction,
  ScoreObjectiveAction,
  SkipScoringAction,
  RedistributeTokensAction,
  SpentResources,
  MapTile,
  HexCoord,
  UnitType,
  HitAssignment,
  AssignHitsAction,
  AnnounceRetreatAction,
  RevealAgendaAction,
  CastVoteAction,
  SpeakerTiebreakAction,
  SelectInvasionTargetsAction,
  CommitGroundForcesAction,
  RollBombardmentAction,
  SkipBombardmentAction,
  AssignBombardmentHitsAction,
  AssignSpaceCannonHitsAction,
  SkipInvasionAction,
} from '@ti4/shared';

type TacticalUIState = 'idle' | 'selecting_system';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { isConnected: socketConnected, isLoading: socketLoading } = useSocket();
  const {
    gameId,
    gameState,
    currentPlayerId,
    pendingDiceRolls,
    isLoading,
    isConnected,
    joinGame,
    leaveGame,
    sendAction,
    setCurrentPlayerId,
  } = useGameStore();

  const urlGameId = params.gameId as string;
  const currentUserId = session?.user?.id;

  // 3D mode toggle (via URL param ?3d=true)
  const [use3D, setUse3D] = useState(() => searchParams.get('3d') === 'true');

  // UI state for tactical action flow
  const [tacticalUIState, setTacticalUIState] = useState<TacticalUIState>('idle');
  const [highlightedTiles, setHighlightedTiles] = useState<HexCoord[]>([]);

  // Join game when connected
  useEffect(() => {
    if (socketConnected && !gameId && urlGameId) {
      joinGame(urlGameId);
    }
  }, [socketConnected, gameId, urlGameId, joinGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveGame();
    };
  }, [leaveGame]);

  // Reset tactical UI state when sub-phase changes
  useEffect(() => {
    if (gameState?.subPhase !== 'awaiting_action') {
      setTacticalUIState('idle');
      setHighlightedTiles([]);
    }
  }, [gameState?.subPhase]);

  // Get valid tiles for activation (have tactics token, not already activated)
  const getValidActivationTiles = useCallback((): HexCoord[] => {
    if (!gameState || !currentPlayerId) return [];

    return gameState.map.tiles
      .filter(tile => {
        // Cannot activate a system that already has your command token
        return !tile.commandTokens.includes(currentPlayerId);
      })
      .map(tile => tile.position);
  }, [gameState, currentPlayerId]);

  if (socketLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">
            {socketLoading ? 'Connecting to server...' : 'Loading game...'}
          </div>
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  // Errors are now handled via toast notifications

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Waiting for game state...</div>
      </div>
    );
  }

  // Find current player using the playerId from the store
  const currentPlayer = currentPlayerId
    ? gameState.players.find((p) => p.id === currentPlayerId) ?? null
    : null;

  // Check if it's the current player's turn
  const isMyTurn = currentPlayerId === gameState.activePlayerId;

  // Handle strategy card pick
  const handlePickCard = (cardNumber: number) => {
    sendAction({
      type: 'pick_strategy_card',
      cardNumber,
    } as Omit<PickStrategyCardAction, 'playerId' | 'timestamp'>);
  };

  // Handle tactical action - enter system selection mode
  const handleTacticalAction = () => {
    if (!currentPlayer || currentPlayer.commandTokens.tactics < 1) return;

    setTacticalUIState('selecting_system');
    setHighlightedTiles(getValidActivationTiles());
  };

  // Handle tile click - for system activation during tactical action
  const handleTileClick = (tile: MapTile) => {
    if (tacticalUIState === 'selecting_system' && currentPlayerId) {
      // Check if this tile can be activated
      if (!tile.commandTokens.includes(currentPlayerId)) {
        // Send tactical action
        sendAction({
          type: 'tactical_action',
          systemPosition: tile.position,
        } as Omit<TacticalAction, 'playerId' | 'timestamp'>);

        // Reset UI state
        setTacticalUIState('idle');
        setHighlightedTiles([]);
      }
    }
  };

  // Handle cancel system selection
  const handleCancelSelection = () => {
    setTacticalUIState('idle');
    setHighlightedTiles([]);
  };

  // Handle strategic action
  const handleStrategicAction = () => {
    if (!currentPlayer?.strategyCard) return;
    sendAction({
      type: 'strategic_action',
      cardNumber: currentPlayer.strategyCard,
    } as Omit<StrategicAction, 'playerId' | 'timestamp'>);
  };

  // Handle pass
  const handlePass = () => {
    sendAction({
      type: 'pass',
    } as Omit<PassAction, 'playerId' | 'timestamp'>);
  };

  // Handle move units
  const handleMoveUnits = (moves: UnitMoveSelection[]) => {
    sendAction({
      type: 'move_units',
      moves: moves.map(m => ({
        unitId: m.unitId,
        from: m.from,
        to: m.to,
        carrier: m.carrier,
      })),
    } as Omit<MoveUnitsAction, 'playerId' | 'timestamp'>);
  };

  // Handle skip movement
  const handleSkipMovement = () => {
    sendAction({
      type: 'skip_movement',
    } as Omit<SkipMovementAction, 'playerId' | 'timestamp'>);
  };

  // Handle produce units
  const handleProduceUnits = (units: { type: UnitType; count: number }[]) => {
    if (!gameState.activatedSystem) return;

    sendAction({
      type: 'produce_units',
      systemPosition: gameState.activatedSystem,
      units,
    } as Omit<ProduceUnitsAction, 'playerId' | 'timestamp'>);
  };

  // Handle skip production
  const handleSkipProduction = () => {
    sendAction({
      type: 'skip_production',
    } as Omit<SkipProductionAction, 'playerId' | 'timestamp'>);
  };

  // Handle score objective
  const handleScoreObjective = (objectiveId: string, objectiveType: 'public' | 'secret', spentResources?: SpentResources) => {
    sendAction({
      type: 'score_objective',
      objectiveId,
      objectiveType,
      spentResources,
    } as Omit<ScoreObjectiveAction, 'playerId' | 'timestamp'>);
  };

  // Handle skip scoring
  const handleSkipScoring = (skipType: 'public' | 'secret' | 'both') => {
    sendAction({
      type: 'skip_scoring',
      skipType,
    } as Omit<SkipScoringAction, 'playerId' | 'timestamp'>);
  };

  // Handle redistribute tokens
  const handleRedistributeTokens = (distribution: { tactics: number; fleet: number; strategy: number }) => {
    sendAction({
      type: 'redistribute_tokens',
      distribution,
    } as Omit<RedistributeTokensAction, 'playerId' | 'timestamp'>);
  };

  // Handle assign hits in combat
  const handleAssignHits = (assignments: HitAssignment[]) => {
    sendAction({
      type: 'assign_hits',
      assignments,
    } as Omit<AssignHitsAction, 'playerId' | 'timestamp'>);
  };

  // Handle retreat announcement
  const handleAnnounceRetreat = (retreating: boolean, retreatSystem?: HexCoord) => {
    sendAction({
      type: 'announce_retreat',
      retreating,
      retreatSystem,
    } as Omit<AnnounceRetreatAction, 'playerId' | 'timestamp'>);
  };

  // Handle advancing combat state
  const handleAdvanceCombat = () => {
    sendAction({
      type: 'advance_combat',
    } as any); // TODO: Add proper type
  };

  // Handle reveal agenda
  const handleRevealAgenda = () => {
    sendAction({
      type: 'reveal_agenda',
    } as Omit<RevealAgendaAction, 'playerId' | 'timestamp'>);
  };

  // Handle cast vote
  const handleCastVote = (outcome: string, exhaustedPlanets: string[], abstain?: boolean) => {
    sendAction({
      type: 'cast_vote',
      outcome,
      exhaustedPlanets,
      abstain,
    } as Omit<CastVoteAction, 'playerId' | 'timestamp'>);
  };

  // Handle speaker tiebreak
  const handleSpeakerTiebreak = (chosenOutcome: string) => {
    sendAction({
      type: 'speaker_tiebreak',
      chosenOutcome,
    } as Omit<SpeakerTiebreakAction, 'playerId' | 'timestamp'>);
  };

  // Handle select invasion targets
  const handleSelectInvasionTargets = (targetPlanets: string[]) => {
    sendAction({
      type: 'select_invasion_targets',
      targetPlanets,
    } as Omit<SelectInvasionTargetsAction, 'playerId' | 'timestamp'>);
  };

  // Handle commit ground forces
  const handleCommitGroundForces = (assignments: { unitId: string; planetId: string }[]) => {
    sendAction({
      type: 'commit_ground_forces',
      assignments,
    } as Omit<CommitGroundForcesAction, 'playerId' | 'timestamp'>);
  };

  // Handle roll bombardment
  const handleRollBombardment = (planetId: string) => {
    sendAction({
      type: 'roll_bombardment',
      planetId,
    } as Omit<RollBombardmentAction, 'playerId' | 'timestamp'>);
  };

  // Handle skip bombardment
  const handleSkipBombardment = () => {
    sendAction({
      type: 'skip_bombardment',
    } as Omit<SkipBombardmentAction, 'playerId' | 'timestamp'>);
  };

  // Handle assign bombardment hits
  const handleAssignBombardmentHits = (assignments: HitAssignment[]) => {
    sendAction({
      type: 'assign_bombardment_hits',
      assignments,
    } as Omit<AssignBombardmentHitsAction, 'playerId' | 'timestamp'>);
  };

  // Handle assign space cannon hits
  const handleAssignSpaceCannonHits = (assignments: HitAssignment[]) => {
    sendAction({
      type: 'assign_space_cannon_hits',
      assignments,
    } as Omit<AssignSpaceCannonHitsAction, 'playerId' | 'timestamp'>);
  };

  // Handle skip invasion
  const handleSkipInvasion = () => {
    sendAction({
      type: 'skip_invasion',
    } as Omit<SkipInvasionAction, 'playerId' | 'timestamp'>);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-gray-800/90 backdrop-blur border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white">TI4</h1>
            <TurnIndicator gameState={gameState} currentPlayerId={currentPlayerId} />
          </div>

          <div className="flex items-center gap-4">
            {/* 2D/3D Toggle */}
            <button
              onClick={() => setUse3D(!use3D)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                use3D
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {use3D ? '3D' : '2D'}
            </button>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            {/* Leave Game */}
            <button
              onClick={() => {
                leaveGame();
                useLobbyStore.getState().reset(); // Clear lobby state to prevent redirect back
                router.push('/lobby');
              }}
              className="px-3 py-1 text-sm bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout - use fixed positioning for reliable centering */}
      <div className="fixed inset-0 top-12 bottom-16 flex">
        {/* Left Sidebar - Player Dashboard */}
        <aside className="w-72 bg-gray-900 border-r border-gray-700 overflow-y-auto p-4 flex-shrink-0">
          {currentPlayer && (
            <PlayerDashboard
              player={currentPlayer}
              isActivePlayer={currentPlayer.id === gameState.activePlayerId}
            />
          )}
        </aside>

        {/* Game Board - fills remaining space */}
        <main className="flex-1 overflow-hidden relative">
          {use3D ? (
            <GameBoard3D
              gameState={gameState}
              onTileClick={handleTileClick}
              highlightedTiles={highlightedTiles}
            />
          ) : (
            <GameBoard
              gameState={gameState}
              onTileClick={handleTileClick}
              highlightedTiles={highlightedTiles}
            />
          )}

          {/* System Selection Overlay */}
          {tacticalUIState === 'selecting_system' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-green-800/90 backdrop-blur rounded-lg px-6 py-3 shadow-xl border border-green-500/50">
                <div className="text-center">
                  <p className="text-green-100 font-medium">Select a system to activate</p>
                  <p className="text-green-300/70 text-sm mt-1">Click a system on the map</p>
                </div>
                <button
                  onClick={handleCancelSelection}
                  className="mt-3 w-full px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Strategy Phase Panel */}
      {gameState.phase === 'strategy' && (
        <StrategyPhasePanel
          gameState={gameState}
          currentPlayerId={currentPlayerId}
          onPickCard={handlePickCard}
        />
      )}

      {/* Action Phase Panel */}
      {gameState.phase === 'action' && tacticalUIState === 'idle' && (
        <ActionPhasePanel
          gameState={gameState}
          currentPlayer={currentPlayer}
          isMyTurn={isMyTurn}
          onTacticalAction={handleTacticalAction}
          onStrategicAction={handleStrategicAction}
          onPass={handlePass}
          onMoveUnits={handleMoveUnits}
          onSkipMovement={handleSkipMovement}
          onProduceUnits={handleProduceUnits}
          onSkipProduction={handleSkipProduction}
        />
      )}

      {/* Status Phase Panel */}
      {gameState.phase === 'status' && (
        <StatusPhasePanel
          gameState={gameState}
          currentPlayer={currentPlayer}
          isMyTurn={isMyTurn}
          onScoreObjective={handleScoreObjective}
          onSkipScoring={handleSkipScoring}
          onRedistributeTokens={handleRedistributeTokens}
        />
      )}

      {/* Agenda Phase Panel */}
      {gameState.phase === 'agenda' && (
        <AgendaPhasePanel
          gameState={gameState}
          currentPlayer={currentPlayer}
          isMyTurn={isMyTurn}
          onRevealAgenda={handleRevealAgenda}
          onCastVote={handleCastVote}
          onSpeakerTiebreak={handleSpeakerTiebreak}
        />
      )}

      {/* Combat Panel - renders as overlay when combat is active */}
      {gameState.activeCombat && (
        <CombatPanel
          gameState={gameState}
          currentPlayer={currentPlayer}
          currentPlayerId={currentPlayerId}
          onAssignHits={handleAssignHits}
          onAnnounceRetreat={handleAnnounceRetreat}
          onAdvanceCombat={handleAdvanceCombat}
          diceRolls={pendingDiceRolls ?? undefined}
        />
      )}

      {/* Invasion Panel - renders during tactical invasion sub-phase */}
      {gameState.subPhase === 'tactical_invasion' && gameState.invasionPhase && (
        <InvasionPanel
          gameState={gameState}
          currentPlayer={currentPlayer}
          currentPlayerId={currentPlayerId}
          onSelectTargets={handleSelectInvasionTargets}
          onCommitGroundForces={handleCommitGroundForces}
          onRollBombardment={handleRollBombardment}
          onSkipBombardment={handleSkipBombardment}
          onAssignBombardmentHits={handleAssignBombardmentHits}
          onAssignSpaceCannonHits={handleAssignSpaceCannonHits}
          onSkipInvasion={handleSkipInvasion}
          onAdvanceCombat={handleAdvanceCombat}
          onAssignGroundCombatHits={handleAssignHits}
          diceRolls={pendingDiceRolls ?? undefined}
        />
      )}

      {/* Player Info Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 bg-gray-800/90 backdrop-blur border-t border-gray-700">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Players */}
          <div className="flex items-center gap-3">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-2 px-3 py-1 rounded ${
                  player.id === gameState.activePlayerId
                    ? 'bg-yellow-600/20 border border-yellow-500'
                    : 'bg-gray-700/50'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full`}
                  style={{ backgroundColor: getColorHex(player.color) }}
                />
                <span className="text-sm font-medium">{player.name}</span>
                <span className="text-xs text-gray-400">{player.score} VP</span>
              </div>
            ))}
          </div>

          {/* Current Player Resources */}
          {currentPlayer && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-gray-400">TG:</span>
                <span className="text-yellow-400 font-mono">
                  {currentPlayer.tradeGoods}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Comm:</span>
                <span className="text-blue-400 font-mono">
                  {currentPlayer.commodities}/{currentPlayer.maxCommodities}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Tokens:</span>
                <span className="text-green-400 font-mono">
                  {currentPlayer.commandTokens.tactics}/
                  {currentPlayer.commandTokens.fleet}/
                  {currentPlayer.commandTokens.strategy}
                </span>
              </div>
            </div>
          )}
        </div>
      </footer>
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
