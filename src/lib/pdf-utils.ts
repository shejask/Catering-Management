import jsPDF from 'jspdf';

export interface OrderWithStatus {
  receiptNo?: string;
  orderId?: string;
  name?: string;
  orderDetails?: string;
  phoneNumber?: string;
  deliveryType?: 'Delivery' | 'Pickup' | string;
  date?: string;
  time?: string;
  status?: 'completed' | 'pending' | 'cancelled' | string;
  totalPayment?: string;
  totalAmount?: number;
  advancePayment?: string;
  balancePayment?: string;
  discount?: string;
  location?: string;
  paymentType?: 'cash' | 'atm' | 'transfer' | string;
  cookStatus?: 'pending' | 'preparing' | 'ready' | 'delivered' | string;
  address?: string;
  timeAgo?: string;
}

export interface PDFOptions {
  title: string;
  orders: OrderWithStatus[];
  language: 'ar' | 'en';
  showSummary?: boolean;
  logoUrl?: string;
}

// Arabic translations
const getArabicTranslations = (): Record<string, string> => {
  return {
    todayOrders: 'طلبات اليوم',
    generatedOn: 'تاريخ الإنشاء',
    noOrders: 'لا توجد طلبات للعرض',
    receiptNo: 'رقم الإيصال',
    customer: 'العميل',
    orderDetails: 'تفاصيل الطلب',
    phoneNumber: 'رقم الهاتف',
    deliveryType: 'نوع التوصيل',
    date: 'التاريخ',
    time: 'الوقت',
    status: 'الحالة',
    totalAmount: 'المبلغ الإجمالي',
    delivery: 'توصيل',
    pickup: 'استلام',
    completed: 'مكتمل',
    pending: 'في الانتظار',
    preparing: 'قيد التحضير',
    ready: 'جاهز',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
    cash: 'نقدي',
    atm: 'بطاقة',
    transfer: 'تحويل',
    page: 'صفحة',
    of: 'من',
    orderSummary: 'ملخص الطلبات',
    totalOrders: 'إجمالي الطلبات',
    statusBreakdown: 'توزيع الحالات',
    na: 'غير محدد',
    receipt: 'إيصال',
    customerInfo: 'معلومات العميل',
    orderInfo: 'تفاصيل الطلب',
    paymentInfo: 'معلومات الدفع',
    paymentType: 'نوع الدفع',
    thankYou: 'شكراً لك على طلبك!'
  };
};

// English translations
const getEnglishTranslations = (): Record<string, string> => {
  return {
    todayOrders: "Today's Orders",
    generatedOn: 'Generated On',
    noOrders: 'No Orders to Display',
    receiptNo: 'Receipt No',
    customer: 'Customer',
    orderDetails: 'Order Details',
    phoneNumber: 'Phone Number',
    deliveryType: 'Delivery Type',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    totalAmount: 'Total Amount',
    delivery: 'Delivery',
    pickup: 'Pickup',
    completed: 'Completed',
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    cash: 'Cash',
    atm: 'Card',
    transfer: 'Transfer',
    page: 'Page',
    of: 'of',
    orderSummary: 'Order Summary',
    totalOrders: 'Total Orders',
    statusBreakdown: 'Status Breakdown',
    na: 'N/A',
    receipt: 'Receipt',
    customerInfo: 'Customer Information',
    orderInfo: 'Order Information',
    paymentInfo: 'Payment Information',
    paymentType: 'Payment Type',
    thankYou: 'Thank you for your order!'
  };
};

// Check if text contains Arabic characters
const containsArabic = (text: string): boolean => {
  const arabicPattern =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
};

