'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/language-context';
import { IconLanguage, IconCheck } from '@tabler/icons-react';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className='flex flex-col gap-1'>
     
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 px-3 gap-2'>
            <IconLanguage className='h-4 w-4' />
            <span className='text-sm font-medium'>
              {language === 'en' ? 'English' : 'العربية'}
            </span>
            <span className='sr-only'>Switch language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-40'>
          <DropdownMenuItem
            onClick={() => setLanguage('en')}
            className='flex items-center justify-between'
          >
            <span>{t('language.english')}</span>
            {language === 'en' && <IconCheck className='h-4 w-4' />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setLanguage('ar')}
            className='flex items-center justify-between'
          >
            <span>{t('language.arabic')}</span>
            {language === 'ar' && <IconCheck className='h-4 w-4' />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
