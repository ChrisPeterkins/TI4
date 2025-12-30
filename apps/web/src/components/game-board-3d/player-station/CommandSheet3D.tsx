'use client';

import { useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import type { PlayerState } from '@ti4/shared';
import { TokenStack3D } from './TokenStack3D';

// Command sheet dimensions
const SHEET_WIDTH = 3.0;
const SHEET_HEIGHT = 1.2;
const SHEET_DEPTH = 0.01;

// Token pool positions (relative to sheet center)
const POOL_SPACING = 0.8;
const POOL_Y = 0.15; // Slightly above the sheet

export interface CommandSheet3DProps {
  player: PlayerState;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  onTradeGoodsClick?: () => void;
  onCommoditiesClick?: () => void;
  onTokenPoolClick?: (pool: 'tactics' | 'fleet' | 'strategy') => void;
}

/**
 * A 3D command sheet showing token pools and resources
 * Displays: Tactics, Fleet, Strategy tokens + Trade Goods + Commodities
 */
export function CommandSheet3D({
  player,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onTradeGoodsClick,
  onCommoditiesClick,
  onTokenPoolClick,
}: CommandSheet3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Click handlers
  const handleTacticsClick = useCallback(() => {
    onTokenPoolClick?.('tactics');
  }, [onTokenPoolClick]);

  const handleFleetClick = useCallback(() => {
    onTokenPoolClick?.('fleet');
  }, [onTokenPoolClick]);

  const handleStrategyClick = useCallback(() => {
    onTokenPoolClick?.('strategy');
  }, [onTokenPoolClick]);

  // Sheet base geometry and material
  const sheetGeometry = useMemo(() => {
    return new THREE.BoxGeometry(SHEET_WIDTH, SHEET_DEPTH, SHEET_HEIGHT);
  }, []);

  const sheetMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#1a2030',
      roughness: 0.9,
      metalness: 0.0,
    });
  }, []);

  // Pool divider lines
  const dividerGeometry = useMemo(() => {
    return new THREE.BoxGeometry(0.02, SHEET_DEPTH + 0.005, SHEET_HEIGHT * 0.8);
  }, []);

  const dividerMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#2a3040',
      roughness: 0.8,
    });
  }, []);

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* Base sheet */}
      <mesh geometry={sheetGeometry} material={sheetMaterial} />

      {/* Pool dividers */}
      <mesh
        geometry={dividerGeometry}
        material={dividerMaterial}
        position={[-POOL_SPACING / 2, SHEET_DEPTH / 2, 0]}
      />
      <mesh
        geometry={dividerGeometry}
        material={dividerMaterial}
        position={[POOL_SPACING / 2, SHEET_DEPTH / 2, 0]}
      />

      {/* Tactics Pool */}
      <group position={[-POOL_SPACING, POOL_Y, -0.15]}>
        <TokenStack3D
          tokenType="command"
          count={player.commandTokens.tactics}
          factionId={player.faction}
          label="Tactics"
          showCount={true}
          onClick={handleTacticsClick}
        />
      </group>

      {/* Fleet Pool */}
      <group position={[0, POOL_Y, -0.15]}>
        <TokenStack3D
          tokenType="command"
          count={player.commandTokens.fleet}
          factionId={player.faction}
          label="Fleet"
          showCount={true}
          onClick={handleFleetClick}
        />
      </group>

      {/* Strategy Pool */}
      <group position={[POOL_SPACING, POOL_Y, -0.15]}>
        <TokenStack3D
          tokenType="command"
          count={player.commandTokens.strategy}
          factionId={player.faction}
          label="Strategy"
          showCount={true}
          onClick={handleStrategyClick}
        />
      </group>

      {/* Trade Goods */}
      <group position={[-POOL_SPACING / 2, POOL_Y, 0.35]}>
        <TokenStack3D
          tokenType="trade_good"
          count={player.tradeGoods}
          label="TG"
          showCount={true}
          onClick={onTradeGoodsClick}
        />
      </group>

      {/* Commodities */}
      <group position={[POOL_SPACING / 2, POOL_Y, 0.35]}>
        <TokenStack3D
          tokenType="commodity"
          count={player.commodities}
          label={`C (${player.commodities}/${player.maxCommodities})`}
          showCount={true}
          onClick={onCommoditiesClick}
        />
      </group>

      {/* Pool Labels on the sheet surface */}
      <Text
        position={[-POOL_SPACING, SHEET_DEPTH + 0.005, 0.45]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.08}
        color="#4a5568"
        anchorX="center"
        anchorY="middle"
      >
        TACTICS
      </Text>
      <Text
        position={[0, SHEET_DEPTH + 0.005, 0.45]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.08}
        color="#4a5568"
        anchorX="center"
        anchorY="middle"
      >
        FLEET
      </Text>
      <Text
        position={[POOL_SPACING, SHEET_DEPTH + 0.005, 0.45]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.08}
        color="#4a5568"
        anchorX="center"
        anchorY="middle"
      >
        STRATEGY
      </Text>
    </group>
  );
}

/**
 * Constants for command sheet dimensions
 */
export const COMMAND_SHEET_DIMENSIONS = {
  width: SHEET_WIDTH,
  height: SHEET_HEIGHT,
  depth: SHEET_DEPTH,
} as const;
