'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { DiceRoll, UnitType } from '@ti4/shared';

/**
 * Creates a canvas texture with a number
 */
function createNumberTexture(
  number: number,
  bgColor: string,
  textColor: string,
  size: number = 256
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Subtle border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  // Inner shadow
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size * 0.7);
  gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Number text
  const text = number.toString();
  const fontSize = number >= 10 ? size * 0.55 : size * 0.65;

  ctx.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillText(text, size / 2 + 3, size / 2 + 3);

  // Main text
  ctx.fillStyle = textColor;
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

interface DiceRollerProps {
  attackerRolls: DiceRoll[];
  defenderRolls: DiceRoll[];
  attackerColor: string;
  defenderColor: string;
  onComplete: () => void;
}

type RollingPhase =
  | 'idle'
  | 'rolling_attacker'
  | 'showing_attacker_results'
  | 'rolling_defender'
  | 'showing_defender_results'
  | 'complete';

const UNIT_DISPLAY_ORDER: UnitType[] = [
  'war_sun', 'flagship', 'dreadnought', 'carrier', 'cruiser',
  'destroyer', 'fighter', 'mech', 'infantry',
];

function groupRollsByUnitType(rolls: DiceRoll[]): Map<UnitType, DiceRoll[]> {
  const groups = new Map<UnitType, DiceRoll[]>();
  for (const roll of rolls) {
    const existing = groups.get(roll.unitType) || [];
    existing.push(roll);
    groups.set(roll.unitType, existing);
  }
  const sortedGroups = new Map<UnitType, DiceRoll[]>();
  for (const type of UNIT_DISPLAY_ORDER) {
    if (groups.has(type)) {
      sortedGroups.set(type, groups.get(type)!);
    }
  }
  return sortedGroups;
}

function formatUnitType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const PLAYER_COLORS: Record<string, string> = {
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#eab308',
  purple: '#9333ea',
  orange: '#ea580c',
  pink: '#ec4899',
  black: '#374151',
};

// Animated cube die component
interface AnimatedDieProps {
  position: [number, number, number];
  color: string;
  value: number;
  delay: number;
  isHit: boolean;
  onComplete?: () => void;
}

function AnimatedDie({ position, color, value, delay, isHit, onComplete }: AnimatedDieProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [phase, setPhase] = useState<'waiting' | 'rolling' | 'settling' | 'done'>('waiting');
  const [displayNumber, setDisplayNumber] = useState(1);
  const startTime = useRef(0);
  const lastNumberChange = useRef(0);
  const settleStartRot = useRef<THREE.Quaternion | null>(null);

  // Current rotation
  const currentRot = useRef(new THREE.Euler(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  ));

  // Spin speeds
  const spinSpeed = useRef({
    x: (Math.random() - 0.5) * 15,
    y: (Math.random() - 0.5) * 15,
    z: (Math.random() - 0.5) * 15,
  });

  // Create textures for all 6 faces - we'll use the same number on all faces during rolling
  const materials = useMemo(() => {
    if (typeof document === 'undefined') return [];

    const bgColor = phase === 'done' ? (isHit ? '#22c55e' : '#4b5563') : color;
    const textColor = phase === 'done' ? (isHit ? '#ffffff' : '#9ca3af') : '#ffffff';
    const num = phase === 'done' || phase === 'settling' ? value : displayNumber;

    // All 6 faces show the same number
    const texture = createNumberTexture(num, bgColor, textColor);
    return Array.from({ length: 6 }, () =>
      new THREE.MeshStandardMaterial({
        map: texture.clone(),
        roughness: 0.3,
        metalness: 0.1,
      })
    );
  }, [color, isHit, phase, displayNumber, value]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();

    if (phase === 'waiting') {
      if (time > delay) {
        setPhase('rolling');
        startTime.current = time;
        lastNumberChange.current = time;
      }
      return;
    }

    const elapsed = time - startTime.current;

    if (phase === 'rolling') {
      // Spin the cube
      currentRot.current.x += spinSpeed.current.x * delta;
      currentRot.current.y += spinSpeed.current.y * delta;
      currentRot.current.z += spinSpeed.current.z * delta;

      // Cycle through numbers rapidly (every 50ms)
      if (time - lastNumberChange.current > 0.05) {
        setDisplayNumber(prev => (prev % 10) + 1);
        lastNumberChange.current = time;
      }

      // After 1.5 seconds, start settling
      if (elapsed > 1.5) {
        setPhase('settling');
        startTime.current = time;
        settleStartRot.current = new THREE.Quaternion().setFromEuler(currentRot.current);
      }
    }

    if (phase === 'settling') {
      const settleProgress = Math.min(elapsed / 0.4, 1);
      // Smooth ease-out
      const eased = 1 - Math.pow(1 - settleProgress, 3);

      if (settleStartRot.current) {
        // Target: top face (positive Y) showing the number
        // Just need a clean rotation with top face up
        const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
        const currentQuat = settleStartRot.current.clone().slerp(targetQuat, eased);
        currentRot.current.setFromQuaternion(currentQuat);
      }

      if (settleProgress >= 1) {
        setPhase('done');
        onComplete?.();
      }
    }

    // Apply rotation
    meshRef.current.rotation.copy(currentRot.current);
  });

  return (
    <mesh ref={meshRef} position={position} material={materials} castShadow>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
    </mesh>
  );
}

// Dice scene component
interface DiceSceneProps {
  rolls: DiceRoll[];
  color: string;
  onAllSettled: () => void;
}

