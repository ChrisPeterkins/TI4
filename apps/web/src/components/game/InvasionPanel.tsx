'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type {
  GameState,
  PlayerState,
  UnitInstance,
  HitAssignment,
  DiceRoll,
  InvasionState,
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

interface InvasionPanelProps {
  gameState: GameState;
  currentPlayer: PlayerState | null;
  currentPlayerId: string | null;
  onSelectTargets: (planetIds: string[]) => void;
  onCommitGroundForces: (assignments: { unitId: string; planetId: string }[]) => void;
  onRollBombardment: (planetId: string) => void;
  onSkipBombardment: () => void;
  onAssignBombardmentHits: (assignments: HitAssignment[]) => void;
  onAssignSpaceCannonHits: (assignments: HitAssignment[]) => void;
  onSkipInvasion: () => void;
  onAdvanceCombat: () => void;
  onAssignGroundCombatHits: (assignments: HitAssignment[]) => void;
  diceRolls?: {
    attackerRolls: DiceRoll[];
    defenderRolls: DiceRoll[];
  };
}

export function InvasionPanel({
  gameState,
  currentPlayer,
  currentPlayerId,
  onSelectTargets,
  onCommitGroundForces,
  onRollBombardment,
  onSkipBombardment,
  onAssignBombardmentHits,
  onAssignSpaceCannonHits,
  onSkipInvasion,
  onAdvanceCombat,
  onAssignGroundCombatHits,
  diceRolls,
}: InvasionPanelProps) {
  const invasionPhase = gameState.invasionPhase;
  const [showDiceRoller, setShowDiceRoller] = useState(false);
  const [selectedPlanets, setSelectedPlanets] = useState<string[]>([]);
  const [forceAssignments, setForceAssignments] = useState<Map<string, string>>(new Map()); // unitId -> planetId

  if (!invasionPhase || gameState.subPhase !== 'tactical_invasion') {
    return null;
  }

  const activatedTile = gameState.activatedSystem
    ? gameState.map.tiles.find(
        t => t.position.q === gameState.activatedSystem?.q && t.position.r === gameState.activatedSystem?.r
      )
    : null;

  if (!activatedTile) return null;

  const isAttacker = currentPlayerId === gameState.activePlayerId;
  const attacker = gameState.players.find(p => p.id === gameState.activePlayerId);

  // Current planet being invaded
  const currentPlanetId = invasionPhase.targetPlanets[invasionPhase.currentPlanetIndex];
  const currentPlanet = activatedTile.planets.find(p => p.planetId === currentPlanetId);

  // Handle dice roller completion
  const handleDiceRollComplete = () => {
    setShowDiceRoller(false);
  };

  // Show 3D dice roller when appropriate
  if (showDiceRoller && diceRolls && attacker) {
    const defender = gameState.players.find(p => p.id !== gameState.activePlayerId);
    return (
      <DiceRoller
        attackerRolls={diceRolls.attackerRolls}
        defenderRolls={diceRolls.defenderRolls}
        attackerColor={attacker.color}
        defenderColor={defender?.color || 'gray'}
        onComplete={handleDiceRollComplete}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-gray-900 rounded-xl border border-amber-500/50 shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-900/50 px-6 py-4 border-b border-amber-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Invasion</h2>
                <p className="text-amber-300 text-sm">
                  {activatedTile?.position ? `System (${activatedTile.position.q}, ${activatedTile.position.r})` : 'Unknown System'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Planet</span>
              <span className="text-2xl font-bold text-yellow-400">
                {invasionPhase.currentPlanetIndex + 1}/{invasionPhase.targetPlanets.length || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Invasion State Indicator */}
        <div className="bg-gray-800 px-6 py-2 border-b border-gray-700">
          <InvasionStateIndicator state={invasionPhase.currentStep} />
        </div>

        {/* Main Content */}
        <div className="p-6">
          {invasionPhase.currentStep === 'select_planets' && (
            <SelectPlanetsView
              tile={activatedTile}
              playerId={currentPlayerId}
              selectedPlanets={selectedPlanets}
              onSelectPlanet={(planetId) => {
                setSelectedPlanets(prev =>
                  prev.includes(planetId)
                    ? prev.filter(id => id !== planetId)
                    : [...prev, planetId]
                );
              }}
              onConfirm={() => onSelectTargets(selectedPlanets)}
              onSkip={onSkipInvasion}
              isAttacker={isAttacker}
            />
          )}

          {invasionPhase.currentStep === 'bombardment' && (
            <BombardmentView
              gameState={gameState}
              currentPlanet={currentPlanet}
              tile={activatedTile}
              playerId={currentPlayerId}
              isAttacker={isAttacker}
              pendingHits={invasionPhase.pendingBombardmentHits}
              onRoll={() => {
                if (currentPlanetId) {
                  onRollBombardment(currentPlanetId);
                  setShowDiceRoller(true);
                }
              }}
              onSkip={onSkipBombardment}
              onAssignHits={onAssignBombardmentHits}
              diceRolls={diceRolls?.attackerRolls}
            />
          )}

          {invasionPhase.currentStep === 'commit_ground_forces' && (
            <CommitGroundForcesView
              tile={activatedTile}
              targetPlanets={invasionPhase.targetPlanets}
              playerId={currentPlayerId}
              forceAssignments={forceAssignments}
              onAssign={(unitId, planetId) => {
                setForceAssignments(prev => {
                  const next = new Map(prev);
                  if (next.get(unitId) === planetId) {
                    next.delete(unitId);
                  } else {
                    next.set(unitId, planetId);
                  }
                  return next;
                });
              }}
              onConfirm={() => {
                const assignments = Array.from(forceAssignments.entries()).map(([unitId, planetId]) => ({
                  unitId,
                  planetId,
                }));
                onCommitGroundForces(assignments);
                setForceAssignments(new Map());
              }}
              isAttacker={isAttacker}
            />
          )}

          {invasionPhase.currentStep === 'space_cannon_defense' && (
            <SpaceCannonDefenseView
              gameState={gameState}
              currentPlanet={currentPlanet}
              tile={activatedTile}
              playerId={currentPlayerId}
              isAttacker={isAttacker}
              pendingHits={invasionPhase.pendingSpaceCannonHits}
              onAssignHits={onAssignSpaceCannonHits}
              diceRolls={diceRolls?.defenderRolls}
            />
          )}

          {invasionPhase.currentStep === 'ground_combat' && (
            <GroundCombatView
              gameState={gameState}
              currentPlanet={currentPlanet}
              tile={activatedTile}
              playerId={currentPlayerId}
              isAttacker={isAttacker}
              onAssignHits={onAssignGroundCombatHits}
              onAdvanceCombat={() => {
                setShowDiceRoller(true);
                onAdvanceCombat();
              }}
              diceRolls={diceRolls}
            />
          )}

          {invasionPhase.currentStep === 'establish_control' && (
            <EstablishControlView
              gameState={gameState}
              currentPlanet={currentPlanet}
              onContinue={onAdvanceCombat}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function InvasionStateIndicator({ state }: { state: InvasionState }) {
  const stateInfo: Record<InvasionState, { label: string; color: string }> = {
    select_planets: { label: 'Select Invasion Targets', color: 'text-blue-400' },
    bombardment: { label: 'Bombardment', color: 'text-orange-400' },
    commit_ground_forces: { label: 'Commit Ground Forces', color: 'text-green-400' },
    space_cannon_defense: { label: 'Space Cannon Defense', color: 'text-purple-400' },
    ground_combat: { label: 'Ground Combat', color: 'text-red-400' },
    establish_control: { label: 'Establish Control', color: 'text-yellow-400' },
  };

  const info = stateInfo[state] || { label: state, color: 'text-gray-400' };

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`w-2 h-2 rounded-full ${info.color.replace('text-', 'bg-')} animate-pulse`} />
      <span className={`font-medium ${info.color}`}>{info.label}</span>
    </div>
  );
}

interface SelectPlanetsViewProps {
  tile: NonNullable<ReturnType<typeof Array.prototype.find>>;
  playerId: string | null;
  selectedPlanets: string[];
  onSelectPlanet: (planetId: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
  isAttacker: boolean;
}

function SelectPlanetsView({
  tile,
  playerId,
  selectedPlanets,
  onSelectPlanet,
  onConfirm,
  onSkip,
  isAttacker,
}: SelectPlanetsViewProps) {
  // Get invadable planets (enemy controlled or uncontrolled)
  const invadablePlanets = useMemo(() => {
    return (tile as any).planets.filter((planet: any) =>
      planet.controllerId !== playerId
    );
  }, [tile, playerId]);

  if (!isAttacker) {
    return (
      <div className="text-center text-gray-400">
        Waiting for attacker to select invasion targets...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-300">
        Select planets to invade:
      </p>

      <div className="grid grid-cols-2 gap-4">
        {invadablePlanets.map((planet: any) => {
          const isSelected = selectedPlanets.includes(planet.planetId);
          const defenderUnits = planet.units.filter((u: any) => u.ownerId !== playerId);

          return (
            <button
              key={planet.planetId}
              onClick={() => onSelectPlanet(planet.planetId)}
              className={`p-4 rounded-lg border transition-colors ${
                isSelected
                  ? 'bg-amber-600/30 border-amber-500'
                  : 'bg-gray-800 border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="font-medium text-white">{planet.name || planet.planetId}</div>
              <div className="text-sm text-gray-400 mt-1">
                {planet.controllerId ? `Controlled by ${planet.controllerId}` : 'Uncontrolled'}
              </div>
              {defenderUnits.length > 0 && (
                <div className="text-sm text-red-400 mt-1">
                  Defenders: {defenderUnits.length} units
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={onSkip}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-white transition-colors"
        >
          Skip Invasion
        </button>
        <button
          onClick={onConfirm}
          disabled={selectedPlanets.length === 0}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            selectedPlanets.length > 0
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Invade Selected ({selectedPlanets.length})
        </button>
      </div>
    </div>
  );
}

interface BombardmentViewProps {
  gameState: GameState;
  currentPlanet: any;
  tile: any;
  playerId: string | null;
  isAttacker: boolean;
  pendingHits: number;
  onRoll: () => void;
  onSkip: () => void;
  onAssignHits: (assignments: HitAssignment[]) => void;
  diceRolls?: DiceRoll[];
}

function BombardmentView({
  gameState,
  currentPlanet,
  tile,
  playerId,
  isAttacker,
  pendingHits,
  onRoll,
  onSkip,
  onAssignHits,
  diceRolls,
}: BombardmentViewProps) {
  const [hitAssignments, setHitAssignments] = useState<Map<string, 'sustain' | 'destroy'>>(new Map());

  // Get bombardment units (ships with bombardment ability in space)
  const bombardmentUnits = useMemo(() => {
    return tile.units.filter((u: UnitInstance) =>
      u.ownerId === gameState.activePlayerId &&
      ['dreadnought', 'war_sun'].includes(u.type)
    );
  }, [tile, gameState.activePlayerId]);

  // Check for Planetary Shield
  const hasPlanetaryShield = useMemo(() => {
    if (!currentPlanet) return false;
    return currentPlanet.units.some((u: UnitInstance) => u.type === 'pds');
  }, [currentPlanet]);

  // Defender's ground forces
  const defenderGroundForces = useMemo(() => {
    if (!currentPlanet) return [];
    return currentPlanet.units.filter((u: UnitInstance) =>
      u.ownerId !== gameState.activePlayerId &&
      ['infantry', 'mech'].includes(u.type)
    );
  }, [currentPlanet, gameState.activePlayerId]);

  // If hits need to be assigned by defender
  if (pendingHits > 0 && !isAttacker) {
    const assignedCount = Array.from(hitAssignments.values()).length;
    const canSubmit = assignedCount >= pendingHits;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <span className="text-red-400 text-lg">
            Assign {pendingHits} bombardment hit{pendingHits !== 1 ? 's' : ''} to your ground forces
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {defenderGroundForces.map((unit: UnitInstance) => {
            const assignment = hitAssignments.get(unit.id);
            const canSustain = !unit.damaged && unit.type === 'mech';

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

  // Show bombardment interface for attacker
  if (isAttacker) {
    if (hasPlanetaryShield) {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-purple-400 text-lg font-medium mb-2">Planetary Shield Active!</div>
            <p className="text-gray-400">
              The planet has PDS with Planetary Shield. Bombardment is blocked.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={onSkip}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium text-white transition-colors"
            >
              Continue to Ground Forces
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <div className="text-amber-400 text-lg font-medium">
            Bombarding: {currentPlanet?.name || currentPlanet?.planetId}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Bombardment Units */}
          <div>
            <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">Your Bombardment Units</h3>
            <div className="space-y-2">
              {bombardmentUnits.map((unit: UnitInstance) => (
                <div key={unit.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                  <span className="capitalize text-white">{formatUnitType(unit.type)}</span>
                  <span className="text-orange-400 text-sm">
                    {unit.type === 'war_sun' ? 'Bombardment 3 (3 dice)' : 'Bombardment 5 (1 die)'}
                  </span>
                </div>
              ))}
              {bombardmentUnits.length === 0 && (
                <div className="text-gray-500 text-center py-4">No bombardment units</div>
              )}
            </div>
          </div>

          {/* Defender Ground Forces */}
          <div>
            <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">Defender's Ground Forces</h3>
            <div className="space-y-2">
              {defenderGroundForces.map((unit: UnitInstance) => (
                <div key={unit.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                  <span className="capitalize text-white">{formatUnitType(unit.type)}</span>
                  {unit.damaged && <span className="text-orange-400 text-xs">Damaged</span>}
                </div>
              ))}
              {defenderGroundForces.length === 0 && (
                <div className="text-gray-500 text-center py-4">No ground forces</div>
              )}
            </div>
          </div>
        </div>

        {/* Dice Rolls Display */}
        {diceRolls && diceRolls.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mt-4">
            <div className="text-sm text-gray-400 mb-2">Bombardment Rolls:</div>
            <div className="flex flex-wrap gap-2">
              {diceRolls.map((roll, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded flex items-center justify-center font-bold ${
                    roll.hit
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                  title={`Roll: ${roll.roll}, Value: ${roll.combatValue}`}
                >
                  {roll.roll}
                </div>
              ))}
            </div>
            <div className="text-center mt-2">
              <span className="text-sm text-gray-400">Total Hits: </span>
              <span className="font-bold text-orange-400">{diceRolls.filter(r => r.hit).length}</span>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={onSkip}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-white transition-colors"
          >
            Skip Bombardment
          </button>
          {bombardmentUnits.length > 0 && (
            <button
              onClick={onRoll}
              className="px-8 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg font-bold text-white text-lg transition-colors animate-pulse"
            >
              Roll Bombardment
            </button>
          )}
        </div>
      </div>
    );
  }

  // Waiting view for defender
  return (
    <div className="text-center text-gray-400">
      Waiting for bombardment...
    </div>
  );
}

interface CommitGroundForcesViewProps {
  tile: any;
  targetPlanets: string[];
  playerId: string | null;
  forceAssignments: Map<string, string>;
  onAssign: (unitId: string, planetId: string) => void;
  onConfirm: () => void;
  isAttacker: boolean;
}

function CommitGroundForcesView({
  tile,
  targetPlanets,
  playerId,
  forceAssignments,
  onAssign,
  onConfirm,
  isAttacker,
}: CommitGroundForcesViewProps) {
  // Get ground forces in space (on carriers)
  const availableGroundForces = useMemo(() => {
    // Ground forces in space area of the tile
    const spaceGroundForces = tile.units.filter((u: UnitInstance) =>
      u.ownerId === playerId &&
      ['infantry', 'mech'].includes(u.type)
    );

    // Also check carriers for capacity
    // For now, assume ground forces listed in space are available
    return spaceGroundForces;
  }, [tile, playerId]);

  const planets = useMemo(() => {
    return tile.planets.filter((p: any) => targetPlanets.includes(p.planetId));
  }, [tile, targetPlanets]);

  if (!isAttacker) {
    return (
      <div className="text-center text-gray-400">
        Waiting for attacker to commit ground forces...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-gray-300 mb-4">
        Assign ground forces to planets:
      </p>

      <div className="grid grid-cols-2 gap-6">
        {/* Available Ground Forces */}
        <div>
          <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">Available Ground Forces</h3>
          <div className="space-y-2">
            {availableGroundForces.map((unit: UnitInstance) => {
              const assignedPlanet = forceAssignments.get(unit.id);
              const planet = assignedPlanet ? planets.find((p: any) => p.planetId === assignedPlanet) : null;

              return (
                <div key={unit.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="capitalize text-white">{formatUnitType(unit.type)}</span>
                    {unit.damaged && <span className="text-orange-400 text-xs">(dmg)</span>}
                  </div>
                  {assignedPlanet && (
                    <span className="text-amber-400 text-sm">
                      → {planet?.name || assignedPlanet}
                    </span>
                  )}
                </div>
              );
            })}
            {availableGroundForces.length === 0 && (
              <div className="text-gray-500 text-center py-4">No ground forces available</div>
            )}
          </div>
        </div>

        {/* Target Planets */}
        <div>
          <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">Target Planets</h3>
          <div className="space-y-2">
            {planets.map((planet: any) => {
              const assignedUnits = Array.from(forceAssignments.entries())
                .filter(([_, pId]) => pId === planet.planetId)
                .map(([uId]) => availableGroundForces.find((u: UnitInstance) => u.id === uId))
                .filter(Boolean);

              return (
                <div key={planet.planetId} className="bg-gray-800 rounded p-3">
                  <div className="font-medium text-white">{planet.name || planet.planetId}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Assigned: {assignedUnits.length} units
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {availableGroundForces.map((unit: UnitInstance) => {
                      const isAssignedHere = forceAssignments.get(unit.id) === planet.planetId;
                      return (
                        <button
                          key={unit.id}
                          onClick={() => onAssign(unit.id, planet.planetId)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            isAssignedHere
                              ? 'bg-amber-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {formatUnitType(unit.type)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={onConfirm}
          disabled={forceAssignments.size === 0}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            forceAssignments.size > 0
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Commit Ground Forces ({forceAssignments.size})
        </button>
      </div>
    </div>
  );
}

interface SpaceCannonDefenseViewProps {
  gameState: GameState;
  currentPlanet: any;
  tile: any;
  playerId: string | null;
  isAttacker: boolean;
  pendingHits: number;
  onAssignHits: (assignments: HitAssignment[]) => void;
  diceRolls?: DiceRoll[];
}

function SpaceCannonDefenseView({
  gameState,
  currentPlanet,
  tile,
  playerId,
  isAttacker,
  pendingHits,
  onAssignHits,
  diceRolls,
}: SpaceCannonDefenseViewProps) {
  const [hitAssignments, setHitAssignments] = useState<Map<string, 'sustain' | 'destroy'>>(new Map());

  // Get committed ground forces (attacker's units on the planet)
  const committedGroundForces = useMemo(() => {
    if (!currentPlanet) return [];
    return currentPlanet.units.filter((u: UnitInstance) =>
      u.ownerId === gameState.activePlayerId &&
      ['infantry', 'mech'].includes(u.type)
    );
  }, [currentPlanet, gameState.activePlayerId]);

  // Get PDS units
  const pdsUnits = useMemo(() => {
    if (!currentPlanet) return [];
    return currentPlanet.units.filter((u: UnitInstance) =>
      u.ownerId !== gameState.activePlayerId &&
      u.type === 'pds'
    );
  }, [currentPlanet, gameState.activePlayerId]);

  // Attacker needs to assign space cannon hits
  if (pendingHits > 0 && isAttacker) {
    const assignedCount = Array.from(hitAssignments.values()).length;
    const canSubmit = assignedCount >= pendingHits;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <span className="text-purple-400 text-lg">
            Assign {pendingHits} Space Cannon hit{pendingHits !== 1 ? 's' : ''} to your ground forces
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {committedGroundForces.map((unit: UnitInstance) => {
            const assignment = hitAssignments.get(unit.id);
            const canSustain = !unit.damaged && unit.type === 'mech';

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

  // Display Space Cannon firing
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-purple-400 text-lg font-medium">Space Cannon Defense</div>
        <p className="text-gray-400 text-sm mt-1">
          PDS fires at committed ground forces
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* PDS Units */}
        <div>
          <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">Defender's PDS</h3>
          <div className="space-y-2">
            {pdsUnits.map((unit: UnitInstance) => (
              <div key={unit.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                <span className="text-white">PDS</span>
                <span className="text-purple-400 text-sm">Space Cannon 6</span>
              </div>
            ))}
            {pdsUnits.length === 0 && (
              <div className="text-gray-500 text-center py-4">No PDS units</div>
            )}
          </div>
        </div>

        {/* Committed Ground Forces */}
        <div>
          <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">Committed Ground Forces</h3>
          <div className="space-y-2">
            {committedGroundForces.map((unit: UnitInstance) => (
              <div key={unit.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                <span className="capitalize text-white">{formatUnitType(unit.type)}</span>
                {unit.damaged && <span className="text-orange-400 text-xs">Damaged</span>}
              </div>
            ))}
            {committedGroundForces.length === 0 && (
              <div className="text-gray-500 text-center py-4">No ground forces</div>
            )}
          </div>
        </div>
      </div>

      {/* Dice Rolls Display */}
      {diceRolls && diceRolls.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 mt-4">
          <div className="text-sm text-gray-400 mb-2">Space Cannon Rolls:</div>
          <div className="flex flex-wrap gap-2">
            {diceRolls.map((roll, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded flex items-center justify-center font-bold ${
                  roll.hit
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
                title={`Roll: ${roll.roll}, Value: ${roll.combatValue}`}
              >
                {roll.roll}
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <span className="text-sm text-gray-400">Total Hits: </span>
            <span className="font-bold text-purple-400">{diceRolls.filter(r => r.hit).length}</span>
          </div>
        </div>
      )}

      {pdsUnits.length === 0 && (
        <div className="text-center text-gray-400">
          No PDS - skipping Space Cannon Defense...
        </div>
      )}
    </div>
  );
}

interface GroundCombatViewProps {
  gameState: GameState;
  currentPlanet: any;
  tile: any;
  playerId: string | null;
  isAttacker: boolean;
  onAssignHits: (assignments: HitAssignment[]) => void;
  onAdvanceCombat: () => void;
  diceRolls?: {
    attackerRolls: DiceRoll[];
    defenderRolls: DiceRoll[];
  };
}

function GroundCombatView({
  gameState,
  currentPlanet,
  tile,
  playerId,
  isAttacker,
  onAssignHits,
  onAdvanceCombat,
  diceRolls,
}: GroundCombatViewProps) {
  const [hitAssignments, setHitAssignments] = useState<Map<string, 'sustain' | 'destroy'>>(new Map());

  const combat = gameState.activeCombat;

  // Get ground forces for each side
  const attackerGroundForces = useMemo(() => {
    if (!currentPlanet) return [];
    return currentPlanet.units.filter((u: UnitInstance) =>
      u.ownerId === gameState.activePlayerId &&
      ['infantry', 'mech'].includes(u.type)
    );
  }, [currentPlanet, gameState.activePlayerId]);

  const defenderGroundForces = useMemo(() => {
    if (!currentPlanet) return [];
    return currentPlanet.units.filter((u: UnitInstance) =>
      u.ownerId !== gameState.activePlayerId &&
      ['infantry', 'mech'].includes(u.type)
    );
  }, [currentPlanet, gameState.activePlayerId]);

  const myUnits = isAttacker ? attackerGroundForces : defenderGroundForces;
  const myPendingHits = combat
    ? isAttacker
      ? combat.pendingHits.attacker
      : combat.pendingHits.defender
    : 0;

  // Hit assignment phase
  if (combat?.state === 'combat_round_assign' && myPendingHits > 0) {
    const assignedCount = Array.from(hitAssignments.values()).length;
    const canSubmit = assignedCount >= myPendingHits;

    return (
      <div className="space-y-4">
        <div className="text-center">
          <span className="text-red-400 text-lg">
            Assign {myPendingHits} hit{myPendingHits !== 1 ? 's' : ''} to your ground forces
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {myUnits.map((unit: UnitInstance) => {
            const assignment = hitAssignments.get(unit.id);
            const canSustain = !unit.damaged && unit.type === 'mech';

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

  // Main combat view
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="text-red-400 text-lg font-medium">Ground Combat</div>
        <p className="text-gray-400 text-sm mt-1">
          {currentPlanet?.name || currentPlanet?.planetId} - Round {combat?.roundNumber || 1}
        </p>
        <p className="text-yellow-400 text-xs mt-1">
          No retreat allowed! Defender wins on draw.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Attacker Side */}
        <div className={isAttacker ? 'bg-blue-900/20 rounded-lg p-3' : ''}>
          <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">
            Attacker {isAttacker && <span className="text-blue-400">(You)</span>}
          </h3>
          <div className="space-y-2">
            {attackerGroundForces.map((unit: UnitInstance) => (
              <div key={unit.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                <span className="capitalize text-white">{formatUnitType(unit.type)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">
                    Combat {unit.type === 'mech' ? '6' : '8'}
                  </span>
                  {unit.damaged && <span className="text-orange-400 text-xs">Damaged</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Attacker Dice Rolls */}
          {diceRolls?.attackerRolls && diceRolls.attackerRolls.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {diceRolls.attackerRolls.map((roll, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${
                      roll.hit
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {roll.roll}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Hits: <span className="text-green-400">{diceRolls.attackerRolls.filter(r => r.hit).length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Defender Side */}
        <div className={!isAttacker ? 'bg-blue-900/20 rounded-lg p-3' : ''}>
          <h3 className="text-gray-400 text-sm uppercase tracking-wide mb-2">
            Defender {!isAttacker && <span className="text-blue-400">(You)</span>}
          </h3>
          <div className="space-y-2">
            {defenderGroundForces.map((unit: UnitInstance) => (
              <div key={unit.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-2">
                <span className="capitalize text-white">{formatUnitType(unit.type)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">
                    Combat {unit.type === 'mech' ? '6' : '8'}
                  </span>
                  {unit.damaged && <span className="text-orange-400 text-xs">Damaged</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Defender Dice Rolls */}
          {diceRolls?.defenderRolls && diceRolls.defenderRolls.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {diceRolls.defenderRolls.map((roll, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm ${
                      roll.hit
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {roll.roll}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Hits: <span className="text-green-400">{diceRolls.defenderRolls.filter(r => r.hit).length}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roll Button */}
      {combat?.state === 'combat_round_roll' && (
        <div className="text-center mt-6">
          <button
            onClick={onAdvanceCombat}
            className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-white text-lg transition-colors animate-pulse"
          >
            Roll Ground Combat Dice
          </button>
        </div>
      )}

      {/* Waiting for opponent */}
      {combat?.state === 'combat_round_assign' && myPendingHits === 0 && (
        <div className="text-center text-gray-400">
          Waiting for opponent to assign hits...
        </div>
      )}
    </div>
  );
}

interface EstablishControlViewProps {
  gameState: GameState;
  currentPlanet: any;
  onContinue: () => void;
}

function EstablishControlView({
  gameState,
  currentPlanet,
  onContinue,
}: EstablishControlViewProps) {
  // Determine winner (whoever has ground forces remaining)
  const attackerForces = currentPlanet?.units.filter((u: UnitInstance) =>
    u.ownerId === gameState.activePlayerId &&
    ['infantry', 'mech'].includes(u.type)
  ).length || 0;

  const defenderForces = currentPlanet?.units.filter((u: UnitInstance) =>
    u.ownerId !== gameState.activePlayerId &&
    ['infantry', 'mech'].includes(u.type)
  ).length || 0;

  const attackerWon = attackerForces > 0;
  const defenderWon = defenderForces > 0;
  const isDraw = attackerForces === 0 && defenderForces === 0;

  return (
    <div className="space-y-4 text-center">
      <div className="text-2xl font-bold mb-4">
        {attackerWon && (
          <span className="text-green-400">Planet Captured!</span>
        )}
        {defenderWon && (
          <span className="text-red-400">Invasion Repelled!</span>
        )}
        {isDraw && (
          <span className="text-yellow-400">Draw - Defender Retains Control</span>
        )}
      </div>

      <div className="text-gray-400">
        {currentPlanet?.name || currentPlanet?.planetId} is now controlled by{' '}
        <span className="text-white font-medium">
          {attackerWon ? 'Attacker' : 'Defender'}
        </span>
      </div>

      <button
        onClick={onContinue}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium text-white transition-colors mt-4"
      >
        Continue
      </button>
    </div>
  );
}

function formatUnitType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
