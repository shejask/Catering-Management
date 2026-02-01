import React from 'react';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';

import { ModeToggle } from './ThemeToggle/theme-toggle';
import { LanguageSwitcher } from '../language-switcher';
import { ThemeSelector } from '../theme-selector';

export default function Header() {
  return (
    <header className='flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
      <div className='flex items-center gap-2 px-2 sm:px-4'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        {/* <Breadcrumbs /> */}
      </div>

      <div className='flex items-center gap-1 sm:gap-2 px-2 sm:px-4'>
        <ThemeSelector />
        <LanguageSwitcher />
        {/* <UserNav /> */}
        <ModeToggle />
      </div>
    </header>
  );
}
