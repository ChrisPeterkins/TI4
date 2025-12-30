'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { animated, useSpring, config } from '@react-spring/three';
import { CARD_DIMENSIONS } from './Card3D';

export type CardAnimationState = 'idle' | 'drawing' | 'playing' | 'discarding' | 'flipping';

export interface AnimatingCard {
  id: string;
  frontTexture: string;
  backTexture: string;
  state: CardAnimationState;
  fromPosition: [number, number, number];
  toPosition: [number, number, number];
  startFaceUp: boolean;
  endFaceUp: boolean;
  onComplete?: () => void;
}

interface DrawAnimationProps {
  card: AnimatingCard;
  onComplete: () => void;
}

/**
 * Single card draw animation
 * Animates a card from deck position to hand position with arc and flip
 */
export function DrawAnimation({ card, onComplete }: DrawAnimationProps) {
  const [finished, setFinished] = useState(false);

  // Load textures
  const frontTex = useLoader(TextureLoader, card.frontTexture);
  const backTex = useLoader(TextureLoader, card.backTexture);

  // Animation spring
  const { progress } = useSpring({
    from: { progress: 0 },
    to: { progress: 1 },
    config: { duration: 600 },
    onRest: () => {
      setFinished(true);
      onComplete();
    },
  });

  // Calculate animated position and rotation
  const position = progress.to((p) => {
    const x = THREE.MathUtils.lerp(card.fromPosition[0], card.toPosition[0], p);
    const z = THREE.MathUtils.lerp(card.fromPosition[2], card.toPosition[2], p);
    // Arc motion - card rises then falls
    const arcHeight = 1.5;
    const y = THREE.MathUtils.lerp(card.fromPosition[1], card.toPosition[1], p) +
      Math.sin(p * Math.PI) * arcHeight;
    return [x, y, z] as [number, number, number];
  });

  const rotationY = progress.to((p) => {
    // Flip during middle of animation if needed
    if (card.startFaceUp !== card.endFaceUp) {
      return p * Math.PI;
    }
    return card.startFaceUp ? 0 : Math.PI;
  });

  const rotationX = progress.to((p) => {
    // Start flat (on deck), end upright (in hand)
    return THREE.MathUtils.lerp(-Math.PI / 2, 0, p);
  });

  if (finished) return null;

  // Materials
  const edgeMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a' });
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex });
  const backMat = new THREE.MeshStandardMaterial({ map: backTex });

  return (
    <animated.mesh
      position={position}
      rotation-x={rotationX}
      rotation-y={rotationY}
    >
      <boxGeometry
        args={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, CARD_DIMENSIONS.depth]}
      />
      <primitive attach="material-0" object={edgeMat} />
      <primitive attach="material-1" object={edgeMat} />
      <primitive attach="material-2" object={edgeMat} />
      <primitive attach="material-3" object={edgeMat} />
      <primitive attach="material-4" object={frontMat} />
      <primitive attach="material-5" object={backMat} />
    </animated.mesh>
  );
}

/**
 * Play card animation - card flies from hand to center/target
 */
export function PlayAnimation({ card, onComplete }: DrawAnimationProps) {
  const [finished, setFinished] = useState(false);

  const frontTex = useLoader(TextureLoader, card.frontTexture);
  const backTex = useLoader(TextureLoader, card.backTexture);

  const { progress } = useSpring({
    from: { progress: 0 },
    to: { progress: 1 },
    config: { duration: 400 },
    onRest: () => {
      setFinished(true);
      onComplete();
    },
  });

  const position = progress.to((p) => {
    const x = THREE.MathUtils.lerp(card.fromPosition[0], card.toPosition[0], p);
    const z = THREE.MathUtils.lerp(card.fromPosition[2], card.toPosition[2], p);
    const y = THREE.MathUtils.lerp(card.fromPosition[1], card.toPosition[1], p) +
      Math.sin(p * Math.PI) * 0.5;
    return [x, y, z] as [number, number, number];
  });

  const scale = progress.to((p) => {
    // Card grows slightly as it's played
    return 1 + Math.sin(p * Math.PI) * 0.2;
  });

  if (finished) return null;

  const edgeMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a' });
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex });
  const backMat = new THREE.MeshStandardMaterial({ map: backTex });

  return (
    <animated.mesh position={position} scale={scale}>
      <boxGeometry
        args={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, CARD_DIMENSIONS.depth]}
      />
      <primitive attach="material-0" object={edgeMat} />
      <primitive attach="material-1" object={edgeMat} />
      <primitive attach="material-2" object={edgeMat} />
      <primitive attach="material-3" object={edgeMat} />
      <primitive attach="material-4" object={frontMat} />
      <primitive attach="material-5" object={backMat} />
    </animated.mesh>
  );
}

/**
 * Discard animation - card flies to discard pile
 */
