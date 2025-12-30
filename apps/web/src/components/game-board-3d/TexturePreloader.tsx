'use client';

import { useEffect, useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import type { GameState } from '@ti4/shared';
import {
  getFactionSheetUrl,
  getStrategyCardUrl,
  getActionCardBackUrl,
  getSecretObjectiveCardBackUrl,
  getPromissoryCardBackUrl,
  getCommandTokenUrl,
  getTradeGoodTokenUrl,
  getCommodityTokenUrl,
} from '@/lib/assets';
import { configureHighQualityTexture } from './textureUtils';

// Global texture cache
const textureCache = new Map<string, THREE.Texture>();

/**
 * Preload a texture and cache it with high quality settings
 * Note: anisotropy set to 16 (max on most GPUs), will be clamped by driver
 */
export function preloadTexture(url: string): Promise<THREE.Texture> {
  if (textureCache.has(url)) {
    return Promise.resolve(textureCache.get(url)!);
  }

  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        // Configure for high quality - anisotropy will be clamped by GPU
        configureHighQualityTexture(texture, 16);
        textureCache.set(url, texture);
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

/**
 * Get a cached texture or return undefined
 */
export function getCachedTexture(url: string): THREE.Texture | undefined {
  return textureCache.get(url);
}

/**
 * Preload textures for a game state
 */
export async function preloadGameTextures(gameState: GameState): Promise<void> {
  const urls: string[] = [];

  // Faction sheets for all players
  gameState.players.forEach((player) => {
    urls.push(getFactionSheetUrl(player.faction, 'face'));
    urls.push(getFactionSheetUrl(player.faction, 'back'));
    urls.push(getCommandTokenUrl(player.faction));
  });

  // Strategy cards (1-8)
  for (let i = 1; i <= 8; i++) {
    urls.push(getStrategyCardUrl(i));
  }

  // Card backs
  urls.push(getActionCardBackUrl());
  urls.push(getSecretObjectiveCardBackUrl());
  urls.push(getPromissoryCardBackUrl());

  // Common tokens
  urls.push(getTradeGoodTokenUrl());
  urls.push(getCommodityTokenUrl());

  // Preload all in parallel
  await Promise.all(urls.map((url) => preloadTexture(url).catch(() => null)));
}

interface TexturePreloaderProps {
  gameState: GameState;
  onProgress?: (loaded: number, total: number) => void;
  onComplete?: () => void;
}

/**
 * Component that preloads essential textures for the game
 * Renders nothing but triggers texture loading in background
 */
export function TexturePreloader({
  gameState,
  onProgress,
  onComplete,
}: TexturePreloaderProps) {
  useEffect(() => {
    let mounted = true;
    const urls: string[] = [];

    // Collect all URLs to preload
    gameState.players.forEach((player) => {
      urls.push(getFactionSheetUrl(player.faction, 'face'));
      urls.push(getFactionSheetUrl(player.faction, 'back'));
      urls.push(getCommandTokenUrl(player.faction));
    });

    // Strategy cards
    for (let i = 1; i <= 8; i++) {
      urls.push(getStrategyCardUrl(i));
    }

    // Card backs
    urls.push(getActionCardBackUrl());
    urls.push(getSecretObjectiveCardBackUrl());
    urls.push(getPromissoryCardBackUrl());

    // Tokens
    urls.push(getTradeGoodTokenUrl());
    urls.push(getCommodityTokenUrl());

    // Load all textures
    let loaded = 0;
    const total = urls.length;

    Promise.all(
      urls.map((url) =>
        preloadTexture(url)
          .then(() => {
            loaded++;
            if (mounted) {
              onProgress?.(loaded, total);
            }
          })
          .catch(() => {
            loaded++;
            if (mounted) {
              onProgress?.(loaded, total);
            }
          })
      )
    ).then(() => {
      if (mounted) {
        onComplete?.();
      }
    });

    return () => {
      mounted = false;
    };
  }, [gameState, onProgress, onComplete]);

  return null;
}

/**
 * Hook to use a preloaded/cached texture with high quality settings
 */
export function usePreloadedTexture(url: string): THREE.Texture | null {
  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Check cache first
  const cached = getCachedTexture(url);
  if (cached) {
    // Ensure cached texture has proper anisotropy for this GPU
    if (cached.anisotropy !== maxAnisotropy) {
      cached.anisotropy = maxAnisotropy;
      cached.needsUpdate = true;
    }
    return cached;
  }

  // Fall back to regular loading
  try {
    const texture = useLoader(TextureLoader, url);
    if (texture) {
      configureHighQualityTexture(texture, maxAnisotropy);
      textureCache.set(url, texture);
    }
    return texture;
  } catch {
    return null;
  }
}

/**
 * Clear texture cache (useful for cleanup)
 */
export function clearTextureCache(): void {
  textureCache.forEach((texture) => {
    texture.dispose();
  });
  textureCache.clear();
}

/**
 * Get cache statistics
 */
export function getTextureCacheStats(): { count: number; urls: string[] } {
  return {
    count: textureCache.size,
    urls: Array.from(textureCache.keys()),
  };
}
