/**
 * Global Providers
 * 
 * Wraps the application with all required context providers:
 * - React Query (data fetching & caching)
 * 
 * Add more providers here as the app grows:
 * - Theme provider (light/dark toggle)
 * - Auth provider
 * - Toast/notification provider
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from './Toast';

/**
 * Create a fresh QueryClient for each request (SSR-safe).
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Don't refetch on window focus during development
        refetchOnWindowFocus: false,
        // Retry failed requests once
        retry: 1,
        // Cache data for 5 minutes
        staleTime: 5 * 60 * 1000,
      },
    },
  });
}

// Singleton for client-side navigation (avoid recreating on every render)
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create a new client
    return makeQueryClient();
  } else {
    // Browser: reuse the same client
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = useState(getQueryClient)[0];

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryClientProvider>
  );
}
