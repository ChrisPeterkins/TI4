'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// Token dimensions
const TOKEN_RADIUS = 0.15;
const TOKEN_HEIGHT = 0.02;
const STACK_OFFSET = 0.015;

interface TokenInstance {
  position: THREE.Vector3;
  rotation: number;
  color: string;
  count: number;
  label?: string;
}

interface InstancedTokens3DProps {
  instances: TokenInstance[];
  maxInstancesPerGroup?: number;
}

/**
 * Optimized instanced rendering for many tokens
 * Uses THREE.InstancedMesh for efficient GPU rendering
 */
export function InstancedTokens3D({
  instances,
  maxInstancesPerGroup = 100,
}: InstancedTokens3DProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Create shared geometry
  const geometry = useMemo(() => {
    return new THREE.CylinderGeometry(TOKEN_RADIUS, TOKEN_RADIUS, TOKEN_HEIGHT, 16);
  }, []);

  // Calculate total instances needed
  const totalTokens = useMemo(() => {
    return instances.reduce((sum, inst) => sum + Math.min(inst.count, 10), 0);
  }, [instances]);

  // Create material
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.1,
    });
  }, []);

  // Update instance matrices
  useEffect(() => {
    if (!meshRef.current) return;

    let instanceIndex = 0;
    const tempColor = new THREE.Color();

    instances.forEach((tokenGroup) => {
      const stackCount = Math.min(tokenGroup.count, 10);

      for (let i = 0; i < stackCount; i++) {
        // Position with slight random offset for natural look
        dummy.position.set(
          tokenGroup.position.x + (Math.random() - 0.5) * 0.02,
          tokenGroup.position.y + i * STACK_OFFSET,
          tokenGroup.position.z + (Math.random() - 0.5) * 0.02
        );
        dummy.rotation.set(0, tokenGroup.rotation + Math.random() * 0.2, 0);
        dummy.updateMatrix();

        meshRef.current!.setMatrixAt(instanceIndex, dummy.matrix);

        // Set color per instance
        tempColor.set(tokenGroup.color);
        meshRef.current!.setColorAt(instanceIndex, tempColor);

        instanceIndex++;
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instances, dummy]);

  if (totalTokens === 0) return null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, totalTokens]}
        castShadow
        receiveShadow
      />

      {/* Render labels separately (can't be instanced) */}
      {instances.map((inst, i) => (
        inst.label && inst.count > 0 && (
          <Text
            key={i}
            position={[
              inst.position.x,
              inst.position.y + Math.min(inst.count, 10) * STACK_OFFSET + 0.08,
              inst.position.z,
            ]}
            fontSize={0.12}
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {inst.count}
          </Text>
        )
      ))}
    </group>
  );
}

/**
 * Optimized command token pool using instancing
 */
export function InstancedCommandPool({
  tacticsCount,
  fleetCount,
  strategyCount,
  tokenColor,
  position = [0, 0, 0],
}: {
  tacticsCount: number;
  fleetCount: number;
  strategyCount: number;
  tokenColor: string;
  position?: [number, number, number];
}) {
  const instances = useMemo<TokenInstance[]>(() => {
    const basePos = new THREE.Vector3(...position);
    const spacing = 0.8;

    return [
      {
        position: new THREE.Vector3(basePos.x - spacing, basePos.y, basePos.z),
        rotation: 0,
        color: tokenColor,
        count: tacticsCount,
        label: 'T',
      },
      {
        position: new THREE.Vector3(basePos.x, basePos.y, basePos.z),
        rotation: 0,
        color: tokenColor,
        count: fleetCount,
        label: 'F',
      },
      {
        position: new THREE.Vector3(basePos.x + spacing, basePos.y, basePos.z),
        rotation: 0,
        color: tokenColor,
        count: strategyCount,
        label: 'S',
      },
    ];
  }, [tacticsCount, fleetCount, strategyCount, tokenColor, position]);

  return <InstancedTokens3D instances={instances} />;
}

/**
 * Constants for instanced tokens
 */
export const INSTANCED_TOKEN_DIMENSIONS = {
  radius: TOKEN_RADIUS,
  height: TOKEN_HEIGHT,
  stackOffset: STACK_OFFSET,
} as const;
