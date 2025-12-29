import * as THREE from 'three';
import { HEX_CONFIG } from './constants';

/**
 * Hex coordinate (axial)
 */
export interface HexCoord {
  q: number;
  r: number;
}

/**
 * Convert axial hex coordinates to 3D world position
 * Uses flat-top hexagon layout
 */
export function hexToWorld3D(hex: HexCoord): THREE.Vector3 {
  const { radius, gap } = HEX_CONFIG;
  const size = radius + gap / 2;

  // Flat-top hex spacing
  // Horizontal distance between hex centers
  const horizDist = size * 1.5;
  // Vertical distance between hex centers
  const vertDist = size * Math.sqrt(3);

  const x = hex.q * horizDist;
  const z = hex.r * vertDist + (hex.q * vertDist) / 2;

  return new THREE.Vector3(x, 0, z);
}

/**
 * Convert 3D world position to approximate hex coordinates
 * Useful for raycasting/picking
 */
export function world3DToHex(position: THREE.Vector3): HexCoord {
  const { radius, gap } = HEX_CONFIG;
  const size = radius + gap / 2;

  const horizDist = size * 1.5;
  const vertDist = size * Math.sqrt(3);

  const q = position.x / horizDist;
  const r = (position.z - (q * vertDist) / 2) / vertDist;

  // Round to nearest hex
  return {
    q: Math.round(q),
    r: Math.round(r),
  };
}

/**
 * Create hexagon shape for extrusion
 * Returns a THREE.Shape representing a flat-top hexagon
 */
export function createHexShape(radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const angleOffset = Math.PI / 6; // 30 degrees for flat-top

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + angleOffset;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();
  return shape;
}

/**
 * Get the corners of a hexagon in 3D space
 */
export function getHexCorners3D(
  center: THREE.Vector3,
  radius: number
): THREE.Vector3[] {
  const corners: THREE.Vector3[] = [];
  const angleOffset = Math.PI / 6; // 30 degrees for flat-top

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + angleOffset;
    corners.push(
      new THREE.Vector3(
        center.x + radius * Math.cos(angle),
        center.y,
        center.z + radius * Math.sin(angle)
      )
    );
  }

  return corners;
}

/**
 * Calculate bounds of a set of hex positions in 3D
 */
export function getHexBounds3D(positions: HexCoord[]): {
  min: THREE.Vector3;
  max: THREE.Vector3;
  center: THREE.Vector3;
} {
  if (positions.length === 0) {
    return {
      min: new THREE.Vector3(),
      max: new THREE.Vector3(),
      center: new THREE.Vector3(),
    };
  }

  const worldPositions = positions.map(hexToWorld3D);
  const { radius } = HEX_CONFIG;

  const min = new THREE.Vector3(Infinity, 0, Infinity);
  const max = new THREE.Vector3(-Infinity, 0, -Infinity);

  worldPositions.forEach((pos) => {
    min.x = Math.min(min.x, pos.x - radius);
    min.z = Math.min(min.z, pos.z - radius);
    max.x = Math.max(max.x, pos.x + radius);
    max.z = Math.max(max.z, pos.z + radius);
  });

  const center = new THREE.Vector3(
    (min.x + max.x) / 2,
    0,
    (min.z + max.z) / 2
  );

  return { min, max, center };
}
