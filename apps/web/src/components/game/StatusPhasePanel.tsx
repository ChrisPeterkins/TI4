'use client';

import { useState, useMemo } from 'react';
import type {
  GameState,
  PlayerState,
  StatusPhaseState,
  SpentResources,
} from '@ti4/shared';
import { OBJECTIVES_BY_ID, type ObjectiveData } from '@ti4/shared';

interface StatusPhasePanelProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  isMyTurn: boolean;
  onScoreObjective: (objectiveId: string, objectiveType: 'public' | 'secret', spentResources?: SpentResources) => void;
  onSkipScoring: (skipType: 'public' | 'secret' | 'both') => void;
  onRedistributeTokens: (distribution: { tactics: number; fleet: number; strategy: number }) => void;
}

// Step labels for the progress indicator
const STEP_LABELS: Record<StatusPhaseState, string> = {
  score_objectives: 'Score Objectives',
  reveal_public_objective: 'Reveal Objective',
  draw_action_cards: 'Draw Action Cards',
  remove_command_tokens: 'Remove Tokens',
  gain_redistribute_tokens: 'Gain & Redistribute Tokens',
  ready_cards: 'Ready Cards',
  repair_units: 'Repair Units',
  return_strategy_cards: 'Return Strategy Cards',
};

const STEP_ORDER: StatusPhaseState[] = [
  'score_objectives',
  'reveal_public_objective',
  'draw_action_cards',
  'remove_command_tokens',
  'gain_redistribute_tokens',
  'ready_cards',
  'repair_units',
  'return_strategy_cards',
];

