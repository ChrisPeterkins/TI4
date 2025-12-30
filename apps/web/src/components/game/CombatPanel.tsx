'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type {
  GameState,
  PlayerState,
  CombatInstance,
  DiceRoll,
  UnitInstance,
  HitAssignment,
  HexCoord,
} from '@ti4/shared';

// Dynamically import DiceRoller to avoid SSR issues with Three.js
const DiceRoller = dynamic(
  () => import('@/components/game-board-3d/dice').then(mod => mod.DiceRoller),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center">
        <div className="text-white text-xl">Loading dice...</div>
      </div>
    ),
  }
);

interface CombatPanelProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  currentPlayerId: string | null;
  onAssignHits: (assignments: HitAssignment[]) => void;
  onAnnounceRetreat: (retreating: boolean, retreatSystem?: HexCoord) => void;
  onAdvanceCombat: () => void;
  diceRolls?: {
    attackerRolls: DiceRoll[];
    defenderRolls: DiceRoll[];
  };
}

export function CombatPanel({
  gameState,
  currentPlayer,
  currentPlayerId,
  onAssignHits,
  onAnnounceRetreat,
  onAdvanceCombat,
  diceRolls,
}: CombatPanelProps) {
  const combat = gameState.activeCombat;
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [diceRollingComplete, setDiceRollingComplete] = useState(false);

  if (!combat) return null;

  const isAttacker = currentPlayerId === combat.attackerId;
  const isDefender = currentPlayerId === combat.defenderId;
  const isParticipant = isAttacker || isDefender;

  const attacker = gameState.players.find(p => p.id === combat.attackerId);
  const defender = gameState.players.find(p => p.id === combat.defenderId);

  // Handle dice roller completion
  const handleDiceRollComplete = () => {
    setShowDiceRoller(false);
    setDiceRollingComplete(true);
    // Combat state will transition to assignment phase
  };

  // Show 3D dice roller when dice rolls are available and combat is in roll phase
  if (showDiceRoller && diceRolls && attacker && defender) {
    return (
      <DiceRoller
        attackerRolls={diceRolls.attackerRolls}
        defenderRolls={diceRolls.defenderRolls}
        attackerColor={attacker.color}
        defenderColor={defender.color}
        onComplete={handleDiceRollComplete}
      />
    );
  }

  const tile = gameState.map.tiles.find(t => t.id === combat.systemId);

  // Get units for each side from the tile
  const attackerUnits = useMemo(() => {
    if (!tile) return [];
    return tile.units.filter(u => combat.attackerUnits.includes(u.id));
  }, [tile, combat.attackerUnits]);

  const defenderUnits = useMemo(() => {
    if (!tile) return [];
    return tile.units.filter(u => combat.defenderUnits.includes(u.id));
  }, [tile, combat.defenderUnits]);

  // Calculate pending hits for current player
  const myPendingHits = isAttacker
    ? combat.pendingHits.attacker
    : isDefender
    ? combat.pendingHits.defender
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-xl border border-red-500/50 shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-900/50 px-6 py-4 border-b border-red-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Space Combat</h2>
                <p className="text-red-300 text-sm">
                  {tile?.position ? `System (${tile.position.q}, ${tile.position.r})` : 'Unknown System'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Round</span>
              <span className="text-2xl font-bold text-yellow-400">{combat.roundNumber}</span>
            </div>
          </div>
        </div>

        {/* Combat State Indicator */}
        <div className="bg-gray-800 px-6 py-2 border-b border-gray-700">
          <CombatStateIndicator state={combat.state} />
        </div>

        {/* Main Combat Area */}
        <div className="flex">
          {/* Attacker Side */}
          <div className="flex-1 p-6 border-r border-gray-700">
            <CombatSide
              label="Attacker"
              player={attacker}
              units={attackerUnits}
              pendingHits={combat.pendingHits.attacker}
              isCurrentPlayer={isAttacker}
              retreatAnnounced={combat.retreatAnnounced.attacker}
              diceRolls={diceRolls?.attackerRolls}
            />
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center w-16 bg-gray-800/50">
            <span className="text-2xl font-bold text-gray-500">VS</span>
          </div>

          {/* Defender Side */}
          <div className="flex-1 p-6">
            <CombatSide
              label="Defender"
              player={defender}
              units={defenderUnits}
              pendingHits={combat.pendingHits.defender}
              isCurrentPlayer={isDefender}
              retreatAnnounced={combat.retreatAnnounced.defender}
              diceRolls={diceRolls?.defenderRolls}
            />
          </div>
        </div>

        {/* Action Area */}
        <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
          <CombatActions
            combat={combat}
            isParticipant={isParticipant}
            isAttacker={isAttacker}
            isDefender={isDefender}
            myPendingHits={myPendingHits}
            myUnits={isAttacker ? attackerUnits : defenderUnits}
            currentPlayer={currentPlayer}
            gameState={gameState}
            onAssignHits={onAssignHits}
            onAnnounceRetreat={onAnnounceRetreat}
            onAdvanceCombat={onAdvanceCombat}
            onRollDice={() => setShowDiceRoller(true)}
          />
        </div>
      </div>
    </div>
  );
}

