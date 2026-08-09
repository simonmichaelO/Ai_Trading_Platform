/**
 * Login Page
 * 
 * Email + password login form.
 * Redirects authenticated users to dashboard automatically.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login, isAuthenticating, error, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // If already authenticated, don't show the form
  if (isAuthenticated) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in">
        <p className="text-muted-foreground">Already logged in. Redirecting...</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(email, password);
  }

  return (
    <div className="glass rounded-xl p-8 animate-fade-in">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your trading account
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="trader@example.com"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            minLength={6}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isAuthenticating}
          className={cn(
            'w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all',
            'hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isAuthenticating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing in...
            </span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
