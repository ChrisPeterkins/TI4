'use client';

import { useState, useMemo } from 'react';
import type {
  GameState,
  PlayerState,
  AgendaPhaseState,
  CastVoteAction,
} from '@ti4/shared';
import { AGENDAS_BY_ID, ACTION_CARDS_BY_ID, isRiderCard } from '@ti4/shared';

interface AgendaPhasePanelProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  isMyTurn: boolean;
  onRevealAgenda: () => void;
  onCastVote: (outcome: string, exhaustedPlanets: string[], abstain?: boolean) => void;
  onSpeakerTiebreak: (chosenOutcome: string) => void;
  onPlayRider?: (cardId: string, prediction: string) => void;
}

// Step labels for display
const STEP_LABELS: Record<AgendaPhaseState, string> = {
  reveal_agenda: 'Reveal Agenda',
  when_revealed: 'When Revealed',
  after_revealed: 'After Revealed',
  voting: 'Voting',
  speaker_tiebreak: 'Speaker Tiebreak',
  resolve_outcome: 'Resolving Outcome',
};

export function AgendaPhasePanel({
  gameState,
  currentPlayer,
  isMyTurn,
  onRevealAgenda,
  onCastVote,
  onSpeakerTiebreak,
  onPlayRider,
}: AgendaPhasePanelProps) {
  const agendaPhase = gameState.agendaPhase;
  const currentStep = (gameState.subPhase as AgendaPhaseState) || 'reveal_agenda';

  if (!agendaPhase) {
    return null;
  }

  const agenda = agendaPhase.currentAgendaId
    ? AGENDAS_BY_ID[agendaPhase.currentAgendaId]
    : null;

  // Render different content based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 'reveal_agenda':
        return (
          <RevealAgendaStep
            gameState={gameState}
            isMyTurn={isMyTurn}
            onRevealAgenda={onRevealAgenda}
          />
        );
      case 'when_revealed':
      case 'after_revealed':
        return (
          <RiderStep
            gameState={gameState}
            currentPlayer={currentPlayer}
            agenda={agenda}
            step={currentStep}
            onPlayRider={onPlayRider}
          />
        );
      case 'voting':
        return (
          <VotingStep
            gameState={gameState}
            currentPlayer={currentPlayer}
            isMyTurn={isMyTurn}
            agenda={agenda}
            onCastVote={onCastVote}
          />
        );
      case 'speaker_tiebreak':
        return (
          <TiebreakStep
            gameState={gameState}
            isMyTurn={isMyTurn}
            onSpeakerTiebreak={onSpeakerTiebreak}
          />
        );
      case 'resolve_outcome':
        return (
          <ResolveOutcomeStep
            gameState={gameState}
            agenda={agenda}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 max-w-3xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Agenda Phase</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Agenda {agendaPhase.agendaNumber} of 2
              </span>
              <span className="text-sm px-2 py-1 bg-purple-600/20 text-purple-400 rounded">
                {STEP_LABELS[currentStep]}
              </span>
            </div>
          </div>

          {/* Voting Order Progress */}
          {currentStep === 'voting' && (
            <VotingOrderProgress
              gameState={gameState}
              votingOrder={agendaPhase.votingOrder}
              votingComplete={agendaPhase.votingComplete}
              currentVoterIndex={agendaPhase.currentVoterIndex}
            />
          )}
        </div>

        {/* Current Agenda Card */}
        {agenda && currentStep !== 'reveal_agenda' && (
          <AgendaCard agenda={agenda} />
        )}

        {/* Step Content */}
        {renderStepContent()}
      </div>
    </div>
  );
}

// =============================================================================
// REVEAL AGENDA STEP
// =============================================================================

interface RevealAgendaStepProps {
  gameState: GameState;
  isMyTurn: boolean;
  onRevealAgenda: () => void;
}