function CombatStateIndicator({ state }: { state: string }) {
  const stateInfo: Record<string, { label: string; color: string }> = {
    anti_fighter_barrage: { label: 'Anti-Fighter Barrage', color: 'text-orange-400' },
    announce_retreat: { label: 'Retreat Decision', color: 'text-yellow-400' },
    combat_round_roll: { label: 'Rolling Dice', color: 'text-blue-400' },
    combat_round_assign: { label: 'Assigning Hits', color: 'text-red-400' },
    combat_complete: { label: 'Combat Complete', color: 'text-green-400' },
  };

  const info = stateInfo[state] || { label: state, color: 'text-gray-400' };

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`w-2 h-2 rounded-full ${info.color.replace('text-', 'bg-')} animate-pulse`} />
      <span className={`font-medium ${info.color}`}>{info.label}</span>
    </div>
  );
}

interface CombatSideProps {
  label: string;
  player?: PlayerState;
  units: UnitInstance[];
  pendingHits: number;
  isCurrentPlayer: boolean;
  retreatAnnounced: boolean;
  diceRolls?: DiceRoll[];
}

function CombatSide({
  label,
  player,
  units,
  pendingHits,
  isCurrentPlayer,
  retreatAnnounced,
  diceRolls,
}: CombatSideProps) {
  // Group units by type
  const unitGroups = useMemo(() => {
    const groups = new Map<string, UnitInstance[]>();
    for (const unit of units) {
      const existing = groups.get(unit.type) || [];
      existing.push(unit);
      groups.set(unit.type, existing);
    }
    return groups;
  }, [units]);

  // Group dice rolls by unit type
  const rollsByType = useMemo(() => {
    if (!diceRolls) return null;
    const groups = new Map<string, DiceRoll[]>();
    for (const roll of diceRolls) {
      const existing = groups.get(roll.unitType) || [];
      existing.push(roll);
      groups.set(roll.unitType, existing);
    }
    return groups;
  }, [diceRolls]);

  const totalHits = diceRolls?.filter(r => r.hit).length || 0;

  return (
    <div className={`${isCurrentPlayer ? 'bg-blue-900/20 rounded-lg p-2 -m-2' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm uppercase tracking-wide">{label}</span>
          {isCurrentPlayer && (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">You</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: getColorHex(player?.color || 'gray') }}
          />
          <span className="font-medium text-white">{player?.name || 'Unknown'}</span>
        </div>
      </div>

      {retreatAnnounced && (
        <div className="mb-3 px-3 py-1.5 bg-yellow-600/20 border border-yellow-500/50 rounded text-sm text-yellow-400 text-center">
          Retreat Announced
        </div>
      )}

      {/* Units */}
      <div className="space-y-2 mb-4">
        {Array.from(unitGroups.entries()).map(([type, typeUnits]) => (
          <div key={type} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="capitalize text-white">{formatUnitType(type)}</span>
              <span className="text-gray-500">x{typeUnits.length}</span>
            </div>
            <div className="flex items-center gap-1">
              {typeUnits.map(unit => (
                <div
                  key={unit.id}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs ${
                    unit.damaged
                      ? 'bg-orange-600/50 border border-orange-500'
                      : 'bg-gray-700 border border-gray-600'
                  }`}
                  title={unit.damaged ? 'Damaged' : 'Healthy'}
                >
                  {unit.damaged ? '!' : ''}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dice Rolls */}
      {rollsByType && rollsByType.size > 0 && (
        <div className="space-y-2 mb-4">
          <div className="text-sm text-gray-400 mb-1">Dice Rolls:</div>
          {Array.from(rollsByType.entries()).map(([type, rolls]) => (
            <div key={type} className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 capitalize w-20">{formatUnitType(type)}:</span>
              {rolls.map((roll, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded flex items-center justify-center font-bold ${
                    roll.hit
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                  title={`Roll: ${roll.roll}, Combat Value: ${roll.combatValue}`}
                >
                  {roll.roll}
                </div>
              ))}
            </div>
          ))}
          <div className="text-center mt-2">
            <span className="text-sm text-gray-400">Total Hits: </span>
            <span className="font-bold text-green-400">{totalHits}</span>
          </div>
        </div>
      )}

      {/* Pending Hits */}
      {pendingHits > 0 && (
        <div className="bg-red-900/30 border border-red-500/50 rounded px-4 py-3 text-center">
          <span className="text-red-400 font-medium">
            {pendingHits} Hit{pendingHits !== 1 ? 's' : ''} to Assign
          </span>
        </div>
      )}
    </div>
  );
}

interface CombatActionsProps {
  combat: CombatInstance;
  isParticipant: boolean;
  isAttacker: boolean;
  isDefender: boolean;
  myPendingHits: number;
  myUnits: UnitInstance[];
  currentPlayer: PlayerState | null;
  gameState: GameState;
  onAssignHits: (assignments: HitAssignment[]) => void;
  onAnnounceRetreat: (retreating: boolean, retreatSystem?: HexCoord) => void;
  onAdvanceCombat: () => void;
  onRollDice: () => void;
}

