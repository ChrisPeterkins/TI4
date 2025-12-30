'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type {
  GameState,
  PlayerState,
  CombatInstance,
  DiceRoll,
  UnitInstance,
  UnitType,
  HitAssignment,
  HexCoord,
  CombatState,
} from '@ti4/shared';

// Dynamically import DiceRoller to avoid SSR issues
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

// Unit configurations for testing
const UNIT_CONFIGS: { type: UnitType; combat: number; dice: number; sustainDamage: boolean }[] = [
  { type: 'war_sun', combat: 3, dice: 3, sustainDamage: true },
  { type: 'flagship', combat: 5, dice: 1, sustainDamage: true },
  { type: 'dreadnought', combat: 5, dice: 1, sustainDamage: true },
  { type: 'carrier', combat: 9, dice: 1, sustainDamage: false },
  { type: 'cruiser', combat: 7, dice: 1, sustainDamage: false },
  { type: 'destroyer', combat: 9, dice: 1, sustainDamage: false },
  { type: 'fighter', combat: 9, dice: 1, sustainDamage: false },
];

type TestMode = 'setup' | 'dice_only' | 'combat_panel' | 'full_flow';

export default function CombatTestPage() {
  const [testMode, setTestMode] = useState<TestMode>('setup');
  const [showDiceRoller, setShowDiceRoller] = useState(false);

  // Unit counts for each side
  const [attackerUnits, setAttackerUnits] = useState<Record<UnitType, number>>({
    war_sun: 0,
    flagship: 0,
    dreadnought: 1,
    carrier: 1,
    cruiser: 2,
    destroyer: 1,
    fighter: 3,
    infantry: 0,
    mech: 0,
    pds: 0,
    space_dock: 0,
  });

  const [defenderUnits, setDefenderUnits] = useState<Record<UnitType, number>>({
    war_sun: 0,
    flagship: 0,
    dreadnought: 0,
    carrier: 2,
    cruiser: 1,
    destroyer: 2,
    fighter: 4,
    infantry: 0,
    mech: 0,
    pds: 0,
    space_dock: 0,
  });

  // Combat state for full flow testing
  const [combatState, setCombatState] = useState<CombatState>('combat_round_roll');
  const [combatRound, setCombatRound] = useState(1);

  // Generate dice rolls based on unit configuration
  const generateDiceRolls = (
    units: Record<UnitType, number>,
    side: 'attacker' | 'defender'
  ): DiceRoll[] => {
    const rolls: DiceRoll[] = [];

    for (const config of UNIT_CONFIGS) {
      const count = units[config.type] || 0;
      for (let i = 0; i < count; i++) {
        for (let d = 0; d < config.dice; d++) {
          const roll = Math.floor(Math.random() * 10) + 1;
          rolls.push({
            unitId: `${side}-${config.type}-${i}`,
            unitType: config.type,
            roll,
            combatValue: config.combat,
            hit: roll >= config.combat,
            modifiers: [],
          });
        }
      }
    }

    return rolls;
  };

  // Generate rolls when needed
  const [attackerRolls, setAttackerRolls] = useState<DiceRoll[]>([]);
  const [defenderRolls, setDefenderRolls] = useState<DiceRoll[]>([]);

  const rollDice = () => {
    setAttackerRolls(generateDiceRolls(attackerUnits, 'attacker'));
    setDefenderRolls(generateDiceRolls(defenderUnits, 'defender'));
  };

  // Create mock unit instances for combat panel
  const mockAttackerUnitInstances = useMemo((): UnitInstance[] => {
    const instances: UnitInstance[] = [];
    let idCounter = 0;

    for (const config of UNIT_CONFIGS) {
      const count = attackerUnits[config.type] || 0;
      for (let i = 0; i < count; i++) {
        instances.push({
          id: `attacker-${config.type}-${idCounter++}`,
          type: config.type,
          ownerId: 'attacker-player',
          damaged: false,
        });
      }
    }

    return instances;
  }, [attackerUnits]);

  const mockDefenderUnitInstances = useMemo((): UnitInstance[] => {
    const instances: UnitInstance[] = [];
    let idCounter = 0;

    for (const config of UNIT_CONFIGS) {
      const count = defenderUnits[config.type] || 0;
      for (let i = 0; i < count; i++) {
        instances.push({
          id: `defender-${config.type}-${idCounter++}`,
          type: config.type,
          ownerId: 'defender-player',
          damaged: false,
        });
      }
    }

    return instances;
  }, [defenderUnits]);

  // Calculate total dice and expected hits
  const calculateStats = (units: Record<UnitType, number>) => {
    let totalDice = 0;
    let expectedHits = 0;

    for (const config of UNIT_CONFIGS) {
      const count = units[config.type] || 0;
      const dice = count * config.dice;
      totalDice += dice;
      // Expected hits = dice * (11 - combat) / 10
      expectedHits += dice * (11 - config.combat) / 10;
    }

    return { totalDice, expectedHits: expectedHits.toFixed(1) };
  };

  const attackerStats = calculateStats(attackerUnits);
  const defenderStats = calculateStats(defenderUnits);

  // Handle dice roll completion
  const handleDiceRollComplete = () => {
    setShowDiceRoller(false);
    setCombatState('combat_round_assign');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Combat System Test</h1>
        <p className="text-gray-400 mb-8">
          Configure units and test the combat system without playing a full game.
        </p>

        {/* Mode Selection */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setTestMode('setup')}
            className={`px-4 py-2 rounded-lg ${
              testMode === 'setup'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Setup Units
          </button>
          <button
            onClick={() => {
              setTestMode('dice_only');
              rollDice();
            }}
            className={`px-4 py-2 rounded-lg ${
              testMode === 'dice_only'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Test 3D Dice
          </button>
          <button
            onClick={() => setTestMode('full_flow')}
            className={`px-4 py-2 rounded-lg ${
              testMode === 'full_flow'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Full Combat Flow
          </button>
        </div>

        {/* Setup Mode */}
        {testMode === 'setup' && (
          <div className="grid grid-cols-2 gap-8">
            {/* Attacker Setup */}
            <div className="bg-red-900/30 rounded-xl p-6 border border-red-500/50">
              <h2 className="text-xl font-bold text-red-400 mb-4">Attacker Fleet</h2>
              <div className="space-y-3">
                {UNIT_CONFIGS.map(config => (
                  <div key={config.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="capitalize text-white w-28">
                        {config.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({config.combat}+ to hit, {config.dice}d)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setAttackerUnits(prev => ({
                            ...prev,
                            [config.type]: Math.max(0, (prev[config.type] || 0) - 1),
                          }))
                        }
                        className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono">
                        {attackerUnits[config.type] || 0}
                      </span>
                      <button
                        onClick={() =>
                          setAttackerUnits(prev => ({
                            ...prev,
                            [config.type]: (prev[config.type] || 0) + 1,
                          }))
                        }
                        className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-red-500/30">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Dice:</span>
                  <span className="text-red-400 font-bold">{attackerStats.totalDice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Expected Hits:</span>
                  <span className="text-green-400 font-bold">{attackerStats.expectedHits}</span>
                </div>
              </div>
            </div>

            {/* Defender Setup */}
            <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-500/50">
              <h2 className="text-xl font-bold text-blue-400 mb-4">Defender Fleet</h2>
              <div className="space-y-3">
                {UNIT_CONFIGS.map(config => (
                  <div key={config.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="capitalize text-white w-28">
                        {config.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({config.combat}+ to hit, {config.dice}d)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setDefenderUnits(prev => ({
                            ...prev,
                            [config.type]: Math.max(0, (prev[config.type] || 0) - 1),
                          }))
                        }
                        className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono">
                        {defenderUnits[config.type] || 0}
                      </span>
                      <button
                        onClick={() =>
                          setDefenderUnits(prev => ({
                            ...prev,
                            [config.type]: (prev[config.type] || 0) + 1,
                          }))
                        }
                        className="w-8 h-8 bg-gray-700 rounded hover:bg-gray-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-blue-500/30">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Dice:</span>
                  <span className="text-blue-400 font-bold">{defenderStats.totalDice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Expected Hits:</span>
                  <span className="text-green-400 font-bold">{defenderStats.expectedHits}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dice Only Mode */}
        {testMode === 'dice_only' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  rollDice();
                  setShowDiceRoller(true);
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-lg"
              >
                Roll 3D Dice
              </button>
              <button
                onClick={rollDice}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
              >
                Re-roll (Results Only)
              </button>
            </div>

            {/* Results Display */}
            <div className="grid grid-cols-2 gap-8">
              {/* Attacker Results */}
              <div className="bg-red-900/30 rounded-xl p-6 border border-red-500/50">
                <h2 className="text-xl font-bold text-red-400 mb-4">Attacker Rolls</h2>
                <DiceResultsDisplay rolls={attackerRolls} />
              </div>

              {/* Defender Results */}
              <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-500/50">
                <h2 className="text-xl font-bold text-blue-400 mb-4">Defender Rolls</h2>
                <DiceResultsDisplay rolls={defenderRolls} />
              </div>
            </div>

            {/* 3D Dice Roller Overlay */}
            {showDiceRoller && attackerRolls.length > 0 && (
              <DiceRoller
                attackerRolls={attackerRolls}
                defenderRolls={defenderRolls}
                attackerColor="red"
                defenderColor="blue"
                onComplete={handleDiceRollComplete}
              />
            )}
          </div>
        )}

        {/* Full Flow Mode */}
        {testMode === 'full_flow' && (
          <div className="space-y-6">
            {/* Combat State Controls */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Combat State</h2>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-gray-400">Round:</span>
                <span className="text-2xl font-bold text-yellow-400">{combatRound}</span>
                <button
                  onClick={() => setCombatRound(r => r + 1)}
                  className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                >
                  Next Round
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'anti_fighter_barrage',
                  'announce_retreat',
                  'combat_round_roll',
                  'combat_round_assign',
                  'combat_complete',
                ].map(state => (
                  <button
                    key={state}
                    onClick={() => setCombatState(state as CombatState)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      combatState === state
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {state.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Combat Panel Preview */}
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
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
                      <p className="text-red-300 text-sm">Test System</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Round</span>
                    <span className="text-2xl font-bold text-yellow-400">{combatRound}</span>
                  </div>
                </div>
              </div>

              {/* State Indicator */}
              <div className="bg-gray-800 px-6 py-2 border-b border-gray-700">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="font-medium text-yellow-400">
                    {combatState.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>
              </div>

              {/* Units Display */}
              <div className="flex">
                <div className="flex-1 p-6 border-r border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm uppercase">Attacker</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500" />
                      <span className="text-white font-medium">Red Player</span>
                    </div>
                  </div>
                  <UnitList units={mockAttackerUnitInstances} />
                </div>

                <div className="flex items-center justify-center w-16 bg-gray-800/50">
                  <span className="text-2xl font-bold text-gray-500">VS</span>
                </div>

                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-sm uppercase">Defender</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500" />
                      <span className="text-white font-medium">Blue Player</span>
                    </div>
                  </div>
                  <UnitList units={mockDefenderUnitInstances} />
                </div>
              </div>

              {/* Action Area */}
              <div className="bg-gray-800 px-6 py-4 border-t border-gray-700">
                {combatState === 'combat_round_roll' && (
                  <div className="text-center">
                    <button
                      onClick={() => {
                        rollDice();
                        setShowDiceRoller(true);
                      }}
                      className="px-8 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold text-lg animate-pulse"
                    >
                      Roll Combat Dice
                    </button>
                  </div>
                )}

                {combatState === 'combat_round_assign' && (
                  <div className="text-center">
                    <p className="text-yellow-400 mb-4">
                      Attacker takes {defenderRolls.filter(r => r.hit).length} hits |
                      Defender takes {attackerRolls.filter(r => r.hit).length} hits
                    </p>
                    <button
                      onClick={() => {
                        setCombatState('announce_retreat');
                        setCombatRound(r => r + 1);
                      }}
                      className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium"
                    >
                      Continue to Next Round
                    </button>
                  </div>
                )}

                {combatState === 'announce_retreat' && (
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setCombatState('combat_round_roll')}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium"
                    >
                      Continue Fighting
                    </button>
                    <button
                      onClick={() => setCombatState('combat_complete')}
                      className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-medium"
                    >
                      Retreat
                    </button>
                  </div>
                )}

                {combatState === 'combat_complete' && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400 mb-4">Combat Complete!</p>
                    <button
                      onClick={() => {
                        setCombatState('combat_round_roll');
                        setCombatRound(1);
                      }}
                      className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
                    >
                      Reset Combat
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3D Dice Roller */}
            {showDiceRoller && attackerRolls.length > 0 && (
              <DiceRoller
                attackerRolls={attackerRolls}
                defenderRolls={defenderRolls}
                attackerColor="red"
                defenderColor="blue"
                onComplete={handleDiceRollComplete}
              />
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <h3 className="text-lg font-bold mb-4">Presets</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                setAttackerUnits({
                  war_sun: 1,
                  flagship: 0,
                  dreadnought: 2,
                  carrier: 1,
                  cruiser: 0,
                  destroyer: 0,
                  fighter: 6,
                  infantry: 0,
                  mech: 0,
                  pds: 0,
                  space_dock: 0,
                });
                setDefenderUnits({
                  war_sun: 0,
                  flagship: 1,
                  dreadnought: 1,
                  carrier: 2,
                  cruiser: 2,
                  destroyer: 2,
                  fighter: 4,
                  infantry: 0,
                  mech: 0,
                  pds: 0,
                  space_dock: 0,
                });
              }}
              className="px-4 py-2 bg-purple-600/30 border border-purple-500/50 rounded-lg hover:bg-purple-600/50"
            >
              Epic Battle
            </button>
            <button
              onClick={() => {
                setAttackerUnits({
                  war_sun: 0,
                  flagship: 0,
                  dreadnought: 0,
                  carrier: 0,
                  cruiser: 1,
                  destroyer: 0,
                  fighter: 0,
                  infantry: 0,
                  mech: 0,
                  pds: 0,
                  space_dock: 0,
                });
                setDefenderUnits({
                  war_sun: 0,
                  flagship: 0,
                  dreadnought: 0,
                  carrier: 0,
                  cruiser: 1,
                  destroyer: 0,
                  fighter: 0,
                  infantry: 0,
                  mech: 0,
                  pds: 0,
                  space_dock: 0,
                });
              }}
              className="px-4 py-2 bg-gray-600/30 border border-gray-500/50 rounded-lg hover:bg-gray-600/50"
            >
              Minimal (1v1)
            </button>
            <button
              onClick={() => {
                setAttackerUnits({
                  war_sun: 0,
                  flagship: 0,
                  dreadnought: 0,
                  carrier: 0,
                  cruiser: 0,
                  destroyer: 2,
                  fighter: 6,
                  infantry: 0,
                  mech: 0,
                  pds: 0,
                  space_dock: 0,
                });
                setDefenderUnits({
                  war_sun: 0,
                  flagship: 0,
                  dreadnought: 0,
                  carrier: 1,
                  cruiser: 0,
                  destroyer: 0,
                  fighter: 8,
                  infantry: 0,
                  mech: 0,
                  pds: 0,
                  space_dock: 0,
                });
              }}
              className="px-4 py-2 bg-orange-600/30 border border-orange-500/50 rounded-lg hover:bg-orange-600/50"
            >
              Fighter Swarm
            </button>
            <button
              onClick={() => {
                setAttackerUnits({
                  war_sun: 2,
                  flagship: 0,
                  dreadnought: 3,
                  carrier: 0,
                  cruiser: 0,
                  destroyer: 0,
                  fighter: 0,
                  infantry: 0,
                  mech: 0,
                  pds: 0,
                  space_dock: 0,
                });
                setDefenderUnits({
                  war_sun: 1,
                  flagship: 1,
                  dreadnought: 2,
                  carrier: 0,
                  cruiser: 0,
                  destroyer: 0,
                  fighter: 0,
                  infantry: 0,
                  mech: 0,
                  pds: 0,
                  space_dock: 0,
                });
              }}
              className="px-4 py-2 bg-red-600/30 border border-red-500/50 rounded-lg hover:bg-red-600/50"
            >
              Capital Ships
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Display dice roll results grouped by unit type
 */
function DiceResultsDisplay({ rolls }: { rolls: DiceRoll[] }) {
  // Group by unit type
  const grouped = rolls.reduce((acc, roll) => {
    const existing = acc.get(roll.unitType) || [];
    existing.push(roll);
    acc.set(roll.unitType, existing);
    return acc;
  }, new Map<UnitType, DiceRoll[]>());

  const totalHits = rolls.filter(r => r.hit).length;

  if (rolls.length === 0) {
    return <p className="text-gray-500">No dice to roll</p>;
  }

  return (
    <div className="space-y-3">
      {Array.from(grouped.entries()).map(([type, typeRolls]) => (
        <div key={type} className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400 capitalize w-24">
            {type.replace(/_/g, ' ')}:
          </span>
          {typeRolls.map((roll, i) => (
            <span
              key={i}
              className={`w-8 h-8 flex items-center justify-center rounded font-bold ${
                roll.hit
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
              title={`Roll: ${roll.roll}, Need: ${roll.combatValue}+`}
            >
              {roll.roll}
            </span>
          ))}
        </div>
      ))}
      <div className="pt-3 border-t border-gray-700">
        <span className="text-lg font-bold">
          Total Hits: <span className="text-green-400">{totalHits}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Display unit list with health status
 */
function UnitList({ units }: { units: UnitInstance[] }) {
  // Group by type
  const grouped = units.reduce((acc, unit) => {
    const existing = acc.get(unit.type) || [];
    existing.push(unit);
    acc.set(unit.type, existing);
    return acc;
  }, new Map<UnitType, UnitInstance[]>());

  if (units.length === 0) {
    return <p className="text-gray-500">No units</p>;
  }

  return (
    <div className="space-y-2">
      {Array.from(grouped.entries()).map(([type, typeUnits]) => (
        <div key={type} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="capitalize text-white">{type.replace(/_/g, ' ')}</span>
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
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