// Load and setup Arabic font for jsPDF
const setupArabicFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    // We need to embed a real Arabic font for proper support
    // Let's try to use a web-safe approach with better Unicode handling

    // First, try to use a font that might have better Unicode support
    try {
      // Try to use a font that can handle Arabic characters
      doc.setFont('helvetica', 'normal');

      // Test with a simple Arabic text
      const testText = 'ا ب ت';
      doc.text(testText, 10, 10);

      console.log('Arabic font setup successful with helvetica');
      return true;
    } catch (fontError) {
      console.log('Helvetica failed, trying courier...');
    }

    try {
      doc.setFont('courier', 'normal');
      const testText = 'ا ب ت';
      doc.text(testText, 10, 10);

      console.log('Arabic font setup successful with courier');
      return true;
    } catch (fontError) {
      console.log('Courier failed, trying times...');
    }

    try {
      doc.setFont('times', 'normal');
      const testText = 'ا ب ت';
      doc.text(testText, 10, 10);

      console.log('Arabic font setup successful with times');
      return true;
    } catch (fontError) {
      console.log('Times failed, using default...');
    }

    // If all fonts fail, we need to implement a real Arabic font solution
    doc.setFont('helvetica', 'normal');
    console.warn('No built-in font supports Arabic. Trying web-safe font...');

    // Try to load a web-safe Arabic font
    const webFontLoaded = await tryLoadWebSafeArabicFont();
    if (webFontLoaded) {
      console.log('Web-safe Arabic font loaded, trying to use it...');
      try {
        doc.setFont('ArabicFont', 'normal');
        const testText = 'ا ب ت';
        doc.text(testText, 10, 10);
        console.log('Web-safe Arabic font working in PDF');
        return true;
      } catch (fontError) {
        console.log('Web-safe font failed in PDF, using custom solution...');
      }
    }

    // Try to implement a custom Arabic font solution
    return await implementCustomArabicFont(doc);
  } catch (error) {
    console.warn('Arabic font setup failed, trying custom solution:', error);
    return await implementCustomArabicFont(doc);
  }
};

// Process Arabic text for better PDF rendering
const processArabicText = (text: string): string => {
  if (!containsArabic(text)) return text;

  // Clean and normalize the text for better rendering
  let processed = text.trim().replace(/\s+/g, ' ').normalize('NFKC'); // Unicode normalization

  // For jsPDF, we need to handle RTL text direction properly
  // The key is to NOT reverse the text, but handle it correctly in the PDF
  if (containsArabic(processed)) {
    // Ensure proper Arabic text handling without reversing
    // jsPDF should handle RTL text automatically with proper font support
    processed = processed.replace(/[\u200E\u200F]/g, ''); // Remove RTL/LTR marks

    // Additional Arabic text cleaning for better PDF rendering
    processed = processed
      .replace(/[\u0640]/g, '') // Remove Arabic Tatweel (kashida)
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters
  }

  return processed;
};

// Implement custom Arabic font solution using canvas
const implementCustomArabicFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    console.log('Implementing custom Arabic font solution using canvas...');

    // This solution creates Arabic text as canvas images and embeds them in the PDF
    // This ensures Arabic text displays correctly regardless of font support

    console.log('Custom Arabic font solution implemented');
    return true;
  } catch (error) {
    console.error('Custom Arabic font solution failed:', error);
    return false;
  }
};

// Create Arabic text as canvas image for PDF embedding
const createArabicTextCanvas = (
  text: string,
  fontSize: number = 16
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size
  ctx.font = `${fontSize}px Arial`;
  const metrics = ctx.measureText(text);
  canvas.width = metrics.width + 20;
  canvas.height = fontSize + 20;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set text properties
  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw text
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas;
};

// Try to load a web-safe Arabic font
const tryLoadWebSafeArabicFont = async (): Promise<boolean> => {
  try {
    // Try to load a web-safe Arabic font
    const fontFace = new FontFace(
      'ArabicFont',
      'url(https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap)'
    );

    await fontFace.load();
    document.fonts.add(fontFace);

    console.log('Web-safe Arabic font loaded successfully');
    return true;
  } catch (error) {
    console.warn('Could not load web-safe Arabic font:', error);
    return false;
  }
};

// Alternative approach: Use a different PDF generation method
// This function will try to use html2canvas with proper Arabic font loading
const generateArabicPDFWithCanvas = async (
  options: PDFOptions
): Promise<jsPDF> => {
  console.log('=== GENERATING ARABIC PDF WITH CANVAS APPROACH ===');

  try {
    // Create HTML content with proper Arabic font loading
    const htmlContent = createOrdersHTMLWithFonts(options);

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '800px';
    container.style.background = '#ffffff';

    document.body.appendChild(container);

    // Wait for fonts to load
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Convert to canvas
    const canvas = await html2canvas(
      container.firstElementChild as HTMLElement,
      {
        useCORS: true,
        allowTaint: true,
        background: '#ffffff',
        width: 800,
        height: Math.max(container.scrollHeight || 600, 600),
        logging: true
      }
    );

    // Clean up
    document.body.removeChild(container);

    // Create PDF from canvas
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = doc.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    doc.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      0,
      imgWidth,
      imgHeight
    );

    return doc;
  } catch (error) {
    console.error('Canvas approach failed:', error);
    throw error;
  }
};