function RevealAgendaStep({
  gameState,
  isMyTurn,
  onRevealAgenda,
}: RevealAgendaStepProps) {
  const speaker = gameState.players.find(p => p.id === gameState.speakerId);
  const isSpeaker = gameState.activePlayerId === gameState.speakerId;

  if (!isMyTurn || !isSpeaker) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          Waiting for <span className="text-yellow-400 font-medium">{speaker?.name}</span> to reveal the agenda...
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      <p className="text-gray-300 mb-6">
        As the Speaker, you will reveal and read the next agenda card.
      </p>
      <button
        onClick={onRevealAgenda}
        className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-lg transition-colors"
      >
        Reveal Agenda
      </button>
    </div>
  );
}

// =============================================================================
// RIDER STEP (When Revealed / After Revealed)
// =============================================================================

interface RiderStepProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  agenda: { name: string; type: string; electionType: string; description: string } | null;
  step: 'when_revealed' | 'after_revealed';
  onPlayRider?: (cardId: string, prediction: string) => void;
}

function RiderStep({
  gameState,
  currentPlayer,
  agenda,
  step,
  onPlayRider,
}: RiderStepProps) {
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);

  const agendaPhase = gameState.agendaPhase;
  if (!agendaPhase || !agenda) return null;

  // Get rider cards in current player's hand
  const riderCards = useMemo(() => {
    if (!currentPlayer) return [];
    return currentPlayer.actionCards
      .filter(cardId => isRiderCard(cardId))
      .map(cardId => ({
        id: cardId,
        data: ACTION_CARDS_BY_ID[cardId],
      }))
      .filter(card => card.data);
  }, [currentPlayer]);

  // Get valid outcomes/predictions
  const predictions = useMemo(() => {
    switch (agendaPhase.currentElectionType) {
      case 'for_against':
        return [
          { id: 'for', label: 'For' },
          { id: 'against', label: 'Against' },
        ];
      case 'player':
        return gameState.players.map(p => ({
          id: p.id,
          label: p.name,
        }));
      default:
        return [];
    }
  }, [agendaPhase.currentElectionType, gameState.players]);

  // Check if current player already has a rider played on this agenda
  const hasPlayedRider = agendaPhase.riders.some(
    r => r.playerId === currentPlayer?.id && !r.resolved
  );

  const handlePlayRider = () => {
    if (selectedRider && selectedPrediction && onPlayRider) {
      onPlayRider(selectedRider, selectedPrediction);
      setSelectedRider(null);
      setSelectedPrediction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-white">
          {step === 'when_revealed' ? 'When Agenda Revealed' : 'After Agenda Revealed'}
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          Players may play abilities or rider cards
        </p>
      </div>

      {/* Active Riders */}
      {agendaPhase.riders.length > 0 && (
        <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
          <h4 className="text-sm font-medium text-purple-300 mb-2">Active Riders</h4>
          <div className="space-y-2">
            {agendaPhase.riders.map((rider, i) => {
              const player = gameState.players.find(p => p.id === rider.playerId);
              const cardData = ACTION_CARDS_BY_ID[rider.cardId];
              const predictionLabel = rider.prediction === 'for' ? 'For' :
                rider.prediction === 'against' ? 'Against' :
                gameState.players.find(p => p.id === rider.prediction)?.name || rider.prediction;
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-white">
                    <span className="text-yellow-400">{player?.name}</span> played{' '}
                    <span className="text-purple-300">{cardData?.name || rider.cardId}</span>
                  </span>
                  <span className="text-gray-400">
                    predicting <span className="text-blue-300">{predictionLabel}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Play Rider Section */}
      {riderCards.length > 0 && !hasPlayedRider && onPlayRider && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Play a Rider Card</h4>

          {/* Card Selection */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {riderCards.map(card => (
              <button
                key={card.id}
                onClick={() => setSelectedRider(card.id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedRider === card.id
                    ? 'bg-purple-600/20 border-purple-500'
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="font-medium text-white text-sm">{card.data?.name}</div>
                <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {card.data?.description}
                </div>
              </button>
            ))}
          </div>

          {/* Prediction Selection */}
          {selectedRider && (
            <div className="mb-4">
              <h5 className="text-sm text-gray-400 mb-2">Predict the outcome:</h5>
              <div className="flex flex-wrap gap-2">
                {predictions.map(pred => (
                  <button
                    key={pred.id}
                    onClick={() => setSelectedPrediction(pred.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      selectedPrediction === pred.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {pred.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Play Button */}
          <button
            onClick={handlePlayRider}
            disabled={!selectedRider || !selectedPrediction}
            className={`w-full py-2 rounded-lg font-medium transition-colors ${
              selectedRider && selectedPrediction
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Play Rider
          </button>

          <p className="text-xs text-gray-500 mt-2 text-center">
            If your prediction is correct, you gain the rider's reward but cannot vote on this agenda.
          </p>
        </div>
      )}

      {hasPlayedRider && (
        <div className="text-center py-4 text-gray-400">
          You have already played a rider on this agenda.
        </div>
      )}

      {riderCards.length === 0 && !hasPlayedRider && (
        <div className="text-center py-4 text-gray-500">
          You have no rider cards to play.
        </div>
      )}

      <p className="text-center text-gray-500 text-sm">
        Waiting for all players to finish responding...
      </p>
    </div>
  );
}

// =============================================================================
// VOTING STEP
// =============================================================================

interface VotingStepProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  isMyTurn: boolean;
  agenda: { name: string; type: string; electionType: string; description: string } | null;
  onCastVote: (outcome: string, exhaustedPlanets: string[], abstain?: boolean) => void;
}

function VotingStep({
  gameState,
  currentPlayer,
  isMyTurn,
  agenda,
  onCastVote,
}: VotingStepProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);

  const agendaPhase = gameState.agendaPhase;
  if (!agendaPhase || !agenda) return null;

  // Get available planets for voting
  const availablePlanets = useMemo(() => {
    if (!currentPlayer) return [];
    return currentPlayer.planets
      .filter(p => !p.exhausted)
      .map(p => {
        const planetData = getPlanetData(p.planetId);
        return {
          id: p.planetId,
          name: planetData?.name || p.planetId,
          influence: planetData?.influence || 0,
        };
      })
      .sort((a, b) => b.influence - a.influence);
  }, [currentPlayer]);

  // Calculate total votes from selected planets
  const totalVotes = useMemo(() => {
    return selectedPlanets.reduce((sum, planetId) => {
      const planet = availablePlanets.find(p => p.id === planetId);
      return sum + (planet?.influence || 0);
    }, 0);
  }, [selectedPlanets, availablePlanets]);

  // Get valid outcomes based on election type
  const outcomes = useMemo(() => {
    switch (agendaPhase.currentElectionType) {
      case 'for_against':
        return [
          { id: 'for', label: 'For' },
          { id: 'against', label: 'Against' },
        ];
      case 'player':
        return gameState.players.map(p => ({
          id: p.id,
          label: p.name,
        }));
      default:
        return [];
    }
  }, [agendaPhase.currentElectionType, gameState.players]);

  if (!isMyTurn) {
    const currentVoter = agendaPhase.votingOrder[agendaPhase.currentVoterIndex];
    const voterPlayer = gameState.players.find(p => p.id === currentVoter);
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          Waiting for <span className="text-yellow-400 font-medium">{voterPlayer?.name}</span> to vote...
        </p>
        <VoteTallies tallies={agendaPhase.voteTallies} outcomes={outcomes} />
      </div>
    );
  }

  const togglePlanet = (planetId: string) => {
    setSelectedPlanets(prev =>
      prev.includes(planetId)
        ? prev.filter(id => id !== planetId)
        : [...prev, planetId]
    );
  };

  const handleCastVote = () => {
    if (selectedOutcome) {
      onCastVote(selectedOutcome, selectedPlanets, false);
    }
  };

  const handleAbstain = () => {
    onCastVote('', [], true);
  };

  return (
    <div className="space-y-6">
      {/* Current Tallies */}
      <VoteTallies tallies={agendaPhase.voteTallies} outcomes={outcomes} />

      {/* Outcome Selection */}
      <div>
        <h3 className="text-lg font-medium text-white mb-3">Vote For:</h3>
        <div className="flex flex-wrap gap-2">
          {outcomes.map(outcome => (
            <button
              key={outcome.id}
              onClick={() => setSelectedOutcome(outcome.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedOutcome === outcome.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {outcome.label}
            </button>
          ))}
        </div>
      </div>

      {/* Planet Selection */}
      <div>
        <h3 className="text-lg font-medium text-white mb-3">
          Exhaust Planets for Votes ({totalVotes} influence)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availablePlanets.map(planet => (
            <button
              key={planet.id}
              onClick={() => togglePlanet(planet.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedPlanets.includes(planet.id)
                  ? 'bg-blue-600/20 border-blue-500'
                  : 'bg-gray-800 border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="font-medium text-white">{planet.name}</div>
              <div className="text-sm text-gray-400">
                {planet.influence} influence
              </div>
            </button>
          ))}
        </div>
        {availablePlanets.length === 0 && (
          <p className="text-gray-500 text-sm">No unexhausted planets available</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={handleAbstain}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors"
        >
          Abstain
        </button>
        <button
          onClick={handleCastVote}
          disabled={!selectedOutcome}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedOutcome
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Cast {totalVotes} Vote{totalVotes !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// TIEBREAK STEP
// =============================================================================

interface TiebreakStepProps {
  gameState: GameState;
  isMyTurn: boolean;
  onSpeakerTiebreak: (chosenOutcome: string) => void;
}

function TiebreakStep({
  gameState,
  isMyTurn,
  onSpeakerTiebreak,
}: TiebreakStepProps) {
  const agendaPhase = gameState.agendaPhase;
  const speaker = gameState.players.find(p => p.id === gameState.speakerId);

  if (!agendaPhase) return null;

  // Find tied outcomes (outcomes with highest votes)
  const tallies = agendaPhase.voteTallies;
  const maxVotes = Math.max(...Object.values(tallies), 0);
  const tiedOutcomes = Object.entries(tallies)
    .filter(([_, votes]) => votes === maxVotes)
    .map(([outcome]) => outcome);

  if (!isMyTurn) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">
          Vote is tied! Waiting for Speaker{' '}
          <span className="text-yellow-400 font-medium">{speaker?.name}</span> to break the tie...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-lg text-gray-300">
          The vote is tied at <span className="text-yellow-400 font-bold">{maxVotes}</span> votes each!
        </p>
        <p className="text-gray-400 mt-2">
          As Speaker, you must choose the winning outcome.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {tiedOutcomes.map(outcome => {
          const label = outcome === 'for' ? 'For' : outcome === 'against' ? 'Against' :
            gameState.players.find(p => p.id === outcome)?.name || outcome;
          return (
            <button
              key={outcome}
              onClick={() => onSpeakerTiebreak(outcome)}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium text-lg transition-colors"
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// RESOLVE OUTCOME STEP
// =============================================================================

interface ResolveOutcomeStepProps {
  gameState: GameState;
  agenda: { name: string; type: string; electionType: string; description: string } | null;
}

function ResolveOutcomeStep({
  gameState,
  agenda,
}: ResolveOutcomeStepProps) {
  const agendaPhase = gameState.agendaPhase;
  if (!agendaPhase || !agenda) return null;

  const outcome = agendaPhase.electedOutcome;
  const outcomeLabel = outcome === 'for' ? 'FOR' : outcome === 'against' ? 'AGAINST' :
    gameState.players.find(p => p.id === outcome)?.name || outcome;

  return (
    <div className="text-center py-8">
      <div className={`text-3xl font-bold mb-4 ${
        outcome === 'for' ? 'text-green-400' : outcome === 'against' ? 'text-red-400' : 'text-yellow-400'
      }`}>
        {outcomeLabel}
      </div>
      <p className="text-gray-300 text-lg">
        {agenda.type === 'law' && outcome === 'for'
          ? 'This law is now in effect!'
          : agenda.type === 'law' && outcome === 'against'
            ? 'This law was rejected.'
            : 'The outcome has been decided.'}
      </p>
      {agendaPhase.agendaNumber < 2 && (
        <p className="text-gray-500 mt-4 text-sm">
          Preparing for agenda 2...
        </p>
      )}
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function VotingOrderProgress({
  gameState,
  votingOrder,
  votingComplete,
  currentVoterIndex,
}: {
  gameState: GameState;
  votingOrder: string[];
  votingComplete: string[];
  currentVoterIndex: number;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {votingOrder.map((playerId, index) => {
        const player = gameState.players.find(p => p.id === playerId);
        const hasVoted = votingComplete.includes(playerId);
        const isCurrent = index === currentVoterIndex && !hasVoted;
        const isSpeaker = playerId === gameState.speakerId;

        return (
          <div
            key={playerId}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              hasVoted
                ? 'bg-green-600/20 text-green-400 border border-green-500/50'
                : isCurrent
                  ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/50'
                  : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}
          >
            {player?.name || 'Unknown'}
            {isSpeaker && <span className="ml-1 text-xs">(S)</span>}
            {hasVoted && <span className="ml-1">✓</span>}
          </div>
        );
      })}
    </div>
  );
}

function VoteTallies({
  tallies,
  outcomes,
}: {
  tallies: Record<string, number>;
  outcomes: Array<{ id: string; label: string }>;
}) {
  if (Object.keys(tallies).length === 0) return null;

  return (
    <div className="flex justify-center gap-6 py-4 bg-gray-800/50 rounded-lg">
      {outcomes.map(outcome => (
        <div key={outcome.id} className="text-center">
          <div className="text-2xl font-bold text-white">
            {tallies[outcome.id] || 0}
          </div>
          <div className="text-sm text-gray-400">{outcome.label}</div>
        </div>
      ))}
    </div>
  );
}

function AgendaCard({
  agenda,
}: {
  agenda: { name: string; type: string; electionType: string; description: string };
}) {
  const typeColor = agenda.type === 'law' ? 'blue' : 'orange';

  return (
    <div className={`mb-6 p-4 rounded-lg border bg-${typeColor}-600/10 border-${typeColor}-500/50`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-bold text-white">{agenda.name}</h3>
        <span className={`text-xs px-2 py-1 rounded uppercase bg-${typeColor}-600/30 text-${typeColor}-300`}>
          {agenda.type}
        </span>
      </div>
      <p className="text-gray-300">{agenda.description}</p>
      <p className="text-sm text-gray-500 mt-2">
        Election: {formatElectionType(agenda.electionType)}
      </p>
    </div>
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatElectionType(electionType: string): string {
  switch (electionType) {
    case 'for_against':
      return 'For or Against';
    case 'player':
      return 'Elect Player';
    case 'planet':
      return 'Elect Planet';
    case 'scored_secret':
      return 'Elect Scored Secret Objective';
    case 'law':
      return 'Elect Law';
    case 'strategy_card':
      return 'Elect Strategy Card';
    default:
      return electionType;
  }
}

// Simple planet data lookup (would need actual game-data import for real use)
function getPlanetData(planetId: string): { name: string; influence: number } | null {
  // This would normally use the systems data from @ti4/game-data
  // For now, return a placeholder
  return {
    name: planetId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    influence: 2, // Default influence
  };
}
