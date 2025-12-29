#!/usr/bin/env node

/**
 * Downloads unit 3D models (OBJ format) from TI4-TTPG repository
 * Models are stored in /apps/web/public/models/units/
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../apps/web/public/models/units');

// Base URL for raw files from TTPG repo
const BASE_URL = 'https://raw.githubusercontent.com/TI4-Online/TI4-TTPG/main/assets/Models/units/base';

// Unit models to download
const UNIT_MODELS = [
  'carrier.obj',
  'cruiser.obj',
  'destroyer.obj',
  'dreadnought.obj',
  'fighter.obj',
  'flagship.obj',
  'infantry.obj',
  'pds.obj',
  'spacedock.obj',
  'warsun.obj',
];

async function downloadFile(url, outputPath) {
  console.log(`Downloading ${path.basename(outputPath)}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  await writeFile(outputPath, text);
  console.log(`  Saved to ${outputPath}`);
}

async function main() {
  console.log('Downloading TI4 unit models from TTPG repository...\n');

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}\n`);
  }

  let success = 0;
  let failed = 0;

  for (const model of UNIT_MODELS) {
    const url = `${BASE_URL}/${model}`;
    const outputPath = path.join(OUTPUT_DIR, model);

    try {
      await downloadFile(url, outputPath);
      success++;
    } catch (error) {
      console.error(`  Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nDownload complete: ${success} succeeded, ${failed} failed`);
}

main().catch(console.error);
