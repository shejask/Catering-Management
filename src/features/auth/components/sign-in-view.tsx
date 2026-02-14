'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const formSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.string().min(1, 'Role is required'),
});

type FormData = z.infer<typeof formSchema>;

// Static admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin'
};

const AUTH_STORAGE_KEY = 'auth_token';
const AUTH_EXPIRY_DAYS = 30;

export default function SignInViewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      role: '',
    },
  });

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem(AUTH_STORAGE_KEY);
      if (authData) {
        try {
          const { timestamp, role } = JSON.parse(authData);
          const now = new Date().getTime();
          const expiryTime = timestamp + (AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
          
          if (now < expiryTime) {
            // User is still authenticated, redirect to appropriate dashboard
            const dashboardPath = getDashboardPath(role);
            router.push(dashboardPath);
            return;
          } else {
            // Token expired, remove it
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } catch (error) {
          // Invalid token format, remove it
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    };

    checkAuth();
  }, [router]);

  const getDashboardPath = (role: string) => {
    switch (role) {
      case 'receptionist':
        return '/dashboard/receptionist/overview';
      case 'kitchen':
        return '/dashboard/cook';
      case 'manager':
        return '/dashboard/manager';
      case 'financial':
        return '/dashboard/manager';
      default:
        return '/auth/sign-in';
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      
      if (data.username === ADMIN_CREDENTIALS.username && data.password === ADMIN_CREDENTIALS.password) {
        // Store authentication token with timestamp and role
        const authData = {
          username: data.username,
          role: data.role,
          timestamp: new Date().getTime(),
          isAuthenticated: true
        };
        
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        
        // Also set cookie for middleware
        document.cookie = `auth_token=${JSON.stringify(authData)}; path=/; max-age=${AUTH_EXPIRY_DAYS * 24 * 60 * 60}`;
        
        toast.success('Login successful!');
        
        // Redirect based on role
        const dashboardPath = getDashboardPath(data.role);
        router.push(dashboardPath);
      } else {
        toast.error('Invalid username or password');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div 
          className='absolute inset-0 bg-cover bg-center bg-no-repeat'
          style={{
            backgroundImage: 'url(/assets/images/side-bg.webp)'
          }}
        />
        <div className='absolute inset-0 bg-black/40' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <span className='text-2xl font-bold w-full text-right' dir='rtl'>بيت المكارم الشاملة للتجارة والمقاولات</span>
        </div>
        <div className='relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
          
            <footer className='text-sm'>Admin User</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          {/* Login Form */}
          <Card className='w-full'>
            <CardHeader className='space-y-1'>
              <CardTitle className='text-2xl text-center'>Sign in</CardTitle>
              <CardDescription className='text-center'>
                Please log in to access your dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
                  <FormField
                    control={form.control}
                    name='username'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Enter username'
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type='password'
                            placeholder='Enter password'
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='role'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="receptionist">Receptionist</SelectItem>
                            <SelectItem value="kitchen">Kitchen</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="financial">Financial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type='submit' className='w-full' disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
