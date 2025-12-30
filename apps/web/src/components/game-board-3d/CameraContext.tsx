'use client';

import { createContext, useContext, useCallback, useRef, useState, type ReactNode } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_CONFIG } from './constants';

interface CameraTarget {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

interface CameraContextValue {
  /** Focus camera on a specific position */
  focusOn: (target: CameraTarget, duration?: number) => void;
  /** Reset camera to default overview position */
  resetToOverview: () => void;
  /** Whether camera is currently focused on something */
  isFocused: boolean;
  /** Current focus target (if any) */
  focusTarget: CameraTarget | null;
  /** Ref to current orbit target - updated in real-time during animation */
  orbitTargetRef: React.MutableRefObject<THREE.Vector3>;
  /** Whether camera animation is in progress - OrbitControls should be disabled */
  isAnimating: boolean;
}

const CameraContext = createContext<CameraContextValue | null>(null);

/**
 * Hook to access camera controls
 */
export function useCamera() {
  const context = useContext(CameraContext);
  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
}

interface CameraProviderProps {
  children: ReactNode;
  boardCenter?: THREE.Vector3;
  onFocusChange?: (focused: boolean) => void;
}

/**
 * Internal camera animator component
 * Updates both camera position AND orbit target during animation to keep OrbitControls in sync
 */
function CameraAnimator({
  target,
  duration,
  onComplete,
  onLookAtChange,
}: {
  target: CameraTarget | null;
  duration: number;
  onComplete: () => void;
  onLookAtChange: (lookAt: THREE.Vector3) => void;
}) {
  const { camera } = useThree();
  const animationRef = useRef<{
    startTime: number;
    startPosition: THREE.Vector3;
    startLookAt: THREE.Vector3;
    target: CameraTarget;
    duration: number;
  } | null>(null);
  const lastTargetRef = useRef<CameraTarget | null>(null);

  // Start animation when target changes
  if (target !== lastTargetRef.current && target) {
    // Calculate current lookAt
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt);
    currentLookAt.multiplyScalar(10).add(camera.position);

    animationRef.current = {
      startTime: Date.now(),
      startPosition: camera.position.clone(),
      startLookAt: currentLookAt,
      target,
      duration,
    };
    lastTargetRef.current = target;
  }

  useFrame(() => {
    if (!animationRef.current) return;

    const { startTime, startPosition, startLookAt, target: animTarget, duration: dur } = animationRef.current;
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / dur, 1);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);

    camera.position.lerpVectors(startPosition, animTarget.position, eased);

    const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, animTarget.lookAt, eased);
    camera.lookAt(currentLookAt);

    // Update orbit target in real-time so OrbitControls stays in sync
    onLookAtChange(currentLookAt);

    if (progress >= 1) {
      animationRef.current = null;
      onComplete();
    }
  });

  return null;
}

/**
 * Provider component for camera controls
 * Must be used inside a R3F Canvas
 */
export function CameraProvider({ children, boardCenter, onFocusChange }: CameraProviderProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [focusTarget, setFocusTarget] = useState<CameraTarget | null>(null);
  const [animationTarget, setAnimationTarget] = useState<CameraTarget | null>(null);
  const [animationDuration, setAnimationDuration] = useState(1000);
  const [isAnimating, setIsAnimating] = useState(false);

  // Use ref for orbit target so we can update it every frame without re-renders
  const orbitTargetRef = useRef<THREE.Vector3>(
    boardCenter ?? new THREE.Vector3(
      CAMERA_CONFIG.target.x,
      CAMERA_CONFIG.target.y,
      CAMERA_CONFIG.target.z
    )
  );

  const defaultTarget = useRef<CameraTarget>({
    position: new THREE.Vector3(
      CAMERA_CONFIG.position.x,
      CAMERA_CONFIG.position.y,
      CAMERA_CONFIG.position.z
    ),
    lookAt: boardCenter ?? new THREE.Vector3(
      CAMERA_CONFIG.target.x,
      CAMERA_CONFIG.target.y,
      CAMERA_CONFIG.target.z
    ),
  });

  // Update default lookAt when boardCenter changes
  if (boardCenter) {
    defaultTarget.current.lookAt = boardCenter;
  }

  const focusOn = useCallback((target: CameraTarget, duration = 1000) => {
    setFocusTarget(target);
    setAnimationTarget(target);
    setAnimationDuration(duration);
    setIsFocused(true);
    setIsAnimating(true);
    onFocusChange?.(true);
  }, [onFocusChange]);

  const resetToOverview = useCallback(() => {
    setAnimationTarget(defaultTarget.current);
    setAnimationDuration(800);
    setIsFocused(false);
    setFocusTarget(null);
    setIsAnimating(true);
    onFocusChange?.(false);
  }, [onFocusChange]);

  const handleAnimationComplete = useCallback(() => {
    setAnimationTarget(null);
    setIsAnimating(false);
  }, []);

  // Called every frame during animation to keep OrbitControls in sync
  const handleLookAtChange = useCallback((lookAt: THREE.Vector3) => {
    orbitTargetRef.current.copy(lookAt);
  }, []);

  const value: CameraContextValue = {
    focusOn,
    resetToOverview,
    isFocused,
    focusTarget,
    orbitTargetRef,
    isAnimating,
  };

  return (
    <CameraContext.Provider value={value}>
      <CameraAnimator
        target={animationTarget}
        duration={animationDuration}
        onComplete={handleAnimationComplete}
        onLookAtChange={handleLookAtChange}
      />
      {children}
    </CameraContext.Provider>
  );
}

/**
 * Calculate camera position to focus on a player station
 */
export function calculateStationCameraTarget(
  stationPosition: THREE.Vector3,
  stationRotation: number
): CameraTarget {
  const distance = 8;
  const height = 6;

  // Position camera in front of the station, looking at it
  const cameraPosition = new THREE.Vector3(
    stationPosition.x + Math.sin(stationRotation) * distance,
    height,
    stationPosition.z + Math.cos(stationRotation) * distance
  );

  const lookAt = new THREE.Vector3(
    stationPosition.x,
    0,
    stationPosition.z + 0.5 // Slightly forward to center view
  );

  return { position: cameraPosition, lookAt };
}
