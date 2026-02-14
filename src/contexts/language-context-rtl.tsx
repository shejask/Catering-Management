'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary (same as before)
const translations = {
  en: {
    // All English translations...
    'language.english': 'English',
    'language.arabic': 'Arabic',
    'page.createOrder': 'Create Order',
    'page.allOrders': 'All Orders',
    'page.kitchenOrders': 'Kitchen Orders',
    'cook.activeOrders': 'Active Orders',
    'cook.noOrders': 'No Orders in Kitchen',
    'cook.noOrdersDescription': 'Orders shared with the kitchen will appear here.',
    'cook.orderDetails': 'Order Details:',
    'cook.cookStatus': 'Cook Status:',
    'cook.markCompleted': 'Mark Completed',
    'action.refresh': 'Refresh',
    'action.exportCSV': 'Export CSV',
    'status.pending': 'Pending',
    'status.completed': 'Completed',
    'message.loading': 'Loading orders...',
    'message.fetchError': 'Failed to fetch orders',
    'message.updateError': 'Failed to update order',
    'message.cookStatusUpdated': 'Cook status updated to {status}',
    // Add more translations as needed...
  },
  ar: {
    // All Arabic translations...
    'language.english': 'الإنجليزية',
    'language.arabic': 'العربية',
    'page.createOrder': 'إنشاء طلب',
    'page.allOrders': 'جميع الطلبات',
    'page.kitchenOrders': 'طلبات المطبخ',
    'cook.activeOrders': 'طلبات نشطة',
    'cook.noOrders': 'لا توجد طلبات في المطبخ',
    'cook.noOrdersDescription': 'الطلبات المشتركة مع المطبخ ستظهر هنا.',
    'cook.orderDetails': 'تفاصيل الطلب:',
    'cook.cookStatus': 'حالة المطبخ:',
    'cook.markCompleted': 'تحديد كمكتمل',
    'action.refresh': 'تحديث',
    'action.exportCSV': 'تصدير CSV',
    'status.pending': 'في الانتظار',
    'status.completed': 'مكتمل',
    'message.loading': 'جاري التحميل...',
    'message.fetchError': 'فشل في ��لب الطلبات',
    'message.updateError': 'فشل في تحديث الطلب',
    'message.cookStatusUpdated': 'تم تحديث حالة المطبخ إلى {status}',
    // Add more translations as needed...
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage and set RTL direction
  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    
    // Add/remove RTL class to body
    if (language === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}