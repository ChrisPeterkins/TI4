'use client';

import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CAMERA_CONFIG } from './constants';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface CameraControlsProps {
  /** Target position to focus on (optional override) */
  target?: THREE.Vector3;
  /** Enable controls */
  enabled?: boolean;
  /** Called when camera moves */
  onCameraChange?: () => void;
}

/**
 * Orbital camera controls for the 3D board
 * Allows rotation, zoom, and pan
 */
export function CameraControls({
  target,
  enabled = true,
  onCameraChange,
}: CameraControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  // Set initial camera position
  useEffect(() => {
    camera.position.set(
      CAMERA_CONFIG.position.x,
      CAMERA_CONFIG.position.y,
      CAMERA_CONFIG.position.z
    );
    camera.lookAt(
      CAMERA_CONFIG.target.x,
      CAMERA_CONFIG.target.y,
      CAMERA_CONFIG.target.z
    );
  }, [camera]);

  // Update target if provided
  useEffect(() => {
    if (controlsRef.current && target) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [target]);

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={CAMERA_CONFIG.minDistance}
      maxDistance={CAMERA_CONFIG.maxDistance}
      maxPolarAngle={CAMERA_CONFIG.maxPolarAngle}
      minPolarAngle={0.1}
      dampingFactor={0.1}
      enableDamping={true}
      onChange={onCameraChange}
      // Smooth mouse controls
      rotateSpeed={0.5}
      zoomSpeed={0.8}
      panSpeed={0.8}
      // Touch controls
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  );
}

/**
 * Camera animator for smooth transitions
 */
export function useCameraAnimation() {
  const { camera } = useThree();

  const animateTo = (
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
    duration: number = 1000
  ) => {
    const startPosition = camera.position.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(startPosition, targetPosition, eased);
      camera.lookAt(targetLookAt);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  return { animateTo };
}
