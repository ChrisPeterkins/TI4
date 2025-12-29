'use client';

import { useState } from 'react';
import type { GameState, PlayerState, ObjectiveState } from '@ti4/shared';

interface StatusPhasePanelProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  isMyTurn: boolean;
  onScoreObjective: (objectiveId: string) => void;
  onConfirmStatus: () => void;
}

export function StatusPhasePanel({
  gameState,
  currentPlayer,
  isMyTurn,
  onScoreObjective,
  onConfirmStatus,
}: StatusPhasePanelProps) {
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);

  // Get available objectives to score
  const scorableObjectives = getScorableObjectives(gameState, currentPlayer);

  if (!isMyTurn) {
    const activePlayer = gameState.players.find((p) => p.id === gameState.activePlayerId);
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-2">Status Phase</h2>
          <p className="text-gray-400">
            Waiting for <span className="text-yellow-400">{activePlayer?.name}</span> to complete their status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Status Phase</h2>
          <p className="text-gray-400">Score objectives and prepare for the next round</p>
        </div>

        {/* Objectives Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-3">Score Objectives</h3>

          {/* Stage I Objectives */}
          <div className="mb-4">
            <h4 className="text-sm text-blue-400 mb-2">Stage I</h4>
            <div className="space-y-2">
              {scorableObjectives.stageI.length > 0 ? (
                scorableObjectives.stageI.map((obj) => (
                  <ObjectiveCard
                    key={obj.id}
                    objective={obj}
                    isSelected={selectedObjective === obj.id}
                    onSelect={() => setSelectedObjective(obj.id)}
                    canScore={obj.canScore}
                  />
                ))
              ) : (
                <p className="text-gray-500 text-sm">No Stage I objectives available</p>
              )}
            </div>
          </div>

          {/* Stage II Objectives */}
          <div>
            <h4 className="text-sm text-purple-400 mb-2">Stage II</h4>
            <div className="space-y-2">
              {scorableObjectives.stageII.length > 0 ? (
                scorableObjectives.stageII.map((obj) => (
                  <ObjectiveCard
                    key={obj.id}
                    objective={obj}
                    isSelected={selectedObjective === obj.id}
                    onSelect={() => setSelectedObjective(obj.id)}
                    canScore={obj.canScore}
                  />
                ))
              ) : (
                <p className="text-gray-500 text-sm">No Stage II objectives revealed yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Status Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Strategy Card:</span>
              <span className="text-green-400 ml-2">Will be readied</span>
            </div>
            <div>
              <span className="text-gray-500">Command Tokens:</span>
              <span className="text-blue-400 ml-2">Gain 2 tokens</span>
            </div>
            <div>
              <span className="text-gray-500">Action Cards:</span>
              <span className="text-yellow-400 ml-2">Draw cards</span>
            </div>
            <div>
              <span className="text-gray-500">Repair:</span>
              <span className="text-cyan-400 ml-2">Units repaired</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {selectedObjective && (
            <button
              onClick={() => {
                onScoreObjective(selectedObjective);
                setSelectedObjective(null);
              }}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
            >
              Score Objective
            </button>
          )}
          <button
            onClick={onConfirmStatus}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
          >
            {selectedObjective ? 'Skip Scoring & Continue' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ObjectiveCardProps {
  objective: {
    id: string;
    name: string;
    description: string;
    points: number;
    canScore: boolean;
  };
  isSelected: boolean;
  onSelect: () => void;
  canScore: boolean;
}

function ObjectiveCard({ objective, isSelected, onSelect, canScore }: ObjectiveCardProps) {
  return (
    <button
      onClick={canScore ? onSelect : undefined}
      disabled={!canScore}
      className={`
        w-full text-left p-3 rounded-lg border transition-all
        ${isSelected
          ? 'bg-yellow-600/20 border-yellow-500'
          : canScore
            ? 'bg-gray-800 border-gray-700 hover:border-gray-500'
            : 'bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{objective.name}</span>
            {!canScore && (
              <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-400">
                Not eligible
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

interface ScorableObjective {
  id: string;
  name: string;
  description: string;
  points: number;
  canScore: boolean;
}

function getScorableObjectives(
  gameState: GameState,
  currentPlayer: PlayerState | null
): { stageI: ScorableObjective[]; stageII: ScorableObjective[] } {
  if (!currentPlayer) {
    return { stageI: [], stageII: [] };
  }

  // Get revealed objectives from game state
  const revealedStageI = gameState.objectives.publicStageI.filter(obj => obj.revealed);
  const revealedStageII = gameState.objectives.publicStageII.filter(obj => obj.revealed);

  // Map to scorable objectives
  const mapToScorable = (objectives: typeof revealedStageI, points: number): ScorableObjective[] => {
    return objectives.map((obj) => ({
      id: obj.id,
      name: getObjectiveName(obj.id),
      description: getObjectiveDescription(obj.id),
      points,
      // Check if player already scored this objective
      canScore: !currentPlayer.scoredObjectives.includes(obj.id) && !obj.scoredBy.includes(currentPlayer.id),
    }));
  };

  return {
    stageI: mapToScorable(revealedStageI, 1),
    stageII: mapToScorable(revealedStageII, 2),
  };
}

function getObjectiveName(id: string): string {
  // In a full implementation, this would look up the objective by ID
  // For now, return a formatted version of the ID
  return id
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getObjectiveDescription(id: string): string {
  // In a full implementation, this would look up the objective description
  return 'Complete the objective requirements to score.';
}
