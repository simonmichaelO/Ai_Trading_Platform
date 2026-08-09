/**
 * Root Page — Redirect to Dashboard or Login
 * 
 * If user is authenticated, redirect to dashboard.
 * If not, redirect to login.
 * 
 * This replaces the Phase 1 landing page.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state

    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading while determining auth state
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-subtle">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}