function DiceScene({ rolls, color, onAllSettled }: DiceSceneProps) {
  const dieColor = PLAYER_COLORS[color] || '#888888';
  const settledCount = useRef(0);

  const handleDieComplete = () => {
    settledCount.current++;
    if (settledCount.current >= rolls.length) {
      onAllSettled();
    }
  };

  const gridSize = Math.ceil(Math.sqrt(rolls.length));
  const spacing = 1.0;

  const positions = useMemo(() => {
    return rolls.map((_, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const x = (col - (gridSize - 1) / 2) * spacing;
      const z = (row - Math.floor(rolls.length / gridSize) / 2) * spacing;
      return [x, 0.5, z] as [number, number, number];
    });
  }, [rolls.length, gridSize, spacing]);

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Dice */}
      {rolls.map((roll, index) => (
        <AnimatedDie
          key={`${roll.unitId}-${index}`}
          position={positions[index]}
          color={dieColor}
          value={roll.roll}
          delay={index * 0.08}
          isHit={roll.hit}
          onComplete={index === rolls.length - 1 ? handleDieComplete : undefined}
        />
      ))}

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.3} color="#ffffff" />
    </>
  );
}

export function DiceRoller({
  attackerRolls,
  defenderRolls,
  attackerColor,
  defenderColor,
  onComplete,
}: DiceRollerProps) {
  const [phase, setPhase] = useState<RollingPhase>('idle');

  const attackerGroups = useMemo(() => groupRollsByUnitType(attackerRolls), [attackerRolls]);
  const defenderGroups = useMemo(() => groupRollsByUnitType(defenderRolls), [defenderRolls]);

  useEffect(() => {
    if (phase === 'idle') {
      setPhase('rolling_attacker');
    }
  }, [phase]);

  const handleAttackerComplete = () => {
    setPhase('showing_attacker_results');
    setTimeout(() => {
      if (defenderRolls.length > 0) {
        setPhase('rolling_defender');
      } else {
        setPhase('complete');
      }
    }, 1500);
  };

  const handleDefenderComplete = () => {
    setPhase('showing_defender_results');
    setTimeout(() => {
      setPhase('complete');
    }, 1500);
  };

  const attackerHits = attackerRolls.filter(r => r.hit).length;
  const defenderHits = defenderRolls.filter(r => r.hit).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      {/* Title */}
      <div className="text-3xl font-bold text-white mb-4">
        {phase === 'rolling_attacker' && 'Attacker Rolling...'}
        {phase === 'showing_attacker_results' && `Attacker: ${attackerHits} Hits!`}
        {phase === 'rolling_defender' && 'Defender Rolling...'}
        {phase === 'showing_defender_results' && `Defender: ${defenderHits} Hits!`}
        {phase === 'complete' && 'Combat Dice Complete'}
      </div>

      {/* 3D Dice Area */}
      <div className="w-full max-w-2xl h-80 rounded-xl overflow-hidden border border-gray-700 bg-gray-900">
        {(phase === 'rolling_attacker' || phase === 'showing_attacker_results') && attackerRolls.length > 0 && (
          <Canvas shadows camera={{ position: [0, 4, 5], fov: 50 }}>
            <DiceScene
              rolls={attackerRolls}
              color={attackerColor}
              onAllSettled={handleAttackerComplete}
            />
            <OrbitControls
              enablePan={false}
              maxPolarAngle={Math.PI / 2.1}
              minDistance={3}
              maxDistance={10}
            />
          </Canvas>
        )}
        {(phase === 'rolling_defender' || phase === 'showing_defender_results') && defenderRolls.length > 0 && (
          <Canvas shadows camera={{ position: [0, 4, 5], fov: 50 }}>
            <DiceScene
              rolls={defenderRolls}
              color={defenderColor}
              onAllSettled={handleDefenderComplete}
            />
            <OrbitControls
              enablePan={false}
              maxPolarAngle={Math.PI / 2.1}
              minDistance={3}
              maxDistance={10}
            />
          </Canvas>
        )}
      </div>

      {/* Results Summary */}
      <div className="mt-6 flex gap-8">
        {/* Attacker Results */}
        <div className={`p-4 rounded-lg transition-all ${
          phase === 'showing_attacker_results' || phase === 'rolling_defender' ||
          phase === 'showing_defender_results' || phase === 'complete'
            ? 'bg-red-900/50 border border-red-500/50'
            : 'bg-gray-800/50 border border-gray-700'
        }`}>
          <div className="text-lg font-medium text-red-400 mb-2">Attacker</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {Array.from(attackerGroups.entries()).map(([type, rolls]) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-24">{formatUnitType(type)}:</span>
                <div className="flex gap-1 flex-wrap">
                  {rolls.map((roll, idx) => (
                    <span key={idx} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                      roll.hit ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {roll.roll}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-red-500/30">
            <span className="text-red-400 font-bold">{attackerHits} Hits</span>
          </div>
        </div>

        {/* Defender Results */}
        <div className={`p-4 rounded-lg transition-all ${
          phase === 'showing_defender_results' || phase === 'complete'
            ? 'bg-blue-900/50 border border-blue-500/50'
            : 'bg-gray-800/50 border border-gray-700'
        }`}>
          <div className="text-lg font-medium text-blue-400 mb-2">Defender</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {Array.from(defenderGroups.entries()).map(([type, rolls]) => (
              <div key={type} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-24">{formatUnitType(type)}:</span>
                <div className="flex gap-1 flex-wrap">
                  {rolls.map((roll, idx) => (
                    <span key={idx} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                      roll.hit ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {roll.roll}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-blue-500/30">
            <span className="text-blue-400 font-bold">{defenderHits} Hits</span>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      {phase === 'complete' && (
        <button
          onClick={onComplete}
          className="mt-6 px-8 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white text-lg transition-colors"
        >
          Continue to Hit Assignment
        </button>
      )}
    </div>
  );
}
