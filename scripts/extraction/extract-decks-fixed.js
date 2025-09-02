const fs = require('fs');
const path = require('path');

// Source paths
const colorsSourceDir = path.join(__dirname, '../../sources/TI4_map_generator_bot/src/main/resources/data/colors');
const outputDir = path.join(__dirname, '../../server/src/data/colors');

// Load and process colors data
function loadColorsData() {
  const allColors = [];
  
  // Get all JSON files in the colors directory
  const files = fs.readdirSync(colorsSourceDir)
    .filter(file => file.endsWith('.json'));
  
  files.forEach(filename => {
    const filePath = path.join(colorsSourceDir, filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const sourceName = filename.replace('.json', '');
      
      data.forEach(color => {
        const processedColor = {
          alias: color.alias,
          name: color.name,
          displayName: color.displayName || color.name,
          
          // Color type based on file name
          colorType: determineColorType(sourceName, color),
          
          // Aliases for command recognition
          aliases: color.aliases || [color.alias],
          
          // Text color for contrast
          textColor: color.textColor || 'white',
          
          // Primary color
          primaryColor: color.primaryColor || null,
          
          // Secondary color (for gradients/splits)
          secondaryColor: color.secondaryColor || null,
          
          // Gradient specific
          gradientColors: color.gradientColors || null,
          gradientDirection: color.gradientDirection || null,
          
          // Hue category
          hue: color.hue || null,
          
          // Additional properties
          hexCode: color.hexCode || colorToHex(color.primaryColor),
          rgb: color.rgb || color.primaryColor,
          
          // Source tracking
          source: color.source || sourceName
        };
        
        allColors.push(processedColor);
      });
    } catch (error) {
      console.warn('Error reading ' + filename + ':', error.message);
    }
  });
  
  return allColors;
}

// Helper function to determine color type
function determineColorType(filename, color) {
  if (filename.includes('gradient')) return 'gradient';
  if (filename.includes('split')) return 'split';
  if (filename.includes('solid')) return 'solid';
  if (color.gradientColors) return 'gradient';
  if (color.secondaryColor) return 'split';
  return 'solid';
}

// Helper function to convert RGB to hex
function colorToHex(color) {
  if (!color) return null;
  if (typeof color === 'string') return color;
  if (color.red !== undefined && color.green !== undefined && color.blue !== undefined) {
    const r = color.red.toString(16).padStart(2, '0');
    const g = color.green.toString(16).padStart(2, '0');
    const b = color.blue.toString(16).padStart(2, '0');
    return '#' + r + g + b;
  }
  return null;
}

// Generate TypeScript interface
function generateTypeScriptInterface() {
  return `// Colors - extracted from TI4_map_generator_bot
// Generated: ${new Date().toISOString()}

export interface Color {
  alias: string;
  name: string;
  displayName: string;
  colorType: ColorType;
  aliases: string[];
  textColor: string;
  primaryColor?: RGB | null;
  secondaryColor?: RGB | null;
  gradientColors?: RGB[] | null;
  gradientDirection?: string | null;
  hue?: string | null;
  hexCode?: string | null;
  rgb?: RGB | null;
  source: string;
}

export interface RGB {
  red: number;
  green: number;
  blue: number;
}

export type ColorType = 'solid' | 'gradient' | 'split';

export type Hue = 
  | 'RED'
  | 'ORANGE'
  | 'YELLOW'
  | 'GREEN'
  | 'BLUE'
  | 'PURPLE'
  | 'PINK'
  | 'GRAY'
  | 'BLACK'
  | 'WHITE';
`;
}

// Generate main index file
function generateMainIndex(colors) {
  let content = generateTypeScriptInterface();
  
  content += '\n\nexport const colors: Color[] = ' + JSON.stringify(colors, null, 2) + ';\n\n';
  
  content += `// Helper functions
export const getColorByAlias = (alias: string): Color | undefined => {
  const lowerAlias = alias.toLowerCase();
  return colors.find(color => 
    color.alias.toLowerCase() === lowerAlias ||
    color.aliases.some(a => a.toLowerCase() === lowerAlias)
  );
};

export const getColorByName = (name: string): Color | undefined => {
  return colors.find(color => 
    color.name.toLowerCase() === name.toLowerCase()
  );
};

export const getColorsByType = (type: ColorType): Color[] => {
  return colors.filter(color => color.colorType === type);
};

export const getColorsByHue = (hue: string): Color[] => {
  return colors.filter(color => 
    color.hue === hue.toUpperCase()
  );
};

export const getSolidColors = (): Color[] => {
  return getColorsByType('solid');
};

export const getGradientColors = (): Color[] => {
  return getColorsByType('gradient');
};

export const getSplitColors = (): Color[] => {
  return getColorsByType('split');
};

// Get colors with good contrast for text
export const getColorsWithLightText = (): Color[] => {
  return colors.filter(color => color.textColor === 'white');
};

export const getColorsWithDarkText = (): Color[] => {
  return colors.filter(color => color.textColor === 'black');
};

// Search colors
export const searchColors = (searchTerm: string): Color[] => {
  const term = searchTerm.toLowerCase();
  return colors.filter(color => 
    color.name.toLowerCase().includes(term) ||
    color.displayName.toLowerCase().includes(term) ||
    color.aliases.some(alias => alias.toLowerCase().includes(term))
  );
};

// Get a color's hex code
export const getColorHex = (alias: string): string | null => {
  const color = getColorByAlias(alias);
  return color?.hexCode || null;
};

// Color utility functions
export const rgbToHex = (rgb: RGB): string => {
  const r = rgb.red.toString(16).padStart(2, '0');
  const g = rgb.green.toString(16).padStart(2, '0');
  const b = rgb.blue.toString(16).padStart(2, '0');
  return '#' + r + g + b;
};

export const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? {
    red: parseInt(result[1], 16),
    green: parseInt(result[2], 16),
    blue: parseInt(result[3], 16)
  } : null;
};

// Get contrasting text color for a background
export const getContrastingTextColor = (backgroundColor: RGB): 'black' | 'white' => {
  // Using relative luminance formula
  const luminance = (0.299 * backgroundColor.red + 
                    0.587 * backgroundColor.green + 
                    0.114 * backgroundColor.blue) / 255;
  return luminance > 0.5 ? 'black' : 'white';
};
`;
  
  return content;
}

// Main execution
function main() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('Loading colors data from TI4_map_generator_bot...');
  const colors = loadColorsData();
  
  // Generate TypeScript file
  console.log('Generating TypeScript file...');
  const indexContent = generateMainIndex(colors);
  fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);
  
  // Output summary
  console.log('\n=== Extraction Summary ===');
  console.log('Total colors extracted: ' + colors.length);
  
  // Type summary
  const typeCounts = {};
  colors.forEach(color => {
    const type = color.colorType;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });
  
  console.log('\n=== Colors by Type ===');
  Object.entries(typeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(type + ': ' + count);
    });
  
  // Hue summary
  const hueCounts = {};
  colors.forEach(color => {
    if (color.hue) {
      hueCounts[color.hue] = (hueCounts[color.hue] || 0) + 1;
    }
  });
  
  console.log('\n=== Colors by Hue ===');
  Object.entries(hueCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([hue, count]) => {
      console.log(hue + ': ' + count);
    });
  
  console.log('\n✅ Colors extraction complete!');
  console.log('Generated: ' + path.join(outputDir, 'index.ts'));
}

// Run the extraction
main();