export function StatusPhasePanel({
  gameState,
  currentPlayer,
  isMyTurn,
  onScoreObjective,
  onSkipScoring,
  onRedistributeTokens,
}: StatusPhasePanelProps) {
  const currentStep = (gameState.subPhase as StatusPhaseState) || 'score_objectives';
  const stepIndex = STEP_ORDER.indexOf(currentStep);

  // Render different content based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 'score_objectives':
        return (
          <ScoringStep
            gameState={gameState}
            currentPlayer={currentPlayer}
            isMyTurn={isMyTurn}
            onScoreObjective={onScoreObjective}
            onSkipScoring={onSkipScoring}
          />
        );
      case 'gain_redistribute_tokens':
        return (
          <TokenRedistributionStep
            gameState={gameState}
            currentPlayer={currentPlayer}
            isMyTurn={isMyTurn}
            onRedistributeTokens={onRedistributeTokens}
          />
        );
      case 'reveal_public_objective':
      case 'draw_action_cards':
      case 'remove_command_tokens':
      case 'ready_cards':
      case 'repair_units':
      case 'return_strategy_cards':
        return <AutomaticStep stepName={STEP_LABELS[currentStep]} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-3xl w-full mx-4 shadow-2xl">
        {/* Header with Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Status Phase</h2>
            <span className="text-sm text-gray-400">Round {gameState.round}</span>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-1 mb-2">
            {STEP_ORDER.map((step, index) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  index < stepIndex
                    ? 'bg-green-500'
                    : index === stepIndex
                      ? 'bg-yellow-500'
                      : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-center text-gray-400">
            Step {stepIndex + 1} of {STEP_ORDER.length}: {STEP_LABELS[currentStep]}
          </p>
        </div>

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </div>
  );
}

// =============================================================================
// SCORING STEP
// =============================================================================

interface ScoringStepProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  isMyTurn: boolean;
  onScoreObjective: (objectiveId: string, objectiveType: 'public' | 'secret', spentResources?: SpentResources) => void;
  onSkipScoring: (skipType: 'public' | 'secret' | 'both') => void;
}

function ScoringStep({
  gameState,
  currentPlayer,
  isMyTurn,
  onScoreObjective,
  onSkipScoring,
}: ScoringStepProps) {
  const [selectedPublic, setSelectedPublic] = useState<string | null>(null);
  const [selectedSecret, setSelectedSecret] = useState<string | null>(null);

  // Get what the current player has already scored this phase
  const scoredThisPhase = gameState.statusPhase?.scoredThisPhase.find(
    s => s.playerId === currentPlayer?.id
  );
  const hasAlreadyScoredPublic = !!scoredThisPhase?.publicObjective;
  const hasAlreadyScoredSecret = !!scoredThisPhase?.secretObjective;

  // Get objectives
  const { publicObjectives, secretObjectives } = useMemo(() => {
    if (!currentPlayer) {
      return { publicObjectives: [], secretObjectives: [] };
    }

    // Get revealed public objectives
    const revealedPublic: Array<{ id: string; objective: ObjectiveData; canScore: boolean }> = [];

    for (const objInstance of gameState.objectives.publicStageI) {
      if (!objInstance.revealed) continue;
      const objData = OBJECTIVES_BY_ID[objInstance.id];
      if (!objData) continue;

      const alreadyScored = currentPlayer.scoredObjectives.includes(objInstance.id);
      revealedPublic.push({
        id: objInstance.id,
        objective: objData,
        canScore: !alreadyScored && !hasAlreadyScoredPublic,
      });
    }

    for (const objInstance of gameState.objectives.publicStageII) {
      if (!objInstance.revealed) continue;
      const objData = OBJECTIVES_BY_ID[objInstance.id];
      if (!objData) continue;

      const alreadyScored = currentPlayer.scoredObjectives.includes(objInstance.id);
      revealedPublic.push({
        id: objInstance.id,
        objective: objData,
        canScore: !alreadyScored && !hasAlreadyScoredPublic,
      });
    }

    // Get player's secret objectives
    const secrets: Array<{ id: string; objective: ObjectiveData; canScore: boolean }> = [];

    for (const secretId of currentPlayer.secretObjectives) {
      const objData = OBJECTIVES_BY_ID[secretId];
      if (!objData) continue;

      const alreadyScored = currentPlayer.scoredObjectives.includes(secretId);
      secrets.push({
        id: secretId,
        objective: objData,
        canScore: !alreadyScored && !hasAlreadyScoredSecret,
      });
    }

    return { publicObjectives: revealedPublic, secretObjectives: secrets };
  }, [gameState, currentPlayer, hasAlreadyScoredPublic, hasAlreadyScoredSecret]);

  if (!isMyTurn) {
    const activePlayer = gameState.players.find((p) => p.id === gameState.activePlayerId);
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          Waiting for <span className="text-yellow-400 font-medium">{activePlayer?.name}</span> to score objectives...
        </p>
      </div>
    );
  }

  const handleScorePublic = () => {
    if (selectedPublic) {
      onScoreObjective(selectedPublic, 'public');
      setSelectedPublic(null);
    }
  };

  const handleScoreSecret = () => {
    if (selectedSecret) {
      onScoreObjective(selectedSecret, 'secret');
      setSelectedSecret(null);
    }
  };

  const handleDoneScoring = () => {
    const skipType = !hasAlreadyScoredPublic && !hasAlreadyScoredSecret && !selectedPublic && !selectedSecret
      ? 'both'
      : !hasAlreadyScoredPublic && !selectedPublic
        ? 'public'
        : !hasAlreadyScoredSecret && !selectedSecret
          ? 'secret'
          : 'both';
    onSkipScoring(skipType);
  };

  return (
    <div className="space-y-6">
      {/* Public Objectives */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-white">Public Objectives</h3>
          {hasAlreadyScoredPublic && (
            <span className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded">
              Scored this phase
            </span>
          )}
        </div>

        <div className="grid gap-2">
          {publicObjectives.length > 0 ? (
            publicObjectives.map(({ id, objective, canScore }) => (
              <ObjectiveCard
                key={id}
                objective={objective}
                isSelected={selectedPublic === id}
                onSelect={() => canScore && setSelectedPublic(id)}
                canScore={canScore}
                isScored={currentPlayer?.scoredObjectives.includes(id) ?? false}
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm">No public objectives revealed</p>
          )}
        </div>
      </div>

      {/* Secret Objectives */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-white">Secret Objectives</h3>
          {hasAlreadyScoredSecret && (
            <span className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded">
              Scored this phase
            </span>
          )}
        </div>

        <div className="grid gap-2">
          {secretObjectives.length > 0 ? (
            secretObjectives.map(({ id, objective, canScore }) => (
              <ObjectiveCard
                key={id}
                objective={objective}
                isSelected={selectedSecret === id}
                onSelect={() => canScore && setSelectedSecret(id)}
                canScore={canScore}
                isScored={currentPlayer?.scoredObjectives.includes(id) ?? false}
                isSecret
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm">No secret objectives</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        {selectedPublic && (
          <button
            onClick={handleScorePublic}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Score Public (+{OBJECTIVES_BY_ID[selectedPublic]?.points || 1} VP)
          </button>
        )}
        {selectedSecret && (
          <button
            onClick={handleScoreSecret}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
          >
            Score Secret (+1 VP)
          </button>
        )}
        <button
          onClick={handleDoneScoring}
          className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
        >
          Done Scoring
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// TOKEN REDISTRIBUTION STEP
// =============================================================================

interface TokenRedistributionStepProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  isMyTurn: boolean;
  onRedistributeTokens: (distribution: { tactics: number; fleet: number; strategy: number }) => void;
}

function TokenRedistributionStep({
  gameState,
  currentPlayer,
  isMyTurn,
  onRedistributeTokens,
}: TokenRedistributionStepProps) {
  const currentTokens = currentPlayer?.commandTokens ?? { tactics: 0, fleet: 0, strategy: 0 };
  const currentTotal = currentTokens.tactics + currentTokens.fleet + currentTokens.strategy;
  const newTotal = currentTotal + 2;

  const [distribution, setDistribution] = useState({
    tactics: currentTokens.tactics + 1,
    fleet: currentTokens.fleet + 1,
    strategy: currentTokens.strategy,
  });

  const distributionTotal = distribution.tactics + distribution.fleet + distribution.strategy;
  const isValid = distributionTotal === newTotal;

  if (!isMyTurn) {
    const activePlayer = gameState.players.find((p) => p.id === gameState.activePlayerId);
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          Waiting for <span className="text-yellow-400 font-medium">{activePlayer?.name}</span> to redistribute tokens...
        </p>
      </div>
    );
  }

  const adjustToken = (pool: 'tactics' | 'fleet' | 'strategy', delta: number) => {
    const newValue = distribution[pool] + delta;
    if (newValue < 0) return;

    setDistribution(prev => ({
      ...prev,
      [pool]: newValue,
    }));
  };

  const handleConfirm = () => {
    if (isValid) {
      onRedistributeTokens(distribution);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-300">
          You gained <span className="text-green-400 font-bold">2 command tokens</span>!
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Redistribute your tokens between the three pools.
        </p>
      </div>

      {/* Token Pools */}
      <div className="grid grid-cols-3 gap-4">
        <TokenPool
          label="Tactics"
          value={distribution.tactics}
          previousValue={currentTokens.tactics}
          description="Activate systems"
          color="red"
          onIncrease={() => adjustToken('tactics', 1)}
          onDecrease={() => adjustToken('tactics', -1)}
        />
        <TokenPool
          label="Fleet"
          value={distribution.fleet}
          previousValue={currentTokens.fleet}
          description="Fleet supply"
          color="blue"
          onIncrease={() => adjustToken('fleet', 1)}
          onDecrease={() => adjustToken('fleet', -1)}
        />
        <TokenPool
          label="Strategy"
          value={distribution.strategy}
          previousValue={currentTokens.strategy}
          description="Secondary abilities"
          color="yellow"
          onIncrease={() => adjustToken('strategy', 1)}
          onDecrease={() => adjustToken('strategy', -1)}
        />
      </div>

      {/* Total Indicator */}
      <div className="text-center">
        <div className={`text-lg font-medium ${isValid ? 'text-green-400' : 'text-red-400'}`}>
          Total: {distributionTotal} / {newTotal}
        </div>
        {!isValid && (
          <p className="text-red-400 text-sm mt-1">
            {distributionTotal < newTotal
              ? `Add ${newTotal - distributionTotal} more token(s)`
              : `Remove ${distributionTotal - newTotal} token(s)`}
          </p>
        )}
      </div>

      {/* Confirm Button */}
      <div className="flex justify-end pt-4 border-t border-gray-700">
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            isValid
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Confirm Distribution
        </button>
      </div>
    </div>
  );
}

interface TokenPoolProps {
  label: string;
  value: number;
  previousValue: number;
  description: string;
  color: 'red' | 'blue' | 'yellow';
  onIncrease: () => void;
  onDecrease: () => void;
}

function TokenPool({
  label,
  value,
  previousValue,
  description,
  color,
  onIncrease,
  onDecrease,
}: TokenPoolProps) {
  const colorClasses = {
    red: 'border-red-500/50 bg-red-500/10',
    blue: 'border-blue-500/50 bg-blue-500/10',
    yellow: 'border-yellow-500/50 bg-yellow-500/10',
  };

  const delta = value - previousValue;

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="text-center">
        <h4 className="text-white font-medium mb-1">{label}</h4>
        <p className="text-gray-500 text-xs mb-3">{description}</p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onDecrease}
            disabled={value <= 0}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <div className="text-center">
            <span className="text-2xl font-bold text-white">{value}</span>
            {delta !== 0 && (
              <span className={`ml-1 text-sm ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({delta > 0 ? '+' : ''}{delta})
              </span>
            )}
          </div>
          <button
            onClick={onIncrease}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// AUTOMATIC STEP
// =============================================================================

interface AutomaticStepProps {
  stepName: string;
}

function AutomaticStep({ stepName }: AutomaticStepProps) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center gap-2 text-gray-400">
        <svg
          className="w-5 h-5 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>{stepName}...</span>
      </div>
    </div>
  );
}

// =============================================================================
// OBJECTIVE CARD
// =============================================================================

interface ObjectiveCardProps {
  objective: ObjectiveData;
  isSelected: boolean;
  onSelect: () => void;
  canScore: boolean;
  isScored: boolean;
  isSecret?: boolean;
}

function ObjectiveCard({
  objective,
  isSelected,
  onSelect,
  canScore,
  isScored,
  isSecret = false,
}: ObjectiveCardProps) {
  const stageColor = objective.type === 'stage2' ? 'purple' : isSecret ? 'pink' : 'blue';

  return (
    <button
      onClick={canScore ? onSelect : undefined}
      disabled={!canScore || isScored}
      className={`
        w-full text-left p-3 rounded-lg border transition-all
        ${isScored
          ? 'bg-green-600/20 border-green-500 cursor-default'
          : isSelected
            ? `bg-${stageColor}-600/20 border-${stageColor}-500`
            : canScore
              ? 'bg-gray-800 border-gray-700 hover:border-gray-500 cursor-pointer'
              : 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{objective.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              objective.type === 'stage2'
                ? 'bg-purple-600/30 text-purple-300'
                : isSecret
                  ? 'bg-pink-600/30 text-pink-300'
                  : 'bg-blue-600/30 text-blue-300'
            }`}>
              {objective.type === 'stage2' ? 'Stage II' : isSecret ? 'Secret' : 'Stage I'}
            </span>
            {isScored && (
              <span className="text-xs px-2 py-0.5 bg-green-600/30 text-green-300 rounded">
                Scored
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">{objective.description}</p>
        </div>
        <div className="ml-4 text-right">
          <div className="text-lg font-bold text-yellow-400">{objective.points}</div>
          <div className="text-xs text-gray-500">VP</div>
        </div>
      </div>
    </button>
  );
}