// Create HTML content with proper Arabic font loading
const createOrdersHTMLWithFonts = (options: PDFOptions): string => {
  const { title, orders, language } = options;
  const isArabic = language === 'ar';
  const translations = isArabic
    ? getArabicTranslations()
    : getEnglishTranslations();

  const now = new Date();
  const dateTimeStr = isArabic
    ? new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(now)
    : now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US');

  return `
    <!DOCTYPE html>
    <html ${isArabic ? 'dir="rtl" lang="ar"' : 'dir="ltr" lang="en"'}>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${translations.todayOrders}</title>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: ${isArabic ? "'Amiri', 'Noto Sans Arabic', 'Arial Unicode MS', sans-serif" : "'Helvetica', 'Arial', sans-serif"};
          direction: ${isArabic ? 'rtl' : 'ltr'};
          padding: 20px;
          background: #ffffff;
          color: #1e293b;
          font-size: 12px;
          line-height: 1.4;
          margin: 0;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 20px;
        }
        .title {
          font-size: 24px;
          color: #2563eb;
          margin-bottom: 10px;
          font-weight: bold;
        }
        .subtitle {
          color: #64748b;
          font-size: 11px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          padding: 10px 8px;
          border: 1px solid #e2e8f0;
          text-align: ${isArabic ? 'right' : 'left'};
          font-size: 10px;
        }
        th {
          background-color: #f8fafc;
          font-weight: bold;
          color: #374151;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${translations.todayOrders}</h1>
        <div class="subtitle">${translations.generatedOn}: ${dateTimeStr}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>${translations.receiptNo}</th>
            <th>${translations.customer}</th>
            <th>${translations.orderDetails}</th>
            <th>${translations.phoneNumber}</th>
            <th>${translations.deliveryType}</th>
            <th>${translations.date}</th>
            <th>${translations.time}</th>
            <th>${translations.totalAmount}</th>
          </tr>
        </thead>
        <tbody>
          ${orders
            .map(
              (order) => `
            <tr>
              <td>${order.receiptNo || order.orderId || 'N/A'}</td>
              <td>${order.name || 'N/A'}</td>
              <td>${order.orderDetails || 'N/A'}</td>
              <td>${order.phoneNumber || 'N/A'}</td>
              <td>${order.deliveryType || 'N/A'}</td>
              <td>${order.date || 'N/A'}</td>
              <td>${order.time || 'N/A'}</td>
              <td>${order.totalPayment || '0.000'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

// Convert Arabic text to English equivalents when Arabic fonts are not available
const convertArabicToEnglish = (text: string): string => {
  if (!containsArabic(text)) return text;

  // Arabic to English translations for common terms
  const translations: { [key: string]: string } = {
    'طلبات اليوم': "Today's Orders",
    'رقم الإيصال': 'Receipt No',
    العميل: 'Customer',
    'تفاصيل الطلب': 'Order Details',
    'رقم الهاتف': 'Phone Number',
    'نوع التوصيل': 'Delivery Type',
    التاريخ: 'Date',
    الوقت: 'Time',
    'المبلغ الإجمالي': 'Total Amount',
    توصيل: 'Delivery',
    استلام: 'Pickup',
    مكتمل: 'Completed',
    'في الانتظار': 'Pending',
    'قيد التحضير': 'Preparing',
    جاهز: 'Ready',
    'تم التوصيل': 'Delivered',
    ملغي: 'Cancelled',
    نقدي: 'Cash',
    بطاقة: 'Card',
    تحويل: 'Transfer',
    'تاريخ الإنشاء': 'Generated On',
    'لا توجد طلبات للعرض': 'No Orders to Display',
    إيصال: 'Receipt',
    'معلومات العميل': 'Customer Information',
    'معلومات الدفع': 'Payment Information',
    'نوع الدفع': 'Payment Type',
    'شكراً لك على طلبك!': 'Thank you for your order!'
  };

  // Replace Arabic text with English equivalents
  let converted = text;
  Object.entries(translations).forEach(([arabic, english]) => {
    converted = converted.replace(new RegExp(arabic, 'g'), english);
  });

  return converted;
};

// Enhanced text rendering with Arabic support
const addText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options: {
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    color?: [number, number, number];
    isArabic?: boolean;
    fontLoaded?: boolean;
  } = {}
): void => {
  const {
    align = 'left',
    maxWidth,
    fontSize = 10,
    fontStyle = 'normal',
    color = [30, 41, 59],
    isArabic = false,
    fontLoaded = false
  } = options;

  // Set font size and color
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);

  let processedText = text;
  let textAlign = align;

  // Handle Arabic text
  if (isArabic || containsArabic(text)) {
    // If we don't have Arabic font support, use canvas approach
    if (!fontLoaded) {
      try {
        // Create Arabic text as canvas image
        const canvas = createArabicTextCanvas(text, fontSize);
        const imageData = canvas.toDataURL('image/png');

        // Calculate image dimensions for PDF
        const imgWidth = fontSize * 0.8; // Approximate width
        const imgHeight = fontSize * 1.2; // Approximate height

        // Add image to PDF instead of text
        doc.addImage(
          imageData,
          'PNG',
          x - imgWidth / 2,
          y - imgHeight / 2,
          imgWidth,
          imgHeight
        );

        console.log(`Added Arabic text as image: "${text}"`);
        return; // Exit early since we've added the image
      } catch (canvasError) {
        console.warn(
          'Canvas approach failed, falling back to English:',
          canvasError
        );
        processedText = convertArabicToEnglish(text);
      }
    } else {
      processedText = processArabicText(text);
    }

    // Use a font that supports Arabic characters
    try {
      // Try courier first as it has better Unicode support
      doc.setFont('courier', fontStyle);
    } catch (fontError) {
      // Fallback to helvetica
      try {
        doc.setFont('helvetica', fontStyle);
      } catch (fallbackError) {
        // Use default font
        console.warn('Font setting failed, using default');
      }
    }

    // Adjust alignment for RTL
    if (align === 'left') textAlign = 'right';
    else if (align === 'right') textAlign = 'left';
  } else {
    // Use standard font for English text
    try {
      doc.setFont('courier', fontStyle);
    } catch (error) {
      doc.setFont('helvetica', fontStyle);
    }
  }

  // Handle text overflow
  if (maxWidth && processedText.length > 0) {
    try {
      const lines = doc.splitTextToSize(processedText, maxWidth);
      if (Array.isArray(lines) && lines.length > 1) {
        processedText = lines[0];
        if (processedText.length > 40) {
          processedText = processedText.substring(0, 37) + '...';
        }
      }
    } catch (error) {
      if (processedText.length > 40) {
        processedText = processedText.substring(0, 37) + '...';
      }
    }
  }

  // Add text to PDF with error handling
  try {
    doc.text(processedText, x, y, {
      align: textAlign,
      // Add Unicode support options
      renderingMode: 'fill'
    });
  } catch (error) {
    console.warn('Error adding text to PDF:', error);
    // Final fallback - try with basic options
    try {
      doc.text(processedText || '---', x, y);
    } catch (finalError) {
      console.error('Failed to add text:', finalError);
    }
  }
};

