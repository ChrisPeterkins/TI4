import * as THREE from 'three';

/**
 * Create a D10 (pentagonal trapezohedron) geometry
 * The d10 has 10 faces - 5 on top and 5 on bottom, offset
 *
 * Face values (1-10) are assigned to each triangular face
 */
export function createD10Geometry(size: number = 1): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const faceValues: number[] = []; // Which face corresponds to which number

  // The d10 is a pentagonal trapezohedron
  // It has 10 vertices: 1 top apex, 5 upper ring, 5 lower ring, 1 bottom apex

  const scale = size;
  const topHeight = 0.8 * scale;
  const bottomHeight = -0.8 * scale;
  const upperRingHeight = 0.3 * scale;
  const lowerRingHeight = -0.3 * scale;
  const upperRadius = 0.65 * scale;
  const lowerRadius = 0.65 * scale;

  // Generate vertices
  // Apex vertices
  const topApex: THREE.Vector3 = new THREE.Vector3(0, topHeight, 0);
  const bottomApex: THREE.Vector3 = new THREE.Vector3(0, bottomHeight, 0);

  // Upper ring (5 vertices)
  const upperRing: THREE.Vector3[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    upperRing.push(
      new THREE.Vector3(
        Math.cos(angle) * upperRadius,
        upperRingHeight,
        Math.sin(angle) * upperRadius
      )
    );
  }

  // Lower ring (5 vertices, offset by 36 degrees)
  const lowerRing: THREE.Vector3[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2 + Math.PI / 5;
    lowerRing.push(
      new THREE.Vector3(
        Math.cos(angle) * lowerRadius,
        lowerRingHeight,
        Math.sin(angle) * lowerRadius
      )
    );
  }

  // Create faces
  // Upper 5 kite faces (apex -> upper[i] -> lower[i] -> upper[i+1])
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    addKiteFace(
      topApex,
      upperRing[i],
      lowerRing[i],
      upperRing[next],
      i + 1 // face value 1-5
    );
  }

  // Lower 5 kite faces (bottom -> lower[i+1] -> upper[i+1] -> lower[i])
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    addKiteFace(
      bottomApex,
      lowerRing[next],
      upperRing[next],
      lowerRing[i],
      i + 6 // face value 6-10
    );
  }

  function addKiteFace(
    v1: THREE.Vector3,
    v2: THREE.Vector3,
    v3: THREE.Vector3,
    v4: THREE.Vector3,
    faceValue: number
  ) {
    const baseIndex = vertices.length / 3;

    // Calculate face normal
    const edge1 = new THREE.Vector3().subVectors(v2, v1);
    const edge2 = new THREE.Vector3().subVectors(v3, v1);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    // Add vertices for two triangles forming the kite
    // Triangle 1: v1, v2, v3
    vertices.push(v1.x, v1.y, v1.z);
    vertices.push(v2.x, v2.y, v2.z);
    vertices.push(v3.x, v3.y, v3.z);

    // Triangle 2: v1, v3, v4
    vertices.push(v1.x, v1.y, v1.z);
    vertices.push(v3.x, v3.y, v3.z);
    vertices.push(v4.x, v4.y, v4.z);

    // Add normals
    for (let j = 0; j < 6; j++) {
      normals.push(normal.x, normal.y, normal.z);
    }

    // Add indices
    indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
    indices.push(baseIndex + 3, baseIndex + 4, baseIndex + 5);

    // UVs for potential texturing
    uvs.push(0.5, 1); // apex
    uvs.push(0, 0.5);
    uvs.push(0.5, 0);
    uvs.push(0.5, 1);
    uvs.push(0.5, 0);
    uvs.push(1, 0.5);

    // Store face value for both triangles
    faceValues.push(faceValue, faceValue);
  }

  // Create geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  // Store face values as user data for face detection
  geometry.userData.faceValues = faceValues;

  return geometry;
}

/**
 * Determine which face is pointing up based on mesh rotation
 * Returns a value 1-10
 */
export function getD10UpFace(rotation: THREE.Euler): number {
  // Create face normals for each kite face and check which points most upward
  const upVector = new THREE.Vector3(0, 1, 0);
  const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(rotation);

  // Define the center normals of each face (pointing outward from center)
  const faceNormals: THREE.Vector3[] = [];

  // Upper faces (1-5)
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2 + Math.PI / 10;
    const normal = new THREE.Vector3(
      Math.cos(angle) * 0.5,
      0.5,
      Math.sin(angle) * 0.5
    ).normalize();
    faceNormals.push(normal);
  }

  // Lower faces (6-10)
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2 + Math.PI / 10 + Math.PI / 5;
    const normal = new THREE.Vector3(
      Math.cos(angle) * 0.5,
      -0.5,
      Math.sin(angle) * 0.5
    ).normalize();
    faceNormals.push(normal);
  }

  // Find which face normal points most upward after rotation
  let maxDot = -1;
  let upFace = 1;

  for (let i = 0; i < faceNormals.length; i++) {
    const rotatedNormal = faceNormals[i].clone().applyMatrix4(rotationMatrix);
    const dot = rotatedNormal.dot(upVector);

    if (dot > maxDot) {
      maxDot = dot;
      upFace = i + 1;
    }
  }

  return upFace;
}

/**
 * Create a convex hull for physics collision
 * Returns vertices for cannon-es ConvexPolyhedron
 */
export function getD10ConvexHullPoints(size: number = 1): [number, number, number][] {
  const points: [number, number, number][] = [];

  const scale = size;
  const topHeight = 0.8 * scale;
  const bottomHeight = -0.8 * scale;
  const upperRingHeight = 0.3 * scale;
  const lowerRingHeight = -0.3 * scale;
  const radius = 0.65 * scale;

  // Add apex vertices
  points.push([0, topHeight, 0]);
  points.push([0, bottomHeight, 0]);

  // Add ring vertices
  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    points.push([Math.cos(angle) * radius, upperRingHeight, Math.sin(angle) * radius]);
  }

  for (let i = 0; i < 5; i++) {
    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2 + Math.PI / 5;
    points.push([Math.cos(angle) * radius, lowerRingHeight, Math.sin(angle) * radius]);
  }

  return points;
}
