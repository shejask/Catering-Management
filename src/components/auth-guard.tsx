'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('auth_token');
      
      if (authData) {
        try {
          const { timestamp, isAuthenticated: authFlag } = JSON.parse(authData);
          const now = new Date().getTime();
          const expiryTime = timestamp + (30 * 24 * 60 * 60 * 1000); // 30 days
          
          if (now < expiryTime && authFlag) {
            // User is still authenticated
            setIsAuthenticated(true);
          } else {
            // Token expired or invalid, remove it and redirect
            localStorage.removeItem('auth_token');
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            router.push('/auth/sign-in');
          }
        } catch (error) {
          // Invalid token format, remove it and redirect
          localStorage.removeItem('auth_token');
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          router.push('/auth/sign-in');
        }
      } else {
        // No auth token found, redirect to sign-in
        router.push('/auth/sign-in');
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

