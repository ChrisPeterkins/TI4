'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createD10Geometry, getD10UpFace } from './D10Geometry';

// Die colors based on player colors
const PLAYER_DIE_COLORS: Record<string, string> = {
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#eab308',
  purple: '#9333ea',
  orange: '#ea580c',
  pink: '#ec4899',
  black: '#374151',
  gray: '#6b7280',
};

interface Dice3DProps {
  id: string;
  color: string;
  initialPosition: [number, number, number];
  world: CANNON.World;
  onSettled: (id: string, value: number) => void;
  targetValue?: number; // Pre-determined result from server
  throwForce?: number;
}

export function Dice3D({
  id,
  color,
  initialPosition,
  world,
  onSettled,
  targetValue,
  throwForce = 15,
}: Dice3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<CANNON.Body | null>(null);
  const [isSettled, setIsSettled] = useState(false);
  const [finalValue, setFinalValue] = useState<number | null>(null);
  const settledFrames = useRef(0);

  // Create geometry once
  const geometry = useMemo(() => createD10Geometry(0.3), []);

  // Create physics body
  useEffect(() => {
    // Create a simplified box shape for collision (d10 is close enough)
    const shape = new CANNON.Box(new CANNON.Vec3(0.15, 0.24, 0.15));

    const body = new CANNON.Body({
      mass: 1,
      position: new CANNON.Vec3(...initialPosition),
      shape,
      material: new CANNON.Material({
        friction: 0.3,
        restitution: 0.4,
      }),
      angularDamping: 0.3,
      linearDamping: 0.1,
    });

    // Add random initial rotation
    body.quaternion.setFromEuler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    // Apply throw force with random direction
    const throwAngle = Math.random() * Math.PI * 2;
    const throwVelocity = new CANNON.Vec3(
      Math.cos(throwAngle) * throwForce * 0.5,
      throwForce * 0.3,
      Math.sin(throwAngle) * throwForce * 0.5
    );
    body.velocity.copy(throwVelocity);

    // Add random spin
    body.angularVelocity.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 20
    );

    world.addBody(body);
    bodyRef.current = body;

    return () => {
      world.removeBody(body);
    };
  }, [world, initialPosition, throwForce]);

  // Sync Three.js mesh with physics body
  useFrame(() => {
    if (!meshRef.current || !bodyRef.current || isSettled) return;

    const body = bodyRef.current;

    // Update mesh position and rotation from physics
    meshRef.current.position.copy(body.position as unknown as THREE.Vector3);
    meshRef.current.quaternion.copy(body.quaternion as unknown as THREE.Quaternion);

    // Check if die has settled (low velocity)
    const speed = body.velocity.length();
    const angularSpeed = body.angularVelocity.length();

    if (speed < 0.1 && angularSpeed < 0.1) {
      settledFrames.current++;

      // Wait for ~30 frames of being still (~0.5 seconds)
      if (settledFrames.current > 30) {
        setIsSettled(true);

        // Determine final value
        const euler = new THREE.Euler().setFromQuaternion(
          meshRef.current.quaternion
        );
        const value = targetValue || getD10UpFace(euler);

        setFinalValue(value);
        onSettled(id, value);
      }
    } else {
      settledFrames.current = 0;
    }
  });

  // Die color
  const dieColor = PLAYER_DIE_COLORS[color] || PLAYER_DIE_COLORS.gray;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={dieColor}
        roughness={0.3}
        metalness={0.2}
        emissive={isSettled ? (finalValue === targetValue ? '#00ff00' : '#333') : '#000'}
        emissiveIntensity={isSettled ? 0.2 : 0}
      />

      {/* Display number on die when settled */}
      {isSettled && finalValue !== null && (
        <DieNumber value={finalValue} position={[0, 0.25, 0]} />
      )}
    </mesh>
  );
}

/**
 * Floating number display above settled die
 */
function DieNumber({
  value,
  position,
}: {
  value: number;
  position: [number, number, number];
}) {
  return (
    <sprite position={position} scale={[0.3, 0.3, 1]}>
      <spriteMaterial color="#ffffff" opacity={0.9} transparent />
    </sprite>
  );
}

/**
 * Container for a group of dice with physics world
 */
interface DiceGroupProps {
  diceConfigs: {
    id: string;
    color: string;
    targetValue: number;
  }[];
  onAllSettled: (results: Map<string, number>) => void;
}

export function DiceGroup({ diceConfigs, onAllSettled }: DiceGroupProps) {
  const worldRef = useRef<CANNON.World | null>(null);
  const [results, setResults] = useState<Map<string, number>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [isWorldReady, setIsWorldReady] = useState(false);

  // Create physics world
  useEffect(() => {
    const world = new CANNON.World();
    world.gravity.set(0, -20, 0);

    // Ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape,
      material: new CANNON.Material({
        friction: 0.5,
        restitution: 0.3,
      }),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.set(0, -1, 0);
    world.addBody(groundBody);

    // Boundary walls
    const wallMaterial = new CANNON.Material({ friction: 0.3, restitution: 0.5 });

    const walls = [
      { pos: [3, 0, 0], rot: [0, 0, Math.PI / 2] },
      { pos: [-3, 0, 0], rot: [0, 0, -Math.PI / 2] },
      { pos: [0, 0, 3], rot: [Math.PI / 2, 0, 0] },
      { pos: [0, 0, -3], rot: [-Math.PI / 2, 0, 0] },
    ] as const;

    walls.forEach(({ pos, rot }) => {
      const wallBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Plane(),
        material: wallMaterial,
      });
      wallBody.position.set(pos[0], pos[1], pos[2]);
      wallBody.quaternion.setFromEuler(rot[0], rot[1], rot[2]);
      world.addBody(wallBody);
    });

    worldRef.current = world;
    setIsWorldReady(true); // Trigger re-render after world is created

    return () => {
      // Cleanup
      worldRef.current = null;
      setIsWorldReady(false);
    };
  }, []);

  // Step physics world
  useFrame((_, delta) => {
    if (worldRef.current) {
      worldRef.current.step(1 / 60, delta, 3);
    }
  });

  // Handle die settlement
  const handleSettled = (id: string, value: number) => {
    setResults(prev => {
      const newResults = new Map(prev);
      newResults.set(id, value);

      // Check if all dice have settled
      if (newResults.size === diceConfigs.length && !isComplete) {
        setIsComplete(true);
        onAllSettled(newResults);
      }

      return newResults;
    });
  };

  if (!isWorldReady || !worldRef.current) return null;

  // Calculate positions - arrange dice in a grid
  const gridSize = Math.ceil(Math.sqrt(diceConfigs.length));
  const spacing = 0.8;

  return (
    <group>
      {/* Ground plane visualization */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#1a1a2e" opacity={0.9} transparent />
      </mesh>

      {/* Dice */}
      {diceConfigs.map((config, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const x = (col - (gridSize - 1) / 2) * spacing;
        const z = (row - (gridSize - 1) / 2) * spacing;

        return (
          <Dice3D
            key={config.id}
            id={config.id}
            color={config.color}
            initialPosition={[x, 3 + Math.random() * 2, z]}
            world={worldRef.current!}
            onSettled={handleSettled}
            targetValue={config.targetValue}
          />
        );
      })}

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
    </group>
  );
}
