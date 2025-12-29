#!/usr/bin/env node

/**
 * Script to extract objective and exploration cards from TI4-TTPG
 * (These have different directory structures)
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const TTPG_PATH = '/tmp/ti4-ttpg';
const OUTPUT_BASE = './apps/web/public/images/cards';
const TEMPLATES_PATH = path.join(TTPG_PATH, 'assets/Templates/card');
const TEXTURES_PATH = path.join(TTPG_PATH, 'assets/Textures/en/card');

async function extractCards(templatePath, imagePath, outputDir) {
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

  const numHorizontal = template.NumHorizontal || 4;
  const numVertical = template.NumVertical || 3;
  const cardNames = template.CardNames || {};
  const cardMetadata = template.CardMetadata || {};

  if (Object.keys(cardNames).length === 0) {
    return 0;
  }

  const metadata = await sharp(imagePath).metadata();
  const imgWidth = metadata.width;
  const imgHeight = metadata.height;
  const cardWidth = Math.floor(imgWidth / numHorizontal);
  const cardHeight = Math.floor(imgHeight / numVertical);

  console.log(`  Grid: ${numHorizontal}x${numVertical}, Cards: ${Object.keys(cardNames).length}`);

  let extracted = 0;

  for (const [index, cardName] of Object.entries(cardNames)) {
    const idx = parseInt(index);
    const col = idx % numHorizontal;
    const row = Math.floor(idx / numHorizontal);

    const x = col * cardWidth;
    const y = row * cardHeight;

    let filename;
    if (cardMetadata[index]) {
      const metaParts = cardMetadata[index].split('/');
      filename = metaParts[metaParts.length - 1];
    } else {
      filename = cardName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }

    const outputPath = path.join(outputDir, `${filename}.jpg`);

    try {
      await sharp(imagePath)
        .extract({ left: x, top: y, width: cardWidth, height: cardHeight })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
      extracted++;
    } catch (err) {
      console.log(`  ✗ ${filename}: ${err.message}`);
    }
  }

  return extracted;
}

async function processDirectory(templateDir, textureDir, outputDir, prefix = '') {
  if (!fs.existsSync(templateDir)) return 0;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let total = 0;
  const entries = fs.readdirSync(templateDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Recurse into subdirectory
      total += await processDirectory(
        path.join(templateDir, entry.name),
        path.join(textureDir, entry.name),
        outputDir,
        `${prefix}${entry.name}/`
      );
    } else if (entry.name.endsWith('.json')) {
      const templatePath = path.join(templateDir, entry.name);
      const imageFile = entry.name.replace('.json', '.face.jpg');
      const imagePath = path.join(textureDir, imageFile);

      if (fs.existsSync(imagePath)) {
        console.log(`Processing ${prefix}${entry.name}...`);
        total += await extractCards(templatePath, imagePath, outputDir);
      }
    }
  }

  return total;
}

async function main() {
  console.log('Extracting objective and exploration cards...\n');

  // Objectives
  console.log('=== OBJECTIVES ===');
  const objDir = path.join(OUTPUT_BASE, 'objective');
  const objCount = await processDirectory(
    path.join(TEMPLATES_PATH, 'objective'),
    path.join(TEXTURES_PATH, 'objective'),
    objDir
  );
  console.log(`Total objectives: ${objCount}\n`);

  // Exploration
  console.log('=== EXPLORATION ===');
  const expDir = path.join(OUTPUT_BASE, 'exploration');
  const expCount = await processDirectory(
    path.join(TEMPLATES_PATH, 'exploration'),
    path.join(TEXTURES_PATH, 'exploration'),
    expDir
  );
  console.log(`Total exploration: ${expCount}\n`);

  console.log(`✅ Done! Extracted ${objCount + expCount} additional cards`);
}

main().catch(console.error);
