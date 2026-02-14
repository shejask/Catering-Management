# Arabic Font Support Setup for PDF Generation

This guide explains how to set up Arabic font support in your PDF generation system.

## Why Arabic Text Doesn't Work in PDFs

By default, jsPDF uses fonts like Helvetica that don't support Arabic characters. When you try to render Arabic text, it either:
- Shows as empty spaces
- Displays as boxes or question marks
- Crashes the PDF generation

## Solution: Embed Arabic Fonts

### Step 1: Download Arabic Fonts

Download these free Arabic fonts:
- **Amiri**: Excellent Arabic support, very readable
  - Download from: https://github.com/alif-type/amiri
- **Cairo**: Modern, clean Arabic font
  - Download from: https://github.com/google/fonts/tree/main/ofl/cairo

### Step 2: Convert Font to Base64

1. Place your `.ttf` font file in the project
2. Run the conversion script:
   ```bash
   node scripts/convert-font-to-base64.js fonts/Amiri-Regular.ttf
   ```
3. This creates a `Amiri-Regular-base64.js` file

### Step 3: Update Font Configuration

1. Copy the base64 string from the generated file
2. Update `src/lib/arabic-fonts.ts`:
   ```typescript
   export const AMIRI_FONT_BASE64 = `YOUR_ACTUAL_BASE64_STRING_HERE`;
   ```

### Step 4: Update PDF Generation

The `pdf-utils.ts` file now automatically:
- Detects Arabic text
- Uses Arabic fonts when available
- Handles right-to-left (RTL) text alignment
- Falls back to default fonts if Arabic fonts fail

## Example Usage

```typescript
import { downloadOrdersPDF } from './lib/pdf-utils';

const orders = [
  {
    name: 'أحمد محمد', // Arabic name
    orderDetails: 'شاورما دجاج', // Arabic order details
    // ... other fields
  }
];

downloadOrdersPDF({
  title: 'Orders Report',
  orders,
  language: 'ar', // Arabic language
  showSummary: true
});
```

## Font Conversion Alternatives

### Option 1: Use jsPDF Font Converter
1. Go to: https://raw.githack.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
2. Upload your TTF font
3. Download the generated JS file
4. Copy the base64 string

### Option 2: Online Base64 Converters
1. Use online tools like base64.guru
2. Upload your font file
3. Copy the base64 output

### Option 3: Command Line (Linux/Mac)
```bash
base64 -i font.ttf | pbcopy  # Mac
base64 -i font.ttf | xclip   # Linux
```

## Troubleshooting

### Font Not Loading
- Check that the base64 string is complete
- Ensure the font file is valid TTF/OTF
- Verify the font name matches exactly

### Arabic Text Still Not Showing
- Confirm the font was added successfully
- Check browser console for errors
- Verify the text contains actual Arabic characters

### Performance Issues
- Large fonts increase PDF file size
- Consider using subset fonts for production
- Compress fonts if possible

## Best Practices

1. **Use Web Fonts**: Download fonts from reliable sources
2. **Test with Real Data**: Use actual Arabic text, not placeholders
3. **Fallback Fonts**: Always provide fallback options
4. **Font Licensing**: Ensure fonts are free for commercial use
5. **Optimization**: Use font subsets for production

## Supported Arabic Unicode Ranges

The system automatically detects these Arabic character ranges:
- `\u0600-\u06FF`: Basic Arabic
- `\u0750-\u077F`: Arabic Supplement
- `\u08A0-\u08FF`: Arabic Extended-A
- `\uFB50-\uFDFF`: Arabic Presentation Forms-A
- `\uFE70-\uFEFF`: Arabic Presentation Forms-B

## Next Steps

1. Download an Arabic font (Amiri recommended)
2. Convert it using the provided script
3. Update the font configuration
4. Test with Arabic text
5. Enjoy proper Arabic PDF support! 🎉
