'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useGameStore } from '@/stores/game-store';
import { confirm } from '@/stores/confirm-store';
import { KeyboardHints, getHintsForPhase } from '@/components/ui/KeyboardHints';
import { ShortcutsHelpModal } from '@/components/ui/ShortcutsHelpModal';
import { useLobbyStore } from '@/stores/lobby-store';
import dynamic from 'next/dynamic';
import { StrategyPhasePanel, PlayerDashboard, ActionPhasePanel, TurnIndicator, StatusPhasePanel, CombatPanel, AgendaPhasePanel, InvasionPanel, StrategyActionPanel, TransactionModal, CanvasOverlayPanel } from '@/components/game';
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
  StrategicPrimaryAction,
  StrategicSecondaryAction,
  StrategicPrimaryChoices,
  StrategicSecondaryChoices,
  PurgeRelicFragmentsAction,
  UseRelicAction,
  UseAgentAction,
  PurgeHeroAction,
} from '@ti4/shared';

type TacticalUIState = 'idle' | 'selecting_system';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
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
    // Transaction state
    showTransactionModal,
    toggleTransactionModal,
    proposeTransaction,
    acceptTransaction,
    declineTransaction,
    // Chat state
    chatMessages,
    sendChatMessage,
  } = useGameStore();

  const urlGameId = params.gameId as string;
  const currentUserId = session?.user?.id;

  // UI state for tactical action flow
  const [tacticalUIState, setTacticalUIState] = useState<TacticalUIState>('idle');
  const [highlightedTiles, setHighlightedTiles] = useState<HexCoord[]>([]);

  // 3D UI mode: when true, player info is shown in 3D stations instead of sidebar
  const [use3DPlayerStations, setUse3DPlayerStations] = useState(() => {
    // Check localStorage for saved preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ti4-use-3d-stations');
      return saved !== 'false'; // Default to true
    }
    return true;
  });

  // Keyboard shortcuts help modal
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Save preference to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ti4-use-3d-stations', String(use3DPlayerStations));
    }
  }, [use3DPlayerStations]);

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

  // Get tiles that can be activated for tactical action (for 3D UI highlighting)
  const activatableTiles = useMemo((): HexCoord[] => {
    if (!gameState || !currentPlayerId) return [];

    // Look up player inside useMemo since currentPlayer is defined after early returns
    const player = gameState.players.find((p) => p.id === currentPlayerId);
    if (!player) return [];

    // Only show activatable tiles during action phase, awaiting_action, and when it's my turn
    const isMyTurn = currentPlayerId === gameState.activePlayerId;
    if (gameState.phase !== 'action' || gameState.subPhase !== 'awaiting_action' || !isMyTurn) {
      return [];
    }

    // Need at least 1 tactics token
    if (player.commandTokens.tactics < 1) {
      return [];
    }

    return getValidActivationTiles();
  }, [gameState, currentPlayerId, getValidActivationTiles]);

  // Handle 3D tile activation (direct tactical action, no selection mode needed)
  const handleTileActivate = useCallback((tile: MapTile) => {
    if (!currentPlayerId) return;

    // Check if this tile can be activated
    if (!tile.commandTokens.includes(currentPlayerId)) {
      // Send tactical action directly
      sendAction({
        type: 'tactical_action',
        systemPosition: tile.position,
      } as Omit<TacticalAction, 'playerId' | 'timestamp'>);
    }
  }, [currentPlayerId, sendAction]);

  // Handle 3D strategy card play (strategic action)
  const handleStrategyCardPlay3D = useCallback((playerId: string, cardNumber: number) => {
    if (playerId !== currentPlayerId) return;

    sendAction({
      type: 'strategic_action',
      cardNumber,
    } as Omit<StrategicAction, 'playerId' | 'timestamp'>);
  }, [currentPlayerId, sendAction]);

  // Handle 3D pass button click
  const handlePass3D = useCallback((playerId: string) => {
    if (playerId !== currentPlayerId) return;

    sendAction({
      type: 'pass',
    } as Omit<PassAction, 'playerId' | 'timestamp'>);
  }, [currentPlayerId, sendAction]);

  // Handle relic fragment purge (to gain a relic)
  const handleRelicFragmentPurge = useCallback((playerId: string, fragmentType: string) => {
    if (playerId !== currentPlayerId) return;
    sendAction({
      type: 'purge_relic_fragments',
      fragmentType: fragmentType as 'cultural' | 'industrial' | 'hazardous' | 'unknown',
      count: 3,
    } as Omit<PurgeRelicFragmentsAction, 'playerId' | 'timestamp'>);
  }, [currentPlayerId, sendAction]);

  // Handle relic activation/use
  const handleRelicClick = useCallback((playerId: string, relicId: string) => {
    if (playerId !== currentPlayerId) return;
    sendAction({
      type: 'use_relic',
      relicId,
    } as Omit<UseRelicAction, 'playerId' | 'timestamp'>);
  }, [currentPlayerId, sendAction]);

  const handleLeaderClick = useCallback((playerId: string, leaderId: string, leaderType: 'agent' | 'commander' | 'hero') => {
    if (playerId !== currentPlayerId) return;

    // Find the player's leader state
    const player = gameState?.players.find(p => p.id === playerId);
    if (!player?.leaders) return;

    if (leaderType === 'agent') {
      // Check if agent is ready (not exhausted)
      if (!player.leaders.agent.exhausted) {
        sendAction({
          type: 'use_agent',
          // Additional targets can be added based on the agent's requirements
        } as Omit<UseAgentAction, 'playerId' | 'timestamp'>);
      }
    } else if (leaderType === 'hero') {
      // Check if hero is unlocked and not purged
      if (player.leaders.hero.unlocked && !player.leaders.hero.purged) {
        sendAction({
          type: 'purge_hero',
          // Additional targets can be added based on the hero's requirements
        } as Omit<PurgeHeroAction, 'playerId' | 'timestamp'>);
      }
    }
    // Commanders are passive abilities - clicking just opens the card for inspection
  }, [currentPlayerId, gameState?.players, sendAction]);

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

  // Handle strategic primary ability
  const handleStrategicPrimary = (choices: StrategicPrimaryChoices) => {
    if (!gameState.strategicActionState) return;
    sendAction({
      type: 'strategic_primary',
      cardNumber: gameState.strategicActionState.cardNumber,
      choices,
    } as Omit<StrategicPrimaryAction, 'playerId' | 'timestamp'>);
  };

  // Handle strategic secondary ability
  const handleStrategicSecondary = (choices: StrategicSecondaryChoices, declined: boolean) => {
    if (!gameState.strategicActionState) return;
    sendAction({
      type: 'strategic_secondary',
      cardNumber: gameState.strategicActionState.cardNumber,
      choices,
      declined,
    } as Omit<StrategicSecondaryAction, 'playerId' | 'timestamp'>);
  };

  // Handle pass with confirmation
  const handlePassWithConfirm = useCallback(async () => {
    if (!isMyTurn || gameState.phase !== 'action') return;

    const confirmed = await confirm({
      title: 'Pass Turn',
      message: "Are you sure you want to pass? You won't be able to take actions until next round.",
      confirmText: 'Pass',
      cancelText: 'Cancel',
      variant: 'warning',
      dontAskAgainKey: 'pass_turn',
    });

    if (confirmed) {
      handlePass();
    }
  }, [isMyTurn, gameState.phase, handlePass]);

  // Keyboard shortcuts
  const keyboardHandlers = useMemo(() => ({
    '?': () => setShowShortcutsHelp(true),
    'Escape': () => {
      if (showShortcutsHelp) {
        setShowShortcutsHelp(false);
      } else if (tacticalUIState === 'selecting_system') {
        handleCancelSelection();
      }
    },
    'p': () => {
      if (isMyTurn && gameState.phase === 'action' && gameState.subPhase === 'awaiting_action') {
        handlePassWithConfirm();
      }
    },
    't': () => toggleTransactionModal(),
  }), [showShortcutsHelp, tacticalUIState, isMyTurn, gameState.phase, gameState.subPhase, handlePassWithConfirm, toggleTransactionModal]);

  useKeyboardShortcuts(keyboardHandlers);

  // Get contextual keyboard hints
  const keyboardHints = useMemo(() =>
    getHintsForPhase(gameState.phase, isMyTurn),
    [gameState.phase, isMyTurn]
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header - Compact with player info and resources */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-gray-800/90 backdrop-blur border-b border-gray-700">
        <div className="flex items-center justify-between px-3 py-1.5 gap-3">
          {/* Left: Title + Turn Indicator */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <h1 className="text-base font-bold text-white">TI4</h1>
            <TurnIndicator gameState={gameState} currentPlayerId={currentPlayerId} />
          </div>

          {/* Center: Player Pills (color dot + VP) */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {gameState.players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                  player.id === gameState.activePlayerId
                    ? 'bg-yellow-600/30 ring-1 ring-yellow-500/50'
                    : 'bg-gray-700/50 hover:bg-gray-700'
                }`}
                title={player.name}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getColorHex(player.color) }}
                />
                <span className="font-bold text-white">{player.score}</span>
              </div>
            ))}
          </div>

          {/* Right: Current Player Resources + Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Resources (only show if current player) */}
            {currentPlayer && (
              <div className="flex items-center gap-2.5 text-xs">
                <div className="flex items-center gap-1" title="Trade Goods">
                  <span className="text-yellow-500">TG</span>
                  <span className="text-yellow-400 font-mono font-medium">{currentPlayer.tradeGoods}</span>
                </div>
                <div className="flex items-center gap-1" title="Commodities">
                  <span className="text-blue-500">C</span>
                  <span className="text-blue-400 font-mono font-medium">{currentPlayer.commodities}/{currentPlayer.maxCommodities}</span>
                </div>
                <div className="flex items-center gap-1" title="Command Tokens (Tactics/Fleet/Strategy)">
                  <span className="text-green-500">T</span>
                  <span className="text-green-400 font-mono font-medium">
                    {currentPlayer.commandTokens.tactics}/{currentPlayer.commandTokens.fleet}/{currentPlayer.commandTokens.strategy}
                  </span>
                </div>
                {/* Trade Button */}
                <button
                  onClick={toggleTransactionModal}
                  className="px-2 py-0.5 bg-yellow-600/30 text-yellow-400 rounded hover:bg-yellow-600/50 border border-yellow-600/30 transition-colors"
                >
                  Trade
                </button>
              </div>
            )}

            {/* 3D Mode Toggle */}
            <button
              onClick={() => setUse3DPlayerStations(!use3DPlayerStations)}
              className={`p-1.5 rounded transition-colors ${
                use3DPlayerStations
                  ? 'bg-blue-600/30 text-blue-400 hover:bg-blue-600/40'
                  : 'bg-gray-600/30 text-gray-400 hover:bg-gray-600/40'
              }`}
              title={use3DPlayerStations ? 'Switch to sidebar view' : 'Switch to 3D stations view'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>

            {/* Connection Status */}
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />

            {/* Leave Game */}
            <button
              onClick={() => {
                leaveGame();
                useLobbyStore.getState().reset();
                router.push('/lobby');
              }}
              className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded hover:bg-red-600/30"
            >
              Leave
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout - full screen canvas */}
      <div className="fixed inset-0 top-10 flex">
        {/* Left Sidebar - Player Dashboard (hidden in 3D station mode) */}
        {!use3DPlayerStations && (
          <aside className="w-72 bg-gray-900 border-r border-gray-700 overflow-y-auto p-4 flex-shrink-0">
            {currentPlayer && (
              <PlayerDashboard
                player={currentPlayer}
                isActivePlayer={currentPlayer.id === gameState.activePlayerId}
              />
            )}
          </aside>
        )}

        {/* Game Board - fills remaining space */}
        <main className="flex-1 overflow-hidden relative">
          <GameBoard3D
            gameState={gameState}
            currentPlayerId={currentPlayerId}
            onTileClick={handleTileClick}
            onTileActivate={handleTileActivate}
            highlightedTiles={highlightedTiles}
            activatableTiles={activatableTiles}
            onStrategyCardPlay={handleStrategyCardPlay3D}
            onPass={handlePass3D}
            showPlayerStations={use3DPlayerStations}
            onRelicFragmentPurge={handleRelicFragmentPurge}
            onRelicClick={handleRelicClick}
            onLeaderClick={handleLeaderClick}
          />

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

      {/* Canvas Overlay Panel - Log/Chat */}
      <CanvasOverlayPanel
        gameLogEntries={gameState.gameLog || []}
        chatMessages={chatMessages}
        currentPlayerId={currentPlayerId}
        players={gameState.players}
        onSendChatMessage={sendChatMessage}
      />

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
          hideActionButtons={use3DPlayerStations}
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

      {/* Strategy Action Panel - renders during strategic primary/secondary sub-phases */}
      {(gameState.subPhase === 'strategic_primary' || gameState.subPhase === 'strategic_secondary') && (
        <StrategyActionPanel
          gameState={gameState}
          currentPlayer={currentPlayer}
          onSubmitPrimary={handleStrategicPrimary}
          onSubmitSecondary={handleStrategicSecondary}
        />
      )}

      {/* Transaction Modal */}
      {showTransactionModal && currentPlayer && (
        <TransactionModal
          currentPlayer={currentPlayer}
          allPlayers={gameState.players}
          pendingTransaction={gameState.pendingTransaction}
          onPropose={proposeTransaction}
          onAccept={acceptTransaction}
          onDecline={declineTransaction}
          onClose={toggleTransactionModal}
        />
      )}

      {/* Keyboard Hints */}
      <KeyboardHints hints={keyboardHints} />

      {/* Shortcuts Help Modal */}
      <ShortcutsHelpModal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
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