function CombatActions({
  combat,
  isParticipant,
  isAttacker,
  isDefender,
  myPendingHits,
  myUnits,
  currentPlayer,
  gameState,
  onAssignHits,
  onAnnounceRetreat,
  onAdvanceCombat,
  onRollDice,
}: CombatActionsProps) {
  const [hitAssignments, setHitAssignments] = useState<Map<string, 'sustain' | 'destroy'>>(new Map());

  if (!isParticipant) {
    return (
      <div className="text-center text-gray-400">
        Spectating combat...
      </div>
    );
  }

  // Announce Retreat Phase
  if (combat.state === 'announce_retreat') {
    const canRetreat = isAttacker || combat.roundNumber > 1;
    const alreadyAnnounced = isAttacker ? combat.retreatAnnounced.attacker : combat.retreatAnnounced.defender;

    if (alreadyAnnounced) {
      return (
        <div className="text-center text-yellow-400">
          You have announced retreat. Waiting for opponent...
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => onAnnounceRetreat(false)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-white transition-colors"
        >
          Continue Fighting
        </button>
        {canRetreat ? (
          <button
            onClick={() => {
              // For now, just announce retreat - in full implementation, would show system picker
              // TODO: Show retreat system selection UI
              onAnnounceRetreat(true, { q: 0, r: 0 }); // Placeholder
            }}
            className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-medium text-white transition-colors"
          >
            Announce Retreat
          </button>
        ) : (
          <span className="text-gray-500 text-sm">(Cannot retreat on round 1)</span>
        )}
      </div>
    );
  }

  // Combat Roll Phase
  if (combat.state === 'combat_round_roll') {
    return (
      <div className="text-center">
        <button
          onClick={() => {
            onRollDice(); // Show 3D dice roller
            onAdvanceCombat(); // Also send action to server to roll dice
          }}
          className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-white text-lg transition-colors animate-pulse"
        >
          Roll Combat Dice
        </button>
      </div>
    );
  }

  // Hit Assignment Phase
  if (combat.state === 'combat_round_assign' && myPendingHits > 0) {
    const assignedCount = Array.from(hitAssignments.values()).length;
    const canSubmit = assignedCount >= myPendingHits;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <span className="text-red-400">
            Assign {myPendingHits} hit{myPendingHits !== 1 ? 's' : ''} to your units
          </span>
          <span className="text-gray-500 ml-2">
            ({assignedCount} / {myPendingHits} assigned)
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {myUnits.map(unit => {
            const assignment = hitAssignments.get(unit.id);
            const canSustain = !unit.damaged && canUnitTypeSustain(unit.type);

            return (
              <div
                key={unit.id}
                className={`flex items-center gap-2 px-3 py-2 rounded border ${
                  assignment
                    ? assignment === 'sustain'
                      ? 'bg-orange-600/30 border-orange-500'
                      : 'bg-red-600/30 border-red-500'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <span className="capitalize text-white text-sm">{formatUnitType(unit.type)}</span>
                {unit.damaged && <span className="text-xs text-orange-400">(dmg)</span>}

                <div className="flex gap-1">
                  {canSustain && (
                    <button
                      onClick={() => {
                        const newAssignments = new Map(hitAssignments);
                        if (assignment === 'sustain') {
                          newAssignments.delete(unit.id);
                        } else {
                          newAssignments.set(unit.id, 'sustain');
                        }
                        setHitAssignments(newAssignments);
                      }}
                      className={`px-2 py-1 text-xs rounded ${
                        assignment === 'sustain'
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-orange-700'
                      }`}
                    >
                      Sustain
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const newAssignments = new Map(hitAssignments);
                      if (assignment === 'destroy') {
                        newAssignments.delete(unit.id);
                      } else {
                        newAssignments.set(unit.id, 'destroy');
                      }
                      setHitAssignments(newAssignments);
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      assignment === 'destroy'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-red-700'
                    }`}
                  >
                    Destroy
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              const assignments: HitAssignment[] = Array.from(hitAssignments.entries()).map(
                ([unitId, type]) => ({
                  unitId,
                  destroyed: type === 'destroy',
                  sustainDamage: type === 'sustain',
                })
              );
              onAssignHits(assignments);
              setHitAssignments(new Map());
            }}
            disabled={!canSubmit}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              canSubmit
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm Hit Assignments
          </button>
        </div>
      </div>
    );
  }

  // Waiting for opponent
  if (combat.state === 'combat_round_assign' && myPendingHits === 0) {
    return (
      <div className="text-center text-gray-400">
        Waiting for opponent to assign hits...
      </div>
    );
  }

  // Combat complete
  if (combat.state === 'combat_complete') {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-green-400 mb-2">Combat Complete!</div>
        <button
          onClick={onAdvanceCombat}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-white transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="text-center text-gray-400">
      Waiting...
    </div>
  );
}

function formatUnitType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function canUnitTypeSustain(type: string): boolean {
  const sustainUnits = ['dreadnought', 'war_sun', 'carrier', 'flagship', 'mech'];
  return sustainUnits.includes(type);
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
    gray: '#6b7280',
  };
  return colors[color] || '#6b7280';
}