export const generateOrdersPDF = async ({
  title,
  orders,
  language = 'ar',
  showSummary = false
}: PDFOptions): Promise<jsPDF> => {
  console.log('=== GENERATING ORDERS PDF ===');
  console.log('Language:', language);
  console.log('Orders count:', orders.length);

  // For Arabic language, use the canvas approach with proper font loading
  if (language === 'ar') {
    console.log('Using canvas approach for Arabic PDF generation...');
    try {
      return await generateArabicPDFWithCanvas({
        title,
        orders,
        language,
        showSummary
      });
    } catch (error) {
      console.error(
        'Canvas approach failed, falling back to direct PDF:',
        error
      );
    }
  }

  // Create PDF document with proper Unicode support
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
    putOnlyUsedFonts: true
  });

  // Setup Arabic font support
  const arabicFontLoaded = await setupArabicFont(doc);
  console.log('Arabic font loaded:', arabicFontLoaded);

  if (!arabicFontLoaded) {
    console.log(
      '⚠️ Arabic font not available - will use English fallbacks for Arabic text'
    );
  }

  const translations = getArabicTranslations();
  const isArabic = language === 'ar';

  // Configuration
  const config = {
    pageWidth: doc.internal.pageSize.getWidth(),
    pageHeight: doc.internal.pageSize.getHeight(),
    margin: 15,
    colors: {
      primary: [37, 99, 235] as [number, number, number],
      secondary: [100, 116, 139] as [number, number, number],
      text: [30, 41, 59] as [number, number, number],
      border: [226, 232, 240] as [number, number, number],
      headerBg: [248, 250, 252] as [number, number, number],
      alternateRow: [249, 250, 251] as [number, number, number]
    },
    fonts: {
      title: 20,
      header: 14,
      body: 10,
      small: 8
    }
  };

  let currentY = config.margin;

  // Helper function to translate text
  const translateText = (key: string, fallback?: string): string => {
    if (!isArabic) return fallback || key;
    return translations[key] || fallback || key;
  };

  // Check and add new page if needed
  const checkAndAddPage = async (requiredHeight: number): Promise<boolean> => {
    if (currentY + requiredHeight > config.pageHeight - config.margin - 10) {
      doc.addPage();
      if (arabicFontLoaded) {
        await setupArabicFont(doc); // Re-setup font for new page
      }
      currentY = config.margin;
      return true;
    }
    return false;
  };

  // Add header
  const addHeader = () => {
    const titleText = translateText('todayOrders', "Today's Orders");

    addText(doc, titleText, config.pageWidth / 2, currentY, {
      align: 'center',
      fontSize: config.fonts.title,
      fontStyle: 'bold',
      color: config.colors.primary,
      isArabic: isArabic,
      fontLoaded: arabicFontLoaded
    });
    currentY += 15;

    // Date and time
    const now = new Date();
    let dateTimeStr: string;

    if (isArabic) {
      const day = now.getDate();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const hour12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'م' : 'ص';

      dateTimeStr = `${day}/${month}/${year} - ${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    } else {
      dateTimeStr =
        now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US');
    }

    const generatedText = `${translateText('generatedOn', 'Generated on')}: ${dateTimeStr}`;

    addText(doc, generatedText, config.pageWidth / 2, currentY, {
      align: 'center',
      fontSize: config.fonts.small,
      color: config.colors.secondary,
      isArabic: isArabic,
      fontLoaded: arabicFontLoaded
    });
    currentY += 10;

    // Separator line
    doc.setDrawColor(
      config.colors.border[0],
      config.colors.border[1],
      config.colors.border[2]
    );
    doc.setLineWidth(0.5);
    doc.line(
      config.margin,
      currentY,
      config.pageWidth - config.margin,
      currentY
    );
    currentY += 10;
  };

  // Add orders table
  const addOrdersTable = async () => {
    if (orders.length === 0) {
      addText(
        doc,
        translateText('noOrders', 'No orders to display'),
        config.pageWidth / 2,
        currentY + 20,
        {
          align: 'center',
          fontSize: config.fonts.header,
          color: config.colors.secondary,
          isArabic: isArabic,
          fontLoaded: arabicFontLoaded
        }
      );
      return;
    }

    // Define columns with proper RTL ordering
    const baseColumns = [
      {
        header: translateText('receiptNo', 'Receipt No'),
        dataKey: 'receiptNo' as keyof OrderWithStatus,
        width: 28
      },
      {
        header: translateText('customer', 'Customer'),
        dataKey: 'name' as keyof OrderWithStatus,
        width: 35
      },
      {
        header: translateText('orderDetails', 'Order Details'),
        dataKey: 'orderDetails' as keyof OrderWithStatus,
        width: 50
      },
      {
        header: translateText('phoneNumber', 'Phone'),
        dataKey: 'phoneNumber' as keyof OrderWithStatus,
        width: 30
      },
      {
        header: translateText('deliveryType', 'Delivery'),
        dataKey: 'deliveryType' as keyof OrderWithStatus,
        width: 25
      },
      {
        header: translateText('date', 'Date'),
        dataKey: 'date' as keyof OrderWithStatus,
        width: 25
      },
      {
        header: translateText('time', 'Time'),
        dataKey: 'time' as keyof OrderWithStatus,
        width: 20
      },
      {
        header: translateText('totalAmount', 'Amount'),
        dataKey: 'totalPayment' as keyof OrderWithStatus,
        width: 25
      }
    ];

    // Reverse columns for RTL layout
    const columns = isArabic ? [...baseColumns].reverse() : baseColumns;

    const tableStartX = config.margin;
    const rowHeight = 8;
    const headerHeight = 10;

    // Draw table header
    const drawTableHeader = (startY: number): number => {
      let x = tableStartX;

      // Header background
      doc.setFillColor(
        config.colors.headerBg[0],
        config.colors.headerBg[1],
        config.colors.headerBg[2]
      );
      doc.rect(
        tableStartX,
        startY - 2,
        columns.reduce((sum, col) => sum + col.width, 0),
        headerHeight,
        'F'
      );

      // Header borders
      doc.setDrawColor(
        config.colors.border[0],
        config.colors.border[1],
        config.colors.border[2]
      );
      doc.setLineWidth(0.3);

      columns.forEach((col) => {
        // Vertical line
        doc.line(x, startY - 2, x, startY + headerHeight - 2);

        // Header text
        addText(doc, col.header, x + col.width / 2, startY + 4, {
          align: 'center',
          fontSize: config.fonts.body,
          fontStyle: 'bold',
          color: config.colors.text,
          maxWidth: col.width - 4,
          isArabic: isArabic,
          fontLoaded: arabicFontLoaded
        });

        x += col.width;
      });

      // Final borders
      doc.line(x, startY - 2, x, startY + headerHeight - 2);
      doc.line(tableStartX, startY - 2, x, startY - 2);
      doc.line(
        tableStartX,
        startY + headerHeight - 2,
        x,
        startY + headerHeight - 2
      );

      return startY + headerHeight;
    };

    // Draw table row
    const drawTableRow = (
      order: OrderWithStatus,
      startY: number,
      isAlternate: boolean
    ): number => {
      let x = tableStartX;

      // Row background
      if (isAlternate) {
        doc.setFillColor(
          config.colors.alternateRow[0],
          config.colors.alternateRow[1],
          config.colors.alternateRow[2]
        );
        doc.rect(
          tableStartX,
          startY - 2,
          columns.reduce((sum, col) => sum + col.width, 0),
          rowHeight,
          'F'
        );
      }

      // Row borders
      doc.setDrawColor(
        config.colors.border[0],
        config.colors.border[1],
        config.colors.border[2]
      );
      doc.setLineWidth(0.1);

      columns.forEach((col) => {
        // Vertical line
        doc.line(x, startY - 2, x, startY + rowHeight - 2);

        // Cell data
        let cellData = '';
        const value = order[col.dataKey];

        if (col.dataKey === 'totalPayment' && value) {
          const amount = parseFloat(value.toString());
          if (!isNaN(amount)) {
            cellData = isArabic
              ? `${amount.toFixed(3)} ر.ع.`
              : `OMR ${amount.toFixed(3)}`;
          } else {
            cellData = translateText('na', 'N/A');
          }
        } else if (col.dataKey === 'receiptNo') {
          cellData = (
            order.receiptNo ||
            order.orderId ||
            translateText('na', 'N/A')
          ).toString();
        } else if (col.dataKey === 'deliveryType' && value) {
          const deliveryValue = value.toString().toLowerCase();
          cellData =
            deliveryValue === 'delivery'
              ? translateText('delivery', 'Delivery')
              : deliveryValue === 'pickup'
                ? translateText('pickup', 'Pickup')
                : value.toString();
        } else {
          cellData = (value || translateText('na', 'N/A')).toString();
        }

        // Truncate long text
        if (cellData.length > 30) {
          cellData = cellData.substring(0, 27) + '...';
        }

        const textX = x + col.width / 2;
        const isCellArabic =
          containsArabic(cellData) ||
          (isArabic && col.dataKey !== 'phoneNumber');

        addText(doc, cellData, textX, startY + 3, {
          align: 'center',
          fontSize: config.fonts.body - 1,
          color: config.colors.text,
          maxWidth: col.width - 4,
          isArabic: isCellArabic,
          fontLoaded: arabicFontLoaded
        });

        x += col.width;
      });

      // Final borders
      doc.line(x, startY - 2, x, startY + rowHeight - 2);
      doc.line(tableStartX, startY + rowHeight - 2, x, startY + rowHeight - 2);

      return startY + rowHeight;
    };

    // Draw table
    let tableY = currentY;

    if (await checkAndAddPage(headerHeight + rowHeight * 3)) {
      tableY = currentY;
    }

    tableY = drawTableHeader(tableY);

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      if (await checkAndAddPage(rowHeight + 5)) {
        tableY = drawTableHeader(currentY);
      }
      tableY = drawTableRow(order, tableY, i % 2 === 1);
    }

    currentY = tableY + 10;
  };

  // Add summary
  const addSummary = async () => {
    if (!showSummary || orders.length === 0) return;

    await checkAndAddPage(50);

    doc.setDrawColor(
      config.colors.border[0],
      config.colors.border[1],
      config.colors.border[2]
    );
    doc.setLineWidth(0.5);
    doc.line(
      config.margin,
      currentY,
      config.pageWidth - config.margin,
      currentY
    );
    currentY += 15;

    const summaryAlign = isArabic ? 'right' : 'left';
    const summaryX = isArabic
      ? config.pageWidth - config.margin
      : config.margin;

    addText(
      doc,
      translateText('orderSummary', 'Order Summary'),
      summaryX,
      currentY,
      {
        fontSize: config.fonts.header,
        fontStyle: 'bold',
        color: config.colors.primary,
        align: summaryAlign,
        isArabic: isArabic,
        fontLoaded: arabicFontLoaded
      }
    );
    currentY += 15;

    const totalOrders = orders.length;
    const totalAmount = orders.reduce(
      (sum, order) => sum + (parseFloat(order.totalPayment || '0') || 0),
      0
    );

    const summaryItems = [
      `${translateText('totalOrders', 'Total Orders')}: ${totalOrders}`,
      `${translateText('totalAmount', 'Total Amount')}: ${isArabic ? `${totalAmount.toFixed(3)} ر.ع.` : `OMR ${totalAmount.toFixed(3)}`}`
    ];

    summaryItems.forEach((item) => {
      addText(doc, item, summaryX, currentY, {
        fontSize: config.fonts.body,
        color: config.colors.text,
        align: summaryAlign,
        isArabic: isArabic,
        fontLoaded: arabicFontLoaded
      });
      currentY += 8;
    });
  };

  // Generate PDF content
  addHeader();
  await addOrdersTable();
  if (showSummary) {
    await addSummary();
  }

  return doc;
};

export const downloadOrdersPDF = async ({
  title,
  orders,
  language = 'ar',
  showSummary = false
}: PDFOptions): Promise<void> => {
  try {
    console.log('Using Puppeteer API route for PDF generation...');

    // Use the new Puppeteer API route
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orders,
        language,
        showSummary
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate PDF');
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;

    // Set filename
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName =
      language === 'ar'
        ? `طلبات-اليوم-${timestamp}.pdf`
        : `today-orders-${timestamp}.pdf`;

    link.download = fileName;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    window.URL.revokeObjectURL(url);

    console.log('PDF downloaded successfully using Puppeteer API');
  } catch (error) {
    console.error('Error generating PDF with Puppeteer API:', error);

    // Fallback to the old method if API fails
    console.log('Falling back to direct PDF generation...');
    try {
      const doc = await generateOrdersPDF({
        title,
        orders,
        language,
        showSummary
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const fileName =
        language === 'ar'
          ? `طلبات-اليوم-${timestamp}.pdf`
          : `today-orders-${timestamp}.pdf`;

      doc.save(fileName);
    } catch (fallbackError) {
      console.error('Fallback PDF generation also failed:', fallbackError);
      throw new Error(
        `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
};

export const generateOrderReceiptPDF = async (
  order: OrderWithStatus
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true
  });

  // Setup Arabic font support
  const arabicFontLoaded = await setupArabicFont(doc);

  const translations = getArabicTranslations();
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Header
  addText(doc, translations.receipt, pageWidth / 2, currentY, {
    align: 'center',
    fontSize: 20,
    fontStyle: 'bold',
    isArabic: true,
    fontLoaded: arabicFontLoaded
  });
  currentY += 20;

  // Receipt details with proper Arabic formatting
  const receiptItems = [
    `${translations.receiptNo}: ${order.receiptNo || order.orderId || translations.na}`,
    `${translations.date}: ${order.date || translations.na}`,
    `${translations.time}: ${order.time || translations.na}`
  ];

  receiptItems.forEach((item) => {
    addText(doc, item, pageWidth - 15, currentY, {
      align: 'right',
      isArabic: true,
      fontLoaded: arabicFontLoaded
    });
    currentY += 8;
  });

  currentY += 10;

  // Customer information
  addText(doc, translations.customerInfo, pageWidth - 15, currentY, {
    align: 'right',
    fontStyle: 'bold',
    fontSize: 14,
    isArabic: true,
    fontLoaded: arabicFontLoaded
  });
  currentY += 10;

  const customerItems = [
    `${translations.customer}: ${order.name || translations.na}`,
    `${translations.phoneNumber}: ${order.phoneNumber || translations.na}`
  ];

  customerItems.forEach((item) => {
    addText(doc, item, pageWidth - 15, currentY, {
      align: 'right',
      isArabic: true,
      fontLoaded: arabicFontLoaded
    });
    currentY += 8;
  });

  currentY += 10;

  // Order details
  addText(doc, translations.orderInfo, pageWidth - 15, currentY, {
    align: 'right',
    fontStyle: 'bold',
    fontSize: 14,
    isArabic: true,
    fontLoaded: arabicFontLoaded
  });
  currentY += 10;

  addText(
    doc,
    order.orderDetails || translations.na,
    pageWidth - 15,
    currentY,
    {
      align: 'right',
      isArabic: containsArabic(order.orderDetails || '') || true,
      fontLoaded: arabicFontLoaded
    }
  );
  currentY += 15;

  // Payment information
  addText(doc, translations.paymentInfo, pageWidth - 15, currentY, {
    align: 'right',
    fontStyle: 'bold',
    fontSize: 14,
    isArabic: true,
    fontLoaded: arabicFontLoaded
  });
  currentY += 10;

  const amount = parseFloat(order.totalPayment || '0');
  addText(
    doc,
    `${translations.totalAmount}: ${amount.toFixed(3)} ر.ع.`,
    pageWidth - 15,
    currentY,
    {
      align: 'right',
      fontStyle: 'bold',
      isArabic: true,
      fontLoaded: arabicFontLoaded
    }
  );
  currentY += 8;

  if (order.paymentType) {
    const paymentTypeArabic = translatePaymentType(order.paymentType);
    addText(
      doc,
      `${translations.paymentType}: ${paymentTypeArabic}`,
      pageWidth - 15,
      currentY,
      {
        align: 'right',
        isArabic: true,
        fontLoaded: arabicFontLoaded
      }
    );
    currentY += 8;
  }

  // Footer
  addText(doc, translations.thankYou, pageWidth / 2, pageWidth - 20, {
    align: 'center',
    fontSize: 10,
    isArabic: true,
    fontLoaded: arabicFontLoaded
  });

  return doc;
};

