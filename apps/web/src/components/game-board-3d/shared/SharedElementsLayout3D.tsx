'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { GameState } from '@ti4/shared';
import { CardDecksArea3D } from './CardDecksArea3D';
import { ObjectivesArea3D } from './ObjectivesArea3D';
import { ExplorationArea3D } from './ExplorationArea3D';
import { GameStatusArea3D } from './GameStatusArea3D';

export type ExplorationDeckType = 'cultural' | 'industrial' | 'hazardous' | 'frontier';

export interface SharedElementsLayout3DProps {
  gameState: GameState;
  boardBounds: { center: THREE.Vector3; radius: number };
  currentPlayerId?: string;
  // Deck interactions
  onActionCardDraw?: () => void;
  onAgendaReveal?: () => void;
  onExplorationDraw?: (type: ExplorationDeckType) => void;
  onRelicDraw?: () => void;
  onSecretObjectiveDraw?: () => void;
  // Objective interactions
  onObjectiveClick?: (objectiveId: string, type: 'stage1' | 'stage2') => void;
  canScoreObjective?: (objectiveId: string) => boolean;
}

/**
 * Calculate positions for the 4 shared element areas around the board
 * North: Objectives, South: Exploration, West: Card Decks, East: Game Status
 */
function calculateAreaPositions(boardCenter: THREE.Vector3, boardRadius: number) {
  // Position shared elements at boardRadius + 2 (inside the station ring at boardRadius + 6)
  const elementDistance = boardRadius + 3;

  return {
    north: {
      position: new THREE.Vector3(boardCenter.x, 0.1, boardCenter.z - elementDistance),
      rotation: Math.PI, // Face south (toward center)
    },
    south: {
      position: new THREE.Vector3(boardCenter.x, 0.1, boardCenter.z + elementDistance),
      rotation: 0, // Face north (toward center)
    },
    west: {
      position: new THREE.Vector3(boardCenter.x - elementDistance, 0.1, boardCenter.z),
      rotation: Math.PI / 2, // Face east (toward center)
    },
    east: {
      position: new THREE.Vector3(boardCenter.x + elementDistance, 0.1, boardCenter.z),
      rotation: -Math.PI / 2, // Face west (toward center)
    },
  };
}

/**
 * SharedElementsLayout3D - Main container for all shared game elements
 *
 * Arranges shared elements in 4 concentrated areas around the board:
 * - North: Public Objectives + Secret Objective Deck
 * - South: 4 Exploration Decks
 * - West: Action, Agenda, and Relic Card Decks
 * - East: Active Laws, Speaker Token, Game Status
 */
export function SharedElementsLayout3D({
  gameState,
  boardBounds,
  currentPlayerId,
  onActionCardDraw,
  onAgendaReveal,
  onExplorationDraw,
  onRelicDraw,
  onSecretObjectiveDraw,
  onObjectiveClick,
  canScoreObjective,
}: SharedElementsLayout3DProps) {
  // Calculate positions for all 4 areas
  const areaPositions = useMemo(
    () => calculateAreaPositions(boardBounds.center, boardBounds.radius),
    [boardBounds.center, boardBounds.radius]
  );

  return (
    <group name="shared-elements-layout">
      {/* North: Objectives Area */}
      <group
        position={areaPositions.north.position.toArray()}
        rotation={[0, areaPositions.north.rotation, 0]}
      >
        <ObjectivesArea3D
          objectives={gameState.objectives}
          players={gameState.players}
          currentPlayerId={currentPlayerId}
          onObjectiveClick={onObjectiveClick}
          canScoreObjective={canScoreObjective}
          onSecretDeckDraw={onSecretObjectiveDraw}
        />
      </group>

      {/* South: Exploration Decks Area */}
      <group
        position={areaPositions.south.position.toArray()}
        rotation={[0, areaPositions.south.rotation, 0]}
      >
        <ExplorationArea3D
          explorationDecks={gameState.explorationDecks}
          onDraw={onExplorationDraw}
        />
      </group>

      {/* West: Card Decks Area */}
      <group
        position={areaPositions.west.position.toArray()}
        rotation={[0, areaPositions.west.rotation, 0]}
      >
        <CardDecksArea3D
          actionCardDeck={gameState.actionCardDeck}
          actionCardDiscard={gameState.actionCardDiscard}
          agendaDeck={gameState.agendaDeck}
          agendaDiscard={gameState.agendaDiscard}
          relicDeck={gameState.relicDeck ?? []}
          relicDiscard={gameState.relicDiscard ?? []}
          onActionCardDraw={onActionCardDraw}
          onAgendaReveal={onAgendaReveal}
          onRelicDraw={onRelicDraw}
          gamePhase={gameState.phase}
          subPhase={gameState.subPhase}
        />
      </group>

      {/* East: Game Status Area */}
      <group
        position={areaPositions.east.position.toArray()}
        rotation={[0, areaPositions.east.rotation, 0]}
      >
        <GameStatusArea3D
          laws={gameState.laws}
          speakerId={gameState.speakerId}
          custodiansTaken={gameState.custodiansTaken}
          players={gameState.players}
          currentPhase={gameState.phase}
          round={gameState.round}
        />
      </group>
    </group>
  );
}
