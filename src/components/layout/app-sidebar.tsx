'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { getNavItems } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import {
  IconChevronRight,
  IconLogout
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen } = useMediaQuery();
  const [userRole, setUserRole] = React.useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Check authentication and get user role from localStorage
    const checkAuth = () => {
      const authData = localStorage.getItem('auth_token');
      if (authData) {
        try {
          const { role, timestamp, isAuthenticated: authFlag } = JSON.parse(authData);
          const now = new Date().getTime();
          const expiryTime = timestamp + (30 * 24 * 60 * 60 * 1000); // 30 days
          
          if (now < expiryTime && authFlag) {
            // User is still authenticated
            setUserRole(role);
            setIsAuthenticated(true);
          } else {
            // Token expired or invalid, remove it and redirect
            localStorage.removeItem('auth_token');
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            setIsAuthenticated(false);
            router.push('/auth/sign-in');
          }
        } catch (error) {
          // Invalid token format, remove it and redirect
          localStorage.removeItem('auth_token');
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          setIsAuthenticated(false);
          router.push('/auth/sign-in');
        }
      } else {
        // No auth token found, redirect to sign-in
        setIsAuthenticated(false);
        router.push('/auth/sign-in');
      }
    };

    checkAuth();
  }, [router]);

  // Get navigation items based on user role
  const navItems = getNavItems(userRole);

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  // Show loading or nothing if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <div className='flex items-center gap-2 px-2 py-2'>
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
            <Icons.logo className='size-4' />
          </div>
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-semibold'>Almakarem Kitchen</span>
            <span className='truncate text-xs'>Management System</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Kitchen Management</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className='flex items-center gap-2 px-2 py-2'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground'>
                  U
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>
                    {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User'}
                  </span>
                  <span className='truncate text-xs'>
                    {userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'Staff'}
                  </span>
                </div>
                <button 
                  className='flex items-center justify-center rounded-md p-1 hover:bg-sidebar-accent'
                  onClick={() => {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/auth/sign-in';
                  }}
                >
                  <IconLogout className='size-4' />
                </button>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}