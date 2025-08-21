'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import MainLoading from '@/components/MainLoading';

export default function HomePage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user, redirect to signin
        router.push('/signin');
      } else if (user && userRole) {
        // User exists and role is loaded, redirect based on role
        if (userRole.role === 'Admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
      // If user exists but userRole is still loading, wait for it
    }
  }, [user, userRole, loading, router]);

  if (loading) {
    return <MainLoading message="Loading CADeala..." />;
  }

  // Show loading while redirecting
  return <MainLoading message="Redirecting..." />;
}
