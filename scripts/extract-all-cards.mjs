#!/usr/bin/env node

/**
 * Script to extract all card images from TI4-TTPG spritesheets
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const TTPG_PATH = '/tmp/ti4-ttpg';
const OUTPUT_BASE = './apps/web/public/images/cards';
const TEMPLATES_PATH = path.join(TTPG_PATH, 'assets/Templates/card');
const TEXTURES_PATH = path.join(TTPG_PATH, 'assets/Textures/en/card');

// Card types to extract
const CARD_TYPES = [
  'action',
  'agenda',
  'objective',
  'leader',
  'relic',
  'exploration',
  'promissory',
  'planet',
  'legendary_planet',
  'alliance',
  'faction_reference',
  'faction_token',
];

const EXPANSIONS = ['base', 'pok', 'codex'];

async function extractCards(templatePath, imagePath, outputDir, cardType) {
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

  const numHorizontal = template.NumHorizontal || 4;
  const numVertical = template.NumVertical || 3;
  const cardNames = template.CardNames || {};
  const cardMetadata = template.CardMetadata || {};

  if (Object.keys(cardNames).length === 0) {
    console.log(`  Skipping - no card names defined`);
    return 0;
  }

  // Get image dimensions
  const metadata = await sharp(imagePath).metadata();
  const imgWidth = metadata.width;
  const imgHeight = metadata.height;
  const cardWidth = Math.floor(imgWidth / numHorizontal);
  const cardHeight = Math.floor(imgHeight / numVertical);

  console.log(`  Grid: ${numHorizontal}x${numVertical}, Card: ${cardWidth}x${cardHeight}, Cards: ${Object.keys(cardNames).length}`);

  let extracted = 0;

  // Extract each card
  for (const [index, cardName] of Object.entries(cardNames)) {
    const idx = parseInt(index);
    const col = idx % numHorizontal;
    const row = Math.floor(idx / numHorizontal);

    const x = col * cardWidth;
    const y = row * cardHeight;

    // Generate filename from card metadata or name
    let filename;
    if (cardMetadata[index]) {
      // Extract card id from metadata like "card.action:base/ancient_burial_sites"
      const metaParts = cardMetadata[index].split('/');
      filename = metaParts[metaParts.length - 1];
    } else {
      // Fallback: convert card name to snake_case
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

async function processCardType(cardType) {
  const outputDir = path.join(OUTPUT_BASE, cardType);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalExtracted = 0;

  for (const expansion of EXPANSIONS) {
    const templateDir = path.join(TEMPLATES_PATH, cardType, expansion);
    const textureDir = path.join(TEXTURES_PATH, cardType, expansion);

    if (!fs.existsSync(templateDir)) {
      continue;
    }

    // Find all JSON template files
    const jsonFiles = fs.readdirSync(templateDir).filter(f => f.endsWith('.json'));

    for (const jsonFile of jsonFiles) {
      const templatePath = path.join(templateDir, jsonFile);
      const imageFile = jsonFile.replace('.json', '.face.jpg');
      const imagePath = path.join(textureDir, imageFile);

      if (!fs.existsSync(imagePath)) {
        continue;
      }

      console.log(`Processing ${cardType}/${expansion}/${jsonFile}...`);
      const extracted = await extractCards(templatePath, imagePath, outputDir, cardType);
      totalExtracted += extracted;
    }
  }

  return totalExtracted;
}

async function main() {
  console.log('Extracting all card images from TI4-TTPG...\n');

  let grandTotal = 0;

  for (const cardType of CARD_TYPES) {
    console.log(`\n=== ${cardType.toUpperCase()} ===`);
    const count = await processCardType(cardType);
    console.log(`  Total: ${count} cards`);
    grandTotal += count;
  }

  console.log(`\n✅ Done! Extracted ${grandTotal} total card images to: ${OUTPUT_BASE}`);
}

main().catch(console.error);
