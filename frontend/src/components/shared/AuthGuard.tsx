/**
 * AuthGuard Component
 * 
 * Protects routes from unauthenticated users.
 * 
 * Behavior:
 *   - Loading: shows a loading spinner (determining auth state)
 *   - Not authenticated: redirects to /login
 *   - Authenticated: renders children (the protected content)
 * 
 * Usage:
 *   <AuthGuard>
 *     <DashboardContent />
 *   </AuthGuard>
 * 
 * Or as a layout wrapper (see dashboard layout).
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Optional: redirect to a different path instead of /login */
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after we've determined auth state
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  // Loading state — determining if user is authenticated
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — useEffect will redirect, but show nothing while it happens
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Authenticated — render the protected content
  return <>{children}</>;
}