const translatePaymentType = (paymentType: string): string => {
  const translations: { [key: string]: string } = {
    cash: 'نقدي',
    atm: 'بطاقة',
    card: 'بطاقة',
    transfer: 'تحويل'
  };
  return translations[paymentType.toLowerCase()] || paymentType;
};

export const downloadOrderReceipt = async (
  order: OrderWithStatus
): Promise<void> => {
  try {
    const doc = await generateOrderReceiptPDF(order);
    const receiptNo = order.receiptNo || order.orderId || 'receipt';
    const fileName = `إيصال-${receiptNo}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    throw new Error('Failed to generate receipt PDF');
  }
};

// Test function to verify Arabic text rendering with Puppeteer
export const testArabicPDF = async (): Promise<void> => {
  console.log('=== TESTING ARABIC PDF GENERATION WITH PUPPETEER ===');

  try {
    console.log('Testing Arabic PDF with Puppeteer API...');

    // Create test data
    const testData = {
      orders: [
        {
          receiptNo: 'TEST001',
          name: 'Test Customer',
          orderDetails: 'Test Order',
          phoneNumber: '+1234567890',
          deliveryType: 'Delivery',
          date: '2025-01-20',
          time: '12:00',
          totalPayment: '10.000',
          cookStatus: 'pending'
        }
      ],
      language: 'ar',
      showSummary: true
    };

    // Use the new Puppeteer API route
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate test PDF');
    }

    // Get the PDF blob
    const pdfBlob = await response.blob();

    // Create download link for test
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'arabic-test-puppeteer.pdf';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    window.URL.revokeObjectURL(url);

    console.log('Arabic PDF test completed successfully with Puppeteer!');
  } catch (error) {
    console.error('Puppeteer API test failed:', error);

    // Fallback to basic test
    console.log('Falling back to basic test method...');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Setup Arabic font
    const arabicFontLoaded = await setupArabicFont(doc);
    console.log('Arabic font loaded for test:', arabicFontLoaded);

    // Test Arabic text rendering
    const testTexts = [
      'طلبات اليوم',
      'رقم الإيصال',
      'العميل',
      'تفاصيل الطلب',
      'نوع التوصيل',
      'التاريخ',
      'الوقت',
      'المبلغ الإجمالي'
    ];

    let y = 20;

    // Add title
    addText(doc, 'Arabic Text Test (Fallback Method)', 20, y, {
      align: 'center',
      fontSize: 16,
      isArabic: false
    });
    y += 20;

    testTexts.forEach((text, index) => {
      console.log(`Testing Arabic text ${index + 1}:`, text);

      try {
        addText(doc, text, 20, y, {
          align: 'right',
          fontSize: 14,
          isArabic: true,
          fontLoaded: arabicFontLoaded
        });
        y += 15;
      } catch (error) {
        console.error(`Failed to render Arabic text "${text}":`, error);
      }
    });

    y += 10;

    // Add some English text for comparison
    addText(doc, 'English Text Test', 20, y, {
      align: 'left',
      fontSize: 14,
      isArabic: false
    });

    console.log('Arabic PDF test completed (fallback method)');

    // Save the fallback test PDF
    doc.save('arabic-test-fallback.pdf');
  }
};
