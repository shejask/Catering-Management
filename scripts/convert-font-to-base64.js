#!/usr/bin/env node

/**
 * Font to Base64 Converter for jsPDF
 * 
 * This script converts TTF/OTF fonts to base64 format that can be used
 * with jsPDF for proper Arabic text support.
 * 
 * Usage:
 * 1. Install dependencies: npm install fs path
 * 2. Place your .ttf or .otf font file in the fonts/ directory
 * 3. Run: node scripts/convert-font-to-base64.js <font-filename>
 * 
 * Example:
 * node scripts/convert-font-to-base64.js Amiri-Regular.ttf
 */

const fs = require('fs');
const path = require('path');

function convertFontToBase64(fontPath) {
  try {
    // Read the font file
    const fontBuffer = fs.readFileSync(fontPath);
    
    // Convert to base64
    const base64String = fontBuffer.toString('base64');
    
    // Generate the JavaScript output
    const fontName = path.basename(fontPath, path.extname(fontPath));
    const outputFileName = `${fontName}-base64.js`;
    
    const jsOutput = `// ${fontName} font converted to base64 for jsPDF
// Generated on: ${new Date().toISOString()}
// Original file: ${fontPath}

export const ${fontName.replace(/[^a-zA-Z0-9]/g, '_')}_BASE64 = \`${base64String}\`;

// Usage in jsPDF:
// doc.addFileToVFS('${path.basename(fontPath)}', ${fontName.replace(/[^a-zA-Z0-9]/g, '_')}_BASE64);
// doc.addFont('${path.basename(fontPath)}', '${fontName}', 'normal');
`;

    // Write the output file
    fs.writeFileSync(outputFileName, jsOutput);
    
    console.log(`✅ Font converted successfully!`);
    console.log(`📁 Output file: ${outputFileName}`);
    console.log(`📏 Base64 length: ${base64String.length} characters`);
    console.log(`\n📋 Copy the base64 string to your arabic-fonts.ts file`);
    
  } catch (error) {
    console.error('❌ Error converting font:', error.message);
    process.exit(1);
  }
}

// Main execution
const fontPath = process.argv[2];

if (!fontPath) {
  console.log('❌ Please provide a font file path');
  console.log('Usage: node scripts/convert-font-to-base64.js <font-filename>');
  console.log('Example: node scripts/convert-font-to-base64.js fonts/Amiri-Regular.ttf');
  process.exit(1);
}

if (!fs.existsSync(fontPath)) {
  console.error(`❌ Font file not found: ${fontPath}`);
  process.exit(1);
}

convertFontToBase64(fontPath);
