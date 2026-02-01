import AuthGuard from '@/components/auth-guard';
import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { LanguageProvider } from '@/contexts/language-context';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Almakarem Kitchen Dashboard',
  description: 'Kitchen Management System for Almakarem Restaurant'
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  return (
    <LanguageProvider>
      <AuthGuard>
        <KBar>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset className="h-screen">
              <Header />
              {/* page main content */}
              <div className="flex-1 overflow-auto mobile-scroll">
                {children}
              </div>
              {/* page main content ends */}
            </SidebarInset>
          </SidebarProvider>
        </KBar>
      </AuthGuard>
    </LanguageProvider>
  );
}
