#!/usr/bin/env node
/**
 * Download TI4 system tile images from KeeganW/ti4 GitHub repo
 *
 * Source: https://github.com/KeeganW/ti4/tree/master/public/tiles
 * Format: ST_{number}.webp
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/KeeganW/ti4/master/public/tiles';
const OUTPUT_DIR = path.resolve(__dirname, '../apps/web/public/assets/tiles');

// All tile numbers we need (base game + PoK)
const TILE_IDS = [
  // Mecatol Rex
  '18',
  // Home systems (01-17, 51-58 for PoK)
  ...Array.from({ length: 17 }, (_, i) => String(i + 1).padStart(2, '0')),
  '51', '52', '53', '54', '55', '56', '57', '58',
  // Blue tiles (19-38)
  ...Array.from({ length: 20 }, (_, i) => String(i + 19)),
  // Red tiles (39-50)
  ...Array.from({ length: 12 }, (_, i) => String(i + 39)),
  // PoK blue tiles (59-76)
  ...Array.from({ length: 18 }, (_, i) => String(i + 59)),
  // PoK red tiles (77-82)
  ...Array.from({ length: 6 }, (_, i) => String(i + 77)),
  // Hyperlane tiles (83-91 with A/B variants)
  '83A', '83B', '84A', '84B', '85A', '85B', '86A', '86B', '87A', '87B', '88A', '88B', '89A', '89B', '90A', '90B', '91A', '91B',
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function downloadTiles() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Downloading tiles to ${OUTPUT_DIR}...`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const tileId of TILE_IDS) {
    const filename = `ST_${tileId}.webp`;
    const url = `${GITHUB_RAW_BASE}/${filename}`;
    const dest = path.join(OUTPUT_DIR, filename);

    // Skip if already exists
    if (fs.existsSync(dest)) {
      console.log(`  Skipping ${filename} (already exists)`);
      skipped++;
      continue;
    }

    try {
      await downloadFile(url, dest);
      console.log(`  Downloaded ${filename}`);
      downloaded++;
    } catch (error) {
      console.error(`  Failed to download ${filename}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`);
}

downloadTiles().catch(console.error);
