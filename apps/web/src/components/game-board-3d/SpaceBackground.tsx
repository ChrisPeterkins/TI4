'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

/**
 * Space-themed background with animated stars
 */
export function SpaceBackground() {
  const starsRef = useRef<THREE.Points>(null);

  // Slowly rotate stars for subtle animation
  useFrame((_, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <group>
      {/* Main starfield */}
      <Stars
        ref={starsRef}
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {/* Ambient nebula glow */}
      <NebulaPlanes />
    </group>
  );
}

/**
 * Subtle nebula planes for depth
 */
function NebulaPlanes() {
  const nebulae = useMemo(() => [
    { position: [-30, 5, -40], color: '#1a0030', opacity: 0.15, scale: 40 },
    { position: [35, -5, -35], color: '#001030', opacity: 0.1, scale: 35 },
    { position: [0, 10, -50], color: '#100020', opacity: 0.12, scale: 50 },
  ], []);

  return (
    <>
      {nebulae.map((nebula, index) => (
        <mesh
          key={index}
          position={nebula.position as [number, number, number]}
          rotation={[0, Math.random() * Math.PI, 0]}
        >
          <planeGeometry args={[nebula.scale, nebula.scale]} />
          <meshBasicMaterial
            color={nebula.color}
            transparent
            opacity={nebula.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

/**
 * Dust particles floating in space
 */
export function SpaceDust() {
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spread particles in a disc shape around the board
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 20;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = Math.sin(angle) * radius;

      // Dim white/blue colors
      colors[i3] = 0.5 + Math.random() * 0.3;
      colors[i3 + 1] = 0.5 + Math.random() * 0.3;
      colors[i3 + 2] = 0.7 + Math.random() * 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, []);

  // Animate dust particles
  useFrame((_, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <points ref={particlesRef} geometry={particles}>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
