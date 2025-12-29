#!/usr/bin/env node

/**
 * Script to extract individual technology card images from TI4-TTPG spritesheets
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const TTPG_PATH = '/tmp/ti4-ttpg';
const OUTPUT_DIR = './apps/web/public/images/technology';
const TEMPLATES_PATH = path.join(TTPG_PATH, 'assets/Templates/card/technology');
const TEXTURES_PATH = path.join(TTPG_PATH, 'assets/Textures/en/card/technology');

// Technology colors we want to extract
const COLORS = ['blue', 'green', 'red', 'yellow'];
const EXPANSIONS = ['base', 'pok'];

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function extractCards(templatePath, imagePath, outputDir) {
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));

  const numHorizontal = template.NumHorizontal || 4;
  const numVertical = template.NumVertical || 3;
  const cardNames = template.CardNames || {};
  const cardMetadata = template.CardMetadata || {};

  // Get image dimensions
  const metadata = await sharp(imagePath).metadata();
  const imgWidth = metadata.width;
  const imgHeight = metadata.height;
  const cardWidth = Math.floor(imgWidth / numHorizontal);
  const cardHeight = Math.floor(imgHeight / numVertical);

  console.log(`  Image: ${imgWidth}x${imgHeight}, Card: ${cardWidth}x${cardHeight}, Cards: ${Object.keys(cardNames).length}`);

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
      // Extract tech id from metadata like "card.technology.green:base/neural_motivator"
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
      console.log(`  ✓ ${filename}`);
    } catch (err) {
      console.log(`  ✗ ${filename}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('Extracting technology card images...\n');

  // Process each color and expansion
  for (const color of COLORS) {
    for (const expansion of EXPANSIONS) {
      const templateDir = path.join(TEMPLATES_PATH, color, expansion);
      const textureDir = path.join(TEXTURES_PATH, color, expansion);

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

        console.log(`Processing ${color}/${expansion}/${imageFile}...`);
        await extractCards(templatePath, imagePath, OUTPUT_DIR);
      }
    }
  }

  // Process unit upgrades
  const unitUpgradeDir = path.join(TEMPLATES_PATH, 'unit_upgrade');
  const unitTextureDir = path.join(TEXTURES_PATH, 'unit_upgrade');

  for (const expansion of EXPANSIONS) {
    const templateDir = path.join(unitUpgradeDir, expansion);
    const textureDir = path.join(unitTextureDir, expansion);

    if (!fs.existsSync(templateDir)) continue;

    const jsonFiles = fs.readdirSync(templateDir).filter(f => f.endsWith('.json'));

    for (const jsonFile of jsonFiles) {
      const templatePath = path.join(templateDir, jsonFile);
      const imageFile = jsonFile.replace('.json', '.face.jpg');
      const imagePath = path.join(textureDir, imageFile);

      if (!fs.existsSync(imagePath)) continue;

      console.log(`Processing unit_upgrade/${expansion}/${imageFile}...`);
      await extractCards(templatePath, imagePath, OUTPUT_DIR);
    }
  }

  // Count extracted files
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.jpg'));
  console.log(`\n✅ Done! Extracted ${files.length} technology card images to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
