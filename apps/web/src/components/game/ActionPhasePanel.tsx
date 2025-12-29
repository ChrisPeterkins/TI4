'use client';

import { useState } from 'react';
import { strategyCards } from '@ti4/game-data';
import type { GameState, PlayerState, HexCoord, UnitType } from '@ti4/shared';
import { MovementPanel, type UnitMoveSelection } from './MovementPanel';
import { ProductionPanel } from './ProductionPanel';

interface ActionPhasePanelProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  isMyTurn: boolean;
  onTacticalAction: () => void;
  onStrategicAction: () => void;
  onPass: () => void;
  onMoveUnits: (moves: UnitMoveSelection[]) => void;
  onSkipMovement: () => void;
  onProduceUnits: (units: { type: UnitType; count: number }[]) => void;
  onSkipProduction: () => void;
}

export function ActionPhasePanel({
  gameState,
  currentPlayer,
  isMyTurn,
  onTacticalAction,
  onStrategicAction,
  onPass,
  onMoveUnits,
  onSkipMovement,
  onProduceUnits,
  onSkipProduction,
}: ActionPhasePanelProps) {
  const activePlayer = gameState.players.find((p) => p.id === gameState.activePlayerId);
  const subPhase = gameState.subPhase;

  // Check if current player can use their strategy card
  const canUseStrategyCard = currentPlayer?.strategyCard && !isStrategyCardExhausted(gameState, currentPlayer.strategyCard);

  // Check if current player has passed
  const hasPassed = currentPlayer?.passed || false;

  // Render movement panel during tactical_movement sub-phase
  if (subPhase === 'tactical_movement' && isMyTurn && currentPlayer) {
    return (
      <MovementPanel
        gameState={gameState}
        currentPlayer={currentPlayer}
        onMoveUnits={onMoveUnits}
        onSkipMovement={onSkipMovement}
      />
    );
  }

  // Render production panel during tactical_production sub-phase
  if (subPhase === 'tactical_production' && isMyTurn && currentPlayer) {
    return (
      <ProductionPanel
        gameState={gameState}
        currentPlayer={currentPlayer}
        onProduceUnits={onProduceUnits}
        onSkipProduction={onSkipProduction}
      />
    );
  }

  // Waiting message during sub-phases when not my turn
  if (subPhase && subPhase !== 'awaiting_action') {
    const subPhaseNames: Record<string, string> = {
      tactical_movement: 'movement',
      tactical_production: 'production',
      tactical_space_combat: 'space combat',
      tactical_invasion: 'invasion',
      strategic_primary: 'strategic action',
      strategic_secondary: 'secondary ability',
    };

    return (
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-gray-800 rounded-lg border border-gray-700 px-6 py-3 shadow-xl">
          <div className="text-center">
            <span className="text-gray-400">Waiting for </span>
            <span className="text-yellow-400 font-bold">{activePlayer?.name}</span>
            <span className="text-gray-400"> to complete </span>
            <span className="text-blue-400">{subPhaseNames[subPhase] || subPhase}</span>
            <span className="text-gray-400">...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isMyTurn) {
    return (
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-gray-800 rounded-lg border border-gray-700 px-6 py-3 shadow-xl">
          <div className="text-center">
            <span className="text-gray-400">Waiting for </span>
            <span className="text-yellow-400 font-bold">{activePlayer?.name}</span>
            <span className="text-gray-400"> to take an action...</span>
          </div>
        </div>
      </div>
    );
  }

  if (hasPassed) {
    return (
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-gray-800 rounded-lg border border-gray-700 px-6 py-3 shadow-xl">
          <div className="text-center text-gray-400">
            You have passed. Waiting for other players...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-gray-800 rounded-lg border border-yellow-500/50 p-4 shadow-xl">
        <div className="text-center mb-4">
          <span className="text-yellow-400 font-bold">Your Turn</span>
          <span className="text-gray-400 ml-2">- Choose an action</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Tactical Action */}
          <button
            onClick={onTacticalAction}
            disabled={!currentPlayer || currentPlayer.commandTokens.tactics < 1}
            className={`group flex flex-col items-center gap-2 px-6 py-4 rounded-lg transition-all ${
              currentPlayer && currentPlayer.commandTokens.tactics >= 1
                ? 'bg-green-600/20 border border-green-500/50 hover:bg-green-600/30 hover:border-green-400'
                : 'bg-gray-700/50 border border-gray-600 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              currentPlayer && currentPlayer.commandTokens.tactics >= 1 ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <span className={`font-medium ${
              currentPlayer && currentPlayer.commandTokens.tactics >= 1 ? 'text-green-400' : 'text-gray-500'
            }`}>Tactical</span>
            <span className="text-xs text-gray-500">Activate a system</span>
          </button>

          {/* Strategic Action */}
          <button
            onClick={onStrategicAction}
            disabled={!canUseStrategyCard}
            className={`group flex flex-col items-center gap-2 px-6 py-4 rounded-lg transition-all ${
              canUseStrategyCard
                ? 'bg-purple-600/20 border border-purple-500/50 hover:bg-purple-600/30 hover:border-purple-400'
                : 'bg-gray-700/50 border border-gray-600 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              canUseStrategyCard ? 'bg-purple-600' : 'bg-gray-600'
            }`}>
              <span className="text-white font-bold text-lg">
                {currentPlayer?.strategyCard || '?'}
              </span>
            </div>
            <span className={`font-medium ${canUseStrategyCard ? 'text-purple-400' : 'text-gray-500'}`}>
              Strategic
            </span>
            <span className="text-xs text-gray-500">
              {currentPlayer?.strategyCard
                ? getStrategyCardName(currentPlayer.strategyCard)
                : 'No card'}
            </span>
          </button>

          {/* Pass */}
          <button
            onClick={onPass}
            className="group flex flex-col items-center gap-2 px-6 py-4 bg-gray-600/20 border border-gray-500/50 rounded-lg hover:bg-gray-600/30 hover:border-gray-400 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-gray-400 font-medium">Pass</span>
            <span className="text-xs text-gray-500">End your turn</span>
          </button>
        </div>

        {/* Command Token Count */}
        {currentPlayer && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Tactics:</span>
                <span className="text-green-400 font-bold">{currentPlayer.commandTokens.tactics}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Fleet:</span>
                <span className="text-cyan-400 font-bold">{currentPlayer.commandTokens.fleet}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Strategy:</span>
                <span className="text-purple-400 font-bold">{currentPlayer.commandTokens.strategy}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function isStrategyCardExhausted(gameState: GameState, cardNumber: number): boolean {
  const card = gameState.strategyCards.find((c) => c.number === cardNumber);
  return card?.exhausted || false;
}

function getStrategyCardName(number: number): string {
  const names: Record<number, string> = {
    1: 'Leadership',
    2: 'Diplomacy',
    3: 'Politics',
    4: 'Construction',
    5: 'Trade',
    6: 'Warfare',
    7: 'Technology',
    8: 'Imperial',
  };
  return names[number] || `Strategy ${number}`;
}
