import * as THREE from 'three';

/**
 * Configure texture for high quality rendering
 * - Uses mipmaps for better downscaling
 * - Enables anisotropic filtering for textures viewed at angles
 *
 * @param texture - The texture to configure
 * @param maxAnisotropy - Max anisotropy level from renderer capabilities
 */
export function configureHighQualityTexture(
  texture: THREE.Texture,
  maxAnisotropy: number = 16
): void {
  texture.colorSpace = THREE.SRGBColorSpace;
  // Use mipmaps for better quality when scaled down
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  // Anisotropic filtering for textures viewed at angles
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
}

/**
 * Configure texture for basic quality (no mipmaps, less GPU intensive)
 * Use for UI elements or textures that are always viewed straight-on
 */
export function configureBasicTexture(texture: THREE.Texture): void {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
}
