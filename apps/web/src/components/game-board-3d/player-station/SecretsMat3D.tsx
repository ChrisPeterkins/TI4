'use client';

import { useMemo, Suspense, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useLoader, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { getSecretObjectiveCardUrl, getSecretObjectiveCardBackUrl, getPlaymatTextureUrl, PLAYMAT_DIMENSIONS } from '@/lib/assets';
import { configureHighQualityTexture } from '../textureUtils';

// Secret objective card dimensions
const SECRET_CARD_WIDTH = 0.6;
const SECRET_CARD_HEIGHT = 0.85;
const SECRET_CARD_DEPTH = 0.008;
const CARD_GAP = 0.08; // Gap between cards when spread out

export interface SecretObjectiveData {
  id: string;
  name: string;
  scored?: boolean;
}

export interface SecretsMat3DProps {
  secrets: SecretObjectiveData[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  faceUp?: boolean;  // Show face up for owner, face down for opponents
  onSecretClick?: (secretId: string) => void;
  onSecretHover?: (secretId: string | null) => void;
}

/**
 * Individual secret objective card on the secrets mat
 */
function SecretCardOnMat({
  secret,
  position,
  scale,
  faceUp,
  onClick,
  onHover,
}: {
  secret: SecretObjectiveData;
  position: [number, number, number];
  scale: number;
  faceUp: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load card texture (face or back)
  const textureUrl = faceUp
    ? getSecretObjectiveCardUrl(secret.id)
    : getSecretObjectiveCardBackUrl();
  const texture = useLoader(TextureLoader, textureUrl);

  useEffect(() => {
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
    }
  }, [texture, maxAnisotropy]);

  const cardWidth = SECRET_CARD_WIDTH * scale;
  const cardHeight = SECRET_CARD_HEIGHT * scale;
  const cardDepth = SECRET_CARD_DEPTH * scale;

  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(cardWidth, cardDepth, cardHeight);
  }, [cardWidth, cardHeight, cardDepth]);

  const materials = useMemo(() => {
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.8,
      metalness: 0.1,
    });

    const cardMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.05,
      // Highlight scored secrets
      emissive: secret.scored ? new THREE.Color('#22c55e') : new THREE.Color('#000000'),
      emissiveIntensity: secret.scored ? 0.2 : 0,
    });

    const backMaterial = new THREE.MeshStandardMaterial({
      color: '#1e3a5f',
      roughness: 0.6,
      metalness: 0.1,
    });

    return [
      edgeMaterial,
      edgeMaterial,
      cardMaterial,
      backMaterial,
      edgeMaterial,
      edgeMaterial,
    ];
  }, [texture, secret.scored]);

  return (
    <mesh
      geometry={geometry}
      material={materials}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover?.(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover?.(false);
        document.body.style.cursor = 'auto';
      }}
    />
  );
}

/**
 * Secrets Mat for secret objective cards.
 * Shows face up for owner, face down for opponents.
 */
export function SecretsMat3D({
  secrets,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  faceUp = false,
  onSecretClick,
  onSecretHover,
}: SecretsMat3DProps) {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Load mat texture
  const matTextureUrl = getPlaymatTextureUrl('secrets_mat');
  const matTexture = useLoader(TextureLoader, matTextureUrl);

  useEffect(() => {
    if (matTexture) {
      configureHighQualityTexture(matTexture, maxAnisotropy);
    }
  }, [matTexture, maxAnisotropy]);

  // Get mat dimensions
  const dimensions = PLAYMAT_DIMENSIONS.secrets_mat;
  const matWidth = dimensions.width * scale;
  const matHeight = dimensions.height * scale;

  const matGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(matWidth, matHeight);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [matWidth, matHeight]);

  const matMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: matTexture,
      roughness: 0.85,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
  }, [matTexture]);

  // Calculate card positions (spread horizontally side by side)
  const getCardPosition = useCallback(
    (index: number): [number, number, number] => {
      // Cards are always spread out side by side
      const cardSpacing = (SECRET_CARD_WIDTH + CARD_GAP) * scale;
      const totalWidth = (secrets.length - 1) * cardSpacing;
      const startX = -totalWidth / 2;
      const x = startX + index * cardSpacing;
      // Stack vertically slightly so cards on the right appear on top
      return [x, 0.02 + index * 0.002, 0];
    },
    [secrets.length, scale]
  );

  const handleSecretClick = useCallback(
    (secretId: string) => {
      onSecretClick?.(secretId);
    },
    [onSecretClick]
  );

  const handleSecretHover = useCallback(
    (secretId: string | null) => {
      onSecretHover?.(secretId);
    },
    [onSecretHover]
  );

  return (
    <group position={position} rotation={rotation}>
      {/* The secrets mat */}
      <mesh geometry={matGeometry} material={matMaterial} position={[0, 0, 0]} />

      {/* Secret objective cards */}
      <group position={[0, 0.01, 0]}>
        {secrets.map((secret, index) => (
          <Suspense key={secret.id} fallback={null}>
            <SecretCardOnMat
              secret={secret}
              position={getCardPosition(index)}
              scale={scale}
              faceUp={faceUp}
              onClick={() => handleSecretClick(secret.id)}
              onHover={(hovered) => handleSecretHover(hovered ? secret.id : null)}
            />
          </Suspense>
        ))}
      </group>
    </group>
  );
}

/**
 * Export dimensions for layout calculations
 */
export const SECRETS_MAT_DIMENSIONS = {
  ...PLAYMAT_DIMENSIONS.secrets_mat,
  cardWidth: SECRET_CARD_WIDTH,
  cardHeight: SECRET_CARD_HEIGHT,
  maxSecrets: 3,
} as const;
