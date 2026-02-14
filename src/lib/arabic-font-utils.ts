// Enhanced Arabic Font Utilities for PDF Generation
// This file handles Arabic text processing and font management with better support

export interface ArabicFont {
    name: string;
    base64: string;
    family: string;
  }
  
  // Arabic Unicode ranges for detection
  const ARABIC_RANGES = [
    /[\u0600-\u06FF]/, // Arabic
    /[\u0750-\u077F]/, // Arabic Supplement
    /[\u08A0-\u08FF]/, // Arabic Extended-A
    /[\uFB50-\uFDFF]/, // Arabic Presentation Forms-A
    /[\uFE70-\uFEFF]/, // Arabic Presentation Forms-B
  ];
  
  // Check if text contains Arabic characters
  export const containsArabic = (text: string): boolean => {
    return ARABIC_RANGES.some(range => range.test(text));
  };
  
  // Get text direction based on content
  export const getTextDirection = (text: string): 'ltr' | 'rtl' => {
    return containsArabic(text) ? 'rtl' : 'ltr';
  };
  
  // Arabic character mapping for better PDF rendering
  const ARABIC_CHAR_MAP: { [key: string]: string } = {
    'ا': '\u0627', // Alif
    'ب': '\u0628', // Beh
    'ت': '\u062A', // Teh
    'ث': '\u062B', // Theh
    'ج': '\u062C', // Jeem
    'ح': '\u062D', // Hah
    'خ': '\u062E', // Khah
    'د': '\u062F', // Dal
    'ذ': '\u0630', // Thal
    'ر': '\u0631', // Reh
    'ز': '\u0632', // Zain
    'س': '\u0633', // Seen
    'ش': '\u0634', // Sheen
    'ص': '\u0635', // Sad
    'ض': '\u0636', // Dad
    'ط': '\u0637', // Tah
    'ظ': '\u0638', // Zah
    'ع': '\u0639', // Ain
    'غ': '\u063A', // Ghain
    'ف': '\u0641', // Feh
    'ق': '\u0642', // Qaf
    'ك': '\u0643', // Kaf
    'ل': '\u0644', // Lam
    'م': '\u0645', // Meem
    'ن': '\u0646', // Noon
    'ه': '\u0647', // Heh
    'و': '\u0648', // Waw
    'ي': '\u064A', // Yeh
    'ة': '\u0629', // Teh Marbuta
    'ى': '\u0649', // Alif Maksura
    'ء': '\u0621', // Hamza
    'آ': '\u0622', // Alif with Madda
    'أ': '\u0623', // Alif with Hamza above
    'إ': '\u0625', // Alif with Hamza below
    'ؤ': '\u0624', // Waw with Hamza
    'ئ': '\u0626', // Yeh with Hamza
  };
  
  // Enhanced Arabic text processing for better PDF display
  export const processArabicText = (text: string): string => {
    if (!containsArabic(text)) {
      return text;
    }
  
    // Normalize Arabic text
    let processed = text
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFKC'); // Unicode normalization
  
    // Apply character mapping for better rendering
    processed = processed
      .split('')
      .map(char => ARABIC_CHAR_MAP[char] || char)
      .join('');
  
    return processed;
  };
  
  // Reverse text for RTL display in PDF (jsPDF specific)
  export const reverseArabicForPDF = (text: string): string => {
    if (!containsArabic(text)) {
      return text;
    }
  
    // Split by words and reverse for RTL display
    const words = text.split(' ');
    return words.reverse().join(' ');
  };
  
  // Format Arabic numbers (convert to Arabic-Indic if needed)
  export const formatArabicNumbers = (
    text: string,
    useArabicIndic: boolean = true
  ): string => {
    if (!useArabicIndic) {
      return text;
    }
  
    const arabicNumbers: { [key: string]: string } = {
      '0': '٠',
      '1': '١',
      '2': '٢',
      '3': '٣',
      '4': '٤',
      '5': '٥',
      '6': '٦',
      '7': '٧',
      '8': '٨',
      '9': '٩'
    };
  
    return text.replace(/[0-9]/g, (digit) => arabicNumbers[digit] || digit);
  };
  
  // Format currency in Arabic
  export const formatArabicCurrency = (
    amount: number,
    currency: string = 'OMR'
  ): string => {
    const currencySymbols: { [key: string]: string } = {
      OMR: 'ر.ع.',
      USD: '$',
      EUR: '€',
      SAR: 'ر.س.',
      AED: 'د.إ.',
      KWD: 'د.ك.',
      BHD: 'د.ب.',
      QAR: 'ر.ق.'
    };
  
    const symbol = currencySymbols[currency] || currency;
    const formattedAmount = amount.toLocaleString('ar', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    });
  
    return `${formattedAmount} ${symbol}`;
  };
  
  // Convert date to Arabic format
  export const formatArabicDate = (date: Date): string => {
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
  
    const day = date.getDate();
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
  
    return `${day} ${month} ${year}`;
  };
  
  // Convert time to Arabic format
  export const formatArabicTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
  
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'م' : 'ص'; // م for PM (مساءً), ص for AM (صباحاً)
  
    const formattedHour = formatArabicNumbers(hour12.toString().padStart(2, '0'));
    const formattedMinutes = formatArabicNumbers(minutes.toString().padStart(2, '0'));
  
    return `${formattedHour}:${formattedMinutes} ${ampm}`;
  };
  
  // Text alignment helper for Arabic
  export const getArabicTextAlign = (
    originalAlign: 'left' | 'center' | 'right'
  ): 'left' | 'center' | 'right' => {
    switch (originalAlign) {
      case 'left':
        return 'right';
      case 'right':
        return 'left';
      case 'center':
      default:
        return 'center';
    }
  };
  
  // Clean text for PDF display
  export const cleanTextForPDF = (text: string): string => {
    return text
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };
  
  // Truncate Arabic text properly
  export const truncateArabicText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
      return text;
    }
  
    if (containsArabic(text)) {
      // For Arabic text, truncate from the left side
      return '...' + text.slice(-(maxLength - 3));
    } else {
      // For English text, truncate from the right
      return text.slice(0, maxLength - 3) + '...';
    }
  };
  
  // Word wrap for Arabic text with proper handling
  export const wrapArabicText = (
    text: string,
    maxWidth: number,
    fontSize: number
  ): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
  
    // Approximate character width
    const charWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);
  
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
  
      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, force break it
          const truncated = truncateArabicText(word, maxCharsPerLine - 3);
          lines.push(truncated);
          currentLine = '';
        }
      }
    }
  
    if (currentLine) {
      lines.push(currentLine);
    }
  
    return lines;
  };
  
  // Status translations
  export const getArabicStatusTranslation = (status: string): string => {
    const statusTranslations: { [key: string]: string } = {
      // Order status
      pending: 'في الانتظار',
      preparing: 'قيد التحضير',
      ready: 'جاهز',
      completed: 'مكتمل',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
      
      // Delivery type
      pickup: 'استلام',
      delivery: 'توصيل',
      
      // Payment type
      cash: 'نقدي',
      atm: 'بطاقة',
      transfer: 'تحويل',
      card: 'بطاقة',
      
      // Common terms
      na: 'غير محدد',
      yes: 'نعم',
      no: 'لا'
    };
  
    return statusTranslations[status.toLowerCase()] || status;
  };
  
  // Check if string is mixed (Arabic + English/Numbers)
  export const isMixedContent = (text: string): boolean => {
    const hasArabic = containsArabic(text);
    const hasLatin = /[a-zA-Z0-9]/.test(text);
    return hasArabic && hasLatin;
  };
  
  // Handle mixed content properly for PDF
  export const processMixedContent = (text: string): string => {
    if (!isMixedContent(text)) {
      return containsArabic(text) ? processArabicText(text) : text;
    }
  
    // Split by spaces and process each part
    const parts = text.split(' ');
    const processedParts = parts.map(part => {
      if (containsArabic(part)) {
        return processArabicText(part);
      }
      return part;
    });
  
    // For mixed content, maintain the original order but process Arabic parts
    return processedParts.join(' ');
  };
  
  // Get font family recommendation based on text content
  export const getRecommendedFont = (text: string): {
    fontFamily: string;
    isArabic: boolean;
  } => {
    const isArabicText = containsArabic(text);
    
    if (isArabicText) {
      return {
        fontFamily: 'Amiri', // Fallback to courier if Amiri not available
        isArabic: true
      };
    }
    
    return {
      fontFamily: 'helvetica',
      isArabic: false
    };
  };
  
  // Enhanced text direction detection
  export const getTextDirectionAdvanced = (text: string): {
    direction: 'ltr' | 'rtl';
    alignment: 'left' | 'right' | 'center';
  } => {
    const isArabicText = containsArabic(text);
    
    return {
      direction: isArabicText ? 'rtl' : 'ltr',
      alignment: isArabicText ? 'right' : 'left'
    };
  };
  
  // Utility to prepare text for jsPDF rendering
  export const prepareTextForJsPDF = (text: string, options: {
    reverseForRTL?: boolean;
    processArabic?: boolean;
    cleanText?: boolean;
  } = {}): string => {
    const {
      reverseForRTL = true,
      processArabic = true,
      cleanText = true
    } = options;
  
    let processedText = text;
  
    // Clean text first
    if (cleanText) {
      processedText = cleanTextForPDF(processedText);
    }
  
    // Process Arabic characters
    if (processArabic && containsArabic(processedText)) {
      processedText = processArabicText(processedText);
      
      // Reverse for RTL display in jsPDF
      if (reverseForRTL) {
        processedText = reverseArabicForPDF(processedText);
      }
    }
  
    return processedText;
  };
  
  // Default export with all utilities
  export default {
    containsArabic,
    getTextDirection,
    processArabicText,
    reverseArabicForPDF,
    formatArabicNumbers,
    formatArabicCurrency,
    formatArabicDate,
    formatArabicTime,
    getArabicTextAlign,
    cleanTextForPDF,
    truncateArabicText,
    wrapArabicText,
    getArabicStatusTranslation,
    isMixedContent,
    processMixedContent,
    getRecommendedFont,
    getTextDirectionAdvanced,
    prepareTextForJsPDF
  };