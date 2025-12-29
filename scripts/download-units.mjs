#!/usr/bin/env node
/**
 * Download TI4 unit plastic images from the Fandom wiki
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../apps/web/public/assets/units');

// Unit image URLs from the TI4 wiki (using full resolution without scale-to-width)
const UNIT_IMAGES = {
  'Fighter_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/c/c2/Fighter_Plastic.png/revision/latest',
  'Carrier_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/c/cd/Carrier_Plastic.png/revision/latest',
  'Cruiser_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/8/8a/Cruiser_Plastic.png/revision/latest',
  'Destroyer_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/1/14/Destroyer_Plastic.png/revision/latest',
  'Dreadnought_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/b/b9/Dreadnought_Plastic.png/revision/latest',
  'Flagship_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/8/8e/Flagship_Plastic.png/revision/latest',
  'War_Sun_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/e/e8/War_Sun_Plastic.png/revision/latest',
  'Infantry_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/3/33/Infantry_Plastic.png/revision/latest',
  'Mech_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/8/83/Mech_Plastic.png/revision/latest',
  'Space_Dock_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/6/62/Space_Dock_Plastic.png/revision/latest',
  'PDS_Plastic.png': 'https://static.wikia.nocookie.net/twilight-imperium-4/images/c/cf/PDS_Plastic.png/revision/latest',
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });

    request.on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function downloadUnits() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Downloading unit images to ${OUTPUT_DIR}...`);

  let downloaded = 0;
  let failed = 0;

  for (const [filename, url] of Object.entries(UNIT_IMAGES)) {
    const dest = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(dest)) {
      console.log(`  Skipping ${filename} (already exists)`);
      downloaded++;
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

  console.log(`\nDone! Downloaded: ${downloaded}, Failed: ${failed}`);
}

downloadUnits().catch(console.error);
