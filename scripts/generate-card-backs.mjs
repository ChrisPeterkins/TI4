#!/usr/bin/env node

/**
 * Generate placeholder card back images
 * These are simple colored backgrounds with labels
 * Replace with official images when available
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './apps/web/public/images/card-backs';

// Card back configurations
const CARD_BACKS = [
  { name: 'action', color: '#1e3a5f', label: 'ACTION' },
  { name: 'agenda', color: '#5f1e3a', label: 'AGENDA' },
  { name: 'objective_stage1', color: '#3a5f1e', label: 'STAGE I' },
  { name: 'objective_stage2', color: '#5f3a1e', label: 'STAGE II' },
  { name: 'secret_objective', color: '#3a1e5f', label: 'SECRET' },
  { name: 'exploration_cultural', color: '#1e5f5f', label: 'CULTURAL' },
  { name: 'exploration_hazardous', color: '#5f5f1e', label: 'HAZARDOUS' },
  { name: 'exploration_industrial', color: '#5f1e1e', label: 'INDUSTRIAL' },
  { name: 'exploration_frontier', color: '#1e1e5f', label: 'FRONTIER' },
  { name: 'relic', color: '#5f5f5f', label: 'RELIC' },
  { name: 'promissory', color: '#3a3a1e', label: 'PROMISSORY' },
  { name: 'generic', color: '#2a2a2a', label: 'TI4' },
];

// Card dimensions (standard card ratio)
const CARD_WIDTH = 375;
const CARD_HEIGHT = 525;

function generateCardBack(config) {
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = config.color;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Add border
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 8;
  ctx.strokeRect(15, 15, CARD_WIDTH - 30, CARD_HEIGHT - 30);

  // Add inner border
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.strokeRect(25, 25, CARD_WIDTH - 50, CARD_HEIGHT - 50);

  // Add decorative pattern (simple)
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const y = 60 + i * 50;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(CARD_WIDTH - 40, y);
    ctx.stroke();
  }

  // Add label
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.label, CARD_WIDTH / 2, CARD_HEIGHT / 2 - 20);

  // Add "TWILIGHT IMPERIUM" text
  ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('TWILIGHT IMPERIUM', CARD_WIDTH / 2, CARD_HEIGHT / 2 + 30);

  return canvas;
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate all card backs
console.log('Generating card back images...');

for (const config of CARD_BACKS) {
  const canvas = generateCardBack(config);
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(OUTPUT_DIR, `${config.name}.png`);
  fs.writeFileSync(outputPath, buffer);
  console.log(`  Created: ${config.name}.png`);
}

console.log('Done! Card backs generated in', OUTPUT_DIR);