export function DiscardAnimation({ card, onComplete }: DrawAnimationProps) {
  const [finished, setFinished] = useState(false);

  const frontTex = useLoader(TextureLoader, card.frontTexture);
  const backTex = useLoader(TextureLoader, card.backTexture);

  const { progress } = useSpring({
    from: { progress: 0 },
    to: { progress: 1 },
    config: { duration: 350 },
    onRest: () => {
      setFinished(true);
      onComplete();
    },
  });

  const position = progress.to((p) => {
    const x = THREE.MathUtils.lerp(card.fromPosition[0], card.toPosition[0], p);
    const z = THREE.MathUtils.lerp(card.fromPosition[2], card.toPosition[2], p);
    const y = THREE.MathUtils.lerp(card.fromPosition[1], card.toPosition[1], p) +
      Math.sin(p * Math.PI) * 0.3;
    return [x, y, z] as [number, number, number];
  });

  const rotationX = progress.to((p) => {
    // Transition to flat
    return THREE.MathUtils.lerp(0, -Math.PI / 2, p);
  });

  const opacity = progress.to((p) => {
    // Fade out slightly at end
    return p > 0.8 ? 1 - (p - 0.8) * 5 : 1;
  });

  if (finished) return null;

  const edgeMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a' });
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, transparent: true });
  const backMat = new THREE.MeshStandardMaterial({ map: backTex, transparent: true });

  return (
    <animated.mesh position={position} rotation-x={rotationX}>
      <boxGeometry
        args={[CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, CARD_DIMENSIONS.depth]}
      />
      <primitive attach="material-0" object={edgeMat} />
      <primitive attach="material-1" object={edgeMat} />
      <primitive attach="material-2" object={edgeMat} />
      <primitive attach="material-3" object={edgeMat} />
      <primitive attach="material-4" object={frontMat} />
      <primitive attach="material-5" object={backMat} />
    </animated.mesh>
  );
}

/**
 * Manager component for multiple card animations
 */
export interface CardAnimationManagerProps {
  animations: AnimatingCard[];
  onAnimationComplete: (cardId: string) => void;
}

export function CardAnimationManager({
  animations,
  onAnimationComplete,
}: CardAnimationManagerProps) {
  return (
    <group>
      {animations.map((card) => {
        switch (card.state) {
          case 'drawing':
            return (
              <DrawAnimation
                key={card.id}
                card={card}
                onComplete={() => onAnimationComplete(card.id)}
              />
            );
          case 'playing':
            return (
              <PlayAnimation
                key={card.id}
                card={card}
                onComplete={() => onAnimationComplete(card.id)}
              />
            );
          case 'discarding':
            return (
              <DiscardAnimation
                key={card.id}
                card={card}
                onComplete={() => onAnimationComplete(card.id)}
              />
            );
          default:
            return null;
        }
      })}
    </group>
  );
}

/**
 * Hook for managing card animations
 */
export function useCardAnimations() {
  const [animations, setAnimations] = useState<AnimatingCard[]>([]);

  const addAnimation = useCallback((card: AnimatingCard) => {
    setAnimations((prev) => [...prev, card]);
  }, []);

  const removeAnimation = useCallback((cardId: string) => {
    setAnimations((prev) => prev.filter((c) => c.id !== cardId));
  }, []);

  const drawCard = useCallback(
    (
      cardId: string,
      frontTexture: string,
      backTexture: string,
      fromPosition: [number, number, number],
      toPosition: [number, number, number],
      revealOnDraw: boolean = true,
      onComplete?: () => void
    ) => {
      addAnimation({
        id: cardId,
        frontTexture,
        backTexture,
        state: 'drawing',
        fromPosition,
        toPosition,
        startFaceUp: false,
        endFaceUp: revealOnDraw,
        onComplete,
      });
    },
    [addAnimation]
  );

  const playCard = useCallback(
    (
      cardId: string,
      frontTexture: string,
      backTexture: string,
      fromPosition: [number, number, number],
      toPosition: [number, number, number],
      onComplete?: () => void
    ) => {
      addAnimation({
        id: cardId,
        frontTexture,
        backTexture,
        state: 'playing',
        fromPosition,
        toPosition,
        startFaceUp: true,
        endFaceUp: true,
        onComplete,
      });
    },
    [addAnimation]
  );

  const discardCard = useCallback(
    (
      cardId: string,
      frontTexture: string,
      backTexture: string,
      fromPosition: [number, number, number],
      toPosition: [number, number, number],
      onComplete?: () => void
    ) => {
      addAnimation({
        id: cardId,
        frontTexture,
        backTexture,
        state: 'discarding',
        fromPosition,
        toPosition,
        startFaceUp: true,
        endFaceUp: true,
        onComplete,
      });
    },
    [addAnimation]
  );

  return {
    animations,
    addAnimation,
    removeAnimation,
    drawCard,
    playCard,
    discardCard,
  };
}
