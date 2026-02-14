// Arabic font configuration for PDF generation
// This file contains base64 encoded Arabic fonts that support RTL text

// IMPORTANT: You need to replace this with actual font data
// Download Amiri font from: https://github.com/alif-type/amiri/releases
// Convert using: node scripts/convert-font-to-base64.js fonts/Amiri-Regular.ttf

// Placeholder for Amiri font - REPLACE WITH ACTUAL BASE64 STRING
export const AMIRI_FONT_BASE64 = '';

// Placeholder for Cairo font - REPLACE WITH ACTUAL BASE64 STRING  
export const CAIRO_FONT_BASE64 = '';

// Font configuration interface
export interface ArabicFontConfig {
  name: string;
  base64: string;
  weight: 'normal' | 'bold';
  style: 'normal' | 'italic';
}

// Available Arabic fonts
export const ARABIC_FONTS: ArabicFontConfig[] = [
  {
    name: 'Amiri',
    base64: AMIRI_FONT_BASE64,
    weight: 'normal',
    style: 'normal'
  },
  {
    name: 'Cairo',
    base64: CAIRO_FONT_BASE64,
    weight: 'normal',
    style: 'normal'
  }
];

// Helper function to detect if text contains Arabic characters
export const containsArabic = (text: string): boolean => {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
};

// Helper function to get text direction
export const getTextDirection = (text: string): 'ltr' | 'rtl' => {
  return containsArabic(text) ? 'rtl' : 'ltr';
};

// Check if Arabic fonts are available
export const hasArabicFonts = (): boolean => {
  return ARABIC_FONTS.some(font => font.base64 && font.base64.length > 100);
};

// Get the first available Arabic font
export const getAvailableArabicFont = (): ArabicFontConfig | null => {
  return ARABIC_FONTS.find(font => font.base64 && font.base64.length > 100) || null;
};
